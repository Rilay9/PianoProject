// @vitest-environment jsdom
// The one invariant that decides whether Tempo mode is honest for a
// microphone user: **the input delay is removed exactly once, on every path.**
//
// It used to be removed twice. `MicSource` docked the stored calibration's own
// `latencyMs` from every event before anyone saw it, and `PracticeEngine`
// docked `inputLatencyMs` from every event again — so a calibrated learner
// playing dead on the beat was scored as rushing by the whole of their input
// latency. Nothing in the engine tests could see it, because they fed the
// engine directly and never went through a source.
//
// So this file runs the real `MicSource` — worklet port and all, over a fake
// audio graph — into the real `PracticeEngine`, and checks the number that
// comes out the far end.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MicSource, type MicCalibration } from '../../src/audio/pitch/MicSource';
import { PracticeEngine } from '../../src/engine/PracticeEngine';
import { FakeClock, makeModel, note } from './helpers/engineHarness';
import type { FromPitchWorklet } from '../../src/audio/pitch/messages';
import type { EngineEvent, EngineOptions } from '../../src/engine/types';
import type { InputNoteEvent } from '../../src/midi/types';

/** What the input path costs, in ms — the number under test. */
const LATENCY_MS = 40;

// --- a fake audio graph ------------------------------------------------------
//
// Just enough of the Web Audio surface for `MicSource.connect()` to build its
// graph. Nothing here does any signal processing: the worklet's output is
// posted by hand, which is the whole point — the test controls the exact
// timestamp the detector claims.

class FakeAudioNode {
  connect<T>(target: T): T {
    return target;
  }
  disconnect(): void {
    /* nothing to tear down */
  }
}

class FakePort {
  onmessage: ((event: MessageEvent<FromPitchWorklet>) => void) | null = null;
  postMessage(): void {
    /* the worklet is not real; nothing listens */
  }
}

/** The port of the most recently built worklet node — the test's way in. */
let livePort: FakePort | null = null;

class FakeWorkletNode extends FakeAudioNode {
  readonly port = new FakePort();
  constructor() {
    super();
    livePort = this.port;
  }
}

/**
 * A context whose `getOutputTimestamp` pairs 1 s of context time with 1000 ms
 * of performance time, so the two clocks coincide and a worklet timestamp of
 * 1040 ms means app time 1040 ms. That keeps the arithmetic in the assertions
 * visible rather than hidden behind a clock offset.
 */
function fakeContext(): AudioContext {
  const context = {
    sampleRate: 48_000,
    destination: new FakeAudioNode(),
    audioWorklet: { addModule: () => Promise.resolve() },
    createMediaStreamSource: () => new FakeAudioNode(),
    createGain: () => Object.assign(new FakeAudioNode(), { gain: { value: 1 } }),
    getOutputTimestamp: () => ({ contextTime: 1, performanceTime: 1000 }),
  };
  return context as unknown as AudioContext;
}

function fakeMedia(): MediaDevices {
  const track = {
    label: 'Fake mic',
    getSettings: () => ({ sampleRate: 48_000 }),
    stop: () => undefined,
  };
  const stream = {
    getAudioTracks: () => [track],
    getTracks: () => [track],
  };
  const media = {
    getUserMedia: () => Promise.resolve(stream),
    enumerateDevices: () =>
      Promise.resolve([{ kind: 'audioinput', deviceId: 'default', label: 'Fake mic' }]),
  };
  return media as unknown as MediaDevices;
}

/** A calibration that carries a measured latency and nothing else of interest. */
function calibrationWith(latencyMs: number): MicCalibration {
  return {
    gainDb: [],
    inharmonicity: [],
    latencyMs,
    noiseFloorDb: -60,
    thresholds: {},
  };
}

async function connectMic(calibration: MicCalibration | null): Promise<MicSource> {
  const source = new MicSource({
    media: fakeMedia(),
    audioContext: () => Promise.resolve(fakeContext()),
    moduleUrl: 'about:blank',
  });
  source.applyCalibration(calibration);
  await source.connect();
  return source;
}

/** Hands one worklet message to the live `MicSource`, as the port would. */
function fromWorklet(message: FromPitchWorklet): void {
  livePort?.onmessage?.({ data: message } as MessageEvent<FromPitchWorklet>);
}

/** A level message is what syncs the clock; send one before any note. */
function syncClock(): void {
  fromWorklet({
    type: 'level',
    peak: 0.1,
    rmsDb: -30,
    noiseFloorDb: -60,
    onsetStrength: 0,
    tMs: 500,
  });
}

/** The detector reports `midi` struck at `contextMs` on the AudioContext clock. */
function detected(midi: number, contextMs: number): void {
  fromWorklet({
    type: 'notes',
    events: [{ kind: 'noteOn', midi, tMs: contextMs, confidence: 0.9, unexpected: false }],
  });
}

