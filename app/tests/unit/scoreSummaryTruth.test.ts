// @vitest-environment jsdom
/**
 * The summary sheet and the record say only what the run measured (T37).
 *
 * The reviewer's boundary 6, as the owner's rule for this wave: never display
 * or record evidence the engine did not actually measure. Each `describe` here
 * is one of the brief's decided items, driven through the real Score screen
 * with the engraver, the session and the store stubbed — the stubs are the
 * ones `scoreTourRoute.test.ts` uses, repeated because mocks belong to the file
 * that declares them. What is asserted is what the learner reads on the sheet
 * and what reaches `recordRun`, which is what the progress record keeps.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import { timingStats } from '../../src/engine/Scoring';
import { SUMMARY_TEXT } from '../../src/ui/help';
import type { RecordedNote, SessionScore } from '../../src/engine/types';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProgressRow, SessionRow } from '../../src/data/db';
import type { RunResult } from '../../src/data/progressStore';
import { parseHash, type Router } from '../../src/router';
import { generateSightReading, sightReadingOptionsFor } from '../../src/engine/sightReading';
import { heldToRung } from '../../src/engine/readingControls';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

const SONG_ID = 'song.folk.hot-cross-buns';
const READ_ID = 'drill.reading.sight-reading-test';

/** Two full 4/4 bars of quarter notes. */
const MODEL = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({
    onset: index,
    notes: [note({ midi })],
  })),
);

const { findItemSpy, curriculumRef, loadedXml, onFinishedRef, sessionRef, recordRunSpy, sessionsSpy } =
  vi.hoisted(() => ({
    findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
    curriculumRef: { current: null as Curriculum | null },
    /** Every MusicXML the screen handed the engraver, newest last. */
    loadedXml: [] as string[],
    onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
    /**
     * The screen's session, so a test can say where the run is (T40). Only
     * what `Hear it` over a run reads: the step, and whether one is going.
     */
    sessionRef: { current: null as null | { running: boolean; state: { step: number } | null } },
    recordRunSpy: vi.fn((result: RunResult): Promise<ProgressRow> =>
      Promise.resolve({
        itemId: result.itemId,
        status: result.passed ? 'passed' : 'started',
        // A run that measured nothing sets no best (C1).
        bestAccuracy: typeof result.accuracy === 'number' ? result.accuracy : 0,
        bestTempoPct: 0,
        attempts: 1,
        lastPracticedAt: '',
        minutes: 0,
        passedOn: [],
      }),
    ),
    sessionsSpy: vi.fn((): Promise<SessionRow[]> => Promise.resolve([])),
  }));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: findItemSpy,
    loadCurriculum: () =>
      curriculumRef.current
        ? Promise.resolve(curriculumRef.current)
        : Promise.reject(new Error('no curriculum in this test')),
  };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: recordRunSpy,
  sessionsForItem: sessionsSpy,
  MASTER_DAYS: 2,
}));

vi.mock('../../src/score/mxl', () => ({ toMusicXml: () => '<score-partwise/>' }));

