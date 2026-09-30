/**
 * U32's lane-only look at the Play press in the pictures probe's flow (item 9): the cells where the
 * after build's mid-run shot came back paused at bar 1. Open fresh at the cell's Bars, wait for
 * `data-settled` and the stability poll, choose Wait, then press Play once (no retry), and keep: how
 * long the click took to be accepted, the long tasks from a second before the click to three after,
 * whether a run is on and not paused afterwards, and the renderer's sheets. `U32_CELL` =
 * `<piece-short>:<width>x<height>:<bars>` (piece-short `nocturne` or `scherzo`).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from '@playwright/test';

import { installMidiMock } from './fixtures/midiMock';

const BUILD = process.env.U32_BUILD_NAME ?? 'unnamed';
const CELLS = (process.env.U32_CELLS ?? 'nocturne:342x740:4,scherzo:390x844:2').split(',');
const OPENS = Number(process.env.U32_OPENS ?? '2');
const OUT = resolve('test-results/u32-play');
const IDS: Record<string, string> = {
  nocturne: 'song.classical.chopin-nocturne-op48-1.nifc',
  scherzo: 'song.classical.chopin-scherzo-2.nifc',
};

for (const cell of CELLS) {
  const [short, size, barsText] = cell.split(':');
  const [width, height] = (size ?? '342x740').split('x').map(Number);
  const bars = Number(barsText ?? '4');
  for (let open = 1; open <= OPENS; open += 1) {
    test(`u32 play ${BUILD} ${cell} ${String(open)}`, async ({ page }) => {
      test.setTimeout(240_000);
      await installMidiMock(page, { permission: 'granted' });
      await page.setViewportSize({ width: width ?? 342, height: height ?? 740 });
      await page.addInitScript((n) => {
        try {
          const raw = localStorage.getItem('pianopath.settings');
          const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
          localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: n }));
        } catch {
          /* no storage */
        }
        const tasks: { start: number; duration: number }[] = [];
        (window as unknown as { __u32t: typeof tasks }).__u32t = tasks;
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) tasks.push({ start: e.startTime, duration: e.duration });
          }).observe({ type: 'longtask', buffered: true });
        } catch {
          /* none */
        }
      }, bars);
      await page.goto(`/#/score/${IDS[short ?? 'nocturne'] ?? ''}`);
      await page.waitForSelector('.score-view[data-settled]', { timeout: 180_000 });
      await page.waitForTimeout(1_000);
      await page.locator('#score-mode').selectOption('wait');
      await page.waitForTimeout(1_000);
      const before = await page.evaluate(() => performance.now());
      const clickStarted = Date.now();
      await page.locator('#score-play').click({ timeout: 60_000 });
      const clickMs = Date.now() - clickStarted;
      await page.waitForTimeout(3_000);
      const after = await page.evaluate((t0) => {
        type Run = { paused?: boolean; armed?: boolean } | null;
        const hooks = window as unknown as {
          __pianopath?: { scoreRun?: () => Run; scoreFit?: () => Record<string, unknown> | null };
          __u32t: { start: number; duration: number }[];
        };
        const run = hooks.__pianopath?.scoreRun?.() ?? null;
        const fit = hooks.__pianopath?.scoreFit?.() ?? {};
        return {
          running: run !== null,
          paused: run?.paused ?? null,
          sheets: fit.sheets ?? (Array.isArray(fit.slots) ? fit.slots.length : null),
          slotCount: fit.slotCount,
          frozen: fit.frozen !== null && fit.frozen !== undefined,
          tasks: hooks.__u32t.filter((t) => t.start + t.duration > t0 - 1_000 && t.start < t0 + 6_000).map((t) => [Math.round(t.start - t0), Math.round(t.duration)]),
          chip: document.querySelector('#score-where, .score-chip')?.textContent ?? null,
        };
      }, before);
      mkdirSync(OUT, { recursive: true });
      writeFileSync(resolve(OUT, `${BUILD}__${cell.replace(/[:]/g, '_')}__${String(open)}.json`), `${JSON.stringify({ clickMs, ...after })}\n`);
    });
  }
}
