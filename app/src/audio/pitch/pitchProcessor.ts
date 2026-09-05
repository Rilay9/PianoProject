// The AudioWorkletProcessor shell around `PitchDetector`.
//
// docs/05-score-follow-engine.md §11.2. The doc puts the FFT in the worklet and
// the decision logic in `MicSource` on the main thread; this runs *both* in the
// worklet and posts finished note events instead. The reason is bandwidth: the
// decision logic needs the magnitude spectrum, and shipping 2048 floats every
// 11 ms across the port is 700 kB/s of copying and garbage on the main thread —
// where the score is being rendered. The split the doc is really after (pure,
// testable DSP separate from the audio plumbing) is kept: everything here is a
// thin shell over `detector.ts`, which the Vitest suite measures directly.
//
// Nothing in the hop path allocates. The event array is reused, the ring buffer
// and the linear frame are allocated once, and messages are posted only when
// there is something to report.

import { HOP_SIZE, LOW_WINDOW_SIZE, PitchDetector, type DetectedNote } from './detector';
import type { FromPitchWorklet, ToPitchWorklet } from './messages';

/** Level/CPU reports per second. Often enough for a meter, rare enough to ignore. */
const LEVEL_INTERVAL_HOPS = 8;

/** Frames of RMS history the noise floor is taken from (~10 s). */
const NOISE_HISTORY = 860;

/** Percentile of that history used as the noise floor: quiet, but not the minimum. */
const NOISE_PERCENTILE = 0.1;

/** Silence floor so log10(0) is finite. */
const RMS_FLOOR_DB = -120;

class PitchProcessor extends AudioWorkletProcessor {
  private readonly detector: PitchDetector;
  /** Circular history, a power of two so the wrap is a mask. */
  private readonly ring = new Float32Array(LOW_WINDOW_SIZE);
  private ringWrite = 0;
  /** The most recent LOW_WINDOW_SIZE samples, unwrapped, for the detector. */
  private readonly frame = new Float32Array(LOW_WINDOW_SIZE);
  /** Samples accumulated since the last hop (render quanta are 128). */
  private sinceHop = 0;
  /** Reused so a quiet hop allocates nothing. */
  private readonly events: DetectedNote[] = [];

  private hopCount = 0;
  private peak = 0;
  private sumSquares = 0;
  private sumCount = 0;
  private readonly noiseHistory = new Float32Array(NOISE_HISTORY);
  private noiseCount = 0;
  private noiseIndex = 0;
  private readonly noiseSorted = new Float32Array(NOISE_HISTORY);

  private recording = false;

  constructor() {
    super();
    this.detector = new PitchDetector({ sampleRate });
    this.port.onmessage = (event: MessageEvent<ToPitchWorklet>) => {
      this.handle(event.data);
    };
  }

  private handle(message: ToPitchWorklet): void {
    switch (message.type) {
      case 'expectations':
        this.detector.setExpectations(message.now, message.next);
        break;
      case 'calibration':
        this.detector.calibrate({
          gainDb: new Map(message.gainDb),
          inharmonicity: new Map(message.inharmonicity),
          thresholds: message.thresholds,
        });
        break;
      case 'reset':
        this.detector.reset();
        break;
      case 'record':
        this.recording = message.on;
        break;
    }
  }

  private post(message: FromPitchWorklet, transfer?: Transferable[]): void {
    if (transfer) this.port.postMessage(message, transfer);
    else this.port.postMessage(message);
  }

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    // No input yet (the stream is still connecting) — stay alive.
    if (!channel || channel.length === 0) return true;

    const mask = LOW_WINDOW_SIZE - 1;
    for (let i = 0; i < channel.length; i += 1) {
      const sample = channel[i] as number;
      this.ring[this.ringWrite] = sample;
      this.ringWrite = (this.ringWrite + 1) & mask;
      const magnitude = sample < 0 ? -sample : sample;
      if (magnitude > this.peak) this.peak = magnitude;
      this.sumSquares += sample * sample;
    }
    this.sumCount += channel.length;
    this.sinceHop += channel.length;

    if (this.recording) {
      // Only while the owner is capturing a clip for a bug report, so the copy
      // and the message are not on the normal path.
      this.post({ type: 'audio', samples: channel.slice() });
    }

    while (this.sinceHop >= HOP_SIZE) {
      this.sinceHop -= HOP_SIZE;
      this.runHop();
    }
    return true;
  }

  /** One analysis hop: unwrap the ring, run the detector, report what it found. */
  private runHop(): void {
    // The newest sample in the analysis is `sinceHop` samples behind the write
    // head, because `process` may have delivered more than one hop's worth.
    const end = (this.ringWrite - this.sinceHop + LOW_WINDOW_SIZE) & (LOW_WINDOW_SIZE - 1);
    const tail = LOW_WINDOW_SIZE - end;
    this.frame.set(this.ring.subarray(end), 0);
    this.frame.set(this.ring.subarray(0, end), tail);

    const frameEndMs = (currentTime - this.sinceHop / sampleRate) * 1000;

    // No timing here on purpose. `currentTime` advances only between render
    // quanta, so it cannot measure work *inside* one, and
    // AudioWorkletGlobalScope has no `performance` — measured, not assumed:
    // the first version of this posted a cost of exactly 0 from Chromium.
    // The per-hop cost `01` §4.7 budgets at 3 ms is taken from the main thread
    // instead, via `AudioContext.renderCapacity` (see MicSource.analysisLoad).
    this.detector.process(this.frame, frameEndMs, this.events);

    if (this.events.length > 0) {
      // `slice()` because the array is reused on the next hop.
      this.post({ type: 'notes', events: this.events.slice() });
    }

    this.hopCount += 1;
    if (this.hopCount >= LEVEL_INTERVAL_HOPS) {
      this.hopCount = 0;
      this.reportLevel();
    }
  }

  private reportLevel(): void {
    const meanSquare = this.sumCount > 0 ? this.sumSquares / this.sumCount : 0;
    const rmsDb = meanSquare > 0 ? Math.max(RMS_FLOOR_DB, 10 * Math.log10(meanSquare)) : RMS_FLOOR_DB;
    this.pushNoise(rmsDb);
    this.post({
      type: 'level',
      peak: this.peak,
      rmsDb,
      noiseFloorDb: this.noiseFloor(),
      onsetStrength: this.detector.onsetStrength,
      tMs: currentTime * 1000,
    });
    this.peak = 0;
    this.sumSquares = 0;
    this.sumCount = 0;
  }

  private pushNoise(rmsDb: number): void {
    this.noiseHistory[this.noiseIndex] = rmsDb;
    this.noiseIndex = (this.noiseIndex + 1) % NOISE_HISTORY;
    if (this.noiseCount < NOISE_HISTORY) this.noiseCount += 1;
  }

  /**
   * The 10th percentile of recent level, not the minimum: a single dropout
   * would otherwise define the room's noise floor for the next ten seconds.
   */
  private noiseFloor(): number {
    if (this.noiseCount === 0) return RMS_FLOOR_DB;
    const view = this.noiseSorted.subarray(0, this.noiseCount);
    view.set(this.noiseHistory.subarray(0, this.noiseCount));
    view.sort();
    const index = Math.min(this.noiseCount - 1, Math.floor(this.noiseCount * NOISE_PERCENTILE));
    return view[index] as number;
  }
}

registerProcessor('pitch-detector', PitchProcessor);
