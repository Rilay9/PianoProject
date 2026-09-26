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

  /**
   * `SessionScore.correctSteps` says "Wait: completed cleanly. Tempo: every
   * expected pitch hit in time" (`engine/types.ts`), and in Tempo it was
   * always nought — on this run and on all 1,982 catalog scores (T24).
   *
   * The intent was in the code and in the wrong place: `closeSlotAsMissed`
   * carried `if (pitches.size === 0) this.correctSteps += 1`, which cannot
   * fire, because `feedTempo` deletes a slot the moment its last pitch
   * arrives, so nothing empty ever reaches the closer. A step is completed
   * where it is completed, which is at the note that finishes it.
   */
  it('counts a step completed in time, which is what `correctSteps` says it counts', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    for (const [i, midi] of [60, 62, 64, 65].entries()) {
      h.clock.set(i * BEAT_MS);
      h.engine.tick();
      h.play(midi);
    }
    h.advance(1.5 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.correctSteps).toBe(score.totalSteps);
  });

  it('counts only the steps that were completed, not the ones that were missed', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    // The third note is never played, so its window closes with a pitch still
    // in it and that step is not one of the ones that came out right.
    for (const [i, midi] of [60, 62, 64, 65].entries()) {
      h.clock.set(i * BEAT_MS);
      h.engine.tick();
      if (midi !== 64) h.play(midi);
    }
    h.advance(1.5 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.totalSteps).toBe(4);
    expect(score.correctSteps).toBe(3);
    expect(score.missedTotal).toBe(1);
  });

  it('a chord counts once, and only when every pitch of it arrived', () => {
    const chords = makeModel([
      { onset: 0, notes: [note({ midi: 60 }), note({ midi: 64 }), note({ midi: 67 })] },
      { onset: 1, notes: [note({ midi: 62 }), note({ midi: 65 })] },
    ]);
    const h = harness(chords, noCountIn);
    h.engine.start();
    h.engine.tick();
    for (const midi of [60, 64, 67]) h.play(midi);
    h.clock.set(BEAT_MS);
    h.engine.tick();
    h.play(62); // and not 65
    h.advance(2 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.totalSteps).toBe(2);
    expect(score.correctSteps).toBe(1);
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

  it('a bouncing key does not turn one correct strike into a hit plus a wrong note', () => {
    // A cheap contact can fire twice for one physical strike, with no
    // Note-Off between the two Note-Ons — the key never came up. Without a
    // guard, the first Note-On matches the slot and the second finds it
    // already closed and is scored as an extra wrong note, docking a run that
    // was actually played correctly.
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.play(60, { atMs: 0 });
    h.play(60, { atMs: 3 }); // the bounce: same key, no release in between
    h.advance(1.5 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.hits).toBe(1);
    expect(score.wrongNotesTotal).toBe(0);
  });

  it('but a genuine repeated note — released, then struck again — is judged twice', () => {
    const repeated = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 1, notes: [note({ midi: 60 })] },
    ]);
    const h = harness(repeated, noCountIn);
    h.engine.start();
    h.play(60, { atMs: 0 });
    h.release(60, { atMs: 20 });
    h.play(60, { atMs: BEAT_MS });
    h.advance(1.5 * BEAT_MS);
    const score = h.engine.state.score;
    expect(score.hits).toBe(2);
    expect(score.wrongNotesTotal).toBe(0);
  });

  it('attributes a mistimed wrong note to the bar its timing is nearest, not the cursor', () => {
    // Bar 1 has one note at beat 0; bar 2 has one at beat 4 (4 beats/bar).
    // `openUpcomingSlots` opens bar 2's window at beat 4 minus the 150 ms
    // tolerance — 3850 ms — well before the cursor (`this.step`) advances to
    // it, which only happens once the clock actually reaches 4000 ms. A wrong
    // note struck at 3900 ms is inside bar 2's own open window and 100 ms from
    // its note, against 3900 ms from bar 1's — so it belongs to bar 2, not to
    // whichever bar the cursor is still displaying.
    const twoBars = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 4, notes: [note({ midi: 62 })] },
    ]);
    const h = harness(twoBars, noCountIn);
    h.engine.start();
    h.clock.set(3900);
    h.engine.tick();
    expect(h.engine.state.step).toBe(0); // the cursor has not crossed into bar 2 yet
    h.play(99, { atMs: 3900 });
    h.advance(2 * BEAT_MS);
    // Bar 2's own note (62) is also never played, so it is missed as well as
    // wronged; the point of the test is which bar the *wrong* note lands on.
    expect(h.engine.state.score.hotSpots).toContainEqual({
      measureIndex: 1,
      misses: 1,
      wrongs: 1,
    });
    expect(h.engine.state.score.hotSpots).toContainEqual({
      measureIndex: 0,
      misses: 1,
      wrongs: 0,
    });
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
    // Nor on the clock (L42). "Judges nothing" was held on the input path
    // only, and every window closed as a miss, so a demonstration painted the
    // notes it was playing red.
    expect(h.of('missed')).toEqual([]);
    expect(h.engine.state.score.missedTotal).toBe(0);
  });
});

