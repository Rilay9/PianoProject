/**
 * The `sessions` store is bounded, and the bound does not throw evidence away.
 *
 * The first fault: `db.ts` creates the store with `autoIncrement` and nothing
 * removed a row, so every practice run appended one for ever. A cap of 2,000
 * rows fixed that, on the grounds that nothing read an old row.
 *
 * The second (C1; backlog Q26, L48): once a row is an observation — what the
 * run measured, per step — the store is evidence, and deleting the oldest rows
 * by count deletes evidence. The cap's comment reasoned in sessions ("six
 * years at a session a day") while it counted runs; at ten runs a day it
 * forgot after about two hundred days. So now:
 *
 * - old rows are **compacted, not deleted**: after the observation window the
 *   per-step detail becomes per-bar tallies, and the row, its totals and its
 *   header stay;
 * - the cap is in runs, raised to what the storage measurement says the store
 *   can afford, and it is the last resort, not the routine;
 * - recording a run tidies the store by itself, and a test can wait for that
 *   tidy instead of doing it.
 *
 * Every number below is a relationship between the app's own constants and a
 * measured row size (`v8.serialize` is the structured clone IndexedDB stores),
 * never a size measured on this machine written down as a fact.
 */
import { serialize } from 'node:v8';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import {
  MAX_SESSIONS,
  OBSERVATION_WINDOW_DAYS,
  PRUNE_SLACK,
  SESSIONS_BUDGET_BYTES,
  compactObservation,
  compactSessions,
  pruneSessions,
  recentSessions,
  recordRun,
  resetProgressForTest,
  sessionCount,
  sessionsTidied,
  type RunResult,
} from '../../src/data/progressStore';
import { openDatabase, type SessionRow } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const RUN: RunResult = {
  itemId: 'song.folk.hot-cross-buns',
  mode: 'wait',
  tempoPct: 100,
  accuracy: 0.95,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 60_000,
  passed: true,
  masterEligible: false,
};

/** How many runs a busy day holds: the figure the old cap's comment left out. */
const RUNS_A_DAY = 10;
const DAY_MS = 86_400_000;

/**
 * A run of a 64-bar two-hand piece in Keep tempo, stored the way C1 stores it:
 * six steps a bar, three notes on every other step, every note timed, one step
 * in twenty with a wrong note. Longer than most pieces on the rungs and far
 * shorter than the longest in the catalog (the budget's case is the
 * learner's ordinary week, not a week of nothing but the Scherzo).
 */
function observedRow(at: Date, itemId = 'song.observed'): SessionRow {
  const bars = 64;
  const perBar = 6;
  const codes: string[] = [];
  const measures: number[] = [];
  const wrong: number[] = [];
  const timing: number[] = [];
  for (let bar = 0; bar < bars; bar += 1) {
    measures.push(bar * perBar, bar);
    for (let beat = 0; beat < perBar; beat += 1) {
      const step = bar * perBar + beat;
      const notes = step % 2 === 0 ? 3 : 1;
      const missedOne = step % 17 === 0;
      codes.push(missedOne ? 'p' : 'h');
      for (let n = 0; n < notes - (missedOne ? 1 : 0); n += 1) timing.push(step, ((step * 37 + n * 11) % 241) - 120);
      if (step % 20 === 0) wrong.push(step, 61 + (step % 12));
    }
  }
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 80,
    accuracy: 0.93,
    accuracyEstimated: false,
    wrongNotes: wrong.length / 2,
    missed: codes.filter((code) => code === 'p').length,
    durationMs: 240_000,
    at: at.toISOString(),
    tempoMeasured: true,
    definitions: 1,
    range: { fromMeasure: 0, toMeasure: bars - 1 },
    opened: { tab: 'plan', rung: 'classical.3', slot: 'not measured' },
    baseTempo: { bpm: 96, source: 'written' },
    hands: { played: 'both', appPlayed: 'none' },
    keys: { view: 'strip', guide: 'next', fingers: true, names: false },
    graceNotes: false,
    input: { source: 'midi', toleranceMs: 150, latencyMs: 12 },
    demonstrated: false,
    pitch: { definition: 'tempo-notes', right: 560, of: 602, estimated: false },
    early: 3,
    timing: { n: timing.length / 2, meanMs: -4, sdMs: 61 },
    steps: { from: 0, codes: codes.join(''), measures, wrong, early: [40, 64, 90, 67, 200, 72], timing },
    pedal: { messages: 180, down: 90 },
    chords: { rolled: 4, lenient: 0 },
    loops: 0,
  } as unknown as SessionRow;
}

function bytes(value: unknown): number {
  return serialize(value).byteLength;
}

/** `n` rows, one a day going back from 2026-09-10, oldest written first. */
async function seed(n: number, make: (at: Date, index: number) => SessionRow = plainRow): Promise<void> {
  const db = await openDatabase();
  if (!db) throw new Error('the fake database did not open');
  const tx = db.transaction('sessions', 'readwrite');
  for (let i = n - 1; i >= 0; i -= 1) {
    await tx.store.add(make(new Date(Date.UTC(2026, 8, 10) - i * DAY_MS), n - i));
  }
  await tx.done;
}

function plainRow(at: Date, index: number): SessionRow {
  return {
    itemId: `song.day-${String(index)}`,
    mode: 'wait',
    tempoPct: 100,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 1_000,
    at: at.toISOString(),
  };
}

