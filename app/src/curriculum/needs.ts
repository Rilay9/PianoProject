/**
 * What a rung is still short of, counted against the options it has *now*
 * (replan §4.2, review C3).
 *
 * `validate.py` writes a `needs` block into the built curriculum, and until now
 * the lesson page printed it verbatim. But `load.ts` overlays imported scores
 * and shelf pieces onto a lesson at runtime, and nothing recomputed the
 * shortfall — so the owner did exactly what the finder asked, added the song,
 * and the rung went on asking for it. That is the one thing a finder must not
 * do.
 *
 * The floor still comes from the build (`needs.floor`), because that is a
 * policy number and `--min-options` sets it. Only the counting happens here,
 * and it is the same three lines `write_needs` uses — deliberately, and the
 * test below names the Python function so the pair can be found together.
 */
import type { Lesson } from './types';

/** The floor `validate.py` defaults to (`00` D21: three alternatives a rung). */
export const DEFAULT_OPTION_FLOOR = 3;

export interface Shortfall {
  songs: number;
  exercises: number;
  floor: number;
}

/**
 * Counted from the lesson as the app currently holds it, overlays included.
 *
 * A song-optional rung counts both lists together, so shortness is a property
 * of the pair rather than of either one, and the shortfall is reported as
 * exercises — which is what `write_needs` does, and what the sentence on the
 * lesson page reads as ("wants one more exercise").
 *
 * An `optionsExempt` rung — the placement test, the tour — is never short: it
 * is a single thing by nature. The build skips those entirely, so they arrive
 * with no `needs` block at all.
 */
export function lessonShortfall(lesson: Lesson): Shortfall {
  const floor = lesson.needs?.floor ?? DEFAULT_OPTION_FLOOR;
  if (lesson.optionsExempt === true || !lesson.needs) return { songs: 0, exercises: 0, floor };
  const songs = lesson.songOptions.length;
  const exercises = lesson.exerciseOptions.length;
  if (lesson.songOptional === true) {
    return { songs: 0, exercises: Math.max(0, floor - (songs + exercises)), floor };
  }
  return {
    songs: Math.max(0, floor - songs),
    exercises: Math.max(0, floor - exercises),
    floor,
  };
}
