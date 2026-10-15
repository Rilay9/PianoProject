// Readability check for the MIDI converter (2026-10-15): what a reader notices in a bar, counted from the MusicXML,
// so that a converter change that makes its scores more cluttered fails here instead of being found on the page.
//
// What is counted, per score (totals; per bar when compared): visible rests; rests of a 16th or shorter; rests drawn
// where another voice of their staff has a note ("rests and notes in the same place"); voices beyond one a staff;
// tie starts; tuplet groups (and ones that are not 3:2); notes of a 32nd or shorter. Notes counted for context.
//
// The inputs, and why:
// - Six engraved piano scores from the app's catalogue (web/public/catalogue: PDMX uploads made by people in
//   MuseScore, CC0 or public domain; four pop arrangements like the owner's songs, Bach's Prelude I for held notes in
//   voices). Each is turned into a MIDI file here, two ways: as a notation program exports it (every note at 95% of
//   its written length, the gate measured in the owner's Seize the Day), and as a player lets the keys go (each key
//   released between 85% and 100% of its written length, seeded): the converter must read the second about as well
//   as the first, and the engraving itself is printed beside both, as the picture of a readable score.
// - The owner's two songs, when PIANO_SONGS names the folder holding them (they are not in the repo, which is
//   public): Seize the Day (a notation export) and Warmness on the Soul (played in with the pedal).
//
// What fails: any count higher than the one recorded below (RECORD), or fewer written notes of the player's version
// matching the export's conversion than recorded. No threshold is invented: the record is the converter's measured
// output, so a change may make scores tidier (it prints "better: update the record") but not more cluttered without
// someone deciding to and changing the record. Against real scores more widely: over the catalogue's 1,050 piano
// scores (2026-10-15) the per-bar 50th/90th percentiles were rests 0.59/1.95, 16th rests 0/0.37, rests on another
// voice's notes 0/0.46, extra voices 0.01/0.90, ties 0.36/1.61, tuplets 0/0.48, 32nds 0/0.20. Those are not limits
// here: a piece can rightly have more voices or rests than most (Bach's Prelude I as engraved: 1.88 rests on notes).
//
// usage: node tests/readability.mjs            (PIANO_SONGS=<folder> to include the owner's songs)
//        node tests/readability.mjs --record   (print the RECORD lines for the current converter)

import { existsSync, readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { convertMidi } from '../src/library/midi/convert.ts';

const COUNTS = ['rests', 'shortRests', 'restsOnNotes', 'extraVoices', 'ties', 'tuplets', 'oddTuplets', 'veryShort'];

/** Totals over a score: bars, notes, and each of COUNTS. */
export function measure(xml) {
  const parts = [...xml.matchAll(/<part\b[^>]*>([\s\S]*?)<\/part>/g)].map((m) => m[1]);
  const bars = Math.max(0, ...parts.map((p) => (p.match(/<measure\b/g) ?? []).length));
  const t = { bars, notes: 0, ...Object.fromEntries(COUNTS.map((k) => [k, 0])) };
  for (const part of parts) {
    for (const [, body] of part.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)) {
      const lines = new Set();
      const staves = new Set();
      const sounding = []; // [staff, voice, from, to] of notes
      const rests = []; // visible rests, the same
      let pos = 0, last = 0;
      for (const [whole, attrs = '', inner = ''] of body.matchAll(/<note\b([^>]*)>([\s\S]*?)<\/note>|<backup>[\s\S]*?<\/backup>|<forward>[\s\S]*?<\/forward>/g)) {
        const dur = Number(/<duration>(\d+)<\/duration>/.exec(whole)?.[1] ?? 0);
        if (whole.startsWith('<backup>')) { pos -= dur; continue; }
        if (whole.startsWith('<forward>')) { pos += dur; continue; }
        if (inner.includes('<grace') || inner.includes('<cue')) continue;
        const chord = inner.includes('<chord/>');
        const at = chord ? last : pos;
        if (!chord) { last = pos; pos += dur; }
        if (/print-object="no"/.test(attrs)) continue; // not drawn
        const staff = /<staff>(\d+)<\/staff>/.exec(inner)?.[1] ?? '1';
        const voice = /<voice>(\d+)<\/voice>/.exec(inner)?.[1] ?? '1';
        lines.add(`${staff}:${voice}`);
        staves.add(staff);
        const type = /<type>([^<]+)<\/type>/.exec(inner)?.[1] ?? '';
        const veryShort = ['32nd', '64th', '128th', '256th'].includes(type);
        t.ties += (inner.match(/<tie type="start"\/>/g) ?? []).length;
        if (/<tuplet\b[^>]*type="start"/.test(inner)) {
          t.tuplets += 1;
          if (!/<actual-notes>3<\/actual-notes>\s*<normal-notes>2<\/normal-notes>/.test(inner)) t.oddTuplets += 1;
        }
        if (chord) continue;
        if (inner.includes('<rest')) {
          t.rests += 1;
          if (type === '16th' || veryShort) t.shortRests += 1;
          rests.push([staff, voice, at, at + dur]);
          continue;
        }
        sounding.push([staff, voice, at, at + dur]);
        t.notes += 1;
        if (veryShort) t.veryShort += 1;
      }
      t.extraVoices += Math.max(0, lines.size - staves.size);
      for (const [s, v, a, b] of rests) {
        if (sounding.some(([s2, v2, c, d]) => s2 === s && v2 !== v && c < b && d > a)) t.restsOnNotes += 1;
      }
    }
  }
  return t;
}

