// Cutting a page of sheet music into systems.
//
// The images are built here rather than loaded, so the tests state exactly
// what the algorithm is expected to cope with: a clean two-system piano page,
// a lead sheet with one staff per system, a page with dynamics and lyrics
// between the staves, and a photograph-grade grey background.

import { describe, expect, it } from 'vitest';
import {
  collapseRuns,
  detectSystems,
  groupStaves,
  bridgedAtLeftEdge,
  rowInkProfile,
  toGreyscale,
} from '../../src/pdf/systems';

const WIDTH = 200;
const WHITE = 255;

interface PageSpec {
  height: number;
  /** Top row of each staff; five lines are drawn `spacing` apart from there. */
  staves: number[];
  spacing?: number;
  lineThickness?: number;
  /** Fraction of the width each staff line covers. */
  coverage?: number;
  background?: number;
  /**
   * Groups of staff indexes joined by a brace down the left edge, the way a
   * real page marks which staves belong to one system.
   */
  braces?: number[][];
}

function page(spec: PageSpec): Uint8Array {
  const {
    height,
    staves,
    spacing = 6,
    lineThickness = 1,
    coverage = 0.95,
    background = WHITE,
    braces,
  } = spec;
  const gray = new Uint8Array(WIDTH * height).fill(background);
  const inked = Math.round(WIDTH * coverage);
  for (const top of staves) {
    for (let line = 0; line < 5; line += 1) {
      for (let t = 0; t < lineThickness; t += 1) {
        const y = top + line * spacing + t;
        for (let x = 0; x < inked; x += 1) gray[y * WIDTH + x] = 0;
      }
    }
  }
  // A brace: a vertical line at the left edge spanning the staves it joins.
  for (const group of braces ?? []) {
    const first = staves[group[0] as number] as number;
    const last = (staves[group[group.length - 1] as number] as number) + 4 * spacing;
    for (let y = first; y <= last; y += 1) {
      for (let x = 0; x < 3; x += 1) gray[y * WIDTH + x] = 0;
    }
  }
  return gray;
}

/** Scatters ink about like note heads and lyrics: dark, but not across the row. */
function addClutter(gray: Uint8Array, height: number, rows: number[]): Uint8Array {
  for (const y of rows) {
    for (let x = 10; x < 60; x += 3) gray[y * WIDTH + x] = 0;
  }
  void height;
  return gray;
}

describe('row ink profile', () => {
  it('measures how much of each row is ink', () => {
    const gray = page({ height: 40, staves: [10] });
    const profile = rowInkProfile(gray, WIDTH, 40);
    expect(profile[10]).toBeCloseTo(0.95, 2);
    expect(profile[11]).toBe(0);
  });

  it('reads a grey scan as ink, not as paper', () => {
    // A photographed page is never white; the threshold is about contrast.
    const gray = page({ height: 40, staves: [10], background: 210 });
    const profile = rowInkProfile(gray, WIDTH, 40);
    expect(profile[10]).toBeGreaterThan(0.9);
    expect(profile[11]).toBe(0);
  });
});

describe('collapseRuns', () => {
  it('turns a thick line into one row', () => {
    expect(collapseRuns([10, 11, 12, 20, 21])).toEqual([11, 21]);
  });

  it('keeps single-row lines', () => {
    expect(collapseRuns([4, 10, 16])).toEqual([4, 10, 16]);
  });

  it('handles nothing at all', () => {
    expect(collapseRuns([])).toEqual([]);
  });
});

describe('groupStaves', () => {
  it('takes five evenly spaced lines as one staff', () => {
    expect(groupStaves([0, 6, 12, 18, 24])).toEqual([[0, 6, 12, 18, 24]]);
  });

  it('splits two staves at the wider gap', () => {
    const staves = groupStaves([0, 6, 12, 18, 24, 60, 66, 72, 78, 84]);
    expect(staves).toHaveLength(2);
    expect(staves[1]?.[0]).toBe(60);
  });

  it('ignores a stray line that cannot be part of a staff', () => {
    expect(groupStaves([0, 6, 12])).toEqual([]);
  });
});

