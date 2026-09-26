// Turning a run into a summary the learner can act on.
//
// docs/05-score-follow-engine.md §2 and §3 define accuracy; docs/02-curriculum.md
// Part G defines pass and master. Kept separate from the engine so the numbers
// can be recomputed from a stored session row later, and tested without
// running a session at all.

import { summarise } from '../util/stats';
import type { Requirement } from '../curriculum/types';
import {
  NOT_MEASURED,
  type BarTally,
  type HotSpot,
  type JudgedUnder,
  type Mode,
  type PreparedStep,
  type RecordedNote,
  type RunMeasures,
  type SessionScore,
  type StepOutcomes,
  type TimingStats,
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
  early: ReadonlyMap<number, number> = new Map(),
): HotSpot[] {
  const measures = new Set<number>([...misses.keys(), ...wrongs.keys(), ...early.keys()]);
  const damage = (h: HotSpot): number => h.misses + h.wrongs + (h.early ?? 0);
  return [...measures]
    .map((measureIndex): HotSpot => {
      const came = early.get(measureIndex) ?? 0;
      return {
        measureIndex,
        misses: misses.get(measureIndex) ?? 0,
        wrongs: wrongs.get(measureIndex) ?? 0,
        // An early note is trouble in its bar too (T37), and only said where
        // there was one, so every bar without one reads as it always did.
        ...(came > 0 ? { early: came } : {}),
      };
    })
    .filter((h) => damage(h) > 0)
    .sort((a, b) => damage(b) - damage(a) || a.measureIndex - b.measureIndex)
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
  /** Right notes played before their window (T37). Absent reads as none. */
  early?: number;
  earlyByMeasure?: ReadonlyMap<number, number>;
  durationMs: number;
  loops: number;
  rolledChordSteps: number;
  notes: readonly RecordedNote[];
  /** docs/05 §11.4: microphone accuracy is an estimate and is labelled so. */
  accuracyEstimated: boolean;
  lenientChordSteps: number;
  /** Every CC64 value the run saw. Absent reads as none, for old callers. */
  pedal?: readonly number[];
  /**
   * What happened at each step, as the engine marked it (C1). Absent for a
   * caller that does not keep them, which then reports no step outcomes.
   */
  stepMarks?: ReadonlyMap<number, StepMark>;
  /** Flat `[step, deltaMs, …]` for every timed note, in the order they were timed. */
  timed?: readonly number[];
  /** Flat `[step, midi, …]` for every right note played early. */
  earlyNotes?: readonly number[];
  judgedUnder?: JudgedUnder;
}

/**
 * What the engine marked at one step as the run went (C1).
 *
 * Counted where each thing is decided — a hit where a pitch matches, a miss
 * and an early note where a window closes, a Wait step's cleanliness where
 * it completes — so nothing is reconstructed afterwards from the notes, which
 * do not carry the misses at all.
 */
export interface StepMark {
  hit: number;
  missed: number;
  early: number;
  /** The pitches of the wrong notes put against this step. */
  wrong: number[];
  /** The step was finished: its window closed, or (Wait) it was completed. */
  done: boolean;
  /** Wait: completed with no wrong note and at most one reset. */
  clean: boolean;
  /** Wait: completed by the microphone's chord leniency. */
  lenient: boolean;
}

export function emptyStepMark(): StepMark {
  return { hit: 0, missed: 0, early: 0, wrong: [], done: false, clean: false, lenient: false };
}

/** One step's code (see `StepOutcomes`). */
function stepCode(step: PreparedStep, mark: StepMark | undefined, waitMode: boolean): string {
  if (step.isEmpty || step.expected.length === 0) return '-';
  if (!mark) return '.';
  if (waitMode) {
    if (!mark.done) return '.';
    if (mark.lenient) return 'l';
    return mark.clean ? 'h' : 'w';
  }
  const expected = step.expected.length;
  if (!mark.done && mark.missed === 0 && mark.early === 0 && mark.hit < expected) return '.';
  if (mark.missed === 0 && mark.early === 0 && mark.hit >= expected) return 'h';
  if (mark.hit === 0 && mark.early === 0) return 'm';
  if (mark.missed === 0) return 'e';
  return 'p';
}

