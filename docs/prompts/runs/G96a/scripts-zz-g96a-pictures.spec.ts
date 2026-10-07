/**
 * G96a's picture and facts, not a test of the app: copied into `app/tests/e2e/` for its runs and removed
 * after. Writes under `app/build/g96a/pictures/<phase>/` only (a spec never writes under `docs/`); the
 * builder copies what is kept. `G96A_PHASE` names the build: `before` (the committed code) or `after`
 * (this tree).
 *
 * At 342 × 740: a PDF imported through the Library's picker (`two-systems.pdf`), its row's *Details*
 * opened; the sheet as it first appears, and its facts read from the DOM.
 */
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PHASE = process.env.G96A_PHASE ?? 'unknown';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'build', 'g96a', 'pictures', PHASE);
const PDF = path.join(HERE, '..', 'fixtures', 'imports', 'two-systems.pdf');

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

test('a PDF import’s Details at 342 × 740', async ({ page }) => {
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles(PDF);
  const row = page.locator('#library-list .list-row[data-item="import.two-systems"]');
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Details' }).click();
  const sheet = page.locator('#library-detail');
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(300);
  const facts = await page.evaluate(() => {
    const root = document.getElementById('library-detail');
    const terms = [...(root?.querySelectorAll('dt') ?? [])].map((dt) => [dt.textContent ?? '', dt.nextElementSibling?.textContent ?? '']);
    const paragraphs = [...(root?.querySelectorAll('.sheet__body > p') ?? [])].map((p) => p.textContent ?? '');
    const panel = root?.querySelector('.sheet__panel');
    const box = panel?.getBoundingClientRect();
    return {
      facts: terms,
      paragraphs,
      panelFitsViewport: box ? box.top >= 0 && box.bottom <= window.innerHeight : null,
      panelScrolls: panel ? panel.scrollHeight > panel.clientHeight : null,
    };
  });
  writeFileSync(path.join(OUT, `${PHASE}-facts.json`), JSON.stringify({ phase: PHASE, ...facts }, null, 2));
  await page.screenshot({ path: path.join(OUT, `${PHASE}-pdf-details-342x740.png`) });
});
