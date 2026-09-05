// A thin, honest wrapper around OpenSheetMusicDisplay.
//
// It owns three things the rest of the app should never have to know about:
//
//  1. **Phone engraving.** OSMD's defaults are laid out for a printed page:
//     wide margins, a title block, a composer line. On a 915×412 landscape
//     viewport that leaves barely a stave of music. The rules applied here
//     strip the page furniture and tighten the margins.
//  2. **The draw range.** `drawFromMeasureNumber`/`drawUpToMeasureNumber` are
//     1-based *measure numbers as printed*, not indexes, and setting them also
//     narrows `osmd.cursor`'s iterator (Cursor.resetIterator() clamps to
//     rules.Min/MaxMeasureToDrawIndex). That is why `extractModel()` refuses
//     to run once a range is set — a windowed instance would silently yield a
//     model of just the window.
//  3. **Timing.** Every render is measured through util/renderTiming, so the
//     Diagnostics screen from P1 shows real numbers from the owner's phone
//     against the < 150 ms budget in docs/01-architecture.md §6.

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { GraphicalNote, Note } from 'opensheetmusicdisplay';
import { extractScoreModel, type ExtractOptions } from './extractScoreModel';
import {
  printedNoteKey,
  roundBeats,
  WHOLE_NOTE_BEATS,
  type ScoreModel,
  type ScoreNote,
} from './types';
import { measureRender } from '../util/renderTiming';

export interface MeasureRange {
  /** 0-based *printed* measure index, inclusive. */
  fromMeasure: number;
  /** 0-based printed measure index, inclusive. */
  toMeasure: number;
}

export interface OsmdViewOptions {
  /** Draw fingering numbers (docs/04-ui-spec.md §7 Display, default on). */
  drawFingerings?: boolean;
  /** Label for the render-timing log; distinguishes the two buffers. */
  timingLabel?: string;
  /** Start with the cursor element hidden; the overlay draws its own band. */
  hideCursor?: boolean;
}

/**
 * Compact engraving for a phone.
 *
 * The numbers are OSMD "units" (roughly 1 unit = 10 px at zoom 1). Chosen by
 * eye against the S25's 915×412 landscape viewport: enough air that ledger
 * lines and fingerings do not collide, no more.
 */
function applyPhoneEngraving(osmd: OpenSheetMusicDisplay, options: OsmdViewOptions): void {
  const rules = osmd.EngravingRules;
  rules.CompactMode = true;
  rules.PageTopMargin = 0.5;
  rules.PageBottomMargin = 0.5;
  rules.PageLeftMargin = 0.5;
  rules.PageRightMargin = 0.5;
  rules.SystemLeftMargin = 0;
  // The title block is dead weight on a two-bar window: the screen already
  // says which piece is open.
  rules.SheetTitleHeight = 0;
  rules.RenderTitle = false;
  rules.RenderSubtitle = false;
  rules.RenderComposer = false;
  rules.RenderLyricist = false;
  rules.RenderPartNames = false;
  rules.RenderPartAbbreviations = false;
  // Grand-staff spacing: tight enough for two staves plus the control bar.
  rules.BetweenStaffDistance = 3.5;
  rules.StaffDistance = 5;
  rules.MinimumDistanceBetweenSystems = 4;
  rules.FingeringPositionFromXML = false;
  if (options.drawFingerings === false) rules.RenderFingerings = false;
}

export class OsmdView {
  readonly container: HTMLElement;
  private readonly osmd: OpenSheetMusicDisplay;
  private readonly timingLabel: string;
  private range: MeasureRange | null = null;
  private loaded = false;

