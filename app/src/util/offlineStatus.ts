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
  /** A new version is installed and waiting for the page to be reloaded. */
  updateWaiting: boolean;
}

const MISSING_SHOWN = 25;
/** How many cache lookups are in flight at once; see `precacheReport`. */
const LOOKUP_BATCH = 32;
const LAST_CHECK_KEY = 'pianopath.lastUpdateCheck';

/**
 * Records that an update check *happened*.
 *
 * MUST be called only after a check that actually reached the server — that
 * is, from the resolution of `registration.update()`. It used to be called on
 * the line after `registerSW()` returned, unconditionally, so on a phone that
 * had been off the network for a month Diagnostics' "Last update check" read
 * "a moment ago": the one line whose whole purpose is to say how stale the app
 * might be reported the time the app was *opened* instead (`main.ts`).
 */
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

/**
 * What the service worker is actually doing, and whether one is waiting.
 *
 * The old version of this read `navigator.serviceWorker.controller` and
 * nothing else, so it printed **"registered but not controlling"** in two
 * cases that could not be less alike: a worker that has installed and is one
 * reload away from taking over, and *no worker at all* — a failed
 * registration, a build served from a path the scope does not cover, a browser
 * that refused it. The second is "this app does not work offline", which is
 * the single thing this whole screen exists to answer, and it was being
 * reported as a detail of a worker that was not there.
 *
 * `getRegistration()` is what tells them apart, and it is also the only way to
 * see a **waiting** worker: an update that has installed and is held back
 * until the page is reloaded (`00` D20 — never swapped in mid-practice). If
 * the learner taps *Later* on the toast, or "offline only" suppressed it, that
 * worker waits with nothing anywhere saying so.
 */
async function serviceWorkerState(): Promise<{ text: string; updateWaiting: boolean }> {
  if (!('serviceWorker' in navigator)) return { text: 'not supported', updateWaiting: false };
  let registration: ServiceWorkerRegistration | undefined;
  try {
    registration = await navigator.serviceWorker.getRegistration();
  } catch {
    registration = undefined;
  }
  const controller = navigator.serviceWorker.controller;
  if (!registration) {
    return {
      // A controller with no registration is a page being served by a worker
      // that has since been unregistered; it still works until the next load.
      text: controller
        ? `controlling (${controller.state}), but no registration — unregistered since this page loaded`
        : 'not registered — this app will not work offline',
      updateWaiting: false,
    };
  }
  const updateWaiting = registration.waiting !== null;
  const waitingNote = updateWaiting ? ' · a new version is waiting; reload to apply it' : '';
  if (controller) return { text: `controlling (${controller.state})${waitingNote}`, updateWaiting };
  const installing = registration.installing ?? registration.active;
  return {
    text: `registered, not yet controlling (${installing?.state ?? 'no worker'})${waitingNote}`,
    updateWaiting,
  };
}

/**
 * Checks every catalog file against the caches.
 *
 * `caches.match` rather than a fetch: a fetch would succeed over the network
 * and hide exactly the problem being looked for.
 */
export async function precacheReport(): Promise<PrecacheReport> {
  const worker = await serviceWorkerState();
  const base: PrecacheReport = {
    cached: 0,
    total: 0,
    missing: [],
    bytes: 0,
    serviceWorker: worker.text,
    online: navigator.onLine,
    lastUpdateCheck: lastUpdateCheck(),
    updateWaiting: worker.updateWaiting,
  };
  if (typeof caches === 'undefined') return base;

  const items = await allItems();
  const files = [
    'catalog.json',
    'curriculum.json',
    ...items.map((item) => item.file).filter((file): file is string => Boolean(file)),
  ];
  base.total = files.length;

  /**
   * `ignoreSearch`, or every single file reads as missing.
   *
   * Workbox precaches a revisioned entry under the URL *plus*
   * `?__WB_REVISION__=<hash>`, and every content file is revisioned — they are
   * not hashed in their names, the way the built assets are. An exact match
   * therefore missed all 1,258 of them, and Diagnostics told the owner
   * "precached 0 of 1258" on a phone whose storage held 1,413 cache entries
   * and which had just run the whole app offline. The service worker was
   * right; this check was asking the wrong question.
   */
  const lookup = async (file: string): Promise<number | null> => {
    try {
      const hit = await caches.match(contentUrl(file), { ignoreSearch: true });
      if (!hit) return null;
      const length = Number(hit.headers.get('content-length') ?? '0');
      return Number.isFinite(length) ? length : 0;
    } catch {
      return null;
    }
  };

  // In batches, not one at a time. Each `caches.match` is a round trip to the
  // browser's cache storage, and awaiting 1,258 of them in series is 1,258
  // serialised round trips before Diagnostics can print a single line — on
  // the screen the owner opens *because* something is wrong. The batch is
  // bounded rather than unbounded because 1,258 concurrent cache reads is its
  // own way of stalling the phone, and the results are walked back in file
  // order afterwards so the named `missing` files are still the first ones.
  for (let start = 0; start < files.length; start += LOOKUP_BATCH) {
    const batch = files.slice(start, start + LOOKUP_BATCH);
    const sizes = await Promise.all(batch.map(lookup));
    for (const [index, size] of sizes.entries()) {
      const file = batch[index];
      if (file === undefined) continue;
      if (size === null) {
        if (base.missing.length < MISSING_SHOWN) base.missing.push(file);
      } else {
        base.cached += 1;
        base.bytes += size;
      }
    }
  }
  return base;
}
