/**
 * The window rule, asserted from the glass (T34).
 *
 * The owner, 2026-09-23: "Maximizing individual bar's readability given the
 * screen size and orientation without distortion, and being able to see the
 * next bar when possible, are the most important things." And: "By stretch I
 * mean making the notes per bar too far apart from regular sheet music, not
 * that it shouldn't get proportionally bigger if it has the space." And: "the
 * user should still be able to size up/down and choose the number of bars if
 * possible still, and everything should resize based on the selection."
 *
 * Five invariants per cell (`docs/prompts/tasks/T34-window-fit.md`), and one
 * per stepper:
 *
 * (a) **No stretch.** Every system in the window is drawn at one scale, and
 *     none of them was justified to a page: each front sheet says it was
 *     engraved at its bars' natural widths (`data-stretch="natural"`). The
 *     proxy is named: the sheet's own flag stands for "the notes are as far
 *     apart as the engraver sets them", which the glass cannot see directly;
 *     the equal scales are measured.
 * (b) **As big as allowed.** The window's ink reaches across the stage or
 *     down it, or (over 100 % Size) the sheets are at the scale Size asked for.
 * (c) **The next bar is in view**, or there is measurably no room for it at
 *     the window's scale — no row's height free below the ink and no bar's
 *     width free right of it — and the cell says so in its annotation. A
 *     window that has every sheet the renderer made in use, with a row's room
 *     below, is a fault while fewer than `MAX_SLOTS` were made: a long piece
 *     is given the sheets its settled shape needs (U32a), so a shape with room
 *     for the next row that has no sheet for it is a sheet the renderer should
 *     have priced and made (U32; T38 wrote it as a note, on the reading that a
 *     piece past the probe's reach gets two sheets by design). With all
 *     `MAX_SLOTS` in use it stays a note, naming that cap.
 * (d) **The count**: the asked bars are inked at the window's first bar, or
 *     the `⋯` sheet's row says in words that fewer are shown.
 * (e) **The floor**: the shortest staff on the glass clears `MIN_STAFF_PX`,
 *     a staff being its five lines (T38: it was the `.staffline` group's box,
 *     notes and fingerings included, 1.8 to 2 times the lines).
 * (f) **The steppers still do something.** Two Bars settings or two Size
 *     settings that draw the same picture are a fault unless the screen says
 *     why: the piece is shorter than both, the row says fewer are shown, or
 *     the music is already bound by the stage (a bigger Size) or the floor (a
 *     smaller one).
 * (g) **Rows never overlap** (U110, `responses/9e14839e.md` §3): no drawn
 *     row's ink, chord symbols and fingering included, reaches into the ink
 *     of the row below it at the size it is drawn.
 *
 * The only literals are the code's own (`MIN_STAFF_PX`) and fractions of a
 * measurement of the same screen (`00-invariants` §2).
 *
 * Bars are counted from **inked note elements the browser says are visible**,
 * because in Blind mode the buffers are drawn and hidden (`pending-review`
 * Entry 60). A bar of rests has no note element and is not counted.
 */
import { expect, test, type Page } from '@playwright/test';

import { installMidiMock } from './fixtures/midiMock';
import { pressControl, withScoreMenu } from './scoreControls';

/** The five shapes T30 shot, so a red line here names a cell over there. */
const SHAPES = [
  { name: 'phone-upright-342', width: 342, height: 740 },
  { name: 'phone-upright-390', width: 390, height: 844 },
  { name: 'phone-sideways', width: 740, height: 342 },
  { name: 'tablet-upright', width: 768, height: 1024 },
  { name: 'tablet-sideways', width: 1024, height: 768 },
];

/**
 * Three of T30's six, chosen off the catalog's measured `notation` fields and
 * not off their titles (`00-invariants` §1a): the sparsest thing the window is
 * asked to hold, the simple two-hand song, and the densest grand staff.
 */
const PIECES = [
  { id: 'exercise.five-finger.c-major.right', short: 'five-finger' },
  { id: 'song.folk.twinkle.ht', short: 'twinkle' },
  { id: 'song.classical.chopin-nocturne-op48-1.nifc', short: 'nocturne-48' },
];

/** Both ends of the stepper and two in between — 1 is where read-ahead is weakest. */
const BARS = [1, 2, 4, 8];

/**
 * `WindowRenderer.MIN_STAFF_PX` — the code's own floor, in the unit it is
 * written in: the five lines, top line to bottom line (T38). Mirrored rather
 * than imported, because importing the renderer drags the engraver into the
 * test runner.
 */
const MIN_STAFF_PX = 22;

/**
 * `WindowRenderer.MAX_SLOTS` — the most sheets the renderer makes for any
 * piece. A short piece has them all from `create`; a long one has two, then
 * the ones its settled shape needs, priced once it is measured (U32, U32a).
 * Mirrored for the same reason as `MIN_STAFF_PX`.
 */
const MAX_SLOTS = 4;

/**
 * How near an edge counts as touching it: the fit keeps a margin, and a row's
 * ink is a little shorter than the tallest system in the piece that sized it.
 */
const TOUCH_WIDTH = 0.85;
const TOUCH_HEIGHT = 0.8;
/**
 * The height term prices the piece's **tallest** system, so the size does not
 * change from one window to the next during a run (`09` §1); a window shorter
 * than that leaves the difference empty. Held to half the stage, not 0.8.
 */
const TOUCH_HEIGHT_BY_TALLEST = 0.5;
/** A row below needs its own height and the gap between rows. */
const ROW_AND_GAP = 1.1;
/** Two sheets drawn "at one scale" may differ by rounding, no more. */
const SAME_SCALE = 0.01;
/**
 * A bar drawn wider than its natural width by more than line widths and
 * rounding is spread: a justified bar is drawn at the page's width, twice its
 * natural width or more on the cell that found it.
 */
const SPACED_AS_ENGRAVED = 1.03;

interface Row {
  left: number;
  right: number;
  top: number;
  bottom: number;
  bars: number;
}

interface Sheet {
  scale: number;
  stretch: string;
  classes: string;
  slot: number;
  /** Every painted mark of the sheet on the glass, text included (chord symbols, fingering). */
  ink: { left: number; right: number; top: number; bottom: number } | null;
  measures: { id: string; left: number; right: number; span: number }[];
}

/** One laid-out bar, as the renderer's `debugFit().slots[i].bars` reports it from the engraver's model. */
interface LaidBar {
  number: number;
  bar: number;
  natural: number;
}

interface Glass {
  stage: { left: number; top: number; width: number; height: number } | null;
  /** Distinct printed bars with an inked, visible note on the stage. */
  barsInk: number[];
  /** Per drawn system: its ink box (notes and stave lines) and the bars inked in it. */
  rows: Row[];
  /**
   * Per front sheet with ink on the stage: its CSS scale, how it says it was
   * engraved, its slot, its whole ink across, and every bar's stave on the
   * glass — the thin horizontal strokes each `.vf-measure` draws, which are
   * the five lines and nothing else — keyed by the engraver's measure number.
   */
  sheets: Sheet[];
  cursorBar: number | null;
  lastBar: number | null;
  stavePx: number | null;
  /** What the renderer says: its window, which term sized it, and the ceiling's scale. */
  shape: {
    slots: number | null;
    systems: number | null;
    shown: number | null;
    readAhead: string | null;
    fitBy: string | null;
    ceilingScale: number | null;
    /** The height the renderer reserves for one row (the piece's tallest system, drawn). */
    rowPx: number | null;
    /** How many sheets the renderer has to draw rows into (a long piece: two from `create`, the rest after the first window, U32). */
    sheetsAvailable: number | null;
    /** Per slot index, the bars the engraver laid out, with their natural widths. */
    laid: (LaidBar[] | null)[];
  };
}

