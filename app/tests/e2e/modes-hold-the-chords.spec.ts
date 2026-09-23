/**
 * Hold the chords, met from the rung that asks for it (T17; `04` §3c).
 *
 * `lab-both-ways.spec.ts` proves the chips, the exclusivity and the fail-closed
 * rule. What it does not do is arrive the way a learner arrives — `blues.3`'s
 * lesson says the lab "holds the changes underneath you: pick blue notes over
 * the top", and the only way to find out whether that is true is to press the
 * rung's own button, start the loop, play a note over it and read what comes
 * back.
 *
 * The playability questions this file asks, which an id cannot answer:
 *
 *  - the chart, the bar counter and the keys are on the screen at once on a
 *    342 px phone, because a comping loop the learner has to scroll to see is
 *    not one (`04` §0 R1);
 *  - the read-ahead is the chart itself: the *next* bar's chord is printed and
 *    on screen while the current one is marked, so there is time to play it;
 *  - one time round says what it was worth, in counts and with no mark;
 *  - Stop stops and leaves the chart standing (§3c), and Back leaves the mode
 *    off.
 *
 * **Nothing here is heard.** The bed can comp in the wrong voicing, in the
 * wrong octave, or out of time with the drums, and every assertion below would
 * still pass.
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
      // Every explain-it-once card counts as seen, for the same reason the
      // tour counts as skipped: this spec is not about meeting them
      // (`04` §5f, `help-strip.spec.ts` is the one that drives them).
      localStorage.setItem('pianopath.firstSight', '["*"]');
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

/** The rung, its button, and the lab it opens already holding the chords. */
async function holdFromTheRung(page: Page): Promise<void> {
  await page.setViewportSize(PHONE);
  await page.goto('/#/lesson/blues.3');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const tool = page.locator('#lesson-tool-lab');
  await expect(tool).toBeVisible();
  const declared = await tool.getAttribute('data-preset');
  expect(declared, 'blues.3’s lab tool names no preset, so this proves nothing').toBeTruthy();
  await tool.click();
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
  await expect(page.locator('#lab-preset')).toHaveAttribute('data-preset', declared ?? '');
}

test('the rung’s button opens the lab already holding the chords', async ({ page }) => {
  await holdFromTheRung(page);
  // The preset carries the way round, which is how a rung asks for one: the
  // `tools` entry is closed to `kind`, `preset`, `item` and `label`.
  await expect(page.locator('#lab-bed-hold')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-bed', 'hold');
  // And the chip row says what it does, in the learner's words, on the screen
  // rather than in a tooltip a phone does not have.
  await expect(page.locator('#lab-plays-row')).toContainText('Hold the chords');
});

test('the loop runs with the chart, the counter and the keys in one glance', async ({ page }) => {
  test.setTimeout(180_000);
  await holdFromTheRung(page);
  await page.locator('#lab-bpm').fill('240');
  await page.locator('#lab-bpm').blur();
  await page.locator('#lab-jam-start').click();

  const screen = page.locator('section[data-screen="lab"]');
  await expect(screen).toHaveAttribute('data-jam', 'running', { timeout: 60_000 });
  await expect(screen).toHaveAttribute('data-bed', 'hold');
  // What is going on, said where the learner is looking, and the lab's own
  // promise in the same line.
  await expect(page.locator('#lab-status')).toContainText('holding the chords');
  await expect(page.locator('#lab-status')).toContainText('nothing can be passed or failed');

  // The three things a comping loop is: the chart, the bar counter and the
  // instrument. All three on the screen at once, or the learner is reading
  // one of them from memory.
  for (const id of ['#lab-jam-grid', '#lab-jam-form', '#lab-strip']) {
    expect(await withoutScrolling(page, id), `${id} is off the screen while the loop runs`).toBe(
      true,
    );
  }

  // The read-ahead. There is no clock-driven cue here and there does not need
  // to be one: the whole form is printed, the sounding bar is marked, and the
  // bar *after* it is on the screen with its chord already legible.
  const current = page.locator('#lab-jam-grid .chart-cell[data-current="true"]');
  await expect(current).toHaveCount(1);
  const currentBar = Number(await current.getAttribute('data-bar'));
  const next = page.locator(`#lab-jam-grid .chart-cell[data-bar="${String(currentBar + 1)}"]`);
  if ((await next.count()) === 1) {
    await expect(next).not.toBeEmpty();
    expect(
      await withoutScrolling(page, `#lab-jam-grid .chart-cell[data-bar="${String(currentBar + 1)}"]`),
      'the next bar’s chord is off the screen, so there is no time to read it',
    ).toBe(true);
  }

  // Play something over it, and read what a time round was worth.
  await page.locator('#lab-strip .key[data-midi="60"]').click();
  const verdict = page.locator('#lab-bed-verdict');
  await expect(verdict).toContainText('Time round', { timeout: 90_000 });
  // A count of notes in the scale the progression teaches — the honest
  // measure under this way round — and no mark anywhere on the line.
  await expect(verdict).toContainText('scale');
  await expect(verdict).not.toContainText(/Passed|Failed|%/);

  // Stop stops, and leaves the chart standing: reading one is what somebody
  // stopped the loop to do.
  await page.locator('#lab-jam-stop').click();
  await expect(screen).toHaveAttribute('data-jam', 'stopped');
  await expect(page.locator('#lab-jam-grid .chart-cell').first()).toBeVisible();
});

test('Back leaves the mode off — and the lab reopens on the preset, not on the run', async ({
  page,
}) => {
  await holdFromTheRung(page);
  await page.locator('#lab-jam-start').click();
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'running', {
    timeout: 60_000,
  });
  await page.locator('#lab-back').click();
  await expect(page.locator('section[data-screen="library"]')).toBeVisible();

  await holdFromTheRung(page);
  // The preset's way round comes back, because that is what the rung asked
  // for; the *run* does not, which is `05` §6's rule on this screen.
  await expect(page.locator('#lab-bed-hold')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'idle');
  await expect(page.locator('#lab-jam')).toBeHidden();
});
