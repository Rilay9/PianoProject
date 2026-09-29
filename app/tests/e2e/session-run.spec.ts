/**
 * Today's session, run, on the glass at the owner's width (X1; Part 18; `04` §2 and §5).
 *
 * A learner placed at 1.1 presses *Start session* and goes through the lesson without Today in between:
 * two drills ended early, each end sheet's closing action the next step with the composition's words; a
 * piece played in time, its summary's closing action the next step; the app reloaded in the middle of the
 * last activity, and Today offering *Continue today's session* with where it is; the last activity played,
 * *Done*, and the finish line. Then the noon-and-evening case through the session's recheck (Part 27): the
 * reading slot's phrase heard at noon from the card, the session started in the evening, and its reading
 * activity repurposed with the reason said on the transition.
 *
 * Pictures at 342 × 740 and 768 × 1024 under Playwright's own output folder (`test-results/pictures/x1/`,
 * ignored): the record's pictures under `docs/prompts/pictures/x1/` were captured once at the landing and
 * a committed spec never writes under `docs/` (U97: this spec overwrote them on every run). Nothing here
 * is heard: the runs are the keyboard strip's taps, and whether the music sounds right is not touched.
 *
 * U96: the session's end sheets say only what was measured. A drill ended before any answer is headed *Not
 * measured* with the reason and prints no *Accuracy* (X1's follow-up 2); the placement test ended in a session
 * has one filled box, the transition's *Start*, with its own *Start here* outlined (follow-up 4). Pictures under
 * `test-results/pictures/u96/`.
 */
import { expect, test, type Page } from '@playwright/test';
import { playInTime } from './fixtures/playInTime';
import { pressControl } from './scoreControls';

const PICTURES = 'test-results/pictures/x1';
const U96_PICTURES = 'test-results/pictures/u96';

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      localStorage.setItem('pianopath.firstSight', '["*"]');
      // The screen keys as the input, Keep tempo at the written tempo, and the thirty-minute card: a run
      // played through the strip in time is a measured pass, as `lesson-flow.spec.ts` plays one.
      localStorage.setItem(
        'pianopath.settings',
        JSON.stringify({ inputPriority: ['keys'], defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo', defaultTempoPct: 100, weekdaySessionMinutes: 30, weekendSessionMinutes: 30 }),
      );
    }
  });
});

/** Places the learner at a rung through the app's own backup import, and reloads (`today.spec.ts`'s way). */
async function placeAt(page: Page, rung: string): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 60_000 });
  await page.evaluate(async (at) => {
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    await hooks.importAll({
      app: 'pianopath',
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: { plan: [{ id: 'current', stage: 1, unitId: at, trackOrder: ['core'], placement: { unitId: at, at: new Date().toISOString() } }] },
    });
  }, rung);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', /./, { timeout: 30_000 });
  await expect(page.locator('#today-card [data-item]').first()).toBeVisible({ timeout: 30_000 });
}

const sessionOf = (url: string): string | null => new URL(url).hash.match(/[?&]session=([0-9a-z]+)/)?.[1] ?? null;

/** Ends a drill early and waits for its end sheet's transition. */
async function endDrill(page: Page): Promise<void> {
  await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', { timeout: 60_000 });
  await page.locator('#drill-end').click();
  await expect(page.locator('#session-next')).toBeVisible({ timeout: 30_000 });
}

/** Plays the open score through, in time, and waits for its summary. */
async function playThrough(page: Page): Promise<void> {
  const screen = page.locator('section[data-screen="score"]');
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
  await expect(screen).toHaveAttribute('data-mode', 'tempo', { timeout: 60_000 });
  await pressControl(page, '#score-play');
  await expect(screen).toHaveAttribute('data-running', 'true', { timeout: 30_000 });
  await playInTime(page, 'keys');
  await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
}

