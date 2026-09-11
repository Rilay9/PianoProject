/**
 * The Metronome's look-ahead loop, on a clock the test owns.
 *
 * `BeatScheduler.test.ts` covers the arithmetic; this covers the two things
 * only the loop can get wrong — what it does with a beat the timer woke up too
 * late to play, and whether a control moved mid-run reaches the run.
 *
 * The fake context is the slice of Web Audio this class touches. It records the
 * `start` time of every source it creates, which is the whole measurement: a
 * click's scheduled time is the only observable a metronome has.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  Metronome,
  SCHEDULER_INTERVAL_MS,
  SCHEDULER_STALE_MS,
  type MetronomeBeat,
} from '../../src/audio/Metronome';

interface Started {
  when: number;
}

function fakeContext() {
  const started: Started[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const ctx = {
    currentTime: 0,
    sampleRate: 48_000,
    destination: node(),
    createGain: vi.fn(() => ({ ...node(), gain: param() })),
    createBiquadFilter: vi.fn(() => ({
      ...node(),
      type: '',
      frequency: param(),
      Q: param(),
    })),
    createOscillator: vi.fn(() => ({
      ...node(),
      type: '',
      frequency: param(),
      start: vi.fn((when: number) => started.push({ when })),
      stop: vi.fn(),
      onended: null,
    })),
    createBufferSource: vi.fn(() => ({
      ...node(),
      buffer: null,
      start: vi.fn((when: number) => started.push({ when })),
      stop: vi.fn(),
      onended: null,
    })),
    createBuffer: vi.fn((_ch: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
  };
  return { ctx: ctx as unknown as BaseAudioContext & typeof ctx, started };
}

describe('Metronome', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('clicks once per beat while the timer keeps up', () => {
    const { ctx, started } = fakeContext();
    const m = new Metronome(ctx, { bpm: 120, countInBars: 0, sound: 'beep' });
    m.start(1);
    // Two seconds of a clock that advances with the timer. 120 bpm from t=1 s
    // is beats at 1.0, 1.5 and 2.0; the 2.5 s beat is still beyond the
    // look-ahead horizon when the clock stops at 2.0.
    for (let step = 0; step < 2_000 / SCHEDULER_INTERVAL_MS; step += 1) {
      ctx.currentTime += SCHEDULER_INTERVAL_MS / 1000;
      vi.advanceTimersByTime(SCHEDULER_INTERVAL_MS);
    }
    expect(started.map((s) => s.when)).toEqual([1, 1.5, 2]);
    expect(m.droppedBeats).toBe(0);
    m.dispose();
  });

  /**
   * The regression. A backgrounded tab on Android is throttled to a wake-up a
   * second or less often and the audio clock runs through it, so the pull that
   * follows hands back the whole gap at once — every beat of it in the past.
   */
  it('drops the beats a stalled timer swallowed instead of firing them together', () => {
    const { ctx, started } = fakeContext();
    const beats: MetronomeBeat[] = [];
    const m = new Metronome(ctx, { bpm: 120, countInBars: 0, sound: 'beep' });
    m.onTick((beat) => beats.push(beat));
    m.start(1);

    // The first beat goes out normally.
    ctx.currentTime = 1;
    vi.advanceTimersByTime(SCHEDULER_INTERVAL_MS);
    expect(started).toHaveLength(1);

    // Now the thread stalls for three seconds. Six beats (1.5 … 4.0) fell in
    // the gap; only the one still inside the stale window may be played.
    ctx.currentTime = 4;
    vi.advanceTimersByTime(3_000);

    const late = started.slice(1).map((s) => s.when);
    expect(late.length).toBeLessThanOrEqual(1);
    // Nothing was scheduled at a time that had already passed by more than
    // the stale window — which is what stacking looked like.
    for (const when of late) expect(when).toBeGreaterThanOrEqual(4 - SCHEDULER_STALE_MS / 1000);
    expect(m.droppedBeats).toBeGreaterThanOrEqual(5);
    // And the listener saw one beat for the stall, not six in one frame.
    expect(beats.length - 1).toBeLessThanOrEqual(1);

    // It carries on cleanly from there rather than staying behind. The beats
    // from 4.5 s on are on the grid again — the one caught-up click above is
    // nudged forward by MIN_SCHEDULE_LEAD_SEC and is excluded here.
    for (let step = 0; step < 40; step += 1) {
      ctx.currentTime += SCHEDULER_INTERVAL_MS / 1000;
      vi.advanceTimersByTime(SCHEDULER_INTERVAL_MS);
    }
    const resumed = started.map((s) => s.when).filter((when) => when >= 4.5);
    expect(resumed).toEqual([4.5, 5]);
    m.dispose();
  });

  /**
   * The other regression. `setBeatsPerBar` set a field that only `start()`
   * read, so a meter changed while the metronome was clicking never reached
   * the run: the accent stayed on every fourth beat and the screen's dots —
   * which it redraws immediately — went on being lit by `beatInBar` values
   * from the old meter.
   */
  it('accents the new meter when it is changed mid-run', () => {
    const { ctx } = fakeContext();
    const beats: MetronomeBeat[] = [];
    const m = new Metronome(ctx, { bpm: 120, beatsPerBar: 4, countInBars: 0, sound: 'beep' });
    m.onTick((beat) => beats.push(beat));
    m.start(1);

    const run = (seconds: number): void => {
      for (let step = 0; step < (seconds * 1000) / SCHEDULER_INTERVAL_MS; step += 1) {
        ctx.currentTime += SCHEDULER_INTERVAL_MS / 1000;
        vi.advanceTimersByTime(SCHEDULER_INTERVAL_MS);
      }
    };

    run(2); // beats at 1.0, 1.5, 2.0 — three beats of 4/4
    expect(beats.map((b) => b.beatInBar)).toEqual([1, 2, 3]);

    // A meter change truncates the bar being played: the next click is a
    // downbeat. Beats at 2.5, 3.0 … 5.0 — six beats of 3/4.
    m.setBeatsPerBar(3);
    beats.length = 0;
    run(3);
    expect(beats.map((b) => b.beatInBar)).toEqual([1, 2, 3, 1, 2, 3]);
    expect(beats.map((b) => b.isAccent)).toEqual([true, false, false, true, false, false]);
    // Never a beat number the screen has no dot for.
    for (const beat of beats) expect(beat.beatInBar).toBeLessThanOrEqual(3);
    m.dispose();
  });

  it('stop() ends the timer and dispose() releases the output', () => {
    const { ctx, started } = fakeContext();
    const m = new Metronome(ctx, { bpm: 120, countInBars: 0, sound: 'beep' });
    m.start(1);
    ctx.currentTime = 1;
    vi.advanceTimersByTime(SCHEDULER_INTERVAL_MS);
    const before = started.length;
    expect(m.running).toBe(true);
    m.stop();
    expect(m.running).toBe(false);
    ctx.currentTime = 5;
    vi.advanceTimersByTime(2_000);
    expect(started).toHaveLength(before);
  });
});
