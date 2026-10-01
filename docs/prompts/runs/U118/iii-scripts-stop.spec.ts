// U118's stop-condition probe, not for the commit. On the code as it stands (no edit), for each phone
// cell: the run's frozen shape (systems on the stage, systems in the window, bars shown, the drawn scale)
// with the stage as it is, and with the stage made shorter during a run by the two-line chip reserve —
// a `margin-top` on `.score-stage` while `data-running` is true, off a tablet. That is the pricing pass
// (`fitFor`, `nextInView`, `aheadFor`) and the slot fit (`perSlot`) seeing `stage.height - R` before the
// freeze, which is what the ruling's pre-freeze reserve asks of them, measured without touching the
// chooser. R is computed from the chip's own folded rule (`style.css`: `top: 4px`, `padding: 1px 4px`,
// `font-size: 0.8rem`, `line-height: 1.2`) at the page's root font size, two lines.
// Then the run is paused and left to fold, and the folded stage, the chip and the first slot are read.
// A third arm, `placed`, prices nothing differently and moves the drawn stacked slots down by R once
// folded (`margin-top` on `.score-buffer`): the placement-only stand-in.
// Run from app/ with U118_TESTDIR=build/u118/probe, U118_ARMS=as-is,reserved[,placed], and
// U118_SET=not-tablets for the window-rule spec's 768 x 1024 and 1024 x 768. Writes
// build/u118/probe-out/<cell>-<arm>.json.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressControl, withScoreMenu } from '../../../tests/e2e/scoreControls';

const OUT = path.resolve(process.cwd(), 'build/u118/probe-out');

const VIEWPORTS = [
  { name: '342x740', width: 342, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '360x780', width: 360, height: 780 },
  { name: '360x844', width: 360, height: 844 },
];
const PIECES = [
  { id: 'song.folk.hot-cross-buns', short: 'hcb' },
  { id: 'exercise.five-finger.c-major.right', short: 'five-finger' },
  { id: 'song.folk.twinkle.ht', short: 'twinkle' },
  { id: 'song.classical.chopin-nocturne-op48-1.nifc', short: 'nocturne-48' },
];
const BARS = [1, 2, 4, 8];

async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(200);
  await page.waitForSelector('.score-view[data-settled]', { timeout: 30_000 }).catch(() => undefined);
  await page
    .waitForFunction(
      () => {
        const hooks = window as unknown as {
          __pianopath?: { scoreFit?: () => { zoom?: number; barsShown?: number; slotCount?: number } | null };
        };
        const fit = hooks.__pianopath?.scoreFit?.();
        if (typeof fit?.zoom !== 'number') return false;
        const key = `${String(fit.zoom)}|${String(fit.barsShown)}|${String(fit.slotCount)}|${
          document.querySelector<HTMLElement>('#score-stage .score-buffer.is-front')?.style.transform ?? ''
        }`;
        const seen = window as unknown as { __u118Key?: string; __u118Same?: number };
        if (seen.__u118Key === key) seen.__u118Same = (seen.__u118Same ?? 0) + 1;
        else {
          seen.__u118Key = key;
          seen.__u118Same = 0;
        }
        return (seen.__u118Same ?? 0) >= 3;
      },
      undefined,
      { timeout: 30_000, polling: 100 },
    )
    .catch(() => undefined);
}

async function setBars(page: Page, bars: number): Promise<void> {
  await withScoreMenu(page, async () => {
    const down = page.locator('#score-bars-down');
    for (let i = 0; i < 8 && (await down.isEnabled()); i += 1) await down.click();
    const up = page.locator('#score-bars-up');
    for (let i = 1; i < bars && (await up.isEnabled()); i += 1) await up.click();
  });
  await settle(page);
}

