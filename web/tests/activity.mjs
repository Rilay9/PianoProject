// The activity format (src/activity.ts): every activity in public/content/activities reads, and mistakes are refused
// with the reason rather than guessed (owner, 2026-10-13). Run: npm run check:activity.
import { readFileSync, readdirSync } from 'node:fs';
import { readActivity, fingerOn } from '../src/activity.ts';
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
/** A rhythm set (2026-10-16) played where it cannot be: Simon (it has no rhythm), or Drills at rung 4 or "notes only" (the
 * screen plays these as rung 3 and normal timing; a step asking for them is a mistake). '' when fine. */
const rhythmMisuse = (a) => {
  if (!('set' in a) || !sets.includes(`${a.set}.json`)) return '';
  if (JSON.parse(readFileSync(pub(`content/sets/${a.set}.json`), 'utf8')).kind !== 'rhythm') return '';
  if (a.screen === 'simon') return `set "${a.set}" is a rhythm set: Drills only (Simon has no rhythm)`;
  if (a.level?.rung === 4) return `set "${a.set}" is a rhythm set: no rung 4 (name only)`;
  if (a.level?.onTime === 'notes') return `set "${a.set}" is a rhythm set: no "notes only"`;
  return '';
};
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
  if ('set' in a) ok(`${f}: a rhythm set only in Drills, not at rung 4 or notes only`, !rhythmMisuse(a), rhythmMisuse(a));
  if ('chart' in a) ok(`${f}: its chart "${a.chart}" is in the Lab`, charts.includes(`charts/${a.chart}.json`), `charts: ${charts.join(', ')}`);
}

