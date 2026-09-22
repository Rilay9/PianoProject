/**
 * Trading fours (docs/04 §3c) — the three decisions, checked.
 *
 * The learner's half is checked with a **synthetic performance**: a list of
 * note onsets in milliseconds on the same timeline the screen feeds it, so
 * "came in inside their own bars" and "played the scale" are assertions about
 * playing rather than about a screen. Nothing here needs an AudioContext,
 * which is the reason the decisions live in the engine and not in `LabScreen`.
 */
import { describe, expect, it } from 'vitest';
import {
  callPhrase,
  judgeTrade,
  tradeAt,
  tradeScale,
  tradeScaleName,
} from '../../src/engine/tradingFours';

describe('whose bars these are', () => {
  it('gives the app the first trade and the learner the second', () => {
    // The app leads, always: every entry the learner makes then comes after
    // four bars they have just heard, which is the thing being practised.
    expect(tradeAt(0, 2).side).toBe('app');
    expect(tradeAt(1, 2).side).toBe('app');
    expect(tradeAt(2, 2).side).toBe('learner');
    expect(tradeAt(3, 2).side).toBe('learner');
    expect(tradeAt(4, 2).side).toBe('app');
  });

  it('counts the trades and the bar inside one', () => {
    // Trades are counted one per side, so the app's second is trade 2.
    expect(tradeAt(5, 2)).toEqual({ side: 'app', trade: 2, barInTrade: 1 });
    expect(tradeAt(7, 2)).toEqual({ side: 'learner', trade: 3, barInTrade: 1 });
    expect(tradeAt(13, 4)).toEqual({ side: 'learner', trade: 3, barInTrade: 1 });
  });

  it('survives a nonsense trade length rather than dividing by nought', () => {
    expect(tradeAt(3, 0).side).toBe('learner');
    expect(tradeAt(-4, 2).side).toBe('app');
  });
});

