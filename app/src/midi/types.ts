// Input-source contracts.
//
// These are the interfaces from docs/01-architecture.md §4.3. Everything that
// can produce notes for the practice engine (real MIDI hardware, the on-screen
// keyboard, a recorded replay script, and later the microphone) implements
// `InputSource`, so the engine and the UI never depend on hardware being
// present.
//
// One deliberate refinement of the doc: `MidiSourceState` *extends*
// `InputSourceState` (it gains `detail` alongside `inputs`/`outputs`). The doc
// declares `MidiSource extends InputSource` while also narrowing
// `onStateChange`'s payload; without the `extends` the two `onStateChange`
// signatures are mutually unassignable and TypeScript rejects the interface.
// Widening the MIDI state is source-compatible with every doc example and
// gives the UI one human-readable string to show in both cases.

export type InputSourceKind = 'midi' | 'mic' | 'screen' | 'replay';

/** A note event as the practice engine consumes it. */
export interface InputNoteEvent {
  kind: 'noteOn' | 'noteOff';
  /** MIDI note number, 21..108 for an 88-key piano. */
  midi: number;
  /** 0..127. Note-Off carries the release velocity (0 when unknown). */
  velocity: number;
  /**
   * Milliseconds on the same timeline as `performance.now()`. For Web MIDI
   * this is `event.timeStamp`, which is measured when the message arrived
   * rather than when JS got round to handling it (docs/05 §9).
   */
  tMs: number;
  /** 1.0 for anything deterministic; the microphone source reports less. */
  confidence: number;
  source: InputSourceKind;
}

export interface InputSourceState {
  connected: boolean;
  /** Human-readable, shown in the UI ("2 inputs", "permission denied", …). */
  detail: string;
}

export type Unsubscribe = () => void;

export interface InputSource {
  readonly kind: InputSourceKind;
  readonly name: string;
  /** May trigger a browser permission prompt; MUST be called from a gesture. */
  connect(): Promise<void>;
  disconnect(): void;
  onNote(cb: (e: InputNoteEvent) => void): Unsubscribe;
  onStateChange(cb: (s: InputSourceState) => void): Unsubscribe;
}

/**
 * The four message classes the app acts on. Anything else (aftertouch, pitch
 * bend, program change, system messages) arrives as `other` — `detail` on
 * `ParsedMidiMessage` says which, for the diagnostics screen.
 */
export type MidiMessageKind = 'noteOn' | 'noteOff' | 'cc' | 'other';

export interface MidiMessageEvent {
  kind: MidiMessageKind;
  midi?: number;
  velocity?: number;
  cc?: number;
  value?: number;
  tMs: number;
  raw: Uint8Array;
}

export interface MidiSourceState extends InputSourceState {
  inputs: string[];
  outputs: string[];
}

export interface MidiSource extends InputSource {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): void;
  onMessage(cb: (m: MidiMessageEvent) => void): Unsubscribe;
  onStateChange(cb: (s: MidiSourceState) => void): Unsubscribe;
  /** Present when the browser exposed at least one MIDI output port. */
  send?(bytes: Uint8Array): void;
}
