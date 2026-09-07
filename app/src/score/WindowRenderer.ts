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
import { MAX_FIT, MIN_FIT, fitZoom, worthRefitting } from './autoFit';
import type { ScoreModel, ScoreNote, ScoreStep } from './types';
import { recordRenderTiming } from '../util/renderTiming';

export type ScoreLayout = 'window' | 'scroll';
export type HandsFocus = 'R' | 'L' | 'both';
/**
 * How a note is drawn.
 *
 * `uncertain` is the microphone's "probably wrong" (`05` §11.1, `04` §5). The
 * mic is score-informed pitch detection, not transcription: below the
 * confidence floor it can tell you it did not hear what it expected, and it
 * cannot tell you that you played the wrong note. Painting that red would be
 * the app blaming the learner for its own microphone; painting it nothing at
 * all — which is what it did until P18 — leaves a run with no feedback and no
 * explanation. Amber says the honest thing: *this may be wrong, or I may not
 * have heard it.*
 */
export type NoteState = 'correct' | 'wrong' | 'current' | 'uncertain';

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

/**
 * What OSMD engraved, in CSS pixels, before any transform this class applied.
 *
 * `null` when the attributes are missing or unreadable, so the caller can
 * fall back to measuring rather than guess.
 */
function engravedSize(svg: SVGElement): { width: number; height: number } | null {
  const width = Number.parseFloat(svg.getAttribute('width') ?? '');
  const height = Number.parseFloat(svg.getAttribute('height') ?? '');
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * The **ink**, in CSS pixels: what OSMD drew, not the page it drew it on.
 *
 * The two are very different sideways. OSMD lays the window out on a page the
 * full width of the container and then inks the left part of it — measured on
 * a 780 px phone: a 778 px page carrying 478 px of music, so 39% of the box is
 * the engraver's own right margin. Fitting to the box therefore concluded the
 * sheet already filled the width and stopped growing, and the notation ended
 * up with about a fifth of the screen.
 *
 * `getBBox()` is one call and gives exactly the drawn extent, in the SVG's own
 * user units; the width attribute against the viewBox converts it to pixels.
 * It throws in some browsers on an element that is not rendered, hence the
 * caller's fallback to the element's own box.
 */
function inkBox(svg: SVGElement): { x: number; y: number; width: number; height: number } | null {
  if (!(svg instanceof SVGSVGElement)) return null;
  const engraved = engravedSize(svg);
  if (!engraved) return null;
  const view = svg.viewBox.baseVal;
  const unit = view && view.width > 0 ? engraved.width / view.width : 1;
  let box: DOMRect;
  try {
    box = svg.getBBox();
  } catch {
    return null;
  }
  if (!(box.width > 0 && box.height > 0)) return null;
  return {
    x: box.x * unit,
    y: box.y * unit,
    width: box.width * unit,
    height: box.height * unit,
  };
}

/**
 * The transform that puts a box's top-left corner in the stage's, at `scale`.
 *
 * The translate is what makes fitting to the ink safe. Scaling alone scales
 * the engraver's left margin too, so a sheet grown to fill the width would run
 * off the right edge by exactly that margin.
 */
function place(box: { x: number; y: number }, scale: number): string {
  const moved = box.x !== 0 || box.y !== 0;
  if (scale === 1 && !moved) return '';
  const x = -box.x * scale;
  const y = -box.y * scale;
  return `translate(${String(x)}px, ${String(y)}px) scale(${String(scale)})`;
}

/** Kept clear of the stage edges, so a stroke width cannot be clipped. */
const FIT_MARGIN_PX = 2;

/** How many engravings the fit will try before settling. Each is a render. */
const FIT_STEPS = 4;

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
  /** What the owner asked for; the drawn zoom is this times the fit. */
  private userZoom: number;
  /** Guards the one extra render a fit costs against becoming a loop. */
  private fitting = false;
  private fitHandle: number | null = null;
  /** The stage height the sheet was last fitted to; -1 means never. */
  private fittedAtHeight = -1;
  private currentStep = -1;
  private manualScrollUntil = 0;
  private prerenderHandle: number | null = null;
  /** Watches the stage, because its height settles after the first draw. */
  private stageObserver: ResizeObserver | null = null;
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
    this.userZoom = options.zoom ?? 1;
    // Starts at the owner's number and becomes the fitted one on the first
    // draw, once there is a rendered sheet to measure.
    this.zoomLevel = this.userZoom;

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

    // The stage does not have its final height when the score loads: the
    // keyboard strip is built afterwards and the control bar measures itself
    // into `--score-bar-h` a frame later, and both take height off the stage.
    // Fitting once against whatever it happened to be gave two different
    // engravings from the same code on the same screen — sideways it settled
    // at 41% of the width one run and 98% the next. Watching the box means the
    // fit answers the height the stage *ends up* being.
    if (typeof ResizeObserver !== 'undefined') {
      this.stageObserver = new ResizeObserver(() => {
        if (this.disposed || this.fitting) return;
        // `fitToStage` already returns immediately when the height is the one
        // it last fitted, so an observation that changes nothing costs a
        // rounded comparison.
        this.fitToStage();
      });
      this.stageObserver.observe(this.el);
    }
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
        // Nothing was prepared, so draw in place. Drawing into the spare
        // buffer and swapping costs the same render and leaves the *old*
        // front holding the window that was just drawn — every note of it in
        // the DOM twice, counted twice and painted twice. The spare buffer
        // earns its keep on the prepared path above; on this one it only
        // duplicates. Synchronous, so there is no paint between the clear and
        // the draw.
        this.drawInto(this.frontBuffer, wanted);
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
      element.classList.toggle('is-uncertain', wanted === 'uncertain');
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

  /**
   * The owner's own zoom, as a multiplier on the fitted size.
   *
   * It used to be the absolute zoom handed to OSMD, which stopped meaning
   * anything the moment the sheet was fitted to the screen: a bigger engraving
   * simply got scaled back down to the same box. As a multiplier, 1.0 is
   * "whatever fills the screen" and the buttons still do what they look like.
   */
  setZoom(zoom: number): void {
    const next = Math.min(2, Math.max(0.5, zoom));
    if (next === this.userZoom) return;
    // The fitted base has to be read *before* the new multiplier is stored:
    // `fittedZoom` divides by `userZoom`, so reading it afterwards divides by
    // the very number about to be multiplied back in, and the zoom buttons do
    // nothing at all. They did nothing at all.
    const base = this.fittedZoom();
    this.userZoom = next;
    this.fittedAtHeight = -1;
    this.applyZoom(base * next);
  }

  /** The last zoom the sheet was fitted at, before the owner's multiplier. */
  private fittedZoom(): number {
    return this.userZoom > 0 ? this.zoomLevel / this.userZoom : this.zoomLevel;
  }

  private applyZoom(next: number): void {
    const clamped = Math.min(MAX_FIT, Math.max(MIN_FIT, next));
    if (clamped === this.zoomLevel) return;
    this.zoomLevel = clamped;
    for (const buffer of this.buffers) buffer.view.zoom = clamped;
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
    // The box changed, so the fit is stale by definition.
    this.fittedAtHeight = -1;
    this.fitToStage();
  }

  dispose(): void {
    this.disposed = true;
    this.stageObserver?.disconnect();
    this.stageObserver = null;
    if (this.prerenderHandle !== null) {
      cancelAnimationFrame(this.prerenderHandle);
      this.prerenderHandle = null;
    }
    if (this.fitHandle !== null) {
      cancelAnimationFrame(this.fitHandle);
      this.fitHandle = null;
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
  /**
   * Grows the engraving until the window fills the height (`autoFit.ts`).
   *
   * Scheduled rather than immediate, and for the same reason the pre-render
   * is: this is called from inside a draw, and re-entering the draw from
   * within itself leaves the buffers half-written — the first attempt did
   * exactly that and rendered nothing at all. So it measures now and redraws
   * after the browser has painted, once, guarded by `fitting` so the redraw it
   * causes cannot ask for another.
   */
  /**
   * Grows the engraving until the window fills the height (`autoFit.ts`).
   *
   * Called by the screen at the two moments it is safe — once the score has
   * loaded, and after a resize — and never from inside a draw. It was fired
   * from every draw at first, and that is wrong twice over: re-entering the
   * draw from within itself leaves the buffers half-written, and the redraw it
   * causes *recreates every note element*, which is precisely what
   * `score.spec.ts`'s "painted by class, not by re-rendering" exists to
   * forbid. During a run the session would repaint and the learner would see a
   * flicker for nothing.
   */
  fitToStage(): void {
    const buffer = this.frontBuffer;
    if (this.fitting || this.layout === 'scroll' || this.disposed) return;
    const svg = buffer.view.svg;
    if (!svg) return;
    const available = this.el.getBoundingClientRect();
    // Once per stage size. Without this the fit is re-examined on every window
    // swap — which converges, because the zoom is clamped, but converging is
    // not the same as being free, and a swap is meant to cost a class toggle.
    if (this.fittedAtHeight === Math.round(available.height)) return;
    // The engraved size, not the size on screen.
    //
    // `fit()` has already put a CSS `scale()` on the wrapper, and
    // `getBoundingClientRect` reports the scaled box — so this measured a
    // sheet that had just been shrunk to fit, concluded it fitted, and left
    // the engraving alone. On the S25 sideways that meant a window engraved
    // at zoom 2 into a 389-unit page, drawn 778 px wide, then scaled to 0.42
    // to make its height fit. Re-engraving at the smaller zoom gives the page
    // more than twice the units, which is what lets the engraver put both
    // bars on one line and stretch it across the screen.
    //
    // The `width`/`height` attributes are what OSMD wrote, before any
    // transform of ours.
    const box = engravedSize(svg) ?? svg.getBoundingClientRect();
    const target = fitZoom(this.zoomLevel, box, available) * this.userZoom;
    if (!worthRefitting(this.zoomLevel, target)) return;
    if (this.fitHandle !== null) cancelAnimationFrame(this.fitHandle);
    this.fitHandle = requestAnimationFrame(() => {
      this.fitHandle = null;
      if (this.disposed || this.fitting) return;
      this.fitting = true;
      try {
        this.searchForFit(available.height);
        this.fittedAtHeight = Math.round(available.height);
      } finally {
        this.fitting = false;
      }
    });
  }

  /**
   * The largest engraving that still fits the height.
   *
   * A search rather than one division, because the two are not the same
   * question. Changing the zoom changes the width of the *page* the engraver
   * lays out on, so it can change how many systems the window takes — and the
   * height with it. On the S25 sideways, halving the zoom put both bars on one
   * line and the sheet became half as tall, leaving room the single division
   * had no way to go back for. Nudging the other way puts them back on two
   * lines and it is too tall again. There is no fixed point to divide towards.
   *
   * So: try a few zooms, keep the tallest engraving that fits, and settle
   * there. Bounded hard, because every step is a real OSMD render — and it
   * runs only when the stage changes size, never on a window swap.
   */
  private searchForFit(availableHeight: number): void {
    if (!(availableHeight > 0)) return;
    let bestZoom = this.zoomLevel;
    let bestHeight = 0;
    const tried = new Set<number>();

    for (let step = 0; step < FIT_STEPS; step += 1) {
      const svg = this.frontBuffer.view.svg;
      const box = svg ? (engravedSize(svg) ?? svg.getBoundingClientRect()) : null;
      if (!box || !(box.height > 0)) break;

      // The tallest that fits wins; among those that do not fit, none does.
      if (box.height <= availableHeight && box.height > bestHeight) {
        bestHeight = box.height;
        bestZoom = this.zoomLevel;
      }
      tried.add(this.zoomLevel);

      const next = fitZoom(this.zoomLevel, box, { height: availableHeight }) * this.userZoom;
      // Settled, or somewhere we have already been — which is the oscillation
      // between one system and two, and the reason this keeps the best rather
      // than the last.
      if (!worthRefitting(this.zoomLevel, next) || tried.has(next)) break;
      this.applyZoom(next);
    }

    if (bestHeight > 0 && bestZoom !== this.zoomLevel) this.applyZoom(bestZoom);
  }

  private fit(buffer: Buffer): void {
    const svg = buffer.view.svg;
    if (!svg) return;
    buffer.wrapper.style.transform = '';
    const available = this.el.getBoundingClientRect();
    if (available.width <= 0 || available.height <= 0) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    // The ink, not the page it was drawn on. Fitting to the page is what left
    // the notation with a fifth of the screen sideways: the page is the full
    // width of the container by construction, so `available.width / page.width`
    // is always 1 and the sheet never grew, however much of the page was the
    // engraver's own empty right margin.
    const box = inkBox(svg) ?? { x: 0, y: 0, width: rect.width, height: rect.height };

    if (this.layout === 'scroll') {
      // Scroll layout fits width only; height is what the learner scrolls.
      const scale = Math.min(1, available.width / box.width);
      buffer.wrapper.style.transform = place(box, scale);
      return;
    }
    // Whichever axis runs out first. It grows as well as shrinks: the engraver
    // stops responding to zoom at 2 (`autoFit.MAX_FIT`), and up to that point
    // the sheet was simply left small with the leftover screen black. Because
    // it is the smaller of the two ratios, filling one axis can never overflow
    // the other.
    // A pixel off each axis: the ink box is measured to a fraction and a
    // stave line has a stroke width, so filling the stage exactly clipped the
    // final barline by about a pixel.
    const scale = Math.min(
      (available.width - FIT_MARGIN_PX) / box.width,
      (available.height - FIT_MARGIN_PX) / box.height,
    );
    buffer.wrapper.style.transform = place(box, scale);
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
    this.band.style.width = `${Math.max(box.width + 8, 12)}px`;

    // The height of the *stave the note is on*, not of the whole stage.
    //
    // It used to be `host.height`, which on a phone drew a full-height blue
    // stripe straight through every system on the screen, the title, the
    // chord symbols and — in landscape, where the control bar overlaps the
    // stage — the buttons as well. It reads as a rendering fault rather than
    // as a cursor. A stave is what the note is in, so a stave is what gets
    // marked; a little padding above and below keeps ledger lines and stems
    // inside it.
    const system = anchor.closest('.staffline');
    const line = system?.getBoundingClientRect();
    const pad = 12;
    if (line && line.height > 0) {
      this.band.style.top = `${line.top - host.top + this.el.scrollTop - pad}px`;
      this.band.style.height = `${line.height + pad * 2}px`;
    } else {
      // No stave to be found — a rest before anything is drawn. Fall back to
      // the note's own box rather than to the whole screen.
      this.band.style.top = `${box.top - host.top + this.el.scrollTop - pad}px`;
      this.band.style.height = `${box.height + pad * 2}px`;
    }
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
