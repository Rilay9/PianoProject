import { describe, expect, it, vi } from 'vitest';
import { ScreenKeyboardSource } from '../../src/midi/ScreenKeyboardSource';
import {
  ReplaySource,
  parseReplayScript,
  type TimerHandle,
} from '../../src/midi/ReplaySource';
import type { InputNoteEvent } from '../../src/midi/types';

describe('ScreenKeyboardSource', () => {
  function make() {
    let t = 0;
    const source = new ScreenKeyboardSource({ now: () => (t += 10) });
    const notes: InputNoteEvent[] = [];
    source.onNote((e) => notes.push(e));
    return { source, notes };
  }

  it('emits noteOn/noteOff tagged as the screen source with full confidence', async () => {
    const { source, notes } = make();
    await source.connect();
    source.noteOn(60, 80);
    source.noteOff(60);
    expect(notes).toEqual([
      { kind: 'noteOn', midi: 60, velocity: 80, tMs: 10, confidence: 1, source: 'screen' },
      { kind: 'noteOff', midi: 60, velocity: 0, tMs: 20, confidence: 1, source: 'screen' },
    ]);
  });

  it('ignores a repeated press of a held key (a finger sliding across keys)', () => {
    const { source, notes } = make();
    source.noteOn(60);
    source.noteOn(60);
    expect(notes).toHaveLength(1);
    expect(source.pressedNotes).toEqual([60]);
  });

  it('ignores a release of a key that is not held', () => {
    const { source, notes } = make();
    source.noteOff(60);
    expect(notes).toEqual([]);
  });

  it('releaseAll() clears every held key, so pointercancel cannot strand one', () => {
    const { source, notes } = make();
    source.noteOn(60);
    source.noteOn(64);
    notes.length = 0;
    source.releaseAll();
    expect(notes.map((n) => [n.kind, n.midi])).toEqual([
      ['noteOff', 60],
      ['noteOff', 64],
    ]);
    expect(source.pressedNotes).toEqual([]);
  });

  it('reports connection state', async () => {
    const { source } = make();
    const states: boolean[] = [];
    source.onStateChange((s) => states.push(s.connected));
    await source.connect();
    source.disconnect();
    expect(states).toEqual([true, false]);
  });
});

describe('parseReplayScript', () => {
  it('sorts messages by time so hand-written scripts need not be ordered', () => {
    const script = parseReplayScript({
      messages: [
        { atMs: 100, bytes: [0x80, 60, 0] },
        { atMs: 0, bytes: [0x90, 60, 100] },
      ],
    });
    expect(script.messages.map((m) => m.atMs)).toEqual([0, 100]);
  });

  it.each([
    [null, 'Replay script must be an object'],
    [{}, 'Replay script must have a "messages" array'],
    [{ messages: [{ bytes: [] }] }, 'messages[0].atMs must be a finite number'],
    [{ messages: [{ atMs: 0, bytes: 'x' }] }, 'messages[0].bytes must be an array of numbers'],
  ])('rejects invalid input with a usable message', (input, message) => {
    expect(() => parseReplayScript(input)).toThrow(message);
  });
});

describe('ReplaySource', () => {
  /**
   * Runs scheduled callbacks in time order without any real waiting. Handles
   * are typed as `TimerHandle` (opaque) rather than `number` so the fake
   * satisfies the same contract as the real `setTimeout`-backed default.
   */
  function fakeTimers() {
    const queue: { at: number; fn: () => void; handle: TimerHandle }[] = [];
    let nextHandle = 1;
    return {
      schedule: (fn: () => void, delayMs: number): TimerHandle => {
        const handle: TimerHandle = nextHandle++;
        queue.push({ at: delayMs, fn, handle });
        return handle;
      },
      cancel: (handle: TimerHandle) => {
        const i = queue.findIndex((q) => q.handle === handle);
        if (i >= 0) queue.splice(i, 1);
      },
      runAll: () => {
        queue.sort((a, b) => a.at - b.at);
        const pending = queue.splice(0, queue.length);
        for (const q of pending) q.fn();
      },
      get pending() {
        return queue.length;
      },
    };
  }

  it('replays a script at its relative times, based on the clock at connect()', async () => {
    const timers = fakeTimers();
    const source = new ReplaySource(
      {
        name: 'C major chord',
        messages: [
          { atMs: 0, bytes: [0x90, 60, 100] },
          { atMs: 0, bytes: [0x90, 64, 100] },
          { atMs: 0, bytes: [0x90, 67, 100] },
          { atMs: 500, bytes: [0x90, 60, 0] },
        ],
      },
      { ...timers, now: () => 1000 },
    );
    const notes: InputNoteEvent[] = [];
    source.onNote((e) => notes.push(e));
    await source.connect();
    timers.runAll();
    expect(notes.map((n) => [n.kind, n.midi, n.tMs])).toEqual([
      ['noteOn', 60, 1000],
      ['noteOn', 64, 1000],
      ['noteOn', 67, 1000],
      ['noteOff', 60, 1500],
    ]);
    expect(notes.every((n) => n.source === 'replay' && n.confidence === 1)).toBe(true);
    expect(source.name).toBe('C major chord');
  });

  it('forwards non-note messages to onMessage only', async () => {
    const timers = fakeTimers();
    const source = new ReplaySource(
      { messages: [{ atMs: 0, bytes: [0xb0, 64, 127] }] },
      { ...timers, now: () => 0 },
    );
    const notes: InputNoteEvent[] = [];
    const kinds: string[] = [];
    source.onNote((e) => notes.push(e));
    source.onMessage((m) => kinds.push(m.detail));
    await source.connect();
    timers.runAll();
    expect(notes).toEqual([]);
    expect(kinds).toEqual(['sustain']);
  });

  it('calls onFinished after the last message', async () => {
    const timers = fakeTimers();
    const onFinished = vi.fn();
    const source = new ReplaySource(
      { messages: [{ atMs: 0, bytes: [0x90, 60, 100] }] },
      { ...timers, now: () => 0, onFinished },
    );
    await source.connect();
    expect(onFinished).not.toHaveBeenCalled();
    timers.runAll();
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(source.connected).toBe(false);
  });

  it('disconnect() cancels everything still pending', async () => {
    const timers = fakeTimers();
    const source = new ReplaySource(
      {
        messages: [
          { atMs: 0, bytes: [0x90, 60, 100] },
          { atMs: 1000, bytes: [0x80, 60, 0] },
        ],
      },
      { ...timers, now: () => 0 },
    );
    const notes: InputNoteEvent[] = [];
    source.onNote((e) => notes.push(e));
    await source.connect();
    expect(timers.pending).toBe(2);
    source.disconnect();
    expect(timers.pending).toBe(0);
    timers.runAll();
    expect(notes).toEqual([]);
  });

  it('finishes immediately for an empty script', async () => {
    const timers = fakeTimers();
    const onFinished = vi.fn();
    const source = new ReplaySource({ messages: [] }, { ...timers, now: () => 0, onFinished });
    await source.connect();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