async function shape(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const w = window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> } };
    const fit = w.__pianopath?.scoreFit?.() ?? {};
    const stage = document.querySelector<HTMLElement>('#score-stage');
    const head = document.querySelector<HTMLElement>('#score-head');
    const frozen = fit.frozen as { scale?: number } | null;
    return {
      readAhead: fit.readAhead,
      slots: fit.slotCount,
      systems: fit.systemsPerWindow,
      shown: fit.barsShown,
      asked: fit.barsAsked,
      zoom: fit.zoom,
      frozenScale: frozen?.scale ?? null,
      drawn: frozen?.scale && typeof fit.zoom === 'number' ? Math.round(frozen.scale * fit.zoom * 10000) / 10000 : null,
      fitBy: stage?.dataset.fit ?? null,
      priced: fit.priced,
      stageH: stage ? Math.round(stage.getBoundingClientRect().height * 100) / 100 : null,
      stageTop: stage ? Math.round(stage.getBoundingClientRect().top * 100) / 100 : null,
      headH: head && getComputedStyle(head).display !== 'none' ? Math.round(head.getBoundingClientRect().height * 100) / 100 : 0,
      chrome: document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.chrome ?? null,
      band: (fit as { foldedReserve?: number }).foldedReserve ?? null,
    };
  });
}

async function folded(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    const s = stage.getBoundingClientRect();
    const corner = document.querySelector<HTMLElement>('#score-corner');
    const c = corner && getComputedStyle(corner).display !== 'none' ? corner.getBoundingClientRect() : null;
    const range = document.createRange();
    if (corner) range.selectNodeContents(corner);
    const lines = corner ? new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size : 0;
    const front = [...stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')].filter((b) => !b.hidden);
    const tops = front.map((b) => Math.round((b.getBoundingClientRect().top - s.top) * 100) / 100).sort((a, b) => a - b);
    const fit = (window as unknown as { __pianopath?: { scoreFit?: () => { slots?: { range: { fromMeasure: number } | null }[] } } }).__pianopath?.scoreFit?.();
    const placed = front
      .map((b) => ({
        buffer: Number(b.dataset.buffer ?? -1),
        top: Math.round((Number.parseFloat(getComputedStyle(b).top) + Number.parseFloat(getComputedStyle(b).marginTop || '0')) * 100) / 100,
        from: fit?.slots?.[Number(b.dataset.buffer ?? -1)]?.range?.fromMeasure ?? null,
        ahead: b.classList.contains('is-ahead'),
        cursor: b.classList.contains('is-cursor'),
      }))
      .sort((a, b) => a.top - b.top);
    const under: string[] = [];
    let inkTop = Infinity;
    let inkBottom = -Infinity;
    for (const el of stage.querySelectorAll('.score-buffer.is-front svg text, .score-buffer.is-front svg path, .score-buffer.is-front svg rect, .score-buffer.is-front svg line')) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 && b.height === 0) continue;
      inkTop = Math.min(inkTop, b.top - s.top);
      inkBottom = Math.max(inkBottom, b.bottom - s.top);
      if (c && b.left < c.right && c.left < b.right && b.top < c.bottom && c.top < b.bottom) {
        const cls = (el.getAttribute('class') ?? '') || (el.parentElement?.getAttribute('class') ?? '');
        under.push(`${el.tagName}${cls ? '.' + cls.split(' ')[0] : ''}${el.tagName === 'text' ? '"' + (el.textContent ?? '') + '"' : ''}`);
      }
    }
    return {
      stageH: Math.round(s.height * 100) / 100,
      stageTop: Math.round(s.top * 100) / 100,
      chipBottom: c ? Math.round((c.bottom - s.top) * 100) / 100 : null,
      chipLines: lines,
      chipText: corner?.textContent ?? null,
      slotTops: tops,
      placed,
      inkTop: Number.isFinite(inkTop) ? Math.round(inkTop * 100) / 100 : null,
      inkBottom: Number.isFinite(inkBottom) ? Math.round(inkBottom * 100) / 100 : null,
      under,
    };
  });
}

// The window-rule spec's two "tablet" shapes: the shorter side is under `TABLET_MIN_PX` (900), so the app
// draws them as phones (no `data-tablet`): the header folds and the chip is drawn there too.
const NOT_TABLETS = [
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
];

