// U105c's probe, not for app/: the new paused-run case's `Hear it` refusal on the branch CI may take
// and this machine does not — `Hear it` sent from the bar to the `⋯` sheet at 342 px (the bar's
// overflow forced by widening the tempo label and asking the bar to refit with a one-pixel resize, as
// `score.head-height.spec.ts`'s last case does). Pressed through `pressAnywhere`, as the committed
// case presses it. Asserts the same facts: the control was in the sheet, the refusal's sentence whole
// (no overflow, no ellipsis, nothing drawn over it), the header one line taller, the drawn size kept,
// the mark on the control in the closed sheet's stash. Writes a JSON of what it read.
// Run from app/ with U105C_TESTDIR=build/u105c/probe-sheet and U105C_LABEL=after.
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressAnywhere, pressControl, revealBar } from '../../../tests/e2e/scoreControls';

type Captured = Window & { __contexts?: AudioContext[] };
const LABEL = process.env.U105C_LABEL ?? 'unlabelled';
const RUNS = path.resolve(process.cwd(), '../build/u105c');
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";

test(`Hear it in the ⋯ sheet, refused during a paused run (${LABEL})`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 342, height: 740 });
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
  await page.goto('/#/score/song.folk.hot-cross-buns');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  await page.waitForFunction(() => {
    const svg = document.querySelector('#score-stage .is-front svg');
    return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
  }, undefined, { timeout: 60_000 });
  await page.addStyleTag({ content: WIDER_FACE });
  await page.addStyleTag({ content: '#score-tempo-label { min-width: 260px; }' });
  await page.setViewportSize({ width: 342, height: 739 });
  const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
  await expect.poll(state).not.toBe('none');
  await page.locator('#score-title').click({ timeout: 5_000 });
  await expect.poll(state).toBe('running');
  await page.locator('#score-mode').selectOption('wait');
  await pressControl(page, '#score-play');
  await page.waitForFunction(() => {
    const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
    return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
  }, undefined, { timeout: 30_000 });
  await pressControl(page, '#score-play');
  await expect(page.locator('#score-play')).toHaveText('▶');
  await revealBar(page);
  const inSheet = !(await page.locator('#score-hear').isVisible());
  const read = () =>
    page.evaluate(() => {
      const node = document.querySelector<HTMLElement>('#score-waiting')!;
      const r = node.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      const text = range.getBoundingClientRect();
      const lines = [...range.getClientRects()].filter((piece) => piece.width > 0);
      const clear = lines.every((piece) => {
        const y = piece.top + piece.height / 2;
        return [piece.left + 2, (piece.left + piece.right) / 2, piece.right - 2].every((x) => {
          const top = document.elementFromPoint(x, y);
          return top !== null && (top === node || node.contains(top));
        });
      });
      const cursor = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor');
      const w = window as unknown as { __pianopath?: { scoreFit?: () => { zoom: number } } };
      return {
        text: node.textContent,
        head: document.querySelector('#score-head')!.getBoundingClientRect().height,
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        textInside: text.left >= r.left - 0.5 && text.right <= r.right + 0.5,
        ellipsis: getComputedStyle(node).textOverflow === 'ellipsis',
        clear,
        zoom: w.__pianopath?.scoreFit?.()?.zoom ?? 0,
        scale: cursor ? new DOMMatrixReadOnly(getComputedStyle(cursor).transform).a : 0,
        sheetOpen: document.querySelector('#score-more-sheet') !== null,
        marked: document.querySelector('#score-hear')?.getAttribute('data-sound-refused') ?? null,
        markedInBar: document.querySelector('#score-bar #score-hear') !== null,
      };
    });
  const ordinary = await read();
  await page.evaluate(async () => {
    const ctx = (window as Captured).__contexts?.[0];
    await ctx?.suspend();
    if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
  });
  await expect.poll(state).toBe('suspended');
  await pressAnywhere(page, '#score-hear');
  await expect(page.locator('#score-waiting')).toHaveText('Sound did not start — tap Hear it again', { timeout: 10_000 });
  await revealBar(page);
  await page.waitForTimeout(400);
  const refused = await read();
  fs.writeFileSync(path.join(RUNS, `probe-sheet-hear-in-more-${LABEL}.json`), JSON.stringify({ label: LABEL, inSheet, ordinary, refused }, null, 2));
  expect(inSheet, 'the overflow was not forced, so this proves nothing').toBe(true);
  expect.soft(refused.marked).toBe('true');
  expect.soft(refused.sheetOpen).toBe(false);
  expect.soft(refused.scrollWidth).toBeLessThanOrEqual(refused.clientWidth);
  expect.soft(refused.textInside).toBe(true);
  expect.soft(refused.ellipsis).toBe(false);
  expect.soft(refused.clear).toBe(true);
  expect.soft(refused.head).toBeGreaterThan(ordinary.head);
  expect.soft(refused.zoom).toBeCloseTo(ordinary.zoom, 5);
  expect.soft(refused.scale).toBeCloseTo(ordinary.scale, 5);
});
