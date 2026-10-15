// Ported from the old app (branch claude/piano-teaching-app-bo19td, app/src/pdf/systemPlan.ts) for the new PDF viewer;
// the docs/… references below are to that branch.
/**
 * From detected staff bands to the list of systems the viewer steps through,
 * and back again when the learner corrects one (docs/04 §5b).
 *
 * **Everything here is in fractions of the page height, not pixels.** The page
 * is rendered at whatever scale the phone's width asks for, and a correction
 * dragged in portrait has to survive being reopened in landscape, a reload at
 * a different device pixel ratio, and an export/import onto another phone.
 * Pixels would survive none of those.
 *
 * A page's cuts are stored as a **flat list of an even number of fractions,
 * one pair per line in line order**: `[top0, bottom0, top1, bottom1, …]`.
 * Pairs rather than single boundary lines, because the gap *between* two
 * systems is real — a single list of dividing lines would force every system
 * to start where the last one ended and drag half the next stave into view.
 * Lines may overlap (owner, 2026-10-14: low notes reaching into the next line's
 * space belong to their own line too), so the list is read pair by pair, never
 * sorted as a whole; lines keep their order by top. Older saved lists (sorted,
 * no overlaps) are already in this form.
 */
import { detectSystems, toGreyscale, type DetectOptions, type SystemBand } from './systems.ts'; // (with .ts: tests/pdf.mjs runs this file in Node)

export interface PlannedSystem {
  /** 0-based page index. */
  page: number;
  /** Fractions of the page height, 0–1. */
  top: number;
  bottom: number;
  /** 0-based index within the page. */
  indexOnPage: number;
}

/** Stored corrections, keyed by 0-based page index. */
export type CutMap = Record<number, number[]>;

