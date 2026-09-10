/**
 * How much room the music is allowed to take, and where it sits in it.
 *
 * Filling the width was the fix for the phone and the fault on the laptop. A
 * slot draws one system and OSMD stretches a page's last system to the page's
 * width, so the same rule that pulled a dense bar out to 96 % of a 342 px
 * screen smeared four notes of a beginner's tune across 1512 px, and the eye
 * had to travel the whole display to find the next note. Neither the gallery
 * nor the corpus caught it, because every fixture is a phone.
 *
 * Two assertions, at both ends of the same guardrail: the phone must keep the
 * fill it was given, and a wide screen must keep human note spacing and then
 * centre what it has rather than pinning it to a corner of an empty screen.
 */
import { expect, test } from '@playwright/test';

const SONG = 'song.folk.hot-cross-buns';

const PHONE = { width: 342, height: 740 };
const TABLET = { width: 900, height: 1200 };
const LAPTOP = { width: 1512, height: 850 };

/** Below this the phone is back to the third-of-a-screen sheet (`09` §35). */
const PHONE_FILL_MIN = 0.85;
/**
 * Above this on a laptop the bar is being stretched rather than engraved.
 *
 * Generous: the point is not a target width, it is that one bar of four notes
 * must not be pulled across a whole desktop display.
 */
const WIDE_FILL_MAX = 0.7;

/**
 * Below this share of the width, being left-aligned reads as a broken layout.
 *
 * Above it, it reads as a right margin — which is what a page of music has.
 */
const CENTRE_BELOW_FILL = 0.5;

interface Drawn {
  width: number;
  left: number;
  right: number;
}

async function drawn(page: import('@playwright/test').Page, viewport: number): Promise<Drawn[]> {
  await page.goto(`/#/score/${SONG}`);
  const screen = page.locator('[data-screen="score"]');
  await expect(screen).toBeVisible({ timeout: 60_000 });
  await expect(screen).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  // The fit settles a frame or two after the score arrives, and the probe's
  // measurement of the piece lands after that — the density judgement reads it,
  // so measuring before it has landed measures the fallback instead.
  await page.waitForTimeout(2_500);
  const seen = await page.evaluate(() => {
    const out: { width: number; left: number; right: number }[] = [];
    for (const host of document.querySelectorAll('.score-buffer.is-front')) {
      let left = Infinity;
      let right = -Infinity;
      for (const stave of host.querySelectorAll('.staffline, .vf-stave')) {
        const r = stave.getBoundingClientRect();
        if (r.width <= 0) continue;
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      }
      if (Number.isFinite(left)) out.push({ width: right - left, left, right });
    }
    return out;
  });
  expect(seen.length, `nothing was drawn at ${String(viewport)} px`).toBeGreaterThan(0);
  return seen;
}

test('a phone still gets the width filled', async ({ page }) => {
  await page.setViewportSize(PHONE);
  const slots = await drawn(page, PHONE.width);
  const widest = Math.max(...slots.map((s) => s.width));
  expect(
    widest / PHONE.width,
    `the phone drew ${String(Math.round(widest))}px of ${String(PHONE.width)}`,
  ).toBeGreaterThan(PHONE_FILL_MIN);
});

for (const size of [TABLET, LAPTOP]) {
  test(`a ${String(size.width)}px screen keeps note spacing and centres it`, async ({ page }) => {
    await page.setViewportSize(size);
    const slots = await drawn(page, size.width);
    const widest = Math.max(...slots.map((s) => s.width));
    expect(
      widest / size.width,
      `${String(size.width)}px stretched one bar to ${String(Math.round(widest))}px`,
    ).toBeLessThan(WIDE_FILL_MAX);

    // Every slot starts in the same place: they are engraved separately, so
    // centring each on its own ink put four stacked systems at four different
    // left edges.
    const lefts = slots.map((s) => Math.round(s.left));
    expect(new Set(lefts).size, `slots began at ${lefts.join(', ')}`).toBe(1);

    // Centred only where being left-aligned would read as a failure.
    //
    // A page of music with a right margin is a page of music: the tablet draws
    // about two thirds of its width and sitting to the left of that is what
    // sheet music looks like. What is not acceptable is a third of a desktop
    // display of notes in the corner of an otherwise empty screen, so the
    // centring is asked for only once the music has stopped filling the space
    // in any recognisable way.
    const at = slots.find((s) => s.width === widest);
    if (!at) throw new Error('the widest slot went missing');
    if (widest / size.width >= CENTRE_BELOW_FILL) return;
    const before = at.left;
    const after = size.width - at.right;
    expect(
      Math.abs(before - after),
      `${String(Math.round(before))}px before the music and ${String(Math.round(after))}px after it`,
    ).toBeLessThan(size.width * 0.1);
  });
}
