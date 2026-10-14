// Finding the systems on a page of printed sheet music, so the PDF reader can show it a system at a time.
//
// The method is the old app's (branch claude/piano-teaching-app-bo19td, app/src/pdf/systems.ts): a horizontal
// projection profile, the standard first step of optical music recognition. A staff line is the one thing on a page
// that is dark across most of a system's width, so counting ink per row makes each staff's five lines stand out.
// Reworked 2026-10-14 after measuring it on real-looking pages (a clean page, a dense page, a tilted grey scan): it
// found 0 of 5 pages right. What changed, each for a failure seen:
//   - ink is what is darker than the page's own paper (Otsu's threshold), so a grey scan reads;
//   - the page's tilt is measured (the angle at which the staff lines line up sharpest) and everything is read
//     along it; the reader straightens the page by the same angle when it shows it;
//   - a staff line is dark compared with the page's darkest rows, not across a fixed share of the width, so a short
//     last system counts;
//   - a staff is five evenly spaced lines found anywhere, so a stray rule cannot shift every staff after it;
//   - the brace or barline joining a grand staff is looked for where the staves start, not at the page's edge
//     (it looked only at the left 4% of the page, so a page with ordinary margins came apart staff by staff);
//   - a system's band runs to halfway to its neighbours, so two bands never overlap.
//
// Everything works on a greyscale bitmap, so the caller can hand it a page rendered by PDF.js, a photograph, or a
// test image built by hand.

/** A band of rows containing one system, in page pixels (read along the page's tilt). */
export interface SystemBand {
  /** First and last row of the band, inclusive. */
  top: number;
  bottom: number;
  /** The staff lines inside the band. */
  staffLines: number[];
  /** Staves in the band: 2 for a piano grand staff, 1 for a lead sheet. */
  staves: number;
  /** Where to split the line in two (page pixels across): the emptiest column near its middle (the half-line view). */
  split?: number;
  /** Ink (besides the staff lines) that split cuts through, in pixels: 0 is a clean split between notes. */
  splitInk?: number;
}

/** What was found on a page: its tilt and its systems. */
export interface PageLayout {
  /**
   * The page's tilt in degrees: positive when the staff lines run downhill to the right. The reader rotates the
   * page by minus this (about its centre) to straighten it; `bands` are rows of the straightened page.
   */
  angle: number;
  bands: SystemBand[];
  /** Where the staves start and end across the page (fractions of its width): the reader trims the margins. */
  left?: number;
  right?: number;
}

export interface DetectOptions {
  /** Luminance at or below which a pixel counts as ink (0–255); worked out from the page when not given. */
  inkThreshold?: number;
  /** The largest tilt looked for, in degrees either way. */
  maxAngle?: number;
  /** Filled with the intermediate numbers (for checks while tuning). */
  debug?: Record<string, unknown>;
}

const MAX_ANGLE = 3; // degrees: a scan or a phone photo held roughly square; more than this is a page to retake
const LINE_SHARE = 0.4; // a staff-line row: at least this share of the page's darkest row
const MIN_LINE = 0.3; // and at least this share of the width (a line of prose, gappy between letters, rarely is)
const BRIDGE = 0.8; // a brace or barline: dark down this share of the gap between two staves

/** Otsu's threshold: the grey that best separates ink from paper on this page. */
export function inkThresholdOf(gray: Uint8Array | Uint8ClampedArray): number {
  const hist = new Float64Array(256);
  for (let i = 0; i < gray.length; i += 1) hist[gray[i] as number] += 1;
  const total = gray.length;
  let sum = 0;
  for (let t = 0; t < 256; t += 1) sum += t * (hist[t] as number);
  let sumB = 0, wB = 0, best = 0, threshold = 128;
  for (let t = 0; t < 256; t += 1) {
    wB += hist[t] as number;
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * (hist[t] as number);
    const between = wB * wF * (sumB / wB - (sum - sumB) / wF) ** 2;
    if (between > best) { best = between; threshold = t; }
  }
  return threshold;
}

