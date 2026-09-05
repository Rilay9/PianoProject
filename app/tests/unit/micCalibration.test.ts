// The calibration measurements, against rendered piano (docs/05 §11.5).
//
// The fixtures are the same ones the detector is measured on, so "does the
// inharmonicity fit find anything sensible?" is answered against real sampled
// piano rather than against synthesised sine stacks that would be, by
// construction, perfectly harmonic.

import { describe, expect, it } from 'vitest';
import { loadFixture } from './helpers/wav';
import {
  analyseCalibration,
  buildCalibration,
  estimateLatencyMs,
  MAX_GAIN_DB,
  MAX_MEASURED_LATENCY_MS,
  measureNoiseFloorDb,
  isHeard,
  measurePitch,
  pitchName,
  type PitchMeasurement,
} from '../../src/audio/pitch/calibration';
import { noise } from './helpers/signals';
import { DEFAULT_INHARMONICITY } from '../../src/audio/pitch/dsp';

describe('measurePitch', () => {
  it('finds every note of the single-notes fixture', () => {
    const { meta, audio } = loadFixture('single-notes');
    for (const note of meta.notes) {
      const measured = measurePitch(audio.samples, audio.sampleRate, note.midi);
      expect(measured, `${pitchName(note.midi)} was not measured`).not.toBeNull();
      expect(measured?.scoreDb).toBeGreaterThan(10);
      // The loudest frame should be inside the note, not somewhere else.
      expect(measured?.atSec).toBeGreaterThan(note.atSec - 0.2);
      expect(measured?.atSec).toBeLessThan(note.atSec + note.durationSec + 0.3);
    }
  });

  it('fits an inharmonicity in the physical range for a piano string', () => {
    const { meta, audio } = loadFixture('single-notes');
    for (const note of meta.notes) {
      const measured = measurePitch(audio.samples, audio.sampleRate, note.midi);
      expect(measured?.inharmonicity).toBeGreaterThanOrEqual(0);
      // Real grand piano B runs from ~1e-5 in the treble to ~5e-3 at the very
      // bottom; anything beyond that would mean the fit found a neighbour's
      // partial rather than its own.
      expect(measured?.inharmonicity).toBeLessThan(0.006);
      expect(measured?.partialsFound).toBeGreaterThanOrEqual(3);
    }
  });

  it('does not claim to hear a pitch that was never played', () => {
    const { audio } = loadFixture('repeated-pedal'); // a C4, repeatedly
    const played = measurePitch(audio.samples, audio.sampleRate, 60);
    const absent = measurePitch(audio.samples, audio.sampleRate, 61);
    expect(isHeard(played)).toBe(true);
    // The template score alone does not separate these — C#4 matches the
    // skirts of C4's partials and scores just as high. Where the fundamental
    // sits does: C#4's is a whole semitone from anything in the recording.
    expect(isHeard(absent)).toBe(false);
    expect(Math.abs(played?.detuneCents ?? 99)).toBeLessThan(20);
  });
});

describe('noise floor', () => {
  it('measures a quiet room well below a played note', () => {
    const quiet = noise(44100 * 2, 0.001, 3);
    const floor = measureNoiseFloorDb(quiet, 44100);
    expect(floor).toBeLessThan(-40);
    expect(floor).toBeGreaterThan(-90);
  });

  it('ignores an isolated bump rather than taking the minimum', () => {
    const samples = noise(44100, 0.002, 5);
    // One loud half-second in the middle: the floor is what the room does the
    // rest of the time.
    for (let i = 20000; i < 42000; i += 1) samples[i] = (samples[i] as number) + 0.4;
    const floor = measureNoiseFloorDb(samples, 44100);
    expect(floor).toBeLessThan(-40);
  });
});

describe('latency estimate', () => {
  it('takes the median of the offsets', () => {
    expect(estimateLatencyMs([30, 40, 50])).toBe(40);
  });

  it('clamps a nonsense measurement instead of trusting it', () => {
    expect(estimateLatencyMs([-200, -180, -190])).toBe(0);
    expect(estimateLatencyMs([800, 900, 1000])).toBe(MAX_MEASURED_LATENCY_MS);
  });

  it('is zero with nothing measured', () => {
    expect(estimateLatencyMs([])).toBe(0);
  });
});

describe('buildCalibration', () => {
  const measurement = (midi: number, scoreDb: number): PitchMeasurement => ({
    midi,
    scoreDb,
    fundamentalDb: scoreDb,
    detuneCents: 0,
    inharmonicity: DEFAULT_INHARMONICITY,
    partialsFound: 6,
    atSec: 0,
  });

  it('pulls every pitch towards the median rather than to an absolute level', () => {
    const result = buildCalibration([measurement(48, 10), measurement(60, 20), measurement(72, 30)], {
      noiseFloorDb: -60,
      latencyMs: 20,
    });
    const gain = new Map(result.gainDb);
    // The quiet octave is lifted, the loud one is pushed down, the middle one
    // is left alone — a phone microphone's bass rolloff, corrected.
    expect(gain.get(48)).toBeCloseTo(10, 5);
    expect(gain.get(60)).toBeCloseTo(0, 5);
    expect(gain.get(72)).toBeCloseTo(-10, 5);
  });

  it('bounds the correction so one bad recording cannot deafen the detector', () => {
    const result = buildCalibration([measurement(48, -50), measurement(60, 20), measurement(72, 21)], {
      noiseFloorDb: -60,
      latencyMs: 0,
    });
    expect(new Map(result.gainDb).get(48)).toBe(MAX_GAIN_DB);
  });

  it('covers the whole keyboard from a handful of measured pitches', () => {
    const result = buildCalibration([measurement(48, 10), measurement(72, 30)], {
      noiseFloorDb: -60,
      latencyMs: 0,
    });
    expect(result.gainDb).toHaveLength(88);
    const gain = new Map(result.gainDb);
    expect(gain.get(21)).toBe(gain.get(48));
    expect(gain.get(108)).toBe(gain.get(72));
    // Halfway between the two measured points, halfway between their values.
    expect(gain.get(60)).toBeCloseTo(0, 1);
  });
});

describe('analyseCalibration', () => {
  it('produces a usable table from recordings of the fixtures', () => {
    const octaves = loadFixture('single-notes'); // C2, C3, C4, C6 among others
    const chords = loadFixture('chords');
    const quiet = noise(44100 * 2, 0.001, 11);

    const result = analyseCalibration([
      { id: 'noise', samples: quiet, sampleRate: 44100 },
      { id: 'octaves', samples: octaves.audio.samples, sampleRate: octaves.audio.sampleRate },
      {
        id: 'chords',
        samples: chords.audio.samples,
        sampleRate: chords.audio.sampleRate,
        clickTimesMs: [],
        onsetTimesMs: [],
      },
    ]);

    expect(result.calibration.gainDb).toHaveLength(88);
    expect(result.calibration.noiseFloorDb).toBeLessThan(-40);
    // The fixture really contains C2, C3, C4 and C6, so those must be measured
    // rather than reported missing.
    const measured = new Set(result.measurements.map((m) => m.midi));
    for (const midi of [36, 48, 60, 84]) expect(measured.has(midi)).toBe(true);
    // The first check chord (C major) is in the chords fixture.
    expect(result.chordsHeard).toBeGreaterThanOrEqual(1);
  });
});
