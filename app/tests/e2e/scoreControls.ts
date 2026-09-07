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

/**
 * The engraved music's box on screen — the ink, not the page it sits on.
 *
 * OSMD lays a window out on a page the full width of the container and inks
 * part of it, and since the fit grew the sheet to fill the width with *ink*
 * the page itself deliberately runs off the right of the stage. So a test
 * asking "does the music fit" has to ask about the drawn extent; the SVG
 * element's own box stopped being that number.
 */
export async function inkBox(
  page: Page,
): Promise<{ left: number; right: number; top: number; bottom: number; width: number; height: number }> {
  return page.evaluate(() => {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const el of document.querySelectorAll('#score-stage .is-front svg *')) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
      top = Math.min(top, box.top);
      bottom = Math.max(bottom, box.bottom);
    }
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  });
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
