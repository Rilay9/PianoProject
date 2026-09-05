// ScoreModel — the single source of truth for what the learner must play.
//
// Defined in docs/01-architecture.md §4.1. The practice engine (P3) works on
// this and nothing else: no OSMD types, no DOM, no MusicXML. That is what
// makes matching and scoring testable in Node, and what lets the renderer be
// swapped without touching the engine.
//
// Two conventions worth stating once, because every number below depends on
// them:
//
//  * **Beats are quarter notes**, counted from the start of the *unrolled*
//    piece (repeats expanded). Not "beats of the current time signature" —
//    in 6/8 a dotted-quarter pulse is 1.5 beats here. Converting to a musical
//    pulse is the UI's job, not the model's.
//  * **Measure indexes come in two flavours.** `measureIndex` is the position
//    in playback order after repeats are unrolled; `sourceMeasureIndex` is the
//    measure as printed. They diverge the moment a repeat is taken, and the
//    cursor needs the first while the renderer needs the second.

/** Ticks per quarter note, used only to build stable note ids. */
export const TICKS_PER_QUARTER = 960;

/** A whole note is four quarter-note beats. */
export const WHOLE_NOTE_BEATS = 4;

export interface ScoreNote {
  /** Stable within a score: `${measureIndex}:${staff}:${voice}:${onsetTicks}:${midi}`. */
  id: string;
  /** 21..108 for an 88-key piano; not clamped, so out-of-range input is visible. */
  midi: number;
  /** Printed staff: 1 = upper (usually RH), 2 = lower (usually LH). */
  staff: 1 | 2;
  /**
   * Which hand plays it. Normally staff 1 → R, staff 2 → L, but a cross-staff
   * note (the left hand reaching up onto the treble staff) keeps the hand of
   * its voice, which is what the learner's fingers actually do.
   */
  hand: 'R' | 'L';
  voice: number;
  /** 0-based, in playback order after repeats are unrolled. */
  measureIndex: number;
  /** 0-based, measure as printed — for cursor placement. */
  sourceMeasureIndex: number;
  /** Quarter-note beats from the start of the unrolled piece. */
  onset: number;
  /**
   * Quarter-note beats on the *printed* timeline. Identical to `onset` until a
   * repeat is taken. The renderer needs it: a drawn note exists once on screen
   * however many passes the player makes over it, so this is what identifies
   * an element (see `printedNoteKey`).
   */
  sourceOnset: number;
  /** Beats. Tie chains are merged into the first note; continuations are dropped. */
  duration: number;
  /** From dynamics, for playback only. 1..127. */
  velocityHint?: number;
  /** 1..5 if the MusicXML carried one. */
  fingering?: number;
  /** Grace notes are excluded from matching by default (docs/05 §1.3). */
  graceNote?: boolean;
  /** True when the printed staff is not this voice's home staff. */
  crossStaff?: boolean;
  /** Number of notes in the merged tie chain (1 = untied). */
  tieLength?: number;
}

/**
 * One cursor position: every note that starts at this onset.
 *
 * `notes` can be **empty**, which the doc's "≥1" did not anticipate. Two real
 * cases produce it, and both must still occupy a step so that
 * `step.index === number of cursor.next() calls` holds:
 *   * a step whose only voice entries are rests;
 *   * a step whose only note is the continuation of a tie, already merged into
 *     the note that started it.
 * docs/05 §1.1 already requires the engine to pass through steps with an empty
 * expected set ("silent placeholders … so the display stays aligned"), so an
 * empty `notes` needs no special handling downstream.
 */
export interface ScoreStep {
  index: number;
  /** Quarter-note beats from the start of the unrolled piece. */
  onset: number;
  /** Quarter-note beats on the printed timeline (see ScoreNote.sourceOnset). */
  sourceOnset: number;
  notes: ScoreNote[];
  /** Unrolled measure index. */
  measureIndex: number;
  /** Printed measure index — what the renderer draws. */
  sourceMeasureIndex: number;
  isMeasureStart: boolean;
  /** Which pass through a repeated section this step belongs to (1-based). */
  repetitionIteration: number;
}

export interface TempoMapEntry {
  /** Quarter-note beats, unrolled timeline. */
  atBeat: number;
  bpm: number;
}

export interface TimeSignatureEntry {
  /** Unrolled measure index this signature starts at. */
  atMeasure: number;
  beats: number;
  beatType: number;
}

