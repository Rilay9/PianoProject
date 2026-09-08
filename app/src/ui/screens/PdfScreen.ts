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
import { button, el, openSheet } from '../widgets';
import { BEATS_PER_BAR, DEFAULT_BARS_PER_SYSTEM, intervalMs, LEARN_MAX_MS, LEARN_MIN_MS } from '../../pdf/timing';
export { DEFAULT_BARS_PER_SYSTEM, intervalMs, LEARN_MAX_MS, LEARN_MIN_MS, secondsPerSystem } from '../../pdf/timing';

export type FollowMode = 'manual' | 'timed' | 'loop';

/** Width the page is rendered at for display; enough for a phone at 3× DPR. */
const DISPLAY_WIDTH = 1400;

/** Rendered pages kept in memory at once: the one being read, plus neighbours. */
const PAGE_CACHE_SIZE = 3;

/**
 * @param openAtPage 1-based page to start on (replan §5.4). A shelf piece
 * knows which page it is on, and opening the book at page one would waste the
 * one fact the owner took the trouble to type in.
 */
/** Remembers that the "turn it sideways" hint has been given (P21d D5). */
const SIDEWAYS_HINT_KEY = 'pianopath.pdf.sidewaysHint';

export function PdfScreen(router: Router, importId: string, openAtPage?: number): HTMLElement {
  const section = el('section.screen.pdf-screen', { 'data-screen': 'pdf', 'data-mode': 'manual' });

  const status = el('p.status', { id: 'pdf-status', role: 'status', 'aria-live': 'polite' });
  const mainCanvas = el('canvas.pdf-system', { id: 'pdf-system' }) as HTMLCanvasElement;
  /**
   * The systems after the current one, dimmed, as many as fit (P21d D1).
   *
   * It was one, "if it fits". A letter-page system fitted to a phone's width
   * is about 170 px tall, so upright there was room for three more and a
   * thousand pixels of black instead. The first of them keeps the id the
   * tests and the tour know it by.
   */
  const column = el('div.pdf-column', { id: 'pdf-column' });
  const stage = el('div.pdf-stage', { id: 'pdf-stage' }, mainCanvas, column, status);
  const label = el('div.pdf-label', { id: 'pdf-label' });
  const adjustHost = el('div.pdf-adjust', { id: 'pdf-adjust', hidden: true });
  const followCanvases: HTMLCanvasElement[] = [];

  let doc: PdfDocument | null = null;
  let pageCount = 0;
  /**
   * Rendered pages, most recently used last.
   *
   * Rendering every page up front is what the first draft did, and it does not
   * survive a real score: a 30-page sonata at display width is roughly 10 MB
   * of canvas per page, which is 300 MB of bitmap on a phone. Only the page
   * being read and its neighbours are kept.
   */
  const pageCache = new Map<number, HTMLCanvasElement>();
  /** Renders in progress, so two draws never rasterise the same page twice. */
  const inFlight = new Map<number, Promise<void>>();
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
  /** When the last two manual advances happened, so Timed can learn from them. */
  let lastManualAdvanceAt: number | null = null;
  let learnedMs: number | null = null;

  // --- drawing -------------------------------------------------------------

  function drawInto(canvas: HTMLCanvasElement, system: PlannedSystem | undefined): void {
    const context = canvas.getContext('2d');
    if (!context) return;
    const page = system ? pageCache.get(system.page) : undefined;
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

  /** Renders a page into the cache if it is not there, evicting the oldest. */
  async function ensurePage(page: number): Promise<void> {
    if (!doc || page < 0 || page >= pageCount || pageCache.has(page)) return;
    // Two draws can want the same page at once — the current system and the
    // greyed next one, when both are on it. Sharing the render keeps a phone
    // from rasterising a full page twice for one repaint.
    const existing = inFlight.get(page);
    if (existing) {
      await existing;
      return;
    }
    const render = doc.renderPage(page, DISPLAY_WIDTH);
    inFlight.set(page, render.then(() => undefined));
    try {
      const rendered = await render;
      if (disposed) return;
      pageCache.set(page, rendered.canvas);
      while (pageCache.size > PAGE_CACHE_SIZE) {
        const oldest = pageCache.keys().next().value;
        if (oldest === undefined) break;
        pageCache.delete(oldest);
      }
    } finally {
      inFlight.delete(page);
    }
  }

  /** How tall a system is on the screen, from its share of the page. */
  function screenHeightOf(system: PlannedSystem | undefined): number {
    const page = system ? pageCache.get(system.page) : undefined;
    if (!system || !page) return 0;
    const width = stage.clientWidth - 16;
    if (width <= 0) return 0;
    return ((system.bottom - system.top) * page.height * width) / page.width;
  }

  /** How many systems after the current one fit under it. */
  function followCount(): number {
    const room = stage.clientHeight - screenHeightOf(systems[index]) - 8;
    let used = 0;
    let count = 0;
    for (let i = index + 1; i < systems.length; i += 1) {
      const height = screenHeightOf(systems[i]);
      if (height <= 0) break;
      if (used + height + 8 > room && count > 0) break;
      used += height + 8;
      count += 1;
      if (used > room) break;
    }
    return Math.max(count, index + 1 < systems.length ? 1 : 0);
  }

  /** The pages the current position needs, then repaint once they are in. */
  function ensureVisiblePages(): void {
    const following = followCount();
    const wanted = [systems[index]?.page];
    for (let i = 1; i <= following; i += 1) wanted.push(systems[index + i]?.page);
    const distinct = [...new Set(wanted.filter((page): page is number => page !== undefined))];
    const missing = distinct.filter((page) => !pageCache.has(page));
    if (missing.length === 0) return;
    void (async () => {
      for (const page of missing) await ensurePage(page);
      if (!disposed && !adjusting) draw();
    })();
  }

  function draw(): void {
    const current = systems[index];
    ensureVisiblePages();
    drawInto(mainCanvas, current);
    // The column of what comes next, as many as fit: the eye always has two
    // systems of read-ahead and the music never moves mid-system, because
    // advancing moves the column up one and nothing else.
    const following = followCount();
    while (followCanvases.length < following) {
      const canvas = el('canvas.pdf-system.pdf-system--next') as HTMLCanvasElement;
      if (followCanvases.length === 0) canvas.id = 'pdf-next';
      followCanvases.push(canvas);
      column.appendChild(canvas);
    }
    followCanvases.forEach((canvas, i) => {
      drawInto(canvas, i < following ? systems[index + 1 + i] : undefined);
    });
    label.textContent = current
      ? `Page ${String(current.page + 1)} · system ${String(current.indexOnPage + 1)} · ${String(
          index + 1,
        )}/${String(systems.length)}`
      : 'No systems found';
    section.dataset.system = String(index);
    section.dataset.page = String(current?.page ?? 0);
  }

  function goTo(next: number, byHand = false): void {
    if (systems.length === 0) return;
    const target = Math.min(systems.length - 1, Math.max(0, next));
    if (byHand && target === index + 1) learnFromTap();
    index = target;
    draw();
    if (mode === 'timed' || mode === 'loop') arm();
  }

  /**
   * Two manual advances in a row measure how long a system takes (P21d D3).
   *
   * The way tap-tempo works: the gap between the last two taps of "next",
   * while he is playing, is the real duration of a system for this piece at
   * his tempo — no 4/4 assumed, no bars per system to count. Kept until the
   * next pair replaces it.
   */
  function learnFromTap(): void {
    const now = performance.now();
    if (lastManualAdvanceAt !== null) {
      const gap = now - lastManualAdvanceAt;
      if (gap >= LEARN_MIN_MS && gap <= LEARN_MAX_MS) {
        learnedMs = Math.round(gap);
        if (mode === 'timed') describeTiming();
      }
    }
    lastManualAdvanceAt = now;
  }

  /** What Timed is going to do, in the status line. */
  function describeTiming(): void {
    const { ms, learned } = intervalMs(learnedMs, bpm, barsPerSystem);
    status.textContent = learned
      ? `Timed: every ${(ms / 1000).toFixed(1)} s, from your last two taps · Timed again to change`
      : `Timed: every ${(ms / 1000).toFixed(1)} s from ${String(bpm)} bpm · Timed again to change`;
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
    }, intervalMs(learnedMs, bpm, barsPerSystem).ms);
  }

  function setMode(next: FollowMode): void {
    // Timed, tapped while already timed, opens its sheet (P21d D2): the bpm
    // and bars-per-system arithmetic is the fallback for when there have
    // been no taps to learn from, and it lives behind the chip it belongs to
    // rather than on a row of its own under the page.
    if (next === 'timed' && mode === 'timed') {
      openTimingSheet();
      return;
    }
    mode = next;
    section.dataset.mode = next;
    for (const id of ['manual', 'timed', 'loop']) {
      document.getElementById(`pdf-mode-${id}`)?.setAttribute('aria-pressed', String(id === next));
    }
    if (next === 'manual') disarm();
    else arm();
    if (next === 'timed') describeTiming();
  }

  function openTimingSheet(): void {
    const sheet = openSheet('Timed');
    const rows = el('div.pdf-timing', { id: 'pdf-timing' });
    rows.append(
      el('label', { htmlFor: 'pdf-bpm', text: 'bpm' }),
      bpmInput,
      el('label', { htmlFor: 'pdf-bars', text: 'bars/system' }),
      barsInput,
    );
    const learned = el('p.muted', {
      id: 'pdf-learned',
      text:
        learnedMs === null
          ? 'Tap ▶ twice while playing and Timed will take the gap between the taps instead.'
          : `Learned ${(learnedMs / 1000).toFixed(1)} s from your last two taps. Forget it to use the bpm.`,
    });
    const forget = button(
      'Forget the taps',
      () => {
        learnedMs = null;
        lastManualAdvanceAt = null;
        describeTiming();
        if (mode !== 'manual') arm();
        sheet.close();
      },
      { id: 'pdf-forget-taps', variant: 'quiet' },
    );
    forget.hidden = learnedMs === null;
    sheet.body.append(rows, learned, forget);
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

  /**
   * Said once, the first time a PDF is opened upright (P21d D5).
   *
   * Fitted to 360 px a letter page's system is 59 % of print size; fitted to
   * 780 px it is 127 %. That is the difference between squinting and
   * reading, and nothing on the screen says so. Once, because a hint that
   * comes back is an instruction, and this one is a fact you only need
   * told the first time.
   */
  function sidewaysHint(): string {
    if (typeof window === 'undefined') return '';
    const upright = window.innerHeight > window.innerWidth;
    if (!upright) return '';
    let seen = false;
    try {
      seen = localStorage.getItem(SIDEWAYS_HINT_KEY) === '1';
    } catch {
      // A private window with storage blocked: say it, every time, rather
      // than never. A repeated fact is better than a missing one.
    }
    if (seen) return '';
    try {
      localStorage.setItem(SIDEWAYS_HINT_KEY, '1');
    } catch {
      // Nothing to do: the hint is advice, not state worth failing over.
    }
    return 'Turn the phone sideways for a bigger page';
  }

  // --- adjust cuts ---------------------------------------------------------

  let adjusting = false;
  let adjustPage = 0;

  function drawAdjust(): void {
    adjustHost.replaceChildren();
    const page = pageCache.get(adjustPage);
    if (!page) {
      adjustHost.append(el('p.muted', { text: 'Rendering the page…' }));
      void ensurePage(adjustPage).then(() => {
        if (!disposed && adjusting) drawAdjust();
      });
      return;
    }

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
        button('◀', () => {
          adjustPage = Math.max(0, adjustPage - 1);
          drawAdjust();
        }, { id: 'pdf-adjust-prev', ariaLabel: 'Previous page' }),
        el('span', { id: 'pdf-adjust-label', text: `Page ${String(adjustPage + 1)} of ${String(pageCount)} · ${String(count)} systems` }),
        button('▶', () => {
          adjustPage = Math.min(pageCount - 1, adjustPage + 1);
          drawAdjust();
        }, { id: 'pdf-adjust-next', ariaLabel: 'Next page' }),
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
    for (let page = 0; page < pageCount; page += 1) {
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


  const bar = el(
    'div.pdf-bar',
    { id: 'pdf-bar' },
    button('←', () => router.navigate('library'), { id: 'pdf-back', title: 'Back to Library' }),
    button('◀', () => goTo(index - 1), {
      id: 'pdf-prev',
      title: 'Previous system',
      ariaLabel: 'Previous system',
    }),
    button('▶', () => goTo(index + 1, true), {
      id: 'pdf-next-system',
      title: 'Next system',
      ariaLabel: 'Next system',
    }),
    el('button.chip', { type: 'button', id: 'pdf-mode-manual', text: 'Tap', 'aria-pressed': true }),
    el('button.chip', { type: 'button', id: 'pdf-mode-timed', text: 'Timed', 'aria-pressed': false }),
    el('button.chip', { type: 'button', id: 'pdf-mode-loop', text: 'Loop', 'aria-pressed': false }),
    el('button.chip', { type: 'button', id: 'pdf-metronome', text: '🥁', 'aria-pressed': false, title: 'Metronome' }),
    label,
    // A once-per-import action, as text at the end of the row (R3).
    button('Adjust cuts', () => toggleAdjust(!adjusting), { id: 'pdf-adjust-toggle', variant: 'quiet' }),
  );

  section.append(bar, stage, adjustHost);

  bar.querySelector('#pdf-mode-manual')?.addEventListener('click', () => setMode('manual'));
  bar.querySelector('#pdf-mode-timed')?.addEventListener('click', () => setMode('timed'));
  bar.querySelector('#pdf-mode-loop')?.addEventListener('click', () => setMode('loop'));
  bar.querySelector('#pdf-metronome')?.addEventListener('click', () => void toggleMetronome());
  // Tap the page itself: right half forward, left half back (docs/04 §5b).
  stage.addEventListener('click', (event) => {
    if (adjusting) return;
    const rect = stage.getBoundingClientRect();
    goTo(event.clientX - rect.left > rect.width / 2 ? index + 1 : index - 1, true);
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

      pageCount = doc.pageCount;

      // Stored corrections win over detection, always: the learner has already
      // told us this page is not what the profile thought it was. Detection
      // runs a page at a time at a small width and keeps no canvas, so a long
      // score costs seconds rather than hundreds of megabytes.
      cuts = { ...(row.cuts ?? {}) };
      for (let page = 0; page < pageCount; page += 1) {
        if (cuts[page]) continue;
        status.textContent = `Finding the systems on page ${String(page + 1)} of ${String(pageCount)}…`;
        await redetect(page);
        if (disposed) return;
      }
      rebuildSystems();
      if (openAtPage !== undefined) {
        // The first system *on* that page, not the page itself: the viewer's
        // unit is a system, and landing between two of them would show half a
        // stave.
        const wanted = systems.findIndex((system) => system.page >= openAtPage - 1);
        if (wanted !== -1) index = wanted;
      }
      await ensurePage(systems[index]?.page ?? 0);
      if (disposed) return;
      draw();
      status.textContent =
        systems.length > 0
          ? sidewaysHint()
          : 'No systems were found on these pages — use “Adjust cuts” to place them by hand.';
    } catch (cause) {
      status.textContent = `That PDF could not be opened: ${
        cause instanceof Error ? cause.message : String(cause)
      }`;
      status.classList.add('status--error');
    }
  })();

  onScreenDispose(section, () => {
    disposed = true;
    pageCache.clear();
    inFlight.clear();
    disarm();
    metronome?.dispose();
    doc?.dispose();
  });

  return section;
}
