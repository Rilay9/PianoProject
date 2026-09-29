/**
 * G85's draw timing, not a test: copied into `app/tests/e2e/` for its runs and removed. The committed
 * build and this tree's are timed alternately on the same port, so the machine's load falls on both:
 * a full `draw()` (the Type select's change handler draws synchronously: one dispatch, one draw) with no
 * project, one and forty, and the time from navigation to the first drawn count line (the load, which
 * now reads the projects store beside the catalogue). Writes `build/g85/timing/<G85_PHASE>-<G85_ROUND>.json`.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PHASE = process.env.G85_PHASE ?? 'unknown';
const ROUND = process.env.G85_ROUND ?? '0';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'build', 'g85', 'timing');

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
    // When the count line first names the whole list: the load's end, from navigation start.
    const watch = new MutationObserver(() => {
      const count = document.getElementById('library-count');
      if (count && /of \d+ items/.test(count.textContent ?? '') && (window as { __g85Drawn?: number }).__g85Drawn === undefined) {
        (window as { __g85Drawn?: number }).__g85Drawn = performance.now();
        watch.disconnect();
      }
    });
    document.addEventListener('DOMContentLoaded', () => watch.observe(document.body, { childList: true, subtree: true, characterData: true }));
  });
  mkdirSync(OUT, { recursive: true });
});

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? NaN;
};

async function seed(page: Page, count: number): Promise<number> {
  return page.evaluate(async (n) => {
    const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; type: string; provenance?: { identity?: { kind: string; sha256?: string } } }[];
    const songs = catalog.filter((one) => one.type === 'song' && one.provenance?.identity?.kind === 'file').slice(0, n);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const at = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      for (const one of songs) {
        const identity = one.provenance?.identity as { kind: string; sha256: string };
        tx.objectStore('projects').put({ id: `file:${identity.sha256}`, material: identity, itemId: one.id, state: 'learning', since: at, history: [{ state: 'learning', at, why: 'learn' }] });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
    return songs.length;
  }, count);
}

async function draws(page: Page): Promise<number> {
  await page.locator('#library-filter-toggle').click();
  const times = await page.evaluate(() => {
    const select = document.getElementById('library-type') as HTMLSelectElement;
    const out: number[] = [];
    for (let i = 0; i < 66; i += 1) {
      select.value = i % 2 === 0 ? 'song' : 'all';
      const start = performance.now();
      select.dispatchEvent(new Event('change'));
      if (i >= 6) out.push(performance.now() - start);
    }
    select.value = 'all';
    select.dispatchEvent(new Event('change'));
    return out;
  });
  await page.locator('#library-filter-toggle').click();
  return median(times);
}

async function loads(page: Page, rounds: number): Promise<number> {
  const out: number[] = [];
  for (let i = 0; i < rounds; i += 1) {
    await page.reload();
    await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
    out.push(await page.evaluate(() => (window as { __g85Drawn?: number }).__g85Drawn ?? NaN));
  }
  return median(out);
}

test('G85 draw timing', async ({ page }) => {
  test.setTimeout(240_000);
  const facts: Record<string, unknown> = { phase: PHASE, round: ROUND };
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 60_000 });
  facts.loadNone = await loads(page, 7);
  facts.drawNone = await draws(page);
  facts.seededOne = await seed(page, 1);
  facts.loadOne = await loads(page, 7);
  facts.drawOne = await draws(page);
  facts.seededForty = await seed(page, 40);
  facts.loadForty = await loads(page, 7);
  facts.drawForty = await draws(page);
  writeFileSync(path.join(OUT, `${PHASE}-${ROUND}.json`), `${JSON.stringify(facts, null, 2)}\n`);
});
