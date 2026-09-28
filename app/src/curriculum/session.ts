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
import type { CatalogItem, Curriculum, Lesson, Requirement, Unit } from './types';
import {
  alternativesFor,
  findLesson,
  tieredAlternatives,
  type AlternativeTier,
  type CatalogIndex,
} from './selectors';
import { lockState } from './prerequisites';
import { SHIPPED_SKILL_ACTIVATION, type SkillActivation } from './skillActivation';
import { admittedForTeaching, eligible, eligibleFor, type Eligibility, type Learner, type Want as GateWant } from './eligibility';
import type { RequirementReading, RungStates } from '../evidence/rungState';
import { phraseVersionOf, type ReadingMoves, type ReadingRecipe, type SessionRow } from '../data/db';
import { dayKey, daysBetween, type LearnedPiece } from '../data/progressStore';
import { heldToRung, READING_CONTROLS, UNREALISABLE_AT, type ControlPatch } from '../engine/readingControls';
import {
  dailySeed,
  generateSightReading,
  SIGHT_READING_IN_FORCE,
  SightReadingRefusal,
  sightReadingOptionsFor,
  unrealisable,
  type SightReadingOptions,
  type TimeSig,
} from '../engine/sightReading';
import { demandReadings, type DemandReading } from '../evidence/demandReadings';
import type { MeasuredEvidence } from '../evidence/evidence';
import { ladderState, RECENT_ATTEMPTS, RETENTION_DAYS, SUPPORT_SHARE, supports, type LadderReading, type LadderState } from '../evidence/ladder';
import { readingState, storedEvidence, type SkillState } from '../evidence/readingState';
import { VOCABULARY_V0, type Vocabulary } from '../evidence/vocabulary';
import { readingReason, slotReason } from '../ui/help';
import { isExcerpt, isExerciseKind, isPieceMaterial } from './excerpt';

export type SlotKind = 'technique' | 'review' | 'new' | 'repertoire' | 'jam' | 'free' | 'sightreading';

export interface SessionSlot {
  kind: SlotKind;
  /** Minutes this slot is worth, from the template. */
  minutes: number;
  /** The item to play, absent for the free-play prompt. */
  item?: CatalogItem;
  /** The lesson the item was offered from, so "Swap this" can look there first. */
  lessonId?: string;
  /** Why it is here, shown under the title: drawn from `claim` (C6), or the reader's (C4). */
  reason: string;
  /**
   * What chose the item (C6): the rung's ask, retention, the exposure rule or a
   * step of the fallback ladder. Absent on the reading slot (its `reading.why`
   * is the reader's) and on the free-play prompt.
   */
  claim?: SlotClaim;
  /**
   * A skill-retention review's phrase (C6): the recipe that writes the skill's
   * demand into it, and the rung it is held to — the learner's. Today opens
   * the row with it (a fresh seed, as any open of a reading row draws); a
   * swap replaces the item and it stops applying.
   */
  phrase?: { recipe: ReadingRecipe; rung?: string };
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
  /**
   * Where the learner is, from the evidence (C5: `evidence/rungState`). It was
   * `records`, a list of passed items counted over each rung.
   */
  states: RungStates;
  /**
   * The pieces the learner has learned and when each was last played
   * (`progressStore.learnedPieces`, C6): the review's repertoire retention and
   * the repertoire slot's "a piece you know". It replaced `dueForReview`, the
   * item calendar, and `mastered`.
   */
  learned?: readonly LearnedPiece[];
  /**
   * When each item was last played, by any run (the progress rows'
   * `lastPracticedAt`): what the exposure rule reads. None: nothing played.
   */
  lastPlayed?: ReadonlyMap<string, string>;
  /**
   * Every stored run with its evidence (the rung state's rows, C5): the
   * learner's skills, for skill retention and the warm-up's skill claim.
   * Absent: `readingRows`, which today hold every row that can carry evidence.
   */
  rows?: readonly SessionRow[];
  /** The vocabulary the skills and demands are read in (v0 unless given). */
  vocabulary?: Vocabulary;
  /**
   * Whose declared target skills the skill requirement and the skill fallback read
   * (D0; `skillActivation.ts`): the shipped activation unless given. A test that
   * exercises the skill step on constructed items passes `EVERY_DECLARED_SKILL`.
   */
  skillActivation?: SkillActivation;
  /**
   * The ladder state at which a skill supports its demands in the one gate
   * (`eligibility.ts`): `familiar` unless given. `introduced` is the comparison
   * the E0 brief asked for on the three constructed learners; nothing ships it.
   */
  readinessFloor?: LadderState;
  /** Tracks the learner has switched on, in their order (planStore). */
  activeTracks: string[];
  minutes: number;
  /**
   * Shuffle's counter: the next candidate of the claim that chose each slot,
   * never another claim (C6: it was an index into the rung's list).
   */
  seed?: number;
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
 * Walks stages in order and returns the first rung the evidence has not met
 * (C5: `rungState`, where it used to be the first rung whose passed items did
 * not add up).
 *
 * A rung the learner has set aside by their word ("I already know this",
 * *Mark done*) or that was carried over from before C5 is held back the way a
 * rung behind the placement is: not recommended while anything in front is
 * open, and come back to when nothing else is. The word is not evidence, so
 * the rung is not met; it is simply not where the learner said they are.
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
  states: RungStates,
  activeTracks: string[] = [],
  options: {
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
  let firstSetAside: LessonPosition | undefined;
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      // A track the learner has switched off is skipped, but the core track
      // is never optional — it is the spine the stages are built on.
      if (tracks.size > 0 && unit.track !== 'core' && !tracks.has(unit.track)) continue;
      if (unit.id === startAt) reachedStart = true;
      for (const lesson of unit.lessons) {
        if (lesson.id === startAt) reachedStart = true;
        const state = states.byRung.get(lesson.id);
        if (state?.status === 'met') continue;
        const position = { lesson, unit, stageNumber: stage.number };
        if (state !== undefined && (state.word !== undefined || state.carried)) {
          firstSetAside ??= position;
          continue;
        }
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
          const lock = lockState(lesson, curriculum, states, { strict: true });
          if (lock.locked) {
            firstLocked ??= position;
            continue;
          }
        }
        return position;
      }
    }
  }
  // Nothing from the placement onwards, so the rungs behind it come back; and
  // after them the rungs set aside by the learner's word.
  return firstLocked ?? firstBehind ?? firstSetAside;
}

/**
 * The rung the reader reads from (C6, the parallel-strand finding): the core
 * path's next rung while there is one — the spine the reading rows sit on —
 * then the earliest strand's in the curriculum's order; none once nothing is
 * open, and the reader reads its latest row. `nextRecommended` walks every
 * switched-on track in the file's order, so with the fresh tracks a learner at
 * 4.1 whose How to practise rungs are open was placed on `practice.1`, and the
 * reading row of the latest rung before it (1.5's, level one) was the daily
 * read. Never a rung the learner is past by placement or by their word
 * (the reviewer's boundary: a bypassed rung is not new unmet work because the
 * work ahead is done); `nextRecommended` still falls back to those for the
 * status line and Plan (C5's; reported). The daily card and the session's
 * reading slot both read this.
 */
