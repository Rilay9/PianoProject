// The drill framework.
//
// docs/05-score-follow-engine.md §7. A drill is not a score: there is no
// cursor and no ScoreModel, just a series of prompts and the learner's
// answers. They share the engine's input pipeline and its injected clock, and
// nothing here touches the DOM — the UI arrives in P8.
//
// Every drill is the same three calls:
//   next()   — the prompt to show, or null when the drill is over
//   feed()   — one input event
//   result() — how it went, at any point
//
// Reaction time is measured from when the prompt was issued, so a drill that
// is never answered simply has no reaction sample rather than a huge one.

import type { EngineInput } from '../types';

export type DrillKind =
  | 'note-flash'
  | 'find-key'
  | 'chord'
  | 'inversion'
  | 'ear-interval'
  | 'ear-chord'
  | 'ear-progression'
  | 'rhythm'
  | 'pedal'
  | 'dynamics'
  | 'call-response'
  | 'backing-track'
  // P12b. The harmony and ear kinds `02` Parts D2-D4 describe and `05` §7 left
  // for later, now that the tracks that need them run past Stage 5.
  | 'mode'
  | 'chord-scale'
  | 'extended-chord'
  | 'harmonic-dictation'
  | 'transposition'
  | 'roman-numeral'
  | 'ear-tune';

/** What the UI has to show for one question. */
export interface DrillPrompt {
  index: number;
  /** Text the learner reads, e.g. "F/A" or "E♭4". */
  label: string;
  /**
   * Pitches to play to the learner before they answer, if any. Ear drills use
   * this; sighted drills leave it empty.
   */
  playback?: { midi: number[]; /** Milliseconds after the prompt. */ atMs: number }[];
  /** Pitches that count as a correct answer. */
  expected: number[];
  /** True when the answer is a sequence rather than a set. */
  ordered?: boolean;
  /** Staff hint for note-flash: which clef the note was drawn on. */
  staff?: 1 | 2;
  /**
   * A second line of text under the label — the key to transpose into, the
   * chord a scale has to fit, the bar number of an ear-tune phrase.
   */
  hint?: string;
  /**
   * Notation to show instead of a label, as MusicXML. The transposition drill
   * prints four bars and asks for them in another key, so the prompt *is* a
   * score; the screen renders this when it is set.
   */
  musicXml?: string;
}

export interface DrillAnswer {
  promptIndex: number;
  correct: boolean;
  /** Milliseconds from the prompt to the answer being complete. */
  reactionMs: number | null;
  played: number[];
}

export interface DrillResult {
  kind: DrillKind;
  total: number;
  answered: number;
  correct: number;
  /** 0..1 over the prompts answered so far. */
  accuracy: number;
  meanReactionMs: number;
  answers: DrillAnswer[];
  /** Kind-specific extras — clean pedal changes, dynamic ratio, and so on. */
  detail?: Record<string, number>;
}

export interface Drill {
  readonly kind: DrillKind;
  /** The next prompt, or null when the drill is finished. */
  next(): DrillPrompt | null;
  /** The prompt currently awaiting an answer, if any. */
  readonly current: DrillPrompt | null;
  feed(input: EngineInput): void;
  result(): DrillResult;
}

/** Options every drill accepts. */
export interface DrillOptionsBase {
  /** How many prompts. */
  count?: number;
  /** Any 32-bit integer; the same seed gives the same drill. */
  seed?: number;
  /**
   * Accept an answer in any octave. On by default for chord and ear drills —
   * the point is the shape, not the register (docs/05 §7).
   */
  anyOctave?: boolean;
}

export const DRILL_DEFAULTS = { count: 10, anyOctave: true } as const;

/** Pitch class 0..11, so octave-equivalent answers can be compared. */
export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Compares two pitch sets, optionally ignoring octaves. */
export function sameSet(a: readonly number[], b: readonly number[], anyOctave: boolean): boolean {
  const normalise = (values: readonly number[]) =>
    [...new Set(values.map((v) => (anyOctave ? pitchClass(v) : v)))].sort((x, y) => x - y);
  const left = normalise(a);
  const right = normalise(b);
  return left.length === right.length && left.every((v, i) => v === right[i]);
}

/** Compares two pitch sequences in order, optionally ignoring octaves. */
export function sameSequence(
  a: readonly number[],
  b: readonly number[],
  anyOctave: boolean,
): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => (anyOctave ? pitchClass(v) === pitchClass(b[i] ?? -1) : v === b[i]));
}

export const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

export function noteLabel(midi: number): string {
  return `${NOTE_NAMES[pitchClass(midi)] ?? 'C'}${Math.floor(midi / 12) - 1}`;
}
