// What a wrong key costs in Keep tempo (CL11a, Entry 219; `docs/design/evidence-truth.md` L10;
// `docs/review/responses/1afa30d3.md` §2, lane 1).
//
// The fault, read at the base: in Keep tempo accuracy is `hits / expectedNotes`, so a key that no step
// asks for cost nothing (a run with a stray key beside every right note scored 100 % and passed, where
// the same playing in Wait scored 0 %), and a right note played late was charged twice, as a miss and as
// a wrong key. The rule after: accuracy is the written notes played right in time, less one note per
// wrong key, floored at 0, and a right note played late costs once, as the miss.
//
// The late-note exemption is the hard half, so most of these cases are about its bound. It stands for
// one identifiable missed note, once per expected pitch occurrence: a pitch some opened step asks for,
// not yet played, whose window the strike is past and whose onset is less than a beat behind it
// (the early rule's own reach, `05` §3). It never forgives a key because its pitch appears elsewhere.
// Every run here is on the engine's own clock, strike by strike, at 60 bpm (steps a second apart,
// a window of 150 ms either side), and every assertion reads what a sheet or a record would show.
import { describe, expect, it } from 'vitest';
import type { PracticeEngineOptions } from '../../src/engine/PracticeEngine';
import { evaluateOutcome, measuresOf } from '../../src/engine/Scoring';
import { NOT_MEASURED, type SessionScore } from '../../src/engine/types';
import { BEAT_MS, harness, makeModel, note, type Harness } from './helpers/engineHarness';
import type { ScoreModel } from '../../src/score/types';

interface Strike {
  at: number;
  midi: number;
  confidence?: number;
}

/** Plays the strikes at their times on the engine's clock, a tick every 16 ms, then lets the run finish. */
function keepTempo(
  model: ScoreModel,
  strikes: readonly Strike[],
  options: Partial<PracticeEngineOptions> = {},
): { h: Harness; score: SessionScore } {
  const h = harness(model, { mode: 'tempo', countInBars: 0, ...options });
  h.engine.start();
  const until = (ms: number): void => {
    while (h.clock.now() < ms) {
      h.clock.set(Math.min(ms, h.clock.now() + 16));
      h.engine.tick();
    }
  };
  for (const strike of [...strikes].sort((a, b) => a.at - b.at)) {
    until(strike.at);
    h.play(strike.midi, strike.confidence === undefined ? {} : { confidence: strike.confidence });
    // Let go, as a hand does: a second Note-On with no Note-Off between is a key bounce to a MIDI source.
    h.release(strike.midi, { atMs: strike.at + 30 });
  }
  const last = model.steps[model.steps.length - 1];
  until((last?.onset ?? 0) * BEAT_MS + 4 * BEAT_MS);
  return { h, score: h.engine.state.score };
}

/** One strike of every written note, exactly on its step. */
function onTime(model: ScoreModel, except: readonly number[] = []): Strike[] {
  return model.steps.flatMap((step, index) =>
    except.includes(index) ? [] : step.notes.map((n) => ({ at: step.onset * BEAT_MS, midi: n.midi })),
  );
}

/** C D E F, one per beat. */
const melody = makeModel([60, 62, 64, 65].map((midi, onset) => ({ onset, notes: [note({ midi })] })));

/** Ten notes, so one extra key is a tenth of the credit. */
const tenNotes = makeModel([60, 62, 64, 65, 67, 69, 71, 72, 74, 76].map((midi, onset) => ({ onset, notes: [note({ midi })] })));

/** C C D E: the same pitch on two steps a beat apart, where a late strike has two homes to be read for. */
const repeated = makeModel([60, 60, 62, 64].map((midi, onset) => ({ onset, notes: [note({ midi })] })));

