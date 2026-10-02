/**
 * A piece paused after *Start session* leaves the running session at its turn (G90; the reviewer's ruling,
 * `docs/review/responses/d59f2ef8.md` question 2), and a lesson opens without its id in the heading (T20).
 *
 * The walk, through the real stores at the owner's width: the learner on 2.2 whose Ode to Joy was passed
 * twenty days ago (the G1d seed), so the card's review row is *Keeping this piece playable*. They press
 * *Start session*, and while the first activity is under way they open Progress and pause the piece on its
 * sheet. Back on Today the running card is still the composition they started (the piece waits where it was:
 * nothing is rebuilt); they finish the first activity, and at the piece's turn the transition says it is
 * skipped and why and offers the one after; Today's row for it says skipped, its *Continue* line names the one
 * after, and the stored run holds the skip with the same words.
 *
 * Pictures at 342 × 740 under Playwright's own output folder (`test-results/pictures/g90/`, ignored). Nothing
 * here is heard: the runs are the keyboard strip's taps, and whether the music sounds right is not touched.
 *
 * T20: the lesson page's heading while the curriculum is still being fetched. The fetch is held back by the
 * test, so the heading is read in the one state the screen has no lesson to name: it says a word, never the
 * lesson's id.
 */
import { expect, test, type Page } from '@playwright/test';
import { playInTime } from './fixtures/playInTime';
import { pressControl } from './scoreControls';

const PICTURES = 'test-results/pictures/g90';
const ODE = 'song.classical.ode-to-joy.ht';

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
      localStorage.setItem(
        'pianopath.settings',
        JSON.stringify({ inputPriority: ['keys'], defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo', defaultTempoPct: 100, weekdaySessionMinutes: 30, weekendSessionMinutes: 30 }),
      );
    }
  });
});

/** Rows put straight into the app's stores, in one transaction, once the app has opened its database. */
async function putRows(page: Page, stores: Record<string, unknown[]>): Promise<void> {
  await page.evaluate(async (rows) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [name, list] of Object.entries(rows)) for (const row of list) tx.objectStore(name).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(String(tx.error)));
    });
    db.close();
  }, stores);
}

interface StoredRun {
  current: number | null;
  closed?: { why: string };
  activities: { index: number; state: string; token: string; slot: { itemId: string; title: string; claim?: { kind: string } }; adaptations: { kind: string; why: string }[] }[];
}

/** Today's stored session, read straight from IndexedDB: the record under the runner's one key. */
async function storedRun(page: Page): Promise<StoredRun> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction('settings', 'readonly').objectStore('settings').get('pianopath.sessionRun');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(String(request.error)));
    });
    db.close();
    return value as StoredRun;
  });
}

/** The learner on 2.2 with Ode to Joy passed twenty days ago and not played since (the G1d seed). */
async function seedLearner(page: Page): Promise<void> {
  const day = 86_400_000;
  const yesterday = new Date(Date.now() - day).toISOString();
  const long = new Date(Date.now() - 20 * day).toISOString();
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 60_000 });
  await putRows(page, {
    plan: [{ id: 'current', stage: 1, unitId: '2.2', trackOrder: ['core'], placement: { unitId: '2.2', at: new Date().toISOString() } }],
    sessions: [
      { itemId: 'drill.rhythm.eighths', lessonId: '2.2', mode: 'drill:rhythm', tempoPct: 100, tempoMeasured: false, accuracy: 0.97, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: yesterday },
      { itemId: ODE, lessonId: '2.1', mode: 'tempo', tempoPct: 100, tempoMeasured: true, accuracy: 0.95, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 120_000, at: long },
    ],
    progress: [
      { itemId: 'drill.rhythm.eighths', status: 'passed', bestAccuracy: 0.97, bestTempoPct: 0, attempts: 1, lastPracticedAt: yesterday, minutes: 2, passedOn: [yesterday.slice(0, 10)] },
      { itemId: ODE, status: 'passed', bestAccuracy: 0.95, bestTempoPct: 100, attempts: 1, lastPracticedAt: long, minutes: 2, passedOn: [long.slice(0, 10)] },
    ],
  });
  await page.goto('/#/today');
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
  await expect(page.locator('#today-card .list-row[data-slot="review"]')).toHaveAttribute('data-claim', 'piece-retention', { timeout: 30_000 });
}

/** Ends a drill early, or plays a score through in time, and waits for the transition either leaves. */
async function finishCurrentActivity(page: Page): Promise<void> {
  if (new URL(page.url()).hash.startsWith('#/drill/')) {
    await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', { timeout: 60_000 });
    await page.locator('#drill-end').click();
  } else {
    const screen = page.locator('section[data-screen="score"]');
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
    await expect(screen).toHaveAttribute('data-mode', 'tempo', { timeout: 60_000 });
    await pressControl(page, '#score-play');
    await expect(screen).toHaveAttribute('data-running', 'true', { timeout: 30_000 });
    await playInTime(page, 'keys');
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
  }
  await expect(page.locator('#session-next')).toBeVisible({ timeout: 60_000 });
}

