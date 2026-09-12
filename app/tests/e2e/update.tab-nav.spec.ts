// The tab bar surviving a service-worker update (owner report): "on loading a
// new version of the app (updating) the menu is gone on the bottom when it
// refreshes. I need to restart the app for it to work."
//
// Modelled on `offline.report.spec.ts`'s way of setting up a waiting worker
// with `page.addInitScript` overriding `navigator.serviceWorker.register` /
// `getRegistration`, so the update toast shows exactly as it does there.
//
// The fault this defends: `main.ts` used to await `data/persist.ts`'s
// `hydratePersisted()` unconditionally whenever a mirrored settings key was
// missing, before ever calling `mount()` — and `mountAppShell()`, which
// builds `.tab-nav`, lives inside `mount()`. `data/db.ts` opens its one
// IndexedDB connection with no `blocked`/`blocking` handler at all, so a
// version bump — `DB_VERSION` has already moved five times — blocks that
// `open()` for as long as some other connection at the old version stays
// alive, which a reload racing its own teardown does not reliably avoid.
// Nothing throws in that case, so there is no exception and no
// `#error-banner`; the boot is simply still waiting on an answer a stale
// connection is quietly withholding, forever, and the tab bar never exists.
//
// This spec reproduces the two conditions directly — a missing mirrored key
// (so hydration is on the critical path at all) and an `indexedDB.open()`
// that never settles (standing in for the blocked connection) — across a
// real reload, and checks the tab bar reappears anyway within `app/boot.ts`'s
// bounded wait rather than staying gone until the app is fully restarted.
import { expect, test } from '@playwright/test';

const BASE = '/PianoProject/';

test.describe('the tab bar after an update reload', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // A worker already waiting, the same fake shape as
      // `offline.report.spec.ts`'s "a worker already waiting at load is
      // offered a toast" test — this is what makes the toast appear, which is
      // the owner's "on loading a new version of the app".
      const fake = {
        waiting: { state: 'installed' },
        installing: null,
        active: { state: 'activated' },
        update: () => Promise.resolve(),
        addEventListener: () => undefined,
      };
      Object.defineProperty(navigator.serviceWorker, 'getRegistration', {
        configurable: true,
        writable: true,
        value: () => Promise.resolve(fake),
      });
      Object.defineProperty(navigator.serviceWorker, 'register', {
        configurable: true,
        writable: true,
        value: () => Promise.resolve(fake),
      });

      // `needsHydration()` (`data/persist.ts`) is what puts `hydratePersisted()`
      // on `mount()`'s critical path at all — it is true whenever any mirrored
      // key is missing from localStorage, which every key is on a fresh
      // context already. Clearing it explicitly on every load (this
      // init script reruns on the reload below too) keeps that condition
      // true across both loads rather than depending on it happening to be
      // true once.
      localStorage.removeItem('pianopath.setup');

      // The blocked connection, standing in for `data/db.ts`'s `openDatabase()`
      // hanging behind a version bump: a request that never fires `success`,
      // `upgradeneeded` or `error` — which is exactly what an unhandled
      // `blocked` event looks like from the caller's side.
      const realOpen = indexedDB.open.bind(indexedDB);
      indexedDB.open = (name: string, version?: number): IDBOpenDBRequest => {
        if (name === 'pianopath') return new EventTarget() as unknown as IDBOpenDBRequest;
        return realOpen(name, version);
      };
    });
  });

  test('appears on first load despite a blocked settings database', async ({ page }) => {
    await page.goto(BASE);
    // Bounded by `app/boot.ts`'s `HYDRATION_TIMEOUT_MS` (2 s) plus slack —
    // without the fix this never resolves, and the test times out instead of
    // failing fast, which is itself the point: nothing throws.
    await expect(page.locator('.tab-nav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#update-toast')).toBeVisible({ timeout: 15_000 });
  });

  test('reappears after the reload the update toast leads to', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.tab-nav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#update-toast')).toBeVisible({ timeout: 15_000 });

    // The reload itself: whatever exact chain of `postMessage` /
    // `controllerchange` a real update goes through, it ends here — a full
    // navigation of the same page, hitting the same blocked database again.
    await page.reload();

    await expect(page.locator('.tab-nav')).toBeVisible({ timeout: 10_000 });
    // Ruling out the other reading of "the menu is gone": this is a hang, not
    // a thrown error, so no banner should appear alongside it either.
    await expect(page.locator('#error-banner')).toHaveCount(0);
  });
});
