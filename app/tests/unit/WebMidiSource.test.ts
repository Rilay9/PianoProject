import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MidiAccessError, WebMidiSource } from '../../src/midi/WebMidiSource';
import type { InputNoteEvent } from '../../src/midi/types';
import {
  asMidiAccess,
  FakeInput,
  FakeMidiAccess,
  FakeOutput,
} from './helpers/fakeMidiAccess';

function setup(configure?: (access: FakeMidiAccess) => void) {
  const access = new FakeMidiAccess();
  const piano = new FakeInput('in-1', 'USB MIDI Interface');
  access.inputs.set(piano.id, piano);
  configure?.(access);
  const requestAccess = vi.fn(() => Promise.resolve(asMidiAccess(access)));
  const source = new WebMidiSource({ requestAccess });
  const notes: InputNoteEvent[] = [];
  source.onNote((e) => notes.push(e));
  return { access, piano, source, notes, requestAccess };
}

describe('WebMidiSource — connecting', () => {
  it('requests access without SysEx and reports the inputs it found', async () => {
    const { source, requestAccess } = setup();
    await source.connect();
    expect(requestAccess).toHaveBeenCalledWith({ sysex: false });
    expect(source.connected).toBe(true);
    expect(source.inputs.map((i) => i.name)).toEqual(['USB MIDI Interface']);
    expect(source.state.detail).toBe('1 input');
  });

  it('throws code "unsupported" when the browser has no Web MIDI', async () => {
    const source = new WebMidiSource({ requestAccess: null });
    expect(source.supported).toBe(false);
    await expect(source.connect()).rejects.toMatchObject({ code: 'unsupported' });
    expect(source.error).toBeInstanceOf(MidiAccessError);
  });

  it.each(['SecurityError', 'NotAllowedError'])(
    'maps a %s rejection to code "permission-denied"',
    async (name) => {
      const err = new Error('denied');
      err.name = name;
      const source = new WebMidiSource({
        requestAccess: vi.fn(() => Promise.reject(err)),
      });
      await expect(source.connect()).rejects.toMatchObject({ code: 'permission-denied' });
      expect(source.state.detail).toBe('MIDI permission was denied.');
    },
  );

  it('maps any other rejection to code "failed"', async () => {
    const source = new WebMidiSource({
      requestAccess: vi.fn(() => Promise.reject(new Error('boom'))),
    });
    await expect(source.connect()).rejects.toMatchObject({ code: 'failed' });
  });

  it('reports "no MIDI inputs found" when access succeeds with zero ports', async () => {
    const access = new FakeMidiAccess();
    const source = new WebMidiSource({ requestAccess: () => Promise.resolve(asMidiAccess(access)) });
    await source.connect();
    expect(source.connected).toBe(false);
    expect(source.state.detail).toBe('Connected — no MIDI inputs found');
  });
});

