/**
 * The MIDI reader and the note-track merge (T29 part 1).
 *
 * Hand-built files, byte by byte, so what is being read is known exactly: a
 * fixture converted from something else would make this a test of that
 * something else. Each case names the rule in `read_midi` it pins.
 */
import { describe, expect, it } from 'vitest';
import {
  MidiReadError,
  beatLengthOf,
  barLengthOf,
  mergeNoteTracks,
  readMidi,
  trackWithTheNotes,
} from '../../src/import/midi/readMidi';
import { type Frac, frac, fracToString, sub, toNumber } from '../../src/import/midi/fraction';

/** One event in a track: its delta time in ticks and its bytes. */
interface Written {
  delta: number;
  bytes: number[];
}

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

function buildMidi(tracks: Written[][], division = 480, format = 1): Uint8Array {
  const header = chunk('MThd', [0, format, 0, tracks.length, (division >> 8) & 0xff, division & 0xff]);
  const bodies = tracks.flatMap((events) =>
    chunk('MTrk', [
      ...events.flatMap((event) => [...varlen(event.delta), ...event.bytes]),
      ...varlen(0),
      0xff,
      0x2f,
      0x00,
    ]),
  );
  return new Uint8Array([...header, ...bodies]);
}

const trackName = (name: string): number[] => [
  0xff,
  0x03,
  name.length,
  ...[...name].map((c) => c.charCodeAt(0)),
];
const setTempo = (micros: number): number[] => [
  0xff,
  0x51,
  0x03,
  (micros >> 16) & 0xff,
  (micros >> 8) & 0xff,
  micros & 0xff,
];
const timeSignature = (beats: number, power: number): number[] => [
  0xff,
  0x58,
  0x04,
  beats,
  power,
  24,
  8,
];
const keySignature = (sharps: number): number[] => [0xff, 0x59, 0x02, sharps & 0xff, 0];
const noteOn = (midi: number, velocity = 64): number[] => [0x90, midi, velocity];
const noteOff = (midi: number): number[] => [0x80, midi, 0];

const starts = (events: { start: Frac }[]): string[] =>
  events.map((event) => fracToString(event.start));

describe('the MIDI reader', () => {
  const file = buildMidi([
    [
      { delta: 0, bytes: trackName('conductor') },
      { delta: 0, bytes: setTempo(500_000) },
      { delta: 0, bytes: timeSignature(3, 2) },
      { delta: 0, bytes: keySignature(-2) },
    ],
    [
      { delta: 0, bytes: trackName('the music') },
      { delta: 0, bytes: noteOn(60) },
      { delta: 480, bytes: noteOff(60) },
      // A release written as a Note-On with velocity 0, which is how most
      // files spell it.
      { delta: 0, bytes: noteOn(62) },
      { delta: 240, bytes: noteOn(62, 0) },
      // The same pitch struck again while it is still down: one string, and
      // the file is saying "again".
      { delta: 0, bytes: noteOn(64) },
      { delta: 480, bytes: noteOn(64) },
      { delta: 480, bytes: noteOff(64) },
      // Left down when the track ends.
      { delta: 0, bytes: noteOn(67) },
    ],
  ]);

  it('reads onsets and releases in quarter notes, not in ticks', () => {
    const contents = readMidi(file);
    const events = contents.tracks[1]?.events ?? [];
    expect(starts(events)).toEqual(['0', '1', '3/2', '5/2', '7/2']);
    expect(events.map((event) => event.midi)).toEqual([60, 62, 64, 64, 67]);
    expect(events.map((event) => fracToString(event.end))).toEqual(['1', '3/2', '5/2', '7/2', '15/4']);
  });

  it('takes the tempo, the metre and the key signature from the conductor track', () => {
    const contents = readMidi(file);
    expect(contents.tempo).toBe(120);
    expect(contents.timeSignature).toEqual({ beats: 3, beatType: 4 });
    expect(contents.hadTimeSignature).toBe(true);
    expect(contents.keySignatures).toEqual(['2 flats']);
    expect(contents.tracks[0]?.name).toBe('conductor');
    expect(contents.tracks[1]?.name).toBe('the music');
  });

  it('names the one track with the notes in it', () => {
    // The conductor track has four events and none of them sounds.
    expect(trackWithTheNotes(readMidi(file))).toBe(1);
    expect(readMidi(file).tracks[0]?.events).toEqual([]);
  });

  it('gives a note still down at the end of the track a length rather than dropping it', () => {
    const contents = readMidi(file);
    const last = contents.tracks[1]?.events.at(-1);
    expect(last?.midi).toBe(67);
    // A sixteenth past its onset, because nothing in the file is later.
    expect(toNumber(sub(last?.end ?? frac(0), last?.start ?? frac(0)))).toBeCloseTo(0.25, 9);
  });

  it('follows running status, where a message leaves its status byte out', () => {
    const running = buildMidi([
      [
        { delta: 0, bytes: noteOn(60) },
        { delta: 240, bytes: [62, 64] },
        { delta: 240, bytes: [60, 0] },
        { delta: 0, bytes: [62, 0] },
      ],
    ]);
    const events = readMidi(running).tracks[0]?.events ?? [];
    expect(events.map((event) => event.midi)).toEqual([60, 62]);
    expect(starts(events)).toEqual(['0', '1/2']);
  });

  it('skips a SysEx block by its own length instead of reading it as notes', () => {
    const sysex = buildMidi([
      [
        { delta: 0, bytes: [0xf0, 0x04, 0x7e, 0x7f, 0x09, 0x01] },
        { delta: 0, bytes: noteOn(72) },
        { delta: 480, bytes: noteOff(72) },
      ],
    ]);
    const events = readMidi(sysex).tracks[0]?.events ?? [];
    expect(events.map((event) => event.midi)).toEqual([72]);
  });

  it('says what is wrong with a file that is not MIDI at all', () => {
    const text = new TextEncoder().encode('this is not a MIDI file, it is a sentence.');
    expect(() => readMidi(text)).toThrow(MidiReadError);
    expect(() => readMidi(text)).toThrow(/does not start with a MIDI header/);
  });

  it('tells a truncated MIDI file apart from a file that is not MIDI', () => {
    // Different sentences because they send you to different places: export it
    // again, or copy it again.
    const header = new Uint8Array([0x4d, 0x54, 0x68, 0x64]);
    expect(() => readMidi(header)).toThrow(/stops inside its header/);
    expect(() => readMidi(header)).toThrow(/copy it again/);
  });

  it('assumes four four when the file states no metre, and says it assumed', () => {
    const bare = buildMidi([[{ delta: 0, bytes: noteOn(60) }, { delta: 480, bytes: noteOff(60) }]]);
    const contents = readMidi(bare);
    expect(contents.hadTimeSignature).toBe(false);
    expect(contents.timeSignature).toEqual({ beats: 4, beatType: 4 });
    expect(contents.tempo).toBeNull();
  });

  it('measures a bar and a beat the way music21 does, compound metres included', () => {
    expect(fracToString(barLengthOf({ beats: 4, beatType: 4 }))).toBe('4');
    expect(fracToString(beatLengthOf({ beats: 4, beatType: 4 }))).toBe('1');
    expect(fracToString(barLengthOf({ beats: 6, beatType: 8 }))).toBe('3');
    expect(fracToString(beatLengthOf({ beats: 6, beatType: 8 }))).toBe('3/2');
    expect(fracToString(beatLengthOf({ beats: 7, beatType: 8 }))).toBe('1/2');
    expect(fracToString(beatLengthOf({ beats: 2, beatType: 2 }))).toBe('2');
  });
});

