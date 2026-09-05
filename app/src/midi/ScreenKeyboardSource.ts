// The always-available input: taps on the on-screen keyboard strip.
//
// This is what the owner uses when the USB-MIDI cable is not cooperating, so
// it deliberately has no dependencies — no permissions, no hardware, no async
// work. `connect()` resolves immediately and the UI calls `noteOn`/`noteOff`
// from its pointer handlers (see ui/KeyboardStrip.ts).

import type { InputNoteEvent, InputSource, InputSourceState, Unsubscribe } from './types';

export interface ScreenKeyboardSourceOptions {
  /** Injectable for tests; defaults to `performance.now()`. */
  now?: () => number;
  name?: string;
}

export class ScreenKeyboardSource implements InputSource {
  readonly kind = 'screen' as const;
  readonly name: string;

  private readonly now: () => number;
  private readonly noteListeners = new Set<(e: InputNoteEvent) => void>();
  private readonly stateListeners = new Set<(s: InputSourceState) => void>();
  private readonly held = new Set<number>();
  private active = false;

  constructor(options: ScreenKeyboardSourceOptions = {}) {
    this.name = options.name ?? 'On-screen keyboard';
    this.now =
      options.now ??
      (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  }

  connect(): Promise<void> {
    this.active = true;
    this.emitState();
    return Promise.resolve();
  }

  disconnect(): void {
    this.releaseAll();
    this.active = false;
    this.emitState();
  }

  get connected(): boolean {
    return this.active;
  }

  onNote(cb: (e: InputNoteEvent) => void): Unsubscribe {
    this.noteListeners.add(cb);
    return () => this.noteListeners.delete(cb);
  }

  onStateChange(cb: (s: InputSourceState) => void): Unsubscribe {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  /**
   * A touch has begun on `midi`. Re-pressing an already-held key is ignored
   * rather than emitting a second Note-On, because a finger sliding across the
   * strip fires `pointerenter` repeatedly.
   */
  noteOn(midi: number, velocity = 90, tMs = this.now()): void {
    if (this.held.has(midi)) return;
    this.held.add(midi);
    this.emit({ kind: 'noteOn', midi, velocity, tMs, confidence: 1, source: 'screen' });
  }

  noteOff(midi: number, tMs = this.now()): void {
    if (!this.held.delete(midi)) return;
    this.emit({ kind: 'noteOff', midi, velocity: 0, tMs, confidence: 1, source: 'screen' });
  }

  /** Called on pointercancel / blur so a lifted finger never leaves a stuck key. */
  releaseAll(tMs = this.now()): void {
    for (const midi of [...this.held]) this.noteOff(midi, tMs);
  }

  get pressedNotes(): number[] {
    return [...this.held].sort((a, b) => a - b);
  }

  private emit(e: InputNoteEvent): void {
    for (const l of this.noteListeners) l(e);
  }

  private emitState(): void {
    const s: InputSourceState = {
      connected: this.active,
      detail: this.active ? 'On-screen keyboard active' : 'Off',
    };
    for (const l of this.stateListeners) l(s);
  }
}
