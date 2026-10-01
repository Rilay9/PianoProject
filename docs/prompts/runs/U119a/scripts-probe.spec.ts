// U119a's probe, not for app/: the sideways bar's left group against its controls, across a grid of
// sideways sizes, both faces (the app's stack and a wider face forced onto every element), 100 % and
// 115 % text (the root font scaled, as an Android Display size does), two pieces (Hot Cross Buns,
// `bar 1 / 4`; Moonlight III, `bar 1 / 201`), on whatever build the preview serves.
// MODE=paused: a Wait run frozen, then paused (the ordinary paused line in the mirror).
// MODE=refusal: at rest, the sound's start never answering, ▶ then Hear it refused (U105d's sentence).
// Per cell: which controls are on the bar, the left group's geometry, the visible strings of the name
// and the status (computed from glyph positions), whether Back and `bar n / m` are whole, the widest
// location `bar m / m` measured by hand at once (put back in the same task), the rows, a trial click
// on every control on the bar, and one real click on ▶. A JSON per cell.
// Run from app/ with U119A_TESTDIR=build/u119a/probe, U119A_LABEL=<label>, U119A_ONLY=<regex>.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressAnywhere, pressControl, revealBar } from '../../../tests/e2e/scoreControls';

const OUT = path.resolve(process.cwd(), '../build/u119a/probe-out');
const LABEL = process.env.U119A_LABEL ?? 'probe';
const MODE = process.env.U119A_MODE ?? 'paused';
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
const PIECES: Record<string, string> = {
  hcb: 'song.folk.hot-cross-buns',
  moon: 'song.classical.beethoven-moonlight-iii',
};
const SIZES: [number, number][] = (process.env.U119A_SIZES ?? '568x320,640x360,667x375,700x350,720x360,740x342,780x360,844x390')
  .split(',')
  .map((s) => s.split('x').map(Number) as [number, number]);
const TEXTS = (process.env.U119A_TEXTS ?? '100,115').split(',');
const PIECE_LIST = (process.env.U119A_PIECES ?? 'hcb,moon').split(',');
const ONLY = process.env.U119A_ONLY ? new RegExp(process.env.U119A_ONLY) : null;
const CONTROLS = ['#score-back-side', '#score-play', '#score-hear', '#score-mode', '#score-hands-R', '#score-hands-L', '#score-hands-both', '#score-tempo-label', '#score-more'];

type Captured = Window & { __contexts?: AudioContext[] };

