// @vitest-environment jsdom
/**
 * One path from evidence to rung state (C5; the test inventory's Q6 row
 * `rungStateFromEvidence`, the reviewer's exit criterion for C5).
 *
 * `rungState` reads the stored rows and nothing else — no item flag, no pass
 * count, no listing — and says, per rung, met / in progress / not started, with
 * each requirement and what the evidence shows for it. Two scopes, the
 * reviewer's clarification of 2026-09-27:
 *
 * - **skill evidence is the learner's everywhere**: a `skill` requirement reads
 *   the ladder over every current-stamp evidence record, whichever rung the run
 *   was judged by, or none;
 * - **the decision that a rung's requirement is met by a run is the judging
 *   rung's**: a `runs` or `reads` requirement counts only runs whose record names
 *   that rung (`SessionRow.lessonId`), each re-judged under that rung's standard,
 *   and never an item's pass: playing an item two rungs list meets at most the
 *   one that judged it.
 *
 * The rows for pieces are written as the Score screen writes them (the fields
 * `recordRun` keeps); the reads are generated, played through the real engine
 * and evidenced as the app does it (`helpers/reader.ts`).
 */
import { describe, expect, it } from 'vitest';
import { rungState, type RungStates } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { EVIDENCE_DEFINITIONS } from '../../src/evidence/evidence';
import { sightReadingOptionsFor } from '../../src/engine/sightReading';
import type { CatalogItem, Curriculum, Lesson, Requirement } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { overlayShelf } from '../../src/curriculum/load';
import type { ShelfPiece } from '../../src/data/booksStore';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPhrase } from './helpers/reader';

const TODAY = new Date('2026-10-10T12:00:00Z');

function rung(id: string, over: Partial<Lesson> & { requirements: Requirement[] }): Lesson {
  return {
    id,
    title: `Rung ${id}`,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [],
    songOptions: [],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
    ...over,
  };
}

function curriculumOf(lessons: Lesson[]): Curriculum {
  return {
    version: 1,
    tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
    stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: 'u1', title: 'Unit', track: 'core', lessons }] }],
  };
}

/** A run as the Score screen hands it to the store, less what the store drops. */
function run(itemId: string, over: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    at: '2026-10-01T10:00:00.000Z',
    ...over,
  };
}

const A = rung('A', {
  exerciseOptions: ['ex.a', 'ex.shared'],
  songOptions: ['song.a'],
  requirements: [
    { kind: 'runs', from: 'exercises', count: 1 },
    { kind: 'runs', from: 'songs', count: 1 },
  ],
});
/** Lists `ex.shared` too, and asks more of a run. */
const B = rung('B', {
  exerciseOptions: ['ex.shared', 'ex.b'],
  songOptions: ['song.b'],
  mastery: { minAccuracy: 0.97, minTempoPct: 0.8 },
  requirements: [
    { kind: 'runs', from: 'exercises', count: 1 },
    { kind: 'runs', from: 'songs', count: 1 },
  ],
});
const U = rung('U', {
  exerciseOptions: ['ex.u'],
  requirements: [{ kind: 'unjudged', rule: 'method-applied', says: 'Use the method on a passage of your own.', why: 'no run records which method was used' }],
});

const CURRICULUM = curriculumOf([A, B, U]);

function stateOf(rows: SessionRow[], states?: RungStates): RungStates {
  return states ?? rungState(rows, CURRICULUM, VOCABULARY_V0, TODAY);
}

describe('the three states, from the rows alone', () => {
  it('not started: nothing judged by the rung, nothing for its skills', () => {
    const state = stateOf([]).byRung.get('A');
    expect(state?.status).toBe('not started');
    expect(state?.requirements.map((r) => r.holds)).toEqual([false, false]);
  });

  it('in progress: one requirement holds, and the page can say which', () => {
    const state = stateOf([run('ex.a', { lessonId: 'A' })]).byRung.get('A');
    expect(state?.status).toBe('in progress');
    expect(state?.requirements.map((r) => r.holds)).toEqual([true, false]);
    expect(state?.requirements[0]?.items).toEqual(['ex.a']);
  });

  it('met: every requirement the app can judge holds', () => {
    const state = stateOf([run('ex.a', { lessonId: 'A' }), run('song.a', { lessonId: 'A' })]).byRung.get('A');
    expect(state?.status).toBe('met');
  });
});

