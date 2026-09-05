// Real MIDI hardware via the Web MIDI API.
//
// Behaviour is pinned by docs/05-score-follow-engine.md §9 and
// docs/01-architecture.md §4.3. The short version of why this file looks the
// way it does:
//
// * `connect()` MUST run inside a user gesture, because since Chrome 124 every
//   `requestMIDIAccess()` call — not just SysEx — raises a permission prompt.
//   The MIDI screen explains the prompt before the button is tappable.
// * We subscribe to *every* input, not just a chosen one. Cheap USB-MIDI
//   cables show up with generic names ("USB MIDI Interface", "MIDI Device"),
//   so there is no reliable way to guess which port the piano is on, and
//   listening to all of them costs nothing.
// * Timestamps come from `event.timeStamp`, not `performance.now()` read in
//   the handler: the former is taken when the message arrived, so it does not
//   carry JS scheduling jitter into the latency numbers.
// * Clock (0xF8) and active sensing (0xFE) are dropped before the log. Some
//   devices send active sensing every 300 ms; logging them at full rate would
//   push every real note out of a 500-entry buffer within minutes. They are
//   counted instead, which is what diagnostics actually needs from them.

import {
  CC_ALL_NOTES_OFF,
  CC_ALL_SOUND_OFF,
  formatHex,
  parseMidiMessage,
  type ParsedMidiMessage,
} from './parseMidiMessage';
import type {
  InputNoteEvent,
  MidiMessageEvent,
  MidiSource,
  MidiSourceState,
  Unsubscribe,
} from './types';
import { RingBuffer } from '../util/RingBuffer';

export const MIDI_LOG_CAPACITY = 500;

export type MidiErrorCode = 'unsupported' | 'permission-denied' | 'failed';

/** Base class so the UI can branch on `err.code` instead of matching strings. */
export class MidiAccessError extends Error {
  constructor(
    readonly code: MidiErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MidiAccessError';
  }
}

export interface MidiPortInfo {
  id: string;
  name: string;
  manufacturer: string;
  /** 'connected' | 'disconnected' — whether the device is physically present. */
  state: string;
  /** 'open' | 'closed' | 'pending' — whether we hold the port open. */
  connection: string;
}

export interface MidiLogEntry {
  /** Monotonic counter, so the UI can key rows without comparing timestamps. */
  seq: number;
  tMs: number;
  inputId: string;
  inputName: string;
  bytes: number[];
  hex: string;
  parsed: ParsedMidiMessage;
}

export interface MidiHighRateCounters {
  clock: number;
  activeSensing: number;
  /** Timestamp of the most recent suppressed message, or null. */
  lastTMs: number | null;
}

type RequestMidiAccess = (options?: MIDIOptions) => Promise<MIDIAccess>;

export interface WebMidiSourceOptions {
  /**
   * Injection point for tests and for the Playwright mock. Defaults to
   * `navigator.requestMIDIAccess` bound to `navigator`, or null when the
   * browser has no Web MIDI at all (Firefox, iOS Safari).
   */
  requestAccess?: RequestMidiAccess | null;
  logCapacity?: number;
}

function defaultRequestAccess(): RequestMidiAccess | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & { requestMIDIAccess?: RequestMidiAccess };
  if (typeof nav.requestMIDIAccess !== 'function') return null;
  return nav.requestMIDIAccess.bind(nav);
}

/** True when this browser exposes the Web MIDI API at all. */
export function isWebMidiSupported(): boolean {
  return defaultRequestAccess() !== null;
}

function portInfo(port: MIDIPort): MidiPortInfo {
  return {
    id: port.id,
    name: port.name ?? '(unnamed)',
    manufacturer: port.manufacturer ?? '',
    state: port.state,
    connection: port.connection,
  };
}

export class WebMidiSource implements MidiSource {
  readonly kind = 'midi' as const;

  private access: MIDIAccess | null = null;
  private readonly requestAccess: RequestMidiAccess | null;
  private readonly log: RingBuffer<MidiLogEntry>;
  private readonly attached = new Set<MIDIInput>();
  private readonly noteListeners = new Set<(e: InputNoteEvent) => void>();
  private readonly messageListeners = new Set<(m: MidiMessageEvent) => void>();
  private readonly stateListeners = new Set<(s: MidiSourceState) => void>();
  private readonly logListeners = new Set<() => void>();
  /** midi note -> timestamp of its Note-On, so CC123 can release what is held. */
  private readonly pressed = new Map<number, number>();
  private readonly counters: MidiHighRateCounters = {
    clock: 0,
    activeSensing: 0,
    lastTMs: null,
  };
  private seq = 0;
  private pinned: string | null = null;
  private selectedOutput: string | null = null;
  private lastError: MidiAccessError | null = null;

