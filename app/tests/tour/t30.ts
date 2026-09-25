/**
 * T30's camera and tape measure — the window gallery.
 *
 * A throwaway companion to `shoot.ts`, kept deliberately separate from it:
 * the tour's camera writes one ledger from one worker and its contact sheet
 * has nowhere to put a number, and this gallery is several hundred cells shot
 * by four workers where **the caption is the claim and the picture is the
 * proxy** (`docs/prompts/working-rules.md` §1). So the file layout, the slug
 * scheme and the sha1 are the tour's — `<orientation>/<slug>.png` under a
 * root of its own — and each cell appends one JSON line of its own, which no
 * other worker can clobber. a small assembler in the task scratch folder tiles them afterwards.
 *
 * Nothing here is imported by anything in `app/src`.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';

import { withScoreMenu } from '../e2e/scoreControls';
import type { Orientation } from './shoot';

/** Everything lands here; the whole directory is disposable and gitignored. */
export const T30_DIR = resolve('../build/tour/T30');

/**
 * The five shapes the brief names.
 *
 * Two phone uprights, because 342 and 390 are the two widths every fault in
 * `pending-review` Entry 58 was measured at and they do not behave alike; the
 * tour's own landscape is 740x342, the owner's real device sideways.
 */
export const T30_FACTORS: { orientation: Orientation; size: { width: number; height: number } }[] = [
  { orientation: 'phone-portrait-342', size: { width: 342, height: 740 } },
  { orientation: 'portrait', size: { width: 390, height: 844 } },
  { orientation: 'phone-landscape-740', size: { width: 740, height: 342 } },
  { orientation: 'tablet-portrait', size: { width: 768, height: 1024 } },
  { orientation: 'tablet-landscape', size: { width: 1024, height: 768 } },
];

/** What one cell of the gallery records. Every field is measured, none asserted. */
export interface Cell {
  slug: string;
  orientation: Orientation;
  piece: string;
  pieceWhy: string;
  layout: string;
  moment: 'before' | 'mid-run';
  mode: string;
  /** What the stepper says, as text and as a number. */
  stepperText: string | null;
  barsAsked: number;
  /** Size, as the sheet's own percentage readout. */
  zoomText: string | null;
  zoomSteps: number;
  file: string;
  hash: string;
  note: string;
  m: Measurement | null;
}

export interface Measurement {
  stage: { width: number; height: number } | null;
  /** Distinct printed bars with an inked note inside the stage box. */
  barsInk: number[];
  /** What the renderer says each drawn slot holds, from `debugFit().slots`. */
  barsRanges: { from: number; to: number }[];
  /** The bar the run is on (`scoreRun`), or the bar of the note marked current. */
  cursorBar: number | null;
  /** Bars of the piece visible past the one being played. */
  aheadOfCursor: number | null;
  nextBarVisible: boolean | null;
  /** The engraver's zoom, the CSS transform's scale, and their product. */
  zoom: number | null;
  cssScale: number | null;
  drawn: number | null;
  /** The shortest five-line staff drawn, in px on the glass. */
  stavePx: number | null;
  /** `score.fill`'s own measure: the inked width over the stage's width. */
  fillW: number | null;
  /** The inked height over the stage's height, for the "too small" complaint. */
  fillH: number | null;
  readAhead: string | null;
  slotCount: number | null;
  frozen: number | null;
  stageVisible: boolean;
}

/**
 * Waits for the fit to stop moving, the way `score.fill.spec.ts` does.
 *
 * Not a sleep: the renderer publishes its own fit, so this watches the zoom
 * settle. A gallery shot under load with a half-searched fit is a picture of
 * the runner, not of the app, and the numbers in the caption would be its
 * numbers (`00-invariants` §2, "a suite-only failure is timing").
 */
export async function settle(page: Page, tries = 3): Promise<void> {
  await page.waitForTimeout(250);
  await page
    .waitForFunction(
      (want) => {
        const hooks = window as unknown as { __pianopath?: { scoreFit?: () => { zoom?: number } | null } };
        const zoom = hooks.__pianopath?.scoreFit?.()?.zoom;
        if (typeof zoom !== 'number') return false;
        const seen = window as unknown as { __t30Zoom?: number; __t30Same?: number };
        if (seen.__t30Zoom === zoom) seen.__t30Same = (seen.__t30Same ?? 0) + 1;
        else {
          seen.__t30Zoom = zoom;
          seen.__t30Same = 0;
        }
        return (seen.__t30Same ?? 0) >= want;
      },
      tries,
      { timeout: 30_000, polling: 200 },
    )
    .catch(() => undefined);
  await page.evaluate(() => {
    const seen = window as unknown as { __t30Zoom?: number; __t30Same?: number };
    delete seen.__t30Zoom;
    delete seen.__t30Same;
  });
  await page.waitForTimeout(350);
}

