// U105b's probe, not for app/: the header's refusal line (`#score-waiting`) upright at 342 x 740,
// with the context suspended and its `resume` stubbed never to answer, read under four conditions —
// the app's font stack, the wider face `plan.spec.ts` forces (Verdana, or DejaVu Sans where Verdana
// is absent), 115 % text (`library.spec.ts`'s G101 convention), and a synthetic sentence written into
// the line far wider than any face could keep on one line — for the refusal on the summary (*Slower*,
// the sentence CI's run cut) and the refusal of ▶ with no summary up. Writes a JSON of what the page
// measured per case, and the wider-face summary picture into docs/prompts/pictures/u105b/.
// Run from app/ with U105B_TESTDIR=build/u105b/probe and U105B_LABEL=before|after.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { setTempoPercent } from '../../../tests/e2e/scoreControls';

type Captured = Window & { __contexts?: AudioContext[] };

const ITEM = 'song.folk.hot-cross-buns';
const LABEL = process.env.U105B_LABEL ?? 'unlabelled';
const PICTURES = path.resolve(process.cwd(), '../docs/prompts/pictures/u105b');
const RUNS = path.resolve(process.cwd(), '../build/u105b');
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
const SYNTHETIC = 'Sound did not start — tap Slower again, and this sentence goes on far past any line a phone could hold';

type Condition = 'stack' | 'wider-face' | 'text-115' | 'synthetic';

async function refused(page: Page, condition: Condition, onSummary: boolean): Promise<void> {
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
  if (condition === 'wider-face') await page.addStyleTag({ content: WIDER_FACE });
  const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
  await expect.poll(state).not.toBe('none');
  await page.locator('#score-title').click({ timeout: 5_000 });
  await expect.poll(state).toBe('running');
  let sentence = 'Sound did not start — tap ▶ again';
  let control = '#score-play';
  if (onSummary) {
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await page.locator('#score-play').click();
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
    sentence = 'Sound did not start — tap Slower again';
    control = '#summary-slower';
  }
  await page.evaluate(async () => {
    const ctx = (window as Captured).__contexts?.[0];
    await ctx?.suspend();
    if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
  });
  await expect.poll(state).toBe('suspended');
  const headBefore = await page.evaluate(() => document.querySelector('#score-head')?.getBoundingClientRect().height ?? -1);
  const stageBefore = await page.evaluate(() => {
    const r = document.querySelector('#score-stage')?.getBoundingClientRect();
    return r ? { top: r.top, height: r.height } : null;
  });
  await page.locator(control).click({ timeout: 5_000 });
  await expect(page.locator('#score-waiting')).toHaveText(sentence, { timeout: 10_000 });
  if (condition === 'synthetic') {
    await page.evaluate((text) => {
      const node = document.querySelector('#score-waiting');
      if (node) node.textContent = text;
    }, SYNTHETIC);
  }
  // Two frames, for the layout and the stage's ResizeObserver.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))));
  await page.waitForTimeout(600);
  const name = `${onSummary ? 'summary-slower' : 'play'}-${condition}`;
  if (condition === 'wider-face' && onSummary) {
    fs.mkdirSync(PICTURES, { recursive: true });
    await page.screenshot({ path: path.join(PICTURES, `upright-342x740-wider-face-${LABEL}.png`) });
  } else {
    fs.mkdirSync(path.join(RUNS, 'pictures'), { recursive: true });
    await page.screenshot({ path: path.join(RUNS, 'pictures', `${name}-${LABEL}.png`) });
  }
  const measured = await page.evaluate(() => {
    const node = document.querySelector<HTMLElement>('#score-waiting')!;
    const r = node.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(node);
    const text = range.getBoundingClientRect();
    const lines = range.getClientRects().length;
    const style = getComputedStyle(node);
    const stage = document.querySelector('#score-stage')?.getBoundingClientRect();
    const sheet = document.querySelector<HTMLElement>('#score-summary');
    const sheetBox = sheet && !sheet.hidden ? sheet.getBoundingClientRect() : null;
    const svg = document.querySelector('#score-stage .is-front svg')?.getBoundingClientRect();
    return {
      running: document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.running ?? null,
      text: node.textContent,
      classes: node.className,
      marked: Array.from(document.querySelectorAll<HTMLElement>('[data-sound-refused]')).map((m) => m.id),
      fontFamily: style.fontFamily,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      whiteSpace: style.whiteSpace,
      overflow: style.overflow,
      textOverflow: style.textOverflow,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      cut: node.scrollWidth > node.clientWidth,
      textInside: text.left >= r.left - 0.5 && text.right <= r.right + 0.5,
      lineBox: { top: r.top, bottom: r.bottom, height: r.height, left: r.left, right: r.right },
      textRuns: lines,
      headHeight: document.querySelector('#score-head')?.getBoundingClientRect().height ?? null,
      stage: stage ? { top: stage.top, height: stage.height } : null,
      frontSvg: svg ? { top: svg.top, height: svg.height, width: svg.width } : null,
      sheetTop: sheetBox?.top ?? null,
      lineAboveSheet: sheetBox === null ? null : r.bottom <= sheetBox.top,
    };
  });
  fs.mkdirSync(RUNS, { recursive: true });
  fs.writeFileSync(
    path.join(RUNS, `probe-${name}-${LABEL}.json`),
    `${JSON.stringify({ viewport: { width: 342, height: 740 }, condition, sentence, headBefore, stageBefore, ...measured }, null, 2)}\n`,
  );
}

for (const condition of ['stack', 'wider-face', 'text-115', 'synthetic'] as const) {
  test(`the refused summary, upright, ${condition}`, async ({ page }) => {
    await refused(page, condition, true);
  });
  test(`the refused ▶, upright, ${condition}`, async ({ page }) => {
    await refused(page, condition, false);
  });
}
