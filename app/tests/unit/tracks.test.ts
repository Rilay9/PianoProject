/**
 * One answer to "which tracks are on" (P19 A1, review C2).
 *
 * Three screens asked this and gave three answers. The bug that made it worth
 * fixing is the last test here: on a fresh phone Today walked `['core']`, so
 * once the core path was finished it recommended nothing, while Plan had been
 * showing six tracks as active the whole time.
 */
import { describe, expect, it } from 'vitest';
import { FRESH_TRACK_ORDER, activeTracksFor, defaultActiveTracks } from '../../src/curriculum/tracks';
import { nextRecommended } from '../../src/curriculum/session';
import type { Curriculum, Lesson, Track } from '../../src/curriculum/types';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { SessionRow } from '../../src/data/db';

function track(id: string, defaultActive?: boolean): Track {
  return {
    id,
    title: id,
    description: '',
    startsAtStage: 0,
    ...(defaultActive === undefined ? {} : { defaultActive }),
  };
}

/** core and classical on, blues off — the shape `00-tracks.json` has. */
const TRACKS = [track('core'), track('classical'), track('blues', false), track('theory-ear')];

function curriculum(tracks: Track[] = TRACKS, lessons: Lesson[] = []): Curriculum {
  return {
    version: 1,
    tracks,
    stages: [
      {
        number: 1,
        title: 'One',
        units: lessons.map((lesson, index) => ({
          id: `1.${String(index + 1)}`,
          track: lesson.id.split(':')[0] ?? 'core',
          lessons: [lesson],
        })),
      },
    ],
  } as unknown as Curriculum;
}

describe('activeTracksFor', () => {
  it('gives a fresh plan the data’s defaults, in curriculum order', () => {
    expect(activeTracksFor({ trackOrder: [...FRESH_TRACK_ORDER] }, curriculum())).toEqual([
      'core',
      'classical',
      'theory-ear',
    ]);
  });

  it('treats a missing or empty order as fresh', () => {
    expect(activeTracksFor(null, curriculum())).toEqual(['core', 'classical', 'theory-ear']);
    expect(activeTracksFor({}, curriculum())).toEqual(['core', 'classical', 'theory-ear']);
    expect(activeTracksFor({ trackOrder: [] }, curriculum())).toEqual([
      'core',
      'classical',
      'theory-ear',
    ]);
  });

  it('returns an edited order exactly as it is, order included', () => {
    // The order is a real choice: the session builder walks it when it picks
    // the day's new material.
    const chosen = ['blues', 'core'];
    expect(activeTracksFor({ trackOrder: chosen }, curriculum())).toEqual(chosen);
  });

  it('honours an order cut down to a single track that is not the fresh one', () => {
    // The old rule — "more than one entry means edited" — expanded this back
    // to six tracks, overruling the owner.
    expect(activeTracksFor({ trackOrder: ['classical'] }, curriculum())).toEqual(['classical']);
  });

  it('never returns nothing, because nothing means every track downstream', () => {
    const noneActive = curriculum([track('core', false), track('classical', false)]);
    expect(activeTracksFor({ trackOrder: ['core'] }, noneActive)).toEqual(['core']);
  });

  it('is pure — it does not touch the plan it was given', () => {
    const plan = { trackOrder: ['blues', 'core'] };
    activeTracksFor(plan, curriculum());
    expect(plan.trackOrder).toEqual(['blues', 'core']);
  });
});

describe('defaultActiveTracks', () => {
  it('takes every track the data does not switch off', () => {
    expect(defaultActiveTracks(curriculum())).toEqual(['core', 'classical', 'theory-ear']);
  });
});

describe('what it fixes', () => {
  function lesson(id: string): Lesson {
    return {
      id,
      title: id,
      concepts: [],
      textFile: `lessons/${id}.md`,
      exerciseOptions: [`exercise.${id}`],
      songOptions: [`song.${id}`],
      mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
    };
  }

  const withUnits = {
    version: 1,
    tracks: TRACKS,
    stages: [
      {
        number: 1,
        title: 'One',
        units: [
          { id: '1.1', track: 'core', lessons: [lesson('1.1')] },
          { id: '1.2', track: 'classical', lessons: [lesson('1.2')] },
        ],
      },
    ],
  } as unknown as Curriculum;

  // Revised (C5): the core rung met by the evidence — a clean run of each of
  // its options judged by it — where it was two passed flags.
  const judged = (itemId: string): SessionRow => ({
    itemId,
    lessonId: '1.1',
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 1000,
    at: '2026-10-01T10:00:00.000Z',
  });
  const done = rungState([judged('exercise.1.1'), judged('song.1.1')], withUnits, VOCABULARY_V0, new Date('2026-10-02T10:00:00Z'));

  it('stops Today recommending nothing once the core path is finished', () => {
    // The raw fresh order: core is complete, classical is invisible.
    expect(nextRecommended(withUnits, done, ['core'])).toBeUndefined();
    // The resolved set: the next rung is the classical one, which the data
    // said was on all along.
    const active = activeTracksFor({ trackOrder: ['core'] }, withUnits);
    expect(nextRecommended(withUnits, done, active)?.lesson.id).toBe('1.2');
  });
});
