// U119's pictures, not for app/: the screen a learner meets sideways in a paused Wait run, the bar shown,
// at the sizes the entry names. Run from app/ with U119_TESTDIR=build/u119/pictures and U119_WHEN=before|after
// (before on the mutant build that removes the clip, which is the committed CSS; after on the fixed build).
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressControl, revealBar } from '../../../tests/e2e/scoreControls';

const WHEN = process.env.U119_WHEN ?? 'after';
const OUT = path.resolve(process.cwd(), '../build/u119/pictures-out');
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
const CELLS: { w: number; h: number; face: 'stack' | 'wider-face'; text: number }[] = [
  { w: 667, h: 375, face: 'wider-face', text: 100 },
  { w: 667, h: 375, face: 'stack', text: 100 },
  { w: 780, h: 360, face: 'wider-face', text: 115 },
  { w: 568, h: 320, face: 'wider-face', text: 115 },
];

for (const c of CELLS) {
  const name = `paused-${String(c.w)}x${String(c.h)}-${c.face}${c.text === 100 ? '' : `-${String(c.text)}`}-${WHEN}`;
  test(name, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: c.w, height: c.h });
    if (c.text !== 100) {
      await page.addInitScript((size) => {
        document.addEventListener('DOMContentLoaded', () => {
          document.documentElement.style.fontSize = `${String(size)}%`;
        });
      }, c.text);
    }
    await page.goto('/#/score/song.folk.hot-cross-buns');
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
    await page.waitForFunction(() => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    }, undefined, { timeout: 60_000 });
    if (c.face === 'wider-face') await page.addStyleTag({ content: WIDER_FACE });
    await page.locator('#score-mode').selectOption('wait');
    await pressControl(page, '#score-play');
    await page.waitForFunction(() => {
      const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
      return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
    }, undefined, { timeout: 30_000 });
    await page.locator('#score-play').dispatchEvent('click');
    await expect(page.locator('#score-status-side')).toHaveText(/^Paused/);
    await revealBar(page);
    await expect.poll(() => page.locator('#score-bar').evaluate((b) => getComputedStyle(b).opacity)).toBe('1');
    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, `${name}.png`), animations: 'disabled' });
  });
}
