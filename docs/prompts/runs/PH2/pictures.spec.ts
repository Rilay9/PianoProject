// PH2's pictures: every device cell of `docs/04-ui-spec.md` §0 R7, each state the lane changes. Not a test of
// the suite. How it was run: this file at app/build/ph2/pictures/pictures.spec.ts and `playwright.ph2.config.ts`
// (beside it here) at app/build/ph2/, `npm run build:app`, then from app/:
//   PH2_TESTDIR=./pictures npx playwright test --config build/ph2/playwright.ph2.config.ts
// Writes build/ph2/pictures-out/<device>/<state>.png (kept here under pictures/) and census-<device>.json (kept
// under census/; `legibility.mjs` summarises them into legibility.txt).
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { installMidiMock } from '../../../tests/e2e/fixtures/midiMock';

const OUT = path.join(process.cwd(), '..', 'build', 'ph2', 'pictures-out');

const DEVICES: [string, number, number][] = [
  ['phone-upright-342x740', 342, 740],
  ['phone-upright-360x780', 360, 780],
  ['phone-sideways-568x320', 568, 320],
  ['phone-sideways-780x360', 780, 360],
  ['tablet-1024x768', 1024, 768],
  ['tablet-768x1024', 768, 1024],
  ['tablet-1366x1024', 1366, 1024],
  ['tablet-1024x1366', 1024, 1366],
];

const BLUE_BOSSA = 'song.jazz.kenny-dorham-blue-bossa.pdmx';

async function open(page: Page, id: string): Promise<void> {
  await page.goto('about:blank');
  await page.goto(`/#/chart/${id}`);
  await page.waitForFunction(() => !!document.querySelector('#chart-grid .chart-cell[data-bar="1"]') || !!document.querySelector('section[data-screen="chart"][data-refused]'), null, { timeout: 20_000 });
  await page.waitForTimeout(400);
}

/** The bar's row with a row either side, full width of the grid; the whole screen where the chart refused. */
async function shoot(page: Page, device: string, name: string, bar: number): Promise<void> {
  mkdirSync(path.join(OUT, device), { recursive: true });
  if (await page.locator('section[data-screen="chart"][data-refused]').count()) {
    await page.screenshot({ path: path.join(OUT, device, `${name}-refused.png`) });
    return;
  }
  const cell = page.locator(`#chart-grid .chart-cell[data-bar="${String(bar)}"]`);
  await cell.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const clip = await page.evaluate((n) => {
    const grid = document.querySelector('#chart-grid') as HTMLElement;
    const target = grid.querySelector(`.chart-cell[data-bar="${String(n)}"]`) as HTMLElement;
    const cells = [...grid.querySelectorAll<HTMLElement>('.chart-cell')];
    const tops = [...new Set(cells.map((c) => Math.round(c.getBoundingClientRect().top)))].sort((a, b) => a - b);
    const row = tops.indexOf(Math.round(target.getBoundingClientRect().top));
    const first = tops[Math.max(0, row - 1)] ?? 0;
    const lastTop = tops[Math.min(tops.length - 1, row + 1)] ?? 0;
    const bottom = Math.max(...cells.filter((c) => Math.round(c.getBoundingClientRect().top) === lastTop).map((c) => c.getBoundingClientRect().bottom));
    const g = grid.getBoundingClientRect();
    return { x: Math.max(0, g.left - 6), y: Math.max(0, first - 6), width: Math.min(window.innerWidth, g.width + 12), height: bottom - first + 12 };
  }, bar);
  await page.screenshot({ path: path.join(OUT, device, `${name}.png`), clip });
}

/**
 * The legibility census: every bundled chart with a split or conflicted bar, opened at every device width, and
 * each such bar's look read back (boxes at what size, or symbols on stems over the rule on how many lines), with
 * each bar's start positions checked in the rendered geometry; and every chart that refused, with its reason.
 */
