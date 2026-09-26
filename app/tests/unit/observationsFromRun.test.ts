// @vitest-environment jsdom
/**
 * One run leaves one record of what it measured (C1, backlog Q6's first test).
 *
 * The engine computed per-step outcomes, the onset delta of every timed note,
 * the hands, the technique measures — and the record kept seven numbers and
 * threw the rest away (backlog L15). Here each case plays a run through the
 * **real engine** on a fake clock, hands the score it finished with to the
 * **real Score screen** (the engraver and the session stubbed, as in
 * `scoreSummaryTruth`), lets the screen write it through the **real store**
 * into a fake IndexedDB, and reads the session row back the way a later reader
 * will. What is asserted is the stored row, not what the screen meant to pass.
 *
 * The rule under every case: a channel the run did not measure is stored as
 * `not measured`, never as a zero and never left out.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import type { EngineOptions, SessionScore } from '../../src/engine/types';
import type { CatalogItem } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import type { ScoreModel } from '../../src/score/types';
import { parseHash, type Router } from '../../src/router';

const SONG_ID = 'song.folk.hot-cross-buns';
const READ_ID = 'drill.reading.sight-reading-test';
const NOT_MEASURED = 'not measured';

/** Two 4/4 bars of quarter notes in the right hand. */
const TWO_BARS = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({ onset: index, notes: [note({ midi })] })),
);

/** Seven bars, so a run can go wrong in more bars than the hot spots keep. */
const SEVEN_BARS = makeModel(
  Array.from({ length: 28 }, (_, index) => ({ onset: index, notes: [note({ midi: 60 + (index % 5) })] })),
);

/** Two bars with a left-hand note under every right-hand one. */
const TWO_HANDS = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({
    onset: index,
    notes: [note({ midi }), note({ midi: 48, hand: 'L' })],
  })),
);

const { findItemSpy, modelRef, onFinishedRef, sessionRef, stripOptionsRef } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  modelRef: { current: null as ScoreModel | null },
  onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
  sessionRef: { current: null as null | { running: boolean; state: { step: number } | null } },
  stripOptionsRef: { current: null as null | { guide: string; fingers: boolean; flash: boolean } },
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: findItemSpy,
    loadCurriculum: () => Promise.reject(new Error('no curriculum in this test')),
  };
});

vi.mock('../../src/score/mxl', () => ({ toMusicXml: () => '<score-partwise/>' }));

vi.mock('../../src/score/OsmdView', () => ({
  OsmdView: class {
    load(): Promise<void> {
      return Promise.resolve();
    }
    extractModel(): unknown {
      return modelRef.current;
    }
    dispose(): void {
      /* nothing to tear down */
    }
  },
}));

vi.mock('../../src/score/WindowRenderer', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/score/WindowRenderer')>();
  return {
    ...original,
    WindowRenderer: class {
      stepIndex = 0;
      currentWindow = { fromMeasure: 0, toMeasure: 1 };
      static create(): Promise<unknown> {
        return Promise.resolve(new this());
      }
      showStep(): void {}
      setHandsFocus(): void {}
      setBarsPerWindow(): void {}
      setLoopRange(): void {}
      setRunning(): void {}
      fitToStage(): void {}
      refit(): void {}
      dispose(): void {}
      debugFit(): null {
        return null;
      }
    },
  };
});

vi.mock('../../src/score/ScoreSession', () => ({
  ScoreSession: class {
    running = false;
    paused = false;
    state: { step: number } | null = null;
    prepared = null;
    expectedNow: number[] = [];
    learnerHasNotes = true;
    hasSuspended = false;
    suspendedStep: number | null = null;
    constructor(options: {
      onFinished?: (score: SessionScore, looped: boolean) => void;
      stripOptions?: { guide: string; fingers: boolean; flash: boolean };
    }) {
      onFinishedRef.current = options.onFinished ?? null;
      stripOptionsRef.current = options.stripOptions ?? null;
      sessionRef.current = this;
    }
    loopForPrintedBars(): undefined {
      return undefined;
    }
    setStrip(): void {}
    setStripOptions(): void {}
    previewFirst(): void {}
    setPiano(): void {}
    start(): void {
      this.running = true;
      this.paused = false;
    }
    stop(): void {
      this.running = false;
    }
    suspend(): boolean {
      if (!this.running) return false;
      this.hasSuspended = true;
      this.suspendedStep = this.state?.step ?? 0;
      return true;
    }
    restoreSuspended(): void {
      this.hasSuspended = false;
      this.suspendedStep = null;
      this.running = true;
      this.paused = true;
    }
    dropSuspended(): void {
      this.hasSuspended = false;
      this.suspendedStep = null;
    }
    setMetronome(): void {}
    resume(): void {
      this.paused = false;
    }
    pause(): void {
      this.paused = true;
    }
    repaint(): void {}
    dispose(): void {}
  },
}));

const { ScoreScreen } = await import('../../src/ui/screens/ScoreScreen');
const { recentSessions, resetProgressForTest } = await import('../../src/data/progressStore');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

