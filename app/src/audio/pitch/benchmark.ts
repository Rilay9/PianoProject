// Measuring what the detector costs per hop.
//
// docs/01 §4.7 budgets 3 ms of analysis per 512-sample hop on the S25, and
// that number has to be measurable *on the phone*, from the Diagnostics
// screen, because a desktop CI runner says nothing about it.
//
// It cannot be measured inside the worklet: AudioWorkletGlobalScope has no
// `performance` (measured, not assumed — the first version of the worklet
// posted a cost of exactly 0 from Chromium) and `currentTime` does not advance
// within a render quantum. So the same detector class is run over the same
// kind of signal on the main thread instead. That leaves out the audio
// thread's own scheduling overhead and includes whatever else the page is
// doing, which is why the routine below runs a warm-up pass first and reports
// the median as well as the mean.

import {
  HOP_SIZE,
  LOW_WINDOW_SIZE,
  PitchDetector,
  type DetectedNote,
} from './detector';

export interface CostReport {
  sampleRate: number;
  hops: number;
  meanMs: number;
  medianMs: number;
  /** 95th percentile: what a hop costs on a bad frame, not the worst outlier. */
  p95Ms: number;
  maxMs: number;
  /** Detections made during the run — proof the work was real. */
  events: number;
}

export interface CostOptions {
  sampleRate?: number;
  hops?: number;
  /** Pitches the detector is told to expect; three is a chord, the usual case. */
  expectations?: number[];
  next?: number[];
}

/**
 * Synthesises a stream of piano-like strikes.
 *
 * Real attacks matter: the unexpected-pitch scan only runs on an onset and is
 * the most expensive thing the detector does, so a benchmark over a steady
 * tone would flatter it by never triggering the scan.
 */
function strikeSignal(length: number, sampleRate: number, midis: readonly number[]): Float32Array {
  const out = new Float32Array(length);
  const strikeEvery = Math.round(sampleRate * 0.35);
  const partials = [1, 2, 3, 4, 5, 6];
  for (let strike = 0; strike * strikeEvery < length; strike += 1) {
    const start = strike * strikeEvery;
    const midi = midis[strike % midis.length] as number;
    const f0 = 440 * Math.pow(2, (midi - 69) / 12);
    for (let i = 0; i < strikeEvery && start + i < length; i += 1) {
      const t = i / sampleRate;
      const envelope = Math.exp(-3 * t) * 0.3;
      let sample = 0;
      for (const h of partials) sample += (Math.sin(2 * Math.PI * f0 * h * t) / h);
      out[start + i] = (out[start + i] as number) + sample * envelope;
    }
  }
  return out;
}

/**
 * Runs the detector over synthetic strikes and reports the per-hop cost.
 *
 * Synchronous and self-contained so the Diagnostics screen can call it on the
 * phone and paste the numbers back.
 */
export function measureDetectorCost(options: CostOptions = {}): CostReport {
  const sampleRate = options.sampleRate ?? 48000;
  const hops = options.hops ?? 200;
  const expectations = options.expectations ?? [60, 64, 67];
  const next = options.next ?? [72];

  const total = LOW_WINDOW_SIZE + hops * HOP_SIZE;
  const signal = strikeSignal(total, sampleRate, [60, 64, 67, 72, 48]);
  const detector = new PitchDetector({ sampleRate });
  detector.setExpectations(expectations, next);
  const frame = new Float32Array(LOW_WINDOW_SIZE);
  const events: DetectedNote[] = [];
  let eventCount = 0;

  // Warm-up: the first hops pay for JIT compilation and for the spectrum
  // history filling up, and they are not what a session looks like.
  const warmUp = Math.min(20, hops);
  for (let i = 0; i < warmUp; i += 1) {
    const end = LOW_WINDOW_SIZE + i * HOP_SIZE;
    frame.set(signal.subarray(end - LOW_WINDOW_SIZE, end));
    detector.process(frame, (end / sampleRate) * 1000, events);
  }

  const samples: number[] = [];
  for (let i = warmUp; i < hops; i += 1) {
    const end = LOW_WINDOW_SIZE + i * HOP_SIZE;
    frame.set(signal.subarray(end - LOW_WINDOW_SIZE, end));
    const t0 = performance.now();
    detector.process(frame, (end / sampleRate) * 1000, events);
    samples.push(performance.now() - t0);
    eventCount += events.length;
  }

  samples.sort((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  const at = (fraction: number): number =>
    samples[Math.min(samples.length - 1, Math.floor(samples.length * fraction))] ?? 0;
  return {
    sampleRate,
    hops: samples.length,
    meanMs: samples.length > 0 ? sum / samples.length : 0,
    medianMs: at(0.5),
    p95Ms: at(0.95),
    maxMs: samples[samples.length - 1] ?? 0,
    events: eventCount,
  };
}
