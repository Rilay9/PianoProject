/**
 * The settings mirror (docs/01 §4.5).
 *
 * IndexedDB is the store of record; localStorage is the synchronous read path.
 * The interesting case is the asymmetric one: localStorage cleared but the
 * database intact, which is what a restored backup and an Android "clear site
 * data but keep app storage" both look like.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { hydratePersisted, persistLocal } from '../../src/data/persist';
import { openDatabase } from '../../src/data/db';
import { useFakeIndexedDb } from './helpers/idb';

/** The unit tests run in Node, which has no localStorage. */
function installLocalStorage(seed: Record<string, string> = {}): Map<string, string> {
  const store = new Map(Object.entries(seed));
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  return store;
}

beforeEach(() => {
  useFakeIndexedDb();
  installLocalStorage();
});

describe('persistLocal', () => {
  it('writes both stores', async () => {
    const local = installLocalStorage();
    persistLocal('pianopath.theme', 'dark');
    expect(local.get('pianopath.theme')).toBe('dark');
    // The database half is fire-and-forget, so wait for it to land.
    const db = await openDatabase();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await db?.get('settings', 'pianopath.theme')).toBe('dark');
  });
});

describe('hydratePersisted', () => {
  it('restores the mirror from the database when localStorage is empty', async () => {
    const db = await openDatabase();
    await db?.put('settings', '{"zoom":1.75}', 'pianopath.settings');
    const local = installLocalStorage();

    const restored = await hydratePersisted();
    expect(restored).toEqual(['pianopath.settings']);
    expect(local.get('pianopath.settings')).toBe('{"zoom":1.75}');
  });

  it('lets localStorage win when both have a value — it is what the last session wrote', async () => {
    const db = await openDatabase();
    await db?.put('settings', 'stale', 'pianopath.theme');
    installLocalStorage({ 'pianopath.theme': 'light' });

    const restored = await hydratePersisted();
    expect(restored).toEqual([]);
    expect(await db?.get('settings', 'pianopath.theme')).toBe('light');
  });

  it('reports nothing and throws nothing when there is no database', async () => {
    const { clearFakeIndexedDb } = await import('./helpers/idb');
    clearFakeIndexedDb();
    await expect(hydratePersisted()).resolves.toEqual([]);
  });
});
