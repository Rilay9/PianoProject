// Your place on the path (owner, 2026-10-15): which steps of which lessons are done, how (their target met, a run of
// them played, or opened and come back from, for what keeps no runs), which were tried without their target met yet,
// and the lesson you are on. These say different things and are shown in their own words (review 2026-10-15: never
// one green check for "tried", "played" and "met"). Kept on this device in its own store (in the backup, merged like
// the others: a step done on either device stays done); deleted with nothing else. Steps never lock: this only
// records, it never stops you opening a step.

const KEY = 'piano-web.path.v1';

/** How a step came to be done: its target met; a run of it played (no target); opened and come back from (no runs kept). */
export type DoneHow = 'target' | 'played' | 'opened';
export interface Done { at: string; how: DoneHow }

interface Stored {
  version: 1;
  /** The lesson you are on: the last one you opened or switched to. */
  current?: string;
  /** lesson id -> step id -> when it was first done, and how. */
  done: Record<string, Record<string, Done>>;
  /** lesson id -> step id -> when it was last played without its target met (and not done yet). */
  tried: Record<string, Record<string, string>>;
}

function read(): Stored {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>;
    const obj = (v: unknown) => (v && typeof v === 'object' ? v : {}) as Record<string, never>;
    return { version: 1, ...(typeof s.current === 'string' ? { current: s.current } : {}), done: obj(s.done), tried: obj(s.tried) };
  } catch { return { version: 1, done: {}, tried: {} }; }
}
function write(s: Stored): void { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* this visit only */ } }

export function doneSteps(lesson: string): Record<string, Done> { return read().done[lesson] ?? {}; }
export function triedSteps(lesson: string): Record<string, string> { return read().tried[lesson] ?? {}; }
export function markDone(lesson: string, step: string, how: DoneHow, at = new Date().toISOString()): void {
  const s = read();
  (s.done[lesson] ??= {})[step] ??= { at, how }; // (the first time it was done stays)
  write(s);
}
export function markTried(lesson: string, step: string, at = new Date().toISOString()): void {
  const s = read();
  (s.tried[lesson] ??= {})[step] = at;
  write(s);
}
export function currentLesson(): string | undefined { return read().current; }
export function setCurrentLesson(id: string): void { const s = read(); s.current = id; write(s); }

/** A step's state in words: done (and how), tried, skipped (a later step was played, this one not), next, or to come. */
export function stepWords(d: Done | undefined, tried: string | undefined, skipped: boolean): { mark: string; words: string; cls: string } {
  // (review 2026-10-15, V18: a step with nothing to judge, Free play or Watch, is "visited": it counts, without a ✓)
  if (d) return d.how === 'opened' ? { mark: '•', cls: 'done visited', words: 'visited' } : { mark: '✓', cls: 'done', words: d.how === 'target' ? 'target met' : 'played through' };
  if (tried) return { mark: '◐', cls: 'tried', words: 'tried, target not met yet' };
  if (skipped) return { mark: '–', cls: 'skipped', words: 'skipped' };
  return { mark: '○', cls: '', words: 'to come' };
}
