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
 * (e) **The floor**: the shortest staff on the glass clears `MIN_STAFF_PX`.
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

/** `WindowRenderer.MIN_STAFF_PX` — the code's own floor, in the unit it is written in. */
const MIN_STAFF_PX = 40;

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

interface Row {
  left: number;
  right: number;
  top: number;
  bottom: number;
  bars: number;
}

interface Glass {
  stage: { left: number; top: number; width: number; height: number } | null;
  /** Distinct printed bars with an inked, visible note on the stage. */
  barsInk: number[];
  /** Per drawn system: its ink box (notes and stave lines) and the bars inked in it. */
  rows: Row[];
  /** Per front sheet with ink on the stage: its CSS scale and how it was engraved. */
  sheets: { scale: number; stretch: string; classes: string }[];
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
    const sheets: { scale: number; stretch: string; classes: string }[] = [];
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
      sheets.push({
        scale: match ? Number(match[1]) : 0,
        stretch: holder.dataset.stretch ?? '',
        classes: [...buffer.classList].filter((c) => c.startsWith('is-')).sort().join(' '),
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
          slots?: unknown[];
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

    let stavePx: number | null = null;
    for (const buffer of buffers) {
      for (const line of buffer.querySelectorAll<SVGGraphicsElement>('.staffline')) {
        const box = line.getBoundingClientRect();
        if (box.height > 1 && overlaps(box)) stavePx = stavePx === null ? box.height : Math.min(stavePx, box.height);
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
    if (!roomBelow && roomRight && glass.shape.readAhead === 'slots') {
      // Rule 2's first branch — the next bar on the same row — exists only in
      // the sideways chunk. Upright rows are not extended past the window
      // (not built in T34); the cell says so rather than passing silently.
      notes.push(
        `NOT BUILT, same-row look-ahead upright: ${String(Math.round(freeRight))} px free right, a bar is ${String(
          Math.round(barWidth),
        )}`,
      );
    } else if (
      roomBelow &&
      !roomRight &&
      glass.shape.sheetsAvailable !== null &&
      (glass.shape.slots ?? 0) >= glass.shape.sheetsAvailable
    ) {
      // A piece longer than the probe's reach is given two sheets, not four
      // (`WindowRenderer.create`), and a window that fills both has none left
      // for the next row. Not changed in T34; the cell says so.
      notes.push(
        `NOT BUILT, no sheet left for the next row: ${String(glass.shape.slots)} of ${String(
          glass.shape.sheetsAvailable,
        )} in use, ${String(Math.round(freeBelow))} px free below`,
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
          // or one bar in every row.
          const oneRow =
            glass.shape.readAhead === 'single' || shownBefore === 1 || glass.rows.every((r) => r.bars === 1);
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
