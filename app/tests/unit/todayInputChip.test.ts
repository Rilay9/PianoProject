// @vitest-environment jsdom
/**
 * The input chip on Today follows the piano instead of guessing once.
 *
 * This is a fault only the owner's device has, and the reason no test had it is
 * that no test *can* have it by accident: there is no Web MIDI in jsdom or in a
 * headless runner, so the fixture always takes the "no input" branch and the
 * race cannot happen. On the phone it happens every cold start.
 *
 * `autoConnectMidi()` is started and not awaited, and it awaits a permission
 * query and then the MIDI access itself. Today is mounted on the next line. So
 * with the HP-130 plugged in and permission granted a year ago, the chip is
 * drawn before `webMidiSource` has any inputs — and it said **⏱ Timed** or
 * **⌨ Screen keys** over a connected piano for the whole visit, with a tap on
 * it going to the wrong settings page.
 *
 * The fake source below is the smallest thing with the two methods the screen
 * uses, and it connects late on purpose.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

const midiListeners = new Set<() => void>();
const micListeners = new Set<() => void>();
const midi = { inputs: [] as unknown[] };

function connectPiano(): void {
  midi.inputs = [{ id: 'hp130', name: 'Roland HP-130' }];
  for (const listener of midiListeners) listener();
}

vi.mock('../../src/app/services', () => ({
  webMidiSource: {
    get inputs() {
      return midi.inputs;
    },
    onStateChange: (cb: () => void) => {
      midiListeners.add(cb);
      return () => midiListeners.delete(cb);
    },
  },
  micSource: {
    state: { connected: false },
    onStateChange: (cb: () => void) => {
      micListeners.add(cb);
      return () => micListeners.delete(cb);
    },
  },
}));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve({ version: 1, tracks: [], stages: [] }),
  allItems: () => Promise.resolve([]),
}));

const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');

const router = { navigate: vi.fn() } as unknown as Router;

describe('the input chip on Today', () => {
  beforeEach(() => {
    midi.inputs = [];
    midiListeners.clear();
    micListeners.clear();
  });
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('says what is connected when the piano arrives after the screen', async () => {
    const section = TodayScreen(router);
    document.body.replaceChildren(section);
    const chip = section.querySelector('#today-input');
    await vi.waitFor(() => {
      expect(chip?.textContent).not.toBe('…');
    });
    // What the screen sees at first: no MIDI yet, because auto-connect has not
    // come back.
    expect(chip?.textContent).not.toContain('MIDI');

    connectPiano();
    expect(chip?.textContent).toContain('MIDI');
  });

  it('stops listening when the screen goes away', async () => {
    const { disposeScreen } = await import('../../src/ui/screenLifecycle');
    const section = TodayScreen(router);
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelector('#today-input')?.textContent).not.toBe('…');
    });
    expect(midiListeners.size).toBe(1);
    disposeScreen(section);
    expect(midiListeners.size).toBe(0);
    expect(micListeners.size).toBe(0);
  });
});
