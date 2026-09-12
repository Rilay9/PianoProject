/**
 * The music has to use the screen it is on.
 *
 * Satie's Gnossienne No. 1 upright was four illegible systems in the top-left
 * quarter of a 342 px phone: 68 px of music in a 342 px stage, at scale 0.20,
 * with two thirds of the screen black. Nothing failed. Every assertion about
 * the fit asked whether the music *fitted* — whether it overflowed, whether it
 * was clipped, whether a staff cleared a floor — and a speck in the corner
 * passes all of those. It took looking at the picture.
 *
 * The cause was a high-water mark. `held` is the widest ink seen at this zoom
 * and is never lowered, which is right while it is the only measurement there
 * is and wrong the moment ink leaves the screen: a read-ahead slot engraved
 * onto a 1,166 px page folded 1,184 px into it, the slot count then dropped to
 * one, that slot's range was cleared, and the cursor's own 384 px bar went on
 * being drawn at the scale needed to fit a page that was nowhere.
 *
 * So this asks the question the pictures were answering: for every piece in the
 * corpus, at the owner's real geometry, does the music actually use the stage?
 * It is a floor, not a target — a genuinely narrow piece is allowed to be
 * narrow — set well below what every piece now reaches and above what the
 * fault produced.
 */
import { expect, test, type Page } from '@playwright/test';

/** The owner's phone, and the sideways way up the score screen is built for. */
const SIZES = [
  { name: 'upright', width: 342, height: 740 },
  { name: 'sideways', width: 740, height: 342 },
];

/**
 * The corpus, densest first. These are the ten the contact sheets are built
 * from, so a fault found in a picture has a named assertion to land on.
 */
const PIECES = [
  'song.classical.satie-gnossienne-1',
  'song.classical.chopin-scherzo-2.nifc',
  'song.classical.chopin-nocturne-op27-1.nifc',
  'song.classical.petzold-minuet-g-bwv-anh114',
  'song.classical.ode-to-joy.full',
  'song.folk.greensleeves.68',
  'song.folk.twinkle.ht',
  'song.holiday.jingle-bells.g',
];

/**
 * How much of the stage's width the drawn music covers.
 *
 * The *drawn* extent, not the page: OSMD lays a window out on a page as wide as
 * it likes and inks part of it, so the SVG's own box says nothing about what is
 * on the glass. The cursor's slot is the one that matters — it is the bar being
 * read.
 */
async function fillOfStage(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage');
    const svg = document.querySelector<SVGGraphicsElement>(
      '#score-stage .score-buffer.is-cursor svg, #score-stage .score-buffer.is-front svg',
    );
    if (!stage || !svg) return null;
    const stageBox = stage.getBoundingClientRect();
    // Every drawn path and glyph, unioned: the ink.
    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    for (const node of svg.querySelectorAll<SVGGraphicsElement>('path, rect, text, polyline, line')) {
      const box = node.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;
      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
    }
    if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
    return (right - left) / stageBox.width;
  });
}

/** Below this the music is not being read, it is being looked at. */
const FLOOR = 0.55;

/**
 * And again with a run going, which is the case that mattered and the case the
 * first version of this file missed.
 *
 * A run freezes its size so the sheet cannot change under the player, and the
 * freeze was stored without the engraving zoom it was taken at. Opening Satie's
 * Gnossienne engraves at zoom 1; starting a run re-engraves at 0.74, and the
 * frozen number went on being applied to sheets whose units had changed — 0.20
 * where the right answer was 0.90, for all 312 steps of the corpus run. Merely
 * opening the score looked fine the whole time, so a check that only opens it
 * is not a check.
 */
test('and a piece being played uses the stage too', async ({ page }) => {
  test.setTimeout(240_000);
  const thin: string[] = [];
  for (const piece of PIECES) {
    await page.setViewportSize({ width: 342, height: 740 });
    await page.goto(`/#/score/${piece}`);
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
    await page.locator('#score-play').click();
    // Past the 150 ms settle the freeze waits for, and past the re-engrave a
    // run triggers.
    await page.waitForTimeout(3_000);
    const fill = await fillOfStage(page);
    if (fill === null) thin.push(`${piece}: nothing drawn`);
    else if (fill < FLOOR) thin.push(`${piece}: ${String(Math.round(fill * 100))} % of the width, mid-run`);
  }
  expect(thin, `music drawn too small to read during a run: ${thin.join(' | ')}`).toEqual([]);
});

for (const size of SIZES) {
  test(`every corpus piece uses the stage, ${size.name}`, async ({ page }) => {
    test.setTimeout(240_000);
    const thin: string[] = [];
    for (const piece of PIECES) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(`/#/score/${piece}`);
      await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
      await page.waitForFunction(
        () => {
          const svg = document.querySelector('#score-stage .score-buffer.is-front svg');
          return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
        },
        undefined,
        { timeout: 60_000 },
      );
      // The probe measures on idle, a beat after the first draw, and the fit is
      // redone when it lands. This is the settled size, which is the one the
      // learner reads.
      await page.waitForTimeout(2_500);
      const fill = await fillOfStage(page);
      if (fill === null) {
        thin.push(`${piece}: nothing drawn`);
      } else if (fill < FLOOR) {
        thin.push(`${piece}: ${String(Math.round(fill * 100))} % of the width`);
      }
    }
    expect(thin, `music drawn too small to read:\n${thin.join('\n')}`).toEqual([]);
  });
}
