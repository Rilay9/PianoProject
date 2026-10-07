/**
 * G85's pictures and measurements, not a test of the app: copied into `app/tests/e2e/` for its runs and
 * removed after. Writes under the worktree's `build/g85/pictures/<phase>/` only (a spec never writes
 * under `docs/`); the builder copies what is kept. `G85_PHASE` names the build: `before` (the committed
 * code) or `after` (this tree).
 *
 * At 342 × 740: Hot Cross Buns made a project (Learning) straight in the store, as the sheet writes it;
 * the row, the screen, the filter row; then paused on the sheet from Progress's project row, and the row
 * again. On the committed build only, the fit probe: a quiet `Project` beside `Details` on every row
 * with a `⋯`. The first page's rows measured (title width, clamped or not, row height), and a full
 * draw timed — the Type select's change handler draws synchronously, so one dispatch is one `draw()` —
 * with no project, one, and forty.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PHASE = process.env.G85_PHASE ?? 'unknown';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'build', 'g85', 'pictures', PHASE);
const ITEM = 'song.folk.hot-cross-buns';

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
  mkdirSync(OUT, { recursive: true });
});

/** Puts projects in the store, keyed by the catalogue's identity, as the sheet writes them. */
async function seedProjects(page: Page, ids: string[], state: string): Promise<string[]> {
  return page.evaluate(
    async ({ ids, state }) => {
      const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; type: string; provenance?: { identity?: { kind: string; sha256?: string } } }[];
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(String(request.error)));
      });
      const at = new Date().toISOString();
      const done: string[] = [];
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('projects', 'readwrite');
        for (const id of ids) {
          const identity = catalog.find((one) => one.id === id)?.provenance?.identity;
          if (identity?.kind !== 'file' || identity.sha256 === undefined) continue;
          tx.objectStore('projects').put({ id: `file:${identity.sha256}`, material: identity, itemId: id, state, since: at, history: [{ state, at, why: 'learn' }] });
          done.push(id);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(String(tx.error)));
      });
      db.close();
      return done;
    },
    { ids, state },
  );
}

async function songIds(page: Page, count: number): Promise<string[]> {
  return page.evaluate(async (n) => {
    const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; type: string; imported?: boolean; provenance?: { identity?: { kind: string } } }[];
    return catalog.filter((one) => one.type === 'song' && one.provenance?.identity?.kind === 'file').slice(0, n).map((one) => one.id);
  }, count);
}

/** The first page's rows: what the fit question asks of each. */
async function rowFacts(page: Page): Promise<unknown> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#library-list .list-row')].map((row) => {
      const title = row.querySelector<HTMLElement>('.list-row__title');
      const text = row.querySelector<HTMLElement>('.list-row__text');
      const actions = row.querySelector<HTMLElement>('.list-row__actions');
      return {
        item: row.dataset.item,
        title: title?.textContent,
        rowHeight: Math.round(row.getBoundingClientRect().height),
        textWidth: Math.round(text?.getBoundingClientRect().width ?? 0),
        actionsWidth: Math.round(actions?.getBoundingClientRect().width ?? 0),
        titleLines: title ? Math.round(title.scrollHeight / parseFloat(getComputedStyle(title).lineHeight || '20')) : 0,
        titleClamped: title ? title.scrollHeight > title.clientHeight + 1 : false,
        actions: [...(actions?.querySelectorAll('button') ?? [])].map((button) => button.textContent),
        badges: [...row.querySelectorAll('.badge')].map((badge) => badge.textContent),
      };
    }),
  );
}

/** One full draw, timed: the Type select's change handler calls `draw()` synchronously. */
async function timeDraws(page: Page, rounds: number): Promise<number[]> {
  await page.locator('#library-filter-toggle').click();
  const times = await page.evaluate((n) => {
    const select = document.getElementById('library-type') as HTMLSelectElement;
    const out: number[] = [];
    for (let i = 0; i < n; i += 1) {
      select.value = i % 2 === 0 ? 'song' : 'all';
      const start = performance.now();
      select.dispatchEvent(new Event('change'));
      out.push(performance.now() - start);
    }
    select.value = 'all';
    select.dispatchEvent(new Event('change'));
    return out;
  }, rounds);
  await page.locator('#library-filter-toggle').click();
  return times;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? NaN;
};

