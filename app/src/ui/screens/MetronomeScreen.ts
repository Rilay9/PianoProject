// A metronome you can just switch on (docs/04-ui-spec.md §2a).
//
// The engine for this already existed: `audio/Metronome` schedules clicks on
// the AudioContext clock with a look-ahead window, which is what stops them
// drifting on a phone. What was missing was a way to use it without a score
// in front of you — practising scales, or counting a piece you are reading
// from paper — so this screen is a thin front end over that class and adds
// only the tap-tempo maths, which lives in `audio/tapTempo` and is tested
// separately.

import { audioEngine } from '../../audio/AudioEngine';
import { Metronome, type MetronomeBeat, type MetronomeSound } from '../../audio/Metronome';
import { EMPTY_TAP_STATE, MAX_BPM, MIN_BPM, tap, type TapTempoState } from '../../audio/tapTempo';
import { getMidiSettings } from '../../data/midiSettings';
import type { Router } from '../../router';
import { onScreenDispose } from '../screenLifecycle';
import { addButton, addParagraph, addSection, createSubScreen } from './subScreen';

/** Time signatures worth a button. Anything else can be typed into beats-per-bar. */
const METERS: { label: string; beats: number }[] = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '6/8', beats: 6 },
];

const SOUNDS: { label: string; value: MetronomeSound }[] = [
  { label: 'Wood', value: 'wood' },
  { label: 'Beep', value: 'beep' },
  { label: 'High', value: 'high' },
];

const DEFAULT_BPM = 80;

