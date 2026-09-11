/**
 * How much of the phone the app is using, and whether it is allowed to check
 * for updates (docs/04 §7 Content, §7b Diagnostics).
 *
 * In `util/` rather than on the Settings screen because Diagnostics reports
 * the same numbers and `main.ts` reads the offline-only switch before any
 * screen exists — a screen module in the entry bundle would drag the whole of
 * Settings into the first parse.
 */
import { importSummaries } from '../data/importStore';
import { MAX_SESSIONS, sessionCount } from '../data/progressStore';

/** docs/04 §7: "offline only [off]" — stops the app checking for updates. */
export const OFFLINE_ONLY_KEY = 'pianopath.offlineOnly';

export function isOfflineOnly(): boolean {
  try {
    return localStorage.getItem(OFFLINE_ONLY_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOfflineOnly(value: boolean): void {
  try {
    localStorage.setItem(OFFLINE_ONLY_KEY, value ? '1' : '0');
  } catch {
    // Blocked storage: the app checks for updates, which is the safe default.
  }
}

export interface StorageBreakdown {
  usageBytes: number;
  quotaBytes: number;
  /** Entries across every Cache Storage bucket, precache included. */
  precached: number;
  imports: number;
  importBytes: number;
  /**
   * Practice sessions stored, and the cap they are held to.
   *
   * Here because the owner asked whether the log grows for ever and this was
   * the one store with no answer: `renderTiming` keeps a 200-entry ring and
   * `errorLog` stops at 50 distinct errors, and `sessions` simply appended a
   * row per run. It has a retention rule now, and a number nobody can see is
   * a rule nobody can check.
   */
  sessions: number;
  sessionCap: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} kB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

export async function measureStorage(): Promise<StorageBreakdown> {
  const estimate = (await navigator.storage?.estimate?.()) ?? {};
  let precached = 0;
  if (typeof caches !== 'undefined') {
    try {
      for (const name of await caches.keys()) {
        precached += (await (await caches.open(name)).keys()).length;
      }
    } catch {
      // Cache Storage can be unavailable; the number is then simply unknown.
    }
  }
  // Summaries, not the files.
  //
  // This used to be `allImports()`, which loads every stored score and PDF out
  // of IndexedDB purely to add up their sizes — on the mount of the one screen
  // the owner opens *because* storage is tight. The line above it uses
  // `db.count()` and explains in a comment why that is the right shape; this
  // line did the opposite. Summaries are read once per write and shared, and
  // they carry `bytes`, which is recorded at import time and is real bytes
  // rather than `String.length`'s UTF-16 code units — the total sits beside
  // `navigator.storage.estimate()` on the screen, and that one is in bytes.
  const [rows, sessions] = await Promise.all([importSummaries(), sessionCount()]);
  const importBytes = rows.reduce((sum, row) => sum + (row.bytes ?? 0), 0);
  return {
    usageBytes: estimate.usage ?? 0,
    quotaBytes: estimate.quota ?? 0,
    precached,
    imports: rows.length,
    importBytes,
    sessions,
    sessionCap: MAX_SESSIONS,
  };
}
