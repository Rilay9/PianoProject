// U118b exploration, not for the commit: at each geometry and piece, folded and paused, the band the
// screen holds (`foldedReserve`) against the away sentence laid in an unseen copy of the chip the way
// `foldedCornerReserve` lays every candidate: at 86 400 s, at Number.MAX_SAFE_INTEGER, and at sixteen of
// each digit. Writes build/u118b/explore-out/<cell>.json.
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pressControl, withScoreMenu } from '../../../tests/e2e/scoreControls';
// The sentence as `STATE_TEXT.away` (help.ts) writes it, not performing; help.ts cannot be imported here.
const AWAY = (n: number | string): string => `Paused — you were away ${String(n)} s. ▶ to carry on, or Start again in ⋯ to go back to the beginning.`;

const OUT = path.resolve(process.cwd(), `build/u118b/explore-${process.env.U118B_TAG ?? 'out'}`);

const GEOMETRIES = [
  { name: '342x740', width: 342, height: 740, text: 100 },
  { name: '360x780', width: 360, height: 780, text: 100 },
  { name: '360x844', width: 360, height: 844, text: 100 },
  { name: '390x844', width: 390, height: 844, text: 100 },
  { name: '342x740', width: 342, height: 740, text: 115 },
  { name: '768x1024', width: 768, height: 1024, text: 100 },
  { name: '1024x768', width: 1024, height: 768, text: 100 },
];
const PIECES = [
  { id: 'song.folk.hot-cross-buns', short: 'hcb' },
  { id: 'exercise.five-finger.c-major.right', short: 'five-finger' },
  { id: 'song.folk.twinkle.ht', short: 'twinkle' },
  { id: 'song.classical.chopin-nocturne-op48-1.nifc', short: 'nocturne-48' },
];

async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(200);
  await page.waitForSelector('.score-view[data-settled]', { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

for (const g of GEOMETRIES) {
  for (const piece of PIECES) {
    const name = `${g.name}-text${String(g.text)}-${piece.short}`;
    test(name, async ({ page }) => {
      test.setTimeout(150_000);
      await page.setViewportSize({ width: g.width, height: g.height });
      if (g.text === 115) {
        await page.addInitScript(() => {
          document.addEventListener('DOMContentLoaded', () => {
            document.documentElement.style.fontSize = '115%';
          });
        });
      }
      await page.goto(`/#/score/${piece.id}`);
      await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 90_000 });
      await page.waitForFunction(() => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      }, undefined, { timeout: 90_000 });
      await settle(page);
      await withScoreMenu(page, async () => {
        const down = page.locator('#score-bars-down');
        for (let i = 0; i < 8 && (await down.isEnabled()); i += 1) await down.click();
      });
      await page.locator('#score-mode').selectOption('wait');
      await settle(page);
      await pressControl(page, '#score-play');
      await page.waitForFunction(() => {
        const w = window as unknown as { __pianopath?: { scoreFit?: () => { frozen: unknown } } };
        return (w.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
      }, undefined, { timeout: 30_000 });
      await pressControl(page, '#score-play');
      await expect(page.locator('#score-play')).toHaveText('▶');
      await page.waitForFunction(
        () => document.querySelector<HTMLElement>('section[data-screen="score"]')?.dataset.chrome === 'folded',
        undefined,
        { timeout: 10_000 },
      );
      await page.waitForTimeout(400);
      const away = {
        old: AWAY(86_400),
        max: AWAY(Number.MAX_SAFE_INTEGER),
        digits: Array.from({ length: 10 }, (_, d) => AWAY(String(d).repeat(16))),
        template: AWAY('{N}'),
      };
      const read = await page.evaluate((away) => {
        const stage = document.querySelector<HTMLElement>('#score-stage')!;
        const corner = document.querySelector<HTMLElement>('#score-corner')!;
        const shown = getComputedStyle(corner).display !== 'none';
        const fit = (window as unknown as { __pianopath?: { scoreFit?: () => { foldedReserve?: number } } }).__pianopath?.scoreFit?.();
        const m = /\/\s*(\S+)/.exec(corner.textContent ?? '');
        const last = m ? m[1] : '?';
        const at = `bar ${last} / ${last}`;
        const copy = corner.cloneNode(false) as HTMLElement;
        copy.removeAttribute('id');
        copy.style.visibility = 'hidden';
        stage.appendChild(copy);
        const top = stage.getBoundingClientRect().top + stage.clientTop;
        const lay = (text: string): { bottom: number; lines: number } => {
          copy.textContent = text;
          const range = document.createRange();
          range.selectNodeContents(copy);
          const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
          return { bottom: Math.round((copy.getBoundingClientRect().bottom - top) * 100) / 100, lines };
        };
        const run = document.createElement('span');
        run.style.whiteSpace = 'nowrap';
        copy.textContent = '';
        copy.appendChild(run);
        const widths = Array.from({ length: 10 }, (_, d) => {
          run.textContent = String(d).repeat(16);
          return Math.round(run.getBoundingClientRect().width * 100) / 100;
        });
        run.textContent = '9007199254740991';
        const maxWidth = Math.round(run.getBoundingClientRect().width * 100) / 100;
        const result = {
          shown,
          font: `${getComputedStyle(corner).fontSize} ${getComputedStyle(corner).fontFamily}`,
          band: fit?.foldedReserve ?? null,
          at,
          chip: lay(`${at} · ${corner.textContent?.split(' · ').slice(1).join(' · ') ?? ''}`),
          old: lay(`${at} · ${away.old}`),
          max: lay(`${at} · ${away.max}`),
          digits: away.digits.map((t) => lay(`${at} · ${t}`)),
          // The away sentence's lines with a count of k of the widest digit, k = 1 … 16.
          byDigits: Array.from({ length: 16 }, (_, k) => {
            const widest = String(widths.indexOf(Math.max(...widths)));
            return lay(`${at} · ${away.template.replace('{N}', widest.repeat(k + 1))}`).lines;
          }),
          widths,
          maxWidth,
        };
        copy.remove();
        return result;
      }, away);
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ cell: name, ...read }, null, 1));
    });
  }
}