/** A score's sounding notes in quarter notes (ties joined, grace and cue notes left out), and its metre and key. */
export function notesOf(xml) {
  const notes = [];
  const open = new Map();
  let divisions = 1, barStart = 0;
  for (const [, body] of xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)) {
    let pos = 0, last = 0, length = 0;
    for (const [whole, , inner = ''] of body.matchAll(/<attributes>[\s\S]*?<\/attributes>|<note\b([^>]*)>([\s\S]*?)<\/note>|<backup>[\s\S]*?<\/backup>|<forward>[\s\S]*?<\/forward>/g)) {
      if (whole.startsWith('<attributes>')) { divisions = Number(/<divisions>(\d+)/.exec(whole)?.[1] ?? divisions); continue; }
      const dur = Number(/<duration>(\d+)<\/duration>/.exec(whole)?.[1] ?? 0) / divisions;
      if (whole.startsWith('<backup>')) { pos -= dur; continue; }
      if (whole.startsWith('<forward>')) { pos += dur; length = Math.max(length, pos); continue; }
      if (inner.includes('<grace') || inner.includes('<cue')) continue;
      const chord = inner.includes('<chord/>');
      const at = chord ? last : pos;
      if (!chord) { last = pos; pos += dur; length = Math.max(length, pos); }
      if (inner.includes('<rest') || !inner.includes('<pitch>')) continue;
      const step = /<step>([A-G])<\/step>/.exec(inner)[1];
      const midi = (Number(/<octave>(-?\d+)<\/octave>/.exec(inner)[1]) + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[step] + Number(/<alter>(-?[\d.]+)<\/alter>/.exec(inner)?.[1] ?? 0);
      const staff = Number(/<staff>(\d+)<\/staff>/.exec(inner)?.[1] ?? 1);
      const key = `${staff}:${midi}`;
      if (inner.includes('<tie type="stop"/>') && open.has(key)) {
        open.get(key).end = barStart + at + dur;
        if (!inner.includes('<tie type="start"/>')) open.delete(key);
        continue;
      }
      const note = { staff, midi: Math.round(midi), start: barStart + at, end: barStart + at + dur };
      notes.push(note);
      if (inner.includes('<tie type="start"/>')) open.set(key, note);
    }
    barStart += length;
  }
  const time = /<time\b[^>]*>\s*<beats>(\d+)<\/beats>\s*<beat-type>(\d+)<\/beat-type>/.exec(xml);
  const fifths = Number(/<fifths>(-?\d+)<\/fifths>/.exec(xml)?.[1] ?? 0);
  return { notes, beats: Number(time?.[1] ?? 4), beatType: Number(time?.[2] ?? 4), fifths };
}

