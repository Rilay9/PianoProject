/**
 * The Score screen (docs/04-ui-spec.md §5) — the screen the app exists for.
 *
 * Structure: the notation fills the viewport, a control bar auto-hides over
 * it, an optional keyboard strip sits along the bottom, and a summary sheet
 * covers everything at the end of a run. All the timing, judging and
 * scheduling lives in `score/ScoreSession`; this file is chrome and wiring.
 *
 * `#/score/<catalog id>` — the id is in the hash so reload and the back
 * gesture work with no extra state (docs/04 §1).
 */
import { audioEngine } from '../../audio/AudioEngine';
import { metronomeSoundFor } from '../../audio/inputPolicy';
import { getPiano, micSource, screenKeyboardSource, webMidiSource } from '../../app/services';
import { findItem, contentUrl } from '../../curriculum/load';
import { getImport } from '../../data/importStore';
import type { CatalogItem } from '../../curriculum/types';
import { getMidiSettings } from '../../data/midiSettings';
import { getSettings, updateSettings, type FollowInput } from '../../data/settingsStore';
import { evaluateOutcome } from '../../engine/Scoring';
import { recordRun } from '../../data/progressStore';
import type { Mode, SessionScore } from '../../engine/types';
import type { InputNoteEvent } from '../../midi/types';
import { toMusicXml } from '../../score/mxl';
import { OsmdView } from '../../score/OsmdView';
import { ScoreSession } from '../../score/ScoreSession';
import {
  MAX_BARS_PER_WINDOW,
  MIN_BARS_PER_WINDOW,
  WindowRenderer,
  type HandsFocus,
  type ScoreLayout,
} from '../../score/WindowRenderer';
import { bpmAt, type ScoreModel } from '../../score/types';
import type { Router } from '../../router';
import { KeyboardStrip } from '../KeyboardStrip';
import { onScreenDispose } from '../screenLifecycle';

const MODES: { id: Mode; label: string }[] = [
  { id: 'wait', label: 'Wait' },
  { id: 'tempo', label: 'Tempo' },
  { id: 'listen', label: 'Listen' },
  { id: 'free', label: 'Free' },
];

const INPUTS: { id: FollowInput; label: string }[] = [
  { id: 'midi', label: 'MIDI' },
  { id: 'mic', label: 'Mic' },
  { id: 'keys', label: 'Screen keys' },
  { id: 'none', label: 'None' },
];

const HANDS: { id: HandsFocus; label: string }[] = [
  { id: 'R', label: 'R' },
  { id: 'L', label: 'L' },
  { id: 'both', label: 'Both' },
];

/** The control bar hides after this long without a tap (docs/04 §5). */
export const CONTROL_BAR_HIDE_MS = 3_000;

