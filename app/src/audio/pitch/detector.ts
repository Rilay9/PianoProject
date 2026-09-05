// The frame-by-frame detector: spectrum in, note events out.
//
// docs/05-score-follow-engine.md §11.3. This is the part that runs inside the
// AudioWorklet, written as a plain class over `Float32Array` so the same code
// can be measured in Vitest against rendered piano audio — the worklet is only
// a thin shell around it (§11.6 asks for exactly this split).
//
// The score-informed prior lives here: `setExpectations` tells the detector
// which handful of pitches the engine wants now and next, and those get the
// full six-partial test every hop. Everything else is scanned coarsely, every
// fourth hop, purely so an obviously wrong note can be reported in amber.

import {
  applyConfusionGuards,
  applyNotch,
  fundamentalStrength,
  computeSpectrum,
  createSpectrumContext,
  defaultInharmonicityFor,
  harmonicScore,
  OnsetDetector,
  spectralFlux,
  type SpectrumContext,
} from './dsp';

/** Hop size in samples: ~11.6 ms at 44.1 kHz (docs/05 §11.2). */
export const HOP_SIZE = 512;
/** Main analysis window. */
export const WINDOW_SIZE = 4096;
/** Larger window for the bass, where 4096 cannot separate semitones. */
export const LOW_WINDOW_SIZE = 8192;
/** Pitches below this use the larger window (docs/05 §11.2: C2–B2 and below). */
export const LOW_WINDOW_MAX_MIDI = 48;

/** Lowest and highest keys on an 88-key piano. */
export const LOWEST_MIDI = 21;
export const HIGHEST_MIDI = 108;

/**
 * The coarse "what else might be sounding?" scan does not go below this.
 *
 * A physical limit, not a tuning choice: at C1 (32.7 Hz) a semitone is under
 * 2 Hz wide, while an 8192-point window at 44.1 kHz resolves 5.4 Hz. Adjacent
 * bass semitones are therefore *unresolvable* — the search window for one
 * pitch's partial sits inside its neighbour's — and the scan happily reported
 * a C#1 and D1 throughout a recording containing neither. Resolving them would
 * need a half-second window, which is not real-time.
 *
 * Expected pitches are still tested across the full keyboard: there the score
 * says which note it is, so confusing neighbours cannot arise.
 */
export const UNEXPECTED_SCAN_LOWEST_MIDI = 36;

/**
 * How many of the scan's strongest candidates go through the confusion guards.
 *
 * The guards are O(n²) in the candidate count, so the whole keyboard is out of
 * the question on every onset. Eight is comfortably more than the number of
 * templates a single strike lights up (fundamental, octave, twelfth, double
 * octave and a couple of near neighbours).
 */
const SCAN_SHORTLIST = 8;

/**
 * Semitone gaps from a fundamental to its 2nd and 3rd partials.
 *
 * These are the pitches a single struck note impersonates: C4's partials *are*
 * a C5 and a G5, so both templates match a lone C4. The 4th partial (two
 * octaves, 24) is deliberately absent — it is reachable as two 12s, and making
 * the descent take it in two validated steps is stricter than allowing the
 * leap. Allowing 24 directly is what let an E4 be reported as the E2 two
 * octaves below it, since the intermediate E3 would have failed the test.
 */
const SUB_PARTIAL_INTERVALS = [12, 19] as const;

/**
 * Half-width of the metronome notch, in semitones.
 *
 * Wide enough to cover the click's band-pass skirt and any Doppler-free room
 * colouration of it, narrow enough that at 5 kHz it removes about 90 Hz of a
 * spectrum that runs to 24 kHz.
 */
const NOTCH_SEMITONES = 0.6;

/** Enough steps to walk a 4th or 5th partial back to its fundamental. */
const SCAN_DESCENT_STEPS = 3;

/**
 * How much energy the lower pitch must have at its own fundamental, in dB over
 * the local background, before the descent will prefer it.
 *
 * Higher than the 3 dB the confusion guards use, because this test is what
 * stops the descent running away: measured on a struck C4, its own fundamental
 * stands 27–39 dB over background, while the C2 two octaves below it — reached
 * by descending twice — musters 8 dB of spectral leakage. Twelve separates them
 * with room on both sides.
 */
