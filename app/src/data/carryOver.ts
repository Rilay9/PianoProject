/**
 * The learner's history from before C5, carried over once (C5).
 *
 * Until C5 a rung was complete when enough of the items it listed were marked
 * passed, wherever the passes had been judged; session rows named no rung at
 * all before 2026-09-21, then the first rung listing the item — every run
 * until T37 (2026-09-25), a run opened from no rung until C1 (2026-09-26).
 * So a learner's rungs from then cannot be re-derived from evidence: nothing
 * recorded which rung a run was for. Dropping them would put a learner who was
 * working on 2.2 back at 0.1. This carries them over **once** per device, the
 * first time C5's evidence job runs, and never again:
 *
 * - it reads the old record the way the old rule read it (the counts each rung
 *   carried at C5's start, frozen below, over the items marked passed), walks
 *   the plan in order as the old recommendation did, and keeps the rungs the
 *   old rule had done **before the rung it was recommending** — the rungs the
 *   learner had walked past. A rung beyond that point done only because a pass
 *   there credited every rung listing the item (L8: the Petzold at 3.4
 *   completing 4.4, 4.6 and 4.7) is not carried;
 * - the result is stored on the plan row (`PlanRow.carriedOver`) and shown
 *   apart as *done before*: `rungState` never makes such a rung met, and
 *   `nextRecommended` sets it aside as it sets aside the rungs behind a
 *   placement. Evidence judged by the rung later meets it the ordinary way;
 * - nothing else reads this file: `rungState`, `nextRecommended` and the
 *   screens read only the stored list (`noCompletionBesideTheEvidence` holds
 *   that), so the old rule decides nothing after the one pass.
 */
import type { Curriculum, Lesson } from '../curriculum/types';
import type { ProgressRow } from './db';

/**
 * Frozen: every rung's old counts as the curriculum wrote them when C5 began —
 * `[exercises, songs]`, and `1` third where the rung was song-optional (its
 * second pass could be another exercise). Read by `carriedOver` only.
 */
const BEFORE_C5: Readonly<Record<string, readonly number[]>> = {
  '0.1': [2, 0], '0.2': [1, 0], '0.3': [1, 0], '0.4': [1, 0], '1.1': [1, 1], '1.2': [1, 1], '1.3': [1, 1],
  '1.4': [1, 1], '1.5': [2, 0, 1], 'practice.1': [1, 0, 1], 'practice.2': [1, 0, 1], 'practice.3': [1, 0, 1],
  'practice.4': [1, 0, 1], 'practice.5': [1, 0, 1], '2.1': [1, 1], '2.2': [1, 1], '2.3': [1, 1],
  '2.4': [1, 1], '2.5': [2, 0, 1], 'holiday': [1, 1], 'hymns.2': [1, 1], '3.1': [1, 1], '3.2': [1, 1],
  '3.3': [1, 1], '3.4': [1, 1], '3.5': [1, 1], '3.6': [2, 0, 1], 'classical.3': [1, 1],
  'chords-pop.3': [1, 1], 'blues.3': [1, 1], 'theory.3': [2, 0, 1], 'improv.3': [2, 0, 1], 'hymns': [1, 1],
  'rock.overview': [1, 0], 'latin.3': [1, 1], 'holiday.3': [1, 1], 'jazz.3': [1, 1], '4.1': [1, 1],
  '4.2': [1, 1], '4.3': [1, 1], '4.4': [1, 1], '4.5': [1, 1], '4.6': [1, 2], '4.7': [0, 1],
  'classical.4': [1, 1], 'classical.4.shelf': [1, 1], 'chords-pop.4': [1, 1], 'blues.4': [1, 1],
  'jazz.4': [1, 1], 'holiday.4': [1, 1], 'theory.4': [2, 0, 1], 'improv.4': [2, 0, 1], 'jam': [1, 1],
  'technique.4': [2, 0, 1], 'rock.4': [1, 0, 1], 'hymns.4': [1, 1], 'classical.5': [1, 1],
  'chords-pop.5': [1, 1], 'blues.5': [1, 1], 'jazz.5': [1, 1], 'holiday.5': [1, 1], 'ragtime.5': [1, 1],
  'theory.5': [2, 0, 1], 'improv.5': [2, 0, 1], 'latin': [1, 1], 'technique.5': [2, 0, 1],
  'rock.5': [1, 0, 1], 'jam.5': [2, 0, 1], 'hymns.5': [1, 1], 'classical.6': [1, 1], 'ragtime.6': [1, 1],
  'technique.6': [2, 0, 1], 'jazz.6': [1, 0, 1], 'holiday.6': [1, 1], 'blues.6': [1, 0, 1],
  'chords-pop.6': [1, 0, 1], 'theory.6': [1, 0, 1], 'improv.6': [1, 0, 1], 'rock.6': [1, 1],
  'jam.6': [2, 0, 1], 'hymns.6': [1, 1], 'latin.6': [1, 1], 'classical.7': [1, 1], 'ragtime.7': [1, 1],
  'technique.7': [2, 0, 1], 'jazz.7': [1, 0, 1], 'holiday.7': [1, 1], 'blues.7': [1, 0, 1],
  'chords-pop.7': [1, 0, 1], 'theory.7': [1, 0, 1], 'improv.7': [1, 0, 1], 'rock.7': [1, 1],
  'latin.7': [1, 1], 'jam.7': [1, 1], 'classical.8': [1, 1], 'ragtime.8': [1, 1], 'technique.8': [2, 0, 1],
  'jazz.8': [1, 0, 1], 'blues.8': [1, 0, 1], 'chords-pop.8': [1, 0, 1], 'theory.8': [1, 0, 1],
  'improv.8': [1, 0, 1], 'classical.9': [1, 1], 'jazz.9': [1, 0, 1], 'blues.9': [1, 0, 1],
  'chords-pop.9': [1, 0, 1], 'theory.9': [1, 0, 1], 'improv.9': [1, 0, 1], 'ragtime.9': [1, 1],
};

