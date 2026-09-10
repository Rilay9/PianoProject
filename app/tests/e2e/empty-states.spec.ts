/**
 * `04` §0 R4 — nothing dead.
 *
 * When a screen's subject is missing it draws the sentence that says so and the
 * one control that acts on it. No empty grid, no live transport over nothing,
 * no "Disconnect" while disconnected, no statistic with no data behind it.
 */
import { expect, type Page, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
});

/**
 * Reason before remedy: the sentence must come before the control, in document
 * order *and* on the screen.
 *
 * A button whose explanation is underneath it is a button you press to find
 * out what it does — which is the fault the first of these tests was written
 * for and the one every screen below repeats. Both checks are here because
 * either alone can pass while the other fails: `order` misses a control the
 * layout floats above its sentence, and `top` misses two elements on the same
 * line.
 */
async function expectSaidBeforeDone(page: Page, said: string, done: string): Promise<void> {
  await expect(page.locator(said)).toBeVisible();
  await expect(page.locator(done)).toBeVisible();
  const order = await page.evaluate(
    ([saidSelector, doneSelector]) => {
      const sentence = document.querySelector(saidSelector);
      const control = document.querySelector(doneSelector);
      if (!sentence || !control) return null;
      return {
        saidFirst:
          (sentence.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
        saidTop: sentence.getBoundingClientRect().top,
        actTop: control.getBoundingClientRect().top,
      };
    },
    [said, done],
  );
  expect(order?.saidFirst, `${said} must come before ${done} in document order`).toBe(true);
  expect(order?.saidTop ?? 0, `${said} must sit above ${done}`).toBeLessThanOrEqual(
    order?.actTop ?? 0,
  );
}

test('a chart with no chords draws the sentence and one button', async ({ page }) => {
  await page.goto('/#/chart/song.folk.hot-cross-buns');
  await expect(page.locator('#chart-status')).toContainText('no chord symbols', {
    timeout: 30_000,
  });
  // The one control that does what the sentence suggests — and *under* it.
  // The status line belongs at the foot of a working chart, which is where it
  // is built; with no chart, the button came first and the sentence that
  // explains it came second.
  await expect(page.locator('#chart-open-score')).toBeVisible();
  const order = await page.evaluate(() => {
    const said = document.querySelector('#chart-status');
    const act = document.querySelector('#chart-open-score');
    if (!said || !act) return null;
    return {
      saidFirst: (said.compareDocumentPosition(act) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      saidTop: said.getBoundingClientRect().top,
      actTop: act.getBoundingClientRect().top,
    };
  });
  expect(order?.saidFirst).toBe(true);
  expect(order?.saidTop).toBeLessThan(order?.actTop ?? 0);
  // The empty grid is gone from the layout, not merely emptied: `[hidden]`
  // loses to `.chart-grid { display: grid }` unless something says otherwise.
  await expect(page.locator('#chart-grid')).toBeHidden();
  expect(
    await page.locator('#chart-grid').evaluate((el) => getComputedStyle(el).display),
  ).toBe('none');
  await expect(page.locator('[data-screen="chart"] button')).toHaveCount(2); // back + open
  // And none of the furniture that made it look like a working chart.
  await expect(page.locator('.chart-cell')).toHaveCount(0);
  await expect(page.locator('#chart-form')).toBeHidden();
  await page.locator('#chart-open-score').click();
  await expect(page).toHaveURL(/#\/score\//);
});

test('the microphone screen never says "not connected (not connected)"', async ({ page }) => {
  await page.goto('/#/settings/mic');
  const status = page.locator('#mic-status');
  await expect(status).toBeVisible();
  const text = (await status.textContent()) ?? '';
  expect(text.toLowerCase()).not.toContain('not connected (not connected)');
  // Nothing to disconnect from, so nothing offering to.
  await expect(page.locator('#mic-disconnect')).toBeHidden();
});

test('the score folder draws no browse controls with no folder', async ({ page }) => {
  await page.goto('/#/library/folder');
  await expect(page.locator('#folder-how')).toBeVisible();
  // Filters and a search box over a list that cannot exist yet.
  await expect(page.locator('#folder-search')).toHaveCount(0);
  // The explanation is behind a summary, not four lines above the button.
  await expect(page.locator('#folder-how summary')).toBeVisible();
});

test('the heat map says what it measures and what the shades mean', async ({ page }) => {
  await page.goto('/#/progress');
  await expect(page.getByRole('heading', { name: 'Minutes a day, last 13 weeks' })).toBeVisible();
  const key = page.locator('#progress-heatmap-key');
  await expect(key).toBeVisible();
  await expect(key).toContainText('45+ min');
});

/* --- the rest of the family ------------------------------------------------
   The chart above was one instance of a kind: a screen whose subject is
   missing, saying so, and then drawing the working version anyway. These are
   the others that turned out to be real. */

test('a chart for a piece that is not there draws no transport over nothing', async ({ page }) => {
  // Before: `findItem` came back empty, the status line said "Unknown item"
  // and the screen went on to draw a count-off, a stop, a bpm field and three
  // live toggles over four bars that were never built. Every failing path
  // through this screen ended that way; only the no-chords one had a cure.
  await page.goto('/#/chart/nosuchpieceatall');
  await expect(page.locator('#chart-status')).toContainText('nothing in the library called', {
    timeout: 30_000,
  });
  await expectSaidBeforeDone(page, '#chart-status', '#chart-open-library');

  // No live transport over a chart that does not exist.
  for (const dead of ['#chart-start', '#chart-stop', '#chart-bpm', '#chart-swing', '#chart-comp', '#chart-backing']) {
    await expect(page.locator(dead), dead).toHaveCount(0);
  }
  await expect(page.locator('#chart-grid')).toBeHidden();
  await expect(page.locator('.chart-cell')).toHaveCount(0);
  await expect(page.locator('#chart-form')).toBeHidden();
  await expect(page.locator('[data-screen="chart"] button')).toHaveCount(2); // back + library

  await page.locator('#chart-open-library').click();
  await expect(page).toHaveURL(/#\/library$/);
});

test('a lesson that does not exist draws one sentence, not six empty sections', async ({ page }) => {
  // `#/lesson/9.9` parses — the id pattern allows it — so this is one mistyped
  // hash away. Before: the sentence, and under it Exercise options, Song
  // options, From your own books, More for this rung, Concept and Videos, all
  // empty, and nothing on the screen that went anywhere.
  await page.goto('/#/lesson/9.9');
  await expect(page.locator('#lesson-status')).toContainText('There is no lesson', {
    timeout: 30_000,
  });
  await expectSaidBeforeDone(page, '#lesson-status', '#lesson-open-plan');

  await expect(page.locator('[data-screen="lesson"] .block:not([hidden])')).toHaveCount(0);
  await expect(page.locator('#lesson-exercises')).toBeHidden();
  await expect(page.locator('#lesson-songs')).toBeHidden();
  await expect(page.locator('#lesson-videos')).toBeHidden();
  // Nothing acting on a rung that is not there.
  for (const dead of ['#lesson-know', '#lesson-check', '#lesson-done', '#lesson-import-for']) {
    await expect(page.locator(dead), dead).toHaveCount(0);
  }

  await page.locator('#lesson-open-plan').click();
  await expect(page).toHaveURL(/#\/plan$/);
  await expect(page.locator('.list-row[data-stage="0"]')).toBeVisible();
});

test('a search that matches nothing offers the way back to everything', async ({ page }) => {
  // Before: "Nothing matches. Try clearing a filter, or import a score." — over
  // a filter row that is closed by default, so the advice named a control that
  // was not on the screen.
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 30_000 });
  await page.locator('#library-search').fill('zzzznothinghere');
  await expect(page.locator('#library-empty')).toContainText('zzzznothinghere');
  await expectSaidBeforeDone(page, '#library-empty', '#library-show-everything');
  await expect(page.locator('#library-list .list-row')).toHaveCount(0);

  await page.locator('#library-show-everything').click();
  await expect(page.locator('#library-search')).toHaveValue('');
  await expect(page.locator('#library-list .list-row').first()).toBeVisible();
  await expect(page.locator('#library-empty')).toHaveCount(0);
});

test('a filter left on behind a closed row can be undone from the empty list', async ({ page }) => {
  // The worse half of the same fault: the filter row collapses, so the thing
  // that emptied the list is not on the screen at all. The count line names it,
  // which is how you know *what* is wrong; this is how you undo it.
  await page.goto('/#/library');
  await expect(page.locator('#library-count')).toContainText(/of \d+ items/, { timeout: 30_000 });
  await page.locator('#library-filter-toggle').click();
  await page.locator('#library-status-filter').selectOption('mastered');
  await page.locator('#library-filter-toggle').click(); // and closed again
  await expect(page.locator('#library-filters')).toBeHidden();

  await expect(page.locator('#library-empty')).toContainText('Mastered');
  await expectSaidBeforeDone(page, '#library-empty', '#library-show-everything');

  await page.locator('#library-show-everything').click();
  await expect(page.locator('#library-list .list-row').first()).toBeVisible();
  // The select is reset too, or the count line would go on naming a filter
  // that is no longer applied.
  await expect(page.locator('#library-status-filter')).toHaveValue('all');
  await expect(page.locator('#library-count')).not.toContainText('Mastered');
});

test('Progress on a fresh phone pairs each empty list with a way to fill it', async ({ page }) => {
  // Three lists, all empty on day one. All three said so and stopped there —
  // and the Performances line named the Score screen without offering a route
  // to one.
  await page.goto('/#/progress');
  await expect(page.locator('#progress-repertoire')).toContainText('Nothing mastered yet', {
    timeout: 30_000,
  });
  await expect(page.locator('#progress-performances')).toContainText('No performances yet');
  await expect(page.locator('#progress-history')).toContainText('No runs recorded yet');

  await expectSaidBeforeDone(page, '#progress-repertoire p', '#progress-repertoire-start');
  await expectSaidBeforeDone(page, '#progress-performances p', '#progress-performances-pick');
  await expectSaidBeforeDone(page, '#progress-history p', '#progress-history-start');

  // `04` §0 R3: one filled box on the screen, and it is not one of these.
  await expect(page.locator('#progress-repertoire-start')).toHaveClass(/link-button/);
  await expect(page.locator('#progress-history-start')).toHaveClass(/link-button/);
  await expect(page.locator('#progress-performances-pick')).toHaveClass(/link-button/);

  await page.locator('#progress-performances-pick').click();
  await expect(page).toHaveURL(/#\/library$/);
});

test('a refused microphone says what to do instead, and stops pretending to listen', async ({
  page,
}) => {
  // Chrome remembers a refusal, so "Connect microphone" can never work again
  // from inside the page. Before: the raw message off the exception —
  // "microphone permission was refused" — under that button, over a level meter
  // reading "Level: —" and a calibration routine whose first act is to connect.
  await page.addInitScript(() => {
    // Shadowing the prototype method on the instance, rather than granting or
    // revoking a real permission: what the screen has to get right is the
    // `NotAllowedError` that comes back, and this is the only way to be sure
    // that is what arrives on every machine the suite runs on.
    navigator.mediaDevices.getUserMedia = () => {
      const refusal = new Error('Permission denied');
      refusal.name = 'NotAllowedError';
      return Promise.reject(refusal);
    };
  });
  await page.goto('/#/settings/mic');
  await expect(page.locator('#mic-connect')).toBeVisible({ timeout: 30_000 });
  await page.locator('#mic-connect').click();

  const status = page.locator('#mic-status');
  await expect(status).toContainText('will not ask again');
  await expect(status).toContainText('MIDI');
  await expectSaidBeforeDone(page, '#mic-status', '#mic-use-midi');

  // Nothing left on the screen that acts on a microphone there is no way to
  // have: no meter, no calibration, and no button offering to try again at
  // something the browser has already settled.
  await expect(page.locator('#mic-level')).toBeHidden();
  await expect(page.locator('#mic-calibrate')).toBeHidden();
  await expect(page.locator('#mic-connect')).toBeHidden();
  await expect(page.locator('#mic-disconnect')).toBeHidden();

  await page.locator('#mic-use-midi').click();
  await expect(page).toHaveURL(/#\/settings\/midi$/);
});

test('a stage with nothing on the tracks you have on says so and offers the tracks', async ({
  page,
}) => {
  // Stages 5 to 9 have no `core` units at all, so switching off the four side
  // tracks that are on by default empties them. Before: the row opened onto
  // nothing whatever, under a header still counting "3 of 12 lessons" —
  // completion is counted over the whole stage, not over what is drawn.
  await page.goto('/#/plan');
  await expect(page.locator('.list-row[data-stage="5"]')).toBeVisible({ timeout: 30_000 });

  await page.locator('#plan-tracks-open').click();
  for (const track of ['classical', 'chords-pop', 'theory-ear', 'technique']) {
    await page.locator(`#plan-track-${track}`).click();
    await expect(page.locator(`#plan-track-${track}`)).toHaveAttribute('aria-pressed', 'false');
  }
  await page.locator('#plan-tracks-sheet-close').click();
  await expect(page.locator('#plan-tracks-sheet')).toHaveCount(0);

  await page.locator('.list-row[data-stage="5"]').click();
  await expect(page.locator('.list-row[data-stage="5"]')).toHaveAttribute('data-open', 'true');
  const said = page.locator('p[data-empty-stage="5"]');
  await expect(said).toContainText('tracks you have switched on');
  await expectSaidBeforeDone(page, 'p[data-empty-stage="5"]', '#plan-stage-tracks-5');

  // The remedy is the sheet the sentence is about.
  await page.locator('#plan-stage-tracks-5').click();
  await expect(page.locator('#plan-tracks-sheet')).toBeVisible();
  await page.locator('#plan-track-classical').click();
  await page.locator('#plan-tracks-sheet-close').click();
  await expect(page.locator('p[data-empty-stage="5"]')).toHaveCount(0);
  await expect(page.locator('.list-row[data-lesson]').first()).toBeVisible();
});

/**
 * The error banner, since its positioning moved from `fixed` to `absolute`.
 *
 * A guard, not a fix: nothing in `ui/errorBoundary.ts` reads the viewport, so
 * the change needed no code. What it does depend on is that `body` is the
 * banner's containing block — `position: relative`, `height: 100dvh`,
 * `overflow: hidden` — and that the *document* never scrolls, only the shell's
 * own scroll region does. Both of those are one stylesheet edit or one changed
 * `root` argument away from being untrue, and neither would show up anywhere
 * else in the suite.
 */
test('the error banner stays on the visible bottom edge while a long list scrolls', async ({
  page,
}) => {
  await page.goto('/#/library');
  await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'e2e boom' }));
  });
  const banner = page.locator('#error-banner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('e2e boom');

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const before = await banner.boundingBox();
  expect(before).not.toBeNull();
  expect(before?.y ?? 0).toBeGreaterThanOrEqual(0);
  expect((before?.y ?? 0) + (before?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0);

  // The shell's own scroll region, which is the only thing that scrolls.
  await page.evaluate(() => {
    const scroller = document.querySelector('[data-screen="library"] .screen-body');
    if (scroller) scroller.scrollTop = 2000;
  });
  await expect
    .poll(async () =>
      page.locator('#library-list').evaluate((el) => el.getBoundingClientRect().top),
    )
    .toBeLessThan(0);

  // An absolute child of a body that does not scroll does not move with the
  // list. Appended into `.screen-body` instead, it would have gone with it.
  const after = await banner.boundingBox();
  expect(after?.y).toBeCloseTo(before?.y ?? -1, 0);
  expect((after?.y ?? 0) + (after?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0);

  await page.locator('#error-dismiss').click();
  await expect(banner).toHaveCount(0);
});