export function readerPosition(
  curriculum: Curriculum,
  states: RungStates,
  activeTracks: string[] = [],
  options: { strictPrerequisites?: boolean; startAt?: string } = {},
): LessonPosition | undefined {
  const walk = walkOf(curriculum, activeTracks);
  const { strands } = strandsOf({ input: { curriculum, states, ...(options.startAt === undefined ? {} : { startAt: options.startAt }) }, walk, lastPlayed: () => undefined });
  const at = (id: string): number => walk.findIndex((walked) => walked.lesson.id === id);
  const chosen = strands.find((strand) => strand.track === 'core') ?? [...strands].sort((a, b) => at(a.rung.id) - at(b.rung.id))[0];
  if (!chosen) return undefined;
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      if (unit.lessons.includes(chosen.rung)) return { lesson: chosen.rung, unit, stageNumber: stage.number };
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

/** Shuffle's turn within one claim: the first candidate unless the learner asked for another. */
function pick<T>(candidates: readonly T[], seed: number): T | undefined {
  if (candidates.length === 0) return undefined;
  return candidates[seed % candidates.length];
}

// --- the slots: what the evidence supports and what the rung asks next (C6) --

/**
 * Days a learned piece may go unplayed before the review slot brings it back
 * (C6: repertoire retention, the reviewer's correction of 2026-09-26). **A
 * hypothesis**, apart from the ladder's `RETENTION_DAYS` (which is about a
 * skill's evidence, not a piece): two weeks is long enough that the piece is
 * no longer in the fingers from the week it was learned, and short enough that
 * it has not gone. The calendar it replaces came back at 7 and then 21 days
 * after a first pass; `02` Part G said mastered pieces every thirty days or so.
 * Never measured against a learner.
 */
export const REPERTOIRE_WINDOW_DAYS = 14;

/**
 * The fallback ladder (L14; `operating-procedure.md` §7): when a slot's first
 * claim finds nothing, these weaker claims are tried in this order, and the
 * reason line names the one used. No slot falls back to a level window.
 */
export const FALLBACK_ORDER = ['rung', 'skill', 'demand', 'prerequisite', 'exposure'] as const;

/**
 * A family of material the exposure rule balances over: a kind of exercise
 * (`drill.kind`), a track the learner switched on (a song's style, from the
 * rung that lists it; never the quarry's genre column, `00` §1a), or the core
 * lessons before the learner's.
 */
export interface ExposureFamily {
  by: 'kind' | 'track' | 'earlier';
  /** The drill kind, or the track id; `earlier` for the core lessons before this one. */
  id: string;
  /** The track's title, for a track. */
  title?: string;
}

/**
 * Why a slot holds its item (C6): what the reason line is drawn from, and what
 * a test reads. Every kind is evidence, the rung, retention or the exposure
 * rule; none is a level or a seed.
 */
export type SlotClaim =
  /**
   * The rung asks for it: an unmet requirement's item, or an exercise training
   * a skill an unmet requirement names (`skill`). `next`: the rung after the
   * learner's, because this one's asks of this kind are met. `waitsForReads`:
   * what is left on the learner's rung is its reads (the reader's).
   */
  | {
      kind: 'asked';
      rung: Lesson;
      next: boolean;
      requirement: Requirement;
      have: number;
      need: number;
      skill?: string;
      waitsForReads?: boolean;
      /** The strand that asked: a track's title, absent for the core path. */
      strand?: string;
      /** The rung is a project (Stage 9: "nothing here is a rung to pass"), not a rung to meet. */
      project?: true;
    }
  /** Skill retention: a skill whose evidence the reads have not shown for the ladder's span; a phrase of a row it was shown on. */
  | { kind: 'skill-retention'; skill: string; lastShown: string }
  /** Repertoire retention: a learned piece not played for `REPERTOIRE_WINDOW_DAYS`. */
  | { kind: 'piece-retention'; lastPlayed: string }
  /** A piece whose measured demands the learner's skills support, with one the rung has just taught. */
  | { kind: 'ready'; demand: string }
  /** The fallback ladder's first step: the rung's own option, and the strand it is on (a track's title; absent for core). */
  | { kind: 'rung'; rung: Lesson; strand?: string }
  /** An item declaring the target skill the rung asks for. */
  | { kind: 'skill'; skill: string; rung: Lesson }
  /** An item carrying a demand of the skill the rung asks for. */
  | { kind: 'demand'; demand: string; rung: Lesson }
  /** An option of a rung this one builds on (`Lesson.prerequisites`). */
  | { kind: 'prerequisite'; rung: Lesson; of: Lesson }
  /** The exposure rule: the family of taught material played least lately (never, first). */
  | { kind: 'exposure'; family: ExposureFamily; lastPlayed?: string }
  /** Jam: an option of a rung on a jam track the learner has reached. */
  | { kind: 'jam'; rung: Lesson };

/** A rung in the curriculum's walk on the tracks switched on, as `nextRecommended` walks it. */
interface Walked {
  lesson: Lesson;
  track: string;
  stage: number;
}

/**
 * The stages whose rungs are projects, not rungs to meet: Stage 9 says of
 * itself "Nothing here is a rung to pass; they are pieces to live with"
 * (`content/curriculum/stage-9.json`). No slot advances into one as "the next
 * lesson", and its asks are offered as a project. By number, because the
 * curriculum does not mark the stage (a report item for the curriculum).
 */
const PROJECT_STAGES: ReadonlySet<number> = new Set([9]);

/**
 * One line of study the learner is on (the reviewer's parallel-strand finding,
 * 2026-09-26): the core path, the spine through Stage 4, and each track the
 * learner has switched on, which from Stage 3 runs beside it and from Stage 5
 * alone (`02`: "the learner picks which to advance"). Each has its own next
 * rung, so no strand waits behind another in the file's order.
 */
interface Strand {
  track: string;
  /** The track's title; absent for the core path, which the lines call "this lesson". */
  title?: string;
  /** The strand's next rung: its first not met, not set aside, not behind the placement, and open. */
  rung: Lesson;
  stage: number;
  /** The rung after it on the same track, never into a project stage: what "the next lesson" means for this strand. */
  after?: Lesson;
  /** When anything from the strand's rungs so far was last played. */
  last?: string;
}

/** Everything the slots read, worked out once per card. */
interface SlotContext {
  input: BuildInput;
  catalog: CatalogIndex;
  /** The reader's rung (`readerPosition`): its row, and what a phrase is held to. */
  position: LessonPosition | undefined;
  /** The rungs on the tracks switched on, in the curriculum's order. */
  walk: Walked[];
  /**
   * The strands the learner is on, in today's order: the one played least
   * lately first (never, first), the core path first on a tie. The slots choose
   * across them (the balance rule), never from one position in the file's order.
   */
  strands: Strand[];
  /** What has been taught: every rung met, set aside, behind the placement, or up to a strand's next rung. */
  reached: Walked[];
  skills: ReadonlyMap<string, SkillEvidence>;
  learned: ReadonlyMap<string, LearnedPiece>;
  lastPlayed: (id: string) => string | undefined;
  today: Date;
  used: Set<string>;
  seed: number;
}

/** One skill's evidence, as the slots read it. */
interface SkillEvidence {
  reading: LadderReading;
  /** The last supporting record's date. */
  lastSupport?: string;
  /** Supporting records in the last `RETENTION_DAYS`: "the evidence has shown least" counts these. */
  recentSupported: number;
  /** The items a supporting record came from, with the latest date on each. */
  supportedOn: ReadonlyMap<string, string>;
}

/** A sight-reading row: generated notation (`drill.kind`), not the transposition drills that share the tag. */
function isReadingRow(item: CatalogItem | undefined): boolean {
  return item?.drill?.kind === 'sight-reading';
}

function walkOf(curriculum: Curriculum, activeTracks: readonly string[]): Walked[] {
  const tracks = new Set(activeTracks);
  const out: Walked[] = [];
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      if (tracks.size > 0 && unit.track !== 'core' && !tracks.has(unit.track)) continue;
      for (const lesson of unit.lessons) out.push({ lesson, track: unit.track, stage: stage.number });
    }
  }
  return out;
}

/**
 * The strands and what they have taught (the parallel-strand finding). Per
 * track, in the curriculum's order within it:
 *
 * - **Met, set aside or behind the placement** is passed over (the rung
 *   state; the learner's word or the carry-over; `startAt`, as
 *   `nextRecommended` holds those rungs back) and counts as taught.
 * - **The core path is the spine**: its next rung is the first not passed
 *   over. A track opens where the spine has reached the track's stage (the
 *   core path's next rung's stage, every stage once the core path is done) and
 *   the rung's prerequisites are met, set aside or behind the placement —
 *   honoured here, because the file's order no longer does it for them.
 * - **A project stage** is a strand's rung like any other when the strand has
 *   come to it, and never "the next lesson" of the rung before it.
 *
 * Then ordered for today: the strand played least lately first (never,
 * first), the core path first on a tie, then the order of the walk.
 */
function strandsOf(ctx: {
  input: Pick<BuildInput, 'curriculum' | 'states' | 'startAt'>;
  walk: readonly Walked[];
  lastPlayed: (id: string) => string | undefined;
}): { strands: Strand[]; reached: Walked[] } {
  const { input, walk } = ctx;
  const state = (id: string) => input.states.byRung.get(id);
  const aside = (id: string): boolean => {
    const one = state(id);
    return one !== undefined && (one.word !== undefined || one.carried);
  };
  const startAt = input.startAt === undefined || input.startAt === '' ? null : input.startAt;
  const behind = new Set<string>();
  if (startAt !== null) {
    let reachedStart = false;
    for (const walked of walk) {
      if (walked.lesson.id === startAt || findUnitOf(input.curriculum, walked.lesson.id) === startAt) reachedStart = true;
      if (!reachedStart) behind.add(walked.lesson.id);
    }
    // A placement the walk never reaches holds nothing back.
    if (behind.size === walk.length) behind.clear();
  }
  const passed = (id: string): boolean => state(id)?.status === 'met' || aside(id) || behind.has(id);
  const tracks = [...new Set(walk.map((walked) => walked.track))].sort((a, b) => (a === 'core' ? -1 : b === 'core' ? 1 : 0));
  const titleOf = (track: string): string => input.curriculum.tracks.find((t) => t.id === track)?.title ?? track;
  const spine = walk.find((walked) => walked.track === 'core' && !passed(walked.lesson.id));
  const spineStage = spine ? spine.stage : Number.POSITIVE_INFINITY;
  // Every rung of the curriculum, switched on or not: a prerequisite on a track the learner has off still gates.
  const known = new Set(input.curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id))));
  const strands: Strand[] = [];
  const reached: Walked[] = [];
  for (const track of tracks) {
    const line = walk.filter((walked) => walked.track === track);
    const at = line.findIndex((walked) => !passed(walked.lesson.id));
    const next = at < 0 ? undefined : line[at];
    const open =
      next !== undefined &&
      (track === 'core' ||
        (next.stage <= spineStage && (next.lesson.prerequisites ?? []).every((id) => !known.has(id) || passed(id))));
    reached.push(...line.slice(0, at < 0 ? line.length : open ? at + 1 : at));
    if (!next || !open) continue;
    const following = line[at + 1];
    const items = line.slice(0, at + 1).flatMap((walked) => [...walked.lesson.exerciseOptions, ...walked.lesson.songOptions]);
    const last = items.map((id) => ctx.lastPlayed(id)).filter((when): when is string => when !== undefined).sort().at(-1);
    strands.push({
      track,
      ...(track === 'core' ? {} : { title: titleOf(track) }),
      rung: next.lesson,
      stage: next.stage,
      ...(following && !PROJECT_STAGES.has(following.stage) ? { after: following.lesson } : {}),
      ...(last === undefined ? {} : { last }),
    });
  }
  const order = new Map(tracks.map((track, index) => [track, index]));
  strands.sort((a, b) => (a.last ?? '').localeCompare(b.last ?? '') || (order.get(a.track) ?? 0) - (order.get(b.track) ?? 0));
  const reachedIds = new Set(reached.map((walked) => walked.lesson.id));
  return { strands, reached: walk.filter((walked) => reachedIds.has(walked.lesson.id)) };
}

