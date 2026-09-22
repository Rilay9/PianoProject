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
  | 'ear-tune'
  // A chain that grows by a note each round until the learner breaks it. Every
  // other ear kind asks for a name out of a small set; this one asks the
  // learner to have held what they heard, which is what playing by ear is.
  | 'simon';

/**
 * When a drill kind draws a staff (docs/04 §5c, 2026-09-16).
 *
 * The owner, on a harmonic-dictation card: *"These kinds of drills can also use
 * a staff. Any time you're showing note progressions or chord progressions in
 * these drills, it's useful to show it on the staff so I can correlate the
 * notes on the staff with the chord progressions — know what chords look like.
 * It's very hard to read chords."*
 *
 * A staff is worth having everywhere, and *when* it may be drawn is not the
 * same question on every kind, because on some of them the staff is the answer.
 * So the question is answered once, per kind, in one table below, and the
 * screen only obeys it.
 *
 * - `never` — the card already draws the notes (note flash draws one on its own
 *   staff, transposition prints four bars, Simon fills a staff as the chain
 *   sounds), or there are no pitches to draw (rhythm, dynamics). A second staff
 *   saying the same thing is the one thing `00` §1 forbids outright.
 * - `on-reveal` — the staff *is* the answer and the answer is one key, so it is
 *   worth what it costs and no more: behind *Show me*, forfeiting that prompt's
 *   mark, and drawn again on a miss when the card is held.
 * - `after-answer` — the staff must not be drawn before the answer, because it
 *   would *be* the answer: an ear drill with its notes printed under it is a
 *   reading drill, and a chord card with its notes printed under it cannot be
 *   got wrong. So it is drawn the moment the answer is judged — right or wrong,
 *   forfeiting nothing — and the card is then held so there is time to read it.
 *   Every card, not only the ones the learner pays for: *"know what chords look
 *   like"* is a thing to be shown each time, and a staff behind a button is a
 *   staff nobody sees on the cards they got right (the owner's ruling,
 *   2026-09-16). Where the kind also offers *Show me* the earlier picture is
 *   still available at the usual price, which is what that button has always
 *   been for.
 * - `always` — the card names a chord it does not draw, and what is judged is
 *   not the notes: the pedal drill's card says *"Chord 1"* and scores the lift,
 *   the backing track scores nothing at all. Drawn from the card's first frame.
 */
export type StaffPolicy = 'never' | 'on-reveal' | 'after-answer' | 'always';

/**
 * Every kind's answer to "when is a staff drawn".
 *
 * Exhaustive by type: adding a `DrillKind` without a row here does not compile,
 * which is the point of the table — the alternative is a default, and a default
 * is how a new ear kind quietly starts printing its answer over the question.
 */
export const STAFF_POLICY: Readonly<Record<DrillKind, StaffPolicy>> = {
  // The card is a staff already.
  'note-flash': 'never',
  transposition: 'never',
  simon: 'never',
  // Nothing with a pitch in it to draw.
  rhythm: 'never',
  dynamics: 'never',
  // The answer is one key and the card is its name: a staff for it is worth
  // what Show me costs and no more.
  'find-key': 'on-reveal',
  // A scale: seven or eight notes in order, drawn behind Show me and on a miss
  // as they have been since 2026-09-15. The chord kinds below moved on from
  // this and these two did not, because the ruling that moved them was about
  // chords — see the note under the table.
  mode: 'on-reveal',
  'chord-scale': 'on-reveal',
  // Not before the answer, because the staff would be the answer; every card
  // once it is judged, because that is what "know what chords look like" needs.
  // The four chord-reading kinds: play it from the symbol, then see it.
  chord: 'after-answer',
  inversion: 'after-answer',
  'extended-chord': 'after-answer',
  'roman-numeral': 'after-answer',
  // And the kinds that were heard rather than seen, for the same reason said
  // the other way round.
  'ear-interval': 'after-answer',
  'ear-chord': 'after-answer',
  'ear-progression': 'after-answer',
  'ear-tune': 'after-answer',
  'harmonic-dictation': 'after-answer',
  'call-response': 'after-answer',
  // Named but not drawn, and not what is being judged.
  pedal: 'always',
  'backing-track': 'always',
};

/**
 * When this kind may draw a staff.
 *
 * `mode` and `chord-scale` are the two rows worth arguing about. The ruling of
 * 2026-09-16 moved the four chord-reading kinds to `after-answer` and named
 * chords; the same reasoning reads across to a scale, and moving those two is
 * one word each if the owner wants it. They are left where they were rather
 * than extended to on an argument nobody made.
 */
export function staffPolicy(kind: DrillKind): StaffPolicy {
  return STAFF_POLICY[kind];
}

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
  /**
   * `label` names the notes, so the card must not print it until the attempt
   * has been judged (`04` §5c, built 2026-09-21).
   *
   * The melodic-dictation drill built its label out of the note names of the
   * phrase it was about to play — `C4 E4 G4 E4` in letters across the card,
   * before a key had been pressed — which turns an ear drill into a reading
   * drill and makes the prompt impossible to get wrong. The three `ear-*`
   * kinds draw a glyph instead for exactly this reason; the flag is how a
   * kind that is *sometimes* an ear card says which of its prompts is one,
   * because `call-response` is also what a five-finger pattern is built as
   * and `C · 1 of 4` gives nothing away.
   *
   * The label is still the prompt's name everywhere it is read after the
   * answer — the staff's title, the going-over — so nothing is lost by
   * withholding it from the card.
   */
  labelIsAnswer?: boolean;
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
  /**
   * The learner asked to see or hear the answer before playing it. The
   * answer is still judged — the keys go green when it is right — but it is
   * not counted as right, or a drill could be passed by pressing Show me
   * ten times.
   */
  revealed?: boolean;
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

/**
 * Is there a set here to write to the practice history?
 *
 * A drill whose very first `next()` is null — an empty Simon pool, a prompt
 * list a builder produced nothing for — never showed a card, and the screen
 * still ended it the way a completed set ends and recorded `accuracy: 0,
 * passed: false` against the item. That is a failure at something nobody was
 * asked to do, in the one store that cannot be regenerated, and it is the same
 * mistake `08` §16 calls *a stop is not a finish* wearing different clothes.
 * `total` is the number of prompts the drill was built with, so nought means
 * the set never existed rather than that it went badly.
 *
 * `answered` is the other half. A backing track has no prompts at all — its
 * `total` is nought by design (`special.ts`) and what it counts is the notes
 * played over the loop — so on `total` alone every jam would have been the
 * set that never existed. Something was drilled if there were cards, or if
 * anything was played.
 */
export function worthRecording(result: DrillResult): boolean {
  return result.total > 0 || result.answered > 0;
}

export interface Drill {
  readonly kind: DrillKind;
  /**
   * What to do, in a sentence, when the kind alone does not say it.
   *
   * A five-finger walk and an accompaniment pattern are both built as
   * `call-response` drills, and `call-response` says only "Play it back" —
   * true, and useless when the thing to play back is a hand position rather
   * than a phrase. The builder that knows which it is says so here.
   */
  readonly promptText?: string;
  /** The next prompt, or null when the drill is finished. */
  next(): DrillPrompt | null;
  /** The prompt currently awaiting an answer, if any. */
  readonly current: DrillPrompt | null;
  feed(input: EngineInput): void;
  /**
   * The learner was shown or played the current answer. Kinds that judge a
   * played answer forfeit the mark for that prompt; kinds with nothing to
   * reveal leave this out.
   */
  reveal?(): void;
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
