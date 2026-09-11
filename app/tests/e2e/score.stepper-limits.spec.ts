/**
 * A stepper that has run out of room has to say so — and cost nothing.
 *
 * `Bars in window` and `Size` are the two steppers in the `⋯` sheet, and
 * neither had any notion of an end. `Bars` clamps at 1 and 8 and `Size` at
 * 50 % and 250 %, and past those the buttons stayed lit and simply absorbed
 * the press. On a phone, where a tap has no other feedback, a lit button that
 * does nothing reads as a control that has stopped working, and the honest
 * reading is the worse one: the owner reported the notes as too small and the
 * way to find out that `−` was already at the floor was to give up on it.
 *
 * Worse than the appearance was the price. Both setters ran their whole body
 * on the clamped value: write the setting, re-seat the renderer — and because
 * re-engraving recreates every element a run's judgements are keyed to,
 * `setBars` **restarted the run**. So a tap that changed nothing threw away
 * the pass you were in the middle of. `setLayout` guards this with an early
 * return and always has; these two never did.
 *
 * `Size` also had no readout at all, where `Bars` says `2 bars` between its
 * buttons. Twelve presses and the control still would not say where it had
 * got to, which is what makes "put it back how it was" impossible.
 */
import { expect, test, type Page } from '@playwright/test';
import { openScoreMenu } from './scoreControls';

const SONG = 'song.folk.hot-cross-buns';

/** `MIN_BARS_PER_WINDOW` / `MAX_BARS_PER_WINDOW` in `WindowRenderer`. */
const BARS_MIN = 1;
const BARS_MAX = 8;

async function openSheet(page: Page): Promise<void> {
  await page.setViewportSize({ width: 342, height: 740 });
  await page.goto(`/#/score/${SONG}`);
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await openScoreMenu(page);
}

/** Presses a stepper button until it goes dead, and says how many times. */
async function pressToEnd(page: Page, selector: string, limit: number): Promise<number> {
  const button = page.locator(selector);
  for (let i = 0; i < limit; i += 1) {
    if (await button.isDisabled()) return i;
    await button.click();
    await page.waitForTimeout(60);
  }
  return limit;
}

test.describe('the ends of the two steppers', () => {
  test('bars: the button goes dead at one bar and at eight, and only there', async ({ page }) => {
    await openSheet(page);
    const down = page.locator('#score-bars-down');
    const up = page.locator('#score-bars-up');
    const label = page.locator('#score-bars');

    // Down to the floor. Fewer than a dozen presses, or the clamp is not where
    // this test thinks it is.
    await pressToEnd(page, '#score-bars-down', 12);
    await expect(label).toHaveText(`${String(BARS_MIN)} bar`);
    await expect(down).toBeDisabled();
    // And the other end is still live: a stepper stuck at both ends is worse
    // than one stuck at neither.
    await expect(up).toBeEnabled();

    // Up to the ceiling.
    await pressToEnd(page, '#score-bars-up', 12);
    await expect(label).toHaveText(`${String(BARS_MAX)} bars`);
    await expect(up).toBeDisabled();
    await expect(down).toBeEnabled();
  });

  test('size: there is a number between the buttons, and it moves', async ({ page }) => {
    await openSheet(page);
    const level = page.locator('#score-zoom-level');
    await expect(level).toBeVisible();
    const before = await level.textContent();
    expect(before, 'the size control says nothing about where it is').toMatch(/^\d+%$/);

    await page.locator('#score-zoom-in').click();
    await page.waitForTimeout(80);
    const after = await level.textContent();
    expect(Number.parseInt(after ?? '0', 10)).toBeGreaterThan(Number.parseInt(before ?? '0', 10));
  });

  test('size: both ends go dead where the range stops', async ({ page }) => {
    await openSheet(page);
    // 50 % to 250 % in tenths is twenty presses either way; allow a few more
    // than the worst case, and stop the moment the button dies.
    await pressToEnd(page, '#score-zoom-out', 25);
    await expect(page.locator('#score-zoom-level')).toHaveText('50%');
    await expect(page.locator('#score-zoom-out')).toBeDisabled();
    await expect(page.locator('#score-zoom-in')).toBeEnabled();

    await pressToEnd(page, '#score-zoom-in', 25);
    await expect(page.locator('#score-zoom-level')).toHaveText('250%');
    await expect(page.locator('#score-zoom-in')).toBeDisabled();
    await expect(page.locator('#score-zoom-out')).toBeEnabled();
  });

  test('a press that cannot change anything does not restart the run', async ({ page }) => {
    // This is the guard *behind* the dead button, and it is the half that
    // actually hurt: a re-engraving restarts the run. The button is disabled
    // now, so the press has to be made the way a stale frame or a repeated
    // key would make it — the point is that the handler itself refuses.
    await page.setViewportSize({ width: 342, height: 740 });
    await page.goto(`/#/score/${SONG}`);
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });

    await openScoreMenu(page);
    await pressToEnd(page, '#score-bars-down', 12);
    await expect(page.locator('#score-bars')).toHaveText('1 bar');
    await page.locator('#score-more-sheet-close').click();

    // A run with a count-in, so a restart is something a test can see.
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    const countIn = page.locator('#score-countin');
    await expect(countIn).toBeVisible({ timeout: 30_000 });
    await expect(countIn).toBeHidden({ timeout: 30_000 });

    // Now the press that changes nothing.
    await openScoreMenu(page);
    await page.locator('#score-bars-down').evaluate((el: HTMLElement) => {
      (el as HTMLButtonElement).disabled = false;
      el.click();
    });
    await page.waitForTimeout(500);

    expect(
      await countIn.isVisible(),
      'the count-in came back, so pressing − at one bar restarted the run',
    ).toBe(false);
    await expect(page.locator('#score-bars')).toHaveText('1 bar');
  });
});
