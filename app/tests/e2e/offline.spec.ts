// Everything runs locally (docs/00 D20, docs/01 §7).
//
// The claim this file defends is not "there is a service worker" but "the app works with
// the network off". The failure mode it exists to catch is silent: Workbox skips files
// over its size limit without saying so, and a score that was never precached looks fine
// on Wi-Fi and 404s on a train.
//
// The service worker only registers on a built, served app, which is what the Playwright
// webServer already provides (`npm run build && npm run preview`).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const BASE = '/PianoProject/';

interface CatalogItem {
  id: string;
  type: string;
  file: string | null;
}

function catalog(): CatalogItem[] {
  return JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as CatalogItem[];
}

/**
 * Waits until the service worker is *controlling this page*, not merely registered.
 *
 * A registration that is active still does not serve navigations until it has claimed the
 * client, and a reload before that point fails with ERR_INTERNET_DISCONNECTED — which is
 * what happened when this test first checked `registration.active`.
 */
async function waitForServiceWorker(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, {
    timeout: 120_000,
  });
}

/** Waits for the worker to be installed and activated, before it controls anything. */
async function waitForRegistration(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(
    async () => Boolean((await navigator.serviceWorker.getRegistration())?.active),
    undefined,
    { timeout: 120_000 },
  );
}

test.describe('offline', () => {
  // A build, a service-worker install and a 6.8 MB precache do not fit in the default 30 s.
  test.setTimeout(180_000);

  test('the whole app works with the network off after one online launch', async ({
    page,
    context,
  }) => {
    const items = catalog();
    const score = items.find((item) => item.file?.includes('scores/authored/'));
    const exercise = items.find((item) => item.file?.includes('scores/generated/'));
    expect(score, 'no authored score in the catalog').toBeTruthy();
    expect(exercise, 'no generated exercise in the catalog').toBeTruthy();

    await page.goto(BASE);
    await waitForRegistration(page);
    // One reload while still online. `clientsClaim` should have claimed this page already,
    // but a client that installed the worker is not guaranteed to be controlled by it, and
    // this is what a learner's second launch looks like anyway (docs/00 D20).
    await page.reload();
    await waitForServiceWorker(page);
    await page.waitForTimeout(2_000);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.screen h1')).toHaveText('Today');

    // 1. The catalog and the curriculum — everything else is unusable without them.
    const data = await page.evaluate(async (base) => {
      const cat = (await (await fetch(`${base}content/catalog.json`)).json()) as unknown[];
      const cur = (await (await fetch(`${base}content/curriculum.json`)).json()) as {
        stages: unknown[];
      };
      return { items: cat.length, stages: cur.stages.length };
    }, BASE);
    expect(data.items).toBeGreaterThan(500);
    expect(data.stages).toBeGreaterThan(0);

    // 2. A lesson.
    const lesson = await page.evaluate(async (base) => {
      const response = await fetch(`${base}content/lessons/2.1.md`);
      return { ok: response.ok, length: (await response.text()).length };
    }, BASE);
    expect(lesson.ok).toBe(true);
    expect(lesson.length).toBeGreaterThan(200);

    // 3. An authored score and a generated exercise, opened through the app's own loader
    //    rather than fetched — "the bytes are cached" is not the same claim as "it opens".
    // Reach /dev/score by moving the hash rather than navigating: `openDevScore` does a
    // `page.goto('/#/dev/score')`, which resolves against the origin root and not the
    // app's base path, so offline it asks for a URL the worker's scope never cached.
    await page.evaluate(() => {
      window.location.hash = '#/dev/score';
    });
    await expect(page.locator('.screen h1')).toHaveText('Score renderer (dev)');
    await page.waitForFunction(() => window.__pianopathDevScore !== undefined, undefined, {
      timeout: 60_000,
    });
    for (const item of [score!, exercise!]) {
      await page.evaluate(
        (url) => window.__pianopathDevScore?.loadUrl(url),
        `${BASE}content/${item.file}`,
      );
      const summary = await page.evaluate(() => window.__pianopathDevScore?.modelSummary());
      expect(summary, `${item.id} produced no model offline`).toBeTruthy();
      expect(summary?.steps ?? 0, `${item.id} has no steps offline`).toBeGreaterThan(0);
    }

    // 4. The soundfont, which is the file most likely to be silently dropped.
    const soundfont = await page.evaluate(async (base) => {
      const response = await fetch(`${base}content/audio/acoustic_grand_piano-mp3.js`);
      return { ok: response.ok, bytes: (await response.arrayBuffer()).byteLength };
    }, BASE);
    expect(soundfont.ok).toBe(true);
    expect(soundfont.bytes).toBeGreaterThan(1_000_000);

    // 5. Every tab and sub-screen, offline (P9). Navigated by moving the hash
    //    rather than by `goto`, for the same reason as the dev route above.
    for (const [hash, heading] of [
      ['#/today', 'Today'],
      ['#/plan', 'Plan'],
      ['#/library', 'Library'],
      ['#/progress', 'Progress'],
      ['#/settings', 'Settings'],
      ['#/plan/skills', 'Review a skill'],
      ['#/today/metronome', 'Metronome'],
    ] as const) {
      await page.evaluate((target) => {
        window.location.hash = target;
      }, hash);
      await expect(page.locator('.screen h1')).toHaveText(heading, { timeout: 15_000 });
    }

    // 6. A drill, which is generated at runtime and so proves the *catalog*
    //    is readable offline rather than one file being cached.
    await page.evaluate(() => {
      window.location.hash = '#/drill/drill.reading.note-flash-treble-c4-g4';
    });
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', {
      timeout: 30_000,
    });
    await expect(page.locator('.staff-card .staff-note')).toBeVisible();

    // 7. Diagnostics agrees: it is the screen the owner would check on a train.
    await page.evaluate(() => {
      window.location.hash = '#/settings/diagnostics';
    });
    await expect(page.locator('#diag-offline')).toContainText('Currently offline', {
      timeout: 30_000,
    });
    await expect(page.locator('#diag-offline')).toContainText('Precached');
  });

  // eslint-disable-next-line @typescript-eslint/require-await -- Playwright tests are async
  test('every file the catalog names is in the precache manifest', async () => {
    // Reads the generated service worker rather than the browser: a missing entry is a
    // build mistake and should fail without needing a page at all.
    const sw = readFileSync(resolve('dist/sw.js'), 'utf8');
    const urls = new Set([...sw.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]));
    expect(urls.size).toBeGreaterThan(100);

    const missing = catalog()
      .filter((item) => item.file)
      .map((item) => `content/${item.file}`)
      .filter((url) => !urls.has(url));
    expect(missing, `${missing.length} catalog file(s) are not precached`).toEqual([]);

    for (const essential of [
      'content/catalog.json',
      'content/curriculum.json',
      'content/audio/acoustic_grand_piano-mp3.js',
    ]) {
      expect(urls.has(essential), `${essential} is not precached`).toBe(true);
    }

    // Hashed build artefacts that are loaded at runtime rather than imported
    // by the entry chunk, so a glob that misses them fails silently. The PDF
    // worker is the one that has actually gone wrong: pdfjs ships it as
    // `.mjs`, the globs matched `js` only, and a PDF opened offline would have
    // hung on a fetch that never resolved.
    for (const pattern of [/assets\/pdf\.worker[^"]*\.mjs$/, /assets\/index[^"]*\.js$/]) {
      const found = [...urls].some((url) => pattern.test(url ?? ''));
      expect(found, `nothing matching ${String(pattern)} is precached`).toBe(true);
    }

    // The quarried scores (replan §7.7). They arrive in a directory the globs
    // had never seen — `content/scores/pdmx/` — and a score that is in the
    // catalog and not in the precache looks fine until the owner opens it on a
    // train. P13 seeds one file there so this has something to find; P14
    // replaces it with the real quarry's output.
    const quarried = [...urls].filter((url) => url?.startsWith('content/scores/pdmx/'));
    expect(quarried.length, 'no content/scores/pdmx/ file is precached').toBeGreaterThan(0);
  });
});

