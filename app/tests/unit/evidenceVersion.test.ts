// @vitest-environment jsdom
/**
 * The evidence carries its own version (C4a item 4; backlog L66; the
 * reviewer's third message, point 4, and fourth, point 2).
 *
 * C4 stored each run's evidence on its row stamped with the row's own
 * `definitions` — the observation's version. The two are independent: C4a
 * changes what evidence is (per-demand counts and the overlap) without
 * changing a single observation field, so an observation stamp cannot say
 * whether stored evidence is current. Now the evidence module names its own
 * version (`EVIDENCE_DEFINITIONS`), the record call stamps it on the row
 * beside the evidence (`evidenceDefinitions`), and the reading state reads
 * only evidence with the current stamp. `recomputeEvidence` gives what the
 * record call would store today, so a later job holding the played model can
 * refresh an old row; nothing runs that job yet.
 *
 * The record call is the real one: the Score screen, engraver and session
 * stubbed as in `feedbackFromMeasurements`, a run through the real engine, the
 * row read back from a fake IndexedDB.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { BEAT_MS, harness } from './helpers/engineHarness';
import { phrase, line } from './helpers/phrase';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import type { EngineOptions, SessionScore } from '../../src/engine/types';
import type { CatalogItem } from '../../src/curriculum/types';
import { OBSERVATION_DEFINITIONS, type SessionRow } from '../../src/data/db';
import { withBeatToMs, type ScoreModel, type ScoreModelData } from '../../src/score/types';
import { parseHash, type Router } from '../../src/router';
import { EVIDENCE_DEFINITIONS, recomputeEvidence, type EvidenceResult } from '../../src/evidence/evidence';
import { storedEvidence } from '../../src/evidence/readingState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

const READ_ID = 'drill.reading.sight-reading-test';

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

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

/** Steps and skips over a left hand, in quarters and eighths: several demands, some on one step. */
const PHRASE = phrase({
  bars: [
    [...line(['C4', 'E4', 'D4', 'F4'], 1), { at: 0, dur: 4, pitch: 'C3', staff: 2 }],
    [
      { at: 0, dur: 0.5, pitch: 'E4' },
      { at: 0.5, dur: 0.5, pitch: 'G4' },
      { at: 1, dur: 1, pitch: 'F4' },
      { at: 2, dur: 2, pitch: 'E4' },
      { at: 0, dur: 4, pitch: 'G2', staff: 2 },
    ],
  ],
});

const SKILLS = ['sight-reading', 'interval-reading', 'subdivision', 'bass-clef', 'hands-together', 'reading-ahead'];

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

/** The record call's results carry no id and the screen's own date; the stored row's win (`storedEvidence`). */
function asOfRow(results: readonly EvidenceResult[], row: SessionRow): EvidenceResult[] {
  return results.map((result) => (result.kind === 'refusal' ? result : { ...result, at: row.at, observationId: row.id ?? null }));
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

async function recordedRead(): Promise<SessionRow> {
  findItemSpy.mockResolvedValue(reader(SKILLS));
  await open(`#/score/${READ_ID}`, PHRASE);
  playAndFinish(PHRASE);
  return storedRow();
}

describe('the record call stamps the evidence with the evidence’s own version', () => {
  it('a recorded sight-read: the row carries the evidence and its own stamp, beside the observation’s', async () => {
    const row = await recordedRead();
    expect(row.evidence, 'a recorded sight-read kept no evidence').toBeDefined();
    expect(row.definitions).toBe(OBSERVATION_DEFINITIONS);
    expect(EVIDENCE_DEFINITIONS, 'the evidence module names no version of its own').toBeTypeOf('number');
    expect(row.evidenceDefinitions, 'the stored evidence carries no stamp of its own').toBe(EVIDENCE_DEFINITIONS);
    // The shape this stamp names: per-demand counts on every measured result.
    const sight = (row.evidence ?? []).find((result) => result.skill === 'sight-reading');
    expect(sight).toMatchObject({ kind: 'measured' });
    expect((sight as { byDemand?: unknown[] }).byDemand?.length).toBeGreaterThan(0);
  });

  it('recomputeEvidence gives exactly what the record call stored', async () => {
    const row = await recordedRead();
    const again = recomputeEvidence(row, withBeatToMs(PHRASE), VOCABULARY_V0);
    expect(again).toBeDefined();
    expect(again?.evidenceDefinitions).toBe(row.evidenceDefinitions);
    expect(asOfRow(again?.evidence ?? [], row)).toEqual(asOfRow(row.evidence ?? [], row));
  });
});

describe('only evidence with the current evidence stamp reaches the reading state', () => {
  it('a row as C4 stored it — the observation’s stamp only — contributes nothing until recomputed', async () => {
    const row = await recordedRead();
    const { evidenceDefinitions: _stamp, ...asC4Stored } = row;
    // C4's evidence had no per-demand counts: the shape the old stamp named.
    const c4Evidence = (row.evidence ?? []).map((result) => {
      if (result.kind !== 'measured') return result;
      const { byDemand: _byDemand, ...rest } = result;
      return rest;
    });
    const old = { ...asC4Stored, evidence: c4Evidence } as unknown as SessionRow;
    expect(old.definitions).toBe(OBSERVATION_DEFINITIONS);
    expect(storedEvidence(old), 'evidence of another shape was read as current').toEqual([]);

    // Given the played model, a later job can refresh it.
    const refreshed: SessionRow = { ...old, ...recomputeEvidence(old, withBeatToMs(PHRASE), VOCABULARY_V0) };
    expect(storedEvidence(refreshed)).toEqual(storedEvidence(row));
  });

  it('another evidence stamp contributes nothing, whatever the observation’s stamp says', async () => {
    const row = await recordedRead();
    expect(storedEvidence(row).length).toBeGreaterThan(0);
    expect(storedEvidence({ ...row, evidenceDefinitions: EVIDENCE_DEFINITIONS + 1 })).toEqual([]);
    expect(storedEvidence({ ...row, evidenceDefinitions: EVIDENCE_DEFINITIONS - 1 })).toEqual([]);
  });

  it('the observation’s stamp stays the observation’s: it neither admits nor refuses evidence', async () => {
    const row = await recordedRead();
    // An observation written under other rules, with evidence computed under the current ones.
    expect(storedEvidence({ ...row, definitions: OBSERVATION_DEFINITIONS + 1 })).toEqual(storedEvidence(row));
  });

  it('an item that declares no skill: nothing to recompute, as nothing was stored', () => {
    const bare = { itemId: 'song.folk.hot-cross-buns', mode: 'tempo', tempoPct: 100, at: '2026-09-26T10:00:00.000Z' } as unknown as SessionRow;
    expect(recomputeEvidence(bare, withBeatToMs(PHRASE), VOCABULARY_V0)).toBeUndefined();
  });
});
