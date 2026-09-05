/**
 * The translation between how the catalog talks and how the engine counts
 * (docs/05 §7, P8).
 *
 * A drill that says "C, F and G" and then asks for B♭m7 is worse than no
 * drill: the learner cannot tell whether they are wrong or the app is. So the
 * parsing gets its own tests, separate from the drills that use it.
 */
import { describe, expect, it } from 'vitest';
import {
  buildRhythm,
  intervalNameToSemitones,
  noteNameToMidi,
  noteNameToPitchClass,
  parseChordSymbol,
  parseTimeSignature,
  romanToChord,
} from '../../src/engine/drills/theory';
import { makeRng } from '../../src/engine/sightReading';

describe('noteNameToMidi', () => {
  it('reads the names the catalog uses', () => {
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('A0')).toBe(21);
    expect(noteNameToMidi('C8')).toBe(108);
    expect(noteNameToMidi('F2')).toBe(41);
    expect(noteNameToMidi('G5')).toBe(79);
  });

  it('reads both accidental spellings, including music21’s "-" for a flat', () => {
    expect(noteNameToMidi('C#4')).toBe(61);
    expect(noteNameToMidi('C♯4')).toBe(61);
    expect(noteNameToMidi('B-3')).toBe(58);
    expect(noteNameToMidi('B♭3')).toBe(58);
    expect(noteNameToMidi('D--4')).toBe(60);
  });

  it('refuses what it cannot read rather than guessing', () => {
    expect(noteNameToMidi('H4')).toBeNull();
    expect(noteNameToMidi('Bb4')).toBeNull(); // `b` is a note, not a flat
    expect(noteNameToMidi('C')).toBeNull();
    expect(noteNameToMidi('')).toBeNull();
  });

  it('reads "C-2" as C-flat in octave 2, not as octave minus two', () => {
    // Genuinely ambiguous, and the catalog decides it: the content pipeline is
    // music21, which spells a flat "-". So the accidental wins.
    expect(noteNameToMidi('C-2')).toBe(35);
    expect(noteNameToMidi('C-1')).toBe(23);
  });

  it('rejects a pitch outside MIDI 0..127', () => {
    expect(noteNameToMidi('G9')).toBe(127);
    expect(noteNameToMidi('A9')).toBeNull();
    expect(noteNameToMidi('C10')).toBeNull();
    // A negative octave is unreachable by design: the accidental group eats a
    // leading "-", so "C-1" is C-flat in octave 1 and never octave minus one.
    expect(noteNameToMidi('C-1')).toBe(23);
  });
});

describe('noteNameToPitchClass', () => {
  it('reads a bare name', () => {
    expect(noteNameToPitchClass('C')).toBe(0);
    expect(noteNameToPitchClass('B-')).toBe(10);
    expect(noteNameToPitchClass('F♯')).toBe(6);
  });
});

describe('parseChordSymbol', () => {
  it('parses the symbols the catalog lists', () => {
    expect(parseChordSymbol('C')?.pitches).toEqual([60, 64, 67]);
    expect(parseChordSymbol('Am')?.pitches).toEqual([69, 72, 76]);
    expect(parseChordSymbol('E7')?.pitches).toEqual([64, 68, 71, 74]);
    expect(parseChordSymbol('Dm')?.pitches).toEqual([62, 65, 69]);
  });

  it('parses the seventh qualities of the ear drill', () => {
    expect(parseChordSymbol('Cmaj7')?.pitches).toEqual([60, 64, 67, 71]);
    expect(parseChordSymbol('Cm7')?.pitches).toEqual([60, 63, 67, 70]);
    expect(parseChordSymbol('Cm7b5')?.pitches).toEqual([60, 63, 66, 70]);
  });

  it('voices from the given octave root, upwards', () => {
    const low = parseChordSymbol('C', 48);
    expect(low?.pitches).toEqual([48, 52, 55]);
    // B♭ above C3 is the B♭ in that octave, not the one below it.
    expect(parseChordSymbol('B-', 48)?.pitches).toEqual([58, 62, 65]);
  });

  it('returns null for a quality it does not know', () => {
    expect(parseChordSymbol('Cwibble')).toBeNull();
    expect(parseChordSymbol('')).toBeNull();
  });
});