/**
 * A Keep tempo run with no input judging it (L42; `05` §3: "Judging input
 * (only if any input source is active)", and "without any input source,
 * Tempo mode simply plays/moves"). The engine closed every window as missed
 * whatever was listening, and the session painted each one red and flashed
 * its key, behind a sheet that said the run was not measured.
 */
describe('A Keep tempo run nothing is judging (L42)', () => {
  it('moves on the timetable and finishes, and judges no miss', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 0, judging: false });
    h.engine.start();
    h.advance(4.5 * BEAT_MS);
    expect(h.of('stepAdvanced').map((e) => e.to)).toEqual([1, 2, 3]);
    expect(h.of('finished')).toHaveLength(1);
    expect(h.of('missed'), 'a note nobody was listening for was judged missed').toEqual([]);
    const score = h.engine.state.score;
    expect(score.missedTotal).toBe(0);
    expect(score.hotSpots).toEqual([]);
    // Nothing was decided at any step, so the score keeps no step outcomes:
    // not a row of misses, and not a row of steps "not reached" either.
    expect(score.stepOutcomes).toBeUndefined();
  });

  it('keeps the same clock as a judged run: the cursor, the ticks and the end', () => {
    const judged = harness(melody, { mode: 'tempo', countInBars: 1 });
    const unjudged = harness(melody, { mode: 'tempo', countInBars: 1, judging: false });
    for (const h of [judged, unjudged]) {
      h.engine.start();
      h.advance(8.5 * BEAT_MS);
    }
    const shape = (h: typeof judged): unknown => ({
      steps: h.of('stepAdvanced').map((e) => [e.to, e.tMs]),
      ticks: h.of('tempoTick').map((e) => [e.bar, e.beat, e.tMs]),
      finished: h.of('finished').map((e) => e.tMs),
    });
    expect(shape(unjudged)).toEqual(shape(judged));
  });

  it('a judged run still misses what was not played', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 0, judging: true });
    h.engine.start();
    h.advance(4.5 * BEAT_MS);
    expect(h.of('missed')).toHaveLength(4);
  });
});

