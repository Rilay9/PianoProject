/**
 * What a MIDI file holds: note-ons and note-offs, its tempo, its metre, its names.
 *
 * A port of `read_midi` in `tools/midi-cleanup/midi_to_musicxml.py`, and its
 * reasons are the reasons here — quoted rather than summarised, because a port
 * that keeps the code and loses the rule drifts from the tool it copies:
 *
 *   * The **messages** are counted, not a parsed score. music21's MIDI reader
 *     builds a `Score` with bars and ties already in it, and on the Bach
 *     recording it produced 152 note objects for 129 Note-On messages. Reading
 *     the bytes is the only reading that cannot invent a note. The app has no
 *     music21 at all, so here it is the only reading available — but the rule
 *     is the same one and is stated so a later reader does not "improve" it by
 *     reaching for a library.
 *   * The **sustain pedal is not folded into the durations**. CC64 is how long
 *     a string rang; the written duration is how long the finger held the key.
 *   * Ticks come back as quarter notes, so everything downstream is in the same
 *     unit as a `quarterLength`.
 *
 * This file is also the app's whole MIDI dependency: a few hundred bytes of
 * chunk walking rather than a package (`docs/01`'s bundle budget).
 */
import { type Frac, add, cmp, div, frac, gt, lte, sub } from './fraction';

/** One struck note: when it started, when it stopped, what and how hard. */
export interface NoteEvent {
  start: Frac;
  end: Frac;
  midi: number;
  velocity: number | null;
}

export interface MidiTrack {
  index: number;
  name: string | null;
  events: NoteEvent[];
}

export interface TimeSignature {
  beats: number;
  beatType: number;
}

export interface MidiFileContents {
  tracks: MidiTrack[];
  timeSignature: TimeSignature;
  hadTimeSignature: boolean;
  /** Beats per minute from the first SET_TEMPO, or null when the file states none. */
  tempo: number | null;
  /** How the MIDI spelled its key signature(s), for the report. Sorted, de-duplicated. */
  keySignatures: string[];
}

/** What a file the converter cannot read says about itself. */
export class MidiReadError extends Error {}

export const DEFAULT_TIME_SIGNATURE: TimeSignature = { beats: 4, beatType: 4 };

/** Python's `event.length` on an `Event`. */
export const lengthOf = (event: NoteEvent): Frac => sub(event.end, event.start);

/**
 * A bar and a beat in quarter notes, as music21's `TimeSignature` gives them.
 *
 * The beat is the compound one where the metre is compound — 6/8 beats in
 * dotted quarters, and `detect_swing` measures an onset's position *within its
 * beat*, so a 6/8 beat being a quarter would make the measurement nonsense.
 * The rule here is "three of them to a beat when the unit is an eighth or
 * shorter and they come in threes". Checked against music21 rather than
 * reasoned about, on 3/8, 6/8, 9/8, 12/8, 7/8, 2/4, 3/4, 4/4, 5/4 and 2/2: it
 * agrees on all ten.
 */
export function barLengthOf(ts: TimeSignature): Frac {
  return frac(ts.beats * 4, ts.beatType);
}

export function beatLengthOf(ts: TimeSignature): Frac {
  if (ts.beatType >= 8 && ts.beats % 3 === 0) return frac(3 * 4, ts.beatType);
  return frac(4, ts.beatType);
}

const NAMES_SHARP = ['no sharps or flats', '1 sharp'];
function keySignatureName(sharps: number): string {
  if (sharps === 0) return NAMES_SHARP[0] ?? '';
  const count = Math.abs(sharps);
  const word = sharps > 0 ? 'sharp' : 'flat';
  return count === 1 ? `1 ${word}` : `${String(count)} ${word}s`;
}

interface Reader {
  bytes: Uint8Array;
  at: number;
}

function u16(r: Reader): number {
  const value = ((r.bytes[r.at] ?? 0) << 8) | (r.bytes[r.at + 1] ?? 0);
  r.at += 2;
  return value;
}

function u32(r: Reader): number {
  const b = r.bytes;
  const value =
    (b[r.at] ?? 0) * 0x1000000 + ((b[r.at + 1] ?? 0) << 16) + ((b[r.at + 2] ?? 0) << 8) + (b[r.at + 3] ?? 0);
  r.at += 4;
  return value;
}

