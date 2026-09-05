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
    await expect(page.locator('.card h1')).toHaveText('Today');

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
    await expect(page.locator('.card h1')).toHaveText('Score renderer (dev)');
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
  });
});
