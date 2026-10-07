// Builds a ScoreModel from an OSMD-parsed sheet.
//
// The whole design rests on one fact, verified against OSMD 2.1.2 rather than
// assumed: `Cursor.next()` is `iterator.moveToNextVisibleVoiceEntry(false)`,
// and `Cursor.reset()` rebuilds that iterator from the sheet. So walking a
// `MusicPartManagerIterator` the same way visits *exactly* the cursor's
// positions, in order, and `step.index === the number of cursor.next() calls
// from reset` falls out by construction rather than by luck. (The e2e suite
// checks that against a real, rendered cursor in Chromium; jsdom cannot
// render, so Node tests cannot use a live cursor.)
//
// Repeats: OSMD's iterator **does** unroll them, including 1st/2nd endings —
// confirmed on tests/fixtures/scores/edge/repeat-endings.musicxml, which
// plays m1, m2(ending 1), m1, m3(ending 2) for six steps. That is why every
// step carries both `measureIndex` (playback order, which advances on the
// second pass) and `sourceMeasureIndex` (printed, which goes back).
//
// The extractor never renders and never touches the DOM beyond what OSMD's
// `load()` already did, so it runs in Node under jsdom.
//
// Tempo is the one thing it does not take from OSMD (X3d): the tempo map is
// read from the MusicXML itself (`tempoFromXml.ts`) and placed on the
// unrolled timeline this walk builds. OSMD reads a metronome mark's number as
// quarter notes whatever its note, lets it replace the `<sound tempo>` beside
// it, and opens the piece at the first tempo it finds anywhere — a half note
// = 60 in cut time played at half its tempo (X3c's probe).

import { tempoEvents, type TempoEvent } from './tempoFromXml';
import {
  makeNoteId,
  roundBeats,
  WHOLE_NOTE_BEATS,
  withBeatToMs,
  type DeclaredHand,
  type HandDeclaration,
  type ScoreModel,
  type ScoreNote,
  type ScoreStep,
  type TempoMapEntry,
  type TimeSignatureEntry,
  type WrittenAccidental,
} from './types';

/**
 * OSMD's `Note.halfTone` counts semitones from C-1 with C4 = 48, while MIDI
 * puts middle C at 60. Verified against fixtures rather than derived from the
 * source: A0 → 21, C4 → 60, C8 → 108.
 */
export const OSMD_HALFTONE_TO_MIDI = 12;

/**
 * The two members of OSMD's `ArticulationEnum` that mean "play this harder":
 * `accent` (0) from MusicXML's `<accent>` and `strongaccent` (1) from
 * `<strong-accent>`, which is the marcato.
 *
 * The numbers rather than the enum because `ArticulationEnum` is a runtime
 * export of `opensheetmusicdisplay` and this module is deliberately typed
 * against a structural slice of OSMD (`OsmdLikeSheet` below) so that tests can
 * hand it a plain object. They are checked against the real enum in
 * `accents.test.ts` by driving a real fixture rather than a hand-built entry.
 *
 * Staccato, tenuto and the rest are deliberately not here: they are about how
 * long a note is held, which `articulationScore` already measures, and reading
 * them as accents would judge a velocity against a length.
 */
export const ACCENT_ARTICULATIONS = new Set([0, 1]);

/**
 * The tempo a piece opens at where its file states none at its opening, in quarter notes a minute (the
 * number OSMD's own default happens to be). The import sheet names it as the app's choice.
 */
export const DEFAULT_BPM = 100;

/**
 * The structural slice of OSMD we consume. Declared here rather than imported
 * so the extractor's contract is visible in one place and so tests can feed it
 * a hand-built object; the real types come from `opensheetmusicdisplay`.
 */
export interface OsmdLikeSheet {
  TitleString?: string;
  SourceMeasures: OsmdSourceMeasure[];
  MusicPartManager: { getIterator(): OsmdIterator };
  /**
   * Every staff of the sheet, across its instruments (OSMD's `MusicSheet.Staves`): only its length is
   * read, to tell a one-staff score, the only kind a declared hand applies to (HD1).
   */
  Staves: readonly unknown[];
}