/** Every step of the run, coded, with where each bar begins (C1). */
function stepOutcomesFor(input: ScoreInput, marks: ReadonlyMap<number, StepMark>): StepOutcomes {
  const waitMode = input.mode === 'wait';
  const codes: string[] = [];
  const measures: number[] = [];
  const wrong: number[] = [];
  let lastMeasure: number | null = null;
  for (let i = input.firstStep; i <= input.lastStep; i += 1) {
    const step = input.steps[i];
    if (!step) {
      codes.push('-');
      continue;
    }
    if (step.measureIndex !== lastMeasure) {
      measures.push(codes.length, step.sourceMeasureIndex);
      lastMeasure = step.measureIndex;
    }
    const mark = marks.get(i);
    codes.push(stepCode(step, mark, waitMode));
    for (const midi of mark?.wrong ?? []) wrong.push(i, midi);
  }
  return {
    from: input.firstStep,
    codes: codes.join(''),
    measures,
    wrong,
    early: [...(input.earlyNotes ?? [])],
    // Wait has no clock, so no note of it was timed: not an empty list.
    // Rounded to the millisecond, and `|| 0` so a delta that rounds to -0 is
    // stored as the 0 it is.
    timing: waitMode ? NOT_MEASURED : (input.timed ?? []).map((value, index) => (index % 2 === 0 ? value : Math.round(value) || 0)),
  };
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
    early: input.early ?? 0,
    accuracy: Math.min(1, Math.max(0, accuracy)),
    timing: timingStats(input.deltas),
    hotSpots: hotSpots(input.missesByMeasure, input.wrongsByMeasure, 5, input.earlyByMeasure),
    durationMs: input.durationMs,
    loops: input.loops,
    rolledChordSteps: input.rolledChordSteps,
    accuracyEstimated: input.accuracyEstimated,
    lenientChordSteps: input.lenientChordSteps,
    pedal: [...(input.pedal ?? [])],
    notes: [...input.notes],
    ...(input.stepMarks ? { stepOutcomes: stepOutcomesFor(input, input.stepMarks) } : {}),
    ...(input.judgedUnder ? { judgedUnder: { ...input.judgedUnder } } : {}),
  };
}

/** What a caller knows about a run that the score alone does not (C1). */
export interface MeasureContext {
  /** Whether any note reached the engine (T40's `heard`). */
  heard: boolean;
  /** The exercise's technique measure, as the sheet computed it, or none asked. */
  technique: TechniqueMeasure | null;
  /** Whether the input could send a pedal message at all: MIDI only. */
  pedalMeasurable: boolean;
  /** The run's prepared steps, for the accents; empty when the caller has none. */
  steps: readonly PreparedStep[];
}

/**
 * What the run measured, by its own definitions, with every channel it did
 * not measure marked `not measured` (C1; design §3).
 *
 * The one place the definitions live, so the record and a later reader
 * deriving from a stored row agree: Wait's pitch is steps completed cleanly,
 * Keep tempo's is expected pitches struck inside their window, and a
 * rhythm-only run has no pitch at all — its figure is the rhythm's. A run the
 * app heard nothing of measured nothing: no pitch, no timing, no steps.
 */
export function measuresOf(score: SessionScore, context: MeasureContext): RunMeasures {
  const chords = { rolled: score.rolledChordSteps, lenient: score.lenientChordSteps };
  const pedal = context.pedalMeasurable
    ? { messages: score.pedal?.length ?? 0, down: (score.pedal ?? []).filter((value) => value > 0).length }
    : NOT_MEASURED;
  if (!context.heard) {
    return {
      pitch: NOT_MEASURED,
      early: NOT_MEASURED,
      timing: NOT_MEASURED,
      ...(context.technique ? { technique: { kind: context.technique.kind, result: NOT_MEASURED, judged: 0 } } : {}),
      pedal,
      chords,
      loops: score.loops,
    };
  }
  const wait = score.mode === 'wait';
  const rhythm = score.rhythmOnly === true;
  const pitch = rhythm
    ? NOT_MEASURED
    : {
        definition: wait ? ('wait-steps' as const) : ('tempo-notes' as const),
        right: wait ? score.correctSteps : score.hits,
        of: wait ? score.totalSteps : score.expectedNotes,
        estimated: score.accuracyEstimated,
      };
  // Early is a Keep tempo observation, and a rhythm run does not hold a right
  // pitch for its window (it judges no pitch), so it has none either.
  const early = wait || rhythm ? NOT_MEASURED : (score.early ?? 0);
  const timing =
    wait || score.timing.n === 0
      ? NOT_MEASURED
      : {
          n: score.timing.n,
          meanMs: Math.round(score.timing.meanMs) || 0,
          sdMs: Math.round(score.timing.stdDevMs) || 0,
        };
  const technique = context.technique
    ? {
        kind: context.technique.kind,
        result: context.technique.measured ? (context.technique.met ? ('met' as const) : ('not met' as const)) : NOT_MEASURED,
        judged: context.technique.judged,
      }
    : undefined;
  const accents = accentsObserved(score, context.steps);
  return {
    pitch,
    ...(rhythm ? { rhythm: { right: score.hits, of: score.expectedNotes } } : {}),
    early,
    timing,
    ...(score.stepOutcomes ? { steps: score.stepOutcomes } : {}),
    ...(technique ? { technique } : {}),
    ...(accents === undefined ? {} : { accents }),
    pedal,
    chords,
    loops: score.loops,
  };
}

