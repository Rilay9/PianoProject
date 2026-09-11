// @vitest-environment jsdom
/**
 * What Diagnostics is told about the offline story (docs/04 §7b, `00` D20).
 *
 * There was no test of this file at all, and it is the one place the owner can
 * find out whether the app will still work on a train. Three things it got
 * wrong, each only on the device:
 *
 * 1. **"registered but not controlling" was printed for a page with no service
 *    worker at all.** The check read `navigator.serviceWorker.controller` and
 *    nothing else, so a registration that had failed — a scope that does not
 *    cover the path, a browser that refused it — was reported as a detail of a
 *    worker that did not exist. "This app will not work offline" is the single
 *    question the screen exists to answer.
 * 2. **A waiting worker was invisible.** An update installs and is held back
 *    until the page is reloaded, deliberately; tap *Later* on the toast, or
 *    have "offline only" suppress it, and nothing anywhere said a new version
 *    was sitting there.
 * 3. **The cache check was 1,258 serialised round trips**, before Diagnostics
 *    could print its first line.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface CatalogItem {
  file: string | null;
}

const catalog = { items: [] as CatalogItem[] };

vi.mock('../../src/curriculum/load', () => ({
  allItems: () => Promise.resolve(catalog.items),
  contentUrl: (file: string) => `/PianoProject/content/${file}`,
}));

const { lastUpdateCheck, noteUpdateCheck, precacheReport } = await import(
  '../../src/util/offlineStatus'
);

interface WorkerShape {
  registration?: {
    waiting: unknown;
    installing: unknown;
    active: unknown;
  } | null;
  controller: { state: string } | null;
}

function withServiceWorker(shape: WorkerShape | null): void {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    writable: true,
    value:
      shape === null
        ? undefined
        : {
            controller: shape.controller,
            getRegistration: () => Promise.resolve(shape.registration ?? undefined),
            register: () => Promise.resolve(shape.registration ?? undefined),
            addEventListener: () => undefined,
          },
  });
  if (shape === null) delete (navigator as unknown as Record<string, unknown>).serviceWorker;
}

/** A `caches` that answers for `present` and records how many are in flight. */
function withCaches(present: (file: string) => boolean) {
  const stats = { calls: 0, inFlight: 0, maxInFlight: 0 };
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    writable: true,
    value: {
      match: async (url: string, options?: CacheQueryOptions) => {
        stats.calls += 1;
        stats.inFlight += 1;
        stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);
        // Every content file is revisioned, so a caller that does not pass
        // `ignoreSearch` is asking the wrong question (see the module).
        if (options?.ignoreSearch !== true) {
          stats.inFlight -= 1;
          return undefined;
        }
        await Promise.resolve();
        stats.inFlight -= 1;
        const file = url.replace('/PianoProject/content/', '');
        return present(file)
          ? ({ headers: { get: () => '100' } } as unknown as Response)
          : undefined;
      },
    },
  });
  return stats;
}

beforeEach(() => {
  localStorage.clear();
  catalog.items = [];
  withServiceWorker({ registration: null, controller: null });
  withCaches(() => false);
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the service-worker line', () => {
  it('says the app will not work offline when nothing is registered', async () => {
    withServiceWorker({ registration: null, controller: null });
    const report = await precacheReport();
    expect(report.serviceWorker).toBe('not registered — this app will not work offline');
    expect(report.serviceWorker).not.toContain('registered but not controlling');
    expect(report.updateWaiting).toBe(false);
  });

  it('distinguishes "installed, one reload away" from "not there"', async () => {
    withServiceWorker({
      registration: { waiting: null, installing: null, active: { state: 'activated' } },
      controller: null,
    });
    const report = await precacheReport();
    expect(report.serviceWorker).toBe('registered, not yet controlling (activated)');
    expect(report.updateWaiting).toBe(false);
  });

  it('reports a worker that is controlling the page', async () => {
    withServiceWorker({
      registration: { waiting: null, installing: null, active: { state: 'activated' } },
      controller: { state: 'activated' },
    });
    const report = await precacheReport();
    expect(report.serviceWorker).toBe('controlling (activated)');
  });

  it('says a new version is waiting, which nothing else on the phone does', async () => {
    withServiceWorker({
      registration: {
        waiting: { state: 'installed' },
        installing: null,
        active: { state: 'activated' },
      },
      controller: { state: 'activated' },
    });
    const report = await precacheReport();
    expect(report.updateWaiting).toBe(true);
    expect(report.serviceWorker).toContain('a new version is waiting');
  });

  it('says "not supported" where there is no service-worker API', async () => {
    withServiceWorker(null);
    const report = await precacheReport();
    expect(report.serviceWorker).toBe('not supported');
  });
});

describe('the last update check', () => {
  it('is null until a check has actually happened', async () => {
    expect(lastUpdateCheck()).toBeNull();
    expect((await precacheReport()).lastUpdateCheck).toBeNull();
  });

  it('records the moment it is told about', () => {
    noteUpdateCheck(new Date('2026-09-11T18:30:00.000Z'));
    expect(lastUpdateCheck()).toBe('2026-09-11T18:30:00.000Z');
  });
});

describe('the precache count', () => {
  it('counts what is cached, names what is missing, and adds up the bytes', async () => {
    catalog.items = [{ file: 'scores/a.mxl' }, { file: 'scores/b.mxl' }, { file: null }];
    const stats = withCaches((file) => file !== 'scores/b.mxl');
    const report = await precacheReport();
    // catalog.json, curriculum.json and the two files with a path.
    expect(report.total).toBe(4);
    expect(report.cached).toBe(3);
    expect(report.missing).toEqual(['scores/b.mxl']);
    expect(report.bytes).toBe(300);
    expect(stats.calls).toBe(4);
  });

  it('does not ask for the whole catalog one round trip at a time', async () => {
    catalog.items = Array.from({ length: 600 }, (_, i) => ({ file: `scores/s${String(i)}.mxl` }));
    const stats = withCaches(() => true);
    const report = await precacheReport();
    expect(report.cached).toBe(602);
    // The number itself is the batch size and not the point; one at a time is.
    expect(stats.maxInFlight).toBeGreaterThan(1);
  });

  it('names the missing files in catalog order, capped at 25', async () => {
    catalog.items = Array.from({ length: 200 }, (_, i) => ({ file: `scores/s${String(i)}.mxl` }));
    withCaches(() => false);
    const report = await precacheReport();
    expect(report.missing).toHaveLength(25);
    expect(report.missing[0]).toBe('catalog.json');
    expect(report.missing[1]).toBe('curriculum.json');
    expect(report.missing[2]).toBe('scores/s0.mxl');
    expect(report.missing[24]).toBe('scores/s22.mxl');
  });
});
