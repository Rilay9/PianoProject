// The microphone as an input source (docs/05 §11, docs/01 §4.7).
//
// This is the backup for a piano with no usable MIDI out, and the design point
// is that it is *allowed to be wrong*: the engine is told a confidence with
// every event and paints anything uncertain amber. What this class owns is the
// plumbing — permission, device choice, the worklet's lifetime, and turning the
// worklet's AudioContext timestamps into the `performance.now()` timeline the
// rest of the app runs on. All the judgement lives in `detector.ts`.
//
// The constraints on `getUserMedia` are not negotiable and are the single most
// important line in the file: echo cancellation, noise suppression and
// automatic gain control are tuned for speech and each one destroys something
// the detector needs — transients, high partials, and the level differences
// that separate a struck note from a ringing one.

import workletUrl from './pitchProcessor.ts?worker&url';
import type { DetectorThresholds } from './detector';
import type { FromPitchWorklet, ToPitchWorklet } from './messages';
import type {
  InputNoteEvent,
  InputSource,
  InputSourceState,
  Unsubscribe,
} from '../../midi/types';

export interface MicDeviceInfo {
  deviceId: string;
  label: string;
  /** True when the label suggests a built-in phone microphone. */
  builtIn: boolean;
}

export interface MicLevel {
  peak: number;
  rmsDb: number;
  noiseFloorDb: number;
  onsetStrength: number;
  cpuMeanMs: number;
  cpuMaxMs: number;
}

export interface MicCalibration {
  /** Per-pitch gain correction in dB. */
  gainDb: [number, number][];
  /** Per-pitch inharmonicity coefficient. */
  inharmonicity: [number, number][];
  /** Measured input latency in ms; subtracted from every event's timestamp. */
  latencyMs: number;
  /** Room noise floor in dBFS at calibration time. */
  noiseFloorDb: number;
  thresholds: Partial<DetectorThresholds>;
}

export type MicErrorCode = 'unsupported' | 'permission-denied' | 'no-device' | 'failed';

export class MicAccessError extends Error {
  constructor(
    readonly code: MicErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MicAccessError';
  }
}

/**
 * Thresholds for a device that is not a room microphone.
 *
 * A cable from the piano's line out has no room noise, no distance rolloff and
 * a far better signal-to-noise ratio, so the evidence bar can come down and the
 * detector sees quiet notes it would otherwise miss (docs/01 §4.7).
 */
export const LINE_INPUT_PRESET: Partial<DetectorThresholds> = {
  onDb: 6,
  offDb: 3,
  unexpectedExtraDb: 8,
};

/** Velocity reported for mic notes: the detector measures level, not touch. */
const MIC_VELOCITY = 80;

export interface MicSourceOptions {
  /** Injection point for tests; defaults to the platform's media devices. */
  media?: MediaDevices | null;
  /** The shared AudioContext (`audioEngine.ensureStarted()`). */
  audioContext: () => Promise<AudioContext>;
  /** Override for the worklet module URL; tests serve their own. */
  moduleUrl?: string;
}

export class MicSource implements InputSource {
  readonly kind = 'mic' as const;
  readonly name = 'Microphone';

  private readonly media: MediaDevices | null;
  private readonly getContext: () => Promise<AudioContext>;
  private readonly moduleUrl: string;

  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  /** Keeps the graph pulling without making a sound. */
  private sink: GainNode | null = null;

  private readonly noteListeners = new Set<(e: InputNoteEvent) => void>();
  private readonly stateListeners = new Set<(s: InputSourceState) => void>();
  private readonly levelListeners = new Set<(l: MicLevel) => void>();
  private readonly audioListeners = new Set<(chunk: Float32Array) => void>();

  private detail = 'not connected';
  private connected = false;
  private pinnedDeviceId: string | null = null;
  private calibration: MicCalibration | null = null;
  private devices: MicDeviceInfo[] = [];
  private lastLevel: MicLevel | null = null;

  /**
   * `performance.now()` minus `AudioContext.currentTime` in ms, so worklet
   * timestamps can be compared with MIDI ones. Re-read on every level message
   * because the two clocks drift.
   */
  private clockOffsetMs = 0;

  constructor(options: MicSourceOptions) {
    this.media =
      options.media !== undefined
        ? options.media
        : typeof navigator !== 'undefined' && navigator.mediaDevices
          ? navigator.mediaDevices
          : null;
    this.getContext = options.audioContext;
    this.moduleUrl = options.moduleUrl ?? workletUrl;
  }

  get supported(): boolean {
    return this.media !== null && typeof AudioWorkletNode !== 'undefined';
  }

