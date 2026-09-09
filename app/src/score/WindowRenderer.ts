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
import { barsPerSlot, planSlots, sameRange as sameSlotRange, type SlotIndex } from './slots';
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

/**
 * Where the cursor sits while the sheet slides under it, sideways (P21c A2).
 *
 * A third of the way across, so about two bars of what is coming stay to its
 * right. The same fraction the scroll layout holds vertically, for the same
 * reason: reading happens ahead of playing.
 */
const SLIDE_TARGET_FRACTION = 0.34;
export const SLIDE_TARGET_MIN = 0.25;
export const SLIDE_TARGET_MAX = 0.45;

/** Bars of read-ahead drawn to the right of the window, sideways. */
const SLIDE_READ_AHEAD_BARS = 2;

/**
 * Bars drawn to the *left* of the window, sideways (P21e A3).
 *
 * Without them a fresh chunk starts at the bar being played, so every swap
 * lands the cursor on the left edge of the stage — measured at 11 % of the
 * width — and the slide has nothing to pull it back to a third with. Two bars
 * behind means the bar being played is never the first bar drawn, the slide
 * can hold it at a third from the first note of a chunk, and the swap itself
 * is invisible: the same bars sit at the same places on both sheets.
 */
const SLIDE_BEHIND_BARS = 2;

/**
 * How long the slot the cursor left may wait to be re-drawn.
 *
 * It is re-drawn on idle time, so a second note arriving on the heels of the
 * first is coloured before the engraving starts rather than behind it; and
 * no later than this, so the bar after next is on the screen long before it
 * is wanted — a bar is hundreds of milliseconds at any tempo.
 */
const SETTLE_TIMEOUT_MS = 100;

/** A frozen run keeps its scale while the fit would shrink it by less than this. */
const FROZEN_OVERFLOW = 0.9;

/**
 * The most slots a stage holds (`08` §3.2, §4.1).
 *
 * Upright the width limits the size — one bar with a clef is as wide as a
 * phone — and the height that is left over buys more systems rather than
 * bigger ones: four on the owner's phone, where two used 42 % of the stage
 * and left the rest black. Each slot is an engraver of its own, loaded with
 * the piece, so the count is bounded; and a piece longer than the probe's
 * cap keeps two, because loading a 780-bar score four times is seconds a
 * throttled phone does not have.
 */
const MAX_SLOTS = 4;

/**
 * Between the two systems when they are packed (`08` §4.1).
 *
 * Upright on a phone the fit is limited by the width, not the height: one
 * bar with a clef is as wide as the screen. The two systems then used a
 * third of their half of the stage each and sat 500 px apart, black between
 * and below them. A page puts its systems close together and leaves the
 * spare space at the bottom; so does this, when there is spare space.
 */
const SLOT_GAP_PX = 24;

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
  /**
   * Whether the engraver prints `♩ = 96` above the first system.
   *
   * The score screen's bar already says the bpm, and the mark is the tallest
   * thing above a stave: with it, the first window's ink was 45 px taller than
   * every other window's, and the fit paid for that in every one of them.
   */
  drawMetronomeMarks?: boolean;
  /** Whether the words are drawn under the notes (`08` §3.4.1: not on the score screen). */
  drawLyrics?: boolean;
}

interface Buffer {
  view: OsmdView;
  wrapper: HTMLElement;
  /** The range currently drawn, or null when nothing has been drawn yet. */
  range: MeasureRange | null;
  /**
   * The stage height and scale this sheet was last fitted for.
   *
   * A pre-rendered spare is fitted off the critical path and brought forward
   * as a class toggle — and if the stage changed height in between (a run
   * starting takes the bar's row) it came forward at the size of the stage
   * it was fitted to. Measured: 1.021 for the front sheet, 0.881 for the spare
   * it swapped to, 1.021 for the next. So a swap checks this and refits
   * once when it is stale, which is a transform write, not a render.
   */
  fittedFor?: { height: number; scale: number };
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

/** How much of a piece the probe engraves to measure it (P21e A2). */
const PROBE_MAX_BARS = 48;

/** A viewport at least this tall holds two systems sideways as well as upright. */
const TWO_SYSTEMS_MIN_PX = 600;

function clampBars(bars: number): number {
  return Math.min(MAX_BARS_PER_WINDOW, Math.max(MIN_BARS_PER_WINDOW, Math.round(bars)));
}

export class WindowRenderer {
  readonly el: HTMLElement;

  private readonly model: ScoreModel;
  /** Built once: `annotate` runs on every window draw and must not re-walk the piece. */
  private readonly notesById: Map<string, ScoreNote>;
  private readonly buffers: Buffer[];
  private readonly band: HTMLElement;
  /**
   * A second, fainter band on the step after this one (P21c A4).
   *
   * Only in the clock-driven modes. Tempo and Listen move whether or not the
   * learner is ready, so the eye needs somewhere to go before the clock gets
   * there; Wait mode has no clock and nothing to warn about, and a band on a
   * note nobody is going to reach yet would be telling a beginner to hurry.
   */
  private readonly nextBand: HTMLElement;
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
  /** How many slots the arrangement is using; 1 sideways, 2 or more upright. */
  private slotCount = 2;
  /** What each slot holds. `null` is a slot with nothing left to show. */
  private slotRanges: (MeasureRange | null)[] = [null, null];
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
  /** The loop's bars, by source measure index; the rest are dimmed. */
  private loopRange: { from: number; to: number } | null = null;
  /** The step the warning mark is on, so a refit can put it back. */
  private nextStep: number | null = null;
  /** The idle callback (or its timer) in which the slot the cursor left is re-drawn. */
  private settleHandle: { kind: 'idle' | 'timer'; id: number } | null = null;
  /** The stage height at the last fit; -1 before any. Saves the swap a layout. */
  private stageHeight = -1;
  private manualScrollUntil = 0;
  /** Bumped whenever a slot is drawn or blanked, so the merge can cache. */
  private drawVersion = 0;
  private merged: Map<string, SVGGElement> | null = null;
  private mergedFor = -1;
  /** How far the sheet has been slid left, sideways (P21c A2). */
  private slideX = 0;
  /** The bar the slide was last computed for; a slide happens once a bar. */
  private slidBar = -1;
  /** The fit transform, before any slide is added to it. */
  private baseTransform = '';
  /**
   * A third engraver that is never shown: it draws the whole piece once, so
   * the fit can be to the *tallest window in the piece* rather than to
   * whichever bars happen to be on the screen (P21e A2).
   *
   * That was the size jump: the scale was recomputed from the slots' own ink
   * on every swap, so a bar with a ledger line was engraved smaller than a
   * bar without one and the staff grew and shrank under the player's eyes —
   * 272, 334, 294 px across three windows of the same eight-bar song. One
   * measurement of the piece, one scale for the run.
   */
  private probe: OsmdView | null = null;
  /** The MusicXML, kept so the probe can load it lazily. */
  private probeSource = '';
  private probeLoading = false;
  /** What the probe measured, at `pieceInkZoom`; null until it has run. */
  private pieceInk: PieceInk | null = null;
  private pieceInkZoom = -1;
  private measureHandle: number | null = null;
  /**
   * The fallback while the probe has not run yet, and if it never can: the
   * tallest and widest ink seen at this zoom. Held, never released, so the
   * sheet can only ever get smaller during a run — and only until the probe
   * has measured, which is one frame after the first draw.
   */
  private held: { height: number; width: number; above: number; zoom: number } = {
    height: 0,
    width: 0,
    above: 0,
    zoom: -1,
  };
  /**
   * The size the run started at, held until it ends (P21e A2).
   *
   * The probe's measurement arrives on idle time, and on a busy phone that
   * can be three bars into a run; applying it then is the size change this
   * whole mechanism exists to remove, arriving late. So a run freezes the
   * scale and the stave placement it began with: the measurement, if it
   * comes later, is applied at the next fit — the next run, or a resize. A
   * later bar taller than anything seen can still *shrink* it; nothing grows.
   */
  private frozen: { scale: number; piece: PieceInk | null } | null = null;
  private freezeHandle: number | null = null;
  /** The single-system pre-render, queued for the frame after a swap. */
  private prerenderHandle: number | null = null;
  /** Watches the stage, because its height settles after the first draw. */
  private stageObserver: ResizeObserver | null = null;
  private disposed = false;

