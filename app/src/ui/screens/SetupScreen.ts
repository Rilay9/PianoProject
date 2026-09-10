// The setup tour (docs/04 §7d): the first launch, and Settings → "Run the
// setup tour again".
//
// Eight steps, one screen each, in the order a person meets the app: what it
// is, which way the phone will sit, the piano, the sound, the screen, the four
// ways it follows you, the practice plan, and a summary. Every control writes straight through to the same stores Settings
// writes, so leaving half-way loses nothing and Settings shows what the tour
// set. Skipping is one tap on every step and is remembered; so is finishing.
//
// The choices that change what the screen looks like are shown, not
// described: a miniature of the score screen in this phone's own proportions
// (`ui/devicePreview`), drawn by the real engraver, either way up — because
// "Show fingering" means nothing until the fingering is on the screen in
// front of the person deciding, and "sideways" means nothing until they see
// what sideways buys. The miniature has the step to itself when it is shown:
// on the phone that is the choice between a miniature worth looking at and
// the choices beside it, so it is Preview and Back, never both at once.

import { createSubScreen } from './subScreen';
import { rememberedSetupStep, rememberSetupStep, resumeIndex } from './setupProgress';
import { onScreenDispose } from '../screenLifecycle';
import { getPiano, micSource, screenKeyboardSource, webMidiSource } from '../../app/services';
import { isWebMidiSupported, type MidiAccessError } from '../../midi/WebMidiSource';
import { MIDI_ERROR_HELP } from '../../midi/errorHelp';
import { midiToNoteName } from '../../midi/parseMidiMessage';
import type { InputNoteEvent } from '../../midi/types';
import { KeyboardStrip } from '../KeyboardStrip';
import { describeCalibration, runCalibrationRoutine } from '../../audio/pitch/calibrationRun';
import type { MicLevel } from '../../audio/pitch/MicSource';
import { DEFAULT_DEVICE_KEY, micCalibrationStore } from '../../data/micCalibrationStore';
import { getMidiSettings, updateMidiSettings } from '../../data/midiSettings';
import { getSettings, updateSettings, type PracticeSettings } from '../../data/settingsStore';
import { getSetupRecord, markSetup } from '../../data/setupStore';
import { getThemePreference, setThemePreference, type ThemePreference } from '../theme';
import { contentUrl, findItem } from '../../curriculum/load';
import { toMusicXml } from '../../score/mxl';
import { OsmdView } from '../../score/OsmdView';
import type { ScoreModel } from '../../score/types';
import { createDevicePreview, describeRatio, deviceSides, type DevicePreview, type Orientation } from '../devicePreview';
import { renderTrackChips } from '../trackChips';
import { button, el, field, numberControl, selectControl, toggleControl } from '../widgets';
import type { Router } from '../../router';

/** The piece the miniatures draw: one staff, four bars, always bundled. */
const PREVIEW_ITEM = 'song.folk.hot-cross-buns';
const PREVIEW_TITLE = 'Hot Cross Buns';

/**
 * A stand-in scale, used only to give a caption its real length before the
 * miniature it describes has been sized. Two digits, like every real answer.
 */
const NOMINAL_RATIO = 0.5;

const SESSION_LENGTHS = [15, 30, 60, 120].map((minutes) => ({
  value: String(minutes),
  label: `${String(minutes)} min`,
}));

interface Step {
  id: string;
  title: string;
  /** Builds the step into `host`; returns what to run when it is left. */
  build(host: HTMLElement): (() => void) | void;
}

/** The way the phone will sit, as the settings remember it. */
function chosenOrientation(): Orientation {
  return getSettings().landscapeLock ? 'sideways' : 'upright';
}

