// Windowed and scrolling notation rendering.
//
// The Score screen shows a small window of bars that advances as the learner
// plays (docs/04-ui-spec.md §5). Two things make that feel right on a phone,
// and both are why this class exists rather than a bare OsmdView:
//
//  * **Double buffering.** Re-rendering OSMD costs tens of milliseconds — far
//    over the one-frame budget for a window swap (docs/01 §6). So two OsmdView
//    instances are kept: one visible, one off-screen holding the *next* window,
//    already drawn. Advancing is a class toggle.
//  * **Class-based state.** Note colouring and hand dimming never re-render.
//    After each draw, every drawn note gets `data-note-id`, `data-hand` and
//    `data-midi`, so painting a chord green is four `classList` calls and
//    dimming a hand is one class on the wrapper.
//
// Windows are ranges of *printed* measures, because that is what OSMD draws.
// The cursor moves through *unrolled* steps, so `showStep` maps step →
// `sourceMeasureIndex` → window. On a repeat the window jumps back, which is
// exactly what a player reading from the page does.

import { OsmdView, type MeasureRange } from './OsmdView';
import type { ScoreModel, ScoreNote, ScoreStep } from './types';
import { recordRenderTiming } from '../util/renderTiming';

export type ScoreLayout = 'window' | 'scroll';
export type HandsFocus = 'R' | 'L' | 'both';
export type NoteState = 'correct' | 'wrong' | 'current';

export const MIN_BARS_PER_WINDOW = 1;
export const MAX_BARS_PER_WINDOW = 8;

/** Keep the cursor this far down the viewport in Scroll layout (docs §5). */
const SCROLL_TARGET_FRACTION = 0.3;
export const SCROLL_TARGET_MIN = 0.25;
export const SCROLL_TARGET_MAX = 0.4;

/** Manual scrolling suspends auto-scroll for this long (docs §5). */
export const MANUAL_SCROLL_PAUSE_MS = 5000;

export interface WindowRendererOptions {
  container: HTMLElement;
  model: ScoreModel;
  musicXml: string;
  layout?: ScoreLayout;
  barsPerWindow?: number;
  zoom?: number;
  handsFocus?: HandsFocus;
  /** Advance by half a window so the learner always sees ahead (docs §5). */
  halfWindowScrolling?: boolean;
  drawFingerings?: boolean;
}

interface Buffer {
  view: OsmdView;
  wrapper: HTMLElement;
  /** The range currently drawn, or null when nothing has been drawn yet. */
  range: MeasureRange | null;
  /** printedNoteKey-independent: ScoreNote.id -> element, for the drawn range. */
  elements: Map<string, SVGGElement>;
}

function clampBars(bars: number): number {
  return Math.min(MAX_BARS_PER_WINDOW, Math.max(MIN_BARS_PER_WINDOW, Math.round(bars)));
}

export class WindowRenderer {
  readonly el: HTMLElement;

  private readonly model: ScoreModel;
  /** Built once: `annotate` runs on every window draw and must not re-walk the piece. */
  private readonly notesById: Map<string, ScoreNote>;
  private readonly buffers: [Buffer, Buffer];
  private readonly band: HTMLElement;
  private front = 0;
  private layout: ScoreLayout;
  private barsPerWindow: number;
  private halfWindow: boolean;
  private handsFocus: HandsFocus;
  private zoomLevel: number;
  private currentStep = -1;
  private manualScrollUntil = 0;
  private prerenderHandle: number | null = null;
  private disposed = false;

  private constructor(options: WindowRendererOptions, buffers: [Buffer, Buffer]) {
    this.model = options.model;
    this.notesById = new Map();
    for (const step of options.model.steps) {
      for (const note of step.notes) this.notesById.set(note.id, note);
    }
    this.buffers = buffers;
    this.layout = options.layout ?? 'window';
    this.barsPerWindow = clampBars(options.barsPerWindow ?? 2);
    this.halfWindow = options.halfWindowScrolling ?? false;
    this.handsFocus = options.handsFocus ?? 'both';
    this.zoomLevel = options.zoom ?? 1;

    this.el = options.container;
    this.el.classList.add('score-view');
    this.el.dataset.layout = this.layout;
    this.applyHandsClass();

    this.band = document.createElement('div');
    this.band.className = 'score-cursor';
    this.band.hidden = true;
    this.el.appendChild(this.band);

    // Manual scrolling wins for a few seconds, so a learner can look ahead
    // without the auto-scroll yanking the page back.
    this.el.addEventListener(
      'pointerdown',
      () => {
        this.manualScrollUntil = performance.now() + MANUAL_SCROLL_PAUSE_MS;
      },
      { passive: true },
    );
  }

