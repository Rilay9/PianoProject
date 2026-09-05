// /dev/score — the builder's harness for the notation renderer.
//
// Not a learner screen and not in the navigation: it exists so a change to
// OsmdView, extractScoreModel or WindowRenderer can be driven by hand against
// any fixture, and so render timings can be read on the owner's actual phone
// (the timings feed the same log the P1 Diagnostics screen displays).
//
// Keys: ← → step the cursor · 1–8 set bars per window · L toggles layout ·
// H cycles hand focus · R restarts.

import { addButton, createSubScreen } from './subScreen';
import { onScreenDispose } from '../screenLifecycle';
import { WindowRenderer, type HandsFocus, type ScoreLayout } from '../../score/WindowRenderer';
import { PracticeEngine } from '../../engine/PracticeEngine';
import { evaluateOutcome } from '../../engine/Scoring';
import { generateSightReading, type SightReadingLevel } from '../../engine/sightReading';
import { ReplaySource, noteOnBytes, noteOffBytes } from '../../midi';
import { nextPlayableStep } from '../../engine/prepareSession';
import { micSource } from '../../app/services';
import type { MicLevel } from '../../audio/pitch/MicSource';
import { measureDetectorCost, type CostReport } from '../../audio/pitch/benchmark';
import type { InputNoteEvent } from '../../midi/types';
import type { EngineEvent, EngineOptions, Mode, SessionScore } from '../../engine/types';
import { toMusicXml } from '../../score/mxl';
import { OsmdView } from '../../score/OsmdView';
import { getRenderTimings, renderTimingSummary } from '../../util/renderTiming';
import type { ScoreModel } from '../../score/types';
import type { Router } from '../../router';

/**
 * The bundled fixtures, as lazily-fetched chunks.
 *
 * Not eager: this keeps the scores (and, more importantly, nothing else) out
 * of the entry bundle, and the whole dev route is itself dynamically imported
 * so OSMD never reaches a learner who does not open it.
 */
const XML_LOADERS = import.meta.glob('../../../tests/fixtures/scores/edge/*.musicxml', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

/**
 * The generated exercises are compressed MusicXML, so they arrive as asset
 * URLs and get unzipped in the browser — which also exercises the .mxl path
 * the file picker and drop handler use.
 */
const MXL_URLS: Record<string, string> = import.meta.glob(
  '../../../tests/fixtures/scores/generated/*.mxl',
  { query: '?url', import: 'default', eager: true },
);

function fixtureName(path: string): string {
  return path.split('/').pop()?.replace(/\.(musicxml|mxl)$/, '') ?? path;
}

/** Every bundled fixture, by display name. */
const FIXTURES: { name: string; load: () => Promise<string> }[] = [
  ...Object.entries(XML_LOADERS).map(([path, load]) => ({ name: fixtureName(path), load })),
  ...Object.entries(MXL_URLS).map(([path, url]) => ({
    name: fixtureName(path),
    load: async (): Promise<string> => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`fetch ${url}: ${response.status}`);
      return toMusicXml(new Uint8Array(await response.arrayBuffer()));
    },
  })),
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Handle the e2e suite drives this harness through.
 *
 * Deliberately attached only by this screen, which is itself a builder-only
 * lazily-loaded route: nothing a learner can reach carries test scaffolding.
 */
export interface DevScoreHandle {
  fixtures: string[];
  load(name: string): Promise<void>;
  /** Loads MusicXML text directly — the same path as the drop handler. */
  loadMusicXml(xml: string, name?: string): Promise<void>;
  lastError(): string;
  stepCount(): number;
  /** Ground truth for the step-count invariant: a real, rendered cursor. */
  cursorStepCount(): Promise<number>;
  showStep(index: number): void;
  currentStep(): number;
  currentWindow(): { fromMeasure: number; toMeasure: number } | null;
  setBars(bars: number): void;
  setLayout(layout: ScoreLayout): void;
  setHands(hands: HandsFocus): void;
  measureCounts(): { unrolled: number; printed: number };
  /** Milliseconds for one uncached render of the current window. */
  timeWindowRender(): number;
  /** Milliseconds to move to `index`, whose window should be pre-rendered. */
  timeShowStep(index: number): number;

