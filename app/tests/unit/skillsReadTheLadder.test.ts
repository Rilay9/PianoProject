/**
 * The Skills screen reads the ladder for the skills the app can measure, and
 * never an item's pass (C5 item 6); since C7, nothing else (item 1).
 *
 * `buildConcepts` promoted a concept to *learning* when any item teaching it
 * was marked passed — an item's flag standing in for a skill, and credited to
 * every concept the item names. Since C5 a concept that is a vocabulary skill
 * with an observable shows what its evidence shows (C3's ladder over every
 * current-stamp record, `rungState`'s global scope). C5 left the other
 * concepts on the skills store's state; C7 retired the store's state, so they
 * say the app does not judge them, and no item's pass or stored row moves
 * them.
 */
import { describe, expect, it } from 'vitest';
import { buildConcepts } from '../../src/ui/screens/SkillsScreen';
import { carriedExposures, skillLadders } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { LadderReading, LadderState } from '../../src/evidence/ladder';

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

function ladder(state: LadderState, notShownRecently = false): Map<string, Pick<LadderReading, 'state' | 'notShownRecently'>> {
  return new Map([['bass-clef', { state, notShownRecently }]]);
}

describe('what the Skills screen says a concept is', () => {
  // Revised (C7): the ladder's own states, not C5's five-way mapping onto the
  // store's words (familiar and above read *measured*, practised *learning*,
  // not introduced *never*). One state, the ladder's, said as the ladder says it.
  it('a measurable skill shows its ladder state as the ladder reads it', () => {
    expect(buildConcepts(curriculum, items, ladder('familiar')).find((c) => c.concept === 'bass-clef')?.state).toBe('familiar');
    expect(buildConcepts(curriculum, items, ladder('practised')).find((c) => c.concept === 'bass-clef')?.state).toBe('practised');
    expect(buildConcepts(curriculum, items, ladder('not introduced')).find((c) => c.concept === 'bass-clef')?.state).toBe('not introduced');
    const stale = buildConcepts(curriculum, items, ladder('proficient', true)).find((c) => c.concept === 'bass-clef');
    expect(stale?.state, 'time alone lowered the state').toBe('proficient');
    expect(stale?.rusty).toBe(true);
  });

  // Added (C5, the coordinator's decision): the rungs carried over from before
  // C5 are an exposure of their concepts — the lesson read, the material met —
  // which is the ladder's own first state. Revised (C7): only for a skill the
  // app measures; a concept it does not is *not judged*, whatever was carried.
  it('a carried rung’s measurable concepts are introduced — an exposure on the ladder — and the rest are not judged', () => {
    const now = new Date('2026-10-01T10:00:00.000Z');
    const exposures = carriedExposures(curriculum, { at: '2026-09-27T08:00:00.000Z', rungs: ['1.3'] });
    expect(exposures.get('bass-clef')).toEqual(['2026-09-27T08:00:00.000Z']);
    const ladders = skillLadders([], VOCABULARY_V0, now, exposures);
    expect(ladders.get('bass-clef')?.state).toBe('introduced');
    const concepts = buildConcepts(curriculum, items, ladders);
    expect(concepts.find((c) => c.concept === 'bass-clef')?.state).toBe('introduced');
    expect(concepts.find((c) => c.concept === 'LH-C-position')?.state).toBe('not judged');
  });

  // Replaced (C7): "what the learner said or showed outranks the exposure" —
  // a stored `known` row put a concept the app cannot measure at *measured*.
  // The old assumption was that the store's row was a state; it was the
  // learner's word or a page's mark. The word is now shown beside the
  // concept, and the state is the ladder's or *not judged*.
  it('the learner’s word rides beside the concept and never changes its state', () => {
    const concepts = buildConcepts(curriculum, items, ladder('not introduced'), {
      words: { '1.3': { kind: 'known', at: '2026-09-30T10:00:00.000Z' } },
    });
    const bass = concepts.find((c) => c.concept === 'bass-clef');
    expect(bass?.state).toBe('not introduced');
    expect(bass?.word?.kind).toBe('known');
    expect(concepts.find((c) => c.concept === 'LH-C-position')?.state).toBe('not judged');
  });

  it('an item’s pass no longer moves a concept: there is no pass among the inputs at all', () => {
    const concepts = buildConcepts(curriculum, items, new Map());
    expect(concepts.find((c) => c.concept === 'LH-C-position')?.state).toBe('not judged');
    expect(concepts.find((c) => c.concept === 'bass-clef')?.state, 'a skill with no reading was given one').toBe('not judged');
    expect(buildConcepts.length, 'buildConcepts takes the items passed again').toBeLessThanOrEqual(4);
  });
});
