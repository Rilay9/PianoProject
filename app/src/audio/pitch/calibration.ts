// The microphone calibration routine (docs/05 §11.5).
//
// Everything here is a pure function over recorded audio, for two reasons.
// First, the spectrum lives in the worklet, but the worklet can already stream
// raw audio back for the Diagnostics capture — so calibration reuses that path
// and analyses on the main thread, where there is time to do it properly.
// Second, it means the whole routine is testable in Vitest against the
// rendered piano fixtures instead of only against a real room.
//
// What the routine is actually for: the detector's thresholds are in dB over a
// local background, and a phone microphone does not hear a C2 and a C6 at
// anything like the same level. Without a per-pitch gain correction one end of
// the keyboard sits under the threshold and the other triggers on its own
// reverberation.

import {
  computeSpectrum,
  createSpectrumContext,
  defaultInharmonicityFor,
  DB_FLOOR,
  harmonicScore,
  hzToMidi,
  interpolatedPeakNear,
  midiToHz,
  type SpectrumContext,
} from './dsp';
import { HOP_SIZE, LOW_WINDOW_MAX_MIDI, LOW_WINDOW_SIZE, WINDOW_SIZE } from './detector';
import type { MicCalibration } from './MicSource';

/** Partials used for the inharmonicity fit; above the 6th they are too weak. */
const FIT_PARTIALS = [1, 2, 3, 4, 5, 6];

/** How far from the predicted position a partial may be found, in semitones. */
const PARTIAL_SEARCH_SEMITONES = 0.7;

/** A partial this far under the fundamental is noise, not a partial. */
const PARTIAL_FLOOR_DB = 40;

/** Inharmonicity is clamped to a physically sane range for a piano string. */
const MIN_INHARMONICITY = 0;
const MAX_INHARMONICITY = 0.01;

/** Gain corrections are bounded so one bad recording cannot deafen the detector. */
export const MAX_GAIN_DB = 12;

export interface PitchMeasurement {
  midi: number;
  /** Harmonic-template score at the loudest frame, in dB over background. */
  scoreDb: number;
  /** Level of the fundamental over the local background. */
  fundamentalDb: number;
  /**
   * How far the fundamental actually sits from where the pitch says it should,
   * in cents. A piano tuned a month ago is a few cents out; a quarter tone out
   * means the peak that was found belongs to a different note.
   */
  detuneCents: number;
  /** Fitted inharmonicity coefficient, or the default if the fit failed. */
  inharmonicity: number;
  /** Partials the fit actually found. */
  partialsFound: number;
  /** Seconds into the recording where the loudest frame was. */
  atSec: number;
}

/** RMS level of a window in dBFS. */
function rmsDb(samples: Float32Array, from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to; i += 1) {
    const value = samples[i] as number;
    sum += value * value;
  }
  const count = Math.max(1, to - from);
  const mean = sum / count;
  return mean > 0 ? Math.max(DB_FLOOR, 10 * Math.log10(mean)) : DB_FLOOR;
}

/**
 * The room's noise floor, from a recording of the learner sitting still.
 *
 * The 10th percentile of short-window RMS rather than the minimum: a recording
 * of "silence" always contains a cough, a chair, or the fan cycling, and the
 * minimum would be whatever happened between two of them.
 */
export function measureNoiseFloorDb(samples: Float32Array, sampleRate: number): number {
  const window = Math.round(sampleRate * 0.05);
  if (samples.length < window) return rmsDb(samples, 0, samples.length);
  const levels: number[] = [];
  for (let start = 0; start + window <= samples.length; start += window) {
    levels.push(rmsDb(samples, start, start + window));
  }
  levels.sort((a, b) => a - b);
  return levels[Math.min(levels.length - 1, Math.floor(levels.length * 0.1))] ?? DB_FLOOR;
}

