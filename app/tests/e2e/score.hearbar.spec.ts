/**
 * Long-press a bar to hear it (P21c §B4).
 *
 * `04` §5 has listed this among the score screen's gestures since the spec was
 * written and it was never built. In Wait mode it is the "show me what this is
 * meant to sound like" for the bar you are stuck on: one bar, both hands,
 * once, nothing judged, and the run put back afterwards.
 */
import { expect, test, type Page } from '@playwright/test';

const ITEM = 'song.folk.hot-cross-buns';

async function openScore(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
    { timeout: 60_000 },
  );
  await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'true');
}

/** Holds a finger on the first drawn measure for longer than the threshold. */
async function longPressFirstBar(page: Page): Promise<void> {
  const measure = page.locator('.score-buffer.is-front .vf-measure').first();
  await expect(measure).toBeVisible({ timeout: 60_000 });
  const box = await measure.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
}

test.describe('hearing one bar', () => {
  test('plays it once and gives the screen back', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('wait');
    const screen = page.locator('section[data-screen="score"]');

    await longPressFirstBar(page);

    // It starts, and it says which bar it is playing.
    await expect(screen).toHaveAttribute('data-running', 'true', { timeout: 10_000 });
    await expect(page.locator('#score-status')).toContainText('as written');

    // One pass: it stops on its own rather than looping.
    await expect(screen).toHaveAttribute('data-running', 'false', { timeout: 60_000 });
    // And the mode the learner chose is untouched throughout.
    await expect(page.locator('#score-mode')).toHaveValue('wait');
    // No summary: nothing was judged, so there is nothing to report.
    await expect(page.locator('#score-summary')).toBeHidden();
  });

  test('a quick tap is not a long press', async ({ page }) => {
    await openScore(page);
    const measure = page.locator('.score-buffer.is-front .vf-measure').first();
    await expect(measure).toBeVisible({ timeout: 60_000 });
    const box = await measure.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(900);
    // A tap toggles the control bar; it does not start playing anything.
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-running',
      'false',
    );
  });
});
