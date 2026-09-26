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
import { compactSteps } from '../engine/Scoring';
import type { NotMeasured } from '../engine/types';
import { openDatabase, type ProgressRow, type RunObservation, type SessionRow, type StreakRow } from './db';

/**
 * One finished run, as its screen hands it to the store.
 *
 * Since C1 it carries the run's observation (`RunObservation`, in `db.ts`):
 * what the run measured by its own definitions, the conditions it was played
 * under, and every channel it did not measure marked `not measured`. The store
 * keeps all of it on the session row; `passed`, `masterEligible` and
 * `selfPassed` are what it acts on for the item's progress.
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

/** docs/02 Part G: review comes back 1, 3, 7 and 21 days after a pass. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 21];

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
   */
  const evidence = result.unseen !== false;
  // The same exercise opened from Plan or the Library is a different phrase
  // and does not tick the day; a day already ticked stays ticked when the
  // stage moves on and Today picks another item. It used to be read off the
  // item's `lastPracticedAt`, which had both faults (2026-09-16). A phrase
  // heard before it was read is today's phrase and not today's read.
  if (evidence && result.seed !== undefined && result.seed === dailySeed(dayKey(now))) await markDailyRead(now);
  const passed = evidence && result.passed;
  const masterEligible = evidence && result.masterEligible;

  row.attempts += 1;
  row.lastPracticedAt = now.toISOString();
  row.minutes += result.durationMs / 60_000;
  // Nothing measured is not a best of nought (C1): it leaves the best alone.
  if (evidence && typeof result.accuracy === 'number') {
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
  // are not taken back).
  const masteredOn = [...(row.masteredOn ?? [])];
  if (masterEligible && !masteredOn.includes(date)) masteredOn.push(date);
  if (masteredOn.length > 0) row.masteredOn = masteredOn;
  if (row.status === 'mastered' || masteredOn.length >= MASTER_DAYS) row.status = 'mastered';
  else if (passed) row.status = 'passed';
  else if (row.status === 'new') row.status = 'started';

  memory.set(row.itemId, row);
  const session = sessionRowFor(result, now);

  const db = await openDatabase();
  if (db) {
    await db.put('progress', row);
    await db.add('sessions', session);
    // Not awaited: the run is finished and the learner is looking at a
    // summary. Tidying up is the app's business, not theirs; a test waits for
    // it with `sessionsTidied()`.
    tidySessions(now);
  }
  await addMinutes(result.durationMs / 60_000, now);
  notify();
  return row;
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
 * `rhythmOnly` are kept only where true, as they always were.
 */
function sessionRowFor(result: RunResult, now: Date): SessionRow {
  const { passed: _passed, masterEligible: _master, selfPassed: _self, performance, rhythmOnly, ...rest } = result;
  const session: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) session[key] = value;
  }
  return {
    ...(session as unknown as Omit<SessionRow, 'at'>),
    at: now.toISOString(),
    ...(performance ? { performance: true } : {}),
    ...(rhythmOnly ? { rhythmOnly: true } : {}),
  };
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
 * The last `limit` performances, however far back they are — up to
 * `PERFORMANCE_REACH` runs back.
 *
 * The Progress screen used to filter performances out of `recentSessions(100)`,
 * which is the last hundred runs *of anything*. A performance is rare by
 * design — that is the whole point of the section — so a few weeks of ordinary
 * practice pushes the last one out of the window, and the screen then says "No
 * performances yet" over a history that has them. It said the opposite of the
 * one thing it exists to say.
 *
 * Walked down the same index, which is where the answer actually is; capped by
 * the store's own retention so it can never be an unbounded scan.
 */