/** A C major triad, then D: a chord whose notes can arrive apart. */
const chordThenD = makeModel([
  { onset: 0, notes: [note({ midi: 60 }), note({ midi: 64 }), note({ midi: 67 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
]);

/** The key a tritone above `midi`: in none of these pieces. */
const tritone = (midi: number): number => midi + 6;

describe('a wrong key costs a note in Keep tempo', () => {
  it('a stray key beside every right note: accuracy 0 and no pass (was 100 % and a pass)', () => {
    const strikes = [
      ...onTime(melody),
      ...melody.steps.map((step) => ({ at: step.onset * BEAT_MS + 20, midi: tritone(step.notes[0]?.midi ?? 0) })),
    ];
    const { score } = keepTempo(melody, strikes);
    // Observed, and unchanged: every written note came in its window and four keys were extra.
    expect(score.hits).toBe(4);
    expect(score.wrongNotesTotal).toBe(4);
    expect(score.missedTotal).toBe(0);
    // The verdict: four notes right less four wrong keys.
    expect(score.accuracy).toBe(0);
    expect(evaluateOutcome(score).passed, 'a run full of extra keys passed').toBe(false);
  });

  it('the same playing in Wait for me scores 0 as well: the two modes now agree on a stray key', () => {
    const wait = harness(melody, { mode: 'wait', countInBars: 0 });
    wait.engine.start();
    for (const step of melody.steps) {
      wait.play(tritone(step.notes[0]?.midi ?? 0));
      wait.play(step.notes[0]?.midi ?? 0);
      wait.release(step.notes[0]?.midi ?? 0);
    }
    expect(wait.engine.state.score.accuracy).toBe(0);
    expect(wait.engine.state.score.stepOutcomes?.codes).toBe('wwww');
    const strikes = [
      ...onTime(melody),
      ...melody.steps.map((step) => ({ at: step.onset * BEAT_MS + 20, midi: tritone(step.notes[0]?.midi ?? 0) })),
    ];
    expect(keepTempo(melody, strikes).score.accuracy).toBe(wait.engine.state.score.accuracy);
  });

  it('one stray key among ten notes in time: 90 % in Keep tempo, the figure Wait gives the same playing', () => {
    const strikes = [...onTime(tenNotes), { at: 5 * BEAT_MS + 20, midi: tritone(69) }];
    const { score } = keepTempo(tenNotes, strikes);
    expect(score.hits).toBe(10);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(0.9, 9);

    const wait = harness(tenNotes, { mode: 'wait', countInBars: 0 });
    wait.engine.start();
    for (const [index, step] of tenNotes.steps.entries()) {
      const midi = step.notes[0]?.midi ?? 0;
      if (index === 5) wait.play(tritone(midi));
      wait.play(midi);
      wait.release(midi);
    }
    expect(wait.engine.state.score.accuracy).toBeCloseTo(0.9, 9);
    expect(score.accuracy).toBeCloseTo(wait.engine.state.score.accuracy, 9);
  });

  it('never below nought: more wrong keys than right notes is 0, not a negative accuracy', () => {
    const strikes = [
      ...onTime(melody),
      ...[100, 200, 300, 400, 500, 600, 700, 800, 900].map((at) => ({ at, midi: 99 })),
    ];
    const { score } = keepTempo(melody, strikes);
    expect(score.hits).toBe(4);
    expect(score.wrongNotesTotal).toBe(9);
    expect(score.accuracy).toBe(0);
  });

  it('the observed hit count stays the observed count: the record keeps it apart from the verdict', () => {
    const strikes = [...onTime(melody), { at: 20, midi: tritone(60) }, { at: 1020, midi: tritone(62) }];
    const { score } = keepTempo(melody, strikes);
    const measures = measuresOf(score, { heard: true, technique: null, pedalMeasurable: false, steps: [] });
    // `pitch.right` is what `tempo-notes` says it is: expected pitches struck inside their window.
    expect(measures.pitch).toMatchObject({ definition: 'tempo-notes', right: 4, of: 4 });
    // The accuracy is the verdict, net of the two wrong keys. A reader that divided `right` by `of` and
    // called it accuracy would read 100 % here.
    expect(score.accuracy).toBeCloseTo(2 / 4, 9);
    expect(score.accuracy).toBeLessThan(4 / 4);
    expect(score.hits).toBe(4);
  });

  it('a low-confidence guess from the microphone is shown and never charged', () => {
    const strikes = [...onTime(melody), { at: 20, midi: tritone(60), confidence: 0.7 }];
    const { score } = keepTempo(melody, strikes, { accuracyEstimated: true });
    expect(score.wrongNotesTotal).toBe(0);
    expect(score.accuracy).toBe(1);
    expect(score.accuracyEstimated).toBe(true);
  });

  it('a low-confidence guess at a missed note’s pitch is shown amber and stands for nothing: a sure strike of it after is still the late note', () => {
    // C D E F with D not played in time. The microphone guesses D at 250 ms past its window without being
    // sure, then hears it surely at 400. The guess is not charged, is not red, and has not used up the note.
    const strikes = [...onTime(melody, [1]), { at: 1 * BEAT_MS + 250, midi: 62, confidence: 0.7 }, { at: 1 * BEAT_MS + 400, midi: 62 }];
    const { h, score } = keepTempo(melody, strikes, { accuracyEstimated: true });
    const guess = h.of('noteJudged').find((e) => e.midi === 62 && e.uncertain === true);
    expect(guess, 'the guess was not shown as a guess').toBeDefined();
    expect(score.wrongNotesTotal).toBe(0);
    expect(score.missedTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
  });

  it('a sure wrong key from the microphone costs a note, and the figure stays labelled an estimate', () => {
    const strikes = [...onTime(melody), { at: 20, midi: tritone(60), confidence: 1 }];
    const { score } = keepTempo(melody, strikes, { accuracyEstimated: true });
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
    expect(score.accuracyEstimated).toBe(true);
  });

  it('rhythm only stays rhythm only: an extra tap costs the run no accuracy, and the run is still marked rhythm only', () => {
    const strikes = [...onTime(melody), { at: 500, midi: 99 }];
    const { score } = keepTempo(melody, strikes, { rhythmOnly: true });
    expect(score.rhythmOnly).toBe(true);
    // The tap between two windows is still recorded as an extra, as `05` §3a has always said ...
    expect(score.wrongNotesTotal).toBe(1);
    // ... and the figure is the share of the piece the learner was in time for.
    expect(score.accuracy).toBe(1);
  });

  it('rhythm only forgives the note and never the moment: the right pitch played after its window is still an extra tap, as `05` §3a says', () => {
    // The first step's own pitch, 250 ms after its window closed: in an ordinary run the late note of that
    // step, in a rhythm-only run a strike outside every window.
    const strikes = [...onTime(melody, [0]), { at: 250, midi: 60 }];
    const { score } = keepTempo(melody, strikes, { rhythmOnly: true });
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
  });
});

describe('a right note played late costs once', () => {
  it('a D a quarter beat past its window: one miss, and no wrong key (was a miss and a wrong key)', () => {
    const strikes = [...onTime(melody, [1]), { at: 1 * BEAT_MS + 250, midi: 62 }];
    const { score } = keepTempo(melody, strikes);
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal, 'the late D was charged as a wrong key as well').toBe(0);
    expect(score.stepOutcomes?.codes).toBe('hmhh');
    expect(score.stepOutcomes?.wrong, 'the late D was put against the step as a wrong mark').toEqual([]);
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
  });

  it('every right note 200 ms late with a 150 ms window: all missed, none wrong, accuracy 0 (the old case, restated)', () => {
    const strikes = onTime(melody).map((s) => ({ ...s, at: s.at + 200 }));
    const { score } = keepTempo(melody, strikes);
    expect(score.hits).toBe(0);
    expect(score.missedTotal).toBe(4);
    expect(score.wrongNotesTotal).toBe(0);
    expect(score.accuracy).toBe(0);
  });

  it('a second late strike of the same D is a wrong key: the exemption is once per missed note', () => {
    const strikes = [...onTime(melody, [1]), { at: 1 * BEAT_MS + 250, midi: 62 }, { at: 1 * BEAT_MS + 400, midi: 62 }];
    const { score } = keepTempo(melody, strikes);
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(2 / 4, 9);
  });

  it('a late strike while the window is still open on a tick not yet run is the same late note, once', () => {
    // Stamped 160 ms after D's step, 10 ms past its window, and delivered before the clock has moved on
    // to close it: no tick has run between the clock reaching 1160 and the strike.
    const h = harness(melody, { mode: 'tempo', countInBars: 0 });
    h.engine.start();
    h.play(60, { atMs: 0 });
    h.release(60, { atMs: 30 });
    h.advance(1 * BEAT_MS + 140);
    h.clock.set(1 * BEAT_MS + 160);
    h.play(62, { atMs: 1 * BEAT_MS + 160 });
    h.release(62, { atMs: 1 * BEAT_MS + 190 });
    h.advance(4 * BEAT_MS);
    const score = h.engine.state.score;
    // D, E and F were not played in time: three misses, and the late D is not a fourth thing.
    expect(score.missedTotal).toBe(3);
    expect(score.wrongNotesTotal).toBe(0);
    expect(score.stepOutcomes?.codes).toBe('hmmm');
  });

  it('played early and again on time is a hit and one extra key, and the extra now costs a note (was free)', () => {
    // D at 700 ms (early for its step), then again on the beat: the one on the beat is the note.
    const strikes = [
      ...onTime(melody),
      { at: 700, midi: 62 },
    ];
    const { score } = keepTempo(melody, strikes);
    expect(score.hits).toBe(4);
    expect(score.early ?? 0).toBe(0);
    expect(score.missedTotal).toBe(0);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
  });
});

describe('the exemption is bounded: it never forgives an unrelated key', () => {
  it('repeated same-pitch steps: a late C is the late note of the step it is nearest, not an early note of the next', () => {
    // C C D E. The learner misses the first C's window and plays a C 250 ms after it: 750 ms before the
    // second C asks for one. Both steps could be its home; the first is the nearer.
    const strikes = [...onTime(repeated, [0]), { at: 250, midi: 60 }];
    const { score } = keepTempo(repeated, strikes);
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal, 'the late C was held as an early C for the next step and then called an extra').toBe(0);
    expect(score.early ?? 0).toBe(0);
    expect(score.hits).toBe(3);
    expect(score.stepOutcomes?.codes).toBe('mhhh');
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
  });

  it('repeated same-pitch steps: two late Cs stand for the two missed Cs, one each, and a third is a wrong key', () => {
    const late = [
      { at: 250, midi: 60 },
      { at: 1250, midi: 60 },
    ];
    const twoLate = keepTempo(repeated, [...onTime(repeated, [0, 1]), ...late]).score;
    expect(twoLate.missedTotal).toBe(2);
    expect(twoLate.wrongNotesTotal).toBe(0);
    expect(twoLate.accuracy).toBeCloseTo(2 / 4, 9);
    const third = keepTempo(repeated, [...onTime(repeated, [0, 1]), ...late, { at: 1500, midi: 60 }]).score;
    expect(third.missedTotal).toBe(2);
    expect(third.wrongNotesTotal, 'a third C forgiven with both missed Cs already stood for').toBe(1);
    expect(third.accuracy).toBeCloseTo(1 / 4, 9);
  });

  it('a key whose pitch was missed, but a beat or more earlier, is a wrong key', () => {
    // C D E F with C never played. A C struck at 1.9 s is not C's late note: it is more than a beat after it.
    const { score } = keepTempo(melody, [...onTime(melody, [0]), { at: 1900, midi: 60 }]);
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo((3 - 1) / 4, 9);
  });

  it('a key whose pitch was already played right at its step is a wrong key, not a late note', () => {
    // C D E F all on time, then D again 300 ms after D's window closed: D's note was played.
    const { score } = keepTempo(melody, [...onTime(melody), { at: 1300, midi: 62 }]);
    expect(score.hits).toBe(4);
    expect(score.missedTotal).toBe(0);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
  });

  it('a key whose pitch appears in a later step beyond the early reach is a wrong key', () => {
    // C D E C: an extra C 300 ms after the first C was played. The last step asks for a C, 2.7 s ahead.
    const cDEC = makeModel([60, 62, 64, 60].map((midi, onset) => ({ onset, notes: [note({ midi })] })));
    const { score } = keepTempo(cDEC, [...onTime(cDEC), { at: 300, midi: 60 }]);
    expect(score.hits).toBe(4);
    expect(score.early ?? 0).toBe(0);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
  });

  it('a key a step does not ask for is a wrong key, however near its window', () => {
    const { score } = keepTempo(melody, [...onTime(melody, [1]), { at: 1 * BEAT_MS + 250, midi: 61 }]);
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal).toBe(1);
  });

  it('partial chord: the note that came late is the late note of the chord, once', () => {
    // C and E on the beat, G 250 ms after the window: one missed pitch, played late.
    const strikes = [
      { at: 0, midi: 60 },
      { at: 0, midi: 64 },
      { at: 250, midi: 67 },
      { at: 1000, midi: 62 },
    ];
    const { score } = keepTempo(chordThenD, strikes);
    expect(score.hits).toBe(3);
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal).toBe(0);
    expect(score.stepOutcomes?.codes).toBe('ph');
    expect(score.accuracy).toBeCloseTo(3 / 4, 9);
  });

  it('partial chord: a second late G is a wrong key, and so is a late G once the G was played in time', () => {
    const base = [
      { at: 0, midi: 60 },
      { at: 0, midi: 64 },
      { at: 1000, midi: 62 },
    ];
    const twoLate = keepTempo(chordThenD, [...base, { at: 250, midi: 67 }, { at: 400, midi: 67 }]).score;
    expect(twoLate.missedTotal).toBe(1);
    expect(twoLate.wrongNotesTotal).toBe(1);
    expect(twoLate.accuracy).toBeCloseTo((3 - 1) / 4, 9);
    const playedThenAgain = keepTempo(chordThenD, [...base, { at: 0, midi: 67 }, { at: 250, midi: 67 }]).score;
    expect(playedThenAgain.hits).toBe(4);
    expect(playedThenAgain.missedTotal).toBe(0);
    expect(playedThenAgain.wrongNotesTotal).toBe(1);
    expect(playedThenAgain.accuracy).toBeCloseTo(3 / 4, 9);
  });

  it('the strike that stood for a late note is still not a hit: nothing is credited for it', () => {
    const { score } = keepTempo(melody, [...onTime(melody, [1]), { at: 1 * BEAT_MS + 250, midi: 62 }]);
    expect(score.hits).toBe(3);
    expect(score.timing.n).toBe(3);
  });

  it('a late strike is not an observation of the step: the played note keeps no step, as a wrong key keeps none', () => {
    const { score } = keepTempo(melody, [...onTime(melody, [1]), { at: 1 * BEAT_MS + 250, midi: 62 }]);
    const late = score.notes.find((n) => n.midi === 62);
    expect(late).toBeDefined();
    expect(late?.ok).toBe(false);
    expect(late?.stepIndex).toBeNull();
  });

  it('each lap of a loop is its own: a late D that stood for lap one’s D does not use up lap two’s', () => {
    // C D looped, a D 250 ms late on both laps. The step indexes repeat every lap, so what a late strike
    // has stood for must be forgotten at the wrap, or lap two's late D finds its note already spoken for.
    const cd = makeModel([60, 62].map((midi, onset) => ({ onset, notes: [note({ midi })] })));
    const h = harness(cd, { mode: 'tempo', countInBars: 0, loop: { fromStep: 0, toStep: 1 } });
    h.engine.start();
    const until = (ms: number): void => {
      while (h.clock.now() < ms) {
        h.clock.set(Math.min(ms, h.clock.now() + 16));
        h.engine.tick();
      }
    };
    const strike = (midi: number, at: number): void => {
      until(at);
      h.play(midi);
      h.release(midi, { atMs: at + 30 });
    };
    strike(60, 0);
    strike(62, 1250);
    until(2100);
    expect(h.engine.state.loops).toBe(1);
    // Lap two's zero: where the music clock reads 0 again, after the one-beat gap.
    const zero = h.clock.now() - h.engine.musicMs;
    strike(60, zero);
    strike(62, zero + 1250);
    until(zero + 2100);
    expect(h.engine.state.loops).toBe(2);
    // Lap two's own population (CL11c): its C on time is the one hit, its late D the one miss.
    const score = h.of('finished').filter((event) => event.loop)[1]!.score;
    expect(score.hits).toBe(1);
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal, 'the second lap’s late D was charged as a wrong key').toBe(0);
  });
});

