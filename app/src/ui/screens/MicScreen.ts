// The microphone screen: connect, watch it listen, and calibrate it.
//
// docs/05-score-follow-engine.md §11.5. The routine is guided because the
// measurements it makes are only as good as what the learner plays into it:
// the app has to be able to say "now play each C, one at a time" and know that
// what arrives in the next twenty seconds is that and nothing else.
//
// Everything shown here is also what the owner needs when it *doesn't* work —
// the level meter and the noise floor answer "is it hearing anything at all?"
// before any of the detection questions are worth asking.

import { createSubScreen, addSection, addParagraph, addButton } from './subScreen';
import { onScreenDispose } from '../screenLifecycle';
import { audioEngine, micSource } from '../../app/services';
import { Metronome, MIC_CLICK_HZ } from '../../audio/Metronome';
import {
  analyseCalibration,
  CALIBRATION_STAGES,
  pitchName,
  SCALE_PITCHES,
  type CalibrationStage,
  type StageRecording,
} from '../../audio/pitch/calibration';
import { LINE_INPUT_PRESET, type MicLevel } from '../../audio/pitch/MicSource';
import {
  micCalibrationStore,
  type StoredCalibration,
} from '../../data/micCalibrationStore';
import { getMidiSettings } from '../../data/midiSettings';
import type { Router } from '../../router';

/** Clicks per minute for the chromatic-scale stage: slow, as §11.5 asks. */
const SCALE_BPM = 60;

/** How much of each stage the quick routine keeps. */
const QUICK_FRACTION = 0.25;

