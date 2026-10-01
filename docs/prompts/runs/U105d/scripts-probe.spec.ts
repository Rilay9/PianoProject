// U105d's probe, not for app/: the sideways bar's status mirror (`#score-status-side`) at 740 x 342 (or
// U105D_VIEWPORT), on the app's stack and on the wider face, with a CSS variant injected over the built CSS:
//   base:          nothing injected (whatever CSS the dist was built from);
//   h1:            the refused mirror's 28vw cap lifted, `nowrap` kept;
//   h2:            the refused mirror allowed to wrap and to shrink with the title;
//   h2-noflex:     h2 without `flex: 0 1 auto` (does it wrap at all under the landscape rule's `flex: none`?);
//   h2-titlefirst: h2 with a tiny shrink factor, so the title would yield first;
//   h2-balance:    `text-wrap: balance` over the dist's CSS.
// Two states: a paused Wait run (frozen, paused) and at rest (no run). In each, the ordinary line is read,
// then the context is suspended with `resume` never answering and ▶, then `Hear it`, are refused.
// Every read reveals the bar first. Per case a JSON of what the page measured, and in the paused state a
// screenshot of each refusal.
// Run from app/ with U105D_TESTDIR=build/u105d/probe, U105D_LABEL=<label>, and U105D_ONLY=<regex> to pick cases.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressAnywhere, pressControl, revealBar } from '../../../tests/e2e/scoreControls';

type Captured = Window & { __contexts?: AudioContext[] };

const ITEM = 'song.folk.hot-cross-buns';
const OUT = path.resolve(process.cwd(), '../build/u105d/probe-out');
const LABEL = process.env.U105D_LABEL ?? 'probe';
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
const REFUSED = 'body:has([data-sound-refused]) .screen--score .score-bar__status';
const VARIANTS = {
  base: '',
  h1: `${REFUSED} { max-width: none; }`,
  h2: `${REFUSED} { max-width: none; flex: 0 1 auto; min-width: 0; white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; }`,
  'h2-titlefirst': `${REFUSED} { max-width: none; flex: 0 0.01 auto; min-width: 0; white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; }`,
  'h2-balance': `${REFUSED} { text-wrap: balance; }`,
  'h2-noflex': `${REFUSED} { max-width: none; white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; }`,
} as const;
const [VW, VH] = (process.env.U105D_VIEWPORT ?? '740x342').split('x').map(Number);
const ONLY = process.env.U105D_ONLY ? new RegExp(process.env.U105D_ONLY) : null;

