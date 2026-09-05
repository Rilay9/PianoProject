// Synthetic test signals.
//
// Pure maths, no audio rendering: these let the DSP be verified exactly —
// a 440 Hz sine must peak at 440 Hz, an octave stack must trip the octave
// guard — before any real piano sample is involved. Real audio comes later,
// through the rendered fixtures.

import { midiToHz, partialHz, defaultInharmonicityFor } from '../../../src/audio/pitch/dsp';

export const SAMPLE_RATE = 44100;

export function sine(hz: number, samples: number, sampleRate = SAMPLE_RATE, amplitude = 1): Float32Array {
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    out[i] = amplitude * Math.sin((2 * Math.PI * hz * i) / sampleRate);
  }
  return out;
}

export function silence(samples: number): Float32Array {
  return new Float32Array(samples);
}

export function noise(samples: number, amplitude = 0.01, seed = 1): Float32Array {
  // Deterministic: a test that fails only on some runs teaches nothing.
  let state = seed >>> 0;
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    out[i] = ((state / 0xffffffff) * 2 - 1) * amplitude;
  }
  return out;
}

export interface ToneOptions {
  harmonics?: number;
  amplitude?: number;
  /** Exponential decay time constant in seconds; omit for a steady tone. */
  decaySec?: number;
  inharmonicity?: number;
  sampleRate?: number;
}

/**
 * A piano-ish tone: a decaying stack of partials with realistic inharmonicity
 * and a 1/h amplitude roll-off.
 */
export function pianoTone(midi: number, samples: number, options: ToneOptions = {}): Float32Array {
  const sampleRate = options.sampleRate ?? SAMPLE_RATE;
  const harmonics = options.harmonics ?? 8;
  const amplitude = options.amplitude ?? 1;
  const inharmonicity = options.inharmonicity ?? defaultInharmonicityFor(midi);
  const f0 = midiToHz(midi);
  const out = new Float32Array(samples);
  for (let h = 1; h <= harmonics; h += 1) {
    const hz = partialHz(f0, h, inharmonicity);
    if (hz >= sampleRate / 2) break;
    const weight = amplitude / h;
    for (let i = 0; i < samples; i += 1) {
      const envelope = options.decaySec ? Math.exp(-i / sampleRate / options.decaySec) : 1;
      out[i] = (out[i] as number) + weight * envelope * Math.sin((2 * Math.PI * hz * i) / sampleRate);
    }
  }
  return out;
}

/** Sums several tones into one buffer — a chord. */
export function mix(...buffers: Float32Array[]): Float32Array {
  const length = Math.max(...buffers.map((b) => b.length));
  const out = new Float32Array(length);
  for (const buffer of buffers) {
    for (let i = 0; i < buffer.length; i += 1) out[i] = (out[i] as number) + (buffer[i] as number);
  }
  return out;
}

/** Places `tone` into a buffer of `totalSamples` starting at `atSample`. */
export function at(tone: Float32Array, atSample: number, totalSamples: number): Float32Array {
  const out = new Float32Array(totalSamples);
  for (let i = 0; i < tone.length && atSample + i < totalSamples; i += 1) {
    out[atSample + i] = tone[i] as number;
  }
  return out;
}
