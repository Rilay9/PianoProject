// Opening the score screen's two control sheets (docs/04 §5, P21 B1).
//
// The bar holds the six things that change during a practice; everything else
// is behind `⋯`. Tests that used to click a control on the bar now open the
// sheet first, and every id is unchanged — the control is the same element,
// moved.

import { expect, type Page } from '@playwright/test';

/** Opens the `⋯` sheet, or does nothing if it is already open. */
export async function openScoreMenu(page: Page): Promise<void> {
  const sheet = page.locator('#score-more-sheet');
  if (await sheet.isVisible()) return;
  await page.locator('#score-more').click();
  await expect(sheet).toBeVisible();
}

export async function closeScoreMenu(page: Page): Promise<void> {
  const sheet = page.locator('#score-more-sheet');
  if (!(await sheet.isVisible())) return;
  await page.locator('#score-more-sheet-close').click();
  await expect(sheet).toBeHidden();
}

/** Opens the `⋯` sheet, runs `body`, and closes it again. */
export async function withScoreMenu(page: Page, body: () => Promise<void>): Promise<void> {
  await openScoreMenu(page);
  await body();
  await closeScoreMenu(page);
}

/** The tempo sheet, behind the bar's tempo label. */
export async function openTempoSheet(page: Page): Promise<void> {
  const sheet = page.locator('#score-tempo-sheet');
  if (await sheet.isVisible()) return;
  await page.locator('#score-tempo-label').click();
  await expect(sheet).toBeVisible();
}

export async function closeTempoSheet(page: Page): Promise<void> {
  const sheet = page.locator('#score-tempo-sheet');
  if (!(await sheet.isVisible())) return;
  await page.locator('#score-tempo-sheet-close').click();
  await expect(sheet).toBeHidden();
}

/** Sets the tempo percentage through the sheet the slider now lives in. */
export async function setTempoPercent(page: Page, percent: number): Promise<void> {
  await openTempoSheet(page);
  await page.locator('#score-tempo').fill(String(percent));
  await closeTempoSheet(page);
}
