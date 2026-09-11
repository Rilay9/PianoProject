/**
 * The order to auto-detect a book's remaining pages in, once the page the
 * reader opened on is showing (docs/04 §5b, handoff-2026-09-09 §5).
 *
 * Detecting systems is a rendered page plus a pixel-by-pixel projection
 * profile, seconds of work on a phone once the page count runs into the
 * hundreds — a bound method book, not the two-page fixture the tests use.
 * Running that over every page before the first one is drawn means opening
 * a 400-page PDF makes the reader wait to see the page they asked for. The
 * page they opened on is detected up front; the rest happen afterward,
 * nearest the opening page first — that is where a reader turns to next,
 * not page 0 — so the detector stays ahead of them rather than working
 * through unrelated pages while the ones they are about to reach sit
 * undetected.
 */
export function backgroundDetectionOrder(pageCount: number, startPage: number): number[] {
  const order: number[] = [];
  if (pageCount <= 0) return order;
  const start = Math.min(Math.max(startPage, 0), pageCount - 1);
  for (let offset = 0; order.length < pageCount; offset += 1) {
    if (offset === 0) {
      order.push(start);
      continue;
    }
    const forward = start + offset;
    const backward = start - offset;
    if (forward < pageCount) order.push(forward);
    if (backward >= 0) order.push(backward);
  }
  return order;
}
