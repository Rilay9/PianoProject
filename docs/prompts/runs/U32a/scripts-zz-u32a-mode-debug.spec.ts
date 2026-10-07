/**
 * U32a's lane-only look at a stopped-state re-price (not for the commit): open a long piece at a
 * cell, wait for `data-settled`, choose Wait (the stage changes height with the mode's words), and
 * sample the renderer every 100 ms for six seconds: the stage's height, the slots, the sheets, and
 * whether it says settled — so the time from the change to the sheet it needs is seen, against
 * the one second the Play-press probe leaves before its click; then Play, and the run's own stage
 * sampled the same way. Unthrottled.
 * `U32A_CELLS` = `<piece-short>:<width>x<height>:<bars>`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from '@playwright/test';

const BUILD = process.env.U32A_BUILD_NAME ?? 'unnamed';
const CELLS = (process.env.U32A_CELLS ?? 'scherzo:342x740:4,nocturne:342x740:4').split(',');
const OUT = `${process.env.U32A_OUT ?? resolve('../build/u32a/out')}/mode`;
const IDS: Record<string, string> = {
  nocturne: 'song.classical.chopin-nocturne-op48-1.nifc',
  scherzo: 'song.classical.chopin-scherzo-2.nifc',
};

for (const cell of CELLS) {
  const [short, size, barsText] = cell.split(':');
  const [width, height] = (size ?? '342x740').split('x').map(Number);
  const bars = Number(barsText ?? '4');
  test(`u32a mode ${BUILD} ${cell}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: width ?? 342, height: height ?? 740 });
    await page.addInitScript((n) => {
      try {
        const raw = localStorage.getItem('pianopath.settings');
        const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
        localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: n }));
      } catch {
        /* no storage */
      }
    }, bars);
    await page.goto(`/#/score/${IDS[short ?? 'nocturne'] ?? ''}`);
    await page.waitForSelector('.score-view[data-settled]', { timeout: 180_000 });
    await page.waitForTimeout(1_000);
    const sample = (): Promise<unknown> =>
      page.evaluate(() => {
        const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
        const f = hooks.__pianopath?.scoreFit?.() ?? {};
        const stage = document.querySelector<HTMLElement>('.score-view');
        return {
          t: Math.round(performance.now()),
          h: Math.round(stage?.getBoundingClientRect().height ?? 0),
          slots: f.slotCount,
          sheets: f.sheets,
          settled: stage?.dataset.settled === 'true',
        };
      });
    const before = await sample();
    await page.locator('#score-mode').selectOption('wait');
    const after: unknown[] = [];
    for (let i = 0; i < 30; i += 1) {
      after.push(await sample());
      await page.waitForTimeout(100);
    }
    // Then Play, once, and the run's own stage (the stage takes the bar's row when a run starts).
    await page.locator('#score-play').click({ timeout: 60_000 });
    for (let i = 0; i < 30; i += 1) {
      after.push({ ...((await sample()) as object), running: true });
      await page.waitForTimeout(100);
    }
    mkdirSync(OUT, { recursive: true });
    writeFileSync(resolve(OUT, `${BUILD}__${cell.replace(/[:]/g, '_')}.json`), `${JSON.stringify({ before, after }, null, 1)}\n`);
  });
}
