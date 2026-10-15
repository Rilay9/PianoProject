// The path's content format (src/lesson/read.ts, text.ts) and how a step counts as done (src/lesson/result.ts):
// every rung and lesson in public/content/path reads, what it names exists, the test content uses every block kind,
// and mistakes are refused with the reason (owner, 2026-10-15: a lesson is a skeleton of blocks fed in later).
// Run: npm run check:path.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { readActivity } from '../src/activity.ts';
import { BLOCK_KINDS, checkTarget, readIndex, readLesson, youtubeId } from '../src/lesson/read.ts';
import { readText } from '../src/lesson/text.ts';
import { meets, outcome } from '../src/lesson/result.ts';
import { readPlay } from '../src/exercise/items.ts';
import { namedPieces } from './named-pieces.mjs';

const pub = (p) => new URL(`../public/${p}`, import.meta.url);
let failed = 0, ran = 0;
const ok = (name, pass, got = '') => { ran++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : ` — ${got}`}`); if (!pass) failed++; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- the content that ships ----------------------------------------------------------------------------------------
const index = readIndex(JSON.parse(readFileSync(pub('content/path/index.json'), 'utf8')));
const ids = index.rungs.flatMap((r) => r.lessons);
const inFolder = readdirSync(pub('content/path/lessons')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
ok('every lesson file is in the index, and every listed one is there', same(inFolder, [...ids].sort()), `folder ${inFolder}; index ${ids}`);
// A piece is one of the app's scores or, by its "u-" id, a catalogue piece (owner, 2026-10-15; tests/named-pieces.mjs).
const named = namedPieces();
const sets = JSON.parse(readFileSync(pub('content/sets/index.json'), 'utf8'));
const acts = JSON.parse(readFileSync(pub('content/activities/index.json'), 'utf8'));
const kindsUsed = new Set();
const charts = JSON.parse(readFileSync(pub('content/lab/index.json'), 'utf8')).charts;
/** A step's set or chart: listed in its index (''), else why not. */
const contentProblem = (a) => ('set' in a ? (sets.includes(`${a.set}.json`) ? '' : `no set "${a.set}" in content/sets/index.json`)
  : charts.includes(`charts/${a.chart}.json`) ? '' : `no chart "${a.chart}" in content/lab/index.json`);
/** A score block's set item: one the set has (''), else why not. A passage from a score (from) has one item a moment: not counted here. */
function itemProblem(set, n) {
  const f = JSON.parse(readFileSync(pub(`content/sets/${set}.json`), 'utf8'));
  if (f.from) return '';
  return Object.keys(f.items ?? {}).includes(String(n)) ? '' : `set "${set}" has items ${Object.keys(f.items ?? {}).join(', ')}, not ${n}`;
}
for (const id of ids) {
  let l;
  try { l = readLesson(id, JSON.parse(readFileSync(pub(`content/path/lessons/${id}.json`), 'utf8'))); ok(`${id} reads (${l.blocks.length} blocks)`, true); }
  catch (e) { ok(`${id} reads`, false, e.message); continue; }
  for (const b of l.blocks) {
    kindsUsed.add(b.kind);
    if (b.kind === 'score' && 'piece' in b.source) ok(`${id}: score block's piece and bars are there`, !named.problem(b.source.piece, b.source.bars), named.problem(b.source.piece, b.source.bars));
    if (b.kind === 'score' && 'set' in b.source) ok(`${id}: score block's set is there`, sets.includes(`${b.source.set}.json`), b.source.set);
    // (2026-10-15, interfaces review: the reader takes any item number; the item must be one the set has)
    if (b.kind === 'score' && 'set' in b.source && sets.includes(`${b.source.set}.json`)) ok(`${id}: score block's item ${b.source.item} is in set "${b.source.set}"`, !itemProblem(b.source.set, b.source.item), itemProblem(b.source.set, b.source.item));
    for (const f of [b.src, 'file' in (b.source ?? {}) ? b.source.file : undefined]) if (f && !f.startsWith('https:')) ok(`${id}: its file ${f} is there`, existsSync(pub(`content/path/${f}`)));
    if (b.kind === 'step') {
      let a;
      if (typeof b.activity === 'string') {
        ok(`${id}: step "${b.id}" names a listed activity`, acts.includes(`${b.activity}.json`), b.activity);
        try { a = readActivity(b.activity, JSON.parse(readFileSync(pub(`content/activities/${b.activity}.json`), 'utf8'))); } catch (e) { ok(`${id}: step "${b.id}"'s activity reads`, false, e.message); continue; }
      } else a = b.activity;
      // (a step's piece, written out or in its activity file: there, and its bars inside it; 2026-10-15, with catalogue pieces)
      if ('piece' in a) ok(`${id}: step "${b.id}"'s piece "${a.piece}"${a.bars ? ` and bars ${a.bars.join('-')}` : ''} are there`, !named.problem(a.piece, a.bars), named.problem(a.piece, a.bars));
      // (2026-10-15, interfaces review: a written-out activity's set or chart was not looked for; activity.mjs does it for files)
      if ('set' in a || 'chart' in a) ok(`${id}: step "${b.id}"'s ${'set' in a ? `set "${a.set}"` : `chart "${a.chart}"`} is there`, !contentProblem(a), contentProblem(a));
      try { checkTarget(b, a); ok(`${id}: step "${b.id}"'s target fits its ${a.screen} activity`, true); } catch (e) { ok(`${id}: step "${b.id}"'s target`, false, e.message); }
    }
  }
}
ok('the test content uses every block kind', BLOCK_KINDS.every((k) => kindsUsed.has(k)), `missing: ${BLOCK_KINDS.filter((k) => !kindsUsed.has(k))}`);
// The sets' kinds (Exercises lists by them): each a known kind.
for (const f of sets) {
  const k = JSON.parse(readFileSync(pub(`content/sets/${f}`), 'utf8')).kind;
  ok(`set ${f} has a known kind (${k})`, ['scales', 'five-finger', 'arpeggios', 'chords', 'intervals', 'cadences', 'melodies'].includes(k), String(k));
}

