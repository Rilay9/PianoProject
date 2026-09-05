/**
 * docs/02 Part G as amended by docs/00 D21, and the "swap this" query behind docs/04 §2.
 */
import { describe, expect, it } from 'vitest';
import {
  alternativesFor,
  idsToCompleteLesson,
  indexCatalog,
  lessonComplete,
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
    mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
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

const passes = (...ids: string[]) => ids.map((itemId) => ({ itemId, passed: true }));

describe('lessonComplete', () => {
  it('needs an exercise and a song by default', () => {
    expect(lessonComplete(lesson(), passes('exercise.a'))).toBe(false);
    expect(lessonComplete(lesson(), passes('song.a'))).toBe(false);
    expect(lessonComplete(lesson(), passes('exercise.a', 'song.a'))).toBe(true);
  });

  it('ignores passes on items the lesson does not offer', () => {
    expect(lessonComplete(lesson(), passes('exercise.elsewhere', 'song.a'))).toBe(false);
  });

  it('lets a song-optional lesson finish on two exercises', () => {
    const l = lesson({ songOptional: true });
    expect(lessonComplete(l, passes('exercise.a'))).toBe(false);
    expect(lessonComplete(l, passes('exercise.a', 'exercise.b'))).toBe(true);
  });

  it('still accepts a song on a song-optional lesson', () => {
    const l = lesson({ songOptional: true });
    expect(lessonComplete(l, passes('exercise.a', 'song.a'))).toBe(true);
  });

  it('does not let a song-optional lesson skip the exercise floor', () => {
    const l = lesson({
      songOptional: true,
      mastery: { exercisesRequired: 2, songsRequired: 0, minAccuracy: 0.9, minTempoPct: 0.8 },
    });
    expect(lessonComplete(l, passes('exercise.a', 'song.a', 'song.b'))).toBe(false);
    expect(lessonComplete(l, passes('exercise.a', 'exercise.b'))).toBe(true);
  });

  it('counts a failed attempt as not passed', () => {
    const records = [
      { itemId: 'exercise.a', passed: false },
      { itemId: 'song.a', passed: true },
    ];
    expect(lessonComplete(lesson(), records)).toBe(false);
  });
});

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

describe('require 2 songs per lesson (docs/04 §7)', () => {
  const strict = { requireTwoSongs: true };

  it('is off by default: one exercise and one song complete a lesson', () => {
    const unit = lesson({
      exerciseOptions: ['ex.1', 'ex.2', 'ex.3'],
      songOptions: ['song.1', 'song.2', 'song.3'],
      mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
    });
    const records = [
      { itemId: 'ex.1', passed: true },
      { itemId: 'song.1', passed: true },
    ];
    expect(lessonComplete(unit, records)).toBe(true);
    expect(lessonComplete(unit, records, strict)).toBe(false);
    expect(lessonComplete(unit, [...records, { itemId: 'song.2', passed: true }], strict)).toBe(
      true,
    );
  });

  it('never applies to a lesson whose skill no song tests', () => {
    const unit = lesson({
      songOptional: true,
      exerciseOptions: ['ex.1', 'ex.2', 'ex.3'],
      songOptions: [],
      mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
    });
    const records = [
      { itemId: 'ex.1', passed: true },
      { itemId: 'ex.2', passed: true },
    ];
    expect(lessonComplete(unit, records, strict)).toBe(true);
  });

  it('does not demand a second song a lesson does not have', () => {
    const unit = lesson({
      exerciseOptions: ['ex.1'],
      songOptions: ['song.1'],
      mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
    });
    const records = [
      { itemId: 'ex.1', passed: true },
      { itemId: 'song.1', passed: true },
    ];
    expect(lessonComplete(unit, records, strict)).toBe(true);
  });

  it('idsToCompleteLesson returns exactly what lessonComplete checks for', () => {
    const unit = lesson({
      exerciseOptions: ['ex.1', 'ex.2'],
      songOptions: ['song.1', 'song.2'],
      mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
    });
    for (const options of [{}, strict]) {
      const ids = idsToCompleteLesson(unit, options);
      const records = ids.map((itemId) => ({ itemId, passed: true }));
      expect(lessonComplete(unit, records, options)).toBe(true);
    }
  });
});
