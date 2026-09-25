// A right note played early, in Keep tempo (T37 item 5; `05` §3).
//
// The trace read it off the code: a right pitch struck more than the window
// before its step matches no open slot, so it is counted as a wrong note, and
// then its slot closes unsatisfied and it is counted again as a miss. One
// thing happened — the learner came in early — and the sheet said two faults,
// neither of them that one. Reproduced here before anything was changed, then
// fixed where it happens: the strike waits for its step's window, and the
// window decides what it was.
import { describe, expect, it } from 'vitest';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';

/** C D E F, one per beat at 60 bpm, so steps land at 0/1000/2000/3000 ms. */
const melody = makeModel([
  { onset: 0, notes: [note({ midi: 60 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
  { onset: 2, notes: [note({ midi: 64 })] },
  { onset: 3, notes: [note({ midi: 65 })] },
]);

/** No count-in, so music time equals clock time. The window is ±150 ms. */
const noCountIn = { mode: 'tempo', countInBars: 0 } as const;

/** Plays C, E and F on their beats and D at `dAtMs`, then lets the run finish. */
function runWithD(dAtMs: number | null, alsoOnTime = false) {
  const h = harness(melody, noCountIn);
  h.engine.start();
  const at = (ms: number): void => {
    while (h.clock.now() < ms) {
      h.clock.set(Math.min(ms, h.clock.now() + 16));
      h.engine.tick();
    }
  };
  h.play(60);
  if (dAtMs !== null) {
    at(dAtMs);
    h.play(62);
    // Let go, as a hand does: a second Note-On with no Note-Off between is a
    // key bounce to a MIDI source, and the engine rightly ignores it.
    at(dAtMs + 100);
    h.release(62);
  }
  if (alsoOnTime) {
    at(1 * BEAT_MS);
    h.play(62);
  }
  at(2 * BEAT_MS);
  h.play(64);
  at(3 * BEAT_MS);
  h.play(65);
  at(4.5 * BEAT_MS);
  return h;
}

describe('a right note played more than the window early', () => {
  it('is one observation, early — not a wrong note and a miss', () => {
    // D at 700 ms: 300 ms before its step, twice the window.
    const h = runWithD(700);
    const score = h.engine.state.score;
    expect(score.wrongNotesTotal, 'the early D was counted as a wrong note').toBe(0);
    expect(score.missedTotal, "the early D's step was counted as missed").toBe(0);
    expect(score.early).toBe(1);
    // It was not in time, so it is not a hit: the accuracy is three of four.
    expect(score.hits).toBe(3);
    expect(score.accuracy).toBeCloseTo(3 / 4, 6);
    // And the note is kept against the step it was early for, with how early.
    const d = score.notes.find((n) => n.midi === 62);
    expect(d?.stepIndex).toBe(1);
    expect(d?.ok).toBe(false);
    expect(d?.deltaMs).toBeLessThan(-150);
    // Its bar is where the trouble was, so the loop can find it.
    expect(score.hotSpots.map((spot) => spot.measureIndex)).toContain(
      melody.steps[1]?.measureIndex,
    );
  });

  it('played early and again on time is a hit and one extra note', () => {
    // The learner heard it was early and played it again, on the beat: the
    // one on the beat is the note, the early one an extra.
    const h = runWithD(700, true);
    const score = h.engine.state.score;
    expect(score.hits).toBe(4);
    expect(score.early ?? 0).toBe(0);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.missedTotal).toBe(0);
  });

  it('is still a wrong note when it is far too early to be that step', () => {
    // A beat or more before its step it is not "early for D", it is a D
    // struck on C's beat: an extra note, and D's slot is then missed.
    const h = runWithD(0);
    const score = h.engine.state.score;
    expect(score.early ?? 0).toBe(0);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.missedTotal).toBe(1);
  });

  it('inside the window is a hit, as it always was', () => {
    const h = runWithD(900);
    const score = h.engine.state.score;
    expect(score.hits).toBe(4);
    expect(score.wrongNotesTotal).toBe(0);
    expect(score.missedTotal).toBe(0);
    expect(score.early ?? 0).toBe(0);
  });

  it('a wrong pitch early is a wrong note, and its step a miss, as before', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.play(60);
    h.advance(700);
    h.play(61);
    h.advance(3800);
    const score = h.engine.state.score;
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.missedTotal).toBe(3);
    expect(score.early ?? 0).toBe(0);
  });
});
