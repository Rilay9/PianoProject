// Turning a run into a summary the learner can act on.
//
// docs/05-score-follow-engine.md §2 and §3 define accuracy; docs/02-curriculum.md
// Part G defines pass and master. Kept separate from the engine so the numbers
// can be recomputed from a stored session row later, and tested without
// running a session at all.

import { summarise } from '../util/stats';
import type {
  HotSpot,
  Mode,
  PreparedStep,
  RecordedNote,
  SessionScore,
  TimingStats,
} from './types';

/** Histogram edges in milliseconds, matching the summary sheet in docs/04 §5. */
const HISTOGRAM_EDGES = [-300, -250, -200, -150, -100, -50, 0, 50, 100, 150, 200, 250, 300];

export function timingHistogram(deltas: readonly number[]): TimingStats['histogram'] {
  const buckets: TimingStats['histogram'] = [];
  buckets.push({ fromMs: Number.NEGATIVE_INFINITY, toMs: HISTOGRAM_EDGES[0] ?? 0, count: 0 });
  for (let i = 0; i < HISTOGRAM_EDGES.length - 1; i += 1) {
    buckets.push({ fromMs: HISTOGRAM_EDGES[i] ?? 0, toMs: HISTOGRAM_EDGES[i + 1] ?? 0, count: 0 });
  }
  buckets.push({
    fromMs: HISTOGRAM_EDGES[HISTOGRAM_EDGES.length - 1] ?? 0,
    toMs: Number.POSITIVE_INFINITY,
    count: 0,
  });
  for (const delta of deltas) {
    // Half-open [from, to) so a delta exactly on an edge lands in one bucket.
    const bucket = buckets.find((b) => delta >= b.fromMs && delta < b.toMs);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function timingStats(deltas: readonly number[]): TimingStats {
  const stats = summarise(deltas);
  const early = deltas.filter((d) => d < 0).length;
  const late = deltas.filter((d) => d > 0).length;
  return {
    n: stats.n,
    meanMs: stats.n > 0 ? stats.mean : 0,
    stdDevMs: Number.isFinite(stats.stdDev) ? stats.stdDev : 0,
    medianMs: stats.n > 0 ? stats.median : 0,
    earlyPct: stats.n > 0 ? (early / stats.n) * 100 : 0,
    latePct: stats.n > 0 ? (late / stats.n) * 100 : 0,
    histogram: timingHistogram(deltas),
  };
}

/**
 * The bars that went worst, worst first.
 *
 * This is what "Loop the weak bars" is built from (docs/05 §6), so it is
 * ranked by total damage rather than by misses alone: a bar full of wrong
 * notes needs work just as much as one full of missed ones.
 */
export function hotSpots(
  misses: ReadonlyMap<number, number>,
  wrongs: ReadonlyMap<number, number>,
  limit = 5,
): HotSpot[] {
  const measures = new Set<number>([...misses.keys(), ...wrongs.keys()]);
  return [...measures]
    .map((measureIndex) => ({
      measureIndex,
      misses: misses.get(measureIndex) ?? 0,
      wrongs: wrongs.get(measureIndex) ?? 0,
    }))
    .filter((h) => h.misses + h.wrongs > 0)
    .sort((a, b) => b.misses + b.wrongs - (a.misses + a.wrongs) || a.measureIndex - b.measureIndex)
    .slice(0, limit);
}

export interface ScoreInput {
  mode: Mode;
  tempoPct: number;
  steps: readonly PreparedStep[];
  firstStep: number;
  lastStep: number;
  correctSteps: number;
  hits: number;
  missedTotal: number;
  wrongNotesTotal: number;
  deltas: readonly number[];
  missesByMeasure: ReadonlyMap<number, number>;
  wrongsByMeasure: ReadonlyMap<number, number>;
  durationMs: number;
  loops: number;
  rolledChordSteps: number;
  notes: readonly RecordedNote[];
}

export function buildScore(input: ScoreInput): SessionScore {
  let totalSteps = 0;
  let expectedNotes = 0;
  for (let i = input.firstStep; i <= input.lastStep; i += 1) {
    const step = input.steps[i];
    if (!step || step.isEmpty) continue;
    totalSteps += 1;
    expectedNotes += step.expected.length;
  }

  // Wait mode has no timetable, so a step is the unit; Tempo judges every
  // pitch against a slot, so a note is.
  const accuracy =
    input.mode === 'wait'
      ? totalSteps > 0
        ? input.correctSteps / totalSteps
        : 0
      : expectedNotes > 0
        ? input.hits / expectedNotes
        : 0;

  return {
    mode: input.mode,
    tempoPct: input.tempoPct,
    totalSteps,
    correctSteps: input.correctSteps,
    expectedNotes,
    hits: input.hits,
    missedTotal: input.missedTotal,
    wrongNotesTotal: input.wrongNotesTotal,
    accuracy: Math.min(1, Math.max(0, accuracy)),
    timing: timingStats(input.deltas),
    hotSpots: hotSpots(input.missesByMeasure, input.wrongsByMeasure),
    durationMs: input.durationMs,
    loops: input.loops,
    rolledChordSteps: input.rolledChordSteps,
    notes: [...input.notes],
  };
}

/** Thresholds from docs/02-curriculum.md Part G; all are settings. */
export interface MasteryCriteria {
  passAccuracy: number;
  passTempoPct: number;
  masterAccuracy: number;
  masterTempoPct: number;
}

export const DEFAULT_MASTERY: MasteryCriteria = {
  passAccuracy: 0.9,
  passTempoPct: 80,
  masterAccuracy: 0.97,
  masterTempoPct: 100,
};

export interface Outcome {
  passed: boolean;
  /**
   * Whether this run *qualifies* for mastery. Part G also requires it twice on
   * different days, which needs the progress store (P7) — one run cannot know
   * about another, so the engine reports eligibility and the store decides.
   */
  masterEligible: boolean;
  accuracy: number;
  tempoPct: number;
}

/**
 * Evaluates a run against the pass and master thresholds.
 *
 * Listen and Free never pass: nothing was judged, so there is nothing to
 * assess. Without an input source the app asks for a self-report instead
 * (docs/05 §3, docs/02 Part G).
 */
export function evaluateOutcome(
  score: SessionScore,
  criteria: MasteryCriteria = DEFAULT_MASTERY,
): Outcome {
  const judged = score.mode === 'wait' || score.mode === 'tempo';
  const passed =
    judged && score.accuracy >= criteria.passAccuracy && score.tempoPct >= criteria.passTempoPct;
  const masterEligible =
    judged &&
    score.accuracy >= criteria.masterAccuracy &&
    score.tempoPct >= criteria.masterTempoPct;
  return { passed, masterEligible, accuracy: score.accuracy, tempoPct: score.tempoPct };
}

/**
 * Builds a loop over the worst bars of a run, for the summary sheet's
 * "Loop the weak bars" button (docs/04 §5).
 */
export function weakBarsLoop(
  score: SessionScore,
  steps: readonly PreparedStep[],
  maxBars = 2,
): { fromStep: number; toStep: number } | undefined {
  const bars = score.hotSpots.slice(0, maxBars).map((h) => h.measureIndex);
  if (bars.length === 0) return undefined;
  const from = Math.min(...bars);
  const to = Math.max(...bars);
  let fromStep = -1;
  let toStep = -1;
  for (const step of steps) {
    if (step.measureIndex === from && fromStep < 0) fromStep = step.index;
    if (step.measureIndex <= to) toStep = step.index;
  }
  if (fromStep < 0 || toStep < fromStep) return undefined;
  return { fromStep, toStep };
}
