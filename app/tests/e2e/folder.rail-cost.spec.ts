/**
 * A jump to a letter must not draw the list up to it.
 *
 * The rail's first version reached a letter by growing the list until that
 * letter was in it. On 5,000 scores a tap on Z drew **4,860 rows and took
 * 2.7 s**; the owner's archive is 37,261, where it is some thirty-six thousand
 * rows and the frozen phone this screen has spent a week getting rid of.
 *
 * A letter does not need everything above it on the screen. It needs the page
 * that starts there — which is what an index in a book is, and what every music
 * app on a phone does. So the window moves and the list stays one page long.
 *
 * Asserted as a row count rather than a stopwatch: time on a CI runner is a
 * measure of the runner, and the row count is the thing that causes the time.
 */
import { expect, test } from '@playwright/test';

/** What the screen draws at once. */
const PAGE = 60;

test('jumping to a late letter draws a page, not everything above it', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const rows = Array.from({ length: 5000 }, (_, i) => ({
      file: `d/${String(i)}.mxl`,
      // Spread across the alphabet, so late letters really are far down.
      title: `${String.fromCharCode(65 + (i % 26))}piece ${String(i)}`,
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
    rows.sort((a, b) => a.title.localeCompare(b.title));
    const db = await new Promise<IDBDatabase>((resolve) => {
      const open = indexedDB.open('pianopath');
      open.onsuccess = () => {
        resolve(open.result);
      };
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('folderLibraries', 'readwrite');
      tx.objectStore('folderLibraries').put({
        id: 'big',
        addedAt: new Date().toISOString(),
        source: null,
        scores: rows,
        connected: false,
        rememberNote: null,
      });
      tx.oncomplete = () => {
        resolve();
      };
    });
  });

  await page.goto('/#/library/folder');
  await expect(page.locator('#folder-count')).toContainText('match');
  expect(await page.locator('#folder-list .list-row').count()).toBe(PAGE);

  await page.locator('.alpha-rail [data-letter="Z"]').click();
  await page.waitForTimeout(300);

  const rows = await page.locator('#folder-list .list-row').count();
  expect(rows, `a tap on Z drew ${String(rows)} rows`).toBeLessThanOrEqual(PAGE);
  // And it actually went there.
  await expect(page.locator('#folder-list .list-row').first()).toContainText(/^Z/);
  // The count says where in the list this is, because it is neither the first
  // rows nor all of them.
  await expect(page.locator('#folder-count')).toContainText('showing');
});
