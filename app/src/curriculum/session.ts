/**
 * Building today's practice session (docs/02 Part A §8, docs/04 §2).
 *
 * Pure functions over the catalog, the curriculum and the progress rows: no
 * DOM, no storage, no clock beyond the one passed in. That is what makes the
 * hard part testable — "what should I practise today" is a judgement, and a
 * judgement nobody can inspect is a judgement nobody can fix.
 *
 * The shape of a session is fixed by the templates below; what varies is what
 * goes in each slot, and every slot can be swapped (docs/04 §2, `00` D21).
 */
import type { CatalogItem, Curriculum, Lesson, PassRecord, Unit } from './types';
import {
  alternativesFor,
  findLesson,
  lessonComplete,
  levelConfidence,
  type CatalogIndex,
} from './selectors';
import { lockState } from './prerequisites';
import type { ReadingMoves, ReadingRecipe, SessionRow } from '../data/db';
import { dayKey } from '../data/progressStore';
import { heldToRung, READING_CONTROLS, UNREALISABLE_AT, type ControlPatch } from '../engine/readingControls';
import {
  dailySeed,
  generateSightReading,
  sightReadingOptionsFor,
  unrealisable,
  type SightReadingOptions,
  type TimeSig,
} from '../engine/sightReading';
import { demandReadings, type DemandReading } from '../evidence/demandReadings';
import type { MeasuredEvidence } from '../evidence/evidence';
import { RECENT_ATTEMPTS, SUPPORT_SHARE, supports } from '../evidence/ladder';
import { readingState, storedEvidence, type SkillState } from '../evidence/readingState';
import { VOCABULARY_V0, type Vocabulary } from '../evidence/vocabulary';
import { readingReason, READING_TEXT } from '../ui/help';

export type SlotKind = 'technique' | 'review' | 'new' | 'repertoire' | 'jam' | 'free' | 'sightreading';

export interface SessionSlot {
  kind: SlotKind;
  /** Minutes this slot is worth, from the template. */
  minutes: number;
  /** The item to play, absent for the free-play prompt. */
  item?: CatalogItem;
  /** The lesson the item was offered from, so "Swap this" can look there first. */
  lessonId?: string;
  /** Why it is here, shown under the title. */
  reason: string;
  /**
   * The reading slot's phrase (C4): the row's recipe, its seed and why, from
   * the learner's reads. Today opens exactly this phrase; a swap replaces the
   * item and the recipe stops applying.
   */
  reading?: ReadingOffer;
}

export interface SessionTemplate {
  minutes: 15 | 30 | 60 | 120;
  slots: { kind: SlotKind; minutes: number }[];
  /** docs/02 §8: the two-hour session is two halves with a break between. */
  breakAfterSlot?: number;
}

/** docs/02 Part A §8, verbatim. */
export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    minutes: 15,
    slots: [
      { kind: 'technique', minutes: 4 },
      { kind: 'review', minutes: 4 },
      { kind: 'new', minutes: 7 },
    ],
  },
  {
    minutes: 30,
    // P12b (`02` Part A §8): a three-minute sight-reading slot, its minutes
    // taken from free play. Free play was two minutes, so the third comes from
    // repertoire — the doc asks for three and offers two, and one minute of
    // repertoire is the smaller loss. Sight-reading only works on music you
    // have not seen, and a slot that appears once a week is not a habit.
    slots: [
      { kind: 'technique', minutes: 5 },
      { kind: 'review', minutes: 5 },
      { kind: 'new', minutes: 10 },
      { kind: 'repertoire', minutes: 7 },
      { kind: 'sightreading', minutes: 3 },
    ],
  },
  {
    minutes: 60,
    slots: [
      { kind: 'technique', minutes: 8 },
      { kind: 'review', minutes: 8 },
      { kind: 'new', minutes: 20 },
      { kind: 'repertoire', minutes: 9 },
      { kind: 'sightreading', minutes: 3 },
      { kind: 'jam', minutes: 8 },
      { kind: 'free', minutes: 4 },
    ],
  },
  {
    minutes: 120,
    slots: [
      { kind: 'technique', minutes: 8 },
      { kind: 'review', minutes: 8 },
      { kind: 'new', minutes: 20 },
      { kind: 'repertoire', minutes: 12 },
      { kind: 'jam', minutes: 8 },
      { kind: 'free', minutes: 4 },
      // Second half, repertoire-heavy (docs/02 §8).
      { kind: 'repertoire', minutes: 25 },
      { kind: 'jam', minutes: 15 },
      { kind: 'sightreading', minutes: 20 },
    ],
    breakAfterSlot: 6,
  },
];

export function templateFor(minutes: number): SessionTemplate {
  return (
    SESSION_TEMPLATES.find((template) => template.minutes === minutes) ??
    (SESSION_TEMPLATES[1] as SessionTemplate)
  );
}

export interface BuildInput {
  curriculum: Curriculum;
  catalog: CatalogIndex;
  /** Every item, for the fallbacks — the index's map in list form. */
  items: CatalogItem[];
  records: PassRecord[];
  /** Item ids due for review, most overdue first (progressStore.reviewQueue). */
  dueForReview: string[];
  /** Items whose status is `mastered`, for the Repertoire slot. */
  mastered: string[];
  /** Tracks the learner has switched on, in their order (planStore). */
  activeTracks: string[];
  minutes: number;
  /** Rotates the choice within a slot so "Shuffle" gives something different. */
  seed?: number;
  /** docs/04 §7 "require 2 songs per lesson"; changes what counts as complete. */
  requireTwoSongs?: boolean;
  /** docs/04 §7: opt-in gating, off by default (`00` D17). */
  strictPrerequisites?: boolean;
  /**
   * The placement test's answer, so the day starts where the learner said
   * they were (`02` Stage 0.4; `planStore`'s `placement.unitId`).
   */
  startAt?: string;
  /**
   * The learner's stored runs of the reading rows (C4), for the reading slot:
   * the reader chooses its phrase from the evidence on them. None is a learner
   * who has not read, who gets the rung's own row.
   */
  readingRows?: readonly SessionRow[];
  /**
   * The day the card is for (C4): the reading slot's phrase is the day's.
   * A caller that does not say gets the epoch's, so the builder stays free of
   * a clock; Today says.
   */
  today?: Date;
}

export interface LessonPosition {
  lesson: Lesson;
  unit: Unit;
  stageNumber: number;
}

