/**
 * How a lesson opens, how a mode starts, and what happens when you come back.
 *
 * The owner, 2026-09-22: *"it should be intuitive"*. Three things follow from
 * that and each has a test here, at the size the rules are written for
 * (342 px upright, `04` §0 R1):
 *
 *  1. **Opening a lesson** answers where you are, what to do first, and what
 *     pressing it will do — one primary action, not a column of equal ones.
 *  2. **Starting a mode** says in words what is happening before anything is
 *     judged, and marks the first note it is waiting for.
 *  3. **Coming back** to a run left half way says where it was left and offers
 *     both ways on, instead of silently starting again at bar 1.
 */
import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 342, height: 740 };
const PIECE = 'song.folk.hot-cross-buns';

test.use({ viewport: PHONE });

/**
 * A phone that has met every explain-it-once card and has left nothing half
 * way — set **once**, on the first document of the test.
 *
 * `addInitScript` runs before every navigation, and this spec navigates away
 * and back on purpose: clearing the abandoned-run memory unconditionally would
 * wipe it on the way back and the offer could never appear. The marker rides
 * in `sessionStorage`, which survives navigation inside the tab.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pianopath.firstSight', '["*"]');
    if (window.sessionStorage.getItem('spec.unfinishedCleared') === '1') return;
    window.sessionStorage.setItem('spec.unfinishedCleared', '1');
    window.localStorage.removeItem('pianopath.unfinished');
  });
});

async function openPiece(page: Page): Promise<void> {
  await page.goto(`/#/score/${PIECE}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, {
    timeout: 60_000,
  });
}

test.describe('opening a lesson', () => {
  test('says where you are, and gives one thing to press', async ({ page }) => {
    await page.goto('/#/lesson/1.1');
    await expect(page.locator('#lesson-start')).toBeVisible({ timeout: 60_000 });

    // Where am I: the track and the stage, under the rung's own title.
    await expect(page.locator('#lesson-where')).toContainText('Stage');
    // What do I do first, and what will it do.
    await expect(page.locator('#lesson-start')).toHaveText('Start');
    await expect(page.locator('#lesson-start-what')).toContainText('Opens');

    // Visibly primary, and the only one on the screen's chrome: the option
    // rows' own ▶ are secondary on purpose (`04` §0 R3).
    await expect(page.locator('#lesson-start')).toHaveClass(/button--primary/);
    await expect(page.locator('#lesson-actions .button--primary')).toHaveCount(0);

    // All three answers inside the first screenful, and the options still
    // start inside it — R1 is not overturned by answering R1's own question.
    for (const selector of ['#lesson-where', '#lesson-start', '#lesson-start-what']) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${selector} was not drawn`).not.toBeNull();
      expect(
        (box?.y ?? 0) + (box?.height ?? 0),
        `${selector} is below the fold at 342 px`,
      ).toBeLessThanOrEqual(PHONE.height);
    }
    const firstRow = await page.locator('#lesson-exercises .list-row').first().boundingBox();
    expect((firstRow?.y ?? 0) + (firstRow?.height ?? 0)).toBeLessThanOrEqual(PHONE.height);
  });

  test('Start opens the first thing on the rung, and says which', async ({ page }) => {
    await page.goto('/#/lesson/1.1');
    await expect(page.locator('#lesson-start-what')).toContainText('Opens', { timeout: 60_000 });
    const said = (await page.locator('#lesson-start-what').textContent()) ?? '';
    const named = /“(.+)”/.exec(said)?.[1];
    expect(named, 'the line does not name what Start opens').toBeTruthy();

    await page.locator('#lesson-start').click();
    // Whatever it opened, it is the thing the line named.
    await expect(page.locator('[data-screen="score"], [data-screen="drill"]')).toHaveCount(1, {
      timeout: 60_000,
    });
    await expect(page.locator('h1').first()).toContainText(named ?? '');
  });
});

test.describe('starting a mode', () => {
  test('says what to do before a note has been judged, in every mode', async ({ page }) => {
    await openPiece(page);
    for (const mode of ['wait', 'tempo', 'listen', 'free']) {
      await page.locator('#score-mode').selectOption(mode);
      // The mode, by name, and a line saying what to do — both before the run.
      await expect(page.locator('#score-help-what')).not.toBeEmpty();
      await expect(page.locator('#score-waiting')).not.toBeEmpty();
    }
  });

  test('marks the first note it is waiting for before the run starts', async ({ page }) => {
    await openPiece(page);
    await page.locator('#score-mode').selectOption('wait');
    // Nothing pressed, nothing judged: the key the piece opens on is already
    // marked, so the learner can see what the app is asking for.
    await expect(page.locator('.keyboard-strip .key.is-expected')).toHaveCount(1);
  });
});

test.describe('coming back to a run left half way', () => {
  test('says where it was left and offers both ways on', async ({ page }) => {
    await openPiece(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();

    // Wait until the run has passed the first bar, so there is something to
    // come back to. Read off the screen's own bar line, not a clock here.
    await expect(page.locator('#score-where')).not.toContainText('bar 1 /', { timeout: 60_000 });

    // Away, and back — the ordinary thing: the learner is called away.
    await page.evaluate(() => {
      window.location.hash = '#/today';
    });
    await expect(page.locator('[data-screen="today"]')).toHaveCount(1, { timeout: 60_000 });
    await openPiece(page);

    const said = page.locator('#score-resume-said');
    await expect(said).toBeVisible({ timeout: 60_000 });
    await expect(said).toContainText('You stopped at bar');
    await expect(page.locator('#score-resume-go')).toBeVisible();
    await expect(page.locator('#score-resume-restart')).toBeVisible();
    // The offer is inside the first screenful, where the learner is looking.
    const box = await page.locator('#score-resume').boundingBox();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(PHONE.height);
  });

  test('starting from the beginning takes the offer away and leaves bar 1', async ({ page }) => {
    await openPiece(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    await expect(page.locator('#score-where')).not.toContainText('bar 1 /', { timeout: 60_000 });
    await page.evaluate(() => {
      window.location.hash = '#/today';
    });
    await expect(page.locator('[data-screen="today"]')).toHaveCount(1, { timeout: 60_000 });
    await openPiece(page);

    await page.locator('#score-resume-restart').click();
    await expect(page.locator('#score-resume')).toBeHidden();
    // And it does not come back on the next visit: the learner answered.
    await page.evaluate(() => {
      window.location.hash = '#/today';
    });
    await expect(page.locator('[data-screen="today"]')).toHaveCount(1, { timeout: 60_000 });
    await openPiece(page);
    await expect(page.locator('#score-resume')).toBeHidden();
  });

  test('a piece never left half way is not asked about', async ({ page }) => {
    await openPiece(page);
    await expect(page.locator('#score-resume')).toBeHidden();
  });
});
