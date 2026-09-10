// Matching taps to metronome clicks for the diagnostics latency test, and
// turning those matches into a number worth acting on.
//
// Pure so the two awkward parts — which tap belongs to which click, and which
// taps to throw away — are unit-tested rather than eyeballed on a phone.

/**
 * How far *before* a click a tap is still credited to it.
 *
 * Asymmetric with the late window below, because the thing being measured is
 * not symmetric: an input path only ever delivers a note late, so a tap well
 * after the click is a plausible reading and a tap well before it is not — it
 * is somebody anticipating the *next* click. The window used to be ±400 ms on
 * a 1000 ms beat, which reaches most of the way to the neighbouring click in
 * both directions, so an anticipatory tap 400 ms early was credited to the
 * next click with a −400 ms delta and dragged the answer down with it.
 */
export const EARLY_WINDOW_MS = 200;

/**
 * How far *after* a click a tap is still credited to it.
 *
 * Generous enough to cover a slow cable on a slow phone (a 250 ms input path
 * is not unheard of) plus the learner's own lateness. The two windows
 * together have to stay comfortably inside one beat, or a single tap could
 * fall inside two clicks' windows and the answer would depend on which click
 * happened to be considered first.
 */
export const LATE_WINDOW_MS = 400;

export interface MatchWindow {
  earlyMs: number;
  lateMs: number;
}

export const DEFAULT_MATCH_WINDOW: Readonly<MatchWindow> = {
  earlyMs: EARLY_WINDOW_MS,
  lateMs: LATE_WINDOW_MS,
};

export interface TapMatch {
  /** Index into the click list, so a caller can label the tap it belongs to. */
  clickIndex: number;
  clickMs: number;
  tapMs: number;
  /** Positive = the note arrived after the click, negative = before it. */
  deltaMs: number;
}

/**
 * Credits each click with at most one tap.
 *
 * Walked click by click rather than tap by tap. Tap-first was the earlier
 * shape and it is order-dependent in the worst way: a single stray tap
 * between two clicks claimed the nearer one, which then pushed the real tap
 * for that click out of every remaining window, so one accidental key press
 * cost a sample *and* injected a wildly wrong delta. Click-first, each click
 * takes the earliest tap inside its own window and nothing outside that
 * window can reach it.
 *
 * The earliest tap in the window, not the closest to the click: closest would
 * quietly bias every reading towards zero, which is the one direction a
 * latency measurement must not be nudged. Earliest is also the right answer
 * for a chord or a bouncing key — the first contact is the one the learner
 * meant, the rest are echoes.
 */
export function matchTapsToClicks(
  clickTimesMs: readonly number[],
  tapTimesMs: readonly number[],
  window: MatchWindow = DEFAULT_MATCH_WINDOW,
): TapMatch[] {
  const taps = [...tapTimesMs].sort((a, b) => a - b);
  const used = new Set<number>();
  const matches: TapMatch[] = [];
  for (let clickIndex = 0; clickIndex < clickTimesMs.length; clickIndex += 1) {
    const clickMs = clickTimesMs[clickIndex];
    if (clickMs === undefined) continue;
    for (let t = 0; t < taps.length; t += 1) {
      if (used.has(t)) continue;
      const tapMs = taps[t];
      if (tapMs === undefined) continue;
      const deltaMs = tapMs - clickMs;
      if (deltaMs < -window.earlyMs) continue;
      if (deltaMs > window.lateMs) break;
      used.add(t);
      matches.push({ clickIndex, clickMs, tapMs, deltaMs });
      break;
    }
  }
  return matches;
}

/** Fewer surviving taps than this and the median is a guess, not a reading. */
export const MIN_USABLE_TAPS = 5;

/** Below this many taps there is no reliable spread to judge outliers against. */
export const MIN_TAPS_TO_REJECT = 4;

/**
 * How many robust standard deviations from the median a tap may sit.
 *
 * Three is the usual choice and it is deliberately loose: the job here is to
 * drop the tap that was plainly a fumble, not to trim the distribution until
 * it looks tidy.
 */
export const OUTLIER_SIGMAS = 3;