/** A MIDI variable-length quantity: seven bits a byte, high bit means "more". */
function varlen(r: Reader): number {
  let value = 0;
  for (let i = 0; i < 4; i += 1) {
    const byte = r.bytes[r.at];
    if (byte === undefined) throw new MidiReadError('the file ends in the middle of an event.');
    r.at += 1;
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return value;
  }
  return value;
}

const decoder = new TextDecoder('latin1');

/**
 * The file's tracks, with their note events in quarter notes.
 *
 * Throws `MidiReadError` with a sentence a learner can act on — the import
 * sheet prints it (docs/04 §4) — rather than letting a malformed file fall
 * through as an empty score.
 */
export function readMidi(bytes: Uint8Array): MidiFileContents {
  const magic = bytes.length >= 4 ? decoder.decode(bytes.subarray(0, 4)) : '';
  if (magic !== 'MThd') {
    throw new MidiReadError(
      'this file does not start with a MIDI header, so it is not a MIDI file — export it again from whatever made it.',
    );
  }
  // Said apart from the sentence above, because they send you to different
  // places: a file that is not MIDI has to be exported again, and a file that
  // is MIDI and stops early has to be copied again.
  if (bytes.length < 14) {
    throw new MidiReadError(
      'this MIDI file stops inside its header, so there is nothing in it to read — copy it again from wherever it came from.',
    );
  }
  const head: Reader = { bytes, at: 4 };
  const headerLength = u32(head);
  head.at += 2; // format
  head.at += 2; // track count, which the chunk walk below does not need
  const division = u16(head);
  if ((division & 0x8000) !== 0) {
    throw new MidiReadError(
      'this file measures time in SMPTE frames rather than in ticks per beat, which the converter cannot read — export it again with a beat-based clock.',
    );
  }
  const ticks = frac(division || 1024);

  const tracks: MidiTrack[] = [];
  let timeSignature: TimeSignature | null = null;
  let tempo: number | null = null;
  const keySignatures = new Set<string>();

  let at = 8 + headerLength;
  let index = 0;
  while (at + 8 <= bytes.length) {
    const kind = decoder.decode(bytes.subarray(at, at + 4));
    const chunk: Reader = { bytes, at: at + 4 };
    const length = u32(chunk);
    const body = bytes.subarray(at + 8, Math.min(at + 8 + length, bytes.length));
    at += 8 + length;
    if (kind !== 'MTrk') continue;

    const r: Reader = { bytes: body, at: 0 };
    let ticksSoFar = 0;
    let status = 0;
    let name: string | null = null;
    const open = new Map<number, NoteEvent>();
    const events: NoteEvent[] = [];
    while (r.at < body.length) {
      ticksSoFar += varlen(r);
      const first = body[r.at] ?? 0;
      if ((first & 0x80) !== 0) {
        status = first;
        r.at += 1;
      }
      if (status === 0xff) {
        const type = body[r.at] ?? 0;
        r.at += 1;
        const size = varlen(r);
        const data = body.subarray(r.at, r.at + size);
        r.at += size;
        if (type === 0x03 && name === null) {
          name = decoder.decode(data).trim() || null;
        } else if (type === 0x51 && tempo === null && data.length >= 3) {
          const micros = ((data[0] ?? 0) << 16) | ((data[1] ?? 0) << 8) | (data[2] ?? 0);
          if (micros > 0) tempo = 60_000_000 / micros;
        } else if (type === 0x58 && timeSignature === null && data.length >= 2) {
          timeSignature = { beats: data[0] ?? 4, beatType: 2 ** (data[1] ?? 2) };
        } else if (type === 0x59 && data.length >= 2) {
          const raw = data[0] ?? 0;
          keySignatures.add(keySignatureName(raw > 127 ? raw - 256 : raw));
        }
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        const size = varlen(r);
        r.at += size;
        continue;
      }
      const high = status & 0xf0;
      if (high === 0xc0 || high === 0xd0) {
        r.at += 1;
        continue;
      }
      const pitch = body[r.at] ?? 0;
      const velocity = body[r.at + 1] ?? 0;
      r.at += 2;
      const quarters = div(frac(ticksSoFar), ticks);
      if (high === 0x90 && velocity > 0) {
        // The same pitch struck again while it is still down ends the first one
        // here: two overlapping note-ons of one pitch are one string, and a MIDI
        // file that sends them is saying "again".
        const earlier = open.get(pitch);
        open.delete(pitch);
        if (earlier && lte(earlier.end, earlier.start)) earlier.end = quarters;
        const fresh: NoteEvent = { start: quarters, end: quarters, midi: pitch, velocity };
        events.push(fresh);
        open.set(pitch, fresh);
      } else if (high === 0x80 || (high === 0x90 && velocity === 0)) {
        const earlier = open.get(pitch);
        open.delete(pitch);
        if (earlier) earlier.end = quarters;
      }
    }
    // A note still down at the end of the track: give it the longest of "to
    // here", "to the last release in the track" and a sixteenth, so it is not
    // dropped by the filter below.
    let tail = frac(0);
    for (const event of events) if (gt(event.end, tail)) tail = event.end;
    const here = div(frac(ticksSoFar), ticks);
    for (const stillDown of open.values()) {
      if (lte(stillDown.end, stillDown.start)) {
        const floor = add(stillDown.start, frac(1, 4));
        stillDown.end = [here, tail, floor].reduce((best, one) => (gt(one, best) ? one : best), here);
      }
    }
    const kept = events.filter((event) => gt(event.end, event.start));
    kept.sort((a, b) => cmp(a.start, b.start) || a.midi - b.midi);
    tracks.push({ index, name, events: kept });
    index += 1;
  }

  if (tracks.length === 0) {
    throw new MidiReadError('this file has a MIDI header but no tracks in it.');
  }
  return {
    tracks,
    timeSignature: timeSignature ?? DEFAULT_TIME_SIGNATURE,
    hadTimeSignature: timeSignature !== null,
    tempo,
    keySignatures: [...keySignatures].sort(),
  };
}

