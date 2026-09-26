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
import { dailySeed, maxFifthsFor, sightReadingOptionsFor, type SightReadingOptions } from '../engine/sightReading';
import type { MeasuredEvidence } from '../evidence/evidence';
import { ladderState, RECENT_ATTEMPTS, supports } from '../evidence/ladder';
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

// --- the reader (C4): the next sight-reading phrase, from the reads ------------

/**
 * The dimensions a phrase's recipe can move in, one at a time (C4; the
 * brief's six): which hands, how far the melody ranges, the rhythm vocabulary,
 * the key, the metre, and syncopation. Each is one generator parameter
 * (`ReadingMoves`), so moving one moves nothing else the generator decides.
 */
export type ReadingDimension = 'hands' | 'range' | 'rhythm' | 'key' | 'metre' | 'syncopation';
export const READING_DIMENSIONS: readonly ReadingDimension[] = ['hands', 'range', 'rhythm', 'key', 'metre', 'syncopation'];

/**
 * One read in this many sits one dimension below the learner's recipe on
 * purpose (S13): after `EASY_AFTER` reads that were not, the next is. A
 * starting number, not a measured one; the brief leaves the cadence to the
 * builder, and "every few sessions" is what it asks.
 */
export const EASY_AFTER = 3;

/**
 * What each value of a dimension asks of the reader, in the vocabulary's
 * demand ids: what the taught-at gate checks before a move up, and what a
 * move's notation may add. Measured, not assumed (`sightReadingFromReadingState`
 * reads twelve phrases each way): adding the left hand under a melody at
 * level 2 adds both hands at once, the bass staff, and the leaps its roots
 * make between bars; six-eight at levels 1-4 is written in dotted-quarter
 * beats and the eighths inside them; the designed syncopation below level 5 is
 * the eighth-quarter-eighth figure.
 */
const VALUE_DEMANDS: Readonly<Record<ReadingDimension, Readonly<Record<string, readonly string[]>>>> = {
  hands: { right: [], left: ['clef.bass'], both: ['texture.hands-together', 'clef.bass', 'interval.leap'] },
  range: { position: [], octave: ['range.beyond-position'], wide: [] },
  rhythm: { quarters: [], eighths: ['rhythm.eighths', 'rhythm.shorter-than-quarter'] },
  key: Object.fromEntries(['0', '1', '-1', '2', '-2', '3', '-3', '4', '-4', 'list'].map((k) => [k, k === '0' ? [] : ['key.signature']])),
  metre: { '4/4': [], '6/8': ['metre.compound', 'rhythm.dotted-quarter', 'rhythm.eighths', 'rhythm.shorter-than-quarter'], list: [] },
  syncopation: { off: [], on: ['rhythm.syncopation', 'rhythm.eighths', 'rhythm.shorter-than-quarter'] },
};

/** The skill whose evidence a value is practice of: a move up is not taken while that skill is failing elsewhere. */
const VALUE_SKILL: Readonly<Partial<Record<ReadingDimension, Readonly<Record<string, string>>>>> = {
  hands: { left: 'bass-clef', both: 'hands-together' },
  range: { octave: 'position-shift' },
  rhythm: { eighths: 'subdivision' },
  key: Object.fromEntries(['1', '-1', '2', '-2', '3', '-3', '4', '-4'].map((k) => [k, 'key-signature'])),
  metre: { '6/8': '6/8' },
  syncopation: { on: 'syncopation' },
};

/** A key moves up to one sharp, then one flat, then two of each; the ladder is by accidentals. */
const KEY_LADDER = ['0', '1', '-1', '2', '-2', '3', '-3', '4', '-4'];

interface DimensionState {
  dimension: ReadingDimension;
  /** The values this row can take, easiest first. */
  values: readonly string[];
  /** The row's own value. */
  own: string;
  /** The recipe's value. */
  value: string;
  /** Fixed by what the row's rungs promise, or by its level: never moved. */
  fixed: boolean;
}

function levelOf(item: CatalogItem): number {
  const level = item.drill?.params?.level;
  return typeof level === 'number' ? level : 1;
}

