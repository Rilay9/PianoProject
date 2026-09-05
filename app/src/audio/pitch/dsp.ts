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
  /** Loudest bin of the current frame, in dB. */
  peakDb: number;
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
    peakDb: DB_FLOOR,
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
  let peak = DB_FLOOR;
  for (let i = 0; i < bins; i += 1) {
    const re = real[i] as number;
    const im = imag[i] as number;
    const power = re * re + im * im;
    // 10·log10(power) with a floor; +1e-12 keeps log10(0) finite.
    const db = Math.max(DB_FLOOR, 10 * Math.log10(power + 1e-12));
    ctx.magnitude[i] = db;
    if (db > peak) peak = db;
  }
  ctx.peakDb = peak;
}

/**
 * Bins quieter than this far below the frame's loudest bin contribute nothing
 * to the flux.
 *
 * Flux is summed in decibels, and a decibel is a *ratio*: a bin sitting near
 * silence jumping from −100 dB to −90 contributes exactly as much as a real
 * partial going from −20 to −10. Broadband noise makes thousands of quiet bins
 * do precisely that, and the sum drowns every real attack — measured, the
 * onset count went from 9 to 0 at 17 dB SNR while the harmonic scores barely
 * moved. Ignoring bins with no meaningful energy in them fixes it.
 */
const FLUX_DYNAMIC_RANGE_DB = 60;

/**
 * Spectral flux: the total *rise* in the spectrum since the last frame.
 *
 * Only rises count — a note ending is not an onset, and half-wave rectifying
 * is what stops a decaying chord from looking like a new event every frame.
 */
export function spectralFlux(ctx: SpectrumContext): number {
  if (!ctx.hasPrevious) return 0;
  let peak = DB_FLOOR;
  for (let i = 0; i < ctx.magnitude.length; i += 1) {
    const value = ctx.magnitude[i] as number;
    if (value > peak) peak = value;
  }
  const floor = peak - FLUX_DYNAMIC_RANGE_DB;
  let flux = 0;
  for (let i = 0; i < ctx.magnitude.length; i += 1) {
    const current = ctx.magnitude[i] as number;
    if (current < floor) continue;
    const rise = current - (ctx.previous[i] as number);
    if (rise > 0) flux += rise;
  }
  return flux;
}

// --- onsets -----------------------------------------------------------------

export interface OnsetDetectorOptions {
  /** Frames kept for the running median. ~0.5 s at an 11 ms hop. */
  historySize?: number;
  /**
   * Flux must exceed the running median by this much, **per bin**. Expressed
   * per bin so it means the same thing whatever the FFT size — as a flat
   * addition to a 2048-bin sum it was numerically negligible.
   */
  thresholdDelta?: number;
  /** Minimum gap between onsets; a piano cannot repeat faster than this. */
  minIntervalMs?: number;
  /**
   * Absolute floor for the threshold, in mean dB rise per bin.
   *
   * The adaptive median alone adapts *downwards* during a quiet decay and then
   * fires on noise — which is where most of the detector's false positives
   * came from. Flux is a sum of dB differences, so it does not scale with
   * input gain and an absolute floor is meaningful: measured on rendered
   * piano, the gaps between notes peak at 1.8 dB/bin while an attack reaches
   * 21, so 2 separates them with room on both sides.
   */
  minFluxPerBin?: number;
  /** Bins in the spectrum, so the floor can be expressed per bin. */
  bins?: number;
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
  private readonly minFlux: number;

  constructor(options: OnsetDetectorOptions = {}) {
    const historySize = options.historySize ?? 43;
    this.history = new Float32Array(historySize);
    this.sorted = new Float32Array(historySize);
    this.thresholdDelta = (options.thresholdDelta ?? 1) * (options.bins ?? 1);
    this.minIntervalMs = options.minIntervalMs ?? 50;
    this.minFlux = (options.minFluxPerBin ?? 2) * (options.bins ?? 0);
  }

  reset(): void {
    this.historyCount = 0;
    this.writeIndex = 0;
    this.lastOnsetMs = Number.NEGATIVE_INFINITY;
    this.history.fill(0);
  }

