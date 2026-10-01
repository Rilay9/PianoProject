/**
 * A performance is found however far back it is (CL23, L53; `DB_VERSION` 10).
 *
 * `recentPerformances` walked the store newest first and gave up after 2,200 rows — the old cap
 * (2,000) and its slack (200), kept as a scan limit after C1 moved the cap to 25,000 runs. A
 * performance played more practice runs ago than that was kept and never listed: the Progress
 * screen said *No performances yet* over a history that had one.
 *
 * Version 10 gives a performance row an indexable marker (`performanceMark: 1`, never the boolean
 * itself, which IndexedDB cannot key) and an index over it and the date (`byPerformance`), so the
 * reader walks the performances alone. The upgrade backfills the marker on the rows already
 * there; `recordRun` writes it on every new performance; a restored backup derives it on the way
 * in (`backup.test.ts`). This file is the version 9 → 10 upgrade (the per-version shape of
 * `projectLifecycle.test.ts`) and the reach itself.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { DB_VERSION, openDatabase, resetDatabaseForTest, type SessionRow } from '../../src/data/db';
import { recentPerformances, recordRun, resetProgressForTest, sessionsTidied, type RunResult } from '../../src/data/progressStore';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

/** The old reach: the cap before C1 (2,000) and its slack (200). A performance further back was not listed. */
const OLD_REACH = 2_200;
/** Ordinary runs played after the performance: more than the old reach, so the old walk gave up before it. */
const LATER_RUNS = OLD_REACH + 100;

const DAY_MS = 86_400_000;
const PERFORMED_AT = '2025-01-10T18:00:00.000Z';

function practice(at: string, index: number): SessionRow {
  return {
    itemId: `drill.scales.${String(index % 7)}`,
    mode: 'tempo',
    tempoPct: 100,
    accuracy: 0.9,
    accuracyEstimated: false,
    wrongNotes: 1,
    missed: 0,
    durationMs: 60_000,
    at,
  };
}

/** `count` ordinary runs, one an hour from `from`, written straight to the store in one transaction. */
async function addPractice(from: Date, count: number): Promise<void> {
  const db = await openDatabase();
  if (!db) throw new Error('the fake database did not open');
  const tx = db.transaction('sessions', 'readwrite');
  for (let i = 0; i < count; i += 1) await tx.store.add(practice(new Date(from.getTime() + i * 3_600_000).toISOString(), i));
  await tx.done;
}

const PERFORMED: RunResult = {
  itemId: 'song.recital',
  mode: 'tempo',
  tempoPct: 100,
  accuracy: 0.92,
  accuracyEstimated: false,
  wrongNotes: 2,
  missed: 1,
  durationMs: 180_000,
  passed: true,
  masterEligible: false,
  performance: true,
};

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
});
afterEach(() => {
  clearFakeIndexedDb();
  resetProgressForTest();
});

