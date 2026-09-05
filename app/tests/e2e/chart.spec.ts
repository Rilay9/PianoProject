/**
 * Chord-chart view (docs/04 §3b) and the tablet breakpoint (§7a).
 *
 * The chart is the view for playing *from chords*, where notation is not the
 * point: big symbols per bar, a form tracker, a count-off, a comp loop and a
 * swing toggle. Its one judgement is whether what you play agrees with the
 * bar's chord — there is no accuracy score, because a chart says what harmony
 * to play and nothing about which notes.
 */
import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MXL = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'fixtures',
  'imports',
  'test-tune.mxl',
);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
});

test.describe('chord chart', () => {
  test('reads the chord symbols out of an imported score', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MXL);
    await expect(page.locator('.list-row[data-item="import.imported-test-tune"]')).toBeVisible();

    await page.goto('/#/chart/import.imported-test-tune');
    await expect(page.locator('.screen h1')).toHaveText('Imported Test Tune');
    await expect(page.locator('.chart-cell[data-bar="1"]')).toHaveText('C');
    await expect(page.locator('.chart-cell[data-bar="2"]')).toHaveText('G7');
    await expect(page.locator('#chart-form')).toContainText('Bar 1 of 2 · chorus 1');
  });

  test('says so plainly when a score has no chords in it', async ({ page }) => {
    await page.goto('/#/chart/song.folk.hot-cross-buns');
    await expect(page.locator('#chart-status')).toContainText('no chord symbols', {
      timeout: 15_000,
    });
  });

  test('offers swing and comp toggles', async ({ page }) => {
    await page.goto('/#/chart/song.folk.hot-cross-buns');
    await page.locator('#chart-swing').click();
    await expect(page.locator('#chart-swing')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#chart-status')).toContainText('click stays straight');
    await page.locator('#chart-comp').click();
    await expect(page.locator('#chart-comp')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('tablet layout (docs/04 §7a)', () => {
  test.use({ viewport: { width: 1024, height: 1000 } });

  test('the browsing lists become two columns', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();
    const columns = await page
      .locator('#library-list')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(2);
  });
});

test.describe('phone layout', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('stays one column and never scrolls sideways', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
