// A fake Web MIDI implementation for Playwright.
//
// Installed with `page.addInitScript`, so it is in place before any app code
// runs and `WebMidiSource` captures `navigator.requestMIDIAccess` at module
// load. The returned handle drives it from the test side: inject raw bytes,
// plug and unplug devices, and read back whatever the app sent to an output.
//
// Deliberately separate from tests/unit/helpers/fakeMidiAccess.ts: that one is
// a TypeScript object the unit tests hold a reference to, this one has to be
// serialisable into the page and reachable only through `page.evaluate`.

import type { Page } from '@playwright/test';

export interface MockPortSpec {
  id: string;
  name: string;
  manufacturer?: string;
}

export type MidiMockBehaviour =
  /** `requestMIDIAccess` resolves. */
  | 'granted'
  /** Rejects with a SecurityError, as Chrome does when the prompt is dismissed. */
  | 'denied'
  /** `navigator.requestMIDIAccess` is absent, as in Firefox or iOS Safari. */
  | 'unsupported';

export interface MidiMockOptions {
  behaviour?: MidiMockBehaviour;
  inputs?: MockPortSpec[];
  outputs?: MockPortSpec[];
  /**
   * What `navigator.permissions.query({ name: 'midi' })` answers.
   *
   * Defaults to `'prompt'`, which is a first visit: the app does not connect
   * on its own, exactly as in a real browser. `'granted'` is the second visit
   * onwards, where `app/services.autoConnectMidi` reconnects silently — which
   * is what the drill screen relies on.
   */
  permission?: 'granted' | 'prompt' | 'denied';
}

export const DEFAULT_MOCK_INPUT: MockPortSpec = {
  id: 'mock-in-1',
  name: 'USB MIDI Interface',
  manufacturer: 'PianoPath Test',
};

/** Handle returned by {@link installMidiMock}. */
export interface MidiMock {
  /** Delivers raw MIDI bytes from `inputId` (defaults to the first input). */
  send(bytes: number[], inputId?: string): Promise<void>;
  noteOn(midi: number, velocity?: number, inputId?: string): Promise<void>;
  /** Sends an explicit Note-Off (status 0x80). */
  noteOff(midi: number, inputId?: string): Promise<void>;
  /** Sends Note-On with velocity 0, the other way pianos release a key. */
  noteOffViaZeroVelocity(midi: number, inputId?: string): Promise<void>;
  /** Hot-plug: adds a port and fires `statechange`. */
  addInput(spec: MockPortSpec): Promise<void>;
  removeInput(id: string): Promise<void>;
  /** Everything the app has sent to a MIDI output, oldest first. */
  sentMessages(): Promise<number[][]>;
  /** How many times the app called `requestMIDIAccess`, and with what. */
  accessRequests(): Promise<{ sysex: boolean }[]>;
}

interface MockGlobal {
  addInput(spec: MockPortSpec): void;
  removeInput(id: string): void;
  deliver(inputId: string | null, bytes: number[]): void;
  sent: number[][];
  requests: { sysex: boolean }[];
}

declare global {
  interface Window {
    __midiMock?: MockGlobal;
  }
}

/**
 * Installs the mock into `page`. Call before `page.goto`.
 */