// ---- what a lesson reads to --------------------------------------------------------------------------------------
const L = (blocks) => ({ title: 't', blocks });
const one = (b) => readLesson('x', L([b])).blocks[0];
ok('reads to: a score block from a piece', same(one({ kind: 'score', piece: 'p', bars: '5-8', keys: true }).source, { piece: 'p', bars: [5, 8] }));
ok('reads to: a score block from a set item', same(one({ kind: 'score', set: 's', item: 2 }).source, { set: 's', item: 2 }));
// A whole MusicXML file written in a lesson (V13): bars that fit their time signature read; an over-full bar, a bar with no
// time signature before it, and a fragment (no bars of its own) are refused.
const N = (step, dur, type) => `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>${dur}</duration><type>${type}</type></note>`;
const XML = (bars) => `<score-partwise version="3.1"><part-list><score-part id="P1"><part-name>x</part-name></score-part></part-list><part id="P1">${bars}</part></score-partwise>`;
const ATTR = '<attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>';
const twoBars = XML(`<measure number="1">${ATTR}${N('C', 1, 'quarter')}${N('D', 1, 'quarter')}${N('E', 1, 'quarter')}${N('F', 1, 'quarter')}</measure><measure number="2">${N('G', 4, 'whole')}</measure>`);
const chordBar = XML(`<measure number="1">${ATTR}${N('C', 4, 'whole')}<note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure>`);
ok('reads to: a MusicXML file / a whole file inline (two bars of 4/4; a chord takes no extra time)', same(one({ kind: 'score', musicxml: 'media/a.musicxml' }).source, { file: 'media/a.musicxml' }) && 'musicxml' in one({ kind: 'score', musicxml: twoBars }).source && 'musicxml' in one({ kind: 'score', musicxml: chordBar }).source);
ok('reads to: keys with fingers ("-" for none)', same(one({ kind: 'keys', notes: 'C4 E4 G4', fingers: '1 - 5' }).fingers, [1, null, 5]));
ok('reads to: an inline step activity, its target', (() => { const s = one({ kind: 'step', id: 'a', title: 'A', activity: { screen: 'drills', set: 's' }, target: { clean: 3 } }); return s.activity.screen === 'drills' && s.target.clean === 3; })());
ok('reads to: a tip with its own label, default "Tip"', one({ kind: 'tip', label: 'Note', text: 'x' }).label === 'Note' && one({ kind: 'tip', text: 'x' }).label === 'Tip');
ok('youtube ids: watch, youtu.be, embed, shorts, bare; not another site', youtubeId('https://www.youtube.com/watch?v=ZD_sAWAlWq0&t=5') === 'ZD_sAWAlWq0' && youtubeId('https://youtu.be/ZD_sAWAlWq0') === 'ZD_sAWAlWq0'
  && youtubeId('https://www.youtube-nocookie.com/embed/ZD_sAWAlWq0') === 'ZD_sAWAlWq0' && youtubeId('https://youtube.com/shorts/ZD_sAWAlWq0') === 'ZD_sAWAlWq0' && youtubeId('ZD_sAWAlWq0') === 'ZD_sAWAlWq0' && youtubeId('https://vimeo.com/123') === null);
