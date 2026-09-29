/**
 * One factual encounter model (G1; Part 27, L97; the brief `docs/prompts/tasks/G1-encounter-model.md`,
 * approved with its required change `docs/review/responses/7863bee.md`).
 *
 * What this learner has met, as facts over the build's material identities: `viewed`, `heard`,
 * `demonstrated` stored as small rows beside the runs (`encounters`, `DB_VERSION` 8); `attempted`,
 * `practised` and `performed` derived from the runs — live `SessionRow`s, or the durable summary the
 * retention cap folds a deleted run into (`contacts`) — and never copied. One query,
 * `familiarityIn` / `familiarity`, answers per facet with the most recent time or null, passage by
 * passage, over the identity hierarchy the catalogue names; nothing is a boolean called familiar.
 *
 * The cases, in the brief's order: the store and the upgrade from a version-7 database with rows in
 * every store; the backup carrying both new stores; the query on constructed histories (each kind,
 * the range rule, parent to excerpt and not back, the composition facet, a legacy history); first
 * contact on constructed visits; `contact` with `how`, D4's verdicts kept; the facets defined by what
 * happened; the adversaries Part 27 holds at this layer.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import {
  DB_VERSION,
  STORE_NAMES,
  isPhraseRun,
  openDatabase,
  resetDatabaseForTest,
  type ContactSummaryRow,
  type EncounterRow,
  type SessionRow,
} from '../../src/data/db';
import {
  contactIn,
  contact,
  foldRun,
  mergeSummaries,
  recordRun,
  resetProgressForTest,
  getProgress,
  type RunResult,
} from '../../src/data/progressStore';
import {
  familiarityIn,
  firstContactIn,
  recordEncounter,
  encountersFor,
  resetEncountersForTest,
  type EncounterHistory,
  type EncounterTarget,
} from '../../src/data/encounterStore';
import { materialKey, sameMaterial, textIdentity } from '../../src/curriculum/material';
import { exportAll, importAll } from '../../src/data/backup';
import { meetsStandard } from '../../src/evidence/rungState';
import { historyDetail } from '../../src/ui/screens/ProgressScreen';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Identity } from '../../src/review/record';

// --- materials and catalogue rows ---------------------------------------------------------------

const file = (c: string): Identity => ({ kind: 'file', sha256: c.repeat(64) });
type Generated = Extract<Identity, { kind: 'generator' }>;
const phrase = (seed: number, hands = 'R'): Generated => ({
  kind: 'generator',
  family: 'sight-reading',
  version: 2,
  seed,
  recipe: { level: 2, bars: 4, hands, fifths: 0, eighths: true },
  tempoBpm: 72,
});
const scale = (key: string): Generated => ({
  kind: 'generator',
  family: 'pentatonic',
  version: 1,
  seed: null,
  recipe: { key, form: 'blues', hands: 'right' },
  tempoBpm: 72,
});

/** A piece and two excerpts of it (bars 1–8 and 25–32), and two arrangements of another composition. */
const PARENT = 'song.minuet';
const EX_A = 'excerpt.minuet.b1-8';
const EX_B = 'excerpt.minuet.b25-32';
const EX_C = 'excerpt.minuet.b5-12';
const ARR_E = 'song.elise.easy';
const ARR_F = 'song.elise.beginner';
function item(id: string, material: Identity, extra: Partial<CatalogItem> = {}, provenance: Record<string, unknown> = {}): CatalogItem {
  return {
    id,
    type: 'song',
    title: id,
    level: 2,
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: `scores/${id}.mxl`,
    provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: material, ...provenance },
    ...extra,
  } as unknown as CatalogItem;
}
const excerpt = (id: string, material: Identity, fromBar: number, toBar: number): CatalogItem =>
  item(id, material, { type: 'excerpt', excerptOf: PARENT }, {
    source: 'excerpt',
    composition: 'work:minuet',
    arrangement: PARENT,
    excerpt: { of: PARENT, fromBar, toBar, selection: 'both', cutVersion: 1, parentSha256: 'p'.repeat(64) },
  });
const CATALOG = [
  item(PARENT, file('p'), {}, { composition: 'work:minuet', arrangement: PARENT }),
  excerpt(EX_A, file('a'), 1, 8),
  excerpt(EX_B, file('b'), 25, 32),
  excerpt(EX_C, file('c'), 5, 12),
  item(ARR_E, file('e'), {}, { composition: 'variant-of:song.elise', arrangement: ARR_E }),
  item(ARR_F, file('f'), {}, { composition: 'variant-of:song.elise', arrangement: ARR_F }),
  item('song.no-composition', file('n')),
];
const BY_ID = new Map(CATALOG.map((one) => [one.id, one]));
const materialOf = (id: string): Identity => BY_ID.get(id)?.provenance?.identity as Identity;

