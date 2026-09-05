/**
 * The PDF viewer (docs/04 §5b).
 *
 * The owner buys sheet music as PDF, and a page of it at page scale on a
 * 6.2" phone is unreadable. This screen solves exactly that: **one system at a
 * time, full width**, with the next one greyed underneath so the eye has
 * somewhere to go.
 *
 * What it deliberately does not have: Wait mode, mic-follow, MIDI-follow,
 * note colouring, the keyboard strip and scoring. A PDF has no notes to match,
 * and the spec is explicit that these are *hidden rather than disabled* — a
 * greyed-out control invites "why not?" every time it is seen.
 *
 * **Adjust cuts is not a nice-to-have.** `pdf/systems.ts` reads a projection
 * profile and assumes a clean, digitally typeset page; a scan, a photograph or
 * a page with a title block will cut in the wrong place, and without a way to
 * drag the lines one bad detection makes a bought score useless. The
 * corrections are stored with the item and survive a reload and an export.
 */
import type { Router } from '../../router';
import { getImport, updateImport } from '../../data/importStore';
import { getMidiSettings } from '../../data/midiSettings';
import { getSettings } from '../../data/settingsStore';
import { audioEngine } from '../../app/services';
import { Metronome } from '../../audio/Metronome';
import { DETECTION_WIDTH, PdfDocument } from '../../pdf/PdfDocument';
import {
  addSystem,
  cutsToSystems,
  detectPageSystems,
  moveCut,
  removeSystem,
  wholePageCuts,
  type CutMap,
  type PlannedSystem,
} from '../../pdf/systemPlan';
import { onScreenDispose } from '../screenLifecycle';
import { button, el } from '../widgets';

export type FollowMode = 'manual' | 'timed' | 'loop';

/** Width the page is rendered at for display; enough for a phone at 3× DPR. */
const DISPLAY_WIDTH = 1400;

/** docs/04 §5b: timed advance is set in bpm, so a system needs a bar count. */
export const DEFAULT_BARS_PER_SYSTEM = 4;
const BEATS_PER_BAR = 4;

export function secondsPerSystem(bpm: number, barsPerSystem: number): number {
  return (barsPerSystem * BEATS_PER_BAR * 60) / Math.max(1, bpm);
}

