// MIDI screen (docs/04-ui-spec.md §7 "MIDI", §8 empty/edge states).
//
// The order on screen is deliberate: explain the permission prompt *before*
// the button that raises it. Since Chrome 124 every `requestMIDIAccess()` call
// prompts, and a prompt the owner was not expecting gets dismissed — after
// which the only way back is buried in Chrome's site settings.

import { addButton, addParagraph, addSection, createSubScreen } from './subScreen';
import { onScreenDispose } from '../screenLifecycle';
import { KeyboardStrip } from '../KeyboardStrip';
import { getPiano, screenKeyboardSource, webMidiSource } from '../../app/services';
import { isWebMidiSupported, type MidiAccessError } from '../../midi/WebMidiSource';
import { midiToNoteName } from '../../midi/parseMidiMessage';
import type { InputNoteEvent } from '../../midi/types';
import { getMidiSettings, updateMidiSettings } from '../../data/midiSettings';
import type { Router } from '../../router';

const LAST_NOTES_SHOWN = 10;

/** Recovery text per failure mode; the codes come from WebMidiSource. */
const ERROR_HELP: Record<string, string> = {
  unsupported:
    'This browser does not implement the Web MIDI API. Chrome (or Samsung Internet) ' +
    'on Android, or Chrome/Edge on a desktop, do. Everything else in PianoPath works ' +
    'without MIDI — the on-screen keyboard below is a full input.',
  'permission-denied':
    'Chrome remembers a dismissed MIDI prompt. To re-enable it: Chrome ⋮ menu → ' +
    'Settings → Site settings → MIDI devices → find this site → Allow. Then come ' +
    'back and tap Connect piano again.',
  failed:
    'MIDI access failed for a reason the browser did not explain. Check that the USB ' +
    'adapter is seated, then try again. The Diagnostics screen shows the raw details.',
};

