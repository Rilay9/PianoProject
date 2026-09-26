/**
 * The learner's rung state, derived from the stored evidence (C5): the one
 * path from what the runs measured to "this rung is met". Derived every time,
 * never stored; pure.
 *
 * Every rung states its `requirements` (`curriculum/types.ts`), each a
 * predicate over evidence. This reads them against the session rows and says,
 * per rung: **met** (every requirement the app can judge holds), **in
 * progress** (something counts, and something does not — each requirement says
 * which), or **not started**. Nothing else goes in: not an item's pass flag,
 * not a count of items passed, not which rungs list an item. The old path —
 * a count of passed items over a rung's lists, a pass credited to every rung
 * listing the item — is deleted, not kept beside this (the reviewer's exit
 * criterion for C5; L8, L9).
 *
 * **Two scopes** (the reviewer's clarification, 2026-09-27):
 *
 * - **Skill evidence is the learner's everywhere.** A `skill` requirement reads
 *   the ladder (`ladder.ts`) over every evidence record the rows carry under
 *   the evidence definitions in force (`readingState.storedEvidence`),
 *   whichever rung the run was judged by, or none. Interval reading shown on a
 *   2.2 phrase counts for 1.5's requirement that names it.
 * - **The decision that a rung's requirement is met by a run is the judging
 *   rung's.** `runs`, `reads`, `done` and `measure` count only rows whose record names
 *   the rung as the one that judged them (`SessionRow.lessonId`: the rung that
 *   opened the screen, or the one a Today card chose, C1/C3), and each such run
 *   is judged again here under that rung's standard from what it measured
 *   (`masteryCriteriaFor`, the function the Score screen judges by). A run of
 *   an item three rungs list meets at most the one that judged it. A `done`
 *   item (a checklist, the tour, the placement test) is finished when nothing
 *   was left undone and, where the run measured an accuracy, at the rung's
 *   standard; it read every row of the item until the reviewer's C5 review.
 *
 * **What a run measured** is read, never assumed: accuracy a number (a run
 * nothing heard is `not measured`, C1), not rhythm only, not a phrase met
 * before (`unseen: false`), not the learner's own answer (`selfReport`). A
 * Keep tempo run reaches the rung's tempo on what it measured; a Wait run has
 * no tempo, so it meets only a rung that asks for none (T37). A drill has no
 * tempo and is judged on its accuracy, and Simon on its chain, as its screen
 * judges them.
 *
 * **Apart.** The learner's word about a rung ("I already know this", *Mark
 * done*) and the rungs carried over from before C5 are kept beside the state
 * and never make a rung met; `nextRecommended` holds such a rung back, as it
 * holds back the rungs behind a placement.
 */
import type { PlanRow, SessionRow } from '../data/db';
import type { Curriculum, Lesson, Requirement, RunsRequirement } from '../curriculum/types';
import { masteryCriteriaFor } from '../curriculum/selectors';
import { DEFAULT_MASTERY, type MasteryCriteria } from '../engine/Scoring';
import { SIMON_ROUNDS, simonBestChain, simonOutcome } from '../engine/drills/simon';
import type { Evidence, MeasuredEvidence } from './evidence';
import { LADDER_STATES, ladderState, supports, type LadderReading, type LadderState } from './ladder';
import { storedEvidence } from './readingState';
import type { Vocabulary } from './vocabulary';

export type RungStatus = 'met' | 'in progress' | 'not started';

/** What the evidence shows for one requirement. */
export interface RequirementReading {
  requirement: Requirement;
  /** Whether it holds; `'unjudged'` for the lesson's rule no run can show. */
  holds: boolean | 'unjudged';
  /** What counts so far, against what is asked: distinct items, reads, 1 for a skill state reached. */
  have: number;
  need: number;
  /** A `skill` requirement: the skill's ladder state today. */
  state?: LadderState;
  /** The items whose runs counted (`runs`, `done`, `measure`), in the rung's order. */
  items: string[];
}

/** The learner's own word about a rung: "I already know this" or *Mark done*. Never evidence. */
export type RungWord = NonNullable<PlanRow['rungWords']>[string];

