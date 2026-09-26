/**
 * Strict prerequisites, both ways (docs/04 §7, `00` D17).
 *
 * D17 is the governing decision and the first thing tested: **nothing is
 * locked unless the owner turned gating on.** The rest is what happens when he
 * does — and, just as important, that "I already know this" is a way out,
 * because he arrived knowing some of this already.
 */
import { describe, expect, it } from 'vitest';
import { confirmMessage, lessonsById, lockState } from '../../src/curriculum/prerequisites';
import { nextRecommended } from '../../src/curriculum/session';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { rungState, type LearnerRecord, type RungStates } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

function lesson(id: string, over: Partial<Lesson> = {}): Lesson {
  return {
    id,
    title: `Lesson ${id}`,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [`exercise.${id}`],
    songOptions: [`song.${id}`],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
    requirements: [
      { kind: 'runs', from: 'exercises', count: 1 },
      { kind: 'runs', from: 'songs', count: 1 },
    ],
    ...over,
  };
}

function curriculum(lessons: Lesson[]): Curriculum {
  return {
    version: 1,
    tracks: [],
    stages: [{ number: 1, title: 'One', units: [{ id: '1.1', track: 'core', lessons }] }],
  } as unknown as Curriculum;
}

/**
 * A clean Keep tempo run of both options of each rung, opened from that rung:
 * what its requirements ask for (C5; it was two passed flags `lessonComplete`
 * counted, wherever the passes were judged).
 */
function met(lessons: Lesson[], ids: string[], learner: LearnerRecord = {}): RungStates {
  const rows: SessionRow[] = ids.flatMap((id) =>
    [`exercise.${id}`, `song.${id}`].map((itemId) => ({
      itemId,
      lessonId: id,
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 1000,
      at: '2026-10-01T10:00:00.000Z',
    })),
  );
  return rungState(rows, curriculum(lessons), VOCABULARY_V0, new Date('2026-10-02T10:00:00Z'), learner);
}

const TWO_AFTER_ONE = [lesson('1.1'), lesson('1.2', { prerequisites: ['1.1'] })];
const NONE = met(TWO_AFTER_ONE, []);

describe('gating is off by default (00 D17)', () => {
  it('never locks anything when the setting is off', () => {
    const [, second] = TWO_AFTER_ONE;
    const state = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), NONE);
    expect(state.locked).toBe(false);
    expect(state.reason).toBe('');
  });

  it('returns the same shape whether it is off or open, so a caller cannot confuse them', () => {
    const [first, second] = TWO_AFTER_ONE;
    const off = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), NONE);
    const open = lockState(first as Lesson, curriculum(TWO_AFTER_ONE), NONE, { strict: true });
    expect(off).toEqual(open);
  });
});

describe('with gating on', () => {
  const strict = { strict: true };

  it('locks a rung whose prerequisite is unfinished, and says which', () => {
    const [, second] = TWO_AFTER_ONE;
    const state = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), NONE, strict);
    expect(state.locked).toBe(true);
    expect(state.missing.map((entry) => entry.id)).toEqual(['1.1']);
    // The rung's name and not its id (T26, `00` §1): it was `1.1 Lesson 1.1`.
    expect(state.reason).toBe('Usually comes after Lesson 1.1.');
  });

  it('unlocks it once the prerequisite is met by the evidence', () => {
    const [, second] = TWO_AFTER_ONE;
    const state = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), met(TWO_AFTER_ONE, ['1.1']), strict);
    expect(state.locked).toBe(false);
  });

  it('unlocks it from "I already know this" on the prerequisite, the learner’s word about the rung', () => {
    // The escape the owner will actually use: he arrived knowing some of this.
    // Since C5 the word is kept about the rung, apart from the evidence, and
    // never as passes of its items (which unlock nothing now).
    const [, second] = TWO_AFTER_ONE;
    const said = met(TWO_AFTER_ONE, [], { words: { '1.1': { kind: 'known', at: '2026-10-01T10:00:00.000Z' } } });
    expect(lockState(second as Lesson, curriculum(TWO_AFTER_ONE), said, strict).locked).toBe(false);
    expect(said.byRung.get('1.1')?.status, 'the word met the rung').toBe('not started');
  });

  it('never locks a rung with no prerequisites', () => {
    const [first] = TWO_AFTER_ONE;
    expect(lockState(first as Lesson, curriculum(TWO_AFTER_ONE), NONE, strict).locked).toBe(false);
  });

  it('ignores a prerequisite naming a lesson that does not exist', () => {
    // A typo in the curriculum should not make a rung permanently unreachable;
    // validate.py is where that gets caught.
    const lessons = [lesson('1.1', { prerequisites: ['does-not-exist'] })];
    expect(lockState(lessons[0] as Lesson, curriculum(lessons), met(lessons, []), strict).locked).toBe(false);
  });

  it('names several missing rungs in one line', () => {
    const lessons = [
      lesson('1.1'),
      lesson('1.2'),
      lesson('1.3', { prerequisites: ['1.1', '1.2'] }),
    ];
    const state = lockState(lessons[2] as Lesson, curriculum(lessons), met(lessons, []), strict);
    expect(state.reason).toBe('Usually comes after Lesson 1.1 and Lesson 1.2.');
  });
});

describe('the confirmation', () => {
  it('says what comes first and asks once', () => {
    const [, second] = TWO_AFTER_ONE;
    const state = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), NONE, { strict: true });
    // No "are you sure": he is sure, he tapped it. The name, not the id (T26).
    expect(confirmMessage(state)).toBe('Lesson 1.1 usually comes first. Open this anyway?');
  });
});

describe('nextRecommended', () => {
  it('ignores prerequisites when gating is off', () => {
    const lessons = [lesson('1.1', { prerequisites: ['0.9'] }), lesson('1.2')];
    expect(nextRecommended(curriculum(lessons), met(lessons, []))?.lesson.id).toBe('1.1');
  });

  it('skips a locked rung for the first one he can start', () => {
    const lessons = [lesson('1.1', { prerequisites: ['1.2'] }), lesson('1.2')];
    const next = nextRecommended(curriculum(lessons), met(lessons, []), [], { strictPrerequisites: true });
    expect(next?.lesson.id).toBe('1.2');
  });

  it('recommends a locked rung rather than nothing when everything left is locked', () => {
    // An empty Today is worse than a rung with a badge on it — and this
    // happens the moment a prerequisite names something he has skipped past.
    const lessons = [lesson('1.1', { prerequisites: ['nowhere.1'] })];
    const ghostLessons = [...lessons, lesson('nowhere.1')];
    const next = nextRecommended(curriculum(ghostLessons), met(ghostLessons, ['nowhere.1']), [], {
      strictPrerequisites: true,
    });
    expect(next?.lesson.id).toBe('1.1');

    const locked = [lesson('1.1', { prerequisites: ['1.2'] }), lesson('1.2', { prerequisites: ['1.1'] })];
    expect(nextRecommended(curriculum(locked), met(locked, []), [], { strictPrerequisites: true })?.lesson.id).toBe('1.1');
  });
});

describe('lessonsById', () => {
  it('indexes every lesson in the curriculum', () => {
    const index = lessonsById(curriculum(TWO_AFTER_ONE));
    expect([...index.keys()]).toEqual(['1.1', '1.2']);
  });
});
