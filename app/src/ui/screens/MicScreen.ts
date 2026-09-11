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
import { micSource } from '../../app/services';
import { pitchName } from '../../audio/pitch/calibration';
import { describeCalibration, runCalibrationRoutine } from '../../audio/pitch/calibrationRun';
import { LINE_INPUT_PRESET, MicAccessError, type MicLevel } from '../../audio/pitch/MicSource';
import { micCalibrationStore } from '../../data/micCalibrationStore';
import type { Router } from '../../router';

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

  // The one control for a microphone there is no way to have (`04` §0 R4).
  //
  // Drawn only when the refusal is one that pressing Connect again cannot
  // undo: a denied permission is remembered by the browser and will not be
  // asked for a second time, and a phone with no microphone will not grow one.
  // Before this the screen answered both with the raw message off the
  // exception — "microphone permission was refused" — under a Connect button
  // that would do nothing for ever, over a level meter reading "Level: —" and
  // a calibration routine whose first act is to connect.
  const noInputRow = document.createElement('div');
  noInputRow.className = 'row';
  noInputRow.hidden = true;
  connection.appendChild(noInputRow);
  const midiInstead = document.createElement('button');
  midiInstead.type = 'button';
  midiInstead.className = 'button button--secondary';
  midiInstead.id = 'mic-use-midi';
  midiInstead.textContent = 'Set up MIDI instead';
  midiInstead.addEventListener('click', () => router.navigate('settings', 'midi'));
  noInputRow.appendChild(midiInstead);

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
    'For a cable from the piano, not a room mic: lower thresholds, no room noise.';
  const lineToggle = document.createElement('input');
  lineToggle.type = 'checkbox';
  lineToggle.id = 'mic-line-input';
  const lineText = document.createElement('div');
  // The class the shared `field()` gives its text column. Without it the div
  // has no flex sizing, takes the whole row, and pushes the checkbox onto a
  // line of its own — which is how this screen ended up with a bare unlabelled
  // square floating above "Connect microphone".
  lineText.className = 'setting-row__text';
  lineText.append(lineLabel, lineHint);
  lineRow.append(lineText, lineToggle);
  connection.appendChild(lineRow);

  const connectButton = addButton(connection, 'Connect microphone', () => void connect(), {
    id: 'mic-connect',
    variant: 'primary',
  });
  // Drawn only while there is something to disconnect from (`04` §0 R4). It
  // sat there permanently, offering to end a connection that did not exist.
  const disconnectButton = addButton(connection, 'Disconnect', () => micSource.disconnect(), {
    id: 'mic-disconnect',
  });

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
    // Connecting is what the screen is for; calibrating is what comes after it
    // and is not a second answer to the same question (R3).
    variant: 'secondary',
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
    // And close it. `stopRecording()` only stops the raw-audio tap; the
    // microphone track, the worklet and the graph stay open, so testing the
    // microphone once and walking away left the stream live — the phone's
    // recording indicator on and the detector running — for the rest of the
    // session, over screens that never asked to listen. The Score, Drill and
    // Dev screens all release it on dispose; this one, whose whole subject is
    // the microphone, was the one that did not.
    micSource.disconnect();
  });

  function renderConnection(): void {
    const state = micSource.state;
    // The detail is only worth printing when it says something the state does
    // not. Disconnected with a detail of 'not connected' printed the phrase
    // twice: 'Not connected (not connected).'
    const plain = state.connected ? 'Connected' : 'Not connected';
    const detail = state.detail.trim();
    const says = detail !== '' && detail.toLowerCase() !== plain.toLowerCase();
    status.textContent = says ? `${plain} — ${detail}` : `${plain}.`;
    connectButton.textContent = state.connected ? 'Reconnect' : 'Connect microphone';
    disconnectButton.hidden = !state.connected;
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

  /**
   * What to say, and whether pressing Connect again could ever help.
   *
   * `failed` is the one that can: a worklet that did not load or a device that
   * was busy is worth another try, so it keeps the screen as it is. The other
   * two are settled until something outside the app changes.
   *
   * `permission-denied` is the one that has to be *asked about*. Chrome throws
   * the same `NotAllowedError` whether the learner tapped Block or swiped the
   * prompt away, and `MicSource` can only report the one code for both — but
   * the two are opposites: a block is remembered and needs a trip through site
   * settings, while a dismissal is remembered by nothing and the very next tap
   * asks again. This screen used to answer both with the site-settings
   * sentence *and* take the Connect button away (`settled`), so a prompt
   * dismissed by accident — a notification landing, a hand brushing the
   * screen — left the owner with no way to open the microphone and
   * instructions for a setting that was never changed. The Permissions API is
   * what tells the two apart.
   */
  async function micPermissionState(): Promise<string | null> {
    try {
      const permissions = navigator.permissions as
        | { query?: (descriptor: { name: string }) => Promise<{ state: string }> }
        | undefined;
      if (typeof permissions?.query !== 'function') return null;
      const status = await permissions.query({ name: 'microphone' });
      return status.state;
    } catch {
      // An unsupported descriptor name (Firefox once, older WebViews): the
      // browser will not say, so nothing is treated as settled.
      return null;
    }
  }

  async function describeRefusal(error: unknown): Promise<{ sentence: string; settled: boolean }> {
    if (!(error instanceof MicAccessError)) {
      return {
        sentence: error instanceof Error ? error.message : 'Could not open the microphone.',
        settled: false,
      };
    }
    if (error.code === 'permission-denied') {
      const state = await micPermissionState();
      if (state === 'prompt') {
        return {
          sentence:
            'The prompt closed without an answer, so nothing was refused. Tap Connect ' +
            'microphone again and choose Allow.',
          settled: false,
        };
      }
      if (state === null) {
        return {
          sentence:
            'The microphone was not opened. Tap Connect microphone to be asked again; if you ' +
            'are not asked, allow it in this page’s own site settings.',
          settled: false,
        };
      }
      return {
        sentence:
          'The microphone was refused, and the browser will not ask again until you allow it ' +
          'in this page’s own site settings. A MIDI cable needs no permission and is more accurate.',
        settled: true,
      };
    }
    if (error.code === 'no-device') {
      return {
        sentence:
          'No microphone was found on this device. A MIDI cable from the piano needs no microphone.',
        settled: true,
      };
    }
    if (error.code === 'unsupported') {
      return {
        sentence:
          'This browser has no microphone API, so listening is not possible here. A MIDI cable does not need one.',
        settled: true,
      };
    }
    return { sentence: `${error.message}. Try again.`, settled: false };
  }

  /** Hides everything that only means something once the microphone is open. */
  function showNoInput(settled: boolean): void {
    noInputRow.hidden = !settled;
    levels.hidden = settled;
    calibration.hidden = settled;
    // Nothing to reconnect to and nothing to disconnect from.
    connectButton.hidden = settled;
    disconnectButton.hidden = true;
    status.classList.toggle('status--error', settled);
  }

  let connecting = false;

  async function connect(): Promise<void> {
    // Two taps while the prompt is up used to start two attempts. `MicSource`
    // survives that (its `attempt` token makes the earlier one let go), but
    // the screen did not: the two `applyStored()`/`status` writes land in
    // whichever order the permission prompt resolves in, so the sentence on
    // screen could describe the attempt that lost.
    if (connecting) return;
    connecting = true;
    connectButton.disabled = true;
    status.textContent = 'Asking for permission…';
    try {
      await micSource.connect(deviceSelect.value === '' ? undefined : deviceSelect.value);
      applyStored();
    } catch (error) {
      const { sentence, settled } = await describeRefusal(error);
      showNoInput(settled);
      status.textContent = sentence;
      return;
    } finally {
      connecting = false;
      connectButton.disabled = false;
    }
    showNoInput(false);
    renderConnection();
  }

  // --- the guided routine --------------------------------------------------

  async function runCalibration(): Promise<void> {
    if (calibrating) return;
    if (!micSource.state.connected) await connect();
    if (!micSource.state.connected) return;

    calibrating = true;
    calibrateButton.disabled = true;
    try {
      const outcome = await runCalibrationRoutine({
        deviceId: deviceSelect.value,
        lineInput: lineToggle.checked,
        quick: speedSelect.value === 'quick',
        onStage: (text) => {
          stageText.textContent = text;
        },
      });
      stageText.textContent = describeCalibration(outcome);
      renderStored();
    } catch (error) {
      stageText.textContent =
        error instanceof Error ? `Calibration stopped: ${error.message}` : 'Calibration stopped.';
    } finally {
      calibrating = false;
      calibrateButton.disabled = false;
    }
  }

  renderConnection();
  renderLevel();
  applyStored();
  return section;
}