/** The frame in `samples` where `midi` is loudest, as a spectrum context. */
function loudestFrame(
  samples: Float32Array,
  sampleRate: number,
  midi: number,
): { ctx: SpectrumContext; scoreDb: number; atSec: number } | null {
  const size = midi <= LOW_WINDOW_MAX_MIDI ? LOW_WINDOW_SIZE : WINDOW_SIZE;
  if (samples.length < size) return null;
  const ctx = createSpectrumContext(size, sampleRate);
  const scratch = new Float32Array(2048);
  const best = createSpectrumContext(size, sampleRate);
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestEnd = size;
  // Every fourth hop: the loudest frame of a struck note is a plateau tens of
  // milliseconds wide, so there is nothing to gain from looking at all of them.
  for (let end = size; end <= samples.length; end += HOP_SIZE * 4) {
    computeSpectrum(ctx, samples, end - size);
    const score = harmonicScore(ctx, midi, { scratch });
    if (score > bestScore) {
      bestScore = score;
      bestEnd = end;
      best.magnitude.set(ctx.magnitude);
      best.peakDb = ctx.peakDb;
    }
  }
  if (bestScore === Number.NEGATIVE_INFINITY) return null;
  return { ctx: best, scoreDb: bestScore, atSec: (bestEnd - size / 2) / sampleRate };
}

/**
 * Measures one pitch from a recording of it being played on its own.
 *
 * The inharmonicity fit is the interesting part. A real string is stiff, so
 * partial *h* sits at `h·f0·√(1 + B·h²)`; rearranged, `(f_h / h·f0)² − 1 = B·h²`,
 * which is a straight line through the origin in `h²`. Least squares over the
 * partials that were actually found gives B directly, and B is what lets the
 * detector's search windows sit on the partials of *this* piano rather than of
 * an ideal one — it matters most in the bass, where B is largest and the
 * windows are narrowest in absolute terms.
 */
export function measurePitch(
  samples: Float32Array,
  sampleRate: number,
  midi: number,
): PitchMeasurement | null {
  const frame = loudestFrame(samples, sampleRate, midi);
  if (!frame) return null;
  const { ctx } = frame;
  const f0 = midiToHz(midi);
  const nyquist = sampleRate / 2;

  const fundamental = interpolatedPeakNear(ctx, f0, PARTIAL_SEARCH_SEMITONES);
  let numerator = 0;
  let denominator = 0;
  let found = 0;
  for (const h of FIT_PARTIALS) {
    // Search around the *ideal* position; the deviation being measured is far
    // smaller than the search window, so this does not bias the fit.
    const ideal = h * f0;
    if (ideal >= nyquist) break;
    const peak = interpolatedPeakNear(ctx, ideal, PARTIAL_SEARCH_SEMITONES);
    if (peak.db < fundamental.db - PARTIAL_FLOOR_DB) continue;
    found += 1;
    if (h === 1) continue;
    const ratio = peak.hz / ideal;
    const y = ratio * ratio - 1;
    const x = h * h;
    numerator += x * y;
    denominator += x * x;
  }

  const fitted = denominator > 0 ? numerator / denominator : Number.NaN;
  const inharmonicity = Number.isFinite(fitted)
    ? Math.min(MAX_INHARMONICITY, Math.max(MIN_INHARMONICITY, fitted))
    : defaultInharmonicityFor(midi);

  return {
    midi,
    scoreDb: frame.scoreDb,
    fundamentalDb: fundamental.db - ctx.peakDb,
    detuneCents: 1200 * Math.log2(fundamental.hz / f0),
    inharmonicity,
    partialsFound: found,
    atSec: frame.atSec,
  };
}

/**
 * Input latency from the learner playing along with the metronome.
 *
 * docs/05 §11.5 defines it as onset time minus click time. That folds the
 * learner's own timing into the number, which is why the median is used and
 * the result is clamped: a human playing with a click is scattered by tens of
 * milliseconds either way but is not systematically 300 ms late, so anything
 * outside the plausible range is a mis-measurement rather than a slow phone.
 */
export const MAX_MEASURED_LATENCY_MS = 150;

export function estimateLatencyMs(offsetsMs: readonly number[]): number {
  if (offsetsMs.length === 0) return 0;
  const sorted = [...offsetsMs].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
      : (sorted[middle] as number);
  return Math.min(MAX_MEASURED_LATENCY_MS, Math.max(0, median));
}

/**
 * Turns the measurements into the table the detector runs on.
 *
 * The gain correction is *relative*: each pitch is pulled towards the median
 * of everything measured, so that one threshold means the same thing across
 * the keyboard. Absolute level is deliberately not calibrated — it depends on
 * how hard the learner happened to play, which is not a property of the room.
 */
