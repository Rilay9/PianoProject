import { describe, expect, it } from 'vitest';
import { EMPTY_TAP_STATE, MAX_BPM, MIN_BPM, TAP_RESET_MS, tap } from '../../src/audio/tapTempo';

/** Taps at a steady interval, starting at t=1000. */
function tapAt(intervals: number[]) {
  let state = EMPTY_TAP_STATE;
  let now = 1_000;
  state = tap(state, now);
  for (const gap of intervals) {
    now += gap;
    state = tap(state, now);
  }
  return state;
}

describe('tapTempo', () => {
  it('says nothing after a single tap', () => {
    expect(tap(EMPTY_TAP_STATE, 1_000).bpm).toBeNull();
  });

  it('reads 120 bpm from taps half a second apart', () => {
    expect(tapAt([500]).bpm).toBe(120);
    expect(tapAt([500, 500, 500]).bpm).toBe(120);
  });

  it('reads 60 bpm from taps a second apart', () => {
    expect(tapAt([1_000, 1_000]).bpm).toBe(60);
  });

  it('averages an uneven tap so one shaky beat does not swing it', () => {
    // 500, 520, 480 → mean 500 → 120 bpm.
    expect(tapAt([500, 520, 480]).bpm).toBe(120);
  });

  it('forgets everything after a long gap instead of averaging across it', () => {
    let state = tapAt([500, 500]);
    expect(state.bpm).toBe(120);
    state = tap(state, state.taps.at(-1)! + TAP_RESET_MS + 1);
    expect(state.bpm).toBeNull();
    expect(state.taps).toHaveLength(1);
  });

  it('only averages the recent taps, so a new tempo takes over', () => {
    let state = EMPTY_TAP_STATE;
    let now = 1_000;
    state = tap(state, now);
    for (let i = 0; i < 8; i += 1) {
      now += 1_000; // 60 bpm
      state = tap(state, now);
    }
    expect(state.bpm).toBe(60);
    for (let i = 0; i < 5; i += 1) {
      now += 500; // 120 bpm
      state = tap(state, now);
    }
    expect(state.bpm).toBe(120);
  });

  it('clamps to the range the bpm field accepts', () => {
    expect(tapAt([10]).bpm).toBe(MAX_BPM);
    // 2400 ms is 25 bpm, and still inside the reset window, so it clamps
    // rather than restarting. Anything slower than the window is a new
    // attempt by definition.
    expect(tapAt([2_400]).bpm).toBe(MIN_BPM);
  });

  it('rounds to a whole number', () => {
    const bpm = tapAt([617, 617, 617]).bpm;
    expect(bpm).toBe(Math.round(bpm!));
  });
});