test('G85 pictures and measurements', async ({ page }) => {
  test.setTimeout(240_000);
  const facts: Record<string, unknown> = { phase: PHASE };

  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
  await expect(page.locator('#library-list .list-row').first()).toBeVisible();

  // The first page and a full draw, with no project at all.
  facts.firstPageNoProjects = await rowFacts(page);
  await page.screenshot({ path: path.join(OUT, `${PHASE}-library-first-page-342x740.png`) });
  if (PHASE === 'before') {
    // The fit probe, on the committed build only: a quiet `Project` beside `Details` on every song row
    // that has a `⋯`, measured as the rows then stand — the question the brief's "When to deviate" asks.
    await page.evaluate(() => {
      for (const row of document.querySelectorAll<HTMLElement>('#library-list .list-row')) {
        const more = row.querySelector('.list-row__actions .library-openas');
        if (!more) continue;
        const probe = document.createElement('button');
        probe.type = 'button';
        probe.className = 'link-button g85-probe';
        probe.textContent = 'Project';
        more.before(probe);
      }
    });
    facts.firstPageProbe = await rowFacts(page);
    await page.screenshot({ path: path.join(OUT, `${PHASE}-probe-first-page-with-project-word-342x740.png`) });
    await page.reload();
    await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 60_000 });
  }
  await timeDraws(page, 6);
  const drawsNone = await timeDraws(page, 40);
  facts.drawMsNoProjects = { median: median(drawsNone), all: drawsNone };

  // Hot Cross Buns, Learning.
  await seedProjects(page, [ITEM], 'learning');
  await page.reload();
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
  await timeDraws(page, 6);
  const drawsOne = await timeDraws(page, 40);
  facts.drawMsOneProject = { median: median(drawsOne), all: drawsOne };
  facts.firstPageOneProject = await rowFacts(page);

  await page.locator('#library-search').fill('hot cross');
  const row = page.locator(`#library-list .list-row[data-item="${ITEM}"]`);
  await expect(row).toBeVisible();
  await page.waitForTimeout(300);
  facts.rowLearning = { text: (await row.innerText()).trim(), facts: await rowFacts(page) };
  await row.screenshot({ path: path.join(OUT, `${PHASE}-row-hot-cross-buns-learning-342x740.png`) });
  await page.screenshot({ path: path.join(OUT, `${PHASE}-library-search-hot-cross-learning-342x740.png`) });

  // The filter row, open.
  await page.locator('#library-search').fill('');
  await page.locator('#library-filter-toggle').click();
  await expect(page.locator('#library-filters')).toBeVisible();
  await page.waitForTimeout(200);
  await page.locator('#library-filters').screenshot({ path: path.join(OUT, `${PHASE}-filters-342x740.png`) });
  await page.screenshot({ path: path.join(OUT, `${PHASE}-filters-open-342x740.png`) });
  facts.filterSelects = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLSelectElement>('#library-filters select')].map((select) => ({
      id: select.id,
      label: select.getAttribute('aria-label'),
      options: [...select.options].map((option) => `${option.value}=${option.textContent ?? ''}`),
      box: (() => {
        const box = select.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
      })(),
    })),
  );
  const project = page.locator('#library-project');
  if ((await project.count()) > 0) {
    await project.selectOption('learning');
    await page.waitForTimeout(200);
    facts.filterLearning = { count: await page.locator('#library-count').textContent(), rows: await rowFacts(page) };
    await page.screenshot({ path: path.join(OUT, `${PHASE}-filter-learning-342x740.png`) });
    await project.selectOption('all');
  }
  await page.locator('#library-filter-toggle').click();

  // Paused on the sheet (opened from Progress's project row, the door there is), then the row again.
  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-project][data-item="${ITEM}"]`).click();
  await expect(page.locator('#project-action-pause')).toBeVisible();
  await page.locator('#project-action-pause').click();
  await expect(page.locator('#project-state')).toContainText('Paused since');
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
  await page.locator('#library-search').fill('hot cross');
  await expect(row).toBeVisible();
  await page.waitForTimeout(300);
  facts.rowPaused = { text: (await row.innerText()).trim(), facts: await rowFacts(page) };
  await row.screenshot({ path: path.join(OUT, `${PHASE}-row-hot-cross-buns-paused-342x740.png`) });
  await page.screenshot({ path: path.join(OUT, `${PHASE}-library-search-hot-cross-paused-342x740.png`) });

  // Forty projects, and a full draw again.
  await page.locator('#library-search').fill('');
  const forty = await songIds(page, 40);
  facts.fortySeeded = (await seedProjects(page, forty, 'learning')).length;
  await page.reload();
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
  await timeDraws(page, 6);
  const drawsForty = await timeDraws(page, 40);
  facts.drawMsFortyProjects = { median: median(drawsForty), all: drawsForty };
  facts.firstPageFortyProjects = await rowFacts(page);
  await page.screenshot({ path: path.join(OUT, `${PHASE}-library-first-page-forty-projects-342x740.png`) });

  writeFileSync(path.join(OUT, `${PHASE}-facts.json`), `${JSON.stringify(facts, null, 2)}\n`);
});
