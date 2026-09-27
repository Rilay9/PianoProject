/**
 * Read-only questions about the curriculum: what a rung holds a run to, and what
 * else could I play instead? Whether a rung is met is not asked here: that is
 * `evidence/rungState`, from the evidence its requirements name (C5).
 *
 * Kept free of DOM and storage so it is testable in Node. P7 builds the screens on top.
 */
import type { MasteryCriteria } from '../engine/Scoring';
import type { CatalogItem, Curriculum, Lesson } from './types';
import { SHIPPED_SKILL_ACTIVATION, skillsInForce, type SkillActivation } from './skillActivation';

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

/**
 * The tier an alternative came from (C6; backlog L12's third reader, L36): a
 * claim of its own strength, which the swap sheet prints.
 *
 * - `lesson`: another option of the lesson the row was offered from — the
 *   curriculum says these are equivalent;
 * - `alternative`: one of the item's own `alternatives[]` — its author named it
 *   as a stand-in, which is what makes an un-imported song a pointer rather
 *   than a dead row;
 * - `skill`: an item declaring a target skill the item declares, both read through
 *   `skillActivation.ts` (D0): the reading rows as shipped, so the target skills D0
 *   writes on the generated families do not widen the tier until one is activated;
 * - `demand`: an item carrying a demand the build measured on the item.
 *
 * The third tier was "anything within half a level sharing a concept tag", and
 * `repertoire` is a tag on every quarried piece and nothing else, so for a PDMX
 * piece it was a level window over the whole quarry (the repertoire trace,
 * P1-4). A concept tag matches nothing now: an alternative is an alternative
 * because it trains the same thing.
 */
export type AlternativeTier = 'lesson' | 'alternative' | 'skill' | 'demand';

export interface TieredAlternative {
  item: CatalogItem;
  tier: AlternativeTier;
  /** The target skill or measured demand the `skill` or `demand` tier shares. */
  shared?: string;
}

/**
 * What to offer when the learner says "give me something else" (docs/04 §2),
 * each with the tier it came from, in the tiers' order. Within the skill and
 * demand tiers, the nearest level first, so a swap does not quietly raise the
 * difficulty — an order, not a window: nothing is left out for its level
 * (`session.swapOptions` leaves out what the learner's lessons have not
 * taught), and a judged level before an estimated one at the same distance
 * (replan §1.4).
 */
export function tieredAlternatives(
  query: AlternativesQuery,
  curriculum: Curriculum,
  catalog: CatalogIndex,
  /** Whose declared target skills the skill tier reads (D0; `skillActivation.ts`). */
  activation: SkillActivation = SHIPPED_SKILL_ACTIVATION,
): TieredAlternative[] {
  const { itemId, lessonId, excludeSongs = false, exclude = [], limit = 12 } = query;
  const skip = new Set<string>([itemId, ...exclude]);
  const source = catalog.byId.get(itemId);
  const out: TieredAlternative[] = [];

  const push = (id: string, tier: AlternativeTier, shared?: string): void => {
    if (skip.has(id)) return;
    const item = catalog.byId.get(id);
    if (!item) return;
    if (excludeSongs && item.type === 'song') return;
    skip.add(id);
    out.push({ item, tier, ...(shared === undefined ? {} : { shared }) });
  };

  const lesson = lessonId ? findLesson(curriculum, lessonId) : undefined;
  if (lesson) {
    for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) push(id, 'lesson');
  }

  for (const id of source?.alternatives ?? []) push(id, 'alternative');

  if (source) {
    const nearest = (a: CatalogItem, b: CatalogItem): number =>
      Math.abs(a.level - source.level) - Math.abs(b.level - source.level) || levelConfidence(b) - levelConfidence(a);
    const sharing = (own: readonly string[] | undefined, theirs: (item: CatalogItem) => readonly string[] | undefined, tier: AlternativeTier): void => {
      const mine = new Set(own ?? []);
      if (mine.size === 0) return;
      const found = [...catalog.byId.values()]
        .filter((item) => !skip.has(item.id) && (theirs(item) ?? []).some((one) => mine.has(one)))
        .sort(nearest);
      for (const item of found) push(item.id, tier, (theirs(item) ?? []).find((one) => mine.has(one)));
    };
    sharing(skillsInForce(source, activation), (item) => skillsInForce(item, activation), 'skill');
    sharing(source.demands, (item) => item.demands, 'demand');
  }

  return out.slice(0, limit);
}

/** The alternatives alone, in the tiers' order (`tieredAlternatives`): `playInstead` and the lesson page read these. */
export function alternativesFor(
  query: AlternativesQuery,
  curriculum: Curriculum,
  catalog: CatalogIndex,
  activation: SkillActivation = SHIPPED_SKILL_ACTIVATION,
): CatalogItem[] {
  return tieredAlternatives(query, curriculum, catalog, activation).map((one) => one.item);
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
