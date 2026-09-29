/**
 * G87's pictures (copied into app/tests/e2e/ for the run and removed after; never under docs/ —
 * written to the worktree's gitignored build/g87-pictures/<tag>/ and copied into
 * docs/prompts/pictures/g87/ by hand): at 342 × 740, in the app's stack,
 *
 *   - the project sheet over Progress for a piece being learned, the date box beside *I performed it*
 *     in view (the whole screen, and the actions row alone), light and dark;
 *   - the Stage 9 page (`classical.9`) and a Stage 1 page (`1.1`), their first screenful with Start;
 *   - item 3: the Stage 9 page with a paused project on the Ballade, its row in view, and the row alone;
 *
 * and `<tag>-facts.json`: the date box's and the goal box's computed look, and both pages' Start
 * lines with the Start block's HTML, so the after build's Stage 1 line can be compared byte for byte
 * with the before build's. `G87_TAG` names the build (`before`, `after`).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const TAG = process.env.G87_TAG ?? 'after';
const OUT = join(process.cwd(), '..', 'build', 'g87-pictures', TAG);
const ITEM = 'song.folk.hot-cross-buns';
const BALLADE = 'song.classical.chopin-ballade-1';

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

function today(): string {
  const now = new Date();
  return `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function look(page: Page, selector: string): Promise<Record<string, unknown>> {
  return page.locator(selector).evaluate((node) => {
    const s = getComputedStyle(node);
    const r = node.getBoundingClientRect();
    return {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      radius: s.borderTopLeftRadius,
      padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
      background: s.backgroundColor,
      color: s.color,
      box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
    };
  });
}

async function openSheet(page: Page): Promise<void> {
  await page.goto('/#/progress');
  await expect(page.locator('#progress-projects')).toHaveAttribute('data-drawn', 'true', { timeout: 30_000 });
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
      tx.objectStore('projects').put({ id: `file:${identity.sha256}`, material: identity, itemId: id, state: 'learning', since: at, history: [{ state: 'learning', at, why: 'learn' }] });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, ITEM);
  await page.reload();
  await page.locator(`#progress-projects [data-project][data-item="${ITEM}"]`).click();
  await expect(page.locator('#project-state')).toHaveText(`Learning since ${today()}`);
  await expect(page.locator('#project-performed-on')).toBeVisible();
  await expect(page.locator('#project-goal')).toBeVisible();
}

test('G87 pictures', async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  const facts: Record<string, unknown> = { tag: TAG };

  await openSheet(page);
  await page.screenshot({ path: join(OUT, `${TAG}-sheet-342x740.png`) });
  await page.locator('#project-actions').screenshot({ path: join(OUT, `${TAG}-sheet-actions-342x740.png`) });
  facts.date = await look(page, '#project-performed-on');
  facts.goal = await look(page, '#project-goal');
  facts.actionsHeight = await page.locator('#project-actions').evaluate((node) => Math.round(node.getBoundingClientRect().height));

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: join(OUT, `${TAG}-sheet-dark-342x740.png`) });
  await page.locator('#project-actions').screenshot({ path: join(OUT, `${TAG}-sheet-actions-dark-342x740.png`) });
  facts.dateDark = await look(page, '#project-performed-on');
  facts.goalDark = await look(page, '#project-goal');
  await page.emulateMedia({ colorScheme: 'light' });

  for (const [name, lesson] of [['stage9', 'classical.9'], ['stage1', '1.1']] as const) {
    await page.goto(`/#/lesson/${lesson}`);
    await expect(page.locator('[data-screen="lesson"]')).toHaveAttribute('data-lesson', lesson, { timeout: 60_000 });
    await expect(page.locator('#lesson-start-what')).toContainText('Opens');
    await page.screenshot({ path: join(OUT, `${TAG}-${name}-342x740.png`) });
    facts[name] = {
      startLine: await page.locator('#lesson-start-what').textContent(),
      startBlockHtml: await page.locator('#lesson-start-block').evaluate((node) => node.outerHTML),
      projectLine: await page.locator('#lesson-project').evaluate((node) => ((node as HTMLElement).hidden ? null : node.textContent)),
    };
  }

  // G87 item 3: a paused project's row on the Stage 9 page — its badge's words, style and mark.
  await page.evaluate(async (id) => {
    const catalog = (await (await fetch('content/catalog.json')).json()) as { id: string; provenance?: { identity?: { kind: string; sha256?: string } } }[];
    const identity = catalog.find((one) => one.id === id)?.provenance?.identity;
    if (identity?.kind !== 'file' || identity.sha256 === undefined) throw new Error(`${id} has no file identity`);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const learnt = new Date(Date.now() - 86_400_000).toISOString();
    const at = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      tx.objectStore('projects').put({
        id: `file:${identity.sha256}`,
        material: identity,
        itemId: id,
        state: 'paused',
        since: at,
        history: [{ state: 'learning', at: learnt, why: 'learn' }, { state: 'paused', at, why: 'pause' }],
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, BALLADE);
  await page.goto('/#/lesson/classical.9');
  await page.reload();
  const row = page.locator(`#lesson-songs [data-item="${BALLADE}"]`);
  await expect(row.locator('.badge')).toHaveText('Paused', { timeout: 60_000 });
  await row.scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(OUT, `${TAG}-stage9-paused-342x740.png`) });
  await row.screenshot({ path: join(OUT, `${TAG}-stage9-paused-row-342x740.png`) });
  facts.paused = await row.locator('.badge').evaluate((node) => ({
    text: node.textContent,
    kind: (node as HTMLElement).dataset.kind,
    mark: getComputedStyle(node, '::before').content,
    color: getComputedStyle(node).color,
  }));
  facts.notStarted = await page.locator('#lesson-songs [data-project-state="none"] .badge').first().evaluate((node) => ({
    text: node.textContent,
    kind: (node as HTMLElement).dataset.kind,
    mark: getComputedStyle(node, '::before').content,
    color: getComputedStyle(node).color,
  }));
  writeFileSync(join(OUT, `${TAG}-facts.json`), `${JSON.stringify(facts, null, 2)}\n`);
});
