/**
 * The PDF viewer (docs/04 §5b).
 *
 * Two things here are not optional in the spec and so are not optional in the
 * tests: **stepping one system at a time**, which is the entire reason the
 * viewer exists, and **adjust cuts surviving a reload**, because system
 * detection assumes a clean typeset page and without a durable correction one
 * bad detection makes a bought PDF useless.
 */
import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PDF = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'fixtures',
  'imports',
  'two-systems.pdf',
);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

async function importPdf(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/#/library');
  await page.locator('#library-file').setInputFiles(PDF);
  await expect(page.locator('.list-row[data-item="import.two-systems"]')).toBeVisible();
  await page.goto('/#/pdf/import.two-systems');
  // Rendering the page and running the detector over it takes a moment.
  await expect(page.locator('#pdf-label')).toContainText('system', { timeout: 30_000 });
}

test.describe('PDF viewer', () => {
  test('finds the two systems on the fixture page and steps between them', async ({ page }) => {
    await importPdf(page);
    await expect(page.locator('#pdf-label')).toContainText('Page 1 · system 1  (1/2)');
    // The next system is shown greyed underneath, so the eye has somewhere to go.
    await expect(page.locator('#pdf-next')).toBeVisible();

    await page.locator('#pdf-next-system').click();
    await expect(page.locator('#pdf-label')).toContainText('system 2  (2/2)');
    await page.locator('#pdf-prev').click();
    await expect(page.locator('#pdf-label')).toContainText('system 1  (1/2)');
  });

  test('tapping the right half of the page goes forward, the left half back', async ({ page }) => {
    await importPdf(page);
    const stage = page.locator('#pdf-stage');
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box as { x: number; y: number; width: number; height: number };

    await page.mouse.click(x + width * 0.8, y + height * 0.4);
    await expect(page.locator('#pdf-label')).toContainText('system 2');
    await page.mouse.click(x + width * 0.2, y + height * 0.4);
    await expect(page.locator('#pdf-label')).toContainText('system 1');
  });

  test('offers manual, timed and loop, and hides Wait, mic and MIDI follow', async ({ page }) => {
    await importPdf(page);
    for (const mode of ['manual', 'timed', 'loop']) {
      await expect(page.locator(`#pdf-mode-${mode}`)).toBeVisible();
    }
    await page.locator('#pdf-mode-timed').click();
    await expect(page.locator('[data-screen="pdf"]')).toHaveAttribute('data-mode', 'timed');

    // Hidden, not disabled: a PDF has no notes to match (docs/04 §5b).
    await expect(page.locator('#score-input')).toHaveCount(0);
    await expect(page.locator('#score-mode')).toHaveCount(0);
    await expect(page.locator('.keyboard-strip')).toHaveCount(0);
  });

  test('a corrected cut line is stored with the score and survives a reload', async ({ page }) => {
    await importPdf(page);
    await page.locator('#pdf-adjust-toggle').click();
    await expect(page.locator('#pdf-adjust')).toBeVisible();
    await expect(page.locator('#pdf-adjust-label')).toContainText('2 systems');

    // Adding a system is a correction like any other, and the one that matters
    // most: a missed system is the failure the detector actually makes.
    await page.locator('#pdf-adjust-add').click();
    await expect(page.locator('#pdf-adjust-label')).toContainText('3 systems');

    await page.locator('#pdf-adjust-save').click();
    await expect(page.locator('#pdf-status')).toContainText('Cuts saved');
    await expect(page.locator('#pdf-label')).toContainText('(1/3)');

    await page.reload();
    await expect(page.locator('#pdf-label')).toContainText('(1/3)', { timeout: 30_000 });
  });

  test('dragging a cut line moves it and keeps the systems in order', async ({ page }) => {
    await importPdf(page);
    await page.locator('#pdf-adjust-toggle').click();
    const handle = page.locator('.pdf-cut[data-cut="0"]');
    await expect(handle).toBeVisible();
    const before = await handle.evaluate((el) => (el as HTMLElement).style.top);

    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width } = box as { x: number; y: number; width: number };
    await page.mouse.move(x + width / 2, y + 22);
    await page.mouse.down();
    await page.mouse.move(x + width / 2, y + 60, { steps: 5 });
    await page.mouse.up();

    await expect
      .poll(async () => handle.evaluate((el) => (el as HTMLElement).style.top))
      .not.toBe(before);
  });
});
