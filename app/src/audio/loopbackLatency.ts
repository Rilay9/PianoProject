// The acoustic loopback measurement: the arithmetic and the judgement.
//
// `loopbackRun.ts` is the half with a clock and a microphone in it; everything
// here is pure, so the two parts that decide whether a number is worth acting
// on — where the click came back, and whether the readings agree — are
// unit-tested rather than eyeballed on a phone.
//
// ---------------------------------------------------------------------------
// Why this replaced the tap-along test.
//
// The old test played eight clicks and asked the learner to tap on each one,
// then took the median of tap-minus-click. That measures the input path *plus
// the human*: tapping spread is 20–50 ms and people anticipate a beat by
// another 20–80 ms, so the noise floor of the instrument was an order of
// magnitude larger than the thing it was reading. Careful matching and outlier
// rejection on top of that is a well-built gauge with no needle.
//
// A speaker and a microphone have no human in them. Emit a click, listen for
// it, and the gap is the entire round trip — output buffer, air, input buffer
// — measured by the machine in a few seconds and repeatable to a couple of
// milliseconds. It is how a DAW calibrates, and it needs exactly the speaker-
// plus-microphone arrangement that mic mode already assumes.
//
// ---------------------------------------------------------------------------
// Why a MIDI user never sees any of it.
//
// Over USB MIDI both halves are already known. `AudioContext.outputLatency` is
// read in `clock.ts` and folded into every timestamp the app converts, and
// MIDI input latency is single-digit milliseconds. There is nothing left to
// measure, so `micIsTheInput` gates the whole thing and the Diagnostics screen
// does not draw the section at all when the answer is no.

import {
  matchTapsToClicks,
  median,
  summariseLatency,
  type LatencySummary,
  type MatchWindow,
} from './latency';

/** Clicks the measurement uses. Six is ~5 s including the lead-in. */
export const LOOPBACK_CLICKS = 6;

/**
 * Clicks per minute: 750 ms apart.
 *
 * Wide enough that the match window — which has to cover a slow phone's whole
 * round trip — cannot reach the next click. `DEFAULT_MATCH_WINDOW` spans
 * exactly 600 ms, which is why the old 1000 ms beat was described as only
 * barely safe; 750 with the window below leaves 145 ms of daylight.
 */
export const LOOPBACK_BPM = 80;

/**
 * How a detected click is credited to an emitted one.
 *
 * Asymmetric to the point of one-sided, unlike the tap window: sound cannot
 * arrive before it is emitted, so anything early is a mis-detection rather
 * than an anticipatory reading. The 5 ms of slack is for the quantum the
 * timestamp is quantised to and for a clock whose two ends were sampled a
 * moment apart, not for a real negative delay.
 */
export const LOOPBACK_WINDOW: Readonly<MatchWindow> = { earlyMs: 5, lateMs: 600 };

/** Fewer clicks than this came back and the median is a guess, not a reading. */
export const MIN_LOOPBACK_CLICKS = 4;

/**
 * Half-IQR above which the run is reported as a failure rather than a reading.
 *
 * This is the part the tap test could not have: a machine measuring a machine
 * agrees with itself. Six readings of the same round trip land within a few
 * milliseconds of each other, so a spread of 15 ms means something else was
 * detected — a door, a chair, the piano — and the median is not the latency.
 */
export const MAX_LOOPBACK_SPREAD_MS = 15;

/**
 * How far above the quiet level a frame has to rise to be a click.
 *
 * Eighteen dB. The click is a sine at the notched metronome frequency and the
 * Goertzel bin rejects everything else, so the margin in a real room is far
 * larger than this; the threshold is set where it is so that a phone held at
 * arm's length from its own speaker still clears it.
 */
export const ONSET_RISE = 8;

/**
 * Nothing quieter than this is ever an onset, however quiet the room.
 *
 * −54 dBFS. Without a floor, a silent room gives a median near zero and eight
 * times nearly nothing is still nearly nothing, so the first frame of thermal
 * noise would be reported as the click.
 */
export const MIN_ONSET_MAGNITUDE = 0.002;

/**
 * Detections closer together than this are one click.
 *
 * The click is 30 ms long and a room rings for longer; without this each click
 * would be found three or four times and every one after the first would be
 * matched to the *next* emitted click, which is the failure mode that made the
 * old tap matcher walk clicks rather than taps.
 */
export const ONSET_REFRACTORY_MS = 250;

/**
 * Speaker to microphone, in milliseconds.
 *
 * A phone on a music stand is well under a metre from its own microphone;
 * 0.7 m is 2 ms. Subtracted rather than ignored because it is part of the
 * round trip and none of the input path — but it is also small enough that
 * getting it wrong by a factor of two costs 2 ms.
 */
export const FLIGHT_MS = 2;

/** Beyond this the reading is a mis-measurement, not a slow phone. */
export const MAX_SAVED_INPUT_LATENCY_MS = 400;

// ---------------------------------------------------------------------------
// Who the measurement is for

