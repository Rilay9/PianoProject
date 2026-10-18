// The path's content format (src/lesson/read.ts, text.ts) and how a step counts as done (src/lesson/result.ts):
// every rung and lesson in public/content/path reads, what it names exists, the test content uses every block kind,
// and mistakes are refused with the reason (owner, 2026-10-15: a lesson is a skeleton of blocks fed in later).
// Run: npm run check:path.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { readActivity } from '../src/activity.ts';
import * as read from '../src/lesson/read.ts';
const { BLOCK_KINDS, checkTarget, readIndex, readLesson, youtubeId } = read;
import { readText } from '../src/lesson/text.ts';
import { meets, outcome, playedAsSet, runLine, through } from '../src/lesson/result.ts';
import * as log from '../src/log.ts';
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
/** A rhythm set (2026-10-16) played where it cannot be: Simon (it has no rhythm), or Drills at rung 4 or "notes only" (the
 * screen plays these as rung 3 and normal timing; a step asking for them is a mistake). '' when fine. */
const rhythmMisuse = (a) => {
  if (!('set' in a) || !sets.includes(`${a.set}.json`)) return '';
  const kind = JSON.parse(readFileSync(pub(`content/sets/${a.set}.json`), 'utf8')).kind;
  if (kind === 'find' && a.screen === 'simon') return `set "${a.set}" is a "find it" set: Drills only`; // (2026-10-16)
  if (kind !== 'rhythm') return '';
  if (a.screen === 'simon') return `set "${a.set}" is a rhythm set: Drills only (Simon has no rhythm)`;
  if (a.level?.rung === 4) return `set "${a.set}" is a rhythm set: no rung 4 (name only)`;
  if (a.level?.onTime === 'notes') return `set "${a.set}" is a rhythm set: no "notes only"`;
  return '';
};
const contentProblem = (a) => ('set' in a ? (sets.includes(`${a.set}.json`) ? rhythmMisuse(a) : `no set "${a.set}" in content/sets/index.json`)
  : charts.includes(`charts/${a.chart}.json`) ? '' : `no chart "${a.chart}" in content/lab/index.json`);