/**
 * Walks stages in order and returns the first lesson that is not complete.
 *
 * `startAt` is the placement test's answer (`02` Stage 0.4, built 2026-09-21).
 * It was written into the plan by `recordPlacement` and read by **nothing**:
 * the drill and the lesson page both said *"Placement recorded. Today will
 * build from here"* and then the plan carried on recommending `0.1`, which is
 * the one sentence in the app a learner can check in a single tap.
 *
 * Rungs behind the placement are not marked passed — the learner said where
 * to start, not what they have done — so they are **held back rather than
 * discarded**: if everything from the placement onwards is complete, the first
 * incomplete rung behind it is recommended after all. An empty plan would be a
 * worse answer than an early rung, and it is the same reasoning `firstLocked`
 * below already uses for a rung behind a prerequisite.
 *
 * Matched against the unit id *or* the lesson id, because the two writers
 * disagree and both are right about their own screen: the placement drill
 * names a unit (`failUnit`, `passUnit`), and the lesson page's *Start here*
 * names the rung the reader is looking at.
 */
export function nextRecommended(
  curriculum: Curriculum,
  records: PassRecord[],
  activeTracks: string[] = [],
  options: {
    requireTwoSongs?: boolean;
    strictPrerequisites?: boolean;
    /** The placed unit or rung: nothing before it is recommended first. */
    startAt?: string;
  } = {},
): LessonPosition | undefined {
  const tracks = new Set(activeTracks);
  let firstLocked: LessonPosition | undefined;
  const startAt = options.startAt === undefined || options.startAt === '' ? null : options.startAt;
  let reachedStart = startAt === null;
  let firstBehind: LessonPosition | undefined;
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      // A track the learner has switched off is skipped, but the core track
      // is never optional — it is the spine the stages are built on.
      if (tracks.size > 0 && unit.track !== 'core' && !tracks.has(unit.track)) continue;
      if (unit.id === startAt) reachedStart = true;
      for (const lesson of unit.lessons) {
        if (lesson.id === startAt) reachedStart = true;
        if (lessonComplete(lesson, records, options)) continue;
        const position = { lesson, unit, stageNumber: stage.number };
        if (!reachedStart) {
          firstBehind ??= position;
          continue;
        }
        if (options.strictPrerequisites) {
          // With gating on, "recommended" means the first rung he can start.
          // A locked one is remembered rather than discarded: if *everything*
          // left is locked — which happens when a prerequisite is a rung he
          // has skipped past — recommending nothing would leave Today empty,
          // and an empty Today is worse than a rung with a badge on it.
          const state = lockState(lesson, curriculum, records, {
            strict: true,
            ...(options.requireTwoSongs === undefined
              ? {}
              : { requireTwoSongs: options.requireTwoSongs }),
          });
          if (state.locked) {
            firstLocked ??= position;
            continue;
          }
        }
        return position;
      }
    }
  }
  // Nothing from the placement onwards, so the rungs behind it come back.
  return firstLocked ?? firstBehind;
}

/**
 * An item with no file and no drill is an import placeholder: a pointer to
 * something the learner has to bring, not something to practise today
 * (docs/04 §2 offers its alternatives instead).
 */
export function playable(item: CatalogItem | undefined | null): boolean {
  return Boolean(item && (item.file || item.imported || item.drill));
}

/** The playable items behind a list of ids, in order, skipping what is taken. */
function resolve(
  ids: readonly string[],
  catalog: CatalogIndex,
  free: (id: string) => boolean,
): CatalogItem[] {
  const out: CatalogItem[] = [];
  for (const id of ids) {
    const item = catalog.byId.get(id);
    if (item && playable(item) && free(item.id)) out.push(item);
  }
  return out;
}

function pick<T>(candidates: T[], seed: number): T | undefined {
  if (candidates.length === 0) return undefined;
  return candidates[seed % candidates.length];
}

/**
 * Fills one slot.
 *
 * Each kind has its own idea of what belongs, and each falls back rather than
 * leaving a hole: an empty row on Today is a session the learner has to
 * assemble by hand, which is the thing this screen exists to avoid.
 */
function fillSlot(
  kind: SlotKind,
  input: BuildInput,
  position: LessonPosition | undefined,
  used: Set<string>,
  seed: number,
): { item?: CatalogItem; reason: string; lessonId?: string; reading?: ReadingOffer } {
  const { catalog, items, mastered, dueForReview } = input;
  const level = position ? position.stageNumber : 1;
  const free = (id: string): boolean => !used.has(id);

  if (kind === 'technique') {
    const fromLesson = resolve(position?.lesson.exerciseOptions ?? [], catalog, free);
    const chosen =
      pick(fromLesson, seed) ??
      pick(
        items.filter(
          (item) =>
            free(item.id) &&
            playable(item) &&
            item.type !== 'song' &&
            item.tracks.includes('technique') &&
            Math.abs(item.level - level) <= 1,
        ),
        seed,
      );
    return {
      ...(chosen ? { item: chosen } : {}),
      ...(position ? { lessonId: position.lesson.id } : {}),
      reason: 'Warm-up in the keys you are working in',
    };
  }

  if (kind === 'review') {
    const due = resolve(dueForReview, catalog, free);
    const chosen =
      due[0] ??
      pick(resolve(mastered, catalog, free), seed) ??
      // Nothing due and nothing mastered is what the first week looks like.
      // Playing something at this level a second time is still review.
      pick(
        // One level above the stage, not two: a Stage 6 learner was handed the
        // all-seven-modes drill from Stage 7 to "keep warm" (owner, 2026-09-15).
        items.filter(
          (item) => free(item.id) && playable(item) && item.type !== 'song' && item.level <= level + 1,
        ),
        seed,
      );
    return {
      ...(chosen ? { item: chosen } : {}),
      reason: due.length > 0 ? 'Due for review today' : 'Nothing due — keeping something warm',
    };
  }

  if (kind === 'new') {
    const options = resolve(
      [...(position?.lesson.exerciseOptions ?? []), ...(position?.lesson.songOptions ?? [])],
      catalog,
      free,
    );
    // The current lesson can run out — Stage 0 units have two options and the
    // warm-up slot has already taken one. Anything at this level is a better
    // row than an empty one.
    const chosen =
      pick(options, seed) ??
      pick(
        items.filter(
          (item) => free(item.id) && playable(item) && Math.abs(item.level - level) <= 1,
        ),
        seed,
      );
    return {
      ...(chosen ? { item: chosen } : {}),
      ...(position ? { lessonId: position.lesson.id } : {}),
      reason: position ? `Lesson ${position.lesson.id} — ${position.lesson.title}` : 'New material',
    };
  }

  if (kind === 'repertoire') {
    const chosen =
      pick(resolve(mastered, catalog, free), seed) ??
      pick(
        items.filter(
          (item) =>
            free(item.id) && playable(item) && item.type === 'song' && item.level < level + 2,
        ),
        seed,
      );
    return {
      ...(chosen ? { item: chosen } : {}),
      reason: mastered.length > 0 ? 'A piece you know — keep it playable' : 'Something to just play',
    };
  }

  if (kind === 'jam') {
    const chosen = pick(
      items.filter(
        (item) =>
          free(item.id) &&
          playable(item) &&
          (item.tracks.includes('chords-pop') ||
            item.tracks.includes('blues-boogie') ||
            item.tracks.includes('jazz')) &&
          item.level <= level + 1,
      ),
      seed,
    );
    return { ...(chosen ? { item: chosen } : {}), reason: 'Chords, form and feel' };
  }

  if (kind === 'sightreading') {
    // The reader's phrase (C4), where it used to be any reading row at or
    // below the stage by catalog order — level 3 every day at Stages 5-9 and
    // level 1 at Stage 4 (the sight-reading trace, P1-a) — plus the rung's own
    // (T37). Now the rung's own row, moved by what the learner's reads show;
    // the same rule as the daily read, with a phrase of its own. Before any
    // rung that lists a reading row there is no slot, as there was none; a
    // row another slot already took is not offered twice.
    const today = input.today ?? new Date(0);
    const offer = readingOffer({
      curriculum: input.curriculum,
      items,
      position,
      activeTracks: input.activeTracks,
      rows: input.readingRows ?? [],
      today,
      purpose: 'slot',
      shuffle: seed,
    });
    if (!offer || !offer.anchored || !free(offer.item.id) || !playable(offer.item)) {
      return { reason: READING_TEXT.rungSlot };
    }
    return {
      item: offer.item,
      ...(offer.lessonId === undefined ? {} : { lessonId: offer.lessonId }),
      reason: readingReason(offer.why, 'slot', today),
      reading: offer,
    };
  }

  return { reason: 'Play anything you like — no scoring, no cursor' };
}

