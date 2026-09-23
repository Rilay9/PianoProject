/**
 * Every practising screen says what it is, what to do now, and what else there is.
 *
 * The owner, 2026-09-22: *"there's not enough context or explanation given in
 * the modes and exercises. There's gotta be a better way to tell the user
 * what's going on, what they're supposed to do, what they can do, and what's
 * available."* `04` §5f is the answer and this drives it on a 342 px phone,
 * which is the size the rule is about.
 *
 * What is asserted here that a unit test cannot see: that the two lines are
 * **above the fold**, that the *now* line follows the run rather than standing
 * still, and that the first-sight card appears once and not twice.
 *
 * This is the one spec that clears `pianopath.firstSight`. Every other spec
 * inherits it as `["*"]` from `fixtures/storageState.json`, so nothing else
 * opens behind a card (see `playwright.config.ts`).
 */
import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 342, height: 740 };
const PIECE = 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx';
const DRILL = 'drill.reading.note-flash-treble-c4-g4';

test.use({ viewport: PHONE });

/** Every card counts as seen, which is how the rest of the suite runs. */
async function seenEverything(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('pianopath.firstSight', '["*"]');
  });
}

/**
 * A phone that has met none of them, which is what a new learner has.
 *
 * Cleared **once**, on the first document of the run: `addInitScript` runs
 * before every navigation, so clearing it unconditionally would wipe the
 * memory again on the second visit and the card would always look new — which
 * is exactly the thing the second half of that test is trying to catch. The
 * marker rides in `sessionStorage`, which survives navigation inside the tab.
 */
async function seenNothing(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem('spec.firstSightCleared') === '1') return;
    window.sessionStorage.setItem('spec.firstSightCleared', '1');
    window.localStorage.removeItem('pianopath.firstSight');
  });
}

/**
 * True when the whole of an element is inside the first screenful.
 *
 * Relationships, not measurements: nothing here asserts a pixel this machine
 * happened to produce, only that one box ends before the viewport does and
 * that the subject still starts inside it.
 */
async function insideFirstScreenful(page: Page, selector: string): Promise<boolean> {
  const box = await page.locator(selector).boundingBox();
  if (!box) return false;
  const height = page.viewportSize()?.height ?? 0;
  return box.y >= 0 && box.y + box.height <= height;
}

test.describe('the Score screen says which mode this is', () => {
  test('names the mode and what to do, above the notation, without scrolling', async ({ page }) => {
    await seenEverything(page);
    await page.goto(`/#/score/${PIECE}`);
    await expect(page.locator('#score-title')).not.toBeEmpty({ timeout: 60_000 });

    // Question 1: the mode, by the name `04` §5 gives it.
    await expect(page.locator('#score-help-what')).toHaveText(/Wait for me|Keep tempo|Play it to me|Free play/);
    // Question 2: what to do now, and it is not blank before anything happens.
    await expect(page.locator('#score-waiting')).not.toBeEmpty();

    expect(
      await insideFirstScreenful(page, '#score-help'),
      'the help strip is not inside the first screenful at 342 px',
    ).toBe(true);
    // And the subject still *starts* inside the first screenful, which is what
    // R1 protects and what a paragraph over the notation would have cost.
    const stage = await page.locator('.score-stage').boundingBox();
    expect(stage?.y ?? Infinity, 'the notation starts below the fold').toBeLessThan(PHONE.height);
  });

  test('the line follows the mode, and the ? says what the controls do', async ({ page }) => {
    await seenEverything(page);
    await page.goto(`/#/score/${PIECE}`);
    await expect(page.locator('#score-title')).not.toBeEmpty({ timeout: 60_000 });

    await page.locator('#score-mode').selectOption('wait');
    await expect(page.locator('#score-help-what')).toHaveText('Wait for me');
    const waitLine = await page.locator('#score-waiting').textContent();

    await page.locator('#score-mode').selectOption('listen');
    await expect(page.locator('#score-help-what')).toHaveText('Play it to me');
    expect(
      await page.locator('#score-waiting').textContent(),
      'the state line said the same thing in two different modes',
    ).not.toBe(waitLine);

    // Question 3 and question 4, one tap away.
    await page.locator('#score-help-more').click();
    await expect(page.locator('#score-help-controls dt').first()).not.toBeEmpty();
    await expect(page.locator('#score-help-elsewhere')).not.toBeEmpty();
  });

  test('the card that explains the mode comes up once, on the first meeting', async ({ page }) => {
    await seenNothing(page);
    await page.goto(`/#/score/${PIECE}`);
    const card = page.locator('#score-first-sight');
    await expect(card).toBeVisible({ timeout: 60_000 });
    // Three lines: what it is, what to do, what counts.
    await expect(card.locator('.first-sight__what')).not.toBeEmpty();
    await expect(card.locator('.first-sight__do')).not.toBeEmpty();
    await expect(card.locator('.first-sight__counts')).not.toBeEmpty();
    await page.locator('#score-first-sight-go').click();
    await expect(card).toHaveCount(0);

    // Opened again, the same mode does not ask again.
    await page.goto('/#/today');
    await page.goto(`/#/score/${PIECE}`);
    await expect(page.locator('#score-title')).not.toBeEmpty({ timeout: 60_000 });
    await expect(page.locator('#score-first-sight')).toHaveCount(0);
  });
});