  static async create(options: WindowRendererOptions): Promise<WindowRenderer> {
    const buffers: Buffer[] = [];
    for (const index of [0, 1]) {
      const wrapper = document.createElement('div');
      wrapper.className = 'score-buffer';
      wrapper.dataset.buffer = String(index);
      options.container.appendChild(wrapper);
      const view = new OsmdView(wrapper, {
        timingLabel: index === 0 ? 'osmd.render.front' : 'osmd.render.back',
        ...(options.drawFingerings === undefined
          ? {}
          : { drawFingerings: options.drawFingerings }),
      });
      await view.load(options.musicXml);
      view.zoom = options.zoom ?? 1;
      buffers.push({ view, wrapper, range: null, elements: new Map() });
    }
    const renderer = new WindowRenderer(options, buffers as [Buffer, Buffer]);
    renderer.updateFrontClasses();
    return renderer;
  }

  get currentLayout(): ScoreLayout {
    return this.layout;
  }

  get bars(): number {
    return this.barsPerWindow;
  }

  get zoom(): number {
    return this.zoomLevel;
  }

  get hands(): HandsFocus {
    return this.handsFocus;
  }

  /** The printed measure range on screen, or null before the first draw. */
  get currentWindow(): MeasureRange | null {
    return this.frontBuffer.range;
  }

  get stepIndex(): number {
    return this.currentStep;
  }

  private get frontBuffer(): Buffer {
    return this.front === 0 ? this.buffers[0] : this.buffers[1];
  }

  private get backBuffer(): Buffer {
    return this.front === 0 ? this.buffers[1] : this.buffers[0];
  }

  /**
   * Which printed measures a step belongs in.
   *
   * With half-window scrolling the stride is half the window, so consecutive
   * windows overlap and the learner always has the coming bar in view.
   */
  windowFor(sourceMeasureIndex: number): MeasureRange {
    const total = this.model.sourceMeasureCount;
    const stride = this.halfWindow
      ? Math.max(1, Math.floor(this.barsPerWindow / 2))
      : this.barsPerWindow;
    const start = Math.max(0, Math.floor(sourceMeasureIndex / stride) * stride);
    const from = Math.min(start, Math.max(0, total - 1));
    const to = Math.min(from + this.barsPerWindow - 1, Math.max(0, total - 1));
    return { fromMeasure: from, toMeasure: to };
  }

  /**
   * Moves the cursor to `stepIndex`, swapping windows when it leaves the one
   * on screen, and pre-drawing the next window into the spare buffer.
   */
  showStep(stepIndex: number): void {
    if (this.disposed) return;
    const step = this.model.steps[stepIndex];
    if (!step) return;
    this.currentStep = stepIndex;

    if (this.layout === 'scroll') {
      this.ensureScrollRender();
      this.positionBand(step);
      this.autoScrollTo(step);
      return;
    }

    const wanted = this.windowFor(step.sourceMeasureIndex);
    if (!sameRange(this.frontBuffer.range, wanted)) {
      const started = performance.now();
      const prepared = sameRange(this.backBuffer.range, wanted);
      if (prepared) {
        // The pre-rendered case: one class toggle, no layout work.
        this.swap();
      } else {
        this.drawInto(this.backBuffer, wanted);
        this.swap();
      }
      // Two labels, because they are two different budgets (`01` §6): a
      // pre-rendered swap must fit in a frame, a cold one only has to beat the
      // first-render figure. Averaging them together would hide a pre-render
      // that silently stopped happening.
      recordRenderTiming(
        prepared ? 'window.swap' : 'window.swapCold',
        performance.now() - started,
      );
    }
    this.positionBand(step);
    this.schedulePrepareNextWindow();
  }

  /** ScoreNote.id → its drawn `<g>`, for the notes of one step. */
  noteElements(stepIndex: number): Map<string, SVGGElement> {
    const step = this.model.steps[stepIndex];
    const out = new Map<string, SVGGElement>();
    if (!step) return out;
    const drawn = this.frontBuffer.elements;
    for (const note of step.notes) {
      const element = drawn.get(note.id);
      if (element) out.set(note.id, element);
    }
    return out;
  }

  /** Every drawn note in the current window, by ScoreNote.id. */
  visibleNoteElements(): ReadonlyMap<string, SVGGElement> {
    return this.frontBuffer.elements;
  }

  /**
   * Paints note states. Applied as classes on the note groups, never by
   * re-rendering, and only the notes whose state changed are touched.
   */
  setNoteStates(states: ReadonlyMap<string, NoteState>): void {
    for (const [id, element] of this.frontBuffer.elements) {
      const wanted = states.get(id);
      element.classList.toggle('is-correct', wanted === 'correct');
      element.classList.toggle('is-wrong', wanted === 'wrong');
      element.classList.toggle('is-current', wanted === 'current');
    }
  }