/**
 * Today's session card (docs/04 §2).
 *
 * Slots are filled in template order and no item is used twice, so a short
 * session never turns into the same scale five times.
 */
export function buildSession(input: BuildInput): { template: SessionTemplate; slots: SessionSlot[] } {
  const template = templateFor(input.minutes);
  const position = nextRecommended(input.curriculum, input.records, input.activeTracks, {
    ...(input.requireTwoSongs === undefined ? {} : { requireTwoSongs: input.requireTwoSongs }),
    ...(input.strictPrerequisites ? { strictPrerequisites: true } : {}),
    ...(input.startAt === undefined ? {} : { startAt: input.startAt }),
  });
  const used = new Set<string>();
  const seed = input.seed ?? 0;

  const slots: SessionSlot[] = [];
  let breakAfter = template.breakAfterSlot;
  template.slots.forEach((slot, slotIndex) => {
    const filled = fillSlot(slot.kind, input, position, used, seed + slotIndex);
    // A row with nothing in it is worse than no row: it is a hole the learner
    // has to fill by hand, which is the thing this card exists to avoid. Free
    // play is the exception — it never has an item and is a prompt, not a
    // piece.
    if (!filled.item && slot.kind !== 'free') {
      if (breakAfter !== undefined && slotIndex < breakAfter) breakAfter -= 1;
      return;
    }
    if (filled.item) used.add(filled.item.id);
    slots.push({
      kind: slot.kind,
      minutes: slot.minutes,
      ...(filled.item ? { item: filled.item } : {}),
      ...(filled.lessonId ? { lessonId: filled.lessonId } : {}),
      reason: filled.reason,
      ...(filled.reading ? { reading: filled.reading } : {}),
    });
  });
  return {
    template: breakAfter === template.breakAfterSlot ? template : { ...template, ...(breakAfter === undefined ? {} : { breakAfterSlot: breakAfter }) },
    slots,
  };
}

/**
 * What "Swap this" offers for one row (docs/04 §2).
 *
 * Wraps `alternativesFor` with the two things a *session* row knows that a
 * lesson does not: what is already in today's card (so a swap never offers a
 * duplicate), and whether the row is a slot where a song makes sense at all.
 */
export function swapOptions(
  slot: SessionSlot,
  slots: SessionSlot[],
  curriculum: Curriculum,
  catalog: CatalogIndex,
  options: { excludeSongs?: boolean; items?: CatalogItem[] } = {},
): CatalogItem[] {
  if (!slot.item) return [];
  const source = slot.item;
  const excludeSongs = options.excludeSongs ?? slot.kind === 'technique';
  const exclude = slots.map((other) => other.item?.id).filter((id): id is string => Boolean(id));
  const tiered = alternativesFor(
    {
      itemId: source.id,
      ...(slot.lessonId ? { lessonId: slot.lessonId } : {}),
      excludeSongs,
      exclude,
    },
    curriculum,
    catalog,
  ).filter((candidate) => playable(candidate));
  if (tiered.length > 0) return tiered;

  // A swap sheet that offers nothing is a dead button, and at Stage 0 the
  // three tiers can genuinely come up empty: a handful of drills, few shared
  // concept tags. So the last resort is the loosest useful claim — anything
  // of the same kind at about the same level.
  const skip = new Set([source.id, ...exclude]);
  return (options.items ?? [...catalog.byId.values()])
    .filter(
      (item) =>
        !skip.has(item.id) &&
        playable(item) &&
        item.type === source.type &&
        !(excludeSongs && item.type === 'song') &&
        Math.abs(item.level - source.level) <= 1,
    )
    .sort((a, b) => {
      const byDistance = Math.abs(a.level - source.level) - Math.abs(b.level - source.level);
      if (byDistance !== 0) return byDistance;
      // replan §1.4: a judged level beats an estimated one at equal distance.
      return levelConfidence(b) - levelConfidence(a);
    })
    .slice(0, 12);
}

/**
 * "Play this instead" for an item that is not bundled (docs/04 §2).
 *
 * A rock-module song you have not imported is not a dead row: its
 * `alternatives[]` name the public-domain vehicle that trains the same thing.
 */
export function playInstead(
  item: CatalogItem,
  curriculum: Curriculum,
  catalog: CatalogIndex,
): CatalogItem | undefined {
  if (playable(item)) return undefined;
  const id = item.id;
  return alternativesFor({ itemId: id }, curriculum, catalog).find((candidate) => playable(candidate));
}

export { findLesson, lessonComplete };

// --- the reader (C4, C4c): the next sight-reading phrase, from the reads -------

/**
 * The reader's policy (C4c; the reviewer's fourth message §8): the numbers it
 * decides by, in one object, so a later wave can make them depend on the
 * learner's state without touching the reader's logic (`ReadingInput.policy`).
 * Every one is **policy and a hypothesis**, not a measurement.
 */