test.describe('a drill says what kind of thing it is', () => {
  test('names the kind above the card, and the card says how to answer', async ({ page }) => {
    await seenEverything(page);
    await page.goto(`/#/drill/${DRILL}`);
    await expect(page.locator('#drill-prompt')).not.toBeEmpty({ timeout: 60_000 });

    await expect(page.locator('#drill-help-what')).not.toBeEmpty();
    // Question 2 on this screen is the card's own line, under the prompt.
    await expect(page.locator('#drill-how')).not.toBeEmpty();

    expect(
      await insideFirstScreenful(page, '#drill-help'),
      'the drill help strip is not inside the first screenful at 342 px',
    ).toBe(true);
  });

  test('the ? names the controls and where the drill sits', async ({ page }) => {
    await seenEverything(page);
    await page.goto(`/#/drill/${DRILL}`);
    await expect(page.locator('#drill-prompt')).not.toBeEmpty({ timeout: 60_000 });
    await page.locator('#drill-help-more').click();
    await expect(page.locator('#drill-help-controls dt').first()).not.toBeEmpty();
    await expect(page.locator('#drill-help-elsewhere')).not.toBeEmpty();
    // And the card is reachable again from here, which is the whole reason a
    // card shown once is allowed to be shown once.
    await expect(page.locator('#drill-help-reopen')).toBeVisible();
    await page.locator('#drill-help-reopen').click();
    await expect(page.locator('#drill-first-sight')).toBeVisible();
  });

  test('the first card of a kind explains it before it asks anything', async ({ page }) => {
    await seenNothing(page);
    await page.goto(`/#/drill/${DRILL}`);
    await expect(page.locator('#drill-first-sight')).toBeVisible({ timeout: 60_000 });
    await page.locator('#drill-first-sight-go').click();
    await expect(page.locator('#drill-first-sight')).toHaveCount(0);
  });
});

test.describe('the tools say what they are', () => {
  test('the lab, the chord chart and free play each carry the strip', async ({ page }) => {
    await seenEverything(page);

    // These three are titled with the tool's own name, so their strip leaves
    // the name off and carries what to do now; the sentence is behind the `?`.
    await page.goto('/#/lab');
    await expect(page.locator('#lab-help-now')).not.toBeEmpty({ timeout: 60_000 });
    await expect(page.locator('#lab-help-what')).toBeHidden();
    expect(await insideFirstScreenful(page, '#lab-help'), 'the lab strip is below the fold').toBe(
      true,
    );
    // And it did not push the thing the lab is for off the screen (Entry 42).
    expect(
      await insideFirstScreenful(page, '#lab-plays-row'),
      'the strip pushed the Jam it settings below the fold',
    ).toBe(true);

    await page.goto('/#/play');
    await expect(page.locator('#play-help-now')).not.toBeEmpty({ timeout: 60_000 });
    expect(
      await insideFirstScreenful(page, '#play-purpose'),
      'the free play strip is below the fold',
    ).toBe(true);

    // A piece that carries chord symbols. On one that does not, the chart is a
    // dead end and drops the strip entirely (`04` §0 R4), which is right and
    // is not what this test is about.
    await page.goto('/#/chart/exercise.blues.twelve-bar-shuffle.c');
    await expect(page.locator('#chart-help-now')).not.toBeEmpty({ timeout: 60_000 });
    await page.locator('#chart-help-more').click();
    await expect(page.locator('#chart-help-elsewhere')).not.toBeEmpty();
  });
});

test.describe('the guide holds the whole list', () => {
  test('lists every mode, drill kind and tool on one page', async ({ page }) => {
    await seenEverything(page);
    await page.goto('/#/settings/guide');
    const block = page.locator('[data-guide="everything"]');
    await expect(block).toBeVisible({ timeout: 60_000 });
    // A relationship, not a count: whatever the table holds, the page holds.
    const terms = await block.locator('dt').allTextContents();
    expect(terms.length, 'the guide lists nothing').toBeGreaterThan(20);
    expect(terms, 'the guide does not name the mode that scores').toContain('Keep tempo');
    expect(terms, 'the guide does not name the chain game').toContain('Simon');
    expect(terms, 'the guide does not name the lab').toContain('Accompaniment lab');
  });

  test('Skills review and a lesson both offer the way in', async ({ page }) => {
    await seenEverything(page);
    await page.goto('/#/plan/skills');
    await expect(page.locator('#skills-open-guide')).toBeVisible({ timeout: 60_000 });
    await page.locator('#skills-open-guide').click();
    await expect(page.locator('[data-screen="guide"]')).toHaveCount(1);

    // And the lesson page, which is where *Ways to play this* is met first.
    await page.goto('/#/lesson/chords-pop.3');
    await expect(page.locator('#lesson-open-guide')).toBeVisible({ timeout: 60_000 });
    await page.locator('#lesson-open-guide').click();
    await expect(page.locator('[data-screen="guide"]')).toHaveCount(1);
  });
});