  constructor(container: HTMLElement, options: OsmdViewOptions = {}) {
    this.container = container;
    this.timingLabel = options.timingLabel ?? 'osmd.render';
    this.osmd = new OpenSheetMusicDisplay(container, {
      // The app drives every re-render itself (window swaps, zoom changes), so
      // OSMD's own resize listener would only duplicate work and fight the
      // double buffering in WindowRenderer.
      autoResize: false,
      backend: 'svg',
      drawingParameters: 'compact',
      drawTitle: false,
      drawSubtitle: false,
      drawComposer: false,
      drawLyricist: false,
      drawCredits: false,
      drawPartNames: false,
      drawFingerings: options.drawFingerings ?? true,
      drawMetronomeMarks: true,
      followCursor: false,
    });
    applyPhoneEngraving(this.osmd, options);
    if (options.hideCursor !== false) this.osmd.enableOrDisableCursors(false);
  }

  /** The underlying instance, for the few places that need OSMD directly. */
  get instance(): OpenSheetMusicDisplay {
    return this.osmd;
  }

  get isLoaded(): boolean {
    return this.loaded;
  }

  /** Printed measure count, available after `load()`. */
  get measureCount(): number {
    return this.osmd.Sheet?.SourceMeasures.length ?? 0;
  }

  async load(musicXml: string): Promise<void> {
    await this.osmd.load(musicXml);
    this.loaded = true;
    this.range = null;
  }

  /**
   * Builds the ScoreModel.
   *
   * Must be called before any draw range is set: OSMD's cursor iterator is
   * clamped to the drawn range, so a windowed instance yields a model of just
   * that window. Throws rather than returning a quietly truncated model.
   */
  extractModel(options: ExtractOptions = {}): ScoreModel {
    if (!this.loaded) throw new Error('OsmdView.extractModel: nothing loaded');
    if (this.range) {
      throw new Error(
        'OsmdView.extractModel: a draw range is set, which clamps the cursor iterator — ' +
          'extract the model before windowing (or call clearRange() first)',
      );
    }
    return extractScoreModel(this.osmd, options);
  }

  /**
   * Limits drawing to a printed measure range.
   *
   * Takes 0-based indexes; OSMD's options are 1-based measure *numbers*, which
   * is a reliable source of off-by-one bugs, so the conversion lives here.
   */
  setRange(range: MeasureRange | null): void {
    if (!range) {
      this.clearRange();
      return;
    }
    const from = Math.max(0, Math.min(range.fromMeasure, this.measureCount - 1));
    const to = Math.max(from, Math.min(range.toMeasure, this.measureCount - 1));
    this.range = { fromMeasure: from, toMeasure: to };
    this.osmd.setOptions({
      drawFromMeasureNumber: from + 1,
      drawUpToMeasureNumber: to + 1,
    });
  }

  clearRange(): void {
    this.range = null;
    this.osmd.setOptions({ drawFromMeasureNumber: 1, drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER });
  }

  get currentRange(): MeasureRange | null {
    return this.range;
  }

  get zoom(): number {
    return this.osmd.Zoom;
  }

  set zoom(value: number) {
    // 0.5..2.0 per docs/01-architecture.md §4.1.
    this.osmd.Zoom = Math.min(2, Math.max(0.5, value));
  }

  /** Renders, and records how long it took. Returns the elapsed milliseconds. */
  render(): number {
    if (!this.loaded) throw new Error('OsmdView.render: nothing loaded');
    const start = performance.now();
    measureRender(this.timingLabel, () => {
      this.osmd.render();
    });
    return performance.now() - start;
  }

  /** The rendered `<svg>`, or null before the first render. */
  get svg(): SVGSVGElement | null {
    return this.container.querySelector('svg');
  }

