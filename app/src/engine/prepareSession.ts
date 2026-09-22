// Turning a ScoreModel into the flat table the engine runs on.
//
// docs/05-score-follow-engine.md §1. Everything session-specific is resolved
// once, here: the hand filter, the transpose, grace-note exclusion, and the
// millisecond timetable at this session's tempo. The engine's hot paths then
// do array lookups instead of re-deriving music theory on every note.

import { SWING_OFFBEAT } from '../audio/backingLoop';
import { timeSignatureAt, type ScoreModel, type ScoreStep } from '../score/types';
import {
  ENGINE_DEFAULTS,
  type EngineOptions,
  type PreparedSession,
  type PreparedStep,
} from './types';

/** Clamp for `tempoPct`, matching the Score screen's slider (docs/04 §5). */
export const MIN_TEMPO_PCT = 30;
export const MAX_TEMPO_PCT = 130;

function expectedFor(
  step: ScoreStep,
  hands: 'R' | 'L' | 'both',
  transposeSemis: number,
  includeGraceNotes: boolean,
): { expected: number[]; noteIdsByMidi: Map<number, string[]>; accents: number[] } {
  const noteIdsByMidi = new Map<number, string[]>();
  const accented = new Set<number>();
  for (const note of step.notes) {
    if (!includeGraceNotes && note.graceNote) continue;
    if (hands !== 'both' && note.hand !== hands) continue;
    const midi = note.midi + transposeSemis;
    const ids = noteIdsByMidi.get(midi);
    if (ids) ids.push(note.id);
    else noteIdsByMidi.set(midi, [note.id]);
    if (note.accent === true) accented.add(midi);
  }
  // Ascending so a chord's expected set reads like the score.
  const expected = [...noteIdsByMidi.keys()].sort((a, b) => a - b);
  return { expected, noteIdsByMidi, accents: [...accented].sort((a, b) => a - b) };
}

/**
 * Resolves a loop given as bar numbers into step indexes.
 *
 * `toBar` is inclusive, so a loop over "bars 5 to 8" ends at the last step of
 * bar 8 — which is what "loop the weak bars" means to a player.
 */
export function loopFromMeasures(
  model: ScoreModel,
  fromMeasure: number,
  toMeasure: number,
): { fromStep: number; toStep: number } | undefined {
  const first = model.steps.find((s) => s.measureIndex === fromMeasure);
  if (!first) return undefined;
  let last: ScoreStep | undefined;
  for (const step of model.steps) {
    if (step.measureIndex <= toMeasure) last = step;
    else break;
  }
  if (!last || last.index < first.index) return undefined;
  return { fromStep: first.index, toStep: last.index };
}

/**
 * A loop from **printed** bar numbers, 1-based (docs/04 §5, P18).
 *
 * A named section says "bars 17 to 32", meaning what is engraved on the page.
 * `loopFromMeasures` works in the model's unrolled index, where a piece with a
 * repeat has twice as many bars as the page shows — so a section fed to it
 * would loop the wrong music the moment a repeat existed.
 *
 * On a repeated section this loops the *first* pass, which is the predictable
 * reading: the player asked for bars 17-32 and gets bars 17-32.
 */
export function loopFromPrintedBars(
  model: ScoreModel,
  fromBar: number,
  toBar: number,
): { fromStep: number; toStep: number } | undefined {
  const first = model.steps.find((step) => step.sourceMeasureIndex === fromBar - 1);
  if (!first) return undefined;
  let last: ScoreStep | undefined;
  for (const step of model.steps) {
    if (step.index < first.index) continue;
    // Stop at the first step past the section rather than taking the last one
    // anywhere in the piece: on a repeat the same printed bar occurs twice,
    // and the second occurrence is a different pass.
    if (step.sourceMeasureIndex > toBar - 1) break;
    last = step;
  }
  if (!last || last.index < first.index) return undefined;
  return { fromStep: first.index, toStep: last.index };
}

/**
 * Where a beat lands once the score says swing (built 2026-09-21).
 *
 * A swing or shuffle direction means the pair of eighths in a beat is played
 * as the first and third of a triplet: the first takes two thirds of the beat
 * and the second one third. So the *off*-beat eighth — the one written at
 * `x.5` — belongs at `x + 2/3`, and everything else stays where it is. The
 * ratio is `SWING_OFFBEAT`, which `audio/backingLoop.ts` already swings the
 * app's own backing loops by and states the reason for; taking it from there
 * rather than writing `2/3` again is what keeps the app's playing and the
 * app's judging in agreement.
 *
 * Only a plain off-beat eighth moves. A triplet already sits at `x + 1/3` and
 * `x + 2/3` and is written that way on purpose, and a sixteenth inside a
 * swung beat has no agreed placement at all — a swing marking is a convention
 * about eighths, so pretending it says anything about the rest would be
 * inventing a rule and judging somebody against it.
 */
export function swungOnset(onset: number): number {
  const beat = Math.floor(onset);
  const within = onset - beat;
  // A floating-point onset from a tie or a tuplet will not be exactly 0.5, and
  // must not be dragged onto the swung position by a loose comparison: the
  // tick grid is 960 to the quarter, so anything inside half a tick is the
  // written off-beat and anything else is some other note.
  const halfTick = 1 / 1920;
  return Math.abs(within - 0.5) <= halfTick ? beat + SWING_OFFBEAT : onset;
}

/**
 * Builds the per-step table for a run.
 *
 * The millisecond timetable comes from `model.beatToMs`, so a tempo change
 * written into the score is honoured; `tempoPct` scales the whole thing, and
 * `swing` moves the off-beat eighths before either of those applies.
 */