export interface RungReading {
  rung: Lesson;
  status: RungStatus;
  /** False when no requirement of the rung can be judged by the app: its lesson's rule is the learner's. */
  judged: boolean;
  requirements: RequirementReading[];
  /** The learner's word, apart. */
  word?: RungWord;
  /** Done under the old rule before C5 (the one-time carry-over), apart. */
  carried: boolean;
}

export interface RungStates {
  byRung: ReadonlyMap<string, RungReading>;
}

export interface LearnerRecord {
  /** The learner's word per rung (the plan store's `rungWords`). */
  words?: Readonly<Record<string, RungWord>>;
  /** The rungs carried over from before C5 (the plan store's `carriedOver.rungs`). */
  carried?: readonly string[];
  /** The pass pair that judges a run where a rung states no number of its own (the Settings pair). */
  defaults?: Pick<MasteryCriteria, 'passAccuracy' | 'passTempoPct'>;
  /** `04` §7 "require 2 songs per lesson": a second song, where a rung that asks for songs has two. */
  requireTwoSongs?: boolean;
}

/**
 * Every vocabulary skill with an observable, read on the ladder over every
 * current-stamp evidence record the rows carry, whichever rung judged the run
 * (the global scope `skill` requirements read). For the Skills screen (C5).
 * `exposures` are the ladder's exposure events by skill (`carriedExposures`):
 * they make a skill *introduced* and nothing more.
 */
export function skillLadders(
  rows: readonly SessionRow[],
  vocabulary: Vocabulary,
  today: Date,
  exposures: ReadonlyMap<string, readonly string[]> = new Map(),
): Map<string, LadderReading> {
  const bySkill = new Map<string, Evidence[]>();
  for (const row of rows) {
    for (const evidence of storedEvidence(row)) {
      const list = bySkill.get(evidence.skill) ?? [];
      list.push(evidence);
      bySkill.set(evidence.skill, list);
    }
  }
  const out = new Map<string, LadderReading>();
  for (const skill of vocabulary.skills) {
    if (skill.observable === 'none') continue;
    const exposed = exposures.get(skill.id);
    out.set(skill.id, ladderState({ evidence: bySkill.get(skill.id) ?? [], today, ...(exposed ? { exposures: exposed } : {}) }));
  }
  return out;
}

/**
 * The concepts of the rungs carried over from before C5, as exposure events
 * dated the day they were carried (the coordinator's decision, C5). The learner
 * met that material — read the lesson, played its pieces — under the old rule,
 * which is exactly what the ladder's exposure is ("the lesson page read, a
 * demonstration heard"): a concept is *introduced* by it, and no further. It is
 * not evidence, so it moves no skill to practised, and no requirement reads it.
 */
export function carriedExposures(
  curriculum: Curriculum,
  carried: PlanRow['carriedOver'],
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  if (!carried || carried.rungs.length === 0) return out;
  const rungs = new Set(carried.rungs);
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        if (!rungs.has(lesson.id)) continue;
        for (const concept of lesson.concepts) {
          const list = out.get(concept) ?? [];
          if (!list.includes(carried.at)) list.push(carried.at);
          out.set(concept, list);
        }
      }
    }
  }
  return out;
}

/**
 * The learner record the screens hand `rungState`: the learner's word and the
 * carried-over rungs from the plan row, the Settings pass pair and the
 * "require 2 songs" setting. Pure.
 */
export function learnerRecordFrom(
  plan: Pick<PlanRow, 'rungWords' | 'carriedOver'>,
  settings: { passAccuracyPct: number; passTempoPct: number; requireTwoSongs: boolean },
): LearnerRecord {
  return {
    ...(plan.rungWords === undefined ? {} : { words: plan.rungWords }),
    ...(plan.carriedOver === undefined ? {} : { carried: plan.carriedOver.rungs }),
    defaults: { passAccuracy: settings.passAccuracyPct / 100, passTempoPct: settings.passTempoPct },
    requireTwoSongs: settings.requireTwoSongs,
  };
}