/** The unit id a rung is in, for a placement that names a unit (`nextRecommended` matches both). */
function findUnitOf(curriculum: Curriculum, lessonId: string): string | undefined {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) if (unit.lessons.some((lesson) => lesson.id === lessonId)) return unit.id;
  }
  return undefined;
}

/**
 * Every vocabulary skill with an observable, from the evidence the rows carry
 * under the evidence definitions in force (`storedEvidence`), whichever rung
 * judged the run: the ladder's reading, when it last supported the skill, how
 * often in the retention span, and on which items.
 */
function skillEvidenceOf(rows: readonly SessionRow[], vocabulary: Vocabulary, today: Date): Map<string, SkillEvidence> {
  const bySkill = new Map<string, MeasuredEvidence[]>();
  const all = new Map<string, ReturnType<typeof storedEvidence>>();
  for (const row of rows) {
    for (const evidence of storedEvidence(row)) {
      const list = all.get(evidence.skill) ?? [];
      list.push(evidence);
      all.set(evidence.skill, list);
      if (evidence.kind !== 'measured') continue;
      const measured = bySkill.get(evidence.skill) ?? [];
      measured.push(evidence);
      bySkill.set(evidence.skill, measured);
    }
  }
  const todayKey = dayKey(today);
  const out = new Map<string, SkillEvidence>();
  for (const skill of vocabulary.skills) {
    if (skill.observable === 'none') continue;
    const measured = (bySkill.get(skill.id) ?? []).slice().sort((a, b) => a.at.localeCompare(b.at));
    const supporting = measured.filter((e) => supports(e));
    const supportedOn = new Map<string, string>();
    for (const e of supporting) supportedOn.set(e.context.itemId, e.at);
    const last = supporting[supporting.length - 1];
    out.set(skill.id, {
      reading: ladderState({ evidence: all.get(skill.id) ?? [], today }),
      ...(last ? { lastSupport: last.at } : {}),
      recentSupported: supporting.filter((e) => (daysBetween(dayKey(new Date(e.at)), todayKey) ?? Infinity) < RETENTION_DAYS).length,
      supportedOn,
    });
  }
  return out;
}

function daysSince(at: string | undefined, today: Date): number | undefined {
  if (at === undefined || at === '') return undefined;
  const then = new Date(at);
  if (Number.isNaN(then.getTime())) return undefined;
  return daysBetween(dayKey(then), dayKey(today)) ?? undefined;
}

/** What the rung state says of each of a rung's requirements; a rung the state does not have reads as nothing counted. */
function readingsOf(ctx: SlotContext, rung: Lesson): RequirementReading[] {
  const state = ctx.input.states.byRung.get(rung.id);
  if (state) return state.requirements;
  return (rung.requirements ?? []).map((requirement) => ({
    requirement,
    holds: requirement.kind === 'unjudged' ? ('unjudged' as const) : false,
    have: 0,
    need: requirement.kind === 'runs' || requirement.kind === 'reads' ? requirement.count : 1,
    items: [],
  }));
}

/**
 * A slot's eye on an item: playable, not on the card, never a reading row (the reading slot is the
 * reader's, L65), and admitted for teaching use (D3b): a generated item whose family promises music is
 * offered by no slot until a person's `yes` on its teaching use is built (`eligibility.admittedForTeaching`,
 * the gate's own reading). Every slot that takes an item from a rung's list without asking the gate — a
 * want's `offer` (`runs`, `done`, `measure`), the ladder's rung and prerequisite steps, the jam slot, the
 * exposure rule — chooses only through here, so a rung listing one is not a decision to teach it; where it
 * was a row's only candidate the row takes the next step that passes, or is dropped.
 */
function usable(ctx: SlotContext, item: CatalogItem | undefined, songs: 'any' | 'none' | 'only'): item is CatalogItem {
  if (!item || !playable(item) || ctx.used.has(item.id) || isReadingRow(item) || !admittedForTeaching(item)) return false;
  // A slot that leaves songs out leaves excerpts out (a passage of a piece is not technique); a slot
  // that wants songs wants the piece — the repertoire lifecycle keeps to songs (E1, adversary 10).
  if (songs === 'none' && isPieceMaterial(item)) return false;
  if (songs === 'only' && item.type !== 'song') return false;
  return true;
}

/**
 * The learner as the one gate reads them (E0, `eligibility.ts`): the ladder state
 * of each skill from every stored run, and what `rung` — the rung judging the
 * offer — has taught, with what the rungs the learner has reached taught them
 * (E0a: their own path, `taughtAtRung`'s second reading). `rung` absent: no rung
 * judges, and only the evidence counts.
 */
function learnerAt(ctx: SlotContext, rung: Lesson | undefined): Learner {
  const vocabulary = ctx.input.vocabulary ?? VOCABULARY_V0;
  const taught =
    rung === undefined
      ? undefined
      : taughtAtRung(
          ctx.input.curriculum,
          rung.id,
          vocabulary,
          ctx.reached.map((walked) => walked.lesson.id),
        );
  return {
    skillState: (skill) => ctx.skills.get(skill)?.reading.state,
    ...(taught === undefined ? {} : { taught }),
    ...(ctx.input.readinessFloor === undefined ? {} : { floor: ctx.input.readinessFloor }),
  };
}

/** The gate's answer for one candidate, in the session's vocabulary. */
function gate(ctx: SlotContext, item: CatalogItem, learner: Learner, want: GateWant): Eligibility {
  return eligibleFor(item, learner, want, ctx.input.vocabulary ?? VOCABULARY_V0);
}

/**
 * One unmet requirement of a rung and the items that would serve it: the
 * unit the warm-up and the new slot choose among. `pool` is every item the
 * requirement would count, whether or not it can be offered now; `offer`
 * those that can (`usable`: the teaching-use admission included, D3b). Only
 * `offer` is ever chosen from. A want whose pool is not empty but whose offer is
 * empty (its candidates on the card already, unplayable, or not admitted) still
 * says the rung asks something: the slot waits for the fallback ladder rather than
 * moving on to the next lesson as if this one's ask were met, and `pool` only
 * orders the new slot's wants (`fresh`'s `served`).
 */
interface Want {
  rung: Lesson;
  reading: RequirementReading;
  skill?: string;
  pool: CatalogItem[];
  offer: CatalogItem[];
}

/**
 * The unmet requirements of `rung` a slot can serve, in the order the lesson
 * states them, each with its items in the lesson's order.
 *
 * - `runs`: the rung's own options it counts (its exercises, songs, or the
 *   items it names), not yet counted. The warm-up serves only exercises.
 * - `done`: the item. `measure`: the rung's exercises of that kind.
 * - `skill`: the rung's exercises the one gate passes for the requirement
 *   (`eligibility.ts`, E0): an exercise declaring the skill whose runs the evidence
 *   readers act on (D0's boundary, the reading rows as shipped), with its
 *   opportunity in the notes and nothing the learner cannot cope with; the skill
 *   the evidence has shown least first. Only such an exercise's runs can meet the
 *   requirement, so no other is offered as what the lesson asks for (E0 never
 *   widens what earns evidence). A skill none of the rung's exercises serves is
 *   the reader's (as shipped the reading rows are the reader's): neither slot
 *   claims it.
 * - `reads`: always the reader's.
 */
function wantsOf(ctx: SlotContext, rung: Lesson, songs: 'any' | 'none'): Want[] {
  const out: Want[] = [];
  const own = (ids: readonly string[]): CatalogItem[] =>
    ids.map((id) => ctx.catalog.byId.get(id)).filter((item): item is CatalogItem => item !== undefined && !isReadingRow(item));
  const skillWants: Want[] = [];
  for (const reading of readingsOf(ctx, rung)) {
    if (reading.holds !== false) continue;
    const r = reading.requirement;
    let pool: CatalogItem[];
    let skill: string | undefined;
    if (r.kind === 'runs') {
      if (songs === 'none' && r.from === 'songs') continue;
      const base =
        r.from === 'exercises' ? rung.exerciseOptions : r.from === 'songs' ? rung.songOptions : [...rung.exerciseOptions, ...rung.songOptions];
      const named = r.items === undefined ? null : new Set(r.items);
      pool = own(base.filter((id) => (named === null || named.has(id)) && !reading.items.includes(id)));
    } else if (r.kind === 'done') {
      pool = own([r.item]);
    } else if (r.kind === 'measure') {
      pool = own(rung.exerciseOptions).filter((item) => item.drill?.kind === r.measure);
    } else if (r.kind === 'skill') {
      skill = r.skill;
      const learner = learnerAt(ctx, rung);
      const activation = ctx.input.skillActivation ?? SHIPPED_SKILL_ACTIVATION;
      pool = own(rung.exerciseOptions).filter(
        (item) => isExerciseKind(item) && eligible(gate(ctx, item, learner, { for: 'requirement', skill: r.skill, activation })),
      );
    } else {
      continue;
    }
    if (songs === 'none') pool = pool.filter((item) => !isPieceMaterial(item));
    if (pool.length === 0) continue;
    const want: Want = { rung, reading, ...(skill === undefined ? {} : { skill }), pool, offer: pool.filter((item) => usable(ctx, item, songs)) };
    if (skill === undefined) out.push(want);
    else skillWants.push(want);
  }
  // The skills first, the one the evidence has shown least first (the brief's item 1): a skill below its
  // standard, and among those the fewest supporting records in the retention span.
  const shownLeast = (want: Want): number => (want.skill === undefined ? 0 : (ctx.skills.get(want.skill)?.recentSupported ?? 0));
  skillWants.sort((a, b) => shownLeast(a) - shownLeast(b));
  return [...skillWants, ...out];
}

