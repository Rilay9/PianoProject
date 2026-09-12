/**
 * The guided tour of the practice modes, end to end (`04` §5c-1, `02` Stage 0.3).
 *
 * The unit suites cover the two halves separately — `drillWalkthrough` proves
 * the drill screen asks for the right route, `scoreTourRoute` proves the Score
 * screen obeys one. This is the only place the two meet on the real app with a
 * real engraving: the tour opens Hot Cross Buns, the score screen comes up in
 * the step's mode, and Back lands on the step after it.
 *
 * Not the setup tour (`#/settings/setup`), which is a different thing with the
 * same word in its name.
 */
import { expect, test, type Page } from '@playwright/test';
import { revealBar } from './scoreControls';

const TOUR = 'drill.tour.app-basics';
const SONG = 'song.folk.hot-cross-buns';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // A tour that remembers where it was is the point of it, so every test
    // starts from a phone that has never run it.
    indexedDB.deleteDatabase('pianopath');
    localStorage.clear();
  });
});

async function openTour(page: Page): Promise<void> {
  await page.goto(`/#/drill/${TOUR}`);
  await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', {
    timeout: 30_000,
  });
  await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-kind', 'walkthrough');
}

/** Waits for the Score screen to have a piece on it, not merely a route. */
async function scoreIsUp(page: Page): Promise<void> {
  await expect(page.locator('#score-title')).toHaveText('Hot Cross Buns', { timeout: 60_000 });
}

