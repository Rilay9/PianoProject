// Notes in words (owner, 2026-10-18: "when I get things wrong it should tell me what the notes were in key names"): a
// written note's letter and where it sits on its staff ("F: the 4th line up of the bass staff"), a key's name, and what
// a wrong key was against the note asked for. Worked out from the pitch itself, so the words can't disagree with the
// note drawn. Used by Drills (a wrong key, a card's result) and Look it up (lookup.ts). No page: the checks run it in Node.

export type Clef = 'treble' | 'bass';

const LETTERS = 'CDEFGAB';
const SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
/** The bottom line of each staff as a step count (letter + 7 × octave): E4 and G2. */
const BOTTOM: Record<Clef, number> = { treble: 2 + 7 * 4, bass: 4 + 7 * 2 };

/** A spelled pitch's parts: "F#3" -> F, ♯, 3. */
function parts(p: string): { letter: string; acc: string; octave: number } | null {
  const m = /^([A-G])(#+|b+)?(-?\d+)$/.exec(p);
  return m ? { letter: m[1], acc: (m[2] ?? '').replace(/#/g, '♯').replace(/b/g, '♭'), octave: Number(m[3]) } : null;
}
/** Steps up from C0 by letter (accidentals don't move a note on the staff). */
export function staffStep(p: string): number { const x = parts(p); return x ? LETTERS.indexOf(x.letter) + 7 * x.octave : 0; }
/** A spelled pitch as its key name: "F#3" -> "F♯", "Bb2" -> "B♭". */
export function letterOf(p: string): string { const x = parts(p); return x ? x.letter + x.acc : p; }
/** A key's name from its number, sharps for the black keys: 66 -> "F♯". */
export function keyName(midi: number): string { return SHARPS[((midi % 12) + 12) % 12]; }
export const isBlack = (midi: number): boolean => SHARPS[((midi % 12) + 12) % 12].length > 1;

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th'];
/**
 * Where a note sits on its staff, in words: "on the 4th line up of the bass staff", "in the 2nd space up of the treble
 * staff", "on the bottom line …", "in the top space …", "just under the treble staff", "on the 1st ledger line above
 * the bass staff", "just under the 1st ledger line below the treble staff"; middle C by name ("middle C: its own short
 * line under the treble staff").
 */
export function placeWords(p: string, clef: Clef): string {
  const s = staffStep(p), at = s - BOTTOM[clef], staff = staffName(clef), x = parts(p);
  if (x?.letter === 'C' && x.octave === 4) return `middle C: its own short line ${clef === 'treble' ? 'under' : 'over'} ${staff}`;
  if (at >= 0 && at <= 8) {
    if (at % 2 === 0) { const n = at / 2 + 1; return `on the ${n === 1 ? 'bottom line' : n === 5 ? 'top line' : n === 3 ? 'middle line' : `${ORD[n]} line up`} of ${staff}`; }
    const n = (at + 1) / 2;
    return `in the ${n === 1 ? 'bottom space' : n === 4 ? 'top space' : `${ORD[n]} space up`} of ${staff}`;
  }
  if (at === -1) return `just under ${staff}`;
  if (at === 9) return `just over ${staff}`;
  if (at < 0) { const k = Math.floor(-at / 2); return at % 2 === 0 ? `on the ${ORD[k]} ledger line below ${staff}` : `just under the ${ORD[k]} ledger line below ${staff}`; }
  const k = Math.floor((at - 8) / 2);
  return at % 2 === 0 ? `on the ${ORD[k]} ledger line above ${staff}` : `just over the ${ORD[k]} ledger line above ${staff}`;
}

/** "the bass staff" / "the treble staff". */
export function staffName(clef: Clef): string { return clef === 'treble' ? 'the treble staff' : 'the bass staff'; }

/** A key played against a note asked for, short: "D", or "E an octave up" (the right letter, the wrong octave). */
export function playedWords(played: number, wanted: string, midiOf: (p: string) => number): string {
  const wm = midiOf(wanted);
  if (wm % 12 === played % 12 && wm !== played) { const oct = Math.round(Math.abs(wm - played) / 12); return `${letterOf(wanted)} ${oct === 1 ? 'an octave' : `${oct} octaves`} too ${played < wm ? 'low' : 'high'}`; }
  return keyName(played);
}

/**
 * A wrong key against the note (or chord) asked for, in words: head "That's D" (or "That's F, an octave too low"), sub
 * "This note is F: on the 4th line up of the bass staff" or "This chord is C E G". wanted: the spelled notes asked for;
 * clef: the staff it is on (none: name only, a card with no music shown).
 */
export function wrongWords(played: number, wanted: string[], clef: Clef | null, midiOf: (p: string) => number): { head: string; sub: string } {
  const black = isBlack(played) ? ' (a black key)' : '';
  if (wanted.length !== 1) return { head: `That's ${keyName(played)}${black}`, sub: `This chord is ${wanted.map(letterOf).join(' ')}` };
  const w = wanted[0], said = playedWords(played, w, midiOf);
  return { head: `That's ${said.replace(/ (an|\d) octave.*$/, (m) => `,${m}`)}${black}`, sub: `This note is ${letterOf(w)}${clef ? `: ${placeWords(w, clef)}` : ''}` };
}

/** An interval's number between two spelled notes (by letter: C to E a 3rd, whatever the sharps). */
export function intervalNumber(a: string, b: string): number { return Math.abs(staffStep(b) - staffStep(a)) + 1; }
const INTERVAL_NAMES = ['', 'unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'];
export const intervalName = (n: number): string => INTERVAL_NAMES[n] ?? `${n}th`;
/**
 * How an interval looks on the staff: a 2nd line to space (a step), a 3rd line to line or space to space (a skip),
 * a 4th line to space, a 5th line to line or space to space, and so on (odd numbers: the same kind; even: one of each).
 */
export function intervalLook(n: number): string {
  if (n === 1) return 'the same note';
  if (n === 8) return 'line to space, the same letter';
  return n % 2 === 1 ? 'line to line, or space to space' : 'line to space, or space to line';
}

/** Whether a note sits on a line (ledger lines too) or in a space, on this staff. */
export function onLine(p: string, clef: Clef): boolean { return (((staffStep(p) - BOTTOM[clef]) % 2) + 2) % 2 === 0; }
/** How two notes look on their staff: "line to line", "space to space", "line to space", "space to line". */
export function lookBetween(a: string, b: string, clef: Clef): string { return `${onLine(a, clef) ? 'line' : 'space'} to ${onLine(b, clef) ? 'line' : 'space'}`; }