  /**
   * Maps every drawn note to its `<g>` element, keyed by `printedNoteKey`, so
   * the overlay can paint notes without re-rendering.
   *
   * Keyed by the *printed* identity rather than `ScoreNote.id`: a note inside a
   * repeated section is drawn once but visited on every pass, so the element
   * cannot be keyed by the unrolled step. `elementsForNotes` does the
   * translation for callers holding ScoreNotes.
   *
   * Only notes inside the current draw range appear — OSMD creates no
   * graphical objects for measures it did not draw, and callers read a missing
   * key as "off-screen", which is what it means.
   */
  noteElements(): Map<string, SVGGElement> {
    const map = new Map<string, SVGGElement>();
    const graphic = this.osmd.GraphicSheet;
    const sheet = this.osmd.Sheet;
    if (!graphic || !sheet) return map;

    // SourceMeasure -> its index. MeasureNumber cannot be used as the index: a
    // pickup bar is number 0, and numbering restarts in some engravings.
    const measureIndexes = new Map<unknown, number>();
    sheet.SourceMeasures.forEach((measure, i) => measureIndexes.set(measure, i));

    for (const staffMeasures of graphic.MeasureList ?? []) {
      for (const measure of staffMeasures ?? []) {
        if (!measure) continue;
        for (const staffEntry of measure.staffEntries ?? []) {
          for (const voiceEntry of staffEntry.graphicalVoiceEntries ?? []) {
            for (const graphicalNote of voiceEntry.notes ?? []) {
              const element = svgElementOf(graphicalNote);
              if (!element) continue;
              const key = printedKeyOf(graphicalNote, measureIndexes);
              if (key) map.set(key, element);
            }
          }
        }
      }
    }
    return map;
  }

  /** Resolves ScoreNotes to their drawn elements; misses are off-screen. */
  elementsForNotes(notes: readonly ScoreNote[]): Map<string, SVGGElement> {
    const drawn = this.noteElements();
    const out = new Map<string, SVGGElement>();
    for (const note of notes) {
      const element = drawn.get(printedNoteKey(note));
      if (element) out.set(note.id, element);
    }
    return out;
  }

  /**
   * Walks a live cursor from reset to the end and returns how many positions
   * it visited.
   *
   * This is the ground truth `extractScoreModel` is measured against: the
   * model claims `step.index === the number of cursor.next() calls`, and only
   * a real, rendered cursor can confirm it (jsdom cannot render, so the Node
   * tests compare against an iterator walk instead). Requires `render()` to
   * have run.
   */
  countCursorSteps(): number {
    if (!this.loaded) throw new Error('OsmdView.countCursorSteps: nothing loaded');
    this.osmd.enableOrDisableCursors(true);
    const cursor = this.osmd.cursor;
    cursor.hide();
    cursor.reset();
    let n = 0;
    // The guard is a safety net for a malformed repeat structure, matching the
    // extractor's own limit.
    while (!cursor.iterator.EndReached && n < 100_000) {
      n += 1;
      cursor.next();
    }
    cursor.reset();
    return n;
  }

  /** Frees the OSMD instance and empties the container. */
  dispose(): void {
    try {
      this.osmd.clear();
    } catch {
      // clear() throws if nothing was ever rendered; disposing is best-effort.
    }
    this.container.replaceChildren();
    this.loaded = false;
  }
}

/** `getSVGGElement` exists only on the VexFlow subclass. */
function svgElementOf(graphicalNote: GraphicalNote): SVGGElement | null {
  const candidate = graphicalNote as GraphicalNote & {
    getSVGGElement?: () => SVGGElement | null;
  };
  if (typeof candidate.getSVGGElement !== 'function') return null;
  try {
    return candidate.getSVGGElement();
  } catch {
    // OSMD throws when the note was not drawn (outside the range).
    return null;
  }
}

/**
 * Builds the printed key for a drawn note, matching `printedNoteKey` on the
 * model side.
 */
function printedKeyOf(
  graphicalNote: GraphicalNote,
  measureIndexes: Map<unknown, number>,
): string | null {
  const note = graphicalNote.sourceNote as Note | undefined;
  if (!note) return null;
  const sourceMeasureIndex = measureIndexes.get(note.SourceMeasure);
  if (sourceMeasureIndex === undefined) return null;
  return printedNoteKey({
    sourceMeasureIndex,
    staff: note.ParentStaffEntry?.ParentStaff?.Id ?? 1,
    voice: note.ParentVoiceEntry?.ParentVoice?.VoiceId ?? 1,
    sourceOnset: roundBeats(note.getAbsoluteTimestamp().RealValue * WHOLE_NOTE_BEATS),
    midi: note.halfTone + 12,
  });
}
