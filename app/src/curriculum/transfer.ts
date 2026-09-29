/**
 * The relationship facts of a transfer offer (D4 item 5; Part 26's context relationship): how a
 * candidate relates to what a skill was shown on, as categorical facts — never a distance, never a
 * verdict. The session's offer reads them (`session.ts`, the `transfer` claim) and a transfer-intended
 * run stores them (`RunHeader.relationship`), for the post-E policy that alone decides whether a run
 * demonstrated anything.
 *
 * **What the skill was shown on** (`establishedOn`) is the ladder's own answer, never a second
 * reading of its rules. The items: those the ladder's proficiency was shown on (its `shownOn`), asked
 * of `ladderState` itself — a probe, a supporting full-standard first contact on an item dated after
 * the history, turns `transfer` on exactly when the item is not among them. The records: the
 * supporting full-standard ones on those items up to the reading that last reached proficiency (a
 * replay of the ladder over the history's prefixes). A reset the ladder makes below proficiency is not
 * visible to either question, so a record on the same item before such a reset can be included: more
 * material than established the skill, never less, which only makes a candidate less likely to differ.
 * A record whose run stored no material (a legacy run, from before D4) is an **unknown historical
 * reference**: its item id and nothing else, never the catalogue item's current identity in its place.
 *
 * **The dimensions** (`DIMENSIONS`), each with the candidate's value, every reference's, and whether
 * the candidate differs from every reference whose value is known (`unknown` where none is, or the
 * candidate's is not known):
 *
 * - `family`: a generator's family; a notated item's composition (`provenance.composition`, the
 *   build's work key); for a reference, its material's, else read from its item by id — a family does
 *   not change with a version, and a reading row's is `sight-reading`;
 * - `source`: generated or notated (the generated → authentic step);
 * - `key`: the key signature in fifths — a notated or generated item's measured key
 *   (`notation.keys`), a phrase's from its recipe where the recipe fixes one; a key the seed chose
 *   from a set is not known;
 * - `hands`: the hands the item is for, and the hands the reference's run played;
 * - `texture` and `rhythm`: the texture demands and the rhythm and metre demands present — the
 *   candidate's measured `demands`, a reference's located in the notation its run played (its stored
 *   evidence's per-demand entries) — presence on both sides, so a difference means one side has none
 *   of what the other has.
 *
 * The declared ones are the contract's (`provenance.transferOf`: `differs`, and `notMeasured` as
 * such), carried as declared with the families they were written against (`from`), which need not be
 * the family that established the skill. `differsOn` is the dimensions measured to differ, then the
 * declared ones not already among them: all that the offer reads.
 */
import type { SessionRow } from '../data/db';
import type { Evidence, MeasuredEvidence } from '../evidence/evidence';
import { LADDER_STATES, ladderState, supports } from '../evidence/ladder';
import { storedEvidence } from '../evidence/readingState';
import type { Identity } from '../review/record';
import { knownMaterial, materialOfItem, sameMaterial } from './material';
import type { CatalogItem, TransferOf } from './types';

/** Something a skill was shown on: its item, and its exact material where the run stored one. */
export interface MaterialReference {
  itemId: string;
  /** Absent: an unknown historical reference — a run that stored no material (from before D4). */
  material?: Identity;
}

