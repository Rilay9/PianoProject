// @vitest-environment jsdom
/**
 * One story for a session item, on the Score screen (X46; `responses/9e14839e.md` §2, the six points, with
 * `responses/43045ffb.md` §4: the item's traced role decides the flow). The walk of 2026-10-02 found a piece
 * Today composed as what rung 2.1 asks for opened in Wait for me at 70 % on a rung that counts only Keep tempo at
 * 80 % (finding 1); the sheet said "to pass, play it in Keep tempo" and offered no control that did it, naming
 * no number (findings 1 and 7); and the Wait run completed the session's activity, so the card marked it done
 * and the session moved on before the learner chose (findings 6 and 7).
 *
 * - **Opening** (point 3): a run Today chose for its rung (`?rung=`) opens where it can count — Keep tempo at the
 *   rung's tempo or faster — and a run Today did not choose, a route that names its mode, or a screen with nothing
 *   listening keeps the learner's defaults.
 * - **To pass** (points 2 and 5): a judged run that missed its standard says the standard, in the lesson page's
 *   words; where its own mode or tempo could not count, the control that does what the line says is first on
 *   the sheet, and starts a fresh Keep tempo run at the standard.
 * - **The session's activity** (points 4 and 5): a run its own settings could not count does not complete the
 *   activity Today composed for its rung; a run that counts, or fails measured, does, as before.
 *
 * Driven through the real Score screen with the engraver, the engine session, the store and the session
 * runner stubbed (the stubs of `scoreSummaryTruth.test.ts` and `scoreSheetsCloseAndPlayStartsSound.test.ts`,
 * repeated because mocks belong to the file that declares them).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import { openingThatCounts, tempoCanCount, timingStats } from '../../src/engine/Scoring';
import { SUMMARY_TEXT, keepTempoAt } from '../../src/ui/help';
import type { RecordedNote, SessionScore } from '../../src/engine/types';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProgressRow } from '../../src/data/db';
import type { RunResult } from '../../src/data/progressStore';
import { parseHash, type Router } from '../../src/router';

const SONG_ID = 'song.classical.ode-to-joy.ht';

const MODEL = makeModel(
  [64, 64, 65, 67, 67, 65, 64, 62].map((midi, index) => ({
    onset: index,
    notes: [note({ midi })],
  })),
);

const { curriculumRef, onFinishedRef, startSpy, recordRunSpy, completedSpy, transitionSpy } = vi.hoisted(() => ({
  curriculumRef: { current: null as Curriculum | null },
  onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
  /** Every run the screen started, with the mode and tempo it asked for. */
  startSpy: vi.fn((options: { mode: string; tempoPct: number }) => options),
  recordRunSpy: vi.fn((result: RunResult): Promise<ProgressRow> =>
    Promise.resolve({
      itemId: result.itemId,
      status: result.passed ? 'passed' : 'started',
      bestAccuracy: typeof result.accuracy === 'number' ? result.accuracy : 0,
      bestTempoPct: 0,
      attempts: 1,
      lastPracticedAt: '',
      minutes: 0,
      passedOn: [],
    }),
  ),
  /** What the screen reported to the session as completed (X1's protocol). */
  completedSpy: vi.fn((outcome: string) => Promise.resolve({ outcome })),
  transitionSpy: vi.fn(() => Promise.resolve('next')),
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: () => Promise.resolve(songItem()),
    loadCurriculum: () => (curriculumRef.current ? Promise.resolve(curriculumRef.current) : Promise.reject(new Error('no curriculum'))),
  };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: recordRunSpy,
  sessionsForItem: vi.fn(() => Promise.resolve([])),
  MASTER_DAYS: 2,
}));

vi.mock('../../src/ui/sessionRunner', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/ui/sessionRunner')>();
  return {
    ...original,
    sessionHandle: (token: string | undefined) =>
      token === undefined || token === ''
        ? null
        : {
            token,
            record: () => Promise.resolve(null),
            opened: () => Promise.resolve(),
            attempted: () => undefined,
            completed: completedSpy,
            startClock: () => () => undefined,
            write: () => Promise.resolve({ ok: false, why: 'none', run: null }),
          },
    drawTransition: transitionSpy,
  };
});

vi.mock('../../src/score/mxl', () => ({ toMusicXml: () => '<score-partwise/>' }));

