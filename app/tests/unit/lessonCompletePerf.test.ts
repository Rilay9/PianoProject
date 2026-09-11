/**
 * `lessonComplete` rebuilds two Sets over the whole progress history on every
 * call (`docs/handoff-2026-09-09.md` §5j, `curriculum/selectors.ts:52-67`).
 * `passedIds(records)` and the self-pass set are loop-invariant over
 * `records` — nothing about which lesson is being checked changes them — but
 * `nextRecommended` calls `lessonComplete` once per lesson across all 93, and
 * Plan's `draw()` reaches that path several times a redraw and on every stage
 * expand and track reorder. At a few hundred progress rows that was ~250,000
 * Set insertions per draw.
 *
 * This does not time the call — a duration assertion would be flaky on a
 * loaded CI box — it counts how many times `records` is walked. Before the
 * fix, checking N lessons against the same `records` array walks it 2*N
 * times (once for `passedIds`, once for the self-pass set, every call).
 * After it, the same `records` array is walked exactly twice no matter how
 * many lessons are checked against it, because the two Sets are hoisted once
 * per array and reused.
 */
import { describe, expect, it, vi } from 'vitest';
import { lessonComplete } from '../../src/curriculum';
import type { Lesson, PassRecord } from '../../src/curriculum/types';

function lesson(id: string): Lesson {
  return {
    id,
    title: id,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: ['exercise.a'],
    songOptions: ['song.a'],
    mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
  };
}

const LESSON_COUNT = 93; // roughly the size of the real curriculum

describe('lessonComplete over a shared records array', () => {
  it('walks the records array a constant number of times, not once per lesson', () => {
    const records: PassRecord[] = [
      { itemId: 'exercise.a', passed: true },
      { itemId: 'song.a', passed: true, selfPassed: true },
    ];
    const filterSpy = vi.spyOn(records, 'filter');

    const lessons = Array.from({ length: LESSON_COUNT }, (_, i) => lesson(`lesson.${String(i)}`));
    for (const l of lessons) lessonComplete(l, records, {});

    // Before the fix this is 2 * LESSON_COUNT (186): `passedIds` and the
    // self-pass set are rebuilt from `records` on every single call. Hoisted,
    // it is 2 regardless of how many lessons share the same array.
    expect(filterSpy.mock.calls.length).toBeLessThanOrEqual(2);
    expect(filterSpy.mock.calls.length).toBeLessThan(LESSON_COUNT);
  });

  it('still answers correctly for two different records arrays, not a stale cached one', () => {
    const l = lesson('lesson.x');
    const notDone: PassRecord[] = [{ itemId: 'exercise.a', passed: true }];
    const done: PassRecord[] = [
      { itemId: 'exercise.a', passed: true },
      { itemId: 'song.a', passed: true },
    ];
    expect(lessonComplete(l, notDone, {})).toBe(false);
    expect(lessonComplete(l, done, {})).toBe(true);
    // And the first array, checked again, must not have picked up anything
    // from the second by way of a shared cache.
    expect(lessonComplete(l, notDone, {})).toBe(false);
  });
});
