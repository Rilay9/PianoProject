/**
 * The acoustic loopback measurement, and the gate that keeps it away from a
 * MIDI user.
 *
 * Every case here is one the tap-along test it replaced either got wrong or
 * could not have expressed:
 *
 *   - It was reachable — and offered a "save" button — with a piano on the end
 *     of a USB cable, where both halves of the round trip are already known.
 *   - Its metronome had `countInBars: 0`, so the first click sounded the
 *     instant the button was pressed, and it fed *every* beat the metronome
 *     reported into its click list, so the obvious one-line fix would have
 *     turned "eight clicks" into four count-in clicks and four real ones.
 *   - It saved the whole measured delay as `inputLatencyMs` with no account of
 *     the output path the browser already reports, or of the latency a stored
 *     microphone calibration already subtracts at the source.
 */
import { describe, expect, it } from 'vitest';
import {
  detectClickOnsets,
  inputLatencyFromRoundTrip,
  loopbackSchedule,
  LOOPBACK_CLICKS,
  LOOPBACK_WINDOW,
  MAX_LOOPBACK_SPREAD_MS,
  MAX_SAVED_INPUT_LATENCY_MS,
  measurementClickTimes,
  micIsTheInput,
  scoreLoopback,
  whyNoLoopback,
  type LoopbackFrame,
} from '../../src/audio/loopbackLatency';

describe('who the measurement is offered to', () => {
  const mic = { micSupported: true };

  it('never a MIDI user: a connected piano ahead of the mic ends the walk', () => {
    // The default priority, with a cable plugged in. The old latency test was
    // on the Diagnostics screen unconditionally and this is exactly the person
    // it had nothing to tell.
    const path = { ...mic, inputPriority: ['midi', 'mic', 'none'], midiInputs: 1 };
    expect(micIsTheInput(path)).toBe(false);
    expect(whyNoLoopback(path)).toContain('USB MIDI');
  });

  it('never a MIDI user, even with several inputs and mic listed at all', () => {
    expect(micIsTheInput({ ...mic, inputPriority: ['midi', 'mic'], midiInputs: 3 })).toBe(false);
  });

  it('offers it when the mic is listed ahead of a connected piano', () => {
    // Mic first is a deliberate choice, and it is then the path being followed
    // however many cables are attached.
    expect(micIsTheInput({ ...mic, inputPriority: ['mic', 'midi', 'none'], midiInputs: 2 })).toBe(true);
  });

  it('offers it when MIDI is listed first but nothing is plugged in', () => {
    const path = { ...mic, inputPriority: ['midi', 'mic', 'none'], midiInputs: 0 };
    expect(micIsTheInput(path)).toBe(true);
    expect(whyNoLoopback(path)).toBeNull();
  });

  it('withholds it when the mic is not in the priority list at all', () => {
    const path = { ...mic, inputPriority: ['midi', 'none'], midiInputs: 0 };
    expect(micIsTheInput(path)).toBe(false);
    expect(whyNoLoopback(path)).toContain('Which input the app follows');
  });

  it('withholds it when the browser has no microphone', () => {
    const path = { micSupported: false, inputPriority: ['mic'], midiInputs: 0 };
    expect(micIsTheInput(path)).toBe(false);
    expect(whyNoLoopback(path)).toContain('no microphone');
  });

  it('always says why, so a missing button is never a mystery', () => {
    for (const path of [
      { ...mic, inputPriority: ['midi', 'mic', 'none'], midiInputs: 1 },
      { ...mic, inputPriority: ['midi', 'none'], midiInputs: 0 },
      { ...mic, inputPriority: [], midiInputs: 0 },
      { micSupported: false, inputPriority: ['mic'], midiInputs: 0 },
    ]) {
      const why = whyNoLoopback(path);
      expect(why, JSON.stringify(path)).not.toBeNull();
      expect((why ?? '').length).toBeGreaterThan(20);
    }
  });
});