describe('romanToChord', () => {
  it('reads case as quality, the way the page does', () => {
    expect(romanToChord('I', 0)?.pitches).toEqual([60, 64, 67]);
    expect(romanToChord('ii', 0)?.pitches).toEqual([62, 65, 69]);
    expect(romanToChord('IV', 0)?.pitches).toEqual([65, 69, 72]);
    expect(romanToChord('V7', 0)?.pitches).toEqual([67, 71, 74, 77]);
    expect(romanToChord('vi', 0)?.pitches).toEqual([69, 72, 76]);
  });

  it('transposes to the key', () => {
    // V in G is D major.
    expect(romanToChord('V', 7)?.pitches).toEqual([62, 66, 69]);
  });

  it('handles the diminished seventh degree', () => {
    expect(romanToChord('vii°', 0)?.pitches).toEqual([71, 74, 77]);
  });

  it('returns null for a numeral it cannot read', () => {
    expect(romanToChord('XIV', 0)).toBeNull();
    expect(romanToChord('', 0)).toBeNull();
  });
});

describe('intervalNameToSemitones', () => {
  it('reads the names the ear drill lists', () => {
    expect(intervalNameToSemitones('m2')).toBe(1);
    expect(intervalNameToSemitones('M2')).toBe(2);
    expect(intervalNameToSemitones('m3')).toBe(3);
    expect(intervalNameToSemitones('M3')).toBe(4);
    expect(intervalNameToSemitones('P5')).toBe(7);
    expect(intervalNameToSemitones('P8')).toBe(12);
  });

  it('accepts a plain semitone count, and refuses nonsense', () => {
    expect(intervalNameToSemitones('7')).toBe(7);
    expect(intervalNameToSemitones('wide')).toBeNull();
  });
});

describe('parseTimeSignature', () => {
  it('reads a signature and falls back to 4/4', () => {
    expect(parseTimeSignature('6/8')).toEqual({ beats: 6, beatType: 8 });
    expect(parseTimeSignature('3/4')).toEqual({ beats: 3, beatType: 4 });
    expect(parseTimeSignature(undefined)).toEqual({ beats: 4, beatType: 4 });
    expect(parseTimeSignature('nonsense')).toEqual({ beats: 4, beatType: 4 });
  });
});

describe('buildRhythm', () => {
  it('fills every bar exactly, and never overflows one', () => {
    for (const beatsPerBar of [3, 4, 6]) {
      const events = buildRhythm(
        ['quarter', 'half', 'eighth', 'dotted-half', 'whole'],
        beatsPerBar,
        4,
        makeRng(7),
      );
      for (let bar = 0; bar < 4; bar += 1) {
        const inBar = events.filter(
          (event) => event.beat >= bar * beatsPerBar && event.beat < (bar + 1) * beatsPerBar,
        );
        const total = inBar.reduce((sum, event) => sum + event.beats, 0);
        expect(total).toBeCloseTo(beatsPerBar, 5);
      }
    }
  });

  it('marks rests, which are timed but not tapped', () => {
    const events = buildRhythm(['quarter', 'quarter-rest'], 4, 2, makeRng(3));
    expect(events.some((event) => event.rest)).toBe(true);
    expect(events.every((event) => event.beats === 1)).toBe(true);
  });

  it('is deterministic from the seed', () => {
    const first = buildRhythm(['quarter', 'eighth', 'half'], 4, 4, makeRng(42));
    const second = buildRhythm(['quarter', 'eighth', 'half'], 4, 4, makeRng(42));
    expect(second).toEqual(first);
  });

  it('falls back to quarters when handed values it does not know', () => {
    const events = buildRhythm(['wibble'], 4, 1, makeRng(1));
    expect(events).toHaveLength(4);
    expect(events.every((event) => event.value === 'quarter')).toBe(true);
  });
});
