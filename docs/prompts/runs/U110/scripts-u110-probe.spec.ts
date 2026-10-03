// U110's discriminating probe (not committed): at 360 x 780 upright, on a fresh browser context and
// on reloads, every drawn row's priced height (what the window plan granted it at), its slot pitch
// (the layout distance to the next row's top) and its drawn ink extent on the glass (every painted
// SVG element's box, chord symbols and fingering included), with the renderer's own pricing log.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { readRows } from './u110-read';

const OUT = process.env.U110_OUT ?? 'build/u110/probe';
// Overridable for a second look at another cell: U110_PIECE (a catalog id), U110_BARS (Bars in window).
const PIECE = `/#/score/${process.env.U110_PIECE ?? 'song.classical.ode-to-joy.ht'}`;
const BARS = process.env.U110_BARS ? Number(process.env.U110_BARS) : null;

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
}

function summary(load: string, r: Awaited<ReturnType<typeof readRows>>): Record<string, unknown> {
  const grants = r.log.filter((e) => typeof e === 'object' && e !== null && 'ahead' in e && 'rowHeight' in e) as Record<string, unknown>[];
  const last = grants[grants.length - 1] ?? null;
  return {
    load,
    slots: r.fit.slotCount,
    systems: r.fit.systemsPerWindow,
    shown: r.fit.barsShown,
    ahead: r.fit.ahead,
    shapeChanges: r.fit.shapeChanges,
    rows: r.rows.map((row, k, all) => ({
      bars: row.bars,
      ahead: row.ahead,
      pricedPx: last ? (row.ahead ? last.aheadHeight : last.rowHeight) : null,
      pitchPx: k + 1 < all.length ? all[k + 1]!.top - row.top : null,
      slotTop: row.top,
      slotHeight: row.height,
      inkTop: row.inkTop,
      inkBottom: row.inkBottom,
      inkExtentPx: row.inkBottom - row.inkTop,
    })),
    overlapPx: r.overlapPx,
    intoNextSlotPx: r.intoNextSlotPx,
    lastGrant: last,
    log: r.log,
  };
}

test.beforeEach(async ({ page }) => {
  await installMidiMock(page, { permission: 'granted' });
  await page.addInitScript((bars) => {
    (window as unknown as { __u110log: unknown[] }).__u110log = [];
    if (bars !== null) {
      const raw = localStorage.getItem('pianopath.settings');
      const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
      localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: bars }));
    }
  }, BARS);
});

for (const [w, h] of [
  [360, 780],
  [342, 740],
] as const) {
  test(`u110: fresh load then reloads at ${String(w)}x${String(h)}`, async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: w, height: h });
    const loads: unknown[] = [];
    await page.goto(PIECE);
    for (let i = 0; i < 5; i += 1) {
      if (i > 0) await page.reload();
      await ready(page);
      const r = await readRows(page);
      loads.push(summary(i === 0 ? 'fresh' : `reload ${String(i)}`, r));
      await page.screenshot({ path: `${OUT}/${String(w)}x${String(h)}-${i === 0 ? 'fresh' : `reload-${String(i)}`}.png` });
    }
    writeFileSync(`${OUT}/${String(w)}x${String(h)}.json`, JSON.stringify(loads, null, 1));
  });
}
