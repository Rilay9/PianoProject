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
    await page.locator('#folder-min').fill('5');
    await expect(page.locator('#folder-count')).toContainText('500 match');
    await page.locator('#folder-search').fill('Qm123');
    await expect(page.locator('#folder-list .list-row').first()).toContainText('Qm123');
  });
});