function askedClaim(want: Want, next: boolean, strand: Strand, extra: { waitsForReads?: boolean } = {}): SlotClaim {
  return {
    kind: 'asked',
    rung: want.rung,
    next,
    requirement: want.reading.requirement,
    have: want.reading.have,
    need: want.reading.need,
    ...(want.skill === undefined ? {} : { skill: want.skill }),
    ...(extra.waitsForReads ? { waitsForReads: true } : {}),
    ...(strand.title === undefined ? {} : { strand: strand.title }),
    ...(!next && PROJECT_STAGES.has(strand.stage) ? { project: true as const } : {}),
  };
}

/** Whether what is unmet on the rung is only what the reader serves (its reads and its skills). */
function waitsForReads(ctx: SlotContext, rung: Lesson): boolean {
  const unmet = readingsOf(ctx, rung).filter((reading) => reading.holds === false);
  return unmet.length > 0 && unmet.every((reading) => reading.requirement.kind === 'reads' || reading.requirement.kind === 'skill');
}

/**
 * Items no requirement of the learner's rung has counted before those it has,
 * each in its own order: a slot never offers what the evidence says is met
 * while something the rung asks for waits (C6 item 9). The review's order is
 * the other way round: what was counted is what can be reviewed.
 */
function uncountedFirst(ctx: SlotContext, items: CatalogItem[]): CatalogItem[] {
  const counted = countedOnStrands(ctx);
  return [...items.filter((item) => !counted.has(item.id)), ...items.filter((item) => counted.has(item.id))];
}

/** Every item a requirement of a strand's rung has counted. */
function countedOnStrands(ctx: SlotContext): Set<string> {
  return new Set(ctx.strands.flatMap((strand) => readingsOf(ctx, strand.rung).flatMap((reading) => reading.items)));
}

/** A chosen item, where it was offered from, and why. */
interface Choice {
  item: CatalogItem;
  claim: SlotClaim;
  lessonId?: string;
  phrase?: SessionSlot['phrase'];
  /** The strand it came from, where one asked: so the next slot can serve another. */
  strand?: string;
}

/**
 * The phrase a skill-retention review writes (C6): a reading row the skill was
 * shown on, with the control that writes one of the skill's demands into every
 * phrase where the row does not already (C4b's map, read through the reader's
 * own `moveFor`, which checks the contract), held to what the learner's rung
 * has taught. Without it the review could say the bass clef has not been shown
 * and offer a phrase that cannot show it — the intermediate of the thirty days
 * was told "Shifting position" six mornings running over 2.2's row held inside
 * C position. `undefined` where no demand of the skill can be written here.
 */
function retentionPhrase(ctx: SlotContext, item: CatalogItem, skill: string): SessionSlot['phrase'] | undefined {
  const vocabulary = ctx.input.vocabulary ?? VOCABULARY_V0;
  const rung = ctx.position?.lesson.id;
  const hold = taughtAtRung(ctx.input.curriculum, rung, vocabulary);
  const move: MoveContext = { item, working: recipe(item.id, {}), rung, options: (value) => readingOptions(item, value, undefined, hold) };
  const at = (value: ReadingRecipe): SessionSlot['phrase'] => ({ recipe: value, ...(rung === undefined ? {} : { rung }) });
  const demands = vocabulary.demands.filter((demand) => demand.copedWithBy === skill);
  // A skill read over every step (sight-reading) is in every phrase.
  if (demands.length === 0) return at(move.working);
  for (const demand of demands) {
    if (hold !== undefined && !hold(demand.id)) continue;
    const control = READING_CONTROLS[demand.id];
    const patch = control?.on(move.options(move.working));
    if (!control || !patch) continue;
    // The row already writes it into every phrase: its own recipe.
    if (recipeKey(recipe(item.id, withMoves(item, {}, patchToMoves(patch)))) === recipeKey(move.working)) return at(move.working);
    const on = moveFor(move, demand.id, 'on');
    if (on) return at(on.recipe);
  }
  return undefined;
}

/**
 * The fallback ladder (`FALLBACK_ORDER`), from the learner's rung: each claim
 * weaker than the one before, the first that finds an item wins.
 *
 * `want` is the skill the slot's first claim was after, where it had one: the
 * target-skill and demand steps look for it, and are skipped without one.
 * `order` sorts a step's candidates for the slot (the review prefers what the
 * rung has counted; the repertoire slot what the learner has not learned).
 */
function fallback(
  ctx: SlotContext,
  songs: 'any' | 'none' | 'only',
  want: { skill?: string; strand?: Strand } | undefined,
  order: (items: CatalogItem[]) => CatalogItem[],
  onCard: readonly Choice[] = [],
): Choice | undefined {
  // The strand whose ask failed; otherwise the strands in today's order, one not yet on the card first.
  const strands = want?.strand
    ? [want.strand]
    : [...ctx.strands.filter((one) => !servedBy(onCard, one)), ...ctx.strands.filter((one) => servedBy(onCard, one))];
  // Each step over every strand before the next step (the reviewer's correction, 2026-09-26): a rung
  // option on the second strand in today's order is a stronger claim than exposure on the first, and
  // exposure — generic breadth — is tried once, last, never ahead of a semantic claim.
  for (const step of FALLBACK_ORDER) {
    for (const strand of step === 'exposure' || strands.length === 0 ? [strands[0]] : strands) {
      const found = fallbackStep(ctx, songs, want, order, strand, step);
      if (found) return found;
    }
  }
  return undefined;
}

/** Whether a choice already on the card came from this strand's rungs. */
function servedBy(onCard: readonly Choice[], strand: Strand): boolean {
  return onCard.some((choice) => choice.strand === strand.track);
}

function fallbackStep(
  ctx: SlotContext,
  songs: 'any' | 'none' | 'only',
  want: { skill?: string } | undefined,
  order: (items: CatalogItem[]) => CatalogItem[],
  strand: Strand | undefined,
  step: (typeof FALLBACK_ORDER)[number],
): Choice | undefined {
  const rung = strand?.rung;
  const vocabulary = ctx.input.vocabulary ?? VOCABULARY_V0;
  /** Items listed by a rung the learner has reached: taught material, in the curriculum's order. */
  const taught: CatalogItem[] = [];
  const seen = new Set<string>();
  for (const walked of ctx.reached) {
    for (const id of [...walked.lesson.exerciseOptions, ...walked.lesson.songOptions]) {
      if (seen.has(id)) continue;
      seen.add(id);
      const item = ctx.catalog.byId.get(id);
      if (item) taught.push(item);
    }
  }
  const choose = (items: CatalogItem[], claim: (item: CatalogItem) => SlotClaim, lessonId?: (item: CatalogItem) => string | undefined): Choice | undefined => {
    const offer = order(items.filter((item) => usable(ctx, item, songs)));
    const item = pick(offer, ctx.seed);
    if (!item) return undefined;
    const from = lessonId?.(item);
    return { item, claim: claim(item), ...(from === undefined ? {} : { lessonId: from }) };
  };
  {
    let found: Choice | undefined;
    if (step === 'rung' && rung) {
      const own = [...rung.exerciseOptions, ...rung.songOptions].map((id) => ctx.catalog.byId.get(id)).filter((item): item is CatalogItem => item !== undefined);
      found = choose(own, () => ({ kind: 'rung', rung, ...(strand?.title === undefined ? {} : { strand: strand.title }) }), () => rung.id);
    } else if (step === 'skill' && rung && want?.skill !== undefined) {
      // Practice of the skill the rung asks for, through the one gate (E0): declared, its opportunity in
      // the notes, nothing the learner cannot cope with. Practice, never credit: the claim says it trains it.
      const skill = want.skill;
      const activation = ctx.input.skillActivation ?? SHIPPED_SKILL_ACTIVATION;
      const learner = learnerAt(ctx, rung);
      found = choose(
        taught.filter((item) => eligible(gate(ctx, item, learner, { for: 'skill', skill, activation }))),
        () => ({ kind: 'skill', skill, rung }),
        (item) => listingIn(ctx, item),
      );
    } else if (step === 'demand' && rung && want?.skill !== undefined) {
      // An item providing, at a useful density, a demand of the skill the rung asks for (E0): never one
      // that only contains it, and never one bringing a demand the learner cannot cope with.
      const demands = vocabulary.demands.filter((d) => d.copedWithBy === want.skill).map((d) => d.id);
      const learner = learnerAt(ctx, rung);
      const practised = (item: CatalogItem): string | undefined =>
        demands.find((demand) => eligible(gate(ctx, item, learner, { for: 'demand', demand })));
      found = choose(
        taught.filter((item) => practised(item) !== undefined),
        (item) => ({ kind: 'demand', demand: practised(item) as string, rung }),
        (item) => listingIn(ctx, item),
      );
    } else if (step === 'prerequisite' && rung) {
      for (const id of rung.prerequisites ?? []) {
        const before = ctx.walk.find((walked) => walked.lesson.id === id)?.lesson;
        if (!before) continue;
        const own = [...before.exerciseOptions, ...before.songOptions].map((one) => ctx.catalog.byId.get(one)).filter((item): item is CatalogItem => item !== undefined);
        found = choose(own, () => ({ kind: 'prerequisite', rung: before, of: rung }), () => before.id);
        if (found) break;
      }
    } else if (step === 'exposure') {
      // Generic breadth, not the strand's: nothing of the strand is claimed.
      return songs === 'only' ? exposure(ctx, 'songs') : (exposure(ctx, 'kinds') ?? (songs === 'any' ? exposure(ctx, 'songs') : undefined));
    }
    return found && strand ? { ...found, strand: strand.track } : found;
  }
}

