/**
 * Read-only questions about the curriculum: what a rung holds a run to, and what
 * else could I play instead? Whether a rung is met is not asked here: that is
 * `evidence/rungState`, from the evidence its requirements name (C5).
 *
 * Kept free of DOM and storage so it is testable in Node. P7 builds the screens on top.
 */
import type { MasteryCriteria } from '../engine/Scoring';
import type { CatalogItem, Curriculum, Lesson } from './types';
import { SHIPPED_SKILL_ACTIVATION, type SkillActivation } from './skillActivation';
import { eligible, eligibleFor, targetDemandsFor, targetSkillsFor, type Learner } from './eligibility';

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
 * - `skill`: an item that declares, as its target, a skill the row targets, and
 *   whose measured notes provide that skill's opportunity at a useful density —
 *   or, for the reading rows the activation acts on (D0), declares it;
 * - `demand`: an item whose measured notes provide, at a useful density, the demand
 *   the row is on its rung to practise — what that rung teaches (`taughtAt`), which
 *   the row itself provides — never a demand both merely contain, and never the
 *   steps every tune has.
 *
 * Every tier goes through the one gate (E0, `eligibility.ts`): nothing is offered
 * that the learner cannot cope with, nothing unmeasured is offered as equivalent
 * practice, and the same lesson's options and the named stand-ins are no
 * exception (Part 23: provenance, never immunity). C6 tested overlap by set
 * intersection and ranked by level; with every piece measured that would offer
 * anything sharing a step, so the gate is what turns the two lower tiers on.
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
 * each with the tier it came from, in the tiers' order, every candidate through
 * the one gate (`eligibility.eligibleFor`, E0). Within the skill and demand
 * tiers, the nearest level first, so a swap does not quietly raise the
 * difficulty — an order among eligible candidates, never a window and never a
 * rescue: a level-close candidate the learner cannot cope with is refused, a
 * level-far one that is clean is offered (Part 23). A judged level before an
 * estimated one at the same distance (replan §1.4).
 *
 * `learner` is what the gate judges the first question by: the rung judging the
 * swap (what it has taught) and, where the caller has them, the learner's skill
 * states. With none, the skill and demand tiers offer nothing — "with the other
 * demands you have met" cannot be said of a learner nobody described — and the
 * lesson's options and the named stand-ins keep the authored list's word, still
 * never unmeasured and never a declared large-hand voicing.
 */
export function tieredAlternatives(
  query: AlternativesQuery,
  curriculum: Curriculum,
  catalog: CatalogIndex,
  /** Whose declared target skills the skill tier acts on without a measured opportunity (D0; `skillActivation.ts`). */
  activation: SkillActivation = SHIPPED_SKILL_ACTIVATION,
  learner: Learner = {},
): TieredAlternative[] {
  const { itemId, lessonId, excludeSongs = false, exclude = [], limit = 12 } = query;
  const skip = new Set<string>([itemId, ...exclude]);
  const source = catalog.byId.get(itemId);
  const out: TieredAlternative[] = [];

  const push = (item: CatalogItem, tier: AlternativeTier, shared?: string): void => {
    skip.add(item.id);
    out.push({ item, tier, ...(shared === undefined ? {} : { shared }) });
  };
  /** An authored equivalent (the lesson's options, a named stand-in): through the gate like anything else. */
  const equivalent = (id: string, tier: AlternativeTier): void => {
    if (skip.has(id)) return;
    const item = catalog.byId.get(id);
    if (!item || (excludeSongs && item.type === 'song')) return;
    if (!eligible(eligibleFor(item, learner, { for: 'equivalent' }))) return;
    push(item, tier);
  };

  const lesson = lessonId ? findLesson(curriculum, lessonId) : undefined;
  if (lesson) {
    for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) equivalent(id, 'lesson');
  }

  for (const id of source?.alternatives ?? []) equivalent(id, 'alternative');

  if (source) {
    const nearest = (a: CatalogItem, b: CatalogItem): number =>
      Math.abs(a.level - source.level) - Math.abs(b.level - source.level) || levelConfidence(b) - levelConfidence(a);
    /**
     * Every candidate the gate passes for one of `wanted`, each with the first it passes for:
     * the row's primary skill (or its first demand) before the others, then the nearest level.
     */
    const practice = (wanted: readonly string[], ask: (one: string) => Parameters<typeof eligibleFor>[2], tier: AlternativeTier): void => {
      if (wanted.length === 0) return;
      const found: { item: CatalogItem; shared: string }[] = [];
      for (const item of catalog.byId.values()) {
        if (skip.has(item.id) || (excludeSongs && item.type === 'song')) continue;
        const shared = wanted.find((one) => eligible(eligibleFor(item, learner, ask(one))));
        if (shared !== undefined) found.push({ item, shared });
      }
      found.sort((a, b) => wanted.indexOf(a.shared) - wanted.indexOf(b.shared) || nearest(a.item, b.item));
      for (const { item, shared } of found) push(item, tier, shared);
    };
    practice(targetSkillsFor(source, activation), (skill) => ({ for: 'skill', skill, activation }), 'skill');
    // The demand the row's rung teaches: the rung it was offered from, or the first listing it.
    const rungId = lessonId ?? proseRungFor(curriculum, itemId)?.id;
    practice(targetDemandsFor(source, rungId, activation), (demand) => ({ for: 'demand', demand }), 'demand');
  }

  return out.slice(0, limit);
}

/** The alternatives alone, in the tiers' order (`tieredAlternatives`): `playInstead` and the lesson page read these. */
export function alternativesFor(
  query: AlternativesQuery,
  curriculum: Curriculum,
  catalog: CatalogIndex,
  activation: SkillActivation = SHIPPED_SKILL_ACTIVATION,
  learner: Learner = {},
): CatalogItem[] {
  return tieredAlternatives(query, curriculum, catalog, activation, learner).map((one) => one.item);
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
