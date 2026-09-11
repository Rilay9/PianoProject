/**
 * A blind run hides the notation and nothing else.
 *
 * Blind mode is for playing from memory, and the gallery's `blind--upright`
 * cell is 1,400 px of unbroken black between the header and the control bar.
 * That is most of what it is meant to be — except that the three things on the
 * stage which exist *precisely* for when the notation is not available went
 * with it.
 *
 * The stage is hidden as a whole (`visibility: hidden`, so the renderer keeps
 * its box and the keyboard strip does not jump), and `visibility` inherits.
 * Its children are the visible count-in, the beat dot — "the one thing that
 * must be visible while the clock runs", `08` §5.3 — and the corner readout,
 * added for "when the chrome has folded away and nothing else on the screen
 * says it". So a blind run in tempo mode counted itself in invisibly: the one
 * moment a player most needs to know when to start, in the one mode where
 * there is nothing else at all to look at, with a count-in that was built
 * because the sound may be turned down.
 *
 * The notation is the buffers, and a rule below already hides those by name.
 * This pins the rest of the stage back on, because a blank screen and a blank
 * screen with a beat on it are different instruments.
 */
import { expect, test, type Page } from '@playwright/test';

const SONG = 'song.folk.hot-cross-buns';

async function openBlind(page: Page): Promise<void> {
  await page.setViewportSize({ width: 342, height: 740 });
  await page.goto(`/#/score/${SONG}?blind=1`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-blind', 'true', {
    timeout: 60_000,
  });
}

test.describe('a blind run', () => {
  test('still hides the notation', async ({ page }) => {
    await openBlind(page);
    // The whole point, and the thing a previous fix had to rescue once
    // already: `.score-buffer.is-front { visibility: visible }` used to beat
    // the rule that hid the stage, so blind mode drew the score.
    await expect(page.locator('.score-buffer.is-front svg').first()).toBeHidden({ timeout: 30_000 });
  });

  test('counts you in where you can see it', async ({ page }) => {
    await openBlind(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    const countIn = page.locator('#score-countin');
    await expect(countIn, 'the count-in ran invisibly in the one mode with nothing else to see').toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('#score-countin .is-now')).toHaveCount(1);
  });

  test('keeps the beat where you can see it', async ({ page }) => {
    await openBlind(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    // Past the count-in and into the music.
    await expect(page.locator('#score-countin')).toBeHidden({ timeout: 30_000 });
    await expect(page.locator('#score-beat'), 'the beat dot went with the notation').toBeVisible({
      timeout: 30_000,
    });
  });

  test('still says which bar you are in', async ({ page }) => {
    await openBlind(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    const corner = page.locator('#score-corner');
    await expect(corner).toBeVisible({ timeout: 30_000 });
    await expect(corner).not.toHaveText('');
  });
});
