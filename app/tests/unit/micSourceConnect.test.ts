/**
 * `MicSource.connect()` when it is called twice, and the clock a note is
 * stamped on.
 *
 * Both are faults in what happens *around* the four `await`s in `connect()`
 * rather than in the detector, so neither shows up in `pitchDetector.test.ts`
 * and there was no test of this file at all.
 */
import { describe, expect, it, vi } from 'vitest';
import { MicSource } from '../../src/audio/pitch/MicSource';
import type { InputNoteEvent } from '../../src/midi/types';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function fakeTrack() {
  return {
    label: 'Fake microphone',
    stop: vi.fn(),
    getSettings: () => ({ sampleRate: 48_000 }),
  };
}

function fakeStream() {
  const track = fakeTrack();
  return {
    track,
    stream: {
      getTracks: () => [track],
      getAudioTracks: () => [track],
    } as unknown as MediaStream,
  };
}

/** Every worklet node the run created, with its port still reachable. */
interface Harness {
  source: MicSource;
  nodes: {
    port: { onmessage: ((e: MessageEvent) => void) | null; postMessage: (m: unknown) => void };
  }[];
  streams: ReturnType<typeof fakeStream>[];
  contextTimeSec: { value: number };
  gum: ReturnType<typeof vi.fn>;
}

function harness(options: { gum?: () => Promise<MediaStream> } = {}): Harness {
  const nodes: Harness['nodes'] = [];
  const streams: ReturnType<typeof fakeStream>[] = [];
  const contextTimeSec = { value: 0 };

  const node = () => ({ connect: vi.fn((next: unknown) => next), disconnect: vi.fn() });
  const context = {
    get currentTime() {
      return contextTimeSec.value;
    },
    sampleRate: 48_000,
    destination: node(),
    createGain: vi.fn(() => ({ ...node(), gain: { value: 1 } })),
    createMediaStreamSource: vi.fn(() => node()),
    audioWorklet: { addModule: vi.fn(() => Promise.resolve()) },
    // Absent on purpose: the fallback path in `syncClock` is the one a phone
    // takes before the first render quantum.
    getOutputTimestamp: undefined,
  };

  const gum =
    options.gum !== undefined
      ? vi.fn(options.gum)
      : vi.fn(() => {
          const made = fakeStream();
          streams.push(made);
          return Promise.resolve(made.stream);
        });

  const WorkletNode = class {
    readonly port = {
      onmessage: null as ((e: MessageEvent) => void) | null,
      postMessage: vi.fn(),
    };
    connect(next: unknown) {
      return next;
    }
    disconnect() {}
    constructor() {
      nodes.push(this);
    }
  };
  (globalThis as unknown as { AudioWorkletNode: unknown }).AudioWorkletNode = WorkletNode;

  const source = new MicSource({
    media: { getUserMedia: gum, enumerateDevices: () => Promise.resolve([]) } as unknown as MediaDevices,
    audioContext: () => Promise.resolve(context as unknown as AudioContext),
    moduleUrl: 'about:blank',
  });
  return { source, nodes, streams, contextTimeSec, gum };
}

describe('MicSource.connect() called twice', () => {
  /**
   * Two taps on the microphone toggle, or a screen re-connecting while the
   * permission prompt is still up. The later call used to overwrite
   * `this.stream` and `this.node`; the earlier attempt's track and worklet
   * were left running with `receive` still wired to their port, so the phone's
   * recording indicator stayed on after `disconnect()` and every note reached
   * the engine twice.
   */
  it('closes the superseded attempt rather than leaving it running', async () => {
    const first = deferred<MediaStream>();
    const atPrompt = deferred<void>();
    const firstStream = fakeStream();
    const secondStream = fakeStream();
    let call = 0;
    const h = harness({
      gum: () => {
        call += 1;
        if (call === 1) {
          atPrompt.resolve();
          return first.promise;
        }
        return Promise.resolve(secondStream.stream);
      },
    });

    // The first attempt reaches the permission prompt and stays there.
    const a = h.source.connect();
    await atPrompt.promise;
    // A second tap starts a second attempt, which gets its stream at once.
    await h.source.connect();
    expect(h.source.state.connected).toBe(true);
    expect(h.nodes).toHaveLength(1);

    // Now the prompt from the first attempt finally answers.
    first.resolve(firstStream.stream);
    await a;

    // The first attempt's microphone track is released, not orphaned: without
    // this the phone's recording indicator stays on for the rest of the
    // session, whatever `disconnect()` is called.
    expect(firstStream.track.stop).toHaveBeenCalledTimes(1);
    // And only the second attempt's worklet is wired up, so a note is
    // reported once rather than twice.
    expect(h.nodes).toHaveLength(1);

    // One disconnect closes everything that is open.
    h.source.disconnect();
    expect(secondStream.track.stop).toHaveBeenCalledTimes(1);
    expect(h.source.state.connected).toBe(false);
  });

  it('an explicit disconnect while connecting does not get overridden', async () => {
    const pending = deferred<MediaStream>();
    const atPrompt = deferred<void>();
    const late = fakeStream();
    const h = harness({
      gum: () => {
        atPrompt.resolve();
        return pending.promise;
      },
    });

    const a = h.source.connect();
    await atPrompt.promise;
    h.source.disconnect(); // the owner switched the microphone back off

    pending.resolve(late.stream);
    await a;

    expect(h.source.state.connected).toBe(false);
    expect(late.track.stop).toHaveBeenCalledTimes(1);
    expect(h.nodes).toHaveLength(0);
  });
});

describe('MicSource note timestamps', () => {
  /**
   * `clockOffsetMs` was only set by a `level` message, which the worklet posts
   * once every eight hops — about 85 ms at 48 kHz. A note detected before the
   * first one was converted with an offset of 0, i.e. handed to the engine on
   * the AudioContext timeline instead of `performance.now()`. That is the
   * whole age of the context out. Connecting the microphone while a note is
   * already ringing is exactly when it happens.
   */
  it('stamps the first note on the performance clock, before any level message', async () => {
    const h = harness();
    // A context that has been open for a while, as it has been since the
    // first tap of the session.
    h.contextTimeSec.value = 600;
    await h.source.connect();

    const seen: InputNoteEvent[] = [];
    h.source.onNote((e) => seen.push(e));

    const port = h.nodes[0]?.port;
    expect(port).toBeDefined();
    const nowMs = performance.now();
    port?.onmessage?.({
      data: {
        type: 'notes',
        events: [{ kind: 'on', midi: 60, tMs: 600_000, confidence: 0.9 }],
      },
    } as MessageEvent);

    expect(seen).toHaveLength(1);
    // Within a second of the real `performance.now()`, not 600 s behind it.
    expect(Math.abs((seen[0] as InputNoteEvent).tMs - nowMs)).toBeLessThan(1_000);
  });
});
