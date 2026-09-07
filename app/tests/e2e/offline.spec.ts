// Everything runs locally (docs/00 D20, docs/01 §7).
//
// The claim this file defends is not "there is a service worker" but "the app works with
// the network off". The failure mode it exists to catch is silent: Workbox skips files
// over its size limit without saying so, and a score that was never precached looks fine
// on Wi-Fi and 404s on a train.
//
// The service worker only registers on a built, served app, which is what the Playwright
// webServer already provides (`npm run build && npm run preview`).

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
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

    // 4b. The three content directories added since this test was written
    //     (P19): a quarried score, a tips file and the level model. Each
    //     arrived in a directory the precache globs had never seen, and each
    //     time the symptom would have been something missing on a train.
    const quarried = items.find((item) => item.file?.includes('scores/pdmx/'));
    expect(quarried, 'no quarried score in the catalog').toBeTruthy();
    const later = await page.evaluate(
      async ({ base, score: quarriedFile }) => {
        const fetched = async (url: string): Promise<{ ok: boolean; length: number }> => {
          const response = await fetch(url);
          return { ok: response.ok, length: (await response.text()).length };
        };
        return {
          quarried: (await fetch(`${base}content/${quarriedFile}`)).ok,
          tips: await fetched(`${base}content/tips/note-flash.md`),
          tipsIndex: await fetched(`${base}content/tips/index.json`),
          model: await fetched(`${base}content/level-model.json`),
        };
      },
      { base: BASE, score: quarried!.file },
    );
    expect(later.quarried, 'a quarried score is not cached').toBe(true);
    expect(later.tips.ok && later.tips.length > 100, 'a tips file is not cached').toBe(true);
    expect(later.tipsIndex.ok, 'the tips index is not cached').toBe(true);
    // Without the level model an import silently gets no estimate — which the
    // app says out loud, so this would look like a content bug rather than a
    // caching one.
    expect(later.model.ok && later.model.length > 50, 'the level model is not cached').toBe(true);

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

    // 6b. A concept finder, which is generated from the curriculum and is the
    //     one screen whose whole purpose is to send him to the internet — it
    //     still has to *open* without one (P19).
    await page.evaluate(() => {
      window.location.hash = '#/plan/skills';
    });
    await expect(page.locator('.screen h1')).toHaveText('Review a skill', { timeout: 15_000 });
    const finder = page.locator('#skills-list').getByRole('button', { name: 'Find more' }).first();
    await expect(finder).toBeVisible({ timeout: 15_000 });
    await finder.click();
    await expect(page.locator('#finder-sheet')).toBeVisible();
    await expect(page.locator('#finder-sheet')).toContainText(/search|prompt|internet/i);

    // 7. Diagnostics agrees: it is the screen the owner would check on a train.
    await page.evaluate(() => {
      window.location.hash = '#/settings/diagnostics';
    });
    await expect(page.locator('#diag-offline')).toContainText('Currently offline', {
      timeout: 30_000,
    });
    // Not `toContainText('Precached')`, which is what stood here and which
    // passes just as happily on "Precached 0 of 1258". That is what it *did*
    // say on the phone, on a device holding 1,413 cache entries that had run
    // the whole app offline a moment earlier: `caches.match` was asked for a
    // bare URL while Workbox stores every revisioned entry under
    // `?__WB_REVISION__=…`, so all 1,258 read as missing. The service worker
    // was right and the check was asking the wrong question — and this
    // assertion could not tell the difference.
    const precached = await page.locator('#diag-offline').textContent();
    const counts = /Precached (\d+) of (\d+) catalog files/.exec(precached ?? '');
    expect(counts, `no precache line in: ${precached ?? '(nothing)'}`).toBeTruthy();
    const [, cached, total] = counts!;
    expect(Number(total)).toBeGreaterThan(1000);
    expect(
      Number(cached),
      `Diagnostics says ${cached} of ${total} are precached`,
    ).toBe(Number(total));
    // And it lists nothing as missing, which is the same claim said twice —
    // deliberately, because the list is what the owner is asked to send back.
    await expect(page.locator('#diag-missing')).toBeHidden();
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

    // The drill tips (replan §6). Same failure mode as the quarried scores: a
    // new content directory that the globs have never seen, where the symptom
    // is a drill opening with no advice on a train rather than an error.
    const tips = [...urls].filter((url) => url?.startsWith('content/tips/'));
    expect(tips.length, 'no content/tips/ file is precached').toBeGreaterThan(0);
    for (const essential of ['content/tips/index.json', 'content/tips/note-flash.md']) {
      expect(urls.has(essential), `${essential} is not precached`).toBe(true);
    }
  });

  // eslint-disable-next-line @typescript-eslint/require-await -- Playwright tests are async
  test('the engraver is not in the entry bundle (P19)', async () => {
    // P9 took OpenSheetMusicDisplay out of the first paint by making the Score
    // screen lazy: entry 1,576 kB → 227 kB, Lighthouse 77 → 98. A later static
    // `import { OsmdView }` in DrillScreen — which is *not* lazy, because
    // Today's warm-up row is usually a drill — put it straight back, and the
    // only thing that noticed was an audit nobody runs in CI. So the shape is
    // asserted here instead: whoever adds the next import gets a failing test
    // rather than a slower app.
    const entry = readdirSync(resolve('dist/assets')).find(
      (name) => name.startsWith('index-') && name.endsWith('.js'),
    );
    expect(entry, 'no entry chunk in dist/assets').toBeTruthy();
    const code = readFileSync(resolve('dist/assets', entry!), 'utf8');
    // Markers from inside the library, not its name: the name appears in the
    // entry chunk legitimately, as the destructuring of a dynamic import.
    for (const marker of ['SkyBottomLine', 'vexflow']) {
      expect(
        code.includes(marker),
        `${marker} is in the entry chunk: something imports the engraver without a dynamic import`,
      ).toBe(false);
    }
    // A ceiling with room in it, not the current number: this is a guard
    // against a megabyte arriving, not a budget to shave.
    const kib = Math.round(code.length / 1024);
    expect(kib, `entry chunk is ${String(kib)} KiB`).toBeLessThan(600);
  });

  // eslint-disable-next-line @typescript-eslint/require-await -- Playwright tests are async
  test('and nothing under content/ is served without being precached (P19)', async () => {
    // The inverse of the test above, and the one that catches a *new kind of
    // file* rather than a new file. Every check here so far asks "is this
    // thing I thought of in the manifest?"; four content phases have each
    // added a directory the globs had never seen, and each was found by
    // somebody thinking of it. This asks the question the other way round, so
    // the fifth directory does not need to be thought of.
    const sw = readFileSync(resolve('dist/sw.js'), 'utf8');
    const urls = new Set([...sw.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]));
    const root = resolve('dist');
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [relative(root, full).split(sep).join('/')];
      });
    const served = walk(join(root, 'content'));
    expect(served.length).toBeGreaterThan(1000);
    const uncached = served.filter((file) => !urls.has(file));
    expect(uncached, `${uncached.length} file(s) are served but never cached`).toEqual([]);
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