vi.mock('../../src/score/OsmdView', () => ({
  OsmdView: class {
    load(xml: string): Promise<void> {
      loadedXml.push(xml);
      return Promise.resolve();
    }
    extractModel(): unknown {
      return MODEL;
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
    /**
     * Enough of T33's set-aside for `Hear it` over a run (T40): the run goes
     * aside at its step and comes back paused there. Nothing is played.
     */
    hasSuspended = false;
    suspendedStep: number | null = null;
    constructor(options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      onFinishedRef.current = options.onFinished ?? null;
      sessionRef.current = this;
    }
    loopForPrintedBars(): undefined {
      return undefined;
    }
    setStrip(): void {}
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

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

function lesson(id: string, minAccuracy: number, minTempoPct: number): Lesson {
  return {
    id,
    title: `Rung ${id}`,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [],
    songOptions: [SONG_ID],
    mastery: { minAccuracy, minTempoPct }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
  };
}

/** The song on two rungs: 1.1 asks 90 % at 80 %, 2.1 asks 97 % at 90 %. */
const CURRICULUM = {
  version: 1,
  tracks: [],
  stages: [
    {
      number: 1,
      units: [{ id: 'u1', lessons: [lesson('1.1', 0.9, 0.8)] }],
    },
    {
      number: 2,
      units: [{ id: 'u2', lessons: [lesson('2.1', 0.97, 0.9)] }],
    },
  ],
} as unknown as Curriculum;

function songItem(tags: string[] = []): CatalogItem {
  return {
    id: SONG_ID,
    type: 'song',
    title: 'Hot Cross Buns',
    level: 0.3,
    tracks: ['core'],
    concepts: [],
    tags,
    file: 'scores/authored/song.folk.hot-cross-buns.mxl',
  } as unknown as CatalogItem;
}

function readerItem(params: Record<string, unknown>): CatalogItem {
  return {
    id: READ_ID,
    type: 'drill',
    title: 'Sight-read',
    level: 1,
    tracks: ['core'],
    concepts: ['sight-reading'],
    drill: { kind: 'sight-reading', params },
  } as unknown as CatalogItem;
}

function routerFor(hash: string): Router {
  return {
    route: { ...parseHash(hash), tab: 'plan' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigateScore: vi.fn(),
    navigateChart: vi.fn(),
  } as unknown as Router;
}

/** The router the last `open` built, so a test can read where a control sent it. */
let lastRouter: Router | null = null;

async function open(hash: string): Promise<HTMLElement> {
  lastRouter = routerFor(hash);
  const section = ScoreScreen(lastRouter);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.running).toBeDefined();
    expect(onFinishedRef.current).not.toBeNull();
  });
  return section;
}

/**
 * What the engine keeps of the notes it took: one right note per step.
 *
 * A finished run's `notes` are every note that reached the engine, and since
 * T40 the sheet reads them to know whether anything was heard at all. The
 * default run below used to carry none beside eight hits, which no engine can
 * produce.
 */
function heardNotes(count: number): RecordedNote[] {
  return Array.from({ length: count }, (_, index) => ({
    midi: 64,
    velocity: 80,
    tMs: index * 500,
    stepIndex: index,
    ok: true,
    deltaMs: 0,
  }));
}

/** A run the app heard nothing of: every note missed, nothing taken. */
const NOTHING_HEARD: Partial<SessionScore> = {
  hits: 0,
  correctSteps: 0,
  accuracy: 0,
  missedTotal: 8,
  timing: timingStats([]),
  hotSpots: [
    { measureIndex: 0, misses: 4, wrongs: 0 },
    { measureIndex: 1, misses: 4, wrongs: 0 },
  ],
  notes: [],
};

function click(id: string): void {
  const control = document.getElementById(id);
  expect(control, `#${id} is not on the screen`).not.toBeNull();
  (control as HTMLElement).click();
}

/** A finished run; the parts a test does not name are a clean Keep tempo run at full speed. */
function run(partial: Partial<SessionScore>): SessionScore {
  return {
    mode: 'tempo',
    tempoPct: 100,
    totalSteps: 8,
    correctSteps: 8,
    expectedNotes: 8,
    hits: 8,
    missedTotal: 0,
    wrongNotesTotal: 0,
    accuracy: 1,
    accuracyEstimated: false,
    lenientChordSteps: 0,
    timing: timingStats([10, -20, 5, 0, 15, -5, 0, 10]),
    hotSpots: [],
    durationMs: 8_000,
    loops: 0,
    rolledChordSteps: 0,
    notes: heardNotes(8),
    ...partial,
  };
}

function finish(score: SessionScore): void {
  expect(onFinishedRef.current).not.toBeNull();
  // The engine reports its end with the run already over.
  if (sessionRef.current) sessionRef.current.running = false;
  onFinishedRef.current?.(score, false);
}

/** The sentences on the sheet under its heading (T40). */
function sheetNote(): string {
  return document.querySelector('#summary-note')?.textContent ?? '';
}

function stat(name: string): string | null {
  return document.querySelector(`#score-summary [data-stat="${name}"]`)?.textContent ?? null;
}

function heading(): string {
  return document.querySelector('#score-summary h2')?.textContent ?? '';
}

function lastRecorded(): RunResult {
  const calls = recordRunSpy.mock.calls;
  expect(calls.length, 'nothing was recorded').toBeGreaterThan(0);
  return calls[calls.length - 1]?.[0] as RunResult;
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })),
  );
  findItemSpy.mockReset();
  findItemSpy.mockResolvedValue(songItem());
  recordRunSpy.mockClear();
  sessionsSpy.mockReset();
  sessionsSpy.mockResolvedValue([]);
  curriculumRef.current = null;
  loadedXml.length = 0;
  onFinishedRef.current = null;
  // A judging input, so a run is recorded the moment it ends; the self-report
  // cases set `none` themselves.
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
});

