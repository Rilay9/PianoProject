/**
 * docs/02 Part G: pass, master, the review queue and the weekly goal.
 *
 * IndexedDB is not available under jsdom, so `openDatabase()` resolves to null
 * and the store falls back to memory — which is exactly the path a learner in
 * private browsing takes, so testing it is testing something real.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  REVIEW_INTERVALS_DAYS,
  addMinutes,
  getProgress,
  getStreak,
  recordRun,
  resetProgressForTest,
  reviewQueue,
  selfPass,
  weekSoFar,
  type RunResult,
} from '../../src/data/progressStore';
import type { ProgressRow } from '../../src/data/db';

const RUN: RunResult = {
  itemId: 'song.folk.hot-cross-buns',
  mode: 'wait',
  tempoPct: 100,
  accuracy: 0.95,
  accuracyEstimated: false,
  wrongNotes: 1,
  missed: 0,
  durationMs: 60_000,
  passed: true,
  masterEligible: false,
};

const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

function row(over: Partial<ProgressRow> = {}): ProgressRow {
  return {
    itemId: 'x',
    status: 'passed',
    bestAccuracy: 0.95,
    bestTempoPct: 100,
    attempts: 1,
    lastPracticedAt: '',
    minutes: 1,
    passedOn: ['2026-09-01'],
    ...over,
  };
}

beforeEach(() => resetProgressForTest());

describe('recordRun', () => {
  it('marks a first failed run as started, not passed', async () => {
    const out = await recordRun({ ...RUN, passed: false, accuracy: 0.4 });
    expect(out.status).toBe('started');
    expect(out.attempts).toBe(1);
  });

  it('marks a passed run as passed and remembers the best numbers', async () => {
    await recordRun({ ...RUN, accuracy: 0.91 });
    const out = await recordRun({ ...RUN, accuracy: 0.95, tempoPct: 110 });
    expect(out.status).toBe('passed');
    expect(out.bestAccuracy).toBeCloseTo(0.95);
    expect(out.bestTempoPct).toBe(110);
  });

  it('does not let a worse run lower the best numbers', async () => {
    await recordRun({ ...RUN, accuracy: 0.99, tempoPct: 120 });
    const out = await recordRun({ ...RUN, accuracy: 0.5, tempoPct: 60, passed: false });
    expect(out.bestAccuracy).toBeCloseTo(0.99);
    expect(out.bestTempoPct).toBe(120);
  });

  it('needs two passes on different days to master (docs/02 Part G)', async () => {
    await recordRun({ ...RUN, masterEligible: true }, day('2026-09-01'));
    expect((await getProgress(RUN.itemId)).status).toBe('passed');
    // A second pass on the *same* day is still one day.
    await recordRun({ ...RUN, masterEligible: true }, day('2026-09-01'));
    expect((await getProgress(RUN.itemId)).status).toBe('passed');
    await recordRun({ ...RUN, masterEligible: true }, day('2026-09-02'));
    expect((await getProgress(RUN.itemId)).status).toBe('mastered');
  });

  it('never demotes a mastered item', async () => {
    await recordRun({ ...RUN, masterEligible: true }, day('2026-09-01'));
    await recordRun({ ...RUN, masterEligible: true }, day('2026-09-02'));
    const out = await recordRun({ ...RUN, passed: false, accuracy: 0.2 }, day('2026-09-03'));
    expect(out.status).toBe('mastered');
  });

  it('accumulates practice minutes', async () => {
    await recordRun({ ...RUN, durationMs: 120_000 });
    await recordRun({ ...RUN, durationMs: 60_000 });
    expect((await getProgress(RUN.itemId)).minutes).toBeCloseTo(3);
  });
});

describe('selfPass', () => {
  it('passes an item without a run and says it was self-assessed', async () => {
    const out = await selfPass('song.folk.twinkle.rh');
    expect(out.status).toBe('passed');
    expect(out.selfPassed).toBe(true);
    expect(out.attempts).toBe(0);
  });
});

describe('reviewQueue', () => {
  const now = day('2026-09-10');

  it('is empty for something passed today', () => {
    expect(reviewQueue([row({ passedOn: ['2026-09-10'] })], now)).toEqual([]);
  });

  it('brings back an item a day after it was passed', () => {
    const due = reviewQueue([row({ itemId: 'a', passedOn: ['2026-09-09'] })], now);
    expect(due.map((d) => d.itemId)).toEqual(['a']);
    expect(due[0]?.step).toBe(1);
  });

  it('moves through the 1, 3, 7, 21 day steps', () => {
    const eightDaysAgo = row({ itemId: 'a', passedOn: ['2026-09-02'] });
    expect(reviewQueue([eightDaysAgo], now)[0]?.step).toBe(3);
    expect(REVIEW_INTERVALS_DAYS).toEqual([1, 3, 7, 21]);
  });

  it('drops an item that has been reviewed since it came due', () => {
    // Two passes, one step due: already caught up.
    const caughtUp = row({ itemId: 'a', passedOn: ['2026-09-09', '2026-09-10'] });
    expect(reviewQueue([caughtUp], now)).toEqual([]);
  });

  it('leaves mastered items out', () => {
    const mastered = row({ status: 'mastered', passedOn: ['2026-08-01', '2026-08-02'] });
    expect(reviewQueue([mastered], now)).toEqual([]);
  });

  it('leaves items that were never passed out', () => {
    expect(reviewQueue([row({ status: 'started', passedOn: [] })], now)).toEqual([]);
  });

  it('orders by how overdue they are', () => {
    const due = reviewQueue(
      [row({ itemId: 'newer', passedOn: ['2026-09-09'] }), row({ itemId: 'older', passedOn: ['2026-09-01'] })],
      now,
    );
    expect(due.map((d) => d.itemId)).toEqual(['older', 'newer']);
  });
});

describe('the weekly goal', () => {
  it('counts the last seven days, not the calendar week', async () => {
    await addMinutes(30, day('2026-09-10'));
    await addMinutes(20, day('2026-09-08'));
    await addMinutes(99, day('2026-09-01')); // ten days ago: outside the window
    const week = weekSoFar(await getStreak(), day('2026-09-10'));
    expect(week.minutes).toBe(50);
    expect(week.days).toBe(2);
  });

  it('starts at the default goal', async () => {
    expect((await getStreak()).weeklyGoalMinutes).toBe(150);
  });
});