/**
 * The index of the one track holding Note-Ons, or -1 if that is not one track.
 *
 * A format 1 file is conventionally a conductor track — tempo, time signature,
 * nothing sounding — followed by the parts, and every one of the three
 * Disklavier performances in `build/midi-real/` is exactly that. Read rather
 * than assumed, because "track 1 is the music" is a convention and not a rule.
 */
export function trackWithTheNotes(contents: MidiFileContents): number {
  const withNotes = contents.tracks.filter((track) => track.events.length > 0);
  return withNotes.length === 1 ? (withNotes[0]?.index ?? -1) : -1;
}

export interface MergedTracks {
  name: string;
  events: NoteEvent[];
  /** How many tracks held notes. 1 means nothing was merged. */
  merged: number;
  /** Their names, in file order, for the report the sheet prints. */
  names: string[];
}

/**
 * Several note tracks as one, which is what a downloaded file usually needs.
 *
 * **The rule.** The converter's own answer to a file with more than one note
 * track is to keep each as a part (`hands="auto"` splits only a single track).
 * That is right for the three Disklavier captures, which are one track of
 * two-hand playing; it is wrong for a file downloaded from the web, which
 * commonly carries a track per hand, or per voice, or a melody track and an
 * accompaniment track — and keeping those as parts writes four staves where a
 * piano has two, and leaves the app reading a hand off a staff that is a voice.
 *
 * So: **every track with notes in it is merged into one list, and the hand
 * split decides the hands.** The tracks keep their order — the events are
 * concatenated in file order and then ordered by onset with a stable sort, so
 * two notes struck at the same instant stay in the order the file wrote them,
 * which is the order `split_hands` groups them in.
 *
 * Nothing is dropped and nothing is moved in time; the merge is a
 * concatenation, and `separate_repeats` in the quantiser is what handles the
 * one case it creates — the same pitch struck at the same instant on two
 * tracks.
 */
export function mergeNoteTracks(contents: MidiFileContents): MergedTracks {
  const withNotes = contents.tracks.filter((track) => track.events.length > 0);
  const names = withNotes.map((track) => track.name ?? `Part ${String(track.index + 1)}`);
  const events = withNotes.flatMap((track) => track.events);
  // Stable: `Array.prototype.sort` is required to be, so notes struck together
  // on different tracks keep their file order.
  events.sort((a, b) => cmp(a.start, b.start) || a.midi - b.midi);
  return {
    name: names[0] ?? 'Part 1',
    events,
    merged: withNotes.length,
    names,
  };
}
