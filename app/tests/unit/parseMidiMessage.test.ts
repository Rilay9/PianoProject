import { describe, expect, it } from 'vitest';
import {
  CC_ALL_NOTES_OFF,
  CC_SOFT_PEDAL,
  CC_SOSTENUTO,
  CC_SUSTAIN,
  ccBytes,
  formatHex,
  midiToNoteName,
  noteNameToMidi,
  noteOffBytes,
  noteOnBytes,
  parseMidiMessage,
} from '../../src/midi/parseMidiMessage';

describe('parseMidiMessage — note messages', () => {
  it('parses a Note-On', () => {
    const m = parseMidiMessage([0x90, 60, 100], 1234.5);
    expect(m.kind).toBe('noteOn');
    expect(m.detail).toBe('noteOn');
    expect(m.midi).toBe(60);
    expect(m.velocity).toBe(100);
    expect(m.channel).toBe(1);
    expect(m.tMs).toBe(1234.5);
    expect(m.highRate).toBe(false);
  });

  it('parses an explicit Note-Off and keeps the release velocity', () => {
    const m = parseMidiMessage([0x80, 60, 64], 10);
    expect(m.kind).toBe('noteOff');
    expect(m.detail).toBe('noteOff');
    expect(m.midi).toBe(60);
    expect(m.velocity).toBe(64);
  });

  it('treats Note-On with velocity 0 as a Note-Off but records why', () => {
    const m = parseMidiMessage([0x90, 60, 0], 10);
    expect(m.kind).toBe('noteOff');
    expect(m.detail).toBe('noteOnZeroVelocity');
    expect(m.midi).toBe(60);
    expect(m.velocity).toBe(0);
  });

  it('handles the full 88-key range and velocity 1 (softest real key press)', () => {
    expect(parseMidiMessage([0x90, 21, 1], 0)).toMatchObject({ kind: 'noteOn', midi: 21 });
    expect(parseMidiMessage([0x90, 108, 127], 0)).toMatchObject({ kind: 'noteOn', midi: 108 });
  });

  it('extracts the channel from the status nibble as 1..16', () => {
    expect(parseMidiMessage([0x90, 60, 100], 0).channel).toBe(1);
    expect(parseMidiMessage([0x93, 60, 100], 0).channel).toBe(4);
    expect(parseMidiMessage([0x9f, 60, 100], 0).channel).toBe(16);
    expect(parseMidiMessage([0x8a, 60, 0], 0).channel).toBe(11);
  });
});

describe('parseMidiMessage — control changes', () => {
  it('names the pedals the HP-130 can send', () => {
    expect(parseMidiMessage([0xb0, CC_SUSTAIN, 127], 0)).toMatchObject({
      kind: 'cc',
      detail: 'sustain',
      cc: 64,
      value: 127,
      channel: 1,
    });
    expect(parseMidiMessage([0xb0, CC_SOSTENUTO, 0], 0)).toMatchObject({
      kind: 'cc',
      detail: 'sostenuto',
      cc: 66,
      value: 0,
    });
    expect(parseMidiMessage([0xb0, CC_SOFT_PEDAL, 90], 0)).toMatchObject({
      kind: 'cc',
      detail: 'softPedal',
      cc: 67,
      value: 90,
    });
  });

  it('flags All Notes Off (CC123) distinctly from an ordinary CC', () => {
    expect(parseMidiMessage([0xb2, CC_ALL_NOTES_OFF, 0], 0)).toMatchObject({
      kind: 'cc',
      detail: 'allNotesOff',
      cc: 123,
      channel: 3,
    });
    expect(parseMidiMessage([0xb0, 1, 64], 0)).toMatchObject({
      kind: 'cc',
      detail: 'controlChange',
      cc: 1,
    });
  });

  it('names CC120 All Sound Off and CC121 Reset All Controllers', () => {
    expect(parseMidiMessage([0xb0, 120, 0], 0).detail).toBe('allSoundOff');
    expect(parseMidiMessage([0xb0, 121, 0], 0).detail).toBe('resetAllControllers');
    expect(parseMidiMessage([0xb0, 7, 100], 0).detail).toBe('channelVolume');
  });
});

