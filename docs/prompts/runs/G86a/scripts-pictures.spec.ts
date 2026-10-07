// G86a's pictures at 342 x 740 (and one sideways): a tap whose sound did not
// start. Throwaway probe, not for the commit; kept in the run folder after.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pressControl } from '../../../tests/e2e/scoreControls';

const here = path.dirname(fileURLToPath(import.meta.url));
const ITEM = 'song.folk.hot-cross-buns';
const LABEL = process.env.G86A_LABEL ?? 'unlabelled';
const PICTURES = path.resolve(here, '../../../../docs/prompts/pictures/g86a');
const NOTES = path.resolve(here, 'out');
mkdirSync(PICTURES, { recursive: true });
mkdirSync(NOTES, { recursive: true });

test.describe.configure({ timeout: 120_000 });

type Captured = Window & { __contexts?: AudioContext[] };

async function openWithCapturedContext(page: Page): Promise<() => Promise<string>> {
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
  await page.goto(`/#/score/${ITEM}?mode=tempo`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', 'tempo', {
    timeout: 60_000,
  });
  await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'true');
  const state = (): Promise<string> =>
    page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
  await expect.poll(state).not.toBe('none');
  // An ordinary tap that is not a control: the header's title upright, its mirror at the bar's left sideways.
  await page.locator('#score-title:visible, #score-title-side:visible').first().click({ timeout: 5_000 });
  await expect.poll(state).toBe('running');
  return state;
}

/** The context suspended, and its `resume` made never to answer, as G86's probe did. */
async function suspendForGood(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const ctx = (window as Captured).__contexts?.[0];
    await ctx?.suspend();
    if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
  });
}

/** Presses ▶ and waits for its wait to end, however it ends (no fixed sleep). */
async function pressPlayAndWaitOut(page: Page): Promise<void> {
  await pressControl(page, '#score-play');
  await expect(page.locator('#score-play')).not.toHaveAttribute('data-starting-sound', 'true', {
    timeout: 10_000,
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
}

async function measure(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const box = (id: string): { x: number; y: number; w: number; h: number; visible: boolean } | null => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        visible: r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
      };
    };
    const line = document.getElementById('score-waiting');
    const play = document.getElementById('score-play') as HTMLButtonElement | null;
    return {
      stateLine: line?.textContent ?? null,
      stateLineCut: line ? line.scrollWidth > line.clientWidth : null,
      stateLineBox: box('score-waiting'),
      play: play?.textContent ?? null,
      playLabel: play?.getAttribute('aria-label') ?? null,
      playDisabled: play?.disabled ?? null,
      playBusy: play?.getAttribute('aria-busy') ?? null,
      playRefused: play?.dataset.soundRefused ?? null,
      playBox: box('score-play'),
      running: document.querySelector('section[data-screen="score"]')?.getAttribute('data-running') ?? null,
      barVisible: document.getElementById('score-bar')?.getAttribute('data-visible') ?? null,
      statusSide: document.getElementById('score-status-side')?.textContent ?? null,
      statusSideBox: box('score-status-side'),
      corner: document.getElementById('score-corner')?.textContent ?? null,
      cornerBox: box('score-corner'),
    };
  });
}

test.describe('upright, 342 x 740', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  test('a fresh start whose sound did not start', async ({ page }) => {
    const state = await openWithCapturedContext(page);
    await suspendForGood(page);
    await pressPlayAndWaitOut(page);
    await page.screenshot({ path: `${PICTURES}/refused-fresh-${LABEL}.png` });
    writeFileSync(
      `${NOTES}/refused-fresh-${LABEL}.json`,
      JSON.stringify({ ...(await measure(page)), context: await state() }, null, 2),
    );
  });

  test('a paused run whose sound did not start, then the chrome folded', async ({ page }) => {
    const state = await openWithCapturedContext(page);
    await pressControl(page, '#score-play');
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
    await pressControl(page, '#score-play');
    await expect(page.locator('#score-play')).toHaveText('▶');
    await suspendForGood(page);
    await pressPlayAndWaitOut(page);
    await page.screenshot({ path: `${PICTURES}/refused-paused-${LABEL}.png` });
    const atRefusal = await measure(page);
    // The chrome folds three seconds into a pause, as into any run; the corner is what is left.
    await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'false', { timeout: 10_000 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))));
    await page.screenshot({ path: `${PICTURES}/refused-paused-folded-${LABEL}.png` });
    writeFileSync(
      `${NOTES}/refused-paused-${LABEL}.json`,
      JSON.stringify({ atRefusal, folded: await measure(page), context: await state() }, null, 2),
    );
  });
});

test.describe('sideways, 740 x 342', () => {
  test.use({ viewport: { width: 740, height: 342 } });

  test('a fresh start whose sound did not start, sideways', async ({ page }) => {
    const state = await openWithCapturedContext(page);
    await suspendForGood(page);
    await pressPlayAndWaitOut(page);
    await page.screenshot({ path: `${PICTURES}/refused-sideways-${LABEL}.png` });
    writeFileSync(
      `${NOTES}/refused-sideways-${LABEL}.json`,
      JSON.stringify({ ...(await measure(page)), context: await state() }, null, 2),
    );
  });
});
