/**
 * Which hand a note is in, and who decided — the file or the app.
 *
 * The converter has one rule for this and it is the Python's
 * (`tools/midi-cleanup/midi_to_musicxml.py`, `split = hands == "split" or
 * (hands == "auto" and len(raw) == 1)`):
 *
 * | note tracks | what happens |
 * |---|---|
 * | one | split by voice-leading — a recording of two hands on one channel |
 * | two | **kept as recorded**, first track upper staff, second lower |
 * | three or more | merged into one line, then split |
 *
 * The middle row is the one this file exists for. An arrangement downloaded
 * with a track per hand has been given its hands by a person; that assignment
 * is the authoritative one, and the port used to throw it away by merging
 * every track and splitting by ear. `crossed-hands.mid` is built so the two
 * answers differ — its second track climbs over its first in bars 3-4 — so a
 * test on it can fail, which a test on `two-hands.mid` cannot: that fixture's
 * tracks are exactly what the split produces.
 *
 * The third row is the port's one difference from the Python, which writes a
 * part per track where this writer writes a piano's two staves.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertMidi, readBackMusicXml } from '../../src/import/midi/convert';
import { barLengthOf, readMidi } from '../../src/import/midi/readMidi';
import { handsSentence } from '../../src/data/importStore';

const FIXTURES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'fixtures',
  'imports',
);
const CROSSED = new Uint8Array(readFileSync(path.join(FIXTURES, 'crossed-hands.mid')));

/** The highest note in `crossed-hands.mid`, written for the *second* track. */
const TOP_OF_THE_CROSSING = 81;
/** A bar 3 note of the *first* track, which sits under the crossing. */
const UNDER_THE_CROSSING = 52;

function convert(bytes: Uint8Array, hands?: 'auto' | 'split' | 'keep') {
  const conversion = convertMidi(bytes, {
    title: 'fixture',
    ...(hands === undefined ? {} : { hands }),
  });
  const read = readBackMusicXml(conversion.xml, barLengthOf(readMidi(bytes).timeSignature));
  /** 0 is the upper staff, 1 the lower. */
  const staffOf = (midi: number): number | undefined =>
    read.notes.find((note) => note.midi === midi)?.part;
  return { ...conversion, staffOf };
}

// A MIDI file written byte by byte, so what is being converted is known
// exactly — `midiParse.test.ts`'s reason, and the same builder in miniature.
function varlen(value: number): number[] {
  const out = [value & 0x7f];
  let rest = value >> 7;
  while (rest > 0) {
    out.unshift((rest & 0x7f) | 0x80);
    rest >>= 7;
  }
  return out;
}