describe('the version 10 upgrade', () => {
  it('a version-9 database opens at version 10: its performance marked, every other row as it was, and the performance listed past the old reach', async () => {
    // Version 9's schema, as `db.ts` made it.
    const old = await openDB('pianopath', 9, {
      upgrade(database) {
        database.createObjectStore('settings');
        database.createObjectStore('progress', { keyPath: 'itemId' });
        const sessions = database.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessions.createIndex('byItem', 'itemId');
        sessions.createIndex('byDate', 'at');
        database.createObjectStore('imports', { keyPath: 'id' });
        database.createObjectStore('plan', { keyPath: 'id' });
        database.createObjectStore('streak', { keyPath: 'id' });
        database.createObjectStore('micCalibration');
        database.createObjectStore('skills', { keyPath: 'conceptId' });
        database.createObjectStore('levelOverrides', { keyPath: 'itemId' });
        database.createObjectStore('folderLibraries', { keyPath: 'id' });
        database.createObjectStore('books', { keyPath: 'id' });
        const scores = database.createObjectStore('folderScores', { keyPath: ['folder', 'file'] });
        scores.createIndex('byTitle', ['folder', 'sort']);
        database.createObjectStore('folderIndexes', { keyPath: 'id' });
        const encounters = database.createObjectStore('encounters', { keyPath: 'id' });
        encounters.createIndex('byKey', 'key');
        encounters.createIndex('byItem', 'itemId');
        database.createObjectStore('contacts', { keyPath: 'key' });
        const projects = database.createObjectStore('projects', { keyPath: 'id' });
        projects.createIndex('byItem', 'itemId');
      },
    });
    // The performance as version 9 stored it — the boolean, nothing else — and then more ordinary
    // practice than the old walk reached, and a later run that was not a performance though it was
    // played well (`performance` absent, as `recordRun` writes it).
    const performedKey = await old.add('sessions', { ...practice(PERFORMED_AT, 0), itemId: 'song.recital', performance: true });
    const tx = old.transaction('sessions', 'readwrite');
    for (let i = 0; i < LATER_RUNS; i += 1) await tx.store.add(practice(new Date(Date.parse(PERFORMED_AT) + (i + 1) * 3_600_000).toISOString(), i));
    await tx.done;
    await old.put('progress', { itemId: 'song.recital', status: 'passed', bestAccuracy: 0.92, bestTempoPct: 100, attempts: 1, lastPracticedAt: PERFORMED_AT, minutes: 3, passedOn: ['2025-01-10'] });
    const before = { rows: (await old.getAll('sessions')) as SessionRow[], keys: await old.getAllKeys('sessions') };
    old.close();
    resetDatabaseForTest();

    const db = await openDatabase();
    expect(DB_VERSION).toBeGreaterThanOrEqual(10);
    expect(db?.version).toBe(DB_VERSION);
    expect([...(db?.transaction('sessions').store.indexNames ?? [])].sort()).toEqual(['byDate', 'byItem', 'byPerformance']);

    // The performance gained its marker and nothing else; every other row and every key is as it was.
    const after = { rows: (await db?.getAll('sessions')) ?? [], keys: await db?.getAllKeys('sessions') };
    expect(after.keys, 'a key changed in the upgrade').toEqual(before.keys);
    const expected = before.rows.map((row) => (row.id === performedKey ? { ...row, performanceMark: 1 } : row));
    expect(after.rows, 'a row changed in the upgrade beyond the performance marker').toEqual(expected);

    // And the screen's question finds it, behind more runs than the old walk looked at.
    const performed = await recentPerformances(20);
    expect(performed.map((row) => row.id), 'the performance behind the old reach was not listed').toEqual([performedKey]);
  });

  it('a fresh database has the index and nothing to backfill', async () => {
    const db = await openDatabase();
    expect(db?.version).toBe(DB_VERSION);
    expect([...(db?.transaction('sessions').store.indexNames ?? [])].sort()).toEqual(['byDate', 'byItem', 'byPerformance']);
    expect(await recentPerformances(20)).toEqual([]);
  });
});

describe('the reach', () => {
  it('finds a performance with more runs after it than the old walk looked at, newest first, the limit kept', async () => {
    const first = new Date('2025-03-01T18:00:00.000Z');
    await recordRun(PERFORMED, first);
    await sessionsTidied();
    await addPractice(new Date(first.getTime() + DAY_MS), LATER_RUNS);
    const second = new Date(first.getTime() + 200 * DAY_MS);
    await recordRun({ ...PERFORMED, itemId: 'song.encore' }, second);
    await sessionsTidied();
    const third = new Date(second.getTime() + DAY_MS);
    await recordRun({ ...PERFORMED, itemId: 'song.finale' }, third);
    await sessionsTidied();

    const performed = await recentPerformances(20);
    expect(performed.map((row) => row.itemId), 'the performance behind the old reach was not listed').toEqual(['song.finale', 'song.encore', 'song.recital']);
    expect(performed.every((row) => row.performance === true)).toBe(true);
    expect((await recentPerformances(2)).map((row) => row.itemId)).toEqual(['song.finale', 'song.encore']);
  });

  it('marks a performance when it is recorded, and only a performance', async () => {
    await recordRun(PERFORMED, new Date('2026-09-01T18:00:00.000Z'));
    await recordRun({ ...PERFORMED, itemId: 'song.practised', performance: false }, new Date('2026-09-02T18:00:00.000Z'));
    await sessionsTidied();
    const db = await openDatabase();
    const rows = (await db?.getAll('sessions')) ?? [];
    expect(rows.find((row) => row.itemId === 'song.recital')).toMatchObject({ performance: true, performanceMark: 1 });
    const practised = rows.find((row) => row.itemId === 'song.practised');
    expect(practised?.performance).toBeUndefined();
    expect(practised && 'performanceMark' in practised, 'a run that was not a performance carries the marker').toBe(false);
  });
});