const t = readText('# Head\nA **bold** and *it* and [a](https://x.org).\n\n- one\n- two\n1. first', 'b');
ok('text: heading, paragraph with bold, italics and a link, a list, a numbered list', same(t.map((x) => x.t), ['h', 'p', 'ul', 'ol']) && same(t[1].parts.map((p) => p.t), ['text', 'b', 'text', 'i', 'text', 'link', 'text']) && t[2].items.length === 2, JSON.stringify(t));

// ---- refused, with the reason ------------------------------------------------------------------------------------
const refused = [
  ['an unknown block kind', L([{ kind: 'quiz' }]), /kind "quiz" is not one of/],
  ['a misspelt field', L([{ kind: 'text', txt: 'x' }]), /has "txt"/],
  ['a missing field', L([{ kind: 'image', src: 'media/a.png' }]), /needs "alt"/],
  ['raw HTML in text', L([{ kind: 'text', text: 'a <b>b</b>' }]), /HTML/],
  ['a link that is not https', L([{ kind: 'text', text: '[a](javascript:alert(1))' }]), /should start with https/],
  ['a picture outside the content folder', L([{ kind: 'image', src: '../secret.png', alt: 'a' }]), /should be a file in content\/path/],
  ['a picture that is not a picture', L([{ kind: 'image', src: 'media/a.pdf', alt: 'a' }]), /not a kind of file/],
  ['a video that is not YouTube', L([{ kind: 'video', youtube: 'https://vimeo.com/1', title: 'v' }]), /not a YouTube video link/],
  ['a video that ends before it starts', L([{ kind: 'video', youtube: 'ZD_sAWAlWq0', title: 'v', start: 30, end: 10 }]), /is not after start/],
  ['a score with two sources', L([{ kind: 'score', piece: 'p', set: 's', bars: '1-2' }]), /one of piece/],
  ['a score excerpt too long', L([{ kind: 'score', piece: 'p', bars: '1-40' }]), /16 bars at most/],
  ['inline MusicXML that is a fragment (no bars or time signature)', L([{ kind: 'score', musicxml: N('C', 1, 'quarter') }]), /give a whole MusicXML file/],
  ['an over-full bar (four quarters and a whole note in one 4/4 bar)', L([{ kind: 'score', musicxml: XML(`<measure number="1">${ATTR}${N('C', 1, 'quarter')}${N('D', 1, 'quarter')}${N('E', 1, 'quarter')}${N('F', 1, 'quarter')}${N('G', 4, 'whole')}</measure>`) }]), /bar 1 holds 8 quarter notes.*room for 4/],
  ['a bar with no time signature before it', L([{ kind: 'score', musicxml: XML(`<measure number="1"><attributes><divisions>1</divisions></attributes>${N('C', 4, 'whole')}</measure>`) }]), /no time signature/],
  ['keys that are not pitches', L([{ kind: 'keys', notes: 'C4 H4' }]), /"H4" is not a pitch/],
  ['fingers not one a note', L([{ kind: 'keys', notes: 'C4 E4', fingers: '1' }]), /gives 1 for 2 notes/],
  ['a finger 6', L([{ kind: 'keys', notes: 'C4', fingers: '6' }]), /not a finger/],
  ['a step id used twice', L([{ kind: 'step', id: 'a', title: 'A', activity: 'x' }, { kind: 'step', id: 'a', title: 'B', activity: 'y' }]), /used twice/],
  ['an inline activity with a mistake', L([{ kind: 'step', id: 'a', title: 'A', activity: { screen: 'drills', set: 's', level: { rungs: 2 } } }]), /level has "rungs"/],
  ['a target its screen cannot judge', L([{ kind: 'step', id: 'a', title: 'A', activity: { screen: 'freeplay' }, target: { clean: 2 } }]), /cannot be judged/],
  ['a target field of another screen', L([{ kind: 'step', id: 'a', title: 'A', activity: { screen: 'simon', set: 's' }, target: { clean: 2 } }]), /target is chain/],
  ['a target out of range', L([{ kind: 'step', id: 'a', title: 'A', activity: { screen: 'score', piece: 'p', settings: { mode: 'along' } }, target: { onTime: 2 } }]), /0.05 to 1/],
  ['onTime in Wait for me', L([{ kind: 'step', id: 'a', title: 'A', activity: { screen: 'score', piece: 'p', settings: { mode: 'wait' } }, target: { onTime: 0.9 } }]), /needs Play along/],
  ['a lesson field typo', { title: 't', block: [] }, /"block" is not a field/],
  ['a lesson with no blocks', { title: 't', blocks: [] }, /needs "blocks"/],
];
for (const [name, f, want] of refused) {
  let msg = '';
  try { readLesson('x', f); } catch (e) { msg = e.message; }
  ok(`refused: ${name}`, want.test(msg), msg || 'it was accepted');
}
for (const [name, f, want] of [
  ['an index field typo', { rung: [] }, /"rung" is not a field/],
  ['a lesson in two rungs', { rungs: [{ id: 'a', title: 'A', lessons: ['x'] }, { id: 'b', title: 'B', lessons: ['x'] }] }, /twice/],
  ['a rung id with spaces', { rungs: [{ id: 'a b', title: 'A', lessons: [] }] }, /lower-case/],
]) {
  let msg = '';
  try { readIndex(f); } catch (e) { msg = e.message; }
  ok(`refused: ${name}`, want.test(msg), msg || 'it was accepted');
}
// A catalogue piece named by its "u-" id (owner, 2026-10-15): a score block and a step's activity read with it; the content
// check finds it in the catalogue index with its bars inside, and refuses a u- id that is not there or bars past the end.
{
  const cat = 'u-de5f6a78874c'; // 8 bars in the catalogue index (the test lesson's piece)
  const blk = one({ kind: 'score', piece: cat, bars: '1-4' }), st = one({ kind: 'step', id: 'a', title: 'A', activity: { screen: 'score', piece: cat, bars: '5-8', settings: { mode: 'wait' } } });
  ok('a catalogue piece: a score block and a step naming it read, and both are found with their bars', same(blk.source, { piece: cat, bars: [1, 4] }) && st.activity.piece === cat
    && named.problem(cat, blk.source.bars) === '' && named.problem(cat, st.activity.bars) === '', `${named.problem(cat, blk.source.bars)} ${named.problem(cat, st.activity.bars)}`);
  const unknown = one({ kind: 'score', piece: 'u-000000000000', bars: '1-2' }).source;
  ok('refused by the content check: a score block naming a u- id that is in neither the scores nor the catalogue', /neither in public\/scores\/index.json nor in the catalogue/.test(named.problem(unknown.piece, unknown.bars)), named.problem(unknown.piece, unknown.bars) || 'accepted');
  const past = one({ kind: 'step', id: 'a', title: 'A', activity: { screen: 'score', piece: cat, bars: '7-9' } }).activity;
  ok('refused by the content check: a step\'s bars past the end of its catalogue piece', /bars 7-9 are not inside "u-de5f6a78874c" \(it has 8 bars, from the catalogue\)/.test(named.problem(past.piece, past.bars)), named.problem(past.piece, past.bars) || 'accepted');
}
// (2026-10-15, interfaces review) The reader takes any set item number and any set or chart name; the content check
// refuses an item the set does not have, and a written-out step's set or chart that is not listed.
ok('refused by the content check: a score block\'s item the set does not have', /set "chords-c" has items 1, .*not 99/.test(itemProblem('chords-c', 99)), itemProblem('chords-c', 99) || 'accepted');
ok('refused by the content check: a step naming a set, or a chart, that is not there', /no set "nope"/.test(contentProblem({ set: 'nope' })) && /no chart "nope"/.test(contentProblem({ chart: 'nope' })), `${contentProblem({ set: 'nope' })} ${contentProblem({ chart: 'nope' })}`);
// A target on an activity named by id is checked once the activity is read (here: a drill's target on a Simon activity).
{
  const s = one({ kind: 'step', id: 'a', title: 'A', activity: 'chords-simon', target: { clean: 2 } });
  let msg = '';
  try { checkTarget(s, readActivity('chords-simon', { screen: 'simon', set: 'chords-c' })); } catch (e) { msg = e.message; }
  ok('refused once read: a target that does not fit the named activity', /target is chain/.test(msg), msg || 'accepted');
}

