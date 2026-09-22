// @vitest-environment node
/**
 * The depth of the pedal, carried through the engine and judged (T16 item 6).
 *
 * **What was wrong, from Entry 24 item 2.** `PracticeEngine.feed` reduced CC64
 * to `sustainDown = value >= 64` and kept no value, so the half-pedal exercise
 * — which `generate_exercises.py` writes with `drill: { kind: 'half-pedal',
 * params: { ccRange: [32, 96] } }` — had nothing to be judged against on the
 * Score screen, where it opens. `special.ts`'s `PedalDrill` already measured
 * exactly this, on the drill screen, from values it got itself; the score
 * screen's engine threw them away one line after reading them.
 *
 * So the rule lives in one place now (`halfPedalScore`) and both callers ask
 * it, which is the answer to "two copies of one fact drift": the drill and the
 * score screen cannot disagree about what a half pedal is.
 *
 * **A pedal that only ever reports 0 or 127 is a switch**, and many digital
 * actions are. That is reported as its own state rather than as a nought,
 * because "you failed to half-pedal" would be blaming the player for the
 * instrument.
 */
import { describe, expect, it } from 'vitest';
import { PracticeEngine } from '../../src/engine/PracticeEngine';
import { halfPedalScore, techniqueMeasureFor } from '../../src/engine/Scoring';
import { makeModel, note } from './helpers/engineHarness';

const RANGE: [number, number] = [32, 96];

function engineOver(values: number[]): PracticeEngine {
  const model = makeModel([
    { onset: 0, notes: [note({ midi: 60 })] },
    { onset: 1, notes: [note({ midi: 62 })] },
  ]);
  const engine = new PracticeEngine(model, { mode: 'tempo', countInBars: 0 });
  engine.start();
  for (const [index, value] of values.entries()) {
    engine.feed({ kind: 'cc', cc: 64, value, tMs: index * 100 });
  }
  return engine;
}

describe('the rule, in one place', () => {
  /**
   * **What the share divides by** (2026-09-22 review). The denominator is the
   * messages sent *inside a pedal-down span* — from the one that first takes
   * the pedal off the top to the one that puts it back, that last one
   * excluded — and not every CC64 message of the run. A value of 0 is the only
   * "damper fully up" there is, so that set is exactly the messages above 0.
   *
   * It used to be all of them, and `met` asks for nine in ten inside `[32,
   * 96]`: so lifting the pedal between phrases, which is the other half of
   * pedalling, counted against the exercise. Four lifts in a forty-message run
   * put it under the pass with every held value perfect.
   */
  it('counts the share of the messages sent with the pedal down', () => {
    const result = halfPedalScore([0, 40, 64, 127], RANGE);
    expect(result.total).toBe(4);
    expect(result.held).toBe(3);
    expect(result.inRange).toBe(2);
    expect(result.share).toBeCloseTo(2 / 3);
    expect(result.binaryPedal).toBe(false);
  });

  it('does not count the lift at the end of a phrase against the pedalling', () => {
    // Held part-way three times, lifted between each: the lifts are the
    // playing, not a failure of it.
    const result = halfPedalScore([50, 0, 60, 0, 70, 0], RANGE);
    expect(result.held).toBe(3);
    expect(result.inRange).toBe(3);
    expect(result.share).toBe(1);
  });

  it('says the pedal never went down, rather than calling that a switch', () => {
    const result = halfPedalScore([0, 0, 0], RANGE);
    expect(result.total).toBe(3);
    expect(result.held).toBe(0);
    expect(result.share).toBe(0);
  });

  it('calls a pedal that only ever sends 0 or 127 a switch, and scores nothing', () => {
    const result = halfPedalScore([0, 127, 0, 127], RANGE);
    expect(result.binaryPedal).toBe(true);
    expect(result.share).toBe(0);
  });

  it('says nothing was measured when no pedal message arrived', () => {
    const result = halfPedalScore([], RANGE);
    expect(result.total).toBe(0);
    expect(result.binaryPedal).toBe(false);
  });
});

describe('the engine keeps the value, not only the switch', () => {
  it('carries every CC64 message into the session score', () => {
    const engine = engineOver([0, 30, 70, 100, 127]);
    expect(engine.state.score.pedal).toEqual([0, 30, 70, 100, 127]);
  });

  it('still reports the pedal as down or up for everything that reads that', () => {
    expect(engineOver([0, 30]).state.sustain).toBe(false);
    expect(engineOver([0, 70]).state.sustain).toBe(true);
  });

  it('keeps nothing for a controller that is not the damper', () => {
    const model = makeModel([{ onset: 0, notes: [note({ midi: 60 })] }]);
    const engine = new PracticeEngine(model, { mode: 'tempo', countInBars: 0 });
    engine.start();
    engine.feed({ kind: 'cc', cc: 67, value: 80, tMs: 0 });
    expect(engine.state.score.pedal).toEqual([]);
  });
});

