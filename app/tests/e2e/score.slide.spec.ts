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

/**
 * Per printed bar on the front sheet: whether all its note heads are inside the stage, and whether
 * its first is; with the stage's word for why fewer bars are shown and how many bars are engraved.
 */
async function windowOnGlass(page: import('@playwright/test').Page): Promise<{
  bars: Record<number, { all: boolean; first: boolean }>;
  why: string | null;
  measures: number;
  said: string;
}> {
  return page.evaluate(() => {
    const host = document.querySelector<HTMLElement>('.score-view');
    const front = host?.querySelector<HTMLElement>('.score-buffer.is-front');
    const bars: Record<number, { all: boolean; first: boolean }> = {};
    if (!host || !front) return { bars, why: null, measures: 0, said: 'none' };
    const stage = host.getBoundingClientRect();
    const heads = new Map<number, DOMRect[]>();
    for (const note of front.querySelectorAll<HTMLElement>('.score-note')) {
      const bar = Number(note.dataset.bar);
      if (!Number.isFinite(bar)) continue;
      const box = (note.querySelector('.vf-notehead') ?? note).getBoundingClientRect();
      if (box.width <= 0) continue;
      heads.set(bar, [...(heads.get(bar) ?? []), box]);
    }
    const inside = (b: DOMRect): boolean => b.left >= stage.left - 0.5 && b.right <= stage.right + 0.5;
    for (const [bar, boxes] of heads) {
      const sorted = boxes.sort((a, b) => a.left - b.left);
      bars[bar] = { all: sorted.every(inside), first: sorted[0] !== undefined && inside(sorted[0]) };
    }
    return {
      bars,
      why: host.dataset.windowWhy ?? null,
      measures: front.querySelectorAll('.vf-measure').length,
      said: `${String(Math.round(stage.width))} wide, bars ${JSON.stringify(bars)}`,
    };
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

  /**
   * Two bars are asked, and the window holds as many of them as reach across the stage at the size
   * the height gives, with the next bar's first note after them (`04` §5, T38). On `tempo-change` at
   * this size that is one: its first bar and the start of the second fill the width. So the case
   * asserts the rule rather than the count asked (U82): until U74 the renderer said "two" for the
   * half second before the piece was measured — the same picture, the second bar running past the
   * right edge — and this case read that word; from U74 the first window is the measured one and
   * says "one, it fits across". Read twice: at once, as the first frame shows it, and once the fit
   * says it is done. Every comparison is between boxes on the same screen.
   */
  test('draws more bars than the window, so there is something to read into', async ({ page }) => {
    await page.setViewportSize(SIDEWAYS);
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    const asked = 2;
    await dev.setBars(asked);
    await dev.showStep(0);
    const last = (await dev.measureCounts()).printed - 1;
    for (const when of ['at once', 'once settled'] as const) {
      if (when === 'once settled') {
        await expect(page.locator('#dev-stage[data-settled="true"]')).toHaveCount(1, { timeout: 30_000 });
      }
      const glass = await windowOnGlass(page);
      // `currentWindow` is the *window* — the bars the learner is on. What is
      // engraved is wider, and counting measures is the only way to see it.
      const window_ = await dev.currentWindow();
      expect(window_, when).not.toBeNull();
      const from = window_?.fromMeasure ?? 0;
      const to = window_?.toMeasure ?? 0;
      const shown = to - from + 1;
      const said = `${when}: window ${String(from)}-${String(to)} of ${String(asked)} asked, stage ${glass.said}`;
      expect(shown, said).toBeGreaterThanOrEqual(1);
      expect(shown, said).toBeLessThanOrEqual(asked);
      // The window said is the window on the glass: every note of every bar in it.
      for (let bar = from; bar <= to; bar += 1) {
        expect(glass.bars[bar]?.all, `${said}: bar ${String(bar)} is in the window and not wholly on the stage`).toBe(true);
      }
      // The next bar's first note after them, while the piece goes on.
      if (to < last) {
        expect(glass.bars[to + 1]?.first, `${said}: the next bar's first note is off the stage`).toBe(true);
      }
      // Fewer than asked only when one more bar and the start of the one after it do not reach
      // across, and then the stage says so (the Score screen's row turns this into its words).
      if (shown < asked) {
        expect(glass.why, `${said}: fewer shown without the reason`).toBe('across');
        const next = to + 1;
        const nextFits =
          next <= last && glass.bars[next]?.all === true && (next === last || glass.bars[next + 1]?.first === true);
        expect(nextFits, `${said}: bar ${String(next)} and the next one's start reach across, and were not counted`).toBe(
          false,
        );
      }
      // The window plus the bars to read into.
      expect(glass.measures, said).toBeGreaterThan(shown);
    }
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