/** The reached rung listing an item, latest first: where an item drawn from taught material was offered from. */
function listingIn(ctx: SlotContext, item: CatalogItem): string | undefined {
  for (let i = ctx.reached.length - 1; i >= 0; i -= 1) {
    const lesson = (ctx.reached[i] as Walked).lesson;
    if (lesson.exerciseOptions.includes(item.id) || lesson.songOptions.includes(item.id)) return lesson.id;
  }
  return undefined;
}

/**
 * Orientation items, which are not material to keep warm: the checklist, the
 * tour, the placement test. Each is done once, for its own rung.
 */
const ORIENTATION_KINDS = new Set(['checklist', 'walkthrough', 'placement']);

/**
 * Which families the exposure rule balances over:
 *
 * - `kinds` — the kinds of exercise the learner has been taught (`drill.kind`:
 *   scales, rhythm drills, hearing chords, reading notes…), L26's domains as
 *   far as the catalog names them;
 * - `songs` — every song taught: each track's (a song's style, from the rung
 *   listing it), and the core lessons before the learner's as one family.
 *
 * (A `tracks` family of the styles alone served the repertoire row's
 * week-unplayed pre-pass, removed with it on 2026-09-26.)
 */
type Families = 'kinds' | 'songs';

/**
 * The exposure rule (C6; L26; the plan's balance rule): among the families of
 * material the learner has been taught — the options of every rung reached on
 * the tracks switched on, the learner's own rung's songs left to the rung —
 * the family played least lately, and in it an item played least lately.
 * Never played comes first, then the longest since; among the never played,
 * the family and the item the latest rung teaches first (the nearest to where
 * the learner is), and a piece not yet learned before one learned. A family
 * already on today's card is not "not seen lately". Not remediation: nothing
 * here reads a weakness.
 *
 * The fallback ladder's last step, and — in the warm-up, when no strand asks
 * anything a warm-up serves — the brief's exposure choice; never ahead of a
 * semantic claim. Until the reviewer's correction of 2026-09-26 a week-unplayed
 * family (`EXPOSURE_DAYS`) took the review and the repertoire row straight
 * after their own claims, before the ladder's rung, skill, demand and
 * prerequisite steps; that pre-pass and the constant are gone. A reserved share
 * of breadth, if the product wants one, is the composed session's policy
 * (L32), not a selector's.
 */
function exposure(ctx: SlotContext, families: Families): Choice | undefined {
  const here = new Set(ctx.strands.map((strand) => strand.rung.id));
  const found = new Map<string, { family: ExposureFamily; items: { item: CatalogItem; from: string; at: number }[]; last?: string; latest: number }>();
  const titleOf = (track: string): string => ctx.input.curriculum.tracks.find((t) => t.id === track)?.title ?? track;
  ctx.reached.forEach((walked, at) => {
    for (const id of [...walked.lesson.exerciseOptions, ...walked.lesson.songOptions]) {
      const item = ctx.catalog.byId.get(id);
      // The exposure rule keeps a kind of exercise or an earlier rung's songs warm; an excerpt is
      // neither (E1: retention keeps to songs), so it is no exposure family's.
      if (!item || isReadingRow(item) || !playable(item) || isExcerpt(item)) continue;
      let family: ExposureFamily | undefined;
      if (item.type !== 'song') {
        const kind = item.drill?.kind ?? 'study';
        if (families === 'kinds' && !ORIENTATION_KINDS.has(kind)) family = { by: 'kind', id: kind };
      } else if (families === 'songs' && !here.has(walked.lesson.id)) {
        family = walked.track === 'core' ? { by: 'earlier', id: 'earlier' } : { by: 'track', id: walked.track, title: titleOf(walked.track) };
      }
      if (!family) continue;
      const key = `${family.by}:${family.id}`;
      const entry = found.get(key) ?? { family, items: [], latest: -1 };
      if (!entry.items.some((one) => one.item.id === item.id)) entry.items.push({ item, from: walked.lesson.id, at });
      entry.latest = Math.max(entry.latest, at);
      const played = ctx.lastPlayed(item.id);
      if (played !== undefined && (entry.last === undefined || played > entry.last)) entry.last = played;
      found.set(key, entry);
    }
  });
  const ranked = [...found.values()]
    .filter((entry) => entry.items.some((one) => usable(ctx, one.item, 'any')))
    .filter((entry) => !entry.items.some((one) => ctx.used.has(one.item.id)))
    .sort((a, b) => (a.last ?? '').localeCompare(b.last ?? '') || b.latest - a.latest);
  const entry = pick(ranked, ctx.seed);
  if (!entry) return undefined;
  const chosen = entry.items
    .filter((one) => usable(ctx, one.item, 'any'))
    .sort(
      (a, b) =>
        (ctx.learned.has(a.item.id) ? 1 : 0) - (ctx.learned.has(b.item.id) ? 1 : 0) ||
        (ctx.lastPlayed(a.item.id) ?? '').localeCompare(ctx.lastPlayed(b.item.id) ?? '') ||
        b.at - a.at,
    )[0];
  if (!chosen) return undefined;
  return { item: chosen.item, claim: { kind: 'exposure', family: entry.family, ...(entry.last === undefined ? {} : { lastPlayed: entry.last }) }, lessonId: chosen.from };
}

/**
 * The warm-up (C6 item 1): from the rung's exercises, the one its unmet
 * requirements ask for — an exercise training a skill a requirement names, the
 * skill the evidence has shown least first; else one its runs, done or measure
 * requirements count and have not counted, in the lesson's order. Never the
 * rung's reading row, nor any reading row (L65: a warm-up is not a sight-read,
 * and the reading slot is the reader's). When the rung asks nothing a warm-up
 * serves, the next rung's; when that asks nothing either, the exposure rule.
 * When the rung asks something and no exercise of its can be offered, the
 * fallback ladder.
 */
function warmup(ctx: SlotContext, phase: Phase): Choice | undefined {
  const wanting = ctx.strands.map((strand) => ({ strand, wants: wantsOf(ctx, strand.rung, 'none') }));
  if (phase === 'fallback') {
    const stuck = wanting.find((one) => one.wants.length > 0);
    return stuck ? fallback(ctx, 'none', { ...(stuck.wants[0]?.skill === undefined ? {} : { skill: stuck.wants[0]?.skill }), strand: stuck.strand }, (items) => uncountedFirst(ctx, items)) : undefined;
  }
  for (const { strand, wants } of wanting) {
    for (const want of wants) {
      const item = pick(want.offer, ctx.seed);
      if (item) return { item, claim: askedClaim(want, false, strand), lessonId: strand.rung.id, strand: strand.track };
    }
  }
  // A strand asking something no exercise of its can be offered for waits for the fallback pass.
  if (wanting.some((one) => one.wants.length > 0)) return undefined;
  for (const { strand } of wanting) {
    if (!strand.after) continue;
    for (const want of wantsOf(ctx, strand.after, 'none')) {
      const item = pick(want.offer, ctx.seed);
      if (item) return { item, claim: askedClaim(want, true, strand), lessonId: strand.after.id, strand: strand.track };
    }
  }
  return exposure(ctx, 'kinds');
}

/**
 * New (C6 item 3): a strand's next unmet requirement's item, in the order its
 * lesson states them — a strand the card does not serve yet first, so no one
 * track takes the warm-up, the new piece and the repertoire (the
 * parallel-strand finding); within a strand, a requirement the warm-up already
 * serves gives way to the next. Where what is left on a strand's rung is its
 * reads, that strand's next lesson's first, said as such — never out of a
 * stage into a project. Otherwise the fallback ladder.
 */
function fresh(ctx: SlotContext, onCard: readonly Choice[], phase: Phase): Choice | undefined {
  const strands = [...ctx.strands.filter((one) => !servedBy(onCard, one)), ...ctx.strands.filter((one) => servedBy(onCard, one))];
  if (phase === 'fallback') {
    const first = strands.map((strand) => ({ strand, wants: wantsOf(ctx, strand.rung, 'any') })).find((one) => one.wants.length > 0);
    return fallback(ctx, 'any', first ? { ...(first.wants[0]?.skill === undefined ? {} : { skill: first.wants[0]?.skill }), strand: first.strand } : undefined, (items) => uncountedFirst(ctx, items), onCard);
  }
  const served = (want: Want): boolean => onCard.some((choice) => want.pool.some((item) => item.id === choice.item.id));
  for (const strand of strands) {
    const wants = wantsOf(ctx, strand.rung, 'any');
    for (const want of [...wants.filter((want) => !served(want)), ...wants.filter(served)]) {
      const item = pick(want.offer, ctx.seed);
      if (item) return { item, claim: askedClaim(want, false, strand), lessonId: strand.rung.id, strand: strand.track };
    }
  }
  for (const strand of strands) {
    if (!strand.after || wantsOf(ctx, strand.rung, 'any').length > 0) continue;
    for (const want of wantsOf(ctx, strand.after, 'any')) {
      if (served(want)) continue;
      const item = pick(want.offer, ctx.seed);
      if (item) return { item, claim: askedClaim(want, true, strand, waitsForReads(ctx, strand.rung) ? { waitsForReads: true } : {}), lessonId: strand.after.id, strand: strand.track };
    }
  }
  return undefined;
}

