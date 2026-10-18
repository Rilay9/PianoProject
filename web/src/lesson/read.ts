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

import { readActivity, readFingers, readKeyRange, type Activity, type Fingers, type KeyRange } from '../activity.ts'; // (with .ts: the checks run this file in Node)
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
  | { kind: 'keys'; notes: string[]; fingers?: (number | null)[]; names?: false | 'letters'; caption?: string }
  | { kind: 'animation'; src: string; alt: string; caption?: string }
  | { kind: 'step'; id: string; title: string; activity: string | Activity; doneWhen?: string; target?: Target; about?: string;
      /** An extra the lesson offers (owner's lesson 1 spec, 2026-10-17: "Step (optional): Extra challenge"): marked
       * Optional, never needed for the lesson to be done, never the next step suggested while a needed one is left. */
      optional?: true;
      /** A target given with an activity named by id: checked against that activity once it is read (checkTarget). */
      pendingTarget?: unknown }
  | { kind: 'tip'; label: string; text: TextBlock[] }
  /** Read / Watch (owner, 2026-10-17): a text and a video in one box with two tabs, Read open first, one shown at a time. */
  | { kind: 'read-watch'; text: TextBlock[]; youtube: string; title: string; start?: number; end?: number; caption?: string }
  /** A keyboard to play in the page (owner, 2026-10-17): these keys, the black keys' groups outlined (unless `groups:
   * false`), every key sounding when tapped, a MIDI keyboard's keys shown on it; nothing judged or recorded. Its options
   * (owner's lesson 2 spec, 2026-10-18): `names` "letters" (every white key's letter), `fingers` (finger numbers; with
   * letters too, a Finger numbers | Key names switch, opening on the numbers), `hide` (a Hide names / Show names button),
   * `play` (a Hear it for a few notes, at `tempo`), `find` (a Find a key prompt cycling through these letters). */
  | { kind: 'keyboard'; keys: KeyRange; groups: boolean; names: boolean | 'letters'; fingers?: Fingers; hide?: true; play?: string[]; tempo?: number; find?: string[]; caption?: string };

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
  keys: { need: ['notes'], may: ['fingers', 'names', 'caption'] },
  animation: { need: ['src', 'alt'], may: ['caption'] },
  step: { need: ['id', 'title', 'activity'], may: ['doneWhen', 'target', 'about', 'optional'] },
  tip: { need: ['text'], may: ['label'] },
  'read-watch': { need: ['text', 'youtube', 'title'], may: ['start', 'end', 'caption'] },
  keyboard: { need: ['keys'], may: ['groups', 'names', 'fingers', 'hide', 'play', 'tempo', 'find', 'caption'] },
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
/** "F#3" → 54: a PITCH as a key (MIDI number). */
export function midiOfPitch(n: string): number {
  const m = /^([A-G])(#{1,2}|b{1,2})?(-?\d)$/.exec(n)!;
  const acc = m[2] ? (m[2][0] === '#' ? 1 : -1) * m[2].length : 0;
  return (Number(m[3]) + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1] as 'C'] + acc;
}