vi.mock('../../src/score/OsmdView', () => ({
  OsmdView: class {
    load(): Promise<void> {
      return Promise.resolve();
    }
    extractModel(): unknown {
      return MODEL;
    }
    dispose(): void {}
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
      placeSlots(): void {}
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
    constructor(options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      onFinishedRef.current = options.onFinished ?? null;
    }
    loopForPrintedBars(): undefined {
      return undefined;
    }
    setStrip(): void {}
    previewFirst(): void {}
    setPiano(): void {}
    start(options: { mode: string; tempoPct: number }): void {
      startSpy(options);
      this.running = true;
      this.paused = false;
    }
    stop(): void {
      this.running = false;
    }
    suspend(): boolean {
      return false;
    }
    restoreSuspended(): void {}
    dropSuspended(): void {}
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

Element.prototype.scrollIntoView = function scrollIntoView(): void {};

function lesson(id: string, minAccuracy: number, minTempoPct: number): Lesson {
  return {
    id,
    title: `Rung ${id}`,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [],
    songOptions: [SONG_ID],
    mastery: { minAccuracy, minTempoPct },
    requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
  };
}

/** Rung 2.1 as built: a song at 90 % of the notes, in Keep tempo at 80 % (the walk's rung). */
const CURRICULUM = {
  version: 1,
  tracks: [],
  stages: [{ number: 2, units: [{ id: 'u2', lessons: [lesson('2.1', 0.9, 0.8), lesson('2.9', 0.95, 0.85)] }] }],
} as unknown as Curriculum;

function songItem(): CatalogItem {
  return { id: SONG_ID, type: 'song', title: 'Ode to Joy (hands together)', level: 2, tracks: ['core'], concepts: [], tags: [], file: 'scores/ode.mxl' } as unknown as CatalogItem;
}

function routerFor(hash: string): Router {
  return {
    route: { ...parseHash(hash), tab: 'today' },
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
  // The opening is decided once the score, the history and the rung are in; "Loading…" leaves the state line
  // just after it (the load's own order).
  await vi.waitFor(() => {
    expect(onFinishedRef.current).not.toBeNull();
    expect(document.getElementById('score-status')?.textContent).not.toBe('Loading…');
  });
  return section;
}

function heardNotes(count: number): RecordedNote[] {
  return Array.from({ length: count }, (_, index) => ({ midi: 64, velocity: 80, tMs: index * 500, stepIndex: index, ok: true, deltaMs: 0 }));
}

function run(partial: Partial<SessionScore>): SessionScore {
  return {
    mode: 'tempo',
    tempoPct: 80,
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
  onFinishedRef.current?.(score, false);
}

function stat(name: string): string | null {
  return document.querySelector(`#score-summary [data-stat="${name}"]`)?.textContent ?? null;
}

function heading(): string {
  return document.querySelector('#score-summary h2')?.textContent ?? '';
}

function tempoNow(): number {
  return Number(document.querySelector<HTMLInputElement>('#score-tempo')?.value);
}

const STANDARD = SUMMARY_TEXT.toPass(0.9, 80);

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)), text: () => Promise.resolve('') })));
  curriculumRef.current = CURRICULUM;
  onFinishedRef.current = null;
  startSpy.mockClear();
  recordRunSpy.mockClear();
  completedSpy.mockClear();
  transitionSpy.mockClear();
  // The walk's learner: a piano connected (here the screen keys, a judging input), the shipped defaults —
  // Wait for me at 70 % — and every explain-it-once card already seen.
  updateSettings({ inputPriority: ['keys'], defaultModeWithInput: 'wait', defaultModeWithoutInput: 'tempo', defaultTempoPct: 70 });
  localStorage.setItem('pianopath.firstSight', '["*"]');
});

afterEach(() => {
  document.body.replaceChildren();
  updateSettings({
    inputPriority: [...DEFAULT_SETTINGS.inputPriority],
    defaultModeWithInput: DEFAULT_SETTINGS.defaultModeWithInput,
    defaultModeWithoutInput: DEFAULT_SETTINGS.defaultModeWithoutInput,
    defaultTempoPct: DEFAULT_SETTINGS.defaultTempoPct,
  });
  localStorage.removeItem('pianopath.firstSight');
  vi.unstubAllGlobals();
});

