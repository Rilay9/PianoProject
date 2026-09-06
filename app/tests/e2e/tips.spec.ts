/**
 * Drill tips and the practice module (replan §6, §8).
 *
 * The parts worth checking in a browser: that the right file is chosen for a
 * drill's parameters, that the block is open the first time and collapsed
 * after, and that the practice lessons are reachable and are real rungs rather
 * than a reading list.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      // The "seen this kind" flags live here, and a stale one would make the
      // "open the first time" test pass for the wrong reason.
      localStorage.clear();
    }
  });
});

test.describe('the tips block', () => {
  test('shows the four sections under the prompt', async ({ page }) => {
    await page.goto('/#/drill/drill.reading.note-flash-treble-c4-g4');
    const tips = page.locator('#drill-tips');
    await expect(tips).toBeVisible();
    await expect(tips.locator('#drill-tips-summary')).toHaveText('Tips');

    const body = tips.locator('#drill-tips-body');
    for (const heading of [
      "What it's for",
      'How to practise it',
      'Common mistake',
      "How you'll know you've got it",
    ]) {
      await expect(body).toContainText(heading);
    }
  });

  test('is open the first time a kind is met and collapsed after', async ({ page }) => {
    await page.goto('/#/drill/drill.reading.note-flash-treble-c4-g4');
    // The first run is when the advice is worth reading.
    await expect(page.locator('#drill-tips')).toHaveJSProperty('open', true);

    await page.reload();
    // The twentieth is when a block of text between the prompt and the
    // keyboard is in the way.
    await expect(page.locator('#drill-tips')).toHaveJSProperty('open', false);
  });

  test('chooses a variant from the drill’s parameters', async ({ page }) => {
    // The bass-clef drill gets the bass-clef file, which says something the
    // general one does not.
    await page.goto('/#/drill/drill.reading.note-flash-bass-f2-c4');
    const body = page.locator('#drill-tips-body');
    await expect(body).toContainText('bass F on the fourth line');
    await expect(body).not.toContainText('groups of two and three black keys');
  });

  test('falls back to the kind when no variant matches', async ({ page }) => {
    await page.goto('/#/drill/drill.reading.note-flash-treble-c4-g4');
    await expect(page.locator('#drill-tips-body')).toContainText('Counting up from middle C');
  });
});

test.describe('the practice module', () => {
  test('is reachable from Today', async ({ page }) => {
    await page.goto('/#/today');
    await page.locator('#today-practice').click();
    await expect(page).toHaveURL(/#\/lesson\/practice\.1/);
    await expect(page.locator('[data-screen="lesson"]')).toContainText('Chunking');
  });

  test('every lesson is a real rung with options, not a reading list', async ({ page }) => {
    for (const id of ['practice.1', 'practice.2', 'practice.3', 'practice.4', 'practice.5']) {
      await page.goto(`/#/lesson/${id}`);
      await expect(page.locator('#lesson-exercises .list-row')).not.toHaveCount(0);
      // And it carries its own text, so the lesson body actually loaded.
      await expect(page.locator('#lesson-text')).not.toBeEmpty();
    }
  });

  test('the plateau lesson says what to change', async ({ page }) => {
    await page.goto('/#/lesson/practice.5');
    const text = page.locator('#lesson-text');
    await expect(text).toContainText('the tempo');
    await expect(text).toContainText('the key');
    await expect(text).toContainText('the order');
  });

  test('the injury lesson says to stop', async ({ page }) => {
    await page.goto('/#/lesson/practice.4');
    await expect(page.locator('#lesson-text')).toContainText('Stop');
    await expect(page.locator('#lesson-text')).toContainText('doctor');
  });
});