export interface ReaderPolicy {
  /**
   * After this many reads that were not easy, the next is one below the recipe
   * on purpose (S13): one read in four. The brief asked for "every few
   * sessions"; three is C4's starting number, never measured against a learner.
   */
  easyAfter: number;
  /** Reads against the working recipe in a row before the reader steps down: the ladder's `RECENT_ATTEMPTS`. */
  stepDownAfter: number;
  /**
   * Days of full-standard support at the working recipe, the latest
   * full-standard read supporting, before the reader steps up: the ladder's
   * proficiency (two days), restarted after `stepDownAfter` reads against.
   */
  stepUpAfter: number;
  /**
   * Phrases in the demand-reading window a demand must have held in, and held
   * over the window, before a step up counts it shown and passes over it — the
   * ladder's two days, borrowed for a demand.
   */
  demandShownAfter: number;
}

export const READER_POLICY: Readonly<ReaderPolicy> = {
  easyAfter: 3,
  stepDownAfter: RECENT_ATTEMPTS,
  stepUpAfter: RECENT_ATTEMPTS,
  demandShownAfter: 2,
};

/** The skill the reader moves by: right notes in time on every step (C3), with its evidence per demand (C4a). */
const READER_SKILL = 'sight-reading';

/**
 * Every generator option the control map moves (`readingControls.ts`), in one
 * order: a recipe's `moved` is written in it, and `recipeDistance` counts in it.
 */
export const RECIPE_KEYS = [
  'hands',
  'position',
  'ledger',
  'skips',
  'leaps',
  'eighths',
  'sixteenths',
  'dottedQuarters',
  'ties',
  'syncopation',
  'triplets',
  'timeSig',
  'fifths',
  'accidentals',
  'leftHand',
] as const satisfies readonly (keyof ReadingMoves)[];
type RecipeKey = (typeof RECIPE_KEYS)[number];

/**
 * "Shorter than a quarter" is every eighth again (C4a): it patterns with the
 * eighths because it is the same notes, and one control moves both. The reader
 * names and moves it as the eighths.
 */
const SAME_NOTES: Readonly<Record<string, string>> = { 'rhythm.shorter-than-quarter': 'rhythm.eighths' };

/** The rows' own spelling of what a recipe leaves alone: a row that says nothing plays the right hand, in C, in 4/4. */
function ownValue(item: CatalogItem, key: RecipeKey): unknown {
  const value = item.drill?.params?.[key];
  if (key === 'hands') return value === 'left' || value === 'both' ? value : 'right';
  if (key === 'fifths') return value ?? 0;
  if (key === 'timeSig') return value ?? '4/4';
  return value;
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

function normaliseMoves(moved: ReadingMoves | undefined): ReadingMoves {
  const out: Record<string, unknown> = {};
  if (!moved) return out;
  for (const key of RECIPE_KEYS) {
    const value = moved[key];
    if (value === undefined) continue;
    out[key] = Array.isArray(value) ? [...(value as readonly number[])] : value;
  }
  return out;
}

/** A control's patch (generator options) in a recipe's spelling (the rows' `drill.params`). */
function patchToMoves(patch: ControlPatch): ReadingMoves {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || !(RECIPE_KEYS as readonly string[]).includes(key)) continue;
    if (key === 'hands') out.hands = value === 'L' ? 'left' : value === 'both' ? 'both' : 'right';
    else if (key === 'timeSig') {
      if (!Array.isArray(value)) out.timeSig = `${String((value as TimeSig).beats)}/${String((value as TimeSig).beatType)}`;
    } else out[key] = value;
  }
  return normaliseMoves(out);
}

/** The recipe's moves with a patch over them; a value that is the row's own is dropped, so undoing a move returns to the row. */
function withMoves(item: CatalogItem, moved: ReadingMoves, patch: ReadingMoves): ReadingMoves {
  const next: Record<string, unknown> = { ...moved };
  for (const key of RECIPE_KEYS) {
    const value = patch[key];
    if (value === undefined) continue;
    if (same(value, ownValue(item, key))) delete next[key];
    else next[key] = value;
  }
  return normaliseMoves(next);
}

function recipe(row: string, moved: ReadingMoves, easy = false): ReadingRecipe {
  const clean = normaliseMoves(moved);
  return { row, ...(Object.keys(clean).length > 0 ? { moved: clean } : {}), ...(easy ? { easy: true as const } : {}) };
}

/** A recipe's identity: its row and what it moved (the easy flag is why it was chosen, not what it is). */
function recipeKey(value: ReadingRecipe): string {
  return `${value.row}|${JSON.stringify(normaliseMoves(value.moved))}`;
}

function lessonOrder(curriculum: Curriculum): string[] {
  return curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
}

/**
 * What a rung has taught: a demand whose `taughtAt` rung comes at or before it
 * in the curriculum's order. `undefined` for no rung (a phrase opened from
 * nowhere is the row as it stands) or one the curriculum does not have.
 */
export function taughtAtRung(
  curriculum: Curriculum,
  rung: string | undefined,
  vocabulary: Vocabulary = VOCABULARY_V0,
): ((demand: string) => boolean) | undefined {
  if (rung === undefined) return undefined;
  const order = lessonOrder(curriculum);
  const here = order.indexOf(rung);
  if (here < 0) return undefined;
  return (demand) => {
    const at = vocabulary.demands.find((d) => d.id === demand)?.taughtAt;
    if (at === null || at === undefined) return false;
    const index = order.indexOf(at);
    return index >= 0 && index <= here;
  };
}

/**
 * The generator options a row and a recipe write: the row's own params with the
 * recipe's moves over them, and — given what the rung that opened the phrase
 * has taught — held to it (C4b's `heldToRung`, C4c): every demand the rung has
 * not taught that a phrase of these options may contain is kept out. The
 * recipe's own moves stand over the hold: the reader asked for them, at the
 * learner's rung, which can be later than the rung whose row it is (a 2.4
 * learner reads 2.2's row and is asked for ties). The one writer of a phrase
 * for Today, the rung page, the Score screen and the tests.
 */
export function readingOptions(
  item: CatalogItem,
  value?: { row?: string; moved?: ReadingMoves; easy?: true },
  seed?: number,
  taught?: (demand: string) => boolean,
): SightReadingOptions {
  const moved = normaliseMoves(value?.moved);
  const merged = sightReadingOptionsFor({ ...(item.drill?.params ?? {}), ...moved }, seed);
  if (!taught) return merged;
  const held: Record<string, unknown> = { ...heldToRung(merged, taught) };
  const asked = merged as unknown as Record<string, unknown>;
  for (const key of Object.keys(moved)) {
    if (asked[key] === undefined) delete held[key];
    else held[key] = asked[key];
  }
  return held as unknown as SightReadingOptions;
}

/**
 * How many things the reader moves two recipes of one row differ in: the
 * recipe keys whose value (the recipe's, else the row's own) is not the same.
 * Different rows are not comparable this way (`Infinity`): that is the rung's
 * row changing, which the curriculum decides, not the reads.
 */