  // --- practice engine (P3) ---------------------------------------------
  /** Starts a run over the loaded score; the cursor then follows the engine. */
  startRun(mode: Mode, options?: Omit<Partial<EngineOptions>, 'mode'>): void;
  stopRun(): void;
  /** Feeds one Note-On, as a MIDI source would. */
  playNote(midi: number, velocity?: number): void;
  releaseNote(midi: number): void;
  /**
   * Replays a scripted performance through a ReplaySource and resolves when it
   * has finished. Offsets are milliseconds from the start of the run.
   */
  replay(script: { atMs: number; midi: number; velocity?: number; off?: boolean }[]): Promise<void>;
  /** Plays the loaded score perfectly, one step at a time (Wait mode). */
  playPerfectly(): void;
  engineState(): { step: number; finished: boolean; running: boolean } | null;
  engineScore(): SessionScore | null;
  engineOutcome(): { passed: boolean; masterEligible: boolean } | null;
  engineEvents(): { kind: string; step?: number }[];
  /** Loads a generated sight-reading exercise at the given level. */
  loadSightReading(level: SightReadingLevel, seed: number, bars?: number): Promise<void>;
  noteElementCount(): number;
  currentStepNoteIds(): string[];

  // --- microphone (P3b) --------------------------------------------------
  /**
   * Opens the microphone and wires it to the run: every detection is fed to
   * the engine and every step change republishes the expected pitch sets, so
   * this is the whole §11 path end to end.
   */
  micConnect(): Promise<{ detail: string; sampleRate: number | null }>;
  micDisconnect(): void;
  micState(): { connected: boolean; detail: string };
  micLevel(): MicLevel | null;
  /** Analysis cost per hop, measured here and now (docs/01 §4.7). */
  micCost(hops?: number): CostReport;
  /** Every note the microphone reported during the run. */
  micNotes(): { midi: number; kind: string; confidence: number; tMs: number }[];
  /** What the detector was last told to listen for. */
  micExpectations(): { now: number[]; next: number[] };
}

declare global {
  interface Window {
    __pianopathDevScore?: DevScoreHandle;
  }
}

const HANDS_CYCLE: HandsFocus[] = ['both', 'R', 'L'];