describe('met by evidence, never by a count', () => {
  it('a run nothing opened from the rung meets nothing, however good (no rung judged it)', () => {
    const rows = [run('ex.a'), run('song.a'), run('ex.a', { at: '2026-10-02T10:00:00.000Z' })];
    expect(stateOf(rows).byRung.get('A')?.status).toBe('not started');
  });

  it('each run is judged under the rung’s own standard, re-read from what it measured', () => {
    // 93 % meets A (90 %) and not B (97 %).
    expect(stateOf([run('ex.b', { lessonId: 'B', accuracy: 0.93 })]).byRung.get('B')?.requirements[0]?.holds).toBe(false);
    expect(stateOf([run('ex.a', { lessonId: 'A', accuracy: 0.93 })]).byRung.get('A')?.requirements[0]?.holds).toBe(true);
    // Below the rung's tempo, or in Wait with a tempo asked: not a qualifying run.
    expect(stateOf([run('ex.a', { lessonId: 'A', tempoPct: 70 })]).byRung.get('A')?.requirements[0]?.holds).toBe(false);
    expect(
      stateOf([run('ex.a', { lessonId: 'A', mode: 'wait', tempoMeasured: false })]).byRung.get('A')?.requirements[0]?.holds,
    ).toBe(false);
  });

  it('what a run did not measure is not a qualifying run: nothing heard, rhythm only, a phrase met before', () => {
    const rows = [
      run('ex.a', { lessonId: 'A', accuracy: 'not measured', selfReport: 'clean' }),
      run('ex.a', { lessonId: 'A', rhythmOnly: true }),
      run('ex.a', { lessonId: 'A', unseen: false }),
    ];
    expect(stateOf(rows).byRung.get('A')?.requirements[0]?.holds).toBe(false);
  });

  it('two runs of one item are one item: distinct items are what a count of runs means', () => {
    const two = rung('T', {
      exerciseOptions: ['ex.1', 'ex.2'],
      requirements: [{ kind: 'runs', from: 'exercises', count: 2 }],
    });
    const rows = [run('ex.1', { lessonId: 'T' }), run('ex.1', { lessonId: 'T', at: '2026-10-02T10:00:00.000Z' })];
    const state = rungState(rows, curriculumOf([two]), VOCABULARY_V0, TODAY).byRung.get('T');
    expect(state?.requirements[0]).toMatchObject({ holds: false, have: 1, need: 2 });
  });
});

describe('two rungs listing one item', () => {
  it('a run judged by A meets A’s requirement and not B’s, although B lists the item too', () => {
    const states = stateOf([run('ex.shared', { lessonId: 'A' })]);
    expect(states.byRung.get('A')?.requirements[0]?.holds).toBe(true);
    expect(states.byRung.get('B')?.requirements[0]?.holds).toBe(false);
    expect(states.byRung.get('B')?.status).toBe('not started');
  });

  it('and the same run judged by B is B’s, under B’s 97 %', () => {
    const states = stateOf([run('ex.shared', { lessonId: 'B', accuracy: 0.98 })]);
    expect(states.byRung.get('B')?.requirements[0]?.holds).toBe(true);
    expect(states.byRung.get('A')?.requirements[0]?.holds).toBe(false);
  });
});

