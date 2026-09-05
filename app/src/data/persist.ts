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
 * `main.ts` awaits `hydratePersisted()` before mounting the shell *when it
 * needs to* — see `needsHydration()`. A normal launch has the mirror already
 * populated and pays nothing; the launch that needs the database is the one
 * that waits for it.
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
 * Is any mirrored key missing from localStorage?
 *
 * Synchronous and cheap, and it decides whether the shell waits for
 * `hydratePersisted()` or lets it run in the background. Screens read their
 * settings once when they are built, so a value that arrives after the mount
 * shows up as a default in the controls — which is what a cleared
 * localStorage looked like before this check existed.
 */
export function needsHydration(): boolean {
  return MIRRORED_KEYS.some((key) => localGet(key) === null);
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
