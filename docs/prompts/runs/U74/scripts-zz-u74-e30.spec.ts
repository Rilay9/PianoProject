// U74's E30 probe (temporary): the four-bar cuts on a desktop-wide stage, measured and photographed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const CUTS = [
  'excerpt.classical.beethoven-ode-to-joy.easy.b9-12',
  'excerpt.blues.wabash-blues.b1-4',
  'excerpt.classical.i-got-rythm.pdmx.b15-18',
  'excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28',
];
const SIZES = [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 342, height: 740 },
  { width: 740, height: 342 },
];

async function settled(page: Page): Promise<void> {
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
  await page.waitForTimeout(800);
  await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
}

async function glass(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('#score-stage')!;
    const s = stage.getBoundingClientRect();
    const rows: unknown[] = [];
    let staff = Infinity;
    let inkRight = -Infinity;
    let inkBottom = -Infinity;
    let inkLeft = Infinity;
    let inkTop = Infinity;
    for (const b of stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)')) {
      if (b.hidden) continue;
      let l = Infinity, r = -Infinity, t = Infinity, bo = -Infinity;
      for (const n of b.querySelectorAll('svg path, svg text, svg rect')) {
        const x = n.getBoundingClientRect();
        if (x.width <= 0 && x.height <= 0) continue;
        if (x.right < s.left || x.left > s.right) continue;
        l = Math.min(l, x.left); r = Math.max(r, Math.min(x.right, s.right)); t = Math.min(t, x.top); bo = Math.max(bo, x.bottom);
      }
      const bars = [...new Set([...b.querySelectorAll<HTMLElement>('.score-note')].map((n) => Number(n.dataset.bar)))].sort((a, c) => a - c);
      rows.push({ bars: b.dataset.bars, inked: bars, ahead: b.classList.contains('is-ahead'), left: Math.round(l - s.left), right: Math.round(r - s.left), top: Math.round(t - s.top), bottom: Math.round(bo - s.top), stretch: b.dataset.stretch });
      inkRight = Math.max(inkRight, r); inkBottom = Math.max(inkBottom, bo); inkLeft = Math.min(inkLeft, l); inkTop = Math.min(inkTop, t);
      for (const m of b.querySelectorAll('.vf-measure')) {
        const ys: number[] = [];
        for (const line of m.querySelectorAll(':scope > path')) {
          const x = line.getBoundingClientRect();
          if (x.height <= 1.5 && x.width >= 10) ys.push(x.top + x.height / 2);
        }
        if (ys.length >= 5) staff = Math.min(staff, Math.max(...ys) - Math.min(...ys));
      }
    }
    const fit = (window as unknown as { __pianopath?: { scoreFit?: () => Record<string, unknown> } }).__pianopath?.scoreFit?.();
    return {
      stage: { w: Math.round(s.width), h: Math.round(s.height) },
      fitBy: stage.dataset.fit, ahead: stage.dataset.ahead, why: stage.dataset.windowWhy ?? null,
      shown: fit?.barsShown, asked: fit?.barsAsked, slots: fit?.slotCount, systems: fit?.systemsPerWindow, zoom: fit?.zoom,
      bars: fit?.sourceMeasureCount, priced: fit?.priced,
      staff: Math.round(staff * 10) / 10,
      ink: { w: Math.round(inkRight - inkLeft), h: Math.round(inkBottom - inkTop), wShare: Math.round(((inkRight - inkLeft) / s.width) * 100), hShare: Math.round(((inkBottom - inkTop) / s.height) * 100) },
      rows,
    };
  });
}

for (const size of SIZES) {
  test(`E30 cuts at ${String(size.width)}x${String(size.height)}`, async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize(size);
    const out: Record<string, unknown> = {};
    for (const id of CUTS) {
      await page.goto(`/#/score/${id}`);
      await settled(page);
      out[id] = await glass(page);
      mkdirSync('../docs/prompts/runs/U74/e30', { recursive: true });
      await page.screenshot({ path: `../docs/prompts/runs/U74/e30/${id.split('.')[2] ?? id}-${String(size.width)}x${String(size.height)}.png` });
    }
    writeFileSync(`../docs/prompts/runs/U74/e30/glass-${String(size.width)}x${String(size.height)}.json`, JSON.stringify(out, null, 1));
  });
}
