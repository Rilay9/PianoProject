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
import { KEY_FLASH_MS, ScoreSession } from '../../src/score/ScoreSession';
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