for (const [what, a, want] of [
  ['a rhythm set in Simon', { screen: 'simon', set: 'rhythm-quarter-half', level: {} }, /Drills only/],
  ['a rhythm set at rung 4', { screen: 'drills', set: 'rhythm-quarter-half', level: { rung: 4 } }, /no rung 4/],
  ['a rhythm set judged on notes only', { screen: 'drills', set: 'rhythm-whole', level: { onTime: 'notes' } }, /no "notes only"/],
]) ok(`refused by the content check: ${what}`, want.test(rhythmMisuse(a)), rhythmMisuse(a) || 'accepted');
ok('a rhythm set in Drills at rung 3 is fine', rhythmMisuse({ screen: 'drills', set: 'rhythm-whole', level: { rung: 3 } }) === '', rhythmMisuse({ screen: 'drills', set: 'rhythm-whole', level: { rung: 3 } }));

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
  // (2026-10-16, owner's answers after the lesson 1 comparison: Free play's names, Simon's goal)
  ['Free play names that are not true or false', { screen: 'freeplay', names: 'no' }, /names "no" should be true or false/],
  ['Drills names that are not true or false', { screen: 'drills', set: 's', names: 'false' }, /names "false" should be true or false/],
  ['a Simon goal of 0', { screen: 'simon', set: 'x', level: { goal: 0 } }, /goal/],
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
{
  // (2026-10-16, after the walk-through) fingers per pitch in every octave or per key; Free play's groups off and its click
  const fg = readActivity('t', { screen: 'freeplay', fingers: { 'C#': 2, 'D#': 3, 'F#4': 1 }, groups: false, click: { bpm: 72 } });
  ok('fingers, groups and click read: C# 2 in every octave, F#4 1 on that key only; groups off; the click at 72 in 4', fingerOn(fg.fingers, 49) === 2 && fingerOn(fg.fingers, 73) === 2 && fingerOn(fg.fingers, 66) === 1 && fingerOn(fg.fingers, 54) === undefined && fg.groups === false && fg.click.bpm === 72 && fg.click.beats === 4
    && readActivity('t', { screen: 'drills', set: 's', fingers: { Bb: 4 } }).fingers.pc[10] === 4 && readActivity('t', { screen: 'freeplay' }).groups === undefined, JSON.stringify(fg));
  const fp = readActivity('t', { screen: 'freeplay', names: false }), sm = readActivity('t', { screen: 'simon', set: 'x', level: { goal: 3 } });
  ok('Free play names: false reads (no note names until taught), and Simon goal: 3 (the game ends at a chain of 3)', fp.names === false && sm.level.goal === 3, JSON.stringify({ fp, sm }));
  // (the consistency pass, 2026-10-16: names: false on any activity, honoured on every screen that names notes)
  const every = [{ screen: 'score', piece: 'x' }, { screen: 'memorise', piece: 'x' }, { screen: 'simon', set: 's' }, { screen: 'drills', set: 's' }, { screen: 'lab', chart: 'c' }, { screen: 'freeplay' }]
    .map((raw) => readActivity('t', { ...raw, names: false }));
  ok('names: false reads on every screen (score, Memorise, Simon, Drills, the lab, Free play); left out, names show', every.every((a) => a.names === false) && readActivity('t', { screen: 'drills', set: 's' }).names === undefined, JSON.stringify(every.map((a) => [a.screen, a.names])));
}
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
// Lesson 1 (2026-10-16): the "keys, no music" help rung (0: heard, its keys lit, no staff), named by Simon and Drills
// activities; and the keys an activity chooses for the on-screen keyboard, one range or per kind of screen.
{
  const simon0 = (() => { try { return readActivity('t', { screen: 'simon', set: 's', level: { rung: 0 } }); } catch (e) { return e.message; } })();
  const drills0 = (() => { try { return readActivity('t', { screen: 'drills', set: 's', level: { rung: 0 } }); } catch (e) { return e.message; } })();
  ok('help rung 0 ("keys, no music"): a Simon and a Drills activity name it and it reads as 0', simon0?.level?.rung === 0 && drills0?.level?.rung === 0, JSON.stringify([simon0, drills0]));
  ok('help rungs 1–5 still read as themselves (saved levels and logs keep their meaning)', [1, 2, 3, 4, 5].every((r) => readActivity('t', { screen: 'simon', set: 's', level: { rung: r } }).level.rung === r));
  const all = { 'phone-upright': { lo: 60, hi: 76 }, 'phone-sideways': { lo: 60, hi: 76 }, tablet: { lo: 60, hi: 76 } };
  const fp = (() => { try { return readActivity('t', { screen: 'freeplay', keys: 'C4-E5' }).keys; } catch (e) { return e.message; } })();
  ok('keys: one range ("C4-E5") is that range on every kind of screen', same(fp, all), JSON.stringify(fp));
  const per = (() => { try { return readActivity('t', { screen: 'simon', set: 's', level: { rung: 0 }, keys: { 'phone-upright': 'C4-B4', tablet: 'C3-B5' } }).keys; } catch (e) { return e.message; } })();
  ok('keys: per kind of screen, only those given (the others keep the screen’s own keys)', same(per, { 'phone-upright': { lo: 60, hi: 71 }, tablet: { lo: 48, hi: 83 } }), JSON.stringify(per));
  const sc = (() => { try { return readActivity('t', { screen: 'score', piece: 'x', settings: { mode: 'wait' }, keys: 'A3-C5' }).keys; } catch (e) { return e.message; } })();
  const dr = (() => { try { return readActivity('t', { screen: 'drills', set: 's', keys: 'F3-G4' }).keys; } catch (e) { return e.message; } })();
  ok('keys: a score (Wait for me) and a Drills activity take them too', sc?.tablet?.lo === 57 && sc?.tablet?.hi === 72 && dr?.['phone-upright']?.lo === 53, JSON.stringify([sc, dr]));
  const { keysToShow } = await import('../src/activity.ts');
  const lesson1 = { 'phone-upright': { lo: 60, hi: 71 } };
  ok('keys shown: C4–B4 with the black keys of that octave is exactly C4–B4', same(keysToShow(lesson1, 'phone-upright', [61, 63, 66, 68, 70]), { lo: 60, hi: 71 }));
  ok('keys shown: grown only as far as a note outside them, to the next white key (C♯5 → up to D5)', same(keysToShow(lesson1, 'phone-upright', [61, 73]), { lo: 60, hi: 74 }), JSON.stringify(keysToShow(lesson1, 'phone-upright', [61, 73])));
  ok('keys shown: grown downwards too (A♯3 → from A3)', same(keysToShow(lesson1, 'phone-upright', [58, 64]), { lo: 57, hi: 71 }));
  ok('keys shown: none chosen for this screen, none (the screen’s own keys)', keysToShow(lesson1, 'tablet', [61]) === null && keysToShow(null, 'phone-upright', [61]) === null);
  for (const [name, raw, want] of [
    ['help rung 6', { screen: 'simon', set: 's', level: { rung: 6 } }, /level.rung is 6/],
    ['help rung -1', { screen: 'drills', set: 's', level: { rung: -1 } }, /level.rung is -1/],
    ['help rung "keys" (a word, not the number 0)', { screen: 'simon', set: 's', level: { rung: 'keys' } }, /level.rung is "keys"/],
    ['keys not a range', { screen: 'freeplay', keys: 'C4' }, /should be a range of keys like "C4-E5"/],
    ['keys with a note that is not one', { screen: 'freeplay', keys: 'H4-C5' }, /should be a range of keys/],
    ['keys high to low', { screen: 'freeplay', keys: 'E5-C4' }, /from lower to higher/],
    ['keys of one key', { screen: 'freeplay', keys: 'C4-C4' }, /from lower to higher/],
    ['keys off the piano', { screen: 'freeplay', keys: 'C0-C4' }, /off the piano's keys/],
    ['keys ending on a black key', { screen: 'freeplay', keys: 'C4-C#5' }, /black key/],
    ['keys for a screen that is not one', { screen: 'freeplay', keys: { phone: 'C4-E5' } }, /keys has "phone"/],
    ['keys for a screen with a bad range', { screen: 'simon', set: 's', keys: { tablet: 'C4-E' } }, /keys.tablet is "C4-E"/],
    ['keys empty', { screen: 'freeplay', keys: {} }, /keys is empty/],
    ['keys a number', { screen: 'freeplay', keys: 5 }, /keys should be a range/],
    ['keys on Memorise (not offered)', { screen: 'memorise', piece: 'x', keys: 'C4-E5' }, /"keys" is not a field of a memorise activity/],
    ['keys on the lab (not offered)', { screen: 'lab', chart: 'c', keys: 'C4-E5' }, /"keys" is not a field of a lab activity/],
    ['keys on a score in a mode whose keys do not play', { screen: 'score', piece: 'x', settings: { mode: 'along' }, keys: 'C4-E5' }, /keys are for Wait for me/],
    // After the beginner walk-through (2026-10-16): fingers, Free play's groups and click.
    ['fingers 6', { screen: 'freeplay', fingers: { 'C#': 6 } }, /fingers.C# is 6; it should be a finger, a whole number 1 to 5/],
    ['fingers on a note that is not one', { screen: 'drills', set: 's', fingers: { H: 2 } }, /fingers has "H"/],
    ['fingers empty', { screen: 'freeplay', fingers: {} }, /fingers should be like/],
    ['fingers on the score (not offered)', { screen: 'score', piece: 'x', fingers: { C: 1 } }, /"fingers" is not a field of a score activity/],
    ['groups as text', { screen: 'freeplay', groups: 'no' }, /groups "no" should be true or false/],
    ['groups on Simon (Free play only)', { screen: 'simon', set: 's', groups: false }, /"groups" is not a field of a simon activity/],
    ['click without its tempo', { screen: 'freeplay', click: { beats: 4 } }, /click needs "bpm"/],
    ['click at 400', { screen: 'freeplay', click: { bpm: 400 } }, /click.bpm is 400/],
    ['click with 8 beats', { screen: 'freeplay', click: { bpm: 72, beats: 8 } }, /click.beats is 8/],
    ['click misspelt', { screen: 'freeplay', click: { tempo: 72 } }, /click has "tempo"/],
    ['click on Drills (Free play only)', { screen: 'drills', set: 's', click: { bpm: 72 } }, /"click" is not a field of a drills activity/],
  ]) {
    try { readActivity('t', raw); ok(`refused: ${name}`, false, 'it was accepted'); }
    catch (e) { ok(`refused: ${name}`, want.test(e.message), e.message); }
  }
}
console.log(failed ? `${failed} of ${ran} failed` : `all ${ran} passed`); // (a count: an empty index or a dropped case shows)
process.exit(failed ? 1 : 0);
