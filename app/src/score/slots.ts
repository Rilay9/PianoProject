// Which bars each of the two slots holds, and when one of them changes.
//
// The Score screen upright draws two systems. Until now they were one window:
// two bars engraved together, replaced together, so advancing moved the bar
// being played from the bottom system to the top mid-phrase, every other bar.
// That is the jump the owner felt — "someone playing wouldn't have enough time
// to match the playing since they won't see the next bar in time".
//
// So the two systems become two **slots**. The slot holding the cursor is
// never touched; the other one shows what comes next. When the cursor crosses
// into the other slot, the one it just left is re-drawn with the bars after —
// the eye goes top, bottom, top, and the coming bar has been on the screen for
// a whole bar by the time it is needed (docs/04-ui-spec.md §5).
//
// This module is the arithmetic only: no DOM, no OSMD, no rendering. That is
// what makes it testable, and the part that is easy to get wrong is arithmetic
// — particularly around repeats, where "the next bars" is not "the bars after
// these ones".

import type { MeasureRange } from './OsmdView';
import type { ScoreStep } from './types';

/** The two slots, in the order they are drawn: 0 above 1. */
export type SlotIndex = 0 | 1;

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
): MeasureRange {
  const size = barsPerSlot(barsPerWindow);
  const last = Math.max(0, sourceMeasureCount - 1);
  const bar = Math.min(Math.max(0, sourceMeasureIndex), last);
  const from = Math.floor(bar / size) * size;
  return { fromMeasure: from, toMeasure: Math.min(from + size - 1, last) };
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
 * What the other slot should show, given where the cursor is.
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
 * `null` when nothing follows — the last bars of the piece. The caller blanks
 * the slot rather than leaving stale bars in it.
 */
export function nextRangeAfter(
  steps: readonly ScoreStep[],
  fromStepIndex: number,
  range: MeasureRange,
  barsPerWindow: number,
  sourceMeasureCount: number,
): MeasureRange | null {
  for (let i = Math.max(0, fromStepIndex); i < steps.length; i += 1) {
    const step = steps[i];
    if (!step) continue;
    if (!inRange(range, step.sourceMeasureIndex)) {
      return rangeAt(step.sourceMeasureIndex, barsPerWindow, sourceMeasureCount);
    }
  }
  return null;
}

export interface SlotPlan {
  /** Which slot the cursor's bars are in. */
  cursor: SlotIndex;
  /** What each slot should hold; `null` means blank. */
  ranges: [MeasureRange | null, MeasureRange | null];
  /**
   * The slot that should fade in, or `null`.
   *
   * A slot that changes while the eye is on the other one fades over about
   * 150 ms, because peripheral vision ignores a fade and notices a flash. A
   * cold draw — a seek, a restart, the first step — changes both slots with
   * nothing to be peripheral to, so it fades nothing.
   */
  fade: SlotIndex | null;
  /** True when the cursor moved from one slot to the other on this step. */
  crossed: boolean;
}

/**
 * Where the cursor is and what, if anything, has to be re-drawn.
 *
 * Three cases, and the third is the one that matters:
 *
 *  - the cursor is still in its slot — nothing moves, and the other slot is
 *    already showing what comes next;
 *  - the cursor has crossed into the other slot — that slot becomes the cursor
 *    slot untouched, and the one just vacated takes the bars after it;
 *  - the cursor is in neither, which is a seek, a restart or a jump — both
 *    slots are drawn, cursor in slot 0, so the reading order starts at the top
 *    again rather than wherever the last run happened to leave it.
 */
export function planSlots(
  steps: readonly ScoreStep[],
  stepIndex: number,
  current: { cursor: SlotIndex; ranges: [MeasureRange | null, MeasureRange | null] },
  barsPerWindow: number,
  sourceMeasureCount: number,
): SlotPlan {
  const step = steps[stepIndex];
  const bar = step ? step.sourceMeasureIndex : 0;
  const wanted = rangeAt(bar, barsPerWindow, sourceMeasureCount);
  const other: SlotIndex = current.cursor === 0 ? 1 : 0;
  const next = (r: MeasureRange): MeasureRange | null =>
    nextRangeAfter(steps, stepIndex, r, barsPerWindow, sourceMeasureCount);

  const held: [MeasureRange | null, MeasureRange | null] = [
    current.ranges[0],
    current.ranges[1],
  ];

  if (sameRange(held[current.cursor], wanted)) {
    const ahead = next(wanted);
    const settled = ahead === null ? held[other] === null : sameRange(held[other], ahead);
    if (settled) return { cursor: current.cursor, ranges: held, fade: null, crossed: false };
    const ranges: [MeasureRange | null, MeasureRange | null] =
      other === 0 ? [ahead, held[1]] : [held[0], ahead];
    return { cursor: current.cursor, ranges, fade: other, crossed: false };
  }

  if (sameRange(held[other], wanted)) {
    // The crossing. The slot the eye has moved to is already drawn and is not
    // touched; the one it left takes the bars after — which is what buys the
    // read-ahead a whole bar of warning instead of none.
    const ahead = next(wanted);
    const ranges: [MeasureRange | null, MeasureRange | null] =
      current.cursor === 0 ? [ahead, held[1]] : [held[0], ahead];
    return { cursor: other, ranges, fade: current.cursor, crossed: true };
  }

  // Neither slot holds it: a seek, a restart, or the first step. Both are
  // drawn, cursor on top, so the reading order starts at the top rather than
  // wherever the previous run happened to leave it.
  return { cursor: 0, ranges: [wanted, next(wanted)], fade: null, crossed: false };
}
