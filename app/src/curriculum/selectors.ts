/**
 * Read-only questions about the curriculum: is this lesson finished, and what else
 * could I play instead?
 *
 * Kept free of DOM and storage so it is testable in Node. P7 builds the screens on top.
 */
import type { CatalogItem, Curriculum, Lesson, PassRecord } from './types';

export interface CatalogIndex {
  byId: Map<string, CatalogItem>;
}

export function indexCatalog(items: CatalogItem[]): CatalogIndex {
  return { byId: new Map(items.map((item) => [item.id, item])) };
}

function passedIds(records: PassRecord[]): Set<string> {
  return new Set(records.filter((record) => record.passed).map((record) => record.itemId));
}

/**
 * `passedIds` and the self-pass set below are both loop-invariant over
 * `records` — everything `lessonComplete` needs from them depends only on
 * which records exist, never on the lesson being checked. `nextRecommended`
 * calls `lessonComplete` once per lesson across all of them (93 and
 * growing), and Plan's `draw()` reaches that path several times a redraw and
 * on every stage expand and track reorder; at a few hundred progress rows
 * that was rebuilding two Sets from scratch roughly 250,000 times over.
 *
 * Cached by the `records` array's own identity rather than threading a cache
 * through every call site: every caller in the app builds a fresh `records`
 * array once per load and then passes that same reference to `lessonComplete`
 * for each lesson it checks, so a `WeakMap` keyed on it gives the hoist
 * `nextRecommended` wants without changing `lessonComplete`'s signature for
 * any of its callers, and lets the entry be collected the moment nothing
 * still holds that array.
 *
 * **The invariant this rests on: a `records` array is never mutated in place.**
 * Every caller builds one with `.map()` over the progress rows and throws it
 * away when the rows change — checked across `PlanScreen`, `TodayScreen`,
 * `SkillsScreen` and `prerequisites`, none of which push, splice, sort or
 * assign into one. A caller that appended to an existing array instead would
 * get a stale answer here, and the symptom would be a rung that stayed
 * incomplete after it was passed: silent, and nowhere near this file.
 * `selectorsCacheInvariant.test.ts` fails if that ever starts happening.
 */
const recordSetsCache = new WeakMap<PassRecord[], { passed: Set<string>; selfPassed: Set<string> }>();

function recordSets(records: PassRecord[]): { passed: Set<string>; selfPassed: Set<string> } {
  const cached = recordSetsCache.get(records);
  if (cached) return cached;
  const computed = {
    passed: passedIds(records),
    selfPassed: new Set(
      records.filter((record) => record.passed && record.selfPassed).map((record) => record.itemId),
    ),
  };
  recordSetsCache.set(records, computed);
  return computed;
}

/**
 * docs/02 Part G, as amended by docs/00 D21.
 *
 * A lesson completes on `exercisesRequired` exercises plus `songsRequired` songs — except
 * that a `songOptional` lesson has no song that tests its skill, so its second pass may be
 * another exercise. Forcing a song there was making the rule lie: unit 3.6 is about
 * accompaniment patterns and no song in the library tests one.
 */
/**
 * Does this rung's mastery rule demand a number the app has to measure?
 *
 * A paper piece can finish a repertoire rung: the owner played it, the app
 * could not see it, and his word is the only evidence there was ever going to
 * be. It cannot finish a rung whose rule is `dynamics-contrast>=1.6` or
 * `20-keys-in-40s>=0.95`, because those are claims about a measurement, and
 * accepting a self-report for them would be recording a number nobody took.
 *
 * The test is deliberately syntactic — a comparison against a number — rather
 * than a list of rung ids. A list would go stale the first time a rung was
 * added; this reads the rule the rung actually states.
 */
export function demandsMeasuredAccuracy(lesson: Lesson): boolean {
  const custom = lesson.mastery.custom;
  return custom !== undefined && /[<>]=?\s*\d/.test(custom);
}

/** True when a self-assessed pass on paper may count towards this rung (replan §5.2). */
export function paperPassAllowed(lesson: Lesson): boolean {
  return !demandsMeasuredAccuracy(lesson);
}

export function lessonComplete(
  lesson: Lesson,
  records: PassRecord[],
  options: { requireTwoSongs?: boolean } = {},
): boolean {
  // A registered book piece counts as one of the rung's songs, on the same
  // terms as anything else — except that a *self-assessed* pass on paper is
  // refused where the rung's rule demands a measurement (replan §5.2).
  const { passed, selfPassed } = recordSets(records);
  const exercises = lesson.exerciseOptions.filter((id) => passed.has(id)).length;
  const paper = (lesson.paperOptions ?? []).filter(
    (id) => passed.has(id) && (paperPassAllowed(lesson) || !selfPassed.has(id)),
  ).length;
  const songs = lesson.songOptions.filter((id) => passed.has(id)).length + paper;
  const { exercisesRequired } = lesson.mastery;
  // docs/04 §7 "require 2 songs per lesson [off]": the stricter rule for
  // anyone who wants it. It cannot apply to a lesson with no song that tests
  // its skill — that is what `songOptional` means.
  const songsRequired =
    options.requireTwoSongs && !lesson.songOptional && lesson.songOptions.length >= 2
      ? 2
      : lesson.mastery.songsRequired;

  if (lesson.songOptional) {
    // Any mix, as long as there are enough passes in total and the exercise floor is met.
    return exercises >= exercisesRequired && exercises + songs >= exercisesRequired + songsRequired;
  }
  return exercises >= exercisesRequired && songs >= songsRequired;
}

