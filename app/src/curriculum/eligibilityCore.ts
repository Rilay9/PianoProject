/**
 * The established questions of the one gate, in one private core (E2a; the reviewer's required change
 * on the E2a brief, `docs/review/responses/1b09a1f.md`). What `eligibility.eligibleFor` answered from
 * E0 to E2, moved here without a changed line so that the material gate (`candidates.ts`) can ask it
 * and the exported `eligibleFor` can delegate to the material gate without either calling the other
 * back: the import graph is this module ← `candidates.ts` ← `eligibility.ts`, and this module imports
 * neither. No app module but those two imports it (`materialLayer.test.ts` holds the graph); the
 * public surface is `eligibility.ts`'s, which re-exports the helpers below that were public before and
 * never {@link establishedQuestions}.
 *
 * The questions, from the facts the candidate has, and nothing else:
 *
 * 1. **Can the learner cope?** Every measured demand of the candidate is one the learner's skill state
 *    supports — the ladder's `familiar` or above on the demand's `copedWithBy` skill, the rule the
 *    repertoire slot already used — or is taught at or below the rung judging it
 *    (`session.taughtAtRung`). A key signature located at no sounding note is not asked
 *    (L120b, `demandsAsked`), and a skip wholly inside a taught fixed position is coped with by
 *    that position's note reading (L120b, `inTaughtPosition`).
 * 2. **Does it provide the opportunity claimed?** The wanted demand, or the wanted skill's opportunity,
 *    is present at a useful density (`measurement.established`), told apart from incidental presence.
 *
 * Before them, a declared large-hand voicing (D0 finding 5) and the teaching-use admission (D3a, E1a:
 * generated music or an excerpt no person has approved for teaching reaches the learner only by
 * exploration). An unmeasured candidate is eligible for exploration and `exploration-only` for any
 * other want here; the material gate adds what an automatic experience may not risk — the unknown
 * forbidden demand (`unknown-forbidden`) — and nothing else of a want's verdict moves. Tempo-sensitive
 * demands on a converter's tempo are carried as `untrusted` (R11; E0's verdict, kept).
 */
import { READING_CONTROLS } from '../engine/readingControls';
import { sightReadingOptionsFor } from '../engine/sightReading';
import { LADDER_STATES, type LadderState } from '../evidence/ladder';
import { VOCABULARY_V0, type Vocabulary } from '../evidence/vocabulary';
import { isExcerpt } from './excerpt';
import { declaredSkills, SHIPPED_SKILL_ACTIVATION, skillsInForce, type SkillActivation } from './skillActivation';
import type { CatalogItem, Measurement } from './types';

/** What the learner is known to have, for the first question. */
export interface Learner {
  /** The ladder state of a skill over all the learner's evidence; absent: no evidence read. */
  skillState?: (skill: string) => LadderState | undefined;
  /** Whether the rung judging the candidate has taught a demand, at or below it; absent: no rung judges. */
  taught?: (demand: string) => boolean;
  /**
   * Whether a fixed position's note reading is taught for this learner at the rung judging the
   * candidate: a lesson on the rung's path, or on a rung the learner has reached, names the
   * position's concept in its own `concepts` (`session.positionTaughtAtRung`, L120b). Built
   * beside `taught`, from the same rung and reached set (`session.taughtForLearner`). Absent: no
   * position is taught, and no skip is coped with by one — the refusal stays.
   */
  positionTaught?: (concept: string) => boolean;
  /**
   * The ladder state at which a skill supports its demands. `familiar`, the rule the
   * repertoire slot used before E0; `introduced` is what the brief asked to compare it
   * with on the three constructed learners.
   */
  floor?: LadderState;
}

/** What the candidate is wanted for. */
export type Want =
  /** Practice of a target skill it declares: the swap sheet's skill tier, the session's skill step. */
  | { for: 'skill'; skill: string; activation?: SkillActivation }
  /**
   * A rung's skill requirement (the session's warm-up and new slots): only an item whose
   * declared skill the evidence readers act on can serve it, since only its runs can
   * meet the requirement (constraint (a)).
   */
  | { for: 'requirement'; skill: string; activation?: SkillActivation }
  /** Practice of a demand: the demand tier, the demand step, the repertoire slot's new demand. */
  | { for: 'demand'; demand: string }
  /** An equivalent of what was offered: another option of the lesson, a named stand-in, the same kind. */
  | { for: 'equivalent' }
  /** Exploration or project work. */
  | { for: 'exploration' };

