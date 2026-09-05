/**
 * How much of the phone the app is using, and whether it is allowed to check
 * for updates (docs/04 §7 Content, §7b Diagnostics).
 *
 * In `util/` rather than on the Settings screen because Diagnostics reports
 * the same numbers and `main.ts` reads the offline-only switch before any
 * screen exists — a screen module in the entry bundle would drag the whole of
 * Settings into the first parse.
 */
import { allImports } from '../data/importStore';

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
  const rows = await allImports();
  const importBytes = rows.reduce(
    (sum, row) => sum + (typeof row.data === 'string' ? row.data.length : row.data.byteLength),
    0,
  );
  return {
    usageBytes: estimate.usage ?? 0,
    quotaBytes: estimate.quota ?? 0,
    precached,
    imports: rows.length,
    importBytes,
  };
}