/**
 * The items to mark passed when the learner says "I already know this" or
 * "mark this done" (docs/04 §3).
 *
 * It has to satisfy `lessonComplete`, or the lesson stays open after the
 * learner has just told the app it is finished — which is the bug that makes
 * an honour-system button feel broken. So it follows the same rule the check
 * does: `exercisesRequired` exercises plus `songsRequired` songs, except that
 * a `songOptional` lesson takes exercises for both (`00` D21).
 */
export function idsToCompleteLesson(
  lesson: Lesson,
  options: { requireTwoSongs?: boolean } = {},
): string[] {
  const { exercisesRequired } = lesson.mastery;
  const songsRequired =
    options.requireTwoSongs && !lesson.songOptional && lesson.songOptions.length >= 2
      ? 2
      : lesson.mastery.songsRequired;
  if (lesson.songOptional) {
    return lesson.exerciseOptions.slice(0, exercisesRequired + songsRequired);
  }
  return [
    ...lesson.exerciseOptions.slice(0, exercisesRequired),
    ...lesson.songOptions.slice(0, songsRequired),
  ];
}

export interface AlternativesQuery {
  /** The item the learner wants to replace. */
  itemId: string;
  /** The lesson it was offered from, if any — its other options come first. */
  lessonId?: string;
  /** Exclude songs: the "not a song" filter on the swap sheet (docs/04 §2). */
  excludeSongs?: boolean;
  /** Items already in today's session, so a swap does not offer a duplicate. */
  exclude?: string[];
  limit?: number;
}

/**
 * What to offer when the learner says "give me something else" (docs/04 §2).
 *
 * Three tiers, in order, because they are three different strengths of claim:
 *   1. the other options in the same lesson — the curriculum says these are equivalent;
 *   2. the item's own `alternatives[]` — an author said these train the same thing, and
 *      it is what makes an un-imported song a pointer rather than a dead row;
 *   3. anything at the same level sharing a concept tag — a guess, but a useful one.
 * Ordered by how close the level is, so a swap does not quietly raise the difficulty.
 */
/**
 * 1 for a judged level, 0 for an estimated one (replan §1.4).
 *
 * An item with no `levelSource` at all — an import, or a catalog built before
 * P11 — counts as judged, because the alternative is to demote every older
 * item below every newer one for a reason that has nothing to do with the
 * music.
 */
export function levelConfidence(item: CatalogItem): number {
  return item.levelSource === 'estimated' ? 0 : 1;
}

export function alternativesFor(
  query: AlternativesQuery,
  curriculum: Curriculum,
  catalog: CatalogIndex,
): CatalogItem[] {
  const { itemId, lessonId, excludeSongs = false, exclude = [], limit = 12 } = query;
  const skip = new Set<string>([itemId, ...exclude]);
  const source = catalog.byId.get(itemId);
  const out: CatalogItem[] = [];

  const push = (id: string): void => {
    if (skip.has(id)) return;
    const item = catalog.byId.get(id);
    if (!item) return;
    if (excludeSongs && item.type === 'song') return;
    skip.add(id);
    out.push(item);
  };

  const lesson = lessonId ? findLesson(curriculum, lessonId) : undefined;
  if (lesson) {
    for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) push(id);
  }

  for (const id of source?.alternatives ?? []) push(id);

  if (source) {
    const concepts = new Set(source.concepts);
    const nearby = [...catalog.byId.values()]
      .filter(
        (item) =>
          !skip.has(item.id) &&
          Math.abs(item.level - source.level) <= 0.5 &&
          item.concepts.some((concept) => concepts.has(concept)),
      )
      .sort((a, b) => {
        const byDistance =
          Math.abs(a.level - source.level) - Math.abs(b.level - source.level);
        if (byDistance !== 0) return byDistance;
        // replan §1.4: at the same distance, prefer a level someone judged over
        // one a band or a model estimated. Two pieces that claim to be equally
        // close are not equally likely to be — one of the claims is a guess.
        return levelConfidence(b) - levelConfidence(a);
      });
    for (const item of nearby) push(item.id);
  }

  return out.slice(0, limit);
}

export function findLesson(curriculum: Curriculum, lessonId: string): Lesson | undefined {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        if (lesson.id === lessonId) return lesson;
      }
    }
  }
  return undefined;
}

/**
 * Lessons that fall below the three-alternatives rule, for the Diagnostics screen
 * (docs/04 §7b). `validate.py` fails the build on these, so in a shipped build the list
 * is empty — it is here so a hand-edited curriculum on the device is visible too.
 */
export function thinLessons(curriculum: Curriculum, minOptions = 3): Lesson[] {
  const thin: Lesson[] = [];
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        if (lesson.optionsExempt) continue;
        const total = lesson.exerciseOptions.length + lesson.songOptions.length;
        const enough = lesson.songOptional
          ? lesson.exerciseOptions.length >= minOptions && total >= minOptions
          : lesson.exerciseOptions.length >= minOptions &&
            (lesson.mastery.songsRequired === 0 || lesson.songOptions.length >= minOptions);
        if (!enough) thin.push(lesson);
      }
    }
  }
  return thin;
}