/** Everything this spec asserts on, in one pass over the DOM. */
async function readGlass(page: Page): Promise<Glass> {
  return page.evaluate(() => {
    const stageEl = document.querySelector<HTMLElement>('#score-stage');
    const stage = stageEl?.getBoundingClientRect() ?? null;
    const shown = (el: Element): boolean =>
      typeof (el as { checkVisibility?: (o: unknown) => boolean }).checkVisibility === 'function'
        ? (el as unknown as { checkVisibility: (o: unknown) => boolean }).checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          })
        : true;
    const stageVisible =
      !!stageEl && stage !== null && stage.width > 0 && stage.height > 0 && !stageEl.hidden && shown(stageEl);
    const overlaps = (b: DOMRect): boolean =>
      stage !== null &&
      b.width > 0 &&
      b.height > 0 &&
      b.right > stage.left + 0.5 &&
      b.left < stage.right - 0.5 &&
      b.bottom > stage.top + 0.5 &&
      b.top < stage.bottom - 0.5;

    const buffers = stageVisible
      ? [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer:not(.score-probe)')].filter(
          (el) => el.classList.contains('is-front') && !el.hidden && shown(el) && overlaps(el.getBoundingClientRect()),
        )
      : [];

    const all = new Set<number>();
    const rows: { left: number; right: number; top: number; bottom: number; bars: number }[] = [];
    const sheets: {
      scale: number;
      stretch: string;
      classes: string;
      slot: number;
      ink: { left: number; right: number; top: number; bottom: number } | null;
      measures: { id: string; left: number; right: number; span: number }[];
    }[] = [];
    for (const buffer of buffers) {
      const here = new Set<number>();
      let left = Number.POSITIVE_INFINITY;
      let right = Number.NEGATIVE_INFINITY;
      let top = Number.POSITIVE_INFINITY;
      let bottom = Number.NEGATIVE_INFINITY;
      const grow = (box: DOMRect): void => {
        left = Math.min(left, box.left);
        right = Math.max(right, box.right);
        top = Math.min(top, box.top);
        bottom = Math.max(bottom, box.bottom);
      };
      for (const note of buffer.querySelectorAll<HTMLElement>('.score-note')) {
        const bar = Number(note.dataset.bar);
        if (!Number.isFinite(bar)) continue;
        const box = note.getBoundingClientRect();
        if (!overlaps(box)) continue;
        here.add(bar);
        all.add(bar);
        grow(box);
      }
      if (here.size === 0) continue;
      for (const line of buffer.querySelectorAll<SVGGraphicsElement>('.staffline')) {
        const box = line.getBoundingClientRect();
        if (overlaps(box)) grow(box);
      }
      rows.push({ left, right, top, bottom, bars: here.size });
      // The sheet's own transform, wherever the renderer put it.
      const host = buffer.style.transform ? buffer : (buffer.querySelector<HTMLElement>('[style*="scale"]') ?? buffer);
      const match = /scale\(([\d.]+)\)/.exec(host.style.transform);
      const holder = buffer.dataset.stretch ? buffer : (buffer.querySelector<HTMLElement>('[data-stretch]') ?? buffer);
      // The sheet's whole ink across, on the glass, clipped by nothing; and
      // down, text included (U110: a row's chord symbols and fingering are
      // what reached into the row above). Down skips a mark taller than the
      // stage, which belongs to no row: the engraver's path for a tie across a
      // system break, drawn from where the note was on the line before.
      let inkLeft = Number.POSITIVE_INFINITY;
      let inkRight = Number.NEGATIVE_INFINITY;
      let inkTop = Number.POSITIVE_INFINITY;
      let inkBottom = Number.NEGATIVE_INFINITY;
      for (const node of buffer.querySelectorAll('svg path, svg rect, svg text')) {
        const box = node.getBoundingClientRect();
        if (box.width <= 0 && box.height <= 0) continue;
        inkLeft = Math.min(inkLeft, box.left);
        inkRight = Math.max(inkRight, box.right);
        if (stage !== null && box.height > stage.height) continue;
        inkTop = Math.min(inkTop, box.top);
        inkBottom = Math.max(inkBottom, box.bottom);
      }
      // Each bar's stave: its five lines, the unit of "staff" (`08` §9).
      const measures: { id: string; left: number; right: number; span: number }[] = [];
      for (const measure of buffer.querySelectorAll<SVGGElement>('.vf-measure')) {
        const lines: DOMRect[] = [];
        for (const line of measure.querySelectorAll(':scope > path')) {
          const box = line.getBoundingClientRect();
          if (box.height <= 1.5 && box.width >= 10) lines.push(box);
        }
        if (lines.length < 5) continue;
        const ys = lines.map((b) => b.top + b.height / 2);
        measures.push({
          id: measure.id,
          left: Math.min(...lines.map((b) => b.left)),
          right: Math.max(...lines.map((b) => b.right)),
          span: Math.max(...ys) - Math.min(...ys),
        });
      }
      sheets.push({
        scale: match ? Number(match[1]) : 0,
        stretch: holder.dataset.stretch ?? '',
        classes: [...buffer.classList].filter((c) => c.startsWith('is-')).sort().join(' '),
        slot: Number(buffer.dataset.slot),
        ink:
          Number.isFinite(inkLeft) && Number.isFinite(inkTop)
            ? { left: inkLeft, right: inkRight, top: inkTop, bottom: inkBottom }
            : null,
        measures,
      });
    }

    const hooks = window as unknown as {
      __pianopath?: {
        scoreRun?: () => { bar?: number; lastBar?: number } | null;
        scoreFit?: () => {
          sourceMeasureCount?: number;
          slotCount?: number;
          systemsPerWindow?: number;
          barsShown?: number;
          readAhead?: string;
          ceilingScale?: number;
          rowPx?: number;
          slots?: { bars?: { number: number; bar: number; natural: number }[] }[];
        } | null;
      };
    };
    const run = hooks.__pianopath?.scoreRun?.() ?? null;
    const currentNote = document.querySelector<HTMLElement>(
      '#score-stage .score-buffer.is-front .score-note.is-current',
    );
    const sorted = [...all].sort((a, b) => a - b);
    const cursorBar =
      typeof run?.bar === 'number'
        ? run.bar
        : currentNote && Number.isFinite(Number(currentNote.dataset.bar))
          ? Number(currentNote.dataset.bar)
          : (sorted[0] ?? null);
    const fit = hooks.__pianopath?.scoreFit?.() ?? null;
    const count = fit?.sourceMeasureCount;
    const lastBar =
      typeof run?.lastBar === 'number' ? run.lastBar : typeof count === 'number' && count > 0 ? count - 1 : null;

    // The staff is its five lines (`08` §9, T38): the thin horizontal strokes
    // each `.vf-measure` draws, top line to bottom line, the same thing the
    // renderer's floor measures. Not the `.staffline` group's box, which holds
    // the notes, stems and fingerings too and was 1.8 to 2 times the lines.
    let stavePx: number | null = null;
    for (const buffer of buffers) {
      for (const measure of buffer.querySelectorAll('.vf-measure')) {
        const ys: number[] = [];
        for (const line of measure.querySelectorAll(':scope > path')) {
          const box = line.getBoundingClientRect();
          if (box.height <= 1.5 && box.width >= 10 && overlaps(new DOMRect(box.left, box.top - 1, box.width, box.height + 2)))
            ys.push(box.top + box.height / 2);
        }
        if (ys.length < 5) continue;
        const span = Math.max(...ys) - Math.min(...ys);
        stavePx = stavePx === null ? span : Math.min(stavePx, span);
      }
    }
    const round = (n: number): number => Math.round(n * 10) / 10;
    return {
      stage: stage
        ? { left: round(stage.left), top: round(stage.top), width: round(stage.width), height: round(stage.height) }
        : null,
      barsInk: sorted,
      rows: rows.map((r) => ({ left: round(r.left), right: round(r.right), top: round(r.top), bottom: round(r.bottom), bars: r.bars })),
      sheets,
      cursorBar,
      lastBar,
      stavePx: stavePx === null ? null : round(stavePx),
      shape: {
        slots: typeof fit?.slotCount === 'number' ? fit.slotCount : null,
        systems: typeof fit?.systemsPerWindow === 'number' ? fit.systemsPerWindow : null,
        shown: typeof fit?.barsShown === 'number' ? fit.barsShown : null,
        readAhead: typeof fit?.readAhead === 'string' ? fit.readAhead : null,
        fitBy: stageEl?.dataset.fit ?? null,
        ceilingScale: typeof fit?.ceilingScale === 'number' ? fit.ceilingScale : null,
        rowPx: typeof fit?.rowPx === 'number' ? fit.rowPx : null,
        sheetsAvailable: Array.isArray(fit?.slots) ? fit.slots.length : null,
        laid: Array.isArray(fit?.slots)
          ? fit.slots.map((slot) =>
              Array.isArray(slot.bars) ? slot.bars.map((b) => ({ number: b.number, bar: b.bar, natural: b.natural })) : null,
            )
          : [],
      },
    };
  });
}

/** Waits for the fit to stop moving, the way `score.fill.spec.ts` does. */
async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(200);
  // **And for the renderer's own word (U32; Q30's part for this file).** A long
  // piece's later sheets load on idle after it is measured (U32a), and the
  // shape holds still while they load, so the poll below can see three equal
  // readings before the re-plan that brings the next row. `data-settled` is
  // withheld until they have landed and the re-plan has run. Bounded and never
  // a failure on its own: the poll still decides.
  await page.waitForSelector('.score-view[data-settled]', { timeout: 30_000 }).catch(() => undefined);
  await page
    .waitForFunction(
      () => {
        const hooks = window as unknown as {
          __pianopath?: { scoreFit?: () => { zoom?: number; barsShown?: number; slotCount?: number } | null };
        };
        const fit = hooks.__pianopath?.scoreFit?.();
        if (typeof fit?.zoom !== 'number') return false;
        const key = `${String(fit.zoom)}|${String(fit.barsShown)}|${String(fit.slotCount)}|${
          document.querySelector<HTMLElement>('#score-stage .score-buffer.is-front')?.style.transform ?? ''
        }`;
        const seen = window as unknown as { __wrKey?: string; __wrSame?: number };
        if (seen.__wrKey === key) seen.__wrSame = (seen.__wrSame ?? 0) + 1;
        else {
          seen.__wrKey = key;
          seen.__wrSame = 0;
        }
        return (seen.__wrSame ?? 0) >= 3;
      },
      undefined,
      { timeout: 30_000, polling: 200 },
    )
    .catch(() => undefined);
  await page.evaluate(() => {
    const seen = window as unknown as { __wrKey?: string; __wrSame?: number };
    delete seen.__wrKey;
    delete seen.__wrSame;
  });
  await page.waitForTimeout(250);
}

async function openPiece(page: Page, id: string): Promise<void> {
  await page.goto(`/#/score/${id}`);
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 90_000 });
  await page
    .waitForFunction(
      () => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      },
      undefined,
      { timeout: 90_000 },
    )
    .catch(() => undefined);
  await settle(page);
}

