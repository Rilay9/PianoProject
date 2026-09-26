// @vitest-environment node
/**
 * "Placement recorded. Today will build from here" — and now it does
 * (`02` Stage 0.4, built 2026-09-21).
 *
 * `recordPlacement` wrote `placement.unitId` into the plan from two screens,
 * and `grep -rn "\.unitId|getPlan" app/src` found every reader using only
 * `trackOrder` through `activeTracksFor`. So the plan carried on recommending
 * `0.1` to somebody the app had just told it would start them at `3.2`, and
 * the sentence saying otherwise was on the screen that wrote the row.
 *
 * The rule has two halves and the second is the one worth arguing about:
 * nothing behind the placement is recommended **first**, and everything behind
 * it comes back if there is nothing left in front — because rungs behind a
 * placement are not passed, they are skipped, and an empty plan would be a
 * worse answer than an early rung.
 */
import { describe, expect, it } from 'vitest';
import { nextRecommended } from '../../src/curriculum/session';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { rungState, type RungStates } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

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

/** Three stages, one unit each, a core rung and a track rung in stage 3. */
function curriculum(): Curriculum {
  return {
    version: 1,
    tracks: [
      { id: 'core', title: 'Core', description: '', startsAtStage: 0 },
      { id: 'jazz', title: 'Jazz', description: '', startsAtStage: 3 },
    ],
    stages: [
      {
        number: 1,
        title: 'One',
        summary: '',
        units: [{ id: '1.1', title: 'First notes', track: 'core', lessons: [lesson('1.1')] }],
      },
      {
        number: 2,
        title: 'Two',
        summary: '',
        units: [{ id: '2.1', title: 'Hands together', track: 'core', lessons: [lesson('2.1')] }],
      },
      {
        number: 3,
        title: 'Three',
        summary: '',
        units: [
          { id: '3.2', title: 'Sevenths', track: 'core', lessons: [lesson('3.2')] },
          { id: 'jazz.3.1', title: 'Swing', track: 'jazz', lessons: [lesson('jazz.3')] },
        ],
      },
    ],
  };
}

/**
 * The rungs met by the evidence: a clean run of both options of each, judged
 * by it (C5). Revised from passed flags on the items; the placement rule —
 * a floor, not evidence — and every assertion below stand.
 */
function met(...rungs: string[]): RungStates {
  const rows: SessionRow[] = rungs.flatMap((rung) =>
    [`exercise.${rung}`, `song.${rung}`].map((itemId) => ({
      itemId,
      lessonId: rung,
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 1000,
      at: '2026-10-01T10:00:00.000Z',
    })),
  );
  return rungState(rows, curriculum(), VOCABULARY_V0, new Date('2026-10-02T10:00:00Z'));
}

describe('with no placement', () => {
  it('recommends the first incomplete rung, as it always has', () => {
    expect(nextRecommended(curriculum(), met())?.lesson.id).toBe('1.1');
  });
});

describe('with a placement', () => {
  it('starts at the placed unit rather than at the beginning', () => {
    expect(nextRecommended(curriculum(), met(), [], { startAt: '3.2' })?.lesson.id).toBe('3.2');
  });

  it('takes a rung id too, because the lesson page’s *Start here* writes one', () => {
    // The placement drill names a unit (`failUnit`); *Start here* on a lesson
    // page names the rung the reader is on. Both are right about their own
    // screen, so both are matched.
    expect(nextRecommended(curriculum(), met(), [], { startAt: 'jazz.3' })?.lesson.id).toBe('jazz.3');
  });

  it('moves on from the placed rung once it is complete', () => {
    const done = met('3.2');
    expect(nextRecommended(curriculum(), done, [], { startAt: '3.2' })?.lesson.id).toBe('jazz.3');
  });

  it('comes back to the rungs behind it when there is nothing left in front', () => {
    const done = met('3.2', 'jazz.3');
    // Not `undefined`, and not the placed rung: the earliest rung the learner
    // skipped past, which is the honest thing left to offer.
    expect(nextRecommended(curriculum(), done, [], { startAt: '3.2' })?.lesson.id).toBe('1.1');
  });

  it('ignores a placement at a unit the curriculum does not have', () => {
    // A placement written before a unit was renamed away. Never reaching the
    // start would hold every rung back and recommend nothing at all.
    expect(nextRecommended(curriculum(), met(), [], { startAt: 'blues.4' })?.lesson.id).toBe('1.1');
  });

  it('is off when the placement is empty, which is a fresh plan row', () => {
    expect(nextRecommended(curriculum(), met(), [], { startAt: '' })?.lesson.id).toBe('1.1');
  });

  it('still skips a track the learner has switched off', () => {
    const done = met('3.2');
    // Jazz is not in the active set, so the rung after 3.2 is nothing in
    // front — and the fallback behind it applies, exactly as it does above.
    expect(nextRecommended(curriculum(), done, ['core'], { startAt: '3.2' })?.lesson.id).toBe('1.1');
  });
});
