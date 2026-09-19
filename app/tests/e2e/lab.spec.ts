/**
 * The accompaniment lab (docs/04 §3c) and Today's daily sight-read (§2).
 *
 * Both are proved through their own doors rather than by deep-linking: the lab
 * is reached from the Library line it was added to, and the daily card is read
 * off the screen the app opens on, because "you cannot get there" is the way
 * either of them would actually fail.
 *
 * The two halves of the lab need different kinds of proof. *Read it* ends on
 * the Score screen, and what has to be true there is that the notation is the
 * one the settings asked for — which is checkable because the exercise's title
 * *is* its settings, and because the screen's own `data-bars` says how many
 * bars the chart and the score were both built from. *Jam it* ends nowhere:
 * nothing is judged and nothing is recorded, so what has to be true is that
 * the bars are on the screen, the loop says it is running, and Stop stops it.
 */
import { expect, test, type Page } from '@playwright/test';

/** What a lab import's id always begins with. */
const LAB_ROW = '.list-row[data-item^="import.lab-"]';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      // A cleared origin is a first launch, and a first launch is the setup
      // tour (docs/04 §7d); neither of these screens is about that.
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

/** Opens the lab the way a learner does: from the Library's own line of doors. */
async function openLab(page: Page): Promise<void> {
  await page.goto('/#/library');
  await expect(page.locator('#library-lab')).toBeVisible();
  await page.locator('#library-lab').click();
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
}

/**
 * How many lab builds are in the library.
 *
 * Under *Yours first*, because the default sort is by level and the list is
 * windowed a page at a time — a lab score filed at level 3 among 1,500
 * catalog rows is not on the first page, and counting what is drawn would be
 * counting the window rather than the library.
 */
async function labRowCount(page: Page): Promise<number> {
  await page.goto('/#/library');
  await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 30_000 });
  // The sort lives in the filter row, folded away until Filter is tapped.
  await page.locator('#library-filter-toggle').click();
  await page.locator('#library-sort').selectOption('recent');
  await expect(page.locator(LAB_ROW).first()).toBeVisible({ timeout: 30_000 });
  return page.locator(LAB_ROW).count();
}

