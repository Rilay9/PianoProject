// Sampled piano, played through smplr's MIDI.js soundfont player.
//
// The samples are bundled (public/content/audio/), not fetched from smplr's
// default CDN: the app must work offline on a phone, and the Workbox precache
// in vite.config.ts already covers everything under `content/`. See
// docs/decisions/2026-09-05-p1-midi-audio-choices.md §3 for which soundfont
// and why.
//
// The module is deliberately thin — it owns loading, note on/off, the sustain
// pedal and disposal, and nothing else. Anything musical (which note, when,
// how loud) belongs to the practice engine.

import { Soundfont } from 'smplr';

export type PianoState = 'idle' | 'loading' | 'ready' | 'error';

/** Path of the bundled instrument, relative to the app's deploy base. */
export const BUNDLED_PIANO_PATH = 'content/audio/acoustic_grand_piano-mp3.js';

/**
 * Resolves the instrument URL against the Vite `base` (`/PianoProject/` on
 * GitHub Pages, `/` in most dev setups), so the same code works in dev,
 * preview and Pages without a build-time substitution.
 */
export function pianoInstrumentUrl(base: string = import.meta.env.BASE_URL): string {
  return `${base.endsWith('/') ? base : `${base}/`}${BUNDLED_PIANO_PATH}`;
}

export interface PianoOptions {
  /** Override the bundled instrument (a test double, or a user's own file). */
  instrumentUrl?: string;
  /** 0..127, smplr's own scale. */
  volume?: number;
  destination?: AudioNode;
  onLoadProgress?: (loaded: number, total: number) => void;
}

export interface PianoNote {
  midi: number;
  /** 0..127. Note-On velocity straight off the wire. */
  velocity?: number;
  /** AudioContext time in seconds; omit to play now. */
  timeSec?: number;
  /** Seconds; omit to sustain until `stop()`. */
  durationSec?: number;
}

/** A C major triad — the smoke test the MIDI screen's "Test sound" plays. */
export const C_MAJOR_CHORD = [60, 64, 67] as const;

export class Piano {
  private instrument: ReturnType<typeof Soundfont> | null = null;
  private loading: Promise<void> | null = null;
  private status: PianoState = 'idle';
  private lastError: Error | null = null;

  constructor(
    private readonly context: BaseAudioContext,
    private readonly options: PianoOptions = {},
  ) {}

  get state(): PianoState {
    return this.status;
  }

  get error(): Error | null {
    return this.lastError;
  }

  /**
   * Fetches and decodes the samples. Idempotent and concurrency-safe: several
   * screens can call it on mount and they all await the same load.
   */
  load(): Promise<void> {
    if (this.loading) return this.loading;
    this.status = 'loading';
    const instrument = Soundfont(this.context, {
      instrumentUrl: this.options.instrumentUrl ?? pianoInstrumentUrl(),
      ...(this.options.volume === undefined ? {} : { volume: this.options.volume }),
      ...(this.options.destination === undefined
        ? {}
        : { destination: this.options.destination }),
      ...(this.options.onLoadProgress === undefined
        ? {}
        : {
            onLoadProgress: (p: { loaded: number; total: number }) =>
              this.options.onLoadProgress?.(p.loaded, p.total),
          }),
    });
    this.instrument = instrument;
    this.loading = instrument.ready
      .then(() => {
        this.status = 'ready';
      })
      .catch((cause: unknown) => {
        this.status = 'error';
        this.lastError = cause instanceof Error ? cause : new Error(String(cause));
        // Re-thrown so callers can show the failure; `load()` can be retried
        // by constructing a new Piano.
        throw this.lastError;
      });
    return this.loading;
  }

  /**
   * Starts a note. Returns a stop function, or a no-op when the samples are
   * not loaded yet — a missed note is better than an exception in a MIDI
   * handler, which would tear down the whole input path.
   */
  start(note: PianoNote): () => void {
    if (!this.instrument || this.status !== 'ready') return () => {};
    const stop = this.instrument.start({
      note: note.midi,
      velocity: note.velocity ?? 100,
      ...(note.timeSec === undefined ? {} : { time: note.timeSec }),
      ...(note.durationSec === undefined ? {} : { duration: note.durationSec }),
    });
    return () => stop();
  }

  /** Stops one note, or every sounding note when `midi` is omitted. */
  stop(midi?: number): void {
    if (!this.instrument) return;
    if (midi === undefined) this.instrument.stop();
    else this.instrument.stop(midi);
  }

  /** Sustain pedal (CC64). Values ≥ 64 hold, as on real hardware. */
  setSustain(value: number): void {
    this.instrument?.setCC(64, value);
  }

  /** 0..127. */
  setVolume(volume: number): void {
    if (this.instrument) this.instrument.output.volume = volume;
  }

  /** Convenience for the "Test sound" button: a C major triad. */
  playChord(midis: readonly number[] = C_MAJOR_CHORD, durationSec = 1.5): void {
    for (const midi of midis) this.start({ midi, velocity: 90, durationSec });
  }

  dispose(): void {
    this.instrument?.dispose();
    this.instrument = null;
    this.loading = null;
    this.status = 'idle';
  }
}