const SPLIT_CHARTS = JSON.parse(readFileSync(path.join(process.cwd(), '..', 'build', 'ph2', 'split-charts.json'), 'utf8')) as string[];
for (const [device, width, height] of DEVICES) {
  test(`census ${device}`, async ({ page }) => {
    test.setTimeout(900_000);
    await page.setViewportSize({ width, height });
    const rows: { id: string; bar: number; layout: string; size: string; rows: number; segments: number; texts: string; faults: string[]; slanted: number }[] = [];
    const refused: { id: string; reason: string }[] = [];
    for (const id of SPLIT_CHARTS) {
      await page.goto('about:blank');
      await page.goto(`/#/chart/${id}`);
      // Loaded: the grid drawn, or the chart refused.
      await page.waitForFunction(() => !!document.querySelector('#chart-grid .chart-cell[data-bar="1"]') || !!document.querySelector('section[data-screen="chart"][data-refused]'), null, { timeout: 20_000 });
      await page.waitForTimeout(400);
      const state = await page.evaluate(() => ({
        refused: document.querySelector('section[data-screen="chart"]')?.getAttribute('data-refused') ?? null,
        status: document.querySelector('#chart-status')?.textContent ?? '',
      }));
      if (state.refused) {
        refused.push({ id, reason: state.status });
        continue;
      }
      rows.push(
        ...(await page.evaluate((itemId) =>
          [...document.querySelectorAll<HTMLElement>('#chart-grid .chart-cell[data-split="true"]')].map((cell) => {
            // Is each chord's start readable? Boxes: each symbol in its own box. Placed: a stem per segment at its
            // box's left edge, no two symbols overlapping, no stem crossing another's symbol.
            const faults: string[] = [];
            const slanted: number[] = [];
            const segs = [...cell.querySelectorAll<HTMLElement>('.chart-seg')];
            if (cell.dataset.layout === 'fit') {
              segs.forEach((seg, i) => {
                if (!seg.querySelector('.chart-seg-label')) faults.push(`segment ${String(i)} has no symbol in its box`);
              });
            } else if (cell.dataset.layout === 'placed') {
              const svg = cell.querySelector('.chart-leaders')?.getBoundingClientRect();
              const leaders = [...cell.querySelectorAll<SVGLineElement>('.chart-stem')]
                .sort((a, b) => Number(a.dataset.seg) - Number(b.dataset.seg))
                .map((l) => {
                  const n = (name: string): number => Number(l.getAttribute(name));
                  return { x1: (svg?.left ?? 0) + n('x1'), y1: (svg?.top ?? 0) + n('y1'), x2: (svg?.left ?? 0) + n('x2'), y2: (svg?.top ?? 0) + n('y2') };
                });
              const labels = [...cell.querySelectorAll<HTMLElement>('.chart-seq .chart-seg-label')].sort((a, b) => Number(a.dataset.seg) - Number(b.dataset.seg));
              if (leaders.length !== segs.length) faults.push(`${String(leaders.length)} leaders for ${String(segs.length)} segments`);
              const rule = cell.querySelector('.chart-segs')?.getBoundingClientRect();
              segs.forEach((seg, i) => {
                const l = leaders[i];
                if (!l) return;
                if (Math.abs(l.x2 - seg.getBoundingClientRect().left) > 1) faults.push(`leader ${String(i)} off its start`);
                if (rule && Math.abs(l.y2 - rule.top) > 2) faults.push(`leader ${String(i)} short of the rule`);
                const own = labels[i]?.getBoundingClientRect();
                if (own && (l.x1 < own.left - 1 || l.x1 > own.right + 1 || Math.abs(l.y1 - own.bottom) > 2)) faults.push(`leader ${String(i)} not from its symbol`);
              });
              labels.forEach((a, i) => {
                const ra = a.getBoundingClientRect();
                const next = labels[i + 1]?.getBoundingClientRect();
                if (next && next.left < ra.left + 2) faults.push(`symbol ${String(i + 1)} starts left of symbol ${String(i)}`);
                labels.forEach((b, j) => {
                  const rb = b.getBoundingClientRect();
                  if (j > i && ra.left < rb.right - 0.5 && rb.left < ra.right - 0.5 && ra.top < rb.bottom - 0.5 && rb.top < ra.bottom - 0.5) faults.push(`symbols ${String(i)} and ${String(j)} overlap`);
                });
                leaders.forEach((l, j) => {
                  if (j === i) return;
                  for (let t = 0; t <= 1; t += 0.02) {
                    const x = l.x1 + (l.x2 - l.x1) * t;
                    const y = l.y1 + (l.y2 - l.y1) * t;
                    if (x > ra.left + 1 && x < ra.right - 1 && y > ra.top + 1 && y < ra.bottom - 1) {
                      faults.push(`leader ${String(j)} crosses symbol ${String(i)}`);
                      return;
                    }
                  }
                });
              });
              leaders.forEach((p, i) =>
                leaders.forEach((q, j) => {
                  if (j <= i) return;
                  const side = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
                  if (side(p.x1, p.y1, p.x2, p.y2, q.x1, q.y1) * side(p.x1, p.y1, p.x2, p.y2, q.x2, q.y2) < 0 && side(q.x1, q.y1, q.x2, q.y2, p.x1, p.y1) * side(q.x1, q.y1, q.x2, q.y2, p.x2, p.y2) < 0) faults.push(`leaders ${String(i)} and ${String(j)} cross`);
                }),
              );
              // How many leaders run at a slant (the symbol stands to one side of its start).
              leaders.forEach((l, i) => {
                if (Math.abs(l.x1 - l.x2) > 0.5) slanted.push(i);
              });
            } else faults.push(`layout ${cell.dataset.layout ?? 'none'}`);
            return {
              id: itemId,
              bar: Number(cell.dataset.bar),
              layout: cell.dataset.layout ?? '',
              size: cell.style.getPropertyValue('--chart-seg-size') || 'full',
              rows: new Set([...cell.querySelectorAll<HTMLElement>('.chart-seq .chart-seg-label')].map((l) => l.style.top)).size,
              segments: segs.length,
              texts: [...cell.querySelectorAll('.chart-seg-label')].map((l) => l.textContent).join(' '),
              faults,
              slanted: slanted.length,
            };
          }),
        id)),
      );
    }
    mkdirSync(OUT, { recursive: true });
    writeFileSync(path.join(OUT, `census-${device}.json`), JSON.stringify({ rows, refused }));
  });
}

