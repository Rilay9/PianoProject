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
  it('counts the share of messages inside the range', () => {
    const result = halfPedalScore([0, 40, 64, 127], RANGE);
    expect(result.total).toBe(4);
    expect(result.inRange).toBe(2);
    expect(result.share).toBeCloseTo(0.5);
    expect(result.binaryPedal).toBe(false);
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

  it('leaves every other exercise alone', () => {
    const engine = engineOver([40, 50]);
    expect(techniqueMeasureFor(null, engine.state.score, [], 0.7)).toBeNull();
  });
});
