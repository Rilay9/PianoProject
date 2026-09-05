import { describe, expect, it } from 'vitest';
import { createFft, fftInPlace, hannWindow } from '../../src/audio/pitch/fft';
import {
  applyConfusionGuards,
  backgroundNear,
  computeSpectrum,
  createSpectrumContext,
  defaultInharmonicityFor,
  harmonicScore,
  hzToMidi,
  midiToHz,
  OnsetDetector,
  oddHarmonicScore,
  partialHz,
  spectralFlux,
} from '../../src/audio/pitch/dsp';
import { at, mix, noise, pianoTone, SAMPLE_RATE, silence, sine } from './helpers/signals';

const WINDOW = 4096;

function spectrumOf(samples: Float32Array, offset = 0) {
  const ctx = createSpectrumContext(WINDOW, SAMPLE_RATE);
  computeSpectrum(ctx, samples, offset);
  ctx.hasPrevious = true;
  return ctx;
}

function peakBin(magnitude: Float32Array): number {
  let best = 0;
  for (let i = 1; i < magnitude.length; i += 1) {
    if ((magnitude[i] ?? 0) > (magnitude[best] ?? 0)) best = i;
  }
  return best;
}

describe('FFT', () => {
  it('rejects a non-power-of-two size', () => {
    expect(() => createFft(1000)).toThrow(RangeError);
  });

  it('turns DC into a single bin', () => {
    const ctx = createFft(16);
    const real = new Float32Array(16).fill(1);
    const imag = new Float32Array(16);
    fftInPlace(ctx, real, imag);
    expect(real[0]).toBeCloseTo(16, 4);
    for (let i = 1; i < 8; i += 1) expect(Math.hypot(real[i] ?? 0, imag[i] ?? 0)).toBeCloseTo(0, 3);
  });

  it('puts a bin-centred sine in exactly that bin', () => {
    const size = 64;
    const ctx = createFft(size);
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    // Four cycles across the window lands precisely on bin 4.
    for (let i = 0; i < size; i += 1) real[i] = Math.sin((2 * Math.PI * 4 * i) / size);
    fftInPlace(ctx, real, imag);
    const magnitude = Array.from({ length: size / 2 }, (_, i) =>
      Math.hypot(real[i] ?? 0, imag[i] ?? 0),
    );
    expect(peakBin(Float32Array.from(magnitude))).toBe(4);
  });

  it('conserves energy (Parseval)', () => {
    const size = 256;
    const ctx = createFft(size);
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    for (let i = 0; i < size; i += 1) real[i] = Math.sin(i) + 0.3 * Math.cos(3 * i);
    const timeEnergy = real.reduce((sum, v) => sum + v * v, 0);
    fftInPlace(ctx, real, imag);
    let freqEnergy = 0;
    for (let i = 0; i < size; i += 1) {
      freqEnergy += (real[i] ?? 0) ** 2 + (imag[i] ?? 0) ** 2;
    }
    expect(freqEnergy / size).toBeCloseTo(timeEnergy, 2);
  });

  it('builds a Hann window that starts and ends at zero and peaks at one', () => {
    const window = hannWindow(64);
    expect(window[0]).toBeCloseTo(0, 6);
    expect(window[63]).toBeCloseTo(0, 6);
    // With an even size no sample lands exactly on the peak, so it approaches
    // 1 without reaching it.
    expect(Math.max(...window)).toBeGreaterThan(0.999);
    expect(Math.max(...window)).toBeLessThanOrEqual(1);
  });
});

describe('pitch and partial arithmetic', () => {
  it('maps MIDI to Hz at the reference pitch', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(60)).toBeCloseTo(261.6256, 3);
    expect(midiToHz(21)).toBeCloseTo(27.5, 3);
    expect(midiToHz(108)).toBeCloseTo(4186.009, 2);
  });

  it('round-trips Hz back to MIDI', () => {
    for (const midi of [21, 40, 60, 69, 88, 108]) {
      expect(hzToMidi(midiToHz(midi))).toBeCloseTo(midi, 6);
    }
  });

  it('places partials above the harmonic series, more so higher up', () => {
    const f0 = midiToHz(60);
    const b = 0.0004;
    expect(partialHz(f0, 1, b)).toBeGreaterThan(f0);
    // The 6th partial of a real string is a fraction of a percent sharp, not
    // over one percent — the square-root form, not the linear one.
    const stretch = partialHz(f0, 6, b) / (6 * f0);
    expect(stretch).toBeGreaterThan(1.005);
    expect(stretch).toBeLessThan(1.01);
  });

  it('assumes more inharmonicity in the bass', () => {
    expect(defaultInharmonicityFor(36)).toBeGreaterThan(defaultInharmonicityFor(60));
    expect(defaultInharmonicityFor(72)).toBe(defaultInharmonicityFor(60));
  });
});

