// U119a, not committed: the narrowest case found where U105d's refusal sentence matters at 568 × 320
// (the brief's claim to verify, acceptance 5). Red at the lane's tree and at U119's: the sentence wraps
// in what Back, `bar n / m` and the controls leave it, and the bar it grows carries ▶ and the sentence
// past the top of the window. Kept in the run folder as evidence for the follow-up, not added to
// `score.screen.spec.ts`, where it would be red (U105d's rule is not this lane's to change).
import { expect, test } from '@playwright/test';
import { pressAnywhere } from '../../../tests/e2e/scoreControls';

type Captured = Window & { __contexts?: AudioContext[] };

for (const [face, item] of [
  [null, 'song.folk.hot-cross-buns'],
  ["body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }", 'song.classical.beethoven-moonlight-iii'],
] as const) {
  test(`a refusal sideways (568 × 320) at 115 % text${face === null ? '' : ' on a wider face'}, ${item}: ▶ and the sentence stay inside the window`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 568, height: 320 });
    await page.addInitScript((css) => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = '115%';
        if (css !== null) {
          const style = document.createElement('style');
          style.textContent = css;
          document.head.append(style);
        }
      });
    }, face);
    await page.addInitScript(() => {
      const Native = window.AudioContext;
      const made: AudioContext[] = [];
      (window as Captured).__contexts = made;
      window.AudioContext = class extends Native {
        constructor(options?: AudioContextOptions) {
          super(options);
          made.push(this);
        }
      };
    });
    await page.goto(`/#/score/${item}`);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
    const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
    await expect.poll(state).not.toBe('none');
    await page.locator('#score-where-side').click({ position: { x: 2, y: 4 }, timeout: 5_000 });
    await expect.poll(state).toBe('running');
    await page.evaluate(async () => {
      const ctx = (window as Captured).__contexts?.[0];
      await ctx?.suspend();
      if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
    });
    await expect.poll(state).toBe('suspended');
    await pressAnywhere(page, '#score-play');
    await expect(page.locator('#score-status-side')).toHaveText('Sound did not start — tap ▶ again', { timeout: 10_000 });
    const seen = await page.evaluate(() => {
      const box = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
      const play = box('#score-play');
      const status = box('#score-status-side');
      return {
        playTop: play.top,
        playBottom: play.bottom,
        statusTop: status.top,
        statusWidth: status.width,
        barHeight: box('#score-bar').height,
        window: window.innerHeight,
      };
    });
    console.log(JSON.stringify(seen));
    expect.soft(seen.playTop, '▶ is above the top of the window').toBeGreaterThanOrEqual(0);
    expect.soft(seen.statusTop, 'the sentence starts above the top of the window').toBeGreaterThanOrEqual(0);
    expect.soft(seen.barHeight, 'the bar is taller than the window').toBeLessThanOrEqual(seen.window);
  });
}
