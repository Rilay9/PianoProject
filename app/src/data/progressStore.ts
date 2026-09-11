/**
 * What the learner has practised, and what that adds up to.
 *
 * Progress is the one thing in the app that cannot be regenerated: scores can
 * be rebuilt and settings retyped, but a year of practice history exists only
 * here. So every write goes to IndexedDB *and* to an in-memory copy, and a
 * failed write is reported rather than swallowed — a silent failure here is
 * the worst bug this app could have.
 */
import { openDatabase, type ProgressRow, type SessionRow, type StreakRow } from './db';

export interface RunResult {
  itemId: string;
  lessonId?: string;
  mode: string;
  tempoPct: number;
  accuracy: number;
  accuracyEstimated: boolean;
  wrongNotes: number;
  missed: number;
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
  /** The pass is the owner's word, not a measurement. */
  selfPassed?: boolean;
}

export const DEFAULT_WEEKLY_GOAL_MINUTES = 150;

/** docs/02 Part G: review comes back 1, 3, 7 and 21 days after a pass. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 21];

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
 * (mastery wants two passes on different *days*), the minutes, and the Progress
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
 * `master` needs two passes on *different days* (docs/02 Part G), which is why
 * `passedOn` is a list of dates and not a count.
 */
export async function recordRun(result: RunResult, now = new Date()): Promise<ProgressRow> {
  const row = { ...(await getProgress(result.itemId)) };
  const date = today(now);

  row.attempts += 1;
  row.lastPracticedAt = now.toISOString();
  row.minutes += result.durationMs / 60_000;
  row.bestAccuracy = Math.max(row.bestAccuracy, result.accuracy);
  if (result.passed) row.bestTempoPct = Math.max(row.bestTempoPct, result.tempoPct);

  // A pass the owner asserted rather than the app measured keeps saying so,
  // and one that was measured clears the flag: playing it properly is a
  // stronger claim than having said you could, and it should replace it.
  if (result.passed) row.selfPassed = result.selfPassed ?? false;
  if (result.passed && !row.passedOn.includes(date)) row.passedOn.push(date);
  if (result.masterEligible && row.passedOn.length >= 2) row.status = 'mastered';
  else if (result.passed) row.status = row.status === 'mastered' ? 'mastered' : 'passed';
  else if (row.status === 'new') row.status = 'started';

  memory.set(row.itemId, row);
  const session: SessionRow = {
    itemId: result.itemId,
    ...(result.lessonId === undefined ? {} : { lessonId: result.lessonId }),
    mode: result.mode,
    tempoPct: result.tempoPct,
    accuracy: result.accuracy,
    accuracyEstimated: result.accuracyEstimated,
    wrongNotes: result.wrongNotes,
    missed: result.missed,
    durationMs: result.durationMs,
    at: now.toISOString(),
    ...(result.selfReport === undefined ? {} : { selfReport: result.selfReport }),
    ...(result.steadinessMs === undefined ? {} : { steadinessMs: result.steadinessMs }),
    ...(result.notesHeard === undefined ? {} : { notesHeard: result.notesHeard }),
    ...(result.bpm === undefined ? {} : { bpm: result.bpm }),
    ...(result.performance ? { performance: true } : {}),
  };

  const db = await openDatabase();
  if (db) {
    await db.put('progress', row);
    await db.add('sessions', session);
    // Not awaited: the run is finished and the learner is looking at a
    // summary. Tidying up is the app's business, not theirs.
    void pruneSessions();
  }
  await addMinutes(result.durationMs / 60_000, now);
  notify();
  return row;
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
    while (cursor && out.length < limit && scanned < MAX_SESSIONS + PRUNE_SLACK) {
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
 */
export async function sessionsForItem(itemId: string, limit = 5): Promise<SessionRow[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const rows = await db.getAllFromIndex('sessions', 'byItem', itemId);
    return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
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
 * The most sessions kept, and the slack before pruning is worth doing.
 *
 * The store had no retention rule at all: `db.ts` creates it with
 * `autoIncrement` and nothing anywhere removed a row, so every practice run
 * appended one for ever. Daily use for a year is thousands of rows on a phone,
 * and `recentSessions` reads *all* of them and sorts the lot to hand back
 * fifty.
 *
 * 2,000 because that is far more than anything reads. The deepest consumer is
 * the Progress screen's history at 30, and the performances list, which asks
 * for twenty of a rare thing and may therefore walk the whole store to find
 * them — that is the one reader for which the cap is also the bound. The weekly
 * minutes and the heat map come from the `streak` store, which is a total per
 * day and does not depend on this at all. So the cap cannot change a number the
 * owner sees until they are two thousand sessions deep — about six years at a
 * session a day — except that a performance older than that is forgotten, which
 * is the price of not keeping every run ever played.
 *
 * Pruned in blocks rather than one row per run: deleting on every write would
 * put a cursor walk in the path of finishing a piece, which is the one moment
 * this store must not be slow.
 */
export const MAX_SESSIONS = 2_000;
export const PRUNE_SLACK = 200;

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
  for (const row of rows) {
    if (row.status !== 'passed') continue;
    const first = row.passedOn[0];
    if (!first) continue;
    const daysSince = Math.floor((now.getTime() - new Date(first).getTime()) / 86_400_000);
    const step = REVIEW_INTERVALS_DAYS.filter((interval) => daysSince >= interval).length;
    if (step === 0) continue;
    // Already reviewed since the interval came due? `passedOn` grows on each
    // pass, so more passes than steps means it is up to date.
    if (row.passedOn.length > step) continue;
    const interval = REVIEW_INTERVALS_DAYS[step - 1] ?? 21;
    const dueAt = new Date(new Date(first).getTime() + interval * 86_400_000).toISOString();
    due.push({ itemId: row.itemId, dueAt, step });
  }
  return due.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
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
}

/** Test hook. */
export function resetProgressForTest(): void {
  forgetCachedProgress();
  listeners.clear();
}
