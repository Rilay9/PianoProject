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
 *
 * Revised (C5): the piece is opened for its rung (`?rung=1.1`, as the lesson
 * page and Today's card open it), and after the run the rung's own page says
 * what the evidence counts for it — the song requirement met by this run, the
 * exercise one not yet, the rung in progress and not complete (`04` §3f). It
 * opened the score with no rung, which since C5 counts for none.
 */
import { expect, test } from '@playwright/test';

import { playInTime } from './fixtures/playInTime';
import { setTempoPercent, withScoreMenu } from './scoreControls';

const ITEM = 'song.folk.hot-cross-buns';
/** Hot Cross Buns, right hand: E D C, E D C, C C C C, D D D D, E D C. */
const MELODY = [64, 62, 60, 64, 62, 60, 60, 60, 60, 60, 62, 62, 62, 62, 64, 62, 60];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      // A cleared origin is a first launch, and a first launch is the setup
      // tour (docs/04 §7d); this spec is about what comes after it.
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      // Every explain-it-once card counts as seen, for the same reason the
      // tour counts as skipped: this spec is not about meeting them
      // (`04` §5f, `help-strip.spec.ts` is the one that drives them).
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

test('a run played from Today is recorded, and comes back for review', async ({ page }) => {
  test.setTimeout(180_000);

  // 1. Today offers a card; open the piece directly so the test is about the
  //    loop rather than about which item the builder happened to pick.
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible();
  await expect(page.locator('#today-goal')).toContainText('0 / 150 min this week');

  // 2. Play it through the on-screen keyboard — a real InputSource — in Keep
  //    tempo, in time. Revised 2026-09-25 (T37): this played it in Wait for me
  //    and expected a pass, and a Wait run passed only because the tempo
  //    slider's number was compared with the floor as if somebody had played
  //    to it. A pass is played in Keep tempo, so that is what this plays.
  await page.goto(`/#/score/${ITEM}?rung=1.1`);
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await withScoreMenu(page, async () => {
    await page.locator('#score-input').selectOption('keys');
  });
  await page.locator('#score-mode').selectOption('tempo');
  await page.locator('#score-hands-R').click();
  await setTempoPercent(page, 100);
  await page.locator('#score-play').click();
  expect(await playInTime(page, 'keys')).toBeGreaterThanOrEqual(MELODY.length);

  const sheet = page.locator('#score-summary');
  await expect(sheet).toBeVisible({ timeout: 60_000 });
  await expect(sheet.locator('h2')).toHaveText(/Passed|Mastery run 1 of 2/, { timeout: 30_000 });

  // 3. Progress has it: a session row, a pass, and minutes on today's cell.
  await page.goto('/#/progress');
  await expect(page.locator('#progress-history')).toContainText('Hot Cross Buns');
  await expect(page.locator('#progress-totals')).toContainText('1 passed');

  // 3a. The rung's page reads the evidence (C5): the run counts for 1.1's
  //     song requirement, the exercise one is still open, so the rung is in
  //     progress — one of two, and not complete.
  await page.goto('/#/lesson/1.1');
  await expect(page.locator('#lesson-state')).toContainText('in progress', { timeout: 15_000 });
  const counts = page.locator('#lesson-counts');
  await expect(counts.locator('summary')).toContainText('What the app counts — 1 of 2');
  await counts.locator('summary').click();
  await expect(counts.locator('li[data-holds="true"]')).toContainText('Hot Cross Buns');
  await expect(counts.locator('li[data-holds="false"]')).toHaveCount(1);

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
