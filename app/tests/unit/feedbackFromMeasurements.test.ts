// @vitest-environment jsdom
/**
 * Every sentence the summary sheet prints about what was not judged cites a
 * field on that run's own observation (C3 item 6; backlog Q6
 * `feedbackFromMeasurements`, L19, M3; U46).
 *
 * The sheet used to say nothing about a skill a run could not show: a Wait
 * run of a reading row printed its accuracy and no word about the rhythm it
 * never timed. Now, where the evidence function refuses a skill the item
 * declares, the sheet prints *Not judged* and why, and nothing else on it
 * changes. Each case plays a run through the **real engine**, hands its score
 * to the **real Score screen** (engraver and session stubbed, as in
 * `observationsFromRun`), and reads two things: the lines on the sheet, and
 * the row the store kept. A line whose cited field is not on the row fails.
 *
 * U46 is the same rule on the *Accents* line: over notes that all arrived at
 * one loudness (the screen keys) the record stores the accents as not
 * measured, and the sheet printed a share of them; it says not judged now.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { BEAT_MS, harness } from './helpers/engineHarness';
import { phrase, line } from './helpers/phrase';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import type { EngineOptions, SessionScore } from '../../src/engine/types';
import type { CatalogItem } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { withBeatToMs, type ScoreModel, type ScoreModelData } from '../../src/score/types';
import { parseHash, type Router } from '../../src/router';

const READ_ID = 'drill.reading.sight-reading-test';
const SONG_ID = 'song.folk.hot-cross-buns';

const { findItemSpy, modelRef, onFinishedRef, sessionRef } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  modelRef: { current: null as ScoreModel | null },
  onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
  sessionRef: { current: null as null | { running: boolean; state: { step: number } | null; prepared: unknown } },
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
    prepared: unknown = null;
    expectedNow: number[] = [];
    learnerHasNotes = true;
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
const { recentSessions, resetProgressForTest } = await import('../../src/data/progressStore');
const { NOT_JUDGED_TEXT } = await import('../../src/ui/help');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

/** Steps and skips over a left hand; no ledger note, no accidental. */
const PLAIN = phrase({
  bars: [
    [...line(['C4', 'D4', 'E4', 'C4'], 1), { at: 0, dur: 4, pitch: 'C3', staff: 2 }],
    [...line(['E4', 'F4', 'G4', 'G4'], 1), { at: 0, dur: 4, pitch: 'G2', staff: 2 }],
  ],
});

/** A bar of triplets: the window cannot tell them from a rushed rhythm at 72 bpm. */
const TRIPLETS = phrase({
  bars: [
    [
      { at: 0, dur: 1 / 3, pitch: 'C5', tuplet: 3 },
      { at: 1 / 3, dur: 1 / 3, pitch: 'D5', tuplet: 3 },
      { at: 2 / 3, dur: 1 / 3, pitch: 'E5', tuplet: 3 },
      { at: 1, dur: 3, pitch: 'C5' },
    ],
  ],
});

/** A bar that prints accents on its first and third notes. */
function accented(): ScoreModelData {
  const data = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1)] });
  return {
    ...data,
    steps: data.steps.map((step, index) => ({
      ...step,
      notes: step.notes.map((note) => (index % 2 === 0 ? { ...note, accent: true } : note)),
    })),
  };
}

function reader(targetSkills: string[]): CatalogItem {
  return {
    id: READ_ID,
    type: 'drill',
    title: 'Sight-read',
    level: 2,
    tracks: ['core'],
    concepts: ['sight-reading'],
    targetSkills,
    drill: { kind: 'sight-reading', params: { level: 2, bars: 2, hands: 'both' } },
  } as unknown as CatalogItem;
}

function song(): CatalogItem {
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

async function open(hash: string, data: ScoreModelData): Promise<void> {
  modelRef.current = withBeatToMs(data);
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
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function until(h: ReturnType<typeof harness>, ms: number): void {
  while (h.clock.now() < ms) {
    h.clock.set(Math.min(ms, h.clock.now() + 16));
    h.engine.tick();
  }
}

/** Plays every note right through the real engine; the screen is told it finished. */
function playAndFinish(data: ScoreModelData, options: Partial<EngineOptions> = {}): void {
  const h = harness(withBeatToMs(data), { mode: 'tempo', countInBars: 0, ...options });
  h.engine.start();
  if (sessionRef.current) sessionRef.current.prepared = h.engine.prepared;
  for (const step of h.engine.prepared.steps) {
    if (step.isEmpty) continue;
    if (options.mode === 'wait') {
      for (const midi of step.expected) {
        h.clock.advanceBy(300);
        h.play(midi);
        h.release(midi);
      }
      continue;
    }
    until(h, step.tMs);
    for (const midi of step.expected) h.play(midi);
    until(h, step.tMs + 60);
    for (const midi of step.expected) h.release(midi);
  }
  until(h, (data.steps.length + 4) * BEAT_MS);
  if (!h.engine.state.finished) h.engine.stop();
  if (sessionRef.current) sessionRef.current.running = false;
  onFinishedRef.current?.(h.engine.state.score, false);
}

async function storedRow(): Promise<SessionRow> {
  let rows: SessionRow[] = [];
  await vi.waitFor(async () => {
    rows = await recentSessions(5);
    expect(rows.length, 'the run left no row in the store').toBeGreaterThan(0);
  });
  return rows[0] as SessionRow;
}

interface Line {
  text: string;
  cites: string[];
}

function notJudged(): Line[] {
  return [...document.querySelectorAll<HTMLElement>('#score-summary [data-stat="not-judged"]')].map((el) => ({
    text: el.textContent ?? '',
    cites: (el.dataset.cites ?? '').split(' ').filter(Boolean),
  }));
}

/** Reads a dotted field (`hands.played`) off the stored row. */
function field(row: SessionRow, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], row);
}

