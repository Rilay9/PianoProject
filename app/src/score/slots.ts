// Which bars each slot holds, and when one of them changes.
//
// The Score screen upright draws several systems — two on a phone sideways
// when it is tall enough, four upright, more on a tablet — and they are
// **slots**: the slot holding the cursor is never touched; the others show
// what comes next. When the cursor crosses into the next slot, the one it
// just left is re-drawn with the bars after the last on the screen — the eye
// goes down the screen and back to the top, the arrangement karaoke uses, and
// the coming bars have been on the screen for a whole system by the time they
// are needed (docs/04-ui-spec.md §5, docs/08 §4.1).
//
// Two slots was the phone's number; the height that is left over upright,
// where the width limits the size, buys more systems rather than bigger ones
// (docs/08 §3.2). The arithmetic is the same for any count.
//
// This module is the arithmetic only: no DOM, no OSMD, no rendering. That is
// what makes it testable, and the part that is easy to get wrong is arithmetic
// — particularly around repeats, where "the next bars" is not "the bars after
// these ones".

import type { MeasureRange } from './OsmdView';
import type { ScoreStep } from './types';

/** A slot's index, in the order they are drawn: 0 at the top. */
export type SlotIndex = number;

/** How many printed bars one slot holds, for a window of `barsPerWindow`. */
export function barsPerSlot(barsPerWindow: number): number {
  return Math.max(1, Math.floor(barsPerWindow / 2));
}

/**
 * The block of printed bars a bar belongs to.
 *
 * Blocks tile the piece from bar 0, so a bar is always in exactly one, and the
 * slot showing it does not depend on how the learner arrived there — a seek, a
 * restart and a repeat all land on the same block for the same bar.
 */
export function rangeAt(
  sourceMeasureIndex: number,
  barsPerWindow: number,
  sourceMeasureCount: number,
  pickup = false,
): MeasureRange {
  const size = barsPerSlot(barsPerWindow);
  const last = Math.max(0, sourceMeasureCount - 1);
  const bar = Math.min(Math.max(0, sourceMeasureIndex), last);
  // A pickup goes with the bars after it: the first block is the pickup and
  // the `size` bars it leads into, and the blocks after tile from bar 1. It
  // is the upbeat to bar 1, and a block on its own would be one note drawn
  // the width of the screen — and the engraver cannot draw a range that
  // starts at bar 1 without the pickup in front (`OsmdView.setRange`).
  const from = pickup
    ? bar <= size
      ? 0
      : Math.floor((bar - 1) / size) * size + 1
    : Math.floor(bar / size) * size;
  const to = pickup && from === 0 ? size : from + size - 1;
  return { fromMeasure: from, toMeasure: Math.min(to, last) };
}

export function inRange(range: MeasureRange | null, sourceMeasureIndex: number): boolean {
  if (!range) return false;
  return sourceMeasureIndex >= range.fromMeasure && sourceMeasureIndex <= range.toMeasure;
}

export function sameRange(a: MeasureRange | null, b: MeasureRange | null): boolean {
  if (!a || !b) return false;
  return a.fromMeasure === b.fromMeasure && a.toMeasure === b.toMeasure;
}

/**
 * What comes after `range`, given where the cursor is.
 *
 * **Not** the bars printed after `range`. `ScoreStep` carries the playback
 * order with repeats unrolled, so the honest answer to "what comes next" is
 * the bar of the next step that is not already on the screen: at the end of a
 * repeated section that is the repeat's first bar, and at a first- or
 * second-time ending it is the ending that will actually be played on this
 * pass. Reading the printed bar after the repeat sign would put a bar on the
 * screen that the player is not about to play, which is worse than showing
 * nothing (P21c A5).
 *
 * `null` when nothing follows — the last bars of the piece.
 */
export function nextRangeAfter(
  steps: readonly ScoreStep[],
  fromStepIndex: number,
  range: MeasureRange,
  barsPerWindow: number,
  sourceMeasureCount: number,
  pickup = false,
): MeasureRange | null {
  for (let i = Math.max(0, fromStepIndex); i < steps.length; i += 1) {
    const step = steps[i];
    if (!step) continue;
    if (!inRange(range, step.sourceMeasureIndex)) {
      return rangeAt(step.sourceMeasureIndex, barsPerWindow, sourceMeasureCount, pickup);
    }
  }
  return null;
}

/**
 * The blocks that follow the cursor's, in playing order, up to `count` of
 * them: the first block after leaving the cursor's, the first after leaving
 * that one, and so on. Fewer when the piece ends first.
 */
export function blocksAhead(
  steps: readonly ScoreStep[],
  fromStepIndex: number,
  range: MeasureRange,
  barsPerWindow: number,
  sourceMeasureCount: number,
  count: number,
  pickup = false,
): MeasureRange[] {
  const out: MeasureRange[] = [];
  let current = range;
  let at = Math.max(0, fromStepIndex);
  while (out.length < count) {
    // Advance to the first step outside the current block.
    while (at < steps.length && inRange(current, steps[at]?.sourceMeasureIndex ?? -1)) at += 1;
    const step = steps[at];
    if (!step) break;
    current = rangeAt(step.sourceMeasureIndex, barsPerWindow, sourceMeasureCount, pickup);
    out.push(current);
  }
  return out;
}

