import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The E-tail sweep's product look (not committed as a spec: moved beside the entry after the run). The Score
// screen at 342 × 740 for I Got Rhythm's cut and parent (E31's chord line) and the re-cut Hark! opening
// (E33); the excerpt view's top at 1280 × 800 (E35). Each picture with the text the stage drew beside it.

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'prompts', 'pictures', 'e-tail');
mkdirSync(OUT, { recursive: true });

const SCORES: [name: string, id: string][] = [
  ['i-got-rhythm-cut', 'excerpt.classical.i-got-rythm.pdmx.b15-18'],
  ['i-got-rhythm-parent', 'song.classical.i-got-rythm.pdmx'],
  ['hark-cut', 'excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28'],
  ['minuet-cut', 'excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32'],
];

test.describe('E-tail pictures', () => {
  for (const [name, id] of SCORES) {
    test(`the Score screen at 342 × 740: ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 342, height: 740 });
      await page.goto(`/#/score/${id}`);
      await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
      await page.waitForSelector('.score-view[data-settled]', { timeout: 60_000 });
      // The mode's start sheet covers the lower half: closed, as a learner reading the page would.
      const close = page.getByRole('button', { name: 'Close', exact: true });
      if (await close.isVisible().catch(() => false)) await close.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(OUT, `${name}-342x740.png`) });
      const texts = await page.evaluate(() => [...document.querySelectorAll('.score-view svg text')].map((node) => node.textContent ?? '').filter((one) => one.trim().length > 0));
      const privateUse = texts.filter((one) => /[\uE000-\uF8FF]/.test(one));
      writeFileSync(join(OUT, `${name}-342x740.json`), JSON.stringify({ id, texts, privateUse }, null, 2) + '\n');
    });
  }

  test('the excerpt view’s top at 1280 × 800', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/dev/review/excerpts.json', (route) => route.fulfill({ path: join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'excerpt-candidates.json'), contentType: 'application/json' }));
    test.setTimeout(120_000);
    await page.goto('/#/dev/microscope/excerpts');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(OUT, 'excerpt-view-first-seconds-1280x800.png') });
    await expect(page.locator('[data-screen="dev-excerpts"][data-ready="true"]')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('#excerpts-desktop')).toBeVisible();
    await page.screenshot({ path: join(OUT, 'excerpt-view-top-1280x800.png') });
  });
});
