/**
 * You can see the beat (P21c §A6).
 *
 * The count-in was clicks only. On a phone on a music stand with the sound
 * low, the first note of a piece therefore arrives unannounced — the one
 * moment a beginner most needs to know when to start. And during the run
 * there was no way to check the tempo except by hearing the click.
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

test.describe('the count-in you can see', () => {
  test('counts the bar over the notation, then gets out of the way', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();

    const countIn = page.locator('#score-countin');
    await expect(countIn).toBeVisible({ timeout: 30_000 });
    // One number per beat of the piece's own bar, and exactly one of them lit.
    const beats = page.locator('#score-countin .score-countin__beat');
    expect(await beats.count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('#score-countin .is-now')).toHaveCount(1);

    // It is a count-in, so it ends when the music starts.
    await expect(countIn).toBeHidden({ timeout: 30_000 });
  });

  test('the beat dot pulses in Tempo and stays away in Wait', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    await expect(page.locator('#score-beat')).toBeVisible({ timeout: 30_000 });
  });

  test('Wait mode shows no beat dot: there is no clock to show', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-running',
      'true',
    );
    await page.waitForTimeout(2_000);
    await expect(page.locator('#score-beat')).toBeHidden();
  });
});
