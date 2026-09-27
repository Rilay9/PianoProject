/**
 * The retired skills store's rows become a weak concept exposure, never
 * reconstructed history (C7 items 5a and 6; the reviewer's pre-dispatch change
 * of 2026-09-26).
 *
 * Until C7 the store held its own truth per concept — `unseen`, `learning` or
 * `known` — written by the lesson page when a rung was met and by *I already
 * know this*, and read by the Skills screen with a calendar for "rusty". C7
 * retires that truth. What a legacy row can honestly still say is only that
 * the old system had met the concept: it recorded no item, no run, nothing
 * heard, seen or played. So the migration keeps exactly that, as the ladder's
 * exposure input (`ladderState`'s `exposures`, the representation C5's carried
 * rungs already use), dated the day it ran, and nothing more: at most
 * *introduced*, never evidence, never a met requirement, never an encounter
 * with material, and the next genuine evidence moves the ladder as if the row
 * had never been there. Six assertions, the reviewer's six.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase, type LegacySkillRow } from '../../src/data/db';
import { learnerExposures, migrateLegacySkills } from '../../src/data/skillsStore';
import { resetProgressForTest, rungRows } from '../../src/data/progressStore';
import { rungState, skillLadders } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { LADDER_STATES } from '../../src/evidence/ladder';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import { daysAfter, readRow } from './helpers/skillEvidence';

const MIGRATED_ON = new Date('2026-10-01T09:00:00.000Z');
const TODAY = new Date('2026-10-20T12:00:00.000Z');

/** What the store held before C7: two vocabulary skills, a concept the app cannot measure, and one never met. */
const LEGACY: LegacySkillRow[] = [
  { conceptId: 'interval-reading', state: 'known', lastReviewedAt: '2026-08-01T10:00:00.000Z' },
  { conceptId: 'bass-clef', state: 'learning' },
  { conceptId: 'posture', state: 'known', lastReviewedAt: '2026-07-01T10:00:00.000Z' },
  { conceptId: 'ledger-lines', state: 'unseen', lastReviewedAt: '2026-07-01T10:00:00.000Z' },
];

const RUNG: Lesson = {
  id: '1.5',
  title: 'Reading by interval',
  concepts: ['interval-reading', 'bass-clef'],
  textFile: 'lessons/1.5.md',
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'skill', skill: 'interval-reading', state: 'familiar' }],
};
const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: '1.5', title: 'Unit', track: 'core', lessons: [RUNG] }] }],
};

async function seedLegacy(): Promise<void> {
  const db = await openDatabase();
  if (!db) throw new Error('the fake database did not open');
  for (const row of LEGACY) await db.put('skills', row);
}

async function storeRows(): Promise<unknown[]> {
  const db = await openDatabase();
  return (await db?.getAll('skills')) ?? [];
}

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
});
afterEach(() => {
  clearFakeIndexedDb();
});