/**
 * Review (C6 item 2): two reasons, and the line says which.
 *
 * - **Skill retention**: a skill whose evidence the reads have not shown for
 *   the ladder's `RETENTION_DAYS` (`notShownRecently`), a skill not yet
 *   retained before one that has come back after a gap once; the item is a
 *   reading row the skill was shown on before (every generated phrase is
 *   new, so this is never the same phrase twice: S8 stands).
 * - **Repertoire retention**: a learned piece (a song passed or mastered) not
 *   played for `REPERTOIRE_WINDOW_DAYS`, however recently its skills were
 *   shown elsewhere. A scale or a drill passed is technique, which the
 *   exposure rule keeps warm, not a piece to keep playable.
 *
 * Whichever is further past its own span first; Shuffle reaches the rest.
 * Nothing due for either: the fallback ladder — a strand's rung (its counted
 * items first), a prerequisite rung's option, and the exposure rule last.
 */
function review(ctx: SlotContext, phase: Phase, onCard: readonly Choice[]): Choice | undefined {
  if (phase === 'fallback') {
    const counted = countedOnStrands(ctx);
    return fallback(ctx, 'any', undefined, (items) => [...items.filter((item) => counted.has(item.id)), ...items.filter((item) => !counted.has(item.id))], onCard);
  }
  interface Due {
    item: CatalogItem;
    phrase?: SessionSlot['phrase'];
    claim: SlotClaim;
    over: number;
    retained: boolean;
    skill: boolean;
  }
  const due: Due[] = [];
  for (const [skill, evidence] of ctx.skills) {
    if (!evidence.reading.notShownRecently || evidence.lastSupport === undefined) continue;
    const rows = [...evidence.supportedOn.entries()]
      .sort((a, b) => b[1].localeCompare(a[1]))
      .map(([id]) => ctx.catalog.byId.get(id))
      .filter((item): item is CatalogItem => item !== undefined && isReadingRow(item) && playable(item) && !ctx.used.has(item.id));
    const found = rows.map((row) => ({ row, phrase: retentionPhrase(ctx, row, skill) })).find((one) => one.phrase !== undefined);
    if (!found) continue;
    const item = found.row;
    due.push({
      item,
      ...(found.phrase ? { phrase: found.phrase } : {}),
      claim: { kind: 'skill-retention', skill, lastShown: evidence.lastSupport },
      over: (daysSince(evidence.lastSupport, ctx.today) ?? 0) - RETENTION_DAYS,
      retained: evidence.reading.retained,
      skill: true,
    });
  }
  for (const piece of ctx.learned.values()) {
    const item = ctx.catalog.byId.get(piece.itemId);
    // A piece: a scale or a drill passed is technique, kept warm by the exposure rule, not "a piece to keep playable".
    if (!usable(ctx, item, 'only')) continue;
    const since = daysSince(piece.lastPlayed, ctx.today);
    if (since === undefined || since < REPERTOIRE_WINDOW_DAYS) continue;
    due.push({ item, claim: { kind: 'piece-retention', lastPlayed: piece.lastPlayed }, over: since - REPERTOIRE_WINDOW_DAYS, retained: false, skill: false });
  }
  due.sort((a, b) => Number(a.retained) - Number(b.retained) || b.over - a.over || Number(b.skill) - Number(a.skill));
  const chosen = pick(due, ctx.seed);
  // A due retention need may outrank the lesson's work: it is forgetting. Nothing due: the ladder, in
  // the fallback pass, with exposure last (the reviewer's correction, 2026-09-26).
  return chosen ? { item: chosen.item, claim: chosen.claim, ...(chosen.phrase ? { phrase: chosen.phrase } : {}) } : undefined;
}

/**
 * Repertoire (C6 item 4): a piece the one gate passes (E0, `eligibility.ts`) as
 * practice of a demand a strand's rung teaches — the piece provides it at a useful
 * density, and the learner's skills support every demand it measures (familiar or
 * better). No rung judges a piece chosen from the whole catalogue, so what the
 * lessons have taught does not stand in for the evidence here: "your reads support
 * them" stays true. Among those, the nearest in level to the rung's band first:
 * level orders, and rescues nothing. Then the fallback ladder — a strand's rung
 * song, a prerequisite rung's, a piece not yet counted or learned before one that
 * is — and the exposure rule over the songs taught last. A mastered piece is still
 * "a piece you know" (L18), but it is no longer offered every session (L17):
 * keeping it playable is the review's repertoire retention.
 */
function repertoire(ctx: SlotContext, phase: Phase, onCard: readonly Choice[]): Choice | undefined {
  if (phase === 'fallback') {
    return fallback(
      ctx,
      'only',
      undefined,
      (items) => {
        const order = uncountedFirst(ctx, items);
        return [...order.filter((item) => !ctx.learned.has(item.id)), ...order.filter((item) => ctx.learned.has(item.id))];
      },
      onCard,
    );
  }
  const vocabulary = ctx.input.vocabulary ?? VOCABULARY_V0;
  // The evidence alone: no rung judges a piece chosen from the whole catalogue.
  const learner: Learner = learnerAt(ctx, undefined);
  const ready: { item: CatalogItem; demand: string; distance: number }[] = [];
  for (const strand of ctx.strands) {
    // What the strand's rung teaches (E0b: `taughtAt` lists every rung that teaches a demand).
    const edges = vocabulary.demands.filter((d) => d.taughtAt.includes(strand.rung.id)).map((d) => d.id);
    if (edges.length === 0) continue;
    const [low, high] = strand.rung.levelBand ?? [strand.stage, strand.stage + 0.99];
    for (const item of ctx.input.items) {
      if (!usable(ctx, item, 'only') || ready.some((one) => one.item.id === item.id)) continue;
      const demand = edges.find((one) => eligible(gate(ctx, item, learner, { for: 'demand', demand: one })));
      if (demand === undefined) continue;
      ready.push({ item, demand, distance: item.level < low ? low - item.level : item.level > high ? item.level - high : 0 });
    }
  }
  ready.sort((a, b) => a.distance - b.distance || levelOrder(a.item, b.item));
  const chosen = pick(ready, ctx.seed);
  return chosen ? { item: chosen.item, claim: { kind: 'ready', demand: chosen.demand } } : undefined;
}

/** A judged level before an estimated one, then the catalogue's id order: a stable order among equals. */
function levelOrder(a: CatalogItem, b: CatalogItem): number {
  return (a.levelSource === 'estimated' ? 1 : 0) - (b.levelSource === 'estimated' ? 1 : 0) || a.id.localeCompare(b.id);
}

/** The tracks whose rungs are about playing from chords, form and feel. */
const JAM_TRACKS = new Set(['chords-pop', 'blues-boogie', 'jazz', 'jam']);

/**
 * Jam: an option of a rung on a jam track the learner has reached — the
 * learner's own rung first where it is one — played least lately. It was any
 * item on those tracks at or below the stage number plus one; before any jam
 * rung is reached there is no jam row. The options pass `usable`, so a groove a
 * jam rung lists is the jam only once its teaching use is approved (D3b); with
 * nothing else on the reached jam rungs there is no jam row.
 */
function jam(ctx: SlotContext, phase: Phase): Choice | undefined {
  if (phase === 'fallback') return undefined;
  const rungs = ctx.reached.filter((walked) => JAM_TRACKS.has(walked.track)).map((walked) => walked.lesson).reverse();
  for (const lesson of rungs) {
    const offer = [...lesson.exerciseOptions, ...lesson.songOptions]
      .map((id) => ctx.catalog.byId.get(id))
      .filter((item): item is CatalogItem => usable(ctx, item, 'any'))
      .map((item, at) => ({ item, at }))
      .sort((a, b) => (ctx.lastPlayed(a.item.id) ?? '').localeCompare(ctx.lastPlayed(b.item.id) ?? '') || a.at - b.at)
      .map((one) => one.item);
    const item = pick(offer, ctx.seed);
    if (item) return { item, claim: { kind: 'jam', rung: lesson }, lessonId: lesson.id };
  }
  return undefined;
}

/**
 * Two passes: every slot's own claim first — the reader's row, what the lesson
 * asks, retention, the exposure rule — and only then the fallback ladder for
 * the slots still empty, so a fallback never takes what a claim asked for. A
 * review with nothing due is the weakest of the fallbacks and chooses last.
 */
type Phase = 'claim' | 'fallback';
const CLAIM_ORDER: readonly SlotKind[] = ['sightreading', 'technique', 'new', 'review', 'repertoire', 'jam', 'free'];
const FALLBACK_FILL_ORDER: readonly SlotKind[] = ['technique', 'new', 'repertoire', 'review', 'jam'];

/**
 * Today's session card (docs/04 §2).
 *
 * Every slot is chosen from what the evidence supports and what the rung asks
 * next (C6), and its reason line says which, or claims only the rung. Slots
 * choose strongest claim first — the reader's row, then the warm-up and the
 * new slot, which the rung asks for, then review and repertoire, whose
 * fallbacks take what is left — and are shown in the template's order. No
 * item is used twice, and a row that finds nothing is dropped.
 */
