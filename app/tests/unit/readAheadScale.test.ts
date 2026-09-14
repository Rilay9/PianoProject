// The read-ahead cap on the sideways fit (`08` §4.1 CHUNK).
//
// The slide holds the bar being played a third of the way across the stage.
// The height chooses the size; this caps it so that the widest bar and the
// first beat of the next both fit to the right of the slide target — the
// owner's requirement that the beginning of the next music is always on the
// glass while the current bar is played. Pure arithmetic, so it is checked
// here in the unit it is stated in, and end to end by `score.layout.spec`.
import { describe, expect, it } from 'vitest';
import { readAheadScale } from '../../src/score/WindowRenderer';

describe('readAheadScale', () => {
  it('is no limit at all while nothing has been measured', () => {
    expect(readAheadScale(880, 0, 151)).toBe(Infinity);
    expect(readAheadScale(0, 353, 151)).toBe(Infinity);
    expect(readAheadScale(880, Number.NaN, 151)).toBe(Infinity);
  });

  it('caps the scale so the widest bar and a beat of the next fit right of the slide target', () => {
    // The room right of the target is what is left of the width after the
    // slide's fraction and the inset; the bar needs itself and a quarter.
    const stage = 880;
    const bar = 353;
    const scale = readAheadScale(stage, bar, 0);
    const drawnBar = bar * scale;
    const start = stage * 0.34;
    // The bar itself ends inside the stage, with a beat of the next still on it.
    expect(start + drawnBar).toBeLessThan(stage);
    expect(start + drawnBar * 1.25).toBeLessThanOrEqual(stage);
    // And not smaller than it has to be: a hair more and the beat is off the glass.
    expect(start + drawnBar * 1.25 * 1.02).toBeGreaterThan(stage);
  });

  it('is monotonic: a wider bar or a narrower stage means a smaller sheet', () => {
    expect(readAheadScale(880, 353, 0)).toBeLessThan(readAheadScale(880, 207, 0));
    expect(readAheadScale(740, 353, 0)).toBeLessThan(readAheadScale(880, 353, 0));
  });

  it('never goes below the readable staff, whatever the bar costs', () => {
    // A bar so wide that fitting it would draw the staff at a fraction of
    // its floor: the floor wins and the bar is slid past instead.
    const staff = 151;
    const scale = readAheadScale(880, 20_000, staff);
    expect(staff * scale).toBeCloseTo(40, 5);
    // The floor is a floor, not a value: a bar that fits above it is unaffected.
    expect(readAheadScale(880, 353, staff)).toBeGreaterThan(40 / staff);
  });

  it('leaves a piece of narrow bars to the height', () => {
    // Twinkle's widest bar sideways: the cap is well above any scale the
    // height of a phone allows, so the height decides, as it always did.
    expect(readAheadScale(880, 207, 151)).toBeGreaterThan(2);
  });
});
