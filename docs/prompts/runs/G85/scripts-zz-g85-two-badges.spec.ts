/**
 * G85: the longest badge line a song row can now carry at 342 × 740 — a pass (*✓ passed*) and the
 * longest state (*Preparing for performance*) — and an import's (*yours* beside the state). Measured
 * and pictured, on this tree's build only. Not a test; copied into `app/tests/e2e/` for one run and
 * removed. Writes under the worktree's `build/g85/pictures/badges/` only.
 */
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'build', 'g85', 'pictures', 'badges');
const ITEM = 'song.folk.hot-cross-buns';

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

test('G85 two badges on a row', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
  await page.evaluate(async (id) => {
    const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; provenance?: { identity?: { kind: string; sha256?: string } } }[];
    const identity = catalog.find((one) => one.id === id)?.provenance?.identity as { kind: string; sha256: string };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const at = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['projects', 'progress'], 'readwrite');
      tx.objectStore('projects').put({ id: `file:${identity.sha256}`, material: identity, itemId: id, state: 'polishing', since: at, history: [{ state: 'polishing', at, why: 'polish' }] });
      tx.objectStore('progress').put({ itemId: id, status: 'passed', bestAccuracy: 0.97, bestTempoPct: 100, attempts: 2, lastPracticedAt: at, minutes: 4, passedOn: [at.slice(0, 10)] });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, ITEM);
  await page.reload();
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
  await page.locator('#library-search').fill('hot cross');
  const row = page.locator(`#library-list .list-row[data-item="${ITEM}"]`);
  await expect(row.locator('.badge[data-project]')).toHaveText('Preparing for performance');
  await page.waitForTimeout(300);
  await row.screenshot({ path: path.join(OUT, 'row-passed-and-preparing-342x740.png') });
  const facts = await row.evaluate((node) => {
    const line = node.querySelector<HTMLElement>('.list-row__badges');
    const badges = [...(line?.querySelectorAll<HTMLElement>('.badge') ?? [])].map((badge) => {
      const box = badge.getBoundingClientRect();
      const lineBox = line?.getBoundingClientRect();
      return { text: badge.textContent, kind: badge.dataset.kind, top: Math.round(box.top - (lineBox?.top ?? 0)), right: Math.round(box.right), lineRight: Math.round(lineBox?.right ?? 0) };
    });
    return { rowHeight: Math.round(node.getBoundingClientRect().height), badges, lineHeight: Math.round(line?.getBoundingClientRect().height ?? 0) };
  });
  writeFileSync(path.join(OUT, 'two-badges-facts.json'), `${JSON.stringify(facts, null, 2)}\n`);
});
