/**
 * G96's pictures and measurements, not a test of the app: copied into `app/tests/e2e/` for its runs and
 * removed after. Writes under `app/test-results/g96-pictures/<phase>/` only (a spec never writes under
 * `docs/`); the builder copies what is kept. `G96_PHASE` names the build: `before` (the committed code) or
 * `after` (this tree).
 *
 * At 342 × 740: the project sheet from the Library's Details on a song never played (*Hot Cross Buns*),
 * then *Learn this* and *Close* and where focus lands; the sheet from Progress's *Make it a project* on the
 * same piece passed, *Keep it playable*, *Close* and where focus lands; a PDF import's row and its Details;
 * *Twinkle, Twinkle, Little Star (hands together)* with a project badge, its row measured; the sheet from
 * Details on a piece the learner self-passed and never opened; and brief item 7's scoped window, a *Close*
 * that comes before the Library's redraw.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PHASE = process.env.G96_PHASE ?? 'unknown';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'test-results', 'g96-pictures', PHASE);
const PDF = path.join(HERE, '..', 'fixtures', 'imports', 'two-systems.pdf');
const NEVER = 'song.folk.hot-cross-buns';
const TWINKLE = 'song.folk.twinkle.ht';
const SELF = 'song.folk.mary-had-a-little-lamb';

test.use({ viewport: { width: 342, height: 740 } });
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
  mkdirSync(OUT, { recursive: true });
});

const facts: Record<string, unknown> = { phase: PHASE };
function save(name: string, value: unknown): void {
  facts[name] = value;
  writeFileSync(path.join(OUT, `${PHASE}-facts.json`), JSON.stringify(facts, null, 2));
}
const shot = (page: Page, name: string): Promise<Buffer> => page.screenshot({ path: path.join(OUT, `${PHASE}-${name}-342x740.png`) });
const shotOf = (node: Locator, name: string): Promise<Buffer> => node.screenshot({ path: path.join(OUT, `${PHASE}-${name}-342x740.png`) });

function today(): string {
  const now = new Date();
  return `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Rows put straight into the app's stores, in one transaction. */
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

/** A piece made a project (Learning) straight in the store, as the sheet writes it, keyed by the catalogue's identity. */
async function seedLearning(page: Page, id: string): Promise<void> {
  await page.evaluate(async (itemId) => {
    const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; provenance?: { identity?: { kind: string; sha256?: string } } }[];
    const identity = catalog.find((one) => one.id === itemId)?.provenance?.identity;
    if (identity?.kind !== 'file' || identity.sha256 === undefined) throw new Error(`${itemId} has no file identity`);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const at = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      tx.objectStore('projects').put({ id: `file:${identity.sha256}`, material: identity, itemId, state: 'learning', since: at, history: [{ state: 'learning', at, why: 'learn' }] });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, id);
}

/** The project sheet as the learner reads it: its title, state line, history line, met line and buttons. */
async function sheetFacts(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    title: document.querySelector('#project-sheet h2')?.textContent,
    state: document.getElementById('project-state')?.textContent,
    met: document.getElementById('project-met')?.textContent,
    buttons: [...document.querySelectorAll('#project-actions button')].map((one) => one.textContent),
  }));
}

/** Where focus is: the body, or the element, its words, and the list row it sits in. */
async function focusFacts(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!active || active === document.body) return { on: 'body' };
    const row = active.closest<HTMLElement>('.list-row');
    return {
      on: active.tagName.toLowerCase(),
      text: (active.textContent ?? '').trim().slice(0, 40),
      row: row ? { item: row.dataset.item, project: row.dataset.project ?? null, offer: row.dataset.offer ?? null, list: row.parentElement?.id ?? null } : null,
    };
  });
}

async function openDoor(page: Page, id: string, search: string): Promise<void> {
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
  await page.locator('#library-search').fill(search);
  const row = page.locator(`#library-list .list-row[data-item="${id}"]`);
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Details' }).click();
  await page.locator('#library-detail #library-detail-project').click();
  await expect(page.locator('#project-state')).toHaveText('Not a project yet');
  await expect(page.locator('#project-met')).not.toHaveText(/^$|Looking/);
  await expect(page.locator('#project-actions button').first()).toBeVisible();
  // Every read answered: a late draw would change what the picture shows.
  await page.waitForTimeout(300);
}

test('the sheet from the Library’s Details on a song never played, then Learn this, Close, and where focus lands', async ({ page }) => {
  await openDoor(page, NEVER, 'hot cross');
  save('librarySheetNeverPlayed', await sheetFacts(page));
  await shot(page, 'sheet-library-never-played');
  await page.locator('#project-action-learn').click();
  await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);
  await expect(page.locator(`#library-list .list-row[data-item="${NEVER}"] .badge[data-project]`)).toHaveText('Learning');
  await page.locator('#project-sheet-close').click();
  await expect(page.locator('#project-sheet')).toHaveCount(0);
  await page.waitForTimeout(200);
  save('libraryFocusAfterClose', await focusFacts(page));
  await shot(page, 'library-after-close');
});