export function prepareSession(model: ScoreModel, options: EngineOptions): PreparedSession {
  const hands = options.hands ?? ENGINE_DEFAULTS.hands;
  const transposeSemis = options.transposeSemis ?? ENGINE_DEFAULTS.transposeSemis;
  const includeGraceNotes = options.includeGraceNotes ?? ENGINE_DEFAULTS.includeGraceNotes;
  const tempoPct = Math.min(
    MAX_TEMPO_PCT,
    Math.max(MIN_TEMPO_PCT, options.tempoPct ?? ENGINE_DEFAULTS.tempoPct),
  );
  const tempoScale = tempoPct / 100;
  const swing = options.swing ?? ENGINE_DEFAULTS.swing;

  const steps: PreparedStep[] = model.steps.map((step) => {
    const { expected, noteIdsByMidi, accents } = expectedFor(
      step,
      hands,
      transposeSemis,
      includeGraceNotes,
    );
    return {
      index: step.index,
      expected,
      noteIdsByMidi,
      ...(accents.length > 0 ? { accents } : {}),
      // The timetable is the only thing swing changes. Everything downstream
      // — the cursor, the window, the deltas, the histogram, *Rhythm only* —
      // reads this number and needed no second code path.
      tMs: model.beatToMs(swing ? swungOnset(step.onset) : step.onset, tempoScale),
      durMs: 0,
      measureIndex: step.measureIndex,
      sourceMeasureIndex: step.sourceMeasureIndex,
      isMeasureStart: step.isMeasureStart,
      isEmpty: expected.length === 0,
    };
  });

  // durMs is the gap to the next step; the last one runs to the end of the
  // piece, which is the end of its own longest note.
  for (let i = 0; i < steps.length; i += 1) {
    const current = steps[i];
    if (!current) continue;
    const next = steps[i + 1];
    if (next) {
      current.durMs = next.tMs - current.tMs;
      continue;
    }
    const modelStep = model.steps[i];
    const longest = modelStep
      ? modelStep.notes.reduce((max, n) => Math.max(max, n.duration), 0)
      : 0;
    current.durMs = longest > 0 ? model.beatToMs(modelStep!.onset + longest, tempoScale) - current.tMs : 0;
  }

  const loop = options.loop;
  const firstStep = Math.max(0, Math.min(loop?.fromStep ?? 0, steps.length - 1));
  const lastStep = Math.max(firstStep, Math.min(loop?.toStep ?? steps.length - 1, steps.length - 1));

  const timeSig = timeSignatureAt(model.timeSigMap, steps[firstStep]?.measureIndex ?? 0);
  // Beats here are quarter notes, so 6/8 is six eighths = three beats.
  const beatsPerBar = timeSig ? (timeSig.beats * 4) / timeSig.beatType : 4;
  // A beat *where the run starts*, not at bar 1. The count-in used
  // `beatToMs(1)` — the length of the piece's first beat — so a loop set after
  // a tempo change was counted in at the opening tempo and then played at the
  // section's. Six of the Chopin editions change tempo mid-piece, and looping
  // a slow section of a fast piece is exactly what a loop is for.
  const startBeat = model.steps[firstStep]?.onset ?? 0;
  const msPerBeat =
    model.beatToMs(startBeat + 1, tempoScale) - model.beatToMs(startBeat, tempoScale);
  const countInBars = options.countInBars ?? ENGINE_DEFAULTS.countInBars;
  const countInMs =
    options.mode === 'tempo' || options.mode === 'listen' ? countInBars * beatsPerBar * msPerBeat : 0;

  return {
    model,
    options: {
      mode: options.mode,
      hands,
      tempoPct,
      transposeSemis,
      includeGraceNotes,
      swing,
      strict: options.strict ?? ENGINE_DEFAULTS.strict,
      lookahead: options.lookahead ?? ENGINE_DEFAULTS.lookahead,
      chordWindowMs: options.chordWindowMs ?? ENGINE_DEFAULTS.chordWindowMs,
      toleranceMs: options.toleranceMs ?? ENGINE_DEFAULTS.toleranceMs,
      countInBars,
      inputLatencyMs: options.inputLatencyMs ?? ENGINE_DEFAULTS.inputLatencyMs,
      minConfidence: options.minConfidence ?? ENGINE_DEFAULTS.minConfidence,
      wrongNoteConfidence: options.wrongNoteConfidence ?? ENGINE_DEFAULTS.wrongNoteConfidence,
      micChordLeniency: options.micChordLeniency ?? ENGINE_DEFAULTS.micChordLeniency,
      micChordFraction: options.micChordFraction ?? ENGINE_DEFAULTS.micChordFraction,
      micChordGraceMs: options.micChordGraceMs ?? ENGINE_DEFAULTS.micChordGraceMs,
      accuracyEstimated: options.accuracyEstimated ?? ENGINE_DEFAULTS.accuracyEstimated,
      beatsPerBar: options.beatsPerBar ?? beatsPerBar,
      ...(loop ? { loop: { fromStep: firstStep, toStep: lastStep } } : {}),
    },
    steps,
    firstStep,
    lastStep,
    countInMs,
    msPerBeat,
  };
}

/**
 * The next step at or after `from` that has something to play.
 *
 * Wait mode skips steps the hand filter emptied (docs/05 §1.1); Tempo mode
 * passes through them so the display stays aligned with the music.
 */
export function nextPlayableStep(
  steps: readonly PreparedStep[],
  from: number,
  lastStep: number,
): number | null {
  for (let i = from; i <= lastStep; i += 1) {
    if (steps[i] && !steps[i]!.isEmpty) return i;
  }
  return null;
}
