// U80 temporary: what the sweep's navigation does to the page, piece by piece.
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1000, height: 1000 } });

test('navigation trace', async ({ page }) => {
  test.setTimeout(120_000);
  const pieces = ['song.folk.hot-cross-buns', 'song.folk.hot-cross-buns', 'song.holiday.jingle-bells.rh', 'song.folk.when-the-saints.alternating'];
  for (const piece of pieces) {
    const urlBefore = page.url();
    const before = await page.$('[data-screen="score"]');
    const beforeTitle = before ? await before.evaluate((el) => el.querySelector('h1')?.textContent ?? '') : '(none)';
    await page.goto(`/#/score/${piece}`);
    const urlAfter = page.url();
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    const connected = before ? await before.evaluate((el) => el.isConnected).catch((e: unknown) => `error: ${String(e)}`) : '(none)';
    const count = await page.locator('[data-screen="score"]').count();
    const title = await page.locator('[data-screen="score"] h1').first().textContent();
    console.log(JSON.stringify({ piece, urlBefore, urlAfter, beforeTitle, connected, count, title }));
  }
});
