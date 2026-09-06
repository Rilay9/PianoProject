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
export const TABLET_BARS_PER_WINDOW = 4;

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
