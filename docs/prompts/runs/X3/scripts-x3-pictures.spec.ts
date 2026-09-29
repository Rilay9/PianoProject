/**
 * X3's product look (Entry 118), not a test: the import sheet before and after the swap, the
 * Library row, and the placeholder sheet, at 342 × 740, with the text each showed. Run once with
 * the X3 override and moved to docs/prompts/runs/X3/scripts/ afterwards.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', '..', 'docs', 'prompts', 'pictures', 'x3');
const LEFT_HAND_FIRST = path.join(HERE, '..', 'fixtures', 'imports', 'left-hand-first.mid');
const ITEM = 'import.left-hand-first';

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

/** Brings one element of the sheet to the top of the sheet's scrolling panel. */
async function scrollSheetTo(page: Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate((node) => {
    node.scrollIntoView({ block: 'start' });
  });
}

test('the import sheet before and after the swap, the Library row, the placeholder sheet', async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(OUT, { recursive: true });
  const texts: Record<string, unknown> = {};
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles(LEFT_HAND_FIRST);
  const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('#assign-demands')).toContainText('Measured');

  texts.before = await sheet.innerText();
  await shot(page, 'sheet-before-top');
  await scrollSheetTo(page, '#import-guessed');
  await shot(page, 'sheet-before-guessed');
  await scrollSheetTo(page, '#assign-demands');
  await shot(page, 'sheet-before-notes');

  await sheet.locator('#import-swap').click();
  await expect(sheet.locator('#import-swap-said')).toContainText('Swapped');
  texts.after = await sheet.innerText();
  await scrollSheetTo(page, '#import-guessed');
  await shot(page, 'sheet-after-guessed');
  await scrollSheetTo(page, '#assign-demands');
  await shot(page, 'sheet-after-notes');
  await scrollSheetTo(page, '#import-belongs');
  await shot(page, 'sheet-after-belongs');

  await sheet.locator('#assign-save').click();
  await expect(sheet).toBeHidden();
  const row = page.locator(`.list-row[data-item="${ITEM}"]`);
  await expect(row.locator('.library-import-state')).toBeVisible();
  await row.scrollIntoViewIfNeeded();
  texts.row = await row.innerText();
  texts.stateLine = await row.locator('.library-import-state').evaluate((node) => ({
    text: node.textContent,
    clientWidth: (node as HTMLElement).clientWidth,
    scrollWidth: (node as HTMLElement).scrollWidth,
    cut: (node as HTMLElement).scrollWidth > (node as HTMLElement).clientWidth,
    rowHeight: (node.closest('.list-row') as HTMLElement).getBoundingClientRect().height,
  }));
  await shot(page, 'library-row');

  // The placeholder sheet (U75): a wanted rock song, searched for by title.
  await page.locator('#library-search').fill('Final Masquerade');
  const wanted = page.locator('#library-list .list-row').filter({ hasText: 'Final Masquerade' }).first();
  await expect(wanted).toBeVisible();
  await wanted.getByRole('button', { name: 'Details', exact: true }).click();
  const detail = page.locator('#library-detail');
  await expect(detail).toBeVisible();
  texts.placeholder = await detail.innerText();
  await shot(page, 'placeholder-sheet');
  await scrollSheetTo(page, '#library-detail-wanted');
  await shot(page, 'placeholder-sheet-wanted');

  writeFileSync(path.join(OUT, 'x3-pictures.json'), `${JSON.stringify(texts, null, 2)}\n`);
});

test('the score as the Score screen engraves it, before and after the swap', async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(OUT, { recursive: true });
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles(LEFT_HAND_FIRST);
  const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  await expect(sheet).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();
  const row = page.locator(`.list-row[data-item="${ITEM}"]`);
  await row.click();
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
  await shot(page, 'score-before-swap');

  // A reload, so the list is by level again ("what you just added" is a fact about one visit).
  await page.goto('/#/library');
  await page.getByRole('button', { name: 'Only mine' }).click();
  await row.getByRole('button', { name: 'Assign' }).click();
  await expect(sheet).toBeVisible();
  await sheet.locator('#import-swap').click();
  await expect(sheet.locator('#import-swap-said')).toContainText('Swapped');
  await page.getByRole('button', { name: 'Not now' }).click();
  await row.click();
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
  await shot(page, 'score-after-swap');
});
