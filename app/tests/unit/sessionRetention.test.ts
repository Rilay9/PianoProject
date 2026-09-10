/**
 * The `sessions` store must not grow without limit.
 *
 * The fault: `db.ts` creates it with `autoIncrement` and nothing anywhere
 * removed a row, so every practice run appended one for ever. Daily use for a
 * year is thousands of rows on a phone, and `recentSessions` reads all of them
 * and sorts the lot to hand back fifty. The owner asked whether the log grows
 * for ever; `renderTiming` (a 200-entry ring) and `errorLog` (50 distinct
 * errors) were already bounded and this was not.
 *
 * Every test here fails against a store with no retention rule: the first two
 * on the count, the third on which rows survived, the fourth on the promise
 * that a bound cannot cost the owner anything they can see.
 */
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import {
  MAX_SESSIONS,
  pruneSessions,
  recentSessions,
  recordRun,
  resetProgressForTest,
  sessionCount,
  type RunResult,
} from '../../src/data/progressStore';
import { openDatabase } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const RUN: RunResult = {
  itemId: 'song.folk.hot-cross-buns',
  mode: 'wait',
  tempoPct: 100,
  accuracy: 0.95,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 60_000,
  passed: true,
  masterEligible: false,
};

/** `n` sessions, one a day going back from 2026-09-10, oldest written first. */
async function seed(n: number): Promise<void> {
  const db = await openDatabase();
  if (!db) throw new Error('the fake database did not open');
  const tx = db.transaction('sessions', 'readwrite');
  for (let i = n - 1; i >= 0; i -= 1) {
    const at = new Date(Date.UTC(2026, 8, 10) - i * 86_400_000).toISOString();
    await tx.store.add({
      itemId: `song.day-${String(n - i)}`,
      mode: 'wait',
      tempoPct: 100,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 1_000,
      at,
    });
  }
  await tx.done;
}

describe('the sessions store is bounded', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
  });

  it('leaves a store under the cap alone', async () => {
    await seed(50);
    expect(await pruneSessions()).toBe(0);
    expect(await sessionCount()).toBe(50);
  });

  it('brings a store over the cap back down to it', async () => {
    // The cap plus its slack plus one: the first size at which pruning is due.
    const over = MAX_SESSIONS + 201;
    await seed(over);
    expect(await sessionCount()).toBe(over);
    const dropped = await pruneSessions();
    expect(dropped).toBe(over - MAX_SESSIONS);
    expect(await sessionCount()).toBe(MAX_SESSIONS);
  });

  it('drops the oldest, never the newest', async () => {
    // A small cap and no slack so the arithmetic is readable; the rule is the
    // same one. The slack exists so that a phone does not walk a cursor after
    // every single run, not to change which rows survive.
    await seed(30);
    await pruneSessions(4, 0);
    const kept = await recentSessions(100);
    expect(kept).toHaveLength(4);
    // Seeded oldest-first as `song.day-1` … `song.day-30`, so the survivors
    // are the last four, newest first.
    expect(kept.map((row) => row.itemId)).toEqual([
      'song.day-30',
      'song.day-29',
      'song.day-28',
      'song.day-27',
    ]);
  });

  it('keeps more than any screen reads, so the bound is invisible', () => {
    // The deepest reader is the Progress screen at 100 and the drill host at
    // 60. A cap anywhere near those would quietly change what the owner sees.
    expect(MAX_SESSIONS).toBeGreaterThan(1_000);
  });

  it('recording a run prunes without being asked', async () => {
    await seed(MAX_SESSIONS + 300);
    await recordRun(RUN, new Date('2026-09-10T12:00:00.000Z'));
    // `recordRun` does not await the prune — the learner is looking at a
    // summary — so let its microtasks run, then ask for the same tidy-up the
    // run asked for. Either one alone is enough; both is what a phone does.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await pruneSessions();
    expect(await sessionCount()).toBeLessThanOrEqual(MAX_SESSIONS);
  });

  it('says nothing and breaks nothing when there is no database at all', async () => {
    clearFakeIndexedDb();
    expect(await pruneSessions()).toBe(0);
    expect(await sessionCount()).toBe(0);
  });
});
