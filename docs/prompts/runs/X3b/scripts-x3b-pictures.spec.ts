/**
 * X3b's product look (Entry 128), not a test of the suite: the import sheet's tempo line after the
 * learner states a tempo (the control still there, seeded) and after a second statement on the same
 * sheet, at 342 × 740, with the text each showed, the field's value and whether the control's row fits
 * the width. Run once with the X3b override on port 4347 and moved to docs/prompts/runs/X3b/ afterwards.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', '..', 'docs', 'prompts', 'pictures', 'x3b');
const LEFT_HAND_FIRST = path.join(HERE, '..', 'fixtures', 'imports', 'left-hand-first.mid');
const W = 342;
const H = 740;

test.use({ viewport: { width: W, height: H } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

async function shot(page: Page, what: string): Promise<void> {
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${what}-${String(W)}x${String(H)}.png`) });
}

/** Brings one element of the sheet to the top of the sheet's scrolling panel. */
async function scrollSheetTo(page: Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate((node) => {
    node.scrollIntoView({ block: 'start' });
  });
}

/** Whether an element's content is wider than its box (a row cut or pushed past the edge). */
async function fits(page: Page, selector: string): Promise<{ scrollWidth: number; clientWidth: number; right: number; viewport: number } | null> {
  return page.evaluate((wanted) => {
    const node = document.querySelector(wanted);
    if (!node) return null;
    return { scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, right: node.getBoundingClientRect().right, viewport: window.innerWidth };
  }, selector);
}

test('the tempo line after a first statement and after a second', async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(OUT, { recursive: true });
  const texts: Record<string, unknown> = {};
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles(LEFT_HAND_FIRST);
  const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('#assign-demands')).toContainText('Measured');
  const field = sheet.locator('#import-tempo-bpm');

  // The first statement: 60, the slip.
  await field.fill('60');
  await sheet.locator('#import-tempo-use').click();
  await expect(sheet.locator('#import-tempo')).toContainText('You stated ♩ = 60.');
  await scrollSheetTo(page, '#import-guessed');
  texts.guessedAfterFirst = await sheet.locator('#import-guessed').innerText();
  texts.fieldAfterFirst = await field.inputValue();
  texts.useEnabledAfterFirst = await sheet.locator('#import-tempo-use').isEnabled();
  texts.controlAfterFirst = await fits(page, '#import-tempo-set .row');
  await shot(page, 'sheet-tempo-first-statement');

  // The second statement, on the same sheet: 160, the tempo meant.
  await field.fill('160');
  await sheet.locator('#import-tempo-use').click();
  await expect(sheet.locator('#import-tempo')).toContainText('You stated ♩ = 160.');
  await scrollSheetTo(page, '#import-guessed');
  texts.guessedAfterSecond = await sheet.locator('#import-guessed').innerText();
  texts.fieldAfterSecond = await field.inputValue();
  texts.useEnabledAfterSecond = await sheet.locator('#import-tempo-use').isEnabled();
  texts.controlAfterSecond = await fits(page, '#import-tempo-set .row');
  texts.saidAfterSecond = await sheet.locator('#import-tempo-said').evaluate((node) => ({ hidden: (node as HTMLElement).hidden, text: node.textContent }));
  await shot(page, 'sheet-tempo-second-statement');

  writeFileSync(path.join(OUT, 'x3b-pictures.json'), `${JSON.stringify(texts, null, 2)}\n`);
});
