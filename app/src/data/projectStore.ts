/**
 * What the learner says they are doing with a piece (G1b; R19, R47, R18, L86; the brief
 * `docs/prompts/tasks/G1b-repertoire-lifecycle.md`, approved with the reviewer's rulings in
 * `docs/review/responses/a96395d.md`).
 *
 * **Intention, and nothing else.** Encounter history says what was met (`encounterStore`), evidence
 * what was measured, the rung and skill state what the evidence supports, the session today's plan;
 * a project says what the learner intends to do with the music. It informs those layers and stands
 * in for none of them: *saved* is not played, *learning* says no bars, *put away* erases no
 * familiarity, *bringing it back* makes nothing novel. So:
 *
 * - **Every transition is the learner's action** on the project sheet (`ui/projectSheet.ts`, the one
 *   caller of `applyProjectAction`). The app proposes nothing and moves nothing: no state drifts
 *   with time, none is inferred from a run. An action the sheet does not offer for the current state
 *   is refused (`OFFERS`).
 * - **Nothing is written but the project.** No encounter, run, progress row or evidence — *I
 *   performed it* records the learner's day on the project and is never a performance run or a
 *   `performed` encounter. No state is read by evidence, skill or eligibility code. The session reads
 *   one thing, for one purpose (G1d; the reviewer's G82 ruling): Today hands it the rows, and the
 *   review's repertoire retention does not offer a piece whose project is `paused` or `retired`
 *   (`projectIn`, over the rows it is given; it never opens the store). `ProgressRow.status`,
 *   `learnedPieces`, *A piece you know* and the rest of the session read exactly what they read
 *   before.
 * - **The history is appended, never rewritten**, and pausing or putting a piece away deletes
 *   nothing anywhere.
 * - **Identity fails conservatively.** A project is keyed by the piece's material where it has one
 *   (`material.materialKey`: a notated item's built file, an import's stored bytes), so a second
 *   catalogue id of the same file finds the same project; where the item names no material the row is
 *   the id's (`id:<itemId>`) and answers for that id alone — never guessed to be another piece.
 * - **R18's three facts** — this week's goal, the current problem, the sections — are the learner's
 *   free text, optional, and choose nothing in G1b (the session's use is X's).
 *
 * Exploring is the absence of a row. Meeting a piece, playing it once, passing it, makes no project;
 * a database from before G1b has none, and none is manufactured from a passed piece.
 */
import { openDatabase, type EncounterMaterial, type ProjectAction, type ProjectRow, type ProjectSection, type ProjectState, type ProjectStep } from './db';
import { dayKey } from './progressStore';
import { knownMaterial, materialKey, sameMaterial } from '../curriculum/material';
import type { CatalogItem } from '../curriculum/types';
import type { Identity } from '../review/record';

export type { ProjectAction, ProjectRow, ProjectSection, ProjectState, ProjectStep } from './db';

/** Part 27's states, in the order a piece usually meets them. */
export const PROJECT_STATES: readonly ProjectState[] = ['saved', 'learning', 'polishing', 'performance-ready', 'maintaining', 'refreshing', 'paused', 'retired'];

/** The state each action enters. */
export const ACTION_STATE: Readonly<Record<ProjectAction, ProjectState>> = {
  save: 'saved',
  learn: 'learning',
  polish: 'polishing',
  ready: 'performance-ready',
  performed: 'maintaining',
  keep: 'maintaining',
  'bring-back': 'refreshing',
  pause: 'paused',
  retire: 'retired',
};

/**
 * What the sheet offers from each state — the transitions table, and the only transitions there
 * are. From no project: the first three states and *Keep it playable* (a piece already learned, made
 * a project from Progress), each before any run if the learner wishes (the brief's adversary: "learn
 * this piece" before success). *Bring it back* only from paused, put away or kept playable (item 2).
 * *I performed it* again from kept playable records another performance day. Each state keeps one
 * way out that a learner would recognise, and every state is reachable.
 */
export const OFFERS: Readonly<Record<ProjectState | 'none', readonly ProjectAction[]>> = {
  none: ['save', 'learn', 'polish', 'keep'],
  saved: ['learn', 'polish', 'retire'],
  learning: ['polish', 'performed', 'keep', 'pause', 'retire'],
  polishing: ['ready', 'performed', 'pause', 'retire'],
  'performance-ready': ['performed', 'keep', 'polish', 'pause', 'retire'],
  maintaining: ['performed', 'polish', 'bring-back', 'pause', 'retire'],
  refreshing: ['keep', 'polish', 'pause', 'retire'],
  paused: ['bring-back', 'learn', 'retire'],
  retired: ['bring-back'],
};

/** The actions the sheet offers for a project in this state, or for a piece with no project. */
export function actionsFor(state: ProjectState | undefined): readonly ProjectAction[] {
  return OFFERS[state ?? 'none'];
}

