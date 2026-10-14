/**
 * One MIDI file to one MusicXML score, in the browser.
 *
 * The port of `convert` in `tools/midi-cleanup/midi_to_musicxml.py`, with the
 * same stages in the same order: read the file, choose a grid per bar, decide
 * the hands, cut the line into chords that are rhythms, write it, and then
 * **read back what was written and check it**. The checks are the tool's own:
 * every note the quantiser placed must still be there at the beat it placed
 * it, and every bar but the first and last must add up to its time signature.
 *
 * Three things here are this file's rather than the Python's, and each is
 * written down where it differs:
 *
 * 1. **Which hand a note is in comes from the file when the file says, and
 *    from the voice-leading split only when it does not** — which is the
 *    Python's rule, matched here rather than differed from. The Python is one
 *    line, `split = hands == "split" or (hands == "auto" and len(raw) == 1)`,
 *    and it means:
 *
 *    - **one note track** — a recording of two hands on one channel — is split
 *      by `splitHands`;
 *    - **exactly two note tracks** are kept **as recorded**: the first track in
 *      file order becomes the upper staff and the second the lower. That is the
 *      Python's order too, and it is file order and not register — its clef
 *      falls back to `TrebleClef() if index == 0 else BassClef()`, and nothing
 *      in `convert` or `rebuild_part` looks at a pitch to decide a staff. An
 *      arrangement downloaded with a track per hand has already been given
 *      hands by a person, and that assignment is the authoritative one; the
 *      split would overwrite it and can hand a learner the wrong hand for a
 *      note. **This file used to merge every track and split; the T29 brief
 *      asked for that and it was wrong.**
 *    - **three or more note tracks** are merged into one line (`mergeNoteTracks`)
 *      and then split. **This is the one place the port differs**: the Python
 *      writes a part per track, which music21 can do and this writer cannot —
 *      a piano has two staves. Three tracks are a melody and two accompaniment
 *      voices, or four are two per hand; either way the file is not saying
 *      "this hand" and there is nothing authoritative to keep. The sheet says
 *      so in words (`handsSentence`).
 *
 *    `hands: 'split'` and `hands: 'keep'` force either answer, exactly as the
 *    Python's flag does; the app's own path never passes them.
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
 * 4. **Bars, keys and grids (2026-10-14).** Bars follow every time signature the file states (`bars.ts`), the
 *    key is the file's own with its changes (estimated only when it states none, or only a C major the notes
 *    contradict), and a bar whose notes sit exactly on 32nds, sextuplets or 64ths gets that grid. A comparison with
 *    ASAP's published scores showed each was wrong before: `docs/app-features.md` §5c has the numbers.
 *
 * What the writer produces is one part on one or two staves. Two hands is a
 * piano: one instrument, braced, which is what `<staves>2</staves>` says and
 * what the app reads a hand off (`converted-import.spec.ts` caught the
 * two-instrument version). More than two parts — only reachable with
 * `hands: 'keep'` on a file with three or more note tracks, which the app's own
 * path never asks for because `auto` merges those — is refused rather than
 * written wrongly.
 */
import { DIVISIONS, noteShape, writeMusicXml, type WriterMeasure, type WriterNote } from './writer.ts';
import { type BarMap, barMap, steadyBars } from './bars.ts';
import {
  type Frac,
  ZERO,
  add,
  cmp,
  eq,
  frac,
  fracToString,
  gt,
  gte,
  lte,
  mul,
  sub,
  toNumber,
} from './fraction.ts';
import {
  type MidiFileContents,
  type NoteEvent,
  type TimeSignature,
  MidiReadError,
  mergeNoteTracks,
  readMidi,
} from './readMidi.ts';
import { quantise, type SwingReport } from './quantise.ts';
import { splitHands } from './handSplit.ts';
import { sliceIntoChords, type Slice } from './slice.ts';
import { notatablePieces } from './notatable.ts';
import {
  type EstimatedKey,
  keyEstimate,
  keyFromSignature,
  relativeByEnding,
  spellingFor,
} from './key.ts';