export async function openPiece(page: Page, id: string): Promise<void> {
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
 * Sets the window through the buttons, as a person would, and stops when one
 * goes dead — a click on a disabled button is not a no-op to Playwright, it
 * waits for it to enable (`choices.spec.ts`, and the memory rule that names
 * the same stall).
 */
export async function setBars(page: Page, bars: number): Promise<void> {
  await withScoreMenu(page, async () => {
    const down = page.locator('#score-bars-down');
    for (let i = 0; i < 8 && (await down.isEnabled()); i += 1) await down.click();
    const up = page.locator('#score-bars-up');
    for (let i = 1; i < bars && (await up.isEnabled()); i += 1) await up.click();
  });
  await settle(page);
}

/** Size, in steps of the sheet's own `+`/`−`, from wherever it is now. */
export async function setZoomSteps(page: Page, steps: number): Promise<void> {
  if (steps === 0) return;
  await withScoreMenu(page, async () => {
    const button = page.locator(steps > 0 ? '#score-zoom-in' : '#score-zoom-out');
    for (let i = 0; i < Math.abs(steps) && (await button.isEnabled()); i += 1) await button.click();
  });
  await settle(page);
}

export async function setLayout(page: Page, layout: 'window' | 'scroll'): Promise<void> {
  await withScoreMenu(page, async () => {
    await page.locator(layout === 'scroll' ? '#score-layout-scroll' : '#score-layout-window').click();
  });
  await settle(page);
}

/** The whole tape measure, in one pass over the DOM. */
export async function measure(page: Page): Promise<Measurement | null> {
  return page.evaluate(() => {
    const stageEl = document.querySelector<HTMLElement>('#score-stage');
    const stage = stageEl?.getBoundingClientRect() ?? null;
    const hooks = window as unknown as {
      __pianopath?: {
        scoreFit?: () => {
          zoom?: number;
          frozen?: number | null;
          readAhead?: string;
          slotCount?: number;
          slots?: { range?: { fromMeasure: number; toMeasure: number } | null }[];
        } | null;
        scoreRun?: () => { bar?: number; nextBar?: number | null } | null;
      };
    };
    const fit = hooks.__pianopath?.scoreFit?.() ?? null;
    const run = hooks.__pianopath?.scoreRun?.() ?? null;

    // Not `hidden` and not a box with area: **visible**, opacity included.
    //
    // The first version of this asked for a non-zero rect, and Blind mode
    // caught it out: the score screen in Blind draws its buffers and hides
    // them, so every note element still reported a box inside the stage and
    // this counted six bars on a screen that was black. The photograph said
    // so and the number did not (`working-rules` §1). `checkVisibility` is
    // the browser's own answer to the question this was approximating.
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

    // Every drawn buffer that is actually on the glass. The probe buffer is
    // excluded: it is the piece's measurement, engraved off-screen.
    const buffers = stageVisible
      ? [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer:not(.score-probe)')].filter(
          (el) => el.classList.contains('is-front') && !el.hidden && shown(el) && overlaps(el.getBoundingClientRect()),
        )
      : [];

    // The bars a person can see, measured from the ink: a note element whose
    // own box is inside the stage. Not the slot's range, which in the scroll
    // layout is the whole piece however little of it is on the screen. A bar
    // of rests has no note element and is therefore not counted — said out
    // loud because it is the one thing this measure cannot see.
    const bars = new Set<number>();
    for (const buffer of buffers) {
      for (const note of buffer.querySelectorAll<HTMLElement>('.score-note')) {
        const bar = Number(note.dataset.bar);
        if (!Number.isFinite(bar)) continue;
        if (overlaps(note.getBoundingClientRect())) bars.add(bar);
      }
    }
    const barsInk = [...bars].sort((a, b) => a - b);

    const barsRanges = buffers
      .map((el) => fit?.slots?.[Number(el.dataset.slot)]?.range ?? null)
      .filter((r): r is { fromMeasure: number; toMeasure: number } => r != null)
      .map((r) => ({ from: r.fromMeasure, to: r.toMeasure }));

    const currentNote = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-front .score-note.is-current');
    const cursorBar =
      typeof run?.bar === 'number'
        ? run.bar
        : currentNote && Number.isFinite(Number(currentNote.dataset.bar))
          ? Number(currentNote.dataset.bar)
          : null;

    const cursorWrapper =
      document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor') ??
      document.querySelector<HTMLElement>('#score-stage .score-buffer.is-front');
    const matrix = cursorWrapper ? new DOMMatrixReadOnly(getComputedStyle(cursorWrapper).transform) : null;
    const cssScale = matrix ? Math.round(matrix.a * 10000) / 10000 : null;
    const zoom = typeof fit?.zoom === 'number' ? fit.zoom : null;

    // The five lines of the shortest staff drawn, on the glass. The unit
    // readability actually has (`MIN_STAFF_PX`); a share of the width says
    // nothing, because a stave line spans the system whether it carries five
    // notes or none.
    //
    // **The five lines themselves (T38)**, top line to bottom line: the thin
    // horizontal strokes each `.vf-measure` draws. This read the `.staffline`
    // group's box, which holds the notes, stems and fingerings as well and was
    // 1.8 to 2 times the lines — so the camera and the renderer's floor were
    // measuring two different things under one name.
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

    // `score.fill`'s own measure, and its vertical twin.
    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;
    for (const buffer of buffers) {
      for (const node of buffer.querySelectorAll<SVGGraphicsElement>('path, rect, text, polyline, line')) {
        const box = node.getBoundingClientRect();
        if (box.width <= 0 || box.height <= 0) continue;
        if (!overlaps(box)) continue;
        left = Math.min(left, Math.max(box.left, stage ? stage.left : box.left));
        right = Math.max(right, Math.min(box.right, stage ? stage.right : box.right));
        top = Math.min(top, Math.max(box.top, stage ? stage.top : box.top));
        bottom = Math.max(bottom, Math.min(box.bottom, stage ? stage.bottom : box.bottom));
      }
    }
    const inked = Number.isFinite(left) && Number.isFinite(right) && stage !== null;
    const round = (n: number): number => Math.round(n * 1000) / 1000;

    return {
      stage: stage ? { width: Math.round(stage.width), height: Math.round(stage.height) } : null,
      barsInk,
      barsRanges,
      cursorBar,
      aheadOfCursor: cursorBar === null || barsInk.length === 0 ? null : Math.max(...barsInk) - cursorBar,
      nextBarVisible: cursorBar === null ? null : barsInk.includes(cursorBar + 1),
      zoom,
      cssScale,
      drawn: zoom !== null && cssScale !== null ? round(zoom * cssScale) : null,
      stavePx: stavePx === null ? null : Math.round(stavePx * 10) / 10,
      fillW: inked && stage ? round((right - left) / stage.width) : null,
      fillH: inked && stage ? round((bottom - top) / stage.height) : null,
      readAhead: fit?.readAhead ?? null,
      slotCount: typeof fit?.slotCount === 'number' ? fit.slotCount : null,
      frozen: typeof fit?.frozen === 'number' ? fit.frozen : null,
      stageVisible,
    };
  });
}

let written = 0;

/** Photographs the viewport, measures it, and appends the cell's record. */
export async function shootCell(
  page: Page,
  cell: Omit<Cell, 'file' | 'hash' | 'm' | 'stepperText' | 'zoomText'>,
): Promise<Cell> {
  const file = join(T30_DIR, cell.orientation, `${cell.slug}.png`);
  mkdirSync(dirname(file), { recursive: true });
  await page.waitForTimeout(400);
  const m = await measure(page);
  const stepperText = await page
    .locator('#score-bars')
    .textContent()
    .catch(() => null);
  const zoomText = await page
    .locator('#score-zoom-level')
    .textContent()
    .catch(() => null);
  await page.screenshot({ path: file, animations: 'disabled' });
  const hash = createHash('sha1').update(readFileSync(file)).digest('hex');
  const full: Cell = {
    ...cell,
    stepperText,
    zoomText,
    file: `${cell.orientation}/${cell.slug}.png`,
    hash,
    m,
  };
  written += 1;
  const out = join(T30_DIR, 'cells', `${String(process.pid)}-${String(written)}.json`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(full), 'utf8');
  return full;
}

/** A cell that could not be shot, with the reason, recorded the same way. */
export function notShot(slug: string, orientation: Orientation, reason: string, about: Partial<Cell> = {}): void {
  written += 1;
  const out = join(T30_DIR, 'cells', `${String(process.pid)}-${String(written)}-not.json`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ slug, orientation, notShot: reason, ...about }), 'utf8');
}