export interface OsmdSourceMeasure {
  MeasureNumber: number;
  ImplicitMeasure?: boolean;
  ActiveTimeSignature?: { Numerator: number; Denominator: number };
  FirstInstructionsStaffEntries?: ({ Instructions?: unknown[] } | undefined)[];
}

export interface OsmdIterator {
  EndReached: boolean;
  CurrentMeasureIndex: number;
  CurrentMeasure?: OsmdSourceMeasure;
  CurrentEnrolledTimestamp: { RealValue: number };
  CurrentSourceTimestamp: { RealValue: number };
  /**
   * Where the current entry stands in its measure, in whole notes: the enrolled timestamp less this is
   * the measure's own start on the unrolled timeline, where its tempo events are placed (X3d). Optional
   * for a hand-built iterator, whose first entry in a measure is then taken as the measure's start.
   */
  CurrentRelativeInMeasureTimestamp?: { RealValue: number };
  CurrentRepetitionIteration: number;
  CurrentVisibleVoiceEntries(): OsmdVoiceEntry[];
  moveToNextVisibleVoiceEntry(notesOnly: boolean): void;
}

export interface OsmdVoiceEntry {
  IsGrace?: boolean;
  ParentVoice?: { VoiceId: number };
  Notes: OsmdNote[];
  /**
   * OSMD hangs articulations off the voice entry, not off the note, so an
   * accented chord is one mark and not one per note.
   */
  Articulations?: { articulationEnum: number }[];
}

export interface OsmdNote {
  halfTone: number;
  /**
   * The written pitch (T41). `FundamentalNote` is the letter as semitones
   * above C (OSMD's `NoteEnum`: C 0, D 2 … B 11); `AccidentalHalfTones` is
   * MusicXML's `<alter>`, which already includes the key signature's effect
   * (an E♭ in B♭ major is written `<alter>-1</alter>`). Optional so a
   * hand-built note in a test still type-checks; a note without one gets no
   * written spelling.
   */
  Pitch?: { FundamentalNote: number; AccidentalHalfTones: number } | undefined;
  Length: { RealValue: number };
  Fingering?: { value?: string } | undefined;
  NoteTie?: { StartNote?: OsmdNote; Notes?: OsmdNote[] } | undefined;
  /** The innermost tuplet the note is written in (C2); `TupletLabelNumber` is 3 for a triplet. */
  NoteTuplet?: { TupletLabelNumber?: number } | undefined;
  ParentStaffEntry?: { ParentStaff?: { Id?: number } } | undefined;
  isRest(): boolean;
}

export interface ExtractOptions {
  /**
   * The MusicXML the sheet was loaded from (X3d): the tempo map is read from it (`tempoFromXml`), never
   * from OSMD's iterator. Required, so no caller can build a model whose tempo quietly falls back to a
   * second reading; `OsmdView.extractModel` passes the text it loaded.
   */
  musicXml: string;
  /** Model id; defaults to the sheet title slug or `'score'`. */
  id?: string;
  /**
   * The tempo the piece opens at where the file states none at its opening, in quarter notes a minute
   * (`DEFAULT_BPM` unless asked). A tempo the file writes later is a change where it stands.
   */
  defaultBpm?: number;
  /**
   * The hand the item's content object declares for this score, where that declaration is authoritative
   * (HD1; `curriculum/declaredHand.ts` decides, and every caller with a catalogue item asks it). A
   * semantic input, never a staff number and never read from the clef: OSMD numbers a lone staff 1
   * whichever hand plays it, and only the content object knows which.
   *
   * Applied to a **one-staff** score declared `left` or `right` alone: every note takes that hand, and
   * `handsPresent` with it; the physical `staff` stays OSMD's. A score with more than one staff keeps its
   * voice-home-staff and cross-staff hands whatever is declared. A one-staff score declared `both` is a
   * mismatch: no second hand is made, the notes keep their reading by staff number, and the model's
   * `handDeclaration` says so. Absent: CL15's reading, by staff number alone.
   */
  declaredHand?: DeclaredHand;
  /**
   * Verified hand facts for passages of this score (HD2; `content/sources/verified-facts.json`, read by
   * `curriculum/verifiedFacts.ts`, which hands over only rows whose file identity is the item's current
   * one). Explicit score truth where the voice-home reading is established wrong: every note printed in
   * the row's bars (printed bar numbers, inclusive) on its staff in its voice takes the row's hand, and
   * `crossStaff` follows that hand against the printed staff. Applied to a **two-staff** score only; a
   * one-staff score's hand is HD1's declaration. Absent: the voice-home reading everywhere.
   */
  verifiedHands?: readonly VerifiedHand[];
  /**
   * Safety valve: a malformed repeat structure can in principle loop forever.
   * The traversal stops and throws past this many steps.
   */
  maxSteps?: number;
}