  get state(): InputSourceState {
    return { connected: this.connected, detail: this.detail };
  }

  get inputs(): MicDeviceInfo[] {
    return [...this.devices];
  }

  get level(): MicLevel | null {
    return this.lastLevel;
  }

  /** The device the owner chose, or null for the browser's default. */
  get pinnedInputId(): string | null {
    return this.pinnedDeviceId;
  }

  onNote(cb: (e: InputNoteEvent) => void): Unsubscribe {
    this.noteListeners.add(cb);
    return () => this.noteListeners.delete(cb);
  }

  onStateChange(cb: (s: InputSourceState) => void): Unsubscribe {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  /** Level, noise floor and analysis cost, ~8 times a second while connected. */
  onLevel(cb: (l: MicLevel) => void): Unsubscribe {
    this.levelListeners.add(cb);
    return () => this.levelListeners.delete(cb);
  }

  /** Raw audio, only between `startRecording()` and `stopRecording()`. */
  onAudio(cb: (chunk: Float32Array) => void): Unsubscribe {
    this.audioListeners.add(cb);
    return () => this.audioListeners.delete(cb);
  }

  /**
   * Opens the microphone. MUST be called from a user gesture: it raises the
   * permission prompt and starts the AudioContext.
   */
  async connect(deviceId?: string): Promise<void> {
    if (!this.media) {
      this.fail('unsupported', 'this browser has no microphone API');
    }
    if (deviceId !== undefined) this.pinnedDeviceId = deviceId;
    this.disconnect();

    const context = await this.getContext();
    this.context = context;

    let stream: MediaStream;
    try {
      stream = await this.media.getUserMedia({ audio: this.constraints() });
    } catch (cause) {
      const name = cause instanceof Error ? cause.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        this.fail('permission-denied', 'microphone permission was refused', cause);
      }
      if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        this.fail('no-device', 'no microphone matched', cause);
      }
      this.fail('failed', 'could not open the microphone', cause);
    }
    this.stream = stream;

    try {
      await context.audioWorklet.addModule(this.moduleUrl);
    } catch (cause) {
      this.disconnect();
      this.fail('failed', 'the pitch detector worklet failed to load', cause);
    }

    const node = new AudioWorkletNode(context, 'pitch-detector', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    node.port.onmessage = (event: MessageEvent<FromPitchWorklet>) => {
      this.receive(event.data);
    };
    this.node = node;

    this.input = context.createMediaStreamSource(stream);
    // Chrome only runs a worklet whose output reaches the destination, so the
    // graph ends in a muted gain rather than nothing at all. A live path back
    // to the speaker would of course be a feedback loop.
    this.sink = context.createGain();
    this.sink.gain.value = 0;
    this.input.connect(node).connect(this.sink).connect(context.destination);

    if (this.calibration) this.sendCalibration(this.calibration);

    this.connected = true;
    this.detail = describeTrack(stream);
    await this.refreshDevices();
    this.emitState();
  }

  disconnect(): void {
    this.node?.port.postMessage({ type: 'record', on: false } satisfies ToPitchWorklet);
    if (this.node) this.node.port.onmessage = null;
    this.input?.disconnect();
    this.node?.disconnect();
    this.sink?.disconnect();
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.input = null;
    this.node = null;
    this.sink = null;
    this.stream = null;
    this.lastLevel = null;
    if (this.connected) {
      this.connected = false;
      this.detail = 'not connected';
      this.emitState();
    }
  }

  /**
   * Publishes what the score expects now and next. The engine calls this on
   * every step change; it is the whole reason this detector is tractable
   * (docs/05 §11.1).
   */
  setExpectations(now: readonly number[], next: readonly number[] = []): void {
    this.node?.port.postMessage({
      type: 'expectations',
      now: [...now],
      next: [...next],
    } satisfies ToPitchWorklet);
  }

  /** Applies a stored calibration; kept for the next connect if not open yet. */
  applyCalibration(calibration: MicCalibration | null): void {
    this.calibration = calibration;
    if (calibration) this.sendCalibration(calibration);
  }

  get appliedCalibration(): MicCalibration | null {
    return this.calibration;
  }

