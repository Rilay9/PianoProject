/**
 * G1b's before picture, run once as `app/tests/e2e/zz-g1b-before.spec.ts` on port 4403 against HEAD's
 * app (dist-head, `scripts-head_app.py`) and removed: a Stage 9 unit's page at 342 × 740 as HEAD draws
 * it — its state badge, *What the app counts* and the song rows' badges — and the finish sheet's
 * actions. Writes to `G1B_PICTURES`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const OUT = process.env.G1B_PICTURES ?? 'g1b-pictures';

test('before: a Stage 9 unit’s page on HEAD', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.setViewportSize({ width: 342, height: 740 });
  await page.goto('./#/lesson/classical.9');
  await expect(page.locator('#lesson-counts summary')).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: join(OUT, 'before-stage9-top-342x740.png') });
  await page.locator('#lesson-songs').evaluate((node) => {
    node.closest('section')?.scrollIntoView({ block: 'start' });
  });
  await page.screenshot({ path: join(OUT, 'before-stage9-songs-342x740.png') });
  const facts = {
    state: await page.locator('#lesson-state').innerText(),
    counts: await page.locator('#lesson-counts summary').innerText(),
    actions: await page.locator('#lesson-actions').innerText(),
    songs: await page.locator('#lesson-songs .list-row').evaluateAll((rows) => rows.map((row) => ({ title: row.querySelector('.list-row__title')?.textContent, badges: [...row.querySelectorAll('.badge')].map((b) => b.textContent) }))),
  };
  writeFileSync(join(OUT, 'before-facts.json'), `${JSON.stringify(facts, null, 1)}\n`);
});