  clearNoteStates(): void {
    this.setNoteStates(new Map());
  }

  setBarsPerWindow(bars: number): void {
    const next = clampBars(bars);
    if (next === this.barsPerWindow) return;
    this.barsPerWindow = next;
    this.invalidate();
  }

  setHalfWindowScrolling(enabled: boolean): void {
    if (enabled === this.halfWindow) return;
    this.halfWindow = enabled;
    this.invalidate();
  }

  setZoom(zoom: number): void {
    const next = Math.min(2, Math.max(0.5, zoom));
    if (next === this.zoomLevel) return;
    this.zoomLevel = next;
    for (const buffer of this.buffers) buffer.view.zoom = next;
    this.invalidate();
  }

  setLayout(layout: ScoreLayout): void {
    if (layout === this.layout) return;
    this.layout = layout;
    this.el.dataset.layout = layout;
    this.invalidate();
  }

  setHandsFocus(hands: HandsFocus): void {
    this.handsFocus = hands;
    this.applyHandsClass();
  }

  /**
   * Forces a full redraw of the window on screen and returns how long it took
   * in milliseconds.
   *
   * Exists for measurement: `showStep` deliberately does nothing when the
   * wanted window is already drawn, so timing it would report zero and prove
   * nothing. This is the cost the < 150 ms budget in docs/01 §6 is about —
   * OSMD render, note annotation and fit, for the visible buffer.
   */
  redrawCurrentWindow(): number {
    const buffer = this.frontBuffer;
    const range = buffer.range;
    if (!range) return Number.NaN;
    buffer.range = null;
    const started = performance.now();
    this.drawInto(buffer, range);
    return performance.now() - started;
  }

  /** Re-fits the current window; call on resize or orientation change. */
  refit(): void {
    this.fit(this.frontBuffer);
  }

  dispose(): void {
    this.disposed = true;
    if (this.prerenderHandle !== null) {
      cancelAnimationFrame(this.prerenderHandle);
      this.prerenderHandle = null;
    }
    for (const buffer of this.buffers) {
      buffer.view.dispose();
      buffer.wrapper.remove();
    }
    this.band.remove();
    this.el.classList.remove('score-view');
  }

  // --- internals -----------------------------------------------------------

  /** Forces both buffers to redraw at the next showStep. */
  private invalidate(): void {
    for (const buffer of this.buffers) {
      buffer.range = null;
      buffer.elements = new Map();
    }
    if (this.currentStep >= 0) this.showStep(this.currentStep);
  }

  private ensureScrollRender(): void {
    const buffer = this.frontBuffer;
    if (buffer.range && buffer.range.fromMeasure === 0 && buffer.range.toMeasure === Infinity) {
      return;
    }
    buffer.view.clearRange();
    buffer.view.render();
    buffer.range = { fromMeasure: 0, toMeasure: Infinity };
    this.annotate(buffer);
    this.fit(buffer);
  }

  private drawInto(buffer: Buffer, range: MeasureRange): void {
    buffer.view.setRange(range);
    buffer.view.render();
    buffer.range = range;
    this.annotate(buffer);
    this.fit(buffer);
  }

  /**
   * Queues the pre-render for after the browser has painted.
   *
   * Doing it inline would put a full OSMD render (~10 ms) inside the very
   * swap it is meant to make free, which defeats the point of the second
   * buffer. One frame later the learner has already seen the new window.
   */
  private schedulePrepareNextWindow(): void {
    if (this.prerenderHandle !== null) cancelAnimationFrame(this.prerenderHandle);
    this.prerenderHandle = requestAnimationFrame(() => {
      this.prerenderHandle = null;
      if (this.disposed) return;
      this.prepareNextWindow();
    });
  }

  /**
   * Draws the window after the current one into the spare buffer, so the next
   * swap costs a class toggle. Skipped when it would be the same window.
   */
  private prepareNextWindow(): void {
    const front = this.frontBuffer.range;
    if (!front) return;
    const nextStart = front.toMeasure + 1;
    if (nextStart >= this.model.sourceMeasureCount) return;
    const next = this.windowFor(nextStart);
    if (sameRange(this.backBuffer.range, next) || sameRange(front, next)) return;
    // Timed separately from the visible render: this one is off the critical
    // path and should never be confused with the number the budget is about.
    const started = performance.now();
    this.drawInto(this.backBuffer, next);
    recordRenderTiming('osmd.prerender', performance.now() - started);
  }

  private swap(): void {
    this.front = this.front === 0 ? 1 : 0;
    this.updateFrontClasses();
  }