/**
 * The accents, where the run's music prints one: how many were played louder
 * than the run's own unaccented notes, or `not measured` where the notes all
 * arrived at one velocity (the screen keys) or there was nothing to compare.
 */
function accentsObserved(
  score: SessionScore,
  steps: readonly PreparedStep[],
): { right: number; of: number } | typeof NOT_MEASURED | undefined {
  if (!steps.some((step) => (step.accents?.length ?? 0) > 0)) return undefined;
  if (velocityIsFlat(score.notes)) return NOT_MEASURED;
  const result = accentScore(score.notes, steps);
  return result.judged > 0 ? { right: result.correct, of: result.judged } : NOT_MEASURED;
}

/**
 * A run's per-step detail folded into per-bar tallies (C1), for a stored row
 * past the observation window: see `BarTally`. What is lost is which step in
 * a bar a miss or a wrong note was at; the bar, the counts and the timing's
 * mean per bar stay.
 */
export function compactSteps(steps: StepOutcomes): BarTally[] {
  const bars: BarTally[] = [];
  const timed = steps.timing !== NOT_MEASURED;
  const timing = steps.timing === NOT_MEASURED ? [] : steps.timing;
  for (let i = 0; i < steps.measures.length; i += 2) {
    const offset = steps.measures[i] ?? 0;
    const measure = steps.measures[i + 1] ?? 0;
    const end = steps.measures[i + 2] ?? steps.codes.length;
    const segment = steps.codes.slice(offset, end);
    const first = steps.from + offset;
    const last = steps.from + end - 1;
    const inBar = (step: number): boolean => step >= first && step <= last;
    const count = (pairs: readonly number[]): number => {
      let n = 0;
      for (let p = 0; p < pairs.length; p += 2) if (inBar(pairs[p] ?? -1)) n += 1;
      return n;
    };
    let playable = 0;
    let clean = 0;
    let missed = 0;
    for (const code of segment) {
      if (code === '-') continue;
      playable += 1;
      if (code === 'h') clean += 1;
      if (code === 'm' || code === 'p') missed += 1;
    }
    const tally: BarTally = [measure, playable, clean, missed, count(steps.early), count(steps.wrong)];
    if (timed) {
      let n = 0;
      let sum = 0;
      for (let p = 0; p < timing.length; p += 2) {
        if (!inBar(timing[p] ?? -1)) continue;
        n += 1;
        sum += timing[p + 1] ?? 0;
      }
      bars.push([...tally, n, n > 0 ? Math.round(sum / n) || 0 : 0]);
    } else {
      bars.push(tally);
    }
  }
  return bars;
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
  /**
   * Whether the run measured a tempo at all (T37).
   *
   * Only a Keep tempo run does: its clock ran at `tempoPct` and every note was
   * judged against that clock. A Wait for me run holds the page until the note
   * arrives, so the slider's value is a setting nobody played to, and it is
   * not evidence of pulse. The sheet and the record read this rather than the
   * number beside it.
   */
  tempoMeasured: boolean;
}

/**
 * Whether a run in this mode measures tempo (T37).
 *
 * Keep tempo only. Wait has no clock to be inside (`05` §2), Listen judges
 * nothing and Free marks nothing. A rhythm-only run is a Keep tempo run whose
 * timing is exactly what was measured, so it counts here.
 */
export function measuresTempo(mode: Mode): boolean {
  return mode === 'tempo';
}

/**
 * Evaluates a run against the pass and master thresholds.
 *
 * Listen and Free never pass: nothing was judged, so there is nothing to
 * assess. Without an input source the app asks for a self-report instead
 * (docs/05 §3, docs/02 Part G).
 *
 * **A run that measured no tempo cannot meet a tempo floor** (T37; the
 * reviewer's boundary 6). A Wait for me run is honest evidence of knowing the
 * notes and no evidence of pulse: it used to pass on the slider's value, so a
 * run played one note at a time "passed at 80 %" because the slider said 80.
 * It can still pass a criterion whose floor is nought — there the notes are
 * the whole of what is asked — and it can never be master-eligible, because
 * Part G's master is "at 100 % tempo" and nothing measured one.
 */
