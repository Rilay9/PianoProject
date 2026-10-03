/**
 * docs/02 Part G as amended by docs/00 D21, and the "swap this" query behind docs/04 §2.
 */
import { describe, expect, it } from 'vitest';
import {
  alternativesFor,
  indexCatalog,
  thinLessons,
  type CatalogItem,
  type Curriculum,
  type Lesson,
} from '../../src/curriculum';
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { Learner } from '../../src/curriculum/eligibility';
import { measured } from './helpers/measured';

// Revised (E0): every constructed item carries a measurement — steps and both hands
// together, provided at a useful density — because the one gate offers nothing whose
// demands are unknown as equivalent practice (an item with no record is unmeasured).
function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id,
    type: id.startsWith('song') ? 'song' : 'exercise',
    title: id,
    level: 2.1,
    hands: 'both',
    tracks: ['core'],
    concepts: ['hands-together'],
    ...measured(['interval.step', 'texture.hands-together']),
    ...over,
  };
}

/** A learner on 2.1: steps and hands together taught. */
const ON_2_1: Learner = { taught: (demand) => ['interval.step', 'texture.hands-together', 'clef.bass'].includes(demand) };

function lesson(over: Partial<Lesson> = {}): Lesson {
  return {
    id: '2.1',
    title: 'Hands together',
    concepts: [],
    textFile: 'lessons/2.1.md',
    exerciseOptions: ['exercise.a', 'exercise.b', 'exercise.c'],
    songOptions: ['song.a', 'song.b', 'song.c'],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
    ...over,
  };
}

function curriculumOf(...lessons: Lesson[]): Curriculum {
  return {
    version: 1,
    tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
    stages: [
      {
        number: 2,
        title: 'Two hands',
        summary: '',
        units: [{ id: '2.1', title: 'Unit', track: 'core', lessons }],
      },
    ],
  };
}

// Deleted (C5): the `lessonComplete` cases — a rung complete when enough of its
// listed items carried a passed flag, wherever the pass was judged. A rung is
// met by the evidence its requirements name now: `rungStateFromEvidence.test.ts`
// (the three states, met by evidence and never by a count, two rungs listing
// one item) and `noCompletionBesideTheEvidence.test.ts` (the function is gone).

describe('alternativesFor', () => {
  const catalog = indexCatalog([
    item('exercise.a', { targetSkills: ['hands-together'] }),
    item('exercise.b'),
    item('exercise.c'),
    item('song.a'),
    item('song.b'),
    item('song.c'),
    item('song.import', { file: null, importHint: 'buy it', alternatives: ['exercise.vehicle'] }),
    item('exercise.vehicle', { level: 2.1, targetSkills: ['hands-together'] }),
    item('exercise.faraway', { level: 8.1, targetSkills: ['hands-together'] }),
    // Shares the concept tag every item here carries, and a step, and nothing else.
    item('exercise.unrelated', { concepts: ['hands-together'], ...measured(['interval.step']) }),
  ]);
  const curriculum = curriculumOf(lesson());

  it('offers the rest of the lesson first', () => {
    const out = alternativesFor({ itemId: 'exercise.a', lessonId: '2.1' }, curriculum, catalog);
    expect(out.slice(0, 5).map((i) => i.id)).toEqual([
      'exercise.b',
      'exercise.c',
      'song.a',
      'song.b',
      'song.c',
    ]);
  });

  it('never offers the item you are replacing', () => {
    const out = alternativesFor({ itemId: 'exercise.a', lessonId: '2.1' }, curriculum, catalog);
    expect(out.map((i) => i.id)).not.toContain('exercise.a');
  });

  it('drops songs when asked, which is the "not a song" filter', () => {
    const out = alternativesFor(
      { itemId: 'exercise.a', lessonId: '2.1', excludeSongs: true },
      curriculum,
      catalog,
    );
    expect(out.every((i) => i.type !== 'song')).toBe(true);
  });

  it('gives an un-imported song something to point at', () => {
    const out = alternativesFor({ itemId: 'song.import' }, curriculum, catalog);
    expect(out.at(0)?.id).toBe('exercise.vehicle');
  });

  // Replaced (C6, L36): "falls back to items at the same level sharing a concept" — within half a
  // level, any shared concept tag, which for a quarried piece was the `repertoire` tag every PDMX
  // item carries. The tier is a shared target skill now, nearest level first (an order, not a
  // window: `swapOptions` leaves out what the learner's lessons have not taught), and a shared
  // concept tag alone matches nothing (`alternativesShareASkill.test.ts`).
  // Revised (E0): the skill tier needs a learner to judge readiness by, and the candidate's
  // notes to provide the skill's opportunity; old assumption: overlap of declared skills.
  it('falls back to items sharing a target skill, the nearest level first; a shared concept tag matches nothing', () => {
    // Constructed exercises declaring a skill: activated here, deliberately (D0).
    const out = alternativesFor({ itemId: 'exercise.a' }, curriculum, catalog, EVERY_DECLARED_SKILL, ON_2_1);
    const ids = out.map((i) => i.id);
    expect(ids).toContain('exercise.vehicle');
    expect(ids.indexOf('exercise.vehicle')).toBeLessThan(ids.indexOf('exercise.faraway'));
    expect(ids).not.toContain('exercise.unrelated');
  });

  it('skips what is already in the session', () => {
    const out = alternativesFor(
      { itemId: 'exercise.a', lessonId: '2.1', exclude: ['exercise.b'] },
      curriculum,
      catalog,
    );
    expect(out.map((i) => i.id)).not.toContain('exercise.b');
  });

  it('never returns the same item twice', () => {
    const out = alternativesFor({ itemId: 'exercise.a', lessonId: '2.1' }, curriculum, catalog);
    expect(new Set(out.map((i) => i.id)).size).toBe(out.length);
  });

  it('honours the limit', () => {
    const out = alternativesFor({ itemId: 'exercise.a', lessonId: '2.1', limit: 2 }, curriculum, catalog);
    expect(out).toHaveLength(2);
  });
});

describe('thinLessons', () => {
  it('is empty for a full curriculum', () => {
    expect(thinLessons(curriculumOf(lesson()))).toEqual([]);
  });

  it('finds a lesson with too few songs', () => {
    const thin = thinLessons(curriculumOf(lesson({ songOptions: ['song.a'] })));
    expect(thin.map((l) => l.id)).toEqual(['2.1']);
  });

  it('ignores an exempt lesson', () => {
    const l = lesson({ exerciseOptions: ['exercise.a'], songOptions: [], optionsExempt: true });
    expect(thinLessons(curriculumOf(l))).toEqual([]);
  });

  it('counts both lists for a song-optional lesson', () => {
    const l = lesson({ songOptional: true, songOptions: [] });
    expect(thinLessons(curriculumOf(l))).toEqual([]);
  });
});

// Replaced (C5): "require 2 songs per lesson" is read by \`rungState\` now, on
// the rung's songs requirement (\`rungStateFromEvidence.test.ts\`, the setting's
// three cases); \`idsToCompleteLesson\` is deleted with the item passes it
// marked — the learner's word is kept about the rung (\`lessonPageReadsTheEvidence\`).
