// A whole run, driven through the real UI (docs/04 §5, docs/05 §2–§3).
//
// The controls each have a test of their own in score.screen.spec.ts. This
// file asks the harder question: does a piece played correctly from the first
// note to the last end on a summary sheet that says so? It plays through the
// on-screen keyboard, which is a real InputSource — the engine cannot tell it
// from a cable.

import { expect, test, type Page } from '@playwright/test';

import { setTempoPercent, withScoreMenu } from './scoreControls';

const ITEM = 'song.folk.hot-cross-buns';

/** Hot Cross Buns, right hand: E D C, E D C, C C C C, D D D D, E D C. */
const MELODY = [64, 62, 60, 64, 62, 60, 60, 60, 60, 60, 62, 62, 62, 62, 64, 62, 60];

async function openAndArm(page: Page, mode: 'wait' | 'tempo'): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  // Sixty seconds, not the default five. Opening a score is a fetch, a parse
  // and an engraving, and with ten workers on one machine that is nowhere near
  // five seconds — this is where the suite flakes, not in the engine.
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
    { timeout: 60_000 },
  );
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await withScoreMenu(page, async () => {
    await page.locator('#score-input').selectOption('keys');
  });
  await page.locator('#score-mode').selectOption(mode);
  await page.locator('#score-hands-R').click();
  // Part G: a pass needs 90 % accuracy *at 80 % tempo or better*, and the
  // default for a newly opened piece is 70 %. Playing a piece perfectly at
  // 70 % is correctly not a pass, so a test about passing has to say so.
  await setTempoPercent(page, 100);
}

/** Presses a key on the strip, which feeds the shared ScreenKeyboardSource. */
async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${midi}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

test.describe('a whole run', () => {
  test.setTimeout(180_000);

  test('Wait mode: playing it correctly reaches the summary with full accuracy', async ({
    page,
  }) => {
    await openAndArm(page, 'wait');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-running',
      'true',
    );

    for (const midi of MELODY) await press(page, midi);

    const sheet = page.locator('#score-summary');
    await expect(sheet).toBeVisible({ timeout: 30_000 });
    await expect(sheet).toContainText(/Passed|Mastered/);
    // Wait mode with every step completed cleanly is 100 %, and the run had a
    // judging input, so there is no self-report to fall back on.
    await expect(sheet.locator('[data-stat="accuracy"]')).toHaveText('100%');
    await expect(page.locator('#summary-selfreport')).toHaveCount(0);
  });

  test('Wait mode: the score does not move on a wrong note', async ({ page }) => {
    await openAndArm(page, 'wait');
    await page.locator('#score-play').click();
    // A wrong note is judged and painted, but the cursor stays put — that is
    // the whole contract of Wait mode (docs/05 §2).
    const before = await page.locator('#score-stage .is-cursor').innerHTML();
    await press(page, 71);
    await press(page, 71);
    await page.waitForTimeout(300);
    expect(await page.locator('#score-stage .is-cursor').innerHTML()).toBe(before);
    await expect(page.locator('#score-summary')).toBeHidden();

    // …and the key he pressed goes red on the strip (`04` §5). The staff has
    // nowhere to put it — there is no B4 in the bar — so the strip is the
    // whole of the feedback, and it was showing nothing at all: the tour's
    // "a wrong note" scene could not be photographed in any form factor
    // because there was no red anywhere on the screen to photograph.
    await expect(page.locator('.keyboard-strip [data-midi="71"]')).toHaveClass(/is-wrong/);
  });

  test('Wait mode: playing it wrongly still finishes, with a lower score', async ({ page }) => {
    await openAndArm(page, 'wait');
    await page.locator('#score-play').click();
    for (const midi of MELODY) {
      await press(page, midi + 1); // a semitone out, every time
      await press(page, midi); // …then the right one, so the run can advance
    }
    const sheet = page.locator('#score-summary');
    await expect(sheet).toBeVisible({ timeout: 30_000 });
    await expect(sheet.locator('[data-stat="wrong-notes"]')).not.toHaveText('0');
    await expect(sheet.locator('[data-stat="accuracy"]')).not.toHaveText('100%');
  });
});

/**
 * Stopping is not finishing (round four of the tour, the state machines).
 *
 * The engine reports a stop as a `finished` event, and the screen took every
 * finish for the end of a run. So restarting a run — which a change of hands
 * does — opened the summary over the new run and wrote the half-run into the
 * practice history as a failure; `Hear it` reaching the end did the same for
 * a demonstration nobody played. And a loop's lap put the engine back at the
 * loop's first step without telling the cursor, which stayed on the last bar.
 */
test.describe('stopping, restarting and looping', () => {
  test.setTimeout(180_000);

  async function recordedRuns(page: Page): Promise<number> {
    return page.evaluate(async () => {
      type Hooked = Window & {
        __pianopath?: { exportAll: () => Promise<{ stores: Record<string, unknown[]> }> };
      };
      const file = await (window as Hooked).__pianopath?.exportAll();
      const rows = file?.stores.sessions;
      return Array.isArray(rows) ? rows.length : 0;
    });
  }

  test('changing hands mid-run restarts it without a summary or a recorded run', async ({ page }) => {
    await openAndArm(page, 'wait');
    await page.locator('#score-play').click();
    await press(page, 64);
    await press(page, 62);
    // `both`, not `L`: this piece has no left hand, and a Wait run with
    // nothing to wait for is refused rather than started.
    await page.locator('#score-hands-both').click();
    await page.waitForTimeout(500);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
    await expect(page.locator('#score-summary')).toBeHidden();
    expect(await recordedRuns(page)).toBe(0);
  });

  test('Hear it reaching the end is not a run', async ({ page }) => {
    await openAndArm(page, 'wait');
    await setTempoPercent(page, 130);
    await page.locator('#score-hear').click();
    const screen = page.locator('section[data-screen="score"]');
    await expect(screen).toHaveAttribute('data-hearing', 'true');
    await expect(screen).toHaveAttribute('data-running', 'false', { timeout: 90_000 });
    await expect(screen).toHaveAttribute('data-hearing', 'false');
    await expect(page.locator('#score-summary')).toBeHidden();
    expect(await recordedRuns(page)).toBe(0);
  });

  test('a loop lap puts the cursor back on the first bar', async ({ page }) => {
    await openAndArm(page, 'wait');
    // Two double-taps on the stage: a one-bar loop on the window's first bar.
    const stage = page.locator('#score-stage');
    await stage.dispatchEvent('dblclick');
    await stage.dispatchEvent('dblclick');
    await expect(page.locator('#score-loop')).toContainText('Bars 1–1');
    await page.locator('#score-play').click();
    const current = page.locator('#score-stage .score-note.is-current');
    await expect(current.first()).toHaveAttribute('data-midi', '64');
    // Bar 1 of Hot Cross Buns: E D C. The lap ends on the C…
    await press(page, 64);
    await press(page, 62);
    await press(page, 60);
    // …and the cursor is back on the E before anything else is played.
    await expect(current.first()).toHaveAttribute('data-midi', '64');
    await expect(page.locator('#score-summary')).toBeHidden();
  });
});