/**
 * Sets the stepper through its own buttons, and stops when one goes dead.
 * A click on a button that never enables retries until the budget is gone.
 */
async function setBars(page: Page, bars: number): Promise<void> {
  await withScoreMenu(page, async () => {
    const down = page.locator('#score-bars-down');
    for (let i = 0; i < 8 && (await down.isEnabled()); i += 1) await down.click();
    const up = page.locator('#score-bars-up');
    for (let i = 1; i < bars && (await up.isEnabled()); i += 1) await up.click();
  });
  await settle(page);
}

/** One press of a Size button, if it is live. */
async function pressSize(page: Page, which: 'in' | 'out'): Promise<boolean> {
  const selector = `#score-zoom-${which}`;
  let pressed = false;
  await withScoreMenu(page, async () => {
    const button = page.locator(selector);
    if ((await button.count()) > 0 && (await button.isEnabled())) {
      await button.click();
      pressed = true;
    }
  });
  if (!pressed) {
    // Some layouts keep Size on the bar rather than in the sheet.
    const button = page.locator(selector);
    if ((await button.count()) > 0) {
      await pressControl(page, selector);
      pressed = true;
    }
  }
  await settle(page);
  return pressed;
}

/** What the stepper's row says, label and sentence together. */
async function rowWords(page: Page): Promise<string> {
  let words = '';
  await withScoreMenu(page, async () => {
    const row = page.locator('#score-bars-row');
    words = (await row.count()) > 0 ? ((await row.textContent()) ?? '') : '';
  });
  return words;
}

/** What the learner sees, reduced to what a stepper could change. */
function picture(glass: Glass): string {
  return JSON.stringify([
    glass.stavePx,
    glass.barsInk,
    glass.rows.map((r) => [Math.round(r.right - r.left), Math.round(r.bottom - r.top)]),
    // A greyed look-ahead row and a window row are different pictures.
    glass.sheets.map((s) => s.classes),
  ]);
}

/** The row's `N asked, M shown`, or the stepper's own number when it says nothing. */
function sentence(words: string, asked: number): { promised: number; held: number; said: boolean } {
  const said = /(\d+)\s+asked,\s*(\d+)\s+shown/i.exec(words);
  return said
    ? { promised: Number(said[1]), held: Number(said[2]), said: true }
    : { promised: asked, held: asked, said: false };
}

/**
 * (g) — rows drawn into each other (U110): in reading order, each drawn row's
 * ink against the ink of the row below it, text included. Half a pixel is
 * rounding. The 360 x 780 reload that found it ran each row's chord symbols
 * and fingering most of a staff into the row above.
 */
function rowsDrawnIntoEachOther(glass: Glass): string[] {
  const inked = glass.sheets
    .filter((s): s is Sheet & { ink: NonNullable<Sheet['ink']> } => s.ink !== null)
    .sort((a, b) => a.ink.top - b.ink.top);
  const out: string[] = [];
  for (let k = 0; k + 1 < inked.length; k += 1) {
    const upper = inked[k];
    const lower = inked[k + 1];
    const into = upper.ink.bottom - lower.ink.top;
    if (into > 0.5) {
      out.push(
        `(g) rows drawn into each other: slot ${String(upper.slot)} (${upper.classes || 'window'}) inks to ${upper.ink.bottom.toFixed(1)}, ` +
          `${into.toFixed(1)} px into slot ${String(lower.slot)} (${lower.classes || 'window'}) inked from ${lower.ink.top.toFixed(1)}`,
      );
    }
  }
  return out;
}

/** One cell's verdict: the fault groups it falls into, named by letter. */
function faultsOf(glass: Glass, asked: number, words: string, notes: string[]): string[] {
  const out: string[] = [];
  const { stage, stavePx, rows, sheets, barsInk, cursorBar, lastBar } = glass;
  if (stavePx === null || stage === null || rows.length === 0) return ['nothing drawn'];

  // (g) — no row drawn into another.
  out.push(...rowsDrawnIntoEachOther(glass));

  // (a) — no stretch: one scale, and every sheet engraved at natural widths.
  const scales = sheets.map((s) => s.scale).filter((s) => s > 0);
  if (scales.length > 1 && Math.max(...scales) > Math.min(...scales) * (1 + SAME_SCALE)) {
    out.push(`(a) stretched: systems drawn at ${scales.map((s) => s.toFixed(3)).join(' / ')}`);
  }
  const justified = sheets.filter((s) => s.stretch !== 'natural');
  if (justified.length > 0) {
    out.push(`(a) stretched: ${justified.map((s) => s.stretch || 'unsaid').join('/')} sheet, not natural`);
  }
  // (a), read from the outcome (T38, fault C): every bar on the glass is drawn
  // at the width the engraver gives its notes at natural spacing, times the
  // sheet's one scale. The flag above says what the draw *asked* for; this
  // says what came out — a row the engraver wrapped onto two systems has its
  // first system justified to the page, and the flag used to say `natural`
  // over a bar spread across the whole row.
  for (const sheet of sheets) {
    const laid = glass.shape.laid[sheet.slot];
    if (!laid || !(sheet.scale > 0)) continue;
    const told = new Set<number>();
    for (const measure of sheet.measures) {
      const bar = laid.find((b) => String(b.number) === measure.id);
      // A grand staff draws each bar once per stave; one line per bar.
      if (!bar || !(bar.natural > 0) || told.has(bar.bar)) continue;
      const drawn = (measure.right - measure.left) / sheet.scale;
      if (drawn > bar.natural * SPACED_AS_ENGRAVED) {
        told.add(bar.bar);
        out.push(
          `(a) stretched: bar ${String(bar.bar + 1)} drawn ${String(Math.round(drawn))} px wide at the sheet's scale, ` +
            `where the engraver's natural width is ${String(Math.round(bar.natural))} (x${(drawn / bar.natural).toFixed(2)})`,
        );
      }
    }
  }

  // (b) — as big as allowed: touches the width or the height, or at the ceiling.
  const inkLeft = Math.min(...rows.map((r) => r.left));
  const inkRight = Math.max(...rows.map((r) => r.right));
  const inkTop = Math.min(...rows.map((r) => r.top));
  const inkBottom = Math.max(...rows.map((r) => r.bottom));
  const touchesWidth = inkRight - inkLeft >= stage.width * TOUCH_WIDTH || inkRight >= stage.left + stage.width;
  const fitBy = glass.shape.fitBy;
  const touchesHeight =
    inkBottom - inkTop >= stage.height * (fitBy === 'height' ? TOUCH_HEIGHT_BY_TALLEST : TOUCH_HEIGHT);
  // Sideways the slide prices the width: the bar being played and the next
  // one's first beat must fit right of the slide target (`readAheadScale`),
  // which is the width bound of that arrangement, not a smaller-than-allowed.
  const boundByReadAhead = fitBy === 'read-ahead';
  // At the ceiling: the sheets are drawn at the scale the Size setting caps.
  const ceiling = glass.shape.ceilingScale;
  const atCeiling = ceiling !== null && ceiling > 0 && scales.length > 0 && Math.min(...scales) >= ceiling * (1 - SAME_SCALE);
  if (!touchesWidth && !touchesHeight && !atCeiling && !boundByReadAhead) {
    out.push(
      `(b) smaller than allowed: ink ${String(Math.round(inkRight - inkLeft))} x ${String(Math.round(inkBottom - inkTop))} ` +
        `in ${String(stage.width)} x ${String(stage.height)}, staff ${String(stavePx)}, scale ${scales.map((x) => x.toFixed(3)).join('/')} under a ceiling of ${String(ceiling)}`,
    );
  }

  // (e) — the floor.
  if (stavePx < MIN_STAFF_PX) out.push(`(e) under the floor: ${String(stavePx)} px staff`);
  if (cursorBar === null) out.push('the screen does not say which bar the cursor is on');
  if (lastBar === null) out.push('the screen does not say how long the piece is');

  // (d) — the count, as the screen tells it.
  const { promised, held } = sentence(words, asked);
  if (cursorBar !== null && lastBar !== null) {
    const wanted: number[] = [];
    for (let bar = cursorBar; bar < cursorBar + held && bar <= lastBar; bar += 1) wanted.push(bar);
    const missing = wanted.filter((bar) => !barsInk.includes(bar));
    if (missing.length > 0) {
      out.push(`(d) ${String(held)} bars promised, ${String(wanted.length - missing.length)} of them drawn`);
    }
    if (held < asked && promised !== asked) {
      out.push(`(d) the row says ${String(promised)} asked where the stepper says ${String(asked)}`);
    }
  }

  // (c) — reading order: every greyed look-ahead row is below every row of
  // the window. A look-ahead row above the row being played cannot be read past.
  const aheadRows = rows.filter((_, i) => sheets[i]?.classes.includes('is-ahead'));
  const windowRows = rows.filter((_, i) => !sheets[i]?.classes.includes('is-ahead'));
  if (aheadRows.length > 0 && windowRows.length > 0) {
    const lowestWindow = Math.max(...windowRows.map((r) => r.top));
    const highestAhead = Math.min(...aheadRows.map((r) => r.top));
    if (highestAhead < lowestWindow) {
      out.push(
        `(c) out of reading order: a look-ahead row at ${String(highestAhead)} px above a window row at ${String(lowestWindow)} px`,
      );
    }
  }

  // (c) — the next bar, or measurably no room for it at this scale.
  const windowLast = cursorBar !== null && lastBar !== null ? Math.min(cursorBar + held - 1, lastBar) : null;
  if (windowLast !== null && windowLast < (lastBar ?? 0) && Math.max(...barsInk) <= windowLast) {
    // A row below is priced at the taller of the rows on the glass and the
    // renderer's own reserve (the piece's tallest system at this scale): the
    // next row may be that tall, and a row that overflowed the stage would
    // not be "in view".
    const rowHeight = Math.max(...rows.map((r) => r.bottom - r.top), glass.shape.rowPx ?? 0);
    const barWidth = Math.max(...rows.map((r) => (r.right - r.left) / Math.max(1, r.bars)));
    const freeBelow = stage.top + stage.height - inkBottom;
    const lastRow = rows.reduce((a, b) => (b.bottom > a.bottom ? b : a));
    const freeRight = stage.left + stage.width - lastRow.right;
    // Priced the way the renderer prices it: every row at the reserve, so
    // the room below is the stage less one reserve per window row. The glass
    // can show more free than this when the window's rows are shorter than
    // the piece's tallest system; that gap is recorded in the notes, not
    // passed silently (T34: the reserve keeps one size for the whole run).
    const byReserve = stage.height - rows.length * rowHeight * ROW_AND_GAP;
    const roomBelow = byReserve >= rowHeight * ROW_AND_GAP;
    if (!roomBelow && freeBelow >= rowHeight * ROW_AND_GAP) {
      notes.push(
        `short rows, no reserve: ${String(Math.round(freeBelow))} px free below on the glass, a row is reserved ${String(
          Math.round(rowHeight),
        )}`,
      );
    }
    const roomRight = freeRight >= barWidth;
    const sheetsSpent =
      glass.shape.sheetsAvailable !== null && (glass.shape.slots ?? 0) >= glass.shape.sheetsAvailable;
    if (roomBelow && sheetsSpent && glass.shape.readAhead === 'slots') {
      if ((glass.shape.sheetsAvailable ?? 0) < MAX_SLOTS) {
        // **Revised for U32 (class: revise), and for U32a.** T38 read this as
        // "a piece longer than the probe's reach is given two sheets, not
        // four, by design" and wrote a note. The two were a first-paint guard,
        // not a rule about the look-ahead: `create` still makes two for such a
        // piece, and the sheets its settled shape needs are made once it is
        // measured (U32a: priced, not every one up to `MAX_SLOTS`). A window
        // that fills every sheet made, fewer than the renderer can make, with
        // a row's room below, is a next row the renderer should have priced
        // and given a sheet — or priced as having no room where this spec's
        // reserve finds one; either way no next bar with room for it.
        out.push(
          `(c) no sheet made for the next row: ${String(glass.shape.slots)} of ${String(
            glass.shape.sheetsAvailable,
          )} in use, fewer than the ${String(MAX_SLOTS)} the renderer can make, ${String(Math.round(freeBelow))} px free below`,
        );
      } else {
        // Every sheet the renderer ever makes is in use (`MAX_SLOTS`), and
        // whatever room is left below, or to the right, has no sheet to draw
        // the next row into. The cap is the renderer's, not this piece's.
        notes.push(
          `NOT BUILT, MAX_SLOTS: all ${String(glass.shape.sheetsAvailable)} sheets in use, ${String(
            Math.round(freeBelow),
          )} px free below`,
        );
      }
    } else if (!roomBelow && roomRight && glass.shape.readAhead === 'slots') {
      // Rule 2's first branch — the next bar on the same row — exists only in
      // the sideways chunk. Upright rows are not extended past the window
      // (not built in T34); the cell says so rather than passing silently.
      notes.push(
        `NOT BUILT, same-row look-ahead upright: ${String(Math.round(freeRight))} px free right, a bar is ${String(
          Math.round(barWidth),
        )}`,
      );
    } else if (roomBelow || roomRight) {
      out.push(
        `(c) nothing ahead with room for it: ${String(Math.round(freeBelow))} px free below (a row is ${String(
          Math.round(rowHeight),
        )}), ${String(Math.round(freeRight))} px free right (a bar is ${String(Math.round(barWidth))})`,
      );
    } else {
      notes.push(
        `no room ahead: ${String(Math.round(freeBelow))} px below < a ${String(Math.round(rowHeight))} px row, ` +
          `${String(Math.round(freeRight))} px right < a ${String(Math.round(barWidth))} px bar`,
      );
    }
  }
  return out;
}