for (const [device, width, height] of DEVICES) {
  test.describe(device, () => {
    test.use({ viewport: { width, height } });

    test('still: split bars, dense bars, conflicts, carried segments', async ({ page }) => {
      await open(page, BLUE_BOSSA);
      await shoot(page, device, 'blue-bossa-bar16-idle', 16);
      await open(page, 'song.folk.insensatez-how-insensitive-jobim.pdmx');
      await shoot(page, device, 'insensatez-bar22-idle', 22);
      await open(page, 'song.classical.czerny-the-school-of-velocity-op-299-no-10.pdmx');
      await shoot(page, device, 'czerny10-bars17-20-six-in-a-bar-and-conflicts', 19);
      await shoot(page, device, 'czerny10-bar3-a-32nd-note-chord', 3);
      await open(page, 'song.pop.frank-sinatra-let-it-snow-leadsheet.pdmx');
      await shoot(page, device, 'let-it-snow-bar8-four-in-a-bar', 8);
      await open(page, 'song.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx');
      await shoot(page, device, 'hark-bar6-four-long-symbols', 6);
      await open(page, 'song.pop.margie.pdmx');
      await shoot(page, device, 'margie-bar7-conflict', 7);
      await shoot(page, device, 'margie-bar43-carried-then-three', 43);
      await open(page, 'song.blues.storyville-blues');
      await shoot(page, device, 'storyville-bar4-four-way-conflict', 4);
      await open(page, 'song.classical.czerny-the-school-of-velocity-op-299-no-8.pdmx');
      await shoot(page, device, 'czerny8-bar1-three-to-one', 1);
      await open(page, 'song.blues.jazz-me-blues');
      await shoot(page, device, 'jazz-me-blues-bar28-carried-eighth', 28);
      await open(page, 'song.pop.benny-goodman-louis-prima-rose-room.pdmx');
      await shoot(page, device, 'rose-room-bar16-four-in-a-bar', 16);
      await open(page, 'song.jazz.george-shearing-lullaby-of-birdland.pdmx');
      await shoot(page, device, 'lullaby-of-birdland-bar4', 4);
    });

    test('playing: Blue Bossa bar 16, the first then the second segment sounding, then a yes in the second', async ({ page }) => {
      test.setTimeout(120_000);
      const midi = await installMidiMock(page, { permission: 'granted' });
      await open(page, BLUE_BOSSA);
      const bpm = page.locator('#chart-bpm');
      await bpm.fill('240');
      await bpm.dispatchEvent('change');
      await page.locator('#chart-start').click();
      await expect(page.locator('#chart-form')).toContainText('Bar 15 of 32', { timeout: 60_000 });
      await bpm.fill('40');
      await bpm.dispatchEvent('change');
      const first = page.locator('#chart-grid .chart-cell[data-bar="16"] .chart-seg[data-seg="0"]');
      const second = page.locator('#chart-grid .chart-cell[data-bar="16"] .chart-seg[data-seg="1"]');
      await expect(first).toHaveAttribute('data-sounding', 'true', { timeout: 30_000 });
      await shoot(page, device, 'blue-bossa-bar16-playing-first-segment', 16);
      await expect(second).toHaveAttribute('data-sounding', 'true', { timeout: 30_000 });
      await shoot(page, device, 'blue-bossa-bar16-playing-second-segment', 16);
      // G-B-F, the G7 shell, held in the second segment.
      for (const note of [55, 59, 65]) await midi.noteOn(note, 80);
      await expect(second).toHaveAttribute('data-match', 'yes');
      await shoot(page, device, 'blue-bossa-bar16-yes-in-second-segment', 16);
      for (const note of [55, 59, 65]) await midi.noteOff(note);
      await page.locator('#chart-stop').click();
    });
  });
}
