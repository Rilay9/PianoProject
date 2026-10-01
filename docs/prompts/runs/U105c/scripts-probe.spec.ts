// U105c's probe, not for app/: a refusal standing while the run object still reads running, upright
// at 342 x 740, with the context suspended and its `resume` stubbed never to answer, read under three
// conditions — the app's font stack, the wider face `plan.spec.ts` forces (Verdana, or DejaVu Sans
// where Verdana is absent), and 115 % text (`library.spec.ts`'s G101 convention) — for the paths that
// can reach one: ▶ during a pause, `Hear it` during a pause, ▶ over a demonstration; and a bar held
// during a paused run, to see whether that path reaches the gate at all. Per case it writes a JSON of
// what the page measured: the header's line before and during the refusal, the header's height, the
// frozen fit (engraving zoom and the cursor slot's transform), overlaps with the stage, the drawn ink
// and the control bar, and — once the chrome has folded three seconds after the tap — the stage's
// corner chip against the reserve the buffers keep for it and against the drawn ink.
// Run from app/ with U105C_TESTDIR=build/u105c/probe and U105C_LABEL=before|after.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressAnywhere, revealBar } from '../../../tests/e2e/scoreControls';

type Captured = Window & { __contexts?: AudioContext[] };

const ITEM = 'song.folk.hot-cross-buns';
const LABEL = process.env.U105C_LABEL ?? 'unlabelled';
const PICTURES = path.resolve(process.cwd(), '../docs/prompts/pictures/u105c');
const RUNS = path.resolve(process.cwd(), '../build/u105c');
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";

type Condition = 'stack' | 'wider-face' | 'text-115';
type Path = 'play-paused' | 'hear-paused' | 'play-over-demo';

const SENTENCE: Record<Path, string> = {
  'play-paused': 'Sound did not start — tap ▶ again',
  'hear-paused': 'Sound did not start — tap Hear it again',
  'play-over-demo': 'Sound did not start — tap ▶ again',
};
const CONTROL: Record<Path, string> = {
  'play-paused': '#score-play',
  'hear-paused': '#score-hear',
  'play-over-demo': '#score-play',
};

async function waitForFreeze(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
      return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
    },
    undefined,
    { timeout: 30_000 },
  );
}

async function setUp(page: Page, condition: Condition): Promise<() => Promise<string>> {
  await page.setViewportSize({ width: 342, height: 740 });
  await page.addInitScript((scaled) => {
    const Native = window.AudioContext;
    const made: AudioContext[] = [];
    (window as Captured).__contexts = made;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        made.push(this);
      }
    };
    if (scaled) {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = '115%';
      });
    }
  }, condition === 'text-115');
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  if (condition === 'wider-face') await page.addStyleTag({ content: WIDER_FACE });
  const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
  await expect.poll(state).not.toBe('none');
  await page.locator('#score-title').click({ timeout: 5_000 });
  await expect.poll(state).toBe('running');
  await page.locator('#score-mode').selectOption('wait');
  return state;
}

async function suspendForGood(page: Page, state: () => Promise<string>): Promise<void> {
  await page.evaluate(async () => {
    const ctx = (window as Captured).__contexts?.[0];
    await ctx?.suspend();
    if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
  });
  await expect.poll(state).toBe('suspended');
}

