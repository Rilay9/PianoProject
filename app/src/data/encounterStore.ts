/**
 * What this learner has met (G1; Part 27, L97; `docs/prompts/tasks/G1-encounter-model.md`, approved
 * with its required change `docs/review/responses/7863bee.md`).
 *
 * **Encounter history is factual.** It says what happened between this learner and this material —
 * the notation drawn for them, the music played to them, a demonstration, an attempt, practice, a
 * performance — when, from where, over which bars. It never says what the learner intends (the
 * repertoire lifecycle, G1b's), what was measured (evidence) or what they can do (skill state); a
 * fact informs those layers and none stands in for another. Nothing but a viewing or a playback writes
 * here: no status, no lifecycle action, no assignment.
 *
 * **One vocabulary, two homes, never a copy.** `viewed`, `heard` and `demonstrated` are this store's
 * own small rows (`EncounterRow`, `DB_VERSION` 8), written by the Score screen. `attempted`,
 * `practised` and `performed` are the runs': a live `SessionRow` while it is kept (`SessionRow` is the
 * record of runs), and the durable summary the retention cap folds a deleted run into
 * (`ContactSummaryRow`, `progressStore.pruneSessions`). The facets are defined by what happened: every
 * stored run is an attempt — the run record's own threshold, a row `recordRun` writes only for a run a
 * judging mode started and ended, never a Listen or Free run, and a run nothing heard only with the
 * learner's answer; a performance take (`performance: true`, the run's performance contract) is
 * performed; every other run is practised, whether or not it bore evidence. Evidence, passing and
 * first-contact eligibility never rename an encounter.
 *
 * **One query**, `familiarityIn` over a history (and `familiarity` over the store): per facet the
 * most recent time or null, for a material and a passage, over the identity hierarchy the catalogue
 * names. No boolean called familiar or novel: each consumer decides what its purpose needs.
 *
 * - **Identity** is D4's material (`material.learnerMaterialKey` agrees with `sameMaterial`; a row is
 *   stored under `material.materialKey`, and a former identity resolves at read, E50a), or the item id
 *   where there is none; a runtime phrase's row id names a recipe, every seed of which is other
 *   material, so a phrase is never met by its row's id (`idNamesMaterial: false`).
 * - **Passage scope.** Bars are printed positions, 1-based, a pickup counted as bar 1 — E1's count,
 *   which an excerpt's `fromBar` and `toBar` use and a run's `range` gives (+1). An excerpt's bars are
 *   normalised into its parent's by `fromBar`, and the query compares in the parent's scope: an
 *   encounter meets a range only by covering it; one that touches part of it answers under `partly`.
 *   So the whole piece played makes its unchanged excerpt familiar; excerpt A played leaves excerpt B
 *   novel and the whole piece only partly met — never inherited both ways.
 * - **Composition.** Where the catalogue names the target's composition (`provenance.composition`,
 *   carried down to an excerpt), `composition` answers the same facets over every item of it: another
 *   arrangement heard makes the composition heard and claims nothing of this notation. Where it names
 *   none, `composition` is null: unknown, never manufactured.
 * - **`heard` is the superset**: any playback, heard or demonstrated. `demonstrated` is the
 *   demonstrations alone. One playback writes one kind, by the learner's action.
 *
 * **First contact** (`firstContactIn`) is derived from it: no run of the material or of any bar of
 * the passage, no playback of it on any visit, no viewing of it on another visit. The viewing the
 * reading itself needs — this visit's — does not count; a visit is one opening of the Score screen,
 * minted when it opens (`newVisitId`), so a reload, a return and a second tab are each another visit.
 */
import {
  openDatabase,
  type ContactSummaryRow,
  type EncounterKind,
  type EncounterMaterial,
  type EncounterRow,
  type EncounterSource,
  type SessionRow,
} from './db';
import { contactSummaries, runBars, rungRows } from './progressStore';
import { knownMaterial, learnerMaterialKey, learnerMaterialKeys, materialKey, materialOfItem, sameMaterial } from '../curriculum/material';
import { catalogIndex } from '../curriculum/load';
import type { CatalogItem } from '../curriculum/types';
import type { Identity } from '../review/record';

// --- visits and writes --------------------------------------------------------------------------