for (const shape of SHAPES) {
  test(`the window rule holds on ${shape.name}`, async ({ page }) => {
    test.setTimeout(360_000);
    await page.setViewportSize({ width: shape.width, height: shape.height });
    const faults: string[] = [];
    const notes: string[] = [];
    for (const piece of PIECES) {
      await openPiece(page, piece.id);
      const seen: {
        asked: number;
        picture: string;
        held: number;
        said: boolean;
        lastBar: number | null;
        whole: boolean;
      }[] = [];
      for (const asked of BARS) {
        await setBars(page, asked);
        const glass = await readGlass(page);
        const words = await rowWords(page);
        const where = `${shape.name} ${piece.short} ${String(asked)} bars`;
        const said = `[${String(glass.shape.slots)} systems on the stage, ${String(glass.shape.systems)} of them the window, ${String(glass.shape.shown)} bars shown, fit by ${String(glass.shape.fitBy)}, staff ${String(glass.stavePx)}, ink in ${glass.barsInk.join('/')}]`;
        const cellNotes: string[] = [];
        for (const fault of faultsOf(glass, asked, words, cellNotes)) faults.push(`${where} — ${fault} ${said}`);
        for (const note of cellNotes) notes.push(`${where} — ${note}`);
        const { held, said: told } = sentence(words, asked);
        const whole =
          glass.lastBar !== null && glass.barsInk.length > 0 && glass.barsInk.length >= glass.lastBar + 1;
        seen.push({ asked, picture: picture(glass), held, said: told, lastBar: glass.lastBar, whole });

        // (f) — Size, on the two-bar window: a step each way re-fits at once.
        if (asked === 2) {
          const before = picture(glass);
          const fitBy = glass.shape.fitBy;
          const shownBefore = glass.shape.shown;
          // Already bound by the stage with nothing left to yield: one row,
          // or one bar in every row — or one row the height binds, where fewer
          // bars on it draw no larger (T38: over 100 % the renderer no longer
          // gives up a bar for nothing, which is what drew a different picture
          // here before, at the same size).
          const oneRow =
            glass.shape.readAhead === 'single' ||
            shownBefore === 1 ||
            glass.rows.every((r) => r.bars === 1) ||
            (glass.rows.length === 1 && fitBy === 'height');
          const atFloor = glass.stavePx !== null && glass.stavePx <= MIN_STAFF_PX * 1.1;
          if (await pressSize(page, 'in')) {
            const up = await readGlass(page);
            if (picture(up) === before && !(fitBy !== 'size' && oneRow)) {
              faults.push(`${where} — (f) Size + drew the same picture, fit by ${String(fitBy)} ${said}`);
            }
            await pressSize(page, 'out');
          }
          if (await pressSize(page, 'out')) {
            const down = await readGlass(page);
            if (picture(down) === before && !atFloor) {
              faults.push(`${where} — (f) Size − drew the same picture at a ${String(glass.stavePx)} px staff ${said}`);
            }
            await pressSize(page, 'in');
          }
        }
      }
      // (f) — Bars: neighbouring settings draw different pictures, or the screen says why.
      for (let i = 1; i < seen.length; i += 1) {
        const a = seen[i - 1];
        const b = seen[i];
        if (a.picture !== b.picture) continue;
        const pieceBars = a.lastBar === null ? Infinity : a.lastBar + 1;
        const pieceShorter = pieceBars <= a.asked;
        const toldFewer = b.said && b.held === a.held;
        // The whole piece is on the glass in both, so there is nothing a
        // different count could add.
        const wholePiece = a.whole && b.whole;
        if (!pieceShorter && !toldFewer && !wholePiece) {
          faults.push(
            `${shape.name} ${piece.short} — (f) ${String(a.asked)} and ${String(b.asked)} bars drew the same picture and nothing says why`,
          );
        }
      }
    }
    test.info().annotations.push({ type: 'no room ahead', description: notes.join('\n') || 'none' });
    const groups = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)'].map(
      (g) => `${g} ${String(faults.filter((f) => f.includes(`— ${g}`)).length)}`,
    );
    expect(
      faults,
      `${String(faults.length)} faults (${groups.join(', ')}):\n${faults.join('\n')}\n\nno room ahead:\n${notes.join('\n')}`,
    ).toEqual([]);
  });
}

/**
 * The same stage and the same settings draw the same window, however the
 * learner arrived at them (T38, fault A).
 *
 * The chooser priced every bar at a running maximum of row ink over bars that
 * carried the row's clef, key and time signature and that only a change of
 * engraving zoom released. A one-bar row therefore priced every later window at
 * that zoom as if each bar carried a whole opening: on a tablet held sideways
 * Twinkle's four bars came out as two rows each about a third of the width
 * after the stepper had passed through one bar, and as one row across the
 * stage on a page that had never been stepped.
 */
