/**
 * G1b's pictures, run as `app/tests/e2e/zz-g1b-pictures.spec.ts` on port 4403 and removed: what a
 * learner meets at the finish sheet, on the project sheet (a piece learned, put away and brought
 * back), on Progress and on a Stage 9 unit's page, at 342 × 740 and 768 × 1024. Writes the pictures
 * and the screens' words and the stored project rows (`facts.json`) to `G1B_PICTURES`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

import { playInTime } from './fixtures/playInTime';
import { setTempoPercent, withScoreMenu } from './scoreControls';

const OUT = process.env.G1B_PICTURES ?? 'g1b-pictures';
const ITEM = 'song.folk.hot-cross-buns';
const facts: Record<string, unknown> = {};

type Hooked = Window & { __pianopath?: { recordRun: (run: unknown, now?: Date) => Promise<unknown> } };

test.beforeEach(async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
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

async function words(page: Page, ids: string[]): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  for (const id of ids) out[id] = (await page.locator(`#${id}`).count()) > 0 ? await page.locator(`#${id}`).first().innerText() : null;
  return out;
}

async function projects(page: Page): Promise<unknown[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const rows = await new Promise<unknown[]>((resolve) => {
      const request = db.transaction('projects', 'readonly').objectStore('projects').getAll();
      request.onsuccess = () => resolve(request.result as unknown[]);
    });
    db.close();
    return rows;
  });
}

/** The sheet's panel scrolled so its bottom shows, for the second picture of a tall sheet. */
async function scrollSheet(page: Page, to: 'top' | 'bottom'): Promise<void> {
  await page.locator('#project-sheet .sheet__panel').evaluate((panel, where) => {
    panel.scrollTop = where === 'top' ? 0 : panel.scrollHeight;
  }, to);
}

test('the finish sheet, the project sheet through a piece’s life, Progress and a Stage 9 page', async ({ page }) => {
  test.setTimeout(300_000);
  for (const [width, height] of [
    [342, 740],
    [768, 1024],
  ] as const) {
    const size = `${String(width)}x${String(height)}`;
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      sessionStorage.removeItem('e2e-fresh');
    }).catch(() => undefined);
    await page.goto('./#/progress');
    await page.reload();

    // A run of Hot Cross Buns played in time through the screen keys.
    await page.goto(`./#/score/${ITEM}`);
    await page.waitForFunction(() => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    }, undefined, { timeout: 60_000 });
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-hands-R').click();
    await setTempoPercent(page, 100);
    await page.locator('#score-play').click();
    await playInTime(page, 'keys');
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
    await page.locator('#summary-project').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(OUT, `finish-sheet-${size}.png`) });
    facts[`finish-sheet-${size}`] = { door: await page.locator('#summary-project').innerText(), actions: await page.locator('#score-summary .summary-actions').innerText() };

    await page.locator('#summary-project').click();
    await expect(page.locator('#project-met')).not.toHaveText(/Looking/);
    await page.screenshot({ path: join(OUT, `sheet-no-project-${size}.png`) });
    facts[`sheet-no-project-${size}`] = await words(page, ['project-state', 'project-history', 'project-met', 'project-actions']);

    await page.locator('#project-action-learn').click();
    await expect(page.locator('#project-state')).toHaveText(/^Learning since /);
    await page.locator('#project-goal').fill('Hands together, all four bars');
    await page.locator('#project-goal').blur();
    await page.locator('#project-problem').fill('Bar 3: the three Cs in time');
    await page.locator('#project-problem').blur();
    await page.locator('#project-section-from').fill('3');
    await page.locator('#project-section-to').fill('4');
    await page.locator('#project-section-label').fill('The repeated notes');
    await page.locator('#project-section-add').click();
    await expect(page.locator('#project-sections [data-section]')).toHaveCount(1);
    await scrollSheet(page, 'top');
    await page.screenshot({ path: join(OUT, `sheet-learning-${size}.png`) });
    await scrollSheet(page, 'bottom');
    await page.screenshot({ path: join(OUT, `sheet-learning-notes-${size}.png`) });
    facts[`sheet-learning-${size}`] = await words(page, ['project-state', 'project-history', 'project-met', 'project-actions', 'project-sections', 'project-status']);

    await page.locator('#project-action-retire').click();
    await expect(page.locator('#project-state')).toHaveText(/^Put away since /);
    await scrollSheet(page, 'top');
    await page.screenshot({ path: join(OUT, `sheet-put-away-${size}.png`) });
    facts[`sheet-put-away-${size}`] = await words(page, ['project-state', 'project-history', 'project-met', 'project-actions']);
    await page.locator('#project-action-bring-back').click();
    await expect(page.locator('#project-state')).toHaveText(/^Bringing it back since /);
    await scrollSheet(page, 'top');
    await page.screenshot({ path: join(OUT, `sheet-brought-back-${size}.png`) });
    facts[`sheet-brought-back-${size}`] = await words(page, ['project-state', 'project-history', 'project-met', 'project-actions']);

    // A second piece passed, and no project: Progress offers it.
    await page.evaluate(async () => {
      const hooks = (window as unknown as Hooked).__pianopath;
      if (!hooks) throw new Error('no test hooks');
      await hooks.recordRun({ itemId: 'song.folk.mary-had-a-little-lamb', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.96, accuracyEstimated: false, wrongNotes: 0, missed: 1, durationMs: 90_000, passed: true, masterEligible: false }, new Date(Date.now() - 3 * 86_400_000));
    });
    await page.goto('./#/progress');
    const block = page.locator('#progress-projects');
    await expect(block.locator('[data-project]')).toHaveCount(1);
    await block.evaluate((node) => {
      node.closest('section')?.scrollIntoView({ block: 'start' });
    });
    await page.screenshot({ path: join(OUT, `progress-projects-${size}.png`) });
    facts[`progress-projects-${size}`] = { text: await block.innerText(), rowHeights: await block.locator('.list-row').evaluateAll((rows) => rows.map((row) => Math.round(row.getBoundingClientRect().height))) };

    // A Stage 9 unit's page: its songs as projects, no count.
    await page.goto('./#/lesson/classical.9');
    await expect(page.locator('#lesson-project')).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: join(OUT, `stage9-top-${size}.png`) });
    await page.locator('#lesson-songs').evaluate((node) => {
      node.closest('section')?.scrollIntoView({ block: 'start' });
    });
    await page.screenshot({ path: join(OUT, `stage9-songs-${size}.png`) });
    facts[`stage9-${size}`] = {
      sentence: await page.locator('#lesson-project').innerText(),
      countsHidden: await page.locator('#lesson-counts').isHidden(),
      actions: await page.locator('#lesson-actions').innerText(),
      songs: await page.locator('#lesson-songs .list-row').evaluateAll((rows) => rows.map((row) => ({ title: row.querySelector('.list-row__title')?.textContent, badge: row.querySelector('.badge')?.textContent, state: (row as HTMLElement).dataset.projectState }))),
    };
    facts[`projects-${size}`] = await projects(page);
    // Fresh for the next size.
    await page.evaluate(() => {
      sessionStorage.removeItem('e2e-fresh');
    });
  }
  writeFileSync(join(OUT, 'facts.json'), `${JSON.stringify(facts, null, 1)}\n`);
});
