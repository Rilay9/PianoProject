// Notes in words, single-note and interval cards, chord names, Look it up's pictures (owner, 2026-10-18: "when I get
// things wrong it should tell me what the notes were in key names"; "single note flash cards and interval drills";
// "reference diagrams … the lines and all the spaces of both clefs, the intervals, the chords"). The expectations are
// written out by hand from the staff (treble lines E G B D F, spaces F A C E; bass lines G B D F A, spaces A C E G) and
// from tonal's chord spellings, not from the code under test.
const { placeWords, wrongWords, lookBetween, intervalNumber } = await import('../src/staff-words.ts');
const { notePool, intervalPool, readNoteSpec } = await import('../src/exercise/notecards.ts');
const { withChordNames, midiOf } = await import('../src/exercise/items.ts');
const { sections } = await import('../src/lookup-content.ts');
const { Chord, Note } = await import('tonal');

const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` — ${detail}`}`); if (!ok) failures.push(name); };

// ---- where a note sits ----------------------------------------------------------------------------------------------
const places = {
  treble: { E4: 'on the bottom line', G4: 'on the 2nd line up', B4: 'on the middle line', D5: 'on the 4th line up', F5: 'on the top line',
    F4: 'in the bottom space', A4: 'in the 2nd space up', C5: 'in the 3rd space up', E5: 'in the top space',
    D4: 'just under', G5: 'just over', B3: 'just under the 1st ledger line below', A3: 'on the 2nd ledger line below', A5: 'on the 1st ledger line above', B5: 'just over the 1st ledger line above', C6: 'on the 2nd ledger line above' },
  bass: { G2: 'on the bottom line', B2: 'on the 2nd line up', D3: 'on the middle line', F3: 'on the 4th line up', A3: 'on the top line',
    A2: 'in the bottom space', C3: 'in the 2nd space up', E3: 'in the 3rd space up', G3: 'in the top space',
    F2: 'just under', B3: 'just over', E2: 'on the 1st ledger line below', D2: 'just under the 1st ledger line below', C2: 'on the 2nd ledger line below', D4: 'just over the 1st ledger line above', E4: 'on the 2nd ledger line above' },
};
const off = [];
for (const [clef, table] of Object.entries(places)) for (const [p, want] of Object.entries(table)) { const got = placeWords(p, clef); if (!got.startsWith(want) || !got.endsWith(`${clef} staff`)) off.push(`${clef} ${p}: "${got}"`); }
check('every line, space and ledger note of both staves is placed as the staff has it (treble E G B D F / F A C E, bass G B D F A / A C E G)', !off.length, off.join(' | '));
check('middle C named as such on either staff (under the treble, over the bass)', /^middle C: its own short line under the treble staff$/.test(placeWords('C4', 'treble')) && /over the bass staff$/.test(placeWords('C4', 'bass')), `${placeWords('C4', 'treble')} / ${placeWords('C4', 'bass')}`);
check('accidentals don\'t move a note: F♯4 sits where F4 does', placeWords('F#4', 'treble') === placeWords('F4', 'treble'));

// ---- a wrong key in words -------------------------------------------------------------------------------------------
const w1 = wrongWords(50, ['F3'], 'bass', midiOf), w2 = wrongWords(64, ['E3'], 'bass', midiOf), w3 = wrongWords(61, ['D4'], 'treble', midiOf), w4 = wrongWords(50, ['C3', 'E3', 'G3'], null, midiOf), w5 = wrongWords(48, ['E3'], null, midiOf);
check('a wrong key: "That\'s D" and the note asked for with its place; the right letter in the wrong octave said so; a black key said so; a chord by its letters; no staff, no place',
  w1.head === "That's D" && w1.sub === 'This note is F: on the 4th line up of the bass staff' && w2.head === "That's E, an octave too high" && w3.head === "That's C♯ (a black key)" && w4.sub === 'This chord is C E G' && w5.sub === 'This note is E',
  JSON.stringify([w1, w2, w3, w4, w5]));

// ---- single notes ---------------------------------------------------------------------------------------------------
const bass = notePool(readNoteSpec({ clef: 'bass', from: 'G2', to: 'A3' }, false));
check('single notes, bass G2–A3: the nine white keys, each its own card on the bass staff', bass.map((i) => i.groups[0][0]).join(' ') === 'G2 A2 B2 C3 D3 E3 F3 G3 A3' && bass.every((i) => i.clef === 'bass' && i.groups.length === 1), bass.map((i) => i.name).join(' '));
const refused = [{ clef: 'alto', from: 'C4', to: 'D4' }, { clef: 'bass', from: 'A3', to: 'G2' }, { clef: 'bass', from: 'C#3', to: 'D4' }, { clef: 'bass', from: 'C3', to: 'D3', extra: 1 }].filter((g) => { try { readNoteSpec(g, false); return true; } catch { return false; } });
check('single notes refused: an unknown clef, a range upside down, a black key as an end, an unknown field', !refused.length, JSON.stringify(refused));

// ---- intervals ------------------------------------------------------------------------------------------------------
const iv = intervalPool(readNoteSpec({ clef: 'treble', from: 'C4', to: 'E4', sizes: [2, 3], direction: 'both' }, true));
const names = iv.map((i) => i.name);
check('intervals C4–E4, 2nds and 3rds both ways: C–D, D–E and C–E, up and down, named by letters', names.join(' | ') === 'C up to D: a 2nd | D down to C: a 2nd | D up to E: a 2nd | E down to D: a 2nd | C up to E: a 3rd | E down to C: a 3rd', names.join(' | '));
const all = intervalPool(readNoteSpec({ clef: 'bass', from: 'C2', to: 'C4', sizes: [2, 3, 4, 5, 6, 7, 8], direction: 'up' }, true));
// (an interval's number by letters; its size in keys must be one of that number's: a 2nd 1–2, 3rd 3–4, 4th 5–6, 5th 6–7, 6th 8–9, 7th 10–11, octave 12)
const SEMIS = { 2: [1, 2], 3: [3, 4], 4: [5, 6], 5: [6, 7], 6: [8, 9], 7: [10, 11], 8: [12] };
const bad = all.filter((i) => { const [a, b] = i.groups.map((g) => g[0]), n = intervalNumber(a, b); return !SEMIS[n]?.includes(midiOf(b) - midiOf(a)) || !i.name.includes(['', '', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'][n]); });
check(`every interval card C2–C4 (${all.length}) is the size its name says, counted in keys`, all.length > 50 && !bad.length, bad.map((i) => i.name).join(' | '));
const together = intervalPool(readNoteSpec({ clef: 'treble', from: 'C4', to: 'G4', sizes: [5], together: true }, true));
check('intervals together: one chord a card (C and G together: a 5th)', together.length === 1 && together[0].groups.length === 1 && together[0].groups[0].join(' ') === 'C4 G4' && /together: a 5th/.test(together[0].name), JSON.stringify(together));
check('line to line, line to space: C–E a 3rd line to line, C–D line to space, F–A space to space', lookBetween('C4', 'E4', 'treble') === 'line to line' && lookBetween('C4', 'D4', 'treble') === 'line to space' && lookBetween('F4', 'A4', 'treble') === 'space to space');
check('intervals refused: a size of 9, none fitting the range', (() => { try { readNoteSpec({ clef: 'treble', from: 'C4', to: 'D4', sizes: [9] }, true); return false; } catch { /* ok */ } try { readNoteSpec({ clef: 'treble', from: 'C4', to: 'D4', sizes: [5] }, true); return false; } catch { return true; } })());

// ---- chord names over chords ----------------------------------------------------------------------------------------
const four = withChordNames({ n: 1, name: 'C – F – G7 – C', short: '1', groups: [['C3', 'E3', 'G3'], ['C3', 'F3', 'A3'], ['B2', 'F3', 'G3'], ['C3', 'E3', 'G3']] });
const one = withChordNames({ n: 1, name: 'Am', short: 'Am', groups: [['A2', 'C3', 'E3']] });
const odd = withChordNames({ n: 1, name: 'C – F', short: '1', groups: [['C3', 'E3', 'G3'], ['C3', 'F3', 'A3'], ['B2', 'F3', 'G3']] });
check('chord names: one a chord from "C – F – G7 – C"; "Am" for one chord; none when the count differs', JSON.stringify(four.chordNames) === '["C","F","G7","C"]' && JSON.stringify(one.chordNames) === '["Am"]' && !odd.chordNames, JSON.stringify([four.chordNames, one.chordNames, odd.chordNames]));

// ---- Look it up: its pictures against the staff and tonal ------------------------------------------------------------
const secs = sections();
const rowsOf = (id) => secs.find((s) => s.id === id).parts.filter((p) => p.row).map((p) => p.row);
const lineBad = [];
for (const clef of ['treble', 'bass']) {
  const [lines, spaces] = rowsOf(clef);
  for (const g of lines.groups) if (!placeWords(g[0], clef).startsWith('on the') || /ledger/.test(placeWords(g[0], clef))) lineBad.push(`${clef} line ${g[0]}`);
  for (const g of spaces.groups) if (!placeWords(g[0], clef).startsWith('in the')) lineBad.push(`${clef} space ${g[0]}`);
  if (lines.groups.length !== 5 || spaces.groups.length !== 4) lineBad.push(`${clef}: ${lines.groups.length} lines, ${spaces.groups.length} spaces`);
}
check('Look it up: each clef\'s "lines" row is its five lines and its "spaces" row its four spaces', !lineBad.length, lineBad.join(' | '));
const chordBad = [];
for (const r of rowsOf('chords')) {
  const name = r.over[0], tones = Chord.get(name).notes.map((n) => Note.chroma(n));
  const played = r.groups[0].map((p) => Note.chroma(p));
  if (!tones.length || !played.every((c) => tones.includes(c)) || !played.includes(Note.chroma(Chord.get(name).tonic))) chordBad.push(`${name}: ${r.groups[0].join(' ')} (tonal: ${Chord.get(name).notes.join(' ')})`);
}
check(`Look it up: every chord drawn (${rowsOf('chords').length}) is notes of its name, root included (tonal's spelling)`, rowsOf('chords').length === 7 && !chordBad.length, chordBad.join(' | '));
const ivRows = rowsOf('intervals');
const ivBad = ivRows.flatMap((r) => r.groups.map((g, k) => (intervalNumber(g[0], g[1]) === k + 2 ? '' : `${g.join('-')} drawn as ${r.over[k]}`))).filter(Boolean);
check('Look it up: each interval drawn is the size written over it', !ivBad.length, ivBad.join(' | '));

console.log(failures.length ? `${failures.length} failed` : 'all passed');
process.exit(failures.length ? 1 : 0);
