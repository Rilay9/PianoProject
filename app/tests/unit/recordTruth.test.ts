/**
 * What the progress record keeps, and when it says *mastered* (T37).
 *
 * The store half of the rule the sheet's half is tested for in
 * `scoreSummaryTruth.test.ts`: never record evidence the engine did not
 * measure. Four things the record used to get wrong, each driven through
 * `recordRun` (and, for the last, the session's retention rule) and read back
 * the way the app reads it:
 *
 * - *mastered* came from one master-standard run plus any earlier pass,
 *   because the store counted `passedOn`; Part G asks for the master standard
 *   on two different days;
 * - a Wait for me run's slider value could become the item's best tempo;
 * - the session row had nowhere to say that tempo was not measured, or which
 *   generated phrase the run was of;
 * - the review queue read a local day key as UTC midnight, so in the US an
 *   evening pass was "due for review" the same evening (the queue is retired
 *   in C6; the repertoire window that replaced it counts days the same way).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import {
  dailyReadDays,
  dayKey,
  recentSessions,
  recordRun,
  resetProgressForTest,
  type RunResult,
} from '../../src/data/progressStore';
import { dailySeed } from '../../src/engine/sightReading';
import { buildSession, REPERTOIRE_WINDOW_DAYS } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { learnFormerIdentities } from '../../src/curriculum/material';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';

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

/**
 * E50c (Entry 190; the reviewer's required change on E50b, `docs/review/responses/65ae9d5f.md`): a fresh
 * *mastered* counts only days supported by a run whose tempo channel is comparable under E50b's rule
 * (`material.tempoNotComparable`). An old run of a repaired file was 100 % of the converter's defaulted 96,
 * not of the tempo the repaired score prints, so that day cannot combine with one new day at the printed
 * tempo to make mastery; a legacy run with no material or no base proves nothing either. `masteredOn`
 * stays history — every date kept, none rewritten — and a row already mastered stays mastered.
 *
 * The old-day, the two legacy, the two repair-day and the no-database cases are red where the guard does not
 * exist; the reach and the calendar-day cases hold the guard's own reading of the stored rows (each red under
 * its mutant, `docs/prompts/runs/E50c/`); the controls (two comparable days, an item no repair touched, a
 * historical mastered row) are green before and after.
 */