/** Ink rows along a tilt: how much of each row (of the page straightened by `angle`) is ink, 0–1. */
function profileAt(points: Int32Array, weights: Float32Array, count: number, width: number, height: number, angle: number, step: number): Float32Array {
  const tan = Math.tan((angle * Math.PI) / 180), cx = width / 2;
  const bins = new Float32Array(height);
  for (let i = 0; i < count; i += 1) {
    const x = points[2 * i] as number, y = points[2 * i + 1] as number;
    const r = Math.round(y - (x - cx) * tan);
    if (r >= 0 && r < height) bins[r] += step * (weights[i] as number);
  }
  for (let r = 0; r < height; r += 1) bins[r] = (bins[r] as number) / width;
  return bins;
}
const sharpness = (p: Float32Array) => { let s = 0; for (let i = 0; i < p.length; i += 1) s += (p[i] as number) ** 2; return s; };

/** Rows of runs collapsed to their middle row. */
export function collapseRuns(rows: readonly number[]): number[] { return runs(rows).map((r) => r.mid); }
/** Runs of adjacent rows: their middle row and how many rows thick. */
function runs(rows: readonly number[]): { mid: number; thick: number }[] {
  const out: { mid: number; thick: number }[] = [];
  let start = -1, previous = -2;
  for (const row of rows) {
    if (row !== previous + 1) {
      if (start >= 0) out.push({ mid: Math.round((start + previous) / 2), thick: previous - start + 1 });
      start = row;
    }
    previous = row;
  }
  if (start >= 0) out.push({ mid: Math.round((start + previous) / 2), thick: previous - start + 1 });
  return out;
}

