// U110b: from the state "look-ahead row drawn, ladder spent, rows packed" (Twinkle, Bars 3, 342 wide,
// opened at a height where the load itself lands there), shorten the viewport by height alone to each
// target height in turn (a fresh load for each), and watch the renderer for a few seconds.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installMidiMock } from '../../tests/e2e/fixtures/midiMock';
import { line, readGlass } from './u110b-read';

const OUT = process.env.U110B_OUT ?? 'build/u110b/shrink';
const PIECE = process.env.U110B_PIECE ?? 'song.folk.twinkle.ht';
const BARS = Number(process.env.U110B_BARS ?? 3);
const WIDTH = Number(process.env.U110B_WIDTH ?? 342);
const START = Number(process.env.U110B_START ?? 866);
const TARGETS = (process.env.U110B_TARGETS ?? '850').split(',').map(Number);
const WATCH_MS = Number(process.env.U110B_WATCH_MS ?? 2500);
const SHOTS = process.env.U110B_SHOTS ?? '';
const TAG = process.env.U110B_TAG ?? 'tree';

async function ready(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage')?.getAttribute('data-settled') === 'true', undefined, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1000);
}

test('u110b shrink', async ({ page }) => {
  test.setTimeout(1_800_000);
  mkdirSync(OUT, { recursive: true });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
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
  for (const target of TARGETS) {
    await page.setViewportSize({ width: WIDTH, height: START });
    await page.goto('/#/');
    await page.goto(`/#/score/${PIECE}`);
    let pre = await (async () => {
      await ready(page);
      return readGlass(page);
    })();
    for (let tries = 0; tries < 6; tries += 1) {
      const f = pre.fit as { slotCount?: number; shapeChanges?: { n?: number } | null };
      if (f.slotCount === 3 && (f.shapeChanges?.n ?? 0) >= 6) break;
      await page.reload();
      await ready(page);
      pre = await readGlass(page);
    }
    say(`TARGET ${String(target)} PRE  ${line(pre)}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${TAG}-pre-${String(START)}.png` });
    await page.setViewportSize({ width: WIDTH, height: target });
    const t0 = Date.now();
    let last = '';
    while (Date.now() - t0 < WATCH_MS) {
      const g = await readGlass(page);
      const l = line(g);
      if (l !== last) say(`   t+${String(Date.now() - t0)} ${l}`);
      last = l;
      await page.waitForTimeout(100);
    }
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${TAG}-post-${String(target)}.png` });
  }
  writeFileSync(`${OUT}/shrink-${TAG}.txt`, out.join('\n') + '\n');
});