describe('the pedal list is a run total, exactly as the notes are', () => {
  /**
   * What the 2026-09-22 review found: `feed` pushed every CC64 value with no
   * `running`/`paused`/`finished` guard — the note branch has had one at the
   * line below since it was written — and `resetRunTotals` cleared `recorded`
   * and left `pedalValues` standing. The list goes into `buildScore` beside
   * the notes and the sheet divides by its length, so a pedal moved while the
   * run was paused, or before ▶, or after the last bar, sat in that
   * denominator and counted against the learner.
   *
   * The switch is not gated, and that is the point of the last case here:
   * `state.sustain` answers "is the damper down *now*", which is true whatever
   * the transport is doing — the same division `pressed` makes against
   * `recorded` one line below. Who reads it: `grep -rn "\.sustain\b" app/src`
   * returns nothing, so it is these tests and no screen today; the engine's
   * own comment claimed the renderer and the strip until 2026-09-22.
   */
  function started(): PracticeEngine {
    const model = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 1, notes: [note({ midi: 62 })] },
    ]);
    const engine = new PracticeEngine(model, { mode: 'tempo', countInBars: 0 });
    engine.start();
    return engine;
  }

  it('keeps nothing the learner did before the run started', () => {
    const model = makeModel([{ onset: 0, notes: [note({ midi: 60 })] }]);
    const engine = new PracticeEngine(model, { mode: 'tempo', countInBars: 0 });
    engine.feed({ kind: 'cc', cc: 64, value: 70, tMs: 0 });
    engine.start();
    engine.feed({ kind: 'cc', cc: 64, value: 40, tMs: 10 });
    expect(engine.state.score.pedal).toEqual([40]);
  });

  it('keeps nothing moved while the run is paused', () => {
    const engine = started();
    engine.feed({ kind: 'cc', cc: 64, value: 40, tMs: 0 });
    engine.pause();
    engine.feed({ kind: 'cc', cc: 64, value: 127, tMs: 10 });
    engine.resume();
    engine.feed({ kind: 'cc', cc: 64, value: 50, tMs: 20 });
    expect(engine.state.score.pedal).toEqual([40, 50]);
  });

  it('keeps nothing moved after the run has finished', () => {
    const engine = started();
    engine.feed({ kind: 'cc', cc: 64, value: 40, tMs: 0 });
    engine.stop();
    engine.feed({ kind: 'cc', cc: 64, value: 127, tMs: 10 });
    expect(engine.state.score.pedal).toEqual([40]);
  });

  it('empties the list when the run starts again', () => {
    const engine = started();
    engine.feed({ kind: 'cc', cc: 64, value: 40, tMs: 0 });
    engine.start();
    engine.feed({ kind: 'cc', cc: 64, value: 60, tMs: 10 });
    expect(engine.state.score.pedal).toEqual([60]);
  });

  it('still reports the damper as down while paused, because that is not a total', () => {
    const engine = started();
    engine.pause();
    engine.feed({ kind: 'cc', cc: 64, value: 127, tMs: 0 });
    expect(engine.state.sustain).toBe(true);
    expect(engine.state.score.pedal).toEqual([]);
  });
});

describe('the Score screen judges the half-pedal exercise', () => {
  const drill = { kind: 'half-pedal', params: { ccRange: RANGE } };

  it('reports the share held part-way', () => {
    const engine = engineOver([40, 50, 60, 127]);
    const measure = techniqueMeasureFor(drill, engine.state.score, [], 0.7);
    expect(measure).not.toBeNull();
    expect(measure?.label).toBe('Half pedal');
    expect(measure?.judged).toBe(4);
    expect(measure?.met).toBe(true);
    expect(measure?.text).toContain('75%');
  });

  it('fails a run that never left the floor or the top', () => {
    const engine = engineOver([0, 127, 0, 127]);
    const measure = techniqueMeasureFor(drill, engine.state.score, [], 0.7);
    expect(measure?.met).toBe(false);
    expect(measure?.text).toContain('switch');
  });

  it('says it could not be measured rather than reporting a nought', () => {
    const engine = engineOver([]);
    const measure = techniqueMeasureFor(drill, engine.state.score, [], 0.7);
    expect(measure?.judged).toBe(0);
    expect(measure?.text).toContain('not measured');
  });

  it('passes a run whose held values are all in range but which lifts between phrases', () => {
    // The run the old denominator failed: every held value is exactly what the
    // exercise asks for, and a third of the messages are the lifts.
    const engine = engineOver([50, 0, 60, 0, 70, 0]);
    const measure = techniqueMeasureFor(drill, engine.state.score, [], 0.9);
    expect(measure?.met).toBe(true);
    expect(measure?.judged).toBe(3);
    expect(measure?.text).toContain('100%');
    expect(measure?.text).toContain('with the pedal down');
  });

  it('says the pedal never went down, which is not a switch and not a nought', () => {
    const engine = engineOver([0, 0, 0]);
    const measure = techniqueMeasureFor(drill, engine.state.score, [], 0.7);
    expect(measure?.met).toBe(false);
    expect(measure?.judged).toBe(0);
    expect(measure?.text).toContain('never left the top');
  });

  it('leaves every other exercise alone', () => {
    const engine = engineOver([40, 50]);
    expect(techniqueMeasureFor(null, engine.state.score, [], 0.7)).toBeNull();
  });
});
