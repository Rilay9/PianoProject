// Writing a WAV file.
//
// The Diagnostics screen records 20 seconds of raw microphone audio for the
// owner to share back (docs/05 §11.6: "these become regression fixtures for the
// HP-130 + S25 combination"), so the format has to be one that both a phone's
// share sheet and the Vitest fixture loader can read. 16-bit PCM is that
// format: it is what `tests/unit/helpers/wav.ts` parses and what Chromium's
// own fake-capture flag accepts, so a clip the owner sends back can be dropped
// straight into the test suite.

/** Encodes mono float samples (-1..1) as a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  const ascii = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  for (let i = 0; i < samples.length; i += 1) {
    // Clamp before scaling: a clipped input would otherwise wrap around and
    // turn a loud note into noise, which is exactly the recording the owner
    // is trying to send us.
    const value = Math.max(-1, Math.min(1, samples[i] as number));
    view.setInt16(44 + i * bytesPerSample, Math.round(value * 32767), true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/** Joins the chunks a worklet streamed back into one buffer. */
export function concatChunks(chunks: readonly Float32Array[]): Float32Array {
  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const out = new Float32Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