test('a session run through its activities: the transition after each, Continue after a reload, and the finish line', async ({ page }) => {
  test.setTimeout(300_000);
  await placeAt(page, '1.1');
  const card = await page.locator('#today-card [data-item]').evaluateAll((rows) => rows.map((row) => [row.getAttribute('data-slot'), row.getAttribute('data-item')]));
  expect(card.map(([slot]) => slot)).toEqual(['technique', 'review', 'new', 'repertoire']);
  await page.screenshot({ path: `${PICTURES}/today-before-start-342x740.png` });

  // Start session: the first activity, a drill, opened with its token.
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/#\/drill\/.+session=[0-9a-z]+/, { timeout: 30_000 });
  expect(page.url()).toContain(encodeURIComponent(card[0]?.[1] ?? ''));

  // Its end sheet's closing action is the next step, in the composition's words; Back to the plan gives way.
  await endDrill(page);
  const next = page.locator('#session-next');
  await expect(next).toContainText(/^Next: .+, 5 min — /);
  await expect(next).toHaveAttribute('data-session-next-item', card[1]?.[1] ?? '');
  await expect(page.locator('#drill-done')).toBeHidden();
  await page.locator('#session-next').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${PICTURES}/transition-after-drill-342x740.png` });

  // Start: straight to the next activity, never through Today.
  await page.locator('#session-start-next').click();
  await expect(page).toHaveURL(new RegExp(`#/drill/${card[1]?.[1]?.replace(/\./g, '\\.') ?? ''}\\?.*session=`), { timeout: 30_000 });
  await endDrill(page);
  await expect(page.locator('#session-next')).toContainText(`Next: `);
  await page.locator('#session-start-next').click();

  // The piece: played in time, the summary's closing action the next step.
  await expect(page).toHaveURL(new RegExp(`#/score/${card[2]?.[1]?.replace(/\./g, '\\.') ?? ''}\\?.*session=`), { timeout: 30_000 });
  await playThrough(page);
  const summary = page.locator('#score-summary');
  await expect(summary.locator('h2')).toHaveText(/Passed|Mastery run 1 of 2/, { timeout: 30_000 });
  await expect(summary.locator('#session-next')).toContainText(/^Next: .+, 7 min — /, { timeout: 30_000 });
  await expect(summary.locator('#summary-done')).toBeHidden();
  await page.screenshot({ path: `${PICTURES}/transition-after-piece-342x740.png` });
  await summary.locator('#session-start-next').click();

  // The last activity, and the app reloaded in the middle of it: the same activity, the same token.
  await expect(page).toHaveURL(new RegExp(`#/score/${card[3]?.[1]?.replace(/\./g, '\\.') ?? ''}\\?.*session=`), { timeout: 30_000 });
  const token = sessionOf(page.url());
  expect(token).not.toBeNull();
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
  await page.reload();
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
  expect(sessionOf(page.url())).toBe(token);

  // Today after an interruption: Continue, with where the session is.
  await page.goto('/#/today');
  const line = page.locator('#today-continue-line');
  await expect(line).toBeVisible({ timeout: 30_000 });
  await expect(line).toContainText(/^Continue today’s session · \d+ of \d+ min · next: /);
  await expect(page.locator('#today-actions .button--primary')).toHaveCount(1);
  await expect(page.locator(`#today-card [data-activity="3"]`)).toHaveAttribute('data-current', 'true');
  await expect(page.locator(`#today-card [data-activity="2"]`)).toHaveAttribute('data-state', 'completed');
  await page.screenshot({ path: `${PICTURES}/today-continue-342x740.png` });
  await page.locator('#today-continue').click();
  await expect.poll(() => sessionOf(page.url()), { timeout: 30_000 }).toBe(token);

  // The last one played: the transition says so, Done, and Today's finish line.
  await playThrough(page);
  await expect(summary.locator('#session-next')).toContainText('That was the last one — today’s session is done', { timeout: 30_000 });
  await page.screenshot({ path: `${PICTURES}/transition-last-342x740.png` });
  await summary.locator('#session-done').click();
  const finish = page.locator('#today-finish');
  await expect(finish).toBeVisible({ timeout: 30_000 });
  await expect(finish.locator('.today-finish__head')).toHaveText(/^Today’s session done · \d+ min$/);
  await expect(finish.locator('.today-finish__detail')).toHaveText('Warm-up played · Review played · New done · Repertoire done');
  await page.screenshot({ path: `${PICTURES}/today-finished-342x740.png` });
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(finish).toBeVisible();
  await page.screenshot({ path: `${PICTURES}/today-finished-768x1024.png` });
});

