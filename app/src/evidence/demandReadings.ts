/**
 * Demand readings (C4a item 3; backlog L64; the reviewer's Part 8): what a
 * learner's recent reads say about each demand, and whether the observations
 * single one out. Derived every time from the evidence the rows stored, never
 * stored; pure.
 *
 * The evidence keeps, per demand, its opportunities, which of them went wrong,
 * and where every other demand of those steps is (`MeasuredEvidence.byDemand`,
 * `otherDemands`), so which demands sat on the same steps is known.
 * One wrong note at a skip, in the left hand, during eighths is wrong under all
 * three; the record cannot say which property was the trouble, and nothing
 * here pretends to. What can be read is whether the pattern of right and wrong
 * across several phrases discriminates one demand from the others — skips going
 * wrong in quarters as well as eighths while steps hold — or does not. Each
 * reading is one of three facts:
 *
 * - **`pattern`** — the demand went wrong over the window (its share below the
 *   support share) and in at least `PATTERN_MIN_PHRASES` phrases; for every
 *   demand of another skill that sat on any of its wrong steps (a *rival*), the
 *   demand also went wrong where that rival was absent (at least `MIN_CONTRAST`
 *   such opportunities, share below the support share); and it is *selective*.
 * - **`isolated`** — the demand went wrong over the window; more than half of
 *   its wrong steps, and at least `MIN_ALONE_WRONG`, carry no demand of another
 *   skill at all; and it is *selective*. The single-phrase case: a skip read
 *   as a step where nothing else was on the note.
 * - **`ambiguous`** — neither. The observations do not single the demand out:
 *   it held, or it fell together with something they cannot tell it from.
 *
 * **Selective**: every other demand of the skill held where this one was
 * absent (share at or above the support share, judged wherever it had at least
 * `MIN_CONTRAST` such opportunities), and at least one such comparison exists.
 * This is the brief's "while the skill's other demands' shares are above it",
 * measured where the others can be seen apart from this one; without it an
 * easy phrase read badly throughout would name whichever demand it had most of.
 *
 * **Siblings** — demands the same skill copes with (`copedWithBy`: the step,
 * skip and leap; the eighth and "shorter than a quarter") — are never rivals
 * of one another: they grade one ability, and "shorter than a quarter" is
 * every eighth over again, so asking an eighth to go wrong without it would
 * ask the impossible. They are still held to the selectivity rule. A demand of
 * another skill on the same notes is a different account of the same miss,
 * and that is the ambiguity the reviewer asked to keep.
 *
 * "Below" and "held" are relationships to the skill's support share
 * (`SUPPORT_SHARE`, the ladder's; v0 skills declare none of their own). The
 * four constants are hypotheses, not measurements; `05` §9b prints them.
 *
 * **Keyed by demand, per skill.** A reading is (skill, demand): the same
 * demand under sight-reading (right notes in time, every step) and under
 * reading by interval (pitch alone) is read twice, each by its own skill's
 * outcome. Nothing here knows what a reader can change about the next phrase;
 * the reader maps a supported demand to a control (C4c), and acts only on
 * `isolated` or `pattern`.
 */
import type { SessionRow } from '../data/db';
import type { MeasuredEvidence } from './evidence';
import { SUPPORT_SHARE } from './ladder';
import { READING_STRAND_KINDS, storedEvidence } from './readingState';
import type { Vocabulary } from './vocabulary';

/** How many of a skill's latest reads a reading looks back over. **A hypothesis**: the brief's five reads. */
export const DEMAND_WINDOW_READS = 5;

/** Phrases a demand must go wrong in for a pattern. **A hypothesis**: the brief's "at least two phrases". */
export const PATTERN_MIN_PHRASES = 2;

/**
 * Opportunities a comparison needs before it counts — the demand where a rival
 * is absent, or another demand where this one is absent. **A hypothesis**: one
 * note is an accident either way; two are the least that repeat.
 */
export const MIN_CONTRAST = 2;

/** Wrong steps carrying no other skill's demand that `isolated` needs. **A hypothesis**, for the same reason. */
export const MIN_ALONE_WRONG = 2;

export type Selectivity = 'isolated' | 'pattern' | 'ambiguous';

/** Opportunities and rights, for a demand or a comparison. */
export interface DemandTally {
  demand: string;
  n: number;
  right: number;
}

export interface DemandReading {
  skill: string;
  /** A vocabulary demand id. */
  demand: string;
  /** Over the window: the demand's opportunities that could be told right or wrong, and those right. */
  n: number;
  right: number;
  /** Phrases in the window where it had such an opportunity, and those where its share was below the support share. */
  phrases: number;
  phrasesBelow: number;
  /** `right / n` below the support share. */
  below: boolean;
  selectivity: Selectivity;
  /** The arithmetic the fact was decided on, for a reader or a test to check. */
  basis: {
    /** Its wrong steps carrying no other skill's demand, of all its wrong steps. */
    alone: { wrong: number; of: number };
    /** Each rival (another skill's demand on a wrong step): this demand where the rival was absent. */
    withoutRival: DemandTally[];
    /** Each other demand of the skill, where this one was absent. */
    othersWithout: DemandTally[];
  };
  /** The observations read (`SessionRow.id`), oldest first: the window. */
  observations: (number | null)[];
}

/** One step of one read, as the skill's evidence tells it. */
interface StepFacts {
  /** Right on every channel of the skill, where some demand could tell it. */
  right: boolean | undefined;
  /** Demands whose right or wrong the record can tell here. */
  told: Set<string>;
  /** Every demand located here, told or not. */
  present: Set<string>;
}

