/**
 * Duet from a rung (T17; `04` §3d, §5, `pending-review` Entry 16).
 *
 * "Play it as a duet" is the app taking the hand you are not playing. Two
 * things have to be true for the button to mean that, and only one of them is
 * in the route: the hand focus (`?hands=R`) and `playbackHands`, which is a
 * **setting**. `lesson-tools.spec.ts` checks the first. This checks the
 * second, by doing what a learner does — switching the Score screen's own
 * Duet row off once, and then pressing the rung's button again.
 *
 * Also the case §3d added on 2026-09-22: a `duet` may name an **exercise**.
 * `technique.7`'s sentence is about its two-against-three study and its only
 * songs are Czerny, so a rule reading "only a song is notation" turned "play
 * the exercise as a duet" into a button that opened an étude.
 *
 * Judged as a learner: the screen says once that the app is playing the other
 * hand — a note arriving from nowhere reads as a fault — and the row that
 * turns it off is where the `R`/`L` question is asked, not three screens away.
 *
 * **Nothing here is heard.** That the left hand the app plays is in time, in
 * tune or the right hand is not asserted anywhere below.
 */
import { expect, test, type Page } from '@playwright/test';

import { openScoreMenu, closeScoreMenu } from './scoreControls';

const PHONE = { width: 342, height: 740 };
const SIDEWAYS = { width: 740, height: 342 };

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

/** A rung's *Play it as a duet*, and where it lands. */
async function duetFromTheRung(page: Page, rung: string): Promise<string[]> {
  await page.goto(`/#/lesson/${rung}`);
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const offered = await page
    .locator('#lesson-songs .list-row[data-item], #lesson-exercises .list-row[data-item]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-item') ?? ''));
  const tool = page.locator('#lesson-tool-duet');
  await expect(tool, `${rung} draws no duet button`).toBeVisible();
  await tool.click();
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
  return offered;
}

test('the button opens one of the rung’s own pieces, with a hand chosen', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(PHONE);
  const offered = await duetFromTheRung(page, '2.1');
  const hash = new URL(page.url()).hash;
  expect(hash).toMatch(/hands=R/);
  expect(hash).toMatch(/mode=tempo/);
  expect(
    offered.some((id) => id !== '' && hash.includes(encodeURIComponent(id))),
    `the duet opened something 2.1 does not offer: ${hash}`,
  ).toBe(true);
  // And the app is on the other hand, which is what makes it a duet.
  await openScoreMenu(page);
  await expect(page.locator('#score-duet-row')).toBeVisible();
  await expect(page.locator('#score-duet')).toHaveText('On');
  // The row names the hand in its own label, because sideways the sheet hides
  // every hint and a row reading only "Duet" would say nothing there.
  await expect(page.locator('#score-duet-row')).toContainText('left hand');
});

test('the button still means it after the Duet row has been switched off once', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize(PHONE);
  await duetFromTheRung(page, '2.1');
  await openScoreMenu(page);
  await expect(page.locator('#score-duet')).toHaveText('On');
  // One tap, and a thing people do: "stop playing it for me, I want to hear
  // myself". It writes `playbackHands: none`, which is remembered.
  await page.locator('#score-duet').click();
  await expect(page.locator('#score-duet')).toHaveText('Off');
  await closeScoreMenu(page);

  // Back to the rung, and press the button whose label is *Play it as a
  // duet*. Before this was fixed it opened a Keep tempo run with the app
  // playing nothing — the label's whole promise, silently dropped, because
  // the hand is in the route and the setting is not.
  await duetFromTheRung(page, '2.1');
  await openScoreMenu(page);
  await expect(
    page.locator('#score-duet'),
    'the rung’s duet button opened a screen with the app playing nothing',
  ).toHaveText('On');
});

test('a rung whose duet names an exercise opens the exercise', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(PHONE);
  // `technique.7`: its only songs are three Czerny studies and its sentence is
  // about the two-against-three exercise, so the duet has to be able to name
  // one (§3d, 2026-09-22).
  const offered = await duetFromTheRung(page, 'technique.7');
  const hash = new URL(page.url()).hash;
  expect(hash).toContain('exercise.');
  expect(
    offered.some((id) => id !== '' && hash.includes(encodeURIComponent(id))),
    `technique.7’s duet opened something the rung does not offer: ${hash}`,
  ).toBe(true);
});

/**
 * FAULT 9 (Entry 38), fixed by T17-2: `← Back` went to the tab.
 *
 * The duet button is one of the rung's own doors, so the whole path is here:
 * press it, land on the Score screen, press Back, and be on the rung again —
 * the page with the rung's other options, its lesson and its *Know it*
 * buttons on it. Before the fix this landed on Plan, at whatever stage it
 * happened to be scrolled to.
 */
test('Back from a run opened by the rung’s button returns to the rung', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(PHONE);
  await duetFromTheRung(page, '2.1');
  expect(new URL(page.url()).hash, 'the rung is not in the route').toMatch(/from=2\.1/);
  await page.locator('#score-back').click();
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#/lesson/2.1');
  // And the rung's own button is there to be pressed again, which is what
  // "back to the rung" is for.
  await expect(page.locator('#lesson-tool-duet')).toBeVisible();
});

test('sideways the Duet row survives, and it still names the hand', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(SIDEWAYS);
  await duetFromTheRung(page, '2.1');
  await openScoreMenu(page);
  // Sideways the sheet is a two-column grid with every hint hidden, which is
  // exactly why the hand is in the label.
  await expect(page.locator('#score-duet-row')).toBeVisible();
  await expect(page.locator('#score-duet-row')).toContainText('left hand');
});
