// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MASTERY,
  evaluateOutcome,
  hotSpots,
  timingHistogram,
  timingStats,
  weakBarsLoop,
} from '../../src/engine/Scoring';
import { prepareSession, loopFromMeasures } from '../../src/engine/prepareSession';
import { harness, makeModel, note } from './helpers/engineHarness';
import { edgeFixtures, loadFixture } from './helpers/fixtures';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import type { SessionScore } from '../../src/engine/types';

function scoreWith(partial: Partial<SessionScore>): SessionScore {
  return {
    mode: 'tempo',
    tempoPct: 100,
    totalSteps: 10,
    correctSteps: 10,
    expectedNotes: 10,
    hits: 10,
    missedTotal: 0,
    wrongNotesTotal: 0,
    accuracy: 1,
    timing: timingStats([]),
    hotSpots: [],
    durationMs: 1000,
    loops: 0,
    rolledChordSteps: 0,
    notes: [],
    ...partial,
  };
}

describe('timing statistics', () => {
  it('splits early from late and reports the spread', () => {
    const stats = timingStats([-100, -50, 50, 100]);
    expect(stats.n).toBe(4);
    expect(stats.meanMs).toBe(0);
    expect(stats.earlyPct).toBe(50);
    expect(stats.latePct).toBe(50);
    expect(stats.stdDevMs).toBeGreaterThan(0);
  });

  it('is all zeroes for a run with no judged notes, not NaN', () => {
    const stats = timingStats([]);
    expect(stats).toMatchObject({ n: 0, meanMs: 0, stdDevMs: 0, earlyPct: 0, latePct: 0 });
  });

  it('counts a delta of exactly 0 as neither early nor late', () => {
    const stats = timingStats([0, 0]);
    expect(stats.earlyPct).toBe(0);
    expect(stats.latePct).toBe(0);
  });

  it('buckets every delta exactly once, outliers included', () => {
    const deltas = [-9999, -275, -1, 0, 1, 120, 9999];
    const histogram = timingHistogram(deltas);
    expect(histogram.reduce((sum, b) => sum + b.count, 0)).toBe(deltas.length);
    // Half-open buckets: 0 belongs to [0, 50), not to [-50, 0).
    const zeroBucket = histogram.find((b) => b.fromMs === 0);
    expect(zeroBucket?.count).toBe(2);
  });
});

describe('hot spots', () => {
  it('ranks bars by total damage, worst first', () => {
    const spots = hotSpots(
      new Map([
        [3, 1],
        [7, 4],
      ]),
      new Map([
        [3, 2],
        [9, 1],
      ]),
    );
    expect(spots).toEqual([
      { measureIndex: 7, misses: 4, wrongs: 0 },
      { measureIndex: 3, misses: 1, wrongs: 2 },
      { measureIndex: 9, misses: 0, wrongs: 1 },
    ]);
  });

  it('ignores bars that went fine', () => {
    expect(hotSpots(new Map([[1, 0]]), new Map())).toEqual([]);
  });

  it('builds a loop over the worst bars for "loop the weak bars"', () => {
    const model = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 4, notes: [note({ midi: 62 })] },
      { onset: 8, notes: [note({ midi: 64 })] },
    ]);
    const { steps } = prepareSession(model, { mode: 'wait' });
    const loop = weakBarsLoop(
      scoreWith({ hotSpots: [{ measureIndex: 2, misses: 3, wrongs: 0 }] }),
      steps,
    );
    expect(loop).toEqual({ fromStep: 2, toStep: 2 });
  });

  it('has no loop to offer when nothing went wrong', () => {
    expect(weakBarsLoop(scoreWith({}), [])).toBeUndefined();
  });
});

