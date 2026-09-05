// Score-informed pitch detection, as pure functions.
//
// docs/05-score-follow-engine.md §11. The whole approach rests on §11.1: we
// never try to transcribe the piano. At any moment the engine knows the handful
// of pitches the score expects now and next, so the question per frame is only
// "are *these* pitches present?" — a few template matches against the spectrum
// instead of an open-ended search. That is what makes it run on a phone, and it
// is why ambiguity resolves towards the score rather than away from it.
//
// Everything here is allocation-free once the context objects exist: the
// worklet calls into these ~86 times a second and a garbage collection pause
// in the audio thread is an audible glitch.

import { createFft, fftInPlace, hannWindow, type FftContext } from './fft';

export const A4_MIDI = 69;
export const A4_HZ = 440;

/** Harmonic weights from docs/05 §11.2. */
export const HARMONIC_WEIGHTS = [1, 0.8, 0.6, 0.5, 0.4, 0.3] as const;

/**
 * Default inharmonicity coefficient. Real piano strings are stiff, so partial
 * *h* sits above *h·f0* — sharper in the bass, where the strings are shortest
 * relative to their mass.
 */
export const DEFAULT_INHARMONICITY = 0.0004;

export function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
}

export function hzToMidi(hz: number): number {
  return A4_MIDI + 12 * Math.log2(hz / A4_HZ);
}

/**
 * Frequency of partial `h` of a string at `f0`.
 *
 * docs/05 §11.2 writes this as `h·f0·(1 + β·h²)`. The physically correct
 * relation is `h·f0·√(1 + B·h²)`, and the difference is not academic: at
 * β = 0.0004 and h = 6 the doc's form predicts a partial 1.4 % sharp where a
 * real string is 0.7 % sharp — about a fifth of a semitone of error, enough to
 * walk the search window off a genuine partial in the treble. The square-root
 * form is used, and the search window below absorbs the remainder either way.
 * Recorded in docs/decisions/2026-09-05-p3b-mic.md.
 */
export function partialHz(f0: number, harmonic: number, inharmonicity: number): number {
  return harmonic * f0 * Math.sqrt(1 + inharmonicity * harmonic * harmonic);
}

/** Inharmonicity rises towards the bass; a rough fit good enough as a prior. */
export function defaultInharmonicityFor(midi: number): number {
  if (midi >= 60) return DEFAULT_INHARMONICITY;
  // Roughly doubles per octave below middle C.
  return DEFAULT_INHARMONICITY * Math.pow(2, (60 - midi) / 12);
}

// --- spectrum ---------------------------------------------------------------

export interface SpectrumContext {
  readonly fft: FftContext;
  readonly size: number;
  readonly sampleRate: number;
  readonly window: Float32Array;
  readonly real: Float32Array;
  readonly imag: Float32Array;
  /** Log-magnitude in decibels, length size/2. */
  readonly magnitude: Float32Array;
  /** The previous frame's magnitude, for spectral flux. */
  readonly previous: Float32Array;
  /** Hz per bin. */
  readonly binHz: number;
  hasPrevious: boolean;
}

export function createSpectrumContext(size: number, sampleRate: number): SpectrumContext {
  return {
    fft: createFft(size),
    size,
    sampleRate,
    window: hannWindow(size),
    real: new Float32Array(size),
    imag: new Float32Array(size),
    magnitude: new Float32Array(size / 2),
    previous: new Float32Array(size / 2),
    binHz: sampleRate / size,
    hasPrevious: false,
  };
}

/** Floor in dB, so silence is a finite number rather than −Infinity. */
export const DB_FLOOR = -120;

/**
 * Windows `samples` into the context and computes its log-magnitude spectrum.
 *
 * The previous frame's magnitude is preserved first, so `spectralFlux` can be
 * called straight afterwards.
 */
export function computeSpectrum(
  ctx: SpectrumContext,
  samples: Float32Array,
  offset = 0,
): void {
  ctx.previous.set(ctx.magnitude);
  const { size, real, imag, window } = ctx;
  for (let i = 0; i < size; i += 1) {
    const sample = samples[offset + i];
    real[i] = (sample ?? 0) * (window[i] as number);
    imag[i] = 0;
  }
  fftInPlace(ctx.fft, real, imag);
  const bins = size / 2;
  for (let i = 0; i < bins; i += 1) {
    const re = real[i] as number;
    const im = imag[i] as number;
    const power = re * re + im * im;
    // 10·log10(power) with a floor; +1e-12 keeps log10(0) finite.
    ctx.magnitude[i] = Math.max(DB_FLOOR, 10 * Math.log10(power + 1e-12));
  }
}

