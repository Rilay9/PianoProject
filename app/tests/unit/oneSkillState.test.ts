/**
 * One skill state, the ladder's (C7 item 1).
 *
 * After C5 the Skills screen read the ladder for the vocabulary's skills and
 * the skills store for every other concept, and the store kept its own truth
 * — `unseen`, `learning`, `known` — written by the lesson page when a rung
 * was met (`markLessonLearnt`) and by *I already know this* (`markSkill`), and
 * read with a calendar (`displayState`, `RUSTY_AFTER_DAYS`). Two definitions
 * of what a learner knows. C7 deletes the store's writers rather than
 * bypassing them: a run changes what the learner knows only through the
 * evidence it stores, the ladder reads that evidence, and the Skills screen
 * shows what the ladder reads. The store is kept only as the retired rows'
 * exposures (`legacySkillsAreExposures.test.ts`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase } from '../../src/data/db';
import { recordRun, resetProgressForTest, rungRows, sessionsTidied, type RunResult } from '../../src/data/progressStore';
import { learnerExposures, skillMoves } from '../../src/data/skillsStore';
import { skillMoveWords } from '../../src/ui/help';
import type { SessionRow } from '../../src/data/db';
import { skillLadders } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { buildConcepts } from '../../src/ui/screens/SkillsScreen';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import { BADLY, daysAfter, readRow } from './helpers/skillEvidence';

const SRC = resolve('src');

function sourceFiles(dir: string = SRC): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith('.ts') ? [path] : [];
  });
}

/** The files in `app/src` whose code (comments stripped) matches. */
function naming(pattern: RegExp): string[] {
  return sourceFiles()
    .filter((path) => {
      const code = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      return pattern.test(code);
    })
    .map((path) => relative(SRC, path).replace(/\\/g, '/'));
}

const RUNG: Lesson = {
  id: '1.5',
  title: 'Steps and skips',
  concepts: ['interval-reading', 'sight-reading', 'steps'],
  textFile: 'lessons/1.5.md',
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'unjudged', rule: 'custom', says: 'The lesson’s rule.', why: 'No run can show it.' }],
};
const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: '1.5', title: 'Unit', track: 'core', lessons: [RUNG] }] }],
};

describe('the store’s writers are gone, not bypassed', () => {
  it('no file in app/src names the store’s writers, its states or its calendar', () => {
    expect(naming(/\b(markSkill|markLessonLearnt|displayState|RUSTY_AFTER_DAYS|allSkills)\b/)).toEqual([]);
  });

  it('only the retired rows’ migration writes the skills store', () => {
    expect(naming(/\b(put|add|delete)\(\s*'skills'/)).toEqual([]);
    expect(naming(/transaction\(\s*'skills'\s*,\s*'readwrite'/)).toEqual(['data/skillsStore.ts']);
  });
});

describe('a run moves the ladder and nothing else', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
  });

  it('one first reading, recorded as every run is, moves the skills it evidences and writes no skill state anywhere', async () => {
    const today = new Date('2026-10-03T18:00:00');
    const before = skillLadders(await rungRows(), VOCABULARY_V0, today, await learnerExposures(CURRICULUM, {}, today));

    const row = readRow('2026-10-03T10:00:00.000Z', { lessonId: '1.5' });
    await recordRun({ ...(row as unknown as RunResult), passed: true, masterEligible: false }, new Date(row.at));
    await sessionsTidied();

    const after = skillLadders(await rungRows(), VOCABULARY_V0, today, await learnerExposures(CURRICULUM, {}, today));
    const moved = [...after].filter(([skill, reading]) => reading.state !== before.get(skill)?.state).map(([skill, reading]) => `${skill}: ${reading.state}`);
    expect(moved.sort()).toEqual(['interval-reading: familiar', 'sight-reading: familiar']);

    const db = await openDatabase();
    expect(await db?.count('skills'), 'a run wrote the retired skills store').toBe(0);

    // The Skills screen shows exactly that state, and nothing for the concept the vocabulary does not measure.
    const concepts = buildConcepts(CURRICULUM, [], after);
    expect(concepts.find((entry) => entry.concept === 'interval-reading')?.state).toBe('familiar');
    expect(concepts.find((entry) => entry.concept === 'sight-reading')?.state).toBe('familiar');
    expect(concepts.find((entry) => entry.concept === 'steps')?.state).toBe('not judged');
  });
});

describe('Progress reads the same state: which skills moved in the last weeks, and how', () => {
  const today = new Date('2026-11-02T12:00:00');
  const at = (days: number): string => daysAfter(today, days);
  const words = (rows: SessionRow[], exposures = new Map<string, string[]>()): Record<string, string> =>
    Object.fromEntries(skillMoves(rows, VOCABULARY_V0, today, exposures).map((move) => [`${move.skill} ${move.kind}`, skillMoveWords(move, today)]));

  it('a step up the ladder inside the window, in the Skills screen’s words', () => {
    expect(words([readRow(at(-10), { skills: ['interval-reading'] }), readRow(at(-3), { skills: ['interval-reading'] })])).toEqual({
      'interval-reading up': 'not shown yet → proficient',
    });
  });

  it('an exposure is not competence: a retired store row carried over in the window moves nothing', () => {
    expect(words([], new Map([['interval-reading', [at(-2)]]]))).toEqual({});
  });

  it('a step down, with how long since the evidence last supported it', () => {
    const rows = [
      readRow(at(-60), { skills: ['sight-reading'] }),
      readRow(at(-55), { skills: ['sight-reading'] }),
      readRow(at(-5), { skills: ['sight-reading'], wrong: BADLY }),
      readRow(at(-4), { skills: ['sight-reading'], wrong: BADLY }),
    ];
    expect(words(rows)).toEqual({ 'sight-reading down': 'proficient → familiar · not shown in 7 weeks' });
  });

  it('gone unshown for the retention span, and shown again after one: the state stays what the evidence supports', () => {
    expect(words([readRow(at(-30), { skills: ['interval-reading'] })])).toEqual({ 'interval-reading unshown': 'familiar · not shown in 4 weeks' });
    // The second read with the keys guide on: the practice standard, so it shows the skill again without a second full-standard day.
    expect(words([readRow(at(-60), { skills: ['interval-reading'] }), readRow(at(-2), { skills: ['interval-reading'], guide: 'next' })])).toEqual({
      'interval-reading shown again': 'familiar · shown again',
    });
  });

  it('lists steps up first, then down, then the unshown', () => {
    const rows = [
      readRow(at(-30), { skills: ['sight-reading'] }),
      readRow(at(-10), { skills: ['interval-reading'] }),
    ];
    expect(skillMoves(rows, VOCABULARY_V0, today).map((move) => move.kind)).toEqual(['up', 'unshown']);
  });
});