describe('parseMidiMessage — messages we ignore', () => {
  it('marks clock and active sensing as high-rate so they are never logged', () => {
    const clock = parseMidiMessage([0xf8], 0);
    expect(clock).toMatchObject({ kind: 'other', detail: 'clock', highRate: true });
    const sensing = parseMidiMessage([0xfe], 0);
    expect(sensing).toMatchObject({ kind: 'other', detail: 'activeSensing', highRate: true });
  });

  it('does not mark other realtime/system messages as high-rate', () => {
    expect(parseMidiMessage([0xfa], 0)).toMatchObject({
      detail: 'systemRealtime',
      highRate: false,
    });
    expect(parseMidiMessage([0xfc], 0)).toMatchObject({ detail: 'systemRealtime' });
    expect(parseMidiMessage([0xff], 0)).toMatchObject({ detail: 'systemRealtime' });
    expect(parseMidiMessage([0xf1, 0x00], 0)).toMatchObject({ detail: 'systemCommon' });
    expect(parseMidiMessage([0xf0, 0x7e, 0xf7], 0)).toMatchObject({ detail: 'sysex' });
  });

  it('classifies aftertouch, pitch bend and program change without a note', () => {
    expect(parseMidiMessage([0xa0, 60, 40], 0)).toMatchObject({
      kind: 'other',
      detail: 'polyAftertouch',
      midi: 60,
      value: 40,
    });
    expect(parseMidiMessage([0xd0, 40], 0)).toMatchObject({
      kind: 'other',
      detail: 'channelPressure',
      value: 40,
    });
    expect(parseMidiMessage([0xe0, 0x00, 0x40], 0)).toMatchObject({
      kind: 'other',
      detail: 'pitchBend',
      bend: 8192,
    });
    expect(parseMidiMessage([0xc0, 0], 0)).toMatchObject({
      kind: 'other',
      detail: 'programChange',
      value: 0,
    });
  });
});

describe('parseMidiMessage — malformed input', () => {
  it.each([
    ['empty', []],
    ['leading data byte (running status is resolved by the browser)', [60, 100]],
    ['truncated Note-On', [0x90, 60]],
    ['Note-On with no data at all', [0x90]],
    ['data byte with the high bit set', [0x90, 0x90, 100]],
    ['second data byte with the high bit set', [0x90, 60, 0x80]],
    ['truncated program change', [0xc0]],
  ])('reports %s as malformed', (_label, bytes) => {
    const m = parseMidiMessage(bytes, 5);
    expect(m.kind).toBe('other');
    expect(m.detail).toBe('malformed');
    expect(m.tMs).toBe(5);
  });

  it('reports null/undefined input as malformed rather than throwing', () => {
    expect(parseMidiMessage(null, 0).detail).toBe('malformed');
    expect(parseMidiMessage(undefined, 0).detail).toBe('malformed');
  });

  it('keeps the leading message when a cable concatenates two of them', () => {
    // Web MIDI delivers one message per event, but cheap interfaces have been
    // seen to pack more; losing the first note would be worse than ignoring
    // the tail, so the parser is lenient here.
    const m = parseMidiMessage([0x90, 60, 100, 0x90, 64, 100], 0);
    expect(m).toMatchObject({ kind: 'noteOn', midi: 60, velocity: 100 });
  });

  it('accepts a Uint8Array as well as a plain array and preserves raw bytes', () => {
    const m = parseMidiMessage(new Uint8Array([0x90, 60, 100]), 0);
    expect(m.kind).toBe('noteOn');
    expect(Array.from(m.raw)).toEqual([0x90, 60, 100]);
  });
});

describe('helpers', () => {
  it('formats bytes as upper-case hex pairs', () => {
    expect(formatHex([0x90, 0x3c, 0x64])).toBe('90 3C 64');
    expect(formatHex(new Uint8Array([0x00, 0x0f]))).toBe('00 0F');
  });

  it('round-trips note names', () => {
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(21)).toBe('A0');
    expect(midiToNoteName(108)).toBe('C8');
    expect(midiToNoteName(61)).toBe('C#4');
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('A0')).toBe(21);
    expect(noteNameToMidi('Db4')).toBe(61);
    expect(noteNameToMidi('nonsense')).toBeUndefined();
  });

  it('builds messages that its own parser reads back', () => {
    expect(parseMidiMessage(noteOnBytes(60, 100, 3), 0)).toMatchObject({
      kind: 'noteOn',
      midi: 60,
      velocity: 100,
      channel: 3,
    });
    expect(parseMidiMessage(noteOffBytes(60, 0, 3), 0)).toMatchObject({
      kind: 'noteOff',
      midi: 60,
      channel: 3,
    });
    expect(parseMidiMessage(ccBytes(64, 127, 2), 0)).toMatchObject({
      kind: 'cc',
      cc: 64,
      value: 127,
      channel: 2,
    });
  });
});