describe('Free mode', () => {
  it('turns the page on the notes of the piece and marks nothing (08 §7.4)', () => {
    const h = harness(melody, { mode: 'free' });
    h.engine.start();
    // The first note of the piece: the page moves on.
    h.play(60, { velocity: 80 });
    expect(h.of('stepAdvanced').map((e) => [e.from, e.to])).toEqual([[0, 1]]);
    // A note that is not the one the page is on: nothing at all.
    h.play(67, { velocity: 100 });
    h.advance(5 * BEAT_MS);
    expect(h.of('stepAdvanced')).toHaveLength(1);
    expect(h.of('noteJudged')).toEqual([]);
    expect(h.of('missed')).toEqual([]);
    // Nothing is recorded, nothing is counted.
    const notes = h.engine.state.score.notes;
    expect(notes).toEqual([]);
    expect(h.engine.state.score.wrongNotesTotal).toBe(0);
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

/**
 * Two drivers for one clock (decision 9, P21 §C).
 *
 * `ScoreSession` ticks the engine from an animation frame *and* from a 25 ms
 * interval, because frames are starved in a page that is not being composited
 * — a background tab, a phone with the screen off, or a Playwright worker
 * sharing a machine with nine others. That is only safe if a second `tick()`
 * at the same instant does nothing, which is what these say.
 */
describe('the clock survives two drivers', () => {
  it('ticking twice at the same time emits one beat, not two', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.advance(2.5 * BEAT_MS);
    const beats = h.of('tempoTick').length;
    expect(beats).toBeGreaterThan(0);

    // The interval and the frame landing on the same millisecond.
    h.engine.tick();
    h.engine.tick();
    h.engine.tick();
    expect(h.of('tempoTick')).toHaveLength(beats);
  });

  it('and neither does it advance the cursor twice', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.advance(1.5 * BEAT_MS);
    const advances = h.of('stepAdvanced').map((e) => e.to);
    h.engine.tick();
    h.engine.tick();
    expect(h.of('stepAdvanced').map((e) => e.to)).toEqual(advances);
  });

  /**
   * The other half of decision 9: a page that is hidden pauses, and the time
   * away is not practice. `durationMs` is what the run is recorded with
   * (`ScoreScreen` hands it to `recordRun`), so this is the number that must
   * not include the phone call.
   */
  it('a run paused for a while records the playing, not the waiting', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.advance(2 * BEAT_MS);

    h.engine.pause();
    expect(h.of('paused')).toHaveLength(1);
    // Forty seconds away — the clock moves, the run does not.
    h.clock.advanceBy(40_000);
    h.engine.tick();
    h.engine.resume();
    expect(h.of('resumed')).toHaveLength(1);

    h.advance(2 * BEAT_MS);
    const finished = h.of('finished')[0];
    const duration = finished ? finished.score.durationMs : h.engine.elapsedMs;
    // Four beats of music, not four beats plus forty seconds.
    expect(duration).toBeGreaterThanOrEqual(4 * BEAT_MS - 100);
    expect(duration, 'the time away was counted as practice').toBeLessThan(4 * BEAT_MS + 500);
  });

  it('and the cursor is where it was left, not where the wall clock says', () => {
    const h = harness(melody, noCountIn);
    h.engine.start();
    h.advance(1.2 * BEAT_MS);
    const step = h.engine.state.step;

    h.engine.pause();
    h.clock.advanceBy(40_000);
    h.engine.tick();
    expect(h.engine.state.step, 'it caught up silently while hidden').toBe(step);
    h.engine.resume();
    h.engine.tick();
    expect(h.engine.state.step).toBe(step);
  });
});

// --- T8: the learner's first note starts the clock --------------------------

/** Right hand on beats 1 and 2; the left hand alone on beat 0. */
const leftHandFirst = makeModel([
  { onset: 0, notes: [note({ midi: 48, hand: 'L' })] },
  { onset: 1, notes: [note({ midi: 60 })] },
  { onset: 2, notes: [note({ midi: 62 })] },
]);

describe('Tempo mode — the latch (T8)', () => {
  const latched = { mode: 'tempo', countInBars: 1, latchStart: true } as const;
  const countInMs = 4 * BEAT_MS;

  it('holds on the first note when the count-in ends with nothing played', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs + 3 * BEAT_MS);
    expect(h.of('armed')).toHaveLength(1);
    expect(h.engine.state.armed).toBe(true);
    // Nothing moved and nothing was marked missed while it held.
    expect(h.engine.state.step).toBe(0);
    expect(h.of('missed')).toEqual([]);
    expect(h.engine.musicMs).toBe(0);
  });

  it('a late first note is on time, and so is every note measured from it', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs + 700);
    h.play(60);
    expect(h.of('latched')).toHaveLength(1);
    h.clock.set(h.clock.now() + BEAT_MS);
    h.engine.tick();
    h.play(62);
    const deltas = h.of('noteJudged').map((e) => e.deltaMs);
    expect(deltas).toEqual([0, 0]);
    expect(h.engine.state.armed).toBe(false);
  });

  it('a first note inside its window while counting in sets the clock without holding', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs - 100);
    h.play(60);
    h.clock.set(h.clock.now() + BEAT_MS);
    h.engine.tick();
    h.play(62);
    expect(h.of('armed')).toEqual([]);
    expect(h.of('noteJudged').map((e) => [e.ok, e.deltaMs])).toEqual([
      [true, 0],
      [true, 0],
    ]);
  });

  it('a note before the first note’s window is a stray: not judged, and the latch still waits', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(2 * BEAT_MS);
    h.play(64);
    expect(h.of('noteJudged')).toEqual([]);
    expect(h.engine.state.score.wrongNotesTotal).toBe(0);
    expect(h.engine.holdingFrom).toBe(0);
  });

  it('any key starts it once it is holding, and a wrong one is still marked wrong', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs + 200);
    h.play(61);
    expect(h.of('latched')).toHaveLength(1);
    expect(h.of('noteJudged').map((e) => e.ok)).toEqual([false]);
  });

  it('with no count-in it holds from the start, on the first note the learner plays', () => {
    const h = harness(leftHandFirst, { mode: 'tempo', countInBars: 0, hands: 'R', latchStart: true });
    h.engine.start();
    expect(h.of('armed')).toHaveLength(1);
    // The cursor waits on the right hand's note, not on the left hand's beat.
    expect(h.engine.state.step).toBe(1);
    h.advance(2 * BEAT_MS);
    h.play(60);
    expect(h.of('noteJudged').map((e) => [e.ok, e.deltaMs])).toEqual([[true, 0]]);
  });

  it('removes the input latency from the latching note, as from every other', () => {
    const h = harness(melody, { ...latched, inputLatencyMs: 40 });
    h.engine.start();
    h.advance(countInMs + 500);
    h.play(60);
    h.clock.set(h.clock.now() + BEAT_MS);
    h.engine.tick();
    h.play(62);
    expect(h.of('noteJudged').map((e) => e.deltaMs)).toEqual([0, 0]);
    expect(h.of('latched')[0]?.tMs).toBe(h.clock.now() - BEAT_MS - 40);
  });

  it('does not count time spent holding as practice', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs);
    const heldFor = 5 * BEAT_MS;
    h.advance(heldFor);
    const beforeLatch = h.clock.now();
    h.play(60);
    h.advance(4.5 * BEAT_MS);
    const finished = h.of('finished')[0];
    expect(finished).toBeDefined();
    // Count-in plus the music, and not the holding.
    expect(finished!.score.durationMs).toBe(finished!.tMs - beforeLatch + countInMs);
  });

  it('a loop latches once; later laps keep time without holding again', () => {
    const h = harness(melody, { ...latched, loop: { fromStep: 0, toStep: 3 } });
    h.engine.start();
    h.advance(countInMs + 300);
    h.play(60);
    h.advance(20 * BEAT_MS);
    expect(h.engine.state.loops).toBeGreaterThanOrEqual(2);
    expect(h.of('armed')).toHaveLength(1);
    expect(h.of('latched')).toHaveLength(1);
  });

  it('a run that is never latched moves on the timer exactly as before', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 1 });
    h.engine.start();
    h.advance(countInMs + 1.5 * BEAT_MS);
    expect(h.of('armed')).toEqual([]);
    expect(h.of('stepAdvanced').map((e) => e.to)).toEqual([1]);
    expect(h.engine.holdingFrom).toBeNull();
  });

  it('puts the next beat, and its place in the bar, where the engine’s own ticks fall', () => {
    const h = harness(melody, latched);
    h.engine.start();
    // Step 1 sounds on beat 2 of bar 1; the beat after it is beat 3.
    expect(h.engine.nextBeatAfter(1 * BEAT_MS)).toEqual({ musicMs: 2 * BEAT_MS, beatInBar: 3 });
    expect(h.engine.nextBeatAfter(3 * BEAT_MS)).toEqual({ musicMs: 4 * BEAT_MS, beatInBar: 1 });
  });
});

