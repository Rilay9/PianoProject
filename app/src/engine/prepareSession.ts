// Turning a ScoreModel into the flat table the engine runs on.
//
// docs/05-score-follow-engine.md §1. Everything session-specific is resolved
// once, here: the hand filter, the transpose, grace-note exclusion, and the
// millisecond timetable at this session's tempo. The engine's hot paths then
// do array lookups instead of re-deriving music theory on every note.

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
): { expected: number[]; noteIdsByMidi: Map<number, string[]> } {
  const noteIdsByMidi = new Map<number, string[]>();
  for (const note of step.notes) {
    if (!includeGraceNotes && note.graceNote) continue;
    if (hands !== 'both' && note.hand !== hands) continue;
    const midi = note.midi + transposeSemis;
    const ids = noteIdsByMidi.get(midi);
    if (ids) ids.push(note.id);
    else noteIdsByMidi.set(midi, [note.id]);
  }
  // Ascending so a chord's expected set reads like the score.
  const expected = [...noteIdsByMidi.keys()].sort((a, b) => a - b);
  return { expected, noteIdsByMidi };
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
 * Builds the per-step table for a run.
 *
 * The millisecond timetable comes from `model.beatToMs`, so a tempo change
 * written into the score is honoured; `tempoPct` scales the whole thing.
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

  const steps: PreparedStep[] = model.steps.map((step) => {
    const { expected, noteIdsByMidi } = expectedFor(step, hands, transposeSemis, includeGraceNotes);
    return {
      index: step.index,
      expected,
      noteIdsByMidi,
      tMs: model.beatToMs(step.onset, tempoScale),
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
  const msPerBeat = model.beatToMs(1, tempoScale);
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
      strict: options.strict ?? ENGINE_DEFAULTS.strict,
      lookahead: options.lookahead ?? ENGINE_DEFAULTS.lookahead,
      chordWindowMs: options.chordWindowMs ?? ENGINE_DEFAULTS.chordWindowMs,
      toleranceMs: options.toleranceMs ?? ENGINE_DEFAULTS.toleranceMs,
      countInBars,
      inputLatencyMs: options.inputLatencyMs ?? ENGINE_DEFAULTS.inputLatencyMs,
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
