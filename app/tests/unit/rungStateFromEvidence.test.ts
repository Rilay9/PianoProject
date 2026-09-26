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