export function MetronomeScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'metronome',
    title: 'Metronome',
    backTo: 'today',
    backLabel: 'Today',
  });

  let metronome: Metronome | null = null;
  let bpm = DEFAULT_BPM;
  let beatsPerBar = 4;
  let sound: MetronomeSound = 'wood';
  let tapState: TapTempoState = EMPTY_TAP_STATE;

  // --- tempo ---------------------------------------------------------------
  const tempo = addSection(card, 'Tempo');

  const readout = document.createElement('p');
  readout.className = 'metronome-bpm';
  readout.id = 'metronome-bpm';
  tempo.appendChild(readout);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(MIN_BPM);
  slider.max = String(MAX_BPM);
  slider.step = '1';
  slider.value = String(bpm);
  slider.id = 'metronome-slider';
  slider.setAttribute('aria-label', 'Tempo in beats per minute');
  slider.addEventListener('input', () => setBpm(Number(slider.value)));
  tempo.appendChild(slider);

  const nudges = document.createElement('div');
  nudges.className = 'row';
  tempo.appendChild(nudges);
  addButton(nudges, '−5', () => setBpm(bpm - 5), { id: 'metronome-down' });
  addButton(nudges, '+5', () => setBpm(bpm + 5), { id: 'metronome-up' });
  const tapButton = addButton(nudges, 'Tap tempo', onTap, { id: 'metronome-tap' });

  // --- bar -----------------------------------------------------------------
  const bar = addSection(card, 'Bar');
  addParagraph(bar, 'The first beat of each bar is accented.', 'hint');
  const meterRow = document.createElement('div');
  meterRow.className = 'row';
  bar.appendChild(meterRow);
  const meterButtons = METERS.map((meter) =>
    addButton(meterRow, meter.label, () => setBeats(meter.beats), {
      id: `metronome-meter-${meter.beats}`,
    }),
  );

  const beatDots = document.createElement('div');
  beatDots.className = 'beat-dots';
  beatDots.id = 'metronome-beats';
  bar.appendChild(beatDots);

  // --- sound ---------------------------------------------------------------
  const soundBlock = addSection(card, 'Sound');
  addParagraph(
    soundBlock,
    'Use “High” when the microphone is listening: it sits above every piano note, so the detector can filter it out.',
    'hint',
  );
  const soundRow = document.createElement('div');
  soundRow.className = 'row';
  soundBlock.appendChild(soundRow);
  const soundButtons = SOUNDS.map((option) =>
    addButton(soundRow, option.label, () => setSound(option.value), {
      id: `metronome-sound-${option.value}`,
    }),
  );

  // --- transport -----------------------------------------------------------
  const transport = addSection(card, '');
  const startButton = addButton(transport, 'Start', () => void toggle(), {
    id: 'metronome-start',
    variant: 'primary',
  });
  const status = addParagraph(transport, '', 'hint');
  status.id = 'metronome-status';

  function setBpm(next: number): void {
    bpm = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(next)));
    slider.value = String(bpm);
    metronome?.setBpm(bpm);
    render();
  }

  function setBeats(next: number): void {
    beatsPerBar = next;
    metronome?.setBeatsPerBar(next);
    render();
  }

  function setSound(next: MetronomeSound): void {
    sound = next;
    metronome?.setSound(next);
    render();
  }

  function onTap(): void {
    tapState = tap(tapState, performance.now());
    if (tapState.bpm !== null) setBpm(tapState.bpm);
    else render();
  }

  async function toggle(): Promise<void> {
    if (metronome) {
      stop();
      return;
    }
    startButton.disabled = true;
    try {
      const context = await audioEngine.ensureStarted();
      metronome = new Metronome(context, {
        bpm,
        beatsPerBar,
        countInBars: 0,
        sound,
        volume: getMidiSettings().metronomeVolume,
        ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
      });
      metronome.onTick(onBeat);
      metronome.start();
    } catch (cause: unknown) {
      // Autoplay policy, or no audio device. Say which, rather than looking broken.
      status.textContent = `Could not start audio: ${String(cause)}`;
    } finally {
      startButton.disabled = false;
      render();
    }
  }

  function stop(): void {
    metronome?.stop();
    metronome?.dispose();
    metronome = null;
    currentBeat = -1;
    render();
  }

  let currentBeat = -1;
  function onBeat(beat: MetronomeBeat): void {
    // `beatInBar` is 1-based; the dots are an array.
    const index = beat.beatInBar - 1;
    currentBeat = index;
    // The tick fires when the click is *scheduled*, which is up to the
    // look-ahead window early (docs/01 §4.4). Light the dot when it actually
    // sounds, or the flash runs ahead of the sound by up to 100 ms — which is
    // exactly the error a metronome exists to not have.
    const context = audioEngine.contextOrNull;
    const delayMs = context ? Math.max(0, (beat.timeSec - context.currentTime) * 1000) : 0;
    window.setTimeout(() => {
      paintBeats(index);
    }, delayMs);
  }

  function paintBeats(active: number): void {
    for (const [index, dot] of [...beatDots.children].entries()) {
      dot.classList.toggle('is-active', index === active);
    }
  }

  function render(): void {
    readout.textContent = `${bpm} bpm`;
    startButton.textContent = metronome ? 'Stop' : 'Start';
    section.dataset.running = metronome ? 'true' : 'false';
    status.textContent = metronome
      ? `Running — ${beatsPerBar} beats to the bar`
      : tapState.bpm === null && tapState.taps.length === 1
        ? 'Keep tapping…'
        : '';
    tapButton.setAttribute('aria-pressed', String(tapState.taps.length > 0));

    for (const [index, meter] of METERS.entries()) {
      meterButtons[index]?.classList.toggle('is-selected', meter.beats === beatsPerBar);
    }
    for (const [index, option] of SOUNDS.entries()) {
      soundButtons[index]?.classList.toggle('is-selected', option.value === sound);
    }

    if (beatDots.children.length !== beatsPerBar) {
      beatDots.replaceChildren();
      for (let index = 0; index < beatsPerBar; index += 1) {
        const dot = document.createElement('span');
        dot.className = index === 0 ? 'beat-dot beat-dot--accent' : 'beat-dot';
        beatDots.appendChild(dot);
      }
    }
    paintBeats(currentBeat);
  }

  onScreenDispose(section, stop);
  render();
  return section;
}