test('a pass through one bar leaves the tablet sideways window as a fresh page draws it', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.addInitScript(() => {
    const raw = localStorage.getItem('pianopath.settings');
    const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: 4 }));
  });
  await openPiece(page, 'song.folk.twinkle.ht');
  await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 }).catch(() => undefined);
  await settle(page);
  const fresh = await readGlass(page);
  await setBars(page, 1);
  await setBars(page, 4);
  const stepped = await readGlass(page);
  const describe = (g: Glass): string =>
    `${String(g.rows.length)} rows at ${g.sheets.map((s) => s.scale.toFixed(3)).join('/')}, ` +
    `widest ${String(Math.round(Math.max(...g.rows.map((r) => r.right - r.left))))} of ${String(g.stage?.width)}`;
  const said = `fresh: ${describe(fresh)}; after a pass through one bar: ${describe(stepped)}`;
  expect(stepped.rows.length, said).toBe(fresh.rows.length);
  const a = Math.min(...fresh.sheets.map((s) => s.scale));
  const b = Math.min(...stepped.sheets.map((s) => s.scale));
  expect(Math.abs(a - b) / a, said).toBeLessThan(SAME_SCALE);
});

/**
 * The greyed next row costs the window nothing (T38, fault B; `08` §9.7).
 *
 * The window's scale is the largest at which *its own* rows fit the stage.
 * `fitSlots` used to hand the look-ahead row to the fit as well, so a next bar
 * wider than the window's bars sized the window: at 390 x 844 the window was
 * drawn at (stage width − margin) ÷ the greyed row's width. So the widest
 * window row reaches the stage's width, unless the height, the Size setting or
 * the read-ahead is what sized it, and the stage says so.
 */
for (const vp of [
  { width: 390, height: 844 },
  { width: 360, height: 780 },
]) {
  test(`the greyed next row does not size the window at ${String(vp.width)} x ${String(vp.height)}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(vp);
    await openPiece(page, 'song.folk.hot-cross-buns');
    await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 }).catch(() => undefined);
    await settle(page);
    const glass = await readGlass(page);
    const stage = glass.stage;
    expect(stage, 'no stage').not.toBeNull();
    if (!stage) return;
    const windowSheets = glass.sheets.filter((s) => !s.classes.includes('is-ahead') && s.ink !== null);
    expect(windowSheets.length, 'no window row on the glass').toBeGreaterThan(0);
    const widest = Math.max(...windowSheets.map((s) => (s.ink ? s.ink.right - s.ink.left : 0)));
    // The fit insets the ink by six pixels a side (`FIT_MARGIN_PX`); one pixel is rounding.
    const room = stage.width - 12;
    const boundElsewhere = ['height', 'size', 'read-ahead'].includes(glass.shape.fitBy ?? '');
    expect(
      widest >= room - 1 || boundElsewhere,
      `the widest window row is ${widest.toFixed(1)} px of the ${String(room)} px it may use, sized by ${String(glass.shape.fitBy)}; ` +
        `the rows: ${glass.sheets.map((s) => `${s.classes} ${s.ink ? (s.ink.right - s.ink.left).toFixed(1) : '?'}`).join(', ')}`,
    ).toBe(true);
  });
}

/**
 * Rows the window grants never overlap at the size they are drawn, and a
 * fresh load and a reload draw the same window (U110, `responses/9e14839e.md`
 * §3; `docs/review/walks/walk-2026-10-02.md` finding 2).
 *
 * The owner's phone upright, the piano connected, Ode to Joy with both hands:
 * reloads drew three rows at the two-row size, each row's ink running into the
 * next, so its chord symbols and fingering sat inside the row above. The
 * mechanism: each engraving search the settling stage set off fitted the
 * slots at a zoom it tried and then went back to the zoom it kept, and the
 * chooser read that fit's scale against the piece's measurement at the zoom
 * kept; the window's rows came out a little over half their drawn height,
 * and a greyed row was granted on a stage the two rows fill. The next fit
 * took it back, and each grant and each correction spent a rung of the
 * reshape ladder. When the ladder ran out on a grant the three rows stayed,
 * given even shares of that stage. How many searches the stage set off
 * decided it, which is why one load could be clean and the next not. A
 * fresh load and three reloads, each read settled and for every row count
 * the stage held on the way (a row granted and taken back is the mispricing
 * itself, even when the ladder ends on the correction), then a Wait run into
 * its sixth bar, the chrome folded, reading the rows at every bar.
 */
test('rows the window grants never overlap: Ode to Joy at 360 x 780 with the piano, fresh, on reloads and through a run (U110)', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  // Every row count the stage held while it settled, on every load: a greyed row granted and
  // taken back again is the mechanism in motion, a row drawn for a few frames and gone. The
  // observer's records are delivered in batches, so each one's value is read from the record (the
  // value it replaced), and the current value at the end; the document itself is observed, since
  // the init script runs before there is a root element.
  await page.addInitScript(() => {
    const seen: number[] = [];
    (window as unknown as { __u110slots: number[] }).__u110slots = seen;
    new MutationObserver((records) => {
      for (const r of records) if (r.oldValue !== null) seen.push(Number(r.oldValue));
    }).observe(document, { attributes: true, attributeOldValue: true, subtree: true, attributeFilter: ['data-slots'] });
  });
  await page.setViewportSize({ width: 360, height: 780 });
  const faults: string[] = [];
  const shapes: string[] = [];
  const scales: number[] = [];
  const told = (g: Glass): string =>
    `[${String(g.shape.slots)} systems on the stage, ${String(g.shape.systems)} the window, ${String(g.shape.shown)} bars; ` +
    `rows ${g.sheets.map((s) => `${s.classes || 'window'} ${s.ink ? `${s.ink.top.toFixed(0)}..${s.ink.bottom.toFixed(0)}` : '?'}`).join(', ')}; ` +
    `stage ${String(g.stage?.top)}+${String(g.stage?.height)}]`;
  for (let load = 0; load < 4; load += 1) {
    if (load === 0) await openPiece(page, 'song.classical.ode-to-joy.ht');
    else {
      await page.reload();
      await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 90_000 });
      await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 90_000 });
      await settle(page);
    }
    const glass = await readGlass(page);
    const where = load === 0 ? 'fresh' : `reload ${String(load)}`;
    for (const fault of rowsDrawnIntoEachOther(glass)) faults.push(`${where} — ${fault} ${told(glass)}`);
    const counts = await page.evaluate(() => (window as unknown as { __u110slots?: number[] }).__u110slots ?? []);
    if (glass.shape.slots !== null && counts.some((n) => n > (glass.shape.slots ?? 0))) {
      faults.push(
        `${where} — a row granted and taken back while the stage settled: rows ${counts.join(' → ')}, settled at ${String(glass.shape.slots)}`,
      );
    }
    shapes.push(`${String(glass.shape.slots)}/${String(glass.shape.systems)}/${String(glass.shape.shown)}`);
    scales.push(Math.min(...glass.sheets.map((s) => s.scale).filter((s) => s > 0)));
  }
  expect(faults, faults.join('\n')).toEqual([]);
  // A fresh load and a reload are the same window: the same shape at one size.
  expect(new Set(shapes).size, `the shape on each load: ${shapes.join(', ')}`).toBe(1);
  expect((Math.max(...scales) - Math.min(...scales)) / Math.min(...scales), `the size on each load: ${scales.join(', ')}`).toBeLessThan(
    SAME_SCALE,
  );
  // Then the size a run freezes, through the fold, at every bar it enters.
  type Run = { step: number; bar: number; expected: number[]; pitches: number[] };
  type Hooked = Window & { __pianopath?: { scoreRun?: () => Run | null } };
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  await pressControl(page, '#score-play');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  let lastBar = -1;
  for (let i = 0; i < 40; i += 1) {
    const run = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
    if (!run) break;
    if (run.bar !== lastBar) {
      lastBar = run.bar;
      await frames(page);
      const glass = await readGlass(page);
      for (const fault of rowsDrawnIntoEachOther(glass)) faults.push(`run, bar ${String(run.bar + 1)} — ${fault} ${told(glass)}`);
    }
    // The walk's picture was taken in the sixth bar.
    if (run.bar >= 5) break;
    const notes = run.expected.length > 0 ? run.expected : run.pitches;
    for (const m of notes) await midi.noteOn(m, 78);
    await page.waitForTimeout(60);
    for (const m of notes) await midi.noteOff(m);
    await page
      .waitForFunction((was) => (window as Hooked).__pianopath?.scoreRun?.()?.step !== was, run.step, { timeout: 4_000 })
      .catch(() => undefined);
  }
  expect(lastBar, 'the run reached its sixth bar').toBeGreaterThanOrEqual(5);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 10_000 });
  await frames(page);
  const folded = await readGlass(page);
  for (const fault of rowsDrawnIntoEachOther(folded)) faults.push(`run, folded — ${fault} ${told(folded)}`);
  expect(faults, faults.join('\n')).toEqual([]);
});

/**
 * The cell that found fault C, mid-run: phone upright, Chopin's Nocturne op. 48
 * no. 1, four bars. A row's page was `bars × stage width`, and when the run's
 * taller stage raised the engraving zoom two dense bars no longer fitted it, so
 * the engraver broke the row onto two systems and justified the first bar
 * across the whole page. (a)'s outcome check reads it bar by bar. And (c)
 * (U32): the same cell drew its two window rows on the only two sheets a long
 * piece had, and the next music had no row below them.
 */
test('mid-run, every bar on a phone upright Nocturne window is drawn at its natural spacing', async ({ page }) => {
  test.setTimeout(240_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.setViewportSize({ width: 342, height: 740 });
  await openPiece(page, 'song.classical.chopin-nocturne-op48-1.nifc');
  await setBars(page, 4);
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  await pressControl(page, '#score-play');
  await page.waitForTimeout(700);
  type Run = { step: number; bar: number; lastBar: number; expected: number[]; pitches: number[] } | null;
  type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };
  let reached = -1;
  for (let i = 0; i < 40; i += 1) {
    const run = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
    if (run === null) break;
    reached = run.bar;
    if (run.bar > 4 || run.bar >= run.lastBar) break;
    const notes = run.expected.length > 0 ? run.expected : run.pitches;
    for (const note of notes) await midi.noteOn(note, 78);
    await page.waitForTimeout(60);
    for (const note of notes) await midi.noteOff(note);
    const moved = await page
      .waitForFunction(
        (was) => {
          const now = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
          return now === null || now.step !== was;
        },
        run.step,
        { timeout: 4_000 },
      )
      .then(() => true)
      .catch(() => false);
    if (!moved) break;
  }
  expect(reached, 'the run never got past the first window').toBeGreaterThan(3);
  await settle(page);
  const glass = await readGlass(page);
  const stretched = faultsOf(glass, 4, '', []).filter((f) => f.startsWith('(a)'));
  expect(stretched, `at printed bar ${String(reached + 1)}:\n${stretched.join('\n')}`).toEqual([]);
  // **(c) mid-run too (U32, class: revise).** The run froze the arrangement it
  // started with, and a long piece used to start it on two sheets: upright the
  // window filled both and the next music had no row, with half the stage
  // empty below. The run here starts after `settle`, so after the sheet its
  // shape needs has landed (U32a). `faultsOf` reads the window from its first bar, so it is
  // handed the first bar of the window the cursor is in (`slots.windowAt`, a
  // pickup read from the engraver's own numbering) and the count the renderer
  // says it shows, which is what the row would put in words.
  const shown = glass.shape.shown ?? 4;
  const pickup = glass.shape.laid.some((bars) => (bars ?? []).some((b) => b.bar === 0 && b.number === 0));
  const bar = glass.cursorBar ?? 0;
  const windowStart = pickup ? (bar <= shown ? 0 : Math.floor((bar - 1) / shown) * shown + 1) : Math.floor(bar / shown) * shown;
  const words = shown < 4 ? `4 asked, ${String(shown)} shown` : '';
  const aheadFaults = faultsOf({ ...glass, cursorBar: windowStart }, 4, words, []).filter((f) => f.startsWith('(c)'));
  expect(
    aheadFaults,
    `at printed bar ${String(reached + 1)}, the window from bar ${String(windowStart + 1)}, ${String(glass.shape.slots)} of ${String(
      glass.shape.sheetsAvailable,
    )} sheets in use:\n${aheadFaults.join('\n')}`,
  ).toEqual([]);
});

/**
 * Across the look-ahead's breakpoint the window never shrinks as the stage
 * widens (T38, fault B's remainder). Hot Cross Buns at two bars: its third bar
 * is the widest, so on a narrow stage the greyed next row does not fit across
 * at the window's scale and is cut or runs off; somewhere as the stage widens
 * it starts to fit. A treatment that fed back into the window's size would
 * make the size jump there, or flip between two answers. The staff on the
 * glass — the window's five lines, look-ahead rows left out — is read at each
 * width of a sweep, and it must never fall.
 */
test('the window never shrinks as the stage widens across the look-ahead breakpoint', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 360, height: 844 });
  await openPiece(page, 'song.folk.hot-cross-buns');
  const seen: { width: number; staff: number; ahead: string }[] = [];
  for (let width = 360; width <= 1000; width += 40) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 }).catch(() => undefined);
    await settle(page);
    const read = await page.evaluate(() => {
      let staff = Number.POSITIVE_INFINITY;
      for (const buffer of document.querySelectorAll('#score-stage .score-buffer.is-front:not(.is-ahead)')) {
        for (const measure of buffer.querySelectorAll('.vf-measure')) {
          const ys: number[] = [];
          for (const line of measure.querySelectorAll(':scope > path')) {
            const box = line.getBoundingClientRect();
            if (box.height <= 1.5 && box.width >= 10) ys.push(box.top + box.height / 2);
          }
          if (ys.length >= 5) staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
        }
      }
      return { staff, ahead: document.querySelector<HTMLElement>('#score-stage')?.dataset.ahead ?? '?' };
    });
    seen.push({ width, ...read });
  }
  const said = seen.map((s) => `${String(s.width)}: ${s.staff.toFixed(1)} (${s.ahead})`).join(', ');
  for (let i = 1; i < seen.length; i += 1) {
    const a = seen[i - 1];
    const b = seen[i];
    // Rounding, not a size: a hundredth.
    expect(b.staff, `the window shrank as the stage widened: ${said}`).toBeGreaterThanOrEqual(a.staff * 0.99);
  }
  test.info().annotations.push({ type: 'sweep', description: said });
});

/**
 * Mid-run on a phone held sideways, once the chrome has folded, every mark of
 * the music is still on the stage (T38). A run's stage takes the bar's row at
 * Play, the size is frozen a moment later, and the chrome folds a few seconds
 * in — moving the sheet down under the `bar n / m` chip without changing the
 * stage's box. With the height reserve measured exactly (the five lines, not
 * a box that counted the ink above the stave twice) the bass staff's
 * fingerings on Twinkle ran past the stage's bottom; the fold's room is now
 * given from the start of the run.
 */
test('mid-run on a phone sideways, the folded chrome leaves the music on the stage', async ({ page }) => {
  test.setTimeout(240_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.setViewportSize({ width: 740, height: 342 });
  await openPiece(page, 'song.folk.twinkle.ht');
  await setBars(page, 2);
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  await pressControl(page, '#score-play');
  type Run = { step: number; bar: number; lastBar: number; expected: number[]; pitches: number[] } | null;
  type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };
  for (let i = 0; i < 12; i += 1) {
    const run = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
    if (run === null) break;
    const notes = run.expected.length > 0 ? run.expected : run.pitches;
    for (const note of notes) await midi.noteOn(note, 78);
    await page.waitForTimeout(60);
    for (const note of notes) await midi.noteOff(note);
    await page
      .waitForFunction((was) => (window as Hooked).__pianopath?.scoreRun?.()?.step !== was, run.step, { timeout: 4_000 })
      .catch(() => undefined);
  }
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 15_000 });
  await settle(page);
  const seen = await page.evaluate(() => {
    const stage = document.querySelector('#score-stage')!.getBoundingClientRect();
    let bottom = Number.NEGATIVE_INFINITY;
    for (const node of document.querySelectorAll('#score-stage .score-buffer.is-front svg path, #score-stage .score-buffer.is-front svg text, #score-stage .score-buffer.is-front svg rect')) {
      const box = node.getBoundingClientRect();
      if (box.width <= 0 && box.height <= 0) continue;
      bottom = Math.max(bottom, box.bottom);
    }
    return { stageBottom: stage.bottom, inkBottom: bottom };
  });
  expect(
    seen.inkBottom,
    `the music ends ${(seen.inkBottom - seen.stageBottom).toFixed(1)} px past the stage's bottom with the chrome folded`,
  ).toBeLessThanOrEqual(seen.stageBottom + 1);
});

