// What Diagnostics says about the offline story, against a real browser.
//
// **Not run in the session that wrote it** (Playwright was forbidden there);
// these four need a run. They are separate from `offline.spec.ts`, which
// defends "the app works with the network off"; this file defends the *report*,
// which is the only way the owner can find that out before getting on a train.
//
// Two faults it exists for:
//
// * **"registered but not controlling" was printed when there was no service
//   worker at all.** The check read `navigator.serviceWorker.controller` and
//   nothing else, so a registration that failed — a scope that does not cover
//   the path, a browser or a profile that refused it — was reported as a detail
//   of a worker that did not exist. "This app will not work offline" is the one
//   question the screen exists to answer.
// * **"Last update check" reported when the app was opened, not when a check
//   happened.** `noteUpdateCheck()` ran on the line after `registerSW()`
//   returned: no request, no network, no answer. On a phone that had been off
//   the network for a month the line read "a moment ago".

import { expect, test } from '@playwright/test';

const BASE = '/PianoProject/';

async function openDiagnostics(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`${BASE}#/settings/diagnostics`);
  await expect(page.locator('.screen h1')).toHaveText('Diagnostics');
  // The offline block is behind its own refresh; it is drawn on mount.
  await expect(page.locator('#diag-offline')).not.toContainText('Checking…', { timeout: 60_000 });
}

test.describe('the offline report', () => {
  test.setTimeout(180_000);

  test('says the app will not work offline when registration failed', async ({ page }) => {
    await page.addInitScript(() => {
      // A registration that never lands. This is what a wrong `base`, a scope
      // the page is outside of, or a profile with service workers switched off
      // looks like from inside the page.
      Object.defineProperty(navigator.serviceWorker, 'register', {
        configurable: true,
        writable: true,
        value: () => Promise.reject(new Error('registration refused')),
      });
      Object.defineProperty(navigator.serviceWorker, 'getRegistration', {
        configurable: true,
        writable: true,
        value: () => Promise.resolve(undefined),
      });
    });

    await openDiagnostics(page);

    const offline = page.locator('#diag-offline');
    await expect(offline).toContainText('not registered — this app will not work offline');
    await expect(offline).not.toContainText('registered but not controlling');
    // And a failed registration is not an error the learner is shown: the
    // dynamic import of `virtual:pwa-register` and the registration itself are
    // both caught, so the red banner stays off a working app.
    await expect(page.locator('#error-banner')).toHaveCount(0);
  });

  test('says a new version is waiting when one is', async ({ page }) => {
    await page.addInitScript(() => {
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
    });

    await openDiagnostics(page);

    // The whole point of holding a worker back is that the page is reloaded
    // when the learner chooses (`00` D20). Nothing anywhere used to say a
    // version was sitting there once the toast had been dismissed with Later.
    await expect(page.locator('#diag-offline')).toContainText('a new version is waiting');
  });

  test('a worker already waiting at load is offered a toast', async ({ page }) => {
    await page.addInitScript(() => {
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
    });

    await page.goto(BASE);
    // `onNeedRefresh` only fires for a worker that arrives during a page's
    // life, so a worker already waiting — Later tapped on the last visit, or
    // the page never reloaded — used to wait behind a prompt never shown again.
    await expect(page.locator('#update-toast')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#update-reload')).toBeVisible();
  });

  test('"Last update check" is never until a check has reached the server', async ({
    page,
    context,
  }) => {
    await page.goto(BASE);
    await page.waitForFunction(
      async () => Boolean((await navigator.serviceWorker.getRegistration())?.active),
      undefined,
      { timeout: 120_000 },
    );
    // One reload while the network is still up, so the worker is *controlling*
    // this page. Registration happens on the first load and control arrives on
    // the next navigation, so without this the offline reload below is an
    // ordinary trip to a server that is not there — `ERR_INTERNET_DISCONNECTED`
    // rather than the cached app, which is not what this test is about.
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, {
      timeout: 120_000,
    });

    await context.setOffline(true);
    // A reload with the network off: `registration.update()` cannot reach the
    // server, so nothing may be recorded. Before the fix this wrote the moment
    // the page was opened, whatever happened next.
    await page.evaluate(() => {
      localStorage.removeItem('pianopath.lastUpdateCheck');
    });
    await page.reload();
    await openDiagnostics(page);
    await expect(page.locator('#diag-offline')).toContainText('Last update check: never');

    await context.setOffline(false);
    await page.reload();
    // Wait for the check to *reach the server* before reading the report. The
    // whole point of the fix is that the timestamp is written when
    // `registration.update()` resolves, which is a network round trip, and the
    // report is a snapshot taken when the screen is built — open it too early
    // and it says "never" for the honest reason.
    await page.waitForFunction(
      () => localStorage.getItem('pianopath.lastUpdateCheck') !== null,
      undefined,
      { timeout: 120_000 },
    );
    await openDiagnostics(page);
    // The block is a snapshot taken when the screen mounts, and the check is a
    // network round trip that lands a moment later, so the first paint honestly
    // says "never". `Check the precache` re-reads it, which is what the button
    // is for.
    await page.locator('#diag-precache').click();
    await expect(page.locator('#diag-offline')).not.toContainText('Last update check: never');
  });
});