// --- history constructors -----------------------------------------------------------------------

const YESTERDAY = '2026-09-28T12:00:00.000Z';
const NOON = '2026-09-29T12:00:00.000Z';
const EVENING = '2026-09-29T19:00:00.000Z';

let seq = 0;
function enc(kind: EncounterRow['kind'], itemId: string, material: Identity | undefined, at: string, visit = 'v-earlier', bars?: [number, number]): EncounterRow {
  seq += 1;
  const known = material !== undefined && material.kind !== 'none' ? material : undefined;
  return {
    id: `${visit}:${String(seq)}`,
    key: materialKey(material, itemId),
    material: known ?? { kind: 'id', itemId },
    itemId,
    kind,
    at,
    source: { tab: 'library' },
    visit,
    ...(bars ? { bars } : {}),
  };
}
function run(itemId: string, material: Identity | undefined, at: string, extra: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    accuracy: 0.9,
    accuracyEstimated: false,
    wrongNotes: 1,
    missed: 0,
    durationMs: 60_000,
    at,
    ...(material === undefined ? {} : { material }),
    ...extra,
  };
}
/** A run over printed bars `from`–`to` (1-based positions): the row's own 0-based range. */
const over = (from: number, to: number): Partial<SessionRow> => ({ range: { fromMeasure: from - 1, toMeasure: to - 1 } });
const history = (parts: Partial<EncounterHistory>): EncounterHistory => ({ encounters: [], runs: [], contacts: [], byId: BY_ID, ...parts });
const target = (itemId: string, extra: Partial<EncounterTarget> = {}): EncounterTarget => ({ itemId, material: materialOf(itemId), ...extra });

const NOTHING = { viewed: null, heard: null, demonstrated: null, attempted: null, practised: null, performed: null };

beforeEach(() => {
  seq = 0;
});

// ---------------------------------------------------------------------------------------------------

describe('the material key agrees with D2’s equality', () => {
  it('equal keys exactly where sameMaterial says the same material; none and absent fall back to the id', () => {
    const pairs: [Identity, Identity][] = [
      [file('a'), file('a')],
      [file('a'), file('b')],
      [phrase(7), phrase(7)],
      [phrase(7), phrase(8)],
      [phrase(7), phrase(7, 'L')],
      [scale('A'), scale('A')],
      [scale('A'), scale('D')],
      [scale('A'), { ...scale('A'), recipe: { hands: 'right', form: 'blues', key: 'A' } }],
      [scale('A'), { ...scale('A'), tempoBpm: 80 }],
      [file('a'), phrase(7)],
    ];
    for (const [a, b] of pairs) {
      expect(materialKey(a, 'x') === materialKey(b, 'y'), `${JSON.stringify(a)} against ${JSON.stringify(b)}`).toBe(sameMaterial(a, b));
    }
    expect(materialKey({ kind: 'none', why: 'made when it opens' }, 'drill.x')).toBe('id:drill.x');
    expect(materialKey(undefined, 'song.legacy')).toBe('id:song.legacy');
  });

  it('an import’s identity is the sha256 of its stored text: one text, one identity, under any id', async () => {
    const text = '<score-partwise version="4.0"><part-list/></score-partwise>';
    const one = await textIdentity(text);
    const two = await textIdentity(text);
    expect(one).toEqual({ kind: 'file', sha256: expect.stringMatching(/^[0-9a-f]{64}$/) as unknown });
    expect(sameMaterial(one, two)).toBe(true);
    expect(sameMaterial(one, await textIdentity(`${text} `))).toBe(false);
  });
});

