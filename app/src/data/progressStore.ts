/**
 * What the learner has practised, and what that adds up to.
 *
 * Progress is the one thing in the app that cannot be regenerated: scores can
 * be rebuilt and settings retyped, but a year of practice history exists only
 * here. So every write goes to IndexedDB *and* to an in-memory copy, and a
 * failed write is reported rather than swallowed — a silent failure here is
 * the worst bug this app could have.
 */
import { dailySeed } from '../engine/sightReading';
import { compactSteps, DEFAULT_MASTERY } from '../engine/Scoring';
import type { NotMeasured } from '../engine/types';
import {
  isPhraseRun,
  openDatabase,
  type ContactSpan,
  type ContactSummaryRow,
  type EncounterKind,
  type EncounterRow,
  type ProgressRow,
  type RunObservation,
  type SessionRow,
  type StreakRow,
  withPerformanceMark,
} from './db';
import {
  knownMaterial,
  learnerMaterialKeys,
  materialKey,
  materialOfItem,
  sameMaterial,
  tempoNotComparable,
  tempoRepairedRow,
} from '../curriculum/material';
import type { Identity } from '../review/record';
import type { CatalogItem, Hands } from '../curriculum/types';
import type { Relationship } from '../curriculum/transfer';
import type { EvidenceResult, MeasuredEvidence } from '../evidence/evidence';

/**
 * One finished run, as its screen hands it to the store.
 *
 * Since C1 it carries the run's observation (`RunObservation`, in `db.ts`):
 * what the run measured by its own definitions, the conditions it was played
 * under, and every channel it did not measure marked `not measured`. The store
 * keeps all of it on the session row; `passed`, `masterEligible` and
 * `selfPassed` are what it acts on for the item's progress.
 *
 * Since D4 the header also carries what was played and why (`db.RunHeader`):
 * `material`, the exact versioned identity; `role`, the item's; `intent` and
 * `relationship`, where the run came from a transfer offer. Facts for later
 * readers (`contactIn` reads `material`); the store acts on none of them, but
 * for one question: a fresh *mastered* of an item a reviewed repair changed the
 * tempo of reads `material` and `baseTempo` (E50c, `recordRun`).
 */
export interface RunResult extends RunObservation {
  itemId: string;
  lessonId?: string;
  /**
   * The generated phrase's seed, when the run was of one (`04` §2). Today's
   * read is the run whose seed is the day's, and that is how the day is
   * ticked — here, so that every path that records a run (the Score screen,
   * the test hook) ticks it the same way.
   */
  seed?: number;
  mode: string;
  tempoPct: number;
  /** A fraction, or `not measured` for a run that measured none (C1). */
  accuracy: number | NotMeasured;
  accuracyEstimated: boolean;
  wrongNotes: number | NotMeasured;
  missed: number | NotMeasured;
  /** A judged drill set's answered count (U102). See `SessionRow`. */
  answered?: number;
  durationMs: number;
  passed: boolean;
  masterEligible: boolean;
  selfReport?: 'rough' | 'ok' | 'clean';
  /** Paper runs (replan §5.3). See `SessionRow`. */
  steadinessMs?: number;
  notesHeard?: number;
  bpm?: number;
  /** A performance run (replan §8): no restarts, no loop. */
  performance?: boolean;
  /** A rhythm-only run (`05` §3a): the notes were not judged, so it never passes. */
  rhythmOnly?: boolean;
  /** The pass is the owner's word, not a measurement. */
  selfPassed?: boolean;
  /**
   * Whether the run measured a tempo (T37). `false` on a Wait for me run and on
   * a run nothing was listening to: their `tempoPct` is a setting, so it never
   * becomes the item's best tempo. Absent reads as the old behaviour, for the
   * writers that do not say.
   */
  tempoMeasured?: boolean;
}

export const DEFAULT_WEEKLY_GOAL_MINUTES = 150;

/**
 * docs/02 Part G: the master standard on this many different days is mastery.
 * The sheet's "Mastery run 1 of 2" reads it, and the heading is taken from the
 * row `recordRun` returns, so it can never say *Mastered* before the store has.
 */
export const MASTER_DAYS = 2;

/**
 * The date a moment belongs to, **where the owner is**.
 *
 * This was `toISOString().slice(0, 10)`, which is the date in UTC. The owner is
 * in the US, so from mid-afternoon onwards that is *tomorrow*: an hour of
 * practice after 7 pm Eastern was filed under the next day, the heat map showed
 * today as blank while the minutes sat in a square that had not happened yet,
 * and a Saturday-evening session counted towards the following week's goal. Six
 * days out of seven nobody would notice; the seventh is the day the weekly goal
 * is decided.
 *
 * Local, therefore, and the same rule everywhere a day is named — `passedOn`
 * (mastery wants the master standard on two different *days*), the minutes, and the Progress
 * screen's heat map, which walks days with local arithmetic and was keying them
 * with the UTC formatter.
 */
export function dayKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = `${String(now.getMonth() + 1).padStart(2, '0')}`;
  const day = `${String(now.getDate()).padStart(2, '0')}`;
  return `${String(year)}-${month}-${day}`;
}

const today = dayKey;

function freshRow(itemId: string): ProgressRow {
  return {
    itemId,
    status: 'new',
    bestAccuracy: 0,
    bestTempoPct: 0,
    attempts: 0,
    lastPracticedAt: '',
    minutes: 0,
    passedOn: [],
  };
}

const memory = new Map<string, ProgressRow>();
let streakMemory: StreakRow | null = null;
/**
 * The rows the rung state is derived from (C5), without their per-step detail:
 * read once a session by `rungRows`, then kept current by every write here.
 */
let rungRowsMemory: SessionRow[] | null = null;
const listeners = new Set<() => void>();

export function onProgressChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(): void {
  for (const listener of listeners) listener();
}

export async function getProgress(itemId: string): Promise<ProgressRow> {
  const cached = memory.get(itemId);
  if (cached) return cached;
  const db = await openDatabase();
  const row = (await db?.get('progress', itemId)) ?? freshRow(itemId);
  memory.set(itemId, row);
  return row;
}

export async function allProgress(): Promise<ProgressRow[]> {
  const db = await openDatabase();
  const rows = (await db?.getAll('progress')) ?? [...memory.values()];
  for (const row of rows) memory.set(row.itemId, row);
  return rows;
}

/**
 * How many of `masteredOn`'s days a fresh *mastered* may count (E50c; the reviewer's required change on E50b,
 * `docs/review/responses/65ae9d5f.md`). For an item no reviewed repair touched, every date, as always. For one
 * whose tempo a repair changed (`material.tempoRepairedRow`), only a day supported by a run whose tempo channel
 * is comparable under E50b's rule (`material.tempoNotComparable`) and whose own stored fields meet the master
 * terms (`meetsMasterTerms`): an old file's run at
 * 100 % of the converter's defaulted 96 was not at the tempo the repaired score prints, and a legacy run with no
 * material or base proves nothing. Refused, never rescaled; no date is rewritten or dropped.
 *
 * Today's run is not stored yet: it supports today where the engine judged it master-eligible and it is
 * comparable. Every other support is a stored run of the item on that calendar day (`dayKey` of its `at`, the
 * learner's day, as the dates are), read uncapped because the earliest date can sit any number of runs back and
 * this read happens only while a repaired item's mastery is pending. No stored row says why an engine refused a
 * run it did not store the reason for (a technique measure, `ScoreScreen`): such a run is read on its numbers.
 * Without IndexedDB no session row is written, so a repaired item's earlier days are never supported: refusal.
 */
async function daysTowardMastery(
  result: RunResult,
  masterEligible: boolean,
  masteredOn: readonly string[],
  date: string,
): Promise<number> {
  if (masteredOn.length < MASTER_DAYS || !tempoRepairedRow(result.itemId)) return masteredOn.length;
  const counted = new Set<string>();
  if (masterEligible && !tempoNotComparable(result)) counted.add(date);
  for (const run of await sessionsForItem(result.itemId, Number.POSITIVE_INFINITY)) {
    const day = dayKey(new Date(run.at));
    if (masteredOn.includes(day) && !tempoNotComparable(run) && meetsMasterTerms(run)) counted.add(day);
  }
  return counted.size;
}

