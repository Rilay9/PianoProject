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
 * A page's cuts are stored as a **flat, sorted list of an even number of
 * fractions**: `[top0, bottom0, top1, bottom1, …]`. Pairs rather than single
 * boundary lines, because the gap *between* two systems is real — a single
 * list of dividing lines would force every system to start where the last one
 * ended and drag half the next stave into view.
 */
import { detectSystems, toGreyscale, type DetectOptions, type SystemBand } from './systems';

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

/**
 * The stored representation -> systems.
 *
 * Tolerant on purpose: a hand-edited or half-dragged list can be unsorted or
 * have an odd length, and losing the whole page to that would be worse than
 * dropping the stray number.
 */
export function cutsToSystems(cuts: readonly number[], page: number): PlannedSystem[] {
  const sorted = [...cuts].map(clamp).sort((a, b) => a - b);
  const systems: PlannedSystem[] = [];
  for (let i = 0; i + 1 < sorted.length; i += 2) {
    const top = sorted[i] as number;
    const bottom = sorted[i + 1] as number;
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

/** Moves one boundary, keeping the list sorted and the neighbours out of the way. */
export function moveCut(cuts: readonly number[], index: number, to: number): number[] {
  const next = [...cuts];
  if (index < 0 || index >= next.length) return next;
  const minimum = index > 0 ? (next[index - 1] as number) + 0.002 : 0;
  const maximum = index + 1 < next.length ? (next[index + 1] as number) - 0.002 : 1;
  next[index] = Math.min(maximum, Math.max(minimum, clamp(to)));
  return next;
}

/** Adds a system in the largest gap, which is where a missed one almost always is. */
export function addSystem(cuts: readonly number[]): number[] {
  const sorted = [...cuts].sort((a, b) => a - b);
  if (sorted.length === 0) return [0.1, 0.3];
  let bestStart = 0;
  let bestSize = sorted[0] as number;
  for (let i = 1; i < sorted.length; i += 2) {
    const start = sorted[i] as number;
    const end = sorted[i + 1] ?? 1;
    if (end - start > bestSize) {
      bestSize = end - start;
      bestStart = start;
    }
  }
  const top = bestStart + bestSize * 0.2;
  const bottom = bestStart + bestSize * 0.8;
  return [...sorted, top, bottom].sort((a, b) => a - b);
}

/** Removes the system at `index` (both of its boundaries). */
export function removeSystem(cuts: readonly number[], index: number): number[] {
  const sorted = [...cuts].sort((a, b) => a - b);
  sorted.splice(index * 2, 2);
  return sorted;
}