describe('the store, and the upgrade that makes it', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  it('a version-7 database with a row in every store opens at version 8 with every row as it was and the two new stores empty', async () => {
    // Version 7's schema, as `db.ts` made it.
    const old = await openDB('pianopath', 7, {
      upgrade(database) {
        database.createObjectStore('settings');
        database.createObjectStore('progress', { keyPath: 'itemId' });
        const sessions = database.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessions.createIndex('byItem', 'itemId');
        sessions.createIndex('byDate', 'at');
        database.createObjectStore('imports', { keyPath: 'id' });
        database.createObjectStore('plan', { keyPath: 'id' });
        database.createObjectStore('streak', { keyPath: 'id' });
        database.createObjectStore('micCalibration');
        database.createObjectStore('skills', { keyPath: 'conceptId' });
        database.createObjectStore('levelOverrides', { keyPath: 'itemId' });
        database.createObjectStore('folderLibraries', { keyPath: 'id' });
        database.createObjectStore('books', { keyPath: 'id' });
        const scores = database.createObjectStore('folderScores', { keyPath: ['folder', 'file'] });
        scores.createIndex('byTitle', ['folder', 'sort']);
        database.createObjectStore('folderIndexes', { keyPath: 'id' });
      },
    });
    await old.put('settings', '{"zoom":1.25}', 'pianopath.settings');
    await old.put('progress', { itemId: 'song.kept', status: 'passed', bestAccuracy: 0.9, bestTempoPct: 100, attempts: 3, lastPracticedAt: YESTERDAY, minutes: 12, passedOn: ['2026-09-28'] });
    await old.add('sessions', run('song.kept', file('k'), YESTERDAY, { ...over(1, 8), opened: { tab: 'library', slot: 'not measured' } }));
    await old.put('imports', { id: 'import.kept', kind: 'musicxml', title: 'Kept', data: '<score-partwise/>', tags: [], addedAt: YESTERDAY });
    await old.put('plan', { id: 'current', stage: 2, unitId: '2.1', trackOrder: ['core'] });
    await old.put('streak', { id: 'streak', minutesByDay: { '2026-09-28': 12 }, weeklyGoalMinutes: 150 });
    await old.put('micCalibration', { latencyMs: 40 }, 'device-1');
    await old.put('skills', { conceptId: 'scale', exposedAt: YESTERDAY });
    await old.put('levelOverrides', { itemId: 'song.kept', level: 2.5, at: YESTERDAY });
    await old.put('folderLibraries', { id: 'Mine', addedAt: YESTERDAY, source: null });
    await old.put('books', { id: 'book.mine', title: 'Mine', kind: 'method', pieces: [], addedAt: YESTERDAY });
    await old.put('folderScores', { folder: 'Mine', file: 'a.mxl', sort: 'a', title: 'A', composer: '', level: null, bars: null, status: '', style: '', rating: 0, ratings: 0, views: 0, lyrics: false, garbled: false, museScore: '' });
    await old.put('folderIndexes', { id: 'Mine', files: ['a.mxl'], haystacks: ['a'], letters: 'A', levels: new Float64Array([Number.NaN]), styleNames: [], styles: new Uint16Array([0]), statusNames: [], statuses: new Uint16Array([0]), rated: new Uint8Array([0]), unnamed: 0 });
    const names = [...old.objectStoreNames];
    const before: Record<string, unknown> = {};
    for (const name of names) before[name] = { rows: await old.getAll(name as never), keys: await old.getAllKeys(name as never) };
    old.close();
    resetDatabaseForTest();

    const db = await openDatabase();
    expect(db?.version).toBe(DB_VERSION);
    // Revised (G1b): the version-7 database now opens at 9, which adds `projects` and touches no store either.
    expect(DB_VERSION).toBeGreaterThanOrEqual(8);
    for (const name of names) {
      expect({ rows: await db?.getAll(name as never), keys: await db?.getAllKeys(name as never) }, `${name} changed in the upgrade`).toEqual(before[name]);
    }
    expect([...(db?.objectStoreNames ?? [])]).toEqual(expect.arrayContaining(['encounters', 'contacts']));
    expect(await db?.getAll('encounters')).toEqual([]);
    expect(await db?.getAll('contacts')).toEqual([]);
    // The version-7 carry-over flag is set only on a path from before 7: nothing to carry here.
    expect(await db?.get('settings', 'pianopath.carryOverDue')).toBeUndefined();
  });

  it('an encounter is one small row, found by its material, and kept whatever the item is called', async () => {
    const written = await recordEncounter({ kind: 'viewed', itemId: 'import.one', material: file('i'), source: { tab: 'library' }, visit: 'v1', at: new Date(NOON) });
    expect(written).toEqual({
      id: expect.stringMatching(/^v1:/) as unknown,
      key: materialKey(file('i'), 'import.one'),
      material: file('i'),
      itemId: 'import.one',
      kind: 'viewed',
      at: NOON,
      source: { tab: 'library' },
      visit: 'v1',
    });
    await recordEncounter({ kind: 'demonstrated', itemId: 'import.one', material: file('i'), source: { tab: 'library' }, visit: 'v1', bars: [3, 3], at: new Date(EVENING) });
    await recordEncounter({ kind: 'heard', itemId: 'drill.made-now', material: { kind: 'none', why: 'made when it opens' }, source: { tab: 'today', slot: 'technique' }, visit: 'v1' });
    const found = await encountersFor([materialKey(file('i'), 'import.two')]);
    expect(found.map((row) => row.kind)).toEqual(['viewed', 'demonstrated']);
    expect(found[1]?.bars).toEqual([3, 3]);
    // No material, no manufactured one: the row is the id's.
    const byId = await encountersFor(['id:drill.made-now']);
    expect(byId[0]?.material).toEqual({ kind: 'id', itemId: 'drill.made-now' });
    expect(new Set(found.map((row) => row.id)).size).toBe(2);
  });

  it('without a database the rows live for the session, as every store’s do', async () => {
    clearFakeIndexedDb();
    resetEncountersForTest();
    await recordEncounter({ kind: 'heard', itemId: 'song.a', material: file('a'), source: { tab: 'library' }, visit: 'v9' });
    expect((await encountersFor([materialKey(file('a'), 'song.a')])).map((row) => row.kind)).toEqual(['heard']);
  });
});

