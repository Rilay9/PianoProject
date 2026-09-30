/**
 * U32a's lane-only look (not for the commit; copied into `app/tests/e2e/` for its runs and removed):
 * what a learner sees at first paint and once the shape has settled, the Nocturne op. 48 no. 1 (81
 * bars), the Scherzo no. 2 (780 bars, the piece `perf.spec` opens) and Twinkle (12 bars, a short
 * piece) at 342 x 740, Bars 4 and 8, under the x4 throttle, one fresh page a cell.
 *
 * Per cell: a screenshot at the first ink and one a moment after `data-settled`; every change of the
 * rows or the cursor sheet's transform between them (the re-plans a learner sees), with the sheets
 * made at each; the glass measured at rest (U32's measure: the ink's share of the stage, the window's
 * five-line staff against the floor, the greyed rows and their bars, the free height below); and the
 * JS heap once settled (`performance.memory`, Chromium's coarse figure). The screenshot "at the
 * first ink" is taken when the harness gets to it, which under the throttle can be after the
 * re-plans (the frames say so): the first paint's own picture is `U32A_HOLD=1`'s, below. `U32A_PHASE` names the
 * output folder under `build/u32a/out/look/` (outside `test-results/`, which every run empties); `U32A_CELLS` overrides the cells.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, type Page } from '@playwright/test';

const PHASE = process.env.U32A_PHASE ?? 'unnamed';
const OUT = `${process.env.U32A_OUT ?? resolve('../build/u32a/out')}/look/${PHASE}`;
const THROTTLE = Number(process.env.U32A_THROTTLE ?? '4');
const MIN_STAFF_PX = 22;
const IDS: Record<string, string> = {
  nocturne: 'song.classical.chopin-nocturne-op48-1.nifc',
  scherzo: 'song.classical.chopin-scherzo-2.nifc',
  twinkle: 'song.folk.twinkle.ht',
};
const CELLS = (process.env.U32A_CELLS ?? 'nocturne:4,nocturne:8,scherzo:4,scherzo:8,twinkle:4,twinkle:8').split(',');

type Hooked = Window & { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };

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
    const ahead: string[] = [];
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
      if (isAhead) {
        ahead.push(sheet.dataset.bars ?? '?');
        continue;
      }
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
    const rowPx = typeof fit.rowPx === 'number' ? fit.rowPx : null;
    const freeBelow = Number.isFinite(inkBottom) ? stage.bottom - inkBottom : null;
    return {
      stage: { width: Math.round(stage.width), height: Math.round(stage.height) },
      inkShare: Number.isFinite(inkTop) ? Math.round(((inkBottom - inkTop) / stage.height) * 1000) / 1000 : 0,
      staffPx: Number.isFinite(staff) ? Math.round(staff * 10) / 10 : null,
      staffOverFloor: Number.isFinite(staff) ? staff >= minStaff : null,
      ahead,
      rows,
      freeBelow: freeBelow === null ? null : Math.round(freeBelow),
      rowPx: rowPx === null ? null : Math.round(rowPx),
      slotCount: fit.slotCount ?? null,
      systemsPerWindow: fit.systemsPerWindow ?? null,
      barsShown: fit.barsShown ?? null,
      barsAsked: fit.barsAsked ?? null,
      readAhead: fit.readAhead ?? null,
      sheets: fit.sheets ?? (Array.isArray(fit.slots) ? fit.slots.length : null),
      aheadState: fit.ahead ?? null,
      windowWhy: stageEl.dataset.windowWhy ?? null,
      barsRow: document.querySelector('[data-row="bars"], #score-bars-row')?.textContent ?? null,
    };
  }, MIN_STAFF_PX);
}

/**
 * `U32A_HOLD=1`: the first paint alone, held. Idle callbacks never run on this page, so the
 * measurement and every sheet past `create`'s are held back, and what is on the glass a moment
 * after the first ink — the first draw, and the engraving search's re-engraving at the same drawn
 * size, which runs on frames — is what a learner sees until the idle work lands. Unthrottled; the
 * screenshot under the ×4 throttle came too late to catch it on some cells.
 */
const HOLD = process.env.U32A_HOLD === '1' || process.env.U32A_HOLD === 'sheets';
/**
 * `U32A_HOLD=sheets`: the picture between the measurement's re-plan and the sheet it is short of.
 * Idle callbacks run until the stage says `data-measured`, and every one asked for after that is
 * held — the next is the sheet's load (`scheduleSheet`) — so what is on the glass is the window
 * the measurement re-planned with the sheets `create` made, for as long as a sheet load takes.
 */