export function MidiScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'midi',
    title: 'MIDI',
    backTo: 'settings',
    backLabel: 'Settings',
  });

  // --- Explainer -----------------------------------------------------------
  const intro = addSection(card, 'Connecting your piano');
  addParagraph(
    intro,
    'Plug the USB-MIDI cable into the piano’s MIDI OUT and into the phone through its ' +
      'USB-C adapter, then tap Connect piano.',
  );
  addParagraph(
    intro,
    'Chrome will ask “Allow this site to connect to your MIDI devices?”. That prompt is ' +
      'the browser’s, not PianoPath’s, and it only appears when you tap the button. ' +
      'Choose Allow — if you dismiss it, Chrome remembers, and re-enabling it takes a ' +
      'trip through Settings → Site settings → MIDI devices.',
    'muted',
  );

  const connectButton = addButton(intro, 'Connect piano', () => void connect(), {
    id: 'midi-connect',
    variant: 'primary',
  });

  const status = document.createElement('p');
  status.id = 'midi-status';
  status.className = 'status';
  intro.appendChild(status);

  const errorBox = document.createElement('div');
  errorBox.id = 'midi-error';
  errorBox.className = 'notice notice--error';
  errorBox.hidden = true;
  intro.appendChild(errorBox);

  // --- Device list ---------------------------------------------------------
  const devices = addSection(card, 'Inputs');
  addParagraph(
    devices,
    'PianoPath listens to every input at once, because cheap adapters report ' +
      'names like “USB MIDI Interface”. Pin one if something else is sending notes.',
    'muted',
  );
  const deviceList = document.createElement('div');
  deviceList.id = 'midi-devices';
  deviceList.className = 'device-list';
  devices.appendChild(deviceList);

  // --- Test area -----------------------------------------------------------
  const test = addSection(card, 'Test');
  addParagraph(
    test,
    'Play a few keys. They should light up below and sound through the phone. ' +
      'Tapping the on-screen keys works with no cable at all.',
    'muted',
  );

  const strip = new KeyboardStrip({
    interactive: true,
    onNoteOn: (midi, velocity) => {
      screenKeyboardSource.noteOn(midi, velocity);
      void playThrough(midi, velocity);
    },
    onNoteOff: (midi) => screenKeyboardSource.noteOff(midi),
  });
  test.appendChild(strip.el);

  const lastNotes = document.createElement('ol');
  lastNotes.id = 'midi-last-notes';
  lastNotes.className = 'note-log';
  test.appendChild(lastNotes);

  addButton(test, 'Test sound (C major)', () => void testSound(), { id: 'midi-test-sound' });
  const soundStatus = document.createElement('p');
  soundStatus.id = 'midi-sound-status';
  soundStatus.className = 'status';
  test.appendChild(soundStatus);

  addButton(card, 'Open diagnostics →', () => router.navigate('settings', 'diagnostics'), {
    id: 'midi-open-diagnostics',
  });

  // --- Wiring --------------------------------------------------------------
  const pressed = new Set<number>();

  function onNote(e: InputNoteEvent): void {
    if (e.kind === 'noteOn') pressed.add(e.midi);
    else pressed.delete(e.midi);
    strip.setState({ pressed });
    if (e.kind === 'noteOn') appendNote(e);
  }

  function appendNote(e: InputNoteEvent): void {
    const li = document.createElement('li');
    li.textContent = `${midiToNoteName(e.midi)} · velocity ${e.velocity} · ${e.source}`;
    lastNotes.prepend(li);
    while (lastNotes.childElementCount > LAST_NOTES_SHOWN) lastNotes.lastElementChild?.remove();
  }

  async function playThrough(midi: number, velocity: number): Promise<void> {
    try {
      const piano = await getPiano();
      piano.start({ midi, velocity, durationSec: 1.2 });
    } catch {
      // Sound is a bonus here; the visual feedback is the point of the test.
    }
  }

  async function testSound(): Promise<void> {
    soundStatus.textContent = 'Loading piano samples…';
    try {
      const piano = await getPiano();
      piano.playChord();
      soundStatus.textContent = 'Played a C major chord.';
    } catch (cause) {
      soundStatus.textContent = `Could not start audio: ${
        cause instanceof Error ? cause.message : String(cause)
      }`;
    }
  }

  async function connect(): Promise<void> {
    errorBox.hidden = true;
    connectButton.disabled = true;
    status.textContent = 'Waiting for the browser’s permission prompt…';
    try {
      await webMidiSource.connect();
      renderState();
    } catch (cause) {
      showError(cause as MidiAccessError);
    } finally {
      connectButton.disabled = false;
    }
  }

  function showError(err: MidiAccessError): void {
    errorBox.hidden = false;
    errorBox.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = err.message;
    errorBox.appendChild(title);
    addParagraph(errorBox, ERROR_HELP[err.code] ?? '');
    renderState();
  }

  function renderState(): void {
    const state = webMidiSource.state;
    status.textContent = state.detail;
    section.dataset.midiConnected = String(state.connected);
    renderDevices();
  }

  function renderDevices(): void {
    const inputs = webMidiSource.inputs;
    deviceList.replaceChildren();
    if (inputs.length === 0) {
      addParagraph(deviceList, 'No MIDI inputs yet. Plugging one in is picked up live.', 'muted');
      return;
    }
    const pinned = getMidiSettings().pinnedInputId;
    deviceList.appendChild(deviceRow('Listen to all inputs', null, pinned === null));
    for (const input of inputs) {
      const label = input.manufacturer ? `${input.name} — ${input.manufacturer}` : input.name;
      deviceList.appendChild(deviceRow(label, input.id, pinned === input.id));
    }
  }

  function deviceRow(label: string, id: string | null, checked: boolean): HTMLElement {
    const row = document.createElement('label');
    row.className = 'device-row';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'midi-input';
    radio.checked = checked;
    radio.value = id ?? '';
    radio.dataset.inputId = id ?? '';
    radio.addEventListener('change', () => {
      updateMidiSettings({ pinnedInputId: id });
      renderDevices();
    });
    row.appendChild(radio);
    const text = document.createElement('span');
    text.textContent = label;
    row.appendChild(text);
    return row;
  }

  if (!isWebMidiSupported()) {
    connectButton.disabled = true;
    showError({ code: 'unsupported', message: 'Web MIDI is not supported here.' } as MidiAccessError);
  } else {
    renderState();
  }

  const unsubscribers = [
    webMidiSource.onNote(onNote),
    webMidiSource.onStateChange(() => renderState()),
    screenKeyboardSource.onNote(onNote),
  ];
  onScreenDispose(section, () => {
    for (const off of unsubscribers) off();
    screenKeyboardSource.releaseAll();
    strip.destroy();
  });

  return section;
}
