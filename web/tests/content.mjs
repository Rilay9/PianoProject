// The content formats no other check reads (2026-10-15, interfaces review): the song list (public/scores/index.json),
// the exercise sets (public/content/sets), the lab's charts and styles (public/content/lab) and the catalogue index's
// header. Activities and the path have their own checks (activity.mjs, path.mjs).
//
// Where the app's reader is laxer than the format docs/app-features.md gives, the stricter rule is here, so a mistake
// in a shipped file fails `npm run check` with its reason instead of loading silently, being ignored, or (a chord's
// octave that is not a whole number) hanging the app. The reader bugs themselves are listed in
// design/2026-10-15-final-review/interfaces.md; when a reader is fixed, its rule here can go.
// Each rule is also run on a bad case of its own, which it must refuse (the "refuses:" lines). Run: npm run check:content.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { Chord, Interval, Note, Scale } from 'tonal';
import { EXERCISE_KINDS, readSet } from '../src/exercise/items.ts';
import { readRhythmSpec } from '../src/exercise/rhythm.ts';
import { readFindSpec } from '../src/exercise/find.ts';
import { readChart, readStyle } from '../src/lab/music.ts';
import { soundOf } from '../src/library/midi/band.ts';
import { BUNDLED_PARTS } from '../src/sound.ts';
import { namedPieces } from './named-pieces.mjs';
import { HELP_IDS, readHelp } from '../src/help/read.ts';

const pub = (p) => new URL(`../public/${p}`, import.meta.url);
const json = (p) => JSON.parse(readFileSync(pub(p), 'utf8'));
let failed = 0, ran = 0;
const ok = (name, pass, got = '') => { ran++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : ` — ${got}`}`); if (!pass) failed++; };
const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v) => typeof v === 'string' && v.trim() !== '';
/** Each bad case must be refused, with a reason matching `want`. */
const refuses = (what, problems, want) => ok(`refuses: ${what}`, problems.some((p) => want.test(p)), problems.join('; ') || 'nothing said');
const ID = /^[a-z0-9][a-z0-9-]*$/;

// ---- the song list: public/scores/index.json (docs §1). The app reads it with no check at all (main.ts start). ----------
const SCORE_FIELDS = ['id', 'title', 'composer', 'file', 'source', 'license', 'licenseUrl', 'status', 'kind'];
function scoreListProblems(list, fileThere) {
  if (!Array.isArray(list)) return ['the song list should be a list of entries'];
  const out = [], seen = new Set();
  list.forEach((e, i) => {
    const at = `entry ${i + 1}${isObj(e) && typeof e.id === 'string' ? ` ("${e.id}")` : ''}`;
    if (!isObj(e)) { out.push(`${at} should be an object`); return; }
    for (const k of Object.keys(e)) if (!SCORE_FIELDS.includes(k)) out.push(`${at} has "${k}", which is not one of ${SCORE_FIELDS.join(', ')}`);
    for (const k of ['id', 'title', 'file']) if (!text(e[k])) out.push(`${at} needs "${k}", some text`);
    if (typeof e.composer !== 'string') out.push(`${at} needs "composer", text ("" when unknown)`);
    if (text(e.id)) {
      if (!ID.test(e.id)) out.push(`${at}: id should be lower-case letters, digits and -`);
      if (/^(u|ex)-/.test(e.id)) out.push(`${at}: an id starting "u-" or "ex-" is taken (your library's pieces, a set's music)`);
      if (seen.has(e.id)) out.push(`${at}: id used twice`);
      seen.add(e.id);
    }
    if (text(e.file) && !/^[^/\\]+\.(musicxml|xml)$/i.test(e.file)) out.push(`${at}: file "${e.file}" should be a .musicxml or .xml file name in scores/ (the app reads it as text)`);
    else if (text(e.file) && !fileThere(e.file)) out.push(`${at}: file "${e.file}" is not in public/scores`);
    if (e.source !== undefined) {
      if (!isObj(e.source)) out.push(`${at}: source should be an object`);
      else {
        for (const k of Object.keys(e.source)) if (!['dataset', 'mxl', 'uploadTitle'].includes(k)) out.push(`${at}: source has "${k}", which is not one of dataset, mxl, uploadTitle`);
        for (const [k, v] of Object.entries(e.source)) if (!text(v)) out.push(`${at}: source.${k} should be some text`);
        if (!text(e.source.dataset)) out.push(`${at}: source needs "dataset"`);
      }
    }
    for (const k of ['license', 'status']) if (e[k] !== undefined && !text(e[k])) out.push(`${at}: ${k} should be some text`);
    if (e.licenseUrl !== undefined && !(typeof e.licenseUrl === 'string' && /^https:\/\/\S+$/.test(e.licenseUrl))) out.push(`${at}: licenseUrl should be an https:// link`);
    if (e.kind !== undefined && !EXERCISE_KINDS.includes(e.kind)) out.push(`${at}: kind "${e.kind}" should be one of ${EXERCISE_KINDS.join(', ')}`);
  });
  return out;
}
const scoreFiles = new Set(readdirSync(pub('scores')));
const songs = json('scores/index.json');
{
  const p = scoreListProblems(songs, (f) => scoreFiles.has(f));
  ok(`scores/index.json: ${songs.length} entries, each as §1 says`, !p.length, p.join('; '));
  const listed = new Set(songs.map((s) => s.file));
  const unlisted = [...scoreFiles].filter((f) => f !== 'index.json' && !listed.has(f));
  ok('every score file in public/scores is in the song list', !unlisted.length, unlisted.join(', '));
  const good = { id: 'a-b', title: 'T', composer: '', file: 'mozart-k2.musicxml' };
  const bad = (e) => scoreListProblems([e], (f) => scoreFiles.has(f));
  refuses('a song entry with a misspelt field', bad({ ...good, licence: 'x' }), /has "licence"/);
  refuses('a song entry with no file', bad({ id: 'a', title: 'T', composer: '' }), /needs "file"/);
  refuses('a song entry with no composer', bad({ id: 'a', title: 'T', file: 'mozart-k2.musicxml' }), /needs "composer"/);
  refuses('a song entry whose file is not there', bad({ ...good, file: 'nope.musicxml' }), /not in public\/scores/);
  refuses('a song entry naming an .mxl (read as text)', bad({ ...good, file: 'x.mxl' }), /\.musicxml or \.xml/);
  refuses('a song id starting u-', bad({ ...good, id: 'u-123' }), /"u-" or "ex-" is taken/);
  refuses('a song id used twice', scoreListProblems([good, good], () => true), /used twice/);
  refuses('a song kind that is not one', bad({ ...good, kind: 'etude' }), /kind "etude"/);
  refuses('a source field typo', bad({ ...good, source: { dataset: 'PDMX', upload: 'x' } }), /source has "upload"/);
  refuses('the song list not a list', scoreListProblems({ songs: [] }, () => true), /should be a list/);
}