export function SetupScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'setup',
    title: 'Set up PianoPath',
    backTo: 'settings',
    backLabel: 'Settings',
  });
  section.dataset.setupStatus = getSetupRecord().status;

  // The step's number and title go in with Back and the screen's title, so
  // that sideways the four make one line (`04` §0 R5): the phone's 360 px
  // were spending 85 on three lines of heading before the step began.
  const subHead = card.querySelector('.sub-head');
  const progress = el('p.setup-progress.muted', { id: 'setup-progress' });
  const heading = el('h2.setup-title', { id: 'setup-title' });
  subHead?.append(progress, heading);
  const host = el('div.setup-step', { id: 'setup-step' });
  const back = button('← Back', () => show(index - 1), { id: 'setup-back', variant: 'quiet' });
  const skip = button('Skip for now', () => leave('skipped'), { id: 'setup-skip', variant: 'quiet' });
  const next = button('Next', () => (index === STEPS.length - 1 ? leave('done') : show(index + 1)), {
    id: 'setup-next',
    variant: 'primary',
  });
  const footer = el('div.setup-footer', {}, back, skip, next);
  card.append(host, footer);

  let index = 0;
  let disposeStep: (() => void) | void;

  function leave(status: 'skipped' | 'done'): void {
    markSetup(status);
    rememberSetupStep(null);
    router.navigate('today');
  }

  function show(at: number): void {
    const step = STEPS[at];
    if (!step) return;
    disposeStep?.();
    disposeStep = undefined;
    refit = null;
    index = at;
    // Where to come back to. A first launch lands on the tour, and a person
    // who leaves it half-way — a phone call, a notification, the back gesture
    // — used to come back to step one and have to do it all again. Cleared the
    // moment the tour is skipped or finished, so "run it again" still starts
    // at the beginning.
    rememberSetupStep(step.id);
    host.replaceChildren();
    section.dataset.setupStep = step.id;
    progress.textContent = `Step ${String(at + 1)} of ${String(STEPS.length)}`;
    heading.textContent = step.title;
    disposeStep = step.build(host);
    back.hidden = at === 0;
    skip.hidden = at === STEPS.length - 1;
    next.textContent = at === 0 ? 'Start' : at === STEPS.length - 1 ? 'Finish' : 'Next';
    // Back to the top of the new step: the tap that brought it was at the
    // foot of the last one, and whichever ancestor scrolls keeps its place.
    for (let node: HTMLElement | null = host; node; node = node.parentElement) node.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // Settings written as they are changed, exactly as Settings does it.
  const set = (patch: Partial<PracticeSettings>): void => {
    updateSettings(patch);
  };

  /** Whether the phone is sideways now — the miniature's neighbours go beside it, not under. */
  const sidewaysNow = (): boolean => window.innerWidth > window.innerHeight;

  /**
   * The smallest a miniature is allowed to be drawn.
   *
   * Below this it stops being a picture of anything. It is deliberately far
   * under the room any real phone leaves: it is a guard against a degenerate
   * zero, not a size the miniature is entitled to.
   */
  const MIN_PREVIEW_PX = 88;
  /** Stand-ins for the instant before the step has been laid out at all. */
  const UNMEASURED_WIDTH = 320;
  const UNMEASURED_HEIGHT = 240;

  /**
   * The box a miniature may fill, with `beside` — the text and buttons that
   * go with it — taking its share: to the left of it sideways, above and
   * below it upright.
   *
   * A *measured* dimension is the truth and is used as it stands. It used to
   * be rounded up to a floor — 200 px of width, 120 of height — which on the
   * owner's 740 × 342 landscape asked for more height than the step had, so
   * the miniature was drawn taller than the room and had to be scrolled to be
   * seen. A preview is the last thing on the step that may be compressed, and
   * it must never be the thing that overflows either; small and whole beats
   * big and cut off. The floors below only stand in for a box that has not
   * been laid out yet, where `clientWidth` reads 0.
   */
  const boxFor = (h: HTMLElement, beside: HTMLElement[]): { maxWidth: number; maxHeight: number } => {
    const measuredWidth = (h.clientWidth || card.clientWidth || 0) - 4;
    const room = measuredWidth > 0 ? measuredWidth : UNMEASURED_WIDTH;
    const height = h.clientHeight > 0 ? h.clientHeight - 8 : UNMEASURED_HEIGHT;
    if (sidewaysNow()) {
      const column = Math.max(...beside.map((node) => node.getBoundingClientRect().width), 0);
      return {
        maxWidth: atLeast(room - column - 16, room),
        maxHeight: atLeast(height, height),
      };
    }
    const taken = beside.reduce((sum, node) => sum + node.getBoundingClientRect().height, 0);
    return { maxWidth: room, maxHeight: atLeast(height - taken - 12, height) };
  };

  /**
   * `wanted`, given a picture's worth of floor and never more than the room.
   *
   * The floor is itself capped by the room, which is the whole point: a
   * miniature that will not go below 88 px in a box 60 px tall is a miniature
   * that overflows its box, and an overflowing preview is worse than a small
   * one — the owner's phone showed a miniature that had to be scrolled to be
   * seen, and scrolling it moves the words that explain it off the screen.
   */
  function atLeast(wanted: number, room: number): number {
    return Math.min(room, Math.max(wanted, Math.min(MIN_PREVIEW_PX, room)));
  }

  /**
   * What to draw again when the phone is turned.
   *
   * A miniature is sized once, from the room the step had when it was built,
   * and nothing was watching for that room changing. Turn the phone on the
   * "which way up" step and a frame measured for a 306 px upright column stays
   * 424 px wide in it — the document then scrolls sideways, which is the one
   * thing `style.css` says must never happen. Set by the two steps that draw a
   * miniature, cleared by every other.
   */
  let refit: (() => void) | null = null;
  let refitPending = false;
  const onResize = (): void => {
    if (refit === null || refitPending) return;
    refitPending = true;
    // Next frame: a rotation fires `resize` several times as the viewport
    // settles, and engraving the miniature three times is three engravings.
    requestAnimationFrame(() => {
      refitPending = false;
      refit?.();
    });
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  // ---------------------------------------------------------------- 1 welcome
  const welcome: Step = {
    id: 'welcome',
    title: 'Welcome',
    build(h) {
      h.append(
        el('p', {
          text:
            'PianoPath listens to what you play and follows along on the page: it waits ' +
            'for the right note, or keeps the tempo and marks what you missed.',
        }),
        el('p', {
          text:
            'This takes about three minutes: which way the phone sits, the piano, the sound, ' +
            'the screen, and the way the app follows you. Everything here can be changed ' +
            'later in Settings, and this tour can be run again from there.',
        }),
        el('p.muted', { text: 'Skip for now if you would rather look around first.' }),
      );
    },
  };

  // ---------------------------------------------------------------- 2 which way up
  const hold: Step = {
    id: 'hold',
    title: 'Which way will the phone sit on the stand?',
    build(h) {
      const { short, long } = deviceSides();
      // The words and the two choices in one column, the miniature of the
      // chosen way up beside them sideways and under them upright; the other
      // way up is a tap away. Two miniatures side by side were each too small
      // to show anything on the phone.
      const text = el(
        'div.setup-hold__text',
        {},
        el('p', {
          text:
            `This is your screen, ${String(short)} by ${String(long)}, with a piece on it. ` +
            'Upright shows the bars being played and the ones coming, one under the other. ' +
            'Sideways shows one line at a time, larger, and slides along it. Tap the other to see it.',
        }),
      );
      const choices = el('div.setup-choices', { id: 'setup-orientation' });
      const caption = el('p.muted', { id: 'setup-hold-caption' });
      text.append(choices, caption);
      const frame = el('div.setup-preview-host.setup-preview-host--fill', { id: 'setup-hold-preview' });
      h.append(el('div.setup-hold', {}, text, frame));

      let preview: DevicePreview | null = null;
      const captionFor = (orientation: Orientation, ratio: number): string =>
        `${orientation === 'upright' ? 'Upright' : 'Sideways'}, shown ${describeRatio(ratio)}. ` +
        (orientation === 'sideways'
          ? 'Sideways locks the score screen to landscape.'
          : 'Upright leaves the phone free to turn.');
      const draw = (): void => {
        const orientation = chosenOrientation();
        preview?.dispose();
        // The caption is written before the box is measured, not after.
        // `boxFor` subtracts the height of everything that goes above the
        // miniature, and this is two lines of it on a phone — measured while
        // it was still empty, so every miniature was asked for two lines more
        // height than the step had, and the preview was what ran off the fold.
        // The nominal ratio is only to give the sentence its real length; the
        // true one is written in below.
        caption.textContent = captionFor(orientation, NOMINAL_RATIO);
        preview = createDevicePreview({
          orientation,
          ...boxFor(h, [text]),
          title: PREVIEW_TITLE,
          source: loadPreviewSource,
        });
        frame.replaceChildren(preview.el);
        frame.dataset.orientation = orientation;
        caption.textContent = captionFor(orientation, preview.ratio);
        for (const node of choices.querySelectorAll('.setup-choice')) {
          node.setAttribute('aria-pressed', String(node.id === `setup-hold-${orientation}`));
        }
        void preview.redraw();
      };
      refit = draw;
      for (const orientation of ['upright', 'sideways'] as const) {
        const choice = el('button.setup-choice', {
          type: 'button',
          id: `setup-hold-${orientation}`,
          'aria-pressed': false,
          text: orientation === 'upright' ? 'Upright' : 'Sideways',
        });
        choice.addEventListener('click', () => {
          // The score screen's landscape lock is the memory of this choice.
          set({ landscapeLock: orientation === 'sideways' });
          draw();
        });
        choices.append(choice);
      }
      draw();
      return () => preview?.dispose();
    },
  };

  // ---------------------------------------------------------------- 3 the piano
  const piano: Step = {
    id: 'piano',
    title: 'Your piano',
    build(h) {
      h.append(
        el('p', {
          text:
            'A USB cable from the piano’s MIDI OUT into the phone is the sure way: every ' +
            'key is heard exactly. Chrome asks once for permission when you tap Connect.',
        }),
      );
      const status = el('p.status', { id: 'setup-midi-status', role: 'status' });
      const errorBox = el('div.notice.notice--error', { id: 'setup-midi-error', hidden: true });
      const connect = button('Connect piano', () => void connectMidi(), {
        id: 'setup-midi-connect',
        variant: 'primary',
      });
      const devices = el('div.device-list', { id: 'setup-midi-devices' });
      h.append(el('div.row', {}, connect), status, errorBox, devices);

      // A strip that lights up: the proof the cable works, and an input of
      // its own when there is no cable at all.
      h.append(el('p.muted', { text: 'Play a few keys — or tap these. They should light up.' }));
      const strip = new KeyboardStrip({
        from: 48,
        to: 72,
        interactive: true,
        onNoteOn: (midi, velocity) => {
          screenKeyboardSource.noteOn(midi, velocity);
          void playThrough(midi, velocity);
        },
        onNoteOff: (midi) => screenKeyboardSource.noteOff(midi),
      });
      const lastNote = el('p.status', { id: 'setup-last-note' });
      h.append(strip.el, lastNote);
      const pressed = new Set<number>();
      const onNote = (e: InputNoteEvent): void => {
        if (e.kind === 'noteOn') pressed.add(e.midi);
        else pressed.delete(e.midi);
        strip.setState({ pressed });
        if (e.kind === 'noteOn') {
          lastNote.textContent = `Heard ${midiToNoteName(e.midi)} from the ${e.source === 'midi' ? 'piano' : 'screen keys'}.`;
        }
      };

      // The microphone, for a piano with no usable MIDI out.
      const micBlock = el('details.setup-details', { id: 'setup-mic' }) as HTMLDetailsElement;
      micBlock.append(el('summary', { text: 'No cable? Use the microphone' }));
      const micStatus = el('p.status', { id: 'setup-mic-status' });
      const micLevel = el('p.muted', { id: 'setup-mic-level', text: 'Level: —' });
      const micConnect = button('Connect microphone', () => void connectMic(), { id: 'setup-mic-connect' });
      const micCalibrate = button('Quick calibration (15 s)', () => void calibrate(), {
        id: 'setup-mic-calibrate',
      });
      const micStage = el('p.status', { id: 'setup-mic-stage' });
      micBlock.append(
        el('p.muted', {
          text:
            'Never as certain as a cable — anything it is unsure about is shown amber and ' +
            'never counted against you. A quick calibration teaches it this room and this piano.',
        }),
        el('div.row', {}, micConnect, micCalibrate),
        micStatus,
        micLevel,
        micStage,
      );
      h.append(micBlock);

      const s = getSettings();
      h.append(
        field(
          'Which input the app follows',
          selectControl(
            'setup-input-priority',
            [
              { value: 'midi,mic,none', label: 'MIDI → Mic → Timed' },
              { value: 'mic,midi,none', label: 'Mic → MIDI → Timed' },
              { value: 'midi,none', label: 'MIDI only, else Timed' },
              { value: 'none', label: 'Always Timed' },
            ],
            s.inputPriority.join(','),
            (value) => set({ inputPriority: value.split(',') as PracticeSettings['inputPriority'] }),
          ),
          'Timed means the clock drives the cursor and nothing is judged.',
        ),
        el('p.muted', {
          text:
            'If Keep tempo ever scores you late on notes you played on the beat, Settings → ' +
            'Diagnostics measures how late the piano is — cable, USB and audio together — and ' +
            'the app allows for it.',
        }),
      );

      async function connectMidi(): Promise<void> {
        errorBox.hidden = true;
        connect.disabled = true;
        status.textContent = 'Waiting for the browser’s permission prompt…';
        try {
          await webMidiSource.connect();
        } catch (cause) {
          const err = cause as MidiAccessError;
          errorBox.hidden = false;
          errorBox.replaceChildren(el('strong', { text: err.message }), el('p', { text: MIDI_ERROR_HELP[err.code] ?? '' }));
        } finally {
          connect.disabled = false;
          renderMidi();
        }
      }

      function renderMidi(): void {
        const state = webMidiSource.state;
        status.textContent = state.detail;
        section.dataset.midiConnected = String(state.connected);
        connect.textContent = state.connected ? 'Reconnect' : 'Connect piano';
        devices.replaceChildren();
        const inputs = webMidiSource.inputs;
        if (inputs.length === 0) return;
        const pinned = getMidiSettings().pinnedInputId;
        const row = (label: string, id: string | null, checked: boolean): HTMLElement => {
          const radio = el('input', { type: 'radio', name: 'setup-midi-input', checked, value: id ?? '' }) as HTMLInputElement;
          radio.addEventListener('change', () => {
            updateMidiSettings({ pinnedInputId: id });
            renderMidi();
          });
          return el('label.device-row', {}, radio, el('span', { text: label }));
        };
        devices.append(row('Listen to all inputs', null, pinned === null));
        for (const input of inputs) {
          const label = input.manufacturer ? `${input.name} — ${input.manufacturer}` : input.name;
          devices.append(row(label, input.id, pinned === input.id));
        }
      }

      async function connectMic(): Promise<void> {
        micStatus.textContent = 'Asking for permission…';
        try {
          await micSource.connect();
          const stored = micCalibrationStore.get(micSource.pinnedInputId ?? '');
          micSource.applyCalibration(stored ?? null);
        } catch (error) {
          micStatus.textContent = error instanceof Error ? error.message : 'Could not open the microphone.';
          return;
        }
        renderMic();
      }

      async function calibrate(): Promise<void> {
        if (!micSource.state.connected) await connectMic();
        if (!micSource.state.connected) return;
        micCalibrate.disabled = true;
        try {
          const outcome = await runCalibrationRoutine({
            deviceId: micSource.pinnedInputId ?? '',
            lineInput: false,
            quick: true,
            onStage: (text) => {
              micStage.textContent = text;
            },
          });
          micStage.textContent = describeCalibration(outcome);
        } catch (error) {
          micStage.textContent =
            error instanceof Error ? `Calibration stopped: ${error.message}` : 'Calibration stopped.';
        } finally {
          micCalibrate.disabled = false;
        }
      }

      function renderMic(): void {
        const state = micSource.state;
        micStatus.textContent = state.connected ? `Connected — ${state.detail}` : 'Not connected.';
        micConnect.textContent = state.connected ? 'Reconnect' : 'Connect microphone';
        if (state.connected) micBlock.open = true;
      }

      function renderLevel(level: MicLevel): void {
        micLevel.textContent =
          `Level ${level.rmsDb.toFixed(0)} dB · noise floor ${level.noiseFloorDb.toFixed(0)} dB` +
          (level.peak > 0.95 ? ' — clipping, move further away' : '');
      }

      const offs = [
        webMidiSource.onNote(onNote),
        screenKeyboardSource.onNote(onNote),
        webMidiSource.onStateChange(() => renderMidi()),
        micSource.onStateChange(() => renderMic()),
        micSource.onLevel(renderLevel),
      ];
      if (!isWebMidiSupported()) {
        connect.disabled = true;
        errorBox.hidden = false;
        errorBox.replaceChildren(el('strong', { text: 'Web MIDI is not supported here.' }), el('p', { text: MIDI_ERROR_HELP.unsupported ?? '' }));
        micBlock.open = true;
      }
      renderMidi();
      renderMic();
      return () => {
        for (const off of offs) off();
        screenKeyboardSource.releaseAll();
        strip.destroy();
        micSource.stopRecording();
      };
    },
  };

  // ---------------------------------------------------------------- 5 sound
  const sound: Step = {
    id: 'sound',
    title: 'Sound',
    build(h) {
      const s = getSettings();
      const midi = getMidiSettings();
      const soundStatus = el('p.status', { id: 'setup-sound-status' });
      h.append(
        el('p', {
          text:
            'The phone plays the piano for “Hear it” and for the hand you are not practising, ' +
            'and clicks the metronome. Set the levels here against your real piano.',
        }),
        el(
          'div.row',
          {},
          button('Test sound (C major)', () => void testSound(), { id: 'setup-test-sound', variant: 'primary' }),
        ),
        soundStatus,
        field('Piano volume', numberControl('setup-piano-volume', Math.round(midi.pianoVolume * 100), (v) => updateMidiSettings({ pianoVolume: v / 100 }), { min: 0, max: 100, step: 5 })),
        field('Metronome volume', numberControl('setup-metronome-volume', Math.round(midi.metronomeVolume * 100), (v) => updateMidiSettings({ metronomeVolume: v / 100 }), { min: 0, max: 100, step: 5 })),
        field(
          'Metronome sound',
          selectControl(
            'setup-metronome-sound',
            [
              { value: 'wood', label: 'Wood' },
              { value: 'beep', label: 'Beep' },
              { value: 'high', label: 'High (5 kHz)' },
            ],
            s.metronomeSound,
            (value) => set({ metronomeSound: value as PracticeSettings['metronomeSound'] }),
          ),
          'High is the click the mic detector notches out. Use it when the mic is listening.',
        ),
        field(
          'Playback plays',
          selectControl(
            'setup-playback-hands',
            [
              { value: 'non-focused', label: 'The other hand' },
              { value: 'both', label: 'Both hands' },
              { value: 'none', label: 'Nothing' },
            ],
            s.playbackHands,
            (value) => set({ playbackHands: value as PracticeSettings['playbackHands'] }),
          ),
          'While you practise one hand, the phone can play the other.',
        ),
        field(
          'Playback destination',
          selectControl(
            'setup-playback-destination',
            [
              { value: 'phone', label: 'Phone' },
              { value: 'piano', label: 'Piano over MIDI OUT' },
              { value: 'both', label: 'Both' },
            ],
            s.playbackDestination,
            (value) => set({ playbackDestination: value as PracticeSettings['playbackDestination'] }),
          ),
          'With the mic listening, send it to the piano: the phone would be heard as you.',
        ),
      );

      async function testSound(): Promise<void> {
        soundStatus.textContent = 'Loading piano samples…';
        try {
          const piano = await getPiano();
          piano.playChord();
          soundStatus.textContent = 'Played a C major chord.';
        } catch (cause) {
          soundStatus.textContent = `Could not start audio: ${cause instanceof Error ? cause.message : String(cause)}`;
        }
      }
    },
  };

  // ---------------------------------------------------------------- 6 the screen
  const display: Step = {
    id: 'display',
    title: 'The screen',
    build(h) {
      let orientation = chosenOrientation();
      // Two views of the one step: the choices, and the preview of them. The
      // preview has the whole step, bounded by the fold both ways, with its
      // caption and buttons beside it sideways and under it upright.
      const options = el('div.setup-options', { id: 'setup-options' });
      const panel = el('div.setup-preview-panel', { id: 'setup-preview-panel' });
      panel.hidden = true;
      h.append(options, panel);

      const frameHost = el('div.setup-preview-host.setup-preview-host--fill', { id: 'setup-preview' });
      const caption = el('p.muted', { id: 'setup-preview-caption' });
      const flip = button('Show it sideways', () => {
        orientation = orientation === 'upright' ? 'sideways' : 'upright';
        rebuildFrame();
      }, { id: 'setup-preview-flip', variant: 'quiet' });
      const close = button('Back to the choices', () => showPreview(false), { id: 'setup-preview-close', variant: 'primary' });
      const beside = el('div.setup-preview-panel__text', {}, caption, el('div.row', {}, close, flip));
      panel.append(beside, frameHost);

      let preview: DevicePreview | null = null;
      const captionFor = (ratio: number): string =>
        `${orientation === 'upright' ? 'Upright' : 'Sideways'}, shown ${describeRatio(ratio)}, ` +
        'with the choices as they are now.';
      const rebuildFrame = (): void => {
        preview?.dispose();
        // Written before the measurement, for the reason the "which way up"
        // step carries in full: `beside` is what the miniature's height is
        // taken out of, and an empty caption measures two lines short.
        caption.textContent = captionFor(NOMINAL_RATIO);
        flip.textContent = orientation === 'upright' ? 'Show it sideways' : 'Show it upright';
        preview = createDevicePreview({
          orientation,
          ...boxFor(h, [beside]),
          title: PREVIEW_TITLE,
          source: loadPreviewSource,
        });
        frameHost.replaceChildren(preview.el);
        frameHost.dataset.orientation = orientation;
        caption.textContent = captionFor(preview.ratio);
        void preview.redraw();
      };
      // Turning the phone with the preview open re-measures it; with the
      // choices showing there is nothing drawn to re-measure.
      refit = () => {
        if (!panel.hidden) rebuildFrame();
      };
      const showPreview = (on: boolean): void => {
        options.hidden = on;
        panel.hidden = !on;
        h.scrollTop = 0;
        if (on) {
          rebuildFrame();
        } else {
          preview?.dispose();
          preview = null;
          frameHost.replaceChildren();
        }
      };

      const s = getSettings();
      options.append(
        el('p', {
          text: 'The score screen on your phone, the way you chose to hold it. Preview draws it with the choices below as they stand; change one and look again.',
        }),
        el('div.row', {}, button('Preview', () => showPreview(true), { id: 'setup-preview-open', variant: 'primary' })),
        field(
          'Theme',
          selectControl(
            'setup-theme',
            [
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ],
            getThemePreference(),
            (value) => setThemePreference(value as ThemePreference),
          ),
        ),
        field(
          'Keys under the score',
          selectControl(
            'setup-keys',
            [
              { value: 'strip', label: 'Keyboard' },
              { value: 'ribbon', label: 'Ribbon, with the note name' },
              { value: 'off', label: 'Off' },
            ],
            s.keys,
            (value) => set({ keys: value as PracticeSettings['keys'] }),
          ),
          'The key it is waiting for is blue; a played one turns green or red.',
        ),
        field(
          'Keys guide',
          selectControl(
            'setup-keys-guide',
            [
              { value: 'next', label: 'The note it waits for' },
              { value: 'next-two', label: 'That, and the one after' },
              { value: 'off', label: 'Off' },
            ],
            s.keysGuide,
            (value) => set({ keysGuide: value as PracticeSettings['keysGuide'] }),
          ),
          'Marked blue on the keys before you play it; the one after in a paler blue.',
        ),
        field('Finger numbers on the keys', toggleControl('setup-keys-fingers', s.keysFingerNumbers, (v) => set({ keysFingerNumbers: v })), 'The score’s finger number, printed on each marked key.'),
        field('Flash a hit green and a miss red', toggleControl('setup-keys-flash', s.keysFlash, (v) => set({ keysFlash: v })), 'For under a second; then the key goes back to the guide.'),
        field('Show fingering', toggleControl('setup-fingering', s.showFingering, (v) => set({ showFingering: v }))),
        field('Show chord symbols', toggleControl('setup-chords', s.showChordSymbols, (v) => set({ showChordSymbols: v }))),
        field(
          'Name the note I am waiting for',
          toggleControl('setup-notenames', s.showNoteNames, (v) => set({ showNoteNames: v })),
          'In Wait mode: “Waiting for F♯4” under the title. A crutch for when you are stuck.',
        ),
        field('Size', numberControl('setup-zoom', s.zoom, (v) => set({ zoom: v }), { min: 0.5, max: 2.5, step: 0.1 }), '1 is as big as the screen allows; the notes never get smaller than the width needs.'),
        field('Bars per window', numberControl('setup-bars', s.barsPerWindow, (v) => set({ barsPerWindow: v }), { min: 1, max: 8 }), 'Two is a magnifying glass; eight is a reading exercise.'),
        field(
          'Layout',
          selectControl(
            'setup-layout',
            [
              { value: 'window', label: 'Window' },
              { value: 'scroll', label: 'Scroll' },
            ],
            s.layout,
            (value) => set({ layout: value as PracticeSettings['layout'] }),
          ),
          'Window shows the bars being played, and the next ones; Scroll shows the whole piece.',
        ),
        field('Landscape lock on the score screen', toggleControl('setup-landscape', s.landscapeLock, (v) => set({ landscapeLock: v })), 'What the sideways choice set; the score screen turns with the phone when it is off.'),
        field('Keep the screen awake', toggleControl('setup-awake', s.keepScreenAwake, (v) => set({ keepScreenAwake: v }))),
      );

      return () => {
        preview?.dispose();
      };
    },
  };

  // ---------------------------------------------------------------- 7 modes
  const modes: Step = {
    id: 'modes',
    title: 'How it follows you',
    build(h) {
      const s = getSettings();
      const mode = (name: string, what: string): HTMLElement =>
        el('div.setup-mode', {}, el('strong', { text: name }), el('span', { text: ` — ${what}` }));
      h.append(
        el(
          'div.setup-modes',
          {},
          mode('Wait for me', 'the score holds still until you play the right note. The first time you meet a piece.'),
          mode('Keep tempo', 'a click and a moving cursor, whether you are with it or not. This is the mode that scores.'),
          mode('Play it to me', 'the phone plays the piece; you watch and listen. Also “Hear it” on the score screen.'),
          mode('Free play', 'nothing judged, the page turns on your own notes. For improvising or just playing.'),
        ),
        el('p.muted', {
          text: 'Long-press a bar on the score screen to hear that bar; double-tap two bars to loop them.',
        }),
        field(
          'Default mode, with a piano or a mic',
          selectControl(
            'setup-mode-input',
            [
              { value: 'wait', label: 'Wait for me' },
              { value: 'tempo', label: 'Keep tempo' },
            ],
            s.defaultModeWithInput,
            (value) => set({ defaultModeWithInput: value as 'wait' | 'tempo' }),
          ),
        ),
        field(
          'Default mode, with nothing to hear you',
          selectControl(
            'setup-mode-noinput',
            [
              { value: 'tempo', label: 'Keep tempo (timed)' },
              { value: 'wait', label: 'Wait for me (screen keys)' },
            ],
            s.defaultModeWithoutInput,
            (value) => set({ defaultModeWithoutInput: value as 'wait' | 'tempo' }),
          ),
        ),
        field('Count-in bars', numberControl('setup-countin', s.countInBars, (v) => set({ countInBars: v }), { min: 0, max: 4 }), 'Clicks before a Keep tempo run starts.'),
        field('Default tempo % for a new piece', numberControl('setup-tempo', s.defaultTempoPct, (v) => set({ defaultTempoPct: v }), { min: 30, max: 130, step: 5 }), 'Slow practice is the only kind that changes what your hands do.'),
        field('Strict Wait mode', toggleControl('setup-waitstrict', s.waitStrict, (v) => set({ waitStrict: v })), 'Off: a wrong note does not reset the chord.'),
        field('Keep tempo tolerance (ms)', numberControl('setup-tolerance', s.toleranceMs, (v) => set({ toleranceMs: v }), { min: 30, max: 500, step: 10 }), 'How far from the beat a note still counts.'),
        field('A pass needs accuracy %', numberControl('setup-pass-accuracy', s.passAccuracyPct, (v) => set({ passAccuracyPct: v }), { min: 50, max: 100 })),
        field('… at tempo %', numberControl('setup-pass-tempo', s.passTempoPct, (v) => set({ passTempoPct: v }), { min: 30, max: 130, step: 5 })),
      );
    },
  };

  // ---------------------------------------------------------------- 8 practice
  const practice: Step = {
    id: 'practice',
    title: 'Your practice',
    build(h) {
      const s = getSettings();
      const trackRow = el('div.filter-row', { id: 'setup-tracks' });
      h.append(
        el('p', {
          text:
            'Today builds a session for you: warm-up, something new, a review, and free playing. ' +
            'Tell it how long you have, and which tracks you want in it.',
        }),
        field(
          'Weekday session',
          selectControl('setup-weekday-minutes', SESSION_LENGTHS, String(s.weekdaySessionMinutes), (value) => set({ weekdaySessionMinutes: Number(value) })),
        ),
        field(
          'Weekend session',
          selectControl('setup-weekend-minutes', SESSION_LENGTHS, String(s.weekendSessionMinutes), (value) => set({ weekendSessionMinutes: Number(value) })),
        ),
        el('p', { text: 'Tracks' }),
        trackRow,
        field(
          'Strict prerequisites',
          toggleControl('setup-strict-prereqs', s.strictPrerequisites, (v) => set({ strictPrerequisites: v })),
          'On, an unfinished rung shows a badge and asks once. Nothing is disabled.',
        ),
        field(
          'Require two songs per lesson',
          toggleControl('setup-two-songs', s.requireTwoSongs, (v) => set({ requireTwoSongs: v })),
          'The stricter completion rule. It never applies to a unit whose skill no song tests.',
        ),
      );
      void renderTrackChips(trackRow, 'setup-track');
    },
  };

  // ---------------------------------------------------------------- 9 done
  const done: Step = {
    id: 'done',
    title: 'Ready',
    build(h) {
      const s = getSettings();
      const inputs = webMidiSource.inputs.length;
      const calibrated = micCalibrationStore.get(micSource.pinnedInputId ?? DEFAULT_DEVICE_KEY);
      const line = (label: string, value: string): HTMLElement =>
        el('div.kv', {}, el('span.kv__k', { text: label }), el('span.kv__v', { text: value }));
      h.append(
        el('div.setup-summary', { id: 'setup-summary' },
          line('The phone sits', s.landscapeLock ? 'sideways' : 'upright'),
          line('Piano', inputs > 0 ? `${String(inputs)} MIDI input${inputs === 1 ? '' : 's'} connected` : calibrated ? 'Microphone, calibrated' : 'Screen keys, or timed'),
          line('Default mode', s.defaultModeWithInput === 'wait' ? 'Wait for me' : 'Keep tempo'),
          line('Keys under the score', s.keys === 'strip' ? 'Keyboard' : s.keys === 'ribbon' ? 'Ribbon' : 'Off'),
          line('Theme', getThemePreference()),
          line('Sessions', `${String(s.weekdaySessionMinutes)} min weekdays, ${String(s.weekendSessionMinutes)} min weekends`),
        ),
        el('p', { text: 'Today has a session waiting. Settings → “Setup tour · Run again” brings this back any time.' }),
      );
    },
  };

  const STEPS: Step[] = [welcome, hold, piano, sound, display, modes, practice, done];

  onScreenDispose(section, () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    refit = null;
    disposeStep?.();
    disposeStep = undefined;
  });

  show(resumeIndex(rememberedSetupStep(), STEPS.map((step) => step.id)));
  return section;
}

async function playThrough(midi: number, velocity: number): Promise<void> {
  try {
    const piano = await getPiano();
    piano.start({ midi, velocity, durationSec: 1.2 });
  } catch {
    // Sound is a bonus here; the lit key is the point.
  }
}

/** The miniatures' piece, loaded once for the life of the page. */
let previewSource: Promise<{ model: ScoreModel; musicXml: string }> | null = null;

function loadPreviewSource(): Promise<{ model: ScoreModel; musicXml: string }> {
  previewSource ??= (async () => {
    const item = await findItem(PREVIEW_ITEM);
    if (!item?.file) throw new Error(`${PREVIEW_ITEM} is not in the catalog`);
    const response = await fetch(contentUrl(item.file));
    if (!response.ok) throw new Error(`${String(response.status)} ${response.statusText}`);
    const musicXml = toMusicXml(new Uint8Array(await response.arrayBuffer()));
    // The model comes from an instance with no draw range (`ScoreScreen`).
    const probe = new OsmdView(document.createElement('div'));
    await probe.load(musicXml);
    const model = probe.extractModel({ id: item.id });
    probe.dispose();
    return { model, musicXml };
  })().catch((cause: unknown) => {
    previewSource = null;
    throw cause;
  });
  return previewSource;
}
