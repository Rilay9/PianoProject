/**
 * A stored learner row names the same material after the converter stopped writing a date (E50a; the
 * brief `docs/prompts/tasks/E50a-the-conversion-date-is-pinned.md`, item 2 and item 4's app cases;
 * the reviewer's approval with its alias boundary, `docs/review/responses/questions-f7acb2c0.md`).
 *
 * Until E50a music21 wrote the day it ran into every file (`<encoding-date>`), so a file's sha256 — the
 * material identity a run, an encounter, a pruned run's summary and a project store — moved with the
 * calendar. The converter now writes no date, and each row the converter wrote carries the recorded
 * historical identities of its dated forms (`provenance.formerIdentities`). The learner's material
 * equality resolves a stored former identity to the row's current one at read; nothing stored is
 * rewritten, and D2's review record stays exact bytes.
 *
 * The shape of every case: a catalogue row whose current identity is `NEW` lists `OLD` among its former
 * identities, and a stored row names `OLD`. The catalogue reaches the resolution the way the app's
 * does, through `loadCatalog` (a stubbed `fetch` serves it), so the red run on the committed code is
 * the learner-facing answer (`unmet`), never a missing import.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase, type ContactSummaryRow, type EncounterRow, type ProjectRow, type SessionRow } from '../../src/data/db';
import { contact, contactIn, foldRun, recordRun, resetProgressForTest, type RunResult } from '../../src/data/progressStore';
import { familiarityIn, historyFor, recordEncounter, resetEncountersForTest, type EncounterHistory } from '../../src/data/encounterStore';
import { allProjects, applyProjectAction, projectFor, projectIn, resetProjectsForTest } from '../../src/data/projectStore';
import * as material from '../../src/curriculum/material';
import { materialKey, sameMaterial } from '../../src/curriculum/material';
import { loadCatalog, resetContentCacheForTest } from '../../src/curriculum/load';
import { resolve as resolveReview, sameIdentity, type HumanEvent, type Identity } from '../../src/review/record';
import type { CatalogItem } from '../../src/curriculum/types';

// --- identities and the catalogue ---------------------------------------------------------------

const file = (c: string): Extract<Identity, { kind: 'file' }> => ({ kind: 'file', sha256: c.repeat(64) });
/** The dated file a stored row names, and another day's dated form of the same music. */
const OLD = file('0');
const OLD_2 = file('2');
/** The row's current identity: the undated file the converter writes now. */
const NEW = file('1');
/** Another row's current identity, listed (wrongly) among the piece's former ones as well. */
const TWIN = file('3');
/** Other music: no row's current or former identity. */
const OTHER = file('9');
/** The excerpt's cut. */
const CUT = file('e');

const PIECE = 'song.margie';
const RENAMED = 'song.margie-under-an-old-id';
const EXCERPT = 'excerpt.margie.b1-8';
const TWIN_ID = 'song.twin';

function item(id: string, identity: Identity, extra: Partial<CatalogItem> = {}, provenance: Record<string, unknown> = {}): CatalogItem {
  return {
    id,
    type: 'song',
    title: id,
    level: 2,
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: `scores/${id}.mxl`,
    provenance: { source: 'kern', facts: {}, review: { score: null, teaching: null }, identity, ...provenance },
    ...extra,
  } as unknown as CatalogItem;
}
const CATALOG: CatalogItem[] = [
  item(PIECE, NEW, {}, { formerIdentities: [OLD, OLD_2, TWIN] }),
  item(EXCERPT, CUT, { type: 'excerpt', excerptOf: PIECE }, {
    source: 'excerpt',
    excerpt: { of: PIECE, fromBar: 1, toBar: 8, selection: 'both', cutVersion: 1, parentSha256: 'p'.repeat(64) },
  }),
  item(TWIN_ID, TWIN),
];
const BY_ID = new Map(CATALOG.map((one) => [one.id, one]));

/** Serves a catalogue as `catalog.json` and loads it, as the app does at boot. */
async function loadThe(catalog: readonly CatalogItem[]): Promise<void> {
  resetContentCacheForTest();
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(JSON.stringify(catalog)) })));
  await loadCatalog();
}

// --- stored rows ----------------------------------------------------------------------------------

