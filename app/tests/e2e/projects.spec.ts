/**
 * The repertoire lifecycle in the real app (G1b; R19, R47, R18, L86): the learner's stated
 * relationship with a piece, through its two doors, and Stage 9's page reading it.
 *
 *   finish a run → *What next with this piece?* → *Learn this* → Progress lists the project;
 *   its row → *Put it away* → *Bring it back* → the history line and the encounter line;
 *   a Stage 9 unit's page → its songs as projects, no count, and one project's state shown.
 *
 * Nothing is seeded for the first two: the run is played through the screen keys, in time, as
 * `lesson-flow.spec.ts` plays it, and every project change is a tap on the sheet.
 */
import { expect, test, type Page } from '@playwright/test';

import { playInTime } from './fixtures/playInTime';
import { setTempoPercent, withScoreMenu } from './scoreControls';

const ITEM = 'song.folk.hot-cross-buns';
const BALLADE = 'song.classical.chopin-ballade-1';

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

/** The local day, as the app names days (`progressStore.dayKey`). */
function today(): string {
  const now = new Date();
  return `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Every row of one store, read straight from IndexedDB. */
async function storeRows(page: Page, store: string): Promise<unknown[]> {
  return page.evaluate(async (name) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction(name, 'readonly').objectStore(name).getAll();
      request.onsuccess = () => resolve(request.result as unknown[]);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    db.close();
    return rows;
  }, store);
}

async function finishARun(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await withScoreMenu(page, async () => {
    await page.locator('#score-input').selectOption('keys');
  });
  await page.locator('#score-mode').selectOption('tempo');
  await page.locator('#score-hands-R').click();
  await setTempoPercent(page, 100);
  await page.locator('#score-play').click();
  expect(await playInTime(page, 'keys')).toBeGreaterThan(0);
  await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
}

test('finish a run, What next with this piece?, Learn this — Progress lists the project', async ({ page }) => {
  test.setTimeout(180_000);
  await finishARun(page);
  const door = page.locator('#summary-project');
  await expect(door).toHaveText('What next with this piece?');
  await door.click();
  const sheet = page.locator('#project-sheet');
  await expect(sheet.locator('h2')).toHaveText('Hot Cross Buns');
  await expect(page.locator('#project-state')).toHaveText('Not a project yet');
  await expect(page.locator('#project-met')).toHaveText(`You last played it on ${today()}.`);
  expect(await storeRows(page, 'projects'), 'opening the sheet made a project').toEqual([]);
  await page.locator('#project-action-learn').click();
  await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);
  const [row] = (await storeRows(page, 'projects')) as { itemId: string; state: string; material: { kind: string } }[];
  expect(row).toMatchObject({ itemId: ITEM, state: 'learning', material: { kind: 'file' } });

  await page.goto('/#/progress');
  const project = page.locator(`#progress-projects [data-project][data-item="${ITEM}"]`);
  await expect(project.locator('.list-row__title')).toHaveText('Hot Cross Buns');
  await expect(project.locator('.list-row__sub')).toHaveText(`Learning since ${today()}`);
});

test('Put it away, then Bring it back: the history line and the encounter line', async ({ page }) => {
  test.setTimeout(180_000);
  await finishARun(page);
  const sessionsBefore = (await storeRows(page, 'sessions')).length;
  await page.locator('#summary-project').click();
  await page.locator('#project-action-learn').click();
  await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);

  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-project][data-item="${ITEM}"]`).click();
  await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);
  await page.locator('#project-action-retire').click();
  await expect(page.locator('#project-state')).toHaveText(`Put away since ${today()}`);
  await page.locator('#project-action-bring-back').click();
  await expect(page.locator('#project-state')).toHaveText(`Bringing it back since ${today()}`);
  await expect(page.locator('#project-history')).toHaveText(`Before this: Put away, from ${today()}.`);
  await expect(page.locator('#project-met')).toHaveText(`You last played it on ${today()}.`);
  // Put away and brought back: the history grew, and nothing else was written or taken away.
  const [row] = (await storeRows(page, 'projects')) as { history: { state: string }[] }[];
  expect(row?.history.map((step) => step.state)).toEqual(['learning', 'retired', 'refreshing']);
  expect((await storeRows(page, 'sessions')).length).toBe(sessionsBefore);
  await page.locator('#project-sheet-close').click();
  await expect(page.locator(`#progress-projects [data-item="${ITEM}"] .list-row__sub`)).toHaveText(`Bringing it back since ${today()}`);
});

test('a Stage 9 unit’s page shows its songs as projects and no count; one project’s state shows on its row alone', async ({ page }) => {
  await page.goto('/#/lesson/classical.9');
  await expect(page.locator('#lesson-project')).toHaveText('A project: there is no rung to pass here.');
  await expect(page.locator('#lesson-counts')).toBeHidden();
  await expect(page.locator('#lesson-state')).toHaveCount(0);
  await expect(page.locator('#lesson-done')).toHaveCount(0);
  const songs = page.locator('#lesson-songs [data-project-state]');
  expect(await songs.count()).toBeGreaterThan(0);
  await expect(page.locator('#lesson-songs [data-project-state="none"] .badge').first()).toHaveText('not started');
  expect(await page.locator('#lesson-songs [data-project-state]:not([data-project-state="none"])').count()).toBe(0);
  const body = (await page.locator('[data-screen="lesson"]').textContent()) ?? '';
  expect(body).not.toMatch(/What the app counts|\b\d+ of \d+\b|\bcomplete\b|\bin progress\b/);

  // A project on the Ballade, as the sheet would write it — keyed by the catalogue's own identity.
  await page.evaluate(async (id) => {
    const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; provenance?: { identity?: { kind: string; sha256?: string } } }[];
    const identity = catalog.find((one) => one.id === id)?.provenance?.identity;
    if (identity?.kind !== 'file' || identity.sha256 === undefined) throw new Error(`${id} has no file identity`);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const at = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      tx.objectStore('projects').put({
        id: `file:${identity.sha256}`,
        material: identity,
        itemId: id,
        state: 'polishing',
        since: at,
        history: [{ state: 'polishing', at, why: 'polish' }],
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, BALLADE);
  await page.reload();
  await expect(page.locator(`#lesson-songs [data-item="${BALLADE}"] .badge`)).toHaveText('Preparing for performance');
  expect(await page.locator('#lesson-songs [data-project-state]:not([data-project-state="none"])').count()).toBe(1);
  await expect(page.locator('#lesson-counts')).toBeHidden();
});