describe('the backup carries the history, and a restore follows the learner', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  it('both stores are in the file; a replace restores them; a merge restored twice adds nothing and joins the summaries', async () => {
    expect(STORE_NAMES).toEqual(expect.arrayContaining(['encounters', 'contacts']));
    await recordEncounter({ kind: 'heard', itemId: PARENT, material: file('p'), source: { tab: 'library' }, visit: 'v1', at: new Date(NOON) });
    const summary = mergeSummaries(undefined, foldRun(run(PARENT, file('p'), YESTERDAY, over(1, 8))));
    const db = await openDatabase();
    await db?.put('contacts', summary);
    const file1 = JSON.parse(JSON.stringify(await exportAll())) as Awaited<ReturnType<typeof exportAll>>;
    expect(file1.stores.encounters).toHaveLength(1);
    expect(file1.stores.contacts).toEqual([summary]);

    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
    await importAll(file1, { replace: true });
    const restored = await openDatabase();
    expect(await restored?.getAll('encounters')).toEqual(file1.stores.encounters);
    expect(await restored?.getAll('contacts')).toEqual([summary]);

    // The device has pruned a later run of the same material meanwhile: its summary and the backup's join.
    const later = mergeSummaries(undefined, foldRun(run(PARENT, file('p'), EVENING, { ...over(25, 32), performance: true })));
    await restored?.put('contacts', later);
    await importAll(file1);
    await importAll(file1);
    expect(await restored?.getAll('encounters'), 'a merge restored twice duplicated the encounters').toHaveLength(1);
    const joined = (await restored?.getAll('contacts')) as ContactSummaryRow[];
    expect(joined).toHaveLength(1);
    expect(joined[0]?.spans.map((span) => [span.run, span.bars, span.first, span.last])).toEqual(
      expect.arrayContaining([
        ['practised', [1, 8], YESTERDAY, YESTERDAY],
        ['performed', [25, 32], EVENING, EVENING],
      ]),
    );
  });
});