test.describe('the accompaniment lab', () => {
  test.setTimeout(120_000);

  test('opens from the Library and says what it is about to build', async ({ page }) => {
    await openLab(page);
    expect(page.url()).toContain('#/lab');
    await expect(page.locator('.screen-header h1')).toHaveText('Accompaniment lab');
    // The summary is the subject of the two buttons under it, so it has to say
    // every choice they act on.
    await expect(page.locator('#lab-summary')).toContainText('C major');
    await expect(page.locator('#lab-summary')).toContainText('I–V–vi–IV');
    await expect(page.locator('#lab-summary')).toContainText('8 bars');
    // Back is the way it came (`04` §1: a pushed screen returns to its tab).
    await page.locator('#lab-back').click();
    await expect(page.locator('#library-list')).toBeVisible();
  });

  test('Read it lands on the Score screen with the bars that were chosen', async ({ page }) => {
    await openLab(page);
    await page.locator('#lab-key').selectOption('g-major');
    await page.locator('#lab-bars-8').click();
    await page.locator('#lab-left-alberti').click();
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-bars', '8');

    await page.locator('#lab-read').click();
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    expect(page.url()).toContain('#/score/import.lab-');
    // The title is the settings: the progression, the key, the hands and the
    // number of bars the notation was written from.
    const title = page.locator('#score-title');
    await expect(title).toContainText('I–V–vi–IV in G major');
    await expect(title).toContainText('alberti');
    await expect(title).toContainText('8 bars');
    // And it really is notation — the engraver parsed it and drew something.
    await page.waitForFunction(
      () => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      },
      undefined,
      { timeout: 60_000 },
    );
  });

  test('building the same settings twice leaves one row, not two', async ({ page }) => {
    await openLab(page);
    await page.locator('#lab-read').click();
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });

    await openLab(page);
    await page.locator('#lab-read').click();
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });

    expect(await labRowCount(page)).toBe(1);

    // A different combination is a different exercise and gets its own row —
    // the replacement is per settings, not "one lab score ever".
    await openLab(page);
    await page.locator('#lab-bars-16').click();
    await page.locator('#lab-read').click();
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    expect(await labRowCount(page)).toBe(2);
  });

  test('Jam it shows the chords bar by bar, lights the keys, and stops', async ({ page }) => {
    await openLab(page);
    await page.locator('#lab-key').selectOption('g-major');

    await page.locator('#lab-jam-start').click();
    await expect(page.locator('#lab-jam')).toBeVisible();
    // One cell a bar, in the order the progression names them.
    await expect(page.locator('#lab-jam-grid .chart-cell')).toHaveCount(8);
    await expect(page.locator('#lab-jam-grid .chart-cell[data-bar="1"]')).toHaveText('G');
    await expect(page.locator('#lab-jam-grid .chart-cell[data-bar="3"]')).toHaveText('Em');
    await expect(page.locator('#lab-jam-form')).toContainText('Bar 1 of 8');
    // The current bar is marked, so "where am I" is answerable at a glance.
    await expect(page.locator('#lab-jam-grid .chart-cell[data-current="true"]')).toHaveCount(1);
    // The keys are a guide to the bar's chord, not an expectation: nothing is
    // judged here, and nothing is recorded.
    await expect(page.locator('#lab-strip .keyboard-strip')).toBeVisible();
    await expect(page.locator('#lab-strip .key.is-expected')).toHaveCount(3);
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute(
      'data-jam',
      'running',
      { timeout: 30_000 },
    );
    await expect(page.locator('#lab-status')).toContainText('judged or recorded');

    await page.locator('#lab-jam-stop').click();
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'stopped');
    // A stopped loop leaves the chart standing — it is a chord chart, and
    // reading one is what somebody stopped the loop to do.
    await expect(page.locator('#lab-jam-grid .chart-cell')).toHaveCount(8);
  });

  test('changing a setting under a running loop stops it rather than lying', async ({ page }) => {
    await openLab(page);
    await page.locator('#lab-jam-start').click();
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute(
      'data-jam',
      'running',
      { timeout: 30_000 },
    );
    await page.locator('#lab-left-walking').click();
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'stopped');
    await expect(page.locator('#lab-status')).toContainText('press Jam it again');
  });

  test('the twelve-bar blues brings its own bar counts with it', async ({ page }) => {
    await openLab(page);
    await page.locator('#lab-progression').selectOption('blues');
    // Twelve bars do not divide into eight, so the chips that cannot be right
    // are gone rather than pressed and impossible (`04` §0 R4).
    await expect(page.locator('#lab-bars-12')).toBeVisible();
    await expect(page.locator('#lab-bars-8')).toHaveCount(0);
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-bars', '12');

    await page.locator('#lab-jam-start').click();
    await expect(page.locator('#lab-jam-grid .chart-cell')).toHaveCount(12);
    await expect(page.locator('#lab-jam-grid .chart-cell[data-bar="1"]')).toHaveText('C7');
    await expect(page.locator('#lab-jam-grid .chart-cell[data-bar="5"]')).toHaveText('F7');
    await expect(page.locator('#lab-jam-grid .chart-cell[data-bar="9"]')).toHaveText('G7');
    await page.locator('#lab-jam-stop').click();
  });

  test('a numeral it cannot read is named, not guessed at', async ({ page }) => {
    await openLab(page);
    await page.locator('#lab-progression').selectOption('custom');
    await page.locator('#lab-custom').fill('I banana V');
    await page.locator('#lab-read').click();
    await expect(page.locator('#lab-status')).toContainText('banana');
    // And nothing was written: the screen is still the lab.
    await expect(page.locator('section[data-screen="lab"]')).toBeVisible();

    await page.locator('#lab-custom').fill('I ♭VII IV I');
    await expect(page.locator('#lab-summary')).toContainText('I–♭VII–IV–I');
    await page.locator('#lab-jam-start').click();
    await expect(page.locator('#lab-jam-grid .chart-cell[data-bar="2"]')).toHaveText('B♭');
    await page.locator('#lab-jam-stop').click();
  });
});