/**
 * Spectral flux: the total *rise* in the spectrum since the last frame.
 *
 * Only rises count — a note ending is not an onset, and half-wave rectifying
 * is what stops a decaying chord from looking like a new event every frame.
 */
export function spectralFlux(ctx: SpectrumContext): number {
  if (!ctx.hasPrevious) return 0;
  let flux = 0;
  for (let i = 0; i < ctx.magnitude.length; i += 1) {
    const rise = (ctx.magnitude[i] as number) - (ctx.previous[i] as number);
    if (rise > 0) flux += rise;
  }
  return flux;
}

// --- onsets -----------------------------------------------------------------

export interface OnsetDetectorOptions {
  /** Frames kept for the running median. ~0.5 s at an 11 ms hop. */
  historySize?: number;
  /** Flux must exceed median + this many dB-units to count. */
  thresholdDelta?: number;
  /** Minimum gap between onsets; a piano cannot repeat faster than this. */
  minIntervalMs?: number;
}

export interface OnsetResult {
  onset: boolean;
  /** How far above the adaptive threshold, 0 when there was no onset. */
  strength: number;
  flux: number;
  threshold: number;
}

/**
 * Adaptive-threshold onset detector.
 *
 * A fixed threshold cannot work across a quiet practice room and a loud one, so
 * the threshold tracks a running median of recent flux. The median rather than
 * the mean because one loud onset should not raise the bar for the next note.
 */
export class OnsetDetector {
  private readonly history: Float32Array;
  private readonly sorted: Float32Array;
  private historyCount = 0;
  private writeIndex = 0;
  private lastOnsetMs = Number.NEGATIVE_INFINITY;
  private readonly thresholdDelta: number;
  private readonly minIntervalMs: number;

  constructor(options: OnsetDetectorOptions = {}) {
    const historySize = options.historySize ?? 43;
    this.history = new Float32Array(historySize);
    this.sorted = new Float32Array(historySize);
    this.thresholdDelta = options.thresholdDelta ?? 12;
    this.minIntervalMs = options.minIntervalMs ?? 50;
  }

  reset(): void {
    this.historyCount = 0;
    this.writeIndex = 0;
    this.lastOnsetMs = Number.NEGATIVE_INFINITY;
    this.history.fill(0);
  }

  /** Feeds one frame's flux; returns whether it was an onset. */
  push(flux: number, tMs: number): OnsetResult {
    const threshold = this.median() + this.thresholdDelta;
    const isOnset =
      this.historyCount >= 4 &&
      flux > threshold &&
      tMs - this.lastOnsetMs >= this.minIntervalMs;
    if (isOnset) this.lastOnsetMs = tMs;

    this.history[this.writeIndex] = flux;
    this.writeIndex = (this.writeIndex + 1) % this.history.length;
    if (this.historyCount < this.history.length) this.historyCount += 1;

    return {
      onset: isOnset,
      strength: isOnset ? flux - threshold : 0,
      flux,
      threshold,
    };
  }

  /** Median of the retained flux history. Allocation-free. */
  private median(): number {
    if (this.historyCount === 0) return 0;
    const n = this.historyCount;
    this.sorted.set(this.history.subarray(0, n));
    // Insertion sort: n is ~43 and nearly sorted between frames, so this beats
    // anything cleverer and never allocates.
    for (let i = 1; i < n; i += 1) {
      const value = this.sorted[i] as number;
      let j = i - 1;
      while (j >= 0 && (this.sorted[j] as number) > value) {
        this.sorted[j + 1] = this.sorted[j] as number;
        j -= 1;
      }
      this.sorted[j + 1] = value;
    }
    const mid = n >> 1;
    return n % 2 === 1
      ? (this.sorted[mid] as number)
      : ((this.sorted[mid - 1] as number) + (this.sorted[mid] as number)) / 2;
  }
}

// --- harmonic templates -----------------------------------------------------

/** How far either side of a predicted partial to look, in semitones. */
const PARTIAL_SEARCH_SEMITONES = 0.5;
/** Half-width of the background band, in semitones. */
const BACKGROUND_SEMITONES = 2;

