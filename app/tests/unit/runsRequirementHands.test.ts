// @vitest-environment jsdom
/**
 * A `runs` requirement can say how the item was played: `hands: 'both'` (A7a-hands-both-requirement;
 * the reviewer's ruling, `docs/review/responses/a7a-drafts.md` §7).
 *
 * The fact is `SessionRow.hands.played`, which the Score screen already records for every run and which skill
 * evidence already reads as the `both-hands` condition (`evidence.ts`, `CONDITION_MET`). Rung completion read
 * none of it, so a one-hand run met a requirement that means a both-hands performance. The condition is on the
 * row's `hands.played` and on nothing else: a Duet run is saved as a Keep tempo run with one hand played, and
 * fails because of that hand, not because of its tool. A requirement with no `hands` reads exactly as before.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { Curriculum, Lesson, Requirement } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';

const TODAY = new Date('2026-10-10T12:00:00Z');
const BOTH = { played: 'both' as const, appPlayed: 'none' as const };
const RIGHT = { played: 'R' as const, appPlayed: 'none' as const };
const LEFT = { played: 'L' as const, appPlayed: 'none' as const };
/** What a Duet run records: the learner's one hand, the app playing the other (`SessionRow.hands`). */
const DUET = { played: 'R' as const, appPlayed: 'other hand' as const };

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