export function buildCalibration(
  measurements: readonly PitchMeasurement[],
  extras: {
    noiseFloorDb: number;
    latencyMs: number;
    /** Thresholds for a line input, when the device is not a room mic. */
    thresholds?: Partial<MicCalibration['thresholds']>;
  },
): MicCalibration {
  const scores = measurements.map((m) => m.scoreDb).sort((a, b) => a - b);
  const middle = Math.floor(scores.length / 2);
  const reference =
    scores.length === 0
      ? 0
      : scores.length % 2 === 0
        ? ((scores[middle - 1] as number) + (scores[middle] as number)) / 2
        : (scores[middle] as number);

  const gainDb: [number, number][] = [];
  const inharmonicity: [number, number][] = [];
  for (const measurement of measurements) {
    const correction = Math.min(MAX_GAIN_DB, Math.max(-MAX_GAIN_DB, reference - measurement.scoreDb));
    gainDb.push([measurement.midi, Number(correction.toFixed(2))]);
    inharmonicity.push([measurement.midi, Number(measurement.inharmonicity.toFixed(6))]);
  }

  return {
    gainDb: interpolateAcrossKeyboard(gainDb),
    inharmonicity: interpolateAcrossKeyboard(inharmonicity),
    latencyMs: extras.latencyMs,
    noiseFloorDb: extras.noiseFloorDb,
    thresholds: extras.thresholds ?? {},
  };
}

/**
 * Fills in the pitches the routine did not ask the learner to play.
 *
 * §11.5 has them play each C and a chromatic scale in the middle, which is a
 * dozen or so pitches out of 88. Both quantities vary smoothly with pitch —
 * gain follows the microphone's frequency response, inharmonicity follows
 * string length — so linear interpolation between the measured points, held
 * flat outside them, is a far better prior than the defaults.
 */
function interpolateAcrossKeyboard(points: [number, number][]): [number, number][] {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const first = sorted[0] as [number, number];
  const last = sorted[sorted.length - 1] as [number, number];
  const out: [number, number][] = [];
  let index = 0;
  for (let midi = 21; midi <= 108; midi += 1) {
    if (midi <= first[0]) {
      out.push([midi, first[1]]);
      continue;
    }
    if (midi >= last[0]) {
      out.push([midi, last[1]]);
      continue;
    }
    while (index < sorted.length - 1 && (sorted[index + 1] as [number, number])[0] < midi) index += 1;
    const low = sorted[index] as [number, number];
    const high = sorted[index + 1] as [number, number];
    const span = high[0] - low[0];
    const t = span === 0 ? 0 : (midi - low[0]) / span;
    out.push([midi, Number((low[1] + t * (high[1] - low[1])).toFixed(4))]);
  }
  return out;
}

// --- the guided routine ------------------------------------------------------

export type CalibrationStageId = 'noise' | 'octaves' | 'scale' | 'chords';

export interface CalibrationStage {
  id: CalibrationStageId;
  title: string;
  /** What the screen tells the learner to do. */
  instruction: string;
  /** Seconds the stage records for. */
  seconds: number;
  /** Pitches this stage expects, in order. Empty for the silence stage. */
  pitches: number[];
}

/** C1 to C7 — "play each C across the keyboard" (docs/05 §11.5). */
export const OCTAVE_CS = [24, 36, 48, 60, 72, 84, 96];

/** C3 to C5 chromatically. */
export const SCALE_PITCHES = Array.from({ length: 25 }, (_, i) => 48 + i);

/** C, F and G major triads in root position. */
export const CHECK_CHORDS = [
  [60, 64, 67],
  [65, 69, 72],
  [67, 71, 74],
];

/** The four stages of §11.5, in order; about sixty seconds in total. */
export const CALIBRATION_STAGES: readonly CalibrationStage[] = [
  {
    id: 'noise',
    title: 'Silence',
    instruction: 'Sit still and stay quiet — this measures the room.',
    seconds: 5,
    pitches: [],
  },
  {
    id: 'octaves',
    title: 'Every C',
    instruction: 'Play each C up the keyboard, one at a time, at a normal volume.',
    seconds: 20,
    pitches: OCTAVE_CS,
  },
  {
    id: 'scale',
    title: 'Chromatic scale',
    instruction: 'Play C3 up to C5 chromatically, one note per metronome click.',
    seconds: 26,
    pitches: SCALE_PITCHES,
  },
  {
    id: 'chords',
    title: 'Three chords',
    instruction: 'Play C, F and G major, hands together, letting each ring.',
    seconds: 9,
    pitches: CHECK_CHORDS.flat(),
  },
];