export async function installMidiMock(
  page: Page,
  options: MidiMockOptions = {},
): Promise<MidiMock> {
  const spec = {
    behaviour: options.behaviour ?? 'granted',
    inputs: options.inputs ?? [DEFAULT_MOCK_INPUT],
    outputs: options.outputs ?? [],
    // 'prompt' by default, so the mock's presence alone never makes the app
    // connect: an existing test that expects a disconnected screen keeps
    // expecting one.
    permission: options.permission ?? 'prompt',
  };

  await page.addInitScript((config: Required<MidiMockOptions>) => {
    class MockPort {
      readonly type: string;
      readonly state = 'connected';
      readonly connection = 'open';
      readonly version = '1.0';
      readonly id: string;
      readonly name: string;
      readonly manufacturer: string;
      onstatechange: ((ev: Event) => unknown) | null = null;

      constructor(spec: MockPortSpec, type: string) {
        this.id = spec.id;
        this.name = spec.name;
        this.manufacturer = spec.manufacturer ?? '';
        this.type = type;
      }

      open(): Promise<MockPort> {
        return Promise.resolve(this);
      }

      close(): Promise<MockPort> {
        return Promise.resolve(this);
      }

      addEventListener(): void {}
      removeEventListener(): void {}
    }

    class MockInput extends MockPort {
      onmidimessage: ((ev: { data: Uint8Array; timeStamp: number }) => unknown) | null = null;

      constructor(spec: MockPortSpec) {
        super(spec, 'input');
      }

      deliver(bytes: number[]): void {
        this.onmidimessage?.({
          data: new Uint8Array(bytes),
          // The real API stamps the message when it arrived; performance.now()
          // read here is the closest a mock can get, and is on the same clock.
          timeStamp: performance.now(),
        });
      }
    }

    class MockOutput extends MockPort {
      constructor(
        spec: MockPortSpec,
        private readonly sink: number[][],
      ) {
        super(spec, 'output');
      }

      send(data: number[]): void {
        this.sink.push([...data]);
      }
    }

    const sent: number[][] = [];
    const requests: { sysex: boolean }[] = [];
    const inputs = new Map<string, MockInput>();
    const outputs = new Map<string, MockOutput>();
    const access = {
      inputs,
      outputs,
      sysexEnabled: false,
      onstatechange: null as ((ev: Event) => unknown) | null,
      addEventListener(): void {},
      removeEventListener(): void {},
    };

    for (const s of config.inputs) inputs.set(s.id, new MockInput(s));
    for (const s of config.outputs) outputs.set(s.id, new MockOutput(s, sent));

    const fireStateChange = () => access.onstatechange?.(new Event('statechange'));

    window.__midiMock = {
      addInput(spec) {
        inputs.set(spec.id, new MockInput(spec));
        fireStateChange();
      },
      removeInput(id) {
        inputs.delete(id);
        fireStateChange();
      },
      deliver(inputId, bytes) {
        const input = inputId ? inputs.get(inputId) : inputs.values().next().value;
        if (!input) throw new Error(`midiMock: no input ${inputId ?? '(first)'}`);
        input.deliver(bytes);
      },
      sent,
      requests,
    };

    if (config.behaviour === 'unsupported') {
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      return;
    }

    // `app/services.autoConnectMidi` asks this before it calls
    // `requestMIDIAccess`, so the mock has to answer it or the auto-connect
    // path is never exercised.
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      writable: true,
      value: {
        query: (descriptor: { name: string }) =>
          Promise.resolve({
            state: descriptor.name === 'midi' ? config.permission : 'prompt',
            onchange: null,
          }),
      },
    });

    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      writable: true,
      value: (options?: { sysex?: boolean }) => {
        requests.push({ sysex: options?.sysex === true });
        if (config.behaviour === 'denied') {
          // Chrome rejects a dismissed prompt with a SecurityError; the name
          // is what WebMidiSource branches on, so the mock must match it.
          const err = new Error('Permission denied');
          err.name = 'SecurityError';
          return Promise.reject(err);
        }
        return Promise.resolve(access);
      },
    });
  }, spec);

  const deliver = (bytes: number[], inputId?: string) =>
    page.evaluate(
      ({ bytes: b, inputId: id }) => {
        const mock = window.__midiMock;
        if (!mock) throw new Error('midiMock was not installed');
        mock.deliver(id, b);
      },
      { bytes, inputId: inputId ?? null },
    );

  return {
    send: (bytes, inputId) => deliver(bytes, inputId),
    noteOn: (midi, velocity = 100, inputId) => deliver([0x90, midi, velocity], inputId),
    noteOff: (midi, inputId) => deliver([0x80, midi, 0], inputId),
    noteOffViaZeroVelocity: (midi, inputId) => deliver([0x90, midi, 0], inputId),
    addInput: (portSpec) =>
      page.evaluate((s: MockPortSpec) => {
        const mock = window.__midiMock;
        if (!mock) throw new Error('midiMock was not installed');
        mock.addInput(s);
      }, portSpec),
    removeInput: (id) =>
      page.evaluate((portId: string) => {
        const mock = window.__midiMock;
        if (!mock) throw new Error('midiMock was not installed');
        mock.removeInput(portId);
      }, id),
    sentMessages: () => page.evaluate(() => window.__midiMock?.sent ?? []),
    accessRequests: () => page.evaluate(() => window.__midiMock?.requests ?? []),
  };
}
