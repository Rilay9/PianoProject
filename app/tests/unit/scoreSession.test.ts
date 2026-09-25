// @vitest-environment jsdom
/**
 * The session's state machine, with a fake renderer and a hand-cranked frame.
 *
 * The screen is chrome around `ScoreSession`; these are the transitions the
 * chrome relies on and the ones round four of the tour found wrong by reading
 * the code: a restart or a stop is not a finish, a lap moves the cursor back,
 * Wait mode never asks for a warning mark, and a natural end is reported once.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_STRIP_OPTIONS,
  KEY_FLASH_MS,
  ScoreSession,
  appPitches,
  learnerLeads,
  type StripOptions,
} from '../../src/score/ScoreSession';
import { prepareSession } from '../../src/engine/prepareSession';
import type { Piano } from '../../src/audio/Piano';
import { Metronome } from '../../src/audio/Metronome';
import type { KeyboardStripState, KeyView } from '../../src/ui/KeyboardStrip';
import type { WindowRenderer } from '../../src/score/WindowRenderer';
import type { SessionScore } from '../../src/engine/types';
import { makeModel, note } from './helpers/engineHarness';

/** C D E F | G A: six steps, two bars. */
const model = makeModel([
  { onset: 0, notes: [note({ midi: 60 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
  { onset: 2, notes: [note({ midi: 64 })] },
  { onset: 3, notes: [note({ midi: 65 })] },
  { onset: 4, notes: [note({ midi: 67 })] },
  { onset: 5, notes: [note({ midi: 69 })] },
]);

interface Calls {
  showStep: number[];
  showNextStep: (number | null)[];
  cursorVisible: boolean[];
}

function fakeRenderer(): { renderer: WindowRenderer; calls: Calls } {
  const calls: Calls = { showStep: [], showNextStep: [], cursorVisible: [] };
  const renderer = {
    stepIndex: 0,
    showStep: (i: number) => {
      calls.showStep.push(i);
      renderer.stepIndex = i;
    },
    showNextStep: (i: number | null) => calls.showNextStep.push(i),
    setCursorVisible: (v: boolean) => calls.cursorVisible.push(v),
    setLoopRange: () => undefined,
    visibleNoteElements: () => new Map(),
    noteElements: () => new Map(),
    setNoteStates: () => undefined,
    setBarsPerWindow: () => undefined,
    setLayout: () => undefined,
    setZoom: () => undefined,
    setHandsFocus: () => undefined,
  };
  return { renderer: renderer as unknown as WindowRenderer, calls };
}

/** Frames run when asked, not on a timer, so every paint is a deliberate step. */
const frames: FrameRequestCallback[] = [];
function flushFrame(): void {
  const due = frames.splice(0);
  for (const cb of due) cb(performance.now());
}

let finishes: { score: SessionScore; looped: boolean }[] = [];
let session: ScoreSession;
let calls: Calls;
let t = 0;

function press(midi: number): void {
  t += 100;
  session.feed(midi, 80, t);
  t += 50;
  session.feedOff(midi, t);
  flushFrame();
}

beforeEach(() => {
  window.requestAnimationFrame = (cb) => {
    frames.push(cb);
    return frames.length;
  };
  window.cancelAnimationFrame = () => undefined;
  frames.length = 0;
  finishes = [];
  t = 0;
  const fake = fakeRenderer();
  calls = fake.calls;
  session = new ScoreSession({
    model,
    renderer: fake.renderer,
    onFinished: (score, looped) => finishes.push({ score, looped }),
  });
});

describe('a run that ends', () => {
  it('reports a natural finish once, and not as a lap', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    for (const midi of [60, 62, 64, 65, 67, 69]) press(midi);
    expect(finishes).toHaveLength(1);
    expect(finishes[0]?.looped).toBe(false);
    expect(session.running).toBe(false);
    session.dispose();
  });

  it('a stop is not a finish', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    press(60);
    session.stop();
    expect(finishes).toHaveLength(0);
    expect(session.running).toBe(false);
  });

  it('a restart is not a finish, and the new run starts at the top', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    press(60);
    press(62);
    session.restart({ hands: 'L' });
    flushFrame();
    expect(finishes).toHaveLength(0);
    expect(session.running).toBe(true);
    expect(calls.showStep.at(-1)).toBe(0);
    session.dispose();
  });

  it('disposing mid-run is silent too', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    press(60);
    session.dispose();
    expect(finishes).toHaveLength(0);
  });
});

