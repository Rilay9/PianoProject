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
 * - **Equality for contact** (`sameMaterial`, the learner's material equality): D2's `sameIdentity`
 *   for a file (its sha256) and a generator (family, version, seed, recipe, tempo) after a stored
 *   file identity is resolved through the catalogue's former identities (`learnerMaterial`, below),
 *   and **never** for `none`, which D2's record treats as one identity (a decision on a placeholder
 *   binds to "no file") but which names no material: two placeholders are not one piece, and a drill
 *   made when it opens has met nothing by that identity.
 * - **Former identities: learner continuity only** (E50a; the reviewer's alias boundary,
 *   `docs/review/responses/questions-f7acb2c0.md`). Until E50a music21 wrote the day it ran into
 *   every file it wrote (`<encoding-date>`), so a converted file's sha256 moved with the calendar
 *   while its music stood still. The converter writes no date now, and each row whose file it wrote
 *   carries the recorded historical identities of its dated forms (`provenance.formerIdentities`:
 *   `tools/content/former_identities.json`, re-proved by `convert.former_identities` in
 *   `build.attach_provenance`; historical data, never a rolling window).
 *   A run, an encounter, a pruned run's summary or a project stored against a dated file names the
 *   same learner material as the row's current file: `learnerMaterial` resolves it at read, and no
 *   stored row is rewritten. Storage keys stay the row's own (`materialKey`); equality uses the
 *   resolved key (`learnerMaterialKey`); a lookup asks every key the material's rows may sit under
 *   (`learnerMaterialKeys`). Nothing else widens: D2's `sameIdentity` and its review record, an
 *   excerpt's `parentSha256` staleness, the committed-file integrity checks and the
 *   render/cache/checksum identities keep asking about exact bytes, and none of them reads this.
 * - **A repaired tempo is not the old run's denominator** (E50b; the reviewer's required change on E50,
 *   `docs/review/responses/68e0479b.md`). E50 re-converted seven PDMX scores so their printed tempo is
 *   their mark, and their former identities carry the old files for continuity. A run of an old file
 *   stored its `tempoPct` of the converter's defaulted 96, so the build lists those old files apart
 *   (`provenance.tempoRepairedFrom`) and `tempoNotComparable` says which stored runs they are, for the
 *   one reader that judges a stored run's tempo against the item's standard (`rungState.meetsStandard`).
 * - **A former generator identity: learner continuity only** (CL15; the reviewer's required change,
 *   `docs/review/responses/questions-122a5224.md` §CL15). A generator family's version belongs to the
 *   whole family, so moving it moves the identity of every item in it, the items whose notes did not
 *   change among them. Each such unchanged item carries the identity it had at the version the family
 *   left (`provenance.formerGeneratorIdentities`, written by the generator only where the item's music
 *   digest there equals its digest now; an item whose notes changed carries none), and a learner row
 *   stored against that old identity names this row's material, resolved at read exactly as a former
 *   file is (a second map, below). The same rule: an identity that is some row's current identity is
 *   never read back as a former one. D2's `sameIdentity`, the review's current identity and the family a
 *   row belongs to (`transfer.ts` reads `identity.family`) keep reading `identity` alone.
 */
import { sameIdentity, type Identity } from '../review/record';
import type { PhraseGenerator, SessionRow } from '../data/db';
import type { SightReadingOptions } from '../engine/sightReading';
import type { Relationship } from './transfer';
import type { CatalogItem } from './types';

/** A material the record can compare: a file or a generator identity, never `none`. */
export type KnownMaterial = Exclude<Identity, { kind: 'none' }>;

export function knownMaterial(material: Identity | undefined): material is KnownMaterial {
  return material !== undefined && (material.kind === 'file' || material.kind === 'generator');
}

type FileIdentity = Extract<Identity, { kind: 'file' }>;
type GeneratorIdentity = Extract<Identity, { kind: 'generator' }>;

/** The loaded catalogue's former identities: a former sha256 to its row's current file identity. */
let currentOfFormer = new Map<string, FileIdentity>();
/** And back: a current sha256 to the former sha256s that resolve to it, for the lookups. */
let formersOfCurrent = new Map<string, string[]>();
/** CL15: a former generator identity's stored key (`materialKey`) to its row's current generator identity. */
let currentOfFormerGenerator = new Map<string, GeneratorIdentity>();
/** And back: a current generator identity's key to the former keys that resolve to it, for the lookups. */
let formerGeneratorsOfCurrent = new Map<string, string[]>();
/** E50b: the former sha256s whose file a reviewed repair changed the tempo of (`provenance.tempoRepairedFrom`). */
let tempoRepairedFiles = new Set<string>();
/** E50b: the rows whose tempo such a repair changed: a run of one that stored no material predates the repair. */
let tempoRepairedRows = new Set<string>();