export function PdfScreen(router: Router, importId: string): HTMLElement {
  const section = el('section.screen.pdf-screen', { 'data-screen': 'pdf', 'data-mode': 'manual' });

  const status = el('p.status', { id: 'pdf-status', role: 'status', 'aria-live': 'polite' });
  const mainCanvas = el('canvas.pdf-system', { id: 'pdf-system' }) as HTMLCanvasElement;
  const nextCanvas = el('canvas.pdf-system.pdf-system--next', { id: 'pdf-next' }) as HTMLCanvasElement;
  const stage = el('div.pdf-stage', { id: 'pdf-stage' }, mainCanvas, nextCanvas, status);
  const label = el('div.pdf-label', { id: 'pdf-label' });
  const adjustHost = el('div.pdf-adjust', { id: 'pdf-adjust', hidden: true });

  let doc: PdfDocument | null = null;
  let pageCanvases: (HTMLCanvasElement | null)[] = [];
  let cuts: CutMap = {};
  let systems: PlannedSystem[] = [];
  let index = 0;
  let mode: FollowMode = 'manual';
  let bpm = 80;
  let barsPerSystem = DEFAULT_BARS_PER_SYSTEM;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let metronome: Metronome | null = null;
  let metronomeOn = false;
  let disposed = false;

  // --- drawing -------------------------------------------------------------

  function drawInto(canvas: HTMLCanvasElement, system: PlannedSystem | undefined): void {
    const context = canvas.getContext('2d');
    if (!context) return;
    const page = system ? pageCanvases[system.page] : null;
    if (!system || !page) {
      canvas.width = 1;
      canvas.height = 1;
      canvas.hidden = true;
      return;
    }
    const top = Math.round(system.top * page.height);
    const height = Math.max(1, Math.round((system.bottom - system.top) * page.height));
    canvas.width = page.width;
    canvas.height = height;
    canvas.hidden = false;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(page, 0, top, page.width, height, 0, 0, page.width, height);
  }

  function draw(): void {
    const current = systems[index];
    drawInto(mainCanvas, current);
    drawInto(nextCanvas, systems[index + 1]);
    label.textContent = current
      ? `Page ${String(current.page + 1)} · system ${String(current.indexOnPage + 1)}  (${String(
          index + 1,
        )}/${String(systems.length)})`
      : 'No systems found';
    section.dataset.system = String(index);
    section.dataset.page = String(current?.page ?? 0);
  }

  function goTo(next: number): void {
    if (systems.length === 0) return;
    index = Math.min(systems.length - 1, Math.max(0, next));
    draw();
    if (mode === 'timed' || mode === 'loop') arm();
  }

  // --- follow modes --------------------------------------------------------

  function disarm(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function arm(): void {
    disarm();
    if (mode === 'manual') return;
    timer = setTimeout(() => {
      if (disposed) return;
      if (mode === 'loop') draw();
      else if (index + 1 < systems.length) goTo(index + 1);
      else {
        setMode('manual');
        status.textContent = 'End of the last page.';
        return;
      }
      arm();
    }, secondsPerSystem(bpm, barsPerSystem) * 1000);
  }

  function setMode(next: FollowMode): void {
    mode = next;
    section.dataset.mode = next;
    for (const id of ['manual', 'timed', 'loop']) {
      document.getElementById(`pdf-mode-${id}`)?.setAttribute('aria-pressed', String(id === next));
    }
    if (next === 'manual') disarm();
    else arm();
  }

  async function toggleMetronome(): Promise<void> {
    metronomeOn = !metronomeOn;
    document.getElementById('pdf-metronome')?.setAttribute('aria-pressed', String(metronomeOn));
    if (!metronomeOn) {
      metronome?.stop();
      return;
    }
    // Same reason as the Score screen: a timed page-turn without a pulse is a
    // page-turn you cannot play to.
    const context = await audioEngine.ensureStarted();
    metronome ??= new Metronome(context, {
      ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
    });
    metronome.setBpm(bpm);
    metronome.setBeatsPerBar(BEATS_PER_BAR);
    metronome.setVolume(getMidiSettings().metronomeVolume);
    metronome.setSound(getSettings().metronomeSound);
    metronome.start();
  }

  // --- adjust cuts ---------------------------------------------------------

  let adjusting = false;
  let adjustPage = 0;

  function drawAdjust(): void {
    adjustHost.replaceChildren();
    const page = pageCanvases[adjustPage];
    if (!page) return;

    const image = el('img.pdf-adjust__page', { src: page.toDataURL(), alt: `Page ${String(adjustPage + 1)}` });
    const lines = el('div.pdf-adjust__lines');
    const frame = el('div.pdf-adjust__frame', {}, image, lines);
    const pageCuts = cuts[adjustPage] ?? wholePageCuts();

    pageCuts.forEach((fraction, cutIndex) => {
      const handle = el('div.pdf-cut', {
        'data-cut': cutIndex,
        'data-edge': cutIndex % 2 === 0 ? 'top' : 'bottom',
      });
      handle.style.top = `${String(fraction * 100)}%`;
      const drag = (event: PointerEvent): void => {
        event.preventDefault();
        handle.setPointerCapture(event.pointerId);
        const rect = frame.getBoundingClientRect();
        const move = (moveEvent: PointerEvent): void => {
          const to = (moveEvent.clientY - rect.top) / Math.max(1, rect.height);
          cuts = { ...cuts, [adjustPage]: moveCut(cuts[adjustPage] ?? pageCuts, cutIndex, to) };
          handle.style.top = `${String((cuts[adjustPage]?.[cutIndex] ?? fraction) * 100)}%`;
        };
        const up = (): void => {
          handle.removeEventListener('pointermove', move);
          handle.removeEventListener('pointerup', up);
          rebuildSystems();
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
      };
      handle.addEventListener('pointerdown', drag);
      lines.append(handle);
    });

    const count = cutsToSystems(pageCuts, adjustPage).length;
    adjustHost.append(
      el('div.row', {},
        button('◀ Page', () => {
          adjustPage = Math.max(0, adjustPage - 1);
          drawAdjust();
        }, { id: 'pdf-adjust-prev' }),
        el('span', { id: 'pdf-adjust-label', text: `Page ${String(adjustPage + 1)} of ${String(pageCanvases.length)} · ${String(count)} systems` }),
        button('Page ▶', () => {
          adjustPage = Math.min(pageCanvases.length - 1, adjustPage + 1);
          drawAdjust();
        }, { id: 'pdf-adjust-next' }),
      ),
      frame,
      el('div.row', {},
        button('Add a system', () => {
          cuts = { ...cuts, [adjustPage]: addSystem(cuts[adjustPage] ?? pageCuts) };
          rebuildSystems();
          drawAdjust();
        }, { id: 'pdf-adjust-add' }),
        button('Remove the last', () => {
          const current = cuts[adjustPage] ?? pageCuts;
          cuts = { ...cuts, [adjustPage]: removeSystem(current, Math.max(0, current.length / 2 - 1)) };
          rebuildSystems();
          drawAdjust();
        }, { id: 'pdf-adjust-remove' }),
        button('Re-detect this page', () => {
          void redetect(adjustPage).then(drawAdjust);
        }, { id: 'pdf-adjust-detect' }),
        button('Save cuts', () => {
          void updateImport(importId, { cuts }).then(() => {
            status.textContent = 'Cuts saved with the score.';
            toggleAdjust(false);
          });
        }, { id: 'pdf-adjust-save', variant: 'primary' }),
      ),
      el('p.muted', {
        text: 'Drag a line to move it. Each system is a pair of lines — the top one and the bottom one.',
      }),
    );
  }

  function toggleAdjust(on: boolean): void {
    adjusting = on;
    adjustHost.hidden = !on;
    stage.hidden = on;
    section.dataset.adjusting = String(on);
    document.getElementById('pdf-adjust-toggle')?.setAttribute('aria-pressed', String(on));
    if (on) {
      setMode('manual');
      adjustPage = systems[index]?.page ?? 0;
      drawAdjust();
    } else {
      draw();
    }
  }

  function rebuildSystems(): void {
    const rebuilt: PlannedSystem[] = [];
    for (let page = 0; page < pageCanvases.length; page += 1) {
      rebuilt.push(...cutsToSystems(cuts[page] ?? wholePageCuts(), page));
    }
    systems = rebuilt;
    index = Math.min(index, Math.max(0, systems.length - 1));
    if (!adjusting) draw();
  }

  async function redetect(page: number): Promise<void> {
    if (!doc) return;
    const rendered = await doc.renderPage(page, DETECTION_WIDTH);
    const context = rendered.canvas.getContext('2d');
    if (!context) return;
    const data = context.getImageData(0, 0, rendered.width, rendered.height).data;
    const detected = detectPageSystems(data, rendered.width, rendered.height);
    cuts = { ...cuts, [page]: detected.length >= 2 ? detected : wholePageCuts() };
    rebuildSystems();
  }

  // --- chrome --------------------------------------------------------------

  const bar = el(
    'div.pdf-bar',
    { id: 'pdf-bar' },
    button('←', () => router.navigate('library'), { id: 'pdf-back', title: 'Back to Library' }),
    button('◀', () => goTo(index - 1), { id: 'pdf-prev', title: 'Previous system' }),
    button('▶', () => goTo(index + 1), { id: 'pdf-next-system', title: 'Next system' }),
    el('button.chip', { type: 'button', id: 'pdf-mode-manual', text: 'Tap', 'aria-pressed': true }),
    el('button.chip', { type: 'button', id: 'pdf-mode-timed', text: 'Timed', 'aria-pressed': false }),
    el('button.chip', { type: 'button', id: 'pdf-mode-loop', text: 'Loop', 'aria-pressed': false }),
    el('button.chip', { type: 'button', id: 'pdf-metronome', text: '🥁', 'aria-pressed': false, title: 'Metronome' }),
    label,
  );

  const bpmInput = el('input', {
    type: 'number',
    id: 'pdf-bpm',
    value: String(bpm),
    min: '30',
    max: '240',
    'aria-label': 'Tempo in beats per minute',
  }) as HTMLInputElement;
  bpmInput.addEventListener('change', () => {
    bpm = Math.min(240, Math.max(30, Number(bpmInput.value) || bpm));
    bpmInput.value = String(bpm);
    metronome?.setBpm(bpm);
    if (mode !== 'manual') arm();
  });

  const barsInput = el('input', {
    type: 'number',
    id: 'pdf-bars',
    value: String(barsPerSystem),
    min: '1',
    max: '16',
    'aria-label': 'Bars per system',
  }) as HTMLInputElement;
  barsInput.addEventListener('change', () => {
    barsPerSystem = Math.min(16, Math.max(1, Number(barsInput.value) || barsPerSystem));
    barsInput.value = String(barsPerSystem);
    if (mode !== 'manual') arm();
  });

  const timing = el(
    'div.pdf-timing',
    { id: 'pdf-timing' },
    el('label', { htmlFor: 'pdf-bpm', text: 'bpm' }),
    bpmInput,
    el('label', { htmlFor: 'pdf-bars', text: 'bars/system' }),
    barsInput,
    el('button.chip', { type: 'button', id: 'pdf-adjust-toggle', text: 'Adjust cuts', 'aria-pressed': false }),
  );

  section.append(bar, stage, timing, adjustHost);

  bar.querySelector('#pdf-mode-manual')?.addEventListener('click', () => setMode('manual'));
  bar.querySelector('#pdf-mode-timed')?.addEventListener('click', () => setMode('timed'));
  bar.querySelector('#pdf-mode-loop')?.addEventListener('click', () => setMode('loop'));
  bar.querySelector('#pdf-metronome')?.addEventListener('click', () => void toggleMetronome());
  timing.querySelector('#pdf-adjust-toggle')?.addEventListener('click', () => toggleAdjust(!adjusting));

  // Tap the page itself: right half forward, left half back (docs/04 §5b).
  stage.addEventListener('click', (event) => {
    if (adjusting) return;
    const rect = stage.getBoundingClientRect();
    goTo(event.clientX - rect.left > rect.width / 2 ? index + 1 : index - 1);
  });

  // --- load ----------------------------------------------------------------

  void (async () => {
    try {
      const row = await getImport(importId);
      if (!row) {
        status.textContent = `That score is not in your library any more.`;
        return;
      }
      if (row.kind !== 'pdf' || typeof row.data === 'string') {
        status.textContent = `${row.title} is not a PDF.`;
        return;
      }
      status.textContent = `Opening ${row.title}…`;
      doc = await PdfDocument.open(row.data);
      if (disposed) return;

      pageCanvases = new Array<HTMLCanvasElement | null>(doc.pageCount).fill(null);
      for (let page = 0; page < doc.pageCount; page += 1) {
        const rendered = await doc.renderPage(page, DISPLAY_WIDTH);
        if (disposed) return;
        pageCanvases[page] = rendered.canvas;
      }

      // Stored corrections win over detection, always: the learner has already
      // told us this page is not what the profile thought it was.
      cuts = { ...(row.cuts ?? {}) };
      for (let page = 0; page < pageCanvases.length; page += 1) {
        if (cuts[page]) continue;
        await redetect(page);
        if (disposed) return;
      }
      rebuildSystems();
      status.textContent =
        systems.length > 0
          ? ''
          : 'No systems were found on these pages — use “Adjust cuts” to place them by hand.';
      document.title = row.title;
    } catch (cause) {
      status.textContent = `That PDF could not be opened: ${
        cause instanceof Error ? cause.message : String(cause)
      }`;
      status.classList.add('status--error');
    }
  })();

  onScreenDispose(section, () => {
    disposed = true;
    disarm();
    metronome?.dispose();
    doc?.dispose();
  });

  return section;
}