/** A new visit's id: one opening of the Score screen. */
export function newVisitId(): string {
  const random = (globalThis as { crypto?: Partial<Crypto> }).crypto?.randomUUID?.();
  return random ?? `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Rows kept for the session where there is no database, or a write to it failed. */
let memory: EncounterRow[] = [];
/** How many rows each visit has written, for the next row's id. */
const written = new Map<string, number>();

export interface EncounterInput {
  kind: EncounterKind;
  itemId: string;
  /** The material, as the run of it would carry it; `none` or absent is kept by the item id. */
  material: Identity | undefined;
  source: EncounterSource;
  visit: string;
  /** Printed bars (1-based positions, pickup = 1) where only some were covered. */
  bars?: readonly [number, number];
  at?: Date;
}

/**
 * Writes one encounter (G1): to the database, or for the session where there is none, as every store
 * here falls back. Returns the row as stored.
 */
export async function recordEncounter(input: EncounterInput): Promise<EncounterRow> {
  const known = knownMaterial(input.material) ? input.material : undefined;
  const count = (written.get(input.visit) ?? 0) + 1;
  written.set(input.visit, count);
  const material: EncounterMaterial = known ?? { kind: 'id', itemId: input.itemId };
  const row: EncounterRow = {
    id: `${input.visit}:${String(count)}`,
    key: materialKey(known, input.itemId),
    material,
    itemId: input.itemId,
    kind: input.kind,
    at: (input.at ?? new Date()).toISOString(),
    source: input.source,
    visit: input.visit,
    ...(input.bars === undefined ? {} : { bars: [input.bars[0], input.bars[1]] as [number, number] }),
  };
  const db = await openDatabase();
  let stored = false;
  if (db) {
    try {
      await db.put('encounters', row);
      stored = true;
    } catch {
      /* kept in memory for the session, below */
    }
  }
  if (!stored) memory.push(row);
  return row;
}

/** The encounters under these keys (`EncounterRow.key`), from the store and the session's memory. */
export async function encountersFor(keys: readonly string[]): Promise<EncounterRow[]> {
  const wanted = new Set(keys);
  const db = await openDatabase();
  let stored: EncounterRow[] = [];
  if (db) {
    try {
      stored = (await Promise.all([...wanted].map((key) => db.getAllFromIndex('encounters', 'byKey', key)))).flat();
    } catch {
      stored = [];
    }
  }
  return [...stored, ...memory.filter((row) => wanted.has(row.key))];
}

/** Every encounter: what the composition facet reads. */
export async function allEncounters(): Promise<EncounterRow[]> {
  const db = await openDatabase();
  let stored: EncounterRow[] = [];
  if (db) {
    try {
      stored = await db.getAll('encounters');
    } catch {
      stored = [];
    }
  }
  return [...stored, ...memory];
}

/** Forgets the session's memory (a restore, a reset: the database was written from outside). */
export function forgetCachedEncounters(): void {
  memory = [];
}

/** Test hook. */
export function resetEncountersForTest(): void {
  memory = [];
  written.clear();
}

// --- the query ----------------------------------------------------------------------------------

/** What a familiarity question is about. */
export interface EncounterTarget {
  itemId: string;
  /** The material — a run of it would carry this — or none, read by the id. */
  material: Identity | undefined;
  /**
   * Whether a row of this item id that knew no material may have been this material (D4's
   * `met-by-id`). True for a catalogue row or an import; false for a runtime phrase, whose row id
   * names a recipe of which every seed is other material. Default true.
   */
  idNamesMaterial?: boolean;
  /** Printed bars (1-based positions, pickup = 1) of the item's own score; absent, the whole. */
  bars?: readonly [number, number];
  /**
   * The item's own length in printed bars, where the caller knows it (the Score screen, from the score
   * it drew): the whole is then bars 1 to this, which a run over every bar covers. Otherwise the
   * catalogue's measured count, where it has one.
   */
  extent?: number;
}

/** Each facet: the most recent time it happened, ISO, or null. */
export interface EncounterFacts {
  viewed: string | null;
  /** Any playback: heard or demonstrated (the superset, explicitly). */
  heard: string | null;
  demonstrated: string | null;
  /** Any run: practised or performed. */
  attempted: string | null;
  practised: string | null;
  performed: string | null;
}

export interface Familiarity extends EncounterFacts {
  /** Some fact here rests on the item id alone: a run, a summary or an encounter that knew no material. */
  byId: boolean;
  /** The same facets, for encounters that touched part of the range without covering it. */
  partly: EncounterFacts;
  /** Over every item of the target's composition, bars aside; null where the catalogue names none. */
  composition: EncounterFacts | null;
}

/** What the query reads: encounter rows, runs, summaries of pruned runs, and the catalogue for the hierarchy. */
export interface EncounterHistory {
  encounters: readonly EncounterRow[];
  runs: readonly Pick<SessionRow, 'itemId' | 'material' | 'range' | 'performance' | 'at'>[];
  contacts: readonly ContactSummaryRow[];
  byId?: ReadonlyMap<string, CatalogItem>;
}

type Facet = 'viewed' | 'heard' | 'demonstrated' | 'practised' | 'performed';

/** One fact, whatever row it came from. */
interface Fact {
  facet: Facet;
  at: string;
  itemIds: readonly string[];
  material: Identity | undefined;
  bars: [number, number] | undefined;
  visit?: string;
}

function blank(): EncounterFacts {
  return { viewed: null, heard: null, demonstrated: null, attempted: null, practised: null, performed: null };
}

const later = (a: string | null, b: string): string => (a === null || b > a ? b : a);

function note(facts: EncounterFacts, facet: Facet, at: string): void {
  if (facet === 'viewed') facts.viewed = later(facts.viewed, at);
  if (facet === 'heard' || facet === 'demonstrated') facts.heard = later(facts.heard, at);
  if (facet === 'demonstrated') facts.demonstrated = later(facts.demonstrated, at);
  if (facet === 'practised' || facet === 'performed') facts.attempted = later(facts.attempted, at);
  if (facet === 'practised') facts.practised = later(facts.practised, at);
  if (facet === 'performed') facts.performed = later(facts.performed, at);
}

const asIdentity = (material: EncounterMaterial | Identity | undefined): Identity | undefined =>
  material === undefined || material.kind === 'id' ? undefined : material;

function factsOf(history: EncounterHistory): Fact[] {
  const out: Fact[] = [];
  for (const row of history.encounters) {
    out.push({ facet: row.kind, at: row.at, itemIds: [row.itemId], material: asIdentity(row.material), bars: row.bars, visit: row.visit });
  }
  for (const row of history.runs) {
    out.push({ facet: row.performance === true ? 'performed' : 'practised', at: row.at, itemIds: [row.itemId], material: knownMaterial(row.material) ? row.material : undefined, bars: runBars(row) });
  }
  for (const summary of history.contacts) {
    for (const span of summary.spans) {
      out.push({ facet: span.run, at: span.last, itemIds: summary.itemIds, material: asIdentity(summary.material), bars: span.bars });
    }
  }
  return out;
}

/** An excerpt's parent and printed range, where the catalogue has both. */
function excerptOf(item: CatalogItem | undefined, byId: ReadonlyMap<string, CatalogItem> | undefined): { parent: CatalogItem; fromBar: number; toBar: number } | undefined {
  const block = item?.provenance?.excerpt;
  if (!item || item.type !== 'excerpt' || item.excerptOf === undefined || !block) return undefined;
  const parent = byId?.get(item.excerptOf);
  return parent ? { parent, fromBar: block.fromBar, toBar: block.toBar } : undefined;
}

/**
 * The key an item is compared by: its current identity, or its id where it has none — the learner's
 * equality key (E50a: `learnerMaterialKey`), so a fact stored against a former identity of the item's
 * file sits in the same scope as one stored against the current file.
 */
const itemKey = (item: CatalogItem): string => learnerMaterialKey(materialOfItem(item), item.id);

/** The measured length of an item in bars, from the catalogue, where it has one. */
function measuredBars(item: CatalogItem | undefined): number | undefined {
  const measurement = item?.measurement;
  return measurement?.status === 'measured' ? measurement.bars : undefined;
}

/** Bars of an excerpt's own score, in its parent's: the whole cut is the printed range. */
function intoParent(bars: readonly [number, number] | undefined, excerpt: { fromBar: number; toBar: number }): [number, number] {
  return bars === undefined ? [excerpt.fromBar, excerpt.toBar] : [excerpt.fromBar - 1 + bars[0], excerpt.fromBar - 1 + bars[1]];
}

/** Where a fact sits: the scope it is compared in, its bars there, and whether it rests on an id alone. */
interface Scope {
  root: string;
  bars: [number, number] | undefined;
  byId: boolean;
}

function scopeOfFact(fact: Fact, byId: ReadonlyMap<string, CatalogItem> | undefined): Scope {
  const known = fact.material !== undefined;
  for (const itemId of fact.itemIds) {
    const item = byId?.get(itemId);
    const cut = excerptOf(item, byId);
    if (item && cut && (!known || sameMaterial(fact.material, materialOfItem(item)))) {
      return { root: itemKey(cut.parent), bars: intoParent(fact.bars, cut), byId: !known };
    }
  }
  if (known) return { root: learnerMaterialKey(fact.material, fact.itemIds[0] ?? ''), bars: fact.bars, byId: false };
  const itemId = fact.itemIds[0] ?? '';
  const item = byId?.get(itemId);
  return { root: item ? itemKey(item) : `id:${itemId}`, bars: fact.bars, byId: true };
}

function covers(fact: readonly [number, number] | undefined, target: readonly [number, number] | undefined): boolean {
  if (fact === undefined) return true;
  return target !== undefined && fact[0] <= target[0] && fact[1] >= target[1];
}

function overlaps(fact: readonly [number, number] | undefined, target: readonly [number, number] | undefined): boolean {
  if (fact === undefined || target === undefined) return true;
  return fact[0] <= target[1] && fact[1] >= target[0];
}

/** The composition the catalogue names for an item, carried down to an excerpt from its parent. */
function compositionOf(item: CatalogItem | undefined, byId: ReadonlyMap<string, CatalogItem> | undefined): string | undefined {
  return item?.provenance?.composition ?? excerptOf(item, byId)?.parent.provenance?.composition;
}

/**
 * The one query (G1 item 3), over a history: per facet the most recent time or null, for the
 * target's material and passage (see the module note). `options.visit` is the visit asking: its own
 * viewings are not earlier ones, and are left out.
 */
export function familiarityIn(target: EncounterTarget, history: EncounterHistory, options: { visit?: string } = {}): Familiarity {
  const byId = history.byId;
  const targetItem = byId?.get(target.itemId);
  const ownKey = learnerMaterialKey(target.material, target.itemId);
  const cut = excerptOf(targetItem, byId);
  const extent = target.extent ?? measuredBars(targetItem);
  const ownBars: [number, number] | undefined = target.bars ? [target.bars[0], target.bars[1]] : extent === undefined ? undefined : [1, extent];
  const root = cut ? itemKey(cut.parent) : knownMaterial(target.material) ? ownKey : targetItem ? itemKey(targetItem) : ownKey;
  const rootBars = cut ? intoParent(target.bars ?? (target.extent === undefined ? undefined : [1, target.extent]), cut) : ownBars;
  const idNamesMaterial = target.idNamesMaterial !== false;

  const facts = blank();
  const partly = blank();
  let restsOnId = false;
  const composition = compositionOf(targetItem, byId);
  const across = composition === undefined ? null : blank();

  for (const fact of factsOf(history)) {
    if (fact.facet === 'viewed' && options.visit !== undefined && fact.visit === options.visit) continue;
    if (across && fact.itemIds.some((itemId) => compositionOf(byId?.get(itemId), byId) === composition)) note(across, fact.facet, fact.at);

    let place: { bars: [number, number] | undefined; against: [number, number] | undefined; byId: boolean } | undefined;
    if (fact.material !== undefined && sameMaterial(fact.material, target.material)) {
      place = { bars: fact.bars, against: ownBars, byId: false };
    } else if (fact.material === undefined && idNamesMaterial && fact.itemIds.includes(target.itemId)) {
      place = { bars: fact.bars, against: ownBars, byId: true };
    } else {
      const scope = scopeOfFact(fact, byId);
      if (scope.root === root && !(scope.byId && !idNamesMaterial)) place = { bars: scope.bars, against: rootBars, byId: scope.byId };
    }
    if (!place) continue;
    if (covers(place.bars, place.against)) note(facts, fact.facet, fact.at);
    else if (overlaps(place.bars, place.against)) note(partly, fact.facet, fact.at);
    else continue;
    if (place.byId) restsOnId = true;
  }
  return { ...facts, byId: restsOnId, partly, composition: across };
}

/**
 * First contact (G1 item 4), derived: nothing of the target met — no run of it or of any bar of it,
 * no playback of it on any visit, no viewing of it on another visit than `visit`.
 */
export function firstContactIn(target: EncounterTarget, history: EncounterHistory, visit: string): boolean {
  const found = familiarityIn(target, history, { visit });
  const any = (facts: EncounterFacts): boolean => facts.attempted !== null || facts.heard !== null || facts.viewed !== null;
  return !any(found) && !any(found.partly);
}

// --- over the store -----------------------------------------------------------------------------

/**
 * Where a target's history is found: the keys of its material, its id, and the passages around it
 * (the parent of an excerpt, the excerpts of a piece), with those items' ids and materials. A
 * material's keys are its current key and every former one (E50a: `learnerMaterialKeys`), because a
 * row keeps the key it was stored under.
 */
function neighbourhood(target: EncounterTarget, byId: ReadonlyMap<string, CatalogItem> | undefined): { keys: string[]; itemIds: Set<string>; materials: Identity[] } {
  const keys = new Set<string>(learnerMaterialKeys(target.material, target.itemId));
  const itemIds = new Set<string>([target.itemId]);
  const materials: Identity[] = knownMaterial(target.material) ? [target.material] : [];
  if (target.idNamesMaterial !== false) keys.add(`id:${target.itemId}`);
  const item = byId?.get(target.itemId);
  const parent = excerptOf(item, byId)?.parent ?? (item && item.type !== 'excerpt' ? item : undefined);
  const add = (one: CatalogItem): void => {
    for (const key of learnerMaterialKeys(materialOfItem(one), one.id)) keys.add(key);
    keys.add(`id:${one.id}`);
    itemIds.add(one.id);
    const material = materialOfItem(one);
    if (knownMaterial(material)) materials.push(material);
  };
  if (parent && byId) {
    add(parent);
    for (const other of byId.values()) if (other.type === 'excerpt' && other.excerptOf === parent.id) add(other);
  }
  return { keys: [...keys], itemIds, materials };
}

/**
 * The history one target's questions read, from the store: its encounters and those of the passages
 * around it (parent and excerpts), every stored run (`rungRows`, held in memory), and the summaries of
 * pruned runs under those keys. With `composition`, every encounter and summary, for that facet.
 */
export async function historyFor(target: EncounterTarget, options: { byId?: ReadonlyMap<string, CatalogItem>; composition?: boolean } = {}): Promise<EncounterHistory> {
  const byId = options.byId;
  const near = neighbourhood(target, byId);
  const composition = options.composition === true ? compositionOf(byId?.get(target.itemId), byId) : undefined;
  const [encounters, stored, contacts] = await Promise.all([
    options.composition === true ? allEncounters() : encountersFor(near.keys),
    rungRows(),
    options.composition === true ? contactSummaries() : contactSummaries(near.keys),
  ]);
  // Only the runs that can bear on it — of these items, of these materials, or of its composition —
  // so a question costs a pass of cheap comparisons over the stored runs and the query reads a few.
  const runs = stored.filter(
    (row) =>
      near.itemIds.has(row.itemId) ||
      (row.material !== undefined && near.materials.some((material) => sameMaterial(row.material, material))) ||
      (composition !== undefined && compositionOf(byId?.get(row.itemId), byId) === composition),
  );
  return { encounters, runs, contacts, ...(byId === undefined ? {} : { byId }) };
}

/**
 * `familiarityIn` over the store: every consumer that needs familiarity asks here. The catalogue is
 * the one the app has loaded unless the caller hands one in; without it there is no hierarchy, and
 * the answer is the material's and the id's alone.
 */
export async function familiarity(target: EncounterTarget, options: { visit?: string; byId?: ReadonlyMap<string, CatalogItem> } = {}): Promise<Familiarity> {
  const byId = options.byId ?? (await catalogIndex().then((index) => index.byId, () => undefined));
  const history = await historyFor(target, { ...(byId === undefined ? {} : { byId }), composition: true });
  return familiarityIn(target, history, options.visit === undefined ? {} : { visit: options.visit });
}