/**
 * The stages whose units are projects, not rungs to pass: Stage 9 says of itself "Nothing here is a
 * rung to pass" (`content/curriculum/stage-9.json`). By number, as `session.ts` keeps its own
 * `PROJECT_STAGES` (the curriculum does not mark the stage): the two should be one constant when
 * X1 next holds `session.ts`.
 */
export const PROJECT_STAGES: ReadonlySet<number> = new Set([9]);

/**
 * Whether the sheet offers a piece a project: a song, bundled or imported (a book piece's twin
 * included). Not a generated sight-reading phrase or a drill, which carry no piece semantics (C5,
 * S8); not an exercise, which the exposure rule keeps warm; not an excerpt, which is a passage and
 * not the piece (E1) — a passage of a project is one of its sections.
 */
export function isProjectable(item: Pick<CatalogItem, 'type'>): boolean {
  return item.type === 'song';
}

/** Which piece a project question is about: the item, and the material a run of it would carry. */
export interface ProjectTarget {
  itemId: string;
  material: Identity | undefined;
}

/** A project's key: the material's, or the id's where it has none. */
export function projectKey(target: ProjectTarget): string {
  return materialKey(knownMaterial(target.material) ? target.material : undefined, target.itemId);
}

const asIdentity = (material: EncounterMaterial): Identity | undefined => (material.kind === 'id' ? undefined : material);

/**
 * The project a piece has, among these rows: one of the same material, whatever id it was made
 * under; else one made under this id (an id-only row, or a material row whose file the catalogue has
 * since built again under the same id). Never an id-only row of another id.
 */
export function projectIn(rows: readonly ProjectRow[], target: ProjectTarget): ProjectRow | undefined {
  const byMaterial = knownMaterial(target.material) ? rows.find((row) => sameMaterial(asIdentity(row.material), target.material)) : undefined;
  if (byMaterial) return byMaterial;
  return rows
    .filter((row) => row.itemId === target.itemId)
    .sort((a, b) => b.since.localeCompare(a.since))[0];
}

// --- the store ----------------------------------------------------------------------------------

/** Rows kept for the session where there is no database, or a write to it failed. */
let memory = new Map<string, ProjectRow>();
const listeners = new Set<() => void>();
/**
 * Every change reads the row and writes it back, so two changes in flight at once — a goal typed
 * and the problem typed straight after, two taps on the sheet — would each write the row as it was
 * before the other, and the first would be lost. One change at a time, in the order asked.
 */
let queue: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(change: () => Promise<T>): Promise<T> {
  const next = queue.then(change, change);
  queue = next.catch(() => undefined);
  return next;
}

/** Called after every write, so a screen showing projects can draw them again. */
export function onProjectsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** Every project, from the store and the session's memory (the memory wins: it is the later write). */
export async function allProjects(): Promise<ProjectRow[]> {
  const db = await openDatabase();
  let stored: ProjectRow[] = [];
  if (db) {
    try {
      stored = await db.getAll('projects');
    } catch {
      stored = [];
    }
  }
  const out = new Map(stored.map((row) => [row.id, row]));
  for (const [id, row] of memory) out.set(id, row);
  return [...out.values()];
}

/** The project a piece has, over the store. */
export async function projectFor(target: ProjectTarget): Promise<ProjectRow | undefined> {
  return projectIn(await allProjects(), target);
}

async function write(row: ProjectRow): Promise<ProjectRow> {
  const db = await openDatabase();
  let stored = false;
  if (db) {
    try {
      await db.put('projects', row);
      stored = true;
      memory.delete(row.id);
    } catch {
      /* kept in memory for the session, below */
    }
  }
  if (!stored) memory.set(row.id, row);
  notify();
  return row;
}

async function byId(id: string): Promise<ProjectRow> {
  const row = (await allProjects()).find((one) => one.id === id);
  if (!row) throw new Error('There is no project for that piece yet: choose what to do with it first.');
  return row;
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A day the learner typed, `YYYY-MM-DD`, a real date, and not after `today`. */
function validDay(day: string, today: string): boolean {
  const match = DAY.exec(day);
  if (!match) return false;
  const [year, month, date] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, date));
  const real = check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === date;
  return real && day <= today;
}

/**
 * The learner's action (G1b item 2): the project enters the action's state from the state it is in
 * — or is made, where the piece has none — with one line appended to its history. Refused, writing
 * nothing, where the sheet does not offer the action for that state. `performedOn` is *I performed
 * it*'s day (the learner's, `YYYY-MM-DD`, on or before the day of the action; that day by default)
 * and belongs to no other action. Writes the `projects` store and nothing else.
 */
export function applyProjectAction(
  target: ProjectTarget,
  action: ProjectAction,
  options: { at?: Date; performedOn?: string } = {},
): Promise<ProjectRow> {
  return oneAtATime(() => applyNow(target, action, options));
}

