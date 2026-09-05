/**
 * What the offline story actually looks like on this device (docs/04 §7b,
 * `00` D20).
 *
 * The failure this exists to catch is a *silent* one: Workbox skips a file
 * larger than its limit without an error, so the app works perfectly until the
 * first time it is opened with no network and the soundfont is missing. So the
 * number that matters is "n of m catalog files cached", with the missing ones
 * named.
 */
import { allItems, contentUrl } from '../curriculum/load';

export interface PrecacheReport {
  cached: number;
  total: number;
  /** Up to `MISSING_SHOWN` paths, so the screen can name names. */
  missing: string[];
  bytes: number;
  serviceWorker: string;
  online: boolean;
  lastUpdateCheck: string | null;
}

const MISSING_SHOWN = 25;
const LAST_CHECK_KEY = 'pianopath.lastUpdateCheck';

export function noteUpdateCheck(now = new Date()): void {
  try {
    localStorage.setItem(LAST_CHECK_KEY, now.toISOString());
  } catch {
    // Not worth failing an update check over.
  }
}

export function lastUpdateCheck(): string | null {
  try {
    return localStorage.getItem(LAST_CHECK_KEY);
  } catch {
    return null;
  }
}

function serviceWorkerState(): string {
  if (!('serviceWorker' in navigator)) return 'not supported';
  const registration = navigator.serviceWorker.controller;
  return registration ? `controlling (${registration.state})` : 'registered but not controlling';
}

/**
 * Checks every catalog file against the caches.
 *
 * `caches.match` rather than a fetch: a fetch would succeed over the network
 * and hide exactly the problem being looked for.
 */
export async function precacheReport(): Promise<PrecacheReport> {
  const base: PrecacheReport = {
    cached: 0,
    total: 0,
    missing: [],
    bytes: 0,
    serviceWorker: serviceWorkerState(),
    online: navigator.onLine,
    lastUpdateCheck: lastUpdateCheck(),
  };
  if (typeof caches === 'undefined') return base;

  const items = await allItems();
  const files = [
    'catalog.json',
    'curriculum.json',
    ...items.map((item) => item.file).filter((file): file is string => Boolean(file)),
  ];
  base.total = files.length;

  for (const file of files) {
    const url = contentUrl(file);
    let hit: Response | undefined;
    try {
      hit = await caches.match(url);
    } catch {
      hit = undefined;
    }
    if (hit) {
      base.cached += 1;
      const length = Number(hit.headers.get('content-length') ?? '0');
      if (Number.isFinite(length)) base.bytes += length;
    } else if (base.missing.length < MISSING_SHOWN) {
      base.missing.push(file);
    }
  }
  return base;
}
