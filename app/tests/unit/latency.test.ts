import { describe, expect, it } from 'vitest';
import { EARLY_WINDOW_MS, LATE_WINDOW_MS, matchTapsToClicks } from '../../src/audio/latency';
import { audioTimeToPerformanceMs, type AudioClockAnchor } from '../../src/audio/clock';
import { summarise } from '../../src/util/stats';

describe('matchTapsToClicks', () => {
  const clicks = [1000, 2000, 3000, 4000];

  it('pairs each tap with the nearest click and signs the delta', () => {
    const matches = matchTapsToClicks(clicks, [1040, 1980, 3120]);
    expect(matches.map((m) => [m.clickMs, m.deltaMs])).toEqual([
      [1000, 40],
      [2000, -20],
      [3000, 120],
    ]);
  });

  it('ignores taps further than the window from any click', () => {
    const window = { earlyMs: 400, lateMs: 400 };
    expect(matchTapsToClicks(clicks, [1500], window)).toEqual([]);
    expect(matchTapsToClicks(clicks, [1350], window)).toHaveLength(1);
  });

  it('is later-leaning: the window after a click is wider than the one before', () => {
    // A learner is late far more often than early, and the input path only
    // ever adds delay. A symmetric window throws away the real readings.
    expect(matchTapsToClicks([1000], [1000 + LATE_WINDOW_MS - 1])).toHaveLength(1);
    expect(matchTapsToClicks([1000], [1000 - LATE_WINDOW_MS + 1])).toEqual([]);
    expect(matchTapsToClicks([1000], [1000 - EARLY_WINDOW_MS + 1])).toHaveLength(1);
  });

  it('uses at most one tap per click, keeping the earlier one', () => {
    // A bounced key or a chord: three taps around the same click.
    const matches = matchTapsToClicks([1000], [1010, 1020, 1030]);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.tapMs).toBe(1010);
  });

  it('does not reuse a click already matched by an earlier tap', () => {
    const matches = matchTapsToClicks([1000, 2000], [1010, 1900, 2010]);
    expect(matches.map((m) => [m.clickMs, m.tapMs])).toEqual([
      [1000, 1010],
      [2000, 1900],
    ]);
  });

  it('returns nothing when there are no taps or no clicks', () => {
    expect(matchTapsToClicks(clicks, [])).toEqual([]);
    expect(matchTapsToClicks([], [1000])).toEqual([]);
  });

  it('produces the mean and sigma the diagnostics screen reports', () => {
    const matches = matchTapsToClicks(clicks, [1030, 2050, 3040, 4060]);
    const stats = summarise(matches.map((m) => m.deltaMs));
    expect(stats.n).toBe(4);
    expect(stats.mean).toBeCloseTo(45, 6);
    expect(stats.stdDev).toBeCloseTo(12.909944, 5);
  });
});

describe('audioTimeToPerformanceMs', () => {
  const anchor: AudioClockAnchor = {
    contextTimeSec: 10,
    performanceMs: 5000,
    outputLatencySec: 0.02,
  };

  it('maps the anchor instant to itself plus the output latency', () => {
    expect(audioTimeToPerformanceMs(anchor, 10)).toBeCloseTo(5020, 6);
  });

  it('converts seconds ahead of the anchor into milliseconds', () => {
    expect(audioTimeToPerformanceMs(anchor, 11)).toBeCloseTo(6020, 6);
    expect(audioTimeToPerformanceMs(anchor, 9.5)).toBeCloseTo(4520, 6);
  });

  it('ignoring output latency would bias the measurement by its whole value', () => {
    const noLatency = { ...anchor, outputLatencySec: 0 };
    expect(audioTimeToPerformanceMs(anchor, 10) - audioTimeToPerformanceMs(noLatency, 10)).toBe(
      20,
    );
  });
});
