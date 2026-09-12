// @vitest-environment jsdom
/**
 * Whether the browser has promised not to throw this app's storage away, and
 * whether the owner is ever told.
 *
 * Everything the app holds is local and has no copy anywhere: a year of
 * practice, the progress, the imported scores, the folder listing. IndexedDB
 * starts in **best-effort** mode, which means a device short of space is free
 * to evict the whole origin — and nothing in the app had ever asked for
 * anything better. `data/db.ts` now asks on the first open.
 *
 * Asking is half of it. An answer nobody can read is not an answer, so the
 * other half is that the sentence reaches the one screen the owner opens when
 * storage is tight, which is the screen that prints the usage figure. The same
 * line carries the other thing nobody could guess at: a second copy of the app
 * holding the database open at an older version, which is the state where the
 * app runs and saves nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';
import {
  BLOCKED_GIVE_UP_MS,
  DB_NAME,
  DB_VERSION,
  databaseBlock,
  openDatabase,
  persistenceState,
  resetDatabaseForTest,
} from '../../src/data/db';
import { durabilitySentence, type StorageBreakdown } from '../../src/util/storageReport';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

/** The catalog is not this screen's subject; the storage lines are. */
vi.mock('../../src/curriculum/load', async (original) => ({
  ...(await original<typeof import('../../src/curriculum/load')>()),
  allItems: () => Promise.resolve([] as CatalogItem[]),
}));
vi.mock('../../src/ui/trackChips', () => ({ renderTrackChips: () => Promise.resolve() }));

const { SettingsScreen } = await import('../../src/ui/screens/SettingsScreen');

const router = { navigate: vi.fn(), navigateDev: vi.fn() } as unknown as Router;

/**
 * A `navigator.storage` that answers however the test says.
 *
 * Installed by `defineProperty` because jsdom has no `StorageManager` at all
 * and the property is a getter on the prototype.
 */
function withStorage(answers: {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
} | null): void {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: answers === null ? undefined : answers,
  });
}

function breakdown(over: Partial<StorageBreakdown> = {}): StorageBreakdown {
  return {
    usageBytes: 0,
    quotaBytes: 0,
    precached: 0,
    imports: 0,
    importBytes: 0,
    sessions: 0,
    sessionCap: 1,
    persisted: null,
    blocked: null,
    ...over,
  };
}

beforeEach(() => {
  // A real database, because the question is only put when there is one to
  // open: `openDatabase()` returns before asking when the browser has no
  // IndexedDB at all, which is jsdom and is also a browser with site data
  // blocked — and there, persistence is moot because nothing is stored.
  useFakeIndexedDb();
});

afterEach(() => {
  withStorage(null);
  clearFakeIndexedDb();
  resetDatabaseForTest();
  document.body.replaceChildren();
});

describe('the app asks not to be evicted', () => {
  it('asks on the first open and records that it was granted', async () => {
    let asked = 0;
    withStorage({
      persisted: () => Promise.resolve(false),
      persist: () => {
        asked += 1;
        return Promise.resolve(true);
      },
    });
    // Asked from here rather than from a screen: by the time a screen could
    // ask, rows have already been written in best-effort mode.
    await openDatabase();
    await vi.waitFor(() => {
      expect(persistenceState()).toBe('persisted');
    });
    expect(asked).toBe(1);
  });

  it('does not ask again when the grant is already in place', async () => {
    let asked = 0;
    withStorage({
      persisted: () => Promise.resolve(true),
      persist: () => {
        asked += 1;
        return Promise.resolve(true);
      },
    });
    await openDatabase();
    await vi.waitFor(() => {
      expect(persistenceState()).toBe('persisted');
    });
    // `persisted()` never prompts and is the cheaper question, so a phone that
    // was granted persistence on its first launch is not asked on every one.
    expect(asked).toBe(0);
  });

  it('says best-effort when the browser refuses', async () => {
    withStorage({ persisted: () => Promise.resolve(false), persist: () => Promise.resolve(false) });
    await openDatabase();
    await vi.waitFor(() => {
      expect(persistenceState()).toBe('best-effort');
    });
  });

  it('says unavailable when the browser will not be asked', async () => {
    withStorage(null);
    await openDatabase();
    // No round trip to wait for: a browser with no `persist` is known at once.
    expect(persistenceState()).toBe('unavailable');
    // And nothing is holding the database shut, which is the other half of the
    // sentence the screen prints.
    expect(databaseBlock()).toBeNull();
  });

  it('throws nothing at the app when the question itself fails', async () => {
    withStorage({
      persisted: () => Promise.reject(new Error('no')),
      persist: () => Promise.reject(new Error('no')),
    });
    // The database still opens: persistence is fire-and-forget, and a failure
    // to answer is an answer.
    await expect(openDatabase()).resolves.not.toThrow();
    await vi.waitFor(() => {
      expect(persistenceState()).toBe('unavailable');
    });
  });
});