describe('a legacy skills row is carried over as an exposure, and as nothing else', () => {
  it('known and learning rows yield at most introduced; a row that said unseen yields nothing', async () => {
    await seedLegacy();
    await migrateLegacySkills(MIGRATED_ON);
    const exposures = await learnerExposures(CURRICULUM, {}, MIGRATED_ON);
    expect(exposures.get('interval-reading')).toEqual([MIGRATED_ON.toISOString()]);
    expect(exposures.get('bass-clef')).toEqual([MIGRATED_ON.toISOString()]);
    expect(exposures.get('posture'), 'a concept the app cannot measure keeps the same weak fact').toEqual([MIGRATED_ON.toISOString()]);
    expect(exposures.has('ledger-lines'), 'a row that said unseen was carried over as met').toBe(false);

    const ladders = skillLadders([], VOCABULARY_V0, TODAY, exposures);
    const introduced = LADDER_STATES.indexOf('introduced');
    for (const skill of ['interval-reading', 'bass-clef']) {
      expect(ladders.get(skill)?.state, `${skill} came out of the migration above introduced`).toBe('introduced');
    }
    for (const [skill, reading] of ladders) {
      expect(LADDER_STATES.indexOf(reading.state), `${skill} is above introduced with no evidence`).toBeLessThanOrEqual(introduced);
    }
    expect(ladders.get('ledger-lines')?.state).toBe('not introduced');
  });

  it('produces no measured evidence: no run, no evidence record, no self-assessment', async () => {
    await seedLegacy();
    await migrateLegacySkills(MIGRATED_ON);
    const db = await openDatabase();
    expect(await db?.count('sessions'), 'the migration wrote a run').toBe(0);
    expect(await db?.count('progress'), 'the migration wrote an item’s progress').toBe(0);
    expect(await rungRows()).toEqual([]);
    const ladders = skillLadders(await rungRows(), VOCABULARY_V0, TODAY, await learnerExposures(CURRICULUM, {}, TODAY));
    for (const [skill, reading] of ladders) {
      expect(reading.state, `${skill} reads as practised: evidence from nowhere`).not.toBe('practised');
      expect(reading.selfAssessed, `${skill} was given the learner's word`).toEqual([]);
      expect(reading.notShownRecently, `${skill} is "not shown recently" with nothing ever shown`).toBe(false);
    }
  });

  it('meets no rung’s skill requirement', async () => {
    await seedLegacy();
    await migrateLegacySkills(MIGRATED_ON);
    const states = rungState(await rungRows(), CURRICULUM, VOCABULARY_V0, TODAY);
    const reading = states.byRung.get('1.5');
    expect(reading?.requirements[0]?.holds, 'a legacy "known" met a skill requirement').toBe(false);
    expect(reading?.requirements[0]?.have).toBe(0);
    expect(reading?.status).toBe('not started');
  });

  it('claims no encounter with any material: a concept and a date, nothing about an item, a run, or what was seen or heard', async () => {
    await seedLegacy();
    await migrateLegacySkills(MIGRATED_ON);
    const rows = (await storeRows()) as Record<string, unknown>[];
    expect(rows.map((row) => row.conceptId).sort()).toEqual(['bass-clef', 'interval-reading', 'posture']);
    for (const row of rows) {
      expect(Object.keys(row).sort(), 'a migrated row carries more than the concept and the day').toEqual(['conceptId', 'exposedAt']);
      expect(row.exposedAt).toBe(MIGRATED_ON.toISOString());
    }
    // The old dates are not kept as when anything happened: they said when
    // the old store was written, which is not an encounter with material.
    expect(JSON.stringify(rows)).not.toContain('2026-08-01');
    expect(JSON.stringify(rows)).not.toMatch(/itemId|viewed|heard|demonstrated|played|unseen|state/);
  });

  it('the next genuine evidence moves the same ladder as it would have with no legacy row', async () => {
    await seedLegacy();
    await migrateLegacySkills(MIGRATED_ON);
    const exposures = await learnerExposures(CURRICULUM, {}, MIGRATED_ON);
    const reads = [readRow(daysAfter(MIGRATED_ON, 2)), readRow(daysAfter(MIGRATED_ON, 5))];
    const withLegacy = skillLadders(reads, VOCABULARY_V0, TODAY, exposures);
    const without = skillLadders(reads, VOCABULARY_V0, TODAY);
    for (const skill of ['interval-reading', 'sight-reading']) {
      expect(withLegacy.get(skill)?.state, `${skill}: two supporting first readings on two days`).toBe('proficient');
      expect(withLegacy.get(skill)).toEqual(without.get(skill));
    }
    // One read against it, then another: it moves down exactly as without.
    const later = [...reads, readRow(daysAfter(MIGRATED_ON, 8), { wrong: [1, 3, 5, 7] }), readRow(daysAfter(MIGRATED_ON, 9), { wrong: [1, 3, 5, 7] })];
    expect(skillLadders(later, VOCABULARY_V0, TODAY, exposures).get('interval-reading')).toEqual(
      skillLadders(later, VOCABULARY_V0, TODAY).get('interval-reading'),
    );
    expect(skillLadders(later, VOCABULARY_V0, TODAY, exposures).get('interval-reading')?.state).toBe('familiar');
  });

  it('runs once: a second pass changes nothing, however much later', async () => {
    await seedLegacy();
    expect(await migrateLegacySkills(MIGRATED_ON)).toBe(LEGACY.length);
    const after = await storeRows();
    expect(await migrateLegacySkills(new Date('2026-12-01T09:00:00.000Z'))).toBe(0);
    expect(await storeRows()).toEqual(after);
    expect(await learnerExposures(CURRICULUM, {}, new Date('2026-12-01T09:00:00.000Z'))).toEqual(
      await learnerExposures(CURRICULUM, {}, MIGRATED_ON),
    );
  });
});