const AT = '2026-09-29T12:00:00.000Z';
function run(itemId: string, identity: Identity | undefined, extra: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    accuracy: 0.9,
    accuracyEstimated: false,
    wrongNotes: 1,
    missed: 0,
    durationMs: 60_000,
    at: AT,
    ...(identity === undefined ? {} : { material: identity }),
    ...extra,
  };
}
const result = (itemId: string, identity: Identity): RunResult => ({
  itemId,
  mode: 'tempo',
  tempoPct: 100,
  accuracy: 1,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 1000,
  passed: true,
  masterEligible: false,
  material: identity,
});
/** An encounter as `recordEncounter` stored it on the day the device held the dated file. */
const heardRow = (itemId: string, identity: Extract<Identity, { kind: 'file' }>, n = 1): EncounterRow => ({
  id: `v-before:${String(n)}`,
  key: `file:${identity.sha256}`,
  material: identity,
  itemId,
  kind: 'heard',
  at: AT,
  source: { tab: 'library' },
  visit: 'v-before',
});
/** A project as `applyProjectAction` stored it against the dated file. */
const projectRow = (itemId: string, identity: Extract<Identity, { kind: 'file' }>): ProjectRow => ({
  id: `file:${identity.sha256}`,
  material: identity,
  itemId,
  state: 'learning',
  since: AT,
  history: [{ state: 'learning', at: AT, why: 'learn' }],
});

const history = (parts: Partial<EncounterHistory>): EncounterHistory => ({ encounters: [], runs: [], contacts: [], byId: BY_ID, ...parts });
const NOTHING = { viewed: null, heard: null, demonstrated: null, attempted: null, practised: null, performed: null };

/** Every stored learner row, store by store: what G4 compares before and after the reads. */
async function everyStoredRow(): Promise<Record<string, unknown[]>> {
  const db = await openDatabase();
  if (!db) throw new Error('no database');
  return {
    sessions: await db.getAll('sessions'),
    encounters: await db.getAll('encounters'),
    contacts: await db.getAll('contacts'),
    projects: await db.getAll('projects'),
  };
}

beforeEach(async () => {
  await loadThe(CATALOG);
});
afterEach(() => {
  vi.unstubAllGlobals();
  resetContentCacheForTest();
});

// ---------------------------------------------------------------------------------------------------

describe('the learner’s material equality resolves a former identity to the row’s current one (A1, A2, A6)', () => {
  it('A1: a run of the item stored against the dated file is met, played', () => {
    const rows = [run(PIECE, OLD)];
    expect(contactIn(rows, PIECE, NEW)).toEqual({ contact: 'met', metById: true, metAs: [PIECE], how: ['played'] });
    // Every recorded dated form of the row's file is the same material, and resolves the same way.
    expect(contactIn([run(PIECE, OLD_2)], PIECE, NEW).contact).toBe('met');
  });

  it('A2: the same run under another item id is met, naming that id', () => {
    expect(contactIn([run(RENAMED, OLD)], PIECE, NEW)).toEqual({ contact: 'met', metById: false, metAs: [RENAMED], how: ['played'] });
  });

  it('A6: an encounter of the parent under its dated file counts toward the excerpt’s passage, as one under the current file does', () => {
    const target = { itemId: EXCERPT, material: CUT };
    const underNew = familiarityIn(target, history({ encounters: [heardRow(PIECE, NEW)] }));
    const underOld = familiarityIn(target, history({ encounters: [heardRow(PIECE, OLD)] }));
    expect(underNew.heard).toBe(AT);
    expect(underOld.heard).toBe(AT);
    expect(underOld).toEqual(underNew);
  });

  it('the equality key agrees with the resolved equality: equal exactly where sameMaterial says the same material', () => {
    const all: Identity[] = [OLD, OLD_2, NEW, TWIN, OTHER, CUT];
    for (const a of all) {
      for (const b of all) {
        expect(material.learnerMaterialKey(a, 'x') === material.learnerMaterialKey(b, 'y'), `${JSON.stringify(a)} against ${JSON.stringify(b)}`).toBe(sameMaterial(a, b));
      }
    }
  });

  it('the resolution is the loaded catalogue’s: a catalogue that lists no former identity resolves none', async () => {
    await loadThe(CATALOG.map((one) => (one.id === PIECE ? item(PIECE, NEW) : one)));
    expect(contactIn([run(PIECE, OLD)], PIECE, NEW)).toEqual({ contact: 'unmet', metById: true });
  });
});

