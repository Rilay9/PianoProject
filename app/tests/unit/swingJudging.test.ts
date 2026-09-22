/**
 * Judging a swung score where it swings (built 2026-09-21).
 *
 * `ragtime.5`, `blues.4`, `jazz.5` and `4.5` all said the app judged the
 * shuffle. It did not: every eighth was judged against the straight time it
 * was written at, so a player who swung correctly was late on every off-beat
 * by a sixth of a beat — and at the tempos those rungs work at, a sixth of a
 * beat is outside the timing window. Playing the piece the way the lesson
 * teaches scored worse than playing it wrong.
 *
 * Nothing about the *judging* changed: `prepareSession` moves the expected
 * time and Tempo mode, *Rhythm only*, the deltas and the histogram all read
 * that one number. So these are the synthetic performances the fix has to
 * pass, run through the real engine.
 *
 * Every number here is a relationship (`00` §2): the shift is a share of a
 * beat, the window is the engine's own `toleranceMs`, and the test asserts
 * that the first exceeds the second at the tempo the model states rather than
 * asserting a count of milliseconds measured here.
 */
import { describe, expect, it } from 'vitest';
import { BEAT_MS, harness, makeModel, note } from './helpers/engineHarness';
import { prepareSession, swungOnset } from '../../src/engine/prepareSession';
import { SWING_OFFBEAT } from '../../src/audio/backingLoop';
import { ENGINE_DEFAULTS } from '../../src/engine/types';

/** Four eighths: two beats of "long–short, long–short". */
const eighths = makeModel([
  { onset: 0, notes: [note({ midi: 60, duration: 0.5 })] },
  { onset: 0.5, notes: [note({ midi: 62, duration: 0.5 })] },
  { onset: 1, notes: [note({ midi: 64, duration: 0.5 })] },
  { onset: 1.5, notes: [note({ midi: 65, duration: 0.5 })] },
]);

const noCountIn = { mode: 'tempo', countInBars: 0 } as const;

/** Where the four notes are struck, in beats, for each way of playing them. */
const STRAIGHT_PLAY = [0, 0.5, 1, 1.5];
const SWUNG_PLAY = [0, SWING_OFFBEAT, 1, 1 + SWING_OFFBEAT];

/** Plays the four notes at those beats and returns how many were judged right. */
function perform(swing: boolean, atBeats: number[]): { right: number; wrong: number } {
  const h = harness(eighths, { ...noCountIn, ...(swing ? { swing: true } : {}) });
  h.engine.start();
  const midis = [60, 62, 64, 65];
  let played = 0;
  // Ticked forward in small steps, as the screen does, so slots open and
  // close exactly as they would in a run.
  const endMs = 3 * BEAT_MS;
  const stepMs = 8;
  while (h.clock.now() < endMs) {
    h.clock.set(h.clock.now() + stepMs);
    h.engine.tick();
    while (played < atBeats.length && (atBeats[played] as number) * BEAT_MS <= h.clock.now()) {
      h.play(midis[played] as number, { atMs: (atBeats[played] as number) * BEAT_MS });
      played += 1;
    }
  }
  const judged = h.of('noteJudged');
  return {
    right: judged.filter((e) => e.ok).length,
    wrong: judged.filter((e) => !e.ok).length,
  };
}

describe('the shift itself', () => {
  it('moves an off-beat eighth to the ratio the app already swings by', () => {
    expect(swungOnset(0.5)).toBe(SWING_OFFBEAT);
    expect(swungOnset(1.5)).toBe(1 + SWING_OFFBEAT);
  });

  it('leaves the beats, and everything that is not a written off-beat, alone', () => {
    expect(swungOnset(0)).toBe(0);
    expect(swungOnset(2)).toBe(2);
    // A triplet is already written where it goes, and a sixteenth has no
    // agreed swung position: a swing marking is a convention about eighths.
    expect(swungOnset(1 / 3)).toBe(1 / 3);
    expect(swungOnset(0.25)).toBe(0.25);
    expect(swungOnset(0.75)).toBe(0.75);
  });

  it('is a shift big enough to matter — larger than the timing window', () => {
    // This is why the fix is needed at all. If the shift were inside the
    // window, a swung run would already have passed and there would be
    // nothing to build.
    const beatMs = BEAT_MS;
    const shiftMs = (SWING_OFFBEAT - 0.5) * beatMs;
    expect(shiftMs).toBeGreaterThan(ENGINE_DEFAULTS.toleranceMs);
  });
});

describe('the timetable a run is judged against', () => {
  it('puts the off-beats late and the beats where they were', () => {
    const straight = prepareSession(eighths, noCountIn);
    const swung = prepareSession(eighths, { ...noCountIn, swing: true });
    expect(swung.steps[0]?.tMs).toBe(straight.steps[0]?.tMs);
    expect(swung.steps[2]?.tMs).toBe(straight.steps[2]?.tMs);
    expect(swung.steps[1]?.tMs).toBeGreaterThan(straight.steps[1]?.tMs ?? 0);
    expect(swung.steps[3]?.tMs).toBeGreaterThan(straight.steps[3]?.tMs ?? 0);
  });

  it('is unchanged for a score with no swing marking', () => {
    const straight = prepareSession(eighths, noCountIn);
    const explicit = prepareSession(eighths, { ...noCountIn, swing: false });
    expect(explicit.steps.map((s) => s.tMs)).toEqual(straight.steps.map((s) => s.tMs));
  });
});

describe('a synthetic performance', () => {
  it('passes a swung run of a swung score, and fails a straight one', () => {
    const swungRun = perform(true, SWUNG_PLAY);
    expect(swungRun.right).toBe(4);
    expect(swungRun.wrong).toBe(0);

    const straightRun = perform(true, STRAIGHT_PLAY);
    // The two on the beat still land; the two off it are now early by more
    // than the window allows.
    expect(straightRun.right).toBeLessThan(swungRun.right);
    expect(straightRun.wrong).toBeGreaterThan(0);
  });

  it('is the other way round for a score with no swing marking', () => {
    const straightRun = perform(false, STRAIGHT_PLAY);
    expect(straightRun.right).toBe(4);
    expect(straightRun.wrong).toBe(0);

    const swungRun = perform(false, SWUNG_PLAY);
    expect(swungRun.right).toBeLessThan(straightRun.right);
    expect(swungRun.wrong).toBeGreaterThan(0);
  });
});