// --- The clock under a loop that starts mid-piece ---------------------------

/** Eight beats, one note each, so step N sounds at N seconds. */
const eightBeats = makeModel(
  [0, 1, 2, 3, 4, 5, 6, 7].map((beat) => ({ onset: beat, notes: [note({ midi: 60 + beat })] })),
);

describe('Tempo mode — a loop that starts partway through the piece', () => {
  it('counts in straight to the loop, not to bar 1', () => {
    const h = harness(eightBeats, { mode: 'tempo', countInBars: 1, loop: { fromStep: 6, toStep: 7 } });
    h.engine.start();
    // Four beats of count-in, then the loop's first note — not the six
    // seconds bars 1 and 2 would have taken first.
    h.advance(4 * BEAT_MS);
    h.play(66);
    expect(h.of('noteJudged').map((e) => [e.ok, e.deltaMs])).toEqual([[true, 0]]);
  });

  it('numbers the count-in and the loop’s own bar from the loop', () => {
    const h = harness(eightBeats, { mode: 'tempo', countInBars: 1, loop: { fromStep: 4, toStep: 7 } });
    h.engine.start();
    h.advance(4 * BEAT_MS + 10);
    const ticks = h.of('tempoTick');
    expect(ticks.map((t) => t.isCountIn)).toEqual([true, true, true, true, false]);
    expect(ticks[4]).toMatchObject({ bar: 1, beat: 1 });
  });

  it('keeps counting the run’s duration across laps', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 0, loop: { fromStep: 0, toStep: 3 } });
    h.engine.start();
    const wall = 30 * BEAT_MS;
    h.advance(wall);
    expect(h.engine.state.loops).toBeGreaterThanOrEqual(2);
    h.engine.stop();
    const final = h.of('finished').filter((e) => !e.loop).pop();
    // It used to restart at every lap, and came out negative.
    expect(final?.score.durationMs).toBe(wall);
  });
});

