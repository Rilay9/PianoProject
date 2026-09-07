// @vitest-environment jsdom
/**
 * Every version of the database this app has ever shipped, upgraded (P19 §C3).
 *
 * `shelf.test.ts` covers version 3, which is the one the owner's phone
 * actually has. This covers the rest, because the upgrade blocks are guarded
 * on `oldVersion` and a phone that skipped a version takes a path nobody
 * walked: version 1 to 5 runs four blocks in one transaction, and version 4 to
 * 5 runs one. Neither had a test.
 *
 * The rows are the ones that would be lost, not the stores that would be
 * missing: a missing store fails loudly on the first read, and a lost row
 * fails a year later.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { DB_VERSION, STORE_NAMES, openDatabase, resetDatabaseForTest } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

/** The stores each version had, in the order `db.ts` created them. */
const STORES_BY_VERSION: Record<number, string[]> = {
  1: [
    'settings',
    'progress',
    'sessions',
    'imports',
    'plan',
    'streak',
    'micCalibration',
    'skills',
  ],
  2: ['levelOverrides'],
  3: ['folderLibraries'],
  4: [],
  5: ['books'],
};

function storesUpTo(version: number): string[] {
  return Object.entries(STORES_BY_VERSION)
    .filter(([at]) => Number(at) <= version)
    .flatMap(([, stores]) => stores);
}

/** A database as an older release of the app left it, with a row in every store. */
async function openAtVersion(version: number): Promise<void> {
  const stores = storesUpTo(version);
  const db = await openDB('pianopath', version, {
    upgrade(database) {
      for (const name of stores) {
        if (name === 'sessions') {
          const sessions = database.createObjectStore('sessions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          sessions.createIndex('byItem', 'itemId');
          sessions.createIndex('byDate', 'at');
        } else if (name === 'settings' || name === 'micCalibration') {
          database.createObjectStore(name);
        } else if (name === 'progress') {
          database.createObjectStore('progress', { keyPath: 'itemId' });
        } else if (name === 'skills') {
          database.createObjectStore('skills', { keyPath: 'conceptId' });
        } else if (name === 'levelOverrides') {
          database.createObjectStore('levelOverrides', { keyPath: 'itemId' });
        } else {
          database.createObjectStore(name, { keyPath: 'id' });
        }
      }
    },
  });

  await db.put('settings', '{"zoom":1.25}', 'pianopath.settings');
  await db.put('progress', {
    itemId: 'song.kept',
    status: 'mastered',
    bestAccuracy: 0.97,
    bestTempoPct: 1,
    attempts: 12,
    lastPracticedAt: '2026-08-01T00:00:00.000Z',
    minutes: 300,
    passedOn: ['2026-07-30', '2026-08-01'],
  });
  await db.add('sessions', { itemId: 'song.kept', at: '2026-08-01T00:00:00.000Z', accuracy: 0.9 });
  await db.put('imports', {
    id: 'import.kept',
    kind: 'musicxml',
    title: 'Kept',
    data: '<score-partwise/>',
    tags: ['Someone'],
    addedAt: '2026-07-01T00:00:00.000Z',
    level: 4,
  });
  await db.put('plan', { id: 'current', stage: 2, unitId: '2.1', trackOrder: ['core', 'blues'] });
  await db.put('streak', { id: 'streak', minutesByDay: { '2026-08-01': 30 }, weeklyGoalMinutes: 150 });
  await db.put('micCalibration', { latencyMs: 40 }, 'device-1');
  await db.put('skills', { conceptId: 'scale', state: 'learning' });
  if (stores.includes('levelOverrides')) {
    await db.put('levelOverrides', { itemId: 'song.kept', level: 5.5 });
  }
  if (stores.includes('folderLibraries')) {
    await db.put('folderLibraries', { id: 'Mine', addedAt: '2026-08-01', source: null, scores: [] });
  }
  if (stores.includes('books')) {
    await db.put('books', { id: 'book.mine', title: 'Mine', pieces: [] });
  }
  db.close();
}

describe('upgrading from every version that has shipped', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  for (const from of [1, 2, 3, 4, 5]) {
    it(`from version ${String(from)} keeps every row and ends with every store`, async () => {
      await openAtVersion(from);
      resetDatabaseForTest();

      const db = await openDatabase();
      expect(db?.version).toBe(DB_VERSION);
      // Every store the app expects, whichever version it came from.
      for (const name of STORE_NAMES) {
        expect([...(db?.objectStoreNames ?? [])], `${name} after ${String(from)}`).toContain(name);
      }

      // The rows that were there.
      expect((await db?.get('progress', 'song.kept'))?.attempts).toBe(12);
      expect((await db?.get('imports', 'import.kept'))?.title).toBe('Kept');
      expect((await db?.get('plan', 'current'))?.trackOrder).toEqual(['core', 'blues']);
      expect(await db?.get('settings', 'pianopath.settings')).toBe('{"zoom":1.25}');
      expect((await db?.getAll('sessions'))?.length).toBe(1);
      expect((await db?.get('skills', 'scale'))?.state).toBe('learning');

      // P15's migration, on every path that passes version 4: a level typed
      // before P15 was the owner's own number, and printing it later as an
      // estimate would call his judgement a guess.
      const imported = await db?.get('imports', 'import.kept');
      if (from < 4) expect(imported?.levelSource).toBe('judged');

      clearFakeIndexedDb();
    });
  }

  it('a fresh database runs no migration and still has everything', async () => {
    const db = await openDatabase();
    expect(db?.version).toBe(DB_VERSION);
    for (const name of STORE_NAMES) {
      expect([...(db?.objectStoreNames ?? [])]).toContain(name);
    }
    clearFakeIndexedDb();
  });
});
