/**
 * Library and own-score import (docs/04 §4).
 *
 * The import path is the reason P7 says "build this early": the bundled
 * library stops at 1930 and at what the content pipeline could fetch, and
 * everything else the owner plays arrives through this screen. So these tests
 * cover the whole round trip — pick a file, see it in the list, open it, and
 * still have it after a reload.
 */
import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const MXL = path.join(FIXTURES, 'test-tune.mxl');
const MUSICXML = path.join(FIXTURES, 'test-tune.musicxml');
const PDF = path.join(FIXTURES, 'two-systems.pdf');

/**
 * Each test starts on a phone with nothing imported.
 *
 * Guarded by sessionStorage because an init script runs again on every
 * navigation — including the reload one of these tests does on purpose, which
 * would otherwise delete the very import it is checking survived.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

test.describe('Library', () => {
  test('lists the bundled catalog and filters it', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
    const all = await page.locator('#library-count').textContent();

    // The six selects live behind the Filter chip now (`04` §0 R1): above the
    // list they pushed the first item about 640 px down a 780 px screen.
    await page.locator('#library-filter-toggle').click();
    await page.locator('#library-type').selectOption('drill');
    await expect(page.locator('#library-count')).not.toHaveText(all ?? '');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();

    await page.locator('#library-type').selectOption('all');
    await page.locator('#library-search').fill('hot cross');
    await expect(page.locator('#library-list')).toContainText('Hot Cross Buns');
  });

  test('imports an .mxl, opens it on the Score screen, and keeps it across a reload', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MXL);
    await expect(page.locator('#library-status')).toContainText('Imported 1: Imported Test Tune');

    const row = page.locator('.list-row[data-item="import.imported-test-tune"]');
    await expect(row).toBeVisible();
    await expect(row).toContainText('yours');

    await row.click();
    await expect(page).toHaveURL(/#\/score\/import\.imported-test-tune/);
    // The imported bytes come from IndexedDB, not from a URL under content/.
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });

    await page.goto('/#/library');
    await page.reload();
    // The list is level-sorted again after a reload, so ask for the imports.
    await page.locator('#library-mine').click();
    await expect(page.locator('.list-row[data-item="import.imported-test-tune"]')).toBeVisible();
  });

  test('imports plain MusicXML too, and takes its title from the file', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MUSICXML);
    await expect(page.locator('#library-list')).toContainText('Imported Test Tune');
  });

  test('a PDF is marked "pages, not notes" and opens in the viewer, not the Score screen', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(PDF);
    const row = page.locator('.list-row[data-item="import.two-systems"]');
    await expect(row).toBeVisible();
    await expect(row).toContainText('pages, not notes');

    await row.click();
    await expect(page).toHaveURL(/#\/pdf\/import\.two-systems/);
    await expect(page.locator('#pdf-stage')).toBeVisible();
  });

  test('a file it cannot read fails with one sentence, not a stack trace', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles({
      name: 'not-a-score.mid',
      mimeType: 'audio/midi',
      buffer: Buffer.from([0x4d, 0x54, 0x68, 0x64]),
    });
    const status = page.locator('#library-status');
    await expect(status).toContainText('not-a-score.mid is not a score the app can read');
    await expect(status).not.toContainText('Error:');
    await expect(status).not.toContainText('at ');
  });

  test('an imported score can be renamed and deleted', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MXL);
    const row = page.locator('.list-row[data-item="import.imported-test-tune"]');
    await row.getByRole('button', { name: 'Edit' }).click();

    await page.locator('#edit-title').fill('My Own Name');
    await page.locator('#edit-save').click();
    await expect(page.locator('#library-list')).toContainText('My Own Name');

    await page
      .locator('.list-row[data-item="import.imported-test-tune"]')
      .getByRole('button', { name: 'Edit' })
      .click();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.locator('#edit-delete').click();
    await expect(page.locator('#library-list')).not.toContainText('My Own Name');
  });

  test('"Only mine" shows just the imports', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MXL);
    await page.locator('#library-mine').click();
    await expect(page.locator('#library-count')).toContainText('1 of');
  });
});

/**
 * `04` §0 on the Library. The first item used to start about 640 px down a
 * 780 px screen: a heading, two lines of prose and three filled buttons above
 * a list of 1,533 things.
 */
