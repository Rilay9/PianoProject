/**
 * How big to draw the sheet so the window fills the screen.
 *
 * Measured on the owner's S25, portrait, playing *Suo Gân*: the stage is
 * 360 × 708 and the two-bar window drew 358 × 237 — a third of the height,
 * the rest black. The notes were as small as they would be on a desktop, on a
 * phone propped on a music stand.
 *
 * The thing that makes this safe is a fact about OpenSheetMusicDisplay that
 * was measured rather than assumed: **raising its zoom grows the staff's
 * height and leaves the system's width where it is.** From zoom 1.0 to 2.0 the
 * one-bar system went 109 px to 218 px tall and 349 px to 340 px wide. So a
 * bigger sheet never overflows sideways, and the only limit is how tall the
 * box is.
 *
 * Hence: pick the zoom that fills the height, and let the owner's own zoom
 * control ride on top of it as a multiplier rather than as an absolute.
 */

/**
 * Bounds on the fitted zoom.
 *
 * The floor is not 0: a piece whose window is *taller* than the stage — a
 * grand staff of six systems in landscape — has to be allowed to shrink.
 * The ceiling is where OSMD's own spacing starts to look coarse rather than
 * generous, and it is far beyond anything a phone reaches: the S25 in
 * portrait wants about 3.
 */
export const MIN_FIT = 0.5;
/**
 * 2, because that is where OpenSheetMusicDisplay stops growing.
 *
 * Measured on a 360 px stage with the two-bar window of *Suo Gân*: 237 px tall
 * at zoom 1, 474 px at zoom 2 — exactly linear — and still 474 px at 2.5 and
 * at 4. Asking for a zoom the engraver ignores costs a render and leaves the
 * owner's own +/- buttons doing nothing, which is the failure this whole
 * change exists to remove. Two-thirds of a phone screen is what this window
 * can have, and it is twice what it had.
 */
export const MAX_FIT = 2;

/**
 * The zoom that makes `drawn` fill `available`, given what it was drawn at.
 *
 * Height only. Width is pinned by the engraver, so asking for it would always
 * return about 1 and would cancel the answer out.
 *
 * `NaN` and zero sizes give back the zoom that was passed in: a stage that has
 * not been laid out yet is a reason to leave things alone, not to guess.
 */
export function fitZoom(
  drawnAtZoom: number,
  drawn: { height: number },
  available: { height: number },
): number {
  if (!(drawnAtZoom > 0) || !(drawn.height > 0) || !(available.height > 0)) {
    return drawnAtZoom > 0 ? drawnAtZoom : 1;
  }
  const wanted = drawnAtZoom * (available.height / drawn.height);
  return Math.min(MAX_FIT, Math.max(MIN_FIT, Math.round(wanted * 100) / 100));
}

/**
 * Whether a re-render is worth it.
 *
 * Every fit costs an OSMD render, so a fit that would change the picture by a
 * few per cent is not worth a redraw — and, more to the point, a fit that
 * chases its own tail would redraw for ever.
 */
export function worthRefitting(current: number, target: number): boolean {
  if (!(current > 0) || !(target > 0)) return false;
  return Math.abs(target - current) / current > 0.08;
}
