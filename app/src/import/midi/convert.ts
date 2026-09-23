/**
 * One MIDI file to one MusicXML score, in the browser.
 *
 * The port of `convert` in `tools/midi-cleanup/midi_to_musicxml.py`, with the
 * same stages in the same order: read the file, merge the note tracks, choose a
 * grid per bar, split the hands, cut the line into chords that are rhythms,
 * write it, and then **read back what was written and check it**. The checks
 * are the tool's own: every note the quantiser placed must still be there at
 * the beat it placed it, and every bar but the first and last must add up to
 * its time signature.
 *
 * Three things here are this file's rather than the Python's, and each is
 * written down where it differs:
 *
 * 1. **The note tracks are merged** before anything else (`mergeNoteTracks`),
 *    because a downloaded file carries a track per hand or per voice and the
 *    app's answer to "which hand" is the voice-leading split, not the track
 *    numbering. The tool keeps the tracks as parts; the app's caller asks for
 *    the merge, and the parity harness asks for the tool's behaviour.
 * 2. **`makeNotation`'s job is done here**: bars are made from the notes, gaps
 *    are filled with rests, and the rests are cut into rhythms by the same rule
 *    as the notes. music21 does this in the tool; the app has the writer in
 *    `src/engine/musicXmlWriter.ts` and this builds its measures.
 * 3. **Nothing throws on a length no note-head carries.** music21 raises
 *    "Cannot convert inexpressible durations to MusicXML" and the command
 *    exits; an import cannot crash the app, so such a length is written with
 *    the nearest note-head and listed in `unwritable`, and the conversion
 *    reports itself as failed. The learner is told; the app stays up.
 *
 * What the writer produces is one part on one or two staves. Two hands is a
 * piano: one instrument, braced, which is what `<staves>2</staves>` says and
 * what the app reads a hand off (`converted-import.spec.ts` caught the
 * two-instrument version). More than two parts — only reachable with
 * `hands: 'keep'` on a file with three or more note tracks, which the app's own
 * path never asks for because it merges — is refused rather than written
 * wrongly.
 */
import { DIVISIONS, noteShape, writeMusicXml, type WriterMeasure, type WriterNote } from '../../engine/musicXmlWriter';
import {
  type Frac,
  ZERO,
  add,
  cmp,
  eq,
  floorDiv,
  frac,
  fracToString,
  gt,
  gte,
  lte,
  mul,
  sub,
  toNumber,
} from './fraction';
import {
  type MidiFileContents,
  type NoteEvent,
  type TimeSignature,
  MidiReadError,
  barLengthOf,
  beatLengthOf,
  mergeNoteTracks,
  readMidi,
} from './readMidi';
import { quantise, type SwingReport } from './quantise';
import { splitHands } from './handSplit';
import { sliceIntoChords, type Slice } from './slice';
import { notatablePieces } from './notatable';
import {
  type EstimatedKey,
  keyEstimate,
  relativeByEnding,
  spellingFor,
} from './key';

export interface ConvertOptions {
  /** What the score is called. The import path passes the file's own name. */
  title: string;
  composer?: string;
  /** Candidate grids as divisors of a quarter note; `4,3` is the tool's default. */
  divisors?: number[];
  /** Spell every note from the key rather than from the MIDI number. */
  respell?: boolean;
  /** `auto` splits when one track has the notes, which is what a merge guarantees. */
  hands?: 'auto' | 'split' | 'keep';
  /** Merge every track that has notes into one before anything else. */
  merge?: boolean;
  /** `null` lets the onsets decide. */
  swing?: boolean | null;
  key?: EstimatedKey | null;
  timeSignature?: TimeSignature | null;
}

export interface ConversionReport {
  parts: string[];
  key: string;
  keyFrom: 'chosen' | 'estimated from the notes';
  estimatedKey: string;
  midiKeySignatures: string[];
  timeSignature: string;
  respelledNotes: number;
  notesIn: number;
  lost: string[];
  added: string[];
  brokenBars: string[];
  unwritable: string[];
  hands: string;
  handMedian: { left?: number; right?: number };
  handBoundaries: number;
  grid: string;
  gridByBar: string[];
  swing: SwingReport;
  moved: number;
  /** How many tracks held notes, and what they were called. */
  merged: number;
  mergedNames: string[];
  /** True when nothing was lost, nothing was added and every bar adds up. */
  passed: boolean;
}