function stepsOf(evidence: MeasuredEvidence): Map<number, StepFacts> {
  const out = new Map<number, StepFacts>();
  const at = (step: number): StepFacts => {
    const facts = out.get(step) ?? { right: undefined, told: new Set<string>(), present: new Set<string>() };
    out.set(step, facts);
    return facts;
  };
  for (const entry of evidence.byDemand ?? []) {
    const wrong = new Set(entry.wrong);
    for (const step of entry.steps) {
      const facts = at(step);
      facts.told.add(entry.demand);
      facts.present.add(entry.demand);
      facts.right = !wrong.has(step);
    }
    for (const step of entry.unattributed ?? []) at(step).present.add(entry.demand);
  }
  for (const other of evidence.otherDemands ?? []) for (const step of other.steps) at(step).present.add(other.demand);
  return out;
}

const share = (tally: { n: number; right: number }): number => (tally.n > 0 ? tally.right / tally.n : NaN);
const isBelow = (tally: { n: number; right: number }): boolean => tally.n > 0 && share(tally) < SUPPORT_SHARE;
const holds = (tally: { n: number; right: number }): boolean => tally.n > 0 && share(tally) >= SUPPORT_SHARE;

/** Opportunities and rights over the told steps that pass a test. */
function tallyOf(demand: string, cells: readonly StepFacts[]): DemandTally {
  return { demand, n: cells.length, right: cells.filter((cell) => cell.right === true).length };
}

/** One skill's window of reads, read into one reading per demand its evidence counted. */
function readSkill(skill: string, window: readonly MeasuredEvidence[], vocabulary: Vocabulary): DemandReading[] {
  const reads = window.map((evidence) => stepsOf(evidence));
  const counted = new Set(window.flatMap((evidence) => (evidence.byDemand ?? []).map((entry) => entry.demand)));
  const demands = vocabulary.demands.filter((demand) => counted.has(demand.id));
  const coper = new Map(vocabulary.demands.map((demand) => [demand.id, demand.copedWithBy]));
  const siblings = (a: string, b: string): boolean => coper.get(a) !== undefined && coper.get(a) === coper.get(b);
  const cells = reads.flatMap((read) => [...read.values()]);
  const toldBy = (demand: string): StepFacts[] => cells.filter((cell) => cell.told.has(demand));

  return demands.map(({ id }) => {
    const mine = toldBy(id);
    const overall = tallyOf(id, mine);
    const perPhrase = reads.map((read) => tallyOf(id, [...read.values()].filter((cell) => cell.told.has(id))));
    const phrases = perPhrase.filter((tally) => tally.n > 0).length;
    const phrasesBelow = perPhrase.filter(isBelow).length;
    const wrong = mine.filter((cell) => cell.right === false);

    // Another skill's demands on this demand's wrong steps — whether or not
    // this skill counts them (the overlap names every one): other accounts of
    // the same misses.
    const rivals = vocabulary.demands
      .map((demand) => demand.id)
      .filter((other) => other !== id && !siblings(id, other) && wrong.some((cell) => cell.present.has(other)));
    const withoutRival = rivals.map((rival) => tallyOf(rival, mine.filter((cell) => !cell.present.has(rival))));
    const othersWithout = demands
      .map((demand) => demand.id)
      .filter((other) => other !== id)
      .map((other) => tallyOf(other, toldBy(other).filter((cell) => !cell.present.has(id))));
    const alone = wrong.filter((cell) => [...cell.present].every((other) => other === id || siblings(id, other))).length;

    const compared = othersWithout.filter((tally) => tally.n >= MIN_CONTRAST);
    const selective = compared.length > 0 && compared.every(holds);
    const below = isBelow(overall);
    const pattern =
      below &&
      phrasesBelow >= PATTERN_MIN_PHRASES &&
      withoutRival.every((tally) => tally.n >= MIN_CONTRAST && isBelow(tally)) &&
      selective;
    const isolated = below && alone >= MIN_ALONE_WRONG && alone * 2 > wrong.length && selective;

    return {
      skill,
      demand: id,
      n: overall.n,
      right: overall.right,
      phrases,
      phrasesBelow,
      below,
      selectivity: pattern ? 'pattern' : isolated ? 'isolated' : 'ambiguous',
      basis: {
        alone: { wrong: alone, of: wrong.length },
        withoutRival: withoutRival.map((tally) => ({ demand: tally.demand, n: tally.n, right: tally.right })),
        othersWithout: othersWithout.map((tally) => ({ demand: tally.demand, n: tally.n, right: tally.right })),
      },
      observations: window.map((evidence) => evidence.observationId),
    };
  });
}

/**
 * Per reading-strand skill and per demand its recent evidence counted: the
 * opportunities and rights over the skill's last `DEMAND_WINDOW_READS` reads
 * up to `today`, and whether the observations single the demand out. Reads
 * only evidence stored under the evidence definitions in force
 * (`storedEvidence`); a row without it contributes nothing.
 */
export function demandReadings(rows: readonly SessionRow[], vocabulary: Vocabulary, today: Date): DemandReading[] {
  const bySkill = new Map<string, MeasuredEvidence[]>();
  for (const row of rows) {
    for (const evidence of storedEvidence(row)) {
      if (evidence.kind !== 'measured' || Date.parse(evidence.at) > today.getTime()) continue;
      bySkill.set(evidence.skill, [...(bySkill.get(evidence.skill) ?? []), evidence]);
    }
  }
  return vocabulary.skills
    .filter((skill) => READING_STRAND_KINDS.includes(skill.kind))
    .flatMap((skill) => {
      const window = (bySkill.get(skill.id) ?? []).sort((a, b) => a.at.localeCompare(b.at)).slice(-DEMAND_WINDOW_READS);
      return window.length === 0 ? [] : readSkill(skill.id, window, vocabulary);
    });
}
