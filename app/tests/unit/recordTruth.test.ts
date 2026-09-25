/**
 * What the progress record keeps, and when it says *mastered* (T37).
 *
 * The store half of the rule the sheet's half is tested for in
 * `scoreSummaryTruth.test.ts`: never record evidence the engine did not
 * measure. Four things the record used to get wrong, each driven through
 * `recordRun` and `reviewQueue` and read back the way the app reads it:
 *
 * - *mastered* came from one master-standard run plus any earlier pass,
 *   because the store counted `passedOn`; Part G asks for the master standard
 *   on two different days;
 * - a Wait for me run's slider value could become the item's best tempo;
 * - the session row had nowhere to say that tempo was not measured, or which
 *   generated phrase the run was of;
 * - the review queue read a local day key as UTC midnight, so in the US an
 *   evening pass was "due for review" the same evening.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import {
  dayKey,
  recentSessions,
  recordRun,
  resetProgressForTest,
  reviewQueue,
  type RunResult,
} from '../../src/data/progressStore';
import type { ProgressRow } from '../../src/data/db';

const RUN: RunResult = {
  itemId: 'song.folk.hot-cross-buns',
  mode: 'tempo',
  tempoPct: 100,
  accuracy: 0.98,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 60_000,
  passed: true,
  masterEligible: false,
  tempoMeasured: true,
};

/** Noon UTC: the same calendar day in every zone this suite runs in. */
const on = (iso: string): Date => new Date(`${iso}T12:00:00.000Z`);

// A blank database for every test: importing the helper installs one, and a
// row written by one test would otherwise be the next test's history.
beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
});
afterEach(() => clearFakeIndexedDb());

describe('mastery is the master standard on two different days (Part G)', () => {
  it('a pass one day and one master-standard run the next is not yet mastery', async () => {
    await recordRun({ ...RUN, accuracy: 0.92 }, on('2026-09-01'));
    const row = await recordRun({ ...RUN, masterEligible: true }, on('2026-09-02'));
    // Two pass days, one master day. The store used to say *mastered* here.
    expect(row.status).toBe('passed');
    expect(row.passedOn).toHaveLength(2);
    expect(row.masteredOn).toEqual(['2026-09-02']);
  });

  it('two master-standard runs on one day are one day', async () => {
    await recordRun({ ...RUN, masterEligible: true }, on('2026-09-01'));
    const row = await recordRun({ ...RUN, masterEligible: true }, on('2026-09-01'));
    expect(row.masteredOn).toEqual(['2026-09-01']);
    expect(row.status).toBe('passed');
  });

  it('the master standard on a second day is mastery', async () => {
    await recordRun({ ...RUN, masterEligible: true }, on('2026-09-01'));
    await recordRun({ ...RUN, accuracy: 0.9 }, on('2026-09-02'));
    const row = await recordRun({ ...RUN, masterEligible: true }, on('2026-09-03'));
    expect(row.masteredOn).toEqual(['2026-09-01', '2026-09-03']);
    expect(row.status).toBe('mastered');
  });
});

describe('a Wait for me run records no tempo', () => {
  it('its slider value never becomes the best tempo, even where it passes on its notes', async () => {
    // A criterion with no tempo floor is the one way a Wait run passes.
    const row = await recordRun({ ...RUN, mode: 'wait', tempoPct: 120, tempoMeasured: false });
    expect(row.status).toBe('passed');
    expect(row.bestTempoPct).toBe(0);
  });

  it('a measured tempo still does', async () => {
    const row = await recordRun({ ...RUN, tempoPct: 110 });
    expect(row.bestTempoPct).toBe(110);
  });
});

describe('the session row says what was measured, and of which phrase', () => {
  it('a Wait run is stored as one whose tempo was not measured', async () => {
    await recordRun({ ...RUN, mode: 'wait', tempoMeasured: false, passed: false });
    const [session] = await recentSessions(1);
    expect(session?.mode).toBe('wait');
    expect(session?.tempoMeasured).toBe(false);
  });

  it('a sight-read keeps its phrase’s seed, and a self-report its answer', async () => {
    await recordRun({ ...RUN, seed: 20260925, selfReport: 'ok', passed: false, tempoMeasured: false });
    const [session] = await recentSessions(1);
    expect(session?.seed).toBe(20260925);
    expect(session?.selfReport).toBe('ok');
  });
});

describe('the review queue counts days where the learner lives', () => {
  const zone = process.env.TZ;
  afterEach(() => {
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  });

  function passed(day: string): ProgressRow {
    return {
      itemId: 'a',
      status: 'passed',
      bestAccuracy: 0.95,
      bestTempoPct: 100,
      attempts: 1,
      lastPracticedAt: '',
      minutes: 1,
      passedOn: [day],
    };
  }

  // West of UTC the old reading made an evening pass due the same evening; east
  // of it, a pass was not due until mid-morning of the next day.
  for (const tz of ['America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']) {
    it(`in ${tz}: passed at 20:30, not due at 20:45 that evening, due the next morning`, () => {
      process.env.TZ = tz;
      const passedAt = new Date(2026, 8, 10, 20, 30);
      const row = passed(dayKey(passedAt));
      expect(row.passedOn).toEqual(['2026-09-10']);
      expect(reviewQueue([row], new Date(2026, 8, 10, 20, 45))).toEqual([]);
      expect(reviewQueue([row], new Date(2026, 8, 10, 23, 59))).toEqual([]);
      const tomorrow = reviewQueue([row], new Date(2026, 8, 11, 7, 0));
      expect(tomorrow.map((item) => item.step)).toEqual([1]);
      // Due from the learner's own midnight, not from UTC's.
      expect(new Date(tomorrow[0]?.dueAt ?? '').getTime()).toBe(new Date(2026, 8, 11).getTime());
    });

    it(`in ${tz}: the three-day step comes on the third calendar day`, () => {
      process.env.TZ = tz;
      const row = passed('2026-09-10');
      expect(reviewQueue([row], new Date(2026, 8, 12, 23, 0))[0]?.step).toBe(1);
      expect(reviewQueue([{ ...row, passedOn: ['2026-09-10', '2026-09-11'] }], new Date(2026, 8, 13, 0, 30))[0]?.step).toBe(2);
    });
  }
});
