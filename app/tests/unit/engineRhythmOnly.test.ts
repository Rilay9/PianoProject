// Rhythm first: judging when, not what (docs/05 §3a).
//
// The claim being tested is narrow and worth stating: a rhythm-only run
// forgives the *note* and never the moment. So each case here is a pair — the
// same strike accepted inside the window and refused outside it — and the last
// one is about what the run is allowed to be recorded as.

import { describe, expect, it } from 'vitest';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';

/**
 * C, D, then a three-note chord — one per beat at 60 bpm, so the steps land at
 * 0, 1000 and 2000 ms. The chord is the case the rule is written for: a rhythm
 * has one event where the score has three notes.
 */
const piece = makeModel([
  { onset: 0, notes: [note({ midi: 60 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
  { onset: 2, notes: [note({ midi: 64 }), note({ midi: 67 }), note({ midi: 72 })] },
]);

/** No count-in, so music time is clock time and the arithmetic is legible. */
const rhythmRun = { mode: 'tempo', countInBars: 0, rhythmOnly: true } as const;

/** A key that appears nowhere in the piece, so a hit can only be about timing. */
const ANY_KEY = 71;

describe('Tempo mode, rhythm only — the note is forgiven', () => {
  it('a wrong pitch inside the window is a hit, and colours the step it landed on', () => {
    const h = harness(piece, rhythmRun);
    h.engine.start();
    h.clock.set(0);
    h.engine.tick();
    h.play(ANY_KEY);
    h.advance(0.5 * BEAT_MS);

    const judged = h.of('noteJudged');
    expect(judged).toHaveLength(1);
    expect(judged[0]?.ok).toBe(true);
    expect(judged[0]?.stepIndex).toBe(0);
    // The staff colours the step's own notes, not the key that was pressed —
    // which is how the cursor, the colours and the strip go on behaving exactly
    // as they do in an ordinary run.
    expect(judged[0]?.noteIds).toEqual(piece.steps[0]?.notes.map((n) => n.id));
    expect(h.engine.state.score.wrongNotesTotal).toBe(0);
    expect(h.engine.state.score.missedTotal).toBe(0);
  });

  it('the same pitch outside the window is not', () => {
    const h = harness(piece, rhythmRun);
    h.engine.start();
    // Past the far edge of step 0's window and short of step 1's near edge, so
    // there is no step this could belong to.
    h.advance(0.4 * BEAT_MS);
    h.play(ANY_KEY);
    h.advance(0.1 * BEAT_MS);

    const judged = h.of('noteJudged');
    expect(judged).toHaveLength(1);
    expect(judged[0]?.ok).toBe(false);
    const score = h.engine.state.score;
    expect(score.wrongNotesTotal).toBe(1);
    // …and the step it was too late for is a miss, exactly as it would be with
    // the right note played too late.
    expect(h.of('missed').map((e) => e.stepIndex)).toEqual([0]);
  });

  it('one tap settles a chord, and the piece tapped on one key is right all through', () => {
    const h = harness(piece, rhythmRun);
    h.engine.start();
    for (const beat of [0, 1, 2]) {
      h.clock.set(beat * BEAT_MS);
      h.engine.tick();
      h.play(ANY_KEY);
      h.release(ANY_KEY);
    }
    h.advance(2 * BEAT_MS);

    // Three taps, three verdicts: the chord did not ask for three of its own.
    expect(h.of('noteJudged')).toHaveLength(3);
    expect(h.of('noteJudged')[2]?.noteIds).toHaveLength(piece.steps[2]?.notes.length ?? 0);
    const score = h.engine.state.score;
    // The chord's slots were all filled by the one strike, so the accuracy is
    // the same kind of number an ordinary run reports: the share of the piece
    // the learner was in time for.
    expect(score.hits).toBe(score.expectedNotes);
    expect(score.accuracy).toBe(1);
    expect(score.missedTotal).toBe(0);
    expect(score.wrongNotesTotal).toBe(0);
    // One thing was played at the chord, so the timing histogram counts one —
    // three would let a chord shout down the rest of the piece.
    expect(score.timing.n).toBe(3);
  });

  it('marks its result, so nothing downstream can mistake it for playing the piece', () => {
    const h = harness(piece, rhythmRun);
    h.engine.start();
    h.advance(3 * BEAT_MS);
    expect(h.engine.state.score.rhythmOnly).toBe(true);

    // The counter-case, and the reason the field is its own: an ordinary run
    // carries no such mark, so a score written before the flag existed and one
    // written after it read the same.
    const plain = harness(piece, { mode: 'tempo', countInBars: 0 });
    plain.engine.start();
    plain.advance(3 * BEAT_MS);
    expect(plain.engine.state.score.rhythmOnly).toBeUndefined();
  });

  it('is refused outside Keep tempo, where there is no window to be inside', () => {
    // Wait mode waits, so "in time" means nothing there; the option is ignored
    // rather than half-honoured, and the wrong note is still a wrong note.
    const h = harness(piece, { mode: 'wait', rhythmOnly: true });
    expect(h.engine.judgingRhythmOnly).toBe(false);
    h.engine.start();
    h.play(ANY_KEY);
    expect(h.of('noteJudged')[0]?.ok).toBe(false);
    expect(h.engine.state.step).toBe(0);
  });
});
