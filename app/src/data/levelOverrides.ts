/**
 * The owner's own difficulty numbers (replan §1.4).
 *
 * Most of the library's levels were not judged piece by piece. The `[KERN]`
 * import bands a whole opus to one number, and P14's PDMX levelling will
 * compute one from features; both are honest estimates and both will be wrong
 * somewhere. `levelSource` makes the app say which it is showing — `≈ 7.1`
 * rather than `L7.1` — and this store is the other half of that bargain: an
 * estimate you can see is wrong should take one tap to fix.
 *
 * An override wins everywhere a level is read, because `allItems()` applies it
 * before anything downstream sees the item. It also makes the item count as
 * *judged*: the owner having played it is a better source than the estimate.
 *
 * Kept in memory as well as in IndexedDB, because `allItems()` is synchronous
 * once the catalog is loaded and the swap sheet and session builder call it on
 * every render. `loadLevelOverrides()` primes the cache at startup; before it
 * resolves the app simply shows the catalog's own numbers, which is the right
 * answer for a first launch and a harmless one for a second.
 */
import { openDatabase, type LevelOverrideRow } from './db';
import type { CatalogItem } from '../curriculum/types';

const listeners = new Set<() => void>();
let cache = new Map<string, LevelOverrideRow>();
let loaded = false;

export function onLevelOverridesChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** Reads every override into memory. Safe to call more than once. */
export async function loadLevelOverrides(): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    loaded = true;
    return;
  }
  const rows = await db.getAll('levelOverrides');
  cache = new Map(rows.map((row) => [row.itemId, row]));
  loaded = true;
  // A screen built before this resolved is showing catalog levels; telling the
  // listeners drops the merged index so the next read picks the owner's up.
  if (cache.size > 0) notify();
}

export function levelOverridesLoaded(): boolean {
  return loaded;
}

export function levelOverrideFor(itemId: string): number | undefined {
  return cache.get(itemId)?.level;
}

export function levelOverrideCount(): number {
  return cache.size;
}

/**
 * Applies the owner's numbers to a list of items.
 *
 * Returns new objects rather than mutating: the catalog array is shared and
 * cached, and a mutation would make the override permanent for the session
 * even after it was cleared.
 */
export function applyLevelOverrides(items: CatalogItem[]): CatalogItem[] {
  if (cache.size === 0) return items;
  return items.map((item) => {
    const override = cache.get(item.id);
    if (override === undefined) return item;
    // Re-levelled items are shown as judged (replan §1.4).
    return { ...item, level: override.level, levelSource: 'judged' as const };
  });
}

export async function setLevelOverride(
  itemId: string,
  level: number,
  now = new Date(),
): Promise<void> {
  const row: LevelOverrideRow = { itemId, level, at: now.toISOString() };
  cache.set(itemId, row);
  const db = await openDatabase();
  // The write can fail (no storage, quota); the session still gets the number.
  if (db) await db.put('levelOverrides', row);
  notify();
}

export async function clearLevelOverride(itemId: string): Promise<void> {
  cache.delete(itemId);
  const db = await openDatabase();
  if (db) await db.delete('levelOverrides', itemId);
  notify();
}

/** Test hook: forgets the cache so a fresh database is read. */
export function resetLevelOverridesForTest(): void {
  cache = new Map();
  loaded = false;
}
