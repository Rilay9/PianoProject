/**
 * Sideways, the sheet slides (P21c §A2).
 *
 * Landscape draws one system, so there is nothing to alternate the way the
 * two slots do upright. Instead the window is drawn with two extra bars to
 * read into and the sheet slides left as the cursor advances, holding the
 * cursor about a third across so what is coming stays to its right.
 *
 * By bar, at the barline: a sheet that moves under a note being read is worse
 * than one that jumps once a bar.
 */
import { expect, test } from '@playwright/test';
import { openDevScore } from './fixtures/devScore';

const SIDEWAYS = { width: 880, height: 412 };
const UPRIGHT = { width: 390, height: 844 };

/** Where the cursor's band sits, as a fraction of the stage width. */
async function cursorFraction(page: import('@playwright/test').Page): Promise<number | null> {
  return page.evaluate(() => {
    const host = document.querySelector('.score-view');
    const band = document.querySelector<HTMLElement>('.score-cursor:not(.score-cursor--next)');
    if (!host || !band || band.hidden) return null;
    const h = host.getBoundingClientRect();
    if (h.width <= 0) return null;
    return (band.getBoundingClientRect().left - h.left) / h.width;
  });
}

test.describe('sideways', () => {
  test('holds the cursor a third across once the piece is under way', async ({ page }) => {
    await page.setViewportSize(SIDEWAYS);
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setBars(2);

    // From bar 3 on — before that the sheet is still anchored at its start,
    // because bar 1 must not be pushed into the middle of an empty stage.
    const seen: number[] = [];
    for (let step = 0; step < 14; step += 1) {
      await dev.showStep(step);
      const at = await cursorFraction(page);
      if (at !== null) seen.push(at);
    }
    expect(seen.length).toBeGreaterThan(6);

    const settled = seen.slice(6);
    for (const at of settled) {
      expect(at, `the cursor sat at ${at.toFixed(2)} of the stage`).toBeGreaterThanOrEqual(0.2);
      expect(at, `the cursor sat at ${at.toFixed(2)} of the stage`).toBeLessThanOrEqual(0.5);
    }
  });

  test('draws more bars than the window, so there is something to read into', async ({ page }) => {
    await page.setViewportSize(SIDEWAYS);
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setBars(2);
    await dev.showStep(0);
    // `currentWindow` is the *window* — the bars the learner is on. What is
    // engraved is wider, and counting measures is the only way to see it.
    const measures = await page.evaluate(
      () => document.querySelectorAll('.score-buffer.is-front .vf-measure').length,
    );
    const window_ = await dev.currentWindow();
    const inWindow = (window_?.toMeasure ?? 0) - (window_?.fromMeasure ?? 0) + 1;
    expect(inWindow).toBe(2);
    // Two bars of window plus the bars to read into.
    expect(measures).toBeGreaterThan(inWindow);
  });
});

test.describe('upright', () => {
  test('does not slide: the two slots do the reading ahead', async ({ page }) => {
    await page.setViewportSize(UPRIGHT);
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setBars(2);
    await dev.showStep(0);
    const transform = await page.evaluate(
      () =>
        document.querySelector<HTMLElement>('.score-buffer.is-cursor')?.style.transform ?? '',
    );
    expect(transform).not.toContain('translateX');
  });
});