export interface Conversion {
  xml: string;
  report: ConversionReport;
}

const DEFAULT_DIVISORS = [4, 3];

/** What a file the app cannot convert says about itself. */
export class ConvertError extends Error {}

const PITCH_NAMES = ['C', 'C#', 'D', 'E-', 'E', 'F', 'F#', 'G', 'A-', 'A', 'B-', 'B'];
const nameOf = (midi: number): string =>
  `${PITCH_NAMES[((midi % 12) + 12) % 12] ?? 'C'}${String(Math.floor(midi / 12) - 1)}`;

/** A slice or a rest as the `<note>` elements that carry it. */
function writerNotes(
  slice: Slice | null,
  length: Frac,
  at: Frac,
  staff: 1 | 2 | undefined,
  unwritable: string[],
): WriterNote[] {
  const divisions = toNumber(mul(length, frac(DIVISIONS)));
  const shape = Number.isInteger(divisions) ? noteShape(divisions) : null;
  if (!shape) {
    unwritable.push(`${fracToString(length)} of a quarter at beat ${fracToString(at)}`);
  }
  const written = shape ?? { type: 'quarter' as const, dotted: false };
  const rounded = Math.max(1, Math.round(divisions));
  const voice = staff === 2 ? 2 : 1;
  if (slice === null) {
    return [
      {
        midi: null,
        duration: rounded,
        type: written.type,
        dotted: written.dotted,
        voice,
        ...(staff === undefined ? {} : { staff }),
        ...('tuplet' in written && written.tuplet ? { tuplet: written.tuplet } : {}),
      },
    ];
  }
  return slice.notes.map((note, index) => ({
    midi: note.midi,
    duration: rounded,
    type: written.type,
    dotted: written.dotted,
    voice,
    ...(staff === undefined ? {} : { staff }),
    ...(index > 0 ? { chord: true } : {}),
    ...(note.tie === 'none'
      ? {}
      : { tie: note.tie === 'continue' ? ('both' as const) : note.tie }),
    ...('tuplet' in written && written.tuplet ? { tuplet: written.tuplet } : {}),
  }));
}

/**
 * One part's bars: its slices in order, with every gap filled by rests.
 *
 * This is `makeNotation`'s job, and the reason it is written out rather than
 * left to a library is the reason `slice_into_chords` exists at all — a
 * bar-maker that splits a slice at a barline resets its tie to "start", and
 * the note then reads as struck again.
 */
function barsFor(
  slices: Slice[],
  barCount: number,
  barLength: Frac,
  beat: Frac,
  unitForBar: (index: number) => Frac,
  staff: 1 | 2 | undefined,
  unwritable: string[],
): WriterNote[][] {
  const bars: WriterNote[][] = [];
  let next = 0;
  for (let bar = 0; bar < barCount; bar += 1) {
    const from = mul(barLength, frac(bar));
    const to = add(from, barLength);
    const notes: WriterNote[] = [];
    let at = from;
    const rest = (until: Frac): void => {
      if (lte(until, at)) return;
      const unit = unitForBar(bar);
      for (const piece of notatablePieces(sub(at, from), sub(until, at), unit, beat)) {
        notes.push(...writerNotes(null, piece, at, staff, unwritable));
        at = add(at, piece);
      }
    };
    while (next < slices.length) {
      const slice = slices[next];
      if (!slice || gte(slice.at, to)) break;
      rest(slice.at);
      notes.push(...writerNotes(slice, slice.length, slice.at, staff, unwritable));
      at = add(slice.at, slice.length);
      next += 1;
    }
    rest(to);
    bars.push(notes);
  }
  return bars;
}

/** Every struck note in a written score, read back off the text. */
export interface ReadNote {
  /** 0 for the upper staff, 1 for the lower. */
  part: number;
  at: Frac;
  midi: number;
  /** The whole sounding length, tie chains merged. */
  length: Frac;
}

