// @vitest-environment jsdom
/**
 * The Inputs list on the MIDI screen, when the pinned input is not there.
 *
 * Port ids are not stable across plug-ins (docs/05 §9), so the id stored by
 * "pin this input" routinely names a port that is no longer in the list — a
 * different cable, or the same cable after the OTG adapter was reseated.
 * `WebMidiSource.effectiveInputId` already treats an unknown id as "no
 * filter", and a test above it pins that. The *screen* did not: it drew
 * "Listen to all inputs" checked only when the stored id was `null`, so in
 * that case the radio group came up with **nothing selected at all** over an
 * app that was listening to everything — the one state a radio group cannot
 * express — and there was no sentence anywhere saying why.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

interface FakePort {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
  connection: string;
}

const midi = {
  inputs: [] as FakePort[],
  known: [] as FakePort[],
  connected: false,
};

vi.mock('../../src/app/services', () => ({
  webMidiSource: {
    get inputs() {
      return midi.inputs;
    },
    get knownInputs() {
      return midi.known;
    },
    get state() {
      return {
        connected: midi.connected,
        detail: midi.connected ? '1 input' : 'Not connected',
        inputs: midi.inputs.map((i) => i.name),
        outputs: [],
      };
    },
    connect: () => Promise.resolve(),
    onNote: () => () => undefined,
    onStateChange: () => () => undefined,
  },
  screenKeyboardSource: {
    noteOn: () => undefined,
    noteOff: () => undefined,
    releaseAll: () => undefined,
    onNote: () => () => undefined,
  },
  getPiano: () => Promise.reject(new Error('no audio in jsdom')),
}));

vi.mock('../../src/midi/WebMidiSource', () => ({
  isWebMidiSupported: () => true,
}));

const { MidiScreen } = await import('../../src/ui/screens/MidiScreen');
const { getMidiSettings, updateMidiSettings, resetMidiSettingsForTest } = await import(
  '../../src/data/midiSettings'
);

const router = { navigate: vi.fn() } as unknown as Router;

function port(id: string, name: string): FakePort {
  return { id, name, manufacturer: 'Roland', state: 'connected', connection: 'open' };
}

function checkedLabels(): string[] {
  return [...document.querySelectorAll<HTMLInputElement>('#midi-devices input[type="radio"]')]
    .filter((radio) => radio.checked)
    .map((radio) => radio.parentElement?.textContent?.trim() ?? '');
}

beforeEach(() => {
  localStorage.clear();
  resetMidiSettingsForTest();
  midi.inputs = [];
  midi.known = [];
  midi.connected = false;
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('MidiScreen — the Inputs list', () => {
  it('checks the pinned input when it is plugged in', () => {
    midi.inputs = [port('in-1', 'USB MIDI Interface'), port('in-2', 'MIDI Device')];
    midi.known = midi.inputs;
    midi.connected = true;
    updateMidiSettings({ pinnedInputId: 'in-2' });

    document.body.appendChild(MidiScreen(router));

    expect(checkedLabels()).toEqual(['MIDI Device — Roland']);
    expect(document.getElementById('midi-pin-lost')).toBeNull();
  });

  it('falls back to "Listen to all inputs" when the pinned id is not here, and says why', () => {
    midi.inputs = [port('in-1', 'USB MIDI Interface')];
    midi.known = midi.inputs;
    midi.connected = true;
    // The id a previous plug-in wrote. Nothing clears it, by design.
    updateMidiSettings({ pinnedInputId: 'in-from-last-time' });

    document.body.appendChild(MidiScreen(router));

    expect(checkedLabels()).toEqual(['Listen to all inputs']);
    expect(document.getElementById('midi-pin-lost')?.textContent).toContain(
      'every input is being listened to',
    );
    // The setting itself is untouched: the cable may come back under that id,
    // and forgetting the choice on the owner's behalf is a different decision.
    expect(getMidiSettings().pinnedInputId).toBe('in-from-last-time');
  });

  it('does not promise live hot-plug before anything is connected', () => {
    document.body.appendChild(MidiScreen(router));
    const said = document.getElementById('midi-devices')?.textContent ?? '';
    // Nothing is listening for `statechange` until `connect()` has run, so
    // "plugging one in is picked up live" was untrue exactly here.
    expect(said).toContain('Tap Connect piano');
  });

  it('says a port is unplugged rather than never-there, once connected', () => {
    midi.inputs = [];
    midi.known = [{ ...port('in-1', 'USB MIDI Interface'), state: 'disconnected' }];
    midi.connected = false;

    document.body.appendChild(MidiScreen(router));

    expect(document.getElementById('midi-devices')?.textContent).toContain(
      'No MIDI input is plugged in',
    );
  });
});
