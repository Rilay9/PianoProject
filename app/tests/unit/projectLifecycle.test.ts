/**
 * The repertoire lifecycle as the learner's stated relationship with a piece (G1b; R19, R47, R18,
 * L86; the brief `docs/prompts/tasks/G1b-repertoire-lifecycle.md`, approved with the reviewer's
 * rulings in `docs/review/responses/a96395d.md`, second section).
 *
 * One `projects` store (`DB_VERSION` 9) of learner-stated intention: one row per known material
 * identity (an id-only row where the item names none), the state the learner last chose with when,
 * an append-only history, and the learner's own goal, problem and sections. Every transition is the
 * learner's action on the project sheet; the app proposes nothing and moves nothing. Nothing here
 * writes an encounter, a run, a progress row or an evidence record, and no evidence, skill or
 * eligibility code reads a project; the session reads them for one thing, once per card: a piece paused
 * or put away is offered by no automatic chooser (G1d, the reviewer's G82 ruling; G1e, its review's
 * required change).
 *
 * The cases, in the brief's order: the store and the upgrade from a version-8 database with rows in
 * every store; the transitions table (every action from every state the sheet offers it, the history
 * appended, anything else refused); R18's three facts; identity (an import's bytes, one piece under
 * two ids, an id-only row never another id's); the backup; the refuting test of the brief's item 3
 * as a guard (every reader of the old truths unchanged on a history with projects, and the files
 * that may read a project named); the reviewer's ruling that *I performed it* manufactures nothing;
 * the seven adversaries.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import {
  DB_VERSION,
  STORE_NAMES,
  openDatabase,
  resetDatabaseForTest,
  type ProjectAction,
  type ProjectRow,
  type ProjectState,
  type SessionRow,
} from '../../src/data/db';
import {
  ACTION_STATE,
  OFFERS,
  PROJECT_STATES,
  actionsFor,
  addProjectSection,
  allProjects,
  applyProjectAction,
  isProjectable,
  mergeProjects,
  projectFor,
  projectIn,
  removeProjectSection,
  resetProjectsForTest,
  setProjectNotes,
  type ProjectTarget,
} from '../../src/data/projectStore';
import { allProgress, contact, getProgress, learnedPieces, recordRun, resetProgressForTest, rungRows, selfPass, type RunResult } from '../../src/data/progressStore';
import { familiarityIn, historyFor, recordEncounter, resetEncountersForTest } from '../../src/data/encounterStore';
import { materialKey, materialOfItem, textIdentity } from '../../src/curriculum/material';
import { exportAll, importAll } from '../../src/data/backup';
import { rungState, skillLadders } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { Identity } from '../../src/review/record';

// --- materials, items, runs ---------------------------------------------------------------------

const file = (c: string): Identity => ({ kind: 'file', sha256: c.repeat(64) });
const NONE: Identity = { kind: 'none', why: 'an imported score: no build identity' };

const SONG = 'song.minuet';
const SONG_COPY = 'song.minuet.copy';
const EXCERPT = 'excerpt.minuet.b1-8';
const IMPORT = 'import.mine';
const TWO_YEARS_AGO = '2024-09-20T12:00:00.000Z';
const A_MONTH_LATER = '2024-10-20T12:00:00.000Z';
const YESTERDAY = '2026-09-28T12:00:00.000Z';
const NOON = '2026-09-29T12:00:00.000Z';
const EVENING = '2026-09-29T19:00:00.000Z';

function song(id: string, material: Identity, extra: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id,
    type: 'song',
    title: id,
    level: 2,
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: `scores/${id}.mxl`,
    provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: material },
    ...extra,
  } as unknown as CatalogItem;
}

const target = (itemId: string, material: Identity | undefined): ProjectTarget => ({ itemId, material });
const MINUET = target(SONG, file('m'));

function runOf(itemId: string, material: Identity | undefined, extra: Partial<RunResult> = {}): RunResult {
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 0.96,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 1,
    durationMs: 60_000,
    passed: true,
    masterEligible: false,
    ...(material === undefined ? {} : { material }),
    ...extra,
  };
}

/** A small curriculum: one ordinary rung and one Stage 9 project unit, both listing the minuet. */
const CURRICULUM = {
  version: 1,
  tracks: [],
  stages: [
    { number: 1, title: 'One', units: [{ id: 'u1', track: 'core', lessons: [lesson('1.1')] }] },
    { number: 9, title: 'Projects', units: [{ id: 'classical.9.1', track: 'classical', lessons: [lesson('classical.9')] }] },
  ],
} as unknown as Curriculum;
function lesson(id: string): unknown {
  return {
    id,
    title: id,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [],
    songOptions: [SONG],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
    requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
  };
}

/** Every store but `projects`, rows and keys, as the database holds them now. */
async function everyOtherStore(): Promise<Record<string, unknown>> {
  const db = await openDatabase();
  const out: Record<string, unknown> = {};
  for (const name of [...(db?.objectStoreNames ?? [])].filter((one) => one !== 'projects').sort()) {
    out[name] = { rows: await db?.getAll(name as never), keys: await db?.getAllKeys(name as never) };
  }
  return out;
}

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  resetEncountersForTest();
  resetProjectsForTest();
});
afterEach(() => clearFakeIndexedDb());

// ---------------------------------------------------------------------------------------------------

