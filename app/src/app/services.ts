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