/**
 * A stored run's own numbers against the master terms (`Scoring.evaluateOutcome`'s `masterEligible`: a measured
 * tempo, the master accuracy, the master tempo), and not a rhythm-only run, which the Score screen never lets
 * master and whose row says so.
 */
function meetsMasterTerms(run: SessionRow): boolean {
  return (
    run.tempoMeasured === true &&
    run.rhythmOnly !== true &&
    typeof run.accuracy === 'number' &&
    run.accuracy >= DEFAULT_MASTERY.masterAccuracy &&
    run.tempoPct >= DEFAULT_MASTERY.masterTempoPct
  );
}

/**
 * Records one run: updates the item's progress, appends a session row, and
 * adds the minutes to today's total.
 *
 * `master` needs the master standard on two *different days* (docs/02 Part
 * G), which is why `masteredOn` is a list of dates and not a count, and why it
 * is a list of its own: it used to be read off `passedOn`, so one
 * master-standard run after any earlier pass was "mastered" (T37).
 */
export async function recordRun(result: RunResult, now = new Date()): Promise<ProgressRow> {
  const row = { ...(await getProgress(result.itemId)) };
  const date = today(now);
  /**
   * Whether this run can be evidence of what its item claims (C1, reviewer
   * decision 3). A generated phrase heard or read before (`unseen: false`) is
   * not a first reading: it is kept — its minutes, its attempt, its row — and
   * it passes nothing, masters nothing, sets no best and ticks no day. Here,
   * in the store every writer goes through, so a writer that forgets cannot
   * turn practice into evidence.
   *
   * A phrase's rule only (`isPhraseRun`, G1): `unseen` is the phrase's field
   * (G1a; the relation on every run is `firstContact`, which gates nothing
   * here), and a piece's run G1's app stored with `unseen: false` is practice
   * that passes as it always did.
   */
  const evidence = !(result.unseen === false && isPhraseRun(result));
  // The same exercise opened from Plan or the Library is a different phrase
  // and does not tick the day; a day already ticked stays ticked when the
  // stage moves on and Today picks another item. It used to be read off the
  // item's `lastPracticedAt`, which had both faults (2026-09-16). A phrase
  // heard before it was read is today's phrase and not today's read.
  if (evidence && result.seed !== undefined && result.seed === dailySeed(dayKey(now))) await markDailyRead(now);
  /**
   * A generated sight-reading phrase carries no piece semantics (C5, S8): its
   * row is not passed, not mastered and not put on the review calendar, and
   * sets no best. Every open writes a phrase never seen before, so "passed"
   * and "mastered" would be claims about the row that no reading supports;
   * what a reading shows is its evidence, on the session row, which the
   * reader and `rungState` read. `unseen` (or the recipe) is written on every
   * run of a generated phrase (C1, C4); G1's app wrote `unseen` on every Score
   * screen run, so which runs are phrases is `isPhraseRun`'s to say, and every
   * row written before G1a reads as it did. The row keeps its practice — the
   * attempt, the minutes, when — and the day's tick above stays: a habit, not
   * a mastery.
   */
  const generated = isPhraseRun(result);
  const passed = evidence && result.passed && !generated;
  const masterEligible = evidence && result.masterEligible && !generated;

  row.attempts += 1;
  row.lastPracticedAt = now.toISOString();
  row.minutes += result.durationMs / 60_000;
  // Nothing measured is not a best of nought (C1): it leaves the best alone.
  // A generated phrase has no best either: each is a different phrase (S8).
  if (evidence && !generated && typeof result.accuracy === 'number') {
    row.bestAccuracy = Math.max(row.bestAccuracy, result.accuracy);
  }
  // A tempo nobody played to is not a best tempo (T37): a Wait run's number is
  // the slider's.
  if (passed && result.tempoMeasured !== false) {
    row.bestTempoPct = Math.max(row.bestTempoPct, result.tempoPct);
  }

  // A pass the owner asserted rather than the app measured keeps saying so,
  // and one that was measured clears the flag: playing it properly is a
  // stronger claim than having said you could, and it should replace it.
  if (passed) row.selfPassed = result.selfPassed ?? false;
  if (passed && !row.passedOn.includes(date)) row.passedOn.push(date);
  // The master standard, and only the master standard, counts towards
  // mastery; a mastered row stays mastered (rows mastered under the old rule
  // are not taken back). `masteredOn` is history, every date kept; a fresh
  // award counts only the days that still stand (E50c, `daysTowardMastery`).
  const masteredOn = [...(row.masteredOn ?? [])];
  if (masterEligible && !masteredOn.includes(date)) masteredOn.push(date);
  if (masteredOn.length > 0) row.masteredOn = masteredOn;
  if (row.status === 'mastered' || (await daysTowardMastery(result, masterEligible, masteredOn, date)) >= MASTER_DAYS) {
    row.status = 'mastered';
  } else if (passed) row.status = 'passed';
  else if (row.status === 'new') row.status = 'started';

  memory.set(row.itemId, row);
  // Each attempt carries its own transfer facts (G2), measured before this run joins the rows.
  const session = sessionRowFor(await withAttemptFacts(result), now);

  const db = await openDatabase();
  if (db) {
    await db.put('progress', row);
    const key = await db.add('sessions', session);
    rungRowsMemory?.push(forRungState({ ...session, id: key }));
    // Not awaited: the run is finished and the learner is looking at a
    // summary. Tidying up is the app's business, not theirs; a test waits for
    // it with `sessionsTidied()`. A run with a measured record can push an
    // older read of its item out of the demand readings' window, so its item
    // is walked for the fold too (CL23, L69).
    tidySessions(now, measuredIndexes(session).length > 0 ? session.itemId : undefined);
  }
  await addMinutes(result.durationMs / 60_000, now);
  notify();
  return row;
}

/**
 * The demands a run measured (G2): every demand its measured records located — each record's
 * `byDemand` and `otherDemands`, the same entries `curriculum/transfer.ts` reads a reference's texture
 * and rhythm from — once each, sorted. Undefined where the run has no measured record.
 */
export function attemptDemands(results: readonly EvidenceResult[] | undefined): string[] | undefined {
  const measured = (results ?? []).filter((one): one is MeasuredEvidence => one.kind === 'measured');
  if (measured.length === 0) return undefined;
  return [...new Set(measured.flatMap((one) => [...one.byDemand.map((entry) => entry.demand), ...(one.otherDemands ?? []).map((entry) => entry.demand)]))].sort();
}

const PLAYED_HANDS: Readonly<Record<string, Hands>> = { R: 'right', L: 'left', both: 'both' };

/**
 * The item as this run played it (G2): the candidate `relationshipOf` measures at `recordRun`, so the
 * run's side of the facts is read the way a reference's is (`referenceFacts`) — its identity the run's
 * material, its key the phrase recipe's where the material is a generator that fixes one (else the
 * row's measured key where the run played the row's own material), its hands the hands played, its
 * demands the run's measured ones. A reading row's catalogue entry has no key, demands or identity (its
 * phrase is made when it opens), so the row alone would leave every phrase's key, texture and rhythm
 * unknown. The family and the composition stay the row's: a phrase's family is its generator's.
 */
export function playedCandidate(item: CatalogItem, run: Pick<SessionRow, 'material' | 'hands'>, demands: readonly string[] | undefined): CatalogItem {
  const material = run.material;
  const recipeFifths = material?.kind === 'generator' && typeof material.recipe.fifths === 'number' ? material.recipe.fifths : undefined;
  const keys =
    recipeFifths !== undefined ? [{ fifths: recipeFifths }] : sameMaterial(material, materialOfItem(item)) ? item.notation?.keys : undefined;
  const { imported: _imported, ...rest } = item;
  return {
    ...rest,
    provenance: { ...(item.provenance ?? {}), ...(material === undefined ? {} : { identity: material }) } as CatalogItem['provenance'],
    hands: PLAYED_HANDS[run.hands?.played ?? ''] ?? item.hands,
    demands: demands === undefined ? undefined : [...demands],
    notation: item.notation ? { ...item.notation, keys: keys ?? [] } : keys ? ({ keys }) : item.notation,
  };
}

