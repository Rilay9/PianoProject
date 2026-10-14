// The accompaniment lab's judge (src/lab/judge.ts) on hand-made cases, including the ones ChatGPT's review found the
// first version got wrong (2026-10-13). Run: npm run check:lab (Node 22.18+ runs the TypeScript files directly).
import { improvised, judgeHit, ON_TIME_MS, sayHit } from '../src/lab/judge.ts';
import { chordInfo, formOf, readChart } from '../src/lab/music.ts';

const C7 = chordInfo('C7'); // C E G B♭
const hit = { t: 0, until: 2000, chord: C7, bar: 0, span: 0 };
const held = { ...hit, len: 2000 }; // chords on the beat: held until the chord changes (HOLD_SHARE of it, src/holds.ts: ¾, to 1500)
const keys = [60, 64, 67, 70];
const press = (midi, t, off) => ({ midi, t, off });
const together = (t, off = t + 800) => keys.map((k) => press(k, t, off));

const cases = [
  { name: 'all four down together on the beat', step: 'beat1', presses: together(10), want: 'ok' },
  { name: 'a small roll, all held', step: 'beat1', presses: keys.map((k, i) => press(k, i * 40, 900)), want: 'ok' },
  { name: 'any voicing and octave (B♭ below, G above)', step: 'beat1', presses: [press(58, 0, 900), press(60, 0, 900), press(64, 0, 900), press(79, 0, 900)], want: 'ok' },
  { name: 'each note short and apart: never a chord', step: 'beat1', presses: keys.map((k, i) => press(k, i * 100, i * 100 + 60)), want: 'miss', apart: true },
  { name: 'the same, at the style step', step: 'style', presses: keys.map((k, i) => press(k, i * 100, i * 100 + 60)), want: 'miss', apart: true },
  { name: 'apart is fine your own way', step: 'own', presses: keys.map((k, i) => press(k, i * 300, i * 300 + 100)), want: 'ok' },
  { name: 'missing the 7th', step: 'beat1', presses: together(0).slice(0, 3), want: 'miss', missing: [10] },
  { name: 'an extra key not in the chord', step: 'beat1', presses: [...together(0), press(61, 0, 800)], want: 'miss', wrong: [61] },
  { name: 'complete only 300 ms after the beat: late', step: 'beat1', presses: [...together(0).slice(0, 3), press(70, 300, 900)], want: 'late' },
  { name: 'a key still held from before the window does not count', step: 'beat1', presses: [press(70, -900), ...together(0).slice(0, 3)], want: 'miss', missing: [10] },
  { name: 'roots: the root alone', step: 'roots', presses: [press(48, 20, 500)], want: 'ok' },
  // Speed: times are the chart's; the window is 150 ms of real time, so at half speed it is 75 ms of the chart's time.
  { name: 'half speed: 120 ms of chart time (240 real) after the beat is late', step: 'beat1', presses: together(120), tol: ON_TIME_MS * 0.5, want: 'late' },
  { name: 'half speed: 60 ms of chart time (120 real) is on time', step: 'beat1', presses: together(60), tol: ON_TIME_MS * 0.5, want: 'ok' },
  { name: 'speed 1.5: 200 ms of chart time (133 real) is on time', step: 'beat1', presses: together(200), tol: ON_TIME_MS * 1.5, want: 'ok' },
  // Holding: each note still sounding at ¾ of the chord's length (end: when it stopped sounding, pedal included).
  { name: 'held to 1600 of 2000: right', hit: held, step: 'beat1', presses: keys.map((k) => ({ midi: k, t: 0, off: 1600, end: 1600 })), want: 'ok' },
  { name: 'let go at 800: amber, said', hit: held, step: 'beat1', presses: keys.map((k) => ({ midi: k, t: 0, off: 800, end: 800 })), want: 'late', short: true },
  { name: 'keys up at 800 but the pedal holds them to 1900: right', hit: held, step: 'beat1', presses: keys.map((k) => ({ midi: k, t: 0, off: 800, end: 1900 })), want: 'ok' },
  { name: 'one note let go early is enough to be short', hit: held, step: 'beat1', presses: keys.map((k, i) => ({ midi: k, t: 0, off: i ? 1800 : 500, end: i ? 1800 : 500 })), want: 'late', short: true },
  { name: 'still sounding (end unknown): not short', hit: held, step: 'beat1', presses: keys.map((k) => ({ midi: k, t: 0 })), want: 'ok' },
  { name: 'roots: the length is yours', step: 'roots', presses: [{ midi: 48, t: 0, off: 100, end: 100 }], want: 'ok' },
  // Test review 2026-10-14 (L3): at the Roots step the chord's other notes are fine, a key outside it is not.
  { name: 'roots: the root with the chord’s 3rd and 5th is fine', step: 'roots', presses: [press(48, 0, 900), press(64, 0, 900), press(67, 0, 900)], want: 'ok' },
  { name: 'roots: the root with a key outside the chord is wrong', step: 'roots', presses: [press(48, 0, 900), press(61, 0, 900)], want: 'miss', wrong: [61] },
];

