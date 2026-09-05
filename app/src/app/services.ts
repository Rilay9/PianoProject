// App-wide singletons.
//
// The MIDI screen and the Diagnostics screen must see the *same* connection:
// the owner connects on one and reads the log on the other, and a second
// `requestMIDIAccess()` would raise a second permission prompt. Screens are
// rebuilt on every route change, so the long-lived objects live here instead
// of inside a screen.

import { audioEngine } from '../audio/AudioEngine';
import { MicSource } from '../audio/pitch/MicSource';
import { Piano } from '../audio/Piano';
import { ScreenKeyboardSource } from '../midi/ScreenKeyboardSource';
import { WebMidiSource } from '../midi/WebMidiSource';
import { getMidiSettings, onMidiSettingsChange } from '../data/midiSettings';

export const webMidiSource = new WebMidiSource();
// The mic detector shares the one AudioContext: a second one would cost
// another hardware stream and its own output latency (see AudioEngine).
export const micSource = new MicSource({ audioContext: () => audioEngine.ensureStarted() });
export const screenKeyboardSource = new ScreenKeyboardSource();
export { audioEngine };

// The pinned input survives a reload; apply it before anything connects.
webMidiSource.pinInput(getMidiSettings().pinnedInputId);
onMidiSettingsChange((s) => webMidiSource.pinInput(s.pinnedInputId));

/**
 * Reconnects the piano on launch, when — and only when — that costs no prompt.
 *
 * Every screen that reads MIDI (the Score screen, the drill screen) assumes
 * the connection already exists, and nothing was making it: with the cable
 * plugged in and permission granted months ago, a learner opening a drill got
 * silence until they went hunting in Settings.
 *
 * The gate is the Permissions API. In Chrome *every* `requestMIDIAccess()`
 * raises a prompt, not just a SysEx one, so calling it unasked would nag on
 * first launch — which docs/04 §8 says the app never does. `state: 'granted'`
 * is the one case where the call is silent, and it is also the only case where
 * the answer is already yes. No Permissions API means no auto-connect.
 */
export async function autoConnectMidi(): Promise<boolean> {
  try {
    const permissions = navigator.permissions as
      | { query?: (descriptor: { name: string }) => Promise<{ state: string }> }
      | undefined;
    if (typeof permissions?.query !== 'function') return false;
    const status = await permissions.query({ name: 'midi' });
    if (status.state !== 'granted') return false;
    await webMidiSource.connect();
    return true;
  } catch {
    // An unsupported descriptor name, a rejected request, no Web MIDI at all:
    // every one of them means "carry on without the cable".
    return false;
  }
}

let pianoInstance: Piano | null = null;
let pianoLoad: Promise<Piano> | null = null;

/**
 * Returns the shared Piano, loading its samples on first use. MUST be called
 * from a user gesture the first time, because it starts the AudioContext.
 * Concurrent callers share one load.
 */
export function getPiano(): Promise<Piano> {
  if (pianoLoad) return pianoLoad;
  pianoLoad = audioEngine
    .ensureStarted()
    .then(async (context) => {
      const piano = new Piano(context, {
        volume: Math.round(getMidiSettings().pianoVolume * 127),
        ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
      });
      pianoInstance = piano;
      await piano.load();
      return piano;
    })
    .catch((cause: unknown) => {
      // Allow a retry after a failed fetch (offline before the precache ran).
      pianoLoad = null;
      pianoInstance = null;
      throw cause;
    });
  return pianoLoad;
}

/** The Piano if it has already loaded, else null. Never starts audio. */
export function getLoadedPiano(): Piano | null {
  return pianoInstance?.state === 'ready' ? pianoInstance : null;
}
