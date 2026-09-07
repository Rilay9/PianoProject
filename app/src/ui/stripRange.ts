/**
 * How much of the keyboard the strip should show for a piece.
 *
 * The Score screen used to build the strip with no range at all, which means
 * all 88 keys — 52 white keys across a 360 px phone, about 7 px each. On the
 * owner's first real run the app was waiting for F#4 and marking it with a
 * blue sliver a few pixels wide, among 88 identical slivers. He spent forty
 * seconds playing every note from E3 to E4 and never found it. The engine was
 * right the whole time; the picture was unreadable.
 *
 * So the strip shows the range the music actually uses, padded out to whole
 * octaves. A piece that lives in one octave gets a strip you can hit with a
 * finger.
 */

// The piano's own limits come from the strip itself; two copies of 21 and 108
// is one more than there should be.
import { HIGHEST_KEY, LOWEST_KEY } from './KeyboardStrip';

/**
 * Never show less than this many semitones.
 *
 * Two octaves. A five-finger exercise spans a sixth, and a strip showing only
 * a sixth would be a row of six enormous keys with nowhere to go wrong — and
 * would jump about as soon as the piece moved. Two octaves is enough context
 * to see where the hand is.
 */
export const MIN_SPAN = 24;

/** C in the octave containing `midi`. */
function octaveFloor(midi: number): number {
  return midi - (((midi % 12) + 12) % 12);
}

/**
 * The range to draw, from the pitches a piece contains.
 *
 * Whole octaves, so the strip always starts on a C and the octave labels line
 * up with what a learner counts. Widened symmetrically to `MIN_SPAN` and then
 * clamped to a real piano — clamping last, so a piece at the very top of the
 * keyboard still gets its full width rather than being cut short by the pad.
 */
export function stripRangeFor(
  midis: Iterable<number>,
  options: { minSpan?: number } = {},
): { from: number; to: number } {
  const notes = [...midis].filter((midi) => Number.isFinite(midi));
  if (notes.length === 0) return { from: LOWEST_KEY, to: HIGHEST_KEY };

  const minSpan = options.minSpan ?? MIN_SPAN;
  let from = octaveFloor(Math.min(...notes));
  // The C *above* the top note, so the highest note is never the last key.
  let to = octaveFloor(Math.max(...notes)) + 12;

  while (to - from < minSpan) {
    if (to < HIGHEST_KEY) to += 12;
    if (to - from >= minSpan) break;
    if (from > LOWEST_KEY) from -= 12;
    // Neither end can move: the piano is smaller than the span we wanted.
    if (from <= LOWEST_KEY && to >= HIGHEST_KEY) break;
  }

  return { from: Math.max(LOWEST_KEY, from), to: Math.min(HIGHEST_KEY, to) };
}
