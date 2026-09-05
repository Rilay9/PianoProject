// The rules that change when the microphone is the input (docs/05 §11.4).
//
// These are decisions the Score screen has to make — what to play back, which
// metronome click to use, how to label the accuracy — and they are here rather
// than inside the screen for one reason: the microphone hears the phone's own
// speaker. Get this wrong and the app follows itself, scoring a run the
// learner did not play, and it will look like a detector bug rather than a
// routing one. Written down once, tested once.

import type { MetronomeSound } from './Metronome';
import { MIC_ENGINE_OPTIONS, type EngineOptions, type SessionScore } from '../engine/types';

/** Where the app sends what it plays (docs/04 §5's playback destination). */
export type PlaybackDestination = 'phone' | 'piano' | 'both';

export interface InputConditions {
  /** True when the microphone is the source the engine is following. */
  micActive: boolean;
  destination: PlaybackDestination;
}

/**
 * Whether playback of the pitches the score expects has to be silenced.
 *
 * Only the phone's own speaker is a problem: notes sent to the piano over MIDI
 * come out of the piano, which the microphone was already going to hear the
 * learner play on. "Both" counts as through the speaker, because it is.
 */
export function shouldMuteExpectedPlayback(conditions: InputConditions): boolean {
  return conditions.micActive && conditions.destination !== 'piano';
}

/**
 * The metronome click to use.
 *
 * The wood click is centred at 1.6 kHz, which is squarely inside the piano's
 * partials, so with the microphone listening it is heard as a note. The high
 * click sits above every fundamental and is notched out of the spectrum before
 * the detector reads it.
 */
export function metronomeSoundFor(
  conditions: InputConditions,
  preferred: MetronomeSound,
): MetronomeSound {
  return conditions.micActive ? 'high' : preferred;
}

/**
 * Engine options for the current input.
 *
 * Wider timing tolerance, chord leniency, and the flag that makes the summary
 * sheet call the accuracy an estimate — all of §11.4's engine adaptations in
 * one place so a screen cannot apply half of them.
 */
export function engineOptionsFor(conditions: InputConditions): Partial<EngineOptions> {
  return conditions.micActive ? { ...MIC_ENGINE_OPTIONS } : {};
}

/** How the summary sheet writes an accuracy figure (docs/05 §11.4). */
export function accuracyLabel(score: Pick<SessionScore, 'accuracy' | 'accuracyEstimated'>): string {
  const percent = `${Math.round(score.accuracy * 100)}%`;
  return score.accuracyEstimated ? `${percent} (estimated)` : percent;
}

/** One line for the control bar: why playback went quiet. */
export function playbackHint(conditions: InputConditions): string | null {
  if (!shouldMuteExpectedPlayback(conditions)) return null;
  return 'Playback is muted while listening through the microphone — send it to the piano or use headphones.';
}