// --- T8: resuming counts back in, on the grid --------------------------------

describe('Tempo mode — resuming after a pause (T8)', () => {
  const bar = 4 * BEAT_MS;

  /** Plays C on time, lets D go by, and pauses half a beat after it. */
  function pausedAfterD() {
    const h = harness(melody, { mode: 'tempo', countInBars: 0 });
    h.engine.start();
    h.play(60);
    h.advance(1.5 * BEAT_MS);
    h.engine.pause();
    h.clock.set(h.clock.now() + 5 * BEAT_MS);
    return h;
  }

  it('counts one bar back in to the next note still to be played, on the grid', () => {
    const h = pausedAfterD();
    // D went by unplayed and its window has closed, so the run resumes at E.
    expect(h.engine.resumesAt).toBe(2);
    const ticksBefore = h.of('tempoTick').length;
    h.engine.resume({ recountMs: bar });
    h.advance(bar - 1);
    const recount = h.of('tempoTick').slice(ticksBefore);
    // Four clicks of count-in, numbered where they fall in the bar: E is beat 3.
    expect(recount.map((t) => [t.beat, t.isCountIn])).toEqual([
      [3, true],
      [4, true],
      [1, true],
      [2, true],
    ]);
    h.advance(1);
    h.play(64);
    expect(h.of('noteJudged').pop()).toMatchObject({ ok: true, deltaMs: 0 });
  });

  it('resumes at the note under the cursor when it has not been played yet', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 0 });
    h.engine.start();
    h.play(60);
    h.advance(1.1 * BEAT_MS);
    h.engine.pause();
    // D's window is still open and nothing has been struck in it.
    expect(h.engine.resumesAt).toBe(1);
  });

  it('holds for the first note after the count, when asked to latch', () => {
    const h = pausedAfterD();
    h.engine.resume({ recountMs: bar, latch: true });
    h.advance(bar + 2 * BEAT_MS);
    expect(h.engine.state.armed).toBe(true);
    expect(h.engine.state.step).toBe(2);
    h.play(64);
    expect(h.of('noteJudged').pop()).toMatchObject({ ok: true, deltaMs: 0 });
    expect(h.engine.state.armed).toBe(false);
  });

  it('a plain resume carries on exactly as before', () => {
    const h = pausedAfterD();
    h.engine.resume();
    // Half a beat later E is due, with no count.
    h.advance(0.5 * BEAT_MS);
    h.play(64);
    expect(h.of('noteJudged').pop()).toMatchObject({ ok: true, deltaMs: 0 });
  });
});

