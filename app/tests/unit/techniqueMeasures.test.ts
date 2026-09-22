// @vitest-environment node
/**
 * The three scorers that were written and never called (P12a, wired
 * 2026-09-21).
 *
 * `articulationScore`, `voicingScore` and `shapingScore` each appeared in
 * `app/src` only at its own definition. So the staccato study on
 * `technique.4` was judged on which notes were played and not on how long
 * they were held, `technique.5`'s crescendo was judged on its pitches, and
 * `technique.6`'s voicing lesson had to be rewritten to say "only your ear
 * checks it" over a function that checks it.
 *
 * What is asserted here is the *join*: that an exercise's own `drill` block
 * chooses the measure and supplies its target, and that the measure is not
 * accuracy — a run with every right note and none of the technique is 100 %
 * accurate and does not meet it.
 */
import { describe, expect, it } from 'vitest';
import { techniqueMeasureFor, demandsTechniqueMeasure } from '../../src/engine/Scoring';
import type { PreparedStep, RecordedNote, SessionScore, TimingStats } from '../../src/engine/types';

const EMPTY_TIMING: TimingStats = {
  n: 0,
  meanMs: 0,
  stdDevMs: 0,
  medianMs: 0,
  earlyPct: 0,
  latePct: 0,
  histogram: [],
};

function note(over: Partial<RecordedNote>): RecordedNote {
  return { midi: 60, velocity: 70, tMs: 0, stepIndex: 0, ok: true, ...over };
}

function step(index: number): PreparedStep {
  return {
    index,
    expected: [60],
    noteIdsByMidi: new Map(),
    tMs: index * 500,
    durMs: 500,
    measureIndex: 0,
    sourceMeasureIndex: 0,
    isMeasureStart: index === 0,
    isEmpty: false,
  };
}

/** A perfect run of the notes, whatever was done with them. */
function perfect(notes: RecordedNote[]): SessionScore {
  return {
    mode: 'tempo',
    tempoPct: 100,
    totalSteps: notes.length,
    correctSteps: notes.length,
    expectedNotes: notes.length,
    hits: notes.length,
    missedTotal: 0,
    wrongNotesTotal: 0,
    accuracy: 1,
    timing: EMPTY_TIMING,
    hotSpots: [],
    durationMs: 4000,
    loops: 0,
    rolledChordSteps: 0,
    accuracyEstimated: false,
    lenientChordSteps: 0,
    notes,
  };
}

const STACCATO = { kind: 'articulation', params: { articulation: 'staccato', heldFractionMax: 0.5 } };
const LEGATO = { kind: 'articulation', params: { articulation: 'legato', heldFractionMin: 0.9 } };
const VOICING = { kind: 'voicing', params: { key: 'A', topNoteRatio: 1.4 } };
const SHAPING = { kind: 'shaping', params: { key: 'A', shape: 'crescendo', minVelocityRange: 30 } };

describe('an exercise asks by its own drill block', () => {
  it('measures nothing for a piece that is not a technique exercise', () => {
    expect(techniqueMeasureFor(null, perfect([]), [])).toBeNull();
    expect(techniqueMeasureFor({ kind: 'scale' }, perfect([]), [])).toBeNull();
  });

  it('names the articulation the row asks for, not a default', () => {
    const notes = [note({ tMs: 0, releasedAtMs: 100, stepIndex: 0 })];
    expect(techniqueMeasureFor(STACCATO, perfect(notes), [step(0)])?.label).toBe('Staccato');
    expect(techniqueMeasureFor(LEGATO, perfect(notes), [step(0)])?.label).toBe('Legato');
  });
});

