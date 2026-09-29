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

/**
 * What an import is where its bytes are not in hand: the build keyed no identity for it, and nothing
 * here makes one up. Where the Score screen has loaded the score it hashes the bytes it loaded
 * (`textIdentity`) and hands that identity to `runFacts` (G1): an import is then its file, like any
 * notated item, and a duplicate import under a new id is the same material.
 */
const IMPORT: Identity = { kind: 'none', why: 'an imported score: no build identity' };

/**
 * A catalogue item's material: the build's `provenance.identity` for a bundled item, `none` for an
 * import (the catalogue row carries no bytes: G1 hashes them where the Score screen loads them), and
 * undefined for a row from a catalogue built before D4 (a run of it is a legacy run).
 */
export function materialOfItem(item: CatalogItem): Identity | undefined {
  if (item.imported === true) return IMPORT;
  return item.provenance?.identity;
}

/**
 * The file identity of a score's text as the app stores it (G1): the sha256 of its UTF-8 bytes — an
 * imported MusicXML file is kept as that text (`ImportRow.data`), and the Score screen reads exactly
 * it. Undefined where the browser offers no digest (`crypto.subtle` is only there in a secure
 * context): the import is then read by its id, as before, and nothing is guessed.
 */
export async function textIdentity(text: string): Promise<Extract<Identity, { kind: 'file' }> | undefined> {
  const subtle = (globalThis as { crypto?: Crypto }).crypto?.subtle;
  if (subtle === undefined) return undefined;
  try {
    const digest = new Uint8Array(await subtle.digest('SHA-256', new TextEncoder().encode(text)));
    return { kind: 'file', sha256: [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('') };
  } catch {
    return undefined;
  }
}

/** Every object's keys in order, so one value has one spelling whatever order it was built in. */
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

/**
 * The one string a material is looked up by (G1: the `encounters` index and the `contacts` key): equal
 * exactly where `sameMaterial` says the same material — a file by its sha256, a generator by family,
 * version, seed, the recipe with its keys in any order, and tempo. A material that names nothing
 * (`none`, or none at all: a legacy run, a drill made when it opens) is keyed by the item id, as D4's
 * `met-by-id` reads it; such a key never equals a material's.
 */
export function materialKey(material: Identity | undefined, itemId: string): string {
  if (material?.kind === 'file') return `file:${material.sha256}`;
  if (material?.kind === 'generator') {
    return `generator:${canonical({ family: material.family, version: material.version, seed: material.seed, recipe: material.recipe, tempoBpm: material.tempoBpm })}`;
  }
  return `id:${itemId}`;
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

/**
 * A transfer-intended run's one fact: the intent and the relationship the offer was made on, together
 * (D4a; the reviewer's required change on D4, `docs/review/responses/9193261.md`). Never one without
 * the other: a run that says it was transfer-intended and not what the offer related it to is the
 * partial record D4's race stored.
 */
export interface TransferFact {
  intent: 'transfer';
  relationship: Relationship;
}

/** No transfer fact: neither half may appear alone. */
interface NoTransferFact {
  intent?: never;
  relationship?: never;
}

/** What a run was played on, whatever it was for. */
interface MaterialFacts {
  material?: Identity;
  role?: 'canonical' | 'variable' | 'transfer';
}

/**
 * The facts a run keeps about what was played and why (D4 item 2): what the Score screen writes. The
 * transfer fact is the pair or nothing (D4a), so no code can construct an intent-only `RunFacts`.
 */
export type RunFacts = MaterialFacts & (TransferFact | NoTransferFact);

/**
 * What `runFacts` is told about the run: its phrase, if generated; the identity of the bytes the
 * Score screen loaded, for an import (G1, `textIdentity`); and the offer's pair, if it came from one.
 */
export type RunOrigin = {
  phrase?: { generator: PhraseGenerator; options: SightReadingOptions; bpm: number };
  loaded?: Extract<Identity, { kind: 'file' }>;
} & (TransferFact | NoTransferFact);

/**
 * The material a run of this item played (G1's one place for it, which the encounters written on the
 * same visit share): the phrase's complete identity for a sight-reading run; for an import, the file
 * the screen loaded where it could hash it (else `none`); otherwise the catalogue row's.
 */
export function playedMaterial(item: CatalogItem, run: Pick<RunOrigin, 'phrase' | 'loaded'> = {}): Identity | undefined {
  if (run.phrase) return phraseMaterial(run.phrase.generator, run.phrase.options, run.phrase.bpm);
  if (item.imported === true && run.loaded !== undefined) return run.loaded;
  return materialOfItem(item);
}

/**
 * A run's facts: its material (`playedMaterial`) — the phrase's for a sight-reading run, an import's
 * loaded bytes, else the row's — the item's role where it has one, and, only for a run that came from a
 * transfer offer whose snapshot the Score screen found (`data/offerSnapshot.ts`), the intent and the
 * relationship that offer was made on, as one fact. Nothing is invented: a row with no identity gives
 * no material, and an intent handed in without its relationship (which only a cast past the type can
 * do) gives no transfer fact at all.
 */
export function runFacts(item: CatalogItem, run: RunOrigin = {}): RunFacts {
  const material = playedMaterial(item, run);
  const facts: MaterialFacts = {
    ...(material === undefined ? {} : { material }),
    ...(item.role === undefined ? {} : { role: item.role }),
  };
  const transfer = run.intent === 'transfer' && run.relationship !== undefined ? run.relationship : undefined;
  return transfer === undefined ? facts : { ...facts, intent: 'transfer', relationship: transfer };
}