/**
 * Where a recipe stands on each dimension, and which dimensions its row lets
 * the reader move.
 *
 * - **hands**: right or left alone at level 1 (a left hand read alone is the
 *   melody on the bass staff); right or both from level 2, where the left hand
 *   is the level's own. Fixed where the row promises the hands: the bass clef
 *   (1.3's row), two hands (3.4's, 4.6's), a left-hand pattern or a walking
 *   bass (levels 5-7).
 * - **range**: C position or the level's own octave, at levels 2 and 3 only;
 *   level 1 is C position already and level 4's range is its ledger lines.
 * - **rhythm**: eighths or not, at level 1 without an eighths promise; from
 *   level 2 the eighths are the level's own.
 * - **key**: any key up to the level's widest; fixed where the row asks the
 *   seed to choose from a list (the `keys` rows), and where it promises an
 *   accidental: level 4 in G wrote none in one of twelve phrases, so a key
 *   move there would break the row's promise (the brief's third hypothesis).
 *   The same row in six-eight dropped it in one of twelve too, so the metre is
 *   fixed there as well.
 * - **metre**: four-four or six-eight; fixed where the row asks for a list,
 *   promises syncopation or triplets (simple time's), or is level 5 or above,
 *   and while the recipe is syncopated.
 * - **syncopation**: on or off; fixed where the row promises it or the level
 *   designs it (5 and above), and while the recipe is in six-eight.
 */
function dimensionsOf(item: CatalogItem, moved: ReadingMoves = {}): DimensionState[] {
  const params = item.drill?.params ?? {};
  const level = levelOf(item);
  const concepts = new Set(item.concepts);

  const ownHands = params.hands === 'left' ? 'left' : params.hands === 'both' ? 'both' : 'right';
  const ranged = level === 2 || level === 3;
  const ownRange = ranged ? 'octave' : level <= 1 ? 'position' : 'wide';
  const ownRhythm = level >= 2 || params.eighths === true ? 'eighths' : 'quarters';
  const keys = KEY_LADDER.filter((k) => Math.abs(Number(k)) <= maxFifthsFor(level));
  const ownKey = Array.isArray(params.fifths) ? 'list' : String(typeof params.fifths === 'number' ? params.fifths : 0);
  const ownMetre = Array.isArray(params.timeSig) ? 'list' : params.timeSig === '6/8' ? '6/8' : '4/4';
  const ownSync = params.syncopation === true || level >= 5 ? 'on' : 'off';

  const metre = moved.timeSig ?? ownMetre;
  const syncopation = moved.syncopation === undefined ? ownSync : moved.syncopation ? 'on' : 'off';
  return [
    {
      dimension: 'hands',
      values: level <= 1 ? ['right', 'left'] : ['right', 'both'],
      own: ownHands,
      value: moved.hands ?? ownHands,
      fixed: ['bass-clef', 'two-hands', 'accompaniment-patterns', 'walking-bass'].some((c) => concepts.has(c)),
    },
    {
      dimension: 'range',
      values: ranged ? ['position', 'octave'] : [ownRange],
      own: ownRange,
      value: moved.position === true ? 'position' : ownRange,
      fixed: !ranged || concepts.has('C-position'),
    },
    {
      dimension: 'rhythm',
      values: ['quarters', 'eighths'],
      own: ownRhythm,
      value: moved.eighths === undefined ? ownRhythm : moved.eighths ? 'eighths' : 'quarters',
      fixed: level >= 2 || params.eighths === true,
    },
    {
      dimension: 'key',
      values: keys,
      own: ownKey,
      value: moved.fifths === undefined ? ownKey : String(moved.fifths),
      fixed: ownKey === 'list' || keys.length < 2 || params.accidentals === true,
    },
    {
      dimension: 'metre',
      values: ['4/4', '6/8'],
      own: ownMetre,
      value: metre,
      fixed:
        ownMetre === 'list' ||
        params.syncopation === true ||
        params.triplets === true ||
        params.accidentals === true ||
        level >= 5 ||
        syncopation === 'on',
    },
    {
      dimension: 'syncopation',
      values: ['off', 'on'],
      own: ownSync,
      value: syncopation,
      fixed: params.syncopation === true || level >= 5 || metre === '6/8',
    },
  ];
}

