/**
 * The tablet breakpoint (docs/04 §7a).
 *
 * "≥ 900 CSS px on the **shortest side**" — both dimensions, not just the
 * width. A phone in landscape is 915 × 412 and would pass a width-only test
 * while having 412 px of height to put a side panel in, which is none.
 *
 * `00` A5: the owner has a phone. This exists so the app works *if* a tablet
 * ever appears, which is why it is a handful of lines rather than a layout
 * mode with its own screens.
 */

/** docs/04 §7a. */
export const TABLET_MIN_PX = 900;

/** The bars-per-window default on a tablet — §7a's number. */
// Two, like the phone, since 2026-09-08: the height a tablet has over a phone
// buys more *slots* at the same size (`08` §4.1), not more bars a slot — four
// bars a slot were width-limited and small the moment the lesson panel took
// its third of the width, and the owner's rule is that the notes must not get
// small.
export const TABLET_BARS_PER_WINDOW = 2;

export function isTablet(
  width: number = typeof window === 'undefined' ? 0 : window.innerWidth,
  height: number = typeof window === 'undefined' ? 0 : window.innerHeight,
): boolean {
  return Math.min(width, height) >= TABLET_MIN_PX;
}

/**
 * The bars to open a score at.
 *
 * A *setting* the owner has changed always wins: the tablet number is a
 * default for a screen with room for it, not an opinion about what he wants.
 * `storedIsDefault` is how the caller says "he has never touched this".
 */
export function barsPerWindowFor(
  stored: number,
  options: { tablet?: boolean; storedIsDefault?: boolean } = {},
): number {
  if (!options.tablet) return stored;
  return options.storedIsDefault ? TABLET_BARS_PER_WINDOW : stored;
}
