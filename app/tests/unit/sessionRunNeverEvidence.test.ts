/**
 * Session completion, skipping and adaptation are never evidence (X1 item 1; Part 18: "session completion is
 * never competence evidence"; Part 27's governing invariant — session state says what today's plan is doing,
 * and substitutes for no other layer).
 *
 * - **No reader**: nothing under `src/evidence/`, and neither `progressStore.ts` nor `rungStates.ts`, imports
 *   the session record's module or the runner, or names its key.
 * - **No effect**: a whole session run over a learner with stored runs — every activity opened, one completed
 *   at the full standard (the easy-success skip), one failed and moved on from, the rest skipped, the session
 *   ended — leaves the stored runs, the progress rows, the rung state and the skills' ladder states exactly as
 *   they were. A mutant that writes a completed activity into the runs is caught here
 *   (`docs/prompts/runs/X1/mutant-*.txt`).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { applySessionEvent, newRun, resetSessionRunForTest, startSessionRun, type Expected, type SessionRun } from '../../src/data/sessionRun';
import { allProgress, dayKey, recordRun, resetProgressForTest, rungRows } from '../../src/data/progressStore';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { ladderState } from '../../src/evidence/ladder';
import { storedEvidence } from '../../src/evidence/readingState';
import type { Curriculum } from '../../src/curriculum/types';
import type { RunResult } from '../../src/data/progressStore';

const SRC = join(process.cwd(), 'src');
const CONTENT = join(process.cwd(), 'public', 'content');

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? filesUnder(join(dir, entry.name)) : entry.name.endsWith('.ts') ? [join(dir, entry.name)] : []));
}

describe('no evidence, rung-state or progress reader reads the session record', () => {
  it('none imports the record’s module or the runner, or names its key', () => {
    const readers = [...filesUnder(join(SRC, 'evidence')), join(SRC, 'data', 'progressStore.ts'), join(SRC, 'data', 'rungStates.ts')];
    const offending = readers.filter((file) => /sessionRun|sessionRunner|pianopath\.sessionRun/.test(readFileSync(file, 'utf8')));
    expect(readers.length).toBeGreaterThan(5);
    expect(offending).toEqual([]);
  });
});

describe('a whole session changes no run, progress row, rung state or ladder state', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetSessionRunForTest();
    resetProgressForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
  const run = (itemId: string, passed: boolean, at: string): RunResult =>
    ({
      itemId,
      lessonId: '1.1',
      mode: 'tempo',
      tempoPct: 100,
      accuracy: passed ? 1 : 0.5,
      accuracyEstimated: false,
      wrongNotes: passed ? 0 : 4,
      missed: passed ? 0 : 4,
      durationMs: 30_000,
      passed,
      masterEligible: passed,
      tempoMeasured: true,
      at,
    }) as unknown as RunResult;

  const JUDGED = new Date(Date.now() + 60_000);
  async function snapshot(): Promise<string> {
    const rows = await rungRows();
    const progress = await allProgress();
    const states = rungState(rows, curriculum, VOCABULARY_V0, JUDGED);
    const evidence = rows.flatMap(storedEvidence);
    const ladders = VOCABULARY_V0.skills.map((skill) => ladderState({ evidence: evidence.filter((one) => one.skill === skill.id), today: JUDGED }));
    return JSON.stringify({ rows, progress, states: [...states.byRung.entries()], ladders });
  }

  it('start, open, attempt, complete (at the full standard, and a failure), move on, skip and end: identical before and after', async () => {
    await recordRun(run('song.folk.hot-cross-buns', true, new Date(Date.now() - 86_400_000).toISOString()));
    await recordRun(run('drill.technique.five-finger-rh', false, new Date(Date.now() - 3_600_000).toISOString()));
    const before = await snapshot();

    const today = dayKey(new Date());
    let r: SessionRun = await startSessionRun(
      newRun({
        day: today,
        sessionId: 'nevere01',
        version: 'v',
        startedAt: new Date().toISOString(),
        activities: [
          { order: 0, token: 'never001', slot: { kind: 'technique', itemId: 'drill.technique.five-finger-rh', title: 'Five', minutes: 5, claim: { kind: 'ready', demand: 'interval.step' } }, route: { target: 'drill', itemId: 'drill.technique.five-finger-rh', rung: '1.1' }, reason: 'r' },
          { order: 1, token: 'never002', slot: { kind: 'review', itemId: 'exercise.five-finger.c-major.right', title: 'Ex', minutes: 5, claim: { kind: 'demand', demand: 'interval.step' } }, route: { target: 'score', itemId: 'exercise.five-finger.c-major.right' }, reason: 'r' },
          { order: 2, token: 'never003', slot: { kind: 'new', itemId: 'song.folk.hot-cross-buns', title: 'HCB', minutes: 10 }, route: { target: 'score', itemId: 'song.folk.hot-cross-buns', rung: '1.1' }, reason: 'r' },
          { order: 3, token: 'never004', slot: { kind: 'repertoire', itemId: 'song.folk.mary-had-a-little-lamb', title: 'Mary', minutes: 7 }, route: { target: 'score', itemId: 'song.folk.mary-had-a-little-lamb' }, reason: 'r' },
        ],
        outside: [],
      }),
    );
    const step = async (token: string, event: Parameters<typeof applySessionEvent>[1]): Promise<void> => {
      const expected: Expected = { sessionId: r.sessionId, version: r.version, token };
      const result = await applySessionEvent(expected, event);
      if (!result.ok) throw new Error(`${event.kind}: ${result.why}`);
      r = result.run;
    };
    await step('never001', { kind: 'opened' });
    await step('never001', { kind: 'attempted' });
    await step('never001', { kind: 'accrue', ms: 30_000 });
    await step('never001', { kind: 'completed', outcome: 'passed-full' });
    expect(r.activities[1]?.state).toBe('skipped');
    await step('never003', { kind: 'opened' });
    await step('never003', { kind: 'completed', outcome: 'failed' });
    await step('never003', { kind: 'advance' });
    await step('never004', { kind: 'end' });
    expect(r.closed?.why).toBe('ended');

    expect(await snapshot()).toBe(before);
  });
});