const SCAN_DESCENT_FUNDAMENTAL_DB = 12;

/**
 * …and how far below the *current* candidate's own fundamental it may sit.
 *
 * The absolute bar alone is not enough, because a bass template does pick up
 * real leakage from the note above it. This second test is register-fair —
 * both numbers are a peak measured against the background local to that pitch
 * — and it is what separates the two cases on the fixtures. Measured: genuine
 * descents (G5 → C4 on a struck C4, D6 → D5 in the fast scale) run from 9 dB
 * below the fundamental they replace to 4 dB above it, while runaways into the
 * bass (C4 → C2) are 11–20 dB down.
 */
const SCAN_DESCENT_RELATIVE_DB = 10;

export interface DetectorThresholds {
  /** dB above background at which an expected pitch counts as present. */
  onDb: number;
  /** …and below which it counts as gone. */
  offDb: number;
  /** Frames below `offDb` before a note-off is emitted. */
  offFrames: number;
  /**
   * An onset this recent (ms) is required before a note-on.
   *
   * docs/05 §11.3 says 60 ms. That assumes the onset and the spectral evidence
   * arrive together, but they cannot: onsets are timestamped at the analysis
   * window's centre, and the harmonic score only crosses its threshold once
   * the note has filled the window — tens of milliseconds later, more for a
   * bass note with a slow attack. At 60 ms recall was 56 %; at 150 ms it is
   * 100 %, and widening further changes nothing, so the gap really is the
   * window's own latency rather than a loose gate.
   */
  onsetWindowMs: number;
  /**
   * A re-strike under the pedal needs the score to rise this far above its
   * recent floor. Measured against a short running minimum rather than the
   * previous frame: a decaying note wobbles by a few dB frame to frame, so a
   * frame-to-frame test reported one strike as five.
   */
  restrikeRiseDb: number;
  /** …and at least this long since the note last started. */
  minRestrikeGapMs: number;
  /**
   * …and the note must first have decayed this far below its own peak. A
   * piano attack keeps rising for a couple of hundred milliseconds, so
   * without requiring a fall first the attack itself reads as a re-strike.
   */
  restrikeDropDb: number;
  /** An unexpected pitch must beat the on-threshold by this much again. */
  unexpectedExtraDb: number;
  /** …and unexpected reports are rate-limited to one per this many ms. */
  unexpectedMinIntervalMs: number;
  /** Flux must beat the running median by this many mean dB per bin… */
  onsetThresholdDelta: number;
  /** …and this many mean dB per bin in absolute terms. */
  minFluxPerBin: number;
  /**
   * How much the on-threshold is relaxed for a pitch the score expects *now*.
   *
   * This is the score-informed prior of docs/05 §11.1 and the owner's
   * requirement in docs/00 D15 — ambiguity resolves towards the score. A note
   * the engine is waiting for, arriving right after an onset, needs less
   * evidence than a pitch nobody asked about.
   */
  expectedRelaxDb: number;
}

export const DEFAULT_THRESHOLDS: DetectorThresholds = {
  // ≈ 6 dB above background, as docs/05 §11.3 suggests, but measured against
  // the weighted multi-partial score rather than a single bin.
  onDb: 8,
  offDb: 4,
  offFrames: 4,
  onsetWindowMs: 150,
  restrikeRiseDb: 6,
  // A pianist cannot re-strike the same key faster than this, and without the
  // gap the rising edge of a single attack reports a note on every frame:
  // one strike became five, which is where the false positives came from.
  minRestrikeGapMs: 110,
  // Measured on the rendered fixture: re-striking a ringing C4 drops the
  // harmonic score from ~35 dB to ~10 for two or three frames before it climbs
  // back. A held note's own decay only wobbles within about 6 dB, so a 10 dB
  // fall is a signature of the hammer, not of the decay.
  restrikeDropDb: 10,
  // Guessing at a pitch nobody expected is the least reliable thing this
  // detector does, so the bar is deliberately high and the rate low: a stream
  // of spurious amber notes would train the learner to ignore the colour.
  unexpectedExtraDb: 10,
  unexpectedMinIntervalMs: 250,
  onsetThresholdDelta: 0.25,
  // Measured across the rendered fixtures, with the flux dynamic-range gate
  // in place: in clean audio the loudest moment *between* notes reaches
  // 0.50 mean dB per bin while the weakest genuine attack — a note starting
  // 125 ms after the last one, in a fast scale — reaches 1.27. This sits
  // between them. It only bites in a quiet room; anywhere noisier the adaptive
  // median is the higher of the two and takes over, and calibration
  // (docs/05 §11.5) can move it per device.
  minFluxPerBin: 0.8,
  expectedRelaxDb: 4,
};