// Added (C5, the reviewer's boundary defect 1): a `done` requirement read the
// item's rows across the whole history and took any with nothing left undone,
// where `runs`, `reads` and `measure` read only the runs the rung judged. The
// built curriculum's `done` items are each listed by one rung, so it was not a
// live cross-rung credit — but it broke the invariant: the decision that a run
// meets a rung's requirement is the judging rung's. The rung here and its twin
// list one checklist between them, which the build gate forbids and a
// constructed curriculum can do.
describe('a done requirement is the judging rung’s, like the other kinds', () => {
  const D = rung('D', {
    exerciseOptions: ['drill.check'],
    mastery: { minAccuracy: 0, minTempoPct: 0 },
    requirements: [{ kind: 'done', item: 'drill.check' }],
  });
  const E = rung('E', { exerciseOptions: ['drill.check'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] });
  const M = rung('M', {
    exerciseOptions: ['drill.check'],
    mastery: { minAccuracy: 0.9, minTempoPct: 0 },
    requirements: [{ kind: 'done', item: 'drill.check' }],
  });
  const twins = curriculumOf([D, E, M]);
  const finished = (over: Partial<SessionRow> = {}): SessionRow =>
    run('drill.check', { mode: 'drill:checklist', accuracy: 'not measured', tempoMeasured: false, missed: 0, ...over });
  const doneOf = (rows: SessionRow[], id: string) => rungState(rows, twins, VOCABULARY_V0, TODAY).byRung.get(id);

  it('finished from nowhere, it meets no rung', () => {
    expect(doneOf([finished()], 'D')?.requirements[0]?.holds, 'a run nothing opened from the rung met its done').toBe(false);
    expect(doneOf([finished()], 'D')?.status).toBe('not started');
  });

  it('finished from the other rung that lists it, it meets that rung’s nothing and this rung’s nothing', () => {
    expect(doneOf([finished({ lessonId: 'E' })], 'D')?.requirements[0]?.holds, 'a run judged by E met D’s done').toBe(false);
  });

  it('finished from the rung, it meets it; left with something undone, it does not', () => {
    expect(doneOf([finished({ lessonId: 'D' })], 'D')?.status).toBe('met');
    expect(doneOf([finished({ lessonId: 'D', missed: 2 })], 'D')?.requirements[0]?.holds).toBe(false);
  });

  it('where the run measured an accuracy, it is judged at the rung’s standard', () => {
    expect(doneOf([finished({ lessonId: 'M', accuracy: 0.5 })], 'M')?.requirements[0]?.holds).toBe(false);
    expect(doneOf([finished({ lessonId: 'M', accuracy: 0.95 })], 'M')?.requirements[0]?.holds).toBe(true);
    expect(doneOf([finished({ lessonId: 'M' })], 'M')?.requirements[0]?.holds, 'a completion that measured nothing').toBe(true);
  });
});

// Added (CL04, L79): a shelf twin's run counted only where the twin was itself
// one of the rung's songs (`poolOf` read the listed ids), so a book piece the
// rung lists, practised with its score from the rung, met nothing. The twin
// inherits the rung's listing of its book piece: one run, one item, the rung's
// judgement, and nothing for a run no rung or another rung judged.
describe('a shelf twin’s run counts as the book piece the rung lists (L79)', () => {
  const L = rung('L', {
    songOptions: ['song.l'],
    requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
  });
  const L2 = rung('L2', {
    songOptions: ['song.l'],
    requirements: [{ kind: 'runs', from: 'songs', count: 2 }],
  });
  /** Another rung, which does not list the book piece. */
  const K = rung('K', { songOptions: ['song.k'], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] });
  const shelfPiece = (twin: string | undefined, lessonIds: string[]): ShelfPiece => ({
    book: { id: 'book.b', title: 'Method Book', kind: 'method', pieces: [], addedAt: '' },
    piece: { id: 'p', title: 'Study No. 3', lessonIds, concepts: [], levelSource: 'estimated', ...(twin === undefined ? {} : { itemId: twin }) },
    itemId: 'book.b/p',
  });
  const stateWith = (twin: string, rows: SessionRow[], lessons: Lesson[] = [L, K], on = ['L']): RungStates =>
    rungState(rows, overlayShelf(curriculumOf(lessons), [shelfPiece(twin, on)]), VOCABULARY_V0, TODAY);

  it('a measured run of the twin judged by the rung meets its songs requirement, as the book piece', () => {
    const state = stateWith('import.t', [run('import.t', { lessonId: 'L' })]).byRung.get('L');
    expect(state?.requirements[0]).toMatchObject({ holds: true, have: 1, items: ['book.b/p'] });
    expect(state?.status).toBe('met');
  });

  it('judged by no rung, or by a rung that does not list the book piece, it meets nothing', () => {
    const nowhere = stateWith('import.t', [run('import.t')]);
    expect(nowhere.byRung.get('L')?.requirements[0]).toMatchObject({ holds: false, have: 0, items: [] });
    const elsewhere = stateWith('import.t', [run('import.t', { lessonId: 'K' })]);
    expect(elsewhere.byRung.get('L')?.requirements[0]).toMatchObject({ holds: false, have: 0 });
    expect(elsewhere.byRung.get('K')?.requirements[0]).toMatchObject({ holds: false, have: 0 });
  });

  it('a twin that is itself one of the rung’s songs is one item: counted under its own id only', () => {
    const state = stateWith('song.l', [run('song.l', { lessonId: 'L2' })], [L2], ['L2']).byRung.get('L2');
    expect(state?.requirements[0]).toMatchObject({ holds: false, have: 1, need: 2, items: ['song.l'] });
  });

  it('under the rung’s own standard, like any run: 80 % does not meet 90 %', () => {
    expect(stateWith('import.t', [run('import.t', { lessonId: 'L', accuracy: 0.8 })]).byRung.get('L')?.requirements[0]?.holds).toBe(false);
  });

  it('the paper run itself, the learner’s own answer, still meets nothing', () => {
    const paper = run('book.b/p', { lessonId: 'L', mode: 'paper', tempoPct: 1, accuracy: 0, accuracyEstimated: true, selfReport: 'clean' });
    expect(stateWith('import.t', [paper]).byRung.get('L')?.requirements[0]).toMatchObject({ holds: false, have: 0 });
  });
});