  constructor(options: WebMidiSourceOptions = {}) {
    this.requestAccess =
      options.requestAccess === undefined ? defaultRequestAccess() : options.requestAccess;
    this.log = new RingBuffer<MidiLogEntry>(options.logCapacity ?? MIDI_LOG_CAPACITY);
  }

  get name(): string {
    const active = this.activeInputs();
    const first = active[0];
    if (active.length === 1 && first) return first.name ?? 'MIDI input';
    if (active.length > 1) return `${active.length} MIDI inputs`;
    return 'Web MIDI';
  }

  get connected(): boolean {
    return this.access !== null && this.activeInputs().length > 0;
  }

  get supported(): boolean {
    return this.requestAccess !== null;
  }

  get error(): MidiAccessError | null {
    return this.lastError;
  }

  /**
   * Requests MIDI access. MUST be called from a user gesture.
   *
   * Throws `MidiAccessError` with code `unsupported` (no Web MIDI in this
   * browser), `permission-denied` (the user dismissed or blocked the prompt),
   * or `failed` (anything else). The MIDI screen renders one recovery path
   * per code, so callers should surface `err.code` rather than the message.
   */
  async connect(): Promise<void> {
    if (!this.requestAccess) {
      throw this.fail('unsupported', 'This browser does not support the Web MIDI API.');
    }
    let access: MIDIAccess;
    try {
      access = await this.requestAccess({ sysex: false });
    } catch (cause) {
      const name = cause instanceof Error ? cause.name : '';
      if (name === 'SecurityError' || name === 'NotAllowedError') {
        throw this.fail('permission-denied', 'MIDI permission was denied.', cause);
      }
      throw this.fail('failed', 'Could not open MIDI access.', cause);
    }
    this.lastError = null;
    this.access = access;
    // Hot-plug: the OTG cable is very often inserted after the app is open.
    access.onstatechange = () => {
      this.attachAllInputs();
      this.emitState();
    };
    this.attachAllInputs();
    this.emitState();
  }

  disconnect(): void {
    for (const input of this.attached) input.onmidimessage = null;
    this.attached.clear();
    if (this.access) this.access.onstatechange = null;
    this.access = null;
    this.pressed.clear();
    this.emitState();
  }

  onNote(cb: (e: InputNoteEvent) => void): Unsubscribe {
    this.noteListeners.add(cb);
    return () => this.noteListeners.delete(cb);
  }

