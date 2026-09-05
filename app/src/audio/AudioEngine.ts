// The single AudioContext for the whole app.
//
// Android's autoplay policy means a context created outside a user gesture
// starts `suspended` and stays there; the first tap is the only chance to get
// it running, and every later `resume()` from a timer is silently ignored. So:
// one shared context, created lazily on the first gesture, and every audio
// consumer (Piano, Metronome, later the mic detector) asks this module for it
// rather than constructing its own — which would also cost a hardware audio
// stream each and add latency on the phone.

type AudioContextCtor = new (options?: AudioContextOptions) => AudioContext;

export type AudioEngineState = 'unsupported' | 'uninitialised' | 'suspended' | 'running';

function findAudioContextCtor(): AudioContextCtor | null {
  if (typeof globalThis === 'undefined') return null;
  const g = globalThis as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return g.AudioContext ?? g.webkitAudioContext ?? null;
}

export interface AudioEngineOptions {
  /** Injection point for unit tests; defaults to the platform AudioContext. */
  contextFactory?: (() => AudioContext) | null;
  /**
   * "interactive" asks the platform for the smallest buffer it will give us.
   * The MIDI-in-to-sound path is budgeted at < 30 ms (docs/01 §6) and the
   * output buffer is most of that.
   */
  latencyHint?: AudioContextLatencyCategory;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly factory: (() => AudioContext) | null;
  private readonly listeners = new Set<(s: AudioEngineState) => void>();
  private gestureCleanup: (() => void) | null = null;
  private volume = 1;

  constructor(options: AudioEngineOptions = {}) {
    if (options.contextFactory !== undefined) {
      this.factory = options.contextFactory;
    } else {
      const Ctor = findAudioContextCtor();
      this.factory = Ctor
        ? () => new Ctor({ latencyHint: options.latencyHint ?? 'interactive' })
        : null;
    }
  }

  get supported(): boolean {
    return this.factory !== null;
  }

  get state(): AudioEngineState {
    if (!this.factory) return 'unsupported';
    if (!this.context) return 'uninitialised';
    return this.context.state === 'running' ? 'running' : 'suspended';
  }

  /** The context, or null before the first gesture. Never creates one. */
  get contextOrNull(): AudioContext | null {
    return this.context;
  }

  /** Master gain every instrument connects to; null before the first gesture. */
  get masterGain(): GainNode | null {
    return this.master;
  }

  /**
   * Creates the context if needed and resumes it. MUST be called from a user
   * gesture handler (a tap, a key press) — that is the whole point of this
   * module. Safe to call repeatedly; later calls just resume.
   */
  async ensureStarted(): Promise<AudioContext> {
    if (!this.factory) throw new Error('The Web Audio API is not available in this browser.');
    if (!this.context) {
      this.context = this.factory();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
    }
    if (this.context.state !== 'running') {
      await this.context.resume();
    }
    this.emit();
    return this.context;
  }

  /**
   * Arms a one-shot listener that starts audio on the next interaction
   * anywhere in the app, so the first note the learner plays is not the one
   * that gets swallowed while the context spins up. Returns a disposer.
   */
  startOnFirstGesture(target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>): () => void {
    this.gestureCleanup?.();
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    const handler = () => {
      void this.ensureStarted().catch(() => {
        // Nothing to do: the UI's own "enable sound" affordance still works.
      });
      cleanup();
    };
    const cleanup = () => {
      for (const e of events) target.removeEventListener(e, handler);
      this.gestureCleanup = null;
    };
    for (const e of events) target.addEventListener(e, handler, { once: false });
    this.gestureCleanup = cleanup;
    return cleanup;
  }

  /** 0..1, applied to everything routed through `masterGain`. */
  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.master) this.master.gain.value = this.volume;
  }

  get currentVolume(): number {
    return this.volume;
  }

  /** Seconds on the AudioContext clock — the timeline all scheduling uses. */
  get now(): number {
    return this.context?.currentTime ?? 0;
  }

  onStateChange(cb: (s: AudioEngineState) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async close(): Promise<void> {
    this.gestureCleanup?.();
    const ctx = this.context;
    this.context = null;
    this.master = null;
    if (ctx) await ctx.close();
    this.emit();
  }

  private emit(): void {
    const s = this.state;
    for (const l of this.listeners) l(s);
  }
}

/** The app-wide instance. Tests construct their own `AudioEngine` instead. */
export const audioEngine = new AudioEngine();
