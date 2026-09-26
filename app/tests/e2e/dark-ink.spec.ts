/**
 * Notation has to be readable in the dark (`04` §0).
 *
 * OSMD paints black on transparent and the app inverts the whole SVG rather
 * than restyling hundreds of VexFlow primitives. The rule named one host — the
 * Score screen's buffer — so the four bars a transposition drill draws were
 * black on a dark card: the one thing on the screen the drill is about, and
 * invisible. Anywhere an `OsmdView` is on the screen has to be in that rule.
 */
import { expect, test } from '@playwright/test';

test.use({ colorScheme: 'dark' });

async function inverted(page: import('@playwright/test').Page, selector: string): Promise<string> {
  return page.locator(selector).evaluate((el) => getComputedStyle(el).filter);
}

test('the drill draws its notation in light ink on a dark card', async ({ page }) => {
  await page.goto('/#/drill/drill.reading.transposition');
  await expect(page.locator("html")).toHaveAttribute('data-theme', 'dark');
  const svg = page.locator('#drill-notation svg').first();
  await expect(svg).toBeVisible({ timeout: 60_000 });
  expect(await inverted(page, '#drill-notation svg')).toContain('invert');
});

test('and so does the score screen, which is where the rule came from', async ({ page }) => {
  await page.goto('/#/score/exercise.five-finger.c-major.right');
  // Revised 2026-09-25 (test class: revise). The old test read the filter as soon as
  // the front buffer was visible and assumed the theme attribute was already on
  // `<html>`; on CI's slower runner the sheet drew first and the filter read as the
  // empty string, failing on two runs in five while passing here every time. The
  // rule under test is a stylesheet rule on `[data-theme='dark'] .score-buffer svg`,
  // so the theme is the precondition and is waited for, as the drill test above does.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // Revised 2026-09-27 (test class: revise). The read above waited for the *front*
  // buffer's SVG and then read the filter on the *cursor* buffer's, which under CI
  // load was not yet drawn (twice in five pushes the string came back empty). The
  // old assumption: the cursor buffer has its SVG as soon as the front one is
  // visible. Now the test waits on the renderer's own settled state (T41) and reads
  // the buffer it waited for; the rule is on every `.score-buffer svg`.
  await page.waitForSelector('.score-view[data-settled]', { timeout: 60_000 });
  const svg = page.locator('.score-buffer.is-front svg').first();
  await expect(svg).toBeVisible({ timeout: 60_000 });
  expect(await inverted(page, '.score-buffer.is-front svg')).toContain('invert');
});