describe('merging the note tracks', () => {
  /** A track per hand, which is what a downloaded file usually carries. */
  const twoHands = buildMidi([
    [{ delta: 0, bytes: timeSignature(4, 2) }],
    [
      { delta: 0, bytes: trackName('Right hand') },
      { delta: 0, bytes: noteOn(72) },
      { delta: 240, bytes: noteOff(72) },
      { delta: 0, bytes: noteOn(74) },
      { delta: 240, bytes: noteOff(74) },
    ],
    [
      { delta: 0, bytes: trackName('Left hand') },
      { delta: 0, bytes: noteOn(48) },
      { delta: 480, bytes: noteOff(48) },
    ],
  ]);

  it('keeps every note of every track and orders them by onset', () => {
    const contents = readMidi(twoHands);
    const merged = mergeNoteTracks(contents);
    expect(merged.merged).toBe(2);
    expect(merged.names).toEqual(['Right hand', 'Left hand']);
    expect(merged.events).toHaveLength(3);
    expect(merged.events.map((event) => event.midi)).toEqual([48, 72, 74]);
    expect(starts(merged.events)).toEqual(['0', '0', '1/2']);
  });

  it('is the only reading that merges: the tracks on their own are still two', () => {
    // Said as its own case, because "merged 3 notes" would also be true of a
    // reader that had thrown one track away and doubled another.
    const contents = readMidi(twoHands);
    const withNotes = contents.tracks.filter((track) => track.events.length > 0);
    expect(withNotes.map((track) => track.events.length)).toEqual([2, 1]);
    expect(trackWithTheNotes(contents)).toBe(-1);
  });

  it('leaves a single note track alone and says nothing was merged', () => {
    const one = buildMidi([
      [{ delta: 0, bytes: timeSignature(4, 2) }],
      [
        { delta: 0, bytes: noteOn(60) },
        { delta: 480, bytes: noteOff(60) },
      ],
    ]);
    const merged = mergeNoteTracks(readMidi(one));
    expect(merged.merged).toBe(1);
    expect(merged.events).toHaveLength(1);
    expect(merged.name).toBe('Part 2');
  });

  it('keeps the file order of two notes struck at the same instant on the same pitch', () => {
    // Two tracks doubling one pitch: nothing is dropped here, and the
    // quantiser's `separateRepeats` is what pulls them apart.
    const doubled = buildMidi([
      [
        { delta: 0, bytes: noteOn(60) },
        { delta: 480, bytes: noteOff(60) },
      ],
      [
        { delta: 0, bytes: noteOn(60) },
        { delta: 240, bytes: noteOff(60) },
      ],
    ]);
    const merged = mergeNoteTracks(readMidi(doubled));
    expect(merged.events).toHaveLength(2);
    expect(merged.events.map((event) => fracToString(event.end))).toEqual(['1', '1/2']);
  });
});
