// @vitest-environment jsdom
//
// The two slots (P21c §A1, §A5).
//
// The arithmetic on its own, with no OSMD and no DOM: which slot holds which
// bars at each step, which slot is re-drawn, and — the part that is easy to
// get wrong — what "what comes next" means when the piece repeats.
import { describe, expect, it } from 'vitest';
import { loadFixture } from './helpers/fixtures';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import type { ScoreStep } from '../../src/score/types';
import {
  barsPerSlot,
  nextRangeAfter,
  planSlots,
  rangeAt,
  type SlotIndex,
} from '../../src/score/slots';
import type { MeasureRange } from '../../src/score/OsmdView';

/** A step is only ever read for its printed bar here. */
function steps(bars: number[]): ScoreStep[] {
  return bars.map((sourceMeasureIndex, index) => ({
    index,
    onset: index,
    sourceOnset: index,
    notes: [],
    measureIndex: index,
    sourceMeasureIndex,
    isMeasureStart: true,
    repetitionIteration: 1,
  }));
}

function r(from: number, to: number): MeasureRange {
  return { fromMeasure: from, toMeasure: to };
}

/** Walks a whole piece and records what each slot holds at every step. */
function walk(
  all: ScoreStep[],
  barsPerWindow: number,
  count: number,
): { cursor: SlotIndex; ranges: [MeasureRange | null, MeasureRange | null]; fade: SlotIndex | null }[] {
  let state: { cursor: SlotIndex; ranges: [MeasureRange | null, MeasureRange | null] } = {
    cursor: 0,
    ranges: [null, null],
  };
  const seen = [];
  for (let i = 0; i < all.length; i += 1) {
    const plan = planSlots(all, i, state, barsPerWindow, count);
    state = { cursor: plan.cursor, ranges: plan.ranges };
    seen.push({ cursor: plan.cursor, ranges: plan.ranges, fade: plan.fade });
  }
  return seen;
}

describe('how many bars a slot holds', () => {
  it('is half the window, and never none', () => {
    expect(barsPerSlot(2)).toBe(1);
    expect(barsPerSlot(4)).toBe(2);
    expect(barsPerSlot(8)).toBe(4);
    // One bar per window has nothing to alternate; the screen falls back to
    // the sideways slide, and this must not divide to zero on the way.
    expect(barsPerSlot(1)).toBe(1);
  });
});

describe('which bars a slot holds', () => {
  it('tiles the piece from the first bar', () => {
    expect(rangeAt(0, 2, 5)).toEqual(r(0, 0));
    expect(rangeAt(3, 2, 5)).toEqual(r(3, 3));
    expect(rangeAt(0, 4, 5)).toEqual(r(0, 1));
    expect(rangeAt(3, 4, 5)).toEqual(r(2, 3));
  });

  it('stops at the last bar rather than running past it', () => {
    expect(rangeAt(4, 4, 5)).toEqual(r(4, 4));
    expect(rangeAt(99, 2, 5)).toEqual(r(4, 4));
  });
});

describe('a five-bar piece at two bars per window', () => {
  const all = steps([0, 1, 2, 3, 4]);

  it('puts the cursor in one slot and the coming bar in the other', () => {
    const seen = walk(all, 2, 5);
    expect(seen.map((s) => s.cursor)).toEqual([0, 1, 0, 1, 0]);
    expect(seen.map((s) => s.ranges)).toEqual([
      [r(0, 0), r(1, 1)],
      [r(2, 2), r(1, 1)],
      [r(2, 2), r(3, 3)],
      [r(4, 4), r(3, 3)],
      // The last bar has nothing after it, so the other slot goes blank rather
      // than showing bars that have been played (A1).
      [r(4, 4), null],
    ]);
  });

  it('never re-draws the slot the cursor is in', () => {
    for (const { cursor, fade } of walk(all, 2, 5)) {
      expect(fade).not.toBe(cursor);
    }
  });

  it('always has the bar after the cursor on the screen, until the last', () => {
    const seen = walk(all, 2, 5);
    for (let i = 0; i < all.length - 1; i += 1) {
      const state = seen[i];
      const nextBar = all[i + 1]?.sourceMeasureIndex ?? -1;
      const on = state?.ranges.some(
        (range) => range !== null && nextBar >= range.fromMeasure && nextBar <= range.toMeasure,
      );
      expect(on, `step ${String(i)} does not show bar ${String(nextBar)}`).toBe(true);
    }
  });
});

