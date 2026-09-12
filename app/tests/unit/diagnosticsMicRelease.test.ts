// @vitest-environment jsdom
/**
 * Diagnostics opened the microphone and never closed it.
 *
 * `Record a clip` connects when nothing is connected, records for five seconds,
 * then stops recording and drops its audio listener — and leaves the track, the
 * worklet and the graph live. `stopRecording` is only the raw-audio tap. On a
 * phone that is the recording indicator on for the rest of the session, after a
 * five-second capture, on the screen the owner opens *because* something is
 * already wrong. `MicScreen` shipped the identical fault and every other screen
 * that touches the microphone releases it.
 *
 * The half that matters as much: it must close only what it opened. The score
 * screen may already have the microphone open and be listening through it, and
 * disconnecting that would stop a run dead.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

const mic = { connected: false, disconnects: 0, connects: 0, stopRecordings: 0 };

vi.mock('../../src/app/services', () => ({
  micSource: {
    get state() {
      return { connected: mic.connected, detail: 'fake' };
    },
    get supported() {
      return true;
    },
    get sampleRate() {
      return 48_000;
    },
    connect: () => {
      mic.connects += 1;
      mic.connected = true;
      return Promise.resolve();
    },
    disconnect: () => {
      mic.disconnects += 1;
      mic.connected = false;
    },
    startRecording: () => undefined,
    stopRecording: () => {
      mic.stopRecordings += 1;
    },
    onAudio: () => () => undefined,
    onLevel: () => () => undefined,
    onStateChange: () => () => undefined,
  },
  webMidiSource: {
    get state() {
      return { connected: false, inputs: [], outputs: [], detail: 'none', knownInputs: [] };
    },
    get inputs() {
      return [];
    },
    get log() {
      return [];
    },
    get logEntries() {
      return [];
    },
    get highRateCounters() {
      return { clock: 0, activeSense: 0, dropped: 0 };
    },
    get outputs() {
      return [];
    },
    latestLog: () => [],
    clearLog: () => undefined,
    connect: () => Promise.resolve(),
    onStateChange: () => () => undefined,
    onLog: () => () => undefined,
  },
  audioEngine: {
    get context() {
      return null;
    },
    onStateChange: () => () => undefined,
  },
}));

const { DiagnosticsScreen } = await import('../../src/ui/screens/DiagnosticsScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

const router = { navigate: vi.fn() } as unknown as Router;

function mount(): HTMLElement {
  const section = DiagnosticsScreen(router);
  document.body.appendChild(section);
  return section;
}

/** Starts a capture and lets the connect promise settle. */
async function startCapture(): Promise<void> {
  const button = document.getElementById('diag-mic-capture');
  expect(button, 'no capture button on the screen').not.toBeNull();
  (button as HTMLButtonElement).click();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  mic.connected = false;
  mic.disconnects = 0;
  mic.connects = 0;
  mic.stopRecordings = 0;
  document.body.replaceChildren();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('the microphone Diagnostics opened', () => {
  it('is closed again when the screen goes', async () => {
    const section = mount();
    await startCapture();
    expect(mic.connects, 'the capture never opened a microphone').toBe(1);
    disposeScreen(section);
    expect(mic.disconnects, 'the microphone was left open for the session').toBe(1);
  });

  it('is left alone when something else opened it', async () => {
    // The score screen is mid-run and listening. Diagnostics borrows the open
    // microphone and must hand it back, not close it.
    mic.connected = true;
    const section = mount();
    await startCapture();
    expect(mic.connects, 'it opened a second one over the top').toBe(0);
    disposeScreen(section);
    expect(mic.disconnects, 'it closed a microphone it did not open').toBe(0);
  });
});