/** One verified hand fact as the extractor applies it (HD2): printed bars inclusive, one staff, one voice. */
export interface VerifiedHand {
  bars: readonly [number, number];
  staff: 1 | 2;
  voice: number;
  hand: 'R' | 'L';
}

const DEFAULT_MAX_STEPS = 100_000;

/** Circle-of-fifths names, index 0 = C major / A minor. */
const SHARP_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'] as const;
const FLAT_KEYS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'] as const;
const SHARP_MINOR_KEYS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'] as const;
const FLAT_MINOR_KEYS = ['A', 'D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab'] as const;

/** OSMD's KeyEnum: 0 = major, 1 = minor; anything else is treated as major. */
const KEY_MODE_MINOR = 1;

export function keySignatureName(fifths: number, mode: number): string | undefined {
  const abs = Math.abs(fifths);
  if (!Number.isInteger(fifths) || abs > 7) return undefined;
  const minor = mode === KEY_MODE_MINOR;
  const table = minor
    ? fifths >= 0
      ? SHARP_MINOR_KEYS
      : FLAT_MINOR_KEYS
    : fifths >= 0
      ? SHARP_KEYS
      : FLAT_KEYS;
  const name = table[abs];
  if (name === undefined) return undefined;
  return minor ? `${name} minor` : `${name} major`;
}

function wholeNotesToBeats(realValue: number): number {
  return realValue * WHOLE_NOTE_BEATS;
}

/** OSMD's instruction classes are minified in the shipped bundle, so
 *  `instanceof` against an imported class is fragile across the UMD/ESM
 *  interop. Duck-typing on the two fields a KeyInstruction always has is
 *  stable and costs nothing. */
function readKeySignature(sheet: OsmdLikeSheet): string | undefined {
  const first = sheet.SourceMeasures[0];
  for (const entry of first?.FirstInstructionsStaffEntries ?? []) {
    for (const instruction of entry?.Instructions ?? []) {
      const candidate = instruction as { Key?: unknown; Mode?: unknown };
      if (typeof candidate.Key === 'number' && typeof candidate.Mode === 'number') {
        return keySignatureName(candidate.Key, candidate.Mode);
      }
    }
  }
  return undefined;
}

/**
 * The key signature in force in each printed measure, as a fifths count
 * (T41): the one `writtenAccidental` asks whether a natural is worth naming.
 *
 * Walked in printed order and carried forward, and looked up by the printed
 * measure, so a repeat that jumps back over a key change finds the key that
 * is printed there rather than the last one the playback passed.
 */
function keyFifthsByMeasure(sheet: OsmdLikeSheet): number[] {
  let fifths = 0;
  return sheet.SourceMeasures.map((measure) => {
    for (const entry of measure.FirstInstructionsStaffEntries ?? []) {
      for (const instruction of entry?.Instructions ?? []) {
        const candidate = instruction as { Key?: unknown; Mode?: unknown };
        if (typeof candidate.Key === 'number' && typeof candidate.Mode === 'number') {
          fifths = candidate.Key;
        }
      }
    }
    return fifths;
  });
}

/** The letters a key signature alters, in the order it adds them. */
const SHARPS_ORDER = [5, 0, 7, 2, 9, 4, 11]; // F C G D A E B
const FLATS_ORDER = [11, 4, 9, 2, 7, 0, 5]; // B E A D G C F