export interface InputPath {
  /** `settingsStore`'s `inputPriority`, in order. */
  inputPriority: readonly string[];
  /** How many MIDI inputs are actually connected. */
  midiInputs: number;
  /** Whether this browser has a microphone API at all. */
  micSupported: boolean;
}

/**
 * Whether the microphone is the input this app would follow.
 *
 * Walks the priority list the way `ScoreScreen.pickInput` does, so the answer
 * is the same one the score screen would give: the first candidate that could
 * actually carry a note wins. A connected piano listed ahead of the mic ends
 * the walk immediately — that is the whole point of this function.
 */
export function micIsTheInput(path: InputPath): boolean {
  if (!path.micSupported) return false;
  for (const candidate of path.inputPriority) {
    if (candidate === 'midi' && path.midiInputs > 0) return false;
    if (candidate === 'mic') return true;
  }
  return false;
}

/**
 * Why there is nothing to measure, or null when there is.
 *
 * A sentence rather than a boolean because "the button is missing" is a bug
 * report waiting to happen: the screen prints this where the button was.
 */
export function whyNoLoopback(path: InputPath): string | null {
  if (micIsTheInput(path)) return null;
  if (!path.micSupported) {
    return 'This browser has no microphone, so there is no input path to measure.';
  }
  for (const candidate of path.inputPriority) {
    if (candidate === 'midi' && path.midiInputs > 0) {
      return (
        'Your piano is connected over USB MIDI, and there is nothing left to measure: the ' +
        'app already reads the audio output latency from the browser and allows for it, and ' +
        'a MIDI cable delivers a key press within a few milliseconds. This test is only for ' +
        'a piano the app is listening to through the microphone.'
      );
    }
    if (candidate === 'mic') break;
  }
  return (
    'The app is not set to follow the microphone. Settings → “Which input the app follows” ' +
    'chooses it; this test measures that path and no other.'
  );
}

// ---------------------------------------------------------------------------
// The run's shape

export interface LoopbackSchedule {
  bpm: number;
  beatsPerBar: number;
  countInBars: number;
  /** Clicks before the first measured one. */
  leadInClicks: number;
  /** Clicks the measurement is taken from. */
  clicks: number;
  /** How long to keep listening after the last click is scheduled. */
  tailMs: number;
  /** Start to scoring, in milliseconds. */
  totalMs: number;
}

/**
 * The metronome settings a run uses, and how long it takes.
 *
 * `countInBars` is 1 and never 0. The routine this replaced set it to 0, so
 * the first click sounded the instant the button was pressed: no lead-in for
 * the microphone's automatic anything to settle, and — since it also fed every
 * beat straight into the click list — no clean audio before the first measured
 * click for the noise floor to be read from.
 *
 * `beatsPerBar` is 1 so that every click is a downbeat. The metronome plays an
 * accent louder than an off-beat, and six clicks of two different amplitudes
 * would make the detection threshold mean two different things.
 */
export function loopbackSchedule(
  clicks: number = LOOPBACK_CLICKS,
  bpm: number = LOOPBACK_BPM,
): LoopbackSchedule {
  const beatMs = 60_000 / bpm;
  const tailMs = LOOPBACK_WINDOW.lateMs + beatMs;
  return {
    bpm,
    beatsPerBar: 1,
    countInBars: 1,
    leadInClicks: 1,
    clicks,
    tailMs,
    // The metronome's own start is a beat behind `start()`, hence the +1.
    totalMs: (clicks + 1) * beatMs + tailMs,
  };
}

export interface ScheduledBeat {
  /** AudioContext time the click is scheduled for, in seconds. */
  timeSec: number;
  isCountIn: boolean;
}

/**
 * The click times a run is scored against, in AudioContext milliseconds.
 *
 * Count-in beats are dropped. The routine this replaced pushed *every* beat
 * the metronome reported into its click list, so raising its count-in from 0
 * to 1 — the obvious one-line fix — would silently have turned "eight clicks"
 * into four count-in clicks and four measured ones, and reported the run as
 * half missed.
 */
export function measurementClickTimes(beats: readonly ScheduledBeat[]): number[] {
  return beats.filter((beat) => !beat.isCountIn).map((beat) => beat.timeSec * 1000);
}

// ---------------------------------------------------------------------------
// Finding the click in what came back

export interface LoopbackFrame {
  /** AudioContext time of the start of this render quantum, in milliseconds. */
  atMs: number;
  /** Amplitude at the click's frequency over that quantum. */
  magnitude: number;
}

export interface OnsetOptions {
  rise?: number;
  floorMagnitude?: number;
  refractoryMs?: number;
}

/**
 * When each click came back, as AudioContext milliseconds.
 *
 * The quiet level is the median of the whole run rather than a leading window:
 * six clicks of 30 ms in five seconds is under four per cent of the frames, so
 * the median *is* the room, and a median cannot be dragged by the very thing
 * being looked for the way a mean can.
 *
 * The onset is the first frame of a run above the threshold, not the loudest:
 * the loudest frame of a 30 ms click is a quantum or two into it, and biasing
 * every reading late by a fixed amount is the one direction a latency
 * measurement must not be nudged.
 */
