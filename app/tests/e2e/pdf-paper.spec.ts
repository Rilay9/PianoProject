/**
 * Dark paper, and one word about turning the phone (P21d D4, D5).
 *
 * Every other music screen draws light notation on the dark theme. The PDF was
 * a white letter page on a stand in a dark room — the brightest thing in it,
 * beside a score screen that is not.
 */
import { expect, test, type Page } from '@playwright/test';

const PDF = 'tests/fixtures/imports/two-systems.pdf';

async function openPdf(page: Page): Promise<void> {
  await page.goto('/#/library');
  await expect(page.locator('[data-screen="library"]')).toBeVisible({ timeout: 60_000 });
  await page.locator('#library-file').setInputFiles(PDF);
  await expect(page.locator('.list-row[data-item="import.two-systems"]')).toBeVisible({
    timeout: 60_000,
  });
  await page.goto('/#/pdf/import.two-systems');
  await expect(page.locator('[data-screen="pdf"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#pdf-system')).toBeVisible({ timeout: 60_000 });
}

test.describe('dark paper', () => {
  test.use({ colorScheme: 'dark' });

  test('the page is inverted like every other music screen', async ({ page }) => {
    await openPdf(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const filter = await page
      .locator('#pdf-system')
      .evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain('invert');
  });
});

test.describe('light paper', () => {
  test.use({ colorScheme: 'light' });

  test('is left alone', async ({ page }) => {
    await openPdf(page);
    const filter = await page
      .locator('#pdf-system')
      .evaluate((el) => getComputedStyle(el).filter);
    expect(filter === 'none' || !filter.includes('invert')).toBe(true);
  });
});

test.describe('turning the phone', () => {
  test('is said once upright, and not sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openPdf(page);
    await expect(page.locator('#pdf-status')).toHaveText(
      'Turn the phone sideways for a bigger page',
      { timeout: 30_000 },
    );

    // Once. A hint that comes back is an instruction.
    await page.goto('/#/library');
    await page.goto('/#/pdf/import.two-systems');
    await expect(page.locator('#pdf-system')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#pdf-status')).not.toHaveText(
      'Turn the phone sideways for a bigger page',
    );
  });

  test('is never said sideways, where it would be wrong', async ({ page }) => {
    await page.setViewportSize({ width: 780, height: 360 });
    await openPdf(page);
    await expect(page.locator('#pdf-status')).not.toHaveText(
      'Turn the phone sideways for a bigger page',
    );
  });
});
