// Pure MIDI 1.0 message parser.
//
// No DOM, no timers, no state: bytes in, one parsed message out. Everything
// that needs to understand the wire format (WebMidiSource, ReplaySource, the
// diagnostics screen's parsed view) goes through here, so the byte-level edge
// cases are tested once. Behaviour is specified in docs/05-score-follow-engine.md §9.
//
// Running status (a device omitting the status byte on repeated messages) is
// resolved by the browser before `midimessage` fires, so this parser only ever
// sees complete messages and treats a leading data byte as malformed.

import type { MidiMessageEvent } from './types';

/**
 * Finer-grained classification than `MidiMessageEvent['kind']`, used by the
 * diagnostics screen and by the rate-limiting in WebMidiSource.
 */
export type MidiMessageDetail =
  | 'noteOn'
  | 'noteOff'
  | 'noteOnZeroVelocity'
  | 'sustain'
  | 'sostenuto'
  | 'softPedal'
  | 'channelVolume'
  | 'allSoundOff'
  | 'resetAllControllers'
  | 'allNotesOff'
  | 'controlChange'
  | 'programChange'
  | 'polyAftertouch'
  | 'channelPressure'
  | 'pitchBend'
  | 'clock'
  | 'activeSensing'
  | 'systemRealtime'
  | 'systemCommon'
  | 'sysex'
  | 'malformed';

export interface ParsedMidiMessage extends MidiMessageEvent {
  detail: MidiMessageDetail;
  /**
   * MIDI channel as humans number it: **1..16** (the wire nibble plus one).
   * Absent for system messages and malformed input.
   */
  channel?: number;
  /**
   * True for MIDI clock (0xF8) and active sensing (0xFE). Some devices send
   * active sensing every ~300 ms, so callers MUST NOT append these to the
   * diagnostics log; count them instead (docs/05 §9).
   */
  highRate: boolean;
  /** 14-bit value for pitch bend (0..16383, 8192 = centre). */
  bend?: number;
}

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;
const POLY_AFTERTOUCH = 0xa0;
const CONTROL_CHANGE = 0xb0;
const PROGRAM_CHANGE = 0xc0;
const CHANNEL_PRESSURE = 0xd0;
const PITCH_BEND = 0xe0;

export const CC_CHANNEL_VOLUME = 7;
export const CC_SUSTAIN = 64;
export const CC_SOSTENUTO = 66;
export const CC_SOFT_PEDAL = 67;
export const CC_ALL_SOUND_OFF = 120;
export const CC_RESET_ALL_CONTROLLERS = 121;
export const CC_ALL_NOTES_OFF = 123;

function ccDetail(cc: number): MidiMessageDetail {
  switch (cc) {
    case CC_CHANNEL_VOLUME:
      return 'channelVolume';
    case CC_SUSTAIN:
      return 'sustain';
    case CC_SOSTENUTO:
      return 'sostenuto';
    case CC_SOFT_PEDAL:
      return 'softPedal';
    case CC_ALL_SOUND_OFF:
      return 'allSoundOff';
    case CC_RESET_ALL_CONTROLLERS:
      return 'resetAllControllers';
    case CC_ALL_NOTES_OFF:
      return 'allNotesOff';
    default:
      return 'controlChange';
  }
}

function toBytes(input: Uint8Array | readonly number[]): Uint8Array {
  return input instanceof Uint8Array ? input : Uint8Array.from(input);
}

function malformed(raw: Uint8Array, tMs: number): ParsedMidiMessage {
  return { kind: 'other', detail: 'malformed', tMs, raw, highRate: false };
}

/** A data byte is valid only with its high bit clear. */
function isData(byte: number | undefined): byte is number {
  return byte !== undefined && byte >= 0x00 && byte <= 0x7f;
}

/**
 * Parses one MIDI message.
 *
 * Lenient about trailing bytes: the Web MIDI spec delivers exactly one message
 * per event, but cheap USB-MIDI cables have been seen to concatenate, and
 * dropping the leading message because of junk after it would lose real notes.
 * Strict about everything else — a leading data byte, a missing data byte, or
 * a data byte with its high bit set all yield `detail: 'malformed'` rather
 * than a plausible-looking wrong note.
 *
 * @param input raw bytes (a `Uint8Array` from `MIDIMessageEvent.data`, or a
 *   plain array from a replay script).
 * @param tMs timestamp in `performance.now()` milliseconds — for Web MIDI pass
 *   `event.timeStamp`, never `performance.now()` read inside the handler.
 */