describe('WebMidiSource — note events', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(async () => {
    ctx = setup();
    await ctx.source.connect();
  });

  it('emits noteOn/noteOff with the event timestamp, not the handler time', () => {
    ctx.piano.emit([0x90, 60, 100], 1000);
    ctx.piano.emit([0x80, 60, 0], 1400);
    expect(ctx.notes).toEqual([
      { kind: 'noteOn', midi: 60, velocity: 100, tMs: 1000, confidence: 1, source: 'midi' },
      { kind: 'noteOff', midi: 60, velocity: 0, tMs: 1400, confidence: 1, source: 'midi' },
    ]);
  });

  it('turns Note-On velocity 0 into a Note-Off', () => {
    ctx.piano.emit([0x90, 62, 90], 0);
    ctx.piano.emit([0x90, 62, 0], 100);
    expect(ctx.notes.map((n) => n.kind)).toEqual(['noteOn', 'noteOff']);
    expect(ctx.source.pressedNotes).toEqual([]);
  });

  it('releases every held note on All Notes Off (CC123)', () => {
    ctx.piano.emit([0x90, 60, 100], 0);
    ctx.piano.emit([0x90, 64, 100], 1);
    ctx.piano.emit([0x90, 67, 100], 2);
    expect(ctx.source.pressedNotes).toEqual([60, 64, 67]);
    ctx.notes.length = 0;
    ctx.piano.emit([0xb0, 123, 0], 10);
    expect(ctx.notes.map((n) => [n.kind, n.midi])).toEqual([
      ['noteOff', 60],
      ['noteOff', 64],
      ['noteOff', 67],
    ]);
    expect(ctx.source.pressedNotes).toEqual([]);
  });

  it('does not emit notes for pedals, aftertouch or malformed bytes', () => {
    ctx.piano.emit([0xb0, 64, 127], 0);
    ctx.piano.emit([0xa0, 60, 30], 1);
    ctx.piano.emit([0x90, 60], 2);
    expect(ctx.notes).toEqual([]);
  });

  it('forwards every parsed message, including CCs, to onMessage', () => {
    const messages: string[] = [];
    ctx.source.onMessage((m) => messages.push(m.kind));
    ctx.piano.emit([0x90, 60, 100], 0);
    ctx.piano.emit([0xb0, 64, 127], 1);
    ctx.piano.emit([0xa0, 60, 30], 2);
    expect(messages).toEqual(['noteOn', 'cc', 'other']);
  });
});

describe('WebMidiSource — multiple inputs and pinning', () => {
  it('listens to every input at once, even generic no-name ports', async () => {
    const ctx = setup((access) => {
      const second = new FakeInput('in-2', 'MIDI Device');
      access.inputs.set(second.id, second);
    });
    await ctx.source.connect();
    const second = ctx.access.inputs.get('in-2');
    if (!second) throw new Error('missing fixture input in-2');
    ctx.piano.emit([0x90, 60, 100], 0);
    second.emit([0x90, 72, 100], 1);
    expect(ctx.notes.map((n) => n.midi)).toEqual([60, 72]);
  });

  it('pinning one input restricts notes to it but keeps logging the others', async () => {
    const ctx = setup((access) => {
      const second = new FakeInput('in-2', 'MIDI Device');
      access.inputs.set(second.id, second);
    });
    await ctx.source.connect();
    const second = ctx.access.inputs.get('in-2');
    if (!second) throw new Error('missing fixture input in-2');
    ctx.source.pinInput('in-1');
    ctx.piano.emit([0x90, 60, 100], 0);
    second.emit([0x90, 72, 100], 1);
    expect(ctx.notes.map((n) => n.midi)).toEqual([60]);
    expect(ctx.source.logEntries.map((e) => e.inputId)).toEqual(['in-1', 'in-2']);
  });

  it('falls back to listening to everything when the pinned id is gone', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.source.pinInput('in-does-not-exist');
    expect(ctx.source.effectiveInputId).toBeNull();
    ctx.piano.emit([0x90, 60, 100], 0);
    expect(ctx.notes.map((n) => n.midi)).toEqual([60]);
  });
});

describe('WebMidiSource — hot plug', () => {
  it('subscribes to an input that appears after connect()', async () => {
    const ctx = setup();
    await ctx.source.connect();
    const late = ctx.access.addInput(new FakeInput('in-late', 'Roland UM-ONE'));
    late.emit([0x90, 65, 100], 0);
    expect(ctx.notes.map((n) => n.midi)).toEqual([65]);
    expect(ctx.source.inputs.map((i) => i.id)).toEqual(['in-1', 'in-late']);
  });

  it('does not double-subscribe an input across repeated statechanges', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.access.addInput(new FakeInput('in-2', 'Second'));
    ctx.access.removeInput('in-2');
    ctx.access.addInput(new FakeInput('in-3', 'Third'));
    ctx.piano.emit([0x90, 60, 100], 0);
    expect(ctx.notes).toHaveLength(1);
  });

  it('drops the handler for an input that disappears', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.access.removeInput('in-1');
    expect(ctx.piano.onmidimessage).toBeNull();
    expect(ctx.source.connected).toBe(false);
  });

  it('notifies state listeners on plug and unplug', async () => {
    const ctx = setup();
    const states: string[] = [];
    ctx.source.onStateChange((s) => states.push(s.detail));
    await ctx.source.connect();
    ctx.access.addInput(new FakeInput('in-2', 'Second'));
    ctx.access.removeInput('in-2');
    expect(states).toEqual(['1 input', '2 inputs', '1 input']);
  });
});