/** The recipe's moves with one dimension set to a value, in one key order, without what equals the row's own. */
function withValue(item: CatalogItem, moved: ReadingMoves, dimension: ReadingDimension, value: string): ReadingMoves {
  const own = dimensionsOf(item).find((d) => d.dimension === dimension)?.own;
  const next: ReadingMoves = { ...moved };
  const same = value === own;
  if (dimension === 'hands') {
    if (same) delete next.hands;
    else next.hands = value as 'right' | 'left' | 'both';
  } else if (dimension === 'range') {
    if (same) delete next.position;
    else next.position = value === 'position';
  } else if (dimension === 'rhythm') {
    if (same) delete next.eighths;
    else next.eighths = value === 'eighths';
  } else if (dimension === 'key') {
    if (same) delete next.fifths;
    else next.fifths = Number(value);
  } else if (dimension === 'metre') {
    if (same) delete next.timeSig;
    else next.timeSig = value as '4/4' | '6/8';
  } else if (same) {
    delete next.syncopation;
  } else {
    next.syncopation = value === 'on';
  }
  return normaliseMoves(next);
}

function normaliseMoves(moved: ReadingMoves | undefined): ReadingMoves {
  const out: ReadingMoves = {};
  if (!moved) return out;
  if (moved.hands !== undefined) out.hands = moved.hands;
  if (moved.position !== undefined) out.position = moved.position;
  if (moved.eighths !== undefined) out.eighths = moved.eighths;
  if (moved.fifths !== undefined) out.fifths = moved.fifths;
  if (moved.timeSig !== undefined) out.timeSig = moved.timeSig;
  if (moved.syncopation !== undefined) out.syncopation = moved.syncopation;
  return out;
}

function recipe(row: string, moved: ReadingMoves, easy = false): ReadingRecipe {
  const clean = normaliseMoves(moved);
  return { row, ...(Object.keys(clean).length > 0 ? { moved: clean } : {}), ...(easy ? { easy: true as const } : {}) };
}

/** A recipe's identity: its row and what it moved (the easy flag is why it was chosen, not what it is). */
function recipeKey(value: ReadingRecipe): string {
  return `${value.row}|${JSON.stringify(normaliseMoves(value.moved))}`;
}

/** The generator options a row and a recipe write: the row's own params, with the recipe's moves over them. */
export function readingOptions(
  item: CatalogItem,
  value?: { row?: string; moved?: ReadingMoves; easy?: true },
  seed?: number,
): SightReadingOptions {
  return sightReadingOptionsFor({ ...(item.drill?.params ?? {}), ...normaliseMoves(value?.moved) }, seed);
}

/**
 * How many dimensions two recipes of one row differ in; different rows are
 * not comparable this way (`Infinity`): that is the rung's row changing, which
 * the curriculum decides, not the reads.
 */
export function recipeDistance(a: ReadingRecipe, b: ReadingRecipe, items: readonly CatalogItem[]): number {
  if (a.row !== b.row) return Number.POSITIVE_INFINITY;
  const item = items.find((one) => one.id === a.row);
  if (!item) return Number.POSITIVE_INFINITY;
  const left = dimensionsOf(item, a.moved);
  const right = dimensionsOf(item, b.moved);
  return left.filter((d, i) => d.value !== right[i]?.value).length;
}

export interface ReadingMove {
  dimension: ReadingDimension;
  from: string;
  to: string;
  /** Up the dimension (harder) or down (easier). */
  direction: 'up' | 'down';
  /** The recipe after the move. */
  recipe: ReadingRecipe;
  /** The demands the move touches: what the new value brings, or the old one took away. */
  demands: string[];
}

/** The key one step down: one accidental fewer, same side (C4). */
function keyDown(value: string): string | undefined {
  const k = Number(value);
  if (!Number.isFinite(k) || k === 0) return undefined;
  return String(Math.sign(k) * (Math.abs(k) - 1));
}

/**
 * Every one-dimension move a recipe of this row can make, up and down, on the
 * dimensions the row does not fix. Not gated by what the learner's rung has
 * taught: `readingOffer` does that, and the test of the promises' bounds walks
 * all of them.
 */
export function readingMovesFrom(item: CatalogItem, from: ReadingRecipe): ReadingMove[] {
  const out: ReadingMove[] = [];
  for (const state of dimensionsOf(item, from.moved)) {
    if (state.fixed) continue;
    const at = state.values.indexOf(state.value);
    if (at < 0) continue;
    const up = state.values[at + 1];
    const down = state.dimension === 'key' ? keyDown(state.value) : state.values[at - 1];
    for (const [to, direction] of [
      [up, 'up'],
      [down, 'down'],
    ] as const) {
      if (to === undefined || !state.values.includes(to)) continue;
      const moves = withValue(item, from.moved ?? {}, state.dimension, to);
      out.push({
        dimension: state.dimension,
        from: state.value,
        to,
        direction,
        recipe: recipe(from.row, moves),
        demands: [...new Set([...(VALUE_DEMANDS[state.dimension][state.value] ?? []), ...(VALUE_DEMANDS[state.dimension][to] ?? [])])],
      });
    }
  }
  return out;
}

