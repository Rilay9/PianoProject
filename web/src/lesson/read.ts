// The path's content (owner, 2026-10-15): rungs in order, each a list of lessons; a lesson is a title and an ordered
// list of content blocks (text, a picture, a video, a little playable score, a keyboard diagram, an animation, a
// practice step, a tip), in any order and any number, so lessons can be fed in later without changing the app. Written
// by Claude as the owner learns; never a fixed course. Read strictly, as activities are: a field or kind that is not
// known, or a value that cannot be used, is refused with the reason (docs/app-features.md §8c).
//
//   public/content/path/index.json          { "rungs": [{ "id", "title", "lessons": ["<lesson id>", …] }, …] }
//   public/content/path/lessons/<id>.json   { "title", "blocks": [ { "kind": …, … }, … ] }
//   files a block names ("media/x.svg")      relative to public/content/path/
//
// Adding a block kind: its fields here (BLOCKS and readBlock), its drawing in lesson/blocks.ts (DRAW), and a line
// in docs/app-features.md §8c.

import { readActivity, type Activity } from '../activity.ts'; // (with .ts: the checks run this file in Node)
import { readText, type TextBlock } from './text.ts';

/** test: a rung of placeholder lessons for the checks, hidden from the learner (lesson/path.ts; 2026-10-16). */
export interface Rung { id: string; title: string; lessons: string[]; test?: boolean }
export interface PathIndex { rungs: Rung[] }

/** What a step's run must show for the step to count as done, where its activity's result can tell (docs §8c). */
export interface Target { onTime?: number; bpm?: number; clean?: number; chain?: number; cleanRounds?: number }

export type Block =
  | { kind: 'text'; text: TextBlock[] }
  | { kind: 'image'; src: string; alt: string; caption?: string }
  /** size "row": a compact line in a list of reference videos, played in place when tapped; left out, the full player. */
  | { kind: 'video'; youtube: string; title: string; start?: number; end?: number; caption?: string; size?: 'row' }
  | { kind: 'score'; source: ScoreSource; tempo?: number; keys: boolean; caption?: string }
  | { kind: 'keys'; notes: string[]; fingers?: (number | null)[]; caption?: string }
  | { kind: 'animation'; src: string; alt: string; caption?: string }
  | { kind: 'step'; id: string; title: string; activity: string | Activity; doneWhen?: string; target?: Target; about?: string;
      /** A target given with an activity named by id: checked against that activity once it is read (checkTarget). */
      pendingTarget?: unknown }
  | { kind: 'tip'; label: string; text: TextBlock[] };

/** Where a score block's music comes from: bars of a piece, an item of a set, or MusicXML (inline, or a file). */
export type ScoreSource =
  | { piece: string; bars: [number, number] }
  | { set: string; item: number }
  | { musicxml: string }
  | { file: string };

export interface Lesson { id: string; title: string; blocks: Block[] }

/** The fields each kind may have (beside "kind"); the first group are needed. */
const BLOCKS: Record<Block['kind'], { need: string[]; may: string[] }> = {
  text: { need: ['text'], may: [] },
  image: { need: ['src', 'alt'], may: ['caption'] },
  video: { need: ['youtube', 'title'], may: ['start', 'end', 'caption', 'size'] },
  score: { need: [], may: ['piece', 'bars', 'set', 'item', 'musicxml', 'tempo', 'keys', 'caption'] },
  keys: { need: ['notes'], may: ['fingers', 'caption'] },
  animation: { need: ['src', 'alt'], may: ['caption'] },
  step: { need: ['id', 'title', 'activity'], may: ['doneWhen', 'target', 'about'] },
  tip: { need: ['text'], may: ['label'] },
};
export const BLOCK_KINDS = Object.keys(BLOCKS) as Block['kind'][];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, what: string): string => { if (typeof v !== 'string' || !v.trim()) throw new Error(`${what} should be some text`); return v; };
const optStr = (v: unknown, what: string): string | undefined => (v === undefined ? undefined : str(v, what));
const ID = /^[a-z0-9][a-z0-9-]*$/;

