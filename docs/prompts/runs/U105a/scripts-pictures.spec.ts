// U105a's picture probe, not for app/: the summary's Again tapped with the
// context suspended and its `resume` stubbed never to answer, upright at
// 342 x 740 and sideways at 740 x 342. Writes the picture and a JSON of what
// the page measured: the header's line, the bar's mirror, the sheet, the
// sheet's own refusal line (`#summary-refusal`, absent on the base), whether
// each is visible, covered or cut, and how each summary sentence fits the
// sheet's line at this width.
// Run from app/ with U105A_TESTDIR=build/u105a/probe and U105A_LABEL=before|after.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { setTempoPercent } from '../../../tests/e2e/scoreControls';

type Captured = Window & { __contexts?: AudioContext[] };

const ITEM = 'song.folk.hot-cross-buns';
const LABEL = process.env.U105A_LABEL ?? 'unlabelled';
const OUT = path.resolve(process.cwd(), '../docs/prompts/pictures/u105a');
const RUNS = path.resolve(process.cwd(), '../build/u105a');
const SENTENCE = 'Sound did not start — tap Again';
/** Every sentence a summary control's refusal can say (`help.test.ts`'s join). */
const SENTENCES = [
  'Sound did not start — tap Try again',
  'Sound did not start — tap Again',
  'Sound did not start — tap Slower again',
  'Sound did not start — tap Faster again',
  'Sound did not start — tap Loop again',
  // The longest `soundOff` sentence of all, for the margin.
  'Sound did not start — tap Carry on again',
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
  // The bar's copy only where the header is not drawn (landscape, 500 px high or less).
  await page.locator(width > height && height <= 500 ? '#score-title-side' : '#score-title').click({ timeout: 5_000 });
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
  await page.locator('#summary-again').click({ timeout: 5_000 });
  // Past the bound either way: the header's (or mirror's) sentence says the wait is over.
  await page.waitForFunction(
    (sentence) =>
      document.querySelector('#score-waiting')?.textContent === sentence ||
      document.querySelector('#score-status-side')?.textContent === sentence,
    SENTENCE,
    { timeout: 10_000 },
  );
  // One frame for the sheet's own line, drawn in the same pass.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${name}-${LABEL}.png`) });
  const measured = await page.evaluate((sentences) => {
    const box = (sel: string) => {
      const node = document.querySelector(sel);
      if (!(node instanceof HTMLElement)) return null;
      const r = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      // What is actually drawn at the line's middle: the line itself (or its text), or something over it.
      const mx = Math.min(Math.max(r.left + 4, 0), window.innerWidth - 1);
      const my = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
      const top = r.height > 0 ? document.elementFromPoint(mx, my) : null;
      return {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        right: Math.round(r.right),
        hidden: node.hidden,
        display: style.display,
        drawn: r.height > 0 && r.width > 0 && style.visibility !== 'hidden',
        inViewport: r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth,
        onTop: top === null ? null : node === top || node.contains(top),
        coveredBy: top === null || node === top || node.contains(top) ? null : `${top.tagName.toLowerCase()}#${top.id}.${[...top.classList].join('.')}`,
        text: node.textContent,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        cut: node.scrollWidth > node.clientWidth,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        role: node.getAttribute('role'),
        ariaLive: node.getAttribute('aria-live'),
        inert: node.closest('[inert]') !== null,
      };
    };
    const sheet = document.querySelector<HTMLElement>('#score-summary');
    const refusal = document.querySelector<HTMLElement>('#summary-refusal');
    const fits = (node: HTMLElement | null) => {
      if (!node || node.hidden) return [];
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
      headLine: box('#score-waiting'),
      mirror: box('#score-status-side'),
      head: box('#score-head'),
      bar: box('#score-bar'),
      sheet: box('#score-summary'),
      sheetScroll: sheet ? { scrollTop: sheet.scrollTop, scrollHeight: sheet.scrollHeight, clientHeight: sheet.clientHeight } : null,
      sheetRefusal: box('#summary-refusal'),
      again: { box: box('#summary-again'), refused: document.querySelector<HTMLElement>('#summary-again')?.dataset.soundRefused ?? null },
      play: document.querySelector('#score-play')?.textContent,
      fitsOnTheSheetLine: fits(refusal),
    };
  }, SENTENCES);
  fs.mkdirSync(RUNS, { recursive: true });
  fs.writeFileSync(path.join(RUNS, `probe-${name}-${LABEL}.json`), `${JSON.stringify({ viewport: { width, height }, contextState: await state(), ...measured }, null, 2)}\n`);
}

test('the refused summary, upright', async ({ page }) => {
  await refusedSummary(page, 342, 740, 'refused-summary');
});

test('the refused summary, sideways', async ({ page }) => {
  await refusedSummary(page, 740, 342, 'refused-summary-sideways');
});

// A tablet held sideways, for the record only (U105 did not probe one); its picture is moved to build/.
test('the refused summary, a tablet sideways', async ({ page }) => {
  await refusedSummary(page, 1024, 768, 'refused-summary-tablet');
});
