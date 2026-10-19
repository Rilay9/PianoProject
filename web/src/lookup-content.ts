// Look it up's content (lookup.ts draws it): the sections, their words and the notes of each picture, kept apart from
// the drawing (no DOM, no VexFlow) so the checks read it in Node (tests/notecards.mjs). Every letter and place in it is
// worked out from the pitches (staff-words.ts), so a label can't disagree with the note drawn.

import { Note } from 'tonal';
import { letterOf, placeWords, lookBetween, intervalName, type Clef } from './staff-words.ts';

const midiOf = (p: string) => Note.midi(p) ?? 60;

/** One picture: notes (each a group: one note, or a chord) on a staff, letters under them, words over them if given. */
export interface Row { clef: Clef; groups: string[][]; under?: string[]; over?: string[]; key?: string; durations?: string[]; caption?: string; together?: boolean }

const LINES: Record<Clef, string[]> = { treble: ['E4', 'G4', 'B4', 'D5', 'F5'], bass: ['G2', 'B2', 'D3', 'F3', 'A3'] };
const SPACES: Record<Clef, string[]> = { treble: ['F4', 'A4', 'C5', 'E5'], bass: ['A2', 'C3', 'E3', 'G3'] };
const BELOW: Record<Clef, string[]> = { treble: ['A3', 'B3', 'C4', 'D4'], bass: ['C2', 'D2', 'E2', 'F2'] };
const ABOVE: Record<Clef, string[]> = { treble: ['G5', 'A5', 'B5', 'C6'], bass: ['B3', 'C4', 'D4', 'E4'] };
const ALL: Record<Clef, string[]> = { treble: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'], bass: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'] };

/** inline: side by side with the inline parts next to it (the chords: each its staff and its keys). */
export type Part = { h?: string; p?: string; row?: Row; keys?: { notes: string[]; fingers?: number[] }; inline?: boolean };
const one = (ps: string[]) => ps.map((p) => [p]);

