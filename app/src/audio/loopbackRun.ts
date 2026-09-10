// The half of the loopback measurement with a clock and a microphone in it.
//
// `loopbackLatency.ts` is the pure half. This one opens a stream, loads the
// listener worklet, plays the clicks and hands what came back to the pure half
// to be scored — the same split as `pitch/calibration.ts` and
// `pitch/calibrationRun.ts`, and for the same reason: the judgement is tested
// in Node and the plumbing is thin enough to read.
//
// It opens its own stream rather than borrowing `micSource`'s. The detector's
// raw-audio path carries no timestamps — `pitch/messages.ts`'s `audio` message
// is samples and nothing else — so there is no clock in it to measure against,
// and adding one would mean changing the detector worklet for the sake of a
// diagnostic. A second `getUserMedia` on the same device costs a moment and
// leaves the detector running.

import workletUrl from './loopbackProcessor.ts?worker&url';
import { audioEngine } from '../app/services';
import { MIC_CLICK_HZ, Metronome } from './Metronome';
import { getMidiSettings } from '../data/midiSettings';
import type { FromLoopbackWorklet, ToLoopbackWorklet } from './loopbackMessages';
import {
  detectClickOnsets,
  inputLatencyFromRoundTrip,
  loopbackSchedule,
  measurementClickTimes,
  scoreLoopback,
  type LoopbackFrame,
  type LoopbackResult,
  type ScheduledBeat,
} from './loopbackLatency';

/**
 * Everything the browser does to speech, off.
 *
 * Echo cancellation is the one that matters here and it is the exact thing it
 * is designed to do: remove from the microphone whatever the speaker just
 * played. With it on, the click is subtracted before anything can time it and
 * the measurement finds nothing at all — which is the failure the manual
 * fallback on the Diagnostics screen exists for.
 */
const LOOPBACK_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1,
};

/**
 * Floor for the click's volume during a run.
 *
 * The metronome volume is a taste setting and can be nearly zero; a click the
 * microphone cannot hear is not a failed measurement, it is a wasted one.
 */
const LOOPBACK_MIN_VOLUME = 0.6;

/** Long enough for the worklet's last batch to cross the port. */
const DRAIN_MS = 120;

export interface LoopbackRunOptions {
  /** One line of "what is happening now", for the screen. */
  onStage(text: string): void;
  clicks?: number;
  bpm?: number;
  /**
   * Delay something else already subtracts, in milliseconds — a stored
   * microphone calibration's own `latencyMs`. See `inputLatencyFromRoundTrip`.
   */
  alreadyCompensatedMs?: number;
  /** Injection points for tests; the platform's own by default. */
  media?: MediaDevices | null;
  moduleUrl?: string;
}

export interface LoopbackOutcome {
  result: LoopbackResult;
  /** `AudioContext.outputLatency` at the time of the run, in milliseconds. */
  outputLatencyMs: number;
  /** What to store: the round trip, less the output path and the flight. */
  inputLatencyMs: number;
  /** Render quanta the worklet reported; 0 means the stream never delivered. */
  frames: number;
}

/**
 * Emits a handful of clicks, listens for them, and reports the round trip.
 *
 * Everything is on the AudioContext clock — the metronome schedules on it and
 * the worklet timestamps on it — so no conversion to `performance.now()` is
 * involved and none of its error is either. The output latency is deliberately
 * *not* added to the click times: it is part of the round trip being measured
 * and is taken off once, at the end, where it can be seen.
 */
export async function runLoopbackLatency(options: LoopbackRunOptions): Promise<LoopbackOutcome> {
  const context = await audioEngine.ensureStarted();
  const media =
    options.media !== undefined
      ? options.media
      : typeof navigator !== 'undefined'
        ? navigator.mediaDevices
        : null;
  if (!media) throw new Error('this browser has no microphone');

  const schedule = loopbackSchedule(options.clicks, options.bpm);

  options.onStage('Opening the microphone…');
  const stream = await media.getUserMedia({ audio: LOOPBACK_CONSTRAINTS });

  let input: MediaStreamAudioSourceNode | null = null;
  let node: AudioWorkletNode | null = null;
  let sink: GainNode | null = null;
  let metronome: Metronome | null = null;
  const stop = (): void => {
    metronome?.stop();
    metronome?.dispose();
    if (node) node.port.onmessage = null;
    input?.disconnect();
    node?.disconnect();
    sink?.disconnect();
    for (const track of stream.getTracks()) track.stop();
  };

  try {
    try {
      await context.audioWorklet.addModule(options.moduleUrl ?? workletUrl);
    } catch (cause) {
      throw new Error('the loopback listener could not be loaded', { cause });
    }
    node = new AudioWorkletNode(context, 'loopback-listener', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    const frames: LoopbackFrame[] = [];
    node.port.onmessage = (event: MessageEvent<FromLoopbackWorklet>) => {
      const message = event.data;
      if (message.type !== 'frames') return;
      for (let i = 0; i < message.magnitudes.length; i += 1) {
        frames.push({
          atMs: (message.startSec + i * message.stepSec) * 1000,
          magnitude: message.magnitudes[i] ?? 0,
        });
      }
    };

    input = context.createMediaStreamSource(stream);
    // Chrome only runs a worklet whose output reaches the destination, and the
    // gain is zero because a live path from the microphone back to the speaker
    // is a feedback loop — the same arrangement `MicSource` uses.
    sink = context.createGain();
    sink.gain.value = 0;
    input.connect(node).connect(sink).connect(context.destination);
    node.port.postMessage({ type: 'arm', hz: MIC_CLICK_HZ } satisfies ToLoopbackWorklet);

    metronome = new Metronome(context, {
      bpm: schedule.bpm,
      beatsPerBar: schedule.beatsPerBar,
      countInBars: schedule.countInBars,
      // The high click and nothing else: it is a sine at a known frequency,
      // which is what the listener is tuned to, and the wood click is a noise
      // burst with no frequency to be tuned to at all.
      sound: 'high',
      volume: Math.max(LOOPBACK_MIN_VOLUME, getMidiSettings().metronomeVolume),
      ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
    });

    const beats: ScheduledBeat[] = [];
    const offTick = metronome.onTick((beat) => {
      beats.push({ timeSec: beat.timeSec, isCountIn: beat.isCountIn });
      const emitted = beats.filter((b) => !b.isCountIn).length;
      options.onStage(
        emitted === 0
          ? 'Listening…'
          : `Click ${String(emitted)} of ${String(schedule.clicks)}…`,
      );
      if (emitted >= schedule.clicks) {
        offTick();
        metronome?.stop();
      }
    });
    metronome.start();

    await wait(schedule.totalMs);
    node.port.postMessage({ type: 'disarm' } satisfies ToLoopbackWorklet);
    await wait(DRAIN_MS);

    const result = scoreLoopback(
      measurementClickTimes(beats),
      detectClickOnsets(frames),
      schedule.clicks,
    );
    const outputLatencyMs = outputLatencyOf(context);
    return {
      result,
      outputLatencyMs,
      inputLatencyMs: inputLatencyFromRoundTrip({
        roundTripMs: result.roundTripMs,
        outputLatencyMs,
        ...(options.alreadyCompensatedMs === undefined
          ? {}
          : { alreadyCompensatedMs: options.alreadyCompensatedMs }),
      }),
      frames: frames.length,
    };
  } finally {
    stop();
  }
}

function outputLatencyOf(context: AudioContext): number {
  const seconds = Number.isFinite(context.outputLatency)
    ? context.outputLatency
    : Number.isFinite(context.baseLatency)
      ? context.baseLatency
      : 0;
  return seconds * 1000;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