describe('1 and 3: a Wait for me run carries no tempo', () => {
  it('passes nothing on the slider, and says the notes and not the pulse', async () => {
    await open(`#/score/${SONG_ID}?mode=wait`);
    // Every step right, the slider at full speed, and nothing timed: what a
    // clean Wait run is. It used to read *Mastered*, "100% of written" and
    // "0 ms off the beat on average".
    finish(run({ mode: 'wait', tempoPct: 100, timing: timingStats([]) }));
    expect(heading()).toBe(SUMMARY_TEXT.waitNotesReady);
    expect(stat('accuracy')).toBe('100%');
    expect(stat('tempo')).toBe(SUMMARY_TEXT.waitTempo);
    expect(stat('timing'), 'a timing line over a run that timed nothing').toBeNull();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    const recorded = lastRecorded();
    expect(recorded.passed).toBe(false);
    expect(recorded.masterEligible).toBe(false);
    expect(recorded.tempoMeasured).toBe(false);
  });

  it('a Wait run short of the notes is simply finished, and still says why it cannot pass', async () => {
    await open(`#/score/${SONG_ID}?mode=wait`);
    finish(run({ mode: 'wait', tempoPct: 70, accuracy: 0.5, correctSteps: 4, timing: timingStats([]) }));
    expect(heading()).toBe('Run finished');
    expect(stat('tempo')).toBe(SUMMARY_TEXT.waitTempo);
  });

  it('a Keep tempo run says its tempo and its timing, both measured', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(run({ tempoPct: 90, accuracy: 0.95, hits: 8 }));
    expect(stat('tempo')).toBe('90% of written');
    expect(stat('timing')).not.toBeNull();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(lastRecorded().tempoMeasured).toBe(true);
  });

  it('a tempo the converter made up is "of the suggested tempo", not "of written"', async () => {
    findItemSpy.mockResolvedValue(songItem(['pdmx', 'tempo-defaulted']));
    await open(`#/score/${SONG_ID}`);
    finish(run({ tempoPct: 80 }));
    expect(stat('tempo')).toBe('80% of the suggested tempo');
  });
});

describe('2: the sheet says Mastered only once the store does', () => {
  it('heads a first master-standard day "Mastery run 1 of 2"', async () => {
    recordRunSpy.mockImplementationOnce((result: RunResult) =>
      Promise.resolve({
        itemId: result.itemId,
        status: 'passed',
        bestAccuracy: 1,
        bestTempoPct: 100,
        attempts: 3,
        lastPracticedAt: '',
        minutes: 1,
        passedOn: ['2026-09-20', '2026-09-24'],
        masteredOn: ['2026-09-25'],
      }),
    );
    await open(`#/score/${SONG_ID}`);
    finish(run({}));
    // Two pass days and one master day: the store says not yet, so the sheet
    // must not say *Mastered* — which is what it said, before the write.
    await vi.waitFor(() => expect(heading()).toBe('Mastery run 1 of 2'));
    expect(heading()).not.toBe('Mastered');
  });

  it('heads the second one "Mastered", because the store now says so', async () => {
    recordRunSpy.mockImplementationOnce((result: RunResult) =>
      Promise.resolve({
        itemId: result.itemId,
        status: 'mastered',
        bestAccuracy: 1,
        bestTempoPct: 100,
        attempts: 4,
        lastPracticedAt: '',
        minutes: 1,
        passedOn: ['2026-09-24', '2026-09-25'],
        masteredOn: ['2026-09-24', '2026-09-25'],
      }),
    );
    await open(`#/score/${SONG_ID}`);
    finish(run({}));
    await vi.waitFor(() => expect(heading()).toBe('Mastered'));
  });
});

