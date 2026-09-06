/**
 * The rhythm drill's count-in and its clock (P8 carry-over, done in P12b).
 *
 * The defect this closes: `RhythmDrill` started its clock when the card
 * appeared, so the learner had to guess the downbeat and every tap was scored
 * against a moment nothing had marked. Nothing was audibly wrong — the numbers
 * were simply measuring the wrong thing.
 *
 * What has to be true now is one sentence: **the drill's clock and the
 * metronome's are the same clock**, so a tap exactly on click n is exactly on
 * time. The metronome schedules on `AudioContext.currentTime` and input events
 * are stamped on `performance.now()`, so "the same clock" means the conversion
 * in `audio/clock.ts` and nothing else, and that is what these tests drive.
 */
import { describe, expect, it } from 'vitest';
import { BeatScheduler } from '../../src/audio/BeatScheduler';
import { audioTimeToPerformanceMs, type AudioClockAnchor } from '../../src/audio/clock';
import { RhythmDrill } from '../../src/engine/drills/special';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import type { CatalogItem } from '../../src/curriculum/types';
import type { EngineInput } from '../../src/engine/types';
import { FakeClock } from './helpers/engineHarness';

function tap(tMs: number): EngineInput {
  return { kind: 'noteOn', midi: 60, velocity: 90, tMs, confidence: 1 };
}

const BPM = 120;
const BEAT_MS = 60_000 / BPM;

/** Four quarter notes at 120: 0, 500, 1000, 1500 ms from the first beat. */
const PATTERN = [0, 1, 2, 3].map((beat) => beat * BEAT_MS);

describe('the count-in', () => {
  it('is one bar of the drill’s own metre', () => {
    const item = {
      id: 'drill.rhythm.three-four',
      drill: { kind: 'rhythm', params: { timeSig: '3/4', bars: 2, bpm: BPM } },
    } as unknown as CatalogItem;
    const drill = drillFromCatalog(item) as RhythmDrill;
    // Three clicks before a 3/4 row, not four.
    expect(drill.countInBeats).toBe(3);
    expect(drill.bpm).toBe(BPM);
  });

  it('defaults to a bar of four', () => {
    expect(new RhythmDrill({ pattern: PATTERN, bpm: BPM }).countInBeats).toBe(4);
  });

  it('reports the tempo and the count-in in the result, so the screen can click', () => {
    const drill = new RhythmDrill({ pattern: PATTERN, bpm: BPM, clock: new FakeClock(0) });
    drill.next();
    expect(drill.result().detail?.bpm).toBe(BPM);
    expect(drill.result().detail?.countInBeats).toBe(4);
  });
});

describe('the drill’s clock is the metronome’s clock', () => {
  /**
   * The screen's arithmetic, in one place: a metronome started at a known
   * audio time, one bar of count-in, and the conversion of bar 1 beat 1 onto
   * the timeline the input events carry.
   */
  function countInAndStart(options: {
    /** AudioContext time of the first count-in click. */
    startTimeSec: number;
    anchor: AudioClockAnchor;
    countInBeats?: number;
  }): { drill: RhythmDrill; firstBeatMs: number } {
    const countInBeats = options.countInBeats ?? 4;
    const scheduler = new BeatScheduler({
      bpm: BPM,
      beatsPerBar: countInBeats,
      countInBars: 1,
      startTimeSec: options.startTimeSec,
    });
    // Everything the screen would see in the first few look-ahead windows.
    const beats = scheduler.pull(options.startTimeSec + 100, 0);
    const downbeat = beats.find((beat) => !beat.isCountIn && beat.bar === 1 && beat.beatInBar === 1);
    expect(downbeat, 'the scheduler produced no bar 1 beat 1').toBeDefined();

    const drill = new RhythmDrill({
      pattern: PATTERN,
      bpm: BPM,
      countInBeats,
      // A clock that would give a *different* answer, so a test that passes
      // cannot be passing because the fallback happened to agree.
      clock: new FakeClock(999_999),
    });
    const firstBeatMs = audioTimeToPerformanceMs(options.anchor, (downbeat as { timeSec: number }).timeSec);
    drill.startAt(firstBeatMs);
    drill.next();
    return { drill, firstBeatMs };
  }

  const anchor: AudioClockAnchor = {
    contextTimeSec: 10,
    performanceMs: 40_000,
    outputLatencySec: 0.02,
  };

  it('a tap exactly on click n scores an offset of 0 ms', () => {
    const { drill, firstBeatMs } = countInAndStart({ startTimeSec: 12, anchor });
    for (const beat of [0, 1, 2, 3]) {
      drill.feed(tap(firstBeatMs + beat * BEAT_MS));
    }
    const result = drill.result();
    expect(result.correct).toBe(4);
    expect(result.accuracy).toBe(1);
    expect(result.detail?.meanOffsetMs).toBe(0);
    expect(result.detail?.extraTaps).toBe(0);
  });

  it('counts the count-in bar: the pattern starts after it, not with it', () => {
    const startTimeSec = 12;
    const { firstBeatMs } = countInAndStart({ startTimeSec, anchor });
    // Four count-in clicks at 120 bpm is two seconds, and the anchor's output
    // latency shifts everything by 20 ms.
    const firstClickMs = audioTimeToPerformanceMs(anchor, startTimeSec);
    expect(firstBeatMs - firstClickMs).toBeCloseTo(4 * BEAT_MS, 6);
  });

  it('a tap on the count-in clicks is not on the pattern', () => {
    const { drill, firstBeatMs } = countInAndStart({ startTimeSec: 12, anchor });
    // The learner taps along with the count-in and then plays the pattern.
    for (const beat of [-4, -3, -2, -1]) drill.feed(tap(firstBeatMs + beat * BEAT_MS));
    for (const beat of [0, 1, 2, 3]) drill.feed(tap(firstBeatMs + beat * BEAT_MS));
    const result = drill.result();
    expect(result.correct).toBe(4);
    // The four count-in taps are extras, not misses: the pattern was played
    // perfectly and something else was played over the top of the count-in.
    expect(result.detail?.extraTaps).toBe(4);
  });

  it('a tap half a beat late is scored as half a beat late', () => {
    const { drill, firstBeatMs } = countInAndStart({ startTimeSec: 12, anchor });
    drill.feed(tap(firstBeatMs + 100));
    expect(drill.result().detail?.meanOffsetMs).toBe(100);
  });

  it('without a start time it falls back to its own clock', () => {
    // No audio on the device is a reason to lose the click, not the drill.
    const clock = new FakeClock(5_000);
    const drill = new RhythmDrill({ pattern: PATTERN, bpm: BPM, clock });
    drill.next();
    expect(drill.startedAt).toBe(5_000);
    drill.feed(tap(5_000));
    expect(drill.result().detail?.meanOffsetMs).toBe(0);
  });

  it('the output latency is part of the answer, not an error in it', () => {
    // `currentTime` is when a sample is handed to the graph, not when it is
    // heard. On a phone that gap is the same size as the number being
    // measured, so a conversion that ignored it would score every tap early.
    const withLatency: AudioClockAnchor = { ...anchor, outputLatencySec: 0.15 };
    const a = countInAndStart({ startTimeSec: 12, anchor });
    const b = countInAndStart({ startTimeSec: 12, anchor: withLatency });
    expect(b.firstBeatMs - a.firstBeatMs).toBeCloseTo(130, 6);
    // …and a tap on the click is still exactly on time in both.
    b.drill.feed(tap(b.firstBeatMs));
    expect(b.drill.result().detail?.meanOffsetMs).toBe(0);
  });
});