  private constructor(options: WindowRendererOptions, buffers: Buffer[]) {
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

    this.nextBand = document.createElement('div');
    this.nextBand.className = 'score-cursor score-cursor--next';
    this.nextBand.hidden = true;
    this.el.appendChild(this.nextBand);

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
        this.stageHeight = -1;
        // The drawn scale first, and always: it is a CSS transform, it costs
        // nothing, and without it the sheet keeps the size it was fitted to
        // before the stage changed. Turning the keyboard strip off gives the
        // stage 72 px and the notation simply did not grow into them — the
        // sheet only caught up the next time something else asked for a fit.
        this.stageChanged();
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
    const views = options.model.sourceMeasureCount > PROBE_MAX_BARS ? 2 : MAX_SLOTS;
    for (let index = 0; index < views; index += 1) {
      const wrapper = document.createElement('div');
      wrapper.className = 'score-buffer';
      wrapper.dataset.buffer = String(index);
      options.container.appendChild(wrapper);
      const view = new OsmdView(wrapper, {
        timingLabel: index === 0 ? 'osmd.render.front' : 'osmd.render.back',
        ...(options.drawFingerings === undefined
          ? {}
          : { drawFingerings: options.drawFingerings }),
        ...(options.drawMetronomeMarks === undefined
          ? {}
          : { drawMetronomeMarks: options.drawMetronomeMarks, drawFirstTempoExpression: options.drawMetronomeMarks }),
        ...(options.drawLyrics === undefined ? {} : { drawLyrics: options.drawLyrics }),
      });
      await view.load(options.musicXml);
      view.zoom = options.zoom ?? 1;
      buffers.push({ view, wrapper, range: null, elements: new Map() });
    }
    const renderer = new WindowRenderer(options, buffers);
    renderer.slotRanges = buffers.map(() => null);
    renderer.updateSlotClasses();
    // The probe. Loaded like the slots, drawn only when the zoom changes, and
    // never visible: `.score-buffer` without `is-front` is `visibility:
    // hidden`, which is what the second slot was for years.
    const probeWrapper = document.createElement('div');
    probeWrapper.className = 'score-buffer score-probe';
    probeWrapper.setAttribute('aria-hidden', 'true');
    options.container.appendChild(probeWrapper);
    // Not loaded here: loading a 780-bar score into OSMD a third time is
    // seconds on a throttled phone, and the first window must not wait for a
    // measurement that only refines it. Loaded on idle, after the first paint.
    renderer.probe = new OsmdView(probeWrapper, {
      timingLabel: 'osmd.render.probe',
      ...(options.drawFingerings === undefined ? {} : { drawFingerings: options.drawFingerings }),
      ...(options.drawMetronomeMarks === undefined
        ? {}
        : { drawMetronomeMarks: options.drawMetronomeMarks, drawFirstTempoExpression: options.drawMetronomeMarks }),
      ...(options.drawLyrics === undefined ? {} : { drawLyrics: options.drawLyrics }),
    });
    renderer.probeSource = options.musicXml;
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

  /**
   * The window the cursor is in, or null before the first draw.
   *
   * Not the same as the range *drawn*, and the difference matters sideways:
   * there the sheet carries two extra bars to read into and slides past them
   * (P21c A2), so the drawn range is wider than the window by design. "Which
   * bars is the learner on" is the question everything asks this, and the
   * answer is the window.
   */
  get currentWindow(): MeasureRange | null {
    const drawn = this.frontBuffer.range;
    if (!drawn) return null;
    if (!this.sliding) return drawn;
    const step = this.model.steps[this.currentStep];
    return step ? this.windowFor(step.sourceMeasureIndex) : drawn;
  }

  /** What is actually engraved on screen, read-ahead bars included. */
  get drawnRange(): MeasureRange | null {
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
    return this.cursorSlot === 0 ? this.buffers[0]! : this.buffers[1]!;
  }

  /** Both slots, in drawing order, skipping any that is blank. */
  private get drawnSlots(): Buffer[] {
    if (this.readAhead === 'single') {
      const front = this.buffers[this.cursorSlot]!;
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
    if (this.readAhead === 'single') return this.buffers[this.cursorSlot]!.elements;
    // Cached, because `paint()` asks three times a frame and a piece has
    // hundreds of notes: building the merged map per read put the
    // input-to-colour budget over 30 ms, which is the number that says a
    // played note is coloured late (`01` §6).
    if (this.mergedFor === this.drawVersion && this.merged) return this.merged;
    const out = new Map<string, SVGGElement>();
    for (const slot of this.buffers) {
      for (const [id, element] of slot.elements) out.set(id, element);
    }
    this.merged = out;
    this.mergedFor = this.drawVersion;
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
    const last = Math.max(0, this.model.sourceMeasureCount - 1);
    const stride = this.barsPerWindow;
    const bar = Math.min(Math.max(0, sourceMeasureIndex), last);
    // A pickup goes with the window after it, as a slot's block does
    // (`slots.rangeAt`): the engraver cannot draw from bar 1 without it.
    const pickup = this.model.pickup === true;
    const from = pickup
      ? bar <= stride
        ? 0
        : Math.floor((bar - 1) / stride) * stride + 1
      : Math.floor(bar / stride) * stride;
    const to = pickup && from === 0 ? stride : from + stride - 1;
    return { fromMeasure: from, toMeasure: Math.min(to, last) };
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
      this.slotCount,
      this.model.pickup === true,
    );
    const started = performance.now();
    const cursor = this.buffers[plan.cursor]!;
    const wanted = plan.ranges[plan.cursor] ?? null;
    if (wanted !== null && !sameSlotRange(cursor.range, wanted)) {
      // A cold draw — a seek, a restart, the first step. Nothing on the
      // screen is right, so every slot is drawn now and fitted together.
      for (let index = 0; index < this.slotCount; index += 1) {
        this.settleSlot(index, plan.ranges[index] ?? null, false);
      }
      this.cursorSlot = plan.cursor;
      this.slotRanges = plan.ranges;
      this.updateSlotClasses();
      this.fitSlots();
      recordRenderTiming('window.swapCold', performance.now() - started);
      return;
    }
    // The bar being played is already drawn. Moving the cursor into it is a
    // class toggle; the slot it left is re-drawn on the *next* frame. It used
    // to be re-drawn here, inside the paint that colours the note just
    // played — an engraving on the input path, tens of milliseconds on a
    // phone, once every crossing: the hitch at every other bar, and the
    // colour of the note landing late. Nobody is looking at that slot for
    // another frame, and the read-ahead is a bar long, not a frame.
    this.cursorSlot = plan.cursor;
    this.updateSlotClasses();
    const differs = plan.ranges.some((range, index) => index !== plan.cursor && this.slotDiffers(index, range));
    if (differs) this.scheduleSettle();
    if (plan.crossed) recordRenderTiming('window.swap', performance.now() - started);
  }

  private slotDiffers(index: SlotIndex, wanted: MeasureRange | null): boolean {
    const slot = this.buffers[index];
    if (!slot) return false;
    return wanted === null ? slot.range !== null : !sameSlotRange(slot.range, wanted);
  }

  /** Draws or blanks one slot to what the plan wants; true if anything changed. */
  private settleSlot(index: SlotIndex, wanted: MeasureRange | null, fade: boolean): boolean {
    const slot = this.buffers[index];
    if (!slot || !this.slotDiffers(index, wanted)) return false;
    if (wanted === null) {
      this.blank(slot);
      return true;
    }
    this.drawInto(slot, wanted);
    // A slot that changes while the eye is on the other one fades, because
    // peripheral vision ignores a fade and notices a flash.
    if (fade) this.fadeIn(slot);
    return true;
  }

  private scheduleSettle(): void {
    if (this.settleHandle !== null) return;
    const run = (): void => {
      this.settleHandle = null;
      if (this.disposed || this.readAhead !== 'slots') return;
      const started = performance.now();
      // Planned again from wherever the cursor is *now*: a second step may
      // have landed since the frame was asked for.
      const plan = planSlots(
        this.model.steps,
        this.currentStep,
        { cursor: this.cursorSlot, ranges: this.slotRanges },
        this.barsPerWindow,
        this.model.sourceMeasureCount,
        this.slotCount,
        this.model.pickup === true,
      );
      if (plan.cursor !== this.cursorSlot) return; // a seek is on its way; showStep handles it
      let drew = false;
      for (let index = 0; index < this.slotCount; index += 1) {
        if (index === plan.cursor) continue;
        if (this.settleSlot(index, plan.ranges[index] ?? null, true)) drew = true;
      }
      if (!drew) return;
      this.slotRanges = plan.ranges;
      this.updateSlotClasses();
      this.fitSlots();
      recordRenderTiming('window.settle', performance.now() - started);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    };
    this.settleHandle = w.requestIdleCallback
      ? { kind: 'idle', id: w.requestIdleCallback(run, { timeout: SETTLE_TIMEOUT_MS }) }
      : { kind: 'timer', id: window.setTimeout(run, SETTLE_TIMEOUT_MS / 2) };
  }

  private cancelSettle(): void {
    const handle = this.settleHandle;
    if (handle === null) return;
    this.settleHandle = null;
    if (handle.kind === 'timer') {
      window.clearTimeout(handle.id);
      return;
    }
    const w = window as Window & { cancelIdleCallback?: (id: number) => void };
    w.cancelIdleCallback?.(handle.id);
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
  /**
   * Sideways, the drawn range is the window plus two bars to read into.
   *
   * Without them there is nothing to slide towards: the window ends at the
   * bar being played, and the next one appears only when the whole window is
   * replaced — the jump A1 removed upright. The extra bars are drawn once and
   * slid past, so they cost one engraving rather than one per bar.
   */
  private slideRangeFor(sourceMeasureIndex: number): MeasureRange {
    // The window's bars, two behind and two ahead: a chunk. The window is
    // still what `windowFor` says — the chunk is what is *engraved*, so the
    // bar being played always has bars on both sides of it to slide against.
    const window_ = this.windowFor(sourceMeasureIndex);
    const last = Math.max(0, this.model.sourceMeasureCount - 1);
    return {
      fromMeasure: Math.max(0, window_.fromMeasure - SLIDE_BEHIND_BARS),
      toMeasure: Math.min(window_.toMeasure + SLIDE_READ_AHEAD_BARS, last),
    };
  }

  private showStepInOneSystem(step: ScoreStep): void {
    const wanted = this.sliding
      ? this.slideRangeFor(step.sourceMeasureIndex)
      : this.windowFor(step.sourceMeasureIndex);
    const front = this.buffers[this.cursorSlot]!;
    if (!sameRange(front.range, wanted)) {
      const started = performance.now();
      const spare = this.buffers[this.cursorSlot === 0 ? 1 : 0]!;
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
      // Only when something was drawn. A prepared swap is supposed to be a
      // class toggle, and fitting reads `getBBox()` and the stage box and
      // writes a transform — a forced layout, which on a fourfold-throttled
      // CPU took the swap from ~4 ms to a median of 20–26 against a budget of
      // 16.7 (`01` §6). The spare was fitted when it was pre-rendered; there
      // is nothing about it left to work out.
      if (prepared) {
        // A spare fitted for a stage of another height, or a scale a run has
        // since frozen, is refitted before it shows: one transform write.
        const shown = this.buffers[this.cursorSlot]!;
        if (!this.fitIsCurrent(shown)) this.fit(shown);
        // Except which transform the slide is now relative to: this sheet was
        // fitted on its own, off the critical path, and has never been slid.
        this.baseTransform = this.buffers[this.cursorSlot]!.wrapper.style.transform;
        this.slideX = 0;
        this.slidBar = -1;
      } else {
        this.fitSlots();
      }
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
    this.slideToStep(step);
  }

  /**
   * Whether the sheet slides rather than being replaced a window at a time.
   *
   * Sideways only, and only in Window layout: Scroll already slides, in the
   * other axis, and upright the two slots do the reading-ahead.
   */
  private get sliding(): boolean {
    if (this.readAhead !== 'single' || this.layout !== 'window') return false;
    return typeof window === 'undefined' ? false : window.innerWidth > window.innerHeight;
  }

  /**
   * Slides the sheet so the bar being played sits a third across (A2).
   *
   * By bar, at the barline, never per note: a sheet that moves under a note
   * being read is worse than one that jumps once a bar. The scale is already
   * fixed by the fit, so this is one measurement and one translate — read
   * where the cursor landed and shift by the difference.
   */
  private slideToStep(step: ScoreStep): void {
    const slot = this.buffers[this.cursorSlot]!;
    if (!this.sliding) {
      if (this.slideX !== 0) {
        this.slideX = 0;
        this.slidBar = -1;
        this.applySlide(slot);
      }
      return;
    }
    if (step.sourceMeasureIndex === this.slidBar) return;
    const anchor = this.anchorElementFor(step);
    if (!anchor) return;
    const host = this.el.getBoundingClientRect();
    if (host.width <= 0) return;
    const at = anchor.getBoundingClientRect().left - host.left;
    const delta = host.width * SLIDE_TARGET_FRACTION - at;
    // Never past the start: bar 1 sits where it was engraved rather than
    // being pushed into the middle of an otherwise empty stage.
    this.slideX = Math.min(0, this.slideX + delta);
    this.slidBar = step.sourceMeasureIndex;
    this.applySlide(slot);
  }

  private applySlide(slot: Buffer): void {
    slot.wrapper.style.transform =
      this.slideX === 0
        ? this.baseTransform
        : `translateX(${String(Math.round(this.slideX))}px) ${this.baseTransform}`;
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
      const front = this.buffers[this.cursorSlot]!.range;
      if (!front) return;
      // From the *window*, not the drawn range: sliding, the drawn range runs
      // two bars past the window (A2), and starting from its end skipped a
      // window. And prepared in the same shape the swap will ask for — the
      // pre-render drew `windowFor` while a sliding swap wanted
      // `slideRangeFor`, so the ranges never matched, the prepared buffer was
      // never used, and every swap sideways paid a full render.
      const step = this.model.steps[this.currentStep];
      const here = step ? this.windowFor(step.sourceMeasureIndex) : front;
      const nextStart = here.toMeasure + 1;
      if (nextStart >= this.model.sourceMeasureCount) return;
      const next = this.sliding ? this.slideRangeFor(nextStart) : this.windowFor(nextStart);
      const spare = this.buffers[this.cursorSlot === 0 ? 1 : 0]!;
      if (sameRange(spare.range, next) || sameRange(front, next)) return;
      // Off the critical path, and timed apart from the number the budget is
      // about so the two are never averaged together.
      const started = performance.now();
      this.drawInto(spare, next);
      // Fitted here, off the critical path, so bringing it forward later costs
      // nothing but the class toggle it is meant to cost.
      this.fit(spare);
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
  private updateReadAhead(): boolean {
    // The viewport, not the stage box. "Upright" is a fact about the phone,
    // and the stage is not always shaped like it: the dev renderer screen
    // gives its stage a fixed height inside a wide window, so reading the box
    // there called a landscape screen upright.
    const upright =
      typeof window === 'undefined' ? true : window.innerHeight > window.innerWidth;
    // A screen tall enough for two systems gets two slots whichever way up it
    // is. The slide is for a phone held sideways, where 360 px holds one
    // system; on a tablet or a desktop window 900 px tall, fitting one system
    // to the height drew a bar of Suo Gân across 1,200 px with note heads the
    // size of a thumb — the tour photographed it and I did not look.
    const tall = typeof window === 'undefined' ? false : window.innerHeight >= TWO_SYSTEMS_MIN_PX;
    const next: 'slots' | 'single' =
      (upright || tall) && this.barsPerWindow >= 2 ? 'slots' : 'single';
    // Written every time, not only on a change: the field starts at
    // `single`, so a stage that is sideways from the first step never wrote
    // the attribute at all and the stylesheet had nothing to match.
    this.el.dataset.readAhead = next;
    const count = next === 'slots' ? this.chooseSlotCount() : 1;
    if (next === this.readAhead && count === this.slotCount) return false;
    this.readAhead = next;
    this.slotCount = count;
    this.el.dataset.slots = String(count);
    // Everything drawn belonged to the other arrangement — and so did the
    // scale a run froze. Rotating mid-run kept the upright scale as a ceiling
    // on the sideways fit, and the other way round; the next render freezes
    // whatever the new arrangement fits.
    this.frozen = null;
    this.slotRanges = this.buffers.map(() => null);
    this.cursorSlot = 0;
    for (const slot of this.buffers) {
      // The classes too: a buffer hidden by the new arrangement kept its old
      // `is-current`, and the next time it came forward showed a stale one
      // for a frame (the state gallery's rotation cell).
      for (const element of slot.elements.values()) {
        element.classList.remove('is-current', 'is-correct', 'is-wrong', 'is-uncertain');
      }
      slot.range = null;
      slot.elements = new Map();
      slot.wrapper.hidden = false;
      slot.wrapper.style.top = '';
      slot.wrapper.style.height = '';
    }
    return true;
  }

  /**
   * How many slots the stage holds (`08` §3.2).
   *
   * Two, unless the width limits the size: then the height that is left
   * over holds more systems at the same size. Measured from the widest and
   * tallest window seen at this zoom; before anything has been seen, two.
   * Held during a run — a run keeps its arrangement as it keeps its scale.
   */
  private chooseSlotCount(): number {
    const most = Math.min(
      this.buffers.length,
      Math.max(2, Math.ceil(this.model.sourceMeasureCount / barsPerSlot(this.barsPerWindow))),
    );
    if (this.frozen || this.freezeHandle !== null) return Math.min(most, Math.max(2, this.slotCount));
    const stage = this.el.getBoundingClientRect();
    const height = this.held.zoom === this.zoomLevel ? Math.max(this.held.height, this.pieceInkZoom === this.zoomLevel ? (this.pieceInk?.height ?? 0) : 0) : 0;
    const width = Math.max(
      this.held.zoom === this.zoomLevel ? this.held.width : 0,
      this.pieceInkZoom === this.zoomLevel ? (this.pieceInk?.width ?? 0) : 0,
    );
    if (!(height > 0) || !(width > 0) || stage.height <= 0 || stage.width <= 0) return 2;
    const byWidth = (stage.width - FIT_MARGIN_PX) / width;
    const byHeightForTwo = (stage.height / 2 - FIT_MARGIN_PX) / height;
    if (byWidth >= byHeightForTwo) return 2;
    const systemPx = height * byWidth + FIT_MARGIN_PX;
    return Math.max(2, Math.min(most, Math.floor((stage.height + SLOT_GAP_PX) / (systemPx + SLOT_GAP_PX))));
  }

  private blank(slot: Buffer): void {
    slot.range = null;
    slot.elements = new Map();
    slot.wrapper.hidden = true;
    this.drawVersion += 1;
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
    this.lastStates = states;
    // Every buffer, not the front alone: sideways the spare is pre-rendered
    // with the states of the moment, and a paint that touched only the front
    // left the spare's marks behind, stale, for the next swap to show.
    for (const slot of this.buffers) this.applyNoteStates(slot.elements, states);
  }

  /**
   * The states last painted, re-applied to whatever the renderer engraves
   * on its own — the fit's re-draw when the piece's measurement lands, a
   * slot the settle refreshes. A fresh engraving has fresh elements with
   * no classes, and nobody asked the session to paint again: the corpus
   * found the first note of a run white on fourteen legs, until the second
   * note was played.
   */
  private lastStates: ReadonlyMap<string, NoteState> = new Map();

  private applyNoteStates(elements: ReadonlyMap<string, SVGGElement>, states: ReadonlyMap<string, NoteState>): void {
    // Resolved per element, not per id: a repeat's second pass has ids of
    // its own for the same printed notes, so one `<g>` answers to two, and
    // toggling per id let the pass with nothing to say undo the pass that
    // had — on the first time through the Minuet in G nothing was ever
    // coloured, because the second pass's id came last. The cursor wins,
    // then whichever pass has a judgement.
    const wanted = new Map<SVGGElement, NoteState | undefined>();
    for (const [id, element] of elements) {
      const state = states.get(id);
      const seen = wanted.get(element);
      if (!wanted.has(element) || state === 'current' || (seen === undefined && state !== undefined)) {
        wanted.set(element, state);
      }
    }
    for (const [element, state] of wanted) {
      element.classList.toggle('is-correct', state === 'correct');
      element.classList.toggle('is-wrong', state === 'wrong');
      element.classList.toggle('is-current', state === 'current');
      element.classList.toggle('is-uncertain', state === 'uncertain');
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
   * Whether the band is drawn at all (`08` §7.4: not in Free play, where a
   * band would be the app saying "play this now" in the one mode where the
   * player decides).
   */
  setCursorVisible(visible: boolean): void {
    this.el.dataset.cursor = visible ? 'on' : 'off';
  }

  /**
   * The bars of a loop, by source measure index, or null for none.
   *
   * The bars outside it are dimmed the way the other hand is dimmed under a
   * hand focus (`08` §11.18): a looped run used to be a cursor that jumped
   * backwards with nothing on the sheet to say why.
   */
  setLoopRange(range: { from: number; to: number } | null): void {
    const same =
      (range === null && this.loopRange === null) ||
      (range !== null && this.loopRange !== null && range.from === this.loopRange.from && range.to === this.loopRange.to);
    if (same) return;
    this.loopRange = range;
    for (const buffer of this.buffers) this.applyLoopClass(buffer);
  }

  private applyLoopClass(buffer: Buffer): void {
    const range = this.loopRange;
    for (const [id, element] of buffer.elements) {
      const note = this.notesById.get(id);
      const outside =
        range !== null && note !== undefined && (note.sourceMeasureIndex < range.from || note.sourceMeasureIndex > range.to);
      element.classList.toggle('is-outside-loop', outside);
    }
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

  /** What the fit is working from, for the tour's sequence log. */
  debugFit(): unknown {
    return {
      zoom: this.zoomLevel,
      userZoom: this.userZoom,
      held: { ...this.held },
      piece: this.pieceInkZoom === this.zoomLevel ? this.pieceInk : null,
      pieceInkZoom: this.pieceInkZoom,
      probeLoaded: this.probe?.isLoaded ?? false,
      frozen: this.frozen,
      readAhead: this.readAhead,
      slotCount: this.slotCount,
      cursorSlot: this.cursorSlot,
      slots: this.buffers.map((slot) => {
        const svg = slot.view.svg;
        const ink = svg ? inkBox(svg) : null;
        return {
          range: slot.range,
          ink: ink ? { w: Math.round(ink.width), h: Math.round(ink.height), y: Math.round(ink.y) } : null,
          staffTop: staffTopOf(slot.view),
          pageWidth: slot.wrapper.style.width,
          transform: slot.wrapper.style.transform,
        };
      }),
    };
  }

  /** Re-fits the current window; call on resize or orientation change. */
  refit(): void {
    this.stageChanged();
    // The box changed, so the fit is stale by definition.
    this.fittedAtHeight = -1;
    this.fitToStage();
  }

  /**
   * The stage's box changed: the screen's resize handler and the observer
   * both land here. A new arrangement — the phone turned — has nothing drawn
   * in it yet: the plan is reset and only a step draws. Without the redraw
   * the old arrangement sat squeezed into the new stage, cursor band and all,
   * until the next note was played; in Wait mode, indefinitely. Whichever of
   * the two callers gets there first takes the transition.
   */
  private stageChanged(): void {
    if (this.updateReadAhead() && this.currentStep >= 0) this.showStep(this.currentStep);
    else this.fitSlots();
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
    if (this.freezeHandle !== null) {
      window.clearTimeout(this.freezeHandle);
      this.freezeHandle = null;
    }
    this.cancelSettle();
    if (this.measureHandle !== null) {
      const w = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(this.measureHandle);
      window.clearTimeout(this.measureHandle);
      this.measureHandle = null;
    }
    if (this.probe) {
      this.probe.container.remove();
      this.probe.dispose();
      this.probe = null;
    }
    for (const buffer of this.buffers) {
      buffer.view.dispose();
      buffer.wrapper.remove();
    }
    this.band.remove();
    this.nextBand.remove();
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
    // Sideways a chunk is engraved on a page wide enough that it is always
    // one system. OSMD breaks lines at the container's width, and a six-bar
    // chunk on a stage-wide page wrapped onto two — which halved the size of
    // every window sideways, and no amount of measuring the piece could see
    // why, because the sheet really was that tall. A bar's width of page per
    // bar is more than any bar needs, and the last system of a page is not
    // stretched, so the bars keep their natural widths and the sheet slides
    // past them (P21e A3).
    if (this.sliding) {
      const bars = Math.max(1, range.toMeasure - range.fromMeasure + 1);
      const stageWidth = Math.max(1, this.el.getBoundingClientRect().width);
      buffer.wrapper.style.width = `${String(Math.round(bars * stageWidth))}px`;
    } else {
      buffer.wrapper.style.width = '';
    }
    // Shown *before* it is engraved. A slot blanked at the end of the piece
    // is `display: none`, and the engraver lays out into the width it can
    // measure — nought — so a slot drawn again after a blank (a lap, `Again`,
    // a step back) came out as a zero-width sheet that no fit would touch.
    buffer.wrapper.hidden = false;
    buffer.view.setRange(range);
    buffer.view.render();
    buffer.range = range;
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
    this.stageHeight = Math.round(available.height);

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
    //
    // Sideways the width is deliberately *not* a limit: the drawn range is the
    // window plus bars to read into, and fitting all of that across the stage
    // would shrink the music to buy bars nobody is playing yet. Height fills
    // the stage, the extra bars run off the right, and the sheet slides (P21c
    // A2).
    // Half the stage each in the slot arrangement, whether or not both are
    // drawn: the last window of a piece leaves the other slot blank, and
    // fitting the one that is left to the whole height doubled it — a pop
    // at the end of every run, the moment the summary appeared over it.
    const perSlot = available.height / (this.readAhead === 'slots' ? this.slotCount : boxes.length);
    const scale = this.scaleFor(
      boxes.map((entry) => entry.box),
      { width: available.width, height: perSlot },
    );
    if (scale === null) return;
    const drawn = scale * this.userZoom;
    for (const { slot, box } of boxes) {
      const transform = this.placement(slot, box, drawn);
      slot.wrapper.style.transform = transform;
      slot.fittedFor = { height: Math.round(perSlot), scale };
      if (slot === this.buffers[this.cursorSlot]!) this.baseTransform = transform;
    }
    this.packSlots(boxes.map((entry) => ({ slot: entry.slot, height: entry.box.height * drawn + FIT_MARGIN_PX })));
    // The first fit is what tells the count: the widest and tallest window
    // are known now. A different answer redraws once, from the current step.
    if (this.readAhead === 'slots' && !this.frozen && this.freezeHandle === null) {
      const count = this.chooseSlotCount();
      if (count !== this.slotCount) {
        this.slotCount = count;
        this.el.dataset.slots = String(count);
        this.slotRanges = this.buffers.map(() => null);
        for (const slot of this.buffers) {
          slot.range = null;
          slot.elements = new Map();
        }
        if (this.currentStep >= 0) this.showStep(this.currentStep);
        return;
      }
    }
    // Sideways the spare is not on the screen and not in `drawnSlots`, but it
    // is about to be: fit it to the same stage now rather than when it comes
    // forward, where a fit would cost the swap its frame.
    if (this.readAhead === 'single') {
      const spare = this.buffers[this.cursorSlot === 0 ? 1 : 0]!;
      if (spare.range && spare.view.svg) this.fit(spare);
    }
    // The sheet has been re-laid out, so wherever it had been slid to is no
    // longer where that bar is.
    this.slideX = 0;
    this.slidBar = -1;
    const step = this.model.steps[this.currentStep];
    if (step) this.slideToStep(step);
    // The bands are placed in stage pixels against the transform that was:
    // a refit — the stage taking the bar's row when a run starts, the probe's
    // measurement landing, the run ending — left them where the old scale had
    // put the notes until the next step moved them.
    this.repositionBands();
  }

  /**
   * Stacks the two slots from the top when their music is shorter than half
   * the stage each; otherwise the stylesheet's halves stand. The scale was
   * fitted against the halves, so a packed pair never overflows.
   */
  private packSlots(entries: { slot: Buffer; height: number }[]): void {
    if (this.readAhead !== 'slots') {
      for (const buffer of this.buffers) {
        buffer.wrapper.style.top = '';
        buffer.wrapper.style.height = '';
      }
      return;
    }
    const stageHeight = this.el.getBoundingClientRect().height;
    const perSlot = stageHeight / this.slotCount;
    const total = entries.reduce((sum, entry) => sum + entry.height, 0) + SLOT_GAP_PX * (entries.length - 1);
    const packed = entries.length >= 2 && total < stageHeight;
    // Every slot in use gets its box: packed from the top when the music is
    // shorter than its share, otherwise an even share each.
    let top = 0;
    for (let index = 0; index < this.slotCount; index += 1) {
      const slot = this.buffers[index];
      if (!slot) break;
      const entry = entries.find((candidate) => candidate.slot === slot);
      const height = packed && entry ? entry.height : perSlot;
      slot.wrapper.style.top = `${String(Math.round(packed ? top : index * perSlot))}px`;
      slot.wrapper.style.height = `${String(Math.round(height))}px`;
      if (entry) top += height + SLOT_GAP_PX;
    }
  }

  private repositionBands(): void {
    const step = this.model.steps[this.currentStep];
    if (step) this.positionBand(step);
    this.showNextStep(this.nextStep);
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
      const drawn = this.readAhead === 'single' ? i === this.cursorSlot : i < this.slotCount && slot.range !== null;
      slot.wrapper.classList.toggle('is-front', drawn);
      slot.wrapper.classList.toggle('is-cursor', drawn && i === this.cursorSlot);
      slot.wrapper.dataset.slot = String(i);
      slot.wrapper.setAttribute('aria-hidden', drawn ? 'false' : 'true');
      // Which of the two systems is being played, for a reader that cannot
      // see the band (`08` §8.5).
      if (drawn && i === this.cursorSlot) slot.wrapper.setAttribute('aria-current', 'true');
      else slot.wrapper.removeAttribute('aria-current');
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
      // The printed bar, which the id does not carry once a repeat gives the
      // same `<g>` a second id (the last one written wins the attribute).
      element.dataset.bar = String(note.sourceMeasureIndex);
      element.dataset.hand = note.hand;
      element.dataset.midi = String(note.midi);
    }
    buffer.elements = elements;
    this.drawVersion += 1;
    this.applyLoopClass(buffer);
    this.applyNoteStates(elements, this.lastStates);
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
      // The search redrew through `invalidate`, which fitted the slots while
      // `fitting` was set and measurement was refused. Now the zoom is settled
      // the piece can be measured at it, and the slots fitted to that.
      this.fitSlots();
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
    this.stageHeight = Math.round(available.height);
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
    // The same scale the slots use, from the same measurement of the piece:
    // this is the pre-render's fit, and a spare fitted to its own ink came
    // forward at a different size from the sheet it replaced.
    const fill = this.scaleFor([box], available);
    if (fill === null) return;
    // Times what the owner asked for. Filling the stage on its own *cancels*
    // the Size control: the engraving search already carries `userZoom`, so a
    // smaller engraving was simply scaled back up to fill and the buttons did
    // nothing. One means "as large as fits", and the buttons move around it.
    buffer.wrapper.style.transform = this.placement(buffer, box, fill * this.userZoom);
    buffer.fittedFor = { height: Math.round(available.height), scale: fill };
  }

  /** Whether a sheet's fit is for the stage as it is now. */
  private fitIsCurrent(buffer: Buffer): boolean {
    const fitted = buffer.fittedFor;
    if (!fitted) return false;
    // The height the last fit measured, not a fresh `getBoundingClientRect`:
    // that forces a layout, and on a swap the spare's whole engraving has
    // just been inserted, so the layout it forced was the expensive one the
    // double buffer exists to keep off the swap. The observer resets it when
    // the stage changes, and the fit that follows measures again.
    const stageHeight = this.stageHeight >= 0 ? this.stageHeight : Math.round(this.el.getBoundingClientRect().height);
    if (fitted.height !== stageHeight) return false;
    if (this.frozen && this.frozen.scale > 0 && fitted.scale > this.frozen.scale + 0.001) return false;
    return true;
  }

  /**
   * The scale that fits the *piece* into `available`, not just these boxes
   * (P21e A2).
   *
   * Height comes from the probe's measurement of the tallest system in the
   * piece when it has one, and from the tallest box seen so far — held, never
   * released — until it does. Width is the widest box seen: a one-bar slot is
   * stretched to the page by the engraver, so it is all but constant, and
   * holding it stops the last, shorter bar of a piece being drawn larger.
   * Sideways the width is no limit at all; the sheet slides.
   */
  /**
   * A run is starting or ending.
   *
   * Starting: measure the piece now if the probe is ready and has not, so the
   * run begins at the size it will keep; then freeze that size. Ending: let
   * go, and fit again with whatever has been learned since.
   */
  setRunning(running: boolean): void {
    if (running) {
      if (this.frozen || this.freezeHandle !== null) return;
      if (this.probe?.isLoaded && this.pieceInkZoom !== this.zoomLevel) this.measureLoaded();
      // Not yet: the stage takes the bar's row when a run starts, and the
      // `ResizeObserver` refits a moment later. Freezing now would hold the
      // size of the smaller stage for the whole run, with the freed row left
      // black. A short wait lets the stage settle, then the fit is the one
      // that is kept.
      this.freezeHandle = window.setTimeout(() => {
        this.freezeHandle = null;
        if (this.disposed) return;
        this.fitSlots();
        this.frozen = {
          scale: this.currentScale(),
          piece: this.pieceInkZoom === this.zoomLevel ? this.pieceInk : null,
        };
      }, 150);
      return;
    }
    if (this.freezeHandle !== null) {
      window.clearTimeout(this.freezeHandle);
      this.freezeHandle = null;
    }
    if (!this.frozen) return;
    this.frozen = null;
    this.fitSlots();
  }

  /** The scale the cursor slot is drawn at, from its transform; 0 if none. */
  private currentScale(): number {
    const match = /scale\(([\d.]+)\)/.exec(this.buffers[this.cursorSlot]!.wrapper.style.transform);
    const value = match ? Number(match[1]) : 0;
    return Number.isFinite(value) && value > 0 ? value / this.userZoom : 0;
  }

  private scaleFor(
    boxes: { width: number; height: number }[],
    available: { width: number; height: number },
  ): number | null {
    if (boxes.length === 0) return null;
    if (this.held.zoom !== this.zoomLevel) this.held = { height: 0, width: 0, above: 0, zoom: this.zoomLevel };
    for (const box of boxes) {
      this.held.height = Math.max(this.held.height, box.height);
      this.held.width = Math.max(this.held.width, box.width);
    }
    this.scheduleMeasure();
    const piece = this.pieceInkZoom === this.zoomLevel ? this.pieceInk : null;
    const height = Math.max(this.held.height, piece?.height ?? 0);
    const width = Math.max(this.held.width, piece?.width ?? 0);
    if (!(height > 0) || !(width > 0)) return null;
    const byHeight = (available.height - FIT_MARGIN_PX) / height;
    const fitted = this.sliding
      ? byHeight
      : Math.min((available.width - FIT_MARGIN_PX) / width, byHeight);
    if (!Number.isFinite(fitted) || fitted <= 0) return null;
    // During a run, the size it started at. A chunk a little taller than the
    // piece's measure — a fingering the engraver set higher over one high
    // note, a rare ledger line — keeps the size and lets that ink run into
    // the margin, because a sheet that shrinks by 6 % at bar 10 is the size
    // change the owner saw; only ink far taller than the stage has room for
    // still shrinks it, since a note clipped off the bottom is worse.
    if (this.frozen && this.frozen.scale > 0) {
      return fitted >= this.frozen.scale * FROZEN_OVERFLOW ? this.frozen.scale : fitted;
    }
    return fitted;
  }

  /**
   * Where a slot's sheet goes, at `scale`.
   *
   * Aligned on the *stave*, not on the ink: with one scale for every window,
   * the ink's top still moves — a chord symbol above bar 3 and none above bar
   * 4 — and anchoring the ink's top in the slot's top would move the stave
   * down and up by that much between windows. The stave is what the eye is on,
   * so the stave holds still, at the distance below the slot's top that the
   * tallest thing in the piece needs.
   */
  private placement(slot: Buffer, box: { x: number; y: number }, scale: number): string {
    const piece = this.frozen
      ? this.frozen.piece
      : this.pieceInkZoom === this.zoomLevel
        ? this.pieceInk
        : null;
    const svg = slot.view.svg;
    if (!svg) return place(box, scale);
    const staffTop = staffTopOf(slot.view);
    if (staffTop === null) return place(box, scale);
    if (piece) return place({ x: box.x, y: staffTop - piece.above }, scale);
    // Not measured — the probe has not run yet, or the piece is too long for
    // it to ever run: the most any window so far has had above its stave,
    // held like the sizes are. Anchoring on the ink instead moved the stave
    // of the Scherzo by 37 px between a window with a dynamic over it and
    // one without.
    if (this.held.zoom !== this.zoomLevel) this.held = { height: 0, width: 0, above: 0, zoom: this.zoomLevel };
    this.held.above = Math.max(this.held.above, staffTop - box.y);
    return place({ x: box.x, y: staffTop - this.held.above }, scale);
  }

  /**
   * Measures the piece, a frame after it is first asked for.
   *
   * A frame after, because a full render of a long piece is hundreds of
   * milliseconds, and the first window should be on the screen before it is
   * paid. Until it has run the held sizes stand in, so the worst case is one
   * size change, downward, one frame after the first draw.
   */
  private scheduleMeasure(): void {
    if (!this.probe || this.pieceInkZoom === this.zoomLevel || this.measureHandle !== null) return;
    if (this.fitting || this.probeLoading) return;
    // Idle time, not the next frame: the pre-render of the next window is
    // queued on a frame and a full render in front of it would push the first
    // swap past its budget. `requestIdleCallback` is not everywhere; a short
    // timer is the same idea with a worse guarantee.
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    const run = (): void => {
      this.measureHandle = null;
      if (this.disposed || this.fitting) return;
      void this.measurePiece().then(() => {
        // Apply it: the slots were fitted to the held sizes until now.
        if (!this.disposed && this.pieceInkZoom === this.zoomLevel) this.fitSlots();
      });
    };
    this.measureHandle =
      typeof w.requestIdleCallback === 'function'
        ? w.requestIdleCallback(run, { timeout: 1500 })
        : window.setTimeout(run, 400);
  }

  /**
   * Draws the first `PROBE_MAX_BARS` of the piece into the probe and measures
   * the tallest system.
   *
   * Bounded, because a full render of a 780-bar piece is many seconds even on
   * a desktop; the first forty-eight bars are a fair sample of what the
   * engraver will do with the rest, and the held sizes catch anything taller
   * that comes later — one shrink, once, rather than a size per window.
   */
  private async measurePiece(): Promise<void> {
    const probe = this.probe;
    if (!probe || this.pieceInkZoom === this.zoomLevel) return;
    if (!probe.isLoaded) {
      if (!this.probeSource) return;
      this.probeLoading = true;
      try {
        await probe.load(this.probeSource);
      } catch {
        // A piece the probe cannot load is measured the slow way, window by
        // window, held and never released.
        this.probe = null;
        return;
      } finally {
        this.probeLoading = false;
      }
      if (this.disposed) return;
    }
    this.measureLoaded();
  }

  /** The synchronous half: the probe is loaded, draw and measure it. */
  private measureLoaded(): void {
    const probe = this.probe;
    if (!probe?.isLoaded || this.pieceInkZoom === this.zoomLevel) return;
    const zoom = this.zoomLevel;
    try {
      probe.zoom = zoom;
      probe.setRange({
        fromMeasure: 0,
        toMeasure: Math.min(PROBE_MAX_BARS, this.model.sourceMeasureCount) - 1,
      });
      const started = performance.now();
      probe.render();
      recordRenderTiming('osmd.probe', performance.now() - started);
    } catch {
      return;
    }
    const svg = probe.svg;
    if (!svg) return;
    const measured = pieceInkOf(probe, stavesPerSystem(probe));
    if (!measured) return;
    this.pieceInk = measured;
    this.pieceInkZoom = zoom;
  }

  /**
   * Puts the translucent band over the current step.
   *
   * A step with no drawn notes (a rest, or a tie continuation) borrows the
   * position of the nearest step that has one — simpler than deriving geometry
   * from OSMD's layout, and visually indistinguishable.
   */
  /**
   * Marks the step after this one, or nothing.
   *
   * Called by the screen rather than worked out here: whether there is a
   * clock to be ahead of is the run's business, not the renderer's.
   */
  showNextStep(stepIndex: number | null): void {
    this.nextStep = stepIndex;
    const step = stepIndex === null ? undefined : this.model.steps[stepIndex];
    if (!step) {
      this.nextBand.hidden = true;
      return;
    }
    this.placeBand(this.nextBand, step, true);
  }

  private positionBand(step: ScoreStep): void {
    this.placeBand(this.band, step);
  }

  /**
   * `exact` refuses the nearest-drawn-note fallback.
   *
   * The cursor may borrow a neighbour's position — a rest has no element and
   * the band has to go somewhere sensible. The *next* band may not: if the
   * coming step is not drawn, because it is past the end of the other slot,
   * borrowing would put a "play this next" mark on a note that is not next.
   * Nothing is better than a lie.
   */
  private placeBand(band: HTMLElement, step: ScoreStep, exact = false): void {
    const anchor = exact ? this.firstElementOf(step) : this.anchorElementFor(step);
    if (!anchor) {
      band.hidden = true;
      return;
    }
    const host = this.el.getBoundingClientRect();
    const box = anchor.getBoundingClientRect();
    band.hidden = false;
    band.style.left = `${box.left - host.left + this.el.scrollLeft - 4}px`;
    band.style.width = `${Math.max(box.width + 8, 12)}px`;

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
    if (band === this.nextBand) {
      // A short line under the stave, not a paler copy of the cursor. Two
      // bands on the screen read as two cursors — the owner's words — and a
      // beginner cannot tell which one to play.
      const bottom = line && line.height > 0 ? line.bottom : box.bottom;
      band.style.top = `${bottom - host.top + this.el.scrollTop + 4}px`;
      band.style.height = '4px';
      return;
    }
    if (line && line.height > 0) {
      band.style.top = `${line.top - host.top + this.el.scrollTop - pad}px`;
      band.style.height = `${line.height + pad * 2}px`;
    } else {
      // No stave to be found — a rest before anything is drawn. Fall back to
      // the note's own box rather than to the whole screen.
      band.style.top = `${box.top - host.top + this.el.scrollTop - pad}px`;
      band.style.height = `${box.height + pad * 2}px`;
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
    const reduced =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    this.el.scrollTo({
      top: Math.max(0, offsetInContent - host.height * SCROLL_TARGET_FRACTION),
      behavior: reduced ? 'auto' : 'smooth',
    });
  }
}

function sameRange(a: MeasureRange | null, b: MeasureRange | null): boolean {
  if (!a || !b) return false;
  return a.fromMeasure === b.fromMeasure && a.toMeasure === b.toMeasure;
}

/**
 * The tallest system in the piece, in CSS pixels at the zoom it was drawn at.
 *
 * `above` is how far the tallest thing above a stave reaches over it (a chord
 * symbol, a tempo mark, a high ledger line), `below` how far the lowest thing
 * hangs under; `height` is the two plus the stave's own span. A window drawn
 * at the same zoom can never be taller than this, so a scale that fits this
 * fits every window.
 */
interface PieceInk {
  height: number;
  above: number;
  below: number;
  /**
   * The widest system the engraver made of the piece on this page: the page
   * width, unless a bar is too dense to fit it, when the engraver runs that
   * bar past the edge rather than squeeze it — and would do the same in a
   * slot. Known before the run, the fit starts at the size that bar needs;
   * unknown, the run shrank by 29 % at bar 3 of Hot Cross Buns on a tablet
   * sideways, where eight quavers are wider than the page.
   */
  width: number;
}

/** CSS pixels per SVG user unit, from what OSMD wrote on the element. */
function svgUnit(svg: SVGSVGElement): number {
  const engraved = engravedSize(svg);
  const view = svg.viewBox.baseVal;
  return engraved && view && view.width > 0 ? engraved.width / view.width : 1;
}

interface StaffLineBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** OSMD's unit, in the SVG's own coordinates: ten user units to one of its. */
const OSMD_UNIT = 10;

/**
 * Every stave's lines — the box of the five — from the engraver's model, in
 * CSS pixels of the drawn sheet, sorted from the top.
 *
 * Not the `.staffline` group's box: that group holds the notes, the clef and
 * the fingerings as well as the lines, so its top is wherever the engraver
 * put the highest fingering, and that moved by nine units between two
 * chunks of the same bars. Anchoring on it moved the stave; the model knows
 * where the lines are.
 */
function staffLineBoxes(view: OsmdView): StaffLineBox[] {
  const svg = view.svg;
  if (!(svg instanceof SVGSVGElement)) return [];
  const unit = svgUnit(svg) * OSMD_UNIT;
  const out: StaffLineBox[] = [];
  try {
    const pages = view.instance.GraphicSheet?.MusicPages ?? [];
    for (const page of pages) {
      for (const system of page.MusicSystems ?? []) {
        for (const line of system.StaffLines ?? []) {
          const shape = line.PositionAndShape;
          const y = shape?.AbsolutePosition?.y;
          const height = shape?.Size?.height;
          if (typeof y !== 'number' || typeof height !== 'number' || !(height > 0)) continue;
          const x = shape?.AbsolutePosition?.x;
          const width = shape?.Size?.width;
          const left = typeof x === 'number' ? x * unit : 0;
          const right = typeof width === 'number' && width > 0 ? left + width * unit : left;
          out.push({ top: y * unit, bottom: (y + height) * unit, left, right });
        }
      }
    }
  } catch {
    return [];
  }
  return out.sort((a, b) => a.top - b.top);
}

/** The top of the first stave's lines in a drawn sheet, in CSS pixels, or null. */
function staffTopOf(view: OsmdView): number | null {
  const first = staffLineBoxes(view)[0];
  if (first) return first.top;
  // No model to ask: the group's box, which is at least the right stave.
  const svg = view.svg;
  if (!(svg instanceof SVGSVGElement)) return null;
  const unit = svgUnit(svg);
  let top = Infinity;
  for (const line of svg.querySelectorAll<SVGGraphicsElement>('.staffline')) {
    try {
      const box = line.getBBox();
      if (box.height > 0) top = Math.min(top, box.y * unit);
    } catch {
      // Not rendered; nothing to measure.
    }
  }
  return Number.isFinite(top) ? top : null;
}

/** How many staves a system has — two for a grand staff — from the engraver. */
function stavesPerSystem(view: OsmdView): number {
  try {
    const systems = view.instance.GraphicSheet?.MusicPages?.[0]?.MusicSystems;
    const count = systems?.[0]?.StaffLines?.length;
    return count && count > 0 ? count : 1;
  } catch {
    return 1;
  }
}

/**
 * Buckets everything drawn into systems and takes the tallest.
 *
 * Systems are found from the `.staffline` groups, `staves` at a time; every
 * other drawn element is given to the system whose staves it is nearest, so
 * a chord symbol above bar 3 counts towards bar 3's system and not the one
 * above it. `null` when there is nothing to measure.
 */
function pieceInkOf(view: OsmdView, staves: number): PieceInk | null {
  const svg = view.svg;
  if (!(svg instanceof SVGSVGElement)) return null;
  const unit = svgUnit(svg);
  // The stave *lines*, so `above` and `below` are measured from the lines
  // and the placement, which anchors on the lines, agrees with them.
  let lines = staffLineBoxes(view);
  if (lines.length === 0) {
    for (const line of svg.querySelectorAll<SVGGraphicsElement>('.staffline')) {
      try {
        const box = line.getBBox();
        if (box.height > 0)
          lines.push({
            top: box.y * unit,
            bottom: (box.y + box.height) * unit,
            left: box.x * unit,
            right: (box.x + box.width) * unit,
          });
      } catch {
        // Skip what is not rendered.
      }
    }
    lines = lines.sort((a, b) => a.top - b.top);
  }
  if (lines.length === 0) return null;
  const per = Math.max(1, Math.min(staves, lines.length));
  const systems: { top: number; bottom: number; inkTop: number; inkBottom: number }[] = [];
  for (let i = 0; i < lines.length; i += per) {
    const group = lines.slice(i, i + per);
    const top = Math.min(...group.map((l) => l.top));
    const bottom = Math.max(...group.map((l) => l.bottom));
    systems.push({ top, bottom, inkTop: top, inkBottom: bottom });
  }
  const nearest = (y: number): (typeof systems)[number] => {
    let best = systems[0]!;
    let bestDistance = Infinity;
    for (const system of systems) {
      const distance = y < system.top ? system.top - y : y > system.bottom ? y - system.bottom : 0;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = system;
      }
    }
    return best;
  };
  // Nothing that belongs to one system is taller than a few staves: a stem,
  // a beam, a slur, a chord symbol. Anything taller spans the page — a
  // background, a bracket across systems, a connector — and bucketing it to
  // whichever system its middle is nearest made that system "as tall as the
  // page", and every window a quarter of the size it should have been.
  const tallest = Math.max(...systems.map((s) => s.bottom - s.top));
  const cap = tallest * 3;
  // Nothing that belongs in a bar is wider than the system it is in: a note, a
  // beam, a slur across the whole line. Anything wider is a block of text the
  // engraver laid out on one line and never wrapped — Suo Gan carries both its
  // verses that way, one `<text>` 5841 units wide against a 180-unit page, and
  // the ink box of the sheet is that text. Fitting the stage's width to it gave
  // the piece a scale of 0.03: four slots, five pixels of music each, 3 % of a
  // phone's screen. Same reasoning as the height cap above, on the other axis.
  const staveWidth = Math.max(...lines.map((l) => l.right - l.left), 0);
  const widthCap = staveWidth > 0 ? staveWidth * 1.5 : Infinity;
  let inkLeft = Infinity;
  let inkRight = -Infinity;
  for (const el of svg.querySelectorAll<SVGGraphicsElement>('path, text, rect, line, polygon, circle, ellipse')) {
    let box: DOMRect;
    try {
      box = el.getBBox();
    } catch {
      continue;
    }
    if (!(box.width > 0 || box.height > 0)) continue;
    if (box.height * unit > cap) continue;
    if (box.width * unit > widthCap) continue;
    inkLeft = Math.min(inkLeft, box.x * unit);
    inkRight = Math.max(inkRight, (box.x + box.width) * unit);
    const top = box.y * unit;
    const bottom = (box.y + box.height) * unit;
    const system = nearest((top + bottom) / 2);
    system.inkTop = Math.min(system.inkTop, top);
    system.inkBottom = Math.max(system.inkBottom, bottom);
  }
  // The *typical* system, not the tallest. Measured on Suo Gan: three systems
  // 79 px tall and one 156, because a few low notes hang far under the stave
  // for two bars — and fitting every window to that one cost 40 % of the size
  // everywhere. The upper quartile keeps a piece that is tall throughout
  // tall, and lets a rare bar shrink the sheet once when it arrives, which
  // the held sizes do on their own.
  // Rounded *up*: with two or three systems the quartile is the tallest of
  // them — the floor picked the shortest of two, and a piece whose second
  // system carried the high notes was fitted to its first.
  const quartile = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.ceil((sorted.length - 1) * 0.75))] ?? 0;
  };
  const above = quartile(systems.map((s) => s.top - s.inkTop));
  const below = quartile(systems.map((s) => s.inkBottom - s.bottom));
  const span = Math.max(...systems.map((s) => s.bottom - s.top));
  // The widest bar the engraver drew, which is the page unless a bar was too
  // dense to fit it and ran past the edge; never less than a stave, so a piece
  // whose ink cannot be measured still gets the page.
  const width =
    inkRight > inkLeft ? Math.max(staveWidth, inkRight - inkLeft) : (inkBox(svg)?.width ?? 0);
  return { above, below, height: above + span + below, width };
}