/** Detected bands -> the stored representation. */
export function bandsToCuts(bands: readonly SystemBand[], pageHeight: number): number[] {
  const cuts: number[] = [];
  for (const band of bands) {
    cuts.push(clamp(band.top / pageHeight), clamp((band.bottom + 1) / pageHeight));
  }
  return cuts;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** The lines of a stored list as [top, bottom] pairs, in order by top (a pair given upside down is turned round; an odd last number is dropped). */
export function pairsOf(cuts: readonly number[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i + 1 < cuts.length; i += 2) {
    const a = clamp(cuts[i] as number), b = clamp(cuts[i + 1] as number);
    pairs.push(a <= b ? [a, b] : [b, a]);
  }
  return pairs.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
}
const flat = (pairs: readonly [number, number][]): number[] => pairs.flatMap((p) => [p[0], p[1]]);

/**
 * The stored representation -> systems.
 *
 * Tolerant on purpose: a hand-edited or half-dragged list can be out of order or
 * have an odd length, and losing the whole page to that would be worse than
 * dropping the stray number.
 */
export function cutsToSystems(cuts: readonly number[], page: number): PlannedSystem[] {
  const systems: PlannedSystem[] = [];
  for (const [top, bottom] of pairsOf(cuts)) {
    if (bottom - top < 0.005) continue; // A zero-height band is a slip, not a system.
    systems.push({ page, top, bottom, indexOnPage: systems.length });
  }
  return systems;
}

/**
 * Detects the systems on one rendered page.
 *
 * The caller hands over the page as RGBA from a canvas, because that is what
 * PDF.js produces and what a test can build by hand.
 */
export function detectPageSystems(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  options: DetectOptions = {},
): number[] {
  return bandsToCuts(detectSystems(toGreyscale(rgba, width, height), width, height, options), height);
}

/**
 * A page the detector found nothing on.
 *
 * This is not a failure to hide: a photographed page, a page of text, or a
 * scan too faint for the projection profile all land here, and the answer is
 * to show the whole page and let "adjust cuts" fix it — never to show an empty
 * viewer (docs/04 §5b: "without this, one bad detection makes a file useless").
 */
export function wholePageCuts(): number[] {
  return [0, 1];
}

/**
 * Moves one boundary (`index` into the stored list: 2k is line k's top, 2k+1 its bottom). A line may overlap its
 * neighbours (owner, 2026-10-14), but keeps its place in the order: its top stays below the previous line's top and
 * above the next line's, so each line's split points stay with it. A line's own top and bottom stay at least
 * LINE_MIN apart: cutsToSystems drops a thinner band, which would shift every later line's splits (review 2026-10-14).
 */
export function moveCut(cuts: readonly number[], index: number, to: number): number[] {
  const pairs = pairsOf(cuts);
  const k = Math.floor(index / 2);
  const line = pairs[k];
  if (index < 0 || !line) return flat(pairs);
  const LINE_MIN = 0.006, ORDER = 0.002;
  const v = clamp(to);
  if (index % 2 === 0) {
    const lo = k > 0 ? (pairs[k - 1] as [number, number])[0] + ORDER : 0;
    const hi = Math.min(line[1] - LINE_MIN, k + 1 < pairs.length ? (pairs[k + 1] as [number, number])[0] - ORDER : 1);
    line[0] = Math.min(hi, Math.max(lo, v));
  } else {
    line[1] = Math.min(1, Math.max(line[0] + LINE_MIN, v));
  }
  return flat(pairs);
}

/** Adds a system in the largest gap, which is where a missed one almost always is. */
export function addSystem(cuts: readonly number[]): number[] {
  const pairs = pairsOf(cuts);
  if (pairs.length === 0) return [0.1, 0.3];
  // The gaps: above the first line, between each line's bottom and the next line's top (none where they overlap), below the last.
  let bestStart = 0;
  let bestSize = (pairs[0] as [number, number])[0];
  for (let i = 0; i < pairs.length; i += 1) {
    const start = (pairs[i] as [number, number])[1];
    const end = i + 1 < pairs.length ? (pairs[i + 1] as [number, number])[0] : 1;
    if (end - start > bestSize) {
      bestSize = end - start;
      bestStart = start;
    }
  }
  const top = bestStart + bestSize * 0.2;
  const bottom = bestStart + bestSize * 0.8;
  return flat(pairsOf([...flat(pairs), top, bottom]));
}

/**
 * After lines were added or removed on a page: each line still there (same top and bottom) keeps its split points,
 * and a new line gets null (its split to be found from the page). In line order, as `cutsToSystems` gives them.
 * Before (2026-10-14), + line and − line found every line's split again, and a split placed by hand on another line
 * was lost.
 */
export function carrySplits(before: readonly number[], after: readonly number[], splits: readonly (readonly number[])[]): (number[] | null)[] {
  const old = cutsToSystems(before, 0);
  return cutsToSystems(after, 0).map((line) => {
    const k = old.findIndex((o) => Math.abs(o.top - line.top) < 1e-9 && Math.abs(o.bottom - line.bottom) < 1e-9);
    const kept = k >= 0 ? splits[k] : undefined;
    return kept ? [...kept] : null;
  });
}

/** Removes the system at `index` (both of its boundaries). */
export function removeSystem(cuts: readonly number[], index: number): number[] {
  const pairs = pairsOf(cuts);
  pairs.splice(index, 1);
  return flat(pairs);
}

/**
 * Keeps the reading position on the same system after a rebuild, rather than
 * reusing a raw array index.
 *
 * `systems` is a flat list across every page, so its length — and the
 * position of everything after the edited page — changes the moment a cut
 * is added or removed anywhere in the book. "Adjust cuts" lets a reader flip
 * to a page other than the one they were reading and fix it there, which is
 * the normal way to work through a scanned book; rebuilding from a leftover
 * numeric index after that silently lands them on a different system, with
 * nothing on screen to say it moved. Finding the same `(page, indexOnPage)`
 * pair in the new list — or the last system left on that page, if the edit
 * removed the one they were on — is what "the same position" actually means.
 */
export function reindexAfterRebuild(
  systems: readonly PlannedSystem[],
  position: { page: number; indexOnPage: number } | null,
  fallbackIndex: number,
): number {
  if (position) {
    const onPage = systems.filter((system) => system.page === position.page);
    if (onPage.length > 0) {
      const target = onPage.find((system) => system.indexOnPage === position.indexOnPage) ?? onPage[onPage.length - 1];
      const found = target ? systems.indexOf(target) : -1;
      if (found !== -1) return found;
    }
  }
  return Math.min(fallbackIndex, Math.max(0, systems.length - 1));
}
