/**
 * U32's lane-only look at the pictures between the first ink and `data-settled` (item 4e): the
 * Nocturne at 342 x 740 and Bars 4, under the x4 throttle, every frame from the first ink until a
 * second after `data-settled`, with what could have moved the picture — the stage's box, `data-fit`,
 * `data-measured`, the engraving zoom (`debugFit().zoom`), the sheets made — so a change of size can
 * be told from a change of shape and its cause named. `U32_BUILD_NAME` names the build.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from '@playwright/test';

const BUILD = process.env.U32_BUILD_NAME ?? 'unnamed';
const OPENS = Number(process.env.U32_OPENS ?? '2');
const OUT = resolve('test-results/u32-replan');

for (let open = 1; open <= OPENS; open += 1) {
  test(`u32 replan ${BUILD} ${String(open)}`, async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 342, height: 740 });
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('pianopath.settings');
        const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
        localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: 4 }));
      } catch {
        /* no storage */
      }
      const frames: { at: number; key: string }[] = [];
      const state = { firstInk: null as number | null, settledAt: null as number | null, frames };
      (window as unknown as { __u32r: typeof state }).__u32r = state;
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
            `fit ${stage.dataset.fit ?? '-'}`,
            `measured ${stage.dataset.measured ?? '-'}`,
            `sheets ${String(sheets?.made ?? (Array.isArray(fit.slots) ? fit.slots.length : '?'))}`,
          ].join(' | ');
          const last = frames[frames.length - 1];
          if (!last || last.key !== key) frames.push({ at: performance.now(), key });
          if (stage.dataset.settled === 'true' && state.settledAt === null) state.settledAt = performance.now();
          if (state.settledAt !== null && performance.now() - state.settledAt > 1_000) return;
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto('/#/score/song.classical.chopin-nocturne-op48-1.nifc');
    await page.waitForFunction(() => (window as unknown as { __u32r?: { settledAt: number | null } }).__u32r?.settledAt != null, undefined, {
      timeout: 240_000,
      polling: 500,
    });
    await page.waitForTimeout(1_500);
    const state = await page.evaluate(() => (window as unknown as { __u32r: unknown }).__u32r);
    mkdirSync(OUT, { recursive: true });
    writeFileSync(resolve(OUT, `${BUILD}__${String(open)}.json`), `${JSON.stringify(state, null, 1)}\n`);
  });
}

/**
 * The JS heap once each long piece has settled, unthrottled (`performance.memory`, Chromium's coarse
 * figure): two more whole-document engravers are held for a long piece now, which is memory as well
 * as time. A relationship between builds on this machine, never a phone's figure.
 */
for (const piece of ['song.classical.chopin-nocturne-op48-1.nifc', 'song.classical.chopin-scherzo-2.nifc']) {
  test(`u32 heap ${BUILD} ${piece}`, async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 342, height: 740 });
    await page.goto(`/#/score/${piece}`);
    await page.waitForSelector('.score-view[data-settled]', { timeout: 240_000 });
    await page.waitForTimeout(3_000);
    const heap = await page.evaluate(() => {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      const fit = (window as unknown as { __pianopath?: { scoreFit?: () => { sheets?: unknown; slots?: unknown[] } | null } }).__pianopath?.scoreFit?.();
      return {
        used: memory?.usedJSHeapSize ?? null,
        total: memory?.totalJSHeapSize ?? null,
        sheets: fit?.sheets ?? (Array.isArray(fit?.slots) ? fit.slots.length : null),
      };
    });
    mkdirSync(OUT, { recursive: true });
    writeFileSync(resolve(OUT, `heap__${BUILD}__${piece.includes('scherzo') ? 'scherzo' : 'nocturne'}.json`), `${JSON.stringify(heap)}\n`);
  });
}