describe('a loop', () => {
  it('reports each lap as a lap and puts the cursor back at the loop start', () => {
    session.start({ mode: 'wait', loop: { fromStep: 1, toStep: 2 } });
    flushFrame();
    expect(calls.showStep.at(-1)).toBe(1);
    press(62);
    press(64);
    expect(finishes).toHaveLength(1);
    expect(finishes[0]?.looped).toBe(true);
    expect(session.running).toBe(true);
    // The cursor went back with the engine, before the next note was played.
    expect(calls.showStep.at(-1)).toBe(1);
    expect(session.expectedNow).toEqual([62]);
    session.dispose();
  });
});

describe('the warning mark', () => {
  it('is never asked for in Wait mode', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    press(60);
    press(62);
    expect(calls.showNextStep.length).toBeGreaterThan(0);
    expect(calls.showNextStep.every((i) => i === null)).toBe(true);
    session.dispose();
  });

  it('is cleared when the run ends', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    for (const midi of [60, 62, 64, 65, 67, 69]) press(midi);
    expect(calls.showNextStep.at(-1)).toBeNull();
  });
});

describe('Free play (08 §7.4)', () => {
  it('shows the start mark once, then turns the page and marks nothing', () => {
    session.start({ mode: 'free' });
    flushFrame();
    // Before anything is played: the band on the first step, the keys blank.
    expect(calls.cursorVisible.at(-1)).toBe(true);
    expect(session.expectedNow).toEqual([]);
    press(60);
    expect(calls.showStep.at(-1)).toBe(1);
    expect(calls.cursorVisible.at(-1)).toBe(false);
    // A note that is not the one the page is on does nothing.
    press(67);
    expect(calls.showStep.at(-1)).toBe(1);
    expect(finishes).toHaveLength(0);
    session.dispose();
  });
});

describe('pausing', () => {
  it('keeps the run alive and says it is paused', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    session.pause();
    expect(session.running).toBe(true);
    expect(session.state?.paused).toBe(true);
    session.resume();
    expect(session.state?.paused).toBe(false);
    expect(finishes).toHaveLength(0);
    session.dispose();
  });
});