describe('a one-bar piece', () => {
  it('draws what it has and blanks the other slot', () => {
    const seen = walk(steps([0]), 2, 1);
    expect(seen[0]?.ranges).toEqual([r(0, 0), null]);
  });
});

describe('four bars per window', () => {
  it('gives each slot two bars', () => {
    const seen = walk(steps([0, 1, 2, 3, 4, 5]), 4, 6);
    expect(seen.map((s) => s.ranges)).toEqual([
      [r(0, 1), r(2, 3)],
      [r(0, 1), r(2, 3)],
      [r(4, 5), r(2, 3)],
      [r(4, 5), r(2, 3)],
      [r(4, 5), null],
      [r(4, 5), null],
    ]);
  });
});

describe('a seek', () => {
  it('draws both slots and starts the reading order at the top', () => {
    const all = steps([0, 1, 2, 3, 4]);
    const plan = planSlots(all, 3, { cursor: 1, ranges: [null, null] }, 2, 5);
    expect(plan.cursor).toBe(0);
    expect(plan.ranges).toEqual([r(3, 3), r(4, 4)]);
    // Nothing to be peripheral to, so nothing fades.
    expect(plan.fade).toBeNull();
  });
});

describe('what comes next, when the piece repeats', () => {
  it('is the bar that will be played, not the bar printed after', () => {
    // 0 1 0 2 — a repeat with a first and a second ending, which is what
    // `repeat-endings.musicxml` is.
    const all = steps([0, 1, 0, 2]);
    const seen = walk(all, 2, 3);

    // On the first pass through bar 1, what follows is bar 0 again.
    expect(nextRangeAfter(all, 1, r(1, 1), 2, 3)).toEqual(r(0, 0));
    // On the second pass through bar 0, what follows is the second ending —
    // not bar 1, which has already been played and will not be again.
    expect(nextRangeAfter(all, 2, r(0, 0), 2, 3)).toEqual(r(2, 2));

    expect(seen[2]?.ranges).toEqual([r(0, 0), r(2, 2)]);
    expect(seen[3]?.ranges).toEqual([null, r(2, 2)]);
  });
});

describe('the real repeat fixture', () => {
  it('shows the second ending as the repeat comes round', async () => {
    const osmd = await loadFixture('tests/fixtures/scores/edge/repeat-endings.musicxml');
    const model = extractScoreModel(osmd, { id: 'repeat-endings' });
    const played = [...new Set(model.steps.map((s) => s.sourceMeasureIndex))];
    // Three printed bars, played 0 1 0 2: the fixture is only useful if the
    // extractor really did unroll it.
    expect(played.length).toBeGreaterThan(1);
    const order: number[] = [];
    for (const step of model.steps) {
      if (order[order.length - 1] !== step.sourceMeasureIndex) order.push(step.sourceMeasureIndex);
    }
    expect(order).toEqual([0, 1, 0, 2]);

    const seen = walk(model.steps, 2, model.sourceMeasureCount);
    // At every step, the bar the next step is in must already be drawn.
    for (let i = 0; i < model.steps.length - 1; i += 1) {
      const nextBar = model.steps[i + 1]?.sourceMeasureIndex ?? -1;
      const on = seen[i]?.ranges.some(
        (range) => range !== null && nextBar >= range.fromMeasure && nextBar <= range.toMeasure,
      );
      expect(on, `step ${String(i)} does not show bar ${String(nextBar)}`).toBe(true);
    }
  });
});