function songItem(): CatalogItem {
  return {
    id: SONG_ID,
    type: 'song',
    title: 'Hot Cross Buns',
    level: 0.3,
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: 'scores/authored/song.folk.hot-cross-buns.mxl',
  } as unknown as CatalogItem;
}

function readerItem(): CatalogItem {
  return {
    id: READ_ID,
    type: 'drill',
    title: 'Sight-read',
    level: 1,
    tracks: ['core'],
    concepts: ['sight-reading'],
    drill: { kind: 'sight-reading', params: { level: 1, bars: 2, hands: 'right' } },
  } as unknown as CatalogItem;
}

async function open(hash: string, model: ScoreModel = TWO_BARS): Promise<HTMLElement> {
  modelRef.current = model;
  const router = {
    route: { ...parseHash(hash), tab: 'library' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigateScore: vi.fn(),
    navigateChart: vi.fn(),
  } as unknown as Router;
  const section = ScoreScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.running).toBeDefined();
    expect(onFinishedRef.current).not.toBeNull();
  });
  return section;
}

function click(id: string): void {
  const control = document.getElementById(id);
  expect(control, `#${id} is not on the screen`).not.toBeNull();
  (control as HTMLElement).click();
}

function finish(score: SessionScore): void {
  if (sessionRef.current) sessionRef.current.running = false;
  onFinishedRef.current?.(score, false);
}

/** The one row the run left, read back from the store. */
async function storedRow(): Promise<SessionRow> {
  let rows: SessionRow[] = [];
  await vi.waitFor(async () => {
    rows = await recentSessions(5);
    expect(rows.length, 'the run left no row in the store').toBeGreaterThan(0);
  });
  expect(rows, 'one run, one row').toHaveLength(1);
  return rows[0] as SessionRow;
}

/** Moves a fake clock forward the way requestAnimationFrame ticks the engine. */
function until(h: ReturnType<typeof harness>, ms: number): void {
  while (h.clock.now() < ms) {
    h.clock.set(Math.min(ms, h.clock.now() + 16));
    h.engine.tick();
  }
}

/** A Wait run, every step played right, through the real engine. */
function waitRun(model: ScoreModel, options: Partial<EngineOptions> = {}): SessionScore {
  const h = harness(model, { mode: 'wait', ...options });
  h.engine.start();
  for (const step of h.engine.prepared.steps) {
    for (const midi of step.expected) {
      h.clock.advanceBy(400);
      h.play(midi);
      h.release(midi);
    }
  }
  expect(h.engine.state.finished, 'the Wait run did not reach its end').toBe(true);
  return h.engine.state.score;
}

/**
 * A Keep tempo run with no count-in, so music time is clock time: each step's
 * notes are played `offsetMs` after the step, except the steps named in `skip`
 * (not played) and `earlyStep` (its note played 300 ms before its step — twice
 * the window and less than a beat, which the engine calls early).
 */
function tempoRun(
  model: ScoreModel,
  plan: { offsetMs?: (index: number) => number; skip?: readonly number[]; earlyStep?: number } = {},
  options: Partial<EngineOptions> = {},
): SessionScore {
  const h = harness(model, { mode: 'tempo', countInBars: 0, ...options });
  h.engine.start();
  for (const step of h.engine.prepared.steps) {
    if (step.isEmpty || plan.skip?.includes(step.index)) continue;
    const at = step.index === plan.earlyStep ? step.tMs - 300 : step.tMs + (plan.offsetMs?.(step.index) ?? 0);
    until(h, at);
    for (const midi of step.expected) h.play(midi);
    until(h, at + 100);
    for (const midi of step.expected) h.release(midi);
  }
  until(h, (model.steps.length + 2) * BEAT_MS);
  expect(h.engine.state.finished, 'the Keep tempo run did not reach its end').toBe(true);
  return h.engine.state.score;
}

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })),
  );
  findItemSpy.mockReset();
  findItemSpy.mockResolvedValue(songItem());
  onFinishedRef.current = null;
  stripOptionsRef.current = null;
  updateSettings({ inputPriority: ['keys'], defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo' });
});

afterEach(() => {
  document.body.replaceChildren();
  updateSettings({
    inputPriority: [...DEFAULT_SETTINGS.inputPriority],
    defaultModeWithInput: DEFAULT_SETTINGS.defaultModeWithInput,
    defaultModeWithoutInput: DEFAULT_SETTINGS.defaultModeWithoutInput,
  });
  vi.unstubAllGlobals();
  clearFakeIndexedDb();
});

