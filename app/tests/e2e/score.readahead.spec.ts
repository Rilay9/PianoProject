/**
 * A beat of warning (P21c §A4).
 *
 * Tempo and Listen move whether or not the learner is ready, so the eye needs
 * somewhere to go before the clock gets there: a second, fainter band on the
 * next step, and the next key on the strip in a paler blue behind the current
 * one. Wait mode has no clock and draws neither — marking a note nobody is
 * going to reach yet would be telling a beginner to hurry.
 */
import { expect, test, type Page } from '@playwright/test';

const ITEM = 'song.folk.hot-cross-buns';

async function openScore(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toBeVisible();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
    { timeout: 60_000 },
  );
  await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'true');
}

/** Is the faint next-step band drawn, and where relative to the cursor? */
async function bands(page: Page): Promise<{ next: boolean; rightOfCursor: boolean }> {
  return page.evaluate(() => {
    const cursor = document.querySelector<HTMLElement>('.score-cursor:not(.score-cursor--next)');
    const next = document.querySelector<HTMLElement>('.score-cursor--next');
    const shown = next !== null && !next.hidden;
    if (!shown || !cursor || cursor.hidden) return { next: shown, rightOfCursor: false };
    return {
      next: true,
      rightOfCursor:
        next.getBoundingClientRect().left > cursor.getBoundingClientRect().left - 1,
    };
  });
}

test.describe('the beat of warning', () => {
  test('Tempo marks the next step and the next key', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-running',
      'true',
    );

    await expect
      .poll(async () => (await bands(page)).next, { timeout: 30_000 })
      .toBe(true);
    // Ahead of the cursor, never behind it.
    expect((await bands(page)).rightOfCursor).toBe(true);

    // And the strip says the same thing to the eyes that are on the keys.
    await expect
      .poll(async () => page.locator('.keyboard-strip .key.is-next').count(), { timeout: 30_000 })
      .toBeGreaterThan(0);
  });

  test('Wait mode draws neither: there is no clock to be ahead of', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-running',
      'true',
    );
    // Give it the time the Tempo run needed to show one.
    await page.waitForTimeout(2_000);
    expect((await bands(page)).next).toBe(false);
    expect(await page.locator('.keyboard-strip .key.is-next').count()).toBe(0);
  });
});