/**
 * Each measured record of a run with a material, given its own transfer facts (G2; the reviewer's
 * fact path, `docs/review/responses/a96395d.md`): `demands`, the run's measured list, and
 * `relationship` — the offer's as it was made, for the offer's skill on a transfer-offer run, else
 * `relationshipOf` over the item as played, against the rows stored before this run and the contexts
 * they established then (`shownOnRecords`, the ladder's own list). Written once, here; a reader never
 * fills one in later. Absent — unknown — for a run with no material, and the relationship where the
 * catalogue cannot be read or no longer has the item, or on a transfer-intended run with no
 * relationship (G68's shape, which a new write cannot take). The modules are imported where they are
 * needed: `transfer.ts` reads the ladder, which reads this module.
 */
async function withAttemptFacts(result: RunResult): Promise<RunResult> {
  const results = result.evidence;
  if (!Array.isArray(results) || !knownMaterial(result.material)) return result;
  const demands = attemptDemands(results);
  if (demands === undefined) return result;
  const skills = [...new Set(results.filter((one) => one.kind === 'measured').map((one) => one.skill))];
  const relationships = new Map<string, Relationship>();
  // The offer's relationship, as the offer made it, for the offer's skill (D4a's one fact).
  if (result.intent === 'transfer' && result.relationship !== undefined) relationships.set(result.relationship.skill, result.relationship);
  // A transfer-intended run without its relationship is G68's shape: nothing of it is measured afresh.
  const orphaned = result.intent === 'transfer' && result.relationship === undefined;
  const toMeasure = orphaned ? [] : skills.filter((skill) => !relationships.has(skill));
  if (toMeasure.length > 0) {
    try {
      const [{ relationshipOf, shownOnRecords }, { catalogIndex }, rows] = await Promise.all([
        import('../curriculum/transfer'),
        import('../curriculum/load'),
        rungRows(),
      ]);
      const index = await catalogIndex();
      const item = index.byId.get(result.itemId);
      if (item !== undefined) {
        const candidate = playedCandidate(item, result, demands);
        for (const skill of toMeasure) relationships.set(skill, relationshipOf(skill, candidate, rows, index.byId, shownOnRecords(skill, rows)));
      }
    } catch {
      // Unknown, and said so by its absence: never guessed.
    }
  }
  return {
    ...result,
    evidence: results.map((one) => {
      if (one.kind !== 'measured') return one;
      const relationship = relationships.get(one.skill);
      return { ...one, context: { ...one.context, demands, ...(relationship === undefined ? {} : { relationship }) } };
    }),
  };
}

/**
 * The session row for a run: everything the run carried, as it carried it,
 * but what the store acts on for the item (C1).
 *
 * It used to copy seven named fields and drop the rest, which is how the
 * engine's per-step outcomes, the hands and the rest were computed for the
 * sheet and thrown away (L15). Now every field comes across — `not measured`
 * included — and only `undefined` is left out, so an absent field still means
 * "this writer does not have that channel", and `performance` and
 * `rhythmOnly` are kept only where true, as they always were. A performance
 * carries the marker its index keys (CL23, L53; `withPerformanceMark`).
 */
function sessionRowFor(result: RunResult, now: Date): SessionRow {
  const { passed: _passed, masterEligible: _master, selfPassed: _self, performance, rhythmOnly, ...rest } = result;
  const session: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) session[key] = value;
  }
  return withPerformanceMark({
    ...(session as unknown as Omit<SessionRow, 'at'>),
    at: now.toISOString(),
    ...(performance ? { performance: true } : {}),
    ...(rhythmOnly ? { rhythmOnly: true } : {}),
  });
}

/**
 * A stored run as the rung state reads it (C5): everything but the per-step
 * detail and its bar tallies, which no requirement reads.
 */
function forRungState(row: SessionRow): SessionRow {
  const { steps: _steps, bars: _bars, ...rest } = row;
  return rest;
}

/**
 * Every stored run, as the rung state reads it (C5: `evidence/rungState`):
 * where the learner is comes from these rows and nothing else.
 *
 * Read once a session with a cursor down the store and kept in memory after
 * that: `recordRun` appends to it and `replaceSessionEvidence` updates it, so
 * Plan, Today and the lesson page do not each walk the store on every draw.
 * Without the per-step detail, which is most of a row's size and which no
 * requirement reads. Failure returns what is in memory (nothing, the first
 * time), which reads as a learner with no runs: honest, and the screen still
 * draws.
 */
/**
 * Hands every stored run to `visit`, per-step detail and key included, from
 * the sessions store itself (the evidence job, C5: a run of an item the
 * catalog no longer has is found this way, where asking the catalog's items
 * for their runs never reached it). Failure stops the walk and rejects, so the
 * job can say it stopped.
 */
export async function walkSessions(visit: (row: SessionRow) => void): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  let cursor = await db.transaction('sessions').store.openCursor();
  while (cursor) {
    visit({ ...cursor.value, id: cursor.primaryKey });
    cursor = await cursor.continue();
  }
}

export async function rungRows(): Promise<SessionRow[]> {
  if (rungRowsMemory) return rungRowsMemory;
  const db = await openDatabase();
  if (!db) return [];
  const out: SessionRow[] = [];
  try {
    let cursor = await db.transaction('sessions').store.openCursor();
    while (cursor) {
      out.push(forRungState({ ...cursor.value, id: cursor.primaryKey }));
      cursor = await cursor.continue();
    }
  } catch {
    return out;
  }
  rungRowsMemory = out;
  return out;
}

/**
 * Writes a stored run's evidence, or the evidence job's reason for keeping it
 * out, by the run's key (C5, `data/evidenceJob.ts`). Only those three fields
 * change; the observation is never rewritten. The rung state's copy follows.
 * A row that is gone (pruned meanwhile) is left gone.
 */
export async function replaceSessionEvidence(
  id: number,
  patch: Pick<SessionRow, 'evidence' | 'evidenceDefinitions' | 'evidenceRecompute'>,
): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  const row = await db.get('sessions', id);
  if (!row) return;
  const next: SessionRow = { ...row };
  for (const key of ['evidence', 'evidenceDefinitions', 'evidenceRecompute'] as const) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value === undefined) delete next[key];
    else (next as unknown as Record<string, unknown>)[key] = value;
  }
  // The row carries its own key (`keyPath: 'id'`); a key beside it is refused.
  await db.put('sessions', { ...next, id });
  if (rungRowsMemory) {
    const index = rungRowsMemory.findIndex((entry) => entry.id === id);
    if (index >= 0) rungRowsMemory[index] = forRungState({ ...next, id });
  }
}

/** Tells the screens that listen that the store changed (the evidence job's one announcement). */
export function announceProgressChange(): void {
  notify();
}

/** "I already know this" — a pass the learner asserts rather than plays. */
export async function selfPass(itemId: string, now = new Date()): Promise<ProgressRow> {
  const row = { ...(await getProgress(itemId)) };
  row.status = 'passed';
  row.selfPassed = true;
  row.lastPracticedAt = now.toISOString();
  if (!row.passedOn.includes(today(now))) row.passedOn.push(today(now));
  memory.set(itemId, row);
  const db = await openDatabase();
  await db?.put('progress', row);
  notify();
  return row;
}

/**
 * The last `limit` runs, newest first.
 *
 * Walked backwards down the `byDate` index rather than read whole and sorted.
 * At the cap that was 2,200 rows out of IndexedDB and 2,200 `localeCompare`s —
 * an ICU call per comparison — to hand back fifty, on the Progress screen's
 * load and again at the end of every drill. The index has been there since the
 * store was created; `pruneSessions` already uses it.
 */
export async function recentSessions(limit = 50): Promise<SessionRow[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const out: SessionRow[] = [];
    let cursor = await db.transaction('sessions').store.index('byDate').openCursor(null, 'prev');
    while (cursor && out.length < limit) {
      out.push(cursor.value);
      cursor = await cursor.continue();
    }
    return out;
  } catch {
    // A browser that will not open a reverse index cursor still gets its list.
    const rows = await db.getAll('sessions');
    return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  }
}

/**
 * The last `limit` performances, however far back they are.
 *
 * The Progress screen used to filter performances out of `recentSessions(100)`,
 * which is the last hundred runs *of anything*. A performance is rare by
 * design — that is the whole point of the section — so a few weeks of ordinary
 * practice pushes the last one out of the window, and the screen then says "No
 * performances yet" over a history that has them. It said the opposite of the
 * one thing it exists to say.
 *
 * The next fix walked every run newest first and stopped at the old cap and its
 * slack (2,200 rows), so a learner who had never performed did not walk the
 * whole store on every Progress load — and a performance further back than that
 * was kept since C1 and not listed (L53). Since version 10 the performances
 * have their own index (`byPerformance`: the marker, then the date), so the
 * walk reads performances and nothing else, newest first, and stops at `limit`.
 */