describe('WebMidiSource — diagnostics log', () => {
  it('records raw bytes, hex and the parsed message', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.piano.emit([0x90, 60, 100], 1234.5);
    const entry = ctx.source.logEntries[0];
    expect(entry).toBeDefined();
    expect(entry).toMatchObject({
      seq: 1,
      tMs: 1234.5,
      inputId: 'in-1',
      inputName: 'USB MIDI Interface',
      bytes: [0x90, 60, 100],
      hex: '90 3C 64',
    });
    expect(entry?.parsed.kind).toBe('noteOn');
  });

  it('counts clock and active sensing instead of logging them at full rate', async () => {
    const ctx = setup();
    await ctx.source.connect();
    for (let i = 0; i < 400; i += 1) ctx.piano.emit([0xfe], i);
    for (let i = 0; i < 50; i += 1) ctx.piano.emit([0xf8], i);
    ctx.piano.emit([0x90, 60, 100], 500);
    expect(ctx.source.logEntries).toHaveLength(1);
    expect(ctx.source.logEntries[0]?.parsed.kind).toBe('noteOn');
    expect(ctx.source.highRateCounters).toMatchObject({
      activeSensing: 400,
      clock: 50,
      lastTMs: 49,
    });
  });

  it('keeps only the most recent 500 messages', async () => {
    const ctx = setup();
    await ctx.source.connect();
    for (let i = 0; i < 620; i += 1) ctx.piano.emit([0x90, 60, 100], i);
    const entries = ctx.source.logEntries;
    expect(entries).toHaveLength(500);
    expect(entries[0]?.seq).toBe(121);
    expect(entries[entries.length - 1]?.seq).toBe(620);
  });

  it('clearLog() resets entries and counters', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.piano.emit([0x90, 60, 100], 0);
    ctx.piano.emit([0xfe], 1);
    ctx.source.clearLog();
    expect(ctx.source.logEntries).toEqual([]);
    expect(ctx.source.highRateCounters.activeSensing).toBe(0);
  });
});

describe('WebMidiSource — output', () => {
  it('sends to the selected output and can panic with CC120/CC123', async () => {
    const ctx = setup((access) => {
      access.outputs.set('out-1', new FakeOutput('out-1', 'USB MIDI Interface'));
    });
    await ctx.source.connect();
    expect(ctx.source.outputs.map((o) => o.name)).toEqual(['USB MIDI Interface']);
    ctx.source.send(Uint8Array.from([0x90, 60, 100]));
    ctx.source.sendAllNotesOff();
    const out = ctx.access.outputs.get('out-1');
    if (!out) throw new Error('missing fixture output out-1');
    expect(out.sent).toEqual([
      [0x90, 60, 100],
      [0xb0, 120, 0],
      [0xb0, 123, 0],
    ]);
  });

  it('is a no-op when there is no output port', async () => {
    const ctx = setup();
    await ctx.source.connect();
    expect(() => ctx.source.send(Uint8Array.from([0x90, 60, 100]))).not.toThrow();
  });
});

