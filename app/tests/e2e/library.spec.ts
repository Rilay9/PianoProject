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
    await expect(page.locator('#score-stage .is-front svg')).toBeVisible({ timeout: 30_000 });

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
