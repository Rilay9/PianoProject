/**
 * The rung's shortfall, counted at runtime (P19 A2, review C3).
 *
 * The pair to keep in step is `lessonShortfall` here and `write_needs` in
 * `tools/content/validate.py`. The floor comes from the build; the counting is
 * the same three lines in both, and the second test below is the one that
 * matters — it is the case the build cannot see, because the import did not
 * exist when the build ran.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTION_FLOOR, lessonShortfall } from '../../src/curriculum/needs';
import { overlayImports } from '../../src/curriculum/load';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

function lesson(over: Partial<Lesson> = {}): Lesson {
  return {
    id: '2.1',
    title: 'A rung',
    concepts: [],
    textFile: 'lessons/2.1.md',
    exerciseOptions: ['exercise.a', 'exercise.b', 'exercise.c'],
    songOptions: ['song.a', 'song.b'],
    mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
    needs: { songs: 1, exercises: 0, paper: 0, inBand: 0, floor: 3 },
    ...over,
  };
}

describe('lessonShortfall', () => {
  it('counts what the rung has now, not what the build recorded', () => {
    // The build wrote songs: 1. Two songs are here, so it still wants one.
    expect(lessonShortfall(lesson())).toEqual({ songs: 1, exercises: 0, floor: 3 });
  });

  it('says nothing is short once the rung is at the floor', () => {
    const full = lesson({ songOptions: ['song.a', 'song.b', 'song.c'] });
    expect(lessonShortfall(full)).toEqual({ songs: 0, exercises: 0, floor: 3 });
  });

  it('counts both lists together on a song-optional rung, and reports exercises', () => {
    // `write_needs` does the same: shortness is a property of the pair, so a
    // rung no public-domain standard fits is not told to find three songs.
    const optional = lesson({
      songOptional: true,
      songOptions: [],
      exerciseOptions: ['exercise.a', 'exercise.b'],
      needs: { songs: 0, exercises: 1, paper: 0, inBand: 0, floor: 3 },
    });
    expect(lessonShortfall(optional)).toEqual({ songs: 0, exercises: 1, floor: 3 });
  });

  it('is never short on an exempt rung — the placement test is one thing by nature', () => {
    const exempt = lesson({ optionsExempt: true, songOptions: [], exerciseOptions: [] });
    expect(lessonShortfall(exempt)).toEqual({ songs: 0, exercises: 0, floor: 3 });
  });

  it('falls back to the documented floor when the build wrote no needs block', () => {
    const bare = lesson({ needs: undefined, songOptions: [] });
    expect(lessonShortfall(bare)).toEqual({ songs: 0, exercises: 0, floor: DEFAULT_OPTION_FLOOR });
  });

  it('respects a floor the build set to something else', () => {
    const five = lesson({ needs: { songs: 3, exercises: 2, paper: 0, inBand: 0, floor: 5 } });
    expect(lessonShortfall(five)).toEqual({ songs: 3, exercises: 2, floor: 5 });
  });
});

describe('after an import is assigned to the rung', () => {
  const curriculum = {
    version: 1,
    tracks: [],
    stages: [{ number: 2, title: 'Two', units: [{ id: '2.1', track: 'core', lessons: [lesson()] }] }],
  } as unknown as Curriculum;

  const imported = {
    id: 'import.found-it',
    type: 'song',
    title: 'Found it',
    level: 2,
    hands: 'both',
    tracks: ['core'],
    concepts: [],
    imported: true,
    lessonIds: ['2.1'],
  } as unknown as CatalogItem;

  it('reports nothing short — the finder asked, he answered, the rung stops asking', () => {
    const before = curriculum.stages[0]?.units[0]?.lessons[0] as Lesson;
    expect(lessonShortfall(before).songs).toBe(1);

    const after = overlayImports(curriculum, [imported]);
    const overlaid = after.stages[0]?.units[0]?.lessons[0] as Lesson;
    expect(overlaid.songOptions).toContain('import.found-it');
    expect(lessonShortfall(overlaid)).toEqual({ songs: 0, exercises: 0, floor: 3 });
    // The build's block is untouched — it is a record of the build, and the
    // overlay is not a build.
    expect(overlaid.needs?.songs).toBe(1);
  });
});
