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
    await expect(page.locator('.card h1')).toHaveText('Today');
    for (const tab of TABS) {
      await expect(page.locator(`button.tab-button[data-tab="${tab.id}"]`)).toBeVisible();
    }
    await expect(page.locator('button.tab-button[data-tab="today"]')).toHaveClass(/active/);
  });

  test('clicking each tab renders its screen and updates the hash', async ({ page }) => {
    await page.goto('/');
    for (const tab of TABS) {
      await page.locator(`button.tab-button[data-tab="${tab.id}"]`).click();
      await expect(page.locator('.card h1')).toHaveText(tab.heading);
      await expect(page.locator(`button.tab-button[data-tab="${tab.id}"]`)).toHaveClass(/active/);
      expect(new URL(page.url()).hash).toBe(`#/${tab.id}`);
    }
  });

  test('reloading on a non-default tab stays on that tab (hash survives reload)', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await expect(page.locator('.card h1')).toHaveText('Library');
    await page.reload();
    await expect(page.locator('.card h1')).toHaveText('Library');
  });

  test('browser back navigates to the previous tab', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.tab-button[data-tab="plan"]').click();
    await expect(page.locator('.card h1')).toHaveText('Plan');
    await page.goBack();
    await expect(page.locator('.card h1')).toHaveText('Today');
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
