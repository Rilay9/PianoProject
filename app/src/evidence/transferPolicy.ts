/**
 * The transfer policy (G2; audit Part 26; the reviewer's fact path, `docs/review/responses/a96395d.md`):
 * whether one attempt demonstrated that a skill generalised, and on which of the skill's dimensions —
 * read from three facts the attempt carries and the establishing contexts the ladder's replay holds,
 * never from a different item id and never as a distance.
 *
 * **The three facts, in order.**
 *
 * 1. **Contact** (`context.firstContact`, G1a's relation, populated from the run header's field and
 *    absent where the header's is): absent is `unknown`; `false` is `not-transfer` — first contact is
 *    a condition of a transfer demonstration, and G1's history counts a heard, viewed or pruned
 *    encounter and a duplicate's bytes as contact before the run is stored, so nothing here scans runs.
 * 2. **Relationship** (`context.relationship`, D4's `relationshipOf`, written with the attempt at
 *    `recordRun`, or the offer's as the offer made it): absent is `unknown` (a legacy row; a D4 race
 *    row with `intent: 'transfer'` and no relationship, G68). A dimension differs **only where its
 *    measured fact says `true`** (`measured[d].differs === true`); `differsOn` is never read, and a
 *    declared difference (`declared.differs`) is read only to write a disagreement into `why` — it is
 *    never evidence (the reviewer's constraint on D4, `responses/9193261.md`). Where every establishing
 *    reference is unknown (legacy reads, no material) the measured facts were taken against nothing
 *    known, and the reading is `unknown`.
 *    Before the dimensions, **a new seed of material the skill was shown on** is `not-transfer`: the
 *    same generator family, version and recipe as an establishing reference, the seed apart (Part 26's
 *    first adversary). D4's texture and rhythm facts compare the sets of demands present, so a seed
 *    that happens to carry another rhythm would otherwise "measure" a difference no contract made.
 * 3. **The claim** (the skill's `transfer.dimensions`, the vocabulary's data): a skill without the
 *    block reads `unknown` and credits nothing until the data names what matters for it.
 *    `demonstrated` where at least one of the skill's dimensions measurably differs **and** the run
 *    supported the skill at the full standard; `on` is that intersection. No skill dimension known to
 *    differ and one not known is `unknown`; all known and none differing is `not-transfer`.
 *
 * **Two consumers, one reading** (`ladder.ts`). Promotion takes `demonstrated`. Challenge protection
 * (`sparesFailure`) takes the same reading at another threshold: a failed full-standard attempt is not
 * counted against the skill where first contact is `true` and either a skill dimension measurably
 * differs (`differs`) or the attempt's demands carry one no establishing record carried (`newDemands`,
 * only where the attempt's and every establishing record's demands are known). Unknown facts are never
 * guessed into either verdict. A composition already played (`relationship.composition`) is named in
 * `why` and judged like any material on the skill's dimensions: first contact with this notation
 * stands (Part 26: a section is "recognised, not the same piece", an arrangement "related, neither
 * blindly new nor familiar"; the relationship holds no fact that tells the two apart).
 *
 * This module reads the attempt it is handed and the list it is handed, and calls nothing that reads
 * the ladder (no `ladderState`, nothing in `curriculum/transfer.ts`): the ladder calls it while it
 * replays, and a helper that asked the ladder back would recurse (the reviewer's required change).
 */
import { DEFAULT_MASTERY } from '../engine/Scoring';
import { knownMaterial } from '../curriculum/material';
import type { Identity } from '../review/record';
import type { Dimension, Relationship } from '../curriculum/transfer';
import type { SkillTransfer } from '../demands/vocabulary';
import type { MeasuredEvidence } from './evidence';

export type { SkillTransfer } from '../demands/vocabulary';

/** What the policy needs of a skill: its id, and its transfer block where the vocabulary gives one. */
export interface SkillTransferSource {
  id: string;
  transfer?: SkillTransfer;
}

/**
 * One context the skill was established on, as the ladder's replay holds it: the record's item and
 * material (a D4 `MaterialReference`; no material is an unknown historical reference), and the demands
 * its run measured (`context.demands`, absent before G2).
 */
export interface EstablishedContext {
  itemId: string;
  material?: Identity;
  demands?: readonly string[];
}

export type TransferVerdict = 'demonstrated' | 'not-transfer' | 'unknown';

export interface TransferReading {
  verdict: TransferVerdict;
  /** Where transfer was demonstrated: the skill's dimensions measured to differ. Empty unless `demonstrated`. */
  on: Dimension[];
  /** The facts that decided it, in words, for a reader of the record (never the learner's screen). */
  why: string;
  /**
   * The skill's dimensions this attempt measurably differs on, whatever its outcome: what protection
   * reads. Empty where the reading is decided before the dimensions (contact, no relationship, a new
   * seed, a skill without dimensions).
   */
  differs: Dimension[];
  /**
   * The attempt's measured demands that no establishing record carried; `[]` where there are none, or
   * where the attempt is a new seed of established material; absent where the attempt's demands or any
   * establishing record's are not known.
   */
  newDemands?: string[];
}

/** What the policy reads of an attempt: its context (the facts), its standard and its counts. */
export type TransferAttempt = Pick<MeasuredEvidence, 'context' | 'standard' | 'n' | 'right'>;