/** The established questions' verdicts: the one gate's before E2a, each kept by the material gate. */
export type CoreVerdict =
  | {
      verdict: 'eligible';
      for: Want['for'];
      /** The skill or demand the candidate is practice of, where the want named one. */
      practises?: string;
      /** How many places the detectors located it. */
      located?: number;
      /** Tempo-sensitive demands whose difficulty rests on a tempo the converter supplied (R11). */
      untrusted?: readonly string[];
      /** An unmeasured candidate offered for exploration: what is missing, to be said. */
      missing?: string;
    }
  | { verdict: 'exploration-only'; missing: string }
  | { verdict: 'ineligible'; why: 'untaught'; demands: readonly string[] }
  | { verdict: 'ineligible'; why: 'absent'; wanted: string }
  | { verdict: 'ineligible'; why: 'incidental'; wanted: string; located: number }
  | { verdict: 'ineligible'; why: 'not-a-target'; skill: string }
  | { verdict: 'ineligible'; why: 'no-learner' }
  | { verdict: 'ineligible'; why: 'physical'; prerequisite: string; alternative: string }
  /**
   * A generated item whose family promises music for its recipe (D3a), or an excerpt (E1a), with no
   * affirmative teaching-use decision: `teaching` is the stored bit — `null`, no person has decided;
   * `false`, a `no` or a `fix` on record — refused alike and never collapsed. Said as "not approved for teaching use",
   * never "not yet reviewed", which would be false of a reviewed rejection.
   */
  | { verdict: 'ineligible'; why: 'teaching-use-not-approved'; teaching: null | false };

/**
 * How the candidate's demands are known. An item with no record at all is a catalogue
 * from before E0 or a constructed one: its demands are not known, so it is unmeasured —
 * except a drill with no file, which the app makes when it opens.
 */
export function measurementOf(item: CatalogItem): Measurement {
  if (item.measurement) return item.measurement;
  if (item.drill && !item.file) return { status: 'runtime', reason: 'made when it opens' };
  if (item.imported) return { status: 'unmeasured', reason: 'imported before the app measured demands' };
  return { status: 'unmeasured', reason: 'no measurement record' };
}

function isReadingRow(item: CatalogItem): boolean {
  return item.drill?.kind === 'sight-reading';
}

/** The demand a measured row can carry with nothing of it to play (L120b). */
const KEY_SIGNATURE = 'key.signature';

/**
 * The demands a candidate may ask of the learner: its measured ids; for a reading row
 * the demands its reading controls may write into a phrase (C4b's map, read, never
 * moved — the rung the phrase opens under holds the rest out); none for any other drill
 * the app makes at runtime.
 *
 * Of the measured ids, a key signature the detectors locate at no sounding note is not
 * asked (L120b; the reviewer's ruling on L120a, `docs/review/responses/0bcd3be0.md`,
 * Question 2 A): the signature is on the page, and where no letter it alters sounds the
 * learner plays every written note right without applying it. The notation fact stays —
 * the row's `demands`, question 2's opportunity reading, provenance — and only this
 * question leaves it out. The key signature alone: any other demand located nowhere is
 * asked as before. `claims.untaught_on` is the build's twin.
 */
function demandsAsked(item: CatalogItem, measurement: Measurement, vocabulary: Vocabulary): readonly string[] {
  if (measurement.status === 'measured') {
    const measured = Array.isArray(item.demands) ? item.demands : [];
    return measured.filter((demand) => demand !== KEY_SIGNATURE || (measurement.located[demand] ?? 0) > 0);
  }
  if (measurement.status === 'runtime' && isReadingRow(item)) {
    const options = sightReadingOptionsFor(item.drill?.params ?? {}, 1);
    return vocabulary.demands.filter((demand) => READING_CONTROLS[demand.id]?.mayWrite(options) === true).map((demand) => demand.id);
  }
  return [];
}

/**
 * Whether a demand is coped with by the note reading of a taught fixed position (L120b; the reviewer's
 * Question 1 on L120a, `docs/review/responses/0bcd3be0.md`): before 1.5 teaches reading by interval, a
 * skip wholly inside C position is read by note name, as 1.1 and 1.3 taught. True when the demand's
 * vocabulary entry names the positions (`fixedPositions`: `interval.skip`'s alone), the measured row
 * carries each sounding hand's range over the whole piece (`measurement.span`), every hand that sounds
 * lies inside that hand's own position, and each such position's note reading is taught for the learner
 * (`learner.positionTaught`). Nothing for a hand outside its position, a hand whose position is not
 * taught at this rung, a row with no range (unmeasured, runtime, measured before the build wrote one)
 * or any other demand. It names no skill and reads no skill state: no evidence reader sees it, so a
 * correct run of such an item is never interval-reading evidence (`evidence.ts`'s principle), and
 * `copedWithBy` keeps its one skill.
 */
