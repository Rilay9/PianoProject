// How long the PDF reader's timed turning waits on a line (owner, 2026-10-14: learned from your own turns, erring
// late; a turn of yours restarts it). Its own module so the tests can import it without pdf.js.
//
// The old app's version took the single last gap between two taps, so one hesitation set the pace, and assumed 4/4.
// Here: the time you actually spent on each of your last three lines (a line gone back to keeps counting, so a turn
// that came too early teaches it to wait longer), the middle of them; before there are any, the tempo, beats per bar
// and bars per line you give it.

/** A gap outside this is a double tap or a break, not a line played. */
export const LEARN_MIN_MS = 2_000;
export const LEARN_MAX_MS = 120_000;
/** How many of your recent lines it learns from (the middle one: one odd line does not set the pace). */
export const LEARN_FROM = 3;

/** One line at a tempo: bars × beats a bar at ♩ = bpm. */
export function arithmeticMs(bpm: number, beatsPerBar: number, barsPerLine: number): number {
  return (Math.max(1, barsPerLine) * Math.max(1, beatsPerBar) * 60_000) / Math.max(1, bpm);
}

/** The middle of the last LEARN_FROM usable times (null: none yet). */
export function learnedMs(times: readonly number[]): number | null {
  const usable = times.filter((t) => t >= LEARN_MIN_MS && t <= LEARN_MAX_MS).slice(-LEARN_FROM);
  if (!usable.length) return null;
  const s = [...usable].sort((a, b) => a - b);
  return s.length % 2 ? (s[(s.length - 1) / 2] as number) : ((s[s.length / 2 - 1] as number) + (s[s.length / 2] as number)) / 2;
}

/**
 * How long a line takes and the margin to wait beyond it (owner: err late): what was learned, and half the spread of
 * those lines (the more your lines vary, the longer it waits; measured 2026-10-14: the middle alone turned some lines a
 * moment early). Before anything is learned, the arithmetic and no margin. The margin is added once from your last own
 * turn, never line after line (that made it drift later and later).
 */
export function linePlan(times: readonly number[], bpm: number, beatsPerBar: number, barsPerLine: number): { per: number; margin: number; learned: boolean } {
  const l = learnedMs(times);
  if (l === null) return { per: arithmeticMs(bpm, beatsPerBar, barsPerLine), margin: 0, learned: false };
  const usable = times.filter((t) => t >= LEARN_MIN_MS && t <= LEARN_MAX_MS).slice(-LEARN_FROM);
  return { per: l, margin: (Math.max(...usable) - Math.min(...usable)) / 2, learned: true };
}

/** When to turn the line you're on: `lines` lines after your last own turn (1 = the line after it). */
export function turnAfter(plan: { per: number; margin: number }, lines: number): number {
  return lines * plan.per + plan.margin;
}

/** A line's wait shown in words: the line time plus the margin. */
export function lineMs(times: readonly number[], bpm: number, beatsPerBar: number, barsPerLine: number): { ms: number; learned: boolean } {
  const p = linePlan(times, bpm, beatsPerBar, barsPerLine);
  return { ms: p.per + p.margin, learned: p.learned };
}
