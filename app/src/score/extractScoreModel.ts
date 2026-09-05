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

import {
  makeNoteId,
  roundBeats,
  WHOLE_NOTE_BEATS,
  withBeatToMs,
  type ScoreModel,
  type ScoreNote,
  type ScoreStep,
  type TempoMapEntry,
  type TimeSignatureEntry,
} from './types';

/**
 * OSMD's `Note.halfTone` counts semitones from C-1 with C4 = 48, while MIDI
 * puts middle C at 60. Verified against fixtures rather than derived from the
 * source: A0 → 21, C4 → 60, C8 → 108.
 */
export const OSMD_HALFTONE_TO_MIDI = 12;

/** OSMD's own fallback when a sheet carries no tempo at all. */
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
  CurrentBpm: number;
  CurrentRepetitionIteration: number;
  CurrentVisibleVoiceEntries(): OsmdVoiceEntry[];
  moveToNextVisibleVoiceEntry(notesOnly: boolean): void;
}

export interface OsmdVoiceEntry {
  IsGrace?: boolean;
  ParentVoice?: { VoiceId: number };
  Notes: OsmdNote[];
}

export interface OsmdNote {
  halfTone: number;
  Length: { RealValue: number };
  Fingering?: { value?: string } | undefined;
  NoteTie?: { StartNote?: OsmdNote; Notes?: OsmdNote[] } | undefined;
  ParentStaffEntry?: { ParentStaff?: { Id?: number } } | undefined;
  isRest(): boolean;
}

export interface ExtractOptions {
  /** Model id; defaults to the sheet title slug or `'score'`. */
  id?: string;
  /**
   * Tempo used when the sheet has none. OSMD seeds its own iterator with
   * `DefaultStartTempoInBpm`, so this only bites on sheets with no tempo
   * information at all.
   */
  defaultBpm?: number;
  /**
   * Safety valve: a malformed repeat structure can in principle loop forever.
   * The traversal stops and throws past this many steps.
   */
  maxSteps?: number;
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
  options: ExtractOptions = {},
): ScoreModel {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const title = sheet.TitleString?.trim() ?? '';
  const homeStaves = voiceHomeStaves(sheet, maxSteps);

  const steps: ScoreStep[] = [];
  const tempoMap: TempoMapEntry[] = [];
  const timeSigMap: TimeSignatureEntry[] = [];
  const handsPresent = { R: false, L: false };

  const it = sheet.MusicPartManager.getIterator();
  let index = 0;
  let measureIndex = -1;
  let previousSourceMeasureIndex = -1;
  let previousBpm = Number.NaN;
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

    // Tempo comes from the iterator, not from SourceMeasure.TempoExpressions:
    // the iterator's bpm already follows the *unrolled* timeline, so a tempo
    // change inside a repeated section is emitted once per pass, which is what
    // playback needs. (Expressions carry printed timestamps instead.)
    const bpm = it.CurrentBpm;
    if (Number.isFinite(bpm) && bpm > 0 && bpm !== previousBpm) {
      tempoMap.push({ atBeat: onset, bpm });
      previousBpm = bpm;
    }

    const notes: ScoreNote[] = [];
    for (const entry of it.CurrentVisibleVoiceEntries()) {
      const voice = entry.ParentVoice?.VoiceId ?? 1;
      const isGrace = entry.IsGrace === true;
      for (const note of entry.Notes) {
        if (note.isRest()) continue;
        if (isTieContinuation(note)) continue;
        const staff = staffOf(note);
        const home = homeStaves.get(voice) ?? staff;
        const hand: 'R' | 'L' = home === 2 ? 'L' : 'R';
        const midi = note.halfTone + OSMD_HALFTONE_TO_MIDI;
        const duration = roundBeats(tieDurationBeats(note));
        const fingering = parseFingering(note);
        const tieLength = note.NoteTie?.Notes?.length ?? 1;
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
          ...(staff !== home ? { crossStaff: true } : {}),
          ...(tieLength > 1 ? { tieLength } : {}),
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

  if (tempoMap.length === 0 || (tempoMap[0]?.atBeat ?? 0) > 0) {
    tempoMap.unshift({ atBeat: 0, bpm: options.defaultBpm ?? DEFAULT_BPM });
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
    ...(readKeySignature(sheet) === undefined ? {} : { keySig: readKeySignature(sheet) }),
    handsPresent,
  });
}

function slugify(value: string): string | undefined {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : undefined;
}

/** Convenience wrapper for an `OpenSheetMusicDisplay` instance. */
export function extractScoreModel(
  osmd: { Sheet?: unknown },
  options: ExtractOptions = {},
): ScoreModel {
  const sheet = osmd.Sheet as OsmdLikeSheet | undefined;
  if (!sheet?.MusicPartManager) {
    throw new Error('extractScoreModel: the OSMD instance has no loaded sheet');
  }
  return extractScoreModelFromSheet(sheet, options);
}
