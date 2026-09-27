/**
 * The one gate at the consumer boundary (E0 item 3; R38, Part 23, Part 25 layer 6):
 * `eligibleFor(candidate, learner, want)` answers, from the facts the candidate has,
 * two questions and nothing else.
 *
 * 1. **Can the learner cope?** Every measured demand of the candidate is one the
 *    learner's skill state supports — the ladder's `familiar` or above on the
 *    demand's `copedWithBy` skill, the rule the repertoire slot already used — or is
 *    taught at or below the rung judging it (`session.taughtAtRung`).
 * 2. **Does it provide the opportunity claimed?** The wanted demand, or the wanted
 *    skill's opportunity, is present at a useful density (`measurement.established`:
 *    the per-demand rule in `content/sources/opportunity-density.json` for notated
 *    items, a generated family's own contract density where it states one), told apart
 *    from incidental presence.
 *
 * **Missing information is not false.** An item whose demands are `unmeasured` is
 * eligible for exploration and project work and ineligible for any claim of skill
 * practice or equivalence, and the result says which, with the missing measurement,
 * so a caller and a reason line can state it (the reviewer's constraint (b)).
 *
 * **Not ranking** (Part 25 layer 7): the answer is eligible, ineligible with the reason,
 * or eligible for exploration only. Level orders eligible candidates in the callers and
 * rescues nothing.
 *
 * **One boundary, extended, never a second one** (D0's `skillActivation.ts`; the
 * reviewer's finding 4). A declared target skill is read only through
 * `skillActivation.declaredSkills` and `skillsInForce`: a skill the activation acts on
 * (the reading rows, as shipped) is acted on as before; any other declared skill is
 * acted on for *selection* only where the measurement establishes its opportunity. A
 * rung's skill requirement (`want.for === 'requirement'`) is served only by an item
 * whose runs the evidence readers act on — E0 never widens what earns evidence (the
 * reviewer's constraint (a)). A measured occurrence never validates a quality claim
 * such as healthy wrist rotation: this gate knows demands and densities, not execution.
 *
 * **Every offer path calls this** (the reviewer's constraint (c)): the swap sheet's
 * four tiers and its last resort (`selectors.tieredAlternatives`,
 * `session.swapOptions`), the session's skill requirement (`wantsOf`), its skill and
 * demand steps (`fallbackStep`) and the repertoire slot's claim (`repertoire`).
 * Same-lesson options and explicit `alternatives[]` go through it too: provenance,
 * never immunity (Part 23).
 */
import densityJson from '../../../content/sources/opportunity-density.json';
import { READING_CONTROLS } from '../engine/readingControls';
import { sightReadingOptionsFor } from '../engine/sightReading';
import { LADDER_STATES, type LadderState } from '../evidence/ladder';
import { VOCABULARY_V0, type Vocabulary } from '../evidence/vocabulary';
import { declaredSkills, SHIPPED_SKILL_ACTIVATION, skillsInForce, type SkillActivation } from './skillActivation';
import type { CatalogItem, Measurement } from './types';

/** One demand's useful-density rule for a notated item (the file's reasons are beside each). */
export interface DensityRule {
  min: number;
  perBar: number;
  hypothesis: boolean;
  why: string;
}

/** The density file, typed: read by the build too, so the two cannot disagree about the numbers. */
export const OPPORTUNITY_DENSITY = densityJson as unknown as {
  demands: Record<string, DensityRule>;
  tempoSensitive: string[];
};

/**
 * The demands a notated item provides at a useful density, in the vocabulary's order:
 * the located count reaches the demand's `min` and its count per bar reaches `perBar`.
 * The same arithmetic as `build.established_by_density`; `eligibility.test.ts` holds
 * the two equal on every built item. The import path calls this for an imported score.
 */
export function usefulDensity(located: Readonly<Record<string, number>>, bars: number, vocabulary: Vocabulary = VOCABULARY_V0): string[] {
  return vocabulary.demands
    .map((demand) => demand.id)
    .filter((id) => {
      const rule = OPPORTUNITY_DENSITY.demands[id];
      const n = located[id] ?? 0;
      return rule !== undefined && n > 0 && n >= rule.min && n / Math.max(bars, 1) >= rule.perBar;
    });
}

