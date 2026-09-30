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
import { carriedExposures, rungState, skillLadders } from '../../src/evidence/rungState';
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

  // Added (CL04, G70): `carriedExposures` read a carried rung's `concepts`
  // alone, so what its lesson `introduces` — a measurable concept met on the
  // page while no piece on the rung practises it yet (`docs/02`, F2) — was no
  // exposure. An introduction is an exposure: introduced, and nothing more.
  describe('a carried rung’s introductions are exposures (G70)', () => {
    const now = new Date('2026-10-01T10:00:00.000Z');
    const carriedAt = '2026-09-27T08:00:00.000Z';
    /** As `blues.5` stands in the stage file (`stage-5.json`): the walking bass introduced, not taught. */
    const blues5: Lesson = {
      id: 'blues.5',
      title: 'Turnarounds, blue notes and walking bass',
      concepts: ['turnaround', 'tremolo-thirds', 'blue-note', 'crushed-note', 'call-and-response'],
      introduces: ['walking-bass'],
      textFile: '',
      exerciseOptions: ['drill.blues.lh-patterns'],
      songOptions: [],
      mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
      requirements: [{ kind: 'runs', from: 'exercises', count: 1 }],
    };
    /** As `3.1` stands (`stage-3.json`): accidentals introduced; 3.3, whose options establish them, names them. */
    const rung31: Lesson = {
      id: '3.1',
      title: 'Sharps, flats and the major scale formula',
      concepts: ['sharps', 'flats', 'major-scale-formula', 'key-signature'],
      introduces: ['accidentals'],
      textFile: '',
      exerciseOptions: ['exercise.scale.g'],
      songOptions: ['song.g'],
      mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
      requirements: [
        { kind: 'runs', from: 'exercises', count: 1 },
        { kind: 'runs', from: 'songs', count: 1 },
      ],
    };
    const rung33: Lesson = {
      id: '3.3',
      title: 'Minor keys',
      concepts: ['accidentals'],
      textFile: '',
      exerciseOptions: ['exercise.minor'],
      songOptions: [],
      mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
      requirements: [{ kind: 'skill', skill: 'accidentals', state: 'familiar' }],
    };
    const of = (lessons: Lesson[]): Curriculum =>
      ({ version: 1, tracks: [], stages: [{ number: 3, title: 'Three', units: [{ id: 'u', title: 'U', track: 'core', lessons }] }] }) as unknown as Curriculum;

    it('blues.5 carried: the walking bass it introduces is in the map, dated the day it was carried', () => {
      const exposures = carriedExposures(of([blues5]), { at: carriedAt, rungs: ['blues.5'] });
      expect(exposures.get('walking-bass')).toEqual([carriedAt]);
      expect(exposures.get('turnaround')).toEqual([carriedAt]);
    });

    it('3.1 carried and 3.3 not: accidentals read introduced on the ladder and on the Skills list; neither rung is met by it', () => {
      const curriculum31 = of([rung31, rung33]);
      const exposures = carriedExposures(curriculum31, { at: carriedAt, rungs: ['3.1'] });
      expect(exposures.get('accidentals')).toEqual([carriedAt]);
      const ladders = skillLadders([], VOCABULARY_V0, now, exposures);
      expect(ladders.get('accidentals')?.state).toBe('introduced');
      const concepts = buildConcepts(curriculum31, [], ladders);
      expect(concepts.find((c) => c.concept === 'accidentals')?.state).toBe('introduced');
      // An exposure is no evidence: the carried rung stays carried and unmet, and 3.3's skill requirement unheld.
      const states = rungState([], curriculum31, VOCABULARY_V0, now, { carried: ['3.1'] });
      expect(states.byRung.get('3.1')).toMatchObject({ status: 'not started', carried: true });
      expect(states.byRung.get('3.3')?.requirements[0]).toMatchObject({ holds: false, have: 0, state: 'not introduced' });
    });

    it('a concept a carried rung both names and introduces is one exposure, one date', () => {
      const twice: Lesson = { ...rung31, id: '3.1b', concepts: ['accidentals'], introduces: ['accidentals'] };
      expect(carriedExposures(of([twice]), { at: carriedAt, rungs: ['3.1b'] }).get('accidentals')).toEqual([carriedAt]);
    });
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
