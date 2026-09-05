import { describe, expect, it } from 'vitest';
import { summarise } from '../../src/util/stats';

describe('summarise', () => {
  it('computes mean, sample sigma, range and median', () => {
    const s = summarise([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(s.n).toBe(8);
    expect(s.mean).toBe(5);
    // Sample (n-1) sigma of this classic set is sqrt(32/7) = 2.13809…
    expect(s.stdDev).toBeCloseTo(2.138089, 5);
    expect(s.min).toBe(2);
    expect(s.max).toBe(9);
    expect(s.median).toBe(4.5);
  });

  it('takes the middle value as the median for an odd count', () => {
    expect(summarise([5, 1, 3]).median).toBe(3);
  });

  it('reports NaN sigma for a single sample rather than 0', () => {
    const s = summarise([42]);
    expect(s.n).toBe(1);
    expect(s.mean).toBe(42);
    expect(s.median).toBe(42);
    expect(Number.isNaN(s.stdDev)).toBe(true);
  });

  it('is all NaN for an empty set', () => {
    const s = summarise([]);
    expect(s.n).toBe(0);
    expect(Number.isNaN(s.mean)).toBe(true);
    expect(Number.isNaN(s.median)).toBe(true);
  });

  it('handles negative values (a tap ahead of the click)', () => {
    const s = summarise([-30, -10, 10, 30]);
    expect(s.mean).toBe(0);
    expect(s.min).toBe(-30);
    expect(s.max).toBe(30);
  });
});
