/**
 * One material identity (D4 item 1; Part 26's contact novelty; the reviewer's required change,
 * `docs/review/responses/612288e.md`): D2's `Identity` (`review/record.ts`), never a second one.
 *
 * - **A catalogue row's material is the build's** (`provenance.identity`, written by
 *   `build.attach_provenance` from `review.current_identity`): a generated item's generator family,
 *   version and seed with its recipe and tempo; a notated item's built file by its sha256, an
 *   excerpt's cut included; `none` for a drill made when it opens or a placeholder. The app never
 *   recomputes it.
 * - **A runtime phrase's material is the complete generator identity** (`phraseMaterial`): the
 *   family, version and seed the phrase names (D1a's `generator`, which alone is not an identity),
 *   the exact recipe it was drawn from — the generator options it was written from, which are the
 *   reading row's params with the reader's moves and the rung's hold over them (`readingOptions`),
 *   seed and version apart — and the tempo written into it. The row id, the reader's intent (`easy`)
 *   and the route's spelling of the moves are not the recipe: two rows whose options are equal write
 *   the same phrase from the same seed, and calling those two materials would be a false first
 *   contact. The tempo is determined by the recipe (its `bpm`, else the version's default), so it
 *   adds no discrimination and D2's type is kept whole.
 * - **Equality for contact** (`sameMaterial`): D2's `sameIdentity` for a file (its sha256) and a
 *   generator (family, version, seed, recipe, tempo), and **never** for `none`, which D2's record
 *   treats as one identity (a decision on a placeholder binds to "no file") but which names no
 *   material: two placeholders are not one piece, and a drill made when it opens has met nothing
 *   by that identity.
 */
import { sameIdentity, type Identity } from '../review/record';
import type { PhraseGenerator } from '../data/db';
import type { SightReadingOptions } from '../engine/sightReading';
import type { Relationship } from './transfer';
import type { CatalogItem } from './types';

/** A material the record can compare: a file or a generator identity, never `none`. */
export type KnownMaterial = Exclude<Identity, { kind: 'none' }>;

export function knownMaterial(material: Identity | undefined): material is KnownMaterial {
  return material !== undefined && (material.kind === 'file' || material.kind === 'generator');
}

/** The same material: both known, and D2's equality (a file by its sha256, a generator by its whole identity). */
export function sameMaterial(a: Identity | undefined, b: Identity | undefined): boolean {
  return knownMaterial(a) && knownMaterial(b) && sameIdentity(a, b);
}

/** What an import is: the build keyed no identity for it, and the app does not make one up. */
const IMPORT: Identity = { kind: 'none', why: 'an imported score: no build identity' };

/**
 * A catalogue item's material: the build's `provenance.identity` for a bundled item, `none` for an
 * import, undefined for a row from a catalogue built before D4 (a run of it is a legacy run).
 */
export function materialOfItem(item: CatalogItem): Identity | undefined {
  if (item.imported === true) return IMPORT;
  return item.provenance?.identity;
}

/**
 * A sight-reading phrase's material: the complete generator identity (see the module note). `options`
 * are the ones the phrase was written from (`readingOptions`, which the Score screen and the tests
 * pass to `generateSightReading`); `bpm` the tempo the phrase was written at (its result's `bpm`).
 */
export function phraseMaterial(generator: PhraseGenerator, options: SightReadingOptions, bpm: number): Identity {
  const { seed: _seed, version: _version, ...recipe } = options;
  return {
    kind: 'generator',
    family: generator.family,
    version: generator.version,
    seed: generator.seed,
    recipe: JSON.parse(JSON.stringify(recipe)) as Record<string, unknown>,
    tempoBpm: bpm,
  };
}

/** The facts a run keeps about what was played and why (D4 item 2): what the Score screen writes. */
export interface RunFacts {
  material?: Identity;
  role?: 'canonical' | 'variable' | 'transfer';
  intent?: 'transfer';
  relationship?: Relationship;
}

/**
 * A run's facts: its material — the phrase's for a sight-reading run, else the row's — the item's
 * role where it has one, and, only for a run that came from a transfer offer, the intent and the
 * relationship facts the offer had. Nothing is invented: a row with no identity gives no material.
 */
export function runFacts(
  item: CatalogItem,
  run: {
    phrase?: { generator: PhraseGenerator; options: SightReadingOptions; bpm: number };
    intent?: 'transfer';
    relationship?: Relationship;
  } = {},
): RunFacts {
  const material = run.phrase ? phraseMaterial(run.phrase.generator, run.phrase.options, run.phrase.bpm) : materialOfItem(item);
  return {
    ...(material === undefined ? {} : { material }),
    ...(item.role === undefined ? {} : { role: item.role }),
    ...(run.intent === undefined ? {} : { intent: run.intent }),
    ...(run.intent === undefined || run.relationship === undefined ? {} : { relationship: run.relationship }),
  };
}