describe('the call the app plays', () => {
  const C_MAJOR = [0, 2, 4, 5, 7, 9, 11];

  it('plays a note a beat and leaves the last beat silent', () => {
    // A call with no breath at the end of it gives the learner nowhere to come
    // in from: the silence is what makes the hand-over audible.
    const notes = callPhrase({ chords: [[0, 4, 7], [5, 9, 0]], scale: C_MAJOR, seed: 3 });
    expect(notes).toHaveLength(7);
    expect(notes.map((note) => note.atBeat)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('puts a chord tone on every downbeat and a scale note everywhere else', () => {
    const notes = callPhrase({ chords: [[0, 4, 7], [5, 9, 0]], scale: C_MAJOR, seed: 3 });
    const pitchClass = (midi: number): number => ((midi % 12) + 12) % 12;
    expect([0, 4, 7]).toContain(pitchClass(notes[0]?.midi ?? -1));
    expect([5, 9, 0]).toContain(pitchClass(notes[4]?.midi ?? -1));
    for (const note of notes) expect(C_MAJOR).toContain(pitchClass(note.midi));
  });

  it('moves by step rather than leaping about', () => {
    const notes = callPhrase({ chords: [[0, 4, 7], [7, 11, 2]], scale: C_MAJOR, seed: 11 });
    for (let i = 1; i < notes.length; i += 1) {
      const step = Math.abs((notes[i]?.midi ?? 0) - (notes[i - 1]?.midi ?? 0));
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThanOrEqual(5);
    }
  });

  it('is the same call twice from the same seed, and a different one from another', () => {
    const one = callPhrase({ chords: [[0, 4, 7], [5, 9, 0]], scale: C_MAJOR, seed: 5 });
    const again = callPhrase({ chords: [[0, 4, 7], [5, 9, 0]], scale: C_MAJOR, seed: 5 });
    const other = callPhrase({ chords: [[0, 4, 7], [5, 9, 0]], scale: C_MAJOR, seed: 6 });
    expect(again).toEqual(one);
    expect(other).not.toEqual(one);
  });

  it('says nothing rather than guessing when it has no chords or no scale', () => {
    expect(callPhrase({ chords: [], scale: C_MAJOR })).toEqual([]);
    expect(callPhrase({ chords: [[0, 4, 7]], scale: [] })).toEqual([]);
  });
});

describe('what the learner’s bars were worth', () => {
  // Two bars at 100 bpm: a beat is 600 ms, a bar 2,400, the window 4,800.
  const BEAT = 600;
  const START = 10_000;
  const END = START + 8 * BEAT;
  const C_BLUES = [0, 3, 5, 6, 7, 10];
  const judge = (notes: readonly { midi: number; tMs: number }[], graceMs = BEAT / 2) =>
    judgeTrade({ notes, windowStartMs: START, windowEndMs: END, scale: C_BLUES, graceMs });

  it('says a learner who came in on the downbeat came in', () => {
    const played = [0, 1, 2, 3].map((beat) => ({ midi: 60 + beat, tMs: START + beat * BEAT }));
    const result = judge(played);
    expect(result.cameIn).toBe(true);
    expect(result.entryOffsetMs).toBe(0);
    expect(result.notesInWindow).toBe(4);
    expect(result.notesOutside).toBe(0);
  });

  it('counts a pick-up inside the grace as coming in, and reports it as early', () => {
    const result = judge([{ midi: 60, tMs: START - 200 }, { midi: 63, tMs: START + BEAT }]);
    expect(result.cameIn).toBe(true);
    expect(result.entryOffsetMs).toBe(-200);
  });

  it('says a learner still playing over the app’s call did not come in', () => {
    // A whole beat early is not a pick-up, it is playing through the call.
    const result = judge([
      { midi: 60, tMs: START - BEAT },
      { midi: 63, tMs: START + BEAT },
    ]);
    expect(result.cameIn).toBe(false);
    expect(result.notesOutside).toBe(1);
    expect(result.notesInWindow).toBe(1);
  });

  it('says a learner who ran past the end of their bars did', () => {
    const result = judge([
      { midi: 60, tMs: START },
      { midi: 63, tMs: END + 10 },
    ]);
    expect(result.cameIn).toBe(true);
    expect(result.notesOutside).toBe(1);
  });

  it('tells nothing-played apart from late', () => {
    const silence = judge([]);
    expect(silence.cameIn).toBe(false);
    expect(silence.entryOffsetMs).toBeNull();
    const late = judge([{ midi: 60, tMs: END + 1 }]);
    expect(late.cameIn).toBe(false);
    expect(late.entryOffsetMs).toBe(END + 1 - START);
  });

  it('counts the notes that were in the scale, and does not mark the rest wrong', () => {
    // D and A are not in the C blues scale. The result says six of eight, and
    // there is no accuracy, no pass and no mark anywhere on it — answering a
    // phrase by copying it is what this mode must never reward.
    const played = [60, 63, 65, 66, 67, 70, 62, 69].map((midi, i) => ({
      midi,
      tMs: START + i * (BEAT / 2),
    }));
    const result = judge(played);
    expect(result.notesInWindow).toBe(8);
    expect(result.notesInScale).toBe(6);
    expect(result).not.toHaveProperty('accuracy');
    expect(result).not.toHaveProperty('passed');
  });
});

describe('the scale the notes are counted against', () => {
  it('gives the twelve-bar form the blues scale and everything else the key’s own', () => {
    expect(tradeScaleName('blues', 'major')).toBe('blues');
    expect(tradeScaleName('ii-v-i', 'major')).toBe('major');
    expect(tradeScaleName('i-v-vi-iv', 'minor')).toBe('minor');
  });

  it('builds it in the key rather than in C', () => {
    expect(tradeScale({ progressionId: 'blues', tonic: 0, mode: 'major' })).toEqual([0, 3, 5, 6, 7, 10]);
    // G major, as pitch classes: G A B C D E F♯.
    expect(tradeScale({ progressionId: 'i-iv-v-i', tonic: 7, mode: 'major' })).toEqual([
      0, 2, 4, 6, 7, 9, 11,
    ]);
    // A minor.
    expect(tradeScale({ progressionId: 'i-vi-iv-v', tonic: 9, mode: 'minor' })).toEqual([
      0, 2, 4, 5, 7, 9, 11,
    ]);
  });
});
