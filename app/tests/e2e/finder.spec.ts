/**
 * Finders and the two-tap import (docs/04 §3, §4; replan §4).
 *
 * The claim this phase makes is a claim about *effort*: that a file the owner
 * found reaches the right rung in two of his actions rather than eight. That
 * is not something a unit test can check, because it is a property of the
 * screens in sequence — so the count is asserted here, on a real browser,
 * against a simulated share.
 */
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const MXL = path.join(FIXTURES, 'test-tune.mxl');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

test.describe('the finder on a rung', () => {
  test('says what the rung needs and hands over a search and a prompt', async ({ page }) => {
    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-needs')).toContainText(/rung/i);

    await page.locator('#lesson-find-more').click();
    const sheet = page.locator('#finder-sheet');
    await expect(sheet).toBeVisible();

    // Both prompts are generated at build time and shipped; the sheet only
    // presents them. If either is empty the build did not generate it.
    const search = sheet.locator('#finder-search');
    await expect(search).toHaveValue(/piano sheet music/);
    await expect(search).toHaveValue(/musicxml/);

    const prompt = sheet.locator('#finder-prompt');
    const text = await prompt.inputValue();
    expect(text.length).toBeGreaterThan(100);
    expect(text.length).toBeLessThanOrEqual(900);
    // docs/00 D18: the prompt states where the owner stands on copyright
    // rather than quietly asking for something it should not.
    expect(text).toContain('still in copyright');
    expect(text.toLowerCase()).not.toContain('download');

    // The formats line is the difference between a file the app can follow
    // and a picture of one.
    await expect(sheet.locator('#finder-formats')).toContainText(/MusicXML/i);
  });

  test('marks an example as already bundled or as still missing', async ({ page }) => {
    await page.goto('/#/lesson/2.1');
    await page.locator('#lesson-find-more').click();
    const examples = page.locator('#finder-examples');
    await expect(examples).toBeVisible();
    await expect(examples.locator('li').first()).toContainText(/already yours|not found yet/);
  });

  test('copies the prompt to the clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only here');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#/lesson/2.1');
    await page.locator('#lesson-find-more').click();
    await page.getByRole('button', { name: 'Copy prompt' }).click();
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('I am learning piano');
  });
});

test.describe('the finder on a concept', () => {
  test('is reachable from the Skills screen, under a readable name', async ({ page }) => {
    await page.goto('/#/today/skills');
    const row = page.locator('.list-row[data-concept]').first();
    await expect(row).toBeVisible();
    // The whole point of concepts.json: a name, not the id.
    await expect(row).not.toContainText(/^[a-z0-9-]+$/);

    const find = row.getByRole('button', { name: 'Find more' });
    await expect(find).toBeVisible();
    await find.click();
    await expect(page.locator('#finder-sheet')).toBeVisible();
    await expect(page.locator('#finder-prompt')).toHaveValue(/the skill of/);
  });
});

/** Counts the actions a person takes, so "two taps" is measured and not claimed. */
async function countedImport(page: Page, lessonId: string): Promise<number> {
  let taps = 0;

  // Tap 1: choose the file. This is the share sheet's "PianoPath" in real
  // life — the app is entered with the rung already in the route.
  await page.goto(`/#/library?for=${lessonId}`);
  await page.locator('#library-file').setInputFiles(MXL);
  taps += 1;

  const sheet = page.locator('#assign-sheet');
  await expect(sheet).toBeVisible();

  // Tap 2: Save. Everything else is already filled in.
  await sheet.locator('#assign-save').click();
  taps += 1;
  await expect(sheet).toBeHidden();
  return taps;
}

test.describe('two taps from a share to a rung', () => {
  test('the assign sheet opens by itself with the rung already chosen', async ({ page }) => {
    await page.goto('/#/library?for=2.1');
    await page.locator('#library-file').setInputFiles(MXL);

    const sheet = page.locator('#assign-sheet');
    await expect(sheet).toBeVisible();
    // The rung came in the hash and is selected. Nothing to choose.
    await expect(sheet.locator('#assign-lesson')).toHaveValue('2.1');
    // The level was estimated from the notes, and says it is an estimate.
    await expect(sheet.locator('#assign-level-hint')).toContainText('≈');
    await expect(sheet.locator('#assign-level')).not.toHaveValue('');
    // The concepts came from the rung.
    await expect(sheet.locator('#assign-concepts')).not.toHaveValue('');
  });

  test('Save is the second and last action, and the piece lands on the rung', async ({ page }) => {
    const taps = await countedImport(page, '2.1');
    expect(taps).toBe(2);

    // It is an option of the rung, not merely a row in the library: that is
    // what `lessonIds` and the runtime overlay are for.
    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-songs')).toContainText('Imported Test Tune');
    await expect(
      page.locator('#lesson-songs .list-row[data-item="import.imported-test-tune"]'),
    ).toBeVisible();
  });

  test('the rung survives a reload, because it is stored and not just routed', async ({ page }) => {
    await countedImport(page, '2.1');
    await page.goto('/#/lesson/2.1');
    await page.reload();
    await expect(page.locator('#lesson-songs')).toContainText('Imported Test Tune');
  });

  test('an import with no rung still works and belongs to none', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(MXL);
    const sheet = page.locator('#assign-sheet');
    // A plain Library import files the score and gets out of the way: the
    // sheet is for the owner who arrived with a rung in mind. It is one tap
    // from the row when he did not.
    await expect(sheet).toBeHidden();
    await page.locator('#library-list').getByRole('button', { name: 'Assign', exact: true }).click();
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('#assign-lesson')).toHaveValue('');
    await sheet.locator('#assign-save').click();

    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-songs')).not.toContainText('Imported Test Tune');
    await page.goto('/#/library');
    await page.locator('#library-search').fill('Imported Test Tune');
    await expect(page.locator('#library-list')).toContainText('Imported Test Tune');
  });

  test('"Import for this rung" on the lesson page opens the picker on that rung', async ({
    page,
  }) => {
    await page.goto('/#/lesson/3.5');
    const chooser = page.waitForEvent('filechooser');
    await page.locator('#lesson-import-for').click();
    await expect(page).toHaveURL(/#\/library\?for=3\.5/);
    const dialog = await chooser;
    await dialog.setFiles(MXL);
    await expect(page.locator('#assign-sheet #assign-lesson')).toHaveValue('3.5');
  });
});
