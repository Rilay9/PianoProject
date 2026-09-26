/**
 * Per-rung pass thresholds (`02` Part G, built 2026-09-21).
 *
 * Every rung has carried `mastery.minAccuracy` and `mastery.minTempoPct`
 * since the curriculum was written and nothing read either; `Scoring.ts`
 * passed everything at the one pair in Settings. These are the claims the
 * lessons on those rungs make, asserted against the code that now reads them.
 *
 * The units are the point of half of this file: the curriculum writes `0.85`
 * and the scorer writes `85`, and a conversion that went the wrong way would
 * pass every run at 0.85 % of tempo while looking entirely reasonable.
 */
import { describe, expect, it } from 'vitest';
import { findLesson, masteryCriteriaFor, proseRungFor } from '../../src/curriculum/selectors';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import { DEFAULT_MASTERY, evaluateOutcome } from '../../src/engine/Scoring';
import type { SessionScore, TimingStats } from '../../src/engine/types';
import { parseHash } from '../../src/router';

function lesson(id: string, over: Partial<Lesson> = {}): Lesson {
  return {
    id,
    title: id,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [`exercise.${id}`],
    songOptions: [`song.${id}`],
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
        number: 4,
        title: 'Stage',
        summary: '',
        units: [{ id: '4.1', title: 'Unit', track: 'core', lessons }],
      },
    ],
  };
}

const EMPTY_TIMING: TimingStats = {
  n: 0,
  meanMs: 0,
  stdDevMs: 0,
  medianMs: 0,
  earlyPct: 0,
  latePct: 0,
  histogram: [],
};

function scoreWith(over: Partial<SessionScore>): SessionScore {
  return {
    mode: 'tempo',
    tempoPct: 100,
    totalSteps: 10,
    correctSteps: 10,
    expectedNotes: 10,
    hits: 10,
    missedTotal: 0,
    wrongNotesTotal: 0,
    accuracy: 1,
    timing: EMPTY_TIMING,
    hotSpots: [],
    durationMs: 1000,
    loops: 0,
    rolledChordSteps: 0,
    accuracyEstimated: false,
    lenientChordSteps: 0,
    notes: [],
    ...over,
  };
}

// Replaced (C5): \`lessonForItem\` found the first rung listing an item, and
// the Drill screen and Today judged runs by it — the credit by listing C5
// removed (L8). What is left of it is the prose beside a piece opened from
// nowhere (\`proseRungFor\`), which judges nothing (its one caller is held in
// \`noCompletionBesideTheEvidence.test.ts\`).
describe('proseRungFor', () => {
  it('finds the rung whose text is shown beside an exercise or a song', () => {
    const curriculum = curriculumOf(lesson('4.4'));
    expect(proseRungFor(curriculum, 'exercise.4.4')?.id).toBe('4.4');
    expect(proseRungFor(curriculum, 'song.4.4')?.id).toBe('4.4');
  });

  it('is undefined for a piece on no rung', () => {
    expect(proseRungFor(curriculumOf(lesson('4.4')), 'song.library')).toBeUndefined();
  });
});