function median(values: readonly number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

/**
 * Staves: any five lines in a row whose four gaps are equal (to a quarter of a gap, or a pixel and a half), each line
 * a thin stroke (at most 0.6 of a gap thick: blur thickens a printed line, but it stays well under its spacing). Four
 * lines with exactly one double gap are a staff whose fifth line came out too faint (a scan): it is filled in.
 */
export function groupStaves(lines: readonly number[], thick?: readonly number[]): number[][] {
  const staves: number[][] = [];
  const near = (g: number, m: number) => Math.abs(g - m) <= Math.max(1.5, m * 0.25);
  const thin = (from: number, n: number, m: number) => !thick || thick.slice(from, from + n).every((t) => t <= Math.max(2, m * 0.6));
  for (let i = 0; i + 3 < lines.length;) {
    const five = lines.slice(i, i + 5);
    const gaps = five.slice(1).map((y, k) => y - (five[k] as number));
    const m = median(gaps);
    if (five.length === 5 && m >= 2 && thin(i, 5, m) && gaps.every((g) => near(g, m))) { staves.push(five); i += 5; continue; }
    const four = lines.slice(i, i + 4);
    const g4 = four.slice(1).map((y, k) => y - (four[k] as number));
    const unit = Math.min(...g4);
    const doubled = g4.filter((g) => near(g, 2 * unit));
    if (unit >= 2 && doubled.length === 1 && g4.filter((g) => near(g, unit)).length === 2 && thin(i, 4, unit)) {
      const k = g4.findIndex((g) => near(g, 2 * unit));
      staves.push([...four.slice(0, k + 1), Math.round(((four[k] as number) + (four[k + 1] as number)) / 2), ...four.slice(k + 1)]);
      i += 4;
      continue;
    }
    i += 1;
  }
  return staves;
}

/** The whole pipeline: greyscale page in, its tilt and system bands out. */
export function detectPage(gray: Uint8Array | Uint8ClampedArray, width: number, height: number, options: DetectOptions = {}): PageLayout {
  // The paper's grey (most of a page is paper), and ink: anything nearer the ink than the paper. A faint line (a
  // blurred scan's thin staff lines are light grey) still counts for how much darker than the paper it is.
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i += 1) hist[gray[i] as number] += 1;
  let paper = 0;
  for (let t = 0, seen = 0; t < 256; t += 1) { seen += hist[t] as number; if (seen >= gray.length / 2) { paper = t; break; } }
  const ink = options.inkThreshold ?? Math.round((inkThresholdOf(gray) + paper) / 2);
  const maxAngle = options.maxAngle ?? MAX_ANGLE;
  const dark = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < height && (gray[y * width + x] as number) <= ink;

  // The ink, every second column (enough to find lines; half the work).
  const step = 2;
  let count = 0;
  const points = new Int32Array(Math.ceil((width * height) / step) * 2), weights = new Float32Array(Math.ceil((width * height) / step));
  const faint = Math.max(1, paper * 0.05); // darker than the paper by more than its own unevenness
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += step) {
    const g = gray[y * width + x] as number;
    if (g < paper - faint) { points[2 * count] = x; points[2 * count + 1] = y; weights[count] = Math.min(1, (paper - g) / Math.max(1, paper - ink) / 2); count += 1; }
  }
  if (!count) return { angle: 0, bands: [] };

  // The tilt: the angle at which the ink piles up into the sharpest rows (staff lines), coarse then fine.
  let angle = 0, best = -1;
  for (let a = -maxAngle; a <= maxAngle + 1e-9; a += 0.1) { const s = sharpness(profileAt(points, weights, count, width, height, a, step)); if (s > best) { best = s; angle = a; } }
  const coarse = angle;
  for (let a = coarse - 0.1; a <= coarse + 0.1 + 1e-9; a += 0.02) { const s = sharpness(profileAt(points, weights, count, width, height, a, step)); if (s > best) { best = s; angle = a; } }
  angle = Math.round(angle * 100) / 100;
  const profile = profileAt(points, weights, count, width, height, angle, step);

  // Staff lines, then staves.
  let top = 0;
  for (let r = 0; r < height; r += 1) top = Math.max(top, profile[r] as number);
  if (top < MIN_LINE) return { angle, bands: [] };
  const peaksAbove = (floor: number) => {
    const out: { mid: number; thick: number }[] = [];
    for (let r = 1; r < height - 1; r += 1) {
      const v = profile[r] as number;
      if (v < floor || v < (profile[r - 1] as number) || v <= (profile[r + 1] as number)) continue;
      const last = out[out.length - 1];
      if (last && r - last.mid < 2) { if (v > (profile[last.mid] as number)) last.mid = r; continue; }
      out.push({ mid: r, thick: 0 });
    }
    return out;
  };
  // Line centres are the profile's peaks (not the middle of every run above the threshold: on a crowded, blurred page
  // a beam touching a staff line makes one thick run of both, but the line is still its sharpest row). Thickness is
  // the width at half the peak's height.
  const floor = Math.max(MIN_LINE, top * LINE_SHARE);
  const lineRuns: { mid: number; thick: number }[] = []; // (thick: kept for the debug view)
  for (let r = 1; r < height - 1; r += 1) {
    const v = profile[r] as number;
    if (v < floor || v < (profile[r - 1] as number) || v <= (profile[r + 1] as number)) continue; // (a flat top: its last row)
    const last = lineRuns[lineRuns.length - 1];
    if (last && r - last.mid < 2) { if (v > (profile[last.mid] as number)) last.mid = r; continue; }
    let a = r, z = r;
    while (a > 0 && (profile[a - 1] as number) >= v / 2) a -= 1;
    while (z < height - 1 && (profile[z + 1] as number) >= v / 2) z += 1;
    lineRuns.push({ mid: r, thick: z - a + 1 });
  }
  // (Their thickness is not used: between two blurred staff lines a few pixels apart the profile does not fall to half,
  // so a measured width spans the staff. Prose is kept out by MIN_LINE and the five-even-lines pattern instead; a page
  // of dense text could still give a false system, which Adjust lines corrects.)
  const found = groupStaves(lineRuns.map((r) => r.mid));
  // A short system (a last line of a few bars, a one-bar ending) has staff lines too short for the floor above. Once
  // the page's own staff spacing is known, look again with a low floor, keeping only five lines at that spacing (to a
  // pixel, or 15%) that overlap no staff already found: a pattern that exact is a staff, not text.
  const spacing = median(found.flatMap((st) => st.slice(1).map((y, k) => y - (st[k] as number))));
  const extra = found.length ? groupStaves(peaksAbove(Math.max(0.05, top * 0.08)).map((r) => r.mid)).filter((st) => {
    const g = median(st.slice(1).map((y, k) => y - (st[k] as number)));
    // A staff's five lines are one length (alike in the profile, within half again), and the spaces between them are
    // clearly lighter than the lines (at most 0.6 of the lighter neighbour): beams and specks at staff spacing are not.
    const v = st.map((r) => profile[r] as number);
    const alike = Math.max(...v) <= Math.min(...v) * 1.5;
    const spaced = st.slice(1).every((r, k) => (profile[Math.round((r + (st[k] as number)) / 2)] as number) <= Math.min(v[k] as number, v[k + 1] as number) * 0.6);
    return alike && spaced && Math.abs(g - spacing) <= Math.max(1, spacing * 0.15) && !found.some((f) => (st[0] as number) <= (f[4] as number) + spacing && (st[4] as number) >= (f[0] as number) - spacing);
  }) : [];
  const staves = [...found, ...extra].sort((p, q) => (p[0] as number) - (q[0] as number));
  if (options.debug) Object.assign(options.debug, { angle, paper, ink, top, runs: lineRuns, staves });
  if (!staves.length) return { angle, bands: [] };

  // Reading along the tilt: the page pixel under row r (of the straightened page) at column x.
  const tan = Math.tan((angle * Math.PI) / 180), cx = width / 2;
  const at = (x: number, r: number) => dark(x, Math.round(r + (x - cx) * tan));
  // Where a staff starts: the first column where most of its lines are inked, for a run (not a stray mark).
  const startOf = (staff: number[]) => {
    const run = Math.max(3, Math.round(width * 0.02));
    let inRun = 0;
    for (let x = 0; x < width; x += 1) {
      // Most of its lines inked here, and not a strip dark far above and below the staff too (a binding's shadow, a
      // page edge): a brace, a barline or a clef ends with the system.
      const span = (staff[4] as number) - (staff[0] as number);
      const strip = at(x, (staff[0] as number) - 2 * span) && at(x, (staff[4] as number) + 2 * span);
      const lit = !strip && staff.filter((r) => at(x, r) || at(x, r - 1) || at(x, r + 1)).length >= 3;
      inRun = lit ? inRun + 1 : 0;
      if (inRun >= run) return x - run + 1;
    }
    return 0;
  };
  const starts = staves.map(startOf);
  // Where each staff ends: the last column where most of its lines are inked.
  const endOf = (staff: number[]) => {
    for (let x = width - 1; x >= 0; x -= 1) if (staff.filter((r) => at(x, r) || at(x, r - 1) || at(x, r + 1)).length >= 3) return x;
    return width - 1;
  };
  const ends = staves.map(endOf);
  if (options.debug) Object.assign(options.debug, { starts, joins: [] });
  // Two staves are one system when a brace or barline runs down the gap between them where they start.
  const joined = (i: number) => {
    const upper = staves[i - 1] as number[], lower = staves[i] as number[];
    const from = (upper[4] as number) + 2, to = (lower[0] as number) - 2;
    if (to <= from) return true;
    const x0 = Math.min(starts[i - 1] as number, starts[i] as number);
    for (let x = Math.max(0, x0 - Math.round(width * 0.04)); x <= Math.min(width - 1, x0 + Math.round(width * 0.015)); x += 1) {
      // (not a strip dark far above and below the two staves as well: a brace or barline stops with the system)
      const span = (upper[4] as number) - (upper[0] as number);
      const dark3 = (r: number) => at(x - 1, r) || at(x, r) || at(x + 1, r); // (the same three columns the bridge is read in)
      if (dark3((upper[0] as number) - 2 * span) && dark3((lower[4] as number) + 2 * span)) continue;
      let hit = 0;
      for (let r = from; r <= to; r += 1) if (at(x - 1, r) || at(x, r) || at(x + 1, r)) hit += 1;
      if (hit / (to - from + 1) >= BRIDGE) { (options.debug?.joins as unknown[] | undefined)?.push({ i, x, x0, share: +(hit / (to - from + 1)).toFixed(2) }); return true; }
    }
    return false;
  };
  const systems: number[][][] = [[staves[0] as number[]]];
  for (let i = 1; i < staves.length; i += 1) {
    if (joined(i)) (systems[systems.length - 1] as number[][]).push(staves[i] as number[]);
    else systems.push([staves[i] as number[]]);
  }

  // A place to split a line in two (shown as halves on a phone upright): between 40% and 60% of the way across, the
  // column, with its neighbours, holding least ink besides the staff lines (so no note, stem or beam is cut).
  const splitOf = (system: number[][]) => {
    const lines = system.flat();
    const sp = median(system.flatMap((st) => st.slice(1).map((y, j) => y - (st[j] as number))));
    const x0 = Math.min(...system.map((st) => starts[staves.indexOf(st)] as number));
    const x1 = Math.max(...system.map((st) => ends[staves.indexOf(st)] as number));
    const from = Math.round((lines[0] as number) - 2 * sp), to = Math.round((lines[lines.length - 1] as number) + 2 * sp);
    const onLine = (r: number) => lines.some((y) => Math.abs(r - y) <= 1);
    const ink = (x: number) => { let d = 0; for (let r = from; r <= to; r += 1) if (!onLine(r) && at(x, r)) d += 1; return d; };
    const mid = (x0 + x1) / 2;
    let best = Math.round(mid), bestInk = Infinity;
    for (let x = Math.round(x0 + 0.4 * (x1 - x0)); x <= Math.round(x0 + 0.6 * (x1 - x0)); x += 1) {
      const c = ink(x - 1) + ink(x) + ink(x + 1);
      if (c < bestInk || (c === bestInk && Math.abs(x - mid) < Math.abs(best - mid))) { bestInk = c; best = x; }
    }
    return { split: best, ink: ink(best) };
  };

  // Bands: each system to halfway to its neighbours (the outer ones by half the gap next to them).
  const ext = systems.map((s) => ({ first: (s[0] as number[])[0] as number, last: (s[s.length - 1] as number[])[4] as number }));
  const gapAfter = (k: number) => (ext[k + 1] as { first: number }).first - (ext[k] as { last: number }).last;
  const space = median(staves.flatMap((s) => s.slice(1).map((y, k) => y - (s[k] as number))));
  const bands = systems.map((s, k) => {
    const e = ext[k] as { first: number; last: number };
    const above = k > 0 ? Math.round(gapAfter(k - 1) / 2) : Math.round((systems.length > 1 ? gapAfter(0) : space * 8) / 2);
    const below = k < systems.length - 1 ? gapAfter(k) - Math.round(gapAfter(k) / 2) - 1 : Math.round((systems.length > 1 ? gapAfter(k - 1) : space * 8) / 2);
    const { split, ink } = splitOf(s);
    return { top: Math.max(0, e.first - above), bottom: Math.min(height - 1, e.last + below), staffLines: s.flat(), staves: s.length, split, splitInk: ink };
  });
  // The margins: from a little left of the earliest staff start (the brace and the part name sit there) to the latest end.
  const left = Math.max(0, Math.min(...starts) / width - 0.06), right = Math.min(1, Math.max(...ends) / width + 0.01);
  return { angle, bands, left, right };
}