export interface DetectorOptions {
  sampleRate: number;
  thresholds?: Partial<DetectorThresholds>;
  /** Per-pitch gain corrections in dB, from calibration. */
  gainDb?: Map<number, number>;
  /** Per-pitch inharmonicity, from calibration. */
  inharmonicity?: Map<number, number>;
  /**
   * Frequency of the metronome click to notch out, or 0 for none
   * (docs/05 §11.4). Set while the microphone is the input.
   */
  notchHz?: number;
}

export interface DetectedNote {
  kind: 'noteOn' | 'noteOff';
  midi: number;
  /** Milliseconds from the start of the stream. */
  tMs: number;
  /** 0..1. Expected pitches can reach 1; unexpected ones are capped at 0.5. */
  confidence: number;
  /** True when this pitch was not in the expected set (docs/05 §11.3). */
  unexpected: boolean;
}

/** Frames of score history kept per pitch, for the re-strike floor. */
const RECENT_SCORES = 6;

interface PitchState {
  present: boolean;
  presentSince: number;
  belowFrames: number;
  lastScore: number;
  /** Ring of the last few scores; its minimum is the re-strike reference. */
  recent: Float32Array;
  recentIndex: number;
  recentCount: number;
  /** Highest score since this note started. */
  peakSinceOn: number;
  /** True once the note has decayed enough that a re-strike is believable. */
  armedForRestrike: boolean;
}

/**
 * Turns a stream of audio hops into note events, given what the score expects.
 *
 * Deliberately conservative about *unexpected* notes: they are reported at
 * half confidence at most, because the whole design assumes we cannot
 * transcribe reliably and the owner asked for ambiguity to resolve towards the
 * score (docs/00 D15). The engine paints those amber, never red.
 */
export class PitchDetector {
  readonly sampleRate: number;
  private readonly thresholds: DetectorThresholds;
  private readonly main: SpectrumContext;
  private readonly low: SpectrumContext;
  private readonly onsets: OnsetDetector;
  private readonly scratch = new Float32Array(2048);
  private readonly gainDb: Map<number, number>;
  private readonly inharmonicity: Map<number, number>;

  private expectedNow: number[] = [];
  private expectedNext: number[] = [];
  private readonly states = new Map<number, PitchState>();
  private readonly scoreBuffer = new Float32Array(32);
  private readonly guardedBuffer = new Float32Array(32);

  private notchHz = 0;

  private lastOnsetMs = Number.NEGATIVE_INFINITY;
  private lastOnsetStrength = 0;
  private lastUnexpectedMs = Number.NEGATIVE_INFINITY;
  /** Time of an onset whose unexpected scan is still waiting for the window. */
  private pendingScanMs: number | null = null;
  /** Half a window, in ms: how long a new note takes to fill the analysis. */
  private readonly scanDelayMs: number;

  constructor(options: DetectorOptions) {
    this.sampleRate = options.sampleRate;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
    this.main = createSpectrumContext(WINDOW_SIZE, options.sampleRate);
    this.low = createSpectrumContext(LOW_WINDOW_SIZE, options.sampleRate);
    this.onsets = new OnsetDetector({
      thresholdDelta: this.thresholds.onsetThresholdDelta,
      bins: WINDOW_SIZE / 2,
      minFluxPerBin: this.thresholds.minFluxPerBin,
    });
    this.scanDelayMs = ((WINDOW_SIZE / 2) / options.sampleRate) * 1000;
    this.notchHz = options.notchHz ?? 0;
    this.gainDb = options.gainDb ?? new Map<number, number>();
    this.inharmonicity = options.inharmonicity ?? new Map<number, number>();
  }

