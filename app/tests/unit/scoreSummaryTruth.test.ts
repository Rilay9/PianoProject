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
import type { SessionScore } from '../../src/engine/types';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProgressRow, SessionRow } from '../../src/data/db';
import type { RunResult } from '../../src/data/progressStore';
import { parseHash, type Router } from '../../src/router';

const SONG_ID = 'song.folk.hot-cross-buns';
const READ_ID = 'drill.reading.sight-reading-test';

/** Two full 4/4 bars of quarter notes. */
const MODEL = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({
    onset: index,
    notes: [note({ midi })],
  })),
);

const { findItemSpy, curriculumRef, loadedXml, onFinishedRef, recordRunSpy, sessionsSpy } =
  vi.hoisted(() => ({
    findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
    curriculumRef: { current: null as Curriculum | null },
    /** Every MusicXML the screen handed the engraver, newest last. */
    loadedXml: [] as string[],
    onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
    recordRunSpy: vi.fn((result: RunResult): Promise<ProgressRow> =>
      Promise.resolve({
        itemId: result.itemId,
        status: result.passed ? 'passed' : 'started',
        bestAccuracy: result.accuracy,
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
    state = null;
    prepared = null;
    expectedNow: number[] = [];
    learnerHasNotes = true;
    constructor(options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      onFinishedRef.current = options.onFinished ?? null;
    }
    loopForPrintedBars(): undefined {
      return undefined;
    }
    setStrip(): void {}
    previewFirst(): void {}
    setPiano(): void {}
    start(): void {}
    stop(): void {}
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
    mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy, minTempoPct },
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

async function open(hash: string): Promise<HTMLElement> {
  const section = ScoreScreen(routerFor(hash));
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.running).toBeDefined();
    expect(onFinishedRef.current).not.toBeNull();
  });
  return section;
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
    notes: [],
    ...partial,
  };
}

function finish(score: SessionScore): void {
  expect(onFinishedRef.current).not.toBeNull();
  onFinishedRef.current?.(score, false);
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
    finish(run({ hits: 0, correctSteps: 0, accuracy: 0, missedTotal: 8, timing: timingStats([]) }));
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
    finish(run({ hits: 0, correctSteps: 0, accuracy: 0, missedTotal: 8, timing: timingStats([]) }));
    document.querySelector<HTMLButtonElement>('#summary-self-rough')?.click();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    expect(lastRecorded().selfReport).toBe('rough');
    expect(lastRecorded().passed).toBe(false);
  });

  it('a run left without an answer is still recorded, without one', async () => {
    await open(`#/score/${SONG_ID}`);
    finish(run({ hits: 0, correctSteps: 0, accuracy: 0, missedTotal: 8, timing: timingStats([]) }));
    document.querySelector<HTMLButtonElement>('#summary-done')?.click();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
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

  it('opened from nowhere, the first rung listing it still judges it', async () => {
    await open(`#/score/${SONG_ID}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({ accuracy: 0.93, hits: 7 }));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    expect(lastRecorded().lessonId).toBe('1.1');
    expect(lastRecorded().passed).toBe(true);
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

  it('re-opening a phrase already on the record is not a new first attempt', async () => {
    findItemSpy.mockResolvedValue(readerItem({ level: 1, bars: 2, hands: 'right' }));
    sessionsSpy.mockResolvedValue([{ itemId: READ_ID, seed: 777 } as unknown as SessionRow]);
    await open(`#/score/${READ_ID}?seed=777`);
    await vi.waitFor(() => expect(sessionsSpy).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(run({}));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(recordRunSpy).not.toHaveBeenCalled();
    expect(document.querySelector('#score-status')?.textContent).toContain('first attempt only');
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
