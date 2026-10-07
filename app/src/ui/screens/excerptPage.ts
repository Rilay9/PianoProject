/**
 * Which page the excerpt view opens on (E1 item 6: the reviewer sees and hears outside the cut).
 *
 * The renderer tiles the piece in pages of up to eight bars (`WindowRenderer.windowFor`) and shows
 * two at once: the page the cursor is on, in full ink, and in its second slot the page played
 * next, muted. So the cut is always on the page opened, in full, and the page size is chosen, in
 * this order, for:
 *
 * 1. the cut and both margins on that page;
 * 2. the cut and the bars before it on that page — and the bars after it on the read-ahead page
 *    when that page is what is played next (no repeat sends the playing back from the first);
 * 3. the cut alone on that page, its margins a page away (◀ Bars / Bars ▶).
 *
 * The margins are always in the playback. `margins` says whether both are on screen, for the
 * words under the score. Found on the pictures of the five approved windows: the view had opened
 * on the cut's own page, so the bars before a cut were on screen for none that start after bar 1.
 */

/** What the placement reads of the parent's model. */
export interface PageModel {
  sourceMeasureCount: number;
  pickup?: boolean;
  steps: readonly { sourceMeasureIndex: number }[];
}

export interface ExcerptPage {
  /** The renderer's page size. */
  bars: number;
  /** The printed bar (0-based) whose page the view opens on. */
  showFrom: number;
  /** Whether both margins are on screen with the cut: on the page, or on the read-ahead page after it. */
  margins: 'shown' | 'paged';
}

/** The printed bars (0-based) of the page `bar` is on, for a page size: `WindowRenderer.windowFor`'s tiling. */
export function pageRange(model: PageModel, bar: number, size: number): { from: number; to: number } {
  const last = Math.max(0, model.sourceMeasureCount - 1);
  const pickup = model.pickup === true;
  const from = pickup ? (bar <= size ? 0 : Math.floor((bar - 1) / size) * size + 1) : Math.floor(bar / size) * size;
  const to = pickup && from === 0 ? size : from + size - 1;
  return { from, to: Math.min(to, last) };
}

export function excerptPage(model: PageModel, fromBar: number, toBar: number, margin: number, most: number): ExcerptPage {
  const last = model.sourceMeasureCount - 1;
  const pickup = model.pickup === true;
  const pageOf = (bar: number, size: number): number => (pickup ? (bar <= size ? 0 : Math.floor((bar - 1) / size) + 1) : Math.floor(bar / size));
  const cap = Math.min(most, model.sourceMeasureCount);
  const cutFrom = fromBar - 1;
  const cutTo = toBar - 1;
  const lo = Math.max(0, cutFrom - margin);
  const hi = Math.min(last, cutTo + margin);

  // 1. Everything on one page.
  for (let size = cap; size >= Math.max(1, hi - lo + 1); size -= 1) {
    if (pageOf(lo, size) === pageOf(hi, size)) return { bars: size, showFrom: lo, margins: 'shown' };
  }

  // Played from `lo`, is the page after `lo`'s the one played next? A repeat that sends the
  // playing back from `lo`'s page puts that other page in the renderer's second slot instead.
  const followedByNext = (size: number): boolean => {
    const page = pageOf(lo, size);
    const start = model.steps.findIndex((step) => step.sourceMeasureIndex === lo);
    if (start < 0) return false;
    let highest = lo;
    for (let index = start; index < model.steps.length; index += 1) {
      const bar = model.steps[index]!.sourceMeasureIndex;
      if (pageOf(bar, size) === page) {
        if (bar < highest) return false;
        highest = bar;
        continue;
      }
      return bar === highest + 1;
    }
    return false;
  };

  // 2. The cut and the bars before it on one page; the bars after it on the read-ahead page if they can be.
  let beforeOnly: number | null = null;
  for (let size = cap; size >= Math.max(1, cutTo - lo + 1); size -= 1) {
    const page = pageOf(lo, size);
    if (pageOf(cutTo, size) !== page) continue;
    if (pageOf(hi, size) === page + 1 && followedByNext(size)) return { bars: size, showFrom: lo, margins: 'shown' };
    beforeOnly ??= size;
  }
  if (beforeOnly !== null) return { bars: beforeOnly, showFrom: lo, margins: 'paged' };

  // 3. The cut alone.
  for (let size = cap; size >= Math.max(1, cutTo - cutFrom + 1); size -= 1) {
    if (pageOf(cutFrom, size) === pageOf(cutTo, size)) return { bars: size, showFrom: cutFrom, margins: 'paged' };
  }
  return { bars: cap, showFrom: cutFrom, margins: 'paged' };
}
