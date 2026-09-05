/**
 * Today (docs/04 §2).
 *
 * The two things worth guarding are the ones the owner asked for by name: a
 * session built from the templates in curriculum Part A §8, and **"Swap this"
 * on every row** with a "not a song" filter — because half the point of the
 * exercise breadth is that a skill can be practised without a tune attached
 * (`00` D21).
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

test.describe('Today', () => {
  test('shows a weekly goal, an input chip, and a session card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-goal')).toContainText('minutes this week');
    await expect(page.locator('#today-input')).toBeVisible();
    await expect(page.locator('#today-card .list-row').first()).toBeVisible();
    await expect(page.locator('#today-status')).toContainText('Working on Stage');
  });

  test('the four session lengths build different cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#today-length-15')).toBeVisible();
    await page.locator('#today-length-15').click();
    await expect(page.locator('#today-length-15')).toHaveAttribute('aria-pressed', 'true');
    const short = await page.locator('#today-card .list-row').count();

    await page.locator('#today-length-120').click();
    const long = await page.locator('#today-card .list-row').count();
    expect(long).toBeGreaterThan(short);
    // docs/02 §8: the two-hour session is two halves with a break between.
    await expect(page.locator('#today-break')).toBeVisible();
  });

  test('remembers the session length across a reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('#today-length-60').click();
    await page.reload();
    await expect(page.locator('#today-length-60')).toHaveAttribute('aria-pressed', 'true');
  });

  test('"Swap this" offers alternatives and can exclude songs', async ({ page }) => {
    await page.goto('/');
    const firstRow = page.locator('#today-card .list-row').first();
    await firstRow.getByRole('button', { name: 'Swap' }).click();
    await expect(page.locator('#today-swap')).toBeVisible();
    await expect(page.locator('#today-swap-notasong')).toBeVisible();

    const options = page.locator('#today-swap .list-row');
    await expect(options.first()).toBeVisible();
    const title = await firstRow.locator('.list-row__title').textContent();

    await options.first().click();
    await expect(page.locator('#today-swap')).toHaveCount(0);
    await expect(firstRow.locator('.list-row__title')).not.toHaveText(title ?? '');
    await expect(firstRow).toContainText('You chose this one');
  });

  test('the "not a song" filter removes songs from the swap sheet', async ({ page }) => {
    await page.goto('/');
    // The "New" row is the one that offers songs, so it is the one where the
    // filter has anything to do.
    const newRow = page.locator('#today-card .list-row[data-slot="new"]').first();
    await newRow.getByRole('button', { name: 'Swap' }).click();
    const sheet = page.locator('#today-swap');
    await expect(sheet).toBeVisible();

    const withSongs = await sheet.locator('.list-row').count();
    await page.locator('#today-swap-notasong').click();
    await expect(page.locator('#today-swap-notasong')).toHaveAttribute('aria-pressed', 'true');
    const withoutSongs = await sheet.locator('.list-row').count();
    expect(withoutSongs).toBeLessThanOrEqual(withSongs);
    await expect(sheet.locator('.list-row', { hasText: '· song' })).toHaveCount(0);
  });

  test('shuffle rebuilds the card', async ({ page }) => {
    await page.goto('/');
    const before = await page.locator('#today-card').textContent();
    await page.locator('#today-shuffle').click();
    await expect
      .poll(async () => page.locator('#today-card').textContent())
      .not.toBe(before);
  });

  test('starting the session opens the first row', async ({ page }) => {
    await page.goto('/');
    await page.locator('#today-start').click();
    // The warm-up row is usually a drill, which since P8 has a screen of its
    // own; a bundled exercise is notation and opens the Score screen.
    await expect(page).toHaveURL(/#\/(score|drill)\//);
    await expect(page.locator('[data-screen="drill"], [data-screen="score"]')).toBeVisible();
  });
});