/**
 * The blocks *before* the cursor's, nearest first, up to `count` of them.
 *
 * Only the end of a piece needs these. `08` invariant 8 asks that the end fill
 * every slot wherever there are bars behind to fill them with, and a warm walk
 * does that for free — a slot with nothing coming keeps the bars it was already
 * showing. A cold draw has nothing to keep: seeking to the last bar, restarting
 * at it, or the first draw of a piece opened there left slot 0 with the final
 * system and the rest of the screen black.
 */
export function blocksBehind(
  range: MeasureRange,
  barsPerWindow: number,
  sourceMeasureCount: number,
  count: number,
  pickup = false,
): MeasureRange[] {
  const out: MeasureRange[] = [];
  let current = range;
  while (out.length < count && current.fromMeasure > 0) {
    const previous = rangeAt(current.fromMeasure - 1, barsPerWindow, sourceMeasureCount, pickup);
    // A block that does not actually move backwards would loop for ever.
    if (previous.fromMeasure >= current.fromMeasure) break;
    out.push(previous);
    current = previous;
  }
  return out;
}

export interface SlotPlan {
  /** Which slot the cursor's bars are in. */
  cursor: SlotIndex;
  /** What each slot should hold; `null` means blank. */
  ranges: (MeasureRange | null)[];
  /**
   * The slots that should fade in.
   *
   * A slot that changes while the eye is on another one fades over about
   * 150 ms, because peripheral vision ignores a fade and notices a flash. A
   * cold draw — a seek, a restart, the first step — changes every slot with
   * nothing to be peripheral to, so it fades nothing.
   */
  fades: SlotIndex[];
  /** True when the cursor moved from one slot to another on this step. */
  crossed: boolean;
}

/**
 * Where the cursor is and what, if anything, has to be re-drawn.
 *
 * Three cases, and the third is the one that matters:
 *
 *  - the cursor is still in its slot — the slots after it, round the screen,
 *    already hold the coming blocks, and nothing moves;
 *  - the cursor has crossed into another slot — that slot becomes the cursor
 *    slot untouched, and the slots round from it take the coming blocks, so
 *    the one just vacated gets the block after the last on the screen;
 *  - the cursor is in no slot, which is a seek, a restart or a jump — every
 *    slot is drawn, cursor in slot 0, so the reading order starts at the top
 *    again rather than wherever the last run happened to leave it.
 *
 * At the end of the piece a slot with nothing ahead to show **keeps what it
 * has** — the bars just played — rather than going blank, which on a phone is
 * half the screen gone black for the last bars of every song. Only a cold
 * draw at the end leaves a slot blank, having nothing to keep.
 */
export function planSlots(
  steps: readonly ScoreStep[],
  stepIndex: number,
  current: { cursor: SlotIndex; ranges: readonly (MeasureRange | null)[] },
  barsPerWindow: number,
  sourceMeasureCount: number,
  slotCount = current.ranges.length,
  pickup = false,
): SlotPlan {
  const count = Math.max(1, slotCount);
  const step = steps[stepIndex];
  const bar = step ? step.sourceMeasureIndex : 0;
  const wanted = rangeAt(bar, barsPerWindow, sourceMeasureCount, pickup);
  const held: (MeasureRange | null)[] = Array.from({ length: count }, (_, i) => current.ranges[i] ?? null);

  let cursor = held.findIndex((range) => sameRange(range, wanted));
  const cold = cursor < 0;
  if (cold) cursor = 0;
  const crossed = !cold && cursor !== current.cursor;

  const ahead = blocksAhead(steps, stepIndex, wanted, barsPerWindow, sourceMeasureCount, count - 1, pickup);

  // A cold draw near the end has fewer blocks ahead than there are slots to
  // fill, and nothing already on the screen to keep. Fill downwards from the
  // bars behind instead, and put the cursor where reading order puts it — last
  // but for whatever *is* ahead — so the final system is at the foot of the
  // screen with what led up to it above, rather than alone at the top with the
  // rest black (`08` invariant 8).
  if (cold && ahead.length < count - 1) {
    const behind = blocksBehind(wanted, barsPerWindow, sourceMeasureCount, count - 1 - ahead.length, pickup);
    const at = behind.length;
    const filled: (MeasureRange | null)[] = Array.from({ length: count }, () => null);
    behind.forEach((range, i) => (filled[at - 1 - i] = range));
    filled[at] = wanted;
    ahead.forEach((range, i) => (filled[at + 1 + i] = range));
    return { cursor: at as SlotIndex, ranges: filled, fades: [], crossed: false };
  }

  const ranges: (MeasureRange | null)[] = held.slice();
  const fades: SlotIndex[] = [];
  ranges[cursor] = wanted;
  for (let k = 1; k < count; k += 1) {
    const slot = (cursor + k) % count;
    const coming = ahead[k - 1];
    if (coming === undefined) {
      // Nothing ahead: keep the bars just played, or blank when there is
      // nothing to keep.
      if (cold) ranges[slot] = null;
      continue;
    }
    if (sameRange(held[slot] ?? null, coming)) continue;
    ranges[slot] = coming;
    if (!cold) fades.push(slot);
  }
  return { cursor, ranges, fades, crossed };
}
