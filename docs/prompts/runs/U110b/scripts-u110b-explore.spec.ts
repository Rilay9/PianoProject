// U110b exploration: open a piece at a phone-upright width and a start height, wait for the fit to
// settle, then walk the viewport's height through a list of heights, sampling the renderer every
// 100 ms for a few seconds after each step. Prints one line per distinct state.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { line, readGlass } from './u110b-read';

const OUT = process.env.U110B_OUT ?? 'build/u110b/explore';
const PIECE = process.env.U110B_PIECE ?? 'song.folk.twinkle.ht';
const BARS = Number(process.env.U110B_BARS ?? 3);
const WIDTH = Number(process.env.U110B_WIDTH ?? 342);
const START = Number(process.env.U110B_START ?? 864);
const SEQ = (process.env.U110B_SEQ ?? '').split(',').filter((x) => x !== '').map(Number);
const WATCH_MS = Number(process.env.U110B_WATCH_MS ?? 2500);

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1000);
}

test('u110b explore', async ({ page }) => {
  test.setTimeout(900_000);
  mkdirSync(OUT, { recursive: true });
  await installMidiMock(page, { permission: 'granted' });
  await page.addInitScript((bars) => {
    const raw = localStorage.getItem('pianopath.settings');
    const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: bars }));
  }, BARS);
  const out: string[] = [];
  const say = (s: string): void => {
    out.push(s);
    console.log(s);
  };
  await page.setViewportSize({ width: WIDTH, height: START });
  await page.goto('/#/');
  await page.goto(`/#/score/${PIECE}`);
  await ready(page);
  say(`OPEN ${String(WIDTH)}x${String(START)} ${line(await readGlass(page))}`);
  for (const h of SEQ) {
    await page.setViewportSize({ width: WIDTH, height: h });
    const t0 = Date.now();
    let last = '';
    while (Date.now() - t0 < WATCH_MS) {
      const l = line(await readGlass(page));
      if (l !== last) say(`  H ${String(h)} t+${String(Date.now() - t0)} ${l}`);
      last = l;
      await page.waitForTimeout(100);
    }
  }
  writeFileSync(`${OUT}/explore.txt`, out.join('\n') + '\n');
});