test.describe('the guided tour of the practice modes', () => {
  test('is a tour, not a notice that one is coming', async ({ page }) => {
    await openTour(page);
    await expect(page.locator('#drill-status')).not.toContainText('being built');
    await expect(page.locator('#drill-counter')).toContainText('1 of 3');
    await expect(page.locator('#drill-walkthrough-open')).toBeVisible();
    // Prose, not a label: the step has to say what the mode is before it opens
    // the screen that does it.
    const said = (await page.locator('#drill-prompt').textContent())?.trim() ?? '';
    expect(said.length).toBeGreaterThan(60);
    expect(said).not.toMatch(/import needed|needs? import/i);
  });

  test('walks all three steps on the real score screen and comes back to each', async ({ page }) => {
    test.setTimeout(180_000);
    await openTour(page);

    // Step 1 — Wait mode.
    await page.locator('#drill-walkthrough-open').click();
    await scoreIsUp(page);
    expect(page.url()).toContain(`#/score/${SONG}`);
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', 'wait');
    // Back goes to the tour, not to a tab, and lands on the *next* step.
    await revealBar(page);
    await page.locator('#score-back').click();
    await expect(page.locator('#drill-counter')).toContainText('2 of 3', { timeout: 30_000 });

    // Step 2 — Tempo mode.
    await page.locator('#drill-walkthrough-open').click();
    await scoreIsUp(page);
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', 'tempo');
    await revealBar(page);
    await page.locator('#score-back').click();
    await expect(page.locator('#drill-counter')).toContainText('3 of 3', { timeout: 30_000 });

    // Step 3 — loops, which arrive already set rather than left as a gesture
    // for the learner to discover.
    await page.locator('#drill-walkthrough-open').click();
    await scoreIsUp(page);
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-loop', '1-2');
    await revealBar(page);
    await page.locator('#score-back').click();

    // …and coming back from the last step is the end of the tour.
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'finished', {
      timeout: 30_000,
    });
    await expect(page.locator('#drill-summary')).toBeVisible();
  });

  test('the Android back gesture resumes the tour the same way Back does', async ({ page }) => {
    test.setTimeout(120_000);
    await openTour(page);
    await page.locator('#drill-walkthrough-open').click();
    await scoreIsUp(page);
    await page.goBack();
    await expect(page.locator('#drill-counter')).toContainText('2 of 3', { timeout: 30_000 });
  });

  test('can be run again from the beginning', async ({ page }) => {
    test.setTimeout(120_000);
    await openTour(page);
    // Straight through without opening the score: Next on every step.
    await page.locator('#drill-walkthrough-next').click();
    await page.locator('#drill-walkthrough-next').click();
    await page.locator('#drill-walkthrough-next').click();
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'finished');

    await page.locator('#drill-again').click();
    await expect(page.locator('#drill-counter')).toContainText('1 of 3');

    // And a fresh visit is a fresh tour, not a half-finished one.
    await page.goto('/#/plan');
    await openTour(page);
    await expect(page.locator('#drill-counter')).toContainText('1 of 3');
  });

  test('Back on a resumed step leaves the tour instead of re-entering the piece', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // The one case jsdom cannot model: a real history stack. Returning from the
    // score pushes the drill on top of it, so `history.back()` — every other
    // drill's Back — walked into the piece just left, whose own Back came here
    // again. Two buttons pointing at each other.
    await openTour(page);
    await page.locator('#drill-walkthrough-open').click();
    await scoreIsUp(page);
    await revealBar(page);
    await page.locator('#score-back').click();
    await expect(page.locator('#drill-counter')).toContainText('2 of 3', { timeout: 30_000 });
    await page.locator('#drill-back').click();
    // Off the drill screen and not onto the score screen.
    await expect(page.locator('[data-screen="drill"]')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.locator('[data-screen="score"]')).toHaveCount(0);
    expect(page.url()).not.toContain('/score/');
  });

  test('there is a way out of every step', async ({ page }) => {
    await openTour(page);
    // Back on the drill screen itself leaves the tour at every step, and
    // "Start over" appears the moment there is something to go back past.
    await expect(page.locator('#drill-back')).toBeVisible();
    await expect(page.locator('#drill-walkthrough-restart')).toHaveCount(0);
    await page.locator('#drill-walkthrough-next').click();
    await expect(page.locator('#drill-walkthrough-restart')).toBeVisible();
    await page.locator('#drill-walkthrough-restart').click();
    await expect(page.locator('#drill-counter')).toContainText('1 of 3');
  });

  test('leaving the score screen any other way still returns to the tour', async ({ page }) => {
    test.setTimeout(120_000);
    await openTour(page);
    await page.locator('#drill-walkthrough-open').click();
    await scoreIsUp(page);
    // Sideways the header is not drawn and Back lives at the bar's left end.
    await page.setViewportSize({ width: 740, height: 342 });
    await revealBar(page);
    await page.locator('#score-back-side').click();
    await expect(page.locator('#drill-counter')).toContainText('2 of 3', { timeout: 30_000 });
  });

  /**
   * The owner's own two sizes (`00` §1: every change is checked at both).
   *
   * The relationships, not the pixels: the prose above the buttons, the buttons
   * inside the first screenful, `40` because `04` §0 R4 is the spec's own
   * literal, and no card area held open for a step that has nothing to draw.
   */
  for (const [name, size] of [
    ['upright', { width: 342, height: 740 }],
    ['sideways', { width: 740, height: 342 }],
  ] as const) {
    test(`a step reads top to bottom at ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await openTour(page);
      // Past the first step, so the third control is on the row too.
      await page.locator('#drill-walkthrough-next').click();
      await expect(page.locator('#drill-walkthrough-restart')).toBeVisible();

      // Nothing keeps room for a card this face does not have.
      await expect(page.locator('#drill-stage')).toBeHidden();

      const prompt = await page.locator('#drill-prompt').boundingBox();
      const controls = await page.locator('#drill-controls').boundingBox();
      expect(prompt, 'the prose is drawn').not.toBeNull();
      expect(controls, 'the buttons are drawn').not.toBeNull();
      const promptBox = prompt as { y: number; height: number };
      const controlsBox = controls as { y: number; height: number };
      // Read, then act.
      expect(promptBox.y + promptBox.height).toBeLessThanOrEqual(controlsBox.y);
      // And both without scrolling, on the smaller of the two as well.
      expect(controlsBox.y + controlsBox.height).toBeLessThanOrEqual(size.height);

      // R4. `Start over` is a text link and `04` §9 puts a link's target at 24,
      // which is the floor `tests/states/audit.ts` already holds them to.
      for (const id of ['#drill-walkthrough-open', '#drill-walkthrough-next']) {
        const box = await page.locator(id).boundingBox();
        expect((box as { height: number }).height, id).toBeGreaterThanOrEqual(40);
      }

      // No internal identifiers on screen (`00` §1). The step ids and the
      // piece's id live in `data-` attributes and in the hash.
      const said = (await page.locator('[data-screen="drill"]').innerText()).trim();
      expect(said).not.toMatch(/drill\.[a-z]/);
      expect(said).not.toMatch(/song\.[a-z]/);
    });
  }

  test('a piece opened outside the tour still goes back to its tab', async ({ page }) => {
    test.setTimeout(120_000);
    // The tour's Back is a route parameter, so a piece opened from Library must
    // be untouched by it.
    await page.goto(`/#/score/${SONG}`);
    await scoreIsUp(page);
    await revealBar(page);
    await page.locator('#score-back').click();
    await expect(page.locator('[data-screen="drill"]')).toHaveCount(0);
    expect(page.url()).not.toContain('/drill/');
  });
});
