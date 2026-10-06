/**
 * Whether a run covered the whole item (RG1; FABLE §6; the reviewer's ruling,
 * `docs/review/responses/6e7475c1.md` §5): `RunHeader.wholeItem`, which the Score screen derives
 * from the run's own prepared session (`coversWholeItem`) and a named `runs` requirement reads
 * (`rungStateFromEvidence.test.ts`, the seven cases). Here the derivation, on sessions the real
 * `prepareSession` builds with the loops the screen's own gestures make (`loopFromPrintedBars`,
 * `loopFromMeasures`). `range` is no stand-in: a whole run carries one too.
 */
import { describe, expect, it } from 'vitest';
import { coversWholeItem } from '../../src/data/db';
import { loopFromMeasures, loopFromPrintedBars, prepareSession } from '../../src/engine/prepareSession';
import { makeModel, note } from './helpers/engineHarness';
import type { ScoreModel } from '../../src/score/types';

/** Four 4/4 bars of quarter notes, both hands on every beat. */
const FOUR_BARS = makeModel(
  Array.from({ length: 16 }, (_, index) => ({ onset: index, notes: [note({ midi: 60 + (index % 5) }), note({ midi: 48, hand: 'L' })] })),
);

/** A left-hand cut: three bars, the left hand only (the cutter drops the silenced right staff). */
const LH_CUT = makeModel(
  Array.from({ length: 12 }, (_, index) => ({ onset: index, notes: [note({ midi: 45 + (index % 3), hand: 'L' })] })),
  { handsPresent: { R: false, L: true } },
);

describe('the whole-item fact, from the run’s step span', () => {
  it('1. a normal run, no loop, covers the whole item — and carries a range like any judged run', () => {
    const session = prepareSession(FOUR_BARS, { mode: 'tempo' });
    expect(coversWholeItem(session)).toBe(true);
    expect([session.steps[session.firstStep]?.sourceMeasureIndex, session.steps[session.lastStep]?.sourceMeasureIndex]).toEqual([0, 3]);
  });

  it('2. a loop over part of the item does not', () => {
    expect(coversWholeItem(prepareSession(FOUR_BARS, { mode: 'tempo', loop: loopFromPrintedBars(FOUR_BARS, 2, 3) }))).toBe(false);
    expect(coversWholeItem(prepareSession(FOUR_BARS, { mode: 'tempo', loop: loopFromPrintedBars(FOUR_BARS, 1, 3) }))).toBe(false);
    expect(coversWholeItem(prepareSession(FOUR_BARS, { mode: 'wait', loop: loopFromMeasures(FOUR_BARS, 3, 3) }))).toBe(false);
  });

  it('2. by steps, not printed bars: a loop that starts and ends in the bars a whole run does can still be part of it', () => {
    // A *Fine* in bar 2 after a *da capo*: bars 1–3, then bars 1–2 again. The whole run ends in
    // printed bar 2; a loop over printed bars 1–2 starts and ends where it does and plays a third.
    const steps = [0, 1, 2, 0, 1].flatMap((bar, pass) =>
      Array.from({ length: 4 }, (_, beat) => ({ onset: pass * 4 + beat, notes: [note({ midi: 60 + beat })] })).map((spec) => ({ ...spec, bar })),
    );
    const base = makeModel(steps);
    const fine: ScoreModel = {
      ...base,
      steps: base.steps.map((step, index) => {
        const bar = steps[index]?.bar ?? 0;
        return { ...step, sourceMeasureIndex: bar, notes: step.notes.map((n) => ({ ...n, sourceMeasureIndex: bar })) };
      }),
      sourceMeasureCount: 3,
    };
    const whole = prepareSession(fine, { mode: 'tempo' });
    const loop = prepareSession(fine, { mode: 'tempo', loop: loopFromPrintedBars(fine, 1, 2) });
    const bars = (s: typeof whole) => [s.steps[s.firstStep]?.sourceMeasureIndex, s.steps[s.lastStep]?.sourceMeasureIndex];
    expect(bars(loop), 'the loop’s printed range is the whole run’s').toEqual(bars(whole));
    expect(coversWholeItem(whole)).toBe(true);
    expect(coversWholeItem(loop), 'a loop over the first eight of twenty steps').toBe(false);
  });

  it('4. a loop whose bars take in the whole item covers it: the ladder’s loop and a two-tap loop over every bar', () => {
    // `applyRouteLadder` loops printed bars 1 to `sourceMeasureCount`.
    const ladder = loopFromPrintedBars(FOUR_BARS, 1, FOUR_BARS.sourceMeasureCount);
    expect(ladder).toBeDefined();
    expect(coversWholeItem(prepareSession(FOUR_BARS, { mode: 'tempo', loop: ladder }))).toBe(true);
    expect(coversWholeItem(prepareSession(FOUR_BARS, { mode: 'tempo', loop: loopFromMeasures(FOUR_BARS, 0, 3) }))).toBe(true);
  });

  it('5. a left-hand cut is its own item: covered whole under either hand setting, not by part of it', () => {
    expect(coversWholeItem(prepareSession(LH_CUT, { mode: 'tempo', hands: 'L' }))).toBe(true);
    expect(coversWholeItem(prepareSession(LH_CUT, { mode: 'tempo', hands: 'both' }))).toBe(true);
    expect(coversWholeItem(prepareSession(LH_CUT, { mode: 'tempo', hands: 'L', loop: loopFromPrintedBars(LH_CUT, 1, 2) }))).toBe(false);
  });

  it('a step outside the loop with nothing for the played hand is not asked of the learner', () => {
    // The left hand enters in bar 2: a left-hand loop from bar 2 to the end leaves out no note it
    // plays, and the same loop with both hands leaves out bar 1's right hand.
    const lateLeft = makeModel(
      Array.from({ length: 12 }, (_, index) => ({
        onset: index,
        notes: index < 4 ? [note({ midi: 64 })] : [note({ midi: 64 }), note({ midi: 48, hand: 'L' })],
      })),
    );
    const loop = loopFromPrintedBars(lateLeft, 2, 3);
    expect(coversWholeItem(prepareSession(lateLeft, { mode: 'tempo', hands: 'L', loop }))).toBe(true);
    expect(coversWholeItem(prepareSession(lateLeft, { mode: 'tempo', hands: 'both', loop }))).toBe(false);
  });
});
