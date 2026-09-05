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
}

export const DEFAULT_WEEKLY_GOAL_MINUTES = 150;

/** docs/02 Part G: review comes back 1, 3, 7 and 21 days after a pass. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 21];

function today(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

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
  };

  const db = await openDatabase();
  if (db) {
    await db.put('progress', row);
    await db.add('sessions', session);
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

export async function recentSessions(limit = 50): Promise<SessionRow[]> {
  const db = await openDatabase();
  const rows = (await db?.getAll('sessions')) ?? [];
  return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
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

/** Test hook. */
export function resetProgressForTest(): void {
  memory.clear();
  streakMemory = null;
  listeners.clear();
}