/** The join the test is named for: every printed line cites fields the row has. */
function expectEveryLineCitesTheRow(lines: Line[], row: SessionRow): void {
  for (const one of lines) {
    expect(one.cites.length, `"${one.text}" cites nothing`).toBeGreaterThan(0);
    for (const path of one.cites) {
      expect(field(row, path), `"${one.text}" cites ${path}, which the run's row does not have`).not.toBeUndefined();
    }
  }
}

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })),
  );
  findItemSpy.mockReset();
  onFinishedRef.current = null;
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

describe('the sheet says what a run could not judge, and why, from the run’s own record', () => {
  it('a Wait run of a reading row: not judged, timing — Wait for me keeps no clock', async () => {
    findItemSpy.mockResolvedValue(reader(['sight-reading', 'interval-reading', 'subdivision']));
    await open(`#/score/${READ_ID}?mode=wait`, PLAIN);
    playAndFinish(PLAIN, { mode: 'wait' });
    const row = await storedRow();
    const lines = notJudged();
    expect(lines.map((l) => l.text).join(' | '), 'the sheet said nothing about the timing it never took').toContain('timing');
    expect(lines.some((l) => l.text.includes(NOT_JUDGED_TEXT.timingWait))).toBe(true);
    expect(row.mode).toBe('wait');
    expect(row.timing).toBe('not measured');
    expectEveryLineCitesTheRow(lines, row);
    // Reading by interval was measured: the sheet does not call it not judged.
    expect(lines.some((l) => l.text.includes('Reading by interval'))).toBe(false);
  });

  it('a right-hand run of a two-hand skill: not judged, and which hand was played', async () => {
    findItemSpy.mockResolvedValue(reader(['hands-together']));
    await open(`#/score/${READ_ID}?hands=R`, PLAIN);
    playAndFinish(PLAIN, { hands: 'R' });
    const row = await storedRow();
    const lines = notJudged();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.text).toContain(NOT_JUDGED_TEXT.oneHand('R'));
    expect(row.hands?.played).toBe('R');
    expectEveryLineCitesTheRow(lines, row);
  });

  it('a phrase with no ledger note: ledger lines not judged — none in this phrase', async () => {
    findItemSpy.mockResolvedValue(reader(['ledger-lines', 'accidentals']));
    await open(`#/score/${READ_ID}`, PLAIN);
    playAndFinish(PLAIN);
    const row = await storedRow();
    const lines = notJudged();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.text).toBe(`Ledger lines, Accidentals — ${NOT_JUDGED_TEXT.noOpportunity(false)}`);
    expectEveryLineCitesTheRow(lines, row);
  });

  it('triplets at a tempo the window cannot resolve: not judged, and slower it could be', async () => {
    findItemSpy.mockResolvedValue(reader(['triplets']));
    await open(`#/score/${READ_ID}`, TRIPLETS);
    playAndFinish(TRIPLETS);
    const row = await storedRow();
    const lines = notJudged();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.text).toBe(`Triplets — ${NOT_JUDGED_TEXT.precision}`);
    expect(row.input?.toleranceMs).toBe(150);
    expectEveryLineCitesTheRow(lines, row);
  });

  it('a first reading that met every condition prints no such line: nothing is said without a refusal behind it', async () => {
    findItemSpy.mockResolvedValue(reader(['interval-reading', 'bass-clef']));
    await open(`#/score/${READ_ID}`, PLAIN);
    playAndFinish(PLAIN);
    const row = await storedRow();
    expect(row.unseen).toBe(true);
    expect(notJudged()).toEqual([]);
  });

  it('an item that declares no skill prints no such line', async () => {
    findItemSpy.mockResolvedValue(song());
    await open(`#/score/${SONG_ID}?mode=wait`, PLAIN);
    playAndFinish(PLAIN, { mode: 'wait' });
    await storedRow();
    expect(notJudged()).toEqual([]);
  });
});

describe('U46: the Accents line says not judged where the record says not measured', () => {
  it('accents played on the screen keys, every note at one loudness', async () => {
    findItemSpy.mockResolvedValue(song());
    const bar = accented();
    await open(`#/score/${SONG_ID}`, bar);
    playAndFinish(bar);
    const row = await storedRow();
    expect(row.accents, 'the record keeps the accents as not measured').toBe('not measured');
    const accents = document.querySelector('#score-summary [data-stat="accents"]');
    expect(accents?.textContent ?? '', 'the sheet printed a share of accents nobody could play louder').not.toMatch(/%/);
    expect(accents?.textContent).toContain(NOT_JUDGED_TEXT.accentsFlat);
    expect((accents as HTMLElement | null)?.dataset.cites).toBe('accents');
  });
});
