/**
 * R5 — sideways on a phone, the header is one line (P21d §A).
 *
 * The owner: "the landscape on phone I feel like could be way better use of
 * the space." A phone held sideways is 780 × 360, and every screen was
 * spending its first 40 % on a header carrying nothing the side nav does not
 * already say — a title, a back link, and 170 px of dead margin either side of
 * a card shaped for a portrait screen.
 */
import { expect, test, type Page } from '@playwright/test';

const SIDEWAYS = { width: 780, height: 360 };

/** Where the first thing worth reading starts, and whether a title is drawn. */
async function header(page: Page): Promise<{ firstTop: number; titles: number }> {
  return page.evaluate(() => {
    const screen = document.querySelector('.screen');
    if (!screen) return { firstTop: -1, titles: -1 };
    const top = screen.getBoundingClientRect().top;
    const titles = [...screen.querySelectorAll('h1')].filter(
      (el) => el.getBoundingClientRect().height > 0,
    ).length;
    // The first element that carries content rather than chrome.
    const first = screen.querySelector(
      '.list-row, .block, .filters, .filter-row, .today-goal, .chip-row, .plan-links',
    );
    const box = first?.getBoundingClientRect();
    return { firstTop: box ? Math.round(box.top - top) : -1, titles };
  });
}

const TABS: { name: string; route: string; screen: string }[] = [
  { name: 'Today', route: '/#/today', screen: 'today' },
  { name: 'Plan', route: '/#/plan', screen: 'plan' },
  { name: 'Library', route: '/#/library', screen: 'library' },
  { name: 'Progress', route: '/#/progress', screen: 'progress' },
  { name: 'Settings', route: '/#/settings', screen: 'settings' },
];

for (const tab of TABS) {
  test(`${tab.name} sideways: no title, content near the top`, async ({ page }) => {
    await page.setViewportSize(SIDEWAYS);
    await page.goto(tab.route);
    await expect(page.locator(`[data-screen="${tab.screen}"]`)).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(600);
    const { firstTop, titles } = await header(page);
    expect(titles, `${tab.name} still draws an h1 sideways`).toBe(0);
    expect(firstTop, `${tab.name}'s first content starts ${String(firstTop)}px down`).toBeLessThan(
      48,
    );
  });
}

test('a sub-screen puts Back and its title on one line', async ({ page }) => {
  await page.setViewportSize(SIDEWAYS);
  await page.goto('/#/plan/skills');
  await expect(page.locator('[data-screen="skills"]')).toBeVisible({ timeout: 60_000 });
  const line = await page.evaluate(() => {
    const back = document.querySelector('.sub-head .back-link');
    const title = document.querySelector('.sub-head h1');
    if (!back || !title) return null;
    const a = back.getBoundingClientRect();
    const b = title.getBoundingClientRect();
    return { sameLine: Math.abs(a.top - b.top) < 20, backRight: a.right, titleLeft: b.left };
  });
  expect(line).not.toBeNull();
  expect(line?.sameLine, 'Back and the title are on separate lines').toBe(true);
  expect(line?.titleLeft ?? 0).toBeGreaterThan(line?.backRight ?? 0);
});

test('a sub-screen card uses the width sideways', async ({ page }) => {
  await page.setViewportSize(SIDEWAYS);
  await page.goto('/#/settings/mic');
  await expect(page.locator('[data-screen="mic"]')).toBeVisible({ timeout: 60_000 });
  const share = await page.evaluate(() => {
    const card = document.querySelector('.card')?.getBoundingClientRect().width ?? 0;
    const room = document.querySelector('.screen')?.getBoundingClientRect().width ?? 1;
    return card / room;
  });
  // It was 610 px of the room the screen has, with dead margin either side of
  // it. Measured as a share of that room rather than of the viewport, because
  // the side nav takes its own width first and is not margin.
  expect(share).toBeGreaterThan(0.95);
});