describe('4: the self-report is recorded', () => {
  beforeEach(() => {
    updateSettings({ inputPriority: ['none'] });
  });

  it('writes the answer with the run, as a pass in the learner’s own judgement', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(run(NOTHING_HEARD));
    // Nothing is written until the question is answered, or the run would go
    // on the record without the one thing the sheet asked for.
    expect(recordRunSpy).not.toHaveBeenCalled();
    document.querySelector<HTMLButtonElement>('#summary-self-clean')?.click();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    const recorded = lastRecorded();
    expect(recorded.selfReport).toBe('clean');
    expect(recorded.passed).toBe(true);
    expect(recorded.selfPassed).toBe(true);
    expect(recorded.masterEligible).toBe(false);
    expect(recorded.tempoMeasured).toBe(false);
    await vi.waitFor(() =>
      expect(document.querySelector('#score-status')?.textContent).toBe(SUMMARY_TEXT.selfReportClean),
    );
    // One answer per run.
    document.querySelector<HTMLButtonElement>('#summary-self-rough')?.click();
    expect(recordRunSpy).toHaveBeenCalledTimes(1);
  });

  it('a Rough answer is recorded and is not a pass', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(run(NOTHING_HEARD));
    document.querySelector<HTMLButtonElement>('#summary-self-rough')?.click();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(lastRecorded().selfReport).toBe('rough');
    expect(lastRecorded().passed).toBe(false);
  });

  // Revised by T40. This was "a run left without an answer is still recorded,
  // without one": the row it wrote said accuracy 0 and every note missed, for
  // a run nothing had listened to — a measurement nobody took, which the
  // Progress history printed as "0%". The reviewer's rule is that nothing is
  // recorded as a measured run; the answer is the only evidence there is.
  it('a run left without an answer is not recorded at all', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(run(NOTHING_HEARD));
    click('summary-done');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(recordRunSpy, 'a run nothing heard went on the record unanswered').not.toHaveBeenCalled();
  });

  it('nor when the next run is started instead', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(run(NOTHING_HEARD));
    click('summary-again');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(recordRunSpy).not.toHaveBeenCalled();
  });

  it('a rhythm run answered Clean is still not a pass of the piece', async () => {
    // Found by T40 on the self-report path: the answer replaced `passed`
    // wholesale, so *Clean* after a rhythm-only run recorded the piece as
    // passed, which `05` §3a says a rhythm run can never do.
    await open(`#/score/${SONG_ID}`);
    finish(run({ ...NOTHING_HEARD, rhythmOnly: true }));
    click('summary-self-clean');
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(lastRecorded().selfReport).toBe('clean');
    expect(lastRecorded().passed).toBe(false);
    expect(lastRecorded().selfPassed).toBeUndefined();
  });
});

describe('T40 1: a run the app heard nothing of is not measured', () => {
  it('says so, with a judging input chosen, and prints no accuracy, misses or weak bars', async () => {
    // Screen keys chosen, and no note reached the engine: the rule reads what
    // was heard, not what was selected (the brief: a learner with MIDI
    // selected can still play nothing).
    await open(`#/score/${SONG_ID}`);
    finish(run(NOTHING_HEARD));
    expect(heading()).toBe('Not measured');
    expect(sheetNote()).toBe(SUMMARY_TEXT.notMeasured);
    expect(stat('accuracy'), 'an accuracy over a run nothing heard').toBeNull();
    expect(stat('missed'), 'misses nobody listened for').toBeNull();
    expect(stat('tempo'), 'a tempo nobody played to').toBeNull();
    expect(stat('weakest-bars')).toBeNull();
    expect(document.getElementById('summary-loop'), 'weak bars offered to loop').toBeNull();
    // Part G's answer for a run without an instrument, and nothing written
    // until it is given.
    expect(document.getElementById('summary-selfreport')).not.toBeNull();
    expect(recordRunSpy).not.toHaveBeenCalled();
  });

  it('with nothing listening, says how to be heard next time', async () => {
    updateSettings({ inputPriority: ['none'] });
    await open(`#/score/${SONG_ID}`);
    finish(run(NOTHING_HEARD));
    expect(heading()).toBe('Not measured');
    expect(sheetNote()).toBe(`${SUMMARY_TEXT.notMeasured} ${SUMMARY_TEXT.notMeasuredNoInput}`);
    expect(stat('accuracy')).toBeNull();
    expect(document.getElementById('summary-selfreport')).not.toBeNull();
  });

  it('one note heard is a measured run, played badly, and is recorded as one', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(
      run({
        ...NOTHING_HEARD,
        hits: 1,
        accuracy: 0.125,
        missedTotal: 7,
        timing: timingStats([20]),
        notes: heardNotes(1),
      }),
    );
    expect(heading()).toBe('Run finished');
    expect(stat('accuracy')).toBe('13%');
    expect(stat('missed')).toBe('7');
    expect(document.getElementById('summary-selfreport')).toBeNull();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(lastRecorded().accuracy).toBe(0.125);
    expect(lastRecorded().selfReport).toBeUndefined();
  });
});

