/**
 * How much keyboard the strip shows (the S25's first real run).
 *
 * The Score screen built its strip with no range, which means all 88 keys.
 * On a 360 px phone that is 52 white keys at about 7 px each, and the blue
 * key marking the expected note is a sliver among 88 slivers. Playing *Suo
 * Gân* the app was waiting for F#4 — which was on the screen the whole time —
 * and forty seconds of hunting from E3 to E4 never found it. The engine was
 * right; the picture was unreadable.
 */
import { describe, expect, it } from 'vitest';
import { HIGHEST_KEY, LOWEST_KEY } from '../../src/ui/KeyboardStrip';
import { MIN_SPAN, stripRangeFor } from '../../src/ui/stripRange';

/** Suo Gân's first bars: D4 E4 F#4 A4. */
const SUO_GAN = [62, 64, 66, 69];

describe('stripRangeFor', () => {
  it('covers the piece and starts on a C, so the octave labels mean something', () => {
    const { from, to } = stripRangeFor(SUO_GAN);
    expect(from % 12, 'the strip should start on a C').toBe(0);
    expect(from).toBeLessThanOrEqual(Math.min(...SUO_GAN));
    expect(to).toBeGreaterThanOrEqual(Math.max(...SUO_GAN));
  });

  it('turns that piece into something a finger can hit', () => {
    // The number that matters: 88 keys became this many.
    const { from, to } = stripRangeFor(SUO_GAN);
    expect(to - from).toBeLessThanOrEqual(MIN_SPAN);
    expect(to - from).toBeGreaterThanOrEqual(MIN_SPAN);
    // C4 to C6 — two octaves around a melody that lives in one.
    expect({ from, to }).toEqual({ from: 60, to: 84 });
  });

  it('never shows less than two octaves, however small the piece', () => {
    // A five-finger exercise spans a sixth. A strip showing a sixth would be
    // six enormous keys that jump about the moment the music moves.
    const { from, to } = stripRangeFor([60, 62, 64, 65, 67]);
    expect(to - from).toBeGreaterThanOrEqual(MIN_SPAN);
  });

  it('widens for a piece that spans the keyboard rather than cutting it off', () => {
    const wide = stripRangeFor([28, 100]);
    expect(wide.from).toBeLessThanOrEqual(28);
    expect(wide.to).toBeGreaterThanOrEqual(100);
  });

  it('stays on the piano at both ends', () => {
    for (const notes of [[LOWEST_KEY], [HIGHEST_KEY], [LOWEST_KEY, HIGHEST_KEY]]) {
      const { from, to } = stripRangeFor(notes);
      expect(from).toBeGreaterThanOrEqual(LOWEST_KEY);
      expect(to).toBeLessThanOrEqual(HIGHEST_KEY);
      expect(to).toBeGreaterThan(from);
    }
  });

  it('gives the whole keyboard when there are no notes to go on', () => {
    // A drill generated at runtime, a score that would not parse: the old
    // behaviour is the right fallback, it was only ever wrong as a default.
    expect(stripRangeFor([])).toEqual({ from: LOWEST_KEY, to: HIGHEST_KEY });
  });

  it('ignores rubbish rather than producing a range of NaN', () => {
    expect(stripRangeFor([Number.NaN, 62, Number.POSITIVE_INFINITY])).toEqual({
      from: 60,
      to: 84,
    });
  });

  it('is not upset by a piece whose notes arrive out of order', () => {
    expect(stripRangeFor([69, 62, 66, 64])).toEqual(stripRangeFor(SUO_GAN));
  });
});
