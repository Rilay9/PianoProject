/**
 * X1's probe of modes-duet's failing case (kept as scripts-zz-duet-probe.spec.ts, copied into tests/e2e for one run and
 * removed): modes-duet's own steps for technique.7, printing what it read.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

test('technique.7, modes-duet’s steps, printed', async ({ page }) => {
  await page.setViewportSize({ width: 342, height: 740 });
  await page.goto('/#/lesson/technique.7');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const offered = await page.locator('#lesson-songs .list-row[data-item], #lesson-exercises .list-row[data-item]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-item') ?? ''));
  console.log(`X1-PROBE offered: ${JSON.stringify(offered)}`);
  await page.waitForTimeout(2000);
  console.log(`X1-PROBE offered after 2 s: ${JSON.stringify(await page.locator('#lesson-songs .list-row[data-item], #lesson-exercises .list-row[data-item]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-item') ?? '')))}`);
  console.log(`X1-PROBE page text: ${(await page.locator('section[data-screen="lesson"]').innerText()).slice(0, 600).split(String.fromCharCode(10)).join(' | ')}`);
  await page.locator('#lesson-tool-duet').click();
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  const hash = new URL(page.url()).hash;
  console.log(`X1-PROBE hash: ${hash}`);
  console.log(`X1-PROBE match: ${String(offered.some((id) => id !== '' && hash.includes(encodeURIComponent(id))))}`);
});
