// Timed learns how long a system takes from two taps (P21d D3).
import { describe, expect, it } from 'vitest';
import { intervalMs, LEARN_MAX_MS, LEARN_MIN_MS, secondsPerSystem } from '../../src/pdf/timing';

describe('the PDF viewer\'s Timed interval', () => {
  it('uses the gap between two taps when there is one', () => {
    expect(intervalMs(9_600, 80, 4)).toEqual({ ms: 9_600, learned: true });
  });

  it('falls back to bpm × bars when nothing has been learned', () => {
    const { ms, learned } = intervalMs(null, 80, 4);
    expect(learned).toBe(false);
    expect(ms).toBeCloseTo(secondsPerSystem(80, 4) * 1000);
    expect(ms).toBe(12_000);
  });

  it('ignores a double-tap and a coffee break', () => {
    expect(intervalMs(LEARN_MIN_MS - 1, 60, 4).learned).toBe(false);
    expect(intervalMs(LEARN_MAX_MS + 1, 60, 4).learned).toBe(false);
    expect(intervalMs(LEARN_MIN_MS, 60, 4).learned).toBe(true);
  });
});
