/**
 * What the Score screen's chrome shows in each moment (U122c; `docs/design/score-bar-layout.md` §10.2).
 *
 * Information earns screen space from the learner's current task, not because it exists in the Score
 * model (the owner's direction, `docs/review/responses/911f8c82-correction-1.md`). The moments are
 * the ones the screen already has, read from the run as it is — no state of its own:
 *
 * - **the hands are on the keys** while a run is going and not paused: the count-in, holding for the
 *   first note, playing, and a demonstration (`Hear it`). The controls fold to one direct control in
 *   its own place: ⏸ (▶'s button), or `Stop` (`Hear it`'s) during a demonstration, the button that
 *   stops a thing being the one that started it (T31 principle 5). A demonstration started from the
 *   `⋯` sheet, whose `Hear it` is not on the row, folds nothing: there would be no direct stop;
 * - **paused, refused, at rest, finished**: nothing folds. A pause used to fold three seconds after
 *   ⏸, because the fold asked whether a run existed, and a paused run does (walk finding 5);
 * - **a peek**: a tap on the music while folded shows every control for a few seconds, then the
 *   moment's rule comes back (`08` §9.34: one tap always brings them back).
 *
 * Pure, so the mapping is tested without a page (`tests/unit/scoreChrome.test.ts`). Where each device
 * draws what this decides is the stylesheet's (`style.css`, the Score screen's U122c rules).
 */

/** What the screen knows about the moment, from the run and the sheet. */
export interface MomentFacts {
  /** A run is going (`session.running`), paused or not. */
  readonly running: boolean;
  /** The run is paused (`session.paused`). */
  readonly paused: boolean;
  /** The run going is a demonstration (`Hear it`). */
  readonly hearing: boolean;
  /** `Hear it` is on the row, not behind `⋯`. */
  readonly hearOnRow: boolean;
  /** The summary sheet is up. */
  readonly finished: boolean;
  /** A tap asked to see the controls, and its few seconds are not over. */
  readonly peeking: boolean;
}

/** The chrome the moment shows. */
export interface ChromePlan {
  /** The hands are on the keys: the moment the notation needs the room. */
  readonly handsOnKeys: boolean;
  /** The controls are folded to their direct control. */
  readonly folded: boolean;
  /** The one control drawn while folded, by id; `null` when nothing is folded. */
  readonly direct: 'score-play' | 'score-hear' | null;
}

export function chromeFor(facts: MomentFacts): ChromePlan {
  const handsOnKeys = facts.running && !facts.paused && !facts.finished;
  if (!handsOnKeys || facts.peeking) return { handsOnKeys, folded: false, direct: null };
  if (facts.hearing) {
    return facts.hearOnRow
      ? { handsOnKeys, folded: true, direct: 'score-hear' }
      : { handsOnKeys, folded: false, direct: null };
  }
  return { handsOnKeys, folded: true, direct: 'score-play' };
}
