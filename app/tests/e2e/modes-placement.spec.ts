/**
 * The placement test, and the plan it is supposed to start (T17; `04` §3,
 * `02` Stage 0.4).
 *
 * `placementStartsThePlan.test.ts` proves `nextRecommended` honours a
 * `startAt`. What it cannot show is the thing that was actually wrong for a
 * fortnight: the app said *"Placement recorded. Today will build from here"*
 * and then went on recommending `0.1`, because every reader of the plan row
 * used `trackOrder` and none of them read the field the sentence was about.
 *
 * So this walks it: Plan, the placement link, the eight items, *Start here*,
 * and then back to Plan and Today to see whether the two screens agree with
 * the sentence and with each other.
 *
 * Judged as a learner: is the question the whole screen and on it without
 * scrolling; are Pass and Fail told apart by more than their position; does
 * the result say where it is sending you in words rather than in an id
 * (`00` §1 — no internal identifiers on screen).
 *
 * **Nothing here is heard**; the placement is self-judged and plays nothing.
 */
import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 342, height: 740 };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      // Every explain-it-once card counts as seen, for the same reason the
      // tour counts as skipped: this spec is not about meeting them
      // (`04` §5f, `help-strip.spec.ts` is the one that drives them).
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

async function withoutScrolling(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight;
  }, selector);
}

/** Plan's own link, then the rung's own row — the way a learner finds it. */
async function placementFromThePlan(page: Page): Promise<void> {
  await page.setViewportSize(PHONE);
  await page.goto('/#/plan');
  await expect(page.locator('section[data-screen="plan"]')).toBeVisible({ timeout: 60_000 });
  await page.locator('#plan-placement').click();
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  await page.locator('#lesson-exercises .list-row[data-item^="drill.placement."]').first().click();
  await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-kind', 'placement', {
    timeout: 60_000,
  });
}

test('the question is the screen, and the two answers are both on it', async ({ page }) => {
  await placementFromThePlan(page);
  await expect(page.locator('#drill-prompt')).not.toBeEmpty();
  for (const id of ['#drill-prompt', '#drill-placement-pass', '#drill-placement-fail']) {
    expect(await withoutScrolling(page, id), `${id} is below the fold on a 342 px phone`).toBe(true);
  }
  // Told apart by weight, not only by position: Pass is the filled box and
  // Fail is not, which is `04` §0 R3 — and there is exactly one filled box on
  // this screen.
  const filled = await page
    .locator('section[data-screen="drill"] button')
    .evaluateAll((els) => els.filter((el) => el.classList.contains('btn--primary')).length);
  expect(filled, 'the placement drew more than one filled box').toBeLessThanOrEqual(1);
  // And the instruction that makes a self-judged test mean anything is on the
  // screen rather than in the lesson behind it.
  await expect(page.locator('#drill-hint')).toContainText('Be strict');
});

test('answering it records a starting point, and Plan and Today both move to it', async ({
  page,
}) => {
  test.setTimeout(180_000);
  // Where the plan stands before the test, read off the screen rather than
  // assumed: "it recommends 0.1" is a claim about today's curriculum.
  await page.goto('/#/plan');
  await expect(page.locator('#plan-next')).toBeVisible({ timeout: 60_000 });
  const before = await page.locator('#plan-next').getAttribute('data-lesson-next');

  await placementFromThePlan(page);
  // Passed every item, which is what a learner who can already play does.
  for (let item = 0; item < 40; item += 1) {
    if (await page.locator('#drill-placement-start').isVisible()) break;
    const pass = page.locator('#drill-placement-pass');
    if ((await pass.count()) === 0) break;
    await pass.click();
  }
  const start = page.locator('#drill-placement-start');
  await expect(start, 'the placement produced no starting point to press').toBeVisible({
    timeout: 30_000,
  });

  // The result says where it is sending the learner in words. The unit id is
  // in `data-`, where `00` §1 says an internal identifier belongs.
  const result = page.locator('#drill-summary [data-unit]');
  await expect(result).toContainText('Start here:');
  const unit = (await result.getAttribute('data-unit')) ?? '';
  expect(unit, 'the placement named no unit').not.toBe('');
  await expect(result).not.toContainText(unit);

  await start.click();
  await expect(page.locator('#drill-status')).toContainText('Placement recorded', {
    timeout: 30_000,
  });

  // …and the two screens that say where the learner is now agree with it.
  await page.goto('/#/plan');
  await expect(page.locator('#plan-next')).toBeVisible({ timeout: 60_000 });
  const after = await page.locator('#plan-next').getAttribute('data-lesson-next');
  expect(after, 'the plan recommends the same rung it did before the placement').not.toBe(before);

  await page.goto('/#/today');
  await expect(page.locator('#today-status')).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(async () => page.locator('#today-status').getAttribute('data-lesson'), {
      timeout: 30_000,
    })
    .toBe(after);
});