const BETWEEN = process.env.U32A_HOLD === 'sheets';
if (HOLD) {
  for (const cell of CELLS) {
    const [short, barsText] = cell.split(':');
    const bars = Number(barsText ?? '4');
    test(`u32a first paint ${PHASE} ${cell}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: 342, height: 740 });
      await page.addInitScript(
        ([n, between]) => {
          try {
            const raw = localStorage.getItem('pianopath.settings');
            const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
            localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: n }));
          } catch {
            /* no storage */
          }
          const w = window as unknown as {
            requestIdleCallback: (cb: () => void, o?: { timeout: number }) => number;
            cancelIdleCallback: (id: number) => void;
          };
          const real = w.requestIdleCallback.bind(window);
          w.requestIdleCallback = (cb, o) => {
            const measured = document.querySelector<HTMLElement>('#score-stage')?.dataset.measured !== undefined;
            return between && !measured ? real(cb, o) : 0;
          };
          const cancel = w.cancelIdleCallback.bind(window);
          w.cancelIdleCallback = (id) => {
            if (id !== 0) cancel(id);
          };
        },
        [bars, BETWEEN] as const,
      );
      await page.goto(`/#/score/${IDS[short ?? 'nocturne'] ?? ''}`);
      await page.waitForSelector('#score-stage svg .vf-measure', { timeout: 120_000 });
      if (BETWEEN) await page.waitForSelector('#score-stage[data-measured]', { timeout: 120_000 });
      await page.waitForTimeout(2_000);
      mkdirSync(OUT, { recursive: true });
      const name = `${short ?? 'x'}__342x740__bars-${String(bars)}`;
      const which = BETWEEN ? 'between' : 'first';
      await page.screenshot({ path: resolve(OUT, `${name}__${which}.png`) });
      writeFileSync(resolve(OUT, `${name}__${which}.json`), `${JSON.stringify(await measure(page), null, 1)}\n`);
    });
  }
}

for (const cell of HOLD ? [] : CELLS) {
  const [short, barsText] = cell.split(':');
  const bars = Number(barsText ?? '4');
  test(`u32a look ${PHASE} ${cell}`, async ({ page }) => {
    test.setTimeout(420_000);
    await page.setViewportSize({ width: 342, height: 740 });
    if (THROTTLE > 1) {
      const client = await page.context().newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
    }
    await page.addInitScript((n) => {
      try {
        const raw = localStorage.getItem('pianopath.settings');
        const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
        localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: n }));
      } catch {
        /* no storage */
      }
      const frames: { at: number; key: string }[] = [];
      const state = { firstInk: null as number | null, settledAt: null as number | null, frames };
      (window as unknown as { __u32a: typeof state }).__u32a = state;
      const sample = (): void => {
        const stage = document.querySelector<HTMLElement>('#score-stage');
        if (stage && state.firstInk === null && stage.querySelector('svg .vf-measure')) state.firstInk = performance.now();
        if (stage && state.firstInk !== null) {
          const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
          const fit = hooks.__pianopath?.scoreFit?.() ?? {};
          const rows = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')]
            .filter((el) => !el.hidden && el.dataset.bars)
            .map((el) => ({ top: el.getBoundingClientRect().top, t: `${el.dataset.bars ?? ''}${el.classList.contains('is-ahead') ? '~' : ''}` }))
            .sort((a, b) => a.top - b.top)
            .map((r) => r.t);
          const cursor = stage.querySelector<HTMLElement>('.score-buffer.is-cursor');
          const box = stage.getBoundingClientRect();
          const sheets = fit.sheets as { made?: number } | undefined;
          const key = [
            `rows ${rows.join(',')}`,
            `transform ${cursor?.style.transform ?? ''}`,
            `zoom ${String(fit.zoom)}`,
            `stage ${String(Math.round(box.width))}x${String(Math.round(box.height))}`,
            `measured ${stage.dataset.measured ?? '-'}`,
            `sheets ${String(sheets?.made ?? (Array.isArray(fit.slots) ? fit.slots.length : '?'))}`,
          ].join(' | ');
          const last = frames[frames.length - 1];
          if (!last || last.key !== key) frames.push({ at: performance.now(), key });
          if (stage.dataset.settled === 'true' && state.settledAt === null) state.settledAt = performance.now();
          if (state.settledAt !== null && performance.now() - state.settledAt > 1_500) return;
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, bars);
    await page.goto(`/#/score/${IDS[short ?? 'nocturne'] ?? ''}`);
    await page.waitForFunction(() => (window as unknown as { __u32a?: { firstInk: number | null } }).__u32a?.firstInk != null, undefined, {
      timeout: 300_000,
      polling: 50,
    });
    mkdirSync(OUT, { recursive: true });
    const name = `${short ?? 'x'}__342x740__bars-${String(bars)}`;
    await page.screenshot({ path: resolve(OUT, `${name}__first.png`) });
    const first = await measure(page);
    await page.waitForFunction(() => (window as unknown as { __u32a?: { settledAt: number | null } }).__u32a?.settledAt != null, undefined, {
      timeout: 360_000,
      polling: 250,
    });
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: resolve(OUT, `${name}__settled.png`) });
    const settled = await measure(page);
    const state = await page.evaluate(() => (window as unknown as { __u32a: unknown }).__u32a);
    const heap = await page.evaluate(() => {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      return { used: memory?.usedJSHeapSize ?? null, total: memory?.totalJSHeapSize ?? null };
    });
    writeFileSync(resolve(OUT, `${name}.json`), `${JSON.stringify({ first, settled, heap, state }, null, 1)}\n`);
  });
}