describe('the query: one answer per facet, the most recent time or null', () => {
  it('nothing met: every facet null, nothing by id', () => {
    expect(familiarityIn(target(PARENT), history({}))).toEqual({ ...NOTHING, byId: false, partly: NOTHING, composition: NOTHING });
  });

  it('each kind answers its own facet; heard is the superset of any playback, demonstrated the demonstrations alone', () => {
    const viewed = familiarityIn(target(PARENT), history({ encounters: [enc('viewed', PARENT, file('p'), NOON)] }));
    expect(viewed).toMatchObject({ ...NOTHING, viewed: NOON });
    const heard = familiarityIn(target(PARENT), history({ encounters: [enc('heard', PARENT, file('p'), NOON)] }));
    expect(heard).toMatchObject({ ...NOTHING, heard: NOON });
    const shown = familiarityIn(target(PARENT), history({ encounters: [enc('demonstrated', PARENT, file('p'), NOON)] }));
    expect(shown).toMatchObject({ ...NOTHING, heard: NOON, demonstrated: NOON });
    const latest = familiarityIn(target(PARENT), history({ encounters: [enc('heard', PARENT, file('p'), NOON), enc('heard', PARENT, file('p'), YESTERDAY)] }));
    expect(latest.heard).toBe(NOON);
  });

  it('the run facets come from what happened: an ordinary run is attempted and practised with or without evidence; a performance is attempted and performed', () => {
    const plain = familiarityIn(target(PARENT), history({ runs: [run(PARENT, file('p'), NOON)] }));
    expect(plain).toMatchObject({ ...NOTHING, attempted: NOON, practised: NOON });
    const measuredNothing = familiarityIn(target(PARENT), history({ runs: [run(PARENT, file('p'), NOON, { accuracy: 'not measured', selfReport: 'rough' })] }));
    expect(measuredNothing).toMatchObject({ ...NOTHING, attempted: NOON, practised: NOON });
    const notFirst = familiarityIn(target(PARENT), history({ runs: [run(PARENT, file('p'), NOON, { unseen: false })] }));
    expect(notFirst).toMatchObject({ attempted: NOON, practised: NOON });
    const take = familiarityIn(target(PARENT), history({ runs: [run(PARENT, file('p'), NOON, { performance: true })] }));
    expect(take).toMatchObject({ ...NOTHING, attempted: NOON, performed: NOON });
  });

  it('the range rule: an encounter meets a range only by covering it; one that touches part of it answers under partly', () => {
    const h = history({ runs: [run(PARENT, file('p'), NOON, over(1, 8))] });
    expect(familiarityIn(target(PARENT, { bars: [1, 8] }), h).practised).toBe(NOON);
    expect(familiarityIn(target(PARENT, { bars: [3, 5] }), h).practised).toBe(NOON);
    const later = familiarityIn(target(PARENT, { bars: [25, 32] }), h);
    expect(later.practised, 'bars 25–32 met by practising bars 1–8').toBeNull();
    expect(later.partly.practised).toBeNull();
    const straddle = familiarityIn(target(PARENT, { bars: [5, 12] }), h);
    expect(straddle.practised).toBeNull();
    expect(straddle.partly.practised).toBe(NOON);
    const whole = familiarityIn(target(PARENT), h);
    expect(whole.practised, 'the whole piece met by eight bars of it').toBeNull();
    expect(whole.partly.practised).toBe(NOON);
    // A held bar is a demonstration of that bar.
    const bar = familiarityIn(target(PARENT, { bars: [3, 3] }), history({ encounters: [enc('demonstrated', PARENT, file('p'), NOON, 'v', [3, 3])] }));
    expect(bar.demonstrated).toBe(NOON);
  });

  it('parent to excerpt through the printed range, never both ways: the whole played makes its excerpt familiar; excerpt A leaves excerpt B novel and the whole unmet', () => {
    const wholePlayed = history({ runs: [run(PARENT, file('p'), NOON)] });
    expect(familiarityIn(target(EX_B), wholePlayed).practised).toBe(NOON);
    const aPlayed = history({ runs: [run(EX_A, file('a'), NOON)] });
    expect(familiarityIn(target(EX_B), aPlayed)).toMatchObject({ ...NOTHING, partly: NOTHING });
    expect(familiarityIn(target(PARENT), aPlayed).practised, 'the whole piece met by one excerpt of it').toBeNull();
    expect(familiarityIn(target(PARENT), aPlayed).partly.practised).toBe(NOON);
    expect(familiarityIn(target(PARENT, { bars: [2, 6] }), aPlayed).practised).toBe(NOON);
    // Overlapping excerpts touch: A (1–8) and C (5–12).
    expect(familiarityIn(target(EX_C), aPlayed).partly.practised).toBe(NOON);
    // An excerpt-local range: bars 2–3 of the cut are the parent's bars 26–27.
    const local = history({ runs: [run(EX_B, file('b'), NOON, over(2, 3))] });
    expect(familiarityIn(target(PARENT, { bars: [26, 27] }), local).practised).toBe(NOON);
    expect(familiarityIn(target(PARENT, { bars: [25, 26] }), local).practised).toBeNull();
  });

  it('an excerpt over bars practised on the piece is not new: the parent’s range answers for it', () => {
    const practised = history({ runs: [run(PARENT, file('p'), NOON, over(25, 32))] });
    expect(familiarityIn(target(EX_B), practised).practised).toBe(NOON);
    expect(familiarityIn(target(EX_A), practised)).toMatchObject({ ...NOTHING, partly: NOTHING });
  });

  it('the composition facet: another arrangement heard makes the composition heard and claims nothing of this notation', () => {
    const f = familiarityIn(target(ARR_F), history({ encounters: [enc('heard', ARR_E, file('e'), NOON)] }));
    expect(f).toMatchObject({ ...NOTHING, partly: NOTHING });
    expect(f.viewed).toBeNull();
    expect(f.composition).toMatchObject({ ...NOTHING, heard: NOON });
    // A row naming no composition: unknown, never manufactured.
    expect(familiarityIn(target('song.no-composition'), history({ encounters: [enc('heard', ARR_E, file('e'), NOON)] })).composition).toBeNull();
    // Without the catalogue there is no hierarchy to read.
    expect(familiarityIn(target(ARR_F), { ...history({ encounters: [enc('heard', ARR_E, file('e'), NOON)] }), byId: undefined }).composition).toBeNull();
  });

  it('a legacy history answers from its runs by the item id, and says so; a phrase is never met by its row’s id', () => {
    const legacy = familiarityIn(target(PARENT), history({ runs: [run(PARENT, undefined, YESTERDAY)] }));
    expect(legacy).toMatchObject({ attempted: YESTERDAY, practised: YESTERDAY, byId: true });
    const none = familiarityIn(target(PARENT), history({ runs: [run(PARENT, { kind: 'none', why: 'no file' }, YESTERDAY)] }));
    expect(none.byId).toBe(true);
    const otherKnown = familiarityIn(target(PARENT), history({ runs: [run(PARENT, file('q'), YESTERDAY)] }));
    expect(otherKnown).toMatchObject({ ...NOTHING, byId: false });
    const reader = 'drill.reading.sight-reading-2-right';
    const phraseTarget: EncounterTarget = { itemId: reader, material: phrase(9), idNamesMaterial: false };
    const legacyReads = familiarityIn(phraseTarget, history({ runs: [run(reader, undefined, YESTERDAY, { seed: 3, unseen: true })] }));
    expect(legacyReads).toMatchObject({ ...NOTHING, byId: false });
  });

  it('a viewing of this visit is not an earlier viewing; one of any other visit is', () => {
    const h = history({ encounters: [enc('viewed', PARENT, file('p'), NOON, 'v-now')] });
    expect(familiarityIn(target(PARENT), h, { visit: 'v-now' }).viewed).toBeNull();
    expect(familiarityIn(target(PARENT), h, { visit: 'v-other' }).viewed).toBe(NOON);
  });

  it('a summary of pruned runs answers exactly as the runs did', () => {
    const summary = mergeSummaries(undefined, foldRun(run(PARENT, file('p'), YESTERDAY, over(1, 8))));
    const f = familiarityIn(target(PARENT, { bars: [1, 8] }), history({ contacts: [summary] }));
    expect(f).toMatchObject({ attempted: YESTERDAY, practised: YESTERDAY, performed: null });
    expect(familiarityIn(target(PARENT, { bars: [25, 32] }), history({ contacts: [summary] })).practised).toBeNull();
  });
});