export function buildSession(input: BuildInput): {
  template: SessionTemplate;
  slots: SessionSlot[];
  /** The rungs the learner has reached (placed on or passed), for the swap sheet's gate (E0a). */
  reached: string[];
} {
  const template = templateFor(input.minutes);
  const position = readerPosition(input.curriculum, input.states, input.activeTracks, {
    ...(input.strictPrerequisites ? { strictPrerequisites: true } : {}),
    ...(input.startAt === undefined ? {} : { startAt: input.startAt }),
  });
  const today = input.today ?? new Date(0);
  const walk = walkOf(input.curriculum, input.activeTracks);
  const played = input.lastPlayed ?? new Map<string, string>();
  const lastPlayed = (id: string): string | undefined => {
    const value = played.get(id);
    return value === undefined || value === '' ? undefined : value;
  };
  const { strands, reached } = strandsOf({ input, walk, lastPlayed });
  const ctx: SlotContext = {
    input,
    catalog: input.catalog,
    position,
    walk,
    strands,
    reached,
    skills: skillEvidenceOf(input.rows ?? input.readingRows ?? [], input.vocabulary ?? VOCABULARY_V0, today),
    learned: new Map((input.learned ?? []).map((piece) => [piece.itemId, piece])),
    lastPlayed,
    today,
    used: new Set<string>(),
    seed: input.seed ?? 0,
  };

  const filled = new Map<number, { item?: CatalogItem; claim?: SlotClaim; lessonId?: string; reading?: ReadingOffer; phrase?: SessionSlot['phrase']; reason: string }>();
  const chosen: Choice[] = [];
  const indexed = template.slots.map((slot, slotIndex) => ({ slot, slotIndex }));
  const inOrder = (order: readonly SlotKind[]): typeof indexed =>
    indexed
      .filter(({ slot }) => order.includes(slot.kind))
      .sort((a, b) => order.indexOf(a.slot.kind) - order.indexOf(b.slot.kind) || a.slotIndex - b.slotIndex);
  const choose = (kind: SlotKind, phase: Phase): Choice | undefined =>
    kind === 'technique'
      ? warmup(ctx, phase)
      : kind === 'new'
        ? fresh(ctx, chosen, phase)
        : kind === 'review'
          ? review(ctx, phase, chosen)
          : kind === 'repertoire'
            ? repertoire(ctx, phase, chosen)
            : jam(ctx, phase);
  const keep = (slotIndex: number, kind: SlotKind, choice: Choice): void => {
    ctx.used.add(choice.item.id);
    chosen.push(choice);
    const known = kind === 'repertoire' && ctx.learned.get(choice.item.id)?.status === 'mastered';
    filled.set(slotIndex, {
      item: choice.item,
      claim: choice.claim,
      ...(choice.lessonId === undefined ? {} : { lessonId: choice.lessonId }),
      ...(choice.phrase ? { phrase: choice.phrase } : {}),
      reason: slotReason(kind, choice.claim, today, { known }),
    });
  };
  for (const { slot, slotIndex } of inOrder(CLAIM_ORDER)) {
    if (slot.kind === 'free') {
      filled.set(slotIndex, { reason: slotReason('free', undefined, today) });
      continue;
    }
    if (slot.kind === 'sightreading') {
      const reading = readingSlot(ctx, slotIndex);
      if (reading) {
        ctx.used.add(reading.item.id);
        filled.set(slotIndex, reading);
      }
      continue;
    }
    const choice = choose(slot.kind, 'claim');
    if (choice) keep(slotIndex, slot.kind, choice);
  }
  for (const { slot, slotIndex } of inOrder(FALLBACK_FILL_ORDER)) {
    if (filled.has(slotIndex)) continue;
    const choice = choose(slot.kind, 'fallback');
    if (choice) keep(slotIndex, slot.kind, choice);
  }

  const slots: SessionSlot[] = [];
  let breakAfter = template.breakAfterSlot;
  template.slots.forEach((slot, slotIndex) => {
    const one = filled.get(slotIndex);
    // A row with nothing in it is worse than no row: it is a hole the learner
    // has to fill by hand, which is the thing this card exists to avoid. Free
    // play is the exception — it never has an item and is a prompt, not a
    // piece.
    if (!one || (!one.item && slot.kind !== 'free')) {
      if (breakAfter !== undefined && slotIndex < breakAfter) breakAfter -= 1;
      return;
    }
    slots.push({
      kind: slot.kind,
      minutes: slot.minutes,
      ...(one.item ? { item: one.item } : {}),
      ...(one.lessonId ? { lessonId: one.lessonId } : {}),
      reason: one.reason,
      ...(one.claim ? { claim: one.claim } : {}),
      ...(one.reading ? { reading: one.reading } : {}),
      ...(one.phrase ? { phrase: one.phrase } : {}),
    });
  });
  return {
    template: breakAfter === template.breakAfterSlot ? template : { ...template, ...(breakAfter === undefined ? {} : { breakAfterSlot: breakAfter }) },
    slots,
    reached: reached.map((walked) => walked.lesson.id),
  };
}

/**
 * The reading slot: the reader's phrase (C4), where it used to be any reading
 * row at or below the stage by catalog order — level 3 every day at Stages 5-9
 * and level 1 at Stage 4 (the sight-reading trace, P1-a) — plus the rung's own
 * (T37). The same rule as the daily read, with a phrase of its own. Before any
 * rung that lists a reading row there is no slot, as there was none. Chosen
 * first, so no other slot can take the row (L65).
 */
function readingSlot(ctx: SlotContext, slotIndex: number): { item: CatalogItem; lessonId?: string; reason: string; reading: ReadingOffer } | undefined {
  const today = ctx.today;
  const offer = readingOffer({
    curriculum: ctx.input.curriculum,
    items: ctx.input.items,
    position: ctx.position,
    activeTracks: ctx.input.activeTracks,
    rows: ctx.input.readingRows ?? [],
    today,
    purpose: 'slot',
    // Shuffle's counter, offset by the slot's place as it always was, so a card's phrase is the one it was.
    shuffle: ctx.seed + slotIndex,
  });
  if (!offer || !offer.anchored || ctx.used.has(offer.item.id) || !playable(offer.item)) return undefined;
  return {
    item: offer.item,
    ...(offer.lessonId === undefined ? {} : { lessonId: offer.lessonId }),
    reason: readingReason(offer.why, 'slot', today),
    reading: offer,
  };
}

/** Which tier of "Swap this" an option came from (`selectors.tieredAlternatives`), or `kind`, the sheet's last. */
export interface SwapOption {
  item: CatalogItem;
  tier: AlternativeTier | 'kind';
  /** The skill or demand the tier shares, for its words. */
  shared?: string;
}

/**
 * What "Swap this" offers for one row (docs/04 §2; C6 item 6).
 *
 * The tiers are `tieredAlternatives`'s — the same lesson, a stand-in the
 * item's author named, an item that also trains the row's target skill, one
 * that also practises a demand the row exists for — and each option says which
 * tier it came from, which the sheet prints. Two things a session row knows
 * that a lesson does not: what is already on today's card (never offered
 * twice), and whether a song makes sense in the slot at all. Every option goes
 * through the one gate (E0, `eligibility.ts`) with the learner's rung — what its
 * ancestry has taught, and what the rungs the learner has reached taught them
 * (E0a) — and, where the caller has them, the learner's skill states: it
 * replaced the untaught-demand filter that stood here, which is the gate's
 * first question.
 *
 * With nothing in any tier, the last resort is no longer "the same type within
 * one level" but the same kind of exercise — or, for a song, a song — from the
 * lessons the learner has reached (`kind`), which the sheet names as such, and
 * which passes the same gate as an equivalent.
 */
