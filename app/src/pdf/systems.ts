// Finding the systems on a page of printed sheet music.
//
// A spike, not a feature: nothing calls this yet. It exists because the one
// hard question in "show me my own PDFs on the phone" is whether a page can be
// cut into its systems automatically, and the answer decides which of two very
// different designs P6/P7 should build. See
// docs/decisions/2026-09-05-p4-pdf-sheet-music.md.
//
// The method is a horizontal projection profile, which is the standard first
// step of every optical music recognition system and needs no model and no
// dependencies. A staff line is the one thing on the page that is dark across
// almost its whole width, so counting dark pixels per row makes the five lines
// of each staff stand out as five spikes, evenly spaced. Staves group into
// systems by the size of the gap between them: within a grand staff the gap is
// small, between systems it is large.
//
// Everything here works on a greyscale bitmap, so the caller can hand it a
// page rendered by PDF.js, a photograph, or a test image built by hand.

/** A band of rows containing one system, in page pixels. */
export interface SystemBand {
  /** First and last row of the band, inclusive. */
  top: number;
  bottom: number;
  /** Rows identified as staff lines inside the band. */
  staffLines: number[];
  /** Staves in the band: 2 for a piano grand staff, 1 for a lead sheet. */
  staves: number;
}

export interface DetectOptions {
  /** Luminance at or below which a pixel counts as ink (0–255). */
  inkThreshold?: number;
  /**
   * Fraction of the page width a row must be inked across to be a staff line.
   * Printed staff lines run nearly edge to edge; note heads and text do not.
   */
  lineCoverage?: number;
  /** Rows of white space added above and below a band, as a fraction of its height. */
  margin?: number;
  /**
   * A gap this many times the median gap between staves starts a new system.
   * Only used when the page gives no brace or barline to read.
   */
  systemGapRatio?: number;
  /** Fraction of the page width searched for the brace, from the left edge. */
  edgeColumns?: number;
  /** Fraction of the gap a vertical line must cover to count as bridging it. */
  bridgeCoverage?: number;
}

const DEFAULTS: Required<DetectOptions> = {
  inkThreshold: 160,
  lineCoverage: 0.55,
  margin: 0.35,
  systemGapRatio: 1.8,
  edgeColumns: 0.04,
  bridgeCoverage: 0.8,
};

/**
 * Fraction of each row that is ink, 0–1.
 *
 * `gray` is one byte per pixel, row-major — what a canvas gives after
 * converting RGBA to luminance.
 */
export function rowInkProfile(
  gray: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  inkThreshold = DEFAULTS.inkThreshold,
): Float32Array {
  const profile = new Float32Array(height);
  for (let y = 0; y < height; y += 1) {
    let dark = 0;
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if ((gray[row + x] as number) <= inkThreshold) dark += 1;
    }
    profile[y] = dark / width;
  }
  return profile;
}

/** Rows that are inked across most of the page: the staff lines. */
export function findStaffLineRows(profile: Float32Array, lineCoverage = DEFAULTS.lineCoverage): number[] {
  const rows: number[] = [];
  for (let y = 0; y < profile.length; y += 1) {
    if ((profile[y] as number) >= lineCoverage) rows.push(y);
  }
  return rows;
}

/**
 * Collapses runs of adjacent rows into one line each.
 *
 * A printed staff line is one to three pixels thick at screen resolution and
 * more when the page is scanned large, so the profile gives a short run of
 * inked rows per line rather than a single row.
 */
export function collapseRuns(rows: readonly number[]): number[] {
  const lines: number[] = [];
  let start = -1;
  let previous = -2;
  for (const row of rows) {
    if (row !== previous + 1) {
      if (start >= 0) lines.push(Math.round((start + previous) / 2));
      start = row;
    }
    previous = row;
  }
  if (start >= 0) lines.push(Math.round((start + previous) / 2));
  return lines;
}

/**
 * Groups lines into staves of five.
 *
 * Takes them in order and cuts where the spacing jumps: within a staff the
 * four gaps are equal to within a pixel or two, and the gap to the next staff
 * is several times larger.
 */
export function groupStaves(lines: readonly number[]): number[][] {
  if (lines.length < 5) return [];
  const staves: number[][] = [];
  let current: number[] = [lines[0] as number];
  for (let i = 1; i < lines.length; i += 1) {
    const gap = (lines[i] as number) - (lines[i - 1] as number);
    const previousGap =
      current.length >= 2 ? (current[current.length - 1] as number) - (current[current.length - 2] as number) : gap;
    // A gap much larger than the one before it, or a staff that already has
    // its five lines, ends the staff.
    if (current.length >= 5 || gap > previousGap * 1.8) {
      staves.push(current);
      current = [];
    }
    current.push(lines[i] as number);
  }
  if (current.length) staves.push(current);
  return staves.filter((staff) => staff.length === 5);
}