const ACCIDENTAL_OF_ALTER: Readonly<Record<number, WrittenAccidental>> = {
  1: 'sharp',
  [-1]: 'flat',
  2: 'double-sharp',
  [-2]: 'double-flat',
};

/**
 * The accidental the note's name carries, as the score writes it (T41).
 *
 * From the notation's own letter and alter, never from the MIDI number: the
 * number is the key, and one key is two or three notes. A natural is named
 * only where the key signature would otherwise alter the letter. Nothing is
 * returned where the written pitch does not reach the MIDI number (a
 * microtone, a triple accidental, a malformed file), rather than a spelling
 * that disagrees with the key the engine waits for.
 */
function writtenAccidental(note: OsmdNote, midi: number, fifths: number): WrittenAccidental | undefined {
  const pitch = note.Pitch;
  if (!pitch) return undefined;
  const letter = pitch.FundamentalNote;
  const alter = pitch.AccidentalHalfTones;
  if (!Number.isInteger(letter) || !Number.isInteger(alter) || Math.abs(alter) > 2) return undefined;
  if ((((midi - letter - alter) % 12) + 12) % 12 !== 0) return undefined;
  if (alter !== 0) return ACCIDENTAL_OF_ALTER[alter];
  const altered =
    fifths > 0 ? SHARPS_ORDER.slice(0, fifths) : fifths < 0 ? FLATS_ORDER.slice(0, -fifths) : [];
  return altered.includes(letter) ? 'natural' : undefined;
}

function staffOf(note: OsmdNote): 1 | 2 {
  const id = note.ParentStaffEntry?.ParentStaff?.Id ?? 1;
  // Piano is two staves. Anything deeper (organ pedal, a condensed score) is
  // folded onto the lower staff rather than widening the type for a case the
  // curriculum never reaches.
  return id >= 2 ? 2 : 1;
}

/**
 * A tie continuation must not be re-expected (docs/05 §1.2), so only the note
 * that *starts* a chain survives.
 */
function isTieContinuation(note: OsmdNote): boolean {
  const tie = note.NoteTie;
  if (!tie) return false;
  return tie.StartNote !== note;
}

function tieDurationBeats(note: OsmdNote): number {
  const notes = note.NoteTie?.Notes;
  if (!notes || notes.length === 0) return wholeNotesToBeats(note.Length.RealValue);
  let total = 0;
  for (const n of notes) total += wholeNotesToBeats(n.Length.RealValue);
  return total;
}

/**
 * The written length of each note in a tie chain, in beats (C2). Only for a
 * chain: an untied note's written length is its `duration`.
 */
function tiedDurationsBeats(note: OsmdNote): number[] | undefined {
  const notes = note.NoteTie?.Notes;
  if (!notes || notes.length < 2) return undefined;
  return notes.map((n) => roundBeats(wholeNotesToBeats(n.Length.RealValue)));
}

/** The tuplet's number, or nothing outside one (C2). */
function tupletOf(note: OsmdNote): number | undefined {
  const label = note.NoteTuplet?.TupletLabelNumber;
  return typeof label === 'number' && Number.isInteger(label) && label > 1 ? label : undefined;
}

function parseFingering(note: OsmdNote): number | undefined {
  const raw = note.Fingering?.value;
  if (raw === undefined) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
}

/**
 * Which staff each voice mostly lives on.
 *
 * Needed because a cross-staff note is *printed* on the other staff but still
 * played by its own hand: the left hand reaching up onto the treble staff is
 * staff 1, hand L. A histogram over the whole piece is robust where a
 * per-note rule is not — voice numbering conventions (1–4 upper, 5–8 lower)
 * are a MuseScore/Finale habit, not a MusicXML rule.
 *
 * **A compatibility reading, not a solved hand classifier (HD2).** A file that
 * reuses a voice number across the staves defeats it (*The Crave* bar 40,
 * *Solace* bars 22, 26, 30, 32: the treble inner line read as the left hand's);
 * where that is established, a verified hand fact overrides it
 * (`ExtractOptions.verifiedHands`). The printed-staff rule with local crossings
 * that would replace it was measured over the whole catalogue and changed 30,662
 * notes in 325 files, rightly on reused voice numbers and wrongly on single-hand
 * lines printed across the staves (*Moonlight* I and III, *Clair de Lune*), so it
 * is held (`docs/prompts/runs/HD2/`), and which hand plays an arbitrary score's
 * note stays UNKNOWN.
 */