describe('the run’s shape', () => {
  it('always has a lead-in click: countInBars is never 0', () => {
    // `latencyTest.ts` set `countInBars: 0`, so the very first click sounded
    // the moment the test started.
    const schedule = loopbackSchedule();
    expect(schedule.countInBars).toBeGreaterThanOrEqual(1);
    expect(schedule.leadInClicks).toBeGreaterThanOrEqual(1);
  });

  it('makes every click a downbeat, so they are all the same loudness', () => {
    // The metronome plays an accent at 0.6 and an off-beat at 0.35. Six clicks
    // of two amplitudes would make one detection threshold mean two things.
    expect(loopbackSchedule().beatsPerBar).toBe(1);
  });

  it('leaves the match window room inside one beat', () => {
    const beatMs = 60_000 / loopbackSchedule().bpm;
    expect(LOOPBACK_WINDOW.earlyMs + LOOPBACK_WINDOW.lateMs).toBeLessThan(beatMs);
  });

  it('waits out the whole window after the last click before scoring', () => {
    const schedule = loopbackSchedule();
    const beatMs = 60_000 / schedule.bpm;
    expect(schedule.totalMs).toBeGreaterThan((schedule.clicks + 1) * beatMs + LOOPBACK_WINDOW.lateMs);
  });

  it('does not measure against the lead-in clicks', () => {
    // The one-line "fix" to the old file — countInBars: 0 → 1 — would have
    // credited four count-in clicks as measurement clicks, because it pushed
    // every beat the metronome reported into the list it scored against.
    const beats = [
      { timeSec: 1.0, isCountIn: true },
      { timeSec: 1.75, isCountIn: false },
      { timeSec: 2.5, isCountIn: false },
    ];
    expect(measurementClickTimes(beats)).toEqual([1750, 2500]);
  });
});

/** A run of quiet quanta with a click of `height` starting at each of `at`. */
function frames(options: {
  quantumMs?: number;
  spanMs?: number;
  quiet?: number;
  height?: number;
  clickMs?: number;
  at: readonly number[];
}): LoopbackFrame[] {
  const quantumMs = options.quantumMs ?? 2.667;
  const spanMs = options.spanMs ?? 5000;
  const quiet = options.quiet ?? 0.0004;
  const height = options.height ?? 0.08;
  const clickMs = options.clickMs ?? 30;
  const out: LoopbackFrame[] = [];
  for (let atMs = 0; atMs < spanMs; atMs += quantumMs) {
    const inClick = options.at.some((start) => atMs >= start && atMs < start + clickMs);
    // A little wobble, so nothing here depends on a perfectly flat floor.
    out.push({ atMs, magnitude: inClick ? height : quiet * (1 + (out.length % 5) / 10) });
  }
  return out;
}

describe('finding the click that came back', () => {
  it('reports the first frame of each click, not the loudest', () => {
    // Taking the peak would bias every reading a quantum or two late, and a
    // latency measurement must never be nudged towards zero or away from it.
    const onsets = detectClickOnsets(frames({ at: [500, 1250, 2000] }));
    expect(onsets).toHaveLength(3);
    for (const [i, expected] of [500, 1250, 2000].entries()) {
      expect(onsets[i] ?? -1).toBeGreaterThanOrEqual(expected);
      expect(onsets[i] ?? -1).toBeLessThan(expected + 3);
    }
  });

  it('counts a click once however long the room rings', () => {
    // 200 ms of ring-out. Without the refractory window this is four onsets,
    // three of which land inside the *next* click's window.
    const onsets = detectClickOnsets(frames({ at: [500], clickMs: 200 }));
    expect(onsets).toHaveLength(1);
  });

  it('finds nothing in a silent room rather than the first thermal noise', () => {
    // Eight times nearly nothing is still nearly nothing: without an absolute
    // floor the very first frame clears a relative threshold.
    expect(detectClickOnsets(frames({ at: [], quiet: 0.00001 }))).toEqual([]);
  });

  it('finds nothing when the click never came back at all', () => {
    // Echo cancellation the browser would not let go of, or headphones in.
    expect(detectClickOnsets(frames({ at: [], quiet: 0.01 }))).toEqual([]);
  });

  it('will not call a whisper a click, however quiet the room is', () => {
    // −80 dBFS floor and a "click" 25 times above it: a huge relative rise and
    // still far too faint to be the phone's own speaker a foot away. Reporting
    // it would produce a plausible-looking round trip from a mis-detection.
    expect(detectClickOnsets(frames({ at: [500], quiet: 0.00004, height: 0.001 }))).toEqual([]);
    // The same run with a click the speaker could actually have made.
    expect(detectClickOnsets(frames({ at: [500], quiet: 0.00004, height: 0.05 }))).toHaveLength(1);
  });

  it('returns nothing for no frames at all', () => {
    expect(detectClickOnsets([])).toEqual([]);
  });
});

