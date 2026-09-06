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
import type { Curriculum, Lesson, PassRecord } from '../../src/curriculum/types';

function lesson(id: string, over: Partial<Lesson> = {}): Lesson {
  return {
    id,
    title: `Lesson ${id}`,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [`exercise.${id}`],
    songOptions: [`song.${id}`],
    mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
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

/** Passing both options of a lesson is what `lessonComplete` wants. */
function passed(...ids: string[]): PassRecord[] {
  return ids.flatMap((id) => [
    { itemId: `exercise.${id}`, passed: true },
    { itemId: `song.${id}`, passed: true },
  ]);
}

const TWO_AFTER_ONE = [lesson('1.1'), lesson('1.2', { prerequisites: ['1.1'] })];

describe('gating is off by default (00 D17)', () => {
  it('never locks anything when the setting is off', () => {
    const [, second] = TWO_AFTER_ONE;
    const state = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), []);
    expect(state.locked).toBe(false);
    expect(state.reason).toBe('');
  });

  it('returns the same shape whether it is off or open, so a caller cannot confuse them', () => {
    const [first, second] = TWO_AFTER_ONE;
    const off = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), []);
    const open = lockState(first as Lesson, curriculum(TWO_AFTER_ONE), [], { strict: true });
    expect(off).toEqual(open);
  });
});

describe('with gating on', () => {
  const strict = { strict: true };

  it('locks a rung whose prerequisite is unfinished, and says which', () => {
    const [, second] = TWO_AFTER_ONE;
    const state = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), [], strict);
    expect(state.locked).toBe(true);
    expect(state.missing.map((entry) => entry.id)).toEqual(['1.1']);
    expect(state.reason).toBe('Usually comes after 1.1 Lesson 1.1.');
  });

  it('unlocks it once the prerequisite is complete', () => {
    const [, second] = TWO_AFTER_ONE;
    const state = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), passed('1.1'), strict);
    expect(state.locked).toBe(false);
  });

  it('unlocks it from "I already know this", which is a self-pass', () => {
    // The escape the owner will actually use: he arrived knowing some of this,
    // and a self-pass is a pass everywhere else in the app.
    const [, second] = TWO_AFTER_ONE;
    const records: PassRecord[] = [
      { itemId: 'exercise.1.1', passed: true, selfPassed: true },
      { itemId: 'song.1.1', passed: true, selfPassed: true },
    ];
    expect(lockState(second as Lesson, curriculum(TWO_AFTER_ONE), records, strict).locked).toBe(
      false,
    );
  });

  it('never locks a rung with no prerequisites', () => {
    const [first] = TWO_AFTER_ONE;
    expect(lockState(first as Lesson, curriculum(TWO_AFTER_ONE), [], strict).locked).toBe(false);
  });

  it('ignores a prerequisite naming a lesson that does not exist', () => {
    // A typo in the curriculum should not make a rung permanently unreachable;
    // validate.py is where that gets caught.
    const lessons = [lesson('1.1', { prerequisites: ['does-not-exist'] })];
    expect(lockState(lessons[0] as Lesson, curriculum(lessons), [], strict).locked).toBe(false);
  });

  it('names several missing rungs in one line', () => {
    const lessons = [
      lesson('1.1'),
      lesson('1.2'),
      lesson('1.3', { prerequisites: ['1.1', '1.2'] }),
    ];
    const state = lockState(lessons[2] as Lesson, curriculum(lessons), [], strict);
    expect(state.reason).toBe('Usually comes after 1.1 Lesson 1.1 and 1.2 Lesson 1.2.');
  });
});

describe('the confirmation', () => {
  it('says what comes first and asks once', () => {
    const [, second] = TWO_AFTER_ONE;
    const state = lockState(second as Lesson, curriculum(TWO_AFTER_ONE), [], { strict: true });
    // No "are you sure": he is sure, he tapped it.
    expect(confirmMessage(state)).toBe('1.1 Lesson 1.1 usually comes first. Open this anyway?');
  });
});

describe('nextRecommended', () => {
  it('ignores prerequisites when gating is off', () => {
    const lessons = [lesson('1.1', { prerequisites: ['0.9'] }), lesson('1.2')];
    expect(nextRecommended(curriculum(lessons), [])?.lesson.id).toBe('1.1');
  });

  it('skips a locked rung for the first one he can start', () => {
    const lessons = [lesson('1.1', { prerequisites: ['1.2'] }), lesson('1.2')];
    const next = nextRecommended(curriculum(lessons), [], [], { strictPrerequisites: true });
    expect(next?.lesson.id).toBe('1.2');
  });

  it('recommends a locked rung rather than nothing when everything left is locked', () => {
    // An empty Today is worse than a rung with a badge on it — and this
    // happens the moment a prerequisite names something he has skipped past.
    const lessons = [lesson('1.1', { prerequisites: ['nowhere.1'] })];
    const withGhost = curriculum([...lessons, lesson('nowhere.1')]);
    const next = nextRecommended(withGhost, passed('nowhere.1'), [], {
      strictPrerequisites: true,
    });
    expect(next?.lesson.id).toBe('1.1');

    const allLocked = curriculum([lesson('1.1', { prerequisites: ['1.2'] }), lesson('1.2', { prerequisites: ['1.1'] })]);
    expect(nextRecommended(allLocked, [], [], { strictPrerequisites: true })?.lesson.id).toBe('1.1');
  });
});

describe('lessonsById', () => {
  it('indexes every lesson in the curriculum', () => {
    const index = lessonsById(curriculum(TWO_AFTER_ONE));
    expect([...index.keys()]).toEqual(['1.1', '1.2']);
  });
});