function voiceHomeStaves(sheet: OsmdLikeSheet, maxSteps: number): Map<number, 1 | 2> {
  const counts = new Map<number, { upper: number; lower: number }>();
  const it = sheet.MusicPartManager.getIterator();
  let guard = 0;
  while (!it.EndReached && guard < maxSteps) {
    for (const entry of it.CurrentVisibleVoiceEntries()) {
      const voice = entry.ParentVoice?.VoiceId ?? 1;
      let tally = counts.get(voice);
      if (!tally) {
        tally = { upper: 0, lower: 0 };
        counts.set(voice, tally);
      }
      for (const note of entry.Notes) {
        if (note.isRest()) continue;
        if (staffOf(note) === 2) tally.lower += 1;
        else tally.upper += 1;
      }
    }
    it.moveToNextVisibleVoiceEntry(false);
    guard += 1;
  }
  const home = new Map<number, 1 | 2>();
  for (const [voice, tally] of counts) {
    home.set(voice, tally.lower > tally.upper ? 2 : 1);
  }
  return home;
}

/**
 * Walks the sheet once and returns the ScoreModel.
 *
 * Pass the *whole* sheet: OSMD's `Cursor.resetIterator()` narrows its iterator
 * to `rules.MinMeasureToDrawIndex..MaxMeasureToDrawIndex`, so extracting from a
 * windowed OSMD instance would silently produce a model of just the window.
 * `OsmdView.extractModel()` guards against that by extracting before any draw
 * range is applied.
 */