/**
 * Feeds the learner-material resolution from a loaded catalogue (`load.loadCatalog` calls it with
 * `catalog.json`; a test may call it with its own rows). The table is the catalogue's alone and is
 * replaced, never added to. A row's former identity resolves to the row's current identity, with one
 * rule: a sha256 that is some row's current identity is never a former one, whichever row lists it —
 * a current file is always its own material. The same rows feed E50b's tempo lineage
 * (`tempoNotComparable`), under the same rule. CL15: a generated row's former generator identities
 * (`provenance.formerGeneratorIdentities`) resolve to the row's current generator identity in a second
 * map, by the same rule — a generator identity that is some row's current identity is never a former one.
 */
export function learnFormerIdentities(items: readonly CatalogItem[]): void {
  const current = new Set<string>();
  const currentGenerators = new Set<string>();
  for (const item of items) {
    const identity = item.provenance?.identity;
    if (identity?.kind === 'file') current.add(identity.sha256);
    if (identity?.kind === 'generator') currentGenerators.add(generatorKey(identity));
  }
  const toCurrent = new Map<string, FileIdentity>();
  const back = new Map<string, string[]>();
  const generatorToCurrent = new Map<string, GeneratorIdentity>();
  const generatorBack = new Map<string, string[]>();
  const tempoFiles = new Set<string>();
  const tempoRows = new Set<string>();
  for (const item of items) {
    const identity = item.provenance?.identity;
    const formerGenerators = item.provenance?.formerGeneratorIdentities;
    if (identity?.kind === 'generator' && formerGenerators !== undefined) {
      const own = generatorKey(identity);
      for (const one of formerGenerators) {
        if (one.kind !== 'generator') continue;
        const key = generatorKey(one);
        if (currentGenerators.has(key)) continue;
        generatorToCurrent.set(key, identity);
        generatorBack.set(own, [...(generatorBack.get(own) ?? []), key]);
      }
    }
    const former = item.provenance?.formerIdentities;
    if (identity?.kind !== 'file' || former === undefined) continue;
    for (const one of former) {
      if (one.kind !== 'file' || current.has(one.sha256)) continue;
      toCurrent.set(one.sha256, identity);
      back.set(identity.sha256, [...(back.get(identity.sha256) ?? []), one.sha256]);
    }
    const listed = new Set(former.map((one) => one.sha256));
    for (const one of item.provenance?.tempoRepairedFrom ?? []) {
      if (one.kind !== 'file' || current.has(one.sha256) || !listed.has(one.sha256)) continue;
      tempoFiles.add(one.sha256);
      tempoRows.add(item.id);
    }
  }
  currentOfFormer = toCurrent;
  formersOfCurrent = back;
  currentOfFormerGenerator = generatorToCurrent;
  formerGeneratorsOfCurrent = generatorBack;
  tempoRepairedFiles = tempoFiles;
  tempoRepairedRows = tempoRows;
}

/**
 * Whether a stored run's tempo was measured against a tempo a reviewed repair has since corrected (E50b; the
 * reviewer's required change on E50, `docs/review/responses/68e0479b.md` §3): its percentage is of the old
 * file's tempo (the converter's defaulted 96 for E50's seven and the Wabash cut), not of the tempo the repaired
 * score prints, so no tempo-dependent standard may read it as a percentage of that. True for a run that names a
 * file a loaded row lists in `provenance.tempoRepairedFrom`, whatever id it was stored under; and, for a run of such
 * a row's id, wherever the run does not itself show it was played against the repaired score's written tempo: it
 * names no material (a legacy run from before D4, when every file under the id was the old one) or records no base
 * tempo, or a base that was not the written one. What its percentage is of is never guessed. False for everything
 * else: a run of the repaired file itself at its written base (after the repair), every run of a row no repair
 * touched — no other legacy run is reinterpreted. It reads the run, never rewrites it, and says nothing about
 * contact, familiarity, projects or any observation no tempo decides.
 */