/** Everything the page can say about the header's line, the fit and what is around it. */
async function measure(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const box = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const overlaps = (
      a: { left: number; top: number; right: number; bottom: number } | null,
      b: { left: number; top: number; right: number; bottom: number } | null,
    ): boolean | null => (a === null || b === null ? null : a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom);
    const ink = (() => {
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;
      for (const el of document.querySelectorAll('#score-stage .is-front svg *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
        top = Math.min(top, r.top);
        bottom = Math.max(bottom, r.bottom);
      }
      return Number.isFinite(top) ? { left, top, right, bottom, width: right - left, height: bottom - top } : null;
    })();
    const node = document.querySelector<HTMLElement>('#score-waiting');
    const range = document.createRange();
    if (node) range.selectNodeContents(node);
    const rects = node ? [...range.getClientRects()].filter((r) => r.width > 0) : [];
    const tops = [...new Set(rects.map((r) => Math.round(r.top)))];
    const text = node ? range.getBoundingClientRect() : null;
    const r = node?.getBoundingClientRect() ?? null;
    // Hit-testing across each line of the sentence: what is drawn at its two ends and its middle.
    const clear =
      node === null
        ? null
        : rects.every((line) => {
            const y = line.top + line.height / 2;
            return [line.left + 2, (line.left + line.right) / 2, line.right - 2].every((x) => {
              const top = document.elementFromPoint(x, y);
              return top !== null && (top === node || node.contains(top));
            });
          });
    const cursor = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor');
    const w = window as unknown as { __pianopath?: { scoreFit?: () => { zoom: number; frozen: unknown } } };
    const screen = document.querySelector<HTMLElement>('section[data-screen="score"]');
    const line = box(node);
    const bar = box(document.querySelector('#score-bar'));
    const stage = box(document.querySelector('#score-stage'));
    const corner = document.querySelector<HTMLElement>('#score-corner');
    const cornerBox = box(corner);
    const front = box(document.querySelector('#score-stage .score-buffer.is-front'));
    const cornerRange = document.createRange();
    if (corner) cornerRange.selectNodeContents(corner);
    const cornerLines = corner ? [...new Set([...cornerRange.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)))].length : 0;
    // The reserve the buffers keep for the chip: the stage's top plus the buffer's own `top` (layout, not
    // the renderer's transform inside it).
    const frontEl = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-front');
    const reserveBottom = stage && frontEl ? stage.top + parseFloat(getComputedStyle(frontEl).top || '0') : null;
    // What the chip is painted over: every drawn leaf of the front sheet whose box meets the chip's box.
    const under: string[] = [];
    if (cornerBox && corner && getComputedStyle(corner).display !== 'none') {
      for (const el of document.querySelectorAll('#score-stage .is-front svg text, #score-stage .is-front svg path, #score-stage .is-front svg line, #score-stage .is-front svg rect, #score-stage .is-front svg ellipse, #score-stage .is-front svg polygon')) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        if (overlaps(cornerBox, { left: b.left, top: b.top, right: b.right, bottom: b.bottom })) {
          const cls = (el.getAttribute('class') ?? '') || (el.parentElement?.getAttribute('class') ?? '');
          under.push(`${el.tagName}${cls ? '.' + cls.split(' ')[0] : ''}${el.tagName === 'text' ? '"' + (el.textContent ?? '') + '"' : ''}@${Math.round(b.top)}-${Math.round(b.bottom)}`);
        }
      }
    }
    return {
      text: node?.textContent ?? null,
      running: screen?.dataset.running ?? null,
      hearing: screen?.dataset.hearing ?? null,
      chrome: screen?.dataset.chrome ?? null,
      play: document.querySelector('#score-play')?.textContent ?? null,
      refused: [...document.querySelectorAll<HTMLElement>('[data-sound-refused]')].map((el) => el.id),
      scrollWidth: node?.scrollWidth ?? null,
      clientWidth: node?.clientWidth ?? null,
      textInside: r && text ? text.left >= r.left - 0.5 && text.right <= r.right + 0.5 : null,
      ellipsis: node ? getComputedStyle(node).textOverflow === 'ellipsis' : null,
      whiteSpace: node ? getComputedStyle(node).whiteSpace : null,
      lines: tops.length,
      clear,
      inWindow: r ? r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth : null,
      head: box(document.querySelector('#score-head')),
      line,
      stage,
      bar,
      ink,
      front,
      lineOverStage: overlaps(line, stage),
      lineOverBar: overlaps(line, bar),
      lineOverInk: overlaps(line, ink),
      fit: { zoom: w.__pianopath?.scoreFit?.()?.zoom ?? null, frozen: (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null },
      scale: cursor ? new DOMMatrixReadOnly(getComputedStyle(cursor).transform).a : null,
      corner: {
        text: corner?.textContent ?? null,
        display: corner ? getComputedStyle(corner).display : null,
        box: cornerBox,
        lines: cornerLines,
        reserveBottom,
        overReserve: cornerBox && reserveBottom !== null ? cornerBox.bottom > reserveBottom + 0.5 : null,
        overInk: overlaps(cornerBox, ink),
        underCount: under.length,
        under: under.slice(0, 30),
      },
    };
  });
}

async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))));
}

