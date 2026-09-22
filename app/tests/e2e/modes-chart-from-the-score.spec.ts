/**
 * The chord-chart door in the Score screen's `⋯` sheet (T17; `04` §3b, §5).
 *
 * The other of the two doors built on 2026-09-21. This one is where somebody
 * *already looking at the piece* would reach for it, so what has to be true is
 * that it is in the sheet, that it goes to the same piece rather than to the
 * chart screen in general, and that it is not there at all over a piece the
 * build measured no chords in — a chart of one of those is empty bars under a
 * count-off, which is the dead control R4 forbids.
 *
 * Driven from the rung, upright and sideways, because sideways the sheet is a
 * two-column grid and a row that does not apply has to be *gone* rather than
 * empty.
 *
 * **Nothing here is heard.**
 */
import { expect, test, type Page } from '@playwright/test';

import { openScoreMenu } from './scoreControls';

const PHONE = { width: 342, height: 740 };
const SIDEWAYS = { width: 740, height: 342 };

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

/**
 * A chord-symbol song of `jazz.5`, opened the ordinary way — its own row.
 *
 * Which song is read off the lesson page rather than written down here: the
 * rung's options are content and change, and a test naming one would be
 * asserting today's curriculum as if it were the rule.
 */
async function scoreOfAChordSong(page: Page): Promise<string> {
  await page.goto('/#/lesson/jazz.5');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const row = page
    .locator('#lesson-songs .list-row[data-item]')
    .filter({ has: page.locator('button[aria-label^="Open the chord chart"]') })
    .first();
  await expect(row, 'no song on jazz.5 carries chord symbols').toBeVisible();
  const itemId = (await row.getAttribute('data-item')) ?? '';
  await row.locator('button[aria-label^="Open "]').first().click();
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
  return itemId;
}

test('the sheet offers the chart, and it opens this piece’s chart', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize(PHONE);
  const itemId = await scoreOfAChordSong(page);
  await openScoreMenu(page);
  const chart = page.locator('#score-chart');
  await expect(chart).toBeVisible();
  // The row says what it is for before it is pressed, which is the thing a
  // glyph on the bar could not have done.
  await expect(page.locator('#score-more-sheet')).toContainText('Chord chart');
  await chart.click();
  await expect(page.locator('section[data-screen="chart"]')).toBeVisible({ timeout: 60_000 });
  expect(new URL(page.url()).hash).toContain(encodeURIComponent(itemId));
  await expect(page.locator('#chart-grid .chart-cell').first()).not.toBeEmpty({ timeout: 60_000 });
});

test('a piece with no chords is offered no row at all, upright or sideways', async ({ page }) => {
  test.setTimeout(180_000);
  // `Hot Cross Buns` is the piece `chart.spec.ts` already uses to prove the
  // chart screen refuses a score with no harmony; here the point is one step
  // earlier — the door is never drawn, so the refusal is never reached.
  for (const size of [PHONE, SIDEWAYS]) {
    await page.setViewportSize(size);
    await page.goto('/#/score/song.folk.hot-cross-buns');
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
    await openScoreMenu(page);
    // Gone, not empty: sideways the sheet is a two-column grid and an empty
    // cell in it is worse than a missing one.
    await expect(page.locator('#score-chart')).toBeHidden();
  }
});

test('sideways the row is still there over a piece that has chords', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize(SIDEWAYS);
  await scoreOfAChordSong(page);
  await openScoreMenu(page);
  await expect(page.locator('#score-chart')).toBeVisible();
  await page.locator('#score-chart').click();
  await expect(page.locator('section[data-screen="chart"]')).toBeVisible({ timeout: 60_000 });
  // And the chart is usable sideways: the tracker and the transport are both
  // on a 342 px-tall screen with the form under them.
  await expect(page.locator('#chart-grid .chart-cell').first()).toBeVisible({ timeout: 60_000 });
  const reachable = await page.evaluate(() => {
    const ids = ['chart-form', 'chart-start', 'chart-stop'];
    return ids.every((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const box = el.getBoundingClientRect();
      return box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight;
    });
  });
  expect(reachable, 'the chart’s tracker or transport is off the screen sideways').toBe(true);
});
