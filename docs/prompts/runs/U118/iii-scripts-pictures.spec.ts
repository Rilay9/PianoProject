// U118's pictures beyond the discriminating cases: the folded paused run at 342 x 740 with 115 % text (the
// band three lines there), and at 1024 x 768 (one line). Each records the chip's lines, the band and the
// first slot's top beside the picture. Run from app/ with U118_TESTDIR=build/u118/disc and U118_LABEL.
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressControl, withScoreMenu } from '../../../tests/e2e/scoreControls';

const PICTURES = path.resolve(process.cwd(), '../docs/prompts/pictures/u118');
const LABEL = process.env.U118_LABEL ?? 'after';

for (const cell of [
  { name: 'folded-paused-342x740-hcb-text115', width: 342, height: 740, text: 115, bars: 2 },
  { name: 'folded-paused-1024x768-hcb-4bars', width: 1024, height: 768, text: 100, bars: 4 },
]) {
  test(cell.name, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: cell.width, height: cell.height });
    if (cell.text === 115) {
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          document.documentElement.style.fontSize = '115%';
        });
      });
    }
    await page.goto('/#/score/song.folk.hot-cross-buns');
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
    await page.waitForSelector('.score-view[data-settled]', { timeout: 30_000 }).catch(() => undefined);
    await withScoreMenu(page, async () => {
      const down = page.locator('#score-bars-down');
      for (let i = 0; i < 8 && (await down.isEnabled()); i += 1) await down.click();
      const up = page.locator('#score-bars-up');
      for (let i = 1; i < cell.bars && (await up.isEnabled()); i += 1) await up.click();
    });
    await page.locator('#score-mode').selectOption('wait');
    await page.waitForSelector('.score-view[data-settled]', { timeout: 30_000 }).catch(() => undefined);
    await pressControl(page, '#score-play');
    await page.waitForFunction(() => {
      const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
      return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
    }, undefined, { timeout: 30_000 });
    await pressControl(page, '#score-play');
    await expect(page.locator('#score-play')).toHaveText('▶');
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded', { timeout: 10_000 });
    await page.waitForTimeout(500);
    const seen = await page.evaluate(() => {
      const corner = document.querySelector<HTMLElement>('#score-corner')!;
      const range = document.createRange();
      range.selectNodeContents(corner);
      const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
      const fit = (window as unknown as { __pianopath?: { scoreFit?: () => { foldedReserve?: number } } }).__pianopath?.scoreFit?.();
      const first = [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer.is-front:not(.score-probe)')]
        .map((b) => Number.parseFloat(getComputedStyle(b).top))
        .sort((a, b) => a - b)[0];
      return { chip: corner.textContent, lines, band: fit?.foldedReserve ?? null, firstTop: first ?? null };
    });
    fs.mkdirSync(PICTURES, { recursive: true });
    await page.screenshot({ path: path.join(PICTURES, `${cell.name}-${LABEL}.png`) });
    console.log(`U118PICTURE ${cell.name} ${JSON.stringify(seen)}`);
    // Diagnosis only: which of the chip's longest sentences take how many lines here, laid out in a copy
    // of the chip as the screen's band does. The words are `help.ts`'s `STATE_TEXT` and `RESTARTED_WITH`
    // at this piece's longest, copied here (importing `help.ts` drags in JSON this runner cannot load).
    const at = 'bar 4 / 4';
    const lines = [
      'Paused — ▶ to carry on, or Start again in ⋯ to go back to the beginning.',
      'Paused — you were away 86400 s. ▶ to carry on, or Start again in ⋯ to go back to the beginning.',
      'Playing it to you — your run waits at bar 4. Stop to go back to it.',
      'Restarted at bar 4 with the app playing the right hand — ▶ when ready',
      'Restarted at bar 4 listening to the microphone — ▶ when ready',
      'Restarted at bar 4 judging the notes as well — ▶ when ready',
      'Sound did not start — tap Hear it again',
    ].map((line) => `${at} · ${line}`);
    const heights = await page.evaluate((texts) => {
      const corner = document.querySelector<HTMLElement>('#score-corner')!;
      const stage = document.querySelector<HTMLElement>('#score-stage')!;
      const copy = corner.cloneNode(false) as HTMLElement;
      copy.removeAttribute('id');
      copy.style.visibility = 'hidden';
      stage.appendChild(copy);
      const out = texts.map((text) => {
        copy.textContent = text;
        const range = document.createRange();
        range.selectNodeContents(copy);
        return { text, lines: new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size };
      });
      copy.remove();
      return out;
    }, lines);
    console.log(`U118LINES ${cell.name} ${JSON.stringify(heights)}`);
  });
}