  /** Feeds one frame's flux; returns whether it was an onset. */
  push(flux: number, tMs: number): OnsetResult {
    const threshold = Math.max(this.median() + this.thresholdDelta, this.minFlux);
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

/**
 * A pitch whose loudest partial is more than this far below the frame's
 * loudest bin is not audibly being played.
 *
 * Without it, a pitch at the very bottom of the keyboard scores well on
 * nothing at all: there is almost no energy down at 35 Hz, so the local
 * background is near the noise floor and any window leakage from the real
 * music reads as a large margin above it. C#1 and D1 were being reported
 * throughout a recording that contained neither.
 */
const PRESENCE_RANGE_DB = 55;

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
  let loudestPartial = DB_FLOOR;
  for (let h = 1; h <= HARMONIC_WEIGHTS.length; h += 1) {
    const hz = partialHz(f0, h, inharmonicity);
    if (hz >= nyquist) break;
    const weight = HARMONIC_WEIGHTS[h - 1] as number;
    const peak = peakNear(ctx, hz, PARTIAL_SEARCH_SEMITONES);
    if (peak > loudestPartial) loudestPartial = peak;
    score += weight * (peak - background);
    weightUsed += weight;
  }
  if (weightUsed === 0) return 0;
  // Audibility gate: a big margin over a near-silent background still means
  // silence.
  if (loudestPartial < ctx.peakDb - PRESENCE_RANGE_DB) return 0;
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
 * Intervals (in semitones) whose partials coincide within the first six.
 *
 * The doc names the octave and the fifth (docs/05 §11.2), but the same trap is
 * set by every small-integer frequency ratio: a ringing G3 puts its 4th partial
 * exactly on C4's 3rd, and a phantom C4 was being reported a second before the
 * real one arrived. Major third 5:4, fourth 4:3, fifth 3:2, sixth 5:3, octave
 * 2:1, and the compounds up to two octaves.
 */
const CONFUSABLE_INTERVALS = [4, 5, 7, 9, 12, 16, 19, 24];

/**
 * When a louder related candidate is sounding, a pitch is believed only as far
 * as its **own fundamental** supports — no other note can put energy exactly
 * there. Capping at the fundamental rather than merely requiring a few dB of
 * it is what finally killed the phantom C4 that a ringing G3 produced through
 * their coincident partials (G3's 4th sits on C4's 3rd).
 */
const FUNDAMENTAL_MIN_DB = 3;

/**
 * Energy at a pitch's own fundamental, in dB above the local background.
 *
 * The one measurement no other note can fake: partials land on pitches above
 * their fundamental, never below it, so a peak at f0 is evidence for *this*
 * pitch rather than for something an octave or a twelfth down.
 */
export function fundamentalStrength(
  ctx: SpectrumContext,
  midi: number,
  options: HarmonicScoreOptions,
): number {
  const f0 = midiToHz(midi);
  const inharmonicity = options.inharmonicity ?? defaultInharmonicityFor(midi);
  const background = backgroundNear(ctx, f0, inharmonicity, options.scratch);
  return peakNear(ctx, f0, PARTIAL_SEARCH_SEMITONES) - background;
}

/** The bar `fundamentalStrength` has to clear for a pitch to be believed. */
export const FUNDAMENTAL_PRESENT_DB = FUNDAMENTAL_MIN_DB;

/**
 * Knocks down candidates that a louder, harmonically related candidate could
 * be producing on its own.
 *
 * The rule: if some other expected pitch is both louder and harmonically
 * related, the quieter one is only believed when its **own fundamental** is
 * present — no other note can put energy exactly there. For the octave-below
 * case the stronger test from docs/05 §11.2 is used instead, since a lower
 * octave shares every even partial and its odd ones are the giveaway.
 *
 * Writes into `out`; `scores` is left untouched.
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
    const score = scores[i] as number;

    let louderRelated = -1;
    for (let j = 0; j < candidates.length; j += 1) {
      if (i === j) continue;
      if ((scores[j] as number) <= score) continue;
      const interval = Math.abs((candidates[j] as number) - midi);
      if (CONFUSABLE_INTERVALS.includes(interval)) {
        louderRelated = j;
        break;
      }
    }
    if (louderRelated < 0) continue;

    // An octave above is the classic case and has a sharper test: only the
    // lower note has energy at its own odd partials.
    if ((candidates[louderRelated] as number) === midi + 12) {
      const odd = oddHarmonicScore(ctx, midi, options);
      if (odd < score * 0.5) out[i] = odd;
      continue;
    }

    const f0 = midiToHz(midi);
    const inharmonicity = options.inharmonicity ?? defaultInharmonicityFor(midi);
    const background = backgroundNear(ctx, f0, inharmonicity, options.scratch);
    const fundamental = peakNear(ctx, f0, PARTIAL_SEARCH_SEMITONES) - background;
    out[i] = Math.min(out[i] as number, Math.max(fundamental, FUNDAMENTAL_MIN_DB - 1));
  }
}
