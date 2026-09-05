// Tempo mode — the docs/05 §10 matrix. The clock drives; input is judged
// against a fixed timetable.
import { describe, expect, it } from 'vitest';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';

/** C D E F, one per beat at 60 bpm, so steps land at 0/1000/2000/3000 ms. */
const melody = makeModel([
  { onset: 0, notes: [note({ midi: 60 })] },
  { onset: 1, notes: [note({ midi: 62 })] },
  { onset: 2, notes: [note({ midi: 64 })] },
  { onset: 3, notes: [note({ midi: 65 })] },
]);

/** No count-in, so music time equals clock time and the arithmetic is legible. */
const noCountIn = { mode: 'tempo', countInBars: 0 } as const;

describe('Tempo mode — the clock drives the cursor', () => {
  it('advances on the timetable whether or not anything is played', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.advance(3.5 * BEAT_MS);
    expect(h.of('stepAdvanced').map((e) => e.to)).toEqual([1, 2, 3]);
    expect(h.of('noteJudged')).toEqual([]);
  });

  it('a count-in of one bar delays step 0 by four beats', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 1 });
    h.engine.start();
    h.advance(3.9 * BEAT_MS);
    expect(h.of('stepAdvanced')).toEqual([]);
    h.advance(1.2 * BEAT_MS);
    expect(h.of('stepAdvanced').map((e) => e.to)).toEqual([1]);
  });

  it('emits a tick per beat, marking the count-in ones', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 1 });
    h.engine.start();
    h.advance(4 * BEAT_MS + 10);
    const ticks = h.of('tempoTick');
    expect(ticks.slice(0, 4).map((t) => [t.bar, t.beat, t.isCountIn])).toEqual([
      [0, 1, true],
      [0, 2, true],
      [0, 3, true],
      [0, 4, true],
    ]);
    expect(ticks[4]).toMatchObject({ bar: 1, beat: 1, isCountIn: false });
  });

  it('finishes after the last step has sounded', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.advance(4.2 * BEAT_MS);
    expect(h.of('finished')).toHaveLength(1);
    expect(h.engine.state.finished).toBe(true);
  });
});

describe('Tempo mode — judging', () => {
  it('a perfect run hits every slot with a delta of zero', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    for (const [i, midi] of [60, 62, 64, 65].entries()) {
      h.clock.set(i * BEAT_MS);
      h.engine.tick();
      h.play(midi);
    }
    h.advance(1.5 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.hits).toBe(4);
    expect(score.missedTotal).toBe(0);
    expect(score.wrongNotesTotal).toBe(0);
    expect(score.accuracy).toBe(1);
    expect(score.timing.meanMs).toBeCloseTo(0, 6);
  });

  it('every note 100 ms late: all hits, mean +100', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    for (const [i, midi] of [60, 62, 64, 65].entries()) {
      h.clock.set(i * BEAT_MS + 100);
      h.engine.tick();
      h.play(midi);
    }
    h.advance(1.5 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.hits).toBe(4);
    expect(score.missedTotal).toBe(0);
    expect(score.timing.meanMs).toBeCloseTo(100, 6);
    expect(score.timing.latePct).toBe(100);
    expect(score.timing.earlyPct).toBe(0);
  });

  it('200 ms late with a 150 ms tolerance: all missed, and the notes are wrong', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    for (const [i, midi] of [60, 62, 64, 65].entries()) {
      h.clock.set(i * BEAT_MS + 200);
      h.engine.tick();
      h.play(midi);
    }
    h.advance(1.5 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.hits).toBe(0);
    expect(score.missedTotal).toBe(4);
    // The window had already closed, so each note matched nothing.
    expect(score.wrongNotesTotal).toBe(4);
    expect(score.accuracy).toBe(0);
  });

  it('early counts too, with a negative delta', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.clock.set(BEAT_MS - 120);
    h.engine.tick();
    h.play(62);
    h.advance(4 * BEAT_MS);
    const judged = h.of('noteJudged').filter((e) => e.ok);
    expect(judged[0]?.deltaMs).toBeCloseTo(-120, 6);
    expect(h.engine.state.score.timing.earlyPct).toBe(100);
  });

  it('an extra note that matches nothing is wrong', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.play(99);
    expect(h.engine.state.score.wrongNotesTotal).toBe(1);
    expect(h.of('noteJudged')[0]?.ok).toBe(false);
  });

  it('a note played at exactly the tolerance still counts', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.clock.set(150);
    h.engine.tick();
    h.play(60);
    expect(h.engine.state.score.hits).toBe(1);
  });

  it('emits missed once the window closes, naming the pitch', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.advance(1.5 * BEAT_MS);
    const missed = h.of('missed');
    expect(missed[0]).toMatchObject({ stepIndex: 0, midi: 60 });
    expect(missed[0]?.noteIds).toHaveLength(1);
  });

  it('matches a note to the nearest slot expecting it', () => {
    // The same pitch on beats 0 and 2; a note near beat 2 must not be
    // credited to the slot at beat 0.
    const repeated = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 1, notes: [note({ midi: 62 })] },
      { onset: 2, notes: [note({ midi: 60 })] },
    ]);
    const h = harness(repeated, noCountIn);
    h.engine.start();
    h.clock.set(2 * BEAT_MS + 20);
    h.engine.tick();
    h.play(60);
    const hit = h.of('noteJudged').find((e) => e.ok);
    expect(hit?.stepIndex).toBe(2);
    expect(hit?.deltaMs).toBeCloseTo(20, 6);
  });

  it('subtracts the measured input latency before judging', () => {
    const h = harness(melody, { ...noCountIn, inputLatencyMs: 90 });
    h.engine.start();
    // The learner played on the beat; the cable delivered it 90 ms later.
    h.clock.set(90);
    h.engine.tick();
    h.play(60, { atMs: 90 });
    const hit = h.of('noteJudged').find((e) => e.ok);
    expect(hit?.deltaMs).toBeCloseTo(0, 6);
  });

  it('a chord counts as one hit per pitch', () => {
    const chord = makeModel([
      { onset: 0, notes: [note({ midi: 60 }), note({ midi: 64 }), note({ midi: 67 })] },
    ]);
    const h = harness(chord, noCountIn);
    h.engine.start();
    for (const midi of [60, 64, 67]) h.play(midi);
    h.advance(2 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.expectedNotes).toBe(3);
    expect(score.hits).toBe(3);
    expect(score.accuracy).toBe(1);
  });

  it('a half-played chord scores the pitches that arrived and misses the rest', () => {
    const chord = makeModel([
      { onset: 0, notes: [note({ midi: 60 }), note({ midi: 64 }), note({ midi: 67 })] },
    ]);
    const h = harness(chord, noCountIn);
    h.engine.start();
    h.play(60);
    h.play(64);
    h.advance(2 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.hits).toBe(2);
    expect(score.missedTotal).toBe(1);
    expect(score.accuracy).toBeCloseTo(2 / 3, 6);
  });
});