/**
 * …but never narrower than this many bins either side.
 *
 * Two semitones is a *ratio*, and a ratio is only a few bins wide down in the
 * bass: around C2 (65 Hz) a ±2-semitone band at a 4096-point window spans
 * bins 5–7. Measuring "background" from three bins sitting on the note's own
 * skirt reported the floor 50 dB too high and made C2 score below zero — the
 * note vanished. A minimum width in bins keeps the estimate on actual
 * background wherever the pitch is.
 */
const BACKGROUND_MIN_BINS = 10;

function binOf(ctx: SpectrumContext, hz: number): number {
  return Math.round(hz / ctx.binHz);
}

/** Peak magnitude within a small band around `hz`. */
function peakNear(ctx: SpectrumContext, hz: number, semitones: number): number {
  const low = binOf(ctx, hz * Math.pow(2, -semitones / 12));
  const high = binOf(ctx, hz * Math.pow(2, semitones / 12));
  const bins = ctx.magnitude.length;
  let peak = DB_FLOOR;
  for (let i = Math.max(0, low); i <= Math.min(bins - 1, high); i += 1) {
    const value = ctx.magnitude[i] as number;
    if (value > peak) peak = value;
  }
  return peak;
}

/**
 * Local background level around a pitch.
 *
 * The median of a band around `f0`, with every one of the pitch's own partials
 * masked out — docs/05 §11.2's "excluding harmonic bins". Masking only the
 * fundamental is not enough once the band is wide enough to be useful in the
 * bass, because then it swallows the second partial and the note raises its
 * own floor again.
 *
 * The median, not the mean: one strong neighbouring note inside the band should
 * not drag the estimate up.
 */
export function backgroundNear(
  ctx: SpectrumContext,
  f0: number,
  inharmonicity: number,
  scratch: Float32Array,
): number {
  const centre = binOf(ctx, f0);
  const bins = ctx.magnitude.length;
  const low = Math.max(
    0,
    Math.min(binOf(ctx, f0 * Math.pow(2, -BACKGROUND_SEMITONES / 12)), centre - BACKGROUND_MIN_BINS),
  );
  const high = Math.min(
    bins - 1,
    Math.max(binOf(ctx, f0 * Math.pow(2, BACKGROUND_SEMITONES / 12)), centre + BACKGROUND_MIN_BINS),
  );

  let count = 0;
  for (let i = low; i <= high && count < scratch.length; i += 1) {
    if (isNearAnyPartial(ctx, i, f0, inharmonicity)) continue;
    scratch[count] = ctx.magnitude[i] as number;
    count += 1;
  }
  if (count === 0) return DB_FLOOR;
  const view = scratch.subarray(0, count);
  view.sort();
  const mid = count >> 1;
  return count % 2 === 1
    ? (view[mid] as number)
    : ((view[mid - 1] as number) + (view[mid] as number)) / 2;
}

/**
 * Whether bin `bin` sits inside the search window of any partial of `f0`.
 *
 * Only the partials the scorer actually uses are masked; masking the whole
 * series would leave nothing to measure in the treble.
 */
function isNearAnyPartial(
  ctx: SpectrumContext,
  bin: number,
  f0: number,
  inharmonicity: number,
): boolean {
  const nyquist = ctx.sampleRate / 2;
  for (let h = 1; h <= HARMONIC_WEIGHTS.length; h += 1) {
    const hz = partialHz(f0, h, inharmonicity);
    if (hz >= nyquist) break;
    // At least one bin either side, so a partial cannot leak into the floor
    // just because the window is narrower than a bin up here.
    const low = Math.min(
      binOf(ctx, hz * Math.pow(2, -PARTIAL_SEARCH_SEMITONES / 12)),
      binOf(ctx, hz) - 1,
    );
    const high = Math.max(
      binOf(ctx, hz * Math.pow(2, PARTIAL_SEARCH_SEMITONES / 12)),
      binOf(ctx, hz) + 1,
    );
    if (bin >= low && bin <= high) return true;
  }
  return false;
}

export interface HarmonicScoreOptions {
  inharmonicity?: number;
  /** Scratch buffer for the background median; sized ≥ the band's bin count. */
  scratch: Float32Array;
  /** Per-pitch gain correction from calibration, in dB. */
  gainDb?: number;
}