/** Whether a stored run measured anything a requirement can read (see the module note). */
function measured(row: SessionRow): row is SessionRow & { accuracy: number } {
  return (
    typeof row.accuracy === 'number' &&
    row.rhythmOnly !== true &&
    row.unseen !== false &&
    row.selfReport === undefined
  );
}

/** Whether one run judged by `rung` meets its standard, re-read from what it measured. */
export function meetsStandard(row: SessionRow, criteria: MasteryCriteria, accuracy?: number): boolean {
  if (!measured(row)) return false;
  if (row.mode === 'drill:simon') return simonOutcome(simonBestChain(row.accuracy, SIMON_ROUNDS)).passed;
  if (row.accuracy < (accuracy ?? criteria.passAccuracy)) return false;
  if (row.mode.startsWith('drill:')) return true;
  if (row.mode === 'tempo') return row.tempoMeasured !== false && row.tempoPct >= criteria.passTempoPct;
  if (row.mode === 'wait') return criteria.passTempoPct <= 0;
  return false;
}

function poolOf(rung: Lesson, requirement: RunsRequirement): Set<string> {
  const songs = [...rung.songOptions, ...(rung.paperOptions ?? [])];
  const base =
    requirement.from === 'exercises'
      ? rung.exerciseOptions
      : requirement.from === 'songs'
        ? songs
        : [...rung.exerciseOptions, ...songs];
  const named = requirement.items === undefined ? null : new Set(requirement.items);
  return new Set(base.filter((id) => named === null || named.has(id)));
}

/** The full standard satisfies a requirement for the practice one; not the other way round. */
function standardMeets(evidence: MeasuredEvidence, standard: 'practice' | 'full'): boolean {
  return standard === 'practice' || evidence.standard === 'full';
}

function atLeast(state: LadderState, wanted: LadderState): boolean {
  return LADDER_STATES.indexOf(state) >= LADDER_STATES.indexOf(wanted);
}

/** In the rung's own order: exercises, then songs, then paper. */
function inRungOrder(rung: Lesson, ids: ReadonlySet<string>): string[] {
  return [...rung.exerciseOptions, ...rung.songOptions, ...(rung.paperOptions ?? [])].filter(
    (id, index, all) => ids.has(id) && all.indexOf(id) === index,
  );
}

/**
 * Every rung's state from the rows (see the module note). `today` dates the
 * ladder's readings. Pure: the same rows, curriculum, vocabulary, day and
 * learner record give the same state.
 */
export function rungState(
  rows: readonly SessionRow[],
  curriculum: Curriculum,
  vocabulary: Vocabulary,
  today: Date,
  learner: LearnerRecord = {},
): RungStates {
  const defaults: MasteryCriteria = {
    ...DEFAULT_MASTERY,
    ...(learner.defaults ?? {}),
  };
  // One walk over the rows: the runs each rung judged, and every skill's
  // evidence, whichever rung judged the run it came from.
  const judgedBy = new Map<string, SessionRow[]>();
  const evidenceBySkill = new Map<string, Evidence[]>();
  for (const row of rows) {
    if (row.lessonId !== undefined) {
      const list = judgedBy.get(row.lessonId) ?? [];
      list.push(row);
      judgedBy.set(row.lessonId, list);
    }
    for (const evidence of storedEvidence(row)) {
      const list = evidenceBySkill.get(evidence.skill) ?? [];
      list.push(evidence);
      evidenceBySkill.set(evidence.skill, list);
    }
  }
  const knownSkills = new Set(vocabulary.skills.map((skill) => skill.id));
  const ladders = new Map<string, LadderState>();
  const ladderOf = (skill: string): LadderState => {
    const cached = ladders.get(skill);
    if (cached) return cached;
    const state = knownSkills.has(skill)
      ? ladderState({ evidence: evidenceBySkill.get(skill) ?? [], today }).state
      : 'not introduced';
    ladders.set(skill, state);
    return state;
  };
  const carried = new Set(learner.carried ?? []);

  const byRung = new Map<string, RungReading>();
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const rung of unit.lessons) {
        const criteria = masteryCriteriaFor(rung, defaults);
        const judged = judgedBy.get(rung.id) ?? [];
        const readings = (rung.requirements ?? []).map((requirement) =>
          read(requirement, rung, criteria, judged, evidenceBySkill, ladderOf, learner),
        );
        const judgeable = readings.filter((reading) => reading.holds !== 'unjudged');
        const met = judgeable.length > 0 && judgeable.every((reading) => reading.holds === true);
        const anything = judged.length > 0 || judgeable.some((reading) => reading.have > 0);
        const word = learner.words?.[rung.id];
        byRung.set(rung.id, {
          rung,
          status: met ? 'met' : anything ? 'in progress' : 'not started',
          judged: judgeable.length > 0,
          requirements: readings,
          ...(word === undefined ? {} : { word }),
          carried: carried.has(rung.id),
        });
      }
    }
  }
  return { byRung };
}