describe('the measure is not accuracy', () => {
  const steps = [step(0), step(1), step(2), step(3)];
  // Every note right, every one held to the end of its value: a perfect
  // *accuracy* and the opposite of staccato.
  const heldLong = steps.map((s) =>
    note({ tMs: s.tMs, releasedAtMs: s.tMs + 480, stepIndex: s.index }),
  );
  const clipped = steps.map((s) =>
    note({ tMs: s.tMs, releasedAtMs: s.tMs + 90, stepIndex: s.index }),
  );

  it('fails a staccato study played legato, on a run that is 100% accurate', () => {
    const score = perfect(heldLong);
    expect(score.accuracy).toBe(1);
    const measure = techniqueMeasureFor(STACCATO, score, steps);
    expect(measure?.met).toBe(false);
    expect(measure?.judged).toBe(4);
  });

  it('passes the same study played short', () => {
    expect(techniqueMeasureFor(STACCATO, perfect(clipped), steps)?.met).toBe(true);
  });

  it('is the other way round for a legato study', () => {
    expect(techniqueMeasureFor(LEGATO, perfect(heldLong), steps)?.met).toBe(true);
    expect(techniqueMeasureFor(LEGATO, perfect(clipped), steps)?.met).toBe(false);
  });

  it('says it could not measure, rather than saying nought', () => {
    // The microphone never sends note-off. "No note was short enough" and
    // "nothing could be measured" are different answers.
    const noReleases = steps.map((s) => note({ tMs: s.tMs, stepIndex: s.index }));
    const measure = techniqueMeasureFor(STACCATO, perfect(noReleases), steps);
    expect(measure?.judged).toBe(0);
    expect(measure?.text).toMatch(/not measured/);
  });
});

describe('voicing', () => {
  const chord = (top: number, under: number): RecordedNote[] => [
    note({ midi: 60, velocity: under, stepIndex: 0 }),
    note({ midi: 64, velocity: under, stepIndex: 0 }),
    note({ midi: 72, velocity: top, stepIndex: 0 }),
  ];

  it('uses the ratio the exercise states', () => {
    // 1.4 is the row's own number, and the sheet quotes it back.
    expect(techniqueMeasureFor(VOICING, perfect(chord(98, 70)), [])?.text).toContain('1.4');
  });

  it('meets it when the top sings and misses it when the chord is flat', () => {
    expect(techniqueMeasureFor(VOICING, perfect(chord(98, 70)), [])?.met).toBe(true);
    expect(techniqueMeasureFor(VOICING, perfect(chord(72, 70)), [])?.met).toBe(false);
  });

  it('does not judge a single note, which has no balance to get wrong', () => {
    const measure = techniqueMeasureFor(VOICING, perfect([note({ velocity: 90 })]), []);
    expect(measure?.judged).toBe(0);
    expect(measure?.text).toMatch(/not measured/);
  });
});

describe('shaping', () => {
  const line = (velocities: number[]): RecordedNote[] =>
    velocities.map((velocity, i) => note({ velocity, tMs: i * 400, stepIndex: i }));

  it('meets a crescendo that travels the distance the exercise asks for', () => {
    expect(techniqueMeasureFor(SHAPING, perfect(line([40, 50, 60, 70, 85])), [])?.met).toBe(true);
  });

  it('misses a line that is loud and level, however accurate it was', () => {
    const score = perfect(line([90, 90, 90, 90, 90]));
    expect(score.accuracy).toBe(1);
    expect(techniqueMeasureFor(SHAPING, score, [])?.met).toBe(false);
  });

  it('misses a line that wanders, which is the rule this one does catch', () => {
    expect(techniqueMeasureFor(SHAPING, perfect(line([40, 70, 45, 75, 50, 80])), [])?.met).toBe(
      false,
    );
  });

  it('lets a late jump through, which is the rule’s recorded weakness', () => {
    // Not an oversight and not this task's to change: `shapingScore`'s own
    // test ("accepts a late jump, which is the rule's known weakness")
    // records that "rises monotonically with a range ≥ 30" admits an accent,
    // because demanding a strict rise would fail every real crescendo. Said
    // again here so that wiring the scorer in did not quietly claim more than
    // the scorer measures.
    expect(techniqueMeasureFor(SHAPING, perfect(line([40, 40, 40, 40, 90])), [])?.met).toBe(true);
  });
});

describe('whether the rung makes it binding', () => {
  it('is false where the rung states no rule, which is all four of them today', () => {
    expect(demandsTechniqueMeasure(undefined, 'voicing')).toBe(false);
    expect(demandsTechniqueMeasure('one-piece-performed', 'voicing')).toBe(false);
  });

  it('is true where a rung names the measure with a number', () => {
    expect(demandsTechniqueMeasure('voicing-top-note>=0.9', 'voicing')).toBe(true);
    expect(demandsTechniqueMeasure('articulation-held>=0.9', 'articulation')).toBe(true);
  });

  it('does not fire for a different measure’s rule', () => {
    expect(demandsTechniqueMeasure('voicing-top-note>=0.9', 'shaping')).toBe(false);
  });
});