export async function recentPerformances(limit = 20): Promise<SessionRow[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const out: SessionRow[] = [];
    let cursor = await db.transaction('sessions').store.index('byPerformance').openCursor(null, 'prev');
    while (cursor && out.length < limit) {
      if (cursor.value.performance === true) out.push(cursor.value);
      cursor = await cursor.continue();
    }
    return out;
  } catch {
    const rows = await db.getAll('sessions');
    return rows
      .filter((row) => row.performance === true)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);
  }
}

/**
 * The last `limit` runs **of one item**, newest first.
 *
 * The drill screen's coaching wants "the previous two runs of this drill" and
 * asked for it as "any of this drill's runs inside the last sixty runs of
 * anything". Sixty runs is about a week of practice, so anything on a
 * fortnightly rotation silently stopped getting plateau advice — no error, no
 * empty state, just a paragraph that quietly stopped appearing. `byItem` is the
 * index that answers the question that was meant.
 *
 * Walked backwards and stopped at `limit` (C1) rather than read whole: a row
 * is an observation now, several times the size it was, and the cap is many
 * times higher, so the daily read's own rows alone grow into megabytes over
 * the years — read on every sight-read's open. Within one item the index
 * orders rows by key, which is the order they were written; a restored backup
 * writes older runs under newer keys, so the few read are still sorted by
 * date before they are handed back.
 */
export async function sessionsForItem(itemId: string, limit = 5): Promise<SessionRow[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const rows: SessionRow[] = [];
    let cursor = await db.transaction('sessions').store.index('byItem').openCursor(IDBKeyRange.only(itemId), 'prev');
    while (cursor && rows.length < limit) {
      rows.push(cursor.value);
      cursor = await cursor.continue();
    }
    return rows.sort((a, b) => b.at.localeCompare(a.at));
  } catch {
    return (await recentSessions(MAX_SESSIONS))
      .filter((row) => row.itemId === itemId)
      .slice(0, limit);
  }
}

/**
 * Has this learner met this material (D4 item 3; Part 26's contact novelty)? Facts, never a verdict
 * for the store, read conservatively:
 *
 * - `met` where any row, **under any item id**, carries the same material (`sameMaterial`: a file's
 *   sha256, a generator's family, version, seed, recipe and tempo) — a renamed or duplicate id is
 *   met, and `metAs` names the ids it was met under;
 * - `met-by-id` where no row carries it and a row that knows no material (a legacy run from before
 *   D4, or one whose item had no identity) shares the item id: prior contact proven, which material
 *   unknown — never `unmet`, and never offered as transfer;
 * - `unmet` only where no row of either kind exists, with `metById` where the id was met under other
 *   known material (a new seed, a new generator version: new material the later policy can read
 *   beside the id).
 *
 * A candidate with no material to compare (`none`, or none at all) is read by its id alone, and says
 * so (`materialUnknown`). `rows` are every stored run (`rungRows`, which the rung state already holds
 * in memory): one pass over them, rather than an index on a nested, discriminated value that would
 * need a schema version — and `sessionsForItem`, one item's index, cannot see a renamed id at all.
 *
 * **G1 extends it** over the rest of the history, and keeps every verdict D4's rows gave: an
 * encounter that is not a run (`EncounterRow`: viewed, heard, demonstrated) meets a material as a run
 * does, and so does the durable summary of runs the retention cap deleted (`ContactSummaryRow`), so a
 * run pruned is still `met`. `unmet` is unmet by any kind. `met` says how (`how`: `played` for a run,
 * live or summarised, then the encounter kinds, in that order), which a later reader weighs — whether
 * a hearing counts as contact for its purpose is its policy, never this function's.
 */
export type ContactHow = 'played' | EncounterKind;
const HOW_ORDER: readonly ContactHow[] = ['played', 'heard', 'demonstrated', 'viewed'];

export interface Contact {
  contact: 'met' | 'met-by-id' | 'unmet';
  /** Some stored row — a run, an encounter, a pruned run's summary — shares the candidate's item id, whatever material it carries. */
  metById: boolean;
  /** The item ids of the rows that carry the candidate's material, in the order stored: runs, encounters, summaries. */
  metAs?: string[];
  /** How the material was met (G1): `played` for a run, live or summarised, and each encounter kind. On `met` only. */
  how?: ContactHow[];
  /** The candidate has no material to compare: novelty was read by its id alone. */
  materialUnknown?: true;
}

/** The rest of the history `contactIn` reads beside the runs (G1): absent, the runs alone, as D4 read them. */
export interface ContactHistory {
  encounters?: readonly Pick<EncounterRow, 'itemId' | 'material' | 'kind'>[];
  summaries?: readonly Pick<ContactSummaryRow, 'itemIds' | 'material' | 'byId'>[];
}

/** A row's material as `sameMaterial` reads it: an id-only encounter or summary names none. */
function asIdentity(material: EncounterRow['material'] | Identity | undefined): Identity | undefined {
  return material === undefined || material.kind === 'id' ? undefined : material;
}

export function contactIn(
  rows: readonly Pick<SessionRow, 'itemId' | 'material'>[],
  itemId: string,
  material: Identity | undefined,
  history: ContactHistory = {},
): Contact {
  const encounters = history.encounters ?? [];
  const summaries = history.summaries ?? [];
  const idRows = rows.filter((row) => row.itemId === itemId);
  const idEncounters = encounters.filter((row) => row.itemId === itemId);
  const idSummaries = summaries.filter((row) => row.itemIds.includes(itemId));
  const metById = idRows.length > 0 || idEncounters.length > 0 || idSummaries.length > 0;
  if (!knownMaterial(material)) {
    return { contact: metById ? 'met-by-id' : 'unmet', metById, materialUnknown: true };
  }
  const playedRuns = rows.filter((row) => sameMaterial(row.material, material));
  const heard = encounters.filter((row) => sameMaterial(asIdentity(row.material), material));
  const summarised = summaries.filter((row) => sameMaterial(asIdentity(row.material), material));
  const as = [...new Set([...playedRuns.map((row) => row.itemId), ...heard.map((row) => row.itemId), ...summarised.flatMap((row) => row.itemIds)])];
  if (as.length > 0) {
    const kinds = new Set<ContactHow>(heard.map((row) => row.kind));
    if (playedRuns.length > 0 || summarised.length > 0) kinds.add('played');
    return { contact: 'met', metById, metAs: as, how: HOW_ORDER.filter((kind) => kinds.has(kind)) };
  }
  const unknownById =
    idRows.some((row) => !knownMaterial(row.material)) ||
    idEncounters.some((row) => !knownMaterial(asIdentity(row.material))) ||
    idSummaries.some((row) => row.byId);
  if (unknownById) return { contact: 'met-by-id', metById: true };
  return { contact: 'unmet', metById };
}

/**
 * `contactIn` over the whole store (G1): every stored run (`rungRows`), the encounters of this
 * material or this id, and the summaries of pruned runs of either. The encounters are read here from
 * their store directly (the store's writer is `encounterStore`, which reads this module; this one
 * does not import it back).
 */
export async function contact(itemId: string, material: Identity | undefined): Promise<Contact> {
  const [rows, encounters, summaries] = await Promise.all([rungRows(), encountersOf(learnerMaterialKeys(material, itemId), itemId), contactSummaries()]);
  return contactIn(rows, itemId, material, { encounters, summaries });
}

/**
 * The encounter rows of this material (`EncounterRow.key`: its current key and every former one, E50a's
 * `learnerMaterialKeys`, since a row keeps the key it was stored under) or under this item id, from the
 * store; none without one.
 */
async function encountersOf(keys: readonly string[], itemId: string): Promise<EncounterRow[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const [byItem, ...keyed] = await Promise.all([db.getAllFromIndex('encounters', 'byItem', itemId), ...keys.map((key) => db.getAllFromIndex('encounters', 'byKey', key))]);
    const byKey = keyed.flat();
    const seen = new Set(byKey.map((row) => row.id));
    return [...byKey, ...byItem.filter((row) => !seen.has(row.id))];
  } catch {
    return [];
  }
}

