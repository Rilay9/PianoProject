// @vitest-environment jsdom
// The engine's microphone adaptations (docs/05 §11.4).
//
// These are the rules that keep an uncertain input source from being worse
// than no input source: an unsure report must never advance the score and must
// never count against the learner, and a chord with one note masked must not
// stop the run dead.

import { describe, expect, it } from 'vitest';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';
import { MIC_ENGINE_OPTIONS } from '../../src/engine/types';

/** Three single notes, one per beat. */
function melody() {
  return makeModel([
    { onset: 0, notes: [note({ midi: 60 })] },
    { onset: 1, notes: [note({ midi: 62 })] },
    { onset: 2, notes: [note({ midi: 64 })] },
  ]);
}

/** One C-major triad, then a single note to advance to. */
function triad() {
  return makeModel([
    { onset: 0, notes: [note({ midi: 60 }), note({ midi: 64 }), note({ midi: 67 })] },
    { onset: 1, notes: [note({ midi: 72 })] },
  ]);
}

describe('confidence gating', () => {
  it('ignores an input the source is not sure about', () => {
    const h = harness(melody(), { mode: 'wait' });
    h.engine.start();
    h.play(60, { confidence: 0.3 });
    // Neither judged nor advanced: the detector said it did not know.
    expect(h.of('noteJudged')).toHaveLength(0);
    expect(h.engine.state.step).toBe(0);
  });

  it('accepts an expected pitch at the §11.4 threshold of 0.5', () => {
    const h = harness(melody(), { mode: 'wait' });
    h.engine.start();
    h.play(60, { confidence: 0.5 });
    expect(h.of('noteJudged')[0]?.ok).toBe(true);
    expect(h.engine.state.step).toBe(1);
  });

  it('marks a wrong note uncertain and leaves it out of the score', () => {
    const h = harness(melody(), { mode: 'wait' });
    h.engine.start();
    h.play(61, { confidence: 0.5 });
    const judged = h.of('noteJudged')[0];
    expect(judged?.ok).toBe(false);
    expect(judged?.uncertain).toBe(true);
    // Play the rest correctly; a mic guess must not cost the run its accuracy.
    h.play(60, { confidence: 1 });
    h.play(62, { confidence: 1 });
    h.play(64, { confidence: 1 });
    const score = h.of('finished')[0]?.score;
    expect(score?.wrongNotesTotal).toBe(0);
    expect(score?.accuracy).toBe(1);
  });

  it('counts the same note when strict mic scoring lowers the bar', () => {
    const h = harness(melody(), { mode: 'wait', wrongNoteConfidence: 0.5 });
    h.engine.start();
    h.play(61, { confidence: 0.5 });
    expect(h.of('noteJudged')[0]?.uncertain).toBeUndefined();
    h.play(60);
    h.play(62);
    h.play(64);
    expect(h.of('finished')[0]?.score.wrongNotesTotal).toBe(1);
  });

  it('a certain wrong note still counts, mic options or not', () => {
    const h = harness(melody(), { mode: 'wait', ...MIC_ENGINE_OPTIONS });
    h.engine.start();
    h.play(61, { confidence: 1 });
    expect(h.of('noteJudged')[0]?.uncertain).toBeUndefined();
  });
});

describe('chord leniency (docs/05 §11.4)', () => {
  it('completes a chord when most of it was heard confidently', () => {
    const h = harness(triad(), { mode: 'wait', ...MIC_ENGINE_OPTIONS });
    h.engine.start();
    // Two of three: the third is masked by the other two, which is the normal
    // way a microphone loses a note.
    h.play(60, { confidence: 0.9 });
    h.play(64, { confidence: 0.9 });
    expect(h.engine.state.step).toBe(0);
    // The grace period has to pass first, or a rolled chord would be completed
    // before its last note arrived.
    h.advance(200);
    expect(h.engine.state.step).toBe(0);
    h.advance(300);
    expect(h.engine.state.step).toBe(1);
  });

  it('does not count a leniently completed chord as a clean step', () => {
    const h = harness(triad(), { mode: 'wait', ...MIC_ENGINE_OPTIONS });
    h.engine.start();
    h.play(60, { confidence: 0.9 });
    h.play(64, { confidence: 0.9 });
    h.advance(500);
    h.play(72, { confidence: 0.9 });
    const score = h.of('finished')[0]?.score;
    expect(score?.lenientChordSteps).toBe(1);
    // Two steps, one of them completed on partial evidence.
    expect(score?.correctSteps).toBe(1);
  });

  it('waits indefinitely without the leniency', () => {
    const h = harness(triad(), { mode: 'wait' });
    h.engine.start();
    h.play(60, { confidence: 0.9 });
    h.play(64, { confidence: 0.9 });
    h.advance(5 * BEAT_MS);
    expect(h.engine.state.step).toBe(0);
  });

  it('needs a strong onset, not just enough notes', () => {
    const h = harness(triad(), { mode: 'wait', ...MIC_ENGINE_OPTIONS });
    h.engine.start();
    h.play(60, { confidence: 0.55 });
    h.play(64, { confidence: 0.55 });
    h.advance(5 * BEAT_MS);
    expect(h.engine.state.step).toBe(0);
  });

  it('never applies to a single note', () => {
    const h = harness(melody(), { mode: 'wait', ...MIC_ENGINE_OPTIONS });
    h.engine.start();
    h.advance(5 * BEAT_MS);
    expect(h.engine.state.step).toBe(0);
  });
});

describe('estimated accuracy', () => {
  it('labels the run when the input was the microphone', () => {
    const h = harness(melody(), { mode: 'wait', ...MIC_ENGINE_OPTIONS });
    h.engine.start();
    h.play(60);
    h.play(62);
    h.play(64);
    expect(h.of('finished')[0]?.score.accuracyEstimated).toBe(true);
  });

  it('does not label a MIDI run', () => {
    const h = harness(melody(), { mode: 'wait' });
    h.engine.start();
    h.play(60);
    h.play(62);
    h.play(64);
    expect(h.of('finished')[0]?.score.accuracyEstimated).toBe(false);
  });

  it('widens the tempo tolerance to ±200 ms', () => {
    expect(MIC_ENGINE_OPTIONS.toleranceMs).toBe(200);
  });
});