test.describe('Library obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the list starts inside the first screenful (R1)', async ({ page }) => {
    await page.goto('/#/library');
    const first = page.locator('#library-list .list-row').first();
    await expect(first).toBeVisible();
    const box = await first.boundingBox();
    expect(box?.y ?? 0).toBeLessThan(200);
  });

  test('a filter set behind the closed row is named in the count (R1)', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();
    // Closed to begin with, or the six selects are back above the list.
    await expect(page.locator('#library-filters')).toBeHidden();
    await page.locator('#library-filter-toggle').click();
    await expect(page.locator('#library-filters')).toBeVisible();
    await page.locator('#library-type').selectOption('song');
    await page.locator('#library-filter-toggle').click();
    await expect(page.locator('#library-filters')).toBeHidden();
    // The filter is still on and the screen says so, so an empty list is never
    // a mystery.
    await expect(page.locator('#library-count')).toContainText('Songs');
  });

  test('Import, Shelf and Score folder sit above the list, not below it (R3)', async ({ page }) => {
    // They used to sit at the foot of the whole list — reachable only after
    // scrolling past everything and past "Show more". They are header
    // content now (`#library-own`), so they exist and come before the list
    // in the DOM whatever row is currently scrolled to.
    await page.goto('/#/library');
    const own = page.locator('#library-own');
    await expect(own).toBeVisible();
    await expect(own.getByRole('button', { name: 'Import a score' })).toBeVisible();
    await expect(own.getByRole('button', { name: 'Shelf' })).toBeVisible();
    await expect(own.getByRole('button', { name: 'Score folder' })).toBeVisible();
    const ownIsBeforeList = await page.evaluate(() => {
      const own = document.querySelector('#library-own');
      const list = document.querySelector('#library-list');
      if (!own || !list) return false;
      // DOCUMENT_POSITION_FOLLOWING on `list` from `own`'s perspective means
      // `list` comes after `own`.
      return (own.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(ownIsBeforeList).toBe(true);
  });

  test('the item sheet fits its last value on the screen', async ({ page }) => {
    await page.goto('/#/library');
    await page
      .locator('#library-list .list-row')
      .first()
      .getByRole('button', { name: 'Details' })
      .click();
    await expect(page.locator('#library-detail')).toBeVisible();
    const last = page.locator('#library-detail dd').last();
    const clipped = await last.evaluate((el) => el.scrollWidth > el.clientWidth + 2);
    expect(clipped).toBe(false);
  });
});

test.describe('the letter rail in Library', () => {
  test('waits for the title sort, then jumps — growing the list to reach a letter', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-count')).toContainText('items');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();

    const rail = page.locator('.list-with-rail .alpha-rail');
    // Level is the default sort and it is a teaching order, so a letter would
    // point wherever that letter happened to fall — nowhere anyone could
    // predict. An index that cannot be predicted is worse than none.
    await expect(rail).toBeHidden();

    // The sort lives behind the Filter chip, which is right for a thing set
    // once rather than read at a glance.
    await page.locator('#library-filter-toggle').click();
    await page.locator('#library-sort').selectOption('title');
    await expect(rail).toBeVisible();
    await expect(rail.locator('.alpha-rail__letter')).toHaveCount(27);

    // Sixty rows of 1,533 in title order cover only the first letter or two,
    // so nearly every letter on the rail is real and not drawn yet. That is
    // the case worth testing: doing nothing there reads as a broken rail.
    const drawnBefore = await page.locator('#library-list .list-row').count();
    await rail.locator('[data-letter="M"]').click();
    await page.waitForTimeout(500);
    expect(
      await page.locator('#library-list .list-row').count(),
      'the list did not grow to reach M',
    ).toBeGreaterThan(drawnBefore);
    await expect(
      page.locator('#library-list .list-row').filter({ hasText: /^[ ]*M/i }).first(),
    ).toBeVisible();
  });
});