/**
 * Upright, the stacked slots start below the folded chip (U118; the reviewer's ruling,
 * `responses/questions-e9aa51ae.md`, option (iii)). A few seconds into a run the chrome folds and the
 * stage's corner draws `bar n / m` and what the run is saying, over the top of the stage. The slots
 * wrote their own `top` from 0, so the chip covered the first system's clef and fingerings (U105c's
 * pictures, Hot Cross Buns at 342 x 740, paused). Now the first slot starts below the band the chip
 * owns, which is the chip's tallest legitimate state at this width (`debugFit().foldedReserve`).
 *
 * Two paths. A run that starts unfolded is sized on the whole stage and keeps that size, shape and
 * look-ahead through the fold: upright the fold also takes the header away, which gives more height
 * than the band takes, so the fold is placement only. A size taken while the chip is already drawn —
 * turned and turned back while folded — is priced below the band, so the bottom system stays on the
 * stage. And a change of what the chip says never moves anything.
 */
type ChipHooked = Window & {
  __pianopath?: {
    scoreFit?: () => {
      zoom: number;
      frozen: { scale: number } | null;
      foldedReserve?: number;
      slotCount?: number;
      systemsPerWindow?: number;
      barsShown?: number;
      slots?: { range: { fromMeasure: number } | null }[];
    } | null;
    scoreRun?: () => { step: number; bar: number; expected: number[]; pitches: number[] } | null;
  };
};

interface FoldRead {
  chrome: string | null;
  chipShown: boolean;
  /** The chip's bottom edge and lines, in the stage's padding box, where the slots' `top` is. */
  chipBottom: number;
  chipLines: number;
  band: number;
  stageH: number;
  zoom: number;
  scale: number;
  frozen: number | null;
  shape: string;
  /** The drawn slots, top to bottom: their `top`, first bar and whether greyed. */
  placed: { top: number; from: number | null; ahead: boolean }[];
  firstInkTop: number | null;
  inkBottom: number | null;
  /** The score's marks the chip's box meets. */
  under: string[];
}