beforeEach(() => {
  livePort = null;
  (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode = FakeWorkletNode;
});

afterEach(() => {
  delete (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode;
});

// --- the score under both tests ---------------------------------------------

/** Two beats: C4 on beat 0, D4 on beat 1 (1000 ms in, at 60 bpm). */
function melody() {
  return makeModel([
    { onset: 0, notes: [note({ midi: 60 })] },
    { onset: 1, notes: [note({ midi: 62 })] },
  ]);
}

const TEMPO_OPTIONS: EngineOptions = {
  mode: 'tempo',
  countInBars: 0,
  inputLatencyMs: LATENCY_MS,
  toleranceMs: 200,
};

/** Starts a Tempo run and returns the pieces the tests drive it with. */
function startRun(): { engine: PracticeEngine; clock: FakeClock; events: EngineEvent[] } {
  const clock = new FakeClock(0);
  const engine = new PracticeEngine(melody(), TEMPO_OPTIONS, clock);
  const events: EngineEvent[] = [];
  engine.on((e) => events.push(e));
  engine.start();
  return { engine, clock, events };
}

function runTo(engine: PracticeEngine, clock: FakeClock, tMs: number): void {
  while (clock.now() < tMs) {
    clock.set(Math.min(tMs, clock.now() + 16));
    engine.tick();
  }
}

function hitDelta(events: EngineEvent[]): number | undefined {
  const judged = events.filter((e) => e.kind === 'noteJudged');
  return judged.find((e) => e.ok && e.midi === 62)?.deltaMs;
}

describe('input latency is removed exactly once', () => {
  it('a calibrated microphone: a note played on the beat is judged on the beat', async () => {
    // The calibration and the engine setting agree, because they are two
    // records of the same physical delay — which is exactly the shape that
    // used to make the engine take it off twice.
    const mic = await connectMic(calibrationWith(LATENCY_MS));
    const { engine, clock, events } = startRun();
    mic.onNote((event: InputNoteEvent) => {
      engine.feed({
        kind: event.kind,
        midi: event.midi,
        velocity: event.velocity,
        tMs: event.tMs,
        confidence: event.confidence,
      });
    });
    syncClock();

    // The learner strikes D4 exactly on beat 1 (music time 1000 ms). The room,
    // the microphone and the input buffer hand it to the app 40 ms later.
    runTo(engine, clock, 1000 + LATENCY_MS);
    detected(62, 1000 + LATENCY_MS);

    // Removed once: dead on the beat. Removed twice, as it used to be: −40.
    expect(hitDelta(events)).toBeCloseTo(0, 6);
  });

  it('MIDI, with the same setting, lands on the same answer', () => {
    const { engine, clock, events } = startRun();
    runTo(engine, clock, 1000 + LATENCY_MS);
    // A MIDI source reports when the message arrived, uncompensated.
    engine.feed({
      kind: 'noteOn',
      midi: 62,
      velocity: 90,
      tMs: 1000 + LATENCY_MS,
      confidence: 1,
    });
    expect(hitDelta(events)).toBeCloseTo(0, 6);
  });
});

describe('MicSource timestamps', () => {
  it('reports when the note was heard, not when it was guessed to be played', async () => {
    // The `InputNoteEvent.tMs` contract (`midi/types.ts`) is "milliseconds on
    // the same timeline as performance.now()" — for Web MIDI, when the message
    // arrived. A source that quietly moved its timestamps backwards broke that
    // contract, and nothing downstream could tell.
    const mic = await connectMic(calibrationWith(LATENCY_MS));
    const heard: InputNoteEvent[] = [];
    mic.onNote((e) => heard.push(e));
    syncClock();
    detected(60, 1040);
    expect(heard).toHaveLength(1);
    expect(heard[0]?.tMs).toBe(1040);
    expect(heard[0]?.source).toBe('mic');
  });

  it('an uncalibrated microphone reports the same timestamp as a calibrated one', async () => {
    const bare = await connectMic(null);
    const heardBare: InputNoteEvent[] = [];
    bare.onNote((e) => heardBare.push(e));
    syncClock();
    detected(60, 1040);
    bare.disconnect();

    const calibrated = await connectMic(calibrationWith(LATENCY_MS));
    const heardCalibrated: InputNoteEvent[] = [];
    calibrated.onNote((e) => heardCalibrated.push(e));
    syncClock();
    detected(60, 1040);

    // Calibrating changes what the detector hears, never what the clock says.
    expect(heardCalibrated[0]?.tMs).toBe(heardBare[0]?.tMs);
  });
});