export function recipeDistance(a: ReadingRecipe, b: ReadingRecipe, items: readonly CatalogItem[]): number {
  if (a.row !== b.row) return Number.POSITIVE_INFINITY;
  const item = items.find((one) => one.id === a.row);
  if (!item) return Number.POSITIVE_INFINITY;
  const left = normaliseMoves(a.moved) as Record<string, unknown>;
  const right = normaliseMoves(b.moved) as Record<string, unknown>;
  return RECIPE_KEYS.filter((key) => !same(left[key] ?? ownValue(item, key), right[key] ?? ownValue(item, key))).length;
}

/**
 * One move of the recipe: a demand the control map can write or keep out
 * (`readingControls.ts`), turned on or off, and nothing else.
 */
export interface ReadingMove {
  /** The vocabulary demand the move is about. */
  demand: string;
  /** Written into the phrase (`on`) or kept out of it (`off`). */
  direction: 'on' | 'off';
  /** The recipe after the move. */
  recipe: ReadingRecipe;
  /** What the control changed, in the recipe's spelling. */
  patch: ReadingMoves;
  /** Other demands the move may bring into a phrase that had none of them (the control's `brings`). */
  brings: readonly string[];
  /** The key the offered phrase is written in, where the move is the key signature's: named, never ranked. */
  key?: number;
}

/** The last read's sight-reading measurement, as a reason line may cite it. */
export interface ReadMeasure {
  at: string;
  right: number;
  n: number;
}

/** A demand the reads single out (C4a's `pattern` or `isolated`), with the numbers a reason line may cite. */
export interface DemandFinding {
  demand: string;
  selectivity: 'pattern' | 'isolated';
  /** Phrases in the window that had the demand, and those where its share fell below the support share. */
  phrases: number;
  phrasesBelow: number;
  n: number;
  right: number;
}

/**
 * Why the reader offered this phrase, in the terms a reason line may use:
 * only what the stored evidence says, or nothing beyond the rung.
 */
export type ReadingWhy =
  /** No evidence chose it: the rung's own row. */
  | { kind: 'rung' }
  /** Today's phrase is on the record already: read, or heard before it was read. */
  | { kind: 'met'; read: boolean }
  /**
   * The same recipe again: not yet shown at it, and not failing it. `key`: the
   * key today's phrase is in, where the recipe reads a set of keys. `wrong`: a
   * demand the reads single out that went wrong in the reads that would
   * otherwise have moved the recipe on.
   */
  | { kind: 'hold'; last: ReadMeasure; key?: number; wrong?: DemandFinding }
  /** Shown at this recipe on two days: the next demand the rung has taught, on. */
  | { kind: 'forward'; last: ReadMeasure; move: ReadingMove }
  /** Two reads against the recipe, and the reads single out a demand: that demand's control, off. */
  | { kind: 'back'; last: ReadMeasure; move: ReadingMove; because: DemandFinding }
  /**
   * Two reads against the recipe, and nothing singled out: nothing blamed; the
   * easy read where there is one. Or right as a whole on two days, a demand of
   * the phrase wrong in them, and nothing singled out: held, nothing blamed.
   */
  | { kind: 'unsure'; last: ReadMeasure; easy?: ReadingMove }
  /** Two reads against the recipe, a demand singled out, and no control here keeps it out: held, and said. */
  | { kind: 'kept'; last: ReadMeasure; because: DemandFinding }
  /** The rung that holds the row has changed, and its phrases may now hold what the last read's could not: held, and said. */
  | { kind: 'lesson'; last: ReadMeasure; demands: readonly string[] }
  /** One below the recipe, on purpose, for fluency. */
  | { kind: 'easy'; move: ReadingMove }
  /** Ready, and nothing the rung has taught to move to. */
  | { kind: 'stay'; last: ReadMeasure };

export interface ReadingOffer {
  /** The catalog row the phrase is generated from. */
  item: CatalogItem;
  recipe: ReadingRecipe;
  /** A phrase no stored run carries (the daily read: the day's seed, as ever). */
  seed: number;
  /** The rung whose reading row this is, where one is reached: the rung the phrase is held to and judged by. */
  lessonId?: string;
  /** False before any rung that lists a reading row: the easiest row stands in, and the session has no reading slot. */
  anchored: boolean;
  why: ReadingWhy;
}

export interface ReadingInput {
  curriculum: Curriculum;
  items: readonly CatalogItem[];
  /** Where the learner is (`nextRecommended`); absent when every rung is done. */
  position: LessonPosition | undefined;
  activeTracks?: readonly string[];
  /** The learner's stored runs of the reading rows, any order. */
  rows: readonly SessionRow[];
  today: Date;
  /** The daily read keeps the day's seed (it ticks the day); the session's slot draws its own. */
  purpose: 'daily' | 'slot';
  /** Shuffle's counter: another phrase of the same recipe. */
  shuffle?: number;
  vocabulary?: Vocabulary;
  /** The reader's numbers (`READER_POLICY` unless given). */
  policy?: ReaderPolicy;
}

/** A sight-reading row: generated notation (`drill.kind`), not the transposition drills that share the tag. */
function isReader(item: CatalogItem): boolean {
  return item.drill?.kind === 'sight-reading';
}

/**
 * The row the learner's reading starts from: the reading row of the latest
 * rung reached that lists one, on the tracks switched on, in the curriculum's
 * order — the rung's own row where the rung lists one. Before any such rung,
 * the easiest row stands in, as the daily read always did there, and the
 * session has no reading slot, as it had none there.
 */
function anchorFor(input: ReadingInput, readers: readonly CatalogItem[]): { item: CatalogItem; lessonId?: string; anchored: boolean } | null {
  if (readers.length === 0) return null;
  const tracks = new Set(input.activeTracks ?? []);
  const order: Lesson[] = [];
  for (const stage of input.curriculum.stages) {
    for (const unit of stage.units) {
      if (tracks.size > 0 && unit.track !== 'core' && !tracks.has(unit.track)) continue;
      order.push(...unit.lessons);
    }
  }
  const at = input.position ? order.findIndex((lesson) => lesson.id === input.position?.lesson.id) : order.length - 1;
  const byId = new Map(readers.map((item) => [item.id, item]));
  for (let i = at; i >= 0; i -= 1) {
    const lesson = order[i] as Lesson;
    const row = lesson.exerciseOptions.find((id) => byId.has(id));
    if (row) return { item: byId.get(row) as CatalogItem, lessonId: lesson.id, anchored: true };
  }
  const easiest = [...readers].sort((a, b) => a.level - b.level)[0] as CatalogItem;
  return { item: easiest, anchored: false };
}