/**
 * The version of what this converter decides — the grid, the hands, the key, the metre and the
 * tempo it writes (E26; R35). The import's provenance names it (`converter: { name, version }`,
 * `importStore.importProvenance`), so a later reader can tell which rules inferred an imported
 * score's split and tempo, and the launch's measurement of stored imports can tell a row converted
 * under an older version (`importStore.measurementDue`). Move it whenever those decisions change.
 * The command-line converter (`tools/midi-cleanup/midi_to_musicxml.py`) keeps its own, written into
 * the MusicXML it emits.
 */
export const MIDI_CONVERTER_VERSION = 2; // 2026-10-14: bars from every time signature, the file's keys, finer grids

export interface ConvertOptions {
  /** What the score is called. The import path passes the file's own name. */
  title: string;
  composer?: string;
  /** Candidate grids as divisors of a quarter note; `4,3` is the tool's default. */
  divisors?: number[];
  /** Spell every note from the key rather than from the MIDI number. */
  respell?: boolean;
  /**
   * `auto` is the Python's rule: one note track is split by voice-leading, two
   * are kept as recorded, three or more are merged and then split. `split` and
   * `keep` force either answer, as the tool's `--hands` does.
   */
  hands?: 'auto' | 'split' | 'keep';
  /** `null` lets the onsets decide. */
  swing?: boolean | null;
  key?: EstimatedKey | null;
  timeSignature?: TimeSignature | null;
}