for (const condition of ['stack', 'wider-face', 'text-115'] as const) {
  for (const which of ['play-paused', 'hear-paused', 'play-over-demo'] as const) {
    test(`${which} on ${condition} (${LABEL})`, async ({ page }) => {
      test.setTimeout(120_000);
      const state = await setUp(page, condition);
      if (which === 'play-over-demo') {
        await pressAnywhere(page, '#score-hear');
        await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-hearing', 'true');
        await waitForFreeze(page);
      } else {
        await page.locator('#score-play').click({ timeout: 5_000 });
        await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
        await waitForFreeze(page);
        await revealBar(page);
        await page.locator('#score-play').click({ timeout: 5_000 });
        await expect(page.locator('#score-play')).toHaveText('▶');
      }
      // The ordinary line folded into the corner, before any refusal: the chip's own baseline.
      await page.waitForFunction(
        () => document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.chrome === 'folded',
        undefined,
        { timeout: 10_000 },
      );
      await frames(page);
      await page.waitForTimeout(400);
      const foldedBefore = await measure(page);
      if (condition === 'wider-face' && which === 'hear-paused') {
        fs.mkdirSync(PICTURES, { recursive: true });
        await page.screenshot({ path: path.join(PICTURES, `paused-342x740-wider-face-folded-no-refusal-${LABEL}.png`) });
      }
      await suspendForGood(page, state);
      await revealBar(page);
      await frames(page);
      const before = await measure(page);
      await revealBar(page);
      const onBar = await page.locator(CONTROL[which]).isVisible();
      const tapped = Date.now();
      await pressAnywhere(page, CONTROL[which]);
      await expect(page.locator('#score-waiting')).toHaveText(SENTENCE[which], { timeout: 10_000 });
      await revealBar(page);
      await frames(page);
      await page.waitForTimeout(400);
      const during = await measure(page);
      if (condition === 'wider-face' && which === 'hear-paused') {
        fs.mkdirSync(PICTURES, { recursive: true });
        await page.screenshot({ path: path.join(PICTURES, `paused-hear-342x740-wider-face-${LABEL}.png`) });
      }
      // The fold: three seconds after the last tap on the bar (the reveal above is a tap on the stage, which
      // re-arms the same timer), the header leaves the paint and the state line goes to the stage's corner.
      await page.waitForFunction(
        () => document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.chrome === 'folded',
        undefined,
        { timeout: 10_000 },
      );
      await frames(page);
      await page.waitForTimeout(400);
      const folded = await measure(page);
      if (condition === 'wider-face' && which === 'hear-paused') {
        await page.screenshot({ path: path.join(PICTURES, `paused-hear-342x740-wider-face-folded-${LABEL}.png`) });
      }
      const out = { label: LABEL, condition, path: which, sentence: SENTENCE[which], onBar, tapToFoldMs: Date.now() - tapped, foldedBefore, before, during, folded };
      fs.writeFileSync(path.join(RUNS, `probe-${which}-${condition}-${LABEL}.json`), JSON.stringify(out, null, 2));
      expect(during.text).toBe(SENTENCE[which]);
    });
  }
}

/** A bar held during a paused run: does it reach the sound's gate at all? */
test(`bar held during a paused run on wider-face (${LABEL})`, async ({ page }) => {
  test.setTimeout(120_000);
  const state = await setUp(page, 'wider-face');
  await page.locator('#score-play').click({ timeout: 5_000 });
  await waitForFreeze(page);
  await revealBar(page);
  await page.locator('#score-play').click({ timeout: 5_000 });
  await expect(page.locator('#score-play')).toHaveText('▶');
  await suspendForGood(page, state);
  await revealBar(page);
  const target = await page.evaluate(() => {
    const note = document.querySelector('#score-stage .is-front svg .vf-stavenote, #score-stage .is-front svg g.vf-note');
    const r = (note ?? document.querySelector('#score-stage .is-front svg'))!.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
  await page.waitForTimeout(1_800);
  const after = await page.evaluate(() => ({
    text: document.querySelector('#score-waiting')?.textContent ?? null,
    refused: [...document.querySelectorAll<HTMLElement>('[data-sound-refused]')].map((el) => el.id),
    running: document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.running ?? null,
  }));
  fs.writeFileSync(path.join(RUNS, `probe-bar-held-paused-wider-face-${LABEL}.json`), JSON.stringify({ label: LABEL, target, after }, null, 2));
  expect(after.running).toBe('true');
});
