/**
 * Naming the note the app is waiting for (`04` §7, the S25's first run).
 *
 * In Wait mode the app marks the expected key on the strip and colours the
 * notehead, and until now it did nothing else. On the owner's first real run
 * that was not enough: the strip was drawing all 88 keys, the mark was a
 * sliver, and forty seconds of hunting never found an F#4 that was on the
 * screen the whole time. The strip is fixed — but a name is the thing that
 * cannot be misread, and he asked for one.
 *
 * Behind the existing **Note names** setting, which is off by default and
 * until now did nothing on this screen at all. That is the whole reason it is
 * a setting and not a default: naming the note is a reading crutch, and the
 * owner reads notation. It is there for the moment he is stuck.
 *
 * **Named as the score writes it (T41).** The line used to name each MIDI
 * number from a table of sharps, so the Minuet in F asked for A♯3 and D♯5
 * over a page printing B♭3 and E♭5. The key is the same; the note is not, and
 * a name the page does not show is a wrong thing taught (the owner's rule,
 * 2026-09-21). The spelling comes from the notation (`ScoreNote.accidental`);
 * `midiToNoteName` is left to what it is right for, naming a MIDI number in
 * the diagnostics log.
 */
import { midiToNoteName } from '../midi/parseMidiMessage';
import { ACCIDENTAL_SEMITONES, type ScoreNote } from '../score/types';

/** A note as the line needs it: the key, and how the score spells it. */
export type WrittenPitch = Pick<ScoreNote, 'midi' | 'accidental'>;

/** Pitch classes of the seven letters, and each letter's place on the staff. */
const LETTERS: Readonly<Record<number, { name: string; place: number }>> = {
  0: { name: 'C', place: 0 },
  2: { name: 'D', place: 1 },
  4: { name: 'E', place: 2 },
  5: { name: 'F', place: 3 },
  7: { name: 'G', place: 4 },
  9: { name: 'A', place: 5 },
  11: { name: 'B', place: 6 },
};

/** Prose on a status line, not an identifier: the signs, not `#` and `b`. */
const SIGNS: Readonly<Record<NonNullable<WrittenPitch['accidental']>, string>> = {
  sharp: '♯',
  flat: '♭',
  natural: '♮',
  'double-sharp': '\u{1d12a}',
  'double-flat': '\u{1d12b}',
};

/**
 * "E♭4", and where the name sits on the staff (for ordering a chord).
 *
 * The octave belongs to the letter, as the staff position does: B♯3 is the key
 * of middle C and C♭4 the B below it. A black key with no spelling carried —
 * a model built by hand, since every note the extractor reads has one — is
 * named from its MIDI number, the old way; `expectedNote.test` checks that no
 * fixture reaches it.
 */
function writtenName(note: WrittenPitch): { name: string; place: number } {
  const shift = note.accidental === undefined ? 0 : ACCIDENTAL_SEMITONES[note.accidental];
  const natural = note.midi - shift;
  const letter = LETTERS[((natural % 12) + 12) % 12];
  const octave = Math.floor(natural / 12) - 1;
  if (!letter) {
    return { name: midiToNoteName(note.midi).replace('#', SIGNS.sharp), place: octave * 7 };
  }
  const sign = note.accidental === undefined ? '' : SIGNS[note.accidental];
  return { name: `${letter.name}${sign}${String(octave)}`, place: octave * 7 + letter.place };
}

/**
 * A note's name as the score writes it — "E♭5" — for the other places a
 * learner reads one: the key ribbon's label over a lit cell (C1, U44).
 */
export function writtenNoteName(note: WrittenPitch): string {
  return writtenName(note).name;
}

/**
 * "Waiting for F♯4", or the chord, or nothing at all.
 *
 * Empty when there is nothing to wait for — no expected notes, or a mode where
 * the clock drives and waiting is not a thing that happens.
 *
 * Each written note once: both hands on one key spelled one way is one name,
 * and one key spelled two ways in a chord (G♭ in one hand, F♯ in the other)
 * is two, because the learner is reading two notes.
 */
export function waitingForLine(notes: readonly WrittenPitch[]): string {
  const named = new Map<string, { midi: number; place: number }>();
  for (const note of notes) {
    const { name, place } = writtenName(note);
    if (!named.has(name)) named.set(name, { midi: note.midi, place });
  }
  // A chord is named low to high, which is the order a hand reads it in; one
  // key written two ways goes in staff order, the lower letter first.
  const names = [...named.entries()]
    .sort(([, a], [, b]) => a.midi - b.midi || a.place - b.place)
    .map(([name]) => name);
  if (names.length === 0) return '';
  return `Waiting for ${names.join(' + ')}`;
}