async function measure(page: Page): Promise<Record<string, unknown>> {
  await revealBar(page);
  await page.waitForTimeout(250);
  return page.evaluate((CONTROLS_IN_PAGE: string[]) => {
    const r2 = (n: number) => +n.toFixed(2);
    const bar = document.querySelector<HTMLElement>('#score-bar')!;
    const group = document.querySelector<HTMLElement>('#score-bar-left')!;
    const g = group.getBoundingClientRect();
    const clips = getComputedStyle(group).overflowX !== 'visible';
    const drawn = (el: Element) => {
      const r = el.getBoundingClientRect();
      return clips ? { left: Math.max(r.left, g.left), right: Math.min(r.right, g.right) } : { left: r.left, right: r.right };
    };
    // The harness's own test (`barLeftAgainstControls`): every glyph inside what it draws, nothing cut inside its own box.
    const whole = (el: HTMLElement): boolean => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const t = range.getBoundingClientRect();
      const d = drawn(el);
      return t.width > 0 && t.left >= d.left - 0.5 && t.right <= d.right + 0.5 && el.scrollWidth <= el.clientWidth + 0.5;
    };
    // What a learner reads: the characters wholly inside what the element draws; with a drawn ellipsis,
    // those that fit before it (Chromium draws `…` after the last character that fits with it).
    const visible = (el: HTMLElement) => {
      const node = el.firstChild;
      const text = el.textContent ?? '';
      if (node === null || node.nodeType !== Node.TEXT_NODE || text === '') return { text, shown: '', cut: 'empty' };
      const cs = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const d = drawn(el);
      if (d.right - d.left <= 0.5) return { text, shown: '', cut: 'nothing drawn' };
      const overflowing = el.scrollWidth > el.clientWidth + 0.5;
      const ellipsis = cs.textOverflow === 'ellipsis' && overflowing && box.right <= d.right + 0.5;
      let ellW = 0;
      if (ellipsis) {
        const s = document.createElement('span');
        s.textContent = '…';
        s.style.font = cs.font;
        s.style.position = 'absolute';
        s.style.whiteSpace = 'pre';
        document.body.append(s);
        ellW = s.getBoundingClientRect().width;
        s.remove();
      }
      const limit = ellipsis ? Math.min(box.right, d.right) - ellW : Math.min(box.right, d.right);
      const range = document.createRange();
      let k = 0;
      for (let i = 1; i <= text.length; i += 1) {
        range.setStart(node, 0);
        range.setEnd(node, i);
        if (range.getBoundingClientRect().right <= limit + 0.01) k = i;
        else break;
      }
      if (k === text.length && !overflowing && box.right <= d.right + 0.5) return { text, shown: text, cut: 'whole' };
      if (ellipsis) return { text, shown: `${text.slice(0, k)}…`, cut: 'ellipsis' };
      // Flush: the next character partly drawn, if anything of it is inside.
      let partial = '';
      if (k < text.length) {
        range.setStart(node, k);
        range.setEnd(node, k + 1);
        if (range.getBoundingClientRect().left < Math.min(box.right, d.right) - 0.5) partial = text[k];
      }
      return { text, shown: `${text.slice(0, k)}${partial === '' ? '' : `[${partial}]`}`, cut: 'flush' };
    };
    const kid = (id: string) => {
      const el = document.querySelector<HTMLElement>(`#${id}`)!;
      const b = el.getBoundingClientRect();
      return { left: r2(b.left), right: r2(b.right), width: r2(b.width), height: r2(b.height), top: r2(b.top), whole: whole(el), ...visible(el) };
    };
    const where = document.querySelector<HTMLElement>('#score-where-side')!;
    const rightNow = where.textContent ?? '';
    const last = /\/ (\d+)$/.exec(rightNow)?.[1] ?? '';
    // The widest location of the piece, measured at once and put back.
    where.textContent = `bar ${last} / ${last}`;
    const widest = { text: where.textContent, whole: whole(where), right: r2(where.getBoundingClientRect().right), groupRight: r2(group.getBoundingClientRect().right) };
    where.textContent = rightNow;
    const controls = CONTROLS_IN_PAGE.map((sel) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return { sel, present: false };
      const b = el.getBoundingClientRect();
      const onBar = el.closest('#score-bar') !== null && b.width > 0;
      let hit = 'n/a';
      if (onBar) {
        const top = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
        hit = top === null ? 'null' : top === el || el.contains(top) ? 'self' : `${top.tagName.toLowerCase()}#${top.id}`;
      }
      return { sel, onBar, left: r2(b.left), right: r2(b.right), top: r2(b.top), height: r2(b.height), hit };
    });
    const children = [...bar.children].filter((k) => k.getBoundingClientRect().height > 0);
    const rows = new Set(children.map((k) => Math.round(k.getBoundingClientRect().top)));
    const controlRows = new Set(children.filter((k) => k !== group).map((k) => Math.round(k.getBoundingClientRect().top)));
    return {
      innerWidth: window.innerWidth,
      rootFont: getComputedStyle(document.documentElement).fontSize,
      refused: document.querySelector('[data-sound-refused]')?.id ?? null,
      bar: {
        height: r2(bar.getBoundingClientRect().height),
        rows: rows.size,
        controlRows: controlRows.size,
        tops: children.map((k) => `${k.id || k.className}:${String(Math.round(k.getBoundingClientRect().top))}`),
      },
      group: { left: r2(g.left), right: r2(g.right), width: r2(g.width), height: r2(g.height), top: r2(g.top), scrollWidth: group.scrollWidth, clips },
      back: kid('score-back-side'),
      title: kid('score-title-side'),
      where: kid('score-where-side'),
      widest,
      status: kid('score-status-side'),
      controls,
      handsOnBar: document.querySelector('#score-hands-R')?.closest('#score-bar') !== null,
      hearOnBar: document.querySelector('#score-hear')?.closest('#score-bar') !== null,
      tempo: document.querySelector('#score-tempo-label')?.textContent,
      mode: document.querySelector<HTMLSelectElement>('#score-mode')?.selectedOptions[0]?.textContent,
    };
  }, CONTROLS).catch((e) => ({ error: String(e) }));
}

