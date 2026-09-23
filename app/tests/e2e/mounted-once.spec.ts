/**
 * One navigation builds one screen — from Plan and from the Library alike.
 *
 * Entry 52: `Router.setRoute`'s dedupe compared the *tab*, and a pushed route
 * (score, chart, drill, lab) writes no tab into its hash, so `parseHash` had
 * to guess one. From Today the guess matched and the `hashchange` echo was
 * swallowed; **from Plan or the Library it did not**, and the route was
 * emitted twice. The Score screen was then built twice, and the invisible copy
 * subscribed a second session to the shared MIDI input and recorded a run of
 * its own over the learner's.
 *
 * That entry fixed the dedupe and measured the consequence **on the Score
 * screen only**, and said so: *"the same route echo built the chart, the drill
 * and the lab twice as well, by the same arithmetic… what the other three were
 * doing twice was not looked at."* This is that, one assertion each.
 *
 * A double mount leaves no mark on the DOM — the shell empties `main` and
 * appends the second one, so either way there is one of it on the page. So the
 * shell counts its builds into `window.__pianopath.screenMounts`, and that is
 * what is read here.
 */
import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 342, height: 740 };
/** A rung with a drill among its exercises, and one with a lab preset. */
const DRILL_RUNG = '1.1';
const DRILL = 'drill.reading.note-flash-treble-c4-g4';
const LAB_RUNG = 'chords-pop.3';
/**
 * A bundled piece that carries chord symbols.
 *
 * It has to: the Score screen's *Open the chart* row is hidden on a piece with
 * none, because a chart of a piece with no symbols is a screen of empty bars.
 */
const CHART_PIECE = 'exercise.blues.twelve-bar-shuffle.c';

test.use({ viewport: PHONE });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pianopath.firstSight', '["*"]');
  });
});

/** The shell's own counter, as the page exposes it. */
type Hooked = Window & { __pianopath?: { screenMounts?: Record<string, number> } };

/**
 * How many times the shell has built this screen since **this document**
 * loaded.
 *
 * Per document, not per test: `page.goto` to a different path is a real page
 * load and the counter starts again, so every assertion below is a difference
 * across one door rather than a running total.
 */
async function mounts(page: Page, screen: string): Promise<number> {
  return page.evaluate(
    (name) => (window as unknown as Hooked).__pianopath?.screenMounts?.[name] ?? 0,
    screen,
  );
}

test.describe('one navigation, one screen', () => {
  test('a drill, opened from Plan and from the Library', async ({ page }) => {
    // From Plan: the tab, the rung, the drill's own row.
    await page.goto('/#/plan');
    await expect(page.locator('[data-screen="plan"]')).toBeVisible({ timeout: 60_000 });
    await page.goto(`/#/lesson/${DRILL_RUNG}`);
    const row = page.locator(`#lesson-exercises .list-row[data-item="${DRILL}"]`);
    await expect(row).toBeVisible({ timeout: 60_000 });
    const beforePlan = await mounts(page, 'drill');
    await row.getByRole('button', { name: /Open/ }).click();
    await expect(page.locator('[data-screen="drill"]')).toBeVisible({ timeout: 60_000 });
    expect(
      (await mounts(page, 'drill')) - beforePlan,
      'the drill was built more than once from Plan',
    ).toBe(1);

    // From the Library: the tab, the search, the row itself.
    await page.goto('/#/library');
    await expect(page.locator('[data-screen="library"]')).toBeVisible({ timeout: 60_000 });
    await page.locator('#library-search').fill('Note flash');
    const libRow = page.locator(`#library-list .list-row[data-item="${DRILL}"]`);
    await expect(libRow.first()).toBeVisible({ timeout: 60_000 });
    const beforeLibrary = await mounts(page, 'drill');
    await libRow.first().click();
    await expect(page.locator('[data-screen="drill"]')).toBeVisible({ timeout: 60_000 });
    expect(
      (await mounts(page, 'drill')) - beforeLibrary,
      'the drill was built more than once from the Library',
    ).toBe(1);
  });

  test('the accompaniment lab, opened from Plan and from the Library', async ({ page }) => {
    await page.goto(`/#/lesson/${LAB_RUNG}`);
    await expect(page.locator('#lesson-tool-lab')).toBeVisible({ timeout: 60_000 });
    const beforeRung = await mounts(page, 'lab');
    await page.locator('#lesson-tool-lab').click();
    await expect(page.locator('[data-screen="lab"]')).toBeVisible({ timeout: 60_000 });
    expect(
      (await mounts(page, 'lab')) - beforeRung,
      'the lab was built more than once from a rung',
    ).toBe(1);

    await page.goto('/#/library');
    await expect(page.locator('#library-lab')).toBeVisible({ timeout: 60_000 });
    const beforeLibrary = await mounts(page, 'lab');
    await page.locator('#library-lab').click();
    await expect(page.locator('[data-screen="lab"]')).toBeVisible({ timeout: 60_000 });
    expect(
      (await mounts(page, 'lab')) - beforeLibrary,
      'the lab was built more than once from the Library',
    ).toBe(1);
  });

  test('the chord chart, opened from a rung and from the Library', async ({ page }) => {
    // The rung's door: the Chart button on a song row that has symbols.
    await page.goto(`/#/lesson/${DRILL_RUNG}`);
    await expect(page.locator('[data-screen="lesson"]')).toBeVisible({ timeout: 60_000 });
    const beforeRung = await mounts(page, 'chart');
    await page.evaluate(
      ([piece, rung]) => {
        window.location.hash = `#/chart/${String(piece)}?from=${String(rung)}`;
      },
      [CHART_PIECE, DRILL_RUNG],
    );
    await expect(page.locator('[data-screen="chart"]')).toBeVisible({ timeout: 60_000 });
    expect(
      (await mounts(page, 'chart')) - beforeRung,
      'the chart was built more than once from a rung',
    ).toBe(1);

    // The Library's door: the piece opens on the Score screen, and its `⋯`
    // sheet holds the chart.
    await page.goto('/#/library');
    await expect(page.locator('[data-screen="library"]')).toBeVisible({ timeout: 60_000 });
    await page.goto(`/#/score/${CHART_PIECE}`);
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    const beforeScore = await mounts(page, 'chart');
    await page.locator('#score-more').click();
    await page.getByRole('button', { name: 'Open the chart' }).click();
    await expect(page.locator('[data-screen="chart"]')).toBeVisible({ timeout: 60_000 });
    expect(
      (await mounts(page, 'chart')) - beforeScore,
      'the chart was built more than once from the score',
    ).toBe(1);
  });
});
