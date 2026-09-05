/**
 * Settings live in IndexedDB (docs/01 §4.5) but are read synchronously.
 *
 * Those two facts fight each other: IndexedDB is asynchronous, and
 * `getSettings()` is called from inside a render pass in a dozen places. So
 * the arrangement is a write-through cache — localStorage is the synchronous
 * read path, IndexedDB is the store of record:
 *
 *   - every write goes to both, through `persistLocal`;
 *   - on startup `hydratePersisted()` reconciles them: localStorage wins when
 *     it has a value (it is what the last session wrote), and IndexedDB fills
 *     it in when it does not — which is what makes an imported backup, or a
 *     browser that cleared localStorage but kept IndexedDB, come back;
 *   - export/import reads and writes IndexedDB, so a backup carries settings.
 *
 * `hydratePersisted` is awaited by `main.ts` before the shell mounts, so no
 * screen ever sees a half-migrated value.
 */
import { openDatabase } from './db';

/** localStorage keys that mirror rows of the IndexedDB `settings` store. */
export const MIRRORED_KEYS = [
  'pianopath.settings',
  'pianopath.midi',
  'pianopath.micCalibration',
  'pianopath.theme',
] as const;

export type MirroredKey = (typeof MIRRORED_KEYS)[number];

function localGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function localSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Blocked storage: the value holds for this session and no longer.
  }
}

/**
 * Writes a settings value to both stores.
 *
 * The IndexedDB half is fire-and-forget on purpose: the caller is a `set`
 * function returning synchronously to a click handler, and there is nothing
 * useful it could do with a rejected promise that the localStorage copy has
 * not already covered.
 */
export function persistLocal(key: MirroredKey, value: string): void {
  localSet(key, value);
  void openDatabase()
    .then((db) => db?.put('settings', value, key))
    .catch(() => undefined);
}

/**
 * Reconciles the two stores at startup. Returns the keys it restored from
 * IndexedDB, which is what the Diagnostics screen reports as a migration.
 */
export async function hydratePersisted(): Promise<MirroredKey[]> {
  const db = await openDatabase();
  if (!db) return [];
  const restored: MirroredKey[] = [];
  for (const key of MIRRORED_KEYS) {
    const local = localGet(key);
    if (local !== null) {
      // localStorage is what the last session wrote; make the database agree.
      const stored = await db.get('settings', key);
      if (stored !== local) await db.put('settings', local, key);
      continue;
    }
    const stored = await db.get('settings', key);
    if (typeof stored === 'string') {
      localSet(key, stored);
      restored.push(key);
    }
  }
  return restored;
}
