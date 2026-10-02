// U110's sweep (not committed): upright phones, the piano connected, four pieces with chord
// symbols or fingering or a dense grand staff, Bars 2, 3, 4 and 8, each cell opened and then
// reloaded. Per load: the shape, the reshape ladder, and the worst overlap between consecutive
// drawn rows' ink (text included). U113's Observation 1 (Twinkle at 360 x 780, Bars 3 and 4, a
// spent ladder holding a greyed row) is among the cells.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { readRows } from './u110-read';

const OUT = process.env.U110_OUT ?? 'build/u110/sweep';
const PIECES = ['song.classical.ode-to-joy.ht', 'song.folk.twinkle.ht', 'song.folk.hot-cross-buns', 'song.classical.chopin-nocturne-op48-1.nifc'];
const SIZES = [
  [342, 740],
  [360, 780],
  [390, 844],
  [412, 915],
] as const;
const BARS = [2, 3, 4, 8];

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 90_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 90_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1200);
}

test.beforeEach(async ({ page }) => {
  await installMidiMock(page, { permission: 'granted' });
});

for (const [w, h] of SIZES) {
  for (const piece of PIECES) {
    const name = `${piece.split('.').slice(-2).join('.')}-${String(w)}x${String(h)}`;
    test(`u110 sweep: ${name}`, async ({ page }) => {
      test.setTimeout(600_000);
      mkdirSync(OUT, { recursive: true });
      await page.setViewportSize({ width: w, height: h });
      const out: unknown[] = [];
      for (const bars of BARS) {
        await page.goto('/#/');
        await page.evaluate((n) => {
          const raw = localStorage.getItem('pianopath.settings');
          const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
          localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: n }));
        }, bars);
        await page.goto(`/#/score/${piece}`);
        for (const load of ['open', 'reload']) {
          if (load === 'reload') await page.reload();
          await ready(page);
          const r = await readRows(page);
          const ladder = r.fit.shapeChanges as { n?: number } | null;
          out.push({
            bars,
            load,
            slots: r.fit.slotCount,
            systems: r.fit.systemsPerWindow,
            shown: r.fit.barsShown,
            ladder: ladder?.n ?? null,
            overlapPx: r.overlapPx,
            rows: r.rows.map((x) => `${x.ahead ? 'G' : 'W'}${String(x.bars)}@${String(x.top)}:${String(x.inkTop)}..${String(x.inkBottom)}`),
          });
          if (r.overlapPx > 0.5) await page.screenshot({ path: `${OUT}/${name}-bars${String(bars)}-${load}.png` });
        }
      }
      writeFileSync(`${OUT}/${name}.json`, JSON.stringify(out, null, 1));
    });
  }
}
