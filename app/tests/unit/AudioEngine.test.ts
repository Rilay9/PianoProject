import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../../src/audio/AudioEngine';

/** The slice of AudioContext this module touches. */
function fakeContext() {
  const gainNode = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
  const ctx = {
    state: 'suspended' as AudioContextState,
    currentTime: 0,
    destination: {},
    createGain: vi.fn(() => gainNode),
    resume: vi.fn(function (this: { state: AudioContextState }) {
      this.state = 'running';
      return Promise.resolve();
    }),
    close: vi.fn(() => Promise.resolve()),
  };
  return { ctx, gainNode };
}

function makeEngine() {
  const { ctx, gainNode } = fakeContext();
  const factory = vi.fn(() => ctx as unknown as AudioContext);
  return { engine: new AudioEngine({ contextFactory: factory }), ctx, gainNode, factory };
}

describe('AudioEngine', () => {
  it('creates no context until the first gesture', () => {
    const { engine, factory } = makeEngine();
    expect(engine.state).toBe('uninitialised');
    expect(engine.contextOrNull).toBeNull();
    expect(factory).not.toHaveBeenCalled();
  });

  it('creates and resumes the context on ensureStarted()', async () => {
    const { engine, ctx, factory } = makeEngine();
    await engine.ensureStarted();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    expect(engine.state).toBe('running');
    expect(engine.masterGain).not.toBeNull();
  });

  it('reuses the same context on repeated calls', async () => {
    const { engine, factory } = makeEngine();
    const a = await engine.ensureStarted();
    const b = await engine.ensureStarted();
    expect(a).toBe(b);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('resumes again if the context was suspended in the meantime', async () => {
    const { engine, ctx } = makeEngine();
    await engine.ensureStarted();
    ctx.state = 'suspended';
    expect(engine.state).toBe('suspended');
    await engine.ensureStarted();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
  });

  it('reports "unsupported" and throws when Web Audio is missing', async () => {
    const engine = new AudioEngine({ contextFactory: null });
    expect(engine.supported).toBe(false);
    expect(engine.state).toBe('unsupported');
    await expect(engine.ensureStarted()).rejects.toThrow(/not available/);
  });

  it('startOnFirstGesture() starts audio once, then unsubscribes', async () => {
    const { engine, factory } = makeEngine();
    const handlers = new Map<string, EventListener>();
    const target = {
      addEventListener: vi.fn((type: string, fn: EventListener) => handlers.set(type, fn)),
      removeEventListener: vi.fn((type: string) => handlers.delete(type)),
    };
    engine.startOnFirstGesture(target);
    expect(target.addEventListener).toHaveBeenCalledTimes(3);
    handlers.get('pointerdown')?.(new Event('pointerdown'));
    await Promise.resolve();
    await Promise.resolve();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(target.removeEventListener).toHaveBeenCalledTimes(3);
    expect(handlers.size).toBe(0);
  });

  it('clamps volume to 0..1 and applies it to the master gain', async () => {
    const { engine, gainNode } = makeEngine();
    await engine.ensureStarted();
    engine.setVolume(0.4);
    expect(gainNode.gain.value).toBeCloseTo(0.4);
    engine.setVolume(5);
    expect(gainNode.gain.value).toBe(1);
    engine.setVolume(-1);
    expect(gainNode.gain.value).toBe(0);
    expect(engine.currentVolume).toBe(0);
  });

  it('close() releases the context and returns to "uninitialised"', async () => {
    const { engine, ctx } = makeEngine();
    await engine.ensureStarted();
    await engine.close();
    expect(ctx.close).toHaveBeenCalledTimes(1);
    expect(engine.state).toBe('uninitialised');
  });

  it('notifies state listeners', async () => {
    const { engine } = makeEngine();
    const seen: string[] = [];
    engine.onStateChange((s) => seen.push(s));
    await engine.ensureStarted();
    await engine.close();
    expect(seen).toEqual(['running', 'uninitialised']);
  });
});