export function tempoNotComparable(run: Pick<SessionRow, 'itemId' | 'material' | 'baseTempo'>): boolean {
  const material = run.material;
  if (material?.kind === 'file' && tempoRepairedFiles.has(material.sha256)) return true;
  if (!tempoRepairedRows.has(run.itemId)) return false;
  const base = run.baseTempo;
  return !knownMaterial(material) || typeof base !== 'object' || base.source !== 'written';
}

/**
 * Whether the loaded catalogue marks this item id as one a reviewed repair changed the tempo of (E50c): a row
 * whose `provenance.tempoRepairedFrom` names a former file, under `learnFormerIdentities`' rule. The row-level
 * fact `tempoNotComparable` reads per run; `progressStore.recordRun` asks it before it reads stored runs for a
 * fresh mastery, so an item no repair touched is judged exactly as before. False for every id the loaded
 * catalogue never marks, and for every id before a catalogue is loaded.
 */
export function tempoRepairedRow(itemId: string): boolean {
  return tempoRepairedRows.has(itemId);
}

/**
 * The learner material a stored identity names now: a file identity the loaded catalogue lists among a
 * row's former identities is that row's current identity, and so is a generator identity a generated row
 * lists among its former generator identities (CL15); every other identity — a current file or
 * generator, one no row lists, `none`, none at all — is returned as it is. For learner continuity and
 * catalogue lookup only (the module note): never for a question about exact bytes or the exact review
 * identity.
 */
export function learnerMaterial<T extends Identity | undefined>(material: T): T | FileIdentity | GeneratorIdentity {
  if (material?.kind === 'generator') return currentOfFormerGenerator.get(generatorKey(material)) ?? material;
  if (material?.kind !== 'file') return material;
  return currentOfFormer.get(material.sha256) ?? material;
}

/** A generator identity's stored key (`materialKey`'s spelling; a generator's key never reads the item id). */
function generatorKey(material: GeneratorIdentity): string {
  return materialKey(material, '');
}

/**
 * The same learner material: both known, and D2's equality (a file by its sha256, a generator by its
 * whole identity) after each side is resolved through the catalogue's former identities.
 */
export function sameMaterial(a: Identity | undefined, b: Identity | undefined): boolean {
  return knownMaterial(a) && knownMaterial(b) && sameIdentity(learnerMaterial(a), learnerMaterial(b));
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
 * The one string a material is stored by (G1: the `encounters` index, the `contacts` key, a project's
 * `id`), exactly as the material was when the row was written — a file by its sha256, a generator by
 * family, version, seed, the recipe with its keys in any order, and tempo; never resolved, so a row
 * keeps the key it was stored under (E50a). A material that names nothing (`none`, or none at all: a
 * legacy run, a drill made when it opens) is keyed by the item id, as D4's `met-by-id` reads it; such a
 * key never equals a material's. Two stored keys are equal where D2's exact equality holds; for the
 * learner's equality compare `learnerMaterialKey`s, and look up by `learnerMaterialKeys`.
 */
export function materialKey(material: Identity | undefined, itemId: string): string {
  if (material?.kind === 'file') return `file:${material.sha256}`;
  if (material?.kind === 'generator') {
    return `generator:${canonical({ family: material.family, version: material.version, seed: material.seed, recipe: material.recipe, tempoBpm: material.tempoBpm })}`;
  }
  return `id:${itemId}`;
}

/**
 * The key the learner's equality compares (E50a): `materialKey` of the resolved material, equal exactly
 * where `sameMaterial` says the same material. For comparing, never for storing.
 */
export function learnerMaterialKey(material: Identity | undefined, itemId: string): string {
  return materialKey(learnerMaterial(material), itemId);
}

/**
 * Every key a material's stored rows may sit under (E50a): its current key and the key of each former
 * identity of its row, for a lookup by key (the `encounters` index, the `contacts` store) — a former file
 * for a file, a former generator identity for a generated row (CL15). One key for anything else.
 */
export function learnerMaterialKeys(material: Identity | undefined, itemId: string): string[] {
  const resolved = learnerMaterial(material);
  const own = materialKey(resolved, itemId);
  if (resolved?.kind === 'generator') return [own, ...(formerGeneratorsOfCurrent.get(own) ?? [])];
  if (resolved?.kind !== 'file') return [own];
  return [own, ...(formersOfCurrent.get(resolved.sha256) ?? []).map((sha256) => `file:${sha256}`)];
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
