// Hand-made phrases for the demand detectors' tests (C2).
//
// Builds a `ScoreModelData` directly, in the shape `extractScoreModel` gives it
// (quarter-note beats, tie chains merged into their first note with the written
// parts kept, the written accidental on the note), so a detector can be held to
// one bar at a time without a MusicXML file or OSMD. The generated phrases in
// `sightReadingPromises.test.ts` go through the real extractor; these are for
// the edges a generator never happens to write.

import { makeNoteId, type ScoreModelData, type ScoreNote, type ScoreStep, type WrittenAccidental } from '../../../src/score/types';

export interface HandNote {
  /** Beats (quarter notes) from the start of the bar. */
  at: number;
  /** Beats. Ignored when `tie` is given: the chain's parts are summed. */
  dur?: number;
  /** `C4`, `F#4`, `Bb3`, `Bn4` (a natural), `F##4`, `Bbb3`. */
  pitch: string;
  staff?: 1 | 2;
  voice?: number;
  /** The written parts of a tie chain, in beats, in order. */
  tie?: number[];
  /** The tuplet's number (3 for a triplet). */
  tuplet?: number;
  grace?: boolean;
}

export interface HandPhrase {
  /** `4/4` unless said. */
  time?: string;
  /** The model's `keySig` name, e.g. `G major`; absent means none. */
  key?: string;
  bars: HandNote[][];
}

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SIGN: Record<string, { alter: number; accidental: WrittenAccidental }> = {
  '#': { alter: 1, accidental: 'sharp' },
  b: { alter: -1, accidental: 'flat' },
  n: { alter: 0, accidental: 'natural' },
  '##': { alter: 2, accidental: 'double-sharp' },
  bb: { alter: -2, accidental: 'double-flat' },
};

export function parsePitch(pitch: string): { midi: number; accidental?: WrittenAccidental } {
  const match = /^([A-G])(##|bb|#|b|n)?(-?\d)$/.exec(pitch);
  if (!match) throw new Error(`bad pitch ${pitch}`);
  const [, letter, sign, octave] = match;
  const accidental = sign ? SIGN[sign] : undefined;
  const midi = (Number(octave) + 1) * 12 + (STEP[letter ?? 'C'] ?? 0) + (accidental?.alter ?? 0);
  return accidental ? { midi, accidental: accidental.accidental } : { midi };
}

/** The whole model, one step per distinct onset and one at every bar line. */
export function phrase(spec: HandPhrase): ScoreModelData {
  const [beats, beatType] = (spec.time ?? '4/4').split('/').map(Number) as [number, number];
  const barLength = (beats * 4) / beatType;
  const byOnset = new Map<number, { bar: number; notes: ScoreNote[] }>();
  const handsPresent = { R: false, L: false };
  spec.bars.forEach((bar, measureIndex) => {
    const barStart = measureIndex * barLength;
    if (!byOnset.has(barStart)) byOnset.set(barStart, { bar: measureIndex, notes: [] });
    for (const n of bar) {
      const staff = n.staff ?? 1;
      const voice = n.voice ?? (staff === 2 ? 5 : 1);
      const onset = barStart + n.at;
      const { midi, accidental } = parsePitch(n.pitch);
      const duration = n.tie ? n.tie.reduce((a, b) => a + b, 0) : (n.dur ?? 1);
      const hand = staff === 2 ? 'L' : 'R';
      handsPresent[hand] = true;
      const note: ScoreNote = {
        id: makeNoteId({ measureIndex, staff, voice, onset, midi }),
        midi,
        staff,
        hand,
        voice,
        measureIndex,
        sourceMeasureIndex: measureIndex,
        onset,
        sourceOnset: onset,
        duration,
        ...(n.grace ? { graceNote: true } : {}),
        ...(n.tie && n.tie.length > 1 ? { tieLength: n.tie.length, tiedDurations: n.tie } : {}),
        ...(n.tuplet ? { tuplet: n.tuplet } : {}),
        ...(accidental ? { accidental } : {}),
      };
      const entry = byOnset.get(onset) ?? { bar: measureIndex, notes: [] };
      entry.notes.push(note);
      byOnset.set(onset, entry);
    }
  });
  const onsets = [...byOnset.keys()].sort((a, b) => a - b);
  let previousBar = -1;
  const steps: ScoreStep[] = onsets.map((onset, index) => {
    const entry = byOnset.get(onset) as { bar: number; notes: ScoreNote[] };
    const isMeasureStart = entry.bar !== previousBar;
    previousBar = entry.bar;
    return {
      index,
      onset,
      sourceOnset: onset,
      notes: entry.notes,
      measureIndex: entry.bar,
      sourceMeasureIndex: entry.bar,
      isMeasureStart,
      repetitionIteration: 1,
    };
  });
  return {
    id: 'hand-made',
    title: 'hand-made',
    steps,
    tempoMap: [{ atBeat: 0, bpm: 72 }],
    timeSigMap: [{ atMeasure: 0, beats, beatType }],
    measureCount: spec.bars.length,
    sourceMeasureCount: spec.bars.length,
    ...(spec.key === undefined ? {} : { keySig: spec.key }),
    handsPresent,
  };
}

/** A bar of the given pitches in one staff, one per `dur`, from beat 0. */
export function line(pitches: string[], dur = 1, staff: 1 | 2 = 1): HandNote[] {
  return pitches.map((pitch, i) => ({ at: i * dur, dur, pitch, staff }));
}