/** A skill whose latest measured records, as many as the policy's step-down count, all went against it. */
function failing(states: readonly SkillState[], skill: string | undefined, policy: ReaderPolicy): boolean {
  if (skill === undefined) return false;
  const measured = states
    .find((state) => state.skill.id === skill)
    ?.evidence.filter((e): e is MeasuredEvidence => e.kind === 'measured');
  const latest = (measured ?? []).slice(-policy.stepDownAfter);
  return latest.length === policy.stepDownAfter && latest.every((e) => !supports(e));
}

/**
 * Proficient at the working recipe, by the policy's numbers read as the ladder
 * reads them: full-standard support on `stepUpAfter` different days since the
 * last run of `stepDownAfter` reads against, the latest full-standard read
 * supporting.
 */
function proficientAt(evidence: readonly MeasuredEvidence[], policy: ReaderPolicy): boolean {
  let days = new Set<string>();
  let against = 0;
  let lastFull: MeasuredEvidence | undefined;
  for (const e of evidence) {
    if (e.standard !== 'full') continue;
    lastFull = e;
    if (supports(e)) {
      against = 0;
      days.add(dayKey(new Date(e.at)));
    } else {
      against += 1;
      if (against >= policy.stepDownAfter) days = new Set();
    }
  }
  return lastFull !== undefined && supports(lastFull) && days.size >= policy.stepUpAfter;
}

/**
 * The demands of the phrase that went below the support share in any of these
 * reads (C4a's per-demand counts; "shorter than a quarter" as the eighths): a
 * phrase read right as a whole is not yet shown at a demand that went wrong in
 * it, and the reader does not add to it until those reads hold at every demand
 * the phrase still asks. A demand the recipe now keeps out does not hold it
 * back.
 */
function heldBack(reads: readonly MeasuredEvidence[], current: SightReadingOptions): string[] {
  const out = new Set<string>();
  for (const read of reads) {
    for (const entry of read.byDemand ?? []) {
      if (entry.n === 0 || entry.right / entry.n >= SUPPORT_SHARE) continue;
      const demand = SAME_NOTES[entry.demand] ?? entry.demand;
      if (READING_CONTROLS[demand]?.mayWrite(current) ?? true) out.add(demand);
    }
  }
  return [...out];
}

/**
 * The demands of sight-reading the reads single out (`pattern` or `isolated`)
 * that the phrase still holds, as findings a reason line may cite: "shorter
 * than a quarter" as the eighths; the lowest share first, a pattern before an
 * isolated case, the latest taught first.
 */
function singledOut(
  readings: readonly DemandReading[],
  current: SightReadingOptions,
  taughtIndex: (demand: string) => number,
): DemandFinding[] {
  const out: DemandFinding[] = [];
  for (const one of readings) {
    if (one.selectivity === 'ambiguous') continue;
    const demand = SAME_NOTES[one.demand] ?? one.demand;
    if ((READING_CONTROLS[demand]?.mayWrite(current) ?? true) !== true || out.some((found) => found.demand === demand)) continue;
    out.push({ demand, selectivity: one.selectivity, phrases: one.phrases, phrasesBelow: one.phrasesBelow, n: one.n, right: one.right });
  }
  return out.sort(
    (a, b) =>
      a.right / a.n - b.right / b.n ||
      (a.selectivity === 'pattern' ? 0 : 1) - (b.selectivity === 'pattern' ? 0 : 1) ||
      taughtIndex(b.demand) - taughtIndex(a.demand),
  );
}

/** The day's slot phrase, and the ones after it for Shuffle: a stream of its own beside the daily seed. */
function slotSeed(day: string, index: number): number {
  return (dailySeed(`${day}#reading`) + Math.imul(index, 0x9e3779b1)) >>> 0;
}

/** What a move is computed against: the row, the working recipe, the rungs, and the options a recipe writes. */
interface MoveContext {
  item: CatalogItem;
  working: ReadingRecipe;
  /** The learner's rung: what is taught, and where C4b's declared impossibilities are read. */
  rung: string | undefined;
  /** The options a recipe writes, held as the Score screen will hold them. */
  options: (value: ReadingRecipe) => SightReadingOptions;
}

/**
 * One demand's control, turned on or off from the working recipe, where C4b's
 * contract says the generator makes it at this rung: its patch exists, the rung
 * is not one `UNREALISABLE_AT` names for it, the generator gives no new reason
 * it cannot (`unrealisable`), the recipe changes, and after it the demand may
 * be written (on) or cannot be (off).
 */
function moveFor(ctx: MoveContext, demand: string, direction: 'on' | 'off'): ReadingMove | undefined {
  const control = READING_CONTROLS[demand];
  if (!control) return undefined;
  const current = ctx.options(ctx.working);
  const patch = direction === 'on' ? control.on(current) : control.off(current);
  if (!patch) return undefined;
  const rung = ctx.rung;
  if (rung !== undefined && UNREALISABLE_AT.some((u) => u.demand === demand && u.direction === direction && u.rungs.includes(rung))) {
    return undefined;
  }
  const moves = patchToMoves(patch);
  const next = recipe(ctx.item.id, withMoves(ctx.item, ctx.working.moved ?? {}, moves));
  if (recipeKey(next) === recipeKey(ctx.working)) return undefined;
  const after = ctx.options(next);
  const before = new Set(unrealisable(current));
  if (unrealisable(after).some((reason) => !before.has(reason))) return undefined;
  if (control.mayWrite(after) !== (direction === 'on')) return undefined;
  return { demand, direction, recipe: next, patch: moves, brings: direction === 'on' ? [...(control.brings?.(after) ?? [])] : [] };
}

/**
 * Every move the reader can ask for from a recipe at a rung: each taught
 * demand's control on, each demand the phrase may hold off — the ones C4b's
 * contract says the generator makes there. What the reader chooses among, and
 * what a lesson sentence about the reader is checked against.
 */
export function readingMoves(input: {
  curriculum: Curriculum;
  item: CatalogItem;
  recipe: ReadingRecipe;
  /** The learner's rung. */
  rung: string;
  /** The rung the phrase is held to (the row's rung); the learner's where absent. */
  hold?: string;
  vocabulary?: Vocabulary;
}): ReadingMove[] {
  const vocabulary = input.vocabulary ?? VOCABULARY_V0;
  const taught = taughtAtRung(input.curriculum, input.rung, vocabulary) ?? (() => false);
  const hold = taughtAtRung(input.curriculum, input.hold ?? input.rung, vocabulary);
  const ctx: MoveContext = {
    item: input.item,
    working: recipe(input.recipe.row, input.recipe.moved ?? {}),
    rung: input.rung,
    options: (value) => readingOptions(input.item, value, undefined, hold),
  };
  const out: ReadingMove[] = [];
  for (const demand of vocabulary.demands) {
    const on = taught(demand.id) ? moveFor(ctx, demand.id, 'on') : undefined;
    if (on && on.brings.every(taught)) out.push(on);
    const off = moveFor(ctx, demand.id, 'off');
    if (off) out.push(off);
  }
  return out;
}