describe('spectrum', () => {
  it('peaks at the bin of the tone it was given', () => {
    const ctx = spectrumOf(sine(440, WINDOW));
    const peakHz = peakBin(ctx.magnitude) * ctx.binHz;
    expect(peakHz).toBeCloseTo(440, -1);
  });

  it('floors silence rather than producing −Infinity', () => {
    const ctx = spectrumOf(silence(WINDOW));
    expect(ctx.magnitude.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('resolves two adjacent semitones near middle C', () => {
    // 4096 points at 44.1 kHz is ~10.8 Hz per bin; C4 to C#4 is ~15.6 Hz.
    const ctx = spectrumOf(mix(sine(midiToHz(60), WINDOW), sine(midiToHz(61), WINDOW)));
    const c4 = Math.round(midiToHz(60) / ctx.binHz);
    const cs4 = Math.round(midiToHz(61) / ctx.binHz);
    expect(cs4).toBeGreaterThan(c4);
    // Both peaks are present and the valley between them is lower than either.
    const between = ctx.magnitude[Math.round((c4 + cs4) / 2)] ?? 0;
    expect(ctx.magnitude[c4] ?? 0).toBeGreaterThan(between);
    expect(ctx.magnitude[cs4] ?? 0).toBeGreaterThan(between);
  });
});

describe('spectral flux and onsets', () => {
  it('is near zero for a steady tone and large when one starts', () => {
    const ctx = createSpectrumContext(WINDOW, SAMPLE_RATE);
    const steady = sine(440, WINDOW * 4);

    computeSpectrum(ctx, steady, 0);
    ctx.hasPrevious = true;
    computeSpectrum(ctx, steady, WINDOW);
    const steadyFlux = spectralFlux(ctx);

    const startingUp = at(sine(440, WINDOW * 2), WINDOW, WINDOW * 3);
    const ctx2 = createSpectrumContext(WINDOW, SAMPLE_RATE);
    computeSpectrum(ctx2, startingUp, 0);
    ctx2.hasPrevious = true;
    computeSpectrum(ctx2, startingUp, WINDOW);
    const onsetFlux = spectralFlux(ctx2);

    expect(onsetFlux).toBeGreaterThan(steadyFlux * 5);
  });

  it('ignores a note ending, because only rises are counted', () => {
    const ctx = createSpectrumContext(WINDOW, SAMPLE_RATE);
    const ending = at(sine(440, WINDOW), 0, WINDOW * 3);
    computeSpectrum(ctx, ending, 0);
    ctx.hasPrevious = true;
    computeSpectrum(ctx, ending, WINDOW);
    // The tone stopped; flux measures rise, so this must stay small.
    const steady = createSpectrumContext(WINDOW, SAMPLE_RATE);
    const tone = sine(440, WINDOW * 3);
    computeSpectrum(steady, tone, 0);
    steady.hasPrevious = true;
    computeSpectrum(steady, tone, WINDOW);
    expect(spectralFlux(ctx)).toBeLessThan(spectralFlux(steady) + 500);
  });

  it('fires on a rise and holds off during the minimum interval', () => {
    const detector = new OnsetDetector({ thresholdDelta: 5, minIntervalMs: 50 });
    for (let i = 0; i < 10; i += 1) detector.push(10, i * 11);
    const fired = detector.push(100, 110);
    expect(fired.onset).toBe(true);
    expect(fired.strength).toBeGreaterThan(0);
    // Another spike 11 ms later is the same event, not a new one.
    expect(detector.push(100, 121).onset).toBe(false);
    for (let i = 0; i < 10; i += 1) detector.push(10, 130 + i * 11);
    expect(detector.push(100, 260).onset).toBe(true);
  });

  it('needs some history before it will fire at all', () => {
    const detector = new OnsetDetector();
    expect(detector.push(1000, 0).onset).toBe(false);
  });

  it('adapts: the same absolute flux is an onset in a quiet room and not in a loud one', () => {
    const quiet = new OnsetDetector({ thresholdDelta: 10, minIntervalMs: 0 });
    for (let i = 0; i < 20; i += 1) quiet.push(5, i * 11);
    expect(quiet.push(40, 220).onset).toBe(true);

    const loud = new OnsetDetector({ thresholdDelta: 10, minIntervalMs: 0 });
    for (let i = 0; i < 20; i += 1) loud.push(60, i * 11);
    expect(loud.push(40, 220).onset).toBe(false);
  });

  it('reset() clears the history', () => {
    const detector = new OnsetDetector({ thresholdDelta: 5, minIntervalMs: 0 });
    for (let i = 0; i < 20; i += 1) detector.push(100, i * 11);
    detector.reset();
    expect(detector.push(100, 300).onset).toBe(false);
  });
});

describe('harmonic templates', () => {
  const scratch = new Float32Array(512);

  it('scores a pitch that is present far above one that is not', () => {
    const ctx = spectrumOf(pianoTone(60, WINDOW));
    const present = harmonicScore(ctx, 60, { scratch });
    const absent = harmonicScore(ctx, 66, { scratch });
    expect(present).toBeGreaterThan(15);
    expect(present).toBeGreaterThan(absent + 15);
  });

  it('finds every pitch of a three-note chord', () => {
    const ctx = spectrumOf(mix(pianoTone(60, WINDOW), pianoTone(64, WINDOW), pianoTone(67, WINDOW)));
    for (const midi of [60, 64, 67]) {
      expect(harmonicScore(ctx, midi, { scratch })).toBeGreaterThan(15);
    }
    // A note that is not in the chord scores much lower.
    expect(harmonicScore(ctx, 61, { scratch })).toBeLessThan(
      harmonicScore(ctx, 60, { scratch }) - 10,
    );
  });

  it('works across the range, bass to treble', () => {
    for (const midi of [36, 48, 60, 72, 84]) {
      const ctx = spectrumOf(pianoTone(midi, WINDOW));
      expect(harmonicScore(ctx, midi, { scratch })).toBeGreaterThan(12);
    }
  });

  it('survives added noise', () => {
    const ctx = spectrumOf(mix(pianoTone(60, WINDOW, { amplitude: 0.5 }), noise(WINDOW, 0.02)));
    expect(harmonicScore(ctx, 60, { scratch })).toBeGreaterThan(10);
  });

  it('background is the local floor, not the note itself', () => {
    const ctx = spectrumOf(pianoTone(60, WINDOW));
    const background = backgroundNear(ctx, midiToHz(60), 0.0004, scratch);
    const peak = Math.max(...ctx.magnitude);
    expect(background).toBeLessThan(peak - 20);
  });
});

describe('octave and fifth confusion guards', () => {
  const scratch = new Float32Array(512);

  it('an octave above lights up the lower pitch — which is what the guard is for', () => {
    // C5 alone. Its partials sit on every even partial of C4, so a naive
    // template match reports C4 as present.
    const ctx = spectrumOf(pianoTone(72, WINDOW));
    const naive = harmonicScore(ctx, 60, { scratch });
    expect(naive).toBeGreaterThan(5);

    const candidates = [60, 72];
    const scores = Float32Array.from([naive, harmonicScore(ctx, 72, { scratch })]);
    const guarded = new Float32Array(2);
    applyConfusionGuards(ctx, candidates, scores, { scratch }, guarded);
    // After the guard the phantom C4 scores well below the real C5.
    expect(guarded[0] ?? 0).toBeLessThan(guarded[1] ?? 0);
    expect(guarded[0] ?? 0).toBeLessThan(naive);
  });

  it('leaves a genuine octave pair alone', () => {
    const ctx = spectrumOf(mix(pianoTone(60, WINDOW), pianoTone(72, WINDOW)));
    const candidates = [60, 72];
    const scores = Float32Array.from([
      harmonicScore(ctx, 60, { scratch }),
      harmonicScore(ctx, 72, { scratch }),
    ]);
    const guarded = new Float32Array(2);
    applyConfusionGuards(ctx, candidates, scores, { scratch }, guarded);
    // Both really are being played, so both survive.
    expect(guarded[0] ?? 0).toBeGreaterThan(10);
    expect(guarded[1] ?? 0).toBeGreaterThan(10);
  });

  it('odd-partial energy tells a real low note from a phantom one', () => {
    const real = spectrumOf(pianoTone(60, WINDOW));
    const phantom = spectrumOf(pianoTone(72, WINDOW));
    expect(oddHarmonicScore(real, 60, { scratch })).toBeGreaterThan(
      oddHarmonicScore(phantom, 60, { scratch }) + 8,
    );
  });
});
