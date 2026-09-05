/**
 * Tap tempo: turn a series of taps into a bpm.
 *
 * Kept as a pure function so it can be tested without an AudioContext or a
 * clock. The rules are the ones that make tapping feel right rather than
 * merely correct:
 *
 *   * **Average the recent intervals, not all of them.** A tempo you tapped
 *     thirty seconds ago should not still be dragging the answer.
 *   * **Restart after a long gap.** Two taps a minute apart are two attempts,
 *     not a 1 bpm tempo, and treating them as one is the single most annoying
 *     thing a tap-tempo control can do.
 *   * **Round to a whole number.** 97.3 bpm is false precision; nobody taps
 *     that accurately and no metronome needs it.
 */

/** Longer than this between taps and the previous taps are forgotten. */
export const TAP_RESET_MS = 2_500;
/** Intervals kept in the average. Four taps is one bar of 4/4. */
export const TAP_WINDOW = 4;
/** The range the UI accepts, matching the bpm field. */
export const MIN_BPM = 30;
export const MAX_BPM = 240;

export interface TapTempoState {
  /** Tap times in milliseconds, oldest first, already trimmed. */
  taps: number[];
  /** null until there are two taps within TAP_RESET_MS of each other. */
  bpm: number | null;
}

export const EMPTY_TAP_STATE: TapTempoState = { taps: [], bpm: null };

export function tap(state: TapTempoState, atMs: number): TapTempoState {
  const last = state.taps.at(-1);
  const restart = last === undefined || atMs - last > TAP_RESET_MS;
  const taps = restart ? [atMs] : [...state.taps, atMs].slice(-(TAP_WINDOW + 1));
  if (taps.length < 2) return { taps, bpm: null };

  const intervals = taps.slice(1).map((time, index) => time - (taps[index] ?? time));
  const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  if (mean <= 0) return { taps, bpm: state.bpm };
  const bpm = Math.round(60_000 / mean);
  return { taps, bpm: Math.min(MAX_BPM, Math.max(MIN_BPM, bpm)) };
}