/** The sections, each a list of headings, words, pictures and keys. */
export function sections(): { id: string; title: string; parts: Part[] }[] {
  const clefSection = (clef: Clef, title: string, lineWords: string, spaceWords: string, clefWords: string): { id: string; title: string; parts: Part[] } => ({
    id: clef, title, parts: [
      { p: clefWords },
      { h: 'The lines, bottom to top' }, { row: { clef, groups: one(LINES[clef]) }, p: lineWords },
      { h: 'The spaces, bottom to top' }, { row: { clef, groups: one(SPACES[clef]) }, p: spaceWords },
      { h: 'Below the staff (ledger lines)' }, { row: { clef, groups: one(BELOW[clef]) }, p: BELOW[clef].map((n) => `${letterOf(n)}: ${placeWords(n, clef)}`).join('. ') + '.' },
      { h: 'Above the staff (ledger lines)' }, { row: { clef, groups: one(ABOVE[clef]) }, p: ABOVE[clef].map((n) => `${letterOf(n)}: ${placeWords(n, clef)}`).join('. ') + '.' },
      { h: 'Every white key, step by step' }, { row: { clef, groups: one(ALL[clef].slice(0, 9)) } }, { row: { clef, groups: one(ALL[clef].slice(8)) } },
    ],
  });
  const interval = (clef: Clef, from: string, together: boolean): Row => {
    const start = 'CDEFGAB'.indexOf(from[0]) + 7 * Number(from[1]);
    const groups = [2, 3, 4, 5, 6, 7, 8].map((n) => { const s = start + n - 1, b = `${'CDEFGAB'[s % 7]}${Math.floor(s / 7)}`; return [from, b]; });
    return { clef, groups, over: [2, 3, 4, 5, 6, 7, 8].map(intervalName), together };
  };
  const chord = (name: string, notes: string, fingers: number[]): Part[] => [
    { row: { clef: 'bass', groups: [notes.split(' ')], over: [name] }, keys: { notes: notes.split(' '), fingers }, inline: true },
  ];
  return [
    clefSection('treble', 'Treble clef', 'Every Good Boy Does Fine: E G B D F.', 'F A C E spells FACE.', 'The treble clef (G clef) curls round the 2nd line up: that line is the G above middle C. Usually the right hand.'),
    clefSection('bass', 'Bass clef', 'Good Boys Do Fine Always: G B D F A.', 'All Cows Eat Grass: A C E G.', 'The bass clef (F clef) has two dots either side of the 4th line up: that line is the F below middle C. Usually the left hand.'),
    {
      id: 'landmarks', title: 'Middle C and landmarks', parts: [
        { p: 'Middle C is the C nearest the middle of the piano. It is the same key written two ways: on a short line under the treble staff, or on a short line over the bass staff.' },
        { row: { clef: 'treble', groups: [['C4']], under: ['middle C'] } }, { row: { clef: 'bass', groups: [['C4']], under: ['middle C'] } },
        { h: 'Landmarks to read from' },
        { row: { clef: 'treble', groups: one(['C4', 'G4', 'C5', 'G5', 'C6']), under: ['C', 'G', 'C', 'G', 'C'] }, p: 'Treble: middle C (ledger line), treble G (2nd line, where the clef curls), C in the 3rd space, G above the staff, high C on two ledger lines.' },
        { row: { clef: 'bass', groups: one(['C2', 'F2', 'C3', 'F3', 'C4']), under: ['C', 'F', 'C', 'F', 'C'] }, p: 'Bass: low C on two ledger lines, F under the staff, bass C in the 2nd space, bass F (4th line, between the dots), middle C (ledger line).' },
      ],
    },
    {
      id: 'positions', title: 'Hand positions', parts: [
        { h: 'C position, right hand' }, { row: { clef: 'treble', groups: one(['C4', 'D4', 'E4', 'F4', 'G4']) }, keys: { notes: ['C4', 'D4', 'E4', 'F4', 'G4'], fingers: [1, 2, 3, 4, 5] } },
        { h: 'C position, left hand' }, { row: { clef: 'bass', groups: one(['C3', 'D3', 'E3', 'F3', 'G3']) }, keys: { notes: ['C3', 'D3', 'E3', 'F3', 'G3'], fingers: [5, 4, 3, 2, 1] } },
        { h: 'G position, right hand' }, { row: { clef: 'treble', groups: one(['G4', 'A4', 'B4', 'C5', 'D5']) }, keys: { notes: ['G4', 'A4', 'B4', 'C5', 'D5'], fingers: [1, 2, 3, 4, 5] } },
        { h: 'G position, left hand' }, { row: { clef: 'bass', groups: one(['G2', 'A2', 'B2', 'C3', 'D3']) }, keys: { notes: ['G2', 'A2', 'B2', 'C3', 'D3'], fingers: [5, 4, 3, 2, 1] } },
      ],
    },
    {
      id: 'intervals', title: 'Intervals', parts: [
        { p: 'An interval is the distance between two notes, counted by letters with both ends included: C to E is C, D, E, a 3rd. Odd numbers (3rd, 5th, 7th) go line to line or space to space; even ones (2nd, 4th, 6th, octave) line to space or space to line.' },
        { h: 'Up from middle C, one after the other… (shown together)' }, { row: interval('treble', 'C4', true), p: [2, 3, 4, 5, 6, 7, 8].map((n) => { const s = 27 + n, b = `${'CDEFGAB'[s % 7]}${Math.floor(s / 7)}`; return `${intervalName(n)}: C to ${b[0]}, ${lookBetween('C4', b, 'treble')}`; }).join('. ') + '.' },
        { h: 'From bass C' }, { row: interval('bass', 'C3', true) },
        { h: 'From E, a line' }, { row: interval('treble', 'E4', true), p: 'From a line: the 3rd, 5th and 7th are on lines too; the 2nd, 4th, 6th and octave are in spaces.' },
      ],
    },
    {
      id: 'chords', title: 'Chords', parts: [
        { p: 'A chord is three or more notes together. Built up from its root in 3rds (root, 3rd, 5th: C E G, G B D, A C E) its notes sit all on lines or all in spaces, stacked like a snowman. The left hand often plays a chord with its letters rearranged so the hand hardly moves (F as C F A, G7 as B F G): the same letters, a different order. Here they are as you play them in C and G position, fingers on the keys.' },
        { h: 'In C: C, F, G7 (and Am)' }, ...chord('C', 'C3 E3 G3', [5, 3, 1]), ...chord('F', 'C3 F3 A3', [5, 2, 1]), ...chord('G7', 'B2 F3 G3', [5, 2, 1]), ...chord('Am', 'A2 C3 E3', [5, 3, 1]),
        { p: 'C is home; F leans away; G7 pulls back home. Am, with C, G and F, makes the four chords of a great many pop songs.' },
        { h: 'In G: G, C, D7' }, ...chord('G', 'G2 B2 D3', [5, 3, 1]), ...chord('C', 'G2 C3 E3', [5, 2, 1]), ...chord('D7', 'F#2 C3 D3', [5, 2, 1]),
        { p: 'G is home; C leans away; D7 (F♯, the black key just right of F) pulls back home.' },
      ],
    },
    {
      id: 'values', title: 'Note values', parts: [
        { p: 'How long a note lasts, counted in beats (in 3/4 and 4/4 a beat is a quarter note).' },
        { row: { clef: 'treble', groups: one(['B4', 'B4', 'B4', 'B4', 'B4']), durations: ['w', 'hd', 'h', 'q', '8'], under: ['4 beats', '3', '2', '1', '½'], over: ['whole', 'dotted half', 'half', 'quarter', 'eighth'] } },
        { p: 'A dot adds half the note again: a dotted half is 2 + 1 = 3 beats. Two eighths fill one beat, counted "1 and".' },
        { h: 'Rests: the same lengths of silence' },
        { row: { clef: 'treble', groups: one(['B4', 'B4', 'B4', 'B4', 'B4']), durations: ['wr', 'hdr', 'hr', 'qr', '8r'], under: ['4 (a whole bar)', '3', '2', '1', '½'] } },
        { p: 'Time signature: the top number is the beats in a bar (4/4: four, 3/4: three); the bottom number 4 means a beat is a quarter note.' },
      ],
    },
    {
      id: 'sharps', title: 'Sharps and flats', parts: [
        { p: '♯ (sharp): the key just above, to the right, usually a black key: F♯ is the black key right of F. ♭ (flat): the key just below, to the left: B♭ is the black key left of B. ♮ (natural): back to the white key. One written in a bar lasts to the end of that bar.' },
        { row: { clef: 'treble', groups: one(['F4', 'F#4', 'B4', 'Bb4']), under: ['F', 'F♯', 'B', 'B♭'] }, keys: { notes: ['F4', 'F#4', 'B4', 'Bb4'] } },
        { h: 'Key signature: G major' }, { row: { clef: 'treble', key: 'G', groups: one(['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5']), under: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯', 'G'] }, p: 'One sharp at the start of every line, on the F line: every F in the piece is played F♯, unless a ♮ says otherwise.' },
      ],
    },
  ];
}

const BEATS: Record<string, number> = { w: 4, hd: 3, h: 2, q: 1, '8': 0.5 };
/** A row's notes as the piano plays them: one after another (a chord together; intervals, the two then together; note
 * values their lengths at 80 a minute). */
export function rowNotes(r: Row): { t: number; midi: number[]; dur?: number }[] {
  const out: { t: number; midi: number[]; dur?: number }[] = [];
  let t = 0;
  if (r.durations) {
    if (r.durations.some((d) => d.endsWith('r'))) return out; // (rests: nothing to hear)
    r.groups.forEach((g, i) => { const ms = (BEATS[r.durations![i]] ?? 1) * 750; out.push({ t, midi: g.map(midiOf), dur: ms * 0.95 }); t += ms + 300; });
    return out;
  }
  for (const g of r.groups) {
    if (r.together && g.length === 2) { out.push({ t, midi: [midiOf(g[0])] }, { t: t + 350, midi: [midiOf(g[1])] }, { t: t + 700, midi: g.map(midiOf) }); t += 1500; continue; }
    out.push({ t, midi: g.map(midiOf) });
    t += g.length > 1 ? 900 : 450;
  }
  return out;
}