describe('first contact, derived from the history and the visit', () => {
  const READER = 'drill.reading.sight-reading-2-right';
  const read = (seed = 9): EncounterTarget => ({ itemId: READER, material: phrase(seed), idNamesMaterial: false });

  it('nothing met: first contact', () => {
    expect(firstContactIn(read(), history({}), 'v-now')).toBe(true);
  });
  it('heard yesterday, on another visit: not first contact', () => {
    expect(firstContactIn(read(), history({ encounters: [enc('heard', READER, phrase(9), YESTERDAY, 'v-yesterday')] }), 'v-now')).toBe(false);
  });
  it('one bar of it held down yesterday: not first contact', () => {
    expect(firstContactIn(read(), history({ encounters: [enc('demonstrated', READER, phrase(9), YESTERDAY, 'v-yesterday', [3, 3])] }), 'v-now')).toBe(false);
  });
  it('viewed yesterday: not first contact', () => {
    expect(firstContactIn(read(), history({ encounters: [enc('viewed', READER, phrase(9), YESTERDAY, 'v-yesterday')] }), 'v-now')).toBe(false);
  });
  it('viewed today, only on this visit: first contact — looking before reading is what sight-reading is', () => {
    expect(firstContactIn(read(), history({ encounters: [enc('viewed', READER, phrase(9), NOON, 'v-now')] }), 'v-now')).toBe(true);
  });
  it('heard on this very visit: not first contact', () => {
    expect(firstContactIn(read(), history({ encounters: [enc('heard', READER, phrase(9), NOON, 'v-now')] }), 'v-now')).toBe(false);
  });
  it('a run of it yesterday: not first contact; a run of another seed: first contact', () => {
    expect(firstContactIn(read(), history({ runs: [run(READER, phrase(9), YESTERDAY)] }), 'v-now')).toBe(false);
    expect(firstContactIn(read(), history({ runs: [run(READER, phrase(8), YESTERDAY)] }), 'v-now')).toBe(true);
  });
  it('a passage: bars 1–8 practised leave bars 25–32 a first contact, the whole piece not', () => {
    const h = history({ runs: [run(PARENT, file('p'), YESTERDAY, over(1, 8))] });
    expect(firstContactIn(target(PARENT, { bars: [25, 32] }), h, 'v-now')).toBe(true);
    expect(firstContactIn(target(PARENT), h, 'v-now')).toBe(false);
  });
});