export function MicScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'mic',
    title: 'Microphone',
    backTo: 'settings',
    backLabel: 'Settings',
  });

  addParagraph(
    card,
    'The microphone is the backup for a piano with no usable MIDI out. It is ' +
      'never as certain as a cable, so anything it is unsure about is shown ' +
      'amber and never counted against you.',
    'muted',
  );

  // --- connection ----------------------------------------------------------

  const connection = addSection(card, 'Connection');
  const status = addParagraph(connection, 'Not connected.');
  status.id = 'mic-status';

  const deviceRow = document.createElement('div');
  deviceRow.className = 'setting-row';
  const deviceLabel = document.createElement('label');
  deviceLabel.textContent = 'Input';
  deviceLabel.htmlFor = 'mic-device';
  const deviceSelect = document.createElement('select');
  deviceSelect.id = 'mic-device';
  deviceRow.append(deviceLabel, deviceSelect);
  connection.appendChild(deviceRow);

  const lineRow = document.createElement('div');
  lineRow.className = 'setting-row';
  const lineLabel = document.createElement('label');
  lineLabel.htmlFor = 'mic-line-input';
  lineLabel.textContent = 'Line input preset';
  const lineHint = document.createElement('div');
  lineHint.className = 'muted';
  lineHint.textContent =
    'For a cable from the piano rather than a room microphone: lower thresholds, no room noise.';
  const lineToggle = document.createElement('input');
  lineToggle.type = 'checkbox';
  lineToggle.id = 'mic-line-input';
  const lineText = document.createElement('div');
  lineText.append(lineLabel, lineHint);
  lineRow.append(lineText, lineToggle);
  connection.appendChild(lineRow);

  const connectButton = addButton(connection, 'Connect microphone', () => void connect(), {
    id: 'mic-connect',
    variant: 'primary',
  });
  addButton(connection, 'Disconnect', () => micSource.disconnect(), { id: 'mic-disconnect' });

  // --- level ---------------------------------------------------------------

  const levels = addSection(card, 'What it hears');
  const meter = document.createElement('div');
  meter.className = 'mic-meter';
  const meterFill = document.createElement('div');
  meterFill.className = 'mic-meter__fill';
  meterFill.id = 'mic-meter-fill';
  meter.appendChild(meterFill);
  levels.appendChild(meter);
  const levelText = addParagraph(levels, 'Level: —', 'muted');
  levelText.id = 'mic-level';

  // --- calibration ---------------------------------------------------------

  const calibration = addSection(card, 'Calibration');
  addParagraph(
    calibration,
    'About a minute: silence, every C, a slow chromatic scale with the ' +
      'metronome, then three chords. It measures how loud each part of the ' +
      'keyboard sounds to this microphone, how sharp the strings are, and how ' +
      'late the sound arrives.',
    'muted',
  );
  const speedRow = document.createElement('div');
  speedRow.className = 'setting-row';
  const speedLabel = document.createElement('label');
  speedLabel.htmlFor = 'mic-speed';
  speedLabel.textContent = 'Length';
  const speedSelect = document.createElement('select');
  speedSelect.id = 'mic-speed';
  for (const option of [
    { value: 'full', label: 'Full (about a minute)' },
    { value: 'quick', label: 'Quick (about fifteen seconds)' },
  ]) {
    const el = document.createElement('option');
    el.value = option.value;
    el.textContent = option.label;
    speedSelect.appendChild(el);
  }
  speedRow.append(speedLabel, speedSelect);
  calibration.appendChild(speedRow);
  addParagraph(
    calibration,
    'Quick shortens every stage: fewer notes get measured, so the table is ' +
      'rougher, but it is enough to check that the microphone is working at all.',
    'muted',
  );

  const stageText = addParagraph(calibration, 'Not started.');
  stageText.id = 'mic-stage';
  const calibrateButton = addButton(calibration, 'Start calibration', () => void runCalibration(), {
    id: 'mic-calibrate',
    variant: 'primary',
  });
  const storedText = addParagraph(calibration, '', 'muted');
  storedText.id = 'mic-stored';

  // --- state ---------------------------------------------------------------

  let level: MicLevel | null = null;
  let calibrating = false;

  const offLevel = micSource.onLevel((next) => {
    level = next;
    renderLevel();
  });
  const offState = micSource.onStateChange(() => renderConnection());

  onScreenDispose(section, () => {
    offLevel();
    offState();
    micSource.stopRecording();
  });

  function renderConnection(): void {
    const state = micSource.state;
    status.textContent = state.connected
      ? `Connected — ${state.detail}`
      : `Not connected (${state.detail}).`;
    connectButton.textContent = state.connected ? 'Reconnect' : 'Connect microphone';
    renderDevices();
    renderStored();
  }

  function renderDevices(): void {
    const devices = micSource.inputs;
    const chosen = deviceSelect.value || micSource.pinnedInputId || '';
    deviceSelect.replaceChildren();
    const auto = document.createElement('option');
    auto.value = '';
    auto.textContent = devices.length === 0 ? 'Default (connect to list devices)' : 'Default input';
    deviceSelect.appendChild(auto);
    for (const device of devices) {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.builtIn ? `${device.label} (built in)` : device.label;
      deviceSelect.appendChild(option);
    }
    deviceSelect.value = chosen;
    // §11.5: offer the line-input preset when the device is not a room mic.
    const device = devices.find((d) => d.deviceId === deviceSelect.value);
    if (device && !device.builtIn && !lineToggle.dataset.touched) lineToggle.checked = true;
  }

  function renderLevel(): void {
    if (!level) {
      levelText.textContent = 'Level: —';
      meterFill.style.width = '0%';
      return;
    }
    // dBFS to a 0..1 bar, with -60 dB as the bottom of the scale.
    const fraction = Math.min(1, Math.max(0, (level.rmsDb + 60) / 60));
    meterFill.style.width = `${(fraction * 100).toFixed(0)}%`;
    meterFill.dataset.hot = level.peak > 0.95 ? 'true' : 'false';
    levelText.textContent =
      `Level ${level.rmsDb.toFixed(0)} dB · noise floor ${level.noiseFloorDb.toFixed(0)} dB · ` +
      `peak ${(level.peak * 100).toFixed(0)}%` +
      (level.peak > 0.95 ? ' — clipping, move further away' : '');
  }

  function renderStored(): void {
    const stored = micCalibrationStore.get(deviceSelect.value);
    if (!stored) {
      storedText.textContent = 'No calibration stored for this input yet.';
      return;
    }
    const when = new Date(stored.measuredAt);
    storedText.textContent =
      `Calibrated ${when.toLocaleDateString()} · latency ${stored.latencyMs.toFixed(0)} ms · ` +
      `noise floor ${stored.noiseFloorDb.toFixed(0)} dB · ` +
      `${stored.chordsHeard}/3 chords heard` +
      (stored.missed.length > 0
        ? ` · not heard: ${stored.missed.slice(0, 6).map(pitchName).join(', ')}` +
          (stored.missed.length > 6 ? '…' : '')
        : '');
  }

  deviceSelect.addEventListener('change', () => {
    micSource.pinInput(deviceSelect.value === '' ? null : deviceSelect.value);
    renderDevices();
    renderStored();
    applyStored();
  });
  lineToggle.addEventListener('change', () => {
    lineToggle.dataset.touched = 'true';
    applyStored();
  });

  /** Loads whatever is stored for the chosen device into the live detector. */
  function applyStored(): void {
    const stored = micCalibrationStore.get(deviceSelect.value);
    if (!stored) {
      micSource.applyCalibration(null);
      return;
    }
    micSource.applyCalibration({
      ...stored,
      thresholds: lineToggle.checked ? { ...stored.thresholds, ...LINE_INPUT_PRESET } : stored.thresholds,
    });
  }

  async function connect(): Promise<void> {
    status.textContent = 'Asking for permission…';
    try {
      await micSource.connect(deviceSelect.value === '' ? undefined : deviceSelect.value);
      applyStored();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Could not open the microphone.';
      return;
    }
    renderConnection();
  }

  // --- the guided routine --------------------------------------------------

  async function runCalibration(): Promise<void> {
    if (calibrating) return;
    if (!micSource.state.connected) await connect();
    if (!micSource.state.connected) return;

    calibrating = true;
    calibrateButton.disabled = true;
    const sampleRate = micSource.sampleRate ?? 48000;
    const recordings: StageRecording[] = [];

    try {
      for (const stage of CALIBRATION_STAGES) {
        // The stages are a sequence the learner is walked through, so they
        // are run strictly one after another rather than in parallel.
        recordings.push(await runStage(stage, sampleRate));
      }
      finish(recordings);
    } catch (error) {
      stageText.textContent =
        error instanceof Error ? `Calibration stopped: ${error.message}` : 'Calibration stopped.';
    } finally {
      micSource.stopRecording();
      calibrating = false;
      calibrateButton.disabled = false;
    }
  }

  /** Records one stage, counting down in the heading as it goes. */
  async function runStage(stage: CalibrationStage, sampleRate: number): Promise<StageRecording> {
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
    await countdown(stage);
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
   * The click has to be the high one (docs/05 §11.4): a woodblock at 1.6 kHz
   * sits in the middle of the piano's partials and would be measured as a note.
   */
  async function startClicks(into: number[]): Promise<Metronome> {
    const context = await audioEngine.ensureStarted();
    const metronome = new Metronome(context, {
      bpm: SCALE_BPM,
      beatsPerBar: 4,
      countInBars: 0,
      sound: 'high',
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
  function secondsFor(stage: CalibrationStage): number {
    if (speedSelect.value !== 'quick') return stage.seconds;
    return Math.max(2, Math.round(stage.seconds * QUICK_FRACTION));
  }

  function countdown(stage: CalibrationStage): Promise<void> {
    return new Promise((resolve) => {
      let left = secondsFor(stage);
      const show = () => {
        stageText.textContent = `${stage.title}: ${stage.instruction} (${left}s)`;
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

  function finish(recordings: StageRecording[]): void {
    const device = micSource.inputs.find((d) => d.deviceId === deviceSelect.value);
    const result = analyseCalibration(recordings, {
      ...(lineToggle.checked ? { thresholds: { ...LINE_INPUT_PRESET } } : {}),
    });
    const stored: StoredCalibration = {
      ...result.calibration,
      // The click is notched out whenever this calibration is in use.
      thresholds: result.calibration.thresholds,
      deviceId: deviceSelect.value,
      deviceLabel: device?.label ?? 'Default input',
      measuredAt: new Date().toISOString(),
      missed: result.missed,
      chordsHeard: result.chordsHeard,
    };
    micCalibrationStore.put(stored);
    micSource.applyCalibration(stored);
    stageText.textContent =
      `Done. Measured ${result.measurements.length} pitches, ` +
      `${result.chordsHeard}/3 chords heard, ` +
      `latency ${result.calibration.latencyMs.toFixed(0)} ms.` +
      (result.missed.length > 0
        ? ` Not heard: ${result.missed.map(pitchName).join(', ')} — play those louder and run it again.`
        : '');
    renderStored();
  }

  // The click frequency is fixed, so the detector can always notch it.
  void MIC_CLICK_HZ;

  renderConnection();
  renderLevel();
  applyStored();
  return section;
}