interface ReadBack {
  notes: ReadNote[];
  /** `staff:bar (got of want)` for every bar whose length is not the metre's. */
  badBars: string[];
  measures: number;
}

const NOTE_BLOCK = /<note>([\s\S]*?)<\/note>|<backup>([\s\S]*?)<\/backup>/g;
const MEASURE_BLOCK = /<measure number="(\d+)">([\s\S]*?)<\/measure>/g;

/**
 * The written score read back, the way anyone opening the file would get it.
 *
 * Deliberately **not** the structures the writer was handed: the Python reads
 * its own output back with `converter.parse` for exactly this reason, and a
 * check whose two sides come from one object proves nothing (the harness's own
 * note-count tautology, corrected on 2026-09-22, was this shape).
 */
export function readBackMusicXml(xml: string, barLength: Frac): ReadBack {
  const divisions = Number(/<divisions>(\d+)<\/divisions>/.exec(xml)?.[1] ?? DIVISIONS);
  const notes: ReadNote[] = [];
  const badBars: string[] = [];
  let measureStart = ZERO;
  let measures = 0;
  const open = new Map<string, ReadNote>();

  const allMeasures = [...xml.matchAll(MEASURE_BLOCK)];
  allMeasures.forEach(([, number, body], measureIndex) => {
    measures += 1;
    let position = 0;
    let lastOnset = 0;
    const perStaff = new Map<number, number>();
    for (const match of (body ?? '').matchAll(NOTE_BLOCK)) {
      const backup = match[2];
      if (backup !== undefined) {
        position -= Number(/<duration>(-?\d+)<\/duration>/.exec(backup)?.[1] ?? 0);
        continue;
      }
      const note = match[1] ?? '';
      const duration = Number(/<duration>(\d+)<\/duration>/.exec(note)?.[1] ?? 0);
      const staff = Number(/<staff>(\d)<\/staff>/.exec(note)?.[1] ?? 1);
      const chord = note.includes('<chord/>');
      const onset = chord ? lastOnset : position;
      if (!chord) {
        lastOnset = position;
        position += duration;
        perStaff.set(staff, (perStaff.get(staff) ?? 0) + duration);
      }
      if (note.includes('<rest/>')) continue;
      const step = /<step>([A-G])<\/step>/.exec(note)?.[1] ?? 'C';
      const alter = Number(/<alter>(-?\d+)<\/alter>/.exec(note)?.[1] ?? 0);
      const octave = Number(/<octave>(-?\d+)<\/octave>/.exec(note)?.[1] ?? 4);
      const midi =
        (octave + 1) * 12 + ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[step] ?? 0) + alter;
      const at = add(measureStart, frac(onset, divisions));
      const length = frac(duration, divisions);
      const key = `${String(staff)}:${String(midi)}`;
      const carries = /<tie type="stop"\/>/.test(note);
      const carried = open.get(key);
      if (carries && carried) {
        carried.length = add(carried.length, length);
        if (!/<tie type="start"\/>/.test(note)) open.delete(key);
        continue;
      }
      const fresh: ReadNote = { part: staff - 1, at, midi, length };
      notes.push(fresh);
      if (/<tie type="start"\/>/.test(note)) open.set(key, fresh);
      else open.delete(key);
    }
    // Every bar but the first and the last must add up to its time signature.
    if (measureIndex > 0 && measureIndex < allMeasures.length - 1) {
      for (const [staff, sum] of perStaff) {
        const got = frac(sum, divisions);
        if (!eq(got, barLength)) {
          badBars.push(
            `staff ${String(staff)}:${number ?? '?'} (${fracToString(got)} of ${fracToString(barLength)})`,
          );
        }
      }
    }
    measureStart = add(measureStart, barLength);
  });
  notes.sort((a, b) => a.part - b.part || cmp(a.at, b.at) || a.midi - b.midi);
  return { notes, badBars, measures };
}

