/**
 * Read-only questions about the curriculum: what a rung holds a run to, and what
 * else could I play instead? Whether a rung is met is not asked here: that is
 * `evidence/rungState`, from the evidence its requirements name (C5).
 *
 * Kept free of DOM and storage so it is testable in Node. P7 builds the screens on top.
 */
import type { MasteryCriteria } from '../engine/Scoring';
import type { CatalogItem, Curriculum, Lesson } from './types';

export interface CatalogIndex {
  byId: Map<string, CatalogItem>;
}

/**
 * The rung whose lesson text the Score screen shows beside a piece opened from
 * nowhere: the first rung listing it, **as reading and nothing else** (C5).
 *
 * It used to be the lookup that judged as well: a run opened from no
 * rung was held to the first rung listing its item and recorded against it,
 * and a drill still was until C5 — which is how a pass came to count for a
 * rung that never asked for it (L7, L8). A run is judged only by the rung that
 * opened the screen now, or by none (C1; the drill route carries its rung,
 * C5), and a rung is met only through `evidence/rungState`. This is the prose
 * beside the piece, without its pass paragraph (`sidePanelProse`), and a test
 * holds it to that one caller (`noCompletionBesideTheEvidence.test.ts`).
 *
 * Library pieces, imports and paper have no rung and get `undefined`.
 */
export function proseRungFor(curriculum: Curriculum, itemId: string): Lesson | undefined {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        if (lesson.songOptions.includes(itemId) || lesson.exerciseOptions.includes(itemId)) {
          return lesson;
        }
      }
    }
  }
  return undefined;
}

/**
 * `minTempoPct` as a percentage, whichever way the rung wrote it.
 *
 * The curriculum writes `0.85` and the scorer writes `85`: the field is named
 * for a percentage and every rung in `content/curriculum/` holds a fraction
 * (measured 2026-09-21 — the ninety-eight rungs' values are 0, 0.7, 0.75,
 * 0.8, 0.85 and 0.9, nothing above 1). Multiplying blind would be right today
 * and silently wrong the first time somebody wrote `85` meaning it; so a
 * value at or below 1 is read as the fraction it plainly is, and anything
 * above 1 is taken as already being the percentage it is named for.
 */
function asPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value <= 1 ? value * 100 : value;
}

/**
 * What this rung demands of a run (`02` Part G, built 2026-09-21).
 *
 * Every rung has carried `mastery.minAccuracy` and `mastery.minTempoPct`
 * since the curriculum was written and nothing read either: every run in the
 * app passed at one pair of numbers from Settings, while five rungs asked for
 * 95 %, one for 97 %, and thirty-three asked for a tempo other than 80 %.
 * Lessons on those rungs quote the rung's number, so the lesson and the app
 * disagreed about the one thing a learner would check.
 *
 * The rule, in one sentence: **a run judged for a rung uses that rung's
 * numbers; a run with no rung uses the defaults.** The defaults are the
 * learner's own pair from Settings, so that pair still governs every run the
 * curriculum says nothing about — a Library piece, an import, a piece on
 * paper — and a rung that states `0` (Stage 0's checklist, the tour, the
 * improvisation rungs that are judged by a recording and not by notes) is
 * saying "I have no number of my own", so it takes the default too rather
 * than passing everything at nought.
 *
 * `master` is deliberately *not* per-rung. Part G defines mastery once, for
 * the whole plan — 97 % at full tempo, twice on different days — and no rung
 * carries a second pair of numbers for it. Inventing one from the pass
 * numbers would be making up a rule nobody wrote.
 */
export function masteryCriteriaFor(
  lesson: Lesson | undefined,
  defaults: MasteryCriteria,
): MasteryCriteria {
  if (!lesson) return defaults;
  const accuracy = lesson.mastery.minAccuracy;
  const tempoPct = asPercent(lesson.mastery.minTempoPct);
  return {
    ...defaults,
    passAccuracy: Number.isFinite(accuracy) && accuracy > 0 ? accuracy : defaults.passAccuracy,
    passTempoPct: tempoPct > 0 ? tempoPct : defaults.passTempoPct,
  };
}

export function indexCatalog(items: CatalogItem[]): CatalogIndex {
  return { byId: new Map(items.map((item) => [item.id, item])) };
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
 * Whether a rung's requirements ask for a run of one of its songs (C5): what
 * the old count of required songs said, read from the requirement that replaced it.
 */
export function asksForSongs(lesson: Lesson): boolean {
  return (lesson.requirements ?? []).some((requirement) => requirement.kind === 'runs' && requirement.from === 'songs');
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
            (!asksForSongs(lesson) || lesson.songOptions.length >= minOptions);
        if (!enough) thin.push(lesson);
      }
    }
  }
  return thin;
}
