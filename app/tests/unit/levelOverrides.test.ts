/**
 * The owner's own difficulty numbers (replan §1.4).
 *
 * Two things have to hold, and neither is obvious from the store on its own:
 * an override has to reach *every* reader of a level — the Library, the swap
 * sheet, the session builder all go through `allItems()` — and it has to
 * survive a backup, because it is judgement the owner entered by hand and
 * nothing else in the app could reconstruct it.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyLevelOverrides,
  clearLevelOverride,
  levelOverrideCount,
  levelOverrideFor,
  loadLevelOverrides,
  resetLevelOverridesForTest,
  setLevelOverride,
} from '../../src/data/levelOverrides';
import { exportAll, importAll } from '../../src/data/backup';
import { openDatabase } from '../../src/data/db';
import type { CatalogItem } from '../../src/curriculum/types';
import { useFakeIndexedDb } from './helpers/idb';

beforeEach(() => {
  useFakeIndexedDb();
  resetLevelOverridesForTest();
});

function item(id: string, level: number, levelSource: 'judged' | 'estimated'): CatalogItem {
  return {
    id,
    type: 'song',
    title: id,
    level,
    levelSource,
    hands: 'both',
    tracks: ['classical'],
    concepts: [],
  };
}

describe('applyLevelOverrides', () => {
  it('leaves items alone when there is nothing to apply', () => {
    const items = [item('song.a', 7.1, 'estimated')];
    expect(applyLevelOverrides(items)).toBe(items);
  });

  it('replaces the level and marks the item judged', async () => {
    await setLevelOverride('song.a', 6.4);
    const applied = applyLevelOverrides([item('song.a', 7.1, 'estimated')]);
    expect(applied[0]?.level).toBe(6.4);
    // The owner playing it beats the estimate it replaced.
    expect(applied[0]?.levelSource).toBe('judged');
  });

  it('does not mutate the catalog it was given', async () => {
    await setLevelOverride('song.a', 6.4);
    const original = item('song.a', 7.1, 'estimated');
    applyLevelOverrides([original]);
    expect(original.level).toBe(7.1);
    expect(original.levelSource).toBe('estimated');
  });

  it('leaves items with no override untouched', async () => {
    await setLevelOverride('song.a', 6.4);
    const applied = applyLevelOverrides([
      item('song.a', 7.1, 'estimated'),
      item('song.b', 5.0, 'estimated'),
    ]);
    expect(applied[1]?.level).toBe(5.0);
    expect(applied[1]?.levelSource).toBe('estimated');
  });
});

describe('the store', () => {
  it('remembers a number across a reload', async () => {
    await setLevelOverride('song.a', 6.4);
    resetLevelOverridesForTest();
    expect(levelOverrideFor('song.a')).toBeUndefined();
    await loadLevelOverrides();
    expect(levelOverrideFor('song.a')).toBe(6.4);
  });

  it('clears one without touching the others', async () => {
    await setLevelOverride('song.a', 6.4);
    await setLevelOverride('song.b', 3.2);
    await clearLevelOverride('song.a');
    expect(levelOverrideFor('song.a')).toBeUndefined();
    expect(levelOverrideFor('song.b')).toBe(3.2);
    expect(levelOverrideCount()).toBe(1);
  });

  it('records when the decision was made', async () => {
    await setLevelOverride('song.a', 6.4, new Date('2026-09-06T12:00:00.000Z'));
    const db = await openDatabase();
    const row = await db?.get('levelOverrides', 'song.a');
    expect(row?.at).toBe('2026-09-06T12:00:00.000Z');
  });
});

describe('backup', () => {
  it('round-trips through export and import', async () => {
    await setLevelOverride('song.a', 6.4);
    await setLevelOverride('song.b', 8.8);
    const file = await exportAll();
    expect(file.stores.levelOverrides).toHaveLength(2);

    // A different phone: empty database, same backup file.
    useFakeIndexedDb();
    resetLevelOverridesForTest();
    await importAll(file);
    await loadLevelOverrides();

    expect(levelOverrideFor('song.a')).toBe(6.4);
    expect(levelOverrideFor('song.b')).toBe(8.8);
  });
});

describe('the version 2 migration', () => {
  it('opens a database that was created at version 1', async () => {
    // The store has to appear on a phone that has been on version 1 since P7,
    // without the rows it already had going anywhere.
    const db = await openDatabase();
    expect(db).not.toBeNull();
    await db?.put('progress', {
      itemId: 'song.a',
      status: 'passed',
      bestAccuracy: 0.9,
      bestTempoPct: 100,
      attempts: 3,
      lastPracticedAt: '2026-09-01T10:00:00.000Z',
      minutes: 12,
      passedOn: ['2026-09-01'],
    });
    await setLevelOverride('song.a', 5.5);
    expect((await db?.get('progress', 'song.a'))?.attempts).toBe(3);
    expect((await db?.get('levelOverrides', 'song.a'))?.level).toBe(5.5);
  });
});
