// #/dev/microscope/excerpts — the microscope's excerpt view (E1 item 6; Part 24, R40, R42).
//
// The builder's workbench for proposed excerpts, beside the item view and reached the same way,
// by address (`DevMicroscopeScreen` routes here; nothing links to it). The proposer
// (`tools/content/excerpts.py propose`, `excerpt_proposer.py`) writes its candidates to the
// builder-only `dev/` root (`dev/review/excerpts.json`, gitignored and never precached, D2a); this
// screen lists them by target with their part scores, and for one candidate:
//
// - draws the **parent** with the app's renderer (`WindowRenderer`, the Score screen's), the window
//   marked by dimming the bars outside it (the renderer's loop marking) and a margin of bars either
//   side on the page, and **plays from before the cut to after it** with the app's playback (the
//   Score session's Listen run over a loop with the margin, stopped at its first lap) — the review
//   sees and hears the music outside the cut (Part 24: bar 1 may continue a phrase, a pickup may be
//   severed, the last bar may stop before its resolution);
// - moves either boundary a bar at a time and **re-scores it live from the proposer's own table**
//   (each candidate carries every window within four bars of its boundaries, scored by the same
//   Python functions), so no second definition of a signal lives here; the cut itself stays the
//   build's;
// - shows the window's facts beside the parent's: the parts with their weights, the gates, the
//   demands the window carries and the rung has not taught;
// - records a decision — approve (with a label), adjust-and-approve (the moved range, the proposed
//   one kept), or reject with a reason — on the device (`pianopath.microscope.excerpts`), exported as
//   a file `tools/content/excerpts.py --merge` takes, idempotently by event id.
//
// It writes nothing of the learner's: its decisions live under the microscope's own localStorage
// prefix, and its playback records no run.

import { createSubScreen } from './subScreen';
import { onScreenDispose } from '../screenLifecycle';
import { el, button } from '../widgets';
import { contentUrl, loadCatalog } from '../../curriculum/load';
import type { CatalogItem } from '../../curriculum/types';
import { getSettings } from '../../data/settingsStore';
import { audioEngine } from '../../audio/AudioEngine';
import { getPiano } from '../../app/services';
import { toMusicXml } from '../../score/mxl';
import { OsmdView } from '../../score/OsmdView';
import { WindowRenderer, MAX_BARS_PER_WINDOW } from '../../score/WindowRenderer';
import { ScoreSession } from '../../score/ScoreSession';
import { loopFromPrintedBars } from '../../engine/prepareSession';
import type { Piano } from '../../audio/Piano';
import type { ScoreModel } from '../../score/types';
import { excerptPage } from './excerptPage';
import type { Router } from '../../router';

/** The devItem that opens this view: `#/dev/microscope/excerpts` (no catalogue id is one word). */
export const EXCERPT_VIEW = 'excerpts';

/** Bars shown and played either side of the window. */
const MARGIN = 2;

interface PartRow {
  signal: string;
  value: number;
  fired: boolean;
  detail: string;
  weight?: number;
  kind?: string;
}

interface Neighbour {
  fromBar: number;
  toBar: number;
  crossing?: boolean;
  score?: number;
  parts?: PartRow[];
  untaught?: string[];
  forbidden?: string[];
  demands?: string[];
}

interface Candidate {
  id: string;
  of: string;
  title: string | null;
  fromBar: number;
  toBar: number;
  selection: 'both' | 'right' | 'left';
  excerptId: string;
  targets: string[];
  score: number;
  parts: PartRow[];
  gates: { signal: string; passed: boolean | null; detail: string }[];
  refusedBy: string[];
  meetsEverySignal: boolean;
  demands: string[];
  counts: Record<string, number>;
  parent: {
    file: string;
    sha256: string;
    bars: number;
    staves: number;
    level?: number;
    levelSource?: string;
    demands?: string[] | 'unmeasured';
    established?: string[];
    untaught?: string[];
    tempoBpm?: number | null;
    keySig?: string | null;
    timeSig?: string | null;
  };
  neighbourhood: Neighbour[];
}

