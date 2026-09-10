// Opening the score screen's two control sheets (docs/04 §5, P21 B1).
//
// The bar holds the six things that change during a practice; everything else
// is behind `⋯`. Tests that used to click a control on the bar now open the
// sheet first, and every id is unchanged — the control is the same element,
// moved.

import { expect, type Page } from '@playwright/test';

/**
 * Brings the control bar back if it has folded itself away.
 *
 * A few seconds into a run the chrome folds when the music has reached it
 * (`08` §9.20), and folded means gone: the stage is extended underneath and
 * takes the tap. A person gets the bar back by tapping the sheet, and so must
 * a test — `score.rotate.spec` clicked `#score-play` without doing so and spent
 * its whole four-minute budget being told that `#score-stage` intercepts
 * pointer events.
 */
export async function revealBar(page: Page): Promise<void> {
  if ((await page.locator('#score-bar[data-visible="false"]').count()) === 0) return;
  await page.locator('#score-stage').click({ position: { x: 20, y: 20 } });
  await page.waitForTimeout(150);
}

/**
 * Presses a control on the bar the way a person does: reveal, then click.
 *
 * Twice, because the fold's timer is three seconds and a run can hide the bar
 * again between the reveal and the click. One tap always brings it back
 * (`08` §9.34), so a second attempt is the whole recovery; a third would be
 * hiding a real fault behind a retry loop. The timeouts are short on purpose:
 * a control that cannot be pressed should say so in seconds, not in minutes.
 */
export async function pressControl(page: Page, selector: string): Promise<void> {
  await revealBar(page);
  try {
    await page.locator(selector).click({ timeout: 1_500 });
  } catch {
    await revealBar(page);
    await page.locator(selector).click({ timeout: 3_000 });
  }
}

/** Opens the `⋯` sheet, or does nothing if it is already open. */
export async function openScoreMenu(page: Page): Promise<void> {
  const sheet = page.locator('#score-more-sheet');
  if (await sheet.isVisible()) return;
  // Reveal first. The bar fades after three seconds of a run whatever it is
  // covering, so mid-run `⋯` is behind a stage that takes the tap — the fuzz
  // walk spent its whole four-minute budget being told so.
  await revealBar(page);
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
  await revealBar(page);
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
