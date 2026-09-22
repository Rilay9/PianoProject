/**
 * Play the tune, met from the rung that asks for it (T17; `04` §3c, §3d).
 *
 * The reverse way round: the app takes the right hand and the learner comps
 * underneath. `3.2` is the rung that wanted the opposite of what its preset
 * opens on, and `mode` on the `tools` entry is what let it say so — so the
 * thing to check is not that the field parses but that pressing the rung's
 * button lands on a screen already set that way, with something to comp over
 * and somewhere to comp it.
 *
 * Judged as a learner: the chart and the keys in one glance on a 342 px phone,
 * the bar counter moving, one time round counted and not marked, Stop
 * stopping, Back leaving it off.
 *
 * **Nothing here is heard.** Whether the app's right hand is in time, in the
 * key, or worth playing under is not something any assertion in this file
 * touches.
 */
import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 342, height: 740 };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

async function withoutScrolling(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight;
  }, selector);
}

/** `3.2`'s own button, which names both a preset and the way round. */
async function tuneFromTheRung(page: Page): Promise<void> {
  await page.setViewportSize(PHONE);
  await page.goto('/#/lesson/3.2');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const tool = page.locator('#lesson-tool-lab');
  await expect(tool).toBeVisible();
  await tool.click();
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
}

test('the rung’s button opens the lab with the app on the right hand', async ({ page }) => {
  await tuneFromTheRung(page);
  // The rung asked for the opposite of what its preset opens on, and the
  // arrival is what proves the field was honoured rather than parsed.
  await expect(page.locator('#lab-bed-tune')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-bed', 'tune');
  // It plays the picker's answer, not a second one: the chip is only live
  // because the right hand is set to something.
  await expect(page.locator('#lab-bed-tune')).toBeEnabled();
  await expect(page.locator('#lab-bed-why')).toBeHidden();
});

test('the loop runs, the chart and the keys are in one glance, and a pass is counted', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await tuneFromTheRung(page);
  await page.locator('#lab-bpm').fill('240');
  await page.locator('#lab-bpm').blur();
  await page.locator('#lab-jam-start').click();

  const screen = page.locator('section[data-screen="lab"]');
  await expect(screen).toHaveAttribute('data-jam', 'running', { timeout: 60_000 });
  await expect(screen).toHaveAttribute('data-bed', 'tune');
  await expect(page.locator('#lab-status')).toContainText('comp the chords underneath');
  await expect(page.locator('#lab-status')).toContainText('nothing can be passed or failed');

  for (const id of ['#lab-jam-grid', '#lab-jam-form', '#lab-strip']) {
    expect(await withoutScrolling(page, id), `${id} is off the screen while the loop runs`).toBe(
      true,
    );
  }

  // The bar counter moves, which is the only thing on this screen that says
  // the loop is going round rather than stuck on bar 1.
  const form = page.locator('#lab-jam-form');
  const first = (await form.textContent()) ?? '';
  await expect(form).not.toHaveText(first, { timeout: 60_000 });

  // Comp something under it, and read what the time round was worth: under
  // this way round the honest count is the bar's own chord, because a learner
  // comping *is* aiming at it.
  await page.locator('#lab-strip .key[data-midi="60"]').click();
  const verdict = page.locator('#lab-bed-verdict');
  await expect(verdict).toContainText('Time round', { timeout: 90_000 });
  await expect(verdict).toContainText('chord');
  await expect(verdict).not.toContainText(/Passed|Failed/);

  await page.locator('#lab-jam-stop').click();
  await expect(screen).toHaveAttribute('data-jam', 'stopped');
  await expect(page.locator('#lab-jam-grid .chart-cell').first()).toBeVisible();
});

test('Back leaves the mode off, and the way round comes back from the rung', async ({ page }) => {
  await tuneFromTheRung(page);
  await page.locator('#lab-jam-start').click();
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'running', {
    timeout: 60_000,
  });
  await page.locator('#lab-back').click();
  await expect(page.locator('section[data-screen="library"]')).toBeVisible();

  await tuneFromTheRung(page);
  await expect(page.locator('#lab-bed-tune')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'idle');
  await expect(page.locator('#lab-jam')).toBeHidden();
});