// --- T8 review: holding, pausing, stopping, ticking, resuming ----------------

describe('Tempo mode — the latch, reviewed (T8)', () => {
  const latched = { mode: 'tempo', countInBars: 1, latchStart: true } as const;
  const countInMs = 4 * BEAT_MS;
  const bar = 4 * BEAT_MS;

  it('holds as the count ends and skips a silent opening, rather than counting through it', () => {
    const h = harness(leftHandFirst, { ...latched, hands: 'R', playbackHands: 'none' } as never);
    h.engine.start();
    h.advance(countInMs);
    expect(h.engine.state.armed).toBe(true);
    // The cursor is on the right hand's note, a beat into the piece.
    expect(h.engine.state.step).toBe(1);
    h.play(60);
    h.clock.set(h.clock.now() + BEAT_MS);
    h.engine.tick();
    h.play(62);
    expect(h.of('noteJudged').map((e) => [e.ok, e.deltaMs])).toEqual([
      [true, 0],
      [true, 0],
    ]);
  });

  it('practice time does not grow while holding', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs);
    const atHold = h.engine.elapsedMs;
    h.advance(3 * BEAT_MS);
    expect(h.engine.elapsedMs).toBe(atHold);
  });

  it('a pause while holding is idle once, and the run is still holding after it', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs + 1000);
    h.engine.pause();
    h.clock.set(h.clock.now() + 5000);
    h.engine.resume({ recountMs: bar });
    expect(h.engine.state.armed).toBe(true);
    // Resuming while holding counts nothing back in: the hold carries on.
    const ticksBefore = h.of('tempoTick').length;
    h.advance(2000);
    expect(h.of('tempoTick').length).toBe(ticksBefore);
    expect(h.engine.elapsedMs).toBe(countInMs);
    const latchAt = h.clock.now();
    h.play(60);
    h.advance(4.5 * BEAT_MS);
    const finished = h.of('finished')[0];
    expect(finished!.score.durationMs).toBe(countInMs + (finished!.tMs - latchAt));
  });

  it('a stop while holding records only the count-in, and leaves nothing waiting', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs + 3000);
    h.engine.stop();
    expect(h.of('finished')[0]!.score.durationMs).toBe(countInMs);
    expect(h.engine.holdingFrom).toBeNull();
    expect(h.engine.state.armed).toBe(false);
  });

  it('ticks every beat once around the hold: none twice, none skipped', () => {
    const h = harness(melody, latched);
    h.engine.start();
    h.advance(countInMs + 2000);
    // Holding: the count's four beats, and not the first note's own.
    expect(h.of('tempoTick').map((t) => [t.bar, t.beat])).toEqual([
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ]);
    h.play(60);
    h.advance(2.5 * BEAT_MS);
    expect(h.of('tempoTick').slice(4).map((t) => [t.bar, t.beat])).toEqual([
      [1, 1],
      [1, 2],
      [1, 3],
    ]);
  });

  it('a beat skipped with a silent opening is never ticked, and the first note’s beat is ticked once', () => {
    // No count-in: the run holds at once, on the right hand's beat 2, and the
    // left hand's silent beat 1 is skipped — so it must not tick afterwards.
    const h = harness(leftHandFirst, { mode: 'tempo', countInBars: 0, hands: 'R', latchStart: true });
    h.engine.start();
    h.advance(2000);
    expect(h.of('tempoTick')).toEqual([]);
    h.play(60);
    h.advance(1.5 * BEAT_MS);
    expect(h.of('tempoTick').map((t) => [t.bar, t.beat])).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });

  it('a resume closes a half-played chord as missed and picks up at the next note', () => {
    const chordTune = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 1, notes: [note({ midi: 62 }), note({ midi: 65 })] },
      { onset: 2, notes: [note({ midi: 64 })] },
    ]);
    const h = harness(chordTune, { mode: 'tempo', countInBars: 0 });
    h.engine.start();
    h.play(60);
    h.advance(BEAT_MS);
    h.play(62);
    h.advance(50);
    h.engine.pause();
    expect(h.engine.resumesAt).toBe(2);
    h.engine.resume({ recountMs: bar });
    expect(h.of('missed').map((e) => e.midi)).toEqual([65]);
  });

  it('a resume skips a note the learner already played early', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 0 });
    h.engine.start();
    h.play(60);
    // D played 100 ms early, inside its window, with the cursor still on C.
    h.advance(BEAT_MS - 100);
    h.play(62);
    h.engine.pause();
    expect(h.engine.state.step).toBe(0);
    expect(h.engine.resumesAt).toBe(2);
  });

  it('counts back in to the step it is given, without holding, when the app leads', () => {
    const h = harness(melody, { mode: 'tempo', countInBars: 0 });
    h.engine.start();
    h.play(60);
    h.advance(1.5 * BEAT_MS);
    h.engine.pause();
    h.engine.resume({ recountMs: bar, latch: false, toStep: 2 });
    expect(h.engine.holdingFrom).toBeNull();
    h.advance(bar);
    h.play(64);
    expect(h.of('noteJudged').pop()).toMatchObject({ ok: true, deltaMs: 0 });
    expect(h.of('armed')).toEqual([]);
  });
});

