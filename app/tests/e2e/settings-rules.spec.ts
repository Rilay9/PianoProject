/**
 * `04` §0 on Settings, which is the densest screen in the app: about forty
 * settings, eight of which fitted a 360 × 780 screen at a hundred pixels
 * apiece — five screens of scrolling to reach one.
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

test.describe('Settings obeys 04 §0', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('at least eight settings on the first screenful (R2)', async ({ page }) => {
    await page.goto('/#/settings');
    await expect(page.locator('.setting-row').first()).toBeVisible();
    const inView = await page.evaluate(
      () =>
        [...document.querySelectorAll('.setting-row')].filter((row) => {
          const box = row.getBoundingClientRect();
          return box.top >= 0 && box.bottom <= window.innerHeight;
        }).length,
    );
    expect(inView).toBeGreaterThanOrEqual(8);
  });

  test('a row without help text is a label and its control on one line (R2)', async ({ page }) => {
    await page.goto('/#/settings');
    await expect(page.locator('.setting-row').first()).toBeVisible();
    const tall = await page.evaluate(() =>
      [...document.querySelectorAll('.setting-row')]
        .filter((row) => {
          // Help text is allowed to make a row taller — it is there because the
          // label could not carry the meaning on its own.
          const help = row.querySelector('.setting-row__text .muted');
          return !help && row.getBoundingClientRect().height > 56;
        })
        .map((row) => `${(row.textContent ?? '').trim().slice(0, 30)}`),
    );
    expect(tall).toEqual([]);
  });

  test('content chips print track titles, not ids (R2)', async ({ page }) => {
    await page.goto('/#/settings');
    const chips = page.locator('#settings-tracks .chip');
    await expect(chips.first()).toBeVisible();
    for (const label of await chips.allTextContents()) {
      // `chords-pop` is an id; `Chords & pop` is what Plan calls the same track.
      expect(label).not.toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});