export interface StageRecording {
  id: CalibrationStageId;
  samples: Float32Array;
  sampleRate: number;
  /** For the scale stage: the metronome click times, in the same ms timeline. */
  clickTimesMs?: number[];
  /** For the scale stage: onset times the detector reported. */
  onsetTimesMs?: number[];
}

export interface CalibrationResult {
  calibration: MicCalibration;
  measurements: PitchMeasurement[];
  /** Pitches the routine could not hear at all — the screen names them. */
  missed: number[];
  /** How many of the three check chords were heard in full. */
  chordsHeard: number;
}

/**
 * Turns the recordings from the four stages into a stored calibration.
 *
 * Each pitch is measured from its own slice of the octaves recording, located
 * by looking for the frame where that pitch scores highest — the learner is
 * playing to an instruction, not a click, so the notes cannot be assumed to
 * land on a schedule.
 */
export function analyseCalibration(
  recordings: readonly StageRecording[],
  options: { lineInput?: boolean; thresholds?: MicCalibration['thresholds'] } = {},
): CalibrationResult {
  const byId = new Map(recordings.map((r) => [r.id, r]));
  const noise = byId.get('noise');
  const noiseFloorDb = noise ? measureNoiseFloorDb(noise.samples, noise.sampleRate) : DB_FLOOR;

  const measurements: PitchMeasurement[] = [];
  const missed: number[] = [];
  for (const stage of ['octaves', 'scale'] as const) {
    const recording = byId.get(stage);
    if (!recording) continue;
    const definition = CALIBRATION_STAGES.find((s) => s.id === stage);
    for (const midi of definition?.pitches ?? []) {
      const measured = measurePitch(recording.samples, recording.sampleRate, midi);
      // A pitch whose fundamental never rose above the noise was not played,
      // or was not heard; either way its measurement would be of the room.
      if (!isHeard(measured)) {
        missed.push(midi);
        continue;
      }
      measurements.push(measured);
    }
  }

  const scaleRecording = byId.get('scale');
  const offsets: number[] = [];
  const clicks = scaleRecording?.clickTimesMs ?? [];
  for (const onset of scaleRecording?.onsetTimesMs ?? []) {
    let best = Number.POSITIVE_INFINITY;
    for (const click of clicks) {
      const delta = onset - click;
      if (Math.abs(delta) < Math.abs(best)) best = delta;
    }
    if (Number.isFinite(best)) offsets.push(best);
  }

  const chords = byId.get('chords');
  let chordsHeard = 0;
  if (chords) {
    for (const chord of CHECK_CHORDS) {
      const heard = chord.filter((midi) =>
        isHeard(measurePitch(chords.samples, chords.sampleRate, midi)),
      );
      if (heard.length === chord.length) chordsHeard += 1;
    }
  }

  return {
    calibration: buildCalibration(measurements, {
      noiseFloorDb,
      latencyMs: estimateLatencyMs(offsets),
      ...(options.thresholds ? { thresholds: options.thresholds } : {}),
    }),
    measurements,
    missed,
    chordsHeard,
  };
}

/** Below this a "measurement" is of the room rather than of the piano. */
export const MIN_MEASURABLE_DB = 6;

/**
 * …and this far off pitch it is a different note.
 *
 * Needed because the template score alone is not selective enough at
 * calibration time: measured on the repeated-pedal fixture, which contains a
 * C4 and nothing else, the C#4 template scored *higher* than the C4 (37.4 dB
 * against 37.2) by matching the skirts of C4's partials. Where the fundamental
 * actually sits settles it — C#4's is 15 Hz away from anything in that
 * recording, which is a whole semitone of detuning.
 */
export const MAX_DETUNE_CENTS = 35;

/** Whether a measurement is of the pitch it claims, and not of the room. */
export function isHeard(measurement: PitchMeasurement | null): measurement is PitchMeasurement {
  return (
    measurement !== null &&
    measurement.scoreDb >= MIN_MEASURABLE_DB &&
    Math.abs(measurement.detuneCents) <= MAX_DETUNE_CENTS
  );
}

/** Convenience for the screen: which pitch a measurement is, as a name. */
export function pitchName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[midi % 12] ?? '?'}${Math.floor(midi / 12) - 1}`;
}

/** Round-trips a frequency to the nearest pitch; used by the screen's readout. */
export function nearestMidi(hz: number): number {
  return Math.round(hzToMidi(hz));
}
