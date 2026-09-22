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
  /** docs/05 §11.4: microphone accuracy is an estimate and is labelled so. */
  accuracyEstimated: boolean;
  lenientChordSteps: number;
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
    accuracyEstimated: input.accuracyEstimated,
    lenientChordSteps: input.lenientChordSteps,
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
}

function numberParam(params: Record<string, unknown> | undefined, name: string): number | null {
  const value = params?.[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

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
      };
    }
    const share = result.accuracy;
    return {
      kind: drill.kind,
      label: target === 'staccato' ? 'Staccato' : 'Legato',
      text: `${String(Math.round(share * 100))}% of ${String(result.judged)} notes held the right length (mean ${String(
        Math.round(result.meanHeldFraction * 100),
      )}% of the written value)`,
      met: share >= minShare,
      judged: result.judged,
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
      };
    }
    return {
      kind: drill.kind,
      label: 'Top note',
      text: `${String(Math.round(result.accuracy * 100))}% of ${String(result.judged)} chords sang the top note at least ${String(
        ratio,
      )} times the rest (mean ${result.meanRatio.toFixed(2)}×)`,
      met: result.accuracy >= minShare,
      judged: result.judged,
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
    };
  }

  return null;
}

/**
 * Does this rung make its technique measure a condition of passing?
 *
 * Deliberately syntactic, and deliberately the same shape as
 * `demandsMeasuredAccuracy`: a rung says so by naming the measure with a
 * comparison in `mastery.custom` — `voicing-top-note>=0.9` — rather than by
 * being on a list of rung ids that would go stale the first time a rung moved.
 *
 * **No rung says so today.** `technique.4`, `.5`, `.6` and `.7` carry no
 * `custom` at all, so the measure is reported and the pass is unaffected,
 * which is what the lessons on those rungs now say. The hook is here so that
 * making one of them binding is a content change and not a code change.
 */
export function demandsTechniqueMeasure(custom: string | undefined, kind: string): boolean {
  if (custom === undefined) return false;
  // Built by hand rather than as one template literal: written that way the
  // escapes went in as `\b` and `\d`, which a template literal reads as a
  // backspace character and the letter `d`. It compiled, it type-checked, and
  // the rule matched nothing at all — the sort of fault only a test finds.
  const word = '[a-zA-Z]';
  const pattern = ['(?<!', word, ')', kind, '(?!', word, ')[a-z-]*\\s*[<>]=?\\s*[0-9]'].join('');
  return new RegExp(pattern).test(custom);
}
