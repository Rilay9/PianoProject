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

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id,
    type: id.startsWith('song') ? 'song' : 'exercise',
    title: id,
    level: 2.1,
    hands: 'both',
    tracks: ['core'],
    concepts: ['hands-together'],
    ...over,
  };
}

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
    item('exercise.a'),
    item('exercise.b'),
    item('exercise.c'),
    item('song.a'),
    item('song.b'),
    item('song.c'),
    item('song.import', { file: null, importHint: 'buy it', alternatives: ['exercise.vehicle'] }),
    item('exercise.vehicle', { level: 2.1 }),
    item('exercise.faraway', { level: 8.1 }),
    item('exercise.unrelated', { concepts: ['ragtime'] }),
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

  it('falls back to items at the same level sharing a concept', () => {
    const out = alternativesFor({ itemId: 'exercise.a' }, curriculum, catalog);
    const ids = out.map((i) => i.id);
    expect(ids).toContain('exercise.vehicle');
    expect(ids).not.toContain('exercise.faraway');
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