describe('pass and master (curriculum Part G)', () => {
  it('passes at 90 % accuracy and 80 % tempo', () => {
    expect(evaluateOutcome(scoreWith({ accuracy: 0.9, tempoPct: 80 })).passed).toBe(true);
    expect(evaluateOutcome(scoreWith({ accuracy: 0.89, tempoPct: 80 })).passed).toBe(false);
    expect(evaluateOutcome(scoreWith({ accuracy: 0.95, tempoPct: 79 })).passed).toBe(false);
  });

  it('qualifies for mastery at 97 % and full tempo', () => {
    const outcome = evaluateOutcome(scoreWith({ accuracy: 0.97, tempoPct: 100 }));
    expect(outcome.masterEligible).toBe(true);
    // Part G also wants it twice on different days, which one run cannot know.
    expect(outcome).not.toHaveProperty('mastered');
    expect(evaluateOutcome(scoreWith({ accuracy: 0.97, tempoPct: 99 })).masterEligible).toBe(false);
  });

  it('never passes a mode that judged nothing', () => {
    expect(evaluateOutcome(scoreWith({ mode: 'listen', accuracy: 1 })).passed).toBe(false);
    expect(evaluateOutcome(scoreWith({ mode: 'free', accuracy: 1 })).passed).toBe(false);
  });

  it('honours custom thresholds', () => {
    const lenient = { ...DEFAULT_MASTERY, passAccuracy: 0.5 };
    expect(evaluateOutcome(scoreWith({ accuracy: 0.6 }), lenient).passed).toBe(true);
  });
});

describe('loops from bar numbers', () => {
  const model = makeModel([
    { onset: 0, notes: [note({ midi: 60 })] },
    { onset: 2, notes: [note({ midi: 62 })] },
    { onset: 4, notes: [note({ midi: 64 })] },
    { onset: 6, notes: [note({ midi: 65 })] },
    { onset: 8, notes: [note({ midi: 67 })] },
  ]);

  it('covers every step of the last bar, inclusively', () => {
    expect(loopFromMeasures(model, 0, 1)).toEqual({ fromStep: 0, toStep: 3 });
    expect(loopFromMeasures(model, 1, 1)).toEqual({ fromStep: 2, toStep: 3 });
  });

  it('is undefined for a bar the piece does not have', () => {
    expect(loopFromMeasures(model, 99, 100)).toBeUndefined();
  });
});

describe('property: the timetable agrees with the model', () => {
  it.each(edgeFixtures())('$name: step times match beatToMs, and gaps sum to the whole', async (fixture) => {
    const model = extractScoreModel(await loadFixture(fixture.path), { id: fixture.name });
    for (const tempoPct of [50, 100, 130]) {
      const { steps } = prepareSession(model, { mode: 'tempo', tempoPct });
      const scale = tempoPct / 100;
      for (const step of steps) {
        const modelStep = model.steps[step.index];
        if (!modelStep) throw new Error('missing step');
        expect(step.tMs).toBeCloseTo(model.beatToMs(modelStep.onset, scale), 6);
      }
      // docs/05 §10: the durations tile the piece with no gaps or overlaps.
      const first = steps[0];
      const last = steps[steps.length - 1];
      if (!first || !last) continue;
      const summed = steps.reduce((total, s) => total + s.durMs, 0);
      expect(summed).toBeCloseTo(last.tMs + last.durMs - first.tMs, 6);
      // Times never go backwards, however the piece repeats.
      for (let i = 1; i < steps.length; i += 1) {
        expect(steps[i]!.tMs).toBeGreaterThanOrEqual(steps[i - 1]!.tMs);
      }
    }
  });

  it.each(edgeFixtures())('$name: a perfect Wait run reaches the end', async (fixture) => {
    const model = extractScoreModel(await loadFixture(fixture.path), { id: fixture.name });
    const h = harness(model, { mode: 'wait' });
    h.engine.start();
    // Play whatever the engine is waiting for, one step at a time.
    let guard = 0;
    while (!h.engine.state.finished && guard < 10_000) {
      const step = h.engine.prepared.steps[h.engine.state.step];
      if (!step || step.isEmpty) break;
      for (const midi of step.expected) h.play(midi);
      guard += 1;
    }
    expect(h.engine.state.finished).toBe(true);
    const score = h.engine.state.score;
    expect(score.wrongNotesTotal).toBe(0);
    expect(score.accuracy).toBe(1);
    expect(score.correctSteps).toBe(score.totalSteps);
  });
});
