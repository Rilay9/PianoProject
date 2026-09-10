// How much room a system of a piece needs (`08` §3.2 step 3).
//
// The fault this exists for: the height reserved for a window was the tallest
// stave span in the piece plus the upper quartile of the overhangs above plus
// the upper quartile of the overhangs below — three different systems' worst
// cases added together. The sum is a height no system in the piece has, and on
// Chopin's Nocturne op. 27 no. 1 it reserved 505 px where the tallest system
// occupies 463 and the typical one 397. The sheet was drawn at 0.56 instead of
// 0.71 and the staves covered 54 % of a 342 px screen.
//
// Every case below fails against that arithmetic and passes against the
// quartile of the systems' own extents.
import { describe, expect, it } from 'vitest';
import { pieceExtent, type SystemExtent } from '../../src/score/WindowRenderer';

/** A system whose staves span `span`, with `above` over them and `below` under. */
function system(top: number, span: number, above: number, below: number): SystemExtent {
  return { top, bottom: top + span, inkTop: top - above, inkBottom: top + span + below };
}

describe('pieceExtent', () => {
  it('never reserves more than the tallest system in the piece occupies', () => {
    // One system has the widest staves, a different one the deepest ink under
    // them, a third the highest ink over them. Added up they make 60 + 40 + 30
    // = 130; no system here is taller than 110.
    const systems = [
      system(0, 60, 5, 5), // 70
      system(200, 40, 40, 5), // 85
      system(400, 40, 5, 30), // 75
      system(600, 50, 10, 20), // 80
    ];
    const tallest = Math.max(...systems.map((s) => s.inkBottom - s.inkTop));
    const { height } = pieceExtent(systems);
    expect(height).toBeLessThanOrEqual(tallest);
  });

  it('takes the upper quartile of the extents, not the maximum', () => {
    // Four systems at 100 and one freak at 400: the quartile is 100, so one
    // rare bar cannot cost every window three quarters of its size.
    const systems = [
      system(0, 90, 5, 5),
      system(200, 90, 5, 5),
      system(400, 90, 5, 5),
      system(600, 90, 5, 5),
      system(800, 390, 5, 5),
    ];
    expect(pieceExtent(systems).height).toBe(100);
  });

  it('rounds the quartile up, so two systems give the taller of the two', () => {
    // The floor picked the shorter of two, and a piece whose second system
    // carried the high notes was fitted to its first.
    expect(pieceExtent([system(0, 80, 0, 0), system(200, 120, 0, 0)]).height).toBe(120);
  });

  it('keeps above and below as overhangs of their own, for the placement', () => {
    // The stave is anchored `above` below the slot's top whatever the height
    // works out to, so these two must stay the quartiles of the overhangs and
    // must not be folded into the height figure.
    const { above, below } = pieceExtent([
      system(0, 80, 10, 4),
      system(200, 80, 30, 4),
      system(400, 80, 10, 12),
      system(600, 80, 10, 4),
    ]);
    expect(above).toBe(30);
    expect(below).toBe(12);
  });

  it('is not fooled by the order the systems arrive in', () => {
    const systems = [system(0, 90, 5, 5), system(200, 190, 5, 5), system(400, 40, 5, 5)];
    const reversed = [...systems].reverse();
    expect(pieceExtent(systems)).toEqual(pieceExtent(reversed));
  });

  it('says nothing rather than something wrong when there are no systems', () => {
    expect(pieceExtent([])).toEqual({ above: 0, below: 0, height: 0 });
  });
});
