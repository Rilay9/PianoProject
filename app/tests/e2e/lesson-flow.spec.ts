/**
 * The P7 acceptance criterion, end to end and through the real UI:
 *
 *   Today → Score → play it on the screen keys → summary → progress recorded
 *   → the item comes back in the review queue.
 *
 * Every other test in this suite checks one seam. This one checks that the
 * seams are actually joined: the Score screen writes to IndexedDB, Progress
 * reads it back, and the review intervals in curriculum Part G put the item
 * on Today's card again. Nothing here is seeded — the only clock trick is
 * moving the recorded pass back two days, because waiting two days is not a
 * test.
 */
import { expect, test, type Page } from '@playwright/test';

const ITEM = 'song.folk.hot-cross-buns';
/** Hot Cross Buns, right hand: E D C, E D C, C C C C, D D D D, E D C. */
const MELODY = [64, 62, 60, 64, 62, 60, 60, 60, 60, 60, 62, 62, 62, 62, 64, 62, 60];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
});

async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${midi}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

test('a run played from Today is recorded, and comes back for review', async ({ page }) => {
  test.setTimeout(180_000);

  // 1. Today offers a card; open the piece directly so the test is about the
  //    loop rather than about which item the builder happened to pick.
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible();
  await expect(page.locator('#today-goal')).toContainText('0 of 150 minutes this week');

  // 2. Play it through the on-screen keyboard — a real InputSource.
  await page.goto(`/#/score/${ITEM}`);
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await page.locator('#score-input').selectOption('keys');
  await page.locator('#score-mode').selectOption('wait');
  await page.locator('#score-hands-R').click();
  await page.locator('#score-tempo').fill('100');
  await page.locator('#score-play').click();
  for (const midi of MELODY) await press(page, midi);

  const sheet = page.locator('#score-summary');
  await expect(sheet).toBeVisible({ timeout: 30_000 });
  await expect(sheet).toContainText('Passed');

  // 3. Progress has it: a session row, a pass, and minutes on today's cell.
  await page.goto('/#/progress');
  await expect(page.locator('#progress-history')).toContainText('Hot Cross Buns');
  await expect(page.locator('#progress-totals')).toContainText('1 passed');

  // 4. Two days later it is due again (docs/02 Part G: 1, 3, 7, 21 days).
  await page.evaluate(async () => {
    const request = indexedDB.open('pianopath');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('progress', 'readwrite');
      const store = tx.objectStore('progress');
      const read = store.get('song.folk.hot-cross-buns');
      read.onsuccess = () => {
        const row = read.result as { passedOn: string[]; lastPracticedAt: string };
        row.passedOn = [twoDaysAgo.slice(0, 10)];
        row.lastPracticedAt = twoDaysAgo;
        store.put(row);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  });

  await page.goto('/#/today');
  await page.reload();
  const review = page.locator('.list-row[data-slot="review"]');
  await expect(review).toContainText('Hot Cross Buns');
  await expect(review).toContainText('Due for review today');
});