async function applyNow(target: ProjectTarget, action: ProjectAction, options: { at?: Date; performedOn?: string }): Promise<ProjectRow> {
  const at = options.at ?? new Date();
  const existing = await projectFor(target);
  if (!actionsFor(existing?.state).includes(action)) {
    // In the learner's words, no state or action names: a second tap can reach here after the first
    // moved the project (the sheet redraws what is offered now).
    throw new Error('That is not offered for this piece now.');
  }
  if (options.performedOn !== undefined && action !== 'performed') {
    throw new Error('Only “I performed it” carries a day it was performed.');
  }
  const today = dayKey(at);
  const performedOn = action === 'performed' ? (options.performedOn ?? today) : undefined;
  if (performedOn !== undefined && !validDay(performedOn, today)) {
    throw new Error('That is not a day on or before today.');
  }
  const state = ACTION_STATE[action];
  const when = at.toISOString();
  const step: ProjectStep = { state, at: when, why: action, ...(performedOn === undefined ? {} : { performedOn }) };
  const known = knownMaterial(target.material) ? target.material : undefined;
  const row: ProjectRow = existing
    ? { ...existing, state, since: when, history: [...existing.history, step] }
    : {
        id: projectKey(target),
        material: known ?? { kind: 'id', itemId: target.itemId },
        itemId: target.itemId,
        state,
        since: when,
        history: [step],
      };
  return write(row);
}

/** R18: this week's goal and the current problem, as the learner typed them. An empty box takes the words away. */
export function setProjectNotes(id: string, notes: { goal?: string; problem?: string }): Promise<ProjectRow> {
  return oneAtATime(async () => {
    const next: ProjectRow = { ...(await byId(id)) };
    for (const key of ['goal', 'problem'] as const) {
      if (!(key in notes)) continue;
      const words = (notes[key] ?? '').trim();
      if (words === '') delete next[key];
      else next[key] = words;
    }
    return write(next);
  });
}

/**
 * R18: one named passage, added to the end of the list. Printed bars, whole numbers from 1, the
 * first not after the last, and not past the piece's bars where its length is known (the sheet
 * passes the bars the score has). Refused, writing nothing, otherwise.
 */
export function addProjectSection(id: string, section: ProjectSection, bars?: number): Promise<ProjectRow> {
  return oneAtATime(async () => {
    const row = await byId(id);
    const { from, to } = section;
    const whole = Number.isInteger(from) && Number.isInteger(to);
    if (!whole || from < 1 || to < from || (bars !== undefined && to > bars)) {
      throw new Error(bars === undefined ? 'A section is whole bars, from bar 1 up, the first not after the last.' : `Bars run from 1 to ${String(bars)}.`);
    }
    return write({ ...row, sections: [...(row.sections ?? []), { from, to, label: section.label.trim() }] });
  });
}

/** R18: takes away one section the learner added (their own edit; pausing or putting away never does). */
export function removeProjectSection(id: string, index: number): Promise<ProjectRow> {
  return oneAtATime(async () => {
    const row = await byId(id);
    const sections = (row.sections ?? []).filter((_, at) => at !== index);
    const next: ProjectRow = { ...row, sections };
    if (sections.length === 0) delete next.sections;
    return write(next);
  });
}

/**
 * A restore's merge of one project (the backup's additive default): a join. The histories' lines
 * together, once each, in time order; the state and since of the latest line; the device's words
 * where it has them, else the backup's; the sections of both, the device's first, once each.
 * Restoring the same file twice changes nothing, and a history is never shortened.
 */
export function mergeProjects(mine: ProjectRow | undefined, theirs: ProjectRow): ProjectRow {
  if (!mine) return theirs;
  const seen = new Set<string>();
  const history: ProjectStep[] = [];
  for (const step of [...mine.history, ...theirs.history]) {
    const key = JSON.stringify([step.at, step.state, step.why, step.performedOn ?? null]);
    if (seen.has(key)) continue;
    seen.add(key);
    history.push(step);
  }
  history.sort((a, b) => a.at.localeCompare(b.at));
  const last = history[history.length - 1] ?? { state: mine.state, at: mine.since };
  const sectionKey = (section: ProjectSection): string => JSON.stringify([section.from, section.to, section.label]);
  const sections: ProjectSection[] = [];
  const kept = new Set<string>();
  for (const section of [...(mine.sections ?? []), ...(theirs.sections ?? [])]) {
    if (kept.has(sectionKey(section))) continue;
    kept.add(sectionKey(section));
    sections.push(section);
  }
  const goal = mine.goal ?? theirs.goal;
  const problem = mine.problem ?? theirs.problem;
  return {
    id: mine.id,
    material: mine.material,
    itemId: mine.itemId,
    state: last.state,
    since: last.at,
    history,
    ...(goal === undefined ? {} : { goal }),
    ...(problem === undefined ? {} : { problem }),
    ...(sections.length === 0 ? {} : { sections }),
  };
}

/** Forgets the session's memory (a restore, a reset: the database was written from outside). */
export function forgetCachedProjects(): void {
  memory = new Map();
}

/** Test hook. */
export function resetProjectsForTest(): void {
  memory = new Map();
  listeners.clear();
  queue = Promise.resolve();
}
