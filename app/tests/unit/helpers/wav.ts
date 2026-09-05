// Reading the rendered fixture WAVs in Node.
//
// A 44-byte canonical header is all these files have — they are written by
// tests/e2e/generate-audio-fixtures.spec.ts — so a full RIFF parser would be
// ceremony. The chunk walk is still done properly, because a silently
// misparsed offset would show up as a mysterious detection failure rather
// than as an error.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const AUDIO_FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'audio');

export interface WavData {
  sampleRate: number;
  channels: number;
  samples: Float32Array;
}

export function readWav(path: string): WavData {
  const buffer = readFileSync(path);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${path} is not a RIFF/WAVE file`);
  }

  let offset = 12;
  let sampleRate = 44100;
  let channels = 1;
  let bitsPerSample = 16;
  let samples: Float32Array | null = null;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      channels = buffer.readUInt16LE(body + 2);
      sampleRate = buffer.readUInt32LE(body + 4);
      bitsPerSample = buffer.readUInt16LE(body + 14);
    } else if (id === 'data') {
      if (bitsPerSample !== 16) throw new Error(`expected 16-bit PCM, got ${bitsPerSample}`);
      const count = Math.floor(size / 2);
      samples = new Float32Array(count);
      for (let i = 0; i < count; i += 1) {
        samples[i] = buffer.readInt16LE(body + i * 2) / 32768;
      }
    }
    // Chunks are word-aligned.
    offset = body + size + (size % 2);
  }

  if (!samples) throw new Error(`${path} has no data chunk`);
  return { sampleRate, channels, samples };
}

export interface FixtureNote {
  midi: number;
  atSec: number;
  durationSec: number;
}

export interface FixtureMeta {
  name: string;
  description: string;
  lengthSec: number;
  notes: FixtureNote[];
}

export function readFixtureMeta(): { sampleRate: number; fixtures: FixtureMeta[] } {
  return JSON.parse(
    readFileSync(join(AUDIO_FIXTURE_DIR, 'fixtures.json'), 'utf8'),
  ) as { sampleRate: number; fixtures: FixtureMeta[] };
}

export function loadFixture(name: string): { meta: FixtureMeta; audio: WavData } {
  const { fixtures } = readFixtureMeta();
  const meta = fixtures.find((f) => f.name === name);
  if (!meta) throw new Error(`no audio fixture named "${name}"`);
  return { meta, audio: readWav(join(AUDIO_FIXTURE_DIR, `${name}.wav`)) };
}