describe('the lookups ask the current key and every former key of the material (A3, A4, A5)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
    resetProjectsForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  it('A1 over the store: a recorded run of the dated file is met', async () => {
    await recordRun(result(PIECE, OLD), new Date(2026, 8, 29, 12));
    expect(await contact(PIECE, NEW)).toEqual({ contact: 'met', metById: true, metAs: [PIECE], how: ['played'] });
  });

  it('A3: a heard encounter keyed by the dated file under another id is found through the former key, and familiarity says heard', async () => {
    const db = await openDatabase();
    await db!.put('encounters', heardRow(RENAMED, OLD));
    expect(await contact(PIECE, NEW)).toEqual({ contact: 'met', metById: false, metAs: [RENAMED], how: ['heard'] });
    const target = { itemId: PIECE, material: NEW };
    const facts = familiarityIn(target, await historyFor(target, { byId: BY_ID }));
    expect(facts.heard).toBe(AT);
    // Without the catalogue index (it is optional): the target's own keys carry its former ones.
    expect(familiarityIn(target, await historyFor(target)).heard).toBe(AT);
  });

  it('A4: a pruned run’s summary keyed by the dated file is met, played; familiarity over the keyed summaries says practised', async () => {
    const summary: ContactSummaryRow = foldRun(run(PIECE, OLD));
    expect(summary.key).toBe(`file:${OLD.sha256}`);
    const db = await openDatabase();
    await db!.put('contacts', summary);
    expect(await contact(PIECE, NEW)).toEqual({ contact: 'met', metById: true, metAs: [PIECE], how: ['played'] });
    const target = { itemId: PIECE, material: NEW };
    const found = await historyFor(target, { byId: BY_ID });
    expect(found.contacts).toEqual([summary]);
    expect(familiarityIn(target, found).practised).toBe(AT);
    expect((await historyFor(target)).contacts, 'without the catalogue index').toEqual([summary]);
  });

  it('A5: a project keyed by the dated file is the piece’s project; an action appends to that row, whose id stays the dated key', async () => {
    const stored = projectRow(RENAMED, OLD);
    expect(projectIn([stored], { itemId: PIECE, material: NEW })).toEqual(stored);
    const db = await openDatabase();
    await db!.put('projects', stored);
    expect(await projectFor({ itemId: PIECE, material: NEW })).toEqual(stored);
    const moved = await applyProjectAction({ itemId: PIECE, material: NEW }, 'polish', { at: new Date(2026, 8, 30, 9) });
    expect(moved.id).toBe(`file:${OLD.sha256}`);
    expect(moved.material).toEqual(OLD);
    expect(moved.history.map((step) => step.state)).toEqual(['learning', 'polishing']);
    expect((await allProjects()).map((row) => row.id)).toEqual([`file:${OLD.sha256}`]);
  });

  it('G4: every stored row is deep-equal before and after each read', async () => {
    await recordRun(result(PIECE, OLD), new Date(2026, 8, 29, 12));
    const db = await openDatabase();
    await db!.put('encounters', heardRow(RENAMED, OLD));
    await db!.put('contacts', foldRun(run(PIECE, OLD_2)));
    await db!.put('projects', projectRow(PIECE, OLD));
    const before = structuredClone(await everyStoredRow());
    const target = { itemId: PIECE, material: NEW };
    await contact(PIECE, NEW);
    familiarityIn(target, await historyFor(target, { byId: BY_ID }));
    familiarityIn({ itemId: EXCERPT, material: CUT }, await historyFor({ itemId: EXCERPT, material: CUT }, { byId: BY_ID }));
    await projectFor(target);
    expect(await everyStoredRow()).toEqual(before);
    // And the rows a pure read is handed are not touched either.
    const rows = [run(PIECE, OLD)];
    const copy = structuredClone(rows);
    contactIn(rows, PIECE, NEW);
    expect(rows).toEqual(copy);
  });

  it('G6: storage keeps a row’s own key — a folded run of the dated file is keyed by it; a new encounter of the item by the current file', async () => {
    const folded = foldRun(run(PIECE, OLD));
    expect(folded.key).toBe(`file:${OLD.sha256}`);
    expect(folded.material).toEqual(OLD);
    const written = await recordEncounter({ kind: 'viewed', itemId: PIECE, material: NEW, source: { tab: 'library' }, visit: 'v-now' });
    expect(written.key).toBe(`file:${NEW.sha256}`);
    expect(materialKey(OLD, PIECE)).toBe(`file:${OLD.sha256}`);
  });
});