// ---- how a set's MusicXML exercises open on the score (`play`; review re-check 2026-10-15, V32) --------------------
ok('play: none given is Wait for me; a mode, hands and tempo read', same(readPlay({}), { mode: 'wait' }) && same(readPlay({ mode: 'along', hands: 'right', tempo: 90 }), { mode: 'along', hands: 'right', tempo: 90 }));
for (const [name, v, want] of [
  ['a mode that is not one', { mode: 'fast' }, /play.mode "fast" should be one of watch, wait, along, rhythm/],
  ['Ladder (it needs a loop of bars)', { mode: 'ladder' }, /Ladder needs a loop/],
  ['a field that is not one', { mode: 'wait', metronome: true }, /play has "metronome"/],
  ['a tempo out of range', { tempo: 900 }, /20 to 300/],
]) {
  let msg = '';
  try { readPlay(v); } catch (e) { msg = e.message; }
  ok(`refused: play with ${name}`, want.test(msg), msg || 'it was accepted');
}

// ---- when a step counts as done ----------------------------------------------------------------------------------
const E = (screen, result, extra = {}) => ({ at: '2026-10-15T10:00:00Z', seconds: 60, screen, title: 't', settings: {}, result, ...extra });
const drills = { id: 'd', title: 'd', screen: 'drills', set: 's', level: {} };
ok('drills clean 4: a set with 4 clean meets it; 3 does not', meets(E('drills', { clean: 4, of: 5 }), { clean: 4 }) && !meets(E('drills', { clean: 3, of: 5 }), { clean: 4 }));
ok('simon chain 3: longest 3 meets it; 2 does not', meets(E('simon', { longestChain: 3 }), { chain: 3 }) && !meets(E('simon', { longestChain: 2 }), { chain: 3 }));
ok('score onTime 0.9: 37 of 41 (0.902) meets; 36 of 41 does not; a loop pass counts', meets(E('score', { notes: 41, onTime: 37 }), { onTime: 0.9 }) && !meets(E('score', { notes: 41, onTime: 36 }), { onTime: 0.9 })
  && meets(E('score', { passes: [{ notes: 10, onTime: 5 }, { notes: 10, onTime: 9 }] }), { onTime: 0.9 }));