export function parseMidiMessage(
  input: Uint8Array | readonly number[] | null | undefined,
  tMs: number,
): ParsedMidiMessage {
  const raw = input ? toBytes(input) : new Uint8Array(0);
  const status = raw[0];
  if (status === undefined || status < 0x80) return malformed(raw, tMs);

  // System messages: 0xF0..0xFF, no channel nibble.
  if (status >= 0xf0) {
    if (status === 0xf8) {
      return { kind: 'other', detail: 'clock', tMs, raw, highRate: true };
    }
    if (status === 0xfe) {
      return { kind: 'other', detail: 'activeSensing', tMs, raw, highRate: true };
    }
    if (status === 0xf0) {
      return { kind: 'other', detail: 'sysex', tMs, raw, highRate: false };
    }
    // 0xF9/0xFA/0xFB/0xFC/0xFF are realtime; 0xF1..0xF7 are system common.
    const detail: MidiMessageDetail = status >= 0xf8 ? 'systemRealtime' : 'systemCommon';
    return { kind: 'other', detail, tMs, raw, highRate: false };
  }

  const channel = (status & 0x0f) + 1;
  const type = status & 0xf0;
  const d1 = raw[1];
  const d2 = raw[2];

  switch (type) {
    case NOTE_OFF: {
      if (!isData(d1) || !isData(d2)) return malformed(raw, tMs);
      return {
        kind: 'noteOff',
        detail: 'noteOff',
        midi: d1,
        velocity: d2,
        channel,
        tMs,
        raw,
        highRate: false,
      };
    }
    case NOTE_ON: {
      if (!isData(d1) || !isData(d2)) return malformed(raw, tMs);
      // Note-On with velocity 0 is a Note-Off. Almost every keyboard uses it
      // (it lets running status cover a whole passage), the HP-130 included.
      const isOff = d2 === 0;
      return {
        kind: isOff ? 'noteOff' : 'noteOn',
        detail: isOff ? 'noteOnZeroVelocity' : 'noteOn',
        midi: d1,
        velocity: d2,
        channel,
        tMs,
        raw,
        highRate: false,
      };
    }
    case CONTROL_CHANGE: {
      if (!isData(d1) || !isData(d2)) return malformed(raw, tMs);
      return {
        kind: 'cc',
        detail: ccDetail(d1),
        cc: d1,
        value: d2,
        channel,
        tMs,
        raw,
        highRate: false,
      };
    }
    case POLY_AFTERTOUCH: {
      if (!isData(d1) || !isData(d2)) return malformed(raw, tMs);
      return {
        kind: 'other',
        detail: 'polyAftertouch',
        midi: d1,
        value: d2,
        channel,
        tMs,
        raw,
        highRate: false,
      };
    }
    case PITCH_BEND: {
      if (!isData(d1) || !isData(d2)) return malformed(raw, tMs);
      return {
        kind: 'other',
        detail: 'pitchBend',
        bend: (d2 << 7) | d1,
        channel,
        tMs,
        raw,
        highRate: false,
      };
    }
    case PROGRAM_CHANGE: {
      if (!isData(d1)) return malformed(raw, tMs);
      return {
        kind: 'other',
        detail: 'programChange',
        value: d1,
        channel,
        tMs,
        raw,
        highRate: false,
      };
    }
    case CHANNEL_PRESSURE: {
      if (!isData(d1)) return malformed(raw, tMs);
      return {
        kind: 'other',
        detail: 'channelPressure',
        value: d1,
        channel,
        tMs,
        raw,
        highRate: false,
      };
    }
    default:
      return malformed(raw, tMs);
  }
}

/** `[0x90, 60, 100]` -> `"90 3C 64"`, for the diagnostics raw log. */
export function formatHex(bytes: Uint8Array | readonly number[]): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** MIDI 60 -> "C4" (scientific pitch notation, middle C = C4). */
export function midiToNoteName(midi: number): string {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

/** Inverse of {@link midiToNoteName}; returns undefined for unparseable input. */
export function noteNameToMidi(name: string): number | undefined {
  const m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(name.trim());
  if (!m) return undefined;
  const [, letter = '', accidentalText = '', octaveText = '0'] = m;
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[letter.toLowerCase()];
  if (base === undefined) return undefined;
  const accidental = accidentalText === '#' ? 1 : accidentalText === 'b' ? -1 : 0;
  return (Number(octaveText) + 1) * 12 + base + accidental;
}

/** Builds a Note-On message. `channel` is 1..16. */
export function noteOnBytes(midi: number, velocity = 100, channel = 1): Uint8Array {
  return Uint8Array.from([NOTE_ON | ((channel - 1) & 0x0f), midi & 0x7f, velocity & 0x7f]);
}

/** Builds a Note-Off message. `channel` is 1..16. */
export function noteOffBytes(midi: number, velocity = 0, channel = 1): Uint8Array {
  return Uint8Array.from([NOTE_OFF | ((channel - 1) & 0x0f), midi & 0x7f, velocity & 0x7f]);
}

/** Builds a Control Change message. `channel` is 1..16. */
export function ccBytes(cc: number, value: number, channel = 1): Uint8Array {
  return Uint8Array.from([CONTROL_CHANGE | ((channel - 1) & 0x0f), cc & 0x7f, value & 0x7f]);
}