export function evaluateOutcome(
  score: SessionScore,
  criteria: MasteryCriteria = DEFAULT_MASTERY,
): Outcome {
  const judged = score.mode === 'wait' || score.mode === 'tempo';
  const tempoMeasured = measuresTempo(score.mode);
  const tempoMet = tempoMeasured
    ? score.tempoPct >= criteria.passTempoPct
    : criteria.passTempoPct <= 0;
  const passed = judged && score.accuracy >= criteria.passAccuracy && tempoMet;
  const masterEligible =
    tempoMeasured &&
    score.accuracy >= criteria.masterAccuracy &&
    score.tempoPct >= criteria.masterTempoPct;
  return {
    passed,
    masterEligible,
    accuracy: score.accuracy,
    tempoPct: score.tempoPct,
    tempoMeasured,
  };
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

// --- articulation, voicing and shaping (P12a) --------------------------------
//
// Three things the engine already had the raw material for and did not measure.
// All three are pure functions over what a run recorded, for the same reason
// `buildScore` is: they can be recomputed from a stored session, and tested
// without running one.
//
// They are deliberately *not* accuracy. A staccato phrase played with every
// right note and no shortness is 100% accurate and misses the point of the
// exercise, which is why these return their own numbers rather than folding
// into `SessionScore.accuracy`.

/** A staccato note is off the key before half its written value has passed. */
export const STACCATO_MAX_HELD = 0.5;
/** A legato note lasts almost all of its value… */
export const LEGATO_MIN_HELD = 0.9;
/** …and may run into the next note, but not past it (docs/05 §7: overlap ≤ 1 step). */
export const LEGATO_MAX_HELD = 2.0;

export type Articulation = 'staccato' | 'legato';

export interface ArticulationScore {
  target: Articulation;
  /** Notes with both an onset and a release, judged against a step. */
  judged: number;
  matched: number;
  meanHeldFraction: number;
  /** Notes still down when the following note began. */
  overlapping: number;
  accuracy: number;
}

/**
 * How well the held length of each note matched the articulation asked for.
 *
 * The denominator is the step's `durMs` — the time to the next step at this
 * session's tempo — because that is what the written value *is* once a tempo
 * is chosen. Using the printed duration instead would make the same playing
 * pass at one tempo and fail at another, which is not what articulation means.
 *
 * A note with no recorded release is not judged rather than judged as held for
 * ever: the source may simply not send note-off (the microphone does not).
 */
export function articulationScore(
  notes: readonly RecordedNote[],
  steps: readonly PreparedStep[],
  target: Articulation,
): ArticulationScore {
  const byIndex = new Map(steps.map((step) => [step.index, step]));
  const fractions: number[] = [];
  let matched = 0;
  let overlapping = 0;

  for (const note of notes) {
    if (note.stepIndex === null || note.releasedAtMs === undefined) continue;
    const step = byIndex.get(note.stepIndex);
    if (!step || step.durMs <= 0) continue;
    const held = (note.releasedAtMs - note.tMs) / step.durMs;
    if (held < 0) continue;
    fractions.push(held);
    if (held > 1) overlapping += 1;
    const ok =
      target === 'staccato'
        ? held < STACCATO_MAX_HELD
        : held >= LEGATO_MIN_HELD && held <= LEGATO_MAX_HELD;
    if (ok) matched += 1;
  }

  const judged = fractions.length;
  return {
    target,
    judged,
    matched,
    meanHeldFraction: judged > 0 ? fractions.reduce((a, b) => a + b, 0) / judged : 0,
    overlapping,
    accuracy: judged > 0 ? matched / judged : 0,
  };
}

/** The top note must be this much louder than the mean of the rest. */
export const VOICING_MIN_RATIO = 1.4;

export interface VoicingScore {
  /** Chords with at least two notes recorded against the same step. */
  judged: number;
  matched: number;
  meanRatio: number;
  accuracy: number;
}

/**
 * Whether the top of each chord sang above the rest of it.
 *
 * The measurable behind the *Beautiful pieces* shelf's one real technique. Only
 * chords are judged — a step with one note has no balance to get wrong — and
 * the comparison is against the mean of the notes underneath rather than
 * against the loudest of them, because what the ear hears is the melody
 * standing out of a texture, not out of one other note.
 */
export function voicingScore(
  notes: readonly RecordedNote[],
  minRatio: number = VOICING_MIN_RATIO,
): VoicingScore {
  const chords = new Map<number, RecordedNote[]>();
  for (const note of notes) {
    if (note.stepIndex === null) continue;
    const group = chords.get(note.stepIndex);
    if (group) group.push(note);
    else chords.set(note.stepIndex, [note]);
  }

  const ratios: number[] = [];
  let matched = 0;
  for (const group of chords.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.midi - b.midi);
    const top = sorted[sorted.length - 1];
    const under = sorted.slice(0, -1);
    if (!top) continue;
    const mean = under.reduce((sum, n) => sum + n.velocity, 0) / under.length;
    if (mean <= 0) continue;
    const ratio = top.velocity / mean;
    ratios.push(ratio);
    if (ratio >= minRatio) matched += 1;
  }

  const judged = ratios.length;
  return {
    judged,
    matched,
    meanRatio: judged > 0 ? ratios.reduce((a, b) => a + b, 0) / judged : 0,
    accuracy: judged > 0 ? matched / judged : 0,
  };
}

