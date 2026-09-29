/**
 * X3a's product look (Entry 122), not a test of the suite: the import sheet's tempo line before and
 * after the learner states a tempo, a refused tempo, and the Score screen's tempo label afterwards, at
 * 342 × 740, with the text each showed and whether the control's row fits the width. Run once with
 * the X3a override on port 4303 and moved to docs/prompts/runs/X3a/ afterwards.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTempoPercent } from './scoreControls';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', '..', 'docs', 'prompts', 'pictures', 'x3a');
const LEFT_HAND_FIRST = path.join(HERE, '..', 'fixtures', 'imports', 'left-hand-first.mid');
const ITEM = 'import.left-hand-first';
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

test('the tempo line before and after a statement, a refusal, and the Score screen’s tempo label', async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(OUT, { recursive: true });
  const texts: Record<string, unknown> = {};
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles(LEFT_HAND_FIRST);
  const sheet = page.locator('#assign-sheet[data-sheet="import"]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('#assign-demands')).toContainText('Measured');

  await scrollSheetTo(page, '#import-guessed');
  texts.guessedBefore = await sheet.locator('#import-guessed').innerText();
  texts.controlBefore = await fits(page, '#import-tempo-set .row');
  await shot(page, 'sheet-tempo-before');

  // A tempo the store refuses, said in its words.
  await sheet.locator('#import-tempo-bpm').fill('500');
  await sheet.locator('#import-tempo-use').click();
  await expect(sheet.locator('#import-tempo-said')).toContainText('500');
  texts.refused = await sheet.locator('#import-tempo-said').innerText();
  texts.guessedRefused = await sheet.locator('#import-guessed').innerText();
  await shot(page, 'sheet-tempo-refused');

  // The learner's tempo.
  await sheet.locator('#import-tempo-bpm').fill('60');
  await sheet.locator('#import-tempo-use').click();
  await expect(sheet.locator('#import-tempo')).toContainText('You stated ♩ = 60.');
  await scrollSheetTo(page, '#import-guessed');
  texts.guessedAfter = await sheet.locator('#import-guessed').innerText();
  await shot(page, 'sheet-tempo-after');

  await sheet.locator('#assign-save').click();
  await expect(sheet).toBeHidden();
  const row = page.locator(`.list-row[data-item="${ITEM}"]`);
  texts.libraryState = await row.locator('.library-import-state').innerText();

  await row.click();
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  texts.scoreLabelDefault = await page.locator('#score-tempo-label').innerText();
  await shot(page, 'score-tempo-label-default');
  await setTempoPercent(page, 100);
  await expect(page.locator('#score-tempo-label')).toHaveText(/\b60 bpm$/);
  texts.scoreLabelAt100 = await page.locator('#score-tempo-label').innerText();
  await shot(page, 'score-tempo-label-100');

  writeFileSync(path.join(OUT, 'x3a-pictures.json'), `${JSON.stringify(texts, null, 2)}\n`);
});
