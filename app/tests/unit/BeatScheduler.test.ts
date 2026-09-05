import { describe, expect, it } from 'vitest';
import { BeatScheduler } from '../../src/audio/BeatScheduler';

describe('BeatScheduler', () => {
  it('emits only beats inside the look-ahead horizon', () => {
    // 120 bpm = 0.5 s per beat; a 0.1 s horizon from t=0 covers beat 0 only.
    const s = new BeatScheduler({ bpm: 120, startTimeSec: 0 });
    expect(s.pull(0, 0.1).map((b) => b.timeSec)).toEqual([0]);
    expect(s.pull(0, 0.1)).toEqual([]);
    // Beat 1 is at 0.5 s; a horizon of 0.35 + 0.1 stops short of it.
    expect(s.pull(0.35, 0.1)).toEqual([]);
    expect(s.pull(0.45, 0.1).map((b) => b.timeSec)).toEqual([0.5]);
  });

  it('never returns the same beat twice across successive pulls', () => {
    const s = new BeatScheduler({ bpm: 120, startTimeSec: 0 });
    const seen: number[] = [];
    for (let t = 0; t < 3; t += 0.025) {
      for (const b of s.pull(t, 0.1)) seen.push(b.index);
    }
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('spaces beats by 60/bpm seconds', () => {
    const s = new BeatScheduler({ bpm: 90, startTimeSec: 10 });
    const beats = s.pull(10, 4);
    const gaps = beats.slice(1).map((b, i) => b.timeSec - (beats[i]?.timeSec ?? 0));
    for (const gap of gaps) expect(gap).toBeCloseTo(60 / 90, 10);
  });

  it('numbers count-in beats before bar 1 and flags them', () => {
    const s = new BeatScheduler({
      bpm: 240,
      beatsPerBar: 4,
      countInBars: 1,
      startTimeSec: 0,
    });
    const beats = s.pull(0, 2.1);
    expect(s.countInBeatCount).toBe(4);
    expect(beats.slice(0, 4).map((b) => [b.bar, b.beatInBar, b.isCountIn])).toEqual([
      [0, 1, true],
      [0, 2, true],
      [0, 3, true],
      [0, 4, true],
    ]);
    expect(beats.slice(4, 8).map((b) => [b.bar, b.beatInBar, b.isCountIn])).toEqual([
      [1, 1, false],
      [1, 2, false],
      [1, 3, false],
      [1, 4, false],
    ]);
  });

  it('supports a two-bar count-in and other time signatures', () => {
    const s = new BeatScheduler({ bpm: 600, beatsPerBar: 3, countInBars: 2, startTimeSec: 0 });
    const beats = s.pull(0, 1);
    expect(s.countInBeatCount).toBe(6);
    expect(beats.slice(0, 7).map((b) => b.bar)).toEqual([-1, -1, -1, 0, 0, 0, 1]);
  });

  it('accents beat 1 of every bar and nothing else', () => {
    const s = new BeatScheduler({ bpm: 600, beatsPerBar: 4, startTimeSec: 0 });
    expect(s.pull(0, 1).slice(0, 8).map((b) => b.isAccent)).toEqual([
      true, false, false, false, true, false, false, false,
    ]);
  });

  it('applies a tempo change from the next un-pulled beat, leaving committed ones alone', () => {
    const s = new BeatScheduler({ bpm: 60, startTimeSec: 0 });
    expect(s.pull(0, 2.1).map((b) => b.timeSec)).toEqual([0, 1, 2]);
    s.setBpm(120);
    // Beats 0..2 kept their 60 bpm spacing; from t=3 they are 0.5 s apart.
    expect(s.pull(3, 1.1).map((b) => b.timeSec)).toEqual([3, 3.5, 4]);
    expect(s.currentBpm).toBe(120);
  });

  it('caps a single pull so a huge time jump cannot hang the scheduler', () => {
    const s = new BeatScheduler({ bpm: 120, startTimeSec: 0 });
    expect(s.pull(0, 3600).length).toBe(1024);
  });

  it('rejects a non-positive bpm', () => {
    expect(() => new BeatScheduler({ bpm: 0, startTimeSec: 0 })).toThrow(RangeError);
    const s = new BeatScheduler({ bpm: 60, startTimeSec: 0 });
    expect(() => s.setBpm(-1)).toThrow(RangeError);
  });
});