async function readFold(page: Page): Promise<FoldRead> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    const s = stage.getBoundingClientRect();
    const oy = s.top + stage.clientTop;
    const corner = document.querySelector<HTMLElement>('#score-corner');
    const chipShown = corner !== null && getComputedStyle(corner).display !== 'none';
    const c = chipShown ? corner.getBoundingClientRect() : null;
    let chipLines = 0;
    if (chipShown) {
      const range = document.createRange();
      range.selectNodeContents(corner);
      chipLines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
    }
    const fit = (window as ChipHooked).__pianopath?.scoreFit?.() ?? null;
    const front = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].filter((b) => !b.hidden);
    const placed = front
      .map((b) => ({
        el: b,
        top: Number.parseFloat(getComputedStyle(b).top),
        from: fit?.slots?.[Number(b.dataset.buffer ?? -1)]?.range?.fromMeasure ?? null,
        ahead: b.classList.contains('is-ahead'),
      }))
      .sort((a, b) => a.top - b.top);
    const marks = (root: Element): Element[] =>
      [...root.querySelectorAll('svg text, svg path, svg rect, svg line, svg ellipse, svg polygon')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 || r.height > 0;
      });
    let firstInkTop: number | null = null;
    if (placed[0]) {
      for (const el of marks(placed[0].el)) {
        const top = el.getBoundingClientRect().top - oy;
        firstInkTop = firstInkTop === null ? top : Math.min(firstInkTop, top);
      }
    }
    let inkBottom: number | null = null;
    const under: string[] = [];
    for (const b of front) {
      for (const el of marks(b)) {
        const r = el.getBoundingClientRect();
        inkBottom = inkBottom === null ? r.bottom - oy : Math.max(inkBottom, r.bottom - oy);
        if (c && r.left < c.right && c.left < r.right && r.top < c.bottom && c.top < r.bottom) {
          const cls = (el.getAttribute('class') ?? '') || (el.parentElement?.getAttribute('class') ?? '');
          under.push(`${el.tagName}${cls ? `.${cls.split(' ')[0]}` : ''}${el.tagName === 'text' ? ` "${el.textContent ?? ''}"` : ''}`);
        }
      }
    }
    const cursor = stage.querySelector<HTMLElement>('.score-buffer.is-cursor');
    return {
      chrome: document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.chrome ?? null,
      chipShown,
      chipBottom: c ? c.bottom - oy : 0,
      chipLines,
      band: fit?.foldedReserve ?? 0,
      stageH: stage.clientHeight,
      zoom: fit?.zoom ?? 0,
      scale: cursor ? new DOMMatrixReadOnly(getComputedStyle(cursor).transform).a : 0,
      frozen: fit?.frozen?.scale ?? null,
      shape: `${String(fit?.slotCount)}/${String(fit?.systemsPerWindow)}/${String(fit?.barsShown)}`,
      placed: placed.map(({ top, from, ahead }) => ({ top, from, ahead })),
      firstInkTop,
      inkBottom,
      under,
    };
  });
}

async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))));
}

/** A Wait run started, frozen, paused (read with the chrome open), then left to fold (read again). */
async function pauseAndFold(page: Page): Promise<{ open: FoldRead; folded: FoldRead }> {
  await pressControl(page, '#score-play');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  await page.waitForFunction(() => ((window as ChipHooked).__pianopath?.scoreFit?.()?.frozen ?? null) !== null, undefined, { timeout: 30_000 });
  await pressControl(page, '#score-play');
  await expect(page.locator('#score-play')).toHaveText('▶');
  await page.waitForSelector('.score-view[data-settled]', { timeout: 10_000 }).catch(() => undefined);
  await frames(page);
  const open = await readFold(page);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 10_000 });
  await frames(page);
  await page.waitForTimeout(400);
  return { open, folded: await readFold(page) };
}

/** Checks 1, 2 and 4 of the response: below the chip, nothing under it, reading order, all on the stage. */
function belowTheChip(where: string, folded: FoldRead): void {
  const said = JSON.stringify(folded);
  expect(folded.chipShown, `${where}: the chip is drawn, folded on a phone ${said}`).toBe(true);
  expect(folded.band, `${where}: the band holds the chip as it is now ${said}`).toBeGreaterThanOrEqual(folded.chipBottom - 0.5);
  expect(folded.placed[0]?.top ?? -1, `${where} (1): the first slot starts below the band ${said}`).toBeGreaterThanOrEqual(folded.band);
  expect(folded.firstInkTop ?? -1, `${where} (1): the first system's ink below the chip ${said}`).toBeGreaterThanOrEqual(folded.chipBottom);
  expect(folded.under, `${where} (2): nothing of the score under the chip ${said}`).toEqual([]);
  const froms = folded.placed.map((p) => p.from ?? Number.POSITIVE_INFINITY);
  expect(froms, `${where} (4): the slots in first-bar order ${said}`).toEqual([...froms].sort((a, b) => a - b));
  const firstAhead = folded.placed.findIndex((p) => p.ahead);
  if (firstAhead >= 0) {
    expect(folded.placed.slice(firstAhead).every((p) => p.ahead), `${where} (4): the greyed row below the window ${said}`).toBe(true);
  }
  expect(folded.inkBottom ?? Infinity, `${where} (4): every mark on the stage ${said}`).toBeLessThanOrEqual(folded.stageH + 1);
}

for (const cell of [
  // U105c's layout: the paused run its pictures showed, the chip on two lines.
  { piece: 'song.folk.hot-cross-buns', bars: 2, why: 'U105c’s layout' },
  // A window whose size the height decides, so a fold that sized it again would show.
  { piece: 'exercise.five-finger.c-major.right', bars: 4, why: 'sized by the height' },
]) {
  test(`folded upright, the stacked slots start below the chip and keep the size the run froze (${cell.why})`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.setViewportSize({ width: 342, height: 740 });
    await openPiece(page, cell.piece);
    await setBars(page, cell.bars);
    await page.locator('#score-mode').selectOption('wait');
    await settle(page);
    const rest = await readFold(page);
    // (5) Unfolded: no chip, no band, the first slot at the stage's top.
    expect(rest.chipShown, '(5) at rest: no chip').toBe(false);
    expect([rest.band, rest.placed[0]?.top], `(5) at rest: no band, the first slot at the top ${JSON.stringify(rest)}`).toEqual([0, 0]);
    const { open, folded } = await pauseAndFold(page);
    expect(open.chrome, 'the first read is before the fold').toBe('open');
    expect([open.chipShown, open.band, open.placed[0]?.top], `(5) running, chrome open: as at rest ${JSON.stringify(open)}`).toEqual([false, 0, 0]);
    belowTheChip('paused, folded', folded);
    // (3) The fold places the slots and prices nothing: the shape, the engraving and the size the run froze.
    const said = JSON.stringify({ open, folded });
    expect(folded.shape, `(3) the shape through the fold ${said}`).toBe(open.shape);
    expect(folded.zoom, `(3) the engraving zoom through the fold ${said}`).toBe(open.zoom);
    expect(folded.frozen, `(3) the held size through the fold ${said}`).toBe(open.frozen);
    expect(folded.scale, `(3) the cursor slot's scale through the fold ${said}`).toBeCloseTo(open.scale, 5);
    expect(folded.placed.length, `(4) as many systems after the fold ${said}`).toBe(open.placed.length);
    expect(folded.placed.some((p) => p.ahead), `(4) the greyed next row kept ${said}`).toBe(open.placed.some((p) => p.ahead));
  });
}

test('folded upright after a crossing into the third bar: still below the chip, in reading order', async ({ page }) => {
  test.setTimeout(150_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.setViewportSize({ width: 342, height: 740 });
  await openPiece(page, 'song.folk.hot-cross-buns');
  await setBars(page, 2);
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  await pressControl(page, '#score-play');
  await page.waitForFunction(() => ((window as ChipHooked).__pianopath?.scoreFit?.()?.frozen ?? null) !== null, undefined, { timeout: 30_000 });
  for (let i = 0; i < 16; i += 1) {
    const run = await page.evaluate(() => (window as ChipHooked).__pianopath?.scoreRun?.() ?? null);
    if (run === null || run.bar >= 2) break;
    const notes = run.expected.length > 0 ? run.expected : run.pitches;
    for (const note of notes) await midi.noteOn(note, 78);
    await page.waitForTimeout(60);
    for (const note of notes) await midi.noteOff(note);
    await page.waitForFunction((was) => (window as ChipHooked).__pianopath?.scoreRun?.()?.step !== was, run.step, { timeout: 4_000 }).catch(() => undefined);
  }
  expect(await page.evaluate(() => (window as ChipHooked).__pianopath?.scoreRun?.()?.bar ?? -1), 'the run reached the third bar').toBeGreaterThanOrEqual(2);
  await pressControl(page, '#score-play');
  await expect(page.locator('#score-play')).toHaveText('▶');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 10_000 });
  await frames(page);
  await page.waitForTimeout(400);
  // Checks 1, 2 and 4. Not 3 here: at the third bar's quavers the held size gives way across at the
  // first fit after the crossing (T38, `08` §4.1), which on this path is the fold's — not the band.
  belowTheChip('after a crossing, folded', await readFold(page));
});

