// The practice log (owner, 2026-10-13): one entry per run (a start to its stop, or opening a screen to leaving it),
// so Claude can plan the next lesson from how practice actually went: what was played (screen, mode, content, the
// activity if any, the choices that matter) and what happened (counts, and each slip: bar, note, what). Kept on the
// phone (in the backup too), exported from ⋯ → Export practice log. Entries older than a month are deleted (a choice
// in ⋯, on by default), and never more than MAX_ENTRIES (the oldest go first). docs/app-features.md §7b.

import type { Activity } from './activity';

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

/**
 * "Opened from an activity" (owner, 2026-10-16, the consistency pass: one path for every screen, replacing the
 * lesson-only flags): the activity a screen was opened with and, when a lesson step opened it, the step, its task and
 * whether note names are shown. main.ts `launch` sets it before the screen opens; `endStep()` ends it, when another
 * screen is opened (or you come back to the lesson). Choices changed on the screen (another set, level, mode, hands,
 * bars) do not end it: the task line says the practice now is not counted (lesson/task-line.ts), and the runs are
 * still kept with the step, where lesson/result.ts `playedAsSet` tells them apart.
 */
export interface StepContext {
  id: string;
  screen: string;
  lesson?: LessonRef;
  /** The activity's own title, and the step's task (its `about`), shown on the screen's task line. */
  title?: string;
  task?: string;
  /** false: no note names on this screen while the activity lasts (owner, 2026-10-16: until a lesson has taught them). */
  names?: boolean;
  /** The activity itself, for the live "played as the step sets it" (lesson/result.ts playedAsSet). */
  activity?: Activity;
}
let activity: StepContext | null = null;
export function setStep(a: StepContext): void { activity = a; }
/** The one place the activity ends. */
export function endStep(): void { activity = null; }
/** Simon and Drills are one screen with two ways to practise (Practise as…): an activity opened in one is still in force in the other. */
const sameScreen = (a: string, b: string) => a === b || ((a === 'simon' || a === 'drills') && (b === 'simon' || b === 'drills'));
/** The activity in force on this screen (null: none). */
export function stepFor(screen: string): StepContext | null { return activity && sameScreen(activity.screen, screen) ? activity : null; }
export function activityOf(screen: string): string | undefined { return activity?.screen === screen ? activity.id : undefined; }
/** Whether note names are shown on this screen now (an activity can turn them off until they are taught). */
export function namesShown(screen: string): boolean { return stepFor(screen)?.names !== false; }
/** The activity in force for this screen now, to be kept with a run as it starts (null: none). */
export type ActivityTag = { id: string; screen: string; lesson?: LessonRef } | null;
export function activityTag(screen: string): ActivityTag {
  const a = stepFor(screen);
  return a ? { id: a.id, screen, ...(a.lesson ? { lesson: a.lesson } : {}) } : null;
}

/**
 * What a step with nothing judged needs before it counts as visited (owner, 2026-10-16): Free play, a key played;
 * Watch, the music heard to its end. Kept apart from the activity (which ends as the screen closes) until the lesson page
 * reads it on your return.
 */
const evidence = new Set<string>();
const stepKey = (r: LessonRef) => `${r.rung}|${r.lesson}|${r.step}`;
export function stepEvidence(screen: string): void { const a = stepFor(screen); if (a?.lesson) evidence.add(stepKey(a.lesson)); }
export function takeEvidence(r: LessonRef): boolean { const k = stepKey(r); const had = evidence.has(k); evidence.delete(k); return had; }

/**
 * Adds a run (nothing is added for a run with nothing in it: the caller decides). tag: the activity the run was played
 * with, kept from its start (final review 2026-10-15, F06: a set left by choosing another was logged after the choice
 * had ended the activity); left out, the activity in force now. replace: in place of the entry with the same time, screen
 * and step (a Simon game logged at its goal and played on with Keep going: owner, 2026-10-17), or added if there is none.
 */
export function addEntry(e: LogEntry, tag?: ActivityTag, replace = false): void {
  const s = read();
  const t = tag === undefined ? activityTag(e.screen) : tag;
  const a = t && sameScreen(t.screen, e.screen) ? t : null;
  const full: LogEntry = { ...e, ...(e.activity === undefined && a ? { activity: a.id } : {}), ...(e.lesson === undefined && a?.lesson ? { lesson: a.lesson } : {}) };
  const i = replace ? s.entries.findIndex((x) => sameEntry(x, full)) : -1;
  if (i >= 0) s.entries[i] = full; else s.entries.push(full);
  prune(s);
  write(s);
}

const sameEntry = (x: LogEntry, e: Pick<LogEntry, 'at' | 'screen' | 'lesson'>) => x.at === e.at && x.screen === e.screen && x.lesson?.step === e.lesson?.step && x.lesson?.lesson === e.lesson?.lesson;
/** Adds or replaces the entry with the same time, screen and lesson step (a step's feedback, changed tap by tap). */
export function putEntry(e: LogEntry): void {
  const s = read();
  const i = s.entries.findIndex((x) => sameEntry(x, e));
  if (i >= 0) s.entries[i] = e; else s.entries.push(e);
  prune(s);
  write(s);
}
/** Removes that entry (a step's feedback cleared tap by tap: final review 2026-10-15, F05). */
export function removeEntry(e: Pick<LogEntry, 'at' | 'screen' | 'lesson'>): void {
  const s = read();
  const i = s.entries.findIndex((x) => sameEntry(x, e));
  if (i < 0) return;
  s.entries.splice(i, 1);
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