  /**
   * Tells the detector which pitches the score expects. The engine publishes
   * this on every step change; everything else is background.
   */
  setExpectations(now: readonly number[], next: readonly number[] = []): void {
    this.expectedNow = [...now];
    this.expectedNext = [...next];
    for (const midi of [...now, ...next]) {
      if (!this.states.has(midi)) this.states.set(midi, freshState());
    }
  }

  /**
   * Applies what the calibration routine measured (docs/05 §11.5): per-pitch
   * gain and inharmonicity corrections, and any threshold overrides (the
   * line-input preset lowers them, since a cable has no room noise in it).
   *
   * Mutates the existing maps rather than replacing them, so the worklet can
   * be recalibrated mid-session without reallocating.
   */
  calibrate(calibration: {
    gainDb?: ReadonlyMap<number, number>;
    inharmonicity?: ReadonlyMap<number, number>;
    thresholds?: Partial<DetectorThresholds>;
    notchHz?: number;
  }): void {
    if (calibration.gainDb) {
      this.gainDb.clear();
      for (const [midi, db] of calibration.gainDb) this.gainDb.set(midi, db);
    }
    if (calibration.inharmonicity) {
      this.inharmonicity.clear();
      for (const [midi, beta] of calibration.inharmonicity) this.inharmonicity.set(midi, beta);
    }
    if (calibration.thresholds) Object.assign(this.thresholds, calibration.thresholds);
    if (calibration.notchHz !== undefined) this.notchHz = calibration.notchHz;
  }

  get expectations(): { now: number[]; next: number[] } {
    return { now: [...this.expectedNow], next: [...this.expectedNext] };
  }

  reset(): void {
    this.states.clear();
    this.onsets.reset();
    this.lastOnsetMs = Number.NEGATIVE_INFINITY;
    this.lastUnexpectedMs = Number.NEGATIVE_INFINITY;
    this.pendingScanMs = null;
    this.main.hasPrevious = false;
    this.low.hasPrevious = false;
  }

  /** The most recent frame's onset strength, for the level meter. */
  get onsetStrength(): number {
    return this.lastOnsetStrength;
  }

  /**
   * Processes one hop.
   *
   * `frame` must hold at least `LOW_WINDOW_SIZE` samples ending at the current
   * position — the caller's ring buffer provides the history. `frameEndMs` is
   * the time of the newest sample in it.
   *
   * Pass `out` to reuse an array across hops: the worklet runs this ~86 times
   * a second and a garbage collection on the audio thread is an audible click.
   * It is cleared on entry and returned.
   *
   * Events are timestamped at the **centre** of the analysis window, not its
   * trailing edge. A Hann window weights its edges to nothing, so a note is
   * only fully visible once it reaches the middle: reporting at the edge put
   * every onset a consistent ~46 ms late, which is most of the 30 ms budget
   * in docs/05 §11.6 spent on an avoidable bookkeeping error.
   */
  process(frame: Float32Array, frameEndMs: number, out: DetectedNote[] = []): DetectedNote[] {
    const events = out;
    events.length = 0;
    const tMs = frameEndMs - ((WINDOW_SIZE / 2) / this.sampleRate) * 1000;

    // The main window is the most recent WINDOW_SIZE samples of the frame.
    const mainOffset = Math.max(0, frame.length - WINDOW_SIZE);
    computeSpectrum(this.main, frame, mainOffset);
    if (this.notchHz > 0) applyNotch(this.main, this.notchHz, NOTCH_SEMITONES);
    const flux = spectralFlux(this.main);
    this.main.hasPrevious = true;
    const onset = this.onsets.push(flux, tMs);
    if (onset.onset) {
      this.lastOnsetMs = tMs;
      this.lastOnsetStrength = onset.strength;
    }

    const needsLowWindow = [...this.expectedNow, ...this.expectedNext].some(
      (midi) => midi <= LOW_WINDOW_MAX_MIDI,
    );
    if (needsLowWindow && frame.length >= LOW_WINDOW_SIZE) {
      computeSpectrum(this.low, frame, frame.length - LOW_WINDOW_SIZE);
      if (this.notchHz > 0) applyNotch(this.low, this.notchHz, NOTCH_SEMITONES);
      this.low.hasPrevious = true;
    }

    const candidates = this.expectedNow.concat(
      this.expectedNext.filter((m) => !this.expectedNow.includes(m)),
    );
    if (candidates.length > 0) {
      this.scoreCandidates(candidates, needsLowWindow);
      this.emitForCandidates(candidates, tMs, events);
    }

    // The unexpected scan runs on onsets only — rare enough that the doc's
    // "every fourth hop" cost control (docs/05 §11.3) is already satisfied, and
    // gating on both meant the two conditions almost never coincided, so
    // nothing was ever reported.
    //
    // It runs half a window *after* the onset rather than on it. On the onset
    // frame the new note occupies only the tail of the window, so its harmonic
    // score is still climbing and nothing cleared the scan's bar: measured on
    // the single-notes fixture, every one of the nine onsets produced an empty
    // shortlist. Half a window later the note fills the window and scores at
    // full strength. The event is still stamped with the onset's own time.
    if (onset.onset) this.pendingScanMs = tMs;
    if (
      this.pendingScanMs !== null &&
      tMs - this.pendingScanMs >= this.scanDelayMs
    ) {
      const onsetMs = this.pendingScanMs;
      this.pendingScanMs = null;
      this.scanUnexpected(onsetMs, events);
    }

    return events;
  }

