/**
 * The learner's first note starts the clock (T8, docs/prompts/tasks/T8-latch-the-start.md).
 *
 * A Tempo run the learner leads holds on its first note until a key is struck,
 * then times everything from that key; the keyboard and Space start a run from
 * the ready screen; and a run following no input at all still keeps time by
 * the clock, because nothing could ever play the first note.
 *
 * The same habits as score.rhythm-ladder.spec.ts: settings seeded before the
 * page loads, and assertions on states the run publishes rather than on
 * milliseconds.
 */
import { expect, test, type Page } from '@playwright/test';

import { closeScoreMenu, openScoreMenu, pressControl, withScoreMenu } from './scoreControls';

const ITEM = 'song.folk.hot-cross-buns';

interface ScoreRun {
  step: number;
  expected: number[];
  pitches: number[];
  armed: boolean;
}

async function withSettings(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.addInitScript((p) => {
    const raw = localStorage.getItem('pianopath.settings');
    const stored = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...stored, ...(p as object) }));
  }, patch);
}

async function openScore(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
}

async function scoreRun(page: Page): Promise<ScoreRun | null> {
  return page.evaluate(
    () =>
      (window as unknown as { __pianopath?: { scoreRun?: () => ScoreRun | null } }).__pianopath?.scoreRun?.() ?? null,
  );
}

async function waitForRun(page: Page, want: (run: ScoreRun) => boolean, what: string): Promise<ScoreRun> {
  await expect
    .poll(async () => {
      const run = await scoreRun(page);
      return run !== null && want(run);
    }, { message: what, timeout: 30_000 })
    .toBe(true);
  return (await scoreRun(page))!;
}

async function useScreenKeys(page: Page): Promise<void> {
  await withScoreMenu(page, async () => {
    await page.locator('#score-input').selectOption('keys');
  });
  await page.locator('#score-mode').selectOption('tempo');
}

async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

test.describe('the first note starts the clock (T8)', () => {
  test('a Tempo run on the screen keys holds on the first note until it is played', async ({ page }) => {
    // The written tempo, not a slow one: the wait below has to be long enough
    // that a run which was *not* holding would visibly have moved on.
    await withSettings(page, { countInBars: 0, defaultTempoPct: 100 });
    await openScore(page);
    await useScreenKeys(page);
    await page.locator('#score-play').click();

    const held = await waitForRun(page, (run) => run.armed, 'the run holds for the first note');
    await expect(page.locator('#score-waiting')).toContainText('first note');
    // Holding, not frozen by accident: still holding, on the same step, after
    // more than a beat of the written tempo has gone by.
    await page.waitForTimeout(1_500);
    const still = await scoreRun(page);
    expect(still?.armed).toBe(true);
    expect(still?.step).toBe(held.step);

    await press(page, held.expected[0]);
    await waitForRun(page, (run) => !run.armed, 'the first note set the clock');
    await expect(page.locator('#score-waiting')).toBeHidden();
    // …and the clock is moving now.
    await waitForRun(page, (run) => run.step > held.step, 'the run moves on after the first note');
  });

  test('after a count-in, the count gets out of the way while it holds', async ({ page }) => {
    await withSettings(page, { countInBars: 1, defaultTempoPct: 100 });
    await openScore(page);
    await useScreenKeys(page);
    await page.locator('#score-play').click();
    // The count is drawn over the notation while it counts…
    await expect(page.locator('#score-countin')).toBeVisible({ timeout: 30_000 });
    await waitForRun(page, (run) => run.armed, 'the count ended and the run holds');
    // …and must not stay there over the notes the first one is read from.
    await expect(page.locator('#score-countin')).toBeHidden();
    await expect(page.locator('#score-waiting')).toContainText('first note');
  });

  test('a key on the ready screen starts the run, and with no count-in is its first note', async ({ page }) => {
    await withSettings(page, { countInBars: 0, defaultTempoPct: 30 });
    await openScore(page);
    await useScreenKeys(page);
    expect(await scoreRun(page)).toBeNull();

    await press(page, 64);
    // Started, and the key was played into it: the run is not still holding.
    await waitForRun(page, (run) => !run.armed, 'the key started the run and set its clock');
  });

  test('Space starts a run from the ready screen', async ({ page }) => {
    await withSettings(page, { countInBars: 1, defaultTempoPct: 30 });
    await openScore(page);
    await useScreenKeys(page);
    expect(await scoreRun(page)).toBeNull();
    // Space on a focused control belongs to that control; take focus off the
    // select the mode was just chosen with.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Space');
    await waitForRun(page, () => true, 'Space started a run');
  });

  test('with no input, a Tempo run keeps time by the clock', async ({ page }) => {
    await withSettings(page, { countInBars: 0, defaultTempoPct: 100 });
    await openScore(page);
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('none');
    });
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    const first = await waitForRun(page, () => true, 'the run started');
    expect(first.armed).toBe(false);
    await waitForRun(page, (run) => run.step > first.step, 'the clock moves the cursor with nothing played');
  });
});

test.describe('what the keys must not start (T8 review)', () => {
  test('with a count-in, the key that starts the run is not its first note', async ({ page }) => {
    await withSettings(page, { countInBars: 1, defaultTempoPct: 100 });
    await openScore(page);
    await useScreenKeys(page);
    await press(page, 64);
    // This pins the outcome, not the mechanism: at the count's start a key
    // would be a stray either way, so the test cannot tell "not played in"
    // from "played in and ignored" — only that the count plays and then holds.
    await waitForRun(page, (run) => run.armed, 'the count ended and the run holds');
  });

  test('after a run finishes by itself, a key does not start another; ▶ does', async ({ page }) => {
    await withSettings(page, { countInBars: 0 });
    await openScore(page);
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    // Free play ends without a summary, which is the case that slipped through.
    await page.locator('#score-mode').selectOption('free');
    await page.locator('#score-play').click();
    await waitForRun(page, () => true, 'the run started');
    for (let guard = 0; guard < 400; guard += 1) {
      const run = await scoreRun(page);
      if (run === null) break;
      for (const midi of run.pitches) await press(page, midi);
    }
    expect(await scoreRun(page)).toBeNull();
    await press(page, 64);
    await page.waitForTimeout(1_000);
    expect(await scoreRun(page)).toBeNull();
    // The bar folds away during a run; reveal it the way a person does.
    await pressControl(page, '#score-play');
    await waitForRun(page, () => true, '▶ starts the next run');
  });

  test('neither a key nor Space starts a run under the open ⋯ sheet', async ({ page }) => {
    await withSettings(page, { countInBars: 0, defaultTempoPct: 100 });
    await openScore(page);
    await useScreenKeys(page);
    await openScoreMenu(page);
    await press(page, 64);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Space');
    await page.waitForTimeout(1_000);
    expect(await scoreRun(page)).toBeNull();
    await closeScoreMenu(page);
    await press(page, 64);
    await waitForRun(page, () => true, 'with the sheet closed, the key starts the run');
  });
});
