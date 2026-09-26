/**
 * A timing skill's evidence must be able to tell its rhythm from the error it
 * is about (C3 item 3; reviewer decision 6; backlog S21; design §4, "the
 * triplet case, as arithmetic").
 *
 * The arithmetic, from the written tempo and the engine's window, not from a
 * clock on this machine:
 *
 * - Anh. 113's ♩ = 96 at the rung's 80 % floor: a quarter lasts 60 000 / (96 ×
 *   0.8) ms.
 * - Triplet eighths fall at 0, 1/3 and 2/3 of it. Rushed into two sixteenths
 *   and an eighth they fall at 0, 1/4 and 1/2: the second note 1/12 of a beat
 *   early and the third 1/6 — both inside the default ±150 ms window, so the
 *   engine records the wrong rhythm as hits.
 * - So the triplet skill declares 1/12 of a quarter as the error it must see,
 *   and the function refuses (`precision`) wherever the window is not narrower
 *   than that at the run's tempo. The global window is not changed.
 *
 * The fixture is a bar of 3/4 with a triplet on each beat. Each case plays it
 * through the real engine: evenly, and rushed.
 */
import { describe, expect, it } from 'vitest';
import { phrase, type HandNote } from './helpers/phrase';
import { observe, play } from './helpers/observed';
import { evidenceFor, TIMING_PRECISION_QUARTERS, msPerQuarterAt } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { ENGINE_DEFAULTS } from '../../src/engine/types';
import { withBeatToMs } from '../../src/score/types';
import { MIN_TEMPO_PCT } from '../../src/engine/prepareSession';

const BPM = 96;
const RUNG_FLOOR_PCT = 80;

function tripletBeat(beat: number, pitches: [string, string, string]): HandNote[] {
  return pitches.map((pitch, i) => ({ at: beat + i / 3, dur: 1 / 3, pitch, tuplet: 3 }));
}

const TRIPLETS = {
  ...phrase({
    time: '3/4',
    bars: [
      [...tripletBeat(0, ['C5', 'D5', 'E5']), ...tripletBeat(1, ['F5', 'E5', 'D5']), ...tripletBeat(2, ['C5', 'B4', 'C5'])],
    ],
  }),
  tempoMap: [{ atBeat: 0, bpm: BPM }],
};

const quarterMs = 60_000 / (BPM * (RUNG_FLOOR_PCT / 100));
/** The rushed rhythm: each triplet's second note a twelfth of a beat early, its third a sixth. */
const rushed = (step: number): number => {
  const place = step % 3;
  return place === 1 ? -quarterMs / 12 : place === 2 ? -quarterMs / 6 : 0;
};

const evidence = (toleranceMs: number, offsetMs?: (step: number) => number) =>
  evidenceFor({
    observation: observe(TRIPLETS, {
      mode: 'tempo',
      tempoPct: RUNG_FLOOR_PCT,
      toleranceMs,
      unseen: true,
      guide: 'off',
      ...(offsetMs ? { offsetMs } : {}),
    }),
    played: TRIPLETS,
    targetSkills: ['triplets'],
    vocabulary: VOCABULARY_V0,
  })[0];

describe('the triplet case: the window must be narrower than the error the skill is about', () => {
  it('the arithmetic: at the rung’s tempo the rushed notes fall inside the default window', () => {
    expect(msPerQuarterAt(TRIPLETS, 0, RUNG_FLOOR_PCT)).toBeCloseTo(quarterMs, 9);
    expect(TIMING_PRECISION_QUARTERS.triplets).toBe(1 / 12);
    const error = TIMING_PRECISION_QUARTERS.triplets * quarterMs;
    // Both displacements are inside ±150 ms: the measurement cannot see them.
    expect(quarterMs / 12).toBeLessThan(ENGINE_DEFAULTS.toleranceMs);
    expect(quarterMs / 6).toBeLessThan(ENGINE_DEFAULTS.toleranceMs);
    expect(error).toBeLessThan(ENGINE_DEFAULTS.toleranceMs);
    // The engine, played the rushed rhythm, calls every note a hit.
    const { score } = play(TRIPLETS, { mode: 'tempo', tempoPct: RUNG_FLOOR_PCT, offsetMs: rushed });
    expect(score.stepOutcomes?.codes).toMatch(/^h+$/);
  });

  it('with the default window, the triplet skill gets no evidence, even rhythm or rushed', () => {
    for (const offsetMs of [undefined, rushed]) {
      expect(evidence(ENGINE_DEFAULTS.toleranceMs, offsetMs)).toMatchObject({
        kind: 'refusal',
        reason: 'precision',
        cites: ['input.toleranceMs', 'tempoPct'],
      });
    }
  });

  it('with a window narrower than the error, it gets evidence, and the evidence tells the two apart', () => {
    const narrow = Math.floor(TIMING_PRECISION_QUARTERS.triplets * quarterMs) - 1;
    expect(narrow).toBeLessThan(TIMING_PRECISION_QUARTERS.triplets * quarterMs);
    const even = evidence(narrow);
    expect(even).toMatchObject({ kind: 'measured', standard: 'full', n: 9, right: 9 });
    const hurried = evidence(narrow, rushed);
    expect(hurried?.kind).toBe('measured');
    if (hurried?.kind === 'measured') {
      // Every second and third note of a triplet now falls outside the window.
      expect(hurried.right).toBeLessThan(hurried.n);
      expect(hurried.right).toBeLessThanOrEqual(3);
    }
  });

  it('slower, the same default window can see it: precision is a relation, not a verdict on triplets', () => {
    // At the slider's slowest the error grows past the default window.
    const slow = MIN_TEMPO_PCT;
    expect(TIMING_PRECISION_QUARTERS.triplets * msPerQuarterAt(TRIPLETS, 0, slow)).toBeGreaterThan(ENGINE_DEFAULTS.toleranceMs);
    const result = evidenceFor({
      observation: observe(TRIPLETS, { mode: 'tempo', tempoPct: slow, unseen: true, guide: 'off' }),
      played: TRIPLETS,
      targetSkills: ['triplets'],
      vocabulary: VOCABULARY_V0,
    })[0];
    expect(result).toMatchObject({ kind: 'measured', n: 9, right: 9 });
  });

  it('the global window is not changed', () => {
    expect(ENGINE_DEFAULTS.toleranceMs).toBe(150);
    expect(withBeatToMs(TRIPLETS).beatToMs(1, RUNG_FLOOR_PCT / 100)).toBeCloseTo(quarterMs, 9);
  });
});
