/**
 * The three things P12a made measurable, and the half pedal.
 *
 * Each of these exists because a family of exercises would otherwise ship with
 * no honest score: a staccato phrase played with every right note and no
 * shortness is 100% accurate and has missed the point. So none of them folds
 * into `SessionScore.accuracy` — they answer their own question, and these
 * tests are about the edges of that question rather than the happy path.
 */
import { describe, expect, it } from 'vitest';
import {
  LEGATO_MAX_HELD,
  LEGATO_MIN_HELD,
  STACCATO_MAX_HELD,
  articulationScore,
  shapingScore,
  voicingScore,
} from '../../src/engine/Scoring';
import { PedalDrill } from '../../src/engine/drills/special';
import type { PreparedStep, RecordedNote } from '../../src/engine/types';

/** One prepared step, only the fields the scorers read. */
function step(index: number, durMs = 500): PreparedStep {
  return {
    index,
    expected: [60],
    noteIdsByMidi: new Map(),
    tMs: index * durMs,
    durMs,
    measureIndex: 0,
    sourceMeasureIndex: 0,
    isMeasureStart: index === 0,
    isEmpty: false,
  };
}

function played(
  stepIndex: number,
  heldFraction: number | null,
  { midi = 60, velocity = 80, durMs = 500 } = {},
): RecordedNote {
  const tMs = stepIndex * durMs;
  return {
    midi,
    velocity,
    tMs,
    stepIndex,
    ok: true,
    ...(heldFraction === null ? {} : { releasedAtMs: tMs + heldFraction * durMs }),
  };
}

describe('articulationScore', () => {
  const steps = [step(0), step(1), step(2), step(3)];

  it('passes a staccato phrase played short', () => {
    const notes = [0, 1, 2, 3].map((i) => played(i, 0.3));
    const score = articulationScore(notes, steps, 'staccato');
    expect(score.judged).toBe(4);
    expect(score.accuracy).toBe(1);
    expect(score.meanHeldFraction).toBeCloseTo(0.3);
  });

  it('fails a staccato phrase played legato — every note is still correct', () => {
    const notes = [0, 1, 2, 3].map((i) => played(i, 0.95));
    expect(articulationScore(notes, steps, 'staccato').accuracy).toBe(0);
    // …and the same playing passes when legato is what was asked for.
    expect(articulationScore(notes, steps, 'legato').accuracy).toBe(1);
  });

  it('holds the thresholds exactly where docs/05 §7 puts them', () => {
    const justShort = articulationScore([played(0, STACCATO_MAX_HELD - 0.01)], steps, 'staccato');
    expect(justShort.accuracy).toBe(1);
    // The boundary itself is not short: "< 50%".
    expect(articulationScore([played(0, STACCATO_MAX_HELD)], steps, 'staccato').accuracy).toBe(0);
    expect(articulationScore([played(0, LEGATO_MIN_HELD)], steps, 'legato').accuracy).toBe(1);
  });

  it('allows one step of overlap and no more', () => {
    // A legato note may still be down when the next sounds…
    expect(articulationScore([played(0, 1.5)], steps, 'legato').accuracy).toBe(1);
    expect(articulationScore([played(0, LEGATO_MAX_HELD)], steps, 'legato').accuracy).toBe(1);
    // …but not past the step after it, which is a pedal, not a legato.
    expect(articulationScore([played(0, LEGATO_MAX_HELD + 0.1)], steps, 'legato').accuracy).toBe(0);
  });

  it('counts overlapping notes separately from failing ones', () => {
    const score = articulationScore([played(0, 1.4), played(1, 0.95)], steps, 'legato');
    expect(score.accuracy).toBe(1);
    expect(score.overlapping).toBe(1);
  });

  it('does not judge a note the source never released', () => {
    // The microphone cannot send note-off, and a run can end with a key down.
    // Treating that as "held for ever" would fail a phrase nobody played badly.
    const score = articulationScore([played(0, null), played(1, 0.2)], steps, 'staccato');
    expect(score.judged).toBe(1);
    expect(score.accuracy).toBe(1);
  });

  it('ignores notes that matched no step, and reports nothing rather than zero', () => {
    const orphan: RecordedNote = { midi: 61, velocity: 80, tMs: 0, stepIndex: null, ok: false, releasedAtMs: 10 };
    const score = articulationScore([orphan], steps, 'staccato');
    expect(score.judged).toBe(0);
    expect(score.accuracy).toBe(0);
  });
});

describe('voicingScore', () => {
  function chord(stepIndex: number, velocities: [number, number, number]): RecordedNote[] {
    return velocities.map((velocity, i) => ({
      midi: 60 + i * 4,
      velocity,
      tMs: stepIndex * 1000,
      stepIndex,
      ok: true,
    }));
  }

  it('passes when the top note sings above the others', () => {
    const score = voicingScore(chord(0, [50, 50, 80]));
    expect(score.judged).toBe(1);
    expect(score.accuracy).toBe(1);
    expect(score.meanRatio).toBeCloseTo(1.6);
  });

  it('fails a chord played flat, however accurate the notes', () => {
    expect(voicingScore(chord(0, [70, 70, 70])).accuracy).toBe(0);
  });

  it('fails when the wrong note is the loud one', () => {
    // The bass shouting is the commonest way this goes wrong.
    expect(voicingScore(chord(0, [90, 50, 55])).accuracy).toBe(0);
  });

  it('compares against the mean of the notes underneath, not the loudest', () => {
    // 80 against mean(40, 60) = 50 is a ratio of 1.6 and passes, even though
    // 80/60 alone would be 1.33. What the ear hears is the melody out of a
    // texture, not out of one other note.
    expect(voicingScore(chord(0, [40, 60, 80])).accuracy).toBe(1);
  });

  it('does not judge single notes', () => {
    const single: RecordedNote = { midi: 60, velocity: 100, tMs: 0, stepIndex: 0, ok: true };
    expect(voicingScore([single]).judged).toBe(0);
  });

  it('takes the threshold as a parameter, because the catalog carries it', () => {
    expect(voicingScore(chord(0, [50, 50, 60]), 1.1).accuracy).toBe(1);
    expect(voicingScore(chord(0, [50, 50, 60]), 1.4).accuracy).toBe(0);
  });
});

