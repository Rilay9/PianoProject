/**
 * Strict prerequisites — opt-in gating (docs/04 §7, `00` D17, examination §4.4).
 *
 * D17 is the governing decision: **no gating by default.** The owner reads
 * basic notation, plays some chords, and plateaued once already; an app that
 * told him he was not allowed to look at Stage 4 would be repeating the thing
 * that stopped him. So this is off unless he turns it on.
 *
 * When it is on, the look is deliberately the softer of the two the
 * examination offered:
 *
 * - a **badge** on the lesson and a **one-line reason** naming the rung that
 *   would unlock it;
 * - option cards that still open, behind a **confirmation**;
 * - **never a disabled card.**
 *
 * A disabled card is a dead end: it tells the learner no and gives him nothing
 * to do about it, and the one thing this curriculum promises is that moving on
 * or going back is always one tap (D17). A confirmation says the same thing —
 * "this probably needs the earlier rung first" — while leaving the decision
 * where it belongs. "I already know this" on the prerequisite is the other
 * escape, and it is the one the owner will actually use, because he arrived
 * knowing some of this already.
 */
import type { Curriculum, Lesson } from './types';
import type { RungStates } from '../evidence/rungState';

export interface LockState {
  locked: boolean;
  /** The prerequisite rungs not met by the evidence (nor set aside by the learner's word), in curriculum order. */
  missing: Lesson[];
  /** One line naming what would unlock it, or `''` when it is not locked. */
  reason: string;
}

const OPEN: LockState = { locked: false, missing: [], reason: '' };

/** Every lesson in the curriculum, by id. */
export function lessonsById(curriculum: Curriculum): Map<string, Lesson> {
  const out = new Map<string, Lesson>();
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) out.set(lesson.id, lesson);
    }
  }
  return out;
}

/**
 * Is this lesson locked, and what would unlock it?
 *
 * `strict: false` is always `OPEN` — the check is not merely skipped, it
 * returns the same shape, so a caller cannot accidentally treat "gating off"
 * as "locked with no reason".
 *
 * A prerequisite naming a lesson that does not exist is ignored rather than
 * treated as unmet: a typo in the curriculum should not make a rung
 * permanently unreachable, and `validate.py` is where that gets caught.
 */
export function lockState(
  lesson: Lesson,
  curriculum: Curriculum,
  states: RungStates,
  options: { strict?: boolean } = {},
): LockState {
  if (!options.strict) return OPEN;
  const ids = lesson.prerequisites ?? [];
  if (ids.length === 0) return OPEN;

  const byId = lessonsById(curriculum);
  const missing: Lesson[] = [];
  for (const id of ids) {
    const required = byId.get(id);
    if (!required) continue;
    // Met by the evidence its requirements name (C5), or set aside by the
    // learner's word ("I already know this" on the prerequisite, which this
    // file's note calls the escape he will actually use) or carried over from
    // before C5: each unlocks, and none of them is a count of passed items.
    const state = states.byRung.get(id);
    const behind = state !== undefined && (state.status === 'met' || state.word !== undefined || state.carried);
    if (!behind) missing.push(required);
  }
  if (missing.length === 0) return OPEN;

  // The rung's name, not its id (T26, `00` §1): `2.1 Hands together` spent
  // the line's first word on an internal key the learner has no use for.
  const names = missing.map((entry) => entry.title);
  const reason =
    names.length === 1
      ? `Usually comes after ${names[0] ?? ''}.`
      : `Usually comes after ${names.slice(0, -1).join(', ')} and ${names[names.length - 1] ?? ''}.`;
  return { locked: true, missing, reason };
}

/**
 * The sentence on the confirmation, when he opens something anyway.
 *
 * It says what the app thinks and then gets out of the way. No "are you sure"
 * — he is sure, he tapped it — and no warning tone: skipping ahead is a
 * legitimate thing to do and half the point of D17.
 */
export function confirmMessage(state: LockState): string {
  const first = state.missing[0];
  const which = first ? first.title : 'an earlier rung';
  return `${which} usually comes first. Open this anyway?`;
}