for (const [vw, vh] of SIZES) {
  for (const text of TEXTS) {
    for (const face of ['stack', 'wider'] as const) {
      for (const piece of PIECE_LIST) {
        const name = `${LABEL} ${MODE} ${String(vw)}x${String(vh)} t${text} ${face} ${piece}`;
        if (ONLY !== null && !ONLY.test(name)) continue;
        test(name, async ({ page }) => {
          test.setTimeout(150_000);
          await page.setViewportSize({ width: vw, height: vh });
          if (text !== '100') {
            await page.addInitScript((size) => {
              document.addEventListener('DOMContentLoaded', () => {
                document.documentElement.style.fontSize = `${size}%`;
              });
            }, text);
          }
          if (face === 'wider') {
            // From the first paint, as a phone's own face is: injected after the load, the bar's fit
            // (which runs on render and resize) is left over from the app's stack until the next render.
            await page.addInitScript((css) => {
              document.addEventListener('DOMContentLoaded', () => {
                const style = document.createElement('style');
                style.textContent = css;
                document.head.append(style);
              });
            }, WIDER_FACE);
          }
          if (MODE === 'refusal') {
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
          }
          await page.goto(`/#/score/${PIECES[piece]}`);
          await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
          await page.waitForFunction(
            () => {
              const svg = document.querySelector('#score-stage .is-front svg');
              return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
            },
            undefined,
            { timeout: 60_000 },
          );
          const out: Record<string, unknown> = { vw, vh, text, face, piece, mode: MODE };
          out.atRest = await measure(page);
          if (MODE === 'paused') {
            await page.locator('#score-mode').selectOption('wait');
            await page.locator('#score-play').dispatchEvent('click');
            await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
            await page.waitForFunction(
              () => {
                const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
                return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
              },
              undefined,
              { timeout: 30_000 },
            );
            await page.locator('#score-play').dispatchEvent('click');
            await expect(page.locator('#score-play')).toHaveText('▶');
            await expect(page.locator('#score-status-side')).toHaveText(/^Paused/);
            out.paused = await measure(page);
          } else {
            const state = (): Promise<string> => page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
            await expect.poll(state).not.toBe('none');
            await page.locator(process.env.U119A_GESTURE ?? '#score-title-side').click({ timeout: 5_000, force: true, ...(process.env.U119A_GESTURE ? { position: { x: 2, y: 4 } } : {}) });
            await expect.poll(state).toBe('running');
            await page.evaluate(async () => {
              const ctx = (window as Captured).__contexts?.[0];
              await ctx?.suspend();
              if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
            });
            await expect.poll(state).toBe('suspended');
            for (const [id, sentence] of [
              ['#score-play', 'Sound did not start — tap ▶ again'],
              ['#score-hear', 'Sound did not start — tap Hear it again'],
            ] as const) {
              await pressAnywhere(page, id);
              await expect(page.locator('#score-status-side')).toHaveText(sentence, { timeout: 10_000 });
              out[`refused-${id.slice(7)}`] = await measure(page);
            }
            // A render while the refusal stands: the tempo label's sheet opened and closed (a real tap; the
            // screen renders on both), then a resize event (what a rotation or the browser's own bars send).
            await pressControl(page, '#score-tempo-label');
            await expect(page.locator('#score-tempo-sheet')).toBeVisible();
            await page.locator('#score-tempo-sheet-close').click();
            await expect(page.locator('#score-tempo-sheet')).toBeHidden();
            out['refused-after-tempo'] = await measure(page);
            await page.evaluate(() => window.dispatchEvent(new Event('resize')));
            out['refused-after-resize'] = await measure(page);
          }
          fs.mkdirSync(OUT, { recursive: true });
          const barBox = await page.locator('#score-bar').boundingBox();
          if (barBox) {
            await page.screenshot({
              path: path.join(OUT, `${LABEL}-${MODE}-${String(vw)}x${String(vh)}-t${text}-${face}-${piece}.png`),
              clip: { x: 0, y: Math.max(0, barBox.y - 4), width: vw, height: barBox.height + 8 },
            });
          }
          if (MODE === 'paused') {
            const trial: Record<string, string> = {};
            for (const sel of CONTROLS) {
              await revealBar(page);
              const loc = page.locator(sel);
              if (!(await loc.isVisible())) {
                trial[sel] = 'not visible';
                continue;
              }
              try {
                await loc.click({ trial: true, timeout: 1_500 });
                trial[sel] = 'ok';
              } catch (e) {
                const m = /<(\w+)[^>]*id="([^"]+)"[^>]*>[^\n]*intercepts pointer events/.exec(String(e));
                trial[sel] = m ? `intercepted by #${m[2]}` : 'failed';
              }
            }
            out.trial = trial;
            let real = 'ok';
            try {
              await pressControl(page, '#score-play');
              await expect(page.locator('#score-play')).toHaveText('⏸', { timeout: 3_000 });
            } catch (e) {
              const m = /id="([^"]+)"[^>]*>[^\n]*intercepts pointer events/.exec(String(e));
              real = m ? `intercepted by #${m[1]}` : `failed: ${String(e).slice(0, 120)}`;
            }
            out.realPlay = real;
          }
          fs.writeFileSync(path.join(OUT, `${LABEL}-${MODE}-${String(vw)}x${String(vh)}-t${text}-${face}-${piece}.json`), JSON.stringify(out, null, 2));
        });
      }
    }
  }
}