export function extractScoreModelFromSheet(
  sheet: OsmdLikeSheet,
  options: ExtractOptions,
): ScoreModel {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const title = sheet.TitleString?.trim() ?? '';
  const homeStaves = voiceHomeStaves(sheet, maxSteps);
  const keyFifths = keyFifthsByMeasure(sheet);
  const declaration = handDeclarationFor(sheet, options.declaredHand);
  /** The declared hand every note of a one-staff score takes, or nothing (HD1). */
  const declaredHand: 'R' | 'L' | undefined =
    declaration?.outcome === 'applied' ? (declaration.declared === 'left' ? 'L' : 'R') : undefined;
  /** The verified hand facts that apply: a two-staff score's only (HD2); a one-staff score's hand is HD1's. */
  const verified = sheet.Staves.length === 2 ? (options.verifiedHands ?? []) : [];
  /** The verified hand of a note, by its printed bar number, staff and voice, or nothing. */
  const verifiedHandOf = (sourceMeasureIndex: number, staff: 1 | 2, voice: number): 'R' | 'L' | undefined => {
    if (verified.length === 0) return undefined;
    const bar = sheet.SourceMeasures[sourceMeasureIndex]?.MeasureNumber;
    if (bar === undefined) return undefined;
    return verified.find((row) => row.staff === staff && row.voice === voice && bar >= row.bars[0] && bar <= row.bars[1])?.hand;
  };

  const steps: ScoreStep[] = [];
  const tempoMap: TempoMapEntry[] = [];
  const timeSigMap: TimeSignatureEntry[] = [];
  const handsPresent = { R: false, L: false };

  // The file's tempo events by printed measure (the reader's measure ordinal is OSMD's source-measure index).
  const tempoByMeasure = new Map<number, TempoEvent[]>();
  for (const event of tempoEvents(options.musicXml)) {
    const here = tempoByMeasure.get(event.measure);
    if (here) here.push(event);
    else tempoByMeasure.set(event.measure, [event]);
  }
  /**
   * One tempo at a beat of the unrolled timeline: a later event at the same beat replaces the earlier, and
   * an entry that changes nothing is not kept, so every entry is a change. Never earlier than the last
   * entry: the map is in beat order for `beatToMs`.
   */
  const placeTempo = (atBeat: number, bpm: number): void => {
    const last = tempoMap[tempoMap.length - 1];
    const beat = last ? Math.max(atBeat, last.atBeat) : atBeat;
    if (last && last.atBeat === beat) tempoMap.pop();
    if (tempoMap[tempoMap.length - 1]?.bpm !== bpm) tempoMap.push({ atBeat: beat, bpm });
  };

  const it = sheet.MusicPartManager.getIterator();
  let index = 0;
  let measureIndex = -1;
  let previousSourceMeasureIndex = -1;
  let previousInMeasure = 0;
  let previousTimeSig = '';

  while (!it.EndReached) {
    if (index >= maxSteps) {
      throw new Error(
        `extractScoreModel: exceeded ${maxSteps} steps — the repeat structure may be malformed`,
      );
    }
    const sourceMeasureIndex = it.CurrentMeasureIndex;
    const onset = roundBeats(wholeNotesToBeats(it.CurrentEnrolledTimestamp.RealValue));
    const sourceOnset = roundBeats(wholeNotesToBeats(it.CurrentSourceTimestamp.RealValue));

    // The unrolled measure counter advances whenever the printed measure
    // changes, which includes going *backwards* on a repeat — that back jump
    // is a new measure in playback order.
    const isMeasureStart = sourceMeasureIndex !== previousSourceMeasureIndex;
    if (isMeasureStart) {
      measureIndex += 1;
      previousSourceMeasureIndex = sourceMeasureIndex;
      const ts = it.CurrentMeasure?.ActiveTimeSignature;
      if (ts) {
        const key = `${ts.Numerator}/${ts.Denominator}`;
        if (key !== previousTimeSig) {
          timeSigMap.push({
            atMeasure: measureIndex,
            beats: ts.Numerator,
            beatType: ts.Denominator,
          });
          previousTimeSig = key;
        }
      }
    }

    // The file's tempo events in this measure, each at the measure's start on the unrolled timeline plus
    // its own offset, every time the walk enters the measure: a repeat plays a change again where the file
    // writes it (X3d). The measure's start is this entry's onset less its place in the measure. A bar
    // repeated on its own is entered again without the printed measure changing: its place goes back.
    const inMeasure = wholeNotesToBeats(it.CurrentRelativeInMeasureTimestamp?.RealValue ?? 0);
    if (isMeasureStart || inMeasure < previousInMeasure) {
      for (const event of tempoByMeasure.get(sourceMeasureIndex) ?? []) {
        placeTempo(roundBeats(Math.max(0, onset - inMeasure + event.offset)), event.bpm);
      }
    }
    previousInMeasure = inMeasure;

    const notes: ScoreNote[] = [];
    for (const entry of it.CurrentVisibleVoiceEntries()) {
      const voice = entry.ParentVoice?.VoiceId ?? 1;
      const isGrace = entry.IsGrace === true;
      const accented = (entry.Articulations ?? []).some((a) =>
        ACCENT_ARTICULATIONS.has(a.articulationEnum),
      );
      for (const note of entry.Notes) {
        if (note.isRest()) continue;
        if (isTieContinuation(note)) continue;
        const staff = staffOf(note);
        const home = homeStaves.get(voice) ?? staff;
        // Precedence (HD2): a one-staff score's declared hand (HD1: the staff number of a lone staff says
        // nothing about which hand plays it); else a verified hand fact for this passage of a two-staff
        // score; else the voice's home staff, the compatibility reading. `crossStaff` follows the hand
        // the note gets against its printed staff where a fact decides it, and the home staff otherwise.
        const verifiedHand = declaredHand === undefined ? verifiedHandOf(sourceMeasureIndex, staff, voice) : undefined;
        const hand: 'R' | 'L' = declaredHand ?? verifiedHand ?? (home === 2 ? 'L' : 'R');
        const crossStaff = verifiedHand === undefined ? staff !== home : hand !== (staff === 2 ? 'L' : 'R');
        const midi = note.halfTone + OSMD_HALFTONE_TO_MIDI;
        const duration = roundBeats(tieDurationBeats(note));
        const fingering = parseFingering(note);
        const tieLength = note.NoteTie?.Notes?.length ?? 1;
        const tiedDurations = tieLength > 1 ? tiedDurationsBeats(note) : undefined;
        const tuplet = tupletOf(note);
        const accidental = writtenAccidental(note, midi, keyFifths[sourceMeasureIndex] ?? 0);
        notes.push({
          id: makeNoteId({ measureIndex, staff, voice, onset, midi }),
          midi,
          staff,
          hand,
          voice,
          measureIndex,
          sourceMeasureIndex,
          onset,
          sourceOnset,
          duration,
          ...(fingering === undefined ? {} : { fingering }),
          ...(isGrace ? { graceNote: true } : {}),
          ...(crossStaff ? { crossStaff: true } : {}),
          ...(tieLength > 1 ? { tieLength } : {}),
          ...(tiedDurations === undefined ? {} : { tiedDurations }),
          ...(tuplet === undefined ? {} : { tuplet }),
          ...(accented ? { accent: true } : {}),
          ...(accidental === undefined ? {} : { accidental }),
        });
        handsPresent[hand] = true;
      }
    }

    steps.push({
      index,
      onset,
      sourceOnset,
      notes,
      measureIndex,
      sourceMeasureIndex,
      isMeasureStart,
      repetitionIteration: it.CurrentRepetitionIteration,
    });

    it.moveToNextVisibleVoiceEntry(false);
    index += 1;
  }

  // Nothing stated at the opening: the default until the file's first tempo (kept only where that differs).
  if (tempoMap.length === 0 || (tempoMap[0]?.atBeat ?? 0) > 0) {
    tempoMap.unshift({ atBeat: 0, bpm: options.defaultBpm ?? DEFAULT_BPM });
    if (tempoMap[1]?.bpm === tempoMap[0]?.bpm) tempoMap.splice(1, 1);
  }
  if (timeSigMap.length === 0) {
    timeSigMap.push({ atMeasure: 0, beats: 4, beatType: 4 });
  }

  return withBeatToMs({
    id: options.id ?? slugify(title) ?? 'score',
    title,
    steps,
    tempoMap,
    timeSigMap,
    measureCount: measureIndex + 1,
    sourceMeasureCount: sheet.SourceMeasures.length,
    ...(sheet.SourceMeasures[0]?.ImplicitMeasure === true ? { pickup: true } : {}),
    ...(readKeySignature(sheet) === undefined ? {} : { keySig: readKeySignature(sheet) }),
    handsPresent,
    ...(declaration === undefined ? {} : { handDeclaration: declaration }),
  });
}

