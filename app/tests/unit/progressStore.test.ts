/**
 * docs/02 Part G: pass, master, the pieces learned and the weekly goal.
 *
 * IndexedDB is not available under jsdom, so `openDatabase()` resolves to null
 * and the store falls back to memory — which is exactly the path a learner in
 * private browsing takes, so testing it is testing something real.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  dailyReadDays,
  dayKey,
  addMinutes,
  getProgress,
  getStreak,
  recordRun,
  resetProgressForTest,
  learnedPieces,
  selfPass,
  weekSoFar,
  type RunResult,
} from '../../src/data/progressStore';
import { dailySeed } from '../../src/engine/sightReading';
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

// Replaced (C6): the seven `reviewQueue` cases — a passed item due 1, 3, 7 and
// 21 days after its first pass, caught up by a pass since, mastered items out,
// ordered by how overdue. The assumption they encoded, that review is a
// calendar of one item's dates, is retired (the reviewer's correction of
// 2026-09-26): the store lists the pieces learned and when each was last
// played, and the session decides what is due from skill retention and a
// repertoire window (`repertoireRetention.test.ts`, which holds the rest:
// generated rows, the learner's word, the window).
describe('learnedPieces', () => {
  const PIECES = (): boolean => false;

  it('a piece passed or mastered is learned, with when it was last played', () => {
    const played = '2026-09-09T18:00:00.000Z';
    expect(
      learnedPieces([row({ itemId: 'a', lastPracticedAt: played }), row({ itemId: 'b', status: 'mastered', lastPracticedAt: played })], PIECES),
    ).toEqual([
      { itemId: 'a', status: 'passed', lastPlayed: played },
      { itemId: 'b', status: 'mastered', lastPlayed: played },
    ]);
  });

  it('a piece never passed is not', () => {
    expect(learnedPieces([row({ status: 'started', passedOn: [] }), row({ status: 'new', passedOn: [] })], PIECES)).toEqual([]);
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

describe("Today's read is the run that carries the day's seed", () => {
  // The day used to be read off the item's `lastPracticedAt`, so the same
  // exercise opened from Plan (a different phrase) ticked it, and a day
  // already ticked came untick when the stage moved on and Today picked
  // another item. The seed is the one thing only Today's card sends.
  it('ticks the day when the run carries the day\'s seed', async () => {
    const now = new Date();
    expect(await dailyReadDays()).not.toContain(dayKey(now));
    await recordRun({ ...RUN, seed: dailySeed(dayKey(now)) }, now);
    expect(await dailyReadDays()).toContain(dayKey(now));
  });

  it('leaves the day alone for a run with no seed or another seed', async () => {
    const now = new Date();
    await recordRun({ ...RUN }, now);
    await recordRun({ ...RUN, seed: dailySeed(dayKey(now)) + 1 }, now);
    expect(await dailyReadDays()).not.toContain(dayKey(now));
  });
});
