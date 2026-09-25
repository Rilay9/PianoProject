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
 *     width free right of it — and the cell says so in its annotation.
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
  ink: { left: number; right: number } | null;
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
    /** How many sheets the renderer has to draw rows into (a long piece gets two). */
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
      ink: { left: number; right: number } | null;
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
      // The sheet's whole ink across, on the glass, clipped by nothing.
      let inkLeft = Number.POSITIVE_INFINITY;
      let inkRight = Number.NEGATIVE_INFINITY;
      for (const node of buffer.querySelectorAll('svg path, svg rect, svg text')) {
        const box = node.getBoundingClientRect();
        if (box.width <= 0 && box.height <= 0) continue;
        inkLeft = Math.min(inkLeft, box.left);
        inkRight = Math.max(inkRight, box.right);
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
        ink: Number.isFinite(inkLeft) ? { left: inkLeft, right: inkRight } : null,
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

/** One cell's verdict: the fault groups it falls into, named by letter. */
function faultsOf(glass: Glass, asked: number, words: string, notes: string[]): string[] {
  const out: string[] = [];
  const { stage, stavePx, rows, sheets, barsInk, cursorBar, lastBar } = glass;
  if (stavePx === null || stage === null || rows.length === 0) return ['nothing drawn'];

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
      // A piece longer than the probe's reach is given two sheets, not four
      // (`WindowRenderer.create`), and a window that fills both has none left
      // for the next row, whatever room there is to its right as well (T38:
      // this branch used to be taken only when there was none). Not changed.
      notes.push(
        `NOT BUILT, no sheet left for the next row: ${String(glass.shape.slots)} of ${String(
          glass.shape.sheetsAvailable,
        )} in use, ${String(Math.round(freeBelow))} px free below`,
      );
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
    const groups = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)'].map(
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
 * The cell that found fault C, mid-run: phone upright, Chopin's Nocturne op. 48
 * no. 1, four bars. A row's page was `bars × stage width`, and when the run's
 * taller stage raised the engraving zoom two dense bars no longer fitted it, so
 * the engraver broke the row onto two systems and justified the first bar
 * across the whole page. (a)'s outcome check reads it bar by bar.
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
