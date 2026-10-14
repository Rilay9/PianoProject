// The activity format (src/activity.ts): every activity in public/content/activities reads, and mistakes are refused
// with the reason rather than guessed (owner, 2026-10-13). Run: npm run check:activity.
import { readFileSync, readdirSync } from 'node:fs';
import { readActivity } from '../src/activity.ts';

const dir = new URL('../public/content/activities/', import.meta.url);
const pub = (p) => new URL(`../public/${p}`, import.meta.url);
let failed = 0, ran = 0;
const ok = (name, pass, got) => { ran++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : ` — ${got}`}`); if (!pass) failed++; };

const index = JSON.parse(readFileSync(new URL('index.json', dir), 'utf8'));
// A3: a file in the folder that the index leaves out is never offered (and never read by this check).
const inFolder = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json').sort();
ok('every activity file in the folder is in index.json, and every listed one is there', JSON.stringify(inFolder) === JSON.stringify([...index].sort()),
  `folder ${inFolder.join(', ')}; index ${index.join(', ')}`);

// A1: what each activity names exists in the build: its piece (and its bars inside it), set or chart.
const pieces = new Map(JSON.parse(readFileSync(pub('scores/index.json'), 'utf8')).map((p) => [p.id, p.file]));
const sets = JSON.parse(readFileSync(pub('content/sets/index.json'), 'utf8'));
const charts = JSON.parse(readFileSync(pub('content/lab/index.json'), 'utf8')).charts;
const printedBars = (file) => {
  const numbers = [...readFileSync(pub(`scores/${file}`), 'utf8').matchAll(/<measure\b[^>]*\bnumber="(\d+)"/g)].map((m) => Number(m[1]));
  return numbers.length ? Math.max(...numbers) : 0;
};
const read = {};
for (const f of index) {
  let a;
  try { a = readActivity(f.replace(/\.json$/, ''), JSON.parse(readFileSync(new URL(f, dir), 'utf8'))); ok(`${f} reads (${a.screen})`, true); }
  catch (e) { ok(`${f} reads`, false, e.message); continue; }
  read[a.id] = a;
  if ('piece' in a) {
    const file = pieces.get(a.piece);
    ok(`${f}: its piece "${a.piece}" is in the scores`, !!file, 'not in public/scores/index.json');
    if (file && a.bars) ok(`${f}: bars ${a.bars.join('-')} are inside the piece`, a.bars[0] >= 1 && a.bars[1] <= printedBars(file), `the piece has ${printedBars(file)} bars`);
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
for (const [name, file, want] of refused) {
  try { readActivity('t', file); ok(`refused: ${name}`, false, 'it was accepted'); }
  catch (e) { ok(`refused: ${name}`, want.test(e.message), e.message); }
}
console.log(failed ? `${failed} of ${ran} failed` : `all ${ran} passed`); // (a count: an empty index or a dropped case shows)
process.exit(failed ? 1 : 0);