describe('contact, with how it was met; D4’s verdicts kept', () => {
  it('heard and never played is met, and says heard', () => {
    expect(contactIn([], PARENT, file('p'), { encounters: [enc('heard', PARENT, file('p'), NOON)] })).toEqual({ contact: 'met', metById: true, metAs: [PARENT], how: ['heard'] });
  });
  it('played, demonstrated and viewed under another id: met, every way it was', () => {
    const got = contactIn([run('song.old', file('p'), YESTERDAY)], PARENT, file('p'), {
      encounters: [enc('viewed', 'song.old', file('p'), NOON), enc('demonstrated', 'song.copy', file('p'), NOON)],
    });
    expect(got).toEqual({ contact: 'met', metById: false, metAs: ['song.old', 'song.copy'], how: ['played', 'demonstrated', 'viewed'] });
  });
  it('an encounter by id alone is met by id; a pruned run’s summary is still played', () => {
    expect(contactIn([], 'drill.x', file('z'), { encounters: [enc('heard', 'drill.x', { kind: 'none' }, NOON)] }).contact).toBe('met-by-id');
    const summary = mergeSummaries(undefined, foldRun(run(PARENT, file('p'), YESTERDAY)));
    expect(contactIn([], PARENT, file('p'), { summaries: [summary] })).toEqual({ contact: 'met', metById: true, metAs: [PARENT], how: ['played'] });
    const legacy = mergeSummaries(undefined, foldRun(run(PARENT, undefined, YESTERDAY)));
    expect(contactIn([], PARENT, file('p'), { summaries: [legacy] })).toEqual({ contact: 'met-by-id', metById: true });
  });
  it('D4’s cases give D4’s verdicts, with how beside a met', () => {
    const verdict = (value: ReturnType<typeof contactIn>): unknown => {
      const { how: _how, ...rest } = value;
      return rest;
    };
    expect(verdict(contactIn([run('song.a', file('a'), NOON)], 'song.a', file('a')))).toEqual({ contact: 'met', metById: true, metAs: ['song.a'] });
    expect(contactIn([run('song.a', file('a'), NOON)], 'song.a', file('a')).how).toEqual(['played']);
    expect(contactIn([run('song.a', undefined, NOON)], 'song.a', file('a'))).toEqual({ contact: 'met-by-id', metById: true });
    expect(contactIn([run('exercise.s', scale('A'), NOON)], 'exercise.s', scale('D'))).toEqual({ contact: 'unmet', metById: true });
    expect(contactIn([], 'song.a', file('a'))).toEqual({ contact: 'unmet', metById: false });
    // A new seed of the same row: realisation-novel, the id met under other material.
    expect(contactIn([run('drill.reading.sight-reading-2-right', phrase(8), NOON)], 'drill.reading.sight-reading-2-right', phrase(9))).toEqual({ contact: 'unmet', metById: true });
    expect(contactIn([run('song.placeholder', { kind: 'none' }, NOON)], 'song.placeholder', { kind: 'none' })).toEqual({ contact: 'met-by-id', metById: true, materialUnknown: true });
  });
});

describe('the store reads the encounters and the summaries for contact', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  it('contact over the store: heard from the Library and never played is met', async () => {
    await recordEncounter({ kind: 'heard', itemId: 'exercise.pentatonic.a.blues', material: scale('A'), source: { tab: 'library' }, visit: 'v1' });
    expect(await contact('exercise.pentatonic.a.blues', scale('A'))).toEqual({ contact: 'met', metById: true, metAs: ['exercise.pentatonic.a.blues'], how: ['heard'] });
    expect(await contact('exercise.pentatonic.d.blues', scale('D'))).toEqual({ contact: 'unmet', metById: false });
  });
});

describe('the summary a pruned run leaves: idempotent, evidence-free, one per material', () => {
  it('folding the same run twice changes nothing; the summary holds the encounter projection and no evidence', () => {
    const row = run(PARENT, file('p'), YESTERDAY, { ...over(1, 8), opened: { tab: 'today', slot: 'new' }, evidence: [], evidenceDefinitions: 3, accuracy: 0.97 });
    const once = mergeSummaries(undefined, foldRun(row));
    const twice = mergeSummaries(once, foldRun(row));
    expect(twice).toEqual(once);
    expect(once).toEqual({
      key: materialKey(file('p'), PARENT),
      material: file('p'),
      itemIds: [PARENT],
      byId: false,
      spans: [{ run: 'practised', bars: [1, 8], first: YESTERDAY, last: YESTERDAY, sources: ['today:new'] }],
    });
    expect(JSON.stringify(once)).not.toMatch(/evidence|accuracy|wrongNotes|steps/);
  });
  it('a run with no material folds by its id, and says so', () => {
    const summary = mergeSummaries(undefined, foldRun(run('song.legacy', undefined, YESTERDAY)));
    expect(summary).toMatchObject({ key: 'id:song.legacy', material: { kind: 'id', itemId: 'song.legacy' }, byId: true });
  });
});