test('a piece paused on its sheet after Start session: the running card keeps it until its turn, then the transition steps past it, said; Today and the record agree (G90)', async ({ page }) => {
  test.setTimeout(240_000);
  await seedLearner(page);
  const review = page.locator('#today-card .list-row[data-slot="review"]');
  await expect(review.locator('.list-row__title')).toContainText('Ode to Joy');
  await expect(review.locator('.list-row__sub')).toHaveText(/^Keeping this piece playable — last played on \d+ \w+$/);

  // Start session: the first activity opens with its token.
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/session=[0-9a-z]+/, { timeout: 30_000 });
  const started = await storedRun(page);
  const at = started.activities.findIndex((one) => one.slot.itemId === ODE);
  expect(at, 'Ode to Joy is not an activity of the running session').toBeGreaterThan(0);
  const ode = started.activities[at];
  const after = started.activities[at + 1];
  expect(ode?.slot.claim, 'a composed activity carries the claim that chose it').toBeDefined();
  expect(after, 'nothing follows the piece in this session').toBeDefined();

  // While the first activity is under way, the learner pauses the piece on its sheet (Progress → its project).
  await page.goto('/#/progress');
  await page.locator(`#progress-projects [data-offer][data-item="${ODE}"]`).getByRole('button', { name: 'Make it a project' }).click();
  await page.locator('#project-action-keep').click();
  await expect(page.locator('#project-state')).toHaveText(/^Keeping it playable since /);
  await page.locator('#project-action-pause').click();
  await expect(page.locator('#project-state')).toHaveText(/^Paused since /);
  await page.locator('#project-sheet-close').click();

  // Back on Today: the card is the session's, as started — the piece still waits, pending, where it was.
  await page.goto('/#/today');
  const row = page.locator(`#today-card [data-activity="${String(at)}"]`);
  await expect(row).toHaveAttribute('data-state', 'pending', { timeout: 30_000 });
  await expect(row.locator('.list-row__sub')).toContainText('Keeping this piece playable');
  await page.screenshot({ path: `${PICTURES}/today-after-the-pause-342x740.png` });

  // Continue the first activity and finish it: the piece's turn comes with the transition.
  await page.locator('#today-continue').click();
  await expect(page).toHaveURL(/session=[0-9a-z]+/, { timeout: 30_000 });
  await finishCurrentActivity(page);
  // The activities between the first and the piece (if any) are walked on to its turn.
  for (let guard = 0; guard < 6; guard += 1) {
    const next = page.locator('#session-next');
    const nextItem = await next.getAttribute('data-session-next-item');
    if (nextItem === null || nextItem === after?.slot.itemId) break;
    expect(nextItem, 'the paused piece was offered at its turn').not.toBe(ODE);
    await page.locator('#session-start-next').click();
    await expect(page).toHaveURL(/session=[0-9a-z]+/, { timeout: 30_000 });
    await finishCurrentActivity(page);
  }
  const next = page.locator('#session-next');
  await expect(next).toHaveAttribute('data-session-next-item', after?.slot.itemId ?? '', { timeout: 30_000 });
  await expect(next.locator('.session-next__note')).toHaveText(`${ode?.slot.title ?? ''} is skipped — you paused it`);
  await expect(next).not.toContainText('Keeping this piece playable');
  await next.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${PICTURES}/transition-steps-past-342x740.png` });

  // The record says what the screen said, and nothing else changed: the composition is the one that started.
  const record = await storedRun(page);
  expect(record.activities[at]).toMatchObject({ state: 'skipped', adaptations: [{ why: `${ode?.slot.title ?? ''} is skipped — you paused it` }] });
  expect(record.activities.map((one) => one.slot.itemId)).toEqual(started.activities.map((one) => one.slot.itemId));
  // The learner has not moved on yet (an activity stopped early is still the cursor's); Start opens the one after.
  expect(record.current).not.toBe(at);
  await page.locator('#session-start-next').click();
  await expect(page).toHaveURL(new RegExp(`${(after?.slot.itemId ?? '').replace(/\./g, '\\.')}.*session=[0-9a-z]+`), { timeout: 30_000 });
  expect((await storedRun(page)).current).toBe(at + 1);

  // Today agrees: the row skipped, the Continue line naming the one after.
  await page.goto('/#/today');
  const skipped = page.locator(`#today-card [data-activity="${String(at)}"]`);
  await expect(skipped).toHaveAttribute('data-state', 'skipped', { timeout: 30_000 });
  await expect(skipped.locator('.list-row__badges')).toContainText('skipped');
  await expect(page.locator('#today-continue-line')).toContainText(`next: ${after?.slot.title ?? ''}`);
  await page.screenshot({ path: `${PICTURES}/today-skipped-row-342x740.png` });
});

test.describe('the lesson page before its curriculum arrives (T20)', () => {
  // A service worker would answer the held fetch itself; the test holds the network's.
  test.use({ serviceWorkers: 'block' });

  test('the heading says a word while the lesson is unknown, never the lesson’s id, and names the lesson once it is known', async ({ page }) => {
    const lesson = 'classical.3';
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/content/curriculum.json', async (route) => {
      await held;
      await route.continue();
    });
    await page.goto(`/#/lesson/${lesson}`);
    const screen = page.locator('section[data-screen="lesson"]');
    await expect(screen).toBeVisible({ timeout: 30_000 });
    const heading = screen.locator('h1');
    await expect(heading).toHaveText(/\S/);
    await expect(heading).not.toContainText(lesson);
    await expect(screen).not.toContainText(lesson);
    await page.screenshot({ path: `${PICTURES}/lesson-heading-while-loading-342x740.png` });
    // The curriculum arrives: the heading is the lesson's title.
    release();
    await expect(screen).toHaveAttribute('data-lesson', lesson, { timeout: 30_000 });
    await expect(heading).toHaveText(/\S/);
    await expect(heading).not.toContainText(lesson);
    expect((await heading.innerText()).trim().length, 'the interim word is still there').toBeGreaterThan('Lesson'.length);
  });
});
