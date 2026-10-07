import { describe, expect, it } from 'vitest';
import { excerptPage, pageRange, type PageModel } from '../../src/ui/screens/excerptPage';

/**
 * The page the excerpt view opens on (E1 item 6: the reviewer sees outside the cut). The renderer
 * draws the page the cursor is on in full ink and the page played next, muted, in its second slot,
 * so the cut must be on the page opened, in full, and the bars before it on that page wherever the
 * cut and they fit in one; the words claim both margins on screen only when they are.
 *
 * Found on the pictures of the five approved windows: the view opened on the cut's own page, so
 * the two bars before a cut were on screen for none of the four that do not start at bar 1.
 */

const MARGIN = 2;
const MOST = 8;

/** A parent of `bars` printed bars played straight through, one step a bar. */
function straight(bars: number, pickup = false): PageModel {
  return { sourceMeasureCount: bars, pickup, steps: Array.from({ length: bars }, (_, index) => ({ sourceMeasureIndex: index })) };
}

/** The page opened, as 1-based printed bars. */
function opened(model: PageModel, fromBar: number, toBar: number): { from: number; to: number; margins: string } {
  const page = excerptPage(model, fromBar, toBar, MARGIN, MOST);
  const range = pageRange(model, page.showFrom, page.bars);
  return { from: range.from + 1, to: range.to + 1, margins: page.margins };
}

describe('the page the excerpt view opens on (E1)', () => {
  it('holds the cut in full and the two bars before it, where six bars hold them (Ode to Joy, bars 9–12 of 17)', () => {
    const page = opened(straight(17), 9, 12);
    expect(page.from).toBeLessThanOrEqual(7);
    expect(page.to).toBeGreaterThanOrEqual(12);
    // Bars 13–14 are on the read-ahead page, played next: both margins are on screen.
    expect(page.margins).toBe('shown');
  });

  it('holds the cut in full and says the bars before it are a page away when the two do not fit (Anh. 113, bars 25–32 of 32)', () => {
    const page = opened(straight(32), 25, 32);
    expect(page).toEqual({ from: 25, to: 32, margins: 'paged' });
  });

  it('never claims the bars after the cut are on screen when a repeat sends the playing back from its last bar', () => {
    // Bars 1–28, a repeat back to bar 25 at the end of bar 28, then bars 29–40.
    const steps = [
      ...Array.from({ length: 28 }, (_, index) => ({ sourceMeasureIndex: index })),
      ...[24, 25, 26, 27].map((index) => ({ sourceMeasureIndex: index })),
      ...Array.from({ length: 12 }, (_, index) => ({ sourceMeasureIndex: 28 + index })),
    ];
    const page = opened({ sourceMeasureCount: 40, steps }, 25, 28);
    expect(page.from).toBeLessThanOrEqual(23);
    expect(page.to).toBeGreaterThanOrEqual(28);
    expect(page.margins).toBe('paged');
  });

  it('opens a cut from bar 1 of a piece with a pickup on the page that holds the pickup', () => {
    const page = opened(straight(12, true), 1, 4);
    expect(page.from).toBe(1);
    expect(page.to).toBeGreaterThanOrEqual(4);
    expect(page.margins).toBe('shown');
  });
});
