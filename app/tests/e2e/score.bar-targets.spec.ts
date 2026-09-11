/**
 * Everything on the control bar is big enough to hit, at every width.
 *
 * The geometric sweep reported the bar's controls as under `04` §0 R4's "about
 * forty" on 118 gallery cells and nobody could act on it, because the bar was
 * tuned to be exactly full: at 342 px it held 310 px of controls and 20 px of
 * gaps in 329 px of room, so widening anything wrapped the row — and a wrapped
 * row is §9.23's fault, the one the owner photographed.
 *
 * The space came from between and around the controls rather than from another
 * control: a tighter gap and no side padding. That is also why this test exists
 * at both ends. Making the targets bigger and wrapping the row would be a worse
 * screen than the one it replaced, so "one row" is asserted beside "big enough"
 * and neither is allowed to buy the other.
 */
import { expect, test } from '@playwright/test';

/** `04` §0 R4. */
const TAP_MIN = 40;

/** Every width the gallery shoots, plus the owner's real phone. */
const WIDTHS = [342, 360, 412, 740, 780, 1200];

/** The longest title in the authored library, which is what wrapped the row. */
const LONG_TITLE = 'song.folk.when-the-saints.alternating';
const PLAIN = 'song.folk.hot-cross-buns';

test('every control on the bar is big enough to hit, and the row never wraps', async ({ page }) => {
  const faults: string[] = [];
  for (const song of [PLAIN, LONG_TITLE]) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width < 500 ? 740 : 360 });
      await page.goto(`/#/score/${song}`);
      await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(700);

      const seen = await page.evaluate((min) => {
        const bar = document.querySelector('#score-bar');
        if (!bar) return null;
        const controls = [
          ...bar.querySelectorAll<HTMLElement>('button, select, [role="button"], .score-tempo-label'),
        ];
        const small = controls
          // A segmented control is one target, not one per segment: `R`, `L`
          // and `Both` are 23 px each and together are a 92 x 40 control. The
          // app marks those groups, and the group is what is judged.
          .filter((el) => el.hasAttribute('data-tap-group') || el.closest('[data-tap-group]') === null)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.id || el.className, w: Math.round(r.width), h: Math.round(r.height) };
          })
          .filter((el) => el.w > 0 && (el.w < min || el.h < min));
        // One row, from the bar's height rather than its children's tops: a
        // zero-height child sits at the top whatever the row does.
        const tops = new Set(
          [...bar.children]
            .filter((k) => k.getBoundingClientRect().height > 0)
            .map((k) => Math.round(k.getBoundingClientRect().top)),
        );
        return { rows: tops.size, small };
      }, TAP_MIN);

      if (!seen) throw new Error(`no control bar at ${String(width)}px`);
      const where = `${song.replace('song.folk.', '')} at ${String(width)}px`;
      if (seen.rows > 1) faults.push(`${where}: the bar wrapped onto ${String(seen.rows)} rows`);
      for (const el of seen.small) {
        faults.push(`${where}: ${el.id} is ${String(el.w)}x${String(el.h)}, under ${String(TAP_MIN)}`);
      }
    }
  }
  expect(faults, faults.join('\n')).toEqual([]);
});
