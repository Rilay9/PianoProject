// U119's probe, not for app/: the sideways bar's left group against its controls, across a grid of
// sideways sizes, both faces (the app's stack and a wider face forced onto every element), 100 % and
// 115 % text (the root font scaled, as an Android Display size does), with a CSS variant injected over
// the built CSS:
//   base:  nothing injected (whatever CSS the dist was built from);
//   h1:    the left group clips its own overflow across (`overflow-x: clip`);
//   h1e:   h1, and the status mirror shrinks inside the group so it keeps its ellipsis at the group's edge.
// State: a paused Wait run (frozen, then paused), the ordinary paused line in the mirror. Per cell: the
// geometry, a trial click (Playwright's actionability checks, hit-testing included, no action) on every
// control on the bar, then one real click on ▶ that must carry the run on. A JSON per cell.
// Run from app/ with U119_TESTDIR=build/u119/probe, U119_LABEL=<label>, U119_ONLY=<regex> to pick cases.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressControl, revealBar } from '../../../tests/e2e/scoreControls';

const ITEM = process.env.U119_ITEM ?? 'song.folk.hot-cross-buns';
const OUT = path.resolve(process.cwd(), '../build/u119/probe-out');
const LABEL = process.env.U119_LABEL ?? 'probe';
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
const SIDE = '@media (orientation: landscape) and (max-height: 500px)';
const VARIANTS: Record<string, string> = {
  base: '',
  h1: `${SIDE} { .screen--score .score-bar__left { overflow-x: clip; } }`,
  h1e: `${SIDE} { .screen--score .score-bar__left { overflow-x: clip; } .screen--score .score-bar__left > .score-bar__status { flex: 0 1 auto; min-width: 0; } }`,
  // H2 simulated: the app told the window is under NARROW_BAR_PX (short mode labels, the tempo label's
  // percentage gone), with and without the clip.
  h2sim: '',
  h1h2sim: `${SIDE} { .screen--score .score-bar__left { overflow-x: clip; } }`,
};
const NARROW_SIM = new Set(['h2sim', 'h1h2sim']);
const SIZES: [number, number][] = (process.env.U119_SIZES ?? '568x320,640x360,667x375,700x350,720x360,740x342,780x360,844x390')
  .split(',')
  .map((s) => s.split('x').map(Number) as [number, number]);
const TEXTS = (process.env.U119_TEXTS ?? '100,115').split(',');
const VARIANT_LIST = (process.env.U119_VARIANTS ?? 'base,h1,h1e').split(',');
const ONLY = process.env.U119_ONLY ? new RegExp(process.env.U119_ONLY) : null;
const CONTROLS = ['#score-back-side', '#score-play', '#score-hear', '#score-mode', '#score-hands-R', '#score-hands-L', '#score-hands-both', '#score-tempo-label', '#score-more'];

async function measure(page: Page): Promise<Record<string, unknown>> {
  await revealBar(page);
  await page.waitForTimeout(250);
  return page.evaluate((CONTROLS_IN_PAGE: string[]) => {
    type Box = { left: number; right: number; top: number; bottom: number; width: number };
    const r2 = (n: number) => +n.toFixed(2);
    const boxOf = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r2(r.left), right: r2(r.right), top: r2(r.top), bottom: r2(r.bottom), width: r2(r.width) };
    };
    const meet = (a: Box, b: Box): boolean => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
    const bar = document.querySelector<HTMLElement>('#score-bar')!;
    const group = document.querySelector<HTMLElement>('#score-bar-left')!;
    const g = boxOf(group)!;
    const clips = getComputedStyle(group).overflowX !== 'visible';
    const textOf = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const t = range.getBoundingClientRect();
      return { left: r2(t.left), right: r2(t.right), top: r2(t.top), bottom: r2(t.bottom), width: r2(t.width) };
    };
    const kid = (id: string) => {
      const el = document.querySelector<HTMLElement>(`#${id}`)!;
      const b = boxOf(el)!;
      const t = textOf(el);
      // What of it a learner can see: its own box, cut by the group's box where the group clips.
      const shownRight = clips ? Math.min(b.right, g.right) : b.right;
      const shownLeft = clips ? Math.max(b.left, g.left) : b.left;
      return {
        box: b,
        text: el.textContent,
        textBox: t,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        shown: r2(Math.max(0, shownRight - shownLeft)),
        textWhole: t.width > 0 && t.left >= shownLeft - 0.5 && t.right <= shownRight + 0.5 && el.scrollWidth <= el.clientWidth + 0.5,
        ellipsis: getComputedStyle(el).textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 0.5,
      };
    };
    const controls = CONTROLS_IN_PAGE.map((sel) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return { sel, present: false };
      const b = boxOf(el)!;
      const drawn = b.width > 0 && el.closest('#score-bar') !== null;
      let hit = 'n/a';
      if (drawn) {
        const top = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
        hit = top === null ? 'null' : top === el || el.contains(top) ? 'self' : `${top.tagName.toLowerCase()}#${top.id}`;
      }
      return { sel, present: true, drawn, box: b, hit, text: el instanceof HTMLSelectElement ? el.selectedOptions[0]?.textContent : el.textContent };
    });
    // What the left group draws over: each child's shown box against every control's box.
    const over: string[] = [];
    for (const id of ['score-back-side', 'score-title-side', 'score-where-side', 'score-status-side']) {
      const el = document.querySelector<HTMLElement>(`#${id}`)!;
      const b = boxOf(el)!;
      const shown = clips ? { ...b, left: Math.max(b.left, g.left), right: Math.min(b.right, g.right) } : b;
      if (shown.right - shown.left <= 0.5) continue;
      for (const c of controls) {
        if (!('box' in c) || !c.drawn || c.sel === '#score-back-side') continue;
        if (meet(shown, c.box!)) over.push(`${id}>${c.sel}`);
      }
    }
    const children = [...bar.children].filter((k) => k.getBoundingClientRect().height > 0);
    const rows = new Set(children.map((k) => Math.round(k.getBoundingClientRect().top)));
    return {
      innerWidth: window.innerWidth,
      rootFont: getComputedStyle(document.documentElement).fontSize,
      bar: { height: r2(bar.getBoundingClientRect().height), scrollHeight: bar.scrollHeight, rows: rows.size, visible: bar.dataset.visible, opacity: getComputedStyle(bar).opacity },
      group: { ...g, scrollWidth: group.scrollWidth, clips },
      back: kid('score-back-side'),
      title: kid('score-title-side'),
      where: kid('score-where-side'),
      status: kid('score-status-side'),
      controls,
      over,
      firstControlLeft: Math.min(...controls.filter((c) => 'box' in c && c.drawn && c.sel !== '#score-back-side').map((c) => c.box!.left)),
      play: document.querySelector('#score-play')?.textContent,
    };
  }, CONTROLS).catch((e) => ({ error: String(e) }));
}