const CELLS: { vp: { name: string; width: number; height: number }; piece: (typeof PIECES)[number]; bars: number; text: 100 | 115 }[] = [];
if (process.env.U118_SET === 'not-tablets') {
  for (const vp of NOT_TABLETS) for (const piece of PIECES) for (const bars of BARS) CELLS.push({ vp, piece, bars, text: 100 });
} else {
  for (const vp of VIEWPORTS) for (const piece of PIECES) for (const bars of BARS) CELLS.push({ vp, piece, bars, text: 100 });
  for (const piece of PIECES) for (const bars of BARS) CELLS.push({ vp: VIEWPORTS[0]!, piece, bars, text: 115 });
}

for (const cell of CELLS) {
  for (const arm of (process.env.U118_ARMS ?? 'as-is,reserved').split(',')) {
    const reserved = arm === 'reserved';
    const placed = arm === 'placed';
    const name = `${cell.vp.name}-${cell.piece.short}-${String(cell.bars)}bars-text${String(cell.text)}-${arm}`;
    test(name, async ({ page }) => {
      test.setTimeout(150_000);
      await page.setViewportSize({ width: cell.vp.width, height: cell.vp.height });
      if (cell.text === 115) {
        await page.addInitScript(() => {
          document.addEventListener('DOMContentLoaded', () => {
            document.documentElement.style.fontSize = '115%';
          });
        });
      }
      await page.goto(`/#/score/${cell.piece.id}`);
      await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 90_000 });
      await page.waitForFunction(() => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      }, undefined, { timeout: 90_000 });
      await settle(page);
      await setBars(page, cell.bars);
      await page.locator('#score-mode').selectOption('wait');
      await settle(page);
      const reserve = await page.evaluate(() => {
        const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        return 4 + 2 * 1 + 2 * 1.2 * 0.8 * root;
      });
      if (reserved) {
        await page.addStyleTag({
          content: `.screen--score[data-running='true']:not([data-tablet='true']) .score-stage { margin-top: ${String(reserve)}px !important; }`,
        });
      }
      if (placed) {
        // Placement only, no pricing change: the drawn slots moved down by the reserve once folded, on a
        // phone, in the stacked arrangement (`margin-top` adds to an absolutely placed box's inline `top`).
        await page.addStyleTag({
          content: `.screen--score[data-chrome='folded']:not([data-tablet='true']) .score-stage[data-read-ahead='slots'] .score-buffer { margin-top: ${String(reserve)}px !important; }`,
        });
      }
      if (arm === 'turned-off') {
        await page.addStyleTag({ content: '#score-corner { display: none !important; }' });
      }
      const rest = await shape(page);
      await pressControl(page, '#score-play');
      await page.waitForFunction(() => {
        const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
        return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
      }, undefined, { timeout: 30_000 });
      await settle(page);
      const run = await shape(page);
      await pressControl(page, '#score-play');
      await expect(page.locator('#score-play')).toHaveText('▶');
      await page.waitForFunction(
        () => document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.chrome === 'folded',
        undefined,
        { timeout: 10_000 },
      );
      await page.waitForTimeout(400);
      const fold = await folded(page);
      const after = await shape(page);
      // The second path (U118 rule 3): a size taken while the chip is already drawn. Turned and turned
      // back with the chrome folded, the run's size is released and taken again on the folded stage.
      // `turned-off` hides the chip for the whole run, so the band is 0 there: the same turn as the code
      // before U118 priced it, for the trade the band costs.
      let turnedRun: Record<string, unknown> | null = null;
      let turnedFold: Record<string, unknown> | null = null;
      if (arm === 'turned' || arm === 'turned-off') {
        await page.setViewportSize({ width: cell.vp.height, height: cell.vp.width });
        await page.waitForTimeout(1_500);
        await page.setViewportSize({ width: cell.vp.width, height: cell.vp.height });
        await page.waitForTimeout(300);
        await page.waitForFunction(() => {
          const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
          return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
        }, undefined, { timeout: 30_000 });
        await settle(page);
        await page.waitForTimeout(400);
        turnedRun = await shape(page);
        turnedFold = await folded(page);
      }
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(
        path.join(OUT, `${name}.json`),
        JSON.stringify({ cell: name, arm, viewport: cell.vp.name, piece: cell.piece.short, bars: cell.bars, text: cell.text, reserved, reserve, rest, run, fold, after, turnedRun, turnedFold }, null, 1),
      );
    });
  }
}
