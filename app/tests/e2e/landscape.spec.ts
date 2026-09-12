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

/** The sub-screens and pushed screens the prompt names (P21d A2, A4, A5). */
const PUSHED: { name: string; route: string; screen: string }[] = [
  { name: 'Skills', route: '/#/plan/skills', screen: 'skills' },
  { name: 'Shelf', route: '/#/library/shelf', screen: 'shelf' },
  { name: 'a lesson', route: '/#/lesson/1.1', screen: 'lesson' },
  { name: 'a drill', route: '/#/drill/drill.reading.grand-staff-flash', screen: 'drill' },
];

for (const one of PUSHED) {
  test(`${one.name} sideways: no h1 at heading size, content near the top`, async ({ page }) => {
    await page.setViewportSize(SIDEWAYS);
    await page.goto(one.route);
    await expect(page.locator(`[data-screen="${one.screen}"]`)).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(800);
    const measured = await page.evaluate(() => {
      const screen = document.querySelector('.screen');
      if (!screen) return null;
      const top = screen.getBoundingClientRect().top;
      const h1 = screen.querySelector('h1');
      const size = h1 ? Number.parseFloat(getComputedStyle(h1).fontSize) : 0;
      const first = screen.querySelector(
        '.list-row, .block, .filters, .filter-row, .drill-stage, .plan-links, .lesson-actions',
      );
      const box = first?.getBoundingClientRect();
      return {
        size,
        firstTop: box ? Math.round(box.top - top) : -1,
        // The two things the numbers below are *about*, measured here rather
        // than written in as constants: a title at body size is a title the
        // same size as the app's text, and "the chrome does not eat a short
        // screen" is a share of that screen.
        bodySize: Math.round(Number.parseFloat(getComputedStyle(document.body).fontSize)),
        viewportH: window.innerHeight,
      };
    });
    expect(measured).not.toBeNull();
    // A title at body size on the back link's line, not a heading of its own.
    // Against the body's own size rather than a number, because "body size" is
    // what the rule says and 18 px was only what that came to here.
    const body = measured?.bodySize ?? 16;
    expect(
      measured?.size ?? 99,
      `${one.name}'s title is ${String(measured?.size)}px sideways against body text at ${String(body)}px`,
    ).toBeLessThanOrEqual(body + 2);
    // And the chrome above the first content takes under a fifth of a screen
    // that is only 342 px tall. A share, not a pixel count: a wider font makes
    // the header taller on the runner without anything being wrong.
    const fold = (measured?.viewportH ?? 342) / 5;
    expect(
      measured?.firstTop ?? 999,
      `${one.name}'s first content starts ${String(measured?.firstTop)}px down, a fifth of the screen is ${String(Math.round(fold))}px`,
    ).toBeLessThan(fold);
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

test('Settings sideways shows twice as many rows (B5)', async ({ page }) => {
  await page.setViewportSize(SIDEWAYS);
  await page.goto('/#/settings');
  await expect(page.locator('[data-screen="settings"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(600);
  const visible = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.setting-row')];
    return rows.filter((row) => {
      const box = row.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= window.innerHeight;
    }).length;
  });
  // It was five of forty on a 360 px screen. Two columns of the most uniform
  // rows in the app — a label, a control, sometimes a sentence — is ten.
  console.log(`settings sideways: ${String(visible)} rows on the first screenful`);
  expect(visible).toBeGreaterThanOrEqual(8);
});
