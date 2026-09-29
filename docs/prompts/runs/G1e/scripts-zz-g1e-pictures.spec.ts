/**
 * G1e's pictures (not a test of the suite: copied into app/tests/e2e for its two runs and removed after).
 * Today at 342 × 740, thirty minutes, for the thin card in the real app: a learner on 0.4, the placement
 * rung, whose one earlier song is *Hot Cross Buns* (0.3's), mastered twenty days ago and not played since —
 * seeded straight into the stores as `projects.spec.ts` seeds — then made a project on Progress and paused
 * on its sheet; then the same learner placed at 1.1, whose rung lists the piece and asks for a song. Run
 * against the committed code's build (the before) and this tree's (the after); each writes its PNGs and a
 * facts file into Playwright's output folder, and the orchestrating shell copies them to
 * docs/prompts/pictures/g1e/. Nothing here writes under docs/.
 */
import { writeFileSync } from 'node:fs';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const HCB = 'song.folk.hot-cross-buns';

test.use({ viewport: { width: 342, height: 740 } });

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

async function putRows(page: Page, stores: Record<string, unknown[]>): Promise<void> {
  await page.evaluate(async (rows) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [name, list] of Object.entries(rows)) for (const row of list) tx.objectStore(name).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, stores);
}

const placedAt = (unitId: string) => ({ id: 'current', stage: 0, unitId, trackOrder: ['core'], placement: { unitId, at: new Date().toISOString() } });

async function openToday(page: Page, lesson: string): Promise<void> {
  await page.goto('/#/today');
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', lesson, { timeout: 30_000 });
  await page.locator('#today-length-30').click();
  await expect(page.locator('#today-length-30')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.evaluate(async () => document.fonts.ready);
}

/** Every row of the card, as the learner reads it and as the page marks it. */
async function cardFacts(page: Page): Promise<unknown> {
  return page.locator('#today-card .list-row').evaluateAll((rows) =>
    rows.map((row) => ({
      slot: row.getAttribute('data-slot'),
      claim: row.getAttribute('data-claim'),
      item: row.getAttribute('data-item'),
      title: row.querySelector('.list-row__title')?.textContent ?? null,
      sub: row.querySelector('.list-row__sub')?.textContent ?? null,
      meta: row.querySelector('.list-row__meta')?.textContent ?? null,
    })),
  );
}

async function shoot(page: Page, info: TestInfo, name: string): Promise<void> {
  await page.screenshot({ path: info.outputPath(`${name}-342x740.png`) });
}

test('the thin card with Hot Cross Buns mastered, then paused; then placed where the rung asks for it', async ({ page }, info) => {
  test.setTimeout(180_000);
  const long = new Date(Date.now() - 20 * 86_400_000).toISOString();
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await putRows(page, {
    plan: [placedAt('0.4')],
    sessions: [{ itemId: HCB, lessonId: '0.3', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.98, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: long }],
    progress: [{ itemId: HCB, status: 'mastered', bestAccuracy: 0.98, bestTempoPct: 100, attempts: 3, lastPracticedAt: long, minutes: 6, passedOn: [long.slice(0, 10)] }],
  });
  await openToday(page, '0.4');
  const unpaused = await cardFacts(page);
  await shoot(page, info, 'thin-unpaused');

  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-offer][data-item="${HCB}"]`).getByRole('button', { name: 'Make it a project' }).click();
  await page.locator('#project-action-keep').click();
  await expect(page.locator('#project-state')).toHaveText(/^Keeping it playable since /);
  await page.locator('#project-action-pause').click();
  await expect(page.locator('#project-state')).toHaveText(/^Paused since /);
  await openToday(page, '0.4');
  const paused = await cardFacts(page);
  await shoot(page, info, 'thin-paused');

  await putRows(page, { plan: [placedAt('1.1')] });
  await openToday(page, '1.1');
  const rung = await cardFacts(page);
  await shoot(page, info, 'rung-asks-paused');

  writeFileSync(info.outputPath('facts.json'), JSON.stringify({ unpaused, paused, rung }, null, 2));
});
