/**
 * The score folder at the size it will actually be (P19 §C3).
 *
 * The owner's folder holds **37,261** MusicXML files, and every existing test
 * of this screen uses two. The listing is what the screen draws — the files
 * themselves are lent for one visit — so seeding a listing of the real size is
 * the honest version of this test, and it is the half that can be answered
 * without the phone.
 *
 * What it cannot answer, and what stays on the owner's checklist (review S1):
 * how long Chrome for Android takes to hand over 37,261 `File` objects through
 * the picker in the first place.
 */
import { expect, test } from '@playwright/test';

const FOLDER = 'pianopath-library';
const ROWS = 37_261;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      // A cleared origin is a first launch, and a first launch is the setup
      // tour (docs/04 §7d); this spec is about what comes after it.
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

/**
 * Writes a folder listing straight into the store, as picking a folder would.
 *
 * `withManifest: false` is the folder that has no `library.json` — every row
 * is then a bare one whose title came from its filename and whose level,
 * composer and style are unknown.
 */
async function seedFolder(
  page: import('@playwright/test').Page,
  rows: number,
  withManifest = true,
): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    async ({ folder, count, manifest }) => {
      const styles = ['classical', 'ragtime', 'jazz', 'folk', 'pop'];
      const scores = Array.from({ length: count }, (_, i) => ({
        file: `${String(i % 100).padStart(2, '0')}/Qm${String(i)}.mxl`,
        title: manifest ? `Piece number ${String(i)}` : `Qm${String(i)}`,
        composer: manifest ? `Composer ${String(i % 500)}` : '',
        level: manifest ? Math.round((1 + (i % 80) / 10) * 10) / 10 : null,
        bars: manifest ? 16 + (i % 200) : null,
        status: i % 7 === 0 ? 'in-copyright' : 'pd',
        style: manifest ? (styles[i % styles.length] ?? '') : '',
        rating: manifest ? (i % 50) / 10 : 0,
        ratings: manifest ? i % 30 : 0,
        views: manifest ? i * 3 : 0,
        lyrics: i % 11 === 0,
        garbled: false,
        museScore: '',
      }));
      const open = indexedDB.open('pianopath');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error ?? new Error('could not open the database'));
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('folderLibraries', 'readwrite');
        tx.objectStore('folderLibraries').put({
          id: folder,
          addedAt: new Date().toISOString(),
          source: manifest ? 'PDMX' : null,
          scores,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('could not write the folder'));
      });
      db.close();
    },
    { folder: FOLDER, count: rows, manifest: withManifest },
  );
}

/**
 * Writes a listing whose titles are the archive's own content hashes — the
 * shape a folder ends up in when its `library.json` is never found (picked
 * from the wrong level, or a build too old to look for it at all).
 */
async function seedUnnamedArchive(page: import('@playwright/test').Page, rows: number): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    async ({ folder, count }) => {
      const hash = (i: number) => `Qm${'a'.repeat(43)}${String.fromCharCode(98 + (i % 20))}`;
      const scores = Array.from({ length: count }, (_, i) => ({
        file: `${String(i)}.mxl`,
        title: hash(i),
        composer: '',
        level: null,
        bars: null,
        status: 'unknown',
        style: '',
        rating: 0,
        ratings: 0,
        views: 0,
        lyrics: false,
        garbled: false,
        museScore: '',
      }));
      const open = indexedDB.open('pianopath');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error ?? new Error('could not open the database'));
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('folderLibraries', 'readwrite');
        tx.objectStore('folderLibraries').put({
          id: folder,
          addedAt: new Date().toISOString(),
          source: null,
          scores,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('could not write the folder'));
      });
      db.close();
    },
    { folder: FOLDER, count: rows },
  );
}

