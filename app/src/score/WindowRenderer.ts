// Windowed and scrolling notation rendering.
//
// The Score screen shows a small window of bars that advances as the learner
// plays (docs/04-ui-spec.md §5). Two things make that feel right on a phone,
// and both are why this class exists rather than a bare OsmdView:
//
//  * **Two slots.** Upright the stage holds two systems, and they are two
//    independent OsmdViews rather than one window engraved together. The slot
//    the cursor is in is never re-drawn; the other shows what comes next, and
//    is replaced the moment the cursor crosses into the one below. The eye
//    goes top, bottom, top — the arrangement karaoke uses — and the coming bar
//    has been on the screen for a whole bar by the time it is played (P21c
//    §A1). Sideways there is one system and no alternation.
//
//    It replaced a front/back double buffer that swapped the *whole* stage,
//    which moved the bar being played from the lower system to the upper one
//    mid-phrase every other bar. Re-rendering OSMD costs tens of milliseconds
//    and the budget for a swap is one frame (docs/01 §6); a slot swap pays it
//    while the eye is on the other slot, which is a whole bar rather than a
//    frame, so it can afford a real render.
//
//    Sideways there is one system, and there the double buffer is still what
//    it was: the second view is spare, the next window is drawn into it a
//    frame after each swap, and advancing is a class toggle. A swap is the
//    thing the learner is waiting on there, because nothing else is on screen
//    to be reading while it happens.
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
import { planSlots, sameRange as sameSlotRange, type SlotIndex } from './slots';
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
  const x = -box.x * scale + FIT_INSET_PX;
  const y = -box.y * scale + FIT_INSET_PX;
  return `translate(${String(x)}px, ${String(y)}px) scale(${String(scale)})`;
}

/**
 * Air between the music and the edge of the stage.
 *
 * Two pixels was enough to stop a stroke being clipped and not enough to stop
 * it *reading* as clipped: the final barline sat on the stage border and the
 * brace of a grand staff looked cut in half by it. Six each side.
 */
