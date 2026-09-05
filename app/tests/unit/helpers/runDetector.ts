// Runs the detector over a whole fixture, the way the worklet will.
//
// The worklet feeds hops from a ring buffer; here the buffer is the file, so
// the numbers this produces are the numbers the app will get from the same
// audio — the only difference is that nothing has to happen in real time.

import { HOP_SIZE, LOW_WINDOW_SIZE, PitchDetector, type DetectedNote } from '../../../src/audio/pitch/detector';
import type { FixtureMeta, WavData } from './wav';

export interface RunOptions {
  /**
   * What the score expects, as a function of time. Returns the pitch sets for
   * "now" and "next" — this is the score-informed prior §11.1 relies on.
   */
  expectationsAt: (tMs: number) => { now: number[]; next: number[] };
  thresholds?: ConstructorParameters<typeof PitchDetector>[0]['thresholds'];
}

export function runDetector(audio: WavData, options: RunOptions): DetectedNote[] {
  const detector = new PitchDetector({
    sampleRate: audio.sampleRate,
    ...(options.thresholds ? { thresholds: options.thresholds } : {}),
  });
  const events: DetectedNote[] = [];
  const frame = new Float32Array(LOW_WINDOW_SIZE);

  let lastKey = '';
  for (let end = LOW_WINDOW_SIZE; end <= audio.samples.length; end += HOP_SIZE) {
    frame.set(audio.samples.subarray(end - LOW_WINDOW_SIZE, end));
    const tMs = (end / audio.sampleRate) * 1000;
    const { now, next } = options.expectationsAt(tMs);
    const key = `${now.join(',')}|${next.join(',')}`;
    if (key !== lastKey) {
      detector.setExpectations(now, next);
      lastKey = key;
    }
    events.push(...detector.process(frame, tMs));
  }
  return events;
}

/**
 * The expectation function a real practice session produces: the pitches of
 * the note(s) starting now, and of the next distinct onset.
 */
export function expectationsFromFixture(meta: FixtureMeta): (tMs: number) => {
  now: number[];
  next: number[];
} {
  const onsets = [...new Set(meta.notes.map((n) => n.atSec))].sort((a, b) => a - b);
  const groups = onsets.map((atSec) => ({
    atSec,
    midis: meta.notes.filter((n) => n.atSec === atSec).map((n) => n.midi),
  }));
  return (tMs: number) => {
    const tSec = tMs / 1000;
    // "Now" is the *latest* group that has started, with a little lookahead so
    // the expectation is in place just before the note arrives. Taking the
    // first group still ahead of the cursor instead — which an earlier version
    // did — pointed the detector at the next note 50 ms after the current one
    // began, and recall collapsed to 22 %.
    let index = 0;
    for (let i = 0; i < groups.length; i += 1) {
      if ((groups[i]?.atSec ?? Infinity) <= tSec + 0.06) index = i;
      else break;
    }
    return {
      now: groups[index]?.midis ?? [],
      next: groups[index + 1]?.midis ?? [],
    };
  };
}

export interface Scored {
  /** Correctly detected note-ons (right pitch, within the timing window). */
  truePositives: number;
  /** Detected note-ons that match no scheduled note. */
  falsePositives: number;
  /** Scheduled notes never detected. */
  falseNegatives: number;
  recall: number;
  precision: number;
  /** Absolute onset timing errors in milliseconds, for the matched notes. */
  onsetErrorsMs: number[];
  meanOnsetErrorMs: number;
  maxOnsetErrorMs: number;
}

/**
 * Scores detections against the schedule that produced the audio.
 *
 * A detection counts when it names the right pitch within `windowMs` of the
 * scheduled onset. Each scheduled note can be matched once; extra detections
 * of an already-matched note are ignored rather than counted as false
 * positives, because a re-strike report on a ringing note is a different
 * question from a wrong pitch.
 */
export function scoreDetections(
  meta: FixtureMeta,
  events: readonly DetectedNote[],
  windowMs = 120,
): Scored {
  const scheduled = meta.notes.map((n) => ({ midi: n.midi, atMs: n.atSec * 1000, matched: false }));
  const noteOns = events.filter((e) => e.kind === 'noteOn' && !e.unexpected);

  let truePositives = 0;
  let falsePositives = 0;
  const onsetErrorsMs: number[] = [];

  for (const event of noteOns) {
    let best = -1;
    let bestDistance = Infinity;
    scheduled.forEach((note, i) => {
      if (note.midi !== event.midi) return;
      const distance = Math.abs(event.tMs - note.atMs);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    const target = best >= 0 ? scheduled[best] : undefined;
    if (!target || bestDistance > windowMs) {
      falsePositives += 1;
      continue;
    }
    if (target.matched) continue;
    target.matched = true;
    truePositives += 1;
    onsetErrorsMs.push(bestDistance);
  }

  const falseNegatives = scheduled.filter((n) => !n.matched).length;
  const detected = truePositives + falsePositives;
  return {
    truePositives,
    falsePositives,
    falseNegatives,
    recall: scheduled.length > 0 ? truePositives / scheduled.length : 0,
    precision: detected > 0 ? truePositives / detected : 0,
    onsetErrorsMs,
    meanOnsetErrorMs:
      onsetErrorsMs.length > 0
        ? onsetErrorsMs.reduce((a, b) => a + b, 0) / onsetErrorsMs.length
        : 0,
    maxOnsetErrorMs: onsetErrorsMs.length > 0 ? Math.max(...onsetErrorsMs) : 0,
  };
}
