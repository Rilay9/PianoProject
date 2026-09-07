// Landscape screenshots at 1, 2 and 4 bars per window (P6 acceptance).
//
// These catch what no assertion does: a control bar wrapping onto three rows
// and eating the notation, a window that draws one bar when it says four, a
// keyboard strip that covers the bottom stave. Snapshots are per-platform, so
// a mismatch on a new machine is a missing baseline rather than a regression.

import { expect, test, type Page } from '@playwright/test';

import { closeScoreMenu, inkBox, openScoreMenu } from './scoreControls';

const ITEM = 'song.folk.twinkle.rh';

async function open(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  // Sixty seconds, not the default five: eight of these run at once and a
  // score that takes two seconds alone takes twenty with the machine full.
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
    { timeout: 60_000 },
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
  await openScoreMenu(page);
  for (let i = 0; i < 8; i += 1) await page.locator('#score-bars-down').click();
  for (let i = 1; i < bars; i += 1) await page.locator('#score-bars-up').click();
  await expect(label).toHaveText(`${bars} bar${bars === 1 ? '' : 's'}`);
  // The sheet covers the notation, and these pictures are of the notation.
  await closeScoreMenu(page);
  // Let the redraw and the pre-render settle before the shutter.
  await page.waitForTimeout(500);
}

test.describe('score screen in landscape', () => {
  test.setTimeout(120_000);
  // A phone held sideways: the orientation the score screen is designed for.
  test.use({ viewport: { width: 880, height: 412 } });

  /**
   * What the pictures were guarding, as assertions.
   *
   * Written when the sheet started being fitted to the screen (2026-09-07) and
   * the pictures all went stale at once. They turned out not to have: the fix
   * was to stop refitting inside every draw. But the hour spent finding that
   * out is the argument for saying the three things the header describes as
   * assertions too — a baseline can only tell you *that* something moved, and
   * these say what.
   */
  for (const bars of [1, 2, 4]) {
    test(`${bars} bar${bars === 1 ? '' : 's'} per window`, async ({ page }) => {
      await open(page);
      await setBars(page, bars);

      const stage = await page.locator('#score-stage').boundingBox();
      const bar = await page.locator('#score-bar').boundingBox();
      const strip = await page.locator('#score-strip').boundingBox();
      // The ink, not the SVG element: the fit now grows the sheet until the
      // *drawn* music fills the stage, which puts the engraver's empty right
      // margin off the edge on purpose.
      const sheet = await inkBox(page);
      expect(stage && bar && strip).toBeTruthy();

      // 1. The control bar has not wrapped onto three rows and eaten the
      //    notation. One row of buttons is about 44 px; three would be 130.
      expect(bar!.height, 'the control bar has wrapped').toBeLessThan(110);

      // 2. The keyboard strip does not cover the bottom stave.
      expect(sheet.bottom, 'the strip covers the notation').toBeLessThanOrEqual(strip!.y + 1);

      // 3. Something is drawn. How *much* is the next test: OSMD emits a
      //    `.vf-measure` per stave per bar, so the count is proportional to
      //    the setting rather than equal to it.
      const measures = await page.locator('#score-stage .is-front svg .vf-measure').count();
      expect(measures, 'nothing was engraved').toBeGreaterThan(0);

      // And the sheet is inside its box, which is what a fitted sheet must
      // stay: wider than the stage would mean notes off the side of a phone.
      expect(sheet.width).toBeLessThanOrEqual(stage!.width + 2);
    });
  }

  test('the window really holds more bars as the setting goes up', async ({ page }) => {
    // The catastrophe the pictures caught: a window that draws one bar when it
    // says four. Counted rather than looked at.
    await open(page);
    const drawn: number[] = [];
    for (const bars of [1, 2, 4]) {
      await setBars(page, bars);
      drawn.push(await page.locator('#score-stage .is-front svg .vf-measure').count());
    }
    const [one, two, four] = drawn as [number, number, number];
    expect(two, `1 bar drew ${String(one)}, 2 bars drew ${String(two)}`).toBeGreaterThan(one);
    expect(four, `2 bars drew ${String(two)}, 4 bars drew ${String(four)}`).toBeGreaterThan(two);
  });

  /**
   * The pictures, for a human looking at a change on their own machine.
   *
   * **Opt-in in CI**, and this is a deliberate loss. Baselines are
   * per-platform; the only machine on this project runs Windows; and CI runs
   * Linux. So a change to the look of the app fails CI on three pictures that
   * *cannot be regenerated from here* — which is what happened the day the
   * keyboard strip stopped drawing all 88 keys: 250 tests passed, including
   * every assertion above, and the three Linux PNGs were 11% different because
   * the app had got better.
   *
   * A guard nobody can update is a guard that gets deleted under pressure, and
   * usually at the worst moment. The assertions above are the CI guard now.
   * These stay for the eye, and `npm run tour` is the better tool for that
   * anyway — it photographs every screen in both orientations rather than one
   * screen in one.
   */
  test.describe('screenshots', () => {
    test.skip(
      !!process.env.CI && !process.env.VISUAL,
      'per-platform baselines that only a Linux machine can refresh; set VISUAL=1 to compare',
    );

    for (const bars of [1, 2, 4]) {
      test(`${bars} bar${bars === 1 ? '' : 's'} per window, drawn`, async ({ page }) => {
        await open(page);
        await setBars(page, bars);
        await expect(page.locator('section[data-screen="score"]')).toHaveScreenshot(
          `score-landscape-${bars}bar.png`,
          { maxDiffPixelRatio: 0.02 },
        );
      });
    }
  });

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
