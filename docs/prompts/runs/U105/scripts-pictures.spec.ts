// U105's picture probe, not for app/: the summary's Again tapped with the
// context suspended and its `resume` stubbed never to answer, upright at
// 342 x 740 and sideways at 740 x 342. Writes the picture and a JSON of what
// the page measured: where the state line is against the sheet, whether it is
// cut, and how each sentence U105 can put there fits the line at this width.
// Run from app/ with U105_TESTDIR=build/u105/probe and U105_LABEL=committed|fixed.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { setTempoPercent } from '../../../tests/e2e/scoreControls';

type Captured = Window & { __contexts?: AudioContext[] };

const ITEM = 'song.folk.hot-cross-buns';
const LABEL = process.env.U105_LABEL ?? 'unlabelled';
const OUT = path.resolve(process.cwd(), '../docs/prompts/pictures/u105');
const RUNS = path.resolve(process.cwd(), '../build/u105');
const SENTENCE = 'Sound did not start — tap Again';
/** Every sentence `STATE_TEXT.soundOff` can say after U105, as `help.test.ts` lists them. */
const SENTENCES = [
  'Sound did not start — tap ▶ again',
  'Sound did not start — tap Hear it again',
  'Sound did not start — tap ▶',
  'Sound did not start — tap Carry on again',
  'Sound did not start — tap Start again',
  'Sound did not start — tap R again',
  'Sound did not start — tap Both again',
  'Sound did not start — hold bar 12 again',
  'Sound did not start — tap Try again',
  'Sound did not start — tap Again',
  'Sound did not start — tap Slower again',
  'Sound did not start — tap Faster again',
  'Sound did not start — tap Loop again',
];

async function refusedSummary(page: Page, width: number, height: number, name: string): Promise<void> {
  await page.setViewportSize({ width, height });
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
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
  const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
  await expect.poll(state).not.toBe('none');
  // An ordinary tap on the title, which is no control: the one-shot first-gesture start is spent.
  await page.locator(width > height ? '#score-title-side' : '#score-title').click({ timeout: 5_000 });
  await expect.poll(state).toBe('running');
  await page.locator('#score-mode').selectOption('tempo');
  await setTempoPercent(page, 130);
  await page.locator('#score-play').click();
  const summary = page.locator('#score-summary');
  await expect(summary).toBeVisible({ timeout: 60_000 });
  await page.evaluate(async () => {
    const ctx = (window as Captured).__contexts?.[0];
    await ctx?.suspend();
    if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
  });
  await expect.poll(state).toBe('suspended');
  const tapped = Date.now();
  await page.locator('#summary-again').click({ timeout: 5_000 });
  // The fixed screen: the sentence. The committed one never says it: a moment past the bound instead.
  await page.waitForFunction(
    ([sentence, since]) =>
      document.querySelector('#score-waiting')?.textContent === sentence || Date.now() - (since as number) > 1_500,
    [SENTENCE, tapped] as const,
    { timeout: 10_000 },
  );
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${name}-${LABEL}.png`) });
  const measured = await page.evaluate((sentences) => {
    const box = (sel: string) => {
      const node = document.querySelector(sel);
      if (!(node instanceof HTMLElement)) return null;
      const r = node.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, hidden: node.hidden, visible: r.height > 0 && getComputedStyle(node).visibility !== 'hidden' };
    };
    const line = document.querySelector<HTMLElement>('#score-waiting');
    const side = document.querySelector<HTMLElement>('#score-status-side');
    const style = line ? getComputedStyle(line) : null;
    const fits = (node: HTMLElement | null) => {
      if (!node) return [];
      const was = node.textContent;
      const out = sentences.map((text) => {
        node.textContent = text;
        return { text, chars: [...text].length, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, height: node.offsetHeight, cut: node.scrollWidth > node.clientWidth };
      });
      node.textContent = was;
      return out;
    };
    return {
      section: {
        running: document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.running,
        tablet: document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.tablet,
      },
      line: { text: line?.textContent, box: box('#score-waiting'), whiteSpace: style?.whiteSpace, textOverflow: style?.textOverflow, overflow: style?.overflow, cut: line ? line.scrollWidth > line.clientWidth : null },
      side: { text: side?.textContent, box: box('#score-status-side') },
      head: box('#score-head'),
      bar: box('#score-bar'),
      sheet: box('#score-summary'),
      again: { box: box('#summary-again'), refused: document.querySelector<HTMLElement>('#summary-again')?.dataset.soundRefused ?? null },
      play: document.querySelector('#score-play')?.textContent,
      fitsOnTheLine: fits(line),
    };
  }, SENTENCES);
  fs.writeFileSync(path.join(RUNS, `probe-${name}-${LABEL}.json`), `${JSON.stringify({ viewport: { width, height }, contextState: await state(), ...measured }, null, 2)}\n`);
}

test('the refused summary, upright', async ({ page }) => {
  await refusedSummary(page, 342, 740, 'refused-summary');
});

test('the refused summary, sideways', async ({ page }) => {
  await refusedSummary(page, 740, 342, 'refused-summary-sideways');
});
