import { expect, test } from '@playwright/test';

const TABS: { id: string; heading: string }[] = [
  { id: 'today', heading: 'Today' },
  { id: 'plan', heading: 'Plan' },
  { id: 'library', heading: 'Library' },
  { id: 'progress', heading: 'Progress' },
  { id: 'settings', heading: 'Settings' },
];

test.describe('app shell', () => {
  test('lands on Today by default and shows all five tabs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.screen h1')).toHaveText('Today');
    for (const tab of TABS) {
      await expect(page.locator(`button.tab-button[data-tab="${tab.id}"]`)).toBeVisible();
    }
    await expect(page.locator('button.tab-button[data-tab="today"]')).toHaveClass(/active/);
  });

  test('clicking each tab renders its screen and updates the hash', async ({ page }) => {
    await page.goto('/');
    for (const tab of TABS) {
      await page.locator(`button.tab-button[data-tab="${tab.id}"]`).click();
      await expect(page.locator('.screen h1')).toHaveText(tab.heading);
      await expect(page.locator(`button.tab-button[data-tab="${tab.id}"]`)).toHaveClass(/active/);
      expect(new URL(page.url()).hash).toBe(`#/${tab.id}`);
    }
  });

  test('reloading on a non-default tab stays on that tab (hash survives reload)', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await expect(page.locator('.screen h1')).toHaveText('Library');
    await page.reload();
    await expect(page.locator('.screen h1')).toHaveText('Library');
  });

  test('browser back navigates to the previous tab', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.tab-button[data-tab="plan"]').click();
    await expect(page.locator('.screen h1')).toHaveText('Plan');
    await page.goBack();
    await expect(page.locator('.screen h1')).toHaveText('Today');
  });

  test('theme selector toggles data-theme on the document', async ({ page }) => {
    await page.goto('/#/settings');
    const select = page.locator('#theme-select');
    await select.selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await select.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('theme preference persists across reload', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#theme-select').selectOption('dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-select')).toHaveValue('dark');
  });
});

/**
 * The document never scrolls; the screen's own body does.
 *
 * From a photograph of the real phone: scrolling to the bottom of the Library
 * carried the **tab bar** up with the content and left about three thousand
 * pixels of background under it. The app is a shell with a scrolling region
 * inside it, and the region was leaking — so a thumb was dragging the whole
 * document, tab bar and all.
 */
test.describe('the shell holds still while a list scrolls', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('the tab bar stays on the bottom of the screen', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(500);

    const nav = page.locator('.tab-nav');
    const atRest = await nav.boundingBox();
    expect(atRest, 'no tab bar').toBeTruthy();

    // A long, thumb-like drag over the middle of the list.
    await page.mouse.move(180, 400);
    for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);

    const after = await page.evaluate(() => {
      const bar = document.querySelector('.tab-nav')!.getBoundingClientRect();
      const body = document.querySelector('.screen-body')!;
      return {
        documentMoved: Math.round(document.scrollingElement?.scrollTop ?? 0),
        gapUnderTheBar: Math.round(window.innerHeight - bar.bottom),
        listMoved: Math.round(body.scrollTop),
      };
    });

    expect(after.documentMoved, 'the whole page scrolled').toBe(0);
    expect(after.gapUnderTheBar, 'the tab bar left the bottom of the screen').toBeLessThanOrEqual(1);
    // And the point of scrolling still happened.
    expect(after.listMoved, 'the list did not scroll at all').toBeGreaterThan(200);
  });
});
