// A whole run, driven through the real UI (docs/04 §5, docs/05 §2–§3).
//
// The controls each have a test of their own in score.screen.spec.ts. This
// file asks the harder question: does a piece played correctly from the first
// note to the last end on a summary sheet that says so? It plays through the
// on-screen keyboard, which is a real InputSource — the engine cannot tell it
// from a cable.

import { expect, test, type Page } from '@playwright/test';

const ITEM = 'song.folk.hot-cross-buns';

/** Hot Cross Buns, right hand: E D C, E D C, C C C C, D D D D, E D C. */
const MELODY = [64, 62, 60, 64, 62, 60, 60, 60, 60, 60, 62, 62, 62, 62, 64, 62, 60];

async function openAndArm(page: Page, mode: 'wait' | 'tempo'): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
  );
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await page.locator('#score-input').selectOption('keys');
  await page.locator('#score-mode').selectOption(mode);
  await page.locator('#score-hands-R').click();
  // Part G: a pass needs 90 % accuracy *at 80 % tempo or better*, and the
  // default for a newly opened piece is 70 %. Playing a piece perfectly at
  // 70 % is correctly not a pass, so a test about passing has to say so.
  await page.locator('#score-tempo').fill('100');
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
    await expect(sheet).toContainText('Passed');
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
    const before = await page.locator('#score-stage .is-front').innerHTML();
    await press(page, 71);
    await press(page, 71);
    await page.waitForTimeout(300);
    expect(await page.locator('#score-stage .is-front').innerHTML()).toBe(before);
    await expect(page.locator('#score-summary')).toBeHidden();
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
