// One-off renderer for the microphone detector's test fixtures.
//
// Not part of the normal e2e run (see the skip below): it writes files into
// tests/fixtures/audio/ and is re-run only when the fixture list changes.
//
//   GENERATE_AUDIO_FIXTURES=1 npx playwright test tests/e2e/generate-audio-fixtures.spec.ts
//
// It renders the *bundled* piano through an OfflineAudioContext, so the audio
// the detector is measured against is the same instrument the app plays —
// which matters, because detection thresholds tuned on synthetic sine stacks
// would not survive contact with real samples.
//
// The soundfont is decoded directly rather than through smplr: it is a
// MIDI.js file (`MIDI.Soundfont.acoustic_grand_piano = { "C4": "data:..." }`),
// so pulling the base64 for the notes we need and decoding them is a dozen
// lines and avoids depending on a player's scheduling in an offline context.

import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), 'tests', 'fixtures', 'audio');
const SAMPLE_RATE = 44100;

interface ScheduledNote {
  midi: number;
  /** Seconds from the start of the render. */
  atSec: number;
  durationSec: number;
  gain?: number;
}

interface Fixture {
  name: string;
  description: string;
  lengthSec: number;
  notes: ScheduledNote[];
}

/** A C major scale, one octave, as MIDI numbers. */
const C_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72];

const FIXTURES: Fixture[] = [
  {
    name: 'single-notes',
    description: 'One note at a time across the range, 1.2 s apart.',
    lengthSec: 11,
    // Spread across the keyboard: the bass is where detection is hardest and
    // where the bass staff lives.
    notes: [36, 43, 48, 55, 60, 64, 67, 72, 84].map((midi, i) => ({
      midi,
      atSec: 0.3 + i * 1.2,
      durationSec: 1,
    })),
  },
  {
    name: 'chords',
    description: 'C, F and G triads, 1.5 s apart.',
    lengthSec: 6,
    notes: [
      [60, 64, 67],
      [65, 69, 72],
      [67, 71, 74],
    ].flatMap((chord, i) =>
      chord.map((midi) => ({ midi, atSec: 0.3 + i * 1.6, durationSec: 1.4 })),
    ),
  },
  {
    name: 'repeated-pedal',
    description: 'The same note struck five times while it is still ringing.',
    lengthSec: 5,
    // Overlapping durations stand in for a held sustain pedal: the previous
    // strike has not decayed when the next arrives, which is the case the
    // onset detector has to handle (docs/05 §11.3).
    notes: Array.from({ length: 5 }, (_, i) => ({
      midi: 60,
      atSec: 0.3 + i * 0.8,
      durationSec: 2.5,
    })),
  },
  {
    name: 'scale-fast',
    description: 'C major scale, sixteenths at 120 bpm (125 ms per note).',
    lengthSec: 2,
    notes: C_MAJOR.map((midi, i) => ({
      midi,
      atSec: 0.3 + i * 0.125,
      durationSec: 0.3,
    })),
  },
];

test.describe('audio fixture generation', () => {
  test.skip(
    !process.env.GENERATE_AUDIO_FIXTURES,
    'set GENERATE_AUDIO_FIXTURES=1 to re-render the microphone fixtures',
  );

  test('renders the bundled piano to WAV fixtures', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/');

    for (const fixture of FIXTURES) {
      const base64 = await page.evaluate(
        async ({ notes, lengthSec, sampleRate }) => {
          // --- load and decode the bundled soundfont ------------------------
          const url = `${document.baseURI.replace(/\/$/, '')}/content/audio/acoustic_grand_piano-mp3.js`;
          const source = await (await fetch(url)).text();
          const header = source.indexOf('MIDI.Soundfont.');
          const start = source.indexOf('=', header) + 2;
          const end = source.lastIndexOf(',');
          const table = JSON.parse(source.slice(start, end) + '}') as Record<string, string>;

          const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const nameOf = (midi: number) =>
            `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

          const context = new OfflineAudioContext(1, Math.ceil(lengthSec * sampleRate), sampleRate);

          const buffers = new Map<number, AudioBuffer>();
          for (const midi of new Set(notes.map((n) => n.midi))) {
            const encoded = table[nameOf(midi)];
            if (!encoded) throw new Error(`no sample for ${nameOf(midi)} (midi ${midi})`);
            const binary = atob(encoded.slice(encoded.indexOf(',') + 1));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
            buffers.set(midi, await context.decodeAudioData(bytes.buffer));
          }

          // --- schedule -----------------------------------------------------
          for (const note of notes) {
            const buffer = buffers.get(note.midi);
            if (!buffer) continue;
            const player = context.createBufferSource();
            player.buffer = buffer;
            const gain = context.createGain();
            gain.gain.value = note.gain ?? 0.8;
            // A short release rather than a hard stop, so the cut does not
            // read as a transient the onset detector might fire on.
            gain.gain.setValueAtTime(note.gain ?? 0.8, note.atSec + note.durationSec);
            gain.gain.exponentialRampToValueAtTime(0.0001, note.atSec + note.durationSec + 0.08);
            player.connect(gain);
            gain.connect(context.destination);
            player.start(note.atSec);
            player.stop(note.atSec + note.durationSec + 0.1);
          }

          const rendered = await context.startRendering();
          const pcm = rendered.getChannelData(0);

          // --- encode 16-bit mono WAV ---------------------------------------
          const bytesOut = new ArrayBuffer(44 + pcm.length * 2);
          const view = new DataView(bytesOut);
          const ascii = (offset: number, text: string) => {
            for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
          };
          ascii(0, 'RIFF');
          view.setUint32(4, 36 + pcm.length * 2, true);
          ascii(8, 'WAVE');
          ascii(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * 2, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          ascii(36, 'data');
          view.setUint32(40, pcm.length * 2, true);
          for (let i = 0; i < pcm.length; i += 1) {
            const clamped = Math.max(-1, Math.min(1, pcm[i] ?? 0));
            view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
          }

          let binary = '';
          const out = new Uint8Array(bytesOut);
          for (let i = 0; i < out.length; i += 1) binary += String.fromCharCode(out[i]);
          return btoa(binary);
        },
        { notes: fixture.notes, lengthSec: fixture.lengthSec, sampleRate: SAMPLE_RATE },
      );

      mkdirSync(OUT_DIR, { recursive: true });
      const wav = Buffer.from(base64, 'base64');
      writeFileSync(join(OUT_DIR, `${fixture.name}.wav`), wav);
      console.log(`${fixture.name}.wav: ${(wav.byteLength / 1024).toFixed(0)} kB`);
      expect(wav.byteLength).toBeGreaterThan(1000);
    }

    // Ground truth alongside the audio: the detector is measured against the
    // schedule that produced it, so there is nothing to hand-label.
    writeFileSync(
      join(OUT_DIR, 'fixtures.json'),
      `${JSON.stringify(
        {
          sampleRate: SAMPLE_RATE,
          fixtures: FIXTURES.map((f) => ({
            name: f.name,
            description: f.description,
            lengthSec: f.lengthSec,
            notes: f.notes,
          })),
        },
        null,
        2,
      )}\n`,
    );
  });
});