function passedUnderTheOldRule(
  lesson: Lesson,
  passed: ReadonlySet<string>,
  requireTwoSongs: boolean,
): boolean {
  const counts = BEFORE_C5[lesson.id];
  if (counts === undefined) return false;
  const [exercises = 0, songs = 0, optional = 0] = counts;
  const doneExercises = lesson.exerciseOptions.filter((id) => passed.has(id)).length;
  const doneSongs = [...lesson.songOptions, ...(lesson.paperOptions ?? [])].filter((id) => passed.has(id)).length;
  const wanted = requireTwoSongs && optional !== 1 && lesson.songOptions.length >= 2 ? 2 : songs;
  if (optional === 1) return doneExercises >= exercises && doneExercises + doneSongs >= exercises + wanted;
  return doneExercises >= exercises && doneSongs >= wanted;
}

/**
 * The rungs to carry over (see the module note): those the old rule had done,
 * in plan order on the tracks switched on, before the rung it was
 * recommending. Pure.
 */
export function carriedOver(
  curriculum: Curriculum,
  rows: readonly Pick<ProgressRow, 'itemId' | 'status'>[],
  activeTracks: readonly string[],
  options: { startAt?: string; requireTwoSongs?: boolean } = {},
): string[] {
  const passed = new Set(rows.filter((row) => row.status === 'passed' || row.status === 'mastered').map((row) => row.itemId));
  if (passed.size === 0) return [];
  const tracks = new Set(activeTracks);
  const startAt = options.startAt === undefined || options.startAt === '' ? null : options.startAt;
  let reachedStart = startAt === null;
  const out: string[] = [];
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      if (tracks.size > 0 && unit.track !== 'core' && !tracks.has(unit.track)) continue;
      if (unit.id === startAt) reachedStart = true;
      for (const lesson of unit.lessons) {
        if (lesson.id === startAt) reachedStart = true;
        if (passedUnderTheOldRule(lesson, passed, options.requireTwoSongs === true)) {
          out.push(lesson.id);
          continue;
        }
        // Behind the placement, an open rung was held back, not recommended.
        if (!reachedStart) continue;
        // The rung the old rule was recommending: nothing after it is carried.
        return out;
      }
    }
  }
  return out;
}
