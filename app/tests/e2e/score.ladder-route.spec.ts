/**
 * `?ladder=1` lands where it says it does (`04` §3d, `05` §6).
 *
 * A rung's tool button is only worth having if the tap arrives somewhere
 * specific, so what is asserted here is the **destination** and not the
 * control: the Score screen open on one of the rung's own exercises, looping
 * the whole of it, with the Ladder row showing the toggle pressed. Both of
 * those are on the screen element, which is how the app already lets a test ask
 * "did it open looping" without opening the `⋯` sheet first.
 *
 * The other half — that the ladder then climbs — is `score.rhythm-ladder.spec.ts`,
 * which drives a real run to the ceiling. Nothing here plays a note.
 *
 * The three refusals matter as much as the arrival. `05` §6 records a ladder
 * left on with nothing on screen having asked, and it moved the tempo by itself
 * a session later; a route that turned it on and hoped would be that fault with
 * a URL in front of it.
 */
import { expect, test, type Page } from '@playwright/test';

import { openScoreMenu } from './scoreControls';

/**
 * A two-octave C major scale, which is what `4.1` offers first.
 *
 * An *exercise*, deliberately: the whole-item loop is what these seven rungs
 * are, and this file would prove nothing about them on a song.
 */
const EXERCISE = 'exercise.scale.c-major.2oct.similar.both.2';

async function openScore(page: Page, query: string): Promise<void> {
  await page.goto(`/#/score/${EXERCISE}${query}`);
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
}

/** How long the piece is, read off the screen rather than written down here. */
async function lastBar(page: Page): Promise<string> {
  const text = (await page.locator('#score-where').textContent()) ?? '';
  const match = /\/\s*(\d+)/.exec(text);
  expect(match, `no bar count in "${text}"`).not.toBeNull();
  return match?.[1] ?? '';
}

test('opens looping the whole exercise with the ladder on', async ({ page }) => {
  await openScore(page, '?ladder=1');
  const screen = page.locator('section[data-screen="score"]');
  // The whole item, to the last bar the screen itself names — not a bar count
  // copied in here, which would be a number measured on one machine's content.
  await expect(screen).toHaveAttribute('data-loop', `1-${await lastBar(page)}`);
  await expect(screen).toHaveAttribute('data-ladder', 'on');
  await expect(screen).toHaveAttribute('data-mode', 'tempo');

  // …and both controls say so in the sheet, which is the invariant `05` §6 is
  // protecting: two things on screen have asked for this.
  await openScoreMenu(page);
  await expect(page.locator('#score-ladder-row')).toBeVisible();
  await expect(page.locator('#score-ladder')).toHaveText('On');
  await expect(page.locator('#score-loop')).not.toHaveText('Off');
});

test('clearing the loop switches the ladder off, exactly as it does by hand', async ({ page }) => {
  await openScore(page, '?ladder=1');
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-ladder', 'on');
  await openScoreMenu(page);
  await page.locator('#score-loop').click();
  await expect(screen).toHaveAttribute('data-loop', '');
  await expect(screen).toHaveAttribute('data-ladder', 'off');
  await expect(page.locator('#score-ladder-row')).toBeHidden();
});

test('does nothing at all in a mode with no tempo to move', async ({ page }) => {
  await openScore(page, '?mode=wait&ladder=1');
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-mode', 'wait');
  await expect(screen).toHaveAttribute('data-ladder', 'off');
  // No loop either: a loop nobody asked for is the same control acting unasked,
  // one step earlier.
  await expect(screen).toHaveAttribute('data-loop', '');
});

test('does nothing in a performance, which is one pass and never repeats', async ({ page }) => {
  await openScore(page, '?performance=1&ladder=1');
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-ladder', 'off');
  await expect(screen).toHaveAttribute('data-loop', '');
});

test('and the screen opens with neither when nothing asks', async ({ page }) => {
  await openScore(page, '');
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-ladder', 'off');
  await expect(screen).toHaveAttribute('data-loop', '');
});
