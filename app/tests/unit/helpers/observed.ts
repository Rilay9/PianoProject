// Observations for the evidence tests (C3), made the way the app makes them:
// a model played through the real engine on a fake clock, its score read by
// `Scoring.measuresOf` (the record's one definition of the measures), and a
// header like the one the Score screen writes. What the evidence function is
// then handed is a row C1 would have stored, not a hand-typed guess at one.

import { BEAT_MS, harness, type Harness } from './engineHarness';
import { measuresOf } from '../../../src/engine/Scoring';
import { NOT_MEASURED, type SessionScore } from '../../../src/engine/types';
import { OBSERVATION_DEFINITIONS } from '../../../src/data/db';
import { withBeatToMs, type ScoreModelData } from '../../../src/score/types';
import type { Observed } from '../../../src/evidence/measurement';

export interface RunPlan {
  mode?: 'wait' | 'tempo';
  hands?: 'R' | 'L' | 'both';
  toleranceMs?: number;
  tempoPct?: number;
  /** Model step indexes not played at all. */
  skip?: readonly number[];
  /** Keep tempo: how far off its time each step is played, in ms (negative = early). */
  offsetMs?: (step: number) => number;
  /** Wait: steps where a wrong key (a semitone up) is struck before the right ones. */
  wrongFirst?: readonly number[];
  /**
   * Keep tempo: steps where the white key below is struck instead of the
   * written one, in time (C4: a misread note, as a reader plays it).
   */
  wrongInstead?: readonly number[];
  /**
   * The key struck instead at a `wrongInstead` step: the white key below
   * unless said. A hand-made phrase whose misread key is the next note's (a
   * skip up read as a step, then that step) would have the engine hold it as
   * an early strike of that next note (C4a: the adversary phrases pass one that
   * no later step expects, so every misread step reads `m`).
   */
  wrongKey?: (midi: number) => number;
  /**
   * Keep tempo: pitches struck wrong (by `wrongKey`) wherever this says so,
   * for a step whose notes are not all misread — one hand of a chord (C4a).
   */
  wrongPitch?: (step: number, midi: number) => boolean;
  /** Nothing reaches the engine: the run nothing heard. */
  silent?: boolean;
  loop?: { fromStep: number; toStep: number };
  unseen?: boolean;
  guide?: 'next' | 'next-two' | 'off';
  id?: number;
  at?: string;
  itemId?: string;
  seed?: number;
}

/** The white key below a note (a black key's neighbour below): a step misread, not a random key. */
function whiteKeyBelow(midi: number): number {
  const pitchClass = ((midi % 12) + 12) % 12;
  return midi - (pitchClass === 0 || pitchClass === 5 || [1, 3, 6, 8, 10].includes(pitchClass) ? 1 : 2);
}

function until(h: Harness, ms: number): void {
  while (h.clock.now() < ms) {
    h.clock.set(Math.min(ms, h.clock.now() + 16));
    h.engine.tick();
  }
}

/** The engine's score for a plan. */
export function play(data: ScoreModelData, plan: RunPlan = {}): { score: SessionScore; h: Harness } {
  const mode = plan.mode ?? 'tempo';
  const h = harness(withBeatToMs(data), {
    mode,
    countInBars: 0,
    hands: plan.hands ?? 'both',
    tempoPct: plan.tempoPct ?? 100,
    ...(plan.toleranceMs === undefined ? {} : { toleranceMs: plan.toleranceMs }),
    ...(plan.loop ? { loop: plan.loop } : {}),
  });
  h.engine.start();
  const { steps, firstStep, lastStep } = h.engine.prepared;
  if (mode === 'wait') {
    for (let index = firstStep; index <= lastStep; index += 1) {
      const step = steps[index];
      if (!step || step.isEmpty) continue;
      if (plan.silent === true || plan.skip?.includes(index)) break;
      if (plan.wrongFirst?.includes(index)) {
        h.clock.advanceBy(200);
        h.play((step.expected[0] ?? 60) + 1);
      }
      for (const midi of step.expected) {
        h.clock.advanceBy(300);
        h.play(midi);
        h.release(midi);
      }
    }
    if (!h.engine.state.finished) h.engine.stop();
    return { score: h.engine.state.score, h };
  }
  const origin = steps[firstStep]?.tMs ?? 0;
  for (let index = firstStep; index <= lastStep; index += 1) {
    const step = steps[index];
    if (!step || step.isEmpty || plan.silent === true || plan.skip?.includes(index)) continue;
    const at = step.tMs - origin + (plan.offsetMs?.(index) ?? 0);
    until(h, Math.max(h.clock.now(), at));
    const misread = (midi: number): boolean => plan.wrongInstead?.includes(index) === true || plan.wrongPitch?.(index, midi) === true;
    const keys = step.expected.map((midi) => (misread(midi) ? (plan.wrongKey ?? whiteKeyBelow)(midi) : midi));
    for (const midi of keys) h.play(midi);
    until(h, at + 60);
    for (const midi of keys) h.release(midi);
  }
  const last = steps[lastStep];
  until(h, (last ? last.tMs - origin + last.durMs : 0) + 4 * BEAT_MS);
  if (!h.engine.state.finished) h.engine.stop();
  return { score: h.engine.state.score, h };
}

/** A C1 observation of the plan's run: the measures and the header the Score screen writes. */
export function observe(data: ScoreModelData, plan: RunPlan = {}): Observed {
  const mode = plan.mode ?? 'tempo';
  const { score, h } = play(data, plan);
  const heard = score.notes.length > 0;
  const under = score.judgedUnder;
  const guide = plan.guide ?? 'next';
  const measures = measuresOf(score, { heard, technique: null, pedalMeasurable: false, steps: h.engine.prepared.steps });
  return {
    ...(plan.id === undefined ? {} : { id: plan.id }),
    itemId: plan.itemId ?? 'drill.reading.test',
    ...(plan.seed === undefined ? {} : { seed: plan.seed }),
    mode,
    tempoPct: score.tempoPct,
    tempoMeasured: mode === 'tempo' && heard,
    accuracy: heard ? score.accuracy : NOT_MEASURED,
    accuracyEstimated: false,
    wrongNotes: heard ? score.wrongNotesTotal : NOT_MEASURED,
    missed: heard ? score.missedTotal : NOT_MEASURED,
    durationMs: score.durationMs,
    at: plan.at ?? '2026-09-26T10:00:00.000Z',
    definitions: OBSERVATION_DEFINITIONS,
    ...(under ? { range: { fromMeasure: under.fromMeasure, toMeasure: under.toMeasure } } : {}),
    opened: { tab: 'library', slot: NOT_MEASURED },
    baseTempo: { bpm: data.tempoMap[0]?.bpm ?? 72, source: 'written' },
    hands: { played: plan.hands ?? 'both', appPlayed: 'none' },
    keys: { view: 'strip', guide, fingers: guide !== 'off', names: false },
    graceNotes: under?.graceNotes ?? NOT_MEASURED,
    input: {
      source: 'keys',
      toleranceMs: under?.toleranceMs ?? NOT_MEASURED,
      latencyMs: under?.inputLatencyMs ?? NOT_MEASURED,
    },
    ...(plan.unseen === undefined ? {} : { unseen: plan.unseen }),
    demonstrated: false,
    ...measures,
  } as Observed;
}
