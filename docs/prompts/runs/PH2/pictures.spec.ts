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
  await expect(page.locator('.chart-cell[data-bar="1"]')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(300);
}

/** The bar's row with a row either side, full width of the grid. */
async function shoot(page: Page, device: string, name: string, bar: number): Promise<void> {
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
  mkdirSync(path.join(OUT, device), { recursive: true });
  await page.screenshot({ path: path.join(OUT, device, `${name}.png`), clip });
}

/**
 * The legibility census: every bundled chart with a split or conflicted bar, opened at a device's width, and
 * each such bar's look read back: proportional boxes at what size, wrapped, or the line-and-rule fallback.
 */
const SPLIT_CHARTS = JSON.parse(readFileSync(path.join(process.cwd(), '..', 'build', 'ph2', 'split-charts.json'), 'utf8')) as string[];
for (const [device, width, height] of DEVICES.filter(([name]) => ['phone-upright-342x740', 'phone-sideways-568x320', 'phone-sideways-780x360', 'tablet-1024x768'].includes(name))) {
  test(`census ${device}`, async ({ page }) => {
    test.setTimeout(900_000);
    await page.setViewportSize({ width, height });
    const rows: { id: string; bar: number; layout: string; size: string; wrap: boolean; rows: number; lines: number; segments: number; texts: string }[] = [];
    for (const id of SPLIT_CHARTS) {
      await open(page, id);
      await page.waitForTimeout(100);
      rows.push(
        ...(await page.evaluate((itemId) =>
          [...document.querySelectorAll<HTMLElement>('#chart-grid .chart-cell[data-split="true"]')].map((cell) => ({
            id: itemId,
            bar: Number(cell.dataset.bar),
            layout: cell.dataset.layout ?? '',
            size: cell.style.getPropertyValue('--chart-seg-size') || 'full',
            wrap: cell.dataset.wrap === 'true',
            rows: new Set([...cell.querySelectorAll<HTMLElement>('.chart-seq .chart-seg-label')].map((l) => l.style.top)).size,
            lines: new Set([...cell.querySelectorAll<HTMLElement>('.chart-seq .chart-seg-label')].map((l) => l.offsetTop)).size,
            segments: cell.querySelectorAll('.chart-seg').length,
            texts: [...cell.querySelectorAll('.chart-seg-label')].map((l) => l.textContent).join(' '),
          })),
        id)),
      );
    }
    mkdirSync(OUT, { recursive: true });
    writeFileSync(path.join(OUT, `census-${device}.json`), JSON.stringify(rows));
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