describe('6: the run is judged by the rung that opened the screen', () => {
  beforeEach(() => {
    curriculumRef.current = CURRICULUM;
  });

  it('opened from 2.1, it is held to 2.1’s numbers and stored as 2.1’s run', async () => {
    const section = await open(`#/score/${SONG_ID}?from=2.1`);
    // Let the rung's lookup land before the run ends.
    await vi.waitFor(() => expect(section.dataset.running).toBeDefined());
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({ accuracy: 0.93, hits: 7 }));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    const recorded = lastRecorded();
    expect(recorded.lessonId).toBe('2.1');
    // 93 % passes 1.1 (90 %) and not 2.1 (97 %).
    expect(recorded.passed).toBe(false);
  });

  // Revised (C1; design §10 C1). This was "opened from nowhere, the first rung
  // listing it still judges it": with no `?from=` the run was stored as the
  // first listing rung's and held to its numbers — a rung nobody chose, whose
  // prose the learner never opened. A run from nowhere records no opening
  // rung and is judged by Part G's defaults (the Settings pair).
  it('opened from nowhere, no rung judges it: it is held to the defaults and stored with no rung', async () => {
    // The song first listed on a rung that asks 97 %, so the first-listing
    // rule and the defaults give different answers at 93 %.
    curriculumRef.current = {
      ...CURRICULUM,
      stages: [{ number: 2, units: [{ id: 'u2', lessons: [lesson('2.1', 0.97, 0.9)] }] }],
    } as unknown as Curriculum;
    await open(`#/score/${SONG_ID}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({ accuracy: 0.93, hits: 7 }));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(lastRecorded().lessonId, 'a rung nobody opened was stored as the one that judged it').toBeUndefined();
    expect(lastRecorded().passed).toBe(true);
  });

  // Added (C3 item 0b, L50). Today opened its cards with no rung in the
  // route, so since C1 a Today run was judged by the defaults and stored with
  // no rung. Today now names the rung it chose and the slot, each as its own
  // parameter: not `from`, which also sends Back to the rung's page.
  it('opened from a Today card, it is held to the rung Today chose and stores that rung and the slot', async () => {
    const section = await open(`#/score/${SONG_ID}?rung=2.1&slot=new`);
    await vi.waitFor(() => expect(section.dataset.running).toBeDefined());
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({ accuracy: 0.93, hits: 7 }));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    const recorded = lastRecorded();
    expect(recorded.lessonId, 'a Today run was stored with no rung').toBe('2.1');
    expect(recorded.opened).toMatchObject({ rung: '2.1', slot: 'new' });
    // 93 % passes the defaults (90 % at 80 %) and not 2.1 (97 %).
    expect(recorded.passed).toBe(false);
    // Back is Today's, not the rung's page: the rung judges, it does not steer.
    click('summary-done');
    const spies = lastRouter as unknown as { navigateLesson: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> };
    expect(spies.navigateLesson).not.toHaveBeenCalled();
    expect(spies.navigate).toHaveBeenCalledWith('plan');
  });
});

describe('7 and 8: a sight-read is the phrase its row asks for, recorded once', () => {
  it('is written in the key, metre and tempo its row names', async () => {
    findItemSpy.mockResolvedValue(
      readerItem({ level: 3, bars: 2, hands: 'both', fifths: 1, timeSig: '6/8', bpm: 60 }),
    );
    await open(`#/score/${READ_ID}?seed=4242`);
    const xml = loadedXml.find((text) => text.includes('Sight-reading level')) ?? '';
    expect(xml).toContain('<beats>6</beats>');
    expect(xml).toContain('<beat-type>8</beat-type>');
    expect(xml).toContain('<fifths>1</fifths>');
    expect(xml).toContain('<per-minute>60</per-minute>');
  });

  it('keeps the phrase’s seed on the run, fresh open or not', async () => {
    findItemSpy.mockResolvedValue(readerItem({ level: 1, bars: 2, hands: 'right' }));
    await open(`#/score/${READ_ID}`);
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(typeof lastRecorded().seed).toBe('number');
  });

  // Revised (C1). T37 did not record a re-read of a phrase already on the
  // record, so the minutes and the attempt were lost with the evidence. The
  // reviewer's decision 3 for heard runs is the same rule: recorded, flagged
  // `unseen: false`, and kept out of the evidence it cannot support — here the
  // reading drill's pass.
  it('re-opening a phrase already on the record is kept as practice, not a new first attempt', async () => {
    findItemSpy.mockResolvedValue(readerItem({ level: 1, bars: 2, hands: 'right' }));
    sessionsSpy.mockResolvedValue([{ itemId: READ_ID, seed: 777 } as unknown as SessionRow]);
    await open(`#/score/${READ_ID}?seed=777`);
    await vi.waitFor(() => expect(sessionsSpy).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy, 'a re-read went unrecorded, minutes and all').toHaveBeenCalledTimes(1));
    expect(lastRecorded().unseen).toBe(false);
    expect(lastRecorded().seed).toBe(777);
    expect(lastRecorded().passed, 'a re-read passed the reading drill').toBe(false);
    // On the sheet (T40). It was read off `#score-status`, the header's line,
    // which the summary covers and which is cut after twenty-odd characters at
    // 342 px: seen on the glass, the learner could not read it.
    expect(sheetNote()).toBe(SUMMARY_TEXT.sightReadRepeat);
  });

  // Added (C5, S8): a first reading at the master standard is a reading, and
  // the sheet never counts it towards mastering the row, whatever the store
  // hands back — a generated phrase carries no mastery.
  it('a first reading at the full tempo is not a mastery run of the row', async () => {
    findItemSpy.mockResolvedValue(readerItem({ level: 1, bars: 2, hands: 'right' }));
    await open(`#/score/${READ_ID}`);
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(lastRecorded().masterEligible, 'a sight-read was offered to the store as a mastery run').toBe(false);
    await vi.waitFor(() => expect(heading()).toBe('Passed'));
  });

  it('a different phrase of the same row is a first attempt', async () => {
    findItemSpy.mockResolvedValue(readerItem({ level: 1, bars: 2, hands: 'right' }));
    sessionsSpy.mockResolvedValue([{ itemId: READ_ID, seed: 777 } as unknown as SessionRow]);
    await open(`#/score/${READ_ID}?seed=778`);
    await vi.waitFor(() => expect(sessionsSpy).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(lastRecorded().seed).toBe(778);
  });
});