describe('the opening a run can count from (point 3)', () => {
  it('the pure rule: unchanged where the tempo floor can be met, else Keep tempo at the floor, never slower', () => {
    expect(openingThatCounts({ mode: 'wait', tempoPct: 70 }, { passTempoPct: 80 })).toEqual({ mode: 'tempo', tempoPct: 80 });
    expect(openingThatCounts({ mode: 'tempo', tempoPct: 70 }, { passTempoPct: 80 })).toEqual({ mode: 'tempo', tempoPct: 80 });
    expect(openingThatCounts({ mode: 'tempo', tempoPct: 100 }, { passTempoPct: 80 })).toEqual({ mode: 'tempo', tempoPct: 100 });
    expect(openingThatCounts({ mode: 'wait', tempoPct: 70 }, { passTempoPct: 0 })).toEqual({ mode: 'wait', tempoPct: 70 });
    // The one definition the pass is decided by.
    expect(tempoCanCount('wait', 100, { passTempoPct: 80 })).toBe(false);
    expect(tempoCanCount('tempo', 79, { passTempoPct: 80 })).toBe(false);
    expect(tempoCanCount('tempo', 80, { passTempoPct: 80 })).toBe(true);
  });

  it('a run Today chose for rung 2.1 opens in Keep tempo at 80 %, not the defaults’ Wait for me at 70 %', async () => {
    const section = await open(`#/score/${SONG_ID}?rung=2.1&slot=new&session=tok00001`);
    await vi.waitFor(() => expect(section.dataset.mode).toBe('tempo'));
    expect(tempoNow()).toBe(80);
  });

  it('at the rung’s own tempo where it states one other than the Settings pair', async () => {
    const section = await open(`#/score/${SONG_ID}?rung=2.9&slot=review`);
    await vi.waitFor(() => expect(section.dataset.mode).toBe('tempo'));
    expect(tempoNow()).toBe(85);
  });

  it('Rhythm only left on from another screen does not make the opening a run that never counts; the preference stays', async () => {
    updateSettings({ defaultModeWithInput: 'tempo', defaultTempoPct: 100, rhythmOnly: true });
    try {
      const section = await open(`#/score/${SONG_ID}?rung=2.1&slot=new`);
      expect(section.dataset.mode).toBe('tempo');
      await vi.waitFor(() => expect(section.dataset.rhythm).toBe('false'));
      const { getSettings } = await import('../../src/data/settingsStore');
      expect(getSettings().rhythmOnly).toBe(true);
    } finally {
      updateSettings({ rhythmOnly: DEFAULT_SETTINGS.rhythmOnly });
    }
  });

  it('a learner whose defaults already count keeps them', async () => {
    updateSettings({ defaultModeWithInput: 'tempo', defaultTempoPct: 100 });
    const section = await open(`#/score/${SONG_ID}?rung=2.1&slot=new`);
    expect(section.dataset.mode).toBe('tempo');
    expect(tempoNow()).toBe(100);
  });

  it('opened from nowhere, from a route that names its mode, or with nothing listening: the defaults stand', async () => {
    let section = await open(`#/score/${SONG_ID}`);
    expect(section.dataset.mode).toBe('wait');
    expect(tempoNow()).toBe(70);
    section = await open(`#/score/${SONG_ID}?rung=2.1&slot=new&mode=wait`);
    expect(section.dataset.mode).toBe('wait');
    updateSettings({ inputPriority: [] });
    section = await open(`#/score/${SONG_ID}?rung=2.1&slot=new`);
    expect(section.dataset.mode).toBe('tempo');
    expect(tempoNow()).toBe(70);
  });
});