describe('another copy of the app holding the database', () => {
  /** A connection at the previous version, as an older build in another tab. */
  function holdOldVersion(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION - 1);
      open.onupgradeneeded = () => undefined;
      open.onsuccess = () => {
        resolve(open.result);
      };
      open.onerror = () => {
        reject(open.error ?? new Error('could not hold the old version'));
      };
    });
  }

  /** Lets the shim's own queue run, which is where its events are dispatched. */
  function settleShim(): Promise<void> {
    return new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }

  it('gives up on a bounded wait instead of never settling', async () => {
    withStorage(null);
    const held = await holdOldVersion();
    // `setTimeout` only: the shim dispatches its events through `setImmediate`,
    // so faking that as well would stop the database working at all.
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const opening = openDatabase();
      for (let turn = 0; turn < 50 && databaseBlock() === null; turn += 1) await settleShim();
      // Blocked, and not yet given up on: the other connection may still let go.
      expect(databaseBlock()).toEqual({ wanted: DB_VERSION, held: DB_VERSION - 1, gaveUp: false });
      await vi.advanceTimersByTimeAsync(BLOCKED_GIVE_UP_MS);
      // **The fault this bounds.** A blocked `open()` fires neither `success`
      // nor `error`, so without the handler this promise never settles — and
      // `app/boot.ts` waits on it, which is the launch with no tab bar at all.
      // Memory instead of nothing: every store falls back to it for the
      // session, so the app is degraded rather than dead.
      await expect(opening).resolves.toBeNull();
      expect(databaseBlock()?.gaveUp).toBe(true);
    } finally {
      vi.useRealTimers();
      held.close();
    }
  });

  it('takes the report back when the other copy lets go', async () => {
    withStorage(null);
    const held = await holdOldVersion();
    const opening = openDatabase();
    for (let turn = 0; turn < 50 && databaseBlock() === null; turn += 1) await settleShim();
    expect(databaseBlock()).not.toBeNull();
    // The other tab closes. The real open was left running, so the app has its
    // database back without a reload — and there is nothing left to report.
    held.close();
    await expect(opening).resolves.not.toBeNull();
    expect(databaseBlock()).toBeNull();
  });

  it('lets go when it is the one in another copy’s way', async () => {
    withStorage(null);
    expect(await openDatabase()).not.toBeNull();
    // A newer build asking for the next version. Nothing here handles
    // `blocked` on its behalf, so the only thing that can let this open
    // through is this page closing its own connection when `blocking` fires —
    // which is the half of the fault that actually cures it: a service-worker
    // update reloads the page, and the outgoing connection is not reliably
    // gone before the incoming page asks. Without the handler this never
    // resolves.
    const next = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION + 1);
      open.onupgradeneeded = () => undefined;
      open.onsuccess = () => {
        resolve(open.result);
      };
      open.onerror = () => {
        reject(open.error ?? new Error('the bump failed'));
      };
    });
    next.close();
  });
});

describe('the sentence the owner reads', () => {
  it('says which of the four states the app is in', () => {
    expect(durabilitySentence(breakdown({ persisted: 'persisted' }))).toMatch(/will not clear it/i);
    expect(durabilitySentence(breakdown({ persisted: 'best-effort' }))).toMatch(/may clear it/i);
    expect(durabilitySentence(breakdown({ persisted: 'unavailable' }))).toMatch(/will not say/i);
    // Nothing at all while the question is still out, rather than a guess.
    expect(durabilitySentence(breakdown({ persisted: null }))).toBeNull();
  });

  it('puts a blocked database ahead of the eviction state, and names the cure', () => {
    const said = durabilitySentence(
      breakdown({
        persisted: 'persisted',
        blocked: { wanted: 6, held: 5, gaveUp: true },
      }),
    );
    // Persistence is irrelevant while nothing is being written at all, so the
    // more urgent of the two facts is the one that gets the line.
    expect(said).toMatch(/nothing is being saved/i);
    expect(said).toMatch(/close the other tab/i);
  });

  it('is not alarming while the other copy may still let go', () => {
    const said = durabilitySentence(
      breakdown({ blocked: { wanted: 6, held: 5, gaveUp: false } }),
    );
    expect(said).toMatch(/waiting/i);
    expect(said).not.toMatch(/nothing is being saved/i);
  });
});

describe('Settings prints it beside the usage figure', () => {
  /** Mounts the screen and waits for the storage lines to be filled in. */
  async function mount(): Promise<HTMLElement> {
    const section = SettingsScreen(router);
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelector('#settings-storage')?.textContent).not.toBe('Measuring…');
    });
    return section;
  }

  it('says the app may be cleared, on the screen the owner opens when space is short', async () => {
    withStorage({
      persisted: () => Promise.resolve(false),
      persist: () => Promise.resolve(false),
      // `measureStorage` asks for this; without it the whole line is replaced
      // by "will not say how much storage is in use".
      estimate: () => Promise.resolve({ usage: 1024, quota: 2048 }),
    } as unknown as { persist: () => Promise<boolean> });
    await openDatabase();
    await vi.waitFor(() => {
      expect(persistenceState()).toBe('best-effort');
    });

    const section = await mount();
    const line = section.querySelector('#settings-durability');
    await vi.waitFor(() => {
      expect(line?.textContent ?? '').toMatch(/best-effort/i);
    });
    // Beside the usage figure rather than somewhere else on a screen of forty
    // controls (`04` §0 R6): the two are siblings in the Content block.
    expect(line?.previousElementSibling?.id).toBe('settings-storage');
    expect((line as HTMLElement | null)?.hidden).toBe(false);
  });

  it('says nothing at all when there is nothing to be asked about', async () => {
    withStorage({
      estimate: () => Promise.resolve({ usage: 1024, quota: 2048 }),
    } as unknown as { persist: () => Promise<boolean> });
    // No IndexedDB at all — a browser with site data blocked. The question is
    // never put, because there is nothing stored for an answer to protect, so
    // `persistenceState()` stays `null` and the line must keep out of the way
    // rather than reserve space for a sentence that will never come.
    clearFakeIndexedDb();
    const section = await mount();
    const line = section.querySelector<HTMLElement>('#settings-durability');
    expect(line?.hidden).toBe(true);
    expect(line?.textContent).toBe('');
  });
});
