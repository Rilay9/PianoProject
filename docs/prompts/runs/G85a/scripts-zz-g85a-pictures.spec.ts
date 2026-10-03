/**
 * G85a's pictures and measurements, not a test of the app: copied into `app/tests/e2e/` for its runs and
 * removed after. Writes under `app/test-results/g85a-pictures/<phase>/` only (a spec never writes under
 * `docs/`, U97); the builder copies what is kept. `G85A_PHASE` names the build: `before` (the committed
 * code) or `after` (this tree).
 *
 * At 342 × 740: *Twinkle, Twinkle, Little Star (hands together)* made a project (Learning) straight in
 * the store, as the sheet writes it; its row and its Details; on the after build the sheet opened from
 * Details, a pause there, and the Library after *Close*. Details for a song with no project (the sheet
 * it opens, with its offers from no project), for a placeholder, and for a PDF import. Then brief item
 * 8: a row reached with a letter jump, acted on through Details, its place measured before and after,
 * and where focus lands after *Close*.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PHASE = process.env.G85A_PHASE ?? 'unknown';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'test-results', 'g85a-pictures', PHASE);
const PDF = path.join(HERE, '..', 'fixtures', 'imports', 'two-systems.pdf');
const PIECE = 'song.folk.twinkle.ht';
const NONE = 'song.folk.twinkle.f';
const PLACEHOLDER = 'song.rock.lp-final-masquerade';

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

async function storeRows(page: Page): Promise<unknown> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const rows = await new Promise<{ id: string; itemId: string; state: string }[]>((resolve, reject) => {
      const request = db.transaction('projects', 'readonly').objectStore('projects').getAll();
      request.onsuccess = () => resolve(request.result as { id: string; itemId: string; state: string }[]);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    db.close();
    return rows.map((one) => ({ id: one.id.slice(0, 16), itemId: one.itemId, state: one.state }));
  });
}

/** The rows on the screen: title, whether it is cut, its width, the badges, the actions. */
async function rowsFacts(page: Page): Promise<unknown> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#library-list .list-row')].map((row) => {
      const title = row.querySelector<HTMLElement>('.list-row__title');
      return {
        item: row.dataset.item,
        title: title?.textContent,
        titleWidth: title?.clientWidth,
        clipped: title ? title.scrollWidth > title.clientWidth || title.scrollHeight > title.clientHeight : null,
        rowHeight: Math.round(row.getBoundingClientRect().height),
        badges: [...row.querySelectorAll('.badge')].map((one) => one.textContent),
        actions: [...row.querySelectorAll('.list-row__actions button')].map((one) => one.textContent),
      };
    }),
  );
}

/** The Details sheet, child by child: what each is, its words, and where it sits. */
async function detailFacts(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const body = document.querySelector('#library-detail .sheet__body');
    if (!body) return null;
    return [...body.children].map((child) => {
      const box = child.getBoundingClientRect();
      return {
        tag: child.tagName.toLowerCase(),
        id: child.id || undefined,
        className: child.className || undefined,
        text: (child.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90),
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        height: Math.round(box.height),
      };
    });
  });
}

async function openDetails(page: Page, id: string): Promise<void> {
  await page.locator(`#library-list .list-row[data-item="${id}"]`).getByRole('button', { name: 'Details' }).click();
  await expect(page.locator('#library-detail')).toBeVisible();
}

/** Two pictures of an open Details: its top, and its end (the door and *Open*, or the import block). */
async function shootDetails(page: Page, name: string): Promise<void> {
  await shot(page, `${name}-top`);
  const end = page.locator('#library-detail .sheet__body > :last-child');
  await end.scrollIntoViewIfNeeded();
  await shot(page, `${name}-end`);
}

