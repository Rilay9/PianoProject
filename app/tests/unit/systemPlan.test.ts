/**
 * Turning detected staff bands into steppable systems, and correcting them
 * by hand (docs/04 §5b).
 *
 * The cut list is stored with the imported score and has to survive a reload,
 * a rotation and an export to another phone, so the invariant these tests
 * guard is that it is in *fractions of the page*, never pixels.
 */
import { describe, expect, it } from 'vitest';
import {
  addSystem,
  bandsToCuts,
  cutsToSystems,
  detectPageSystems,
  moveCut,
  removeSystem,
  wholePageCuts,
} from '../../src/pdf/systemPlan';
import type { SystemBand } from '../../src/pdf/systems';

function band(top: number, bottom: number): SystemBand {
  return { top, bottom, staffLines: [], staves: 2 };
}

describe('bandsToCuts', () => {
  it('stores fractions of the page, not pixels', () => {
    const cuts = bandsToCuts([band(100, 199), band(300, 399)], 1000);
    expect(cuts).toEqual([0.1, 0.2, 0.3, 0.4]);
  });

  it('clamps a band that runs off the page', () => {
    expect(bandsToCuts([band(-20, 1200)], 1000)).toEqual([0, 1]);
  });
});

describe('cutsToSystems', () => {
  it('reads pairs, so the gap between systems is preserved', () => {
    const systems = cutsToSystems([0.1, 0.2, 0.3, 0.4], 2);
    expect(systems).toHaveLength(2);
    expect(systems[0]).toEqual({ page: 2, top: 0.1, bottom: 0.2, indexOnPage: 0 });
    expect(systems[1]?.top).toBe(0.3);
  });

  it('sorts and tolerates a stray odd number rather than losing the page', () => {
    const systems = cutsToSystems([0.3, 0.1, 0.4, 0.2, 0.9], 0);
    expect(systems.map((s) => [s.top, s.bottom])).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
  });

  it('drops a zero-height band, which is a slipped drag and not a system', () => {
    expect(cutsToSystems([0.5, 0.5001], 0)).toEqual([]);
  });
});

describe('moveCut', () => {
  it('moves one boundary', () => {
    expect(moveCut([0.1, 0.2, 0.3, 0.4], 1, 0.25)).toEqual([0.1, 0.25, 0.3, 0.4]);
  });

  it('will not let a boundary cross its neighbours', () => {
    expect(moveCut([0.1, 0.2, 0.3, 0.4], 1, 0.9)[1]).toBeCloseTo(0.298, 3);
    expect(moveCut([0.1, 0.2, 0.3, 0.4], 1, 0)[1]).toBeCloseTo(0.102, 3);
  });

  it('ignores an index that is not there', () => {
    expect(moveCut([0.1, 0.2], 9, 0.5)).toEqual([0.1, 0.2]);
  });
});

describe('adding and removing systems', () => {
  it('adds one in the largest gap, which is where a missed system is', () => {
    // Systems at 0.1–0.2 and 0.8–0.9; the big gap is 0.2–0.8.
    const next = addSystem([0.1, 0.2, 0.8, 0.9]);
    expect(next).toHaveLength(6);
    const added = cutsToSystems(next, 0)[1];
    expect(added?.top).toBeGreaterThan(0.2);
    expect(added?.bottom).toBeLessThan(0.8);
  });

  it('starts a bare page off with one system rather than none', () => {
    expect(cutsToSystems(addSystem([]), 0)).toHaveLength(1);
  });

  it('removes both boundaries of the system it is given', () => {
    expect(removeSystem([0.1, 0.2, 0.3, 0.4, 0.5, 0.6], 1)).toEqual([0.1, 0.2, 0.5, 0.6]);
  });
});

describe('detectPageSystems', () => {
  /** A synthetic page: two grand staves, each five lines, joined at the left. */
  function page(width: number, height: number, staffTops: number[]): Uint8ClampedArray {
    const rgba = new Uint8ClampedArray(width * height * 4).fill(255);
    const ink = (x: number, y: number): void => {
      const offset = (y * width + x) * 4;
      rgba[offset] = 0;
      rgba[offset + 1] = 0;
      rgba[offset + 2] = 0;
    };
    for (const top of staffTops) {
      for (let line = 0; line < 5; line += 1) {
        const y = top + line * 6;
        for (let x = 0; x < width; x += 1) ink(x, y);
      }
    }
    // The brace: a solid left edge joining the two staves of each system.
    const braces: [number, number][] = [
      [staffTops[0] as number, staffTops[1] as number],
      [staffTops[2] as number, staffTops[3] as number],
    ];
    for (const [first, second] of braces) {
      for (let y = first; y <= second + 24; y += 1) {
        for (let x = 0; x < 6; x += 1) ink(x, y);
      }
    }
    return rgba;
  }

  it('finds two systems on a two-system page, in fractions', () => {
    const width = 200;
    const height = 400;
    const cuts = detectPageSystems(page(width, height, [40, 80, 240, 280]), width, height);
    const systems = cutsToSystems(cuts, 0);
    expect(systems).toHaveLength(2);
    expect(systems[0]?.top).toBeLessThan(systems[0]?.bottom as number);
    // The first system is in the top half and the second in the bottom half.
    expect(systems[0]?.bottom).toBeLessThan(0.5);
    expect(systems[1]?.top).toBeGreaterThan(0.5);
  });

  it('returns nothing on a blank page, which is what wholePageCuts is for', () => {
    const rgba = new Uint8ClampedArray(100 * 100 * 4).fill(255);
    expect(detectPageSystems(rgba, 100, 100)).toEqual([]);
    expect(cutsToSystems(wholePageCuts(), 0)).toHaveLength(1);
  });
});
