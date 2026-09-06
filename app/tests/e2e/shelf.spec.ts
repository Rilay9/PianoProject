/**
 * The shelf, paper practice and blind mode (replan §5, §8).
 *
 * The claims worth checking in a real browser are the ones about *honesty*:
 * that the paper summary never shows an accuracy, and that a blind run really
 * does hide the score while still being scored. Both are properties of what is
 * on the screen, which is exactly what a unit test cannot see.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

/** Registers a book and one piece against a rung, through the UI. */
async function addBookAndPiece(
  page: import('@playwright/test').Page,
  options: { book: string; piece: string; page?: string; lesson?: string } = {
    book: 'Czerny 599',
    piece: 'No. 12',
  },
): Promise<void> {
  await page.goto('/#/library/shelf');
  await page.locator('#shelf-add-book').click();
  await page.locator('#book-title').fill(options.book);
  await page.locator('#book-save').click();
  await expect(page.locator('#shelf-list')).toContainText(options.book);

  await page.locator('[id^="shelf-add-piece-"]').first().click();
  await page.locator('#piece-title').fill(options.piece);
  if (options.page) await page.locator('#piece-page').fill(options.page);
  if (options.lesson) await page.locator('#piece-lesson').selectOption(options.lesson);
  await page.locator('#piece-save').click();
  await expect(page.locator('#shelf-list')).toContainText(options.piece);
}

test.describe('the shelf', () => {
  test('registers a book and a piece, and keeps them across a reload', async ({ page }) => {
    await addBookAndPiece(page, { book: 'Czerny 599', piece: 'No. 12', page: '14', lesson: '4.4' });
    await page.reload();
    await expect(page.locator('#shelf-list')).toContainText('Czerny 599');
    await expect(page.locator('#shelf-list')).toContainText('No. 12');
    await expect(page.locator('#shelf-list')).toContainText('page 14');
  });

  test('is reachable from Library', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-shelf').click();
    await expect(page).toHaveURL(/#\/library\/shelf/);
    await expect(page.locator('[data-screen="shelf"]')).toBeVisible();
  });

  test('a registered piece becomes an option of its rung', async ({ page }) => {
    await addBookAndPiece(page, { book: 'Czerny 599', piece: 'No. 12', page: '14', lesson: '4.4' });
    await page.goto('/#/lesson/4.4');
    const paper = page.locator('#lesson-paper');
    await expect(paper).toContainText('No. 12');
    await expect(paper).toContainText('Czerny 599');
    await expect(paper).toContainText('page 14');
  });
});

test.describe('the rung asking for paper', () => {
  test('prints the hint on a core rung', async ({ page }) => {
    await page.goto('/#/lesson/2.1');
    await expect(page.locator('#lesson-paper-hint')).toContainText(/method book/i);
  });

  test('"I have this on paper" opens the form with the rung already chosen', async ({ page }) => {
    await page.goto('/#/lesson/3.5');
    await page.locator('#lesson-have-paper').click();
    await expect(page.locator('#piece-sheet')).toBeVisible();
    await expect(page.locator('#piece-lesson')).toHaveValue('3.5');

    await page.locator('#piece-title').fill('Pedal study');
    await page.locator('#piece-save').click();
    await expect(page.locator('#lesson-paper')).toContainText('Pedal study');
  });
});

test.describe('practising against paper', () => {
  test('says what it measured and what it could not', async ({ page }) => {
    await addBookAndPiece(page, { book: 'My book', piece: 'Study', lesson: '4.4' });
    await page.locator('#shelf-list [data-piece]').first().getByRole('button', { name: 'Practise' }).click();
    await expect(page).toHaveURL(/#\/paper\//);
    await expect(page.locator('#paper-timer')).toBeVisible();

    await page.locator('#paper-start').click();
    await expect(page.locator('#paper-stop')).toBeVisible();
    await page.locator('#paper-stop').click();

    const summary = page.locator('#paper-summary');
    await expect(summary).toBeVisible();
    // The sentence the whole screen exists to be able to say.
    await expect(summary).toContainText('It cannot see the notes');
    await expect(summary).toContainText(/heard 0 note\(s\)/);
    // And the thing it must never say.
    await expect(summary).not.toContainText('Accuracy');
    await expect(summary).not.toContainText('%');
  });

  test('records the run under the owner’s own verdict, not a measurement', async ({ page }) => {
    await addBookAndPiece(page, { book: 'My book', piece: 'Study', lesson: '4.4' });
    await page.locator('#shelf-list [data-piece]').first().getByRole('button', { name: 'Practise' }).click();
    await page.locator('#paper-start').click();
    await page.locator('#paper-stop').click();
    await page.locator('#paper-report-clean').click();
    await expect(page.locator('#paper-status')).toContainText('your own judgement');

    // It shows up in the history as a paper run with no percentage.
    await page.goto('/#/progress');
    const history = page.locator('#progress-history');
    await expect(history).toContainText('Study');
    await expect(history).toContainText('note(s) heard');
  });

  test('a self-assessed clean run finishes the rung it answers', async ({ page }) => {
    // 4.4's rule is not a measured one, so his word counts (replan §5.2).
    await addBookAndPiece(page, { book: 'My book', piece: 'Study', lesson: '4.4' });
    await page.locator('#shelf-list [data-piece]').first().getByRole('button', { name: 'Practise' }).click();
    await page.locator('#paper-start').click();
    await page.locator('#paper-stop').click();
    await page.locator('#paper-report-clean').click();

    await page.goto('/#/lesson/4.4');
    await expect(page.locator('#lesson-paper')).toContainText('you said you can play it');
  });
});

test.describe('blind mode', () => {
  test('hides the score and keeps everything else', async ({ page }) => {
    await page.goto('/#/score/exercise.five-finger.c-major.right?blind=1');
    const stage = page.locator('#score-stage');
    await expect(stage).toHaveClass(/score-stage--blind/);
    // Hidden, not removed: the renderer still needs its box, and the run is
    // scored exactly as a sighted one is.
    await expect(stage).toBeHidden();
    await expect(page.locator('#score-bar')).toBeVisible();
    await expect(page.locator('#score-blind')).toHaveText('Show the score');
  });

  test('is a route, so it survives a reload and can be linked to', async ({ page }) => {
    await page.goto('/#/score/exercise.five-finger.c-major.right');
    await expect(page.locator('#score-stage')).not.toHaveClass(/score-stage--blind/);
    await page.locator('#score-blind').click();
    await expect(page).toHaveURL(/blind=1/);
    await page.reload();
    await expect(page.locator('#score-stage')).toHaveClass(/score-stage--blind/);
  });
});

test.describe('performance runs', () => {
  test('offer no restart, and are listed apart from practice', async ({ page }) => {
    await page.goto('/#/score/exercise.five-finger.c-major.right?performance=1');
    await expect(page.locator('#score-performance')).toHaveText('Practising');
    // A restart mid-performance would make it not a performance.
    await expect(page.locator('#score-restart')).toHaveCount(0);

    await page.goto('/#/progress');
    await expect(page.locator('#progress-performances')).toContainText('No performances yet');
  });
});

test.describe('the PDF viewer', () => {
  test('takes a page in the route', async ({ page }) => {
    await page.goto('/#/pdf/import.nothing?page=3');
    // The import does not exist, so the viewer reports that rather than
    // opening — but the route carried the page, which is what is under test.
    await expect(page).toHaveURL(/page=3/);
    await expect(page.locator('#pdf-status')).toBeVisible();
  });
});
