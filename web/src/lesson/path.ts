// The path in the app: its content read (lesson/read.ts), where you are on it (lesson/progress.ts), and the words for
// a step's activity. Content that cannot be fetched now (offline before it was saved) is asked for again next time;
// a lesson that cannot be read is left out and its reason shown on the Path.

import { base, type App, type Piece } from '../app';
import { readActivity, type Activity } from '../activity';
import { loadSets, readPlay, type ItemSet, type Play } from '../exercise/items';
import { loadCharts } from '../library/items';
import { loadCatalogue } from '../library/catalogue';
import { currentLesson, doneSteps, stepWords, triedSteps } from './progress';
import { readIndex, readLesson, type Block, type Lesson, type PathIndex, type Rung } from './read';

export type StepBlock = Extract<Block, { kind: 'step' }>;
export interface PathData { index: PathIndex; lessons: Map<string, Lesson>; problems: string[] }

export const PATH_DIR = `${base}content/path/`;

let kept: PathData | null = null;
/** The rungs and lessons (kept once every file was read; a fetch that failed is tried again next time). */
export async function loadPath(): Promise<PathData> {
  if (kept) return kept;
  const problems: string[] = [];
  let missed = false;
  let index: PathIndex = { rungs: [] };
  try {
    const r = await fetch(`${PATH_DIR}index.json`);
    // (A missing file can come back as the app's own page: anything not JSON is "no path yet".)
    let json: unknown = null;
    try { json = r.ok ? JSON.parse(await r.text()) : null; } catch { json = null; }
    if (json) index = readIndex(json);
  } catch (e) {
    if (e instanceof TypeError) missed = true; // (the network)
    else problems.push(`The path's index: ${e instanceof Error ? e.message : String(e)}`);
  }
  const lessons = new Map<string, Lesson>();
  await Promise.all(index.rungs.flatMap((r) => r.lessons).map(async (id) => {
    try {
      const r = await fetch(`${PATH_DIR}lessons/${id}.json`);
      if (!r.ok) throw new Error(`the file lessons/${id}.json is not there`);
      lessons.set(id, readLesson(id, await r.json()));
    } catch (e) {
      if (e instanceof TypeError) { missed = true; problems.push(`Lesson "${id}" could not be fetched (offline?)`); return; }
      problems.push(`Lesson "${id}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }));
  const data = { index, lessons, problems };
  if (!missed) kept = data;
  return data;
}

export const stepsOf = (l: Lesson): StepBlock[] => l.blocks.filter((b): b is StepBlock => b.kind === 'step');

/** The lessons in path order (only those that could be read). */
export function lessonOrder(d: PathData): { rung: Rung; rungNo: number; lesson: Lesson; no: number }[] {
  return d.index.rungs.flatMap((rung, ri) => rung.lessons.filter((id) => d.lessons.has(id)).map((id, li) => ({ rung, rungNo: ri + 1, lesson: d.lessons.get(id)!, no: li + 1 })));
}
export function placeOf(d: PathData, lessonId: string): { rung: Rung; rungNo: number; lesson: Lesson; no: number } | undefined {
  return lessonOrder(d).find((x) => x.lesson.id === lessonId);
}

/** How far a lesson is: its steps done, and the first not done (in order). */
export function lessonState(l: Lesson): { done: number; total: number; next?: StepBlock; nextNo: number } {
  const steps = stepsOf(l), done = doneSteps(l.id);
  const i = steps.findIndex((s) => !done[s.id]);
  return { done: steps.filter((s) => done[s.id]).length, total: steps.length, next: i >= 0 ? steps[i] : undefined, nextNo: i + 1 };
}

/** Each step's state in words (done and how, tried, skipped, to come); `next` marks the first not done. */
export function stepStates(l: Lesson): Map<string, { mark: string; words: string; cls: string; at?: string }> {
  const steps = stepsOf(l), done = doneSteps(l.id), tried = triedSteps(l.id), out = new Map<string, { mark: string; words: string; cls: string; at?: string }>();
  const next = lessonState(l).next;
  steps.forEach((s, i) => {
    const later = steps.slice(i + 1).some((x) => done[x.id] || tried[x.id]);
    const w = stepWords(done[s.id], tried[s.id], later);
    out.set(s.id, s === next && !tried[s.id] ? { mark: '▶', words: later ? 'skipped: up next' : 'up next', cls: 'next' } : { ...w, cls: `${w.cls}${s === next ? ' next' : ''}`.trim(), at: done[s.id]?.at ?? tried[s.id] });
  });
  return out;
}

/**
 * The lesson you are on (owner, 2026-10-15): the one you last opened or switched to, even one done (Revisit); with
 * none chosen yet, the first with steps to do. None when there are no lessons, or none chosen and every one is done.
 */
export function currentOf(d: PathData): Lesson | undefined {
  const order = lessonOrder(d), at = order.find((x) => x.lesson.id === currentLesson());
  return at?.lesson ?? order.find((x) => !!lessonState(x.lesson).next)?.lesson;
}
/** The next lesson after this one with steps to do (then the first such from the start); none when all are done. */
export function nextTodo(d: PathData, lessonId: string): Lesson | undefined {
  const order = lessonOrder(d), at = order.findIndex((x) => x.lesson.id === lessonId);
  const todo = (x: (typeof order)[number]) => x.lesson.id !== lessonId && !!lessonState(x.lesson).next;
  return (order.slice(at + 1).find(todo) ?? order.find(todo))?.lesson;
}

// ---- a step's activity -----------------------------------------------------------------------------------------

const fetched = new Map<string, Activity>();
/** The step's activity: written out in the lesson, or read from content/activities/<id>.json (a sentence if it can't). */
export async function activityOf(step: StepBlock): Promise<Activity> {
  if (typeof step.activity !== 'string') return step.activity;
  const id = step.activity;
  const have = fetched.get(id);
  if (have) return have;
  const r = await fetch(`${base}content/activities/${id}.json`);
  let json: unknown;
  try { json = r.ok ? JSON.parse(await r.text()) : null; } catch { json = null; }
  if (!json || typeof json !== 'object') throw new Error(`there is no activity "${id}"`);
  const a = readActivity(id, json as Record<string, unknown>);
  fetched.set(id, a);
  return a;
}

let sets: Promise<ItemSet[]> | null = null;
/** Every exercise set (Exercises, and the names of a step's set); a failure is tried again next time. */
let setsKept: { sets: ItemSet[]; problems: string[] } | null = null;
export function allSets(app: App): Promise<{ sets: ItemSet[]; problems: string[] }> {
  if (setsKept) return Promise.resolve(setsKept);
  const p = loadSets(base, async (id) => {
    const piece = app.pieces.find((x) => x.id === id);
    if (!piece) throw new Error(`no score with id "${id}"`);
    return app.xmlFor(piece);
  });
  sets = p.then((x) => x.sets, () => { sets = null; return []; });
  // (kept once every set read; one that failed, perhaps offline, is asked for again next time)
  return p.then((x) => { if (!x.problems.length) setsKept = x; return x; });
}
let musicKept: Promise<Piece[]> | null = null;
/**
 * The exercises that are music (owner, 2026-10-15: "exercises also includes musicxml that'll go straight to score"): each
 * item of a set given as a MusicXML file is a short score of its own, opened on the score screen. They join the app's
 * pieces (id `ex-<set>-<item>`, so its own choices are kept like any piece's), marked so Music does not list them.
 */
export function musicExercises(app: App): Promise<Piece[]> {
  musicKept ??= (async () => {
    const dir = `${base}content/sets/`;
    const list = (await (await fetch(`${dir}index.json`)).json()) as string[];
    const out: Piece[] = [];
    for (const f of list) {
      const set = (await (await fetch(dir + f)).json()) as { title?: string; kind?: string; play?: unknown; items?: Record<string, { musicxml?: string; name?: string }> };
      let play: Play = { mode: 'wait' };
      try { if (set.play !== undefined) play = readPlay(set.play); } catch { continue; } // (a set whose play cannot be read: Exercises lists the reason)
      const items = Object.entries(set.items ?? {});
      const files = items.filter(([, it]) => typeof it.musicxml === 'string' && /\.(musicxml|xml)$/i.test(it.musicxml.trim()));
      for (const [n, it] of files) {
        out.push({ id: `ex-${f.replace(/\.json$/, '')}-${n}`, title: `${/^Test:/.test(set.title ?? '') && it.name ? 'Test: ' : ''}${it.name ?? `${set.title ?? f} ${n}`}`, composer: '', file: `../content/sets/${it.musicxml!.trim()}`,
          kind: set.kind, exerciseOf: f.replace(/\.json$/, ''), allOfSet: files.length === items.length, play });
      }
    }
    for (const p of out) if (!app.pieces.some((x) => x.id === p.id)) app.pieces.push(p);
    return out;
  })().catch((e) => { musicKept = null; throw e; }); // (not fetched now: asked again next time)
  return musicKept;
}

const MODES: Record<string, string> = { watch: 'Watch', wait: 'Wait for me', along: 'Play along', ladder: 'Ladder', rhythm: 'Rhythm' };
const HANDS: Record<string, string> = { right: 'right hand', left: 'left hand', both: 'both hands', off: 'you play both' };
const RUNGS = ['', 'music, sound and keys lit', 'music and sound', 'music only', 'name only', 'by ear'];

/** The step's activity in a few words: the tool, what it plays, the choices that matter ("Wait for me · right hand · bars 1–4"). */
export async function describe(a: Activity, app: App): Promise<string> {
  // (a catalogue piece not yet in your library: its title from the catalogue, 2026-10-15)
  const named = a.screen === 'score' || a.screen === 'memorise' ? a.piece : '';
  const catalogue = named.startsWith('u-') && !app.pieces.some((p) => p.id === named) ? await loadCatalogue(base).catch(() => null) : null;
  const piece = (id: string) => app.pieces.find((p) => p.id === id)?.title ?? catalogue?.rows.find((r) => r.id === id)?.title ?? id;
  const setTitle = async (id: string) => (await (sets ?? allSets(app).then((x) => x.sets)).catch(() => [] as ItemSet[])).find((s) => s.id === id)?.title.replace(/^Test:\s*/, '') ?? id;
  switch (a.screen) {
    case 'score': {
      const s = a.settings;
      return [s.mode ? MODES[s.mode] : 'Score', piece(a.piece), a.bars ? `bars ${a.bars[0]}–${a.bars[1]}` : '', s.hands ? HANDS[s.hands] : '', s.tempo ? `♩ ${s.tempo}` : ''].filter(Boolean).join(' · ');
    }
    case 'memorise': return ['Memorise', piece(a.piece), a.settings.hands ? HANDS[a.settings.hands] : '', a.settings.chunk ? `${a.settings.chunk} bars at a time` : ''].filter(Boolean).join(' · ');
    case 'drills': return ['Drills', await setTitle(a.set), a.level.cards ? `${a.level.cards} cards` : '', a.level.rung ? RUNGS[a.level.rung] : ''].filter(Boolean).join(' · ');
    case 'simon': return ['Simon', await setTitle(a.set), a.level.rung ? RUNGS[a.level.rung] : ''].filter(Boolean).join(' · ');
    case 'lab': {
      const chart = (await loadCharts(base).catch(() => [])).find((c) => c.id === a.chart)?.title.replace(/^Test:\s*/, '') ?? a.chart;
      return ['Accompaniment lab', chart, a.preset.role === 'lead' ? 'lead' : a.preset.role === 'accomp' ? 'accompaniment' : ''].filter(Boolean).join(' · ');
    }
    case 'freeplay': return 'Free play';
  }
}
