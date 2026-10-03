/**
 * U32's lane-only look at one cell whose picture changed (item 5): the Nocturne at 390 x 844, Bars 1,
 * at rest. Every frame from the first ink to a second after `data-settled`, and at the end the
 * renderer's own account of the choice (`debugFit`: the shape, the changes counted for this zoom and
 * width, what was priced, the reserve, each drawn slot's ink). Unthrottled, as the pictures probe.
 * `U32_BUILD_NAME` names the build, `U32_CELL` = `<width>x<height>:<bars>` the cell.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from '@playwright/test';

import { installMidiMock } from './fixtures/midiMock';

const BUILD = process.env.U32_BUILD_NAME ?? 'unnamed';
const [size, barsText] = (process.env.U32_CELL ?? '390x844:1').split(':');
const [width, height] = (size ?? '390x844').split('x').map(Number);
const BARS = Number(barsText ?? '1');
const OPENS = Number(process.env.U32_OPENS ?? '2');
const OUT = resolve('test-results/u32-cell');

for (let open = 1; open <= OPENS; open += 1) {
  test(`u32 cell ${BUILD} ${String(width)}x${String(height)} bars ${String(BARS)} ${String(open)}`, async ({ page }) => {
    test.setTimeout(240_000);
    // `U32_MIDI=1`: the MIDI mock installed, as the pictures probe has it (the Score screen then opens
    // in Wait with an input), and the page reached from about:blank, as that probe reaches it.
    if (process.env.U32_MIDI === '1') {
      await installMidiMock(page, { permission: 'granted' });
      await page.goto('about:blank');
    }
    await page.setViewportSize({ width: width ?? 390, height: height ?? 844 });
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
      (window as unknown as { __u32c: typeof state }).__u32c = state;
      const sample = (): void => {
        const stage = document.querySelector<HTMLElement>('#score-stage');
        if (stage && state.firstInk === null && stage.querySelector('svg .vf-measure')) state.firstInk = performance.now();
        if (stage && state.firstInk !== null) {
          const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
          const fit = hooks.__pianopath?.scoreFit?.() ?? {};
          const rows = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')]
            .filter((el) => !el.hidden && el.dataset.bars)
            .map((el) => `${el.dataset.bars ?? ''}${el.classList.contains('is-ahead') ? '~' : ''}`);
          const cursor = stage.querySelector<HTMLElement>('.score-buffer.is-cursor');
          const box = stage.getBoundingClientRect();
          const key = [
            `rows ${rows.join(',')}`,
            `transform ${cursor?.style.transform ?? ''}`,
            `zoom ${String(fit.zoom)}`,
            `stage ${String(Math.round(box.width))}x${String(Math.round(box.height))}`,
            `measured ${stage.dataset.measured ?? '-'}`,
            `changes ${JSON.stringify(fit.shapeChanges)}`,
            `sheets ${String(Array.isArray(fit.slots) ? fit.slots.length : '?')}`,
          ].join(' | ');
          const last = frames[frames.length - 1];
          if (!last || last.key !== key) frames.push({ at: performance.now(), key });
          if (stage.dataset.settled === 'true' && state.settledAt === null) state.settledAt = performance.now();
          if (state.settledAt !== null && performance.now() - state.settledAt > 1_000) return;
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, BARS);
    await page.goto('/#/score/song.classical.chopin-nocturne-op48-1.nifc');
    await page.waitForFunction(() => (window as unknown as { __u32c?: { settledAt: number | null } }).__u32c?.settledAt != null, undefined, {
      timeout: 180_000,
      polling: 250,
    });
    await page.waitForTimeout(1_500);
    const result = await page.evaluate(() => {
      const hooks = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> | null } };
      const fit = hooks.__pianopath?.scoreFit?.() ?? {};
      const slots = Array.isArray(fit.slots) ? (fit.slots as { range: unknown; ink: unknown; transform: unknown }[]) : [];
      return {
        state: (window as unknown as { __u32c: unknown }).__u32c,
        fit: {
          zoom: fit.zoom,
          slotCount: fit.slotCount,
          systemsPerWindow: fit.systemsPerWindow,
          barsShown: fit.barsShown,
          rowPx: fit.rowPx,
          shapeChanges: fit.shapeChanges,
          slotCeiling: fit.slotCeiling,
          priced: fit.priced,
          piece: fit.piece,
          ahead: fit.ahead,
          slots: slots.map((s) => ({ range: s.range, ink: s.ink, transform: s.transform })),
          stage: document.querySelector('#score-stage')?.getBoundingClientRect().height,
        },
      };
    });
    mkdirSync(OUT, { recursive: true });
    writeFileSync(resolve(OUT, `${BUILD}__${String(width)}x${String(height)}__bars-${String(BARS)}__${String(open)}.json`), `${JSON.stringify(result, null, 1)}\n`);
  });
}
