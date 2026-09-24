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
  blocksBehind,
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

/**
 * Walks a whole piece and records what each slot holds at every step.
 *
 * `systems` is how many systems the window is laid over, which T32 made an
 * input rather than an assumption: these walks are all written for a window
 * split in two, which is what the arithmetic used to hard-code
 * (`barsPerSlot(n) = floor(n / 2)`).
 */
function walk(
  all: ScoreStep[],
  barsPerWindow: number,
  count: number,
  slots = 2,
  systems = 2,
): { cursor: SlotIndex; ranges: (MeasureRange | null)[]; fades: SlotIndex[] }[] {
  let state: { cursor: SlotIndex; ranges: (MeasureRange | null)[] } = {
    cursor: 0,
    ranges: Array.from({ length: slots }, () => null),
  };
  const seen = [];
  for (let i = 0; i < all.length; i += 1) {
    const plan = planSlots(all, i, state, barsPerWindow, count, slots, false, systems);
    state = { cursor: plan.cursor, ranges: plan.ranges };
    seen.push({ cursor: plan.cursor, ranges: plan.ranges, fades: plan.fades });
  }
  return seen;
}

describe('how many bars a system holds', () => {
  // It used to be half the window, from when SLOTS meant exactly two systems,
  // and that is the arithmetic T32 replaced: the window is the number asked
  // and the systems are how it is laid out (`slots.barsPerSlot`).
  it('is the window divided over its systems, rounded up, and never none', () => {
    expect(barsPerSlot(2, 1)).toBe(2);
    expect(barsPerSlot(2, 2)).toBe(1);
    expect(barsPerSlot(4, 2)).toBe(2);
    expect(barsPerSlot(8, 3)).toBe(3);
    // Three over two is two and one, not one and one: the rounding is up so
    // the window is covered, and `rangeAt` clips the last system at the
    // window's end so the count stays exact.
    expect(barsPerSlot(3, 2)).toBe(2);
    // One bar over one system, and nothing divides to zero on the way.
    expect(barsPerSlot(1)).toBe(1);
    expect(barsPerSlot(1, 4)).toBe(1);
  });
});

describe('which bars a slot holds', () => {
  it('tiles the piece from the first bar', () => {
    // One system to a window: the block is the window.
    expect(rangeAt(0, 2, 5)).toEqual(r(0, 1));
    expect(rangeAt(3, 2, 5)).toEqual(r(2, 3));
    expect(rangeAt(0, 4, 5)).toEqual(r(0, 3));
    // Two systems to a window: the window is halved, and both halves are in
    // the same window.
    expect(rangeAt(0, 4, 8, false, 2)).toEqual(r(0, 1));
    expect(rangeAt(3, 4, 8, false, 2)).toEqual(r(2, 3));
    expect(rangeAt(4, 4, 8, false, 2)).toEqual(r(4, 5));
  });

  it('clips the last system at the window, so the count is exact', () => {
    // Three bars over two systems is 2 + 1 — never 2 + 2, which would draw
    // four bars for a window of three (the fault T30 counted 266 times).
    expect(rangeAt(0, 3, 9, false, 2)).toEqual(r(0, 1));
    expect(rangeAt(2, 3, 9, false, 2)).toEqual(r(2, 2));
    expect(rangeAt(3, 3, 9, false, 2)).toEqual(r(3, 4));
    expect(rangeAt(5, 3, 9, false, 2)).toEqual(r(5, 5));
  });

  it('stops at the last bar rather than running past it', () => {
    expect(rangeAt(4, 4, 5)).toEqual(r(4, 4));
    expect(rangeAt(99, 2, 5)).toEqual(r(4, 4));
  });

  // A pickup is the upbeat to bar 1, and the engraver cannot draw a range
  // that starts at bar 1 without it: the first block is the pickup and the
  // bars it leads into, and the blocks after tile from bar 1.
  it('puts a pickup with the first bars, and tiles from bar 1 after it', () => {
    expect(rangeAt(0, 2, 9, true)).toEqual(r(0, 2));
    expect(rangeAt(1, 2, 9, true)).toEqual(r(0, 2));
    expect(rangeAt(3, 2, 9, true)).toEqual(r(3, 4));
    expect(rangeAt(8, 2, 9, true)).toEqual(r(7, 8));
    expect(rangeAt(0, 2, 9, true, 2)).toEqual(r(0, 1));
    expect(rangeAt(2, 2, 9, true, 2)).toEqual(r(2, 2));
    expect(rangeAt(0, 4, 9, true)).toEqual(r(0, 4));
    expect(rangeAt(2, 4, 9, true)).toEqual(r(0, 4));
    expect(rangeAt(5, 4, 9, true)).toEqual(r(5, 8));
  });

  it('never asks the engraver for a block that starts on bar 1', () => {
    for (const barsPerWindow of [2, 4, 6, 8]) {
      for (const systems of [1, 2, 3]) {
        for (let bar = 0; bar < 12; bar += 1) {
          expect(
            rangeAt(bar, barsPerWindow, 12, true, systems).fromMeasure,
            `bar ${String(bar)} at ${String(barsPerWindow)} bars over ${String(systems)} systems`,
          ).not.toBe(1);
        }
      }
    }
  });

  it('walks a pickup piece with the bar after the cursor always on the screen', () => {
    // Pickup, then eight bars, two steps a bar.
    const bars = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
    const all = steps(bars);
    let state: { cursor: SlotIndex; ranges: (MeasureRange | null)[] } = { cursor: 0, ranges: [null, null] };
    for (let i = 0; i < all.length; i += 1) {
      const plan = planSlots(all, i, state, 2, 9, 2, true, 2);
      state = { cursor: plan.cursor, ranges: plan.ranges };
      const bar = bars[i] ?? 0;
      const here = plan.ranges[plan.cursor];
      expect(here && bar >= here.fromMeasure && bar <= here.toMeasure, `step ${String(i)}: the cursor's bar is in its slot`).toBe(true);
      if (bar < 8) {
        const next = plan.ranges.some((range) => range !== null && bar + 1 >= range.fromMeasure && bar + 1 <= range.toMeasure);
        expect(next, `step ${String(i)}: bar ${String(bar + 1)} is on the screen`).toBe(true);
      }
    }
  });
});

