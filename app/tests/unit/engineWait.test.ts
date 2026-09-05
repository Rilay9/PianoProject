// Wait mode — the docs/05 §10 matrix, plus the edges it implies.
import { describe, expect, it } from 'vitest';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';

/** C D E F, one per beat, right hand. */
const melody = makeModel([
  { onset: 0, notes: [note({ midi: 60 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
  { onset: 2, notes: [note({ midi: 64 })] },
  { onset: 3, notes: [note({ midi: 65 })] },
]);

/** A C major triad, then a single note. */
const chords = makeModel([
  { onset: 0, notes: [note({ midi: 60 }), note({ midi: 64 }), note({ midi: 67 })] },
  { onset: 1, notes: [note({ midi: 65 })] },
]);

/** Right hand on beats 0 and 2; left hand alone on beats 1 and 3. */
const twoHands = makeModel([
  { onset: 0, notes: [note({ midi: 72, hand: 'R' })] },
  { onset: 1, notes: [note({ midi: 48, hand: 'L' })] },
  { onset: 2, notes: [note({ midi: 74, hand: 'R' })] },
  { onset: 3, notes: [note({ midi: 50, hand: 'L' })] },
]);

describe('Wait mode — advancing', () => {
  it('a perfect run advances exactly steps.length − 1 times and finishes', () => {
    const h = harness(melody, { mode: 'wait' });
    h.engine.start();
    for (const midi of [60, 62, 64, 65]) h.play(midi);
    expect(h.of('stepAdvanced').map((e) => [e.from, e.to])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    const finished = h.of('finished');
    expect(finished).toHaveLength(1);
    expect(finished[0]?.loop).toBe(false);
    expect(h.engine.state.finished).toBe(true);
  });

  it('does not move until the step is played — there is no clock', () => {
    const h = harness(melody, { mode: 'wait' });
    h.engine.start();
    h.advance(10 * BEAT_MS);
    expect(h.of('stepAdvanced')).toEqual([]);
    expect(h.engine.state.step).toBe(0);
  });

  it('advances on the strike, without waiting for the release', () => {
    const h = harness(melody, { mode: 'wait' });
    h.engine.start();
    h.play(60);
    expect(h.engine.state.step).toBe(1);
    // The key is still held: the HP-130 with the pedal down sends Note-Off
    // long after the ear has moved on.
    expect(h.engine.state.pressed.has(60)).toBe(true);
  });

  it('ignores a duplicate Note-On from a flaky cable', () => {
    const h = harness(chords, { mode: 'wait' });
    h.engine.start();
    h.play(60);
    h.play(60);
    h.play(64);
    h.play(67);
    expect(h.of('stepAdvanced')).toHaveLength(1);
    expect(h.engine.state.score.wrongNotesTotal).toBe(0);
  });
});

describe('Wait mode — chords', () => {
  it('a three-note chord arriving 0/40/70 ms apart advances once', () => {
    const h = harness(chords, { mode: 'wait' });
    h.engine.start();
    h.play(60, { atMs: 0 });
    h.play(64, { atMs: 40 });
    h.play(67, { atMs: 70 });
    expect(h.of('stepAdvanced')).toHaveLength(1);
    expect(h.engine.state.step).toBe(1);
    // Inside the 80 ms window, so not counted as rolled.
    expect(h.engine.state.score.rolledChordSteps).toBe(0);
  });

  it('advances as soon as the last note lands, without waiting out the window', () => {
    const h = harness(chords, { mode: 'wait' });
    h.engine.start();
    h.play(60, { atMs: 0 });
    h.play(64, { atMs: 1 });
    h.play(67, { atMs: 2 });
    expect(h.engine.state.step).toBe(1);
  });

  it('flags a chord spread wider than the window as rolled, but still advances', () => {
    const h = harness(chords, { mode: 'wait' });
    h.engine.start();
    h.play(60, { atMs: 0 });
    h.play(64, { atMs: 120 });
    h.play(67, { atMs: 260 });
    expect(h.engine.state.step).toBe(1);
    expect(h.engine.state.score.rolledChordSteps).toBe(1);
  });

  it('one key press satisfies a unison written in both hands', () => {
    // docs/05 §1.4 asks for a multiset here; one key cannot go down twice, so
    // the pitch is expected once and both note ids are reported.
    const unison = makeModel([
      { onset: 0, notes: [note({ midi: 60, hand: 'R' }), note({ midi: 60, hand: 'L', staff: 2 })] },
    ]);
    const h = harness(unison, { mode: 'wait' });
    h.engine.start();
    h.play(60);
    const judged = h.of('noteJudged');
    expect(judged[0]?.ok).toBe(true);
    expect(judged[0]?.noteIds).toHaveLength(2);
    expect(h.of('finished')).toHaveLength(1);
  });
});

describe('Wait mode — wrong notes', () => {
  it('lenient (default): counted, no advance, the chord is not reset', () => {
    const h = harness(chords, { mode: 'wait' });
    h.engine.start();
    h.play(60);
    h.play(61); // wrong
    h.play(64);
    h.play(67);
    expect(h.of('stepAdvanced')).toHaveLength(1);
    expect(h.engine.state.score.wrongNotesTotal).toBe(1);
    const bad = h.of('noteJudged').filter((e) => !e.ok);
    expect(bad.map((e) => e.midi)).toEqual([61]);
  });

  it('strict: a wrong note resets the chord, which must be replayed cleanly', () => {
    const h = harness(chords, { mode: 'wait' });
    h.engine.start();
    const strict = harness(chords, { mode: 'wait', strict: true });
    strict.engine.start();
    strict.play(60);
    strict.play(61); // wrong -> satisfied cleared
    strict.play(64);
    strict.play(67);
    // 60 was forgotten, so the chord is still incomplete.
    expect(strict.of('stepAdvanced')).toHaveLength(0);
    strict.play(60);
    expect(strict.of('stepAdvanced')).toHaveLength(1);
    void h;
  });

  it('a step with a wrong note does not count towards accuracy', () => {
    const h = harness(melody, { mode: 'wait' });
    h.engine.start();
    h.play(61); // wrong
    h.play(60);
    for (const midi of [62, 64, 65]) h.play(midi);
    const score = h.engine.state.score;
    expect(score.totalSteps).toBe(4);
    expect(score.correctSteps).toBe(3);
    expect(score.accuracy).toBeCloseTo(0.75, 6);
  });

  it('records the wrong note against the bar it happened in', () => {
    const twoBars = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 4, notes: [note({ midi: 62 })] },
    ]);
    const h = harness(twoBars, { mode: 'wait' });
    h.engine.start();
    h.play(60);
    h.play(99); // wrong, in bar 1
    h.play(62);
    expect(h.engine.state.score.hotSpots).toEqual([{ measureIndex: 1, misses: 0, wrongs: 1 }]);
  });
});

describe('Wait mode — look-ahead', () => {
  it('buffers a note belonging to the next step instead of calling it wrong', () => {
    const h = harness(chords, { mode: 'wait' });
    h.engine.start();
    h.play(60);
    h.play(65); // belongs to step 1, played early
    expect(h.engine.state.score.wrongNotesTotal).toBe(0);
    h.play(64);
    h.play(67);
    // Completing step 0 carries the buffered note in, which completes step 1.
    expect(h.of('stepAdvanced').map((e) => [e.from, e.to])).toEqual([[0, 1]]);
    expect(h.of('finished')).toHaveLength(1);
  });

  it('only buffers once the current step is under way', () => {
    const h = harness(chords, { mode: 'wait' });
    h.engine.start();
    h.play(65); // nothing satisfied yet, so this is simply wrong
    expect(h.engine.state.score.wrongNotesTotal).toBe(1);
  });

  it('with look-ahead off, an anticipated note is wrong', () => {
    const h = harness(chords, { mode: 'wait', lookahead: false });
    h.engine.start();
    h.play(60);
    h.play(65);
    expect(h.engine.state.score.wrongNotesTotal).toBe(1);
  });
});

describe('Wait mode — hand filter', () => {
  it('a right-hand run skips the left-hand-only steps', () => {
    const h = harness(twoHands, { mode: 'wait', hands: 'R' });
    h.engine.start();
    expect(h.engine.state.step).toBe(0);
    h.play(72);
    // Step 1 is left hand only, so the cursor lands on step 2.
    expect(h.engine.state.step).toBe(2);
    h.play(74);
    expect(h.of('finished')).toHaveLength(1);
    expect(h.engine.state.score.totalSteps).toBe(2);
  });

  it('a left-hand run starts on the first left-hand step', () => {
    const h = harness(twoHands, { mode: 'wait', hands: 'L' });
    h.engine.start();
    expect(h.engine.state.step).toBe(1);
    h.play(48);
    expect(h.engine.state.step).toBe(3);
  });

  it('transposition shifts what is expected, not what is played', () => {
    const h = harness(melody, { mode: 'wait', transposeSemis: 2 });
    h.engine.start();
    h.play(60);
    expect(h.engine.state.score.wrongNotesTotal).toBe(1);
    h.play(62);
    expect(h.engine.state.step).toBe(1);
  });

  it('grace notes are not expected by default, and are when asked for', () => {
    const withGrace = makeModel([
      { onset: 0, notes: [note({ midi: 59, graceNote: true }), note({ midi: 60 })] },
    ]);
    const off = harness(withGrace, { mode: 'wait' });
    off.engine.start();
    off.play(60);
    expect(off.of('finished')).toHaveLength(1);

    const on = harness(withGrace, { mode: 'wait', includeGraceNotes: true });
    on.engine.start();
    on.play(60);
    expect(on.of('finished')).toHaveLength(0);
    on.play(59);
    expect(on.of('finished')).toHaveLength(1);
  });
});

describe('Wait mode — loops', () => {
  it('wraps at the loop end and reports each lap', () => {
    const h = harness(melody, { mode: 'wait', loop: { fromStep: 1, toStep: 2 } });
    h.engine.start();
    expect(h.engine.state.step).toBe(1);
    h.play(62);
    h.play(64);
    const lap1 = h.of('finished');
    expect(lap1).toHaveLength(1);
    expect(lap1[0]?.loop).toBe(true);
    // Back to the top of the loop, not to the top of the piece.
    expect(h.engine.state.step).toBe(1);
    h.play(62);
    h.play(64);
    expect(h.of('finished')).toHaveLength(2);
    expect(h.engine.state.loops).toBe(2);
    expect(h.engine.state.finished).toBe(false);
  });
});

describe('Wait mode — pedal and transport', () => {
  it('records the sustain pedal without letting it block advancement', () => {
    const h = harness(melody, { mode: 'wait' });
    h.engine.start();
    h.cc(64, 127);
    expect(h.engine.state.sustain).toBe(true);
    h.play(60);
    expect(h.engine.state.step).toBe(1);
    h.cc(64, 0);
    expect(h.engine.state.sustain).toBe(false);
  });

  it('ignores input while paused, and resumes', () => {
    const h = harness(melody, { mode: 'wait' });
    h.engine.start();
    h.engine.pause();
    h.play(60);
    expect(h.engine.state.step).toBe(0);
    h.engine.resume();
    h.play(60);
    expect(h.engine.state.step).toBe(1);
    expect(h.of('paused')).toHaveLength(1);
    expect(h.of('resumed')).toHaveLength(1);
  });

  it('ignores input before start()', () => {
    const h = harness(melody, { mode: 'wait' });
    h.play(60);
    expect(h.of('noteJudged')).toEqual([]);
  });

  it('stop() finishes the run with the score so far', () => {
    const h = harness(melody, { mode: 'wait' });
    h.engine.start();
    h.play(60);
    h.engine.stop();
    const finished = h.of('finished');
    expect(finished).toHaveLength(1);
    expect(finished[0]?.score.correctSteps).toBe(1);
  });
});