function run(itemId: string, over: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    lessonId: 'H',
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

const H = rung('H', {
  exerciseOptions: ['ex.shuffle', 'ex.other'],
  songOptions: ['song.a'],
  requirements: [
    { kind: 'runs', from: 'exercises', items: ['ex.shuffle'], count: 1, hands: 'both' },
    { kind: 'runs', from: 'exercises', items: ['ex.other'], count: 1 },
  ],
});
const curriculum = curriculumOf([H]);
const readings = (rows: SessionRow[]) => rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('H')?.requirements;

describe('a runs requirement that says hands: both (A7a-hands-both-requirement)', () => {
  it('1. a passing run with both hands counts', () => {
    expect(readings([run('ex.shuffle', { hands: BOTH })])?.[0]).toMatchObject({ holds: true, have: 1, items: ['ex.shuffle'] });
  });

  it('2. the identical run with the left hand only does not count', () => {
    expect(readings([run('ex.shuffle', { hands: LEFT })])?.[0]).toMatchObject({ holds: false, have: 0, items: [] });
  });

  it('3. the identical run with the right hand only does not count', () => {
    expect(readings([run('ex.shuffle', { hands: RIGHT })])?.[0]).toMatchObject({ holds: false, have: 0, items: [] });
  });

  it('4. a Duet run, saved as a Keep tempo run, does not count, because of the hand it recorded', () => {
    const duet = run('ex.shuffle', { hands: DUET, mode: 'tempo', tempoMeasured: true });
    expect(readings([duet])?.[0]).toMatchObject({ holds: false, have: 0 });
    // The same row with the learner's both hands is the case that counts: the tool is not what decides.
    expect(readings([{ ...duet, hands: BOTH }])?.[0]).toMatchObject({ holds: true, have: 1 });
  });

  it('5. a row that never recorded its hands is not shown to have had both', () => {
    expect(readings([run('ex.shuffle', {})])?.[0]).toMatchObject({ holds: false, have: 0 });
  });

  it('6. the hands condition is added to the standard, never in place of it', () => {
    expect(readings([run('ex.shuffle', { hands: BOTH, accuracy: 0.5 })])?.[0], 'accuracy under the standard').toMatchObject({ holds: false });
    expect(readings([run('ex.shuffle', { hands: BOTH, tempoPct: 20 })])?.[0], 'tempo under the standard').toMatchObject({ holds: false });
    expect(readings([run('ex.shuffle', { hands: BOTH, wholeItem: false })])?.[0], 'a loop of part of it').toMatchObject({ holds: false });
  });

  it('7. a one-hand run and a later both-hands run count once; the one-hand run never blocks it', () => {
    const rows = [run('ex.shuffle', { hands: RIGHT }), run('ex.shuffle', { hands: BOTH, at: '2026-10-02T10:00:00.000Z' })];
    expect(readings(rows)?.[0]).toMatchObject({ holds: true, have: 1, items: ['ex.shuffle'] });
  });

  it('8. it composes with performance: both are required', () => {
    const P = rung('H', {
      exerciseOptions: ['ex.shuffle'],
      requirements: [{ kind: 'runs', from: 'exercises', items: ['ex.shuffle'], count: 1, performance: true, hands: 'both' }],
    });
    const read = (row: SessionRow) => rungState([row], curriculumOf([P]), VOCABULARY_V0, TODAY).byRung.get('H')?.requirements[0]?.holds;
    expect(read(run('ex.shuffle', { hands: BOTH, performance: true }))).toBe(true);
    expect(read(run('ex.shuffle', { hands: BOTH }))).toBe(false);
    expect(read(run('ex.shuffle', { hands: RIGHT, performance: true }))).toBe(false);
  });

  it('9. the rung is met only when the hands requirement holds', () => {
    const rows = [run('ex.other', {}), run('ex.shuffle', { hands: RIGHT })];
    expect(rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('H')?.status).toBe('in progress');
    const met = [run('ex.other', {}), run('ex.shuffle', { hands: BOTH })];
    expect(rungState(met, curriculum, VOCABULARY_V0, TODAY).byRung.get('H')?.status).toBe('met');
  });
});

describe('a runs requirement with no hands field reads exactly as before (A7a-hands-both-requirement)', () => {
  const L = rung('H', {
    exerciseOptions: ['ex.a'],
    requirements: [{ kind: 'runs', from: 'exercises', count: 1 }],
  });
  const read = (row: SessionRow) => rungState([row], curriculumOf([L]), VOCABULARY_V0, TODAY).byRung.get('H')?.requirements[0]?.holds;

  it('counts a one-hand, a both-hands, a Duet and a hands-less row alike', () => {
    for (const hands of [LEFT, RIGHT, BOTH, DUET, undefined]) {
      expect(read(run('ex.a', hands === undefined ? {} : { hands }))).toBe(true);
    }
  });
});

describe('no authored requirement carries hands yet (the differential)', () => {
  const dir = join(process.cwd(), '..', 'content', 'curriculum');

  /** Every requirement of every rung of every stage file, found by shape, not by the file's nesting. */
  function requirementsIn(node: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
    if (Array.isArray(node)) node.forEach((x) => requirementsIn(x, out));
    else if (node !== null && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      if (Array.isArray(obj.requirements)) for (const r of obj.requirements) out.push(r as Record<string, unknown>);
      Object.values(obj).forEach((x) => requirementsIn(x, out));
    }
    return out;
  }

  it('the stage files hold runs requirements, and none states hands', () => {
    const files = readdirSync(dir).filter((name) => /^stage-.*\.json$/.test(name));
    expect(files.length).toBeGreaterThan(5);
    const all = files.flatMap((name) => requirementsIn(JSON.parse(readFileSync(join(dir, name), 'utf8'))));
    expect(all.filter((r) => r.kind === 'runs').length).toBeGreaterThan(100);
    expect(all.filter((r) => 'hands' in r)).toEqual([]);
  });

  it('every shipped rung reads the same from rows of every hand condition', () => {
    // The authored stage files, merged: `content:build` adds nothing a rung's requirements read.
    const stages = readdirSync(dir)
      .filter((name) => /^stage-.*\.json$/.test(name))
      .flatMap((name) => (JSON.parse(readFileSync(join(dir, name), 'utf8')) as { stages: Curriculum['stages'] }).stages);
    const built: Curriculum = { ...curriculumOf([]), stages };
    const rungs = built.stages.flatMap((s) => s.units.flatMap((u) => u.lessons));
    expect(rungs.length).toBeGreaterThan(100);
    const states = (hands: SessionRow['hands']) => {
      const rows: SessionRow[] = rungs.flatMap((r) =>
        [...r.exerciseOptions, ...r.songOptions, ...(r.paperOptions ?? [])].map((id) =>
          run(id, { lessonId: r.id, ...(hands === undefined ? {} : { hands }), performance: true }),
        ),
      );
      const out = rungState(rows, built, VOCABULARY_V0, TODAY);
      return [...out.byRung].map(([id, s]) => [id, s.status, s.requirements.map((q) => [q.holds, q.have, q.need, q.items])]);
    };
    const reference = states(undefined);
    expect(states(BOTH)).toEqual(reference);
    expect(states(LEFT)).toEqual(reference);
    expect(states(RIGHT)).toEqual(reference);
    expect(states(DUET)).toEqual(reference);
  });
});