  onMessage(cb: (m: MidiMessageEvent) => void): Unsubscribe {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  onStateChange(cb: (s: MidiSourceState) => void): Unsubscribe {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  /** Fires after any message is appended to the log (throttle in the UI). */
  onLog(cb: () => void): Unsubscribe {
    this.logListeners.add(cb);
    return () => this.logListeners.delete(cb);
  }

  get inputs(): MidiPortInfo[] {
    return this.activeInputs().map(portInfo);
  }

  get outputs(): MidiPortInfo[] {
    if (!this.access) return [];
    return [...this.access.outputs.values()].map(portInfo);
  }

  /**
   * Restricts *note* events to one input. Every input stays subscribed and
   * everything keeps reaching the log, because diagnosing a silent cable means
   * seeing what the other ports are doing (docs/05 §9: never key settings on
   * the device name alone — ids can change between plug-ins, so an unknown id
   * simply means "no filter" rather than "no input").
   */
  pinInput(id: string | null): void {
    this.pinned = id;
    this.emitState();
  }

  get pinnedInputId(): string | null {
    return this.pinned;
  }

  /** The input whose notes reach the engine, or null when all of them do. */
  get effectiveInputId(): string | null {
    if (!this.pinned) return null;
    return this.activeInputs().some((i) => i.id === this.pinned) ? this.pinned : null;
  }

  selectOutput(id: string | null): void {
    this.selectedOutput = id;
  }

  get selectedOutputId(): string | null {
    return this.selectedOutput;
  }

  /**
   * Sends raw bytes to the selected MIDI output (or the first one). Used for
   * "playback to the piano" (docs/00 D16); a no-op when no output exists.
   */
  send(bytes: Uint8Array): void {
    const out = this.resolveOutput();
    if (!out) return;
    out.send(Array.from(bytes));
  }

  /** Panic: release everything on the piano. Sent on stop (docs/05 §9). */
  sendAllNotesOff(channel = 1): void {
    const status = 0xb0 | ((channel - 1) & 0x0f);
    this.send(Uint8Array.from([status, CC_ALL_SOUND_OFF, 0]));
    this.send(Uint8Array.from([status, CC_ALL_NOTES_OFF, 0]));
  }

  get logEntries(): MidiLogEntry[] {
    return this.log.toArray();
  }

  latestLog(n: number): MidiLogEntry[] {
    return this.log.latest(n);
  }

  clearLog(): void {
    this.log.clear();
    this.seq = 0;
    this.counters.clock = 0;
    this.counters.activeSensing = 0;
    this.counters.lastTMs = null;
    for (const l of this.logListeners) l();
  }

  get highRateCounters(): Readonly<MidiHighRateCounters> {
    return this.counters;
  }

  /** Notes currently held down, as far as this source can tell. */
  get pressedNotes(): number[] {
    return [...this.pressed.keys()].sort((a, b) => a - b);
  }

  get state(): MidiSourceState {
    const inputs = this.inputs.map((i) => i.name);
    return {
      connected: this.connected,
      detail: this.describe(),
      inputs,
      outputs: this.outputs.map((o) => o.name),
    };
  }

  private describe(): string {
    if (this.lastError) return this.lastError.message;
    if (!this.access) return 'Not connected';
    const n = this.activeInputs().length;
    if (n === 0) return 'Connected — no MIDI inputs found';
    return n === 1 ? '1 input' : `${n} inputs`;
  }

  private fail(code: MidiErrorCode, message: string, cause?: unknown): MidiAccessError {
    const err = new MidiAccessError(code, message, cause);
    this.lastError = err;
    this.emitState();
    return err;
  }

  private activeInputs(): MIDIInput[] {
    if (!this.access) return [];
    return [...this.access.inputs.values()];
  }

  private resolveOutput(): MIDIOutput | null {
    if (!this.access) return null;
    if (this.selectedOutput) {
      const chosen = this.access.outputs.get(this.selectedOutput);
      if (chosen) return chosen;
    }
    const first = this.access.outputs.values().next();
    return first.done ? null : first.value;
  }

  /**
   * Idempotent: `onmidimessage` is a single-handler slot, so re-running this on
   * every `statechange` reattaches new ports without doubling up on old ones.
   */
  private attachAllInputs(): void {
    if (!this.access) return;
    const current = new Set<MIDIInput>();
    for (const input of this.access.inputs.values()) {
      current.add(input);
      if (this.attached.has(input)) continue;
      input.onmidimessage = (event: MIDIMessageEvent) => this.handleMessage(input, event);
      this.attached.add(input);
    }
    for (const stale of [...this.attached]) {
      if (!current.has(stale)) {
        stale.onmidimessage = null;
        this.attached.delete(stale);
      }
    }
  }

  private handleMessage(input: MIDIInput, event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data) return;
    // event.timeStamp, not performance.now(): see the file header.
    const parsed = parseMidiMessage(data, event.timeStamp);

    if (parsed.highRate) {
      if (parsed.detail === 'clock') this.counters.clock += 1;
      else this.counters.activeSensing += 1;
      this.counters.lastTMs = parsed.tMs;
      return;
    }

    this.seq += 1;
    this.log.push({
      seq: this.seq,
      tMs: parsed.tMs,
      inputId: input.id,
      inputName: input.name ?? '(unnamed)',
      bytes: Array.from(data),
      hex: formatHex(data),
      parsed,
    });
    for (const l of this.logListeners) l();
    for (const l of this.messageListeners) l(parsed);

    const pinnedId = this.effectiveInputId;
    if (pinnedId !== null && input.id !== pinnedId) return;
    this.emitNotesFor(parsed);
  }

  private emitNotesFor(parsed: ParsedMidiMessage): void {
    if (parsed.kind === 'noteOn' && parsed.midi !== undefined) {
      this.pressed.set(parsed.midi, parsed.tMs);
      this.emitNote({
        kind: 'noteOn',
        midi: parsed.midi,
        velocity: parsed.velocity ?? 0,
        tMs: parsed.tMs,
        confidence: 1,
        source: 'midi',
      });
      return;
    }
    if (parsed.kind === 'noteOff' && parsed.midi !== undefined) {
      this.pressed.delete(parsed.midi);
      this.emitNote({
        kind: 'noteOff',
        midi: parsed.midi,
        velocity: parsed.velocity ?? 0,
        tMs: parsed.tMs,
        confidence: 1,
        source: 'midi',
      });
      return;
    }
    // All Notes Off / All Sound Off: release everything we believe is held, so
    // a dropped Note-Off from a flaky cable cannot leave a key stuck green.
    if (
      parsed.kind === 'cc' &&
      (parsed.cc === CC_ALL_NOTES_OFF || parsed.cc === CC_ALL_SOUND_OFF)
    ) {
      for (const midi of [...this.pressed.keys()]) {
        this.pressed.delete(midi);
        this.emitNote({
          kind: 'noteOff',
          midi,
          velocity: 0,
          tMs: parsed.tMs,
          confidence: 1,
          source: 'midi',
        });
      }
    }
  }

  private emitNote(e: InputNoteEvent): void {
    for (const l of this.noteListeners) l(e);
  }

  private emitState(): void {
    const s = this.state;
    for (const l of this.stateListeners) l(s);
  }
}
