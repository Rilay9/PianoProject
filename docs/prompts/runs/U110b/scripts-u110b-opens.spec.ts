// U110b: how often does an open (and reloads) of a piece at a phone-upright size land in the state
// "look-ahead row drawn, ladder spent, rows packed (fit)"? Prints the final state of each load.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { line, readGlass } from './u110b-read';

const OUT = process.env.U110B_OUT ?? 'build/u110b/opens';
const PIECE = process.env.U110B_PIECE ?? 'song.folk.twinkle.ht';
const BARS = Number(process.env.U110B_BARS ?? 3);
const WIDTH = Number(process.env.U110B_WIDTH ?? 342);
const HEIGHTS = (process.env.U110B_HEIGHTS ?? '866').split(',').map(Number);
const LOADS = Number(process.env.U110B_LOADS ?? 10);

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1000);
}

test('u110b opens', async ({ page }) => {
  test.setTimeout(1_800_000);
  mkdirSync(OUT, { recursive: true });
  await installMidiMock(page, { permission: 'granted' });
  await page.addInitScript((bars) => {
    const raw = localStorage.getItem('pianopath.settings');
    const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: bars }));
  }, BARS);
  const out: string[] = [];
  for (const h of HEIGHTS) {
    await page.setViewportSize({ width: WIDTH, height: h });
    await page.goto('/#/');
    await page.goto(`/#/score/${PIECE}`);
    for (let load = 0; load < LOADS; load += 1) {
      if (load > 0) await page.reload();
      await ready(page);
      const g = await readGlass(page);
      const f = g.fit as { slotCount?: number; shapeChanges?: { n?: number } | null };
      const spent3 = f.slotCount === 3 && (f.shapeChanges?.n ?? 0) >= 6;
      const s = `H ${String(h)} load ${String(load)} ${spent3 ? 'SPENT3' : '      '} ${line(g)}`;
      out.push(s);
      console.log(s);
    }
  }
  writeFileSync(`${OUT}/opens.txt`, out.join('\n') + '\n');
});
