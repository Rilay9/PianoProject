/**
 * G1c probe (copied into app/tests/e2e/ for the run and removed after): why the browser case's seeded
 * runs did not count on Plan's Stage 8 line. Seeds the same rows, reloads, and prints what the store
 * holds, what Plan's Stage 8 and Stage 9 lines say, and what technique.8's and classical.9's pages
 * count.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

test('probe', async ({ page }) => {
  await page.goto('/#/plan');
  await expect(page.locator('.list-row[data-stage="9"]')).toBeVisible();
  const seeded = await page.evaluate(async () => {
    type Rung = { id: string; exerciseOptions: string[]; songOptions: string[]; mastery?: unknown };
    const curriculum = (await (await fetch('content/curriculum.json')).json()) as { stages: { units: { lessons: Rung[] }[] }[] };
    const rungs = new Map(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l]));
    const first = (rung: string, from: 'exercises' | 'songs'): string => {
      const found = rungs.get(rung);
      const id = (from === 'songs' ? found?.songOptions : found?.exerciseOptions)?.[0];
      if (id === undefined) throw new Error(`${rung} lists no ${from}`);
      return id;
    };
    const at = new Date().toISOString();
    const runs = ([['classical.9', 'exercises'], ['classical.9', 'songs'], ['technique.8', 'exercises']] as const).map(([rung, from]) => ({
      itemId: first(rung, from), lessonId: rung, mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 1,
      accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 60_000, at,
    }));
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const version = db.version;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      for (const run of runs) tx.objectStore('sessions').put(run);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
    return { version, runs, mastery: { t8: rungs.get('technique.8')?.mastery, c9: rungs.get('classical.9')?.mastery } };
  });
  console.log('SEEDED', JSON.stringify(seeded));
  await page.reload();
  await page.waitForTimeout(2000);
  const rows = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const all = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction('sessions', 'readonly').objectStore('sessions').getAll();
      request.onsuccess = () => resolve(request.result as unknown[]);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    db.close();
    return all;
  });
  console.log('STORE', JSON.stringify(rows));
  for (const n of [8, 9]) console.log(`STAGE ${String(n)}`, await page.locator(`.list-row[data-stage="${String(n)}"] .list-row__metatext`).textContent());
  for (const rung of ['technique.8', 'classical.9']) {
    await page.goto(`/#/lesson/${rung}`);
    await page.waitForTimeout(2500);
    console.log(`LESSON ${rung}`, JSON.stringify(await page.locator('[data-screen="lesson"]').evaluate((node) => {
      const state = node.querySelector('#lesson-state')?.textContent ?? null;
      const counts = node.querySelector('#lesson-counts')?.textContent ?? null;
      return { state, counts };
    })));
  }
});