export function detectClickOnsets(
  frames: readonly LoopbackFrame[],
  options: OnsetOptions = {},
): number[] {
  if (frames.length === 0) return [];
  const rise = options.rise ?? ONSET_RISE;
  const floor = options.floorMagnitude ?? MIN_ONSET_MAGNITUDE;
  const refractoryMs = options.refractoryMs ?? ONSET_REFRACTORY_MS;
  const quiet = median(frames.map((frame) => frame.magnitude));
  const threshold = Math.max(floor, quiet * rise);

  const onsets: number[] = [];
  let above = false;
  for (const frame of frames) {
    if (!(frame.magnitude >= threshold)) {
      above = false;
      continue;
    }
    if (above) continue;
    above = true;
    const last = onsets[onsets.length - 1];
    // Still inside the last click's ring-out: the same click, not a new one.
    if (last !== undefined && frame.atMs - last < refractoryMs) continue;
    onsets.push(frame.atMs);
  }
  return onsets;
}

// ---------------------------------------------------------------------------
// The answer

export interface LoopbackResult {
  /** Clicks that came back and were found. */
  heard: number;
  of: number;
  /** Emitted-to-heard, in milliseconds: the whole round trip. */
  roundTripMs: number;
  /** Half the interquartile range of the readings. */
  spreadMs: number;
  /** True when the readings agree well enough to act on. */
  usable: boolean;
  /** Why not, when they do not. */
  why: string | null;
  summary: LatencySummary;
}

/**
 * Pairs detections with emitted clicks and says whether the run measured
 * anything.
 *
 * The pairing is `matchTapsToClicks` — the same click-first walk, with a
 * one-sided window. It is the part of the old test worth keeping: it credits
 * each emitted click with at most one detection and nothing outside that
 * click's own window can reach it, so one stray bang costs a sample instead of
 * poisoning every sample after it.
 */
export function scoreLoopback(
  clickTimesMs: readonly number[],
  onsetTimesMs: readonly number[],
  of: number = clickTimesMs.length,
): LoopbackResult {
  const matches = matchTapsToClicks(clickTimesMs, onsetTimesMs, {
    earlyMs: LOOPBACK_WINDOW.earlyMs,
    lateMs: LOOPBACK_WINDOW.lateMs,
  });
  const summary = summariseLatency(
    matches.map((match) => match.deltaMs),
    MIN_LOOPBACK_CLICKS,
  );
  const agreed = Number.isFinite(summary.spreadMs) && summary.spreadMs <= MAX_LOOPBACK_SPREAD_MS;
  const usable = summary.usable && agreed;
  let why: string | null = null;
  if (!summary.usable) {
    why =
      `Only ${String(matches.length)} of ${String(of)} clicks came back. Turn the volume up, ` +
      'take the headphones out, and keep the phone within arm’s length of itself.';
  } else if (!agreed) {
    why =
      `The ${String(summary.used)} readings disagree by ±${summary.spreadMs.toFixed(0)} ms, so ` +
      'something other than the click was heard. Try again somewhere quieter.';
  }
  return {
    heard: matches.length,
    of,
    roundTripMs: summary.medianMs,
    spreadMs: summary.spreadMs,
    usable,
    why,
    summary,
  };
}

export interface InputLatencyParts {
  /** The measured round trip. */
  roundTripMs: number;
  /** `AudioContext.outputLatency`, in milliseconds. */
  outputLatencyMs: number;
  /** Speaker to microphone through the air. */
  flightMs?: number;
  /**
   * Delay something else already takes off, in milliseconds.
   *
   * A stored microphone calibration carries its own `latencyMs`, and
   * `MicSource` subtracts it from every event before the engine ever sees one.
   * The engine then subtracts `inputLatencyMs` as well, so saving the whole
   * input path here would compensate a calibrated microphone twice.
   */
  alreadyCompensatedMs?: number;
}

/**
 * The number to store, from the round trip that was measured.
 *
 * The round trip contains the *output* path as well, and the output path is
 * not something the app has to guess at: `clock.ts` reads it from the browser
 * and folds it into every conversion already. What is left after taking it and
 * the flight time off is the input path — how late a note the microphone hears
 * reaches the engine — and that is what `inputLatencyMs` means.
 */
export function inputLatencyFromRoundTrip(parts: InputLatencyParts): number {
  const raw =
    parts.roundTripMs -
    parts.outputLatencyMs -
    (parts.flightMs ?? FLIGHT_MS) -
    (parts.alreadyCompensatedMs ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.round(Math.min(MAX_SAVED_INPUT_LATENCY_MS, Math.max(0, raw)));
}

/** What a run found, in one line, for the Diagnostics screen. */
export function describeLoopback(
  result: LoopbackResult,
  fmt: (n: number) => string,
): string {
  return (
    `${String(result.heard)} of ${String(result.of)} clicks came back · ` +
    `round trip ${fmt(result.roundTripMs)} ms · ±${fmt(result.spreadMs)} ms · ` +
    `${fmt(result.summary.minMs)}…${fmt(result.summary.maxMs)} ms`
  );
}