const FIT_INSET_PX = 6;
const FIT_MARGIN_PX = FIT_INSET_PX * 2;

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
  /**
   * Which shape the read-ahead takes (P21c A1).
   *
   * `slots` is the karaoke arrangement: two systems, the one being played is
   * never re-drawn, the other shows what comes next. It needs a stage taller
   * than it is wide and a window of at least two bars to have anything to
   * alternate. `single` is one system filling the stage — sideways, and at one
   * bar per window — and is what the whole stage was before this.
   *
   * Derived from the stage box rather than passed in, so rotating the phone
   * changes it through the `ResizeObserver` that is already watching.
   */
  private readAhead: 'slots' | 'single' = 'single';
  /** In `slots`, which of the two the cursor is in; in `single`, always 0. */
  private cursorSlot: SlotIndex = 0;
  /** What each slot holds. `null` is a slot with nothing left to show. */
  private slotRanges: [MeasureRange | null, MeasureRange | null] = [null, null];
  private layout: ScoreLayout;
  private barsPerWindow: number;
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
  /** The single-system pre-render, queued for the frame after a swap. */
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
        // The drawn scale first, and always: it is a CSS transform, it costs
        // nothing, and without it the sheet keeps the size it was fitted to
        // before the stage changed. Turning the keyboard strip off gives the
        // stage 72 px and the notation simply did not grow into them — the
        // sheet only caught up the next time something else asked for a fit.
        this.updateReadAhead();
        this.fitSlots();
        // Then the engraving, which may want re-laying out at the new height.
        // `fitToStage` returns immediately when the height is the one it last
        // fitted, so an observation that changes nothing costs a comparison.
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
    renderer.updateSlotClasses();
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

  /**
   * The slot the cursor is in — what "the sheet on screen" means to everything
   * that used to ask the front buffer: the fit, the ink box, the band.
   */
  private get frontBuffer(): Buffer {
    return this.cursorSlot === 0 ? this.buffers[0] : this.buffers[1];
  }

  /** Both slots, in drawing order, skipping any that is blank. */
  private get drawnSlots(): Buffer[] {
    if (this.readAhead === 'single') {
      const front = this.buffers[this.cursorSlot];
      return front.range ? [front] : [];
    }
    return this.buffers.filter((slot) => slot.range !== null);
  }

  /**
   * Every note drawn anywhere on the screen.
   *
   * With two slots the notes on screen are the union of both, and everything
   * that paints, positions or counts them has to see all of them — a chord in
   * the slot the cursor has just moved into is as much on the screen as one in
   * the slot it left.
   */
  private get allElements(): Map<string, SVGGElement> {
    if (this.readAhead === 'single') return this.buffers[this.cursorSlot].elements;
    const out = new Map<string, SVGGElement>();
    for (const slot of this.buffers) {
      for (const [id, element] of slot.elements) out.set(id, element);
    }
    return out;
  }

  /**
   * Which printed measures a step belongs in, for the single-system layout.
   *
   * Windows tile the piece; they used to be able to overlap by half, which was
   * `halfWindowScrolling` — a setting, off by default, named after its
   * mechanism rather than its effect, and the owner never found it. Upright,
   * seeing ahead is what the two slots do and is no longer optional (P21c A3).
   */
  windowFor(sourceMeasureIndex: number): MeasureRange {
    const total = this.model.sourceMeasureCount;
    const stride = this.barsPerWindow;
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

    this.updateReadAhead();
    if (this.readAhead === 'slots') this.showStepInSlots(stepIndex);
    else this.showStepInOneSystem(step);
    this.positionBand(step);
  }

  /**
   * The karaoke arrangement (P21c A1).
   *
   * Two systems, and the one being played is never touched. When the cursor
   * crosses into the other, the slot it just left is re-drawn with the bars
   * that come after — so the eye goes top, bottom, top, and the coming bar has
   * been on the screen for a whole bar by the time it is needed.
   *
   * What it replaces: one window of two bars, replaced whole, which moved the
   * bar being played from the lower system to the upper one mid-phrase every
   * other bar. That is the jump the owner felt.
   */
  private showStepInSlots(stepIndex: number): void {
    const plan = planSlots(
      this.model.steps,
      stepIndex,
      { cursor: this.cursorSlot, ranges: this.slotRanges },
      this.barsPerWindow,
      this.model.sourceMeasureCount,
    );
    const started = performance.now();
    let drew = false;
    for (const index of [0, 1] as SlotIndex[]) {
      const slot = this.buffers[index];
      const wanted = plan.ranges[index];
      if (wanted === null) {
        if (slot.range === null) continue;
        this.blank(slot);
        drew = true;
        continue;
      }
      if (sameSlotRange(slot.range, wanted)) continue;
      this.drawInto(slot, wanted);
      // A slot that changes while the eye is on the other one fades, because
      // peripheral vision ignores a fade and notices a flash.
      if (plan.fade === index) this.fadeIn(slot);
      drew = true;
    }
    this.cursorSlot = plan.cursor;
    this.slotRanges = plan.ranges;
    this.updateSlotClasses();
    if (drew) {
      this.fitSlots();
      // Two labels, because they are two different budgets (`01` §6): the
      // crossing is the one a player feels and has to fit in a frame; a cold
      // draw is a seek and only has to beat the first-render figure.
      recordRenderTiming(
        plan.crossed ? 'window.swap' : 'window.swapCold',
        performance.now() - started,
      );
    }
  }

  /**
   * One system filling the stage: sideways, and at one bar per window.
   *
   * With only one slot on the screen the other is spare, so this keeps the
   * double buffer it always had — the next window drawn into the spare while
   * the current one is being played, and advancing is a class toggle inside
   * one frame. Slots do not need it (a crossing has a whole bar to happen in),
   * but here a swap is still the thing the learner is waiting on.
   */
  private showStepInOneSystem(step: ScoreStep): void {
    const wanted = this.windowFor(step.sourceMeasureIndex);
    const front = this.buffers[this.cursorSlot];
    if (!sameRange(front.range, wanted)) {
      const started = performance.now();
      const spare = this.buffers[this.cursorSlot === 0 ? 1 : 0];
      const prepared = sameRange(spare.range, wanted);
      if (prepared) {
        this.cursorSlot = this.cursorSlot === 0 ? 1 : 0;
      } else {
        // Nothing was prepared, so draw in place. Drawing into the spare and
        // swapping costs the same render and leaves the old front holding the
        // window just drawn — every note of it in the DOM twice, counted twice
        // and painted twice.
        this.drawInto(front, wanted);
      }
      this.slotRanges = this.cursorSlot === 0 ? [wanted, spare.range] : [spare.range, wanted];
      this.updateSlotClasses();
      this.fitSlots();
      // Two labels, because they are two different budgets (`01` §6): a
      // pre-rendered swap must fit in a frame, a cold one only has to beat the
      // first-render figure. Averaging them would hide a pre-render that had
      // silently stopped happening.
      recordRenderTiming(
        prepared ? 'window.swap' : 'window.swapCold',
        performance.now() - started,
      );
    }
    this.schedulePrepareNextWindow();
  }

  /**
   * Queues the single-system pre-render for after the browser has painted.
   *
   * Inline it would put a full OSMD render inside the very swap it exists to
   * make free. One frame later the learner has already seen the new window.
   */
  private schedulePrepareNextWindow(): void {
    if (this.prerenderHandle !== null) cancelAnimationFrame(this.prerenderHandle);
    this.prerenderHandle = requestAnimationFrame(() => {
      this.prerenderHandle = null;
      if (this.disposed || this.readAhead !== 'single') return;
      const front = this.buffers[this.cursorSlot].range;
      if (!front) return;
      const nextStart = front.toMeasure + 1;
      if (nextStart >= this.model.sourceMeasureCount) return;
      const next = this.windowFor(nextStart);
      const spare = this.buffers[this.cursorSlot === 0 ? 1 : 0];
      if (sameRange(spare.range, next) || sameRange(front, next)) return;
      // Off the critical path, and timed apart from the number the budget is
      // about so the two are never averaged together.
      const started = performance.now();
      this.drawInto(spare, next);
      recordRenderTiming('osmd.prerender', performance.now() - started);
    });
  }

  /**
   * Which arrangement the stage can hold, from the stage itself.
   *
   * Upright there is room for two systems and something to alternate; sideways
   * there is one system and A2's slide instead. A window of one bar has no
   * halves, so it is one system too. Reading the box rather than being told
   * means rotating the phone changes it through the `ResizeObserver` that is
   * already watching for the fit.
   */
  private updateReadAhead(): void {
    // The viewport, not the stage box. "Upright" is a fact about the phone,
    // and the stage is not always shaped like it: the dev renderer screen
    // gives its stage a fixed height inside a wide window, so reading the box
    // there called a landscape screen upright.
    const upright =
      typeof window === 'undefined' ? true : window.innerHeight > window.innerWidth;
    const next: 'slots' | 'single' = upright && this.barsPerWindow >= 2 ? 'slots' : 'single';
    // Written every time, not only on a change: the field starts at
    // `single`, so a stage that is sideways from the first step never wrote
    // the attribute at all and the stylesheet had nothing to match.
    this.el.dataset.readAhead = next;
    if (next === this.readAhead) return;
    this.readAhead = next;
    // Everything drawn belonged to the other arrangement.
    this.slotRanges = [null, null];
    this.cursorSlot = 0;
    for (const slot of this.buffers) {
      slot.range = null;
      slot.elements = new Map();
      slot.wrapper.hidden = false;
    }
  }

  private blank(slot: Buffer): void {
    slot.range = null;
    slot.elements = new Map();
    slot.wrapper.hidden = true;
  }

  private fadeIn(slot: Buffer): void {
    slot.wrapper.classList.remove('is-fading');
    // Reading `offsetWidth` restarts the animation: without it, re-adding a
    // class the element already had in this frame does nothing at all.
    void slot.wrapper.offsetWidth;
    slot.wrapper.classList.add('is-fading');
  }

  /** ScoreNote.id → its drawn `<g>`, for the notes of one step. */
  noteElements(stepIndex: number): Map<string, SVGGElement> {
    const step = this.model.steps[stepIndex];
    const out = new Map<string, SVGGElement>();
    if (!step) return out;
    const drawn = this.allElements;
    for (const note of step.notes) {
      const element = drawn.get(note.id);
      if (element) out.set(note.id, element);
    }
    return out;
  }

  /** Every drawn note in the current window, by ScoreNote.id. */
  visibleNoteElements(): ReadonlyMap<string, SVGGElement> {
    return this.allElements;
  }

  /**
   * Paints note states. Applied as classes on the note groups, never by
   * re-rendering, and only the notes whose state changed are touched.
   */
  setNoteStates(states: ReadonlyMap<string, NoteState>): void {
    for (const [id, element] of this.allElements) {
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

  /**
   * The owner's own zoom, as a multiplier on the fitted size.
   *
   * It used to be the absolute zoom handed to OSMD, which stopped meaning
   * anything the moment the sheet was fitted to the screen: a bigger engraving
   * simply got scaled back down to the same box. As a multiplier, 1.0 is
   * "whatever fills the screen" and the buttons still do what they look like.
   */
  /**
   * Size, as a multiplier on the fitted sheet.
   *
   * It does **not** re-engrave. The engraving answers one question — what is
   * the largest window that fits the stage — and this answers another: how big
   * the owner wants it drawn. Mixing them made the buttons non-monotonic: a
   * click down re-engraved smaller, the fit search climbed back to a different
   * engraving whose ink had a different shape, and one press of "smaller" came
   * out three pixels larger than before it.
   */
  setZoom(zoom: number): void {
    const next = Math.min(2, Math.max(0.5, zoom));
    if (next === this.userZoom) return;
    this.userZoom = next;
    this.fitSlots();
  }

  /** The last zoom the sheet was fitted at, before the owner's multiplier. */
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

  /**
   * Where the drawn music is on the screen, in viewport pixels.
   *
   * Not the SVG element's box: that is the *page* OSMD laid the window out on,
   * which is the full width of the container and taller than the ink, and
   * since the fit anchors the ink's top-left in the stage's the page now hangs
   * off the right on purpose. Anything asking "how much room is the music
   * taking" has to ask about the ink — the control bar's auto-hide asked the
   * element and concluded the music reached the bottom of the stage when it
   * did not.
   *
   * Falls back to the element's own box when the ink cannot be measured, which
   * is the same thing the fit does.
   */
  inkRect(): { top: number; bottom: number; left: number; right: number } | null {
    const svg = this.frontBuffer.view.svg;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const ink = inkBox(svg);
    const engraved = engravedSize(svg);
    if (!ink || !engraved || !(engraved.width > 0) || !(rect.width > 0)) {
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    }
    // What the wrapper's transform did to it. The element's own box already
    // carries that scale, so the ratio recovers it without reading the style.
    const scale = rect.width / engraved.width;
    const left = rect.left + ink.x * scale;
    const top = rect.top + ink.y * scale;
    return {
      left,
      top,
      right: left + ink.width * scale,
      bottom: top + ink.height * scale,
    };
  }

  /** Re-fits the current window; call on resize or orientation change. */
  refit(): void {
    this.updateReadAhead();
    this.fitSlots();
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
    buffer.wrapper.hidden = false;
    this.annotate(buffer);
  }

  /**
   * One scale for both slots (P21c A1).
   *
   * The two slots are engraved separately, so they have separate ink boxes —
   * a bar of semiquavers is wider than a bar of minims. Fitting each to its
   * own half of the stage would therefore draw one of them larger than the
   * other, and a piece whose bar 3 is bigger than its bar 4 reads worse than
   * the jump this whole change is removing.
   *
   * So: work out what each slot would need, take the smaller, and give it to
   * both. They already share one OSMD zoom, so the glyphs are the same size to
   * begin with; this only stops the CSS scale pulling them apart. Neither can
   * overflow, because the scale is the one that fits the tighter of the two.
   */
  private fitSlots(): void {
    const slots = this.drawnSlots;
    if (slots.length === 0) return;
    const available = this.el.getBoundingClientRect();
    if (available.width <= 0 || available.height <= 0) return;

    const boxes: { slot: Buffer; box: { x: number; y: number; width: number; height: number } }[] =
      [];
    for (const slot of slots) {
      const svg = slot.view.svg;
      if (!svg) continue;
      slot.wrapper.style.transform = '';
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      boxes.push({
        slot,
        box: inkBox(svg) ?? { x: 0, y: 0, width: rect.width, height: rect.height },
      });
    }
    if (boxes.length === 0) return;

    // Each slot gets its share of the height, and all of the width.
    const perSlot = available.height / boxes.length;
    let scale = Infinity;
    for (const { box } of boxes) {
      scale = Math.min(
        scale,
        (available.width - FIT_MARGIN_PX) / box.width,
        (perSlot - FIT_MARGIN_PX) / box.height,
      );
    }
    if (!Number.isFinite(scale) || scale <= 0) return;
    const drawn = scale * this.userZoom;
    for (const { slot, box } of boxes) slot.wrapper.style.transform = place(box, drawn);
  }

  /**
   * Which slots are on the screen, and which one the cursor is in.
   *
   * `is-front` used to mean "the visible one of two buffers". With slots both
   * are visible, so it means "drawn" — the class every stylesheet and test
   * already uses to find the sheet keeps finding it. `is-cursor` is the new
   * distinction, and it is what the band and the fit follow.
   */
  private updateSlotClasses(): void {
    this.buffers.forEach((slot, i) => {
      const drawn = this.readAhead === 'single' ? i === this.cursorSlot : slot.range !== null;
      slot.wrapper.classList.toggle('is-front', drawn);
      slot.wrapper.classList.toggle('is-cursor', drawn && i === this.cursorSlot);
      slot.wrapper.dataset.slot = String(i);
      slot.wrapper.setAttribute('aria-hidden', drawn ? 'false' : 'true');
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
    const stage = this.el.getBoundingClientRect();
    // A slot gets its share of the stage, not all of it. Engraving each one
    // against the full height grows it to twice what it can be drawn at, and
    // the CSS scale then halves it again — two renders to arrive where one
    // would have, at a stave thinner than the engraver intended.
    const available = {
      width: stage.width,
      height: this.readAhead === 'slots' ? stage.height / 2 : stage.height,
    };
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
    // No `userZoom` here. It belongs to the *drawn* size and is applied once,
    // in `fit()`. Carried in both places it was counted twice: a click on
    // Size re-engraved smaller, the fill scaled that back up to the stage,
    // and the sheet came out very slightly larger than before the click.
    const target = fitZoom(this.zoomLevel, box, available);
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

      const next = fitZoom(this.zoomLevel, box, { height: availableHeight });
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
      const scale = Math.min(1, available.width / box.width) * this.userZoom;
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
    const fill = Math.min(
      (available.width - FIT_MARGIN_PX) / box.width,
      (available.height - FIT_MARGIN_PX) / box.height,
    );
    // Times what the owner asked for. Filling the stage on its own *cancels*
    // the Size control: the engraving search already carries `userZoom`, so a
    // smaller engraving was simply scaled back up to fill and the buttons did
    // nothing. One means "as large as fits", and the buttons move around it.
    buffer.wrapper.style.transform = place(box, fill * this.userZoom);
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
      const element = this.allElements.get(note.id);
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
