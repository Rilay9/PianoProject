/**
 * U113's lane-only probe (not for the suite; copied into `app/build/u113/` for its runs): every
 * piece of the canonical corpus at Bars 4, 6 and 8 on the two canonical phones upright, one fresh
 * page a cell, read at rest through the app's own read-only hook (`window.__pianopath.scoreFit`,
 * which is `WindowRenderer.debugFit()`), never a copy of the chooser.
 *
 * Per cell, once `#score-stage[data-settled="true"]`, no sheet pending, and the shape unchanged
 * over three polls: the whole `debugFit()` account the table needs (the asked and shown counts,
 * systems, slots, the live look-ahead state and treatment, Size, arrangement, sheets, the pricing
 * pass's `candidates` with each count's own `ahead` read-out), the settings in storage, the stage's
 * box and reason for a shortfall, and the glass measured as U32a measured it (the five-line staff on
 * the glass, the drawn rows with the greyed ones marked, the free height below the ink). A
 * screenshot of the stage at rest, named `piece__WxH__bars-N__settled.png`.
 *
 * `U113_CELLS` overrides the cells (`piece:bars:WxH,...`); `U113_PHASE` names the output folder
 * under `U113_OUT`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, type Page } from '@playwright/test';

const OUT = resolve(process.env.U113_OUT ?? '../build/u113/out', process.env.U113_PHASE ?? 'unnamed');
const MIN_STAFF_PX = 22;
const IDS: Record<string, string> = {
  'five-finger': 'exercise.five-finger.c-major.right',
  twinkle: 'song.folk.twinkle.ht',
  nocturne: 'song.classical.chopin-nocturne-op48-1.nifc',
  scherzo: 'song.classical.chopin-scherzo-2.nifc',
};
const SIZES = ['342x740', '360x780'];
const DEFAULT_CELLS = Object.keys(IDS).flatMap((piece) => [4, 6, 8].flatMap((bars) => SIZES.map((size) => `${piece}:${String(bars)}:${size}`)));
const CELLS = (process.env.U113_CELLS ?? DEFAULT_CELLS.join(',')).split(',').filter((c) => c.length > 0);

type Hooked = Window & { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };

/** The glass at rest, as U32a's look probe measured it (`runs/U32a/scripts-zz-u32a-look.spec.ts`). */
async function glass(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((minStaff) => {
    const stageEl = document.querySelector<HTMLElement>('#score-stage');
    const stage = stageEl?.getBoundingClientRect();
    if (!stageEl || !stage) return { error: 'no stage' };
    const inside = (b: DOMRect): boolean =>
      b.width + b.height > 0 && b.right > stage.left && b.left < stage.right && b.bottom > stage.top && b.top < stage.bottom;
    const sheets = [...stageEl.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].filter(
      (el) => !el.hidden && getComputedStyle(el).visibility !== 'hidden',
    );
    let inkTop = Infinity;
    let inkBottom = -Infinity;
    let staff = Infinity;
    const rows: { bars: string; ahead: boolean; top: number; bottom: number }[] = [];
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
      rows.push({ bars: sheet.dataset.bars ?? '', ahead: isAhead, top: Math.round(top - stage.top), bottom: Math.round(bottom - stage.top) });
      if (isAhead) continue;
      for (const m of sheet.querySelectorAll<SVGGElement>('.vf-measure')) {
        const lines: DOMRect[] = [];
        for (const line of m.querySelectorAll(':scope > path')) {
          const b = line.getBoundingClientRect();
          if (b.height <= 1.5 && b.width >= 10 && inside(new DOMRect(b.left, b.top - 1, b.width, b.height + 2))) lines.push(b);
        }
        if (lines.length < 5) continue;
        const ys = lines.map((b) => b.top + b.height / 2);
        staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
      }
    }
    rows.sort((a, b) => a.top - b.top);
    return {
      stage: { width: Math.round(stage.width), height: Math.round(stage.height) },
      staffPx: Number.isFinite(staff) ? Math.round(staff * 10) / 10 : null,
      staffOverFloor: Number.isFinite(staff) ? staff >= minStaff : null,
      rows,
      inkShare: Number.isFinite(inkTop) ? Math.round(((inkBottom - inkTop) / stage.height) * 1000) / 1000 : 0,
      freeBelow: Number.isFinite(inkBottom) ? Math.round(stage.bottom - inkBottom) : null,
      windowWhy: stageEl.dataset.windowWhy ?? null,
      settled: stageEl.dataset.settled ?? null,
    };
  }, MIN_STAFF_PX);
}

/** Until the renderer says settled, owes no sheet, and the shape holds over three polls. */
async function atRest(page: Page): Promise<void> {
  await page.waitForSelector('#score-stage[data-settled="true"]', { timeout: 240_000 });
  await page.waitForFunction(
    () => {
      const fit = (window as Hooked).__pianopath?.scoreFit?.() as
        | { zoom?: number; barsShown?: number; slotCount?: number; systemsPerWindow?: number; sheets?: { pending?: number } }
        | null
        | undefined;
      const stage = document.querySelector<HTMLElement>('#score-stage');
      if (!fit || typeof fit.zoom !== 'number' || stage?.dataset.settled !== 'true' || (fit.sheets?.pending ?? 0) !== 0) return false;
      const key = [fit.zoom, fit.barsShown, fit.slotCount, fit.systemsPerWindow, stage.querySelector<HTMLElement>('.score-buffer.is-front')?.style.transform ?? ''].join('|');
      const seen = window as unknown as { __u113Key?: string; __u113Same?: number };
      if (seen.__u113Key === key) seen.__u113Same = (seen.__u113Same ?? 0) + 1;
      else {
        seen.__u113Key = key;
        seen.__u113Same = 0;
      }
      return (seen.__u113Same ?? 0) >= 3;
    },
    undefined,
    { timeout: 120_000, polling: 250 },
  );
  await page.waitForTimeout(500);
}

for (const cell of CELLS) {
  const [piece = 'twinkle', barsText = '4', size = '342x740'] = cell.split(':');
  const bars = Number(barsText);
  const [width, height] = size.split('x').map(Number) as [number, number];
  test(`u113 ${piece} bars ${String(bars)} ${size}`, async ({ page }) => {
    test.setTimeout(420_000);
    await page.setViewportSize({ width, height });
    await page.addInitScript((n) => {
      try {
        const raw = localStorage.getItem('pianopath.settings');
        const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
        localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: n }));
      } catch {
        /* no storage */
      }
    }, bars);
    await page.goto(`/#/score/${IDS[piece] ?? ''}`);
    await page.waitForSelector('#score-stage svg .vf-measure', { timeout: 240_000 });
    await atRest(page);
    const fit = await page.evaluate(() => (window as Hooked).__pianopath?.scoreFit?.() ?? null);
    const measured = await glass(page);
    const storage = await page.evaluate(() => ({
      settings: localStorage.getItem('pianopath.settings'),
      lookAhead: localStorage.getItem('pianopath.lookAhead'),
    }));
    const viewport = page.viewportSize();
    mkdirSync(OUT, { recursive: true });
    const name = `${piece}__${size}__bars-${String(bars)}`;
    await page.screenshot({ path: resolve(OUT, `${name}__settled.png`) });
    // The per-slot engraver layout is the bulk of the account and no column reads it.
    const { slots: _slots, barTable: _barTable, ...kept } = (fit ?? {}) as Record<string, unknown>;
    writeFileSync(resolve(OUT, `${name}.json`), `${JSON.stringify({ cell: { piece, id: IDS[piece], bars, size, viewport }, storage, fit: kept, glass: measured })}\n`);
  });
}
