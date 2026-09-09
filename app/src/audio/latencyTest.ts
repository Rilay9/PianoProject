// The latency test: eight clicks, tap on each, measure how far behind the
// click the note arrives — cable, USB stack and audio output together.
//
// One routine for the two screens that run it (Diagnostics, where it began,
// and the setup tour), so the number the app subtracts in Tempo mode is
// measured the same way wherever it was measured. Pure of any DOM: the
// screens draw what the callbacks tell them.

import { audioEngine, screenKeyboardSource, webMidiSource } from '../app/services';
import { Metronome, type MetronomeBeat } from './Metronome';
import { audioTimeToPerformanceMs, captureAudioClockAnchor } from './clock';
import { matchTapsToClicks } from './latency';
import { getMidiSettings } from '../data/midiSettings';
import type { InputNoteEvent } from '../midi/types';
import { summarise, type Stats } from '../util/stats';

/** Clicks in one run: enough for a usable σ, short enough to sit through. */
export const LATENCY_BEATS = 8;
export const LATENCY_BPM = 60;

export interface LatencyResult {
  /** Taps that landed near a click. */
  matched: number;
  of: number;
  stats: Stats;
}

export interface LatencyRun {
  /** Ends the run early and scores what was tapped so far. */
  stop(): void;
}

export interface LatencyTestOptions {
  /** Each click as it sounds, 1-based, out of `LATENCY_BEATS`. */
  onClick(n: number, of: number): void;
  onDone(result: LatencyResult): void;
}

/**
 * Starts the clicks and listens for taps on the piano and the on-screen keys.
 *
 * Resolves once the audio is running and the clicks have started; rejects if
 * the audio context cannot start, which on a phone means "tap something
 * first". The result arrives through `onDone`, after the last click has had
 * its beat and a little more, because the last click is scheduled ahead of
 * when it sounds and the tap for it comes after that.
 */
export async function runLatencyTest(options: LatencyTestOptions): Promise<LatencyRun> {
  const context = await audioEngine.ensureStarted();
  const anchor = captureAudioClockAnchor(context);
  const clickTimesMs: number[] = [];
  const tapTimesMs: number[] = [];

  const onTap = (e: InputNoteEvent): void => {
    if (e.kind === 'noteOn') tapTimesMs.push(e.tMs);
  };
  const offMidi = webMidiSource.onNote(onTap);
  const offScreen = screenKeyboardSource.onNote(onTap);

  const metronome = new Metronome(context, {
    bpm: LATENCY_BPM,
    beatsPerBar: 4,
    countInBars: 0,
    volume: getMidiSettings().metronomeVolume,
    ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
  });

  let finished = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const finish = (): void => {
    if (finished) return;
    finished = true;
    if (timer !== null) clearTimeout(timer);
    offMidi();
    offScreen();
    metronome.dispose();
    const matches = matchTapsToClicks(clickTimesMs, tapTimesMs);
    options.onDone({
      matched: matches.length,
      of: LATENCY_BEATS,
      stats: summarise(matches.map((m) => m.deltaMs)),
    });
  };

  const offTick = metronome.onTick((beat: MetronomeBeat) => {
    clickTimesMs.push(audioTimeToPerformanceMs(anchor, beat.timeSec));
    options.onClick(clickTimesMs.length, LATENCY_BEATS);
    if (clickTimesMs.length >= LATENCY_BEATS) {
      // The last click is scheduled ahead of when it sounds, so wait out the
      // look-ahead plus one beat before scoring, or the final tap is missed.
      const graceMs = (60 / LATENCY_BPM) * 1000 + 500;
      timer = setTimeout(finish, graceMs);
      offTick();
      metronome.stop();
    }
  });

  metronome.start();
  return { stop: finish };
}

/** What a result means, in one line, for either screen. */
export function describeLatency(result: LatencyResult, fmt: (n: number) => string): string {
  const s = result.stats;
  return (
    `${String(result.matched)} of ${String(result.of)} clicks matched · ` +
    `mean ${fmt(s.mean)} ms · σ ${fmt(s.stdDev)} ms · median ${fmt(s.median)} ms · ` +
    `range ${fmt(s.min)}…${fmt(s.max)} ms`
  );
}