// --- the durable summary of pruned runs (G1) ------------------------------------------------------

/** The printed bars a stored run covered — 1-based positions in its own item — or undefined for the whole (a row with no range). */
export function runBars(row: Pick<SessionRow, 'range'>): [number, number] | undefined {
  return row.range === undefined ? undefined : [row.range.fromMeasure + 1, row.range.toMeasure + 1];
}

/** Where a run came from, in a summary's words: the tab, with the Today slot where a card named one. */
function sourceOf(row: Pick<SessionRow, 'opened'>): string {
  const opened = row.opened;
  if (!opened) return 'not measured';
  return typeof opened.slot === 'string' && opened.slot !== 'not measured' ? `${opened.tab}:${opened.slot}` : opened.tab;
}

/**
 * One run as the summary keeps it (G1): its material or its id, and one span — what happened
 * (`performed` for a performance take, `practised` for every other run: evidence, passing and first
 * contact never rename it), the bars, when, from where. Nothing else of the run is kept.
 */
export function foldRun(row: Pick<SessionRow, 'itemId' | 'material' | 'range' | 'performance' | 'at' | 'opened'>): ContactSummaryRow {
  const known = knownMaterial(row.material) ? row.material : undefined;
  const bars = runBars(row);
  const span: ContactSpan = {
    run: row.performance === true ? 'performed' : 'practised',
    ...(bars === undefined ? {} : { bars }),
    first: row.at,
    last: row.at,
    sources: [sourceOf(row)],
  };
  return {
    key: materialKey(known, row.itemId),
    material: known ?? { kind: 'id', itemId: row.itemId },
    itemIds: [row.itemId],
    byId: known === undefined,
    spans: [span],
  };
}

const spanKey = (span: ContactSpan): string => `${span.run}|${span.bars === undefined ? 'whole' : `${String(span.bars[0])}-${String(span.bars[1])}`}`;

/**
 * Two summaries of one material as one (G1): the item ids and sources as sets, each span's first the
 * earlier and last the later, spans of the same kind and bars merged. A join: folding the same run
 * twice, or restoring the same backup twice, changes nothing.
 */
export function mergeSummaries(mine: ContactSummaryRow | undefined, theirs: ContactSummaryRow): ContactSummaryRow {
  if (mine === undefined) return mergeSummaries({ ...theirs, itemIds: [], spans: [] }, theirs);
  const spans = new Map<string, ContactSpan>();
  for (const span of [...mine.spans, ...theirs.spans]) {
    const key = spanKey(span);
    const was = spans.get(key);
    spans.set(
      key,
      was === undefined
        ? { ...span, sources: [...new Set(span.sources)] }
        : {
            ...was,
            first: span.first < was.first ? span.first : was.first,
            last: span.last > was.last ? span.last : was.last,
            sources: [...new Set([...was.sources, ...span.sources])],
          },
    );
  }
  return {
    key: mine.key,
    material: mine.material,
    itemIds: [...new Set([...mine.itemIds, ...theirs.itemIds])],
    byId: mine.byId || theirs.byId,
    spans: [...spans.values()].sort((a, b) => spanKey(a).localeCompare(spanKey(b))),
  };
}

/** The summaries of pruned runs under these keys, or every one; none without a database. */
export async function contactSummaries(keys?: readonly string[]): Promise<ContactSummaryRow[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    if (keys === undefined) return await db.getAll('contacts');
    const found = await Promise.all(keys.map((key) => db.get('contacts', key)));
    return found.filter((row): row is ContactSummaryRow => row !== undefined);
  } catch {
    return [];
  }
}

/**
 * How many practice sessions are stored.
 *
 * Cheap: a `count()` on the store rather than reading it. Diagnostics shows it
 * so that a store which grows for ever can be *seen* growing.
 */
export async function sessionCount(): Promise<number> {
  const db = await openDatabase();
  return (await db?.count('sessions')) ?? 0;
}

/**
 * The most **runs** kept, and the slack before pruning is worth doing.
 *
 * The store had no retention rule at all: `db.ts` creates it with
 * `autoIncrement` and nothing anywhere removed a row, so every practice run
 * appended one for ever. A cap of 2,000 fixed that, on the grounds that nothing
 * read an old row, and its comment reasoned in *sessions* — "six years at a
 * session a day" — while it counted rows, and a row is one run: at ten runs a
 * day it forgot after about two hundred days (backlog L48).
 *
 * C1 made a row an observation, which is evidence (Q26), so the cap is no
 * longer the routine: old rows are compacted, not deleted
 * (`OBSERVATION_WINDOW_DAYS`), and the cap is the last resort, set by what the
 * store costs at it — `SESSIONS_BUDGET_BYTES`, against a measured row, in
 * `sessionRetention.test.ts`. Every row counts, measured or not: a run nothing
 * heard still costs a row, and a learner with no piano writes only those.
 *
 * Since C7 (L87) the cap deletes only rows no derivation reads
 * (`holdsEvidence`): a run that bears evidence or names the rung that judged
 * it is never deleted, so the store can hold more than this many rows, by the
 * runs that established something — each of them no bigger than a compacted
 * row. See `pruneSessions`.
 *
 * Pruned in blocks rather than one row per run: deleting on every write would
 * put a cursor walk in the path of finishing a piece, which is the one moment
 * this store must not be slow.
 */
export const MAX_SESSIONS = 25_000;
export const PRUNE_SLACK = 200;

/**
 * How many days a run keeps its per-step detail before it is compacted to
 * per-bar tallies (C1). Long enough for a reader of recent evidence — the
 * retained state is tried at three weeks (design §11 item 11) — to attribute a
 * miss to its note, with room to spare; after it, a miss is attributed to its
 * bar, which is what the hot spots have always done.
 */
export const OBSERVATION_WINDOW_DAYS = 90;

/**
 * What the `sessions` store may cost at the cap: 64 MiB of structured clone.
 *
 * Chosen against what the storage report shows (Settings → Content: the
 * origin's usage beside its quota). Where it was looked at — a desktop
 * Chromium, C1 — the quota was in gigabytes and this is a small share of it,
 * of the order of the folder listing the database already keeps and under
 * what a few imported PDFs cost; the owner's phone has not been looked at.
 * `sessionRetention.test.ts` holds the cap to it, measured on a stored row,
 * so a change that makes rows bigger fails there rather than on the phone.
 */
export const SESSIONS_BUDGET_BYTES = 64 * 1024 * 1024;

/** Consecutive rows already compact after which a compaction walk stops. */
const COMPACT_STOP = 50;

const DAY_MS = 86_400_000;

/**
 * How many of a skill's newest reads the demand readings read
 * (`evidence/demandReadings.ts`'s `DEMAND_WINDOW_READS`, CL23, L69). Copied, not imported: the
 * evidence modules reach the score model's code, which this store keeps out (`holdsEvidence`);
 * `sessionRetention.test.ts` holds the two equal.
 */
export const PROTECTED_READS = 5;

const NOTHING_OUTSIDE: ReadonlySet<number> = new Set();

/** The indexes in `row.evidence` of its measured records: the only records the demand readings read. */
function measuredIndexes(row: Pick<SessionRow, 'evidence'>): number[] {
  if (!Array.isArray(row.evidence)) return [];
  return row.evidence.flatMap((one, index) => (one.kind === 'measured' ? [index] : []));
}

const someIn = (list: readonly number[] | undefined): boolean => Array.isArray(list) && list.length > 0;

/** Whether a measured record still holds a step index: a `byDemand` entry's `steps`, `wrong` or `unattributed`, an `otherDemands` entry's `steps`. */
function holdsPositions(record: MeasuredEvidence): boolean {
  return (
    (record.byDemand ?? []).some((entry) => someIn(entry.steps) || someIn(entry.wrong) || someIn(entry.unattributed)) ||
    (record.otherDemands ?? []).some((other) => someIn(other.steps))
  );
}

/** Whether any measured record of the row still holds a step index (CL23): such a row is not yet as compact as it may become. */
function rowHoldsPositions(row: SessionRow): boolean {
  return measuredIndexes(row).some((index) => holdsPositions((row.evidence as EvidenceResult[])[index] as MeasuredEvidence));
}

