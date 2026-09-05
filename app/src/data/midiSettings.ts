// The handful of settings P1 needs to persist.
//
// Persisted through data/persist: the IndexedDB `settings` store of
// docs/01-architecture.md §4.5, mirrored to localStorage so the read stays
// synchronous. Callers MUST NOT read either store directly. See
// docs/decisions/2026-09-05-p1-midi-audio-choices.md §4.

import { persistLocal } from './persist';

const STORAGE_KEY = 'pianopath.midi';

export interface MidiSettings {
  /**
   * Port id to take notes from, or null for "every input". Ids are not stable
   * across re-plugs on all platforms, so an unknown id is treated as null
   * rather than as "no input" (docs/05 §9: never key settings on the device
   * name alone).
   */
  pinnedInputId: string | null;
  /** Measured by the diagnostics latency test; subtracted in Tempo mode. */
  inputLatencyMs: number;
  /** docs/04-ui-spec.md §7 "transpose input semitones". */
  transposeSemitones: number;
  /** 0..1. */
  metronomeVolume: number;
  /** 0..1. */
  pianoVolume: number;
}

export const DEFAULT_MIDI_SETTINGS: Readonly<MidiSettings> = {
  pinnedInputId: null,
  inputLatencyMs: 0,
  transposeSemitones: 0,
  metronomeVolume: 0.6,
  pianoVolume: 0.8,
};

function coerce(raw: unknown): MidiSettings {
  const out: MidiSettings = { ...DEFAULT_MIDI_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return out;
  const v = raw as Partial<Record<keyof MidiSettings, unknown>>;
  if (typeof v.pinnedInputId === 'string' || v.pinnedInputId === null) {
    out.pinnedInputId = v.pinnedInputId;
  }
  if (typeof v.inputLatencyMs === 'number' && Number.isFinite(v.inputLatencyMs)) {
    out.inputLatencyMs = v.inputLatencyMs;
  }
  if (typeof v.transposeSemitones === 'number' && Number.isInteger(v.transposeSemitones)) {
    out.transposeSemitones = v.transposeSemitones;
  }
  if (typeof v.metronomeVolume === 'number') out.metronomeVolume = clamp01(v.metronomeVolume);
  if (typeof v.pianoVolume === 'number') out.pianoVolume = clamp01(v.pianoVolume);
  return out;
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

function read(): MidiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return coerce(raw === null ? null : (JSON.parse(raw) as unknown));
  } catch {
    // Private browsing, blocked storage, or corrupt JSON — defaults are fine.
    return { ...DEFAULT_MIDI_SETTINGS };
  }
}

let current = read();
const listeners = new Set<(s: MidiSettings) => void>();

export function getMidiSettings(): Readonly<MidiSettings> {
  return current;
}

export function updateMidiSettings(patch: Partial<MidiSettings>): Readonly<MidiSettings> {
  current = coerce({ ...current, ...patch });
  persistLocal(STORAGE_KEY, JSON.stringify(current));
  for (const l of listeners) l(current);
  return current;
}

export function onMidiSettingsChange(cb: (s: MidiSettings) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Test hook: re-reads storage and drops listeners. */
export function resetMidiSettingsForTest(): void {
  current = read();
  listeners.clear();
}