/** Supported at the full standard: the ladder's `supports` share (`SUPPORT_SHARE`, Part G's pass share; a test holds the two equal). */
export function supportedAtFull(run: Pick<TransferAttempt, 'standard' | 'n' | 'right'>): boolean {
  return run.standard === 'full' && run.n > 0 && run.right / run.n >= DEFAULT_MASTERY.passAccuracy;
}

/** The same generator family, version and recipe: a new seed of that material (or the material itself). */
function newSeedOf(material: Identity | undefined, shown: Identity | undefined): boolean {
  if (material?.kind !== 'generator' || shown?.kind !== 'generator') return false;
  return material.family === shown.family && material.version === shown.version && canonical(material.recipe) === canonical(shown.recipe);
}

/** One spelling for one value, object keys in order: the recipe compared whatever order it was built in. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, inner]) => inner !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, inner]) => `${JSON.stringify(key)}:${canonical(inner)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** The attempt's demands no establishing record carried, or undefined where either side is not known. */
function demandsNoneCarried(demands: readonly string[] | undefined, established: readonly EstablishedContext[]): string[] | undefined {
  if (demands === undefined || established.length === 0) return undefined;
  if (established.some((one) => one.demands === undefined)) return undefined;
  const carried = new Set(established.flatMap((one) => one.demands ?? []));
  return [...new Set(demands)].filter((demand) => !carried.has(demand)).sort();
}

function composed(relationship: Relationship): string {
  const composition = relationship.composition;
  if (composition === undefined || composition.playedAs.length === 0) return '';
  return `; a composition already played (${composition.key}, as ${composition.playedAs.join(', ')}): this notation is still first contact`;
}

/**
 * Whether `run` demonstrated transfer of `skill`, and on which dimensions (see the module note). Pure:
 * the same attempt, list and skill give the same reading.
 */
export function transferReading(
  skill: SkillTransferSource,
  established: readonly EstablishedContext[],
  run: TransferAttempt,
): TransferReading {
  const context = run.context;
  const none = (verdict: TransferVerdict, why: string, newDemands?: string[]): TransferReading => ({
    verdict,
    on: [],
    why,
    differs: [],
    ...(newDemands === undefined ? {} : { newDemands }),
  });
  const newDemands = demandsNoneCarried(context.demands, established);

  // 1. Contact.
  if (context.firstContact === undefined) return none('unknown', 'first contact not recorded (a row from before G1a)', newDemands);
  if (!context.firstContact) return none('not-transfer', 'not first contact: this material was met before (played, heard, seen or a copy of it)', newDemands);

  // 2. Relationship.
  const relationship = context.relationship;
  if (relationship === undefined) {
    return none(
      'unknown',
      context.intent === 'transfer'
        ? 'transfer-intended, the relationship unknown (a run from before D4a, G68): never evidence of a tested relationship'
        : 'no relationship recorded (a legacy row, or one from before G2)',
      newDemands,
    );
  }
  const unknownReference = (one: { material?: Identity }): boolean => !knownMaterial(one.material);
  if (established.length === 0 || established.every(unknownReference) || relationship.shownOn.every(unknownReference)) {
    return none('unknown', 'every establishing reference is unknown (no material recorded)', newDemands);
  }
  const shownAgain = established.find((one) => newSeedOf(context.material, one.material));
  if (shownAgain !== undefined) {
    return none('not-transfer', `a new seed of material the skill was shown on (${shownAgain.itemId}: family, version and recipe the same)`, []);
  }

  // 3. The skill's claim.
  const dimensions = skill.transfer?.dimensions ?? [];
  if (dimensions.length === 0) return none('unknown', `${skill.id} names no transfer dimensions yet: nothing is credited`, newDemands);
  const notes: string[] = [];
  const differs: Dimension[] = [];
  let unknown = false;
  for (const dimension of dimensions) {
    const measured = relationship.measured.find((fact) => fact.dimension === dimension)?.differs ?? 'unknown';
    const declared = relationship.declared?.differs.includes(dimension) === true;
    if (measured === true) differs.push(dimension);
    else if (measured === 'unknown') unknown = true;
    if (declared && measured !== true) {
      notes.push(`${dimension}: declared to differ, measured ${measured === false ? 'the same' : 'unknown'} — not credited`);
    }
  }
  const tail = `${notes.length > 0 ? `; ${notes.join('; ')}` : ''}${composed(relationship)}`;
  if (differs.length === 0) {
    return unknown
      ? none('unknown', `no dimension of ${skill.id} known to differ, and one not known${tail}`, newDemands)
      : none('not-transfer', `nothing ${skill.id} names differs (${dimensions.join(', ')} the same)${tail}`, newDemands);
  }
  if (!supportedAtFull(run)) {
    return { verdict: 'not-transfer', on: [], why: `differs on ${differs.join(', ')}, but not supported at the full standard${tail}`, differs, ...(newDemands === undefined ? {} : { newDemands }) };
  }
  return { verdict: 'demonstrated', on: differs, why: `first contact, supported at the full standard, differing on ${differs.join(', ')}${tail}`, differs, ...(newDemands === undefined ? {} : { newDemands }) };
}

/**
 * Challenge protection (see the module note): whether a failed full-standard attempt is spared from
 * counting against the skill. `reading` is `transferReading` of the same attempt.
 */
export function sparesFailure(reading: TransferReading, run: TransferAttempt): boolean {
  return run.context.firstContact === true && (reading.differs.length > 0 || (reading.newDemands?.length ?? 0) > 0);
}