function read(
  requirement: Requirement,
  rung: Lesson,
  criteria: MasteryCriteria,
  judged: readonly SessionRow[],
  evidenceBySkill: ReadonlyMap<string, readonly Evidence[]>,
  ladderOf: (skill: string) => LadderState,
  learner: LearnerRecord,
): RequirementReading {
  switch (requirement.kind) {
    case 'runs': {
      const pool = poolOf(rung, requirement);
      const counted = new Set<string>();
      for (const row of judged) {
        if (!pool.has(row.itemId)) continue;
        if (requirement.performance === true && row.performance !== true) continue;
        if (meetsStandard(row, criteria, requirement.accuracy)) counted.add(row.itemId);
      }
      const twoSongs =
        learner.requireTwoSongs === true &&
        requirement.from === 'songs' &&
        rung.songOptional !== true &&
        rung.songOptions.length >= 2;
      const need = twoSongs ? Math.max(2, requirement.count) : requirement.count;
      return { requirement, holds: counted.size >= need, have: counted.size, need, items: inRungOrder(rung, counted) };
    }
    case 'reads': {
      const options = new Set([...rung.exerciseOptions, ...rung.songOptions]);
      let have = 0;
      for (const row of judged) {
        if (!options.has(row.itemId)) continue;
        const evidence = storedEvidence(row).find(
          (entry): entry is MeasuredEvidence =>
            entry.kind === 'measured' && entry.skill === requirement.skill && standardMeets(entry, requirement.standard),
        );
        if (evidence !== undefined && evidence.n > 0 && evidence.right / evidence.n >= requirement.share) have += 1;
      }
      return { requirement, holds: have >= requirement.count, have, need: requirement.count, items: [] };
    }
    case 'skill': {
      const state = ladderOf(requirement.skill);
      const reached = atLeast(state, requirement.state);
      // A skill that has any supporting evidence has begun, which is what
      // makes a rung that names it "in progress" rather than "not started".
      const begun = (evidenceBySkill.get(requirement.skill) ?? []).some(
        (entry) => entry.kind === 'measured' && supports(entry),
      );
      return { requirement, holds: reached, have: reached || begun ? 1 : 0, need: 1, state, items: [] };
    }
    case 'done': {
      // The rung's own runs, like the other kinds: finished from this rung,
      // nothing left undone, and — where the run measured an accuracy — at the
      // rung's standard. A completion that measures no accuracy (the tour's
      // steps, a checklist's ticks) is judged on what was left undone alone.
      const finished = judged.some(
        (row) =>
          row.itemId === requirement.item &&
          row.missed === 0 &&
          (typeof row.accuracy !== 'number' || row.accuracy >= criteria.passAccuracy),
      );
      return { requirement, holds: finished, have: finished ? 1 : 0, need: 1, items: finished ? [requirement.item] : [] };
    }
    case 'measure': {
      const counted = new Set<string>();
      for (const row of judged) {
        const technique = row.technique;
        if (technique?.kind === requirement.measure && technique.result === 'met') counted.add(row.itemId);
      }
      return { requirement, holds: counted.size > 0, have: counted.size, need: 1, items: inRungOrder(rung, counted) };
    }
    case 'unjudged':
      return { requirement, holds: 'unjudged', have: 0, need: 0, items: [] };
  }
}