describe('a rung the app cannot judge', () => {
  it('is never met by the app, and says so; the learner’s word is kept apart and meets nothing', () => {
    const state = stateOf([run('ex.u', { lessonId: 'U' })]).byRung.get('U');
    expect(state?.judged).toBe(false);
    expect(state?.status).not.toBe('met');
    expect(state?.requirements[0]?.holds).toBe('unjudged');
    const said = rungState([], CURRICULUM, VOCABULARY_V0, TODAY, {
      words: { U: { kind: 'done', at: '2026-10-03T10:00:00.000Z' }, A: { kind: 'known', at: '2026-10-03T10:00:00.000Z' } },
    });
    expect(said.byRung.get('U')?.word?.kind).toBe('done');
    expect(said.byRung.get('U')?.status).not.toBe('met');
    expect(said.byRung.get('A')?.status, 'the learner’s word met a requirement').toBe('not started');
  });
});

describe('the setting “require 2 songs per lesson” (docs/04 §7)', () => {
  it('asks a second song of a rung that has two, and of no song-optional rung', () => {
    const twoSongs = rung('S', {
      exerciseOptions: ['ex.s'],
      songOptions: ['song.1', 'song.2'],
      requirements: [
        { kind: 'runs', from: 'exercises', count: 1 },
        { kind: 'runs', from: 'songs', count: 1 },
      ],
    });
    const rows = [run('ex.s', { lessonId: 'S' }), run('song.1', { lessonId: 'S' })];
    const curriculum = curriculumOf([twoSongs]);
    expect(rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('S')?.status).toBe('met');
    expect(rungState(rows, curriculum, VOCABULARY_V0, TODAY, { requireTwoSongs: true }).byRung.get('S')?.status).toBe('in progress');
    const withSecond = [...rows, run('song.2', { lessonId: 'S' })];
    expect(rungState(withSecond, curriculum, VOCABULARY_V0, TODAY, { requireTwoSongs: true }).byRung.get('S')?.status).toBe('met');
  });

  it('never asks a song of a rung whose skill no song tests, nor a second song of a rung that has one', () => {
    const optional = rung('O', {
      songOptional: true,
      exerciseOptions: ['ex.1', 'ex.2'],
      requirements: [{ kind: 'runs', from: 'exercises', count: 2 }],
    });
    const one = rung('N', {
      exerciseOptions: ['ex.n'],
      songOptions: ['song.only'],
      requirements: [
        { kind: 'runs', from: 'exercises', count: 1 },
        { kind: 'runs', from: 'songs', count: 1 },
      ],
    });
    const curriculum = curriculumOf([optional, one]);
    const rows = [run('ex.1', { lessonId: 'O' }), run('ex.2', { lessonId: 'O' }), run('ex.n', { lessonId: 'N' }), run('song.only', { lessonId: 'N' })];
    const states = rungState(rows, curriculum, VOCABULARY_V0, TODAY, { requireTwoSongs: true });
    expect(states.byRung.get('O')?.status).toBe('met');
    expect(states.byRung.get('N')?.status).toBe('met');
  });
});