for (const [vw, vh] of SIZES) {
  for (const text of TEXTS) {
    for (const face of ['stack', 'wider'] as const) {
      for (const variant of VARIANT_LIST) {
        const name = `${LABEL} ${String(vw)}x${String(vh)} t${text} ${face} ${variant}`;
        if (ONLY !== null && !ONLY.test(name)) continue;
        test(name, async ({ page }) => {
          test.setTimeout(120_000);
          await page.setViewportSize({ width: vw, height: vh });
          if (text !== '100') {
            await page.addInitScript((size) => {
              document.addEventListener('DOMContentLoaded', () => {
                document.documentElement.style.fontSize = `${size}%`;
              });
            }, text);
          }
          if (NARROW_SIM.has(variant)) {
            await page.addInitScript(() => {
              Object.defineProperty(window, 'innerWidth', { get: () => 439, configurable: true });
            });
          }
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
          if (face === 'wider') await page.addStyleTag({ content: WIDER_FACE });
          if (VARIANTS[variant] !== '') await page.addStyleTag({ content: VARIANTS[variant] });
          const out: Record<string, unknown> = { vw, vh, text, face, variant };
          await page.locator('#score-mode').selectOption('wait');
          await page.locator('#score-play').click({ timeout: 5_000, force: true });
          await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
          await page.waitForFunction(
            () => {
              const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
              return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
            },
            undefined,
            { timeout: 30_000 },
          );
          // The pause is set up with a forced click: it is not what is measured, and before the fix ⏸ can be
          // under the line as ▶ is.
          await revealBar(page);
          await page.locator('#score-play').click({ timeout: 5_000, force: true });
          await expect(page.locator('#score-play')).toHaveText('▶');
          await expect(page.locator('#score-status-side')).toHaveText(/Paused/);
          out.paused = await measure(page);
          if (process.env.U119_WIDE_WHERE) {
            // The bar count at three digits: the mirror's text set by hand, measured at once (the next sync
            // writes the real one back).
            await page.evaluate((t) => {
              document.querySelector('#score-where-side')!.textContent = t;
            }, process.env.U119_WIDE_WHERE);
            out.wideWhere = await measure(page);
          }
          fs.mkdirSync(OUT, { recursive: true });
          const barBox = await page.locator('#score-bar').boundingBox();
          if (barBox) {
            await page.screenshot({
              path: path.join(OUT, `${LABEL}-${String(vw)}x${String(vh)}-t${text}-${face}-${variant}.png`),
              clip: { x: 0, y: Math.max(0, barBox.y - 4), width: vw, height: barBox.height + 8 },
            });
          }
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
          fs.writeFileSync(path.join(OUT, `${LABEL}-${String(vw)}x${String(vh)}-t${text}-${face}-${variant}.json`), JSON.stringify(out, null, 2));
        });
      }
    }
  }
}
