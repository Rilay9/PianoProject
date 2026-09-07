/**
 * Fitting the sheet to the screen (the S25's first real run).
 *
 * The owner's phone drew a two-bar window 237 px tall in a 708 px stage — a
 * third of the screen, the rest black, and the notes as small as they would be
 * on a desktop. What makes growing them safe is a fact about
 * OpenSheetMusicDisplay that was measured rather than assumed: raising its
 * zoom grows the staff's height and leaves the system's width alone. From zoom
 * 1.0 to 2.0 the one-bar system went 109 px to 218 px tall and 349 px to
 * 340 px wide.
 */
import { describe, expect, it } from 'vitest';
import { MAX_FIT, MIN_FIT, fitZoom, worthRefitting } from '../../src/score/autoFit';

describe('fitZoom', () => {
  it('asks for as much of the stage as the engraver will give — the owner’s numbers', () => {
    // 237 px drawn at zoom 1 in a 708 px stage wants 2.99, and gets the 2 that
    // OSMD will actually honour. That is still twice the size it was.
    expect(fitZoom(1, { height: 237 }, { height: 708 })).toBe(MAX_FIT);
  });

  it('asks for the same thing however big the picture already is', () => {
    // Same sheet, already drawn at 2: it must not ask for 2 again *times* two.
    expect(fitZoom(2, { height: 474 }, { height: 708 })).toBe(MAX_FIT);
    // And a window that is already the right size is left alone.
    expect(fitZoom(1.5, { height: 700 }, { height: 708 })).toBeCloseTo(1.52, 2);
  });

  it('shrinks a window that is taller than the stage', () => {
    expect(fitZoom(1, { height: 900 }, { height: 450 })).toBeCloseTo(0.5, 2);
  });

  it('stays inside its bounds', () => {
    expect(fitZoom(1, { height: 1 }, { height: 10_000 })).toBe(MAX_FIT);
    expect(fitZoom(1, { height: 10_000 }, { height: 1 })).toBe(MIN_FIT);
  });

  it('leaves things alone when there is nothing to measure', () => {
    // A stage that has not been laid out yet is a reason to wait, not to guess.
    for (const bad of [0, -5, Number.NaN]) {
      expect(fitZoom(1.4, { height: bad }, { height: 708 })).toBe(1.4);
      expect(fitZoom(1.4, { height: 237 }, { height: bad })).toBe(1.4);
    }
    expect(fitZoom(0, { height: 237 }, { height: 708 })).toBe(1);
  });
});

describe('worthRefitting', () => {
  it('is false for a change nobody would see', () => {
    expect(worthRefitting(2, 2)).toBe(false);
    expect(worthRefitting(2, 2.1)).toBe(false);
  });

  it('is true for the owner’s case — a third of the screen, to two thirds', () => {
    expect(worthRefitting(1, 2)).toBe(true);
  });

  it('stops rather than chasing its own tail at the ceiling', () => {
    // The fit converges on MAX_FIT and must then agree that it is done, or
    // every window swap would redraw for ever.
    expect(worthRefitting(MAX_FIT, MAX_FIT)).toBe(false);
  });

  it('says no to nonsense instead of redrawing on it', () => {
    expect(worthRefitting(0, 3)).toBe(false);
    expect(worthRefitting(Number.NaN, 3)).toBe(false);
  });
});
