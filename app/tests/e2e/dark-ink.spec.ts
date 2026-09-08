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
  const svg = page.locator('.score-buffer.is-front svg').first();
  await expect(svg).toBeVisible({ timeout: 60_000 });
  expect(await inverted(page, '.score-buffer.is-front svg')).toContain('invert');
});