test('the sheet from Progress’s Make it a project on a piece passed, then Keep it playable, Close, and where focus lands', async ({ page }) => {
  const at = new Date(Date.now() - 86_400_000).toISOString();
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
  await putRows(page, {
    sessions: [{ itemId: NEVER, lessonId: '0.3', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.98, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at }],
    progress: [{ itemId: NEVER, status: 'passed', bestAccuracy: 0.98, bestTempoPct: 100, attempts: 1, lastPracticedAt: at, minutes: 2, passedOn: [at.slice(0, 10)] }],
  });
  await page.goto('/#/progress');
  await page.reload();
  await expect(page.locator('#progress-projects')).toHaveAttribute('data-drawn', 'true', { timeout: 30_000 });
  await page.locator(`#progress-projects [data-offer][data-item="${NEVER}"]`).getByRole('button', { name: 'Make it a project' }).click();
  await expect(page.locator('#project-state')).toHaveText('Not a project yet');
  await expect(page.locator('#project-action-keep')).toBeVisible();
  await page.waitForTimeout(300);
  save('progressSheetPassed', await sheetFacts(page));
  await shot(page, 'sheet-progress-passed');
  await page.locator('#project-action-keep').click();
  await expect(page.locator('#project-state')).toHaveText(`Keeping it playable since ${today()}`);
  await expect(page.locator(`#progress-projects [data-project][data-item="${NEVER}"]`)).toHaveCount(1);
  await page.locator('#project-sheet-close').click();
  await expect(page.locator('#project-sheet')).toHaveCount(0);
  await page.waitForTimeout(200);
  save('progressFocusAfterClose', await focusFacts(page));
  await shot(page, 'progress-after-close');
});

test('a PDF import’s row, its detail line, and its Details', async ({ page }) => {
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles(PDF);
  const row = page.locator('#library-list .list-row[data-item="import.two-systems"]');
  await expect(row).toBeVisible();
  save('pdfRow', await row.evaluate((node) => ({
    metatext: node.querySelector('.list-row__metatext')?.textContent,
    badges: [...node.querySelectorAll('.badge')].map((one) => one.textContent),
  })));
  await shotOf(row, 'pdf-row');
  await row.getByRole('button', { name: 'Details' }).click();
  await expect(page.locator('#library-detail')).toBeVisible();
  save('pdfDetails', await page.evaluate(() => ({
    level: [...document.querySelectorAll('#library-detail dt')].find((one) => one.textContent === 'Level')?.nextElementSibling?.textContent,
    type: [...document.querySelectorAll('#library-detail dt')].find((one) => one.textContent === 'Type')?.nextElementSibling?.textContent,
    guessedSentence: [...document.querySelectorAll('#library-detail p')].map((one) => one.textContent ?? '').find((words) => words.startsWith('The app guessed')) ?? null,
    door: document.getElementById('library-detail-project') !== null,
  })));
  await shot(page, 'pdf-details');
});

test('the two-line title with a project badge: Twinkle (hands together) Learning', async ({ page }) => {
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
  await seedLearning(page, TWINKLE);
  await page.reload();
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
  await page.locator('#library-search').fill('twinkle');
  const row = page.locator(`#library-list .list-row[data-item="${TWINKLE}"]`);
  await expect(row.locator('.badge[data-project]')).toHaveText('Learning');
  save('twoLineTitle', await row.evaluate((node) => {
    const title = node.querySelector<HTMLElement>('.list-row__title');
    const lineHeight = title ? Number.parseFloat(getComputedStyle(title).lineHeight) : Number.NaN;
    return {
      title: title?.textContent,
      titleLines: title && Number.isFinite(lineHeight) ? Math.round(title.getBoundingClientRect().height / lineHeight) : null,
      clipped: title ? title.scrollWidth > title.clientWidth || title.scrollHeight > title.clientHeight : null,
      rowHeight: Math.round(node.getBoundingClientRect().height),
      overR2: Math.round(node.getBoundingClientRect().height) > 96,
      badges: [...node.querySelectorAll('.badge')].map((one) => one.textContent),
    };
  }));
  await shotOf(row, 'row-twinkle-ht-learning');
  await shot(page, 'library-twinkle-learning');
});

test('the sheet from Details on a piece the learner said they already know and never opened', async ({ page }) => {
  const at = new Date(Date.now() - 86_400_000).toISOString();
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
  // What *I already know this* writes (`progressStore.selfPass`): a pass the learner asserts, no run, no encounter.
  await putRows(page, { progress: [{ itemId: SELF, status: 'passed', selfPassed: true, bestAccuracy: 0, bestTempoPct: 0, attempts: 0, lastPracticedAt: at, minutes: 0, passedOn: [at.slice(0, 10)] }] });
  await page.reload();
  await openDoor(page, SELF, 'mary had');
  save('selfPassedSheet', await sheetFacts(page));
  await shot(page, 'sheet-library-self-passed');
});

test('item 7’s scoped window: a Close before the Library’s redraw lands', async ({ page }) => {
  // (A) The action and Close in one task: nothing between them.
  await openDoor(page, NEVER, 'hot cross');
  const sameTask = await page.evaluate(() => {
    (document.getElementById('project-action-learn') as HTMLElement).click();
    (document.getElementById('project-sheet-close') as HTMLElement).click();
    const active = document.activeElement;
    return { rightAfterClose: active === document.body ? 'body' : `${active?.tagName.toLowerCase() ?? '?'} “${(active?.textContent ?? '').trim().slice(0, 30)}”` };
  });
  await expect(page.locator(`#library-list .list-row[data-item="${NEVER}"] .badge[data-project]`)).toHaveText('Learning');
  await page.waitForTimeout(200);
  save('windowSameTask', { ...sameTask, afterRedraw: await focusFacts(page) });

  // (B) Two taps as the test driver makes them, one after the other with no wait between, on another
  // song never played.
  const OTHER = 'song.folk.merrily-we-roll-along';
  await openDoor(page, OTHER, 'merrily');
  const started = Date.now();
  await page.locator('#project-action-learn').click();
  await page.locator('#project-sheet-close').click();
  const between = Date.now() - started;
  await expect(page.locator(`#library-list .list-row[data-item="${OTHER}"] .badge[data-project]`)).toHaveText('Learning');
  await page.waitForTimeout(200);
  save('windowTwoTaps', { tapsSpanMs: between, afterRedraw: await focusFacts(page) });
});