ok('score bpm 96: a clean pass at 96 meets; a messy one at 100 does not', meets(E('score', { passes: [{ clean: true, bpm: 96 }] }), { bpm: 96 }) && !meets(E('score', { passes: [{ clean: false, bpm: 100 }, { clean: true, bpm: 90 }] }), { bpm: 96 }));
ok('lab cleanRounds 1: a round of all ok meets; one late bar, or a stopped round, does not', meets(E('lab', { rounds: [{ bars: '1:ok 2:ok' }] }), { cleanRounds: 1 })
  && !meets(E('lab', { rounds: [{ bars: '1:ok 2:late' }] }), { cleanRounds: 1 }) && !meets(E('lab', { rounds: [{ bars: '1:ok', stoppedInBar: 2 }] }), { cleanRounds: 1 }));
ok('done: with a target only when met; without one, any run; no run: not done', outcome([E('drills', { clean: 2, of: 5 })], drills, { clean: 4 }, true).done === false
  && outcome([E('drills', { clean: 2, of: 5 })], drills, undefined, true).done === true && outcome([], drills, undefined, true).done === false);
ok('done: Watch and Free play keep no runs, so coming back is done', outcome([], { id: 'w', title: 'w', screen: 'score', piece: 'p', settings: { mode: 'watch' } }, undefined, true).done
  && outcome([], { id: 'f', title: 'f', screen: 'freeplay' }, undefined, true).done && !outcome([], { id: 's', title: 's', screen: 'score', piece: 'p', settings: { mode: 'wait' } }, undefined, true).done);

console.log(`${failed ? 'FAILED' : 'passed'}: ${ran - failed} of ${ran}`);
process.exit(failed ? 1 : 0);