/** Median of a list, for gap statistics that one outlier should not move. */
function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
    : (sorted[middle] as number);
}

/**
 * Groups staves into systems by the gaps between them.
 *
 * On piano music the answer is usually "two staves per system", but this does
 * not assume it: a lead sheet has one staff per system and an organ score has
 * three, and the gaps say which without being told.
 */
export function groupSystems(
  staves: readonly number[][],
  options: DetectOptions = {},
  /**
   * Whether the gap between staves `i-1` and `i` is bridged at the left edge.
   * Optional so the grouping can be tested on gaps alone, but on a real page
   * this is the signal that decides it — see `detectSystems`.
   */
  joined?: (index: number) => boolean,
): number[][][] {
  const { systemGapRatio } = { ...DEFAULTS, ...options };
  if (staves.length <= 1) return staves.length ? [[...staves]] : [];

  const gaps: number[] = [];
  for (let i = 1; i < staves.length; i += 1) {
    const previous = staves[i - 1] as number[];
    const current = staves[i] as number[];
    gaps.push((current[0] as number) - (previous[previous.length - 1] as number));
  }
  const typical = median(gaps);

  const systems: number[][][] = [];
  let group: number[][] = [staves[0] as number[]];
  for (let i = 1; i < staves.length; i += 1) {
    const gap = gaps[i - 1] as number;
    // The brace and the barlines join the staves of one system down the left
    // edge and stop where the system does, so that answers the question
    // outright. Evenly spaced staves are otherwise ambiguous — three of them
    // could be an organ score or three lines of a lead sheet — and the gaps
    // alone cannot tell.
    const bridged = joined ? joined(i) : gap <= typical * systemGapRatio;
    if (!bridged) {
      systems.push(group);
      group = [];
    }
    group.push(staves[i] as number[]);
  }
  systems.push(group);
  return systems;
}

/**
 * Is there a vertical line down the left edge bridging these two rows?
 *
 * Looks only at the columns where the staff lines start, because that is where
 * a brace or a barline is; the rest of the gap is full of note stems that
 * bridge nothing.
 */
export function bridgedAtLeftEdge(
  gray: Uint8Array | Uint8ClampedArray,
  width: number,
  top: number,
  bottom: number,
  options: DetectOptions = {},
): boolean {
  const { inkThreshold, edgeColumns, bridgeCoverage } = { ...DEFAULTS, ...options };
  const columns = Math.max(2, Math.round(width * edgeColumns));
  let best = 0;
  for (let x = 0; x < columns; x += 1) {
    let inked = 0;
    for (let y = top; y <= bottom; y += 1) {
      if ((gray[y * width + x] as number) <= inkThreshold) inked += 1;
    }
    best = Math.max(best, inked / Math.max(1, bottom - top + 1));
  }
  return best >= bridgeCoverage;
}

/** The whole pipeline: greyscale page in, system bands out. */
export function detectSystems(
  gray: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  options: DetectOptions = {},
): SystemBand[] {
  const settings = { ...DEFAULTS, ...options };
  const profile = rowInkProfile(gray, width, height, settings.inkThreshold);
  const lines = collapseRuns(findStaffLineRows(profile, settings.lineCoverage));
  const staves = groupStaves(lines);
  const systems = groupSystems(staves, settings, (index) => {
    const previous = staves[index - 1] as number[];
    const current = staves[index] as number[];
    return bridgedAtLeftEdge(
      gray,
      width,
      previous[previous.length - 1] as number,
      current[0] as number,
      settings,
    );
  });

  return systems.map((system) => {
    const rows = system.flat();
    const first = Math.min(...rows);
    const last = Math.max(...rows);
    // Ledger lines, dynamics and lyrics live outside the staff lines, so the
    // band is grown by a share of its own height rather than a fixed number of
    // pixels — that keeps it right whatever the page resolution.
    const pad = Math.round((last - first) * settings.margin) || Math.round(height * 0.01);
    return {
      top: Math.max(0, first - pad),
      bottom: Math.min(height - 1, last + pad),
      staffLines: rows,
      staves: system.length,
    };
  });
}

/** RGBA from a canvas → the greyscale bytes the functions above want. */
export function toGreyscale(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i += 1) {
    const offset = i * 4;
    // Rec. 601 luma: the page is black on white, so any sane weighting works,
    // but this is the one every other tool uses.
    gray[i] = Math.round(
      0.299 * (rgba[offset] as number) +
        0.587 * (rgba[offset + 1] as number) +
        0.114 * (rgba[offset + 2] as number),
    );
  }
  return gray;
}