interface Run {
  runId: string;
  for: string;
  rung: string | null;
  bars: [number, number];
  weights: Record<string, { weight: number; why: string }>;
  candidates: Candidate[];
  refused: { of: string; title: string | null; fromBar: number; toBar: number; selection: string; refusedBy: string[]; untaught?: string[] }[];
}

interface Projection {
  v: 1;
  runs: Run[];
}

/** One exported decision, in the line format `excerpts.py --merge` takes. */
export interface ExcerptDecision {
  v: 1;
  event: string;
  decision: 'approve' | 'adjust' | 'reject';
  of: string;
  fromBar: number;
  toBar: number;
  selection: 'both' | 'right' | 'left';
  targets: string[];
  label?: string;
  note?: string;
  reason?: string;
  proposed?: { fromBar: number; toBar: number };
  parentSha256: string;
  by: string;
  at: string;
}

interface LocalDecision {
  decision: ExcerptDecision;
  exportedAt?: string;
}

const DECISIONS_KEY = 'pianopath.microscope.excerpts';
const REVIEWER_KEY = 'pianopath.microscope.reviewer';

/** The handle `excerpts.spec.ts` reads; attached only by this builder-only view. */
export interface ExcerptViewHandle {
  ready(): boolean;
  candidate(): { of: string; fromBar: number; toBar: number; selection: string; score: number | null; scored: boolean } | null;
  outsideDimmed(): number;
  /** The printed bars (1-based) of the page the renderer shows, its read-ahead page aside. */
  page(): { from: number; to: number } | null;
  hear(): { playing: boolean; pitches: number[]; from: number | null; to: number | null };
  decisions(): { event: string; decision: string; fromBar: number; toBar: number; state: string }[];
}

declare global {
  interface Window {
    __pianopathExcerpts?: ExcerptViewHandle;
  }
}

