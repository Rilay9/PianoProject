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

/**
 * Whether a stage that has changed size should have its engraving searched
 * again — and the one case where it must not be.
 *
 * The size on the glass is the **engraving zoom times the CSS scale**, and
 * `searchForFit` moves the first of those. A run holds a *drawn* size (`08`
 * P21e A2), so when the zoom moves the frozen scale is converted to keep the
 * product — the sheet is the same size and every slot's `transform` is a
 * different number. That is not free and it is not invisible: the whole sheet
 * is re-engraved under the learner's hands, and anything reading the transform
 * reads a size change where there is none. `score.fuzz.spec.ts` read exactly
 * that on CI (seed 4, `0.773877 → 0.708097`, which is `0.773877 × 1.83 ÷ 2.00`
 * to six places — one drawn size, two zooms).
 *
 * So the two kinds of change are told apart by *what* changed:
 *
 * - **The width** — the phone was turned, or the window was dragged. The page
 *   the engraver lays a system out on is a different page, so the engraving
 *   has to be searched again whatever is going on. `08` §3.3 already says a
 *   turn releases the size a run is holding.
 * - **The height alone** — the control bar folded away, the keyboard strip was
 *   switched off, the header grew a line because a sentence wrapped. The page
 *   is the same page; only the room below it changed. During a run the answer
 *   is no: the run is holding its size and re-engraving cannot improve on a
 *   size that is not allowed to change. Off a run it is yes, because then the
 *   sheet *should* grow into the room.
 *
 * `fitted` is what the last engraving search was run against — `null` when
 * there has not been one — in the same units the caller measures in (a slot's
 * share of the stage for the height, the stage's own width).
 */
export function refitEngraving(
  available: { width: number; height: number },
  fitted: { width: number; height: number } | null,
  frozen: boolean,
): boolean {
  if (!(available.width > 0) || !(available.height > 0)) return false;
  if (!fitted) return true;
  if (Math.round(available.width) !== Math.round(fitted.width)) return true;
  if (Math.round(available.height) === Math.round(fitted.height)) return false;
  return !frozen;
}