export function DevScoreScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'dev-score',
    title: 'Score renderer (dev)',
    backTo: 'settings',
    backLabel: 'Settings',
  });
  card.classList.add('dev-score');

  // --- controls ------------------------------------------------------------
  const bar = document.createElement('div');
  bar.className = 'dev-score__bar';
  card.appendChild(bar);

  const picker = document.createElement('select');
  picker.id = 'dev-fixture';
  picker.setAttribute('aria-label', 'Fixture');
  for (const fixture of FIXTURES) {
    const option = document.createElement('option');
    option.value = fixture.name;
    option.textContent = fixture.name;
    picker.appendChild(option);
  }
  bar.appendChild(picker);
  picker.addEventListener('change', () => void loadFixture(picker.value));

  const barsInput = document.createElement('select');
  barsInput.id = 'dev-bars';
  barsInput.setAttribute('aria-label', 'Bars per window');
  for (let n = 1; n <= 8; n += 1) {
    const option = document.createElement('option');
    option.value = String(n);
    option.textContent = `${n} bar${n === 1 ? '' : 's'}`;
    if (n === 2) option.selected = true;
    barsInput.appendChild(option);
  }
  bar.appendChild(barsInput);
  barsInput.addEventListener('change', () => setBars(Number(barsInput.value)));

  const layoutButton = addButton(bar, 'Layout: Window', () => toggleLayout(), {
    id: 'dev-layout',
  });
  const handsButton = addButton(bar, 'Hands: both', () => cycleHands(), { id: 'dev-hands' });
  addButton(bar, '◀', () => step(-1), { id: 'dev-prev' });
  addButton(bar, '▶', () => step(1), { id: 'dev-next' });

  const file = document.createElement('input');
  file.type = 'file';
  file.id = 'dev-file';
  file.accept = '.musicxml,.xml,.mxl';
  bar.appendChild(file);
  file.addEventListener('change', () => {
    const chosen = file.files?.[0];
    if (chosen) void loadFile(chosen);
  });

  const drop = document.createElement('div');
  drop.className = 'dev-score__drop';
  drop.id = 'dev-drop';
  drop.textContent = 'Drop a .musicxml or .mxl here';
  card.appendChild(drop);

  const hint = document.createElement('p');
  hint.className = 'dev-score__hint';
  hint.textContent = '← → step · 1–8 bars per window · L layout · H hands · R restart';
  card.appendChild(hint);

  const stage = document.createElement('div');
  stage.className = 'dev-score__stage';
  stage.id = 'dev-stage';
  card.appendChild(stage);

  const hud = document.createElement('div');
  hud.className = 'dev-score__hud';
  hud.id = 'dev-hud';
  section.appendChild(hud);

  // --- state ---------------------------------------------------------------
  let renderer: WindowRenderer | null = null;
  let model: ScoreModel | null = null;
  let stepIndex = 0;
  let layout: ScoreLayout = 'window';
  let hands: HandsFocus = 'both';
  let lastLoadMs = 0;
  let lastError = '';
  let currentXml = '';
  let engine: PracticeEngine | null = null;
  let engineEvents: EngineEvent[] = [];
  let rafHandle: number | null = null;
  /**
   * What the engine has judged so far, by note id. Kept across step changes:
   * advancing the cursor must not wipe the colours of the notes just played,
   * which is what a learner looks at to see how the bar went.
   */
  let judgements = new Map<string, 'correct' | 'wrong'>();
  let micUnsubscribe: (() => void) | null = null;
  let micNoteLog: InputNoteEvent[] = [];
  let micExpected: { now: number[]; next: number[] } = { now: [], next: [] };

  async function loadFile(chosen: File): Promise<void> {
    const buffer = await chosen.arrayBuffer();
    await loadXml(toMusicXml(new Uint8Array(buffer)), chosen.name);
  }

  async function loadFixture(name: string): Promise<void> {
    const fixture = FIXTURES.find((f) => f.name === name);
    if (!fixture) {
      lastError = `no fixture named "${name}"`;
      renderHud();
      return;
    }
    picker.value = name;
    try {
      await loadXml(await fixture.load(), name);
    } catch (cause) {
      lastError = cause instanceof Error ? cause.message : String(cause);
      renderHud();
    }
  }

  async function loadXml(musicXml: string, name: string): Promise<void> {
    lastError = '';
    const started = performance.now();
    try {
      renderer?.dispose();
      renderer = null;
      stage.replaceChildren();

      // The model is extracted from an instance with no draw range, because a
      // windowed OSMD clamps its cursor iterator (see OsmdView.extractModel).
      const probe = new OsmdView(document.createElement('div'));
      await probe.load(musicXml);
      model = probe.extractModel({ id: name });
      probe.dispose();

      currentXml = musicXml;
      judgements = new Map();
      renderer = await WindowRenderer.create({
        container: stage,
        model,
        musicXml,
        layout,
        barsPerWindow: Number(barsInput.value),
        handsFocus: hands,
      });
      stepIndex = 0;
      goToStep(0);
    } catch (cause) {
      lastError = cause instanceof Error ? cause.message : String(cause);
    }
    lastLoadMs = performance.now() - started;
    renderHud();
  }

  /**
   * The single path to a step, used by the keyboard, the buttons and the test
   * harness alike — so what an e2e test drives is exactly what a hand on the
   * arrow keys drives.
   */
  function goToStep(index: number): void {
    if (!renderer || !model) return;
    stepIndex = Math.min(model.steps.length - 1, Math.max(0, index));
    renderer.showStep(stepIndex);
    applyNoteStates();
    renderHud();
  }

  /**
   * Paints the score: everything judged so far keeps its colour, and the
   * current step is highlighted where it has not already been judged.
   */
  function applyNoteStates(): void {
    if (!renderer) return;
    const states = new Map<string, 'correct' | 'wrong' | 'current'>(judgements);
    for (const id of renderer.noteElements(stepIndex).keys()) {
      if (!states.has(id)) states.set(id, 'current');
    }
    renderer.setNoteStates(states);
  }

  function step(delta: number): void {
    goToStep(stepIndex + delta);
  }

  function setBars(bars: number): void {
    barsInput.value = String(bars);
    renderer?.setBarsPerWindow(bars);
    // Re-applies the note states: setBarsPerWindow redraws both buffers, so
    // the previous classes are gone with the elements that carried them.
    goToStep(stepIndex);
  }

  function toggleLayout(): void {
    layout = layout === 'window' ? 'scroll' : 'window';
    layoutButton.textContent = `Layout: ${layout === 'window' ? 'Window' : 'Scroll'}`;
    renderer?.setLayout(layout);
    goToStep(stepIndex);
  }

  function cycleHands(): void {
    const next = HANDS_CYCLE[(HANDS_CYCLE.indexOf(hands) + 1) % HANDS_CYCLE.length];
    hands = next ?? 'both';
    handsButton.textContent = `Hands: ${hands === 'both' ? 'both' : hands}`;
    renderer?.setHandsFocus(hands);
    renderHud();
  }

  function renderHud(): void {
    const step_ = model?.steps[stepIndex];
    const window_ = renderer?.currentWindow;
    const summary = renderTimingSummary()
      .map(({ label, stats }) => `${label}: n=${stats.n} mean=${stats.mean.toFixed(1)} max=${stats.max.toFixed(1)}`)
      .join('\n');
    hud.textContent = [
      lastError ? `ERROR: ${lastError}` : `load ${lastLoadMs.toFixed(0)} ms`,
      model ? `steps ${stepIndex + 1}/${model.steps.length}` : 'no score',
      engine
        ? `engine ${engine.mode} ${engine.state.finished ? 'finished' : 'running'} ` +
          `acc ${(engine.state.score.accuracy * 100).toFixed(0)}%`
        : '',
      step_
        ? `beat ${step_.onset} · bar ${step_.measureIndex}(src ${step_.sourceMeasureIndex})`
        : '',
      window_ ? `window ${window_.fromMeasure}–${window_.toMeasure}` : '',
      summary,
      `samples ${getRenderTimings().length}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // --- input ---------------------------------------------------------------
  function onKey(event: KeyboardEvent): void {
    if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement) {
      return;
    }
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'l' || event.key === 'L') toggleLayout();
    else if (event.key === 'h' || event.key === 'H') cycleHands();
    else if (event.key === 'r' || event.key === 'R') {
      stepIndex = 0;
      renderer?.showStep(0);
      renderHud();
    } else if (/^[1-8]$/.test(event.key)) setBars(Number(event.key));
    else return;
    event.preventDefault();
  }
  window.addEventListener('keydown', onKey);

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    drop.classList.add('is-over');
  };
  const onDragLeave = () => drop.classList.remove('is-over');
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    drop.classList.remove('is-over');
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) void loadFile(dropped);
  };
  drop.addEventListener('dragover', onDragOver);
  drop.addEventListener('dragleave', onDragLeave);
  drop.addEventListener('drop', onDrop);

  const onResize = () => renderer?.refit();
  window.addEventListener('resize', onResize);

  onScreenDispose(section, () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    stopRun();
    micDisconnect();
    renderer?.dispose();
  });

  // --- microphone (docs/05 §11) --------------------------------------------

  async function micConnect(): Promise<{ detail: string; sampleRate: number | null }> {
    await micSource.connect();
    micUnsubscribe?.();
    micUnsubscribe = micSource.onNote((note) => {
      micNoteLog.push(note);
      engine?.feed({
        kind: note.kind,
        midi: note.midi,
        velocity: note.velocity,
        tMs: note.tMs,
        confidence: note.confidence,
      });
      // A detection can complete the step, so the detector has to be told
      // what to listen for next straight away — a step's worth of stale
      // expectations is a step's worth of missed notes.
      publishExpectations();
    });
    publishExpectations();
    return { detail: micSource.state.detail, sampleRate: micSource.sampleRate };
  }

  function micDisconnect(): void {
    micUnsubscribe?.();
    micUnsubscribe = null;
    micSource.disconnect();
  }

  /** Tells the detector which pitches the run is waiting for (docs/05 §11.1). */
  function publishExpectations(): void {
    if (!engine) return;
    const steps = engine.prepared.steps;
    const index = engine.state.step;
    const now = steps[index]?.expected ?? [];
    const nextIndex = nextPlayableStep(steps, index + 1, engine.prepared.lastStep);
    const next = nextIndex === null ? [] : (steps[nextIndex]?.expected ?? []);
    micExpected = { now: [...now], next: [...next] };
    micSource.setExpectations(now, next);
  }

  /**
   * Runs the practice engine over the loaded score, with the renderer's cursor
   * following it. This is the P2 renderer and the P3 engine joined up — the
   * first place the app does the thing it exists to do.
   */
  function startRun(mode: Mode, engineOptions: Omit<Partial<EngineOptions>, 'mode'> = {}): void {
    if (!model) return;
    stopRun();
    engineEvents = [];
    judgements = new Map();
    micNoteLog = [];
    engine = new PracticeEngine(model, { ...engineOptions, mode });
    engine.on((event) => {
      engineEvents.push(event);
      if (event.kind === 'stepAdvanced') {
        goToStep(event.to);
        publishExpectations();
      } else if (event.kind === 'noteJudged' || event.kind === 'missed') {
        paintJudgement(event);
      } else if (event.kind === 'finished' && !event.loop) {
        stopTicking();
        renderHud();
      }
    });
    engine.start();
    goToStep(engine.state.step);
    // Tempo and Listen are clock-driven, so they need a frame loop; Wait and
    // Free advance only on input and would spin for nothing — except that the
    // microphone chord leniency is a timeout, so Wait needs the loop too when
    // it is on (docs/05 §11.4).
    if (mode === 'tempo' || mode === 'listen' || engineOptions.micChordLeniency === true) {
      startTicking();
    }
    publishExpectations();
    renderHud();
  }

  function startTicking(): void {
    const loop = () => {
      engine?.tick();
      rafHandle = requestAnimationFrame(loop);
    };
    rafHandle = requestAnimationFrame(loop);
  }

  function stopTicking(): void {
    if (rafHandle !== null) cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }

  function stopRun(): void {
    stopTicking();
    engine?.stop();
    engine = null;
  }

  /** Records a judgement and repaints, without re-rendering the notation. */
  function paintJudgement(event: Extract<EngineEvent, { kind: 'noteJudged' | 'missed' }>): void {
    const painted = event.kind === 'missed' ? 'wrong' : event.ok ? 'correct' : 'wrong';
    for (const id of event.noteIds) judgements.set(id, painted);
    applyNoteStates();
  }

  window.__pianopathDevScore = {
    fixtures: FIXTURES.map((f) => f.name),
    load: (name) => loadFixture(name),
    loadMusicXml: (xml, name) => loadXml(xml, name ?? 'inline'),
    lastError: () => lastError,
    stepCount: () => model?.steps.length ?? 0,
    cursorStepCount: async () => {
      // A throwaway instance with a live cursor: the visible renderer is
      // windowed, and a draw range clamps the cursor's iterator.
      const host = document.createElement('div');
      host.style.position = 'absolute';
      host.style.visibility = 'hidden';
      document.body.appendChild(host);
      const view = new OsmdView(host, { hideCursor: false });
      try {
        await view.load(currentXml);
        view.render();
        return view.countCursorSteps();
      } finally {
        view.dispose();
        host.remove();
      }
    },
    showStep: (index) => goToStep(index),
    currentStep: () => stepIndex,
    currentWindow: () => renderer?.currentWindow ?? null,
    setBars: (bars) => setBars(bars),
    setLayout: (next) => {
      if (next !== layout) toggleLayout();
    },
    setHands: (next) => {
      while (hands !== next) cycleHands();
    },
    measureCounts: () => ({
      unrolled: model?.measureCount ?? 0,
      printed: model?.sourceMeasureCount ?? 0,
    }),
    timeWindowRender: () => renderer?.redrawCurrentWindow() ?? Number.NaN,
    timeShowStep: (index) => {
      if (!renderer) return Number.NaN;
      const started = performance.now();
      renderer.showStep(index);
      const elapsed = performance.now() - started;
      goToStep(index);
      return elapsed;
    },
    noteElementCount: () => renderer?.visibleNoteElements().size ?? 0,
    currentStepNoteIds: () => [...(renderer?.noteElements(stepIndex).keys() ?? [])],

    startRun: (mode, engineOptions) => startRun(mode, engineOptions ?? {}),
    stopRun: () => stopRun(),
    playNote: (midi, velocity = 90) =>
      engine?.feed({ kind: 'noteOn', midi, velocity, tMs: performance.now() }),
    releaseNote: (midi) =>
      engine?.feed({ kind: 'noteOff', midi, velocity: 0, tMs: performance.now() }),

    replay: async (script) => {
      if (!engine) throw new Error('no run in progress');
      const running = engine;
      // Driven through a real ReplaySource, so the path under test is the one
      // a MIDI cable uses: bytes -> parseMidiMessage -> InputSource -> engine.
      const source = new ReplaySource({
        name: 'dev harness',
        messages: script.map((entry) => ({
          atMs: entry.atMs,
          bytes: [
            ...(entry.off
              ? noteOffBytes(entry.midi)
              : noteOnBytes(entry.midi, entry.velocity ?? 90)),
          ],
        })),
      });
      await new Promise<void>((resolve) => {
        const off = source.onNote((note) => {
          running.feed({
            kind: note.kind,
            midi: note.midi,
            velocity: note.velocity,
            tMs: note.tMs,
          });
        });
        const finished = () => {
          off();
          resolve();
        };
        // A script's last message may be a Note-Off, so wait for the source
        // rather than for the engine.
        const last = script.reduce((max, e) => Math.max(max, e.atMs), 0);
        void source.connect();
        setTimeout(finished, last + 250);
      });
    },

    playPerfectly: () => {
      if (!engine) return;
      const steps = engine.prepared.steps;
      let guard = 0;
      while (!engine.state.finished && guard < 5000) {
        const step = steps[engine.state.step];
        if (!step || step.isEmpty) break;
        for (const midi of step.expected) {
          engine.feed({ kind: 'noteOn', midi, velocity: 90, tMs: performance.now() });
        }
        guard += 1;
      }
    },

    engineState: () =>
      engine
        ? {
            step: engine.state.step,
            finished: engine.state.finished,
            running: engine.state.running,
          }
        : null,
    engineScore: () => engine?.state.score ?? null,
    engineOutcome: () => {
      const score = engine?.state.score;
      if (!score) return null;
      const outcome = evaluateOutcome(score);
      return { passed: outcome.passed, masterEligible: outcome.masterEligible };
    },
    engineEvents: () =>
      engineEvents.map((e) => ({
        kind: e.kind,
        ...(e.kind === 'stepAdvanced' ? { step: e.to } : {}),
      })),

    micConnect: () => micConnect(),
    micDisconnect: () => micDisconnect(),
    micState: () => micSource.state,
    micLevel: () => micSource.level,
    micCost: (hops) => measureDetectorCost(hops === undefined ? {} : { hops }),
    micNotes: () =>
      micNoteLog.map((n) => ({
        midi: n.midi,
        kind: n.kind,
        confidence: n.confidence,
        tMs: n.tMs,
      })),
    micExpectations: () => micExpected,

    loadSightReading: async (level, seed, bars) => {
      const generated = generateSightReading({ level, seed, bars: bars ?? 4 });
      await loadXml(generated.musicXml, `sight-${level}-${seed}`);
    },
  };
  onScreenDispose(section, () => {
    delete window.__pianopathDevScore;
  });

  const first = FIXTURES[0];
  if (first) void loadFixture(first.name);
  renderHud();

  return section;
}