/** A shaped line has to travel at least this far, in MIDI velocity. */
export const SHAPING_MIN_RANGE = 30;

export type Shape = 'crescendo' | 'diminuendo';

export interface ShapingScore {
  shape: Shape;
  /** Velocity of the last note minus the first, signed for the shape asked. */
  range: number;
  /** Fraction of note-to-note steps that moved the right way (or stayed level). */
  monotonic: number;
  passed: boolean;
}

/**
 * Whether a line *travelled* rather than stepping between two dynamics.
 *
 * `DynamicsDrill` compares a soft phrase with a loud one, which measures that
 * two dynamics are different. A crescendo is a different claim: the velocity
 * has to rise across the run and cover real ground. Both halves are required —
 * a line that rises 5 and one that jumps 40 in the middle and then sits are
 * each failing in their own way.
 *
 * "Monotonic" is measured as the share of adjacent pairs moving the right way
 * rather than as an absolute, because no human plays a perfectly ordered
 * crescendo and demanding one would fail every real performance.
 */
export function shapingScore(
  notes: readonly RecordedNote[],
  shape: Shape = 'crescendo',
  minRange: number = SHAPING_MIN_RANGE,
  minMonotonic = 0.7,
): ShapingScore {
  const played = [...notes].sort((a, b) => a.tMs - b.tMs);
  if (played.length < 2) {
    return { shape, range: 0, monotonic: 0, passed: false };
  }
  const first = played[0]?.velocity ?? 0;
  const last = played[played.length - 1]?.velocity ?? 0;
  const range = shape === 'crescendo' ? last - first : first - last;

  let moved = 0;
  for (let i = 1; i < played.length; i += 1) {
    const previous = played[i - 1]?.velocity ?? 0;
    const current = played[i]?.velocity ?? 0;
    const delta = shape === 'crescendo' ? current - previous : previous - current;
    if (delta >= 0) moved += 1;
  }
  const monotonic = moved / (played.length - 1);

  return {
    shape,
    range,
    monotonic,
    passed: range >= minRange && monotonic >= minMonotonic,
  };
}

// --- what a technique exercise asks to be measured (P12a, wired 2026-09-21) --

/**
 * The extra number a technique exercise is about, or nothing.
 *
 * The three scorers above were written, tested and **never called**: the audit
 * found each name appearing in `app/src` only at its own definition, and four
 * lessons had to be rewritten to say the app did not measure what the rung was
 * for. A staccato study judged on which notes you played and not on how long
 * you held them is judging the one thing the exercise is not about.
 *
 * **How an item asks.** By its own `drill` block, which the generator wrote
 * when it wrote the notes: `exercise.articulation.c.staccato.right` carries
 * `{ kind: 'articulation', params: { articulation: 'staccato',
 * heldFractionMax: 0.5 } }`, and the shaping and voicing exercises carry their
 * own targets the same way. Not from the rung's `mastery.custom` — those four
 * rungs carry no `custom` at all — and not from the item's title or its
 * concepts, which `00` §1a says are asserted where this is measured. The
 * exercise's own numbers are used where it states them, so an exercise that
 * wants a different target gets one by saying so rather than by a code change.
 *
 * **It is not accuracy.** A staccato phrase with every right note and no
 * shortness is 100 % accurate, which is the whole reason these exist; the
 * measure is reported beside the accuracy and folded into neither. Whether it
 * can *stop* a pass is the rung's business, and no rung asks yet — see
 * `demandsTechniqueMeasure`.
 */
export interface TechniqueMeasure {
  /** The exercise's `drill.kind`: `articulation`, `voicing` or `shaping`. */
  kind: string;
  /** What the summary sheet calls it. */
  label: string;
  /** The sentence under that label. */
  text: string;
  /** Whether the run met the target the exercise states. */
  met: boolean;
  /** How many things were judged — nought means the run could not say. */
  judged: number;
  /**
   * Whether the run could take the measure at all (C1). False on every
   * *not measured* line — no note-off, one velocity, no pedal message, a
   * pedal that is a switch — so a record can say "not measured" without
   * reading the sentence.
   */
  measured: boolean;
}