test('a size taken while folded: turned and turned back with the chrome folded, the bottom system stays on the stage', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 342, height: 740 });
  await openPiece(page, 'exercise.five-finger.c-major.right');
  await setBars(page, 4);
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  await pauseAndFold(page);
  // A turn lets the run's size go and takes a new one on the stage as it is then — folded, with no
  // header left to give — so that size is priced below the band (rule 3).
  await page.setViewportSize({ width: 740, height: 342 });
  await page.waitForTimeout(1_500);
  await page.setViewportSize({ width: 342, height: 740 });
  await page.waitForFunction(() => ((window as ChipHooked).__pianopath?.scoreFit?.()?.frozen ?? null) !== null, undefined, { timeout: 30_000 });
  await settle(page);
  const turned = await readFold(page);
  expect(turned.chrome, 'still folded after the turns').toBe('folded');
  belowTheChip('turned back, folded', turned);
});

test('what the chip says changes nothing: the band, the slots and the size stay where they were', async ({ page }) => {
  test.setTimeout(150_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.setViewportSize({ width: 342, height: 740 });
  await openPiece(page, 'song.folk.hot-cross-buns');
  await setBars(page, 2);
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  // Three things the run says on one frozen run, each read once the chrome has folded: the run waiting
  // for its first note, nothing at all once it is played (the chip says only `bar 1 / 4`), and paused.
  await pressControl(page, '#score-play');
  await page.waitForFunction(() => ((window as ChipHooked).__pianopath?.scoreFit?.()?.frozen ?? null) !== null, undefined, { timeout: 30_000 });
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 10_000 });
  await frames(page);
  const armed = await readFold(page);
  const run = await page.evaluate(() => (window as ChipHooked).__pianopath?.scoreRun?.() ?? null);
  const first = run && run.expected.length > 0 ? run.expected : (run?.pitches ?? []);
  for (const note of first) await midi.noteOn(note, 78);
  await page.waitForTimeout(60);
  for (const note of first) await midi.noteOff(note);
  await page.waitForFunction((was) => (window as ChipHooked).__pianopath?.scoreRun?.()?.step !== was, run?.step ?? -1, { timeout: 4_000 });
  await frames(page);
  await page.waitForTimeout(300);
  const playing = await readFold(page);
  await pressControl(page, '#score-play');
  await expect(page.locator('#score-play')).toHaveText('▶');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 10_000 });
  await frames(page);
  await page.waitForTimeout(300);
  const paused = await readFold(page);
  const seen = { armed, playing, paused };
  const said = JSON.stringify(seen);
  expect([armed.chrome, playing.chrome, paused.chrome], `each read folded ${said}`).toEqual(['folded', 'folded', 'folded']);
  // What the chip says differs in height: the paused line takes a line more than the other two.
  expect(paused.chipLines, `the paused line is the taller sentence ${said}`).toBeGreaterThan(playing.chipLines);
  for (const [name, after] of Object.entries(seen)) {
    expect(after.band, `${name}: the band is the same whatever the chip says ${said}`).toBe(armed.band);
    expect(after.band, `${name}: the band holds the tallest of them ${said}`).toBeGreaterThanOrEqual(paused.chipBottom - 0.5);
    expect([after.shape, after.zoom, after.frozen], `${name}: the shape, engraving and held size ${said}`).toEqual([armed.shape, armed.zoom, armed.frozen]);
    expect(after.under, `${name}: nothing under the chip ${said}`).toEqual([]);
  }
  expect(paused.placed.map((p) => p.top), `the slots' tops, paused against waiting for the first note ${said}`).toEqual(armed.placed.map((p) => p.top));
});

test('where every sentence fits one line, the band is one line', async ({ page }) => {
  test.setTimeout(150_000);
  // 1024 x 768 is not a tablet to the app (the shorter side is under 900), so the chip is drawn; at this
  // width the longest sentence it can carry fits one line.
  await page.setViewportSize({ width: 1024, height: 768 });
  await openPiece(page, 'song.folk.hot-cross-buns');
  await setBars(page, 4);
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  const { folded } = await pauseAndFold(page);
  const said = JSON.stringify(folded);
  expect(folded.chipLines, `the paused line on one line ${said}`).toBe(1);
  // The chip's one line is the band: no second line held for nothing.
  expect(folded.band, `the band is the chip's one-line height ${said}`).toBeLessThanOrEqual(folded.chipBottom + 1);
  belowTheChip('one line, folded', folded);
});

test('the band holds the seconds away at the widest count they can print, and the chip says the real ones (U118b)', async ({ page }) => {
  test.setTimeout(150_000);
  // U118's required change (`responses/bea2d4e2.md`, `responses/questions-1cadc4dc.md`): the away count
  // has no ceiling of its own, so the band prices it at the widest count the product can print, fourteen
  // of the chip's widest digit (`AWAY_PRICED_COUNTS`: the seconds between two `Date` readings), not at a
  // day's 86 400. The claim holds on any face. It tells the bound from a day only where the fourteen
  // digits take the sentence a line past 86 400 and past every other sentence the chip carries; 342 x 740
  // was chosen because it does on the face this was written on (`runs/U118b`), and the annotation says
  // whether it does here.
  await page.setViewportSize({ width: 342, height: 740 });
  await openPiece(page, 'song.folk.hot-cross-buns');
  await setBars(page, 2);
  // The away sentence is a clock-driven run's (`onVisibilityChange`): Tempo, hidden, then shown again.
  await page.locator('#score-mode').selectOption('tempo');
  await settle(page);
  await pressControl(page, '#score-play');
  await page.waitForFunction(() => ((window as ChipHooked).__pianopath?.scoreFit?.()?.frozen ?? null) !== null, undefined, { timeout: 30_000 });
  const hide = async (hidden: boolean): Promise<void> => {
    await page.evaluate((value) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (value ? 'hidden' : 'visible') });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  };
  await hide(true);
  await expect(page.locator('#score-play')).toHaveText('▶');
  await page.waitForTimeout(1_200);
  await hide(false);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 10_000 });
  await frames(page);
  await page.waitForTimeout(400);
  const folded = await readFold(page);
  // The chip's sentence laid out the way `foldedCornerReserve` lays every candidate (an unseen copy of
  // the chip, `bar m / m`), with the count as fourteen of the widest digit this face draws, measured in
  // the chip's own type, and as a day's.
  const priced = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    const corner = document.querySelector<HTMLElement>('#score-corner')!;
    const said = corner.textContent ?? '';
    const parts = /^bar \S+ \/ (\S+) · (.*you were away )(\d+)( s\..*)$/.exec(said);
    if (!parts) return { said, count: null, widest: null, wide: null, day: null };
    const [, last, before, count, after] = parts;
    const copy = corner.cloneNode(false) as HTMLElement;
    copy.removeAttribute('id');
    copy.style.visibility = 'hidden';
    stage.appendChild(copy);
    const run = document.createElement('span');
    run.style.whiteSpace = 'nowrap';
    copy.appendChild(run);
    let widest = '0';
    let widestPx = -1;
    for (let digit = 0; digit <= 9; digit += 1) {
      run.textContent = String(digit).repeat(14);
      const px = run.getBoundingClientRect().width;
      if (px > widestPx) {
        widest = String(digit);
        widestPx = px;
      }
    }
    const top = stage.getBoundingClientRect().top + stage.clientTop;
    const lay = (n: string): { bottom: number; lines: number } => {
      copy.textContent = `bar ${last} / ${last} · ${before}${n}${after}`;
      const range = document.createRange();
      range.selectNodeContents(copy);
      const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
      return { bottom: copy.getBoundingClientRect().bottom - top, lines };
    };
    const wide = lay(widest.repeat(14));
    const day = lay('86400');
    copy.remove();
    return { said, count: Number(count), widest, wide, day };
  });
  const said = JSON.stringify({ folded, priced });
  // What the learner reads is the real seconds, never the priced count.
  expect(priced.count, `the chip says the away sentence ${said}`).not.toBeNull();
  expect(priced.count ?? Infinity, `with the seconds actually away, not the priced count ${said}`).toBeLessThan(60);
  // The band holds the sentence at the widest count the line can print (fourteen digits, the most a
  // span between two `Date` readings has in whole seconds).
  expect(folded.band, `the band holds the away sentence at fourteen of the widest digit ${said}`).toBeGreaterThanOrEqual((priced.wide?.bottom ?? Infinity) - 0.5);
  // Whether this face tells the fourteen digits from a day here: the case's power, not its claim.
  test.info().annotations.push({
    type: 'away lines',
    description: `fourteen of "${String(priced.widest)}": ${String(priced.wide?.lines)} lines; 86 400: ${String(priced.day?.lines)}`,
  });
  belowTheChip('away, folded', folded);
});

test('a tablet folds without a chip: no band, the slots at the top', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 900, height: 1200 });
  await openPiece(page, 'song.folk.hot-cross-buns');
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  const { open, folded } = await pauseAndFold(page);
  const said = JSON.stringify({ open, folded });
  expect([folded.chipShown, folded.band, folded.placed[0]?.top], `(5) a tablet: no chip, no band, the first slot at the top ${said}`).toEqual([false, 0, 0]);
  expect(folded.scale, `(5) a tablet: the size through the fold timer ${said}`).toBeCloseTo(open.scale, 5);
});
