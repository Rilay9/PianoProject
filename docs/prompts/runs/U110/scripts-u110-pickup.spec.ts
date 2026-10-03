// U110's check of the gallery's one cell whose engraving zoom differed between the committed
// renderer and the fix (`2-where-am-i/pickup--bar-count`, Happy Birthday at 360 x 780): the
// shape, engraving zoom, drawn size (zoom x scale) and rows at the gallery's fixed 2.5 s after
// the score appears, and again once the stage says it is settled, on a fresh load and two reloads.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { readRows } from './u110-read';

const OUT = process.env.U110_OUT ?? 'build/u110/pickup';

async function read(page: Page, at: string): Promise<Record<string, unknown>> {
  const r = await readRows(page);
  const transform = await page.evaluate(() => document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor')?.style.transform ?? '');
  const scale = Number(/scale\(([\d.]+)\)/.exec(transform)?.[1] ?? 0);
  const zoom = Number(r.fit.zoom ?? 0);
  return {
    at,
    shape: `${String(r.fit.slotCount)}/${String(r.fit.systemsPerWindow)}/${String(r.fit.barsShown)}`,
    zoom,
    scale,
    drawn: Math.round(zoom * scale * 1000) / 1000,
    ladder: (r.fit.shapeChanges as { n?: number } | null)?.n ?? null,
    overlapPx: r.overlapPx,
    rows: r.rows.map((x) => `${x.ahead ? 'G' : 'W'}${String(x.bars)}:${String(x.inkTop)}..${String(x.inkBottom)}`),
  };
}

test('u110 pickup: Happy Birthday at 360 x 780, at 2.5 s and settled', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 360, height: 780 });
  const out: unknown[] = [];
  await page.goto('/#/score/song.folk.happy-birthday.simple');
  for (let load = 0; load < 3; load += 1) {
    if (load > 0) await page.reload();
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
    await page.waitForTimeout(2_500);
    out.push({ load, ...(await read(page, 'gallery wait')) });
    await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
    out.push({ load, ...(await read(page, 'settled')) });
  }
  writeFileSync(`${OUT}/pickup.json`, JSON.stringify(out, null, 1));
});