/**
 * A measured record with its per-demand step indexes folded away (CL23, L69): each `byDemand`
 * entry keeps its demand, `n` and `right`, each `otherDemands` entry its demand, and the arrays are
 * emptied — the shape `evidence.ts` declares, so a reader that iterates them reads no step rather
 * than failing on a missing one. What is lost is which steps; the counts stay. `compactSteps`'s
 * own trade, made on the evidence.
 */
function foldRecord(record: MeasuredEvidence): MeasuredEvidence {
  return {
    ...record,
    ...(Array.isArray(record.byDemand) ? { byDemand: record.byDemand.map(({ demand, n, right }) => ({ demand, n, right, steps: [], wrong: [] })) } : {}),
    ...(Array.isArray(record.otherDemands) ? { otherDemands: record.otherDemands.map(({ demand }) => ({ demand, steps: [] })) } : {}),
  };
}

/** `evidence` with the measured records at `outside` folded, or `evidence` itself where none of them holds a step index. */
function foldEvidence(evidence: EvidenceResult[] | undefined, outside: ReadonlySet<number>): EvidenceResult[] | undefined {
  if (!Array.isArray(evidence) || outside.size === 0) return evidence;
  let changed = false;
  const out = evidence.map((one, index) => {
    if (one.kind !== 'measured' || !outside.has(index) || !holdsPositions(one)) return one;
    changed = true;
    return foldRecord(one);
  });
  return changed ? out : evidence;
}

/**
 * A row with its per-step detail folded into per-bar tallies (C1), and its measured records
 * proven outside the demand readings' reach folded to counts (CL23, L69).
 *
 * Everything else — the totals, the pitch and its definition, the timing
 * summary, the header, every evidence record and its counts — stays as it was.
 * `outside` names the indexes of `row.evidence` whose records no reader of their
 * step indexes can still reach (`outsideReach`); none, unless a caller proves
 * it, so a caller that does not ask keeps every position. A row with no
 * per-step detail and nothing to fold (one already compact, or written before
 * observations) comes back unchanged — the same object.
 */
export function compactObservation(row: SessionRow, outside: ReadonlySet<number> = NOTHING_OUTSIDE): SessionRow {
  const evidence = foldEvidence(row.evidence, outside);
  if (!row.steps && evidence === row.evidence) return row;
  const { steps, ...rest } = row;
  return {
    ...rest,
    ...(steps ? { bars: compactSteps(steps) } : {}),
    ...(evidence === row.evidence ? {} : { evidence }),
  };
}

/** A measured record already walked past, as the protecting count reads it: its skill, its row's evidence stamp, its row's date. */
interface Newer {
  skill: string;
  stamp: number | undefined;
  at: string;
}

/**
 * The measured records of a row the protecting count may hold against an older one. None when the
 * row is dated after `now`: the demand readings skip a record dated after their day
 * (`demandReadings.ts`:223), and the compaction's own day is the earliest a reader can come.
 */
function newerOf(row: SessionRow, now: number): Newer[] {
  if (!(Date.parse(row.at) <= now)) return [];
  const evidence = row.evidence as EvidenceResult[];
  return measuredIndexes(row).map((index) => ({ skill: (evidence[index] as MeasuredEvidence).skill, stamp: row.evidenceDefinitions, at: row.at }));
}

/**
 * The indexes of `row.evidence` whose measured record is proven outside the demand readings'
 * reach (CL23, L69; the reviewer's required change, `responses/questions-122a5224.md` §CL23).
 *
 * The readings read a skill's newest `PROTECTED_READS` measured records pooled across the
 * sight-reading items (`demandReadings`), which needs catalogue facts this store does not have. A
 * record outside its own item's newest five is outside the pooled five as well — every newer
 * record of its item is in the pool — so its own item's five is the set protected: a safe superset
 * of what the readings reach, never an age. `newer` are the measured records of the **same item's
 * rows under higher keys** (the caller walks the item's index from its newest key), and a record is
 * outside when at least five of them are:
 *
 * - of the same skill (the readings are per skill);
 * - from a row under the same evidence stamp (`storedEvidence` reads one stamp; a newer record under
 *   another is not read beside this one, and a compacted row is never recomputed);
 * - strictly later (`localeCompare`, the readings' own order), so a record tied with the fifth,
 *   whose place the readings' stable sort gives by catalogue order, stays protected;
 * - dated no later than the compaction's day (`newerOf`).
 *
 * Under a higher key because the readings take an item's newest rows **by key** before sorting
 * them by date (`sessionsForItem`, and Today's 500-row read): a newer run a restored backup wrote
 * under a lower key may be past that read while this one is inside it, and a record outside that
 * read altogether is one the readings never reach. The set only grows as runs are added; a device
 * clock set back is the one way a folded record can come back into it, and an emptied array then
 * reads as no step, not as a fault.
 */
function outsideReach(row: SessionRow, newer: readonly Newer[]): Set<number> {
  const out = new Set<number>();
  const evidence = row.evidence as EvidenceResult[];
  for (const index of measuredIndexes(row)) {
    const skill = (evidence[index] as MeasuredEvidence).skill;
    let ahead = 0;
    for (const one of newer) {
      if (one.skill === skill && one.stamp === row.evidenceDefinitions && one.at.localeCompare(row.at) > 0) ahead += 1;
    }
    if (ahead >= PROTECTED_READS) out.add(index);
  }
  return out;
}

/**
 * Compacts the rows older than the observation window (C1), folding the evidence of each that is
 * proven outside the demand readings' reach as it goes (CL23, L69).
 *
 * Walked newest first from the window's edge, by the `byDate` index, and
 * stopped once `COMPACT_STOP` rows in a row are already compact: each tidy
 * then touches the few rows that have just crossed the edge, not the whole
 * store. A row crossing it is held against its own item's later rows, read
 * down the item's index from the newest key until all its measured records are
 * proven outside or its own key is reached (`outsideReach`). A row the walk
 * finds already compact is left as it is, positions kept or not: a read the
 * readings may still reach when it crosses is pushed out only by a later run of
 * its item, which walks that item itself (`foldEvidenceOfItem`). Failure is
 * silent for the reason pruning's is.
 */
