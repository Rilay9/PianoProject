/**
 * The count-in's arithmetic (P19 §B).
 *
 * Two things it has to get right and one it used to get wrong:
 *
 *   - a bar is a bar in the *notated* meter, and beats are quarter notes, so
 *     6/8 is three of them and not six;
 *   - the beat it counts at is the beat where the run starts. It used to be
 *     the piece's first beat, so a loop set after a tempo change was counted
 *     in at the opening tempo and then played at the section's. Six of the
 *     Chopin editions change tempo mid-piece, and looping a slow section of a
 *     fast piece is the reason loops exist.
 */
import { describe, expect, it } from 'vitest';
import { prepareSession } from '../../src/engine/prepareSession';
import { makeModel, note } from './helpers/engineHarness';

/** Four bars of 6/8 at ♩=180, which is a dotted crotchet at 60. */
function sixEight() {
  const steps = [];
  for (let bar = 0; bar < 4; bar += 1) {
    for (let eighth = 0; eighth < 6; eighth += 1) {
      steps.push({ onset: bar * 3 + eighth * 0.5, notes: [note({ midi: 60 + eighth })] });
    }
  }
  return makeModel(steps, {
    tempoMap: [{ atBeat: 0, bpm: 180 }],
    timeSigMap: [{ atMeasure: 0, beats: 6, beatType: 8 }],
  });
}

describe('a bar of 6/8', () => {
  it('is three quarter-note beats, and one second at a dotted crotchet of 60', () => {
    const model = sixEight();
    // The convention the whole timetable rests on: onsets are quarter notes,
    // and `<sound tempo>` is quarter notes per minute, so the two agree.
    expect(model.beatToMs(3)).toBeCloseTo(1000, 6);
    const prepared = prepareSession(model, { mode: 'tempo', countInBars: 1 });
    expect(prepared.options.beatsPerBar).toBe(3);
    // One bar of count-in is one second, not two.
    expect(prepared.countInMs).toBeCloseTo(1000, 6);
  });

  it('halves with the tempo slider, like everything else', () => {
    const prepared = prepareSession(sixEight(), {
      mode: 'tempo',
      countInBars: 1,
      tempoPct: 50,
    });
    expect(prepared.countInMs).toBeCloseTo(2000, 6);
  });
});

describe('a count-in for a loop after a tempo change', () => {
  /** Two bars of 4/4 at 60, then two at 120. */
  function withChange() {
    const steps = [];
    for (let beat = 0; beat < 16; beat += 1) {
      steps.push({ onset: beat, notes: [note({ midi: 60 })] });
    }
    return makeModel(steps, {
      tempoMap: [
        { atBeat: 0, bpm: 60 },
        { atBeat: 8, bpm: 120 },
      ],
      timeSigMap: [{ atMeasure: 0, beats: 4, beatType: 4 }],
    });
  }

  it('counts at the tempo of the bar it is about to play', () => {
    const model = withChange();
    // Step 8 is the first beat of the faster half.
    const prepared = prepareSession(model, {
      mode: 'tempo',
      countInBars: 1,
      loop: { fromStep: 8, toStep: 15 },
    });
    // Four beats at 120 = two seconds. At the opening tempo it would be four,
    // which is what this used to give.
    expect(prepared.countInMs).toBeCloseTo(2000, 6);
  });

  it('still counts at the opening tempo when the run starts at the beginning', () => {
    const prepared = prepareSession(withChange(), { mode: 'tempo', countInBars: 1 });
    expect(prepared.countInMs).toBeCloseTo(4000, 6);
  });

  it('has no count-in at all in Wait mode, where the learner sets the clock', () => {
    const prepared = prepareSession(withChange(), { mode: 'wait', countInBars: 2 });
    expect(prepared.countInMs).toBe(0);
  });
});
