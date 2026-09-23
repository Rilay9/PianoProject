/**
 * What the MusicXML writer had to grow for the MIDI import (T29 part 3).
 *
 * The writer already wrote ties, tuplets, two staves and chords — this checks
 * that it still does *and* that the three new things work: a note-head for any
 * length the import's rhythm rule admits (`noteShape`), a spelling per pitch
 * class rather than a preference between two black-key names, and a file with
 * no tempo in it when the source states none.
 */
import { describe, expect, it } from 'vitest';
import {
  DIVISIONS,
  noteShape,
  spelledPitch,
  writeMusicXml,
  type WriterNote,
} from '../../src/engine/musicXmlWriter';

const note = (over: Partial<WriterNote> = {}): WriterNote => ({
  midi: 60,
  duration: DIVISIONS,
  type: 'quarter',
  ...over,
});

describe('a note-head for a length', () => {
  it('names the plain values', () => {
    expect(noteShape(DIVISIONS * 4)).toEqual({ type: 'whole', dotted: false });
    expect(noteShape(DIVISIONS)).toEqual({ type: 'quarter', dotted: false });
    expect(noteShape(DIVISIONS / 4)).toEqual({ type: '16th', dotted: false });
  });

  it('names the dotted ones', () => {
    expect(noteShape(DIVISIONS * 1.5)).toEqual({ type: 'quarter', dotted: true });
    expect(noteShape(DIVISIONS * 0.75)).toEqual({ type: 'eighth', dotted: true });
  });

  it('names a triplet with the claim that makes it one', () => {
    // A triplet is not a duration, it is a duration *plus* what it is in the
    // time of: four divisions with no `<time-modification>` is a twelfth note.
    expect(noteShape(DIVISIONS / 3)).toEqual({
      type: 'eighth',
      dotted: false,
      tuplet: { actual: 3, normal: 2 },
    });
    // A twelfth of a quarter — the shortest slice a bar of sixteenths beside a
    // bar of triplets produces.
    expect(noteShape(1)).toEqual({
      type: '32nd',
      dotted: false,
      tuplet: { actual: 3, normal: 2 },
    });
  });

  it('answers null for a length no note-head carries', () => {
    expect(noteShape(5)).toBeNull(); // five twelfths of a quarter
    expect(noteShape(DIVISIONS * 7)).toBeNull(); // a double-dotted whole
  });
});

describe('spelling a pitch class', () => {
  it('sets the octave from the letter, not from the MIDI number', () => {
    // B sharp 3 sounds as C 4, so the octave follows the letter or the note is
    // engraved an octave out.
    expect(spelledPitch(60, { step: 'B', alter: 1 })).toEqual({ step: 'B', alter: 1, octave: 3 });
    expect(spelledPitch(60, { step: 'C', alter: 0 })).toEqual({ step: 'C', alter: 0, octave: 4 });
    // And the other way: C flat 4 sounds as B 3, so the octave goes up where
    // the letter does. (This line asserted octave 5 when it was written, which
    // is what a MIDI number rather than a letter would give.)
    expect(spelledPitch(59, { step: 'C', alter: -1 })).toEqual({ step: 'C', alter: -1, octave: 4 });
  });

  it('writes the spelling the key asked for, whatever the signature says', () => {
    const xml = writeMusicXml({
      title: 'spelling',
      fifths: 0,
      beats: 4,
      beatType: 4,
      bpm: 120,
      staves: 1,
      // C blues: E flat, F sharp and B flat, which no single preference writes.
      spelling: { 3: { step: 'E', alter: -1 }, 6: { step: 'F', alter: 1 } },
      measures: [{ notes: [note({ midi: 63 }), note({ midi: 66 })] }],
    });
    expect(xml).toContain('<step>E</step>');
    expect(xml).toContain('<alter>-1</alter>');
    expect(xml).toContain('<step>F</step>');
    expect(xml).toContain('<alter>1</alter>');
  });
});

describe('a two-staff part', () => {
  const xml = writeMusicXml({
    title: 'two hands',
    partName: 'Piano',
    composer: 'Nobody in particular',
    fifths: -1,
    beats: 3,
    beatType: 4,
    bpm: null,
    staves: 2,
    measures: [
      {
        notes: [
          note({ midi: 72, staff: 1, tie: 'start', duration: DIVISIONS * 3, type: 'half', dotted: true }),
          note({ midi: 48, staff: 2, voice: 2 }),
          note({ midi: 52, staff: 2, voice: 2, chord: true }),
          note({ midi: null, staff: 2, voice: 2, duration: DIVISIONS * 2, type: 'half' }),
        ],
      },
      {
        notes: [
          note({ midi: 72, staff: 1, tie: 'stop', duration: DIVISIONS * 3, type: 'half', dotted: true }),
          note({ midi: 48, staff: 2, voice: 2, duration: DIVISIONS * 3, type: 'half', dotted: true }),
        ],
      },
    ],
  });

  it('is one instrument on two staves, which is what a piano is', () => {
    // Two `<part>` elements would be two instruments, and the app reads the
    // hand off the printed staff.
    expect(xml.match(/<score-part /g)).toHaveLength(1);
    expect(xml).toContain('<staves>2</staves>');
    expect(xml).toContain('<clef number="2"><sign>F</sign><line>4</line></clef>');
  });

  it('goes back to the other staff by exactly what the first one used', () => {
    // A chord member adds no time, so it must not be counted in the backup or
    // the staves drift apart.
    expect(xml).toContain(`<backup><duration>${String(DIVISIONS * 3)}</duration></backup>`);
  });

  it('writes both halves of a tie, the sound and the engraving', () => {
    expect(xml).toContain('<tie type="start"/>');
    expect(xml).toContain('<tied type="start"/>');
    expect(xml).toContain('<tie type="stop"/>');
    expect(xml).toContain('<tied type="stop"/>');
  });

  it('writes no tempo when the source states none, and does name the composer', () => {
    expect(xml).not.toContain('<sound tempo=');
    expect(xml).not.toContain('<metronome>');
    expect(xml).toContain('<creator type="composer">Nobody in particular</creator>');
  });
});