/** A file in the content folder ("media/x.svg") or a link (https://…); nothing else (no "..", no other schemes). */
function fileOrLink(v: unknown, what: string, kinds: RegExp): string {
  const s = str(v, what).trim();
  if (/^https:\/\//.test(s)) return s;
  if (/^[a-z]+:/i.test(s) || s.startsWith('/') || s.split('/').includes('..')) throw new Error(`${what} "${s}" should be a file in content/path (like "media/x.svg") or an https:// link`);
  if (!kinds.test(s)) throw new Error(`${what} "${s}" is not a kind of file it can show (${kinds.source.replace(/[\\$()]/g, '').replace(/\|/g, ', ')})`);
  return s;
}

/** The video's id from a YouTube link (watch?v=, youtu.be/, embed/, shorts/) or a bare id. */
export function youtubeId(v: string): string | null {
  const s = v.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let url: URL;
  try { url = new URL(s); } catch { return null; }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ?? (/^\/(?:embed|shorts|live)\/([\w-]+)/.exec(url.pathname)?.[1] ?? null);
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

const seconds = (v: unknown, what: string): number | undefined => {
  if (v === undefined) return undefined;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) throw new Error(`${what} should be a whole number of seconds`);
  return v;
};

function readBars(v: unknown, what: string): [number, number] {
  const m = /^(\d+)(?:-(\d+))?$/.exec(String(v ?? ''));
  if (!m) throw new Error(`${what} "${v}" should be like "5-8" (printed bar numbers)`);
  const bars: [number, number] = [Number(m[1]), Number(m[2] ?? m[1])];
  if (bars[1] < bars[0]) throw new Error(`${what} "${v}" end before they start`);
  if (bars[1] - bars[0] > 15) throw new Error(`${what} "${v}": a score block is a short excerpt (16 bars at most)`);
  return bars;
}

const PITCH = /^[A-G](#{1,2}|b{1,2})?-?\d$/;

/** The target's fields each step's screen can judge (the rest of the screens: done when a run of it ended). */
const TARGETS: Record<string, Record<string, { min: number; max: number; whole: boolean; say: string }>> = {
  score: {
    onTime: { min: 0.05, max: 1, whole: false, say: 'a share of the notes on time and held, 0.05 to 1' },
    bpm: { min: 20, max: 300, whole: true, say: 'beats a minute, 20 to 300' },
  },
  drills: { clean: { min: 1, max: 100, whole: true, say: 'clean cards in one set, 1 to 100' } },
  simon: { chain: { min: 1, max: 100, whole: true, say: 'a chain this long, 1 to 100' } },
  lab: { cleanRounds: { min: 1, max: 40, whole: true, say: 'rounds with every bar right, 1 to 40' } },
};

function readTarget(v: unknown, screen: string, where: string, activity: Activity): Target {
  if (!isObj(v)) throw new Error(`${where}.target should be an object`);
  const rules = TARGETS[screen];
  if (!rules) throw new Error(`${where}.target: a ${screen} step cannot be judged; leave the target out (it is done when a run of it ended)`);
  const out: Target = {};
  for (const [k, x] of Object.entries(v)) {
    const r = rules[k];
    if (!r) throw new Error(`${where}.target has "${k}"; a ${screen} step's target is ${Object.keys(rules).join(' or ')}`);
    if (typeof x !== 'number' || x < r.min || x > r.max || (r.whole && !Number.isInteger(x))) throw new Error(`${where}.target.${k} is ${JSON.stringify(x)}; it should be ${r.say}`);
    (out as Record<string, number>)[k] = x;
  }
  if (!Object.keys(out).length) throw new Error(`${where}.target is empty`);
  if (activity.screen === 'score') {
    const mode = activity.settings.mode;
    if (out.onTime !== undefined && mode && !['along', 'rhythm', 'ladder'].includes(mode)) throw new Error(`${where}.target.onTime needs Play along, Rhythm or Ladder (the mode is ${mode})`);
    if (out.bpm !== undefined && !activity.bars) throw new Error(`${where}.target.bpm needs the activity to loop bars (a clean pass round the loop)`);
  }
  if (activity.screen === 'lab' && out.cleanRounds !== undefined && activity.preset.role === 'lead') throw new Error(`${where}.target.cleanRounds: lead rounds are not marked right or wrong`);
  return out;
}

function readBlock(b: unknown, i: number, lessonId: string, ids: Set<string>): Block {
  const where = `block ${i + 1}`;
  if (!isObj(b)) throw new Error(`${where} should be an object`);
  const kind = b.kind;
  if (typeof kind !== 'string' || !(kind in BLOCKS)) throw new Error(`${where}: kind ${JSON.stringify(kind)} is not one of ${BLOCK_KINDS.join(', ')}`);
  const spec = BLOCKS[kind as Block['kind']];
  for (const k of Object.keys(b)) if (k !== 'kind' && !spec.need.includes(k) && !spec.may.includes(k)) throw new Error(`${where} (${kind}) has "${k}", which is not one of ${[...spec.need, ...spec.may].join(', ')}`);
  for (const k of spec.need) if (b[k] === undefined) throw new Error(`${where} (${kind}) needs "${k}"`);
  const caption = optStr(b.caption, `${where}.caption`);
  switch (kind as Block['kind']) {
    case 'text': return { kind: 'text', text: readText(str(b.text, `${where}.text`), where) };
    case 'tip': return { kind: 'tip', label: optStr(b.label, `${where}.label`) ?? 'Tip', text: readText(str(b.text, `${where}.text`), where) };
    case 'image': return { kind: 'image', src: fileOrLink(b.src, `${where}.src`, /\.(png|jpe?g|webp|svg|gif)$/i), alt: str(b.alt, `${where}.alt`), caption };
    case 'animation': return { kind: 'animation', src: fileOrLink(b.src, `${where}.src`, /\.(gif|webp|svg|png|mp4|webm)$/i), alt: str(b.alt, `${where}.alt`), caption };
    case 'video': {
      const link = str(b.youtube, `${where}.youtube`);
      if (!youtubeId(link)) throw new Error(`${where}.youtube "${link}" is not a YouTube video link`);
      const start = seconds(b.start, `${where}.start`), end = seconds(b.end, `${where}.end`);
      if (start !== undefined && end !== undefined && end <= start) throw new Error(`${where}: end ${end} is not after start ${start}`);
      // A reference video is a row (owner, 2026-10-16: "No need to show them full size unless they're more than reference").
      if (b.size !== undefined && b.size !== 'row') throw new Error(`${where}.size ${JSON.stringify(b.size)} should be "row" (a compact line in the lesson's list of videos), or left out for the full player`);
      return { kind: 'video', youtube: link, title: str(b.title, `${where}.title`), start, end, caption, ...(b.size === 'row' ? { size: 'row' as const } : {}) };
    }
    case 'score': {
      const given = ['piece', 'set', 'musicxml'].filter((k) => b[k] !== undefined);
      if (given.length !== 1) throw new Error(`${where} (score) should give one of piece (with bars), set (with item) or musicxml${given.length ? ` (it gives ${given.join(' and ')})` : ''}`);
      let source: ScoreSource;
      if (b.piece !== undefined) {
        if (b.item !== undefined) throw new Error(`${where} (score): "item" goes with a set, not a piece`);
        source = { piece: str(b.piece, `${where}.piece`), bars: readBars(b.bars, `${where}.bars`) };
      } else if (b.set !== undefined) {
        if (b.bars !== undefined) throw new Error(`${where} (score): "bars" goes with a piece, not a set`);
        if (typeof b.item !== 'number' || !Number.isInteger(b.item) || b.item < 1) throw new Error(`${where}.item should be the item's number in the set (1, 2, …)`);
        source = { set: str(b.set, `${where}.set`), item: b.item };
      } else {
        if (b.bars !== undefined || b.item !== undefined) throw new Error(`${where} (score): musicxml takes no bars or item`);
        const x = str(b.musicxml, `${where}.musicxml`).trim();
        if (x.startsWith('<')) {
          // Written in the lesson: a whole MusicXML file, so it has its time signature and bars (review 2026-10-15, V13).
          if (!/<score-partwise[\s>]/.test(x)) throw new Error(`${where}.musicxml: give a whole MusicXML file (<score-partwise> with its time signature and bars), or a file, or a set's item`);
          const bad = barProblem(x);
          if (bad) throw new Error(`${where}.musicxml: ${bad}`);
          source = { musicxml: x };
        } else source = { file: fileOrLink(x, `${where}.musicxml`, /\.(musicxml|xml)$/i) };
      }
      const tempo = b.tempo === undefined ? undefined : (typeof b.tempo === 'number' && b.tempo >= 20 && b.tempo <= 300 ? b.tempo : (() => { throw new Error(`${where}.tempo should be beats a minute, 20 to 300`); })());
      if (b.keys !== undefined && typeof b.keys !== 'boolean') throw new Error(`${where}.keys should be true or false`);
      return { kind: 'score', source, tempo, keys: b.keys === true, caption };
    }
    case 'keys': {
      const notes = str(b.notes, `${where}.notes`).trim().split(/\s+/);
      for (const n of notes) if (!PITCH.test(n)) throw new Error(`${where}.notes: "${n}" is not a pitch like C4, F#3 or Bb4`);
      if (notes.length > 12) throw new Error(`${where}.notes: at most 12 keys`);
      let fingers: (number | null)[] | undefined;
      if (b.fingers !== undefined) {
        const f = str(b.fingers, `${where}.fingers`).trim().split(/\s+/);
        if (f.length !== notes.length) throw new Error(`${where}.fingers gives ${f.length} for ${notes.length} notes (one each; "-" for none)`);
        fingers = f.map((x) => { if (x === '-') return null; if (!/^[1-5]$/.test(x)) throw new Error(`${where}.fingers: "${x}" is not a finger 1 to 5 (or "-")`); return Number(x); });
      }
      return { kind: 'keys', notes, fingers, caption };
    }
    case 'step': {
      const id = str(b.id, `${where}.id`);
      if (!ID.test(id)) throw new Error(`${where}.id "${id}" should be lower-case letters, digits and -`);
      if (ids.has(id)) throw new Error(`${where}.id "${id}" is used twice in this lesson`);
      ids.add(id);
      let activity: string | Activity;
      if (typeof b.activity === 'string') {
        if (!/^[\w-]+$/.test(b.activity)) throw new Error(`${where}.activity "${b.activity}" should be an activity's id (content/activities)`);
        activity = b.activity;
      } else if (isObj(b.activity)) {
        try { activity = readActivity(`${lessonId}.${id}`, b.activity); } catch (e) { throw new Error(`${where}.activity: ${e instanceof Error ? e.message : String(e)}`); }
      } else throw new Error(`${where}.activity should be an activity's id or an activity written out`);
      const out: Block = { kind: 'step', id, title: str(b.title, `${where}.title`), activity, doneWhen: optStr(b.doneWhen, `${where}.doneWhen`), about: optStr(b.about, `${where}.about`) };
      if (b.target !== undefined) {
        if (typeof activity === 'string') out.pendingTarget = b.target; // checked once its activity is read (checkTarget)
        else out.target = readTarget(b.target, activity.screen, where, activity);
      }
      return out;
    }
  }
}

/**
 * A bar whose notes run past its time signature, or music with no time signature (review 2026-10-15, V13): the first such,
 * in words; none: ''. Read from the text (the checks run in Node, without a DOM): each <measure>'s notes advance a
 * position (a chord note does not; <backup> and <forward> move it; grace notes take no time); the furthest it reaches
 * must fit the bar's time signature (an implicit bar, a pickup, may be shorter, never longer).
 */
export function barProblem(xml: string): string {
  let divisions = 1, beats = 0, beatType = 4;
  for (const m of xml.matchAll(/<measure\b([^>]*)>([\s\S]*?)<\/measure>/g)) {
    const number = /number="([^"]*)"/.exec(m[1])?.[1] ?? '?', body = m[2];
    const d = /<divisions>\s*(\d+)\s*<\/divisions>/.exec(body); if (d) divisions = Number(d[1]);
    const t = /<time\b[^>]*>\s*<beats>\s*(\d+)\s*<\/beats>\s*<beat-type>\s*(\d+)\s*<\/beat-type>/.exec(body); if (t) { beats = Number(t[1]); beatType = Number(t[2]); }
    if (!beats) return `bar ${number} has no time signature before it`;
    let at = 0, most = 0;
    for (const e of body.matchAll(/<(note|backup|forward)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const dur = Number(/<duration>\s*(\d+)\s*<\/duration>/.exec(e[2])?.[1] ?? 0);
      if (e[1] === 'backup') at -= dur;
      else if (e[1] === 'forward') at += dur;
      else if (!/<chord\s*\/>/.test(e[2]) && !/<grace\b/.test(e[2])) at += dur;
      most = Math.max(most, at);
    }
    const room = (beats * 4 / beatType) * divisions;
    if (most > room + 1e-9) return `bar ${number} holds ${most / divisions} quarter notes, but its time signature (${beats}/${beatType}) has room for ${room / divisions}`;
  }
  return '';
}

/** A step naming an activity by id has its target checked once that activity is read. */
export function checkTarget(step: Extract<Block, { kind: 'step' }>, activity: Activity): Target | undefined {
  if (step.pendingTarget === undefined) return step.target;
  return readTarget(step.pendingTarget, activity.screen, `step "${step.id}"`, activity);
}

export function readLesson(id: string, f: unknown): Lesson {
  if (!ID.test(id)) throw new Error(`lesson id "${id}" should be lower-case letters, digits and -`);
  if (!isObj(f)) throw new Error('a lesson should be an object');
  for (const k of Object.keys(f)) if (k !== 'title' && k !== 'blocks') throw new Error(`"${k}" is not a field of a lesson (title, blocks)`);
  const title = str(f.title, 'title');
  if (!Array.isArray(f.blocks) || !f.blocks.length) throw new Error('a lesson needs "blocks", a list of at least one');
  const ids = new Set<string>();
  return { id, title, blocks: f.blocks.map((b, i) => readBlock(b, i, id, ids)) };
}

export function readIndex(f: unknown): PathIndex {
  if (!isObj(f)) throw new Error('the path index should be an object');
  for (const k of Object.keys(f)) if (k !== 'rungs') throw new Error(`"${k}" is not a field of the path index (rungs)`);
  if (!Array.isArray(f.rungs)) throw new Error('the path index needs "rungs", a list');
  const seen = new Set<string>(), lessons = new Set<string>();
  const rungs = f.rungs.map((r, i): Rung => {
    const where = `rung ${i + 1}`;
    if (!isObj(r)) throw new Error(`${where} should be an object`);
    for (const k of Object.keys(r)) if (!['id', 'title', 'lessons', 'test'].includes(k)) throw new Error(`${where} has "${k}", which is not one of id, title, lessons, test`);
    if (r.test !== undefined && typeof r.test !== 'boolean') throw new Error(`${where}.test is ${JSON.stringify(r.test)}; it should be true or false`);
    const id = str(r.id, `${where}.id`);
    if (!ID.test(id)) throw new Error(`${where}.id "${id}" should be lower-case letters, digits and -`);
    if (seen.has(id)) throw new Error(`${where}.id "${id}" is used twice`);
    seen.add(id);
    if (!Array.isArray(r.lessons)) throw new Error(`${where} needs "lessons", a list of lesson ids`);
    for (const l of r.lessons) {
      if (typeof l !== 'string' || !ID.test(l)) throw new Error(`${where}.lessons: ${JSON.stringify(l)} is not a lesson id`);
      if (lessons.has(l)) throw new Error(`${where}.lessons: "${l}" is in the path twice`);
      lessons.add(l);
    }
    return { id, title: str(r.title, `${where}.title`), lessons: r.lessons as string[], ...(r.test ? { test: true } : {}) };
  });
  return { rungs };
}

/** The rungs a learner sees: test rungs (placeholders for the checks) only when asked for (lesson/path.ts; 2026-10-16). */
export function shownIndex(index: PathIndex, withTests: boolean): PathIndex {
  return withTests ? index : { rungs: index.rungs.filter((r) => !r.test) };
}