describe('the store, and the upgrade that makes it', () => {
  it('a version-8 database with a row in every store opens at version 9 with every row as it was and the projects store empty', async () => {
    // Version 8's schema, as `db.ts` made it.
    const old = await openDB('pianopath', 8, {
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
        const encounters = database.createObjectStore('encounters', { keyPath: 'id' });
        encounters.createIndex('byKey', 'key');
        encounters.createIndex('byItem', 'itemId');
        database.createObjectStore('contacts', { keyPath: 'key' });
      },
    });
    await old.put('settings', '{"zoom":1.25}', 'pianopath.settings');
    await old.put('progress', { itemId: SONG, status: 'passed', bestAccuracy: 0.9, bestTempoPct: 100, attempts: 3, lastPracticedAt: YESTERDAY, minutes: 12, passedOn: ['2026-09-28'] });
    await old.add('sessions', { itemId: SONG, mode: 'tempo', tempoPct: 100, accuracy: 0.9, accuracyEstimated: false, wrongNotes: 1, missed: 0, durationMs: 60_000, at: YESTERDAY, material: file('m') });
    await old.put('imports', { id: IMPORT, kind: 'musicxml', title: 'Mine', data: '<score-partwise/>', tags: [], addedAt: YESTERDAY });
    await old.put('plan', { id: 'current', stage: 2, unitId: '2.1', trackOrder: ['core'] });
    await old.put('streak', { id: 'streak', minutesByDay: { '2026-09-28': 12 }, weeklyGoalMinutes: 150 });
    await old.put('micCalibration', { latencyMs: 40 }, 'device-1');
    await old.put('skills', { conceptId: 'scale', exposedAt: YESTERDAY });
    await old.put('levelOverrides', { itemId: SONG, level: 2.5, at: YESTERDAY });
    await old.put('folderLibraries', { id: 'Mine', addedAt: YESTERDAY, source: null });
    await old.put('books', { id: 'book.mine', title: 'Mine', kind: 'method', pieces: [], addedAt: YESTERDAY });
    await old.put('folderScores', { folder: 'Mine', file: 'a.mxl', sort: 'a', title: 'A', composer: '', level: null, bars: null, status: '', style: '', rating: 0, ratings: 0, views: 0, lyrics: false, garbled: false, museScore: '' });
    await old.put('folderIndexes', { id: 'Mine', files: ['a.mxl'], haystacks: ['a'], letters: 'A', levels: new Float64Array([Number.NaN]), styleNames: [], styles: new Uint16Array([0]), statusNames: [], statuses: new Uint16Array([0]), rated: new Uint8Array([0]), unnamed: 0 });
    await old.put('encounters', { id: 'v1:1', key: materialKey(file('m'), SONG), material: file('m'), itemId: SONG, kind: 'viewed', at: YESTERDAY, source: { tab: 'library' }, visit: 'v1' });
    await old.put('contacts', { key: 'id:song.gone', material: { kind: 'id', itemId: 'song.gone' }, itemIds: ['song.gone'], byId: true, spans: [{ run: 'practised', first: TWO_YEARS_AGO, last: TWO_YEARS_AGO, sources: ['library'] }] });
    const names = [...old.objectStoreNames];
    const before: Record<string, unknown> = {};
    for (const name of names) before[name] = { rows: await old.getAll(name as never), keys: await old.getAllKeys(name as never) };
    old.close();
    resetDatabaseForTest();

    const db = await openDatabase();
    // Revised (CL23): this was `toBe(9)` twice, true until the next version. The case is the version 9
    // upgrade on its path to the current one, as `encounterModel.test.ts` reads version 8's; version 10
    // (L53) touches no row this fixture holds, a performance being the only row it marks.
    expect(DB_VERSION).toBeGreaterThanOrEqual(9);
    expect(db?.version).toBe(DB_VERSION);
    for (const name of names) {
      expect({ rows: await db?.getAll(name as never), keys: await db?.getAllKeys(name as never) }, `${name} changed in the upgrade`).toEqual(before[name]);
    }
    expect([...(db?.objectStoreNames ?? [])].sort()).toEqual([...names, 'projects'].sort());
    expect(await db?.getAll('projects')).toEqual([]);
    expect([...(db?.transaction('projects').store.indexNames ?? [])]).toEqual(['byItem']);
    // Nothing is manufactured from what was already there: a passed piece is no project (item 8).
    expect(await allProjects()).toEqual([]);
  });

  it('a project is one row: the material, the item, the state and since, an append-only history', async () => {
    const learnt = await applyProjectAction(MINUET, 'learn', { at: new Date(NOON) });
    expect(learnt).toEqual({
      id: materialKey(file('m'), SONG),
      material: file('m'),
      itemId: SONG,
      state: 'learning',
      since: NOON,
      history: [{ state: 'learning', at: NOON, why: 'learn' }],
    });
    const polished = await applyProjectAction(MINUET, 'polish', { at: new Date(EVENING) });
    expect(polished.history.slice(0, 1), 'the history was rewritten').toEqual(learnt.history);
    expect(polished).toMatchObject({ state: 'polishing', since: EVENING, history: [learnt.history[0], { state: 'polishing', at: EVENING, why: 'polish' }] });
    const db = await openDatabase();
    expect(await db?.getAll('projects')).toEqual([polished]);
    expect(STORE_NAMES).toContain('projects');
  });

  it('without a database the rows live for the session, as every store’s do', async () => {
    clearFakeIndexedDb();
    resetProjectsForTest();
    await applyProjectAction(MINUET, 'save', { at: new Date(NOON) });
    expect((await projectFor(MINUET))?.state).toBe('saved');
  });

  it('pieces are projects; a drill, an exercise and an excerpt are not offered one', () => {
    expect(isProjectable(song(SONG, file('m')))).toBe(true);
    expect(isProjectable({ ...song('import.x', NONE), imported: true } as CatalogItem)).toBe(true);
    expect(isProjectable({ ...song('drill.reading.x', NONE), type: 'drill' })).toBe(false);
    expect(isProjectable({ ...song('exercise.scale.c', file('c')), type: 'exercise' })).toBe(false);
    expect(isProjectable({ ...song(EXCERPT, file('e')), type: 'excerpt' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------

/** The table the sheet offers, stated here as a fact of its own: a change to it is a change to this test. */
const TABLE: Record<ProjectState | 'none', ProjectAction[]> = {
  none: ['save', 'learn', 'polish', 'keep'],
  saved: ['learn', 'polish', 'retire'],
  learning: ['polish', 'performed', 'keep', 'pause', 'retire'],
  polishing: ['ready', 'performed', 'pause', 'retire'],
  'performance-ready': ['performed', 'keep', 'polish', 'pause', 'retire'],
  maintaining: ['performed', 'polish', 'bring-back', 'pause', 'retire'],
  refreshing: ['keep', 'polish', 'pause', 'retire'],
  paused: ['bring-back', 'learn', 'retire'],
  retired: ['bring-back'],
};
const EVERY_ACTION: ProjectAction[] = ['save', 'learn', 'polish', 'ready', 'performed', 'keep', 'bring-back', 'pause', 'retire'];
/**
 * The one entry of the table offered only for a piece the record says is passed (G96; the reviewer's
 * ruling, `responses/9c64a9c1.md`, and its approval, `responses/questions-71bd6cee.md`): *Keep it
 * playable* from no project. Every other entry is offered for any piece.
 */
const NEEDS_A_PASS: ProjectAction[] = ['keep'];
/** What the table offers from a state to a piece with no pass on the record. */
const offeredUnpassed = (state: ProjectState | 'none'): ProjectAction[] => (state === 'none' ? TABLE.none.filter((action) => !NEEDS_A_PASS.includes(action)) : TABLE[state]);

/** The shortest path of offered actions from no project to each state, for a piece with no pass. */
function pathsFromNothing(): Map<ProjectState, ProjectAction[]> {
  const paths = new Map<ProjectState, ProjectAction[]>();
  const queue: { state: ProjectState | 'none'; path: ProjectAction[] }[] = [{ state: 'none', path: [] }];
  while (queue.length > 0) {
    const { state, path } = queue.shift() as { state: ProjectState | 'none'; path: ProjectAction[] };
    for (const action of offeredUnpassed(state)) {
      const next = ACTION_STATE[action];
      if (paths.has(next)) continue;
      paths.set(next, [...path, action]);
      queue.push({ state: next, path: [...path, action] });
    }
  }
  return paths;
}

describe('the transitions table: every action from every state the sheet offers it, and nothing else', () => {
  // Revised (G96, class replace): the table still holds every transition there is, *Keep it playable*
  // from no project among them, and the offers are the table's row — except that entry, offered only
  // where the piece is passed. Old assumption: every action in `OFFERS.none` is offered for any piece.
  it('the offers are the table, from no project Keep it playable only for a piece passed; the states Part 27’s eight, and every action enters the state it names', () => {
    expect(PROJECT_STATES).toEqual(['saved', 'learning', 'polishing', 'performance-ready', 'maintaining', 'refreshing', 'paused', 'retired']);
    expect(OFFERS).toEqual(TABLE);
    expect(actionsFor(undefined, true)).toEqual(TABLE.none);
    expect(actionsFor(undefined, false)).toEqual(['save', 'learn', 'polish']);
    // With a project, whether the piece is passed changes nothing: the ruling is about no project.
    for (const state of PROJECT_STATES) {
      expect(actionsFor(state, false), state).toEqual(TABLE[state]);
      expect(actionsFor(state, true), state).toEqual(TABLE[state]);
    }
    expect(ACTION_STATE).toEqual({
      save: 'saved',
      learn: 'learning',
      polish: 'polishing',
      ready: 'performance-ready',
      performed: 'maintaining',
      keep: 'maintaining',
      'bring-back': 'refreshing',
      pause: 'paused',
      retire: 'retired',
    });
    // Every state reachable by the learner's actions alone, from no project.
    expect([...pathsFromNothing().keys()].sort()).toEqual([...PROJECT_STATES].sort());
    // Refreshing is entered only by *Bring it back*, from paused, retired or maintaining (the brief's item 2).
    const into = (state: ProjectState): string[] => Object.entries(TABLE).filter(([, actions]) => actions.some((action) => ACTION_STATE[action] === state)).map(([from]) => from).sort();
    expect(into('refreshing')).toEqual(['maintaining', 'paused', 'retired']);
  });

  // Revised (G96, class replace): on a piece with no pass, as the minuet here has — so from no project
  // *Keep it playable* is among the refused (its offer on a passed piece is the describe below). Old
  // assumption: `keep` from `none` is accepted for any piece.
  const paths = pathsFromNothing();
  for (const from of ['none', ...PROJECT_STATES] as (ProjectState | 'none')[]) {
    it(`from ${from}, on a piece with no pass: each offered action moves the project and appends one line; every other action is refused and writes nothing`, async () => {
      for (const action of EVERY_ACTION) {
        useFakeIndexedDb();
        resetProjectsForTest();
        let at = Date.parse(YESTERDAY);
        const tick = (): Date => new Date((at += 60_000));
        for (const step of from === 'none' ? [] : (paths.get(from) as ProjectAction[])) await applyProjectAction(MINUET, step, { at: tick() });
        const before = await projectFor(MINUET);
        expect(before?.state).toBe(from === 'none' ? undefined : from);
        const when = tick();
        if (offeredUnpassed(from).includes(action)) {
          const after = await applyProjectAction(MINUET, action, { at: when });
          expect(after.state, `${from} → ${action}`).toBe(ACTION_STATE[action]);
          expect(after.since).toBe(when.toISOString());
          expect(after.history.slice(0, -1), `${from} → ${action} rewrote the history`).toEqual(before?.history ?? []);
          expect(after.history.at(-1)).toMatchObject({ state: ACTION_STATE[action], at: when.toISOString(), why: action });
          expect(await allProjects()).toHaveLength(1);
        } else {
          await expect(applyProjectAction(MINUET, action, { at: when }), `${from} offered ${action}`).rejects.toThrow(/not offered/);
          expect(await projectFor(MINUET), `${from} → ${action} wrote something`).toEqual(before);
        }
      }
    });
  }

  it('I performed it keeps the learner’s date, the run’s day by default, and refuses a date that is not a day or not yet', async () => {
    await applyProjectAction(MINUET, 'learn', { at: new Date(YESTERDAY) });
    const performed = await applyProjectAction(MINUET, 'performed', { at: new Date(NOON), performedOn: '2026-09-27' });
    expect(performed.history.at(-1)).toEqual({ state: 'maintaining', at: NOON, why: 'performed', performedOn: '2026-09-27' });
    const again = await applyProjectAction(MINUET, 'performed', { at: new Date(EVENING) });
    expect(again.history.at(-1)?.performedOn).toMatch(/^2026-09-(29|30)$/);
    await expect(applyProjectAction(MINUET, 'performed', { at: new Date(EVENING), performedOn: 'yesterday' })).rejects.toThrow(/day/);
    await expect(applyProjectAction(MINUET, 'performed', { at: new Date(NOON), performedOn: '2026-10-05' })).rejects.toThrow(/day/);
    // A date belongs only to I performed it.
    await expect(applyProjectAction(MINUET, 'pause', { at: new Date(EVENING), performedOn: '2026-09-27' })).rejects.toThrow(/performed/);
    expect((await projectFor(MINUET))?.history).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------------------------------

/**
 * G96 (the reviewer's ruling, `responses/9c64a9c1.md`, and its approval, `responses/questions-71bd6cee.md`):
 * *Keep it playable* is the maintenance of something already learned, so from no project it is offered
 * only where the record says the piece is passed — its progress row `passed` or `mastered`, a self-pass
 * included, under the item's own id — and the store refuses it otherwise, whoever asks. It reads that
 * itself: no caller says "passed".
 */
describe('from no project, Keep it playable only for a piece the record says is passed; the store refuses it otherwise (G96)', () => {
  it('(a) no project and no progress row: refused, no project made, nothing written anywhere', async () => {
    const stores = await everyOtherStore();
    await expect(applyProjectAction(MINUET, 'keep', { at: new Date(NOON) })).rejects.toThrow(/not offered/);
    expect(await projectFor(MINUET)).toBeUndefined();
    expect(await allProjects()).toEqual([]);
    expect(await everyOtherStore()).toEqual(stores);
  });

  it('(b) a run that did not pass, and a pass under another id of the same file: refused', async () => {
    await recordRun(runOf(SONG, file('m'), { accuracy: 0.5, passed: false }), new Date(YESTERDAY));
    expect((await getProgress(SONG)).status).toBe('started');
    await expect(applyProjectAction(MINUET, 'keep', { at: new Date(NOON) })).rejects.toThrow(/not offered/);
    expect(await projectFor(MINUET)).toBeUndefined();
    // Keyed by the item's own id, as Progress reads it: the copy's pass is the copy's.
    await recordRun(runOf(SONG_COPY, file('m')), new Date(YESTERDAY));
    expect((await getProgress(SONG_COPY)).status).toBe('passed');
    await expect(applyProjectAction(MINUET, 'keep', { at: new Date(NOON) })).rejects.toThrow(/not offered/);
    expect(await allProjects()).toEqual([]);
  });

  it('(c) after a passed run: accepted, kept playable, one line in the history', async () => {
    await recordRun(runOf(SONG, file('m')), new Date(YESTERDAY));
    const kept = await applyProjectAction(MINUET, 'keep', { at: new Date(NOON) });
    expect(kept).toMatchObject({ itemId: SONG, state: 'maintaining', since: NOON, history: [{ state: 'maintaining', at: NOON, why: 'keep' }] });
    expect(kept.history).toHaveLength(1);
  });

  it('(d) after I already know this (a self-pass): accepted', async () => {
    await selfPass(SONG, new Date(YESTERDAY));
    expect((await applyProjectAction(MINUET, 'keep', { at: new Date(NOON) })).state).toBe('maintaining');
  });

  it('(e) a mastered row: accepted', async () => {
    await recordRun(runOf(SONG, file('m'), { masterEligible: true }), new Date(TWO_YEARS_AGO));
    await recordRun(runOf(SONG, file('m'), { masterEligible: true }), new Date(YESTERDAY));
    expect((await getProgress(SONG)).status).toBe('mastered');
    expect((await applyProjectAction(MINUET, 'keep', { at: new Date(NOON) })).state).toBe('maintaining');
  });

  it('(f) Save for later, Learn this and Prepare it for performance on a piece never played: accepted, as before', async () => {
    for (const [index, action] of (['save', 'learn', 'polish'] as ProjectAction[]).entries()) {
      const piece = target(`song.never.${action}`, file(String(index)));
      expect((await applyProjectAction(piece, action, { at: new Date(NOON) })).state).toBe(ACTION_STATE[action]);
    }
  });

  it('(g) Keep it playable from learning, ready to perform and bringing it back, on a piece never played: accepted, as before', async () => {
    const from: [ProjectState, ProjectAction[]][] = [
      ['learning', ['learn']],
      ['performance-ready', ['polish', 'ready']],
      ['refreshing', ['learn', 'pause', 'bring-back']],
    ];
    let at = Date.parse(NOON);
    for (const [index, [state, path]] of from.entries()) {
      const piece = target(`song.never.${state}`, file(String(index)));
      for (const step of path) await applyProjectAction(piece, step, { at: new Date((at += 60_000)) });
      expect((await projectFor(piece))?.state).toBe(state);
      expect((await applyProjectAction(piece, 'keep', { at: new Date((at += 60_000)) })).state, state).toBe('maintaining');
    }
  });

  it('(h) the read writes nothing: every other store the same after an accepted and a refused Keep it playable', async () => {
    await recordRun(runOf(SONG, file('m')), new Date(YESTERDAY));
    const stores = await everyOtherStore();
    await applyProjectAction(MINUET, 'keep', { at: new Date(NOON) });
    await expect(applyProjectAction(target('song.never', file('n')), 'keep', { at: new Date(NOON) })).rejects.toThrow(/not offered/);
    expect(await everyOtherStore()).toEqual(stores);
    expect((await allProjects()).map((row) => row.itemId)).toEqual([SONG]);
  });
});

// ---------------------------------------------------------------------------------------------------

describe('R18: the learner’s goal, problem and sections — free text, optional, choosing nothing', () => {
  it('goal and problem are the learner’s words, trimmed; an empty box takes the words away; the state does not move', async () => {
    const project = await applyProjectAction(MINUET, 'learn', { at: new Date(NOON) });
    const noted = await setProjectNotes(project.id, { goal: '  Hands together to bar 16  ', problem: 'The left hand at bar 12' });
    expect(noted).toMatchObject({ goal: 'Hands together to bar 16', problem: 'The left hand at bar 12', state: 'learning', since: NOON });
    expect(noted.history).toEqual(project.history);
    const cleared = await setProjectNotes(project.id, { goal: '' });
    expect(cleared.goal).toBeUndefined();
    expect(cleared.problem).toBe('The left hand at bar 12');
  });

  it('sections are added one at a time, bounded by the piece’s bars; a range outside them is refused and writes nothing', async () => {
    const project = await applyProjectAction(MINUET, 'learn', { at: new Date(NOON) });
    const one = await addProjectSection(project.id, { from: 1, to: 8, label: 'A' }, 32);
    const two = await addProjectSection(project.id, { from: 25, to: 32, label: ' the return ' }, 32);
    expect(two.sections).toEqual([{ from: 1, to: 8, label: 'A' }, { from: 25, to: 32, label: 'the return' }]);
    expect(one.sections).toHaveLength(1);
    await expect(addProjectSection(project.id, { from: 30, to: 40, label: 'past the end' }, 32)).rejects.toThrow(/bars/i);
    await expect(addProjectSection(project.id, { from: 9, to: 4, label: 'backwards' }, 32)).rejects.toThrow(/bars/i);
    await expect(addProjectSection(project.id, { from: 0, to: 4, label: 'before the start' }, 32)).rejects.toThrow(/bars/i);
    await expect(addProjectSection(project.id, { from: 1.5, to: 4, label: 'half a bar' }, 32)).rejects.toThrow(/bars/i);
    // A piece whose length is not known: bars from 1 up, no ceiling guessed.
    expect((await addProjectSection(project.id, { from: 40, to: 48, label: 'coda' })).sections).toHaveLength(3);
    const removed = await removeProjectSection(project.id, 0);
    expect(removed.sections?.map((section) => section.label)).toEqual(['the return', 'coda']);
    expect(removed.history).toEqual(project.history);
  });

  it('notes and sections need a project: the sheet shows them only once the learner has made one', async () => {
    await expect(setProjectNotes(materialKey(file('x'), 'song.x'), { goal: 'a goal' })).rejects.toThrow(/no project/);
    expect(await allProjects()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------

describe('identity: known material may unify two ids; an id-only project is never guessed to be another piece', () => {
  it('a project on an import is its stored bytes, and the Library’s id-only view of the import still finds it', async () => {
    const bytes = await textIdentity('<score-partwise version="4.0"><work><work-title>Mine</work-title></work></score-partwise>');
    expect(bytes).toBeDefined();
    const project = await applyProjectAction(target(IMPORT, bytes), 'learn', { at: new Date(NOON) });
    expect(project.id).toBe(materialKey(bytes, IMPORT));
    expect(project.material).toEqual(bytes);
    // Progress holds only the catalogue row, whose material is `none` for an import: found by its own id.
    const row = { ...song(IMPORT, NONE), imported: true } as CatalogItem;
    expect(materialOfItem(row)).toEqual(NONE);
    expect((await projectFor(target(IMPORT, materialOfItem(row))))?.id).toBe(project.id);
    // A duplicate import under another id is the same bytes, so the same project.
    expect((await projectFor(target('import.duplicate', bytes)))?.id).toBe(project.id);
  });

  it('the same piece under two ids is one project, whichever id acts on it', async () => {
    await applyProjectAction(target(SONG, file('m')), 'learn', { at: new Date(NOON) });
    const polished = await applyProjectAction(target(SONG_COPY, file('m')), 'polish', { at: new Date(EVENING) });
    expect(await allProjects()).toEqual([polished]);
    expect(polished.itemId, 'the project kept the id it was made under').toBe(SONG);
  });

  it('an id-only project answers for its own id alone; a material project answers for its own id when the file was rebuilt', async () => {
    const paper = await applyProjectAction(target('book.czerny/12', undefined), 'save', { at: new Date(NOON) });
    expect(paper.id).toBe('id:book.czerny/12');
    expect(paper.material).toEqual({ kind: 'id', itemId: 'book.czerny/12' });
    expect(await projectFor(target('book.czerny/13', undefined))).toBeUndefined();
    expect(await projectFor(target('song.other', file('o')))).toBeUndefined();
    // The same catalogue id, its file built again with another sha256: the id still names the piece.
    await applyProjectAction(MINUET, 'learn', { at: new Date(NOON) });
    expect((await projectFor(target(SONG, file('r'))))?.id).toBe(materialKey(file('m'), SONG));
    // And the pure lookup prefers the material to the id.
    const rows = await allProjects();
    expect(projectIn(rows, target('song.somewhere-else', file('m')))?.itemId).toBe(SONG);
  });
});

// ---------------------------------------------------------------------------------------------------

describe('the backup carries the projects, and a restore follows the learner', () => {
  it('a replace restores them; a merge restored twice adds nothing; a change made on the device since the export is kept', async () => {
    await applyProjectAction(MINUET, 'learn', { at: new Date(YESTERDAY) });
    await setProjectNotes(materialKey(file('m'), SONG), { goal: 'bars 1–16' });
    const exported = JSON.parse(JSON.stringify(await exportAll())) as Awaited<ReturnType<typeof exportAll>>;
    expect(exported.stores.projects).toHaveLength(1);

    useFakeIndexedDb();
    resetProjectsForTest();
    await importAll(exported, { replace: true });
    expect(await allProjects()).toEqual(exported.stores.projects);

    // On the device, after the export: the learner prepares it for performance and names a problem.
    await applyProjectAction(MINUET, 'polish', { at: new Date(NOON) });
    await setProjectNotes(materialKey(file('m'), SONG), { problem: 'the trill' });
    await importAll(exported);
    await importAll(exported);
    const [merged] = (await allProjects());
    expect(await allProjects()).toHaveLength(1);
    expect(merged?.state, 'the older backup put the device’s state back').toBe('polishing');
    expect(merged?.history.map((step) => step.why)).toEqual(['learn', 'polish']);
    expect(merged).toMatchObject({ goal: 'bars 1–16', problem: 'the trill' });
  });

  it('the merge is a join: order does not matter, and a history is never shortened', () => {
    const base: ProjectRow = { id: 'k', material: { kind: 'file', sha256: 'm'.repeat(64) }, itemId: SONG, state: 'learning', since: YESTERDAY, history: [{ state: 'learning', at: YESTERDAY, why: 'learn' }] };
    const device: ProjectRow = { ...base, state: 'paused', since: EVENING, history: [...base.history, { state: 'paused', at: EVENING, why: 'pause' }], sections: [{ from: 1, to: 8, label: 'A' }] };
    const backup: ProjectRow = { ...base, state: 'polishing', since: NOON, history: [...base.history, { state: 'polishing', at: NOON, why: 'polish' }], goal: 'the goal', sections: [{ from: 9, to: 16, label: 'B' }] };
    const one = mergeProjects(device, backup);
    const two = mergeProjects(backup, device);
    expect(one.history.map((step) => step.why)).toEqual(['learn', 'polish', 'pause']);
    expect(one).toMatchObject({ state: 'paused', since: EVENING, goal: 'the goal' });
    expect(two.history).toEqual(one.history);
    expect(two.state).toBe(one.state);
    expect(mergeProjects(one, backup)).toEqual(one);
    expect(one.sections).toEqual([{ from: 1, to: 8, label: 'A' }, { from: 9, to: 16, label: 'B' }]);
    expect(mergeProjects(undefined, backup)).toEqual(backup);
  });
});

// ---------------------------------------------------------------------------------------------------

describe('never the bridge, never the source (the brief’s item 3; its refuting test kept as a guard)', () => {
  it('learned pieces, contact, familiarity, the rung state and the skills read the same with projects in every state', async () => {
    await recordRun(runOf(SONG, file('m')), new Date(YESTERDAY));
    await recordRun(runOf('song.other', file('o'), { accuracy: 0.5, passed: false }), new Date(YESTERDAY));
    await recordEncounter({ kind: 'heard', itemId: 'song.heard', material: file('h'), source: { tab: 'library' }, visit: 'v1', at: new Date(NOON) });
    const generated = (): boolean => false;
    const read = async (): Promise<unknown> => {
      const rows = await rungRows();
      return {
        learned: learnedPieces(await allProgress(), generated),
        contact: [await contact(SONG, file('m')), await contact('song.heard', file('h')), await contact('song.never', file('n'))],
        familiarity: familiarityIn({ itemId: SONG, material: file('m') }, await historyFor({ itemId: SONG, material: file('m') })),
        rungs: [...rungState(rows, CURRICULUM, VOCABULARY_V0, new Date(EVENING)).byRung.entries()],
        skills: [...skillLadders(rows, VOCABULARY_V0, new Date(EVENING)).entries()],
        progress: await getProgress(SONG),
      };
    };
    const before = await read();
    const stores = await everyOtherStore();
    let at = Date.parse(NOON);
    for (const [index, action] of (['save', 'learn', 'polish', 'ready', 'performed', 'keep', 'bring-back', 'pause', 'retire'] as ProjectAction[]).entries()) {
      // Each on a piece of its own, then the minuet walked through the table. Revised (G96, class
      // replace): the pieces have no pass, so the path into kept playable is *Learn this* then *I
      // performed it*, and the minuet — passed yesterday — ends its walk with *Keep it playable*, so the
      // action is still taken here. Old assumption: `keep`'s path from nothing was `['keep']` on a piece
      // with no pass.
      const piece = target(`song.${action}`, file(String(index)));
      const path = pathsFromNothing().get(ACTION_STATE[action]) as ProjectAction[];
      for (const step of path) await applyProjectAction(piece, step, { at: new Date((at += 60_000)) });
    }
    for (const step of ['learn', 'polish', 'ready', 'performed', 'bring-back', 'pause', 'retire', 'bring-back', 'keep'] as ProjectAction[]) {
      await applyProjectAction(MINUET, step, { at: new Date((at += 60_000)), ...(step === 'performed' ? { performedOn: '2026-09-28' } : {}) });
    }
    await setProjectNotes(materialKey(file('m'), SONG), { goal: 'a goal', problem: 'a problem' });
    await addProjectSection(materialKey(file('m'), SONG), { from: 1, to: 4, label: 'A' }, 16);
    resetProgressForTest();
    resetEncountersForTest();
    expect(await read(), 'a reader of the old truths moved with the projects').toEqual(before);
    expect(await everyOtherStore(), 'a project action wrote outside the projects store').toEqual(stores);
  });

  // Revised (G1d item 5; the reviewer's G82 ruling): the session reads a project for one thing over the
  // rows Today hands it (`BuildInput.projects`, from `allProjects`). So Today and the session are readers
  // now, and the pin is on what the session does with the rows: `projectIn`, once, and nothing that opens
  // the store. No evidence, skill or eligibility file imports from the store; the sheet alone acts.
  // Revised again (G1e; the G1d review's required change, `responses/d59f2ef8.md`): the one thing is
  // automatic eligibility — a piece paused or put away is offered by no automatic chooser — read once per
  // composition, so the one lookup sits in `buildSession`'s context assembly, not in `review()`: a lookup
  // in a chooser is the scattered policy the review ruled out. Old assumption: the lookup inside `review()`.
  // Revised (G85 item 5; the reviewer's ruling 3 on the G1b brief): the Library is a reader — its song
  // rows wear the project's state and its Project filter reads it — and moves no project.
  it('only the project sheet acts; the session reads a project for one thing, automatic eligibility, once per card (G1d; G82; G1e); the Library shows one (G85); no evidence, skill, eligibility or Library code reads one', () => {
    const src = join(process.cwd(), 'src');
    const readers: string[] = [];
    // Revised (G1c item 1; G84): the files that import the project stages' numbers and nothing else
    // from the store — which stages are projects, never a project row.
    const stageReaders: string[] = [];
    const actors: string[] = [];
    /** What each file imports from the store, binding by binding (`type` kept where it is written). */
    const bindings = new Map<string, string[]>();
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts')) {
          const text = readFileSync(path, 'utf8');
          const name = relative(src, path).split(sep).join('/');
          if (name === 'data/projectStore.ts') continue;
          const fromStore = text.match(/from '[./]*(data\/)?projectStore'/g) ?? [];
          const named = [...text.matchAll(/import \{([^}]*)\} from '[./]*(?:data\/)?projectStore'/g)].map((found) =>
            (found[1] ?? '').split(',').map((binding) => binding.trim()).filter((binding) => binding !== ''),
          );
          if (fromStore.length > 0) bindings.set(name, named.flat());
          const stagesOnly =
            fromStore.length > 0 && named.length === fromStore.length && named.every((names) => names.length === 1 && names[0] === 'PROJECT_STAGES');
          if (/from '[./]*projectSheet'/.test(text) || (fromStore.length > 0 && !stagesOnly)) readers.push(name);
          else if (stagesOnly) stageReaders.push(name);
          if (text.includes('applyProjectAction(')) actors.push(name);
        }
      }
    };
    walk(src);
    // The learner's action has one door: the sheet's buttons. Nothing proposes, drifts or infers.
    expect(actors).toEqual(['ui/projectSheet.ts']);
    expect(readers.sort()).toEqual([
      'curriculum/session.ts',
      'data/backup.ts',
      'ui/projectSheet.ts',
      'ui/screens/LessonScreen.ts',
      'ui/screens/LibraryScreen.ts',
      'ui/screens/ProgressScreen.ts',
      'ui/screens/ScoreScreen.ts',
      'ui/screens/SettingsScreen.ts',
      'ui/screens/TodayScreen.ts',
    ]);
    // Plan reads which stages are projects (`PROJECT_STAGES`, the one constant) and nothing else.
    expect(stageReaders.sort()).toEqual(['ui/screens/PlanScreen.ts']);
    // No evidence, skill or eligibility file imports from the store, for the stages or for a row.
    expect([...bindings.keys()].filter((name) => name.startsWith('evidence/') || /eligibility|skill/i.test(name))).toEqual([]);
    // The session: the stages, the one lookup and the row's type — nothing that opens the store (`allProjects`,
    // `projectFor`) or writes to it. It stays a function of its input; Today reads the store.
    expect(bindings.get('curriculum/session.ts')).toEqual(['PROJECT_STAGES', 'projectIn', 'type ProjectRow']);
    // And it looks a project up once, in `buildSession`: the context assembly's one predicate, which every
    // automatic chooser reads (G1e), nowhere else — not in `review()`, `repertoire()` or any other chooser.
    const session = readFileSync(join(src, 'curriculum', 'session.ts'), 'utf8');
    const lookups = [...session.matchAll(/projectIn\(/g)].map((found) => found.index);
    expect(lookups, 'the session looks a project up other than once').toHaveLength(1);
    const start = session.indexOf('\nexport function buildSession(');
    // Its own closing brace: the first `}` alone on its line after it (its return type's closes as `} {`).
    const end = start + session.slice(start).search(/\n\}\r?\n/);
    expect(start, 'buildSession() not found').toBeGreaterThan(0);
    expect(end, 'buildSession()’s end not found').toBeGreaterThan(start);
    expect(lookups[0], 'the lookup is outside buildSession()').toBeGreaterThan(start);
    expect(lookups[0], 'the lookup is outside buildSession()').toBeLessThan(end);
  });
});

// ---------------------------------------------------------------------------------------------------

describe('I performed it is the learner’s stated fact, never a performance (the reviewer’s ruling 1)', () => {
  it('it records the date on the project and manufactures no performed encounter, performance run, competence result or evidence event', async () => {
    await recordRun(runOf(SONG, file('m')), new Date(YESTERDAY));
    await applyProjectAction(MINUET, 'learn', { at: new Date(YESTERDAY) });
    const rows = await rungRows();
    const before = {
      stores: await everyOtherStore(),
      familiarity: familiarityIn({ itemId: SONG, material: file('m') }, await historyFor({ itemId: SONG, material: file('m') })),
      contact: await contact(SONG, file('m')),
      rungs: [...rungState(rows, CURRICULUM, VOCABULARY_V0, new Date(EVENING)).byRung.entries()],
      skills: [...skillLadders(rows, VOCABULARY_V0, new Date(EVENING)).entries()],
    };
    const performed = await applyProjectAction(MINUET, 'performed', { at: new Date(NOON), performedOn: '2026-09-28' });
    expect(performed).toMatchObject({ state: 'maintaining', history: [{ why: 'learn' }, { why: 'performed', performedOn: '2026-09-28' }] });
    resetProgressForTest();
    resetEncountersForTest();
    const after = await rungRows();
    expect(after.some((row: SessionRow) => row.performance === true), 'a performance run was manufactured').toBe(false);
    const facts = familiarityIn({ itemId: SONG, material: file('m') }, await historyFor({ itemId: SONG, material: file('m') }));
    expect(facts.performed, 'a performed encounter was manufactured').toBeNull();
    expect({
      stores: await everyOtherStore(),
      familiarity: facts,
      contact: await contact(SONG, file('m')),
      rungs: [...rungState(after, CURRICULUM, VOCABULARY_V0, new Date(EVENING)).byRung.entries()],
      skills: [...skillLadders(after, VOCABULARY_V0, new Date(EVENING)).entries()],
    }).toEqual(before);
  });
});

// ---------------------------------------------------------------------------------------------------

describe('the adversaries (Part 27’s five of this seam, and the brief’s two of identity)', () => {
  it('save without opening: a project, and no encounter — saved is not played, heard or viewed', async () => {
    const saved = await applyProjectAction(MINUET, 'save', { at: new Date(NOON) });
    expect(saved.state).toBe('saved');
    const db = await openDatabase();
    expect(await db?.getAll('encounters')).toEqual([]);
    expect(await db?.getAll('sessions')).toEqual([]);
    const facts = familiarityIn({ itemId: SONG, material: file('m') }, await historyFor({ itemId: SONG, material: file('m') }));
    expect([facts.viewed, facts.heard, facts.attempted]).toEqual([null, null, null]);
  });

  it('one play of an excerpt: no project', async () => {
    await recordEncounter({ kind: 'viewed', itemId: EXCERPT, material: file('e'), source: { tab: 'library' }, visit: 'v1', at: new Date(NOON) });
    await recordRun(runOf(EXCERPT, file('e'), { range: { fromMeasure: 0, toMeasure: 7 } }), new Date(NOON));
    await recordRun(runOf(SONG, file('m')), new Date(NOON));
    expect(await allProjects()).toEqual([]);
    expect(await projectFor(target(EXCERPT, file('e')))).toBeUndefined();
  });

  it('“learn this piece” before any success: a project in learning, and no evidence, pass or rung', async () => {
    const learning = await applyProjectAction(MINUET, 'learn', { at: new Date(NOON) });
    expect(learning.state).toBe('learning');
    expect(await rungRows()).toEqual([]);
    expect((await getProgress(SONG)).status).toBe('new');
    const states = rungState(await rungRows(), CURRICULUM, VOCABULARY_V0, new Date(EVENING));
    expect([...states.byRung.values()].map((reading) => reading.status)).toEqual(['not started', 'not started']);
  });

  it('pausing: the project’s history grows; no encounter, run, progress row or project line goes', async () => {
    await recordRun(runOf(SONG, file('m')), new Date(YESTERDAY));
    await recordEncounter({ kind: 'viewed', itemId: SONG, material: file('m'), source: { tab: 'library' }, visit: 'v1', at: new Date(YESTERDAY) });
    const learning = await applyProjectAction(MINUET, 'learn', { at: new Date(YESTERDAY) });
    await setProjectNotes(learning.id, { goal: 'bars 1–8' });
    await addProjectSection(learning.id, { from: 1, to: 8, label: 'A' }, 16);
    const stores = await everyOtherStore();
    const paused = await applyProjectAction(MINUET, 'pause', { at: new Date(NOON) });
    expect(paused.history).toHaveLength(2);
    expect(paused.history[0]).toEqual(learning.history[0]);
    expect(paused).toMatchObject({ state: 'paused', goal: 'bars 1–8', sections: [{ from: 1, to: 8, label: 'A' }] });
    expect(await everyOtherStore()).toEqual(stores);
  });

  it('retired two years and returned: refreshing, the whole history kept, familiarity still says played, learned pieces unchanged', async () => {
    await recordRun(runOf(SONG, file('m')), new Date(TWO_YEARS_AGO));
    const learnedBefore = learnedPieces(await allProgress(), () => false);
    await applyProjectAction(MINUET, 'learn', { at: new Date(TWO_YEARS_AGO) });
    await applyProjectAction(MINUET, 'keep', { at: new Date(A_MONTH_LATER) });
    await applyProjectAction(MINUET, 'retire', { at: new Date('2024-11-01T12:00:00.000Z') });
    const back = await applyProjectAction(MINUET, 'bring-back', { at: new Date(NOON) });
    expect(back).toMatchObject({ state: 'refreshing', since: NOON });
    expect(back.history.map((step) => step.state)).toEqual(['learning', 'maintaining', 'retired', 'refreshing']);
    const facts = familiarityIn({ itemId: SONG, material: file('m') }, await historyFor({ itemId: SONG, material: file('m') }));
    expect(facts.attempted, 'refreshing made the piece novel').toBe(TWO_YEARS_AGO);
    expect(learnedPieces(await allProgress(), () => false)).toEqual(learnedBefore);
    expect(learnedBefore.map((piece) => piece.itemId)).toEqual([SONG]);
  });

  it('a project on an import, and the same piece under two ids: one project each, by material', async () => {
    const bytes = await textIdentity('<score-partwise/>');
    await applyProjectAction(target(IMPORT, bytes), 'save', { at: new Date(NOON) });
    await applyProjectAction(target('import.again', bytes), 'learn', { at: new Date(EVENING) });
    await applyProjectAction(target(SONG, file('m')), 'save', { at: new Date(NOON) });
    await applyProjectAction(target(SONG_COPY, file('m')), 'learn', { at: new Date(EVENING) });
    const rows = await allProjects();
    expect(rows.map((row) => [row.id, row.state]).sort()).toEqual(
      [
        [materialKey(bytes, IMPORT), 'learning'],
        [materialKey(file('m'), SONG), 'learning'],
      ].sort(),
    );
  });
});