describe('where a wrong key is put', () => {
  it('an early strike that turns out to be an extra is put against the step it was struck at, not the step the on-time note matched', () => {
    // C at 0, D at 1000, E at 1500 (an eighth after D). The learner reads D as E: strikes E on D's beat, never
    // plays D, and plays E on its own beat. The early E is an extra (E then arrives in time), and it was struck
    // while reading step 1: that step is the one a reader of the record should find it against. Put against
    // step 2, where the on-time E matched, it charged a step the learner read right.
    const misread = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 1, notes: [note({ midi: 62 })] },
      { onset: 1.5, notes: [note({ midi: 64 })] },
    ]);
    const { score } = keepTempo(misread, [
      { at: 0, midi: 60 },
      { at: 1 * BEAT_MS, midi: 64 },
      { at: 1.5 * BEAT_MS, midi: 64 },
    ]);
    expect(score.hits).toBe(2);
    expect(score.missedTotal).toBe(1);
    expect(score.wrongNotesTotal).toBe(1);
    expect(score.stepOutcomes?.codes).toBe('hmh');
    expect(score.stepOutcomes?.wrong, 'the extra was put against the step the on-time note matched').toEqual([1, 64]);
    expect(score.accuracy).toBeCloseTo((2 - 1) / 3, 9);
  });

  it('a stray key is put against the step nearest it in time, as it always was', () => {
    const { score } = keepTempo(melody, [...onTime(melody), { at: 1 * BEAT_MS + 100, midi: 99 }]);
    expect(score.stepOutcomes?.wrong).toEqual([1, 99]);
  });
});

describe('the record a wrong key leaves', () => {
  it('measuresOf is unchanged for Wait and for a run nothing heard', () => {
    const wait = harness(melody, { mode: 'wait', countInBars: 0 });
    wait.engine.start();
    for (const step of melody.steps) {
      wait.play(step.notes[0]?.midi ?? 0);
      wait.release(step.notes[0]?.midi ?? 0);
    }
    const waitScore = wait.engine.state.score;
    expect(measuresOf(waitScore, { heard: true, technique: null, pedalMeasurable: false, steps: [] }).pitch).toMatchObject({
      definition: 'wait-steps',
      right: 4,
      of: 4,
    });
    expect(measuresOf(waitScore, { heard: false, technique: null, pedalMeasurable: false, steps: [] }).pitch).toBe(NOT_MEASURED);
  });
});