describe('groupSystems', () => {
  it('puts a grand staff into one system', () => {
    const gray = page({
      height: 200,
      staves: [20, 60, 120, 160],
      braces: [
        [0, 1],
        [2, 3],
      ],
    });
    const systems = detectSystems(gray, WIDTH, 200);
    expect(systems).toHaveLength(2);
    expect(systems[0]?.staves).toBe(2);
    expect(systems[1]?.staves).toBe(2);
  });

  it('does not assume two staves: a lead sheet is one per system', () => {
    const gray = page({ height: 260, staves: [20, 100, 180] });
    const systems = detectSystems(gray, WIDTH, 260);
    expect(systems).toHaveLength(3);
    expect(systems.every((s) => s.staves === 1)).toBe(true);
  });

  it('keeps a three-staff system together', () => {
    // An organ score, or a piano part with a vocal line above it.
    const gray = page({
      height: 320,
      staves: [20, 60, 100, 200, 240, 280],
      braces: [
        [0, 1, 2],
        [3, 4, 5],
      ],
    });
    const systems = detectSystems(gray, WIDTH, 320);
    expect(systems).toHaveLength(2);
    expect(systems[0]?.staves).toBe(3);
  });

  it('returns nothing for a blank page rather than guessing', () => {
    expect(detectSystems(new Uint8Array(WIDTH * 100).fill(WHITE), WIDTH, 100)).toEqual([]);
  });
});

describe('bridgedAtLeftEdge', () => {
  it('sees the brace that joins a grand staff', () => {
    const gray = page({ height: 200, staves: [20, 60], braces: [[0, 1]] });
    expect(bridgedAtLeftEdge(gray, WIDTH, 44, 60)).toBe(true);
  });

  it('and its absence between systems', () => {
    const gray = page({ height: 200, staves: [20, 60], braces: [[0], [1]] });
    expect(bridgedAtLeftEdge(gray, WIDTH, 44, 60)).toBe(false);
  });
});

describe('detectSystems', () => {
  it('gives a band with room for ledger lines and dynamics', () => {
    const gray = page({ height: 200, staves: [40, 80], braces: [[0, 1]] });
    const [band] = detectSystems(gray, WIDTH, 200);
    expect(band).toBeDefined();
    // The staff lines run 40–104; the band has to be wider than that.
    expect(band!.top).toBeLessThan(40);
    expect(band!.bottom).toBeGreaterThan(104);
  });

  it('is not fooled by note heads and lyrics between the staves', () => {
    const gray = addClutter(
      page({
        height: 200,
        staves: [20, 60, 120, 160],
        braces: [
          [0, 1],
          [2, 3],
        ],
      }),
      200,
      [50, 51, 110, 111],
    );
    const systems = detectSystems(gray, WIDTH, 200);
    expect(systems).toHaveLength(2);
  });

  it('ignores a rule that is too short to be a staff line', () => {
    // A bar number box or a partial underline covers part of the row only.
    const gray = page({ height: 120, staves: [20], coverage: 0.3 });
    expect(detectSystems(gray, WIDTH, 120)).toEqual([]);
  });

  it('handles thick lines from a high-resolution scan', () => {
    const gray = page({
      height: 300,
      staves: [30, 120],
      spacing: 12,
      lineThickness: 3,
      braces: [[0, 1]],
    });
    const systems = detectSystems(gray, WIDTH, 300);
    expect(systems).toHaveLength(1);
    expect(systems[0]?.staffLines).toHaveLength(10);
  });
});

describe('toGreyscale', () => {
  it('converts RGBA the way every other tool does', () => {
    const rgba = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    expect([...toGreyscale(rgba, 2, 1)]).toEqual([0, 255]);
  });
});