export async function compactSessions(now = new Date(), windowDays = OBSERVATION_WINDOW_DAYS): Promise<number> {
  const db = await openDatabase();
  if (!db) return 0;
  try {
    const edge = new Date(now.getTime() - windowDays * DAY_MS).toISOString();
    const day = now.getTime();
    const tx = db.transaction('sessions', 'readwrite');
    const byItem = tx.store.index('byItem');
    const reachOf = async (row: SessionRow, key: number): Promise<ReadonlySet<number>> => {
      const wanted = measuredIndexes(row).length;
      // A row naming no item has no item's rows to be held against: nothing proven, nothing folded.
      if (wanted === 0 || typeof row.itemId !== 'string') return NOTHING_OUTSIDE;
      const newer: Newer[] = [];
      let outside: ReadonlySet<number> = NOTHING_OUTSIDE;
      let above = await byItem.openCursor(IDBKeyRange.only(row.itemId), 'prev');
      while (above && above.primaryKey > key) {
        newer.push(...newerOf(above.value, day));
        outside = outsideReach(row, newer);
        if (outside.size === wanted) break;
        above = await above.continue();
      }
      return outside;
    };
    let cursor = await tx.store.index('byDate').openCursor(IDBKeyRange.upperBound(edge, true), 'prev');
    let compacted = 0;
    let settled = 0;
    while (cursor && settled < COMPACT_STOP) {
      const row = cursor.value;
      if (row.steps) {
        const outside = await reachOf(row, cursor.primaryKey);
        await cursor.update(compactObservation(row, outside));
        compacted += 1;
        settled = 0;
      } else {
        settled += 1;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    return compacted;
  } catch {
    return 0;
  }
}

/**
 * Folds the evidence of one item's old rows that a new run of it has pushed out of the demand
 * readings' reach (CL23, L69; the brief's premise 24).
 *
 * A read protected when it crossed the observation window is pushed out of its item's newest
 * five only by a later measured run of that item, and by then it is far behind the window's edge,
 * where `compactSessions` stops before reaching it. So the run's own tidy walks the item's rows
 * down its index from the newest key — every row walked is under a higher key than the next —
 * and folds what each old, already compacted row now has five later records against
 * (`outsideReach`). A row past the edge that still holds a position is not compact here, protected
 * or not, so the walk's stop (`COMPACT_STOP` compact rows in a row) is never reached on the
 * protected rows above an older one it should fold. Never running is safe for the readings — the
 * row stays protected, only redundantly. Failure is silent, as the other tidies'.
 */
export async function foldEvidenceOfItem(itemId: string, now = new Date(), windowDays = OBSERVATION_WINDOW_DAYS): Promise<number> {
  const db = await openDatabase();
  if (!db) return 0;
  try {
    const edge = new Date(now.getTime() - windowDays * DAY_MS).toISOString();
    const day = now.getTime();
    const tx = db.transaction('sessions', 'readwrite');
    let cursor = await tx.store.index('byItem').openCursor(IDBKeyRange.only(itemId), 'prev');
    const newer: Newer[] = [];
    let folded = 0;
    let settled = 0;
    while (cursor && settled < COMPACT_STOP) {
      const row = cursor.value;
      if (row.at < edge) {
        if (row.steps || rowHoldsPositions(row)) {
          settled = 0;
          // A row past the edge with its steps is `compactSessions`'s; this walk folds only evidence.
          if (!row.steps) {
            const next = compactObservation(row, outsideReach(row, newer));
            if (next !== row) {
              await cursor.update(next);
              folded += 1;
            }
          }
        } else {
          settled += 1;
        }
      }
      newer.push(...newerOf(row, day));
      cursor = await cursor.continue();
    }
    await tx.done;
    return folded;
  } catch {
    return 0;
  }
}

/** The tidy the last recorded run started, so a caller can wait for it. */
let tidying: Promise<void> = Promise.resolve();

/**
 * Compacts, then prunes, after a run is written — in the background and one
 * at a time, so two runs finished close together never walk the store twice
 * at once. Where the run had a measured record, its item is walked between the
 * two for the evidence its run pushed out of the readings' reach (CL23).
 */
function tidySessions(now: Date, itemId?: string): void {
  tidying = tidying
    .then(async () => {
      await compactSessions(now);
      if (itemId !== undefined) await foldEvidenceOfItem(itemId, now);
      await pruneSessions(MAX_SESSIONS, PRUNE_SLACK, now);
    })
    .catch(() => undefined);
}

/**
 * Resolves once the tidy the last run started has finished.
 *
 * `recordRun` does not wait for it (the learner is looking at a summary); a
 * test that wants to see what the run did to the store waits here instead of
 * tidying the store itself (Q26: the retention test used to prune on its own
 * and so proved the prune, not that the run asks for it).
 */
export function sessionsTidied(): Promise<void> {
  return tidying;
}

/**
 * Whether a stored run holds something a derivation reads (C7, L87): evidence
 * about a skill — under any evidence version, since a later version decides
 * what an older claim is worth and refuses it rather than losing it — or the
 * rung that judged it, whose requirements the rung state counts it towards.
 * The last-resort cap never deletes such a row.
 */
export function holdsEvidence(row: SessionRow): boolean {
  if (row.lessonId !== undefined) return true;
  // A refusal is not evidence; a measured or self-assessed record is. (Read by
  // kind rather than through the evidence module, which this store must not
  // pull in: its detectors reach the score model's code.)
  return Array.isArray(row.evidence) && row.evidence.some((result) => result.kind !== 'refusal');
}

/**
 * The count left after a prune that could not reach the cap, so the next one
 * waits for another slack's worth of runs instead of walking the same kept
 * rows after every run. Forgotten with the other caches.
 */
let pruneStalledAt: number | null = null;

/**
 * Drops the oldest sessions once there are more than the cap plus its slack.
 *
 * By the `byDate` index, oldest first, so "the oldest" means the oldest run
 * and not the lowest auto-increment key — the two agree today and would stop
 * agreeing the first time a backup is restored.
 *
 * **Cleanup never erases competence (C7, L87).** The ladder and the rung
 * state are derived by replaying the rows, so the runs that established a
 * skill or met a rung are exactly the oldest ones, the first a cap would
 * delete. Two shapes were open: a durable checkpoint beside the rows, or the
 * row as its own checkpoint with deleting evidence forbidden. This is the
 * second, because it is the simpler coherent one: every reader — the rung
 * state, the reader, the Skills screen, backup and restore, the evidence job —
 * already reads these rows and nothing has to be kept in step beside them. So
 * the walk deletes only rows no derivation reads (`holdsEvidence`), keeps the
 * rest as they are — already compacted past the observation window, their
 * evidence never dropped and its counts never folded (since CL23 a record the
 * demand readings can no longer reach keeps its counts and loses its step
 * indexes, `compactObservation`), no verdict written on them — and never
 * reaches into the observation window: recent runs are what the history and
 * the reader use, and when the kept rows alone are past the cap, deleting
 * yesterday's run would not bring the store back to it. A later evidence
 * version refuses a kept row's old claim (it contributes nothing, and the job
 * keeps it out with its reason) rather than deleting it.
 *
 * **Cleanup never erases an encounter either (G1; the reviewer's required
 * change, `docs/review/responses/7863bee.md`).** A run with no evidence and no
 * rung can be the only proof that a passage was practised or an item met (D4's
 * contact, G63). Before deleting it the walk folds what a familiarity query
 * reads of it — its material or its id, the bars it covered, practised or
 * performed, when, from where — into its material's summary in `contacts`
 * (`foldRun`, `mergeSummaries`), in the same transaction: a join, so folding a
 * run twice changes nothing, and never evidence.
 *
 * Failure is deliberately silent: a phone that cannot prune keeps every row,
 * which is exactly the behaviour that shipped, and is far better than a run
 * that will not record because tidying up threw.
 */
export async function pruneSessions(
  max = MAX_SESSIONS,
  slack = PRUNE_SLACK,
  now = new Date(),
  windowDays = OBSERVATION_WINDOW_DAYS,
): Promise<number> {
  const db = await openDatabase();
  if (!db) return 0;
  try {
    const total = await db.count('sessions');
    if (total <= max + slack) return 0;
    if (pruneStalledAt !== null && total <= pruneStalledAt + slack) return 0;
    const edge = new Date(now.getTime() - windowDays * DAY_MS).toISOString();
    // One transaction over both stores (G1): a run is deleted only with its
    // facts folded into its material's summary, and if either fails neither
    // happens.
    const tx = db.transaction(['sessions', 'contacts'], 'readwrite');
    let cursor = await tx.objectStore('sessions').index('byDate').openCursor(IDBKeyRange.upperBound(edge, true));
    let dropped = 0;
    const folded = new Map<string, ContactSummaryRow>();
    while (cursor && total - dropped > max) {
      if (!holdsEvidence(cursor.value)) {
        const summary = foldRun(cursor.value);
        folded.set(summary.key, mergeSummaries(folded.get(summary.key), summary));
        await cursor.delete();
        dropped += 1;
      }
      cursor = await cursor.continue();
    }
    const contacts = tx.objectStore('contacts');
    for (const [key, summary] of folded) await contacts.put(mergeSummaries(await contacts.get(key), summary));
    await tx.done;
    pruneStalledAt = total - dropped > max ? total - dropped : null;
    // The rung state's copy is read again from what is left (C5).
    if (dropped > 0) rungRowsMemory = null;
    return dropped;
  } catch {
    return 0;
  }
}

// --- weekly minutes (docs/04 §2: a weekly goal, never a daily streak) ------

export async function getStreak(): Promise<StreakRow> {
  if (streakMemory) return streakMemory;
  const db = await openDatabase();
  streakMemory = (await db?.get('streak', 'streak')) ?? {
    id: 'streak',
    minutesByDay: {},
    weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL_MINUTES,
  };
  return streakMemory;
}

export async function addMinutes(minutes: number, now = new Date()): Promise<StreakRow> {
  const row = { ...(await getStreak()) };
  row.minutesByDay = { ...row.minutesByDay };
  row.minutesByDay[today(now)] = (row.minutesByDay[today(now)] ?? 0) + minutes;
  streakMemory = row;
  const db = await openDatabase();
  await db?.put('streak', row);
  return row;
}

export async function setWeeklyGoal(minutes: number): Promise<StreakRow> {
  const row = { ...(await getStreak()), weeklyGoalMinutes: Math.max(0, Math.round(minutes)) };
  streakMemory = row;
  const db = await openDatabase();
  await db?.put('streak', row);
  notify();
  return row;
}

/** Minutes practised in the seven days ending today, and the days they fell on. */
export function weekSoFar(streak: StreakRow, now = new Date()): { minutes: number; days: number } {
  let minutes = 0;
  let days = 0;
  for (let back = 0; back < 7; back += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - back);
    const value = streak.minutesByDay[today(day)] ?? 0;
    minutes += value;
    if (value > 0) days += 1;
  }
  return { minutes, days };
}

// --- the daily sight-read (docs/04 §2) ------------------------------------

/**
 * Which days the daily sight-read was finished on.
 *
 * A *daily* streak, deliberately, and deliberately not the one the header
 * carries: `02` Part A §8 is explicit that a missed weekday breaks nothing,
 * and the minutes on Today are weekly for exactly that reason. This counts one
 * three-minute habit — read a phrase you have never seen — where a run of days
 * is the whole point and the thing being measured costs almost nothing to
 * keep. Two different numbers about two different things, not one number in
 * two places.
 *
 * Kept in the `settings` store under its own key rather than in `StreakRow`,
 * which would have meant a schema version bump for one array of date strings.
 * Cached in memory the way the streak row is, and cleared by the same call a
 * restore makes.
 */
const DAILY_READ_KEY = 'pianopath.dailyRead';

/** About a year and a bit. Older days cannot lengthen a run that reaches today. */
const DAILY_READ_DAYS_KEPT = 400;

let dailyReadMemory: string[] | null = null;

function coerceDays(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((day): day is string => typeof day === 'string'))].sort();
}

