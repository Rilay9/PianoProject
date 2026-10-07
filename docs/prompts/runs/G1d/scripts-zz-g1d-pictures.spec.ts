/**
 * G1d's pictures (not a test of the suite: copied into app/tests/e2e for its runs and removed after).
 * Today at 342 × 740 for `today.spec.ts`'s learner on 2.2 — Ode to Joy passed on 2.1 twenty days ago —
 * seeded straight into the stores as `projects.spec.ts` seeds; the project made and paused on its
 * sheet. Run against the committed code's build (the before) and this tree's (the after); each writes
 * its PNGs and a facts file into Playwright's output folder, and the orchestrating shell copies them to
 * docs/prompts/pictures/g1d/. Nothing here writes under docs/.
 *
 * The second case is the brief's "When to deviate" question about X1's stored run: a session started
 * while the piece was offered, the piece paused, Today opened again — what the running session shows.
 */
import { writeFileSync } from 'node:fs';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const ODE = 'song.classical.ode-to-joy.ht';

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

async function seed(page: Page): Promise<void> {
  const day = 86_400_000;
  const yesterday = new Date(Date.now() - day).toISOString();
  const long = new Date(Date.now() - 20 * day).toISOString();
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 30_000 });
  await putRows(page, {
    plan: [{ id: 'current', stage: 1, unitId: '2.2', trackOrder: ['core'], placement: { unitId: '2.2', at: new Date().toISOString() } }],
    sessions: [
      { itemId: 'drill.rhythm.eighths', lessonId: '2.2', mode: 'drill:rhythm', tempoPct: 100, tempoMeasured: false, accuracy: 0.97, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: yesterday },
      { itemId: ODE, lessonId: '2.1', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.95, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: long },
    ],
    progress: [
      { itemId: 'drill.rhythm.eighths', status: 'passed', bestAccuracy: 0.97, bestTempoPct: 0, attempts: 1, lastPracticedAt: yesterday, minutes: 2, passedOn: [yesterday.slice(0, 10)] },
      { itemId: ODE, status: 'passed', bestAccuracy: 0.95, bestTempoPct: 100, attempts: 1, lastPracticedAt: long, minutes: 2, passedOn: [long.slice(0, 10)] },
    ],
  });
}

async function openToday(page: Page): Promise<void> {
  await page.goto('/#/today');
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
  await expect(page.locator('#today-card .list-row[data-slot="review"]')).toBeVisible({ timeout: 30_000 });
  // The fonts and the card settled before a picture.
  await page.evaluate(async () => document.fonts.ready);
}

/** Every row of the card, as the learner reads it and as the page marks it. */
async function cardFacts(page: Page): Promise<unknown> {
  return page.locator('#today-card .list-row').evaluateAll((rows) =>
    rows.map((row) => ({
      slot: row.getAttribute('data-slot'),
      claim: row.getAttribute('data-claim'),
      item: row.getAttribute('data-item'),
      state: row.getAttribute('data-state'),
      title: row.querySelector('.list-row__title')?.textContent ?? null,
      sub: row.querySelector('.list-row__sub')?.textContent ?? null,
      meta: row.querySelector('.list-row__meta')?.textContent ?? null,
    })),
  );
}

async function pause(page: Page): Promise<void> {
  await page.goto('/#/progress');
  const offer = page.locator(`#progress-projects [data-offer][data-item="${ODE}"]`);
  const project = page.locator(`#progress-projects [data-project][data-item="${ODE}"]`);
  await expect(offer.or(project)).toBeVisible({ timeout: 30_000 });
  if (await offer.count()) {
    await offer.getByRole('button', { name: 'Make it a project' }).click();
    await page.locator('#project-action-keep').click();
    await expect(page.locator('#project-state')).toHaveText(/^Keeping it playable since /);
  } else {
    await project.click();
  }
  await page.locator('#project-action-pause').click();
  await expect(page.locator('#project-state')).toHaveText(/^Paused since /);
}

async function shoot(page: Page, info: TestInfo, name: string): Promise<void> {
  await page.screenshot({ path: info.outputPath(`${name}-342x740.png`) });
  await page.locator('#today-card .list-row[data-slot="review"]').screenshot({ path: info.outputPath(`${name}-review-row-342x740.png`) });
}

test('Today’s review row with the piece unpaused, then paused on its sheet', async ({ page }, info) => {
  test.setTimeout(180_000);
  await seed(page);
  await openToday(page);
  const unpaused = await cardFacts(page);
  await shoot(page, info, 'today-unpaused');
  await pause(page);
  await openToday(page);
  const paused = await cardFacts(page);
  await shoot(page, info, 'today-paused');
  writeFileSync(info.outputPath('facts.json'), JSON.stringify({ unpaused, paused }, null, 2));
});

test('X1’s stored run: a session started with the piece on it, the piece paused, Today opened again', async ({ page }, info) => {
  test.setTimeout(180_000);
  await seed(page);
  await openToday(page);
  const composed = await cardFacts(page);
  await page.locator('#today-start').click();
  // The first activity opens; the learner goes to Progress and pauses the piece from there.
  await expect(page).not.toHaveURL(/#\/today$/, { timeout: 30_000 });
  await pause(page);
  await page.goto('/#/today');
  await expect(page.locator('#today-card .list-row[data-slot="review"]')).toBeVisible({ timeout: 30_000 });
  await page.evaluate(async () => document.fonts.ready);
  const running = await cardFacts(page);
  const actions = (await page.locator('#today-actions').innerText()).trim();
  await page.screenshot({ path: info.outputPath('today-running-session-paused-342x740.png') });
  writeFileSync(info.outputPath('facts-running-session.json'), JSON.stringify({ composed, running, actions }, null, 2));
});
