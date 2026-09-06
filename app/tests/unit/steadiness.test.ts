/**
 * Tempo steadiness on scripted onsets (replan §5.3).
 *
 * This is the only measurement the paper screen makes, so it has to be right
 * about the two things that would quietly corrupt it: a chord counted five
 * times, and a note that belongs to no click dragged onto the nearest one.
 */
import { describe, expect, it } from 'vitest';
import {
  CHORD_WINDOW_MS,
  MAX_OFFSET_MS,
  MIN_ONSETS_FOR_STEADINESS,
  clickTimes,
  collapseChords,
  offsetFromNearestClick,
  steadiness,
  steadinessIsMeaningful,
} from '../../src/engine/steadiness';

const on = (...times: number[]) => times.map((atMs) => ({ atMs }));

describe('clickTimes', () => {
  it('spaces clicks by the beat', () => {
    expect(clickTimes(0, 120, 4)).toEqual([0, 500, 1000, 1500]);
    expect(clickTimes(1000, 60, 3)).toEqual([1000, 2000, 3000]);
  });
});

describe('offsetFromNearestClick', () => {
  it('is signed: negative ahead of the beat, positive behind', () => {
    const clicks = clickTimes(0, 120, 4);
    expect(offsetFromNearestClick(480, clicks)).toBe(-20);
    expect(offsetFromNearestClick(530, clicks)).toBe(30);
  });

  it('refuses a note that belongs to no click', () => {
    // Landing 250 ms off at ♩=120 is half a beat away: it is a different note,
    // not a late one, and folding it in would report a wobble that is
    // arithmetic rather than playing.
    const clicks = clickTimes(0, 120, 4);
    // The limit is inclusive: exactly MAX_OFFSET_MS away still counts.
    expect(offsetFromNearestClick(MAX_OFFSET_MS, clicks)).toBe(MAX_OFFSET_MS);
    // Between two clicks 500 ms apart nothing is ever more than 250 ms from
    // one of them, so being out of range means being past the last click —
    // which is exactly the case that matters: playing on after the count.
    const last = clicks[clicks.length - 1] as number;
    expect(offsetFromNearestClick(last + MAX_OFFSET_MS + 1, clicks)).toBe(null);
    expect(offsetFromNearestClick(last + MAX_OFFSET_MS, clicks)).toBe(MAX_OFFSET_MS);
  });

  it('has nothing to say with no clicks', () => {
    expect(offsetFromNearestClick(100, [])).toBe(null);
  });
});

describe('collapseChords', () => {
  it('counts a chord once', () => {
    expect(collapseChords(on(1000, 1005, 1012, 1030))).toEqual(on(1000));
  });

  it('keeps notes further apart than the window', () => {
    expect(collapseChords(on(1000, 1000 + CHORD_WINDOW_MS + 1))).toHaveLength(2);
  });

  it('does not care what order they arrive in', () => {
    expect(collapseChords(on(1030, 1000, 1012))).toEqual(on(1000));
  });
});

describe('steadiness', () => {
  it('is zero for playing exactly on the click', () => {
    const clicks = clickTimes(0, 120, 8);
    const result = steadiness(clicks.map((atMs) => ({ atMs })), clicks);
    expect(result.sigmaMs).toBe(0);
    expect(result.meanMs).toBe(0);
    expect(result.counted).toBe(8);
  });

  it('measures a consistent rush as a mean, not as a wobble', () => {
    // 20 ms early every time is not unsteady — it is early. The two numbers
    // say different things and the summary prints both.
    const clicks = clickTimes(0, 120, 8);
    const result = steadiness(clicks.map((atMs) => ({ atMs: atMs - 20 })), clicks);
    expect(result.meanMs).toBeCloseTo(-20, 6);
    expect(result.sigmaMs).toBeCloseTo(0, 6);
  });

  it('measures an alternating wobble as sigma with no mean', () => {
    const clicks = clickTimes(0, 120, 8);
    const onsets = clicks.map((atMs, i) => ({ atMs: atMs + (i % 2 === 0 ? 30 : -30) }));
    const result = steadiness(onsets, clicks);
    expect(result.meanMs).toBeCloseTo(0, 6);
    expect(result.sigmaMs).toBeCloseTo(30, 6);
  });

  it('computes the population standard deviation', () => {
    // Offsets 0, 0, 0, 40 -> mean 10, variance 300, sigma sqrt(300).
    const clicks = clickTimes(0, 120, 4);
    const onsets = on(clicks[0] as number, clicks[1] as number, clicks[2] as number, (clicks[3] as number) + 40);
    const result = steadiness(onsets, clicks);
    expect(result.meanMs).toBeCloseTo(10, 6);
    expect(result.sigmaMs).toBeCloseTo(Math.sqrt(300), 6);
  });

  it('weights a chord as one beat, not as five', () => {
    const clicks = clickTimes(0, 120, 4);
    // A five-note chord dead on beat 2, and everything else 40 ms late.
    const onsets = on(
      (clicks[0] as number) + 40,
      clicks[1] as number,
      (clicks[1] as number) + 4,
      (clicks[1] as number) + 9,
      (clicks[1] as number) + 15,
      (clicks[1] as number) + 21,
      (clicks[2] as number) + 40,
      (clicks[3] as number) + 40,
    );
    const result = steadiness(onsets, clicks);
    expect(result.counted).toBe(4);
    expect(result.meanMs).toBeCloseTo(30, 6);
  });

  it('reports what it ignored rather than hiding it', () => {
    const clicks = clickTimes(0, 120, 2);
    const result = steadiness(on(0, 5000), clicks);
    expect(result.counted).toBe(1);
    expect(result.ignored).toBe(1);
  });

  it('is empty rather than dividing by zero', () => {
    expect(steadiness([], clickTimes(0, 120, 4))).toEqual({
      sigmaMs: 0,
      meanMs: 0,
      counted: 0,
      ignored: 0,
    });
    // Three onsets a millisecond apart are one chord, so one thing is
    // ignored rather than three.
    expect(steadiness(on(1, 2, 3), [])).toMatchObject({ counted: 0, ignored: 1 });
    expect(steadiness(on(0, 500, 1000), [])).toMatchObject({ counted: 0, ignored: 3 });
  });
});

describe('when the number is worth printing', () => {
  it('needs enough notes to be evidence rather than arithmetic', () => {
    const clicks = clickTimes(0, 120, 40);
    const few = steadiness(clicks.slice(0, 3).map((atMs) => ({ atMs })), clicks);
    expect(steadinessIsMeaningful(few)).toBe(false);

    const enough = steadiness(
      clicks.slice(0, MIN_ONSETS_FOR_STEADINESS).map((atMs) => ({ atMs })),
      clicks,
    );
    expect(steadinessIsMeaningful(enough)).toBe(true);
  });
});