function numberParam(params: Record<string, unknown> | undefined, name: string): number | null {
  const value = params?.[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Did this run carry any dynamic information at all? (T17-2, Entry 38 FAULT 8.)
 *
 * The on-screen keys send a fixed velocity — `TOUCH_VELOCITY` in
 * `ui/KeyboardStrip.ts`, with the reason beside it: Android reports touch
 * `pressure` as 0 or 1, so there is nothing honest to derive one from. Two of
 * the three technique measures are velocity measures: **voicing** asks whether
 * the top of a chord sang above the rest of it, and **shaping** asks the line
 * to travel a velocity range. Played from the glass, both are arithmetic on
 * one number repeated — voicing reports every chord at a ratio of exactly 1
 * and calls it 0 % of them, shaping reports a travel of 0 out of 30 — and a
 * learner reads that as *you played it flat* when what happened is that the
 * instrument could not say.
 *
 * So the measure refuses, in the same words the other unmeasurable cases
 * already use (Entry 24 item 2: *not measured — the input did not say when the
 * keys came up*, *not measured — no pedal message arrived*). **A fact about
 * the run, not a guess about the device**: what is tested is that every note
 * arrived at the same velocity, which is true of the glass and of any source
 * that sends one number. Fewer than two notes is not flatness — the callers
 * handle that case above with their own sentence.
 *
 * The honest full fix is still the owner's, and is in `pending-review`: a
 * cable, or a measure those rungs do not take without one. This is the half
 * that belongs on the summary sheet.
 */
export function velocityIsFlat(notes: readonly RecordedNote[]): boolean {
  if (notes.length < 2) return false;
  const first = notes[0]?.velocity;
  return notes.every((note) => note.velocity === first);
}

/** What the sheet says where a velocity measure has no velocities to read. */
const NO_DYNAMICS =
  'not measured — every note arrived at the same velocity, which is what the on-screen keys send';

export function techniqueMeasureFor(
  drill: { kind: string; params?: Record<string, unknown> } | null | undefined,
  score: SessionScore,
  steps: readonly PreparedStep[],
  /** The share of judged things that has to be right — the rung's own pass. */
  minShare = DEFAULT_MASTERY.passAccuracy,
): TechniqueMeasure | null {
  if (!drill) return null;
  const params = drill.params;

  if (drill.kind === 'articulation') {
    const asked = params?.articulation;
    const target: Articulation = asked === 'staccato' ? 'staccato' : 'legato';
    const result = articulationScore(score.notes, steps, target);
    if (result.judged === 0) {
      return {
        kind: drill.kind,
        label: target === 'staccato' ? 'Staccato' : 'Legato',
        // Said plainly rather than as a nought: the microphone does not send
        // note-off, so "no note was short enough" and "nothing could be
        // measured" are different answers and only one of them is true.
        text: 'not measured — the input did not say when the keys came up',
        met: false,
        judged: 0,
        measured: false,
      };
    }
    const share = result.accuracy;
    return {
      kind: drill.kind,
      label: target === 'staccato' ? 'Staccato' : 'Legato',
      text: `${String(Math.round(share * 100))}% of ${String(result.judged)} notes held the right length (on average ${String(
        Math.round(result.meanHeldFraction * 100),
      )}% of the written value)`,
      met: share >= minShare,
      judged: result.judged,
      measured: true,
    };
  }

  if (drill.kind === 'voicing') {
    const ratio = numberParam(params, 'topNoteRatio') ?? VOICING_MIN_RATIO;
    const result = voicingScore(score.notes, ratio);
    if (result.judged === 0) {
      return {
        kind: drill.kind,
        label: 'Top note',
        text: 'not measured — no chord was struck with more than one note',
        met: false,
        judged: 0,
        measured: false,
      };
    }
    // After the count, because "no chord was struck" is the more specific
    // answer where both are true.
    if (velocityIsFlat(score.notes)) {
      return { kind: drill.kind, label: 'Top note', text: NO_DYNAMICS, met: false, judged: 0, measured: false };
    }
    return {
      kind: drill.kind,
      label: 'Top note',
      text: `${String(Math.round(result.accuracy * 100))}% of ${String(result.judged)} chords sang the top note at least ${String(
        ratio,
      )} times the rest (on average ${result.meanRatio.toFixed(2)}×)`,
      met: result.accuracy >= minShare,
      judged: result.judged,
      measured: true,
    };
  }

  if (drill.kind === 'shaping') {
    const shape: Shape = params?.shape === 'diminuendo' ? 'diminuendo' : 'crescendo';
    const minRange = numberParam(params, 'minVelocityRange') ?? SHAPING_MIN_RANGE;
    const result = shapingScore(score.notes, shape, minRange);
    if (score.notes.length < 2) {
      return {
        kind: drill.kind,
        label: shape === 'diminuendo' ? 'Diminuendo' : 'Crescendo',
        text: 'not measured — too few notes were heard to have a slope',
        met: false,
        judged: score.notes.length,
        measured: false,
      };
    }
    // A line of one velocity has no slope to read, and reporting it as a
    // travel of nought blames the player for the instrument.
    if (velocityIsFlat(score.notes)) {
      return {
        kind: drill.kind,
        label: shape === 'diminuendo' ? 'Diminuendo' : 'Crescendo',
        text: NO_DYNAMICS,
        met: false,
        judged: 0,
        measured: false,
      };
    }
    return {
      kind: drill.kind,
      label: shape === 'diminuendo' ? 'Diminuendo' : 'Crescendo',
      text: `travelled ${String(Math.round(result.range))} of the ${String(minRange)} asked for, ${String(
        Math.round(result.monotonic * 100),
      )}% of it in the right direction`,
      met: result.passed,
      judged: score.notes.length,
      measured: true,
    };
  }

  if (drill.kind === 'half-pedal') {
    const range = ccRangeParam(params) ?? DEFAULT_HALF_PEDAL_RANGE;
    const result = halfPedalScore(score.pedal ?? [], range);
    if (result.total === 0) {
      return {
        kind: drill.kind,
        label: 'Half pedal',
        // Not a nought: "the pedal was never part-way" and "no pedal was
        // connected" are different answers, and only one is about playing.
        text: 'not measured — no pedal message arrived',
        met: false,
        judged: 0,
        measured: false,
      };
    }
    if (result.held === 0) {
      return {
        kind: drill.kind,
        label: 'Half pedal',
        // Messages arrived and every one of them was 0. That is not a switch —
        // a switch has been seen to send 127 — and it is not a nought either:
        // the exercise asks how the pedal was held and it was never put down.
        text: 'not measured — the pedal never left the top',
        met: false,
        judged: 0,
        measured: false,
      };
    }
    if (result.binaryPedal) {
      return {
        kind: drill.kind,
        label: 'Half pedal',
        text: 'not measured — this pedal is a switch, sending only 0 and 127',
        met: false,
        judged: result.held,
        measured: false,
      };
    }
    return {
      kind: drill.kind,
      label: 'Half pedal',
      // "with the pedal down" is in the sentence because it is in the sum: the
      // lifts are not counted and the learner is told so rather than left to
      // wonder why the number is not the number of times the pedal moved.
      text: `${String(Math.round(result.share * 100))}% of ${String(
        result.held,
      )} pedal messages with the pedal down were between ${String(range[0])} and ${String(range[1])}`,
      met: result.share >= minShare,
      judged: result.held,
      measured: true,
    };
  }

  return null;
}

/**
 * How much louder an accented note has to be than the run's own unaccented
 * notes before it counts as accented.
 *
 * A ratio against the learner's own playing, not a MIDI velocity: a light
 * player and a heavy one accent by the same gesture and land on different
 * numbers, and a fixed threshold would judge the touch rather than the
 * reading.
 */
export const ACCENT_MIN_RATIO = 1.15;

export interface AccentResult {
  /** Accented notes the run actually played. */
  judged: number;
  correct: number;
  /** 0..1, and 0 when nothing could be judged. */
  accuracy: number;
  /** The mean velocity of the run's unaccented notes, which is the reference. */
  baseline: number;
}

/**
 * Did the learner lean on the notes the score accents (T16 item 7)?
 *
 * `<accent>` reached `ScoreNote` on 2026-09-22 and this is what it is for. The
 * reference is the run's **own** unaccented notes, so the question is "was
 * this note louder than the way you played the rest", which is the question an
 * accent asks. A piece that prints no accent, or a run with no unaccented
 * note to compare against, is judged nothing rather than judged zero.
 */
export function accentScore(
  played: readonly RecordedNote[],
  steps: readonly PreparedStep[],
): AccentResult {
  // By step *and* pitch, not by pitch alone. A piece accents its first E and
  // not its fourth, and matching on the pitch would have judged both - which
  // is what the first version of this did, and the fixture caught it.
  const byIndex = new Map(steps.map((step) => [step.index, step]));
  const isAccented = (note: RecordedNote): boolean => {
    if (note.stepIndex === null || note.stepIndex === undefined) return false;
    return byIndex.get(note.stepIndex)?.accents?.includes(note.midi) === true;
  };
  const plain = played.filter((note) => !isAccented(note));
  const marked = played.filter((note) => isAccented(note));
  if (marked.length === 0 || plain.length === 0) {
    return { judged: 0, correct: 0, accuracy: 0, baseline: 0 };
  }
  const baseline = plain.reduce((sum, note) => sum + note.velocity, 0) / plain.length;
  const correct = marked.filter((note) => note.velocity >= baseline * ACCENT_MIN_RATIO).length;
  return { judged: marked.length, correct, accuracy: correct / marked.length, baseline };
}

/** What `exercise.pedal.half-pedal.*` asks for when it states nothing. */
export const DEFAULT_HALF_PEDAL_RANGE: [number, number] = [32, 96];

export interface HalfPedalResult {
  /** Every CC64 message the run recorded, whatever the value. */
  total: number;
  /**
   * Those sent inside a pedal-down span, which is what `share` divides by.
   *
   * The rule: a message counts from the one that first takes the pedal off the
   * top until the one that puts it back, that last one excluded. A value of 0
   * is the only "damper fully up" a pedal has, so that set is exactly the
   * messages above 0 and no span bookkeeping is needed to find it.
   */
  held: number;
  inRange: number;
  /**
   * How often the pedal was anything but fully up or fully down, which is the
   * habit the exercise exists to build. A count rather than a flag: "twice in
   * a four-bar phrase" and "throughout" are different playing.
   */
  partial: number;
  /** 0..1, and 0 for a switch — see `binaryPedal`. */
  share: number;
  /**
   * True when every message was 0 or 127.
   *
   * Many digital actions send only those two, and scoring that as "you failed
   * to half-pedal" would blame the player for the instrument. So it is its own
   * state and whoever prints it says the exercise cannot be judged on this
   * piano, rather than showing a permanent nought.
   */
  binaryPedal: boolean;
}

/**
 * How much of a run was spent with the damper part-way (`04` §5b, T16 item 6).
 *
 * One function, two callers: `PedalDrill.halfPedalResult` on the drill screen
 * and `techniqueMeasureFor` on the Score screen. The exercise opens on the
 * Score screen and the drill measures the same thing, so a second copy of this
 * arithmetic would be the two-lists-of-one-fact shape this repository keeps
 * paying for.
 *
 * The denominator is a count of CC64 messages rather than of chords: this is
 * the value held, not the timing of a change.
 *
 * **Which messages** (2026-09-22 review): the ones inside a pedal-down span,
 * from the message that takes the pedal off the top to the one that returns
 * it there, that last one excluded — `held`, and equivalently every value
 * above 0. It used to be all of them, and since `met` asks for nine in ten
 * inside the range, **lifting the pedal counted against the pedalling**: a
 * clean change is a lift and a return, so a run that half-pedalled perfectly
 * through four phrases arrived at the sheet under the pass with a 0 for every
 * lift in the denominator. The exercise asks how the pedal was held, and a
 * message with it up is not an answer to that.
 */
export function halfPedalScore(
  values: readonly number[],
  range: [number, number],
): HalfPedalResult {
  const [low, high] = range;
  const down = values.filter((v) => v > 0);
  const total = values.length;
  const held = down.length;
  const inRange = down.filter((v) => v >= low && v <= high).length;
  const partial = down.filter((v) => v < 127).length;
  // Judged on the messages that said something: a run whose pedal never left
  // the top is not a switch — it only ever sent one of the two values — and
  // `techniqueMeasureFor` says so in its own sentence.
  const binaryPedal = held > 0 && partial === 0;
  return {
    total,
    held,
    inRange,
    partial,
    share: held > 0 && !binaryPedal ? inRange / held : 0,
    binaryPedal,
  };
}

function ccRangeParam(params: Record<string, unknown> | undefined): [number, number] | null {
  const asked: unknown = params?.ccRange;
  if (!Array.isArray(asked) || asked.length !== 2) return null;
  const low: unknown = asked[0];
  const high: unknown = asked[1];
  if (typeof low !== 'number' || typeof high !== 'number') return null;
  return [low, high];
}

/**
 * Does this rung make its technique measure a condition of passing?
 *
 * A rung says so with a `measure` requirement naming the kind (C5), rather
 * than by being on a list of rung ids that would go stale the first time a
 * rung moved. It was a comparison written into `mastery.custom` and read by a
 * regular expression; `custom` became the rung's `requirements`, and a rule
 * the app cannot measure is an `unjudged` requirement, which binds nothing.
 *
 * **No rung says so today.** `technique.4`, `.5`, `.6` and `.7` require no
 * measure, so the measure is reported and the pass is unaffected, which is
 * what the lessons on those rungs now say. The hook is here so that making
 * one of them binding is a content change and not a code change.
 */
export function demandsTechniqueMeasure(requirements: readonly Requirement[] | undefined, kind: string): boolean {
  return (requirements ?? []).some((requirement) => requirement.kind === 'measure' && requirement.measure === kind);
}