describe('a five-bar piece at two bars per window, one bar to a system', () => {
  const all = steps([0, 1, 2, 3, 4]);

  it('puts the cursor in one slot and the coming bar in the other', () => {
    const seen = walk(all, 2, 5);
    expect(seen.map((s) => s.cursor)).toEqual([0, 1, 0, 1, 0]);
    expect(seen.map((s) => s.ranges)).toEqual([
      [r(0, 0), r(1, 1)],
      [r(2, 2), r(1, 1)],
      [r(2, 2), r(3, 3)],
      [r(4, 4), r(3, 3)],
      // The last bar has nothing after it, so the other slot keeps the bar
      // just played rather than going blank — half the screen black at the
      // end of every song was what the pictures showed.
      [r(4, 4), r(3, 3)],
    ]);
  });

  it('a cold draw at the end fills the screen from behind, not from black', () => {
    // A seek to the last bar, a restart there, or opening a piece at its end:
    // there is nothing ahead to show and — unlike a walk that arrives there —
    // nothing already on the screen to keep. It used to leave the final system
    // in slot 0 and the rest of the screen blank, which on a phone is most of
    // the screen black for the last bars of every song (`08` invariant 8).
    const plan = planSlots(all, 4, { cursor: 0, ranges: [null, null, null] }, 2, 5, 3, false, 2);
    expect(plan.ranges).toEqual([r(2, 2), r(3, 3), r(4, 4)]);
    // And the cursor is at the foot, where reading order puts the bar being
    // played when everything else on the screen came before it.
    expect(plan.cursor).toBe(2);
    // A cold draw fades nothing: there is no eye already resting elsewhere.
    expect(plan.fades).toEqual([]);
    expect(plan.crossed).toBe(false);
  });

  it('a cold draw at the start still reads downwards from the top', () => {
    // The mirror case, and the one that must not change: at bar 0 there is
    // nothing behind, so the cursor stays in slot 0 and the coming bars fill
    // the slots under it.
    const plan = planSlots(all, 0, { cursor: 0, ranges: [null, null, null] }, 2, 5, 3, false, 2);
    expect(plan.cursor).toBe(0);
    expect(plan.ranges).toEqual([r(0, 0), r(1, 1), r(2, 2)]);
  });

  it('a piece with fewer bars than slots leaves the extra ones blank', () => {
    // Two bars, three slots. There is nothing ahead and nothing behind to
    // find, so one slot has nothing it could honestly show.
    const two = steps([0, 1]);
    const plan = planSlots(two, 1, { cursor: 0, ranges: [null, null, null] }, 2, 2, 3, false, 2);
    expect(plan.ranges).toEqual([r(0, 0), r(1, 1), null]);
    expect(plan.cursor).toBe(1);
  });

  it('never re-draws the slot the cursor is in', () => {
    for (const { cursor, fades } of walk(all, 2, 5)) {
      expect(fades).not.toContain(cursor);
    }
  });

  it('blocksBehind walks backwards and stops at the first bar', () => {
    expect(blocksBehind(r(4, 4), 2, 5, 3, false, 2)).toEqual([r(3, 3), r(2, 2), r(1, 1)]);
    // Asked for more than there are.
    expect(blocksBehind(r(1, 1), 2, 5, 3, false, 2)).toEqual([r(0, 0)]);
    // Already at the first: nothing behind, and no loop.
    expect(blocksBehind(r(0, 0), 2, 5, 3, false, 2)).toEqual([]);
  });

  it('with four slots, the eye goes down the screen and round: three bars ahead', () => {
    const eight = steps([0, 1, 2, 3, 4, 5, 6, 7]);
    const seen = walk(eight, 2, 8, 4, 2);
    expect(seen.map((s) => s.cursor)).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
    expect(seen.map((s) => s.ranges)).toEqual([
      [r(0, 0), r(1, 1), r(2, 2), r(3, 3)],
      [r(4, 4), r(1, 1), r(2, 2), r(3, 3)],
      [r(4, 4), r(5, 5), r(2, 2), r(3, 3)],
      [r(4, 4), r(5, 5), r(6, 6), r(3, 3)],
      [r(4, 4), r(5, 5), r(6, 6), r(7, 7)],
      // Nothing after bar 7: the slots keep the bars just played.
      [r(4, 4), r(5, 5), r(6, 6), r(7, 7)],
      [r(4, 4), r(5, 5), r(6, 6), r(7, 7)],
      [r(4, 4), r(5, 5), r(6, 6), r(7, 7)],
    ]);
    // Only the vacated slot is ever re-drawn, and never the cursor's.
    for (const { cursor, fades } of seen) expect(fades).not.toContain(cursor);
    expect(seen[1]?.fades).toEqual([0]);
    expect(seen[4]?.fades).toEqual([3]);
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

describe('four bars per window over two systems', () => {
  it('gives each slot two bars', () => {
    const seen = walk(steps([0, 1, 2, 3, 4, 5, 6, 7]), 4, 8, 2, 2);
    expect(seen.map((s) => s.ranges)).toEqual([
      [r(0, 1), r(2, 3)],
      [r(0, 1), r(2, 3)],
      [r(4, 5), r(2, 3)],
      [r(4, 5), r(2, 3)],
      [r(4, 5), r(6, 7)],
      [r(4, 5), r(6, 7)],
      // Nothing after bar 7: the slot keeps the bars just played.
      [r(4, 5), r(6, 7)],
      [r(4, 5), r(6, 7)],
    ]);
  });
});

describe('a seek', () => {
  it('draws both slots and starts the reading order at the top', () => {
    const all = steps([0, 1, 2, 3, 4]);
    const plan = planSlots(all, 3, { cursor: 1, ranges: [null, null] }, 2, 5, 2, false, 2);
    expect(plan.cursor).toBe(0);
    expect(plan.ranges).toEqual([r(3, 3), r(4, 4)]);
    // Nothing to be peripheral to, so nothing fades.
    expect(plan.fades).toEqual([]);
  });
});

describe('what comes next, when the piece repeats', () => {
  it('is the bar that will be played, not the bar printed after', () => {
    // 0 1 0 2 — a repeat with a first and a second ending, which is what
    // `repeat-endings.musicxml` is.
    const all = steps([0, 1, 0, 2]);
    const seen = walk(all, 2, 3);

    // On the first pass through bar 1, what follows is bar 0 again.
    expect(nextRangeAfter(all, 1, r(1, 1), 2, 3, false, 2)).toEqual(r(0, 0));
    // On the second pass through bar 0, what follows is the second ending —
    // not bar 1, which has already been played and will not be again.
    expect(nextRangeAfter(all, 2, r(0, 0), 2, 3, false, 2)).toEqual(r(2, 2));

    expect(seen[2]?.ranges).toEqual([r(0, 0), r(2, 2)]);
    // At the second ending nothing follows; the bar just played — bar 0 on
    // its second pass, not the first ending printed between — stays above.
    expect(seen[3]?.ranges).toEqual([r(0, 0), r(2, 2)]);
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
