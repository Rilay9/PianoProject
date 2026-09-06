/**
 * Reordering a list by dragging, and by buttons (docs/04 §3).
 *
 * The arithmetic lives here, away from the DOM, because reordering is the kind
 * of code that looks obviously right and is off by one: moving an item
 * *downwards* removes it before the target index and moving it upwards does
 * not, so `splice(to, 0, …)` after a `splice(from, 1)` lands in the wrong place
 * exactly half the time.
 *
 * Track order matters: it is what the session builder walks to decide which
 * rung comes next, so getting it wrong quietly changes what the app tells the
 * owner to practise.
 */

/** `from` moved to sit at index `to`, in a new array. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return [...list];
  const clamped = Math.max(0, Math.min(list.length - 1, to));
  if (clamped === from) return [...list];
  const out = [...list];
  const [moved] = out.splice(from, 1);
  if (moved === undefined) return [...list];
  // After the removal every index above `from` has shifted down by one, so a
  // downward move inserts at `clamped` and an upward move inserts at
  // `clamped` too — because `clamped` was computed against the *original*
  // list and the splice already accounted for it. Written out rather than
  // reasoned about at the call site.
  out.splice(clamped, 0, moved);
  return out;
}

/** One step up, for the keyboard and button fallback. */
export function moveUp<T>(list: readonly T[], index: number): T[] {
  return moveItem(list, index, index - 1);
}

export function moveDown<T>(list: readonly T[], index: number): T[] {
  return moveItem(list, index, index + 1);
}

/**
 * Which item a pointer is over, from the items' bounding boxes.
 *
 * Compares against each box's midpoint rather than its edges: dragging onto
 * the left half of an item means "before it" and the right half means "after
 * it", which is what makes a drop feel like it landed where the finger was
 * rather than one place off.
 */
export function indexAtPoint(
  boxes: readonly { left: number; right: number; top: number; bottom: number }[],
  x: number,
  y: number,
): number | null {
  for (let i = 0; i < boxes.length; i += 1) {
    const box = boxes[i];
    if (!box) continue;
    if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return i;
  }
  // Outside every box: fall back to the nearest by horizontal centre, so a
  // drag that strays above or below the row still does something sensible
  // rather than nothing.
  let best: number | null = null;
  let bestDistance = Infinity;
  for (let i = 0; i < boxes.length; i += 1) {
    const box = boxes[i];
    if (!box) continue;
    const distance = Math.abs((box.left + box.right) / 2 - x);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/**
 * How far a pointer must travel before a press becomes a drag.
 *
 * A chip is a toggle first and a drag handle second. Without a threshold every
 * tap that wobbles by a pixel would reorder the list instead of switching the
 * track on, which on a phone is most taps.
 */
export const DRAG_THRESHOLD_PX = 8;

export function isDrag(dx: number, dy: number, threshold = DRAG_THRESHOLD_PX): boolean {
  return Math.hypot(dx, dy) >= threshold;
}
