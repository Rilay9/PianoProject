/**
 * U32a's lane-only memory probe (not for the commit; copied into `app/tests/e2e/` for its runs and
 * removed). The JS heap once a long piece has settled, after the garbage collector has been asked
 * to run twice (CDP `HeapProfiler.collectGarbage`, then `Runtime.getHeapUsage`), so what is left
 * is what the page holds — the engravers among it — rather than what a collection had not yet
 * reached. Unthrottled, one fresh page an open. A relationship between builds on this machine,
 * never a phone's figure. `U32A_CELLS` = `<piece-short>:<width>x<height>:<bars>`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from '@playwright/test';

const BUILD = process.env.U32A_BUILD_NAME ?? 'unnamed';
const CELLS = (process.env.U32A_CELLS ?? 'nocturne:342x740:4,nocturne:342x740:8,scherzo:342x740:4,scherzo:390x844:2').split(',');
const OPENS = Number(process.env.U32A_OPENS ?? '2');
const OUT = `${process.env.U32A_OUT ?? resolve('../build/u32a/out')}/heap`;
const IDS: Record<string, string> = {
  nocturne: 'song.classical.chopin-nocturne-op48-1.nifc',
  scherzo: 'song.classical.chopin-scherzo-2.nifc',
};

for (const cell of CELLS) {
  const [short, size, barsText] = cell.split(':');
  const [width, height] = (size ?? '342x740').split('x').map(Number);
  const bars = Number(barsText ?? '4');
  for (let open = 1; open <= OPENS; open += 1) {
    test(`u32a heap ${BUILD} ${cell} ${String(open)}`, async ({ page }) => {
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
      await page.waitForTimeout(1_500);
      const client = await page.context().newCDPSession(page);
      await client.send('HeapProfiler.enable');
      await client.send('HeapProfiler.collectGarbage');
      await client.send('HeapProfiler.collectGarbage');
      const usage = (await client.send('Runtime.getHeapUsage')) as { usedSize: number; totalSize: number };
      const fit = await page.evaluate(() => {
        const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
        const f = hooks.__pianopath?.scoreFit?.() ?? {};
        return { sheets: f.sheets ?? null, slotCount: f.slotCount ?? null, systems: f.systemsPerWindow ?? null, shown: f.barsShown ?? null };
      });
      mkdirSync(OUT, { recursive: true });
      writeFileSync(
        resolve(OUT, `${BUILD}__${cell.replace(/[:]/g, '_')}__${String(open)}.json`),
        `${JSON.stringify({ usedMB: Math.round(usage.usedSize / 1e5) / 10, ...fit })}\n`,
      );
    });
  }
}
