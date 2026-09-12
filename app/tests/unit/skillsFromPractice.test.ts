// @vitest-environment jsdom
/**
 * Finishing a lesson by playing it teaches its concepts.
 *
 * `markSkill` was called in exactly one place in the whole app: the lesson
 * page's `I already know this` shortcut. So a learner who practised a rung
 * properly — passed its songs, passed its exercises, earned the `complete`
 * badge — left every one of its concepts at `unseen` for ever.
 *
 * That is worse than a missing label, because of how "rusty" works.
 * `displayState` derives it from `lastReviewedAt` and returns early for a state
 * of `unseen`, so a concept that was never marked known can never become rusty
 * either. The Skills review screen was therefore empty for anyone who actually
 * played the piano and full only for someone who had clicked the shortcut —
 * the exact opposite of who spaced review is for.
 *
 * The second half matters as much as the first: the mark must happen **once**.
 * Marking on every draw would refresh `lastReviewedAt` each time the page was
 * opened, and a timestamp that keeps moving never reaches thirty days, so the
 * screen would have no rusty skills for a different reason.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  allSkills,
  displayState,
  markLessonLearnt,
  markSkill,
  resetSkillsForTest,
} from '../../src/data/skillsStore';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

describe('a lesson finished by playing it', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetSkillsForTest();
  });

  it('marks every concept it teaches as known', async () => {
    const marked = await markLessonLearnt(['five-finger', 'steady-beat']);
    expect(marked).toEqual(['five-finger', 'steady-beat']);
    const rows = await allSkills();
    expect(rows.map((r) => r.state)).toEqual(['known', 'known']);
    clearFakeIndexedDb();
  });

  it('leaves a concept it has already marked alone', async () => {
    // The guard that keeps rusty reachable: re-marking would push
    // `lastReviewedAt` forward, and a timestamp that keeps moving never
    // reaches thirty days.
    const earlier = new Date('2026-01-01T00:00:00.000Z');
    await markSkill('five-finger', 'known', earlier);
    const marked = await markLessonLearnt(['five-finger', 'steady-beat']);
    expect(marked, 'an already-known concept was marked again').toEqual(['steady-beat']);
    const kept = (await allSkills()).find((r) => r.conceptId === 'five-finger');
    expect(kept?.lastReviewedAt).toBe(earlier.toISOString());
    clearFakeIndexedDb();
  });

  it('is silent for a lesson that teaches no named concept', async () => {
    expect(await markLessonLearnt([])).toEqual([]);
    expect(await allSkills()).toEqual([]);
    clearFakeIndexedDb();
  });

  it('rusty is unreachable from unseen, which is why marking matters', () => {
    // The real derivation, so the reasoning above cannot rot.
    const longAgo = '2020-01-01T00:00:00.000Z';
    expect(
      displayState({ conceptId: 'c', state: 'unseen', lastReviewedAt: longAgo }),
      'an unseen concept went rusty on its own, so the fix was unnecessary',
    ).toBe('unseen');
    expect(displayState({ conceptId: 'c', state: 'known', lastReviewedAt: longAgo })).toBe('rusty');
  });

  it('a concept marked today is known, and the same concept is rusty at thirty days', () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const today = { conceptId: 'c', state: 'known' as const, lastReviewedAt: now.toISOString() };
    expect(displayState(today, now)).toBe('known');
    const later = new Date(now.getTime() + 30 * 86_400_000);
    expect(displayState(today, later)).toBe('rusty');
  });
});