describe('the sheet says what a pass needs, and offers it (points 2 and 5)', () => {
  it('a Wait run with every note: Notes ready, the tempo not judged, To pass with the numbers, and the control first', async () => {
    await open(`#/score/${SONG_ID}?rung=2.1&slot=new&mode=wait`);
    finish(run({ mode: 'wait', tempoPct: 70, timing: timingStats([]) }));
    expect(heading()).toBe(SUMMARY_TEXT.waitNotesReady);
    expect(stat('tempo')).toBe('Not judged in Wait for me');
    expect(stat('to-pass')).toBe('90 % of the notes, in Keep tempo at 80 % of the written tempo or faster');
    expect(stat('to-pass')).toBe(STANDARD);
    const actions = [...document.querySelectorAll<HTMLElement>('#score-summary .summary-actions button')];
    expect(actions[0]?.id).toBe('summary-standard');
    expect(actions[0]?.textContent).toBe('Keep tempo at 80 %');
  });

  it('a clean Keep tempo run at 70 %: Run finished, and the line names the 80 % it was short of', async () => {
    await open(`#/score/${SONG_ID}?rung=2.1&slot=new`);
    finish(run({ tempoPct: 70 }));
    expect(heading()).toBe('Run finished');
    expect(stat('tempo')).toBe('70% of written');
    expect(stat('to-pass')).toBe(STANDARD);
    expect(document.getElementById('summary-standard')?.textContent).toBe('Keep tempo at 80 %');
  });

  it('short of the notes at the tempo: the standard is said, and Again is the retry — no second control', async () => {
    await open(`#/score/${SONG_ID}?rung=2.1&slot=new`);
    finish(run({ tempoPct: 80, accuracy: 0.75, correctSteps: 6 }));
    expect(heading()).toBe('Run finished');
    expect(stat('to-pass')).toBe(STANDARD);
    expect(document.getElementById('summary-standard')).toBeNull();
    expect(document.getElementById('summary-again')).not.toBeNull();
  });

  it('a pass says no standard and offers no control', async () => {
    await open(`#/score/${SONG_ID}?rung=2.1&slot=new`);
    finish(run({ tempoPct: 80 }));
    await vi.waitFor(() => expect(heading()).toBe('Passed'));
    expect(stat('to-pass')).toBeNull();
    expect(document.getElementById('summary-standard')).toBeNull();
  });

  it('the control starts a fresh Keep tempo run at the standard: no Changed stamp, the select moved', async () => {
    const section = await open(`#/score/${SONG_ID}?rung=2.1&slot=new&mode=wait`);
    finish(run({ mode: 'wait', tempoPct: 70, timing: timingStats([]) }));
    startSpy.mockClear();
    (document.getElementById('summary-standard') as HTMLElement).click();
    await vi.waitFor(() => expect(startSpy).toHaveBeenCalled());
    expect(startSpy.mock.calls.at(-1)?.[0]).toMatchObject({ mode: 'tempo', tempoPct: 80 });
    expect(section.dataset.mode).toBe('tempo');
    expect(document.querySelector<HTMLSelectElement>('#score-mode')?.value).toBe('tempo');
    // The next sheet is about the run the control started, with nothing changed during it.
    finish(run({ tempoPct: 80 }));
    await vi.waitFor(() => expect(heading()).toBe('Passed'));
    expect(stat('changed')).toBe('');
  });

  it('the lesson page and the sheet say the tempo half in one set of words', () => {
    expect(SUMMARY_TEXT.toPass(0.9, 80)).toBe(`90 % of the notes, ${keepTempoAt(80)}`);
    expect(keepTempoAt(80)).toBe('in Keep tempo at 80 % of the written tempo or faster');
    expect(keepTempoAt(75, true)).toBe('in Keep tempo at 75 % of the suggested tempo or faster');
  });
});

describe('the session’s activity completes on a run that can count (points 4 and 5)', () => {
  it('a Wait run on an activity Today composed for its rung does not complete it; the transition is drawn from the record', async () => {
    await open(`#/score/${SONG_ID}?rung=2.1&slot=new&session=tok00001&mode=wait`);
    finish(run({ mode: 'wait', tempoPct: 70, timing: timingStats([]) }));
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalled());
    await vi.waitFor(() => expect(transitionSpy).toHaveBeenCalled());
    expect(completedSpy).not.toHaveBeenCalled();
  });

  it('a pass completes it, measured: passed-full', async () => {
    await open(`#/score/${SONG_ID}?rung=2.1&slot=new&session=tok00001`);
    finish(run({ tempoPct: 80 }));
    await vi.waitFor(() => expect(completedSpy).toHaveBeenCalledWith('passed-full'));
  });

  it('a Keep tempo run short of the standard completes it as failed, as before (X1’s kept-here)', async () => {
    await open(`#/score/${SONG_ID}?rung=2.1&slot=new&session=tok00001`);
    finish(run({ tempoPct: 70 }));
    await vi.waitFor(() => expect(completedSpy).toHaveBeenCalledWith('failed'));
  });

  it('a Wait run on an activity no rung judges completes it as unknown, as before: nothing it could count', async () => {
    curriculumRef.current = null;
    await open(`#/score/${SONG_ID}?slot=repertoire&session=tok00001&mode=wait`);
    finish(run({ mode: 'wait', tempoPct: 70, timing: timingStats([]) }));
    await vi.waitFor(() => expect(completedSpy).toHaveBeenCalledWith('unknown'));
  });
});