describe('scoring a run', () => {
  const clicks = [1000, 1750, 2500, 3250, 4000, 4750];

  it('credits each click with the detection inside its own window', () => {
    const heard = clicks.map((t) => t + 120);
    const result = scoreLoopback(clicks, heard, LOOPBACK_CLICKS);
    expect(result.heard).toBe(6);
    expect(result.roundTripMs).toBeCloseTo(120, 6);
    expect(result.usable).toBe(true);
    expect(result.why).toBeNull();
  });

  it('will not credit a detection that arrived before its click', () => {
    // Sound cannot arrive before it is emitted; anything early is something
    // else being heard, and the window is one-sided because of it.
    expect(scoreLoopback([1000], [1000 - LOOPBACK_WINDOW.earlyMs - 1])).toMatchObject({ heard: 0 });
    expect(scoreLoopback([1000], [1000 + 10])).toMatchObject({ heard: 1 });
  });

  it('refuses a run where too few clicks came back', () => {
    const result = scoreLoopback(clicks, [1120, 1870], LOOPBACK_CLICKS);
    expect(result.usable).toBe(false);
    expect(result.why).toContain('2 of 6');
  });

  it('refuses a run whose readings disagree, however many came back', () => {
    // This is the check the tap test could not have had. Six machine readings
    // of one round trip land within a few ms; a spread this wide means
    // something other than the click was found, and its median is not the
    // latency however confident the number looks.
    const scattered = [1010, 1850, 2520, 3400, 4030, 4900];
    const result = scoreLoopback(clicks, scattered, LOOPBACK_CLICKS);
    expect(result.heard).toBe(6);
    expect(result.spreadMs).toBeGreaterThan(MAX_LOOPBACK_SPREAD_MS);
    expect(result.usable).toBe(false);
    expect(result.why).toContain('disagree');
  });

  it('survives one stray bang without poisoning the rest', () => {
    const heard = [1080, 1200, 1830, 2580, 3330, 4080, 4830];
    const result = scoreLoopback(clicks, heard, LOOPBACK_CLICKS);
    expect(result.heard).toBe(6);
    expect(result.roundTripMs).toBeCloseTo(80, 6);
    expect(result.usable).toBe(true);
  });
});

describe('what gets stored', () => {
  it('takes the output path off, because the app already allows for it', () => {
    // `clock.ts` reads `AudioContext.outputLatency` and folds it into every
    // conversion. Saving the whole round trip would count it twice — once in
    // the clock and once in the engine's subtraction.
    expect(inputLatencyFromRoundTrip({ roundTripMs: 180, outputLatencyMs: 60, flightMs: 2 })).toBe(118);
  });

  it('takes off what a stored calibration already subtracts at the source', () => {
    // `MicSource.toPerformanceMs` subtracts the calibration's own latency
    // before the engine sees an event, and the engine then subtracts
    // `inputLatencyMs` as well.
    expect(
      inputLatencyFromRoundTrip({
        roundTripMs: 180,
        outputLatencyMs: 60,
        flightMs: 2,
        alreadyCompensatedMs: 40,
      }),
    ).toBe(78);
  });

  it('never stores a negative correction', () => {
    // A round trip shorter than the output latency the browser reports is the
    // browser being wrong, not the app being early.
    expect(inputLatencyFromRoundTrip({ roundTripMs: 20, outputLatencyMs: 60 })).toBe(0);
  });

  it('clamps a wild reading rather than passing it to the engine', () => {
    expect(inputLatencyFromRoundTrip({ roundTripMs: 5000, outputLatencyMs: 10 })).toBe(
      MAX_SAVED_INPUT_LATENCY_MS,
    );
  });

  it('stores nothing at all from a run that measured nothing', () => {
    expect(inputLatencyFromRoundTrip({ roundTripMs: NaN, outputLatencyMs: 20 })).toBe(0);
  });
});
