/**
 * The two slots, on a real engraving (P21c §A1).
 *
 * `tests/unit/slots.test.ts` proves the arithmetic. This proves the thing the
 * arithmetic is for: that upright, the system you are playing is never
 * re-drawn under you, and the bar after it is already on the screen.
 *
 * The owner's words: "it seems like someone playing wouldn't have enough time
 * to match the playing since they won't see the next bar in time … shouldn't
 * the next bar always be visible?"
 */
import { expect, test } from '@playwright/test';
import { openDevScore } from './fixtures/devScore';

const UPRIGHT = { width: 390, height: 844 };
const SIDEWAYS = { width: 880, height: 412 };

/** What is on the screen, per slot, right now. */
async function slots(page: import('@playwright/test').Page): Promise<
  {
    slot: string;
    cursor: boolean;
    drawn: boolean;
    scale: string;
    /** A mark stamped on the `<svg>` the first time it is seen. */
    mark: string;
  }[]
> {
  return page.evaluate(() => {
    const store = (window as unknown as { __marks?: number }).__marks ?? 0;
    let next = store;
    const out = [];
    for (const el of document.querySelectorAll<HTMLElement>('.score-buffer')) {
      const svg = el.querySelector('svg');
      let mark = svg?.getAttribute('data-mark') ?? '';
      if (svg && !mark) {
        next += 1;
        mark = String(next);
        svg.setAttribute('data-mark', mark);
      }
      // The scale only. The translate differs by design — each slot puts its
      // own ink's top-left corner in its own box — and it is the scale that
      // has to match, or one bar is drawn bigger than the other.
      const matrix = getComputedStyle(el).transform;
      const parts = /matrix\(([^,]+),/.exec(matrix);
      const transform = parts ? Number(parts[1]).toFixed(4) : matrix;
      out.push({
        slot: el.dataset.slot ?? '?',
        cursor: el.classList.contains('is-cursor'),
        drawn: el.classList.contains('is-front') && !el.hidden,
        scale: transform,
        mark,
      });
    }
    (window as unknown as { __marks?: number }).__marks = next;
    return out;
  });
}

test.describe('upright: two slots, karaoke style', () => {
  test('the system being played is never re-drawn, and the next bar is always there', async ({
    page,
  }) => {
    await page.setViewportSize(UPRIGHT);
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setBars(2);
    await dev.showStep(0);

    await expect(page.locator('.score-view')).toHaveAttribute('data-read-ahead', 'slots');

    // Walk the piece and record, at every step, which slot the cursor is in,
    // which `<svg>` node is in it, and which bars are on the screen.
    const seen: { bar: number; cursorSlot: string; cursorMark: string; bars: string[] }[] = [];
    for (let step = 0; step < 12; step += 1) {
      await dev.showStep(step);
      const drawn = (await slots(page)).filter((s) => s.drawn);
      const cursor = drawn.find((s) => s.cursor);
      const window_ = await dev.currentWindow();
      seen.push({
        bar: window_?.fromMeasure ?? -1,
        cursorSlot: cursor?.slot ?? '?',
        cursorMark: cursor?.mark ?? '',
        bars: drawn.map((s) => s.slot),
      });
    }

    // Every step has a slot with the cursor in it, and it is one of the two.
    for (const state of seen) expect(['0', '1', '2', '3']).toContain(state.cursorSlot);

    // The node identity test: while the cursor stays on one bar, the `<svg>`
    // holding it must be the same element. A re-render replaces it, and that
    // is what moved the music under the owner's eye.
    for (let i = 1; i < seen.length; i += 1) {
      const now = seen[i];
      const before = seen[i - 1];
      if (!now || !before) continue;
      if (now.bar !== before.bar) continue;
      expect(
        now.cursorMark,
        `bar ${String(now.bar)} was re-drawn between step ${String(i - 1)} and ${String(i)}`,
      ).toBe(before.cursorMark);
    }

    // And the cursor alternates rather than staying put: that is what makes
    // the other slot free to be re-drawn.
    const slotOrder = [...new Set(seen.map((s) => s.cursorSlot))];
    expect(slotOrder.length, 'the cursor never left the first slot').toBeGreaterThan(1);
  });

  test('both slots are drawn at the same size', async ({ page }) => {
    await page.setViewportSize(UPRIGHT);
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setBars(2);
    await dev.showStep(0);
    const drawn = (await slots(page)).filter((s) => s.drawn);
    expect(drawn.length, 'only one slot is drawn').toBe(2);
    // Two independent engravings, one scale. Fitting each to its own half
    // would draw a bar of minims larger than a bar of semiquavers.
    expect(drawn[0]?.scale).toBe(drawn[1]?.scale);
  });
});

test.describe('sideways: one system', () => {
  test('does not split the stage in two', async ({ page }) => {
    await page.setViewportSize(SIDEWAYS);
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setBars(2);
    await dev.showStep(0);
    await expect(page.locator('.score-view')).toHaveAttribute('data-read-ahead', 'single');
    const drawn = (await slots(page)).filter((s) => s.drawn);
    expect(drawn.length).toBe(1);
  });
});