// Added (C4 items 1 and 2): Today's reader names the phrase's recipe in the
// route (`?recipe=`: what it moved from the row, and whether it is the easy one
// on purpose). The screen writes that phrase and keeps the recipe on the run,
// which is how the reader knows the learner's last recipe tomorrow; and every
// phrase it draws for itself — a fresh open, *New phrase* — is one no stored
// run carries.
describe('C4: the recipe reaches the phrase and the record; a drawn phrase is one nobody has played', () => {
  const PARAMS = { level: 2, bars: 2, hands: 'right', eighths: true, skips: true };
  /** `Math.random` answering these seeds, in order, then anything. */
  function randomSeeds(...seeds: number[]): void {
    const queue = [...seeds];
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const next = queue.shift();
      return next === undefined ? 0.123456 : (next + 0.5) / 0xffffffff;
    });
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('the recipe in the route writes its phrase, and the run keeps the recipe', async () => {
    findItemSpy.mockResolvedValue(readerItem(PARAMS));
    await open(`#/score/${READ_ID}?seed=4242&recipe=${encodeURIComponent('position:1,easy:1')}`);
    const xml = loadedXml.find((text) => text.includes('Sight-reading level')) ?? '';
    const own = generateSightReading(sightReadingOptionsFor(PARAMS, 4242)).musicXml;
    const moved = generateSightReading(sightReadingOptionsFor({ ...PARAMS, position: true }, 4242)).musicXml;
    expect(xml, 'the screen wrote the row’s own phrase over the recipe the route named').not.toBe(own);
    expect(xml).toBe(moved);
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(lastRecorded().recipe, 'the run kept no recipe').toEqual({ row: READ_ID, moved: { position: true }, easy: true });
  });

  it('a sight-read opened with no recipe keeps the row’s own', async () => {
    findItemSpy.mockResolvedValue(readerItem(PARAMS));
    await open(`#/score/${READ_ID}?seed=4242`);
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(lastRecorded().recipe).toEqual({ row: READ_ID });
  });

  // Added (C4c; S16's app half, C4b's `heldToRung`): the phrase a rung opens is
  // its row held to what that rung has taught, so 2.2's row stays inside C
  // position until 2.5 teaches leaving it. Before C4c the screen wrote the row
  // as it stands whatever rung opened it.
  it('a sight-read opened from a rung is its row held to what that rung has taught; from nowhere, the row as it stands', async () => {
    const HELD = {
      version: 1,
      tracks: [],
      stages: [{ number: 2, units: [{ id: 'u2', lessons: [lesson('2.2', 0.9, 0.7), lesson('2.5', 0.9, 0.7)] }] }],
    } as unknown as Curriculum;
    const order = ['2.2', '2.5'];
    const taughtAt22 = (demand: string): boolean => {
      const at = VOCABULARY_V0.demands.find((d) => d.id === demand)?.taughtAt;
      return at !== null && at !== undefined && order.indexOf(at) >= 0 && order.indexOf(at) <= order.indexOf('2.2');
    };
    curriculumRef.current = HELD;
    findItemSpy.mockResolvedValue(readerItem(PARAMS));
    const own = generateSightReading(sightReadingOptionsFor(PARAMS, 4242)).musicXml;
    const held = generateSightReading(heldToRung(sightReadingOptionsFor(PARAMS, 4242), taughtAt22)).musicXml;
    expect(held, 'this seed’s phrase never leaves C position, so the case proves nothing').not.toBe(own);
    await open(`#/score/${READ_ID}?seed=4242&from=2.2`);
    await vi.waitFor(() => expect(loadedXml.some((text) => text.includes('Sight-reading level'))).toBe(true));
    expect(loadedXml.find((text) => text.includes('Sight-reading level')), 'the rung’s phrase was the row as it stands').toBe(held);
    loadedXml.length = 0;
    await open(`#/score/${READ_ID}?seed=4242`);
    await vi.waitFor(() => expect(loadedXml.some((text) => text.includes('Sight-reading level'))).toBe(true));
    expect(loadedXml.find((text) => text.includes('Sight-reading level'))).toBe(own);
  });

  it('New phrase draws a seed no stored run carries, and keeps the recipe', async () => {
    findItemSpy.mockResolvedValue(readerItem(PARAMS));
    sessionsSpy.mockResolvedValue([
      { itemId: READ_ID, seed: 111 } as unknown as SessionRow,
      { itemId: READ_ID, seed: 222 } as unknown as SessionRow,
    ]);
    await open(`#/score/${READ_ID}?seed=4242&rung=2.2&slot=sightreading&recipe=${encodeURIComponent('hands:both')}`);
    await vi.waitFor(() => expect(sessionsSpy).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({}));
    randomSeeds(111, 222, 333);
    click('summary-new-phrase');
    const navigate = (lastRouter as unknown as { navigateScore: ReturnType<typeof vi.fn> }).navigateScore;
    const [, options] = navigate.mock.calls[0] as [string, { seed?: number; recipe?: unknown }];
    expect([111, 222], 'a new phrase was one already on the record').not.toContain(options.seed);
    expect(options.seed).toBe(333);
    expect(options.recipe).toEqual({ moved: { hands: 'both' } });
  });

  it('a fresh open draws a seed no stored run carries, so its first run is a first reading', async () => {
    findItemSpy.mockResolvedValue(readerItem(PARAMS));
    sessionsSpy.mockResolvedValue([{ itemId: READ_ID, seed: 111 } as unknown as SessionRow]);
    randomSeeds(111, 333);
    await open(`#/score/${READ_ID}`);
    await vi.waitFor(() => expect(sessionsSpy).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(lastRecorded().seed, 'a fresh open drew a phrase already on the record').not.toBe(111);
    expect(lastRecorded().unseen).toBe(true);
  });
});