// ---- the exercise sets: public/content/sets (docs §6) ------------------------------------------------------------------
const OPTIONS = { notes: ['name', 'short'], chord: ['octave', 'arpeggio', 'name', 'short'], interval: ['root', 'together', 'name', 'short'], musicxml: ['name', 'short'] };
const PITCH = /^[A-Ga-g](#{1,2}|b{1,2})?-?\d$/;
/** What the reader lets through but the format does not allow (items.ts readSet/buildItem; F1-F3 in the notes). */
function setProblems(f, fileThere, bars) {
  const out = [];
  if (!isObj(f)) return ['a set should be an object'];
  if (f.items !== undefined) {
    if (!isObj(f.items)) out.push('items should be an object numbered "1", "2", … (not a list)');
    else {
      const keys = Object.keys(f.items);
      if (!keys.length) out.push('items is empty: a set needs at least one item');
      for (const k of keys) {
        const at = `item "${k}"`, it = f.items[k];
        if (!/^[1-9]\d*$/.test(k)) out.push(`${at}: items are numbered 1, 2, …`);
        if (!isObj(it)) { out.push(`${at} should be an object`); continue; }
        const kind = ['notes', 'chord', 'interval', 'musicxml'].filter((x) => it[x] !== undefined);
        if (kind.length !== 1) continue; // (the reader says this one itself)
        // (a finger-number set's cards, view "fingers": notes with "fingers" and "hand"; 2026-10-17)
        const opts = f.view === 'fingers' && kind[0] === 'notes' ? [...OPTIONS.notes, 'fingers', 'hand'] : OPTIONS[kind[0]];
        for (const o of Object.keys(it)) if (o !== kind[0] && !opts.includes(o)) out.push(`${at}: "${o}" is not an option of a ${kind[0]} item${f.view === 'fingers' ? ' on a finger-number card' : ''} (${opts.join(', ')})`);
        for (const o of ['name', 'short']) if (it[o] !== undefined && !text(it[o])) out.push(`${at}: ${o} should be some text`);
        if (kind[0] === 'notes' && !(typeof it.notes === 'string' && it.notes.split(/[\s,]+/).filter(Boolean).every((p) => PITCH.test(p)))) out.push(`${at}: notes should be pitches like "C4 E4 G4" or "C4, E4, G4"`);
        if (kind[0] === 'chord') {
          if (typeof it.chord !== 'string' || Chord.get(it.chord).empty) out.push(`${at}: chord "${it.chord}" is not a chord symbol Tonal reads`);
          if (it.octave !== undefined && !(Number.isInteger(it.octave) && it.octave >= 0 && it.octave <= 7)) out.push(`${at}: octave ${JSON.stringify(it.octave)} should be a whole number 0 to 7 (anything else hangs the app: F1)`);
          if (it.arpeggio !== undefined && typeof it.arpeggio !== 'boolean') out.push(`${at}: arpeggio should be true or false`);
        }
        if (kind[0] === 'interval') {
          if (typeof it.interval !== 'string' || Interval.get(it.interval).empty) out.push(`${at}: interval "${it.interval}" is not an interval name like M3`);
          if (it.root !== undefined && !(typeof it.root === 'string' && PITCH.test(it.root))) out.push(`${at}: root should be a pitch like C4`);
          if (it.together !== undefined && typeof it.together !== 'boolean') out.push(`${at}: together should be true or false`);
        }
        if (kind[0] === 'musicxml' && typeof it.musicxml === 'string') {
          const s = it.musicxml.trim();
          if (!s.startsWith('<')) {
            if (!/^[^/\\]+\.(musicxml|xml)$/i.test(s)) out.push(`${at}: musicxml "${s}" should be MusicXML written out, or a .musicxml/.xml file beside the set (anything else is read as MusicXML and has no notes)`);
            else if (!fileThere(s)) out.push(`${at}: its file "${s}" is not beside the set`);
          }
        }
      }
    }
  }
  // Rhythm sets (2026-10-16): "generate" (checked by the app's own reader of it, which refuses with the reason) or
  // MusicXML items; "generate" on any other kind, and the fields a rhythm set has no use for, refused.
  if (f.kind === 'rhythm') {
    if (f.generate !== undefined) { try { readRhythmSpec(f.generate); } catch (e) { out.push(e.message); } }
    if ((f.generate === undefined) === (f.items === undefined)) out.push('a rhythm set gives either "generate" or MusicXML "items"');
    if (isObj(f.items)) for (const [k, it] of Object.entries(f.items)) if (isObj(it) && it.musicxml === undefined) out.push(`item "${k}": a rhythm set's items are MusicXML patterns ("musicxml")`);
    for (const k of ['from', 'rhythm', 'play']) if (f[k] !== undefined) out.push(`a rhythm set has no "${k}"`);
    if (f.generate !== undefined && f.order !== undefined) out.push('a generated rhythm set is always a pool: leave "order" out');
  } else if (f.generate !== undefined) out.push('"generate" is for rhythm sets (kind "rhythm")');
  // "Find it" sets (2026-10-16, after the walk-through): "find" only, read by the app's own reader of it.
  if (f.kind === 'find') {
    if (f.find === undefined) out.push('a "find" set needs "find": { keys, groups, places }');
    else { try { readFindSpec(f.find); } catch (e) { out.push(e.message); } }
    for (const k of ['items', 'from', 'generate', 'rhythm', 'play', 'order']) if (f[k] !== undefined) out.push(`a "find" set has no "${k}"`);
  } else if (f.find !== undefined) out.push('"find" is for "find" sets (kind "find")');
  // The letters view (2026-10-17): "letters" only; not on a rhythm or find set; its cards MusicXML or bars of a piece (written rhythm).
  // The fingers view (2026-10-17): its cards notes one after another, a finger 1–5 for each ("/" between phrases), a hand.
  if (f.view !== undefined) {
    if (f.view !== 'letters' && f.view !== 'fingers') out.push(`view ${JSON.stringify(f.view)} should be "letters" or "fingers"`);
    if (f.kind === 'rhythm' || f.kind === 'find') out.push(`a ${f.kind} set has no "view"`);
    if (f.play !== undefined) out.push(`a ${f.view} set has no "play" (it is played in Drills)`);
    if (f.view === 'letters' && isObj(f.items)) for (const [k, it] of Object.entries(f.items)) if (isObj(it) && it.musicxml === undefined) out.push(`item "${k}": a letters card needs written rhythm (MusicXML)`);
    if (f.view === 'fingers') {
      for (const k of ['from', 'rhythm']) if (f[k] !== undefined) out.push(`a fingers set has no "${k}"`);
      if (isObj(f.items)) for (const [k, it] of Object.entries(f.items)) {
        if (!isObj(it)) continue;
        const notes = typeof it.notes === 'string' ? it.notes.split(',').map((p) => p.trim()) : null;
        const fingers = typeof it.fingers === 'string' ? it.fingers.split('/').map((p) => p.trim().split(/\s+/)) : null;
        if (!notes || notes.some((p) => !PITCH.test(p))) out.push(`item "${k}": a finger-number card's notes are single pitches one after another, "E4, D4, C4"`);
        if (!fingers || fingers.some((p) => !p.length || p.some((x) => !/^[1-5]$/.test(x)))) out.push(`item "${k}": fingers should be fingers 1 to 5 by phrase, "3 2 1 / 2 3"`);
        else if (notes && fingers.flat().length !== notes.length) out.push(`item "${k}": ${fingers.flat().length} fingers for ${notes.length} notes`);
        if (it.hand !== 'right' && it.hand !== 'left') out.push(`item "${k}": hand should be "right" or "left"`);
      }
    }
  } else if (isObj(f.items) && Object.values(f.items).some((it) => isObj(it) && (it.fingers !== undefined || it.hand !== undefined))) out.push('"fingers" and "hand" are for finger-number cards (view "fingers")');
  if (f.from !== undefined) {
    if (!isObj(f.from)) out.push('from should be an object { score, bars, staff }');
    else {
      for (const k of Object.keys(f.from)) if (!['score', 'bars', 'staff'].includes(k)) out.push(`from has "${k}", which is not one of score, bars, staff`);
      if (!text(f.from.score)) out.push('from needs "score", a piece id from scores/index.json');
      else if (!bars(f.from.score)) out.push(`from.score "${f.from.score}" is not in scores/index.json`);
      if (f.from.bars !== undefined && typeof f.from.bars !== 'string') out.push('from.bars should be text like "5-8"');
      const m = /^(\d+)(?:-(\d+))?$/.exec(f.from.bars ?? '1-4');
      if (m && text(f.from.score) && bars(f.from.score) && Number(m[2] ?? m[1]) > bars(f.from.score)) out.push(`from.bars "${f.from.bars ?? '1-4'}" go past the piece's ${bars(f.from.score)} bars`);
      if (f.from.staff !== undefined && !(Number.isInteger(f.from.staff) && f.from.staff >= 1)) out.push('from.staff should be a whole number, 1 or more');
    }
  }
  return out;
}
const setDir = 'content/sets';
const setIndex = json(`${setDir}/index.json`);
const scoreBars = (id) => { const p = namedPieces().barsOf(id); return p && !id.startsWith('u-') ? p.bars : null; };
{
  const inFolder = readdirSync(pub(setDir)).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();
  ok('sets: every set file is in index.json and every listed one is there', JSON.stringify(inFolder) === JSON.stringify([...setIndex].sort()), `folder ${inFolder}; index ${setIndex}`);
  const there = (f) => existsSync(pub(`${setDir}/${f}`));
  for (const f of setIndex) {
    let file;
    try { file = json(`${setDir}/${f}`); } catch (e) { ok(`set ${f} is JSON`, false, e.message); continue; }
    const p = setProblems(file, there, scoreBars);
    ok(`set ${f}: items and from as §6 says`, !p.length, p.join('; '));
    // The reader itself, where Node can run it (MusicXML needs the browser's DOMParser: those are read in the browser).
    const xml = file.from || Object.values(file.items ?? {}).some((it) => it?.musicxml !== undefined);
    if (!xml && !p.length) {
      try { const s = await readSet(f.replace(/\.json$/, ''), file, 'file:///x/', async () => '', async () => ''); ok(`set ${f} reads (${s.items.length} items)`, s.items.length > 0, 'no items'); }
      catch (e) { ok(`set ${f} reads`, false, e.message); }
    }
  }
  const bad = (f) => setProblems({ title: 't', ...f }, () => true, scoreBars);
  refuses('a chord octave that is not a whole number (it hangs the app)', bad({ items: { 1: { chord: 'C', octave: 'five' } } }), /octave "five" should be a whole number/);
  // The app's own reader (interfaces review F1, fixed 2026-10-15): a chord octave that is not a whole number 0 to 7 is
  // refused with its reason. Run in a child process with a time limit, since the bug was a loop that never ended.
  for (const octave of ['five', 4.5, 10, -1]) {
    const code = `import { readSet } from ${JSON.stringify(new URL('../src/exercise/items.ts', import.meta.url).href)};
      try { await readSet('t', { title: 't', items: { 1: { chord: 'C', octave: ${JSON.stringify(octave)} } } }, 'file:///x/', async () => '', async () => ''); console.log('ACCEPTED'); }
      catch (e) { console.log('REFUSED ' + e.message); }`;
    const r = spawnSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', code], { timeout: 8000, encoding: 'utf8' });
    const said = (r.stdout ?? '').trim();
    ok(`reader refuses a chord octave of ${JSON.stringify(octave)} with its reason, and returns`, r.error === undefined && r.status === 0 && /^REFUSED item 1: octave .* should be a whole number 0 to 7/.test(said), r.error ? `${r.error.code} (it never returned)` : said || r.stderr);
  }
  refuses('an option of another kind (octave on notes)', bad({ items: { 1: { notes: 'C4', octave: 5 } } }), /"octave" is not an option of a notes item/);
  // Rhythm sets (2026-10-16).
  const rhythm = (generate) => bad({ kind: 'rhythm', generate });
  refuses('rhythm: an unknown note value', rhythm({ values: ['quarter', 'sixteenth'], meter: '4/4', bars: 2 }), /"sixteenth" is not one of/);
  refuses('rhythm: a whole in 3/4', rhythm({ values: ['quarter', 'whole'], meter: '3/4', bars: 2 }), /whole \(4 beats\) does not fit a bar of 3\/4/);
  refuses('rhythm: a feature not in its values', rhythm({ values: ['quarter', 'half'], meter: '4/4', bars: 2, feature: 'whole' }), /feature "whole" should be one of its values/);
  refuses('rhythm: bars 0', rhythm({ values: ['quarter'], meter: '4/4', bars: 0 }), /bars 0 should be a whole number 1 to 4/);
  refuses('rhythm: bars 5', rhythm({ values: ['quarter'], meter: '4/4', bars: 5 }), /bars 5 should be a whole number 1 to 4/);
  refuses('rhythm: "generate" on a set of another kind', bad({ kind: 'chords', generate: { values: ['quarter'], meter: '4/4', bars: 2 } }), /"generate" is for rhythm sets/);
  refuses('rhythm: a notes item in a rhythm set', bad({ kind: 'rhythm', items: { 1: { notes: 'C4' } } }), /items are MusicXML patterns/);
  refuses('rhythm: "rhythm" on a rhythm set', bad({ kind: 'rhythm', rhythm: 1, generate: { values: ['quarter'], meter: '4/4', bars: 2 } }), /a rhythm set has no "rhythm"/);
  // "Find it" sets (2026-10-16).
  refuses('find: "find" on a set of another kind', bad({ kind: 'chords', items: { 1: { notes: 'C4' } }, find: { keys: 'C3-B4', groups: ['two'], places: ['any'] } }), /"find" is for "find" sets/);
  refuses('find: items on a find set', bad({ kind: 'find', find: { keys: 'C3-B4', groups: ['two'], places: ['any'] }, items: { 1: { notes: 'C4' } } }), /a "find" set has no "items"/);
  refuses('find: a place that is not one', bad({ kind: 'find', find: { keys: 'C3-B4', groups: ['two'], places: ['left'] } }), /"left" is not one of/);
  refuses('find: no "find"', bad({ kind: 'find' }), /needs "find"/);
  refuses('letters: a view that is not one', bad({ view: 'staff', items: { 1: { musicxml: '<note/>' } } }), /should be "letters"/);
  refuses('letters: a notes item (no written rhythm)', bad({ view: 'letters', items: { 1: { notes: 'E4, D4' } } }), /needs written rhythm/);
  refuses('fingers: a card with one finger too many', bad({ view: 'fingers', items: { 1: { notes: 'E4, D4', fingers: '3 2 1', hand: 'right' } } }), /3 fingers for 2 notes/);
  refuses('fingers: a card with no hand', bad({ view: 'fingers', items: { 1: { notes: 'E4, D4', fingers: '3 2' } } }), /hand should be "right" or "left"/);
  refuses('fingers: a chord on a card', bad({ view: 'fingers', items: { 1: { notes: 'E4 G4, D4', fingers: '3 2', hand: 'right' } } }), /single pitches/);
  refuses('fingers: "fingers" on a set without the view', bad({ items: { 1: { notes: 'E4', fingers: '3', hand: 'right' } } }), /are for finger-number cards/);
  refuses('letters: on a rhythm set', bad({ kind: 'rhythm', view: 'letters', generate: { values: ['quarter'], meter: '4/4', bars: 1 } }), /has no "view"/);
  refuses('together as text', bad({ items: { 1: { interval: 'M3', together: 'false' } } }), /together should be true or false/);
  refuses('arpeggio as text', bad({ items: { 1: { chord: 'C', arpeggio: 'yes' } } }), /arpeggio should be true or false/);
  refuses('no items', bad({ items: {} }), /items is empty/);
  refuses('items as a list', bad({ items: [{ notes: 'C4' }] }), /not a list/);
  refuses('an item not numbered', bad({ items: { a: { notes: 'C4' } } }), /numbered 1, 2/);
  refuses('a name that is not text', bad({ items: { 1: { notes: 'C4', name: 5 } } }), /name should be some text/);
  refuses('a pitch that is not one', bad({ items: { 1: { notes: 'C4 H4' } } }), /notes should be pitches/);
  refuses('a chord Tonal does not read', bad({ items: { 1: { chord: 'Hmaj' } } }), /chord "Hmaj" is not a chord symbol/);
  refuses('a MusicXML item naming an .mxl', bad({ items: { 1: { musicxml: 'x.mxl' } } }), /should be MusicXML written out, or a \.musicxml/);
  refuses('a passage with a misspelt field', bad({ from: { score: 'mozart-k2', bar: '5-8' } }), /from has "bar"/);
  refuses('a passage with no score', bad({ from: { bars: '1-2' } }), /from needs "score"/);
  refuses('a passage of a score not in the list', bad({ from: { score: 'nope' } }), /not in scores\/index.json/);
  refuses('a passage past the piece\'s end', bad({ from: { score: 'mozart-k2', bars: '1-400' } }), /go past the piece/);
  refuses('a passage staff as text', bad({ from: { score: 'mozart-k2', staff: '2' } }), /staff should be a whole number/);
}

// ---- the lab: public/content/lab (docs §5b) ----------------------------------------------------------------------------
const SOUNDS = new Set(['piano', ...Array.from({ length: 128 }, (_, p) => soundOf(p))]);
const STEP_WORDS = ['kind', 'name', 'detail', 'doing'];
function ladderWords(steps, at) {
  const out = [];
  for (const [role, list] of Object.entries(steps ?? {})) if (Array.isArray(list)) for (const x of list) {
    if (isObj(x)) for (const k of Object.keys(x)) if (!STEP_WORDS.includes(k)) out.push(`${at}.${role}: a step has "${k}", which is not one of ${STEP_WORDS.join(', ')}`);
  }
  return out;
}
/** What readChart lets through but the format does not allow (F5 in the notes). */
function chartProblems(f, styleMeters) {
  const out = [];
  if (!isObj(f)) return ['a chart should be an object'];
  if (Array.isArray(f.bars) && f.bars.some((b) => typeof b !== 'string')) out.push('bars should be chord symbols as text ("C7", "F7 G7")');
  if (f.improvise !== undefined) {
    if (!isObj(f.improvise)) out.push('improvise should be an object { "scale": … }');
    else for (const k of Object.keys(f.improvise)) if (k !== 'scale') out.push(`improvise has "${k}", which is not scale`);
    if (isObj(f.improvise) && f.improvise.scale !== undefined && (typeof f.improvise.scale !== 'string' || Scale.get(f.improvise.scale).empty)) out.push(`improvise.scale "${f.improvise.scale}" is not a Tonal scale name`);
  }
  if (f.steps !== undefined) {
    if (!isObj(f.steps)) out.push('steps should be an object { accompaniment, lead }');
    else for (const k of Object.keys(f.steps)) if (!['accompaniment', 'lead'].includes(k)) out.push(`steps has "${k}", which is not accompaniment or lead`);
    out.push(...ladderWords(f.steps, 'steps'));
  }
  if (f.style !== undefined && typeof f.style !== 'string') out.push('style should be a style\'s id (its file name)');
  if (typeof f.style === 'string' && styleMeters && !styleMeters.has(f.style)) out.push(`style "${f.style}" is not one of the lab's styles`);
  else if (typeof f.style === 'string' && styleMeters && styleMeters.get(f.style) !== (f.meter ?? '4/4')) out.push(`style "${f.style}" is in ${styleMeters.get(f.style)}, the chart in ${f.meter ?? '4/4'}`);
  if (f.meter !== undefined && !/^[1-9]\d*\/(1|2|4|8|16)$/.test(String(f.meter))) out.push(`meter "${f.meter}" should be like 4/4, 3/4 or 6/8`);
  return out;
}
/** What readStyle lets through but the format does not allow (F5). */
function styleProblems(f) {
  const out = [];
  if (!isObj(f)) return ['a style should be an object'];
  if (f.instruments !== undefined) {
    if (!isObj(f.instruments)) out.push('instruments should be an object { bass, chords }');
    else for (const [k, v] of Object.entries(f.instruments)) {
      if (!['bass', 'chords'].includes(k)) out.push(`instruments has "${k}", which is not bass or chords`);
      else if (!SOUNDS.has(v)) out.push(`instruments.${k} "${v}" is not a FluidR3 General MIDI sound name (or piano)`);
    }
  }
  if (isObj(f.drums)) for (const [k, v] of Object.entries(f.drums)) if (typeof v !== 'string') out.push(`drums.${k} should be a pattern as text`);
  if (f.meter !== undefined && !/^[1-9]\d*\/(1|2|4|8|16)$/.test(String(f.meter))) out.push(`meter "${f.meter}" should be like 4/4, 3/4 or 6/8`);
  return out;
}
{
  const lab = json('content/lab/index.json');
  ok('lab index: { charts, styles }, lists of paths in the lab folder', isObj(lab) && Object.keys(lab).sort().join() === 'charts,styles' && [...lab.charts, ...lab.styles].every((p) => existsSync(pub(`content/lab/${p}`))), JSON.stringify(lab));
  for (const kind of ['charts', 'styles']) {
    const inFolder = readdirSync(pub(`content/lab/${kind}`)).filter((f) => f.endsWith('.json')).map((f) => `${kind}/${f}`).sort();
    ok(`lab: every ${kind} file is in the index and every listed one is there`, JSON.stringify(inFolder) === JSON.stringify([...lab[kind]].sort()), `folder ${inFolder}; index ${lab[kind]}`);
  }
  const id = (p) => p.replace(/^.*\/|\.json$/g, '');
  const meters = new Map();
  for (const p of lab.styles) {
    const f = json(`content/lab/${p}`);
    try { const s = readStyle(id(p), f); meters.set(s.id, `${s.meter.beats}/${s.meter.beatType}`); ok(`style ${p} reads`, true); } catch (e) { ok(`style ${p} reads`, false, e.message); }
    const pr = styleProblems(f);
    ok(`style ${p}: instruments and patterns as §5b says`, !pr.length, pr.join('; '));
  }
  for (const p of lab.charts) {
    const f = json(`content/lab/${p}`);
    try { readChart(id(p), f); ok(`chart ${p} reads`, true); } catch (e) { ok(`chart ${p} reads`, false, e.message); }
    const pr = chartProblems(f, meters);
    ok(`chart ${p}: improvise, steps and style as §5b says`, !pr.length, pr.join('; '));
  }
  refuses('a chart\'s improvise with a misspelt field', chartProblems({ title: 't', bars: ['C'], improvise: { scales: 'C blues' } }), /improvise has "scales"/);
  refuses('a chart\'s steps with a misspelt role', chartProblems({ title: 't', bars: ['C'], steps: { accomp: ['roots'] } }), /steps has "accomp"/);
  refuses('a ladder step\'s misspelt words', chartProblems({ title: 't', bars: ['C'], steps: { accompaniment: [{ kind: 'roots', nmae: 'x' }] } }), /a step has "nmae"/);
  refuses('a chart\'s bar that is not text', chartProblems({ title: 't', bars: [5] }), /bars should be chord symbols as text/);
  refuses('a chart naming a style that is not there', chartProblems({ title: 't', bars: ['C'], style: 'swing' }, meters), /style "swing" is not one/);
  refuses('a chart in another metre than its style', chartProblems({ title: 't', bars: ['C'], style: 'shuffle', meter: '3/4' }, meters), /is in 4\/4, the chart in 3\/4/);
  refuses('a metre "4/0"', chartProblems({ title: 't', bars: ['C'], meter: '4/0' }), /should be like 4\/4/);
  refuses('a style\'s instruments with a misspelt part', styleProblems({ name: 'n', instruments: { bas: 'acoustic_bass' } }), /instruments has "bas"/);
  refuses('a style instrument that is no sound', styleProblems({ name: 'n', instruments: { bass: 'fretless' } }), /"fretless" is not a FluidR3/);
  refuses('a drum pattern that is not text', styleProblems({ name: 'n', drums: { kick: 5 } }), /drums.kick should be a pattern/);
  ok('the sounds kept in the app for offline are FluidR3 names (docs §5b lists them)', BUNDLED_PARTS.every((b) => SOUNDS.has(b)), BUNDLED_PARTS.join(', '));
}

// ---- the catalogue index's header (built by web/tools/catalogue; read by library/catalogue.ts) -----------------------
const CAT_FIELDS = ['id', 'file', 'title', 'composer', 'kind', 'fifths', 'mode', 'keyChanges', 'time', 'timeChanges', 'bars', 'low', 'high', 'chords', 'views', 'group', 'licence', 'bytes'];
function catalogueProblems(c, fileThere) {
  if (!isObj(c)) return ['the catalogue index should be an object'];
  const out = [];
  for (const k of ['version', 'fields', 'rows']) if (c[k] === undefined) out.push(`it needs "${k}"`);
  if (!Array.isArray(c.fields) || !Array.isArray(c.rows)) return [...out, 'fields and rows should be lists'];
  const missing = CAT_FIELDS.filter((f) => !c.fields.includes(f));
  if (missing.length) out.push(`fields lacks ${missing.join(', ')} (catalogue.ts reads them)`);
  const at = (n) => c.fields.indexOf(n), seen = new Set();
  c.rows.forEach((r, i) => {
    if (!Array.isArray(r) || r.length !== c.fields.length) { out.push(`row ${i + 1} should have ${c.fields.length} values`); return; }
    const id = r[at('id')];
    if (!/^[0-9a-f]{12}$/.test(id)) out.push(`row ${i + 1}: id "${id}" should be 12 hex digits (the start of its file's SHA-256)`);
    if (seen.has(id)) out.push(`row ${i + 1}: id "${id}" twice`);
    seen.add(id);
    if (!['piano', 'lead'].includes(r[at('kind')])) out.push(`row ${i + 1}: kind "${r[at('kind')]}" should be piano or lead`);
    if (!Number.isInteger(r[at('bars')]) || r[at('bars')] < 1) out.push(`row ${i + 1}: bars should be a whole number`);
    if (fileThere && !fileThere(r[at('file')])) out.push(`row ${i + 1}: file "${r[at('file')]}" is not in public/catalogue`);
  });
  return out;
}
if (existsSync(pub('catalogue/index.json'))) {
  const cat = json('catalogue/index.json'), files = new Set(readdirSync(pub('catalogue')));
  const p = catalogueProblems(cat, (f) => files.has(f));
  ok(`catalogue/index.json: ${cat.rows.length} files in ${new Set(cat.rows.map((r) => r[cat.fields.indexOf('group')])).size} pieces, every field catalogue.ts reads, every file there`, !p.length, p.slice(0, 5).join('; '));
  refuses('a catalogue row one value short', catalogueProblems({ version: 'v', fields: CAT_FIELDS, rows: [CAT_FIELDS.slice(1)] }), /should have 18 values/);
  refuses('a catalogue index without a field catalogue.ts reads', catalogueProblems({ version: 'v', fields: CAT_FIELDS.filter((f) => f !== 'bars'), rows: [] }), /lacks bars/);
} else ok('no catalogue in this build (nothing to check)', true);

// ---- How the app works: src/help/help.md (docs §7d), read with the app's own reader; every section the app opens is there.
{
  const why = (f) => { try { f(); return ''; } catch (e) { return e instanceof Error ? e.message : String(e); } };
  let sections = [];
  const problem = why(() => { sections = readHelp(readFileSync(new URL('../src/help/help.md', import.meta.url), 'utf8')); });
  const missing = HELP_IDS.filter((id) => !sections.some((s) => s.id === id));
  ok(`src/help/help.md: ${sections.length} sections read, every one the app opens there (${HELP_IDS.join(', ')})`, !problem && !missing.length, problem || `missing: ${missing.join(', ')}`);
  // Every "How this screen works" in index.html names a section the reader has.
  const named = [...readFileSync(new URL('../index.html', import.meta.url), 'utf8').matchAll(/data-help="([^"]+)"/g)].map((m) => m[1]);
  ok(`index.html: its ${named.length} "How this screen works" buttons each name a section`, named.length > 0 && named.every((id) => HELP_IDS.includes(id)), named.join(', '));
  const lines = (...ls) => ls.join('\n');
  refuses('help text before the first section', [why(() => readHelp(lines('hello', '# Home {#home}', 'Text.')))], /before the first section/);
  refuses('a help section with no id', [why(() => readHelp(lines('# Home', 'Text.')))], /ends with its id/);
  refuses('a help id used twice', [why(() => readHelp(lines('# A {#a}', 'One.', '# B {#a}', 'Two.')))], /used twice/);
  refuses('HTML in help text', [why(() => readHelp(lines('# A {#a}', '<b>no</b>')))], /HTML/);
  refuses('an empty help section', [why(() => readHelp(lines('# A {#a}', '', '# B {#b}', 'Text.')))], /empty/);
}

console.log(failed ? `${failed} of ${ran} failed` : `all ${ran} passed`);
process.exit(failed ? 1 : 0);