  private contextFor(midi: number, lowAvailable: boolean): SpectrumContext {
    return midi <= LOW_WINDOW_MAX_MIDI && lowAvailable ? this.low : this.main;
  }

  private scoreOne(midi: number, lowAvailable: boolean): number {
    const ctx = this.contextFor(midi, lowAvailable);
    const options = {
      scratch: this.scratch,
      inharmonicity: this.inharmonicity.get(midi) ?? defaultInharmonicityFor(midi),
      gainDb: this.gainDb.get(midi) ?? 0,
    };
    return harmonicScore(ctx, midi, options);
  }

  private scoreCandidates(candidates: readonly number[], lowAvailable: boolean): void {
    const n = Math.min(candidates.length, this.scoreBuffer.length);
    for (let i = 0; i < n; i += 1) {
      this.scoreBuffer[i] = this.scoreOne(candidates[i] as number, lowAvailable);
    }
    // Guards run against the main window: comparing two candidates scored in
    // different windows would not be like for like.
    applyConfusionGuards(
      this.main,
      candidates.slice(0, n),
      this.scoreBuffer,
      { scratch: this.scratch },
      this.guardedBuffer,
    );
    // …except for pitches the low window genuinely serves better, where the
    // guard would otherwise undo the resolution the big window bought.
    for (let i = 0; i < n; i += 1) {
      const midi = candidates[i] as number;
      if (midi <= LOW_WINDOW_MAX_MIDI && lowAvailable) {
        this.guardedBuffer[i] = Math.max(
          this.guardedBuffer[i] as number,
          (this.scoreBuffer[i] as number) * 0.75,
        );
      }
    }
  }