/** What the learner is known to have, for the first question. */
export interface Learner {
  /** The ladder state of a skill over all the learner's evidence; absent: no evidence read. */
  skillState?: (skill: string) => LadderState | undefined;
  /** Whether the rung judging the candidate has taught a demand, at or below it; absent: no rung judges. */
  taught?: (demand: string) => boolean;
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

export type Eligibility =
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
  | { verdict: 'ineligible'; why: 'physical'; prerequisite: string; alternative: string };

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

/**
 * The demands a candidate may ask of the learner: its measured ids; for a reading row
 * the demands its reading controls may write into a phrase (C4b's map, read, never
 * moved — the rung the phrase opens under holds the rest out); none for any other drill
 * the app makes at runtime.
 */
function demandsAsked(item: CatalogItem, measurement: Measurement, vocabulary: Vocabulary): readonly string[] {
  if (measurement.status === 'measured') return Array.isArray(item.demands) ? item.demands : [];
  if (measurement.status === 'runtime' && isReadingRow(item)) {
    const options = sightReadingOptionsFor(item.drill?.params ?? {}, 1);
    return vocabulary.demands.filter((demand) => READING_CONTROLS[demand.id]?.mayWrite(options) === true).map((demand) => demand.id);
  }
  return [];
}

/** The candidate's measured demands the learner cannot yet cope with (question 1). */
export function uncoped(item: CatalogItem, learner: Learner, vocabulary: Vocabulary = VOCABULARY_V0): string[] {
  const floor = LADDER_STATES.indexOf(learner.floor ?? 'familiar');
  const supported = (demand: string): boolean => {
    const skill = vocabulary.demands.find((d) => d.id === demand)?.copedWithBy;
    const state = skill === undefined ? undefined : learner.skillState?.(skill);
    return state !== undefined && LADDER_STATES.indexOf(state) >= floor;
  };
  const taught = (demand: string): boolean => learner.taught?.(demand) === true;
  return demandsAsked(item, measurementOf(item), vocabulary).filter((demand) => !supported(demand) && !taught(demand));
}

/** Whether the gate has anything to judge the first question by. */
function knowsTheLearner(learner: Learner): boolean {
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
function opportunityOf(skill: string, vocabulary: Vocabulary): readonly string[] | 'every-step' | undefined {
  return vocabulary.skills.find((s) => s.id === skill)?.opportunity;
}

/**
 * The declared target skills selection acts on for an item (E0's extension of D0's
 * boundary): every declared skill the activation acts on; any other declared skill
 * only where its opportunity is established in the measured notes. Never a skill the
 * item does not declare: measured presence alone never establishes purpose (Part 23).
 */
export function targetSkillsFor(item: CatalogItem, activation: SkillActivation = SHIPPED_SKILL_ACTIVATION, vocabulary: Vocabulary = VOCABULARY_V0): string[] {
  const active = new Set(skillsInForce(item, activation));
  const measurement = measurementOf(item);
  return declaredSkills(item).filter((skill) => {
    if (active.has(skill)) return true;
    const wanted = opportunityOf(skill, vocabulary);
    if (wanted === undefined || wanted === 'every-step' || measurement.status !== 'measured') return false;
    return wanted.some((demand) => measurement.established.includes(demand));
  });
}

/**
 * The demands an item is on its rung to practise, for "something else like this" (the
 * demand tier's want): the demands the rung teaches (`taughtAt`) — the rung it was
 * offered from, or the first rung listing it — that the item provides at a useful
 * density; for a reading row, those its declared skills' opportunities cover (the
 * reader writes them by promise). Never a demand it carries incidentally, and never an
 * older one every piece has: a swap for a 1.5 item keeps the skips 1.5 is about, not
 * the steps every tune contains, which would make the tier the catalogue by level.
 */
export function targetDemandsFor(
  item: CatalogItem,
  rungId: string | undefined,
  activation: SkillActivation = SHIPPED_SKILL_ACTIVATION,
  vocabulary: Vocabulary = VOCABULARY_V0,
): string[] {
  if (rungId === undefined) return [];
  const measurement = measurementOf(item);
  const taughtHere = vocabulary.demands.filter((demand) => demand.taughtAt === rungId).map((demand) => demand.id);
  if (measurement.status === 'measured') return taughtHere.filter((demand) => measurement.established.includes(demand));
  if (measurement.status === 'runtime') {
    const promised = new Set(
      targetSkillsFor(item, activation, vocabulary).flatMap((skill) => {
        const wanted = opportunityOf(skill, vocabulary);
        return wanted === undefined || wanted === 'every-step' ? [] : [...wanted];
      }),
    );
    return taughtHere.filter((demand) => promised.has(demand));
  }
  return [];
}

/** Tempo-sensitive demands the provenance marks untrusted, because the tempo was the converter's (R11). */
function untrustedOf(item: CatalogItem): readonly string[] | undefined {
  const untrusted = item.provenance?.facts.demands?.untrusted;
  return untrusted !== undefined && untrusted.length > 0 ? untrusted : undefined;
}

/** The one gate: can the learner cope, and does the candidate provide the opportunity wanted. */
export function eligibleFor(candidate: CatalogItem, learner: Learner, want: Want, vocabulary: Vocabulary = VOCABULARY_V0): Eligibility {
  const physical = candidate.provenance?.physical;
  if (physical) {
    // D0 finding 5: a declared large-hand voicing is not recommended until its smaller-hand alternative reaches the learner.
    return { verdict: 'ineligible', why: 'physical', prerequisite: physical.prerequisite, alternative: physical.alternative };
  }
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

/** Whether the verdict lets the caller offer the candidate for the want it asked. */
export function eligible(result: Eligibility): boolean {
  return result.verdict === 'eligible';
}