/**
 * Nothing closer than this to the median is ever an outlier.
 *
 * Six taps within a couple of milliseconds of each other give a MAD near
 * zero, and without a floor the seventh tap 8 ms away would be thrown out as
 * an outlier — which is nonsense, since 8 ms is below the resolution anyone
 * can tap to. The floor keeps a tight run from eating its own samples.
 */
export const OUTLIER_FLOOR_MS = 20;

/** Scale factor that turns a median absolute deviation into a σ estimate. */
const MAD_TO_SIGMA = 1.4826;

/** The p-th percentile (0..1) of `values`, interpolating between neighbours. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * Math.min(1, Math.max(0, p));
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const a = sorted[low];
  const b = sorted[high];
  if (a === undefined || b === undefined) return NaN;
  return a + (b - a) * (rank - low);
}

/** The middle value, or the mean of the middle two. NaN for nothing at all. */
export function median(values: readonly number[]): number {
  return percentile(values, 0.5);
}

export interface Partition {
  kept: number[];
  rejected: number[];
}

/**
 * Splits `values` into the ones near the median and the ones far from it.
 *
 * Median and MAD rather than mean and σ, because the mean and σ are dragged
 * by the very tap being looked for: with eight samples one tap a beat out
 * moves the mean far enough that it makes *itself* look ordinary and pulls a
 * good sample over the threshold instead.
 */
export function rejectOutliers(
  values: readonly number[],
  sigmas: number = OUTLIER_SIGMAS,
  floorMs: number = OUTLIER_FLOOR_MS,
): Partition {
  if (values.length < MIN_TAPS_TO_REJECT) return { kept: [...values], rejected: [] };
  const mid = median(values);
  const mad = median(values.map((v) => Math.abs(v - mid)));
  const limit = Math.max(floorMs, sigmas * MAD_TO_SIGMA * mad);
  const kept: number[] = [];
  const rejected: number[] = [];
  for (const v of values) {
    if (Math.abs(v - mid) <= limit) kept.push(v);
    else rejected.push(v);
  }
  // A pathological run (say four taps in two pairs a second apart) can leave
  // too little standing to say anything. Better to hand back everything and
  // let `usable` report the run as untrustworthy than to invent a median from
  // two survivors.
  if (kept.length < MIN_TAPS_TO_REJECT) return { kept: [...values], rejected: [] };
  return { kept, rejected };
}

export interface LatencySummary {
  /** Taps the median was computed from. */
  used: number;
  /** Taps credited to a click and then thrown out as outliers. */
  rejected: number;
  /** The answer: the typical delay, in milliseconds. NaN when there is none. */
  medianMs: number;
  /**
   * Half the interquartile range: half the taps landed within this much of
   * the median. Reported instead of σ because σ is moved by exactly the taps
   * that were just thrown out, so quoting it alongside a robust median would
   * describe a different set of numbers.
   */
  spreadMs: number;
  minMs: number;
  maxMs: number;
  /** True when enough taps survived for the median to mean anything. */
  usable: boolean;
}

const EMPTY_SUMMARY: LatencySummary = {
  used: 0,
  rejected: 0,
  medianMs: NaN,
  spreadMs: NaN,
  minMs: NaN,
  maxMs: NaN,
  usable: false,
};

/**
 * The median delay and its spread, with the fumbles dropped.
 *
 * `usable` is the part that matters to a caller: a run that collected two
 * taps out of twelve produces a median, and that median must not be offered
 * as a measurement.
 */
export function summariseLatency(
  deltasMs: readonly number[],
  minTaps: number = MIN_USABLE_TAPS,
): LatencySummary {
  if (deltasMs.length === 0) return EMPTY_SUMMARY;
  const { kept, rejected } = rejectOutliers(deltasMs);
  if (kept.length === 0) return { ...EMPTY_SUMMARY, rejected: rejected.length };
  return {
    used: kept.length,
    rejected: rejected.length,
    medianMs: median(kept),
    spreadMs: (percentile(kept, 0.75) - percentile(kept, 0.25)) / 2,
    minMs: Math.min(...kept),
    maxMs: Math.max(...kept),
    usable: kept.length >= minTaps,
  };
}