export function swapOptions(
  slot: SessionSlot,
  slots: SessionSlot[],
  curriculum: Curriculum,
  catalog: CatalogIndex,
  options: {
    excludeSongs?: boolean;
    items?: CatalogItem[];
    rung?: string;
    activeTracks?: readonly string[];
    vocabulary?: Vocabulary;
    /** Whose declared target skills the skill tier reads (D0; `skillActivation.ts`). */
    skillActivation?: SkillActivation;
    /** The learner's ladder state per skill, where the caller has the evidence (the gate's first question). */
    skillState?: (skill: string) => LadderState | undefined;
    /** Or the stored runs to read it from, as the session does (`rows`, with the morning it is read on). */
    rows?: readonly SessionRow[];
    today?: Date;
    /** The ladder state at which a skill supports its demands (`BuildInput.readinessFloor`). */
    readinessFloor?: LadderState;
    /**
     * The rungs the learner has reached, as the session reads them (`buildSession`'s
     * `reached`): what they taught counts as taught for this learner (E0a).
     */
    reached?: readonly string[];
  } = {},
): SwapOption[] {
  if (!slot.item) return [];
  const source = slot.item;
  const vocabulary = options.vocabulary ?? VOCABULARY_V0;
  const excludeSongs = options.excludeSongs ?? slot.kind === 'technique';
  const exclude = slots.map((other) => other.item?.id).filter((id): id is string => Boolean(id));
  const taught = options.rung === undefined ? undefined : taughtAtRung(curriculum, options.rung, vocabulary, options.reached);
  // The learner's skills from their stored runs, the session's own reading (`skillEvidenceOf`), where given.
  const evidence = options.rows === undefined ? undefined : skillEvidenceOf(options.rows, vocabulary, options.today ?? new Date());
  const skillState = options.skillState ?? (evidence === undefined ? undefined : (skill: string) => evidence.get(skill)?.reading.state);
  const learner: Learner = {
    ...(taught === undefined ? {} : { taught }),
    ...(skillState === undefined ? {} : { skillState }),
    ...(options.readinessFloor === undefined ? {} : { floor: options.readinessFloor }),
  };
  const fits = (item: CatalogItem): boolean => playable(item) && eligible(eligibleFor(item, learner, { for: 'equivalent' }, vocabulary));
  const tiered: SwapOption[] = tieredAlternatives(
    { itemId: source.id, ...(slot.lessonId ? { lessonId: slot.lessonId } : {}), excludeSongs, exclude },
    curriculum,
    catalog,
    options.skillActivation ?? SHIPPED_SKILL_ACTIVATION,
    learner,
  ).filter((option) => playable(option.item));
  if (tiered.length > 0) return tiered;

  // The last resort: the same kind, from the lessons reached. Without a rung, every rung counts as reached.
  const walk = walkOf(curriculum, options.activeTracks ?? []);
  const at = options.rung === undefined ? walk.length - 1 : walk.findIndex((walked) => walked.lesson.id === options.rung);
  const reached = walk.slice(0, (at < 0 ? walk.length - 1 : at) + 1);
  const skip = new Set([source.id, ...exclude]);
  const out: SwapOption[] = [];
  for (const walked of reached) {
    for (const id of [...walked.lesson.exerciseOptions, ...walked.lesson.songOptions]) {
      const item = catalog.byId.get(id);
      if (!item || skip.has(id) || !fits(item) || isReadingRow(item) !== isReadingRow(source)) continue;
      if (excludeSongs && isPieceMaterial(item)) continue;
      // "The same kind": a song for a song, an excerpt for an excerpt, an exercise of the same drill
      // kind for an exercise — never a passage of a piece for an exercise (E1).
      const same = isPieceMaterial(source)
        ? item.type === source.type
        : isExerciseKind(item) && (item.drill?.kind ?? 'study') === (source.drill?.kind ?? 'study');
      if (!same) continue;
      skip.add(id);
      out.push({ item, tier: 'kind' });
    }
  }
  return out.slice(-12).reverse();
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

export { findLesson };

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

/**
 * Every rung in the file's order. Never what a rung has taught (`rungAncestry`
 * is, E0a): its one reader is the easy move's "newest thing the recipe added"
 * order among demands the learner's rung has taught, all in that rung's
 * ancestry — and every prerequisite, and every core rung of an earlier stage, is
 * stored before the rung it leads to, so on one ancestry the file's order is the
 * order the rungs are met in.
 */
function lessonOrder(curriculum: Curriculum): string[] {
  return curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
}

/** Worked out once per curriculum object: nothing changes a rung or a prerequisite in a session. */
const ANCESTRY = new WeakMap<Curriculum, ReadonlyMap<string, ReadonlySet<string>>>();

/**
 * Every rung's ancestry (E0a; the reviewer's finding 1 on E0): the rungs every
 * learner at it has been through, itself included — what "taught by this rung"
 * is read from. It was the file's order, and the curriculum is not one line:
 * `blues.5` is stored before `jazz.5`, so the walking bass read as taught at
 * `jazz.5` and at every rung stored after it, on every track.
 *
 * - **On the core path**, every core rung before it in stage-and-unit order. The
 *   spine is walked in that order (`nextRecommended`, `strandsOf`), and its
 *   `prerequisites` do not say all of it: 4.6's, followed back, never reach 3.4
 *   (3.5 builds on 3.3, 3.4 on 3.1), 4.7 names none, and Stage 0 is nobody's.
 * - **On a track**, its `prerequisites`, each with its own ancestry, and the core
 *   path up to the rung's stage: a track opens where the spine has reached its
 *   stage (`docs/04` §2), so `jazz.5` stands on the whole core path although its
 *   prerequisites, followed back, leave the core at 3.2. A track's own earlier
 *   rungs count through its prerequisites, never through the file.
 *
 * A prerequisite the curriculum does not have is passed over, as `strandsOf`
 * passes it; a cycle stops rather than loops. `tools/content/claims.py`'s
 * `rung_ancestry` is the build's reading of the same thing, for the rung-claims
 * report's "untaught here".
 */
export function rungAncestry(curriculum: Curriculum): ReadonlyMap<string, ReadonlySet<string>> {
  const known = ANCESTRY.get(curriculum);
  if (known) return known;
  const stages = [...curriculum.stages].sort((a, b) => a.number - b.number);
  const ids = new Set(stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id))));
  const parents = new Map<string, string[]>();
  const core: { stage: number; id: string }[] = [];
  let previous: string | undefined;
  for (const stage of stages) {
    // The last core rung of an earlier stage: where the spine is once a track of this stage opens.
    const spine = [...core].reverse().find((one) => one.stage < stage.number)?.id;
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        const own = (lesson.prerequisites ?? []).filter((id) => ids.has(id) && id !== lesson.id);
        if (unit.track === 'core') {
          parents.set(lesson.id, [...(previous === undefined ? [] : [previous]), ...own]);
          previous = lesson.id;
          core.push({ stage: stage.number, id: lesson.id });
        } else {
          parents.set(lesson.id, [...own, ...(spine === undefined ? [] : [spine])]);
        }
      }
    }
  }
  const out = new Map<string, Set<string>>();
  const visiting = new Set<string>();
  const of = (id: string): Set<string> => {
    const done = out.get(id);
    if (done) return done;
    const found = new Set<string>([id]);
    if (visiting.has(id)) return found;
    visiting.add(id);
    for (const parent of parents.get(id) ?? []) for (const one of of(parent)) found.add(one);
    visiting.delete(id);
    out.set(id, found);
    return found;
  };
  for (const id of parents.keys()) of(id);
  ANCESTRY.set(curriculum, out);
  return out;
}

/**
 * What a rung has taught (E0a): a demand one of whose `taughtAt` rungs is in the
 * rung's ancestry (`rungAncestry`) — the rung, what it builds on, and on a track
 * the core path up to its stage. A demand taught on one track is not taught on its
 * sibling, whatever the file's order. Since E0b `taughtAt` lists every rung that
 * teaches the demand, one per path: the walking bass is `blues.5`'s, `jazz.6`'s
 * and `jam.6`'s, so it is taught at `jazz.8` and not at `theory.9` or
 * `classical.6`.
 *
 * `reached`, where the caller has a learner, is the second reading: the rungs
 * the learner has been placed on or passed (the session's `reached`: met, set
 * aside, behind the placement, or a strand's open rung). A demand taught by any
 * of them is taught for this learner wherever they are judged — a learner who
 * did the blues track and sits on `jazz.6` has met the walking bass.
 *
 * `undefined` for no rung (a phrase opened from nowhere is the row as it stands)
 * or one the curriculum does not have.
 */
export function taughtAtRung(
  curriculum: Curriculum,
  rung: string | undefined,
  vocabulary: Vocabulary = VOCABULARY_V0,
  reached: readonly string[] = [],
): ((demand: string) => boolean) | undefined {
  if (rung === undefined) return undefined;
  const ancestry = rungAncestry(curriculum);
  const here = ancestry.get(rung);
  if (here === undefined) return undefined;
  const theirs = reached.map((id) => ancestry.get(id)).filter((one): one is ReadonlySet<string> => one !== undefined);
  const taughtBy: ReadonlySet<string> = theirs.length === 0 ? here : new Set([...here, ...theirs.flatMap((one) => [...one])]);
  return (demand) => (vocabulary.demands.find((d) => d.id === demand)?.taughtAt ?? []).some((at) => taughtBy.has(at));
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
 * The key a phrase of these options is written in, for the line that names it.
 * The seed chooses the key before any draw, so a phrase the generator refuses
 * (D1a: no draw kept its promises and the level's rules) still has one, carried
 * on the refusal; the offer is not lost to it, and the Score screen shows the
 * refusal when the phrase is opened.
 */
function keyOfPhrase(options: SightReadingOptions): number {
  try {
    return generateSightReading(options).fifths;
  } catch (cause: unknown) {
    if (cause instanceof SightReadingRefusal) return cause.fifths;
    throw cause;
  }
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
  // Today's phrase is the day's seed under the version in force (D1a, G21): a
  // run of that seed under another version — or with none, version 1's — read
  // other music, and today's phrase is still to be read.
  const dailyToday = dailySeed(day);
  if (input.purpose === 'daily') {
    const met = input.rows
      .filter(
        (row) =>
          row.seed === dailyToday &&
          phraseVersionOf(row) === SIGHT_READING_IN_FORCE &&
          byId.has(row.itemId) &&
          dayKey(new Date(row.at)) === day,
      )
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

  // The seed: one no stored run of the row carries — under any version (D1a):
  // the question is which seed may be offered, and a seed read under another
  // version can write the very notes read then (many seeds write the same
  // phrase at both), while skipping it costs nothing.
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
  const taught = taughtAtRung(input.curriculum, rung, vocabulary) ?? ((demand: string) => vocabulary.demands.some((d) => d.id === demand && d.taughtAt.length > 0));
  const hold = taughtAtRung(input.curriculum, anchor.lessonId, vocabulary);
  const ctx: MoveContext = {
    item: anchor.item,
    working,
    rung,
    options: (value) => readingOptions(anchor.item, value, undefined, hold),
  };
  const current = ctx.options(working);
  const order = lessonOrder(input.curriculum);
  // Where the learner's rung was taught the demand (E0b): its listed rung on the rung's path — one
  // per path — else, with no rung, the earliest listed. One ancestry, where the file's order is a
  // linear extension of it (E0a).
  const onPath = rung === undefined ? undefined : rungAncestry(input.curriculum).get(rung);
  const taughtIndex = (demand: string): number => {
    const listed = vocabulary.demands.find((d) => d.id === demand)?.taughtAt ?? [];
    const here = onPath === undefined ? [] : listed.filter((at) => onPath.has(at));
    const at = (here.length > 0 ? here : listed).map((one) => order.indexOf(one));
    return at.length > 0 ? Math.min(...at) : Number.POSITIVE_INFINITY;
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
      const key = demand === 'key.signature' ? keyOfPhrase(readingOptions(anchor.item, up.recipe, seed, hold)) : undefined;
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
  const key = Array.isArray(keys) && keys.length > 1 ? keyOfPhrase(readingOptions(anchor.item, working, seed, hold)) : undefined;
  return offer(working, { kind: 'hold', last: measure, ...(key === undefined ? {} : { key }) });
}