/** A two-track MIDI file (upper staff, lower staff) of the notes, each released at `release(note)` quarters. */
export function midiOf({ notes, beats, beatType, fifths }, release) {
  const T = 480;
  const vlq = (v) => { const b = [v & 0x7f]; while ((v >>= 7)) b.unshift((v & 0x7f) | 0x80); return b; };
  const chunk = (tag, body) => [...tag].map((c) => c.charCodeAt(0)).concat([24, 16, 8, 0].map((s) => (body.length >> s) & 255), body);
  const track = (events) => {
    events.sort((a, b) => a[0] - b[0] || (a[1][0] === 0x80 ? -1 : 1)); // a release before a strike at one tick
    let now = 0;
    const body = [];
    for (const [t, bytes] of events) { body.push(...vlq(t - now), ...bytes); now = t; }
    return chunk('MTrk', [...body, 0, 0xff, 0x2f, 0]);
  };
  const conductor = track([[0, [0xff, 0x51, 3, 0x07, 0xa1, 0x20]], [0, [0xff, 0x58, 4, beats, Math.log2(beatType), 24, 8]], [0, [0xff, 0x59, 2, fifths & 255, 0]]]);
  const staves = [1, 2].map((staff) => track(notes.filter((n) => (n.staff === 1) === (staff === 1)).flatMap((n) => {
    const on = Math.round(n.start * T);
    return [[on, [0x90, n.midi, 80]], [Math.max(on + 1, Math.round(release(n) * T)), [0x80, n.midi, 0]]];
  })));
  return new Uint8Array([...chunk('MThd', [0, 1, 0, 3, T >> 8, T & 255]), ...conductor, ...staves.flat()]);
}

/** Each written note as `staff:midi@onset/length` (quarters; ties joined), for comparing two conversions. */
const writtenNotes = (xml) => notesOf(xml).notes.map((n) => `${n.staff}:${n.midi}@${n.start}/${n.end - n.start}`);

async function readMxl(path) {
  const zip = await JSZip.loadAsync(readFileSync(path));
  const container = await zip.file('META-INF/container.xml')?.async('string');
  const root = container && /full-path="([^"]+)"/.exec(container)?.[1];
  return root ? zip.file(root)?.async('string') : null;
}

/** Seeded, so the player's version is the same every run. */
function player(seed) {
  let s = seed;
  const next = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  return (n) => n.start + (n.end - n.start) * (0.85 + 0.15 * next());
}

// The converter's measured output (totals; `match`: written notes of the player's version equal to the export's in
// staff, pitch, onset and length). Lower is tidier; the check fails on any rise. Refresh with --record.
const RECORD = {
  '0f933bca649d export': { rests: 18, shortRests: 10, restsOnNotes: 0, extraVoices: 0, ties: 1, tuplets: 0, oddTuplets: 0, veryShort: 4 },
  '0f933bca649d played': { rests: 21, shortRests: 12, restsOnNotes: 0, extraVoices: 0, ties: 6, tuplets: 0, oddTuplets: 0, veryShort: 4, match: 741 },
  '5b25b9a71cd4 export': { rests: 4, shortRests: 2, restsOnNotes: 0, extraVoices: 71, ties: 48, tuplets: 0, oddTuplets: 0, veryShort: 0 },
  '5b25b9a71cd4 played': { rests: 20, shortRests: 12, restsOnNotes: 1, extraVoices: 77, ties: 84, tuplets: 0, oddTuplets: 0, veryShort: 0, match: 619 },
  '4868a4d633b2 export': { rests: 21, shortRests: 6, restsOnNotes: 0, extraVoices: 0, ties: 312, tuplets: 20, oddTuplets: 0, veryShort: 0 },
  '4868a4d633b2 played': { rests: 41, shortRests: 7, restsOnNotes: 9, extraVoices: 88, ties: 388, tuplets: 39, oddTuplets: 0, veryShort: 0, match: 814 },
  '6197ae3ab855 export': { rests: 38, shortRests: 13, restsOnNotes: 0, extraVoices: 0, ties: 117, tuplets: 0, oddTuplets: 0, veryShort: 0 },
  '6197ae3ab855 played': { rests: 56, shortRests: 26, restsOnNotes: 4, extraVoices: 7, ties: 135, tuplets: 0, oddTuplets: 0, veryShort: 0, match: 438 },
  'a1fff4796177 export': { rests: 26, shortRests: 9, restsOnNotes: 0, extraVoices: 0, ties: 29, tuplets: 1, oddTuplets: 0, veryShort: 0 },
  'a1fff4796177 played': { rests: 28, shortRests: 8, restsOnNotes: 2, extraVoices: 40, ties: 51, tuplets: 2, oddTuplets: 0, veryShort: 0, match: 282 },
  'b11bdb7fe924 export': { rests: 66, shortRests: 2, restsOnNotes: 0, extraVoices: 34, ties: 71, tuplets: 0, oddTuplets: 0, veryShort: 0 },
  'b11bdb7fe924 played': { rests: 75, shortRests: 10, restsOnNotes: 1, extraVoices: 35, ties: 50, tuplets: 0, oddTuplets: 0, veryShort: 0, match: 485 },
  'seize': { rests: 101, shortRests: 6, restsOnNotes: 2, extraVoices: 14, ties: 115, tuplets: 11, oddTuplets: 0, veryShort: 0 },
  'warmness': { rests: 98, shortRests: 16, restsOnNotes: 9, extraVoices: 143, ties: 190, tuplets: 0, oddTuplets: 0, veryShort: 5 },
};