describe('masteryCriteriaFor', () => {
  it('takes the rung’s accuracy and turns its tempo fraction into a percentage', () => {
    // 4.4 asks for 97 % accuracy at 80 % of tempo; 4.5 for 90 % at 90 %.
    const strict = masteryCriteriaFor(
      lesson('4.4', {
        mastery: { minAccuracy: 0.97, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
      }),
      DEFAULT_MASTERY,
    );
    expect(strict.passAccuracy).toBe(0.97);
    expect(strict.passTempoPct).toBe(80);

    const faster = masteryCriteriaFor(
      lesson('4.5', {
        mastery: { minAccuracy: 0.9, minTempoPct: 0.9 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
      }),
      DEFAULT_MASTERY,
    );
    expect(faster.passTempoPct).toBe(90);
  });

  it('reads a value above 1 as the percentage the field is named for', () => {
    const written = masteryCriteriaFor(
      lesson('x', {
        mastery: { minAccuracy: 0.9, minTempoPct: 85 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
      }),
      DEFAULT_MASTERY,
    );
    expect(written.passTempoPct).toBe(85);
  });

  it('falls back to the defaults for a piece on no rung', () => {
    const settings = { ...DEFAULT_MASTERY, passAccuracy: 0.75, passTempoPct: 60 };
    expect(masteryCriteriaFor(undefined, settings)).toEqual(settings);
  });

  it('falls back to the defaults where the rung states no number of its own', () => {
    // Stage 0's checklist, the tour, the improvisation rungs judged by a
    // recording: `0` means "I have no number", not "pass everything".
    const settings = { ...DEFAULT_MASTERY, passAccuracy: 0.75, passTempoPct: 60 };
    const none = masteryCriteriaFor(
      lesson('improv.3', {
        mastery: { minAccuracy: 0, minTempoPct: 0 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
      }),
      settings,
    );
    expect(none.passAccuracy).toBe(0.75);
    expect(none.passTempoPct).toBe(60);
  });

  it('leaves mastery alone — Part G defines it once, for the whole plan', () => {
    const criteria = masteryCriteriaFor(
      lesson('4.4', {
        mastery: { minAccuracy: 0.97, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
      }),
      DEFAULT_MASTERY,
    );
    expect(criteria.masterAccuracy).toBe(DEFAULT_MASTERY.masterAccuracy);
    expect(criteria.masterTempoPct).toBe(DEFAULT_MASTERY.masterTempoPct);
  });
});

describe('a run judged against its rung', () => {
  it('fails on a rung that asks for more than the global pass', () => {
    const run = scoreWith({ accuracy: 0.93, tempoPct: 100 });
    expect(evaluateOutcome(run, DEFAULT_MASTERY).passed).toBe(true);
    const rung = lesson('4.4', {
      mastery: { minAccuracy: 0.97, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
    });
    expect(evaluateOutcome(run, masteryCriteriaFor(rung, DEFAULT_MASTERY)).passed).toBe(false);
  });

  it('fails on a rung that asks for a faster tempo than the global pass', () => {
    const run = scoreWith({ accuracy: 1, tempoPct: 85 });
    expect(evaluateOutcome(run, DEFAULT_MASTERY).passed).toBe(true);
    const rung = lesson('3.2', {
      mastery: { minAccuracy: 0.9, minTempoPct: 0.9 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
    });
    expect(evaluateOutcome(run, masteryCriteriaFor(rung, DEFAULT_MASTERY)).passed).toBe(false);
  });

  it('passes on a rung that asks for less', () => {
    const run = scoreWith({ accuracy: 0.86, tempoPct: 75 });
    expect(evaluateOutcome(run, DEFAULT_MASTERY).passed).toBe(false);
    const rung = lesson('practice.1', {
      mastery: { minAccuracy: 0.8, minTempoPct: 0.7 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
    });
    expect(evaluateOutcome(run, masteryCriteriaFor(rung, DEFAULT_MASTERY)).passed).toBe(true);
  });

  // Added (C3 item 0b, L50): the Today case. A Today card names the rung it
  // chose in the route (`?rung=`), apart from `from`; the rung it names is the
  // one the run is held to, exactly as a rung that opened the screen is.
  it('opened from a Today card, it is judged by the rung the card names', () => {
    const route = parseHash('#/score/song.4.4?rung=4.4&slot=new');
    expect(route.scoreRung, 'the route dropped the rung Today chose').toBe('4.4');
    expect(route.scoreSlot).toBe('new');
    expect(route.scoreFrom, 'the rung Today chose is not where Back goes').toBeUndefined();
    const curriculum = curriculumOf(
      lesson('4.4', { mastery: { minAccuracy: 0.97, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }] }),
    );
    const rung = findLesson(curriculum, route.scoreRung ?? '');
    const run = scoreWith({ accuracy: 0.93, tempoPct: 100 });
    expect(evaluateOutcome(run, DEFAULT_MASTERY).passed).toBe(true);
    expect(evaluateOutcome(run, masteryCriteriaFor(rung, DEFAULT_MASTERY)).passed).toBe(false);
  });
});
