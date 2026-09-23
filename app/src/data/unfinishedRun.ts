/**
 * Where a run was left, so reopening a piece does not silently start again.
 *
 * The owner (2026-09-22), on how a mode starts: *"it should be intuitive"* —
 * and the case he named is coming back. A run abandoned half way through was
 * remembered nowhere at all, so the piece reopened at bar 1 with nothing on
 * the screen acknowledging that anything had happened, and the twelve bars
 * that had been practised were the learner's to find again by hand.
 *
 * `localStorage`, not the database, and deliberately:
 *
 *   - it has to be readable **synchronously while the screen is being built**,
 *     because the offer belongs in the first paint and not in a row that
 *     appears under the learner's thumb a moment later;
 *   - it is a fact about this phone and this week, not part of the practice
 *     record. Nothing here is a score, a pass or a minute; `progressStore`
 *     holds what is true about the learner and this holds what is true about
 *     the app's last state. A backup that carried it would restore somebody
 *     into the middle of a run they finished on another device.
 *
 * Everything here swallows a storage failure. A browser with storage refused
 * loses the offer, which is exactly the app as it was before this existed.
 */

const KEY = 'pianopath.unfinished';

/**
 * How many pieces are remembered.
 *
 * Small on purpose: the question this answers is "what was I in the middle
 * of?", and a list long enough to hold the whole library would be answering a
 * different one. The oldest falls off.
 */
const KEEP = 12;

export interface UnfinishedRun {
  itemId: string;
  /** The **printed** bar the cursor was on — what the page says, not an index. */
  bar: number;
  /** The last printed bar of the piece, so the offer can say "of 48". */
  ofBars: number;
  /** ISO, for trimming the oldest and for nothing else. */
  at: string;
}

function read(): UnfinishedRun[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is UnfinishedRun => {
      if (typeof row !== 'object' || row === null) return false;
      const entry = row as Partial<UnfinishedRun>;
      return (
        typeof entry.itemId === 'string' &&
        typeof entry.bar === 'number' &&
        Number.isFinite(entry.bar) &&
        typeof entry.ofBars === 'number' &&
        typeof entry.at === 'string'
      );
    });
  } catch {
    return [];
  }
}

function write(rows: UnfinishedRun[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(0, KEEP)));
  } catch {
    // Storage refused. The offer is simply not made next time.
  }
}

/**
 * Remembers where a run was left.
 *
 * Bar 1 is **not** remembered: a run abandoned on its first bar is a piece
 * opened and closed again, and "carry on from bar 1" is what the screen does
 * anyway. Offering it would be furniture on every second visit (`04` §0 R4).
 */
export function rememberUnfinished(run: UnfinishedRun): void {
  if (run.bar <= 1) return;
  write([run, ...read().filter((row) => row.itemId !== run.itemId)]);
}

export function unfinishedFor(itemId: string): UnfinishedRun | undefined {
  return read().find((row) => row.itemId === itemId);
}

/** After a run reaches the end, or after the learner says to start again. */
export function forgetUnfinished(itemId: string): void {
  const rows = read();
  const kept = rows.filter((row) => row.itemId !== itemId);
  if (kept.length !== rows.length) write(kept);
}

/** Test hook: a phone that has never left a run. */
export function forgetAllUnfinishedForTest(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget.
  }
}
