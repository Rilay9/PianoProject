// The guided calibration routine, as the learner is walked through it.
//
// `calibration.ts` is the pure half — analysis over recorded audio. This is
// the half with a clock in it: record each stage in turn, count down in the
// caller's heading, click the metronome for the scale, then analyse, store
// and apply. One routine for the microphone screen and the setup tour, so a
// calibration made in either is the same calibration.

import { audioEngine, micSource } from '../../app/services';
import { Metronome } from '../Metronome';
import { metronomeSoundFor } from '../inputPolicy';
import {
  analyseCalibration,
  CALIBRATION_STAGES,
  pitchName,
  SCALE_PITCHES,
  type CalibrationStage,
  type StageRecording,
} from './calibration';
import { LINE_INPUT_PRESET } from './MicSource';
import { micCalibrationStore, type StoredCalibration } from '../../data/micCalibrationStore';
import { getMidiSettings } from '../../data/midiSettings';

/** Clicks per minute for the chromatic-scale stage: slow, as `05` §11.5 asks. */
const SCALE_BPM = 60;

/** How much of each stage the quick routine keeps. */
const QUICK_FRACTION = 0.25;

export interface CalibrationRunOptions {
  /** The input's id, or '' for the default input. */
  deviceId: string;
  /** The line-input preset: a cable from the piano rather than a room mic. */
  lineInput: boolean;
  /** Every stage cut to a quarter: enough to check the mic works at all. */
  quick: boolean;
  /** The heading to show: the stage, its instruction, and the seconds left. */
  onStage(text: string): void;
}

/**
 * Runs every stage, analyses, stores the result for the device and applies
 * it to the live detector. Rejects if the microphone is not connected or a
 * stage cannot be recorded; the caller says so.
 */
export interface CalibrationOutcome {
  stored: StoredCalibration;
  /** How many pitches the routine measured — what the screens report. */
  measured: number;
}

export async function runCalibrationRoutine(options: CalibrationRunOptions): Promise<CalibrationOutcome> {
  if (!micSource.state.connected) throw new Error('the microphone is not connected');
  const sampleRate = micSource.sampleRate ?? 48000;
  const recordings: StageRecording[] = [];
  try {
    for (const stage of CALIBRATION_STAGES) {
      // The stages are a sequence the learner is walked through, so they
      // are run strictly one after another rather than in parallel.
      recordings.push(await runStage(stage, sampleRate, options));
    }
  } finally {
    micSource.stopRecording();
  }
  const device = micSource.inputs.find((d) => d.deviceId === options.deviceId);
  const result = analyseCalibration(recordings, {
    ...(options.lineInput ? { thresholds: { ...LINE_INPUT_PRESET } } : {}),
  });
  const stored: StoredCalibration = {
    ...result.calibration,
    // The click is notched out whenever this calibration is in use.
    thresholds: result.calibration.thresholds,
    deviceId: options.deviceId,
    deviceLabel: device?.label ?? 'Default input',
    measuredAt: new Date().toISOString(),
    missed: result.missed,
    chordsHeard: result.chordsHeard,
  };
  micCalibrationStore.put(stored);
  micSource.applyCalibration(stored);
  return { stored, measured: result.measurements.length };
}

/** One line on what a calibration found, for whichever screen ran it. */
export function describeCalibration(outcome: CalibrationOutcome): string {
  const { stored, measured } = outcome;
  return (
    `Done. Measured ${String(measured)} pitches, ` +
    `${String(stored.chordsHeard)}/3 chords heard, ` +
    `latency ${stored.latencyMs.toFixed(0)} ms.` +
    (stored.missed.length > 0
      ? ` Not heard: ${stored.missed.map(pitchName).join(', ')} — play those louder and run it again.`
      : '')
  );
}

/** Records one stage, counting down in the heading as it goes. */
async function runStage(
  stage: CalibrationStage,
  sampleRate: number,
  options: CalibrationRunOptions,
): Promise<StageRecording> {
  const chunks: Float32Array[] = [];
  const offAudio = micSource.onAudio((chunk) => chunks.push(chunk));
  const onsetTimesMs: number[] = [];
  const offNotes = micSource.onNote((note) => {
    if (note.kind === 'noteOn') onsetTimesMs.push(note.tMs);
  });

  // The scale stage is the one with a click, and its pitches are what the
  // detector is told to listen for so its onsets can be timed against it.
  if (stage.id === 'scale') micSource.setExpectations(SCALE_PITCHES, []);
  else micSource.setExpectations(stage.pitches.slice(0, 8), []);

  const clickTimesMs: number[] = [];
  const metronome = stage.id === 'scale' ? await startClicks(clickTimesMs) : null;

  micSource.startRecording();
  await countdown(stage, secondsFor(stage, options.quick), (text) => options.onStage(text));
  micSource.stopRecording();
  metronome?.stop();
  metronome?.dispose();
  offAudio();
  offNotes();

  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const samples = new Float32Array(total);
  let at = 0;
  for (const chunk of chunks) {
    samples.set(chunk, at);
    at += chunk.length;
  }
  return {
    id: stage.id,
    samples,
    sampleRate,
    ...(stage.id === 'scale' ? { clickTimesMs, onsetTimesMs } : {}),
  };
}

/**
 * Starts the metronome on the high click and records when each one sounds.
 *
 * The click has to be the high one (`05` §11.4): a woodblock at 1.6 kHz sits
 * in the middle of the piano's partials and would be measured as a note.
 */
async function startClicks(into: number[]): Promise<Metronome> {
  const context = await audioEngine.ensureStarted();
  const metronome = new Metronome(context, {
    bpm: SCALE_BPM,
    beatsPerBar: 4,
    countInBars: 0,
    // The one decision that must not be made ad hoc: with the microphone
    // listening, the click has to be the one the detector notches out.
    sound: metronomeSoundFor({ micActive: true, destination: 'phone' }, 'wood'),
    volume: getMidiSettings().metronomeVolume,
    ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
  });
  metronome.onTick((beat) => {
    // AudioContext seconds to the performance.now() timeline the detector's
    // events are already on.
    into.push(performance.now() + (beat.timeSec - context.currentTime) * 1000);
  });
  metronome.start();
  return metronome;
}

/** Stage length, shortened for the quick routine but never below two seconds. */
function secondsFor(stage: CalibrationStage, quick: boolean): number {
  if (!quick) return stage.seconds;
  return Math.max(2, Math.round(stage.seconds * QUICK_FRACTION));
}

function countdown(stage: CalibrationStage, seconds: number, onStage: (text: string) => void): Promise<void> {
  return new Promise((resolve) => {
    let left = seconds;
    const show = (): void => {
      onStage(`${stage.title}: ${stage.instruction} (${String(left)}s)`);
    };
    show();
    const timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        resolve();
        return;
      }
      show();
    }, 1000);
  });
}