/** The serialisable half of a ScoreModel — what golden tests compare. */
export interface ScoreModelData {
  id: string;
  title: string;
  steps: ScoreStep[];
  tempoMap: TempoMapEntry[];
  timeSigMap: TimeSignatureEntry[];
  /** Unrolled measure count. */
  measureCount: number;
  /** Printed measure count — the range the renderer can draw. */
  sourceMeasureCount: number;
  keySig?: string;
  handsPresent: { R: boolean; L: boolean };
}

export interface ScoreModel extends ScoreModelData {
  /**
   * Milliseconds from the start of the piece to `beat`, following the tempo
   * map. `tempoScale` is a multiplier, not a percentage: 0.7 means "70 % of
   * the written tempo", so the result gets *longer*.
   */
  beatToMs(beat: number, tempoScale?: number): number;
}

/** Rounds to the tick grid, so golden JSON is byte-stable across platforms. */
export function roundBeats(beats: number): number {
  return Math.round(beats * TICKS_PER_QUARTER) / TICKS_PER_QUARTER;
}

export function beatsToTicks(beats: number): number {
  return Math.round(beats * TICKS_PER_QUARTER);
}

export function makeNoteId(note: {
  measureIndex: number;
  staff: number;
  voice: number;
  onset: number;
  midi: number;
}): string {
  return [
    note.measureIndex,
    note.staff,
    note.voice,
    beatsToTicks(note.onset),
    note.midi,
  ].join(':');
}

/**
 * Identifies a *drawn* note: printed measure, staff, voice, printed onset and
 * pitch. Unlike `ScoreNote.id` this is deliberately the same on every repeat
 * pass, because the element on screen is the same one.
 */
export function printedNoteKey(note: {
  sourceMeasureIndex: number;
  staff: number;
  voice: number;
  sourceOnset: number;
  midi: number;
}): string {
  return [
    note.sourceMeasureIndex,
    note.staff >= 2 ? 2 : 1,
    note.voice,
    beatsToTicks(note.sourceOnset),
    note.midi,
  ].join(':');
}

/**
 * Integrates a tempo map from beat 0 to `beat`.
 *
 * Written as a free function so the engine can call it on a plain deserialised
 * model (from IndexedDB, say) that has no methods attached.
 */
export function beatToMs(
  tempoMap: readonly TempoMapEntry[],
  beat: number,
  tempoScale = 1,
): number {
  if (beat <= 0 || tempoMap.length === 0) return 0;
  const scale = tempoScale > 0 ? tempoScale : 1;
  let ms = 0;
  for (let i = 0; i < tempoMap.length; i += 1) {
    const entry = tempoMap[i];
    if (!entry || entry.atBeat >= beat) break;
    const next = tempoMap[i + 1];
    const segmentEnd = next && next.atBeat < beat ? next.atBeat : beat;
    const beats = segmentEnd - entry.atBeat;
    if (beats > 0) ms += (beats * 60_000) / (entry.bpm * scale);
  }
  return ms;
}

/** Attaches `beatToMs` to plain model data. */
export function withBeatToMs(data: ScoreModelData): ScoreModel {
  return {
    ...data,
    beatToMs(beat: number, tempoScale = 1): number {
      return beatToMs(data.tempoMap, beat, tempoScale);
    },
  };
}

/** Strips the method back off, for serialising or comparing against a golden. */
export function toScoreModelData(model: ScoreModel): ScoreModelData {
  const { id, title, steps, tempoMap, timeSigMap, measureCount, sourceMeasureCount, keySig, handsPresent } =
    model;
  return {
    id,
    title,
    steps,
    tempoMap,
    timeSigMap,
    measureCount,
    sourceMeasureCount,
    ...(keySig === undefined ? {} : { keySig }),
    handsPresent,
  };
}

/** The time signature in force at an unrolled measure index. */
export function timeSignatureAt(
  timeSigMap: readonly TimeSignatureEntry[],
  measureIndex: number,
): TimeSignatureEntry | undefined {
  let found: TimeSignatureEntry | undefined;
  for (const entry of timeSigMap) {
    if (entry.atMeasure > measureIndex) break;
    found = entry;
  }
  return found;
}

/** The tempo in force at a beat. */
export function bpmAt(tempoMap: readonly TempoMapEntry[], beat: number): number {
  let bpm = tempoMap[0]?.bpm ?? 100;
  for (const entry of tempoMap) {
    if (entry.atBeat > beat) break;
    bpm = entry.bpm;
  }
  return bpm;
}