let failed = 0;
for (const c of cases) {
  const r = judgeHit(c.hit ?? hit, c.presses, c.step, c.tol);
  const bad = [];
  if (r.mark !== c.want) bad.push(`mark ${r.mark}, wanted ${c.want}`);
  if (c.apart !== undefined && !!r.apart !== c.apart) bad.push(`apart ${r.apart}`);
  if (c.short !== undefined && !!r.short !== c.short) bad.push(`short ${r.short}`);
  if (c.missing && JSON.stringify(r.missing) !== JSON.stringify(c.missing)) bad.push(`missing ${r.missing}`);
  if (c.wrong && JSON.stringify(r.wrong) !== JSON.stringify(c.wrong)) bad.push(`wrong ${r.wrong}`);
  console.log(`${bad.length ? 'FAIL' : 'ok  '} ${c.name}${bad.length ? `: ${bad.join('; ')}` : ''}`);
  if (bad.length) failed++;
}

// Improvising: the changes counted are all the chart's changes, whether you played at them or not.
// C F G C at 1 s a beat: changes at bars 2, 3 and 4 (bar 1's C follows the last bar's C round the form: no change).
const form = formOf(readChart('t', { title: 't', tempo: 60, bars: ['C', 'F', 'G', 'C'] }));
const guide = (pcs) => pcs;
const im = improvised(form, [press(65, 4000), press(72, 0)], guide); // an F at bar 2's change; a C at the start (no change there)
const want = { changes: 3, playedAt: 1, landed: 1 };
const okIm = im.changes === want.changes && im.playedAt === want.playedAt && im.landed === want.landed;
console.log(`${okIm ? 'ok  ' : 'FAIL'} improvising counts every change (3), played at 1, landed 1: got ${im.changes}/${im.playedAt}/${im.landed}`);
if (!okIm) failed++;

// The notes and the share from the guide, with the lab's own guides (screens/lab.ts guideOf): the root alone at the
// Root step, the chord's notes at Tones (test review 2026-10-14, L2: the guide here was the identity). C then E over
// bar 1's C, F over bar 2's F: from the root guide 2 of 3, from the chord tones 3 of 3, in 2 bars.
const lead = [press(60, 0), press(64, 1000), press(65, 4000)];
const byRoot = improvised(form, lead, (pcs) => pcs.slice(0, 1)), byTones = improvised(form, lead, (pcs) => pcs);
const okGuide = byRoot.notes === 3 && byRoot.fromGuide === 2 && byTones.fromGuide === 3 && byRoot.bars === 2;
console.log(`${okGuide ? 'ok  ' : 'FAIL'} improvising: notes from the guide, root 2 of 3, chord tones 3 of 3, in 2 bars: got ${byRoot.fromGuide}/${byRoot.notes}, ${byTones.fromGuide}, bars ${byRoot.bars}`);
if (!okGuide) failed++;

// 6/8 is counted in two dotted-quarter beats (owner, 2026-10-13): two beats a bar, a beat at 60 a minute is 1 s.
const six = formOf(readChart('six', { title: 'six', meter: '6/8', tempo: 60, bars: ['C', 'G'] }));
const okSix = six.barBeats === 2 && Math.abs(six.beatMs - 1000) < 1e-6 && six.length === 4;
console.log(`${okSix ? 'ok  ' : 'FAIL'} 6/8 in two: ${six.barBeats} beats a bar of ${six.beatMs} ms`);
if (!okSix) failed++;
let slash = '';
try { readChart('s', { title: 's', bars: ['C/E'] }); } catch (e) { slash = e.message; }
console.log(`${/slash chords/.test(slash) ? 'ok  ' : 'FAIL'} a slash chord is refused: ${slash}`);
if (!/slash chords/.test(slash)) failed++;

// The sentence the learner reads after a red chord, an extra key named from the chord's key signature (test review,
// 2026-10-14: E♭ over C7 was "D♯", A♭ over Cm "G♯", B♭ over Am "A♯").
const sayings = [
  ['C7', 63, "Bar 1 C7: E♭ isn't in C7"],
  ['Cm', 68, "Bar 1 Cm: A♭ isn't in Cm"],
  ['Am', 70, "Bar 1 Am: B♭ isn't in Am"],
  ['Gm', 63, "Bar 1 Gm: E♭ isn't in Gm"],
  ['E', 63, "Bar 1 E: D♯ isn't in E"],
  ['D', 61, "Bar 1 D: C♯ isn't in D"],
];
for (const [symbol, extra, want] of sayings) {
  const c = chordInfo(symbol), h = { t: 0, until: 2000, chord: c, bar: 0, span: 0, len: 2000 };
  const said = sayHit(judgeHit(h, [...c.pcs.map((p) => press(60 + p, 0, 1600)), press(extra, 0, 1600)], 'beat1'), 'beat1');
  const ok = said === want;
  console.log(`${ok ? 'ok  ' : 'FAIL'} the extra key over ${symbol} is named: ${said}${ok ? '' : ` (want: ${want})`}`);
  if (!ok) failed++;
}

console.log(failed ? `${failed} failed` : `all ${cases.length + 4 + sayings.length} passed`);
process.exit(failed ? 1 : 0);
