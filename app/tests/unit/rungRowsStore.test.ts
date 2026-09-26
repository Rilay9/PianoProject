/**
 * The rows the rung state is derived from, as the store hands them over (C5:
 * `progressStore.rungRows`).
 *
 * Every stored run, without its per-step detail (the bulk of a row, which no
 * requirement reads), read once and kept current by the writes that follow, so
 * Plan, Today and the lesson page share one reading of the store rather than
 * each walking it. On a real (fake) IndexedDB, because the cursor is the part
 * worth testing.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  recordRun,
  resetProgressForTest,
  rungRows,
  forgetCachedProgress,
  replaceSessionEvidence,
  sessionsForItem,
  type RunResult,
} from '../../src/data/progressStore';
import { EVIDENCE_DEFINITIONS } from '../../src/evidence/evidence';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const RUN: RunResult = {
  itemId: 'song.folk.hot-cross-buns',
  lessonId: '1.1',
  mode: 'tempo',
  tempoPct: 100,
  tempoMeasured: true,
  accuracy: 1,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 60_000,
  passed: true,
  masterEligible: false,
  steps: { from: 0, codes: 'hhhh', measures: [0, 0], wrong: [], early: [], timing: [0, 10, 1, -5, 2, 3, 3, 0] },
};

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
});
afterEach(() => clearFakeIndexedDb());

describe('rungRows', () => {
  it('hands back every stored run with the rung that judged it, and without its per-step detail', async () => {
    await recordRun(RUN, new Date('2026-10-01T10:00:00Z'));
    await recordRun({ ...RUN, itemId: 'exercise.five-finger.c-major.right' }, new Date('2026-10-01T10:05:00Z'));
    forgetCachedProgress();
    const rows = await rungRows();
    expect(rows.map((row) => [row.itemId, row.lessonId])).toEqual([
      ['song.folk.hot-cross-buns', '1.1'],
      ['exercise.five-finger.c-major.right', '1.1'],
    ]);
    expect(rows.every((row) => row.steps === undefined && typeof row.id === 'number')).toBe(true);
    expect(rows[0]?.accuracy).toBe(1);
  });

  it('a run recorded after the first reading is in the next one, without walking the store again', async () => {
    await recordRun(RUN, new Date('2026-10-01T10:00:00Z'));
    const first = await rungRows();
    expect(first).toHaveLength(1);
    await recordRun({ ...RUN, lessonId: '1.2' }, new Date('2026-10-02T10:00:00Z'));
    const second = await rungRows();
    expect(second.map((row) => row.lessonId)).toEqual(['1.1', '1.2']);
  });
});

// Added (C5, found in the pictures): the evidence job writes what it found
// onto the stored row through `replaceSessionEvidence`. On the real store the
// write handed IndexedDB a key beside a row that carries its own, which it
// refuses, so in the browser the job wrote nothing and its report said
// "0 up to date" over a row it had not been able to mark. The job's own test
// hands it a store of its own, which is why only a real (fake) IndexedDB shows it.
describe('the evidence job’s write', () => {
  it('lands on the stored row, and the rows the rung state reads see it', async () => {
    await recordRun(RUN, new Date('2026-10-01T10:00:00Z'));
    const [row] = await rungRows();
    const excluded = { definitions: EVIDENCE_DEFINITIONS, excluded: 'no-steps' as const };
    await replaceSessionEvidence(row?.id as number, { evidenceRecompute: excluded });
    const [stored] = await sessionsForItem(RUN.itemId);
    expect(stored?.evidenceRecompute).toEqual(excluded);
    expect(stored?.steps, 'the write lost the per-step detail').toEqual(RUN.steps);
    expect((await rungRows())[0]?.evidenceRecompute).toEqual(excluded);
    forgetCachedProgress();
    expect((await rungRows())[0]?.evidenceRecompute).toEqual(excluded);
  });
});
