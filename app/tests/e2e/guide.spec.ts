/**
 * The guide (docs/04 §7e): reachable from Settings, every section with its
 * picture shipped, and every "open" button landing on the screen it names.
 */
import { expect, test } from '@playwright/test';

test.describe('the guide', () => {
  test('opens from Settings, with every section and every picture', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#open-guide').click();
    const guide = page.locator('[data-screen="guide"]');
    await expect(guide).toBeVisible({ timeout: 60_000 });
    await expect(guide.locator('.guide-section')).toHaveCount(11);

    // Every picture the guide names is a file the build ships: a missing one
    // would be a broken box on the phone, and this is the only place it shows.
    const sources = await guide.locator('.guide-figure img').evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));
    expect(sources.length).toBeGreaterThanOrEqual(11);
    for (const src of sources) {
      const response = await page.request.get(src);
      expect(response.status(), `${src} is missing`).toBe(200);
      expect(Number(response.headers()['content-length'] ?? '1'), `${src} is empty`).toBeGreaterThan(1000);
    }
  });

  test('the section buttons open the screens they describe', async ({ page }) => {
    await page.goto('/#/settings/guide');
    await expect(page.locator('[data-screen="guide"]')).toBeVisible({ timeout: 60_000 });
    await page.locator('#guide-open-folder-browse-a-score-folder').click();
    await expect(page.locator('[data-screen="folder"]')).toBeVisible();
    await page.goto('/#/settings/guide');
    await page.locator('#guide-open-piano-run-the-setup-tour').click();
    await expect(page.locator('[data-screen="setup"]')).toBeVisible({ timeout: 60_000 });
  });

  test('the contents jump within the page and the sections read in order', async ({ page }) => {
    await page.goto('/#/settings/guide');
    await expect(page.locator('[data-screen="guide"]')).toBeVisible({ timeout: 60_000 });
    const titles = await page.locator('.guide-section h2').allTextContents();
    expect(titles[0]).toBe('What it does');
    expect(titles).toContain('A whole folder of scores');
    expect(titles).toContain('PDF sheet music');
    await page.locator('.guide-contents__link', { hasText: 'PDF sheet music' }).click();
    expect(new URL(page.url()).hash).toBe('#/settings/guide');
  });
});