export async function dailyReadDays(): Promise<string[]> {
  if (dailyReadMemory) return dailyReadMemory;
  const db = await openDatabase();
  dailyReadMemory = coerceDays(await db?.get('settings', DAILY_READ_KEY));
  return dailyReadMemory;
}

/**
 * Records that today's sight-read is done. Idempotent: a second read on the
 * same day is the same day.
 */
export async function markDailyRead(now = new Date()): Promise<string[]> {
  const days = await dailyReadDays();
  const date = today(now);
  if (days.includes(date)) return days;
  const next = [...days, date].sort().slice(-DAILY_READ_DAYS_KEPT);
  dailyReadMemory = next;
  const db = await openDatabase();
  await db?.put('settings', next, DAILY_READ_KEY);
  notify();
  return next;
}

/** Has today's been read? */
export function readToday(days: readonly string[], now = new Date()): boolean {
  return days.includes(today(now));
}

/**
 * Days in a row, ending today or yesterday.
 *
 * Today counts only once it is done, but a day that is not over yet does not
 * break the run: a learner who opens the app at breakfast on the fourth
 * morning is on a three-day run and has not lost it, and telling them
 * otherwise would be the "daily-streak guilt" `04` §2 exists to avoid. A real
 * gap — a day with nothing, with days behind it — resets to nought.
 */
export function dailyReadStreak(days: readonly string[], now = new Date()): number {
  const done = new Set(days);
  const cursor = new Date(now);
  if (!done.has(today(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (done.has(today(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// --- learned pieces (docs/02 Part G; C6) -----------------------------------

/**
 * A piece the learner has learned, and when they last played it (C6): what the
 * review slot's repertoire retention reads, and the repertoire slot's "a piece
 * you know".
 */
export interface LearnedPiece {
  itemId: string;
  /** Passed on a measured run at a rung's standard, or mastered (`02` Part G). */
  status: 'passed' | 'mastered';
  /** The last run of it, of any kind (`ProgressRow.lastPracticedAt`). */
  lastPlayed: string;
}

/**
 * The pieces the learner has learned (C6, the reviewer's correction of
 * 2026-09-26): every row passed or mastered on a measured run, with when it
 * was last played. It replaces the review calendar (`reviewQueue`: 1, 3, 7 and
 * 21 days after a first pass, one due item a session), which decided by the
 * item's dates alone; whether a learned piece is due is now the session's
 * repertoire-retention rule, from when it was last played
 * (`session.REPERTOIRE_WINDOW_DAYS`), beside skill retention from the ladder.
 *
 * **Learned** is a measured pass or mastery, the rung's standard or the master
 * standard (`02` Part A §6: passed items come back for review); the session
 * keeps only the songs among them for repertoire retention (a scale passed is
 * technique, which its exposure rule keeps warm; an excerpt passed is a passage,
 * not the piece, and its run is keyed by its own id, so the parent is neither
 * passed nor performed by it: E1, adversary 10, `excerptItems.test.ts`). Never a
 * generated sight-reading row, whatever an older build wrote on it (S8), and
 * never a pass that is only the learner's word (`selfPassed`, *Know it*): the
 * app keeps playable what it saw learned, and a piece the learner says they
 * know is theirs to keep. Required, so no caller can forget the reading rows.
 */
export function learnedPieces(rows: readonly ProgressRow[], isGenerated: (itemId: string) => boolean): LearnedPiece[] {
  const out: LearnedPiece[] = [];
  for (const row of rows) {
    if (row.status !== 'passed' && row.status !== 'mastered') continue;
    if (isGenerated(row.itemId) || row.selfPassed === true) continue;
    out.push({ itemId: row.itemId, status: row.status, lastPlayed: row.lastPracticedAt });
  }
  return out;
}

/**
 * Puts the generated sight-reading rows an older build passed or mastered back
 * to practised (C5, S8): no pass, no mastery, no review dates, no self-pass,
 * no best, and their attempts, minutes and last run kept. The session rows —
 * the observations and their evidence — are untouched. Idempotent: it returns
 * the rows it changed, none the second time. Run once on open by the evidence
 * job (`evidence/recompute.ts`).
 */
export async function normaliseGeneratedRows(isGenerated: (itemId: string) => boolean): Promise<string[]> {
  const changed: string[] = [];
  for (const row of await allProgress()) {
    if (!isGenerated(row.itemId)) continue;
    const marked =
      row.status === 'passed' ||
      row.status === 'mastered' ||
      row.passedOn.length > 0 ||
      (row.masteredOn?.length ?? 0) > 0 ||
      row.selfPassed !== undefined;
    if (!marked) continue;
    const { masteredOn: _mastered, selfPassed: _self, ...rest } = row;
    const next: ProgressRow = { ...rest, status: row.attempts > 0 ? 'started' : 'new', passedOn: [], bestAccuracy: 0, bestTempoPct: 0 };
    memory.set(next.itemId, next);
    const db = await openDatabase();
    await db?.put('progress', next);
    changed.push(next.itemId);
  }
  if (changed.length > 0) notify();
  return changed;
}

/** A `YYYY-MM-DD` day key's parts, or null for anything else. */
function dayParts(key: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Whole calendar days from one day key to another (`dayKey`'s `YYYY-MM-DD`),
 * or null for anything else. The session's retention rules count in these
 * (C6); the review calendar did until C6 (T37 fixed its UTC parse).
 *
 * Counted on the calendar, not on the clock: both keys are turned into the same
 * kind of midnight (UTC, as a pure number) so a day with a clock change in it
 * is still one day, and no time zone enters the sum at all.
 */
export function daysBetween(from: string, to: string): number | null {
  const a = dayParts(from);
  const b = dayParts(to);
  if (!a || !b) return null;
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86_400_000);
}

/**
 * Forgets what is cached in this module, so the next read comes off the disk.
 *
 * Not a test hook — this is the other half of two operations that write the
 * database from outside: restoring a backup, and Reset progress. Both used to
 * clear or overwrite the stored rows while `memory` and `streakMemory` went on
 * holding what was there before, and the caches are **write-through**: the next
 * run did `{...(await getStreak())}` and put the pre-restore object back over
 * the restored one. The minutes are the single number in this app with no other
 * source, and they were being destroyed by the operation that exists to save
 * them.
 *
 * The listeners are deliberately left alone: a screen that is on the page is
 * still on the page, and it is the one that has to redraw afterwards.
 */
export function forgetCachedProgress(): void {
  memory.clear();
  streakMemory = null;
  dailyReadMemory = null;
  rungRowsMemory = null;
  pruneStalledAt = null;
}

/** Test hook. */
export function resetProgressForTest(): void {
  forgetCachedProgress();
  listeners.clear();
}
