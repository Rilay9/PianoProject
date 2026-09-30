/**
 * U32's lane-only picture probe (item 9): the long pieces' grid, before and after.
 *
 * Copied into `app/tests/e2e/` for its runs and removed afterwards. The Nocturne op. 48 no. 1 at
 * `window-rule`'s five shapes x Bars 1, 2, 4 and 8, and the Scherzo at both phone-upright shapes x
 * Bars 2 and 4; each opened fresh at that count, shot at rest after `data-settled`, then mid-run
 * (Wait, three steps past the cursor's first crossing into another system). Each picture is the
 * viewport, with a JSON of what was measured from the glass:
 *
 * - the share of the stage's height the ink spans;
 * - the window's five-line staff (the smallest, look-ahead rows left out) against `MIN_STAFF_PX`;
 * - each window bar's drawn width at the sheet's scale against the engraver's natural width;
 * - the greyed `is-ahead` rows on the glass, and their bars;
 * - the free height below the ink against the renderer's reserve for a row (`rowPx`).
 *
 * `U32_PHASE` names the output folder (`before` or `after`) under `test-results/u32-pictures/`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { pressControl } from './scoreControls';

const PHASE = process.env.U32_PHASE ?? 'unnamed';
const OUT = resolve(`test-results/u32-pictures/${PHASE}`);
const MIN_STAFF_PX = 22;

const SHAPES = [
  { name: 'phone-upright-342', width: 342, height: 740 },
  { name: 'phone-upright-390', width: 390, height: 844 },
  { name: 'phone-sideways', width: 740, height: 342 },
  { name: 'tablet-upright', width: 768, height: 1024 },
  { name: 'tablet-sideways', width: 1024, height: 768 },
];
const CELLS: { piece: string; short: string; shapes: typeof SHAPES; bars: number[] }[] = [
  { piece: 'song.classical.chopin-nocturne-op48-1.nifc', short: 'nocturne', shapes: SHAPES, bars: [1, 2, 4, 8] },
  { piece: 'song.classical.chopin-scherzo-2.nifc', short: 'scherzo', shapes: SHAPES.slice(0, 2), bars: [2, 4] },
];

type Run = { step: number; bar: number; lastBar: number; expected: number[]; pitches: number[] } | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run; scoreFit?: () => Record<string, unknown> | null } };

async function settled(page: Page): Promise<void> {
  await page.waitForTimeout(200);
  await page
    .waitForFunction(
      () => {
        const fit = (window as Hooked).__pianopath?.scoreFit?.();
        const stage = document.querySelector<HTMLElement>('#score-stage');
        if (!fit || !stage) return false;
        const key = JSON.stringify([
          fit.zoom,
          fit.barsShown,
          fit.slotCount,
          stage.dataset.slots,
          [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front')].map((b) => `${b.dataset.bars ?? ''}${b.style.transform}`),
        ]);
        const seen = window as unknown as { __u32p?: string; __u32n?: number };
        if (seen.__u32p === key) seen.__u32n = (seen.__u32n ?? 0) + 1;
        else {
          seen.__u32p = key;
          seen.__u32n = 0;
        }
        return (seen.__u32n ?? 0) >= 3;
      },
      undefined,
      { timeout: 60_000, polling: 200 },
    )
    .catch(() => undefined);
  await page.evaluate(() => {
    const seen = window as unknown as { __u32p?: string; __u32n?: number };
    delete seen.__u32p;
    delete seen.__u32n;
  });
  await page.waitForTimeout(250);
}

/** What the brief asks of each picture, measured from the glass. */
async function measure(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((minStaff) => {
    const stageEl = document.querySelector<HTMLElement>('#score-stage');
    const stage = stageEl?.getBoundingClientRect();
    if (!stageEl || !stage) return { error: 'no stage' };
    const fit = ((window as Hooked).__pianopath?.scoreFit?.() ?? {}) as Record<string, unknown>;
    const inside = (b: DOMRect): boolean =>
      b.width + b.height > 0 && b.right > stage.left && b.left < stage.right && b.bottom > stage.top && b.top < stage.bottom;
    const sheets = [...stageEl.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].filter(
      (el) => !el.hidden && getComputedStyle(el).visibility !== 'hidden',
    );
    let inkTop = Infinity;
    let inkBottom = -Infinity;
    let staff = Infinity;
    let worstSpacing = 0;
    const ahead: string[] = [];
    const rows: { bars: string; ahead: boolean; top: number; bottom: number; scale: number }[] = [];
    const laidAll = Array.isArray(fit.slots) ? (fit.slots as { bars?: { number: number; bar: number; natural: number }[] }[]) : [];
    for (const sheet of sheets) {
      const isAhead = sheet.classList.contains('is-ahead');
      let top = Infinity;
      let bottom = -Infinity;
      for (const node of sheet.querySelectorAll('svg path, svg text, svg rect')) {
        const b = node.getBoundingClientRect();
        if (!inside(b)) continue;
        top = Math.min(top, b.top);
        bottom = Math.max(bottom, Math.min(b.bottom, stage.bottom));
      }
      if (!Number.isFinite(top)) continue;
      inkTop = Math.min(inkTop, top);
      inkBottom = Math.max(inkBottom, bottom);
      const scaleMatch = /scale\(([\d.]+)\)/.exec(sheet.style.transform);
      const scale = scaleMatch ? Number(scaleMatch[1]) : 0;
      rows.push({ bars: sheet.dataset.bars ?? '', ahead: isAhead, top: Math.round(top - stage.top), bottom: Math.round(bottom - stage.top), scale });
      if (isAhead) {
        ahead.push(sheet.dataset.bars ?? '?');
        continue;
      }
      const laid = laidAll[Number(sheet.dataset.slot)]?.bars ?? [];
      for (const m of sheet.querySelectorAll<SVGGElement>('.vf-measure')) {
        const lines: DOMRect[] = [];
        for (const line of m.querySelectorAll(':scope > path')) {
          const b = line.getBoundingClientRect();
          if (b.height <= 1.5 && b.width >= 10 && inside(new DOMRect(b.left, b.top - 1, b.width, b.height + 2))) lines.push(b);
        }
        if (lines.length < 5) continue;
        const ys = lines.map((b) => b.top + b.height / 2);
        staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
        const bar = laid.find((b) => String(b.number) === m.id);
        if (bar && bar.natural > 0 && scale > 0) {
          const drawnWidth = (Math.max(...lines.map((b) => b.right)) - Math.min(...lines.map((b) => b.left))) / scale;
          worstSpacing = Math.max(worstSpacing, drawnWidth / bar.natural);
        }
      }
    }
    const rowPx = typeof fit.rowPx === 'number' ? fit.rowPx : null;
    const freeBelow = Number.isFinite(inkBottom) ? stage.bottom - inkBottom : null;
    return {
      stage: { width: Math.round(stage.width), height: Math.round(stage.height) },
      inkShare: Number.isFinite(inkTop) ? Math.round(((inkBottom - inkTop) / stage.height) * 1000) / 1000 : 0,
      staffPx: Number.isFinite(staff) ? Math.round(staff * 10) / 10 : null,
      staffOverFloor: Number.isFinite(staff) ? staff >= minStaff : null,
      worstSpacing: Math.round(worstSpacing * 1000) / 1000,
      ahead,
      rows,
      freeBelow: freeBelow === null ? null : Math.round(freeBelow),
      rowPx: rowPx === null ? null : Math.round(rowPx),
      freeBelowHoldsARow: freeBelow !== null && rowPx !== null ? freeBelow >= rowPx : null,
      slotCount: fit.slotCount ?? null,
      systemsPerWindow: fit.systemsPerWindow ?? null,
      barsShown: fit.barsShown ?? null,
      barsAsked: fit.barsAsked ?? null,
      readAhead: fit.readAhead ?? null,
      sheetsMade: laidAll.length,
      sheets: fit.sheets ?? null,
      frozen: fit.frozen !== null && fit.frozen !== undefined,
      aheadState: fit.ahead ?? null,
      windowWhy: stageEl.dataset.windowWhy ?? null,
    };
  }, MIN_STAFF_PX);
}