describe('what a run measured, by its own definitions', () => {
  it('a Wait run stores timing as not measured, with no deltas, and its pitch as steps', async () => {
    await open(`#/score/${SONG_ID}?mode=wait`);
    finish(waitRun(TWO_BARS));
    const row = await storedRow();
    // Wait has no clock, so nothing was late or early: not measured, not 0 ms.
    expect(row.timing).toBe(NOT_MEASURED);
    expect(row.early).toBe(NOT_MEASURED);
    expect(row.steps?.timing).toBe(NOT_MEASURED);
    expect(row.pitch).toEqual({ definition: 'wait-steps', right: 8, of: 8, estimated: false });
    expect(row.steps?.codes).toBe('hhhhhhhh');
  });

  it('a Keep tempo run stores a delta per timed note and marks the early one', async () => {
    await open(`#/score/${SONG_ID}`);
    // Every note 20 ms late except the fourth, played 300 ms early.
    finish(tempoRun(TWO_BARS, { offsetMs: () => 20, earlyStep: 3 }));
    const row = await storedRow();
    expect(row.pitch).toEqual({ definition: 'tempo-notes', right: 7, of: 8, estimated: false });
    expect(row.early).toBe(1);
    const timing = row.steps?.timing;
    expect(Array.isArray(timing), 'no per-note timing on a timed run').toBe(true);
    // Flattened [step, deltaMs] pairs: seven on-time notes and the early one.
    const pairs = timing as number[];
    expect(pairs).toHaveLength(16);
    for (let i = 0; i < pairs.length; i += 2) {
      const [step, delta] = [pairs[i] ?? -1, pairs[i + 1] ?? 0];
      expect(delta, `step ${String(step)}`).toBe(step === 3 ? -300 : 20);
    }
    expect(row.steps?.early).toEqual([3, 62]);
    expect(row.steps?.codes).toBe('hhhehhhh');
    expect(row.timing).toMatchObject({ n: 8 });
  });

  it('the per-step array holds every step, not the worst five bars', async () => {
    await open(`#/score/${SONG_ID}`, SEVEN_BARS);
    // The first note of every one of the seven bars left out.
    const skip = [0, 4, 8, 12, 16, 20, 24];
    const score = tempoRun(SEVEN_BARS, { skip });
    // The sheet's hot spots keep five, which is what the record used to be
    // able to say at best (and it kept none of them).
    expect(score.hotSpots).toHaveLength(5);
    finish(score);
    const row = await storedRow();
    expect(row.steps?.codes).toHaveLength(28);
    expect(row.steps?.codes).toBe('mhhh'.repeat(7));
    expect(row.steps?.from).toBe(0);
    // Where each bar starts in the codes, and which printed bar it is.
    expect(row.steps?.measures).toEqual([0, 0, 4, 1, 8, 2, 12, 3, 16, 4, 20, 5, 24, 6]);
  });
});

describe('the conditions it was played under', () => {
  it('a right-hand run stores R, and that the app played the left', async () => {
    await open(`#/score/${SONG_ID}?hands=R`, TWO_HANDS);
    finish(tempoRun(TWO_HANDS, {}, { hands: 'R' }));
    const row = await storedRow();
    expect(row.hands).toEqual({ played: 'R', appPlayed: 'other hand' });
    // The right hand's eight notes, not both hands' sixteen.
    expect(row.pitch).toMatchObject({ right: 8, of: 8 });
  });

  it('a guided run stores the guide and what else the keys showed', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(tempoRun(TWO_BARS));
    const row = await storedRow();
    expect(row.keys).toEqual({ view: 'strip', guide: 'next', fingers: true, names: false });
  });

  it('a sight-reading drill opens with the guide off, and says so on the record', async () => {
    findItemSpy.mockResolvedValue(readerItem());
    await open(`#/score/${READ_ID}`);
    expect(stripOptionsRef.current?.guide, 'the keys showed the next note during a reading drill').toBe('off');
    finish(tempoRun(TWO_BARS));
    const row = await storedRow();
    expect(row.keys?.guide).toBe('off');
  });

  it('grace notes off is stored, with the input and its window', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(tempoRun(TWO_BARS));
    const row = await storedRow();
    expect(row.graceNotes).toBe(false);
    expect(row.input).toEqual({ source: 'keys', toleranceMs: 150, latencyMs: 0 });
    expect(row.range).toEqual({ fromMeasure: 0, toMeasure: 1 });
    expect(row.definitions).toBe(1);
  });
});

describe('what the learner had heard', () => {
  it('a sight-read heard before its first run is recorded, flagged unseen: false', async () => {
    findItemSpy.mockResolvedValue(readerItem());
    await open(`#/score/${READ_ID}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    click('score-hear');
    click('score-hear');
    click('score-play');
    finish(tempoRun(TWO_BARS));
    const row = await storedRow();
    expect(row.unseen).toBe(false);
    expect(row.demonstrated).toBe(false);
  });

  it('a first reading of a phrase nobody played is unseen: true', async () => {
    findItemSpy.mockResolvedValue(readerItem());
    await open(`#/score/${READ_ID}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    click('score-play');
    finish(tempoRun(TWO_BARS));
    const row = await storedRow();
    expect(row.unseen).toBe(true);
  });

  it('a demonstrated take stores demonstrated: true and no performance flag', async () => {
    await open(`#/score/${SONG_ID}?performance=1`);
    click('score-play');
    if (sessionRef.current) sessionRef.current.state = { step: 4 };
    click('score-hear');
    click('score-hear');
    finish(tempoRun(TWO_BARS));
    const row = await storedRow();
    expect(row.demonstrated).toBe(true);
    expect(row.performance).toBeUndefined();
    // A piece is not a generated phrase: first sight is not a claim it makes.
    expect(row.unseen).toBeUndefined();
  });
});