async function measure(page: Page): Promise<Record<string, unknown>> {
  await revealBar(page);
  await page.waitForTimeout(250);
  return page.evaluate(() => {
    const box = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: +r.left.toFixed(2), top: +r.top.toFixed(2), right: +r.right.toFixed(2), bottom: +r.bottom.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2) };
    };
    const meet = (a: DOMRect, b: DOMRect): boolean =>
      a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
    const bar = document.querySelector<HTMLElement>('#score-bar')!;
    const node = document.querySelector<HTMLElement>('#score-status-side')!;
    const r = node.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(node);
    const text = range.getBoundingClientRect();
    const lines = [...range.getClientRects()].filter((p) => p.width > 0);
    const lineTops = [...new Set(lines.map((p) => Math.round(p.top)))];
    const hit = (x: number, y: number): string => {
      const top = document.elementFromPoint(x, y);
      if (top === null) return 'null';
      if (top === node || node.contains(top)) return 'self';
      return `${top.tagName.toLowerCase()}#${top.id}.${[...top.classList].join('.')}`;
    };
    const hits = lines.flatMap((p) => {
      const y = p.top + p.height / 2;
      return [p.left + 2, (p.left + p.right) / 2, p.right - 2].map((x) => hit(x, y));
    });
    const controls = [...bar.querySelectorAll<HTMLElement>(':scope > :not(.score-bar__left)')].map((el) => ({
      id: el.id || el.className,
      box: box(el),
      overStatus: meet(el.getBoundingClientRect(), r),
    }));
    const children = [...bar.children].filter((k) => k.getBoundingClientRect().height > 0);
    const rows = [...new Set(children.map((k) => Math.round(k.getBoundingClientRect().top)))];
    const section = document.querySelector<HTMLElement>('section[data-screen="score"]')!;
    return {
      visible: bar.dataset.visible,
      barOpacity: getComputedStyle(bar).opacity,
      running: section.dataset.running,
      play: document.querySelector('#score-play')?.textContent,
      refusedMarks: [...document.querySelectorAll('[data-sound-refused]')].map((el) => el.id),
      bar: { ...box(bar), scrollHeight: bar.scrollHeight, clientHeight: bar.clientHeight, rows },
      barH: section.style.getPropertyValue('--score-bar-h'),
      left: box(document.querySelector('#score-bar-left')),
      back: box(document.querySelector('#score-back-side')),
      title: { ...box(document.querySelector('#score-title-side')), scrollWidth: document.querySelector<HTMLElement>('#score-title-side')!.scrollWidth, text: document.querySelector('#score-title-side')?.textContent },
      where: { ...box(document.querySelector('#score-where-side')), text: document.querySelector('#score-where-side')?.textContent },
      status: {
        ...box(node),
        text: node.textContent,
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        textInside: text.left >= r.left - 0.5 && text.right <= r.right + 0.5,
        textBox: box({ getBoundingClientRect: () => text } as unknown as Element),
        ellipsis: getComputedStyle(node).textOverflow === 'ellipsis',
        whiteSpace: getComputedStyle(node).whiteSpace,
        maxWidth: getComputedStyle(node).maxWidth,
        lineCount: lineTops.length,
        hits,
      },
      controls,
      inBar: ['score-play', 'score-hear', 'score-mode', 'score-tempo-label', 'score-more'].map((id) => ({
        id,
        inBar: document.querySelector(`#score-bar #${id}`) !== null,
      })),
      handsInBar: document.querySelector('#score-bar [id^="score-hands-"]') !== null,
      rightmost: Math.max(...controls.map((c) => c.box?.right ?? 0)),
      innerWidth: window.innerWidth,
      stage: box(document.querySelector('#score-stage')),
    };
  });
}

async function setUp(page: Page, face: string): Promise<() => Promise<string>> {
  await page.setViewportSize({ width: VW, height: VH });
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
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  if (face === 'wider-face') await page.addStyleTag({ content: WIDER_FACE });
  const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
  await expect.poll(state).not.toBe('none');
  await page.locator('#score-title-side').click({ timeout: 5_000 });
  await expect.poll(state).toBe('running');
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

for (const face of ['stack', 'wider-face'] as const) {
  for (const variant of Object.keys(VARIANTS) as (keyof typeof VARIANTS)[]) {
    for (const where of ['paused', 'rest'] as const) {
      const name = `${LABEL} ${where} ${face} ${variant}`;
      if (ONLY !== null && !ONLY.test(name)) continue;
      test(name, async ({ page }) => {
        test.setTimeout(120_000);
        const state = await setUp(page, face);
        if (VARIANTS[variant] !== '') await page.addStyleTag({ content: VARIANTS[variant] });
        fs.mkdirSync(OUT, { recursive: true });
        const out: Record<string, unknown> = { where, face, variant };
        if (where === 'paused') {
          await page.locator('#score-mode').selectOption('wait');
          await pressControl(page, '#score-play');
          await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
          await page.waitForFunction(
            () => {
              const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
              return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
            },
            undefined,
            { timeout: 30_000 },
          );
          await pressControl(page, '#score-play');
          await expect(page.locator('#score-play')).toHaveText('▶');
          await expect(page.locator('#score-status-side')).toHaveText(/Paused/);
        }
        out.ordinary = await measure(page);
        await suspendForGood(page, state);
        for (const [id, sentence] of [
          ['#score-play', 'Sound did not start — tap ▶ again'],
          ['#score-hear', 'Sound did not start — tap Hear it again'],
        ] as const) {
          await pressAnywhere(page, id);
          await expect(page.locator('#score-status-side')).toHaveText(sentence, { timeout: 10_000 });
          out[id] = await measure(page);
          if (where === 'paused') {
            await page.screenshot({ path: path.join(OUT, `${LABEL}-${where}-${face}-${variant}-${id === '#score-hear' ? 'hear' : 'play'}.png`) });
          }
        }
        fs.writeFileSync(path.join(OUT, `${LABEL}-${where}-${face}-${variant}.json`), JSON.stringify(out, null, 2));
      });
    }
  }
}