test('the tablet: the transition and Continue at 768 × 1024', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 768, height: 1024 });
  await placeAt(page, '1.1');
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/#\/drill\/.+session=/, { timeout: 30_000 });
  await endDrill(page);
  await page.screenshot({ path: `${PICTURES}/transition-after-drill-768x1024.png` });
  await page.goto('/#/today');
  await expect(page.locator('#today-continue-line')).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${PICTURES}/today-continue-768x1024.png` });
});

test('heard at noon from the card, the session’s reading in the evening: rechecked, repurposed, and said on the transition', async ({ page }) => {
  test.setTimeout(300_000);
  // Noon: the reading slot's phrase opened from the card, played to the learner, left without a run.
  await page.clock.setFixedTime(new Date('2026-09-29T12:00:00'));
  await placeAt(page, '1.5');
  const reading = page.locator('#today-card [data-slot="sightreading"]');
  await expect(reading).toBeVisible({ timeout: 30_000 });
  await reading.locator('button[aria-label^="Open"]').click();
  const screen = page.locator('section[data-screen="score"]');
  await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
  const noon = new URL(page.url()).hash.match(/seed=(\d+)/)?.[1];
  await pressControl(page, '#score-hear');
  await expect(screen).toHaveAttribute('data-hearing', 'true', { timeout: 5_000 });
  await page.waitForTimeout(1_500);
  await pressControl(page, '#score-hear');
  await expect(screen).toHaveAttribute('data-hearing', 'false', { timeout: 5_000 });
  await page.locator('#score-back').click();

  // Evening: the session composed and started; its reading activity chosen from the running card.
  await page.clock.setFixedTime(new Date('2026-09-29T19:00:00'));
  await page.goto('/');
  await expect(page.locator('#today-start')).toBeVisible({ timeout: 30_000 });
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/session=/, { timeout: 30_000 });
  await page.goto('/#/today');
  const activity = page.locator('#today-card [data-slot="sightreading"][data-activity]');
  await expect(activity).toBeVisible({ timeout: 30_000 });
  await activity.locator('button[aria-label^="Open"]').click();
  await expect(page).toHaveURL(/#\/score\/.+session=/, { timeout: 30_000 });
  expect(new URL(page.url()).hash.match(/seed=(\d+)/)?.[1]).toBe(noon);
  await playThrough(page);
  const summary = page.locator('#score-summary');
  await expect(summary.locator('#summary-note')).toHaveText('Sight-reading counts only on music you have not heard — this run is kept as practice.');
  await expect(summary.locator('#session-next')).toContainText('You heard this one earlier today, so it is practice now, not a first read', { timeout: 30_000 });
  await page.screenshot({ path: `${PICTURES}/transition-repurposed-342x740.png` });
});

test('a drill ended before any answer: Not measured with the reason, no Accuracy, and the transition under it (U96)', async ({ page }) => {
  test.setTimeout(180_000);
  await placeAt(page, '1.1');
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/#\/drill\/.+session=[0-9a-z]+/, { timeout: 30_000 });
  await endDrill(page);
  const sheet = page.locator('#drill-summary');
  // Soft, so a red shows every claim the sheet makes at once.
  await expect.soft(sheet.locator('#drill-outcome'), 'a verdict over a set nobody answered').toHaveText('Not measured');
  await expect.soft(sheet.locator('#drill-outcome-note')).toHaveText('Nothing was answered, so there is nothing to mark.');
  await expect.soft(sheet.locator('[data-stat="accuracy"]'), 'an accuracy nobody measured').toHaveCount(0);
  await expect.soft(sheet.locator('[data-stat="answered"]')).toHaveText(/^0 of \d+$/);
  await expect.soft(sheet).not.toContainText('Not passed');
  await expect.soft(sheet).not.toContainText('keep going');
  // The transition under it is X1's, unchanged: the next activity in the composition's words, one filled box.
  await expect.soft(sheet.locator('#session-next')).toContainText(/^Next: .+, 5 min — /);
  await expect.soft(sheet.locator('.button--primary:visible')).toHaveCount(1);
  await expect.soft(sheet.locator('#session-start-next')).toHaveClass(/button--primary/);
  await sheet.evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${U96_PICTURES}/drill-ended-early-sheet-342x740.png` });
  await sheet.locator('#session-next').evaluate((node) => node.scrollIntoView({ block: 'end' }));
  await page.screenshot({ path: `${U96_PICTURES}/drill-ended-early-transition-342x740.png` });
});

test('the placement test ended in a session: the transition’s Start is the one filled box, Start here outlined (U96)', async ({ page }) => {
  test.setTimeout(180_000);
  await placeAt(page, '0.4');
  const placement = 'drill.placement.stage-0';
  await expect(page.locator(`#today-card [data-item="${placement}"]`)).toBeVisible({ timeout: 30_000 });
  await page.locator('#today-start').click();
  await expect(page).toHaveURL(/session=/, { timeout: 30_000 });
  if (!page.url().includes(encodeURIComponent(placement)) && !page.url().includes(placement)) {
    // Not the first activity: chosen from the running card, as a learner would.
    await page.goto('/#/today');
    await page.locator(`#today-card [data-item="${placement}"][data-activity] button[aria-label^="Open"]`).click();
  }
  await expect(page).toHaveURL(/#\/drill\/drill\.placement\.stage-0\?.*session=/, { timeout: 30_000 });
  await expect(page.locator('#drill-placement-fail')).toBeVisible({ timeout: 60_000 });
  await page.locator('#drill-placement-fail').click();
  const sheet = page.locator('#drill-summary');
  await expect(sheet.locator('#session-next')).toBeVisible({ timeout: 30_000 });
  await expect(sheet.locator('[data-unit]')).toContainText('Start here:', { timeout: 30_000 });
  await expect.soft(sheet.locator('.button--primary:visible'), 'two filled boxes on one sheet').toHaveCount(1);
  await expect.soft(sheet.locator('#session-start-next')).toHaveClass(/button--primary/);
  // Still there: it is the only thing that records the test's answer.
  await expect.soft(sheet.locator('#drill-placement-start')).toBeVisible();
  await expect.soft(sheet.locator('#drill-placement-start')).toHaveClass(/button--secondary/);
  await sheet.evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${U96_PICTURES}/placement-in-session-342x740.png` });
});
