/**
 * The port against the converter it is a port of (T29 part 2).
 *
 * `app/src/import/midi/` is a TypeScript port of
 * `tools/midi-cleanup/midi_to_musicxml.py`, function for function. A port is
 * only a port if it agrees, so this reads what the Python decided — stage by
 * stage, per fixture — and asserts the same answers.
 *
 * **What the reference is.** `tools/midi-cleanup/tests/parity_reference.py`
 * writes one JSON file per fixture into `build/midi-parity/`: the three
 * Disklavier performances in `build/midi-real/` converted with `hands=split`,
 * and the committed exercise `exercise.five-finger.c-major.both.mxl` rendered
 * to MIDI twice — clean, and with every onset and release nudged — and
 * converted with `hands=keep`, which are the two cases `test_converter.py`
 * itself runs. `build/` is gitignored (the recordings are not redistributable,
 * and `build/midi-real/SOURCE.md` says so), so these tests **skip with a
 * message naming the script** rather than passing when it has not been run.
 *
 * **What parity proves.** That the port decides what the converter decides.
 * It says nothing about whether either is right about the music — nothing here
 * is heard — and nothing about the engraving: that is
 * `converted-import.spec.ts`, which puts the output through the app's own door.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fracToString } from '../../src/import/midi/fraction';
import {
  type NoteEvent,
  barLengthOf,
  beatLengthOf,
  readMidi,
} from '../../src/import/midi/readMidi';
import { quantise } from '../../src/import/midi/quantise';
import { splitHands } from '../../src/import/midi/handSplit';
import { convertMidi, readBackMusicXml } from '../../src/import/midi/convert';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..', '..');
const PARITY = path.join(REPO, 'build', 'midi-parity');
const REAL = path.join(REPO, 'build', 'midi-real');

interface Reference {
  source: string;
  hands: 'split' | 'keep' | 'auto';
  respell: boolean;
  timeSignature: [number, number];
  hadTimeSignature: boolean;
  tempo: number | null;
  keySignatures: string[];
  tracks: { index: number; name: string | null; noteCount: number; events: EventJson[] }[];
  quantised: EventJson[];
  gridByBar: string[];
  swing: { swung: boolean; near_swung: number; near_straight: number; on_beat_share: number };
  moved: string;
  handSplit: { right: EventJson[]; left: EventJson[]; boundary: [string, string][] } | null;
  parts: { name: string; events: EventJson[] }[];
  estimatedKey: string;
  key: string;
  notesIn: number;
  lost: string[];
  added: string[];
  brokenBars: string[];
  sounding: [number, string, number, string][];
  renderedFrom?: string;
}

type EventJson = [string, string, number, number | null];

const references: { name: string; reference: Reference; midi: Uint8Array }[] = [];
let why = '';
if (existsSync(PARITY)) {
  for (const file of readdirSync(PARITY).filter((name) => name.endsWith('.json'))) {
    const reference = JSON.parse(readFileSync(path.join(PARITY, file), 'utf8')) as Reference;
    const source = reference.renderedFrom
      ? path.join(PARITY, reference.source)
      : path.join(REAL, reference.source);
    if (!existsSync(source)) continue;
    references.push({
      name: file.replace(/\.json$/, ''),
      reference,
      midi: new Uint8Array(readFileSync(source)),
    });
  }
}
if (references.length === 0) {
  why =
    `no reference in ${PARITY}: run \`python tools/midi-cleanup/tests/parity_reference.py\` ` +
    'from the repository root, with the three MAESTRO performances named in ' +
    'build/midi-real/SOURCE.md in place.';
}

const asEvents = (rows: EventJson[]): EventJson[] => rows;
const eventsOf = (events: NoteEvent[]): EventJson[] =>
  events.map((event) => [fracToString(event.start), fracToString(event.end), event.midi, event.velocity]);

describe.skipIf(references.length === 0)('the port agrees with the Python converter', () => {
  it('has a reference to compare against', () => {
    // Said out loud: an empty list of fixtures would make every case below
    // vacuously true, and `skipIf` above is what stops that being silent.
    expect(references.length).toBeGreaterThan(0);
  });

  for (const { name, reference, midi } of references) {
    describe(name, () => {
      const contents = readMidi(midi);
      const ts = { beats: reference.timeSignature[0], beatType: reference.timeSignature[1] };
      const barLength = barLengthOf(contents.timeSignature);
      const beat = beatLengthOf(contents.timeSignature);
      const raw = contents.tracks.filter((track) => track.events.length > 0);
      const flat = raw.flatMap((track) => track.events);
      const report = quantise(flat, { barLength, beat, divisors: [4, 3], swing: null });

      it('reads the same tracks, note for note', () => {
        expect(contents.tracks.map((track) => track.events.length)).toEqual(
          reference.tracks.map((track) => track.noteCount),
        );
        expect(contents.tracks.map((track) => track.name)).toEqual(
          reference.tracks.map((track) => track.name),
        );
        for (const [index, track] of contents.tracks.entries()) {
          expect(eventsOf(track.events)).toEqual(asEvents(reference.tracks[index]?.events ?? []));
        }
      });

      it('reads the same metre, tempo and key signatures', () => {
        expect(contents.timeSignature).toEqual(ts);
        expect(contents.hadTimeSignature).toBe(reference.hadTimeSignature);
        if (reference.tempo === null) expect(contents.tempo).toBeNull();
        else expect(contents.tempo).toBeCloseTo(reference.tempo, 6);
        expect(contents.keySignatures).toEqual(reference.keySignatures);
      });

      it('chooses the same grid for every bar', () => {
        expect(report.gridByBar.map(fracToString)).toEqual(reference.gridByBar);
      });

      it('reaches the same verdict on swing, by the same counts', () => {
        expect(report.swing.swung).toBe(reference.swing.swung);
        expect(report.swing.nearSwung).toBe(reference.swing.near_swung);
        expect(report.swing.nearStraight).toBe(reference.swing.near_straight);
        expect(report.swing.onBeatShare).toBeCloseTo(reference.swing.on_beat_share, 9);
      });

      it('quantises every onset and release to the same place', () => {
        expect(eventsOf(report.events)).toEqual(asEvents(reference.quantised));
        expect(fracToString(report.moved)).toBe(reference.moved);
      });

      // The whole conversion, with the options the Python harness used: the
      // merge is the app's own path and is off here, because parity is with
      // the tool as the tool runs.
      const conversion = convertMidi(midi, {
        title: name,
        divisors: [4, 3],
        hands: reference.hands,
        merge: false,
        respell: reference.respell,
        swing: null,
      });

      it('estimates the same key and writes the same one', () => {
        expect(conversion.report.estimatedKey).toBe(reference.estimatedKey);
        expect(conversion.report.key).toBe(reference.key);
      });

      it('passes the same self-check: nothing lost, nothing added, every bar adding up', () => {
        expect(conversion.report.lost).toEqual(reference.lost);
        expect(conversion.report.added).toEqual(reference.added);
        expect(conversion.report.brokenBars).toEqual(reference.brokenBars);
        expect(conversion.report.unwritable).toEqual([]);
        expect(conversion.report.notesIn).toBe(reference.notesIn);
        expect(conversion.report.passed).toBe(true);
      });

      it('writes the same notes, in the same hands, for the same durations', () => {
        // Read back off the written text on both sides — the Python parses its
        // own output with music21, this parses its own with `readBackMusicXml`
        // — so what is compared is two files and not two sets of intentions.
        const read = readBackMusicXml(conversion.xml, barLength);
        const mine = read.notes.map((note) => [
          note.part,
          fracToString(note.at),
          note.midi,
          fracToString(note.length),
        ]);
        expect(mine).toEqual(reference.sounding.map((row) => [row[0], row[1], row[2], row[3]]));
      });

      it.skipIf(reference.handSplit === null)('splits the hands the same way', () => {
        const split = splitHands(report.events);
        expect(eventsOf(split.right)).toEqual(asEvents(reference.handSplit?.right ?? []));
        expect(eventsOf(split.left)).toEqual(asEvents(reference.handSplit?.left ?? []));
        // The boundary too, not only the two lists: two splits can put the
        // same notes in the same hands by different reasoning, and the
        // boundary is the reasoning made visible.
        expect(split.boundary.map(([at, value]) => [fracToString(at), fracToString(value)])).toEqual(
          reference.handSplit?.boundary ?? [],
        );
      });
    });
  }
});

describe.skipIf(references.length > 0)('the parity reference', () => {
  it('is missing, and says how to make it', () => {
    // Not a silent pass: the reason is printed where a reader of the run will
    // see it, which is the convention `test_converter.py` uses for the same
    // files.
    expect(why).toContain('parity_reference.py');
    console.warn(`midi parity tests skipped — ${why}`);
  });
});