describe('5: an early note reads as early', () => {
  it('has a line of its own, and its bar is one of the weakest', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(
      run({
        hits: 6,
        accuracy: 0.75,
        early: 2,
        hotSpots: [{ measureIndex: 1, misses: 0, wrongs: 0, early: 2 }],
      }),
    );
    expect(stat('early')).toBe('2 right notes played too soon');
    expect(stat('wrong-notes')).toBe('0');
    expect(stat('missed')).toBe('0');
    expect(stat('weakest-bars')).not.toBeNull();
  });
});

describe('T40 2: a sight-read heard before its first run is not a first reading', () => {
  beforeEach(() => {
    findItemSpy.mockResolvedValue(readerItem({ level: 1, bars: 2, hands: 'right' }));
  });

  // Revised (C1; reviewer decision 3). T40 made this run unrecorded: the
  // reading was not a first reading, and so nothing of it was kept — its
  // minutes, its attempt and, on Today's read, the day. It is recorded now,
  // flagged `unseen: false`, and the flag keeps it out of the reading drill's
  // pass. T33's case (heard part way) is the same flag.
  it('Hear it before ▶: the run that follows is recorded as not a first reading, and the sheet says why', async () => {
    await open(`#/score/${READ_ID}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    click('score-hear');
    click('score-hear');
    click('score-play');
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy, 'a heard run went unrecorded, minutes and all').toHaveBeenCalledTimes(1));
    expect(lastRecorded().unseen).toBe(false);
    expect(lastRecorded().passed, 'a heard phrase passed the reading drill').toBe(false);
    expect(lastRecorded().masterEligible).toBe(false);
    expect(sheetNote()).toBe(SUMMARY_TEXT.sightReadHeard);
    // Notes were heard, so nothing is asked.
    expect(document.getElementById('summary-selfreport')).toBeNull();
  });

  // Revised (C1): as above, recorded and flagged rather than dropped.
  it('so does Play it to me, the mode', async () => {
    await open(`#/score/${READ_ID}?mode=listen`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    click('score-play');
    finish(run({ mode: 'listen' }));
    const select = document.getElementById('score-mode') as HTMLSelectElement;
    select.value = 'tempo';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    click('score-play');
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(lastRecorded().unseen).toBe(false);
    expect(sheetNote()).toBe(SUMMARY_TEXT.sightReadHeard);
  });

  it('a phrase nobody played to the learner is still a first reading', async () => {
    await open(`#/score/${READ_ID}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    click('score-play');
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(sheetNote()).toBe('');
  });

  it('the sheet offers a new phrase, which opens one of its own', async () => {
    // The way to unseen music, on the sheet where the learner is told this
    // one no longer counts: the same row, a fresh seed, the same way back.
    await open(`#/score/${READ_ID}?seed=4242&from=1.5`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    click('score-hear');
    click('score-hear');
    click('score-play');
    finish(run({}));
    click('summary-new-phrase');
    // The router here is `routerFor`'s, whose methods are all `vi.fn()`.
    const navigate = (lastRouter as unknown as { navigateScore: ReturnType<typeof vi.fn> }).navigateScore;
    expect(navigate).toHaveBeenCalledTimes(1);
    const [id, options] = navigate.mock.calls[0] as [string, { seed?: number; from?: string }];
    expect(id).toBe(READ_ID);
    expect(options.from).toBe('1.5');
    expect(typeof options.seed).toBe('number');
    expect(options.seed).not.toBe(4242);
  });

  // Added (C3 item 0b): Today's daily read opens with `?slot=daily-read`. A
  // new phrase is the same rung's reading, and not the day's read — that is
  // the day's seed — so it keeps the rung and drops the slot.
  it('a new phrase from the daily read keeps the rung and is not the daily read', async () => {
    await open(`#/score/${READ_ID}?seed=4242&rung=1.5&slot=daily-read`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    click('score-play');
    finish(run({}));
    click('summary-new-phrase');
    const navigate = (lastRouter as unknown as { navigateScore: ReturnType<typeof vi.fn> }).navigateScore;
    const [, options] = navigate.mock.calls[0] as [string, { seed?: number; rung?: string; slot?: string }];
    expect(options.rung).toBe('1.5');
    expect(options.slot, 'a fresh phrase was recorded as the daily read').toBeUndefined();
  });

  it('a piece that is not a sight-read has no new phrase to offer', async () => {
    findItemSpy.mockResolvedValue(songItem());
    await open(`#/score/${SONG_ID}`);
    finish(run({}));
    expect(document.getElementById('summary-new-phrase')).toBeNull();
  });
});

describe('T40 3: a performance with a demonstration inside it is kept as practice', () => {
  it('Hear it part way: recorded without the performance flag, and the heading says why', async () => {
    await open(`#/score/${SONG_ID}?performance=1`);
    click('score-play');
    // The learner is on the fifth note, in bar 2, when they ask to hear it.
    if (sessionRef.current) sessionRef.current.state = { step: 4 };
    click('score-hear');
    // Stopped: the run comes back where it was (T33, C1), and is played on.
    click('score-hear');
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(lastRecorded().performance, 'a demonstrated take kept as a performance').toBeUndefined();
    // Revised (C1): the take also says what happened in it.
    expect(lastRecorded().demonstrated).toBe(true);
    expect(stat('changed')).toContain('heard it played at bar 2');
    // Said in the heading, and still said once the store has answered and
    // the heading has been rewritten from the row (T37's *Mastery run*).
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(heading()).toContain(SUMMARY_TEXT.demonstratedTake);
    expect(heading()).toMatch(/^Mastery run 1 of 2/);
  });

  it('played through without one, it is a performance', async () => {
    await open(`#/score/${SONG_ID}?performance=1`);
    click('score-play');
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(lastRecorded().performance).toBe(true);
    expect(lastRecorded().demonstrated).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(heading()).toBe('Mastery run 1 of 2');
  });

  it('heard before it started, it is still a performance', async () => {
    // Listening to a piece before playing it for somebody is preparation; the
    // rule is about a demonstration inside the take.
    await open(`#/score/${SONG_ID}?performance=1`);
    click('score-hear');
    click('score-hear');
    click('score-play');
    finish(run({}));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(lastRecorded().performance).toBe(true);
  });
});