test.describe('the error boundary (docs/04 §8)', () => {
  test('an uncaught error shows a banner with copyable details', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.screen h1')).toHaveText('Today');
    await expect(page.locator('#error-banner')).toHaveCount(0);

    // A real uncaught error, thrown the way one would actually arrive: from a
    // task, not from inside the evaluate call.
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('deliberate test failure');
      }, 0);
    });

    const banner = page.locator('#error-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('deliberate test failure');

    await page.locator('#error-copy').click();
    const report = page.locator('#error-report');
    await expect(report).toBeVisible();
    expect(await report.inputValue()).toContain('deliberate test failure');

    // And Diagnostics agrees, because both read the same log.
    await page.evaluate(() => {
      window.location.hash = '#/settings/diagnostics';
    });
    await expect(page.locator('#diag-errors')).toContainText('deliberate test failure');
  });

  test('an unhandled rejection is caught too, and counted', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.screen h1')).toHaveText('Today');
    await page.evaluate(() => {
      void Promise.reject(new Error('rejected on purpose'));
      void Promise.reject(new Error('rejected on purpose'));
    });
    await expect(page.locator('#error-banner')).toContainText('2 times');
  });

  test('dismissing it leaves the app usable', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.screen h1')).toHaveText('Today');
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('transient');
      }, 0);
    });
    await expect(page.locator('#error-banner')).toBeVisible();
    await page.locator('#error-dismiss').click();
    await expect(page.locator('#error-banner')).toHaveCount(0);
    await page.locator('button.tab-button[data-tab="library"]').click();
    await expect(page.locator('.screen h1')).toHaveText('Library');
  });
});