/**
 * The next sight-reading phrase for a learner (C4, C4c): Today's daily read and
 * the session's reading slot, from one rule.
 *
 * 1. **The row** is the rung's (`anchorFor`). A learner with no reads there
 *    gets it as it stands (held to what the rung has taught), and the reason
 *    claims nothing beyond the rung.
 * 2. **The working recipe** is the learner's last one at that row, from the
 *    stored `recipe` (an easy read is a detour, not the working recipe); its
 *    **block** is the run of reads at it since the learner arrived there.
 * 3. **The rung that holds the row** may have moved on since the last read
 *    (2.2's row read on 2.5 may leave C position): where that lets the phrase
 *    hold a demand the last read's could not, the recipe is held and the line
 *    says what the lesson adds — one change a day.
 * 4. **The evidence** is sight-reading's, stored on those rows, and C4a's
 *    readings of it per demand (`demandReadings`):
 *    - The last `stepDownAfter` reads against it: if the reads single out a
 *      demand the phrase holds (`pattern` or `isolated`), **that demand's
 *      control, off** — every other part of the recipe held — or, where no
 *      control here keeps it out, the recipe held and the line says so. If
 *      nothing is singled out, **nothing is blamed**: the recipe is held, the
 *      next read is the easy one where one exists, and the line says the app
 *      is not sure yet what went wrong.
 *    - Proficient at the recipe (`proficientAt`), no demand the phrase holds
 *      below the support share in those reads (`heldBack`), and the read
 *      before not an easy one: **the next taught demand, on** — the first, in the order the
 *      curriculum teaches them (then the vocabulary's), that the learner's rung
 *      has taught, the phrase does not already promise, the reads have not
 *      shown, whose skill is not failing elsewhere, whose move brings nothing
 *      untaught, and which the generator makes here (C4b). None: the line says
 *      the next step waits for a later lesson.
 *    - `easyAfter` reads since the last easy one: **one below, on purpose** —
 *      the newest thing the recipe added, undone; else C position, then one
 *      hand, where the row's promises allow.
 *    - Otherwise **the same recipe**, another phrase.
 * 5. **The seed** is one no stored run of the row carries; the daily read's is
 *    the day's, as it always was, and once today's phrase is on the record the
 *    card offers that phrase as met, not as a new read.
 *
 * Keys are never ranked: the key signature's control is every key the level
 * writes with a signature, a set the seed chooses from, and the line names the
 * key the phrase is in.
 *
 * Pure: the same rows, rung and day give the same offer.
 */
