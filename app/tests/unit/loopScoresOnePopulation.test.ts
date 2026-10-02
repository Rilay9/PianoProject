import { describe, expect, it } from 'vitest';
import { evaluateOutcome, measuresOf } from '../../src/engine/Scoring';
import { scoreOutcome } from '../../src/data/sessionRun';
import type { PracticeEngineOptions } from '../../src/engine/PracticeEngine';
import type { SessionScore } from '../../src/engine/types';
import { BEAT_MS, harness, makeModel, note, type Harness } from './helpers/engineHarness';
import type { ScoreModel } from '../../src/score/types';

interface Strike {
  at: number;
  midi: number;
}

/** Plays strikes on the engine's clock and advances far enough for the requested lap finishes. */
function playLoop(
  model: ScoreModel,
  firstLap: readonly Strike[],
  laterLap: (zero: number) => readonly Strike[],
  options: Partial<PracticeEngineOptions> = {},
): { h: Harness; secondLap: SessionScore } {
  const h = harness(model, {
    mode: 'tempo',
    countInBars: 0,
    loop: { fromStep: 0, toStep: model.steps.length - 1 },
    ...options,
  });
  h.engine.start();
  const until = (ms: number): void => {
    while (h.clock.now() < ms) {
      h.clock.set(Math.min(ms, h.clock.now() + 16));
      h.engine.tick();
    }
  };
  const strike = ({ at, midi }: Strike): void => {
    until(at);
    h.play(midi);
    h.release(midi, { atMs: at + 30 });
  };

  for (const played of firstLap) strike(played);
  until(2.1 * BEAT_MS);
  expect(h.engine.state.loops).toBe(1);

  // The engine rebases music time at a loop boundary and inserts its one-beat gap.
  // `zero` is lap two's step-zero time on the engine clock, the same relation the
  // established CL11a per-lap late-note test uses.
  const zero = h.clock.now() - h.engine.musicMs;
  for (const played of laterLap(zero)) strike(played);
  until(zero + 2.1 * BEAT_MS);
  expect(h.engine.state.loops).toBe(2);

  const finishes = h.of('finished').filter((event) => event.loop);
  const second = finishes[1]?.score;
  expect(second, 'the second loop lap did not finish').toBeDefined();
  return { h, secondLap: second as SessionScore };
}

const cd = makeModel([
  { onset: 0, notes: [note({ midi: 60 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
]);

const cleanLap: readonly Strike[] = [
  { at: 0, midi: 60 },
  { at: BEAT_MS, midi: 62 },
];

const criteria = {
  passAccuracy: 0.9,
  passTempoPct: 0,
  masterAccuracy: 0.97,
  masterTempoPct: 100,
};

describe('a loop scores one population end to end', () => {
  it('each completed lap is its own population, so a wrong key on lap two still costs one note', () => {
    const { secondLap } = playLoop(cd, cleanLap, (zero) => [
      { at: zero, midi: 60 },
      { at: zero + BEAT_MS, midi: 62 },
      // A pitch the loop never asks for, after one clean lap has already completed.
      { at: zero + BEAT_MS + 20, midi: 68 },
    ]);

    // Two laps have happened, but the score the learner just earned describes lap two.
    expect(secondLap.loops).toBe(2);
    expect(secondLap.hits).toBe(2);
    expect(secondLap.wrongNotesTotal).toBe(1);
    expect(secondLap.expectedNotes).toBe(2);
    expect(secondLap.totalSteps).toBe(2);
    expect(secondLap.accuracy).toBeCloseTo(1 / 2, 9);
    expect(evaluateOutcome(secondLap, criteria).passed).toBe(false);

    // Observation/evidence uses that same lap: no one-lap denominator beside a multi-lap numerator.
    const measures = measuresOf(secondLap, {
      heard: true,
      technique: null,
      pedalMeasurable: false,
      steps: [],
    });
    expect(measures.pitch).toMatchObject({ definition: 'tempo-notes', right: 2, of: 2 });
    expect(secondLap.stepOutcomes?.wrong.length).toBeGreaterThan(0);
  });

  it('Stop after completed looping reports and saves the last completed lap, not the new partial lap', () => {
    const { h, secondLap } = playLoop(cd, cleanLap, (zero) => [
      { at: zero, midi: 60 },
      { at: zero + BEAT_MS, midi: 62 },
      { at: zero + BEAT_MS + 20, midi: 68 },
    ]);

    // A third lap has just begun. Stop is the real finish the Score screen sends
    // to its summary/save path; it must not replace the completed pass with an
    // almost-empty next lap.
    h.engine.stop();
    const stopped = h.of('finished').filter((event) => !event.loop).at(-1)?.score;
    expect(stopped).toBeDefined();
    expect(secondLap.hits).toBe(2);
    expect(secondLap.wrongNotesTotal).toBe(1);
    expect(stopped?.hits).toBe(2);
    expect(stopped?.wrongNotesTotal).toBe(1);
    expect(stopped?.expectedNotes).toBe(2);
    expect(stopped?.accuracy).toBeCloseTo(1 / 2, 9);

    const measured = evaluateOutcome(stopped as SessionScore, criteria);
    expect(measured.passed).toBe(false);
    // ScoreScreen writes this measured verdict as RunResult.passed; the session
    // completion then reads that stored decision through scoreOutcome.
    expect(
      scoreOutcome({
        passed: measured.passed,
        accuracy: (stopped as SessionScore).accuracy,
        accuracyEstimated: (stopped as SessionScore).accuracyEstimated,
      }),
    ).toBe('failed');
  });

  it('a non-looped Keep tempo run keeps the existing one-pass population', () => {
    const h = harness(cd, { mode: 'tempo', countInBars: 0 });
    h.engine.start();
    h.play(60, { atMs: 0 });
    h.release(60, { atMs: 30 });
    h.advance(BEAT_MS);
    h.play(62, { atMs: BEAT_MS });
    h.release(62, { atMs: BEAT_MS + 30 });
    h.advance(2 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.expectedNotes).toBe(2);
    expect(score.totalSteps).toBe(2);
    expect(score.hits).toBe(2);
    expect(score.accuracy).toBe(1);
  });
});
