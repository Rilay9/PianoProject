/**
 * The reviewer's sixth verification, as a test (C5's exit criterion, Part 8 of
 * `docs/prompts/audit-2026-09-25-outside.md`, the fourth and fifth messages):
 * **old item-completion semantics cannot contradict the evidence-derived rung
 * state.**
 *
 * Two halves. At the level of the source: the functions of the old path — a
 * count of passed items over a rung's lists (`lessonComplete`, `PassRecord`,
 * `idsToCompleteLesson`), the first rung listing an item standing in for the
 * rung that judged it (`lessonForItem`), a self-pass let through by the
 * syntax of `mastery.custom` (`paperPassAllowed`, `demandsMeasuredAccuracy`),
 * C2's interim mapping of custom terms (`requirementTerms`, `gateWaivers`) —
 * are gone, not bypassed, and the readers of rung state do not read an item's
 * pass flag. At the level of behaviour, on the built curriculum: a qualifying
 * run of an item several rungs list meets at most the rung that judged it
 * (swept over every such item), the design's two proofs hold (a pass of the
 * Petzold at 3.4 no longer completes 4.4, 4.6 or 4.7; 1.5 no longer completes
 * on two ear drills), and where the learner is comes from `rungState` alone.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { nextRecommended } from '../../src/curriculum/session';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';

const SRC = join(process.cwd(), 'src');
const CONTENT = join(process.cwd(), 'public', 'content');
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const TODAY = new Date('2026-10-10T12:00:00Z');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.ts$/.test(name)) out.push(path);
  }
  return out;
}

const rungs: Lesson[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
const byId = new Map(rungs.map((lesson) => [lesson.id, lesson]));

function run(itemId: string, lessonId: string, over: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    lessonId,
    mode: itemId.startsWith('drill.') ? 'drill:note-flash' : 'tempo',
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

describe('the old completion path is gone, not bypassed', () => {
  const GONE = [
    'lessonComplete',
    'idsToCompleteLesson',
    'PassRecord',
    'lessonForItem',
    'paperPassAllowed',
    'demandsMeasuredAccuracy',
    'requirementTerms',
    'gateWaivers',
    'exercisesRequired',
    'songsRequired',
  ];
  const files = sourceFiles(SRC);

  it.each(GONE)('no source file names %s', (name) => {
    const hits = files.filter((file) => new RegExp(`\\b${name}\\b`).test(readFileSync(file, 'utf8')));
    expect(hits.map((file) => relative(SRC, file))).toEqual([]);
  });

  it('the readers of rung state never read an item’s pass or mastery flag', () => {
    for (const file of ['evidence/rungState.ts', 'curriculum/prerequisites.ts']) {
      const text = readFileSync(join(SRC, file), 'utf8');
      expect(text, `${file} reads a progress status`).not.toMatch(/status\s*===?\s*'(passed|mastered)'/);
      expect(text, `${file} reads a progress row`).not.toMatch(/ProgressRow/);
    }
  });

  it('the first rung listing an item is prose beside a piece and nothing else: one caller, the side panel', () => {
    const callers = files.filter((file) => /\bproseRungFor\(/.test(readFileSync(file, 'utf8'))).map((file) => relative(SRC, file));
    expect(callers.sort()).toEqual([join('curriculum', 'selectors.ts'), join('ui', 'screens', 'ScoreScreen.ts')].sort());
    const score = readFileSync(join(SRC, 'ui', 'screens', 'ScoreScreen.ts'), 'utf8');
    expect(score.match(/proseRungFor\(/g)?.length, 'the Score screen reads the first listing for more than its prose').toBe(1);
    expect(score).toMatch(/judging \?\? proseRungFor\(curriculum, target\.id\)/);
  });

  it('nextRecommended is handed the derived rung state, not records', () => {
    const text = readFileSync(join(SRC, 'curriculum', 'session.ts'), 'utf8');
    const signature = /export function nextRecommended\(([\s\S]*?)\):/.exec(text)?.[1] ?? '';
    expect(signature).toMatch(/RungStates/);
    expect(signature).not.toMatch(/records/);
  });
});

describe('a run meets at most the rung that judged it, on the built curriculum', () => {
  const listings = new Map<string, string[]>();
  for (const lesson of rungs) {
    for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) {
      listings.set(id, [...(listings.get(id) ?? []), lesson.id]);
    }
  }
  const shared = [...listings].filter(([, on]) => on.length > 1);

  it('there are items several rungs list (the sweep is not empty)', () => {
    expect(shared.length).toBeGreaterThan(20);
  });

  it('for every one, a qualifying run judged by one listing rung changes no other listing rung', () => {
    const empty = rungState([], curriculum, VOCABULARY_V0, TODAY);
    const crossed: string[] = [];
    for (const [itemId, on] of shared) {
      const judge = on[0] as string;
      const after = rungState([run(itemId, judge)], curriculum, VOCABULARY_V0, TODAY);
      for (const other of on.slice(1)) {
        const before = JSON.stringify(empty.byRung.get(other)?.requirements.map((r) => [r.holds, r.have]));
        const now = JSON.stringify(after.byRung.get(other)?.requirements.map((r) => [r.holds, r.have]));
        if (before !== now || after.byRung.get(other)?.status !== empty.byRung.get(other)?.status) {
          crossed.push(`${itemId} judged by ${judge} moved ${other}`);
        }
      }
    }
    expect(crossed).toEqual([]);
  });

  it('the design’s first proof: a pass of the Petzold at 3.4 completes neither 4.4, 4.6 nor 4.7', () => {
    const petzold = 'song.classical.petzold-minuet-g-bwv-anh114';
    for (const id of ['3.4', '4.4', '4.6', '4.7']) {
      expect(byId.get(id)?.songOptions, `${id} no longer lists the Petzold`).toContain(petzold);
    }
    const states = rungState([run(petzold, '3.4')], curriculum, VOCABULARY_V0, TODAY);
    const songsOf = (id: string) =>
      states.byRung.get(id)?.requirements.find((r) => r.requirement.kind === 'runs' && r.requirement.from === 'songs');
    expect(songsOf('3.4')?.holds).toBe(true);
    for (const id of ['4.4', '4.6', '4.7']) {
      expect(songsOf(id)?.holds, id).toBe(false);
      expect(states.byRung.get(id)?.status, id).toBe('not started');
    }
  });

  it('the design’s second proof: two ear drills do not complete 1.5', () => {
    const drills = ['drill.ear.interval-2nd-3rd', 'drill.ear.simon-c-major'];
    for (const id of drills) expect(byId.get('1.5')?.exerciseOptions).toContain(id);
    const rows = [
      run('drill.ear.interval-2nd-3rd', '1.5', { mode: 'drill:ear-interval' }),
      run('drill.ear.simon-c-major', '1.5', { mode: 'drill:simon' }),
    ];
    const state = rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get('1.5');
    expect(state?.status).toBe('in progress');
    expect(state?.requirements.filter((r) => r.holds === false).map((r) => r.requirement.kind).sort()).toEqual(['reads', 'skill']);
  });

  it('where the learner is follows the evidence: the first rung not met, whatever items were passed elsewhere', () => {
    // Every option of 1.1 played at the full standard from the Library (no rung):
    // under the old count 1.1 was complete; now nothing judged it.
    const lesson11 = byId.get('1.1') as Lesson;
    const fromNowhere = [...lesson11.exerciseOptions, ...lesson11.songOptions].map((id) => ({
      ...run(id, '1.1'),
      lessonId: undefined,
    })) as SessionRow[];
    const placed = { startAt: '1.1' };
    const states = rungState(fromNowhere, curriculum, VOCABULARY_V0, TODAY);
    expect(nextRecommended(curriculum, states, ['core'], placed)?.lesson.id).toBe('1.1');
    const judged = rungState(
      [run(lesson11.exerciseOptions[3] as string, '1.1'), run(lesson11.songOptions[0] as string, '1.1')],
      curriculum,
      VOCABULARY_V0,
      TODAY,
    );
    expect(judged.byRung.get('1.1')?.status).toBe('met');
    expect(nextRecommended(curriculum, judged, ['core'], placed)?.lesson.id).toBe('1.2');
  });
});