function devUrl(path: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}dev/${path}`;
}

function readLocal(): LocalDecision[] {
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as { decisions?: LocalDecision[] }) : null;
    return Array.isArray(parsed?.decisions) ? parsed.decisions : [];
  } catch {
    return [];
  }
}

function writeLocal(list: LocalDecision[]): void {
  localStorage.setItem(DECISIONS_KEY, JSON.stringify({ v: 1, decisions: list }));
}

const STYLE_ID = 'excerpt-view-style';
const STYLE = `
.card.excerpt-view { max-width: 1280px; display: flex; flex-direction: column; gap: 12px; }
@media (max-width: 600px) { .card.excerpt-view { padding: 12px; } }
.excerpt-view h2 { font-size: 1.05rem; margin: 0; }
.excerpt-view h3 { font-size: 0.95rem; margin: 0 0 4px; }
.excerpt-view__muted { color: var(--text-muted); font-size: 0.85rem; margin: 0; }
.excerpt-view__row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.excerpt-view select, .excerpt-view input[type='text'], .excerpt-view textarea {
  min-height: 40px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg); color: var(--text); padding: 4px 8px; max-width: 100%; font: inherit;
}
.excerpt-view select { flex: 1 1 240px; min-width: 0; }
.excerpt-view__stage { height: min(56vh, 520px); min-height: 240px; border: 1px solid var(--border); border-radius: 8px; }
@media (max-width: 600px) {
  .excerpt-view__stage { margin: 0 -29px; height: calc(100svh - 260px); border-radius: 0; border-left: none; border-right: none; }
}
.excerpt-view__layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
@media (min-width: 960px) { .excerpt-view__layout { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); } }
.excerpt-view table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
.excerpt-view td, .excerpt-view th { text-align: left; padding: 2px 6px 2px 0; vertical-align: top; }
.excerpt-view tr[data-fired='false'] td:first-child { color: var(--danger, #b3261e); }
.excerpt-view section { border-top: 1px solid var(--border); padding-top: 6px; }
.excerpt-view fieldset { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.excerpt-view textarea { min-height: 56px; }
.excerpt-view__warn { color: var(--danger, #b3261e); }
.excerpt-view li[data-state='unexported'] { font-weight: 600; }
`;

export function DevExcerptView(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'dev-excerpts',
    title: 'Excerpts (dev)',
    backTo: 'today',
    backLabel: 'Today',
  });
  card.classList.add('excerpt-view');
  if (!document.getElementById(STYLE_ID)) document.head.append(el('style', { id: STYLE_ID, text: STYLE }));
  const status = el('p.excerpt-view__muted', { id: 'excerpts-status', text: 'Loading the catalogue and the candidates…' });
  card.append(status);

  let disposed = false;
  let ready = false;
  let renderer: WindowRenderer | null = null;
  /** Whether both margins are on screen with the cut (`pageFor`), for the words under the score. */
  let marginsOnScreen = false;
  let session: ScoreSession | null = null;
  let model: ScoreModel | null = null;
  let playing = false;
  let playedRange: { from: number; to: number } | null = null;
  const scheduled = new Set<number>();
  let shown: { candidate: Candidate; from: number; to: number } | null = null;
  let local = readLocal();

  const handle: ExcerptViewHandle = {
    ready: () => ready,
    candidate: () => {
      if (!shown) return null;
      const row = scoredRow(shown.candidate, shown.from, shown.to);
      return { of: shown.candidate.of, fromBar: shown.from, toBar: shown.to, selection: shown.candidate.selection,
        score: row?.score ?? null, scored: row !== undefined && row.score !== undefined };
    },
    outsideDimmed: () => card.querySelectorAll('.is-outside-loop').length,
    page: () => {
      const window_ = renderer?.currentWindow;
      return window_ ? { from: window_.fromMeasure + 1, to: window_.toMeasure + 1 } : null;
    },
    hear: () => ({ playing, pitches: [...scheduled].sort((a, b) => a - b), from: playedRange?.from ?? null, to: playedRange?.to ?? null }),
    decisions: () => local.map((one) => ({ event: one.decision.event, decision: one.decision.decision, fromBar: one.decision.fromBar,
      toBar: one.decision.toBar, state: one.exportedAt ? 'exported' : 'unexported' })),
  };
  window.__pianopathExcerpts = handle;

  onScreenDispose(section, () => {
    disposed = true;
    session?.dispose();
    renderer?.dispose();
    if (window.__pianopathExcerpts === handle) delete window.__pianopathExcerpts;
    document.getElementById(STYLE_ID)?.remove();
  });

  /** The proposer's row for a window of this candidate, or undefined when the table does not reach it. */
  function scoredRow(candidate: Candidate, from: number, to: number): Neighbour | undefined {
    if (from === candidate.fromBar && to === candidate.toBar) {
      return { fromBar: from, toBar: to, score: candidate.score, parts: candidate.parts, untaught: [], demands: candidate.demands };
    }
    return candidate.neighbourhood.find((row) => row.fromBar === from && row.toBar === to);
  }

  void (async () => {
    let catalog: CatalogItem[];
    let data: Projection;
    try {
      const response = await fetch(devUrl('review/excerpts.json'));
      if (!response.ok) throw new Error(`dev/review/excerpts.json: ${String(response.status)} — run python tools/content/excerpts.py propose --for <target>`);
      data = (await response.json()) as Projection;
      catalog = await loadCatalog();
    } catch (cause) {
      status.textContent = `Could not load: ${cause instanceof Error ? cause.message : String(cause)}`;
      return;
    }
    if (disposed) return;
    const byId = new Map(catalog.map((one) => [one.id, one]));
    const runs = data.runs.filter((run) => run.candidates.length > 0);
    const empty = data.runs.filter((run) => run.candidates.length === 0);
    if (runs.length === 0) {
      status.textContent = 'No candidates: run python tools/content/excerpts.py propose --for <target>.';
      return;
    }
    status.remove();
    if (empty.length > 0) {
      card.append(el('p.excerpt-view__muted', { text: `No candidate for: ${empty.map((one) => `${one.for} at ${one.rung ?? 'no rung'}`).join('; ')} — the run's refused windows are in build/excerpts/candidates.json.` }));
    }

    // --- the lists -------------------------------------------------------------------
    const runPicker = el('select', { id: 'excerpts-run', 'aria-label': 'Target' }) as HTMLSelectElement;
    const picker = el('select', { id: 'excerpts-candidate', 'aria-label': 'Candidate' }) as HTMLSelectElement;
    for (const [index, run] of runs.entries()) {
      const meeting = run.candidates.filter((one) => one.meetsEverySignal).length;
      runPicker.append(el('option', { value: String(index), text: `${run.for} at ${run.rung ?? 'no rung'} · ${String(run.candidates.length)} candidates, ${String(meeting)} meeting every signal` }));
    }
    let run = runs[0]!;
    const drawCandidates = (): void => {
      picker.replaceChildren(
        ...run.candidates.map((one, index) =>
          el('option', {
            value: String(index),
            text: `${one.meetsEverySignal ? '✓' : '·'} ${one.score.toFixed(1)} · ${byId.get(one.of)?.title ?? one.of} · bars ${String(one.fromBar)}–${String(one.toBar)} · ${one.selection}`,
          }),
        ),
      );
    };
    card.append(
      el('div.excerpt-view__row', {}, runPicker),
      el('div.excerpt-view__row', {},
        button('◀', () => stepCandidate(-1), { id: 'excerpts-prev', ariaLabel: 'Previous candidate' }),
        picker,
        button('▶', () => stepCandidate(1), { id: 'excerpts-next', ariaLabel: 'Next candidate' })),
    );

    // --- the candidate ------------------------------------------------------------------
    const heading = el('h2', { id: 'excerpts-title' });
    const sub = el('p.excerpt-view__muted', { id: 'excerpts-sub' });
    const stage = el('div.excerpt-view__stage', { id: 'excerpts-stage' });
    const windowWords = el('p.excerpt-view__muted', { id: 'excerpts-window', 'aria-live': 'polite' });
    const hearStatus = el('p.excerpt-view__muted', { id: 'excerpts-hear-status', 'aria-live': 'polite' });
    const hearButton = button('Hear it — from before the cut to after it', () => void hear(), { id: 'excerpts-hear', variant: 'primary' });
    const stopButton = button('Stop', () => stop(), { id: 'excerpts-stop' });
    const partsBlock = el('section', { 'data-hook': 'parts' });
    const factsBlock = el('section', { 'data-hook': 'facts' });
    const side = el('section', { 'data-hook': 'decide' });
    card.append(
      el('section', { 'data-hook': 'candidate' }, heading, sub),
      stage,
      el('div.excerpt-view__row', {},
        button('◀ start', () => move(-1, 0), { id: 'excerpts-start-earlier', ariaLabel: 'Start a bar earlier' }),
        button('start ▶', () => move(1, 0), { id: 'excerpts-start-later', ariaLabel: 'Start a bar later' }),
        button('◀ end', () => move(0, -1), { id: 'excerpts-end-earlier', ariaLabel: 'End a bar earlier' }),
        button('end ▶', () => move(0, 1), { id: 'excerpts-end-later', ariaLabel: 'End a bar later' }),
        button('Back to the proposed bars', () => move(0, 0, true), { id: 'excerpts-reset' })),
      windowWords,
      el('div.excerpt-view__row', {},
        button('◀ Bars', () => pageWindow(-1), { id: 'excerpts-page-prev' }),
        button('Bars ▶', () => pageWindow(1), { id: 'excerpts-page-next' })),
      el('div.excerpt-view__row', {}, hearButton, stopButton),
      hearStatus,
      el('div.excerpt-view__layout', {}, el('div', {}, partsBlock, factsBlock), side),
    );

    function stepCandidate(delta: number): void {
      const next = Math.max(0, Math.min(run.candidates.length - 1, Number(picker.value) + delta));
      picker.value = String(next);
      void open(run.candidates[next]!);
    }
    runPicker.addEventListener('change', () => {
      run = runs[Number(runPicker.value)]!;
      drawCandidates();
      if (run.candidates[0]) void open(run.candidates[0]);
    });
    picker.addEventListener('change', () => void open(run.candidates[Number(picker.value)]!));

    function move(start: number, end: number, reset = false): void {
      if (!shown || playing) return;
      const last = shown.candidate.parent.bars;
      const from = reset ? shown.candidate.fromBar : Math.max(1, Math.min(last, shown.from + start));
      const to = reset ? shown.candidate.toBar : Math.max(from, Math.min(last, shown.to + end));
      shown = { ...shown, from, to };
      drawWindow();
    }

    // The table the proposer wrote: every window within four bars of the proposed boundaries.
    function drawWindow(): void {
      if (!shown) return;
      const { candidate, from, to } = shown;
      renderer?.setLoopRange({ from: from - 1, to: to - 1 });
      const row = scoredRow(candidate, from, to);
      const moved = from !== candidate.fromBar || to !== candidate.toBar;
      windowWords.textContent = `The cut: bars ${String(from)}–${String(to)} of ${String(candidate.parent.bars)}${moved ? ` (proposed ${String(candidate.fromBar)}–${String(candidate.toBar)})` : ''}; the bars around it are dimmed, ${moved || !marginsOnScreen ? `${String(MARGIN)} bars either side are in the playback, and on the page or a page away (◀ Bars / Bars ▶)` : `${String(MARGIN)} bars either side are on the page and in the playback`}.`;
      partsBlock.replaceChildren(el('h3', { text: 'The signals, part by part (the proposer’s own scoring)' }));
      if (row === undefined) {
        partsBlock.append(el('p.excerpt-view__warn', { id: 'excerpts-unscored', text: 'Not scored: the proposer’s table does not reach these bars. Run it again with --of for this parent.' }));
      } else if (row.crossing) {
        partsBlock.append(el('p.excerpt-view__warn', { id: 'excerpts-unscored', text: 'Refused: these bars cross a repeat sign, a first-or-second ending or a jump; unrolled, the cut would mean something else.' }));
      } else {
        const fired = (row.parts ?? []).every((part) => part.fired);
        const refused = [...(row.untaught ?? []).map((d) => `untaught at the judging rung: ${d}`), ...(row.forbidden ?? []).map((d) => `forbidden: ${d}`)];
        partsBlock.append(
          el('p', { id: 'excerpts-score', 'data-score': String(row.score ?? ''), text: `Score ${String(row.score?.toFixed(2) ?? '—')}: ${fired && refused.length === 0 ? 'every weighted signal met' : 'not every signal met'}${refused.length ? `; refused — ${refused.join('; ')}` : ''}` }),
          el('table', {},
            el('tr', {}, el('th', { text: 'Signal' }), el('th', { text: 'Weight' }), el('th', { text: 'Value' }), el('th', { text: 'Reading' })),
            ...(row.parts ?? []).map((part) =>
              el('tr', { 'data-signal': part.signal, 'data-fired': String(part.fired) },
                el('td', { text: part.signal }),
                el('td', { text: String(run.weights[part.signal]?.weight ?? part.weight ?? '') }),
                el('td', { text: part.value.toFixed(2) }),
                el('td', { text: part.detail })))),
          el('p.excerpt-view__muted', { text: `The window carries: ${(row.demands ?? candidate.demands).join(', ') || 'nothing measured'}.` }),
        );
      }
      if (!moved) {
        partsBlock.append(
          el('h3', { text: 'The gates' }),
          el('ul', {}, ...candidate.gates.map((gate) => el('li', { 'data-gate': gate.signal, text: `${gate.signal}: ${gate.passed === null ? 'not checked' : gate.passed ? 'passed' : 'refused'} — ${gate.detail}` }))),
        );
      } else {
        partsBlock.append(el('p.excerpt-view__muted', { text: 'The physical gate is read by the proposer on its candidates only: an adjusted range is checked by the build’s cut and the item view.' }));
      }
    }


    function pageWindow(delta: number): void {
      if (!renderer || !model || playing) return;
      const shownWindow = renderer.currentWindow;
      if (!shownWindow) return;
      const span = shownWindow.toMeasure - shownWindow.fromMeasure + 1;
      const from = delta > 0 ? shownWindow.toMeasure + 1 : Math.max(0, shownWindow.fromMeasure - span);
      if (delta < 0 && shownWindow.fromMeasure === 0) return;
      const target = model.steps.find((one) => one.sourceMeasureIndex >= from);
      if (target) renderer.showStep(target.index);
    }

    // --- playing ------------------------------------------------------------------------
    async function hear(): Promise<void> {
      if (!shown || !model || !renderer || playing) return;
      const from = Math.max(1, shown.from - MARGIN);
      const to = Math.min(shown.candidate.parent.bars, shown.to + MARGIN);
      const loop = loopFromPrintedBars(model, from, to);
      if (!loop) {
        hearStatus.textContent = 'Those bars have nothing to play.';
        return;
      }
      hearStatus.textContent = 'Starting the sound…';
      try {
        const context = await audioEngine.ensureStarted();
        const piano = await getPiano();
        if (disposed || !model || !renderer) return;
        session?.dispose();
        session = new ScoreSession({
          model,
          renderer,
          piano: {
            start: (note: Parameters<Piano['start']>[0]) => {
              scheduled.add(note.midi);
              return piano.start(note);
            },
            stop: (midi?: number) => piano.stop(midi),
          } as unknown as Piano,
          audioContext: context,
          destination: audioEngine.masterGain,
          onFinished: () => {
            // Once through, from before the cut to after it: a lap is the end.
            if (!playing) return;
            playing = false;
            session?.stop();
            hearStatus.textContent = `Played bars ${String(from)}–${String(to)}: the cut and ${String(MARGIN)} bars either side.`;
            drawControls();
          },
        });
        scheduled.clear();
        playing = true;
        playedRange = { from, to };
        session.start({ mode: 'listen', hands: 'both', tempoPct: 100, countInBars: 0, playbackHands: 'both', metronome: false,
          latchStart: false, holdAtStart: false, judging: false, loop });
        renderer.setLoopRange({ from: shown.from - 1, to: shown.to - 1 });
        hearStatus.textContent = `Playing bars ${String(from)}–${String(to)} at the written tempo: ${String(MARGIN)} before the cut, the cut, ${String(MARGIN)} after.`;
      } catch (cause) {
        playing = false;
        hearStatus.textContent = `No sound: ${cause instanceof Error ? cause.message : String(cause)}.`;
      }
      drawControls();
    }

    function stop(): void {
      if (!session || !playing) return;
      session.stop();
      playing = false;
      hearStatus.textContent = 'Stopped.';
      drawControls();
    }

    function drawControls(): void {
      hearButton.disabled = playing || !model;
      stopButton.disabled = !playing;
    }

    // --- one candidate ------------------------------------------------------------------
    async function open(candidate: Candidate): Promise<void> {
      stop();
      session?.dispose();
      session = null;
      renderer?.dispose();
      renderer = null;
      model = null;
      ready = false;
      section.dataset.ready = 'false';
      const parent = byId.get(candidate.of);
      heading.textContent = `${parent?.title ?? candidate.of}, bars ${String(candidate.fromBar)}–${String(candidate.toBar)}${candidate.selection === 'both' ? '' : `, ${candidate.selection} hand`}`;
      sub.textContent = `For ${candidate.targets.join(', ')} at ${run.rung ?? 'no rung'} · ${candidate.meetsEverySignal ? 'every defined signal met by the rules' : `not met: ${candidate.parts.filter((p) => !p.fired).map((p) => p.signal).join(', ') || candidate.refusedBy.join(', ')}`} · proposes ${candidate.excerptId}`;
      shown = { candidate, from: candidate.fromBar, to: candidate.toBar };
      stage.replaceChildren();
      drawFacts(candidate, parent);
      drawDecide(candidate);
      try {
        if (!parent?.file) throw new Error(`${candidate.of} has no file in this build`);
        const response = await fetch(contentUrl(parent.file));
        if (!response.ok) throw new Error(`${parent.file}: ${String(response.status)}`);
        const musicXml = toMusicXml(new Uint8Array(await response.arrayBuffer()));
        const probe = new OsmdView(document.createElement('div'));
        await probe.load(musicXml);
        const loaded = probe.extractModel({ id: parent.id });
        probe.dispose();
        if (disposed || shown?.candidate !== candidate) return;
        model = loaded;
        const settings = getSettings();
        const page = excerptPage(loaded, candidate.fromBar, candidate.toBar, MARGIN, MAX_BARS_PER_WINDOW);
        marginsOnScreen = page.margins === 'shown';
        renderer = await WindowRenderer.create({
          container: stage,
          model: loaded,
          musicXml,
          barsPerWindow: page.bars,
          zoom: settings.zoom,
          layout: 'window',
          handsFocus: 'both',
          drawFingerings: settings.showFingering,
          drawMetronomeMarks: false,
          drawLyrics: false,
          drawChordSymbols: settings.showChordSymbols,
        });
        if (disposed || shown?.candidate !== candidate) {
          renderer.dispose();
          renderer = null;
          return;
        }
        const first = loaded.steps.find((step) => step.sourceMeasureIndex >= page.showFrom);
        renderer.showStep(first?.index ?? 0);
      } catch (cause) {
        stage.replaceChildren(el('p.excerpt-view__warn', { text: `The app could not render the parent: ${cause instanceof Error ? cause.message : String(cause)}` }));
      }
      drawWindow();
      drawControls();
      ready = true;
      section.dataset.ready = 'true';
    }

    function drawFacts(candidate: Candidate, parent: CatalogItem | undefined): void {
      const p = candidate.parent;
      const parentDemands = Array.isArray(p.demands) ? p.demands.join(', ') : 'unmeasured';
      factsBlock.replaceChildren(
        el('h3', { text: 'The parent, measured whole' }),
        el('ul', {},
          el('li', { text: `${parent?.title ?? candidate.of} (${candidate.of}), ${String(p.bars)} printed bars, ${String(p.staves)} staff${p.staves === 1 ? '' : 's'}, ${p.keySig ?? ''} ${p.timeSig ?? ''}` }),
          el('li', { text: `level ${String(p.level ?? '?')}${p.levelSource === 'estimated' ? ' (estimated)' : ''} — shown beside, never in the score` }),
          el('li', { text: `demands: ${parentDemands}` }),
          el('li', { text: `untaught at ${run.rung ?? 'no rung'}: ${(p.untaught ?? []).join(', ') || 'nothing'}` }),
          el('li', { text: `source: ${parent?.source?.name ?? '—'} · licence ${parent?.source?.license ?? '—'}` }),
          el('li', { text: `built file sha256 ${p.sha256.slice(0, 16)}… (the approval records it; the validator names the row stale when it changes)` })),
        el('h3', { text: 'The window, from the positions' }),
        el('p.excerpt-view__muted', { text: `located: ${Object.entries(candidate.counts).map(([d, n]) => `${d} ${String(n)}`).join(', ') || 'nothing'}` }),
      );
    }

    // --- deciding -----------------------------------------------------------------------
    const decisionsList = el('ul', { id: 'excerpts-decisions' });
    const exportButton = button('Export', () => exportDecisions(), { id: 'excerpts-export', variant: 'primary' });
    const exportMessage = el('p.excerpt-view__muted', { id: 'excerpts-export-status', 'aria-live': 'polite' });
    const reviewer = el('input', { id: 'excerpts-reviewer', type: 'text', placeholder: 'Your name, as the record should give it', 'aria-label': 'Reviewer' }) as HTMLInputElement;
    try {
      reviewer.value = localStorage.getItem(REVIEWER_KEY) ?? '';
    } catch {
      reviewer.value = '';
    }
    reviewer.addEventListener('change', () => localStorage.setItem(REVIEWER_KEY, reviewer.value.trim()));

    function drawDecide(candidate: Candidate): void {
      const label = el('input', { id: 'excerpts-label', type: 'text', placeholder: 'Label (optional): how the Library names it', 'aria-label': 'Label' }) as HTMLInputElement;
      const note = el('textarea', { id: 'excerpts-note', placeholder: 'Note: what the signals and the page establish, and what stays unheard', 'aria-label': 'Note' }) as HTMLTextAreaElement;
      const reason = el('input', { id: 'excerpts-reason', type: 'text', placeholder: 'Why not (a rejection needs its reason)', 'aria-label': 'Reason' }) as HTMLInputElement;
      const message = el('p.excerpt-view__muted', { id: 'excerpts-message', 'aria-live': 'polite' });
      const record = (kind: 'approve' | 'reject'): void => {
        if (!shown) return;
        const by = reviewer.value.trim();
        if (!by) return void (message.textContent = 'Give your name first: the file says who decided.');
        if (kind === 'reject' && !reason.value.trim()) return void (message.textContent = 'A rejection needs its reason.');
        const moved = shown.from !== candidate.fromBar || shown.to !== candidate.toBar;
        const decision: ExcerptDecision = {
          v: 1,
          event: `ex-${crypto.randomUUID()}`,
          decision: kind === 'reject' ? 'reject' : moved ? 'adjust' : 'approve',
          of: candidate.of,
          fromBar: shown.from,
          toBar: shown.to,
          selection: candidate.selection,
          targets: candidate.targets,
          ...(kind === 'approve' && label.value.trim() ? { label: label.value.trim() } : {}),
          ...(note.value.trim() ? { note: note.value.trim() } : {}),
          ...(kind === 'reject' ? { reason: reason.value.trim() } : {}),
          ...(moved && kind !== 'reject' ? { proposed: { fromBar: candidate.fromBar, toBar: candidate.toBar } } : {}),
          parentSha256: candidate.parent.sha256,
          by,
          at: new Date().toISOString(),
        };
        local = [...local, { decision }];
        writeLocal(local);
        message.textContent = `Recorded on this device: ${decision.decision} bars ${String(decision.fromBar)}–${String(decision.toBar)}. Export it to merge it.`;
        drawDecisions();
      };
      side.replaceChildren(
        el('h2', { text: 'Decide' }),
        el('div.excerpt-view__row', {}, el('label', { htmlFor: 'excerpts-reviewer', text: 'Reviewer' }), reviewer),
        el('fieldset', {},
          el('legend', { text: 'The boundary' }),
          el('p.excerpt-view__muted', { text: 'Approve the bars shown (moved bars are an adjusted approval, the proposed ones kept), or reject with a reason. The two teaching decisions on the cut are the item view’s, on its own identity, once it is built.' }),
          label, note,
          el('div.excerpt-view__row', {},
            button('Approve these bars', () => record('approve'), { id: 'excerpts-approve', variant: 'primary' })),
          reason,
          el('div.excerpt-view__row', {}, button('Reject', () => record('reject'), { id: 'excerpts-reject' })),
          message),
        el('section', {}, el('h2', { text: 'Decisions on this device' }), decisionsList, el('div.excerpt-view__row', {}, exportButton), exportMessage),
      );
      drawDecisions();
    }

    function drawDecisions(): void {
      decisionsList.replaceChildren(
        ...local.map((one) =>
          el('li', { 'data-state': one.exportedAt ? 'exported' : 'unexported', 'data-event': one.decision.event },
            `${one.exportedAt ? 'exported' : 'unexported'} — ${one.decision.decision} ${byId.get(one.decision.of)?.title ?? one.decision.of}, bars ${String(one.decision.fromBar)}–${String(one.decision.toBar)} (${one.decision.selection})${one.decision.reason ? `: ${one.decision.reason}` : ''}`)),
      );
      exportButton.textContent = `Export ${String(local.length)} decision${local.length === 1 ? '' : 's'}`;
      exportButton.disabled = local.length === 0;
    }

    function exportDecisions(): void {
      if (local.length === 0) return;
      const text = local.map((one) => JSON.stringify(one.decision)).join('\n') + '\n';
      const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, '');
      const name = `excerpt-decisions-${stamp}.jsonl`;
      const url = URL.createObjectURL(new Blob([text], { type: 'application/x-ndjson' }));
      const link = el('a', { href: url, download: name }) as HTMLAnchorElement;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      const at = new Date().toISOString();
      local = local.map((one) => ({ ...one, exportedAt: at }));
      writeLocal(local);
      exportMessage.textContent = `Exported ${String(local.length)} as ${name}. Merge it: python tools/content/excerpts.py --merge ${name} — rerunning it appends nothing.`;
      drawDecisions();
    }

    drawCandidates();
    await open(run.candidates[0]!);
  })();

  return section;
}