const CATALOGUE = {
  '0f933bca649d': 'Someone You Loved',
  '5b25b9a71cd4': 'Fix You',
  '4868a4d633b2': 'Falling',
  '6197ae3ab855': 'Mary Did You Know',
  'a1fff4796177': 'Your Song',
  'b11bdb7fe924': 'Prelude I (Bach)',
};
const SONGS = { seize: 'Seize_the_Day_1.mid', warmness: 'Warmness_On_The_Soul_2023.mid' };

/**
 * The counting itself, on a bar made by hand (2026-10-15). Staff 1: voice 1 a quarter tied to a dotted eighth, a 16th
 * rest and a half rest; voice 3 a half note under the first two, then a <forward> (nothing drawn). Staff 2: a triplet
 * of eighths, a 32nd, and a rest not printed. Each count must come out as built, and each fooling case must move it.
 */
function selfTest() {
  const note = (body, attrs = '') => `<note${attrs}>${body}</note>`;
  const p = (step) => `<pitch><step>${step}</step><octave>4</octave></pitch>`;
  const bar = (extra = '') => `<part id="P1"><measure number="1">
    ${note(`${p('C')}<duration>48</duration><tie type="start"/><voice>1</voice><type>quarter</type><staff>1</staff>`)}
    ${note(`${p('C')}<duration>36</duration><tie type="stop"/><voice>1</voice><type>eighth</type><dot/><staff>1</staff>`)}
    ${note(`<rest/><duration>12</duration><voice>1</voice><type>16th</type><staff>1</staff>`)}
    ${note(`<rest/><duration>96</duration><voice>1</voice><type>half</type><staff>1</staff>`)}
    <backup><duration>192</duration></backup>
    ${note(`${p('A')}<duration>96</duration><voice>3</voice><type>half</type><staff>1</staff>`)}
    <forward><duration>96</duration><voice>3</voice><staff>1</staff></forward>
    <backup><duration>192</duration></backup>
    ${note(`${p('E')}<duration>16</duration><voice>2</voice><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><staff>2</staff><notations><tuplet type="start"/></notations>`)}
    ${note(`${p('F')}<duration>16</duration><voice>2</voice><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><staff>2</staff>`)}
    ${note(`${p('G')}<duration>16</duration><voice>2</voice><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><staff>2</staff><notations><tuplet type="stop"/></notations>`)}
    ${note(`${p('A')}<duration>6</duration><voice>2</voice><type>32nd</type><staff>2</staff>`)}
    ${note(`<rest/><duration>138</duration><voice>2</voice><type>half</type><staff>2</staff>`, ' print-object="no"')}
    ${extra}
  </measure></part>`;
  const got = measure(bar());
  const want = { bars: 1, notes: 7, rests: 2, shortRests: 1, restsOnNotes: 1, extraVoices: 1, ties: 1, tuplets: 1, oddTuplets: 0, veryShort: 1 };
  const bad = Object.keys(want).filter((k) => got[k] !== want[k]).map((k) => `${k} ${got[k]} (built ${want[k]})`);
  // Fooling cases: without voice 3's note the rests are on no note; a hidden rest drawn counts; one voice is no extra.
  const alone = measure(bar().replace(/<note><pitch><step>A<\/step><octave>4<\/octave><\/pitch><duration>96<\/duration>[\s\S]*?<\/note>/, '<forward><duration>96</duration><voice>3</voice><staff>1</staff></forward>'));
  if (alone.restsOnNotes !== 0) bad.push(`rests on no note: restsOnNotes ${alone.restsOnNotes} (built 0)`);
  const shown = measure(bar().replace(' print-object="no"', ''));
  if (shown.rests !== 3) bad.push(`a rest drawn after print-object is removed: rests ${shown.rests} (built 3)`);
  const twoVoices = measure(bar().replace(/<voice>3<\/voice>/g, '<voice>1</voice>'));
  if (twoVoices.extraVoices !== 0) bad.push(`one voice a staff: extraVoices ${twoVoices.extraVoices} (built 0)`);
  return bad;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const recordMode = process.argv.includes('--record');
  const counting = selfTest();
  if (counting.length) { console.log(`FAIL the counting, on a bar built by hand: ${counting.join('; ')}`); process.exit(1); }
  const here = new URL('../public/catalogue/', import.meta.url);
  const results = {}; // name -> { counts, match? }
  const shown = []; // [name, totals]
  const convert = (bytes, title) => {
    const { xml, report } = convertMidi(bytes, { title });
    if (!report.passed) throw new Error(`${title}: the converter's own check failed`);
    return xml;
  };
  if (!existsSync(new URL('index.json', here))) {
    console.log('skipped: the catalogue inputs (public/catalogue is not in this build)');
  } else {
    for (const [id, name] of Object.entries(CATALOGUE)) {
      const engraved = await readMxl(new URL(`${id}.mxl`, here));
      const piece = notesOf(engraved);
      const exported = convert(midiOf(piece, (n) => n.start + 0.95 * (n.end - n.start)), name);
      const played = convert(midiOf(piece, player(7)), name);
      const clean = new Set(writtenNotes(exported));
      shown.push([`${name}: engraved`, measure(engraved)]);
      results[`${id} export`] = { counts: measure(exported) };
      results[`${id} played`] = { counts: measure(played), match: writtenNotes(played).filter((x) => clean.has(x)).length };
      shown.push([`${name}: export`, results[`${id} export`].counts], [`${name}: played`, results[`${id} played`].counts]);
    }
  }
  const folder = process.env.PIANO_SONGS;
  if (!folder) console.log('skipped: the owner\'s songs (set PIANO_SONGS to the folder holding them; never committed)');
  else {
    for (const [key, file] of Object.entries(SONGS)) {
      const path = `${folder.replace(/[\\/]$/, '')}/${file}`;
      if (!existsSync(path)) { console.log(`skipped: ${file} (not in ${folder})`); continue; }
      results[key] = { counts: measure(convert(new Uint8Array(readFileSync(path)), key)) };
      shown.push([key, results[key].counts]);
    }
  }
  const perBar = (t, k) => (t.bars ? t[k] / t.bars : 0).toFixed(2);
  console.log(`${'per bar'.padEnd(34)}${['bars', 'notes', ...COUNTS].map((k) => k.padStart(13)).join('')}`);
  for (const [name, t] of shown) console.log(`${name.padEnd(34)}${String(t.bars).padStart(13)}${['notes', ...COUNTS].map((k) => perBar(t, k).padStart(13)).join('')}`);
  if (recordMode) {
    for (const [name, r] of Object.entries(results)) {
      console.log(`  '${name}': { ${COUNTS.map((k) => `${k}: ${r.counts[k]}`).join(', ')}${r.match === undefined ? '' : `, match: ${r.match}`} },`);
    }
  } else {
    let failed = 0, better = 0, checked = 0;
    for (const [name, r] of Object.entries(results)) {
      const want = RECORD[name];
      if (!want) { console.log(`FAIL ${name}: no record (run with --record)`); failed += 1; continue; }
      checked += 1;
      for (const k of COUNTS) {
        if (r.counts[k] > want[k]) { console.log(`FAIL ${name}: ${k} ${r.counts[k]} (recorded ${want[k]})`); failed += 1; }
        else if (r.counts[k] < want[k]) better += 1;
      }
      if (want.match !== undefined) {
        if (r.match < want.match) { console.log(`FAIL ${name}: ${r.match} written notes match the export's (recorded ${want.match})`); failed += 1; }
        else if (r.match > want.match) better += 1;
      }
    }
    if (better) console.log(`better than recorded in ${better} count(s): update the record (--record) so the gain is kept`);
    console.log(failed ? `${failed} failed` : `ok: ${checked} conversions no more cluttered than recorded`);
    process.exit(failed ? 1 : 0);
  }
}