test.describe('a listing stored without its library.json ever being found', () => {
  // This is the silent failure from the handoff: a stale listing shows
  // content hashes for titles and nothing on screen says why, or what to do
  // about it. `folder.spec.ts` is where this assertion lives because it is
  // the folder screen's own state; `empty-states.spec.ts` may be the more
  // natural home for it (see the report) but that file belongs to another
  // owner.
  test('names the problem and offers the fix, instead of just showing hashes', async ({ page }) => {
    await seedUnnamedArchive(page, 50);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('50 match');
    const notice = page.locator('#folder-unnamed-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/library\.json was not found/i);
    await expect(notice).toContainText(/pick the folder again/i);
    await expect(notice.getByRole('button', { name: /pick the folder again/i })).toBeVisible();
  });

  test('says nothing for an ordinary folder, even with a stray untitled file', async ({ page }) => {
    await seedFolder(page, 50);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('50 match');
    await expect(page.locator('#folder-unnamed-notice')).toBeHidden();
  });
});

test.describe('a folder of 37,261 scores', () => {
  test('browses, filters and searches without the screen falling over', async ({ page }) => {
    test.setTimeout(180_000);
    await seedFolder(page, ROWS);

    const started = Date.now();
    await page.goto('/#/library/folder');
    const count = page.locator('#folder-count');
    await expect(count).toContainText('37,261 match', { timeout: 60_000 });
    const firstPaintMs = Date.now() - started;
    // Logged rather than asserted: this is a desktop Chromium and the number
    // that matters is the S25's. A ceiling is asserted anyway, because a
    // regression to *minutes* is a bug wherever it is measured.
    console.log(`folder: ${String(ROWS)} rows, first paint ${String(firstPaintMs)} ms`);
    expect(firstPaintMs).toBeLessThan(30_000);

    // One page of rows, not 37,261 of them: that is the whole reason the
    // screen pages.
    await expect(page.locator('#folder-list .list-row')).toHaveCount(60);
    await expect(page.locator('#folder-more')).toContainText('Show more');

    const searched = Date.now();
    // The last row, so the query is nobody else's prefix.
    await page.locator('#folder-search').fill(`Piece number ${String(ROWS - 1)}`);
    await expect(count).toContainText('1 match');
    console.log(`folder: search over ${String(ROWS)} rows in ${String(Date.now() - searched)} ms`);
    await expect(page.locator('#folder-list .list-row')).toHaveCount(1);
    await expect(page.locator('#folder-list .list-row')).toContainText(
      `Piece number ${String(ROWS - 1)}`,
    );

    await page.locator('#folder-search').fill('');
    await page.locator('#folder-style').selectOption('ragtime');
    await expect(count).not.toContainText('37,261');
    await expect(page.locator('#folder-list .list-row').first()).toBeVisible();
  });

  test('the first score is on the screen without scrolling, upright (R1)', async ({ page }) => {
    // It was 600 px down a 780 px phone: a heading, a paragraph of prose, two
    // buttons, and four filter controls all took their turn before the thing
    // the screen is for. Everything above the list is now one state line, one
    // button, one folded explanation and one row of search.
    await page.setViewportSize({ width: 412, height: 780 });
    await seedFolder(page, 400);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-list .list-row').first()).toBeVisible();
    const top = await page.locator('#folder-list .list-row').first().evaluate((el) => el.getBoundingClientRect().top);
    console.log(`folder: the first row starts at ${String(Math.round(top))}px of 780`);
    expect(top).toBeLessThan(780);
    // And the rare filters are behind the chip rather than on the line.
    await expect(page.locator('#folder-filters')).toBeHidden();
    await expect(page.locator('#folder-filter-toggle')).toHaveAttribute('aria-expanded', 'false');
    await page.locator('#folder-filter-toggle').click();
    await expect(page.locator('#folder-filters')).toBeVisible();
  });

  test('forgetting the folder is inside How this works, not beside Pick (R3)', async ({ page }) => {
    await seedFolder(page, 20);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-pick')).toBeVisible();
    // In the document, and inside the fold — so it is reachable, and it is not
    // standing in the run between the heading and the list.
    await expect(page.locator('#folder-how #folder-forget')).toHaveCount(1);
    await expect(page.locator('#folder-forget')).toBeHidden();
    await page.locator('#folder-how summary').click();
    await expect(page.locator('#folder-forget')).toBeVisible();
    await page.locator('#folder-forget').click();
    await expect(page.locator('[data-screen="folder"]')).toContainText('No folder yet.');
  });

  test('says how to add when the folder is not connected, instead of failing obscurely', async ({
    page,
  }) => {
    await seedFolder(page, 200);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('200 match');
    // Browsing works with nothing plugged in — that is the design (`00` D24).
    // Adding is where the folder is needed again, and the message has to say
    // so rather than throwing.
    await page.locator('#folder-list .list-row').first().getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('[data-screen="folder"]')).toContainText(/pick the .* folder again/i);
  });

  test('a folder with no manifest still lists and still searches', async ({ page }) => {
    await seedFolder(page, 500, false);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('500 match');
    // No levels to filter by, so a level filter must not hide everything:
    // "unknown" is not "too hard".
    await page.locator('#folder-filter-toggle').click();
    await page.locator('#folder-min').fill('5');
    await expect(page.locator('#folder-count')).toContainText('500 match');
    await page.locator('#folder-search').fill('Qm123');
    await expect(page.locator('#folder-list .list-row').first()).toContainText('Qm123');
  });
});