export function ScoreScreen(router: Router): HTMLElement {
  const section = document.createElement('section');
  section.className = 'screen screen--score';
  section.dataset.screen = 'score';

  const itemId = router.route.score ?? '';
  let item: CatalogItem | undefined;
  let model: ScoreModel | null = null;
  let renderer: WindowRenderer | null = null;
  let session: ScoreSession | null = null;
  let strip: KeyboardStrip | null = null;
  let wakeLock: WakeLockSentinel | null = null;

  const settings = { ...getSettings() };
  let mode: Mode = 'wait';
  let input: FollowInput = 'none';
  let hands: HandsFocus = 'both';
  let tempoPct = settings.defaultTempoPct;
  let metronomeOn = false;
  let loopBars: { from: number; to: number } | null = null;
  let loopAnchor: number | null = null;
  const unsubscribers: (() => void)[] = [];

  // --- chrome --------------------------------------------------------------
  const stage = document.createElement('div');
  stage.className = 'score-stage';
  stage.id = 'score-stage';
  section.appendChild(stage);

  const status = document.createElement('p');
  status.className = 'score-status';
  status.id = 'score-status';
  status.textContent = 'Loading…';
  section.appendChild(status);

  const bar = document.createElement('div');
  bar.className = 'score-bar';
  bar.id = 'score-bar';
  section.appendChild(bar);

  const stripHost = document.createElement('div');
  stripHost.className = 'score-strip';
  stripHost.id = 'score-strip';
  section.appendChild(stripHost);

  const sheet = document.createElement('div');
  sheet.className = 'summary-sheet';
  sheet.id = 'score-summary';
  sheet.hidden = true;
  section.appendChild(sheet);

  // --- control bar ---------------------------------------------------------
  const back = button('← Back', () => router.navigate(router.route.tab), 'score-back');
  bar.appendChild(back);

  const restart = button('⏮', () => startRun(), 'score-restart');
  bar.appendChild(restart);

  const playPause = button('▶', () => togglePlay(), 'score-play');
  bar.appendChild(playPause);

  const inputSelect = select(
    INPUTS.map((i) => ({ value: i.id, label: i.label })),
    'score-input',
    'Follow input',
    (value) => {
      input = value as FollowInput;
      attachInput();
      render();
    },
  );
  bar.appendChild(inputSelect);

  const modeSelect = select(
    MODES.map((m) => ({ value: m.id, label: m.label })),
    'score-mode',
    'Practice mode',
    (value) => {
      mode = value as Mode;
      if (session?.running) startRun();
      render();
    },
  );
  bar.appendChild(modeSelect);

  const tempo = document.createElement('input');
  tempo.type = 'range';
  tempo.min = '30';
  tempo.max = '130';
  tempo.step = '5';
  tempo.id = 'score-tempo';
  tempo.setAttribute('aria-label', 'Tempo percent');
  tempo.value = String(tempoPct);
  tempo.addEventListener('input', () => {
    tempoPct = Number(tempo.value);
    if (session?.running) startRun();
    render();
  });
  bar.appendChild(tempo);

  const tempoLabel = document.createElement('span');
  tempoLabel.className = 'score-tempo-label';
  tempoLabel.id = 'score-tempo-label';
  tempoLabel.tabIndex = 0;
  tempoLabel.title = 'Tap to type a bpm';
  tempoLabel.addEventListener('click', promptForBpm);
  bar.appendChild(tempoLabel);

  const handsGroup = document.createElement('div');
  handsGroup.className = 'score-group';
  for (const hand of HANDS) {
    handsGroup.appendChild(
      button(
        hand.label,
        () => {
          hands = hand.id;
          renderer?.setHandsFocus(hand.id);
          if (session?.running) startRun();
          render();
        },
        `score-hands-${hand.id}`,
      ),
    );
  }
  bar.appendChild(handsGroup);

  const loopButton = button('Loop', () => clearLoop(), 'score-loop');
  bar.appendChild(loopButton);

  const metronomeButton = button(
    '🎵',
    () => {
      metronomeOn = !metronomeOn;
      // The click has to be able to start *while the score is showing*, not
      // only at the top of a run: it is the thing you reach for mid-piece.
      if (session?.running) startRun();
      render();
    },
    'score-metronome',
  );
  metronomeButton.title = 'Metronome';
  bar.appendChild(metronomeButton);

  const barsDown = button('−', () => setBars(settings.barsPerWindow - 1), 'score-bars-down');
  const barsLabel = document.createElement('span');
  barsLabel.id = 'score-bars';
  barsLabel.className = 'score-bars';
  const barsUp = button('+', () => setBars(settings.barsPerWindow + 1), 'score-bars-up');
  bar.append(barsDown, barsLabel, barsUp);

  const layoutButton = button(
    'Window',
    () => {
      const next: ScoreLayout = settings.layout === 'window' ? 'scroll' : 'window';
      settings.layout = next;
      updateSettings({ layout: next });
      renderer?.setLayout(next);
      render();
    },
    'score-layout',
  );
  bar.appendChild(layoutButton);

  const zoomOut = button('－', () => setZoom(settings.zoom - 0.1), 'score-zoom-out');
  const zoomIn = button('＋', () => setZoom(settings.zoom + 0.1), 'score-zoom-in');
  bar.append(zoomOut, zoomIn);

  const stripButton = button(
    'Keys',
    () => {
      settings.keyboardStrip = !settings.keyboardStrip;
      updateSettings({ keyboardStrip: settings.keyboardStrip });
      render();
    },
    'score-strip-toggle',
  );
  bar.appendChild(stripButton);

  const destinationButton = button('🔈 Phone', () => cyclePlaybackDestination(), 'score-destination');
  bar.appendChild(destinationButton);

  const micMeter = document.createElement('div');
  micMeter.className = 'mic-meter score-mic';
  micMeter.id = 'score-mic-meter';
  micMeter.hidden = true;
  const micFill = document.createElement('div');
  micFill.className = 'mic-meter__fill';
  micMeter.appendChild(micFill);
  bar.appendChild(micMeter);

  // --- behaviour -----------------------------------------------------------

  function button(label: string, onClick: () => void, id: string): HTMLButtonElement {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'score-button';
    el.id = id;
    el.textContent = label;
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      showBar();
      onClick();
    });
    return el;
  }

  function select(
    options: { value: string; label: string }[],
    id: string,
    label: string,
    onChange: (value: string) => void,
  ): HTMLSelectElement {
    const el = document.createElement('select');
    el.className = 'score-select';
    el.id = id;
    el.setAttribute('aria-label', label);
    for (const option of options) {
      const node = document.createElement('option');
      node.value = option.value;
      node.textContent = option.label;
      el.appendChild(node);
    }
    el.addEventListener('change', () => {
      showBar();
      onChange(el.value);
    });
    el.addEventListener('click', (event) => event.stopPropagation());
    return el;
  }

  function setBars(next: number): void {
    settings.barsPerWindow = Math.min(MAX_BARS_PER_WINDOW, Math.max(MIN_BARS_PER_WINDOW, Math.round(next)));
    updateSettings({ barsPerWindow: settings.barsPerWindow });
    renderer?.setBarsPerWindow(settings.barsPerWindow);
    render();
  }

  function setZoom(next: number): void {
    settings.zoom = Math.min(2.5, Math.max(0.5, Math.round(next * 10) / 10));
    updateSettings({ zoom: settings.zoom });
    renderer?.setZoom(settings.zoom);
    render();
  }

  function cyclePlaybackDestination(): void {
    const order = ['phone', 'piano', 'both'] as const;
    const index = order.indexOf(settings.playbackDestination);
    settings.playbackDestination = order[(index + 1) % order.length] ?? 'phone';
    updateSettings({ playbackDestination: settings.playbackDestination });
    render();
  }

  function promptForBpm(): void {
    if (!model) return;
    const answer = window.prompt('Tempo in bpm', String(Math.round(bpmNow())));
    if (answer === null) return;
    const wanted = Number(answer);
    if (!Number.isFinite(wanted) || wanted <= 0) return;
    tempoPct = Math.min(130, Math.max(30, Math.round((wanted / writtenBpm()) * 100)));
    tempo.value = String(tempoPct);
    if (session?.running) startRun();
    render();
  }

  function writtenBpm(): number {
    return model ? bpmAt(model.tempoMap, 0) : 80;
  }

  function bpmNow(): number {
    return (writtenBpm() * tempoPct) / 100;
  }

  // --- input sources -------------------------------------------------------

  function detachInput(): void {
    while (unsubscribers.length > 0) unsubscribers.pop()?.();
    micSource.disconnect();
    micMeter.hidden = true;
  }

  /** Routes one input source into the session. Note events only — see §5. */
  function feedNote(event: InputNoteEvent): void {
    if (event.kind === 'noteOn') {
      session?.feed(event.midi, event.velocity, event.tMs, event.confidence ?? 1);
    } else {
      session?.feedOff(event.midi, event.tMs);
    }
  }

  function attachInput(): void {
    detachInput();
    if (!session) return;
    if (input === 'midi') {
      unsubscribers.push(webMidiSource.onNote(feedNote));
      // Sustain is recorded for the pedal scorer and never blocks the run.
      unsubscribers.push(
        webMidiSource.onMessage((message) => {
          if (message.kind === 'cc' && message.cc === 64 && message.value !== undefined) {
            session?.feedSustain(message.value, message.tMs);
          }
        }),
      );
    } else if (input === 'keys') {
      unsubscribers.push(screenKeyboardSource.onNote(feedNote));
    } else if (input === 'mic') {
      micMeter.hidden = false;
      unsubscribers.push(micSource.onNote(feedNote));
      unsubscribers.push(
        micSource.onLevel((level) => {
          // peak is 0..1; the meter is a rough guide, and the useful signal is
          // "is it clipping" (docs/04 §5), which the fill colour says.
          micFill.style.width = `${Math.round(Math.min(1, level.peak) * 100)}%`;
          micFill.dataset.hot = String(level.peak > 0.98);
        }),
      );
      void micSource.connect().catch((cause: unknown) => {
        status.textContent = `Microphone unavailable: ${String(cause)} — using the clock instead.`;
        input = 'none';
        render();
      });
    }
  }

  // --- run -----------------------------------------------------------------

  function startRun(): void {
    if (!session || !model) return;
    sheet.hidden = true;
    const midi = getMidiSettings();
    const loop = loopBars ? session.loopForMeasures(loopBars.from, loopBars.to) : undefined;
    session.start({
      mode,
      hands,
      tempoPct,
      ...(loop ? { loop } : {}),
      strict: settings.waitStrict,
      toleranceMs: settings.toleranceMs,
      countInBars: settings.countInBars,
      inputLatencyMs: midi.inputLatencyMs,
      metronome: metronomeOn,
      metronomeSound: metronomeSoundFor(
        { micActive: input === 'mic', destination: settings.playbackDestination },
        settings.metronomeSound,
      ),
      metronomeVolume: midi.metronomeVolume,
      playbackHands: mode === 'listen' ? 'both' : settings.playbackHands,
      ...(input === 'mic'
        ? {
            micChordLeniency: true,
            micChordFraction: settings.micChordLeniencyPct / 100,
            accuracyEstimated: true,
            ...(settings.strictMicScoring ? { wrongNoteConfidence: 0.8 } : {}),
          }
        : {}),
    });
    attachInput();
    void requestWakeLock();
    // Starting a run is what arms the auto-hide.
    showBar();
    render();
  }

  function togglePlay(): void {
    if (!session) return;
    if (!session.running) startRun();
    else if (session.state?.paused === true) session.resume();
    else session.pause();
    render();
  }

  function clearLoop(): void {
    loopBars = null;
    loopAnchor = null;
    if (session?.running) startRun();
    render();
  }

  // --- gestures (docs/04 §5) ----------------------------------------------

  stage.addEventListener('click', (event) => {
    if (mode === 'free') return;
    // Manual tap-to-advance in Scroll layout: right half forward, left back.
    if (settings.layout === 'scroll' && !session?.running) {
      const forward = event.clientX > stage.getBoundingClientRect().width / 2;
      const step = (renderer?.stepIndex ?? 0) + (forward ? 1 : -1);
      renderer?.showStep(Math.max(0, step));
      return;
    }
    toggleBar();
  });

  stage.addEventListener('dblclick', (event) => {
    const measure = measureAt(event.target);
    if (measure === null) return;
    if (loopAnchor === null) {
      loopAnchor = measure;
      status.textContent = `Loop start: bar ${measure}. Double-tap the last bar.`;
    } else {
      loopBars = { from: Math.min(loopAnchor, measure), to: Math.max(loopAnchor, measure) };
      loopAnchor = null;
      if (session?.running) startRun();
    }
    render();
  });

  function measureAt(target: EventTarget | null): number | null {
    if (!(target instanceof Element)) return null;
    const holder = target.closest('[data-measure]');
    const raw = holder instanceof HTMLElement ? holder.dataset.measure : undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : (renderer?.currentWindow?.fromMeasure ?? null);
  }

  let hideTimer: number | null = null;

  /**
   * Shows the control bar, and hides it again three seconds later — but only
   * while a run is going.
   *
   * `04` §5 says the bar auto-hides after 3 s. It means *while you are
   * playing*, which is when the notation needs the room. Hiding it while the
   * learner is still choosing a mode and a tempo makes every control a
   * two-tap affair, and hidden controls are `pointer-events: none`, so the
   * taps land on the score instead.
   */
  function showBar(): void {
    bar.dataset.visible = 'true';
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    if (session?.running !== true) return;
    hideTimer = window.setTimeout(() => {
      if (session?.running === true) bar.dataset.visible = 'false';
    }, CONTROL_BAR_HIDE_MS);
  }
  function toggleBar(): void {
    if (bar.dataset.visible === 'true') bar.dataset.visible = 'false';
    else showBar();
  }

  // --- wake lock and orientation (docs/01 §8) ------------------------------

  async function requestWakeLock(): Promise<void> {
    if (!settings.keepScreenAwake) return;
    try {
      wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
    } catch {
      // Denied, or unsupported on desktop. Not worth telling the learner.
    }
    if (settings.landscapeLock) {
      try {
        await screen.orientation?.lock?.('landscape');
      } catch {
        // Only works in an installed PWA; docs/01 §8 says to ignore failures.
      }
    }
  }

  function releaseWakeLock(): void {
    void wakeLock?.release().catch(() => {});
    wakeLock = null;
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* as above */
    }
  }

  // --- summary sheet (docs/04 §5) -----------------------------------------

  function showSummary(score: SessionScore): void {
    sheet.replaceChildren();
    const outcome = evaluateOutcome(score, {
      passAccuracy: settings.passAccuracyPct / 100,
      passTempoPct: settings.passTempoPct,
      masterAccuracy: 0.97,
      masterTempoPct: 100,
    });

    // Recorded before the sheet is drawn, and not awaited: the numbers are
    // already final, and a slow write should not delay the learner seeing
    // them. A failed write is reported on the sheet rather than swallowed —
    // practice history is the one thing here that cannot be regenerated.
    if (item && mode !== 'listen' && mode !== 'free') {
      void recordRun({
        itemId: item.id,
        mode,
        tempoPct: score.tempoPct,
        accuracy: score.accuracy,
        accuracyEstimated: score.accuracyEstimated,
        wrongNotes: score.wrongNotesTotal,
        missed: score.missedTotal,
        durationMs: score.durationMs,
        passed: outcome.passed,
        masterEligible: outcome.masterEligible,
      }).catch((cause: unknown) => {
        status.textContent = `Could not save this run: ${String(cause)}`;
      });
    }

    const title = document.createElement('h2');
    title.textContent = outcome.passed ? 'Passed' : 'Run finished';
    sheet.appendChild(title);

    const lines = document.createElement('dl');
    lines.className = 'summary-stats';
    addStat(lines, 'Accuracy', `${Math.round(score.accuracy * 100)}%${score.accuracyEstimated === true ? ' (estimated)' : ''}`);
    addStat(lines, 'Tempo', `${Math.round(score.tempoPct)}% of written`);
    addStat(lines, 'Wrong notes', String(score.wrongNotesTotal));
    addStat(lines, 'Missed', String(score.missedTotal));
    if (score.timing) {
      addStat(lines, 'Timing', `${Math.round(score.timing.meanMs)} ms mean, ${Math.round(score.timing.earlyPct)}% early`);
    }
    sheet.appendChild(lines);

    const actions = document.createElement('div');
    actions.className = 'summary-actions';
    actions.append(
      button('Again', () => startRun(), 'summary-again'),
      button('Slower (−10%)', () => {
        tempoPct = Math.max(30, tempoPct - 10);
        tempo.value = String(tempoPct);
        startRun();
      }, 'summary-slower'),
      button('Faster (+10%)', () => {
        tempoPct = Math.min(130, tempoPct + 10);
        tempo.value = String(tempoPct);
        startRun();
      }, 'summary-faster'),
      button('Loop the weak bars', () => loopWeakBars(score), 'summary-loop'),
      button('Done', () => {
        sheet.hidden = true;
        router.navigate(router.route.tab);
      }, 'summary-done'),
    );
    sheet.appendChild(actions);

    // Without a judging input there is nothing to be accurate *about*, so the
    // learner says how it went instead of being shown a number they did not earn.
    if (input === 'none' || mode === 'listen') {
      const ask = document.createElement('div');
      ask.className = 'summary-selfreport';
      ask.id = 'summary-selfreport';
      const label = document.createElement('p');
      label.textContent = 'How did it go?';
      ask.appendChild(label);
      for (const answer of ['Rough', 'OK', 'Clean']) {
        ask.appendChild(
          button(answer, () => {
            ask.dataset.answered = answer;
            status.textContent = `Recorded: ${answer}`;
          }, `summary-self-${answer.toLowerCase()}`),
        );
      }
      sheet.appendChild(ask);
    }
    sheet.hidden = false;
  }

  function addStat(list: HTMLElement, label: string, value: string): void {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    // Addressable individually: "the summary contains 100%" is true of a run
    // at 100 % tempo whatever the accuracy was, which is not what anyone means.
    dd.dataset.stat = label.toLowerCase().replace(/[^a-z]+/g, '-');
    list.append(dt, dd);
  }

  /** docs/05 §6: build a loop from the bars with the most misses last run. */
  function loopWeakBars(score: SessionScore): void {
    const worst = [...score.hotSpots]
      .sort((a, b) => b.misses + b.wrongs - (a.misses + a.wrongs))
      .at(0);
    if (!worst || worst.misses + worst.wrongs === 0) {
      status.textContent = 'No weak bars to loop — nothing went wrong.';
      return;
    }
    loopBars = { from: worst.measureIndex, to: worst.measureIndex + 1 };
    startRun();
  }

  // --- render --------------------------------------------------------------

  function render(): void {
    modeSelect.value = mode;
    inputSelect.value = input;
    tempo.value = String(tempoPct);
    tempoLabel.textContent = `${tempoPct}% · ${Math.round(bpmNow())} bpm`;
    barsLabel.textContent = `${settings.barsPerWindow} bar${settings.barsPerWindow === 1 ? '' : 's'}`;
    layoutButton.textContent = settings.layout === 'window' ? 'Window' : 'Scroll';
    metronomeButton.classList.toggle('is-selected', metronomeOn);
    metronomeButton.setAttribute('aria-pressed', String(metronomeOn));
    stripButton.classList.toggle('is-selected', settings.keyboardStrip);
    destinationButton.textContent =
      settings.playbackDestination === 'phone'
        ? '🔈 Phone'
        : settings.playbackDestination === 'piano'
          ? '🎹 Piano'
          : '🔈🎹 Both';
    loopButton.textContent = loopBars ? `Loop ${loopBars.from}–${loopBars.to} ✕` : 'Loop';
    loopButton.classList.toggle('is-selected', loopBars !== null);
    for (const hand of HANDS) {
      document.getElementById(`score-hands-${hand.id}`)?.classList.toggle('is-selected', hands === hand.id);
    }
    playPause.textContent = session?.running === true && session.state?.paused !== true ? '⏸' : '▶';
    stripHost.hidden = !settings.keyboardStrip;
    section.dataset.running = String(session?.running === true);
    section.dataset.mode = mode;
    section.dataset.input = input;
  }

  // --- load ----------------------------------------------------------------

  void (async () => {
    try {
      item = await findItem(itemId);
      if (!item) {
        status.textContent = `Unknown item “${itemId}”.`;
        return;
      }
      if (item.kind === 'pdf') {
        // A PDF has no notes to follow; it belongs to the page viewer.
        status.textContent = `${item.title} is a PDF — open it from Library.`;
        return;
      }
      if (!item.file && !item.imported) {
        status.textContent = `${item.title} has no notation to open. ${item.importHint ?? ''}`.trim();
        return;
      }

      // An imported score's bytes are in IndexedDB, not under `content/`; a
      // bundled one is fetched from the precache. Everything after this point
      // is the same either way (docs/04 §4).
      let musicXml: string;
      if (item.imported) {
        const row = await getImport(item.id);
        if (typeof row?.data !== 'string') throw new Error('the imported file is missing');
        musicXml = row.data;
      } else {
        const response = await fetch(contentUrl(item.file as string));
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        musicXml = toMusicXml(new Uint8Array(await response.arrayBuffer()));
      }

      // The model comes from an instance with no draw range: a windowed OSMD
      // clamps its cursor iterator, so extracting from the renderer's own view
      // would yield a model that stops at the end of the first window.
      const probe = new OsmdView(document.createElement('div'));
      await probe.load(musicXml);
      const loaded = probe.extractModel({ id: item.id });
      probe.dispose();
      model = loaded;

      renderer = await WindowRenderer.create({
        container: stage,
        model: loaded,
        musicXml,
        barsPerWindow: settings.barsPerWindow,
        zoom: settings.zoom,
        layout: settings.layout,
        halfWindowScrolling: settings.halfWindowScrolling,
        handsFocus: hands,
        drawFingerings: settings.showFingering,
      });

      // Draw the first window. `WindowRenderer.create` prepares its buffers but
      // does not commit to a position: the first `showStep` is what puts notes
      // on the screen, and without it the stage is two empty divs.
      renderer.showStep(0);

      if (settings.keyboardStrip) {
        // Tappable, because for a learner with no MIDI cable this strip *is*
        // the instrument (docs/04 §5). It feeds the shared ScreenKeyboardSource
        // rather than the session directly, so "screen keys" is an input like
        // any other and the engine cannot tell the difference.
        strip = new KeyboardStrip({
          interactive: true,
          onNoteOn: (midi, velocity) => screenKeyboardSource.noteOn(midi, velocity),
          onNoteOff: (midi) => screenKeyboardSource.noteOff(midi),
        });
        stripHost.appendChild(strip.el);
      }

      const context = audioEngine.contextOrNull;
      session = new ScoreSession({
        model: loaded,
        renderer,
        strip,
        piano: null,
        audioContext: context,
        destination: audioEngine.masterGain,
        onChange: render,
        onFinished: (score) => showSummary(score),
      });

      // Pick the follow input the way docs/04 §7 says: first available in the
      // learner's priority order, so a connected piano is used without asking.
      // The soundfont is megabytes; attach it when it lands rather than making
      // the score wait for it.
      void getPiano()
        .then((piano) => session?.setPiano(piano))
        .catch(() => {
          /* No playback. Everything else on this screen still works. */
        });

      input = pickInput();
      mode = input === 'none' ? settings.defaultModeWithoutInput : settings.defaultModeWithInput;
      status.textContent = item.title;
      showBar();
      render();
    } catch (cause: unknown) {
      status.textContent = `Could not open this score: ${String(cause)}`;
    }
  })();

  function pickInput(): FollowInput {
    for (const candidate of settings.inputPriority) {
      if (candidate === 'midi' && webMidiSource.inputs.length > 0) return 'midi';
      if (candidate === 'mic') continue; // needs a permission prompt; never automatic
      if (candidate === 'keys') return 'keys';
      if (candidate === 'none') return 'none';
    }
    return 'none';
  }

  const onResize = () => renderer?.refit();
  window.addEventListener('resize', onResize);

  onScreenDispose(section, () => {
    window.removeEventListener('resize', onResize);
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    detachInput();
    releaseWakeLock();
    session?.dispose();
    strip?.destroy();
    renderer?.dispose();
  });

  return section;
}
