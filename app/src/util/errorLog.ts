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
}

const MAX_DISTINCT = 50;
const log = new Map<string, LoggedError>();
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
  if (existing) {
    existing.count += 1;
    existing.lastAt = now;
    announce(existing);
    return;
  }
  if (log.size >= MAX_DISTINCT) return;
  const entry: LoggedError = {
    message,
    source,
    firstAt: now,
    lastAt: now,
    count: 1,
    ...(stack ? { stack } : {}),
  };
  log.set(key, entry);
  announce(entry);
}

export function loggedErrors(): LoggedError[] {
  return [...log.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
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
  installed = false;
}
