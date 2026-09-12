/**
 * Uncaught errors and unhandled rejections, counted (docs/04 §7b).
 *
 * The app runs on one phone with no crash reporter and no console open, so an
 * error that happens mid-practice leaves no trace at all unless something
 * catches it here. Installed once from `main.ts`; the Diagnostics screen reads
 * the list and the debug report carries it.
 *
 * Bounded, because a render loop that throws every frame would otherwise eat
 * the memory the score needs. Identical messages are counted rather than
 * repeated — a hundred copies of one error is one bug and one line.
 */

export interface LoggedError {
  message: string;
  source: 'error' | 'rejection';
  /** ISO time of the first occurrence. */
  firstAt: string;
  lastAt: string;
  count: number;
  stack?: string;
  /**
   * How recently this was seen, as a counter rather than a clock.
   *
   * `lastAt` has millisecond resolution and two errors half a millisecond
   * apart carry the same string, so ordering by it left "most recent" as
   * whichever happened to be inserted first — which on a fast machine is the
   * *older* one. A counter cannot tie.
   */
  seq: number;
}

const MAX_DISTINCT = 50;
/**
 * Where every kind of error past the bound is counted together.
 *
 * The bound is on *memory* — fifty distinct messages, each with a stack, on a
 * phone — and it was being enforced by dropping the fifty-first on the floor:
 * not counted, not stored, and above all not announced. The error boundary
 * listens to the announcement, so once fifty kinds had happened a *new* kind
 * of error raised no banner at all. A session that had been noisy went quiet
 * about the one fault that had not been seen before, which is exactly the one
 * worth saying.
 *
 * So the bound still holds and nothing past it is kept separately, but it is
 * counted, it is in the report, and it still announces. The message says how
 * many kinds it stands for so the report cannot read as one stray error.
 */
const OVERFLOW_KEY = 'error:__overflow__';
const overflowKinds = new Set<string>();
const log = new Map<string, LoggedError>();
let sequence = 0;
const listeners = new Set<(entry: LoggedError) => void>();

/**
 * Called on every error, including repeats of one already logged.
 *
 * The error boundary (`ui/errorBoundary`) listens here rather than to
 * `window`, so the banner and the debug report can never disagree about what
 * happened or how many times.
 */
export function onErrorLogged(cb: (entry: LoggedError) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function announce(entry: LoggedError): void {
  for (const listener of listeners) {
    try {
      listener(entry);
    } catch {
      // A listener that throws must not become an error about an error.
    }
  }
}

export function recordError(message: string, source: LoggedError['source'], stack?: string): void {
  const key = `${source}:${message}`;
  const now = new Date().toISOString();
  const existing = log.get(key);
  sequence += 1;
  if (existing) {
    existing.count += 1;
    existing.lastAt = now;
    existing.seq = sequence;
    announce(existing);
    return;
  }
  if (log.size >= MAX_DISTINCT) {
    overflowKinds.add(key);
    const bucket = log.get(OVERFLOW_KEY);
    const kinds = overflowKinds.size;
    const said = `${String(kinds)} other kind${kinds === 1 ? '' : 's'} of error, not kept separately`;
    if (bucket) {
      bucket.count += 1;
      bucket.lastAt = now;
      bucket.seq = sequence;
      bucket.message = said;
      announce(bucket);
      return;
    }
    const first: LoggedError = {
      message: said,
      source,
      firstAt: now,
      lastAt: now,
      count: 1,
      seq: sequence,
    };
    log.set(OVERFLOW_KEY, first);
    announce(first);
    return;
  }
  const entry: LoggedError = {
    message,
    source,
    firstAt: now,
    lastAt: now,
    count: 1,
    seq: sequence,
    ...(stack ? { stack } : {}),
  };
  log.set(key, entry);
  announce(entry);
}

export function loggedErrors(): LoggedError[] {
  return [...log.values()].sort((a, b) => b.seq - a.seq);
}

export function errorCount(): number {
  return [...log.values()].reduce((sum, entry) => sum + entry.count, 0);
}

let installed = false;

export function installErrorLog(target: Window = window): void {
  if (installed) return;
  installed = true;
  target.addEventListener('error', (event) => {
    recordError(event.message || String(event.error), 'error', (event.error as Error | undefined)?.stack);
  });
  target.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    recordError(
      reason instanceof Error ? reason.message : String(reason),
      'rejection',
      reason instanceof Error ? reason.stack : undefined,
    );
  });
}

/** Test hook. */
export function resetErrorLogForTest(): void {
  log.clear();
  listeners.clear();
  overflowKinds.clear();
  installed = false;
  sequence = 0;
}