  private emitForCandidates(
    candidates: readonly number[],
    tMs: number,
    events: DetectedNote[],
  ): void {
    const onsetRecent = tMs - this.lastOnsetMs <= this.thresholds.onsetWindowMs;
    const n = Math.min(candidates.length, this.guardedBuffer.length);

    for (let i = 0; i < n; i += 1) {
      const midi = candidates[i] as number;
      const score = this.guardedBuffer[i] as number;
      // Favour the score: a pitch the engine is waiting for right now needs
      // less evidence than one merely queued up next.
      const onThreshold =
        this.thresholds.onDb -
        (this.expectedNow.includes(midi) ? this.thresholds.expectedRelaxDb : 0);
      let state = this.states.get(midi);
      if (!state) {
        state = freshState();
        this.states.set(midi, state);
      }

      if (!state.present) {
        // A note starts only on an onset: without that, a slow swell in a
        // neighbouring note's partials would look like a new note.
        if (onsetRecent && score >= onThreshold) {
          state.present = true;
          state.presentSince = tMs;
          state.belowFrames = 0;
          state.peakSinceOn = score;
          state.armedForRestrike = false;
          events.push({
            kind: 'noteOn',
            midi,
            tMs,
            confidence: this.confidenceFor(score),
            unexpected: false,
          });
        }
      } else {
        if (score > state.peakSinceOn) state.peakSinceOn = score;
        // Arm only once the note has actually decayed: a re-strike is a fall
        // followed by a rise, and testing for the rise alone catches the
        // note's own attack, which keeps climbing for a couple of hundred ms.
        if (score <= state.peakSinceOn - this.thresholds.restrikeDropDb) {
          state.armedForRestrike = true;
        }
        // Hysteresis: arm on the fall, fire on the way back up. Waiting for a
        // full recovery instead put the re-strike ~150 ms late, which is most
        // of the onset budget spent on nothing.
        if (
          state.armedForRestrike &&
          onsetRecent &&
          score >= onThreshold &&
          score - recentFloor(state) >= this.thresholds.restrikeRiseDb &&
          tMs - state.presentSince >= this.thresholds.minRestrikeGapMs
        ) {
          events.push({
            kind: 'noteOn',
            midi,
            tMs,
            confidence: this.confidenceFor(score),
            unexpected: false,
          });
          state.presentSince = tMs;
          state.peakSinceOn = score;
          state.armedForRestrike = false;
        }
        if (score < this.thresholds.offDb) {
          state.belowFrames += 1;
          if (state.belowFrames >= this.thresholds.offFrames) {
            state.present = false;
            state.belowFrames = 0;
            events.push({ kind: 'noteOff', midi, tMs, confidence: 1, unexpected: false });
          }
        } else {
          state.belowFrames = 0;
        }
      }
      state.lastScore = score;
      pushScore(state, score);
    }
  }