function chunk(name: string, body: number[]): number[] {
  const id = [...name].map((c) => c.charCodeAt(0));
  const n = body.length;
  return [...id, (n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, ...body];
}

/** (onset, length, midi) in quarter notes, as one track of note-ons and offs. */
function noteTrack(name: string, notes: [number, number, number][]): number[] {
  const stamped: [number, number[]][] = [];
  for (const [at, length, midi] of notes) {
    stamped.push([Math.round(at * 480), [0x90, midi, 72]]);
    stamped.push([Math.round((at + length) * 480), [0x80, midi, 0]]);
  }
  stamped.sort((a, b) => a[0] - b[0]);
  const body: number[] = [
    ...varlen(0),
    0xff,
    0x03,
    name.length,
    ...[...name].map((c) => c.charCodeAt(0)),
  ];
  let now = 0;
  for (const [when, bytes] of stamped) {
    body.push(...varlen(when - now), ...bytes);
    now = when;
  }
  body.push(...varlen(0), 0xff, 0x2f, 0x00);
  return chunk('MTrk', body);
}

function buildMidi(tracks: number[][]): Uint8Array {
  const conductor = chunk('MTrk', [
    ...varlen(0),
    0xff,
    0x58,
    0x04,
    4,
    2,
    24,
    8,
    ...varlen(0),
    0xff,
    0x2f,
    0x00,
  ]);
  const header = chunk('MThd', [0, 1, 0, tracks.length + 1, (480 >> 8) & 0xff, 480 & 0xff]);
  return new Uint8Array([...header, ...conductor, ...tracks.flat()]);
}

describe('two note tracks — the arrangement already said which hand', () => {
  it('keeps the file’s own tracks, first as the upper staff and second as the lower', () => {
    const { report, staffOf } = convert(CROSSED);
    expect(report.noteTracks).toBe(2);
    expect(report.noteTrackNames).toEqual(['Piano', 'Piano']);
    // Not "split into two": nothing about the hands was decided here.
    expect(report.hands).toBe('2 as recorded');
    expect(report.parts).toEqual(['Piano', 'Piano']);
    // The discriminating pair. In bars 3-4 the second track climbs over the
    // first, so the *highest* note in the file belongs to the lower staff and
    // a note twenty-nine semitones under it to the upper. Register cannot
    // produce this answer; only reading the file's own tracks can.
    expect(staffOf(TOP_OF_THE_CROSSING)).toBe(1);
    expect(staffOf(UNDER_THE_CROSSING)).toBe(0);
  });

  it('is a different answer from the split, on this same file', () => {
    // Without this case the one above could be passing for the wrong reason —
    // `two-hands.mid` satisfies every assertion in it under either rule.
    const { report, staffOf } = convert(CROSSED, 'split');
    expect(report.hands).toBe('split into two');
    expect(report.parts).toEqual(['Right hand', 'Left hand']);
    expect(staffOf(TOP_OF_THE_CROSSING)).toBe(0);
    expect(staffOf(UNDER_THE_CROSSING)).toBe(1);
  });

  it('loses no note either way, and every bar still adds up', () => {
    for (const hands of ['auto', 'split'] as const) {
      const { report } = convert(CROSSED, hands);
      expect(report.notesIn).toBe(18);
      expect(report.lost).toEqual([]);
      expect(report.added).toEqual([]);
      expect(report.brokenBars).toEqual([]);
      expect(report.passed).toBe(true);
    }
  });

  it('says so on the sheet, in the words "as recorded"', () => {
    const sentence = handsSentence(convert(CROSSED).report);
    expect(sentence).toContain('kept as recorded');
    expect(sentence).toContain('the arrangement’s own answer');
    // The three things that would be lies about a file whose hands were kept.
    expect(sentence).not.toContain('merged');
    expect(sentence).not.toContain('shape of the lines');
    expect(sentence).not.toContain('crossing');
  });
});

describe('one note track — nobody has said which hand', () => {
  // A recording of two hands on one channel, which is what the three
  // Disklavier captures are.
  const oneTrack = buildMidi([
    noteTrack('Piano', [
      [0, 1, 72],
      [0, 4, 48],
      [1, 1, 74],
      [2, 1, 76],
      [3, 1, 77],
      [4, 4, 43],
      [4, 2, 79],
      [6, 2, 76],
    ]),
  ]);

  it('splits it by the shape of the lines', () => {
    const { report } = convert(oneTrack);
    expect(report.noteTracks).toBe(1);
    expect(report.hands).toBe('split into two');
    expect(report.parts).toEqual(['Right hand', 'Left hand']);
    expect(report.handMedian.left).toBeLessThan(report.handMedian.right ?? 0);
  });

  it('says on the sheet that the app decided, and where it is most often wrong', () => {
    const sentence = handsSentence(convert(oneTrack).report);
    expect(sentence).toContain('shape of the lines');
    expect(sentence).toContain('crossing of the hands');
    // One track was not merged with anything.
    expect(sentence).not.toContain('merged');
  });
});

describe('three or more note tracks — a voice per track, not a hand', () => {
  // A melody and two accompaniment voices: the file is no longer saying "this
  // hand", and a piano has two staves where music21 would write three parts.
  const threeTracks = buildMidi([
    noteTrack('Melody', [
      [0, 1, 76],
      [1, 1, 77],
      [2, 2, 79],
      [4, 4, 76],
    ]),
    noteTrack('Inner', [
      [0, 2, 64],
      [2, 2, 65],
      [4, 4, 67],
    ]),
    noteTrack('Bass', [
      [0, 4, 48],
      [4, 4, 43],
    ]),
  ]);

  it('merges them and then splits, because the writer writes a piano', () => {
    const { report } = convert(threeTracks);
    expect(report.noteTracks).toBe(3);
    expect(report.noteTrackNames).toEqual(['Melody', 'Inner', 'Bass']);
    expect(report.hands).toBe('split into two');
    expect(report.parts).toEqual(['Right hand', 'Left hand']);
    expect(report.passed).toBe(true);
  });

  it('says on the sheet that they were merged, and why', () => {
    const sentence = handsSentence(convert(threeTracks).report);
    expect(sentence).toContain('3 tracks with notes in them (Melody, Inner, Bass)');
    expect(sentence).toContain('more than a piano’s two staves');
    expect(sentence).toContain('merged into one line first');
  });

  it('refuses rather than writing three staves when the caller insists on keeping them', () => {
    expect(() => convert(threeTracks, 'keep')).toThrow(/two staves/);
  });
});
