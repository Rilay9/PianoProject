// U110's search for a settled stage where the look-ahead row's self-referential price decides the
// end state (not committed): Twinkle at Bars 3, 342 wide, the viewport's height stepped, each opened
// and reloaded; per load the shape, the ladder and the worst row overlap.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { readRows } from './u110-read';

const OUT = process.env.U110_OUT ?? 'build/u110/heights';
const PIECE = process.env.U110_PIECE ?? 'song.folk.twinkle.ht';
const BARS = Number(process.env.U110_BARS ?? 3);
const WIDTH = Number(process.env.U110_WIDTH ?? 342);
const FROM = Number(process.env.U110_FROM ?? 840);
const TO = Number(process.env.U110_TO ?? 900);
const STEP = Number(process.env.U110_STEP ?? 4);

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1000);
}

test('u110 heights', async ({ page }) => {
  test.setTimeout(900_000);
  mkdirSync(OUT, { recursive: true });
  await installMidiMock(page, { permission: 'granted' });
  await page.addInitScript((bars) => {
    const raw = localStorage.getItem('pianopath.settings');
    const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: bars }));
  }, BARS);
  const out: unknown[] = [];
  for (let h = FROM; h <= TO; h += STEP) {
    await page.setViewportSize({ width: WIDTH, height: h });
    await page.goto('/#/');
    await page.goto(`/#/score/${PIECE}`);
    for (const load of ['open', 'reload']) {
      if (load === 'reload') await page.reload();
      await ready(page);
      const r = await readRows(page);
      out.push({
        h,
        load,
        shape: `${String(r.fit.slotCount)}/${String(r.fit.systemsPerWindow)}/${String(r.fit.barsShown)}`,
        ladder: (r.fit.shapeChanges as { n?: number } | null)?.n ?? null,
        zoom: r.fit.zoom,
        overlapPx: r.overlapPx,
      });
    }
  }
  writeFileSync(`${OUT}/heights.json`, JSON.stringify(out, null, 1));
  const bad = out.filter((o) => (o as { overlapPx: number }).overlapPx > 0.5);
  console.log(`U110HEIGHTS ${JSON.stringify(bad)}`);
});
