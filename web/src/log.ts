// The practice log (owner, 2026-10-13): one entry per run (a start to its stop, or opening a screen to leaving it),
// so Claude can plan the next lesson from how practice actually went: what was played (screen, mode, content, the
// activity if any, the choices that matter) and what happened (counts, and each slip: bar, note, what). Kept on the
// phone (in the backup too), exported from ⋯ → Export practice log. Entries older than a month are deleted (a choice
// in ⋯, on by default), and never more than MAX_ENTRIES (the oldest go first). docs/app-features.md §7b.

const KEY = 'piano-web.log.v1';
const MAX_ENTRIES = 3000; // owner: months of daily practice, well within the phone's storage
const MONTH_MS = 31 * 24 * 3600 * 1000;
export const MAX_SLIPS = 40; // per entry: enough to see the pattern, small enough to keep thousands

/** A slip: the printed bar, the note (as written, C♯4), and what happened. */
export interface Slip { bar: number; note: string; what: 'missed' | 'early' | 'late' | 'let go early' | 'wrong key' | 'stuck' | 'helped' }

/** One run. Times are ISO dates; `seconds` how long it lasted. `result` is the mode's own (docs §7b). */
export interface LogEntry {
  at: string; seconds: number;
  /** 'lesson': not a run but how a lesson's step went for you (the feedback taps after it; owner, 2026-10-15). */
  screen: 'score' | 'memorise' | 'simon' | 'drills' | 'lab' | 'lesson';
  mode?: string;
  /** What was played: a piece (and bars), a set, or a chart; its title as shown. */
  piece?: string; set?: string; chart?: string; title: string; bars?: string;
  /** The activity it was opened from, if any (content/activities/<id>.json). */
  activity?: string;
  /** The lesson step it was played for, if any (content/path): the rung, the lesson and the step's ids. */
  lesson?: LessonRef;
  /** The choices that matter for reading the result (tempo in beats a minute, hands, help level, step…). */
  settings: Record<string, string | number | boolean>;
  result: Record<string, unknown>;
}

export interface LessonRef { rung: string; lesson: string; step: string }

interface Stored { autoDelete: boolean; entries: LogEntry[] }

function read(): Stored {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>;
    return { autoDelete: s.autoDelete ?? true, entries: Array.isArray(s.entries) ? s.entries : [] };
  } catch { return { autoDelete: true, entries: [] }; }
}
function write(s: Stored): void {
  // Full (the phone's storage for the app): the oldest fifth goes, and it tries again.
  for (let tries = 0; tries < 5; tries++) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); return; } catch { s.entries.splice(0, Math.max(1, Math.ceil(s.entries.length / 5))); }
  }
}
function prune(s: Stored): void {
  if (s.autoDelete) { const cut = Date.now() - MONTH_MS; s.entries = s.entries.filter((e) => Date.parse(e.at) >= cut); }
  if (s.entries.length > MAX_ENTRIES) s.entries.splice(0, s.entries.length - MAX_ENTRIES);
}

/** The activity a screen was opened from, and the lesson step it was opened for (main.ts sets it; another screen or
 * song ends it, and its runs stop being the step's). */
let activity: { id: string; screen: string; lesson?: LessonRef } | null = null;
export function setActivity(a: { id: string; screen: string; lesson?: LessonRef } | null): void { activity = a; }
export function activityOf(screen: string): string | undefined { return activity?.screen === screen ? activity.id : undefined; }

/** Adds a run (nothing is added for a run with nothing in it: the caller decides). */
export function addEntry(e: LogEntry): void {
  const s = read();
  const a = activity?.screen === e.screen ? activity : null;
  s.entries.push({ ...e, ...(e.activity === undefined && a ? { activity: a.id } : {}), ...(e.lesson === undefined && a?.lesson ? { lesson: a.lesson } : {}) });
  prune(s);
  write(s);
}

/** Adds or replaces the entry with the same time, screen and lesson step (a step's feedback, changed tap by tap). */
export function putEntry(e: LogEntry): void {
  const s = read();
  const i = s.entries.findIndex((x) => x.at === e.at && x.screen === e.screen && x.lesson?.step === e.lesson?.step && x.lesson?.lesson === e.lesson?.lesson);
  if (i >= 0) s.entries[i] = e; else s.entries.push(e);
  prune(s);
  write(s);
}

/** The entries kept (oldest first): for Home's "carry on" and recent list, the Path's week, a step's result. */
export function entries(): LogEntry[] { return read().entries; }

export function autoDelete(): boolean { return read().autoDelete; }
export function setAutoDelete(on: boolean): void { const s = read(); s.autoDelete = on; prune(s); write(s); }
export function entryCount(): number { return read().entries.length; }

/** The log as a file for Claude: every entry kept, oldest first. */
export function exportLog(): string {
  const s = read();
  prune(s);
  return JSON.stringify({ app: 'piano-web', kind: 'practice-log', version: 1, exported: new Date().toISOString(), entries: s.entries }, null, 1);
}

/** A run being recorded: its start, and its slips (kept to MAX_SLIPS; the count of all is kept too). */
export class Run {
  readonly started = Date.now();
  slips: Slip[] = [];
  slipCount = 0;
  slip(s: Slip): void { this.slipCount++; if (this.slips.length < MAX_SLIPS) this.slips.push(s); }
  get seconds(): number { return Math.round((Date.now() - this.started) / 1000); }
  get at(): string { return new Date(this.started).toISOString(); }
}

/** A key named as players read it (sharps; middle C = C4), for slips with no written spelling. */
export function keyName(midi: number): string {
  return `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][midi % 12]}${Math.floor(midi / 12) - 1}`;
}