test('the row, its Details, the sheet from Details, and the row after Pause and Close', async ({ page }) => {
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
  await page.locator('#library-search').fill('twinkle');
  const row = page.locator(`#library-list .list-row[data-item="${PIECE}"]`);
  await expect(row).toBeVisible();
  await shotOf(row, 'row-twinkle-ht-no-project');
  save('rowsNoProject', await rowsFacts(page));

  await seedLearning(page, PIECE);
  await page.reload();
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
  await page.locator('#library-search').fill('twinkle');
  await expect(row.locator('.badge[data-project]')).toHaveText('Learning');
  await shot(page, 'library-search-twinkle-learning');
  await shotOf(row, 'row-twinkle-ht-learning');
  save('rowsLearning', await rowsFacts(page));

  await openDetails(page, PIECE);
  save('detailLearning', await detailFacts(page));
  await shootDetails(page, 'details-learning');
  const door = page.locator('#library-detail-project');
  save('doorOnLearning', await door.count());
  if ((await door.count()) === 0) {
    await page.locator('#library-detail-close').click();
  } else {
    await door.click();
    await expect(page.locator('#project-state')).toHaveText(/^Learning since /);
    await expect(page.locator('#project-met')).not.toHaveText(/^Looking/);
    await shot(page, 'sheet-from-details-learning');
    save('sheetLearning', { title: await page.locator('#project-sheet h2').textContent(), state: await page.locator('#project-state').textContent(), met: await page.locator('#project-met').textContent(), actions: await page.locator('#project-actions button').allTextContents() });
    await page.locator('#project-action-pause').click();
    await expect(page.locator('#project-state')).toHaveText(/^Paused since /);
    await shot(page, 'sheet-paused');
    await page.locator('#project-sheet-close').click();
    await expect(page.locator('#project-sheet')).toHaveCount(0);
    await expect(row.locator('.badge[data-project]')).toHaveText('Paused');
    save('focusAfterClose', await page.evaluate(() => {
      const active = document.activeElement;
      return { tag: active?.tagName.toLowerCase(), id: active?.id || undefined, className: (active as HTMLElement | null)?.className || undefined, text: (active?.textContent ?? '').trim().slice(0, 60), isBody: active === document.body };
    }));
    await shot(page, 'library-after-pause-close');
    await shotOf(row, 'row-twinkle-ht-paused');
    save('rowsAfterPauseClose', await rowsFacts(page));
    save('storeAfterPause', await storeRows(page));
  }

  // A song with no project: its Details, and (after) the sheet the door opens, with nothing done there.
  await openDetails(page, NONE);
  save('detailNone', await detailFacts(page));
  await shootDetails(page, 'details-no-project');
  if ((await door.count()) === 0) {
    await page.locator('#library-detail-close').click();
  } else {
    await door.click();
    await expect(page.locator('#project-met')).not.toHaveText(/^Looking/);
    await shot(page, 'sheet-from-details-no-project');
    save('sheetNone', { state: await page.locator('#project-state').textContent(), met: await page.locator('#project-met').textContent(), actions: await page.locator('#project-actions button').allTextContents() });
    await page.locator('#project-sheet-close').click();
  }
  save('storeAfterNoProjectSheet', await storeRows(page));

  // A placeholder.
  await page.locator('#library-search').fill('final masquerade');
  await expect(page.locator(`#library-list .list-row[data-item="${PLACEHOLDER}"]`)).toBeVisible();
  await openDetails(page, PLACEHOLDER);
  save('detailPlaceholder', await detailFacts(page));
  await shootDetails(page, 'details-placeholder');
  await page.locator('#library-detail-close').click();

  // A PDF import.
  await page.locator('#library-search').fill('');
  await page.locator('#library-file').setInputFiles(PDF);
  const pdfRow = page.locator('#library-list .list-row[data-kind="pdf"]').first();
  await expect(pdfRow).toBeVisible({ timeout: 30_000 });
  const pdfId = (await pdfRow.getAttribute('data-item')) ?? '';
  await openDetails(page, pdfId);
  save('detailPdf', await detailFacts(page));
  await shootDetails(page, 'details-pdf');
  await page.locator('#library-detail-close').click();
});

test('item 8: a row reached with a letter jump, acted on through Details, keeps its place', async ({ page }) => {
  test.skip(PHASE !== 'after', 'the committed build has no door to act through');
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
  await page.locator('#library-filter-toggle').click();
  await page.locator('#library-sort').selectOption('title');
  await page.locator('#library-filter-toggle').click();
  const rail = page.locator('.list-with-rail .alpha-rail');
  await expect(rail).toBeVisible();
  await rail.locator('[data-letter="M"]').click();
  await page.waitForTimeout(400);
  await expect(page.locator('#library-count')).toContainText('showing');

  // The first song row eight or more rows into the window, put mid-screen.
  const id = await page.evaluate(() => {
    const rows = [...document.querySelectorAll<HTMLElement>('#library-list .list-row')];
    const chosen = rows.slice(8).find((row) => /song$/.test(row.querySelector('.list-row__meta')?.textContent ?? '') && row.querySelector('.library-openas') !== null && row.querySelector('.badge[data-project]') === null);
    chosen?.scrollIntoView({ block: 'center' });
    return chosen?.dataset.item ?? '';
  });
  expect(id).not.toBe('');
  await page.waitForTimeout(200);
  const place = (): Promise<unknown> =>
    page.evaluate((itemId) => {
      const row = document.querySelector<HTMLElement>(`#library-list .list-row[data-item="${CSS.escape(itemId)}"]`);
      const rows = [...document.querySelectorAll<HTMLElement>('#library-list .list-row')];
      const scrollers: { what: string; scrollTop: number }[] = [];
      for (let node = row?.parentElement ?? null; node; node = node.parentElement) {
        if (node.scrollHeight > node.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(node).overflowY)) scrollers.push({ what: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}.${node.className}`, scrollTop: Math.round(node.scrollTop) });
      }
      return {
        item: itemId,
        rowTop: row ? Math.round(row.getBoundingClientRect().top) : null,
        rowIndex: row ? rows.indexOf(row) : null,
        firstRow: rows[0]?.dataset.item,
        lastRow: rows[rows.length - 1]?.dataset.item,
        rowCount: rows.length,
        count: document.querySelector('#library-count')?.textContent,
        windowScrollY: Math.round(window.scrollY),
        documentScrollTop: Math.round(document.scrollingElement?.scrollTop ?? -1),
        scrollers,
        railHidden: (document.querySelector('.list-with-rail .alpha-rail') as HTMLElement | null)?.hidden,
      };
    }, id);
  const before = await place();
  save('item8Before', before);
  await shot(page, 'item8-letter-m-before');

  await openDetails(page, id);
  await page.locator('#library-detail-project').click();
  await expect(page.locator('#project-state')).toHaveText('Not a project yet');
  await page.locator('#project-action-save').click();
  await expect(page.locator('#project-state')).toHaveText(/^Saved for later since /);
  // The redraw behind the sheet: measured while the sheet is still up, then after Close.
  await expect(page.locator(`#library-list .list-row[data-item="${id}"] .badge[data-project]`)).toHaveText('Saved for later');
  save('item8UnderTheSheet', await place());
  await page.locator('#project-sheet-close').click();
  await expect(page.locator('#project-sheet')).toHaveCount(0);
  save('item8FocusAfterClose', await page.evaluate(() => {
    const active = document.activeElement;
    return { tag: active?.tagName.toLowerCase(), id: active?.id || undefined, className: (active as HTMLElement | null)?.className || undefined, text: (active?.textContent ?? '').trim().slice(0, 60), isBody: active === document.body, connected: active?.isConnected };
  }));
  save('item8After', await place());
  await shot(page, 'item8-letter-m-after');
});