describe('the sessions store is bounded', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
  });

  it('leaves a store under the cap alone', async () => {
    await seed(50);
    expect(await pruneSessions()).toBe(0);
    expect(await sessionCount()).toBe(50);
  });

  // Revised (C1): this seeded `MAX_SESSIONS + 201` rows. The cap is now tens of
  // thousands of runs, and the rule it tests — over the cap plus its slack,
  // back down to the cap, oldest first — is the same rule at any cap.
  it('brings a store over the cap back down to it', async () => {
    const cap = 120;
    const slack = 20;
    await seed(cap + slack + 1);
    const dropped = await pruneSessions(cap, slack);
    expect(dropped).toBe(slack + 1);
    expect(await sessionCount()).toBe(cap);
  });

  it('drops the oldest, never the newest', async () => {
    // A small cap and no slack so the arithmetic is readable; the rule is the
    // same one. The slack exists so that a phone does not walk a cursor after
    // every single run, not to change which rows survive.
    await seed(30);
    await pruneSessions(4, 0);
    const kept = await recentSessions(100);
    expect(kept).toHaveLength(4);
    expect(kept.map((row) => row.itemId)).toEqual([
      'song.day-30',
      'song.day-29',
      'song.day-28',
      'song.day-27',
    ]);
  });

  // Revised (C1). This was "keeps more than any screen reads, so the bound is
  // invisible" — `MAX_SESSIONS > 1_000` — and its premise was that nothing
  // reads an old row. Observations are evidence, so the bound is now held to
  // what a learner produces and what the storage costs.
  it('holds years of a busy learner’s runs, and at the cap costs less than its budget', () => {
    // Five years at ten runs a day before the last resort deletes anything.
    expect(MAX_SESSIONS).toBeGreaterThanOrEqual(RUNS_A_DAY * 365 * 5);
    // The window's rows keep their per-step detail; the rest are compacted.
    const full = observedRow(new Date('2026-09-10T12:00:00Z'));
    const compacted = compactObservation(full);
    const windowRows = RUNS_A_DAY * OBSERVATION_WINDOW_DAYS;
    const atCap = windowRows * bytes(full) + (MAX_SESSIONS + PRUNE_SLACK - windowRows) * bytes(compacted);
    expect(atCap, 'the store at the cap is over the budget the storage report was measured against').toBeLessThan(
      SESSIONS_BUDGET_BYTES,
    );
    // And compacting is worth doing: the per-step detail is more than half a row.
    expect(bytes(compacted) * 2).toBeLessThan(bytes(full));
  });

  it('says nothing and breaks nothing when there is no database at all', async () => {
    clearFakeIndexedDb();
    expect(await pruneSessions()).toBe(0);
    expect(await compactSessions()).toBe(0);
    expect(await sessionCount()).toBe(0);
  });
});

describe('old observations are compacted, not deleted', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
  });

  it('compacting keeps the row, its totals and per-bar tallies, and drops only the per-step detail', () => {
    const row = {
      ...observedRow(new Date('2026-01-01T12:00:00Z')),
      steps: {
        from: 4,
        // Bar 1: hit, missed, early, part. Bar 2: two hits, one step with
        // nothing to play, one not reached.
        codes: 'hmep' + 'hh-.',
        measures: [0, 1, 4, 2],
        wrong: [5, 61, 9, 70, 9, 71],
        early: [6, 64],
        timing: [4, 10, 6, -300, 7, 30, 8, -20, 9, 40],
      },
    } as unknown as SessionRow;
    const compacted = compactObservation(row);
    expect(compacted.steps).toBeUndefined();
    // [measure, steps, clean, missed, early, wrong, timed, mean ms]
    expect(compacted.bars).toEqual([
      [1, 4, 1, 2, 1, 1, 3, -87],
      [2, 3, 2, 0, 0, 2, 2, 10],
    ]);
    // Everything that is not per-step survives as it was.
    const { steps: _dropped, ...rest } = row;
    const { bars: _added, ...kept } = compacted;
    expect(kept).toEqual(rest);
  });

  it('a Wait run compacts without timing, because it had none', () => {
    const row = {
      ...observedRow(new Date('2026-01-01T12:00:00Z')),
      mode: 'wait',
      timing: 'not measured',
      early: 'not measured',
      steps: { from: 0, codes: 'hwhl', measures: [0, 0], wrong: [1, 63], early: [], timing: 'not measured' },
    } as unknown as SessionRow;
    expect(compactObservation(row).bars).toEqual([[0, 4, 2, 0, 0, 1]]);
  });

  it('recording a run tidies the store by itself: old rows compacted, none deleted, new ones whole', async () => {
    const now = new Date('2026-09-10T12:00:00Z');
    const old = new Date(now.getTime() - (OBSERVATION_WINDOW_DAYS + 5) * DAY_MS);
    const recent = new Date(now.getTime() - 2 * DAY_MS);
    await seed(3, (_at, index) => observedRow(index === 3 ? recent : old, `song.row-${String(index)}`));
    await recordRun(RUN, now);
    // Revised (C1): this called `pruneSessions()` itself after the run, so it
    // proved the prune works and not that the run asks for one. It waits for
    // the tidy the run started, and does nothing else.
    await sessionsTidied();
    const rows = await recentSessions(10);
    expect(rows, 'a row was deleted to make room').toHaveLength(4);
    const byItem = new Map(rows.map((row) => [row.itemId, row]));
    for (const id of ['song.row-1', 'song.row-2']) {
      expect(byItem.get(id)?.steps, `${id} is past the window and kept its per-step detail`).toBeUndefined();
      expect(byItem.get(id)?.bars?.length).toBe(64);
      expect(byItem.get(id)?.pitch).toEqual({ definition: 'tempo-notes', right: 560, of: 602, estimated: false });
    }
    expect(byItem.get('song.row-3')?.steps, 'a row inside the window lost its detail').toBeDefined();
  });
});