export function readingOffer(input: ReadingInput): ReadingOffer | null {
  const vocabulary = input.vocabulary ?? VOCABULARY_V0;
  const policy = input.policy ?? READER_POLICY;
  const readers = input.items.filter(isReader);
  const anchor = anchorFor(input, readers);
  if (!anchor) return null;
  const byId = new Map(readers.map((item) => [item.id, item]));
  const day = dayKey(input.today);
  const recipeOf = (row: SessionRow): ReadingRecipe => {
    const stored = row.recipe;
    return stored && byId.has(stored.row) ? recipe(stored.row, stored.moved ?? {}, stored.easy === true) : recipe(row.itemId, {});
  };
  const base = { item: anchor.item, ...(anchor.lessonId === undefined ? {} : { lessonId: anchor.lessonId }), anchored: anchor.anchored };

  // Today's phrase already met: the card shows it as read (or heard), not as a new one.
  const dailyToday = dailySeed(day);
  if (input.purpose === 'daily') {
    const met = input.rows
      .filter((row) => row.seed === dailyToday && byId.has(row.itemId) && dayKey(new Date(row.at)) === day)
      .sort((a, b) => a.at.localeCompare(b.at));
    const first = met[0];
    if (first) {
      const was = recipeOf(first);
      const read = met.some((row) => row.unseen === true);
      return { ...base, item: byId.get(was.row) ?? anchor.item, recipe: was, seed: dailyToday, why: { kind: 'met', read } };
    }
  }

  const reads = input.rows
    .filter((row) => row.unseen === true && byId.has(row.itemId))
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));
  const here = reads.filter((row) => recipeOf(row).row === anchor.item.id);
  const lastWorking = [...here].reverse().find((row) => recipeOf(row).easy !== true);
  const working = lastWorking ? recipe(anchor.item.id, recipeOf(lastWorking).moved ?? {}) : recipe(anchor.item.id, {});
  const block: SessionRow[] = [];
  for (const row of [...here].reverse()) {
    const was = recipeOf(row);
    if (was.easy === true) continue;
    if (recipeKey(was) !== recipeKey(working)) break;
    block.unshift(row);
  }
  const sightOf = (row: SessionRow): MeasuredEvidence | undefined =>
    storedEvidence(row).find((e): e is MeasuredEvidence => e.kind === 'measured' && e.skill === READER_SKILL);
  const evidence = block.map(sightOf).filter((e): e is MeasuredEvidence => e !== undefined);
  const previous = here[here.length - 1];
  const previousEasy = previous !== undefined && recipeOf(previous).easy === true;
  const lastEasyAt = here.map((row) => recipeOf(row).easy === true).lastIndexOf(true);
  const sinceEasy = here.length - 1 - lastEasyAt;

  // The seed: one no stored run of the row carries.
  const onRecord = new Set(input.rows.filter((row) => row.itemId === anchor.item.id && row.seed !== undefined).map((row) => row.seed));
  let seed = dailyToday;
  if (input.purpose === 'slot') {
    for (let index = input.shuffle ?? 0; ; index += 1) {
      seed = slotSeed(day, index);
      if (!onRecord.has(seed) && seed !== dailyToday) break;
    }
  }
  const offer = (next: ReadingRecipe, why: ReadingWhy): ReadingOffer => ({ ...base, recipe: next, seed, why });

  const last = evidence[evidence.length - 1];
  if (!last) return offer(working, { kind: 'rung' });
  const measure: ReadMeasure = { at: last.at, right: last.right, n: last.n };

  // The phrase is held to what the row's rung has taught (as the Score screen holds it); moves are gated by the learner's.
  const rung = input.position?.lesson.id;
  const taught = taughtAtRung(input.curriculum, rung, vocabulary) ?? ((demand: string) => vocabulary.demands.some((d) => d.id === demand && d.taughtAt !== null));
  const hold = taughtAtRung(input.curriculum, anchor.lessonId, vocabulary);
  const ctx: MoveContext = {
    item: anchor.item,
    working,
    rung,
    options: (value) => readingOptions(anchor.item, value, undefined, hold),
  };
  const current = ctx.options(working);
  const order = lessonOrder(input.curriculum);
  const taughtIndex = (demand: string): number => {
    const at = vocabulary.demands.find((d) => d.id === demand)?.taughtAt;
    return at ? order.indexOf(at) : Number.POSITIVE_INFINITY;
  };
  const vocabularyIndex = (demand: string): number => vocabulary.demands.findIndex((d) => d.id === demand);

  // 3. The rung holding the row has moved on since the last read, and its phrases may now hold more.
  const thenRung = previous?.opened?.rung;
  if (thenRung !== undefined && anchor.lessonId !== undefined && thenRung !== anchor.lessonId) {
    const then = readingOptions(anchor.item, working, undefined, taughtAtRung(input.curriculum, thenRung, vocabulary));
    const opened = Object.entries(READING_CONTROLS)
      .filter(([, control]) => control.mayWrite(current) && !control.mayWrite(then))
      .map(([demand]) => demand);
    if (opened.length > 0) return offer(working, { kind: 'lesson', last: measure, demands: opened });
  }

  const readings = demandReadings(input.rows, vocabulary, input.today).filter((one) => one.skill === READER_SKILL);
  const states = readingState(input.rows, vocabulary, input.today);

  /** The newest thing the recipe added, undone; else C position, then one hand, where the row's promises allow. */
  const easyMove = (): ReadingMove | undefined => {
    const moved = normaliseMoves(working.moved) as Record<string, unknown>;
    const added: { key: RecipeKey; demand: string; at: number }[] = [];
    for (const key of RECIPE_KEYS) {
      if (moved[key] === undefined) continue;
      const without = { ...moved };
      delete without[key];
      const beneath = ctx.options(recipe(anchor.item.id, without));
      for (const [demand, control] of Object.entries(READING_CONTROLS)) {
        const on = control.on(beneath);
        if (!on || !taught(demand)) continue;
        // The demand's own patch, whole, is what the recipe holds at this key (a left-hand pattern's
        // patch also names the pattern, so both hands alone are not a pattern added).
        const patch = patchToMoves(on) as Record<string, unknown>;
        const contained = Object.keys(patch).length > 0 && Object.entries(patch).every(([k, v]) => same(v, k === key ? moved[key] : (moved[k] ?? ownValue(anchor.item, k as RecipeKey))));
        if (contained && Object.prototype.hasOwnProperty.call(patch, key)) added.push({ key, demand, at: taughtIndex(demand) });
      }
    }
    added.sort((a, b) => b.at - a.at || RECIPE_KEYS.indexOf(b.key) - RECIPE_KEYS.indexOf(a.key));
    for (const one of added) {
      const without = { ...moved };
      delete without[one.key];
      const next = recipe(anchor.item.id, without);
      const before = new Set(unrealisable(current));
      if (unrealisable(ctx.options(next)).some((reason) => !before.has(reason))) continue;
      const patch = { [one.key]: ownValue(anchor.item, one.key) } as ReadingMoves;
      return { demand: one.demand, direction: 'off', recipe: next, patch, brings: [] };
    }
    const concepts = new Set(anchor.item.concepts);
    const below: [string, boolean][] = [
      ['range.beyond-position', concepts.has('C-position')],
      ['clef.bass', ['bass-clef', 'two-hands', 'accompaniment-patterns', 'walking-bass'].some((c) => concepts.has(c))],
    ];
    for (const [demand, fixed] of below) {
      if (fixed || READING_CONTROLS[demand]?.mayWrite(current) !== true) continue;
      const down = moveFor(ctx, demand, 'off');
      if (down) return down;
    }
    return undefined;
  };
  const asEasy = (move: ReadingMove): ReadingRecipe => recipe(move.recipe.row, move.recipe.moved ?? {}, true);

  // 4a. Two reads against the recipe.
  const lastFew = evidence.slice(-policy.stepDownAfter);
  if (lastFew.length === policy.stepDownAfter && lastFew.every((e) => !supports(e))) {
    const because = singledOut(readings, current, taughtIndex)[0];
    if (because) {
      const down = moveFor(ctx, because.demand, 'off');
      return down ? offer(down.recipe, { kind: 'back', last: measure, move: down, because }) : offer(working, { kind: 'kept', last: measure, because });
    }
    const easy = previousEasy ? undefined : easyMove();
    return easy ? offer(asEasy(easy), { kind: 'unsure', last: measure, easy }) : offer(working, { kind: 'unsure', last: measure });
  }

  // 4b. Proficient at the recipe, at every demand the phrase holds: the next taught demand.
  const proficient = !previousEasy && proficientAt(evidence, policy);
  const stillWrong = proficient ? heldBack(evidence.slice(-policy.stepUpAfter), current) : [];
  const ready = proficient && stillWrong.length === 0;
  if (ready) {
    const shown = (demand: string): boolean =>
      readings.some(
        (one) => (SAME_NOTES[one.demand] ?? one.demand) === demand && !one.below && one.phrases - one.phrasesBelow >= policy.demandShownAfter,
      );
    const candidates = vocabulary.demands
      .map((d) => d.id)
      .filter(taught)
      .sort((a, b) => taughtIndex(a) - taughtIndex(b) || vocabularyIndex(a) - vocabularyIndex(b));
    for (const demand of candidates) {
      if (shown(demand) || failing(states, vocabulary.demands.find((d) => d.id === demand)?.copedWithBy, policy)) continue;
      const up = moveFor(ctx, demand, 'on');
      if (!up || !up.brings.every(taught)) continue;
      const key = demand === 'key.signature' ? generateSightReading(readingOptions(anchor.item, up.recipe, seed, hold)).fifths : undefined;
      return offer(up.recipe, { kind: 'forward', last: measure, move: key === undefined ? up : { ...up, key } });
    }
  }

  // 4c. The easy one, on purpose.
  if (sinceEasy >= policy.easyAfter && !previousEasy) {
    const down = easyMove();
    if (down) return offer(asEasy(down), { kind: 'easy', move: down });
  }
  if (ready) return offer(working, { kind: 'stay', last: measure });
  // Right as a whole, and a demand the phrase holds went wrong in the proving reads: held, and the line says
  // what the reads single out, or that the app is not sure yet.
  if (stillWrong.length > 0) {
    const finding = singledOut(readings, current, taughtIndex).find((one) => stillWrong.includes(one.demand));
    return finding ? offer(working, { kind: 'hold', last: measure, wrong: finding }) : offer(working, { kind: 'unsure', last: measure });
  }
  const keys = current.fifths;
  const key = Array.isArray(keys) && keys.length > 1 ? generateSightReading(readingOptions(anchor.item, working, seed, hold)).fifths : undefined;
  return offer(working, { kind: 'hold', last: measure, ...(key === undefined ? {} : { key }) });
}