function inTaughtPosition(demand: string, measurement: Measurement, learner: Learner, vocabulary: Vocabulary): boolean {
  const positions = vocabulary.demands.find((d) => d.id === demand)?.fixedPositions;
  if (positions === undefined || positions.length === 0 || learner.positionTaught === undefined) return false;
  if (measurement.status !== 'measured' || measurement.span === undefined) return false;
  const hands = (['R', 'L'] as const).filter((hand) => measurement.span?.[hand] !== undefined);
  if (hands.length === 0) return false;
  return hands.every((hand) => {
    const [low, high] = measurement.span?.[hand] as [number, number];
    return positions.some((position) => position.hand === hand && position.low <= low && high <= position.high && learner.positionTaught?.(position.concept) === true);
  });
}

/**
 * The candidate's measured demands the learner cannot yet cope with (question 1): those the learner's
 * evidence does not support, the rung has not taught, and — for a skip — no taught fixed position copes
 * with (`inTaughtPosition`, L120b).
 */
export function uncoped(item: CatalogItem, learner: Learner, vocabulary: Vocabulary = VOCABULARY_V0): string[] {
  const floor = LADDER_STATES.indexOf(learner.floor ?? 'familiar');
  const supported = (demand: string): boolean => {
    const skill = vocabulary.demands.find((d) => d.id === demand)?.copedWithBy;
    const state = skill === undefined ? undefined : learner.skillState?.(skill);
    return state !== undefined && LADDER_STATES.indexOf(state) >= floor;
  };
  const taught = (demand: string): boolean => learner.taught?.(demand) === true;
  const measurement = measurementOf(item);
  return demandsAsked(item, measurement, vocabulary).filter(
    (demand) => !supported(demand) && !taught(demand) && !inTaughtPosition(demand, measurement, learner, vocabulary),
  );
}

/** Whether the gate has anything to judge the first question by. */
export function knowsTheLearner(learner: Learner): boolean {
  return learner.taught !== undefined || learner.skillState !== undefined;
}

/**
 * The opportunity question for one demand: established at a useful density, present
 * only incidentally, or absent. A runtime drill establishes no fixed opportunity: its
 * material is made per phrase.
 */
function opportunity(item: CatalogItem, measurement: Measurement, wanted: readonly string[]): { established?: string; incidental?: string; located: number } {
  if (measurement.status !== 'measured') return { located: 0 };
  const hit = wanted.find((demand) => measurement.established.includes(demand));
  if (hit !== undefined) return { established: hit, located: measurement.located[hit] ?? 0 };
  const present = Array.isArray(item.demands) ? item.demands : [];
  const near = wanted.find((demand) => present.includes(demand));
  return near === undefined ? { located: 0 } : { incidental: near, located: measurement.located[near] ?? 0 };
}

/** The vocabulary skill's opportunity demands, or `every-step`. */
export function opportunityOf(skill: string, vocabulary: Vocabulary): readonly string[] | 'every-step' | undefined {
  return vocabulary.skills.find((s) => s.id === skill)?.opportunity;
}

/** Tempo-sensitive demands the provenance marks untrusted, because the tempo was the converter's (R11). */
function untrustedOf(item: CatalogItem): readonly string[] | undefined {
  const untrusted = item.provenance?.facts.demands?.untrusted;
  return untrusted !== undefined && untrusted.length > 0 ? untrusted : undefined;
}

/**
 * The stored teaching-use bit of music whose teaching suitability rests on a person's decision, where
 * it is not an affirmative one: a generated item whose family promises music for its recipe (D3a) and
 * an excerpt (E1a) — `null` undecided (or no record at all), `false` a `no` or a `fix` on record;
 * `undefined` for an approved one and for anything else (a drill, a runtime reading row, a notated
 * song). The bit is the build's (`review.fill_reviewed`), filled only from a decision on the item's
 * current identity; for an excerpt that is the cut file's sha256, so a `yes` on an earlier cut of the
 * same definition leaves it `null` here.
 */
function unapprovedMusic(item: CatalogItem): null | false | undefined {
  const provenance = item.provenance;
  if (provenance?.facts.promise?.value !== 'music' && !isExcerpt(item)) return undefined;
  const teaching = provenance?.review.teaching;
  return teaching === true ? undefined : teaching === false ? false : null;
}

/**
 * The teaching-use admission, alone (D3b; the reviewer's required change on D3a; extended to excerpts
 * by E1a): false for a generated item whose family promises music for its recipe and for an excerpt,
 * each without an affirmative teaching-use decision on its current identity; true for everything
 * else — a drill, a runtime reading row, a notated song. The same reading the gate makes
 * (`unapprovedMusic`, defined once), for the paths that take an item straight from a rung's list
 * without asking the gate — the session card's `runs`, `done` and `measure` asks, the fallback
 * ladder's rung and prerequisite steps, the jam slot, the exposure rule, which `session.usable` puts
 * through it: an authored placement is not a teaching-use decision. No offer path reads the promise
 * fact or the bit beside it. Exploration and the Library never ask it.
 */
