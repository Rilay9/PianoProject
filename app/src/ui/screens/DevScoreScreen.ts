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
  noteElementCount(): number;
  currentStepNoteIds(): string[];
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
      renderer = await WindowRenderer.create({
        container: stage,
        model,
        musicXml,
        layout,
        barsPerWindow: Number(barsInput.value),
        handsFocus: hands,
      });
      stepIndex = 0;
      renderer.showStep(0);
    } catch (cause) {
      lastError = cause instanceof Error ? cause.message : String(cause);
    }
    lastLoadMs = performance.now() - started;
    renderHud();
  }

  function step(delta: number): void {
    if (!renderer || !model) return;
    stepIndex = Math.min(model.steps.length - 1, Math.max(0, stepIndex + delta));
    renderer.showStep(stepIndex);
    // Paint the current step, so the note→element map is exercised for real.
    const states = new Map<string, 'current'>();
    for (const id of renderer.noteElements(stepIndex).keys()) states.set(id, 'current');
    renderer.setNoteStates(states);
    renderHud();
  }

  function setBars(bars: number): void {
    barsInput.value = String(bars);
    renderer?.setBarsPerWindow(bars);
    renderHud();
  }

  function toggleLayout(): void {
    layout = layout === 'window' ? 'scroll' : 'window';
    layoutButton.textContent = `Layout: ${layout === 'window' ? 'Window' : 'Scroll'}`;
    renderer?.setLayout(layout);
    renderHud();
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
    renderer?.dispose();
  });

  window.__pianopathDevScore = {
    fixtures: FIXTURES.map((f) => f.name),
    load: (name) => loadFixture(name),
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
    showStep: (index) => {
      stepIndex = Math.max(0, Math.min((model?.steps.length ?? 1) - 1, index));
      renderer?.showStep(stepIndex);
      renderHud();
    },
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
    timeWindowRender: () => {
      if (!renderer || !model) return Number.NaN;
      // Force an uncached draw of the current window and time just that.
      const bars = renderer.bars;
      renderer.setBarsPerWindow(bars === 8 ? 7 : bars + 1);
      renderer.setBarsPerWindow(bars);
      const started = performance.now();
      renderer.showStep(stepIndex);
      return performance.now() - started;
    },
    noteElementCount: () => renderer?.visibleNoteElements().size ?? 0,
    currentStepNoteIds: () => [...(renderer?.noteElements(stepIndex).keys() ?? [])],
  };
  onScreenDispose(section, () => {
    delete window.__pianopathDevScore;
  });

  const first = FIXTURES[0];
  if (first) void loadFixture(first.name);
  renderHud();

  return section;
}
