// U105c's probe, not for app/: why the corner chip sits over the first row while folded. Upright at
// 342 x 740 (the app's own face), a Wait run started, frozen and paused, the chrome left to fold; reads
// the stage's read-ahead mode and every buffer's inline and computed `top`, against the folded rule's
// `top: var(--score-corner-h, 22px)`. Writes a JSON. Run from app/ with U105C_TESTDIR=build/u105c/probe-chip.
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressControl } from '../../../tests/e2e/scoreControls';

const RUNS = path.resolve(process.cwd(), '../build/u105c');

test('the chip reserve while folded in a paused run', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 342, height: 740 });
  await page.goto('/#/score/song.folk.hot-cross-buns');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  await page.waitForFunction(() => {
    const svg = document.querySelector('#score-stage .is-front svg');
    return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
  }, undefined, { timeout: 60_000 });
  await page.locator('#score-mode').selectOption('wait');
  await pressControl(page, '#score-play');
  await page.waitForFunction(() => {
    const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
    return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
  }, undefined, { timeout: 30_000 });
  await pressControl(page, '#score-play');
  await expect(page.locator('#score-play')).toHaveText('▶');
  await page.waitForFunction(
    () => document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.chrome === 'folded',
    undefined,
    { timeout: 10_000 },
  );
  const seen = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    return {
      readAhead: stage.dataset.readAhead ?? null,
      stageTop: stage.getBoundingClientRect().top,
      buffers: [...stage.querySelectorAll<HTMLElement>('.score-buffer')].map((b) => ({
        className: b.className,
        inlineTop: b.style.top,
        computedTop: getComputedStyle(b).top,
      })),
      corner: document.querySelector('#score-corner')?.textContent ?? null,
    };
  });
  fs.writeFileSync(path.join(RUNS, 'probe-chip-reserve.json'), JSON.stringify(seen, null, 2));
  expect(seen.buffers.length).toBeGreaterThan(0);
});
