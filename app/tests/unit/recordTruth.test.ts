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
  dailyReadDays,
  dayKey,
  recentSessions,
  recordRun,
  resetProgressForTest,
  reviewQueue,
  type RunResult,
} from '../../src/data/progressStore';
import { dailySeed } from '../../src/engine/sightReading';
import type { ProgressRow } from '../../src/data/db';

const NOT_MEASURED = 'not measured';

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
  // Revised (C1): this read two fields back. The row is now the run's whole
  // observation (`observationsFromRun` proves what the screen writes); what
  // the store owes it is to keep every field it was given, "not measured"
  // included, rather than the seven it used to copy.
  it('a Wait run is stored as one whose tempo was not measured, with the rest of what it observed', async () => {
    await recordRun({
      ...RUN,
      mode: 'wait',
      tempoMeasured: false,
      passed: false,
      definitions: 1,
      pitch: { definition: 'wait-steps', right: 7, of: 8, estimated: false },
      timing: NOT_MEASURED,
      early: NOT_MEASURED,
      steps: { from: 0, codes: 'hhhwhhhh', measures: [0, 0, 4, 1], wrong: [3, 63], early: [], timing: NOT_MEASURED },
      hands: { played: 'R', appPlayed: 'other hand' },
      keys: { view: 'strip', guide: 'next', fingers: true, names: false },
      graceNotes: false,
      input: { source: 'midi', toleranceMs: 150, latencyMs: 0 },
      range: { fromMeasure: 0, toMeasure: 1 },
      demonstrated: false,
    });
    const [session] = await recentSessions(1);
    expect(session?.mode).toBe('wait');
    expect(session?.tempoMeasured).toBe(false);
    expect(session?.timing).toBe(NOT_MEASURED);
    expect(session?.early).toBe(NOT_MEASURED);
    expect(session?.steps?.codes).toBe('hhhwhhhh');
    expect(session?.hands).toEqual({ played: 'R', appPlayed: 'other hand' });
    expect(session?.keys?.guide).toBe('next');
    expect(session?.graceNotes).toBe(false);
    expect(session?.definitions).toBe(1);
  });

  // Revised (C1): a self-report is written only for a run nothing heard
  // (T40), and its accuracy is now "not measured", not the 0 that the history
  // printed as "0%" (L43).
  it('a sight-read keeps its phrase’s seed, and a self-report its answer and no accuracy', async () => {
    const row = await recordRun({
      ...RUN,
      seed: 20260925,
      selfReport: 'ok',
      passed: false,
      tempoMeasured: false,
      accuracy: NOT_MEASURED,
      wrongNotes: NOT_MEASURED,
      missed: NOT_MEASURED,
      pitch: NOT_MEASURED,
    });
    const [session] = await recentSessions(1);
    expect(session?.seed).toBe(20260925);
    expect(session?.selfReport).toBe('ok');
    expect(session?.accuracy).toBe(NOT_MEASURED);
    expect(session?.wrongNotes).toBe(NOT_MEASURED);
    // Nothing measured is not a best of nought, and never NaN.
    expect(row.bestAccuracy).toBe(0);
    expect(row.attempts).toBe(1);
  });
});

describe('a run that was not a first reading is practice, not evidence (C1, reviewer decision 3)', () => {
  it('keeps its minutes, its attempt and its row, and gives no pass, no best and no day’s tick', async () => {
    const now = on('2026-09-25');
    // Today's phrase, heard before it was read: the writer says it passed on
    // its notes, and the store still refuses what it cannot support.
    const row = await recordRun(
      { ...RUN, seed: dailySeed(dayKey(now)), unseen: false, passed: true, masterEligible: true },
      now,
    );
    expect(row.status, 'a heard phrase passed the reading drill').toBe('started');
    expect(row.passedOn).toEqual([]);
    expect(row.masteredOn ?? []).toEqual([]);
    expect(row.bestAccuracy).toBe(0);
    expect(row.bestTempoPct).toBe(0);
    expect(row.attempts).toBe(1);
    expect(row.minutes).toBe(1);
    expect(await dailyReadDays(), 'a heard phrase ticked the day').not.toContain(dayKey(now));
    const [session] = await recentSessions(1);
    expect(session?.unseen).toBe(false);
  });

  // Revised (C5, S8): the first reading of today's phrase still ticks the day
  // — a habit — and passes nothing: a generated phrase carries no pass, no
  // mastery and no review date. Its evidence is on the session row.
  it('an unseen run of today’s phrase still ticks the day, and passes nothing', async () => {
    const now = on('2026-09-25');
    const row = await recordRun({ ...RUN, seed: dailySeed(dayKey(now)), unseen: true }, now);
    expect(row.status, 'a sight-read passed its row like a piece').toBe('started');
    expect(row.passedOn).toEqual([]);
    expect(await dailyReadDays()).toContain(dayKey(now));
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
  // of it, a pass was not due until mid-morning of the next day. Revised (C5):
  // the queue is told which items are generated sight-reading rows (none here:
  // 'a' is a piece, whose calendar C5 keeps).
  const pieces = (): boolean => false;
  for (const tz of ['America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']) {
    it(`in ${tz}: passed at 20:30, not due at 20:45 that evening, due the next morning`, () => {
      process.env.TZ = tz;
      const passedAt = new Date(2026, 8, 10, 20, 30);
      const row = passed(dayKey(passedAt));
      expect(row.passedOn).toEqual(['2026-09-10']);
      expect(reviewQueue([row], new Date(2026, 8, 10, 20, 45), pieces)).toEqual([]);
      expect(reviewQueue([row], new Date(2026, 8, 10, 23, 59), pieces)).toEqual([]);
      const tomorrow = reviewQueue([row], new Date(2026, 8, 11, 7, 0), pieces);
      expect(tomorrow.map((item) => item.step)).toEqual([1]);
      // Due from the learner's own midnight, not from UTC's.
      expect(new Date(tomorrow[0]?.dueAt ?? '').getTime()).toBe(new Date(2026, 8, 11).getTime());
    });

    it(`in ${tz}: the three-day step comes on the third calendar day`, () => {
      process.env.TZ = tz;
      const row = passed('2026-09-10');
      expect(reviewQueue([row], new Date(2026, 8, 12, 23, 0), pieces)[0]?.step).toBe(1);
      expect(reviewQueue([{ ...row, passedOn: ['2026-09-10', '2026-09-11'] }], new Date(2026, 8, 13, 0, 30), pieces)[0]?.step).toBe(2);
    });
  }
});
