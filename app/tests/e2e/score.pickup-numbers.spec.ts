/**
 * One bar, one number — everywhere on the screen.
 *
 * A piece that opens with a pickup has two competing ways to number its bars,
 * and the score screen shipped both. The header readout and the `Weakest bars`
 * stat go through `printedBar`, which follows the engraving convention and
 * calls an incomplete first bar **bar 0**; there is a gallery cell for it. The
 * loop machinery does not: `loopFromPrintedBars` matches `sourceMeasureIndex
 * === bar - 1`, so everything that reaches it counts the pickup as bar 1.
 *
 * Internally that is fine — the loop has to speak the loop's language. What
 * was not fine is that the loop's language was being *printed*. On `Happy
 * Birthday`, whose first bar is a single upbeat note, the header says `bar 0`
 * and the loop button said `Bars 1–1` for that same bar; the summary named the
 * weakest bar 3 and `Loop the weak bars` then labelled itself 4. Every number
 * the learner is asked to act on disagreed with every number they were shown,
 * by exactly one, on the pieces where anybody would notice.
 *
 * So the boundary is drawn here: internal ranges keep counting from one, and
 * everything written on the screen goes through the same function the header
 * uses.
 */
import { expect, test } from '@playwright/test';

/** 3/4 with a pickup — the one bar allowed to be numbered 0 (`08` §10). */
const PICKUP = 'song.folk.happy-birthday.simple';
/** No pickup, so the two conventions agree and nothing here may change. */
const PLAIN = 'song.folk.hot-cross-buns';

test.describe('bar numbers on a pickup piece', () => {
  test('the loop says the same bar number the header does', async ({ page }) => {
    await page.setViewportSize({ width: 342, height: 740 });
    await page.goto(`/#/score/${PICKUP}`);
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#score-where')).toHaveText(/bar 0 \/ \d+/, { timeout: 30_000 });

    // Double-tap the stage once to anchor the loop and again to close it,
    // which is how a person sets a one-bar loop. Nothing in the DOM carries
    // `data-measure`, so a tap anywhere means the first bar of the window —
    // which here is the pickup.
    const stage = page.locator('#score-stage');
    await stage.dblclick({ position: { x: 40, y: 40 } });
    // The anchor message is the first place the number is printed.
    await expect(page.locator('#score-status')).toHaveText(/Loop start: bar 0\b/);
    await stage.dblclick({ position: { x: 40, y: 40 } });

    // And the second: the loop control's own label.
    await expect(page.locator('#score-loop')).toHaveText(/Bars 0–0/);
  });

  test('a piece with no pickup is numbered exactly as before', async ({ page }) => {
    await page.setViewportSize({ width: 342, height: 740 });
    await page.goto(`/#/score/${PLAIN}`);
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#score-where')).toHaveText(/bar 1 \/ \d+/, { timeout: 30_000 });

    const stage = page.locator('#score-stage');
    await stage.dblclick({ position: { x: 40, y: 40 } });
    await expect(page.locator('#score-status')).toHaveText(/Loop start: bar 1\b/);
    await stage.dblclick({ position: { x: 40, y: 40 } });
    await expect(page.locator('#score-loop')).toHaveText(/Bars 1–1/);
  });
});
