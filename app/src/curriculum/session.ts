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
import { alternativesFor, findLesson, lessonComplete, type CatalogIndex } from './selectors';

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
    slots: [
      { kind: 'technique', minutes: 5 },
      { kind: 'review', minutes: 5 },
      { kind: 'new', minutes: 10 },
      { kind: 'repertoire', minutes: 8 },
      { kind: 'free', minutes: 2 },
    ],
  },
  {
    minutes: 60,
    slots: [
      { kind: 'technique', minutes: 8 },
      { kind: 'review', minutes: 8 },
      { kind: 'new', minutes: 20 },
      { kind: 'repertoire', minutes: 12 },
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
}

export interface LessonPosition {
  lesson: Lesson;
  unit: Unit;
  stageNumber: number;
}

/** Walks stages in order and returns the first lesson that is not complete. */
export function nextRecommended(
  curriculum: Curriculum,
  records: PassRecord[],
  activeTracks: string[] = [],
  options: { requireTwoSongs?: boolean } = {},
): LessonPosition | undefined {
  const tracks = new Set(activeTracks);
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      // A track the learner has switched off is skipped, but the core track
      // is never optional — it is the spine the stages are built on.
      if (tracks.size > 0 && unit.track !== 'core' && !tracks.has(unit.track)) continue;
      for (const lesson of unit.lessons) {
        if (!lessonComplete(lesson, records, options)) {
          return { lesson, unit, stageNumber: stage.number };
        }
      }
    }
  }
  return undefined;
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
): { item?: CatalogItem; reason: string; lessonId?: string } {
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
        items.filter(
          (item) => free(item.id) && playable(item) && item.type !== 'song' && item.level < level + 2,
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
    const chosen = pick(
      items.filter(
        (item) =>
          free(item.id) &&
          playable(item) &&
          item.concepts.includes('sight-reading') &&
          item.level <= level,
      ),
      seed,
    );
    return {
      ...(chosen ? { item: chosen } : {}),
      reason: 'Read something you have never seen, once, slowly',
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
    .sort((a, b) => Math.abs(a.level - source.level) - Math.abs(b.level - source.level))
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
