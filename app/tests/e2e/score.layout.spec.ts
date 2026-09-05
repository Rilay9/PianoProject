// Landscape screenshots at 1, 2 and 4 bars per window (P6 acceptance).
//
// These catch what no assertion does: a control bar wrapping onto three rows
// and eating the notation, a window that draws one bar when it says four, a
// keyboard strip that covers the bottom stave. Snapshots are per-platform, so
// a mismatch on a new machine is a missing baseline rather than a regression.

import { expect, test, type Page } from '@playwright/test';

const ITEM = 'song.folk.twinkle.rh';

async function open(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
  );
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
}

async function setBars(page: Page, bars: number): Promise<void> {
  const label = page.locator('#score-bars');
  for (let i = 0; i < 8; i += 1) await page.locator('#score-bars-down').click();
  for (let i = 1; i < bars; i += 1) await page.locator('#score-bars-up').click();
  await expect(label).toHaveText(`${bars} bar${bars === 1 ? '' : 's'}`);
  // Let the redraw and the pre-render settle before the shutter.
  await page.waitForTimeout(500);
}

test.describe('score screen in landscape', () => {
  test.setTimeout(120_000);
  // A phone held sideways: the orientation the score screen is designed for.
  test.use({ viewport: { width: 880, height: 412 } });

  for (const bars of [1, 2, 4]) {
    test(`${bars} bar${bars === 1 ? '' : 's'} per window`, async ({ page }) => {
      await open(page);
      await setBars(page, bars);
      await expect(page.locator('section[data-screen="score"]')).toHaveScreenshot(
        `score-landscape-${bars}bar.png`,
        { maxDiffPixelRatio: 0.02 },
      );
    });
  }

  test('the notation still has most of the height with the strip showing', async ({ page }) => {
    await open(page);
    const stage = await page.locator('#score-stage').boundingBox();
    const strip = await page.locator('#score-strip').boundingBox();
    const bar = await page.locator('#score-bar').boundingBox();
    expect(stage).toBeTruthy();
    // docs/04 §5 gives the keyboard strip the bottom ~12 % of the height; the
    // notation must still get the majority of the screen or the window is
    // pointless.
    expect((stage?.height ?? 0) / 412).toBeGreaterThan(0.5);
    expect((strip?.height ?? 0) + (bar?.height ?? 0)).toBeLessThan(412 * 0.5);
  });
});