/** The target's fields each step's screen can judge (the rest of the screens: done when a run of it ended). */
const TARGETS: Record<string, Record<string, { min: number; max: number; whole: boolean; say: string }>> = {
  score: {
    onTime: { min: 0.05, max: 1, whole: false, say: 'a share of the notes on time and held, 0.05 to 1' },
    bpm: { min: 20, max: 300, whole: true, say: 'beats a minute, 20 to 300' },
  },
  drills: { clean: { min: 1, max: 100, whole: true, say: 'clean cards in one set, 1 to 100' } },
  simon: { chain: { min: 5, max: 100, whole: true, say: 'a chain this long, 5 to 100 (owner, 2026-10-17: every Simon at least 5)' } },
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
    case 'read-watch': {
      const link = str(b.youtube, `${where}.youtube`);
      if (!youtubeId(link)) throw new Error(`${where}.youtube "${link}" is not a YouTube video link`);
      const start = seconds(b.start, `${where}.start`), end = seconds(b.end, `${where}.end`);
      if (start !== undefined && end !== undefined && end <= start) throw new Error(`${where}: end ${end} is not after start ${start}`);
      return { kind: 'read-watch', text: readText(str(b.text, `${where}.text`), where), youtube: link, title: str(b.title, `${where}.title`), start, end, caption };
    }
    case 'keyboard': {
      // The keys as an activity's `keys` range ("C3-B4": white keys at both ends, on the piano); groups and names true / false.
      const keys = readKeyRange(b.keys, `${where}.keys`);
      if (b.groups !== undefined && typeof b.groups !== 'boolean') throw new Error(`${where}.groups should be true or false`);
      if (b.names !== undefined && typeof b.names !== 'boolean' && b.names !== 'letters') throw new Error(`${where}.names should be true, false or "letters" (every white key's letter)`);
      const letters = b.names === 'letters';
      const fingers = b.fingers === undefined ? undefined : readFingers(b.fingers);
      if (b.hide !== undefined && b.hide !== true) throw new Error(`${where}.hide should be true (a Hide names button), or left out`);
      if (b.hide && !letters) throw new Error(`${where}.hide is for names: "letters" (the names it hides)`);
      // A few notes to hear, as the keys block writes them ("E4 D4 C4"), each on these keys.
      let play: string[] | undefined;
      if (b.play !== undefined) {
        play = str(b.play, `${where}.play`).trim().split(/\s+/);
        for (const n of play) {
          if (!PITCH.test(n)) throw new Error(`${where}.play: "${n}" is not a pitch like C4, F#3 or Bb4`);
          const m = midiOfPitch(n);
          if (m < keys.lo || m > keys.hi) throw new Error(`${where}.play: ${n} is not on its keys (${b.keys})`);
        }
        if (play.length > 32) throw new Error(`${where}.play: at most 32 notes`);
      }
      if (b.tempo !== undefined && !(typeof b.tempo === 'number' && b.tempo >= 20 && b.tempo <= 300)) throw new Error(`${where}.tempo should be beats a minute, 20 to 300`);
      if (b.tempo !== undefined && !play) throw new Error(`${where}.tempo is for "play"`);
      // Find a key: true (all seven letters) or the letters to ask for ("F A B"); each must be on its keys.
      let find: string[] | undefined;
      if (b.find !== undefined) {
        find = b.find === true ? ['C', 'D', 'E', 'F', 'G', 'A', 'B'] : str(b.find, `${where}.find`).trim().split(/\s+/);
        for (const l of find) {
          if (!/^[A-G]$/.test(l)) throw new Error(`${where}.find: "${l}" is not a white key's letter A to G (or give true for all seven)`);
          let on = false;
          for (let m = keys.lo; m <= keys.hi; m++) if ('C D EF G A B'[m % 12] === l) on = true;
          if (!on) throw new Error(`${where}.find: there is no ${l} on its keys (${b.keys})`);
        }
        if (new Set(find).size < 2) throw new Error(`${where}.find: give at least two different letters`);
      }
      return { kind: 'keyboard', keys, groups: b.groups !== false, names: letters ? 'letters' : b.names !== false, ...(fingers ? { fingers } : {}), ...(b.hide ? { hide: true as const } : {}), ...(play ? { play } : {}), ...(b.tempo !== undefined ? { tempo: b.tempo as number } : {}), ...(find ? { find } : {}), caption };
    }
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
      // names (2026-10-17): false, no octave labels on the keys (a lesson before names are taught); "letters", the
      // marked keys' letters on them (C, D, E: no octave numbers); left out, the octave labels as before.
      if (b.names !== undefined && b.names !== false && b.names !== 'letters') throw new Error(`${where}.names should be false or "letters"`);
      return { kind: 'keys', notes, fingers, ...(b.names !== undefined ? { names: b.names as false | 'letters' } : {}), caption };
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
      if (b.optional !== undefined && typeof b.optional !== 'boolean') throw new Error(`${where}.optional should be true or false`);
      const out: Block = { kind: 'step', id, title: str(b.title, `${where}.title`), activity, doneWhen: optStr(b.doneWhen, `${where}.doneWhen`), about: optStr(b.about, `${where}.about`), ...(b.optional === true ? { optional: true as const } : {}) };
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

type StepOf = Extract<Block, { kind: 'step' }>;
/**
 * How far a lesson's steps are (owner, 2026-10-17: optional steps): the steps needed done and how many there are (an
 * optional step never counts toward the lesson being done), the first needed step not done and its number among the
 * needed ones, and the first optional step not done (suggested only when nothing needed is left).
 */
export function stepProgress(steps: StepOf[], done: Record<string, unknown>): { done: number; total: number; next?: StepOf; nextNo: number; optionalLeft?: StepOf } {
  const needed = steps.filter((s) => !s.optional);
  const i = needed.findIndex((s) => !done[s.id]);
  return { done: needed.filter((s) => done[s.id]).length, total: needed.length, next: i >= 0 ? needed[i] : undefined, nextNo: i + 1, optionalLeft: steps.find((s) => s.optional && !done[s.id]) };
}
/** A step's name on its card and result: "Step n", numbered among the needed steps, or "Optional". */
export function stepLabel(steps: StepOf[], s: StepOf): string {
  return s.optional ? 'Optional' : `Step ${steps.filter((x) => !x.optional).indexOf(s) + 1}`;
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