/** One MIDI file as MusicXML, with the self-check's answer beside it. */
export function convertMidi(bytes: Uint8Array, options: ConvertOptions): Conversion {
  const divisors = options.divisors ?? DEFAULT_DIVISORS;
  const hands = options.hands ?? 'auto';
  const merge = options.merge ?? true;
  const respell = options.respell ?? true;

  const source: MidiFileContents = readMidi(bytes);
  const withNotes = source.tracks.filter((track) => track.events.length > 0);
  if (withNotes.length === 0) {
    throw new MidiReadError(
      'this MIDI file has no notes in it — it may hold only a tempo map, or only a drum track. Export it again with the piano part in it.',
    );
  }

  const timeSignature = options.timeSignature ?? source.timeSignature;
  const barLength = barLengthOf(timeSignature);
  const beat = beatLengthOf(timeSignature);

  const merged = mergeNoteTracks(source);
  const raw: { name: string; events: NoteEvent[] }[] =
    merge && merged.merged > 1
      ? [{ name: merged.name, events: merged.events }]
      : withNotes.map((track) => ({
          name: track.name ?? `Part ${String(track.index + 1)}`,
          events: track.events,
        }));

  const flat = raw.flatMap((part) => part.events);
  const quantised = quantise(flat, { barLength, beat, divisors, swing: options.swing ?? null });

  const split = hands === 'split' || (hands === 'auto' && raw.length === 1);
  const handMedian: { left?: number; right?: number } = {};
  let handBoundaries = 0;
  let parts: { name: string; events: NoteEvent[] }[];
  if (split && quantised.events.length > 0) {
    const sides = splitHands(quantised.events);
    parts = [];
    for (const [label, side] of [
      ['Right hand', sides.right],
      ['Left hand', sides.left],
    ] as const) {
      if (side.length === 0) continue;
      parts.push({ name: label, events: side });
      const ordered = side.map((event) => event.midi).sort((a, b) => a - b);
      const median = ordered[Math.floor(ordered.length / 2)];
      if (median !== undefined) handMedian[label === 'Right hand' ? 'right' : 'left'] = median;
    }
    handBoundaries = new Set(sides.boundary.map(([, value]) => fracToString(value))).size;
  } else {
    parts = [];
    let at = 0;
    for (const part of raw) {
      parts.push({ name: part.name, events: quantised.events.slice(at, at + part.events.length) });
      at += part.events.length;
    }
  }

  if (parts.length > 2) {
    throw new ConvertError(
      `this file has ${String(parts.length)} parts and the app writes a piano’s two staves — ` +
        'convert it with the hands merged, or with the command-line tool.',
    );
  }

  const unitForBar = (index: number): Frac => {
    const grid = quantised.gridByBar;
    if (grid.length === 0) return frac(1, divisors[0] ?? 4);
    return grid[Math.min(Math.max(index, 0), grid.length - 1)] ?? frac(1, 4);
  };

  const allEvents = parts.flatMap((part) => part.events);
  const estimated = relativeByEnding(allEvents, keyEstimate(allEvents));
  const writtenKey = options.key ?? estimated;

  // How many bars the longest part needs. A slice never crosses a barline, so
  // the last bar is the one holding the last release.
  let lastEnd = ZERO;
  for (const event of allEvents) if (gt(event.end, lastEnd)) lastEnd = event.end;
  const barCount = Math.max(1, floorDiv(sub(lastEnd, frac(1, 1000000)), barLength) + 1);

  const grandStaff = parts.length === 2;
  const unwritable: string[] = [];
  const perPart = parts.map((part, index) => {
    const staff = grandStaff ? ((index + 1) as 1 | 2) : undefined;
    const slices = sliceIntoChords(part.events, barLength, beat, unitForBar);
    return barsFor(slices, barCount, barLength, beat, unitForBar, staff, unwritable);
  });

  const measures: WriterMeasure[] = [];
  for (let bar = 0; bar < barCount; bar += 1) {
    const notes = perPart.flatMap((bars) => bars[bar] ?? []);
    const measure: WriterMeasure = { notes };
    // The word, not the triplets: what is written is a pair of eighths and the
    // marking is what says how to play them.
    if (bar === 0 && quantised.swing.swung) measure.text = 'Swing eighths';
    measures.push(measure);
  }

  const xml = writeMusicXml({
    title: options.title,
    ...(options.composer === undefined ? {} : { composer: options.composer }),
    partName: grandStaff ? 'Piano' : (parts[0]?.name ?? 'Piano'),
    fifths: writtenKey.fifths,
    beats: timeSignature.beats,
    beatType: timeSignature.beatType,
    bpm: source.tempo === null ? null : Math.round(source.tempo * 1000) / 1000,
    staves: grandStaff ? 2 : 1,
    clef: !grandStaff && (parts[0]?.events ?? []).every((event) => event.midi < 60) ? 'F' : 'G',
    ...(respell ? { spelling: spellingFor(writtenKey) } : {}),
    measures,
  });

  // Read back what was written, which is what anyone opening it will get.
  const read = readBackMusicXml(xml, barLength);
  const expected = new Map<string, number>();
  for (const part of parts) {
    for (const event of part.events) {
      const key = `${fracToString(event.start)}:${String(event.midi)}`;
      expected.set(key, (expected.get(key) ?? 0) + 1);
    }
  }
  const sounding = new Map<string, number>();
  for (const note of read.notes) {
    const key = `${fracToString(note.at)}:${String(note.midi)}`;
    sounding.set(key, (sounding.get(key) ?? 0) + 1);
  }
  const difference = (a: Map<string, number>, b: Map<string, number>): string[] => {
    const out: string[] = [];
    for (const [key, count] of a) {
      const missing = count - (b.get(key) ?? 0);
      if (missing <= 0) continue;
      const [at, midi] = key.split(':');
      out.push(
        `${nameOf(Number(midi))} at beat ${at ?? '?'}${missing > 1 ? ` x${String(missing)}` : ''}`,
      );
    }
    return out.sort();
  };
  const lost = difference(expected, sounding);
  const added = difference(sounding, expected);

  let respelled = 0;
  if (respell) {
    const spelling = spellingFor(writtenKey);
    for (const note of read.notes) {
      const named = spelling[((note.midi % 12) + 12) % 12];
      const plain = PITCH_NAMES[((note.midi % 12) + 12) % 12] ?? 'C';
      const wrote = `${named?.step ?? ''}${(named?.alter ?? 0) > 0 ? '#' : (named?.alter ?? 0) < 0 ? '-' : ''}`;
      if (named && wrote !== plain) respelled += 1;
    }
  }

  const units = [...new Set(quantised.gridByBar.map(fracToString))].sort();
  const report: ConversionReport = {
    parts: parts.map((part) => part.name),
    key: `${writtenKey.tonic} ${writtenKey.mode}`,
    keyFrom: options.key ? 'chosen' : 'estimated from the notes',
    estimatedKey: `${estimated.tonic} ${estimated.mode}`,
    midiKeySignatures: source.keySignatures,
    timeSignature:
      `${String(timeSignature.beats)}/${String(timeSignature.beatType)}` +
      (options.timeSignature
        ? ' (chosen)'
        : source.hadTimeSignature
          ? ''
          : ' (none in the MIDI; assumed)'),
    respelledNotes: respelled,
    notesIn: [...expected.values()].reduce((a, b) => a + b, 0),
    lost,
    added,
    brokenBars: read.badBars,
    unwritable,
    hands: split ? 'split into two' : `${String(parts.length)} as recorded`,
    handMedian,
    handBoundaries,
    grid: units.map((unit) => `1/${unit.split('/')[1] ?? '1'} quarter`).join(', ') || 'none',
    gridByBar: quantised.gridByBar.map(fracToString),
    swing: quantised.swing,
    moved: toNumber(quantised.moved),
    merged: merged.merged,
    mergedNames: merged.names,
    passed:
      lost.length === 0 && added.length === 0 && read.badBars.length === 0 && unwritable.length === 0,
  };
  return { xml, report };
}

/** `my-piece_2.mid` as `my piece 2`, which is what the score is called. */
export function titleFromFilename(name: string): string {
  return name.replace(/\.(mid|midi)$/i, '').replace(/[-_]/g, ' ');
}
