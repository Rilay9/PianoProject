/**
 * How long the PDF viewer's Timed mode waits between systems (`04` §5b).
 *
 * Its own module so a unit test can import it without pulling pdf.js — which
 * wants `DOMMatrix` — into Node.
 */
/** docs/04 §5b: timed advance is set in bpm, so a system needs a bar count. */
export const DEFAULT_BARS_PER_SYSTEM = 4;
export const BEATS_PER_BAR = 4;

export function secondsPerSystem(bpm: number, barsPerSystem: number): number {
  return (barsPerSystem * BEATS_PER_BAR * 60) / Math.max(1, bpm);
}

/**
 * The gap between two manual advances that Timed is allowed to learn from
 * (P21d D3). Shorter is a double-tap; longer is a break, not a system.
 */
export const LEARN_MIN_MS = 2_000;
export const LEARN_MAX_MS = 120_000;

/**
 * How long a system takes, learned from the last two taps when there are two,
 * and from the bpm and bars-per-system arithmetic when there are not.
 *
 * The arithmetic assumes 4/4 and a bar count he has to work out; two taps of
 * "next" while playing measure the real thing. Same idea as tap-tempo.
 */
export function intervalMs(
  learnedMs: number | null,
  bpm: number,
  barsPerSystem: number,
): { ms: number; learned: boolean } {
  if (learnedMs !== null && learnedMs >= LEARN_MIN_MS && learnedMs <= LEARN_MAX_MS) {
    return { ms: learnedMs, learned: true };
  }
  return { ms: secondsPerSystem(bpm, barsPerSystem) * 1000, learned: false };
}
