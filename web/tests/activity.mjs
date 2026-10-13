// The activity format (src/activity.ts): every activity in public/content/activities reads, and mistakes are refused
// with the reason rather than guessed (owner, 2026-10-13). Run: npm run check:activity.
import { readFileSync } from 'node:fs';
import { readActivity } from '../src/activity.ts';

const dir = new URL('../public/content/activities/', import.meta.url);
let failed = 0;
const ok = (name, pass, got) => { console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : ` — ${got}`}`); if (!pass) failed++; };

for (const f of JSON.parse(readFileSync(new URL('index.json', dir), 'utf8'))) {
  try { const a = readActivity(f.replace(/\.json$/, ''), JSON.parse(readFileSync(new URL(f, dir), 'utf8'))); ok(`${f} reads (${a.screen})`, true); }
  catch (e) { ok(`${f} reads`, false, e.message); }
}

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
];
for (const [name, file, want] of refused) {
  try { readActivity('t', file); ok(`refused: ${name}`, false, 'it was accepted'); }
  catch (e) { ok(`refused: ${name}`, want.test(e.message), e.message); }
}
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
