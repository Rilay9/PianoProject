/**
 * `04` §0 R4 — nothing dead.
 *
 * When a screen's subject is missing it draws the sentence that says so and the
 * one control that acts on it. No empty grid, no live transport over nothing,
 * no "Disconnect" while disconnected, no statistic with no data behind it.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
});

test('a chart with no chords draws the sentence and one button', async ({ page }) => {
  await page.goto('/#/chart/song.folk.hot-cross-buns');
  await expect(page.locator('#chart-status')).toContainText('no chord symbols', {
    timeout: 30_000,
  });
  // The one control that does what the sentence suggests.
  await expect(page.locator('#chart-open-score')).toBeVisible();
  await expect(page.locator('[data-screen="chart"] button')).toHaveCount(2); // back + open
  // And none of the furniture that made it look like a working chart.
  await expect(page.locator('.chart-cell')).toHaveCount(0);
  await expect(page.locator('#chart-form')).toBeHidden();
  await page.locator('#chart-open-score').click();
  await expect(page).toHaveURL(/#\/score\//);
});

test('the microphone screen never says "not connected (not connected)"', async ({ page }) => {
  await page.goto('/#/settings/mic');
  const status = page.locator('#mic-status');
  await expect(status).toBeVisible();
  const text = (await status.textContent()) ?? '';
  expect(text.toLowerCase()).not.toContain('not connected (not connected)');
  // Nothing to disconnect from, so nothing offering to.
  await expect(page.locator('#mic-disconnect')).toBeHidden();
});

test('the score folder draws no browse controls with no folder', async ({ page }) => {
  await page.goto('/#/library/folder');
  await expect(page.locator('#folder-how')).toBeVisible();
  // Filters and a search box over a list that cannot exist yet.
  await expect(page.locator('#folder-search')).toHaveCount(0);
  // The explanation is behind a summary, not four lines above the button.
  await expect(page.locator('#folder-how summary')).toBeVisible();
});

test('the heat map says what it measures and what the shades mean', async ({ page }) => {
  await page.goto('/#/progress');
  await expect(page.getByRole('heading', { name: 'Minutes a day, last 13 weeks' })).toBeVisible();
  const key = page.locator('#progress-heatmap-key');
  await expect(key).toBeVisible();
  await expect(key).toContainText('45+ min');
});