  /** Lists the input devices; labels are only populated after permission. */
  async refreshDevices(): Promise<MicDeviceInfo[]> {
    if (!this.media?.enumerateDevices) return [];
    const all = await this.media.enumerateDevices();
    this.devices = all
      .filter((d) => d.kind === 'audioinput')
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || 'Microphone',
        builtIn: isBuiltIn(d.label),
      }));
    return this.inputs;
  }

  /** Chooses a device for the next `connect()`. */
  pinInput(deviceId: string | null): void {
    this.pinnedDeviceId = deviceId;
  }

  /** True when the chosen device looks like a cable rather than a room mic. */
  get looksLikeLineInput(): boolean {
    const device = this.devices.find((d) => d.deviceId === this.pinnedDeviceId);
    return device ? !device.builtIn : false;
  }

  startRecording(): void {
    this.node?.port.postMessage({ type: 'record', on: true } satisfies ToPitchWorklet);
  }

  stopRecording(): void {
    this.node?.port.postMessage({ type: 'record', on: false } satisfies ToPitchWorklet);
  }

  reset(): void {
    this.node?.port.postMessage({ type: 'reset' } satisfies ToPitchWorklet);
  }

  /** The sample rate the detector is running at, once connected. */
  get sampleRate(): number | null {
    return this.context?.sampleRate ?? null;
  }

  private constraints(): MediaTrackConstraints {
    return {
      // Speech processing, all of it, off — see the note at the top.
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
      ...(this.pinnedDeviceId ? { deviceId: { exact: this.pinnedDeviceId } } : {}),
    };
  }

  private sendCalibration(calibration: MicCalibration): void {
    this.node?.port.postMessage({
      type: 'calibration',
      gainDb: calibration.gainDb,
      inharmonicity: calibration.inharmonicity,
      thresholds: calibration.thresholds,
    } satisfies ToPitchWorklet);
  }

  private receive(message: FromPitchWorklet): void {
    switch (message.type) {
      case 'notes':
        for (const event of message.events) {
          this.emitNote({
            kind: event.kind,
            midi: event.midi,
            velocity: MIC_VELOCITY,
            tMs: this.toPerformanceMs(event.tMs),
            confidence: event.confidence,
            source: 'mic',
          });
        }
        break;
      case 'level':
        this.syncClock(message.tMs);
        this.lastLevel = {
          peak: message.peak,
          rmsDb: message.rmsDb,
          noiseFloorDb: message.noiseFloorDb,
          onsetStrength: message.onsetStrength,
          cpuMeanMs: message.cpuMeanMs,
          cpuMaxMs: message.cpuMaxMs,
        };
        for (const l of this.levelListeners) l(this.lastLevel);
        break;
      case 'audio':
        for (const l of this.audioListeners) l(message.samples);
        break;
    }
  }

  /**
   * Ties the AudioContext clock to `performance.now()`.
   *
   * `getOutputTimestamp()` gives the two readings taken together and is the
   * accurate way; where it is missing (or returns zeros, which some builds do
   * before the first render quantum) the fallback is to pair the worklet's own
   * timestamp with the moment its message arrived, which is late by one
   * message hop but stable.
   */
  private syncClock(contextMs: number): void {
    const stamp = this.context?.getOutputTimestamp?.();
    if (stamp && stamp.contextTime && stamp.performanceTime) {
      this.clockOffsetMs = stamp.performanceTime - stamp.contextTime * 1000;
      return;
    }
    this.clockOffsetMs = performance.now() - contextMs;
  }

  /**
   * Worklet time → app time, less the calibrated input latency.
   *
   * The latency term is what makes Tempo mode honest: the note reaches the
   * detector after the room, the microphone and the input buffer have each
   * added their delay, and without subtracting it every note the owner plays
   * would be reported late (docs/05 §11.4).
   */
  private toPerformanceMs(contextMs: number): number {
    return contextMs + this.clockOffsetMs - (this.calibration?.latencyMs ?? 0);
  }

  private emitNote(event: InputNoteEvent): void {
    for (const l of this.noteListeners) l(event);
  }

  private emitState(): void {
    const s = this.state;
    for (const l of this.stateListeners) l(s);
  }

  private fail(code: MicErrorCode, message: string, cause?: unknown): never {
    this.detail = message;
    this.connected = false;
    this.emitState();
    throw new MicAccessError(code, message, cause);
  }
}

/** "Headset (USB Audio Device) · 48 kHz" — what the UI shows under the toggle. */
function describeTrack(stream: MediaStream): string {
  const track = stream.getAudioTracks()[0];
  if (!track) return 'connected';
  const settings = track.getSettings();
  const rate = settings.sampleRate ? ` · ${Math.round(settings.sampleRate / 1000)} kHz` : '';
  return `${track.label || 'microphone'}${rate}`;
}

const BUILT_IN_HINTS = ['built-in', 'internal', 'default', 'phone', 'handset', 'front', 'back'];

function isBuiltIn(label: string): boolean {
  const lower = label.toLowerCase();
  return BUILT_IN_HINTS.some((hint) => lower.includes(hint));
}