/**
 * Where to split a band of a page in two when its lines were set by hand (Adjust lines): between 40% and 60% across
 * `left`..`right` (page pixels), the column with its neighbours holding least ink, read along the page's tilt. (Staff
 * lines cross every column there alike, so they don't move the choice.)
 */
export function splitAt(gray: Uint8Array | Uint8ClampedArray, width: number, height: number, angle: number, top: number, bottom: number, left: number, right: number): number {
  const paper = (() => { const h = new Uint32Array(256); for (let i = 0; i < gray.length; i += 1) h[gray[i] as number] += 1; for (let t = 0, seen = 0; t < 256; t += 1) { seen += h[t] as number; if (seen >= gray.length / 2) return t; } return 255; })();
  const ink = Math.round((inkThresholdOf(gray) + paper) / 2);
  const tan = Math.tan((angle * Math.PI) / 180), cx = width / 2;
  const at = (x: number, r: number) => { const y = Math.round(r + (x - cx) * tan); return x >= 0 && x < width && y >= 0 && y < height && (gray[y * width + x] as number) <= ink; };
  const col = (x: number) => { let d = 0; for (let r = top; r <= bottom; r += 1) if (at(x, r)) d += 1; return d; };
  const mid = (left + right) / 2;
  let best = Math.round(mid), bestInk = Infinity;
  for (let x = Math.round(left + 0.4 * (right - left)); x <= Math.round(left + 0.6 * (right - left)); x += 1) {
    const c = col(x - 1) + col(x) + col(x + 1);
    if (c < bestInk || (c === bestInk && Math.abs(x - mid) < Math.abs(best - mid))) { bestInk = c; best = x; }
  }
  return best;
}

/** The bands alone (a straight page, or callers that don't straighten). */
export function detectSystems(gray: Uint8Array | Uint8ClampedArray, width: number, height: number, options: DetectOptions = {}): SystemBand[] {
  return detectPage(gray, width, height, options).bands;
}

/** RGBA from a canvas → the greyscale bytes the functions above want (Rec. 601 luma). */
export function toGreyscale(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i += 1) {
    const o = i * 4;
    gray[i] = Math.round(0.299 * (rgba[o] as number) + 0.587 * (rgba[o + 1] as number) + 0.114 * (rgba[o + 2] as number));
  }
  return gray;
}