describe('WebMidiSource — disconnect', () => {
  it('detaches handlers so no further notes arrive', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.source.disconnect();
    ctx.piano.emit([0x90, 60, 100], 0);
    expect(ctx.notes).toEqual([]);
    expect(ctx.source.connected).toBe(false);
    expect(ctx.access.onstatechange).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The unplug the device actually performs.
//
// Every test above models an unplug as `removeInput` — the entry deleted from
// `access.inputs`. The Web MIDI API does not do that: the `MIDIPort` stays in
// the map with `state: 'disconnected'`, so a page can recognise the same
// device when it returns, and the browser closes the port. These drive
// `disconnectInput`/`reconnectInput` instead, which is the branch the owner's
// HP-130 and its OTG cable take and which nothing in the suite reached.
// ---------------------------------------------------------------------------

describe('WebMidiSource — the cable, pulled and put back', () => {
  it('stops reporting a port that the device has left, without it being removed', async () => {
    const ctx = setup();
    await ctx.source.connect();
    expect(ctx.source.connected).toBe(true);

    ctx.access.disconnectInput('in-1');

    // The entry is still there — that is the point.
    expect(ctx.access.inputs.size).toBe(1);
    expect(ctx.source.connected).toBe(false);
    expect(ctx.source.inputs).toEqual([]);
    expect(ctx.source.state.detail).toBe('MIDI input unplugged — plug the cable back in');
    // Diagnostics still needs to be able to say "it is listed but gone".
    expect(ctx.source.knownInputs.map((i) => [i.id, i.state])).toEqual([
      ['in-1', 'disconnected'],
    ]);
  });

  it('releases a key that was held when the cable went', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.piano.emit([0x90, 60, 100], 0);
    ctx.piano.emit([0x90, 64, 100], 1);
    expect(ctx.source.pressedNotes).toEqual([60, 64]);
    ctx.notes.length = 0;

    ctx.access.disconnectInput('in-1');

    expect(ctx.notes.map((n) => [n.kind, n.midi])).toEqual([
      ['noteOff', 60],
      ['noteOff', 64],
    ]);
    expect(ctx.source.pressedNotes).toEqual([]);
  });

  it('releases held notes on an explicit disconnect too', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.piano.emit([0x90, 67, 100], 0);
    ctx.notes.length = 0;
    ctx.source.disconnect();
    expect(ctx.notes.map((n) => [n.kind, n.midi])).toEqual([['noteOff', 67]]);
    expect(ctx.source.pressedNotes).toEqual([]);
  });

  it('does not release anything when a *different* port goes', async () => {
    const ctx = setup((access) => {
      access.inputs.set('in-2', new FakeInput('in-2', 'MIDI Device'));
    });
    await ctx.source.connect();
    ctx.piano.emit([0x90, 60, 100], 0);
    ctx.notes.length = 0;
    ctx.access.disconnectInput('in-2');
    expect(ctx.notes).toEqual([]);
    expect(ctx.source.pressedNotes).toEqual([60]);
  });

  it('hears the piano again when it is plugged back in', async () => {
    const ctx = setup();
    await ctx.source.connect();
    ctx.access.disconnectInput('in-1');
    ctx.notes.length = 0;

    ctx.access.reconnectInput('in-1');

    expect(ctx.source.connected).toBe(true);
    expect(ctx.source.state.detail).toBe('1 input');
    ctx.piano.emit([0x90, 72, 100], 500);
    expect(ctx.notes.map((n) => n.midi)).toEqual([72]);
  });

  it('does not send to an output the device has left, and does not throw', async () => {
    const ctx = setup((access) => {
      access.outputs.set('out-1', new FakeOutput('out-1', 'USB MIDI Interface'));
    });
    await ctx.source.connect();
    const out = ctx.access.outputs.get('out-1');
    if (!out) throw new Error('missing fixture output out-1');
    ctx.access.disconnectOutput('out-1');

    expect(ctx.source.outputs).toEqual([]);
    expect(() => ctx.source.sendAllNotesOff()).not.toThrow();
    expect(out.sent).toEqual([]);
  });

  it('a send that throws does not reach the error banner', async () => {
    const ctx = setup((access) => {
      const out = new FakeOutput('out-1', 'USB MIDI Interface');
      out.send = () => {
        const err = new Error('port closed');
        err.name = 'InvalidStateError';
        throw err;
      };
      access.outputs.set('out-1', out);
    });
    await ctx.source.connect();
    expect(() => ctx.source.send(Uint8Array.from([0x90, 60, 100]))).not.toThrow();
  });
});