/**
 * What a declared hand does to this sheet (HD1): applied to a one-staff score declared one hand; nothing
 * on a score of more than one staff, whose staves already say whose each note is; a mismatch on a
 * one-staff score declared both, which cannot hold two hands' notes. Decided by the sheet's staff count,
 * never by a clef or by which staves sound.
 */
function handDeclarationFor(sheet: OsmdLikeSheet, declared: DeclaredHand | undefined): HandDeclaration | undefined {
  if (declared === undefined) return undefined;
  if (sheet.Staves.length !== 1) return { declared, outcome: 'not-one-staff' };
  return { declared, outcome: declared === 'both' ? 'mismatch' : 'applied' };
}

function slugify(value: string): string | undefined {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : undefined;
}

/**
 * Convenience wrapper for an `OpenSheetMusicDisplay` instance, with the MusicXML it was loaded from
 * (`options.musicXml`: OSMD keeps no copy of the text, and the tempo map is read from it).
 */
export function extractScoreModel(
  osmd: { Sheet?: unknown },
  options: ExtractOptions,
): ScoreModel {
  const sheet = osmd.Sheet as OsmdLikeSheet | undefined;
  if (!sheet?.MusicPartManager) {
    throw new Error('extractScoreModel: the OSMD instance has no loaded sheet');
  }
  return extractScoreModelFromSheet(sheet, options);
}