describe('E50c: a fresh mastery counts only days whose tempo is comparable (a tempo-repaired item)', () => {
  const REPAIRED = 'song.blues.wabash-blues';
  const OLD = 'a'.repeat(64);
  const NEW = 'b'.repeat(64);
  const file = (sha256: string) => ({ kind: 'file' as const, sha256 });
  /** The repaired row as the build writes it (E50b): the old file a former identity, and tempo-repaired. */
  const repairedRow = {
    id: REPAIRED,
    type: 'song',
    title: 'Wabash Blues',
    level: 3,
    tracks: ['core'],
    concepts: [],
    file: `scores/${REPAIRED}.mxl`,
    provenance: { identity: file(NEW), formerIdentities: [file(OLD)], tempoRepairedFrom: [file(OLD)] },
  } as unknown as CatalogItem;
  /** A master-standard run of the repaired item's id (the engine's own judgement: `masterEligible`). */
  const MASTER: RunResult = { ...RUN, itemId: REPAIRED, masterEligible: true };
  /** Before the repair: the old file, at 100 % of the defaulted 96. */
  const oldDay: RunResult = { ...MASTER, material: file(OLD), baseTempo: { bpm: 96, source: 'defaulted' } };
  /** After it: the repaired file at the tempo it prints. */
  const newDay: RunResult = { ...MASTER, material: file(NEW), baseTempo: { bpm: 120, source: 'written' } };

  const zone = process.env.TZ;
  beforeEach(() => learnFormerIdentities([repairedRow]));
  afterEach(() => {
    learnFormerIdentities([]);
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  });

  it('an old day at 100 % of the defaulted 96 and one new day at the printed tempo is not mastery', async () => {
    await recordRun(oldDay, on('2026-09-20'));
    const row = await recordRun(newDay, on('2026-10-01'));
    expect(row.status, 'an old defaulted-tempo day made the second master day').toBe('passed');
    // History: both dates kept, neither rewritten nor dropped.
    expect(row.masteredOn).toEqual(['2026-09-20', '2026-10-01']);
  });

  it('two days at the printed tempo still are (control)', async () => {
    await recordRun(newDay, on('2026-10-01'));
    const row = await recordRun(newDay, on('2026-10-02'));
    expect(row.status).toBe('mastered');
    expect(row.masteredOn).toEqual(['2026-10-01', '2026-10-02']);
  });

  it('an old day does not count, and a second new day then makes mastery: refused, never raised past two', async () => {
    await recordRun(oldDay, on('2026-09-20'));
    await recordRun(newDay, on('2026-10-01'));
    const row = await recordRun(newDay, on('2026-10-02'));
    expect(row.status).toBe('mastered');
    expect(row.masteredOn).toEqual(['2026-09-20', '2026-10-01', '2026-10-02']);
  });

  it('a legacy run with no material and no base proves nothing: refused like the old file', async () => {
    const { material: _material, baseTempo: _base, ...legacy } = oldDay;
    await recordRun(legacy, on('2026-09-10'));
    const row = await recordRun(newDay, on('2026-10-01'));
    expect(row.status, 'a legacy run with no base proof made a master day').toBe('passed');
    expect(row.masteredOn).toEqual(['2026-09-10', '2026-10-01']);
  });

  it('a run naming the repaired file but recording no base proves nothing either', async () => {
    const { baseTempo: _base, ...noBase } = newDay;
    await recordRun(noBase, on('2026-09-30'));
    const row = await recordRun(newDay, on('2026-10-01'));
    expect(row.status, 'a run with no recorded base made a master day').toBe('passed');
  });

  it('a comparable run that met no master standard does not carry an old master run’s day', async () => {
    // The day the repair lands: the old file's master run, then a run of the repaired file below the master standard.
    await recordRun(oldDay, on('2026-09-30'));
    await recordRun({ ...newDay, accuracy: 0.92, masterEligible: false }, on('2026-09-30'));
    const row = await recordRun(newDay, on('2026-10-01'));
    expect(row.status, 'a comparable non-master run let the old master day count').toBe('passed');
  });

  it('nor does a rhythm-only run at the master numbers, which the sheet never lets master', async () => {
    await recordRun(oldDay, on('2026-09-30'));
    await recordRun({ ...newDay, rhythmOnly: true, passed: false, masterEligible: false }, on('2026-09-30'));
    const row = await recordRun(newDay, on('2026-10-01'));
    expect(row.status, 'a rhythm-only run let the old master day count').toBe('passed');
  });

  it('an earlier comparable day is reached however many runs came after it', async () => {
    await recordRun(newDay, on('2026-10-01'));
    // Seven runs below the master standard in between: more than `sessionsForItem`'s default of five.
    for (let day = 2; day <= 8; day += 1) {
      await recordRun({ ...newDay, accuracy: 0.92, masterEligible: false }, on(`2026-10-0${String(day)}`));
    }
    const row = await recordRun(newDay, on('2026-10-09'));
    expect(row.status, 'the earlier comparable day was not reached').toBe('mastered');
  });

  it('a stored run’s day is the learner’s calendar day, not its UTC date', async () => {
    process.env.TZ = 'America/New_York';
    // 20:30 in New York on the 1st is 00:30 UTC on the 2nd.
    await recordRun(newDay, new Date(2026, 9, 1, 20, 30));
    const row = await recordRun(newDay, new Date(2026, 9, 3, 12, 0));
    expect(row.masteredOn).toEqual(['2026-10-01', '2026-10-03']);
    expect(row.status, 'the evening run was filed under the next UTC day').toBe('mastered');
  });

  it('a row mastered before the repair is never demoted (history)', async () => {
    learnFormerIdentities([]);
    await recordRun(oldDay, on('2026-09-10'));
    expect((await recordRun(oldDay, on('2026-09-11'))).status).toBe('mastered');
    learnFormerIdentities([repairedRow]);
    expect((await recordRun({ ...newDay, accuracy: 0.92, masterEligible: false }, on('2026-10-01'))).status).toBe('mastered');
    expect((await recordRun(newDay, on('2026-10-02'))).status).toBe('mastered');
  });

  it('an item no repair touched is judged as before, a defaulted-tempo run with no material included (control)', async () => {
    const plain: RunResult = { ...RUN, masterEligible: true };
    await recordRun({ ...plain, baseTempo: { bpm: 96, source: 'defaulted' } }, on('2026-09-20'));
    const row = await recordRun(plain, on('2026-10-01'));
    expect(row.status).toBe('mastered');
  });

  it('without a database: an item no repair touched masters as before; a repaired one never freshly does', async () => {
    clearFakeIndexedDb();
    resetProgressForTest();
    await recordRun({ ...RUN, masterEligible: true }, on('2026-10-01'));
    expect((await recordRun({ ...RUN, masterEligible: true }, on('2026-10-02'))).status).toBe('mastered');
    // No session row is ever written without IndexedDB, so no earlier day is supported: refusal, the rule.
    await recordRun(newDay, on('2026-10-01'));
    const row = await recordRun(newDay, on('2026-10-02'));
    expect(row.status).toBe('passed');
    expect(row.masteredOn).toEqual(['2026-10-01', '2026-10-02']);
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

// Replaced (C6): T37's two calendar cases per time zone — an evening pass not
// due that evening and due the next morning at step 1; the three-day step on
// the third calendar day. The calendar is retired (the reviewer's correction of
// 2026-09-26); what it protected, days counted where the learner lives, is held
// here on the rule that replaced it: a learned piece returns once it has gone
// the repertoire window unplayed, counted in the learner's calendar days.
describe('the repertoire window counts days where the learner lives', () => {
  const zone = process.env.TZ;
  afterEach(() => {
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  });

  const song = { id: 'song.a', type: 'song', title: 'A', level: 1, hands: 'both', tracks: ['core'], concepts: [], file: 'scores/a.mxl' } as CatalogItem;
  const empty: Curriculum = { version: 1, tracks: [], stages: [] };
  const reviewOn = (today: Date, lastPlayed: string): string | undefined =>
    buildSession({
      curriculum: empty,
      catalog: indexCatalog([song]),
      items: [song],
      states: { byRung: new Map() },
      learned: [{ itemId: 'song.a', status: 'passed', lastPlayed }],
      lastPlayed: new Map([['song.a', lastPlayed]]),
      activeTracks: [],
      minutes: 15,
      today,
    }).slots.find((slot) => slot.kind === 'review')?.claim?.kind;

  for (const tz of ['America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']) {
    it(`in ${tz}: played at 20:30, not due late on the window's last day, due the next morning`, () => {
      process.env.TZ = tz;
      const playedAt = new Date(2026, 8, 10, 20, 30).toISOString();
      expect(reviewOn(new Date(2026, 8, 10 + REPERTOIRE_WINDOW_DAYS - 1, 23, 59), playedAt)).not.toBe('piece-retention');
      expect(reviewOn(new Date(2026, 8, 10 + REPERTOIRE_WINDOW_DAYS, 7, 0), playedAt)).toBe('piece-retention');
    });
  }
});
