// The tempo ladder on a loop (docs/05 §6, docs/04 §5).
//
// One pure rule, so it is tested as one: given the pass that has just ended,
// what should the next one be played at? Everything that makes this hard to
// see in the app — the count-in, the restart, the status line — is the Score
// screen's, and none of it can change the answer.

import { describe, expect, it } from 'vitest';
import {
  LADDER_CEILING_PCT,
  LADDER_NOTCH_PCT,
  nextLadderTempo,
  type LadderPass,
} from '../../src/engine/PracticeEngine';
import { MAX_TEMPO_PCT, MIN_TEMPO_PCT } from '../../src/engine/prepareSession';

/** A pass, with only what each case is about spelled out. */
function after(partial: Partial<LadderPass> = {}): number {
  return nextLadderTempo({
    enabled: true,
    tempoPct: 70,
    startedAtPct: 70,
    clean: true,
    ...partial,
  });
}

describe('the tempo ladder', () => {
  it('leaves the tempo alone when it is off', () => {
    // A no-op and not a clamp: switching the ladder off must not move a tempo
    // the learner has just set by hand.
    expect(after({ enabled: false, clean: true })).toBe(70);
    expect(after({ enabled: false, clean: false })).toBe(70);
    expect(nextLadderTempo({ enabled: false, tempoPct: 25, startedAtPct: 25, clean: true })).toBe(25);
  });

  it('a clean pass goes up one notch and a pass with a mistake goes down one', () => {
    expect(after({ clean: true })).toBe(70 + LADDER_NOTCH_PCT);
    expect(after({ clean: false })).toBe(70 - LADDER_NOTCH_PCT);
    // The two directions are the same size, which is what makes a pass and a
    // stumble cancel out rather than drifting the learner somewhere.
    expect(after({ clean: true }) - after({ clean: false })).toBe(2 * LADDER_NOTCH_PCT);
  });

  it('a stumble at the slowest tempo stays there rather than going under it', () => {
    expect(after({ tempoPct: MIN_TEMPO_PCT, startedAtPct: MIN_TEMPO_PCT, clean: false })).toBe(
      MIN_TEMPO_PCT,
    );
    // …and a pass that would step past the floor lands on it, not below it.
    const justAbove = MIN_TEMPO_PCT + LADDER_NOTCH_PCT - 1;
    expect(after({ tempoPct: justAbove, startedAtPct: justAbove, clean: false })).toBe(
      MIN_TEMPO_PCT,
    );
  });

  it('stops climbing at the written tempo', () => {
    expect(after({ tempoPct: LADDER_CEILING_PCT, clean: true })).toBe(LADDER_CEILING_PCT);
    // A rung that would overshoot the ceiling lands on it.
    expect(after({ tempoPct: LADDER_CEILING_PCT - 1, clean: true })).toBe(LADDER_CEILING_PCT);
  });

  it('climbs past the written tempo only as far as the learner already had', () => {
    // The one exception in docs/05 §6: a learner who had asked for more before
    // switching the ladder on keeps what they asked for. The ladder is not
    // allowed to overrule a hand on the slider.
    const above = LADDER_CEILING_PCT + 2 * LADDER_NOTCH_PCT;
    expect(after({ tempoPct: above - LADDER_NOTCH_PCT, startedAtPct: above, clean: true })).toBe(
      above,
    );
    expect(after({ tempoPct: above, startedAtPct: above, clean: true })).toBe(above);
    // …and no further, however high the learner had been.
    expect(
      after({ tempoPct: MAX_TEMPO_PCT, startedAtPct: MAX_TEMPO_PCT, clean: true }),
    ).toBe(MAX_TEMPO_PCT);
  });

  it('a stumble after a clean pass puts the tempo back where it was', () => {
    const up = after({ tempoPct: 60, startedAtPct: 60, clean: true });
    expect(nextLadderTempo({ enabled: true, tempoPct: up, startedAtPct: 60, clean: false })).toBe(60);
  });
});