/**
 * How strongly pitch `midi` is present, in dB above its local background.
 *
 * A weighted sum over the first six partials: the fundamental of a piano note
 * is often *weaker* than its second partial (especially in the bass, and on a
 * small speaker), so scoring on the fundamental alone would miss half the
 * keyboard.
 */
export function harmonicScore(
  ctx: SpectrumContext,
  midi: number,
  options: HarmonicScoreOptions,
): number {
  const f0 = midiToHz(midi);
  const inharmonicity = options.inharmonicity ?? defaultInharmonicityFor(midi);
  const background = backgroundNear(ctx, f0, inharmonicity, options.scratch);
  const nyquist = ctx.sampleRate / 2;

  let score = 0;
  let weightUsed = 0;
  for (let h = 1; h <= HARMONIC_WEIGHTS.length; h += 1) {
    const hz = partialHz(f0, h, inharmonicity);
    if (hz >= nyquist) break;
    const weight = HARMONIC_WEIGHTS[h - 1] as number;
    const peak = peakNear(ctx, hz, PARTIAL_SEARCH_SEMITONES);
    score += weight * (peak - background);
    weightUsed += weight;
  }
  if (weightUsed === 0) return 0;
  return score / weightUsed + (options.gainDb ?? 0);
}

/**
 * Energy at the *odd* partials only, relative to background.
 *
 * The octave guard from docs/05 §11.2: a pitch an octave below an expected one
 * shares all of its even partials, so a loud C5 makes C4 look present. Only C4
 * has energy at its own 1st, 3rd and 5th partials, so that is what has to be
 * checked before believing the lower pitch.
 */
export function oddHarmonicScore(
  ctx: SpectrumContext,
  midi: number,
  options: HarmonicScoreOptions,
): number {
  const f0 = midiToHz(midi);
  const inharmonicity = options.inharmonicity ?? defaultInharmonicityFor(midi);
  const background = backgroundNear(ctx, f0, inharmonicity, options.scratch);
  const nyquist = ctx.sampleRate / 2;

  let score = 0;
  let weightUsed = 0;
  for (const h of [1, 3, 5]) {
    const hz = partialHz(f0, h, inharmonicity);
    if (hz >= nyquist) break;
    const weight = HARMONIC_WEIGHTS[h - 1] as number;
    score += weight * (peakNear(ctx, hz, PARTIAL_SEARCH_SEMITONES) - background);
    weightUsed += weight;
  }
  return weightUsed === 0 ? 0 : score / weightUsed;
}

/**
 * Applies the octave and fifth guards to a set of candidate scores.
 *
 * Returns a copy of `scores` with confusable candidates knocked down. Two
 * coincidences matter for piano: an octave below (shares every even partial)
 * and a fifth above (its 2nd partial sits on the lower note's 3rd).
 */
export function applyConfusionGuards(
  ctx: SpectrumContext,
  candidates: readonly number[],
  scores: Float32Array,
  options: HarmonicScoreOptions,
  out: Float32Array,
): void {
  out.set(scores.subarray(0, candidates.length));
  for (let i = 0; i < candidates.length; i += 1) {
    const midi = candidates[i] as number;
    const octaveAbove = candidates.indexOf(midi + 12);
    const fifthBelow = candidates.indexOf(midi - 7);

    if (octaveAbove >= 0 && (scores[octaveAbove] as number) > (scores[i] as number)) {
      // The upper octave is the louder hypothesis; believe the lower one only
      // if its odd partials are genuinely there.
      const odd = oddHarmonicScore(ctx, midi, options);
      if (odd < (scores[i] as number) * 0.5) out[i] = odd;
    }
    if (fifthBelow >= 0 && (scores[fifthBelow] as number) > (scores[i] as number)) {
      // This pitch's 2nd partial coincides with the lower note's 3rd; require
      // its own fundamental to be present.
      const f0 = midiToHz(midi);
      const inharmonicity = options.inharmonicity ?? defaultInharmonicityFor(midi);
      const background = backgroundNear(ctx, f0, inharmonicity, options.scratch);
      const fundamental = peakNear(ctx, f0, PARTIAL_SEARCH_SEMITONES) - background;
      if (fundamental < 3) out[i] = Math.min(out[i] as number, fundamental);
    }
  }
}