describe('the keys under the score', () => {
  /** A strip that only remembers what it was last told. */
  function fakeStrip(): { strip: KeyView; last: () => KeyboardStripState } {
    let state: KeyboardStripState = {};
    const strip: KeyView = {
      el: document.createElement('div'),
      setState: (next) => {
        state = next;
      },
      scrollToNote: () => undefined,
      scrollToSpan: () => undefined,
      fitKeysToWidth: () => undefined,
      clear: () => undefined,
      destroy: () => undefined,
    };
    return { strip, last: () => state };
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('flashes a wrong key red for a moment, then goes back to the note it wants', () => {
    const { strip, last } = fakeStrip();
    session.setStrip(strip);
    session.start({ mode: 'wait' });
    flushFrame();
    expect([...(last().expected ?? [])]).toEqual([60]);

    press(71);
    expect([...(last().wrong ?? [])]).toEqual([71]);
    expect([...(last().expected ?? [])]).toEqual([60]);

    vi.advanceTimersByTime(KEY_FLASH_MS + 50);
    expect([...(last().wrong ?? [])]).toEqual([]);
    expect([...(last().expected ?? [])]).toEqual([60]);
    session.dispose();
  });

  it('flashes a right key green for a moment, and the next key is the blue one', () => {
    const { strip, last } = fakeStrip();
    session.setStrip(strip);
    session.start({ mode: 'wait' });
    flushFrame();

    press(60);
    expect([...(last().correct ?? [])]).toEqual([60]);
    expect([...(last().expected ?? [])]).toEqual([62]);

    vi.advanceTimersByTime(KEY_FLASH_MS + 50);
    expect([...(last().correct ?? [])]).toEqual([]);
    expect([...(last().expected ?? [])]).toEqual([62]);
    session.dispose();
  });
});

describe('what the keys show ahead of time', () => {
  const guided = makeModel([
    { onset: 0, notes: [note({ midi: 60, fingering: 1 })] },
    { onset: 1, notes: [note({ midi: 62, fingering: 2 })] },
    { onset: 2, notes: [note({ midi: 64, fingering: 3 })] },
  ]);

  function fakeStrip(): { strip: KeyView; last: () => KeyboardStripState } {
    let state: KeyboardStripState = {};
    const strip: KeyView = {
      el: document.createElement('div'),
      setState: (next) => {
        state = next;
      },
      scrollToNote: () => undefined,
      scrollToSpan: () => undefined,
      fitKeysToWidth: () => undefined,
      clear: () => undefined,
      destroy: () => undefined,
    };
    return { strip, last: () => state };
  }

  function guidedSession(options: Partial<StripOptions>): { last: () => KeyboardStripState; session: ScoreSession } {
    const { strip, last } = fakeStrip();
    const fake = fakeRenderer();
    const s = new ScoreSession({ model: guided, renderer: fake.renderer, strip, stripOptions: { ...DEFAULT_STRIP_OPTIONS, ...options } });
    return { last, session: s };
  }

  it('two notes ahead marks the next step in Wait mode too, with both finger numbers', () => {
    const { session: s, last } = guidedSession({ guide: 'next-two', fingers: true });
    s.start({ mode: 'wait' });
    flushFrame();
    expect([...(last().expected ?? [])]).toEqual([60]);
    expect([...(last().next ?? [])]).toEqual([62]);
    expect([...(last().fingers?.entries() ?? [])]).toEqual([[60, '1'], [62, '2']]);
    s.dispose();
  });

  it('the default guide marks only the note it waits for in Wait mode, with its finger', () => {
    const { session: s, last } = guidedSession({ guide: 'next', fingers: true });
    s.start({ mode: 'wait' });
    flushFrame();
    expect([...(last().expected ?? [])]).toEqual([60]);
    expect([...(last().next ?? [])]).toEqual([]);
    expect([...(last().fingers?.entries() ?? [])]).toEqual([[60, '1']]);
    s.dispose();
  });

  it('off marks nothing and prints no numbers', () => {
    const { session: s, last } = guidedSession({ guide: 'off', fingers: true });
    s.start({ mode: 'wait' });
    flushFrame();
    expect([...(last().expected ?? [])]).toEqual([]);
    expect([...(last().next ?? [])]).toEqual([]);
    expect(last().fingers?.size ?? 0).toBe(0);
    s.dispose();
  });

  it('with the flash off a wrong key is never coloured', () => {
    const { session: s, last } = guidedSession({ flash: false });
    s.start({ mode: 'wait' });
    flushFrame();
    let clock = 0;
    clock += 100;
    s.feed(71, 80, clock);
    clock += 50;
    s.feedOff(71, clock);
    flushFrame();
    expect([...(last().wrong ?? [])]).toEqual([]);
    expect([...(last().expected ?? [])]).toEqual([60]);
    s.dispose();
  });
});

// --- T8: who plays first, and holding for the learner ------------------------

/** Left hand alone on beat 0, right hand from beat 1. */
const leftIntro = makeModel([
  { onset: 0, notes: [note({ midi: 48, hand: 'L' })] },
  { onset: 1, notes: [note({ midi: 60 })] },
  { onset: 2, notes: [note({ midi: 62 })] },
]);

/** Both hands together on beat 0. */
const together = makeModel([
  { onset: 0, notes: [note({ midi: 48, hand: 'L' }), note({ midi: 60 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
]);

function leads(m: typeof model, hands: 'R' | 'L' | 'both', which: 'none' | 'non-focused' | 'both'): boolean {
  return learnerLeads(m, prepareSession(m, { mode: 'tempo', hands }), which);
}

describe('who plays first (T8)', () => {
  it('the app leads when its hand sounds before the learner’s first note', () => {
    expect(leads(leftIntro, 'R', 'non-focused')).toBe(false);
  });

  it('the learner leads when the app’s first note comes after theirs', () => {
    expect(leads(leftIntro, 'L', 'non-focused')).toBe(true);
  });

  it('the learner leads when they start together — the app waits and plays on their key', () => {
    expect(leads(together, 'R', 'non-focused')).toBe(true);
  });

  it('the learner leads when the app plays nothing', () => {
    expect(leads(leftIntro, 'R', 'none')).toBe(true);
    // No hand focus: there is no other hand, so `non-focused` plays nothing.
    expect(leads(leftIntro, 'both', 'non-focused')).toBe(true);
  });

  it('the app leads when it plays everything, the learner’s part included', () => {
    expect(leads(together, 'R', 'both')).toBe(false);
  });

  it('decides with the same pitches the app actually plays', () => {
    expect(appPitches(together, 0, 'non-focused', 'R')).toEqual([48]);
    expect(appPitches(together, 0, 'non-focused', 'both')).toEqual([]);
    expect(appPitches(together, 0, 'none', 'R')).toEqual([]);
  });
});

describe('a Tempo run the learner leads holds for their first key (T8)', () => {
  function sessionWith(m: typeof model) {
    const played: number[] = [];
    const piano = {
      start: (n: { midi: number }) => {
        played.push(n.midi);
        return () => undefined;
      },
      stop: () => undefined,
    } as unknown as Piano;
    const s = new ScoreSession({
      model: m,
      renderer: fakeRenderer().renderer,
      piano,
      audioContext: { currentTime: 0 } as unknown as AudioContext,
    });
    return { s, played };
  }

  it('holds from the start with no count-in, and only in Tempo', () => {
    const { s } = sessionWith(model);
    s.start({ mode: 'tempo', countInBars: 0 });
    expect(s.armed).toBe(true);
    expect(s.holdingFrom).toBe(0);
    for (const mode of ['wait', 'listen', 'free'] as const) {
      s.start({ mode, countInBars: 0 });
      expect(s.armed).toBe(false);
      expect(s.holdingFrom).toBeNull();
    }
    s.dispose();
  });

  it('does not hold when the app leads, or when the caller opts out', () => {
    const { s } = sessionWith(leftIntro);
    s.start({ mode: 'tempo', countInBars: 0, hands: 'R' });
    expect(s.holdingFrom).toBeNull();
    s.start({ mode: 'tempo', countInBars: 0, latchStart: false });
    expect(s.holdingFrom).toBeNull();
    s.dispose();
  });

  it('plays none of the app’s notes while holding, and the held one on the learner’s key', () => {
    const { s, played } = sessionWith(together);
    s.start({ mode: 'tempo', countInBars: 0, hands: 'R' });
    flushFrame();
    flushFrame();
    expect(s.armed).toBe(true);
    expect(played).toEqual([]);
    s.feed(60, 80, performance.now());
    expect(s.armed).toBe(false);
    expect(played).toEqual([48]);
    s.dispose();
  });
});

// --- T8 review: the guard, resuming, and the click while holding -------------

/** The left hand alone for three beats, then the right hand. */
const appIntro = makeModel([
  { onset: 0, notes: [note({ midi: 48, hand: 'L' })] },
  { onset: 1, notes: [note({ midi: 50, hand: 'L' })] },
  { onset: 2, notes: [note({ midi: 52, hand: 'L' })] },
  { onset: 3, notes: [note({ midi: 60 })] },
  { onset: 4, notes: [note({ midi: 62 })] },
]);

function fakeAudio(): AudioContext {
  const node = { gain: { value: 0 }, connect: () => undefined, disconnect: () => undefined };
  return { currentTime: 0, destination: {}, createGain: () => node } as unknown as AudioContext;
}

describe('the T8 review’s fixes, in the session', () => {
  it('knows the right hand has notes when the left hand opens the piece (H1)', () => {
    const s = new ScoreSession({ model: appIntro, renderer: fakeRenderer().renderer });
    s.start({ mode: 'tempo', countInBars: 1, hands: 'R' });
    // The cursor is on the left hand's beat: nothing for the right hand there…
    expect(s.expectedNow).toEqual([]);
    // …but plenty in the run, which is what the screen must ask.
    expect(s.learnerHasNotes).toBe(true);
    s.start({ mode: 'tempo', countInBars: 1, hands: 'L' });
    expect(s.learnerHasNotes).toBe(true);
    s.dispose();
  });

  it('an app-led resume counts back in without holding (H2)', () => {
    const s = new ScoreSession({ model: appIntro, renderer: fakeRenderer().renderer });
    s.start({ mode: 'tempo', countInBars: 0, hands: 'R' });
    expect(s.holdingFrom).toBeNull();
    s.pause();
    s.resume();
    // The next thing to sound is the app's left hand: it leads, nobody waits.
    expect(s.holdingFrom).toBeNull();
    expect(s.armed).toBe(false);
    s.dispose();
  });

  it('a learner-led resume holds for the learner’s next note', () => {
    const s = new ScoreSession({ model, renderer: fakeRenderer().renderer });
    s.start({ mode: 'tempo', countInBars: 0 });
    s.feed(60, 80, performance.now());
    expect(s.holdingFrom).toBeNull();
    s.pause();
    s.resume();
    expect(s.holdingFrom).toBe(1);
    s.dispose();
  });

  it('no run that is holding starts the metronome — at the start or on resume (M2)', () => {
    const starts = vi.spyOn(Metronome.prototype, 'start').mockImplementation(() => undefined);
    vi.spyOn(Metronome.prototype, 'stop').mockImplementation(() => undefined);
    vi.spyOn(Metronome.prototype, 'dispose').mockImplementation(() => undefined);
    const s = new ScoreSession({ model, renderer: fakeRenderer().renderer, audioContext: fakeAudio() });
    s.start({ mode: 'tempo', countInBars: 0, metronome: true });
    expect(s.armed).toBe(true);
    expect(starts).not.toHaveBeenCalled();
    s.pause();
    s.resume();
    expect(s.armed).toBe(true);
    expect(starts).not.toHaveBeenCalled();
    // Latched: now it clicks.
    s.feed(60, 80, performance.now());
    expect(starts).toHaveBeenCalledTimes(1);
    s.dispose();
    vi.restoreAllMocks();
  });
});

describe('the ladder’s opt-out is for its own restart only (T8 review, L3)', () => {
  it('a run started with holdAtStart: false does not hold, and still holds after a pause', () => {
    const s = new ScoreSession({ model, renderer: fakeRenderer().renderer });
    s.start({ mode: 'tempo', countInBars: 0, holdAtStart: false });
    expect(s.armed).toBe(false);
    expect(s.holdingFrom).toBeNull();
    s.pause();
    s.resume();
    // A pause is a new entry: the learner leads from here, so it holds.
    expect(s.holdingFrom).not.toBeNull();
    s.dispose();
  });

  it('latchStart: false — no input — never holds, not even after a pause', () => {
    const s = new ScoreSession({ model, renderer: fakeRenderer().renderer });
    s.start({ mode: 'tempo', countInBars: 0, latchStart: false });
    s.pause();
    s.resume();
    expect(s.holdingFrom).toBeNull();
    s.dispose();
  });
});

describe('the T8 review’s second round, in the session', () => {
  it('the guard’s question can answer no', () => {
    const s = new ScoreSession({ model, renderer: fakeRenderer().renderer });
    // A right-hand piece, practised with the left.
    s.start({ mode: 'tempo', countInBars: 1, hands: 'L' });
    expect(s.learnerHasNotes).toBe(false);
    s.dispose();
  });

  it('an app-led resume counts back in to the app’s next note, not the learner’s', () => {
    const s = new ScoreSession({ model: appIntro, renderer: fakeRenderer().renderer });
    s.start({ mode: 'tempo', countInBars: 0, hands: 'R' });
    s.pause();
    s.resume();
    const back = s.countingBackTo;
    expect(back).not.toBeNull();
    // Steps 0–2 are the left hand's, which the app plays; 3 is the learner's.
    expect(back).toBeLessThan(3);
    s.dispose();
  });

  it('a pause takes back the app’s notes that were queued and not yet heard', () => {
    const quick = makeModel([
      { onset: 0, notes: [note({ midi: 48, hand: 'L' })] },
      { onset: 0.2, notes: [note({ midi: 50, hand: 'L' })] },
      { onset: 1, notes: [note({ midi: 60 })] },
    ]);
    const stops = new Map<number, ReturnType<typeof vi.fn>>();
    const piano = {
      start: (n: { midi: number }) => {
        const stop = vi.fn();
        stops.set(n.midi, stop);
        return stop;
      },
      stop: () => undefined,
    } as unknown as Piano;
    const s = new ScoreSession({
      model: quick,
      renderer: fakeRenderer().renderer,
      piano,
      audioContext: { currentTime: 0 } as unknown as AudioContext,
    });
    s.start({ mode: 'tempo', countInBars: 0, hands: 'R' });
    flushFrame();
    // Both of the app's notes fall inside the look-ahead and are queued.
    expect([...stops.keys()].sort()).toEqual([48, 50]);
    s.pause();
    // The one still ahead is taken back; the one already due is left alone.
    expect(stops.get(50)).toHaveBeenCalled();
    expect(stops.get(48)).not.toHaveBeenCalled();
    s.dispose();
  });

  /**
   * …and it stays taken back (T33). Taking a note back also forgets that it was
   * scheduled, so that the resume plays it; and the clock of a paused run
   * stands still inside the look-ahead of that very note. So the next frame
   * scheduled it again, and it sounded into the pause after all. A run that
   * restarts paused at bar 1 (C2) would have played its own first notes.
   */
  it('a paused run hands the piano nothing more, frame after frame', () => {
    const quick = makeModel([
      { onset: 0, notes: [note({ midi: 48, hand: 'L' })] },
      { onset: 0.2, notes: [note({ midi: 50, hand: 'L' })] },
      { onset: 1, notes: [note({ midi: 60 })] },
    ]);
    const started: number[] = [];
    const piano = {
      start: (n: { midi: number }) => {
        started.push(n.midi);
        return vi.fn();
      },
      stop: () => undefined,
    } as unknown as Piano;
    const s = new ScoreSession({
      model: quick,
      renderer: fakeRenderer().renderer,
      piano,
      audioContext: { currentTime: 0 } as unknown as AudioContext,
    });
    s.start({ mode: 'tempo', countInBars: 0, hands: 'R' });
    flushFrame();
    s.pause();
    const before = started.length;
    flushFrame();
    flushFrame();
    expect(started.slice(before), 'notes handed to the piano while the run was paused').toEqual([]);
    s.dispose();
  });

  it('a second pause, during a resume’s count, keeps the learner-led decision', async () => {
    // The app's note first, then the learner's two.
    const tune = makeModel([
      { onset: 0, notes: [note({ midi: 48, hand: 'L' })] },
      { onset: 0.5, notes: [note({ midi: 60 })] },
      { onset: 1, notes: [note({ midi: 62 })] },
    ]);
    const s = new ScoreSession({ model: tune, renderer: fakeRenderer().renderer });
    s.start({ mode: 'tempo', countInBars: 0, hands: 'R' });
    // Let the app's note and the learner's first window go by on the clock.
    await new Promise((resolve) => setTimeout(resolve, 700));
    s.pause();
    s.resume();
    const holding = s.holdingFrom;
    expect(holding).not.toBeNull();
    // Paused again mid-count, where the rewound clock is back before the app's
    // note. Measured from there, the app would seem to lead and nothing hold.
    s.pause();
    s.resume();
    expect(s.holdingFrom).toBe(holding);
    s.dispose();
  });
});

/**
 * `Hear it` during a run (T33, C1): the run is set aside, paused, while the
 * demonstration plays, and comes back where it was with what it had judged.
 * It used to be stopped, and everything it had measured went with it.
 */
describe('a run set aside under a demonstration (T33, C1)', () => {
  it('comes back where it was, paused, with what it had judged', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    press(60);
    press(61);
    press(62);
    const step = session.state?.step ?? -1;
    expect(step, 'the run moved on').toBeGreaterThan(0);

    expect(session.suspend()).toBe(true);
    expect(session.hasSuspended).toBe(true);
    expect(session.suspendedStep).toBe(step);
    expect(session.running, 'nothing is the session’s run while it is set aside').toBe(false);
    session.start({ mode: 'listen' });
    flushFrame();
    expect(session.mode).toBe('listen');

    expect(session.restoreSuspended()).toBe(true);
    expect(session.hasSuspended).toBe(false);
    expect(session.mode).toBe('wait');
    expect(session.paused, 'back, and waiting for ▶').toBe(true);
    expect(session.state?.step).toBe(step);
    expect(session.state?.score.wrongNotesTotal, 'the wrong note it had judged').toBe(1);
    expect(finishes, 'neither the demonstration’s stop nor the run was reported as a finish').toHaveLength(0);

    session.resume();
    press(64);
    expect(session.state?.step, 'carries on from where it was').toBe(step + 1);
    session.dispose();
  });

  it('draws the cursor where the run was, not where the demonstration got to', () => {
    session.start({ mode: 'wait' });
    flushFrame();
    press(60);
    press(62);
    const step = session.state?.step ?? -1;
    session.suspend();
    session.start({ mode: 'wait' });
    flushFrame();
    press(60);
    expect(calls.showStep.at(-1), 'the demonstration moved the cursor').not.toBe(step);
    session.restoreSuspended();
    flushFrame();
    expect(calls.showStep.at(-1)).toBe(step);
    session.dispose();
  });

  it('has nothing to set aside with no run, and nothing to restore after it is dropped', () => {
    expect(session.suspend()).toBe(false);
    session.start({ mode: 'wait' });
    expect(session.suspend()).toBe(true);
    session.dropSuspended();
    expect(session.hasSuspended).toBe(false);
    expect(session.restoreSuspended()).toBe(false);
    session.dispose();
  });
});

/**
 * An option changed while a run is paused restarts it paused (T33, C2): the
 * restart is there, at its first step, and nothing sounds or clicks until the
 * learner's ▶.
 */
describe('a run started paused (T33, C2)', () => {
  it('schedules nothing and clicks nothing until it is resumed', () => {
    const starts = vi.spyOn(Metronome.prototype, 'start').mockImplementation(() => undefined);
    vi.spyOn(Metronome.prototype, 'stop').mockImplementation(() => undefined);
    vi.spyOn(Metronome.prototype, 'dispose').mockImplementation(() => undefined);
    // The app's left hand opens the piece, so an app-led run would sound at once.
    const intro = makeModel([
      { onset: 0, notes: [note({ midi: 48, hand: 'L' })] },
      { onset: 0.2, notes: [note({ midi: 50, hand: 'L' })] },
      { onset: 1, notes: [note({ midi: 60 })] },
    ]);
    const started: number[] = [];
    const piano = {
      start: (n: { midi: number }) => {
        started.push(n.midi);
        return vi.fn();
      },
      stop: () => undefined,
    } as unknown as Piano;
    const s = new ScoreSession({
      model: intro,
      renderer: fakeRenderer().renderer,
      piano,
      audioContext: fakeAudio(),
    });
    s.start({ mode: 'tempo', countInBars: 0, hands: 'R', metronome: true, startPaused: true });
    flushFrame();
    flushFrame();
    expect(s.running, 'the run is there').toBe(true);
    expect(s.paused, 'and waiting').toBe(true);
    expect(started, 'nothing handed to the piano').toEqual([]);
    expect(starts, 'no click').not.toHaveBeenCalled();
    s.resume();
    expect(s.paused).toBe(false);
    s.dispose();
    vi.restoreAllMocks();
  });
});
