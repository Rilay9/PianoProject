// Deterministic playback of a recorded MIDI stream.
//
// Two jobs: driving tests and demos without hardware, and replaying a debug
// report the owner pasted back from the phone so a failure can be reproduced
// on a laptop. Scripts are plain JSON with **relative** milliseconds, so a
// recording is portable between machines and sessions.

import { parseMidiMessage, type ParsedMidiMessage } from './parseMidiMessage';
import type { InputNoteEvent, InputSource, InputSourceState, Unsubscribe } from './types';

export interface ReplayMessage {
  /** Milliseconds after `start()`, not an absolute timestamp. */
  atMs: number;
  /** Raw MIDI bytes, e.g. `[144, 60, 100]` for C4 Note-On. */
  bytes: number[];
}

export interface ReplayScript {
  name?: string;
  messages: ReplayMessage[];
}

export interface ReplaySourceOptions {
  /**
   * Timer injection. Tests pass a fake so a 30-second script runs instantly;
   * the default is `setTimeout`/`clearTimeout`.
   */
  schedule?: (fn: () => void, delayMs: number) => number;
  cancel?: (handle: number) => void;
  /** Clock for the base timestamp; defaults to `performance.now()`. */
  now?: () => number;
  /** Called after the last message has been delivered. */
  onFinished?: () => void;
}

/** Rejects anything that is not a well-formed script, with a usable message. */
export function parseReplayScript(json: unknown): ReplayScript {
  if (typeof json !== 'object' || json === null) {
    throw new TypeError('Replay script must be an object');
  }
  const obj = json as { name?: unknown; messages?: unknown };
  if (!Array.isArray(obj.messages)) {
    throw new TypeError('Replay script must have a "messages" array');
  }
  const messages: ReplayMessage[] = obj.messages.map((raw, i) => {
    const m = raw as { atMs?: unknown; bytes?: unknown };
    if (typeof m.atMs !== 'number' || !Number.isFinite(m.atMs)) {
      throw new TypeError(`messages[${i}].atMs must be a finite number`);
    }
    if (!Array.isArray(m.bytes) || m.bytes.some((b) => typeof b !== 'number')) {
      throw new TypeError(`messages[${i}].bytes must be an array of numbers`);
    }
    return { atMs: m.atMs, bytes: m.bytes as number[] };
  });
  // Sorted so a hand-written script does not have to be in order, and so the
  // scheduler can walk it linearly.
  messages.sort((a, b) => a.atMs - b.atMs);
  return { name: typeof obj.name === 'string' ? obj.name : undefined, messages };
}

export class ReplaySource implements InputSource {
  readonly kind = 'replay' as const;

  private readonly script: ReplayScript;
  private readonly schedule: (fn: () => void, delayMs: number) => number;
  private readonly cancel: (handle: number) => void;
  private readonly now: () => number;
  private readonly onFinished?: () => void;
  private readonly noteListeners = new Set<(e: InputNoteEvent) => void>();
  private readonly messageListeners = new Set<(m: ParsedMidiMessage) => void>();
  private readonly stateListeners = new Set<(s: InputSourceState) => void>();
  private handles: number[] = [];
  private running = false;

  constructor(script: ReplayScript, options: ReplaySourceOptions = {}) {
    this.script = parseReplayScript(script);
    this.schedule =
      options.schedule ?? ((fn, delayMs) => setTimeout(fn, delayMs));
    this.cancel = options.cancel ?? ((h) => clearTimeout(h));
    this.now =
      options.now ??
      (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.onFinished = options.onFinished;
  }

  get name(): string {
    return this.script.name ?? 'Replay';
  }

  get connected(): boolean {
    return this.running;
  }

  connect(): Promise<void> {
    this.disconnect();
    this.running = true;
    const base = this.now();
    this.script.messages.forEach((message, index) => {
      const isLast = index === this.script.messages.length - 1;
      const handle = this.schedule(() => {
        this.deliver(message, base + message.atMs);
        if (isLast) {
          this.running = false;
          this.emitState();
          this.onFinished?.();
        }
      }, message.atMs);
      this.handles.push(handle);
    });
    this.emitState();
    if (this.script.messages.length === 0) {
      this.running = false;
      this.emitState();
      this.onFinished?.();
    }
    return Promise.resolve();
  }

  disconnect(): void {
    for (const h of this.handles) this.cancel(h);
    this.handles = [];
    this.running = false;
    this.emitState();
  }

  onNote(cb: (e: InputNoteEvent) => void): Unsubscribe {
    this.noteListeners.add(cb);
    return () => this.noteListeners.delete(cb);
  }

  onMessage(cb: (m: ParsedMidiMessage) => void): Unsubscribe {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  onStateChange(cb: (s: InputSourceState) => void): Unsubscribe {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  private deliver(message: ReplayMessage, tMs: number): void {
    const parsed = parseMidiMessage(message.bytes, tMs);
    for (const l of this.messageListeners) l(parsed);
    if ((parsed.kind === 'noteOn' || parsed.kind === 'noteOff') && parsed.midi !== undefined) {
      const note: InputNoteEvent = {
        kind: parsed.kind,
        midi: parsed.midi,
        velocity: parsed.velocity ?? 0,
        tMs,
        confidence: 1,
        source: 'replay',
      };
      for (const l of this.noteListeners) l(note);
    }
  }

  private emitState(): void {
    const s: InputSourceState = {
      connected: this.running,
      detail: this.running ? `Replaying ${this.name}` : 'Idle',
    };
    for (const l of this.stateListeners) l(s);
  }
}
