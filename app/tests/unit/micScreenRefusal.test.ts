// @vitest-environment jsdom
/**
 * A dismissed microphone prompt is not a refusal.
 *
 * Chrome throws the same `NotAllowedError` whether the learner tapped **Block**
 * or swiped the prompt away — a notification landing, a hand brushing the
 * screen — and `MicSource` maps both to `permission-denied`. The screen used to
 * answer both with "the browser will not ask again until you allow it in this
 * page's own site settings" *and* hide the Connect button, so an accidental
 * dismissal left the owner with no way to open the microphone and instructions
 * for a setting nothing had changed. The Permissions API is the only thing that
 * can tell the two apart, and nothing was asking it.
 *
 * The second half of this file is the microphone left open: leaving this screen
 * released the raw-audio tap and nothing else, so the stream stayed live — the
 * phone's recording indicator on — for the rest of the session.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import { MicAccessError } from '../../src/audio/pitch/MicSource';

const listeners = new Set<() => void>();
const mic = {
  connected: false,
  refuseWith: null as MicAccessError | null,
  disconnects: 0,
  stopRecordings: 0,
};

vi.mock('../../src/app/services', () => ({
  micSource: {
    get state() {
      return { connected: mic.connected, detail: mic.connected ? 'Fake mic' : 'not connected' };
    },
    get inputs() {
      return [];
    },
    pinnedInputId: null,
    connect: () => {
      if (mic.refuseWith) return Promise.reject(mic.refuseWith);
      mic.connected = true;
      return Promise.resolve();
    },
    disconnect: () => {
      mic.disconnects += 1;
      mic.connected = false;
    },
    stopRecording: () => {
      mic.stopRecordings += 1;
    },
    pinInput: () => undefined,
    applyCalibration: () => undefined,
    onLevel: (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    onStateChange: (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  },
}));

vi.mock('../../src/audio/pitch/calibrationRun', () => ({
  runCalibrationRoutine: () => Promise.resolve({}),
  describeCalibration: () => 'done',
}));

vi.mock('../../src/data/micCalibrationStore', () => ({
  micCalibrationStore: { get: () => null },
}));

const { MicScreen } = await import('../../src/ui/screens/MicScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

const router = { navigate: vi.fn() } as unknown as Router;

/** What `navigator.permissions.query({ name: 'microphone' })` answers. */
function withPermission(state: string | null): void {
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    writable: true,
    value:
      state === null
        ? undefined
        : { query: () => Promise.resolve({ state, onchange: null }) },
  });
}

function mount(): HTMLElement {
  const section = MicScreen(router);
  document.body.appendChild(section);
  return section;
}

async function tapConnect(): Promise<void> {
  (document.getElementById('mic-connect') as HTMLButtonElement).click();
  // The click handler is `void connect()`: the refusal path awaits the
  // permission query, so two turns of the microtask queue are needed.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  mic.connected = false;
  mic.refuseWith = null;
  mic.disconnects = 0;
  mic.stopRecordings = 0;
  listeners.clear();
  withPermission('prompt');
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('MicScreen — a refusal that is not one', () => {
  it('keeps Connect when the prompt was dismissed, and says so', async () => {
    mic.refuseWith = new MicAccessError('permission-denied', 'microphone permission was refused');
    withPermission('prompt');
    mount();
    await tapConnect();

    const connect = document.getElementById('mic-connect') as HTMLButtonElement;
    expect(connect.hidden).toBe(false);
    expect(connect.disabled).toBe(false);
    const said = document.getElementById('mic-status')?.textContent ?? '';
    expect(said).toContain('closed without an answer');
    expect(said).not.toContain('site settings');
    // Nothing is hidden: the level meter and the calibration routine are both
    // still reachable, because the microphone is still gettable.
    expect(document.getElementById('mic-use-midi')?.parentElement?.hidden).toBe(true);
    expect(document.getElementById('mic-calibrate')?.closest('section')?.hidden).toBe(false);
  });

  it('still takes Connect away when the microphone was really blocked', async () => {
    mic.refuseWith = new MicAccessError('permission-denied', 'microphone permission was refused');
    withPermission('denied');
    mount();
    await tapConnect();

    expect((document.getElementById('mic-connect') as HTMLButtonElement).hidden).toBe(true);
    expect(document.getElementById('mic-status')?.textContent).toContain('site settings');
    expect(document.getElementById('mic-use-midi')?.parentElement?.hidden).toBe(false);
  });

  it('keeps Connect when the browser will not say what the permission is', async () => {
    mic.refuseWith = new MicAccessError('permission-denied', 'microphone permission was refused');
    withPermission(null);
    mount();
    await tapConnect();

    expect((document.getElementById('mic-connect') as HTMLButtonElement).hidden).toBe(false);
    expect(document.getElementById('mic-status')?.textContent).toContain('asked again');
  });

  it('a device with no microphone is still settled, without asking permission', async () => {
    mic.refuseWith = new MicAccessError('no-device', 'no microphone matched');
    withPermission('prompt');
    mount();
    await tapConnect();

    expect((document.getElementById('mic-connect') as HTMLButtonElement).hidden).toBe(true);
    expect(document.getElementById('mic-status')?.textContent).toContain('No microphone was found');
  });
});

describe('MicScreen — the microphone on the way out', () => {
  it('closes the microphone when the screen is left', async () => {
    const section = mount();
    await tapConnect();
    expect(mic.connected).toBe(true);

    disposeScreen(section);

    expect(mic.stopRecordings).toBeGreaterThan(0);
    expect(mic.disconnects).toBe(1);
    expect(mic.connected).toBe(false);
  });
});
