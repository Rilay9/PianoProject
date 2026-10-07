// @vitest-environment jsdom
/**
 * The audio a session plays through: its context and its destination, read as
 * one pair when they are used (U67).
 *
 * The Score screen builds its session as the piece loads. On a reload, or a link
 * straight to a piece, that is before any tap, when the app's engine has no
 * context and no master gain, and the session used to keep what it was built
 * with for the whole visit: `Hear it` moved the cursor and scheduled nothing.
 * The screen now hands the session a provider that answers with the engine's
 * pair each time it is asked. These are the session's side of that: a session
 * built cold whose pair goes live later plays, the notes on the live context's
 * clock and the click on the live destination; one built with a fixed live pair
 * plays as it did; one whose pair never goes live schedules nothing.
 *
 * The destination is asserted beside the context on purpose. A binding that
 * refreshed the context alone would play the notes and route the click past
 * the master gain the learner's volume is set on (`responses/b2a55d0.md`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScoreSession, type SessionAudio } from '../../src/score/ScoreSession';
import type { Piano } from '../../src/audio/Piano';
import { Metronome } from '../../src/audio/Metronome';
import type { WindowRenderer } from '../../src/score/WindowRenderer';
import { makeModel, note } from './helpers/engineHarness';

/** C D E F: four steps, both played back in a Listen run. */
const model = makeModel([
  { onset: 0, notes: [note({ midi: 60 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
  { onset: 2, notes: [note({ midi: 64 })] },
  { onset: 3, notes: [note({ midi: 65 })] },
]);

function fakeRenderer(): WindowRenderer {
  const renderer = {
    stepIndex: 0,
    showStep: (i: number) => {
      renderer.stepIndex = i;
    },
    showNextStep: () => undefined,
    setCursorVisible: () => undefined,
    setLoopRange: () => undefined,
    visibleNoteElements: () => new Map(),
    noteElements: () => new Map(),
    setNoteStates: () => undefined,
    setBarsPerWindow: () => undefined,
    setLayout: () => undefined,
    setZoom: () => undefined,
    setHandsFocus: () => undefined,
  };
  return renderer as unknown as WindowRenderer;
}

/**
 * A context whose clock reads `nowSec`, and which records where each gain it
 * made was connected: the metronome makes one for its output and connects it to
 * its destination, so that is the routing, read off the node.
 */
interface FakeContext {
  context: AudioContext;
  /** The node each gain this context made was connected to, in order. */
  connectedTo: unknown[];
}

function fakeContext(nowSec: number): FakeContext {
  const connectedTo: unknown[] = [];
  const context = {
    currentTime: nowSec,
    destination: { name: `the context's own output at ${String(nowSec)}` },
    createGain: () => ({
      gain: { value: 0 },
      connect: (node: unknown) => connectedTo.push(node),
      disconnect: () => undefined,
    }),
  } as unknown as AudioContext;
  return { context, connectedTo };
}

/** A master gain stands in as a plain node: the session only passes it on. */
function fakeDestination(name: string): AudioNode {
  return { name } as unknown as AudioNode;
}

/**
 * The engine, as the screen's provider reads it: nothing before the first tap,
 * the context and its master gain after. `pair` is what the next ask returns.
 */
function engineLike(): { audio: () => SessionAudio; pair: SessionAudio } {
  const engine = {
    pair: { context: null, destination: null } as SessionAudio,
    audio: (): SessionAudio => engine.pair,
  };
  return engine;
}

interface Scheduled {
  midi: number;
  timeSec: number | undefined;
}

function fakePiano(): { piano: Piano; scheduled: Scheduled[] } {
  const scheduled: Scheduled[] = [];
  const piano = {
    start: (n: { midi: number; timeSec?: number }) => {
      scheduled.push({ midi: n.midi, timeSec: n.timeSec });
      return () => undefined;
    },
    stop: () => undefined,
  } as unknown as Piano;
  return { piano, scheduled };
}

/** Frames run when asked, so each schedule is a deliberate step. */
const frames: FrameRequestCallback[] = [];
function flushFrame(): void {
  const due = frames.splice(0);
  for (const cb of due) cb(performance.now());
}

/** The run `Hear it` starts, in the session's terms: Listen, both hands, the click as set. */
const HEAR_IT = {
  mode: 'listen' as const,
  countInBars: 0,
  playbackHands: 'both' as const,
  metronome: true,
  latchStart: false,
  judging: false,
};

let metronomeStarts: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  window.requestAnimationFrame = (cb) => {
    frames.push(cb);
    return frames.length;
  };
  window.cancelAnimationFrame = () => undefined;
  frames.length = 0;
  // The click's own scheduling needs a real clock; what is asserted here is
  // which context it was built on and where it was routed, both at construction.
  metronomeStarts = vi.spyOn(Metronome.prototype, 'start').mockImplementation(() => undefined);
  vi.spyOn(Metronome.prototype, 'stop').mockImplementation(() => undefined);
  vi.spyOn(Metronome.prototype, 'dispose').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('a session built cold', () => {
  it('live later, plays: the notes on the live clock, the click on the live destination', () => {
    const { piano, scheduled } = fakePiano();
    const engine = engineLike();
    const s = new ScoreSession({ model, renderer: fakeRenderer(), piano, audio: engine.audio });
    // The tap: the engine now has a context and a master gain.
    const live = fakeContext(5);
    const master = fakeDestination('master gain');
    engine.pair = { context: live.context, destination: master };

    s.start(HEAR_IT);
    flushFrame();

    expect(scheduled.map((one) => one.midi), 'the opening note handed to the piano').toContain(60);
    for (const one of scheduled) {
      expect(one.timeSec, 'timed on the live context’s clock').toBeGreaterThanOrEqual(5);
    }
    expect(metronomeStarts, 'the click started').toHaveBeenCalledTimes(1);
    expect(live.connectedTo, 'the click routed to the live master, not past it').toEqual([master]);
    s.dispose();
  });

  it('live while paused, clicks on the live pair when it resumes', () => {
    const { piano } = fakePiano();
    const engine = engineLike();
    const s = new ScoreSession({ model, renderer: fakeRenderer(), piano, audio: engine.audio });
    s.start(HEAR_IT);
    s.pause();
    const live = fakeContext(3);
    const master = fakeDestination('master gain');
    engine.pair = { context: live.context, destination: master };

    s.resume();

    expect(metronomeStarts, 'the click picked up on the resume').toHaveBeenCalledTimes(1);
    expect(live.connectedTo, 'on the live destination').toEqual([master]);
    s.dispose();
  });

  it('never live, schedules nothing and clicks nothing (the reload fault, in the session)', () => {
    const { piano, scheduled } = fakePiano();
    const s = new ScoreSession({ model, renderer: fakeRenderer(), piano, audio: engineLike().audio });

    s.start(HEAR_IT);
    flushFrame();
    flushFrame();

    expect(scheduled, 'no note without a context').toEqual([]);
    expect(metronomeStarts, 'no click without a context').not.toHaveBeenCalled();
    s.dispose();
  });
});

describe('a session built with a fixed live pair (the microscope, the tests)', () => {
  it('plays as it always has: the notes on its clock, the click on its destination', () => {
    const { piano, scheduled } = fakePiano();
    const live = fakeContext(2);
    const master = fakeDestination('master gain');
    const s = new ScoreSession({
      model,
      renderer: fakeRenderer(),
      piano,
      audioContext: live.context,
      destination: master,
    });

    s.start(HEAR_IT);
    flushFrame();

    expect(scheduled.map((one) => one.midi)).toContain(60);
    for (const one of scheduled) expect(one.timeSec).toBeGreaterThanOrEqual(2);
    expect(metronomeStarts).toHaveBeenCalledTimes(1);
    expect(live.connectedTo).toEqual([master]);
    s.dispose();
  });
});
