/**
 * Durations that are rhythms, and the slices built from them (T29 parts 2–3).
 *
 * The cases are `tools/midi-cleanup/tests/test_converter.py`'s: five twelfths
 * and five sixteenths are not rhythms, an unnotatable length is cut into ones
 * that are and nothing is lost in the cutting, and a held note on a triplet
 * grid comes back as tied pieces a reader could play.
 */
import { describe, expect, it } from 'vitest';
import { isNotatable, notatablePieces } from '../../src/import/midi/notatable';
import { sliceIntoChords } from '../../src/import/midi/slice';
import type { NoteEvent } from '../../src/import/midi/readMidi';
import { type Frac, add, frac, fracToString, eq, limitDenominator, ZERO } from '../../src/import/midi/fraction';

const total = (pieces: Frac[]): Frac => pieces.reduce((sum, piece) => add(sum, piece), ZERO);

describe('what one note-head can carry', () => {
  it('admits a dotted eighth and a triplet eighth', () => {
    expect(isNotatable(frac(3, 4))).toBe(true);
    expect(isNotatable(frac(1, 3))).toBe(true);
    expect(isNotatable(frac(1, 12))).toBe(true);
  });

  it('refuses five twelfths and five sixteenths', () => {
    // music21 writes 5/12 as a 6:5 tuplet and 5/16 as a complex duration; the
    // first is not a rhythm and the second is what the exporter throws on.
    expect(isNotatable(frac(5, 12))).toBe(false);
    expect(isNotatable(frac(5, 16))).toBe(false);
  });

  it('refuses a length with two dots, and a zero or negative one', () => {
    expect(isNotatable(frac(7, 2))).toBe(false); // double-dotted half
    expect(isNotatable(frac(0))).toBe(false);
    expect(isNotatable(frac(-1))).toBe(false);
  });

  it('admits the long values a whole bar can need', () => {
    expect(isNotatable(frac(4))).toBe(true); // a whole note
    expect(isNotatable(frac(6))).toBe(true); // dotted whole, a 6/4 bar
    expect(isNotatable(frac(3))).toBe(true); // dotted half, a 3/4 bar
  });
});

describe('cutting a length into rhythms', () => {
  it('loses nothing, and every piece is a rhythm', () => {
    const cases: [Frac, Frac, Frac][] = [
      [frac(0), frac(5, 12), frac(1, 12)],
      [frac(1, 4), frac(5, 16), frac(1, 4)],
      [frac(1, 2), frac(7, 12), frac(1, 12)],
    ];
    for (const [start, length, unit] of cases) {
      const pieces = notatablePieces(start, length, unit, frac(1));
      expect(fracToString(total(pieces))).toBe(fracToString(length));
      for (const piece of pieces) {
        expect(isNotatable(piece)).toBe(true);
      }
    }
  });

  it('cuts at the next beat first, because a note tied across a beat reads', () => {
    // Three quarters of a beat left of the beat, a whole beat of it: the first
    // piece ends on the beat rather than being shortened onto the grid.
    const pieces = notatablePieces(frac(3, 4), frac(5, 4), frac(1, 4), frac(1));
    expect(pieces.map(fracToString)).toEqual(['1/4', '1']);
    expect(eq(total(pieces), frac(5, 4))).toBe(true);
  });

  it('hands back a length the grid cannot express rather than altering it', () => {
    // The last resort, said out loud: the written-file check reports it
    // instead of this function hiding it.
    const pieces = notatablePieces(frac(0), frac(5, 7), frac(1, 7), frac(1));
    expect(pieces.map(fracToString)).toEqual(['5/7']);
    expect(isNotatable(pieces[0] ?? frac(0))).toBe(false);
  });
});

describe('cutting the line into chords', () => {
  const ev = (start: number, end: number, midi: number): NoteEvent => ({
    start: limitDenominator(start, 1000),
    end: limitDenominator(end, 1000),
    midi,
    velocity: 64,
  });

  it('cuts a held note on a triplet grid into rhythms and ties them', () => {
    // Five thirds of a beat, held. It is on the grid and it is not a rhythm:
    // music21 exports it as a 6:5 tuplet, and seven thirds as a 12:7 — the
    // shape that made every one of the three real recordings throw
    // "Cannot convert inexpressible durations to MusicXML".
    expect(isNotatable(frac(5, 3))).toBe(false);
    const events = [ev(0, 5 / 3, 48), ev(5 / 3, 7 / 3, 55)];
    const line = sliceIntoChords(events, frac(4), frac(1), () => frac(1, 3));
    expect(line.length).toBeGreaterThan(events.length);
    expect(fracToString(total(line.map((slice) => slice.length)))).toBe('7/3');
    for (const slice of line) expect(isNotatable(slice.length)).toBe(true);
  });

  it('ties the pieces of one held note and leaves a struck one alone', () => {
    const line = sliceIntoChords([ev(0, 5 / 3, 48), ev(5 / 3, 7 / 3, 55)], frac(4), frac(1), () =>
      frac(1, 3),
    );
    const held = line.filter((slice) => slice.notes.some((note) => note.midi === 48));
    expect(held.length).toBeGreaterThan(1);
    expect(held[0]?.notes[0]?.tie).toBe('start');
    expect(held.at(-1)?.notes[0]?.tie).toBe('stop');
    // The second note is struck, not carried: no tie on it at all.
    const struck = line.filter((slice) => slice.notes.some((note) => note.midi === 55));
    expect(struck.every((slice) => slice.notes.every((note) => note.tie !== 'stop'))).toBe(true);
  });

  it('puts a barline between two slices rather than letting a chord cross one', () => {
    const line = sliceIntoChords([ev(3, 5, 60)], frac(4), frac(1), () => frac(1, 4));
    expect(line.map((slice) => fracToString(slice.at))).toEqual(['3', '4']);
    expect(line[0]?.notes[0]?.tie).toBe('start');
    expect(line[1]?.notes[0]?.tie).toBe('stop');
  });
});
