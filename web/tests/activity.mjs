// The activity format (src/activity.ts): every activity in public/content/activities reads, and mistakes are refused
// with the reason rather than guessed (owner, 2026-10-13). Run: npm run check:activity.
import { readFileSync, readdirSync } from 'node:fs';
import { readActivity } from '../src/activity.ts';
import { namedPieces } from './named-pieces.mjs';

const dir = new URL('../public/content/activities/', import.meta.url);
const pub = (p) => new URL(`../public/${p}`, import.meta.url);
let failed = 0, ran = 0;
const ok = (name, pass, got) => { ran++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : ` — ${got}`}`); if (!pass) failed++; };

const index = JSON.parse(readFileSync(new URL('index.json', dir), 'utf8'));
// A3: a file in the folder that the index leaves out is never offered (and never read by this check).
const inFolder = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();
ok('every activity file in the folder is in index.json, and every listed one is there', JSON.stringify(inFolder) === JSON.stringify([...index].sort()),
  `folder ${inFolder.join(', ')}; index ${index.join(', ')}`);

// A1: what each activity names exists in the build: its piece (and its bars inside it), set or chart. A piece is one of
// the app's scores or, by its "u-" id, a catalogue piece (owner, 2026-10-15; tests/named-pieces.mjs).
const named = namedPieces();
const sets = JSON.parse(readFileSync(pub('content/sets/index.json'), 'utf8'));
const charts = JSON.parse(readFileSync(pub('content/lab/index.json'), 'utf8')).charts;
const read = {};
// (2026-10-15, interfaces review) What the reader lets through: a title that is not text is replaced by the id
// (activity.ts:36), and a ladder step's misspelt words are ignored (lab/music.ts readLadder). Checked here for the files.
const STEP_WORDS = ['kind', 'name', 'detail', 'doing'];
function laxProblems(raw) {
  const out = [];
  if (raw.title !== undefined && !(typeof raw.title === 'string' && raw.title.trim())) out.push('title should be some text (the reader shows the id instead)');
  for (const [role, list] of Object.entries(raw.preset?.steps ?? {})) if (Array.isArray(list)) for (const x of list) {
    if (x && typeof x === 'object') for (const k of Object.keys(x)) if (!STEP_WORDS.includes(k)) out.push(`preset.steps.${role}: a step has "${k}", which is not one of ${STEP_WORDS.join(', ')}`);
  }
  return out;
}
for (const f of index) {
  let a, raw;
  try { raw = JSON.parse(readFileSync(new URL(f, dir), 'utf8')); a = readActivity(f.replace(/\.json$/, ''), raw); ok(`${f} reads (${a.screen})`, true); }
  catch (e) { ok(`${f} reads`, false, e.message); continue; }
  ok(`${f}: its title and ladder words as §8b says`, !laxProblems(raw).length, laxProblems(raw).join('; '));
  read[a.id] = a;
  if ('piece' in a) {
    ok(`${f}: its piece "${a.piece}" is in the scores or the catalogue`, !!named.barsOf(a.piece), named.problem(a.piece));
    if (named.barsOf(a.piece) && a.bars) ok(`${f}: bars ${a.bars.join('-')} are inside the piece`, !named.problem(a.piece, a.bars), named.problem(a.piece, a.bars));
  }
  if ('set' in a) ok(`${f}: its set "${a.set}" is in the sets`, sets.includes(`${a.set}.json`), `sets: ${sets.join(', ')}`);
  if ('chart' in a) ok(`${f}: its chart "${a.chart}" is in the Lab`, charts.includes(`charts/${a.chart}.json`), `charts: ${charts.join(', ')}`);
}

// A2: what an activity reads to, one of each kind that carries more than a name (not only that it does not throw).
const same = (got, want) => JSON.stringify(got) === JSON.stringify(want);
ok('reads to: a score activity\'s bars and settings', same([read['k2-wait-right']?.bars, read['k2-wait-right']?.settings], [[1, 4], { mode: 'wait', hands: 'right', tempo: 100 }]), JSON.stringify(read['k2-wait-right']));
ok('reads to: a memorise activity\'s settings', same(read['k2-memorise-right']?.settings, { hands: 'right', chunk: 2, learnedAfter: 2 }), JSON.stringify(read['k2-memorise-right']));
ok('reads to: a drill activity\'s level', same(read['melodies-drill']?.level, { rung: 3, onTime: 'normal', cards: 5 }), JSON.stringify(read['melodies-drill']));
ok('reads to: a Simon activity\'s level', same(read['chords-simon']?.level, { rung: 2, match: 'octave' }), JSON.stringify(read['chords-simon']));
ok('reads to: a Lab activity\'s role, step and ladder', read['blues-roots']?.preset?.role === 'accomp' && read['blues-roots']?.preset?.step === 'roots'
  && same(read['blues-roots']?.preset?.steps?.accompaniment?.map((x) => (typeof x === 'string' ? x : x.kind)), ['roots', 'beat1']), JSON.stringify(read['blues-roots']));

const refused = [
  ['an unknown screen', { screen: 'piano' }, /screen "piano" is not one of/],
  ['a score without its piece', { screen: 'score' }, /needs "piece"/],
  ['a typo in a setting', { screen: 'score', piece: 'x', settings: { hand: 'right' } }, /settings has "hand"/],
  ['a mode that is not one', { screen: 'score', piece: 'x', settings: { mode: 'fast' } }, /settings.mode is "fast"/],
  ['a tempo out of range', { screen: 'score', piece: 'x', settings: { tempo: 1000 } }, /20 to 300/],
  ['bars that end before they start', { screen: 'score', piece: 'x', bars: '8-5' }, /end before they start/],
  ['Ladder without bars', { screen: 'score', piece: 'x', settings: { mode: 'ladder' } }, /Ladder needs "bars"/],
  ['a chunk size Memorise does not have', { screen: 'memorise', piece: 'x', settings: { chunk: 3 } }, /settings.chunk is 3/],
  ['a drill level typo', { screen: 'drills', set: 's', level: { rungs: 2 } }, /level has "rungs"/],
  ['a lab step that is not a kind', { screen: 'lab', chart: 'c', preset: { step: 'jazz' } }, /preset.step is "jazz"/],
  ['a lab part typo', { screen: 'lab', chart: 'c', preset: { parts: { drum: true } } }, /preset.parts has "drum"/],
  // Review 2 (2026-10-13): these were accepted silently.
  ['a misspelt top-level field', { screen: 'score', piece: 'x', setting: { mode: 'wait' } }, /"setting" is not a field/],
  ['Memorise bars (not offered yet)', { screen: 'memorise', piece: 'x', bars: '1-4' }, /whole piece/],
  ['a misspelt ladder key', { screen: 'lab', chart: 'c', preset: { steps: { accomp: ['roots'] } } }, /preset.steps has "accomp"/],
  ['a ladder step of the wrong kind', { screen: 'lab', chart: 'c', preset: { steps: { lead: ['roots'] } } }, /lead step "roots"/],
  ['a step of the other part', { screen: 'lab', chart: 'c', preset: { role: 'lead', step: 'beat1' } }, /accompaniment step, but preset.role is "lead"/],
  ['a step not in its ladder', { screen: 'lab', chart: 'c', preset: { step: 'style', steps: { accompaniment: ['roots', 'beat1'] } } }, /not in its ladder/],
  ['a fraction of a card', { screen: 'drills', set: 's', level: { cards: 2.5 } }, /a whole number/],
  // Test review (2026-10-14, A4): four refusals no case reached.
  ['bars not written like "5-8"', { screen: 'score', piece: 'x', bars: '5 to 8' }, /should be like "5-8"/],
  ['settings that are not an object', { screen: 'score', piece: 'x', settings: 3 }, /settings should be an object/],
  ['a Simon level typo', { screen: 'simon', set: 's', level: { rungs: 2 } }, /level has "rungs"/],
  ['an empty piece', { screen: 'score', piece: '' }, /needs "piece"/],
];
for (const [name, raw, want] of [
  ['a title that is not text', { screen: 'freeplay', title: 5 }, /title should be some text/],
  ['a ladder step with misspelt words', { screen: 'lab', chart: 'c', preset: { steps: { accompaniment: [{ kind: 'roots', nmae: 'x' }] } } }, /a step has "nmae"/],
]) ok(`refused by the content check: ${name}`, laxProblems(raw).some((p) => want.test(p)), laxProblems(raw).join('; ') || 'accepted');
for (const [name, file, want] of refused) {
  try { readActivity('t', file); ok(`refused: ${name}`, false, 'it was accepted'); }
  catch (e) { ok(`refused: ${name}`, want.test(e.message), e.message); }
}

// A catalogue piece named by its "u-" id (owner, 2026-10-15): the reader takes it as any piece; this check finds it in the
// catalogue index and its bars inside the index's bar count. Refused: a u- id that is not there, bars past the end.
{
  const cat = 'u-de5f6a78874c'; // "Mary Had A Little Lamb" in the catalogue, 8 bars: the test lesson's piece
  const a = readActivity('t', { screen: 'score', piece: cat, bars: '1-4' });
  ok('a catalogue piece: a score activity naming it by its u- id reads, and the piece and bars 1-4 are found', a.piece === cat && same(a.bars, [1, 4]) && named.problem(cat, a.bars) === '', named.problem(cat, a.bars));
  ok('a catalogue piece: a memorise activity naming it reads, and it is found', readActivity('t', { screen: 'memorise', piece: cat }).piece === cat && !!named.barsOf(cat));
  ok('a catalogue piece: its bar count is the index\'s (8)', named.barsOf(cat)?.bars === 8 && named.barsOf(cat)?.from === 'the catalogue', JSON.stringify(named.barsOf(cat)));
  const unknown = named.problem('u-000000000000');
  ok('refused: a u- id in neither the scores nor the catalogue', /neither in public\/scores\/index.json nor in the catalogue/.test(unknown), unknown || 'accepted');
  const past = named.problem(cat, [5, 9]);
  ok('refused: bars past the end of a catalogue piece', /bars 5-9 are not inside "u-de5f6a78874c" \(it has 8 bars, from the catalogue\)/.test(past), past || 'accepted');
  const bare = named.problem('de5f6a78874c');
  ok('refused: a catalogue id without its "u-"', /is not a piece; the catalogue piece is named "u-de5f6a78874c"/.test(bare), bare || 'accepted');
}
console.log(failed ? `${failed} of ${ran} failed` : `all ${ran} passed`); // (a count: an empty index or a dropped case shows)
process.exit(failed ? 1 : 0);