  /**
   * Looks for a salient pitch that the score did not expect.
   *
   * Coarse on purpose: only on a strong onset, and only when nothing expected
   * rose. Reported at ≤ 0.5 confidence so the engine can show amber rather than
   * mark it wrong (docs/05 §11.1).
   */
  private scanUnexpected(tMs: number, events: DetectedNote[]): void {
    const anyExpectedRising = this.expectedNow.some((midi) => {
      const state = this.states.get(midi);
      return state?.present === true && tMs - state.presentSince <= this.thresholds.onsetWindowMs;
    });
    if (anyExpectedRising) return;

    if (tMs - this.lastUnexpectedMs < this.thresholds.unexpectedMinIntervalMs) return;

    const floor = this.thresholds.onDb + this.thresholds.unexpectedExtraDb;

    // Pass 1: raw scores, shortlisting whatever clears the bar. Scoring alone
    // is not enough to choose between them — see pass 2.
    const shortlist: number[] = [];
    const raw: number[] = [];
    for (let midi = UNEXPECTED_SCAN_LOWEST_MIDI; midi <= HIGHEST_MIDI; midi += 1) {
      if (this.expectedNow.includes(midi) || this.expectedNext.includes(midi)) continue;
      const score = this.scoreOne(midi, false);
      if (score > floor) {
        shortlist.push(midi);
        raw.push(score);
      }
    }
    if (shortlist.length === 0) return;

    // Keep the strongest few, so the guard pass below stays O(1) in the size
    // of the keyboard rather than O(n²) in it.
    const order = shortlist
      .map((midi, i) => ({ midi, score: raw[i] as number }))
      .sort((a, b) => b.score - a.score)
      .slice(0, SCAN_SHORTLIST)
      .sort((a, b) => a.midi - b.midi);

    const candidates = order.map((c) => c.midi);
    for (let i = 0; i < candidates.length; i += 1) this.scoreBuffer[i] = order[i]?.score ?? 0;
    applyConfusionGuards(
      this.main,
      candidates,
      this.scoreBuffer,
      { scratch: this.scratch },
      this.guardedBuffer,
    );

    let bestMidi = -1;
    let bestScore = floor;
    for (let i = 0; i < candidates.length; i += 1) {
      const score = this.guardedBuffer[i] as number;
      if (score > bestScore) {
        bestScore = score;
        bestMidi = candidates[i] as number;
      }
    }
    if (bestMidi < 0) return;

    // Pass 3: descend to the fundamental. A struck C4 lights up the C5, G5 and
    // C6 templates through its own partials, and those templates have narrower
    // background bands, so one of them routinely scores *higher* than the note
    // actually played — this scan reported a C5 for every strike of a C4.
    // applyConfusionGuards cannot help: it only demotes the quieter member of a
    // related pair, and here the phantom is the louder one.
    //
    // So having picked a winner, walk down its partial intervals for as long as
    // a lower pitch has real energy at its *own* fundamental — the one place
    // no note above it can put any. A C5 alone and a C4 whose 2nd partial is a
    // C5 differ in exactly that, and where they cannot be separated the tie
    // goes to the lower pitch on consequence: guessing C4 when both sounded
    // misses a note, while guessing C5 when only C4 sounded names a pitch
    // nobody touched.
    for (let step = 0; step < SCAN_DESCENT_STEPS; step += 1) {
      const currentFund = fundamentalStrength(this.main, bestMidi, {
        scratch: this.scratch,
        inharmonicity: this.inharmonicity.get(bestMidi) ?? defaultInharmonicityFor(bestMidi),
      });
      let moved = false;
      // Widest interval first, so a twelfth is taken as one move.
      for (let d = SUB_PARTIAL_INTERVALS.length - 1; d >= 0; d -= 1) {
        const lower = bestMidi - (SUB_PARTIAL_INTERVALS[d] as number);
        if (lower < UNEXPECTED_SCAN_LOWEST_MIDI) continue;
        if (this.expectedNow.includes(lower) || this.expectedNext.includes(lower)) continue;
        const opts = {
          scratch: this.scratch,
          inharmonicity: this.inharmonicity.get(lower) ?? defaultInharmonicityFor(lower),
        };
        const fundamental = fundamentalStrength(this.main, lower, opts);
        if (
          fundamental >= SCAN_DESCENT_FUNDAMENTAL_DB &&
          fundamental >= currentFund - SCAN_DESCENT_RELATIVE_DB
        ) {
          bestMidi = lower;
          bestScore = this.scoreOne(lower, false);
          moved = true;
          break;
        }
      }
      if (!moved) break;
    }
    this.lastUnexpectedMs = tMs;
    events.push({
      kind: 'noteOn',
      midi: bestMidi,
      tMs,
      // Hard cap: we are guessing, and the app must never colour a guess red.
      confidence: Math.min(0.5, this.confidenceFor(bestScore)),
      unexpected: true,
    });
  }

  /** Margin above the on-threshold, scaled by how strong the onset was. */
  private confidenceFor(score: number): number {
    const margin = (score - this.thresholds.onDb) / 12;
    const onsetFactor = Math.min(1, 0.5 + this.lastOnsetStrength / 40);
    return Math.max(0, Math.min(1, margin * onsetFactor + 0.5));
  }
}

function freshState(): PitchState {
  return {
    present: false,
    presentSince: 0,
    belowFrames: 0,
    lastScore: -Infinity,
    recent: new Float32Array(RECENT_SCORES),
    recentIndex: 0,
    recentCount: 0,
    peakSinceOn: -Infinity,
    armedForRestrike: false,
  };
}

/** Lowest score in the retained history; the floor a re-strike must clear. */
function recentFloor(state: PitchState): number {
  if (state.recentCount === 0) return -Infinity;
  let min = Infinity;
  for (let i = 0; i < state.recentCount; i += 1) {
    const value = state.recent[i] as number;
    if (value < min) min = value;
  }
  return min;
}

function pushScore(state: PitchState, score: number): void {
  state.recent[state.recentIndex] = score;
  state.recentIndex = (state.recentIndex + 1) % state.recent.length;
  if (state.recentCount < state.recent.length) state.recentCount += 1;
}