// --- T8 review 2 --------------------------------------------------------------

describe('Tempo mode — the latch, reviewed again (T8)', () => {
  const bar = 4 * BEAT_MS;

  it('a note just before the count ends starts it over a silent opening, at no error', () => {
    const h = harness(leftHandFirst, { mode: 'tempo', countInBars: 1, hands: 'R', latchStart: true });
    h.engine.start();
    h.advance(4 * BEAT_MS - 100);
    h.play(60);
    expect(h.of('noteJudged').map((e) => [e.ok, e.deltaMs])).toEqual([[true, 0]]);
    expect(h.of('armed')).toEqual([]);
  });

  it('a first note off the beat does not tick the beat that went by before it', () => {
    const offBeat = makeModel([
      { onset: 0, notes: [note({ midi: 48, hand: 'L' })] },
      { onset: 0.5, notes: [note({ midi: 60 })] },
      { onset: 1.5, notes: [note({ midi: 62 })] },
    ]);
    const h = harness(offBeat, { mode: 'tempo', countInBars: 0, hands: 'R', latchStart: true });
    h.engine.start();
    h.play(60);
    h.advance(0.7 * BEAT_MS);
    // The note is at beat 1.5: the next tick is beat 2, and beat 1 is not
    // ticked half a beat after it was due.
    expect(h.of('tempoTick').map((t) => [t.bar, t.beat])).toEqual([[1, 2]]);
  });

  it('resumes at an untouched note the cursor has already passed, while its window is open', () => {
    // Two notes a tenth of a beat apart: closer than the tolerance, so the
    // cursor reaches the second while the first is still open.
    const close = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 0.1, notes: [note({ midi: 62 })] },
      { onset: 1, notes: [note({ midi: 64 })] },
    ]);
    const h = harness(close, { mode: 'tempo', countInBars: 0 });
    h.engine.start();
    h.advance(120);
    h.engine.pause();
    expect(h.engine.state.step).toBe(1);
    expect(h.engine.resumesAt).toBe(0);
  });

  it('counts back in to the step it is given, when that is earlier than the learner’s next', () => {
    // Right hand, then the other hand's note (the app's), then the right hand.
    const appBetween = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 1, notes: [note({ midi: 48, hand: 'L' })] },
      { onset: 2, notes: [note({ midi: 62 })] },
    ]);
    const h = harness(appBetween, { mode: 'tempo', countInBars: 0, hands: 'R' });
    h.engine.start();
    h.play(60);
    h.advance(0.5 * BEAT_MS);
    h.engine.pause();
    expect(h.engine.resumesAt).toBe(2);
    h.engine.resume({ recountMs: bar, latch: false, toStep: 1 });
    expect(h.engine.countingBackTo).toBe(1);
    // A bar of count to the app's note, then a beat to the learner's.
    h.advance(bar + BEAT_MS);
    expect(h.engine.countingBackTo).toBeNull();
    h.play(62);
    expect(h.of('noteJudged').pop()).toMatchObject({ ok: true, deltaMs: 0 });
  });
});