describe('shapingScore', () => {
  function run(velocities: number[]): RecordedNote[] {
    return velocities.map((velocity, i) => ({
      midi: 60 + i,
      velocity,
      tMs: i * 250,
      stepIndex: i,
      ok: true,
    }));
  }

  it('passes a crescendo that travels', () => {
    const score = shapingScore(run([40, 50, 60, 70, 80]), 'crescendo');
    expect(score.range).toBe(40);
    expect(score.monotonic).toBe(1);
    expect(score.passed).toBe(true);
  });

  it('accepts a late jump, which is the rule\'s known weakness', () => {
    // "Rises monotonically with a range ≥ 30" is the measurable P12a specifies,
    // and a line that sits still and then jumps satisfies it: every adjacent
    // pair is non-decreasing, and level counts as moving the right way because
    // demanding a strict rise would fail every real crescendo.
    //
    // Musically this is an accent, not a crescendo. Distinguishing them needs a
    // shape judgement — how the rise is distributed — which is a threshold
    // nobody has justified yet, so the looser honest rule ships and this test
    // records what it lets through rather than pretending otherwise.
    const score = shapingScore(run([40, 40, 40, 40, 90]), 'crescendo');
    expect(score.range).toBe(50);
    expect(score.monotonic).toBeCloseTo(1);
    expect(score.passed).toBe(true);
  });

  it('fails a line that wanders', () => {
    const score = shapingScore(run([40, 70, 45, 75, 50, 80]), 'crescendo');
    expect(score.monotonic).toBeLessThan(0.7);
    expect(score.passed).toBe(false);
  });

  it('fails a crescendo that does not cover enough ground', () => {
    const score = shapingScore(run([60, 62, 64, 66, 70]), 'crescendo');
    expect(score.range).toBe(10);
    expect(score.passed).toBe(false);
  });

  it('reads a diminuendo the other way round', () => {
    const notes = run([90, 80, 70, 60, 50]);
    expect(shapingScore(notes, 'diminuendo').passed).toBe(true);
    expect(shapingScore(notes, 'crescendo').passed).toBe(false);
  });

  it('sorts by time rather than trusting the order it was given', () => {
    const shuffled = [...run([40, 50, 60, 70, 80])].reverse();
    expect(shapingScore(shuffled, 'crescendo').passed).toBe(true);
  });

  it('says nothing useful about one note, and says so', () => {
    expect(shapingScore(run([80]), 'crescendo').passed).toBe(false);
  });
});

describe('PedalDrill in half-pedal mode', () => {
  function drill() {
    return new PedalDrill({ chords: [[60, 64, 67], [59, 62, 67]], halfPedalRange: [32, 96] });
  }

  it('scores the value held, not the timing of the change', () => {
    const d = drill();
    d.next();
    for (const value of [40, 60, 80, 50]) {
      d.feed({ kind: 'cc', cc: 64, value, tMs: 0 });
    }
    const result = d.result();
    expect(result.accuracy).toBe(1);
    expect(result.detail?.inRange).toBe(4);
    expect(result.detail?.partialPedalMessages).toBe(4);
  });

  it('fails a pedal that is only ever fully up or fully down', () => {
    const d = drill();
    d.next();
    for (const value of [0, 127, 0, 127]) {
      d.feed({ kind: 'cc', cc: 64, value, tMs: 0 });
    }
    const result = d.result();
    expect(result.accuracy).toBe(0);
    expect(result.detail?.partialPedalMessages).toBe(0);
  });

  it('scores zero when the pedal was never touched, rather than passing by default', () => {
    const d = drill();
    d.next();
    d.feed({ kind: 'noteOn', midi: 60, velocity: 80, tMs: 0 });
    const result = d.result();
    expect(result.answered).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  it('still scores clean changes when no half-pedal range is asked for', () => {
    const d = new PedalDrill({ chords: [[60], [62]] });
    d.next();
    d.feed({ kind: 'cc', cc: 64, value: 127, tMs: 0 });
    d.feed({ kind: 'noteOn', midi: 60, velocity: 80, tMs: 10 });
    d.next();
    d.feed({ kind: 'noteOn', midi: 62, velocity: 80, tMs: 1000 });
    d.feed({ kind: 'cc', cc: 64, value: 0, tMs: 1050 });
    d.feed({ kind: 'cc', cc: 64, value: 127, tMs: 1150 });
    d.next();
    expect(d.result().detail?.cleanChanges).toBe(1);
  });
});
