// @vitest-environment jsdom
// jsdom since CL23: the evidence-bearing budget fixture is a real sight-read, written by the
// generator and read into the model the engine plays through OSMD (`helpers/reader`).
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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import {
  MAX_SESSIONS,
  OBSERVATION_WINDOW_DAYS,
  PRUNE_SLACK,
  PROTECTED_READS,
  SESSIONS_BUDGET_BYTES,
  attemptDemands,
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
import { readingOptions } from '../../src/curriculum/session';
import { DEMAND_WINDOW_READS, demandReadings } from '../../src/evidence/demandReadings';
import { EVIDENCE_DEFINITIONS, evidenceFor, stampedEvidence, type EvidenceResult, type MeasuredEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem } from '../../src/curriculum/types';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { observe } from './helpers/observed';
import { phrase } from './helpers/phrase';
import { readPhrase } from './helpers/reader';

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

/** A day the prune runs on, long after every seeded run: all of them are past the observation window. */
const PRUNED_ON = new Date(Date.UTC(2027, 0, 1));

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
  // Revised (C7): the prune never reaches into the observation window, so the
  // day it runs on is given, well after the seeded runs, rather than read off
  // the clock the test happens to run under.
  it('brings a store over the cap back down to it', async () => {
    const cap = 120;
    const slack = 20;
    await seed(cap + slack + 1);
    const dropped = await pruneSessions(cap, slack, PRUNED_ON);
    expect(dropped).toBe(slack + 1);
    expect(await sessionCount()).toBe(cap);
  });

  it('drops the oldest, never the newest', async () => {
    // A small cap and no slack so the arithmetic is readable; the rule is the
    // same one. The slack exists so that a phone does not walk a cursor after
    // every single run, not to change which rows survive.
    await seed(30);
    await pruneSessions(4, 0, PRUNED_ON);
    const kept = await recentSessions(100);
    expect(kept).toHaveLength(4);
    expect(kept.map((row) => row.itemId)).toEqual([
      'song.day-30',
      'song.day-29',
      'song.day-28',
      'song.day-27',
    ]);
  });

  // Added (C7, L87): the last resort deletes old runs only. When the runs that
  // must be kept are past the cap on their own, deleting yesterday's would
  // not bring the store back to it, and yesterday's is what the history shows.
  it('never deletes a run inside the observation window', async () => {
    await seed(30);
    const soon = new Date(Date.UTC(2026, 8, 12));
    expect(await pruneSessions(4, 0, soon), 'a run from the last few weeks was pruned').toBe(0);
    expect(await sessionCount()).toBe(30);
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

// --- CL23, L69: a run's per-demand evidence folded to counts, outside the reader's reach -----------
//
// Compaction folded `steps` to bars and left the evidence's `byDemand`/`otherDemands` step-index
// arrays as they were. Two readers of those entries need only counts or demand ids (`heldBack`,
// `curriculum/session.ts`:2395–2405; `playedDemands`, `curriculum/transfer.ts`:161–166); the third,
// `demandReadings`, builds its rival/alone/selectivity facts from the arrays and nothing else, over a
// skill's newest `DEMAND_WINDOW_READS` reads pooled across the sight-reading items — whose last five
// can be older than the observation window for a rarely read skill. So a record keeps its arrays
// while any reader could still reach it, and is folded only once it is proven outside its own
// item's newest five measured records of its skill under its evidence stamp: a safe superset of the
// pooled window, which needs catalogue facts this store does not have (the reviewer's required
// change, `docs/review/responses/questions-122a5224.md` §CL23).

const NOW = new Date('2026-09-30T12:00:00.000Z');
const ago = (days: number): string => new Date(NOW.getTime() - days * DAY_MS).toISOString();
const READER = 'drill.reading.sight-reading-2-right';

function measuredOf(row: SessionRow): MeasuredEvidence[] {
  return (row.evidence ?? []).filter((one): one is MeasuredEvidence => one.kind === 'measured');
}

/** Whether any measured record of the row still holds a step index (`steps`, `wrong`, `unattributed`, `otherDemands[].steps`). */
function holdsPositions(row: SessionRow | undefined): boolean {
  return measuredOf(row as SessionRow).some(
    (one) =>
      one.byDemand.some((entry) => entry.steps.length > 0 || entry.wrong.length > 0 || (entry.unattributed?.length ?? 0) > 0) ||
      (one.otherDemands ?? []).some((other) => other.steps.length > 0),
  );
}

/** What the two count readers take from a row's measured records: the totals, each entry's demand, `n` and `right`, and every located demand. */
function countsOf(row: SessionRow): unknown {
  return measuredOf(row).map((one) => ({
    skill: one.skill,
    n: one.n,
    right: one.right,
    byDemand: one.byDemand.map(({ demand, n, right }) => ({ demand, n, right })),
    otherDemands: (one.otherDemands ?? []).map((other) => other.demand),
  }));
}

/** Every index of the row's evidence that holds a measured record: the fold's whole reach, for a row nothing protects. */
function everyMeasured(row: SessionRow): Set<number> {
  return new Set((row.evidence ?? []).flatMap((one, index) => (one.kind === 'measured' ? [index] : [])));
}

/**
 * Two bars, one hand: steps and skips, in quarters and in eighths (`evidenceByDemand.test.ts`'s
 * `ONE_HAND`). Steps (model indexes): 0 C4, 1 E4 skip, 2 F4 step (eighth), 3 D4 skip (eighth),
 * 4 E4 step, 5 G4 skip, 6 F4 step, 7 E4 step (half) — so each skill read here locates the other's
 * demands in `otherDemands`, as a real sight-read's records do.
 */
const READ = phrase({
  bars: [
    [
      { at: 0, pitch: 'C4' },
      { at: 1, pitch: 'E4' },
      { at: 2, dur: 0.5, pitch: 'F4' },
      { at: 2.5, dur: 0.5, pitch: 'D4' },
      { at: 3, pitch: 'E4' },
    ],
    [
      { at: 0, pitch: 'G4' },
      { at: 1, pitch: 'F4' },
      { at: 2, dur: 2, pitch: 'E4' },
    ],
  ],
});
const READ_SKILLS = ['sight-reading', 'interval-reading', 'subdivision'];

/**
 * A first reading of `READ` stored as the Score screen stores it: played through the real engine
 * (`helpers/observed`), its evidence computed for the three skills and stamped (`stampedEvidence`),
 * the steps in `wrong` left unplayed.
 */
function read(daysAgo: number, itemId = READER, wrong: number[] = [1, 3]): SessionRow {
  const at = ago(daysAgo);
  const observation = observe(READ, { mode: 'tempo', unseen: true, guide: 'off', itemId, at, skip: wrong });
  const results = evidenceFor({ observation, played: READ, targetSkills: READ_SKILLS, vocabulary: VOCABULARY_V0 });
  return { ...observation, ...stampedEvidence(results) } as unknown as SessionRow;
}

/** Writes the rows in the order given — so keys rise in that order — and returns their keys. */
async function store(rows: readonly SessionRow[]): Promise<number[]> {
  const db = await openDatabase();
  if (!db) throw new Error('the fake database did not open');
  const keys: number[] = [];
  for (const row of rows) keys.push(await db.add('sessions', row));
  return keys;
}

async function storedRows(): Promise<SessionRow[]> {
  const db = await openDatabase();
  return (await db?.getAll('sessions')) ?? [];
}

const byKey = (rows: readonly SessionRow[], key: number): SessionRow | undefined => rows.find((row) => row.id === key);

describe('the fold itself', () => {
  it('copies the reader’s window, which this store cannot import', () => {
    expect(PROTECTED_READS).toBe(DEMAND_WINDOW_READS);
  });

  it('folds a measured record proven outside to its counts, and leaves every other record, and a row without evidence, as they were', () => {
    const row = read(200);
    const measured = measuredOf(row);
    expect(measured.length, 'the fixture has no measured record').toBeGreaterThan(0);
    expect(measured.some((one) => (one.otherDemands ?? []).length > 0), 'the fixture locates no other demand').toBe(true);
    const refusal: EvidenceResult = { kind: 'refusal', skill: 'hands-together', reason: 'not-observed', cites: ['hands'] } as unknown as EvidenceResult;
    const own = { kind: 'self-assessed', skill: 'sight-reading', observationId: null, report: 'ok', at: row.at, context: { itemId: READER } } as unknown as EvidenceResult;
    const withOthers = { ...row, evidence: [...(row.evidence ?? []), refusal, own] } as SessionRow;
    const all = new Set((withOthers.evidence ?? []).map((_one, index) => index));

    const folded = compactObservation(withOthers, all);
    expect(folded.steps).toBeUndefined();
    expect(folded.bars?.length).toBeGreaterThan(0);
    expect(holdsPositions(folded), 'a step index survived the fold').toBe(false);
    expect(countsOf(folded), 'a count or a demand changed in the fold').toEqual(countsOf(withOthers));
    // The refusal and the learner's own word carry no positions and are kept whole.
    expect(folded.evidence?.slice(-2)).toEqual([refusal, own]);
    // Each folded entry keeps the declared shape (`evidence.ts`'s `DemandCount`, `DemandOverlap`): empty arrays, never none.
    for (const one of measuredOf(folded)) {
      for (const entry of one.byDemand) expect(entry).toEqual({ demand: entry.demand, n: entry.n, right: entry.right, steps: [], wrong: [] });
      for (const other of one.otherDemands ?? []) expect(other).toEqual({ demand: other.demand, steps: [] });
    }
    // Everything that is not the evidence is compacted exactly as before.
    expect({ ...folded, evidence: undefined }).toEqual({ ...compactObservation(withOthers), evidence: undefined });

    // Nothing proven outside folds nothing: the default, so a caller that forgets the reach keeps every position.
    expect(holdsPositions(compactObservation(withOthers))).toBe(true);
    expect(compactObservation(withOthers).evidence).toEqual(withOthers.evidence);

    // A row with no evidence compacts as it always did.
    const plain = { ...row };
    delete plain.evidence;
    delete plain.evidenceDefinitions;
    expect(compactObservation(plain, new Set([0, 1]))).toEqual(compactObservation(plain));
    expect('evidence' in compactObservation(plain, new Set([0]))).toBe(false);
  });

  // The guard for the two readers this lane is allowed to affect. `heldBack` and `playedDemands`
  // are module-private, so this reads the fields they read at those lines — `entry.demand`,
  // `entry.n`, `entry.right` of each `byDemand` entry; the demand of every `byDemand` and
  // `otherDemands` entry — and calls `attemptDemands`, the same projection `playedDemands` makes,
  // exported where the run is recorded. A stand-in for the two functions, said as one.
  it('leaves what heldBack and playedDemands read bit for bit as it was', () => {
    const row = read(200);
    const folded = compactObservation(row, everyMeasured(row));
    expect(holdsPositions(folded)).toBe(false);
    expect(countsOf(folded)).toEqual(countsOf(row));
    expect(attemptDemands(folded.evidence)).toEqual(attemptDemands(row.evidence));
    expect(attemptDemands(folded.evidence)?.length).toBeGreaterThan(0);
  });
});

describe('the budget, with a run that carried evidence (L69)', () => {
  const SOURCE = join(process.cwd(), '..', 'content');
  const catalog = JSON.parse(readFileSync(join(SOURCE, 'catalog.static.json'), 'utf8')) as CatalogItem[];

  // The fixture is a real sight-read: every reading row the catalogue holds, written by the
  // generator from the row's own parameters (`readingOptions`, unheld), read into the engine's
  // model, played and measured, its evidence computed for the row's declared skills and stamped as
  // the Score screen does it (`helpers/reader`). The largest evidence of them is the case.
  //
  // What it holds is what L69 changes: compacting such a run past the reader's reach folds every
  // step index away, keeps the counts, and costs less than keeping them. It does **not** hold the
  // store at the cap under `SESSIONS_BUDGET_BYTES` with rows like this one: measured where this
  // lane was built, a store at the cap in which about one run in five or more is such a sight-read
  // is at or over the budget even with the fold — the evidence's demand ids, contexts and refusals
  // outweigh the arrays the fold removes. That is the byte bound L51 decides (a DECISION row of
  // CL23's cluster), not a share of runs this test may choose so that it passes.
  it('folds a compacted sight-read’s positions away, keeps its counts, and is smaller for it', async () => {
    const rows = catalog.filter((item) => item.drill?.kind === 'sight-reading');
    expect(rows.length).toBeGreaterThan(0);
    const reads: SessionRow[] = [];
    for (const item of rows) reads.push((await readPhrase({ item, options: readingOptions(item, undefined, 1), at: ago(200) })).row);
    const largest = reads.reduce((best, one) => (bytes(one.evidence) > bytes(best.evidence) ? one : best));
    expect(measuredOf(largest).length).toBeGreaterThan(0);

    const kept = compactObservation(largest);
    const folded = compactObservation(largest, everyMeasured(largest));
    expect(holdsPositions(kept), 'the fixture carried no positions to fold').toBe(true);
    expect(holdsPositions(folded), 'a step index survived the fold').toBe(false);
    expect(countsOf(folded)).toEqual(countsOf(largest));
    expect(bytes(folded), 'the fold saved nothing on a compacted sight-read').toBeLessThan(bytes(kept));
  }, 60_000);
});

describe('the fold reaches only what the reader cannot (L69, path (b))', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
  });

  // The reviewer's discriminating case: six reads of one item, the oldest of the newest five older
  // than the observation window. The five are what `demandReadings` reads; the sixth is outside.
  it('six reads: the five the reader reads keep their positions past the window, the sixth is folded, and the readings are the same', async () => {
    const keys = await store([read(200, READER, [1, 3]), read(150), read(120, READER, [5]), read(100), read(50, READER, [2, 6]), read(5)]);
    const before = await storedRows();
    const readingsBefore = demandReadings(before, VOCABULARY_V0, NOW);
    // The window really does reach past the observation window: the reads at 150, 120 and 100 days.
    const window = new Set(readingsBefore.flatMap((one) => one.observations));
    expect([...window].sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(keys.slice(1));

    await compactSessions(NOW);
    const after = await storedRows();
    expect(demandReadings(after, VOCABULARY_V0, NOW), 'the readings changed in compaction').toEqual(readingsBefore);
    for (const key of keys.slice(1, 4)) {
      expect(byKey(after, key)?.steps, `read ${String(key)} is past the window and kept its per-step detail`).toBeUndefined();
      expect(holdsPositions(byKey(after, key)), `read ${String(key)} is one the reader reads, and lost its positions`).toBe(true);
    }
    expect(holdsPositions(byKey(after, keys[0] as number)), 'the sixth read is outside the reader’s five and kept its positions').toBe(false);
    expect(countsOf(byKey(after, keys[0] as number) as SessionRow)).toEqual(countsOf(byKey(before, keys[0] as number) as SessionRow));
    for (const key of keys.slice(4)) expect(byKey(after, key)?.steps, 'a read inside the window was compacted').toBeDefined();
  });

  // The reader pools a skill's reads across every sight-reading item; this store sees one item at
  // a time. B's one old read is outside the pooled five (A's five are newer) and inside its own
  // item's five, which is the set the store protects.
  it('two items: B’s one old read, outside the pooled five and inside its own, keeps its positions; A’s sixth is folded', async () => {
    const OTHER = 'drill.reading.sight-reading-1';
    const keys = await store([read(200), read(120, OTHER, [1, 5]), read(40), read(30, READER, [2]), read(20), read(10, READER, [4, 6]), read(5)]);
    const [aSixth, bOnly] = keys as [number, number];
    const before = await storedRows();
    const readingsBefore = demandReadings(before, VOCABULARY_V0, NOW);
    expect(readingsBefore.flatMap((one) => one.observations), 'B’s read is in the pooled window, so the case does not discriminate').not.toContain(bOnly);

    await compactSessions(NOW);
    const after = await storedRows();
    expect(demandReadings(after, VOCABULARY_V0, NOW)).toEqual(readingsBefore);
    expect(byKey(after, bOnly)?.steps).toBeUndefined();
    expect(holdsPositions(byKey(after, bOnly)), 'B’s only read was folded though it is inside its own item’s five').toBe(true);
    expect(holdsPositions(byKey(after, aSixth)), 'A’s sixth read kept its positions').toBe(false);
  });

  // A record under another evidence stamp is not read beside the candidate's (`storedEvidence`
  // reads one stamp), so it must not count toward the five that would fold it.
  it('a newer read under another evidence stamp does not count toward the five', async () => {
    const stale = { ...read(20), evidenceDefinitions: EVIDENCE_DEFINITIONS - 1 } as SessionRow;
    const keys = await store([read(300), read(200, READER, [2, 4]), read(40), read(30), stale, read(10), read(5)]);
    const [older, candidate] = keys as [number, number];
    const before = await storedRows();
    const readingsBefore = demandReadings(before, VOCABULARY_V0, NOW);
    // The reader does read the candidate: the stale read leaves it in the newest five.
    expect(readingsBefore.flatMap((one) => one.observations)).toContain(candidate);

    await compactSessions(NOW);
    const after = await storedRows();
    expect(demandReadings(after, VOCABULARY_V0, NOW)).toEqual(readingsBefore);
    expect(holdsPositions(byKey(after, candidate)), 'the candidate was folded by a count that included a stale read').toBe(true);
    expect(holdsPositions(byKey(after, older)), 'the read with five same-stamp reads after it kept its positions').toBe(false);
  });

  // The rest of the reader's own filters, copied: a tie with the fifth is protected (the reader's
  // stable sort breaks it by catalogue order, which this store cannot see); a read dated after the
  // compaction's own day is not newer (the reader skips one dated after its day); a newer read
  // under a lower key is not counted (the reader takes an item's newest rows by key, and a restored
  // backup writes older runs under newer keys); a record that is not measured is not a read.
  const CASES: { name: string; rows: () => SessionRow[] }[] = [
    { name: 'a newer read tied with the candidate', rows: () => [read(200), { ...read(40), at: ago(200) }, read(30), read(20), read(10), read(5)] },
    { name: 'a read dated after the compaction’s day', rows: () => [read(200), read(40), read(30), read(20), read(10), { ...read(5), at: new Date(NOW.getTime() + DAY_MS).toISOString() }] },
    { name: 'the newest read under a lower key', rows: () => [read(200), read(40), read(30), read(20), read(10)] },
    {
      name: 'a newer run whose records are not measured',
      rows: () => [read(200), read(40), read(30), read(20), read(10), { ...read(5), evidence: [{ kind: 'self-assessed', skill: 'sight-reading', observationId: null, report: 'ok', at: ago(5), context: { itemId: READER } }, { kind: 'refusal', skill: 'interval-reading', reason: 'not-observed', cites: ['hands'] }] } as unknown as SessionRow],
    },
  ];
  for (const one of CASES) {
    it(`does not count ${one.name} toward the five`, async () => {
      if (one.name.startsWith('the newest read under a lower key')) await store([read(4)]);
      const [candidate] = (await store(one.rows())) as [number];
      await compactSessions(NOW);
      const after = await storedRows();
      expect(byKey(after, candidate)?.steps).toBeUndefined();
      expect(holdsPositions(byKey(after, candidate)), `the candidate was folded counting ${one.name}`).toBe(true);
    });
  }

  // The deferred fold (the brief's premise 24): a read protected when it crossed the window is
  // pushed out of its item's five only by a new run of that item, by then far behind the window's
  // edge, so the ordinary walk never comes back to it. The run's own tidy walks the item, and a row
  // that still holds positions is not "already compact" there, or the walk would stop on the
  // protected rows above it before reaching it.
  it('a new run of the item folds the read it pushed out of the five, past rows still protected', async () => {
    const protectedRow = (daysAgo: number, index: number): SessionRow =>
      ({
        itemId: READER,
        mode: 'tempo',
        tempoPct: 70,
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 30_000,
        at: ago(daysAgo),
        evidenceDefinitions: EVIDENCE_DEFINITIONS,
        evidence: [
          {
            kind: 'measured',
            skill: `skill.only-${String(index)}`,
            observationId: null,
            standard: 'full',
            n: 1,
            right: 1,
            at: ago(daysAgo),
            context: { itemId: READER, met: [], unattributed: 0, estimated: false },
            byDemand: [{ demand: 'melodic-step', n: 1, right: 1, steps: [0], wrong: [] }],
          },
        ],
      }) as unknown as SessionRow;
    // The oldest read, compacted when it crossed the window with its positions kept (it had fewer
    // than five reads after it then), then more rows than the walk's stop of fifty, each the only
    // record of its skill and so protected for good, then four recent reads: four after it now.
    const rows: SessionRow[] = [compactObservation(read(300))];
    for (let i = 0; i < 60; i += 1) rows.push(protectedRow(290 - i, i));
    rows.push(read(40), read(30), read(20), read(10));
    const [oldest] = (await store(rows)) as [number];
    await compactSessions(NOW);
    expect(holdsPositions(byKey(await storedRows(), oldest)), 'the oldest read was folded with four reads after it').toBe(true);

    const fifth = read(0);
    await recordRun({ ...(fifth as unknown as RunResult), passed: false, masterEligible: false }, NOW);
    await sessionsTidied();
    const after = await storedRows();
    expect(holdsPositions(byKey(after, oldest)), 'the read the new run pushed out of the five kept its positions').toBe(false);
    expect(after.filter((row) => measuredOf(row).some((one) => one.skill.startsWith('skill.only-'))).every(holdsPositions), 'a protected row was folded').toBe(true);
  });
});