export async function recentPerformances(limit = 20): Promise<SessionRow[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const out: SessionRow[] = [];
    let scanned = 0;
    let cursor = await db.transaction('sessions').store.index('byDate').openCursor(null, 'prev');
    while (cursor && out.length < limit && scanned < PERFORMANCE_REACH) {
      if (cursor.value.performance === true) out.push(cursor.value);
      scanned += 1;
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

/**
 * How far back the performances list looks: the old cap and its slack.
 *
 * `recentPerformances` walks the store newest first until it has its twenty,
 * so a learner who has never performed walks all of it, on every Progress
 * load. At the old cap that walk was the store; at the new one it would be
 * twenty times as long for the rarest thing on the screen. So it looks as far
 * as it always could, which loses nothing it used to find — a performance
 * further back was deleted, and is now kept and not listed.
 */
export const PERFORMANCE_REACH = 2_200;

/** Consecutive rows already compact after which a compaction walk stops. */
const COMPACT_STOP = 50;

const DAY_MS = 86_400_000;

/**
 * A row with its per-step detail folded into per-bar tallies (C1).
 *
 * Everything else — the totals, the pitch and its definition, the timing
 * summary, the header — stays as it was. A row with no per-step detail (one
 * already compact, or written before observations) comes back unchanged.
 */
export function compactObservation(row: SessionRow): SessionRow {
  if (!row.steps) return row;
  const { steps, ...rest } = row;
  return { ...rest, bars: compactSteps(steps) };
}

/**
 * Compacts the rows older than the observation window (C1).
 *
 * Walked newest first from the window's edge, by the `byDate` index, and
 * stopped once `COMPACT_STOP` rows in a row are already compact: each tidy
 * then touches the few rows that have just crossed the edge, not the whole
 * store. Failure is silent for the reason pruning's is.
 */
export async function compactSessions(now = new Date(), windowDays = OBSERVATION_WINDOW_DAYS): Promise<number> {
  const db = await openDatabase();
  if (!db) return 0;
  try {
    const edge = new Date(now.getTime() - windowDays * DAY_MS).toISOString();
    const tx = db.transaction('sessions', 'readwrite');
    let cursor = await tx.store.index('byDate').openCursor(IDBKeyRange.upperBound(edge, true), 'prev');
    let compacted = 0;
    let settled = 0;
    while (cursor && settled < COMPACT_STOP) {
      if (cursor.value.steps) {
        await cursor.update(compactObservation(cursor.value));
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

/** The tidy the last recorded run started, so a caller can wait for it. */
let tidying: Promise<void> = Promise.resolve();

/**
 * Compacts, then prunes, after a run is written — in the background and one
 * at a time, so two runs finished close together never walk the store twice
 * at once.
 */
function tidySessions(now: Date): void {
  tidying = tidying
    .then(async () => {
      await compactSessions(now);
      await pruneSessions();
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
 * Drops the oldest sessions once there are more than the cap plus its slack.
 *
 * By the `byDate` index, oldest first, so "the oldest" means the oldest run
 * and not the lowest auto-increment key — the two agree today and would stop
 * agreeing the first time a backup is restored.
 *
 * Failure is deliberately silent: a phone that cannot prune keeps every row,
 * which is exactly the behaviour that shipped, and is far better than a run
 * that will not record because tidying up threw.
 */
export async function pruneSessions(max = MAX_SESSIONS, slack = PRUNE_SLACK): Promise<number> {
  const db = await openDatabase();
  if (!db) return 0;
  try {
    const total = await db.count('sessions');
    if (total <= max + slack) return 0;
    const tx = db.transaction('sessions', 'readwrite');
    let cursor = await tx.store.index('byDate').openCursor();
    let dropped = 0;
    while (cursor && total - dropped > max) {
      await cursor.delete();
      dropped += 1;
      cursor = await cursor.continue();
    }
    await tx.done;
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

// --- review queue (docs/02 Part G) ----------------------------------------

export interface ReviewItem {
  itemId: string;
  dueAt: string;
  /** Which of the 1/3/7/21-day steps this is. */
  step: number;
}

/**
 * What is due for review.
 *
 * An item enters the queue when it is first passed and comes back after 1, 3,
 * 7 and 21 days. `master` takes it out — but Repertoire brings mastered pieces
 * round again about every thirty days, which is a different list and belongs
 * to the Progress screen.
 */
export function reviewQueue(rows: ProgressRow[], now = new Date()): ReviewItem[] {
  const due: ReviewItem[] = [];
  const todayKey = dayKey(now);
  for (const row of rows) {
    if (row.status !== 'passed') continue;
    const first = row.passedOn[0];
    if (!first) continue;
    // Calendar days between two day keys, both where the learner lives (T37).
    // This was `new Date(first)`, which reads `YYYY-MM-DD` as *UTC* midnight:
    // in New York a piece passed at 20:30 was due for review at 20:45 the same
    // evening, and every later step came four to seven hours early. `dayKey`
    // was fixed for exactly this and this reader was missed.
    const daysSince = daysBetween(first, todayKey);
    if (daysSince === null) continue;
    const step = REVIEW_INTERVALS_DAYS.filter((interval) => daysSince >= interval).length;
    if (step === 0) continue;
    // Already reviewed since the interval came due? `passedOn` grows on each
    // pass, so more passes than steps means it is up to date.
    if (row.passedOn.length > step) continue;
    const interval = REVIEW_INTERVALS_DAYS[step - 1] ?? 21;
    const dueAt = localMidnight(first, interval)?.toISOString() ?? now.toISOString();
    due.push({ itemId: row.itemId, dueAt, step });
  }
  return due.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

/** A `YYYY-MM-DD` day key's parts, or null for anything else. */
function dayParts(key: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Whole calendar days from one day key to another.
 *
 * Counted on the calendar, not on the clock: both keys are turned into the same
 * kind of midnight (UTC, as a pure number) so a day with a clock change in it
 * is still one day, and no time zone enters the sum at all.
 */
function daysBetween(from: string, to: string): number | null {
  const a = dayParts(from);
  const b = dayParts(to);
  if (!a || !b) return null;
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86_400_000);
}

/** Local midnight `plusDays` after a day key: when a review step comes due. */
function localMidnight(key: string, plusDays: number): Date | null {
  const parts = dayParts(key);
  if (!parts) return null;
  return new Date(parts[0], parts[1] - 1, parts[2] + plusDays);
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
}

/** Test hook. */
export function resetProgressForTest(): void {
  forgetCachedProgress();
  listeners.clear();
}