export interface ConversionReport {
  parts: string[];
  key: string;
  keyFrom: 'chosen' | 'the file' | 'estimated from the notes';
  /** How many times the written key signature changes after the first bar. */
  keyChanges: number;
  estimatedKey: string;
  midiKeySignatures: string[];
  timeSignature: string;
  /** The metre the score is written in (after a pickup), how many times it changes, and whether there is a pickup. */
  metre: { beats: number; beatType: number; changes: number; pickup: boolean };
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
  /** The share of onsets already on the grid (`QuantiseReport.onGrid`). */
  onGrid: number;
  /**
   * How many tracks held notes, and what they were called, in file order.
   *
   * Not "how many were merged": whether they were merged is `hands`, and the
   * two answers differ — two note tracks are *kept* and three are merged.
   */
  noteTracks: number;
  noteTrackNames: string[];
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
  map: BarMap,
  unitForBar: (index: number) => Frac,
  staff: 1 | 2 | undefined,
  unwritable: string[],
): WriterNote[][] {
  const bars: WriterNote[][] = [];
  let next = 0;
  for (let bar = 0; bar < barCount; bar += 1) {
    const { start: from, length: barLength, beat } = map.bar(bar);
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
const MEASURE_BLOCK = /<measure number="(\d+)"[^>]*>([\s\S]*?)<\/measure>/g;

/**
 * The written score read back, the way anyone opening the file would get it.
 *
 * Deliberately **not** the structures the writer was handed: the Python reads
 * its own output back with `converter.parse` for exactly this reason, and a
 * check whose two sides come from one object proves nothing (the harness's own
 * note-count tautology, corrected on 2026-09-22, was this shape).
 */
export function readBackMusicXml(xml: string, bars: BarMap | Frac): ReadBack {
  const lengthOfBar = (index: number): Frac => ('bar' in bars ? bars.bar(index).length : bars);
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
    const barLength = lengthOfBar(measureIndex);
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
  const respell = options.respell ?? true;

  const source: MidiFileContents = readMidi(bytes);
  const withNotes = source.tracks.filter((track) => track.events.length > 0);
  if (withNotes.length === 0) {
    throw new MidiReadError(
      'this MIDI file has no notes in it — it may hold only a tempo map, or only a drum track. Export it again with the piano part in it.',
    );
  }

  let lastEnd = ZERO;
  for (const track of withNotes) for (const event of track.events) if (gt(event.end, lastEnd)) lastEnd = event.end;
  // Where the bars fall: every metre the file states, or the one the caller chose throughout.
  const bars = options.timeSignature
    ? steadyBars(options.timeSignature, add(lastEnd, frac(64)))
    : barMap(source.timeSignatures, add(lastEnd, frac(64)));
  // Swing is heard against the piece's main beat: the first full bar's.
  const beat = bars.bar(bars.pickup ? 1 : 0).beat;

  const noteTrackNames = withNotes.map((track) => track.name ?? `Part ${String(track.index + 1)}`);

  // The Python's one line, `split = hands == "split" or (hands == "auto" and
  // len(raw) == 1)`, and the one place this file adds to it: three or more note
  // tracks are merged, because music21 writes a part per track and this writer
  // writes a piano. Two are kept — the header explains why that is the whole
  // point of this rule.
  const split = hands === 'split' || (hands === 'auto' && withNotes.length !== 2);
  const mergeFirst = split && withNotes.length > 2;
  const merged = mergeFirst ? mergeNoteTracks(source) : null;

  const raw: { name: string; events: NoteEvent[] }[] = merged
    ? [{ name: merged.name, events: merged.events }]
    : withNotes.map((track, index) => ({
        name: noteTrackNames[index] ?? `Part ${String(track.index + 1)}`,
        events: track.events,
      }));

  const flat = raw.flatMap((part) => part.events);
  const quantised = quantise(flat, { bars, beat, divisors, swing: options.swing ?? null });

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
        'let the hands be decided for you, or convert it with the command-line tool, ' +
        'which writes a part per track.',
    );
  }

  const unitForBar = (index: number): Frac => {
    const grid = quantised.gridByBar;
    if (grid.length === 0) return frac(1, divisors[0] ?? 4);
    return grid[Math.min(Math.max(index, 0), grid.length - 1)] ?? frac(1, 4);
  };

  const allEvents = parts.flatMap((part) => part.events);
  // The key: the file's own key signatures where it states them, each from the bar it falls in (one stated inside
  // a bar holds from the next), and an estimate from the notes only where it states none (2026-10-14; before,
  // always the estimate, which had the wrong opening key on 21 of 180 ASAP score files). A file stating nothing
  // but C major / A minor while the notes say otherwise is taken to be a sequencer's default: the estimate wins.
  const estimated = relativeByEnding(allEvents, keyEstimate(allEvents));
  const stated: { bar: number; key: EstimatedKey }[] = [];
  for (const change of [...source.keyChanges].sort((a, b) => cmp(a.at, b.at))) {
    const index = bars.indexAt(change.at);
    const bar = eq(bars.bar(index).start, change.at) ? index : index + 1;
    const key = keyFromSignature(change.fifths, change.minor);
    const last = stated[stated.length - 1];
    if (last && last.bar === bar) stated[stated.length - 1] = { bar, key };
    else if (!last || last.key.fifths !== key.fifths || last.key.mode !== key.mode) stated.push({ bar, key });
  }
  const first = stated[0];
  if (first && first.bar > 0) stated.unshift({ bar: 0, key: first.key });
  const statedOnlyDefault = stated.length > 0 && stated.every((entry) => entry.key.fifths === 0);
  const keyFrom: ConversionReport['keyFrom'] = options.key ? 'chosen'
    : stated.length > 0 && !(statedOnlyDefault && estimated.fifths !== 0) ? 'the file' : 'estimated from the notes';
  const keyPlan = keyFrom === 'chosen' && options.key ? [{ bar: 0, key: options.key }]
    : keyFrom === 'the file' ? stated : [{ bar: 0, key: estimated }];
  const keyAt = (bar: number): EstimatedKey => {
    let key = keyPlan[0]?.key ?? estimated;
    for (const entry of keyPlan) if (entry.bar <= bar) key = entry.key;
    return key;
  };
  const writtenKey = keyAt(0);

  // How many bars the longest part needs. A slice never crosses a barline, so
  // the last bar is the one holding the last release.
  let lastWritten = ZERO;
  for (const event of allEvents) if (gt(event.end, lastWritten)) lastWritten = event.end;
  const barCount = Math.max(1, bars.indexAt(sub(lastWritten, frac(1, 1000000))) + 1);

  const grandStaff = parts.length === 2;
  const unwritable: string[] = [];
  const perPart = parts.map((part, index) => {
    const staff = grandStaff ? ((index + 1) as 1 | 2) : undefined;
    const slices = sliceIntoChords(part.events, bars, unitForBar);
    return barsFor(slices, barCount, bars, unitForBar, staff, unwritable);
  });

  const measures: WriterMeasure[] = [];
  for (let bar = 0; bar < barCount; bar += 1) {
    const notes = perPart.flatMap((bars) => bars[bar] ?? []);
    const measure: WriterMeasure = { notes };
    const key = keyAt(bar);
    if (bar > 0 && key !== keyAt(bar - 1)) measure.fifths = key.fifths;
    if (respell && key !== writtenKey) measure.spelling = spellingFor(key);
    // A metre that differs from the bar before is written where it starts; a pickup is written in the metre of
    // the bar after it and marked implicit, so it is not counted as bar 1.
    const here = bars.bar(bar).time;
    const before = bar === 0 ? null : bars.bar(bar - 1).time;
    if (bar === 0 && bars.pickup) measure.implicit = true;
    else if (bar > 0 && before && (before.beats !== here.beats || before.beatType !== here.beatType) && !(bar === 1 && bars.pickup)) {
      measure.time = { beats: here.beats, beatType: here.beatType };
    }
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
    beats: bars.bar(bars.pickup ? 1 : 0).time.beats,
    beatType: bars.bar(bars.pickup ? 1 : 0).time.beatType,
    bpm: source.tempo === null ? null : Math.round(source.tempo * 1000) / 1000,
    staves: grandStaff ? 2 : 1,
    clef: !grandStaff && (parts[0]?.events ?? []).every((event) => event.midi < 60) ? 'F' : 'G',
    ...(respell ? { spelling: spellingFor(writtenKey) } : {}),
    measures,
  });

  // Read back what was written, which is what anyone opening it will get.
  const read = readBackMusicXml(xml, bars);
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
    for (const note of read.notes) {
      const named = spellingFor(keyAt(bars.indexAt(note.at)))[((note.midi % 12) + 12) % 12];
      const plain = PITCH_NAMES[((note.midi % 12) + 12) % 12] ?? 'C';
      const wrote = `${named?.step ?? ''}${(named?.alter ?? 0) > 0 ? '#' : (named?.alter ?? 0) < 0 ? '-' : ''}`;
      if (named && wrote !== plain) respelled += 1;
    }
  }

  const mainTime = bars.bar(bars.pickup ? 1 : 0).time;
  const changes = measures.filter((m) => m.time !== undefined).length;
  const units = [...new Set(quantised.gridByBar.map(fracToString))].sort();
  const report: ConversionReport = {
    parts: parts.map((part) => part.name),
    key: `${writtenKey.tonic} ${writtenKey.mode}`,
    keyFrom,
    keyChanges: keyPlan.length - 1,
    estimatedKey: `${estimated.tonic} ${estimated.mode}`,
    midiKeySignatures: source.keySignatures,
    timeSignature:
      `${String(mainTime.beats)}/${String(mainTime.beatType)}` +
      (changes > 0 ? ` (changes ${String(changes)} time${changes === 1 ? '' : 's'})` : '') +
      (bars.pickup ? ' (with a pickup)' : '') +
      (options.timeSignature
        ? ' (chosen)'
        : source.hadTimeSignature
          ? ''
          : ' (none in the MIDI; assumed)'),
    metre: { beats: mainTime.beats, beatType: mainTime.beatType, changes, pickup: bars.pickup },
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
    onGrid: quantised.onGrid,
    noteTracks: withNotes.length,
    noteTrackNames,
    passed:
      lost.length === 0 && added.length === 0 && read.badBars.length === 0 && unwritable.length === 0,
  };
  return { xml, report };
}

/** `my-piece_2.mid` as `my piece 2`, which is what the score is called. */
export function titleFromFilename(name: string): string {
  return name.replace(/\.(mid|midi)$/i, '').replace(/[-_]/g, ' ');
}