describe('guards: what the resolution must not do (G1, G2, G3, G5)', () => {
  it('G1: a stored identity that is no row’s former identity stays unmet, under the alias-bearing item’s own id', () => {
    expect(contactIn([run(PIECE, OTHER)], PIECE, NEW)).toEqual({ contact: 'unmet', metById: true });
    expect(sameMaterial(OTHER, NEW)).toBe(false);
    const found = familiarityIn({ itemId: PIECE, material: NEW }, history({ encounters: [heardRow(PIECE, OTHER)], runs: [run(PIECE, OTHER)] }));
    expect({ ...found, partly: { ...found.partly } }).toEqual({ ...NOTHING, byId: false, partly: NOTHING, composition: null });
  });

  it('G2: a row’s current identity never resolves through another row’s former list, even where the same sha is listed there', () => {
    expect(sameMaterial(TWIN, NEW)).toBe(false);
    expect(contactIn([run(TWIN_ID, TWIN)], PIECE, NEW)).toEqual({ contact: 'unmet', metById: false });
    expect(contactIn([run(TWIN_ID, TWIN)], TWIN_ID, TWIN).contact).toBe('met');
    const found = familiarityIn({ itemId: PIECE, material: NEW }, history({ encounters: [heardRow(TWIN_ID, TWIN)] }));
    expect(found.heard).toBeNull();
  });

  it('G3: generator identities and none read as now', () => {
    const scale: Identity = { kind: 'generator', family: 'pentatonic', version: 1, seed: null, recipe: { key: 'A', hands: 'right' }, tempoBpm: 72 };
    const none: Identity = { kind: 'none', why: 'made when it opens: no file the build keys' };
    expect(sameMaterial(scale, { ...scale })).toBe(true);
    expect(sameMaterial(scale, { ...scale, seed: 1 })).toBe(false);
    expect(sameMaterial(none, none)).toBe(false);
    expect(contactIn([run(PIECE, scale)], PIECE, scale).contact).toBe('met');
    expect(contactIn([run('drill.x', none)], 'drill.x', none)).toEqual({ contact: 'met-by-id', metById: true, materialUnknown: true });
    expect(materialKey(none, 'drill.x')).toBe('id:drill.x');
  });

  it('the resolution’s own API: a former file resolves to the current row’s identity; a current, a generator, none and an unknown file are returned as they are', () => {
    const scale: Identity = { kind: 'generator', family: 'pentatonic', version: 1, seed: null, recipe: { key: 'A', hands: 'right' }, tempoBpm: 72 };
    const none: Identity = { kind: 'none', why: 'made when it opens: no file the build keys' };
    expect(material.learnerMaterial(OLD)).toEqual(NEW);
    expect(material.learnerMaterial(OLD_2)).toEqual(NEW);
    expect(material.learnerMaterial(NEW)).toEqual(NEW);
    expect(material.learnerMaterial(TWIN)).toEqual(TWIN);
    expect(material.learnerMaterial(OTHER)).toEqual(OTHER);
    expect(material.learnerMaterial(scale)).toBe(scale);
    expect(material.learnerMaterial(none)).toBe(none);
    expect(material.learnerMaterial(undefined)).toBeUndefined();
    expect(material.learnerMaterialKey(none, 'drill.x')).toBe('id:drill.x');
    expect(material.learnerMaterialKey(undefined, 'song.legacy')).toBe('id:song.legacy');
    expect(material.learnerMaterialKey(scale, 'x')).toBe(materialKey(scale, 'x'));
    // The keys a material's stored rows may sit under: the current one and each former one, never another row's current.
    expect(new Set(material.learnerMaterialKeys(OLD, PIECE))).toEqual(new Set([NEW, OLD, OLD_2].map((one) => `file:${one.sha256}`)));
    expect(material.learnerMaterialKeys(OTHER, PIECE)).toEqual([`file:${OTHER.sha256}`]);
    expect(material.learnerMaterialKeys(undefined, PIECE)).toEqual([`id:${PIECE}`]);
  });

  it('G5: D2’s review record stays exact bytes — the dated identity is not the current one, and a decision bound to it is stale', () => {
    expect(sameIdentity(OLD, NEW)).toBe(false);
    expect(sameIdentity(OLD, OLD)).toBe(true);
    const decision: HumanEvent = {
      v: 1,
      event: 'ev-dated',
      item: PIECE,
      identity: OLD,
      dimension: 'usableScore',
      value: 'yes',
      basis: 'notation',
      reason: 'read on the page',
      category: 'notation',
      by: 'a reviewer',
      at: AT,
    };
    const { status, decided } = resolveReview([decision], (id) => BY_ID.get(id)?.provenance?.identity);
    expect(status.get('ev-dated')).toBe('stale');
    expect(decided.size).toBe(0);
  });
});