describe('the first-contact fact on a piece is an audit fact, never a gate on its pass', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  /** A piece's run as G1's app wrote it: the relation under sight-reading's name. */
  const pieceRun = (unseen: boolean): RunResult => ({ ...run(PARENT, file('p'), NOON), unseen, passed: true, masterEligible: false });
  /** A piece's run as G1a writes it: `firstContact`, and no `unseen` (the reviewer's required change, `responses/b48342f.md`). */
  const pieceRunG1a = (firstContact: boolean): RunResult => ({ ...run(PARENT, file('p'), NOON), firstContact, passed: true, masterEligible: false });

  it('which runs are generated phrases: the recipe, or the flag on a run whose material is none but a phrase’s', () => {
    expect(isPhraseRun({ recipe: { row: 'drill.reading.x' } })).toBe(true);
    expect(isPhraseRun({ unseen: true })).toBe(true);
    expect(isPhraseRun({ unseen: false, material: phrase(3) })).toBe(true);
    expect(isPhraseRun({ unseen: false, material: file('p') })).toBe(false);
    expect(isPhraseRun({ unseen: true, material: scale('A') })).toBe(false);
    expect(isPhraseRun({ unseen: false, material: { kind: 'none' } })).toBe(false);
    expect(isPhraseRun({})).toBe(false);
    // G1a: the relation is not sight-reading's mark — a run carrying `firstContact` alone is no phrase,
    // whatever its value; a phrase's run carries both and is one by its recipe.
    const pieceG1a: SessionRow = { ...run(PARENT, file('p'), NOON), firstContact: false };
    const firstPieceG1a: SessionRow = { ...run(PARENT, undefined, NOON), firstContact: true };
    const phraseG1a: SessionRow = { ...run('drill.reading.x', phrase(3), NOON), firstContact: true, unseen: true, recipe: { row: 'drill.reading.x' } };
    expect(isPhraseRun(pieceG1a)).toBe(false);
    expect(isPhraseRun(firstPieceG1a)).toBe(false);
    expect(isPhraseRun(phraseG1a)).toBe(true);
  });

  it('a piece played again as G1a stores it (firstContact: false, no unseen) passes, meets its rung and is flagged nothing', async () => {
    await recordRun(pieceRunG1a(true), new Date(2026, 8, 28, 12));
    const row = await recordRun(pieceRunG1a(false), new Date(2026, 8, 29, 12));
    expect(row.status).toBe('passed');
    expect(row.passedOn).toEqual(['2026-09-28', '2026-09-29']);
    expect((await getProgress(PARENT)).bestAccuracy).toBe(0.9);
    const stored: SessionRow = { ...run(PARENT, file('p'), NOON), firstContact: false, accuracy: 0.95 };
    expect(meetsStandard(stored, { passAccuracy: 0.9, passTempoPct: 80, masterAccuracy: 0.97, masterTempoPct: 100 })).toBe(true);
    expect(historyDetail(stored)).not.toContain('not first sight');
  });

  // Kept (G1a): G1's app wrote `unseen: false` on a piece played again, between G1's landing and
  // G1a's — the only window in which an ordinary row carries `unseen`. `isPhraseRun` still reads it
  // as no phrase, so it keeps its pass and its rung credit.
  it('a piece played again (unseen: false) still passes, and the rung state still reads it', async () => {
    await recordRun(pieceRun(true), new Date(2026, 8, 28, 12));
    const row = await recordRun(pieceRun(false), new Date(2026, 8, 29, 12));
    expect(row.status).toBe('passed');
    expect(row.passedOn).toEqual(['2026-09-28', '2026-09-29']);
    expect((await getProgress(PARENT)).bestAccuracy).toBe(0.9);
    const stored = { ...run(PARENT, file('p'), NOON), unseen: false, accuracy: 0.95 } as SessionRow;
    expect(meetsStandard(stored, { passAccuracy: 0.9, passTempoPct: 80, masterAccuracy: 0.97, masterTempoPct: 100 })).toBe(true);
    expect(historyDetail(stored)).not.toContain('not first sight');
  });

  it('a phrase read before still passes nothing and says so on its history line', () => {
    const reread: SessionRow = { ...run('drill.reading.sight-reading-2-right', phrase(4), NOON), unseen: false, recipe: { row: 'drill.reading.sight-reading-2-right' }, seed: 4 };
    expect(meetsStandard(reread, { passAccuracy: 0.8, passTempoPct: 80, masterAccuracy: 0.97, masterTempoPct: 100 })).toBe(false);
    expect(historyDetail(reread)).toContain('not first sight');
  });
});

describe('nothing but a viewing or a playback writes an encounter', () => {
  it('the Score screen is the one writer: no status, lifecycle action or assignment calls it', () => {
    const src = join(process.cwd(), 'src');
    const callers: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts') && readFileSync(path, 'utf8').includes('recordEncounter(')) callers.push(relative(src, path).split(sep).join('/'));
      }
    };
    walk(src);
    expect(callers.sort()).toEqual(['data/encounterStore.ts', 'ui/screens/ScoreScreen.ts']);
    const screen = readFileSync(join(src, 'ui', 'screens', 'ScoreScreen.ts'), 'utf8');
    expect(screen.match(/recordEncounter\(/g)).toHaveLength(2);
  });
});