test.describe("Today's sight-read", () => {
  test.setTimeout(120_000);

  test('is a card of its own, with the day carried in the route', async ({ page }) => {
    await page.goto('/');
    const row = page.locator('#today-daily .list-row');
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row.locator('.list-row__title')).toHaveText("Today's sight-read");
    // Nothing read yet: no tick, and the run has not started.
    await expect(row).toHaveAttribute('data-done', 'false');
    await expect(row).toHaveAttribute('data-streak', '0');
    await expect(row.locator('.list-row__meta')).toContainText('Start a run');

    // The seed is what makes the day one phrase rather than a fresh one on
    // every tap, so it has to reach the route.
    const seed = await row.getAttribute('data-seed');
    expect(seed).toMatch(/^\d+$/);
    await row.locator('button[aria-label="Open today\'s sight-read"]').click();
    expect(page.url()).toContain(`seed=${seed ?? ''}`);
    await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  });

  test('ticks and starts counting once the day is read', async ({ page }) => {
    await page.goto('/');
    const row = page.locator('#today-daily .list-row');
    await expect(row).toBeVisible({ timeout: 30_000 });
    const itemId = await row.getAttribute('data-daily');
    expect(itemId).toBeTruthy();
    // The run that ticks the day is the one carrying the day's seed (`04`
    // §2); the row publishes it, so the test records what a tap would.
    const seed = Number(await row.getAttribute('data-seed'));
    expect(Number.isFinite(seed)).toBe(true);

    // A finished run, through the storage hook rather than by playing one:
    // the streak's question is what a *recorded* run does to the card, and
    // playing a generated exercise note by note would be testing the engine.
    await page.evaluate(async ({ id, seed }) => {
      await (
        window as unknown as {
          __pianopath: {
            recordRun: (result: Record<string, unknown>) => Promise<unknown>;
          };
        }
      ).__pianopath.recordRun({
        itemId: id,
        seed,
        mode: 'tempo',
        tempoPct: 100,
        // A fraction, as every recorded run's accuracy is (`SessionScore`):
        // 95 here was ninety-five hundred per cent.
        accuracy: 0.95,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 60_000,
        passed: true,
        masterEligible: false,
      });
    }, { id: itemId as string, seed });

    await expect(row).toHaveAttribute('data-done', 'true', { timeout: 30_000 });
    await expect(row).toHaveAttribute('data-streak', '1');
    await expect(row.locator('.list-row__meta')).toContainText('Day 1');
    await expect(row.locator('.badge')).toContainText('read today');

    // And it survives a reload, because it is written to the database and not
    // held in the screen.
    await page.reload();
    const again = page.locator('#today-daily .list-row');
    await expect(again).toHaveAttribute('data-done', 'true', { timeout: 30_000 });
    await expect(again).toHaveAttribute('data-streak', '1');
  });
});

/**
 * Presets (`04` §3c, added 2026-09-18).
 *
 * A preset is proved through its chip rather than by deep-linking, for the
 * reason the rest of this file gives: "you cannot get there" is how it would
 * actually fail, and the chip is the only door a learner has to one.
 *
 * What has to be true is the part that is easy to get wrong. Setting the
 * pickers is not interesting — it is one assignment. **Locking them is**: a
 * control that looks pressable and is not is a bug by `00-invariants` §1, and
 * a lock that is only a CSS opacity leaves a chip that still changes the thing
 * the preset exists to fix. So the test presses a locked control and asserts
 * the setting did not move, which fails against styling alone and passes only
 * against `disabled`.
 */
test('a preset sets the lab up, locks what it is about, and leaves the rest', async ({ page }) => {
  await openLab(page);

  // The row of ways in, and Free is the one that is on before any is chosen.
  await expect(page.locator('#lab-presets')).toBeVisible();
  await expect(page.locator('#lab-preset-none')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#lab-preset-blues-shuffle').click();

  // It is in the address, so a lesson can link to exactly this screen.
  await expect(page).toHaveURL(/preset=blues-shuffle/);
  await expect(page.locator('#lab-preset')).toHaveAttribute('data-preset', 'blues-shuffle');

  // The settings it chose.
  await expect(page.locator('#lab-progression')).toHaveValue('blues');
  await expect(page.locator('#lab-left-walking')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#lab-bars-12')).toHaveAttribute('aria-pressed', 'true');

  // The settings it locked: disabled, and pressing one changes nothing. The
  // twelve-bar form is the lesson, so the bar count is not the learner's here.
  await expect(page.locator('#lab-progression')).toBeDisabled();
  await expect(page.locator('#lab-left-alberti')).toBeDisabled();
  await page.locator('#lab-left-alberti').click({ force: true });
  await expect(page.locator('#lab-left-walking')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#lab-left-alberti')).toHaveAttribute('aria-pressed', 'false');

  // And the settings it left alone: key and tempo are still the learner's,
  // because transposing it and slowing it down is practising, not wandering.
  await expect(page.locator('#lab-key')).toBeEnabled();
  await expect(page.locator('#lab-bpm')).toBeEnabled();
  await page.locator('#lab-key').selectOption('f-major');
  await expect(page.locator('#lab-summary')).toContainText('F major');

  // Free gives every picker back.
  await page.locator('#lab-preset-none').click();
  await expect(page.locator('#lab-preset')).toHaveCount(0);
  await expect(page.locator('#lab-progression')).toBeEnabled();
});

/**
 * An id nothing answers to is dropped, not drawn.
 *
 * The same rule `?loop=` follows for a bar range a piece does not have: a
 * banner with no name in it is worse than no banner, and the screen still has
 * to work.
 */
test('an unknown preset id leaves an ordinary lab', async ({ page }) => {
  await page.goto('/#/lab?preset=not-a-preset');
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
  await expect(page.locator('#lab-preset')).toHaveCount(0);
  await expect(page.locator('#lab-progression')).toBeEnabled();
  await expect(page.locator('#lab-preset-none')).toHaveAttribute('aria-pressed', 'true');
});