/** The last read's sight-reading measurement, as a reason line may cite it. */
export interface ReadMeasure {
  at: string;
  right: number;
  n: number;
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
  /** The same recipe again: not yet shown at it, and not failing it. */
  | { kind: 'hold'; last: ReadMeasure }
  /** Shown at this recipe on two days: one dimension up. */
  | { kind: 'forward'; last: ReadMeasure; move: ReadingMove }
  /** The last two reads at this recipe went against it: one dimension down. */
  | { kind: 'back'; last: ReadMeasure; move: ReadingMove }
  /** One dimension below, on purpose, for fluency. */
  | { kind: 'easy'; move: ReadingMove }
  /** Ready, but nothing is taught to move to; or failing, and nothing easier keeps the row's promises. */
  | { kind: 'stay'; last: ReadMeasure; because: 'nothing-taught' | 'nothing-easier' };

export interface ReadingOffer {
  /** The catalog row the phrase is generated from. */
  item: CatalogItem;
  recipe: ReadingRecipe;
  /** A phrase no stored run carries (the daily read: the day's seed, as ever). */
  seed: number;
  /** The rung whose reading row this is, where one is reached. */
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

/** A demand is taught at the learner's rung when the rung that teaches it comes at or before it in the curriculum. */
function taughtBy(curriculum: Curriculum, position: LessonPosition | undefined, vocabulary: Vocabulary): (demand: string) => boolean {
  const order = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
  const here = position ? order.indexOf(position.lesson.id) : order.length;
  return (demand) => {
    const rung = vocabulary.demands.find((d) => d.id === demand)?.taughtAt;
    if (rung === null || rung === undefined) return false;
    const at = order.indexOf(rung);
    return at >= 0 && at <= here;
  };
}

/** Where a demand is taught, as a place in the curriculum (for ordering moves: what was taught first, first). */
function taughtAt(curriculum: Curriculum, vocabulary: Vocabulary): (demands: readonly string[]) => number {
  const order = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
  return (demands) =>
    Math.max(
      -1,
      ...demands.map((demand) => {
        const rung = vocabulary.demands.find((d) => d.id === demand)?.taughtAt;
        return rung ? order.indexOf(rung) : Number.POSITIVE_INFINITY;
      }),
    );
}

/** A skill whose two latest measured records both went against it. */
function failing(states: readonly SkillState[], skill: string | undefined): boolean {
  if (skill === undefined) return false;
  const measured = states
    .find((state) => state.skill.id === skill)
    ?.evidence.filter((e): e is MeasuredEvidence => e.kind === 'measured');
  const latest = (measured ?? []).slice(-RECENT_ATTEMPTS);
  return latest.length === RECENT_ATTEMPTS && latest.every((e) => !supports(e));
}

/** The day's slot phrase, and the ones after it for Shuffle: a stream of its own beside the daily seed. */
function slotSeed(day: string, index: number): number {
  return (dailySeed(`${day}#reading`) + Math.imul(index, 0x9e3779b1)) >>> 0;
}

const PROFICIENT_OR_MORE = new Set(['proficient', 'transfer demonstrated', 'retained', 'mastered']);

/**
 * The next sight-reading phrase for a learner (C4): Today's daily read and the
 * session's reading slot, from one rule.
 *
 * 1. **The row** is the rung's (`anchorFor`). A learner with no reads there
 *    gets it as it stands, and the reason claims nothing beyond the rung.
 * 2. **The working recipe** is the learner's last one at that row, from the
 *    stored `recipe` (an easy read is a detour, not the working recipe); its
 *    **block** is the run of reads at it since the learner arrived there.
 * 3. **The evidence** is sight-reading's, stored on those rows: the skill
 *    every phrase exercises, measured on every step as right notes in time.
 *    - The last two against it: **one dimension down** — the newest thing
 *      added, else the first a row allows (range, then hands, then the rest).
 *    - Proficient at the recipe (the ladder read over the block: full-standard
 *      support on two days, the latest supporting), and the read before this
 *      one not an easy one: **one dimension up** — the first whose demands the
 *      learner's rung has taught, what was taught earliest first, and not one
 *      whose skill the learner is failing elsewhere.
 *    - `EASY_AFTER` reads since the last easy one: **one dimension down, on
 *      purpose** — the same step a failing read would get.
 *    - Otherwise **the same recipe**, another phrase.
 *    Where no move is open, the phrase stays and the reason says why.
 * 4. **The seed** is one no stored run of the row carries; the daily read's is
 *    the day's, as it always was, and once today's phrase is on the record the
 *    card offers that phrase as met, not as a new read.
 *
 * Pure: the same rows, rung and day give the same offer.
 */
export function readingOffer(input: ReadingInput): ReadingOffer | null {
  const vocabulary = input.vocabulary ?? VOCABULARY_V0;
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
    storedEvidence(row).find((e): e is MeasuredEvidence => e.kind === 'measured' && e.skill === 'sight-reading');
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
  const states = readingState(input.rows, vocabulary, input.today);
  const taught = taughtBy(input.curriculum, input.position, vocabulary);
  const whenTaught = taughtAt(input.curriculum, vocabulary);
  const own = new Map(dimensionsOf(anchor.item).map((d) => [d.dimension, d]));
  const moves = readingMovesFrom(anchor.item, working);
  const rank = (d: ReadingDimension, value: string): number => {
    const values = own.get(d)?.values ?? [];
    return d === 'key' ? Math.abs(Number(value)) : values.indexOf(value);
  };

  const stepDown = (): ReadingMove | undefined => {
    const downs = moves.filter((m) => m.direction === 'down');
    // Undo what was added: a dimension above the row's own, the newest taught first.
    const added = downs.filter((m) => rank(m.dimension, m.from) > rank(m.dimension, own.get(m.dimension)?.own ?? m.from));
    if (added.length > 0) {
      return added.sort(
        (a, b) =>
          whenTaught(VALUE_DEMANDS[b.dimension][b.from] ?? []) - whenTaught(VALUE_DEMANDS[a.dimension][a.from] ?? []) ||
          READING_DIMENSIONS.indexOf(b.dimension) - READING_DIMENSIONS.indexOf(a.dimension),
      )[0];
    }
    return downs.sort((a, b) => READING_DIMENSIONS.indexOf(a.dimension) - READING_DIMENSIONS.indexOf(b.dimension))[0];
  };
  const stepUp = (): ReadingMove | undefined =>
    moves
      .filter((m) => m.direction === 'up')
      .filter((m) => m.to === own.get(m.dimension)?.own || (VALUE_DEMANDS[m.dimension][m.to] ?? []).every(taught))
      .filter((m) => !failing(states, VALUE_SKILL[m.dimension]?.[m.to]))
      .sort((a, b) => {
        const at = (m: ReadingMove): number => (m.to === own.get(m.dimension)?.own ? -1 : whenTaught(VALUE_DEMANDS[m.dimension][m.to] ?? []));
        return at(a) - at(b) || READING_DIMENSIONS.indexOf(a.dimension) - READING_DIMENSIONS.indexOf(b.dimension);
      })[0];

  const lastTwo = evidence.slice(-RECENT_ATTEMPTS);
  if (lastTwo.length === RECENT_ATTEMPTS && lastTwo.every((e) => !supports(e))) {
    const down = stepDown();
    return down
      ? offer(down.recipe, { kind: 'back', last: measure, move: down })
      : offer(working, { kind: 'stay', last: measure, because: 'nothing-easier' });
  }
  const ready = !previousEasy && PROFICIENT_OR_MORE.has(ladderState({ evidence, today: input.today }).state);
  if (ready) {
    const up = stepUp();
    if (up) return offer(up.recipe, { kind: 'forward', last: measure, move: up });
  }
  if (sinceEasy >= EASY_AFTER && !previousEasy) {
    const down = stepDown();
    if (down) return offer(recipe(down.recipe.row, down.recipe.moved ?? {}, true), { kind: 'easy', move: down });
  }
  if (ready) return offer(working, { kind: 'stay', last: measure, because: 'nothing-taught' });
  return offer(working, { kind: 'hold', last: measure });
}