  private updateFrontClasses(): void {
    this.buffers.forEach((buffer, i) => {
      buffer.wrapper.classList.toggle('is-front', i === this.front);
      buffer.wrapper.setAttribute('aria-hidden', i === this.front ? 'false' : 'true');
    });
  }

  private applyHandsClass(): void {
    this.el.dataset.hands = this.handsFocus;
  }

  /**
   * Tags each drawn note with the data the overlay needs, so every later
   * update is a class toggle rather than a tree walk.
   */
  private annotate(buffer: Buffer): void {
    const elements = buffer.view.elementsForNotes([...this.notesById.values()]);
    for (const [id, element] of elements) {
      const note = this.notesById.get(id);
      if (!note) continue;
      element.classList.add('score-note');
      element.dataset.noteId = id;
      element.dataset.hand = note.hand;
      element.dataset.midi = String(note.midi);
    }
    buffer.elements = elements;
  }

  /**
   * Scales the drawn sheet to fit.
   *
   * A CSS transform rather than an OSMD zoom + re-render: it costs one style
   * write instead of tens of milliseconds, and it leaves every note element
   * identical, so the id → element map survives.
   */
  private fit(buffer: Buffer): void {
    const svg = buffer.view.svg;
    if (!svg) return;
    buffer.wrapper.style.transform = '';
    const available = this.el.getBoundingClientRect();
    if (available.width <= 0 || available.height <= 0) return;
    const box = svg.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;

    if (this.layout === 'scroll') {
      // Scroll layout fits width only; height is what the learner scrolls.
      const scale = Math.min(1, available.width / box.width);
      buffer.wrapper.style.transform = scale < 1 ? `scale(${scale})` : '';
      return;
    }
    // Landscape fits to width, portrait to height (docs §5).
    const landscape = available.width >= available.height;
    const scale = landscape
      ? Math.min(available.width / box.width, available.height / box.height)
      : Math.min(available.height / box.height, available.width / box.width);
    buffer.wrapper.style.transform = scale < 1 ? `scale(${scale})` : '';
  }

  /**
   * Puts the translucent band over the current step.
   *
   * A step with no drawn notes (a rest, or a tie continuation) borrows the
   * position of the nearest step that has one — simpler than deriving geometry
   * from OSMD's layout, and visually indistinguishable.
   */
  private positionBand(step: ScoreStep): void {
    const anchor = this.anchorElementFor(step);
    if (!anchor) {
      this.band.hidden = true;
      return;
    }
    const host = this.el.getBoundingClientRect();
    const box = anchor.getBoundingClientRect();
    this.band.hidden = false;
    this.band.style.left = `${box.left - host.left + this.el.scrollLeft - 4}px`;
    this.band.style.top = `${this.el.scrollTop}px`;
    this.band.style.width = `${Math.max(box.width + 8, 12)}px`;
    this.band.style.height = `${host.height}px`;
  }

  private anchorElementFor(step: ScoreStep): SVGGElement | undefined {
    const direct = this.firstElementOf(step);
    if (direct) return direct;
    for (let i = step.index + 1; i < this.model.steps.length; i += 1) {
      const found = this.firstElementOf(this.model.steps[i]);
      if (found) return found;
    }
    for (let i = step.index - 1; i >= 0; i -= 1) {
      const found = this.firstElementOf(this.model.steps[i]);
      if (found) return found;
    }
    return undefined;
  }

  private firstElementOf(step: ScoreStep | undefined): SVGGElement | undefined {
    if (!step) return undefined;
    for (const note of step.notes) {
      const element = this.frontBuffer.elements.get(note.id);
      if (element) return element;
    }
    return undefined;
  }

  /** Keeps the cursor between 25 % and 40 % down the viewport (docs §5). */
  private autoScrollTo(step: ScoreStep): void {
    if (performance.now() < this.manualScrollUntil) return;
    const anchor = this.anchorElementFor(step);
    if (!anchor) return;
    const host = this.el.getBoundingClientRect();
    const box = anchor.getBoundingClientRect();
    const offsetInContent = box.top - host.top + this.el.scrollTop;
    const fraction = (box.top - host.top) / host.height;
    if (fraction >= SCROLL_TARGET_MIN && fraction <= SCROLL_TARGET_MAX) return;
    this.el.scrollTo({
      top: Math.max(0, offsetInContent - host.height * SCROLL_TARGET_FRACTION),
      behavior: 'smooth',
    });
  }
}

function sameRange(a: MeasureRange | null, b: MeasureRange | null): boolean {
  if (!a || !b) return false;
  return a.fromMeasure === b.fromMeasure && a.toMeasure === b.toMeasure;
}