export const DIMENSIONS = ['family', 'source', 'key', 'hands', 'texture', 'rhythm'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

/** One measured dimension: the candidate's value, each reference's in `shownOn`'s order, and whether it differs. */
export interface DimensionFact {
  dimension: Dimension;
  /** Null: not known for the candidate. */
  candidate: string | null;
  /** Null: not known for that reference. */
  shownOn: (string | null)[];
  /** True: differs from every reference whose value is known. `unknown`: no reference's is, or the candidate's is not. */
  differs: boolean | 'unknown';
}

export interface Relationship {
  skill: string;
  /** What the skill was shown on (`establishedOn`), as references. */
  shownOn: MaterialReference[];
  /** The contract's declaration for the candidate's recipe, as declared (a transfer role's `provenance.transferOf`). */
  declared?: TransferOf;
  measured: DimensionFact[];
  /** The dimensions measured to differ, then the declared ones not among them. */
  differsOn: string[];
  /** A notated candidate's composition, and the items of it this learner has runs of (the whole piece played, another cut). */
  composition?: { key: string; playedAs: string[] };
}

const TEXTURE = new Set(['texture.hands-together', 'texture.left-hand-pattern', 'texture.walking-bass']);
const isRhythm = (demand: string): boolean => demand.startsWith('rhythm.') || demand.startsWith('metre.');
const PROFICIENT = LADDER_STATES.indexOf('proficient');

/** One record a skill was shown on: its reference, and the run it came from (whose hands and demands the facts read). */
export interface Established {
  reference: MaterialReference;
  row: SessionRow;
}

function probe(skill: string, itemId: string, at: string): MeasuredEvidence {
  return {
    kind: 'measured',
    skill,
    observationId: null,
    standard: 'full',
    n: 1,
    right: 1,
    at,
    context: { itemId, firstContact: true, met: [], unattributed: 0, estimated: false },
    byDemand: [],
  } as unknown as MeasuredEvidence;
}

/** The records a skill was shown on, with their rows (see the module note). */
function establishing(skill: string, rows: readonly SessionRow[]): Established[] {
  const records: { evidence: Evidence; row: SessionRow }[] = [];
  for (const row of rows) for (const evidence of storedEvidence(row)) if (evidence.skill === skill) records.push({ evidence, row });
  const measured = records
    .filter((one): one is { evidence: MeasuredEvidence; row: SessionRow } => one.evidence.kind === 'measured')
    .sort((a, b) => a.evidence.at.localeCompare(b.evidence.at));
  const last = measured.at(-1)?.evidence.at;
  if (last === undefined) return [];
  const today = new Date(last);
  const all = records.map((one) => one.evidence);
  const reading = ladderState({ evidence: all, today });
  if (LADDER_STATES.indexOf(reading.state) < PROFICIENT) return [];
  // The reading that last reached proficiency: the ladder over each prefix of the history.
  let reach = -1;
  let before = false;
  measured.forEach((_, index) => {
    const now = LADDER_STATES.indexOf(ladderState({ evidence: measured.slice(0, index + 1).map((one) => one.evidence), today }).state) >= PROFICIENT;
    if (now && !before) reach = index;
    before = now;
  });
  const full = measured.slice(0, reach + 1).filter((one) => one.evidence.standard === 'full' && supports(one.evidence));
  // The items the ladder says it was shown on, asked of the ladder: a probe on an item among them changes nothing.
  const after = new Date(Date.parse(last) + 1000).toISOString();
  const items = [...new Set(full.map((one) => one.evidence.context.itemId))];
  const shownOn = reading.transfer
    ? new Set(items)
    : new Set(items.filter((itemId) => !ladderState({ evidence: [...all, probe(skill, itemId, after)], today }).transfer));
  return full
    .filter((one) => shownOn.has(one.evidence.context.itemId))
    .map((one) => {
      const material = one.evidence.context.material ?? one.row.material;
      return { reference: { itemId: one.evidence.context.itemId, ...(knownMaterial(material) ? { material } : {}) }, row: one.row };
    });
}

/** What a skill was shown on, as references (see the module note); none for a skill not proficient. */
export function establishedOn(skill: string, rows: readonly SessionRow[]): MaterialReference[] {
  return establishing(skill, rows).map((one) => one.reference);
}

/** The records behind `establishedOn`, read once for several candidates of one skill (`relationshipOf`'s last argument). */
export type ShownOn = readonly Established[];

export function shownOnRecords(skill: string, rows: readonly SessionRow[]): ShownOn {
  return establishing(skill, rows);
}

function joined(demands: readonly string[] | undefined, keep: (demand: string) => boolean): string | null {
  if (demands === undefined) return null;
  const found = [...new Set(demands.filter(keep))].sort();
  return found.length === 0 ? 'none' : found.join(', ');
}

function keyOfItem(item: CatalogItem | undefined): string | null {
  const keys = item?.notation?.keys;
  return keys && keys.length > 0 ? keys.map((key) => String(key.fifths)).join(' then ') : null;
}

function familyOfItem(item: CatalogItem | undefined): string | null {
  if (item === undefined) return null;
  const identity = item.provenance?.identity;
  if (identity?.kind === 'generator') return identity.family;
  const generator = (item.drill as { generator?: { family?: string } } | null | undefined)?.generator?.family;
  if (generator !== undefined) return generator;
  if (item.drill?.kind === 'sight-reading') return 'sight-reading';
  return item.provenance?.composition ?? null;
}

function sourceOfItem(item: CatalogItem | undefined): string | null {
  const source = item?.provenance?.source;
  if (source === undefined) return null;
  return source === 'generated' || source === 'runtime' ? 'generated' : source === 'placeholder' ? null : 'notated';
}

const HANDS: Readonly<Record<string, string>> = { R: 'right', L: 'left', both: 'both', right: 'right', left: 'left' };

/** The demands located in the notation a run played, from its stored evidence's per-demand entries. */
function playedDemands(row: SessionRow): string[] | undefined {
  const measured = storedEvidence(row).filter((one): one is MeasuredEvidence => one.kind === 'measured');
  if (measured.length === 0) return undefined;
  return measured.flatMap((one) => [...one.byDemand.map((entry) => entry.demand), ...(one.otherDemands ?? []).map((entry) => entry.demand)]);
}

function referenceFacts(one: Established, byId: ReadonlyMap<string, CatalogItem>): Record<Dimension, string | null> {
  const material = one.reference.material;
  const item = byId.get(one.reference.itemId);
  // The item's own measured key only where its identity now is the material the run played.
  const current = item === undefined ? undefined : materialOfItem(item);
  const same = material !== undefined && sameMaterial(material, current);
  const recipeKey = material?.kind === 'generator' && typeof material.recipe.fifths === 'number' ? String(material.recipe.fifths) : null;
  const demands = playedDemands(one.row);
  return {
    family: material?.kind === 'generator' ? material.family : material?.kind === 'file' ? (item?.provenance?.composition ?? null) : familyOfItem(item),
    source: material?.kind === 'generator' ? 'generated' : material?.kind === 'file' ? 'notated' : sourceOfItem(item),
    key: recipeKey ?? (same ? keyOfItem(item) : null),
    hands: HANDS[one.row.hands?.played ?? ''] ?? null,
    texture: joined(demands, (demand) => TEXTURE.has(demand)),
    rhythm: joined(demands, isRhythm),
  };
}

function candidateFacts(item: CatalogItem): Record<Dimension, string | null> {
  const material = materialOfItem(item);
  const demands = Array.isArray(item.demands) ? item.demands : undefined;
  return {
    family: material?.kind === 'generator' ? material.family : material?.kind === 'file' ? (item.provenance?.composition ?? null) : familyOfItem(item),
    source: material?.kind === 'generator' ? 'generated' : material?.kind === 'file' ? 'notated' : sourceOfItem(item),
    key: keyOfItem(item),
    hands: HANDS[item.hands] ?? null,
    texture: joined(demands, (demand) => TEXTURE.has(demand)),
    rhythm: joined(demands, isRhythm),
  };
}

/**
 * How `candidate` relates to what `skill` was shown on in `rows` (see the module note). Pure: the same
 * rows and catalogue give the same facts, which is why the offer and the run it opens record the same.
 */
export function relationshipOf(
  skill: string,
  candidate: CatalogItem,
  rows: readonly SessionRow[],
  byId: ReadonlyMap<string, CatalogItem>,
  shownOn: ShownOn = establishing(skill, rows),
): Relationship {
  const established = shownOn;
  const mine = candidateFacts(candidate);
  const theirs = established.map((one) => referenceFacts(one, byId));
  const measured: DimensionFact[] = DIMENSIONS.map((dimension) => {
    const shownOn = theirs.map((facts) => facts[dimension]);
    const known = shownOn.filter((value): value is string => value !== null);
    const value = mine[dimension];
    const differs = value === null || known.length === 0 ? ('unknown' as const) : known.every((one) => one !== value);
    return { dimension, candidate: value, shownOn, differs };
  });
  const declared = candidate.provenance?.transferOf;
  const differsOn = [...new Set([...measured.filter((fact) => fact.differs === true).map((fact) => fact.dimension), ...(declared?.differs ?? [])])];
  const key = candidate.provenance?.composition;
  const composition =
    key === undefined
      ? undefined
      : {
          key,
          playedAs: [...new Set(rows.map((row) => row.itemId))].filter((id) => id !== candidate.id && byId.get(id)?.provenance?.composition === key),
        };
  return {
    skill,
    shownOn: established.map((one) => one.reference),
    ...(declared === undefined ? {} : { declared }),
    measured,
    differsOn,
    ...(composition === undefined ? {} : { composition }),
  };
}