describe('Tempo mode — tempo percentage', () => {
  it('practising at 50 % doubles every interval', () => {
    const h = harness(melody, { ...noCountIn, tempoPct: 50 });
    h.engine.start();
    h.advance(1.5 * BEAT_MS);
    // At half speed, beat 1 falls at 2000 ms, so nothing has advanced yet.
    expect(h.of('stepAdvanced')).toEqual([]);
    h.advance(1 * BEAT_MS);
    expect(h.of('stepAdvanced').map((e) => e.to)).toEqual([1]);
  });

  it('clamps a silly tempo into the slider range', () => {
    const slow = harness(melody, { ...noCountIn, tempoPct: 1 });
    expect(slow.engine.prepared.options.tempoPct).toBe(30);
    const fast = harness(melody, { ...noCountIn, tempoPct: 900 });
    expect(fast.engine.prepared.options.tempoPct).toBe(130);
  });
});

describe('Tempo mode — hand filter and empty steps', () => {
  it('passes through a filtered-out step instead of skipping it', () => {
    // docs/05 §1.1: unlike Wait mode, Tempo keeps the cursor moving through
    // steps the hand filter emptied, so the display stays with the music.
    const twoHands = makeModel([
      { onset: 0, notes: [note({ midi: 72, hand: 'R' })] },
      { onset: 1, notes: [note({ midi: 48, hand: 'L' })] },
      { onset: 2, notes: [note({ midi: 74, hand: 'R' })] },
    ]);
    const h = harness(twoHands, { ...noCountIn, hands: 'R' });
    h.engine.start();
    h.advance(3 * BEAT_MS);
    expect(h.of('stepAdvanced').map((e) => e.to)).toEqual([1, 2]);
    // Only the two right-hand steps count, and only they can be missed: the
    // left-hand step is a placeholder the cursor passes through.
    expect(h.engine.state.score.totalSteps).toBe(2);
    expect(h.engine.state.score.missedTotal).toBe(2);
    expect(h.of('missed').map((e) => e.stepIndex)).toEqual([0, 2]);
  });
});

describe('Listen mode', () => {
  it('moves like Tempo but judges nothing', () => {
    const h = harness(melody, { mode: 'listen', countInBars: 0 });
    h.engine.start();
    h.play(99);
    h.advance(3.5 * BEAT_MS);
    expect(h.of('stepAdvanced').map((e) => e.to)).toEqual([1, 2, 3]);
    expect(h.of('noteJudged')).toEqual([]);
    expect(h.engine.state.score.wrongNotesTotal).toBe(0);
  });
});

describe('Free mode', () => {
  it('records what was played and never moves a cursor', () => {
    const h = harness(melody, { mode: 'free' });
    h.engine.start();
    h.play(60, { velocity: 80 });
    h.play(67, { velocity: 100 });
    h.advance(5 * BEAT_MS);
    expect(h.of('stepAdvanced')).toEqual([]);
    const notes = h.engine.state.score.notes;
    expect(notes.map((n) => [n.midi, n.velocity])).toEqual([
      [60, 80],
      [67, 100],
    ]);
    expect(notes.every((n) => n.stepIndex === null)).toBe(true);
  });
});

describe('Tempo mode — loops', () => {
  it('restarts on the grid and keeps counting laps', () => {
    const h = harness(melody, { ...noCountIn, loop: { fromStep: 0, toStep: 1 } });
    h.engine.start();
    h.advance(2.2 * BEAT_MS);
    expect(h.of('finished').filter((e) => e.loop)).toHaveLength(1);
    expect(h.engine.state.step).toBe(0);
    expect(h.engine.state.finished).toBe(false);
    h.advance(3.5 * BEAT_MS);
    expect(h.engine.state.loops).toBeGreaterThanOrEqual(2);
  });
});
