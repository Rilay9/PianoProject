// @vitest-environment jsdom
// The WAV writer behind the Diagnostics capture.
//
// A clip the owner records on the phone has to come back as something the test
// suite can load, so this asserts against the same reader the fixtures use.

import { describe, expect, it } from 'vitest';
import { concatChunks, encodeWav } from '../../src/util/wav';
import { parseWav } from './helpers/wav';

async function roundTrip(samples: Float32Array, sampleRate: number) {
  const blob = encodeWav(samples, sampleRate);
  return parseWav(Buffer.from(await blob.arrayBuffer()));
}

describe('encodeWav', () => {
  it('writes a file the fixture loader reads back', async () => {
    const input = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const decoded = await roundTrip(input, 44100);
    expect(decoded.sampleRate).toBe(44100);
    expect(decoded.samples).toHaveLength(input.length);
    for (let i = 0; i < input.length; i += 1) {
      // 16-bit quantisation: within one step of the original.
      expect(decoded.samples[i]).toBeCloseTo(input[i] as number, 4);
    }
  });

  it('clamps instead of wrapping, so a clipped note stays a note', async () => {
    const decoded = await roundTrip(new Float32Array([2, -2]), 48000);
    expect(decoded.samples[0]).toBeGreaterThan(0.99);
    expect(decoded.samples[1]).toBeLessThan(-0.99);
  });

  it('keeps the sample rate it was given', async () => {
    const decoded = await roundTrip(new Float32Array(16), 48000);
    expect(decoded.sampleRate).toBe(48000);
  });
});

describe('concatChunks', () => {
  it('joins the worklet stream in order', () => {
    const joined = concatChunks([new Float32Array([1, 2]), new Float32Array([3]), new Float32Array()]);
    expect([...joined]).toEqual([1, 2, 3]);
  });

  it('handles nothing recorded', () => {
    expect(concatChunks([])).toHaveLength(0);
  });
});
