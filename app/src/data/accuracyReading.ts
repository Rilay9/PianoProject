/**
 * What a run's stored accuracy says, read one way by every reader (U102; the review of U96,
 * `responses/c48857ca.md`: *record truth must follow*).
 *
 * Three answers:
 *
 * - **measured**, with the accuracy — a share of answers, 0 included: a set answered all wrong, or ten cards
 *   skipped (a skip is an answer the drill marks wrong, `PromptDrill.next`), is an observed failure;
 * - **nothing answered** — a set of a kind that judges, in which the learner answered nothing: *End drill*
 *   before the first answer, *Count this set* after it, or a set closed card by card with nothing played. It
 *   measured nothing, which is what its sheet says (U96) and what Progress prints (*Not measured*);
 * - **not judged** — a kind that judges nothing (a backing track, and the orientation kinds, whose writers
 *   store `not measured`), or any accuracy stored as `not measured` without an answered count saying why.
 *
 * **A stored row or a run about to be stored**: both carry `mode`, `accuracy`, `wrongNotes` and, since U102,
 * `answered` on every judged drill row (`RunResult`, `SessionRow`). The readers: Progress's history line
 * (`historyDetail`), the rung state (`rungState.measured`, so `meetsStandard` reads no zero that measured
 * nothing), and the drill's coaching history (`DrillScreen.showCoaching`). The live verdict, before any row
 * exists, is `setMeasured`, which the session's outcome reads (`drillOutcomeOf`).
 *
 * **Rows stored before U102 carry no `answered`** and are never rewritten (the store is the one thing here
 * that cannot be regenerated; `db.ts` keeps upgrades from rewriting rows). They are read by the reviewer's
 * compatibility order (`responses/questions-bbd7f99a.md`), in this function and nowhere else:
 *
 * 1. a row with `answered` is authoritative;
 * 2. an older field that records attempts or answers directly — none: a judged drill row before U102 carried
 *    `accuracy`, `wrongNotes` and `missed` (`total − answered`, with `total` not stored), and `notesHeard`
 *    only where nothing was judged;
 * 3. a kind whose rows provably tell zero answers apart — **note-flash** alone, proved at every version that
 *    could have written such a row (Entry 162, `docs/prompts/runs/U102/ENTRY.md`, each step bounded by
 *    `git log -S`): the one drill writer stored `wrongNotes = max(0, answered − correct)` and
 *    `missed = max(0, total − answered)`, and a note-flash result was only ever `PromptDrill`'s, where
 *    `accuracy = correct / answered` (0 with nothing answered) and there is at most one answer a card. So
 *    accuracy 0 beside wrong notes 0 happens only with nothing answered — exactly `missed === total`;
 * 4. any other kind's old 0 % stays a measured 0 %, legacy ambiguity: an absence of wrong notes is no proof of
 *    an absence of answers there (the reviewer's words), and nothing here manufactures *not measured*.
 *
 * A backing track's row is *not judged* whatever its accuracy says, as the history has read it since C1: the
 * model's accuracy is the constant 0 at every version of `BackingTrackDrill.result` (Entry 162), never a
 * measurement.
 *
 * Here, in the data layer, so the screens and the rung state import it and it imports no screen; the list of
 * kinds that judge nothing lives here for the same reason and `DrillScreen` reads it back.
 */
import { NOT_MEASURED, type NotMeasured } from '../engine/types';

/**
 * Drill kinds whose run measures nothing a check could read (T41; G62, X1): a backing track judges nothing,
 * and the orientation kinds — a checklist the learner ticks, the guided tour, the placement test — measure no
 * playing. One list for the verdict (`drillOutcome`), for the rung page's *Quick check*, which promises a
 * measured test (`measuresARun`), and for the reading below.
 */
export const UNJUDGED_DRILL_KINDS: ReadonlySet<string> = new Set(['backing-track', 'checklist', 'walkthrough', 'placement']);

export type AccuracyReading =
  | { kind: 'measured'; accuracy: number }
  | { kind: 'nothing answered' }
  | { kind: 'not judged' };

/** What the reading reads: a stored row (`SessionRow`) or a run about to be stored (`RunResult`). */
export interface ReadableRun {
  mode: string;
  accuracy: number | NotMeasured;
  wrongNotes: number | NotMeasured;
  /** The judged drill set's own answered count (U102); absent on every other row and on older drill rows. */
  answered?: number;
}

const NOTHING_ANSWERED: AccuracyReading = { kind: 'nothing answered' };
const NOT_JUDGED: AccuracyReading = { kind: 'not judged' };

/** The drill kind of a `drill:<kind>` mode, or `undefined` for a run that is not a drill's. */
function drillKindOf(mode: string): string | undefined {
  return mode.startsWith('drill:') ? mode.slice('drill:'.length) : undefined;
}

/**
 * Whether a set measured anything, from the verdict's own facts before a row exists: a kind that judges
 * (`drillOutcome`'s `judged`), with at least one answer in the kind's unit — cards; taps on a rhythm set;
 * attempts on a Simon set (U96a).
 */
export function setMeasured(set: { judged: boolean; answered: number }): boolean {
  return set.judged && set.answered !== 0;
}

/** The one reading of a run's accuracy (see the module note for the order a row without `answered` is read by). */
export function accuracyReading(run: ReadableRun): AccuracyReading {
  const kind = drillKindOf(run.mode);
  const judges = kind !== undefined && !UNJUDGED_DRILL_KINDS.has(kind);
  // 1. The row's own count, where a judged drill set wrote it.
  if (judges && run.answered !== undefined) {
    if (run.answered === 0) return NOTHING_ANSWERED;
    return typeof run.accuracy === 'number' ? { kind: 'measured', accuracy: run.accuracy } : NOT_JUDGED;
  }
  if (run.accuracy === NOT_MEASURED || kind === 'backing-track') return NOT_JUDGED;
  // 2. No older field records answers directly. 3. note-flash's invariant, proved at every writer.
  if (kind === 'note-flash' && run.accuracy === 0 && run.wrongNotes === 0) return NOTHING_ANSWERED;
  // 4. The stored number, legacy ambiguity included.
  return { kind: 'measured', accuracy: run.accuracy };
}