export function admittedForTeaching(item: CatalogItem): boolean {
  return unapprovedMusic(item) === undefined;
}

/**
 * The established questions asked of a candidate for a want: what `eligibleFor` answered before E2a.
 * Asked only by the material gate (`candidates.eligibleForMaterial`), which every exported question
 * goes through; never exported by `eligibility.ts`.
 */
export function establishedQuestions(candidate: CatalogItem, learner: Learner, want: Want, vocabulary: Vocabulary = VOCABULARY_V0): CoreVerdict {
  const physical = candidate.provenance?.physical;
  if (physical) {
    // D0 finding 5: a declared large-hand voicing is not recommended until its smaller-hand alternative reaches the learner.
    return { verdict: 'ineligible', why: 'physical', prerequisite: physical.prerequisite, alternative: physical.alternative };
  }
  // D3a, E1a: generated music or an excerpt nobody has approved for teaching reaches the learner only by exploration.
  const teaching = unapprovedMusic(candidate);
  if (teaching !== undefined && want.for !== 'exploration') return { verdict: 'ineligible', why: 'teaching-use-not-approved', teaching };
  const measurement = measurementOf(candidate);
  const untrusted = untrustedOf(candidate);
  const withTrust = <T extends object>(result: T): T & { untrusted?: readonly string[] } => (untrusted ? { ...result, untrusted } : result);

  if (measurement.status === 'unmeasured') {
    if (want.for === 'exploration') return { verdict: 'eligible', for: 'exploration', missing: measurement.reason };
    return { verdict: 'exploration-only', missing: measurement.reason };
  }

  // Question 1: can the learner cope. A practice claim needs a learner to judge; an
  // equivalent or an exploration with no learner given keeps the authored list's word.
  if (!knowsTheLearner(learner)) {
    if (want.for === 'skill' || want.for === 'requirement' || want.for === 'demand') return { verdict: 'ineligible', why: 'no-learner' };
  } else {
    const cannot = uncoped(candidate, learner, vocabulary);
    if (cannot.length > 0) return { verdict: 'ineligible', why: 'untaught', demands: cannot };
  }

  // Question 2: does it provide the opportunity.
  switch (want.for) {
    case 'equivalent':
    case 'exploration':
      return withTrust({ verdict: 'eligible' as const, for: want.for });
    case 'demand': {
      const found = opportunity(candidate, measurement, [want.demand]);
      if (found.established !== undefined) return withTrust({ verdict: 'eligible' as const, for: 'demand' as const, practises: found.established, located: found.located });
      if (found.incidental !== undefined) return { verdict: 'ineligible', why: 'incidental', wanted: want.demand, located: found.located };
      return { verdict: 'ineligible', why: 'absent', wanted: want.demand };
    }
    case 'skill':
    case 'requirement': {
      const activation = want.activation ?? SHIPPED_SKILL_ACTIVATION;
      if (!declaredSkills(candidate).includes(want.skill)) return { verdict: 'ineligible', why: 'not-a-target', skill: want.skill };
      const inForce = skillsInForce(candidate, activation).includes(want.skill);
      // A requirement is met only by evidence, and evidence only from what the readers act on.
      if (want.for === 'requirement' && !inForce) return { verdict: 'ineligible', why: 'not-a-target', skill: want.skill };
      if (measurement.status === 'runtime') {
        return inForce ? { verdict: 'eligible', for: want.for, practises: want.skill } : { verdict: 'ineligible', why: 'not-a-target', skill: want.skill };
      }
      const wanted = opportunityOf(want.skill, vocabulary);
      if (wanted === undefined) return { verdict: 'ineligible', why: 'not-a-target', skill: want.skill };
      if (wanted === 'every-step') {
        return inForce ? withTrust({ verdict: 'eligible' as const, for: want.for, practises: want.skill }) : { verdict: 'ineligible', why: 'not-a-target', skill: want.skill };
      }
      const found = opportunity(candidate, measurement, wanted);
      if (found.established !== undefined) return withTrust({ verdict: 'eligible' as const, for: want.for, practises: want.skill, located: found.located });
      if (found.incidental !== undefined) return { verdict: 'ineligible', why: 'incidental', wanted: found.incidental, located: found.located };
      return { verdict: 'ineligible', why: 'absent', wanted: wanted[0] ?? want.skill };
    }
  }
}
