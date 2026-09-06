/**
 * Tempo steadiness: how far the playing drifts from the click (replan §5.3).
 *
 * The paper screen cannot see the notes — the music is on paper, and no OMR
 * runs. It can hear *when* keys go down, and if the metronome is running it
 * knows exactly when each click was. The distance between the two is the one
 * thing the app can honestly measure about playing it has never read, so it is
 * the one thing it measures.
 *
 * What this is not: an accuracy. A learner can be perfectly steady and playing
 * the wrong notes, and the summary says so in as many words rather than
 * letting a number imply otherwise.
 */

/** A note-on, in milliseconds on the same clock as the clicks. */
export interface Onset {
  atMs: number;
}

export interface Steadiness {
  /** Standard deviation of the offsets, in ms. The headline number. */
  sigmaMs: number;
  /** Mean signed offset: negative is ahead of the click, positive behind. */
  meanMs: number;
  /** How many onsets were close enough to a click to be counted. */
  counted: number;
  /** How many were dropped for being nearer nothing at all. */
  ignored: number;
}

/**
 * An onset further than this from every click is not late — it is a different
 * note, or an ornament, or a chord voiced deliberately loose.
 *
 * Half a beat at ♩=120 is 250 ms. Beyond that the "nearest click" stops being
 * a meaningful reference and folding it in would report a wobble that says
 * more about the arithmetic than about the playing.
 */
export const MAX_OFFSET_MS = 250;

/**
 * Onsets that land within this of each other count once.
 *
 * A chord is one rhythmic event played with five fingers, and five nearly
 * simultaneous onsets would otherwise weight that beat five times as heavily
 * as a single melody note.
 */
export const CHORD_WINDOW_MS = 60;

/** Click times for `beats` beats at `bpm`, starting at `startMs`. */
export function clickTimes(startMs: number, bpm: number, beats: number): number[] {
  const period = 60000 / Math.max(1, bpm);
  return Array.from({ length: Math.max(0, beats) }, (_, i) => startMs + i * period);
}

/** Collapses a chord into its first onset. */
export function collapseChords(onsets: Onset[], windowMs = CHORD_WINDOW_MS): Onset[] {
  const sorted = [...onsets].sort((a, b) => a.atMs - b.atMs);
  const out: Onset[] = [];
  for (const onset of sorted) {
    const last = out[out.length - 1];
    if (last && onset.atMs - last.atMs <= windowMs) continue;
    out.push(onset);
  }
  return out;
}

/**
 * Signed offset from the nearest click, or `null` when there is no click near
 * enough for the question to mean anything.
 */
export function offsetFromNearestClick(
  atMs: number,
  clicks: number[],
  maxOffsetMs = MAX_OFFSET_MS,
): number | null {
  if (clicks.length === 0) return null;
  let best: number | null = null;
  for (const click of clicks) {
    const offset = atMs - click;
    if (best === null || Math.abs(offset) < Math.abs(best)) best = offset;
  }
  if (best === null || Math.abs(best) > maxOffsetMs) return null;
  return best;
}

/**
 * The standard deviation of the offsets — the population one, not the sample.
 *
 * This is a description of the run that happened, not an estimate of some
 * wider population of runs, so dividing by N is the honest choice. It also
 * means a single onset reports 0 rather than a division by zero.
 */
export function steadiness(
  onsets: Onset[],
  clicks: number[],
  options: { maxOffsetMs?: number; chordWindowMs?: number } = {},
): Steadiness {
  const collapsed = collapseChords(onsets, options.chordWindowMs);
  const offsets: number[] = [];
  let ignored = 0;
  for (const onset of collapsed) {
    const offset = offsetFromNearestClick(onset.atMs, clicks, options.maxOffsetMs);
    if (offset === null) ignored += 1;
    else offsets.push(offset);
  }
  if (offsets.length === 0) {
    return { sigmaMs: 0, meanMs: 0, counted: 0, ignored };
  }
  const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length;
  const variance =
    offsets.reduce((total, value) => total + (value - mean) ** 2, 0) / offsets.length;
  return {
    sigmaMs: Math.sqrt(variance),
    meanMs: mean,
    counted: offsets.length,
    ignored,
  };
}

/**
 * How many onsets it takes before the number is worth printing.
 *
 * Below this the standard deviation is arithmetic rather than evidence, and
 * the summary says "not enough notes to judge" instead of a confident ±4 ms
 * drawn from three taps.
 */
export const MIN_ONSETS_FOR_STEADINESS = 12;

export function steadinessIsMeaningful(result: Steadiness): boolean {
  return result.counted >= MIN_ONSETS_FOR_STEADINESS;
}