ok('a step’s "find it" set in Simon is refused, in Drills it is fine (2026-10-16, after the walk-through)', /Drills only/.test(contentProblem({ screen: 'simon', set: 'test-find-groups', level: {} })) && contentProblem({ screen: 'drills', set: 'test-find-groups', level: {} }) === '', contentProblem({ screen: 'simon', set: 'test-find-groups', level: {} }));
ok("a step's rhythm set in Simon is refused (2026-10-16), in Drills at rung 3 is fine", /Drills only/.test(contentProblem({ screen: 'simon', set: 'rhythm-whole', level: {} })) && contentProblem({ screen: 'drills', set: 'rhythm-whole', level: { rung: 3 } }) === '', contentProblem({ screen: 'simon', set: 'rhythm-whole', level: {} }));
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
// The sets' kinds (Exercises lists by them): a kind is optional (none: listed under "Other"), and one given is known.
for (const f of sets) {
  const k = JSON.parse(readFileSync(pub(`content/sets/${f}`), 'utf8')).kind;
  ok(`set ${f}: its kind is known, or left out (${k})`, k === undefined || ['scales', 'five-finger', 'arpeggios', 'chords', 'intervals', 'cadences', 'melodies', 'rhythm', 'find'].includes(k), String(k));
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
ok('reads to: keys with names false or "letters" (2026-10-17); left out, none given', one({ kind: 'keys', notes: 'C4', names: false }).names === false && one({ kind: 'keys', notes: 'C4', names: 'letters' }).names === 'letters' && one({ kind: 'keys', notes: 'C4' }).names === undefined);
ok('reads to: an inline step activity, its target', (() => { const s = one({ kind: 'step', id: 'a', title: 'A', activity: { screen: 'drills', set: 's' }, target: { clean: 3 } }); return s.activity.screen === 'drills' && s.target.clean === 3; })());
{
  let row, full, msg = '';
  try { row = one({ kind: 'video', youtube: 'ZD_sAWAlWq0', title: 'v', size: 'row' }); full = one({ kind: 'video', youtube: 'ZD_sAWAlWq0', title: 'v' }); } catch (e) { msg = e.message; }
  ok('reads to: a video as a row ("size": "row"); left out, the full player', row?.size === 'row' && full && full.size === undefined, msg || JSON.stringify({ row, full }));
}
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
  ['a video size that is not "row"', L([{ kind: 'video', youtube: 'ZD_sAWAlWq0', title: 'v', size: 'small' }]), /size "small" should be "row"/],
  ['a score with two sources', L([{ kind: 'score', piece: 'p', set: 's', bars: '1-2' }]), /one of piece/],
  ['a score excerpt too long', L([{ kind: 'score', piece: 'p', bars: '1-40' }]), /16 bars at most/],
  ['inline MusicXML that is a fragment (no bars or time signature)', L([{ kind: 'score', musicxml: N('C', 1, 'quarter') }]), /give a whole MusicXML file/],
  ['an over-full bar (four quarters and a whole note in one 4/4 bar)', L([{ kind: 'score', musicxml: XML(`<measure number="1">${ATTR}${N('C', 1, 'quarter')}${N('D', 1, 'quarter')}${N('E', 1, 'quarter')}${N('F', 1, 'quarter')}${N('G', 4, 'whole')}</measure>`) }]), /bar 1 holds 8 quarter notes.*room for 4/],
  ['a bar with no time signature before it', L([{ kind: 'score', musicxml: XML(`<measure number="1"><attributes><divisions>1</divisions></attributes>${N('C', 4, 'whole')}</measure>`) }]), /no time signature/],
  ['keys that are not pitches', L([{ kind: 'keys', notes: 'C4 H4' }]), /"H4" is not a pitch/],
  ['fingers not one a note', L([{ kind: 'keys', notes: 'C4 E4', fingers: '1' }]), /gives 1 for 2 notes/],
  ['a finger 6', L([{ kind: 'keys', notes: 'C4', fingers: '6' }]), /not a finger/],
  ['keys names other than false or "letters"', L([{ kind: 'keys', notes: 'C4', names: true }]), /names should be false or "letters"/],
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
// Test rungs out of the learner's way (2026-10-16): a rung marked "test": true is hidden from the learner's Path and Home
// (lesson/path.ts loadPath: shownIndex), and shown when the checks ask (window.__pianoTestContent). The shipped test rung
// is marked, so the learner never sees it, and the checks still read it here as before.
{
  const raw = JSON.parse(readFileSync(pub('content/path/index.json'), 'utf8'));
  ok('the shipped index: every rung titled "Test:" is marked "test": true (hidden from the learner)', raw.rungs.every((r) => !/^Test:/.test(r.title) || r.test === true), JSON.stringify(raw.rungs.map((r) => [r.id, r.test])));
  ok('the shipped index: the checks still read the test rung and its five lessons (test-consistency, test-walkfix: 2026-10-16)', same(index.rungs.find((r) => r.id === 'test-app')?.lessons, ['test-minuet-opening', 'test-consistency', 'test-catalogue-piece', 'test-walkfix', 'test-chords-and-band']), JSON.stringify(index.rungs));
  const shownIndex = read.shownIndex;
  const two = typeof shownIndex === 'function' ? readIndex({ rungs: [{ id: 'test-app', title: 'Test: x', test: true, lessons: ['t1'] }, { id: 'first', title: 'Playing before reading', lessons: ['l1'] }] }) : null;
  ok('learner: a test rung is hidden, a real rung shown', !!two && same(shownIndex(two, false).rungs.map((r) => r.id), ['first']), two ? JSON.stringify(shownIndex(two, false)) : 'no shownIndex in lesson/read.ts');
  ok('checks: with test content asked for, both rungs as written', !!two && same(shownIndex(two, true).rungs.map((r) => r.id), ['test-app', 'first']));
  ok('the shipped index as a learner sees it: rung 1 first, the test rung hidden', typeof shownIndex === 'function' && shownIndex(index, false).rungs[0]?.id === 'r1' && !shownIndex(index, false).rungs.some((r) => r.test), typeof shownIndex === 'function' ? JSON.stringify(shownIndex(index, false).rungs.map((r) => r.id)) : '');
  let msg = '';
  try { readIndex({ rungs: [{ id: 'a', title: 'A', test: 'yes', lessons: [] }] }); } catch (e) { msg = e.message; }
  ok('refused: a rung’s "test" that is not true or false', /rung 1.test is "yes"; it should be true or false/.test(msg), msg || 'it was accepted');
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
// (a run is counted for a step only when played as the step sets it, targets or not (consistency pass, 2026-10-16): the
// entries below carry the step's set, as real entries do)
const D = (result) => E('drills', result, { set: 's' }), Si = (result) => E('simon', result, { set: 's' });
ok('drills clean 4: a full set with 4 clean meets it; 3 does not', meets(E('drills', { clean: 4, of: 5, ended: 'set done', missesAgain: false }), { clean: 4 }) && !meets(E('drills', { clean: 3, of: 5, ended: 'set done', missesAgain: false }), { clean: 4 }));
// Owner, 2026-10-15 (F10): full sets only, as Drills' own best: "the misses again" (4 of 4 clean) and a set stopped
// early or left part way do not meet it.
ok('drills clean 4: the misses again (4 of 4 clean), a set stopped early and one left part way do not meet it',
  !meets(E('drills', { clean: 4, of: 4, ended: 'set done', missesAgain: true }), { clean: 4 }) && !meets(E('drills', { clean: 4, of: 4, ended: 'stopped early', missesAgain: false }), { clean: 4 })
  && !meets(E('drills', { clean: 4, of: 4, ended: 'left', missesAgain: false }), { clean: 4 }));
ok('simon chain 3: longest 3 meets it; 2 does not', meets(E('simon', { longestChain: 3 }), { chain: 3 }) && !meets(E('simon', { longestChain: 2 }), { chain: 3 }));
ok('score onTime 0.9: 37 of 41 (0.902) meets; 36 of 41 does not; a loop pass counts', meets(E('score', { notes: 41, onTime: 37 }), { onTime: 0.9 }) && !meets(E('score', { notes: 41, onTime: 36 }), { onTime: 0.9 })
  && meets(E('score', { passes: [{ notes: 10, onTime: 5 }, { notes: 10, onTime: 9 }] }), { onTime: 0.9 }));
ok('score bpm 96: a clean pass at 96 meets; a messy one at 100 does not', meets(E('score', { passes: [{ clean: true, bpm: 96 }] }), { bpm: 96 }) && !meets(E('score', { passes: [{ clean: false, bpm: 100 }, { clean: true, bpm: 90 }] }), { bpm: 96 }));
ok('lab cleanRounds 1: a round of all ok meets; one late bar, or a stopped round, does not', meets(E('lab', { rounds: [{ bars: '1:ok 2:ok' }] }), { cleanRounds: 1 })
  && !meets(E('lab', { rounds: [{ bars: '1:ok 2:late' }] }), { cleanRounds: 1 }) && !meets(E('lab', { rounds: [{ bars: '1:ok', stoppedInBar: 2 }] }), { cleanRounds: 1 }));
// Final review 2026-10-15, F07: a lab run that looped bars logs rounds of just those bars (`bars` on the entry); a loop
// is practice (the lab says so), so its rounds never meet a lesson's cleanRounds, however clean.
ok('lab cleanRounds 1: rounds of a looped bar (bars "1-1" on the entry), all ok, do not meet it; the same rounds over the chart do',
  !meets(E('lab', { rounds: [{ bars: '1:ok' }, { bars: '1:ok' }, { bars: '1:ok' }] }, { bars: '1-1' }), { cleanRounds: 1 })
  && meets(E('lab', { rounds: [{ bars: '1:ok 2:ok' }] }), { cleanRounds: 1 }));
ok('done: with a target only when met; without one, a run through; no run: not done', outcome([D({ clean: 2, of: 5 })], drills, { clean: 4 }, true).done === false
  && outcome([D({ clean: 2, of: 5, ended: 'set done' })], drills, undefined, true).done === true && outcome([], drills, undefined, true).done === false);
// Owner, 2026-10-16: a Drills step with no target (an introduction) is done when its whole set is played through, any
// result (one card "how do they learn anything from that?"); a set left part way is tried, not played through (F6).
ok('done without a target: a Drills set played through (0 clean) is done; one left after a card is not',
  outcome([D({ clean: 0, of: 5, ended: 'set done' })], drills, undefined, true).done === true
  && outcome([D({ clean: 0, of: 1, ended: 'left' })], drills, undefined, true).done === false);
ok('done without a target: a Simon game left part way is tried; one that ran its course (over, its goal) is played through',
  outcome([Si({ longestChain: 2, ended: 'stopped' })], { id: 's', title: 's', screen: 'simon', set: 's', level: {} }, undefined, true).done === false
  && outcome([Si({ longestChain: 3, ended: 'goal' })], { id: 's', title: 's', screen: 'simon', set: 's', level: {} }, undefined, true).done === true
  && outcome([Si({ longestChain: 1, ended: 'over' })], { id: 's', title: 's', screen: 'simon', set: 's', level: {} }, undefined, true).done === true);
// Owner, 2026-10-16 (after the same review, F2): a target counts only runs played as the step sets them: its set, its help
// level or a harder one, its number of cards, its timing or a stricter one; tempo free. Others are practice, said so.
{
  const step = { id: 'r', title: 'r', screen: 'drills', set: 'rh', level: { rung: 3, cards: 5, onTime: 'relaxed' } };
  const run = (settings, set = 'rh') => E('drills', { clean: 5, of: 5, ended: 'set done', missesAgain: false }, { set, settings });
  const as = { rung: 3, cards: 5, onTime: 'relaxed', bpm: 72 };
  const cases = [
    ['as set', run(as), true, ''], ['stricter timing, another tempo', run({ ...as, onTime: 'strict', bpm: 60 }), true, ''],
    ['another set', run(as, 'other'), false, 'another set'], ['an easier help level (music and sound)', run({ ...as, rung: 2 }), false, 'another help level'],
    ['more cards', run({ ...as, cards: 10 }), false, 'another number of cards'], ['notes only', run({ ...as, onTime: 'notes' }), false, 'more lenient timing'],
  ];
  for (const [what, e, met, why] of cases) {
    const o = outcome([e], step, { clean: 4 }, true);
    ok(`a target counts runs played as the step sets them: ${what} → ${met ? 'met' : `not met (${why})`}`, o.met === met && (met || o.line.includes(`played with ${why}: practice`)) && playedAsSet(e, step) === why, JSON.stringify({ o, why: playedAsSet(e, step) }));
  }
  const simonStep = { id: 's', title: 's', screen: 'simon', set: 'bk', level: { rung: 0, match: 'same' } };
  const sRun = (rung) => E('simon', { longestChain: 3, ended: 'goal' }, { set: 'bk', settings: { rung, match: 'same' } });
  ok('a Simon step at keys-and-sound (0): a chain of 3 at 0 or by ear (5) counts; with music shown (1) is another help level',
    outcome([sRun(0)], simonStep, { chain: 3 }, true).met && outcome([sRun(5)], simonStep, { chain: 3 }, true).met && !outcome([sRun(1)], simonStep, { chain: 3 }, true).met);
}
// Owner, 2026-10-15 (Q5): a score step with no target counts only a run in the step's own mode that reached the end
// of its bars (Wait for me: round its loop; the timed modes: a pass round the loop, or the piece's last note).
{
  const waitStep = { id: 'w', title: 'w', screen: 'score', piece: 'p', bars: [1, 4], settings: { mode: 'wait' } };
  const alongStep = { id: 'a', title: 'a', screen: 'score', piece: 'p', settings: { mode: 'along' } };
  const done = (entries, a) => outcome(entries, a, undefined, true).done;
  const S = (mode, result) => E('score', result, { mode });
  ok('Q5: a Wait for me step: a Play along run stopped after two notes does not mark it done; one round its bars does',
    !done([S('along', { notes: 2, onTime: 2, fromBar: 1, toBar: 1, reachedEnd: false })], waitStep) && done([S('wait', { fromBar: 1, toBar: 4, steps: 15, rounds: 1 })], waitStep));
  ok('Q5: a Wait for me step: a Play along run to the piece’s end (another mode) does not mark it done; a Wait for me run not through does not either',
    !done([S('along', { notes: 40, onTime: 30, fromBar: 1, toBar: 20, reachedEnd: true })], waitStep) && !done([S('wait', { fromBar: 1, toBar: 2, steps: 5, rounds: 0 })], waitStep));
  ok('Q5: a Play along step: stopped part way, no; to the last note, or a pass round its loop, yes',
    !done([S('along', { notes: 10, onTime: 9, fromBar: 1, toBar: 3, reachedEnd: false })], alongStep) && done([S('along', { notes: 40, onTime: 30, fromBar: 1, toBar: 20, reachedEnd: true })], alongStep)
    && done([S('along', { passes: [{ pass: 1, notes: 8, onTime: 6, clean: false }] })], alongStep));
}
// Owner, 2026-10-16 (consistency survey, Q11): Watch and Free play keep no runs; "visited" only once the music was heard to
// its end (Watch) or a key was played (Free play) while the step was open; coming back without that is "opened, nothing played".
{
  const watch = { id: 'w', title: 'w', screen: 'score', piece: 'p', settings: { mode: 'watch' } }, fp = { id: 'f', title: 'f', screen: 'freeplay' };
  const no = (a) => outcome([], a, undefined, true, false), yes = (a) => outcome([], a, undefined, true, true);
  ok('visited: Watch heard to its end, Free play with a key played: done; coming back without that: not done, "Opened, nothing played"',
    yes(watch).done && yes(fp).done && !no(watch).done && !no(fp).done && no(fp).line === 'Opened, nothing played' && yes(fp).line === 'You played in Free play' && yes(watch).line === 'Watched to the end'
    && !outcome([], { id: 's', title: 's', screen: 'score', piece: 'p', settings: { mode: 'wait' } }, undefined, true, true).done, JSON.stringify([no(fp), yes(fp), no(watch), yes(watch)]));
}
// The log's evidence for it (log.ts): kept for the step the activity in force belongs to, read once on coming back.
{
  const ref = { rung: 'r1', lesson: 'l1', step: 's1' };
  log.setStep({ id: 'f', screen: 'freeplay', lesson: ref });
  log.stepEvidence('score'); // (another screen's: not this step's)
  const before = log.takeEvidence(ref);
  log.stepEvidence('freeplay');
  log.endStep();
  const after = log.takeEvidence(ref), again = log.takeEvidence(ref);
  ok('visited evidence: kept for the step in force, by its own screen only, read once', !before && after && !again, JSON.stringify({ before, after, again }));
}

// Owner, 2026-10-16 (consistency survey, Q10): a Memorise step with no target is done when a chunk is learned (its
// first chunk learned; the clean passes it asks for), or a whole-piece test is clean; passes alone are tried.
{
  const memo = { id: 'm', title: 'm', screen: 'memorise', piece: 'p', settings: { hands: 'right' } };
  const M = (result, hands = 'right') => E('memorise', result, { piece: 'p', settings: { hands } });
  ok('Memorise: a chunk learned is played through; passes with no chunk learned are tried; a clean test is through',
    outcome([M({ passes: [{ clean: true }], learned: ['chunk: bars 1–4'] })], memo, undefined, true).done
    && !outcome([M({ passes: [{ clean: true }, { clean: false }], learned: ['bars 1–2'] })], memo, undefined, true).done
    && outcome([M({ passes: [], learned: [], tests: [{ kind: 'notes', clean: true }] })], memo, undefined, true).done);
  const other = outcome([M({ passes: [{ clean: true }], learned: ['chunk: bars 1–4'] }, 'left')], memo, undefined, true);
  ok('Memorise: a chunk learned with the other hand is practice (said so); both hands counts for a one-hand step',
    !other.done && /played with other hands: practice/.test(other.line) && outcome([M({ learned: ['chunk: bars 1–4'] }, 'both')], memo, undefined, true).done, other.line);
}

// The score (consistency pass, 2026-10-16): a run counts in the step's piece, its mode (Play along and Ladder for each
// other; Rhythm only for Rhythm), its hands or more, a loop holding its bars, its timing or stricter; tempo free.
{
  const step = { id: 'p', title: 'p', screen: 'score', piece: 'p', bars: [3, 4], settings: { mode: 'along', hands: 'right', onTime: 'normal' } };
  const run = (mode, settings, piece = 'p') => E('score', { passes: [{ notes: 10, onTime: 10, clean: true, bpm: 60 }] }, { mode, piece, settings: { mode, hands: 'right', onTime: 'normal', loop: '3-4', bpm: 60, ...settings } });
  const cases = [
    ['as set, slower', run('along', { bpm: 40 }), ''], ['in Ladder', run('ladder', {}), ''], ['both hands', run('along', { hands: 'both' }), ''],
    ['a loop of bars 1–6 (holding 3–4)', run('along', { loop: '1-6' }), ''], ['stricter timing', run('along', { onTime: 'strict' }), ''],
    ['in Rhythm', run('rhythm', {}), 'another mode'], ['in Wait for me', run('wait', {}), 'another mode'], ['the left hand', run('along', { hands: 'left' }), 'other hands'],
    ['a loop of bar 3 only', run('along', { loop: '3-3' }), 'other bars'], ['relaxed timing', run('along', { onTime: 'relaxed' }), 'more lenient timing'],
    ['another piece', run('along', {}, 'q'), 'another piece'],
  ];
  for (const [what, e, why] of cases) {
    const o = outcome([e], step, { onTime: 0.9 }, true);
    ok(`score: a Play along step's onTime target and a run ${what} → ${why ? `practice (${why})` : 'met'}`, playedAsSet(e, step) === why && o.met === !why && (!why || o.line.includes(`played with ${why}: practice`)), JSON.stringify({ why: playedAsSet(e, step), o }));
  }
  const both = { ...step, settings: { mode: 'along', hands: 'both' } };
  ok('score: a both-hands step: one hand is other hands; Off (you play both, no piano) counts', playedAsSet(run('along', { hands: 'right' }), both) === 'other hands' && playedAsSet(run('along', { hands: 'off' }), both) === '');
  // No target: through only in the step's mode and as set.
  const noTarget = { ...step, settings: { mode: 'along', hands: 'right' } };
  ok('score: no target: a pass round the loop played as set is through; the same in Rhythm is practice, not through',
    outcome([run('along', {})], noTarget, undefined, true).done && !outcome([run('rhythm', {})], noTarget, undefined, true).done);
}

// The lab (consistency pass, 2026-10-16): its chart, its part, its step or a later one; whole-chart rounds (a loop is practice).
{
  const step = { id: 'l', title: 'l', screen: 'lab', chart: 'blues-c', preset: { role: 'accomp', step: 'beat1' } };
  const run = (settings, extra = {}) => E('lab', { rounds: [{ bars: '1:ok 2:ok' }] }, { chart: 'blues-c', settings: { role: 'accomp', step: 'beat1', ...settings }, ...extra });
  const cases = [
    ['its step', run({}), ''], ['a later step', run({ step: 'style' }), ''], ['an earlier step (roots)', run({ step: 'roots' }), 'an earlier step'],
    ['the lead', run({ role: 'lead', step: 'root' }), 'the lead, not the accompaniment'], ['another chart', run({}, { chart: 'pop-c' }), 'another chart'],
    ['a loop of bar 1', run({}, { bars: '1-1' }), 'some bars looped'],
  ];
  for (const [what, e, why] of cases) {
    const o = outcome([e], step, { cleanRounds: 1 }, true);
    ok(`lab: a cleanRounds target and a round of ${what} → ${why ? `practice (${why})` : 'met'}`, playedAsSet(e, step) === why && o.met === !why, JSON.stringify({ why: playedAsSet(e, step), o }));
  }
  const ladder = { ...step, preset: { role: 'accomp', step: 'style', steps: { accompaniment: ['style', 'roots'] } } };
  ok("lab: an activity's own ladder decides what is later (roots after style there)", playedAsSet(run({ step: 'roots' }), ladder) === '' && playedAsSet(run({ step: 'beat1' }), ladder) === 'an earlier step');
  const noTarget = { ...step };
  ok('lab: no target: a whole round is through; a round stopped part way, or a loop, is not',
    outcome([run({})], noTarget, undefined, true).done && !outcome([E('lab', { rounds: [{ bars: '1:ok', stoppedInBar: 2 }] }, { chart: 'blues-c', settings: { role: 'accomp', step: 'beat1' } })], noTarget, undefined, true).done
    && !outcome([run({}, { bars: '1-1' })], noTarget, undefined, true).done);
}

// Practise as… (Drills to Simon): a game played as Simon is practice for a Drills step, said so.
{
  const step = { id: 'd', title: 'd', screen: 'drills', set: 's', level: {} };
  const o = outcome([E('simon', { longestChain: 3, ended: 'goal' }, { set: 's' })], step, undefined, true);
  ok('Practise as…: a Simon game for a Drills step is practice ("Simon, not Drills"), not through', !o.done && /played with Simon, not Drills: practice/.test(o.line), o.line);
}

// The step's headline after the beginner walk-through (owner, 2026-10-16): the best whole run played as the step sets it,
// Simon's best chain; "the misses again" is practice, never "stopped early", never the headline nor "played through".
{
  const sStep = { id: 's', title: 's', screen: 'simon', set: 'bk', level: { rung: 0 } };
  const chain = (n, rung, ended) => E('simon', { longestChain: n, ended }, { set: 'bk', settings: { rung } });
  // a chain of 3 at help 0, then a game over at chain 0 by ear (help 5: harder, counted): the headline is the 3
  const s = outcome([chain(3, 0, 'goal'), chain(0, 5, 'over')], sStep, { chain: 3 }, true);
  ok('headline: Simon, a chain of 3 then a game over at 0: "Longest chain 3", not the last run (was "Longest chain 0 · 2 runs")', s.met && /^Longest chain 3/.test(s.line) && !/chain 0/.test(s.line), s.line);
  const dStep = { id: 'd', title: 'd', screen: 'drills', set: 'qh', level: { rung: 3, cards: 5 } };
  const set = (clean, of, extra = {}) => E('drills', { clean, of, ended: 'set done', ...extra }, { set: 'qh', settings: { rung: 3, cards: of === 5 ? 5 : 5 } });
  // 3 of 5, then the 2 misses again, both clean
  const d = outcome([set(3, 5), set(2, 2, { missesAgain: true })], dStep, { clean: 4 }, true);
  ok('headline: Drills, 3 of 5 then the misses again 2 of 2: "3 of 5 cards clean", the misses again said as practice, no "stopped early"', !d.met && /^3 of 5 cards clean/.test(d.line) && /practice \(the misses again\)/.test(d.line) && !/stopped early/.test(d.line), d.line);
  ok('the misses again, played to the end, is not "played through" for a step with no target', !outcome([set(2, 2, { missesAgain: true })], dStep, undefined, true).done && outcome([set(1, 5)], dStep, undefined, true).done);
  ok('runLine: the misses again says practice, an older entry logged "stopped early" too', runLine(set(2, 2, { missesAgain: true })) === '2 of 2 cards clean (the misses again: practice)' && runLine(E('drills', { clean: 2, of: 2, ended: 'stopped early', missesAgain: true })) === '2 of 2 cards clean (the misses again: practice)');
  // two full sets: the better one heads
  const two = outcome([set(4, 5), set(2, 5)], dStep, { clean: 4 }, true);
  ok('headline: two full sets, 4 then 2: "4 of 5 cards clean · the best of 2 runs"', two.met && two.line === '4 of 5 cards clean · the best of 2 runs', two.line);
  ok('through(): in the learner’s words ("playing the whole set", "playing a game to its end")', through(dStep) === 'playing the whole set' && through(sStep) === 'playing a game to its end' && through({ id: 'f', title: 'f', screen: 'freeplay' }) === 'playing a key');
}

console.log(`${failed ? 'FAILED' : 'passed'}: ${ran - failed} of ${ran}`);
process.exit(failed ? 1 : 0);
