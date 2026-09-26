/**
 * The Skills screen reads the ladder for the skills the app can measure, and
 * never an item's pass (C5 item 6).
 *
 * `buildConcepts` promoted a concept to *learning* when any item teaching it
 * was marked passed — an item's flag standing in for a skill, and credited to
 * every concept the item names. Since C5 a concept that is a vocabulary skill
 * with an observable shows what its evidence shows (C3's ladder over every
 * current-stamp record, `rungState`'s global scope); the other concepts keep
 * the skills store's state, which C7 replaces, and no item's pass moves them.
 */
import { describe, expect, it } from 'vitest';
import { buildConcepts } from '../../src/ui/screens/SkillsScreen';
import { carriedExposures, skillLadders } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { LadderState } from '../../src/evidence/ladder';

const lesson: Lesson = {
  id: '1.3',
  title: 'Left hand',
  concepts: ['bass-clef', 'LH-C-position'],
  textFile: '',
  exerciseOptions: ['exercise.lh'],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'runs', from: 'exercises', count: 1 }],
};
const curriculum = {
  version: 1,
  tracks: [],
  stages: [{ number: 1, title: 'One', units: [{ id: 'u', title: 'U', track: 'core', lessons: [lesson] }] }],
} as unknown as Curriculum;
const items = [
  { id: 'exercise.lh', type: 'exercise', title: 'LH', level: 1, tracks: ['core'], concepts: ['bass-clef', 'LH-C-position'], file: 'x.mxl' },
] as unknown as CatalogItem[];

describe('what the Skills screen says a concept is', () => {
  it('a measurable skill shows its ladder: familiar reads as measured, practised as learning', () => {
    const familiar = buildConcepts(curriculum, items, [], new Map<string, LadderState>([['bass-clef', 'familiar']]));
    expect(familiar.find((c) => c.concept === 'bass-clef')?.state).toBe('known');
    const practised = buildConcepts(curriculum, items, [], new Map<string, LadderState>([['bass-clef', 'practised']]));
    expect(practised.find((c) => c.concept === 'bass-clef')?.state).toBe('learning');
    const none = buildConcepts(curriculum, items, [], new Map<string, LadderState>([['bass-clef', 'not introduced']]));
    expect(none.find((c) => c.concept === 'bass-clef')?.state).toBe('unseen');
  });

  // Added (C5, the coordinator's decision): the rungs carried over from before
  // C5 are an exposure of their concepts — the lesson read, the material met —
  // which is the ladder's own first state. The Skills screen says *introduced*
  // for them, never *learning* or *measured*: the carry-over is not evidence.
  // They said *never*, as if the learner had not met them.
  it('a carried rung’s concepts are introduced — an exposure on the ladder, never learning or measured', () => {
    const now = new Date('2026-10-01T10:00:00.000Z');
    const exposures = carriedExposures(curriculum, { at: '2026-09-27T08:00:00.000Z', rungs: ['1.3'] });
    expect(exposures.get('bass-clef')).toEqual(['2026-09-27T08:00:00.000Z']);
    const ladders = skillLadders([], VOCABULARY_V0, now, exposures);
    expect(ladders.get('bass-clef')?.state).toBe('introduced');
    const concepts = buildConcepts(curriculum, items, [], ladders, now, exposures);
    // A vocabulary skill, through its ladder.
    expect(concepts.find((c) => c.concept === 'bass-clef')?.state).toBe('introduced');
    // A concept the vocabulary does not measure, through the same first state.
    expect(concepts.find((c) => c.concept === 'LH-C-position')?.state).toBe('introduced');
    // Nothing carried: never met.
    const fresh = buildConcepts(curriculum, items, [], skillLadders([], VOCABULARY_V0, now), now);
    expect(fresh.find((c) => c.concept === 'LH-C-position')?.state).toBe('unseen');
    // What the learner said or showed outranks the exposure.
    const known = buildConcepts(
      curriculum,
      items,
      [{ conceptId: 'LH-C-position', state: 'known', lastReviewedAt: '2026-09-30T10:00:00.000Z' }],
      ladders,
      now,
      exposures,
    );
    expect(known.find((c) => c.concept === 'LH-C-position')?.state).toBe('known');
  });

  it('an item’s pass no longer moves a concept: there is no pass among the inputs at all', () => {
    const concepts = buildConcepts(curriculum, items, [], new Map());
    expect(concepts.find((c) => c.concept === 'LH-C-position')?.state).toBe('unseen');
    expect(buildConcepts.length, 'buildConcepts takes the items passed again').toBeLessThanOrEqual(5);
  });
});
