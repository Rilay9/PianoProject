/**
 * How long a card stays up after it is answered, and what is shown on it.
 *
 * A flash card is about recall speed, so a right answer flashes and goes: a
 * long pause after a right answer teaches waiting. A *wrong* answer is the
 * opposite case and was being treated the same way — the keys lit for the same
 * few hundred milliseconds and the next card arrived, so the one moment in the
 * drill where the learner had something to learn from went past faster than
 * they could look at it. For the kinds whose answer is a set of keys there is
 * something to look at: the keys they played in red, the ones they should have
 * played lit, and the answer on a staff. Those get a pause long enough to read
 * — and a tap anywhere on the card ends it, so the learner who has already
 * seen it is never made to wait.
 *
 * The rule is here rather than in the screen because it is a decision, not a
 * drawing: given a kind and whether the answer was right, how long, and is
 * there an answer worth drawing. The screen does the drawing.
 */
import type { DrillKind } from './types';

/** A beat to see that it was right, then the next card. */
export const FEEDBACK_MS = 450;

/**
 * How long a miss keeps its card, when there is an answer to show on it.
 *
 * Long enough to look from the red keys to the lit ones and back at the staff,
 * short enough that a learner who already knows what went wrong is not held —
 * and they are not, because a tap ends it.
 */
export const MISS_PAUSE_MS = 2_000;

/**
 * Kinds whose answer is a set of keys worth showing or playing.
 *
 * The ear kinds are left out on purpose — their answer *is* the sound, and
 * `Play again` already repeats it. The kinds with a flow of their own (rhythm,
 * pedal, dynamics, the backing track, dictation, transposition) are left out
 * because they have no single set of keys to light.
 */
export const REVEALABLE_KINDS: ReadonlySet<DrillKind> = new Set<DrillKind>([
  'mode',
  'chord-scale',
  'chord',
  'inversion',
  'extended-chord',
  'roman-numeral',
  'note-flash',
  'find-key',
]);

/** Is there an answer to draw on this card, now that it has been missed? */
export function showsAnswerAfter(kind: DrillKind, correct: boolean): boolean {
  return !correct && REVEALABLE_KINDS.has(kind);
}

/** How long this answer's feedback stays up before the next card. */
export function feedbackDelayMs(kind: DrillKind, correct: boolean): number {
  return showsAnswerAfter(kind, correct) ? MISS_PAUSE_MS : FEEDBACK_MS;
}