describe('skill evidence is the learner’s everywhere; the reads a rung asks for are its own', () => {
  const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8')) as CatalogItem[];
  const row1 = catalog.find((item) => item.id === 'drill.reading.sight-reading-1') as CatalogItem;
  const R = rung('R', {
    exerciseOptions: [row1.id],
    requirements: [
      { kind: 'skill', skill: 'interval-reading', state: 'familiar' },
      { kind: 'reads', skill: 'sight-reading', standard: 'full', share: 0.9, count: 2 },
    ],
  });
  /** Another rung listing the same reading row. */
  const Q = rung('Q', { exerciseOptions: [row1.id], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] });
  const curriculum = curriculumOf([R, Q]);

  async function reads(lessonId: string | undefined, seeds: number[]): Promise<SessionRow[]> {
    const out: SessionRow[] = [];
    for (const [i, seed] of seeds.entries()) {
      const { row } = await readPhrase({
        item: row1,
        options: sightReadingOptionsFor(row1.drill?.params ?? {}, seed),
        at: `2026-10-0${String(i + 1)}T10:00:00.000Z`,
      });
      out.push({ ...row, id: seed, ...(lessonId === undefined ? {} : { lessonId }) });
    }
    return out;
  }

  it('a read judged by another rung makes R’s skill hold, and none of R’s reads', async () => {
    const rows = await reads('Q', [11, 12]);
    const state = rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('R');
    expect(state?.requirements[0]).toMatchObject({ holds: true });
    expect(['familiar', 'proficient', 'transfer demonstrated', 'retained', 'mastered']).toContain(state?.requirements[0]?.state);
    expect(state?.requirements[1]).toMatchObject({ holds: false, have: 0, need: 2 });
    expect(state?.status).toBe('in progress');
  });

  it('two first readings judged by R meet its reads, and R is met', async () => {
    const rows = await reads('R', [11, 12]);
    const state = rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('R');
    expect(state?.requirements[1]).toMatchObject({ holds: true, have: 2, need: 2 });
    expect(state?.status).toBe('met');
  });

  it('evidence stamped with other definitions contributes nothing until it is recomputed', async () => {
    const rows = (await reads('R', [11, 12])).map((row) => ({ ...row, evidenceDefinitions: EVIDENCE_DEFINITIONS - 1 }));
    const state = rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('R');
    expect(state?.requirements.map((r) => r.holds)).toEqual([false, false]);
  });
});

