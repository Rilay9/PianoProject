/**
 * G85 item 6, what the Stage 9 page shows (not G85's to change): `classical.9` at 342 × 740 with one
 * project (the Ballade, Preparing for performance) put in the store as `projects.spec.ts` puts it — the
 * rows, their badges, their actions. Not a test; copied into `app/tests/e2e/` for one run and removed.
 * Writes under the worktree's `build/g85/pictures/stage9/` only.
 */
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'build', 'g85', 'pictures', 'stage9');
const BALLADE = 'song.classical.chopin-ballade-1';

test.use({ viewport: { width: 342, height: 740 } });

test('G85 Stage 9 page picture', async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  await page.goto('/#/lesson/classical.9');
  await expect(page.locator('#lesson-project')).toBeVisible({ timeout: 60_000 });
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
      tx.objectStore('projects').put({ id: `file:${identity.sha256}`, material: identity, itemId: id, state: 'polishing', since: at, history: [{ state: 'polishing', at, why: 'polish' }] });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, BALLADE);
  await page.reload();
  const row = page.locator(`#lesson-songs [data-item="${BALLADE}"]`);
  await expect(row.locator('.badge')).toHaveText('Preparing for performance');
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'stage9-classical-9-ballade-polishing-342x740.png') });
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#lesson-songs [data-project-state]')].map((one) => ({
      item: one.dataset.item,
      state: one.dataset.projectState,
      badges: [...one.querySelectorAll('.badge')].map((badge) => `${badge.textContent ?? ''} (${(badge as HTMLElement).dataset.kind ?? ''})`),
      actions: [...one.querySelectorAll('.list-row__actions button')].map((button) => button.getAttribute('aria-label') ?? button.textContent),
    })),
  );
  writeFileSync(path.join(OUT, 'stage9-facts.json'), `${JSON.stringify(rows, null, 2)}\n`);
});