async function shoot(page: Page, name: string): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: resolve(OUT, `${name}.png`) });
  const measured = await measure(page);
  writeFileSync(resolve(OUT, `${name}.json`), `${JSON.stringify(measured, null, 1)}\n`);
}

/** Plays the run's expected notes until three steps past the cursor's first crossing into another system. */
async function playPastFirstCrossing(page: Page, midi: MidiMock): Promise<{ steps: number; crossedAt: number | null }> {
  const cursorSlot = (): Promise<number | null> =>
    page.evaluate(() => {
      const fit = (window as Hooked).__pianopath?.scoreFit?.();
      return typeof fit?.cursorSlot === 'number' ? fit.cursorSlot : null;
    });
  const startSlot = await cursorSlot();
  let crossedAt: number | null = null;
  let steps = 0;
  for (let i = 0; i < 400; i += 1) {
    const run = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
    if (run === null || run.bar >= run.lastBar) break;
    const slot = await cursorSlot();
    if (crossedAt === null && slot !== startSlot) crossedAt = run.bar;
    if (crossedAt !== null && steps >= 3) break;
    if (crossedAt !== null) steps += 1;
    const notes = run.expected.length > 0 ? run.expected : run.pitches;
    for (const n of notes) await midi.noteOn(n, 78);
    await page.waitForTimeout(40);
    for (const n of notes) await midi.noteOff(n);
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
  return { steps, crossedAt };
}

for (const cell of CELLS) {
  for (const shape of cell.shapes) {
    test(`u32 pictures ${cell.short} ${shape.name}`, async ({ page }) => {
      test.setTimeout(900_000);
      const midi = await installMidiMock(page, { permission: 'granted' });
      await page.setViewportSize({ width: shape.width, height: shape.height });
      for (const bars of cell.bars) {
        // A fresh document for every count: the last init script registered runs last and wins.
        await page.goto('about:blank');
        await page.addInitScript((n) => {
          try {
            const raw = localStorage.getItem('pianopath.settings');
            const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
            localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: n }));
          } catch {
            /* about:blank has no storage */
          }
        }, bars);
        await page.goto(`/#/score/${cell.piece}`);
        await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 120_000 });
        await page.waitForSelector('.score-view[data-settled]', { timeout: 180_000 }).catch(() => undefined);
        await settled(page);
        const base = `${cell.short}__${shape.name}__bars-${String(bars)}`;
        await shoot(page, `${base}__rest`);
        await page.locator('#score-mode').selectOption('wait');
        await settled(page);
        // One click, waited for: `pressControl` retries a click that has not landed in 1.5 s, and on
        // the after build a long piece's Play took longer than that to be taken, so its retry landed
        // as a second tap and paused the run at bar 1 (`scripts-zz-u32-play-debug.spec.ts`).
        await page.locator('#score-play').click({ timeout: 30_000 });
        await page.waitForFunction(() => (window as Hooked).__pianopath?.scoreRun?.() != null, undefined, { timeout: 30_000 });
        await page.waitForTimeout(400);
        const walked = await playPastFirstCrossing(page, midi);
        await settled(page);
        await shoot(page, `${base}__midrun`);
        writeFileSync(resolve(OUT, `${base}__midrun.walk.json`), `${JSON.stringify(walked)}\n`);
        await pressControl(page, '#score-play').catch(() => undefined);
      }
    });
  }
}