// Added (RG1; FABLE §6; the reviewer's ruling, docs/review/responses/6e7475c1.md §5): a named
// `runs` requirement checked item, performance and standard and never what the run covered, so a
// four-bar loop at the pass pair completed a rung whose required item was the whole cut. The Score
// screen now writes `wholeItem` (`coversWholeItem`, proved in `wholeItemRun.test.ts` and through the
// screen in `observationsFromRun.test.ts`); here the requirement reads it. `range` alone is no
// loop flag: every judged run carries one, the whole piece's included.
describe('a named runs requirement counts a run of the whole item (RG1)', () => {
  const CUT = 'excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh';
  const PARENT = 'song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx';
  const N = rung('N', {
    exerciseOptions: ['scale.c', 'scale.g', 'drill.ear'],
    songOptions: [CUT, PARENT, 'song.n'],
    requirements: [
      { kind: 'runs', from: 'exercises', items: ['scale.c', 'scale.g'], count: 2 },
      { kind: 'runs', from: 'songs', items: [CUT], count: 1 },
      { kind: 'runs', from: 'exercises', items: ['drill.ear'], count: 1 },
      { kind: 'runs', from: 'songs', count: 1 },
    ],
  });
  const curriculum = curriculumOf([N]);
  const readingsOf = (rows: SessionRow[]) => rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('N')?.requirements;
  /** A Keep tempo run at the pass pair, judged by N, as the Score screen writes it since RG1. */
  const at = (itemId: string, over: Partial<SessionRow>): SessionRow => run(itemId, { lessonId: 'N', ...over });
  const whole = { range: { fromMeasure: 0, toMeasure: 3 }, wholeItem: true };
  const loop = { range: { fromMeasure: 1, toMeasure: 2 }, wholeItem: false };

  it('1. a normal full-item run counts', () => {
    expect(readingsOf([at('scale.c', whole)])?.[0]).toMatchObject({ have: 1, items: ['scale.c'] });
  });

  it('2. a passing partial loop does not count toward the whole-item requirement', () => {
    expect(readingsOf([at('scale.c', loop)])?.[0], 'a loop over bars 2–3 at the pass pair counted').toMatchObject({ have: 0, items: [] });
    expect(readingsOf([at('scale.c', loop), at('scale.g', loop)])?.[0]?.holds, 'two partial loops met the rung').toBe(false);
  });

  it('3. a partial loop and a later full run count once', () => {
    const later = { at: '2026-10-02T10:00:00.000Z' };
    expect(readingsOf([at('scale.c', loop), at('scale.c', { ...whole, ...later })])?.[0]).toMatchObject({ have: 1, need: 2, items: ['scale.c'] });
    expect(readingsOf([at('scale.c', loop), at('scale.c', { ...whole, ...later }), at('scale.g', whole)])?.[0]).toMatchObject({
      holds: true,
      have: 2,
      items: ['scale.c', 'scale.g'],
    });
  });

  it('4. a loop whose bars take in the whole item counts: the evidence covers the item although Loop was used', () => {
    // The ladder's loop over every bar (`?ladder=1`): `wholeItem` is true from the step span
    // (`wholeItemRun.test.ts` case 4), and the requirement counts it like a run without Loop.
    expect(readingsOf([at('scale.c', whole), at('scale.g', whole)])?.[0]).toMatchObject({ holds: true, items: ['scale.c', 'scale.g'] });
  });

  it('5. the left-hand Bizet cut counts when its entire cut is covered: the cut is the item, not the parent', () => {
    const lh = { hands: { played: 'L' as const, appPlayed: 'none' as const } };
    expect(readingsOf([at(CUT, { ...whole, ...lh })])?.[1], 'the whole cut, left hand').toMatchObject({ holds: true, items: [CUT] });
    expect(readingsOf([at(CUT, { ...loop, ...lh })])?.[1], 'part of the cut').toMatchObject({ holds: false, have: 0 });
    // The parent's bars 1–12 played from the parent are a run of the parent, partial there, and
    // never the cut: excerpt identity is the item id, unchanged.
    const parentBars = { range: { fromMeasure: 0, toMeasure: 11 }, wholeItem: false };
    expect(readingsOf([at(PARENT, parentBars)])?.[1], 'the parent’s bars 1–12').toMatchObject({ holds: false, have: 0 });
    expect(readingsOf([at(PARENT, whole)])?.[1], 'the whole parent').toMatchObject({ holds: false, have: 0 });
  });

  it('6. drills and the other requirement kinds read nothing of it, as before', () => {
    // A drill made when it opens has no range and no `wholeItem` (the drill screens write neither).
    const drill = at('drill.ear', { mode: 'drill:ear', tempoMeasured: false, accuracy: 0.95 });
    expect(readingsOf([drill])?.[2], 'a named drill').toMatchObject({ holds: true, items: ['drill.ear'] });
    // An unnamed pool reads no `wholeItem`: RG1 is the named requirement's, and the brief keeps it there.
    expect(readingsOf([at('song.n', loop)])?.[3], 'an unnamed songs requirement').toMatchObject({ holds: true, items: ['song.n'] });
    // `done` and `measure` read their own fields only.
    const D = rung('D', {
      exerciseOptions: ['drill.check', 'ex.staccato'],
      mastery: { minAccuracy: 0, minTempoPct: 0 },
      requirements: [
        { kind: 'done', item: 'drill.check' },
        { kind: 'measure', measure: 'articulation' },
      ],
    });
    const rows = [
      run('drill.check', { lessonId: 'D', mode: 'drill:checklist', accuracy: 'not measured', tempoMeasured: false, missed: 0, ...loop }),
      run('ex.staccato', { lessonId: 'D', technique: { kind: 'articulation', result: 'met', judged: 8 }, ...loop }),
    ];
    expect(rungState(rows, curriculumOf([D]), VOCABULARY_V0, TODAY).byRung.get('D')?.requirements.map((r) => r.holds)).toEqual([true, true]);
  });

  it('7. legacy rows, written before the fact, count as they always did', () => {
    // No `wholeItem`: the row does not say, and the rule it was written under counted it. A
    // ranged legacy row is not read as partial: `range` was written on whole runs too.
    expect(readingsOf([at('scale.c', {})])?.[0], 'a row from before C1, no range').toMatchObject({ have: 1, items: ['scale.c'] });
    expect(readingsOf([at('scale.c', { range: { fromMeasure: 1, toMeasure: 2 } })])?.[0], 'a C1 row with a range').toMatchObject({
      have: 1,
      items: ['scale.c'],
    });
    expect(readingsOf([at(CUT, { range: { fromMeasure: 0, toMeasure: 11 } })])?.[1]?.holds, 'a legacy run of the cut').toBe(true);
  });
});
