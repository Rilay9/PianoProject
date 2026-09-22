/**
 * Rhythm only, driven (T17; `04` §4 *Open as…*, §5, `05` §3a).
 *
 * The one mode in T17's list that is deliberately **not** a rung's tool: it is
 * a remembered setting the Library writes before navigating, so it has no
 * address and a button for it on a rung would open the wrong thing (`04`
 * §3d). Its door is the `⋯` beside *Details* on a Library row, and that is
 * where this starts.
 *
 * Judged as a learner:
 *
 *  - the sheet says what each choice does before it is tapped — one tap opens
 *    the piece, so there is no second chance to read it;
 *  - the run answers a tap on **any** key, which is the whole mode, and the
 *    summary is headed as what it was rather than as a failed run of the
 *    piece;
 *  - the remembered setting does not leak: a later *Keep tempo* from the same
 *    sheet is not silently a rhythm run.
 *
 * And one thing recorded rather than asserted: while a rhythm run is going,
 * the bar says *Keep tempo* and nothing on the screen outside the `⋯` sheet
 * says the notes are not being judged. That is in Entry 38.
 *
 * **Nothing here is heard.**
 */
import { expect, test, type Page } from '@playwright/test';

import { setTempoPercent, withScoreMenu } from './scoreControls';

type Hooked = Window & { __pianopath?: { scoreRun?: () => { pitches: number[] } | null } };

const PHONE = { width: 342, height: 740 };
/** Short, and every bar is the same rhythm — a rhythm run's easiest case. */
const SHORT = 'song.folk.hot-cross-buns';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

/** The Library's own `⋯`, opened over one named piece. */
async function openAsSheet(page: Page, itemId: string): Promise<void> {
  await page.goto('/#/library');
  await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 60_000 });
  const row = page.locator(`#library-list .list-row[data-item="${itemId}"]`);
  if ((await row.count()) === 0) {
    await page.locator('#library-search').fill(itemId.split('.').pop() ?? '');
  }
  await expect(row, `${itemId} is not in the library`).toBeVisible({ timeout: 30_000 });
  await row.locator('.library-openas').click();
  await expect(page.locator('#library-openas')).toBeVisible();
}

test('the sheet says what every choice does before one tap opens the piece', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await openAsSheet(page, SHORT);
  const sheet = page.locator('#library-openas');
  // The seven, each with the sentence §5 uses for it — the reading has to
  // happen here because the tap is the decision.
  await expect(sheet.locator('.list-row[data-openas]')).toHaveCount(7);
  await expect(sheet.locator('[data-openas="rhythm"]')).toContainText('judged on timing alone');
  await expect(sheet.locator('[data-openas="tempo"]')).toContainText('the mode that scores');
});

test('it opens judged on timing, answers any key, and says what the run was', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize(PHONE);
  await openAsSheet(page, SHORT);
  await page.locator('#library-openas [data-openas="rhythm"]').click();

  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
  // A rhythm run *is* a Keep tempo run — the only difference is that the
  // engine stops asking which key.
  await expect(screen).toHaveAttribute('data-mode', 'tempo');
  await expect(screen).toHaveAttribute('data-rhythm', 'true');
  await withScoreMenu(page, async () => {
    await page.locator('#score-input').selectOption('keys');
    await expect(page.locator('#score-rhythm')).toHaveText('On');
  });
  await setTempoPercent(page, 130);

  await page.locator('#score-play').click();
  await expect(screen).toHaveAttribute('data-running', 'true');
  // Tapped on one key, and not one the tune asks for: "any key, the right
  // moment" is the mode, and a run that only accepted the written note would
  // be an ordinary run with a different name.
  const sheet = page.locator('#score-summary');
  // The strip is built from the piece's own range, so "any key" means any key
  // this piece put on the screen — read off it rather than written down here.
  const onTheStrip = await page
    .locator('.keyboard-strip [data-midi]')
    .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-midi'))));
  expect(onTheStrip.length, 'the score drew no keys to tap').toBeGreaterThan(0);
  const wanted = await page.evaluate(
    () => (window as Hooked).__pianopath?.scoreRun?.()?.pitches ?? [],
  );
  const wrongKey = onTheStrip.find((midi) => !wanted.includes(midi)) ?? onTheStrip[0] ?? 60;
  expect(wanted, 'the key being tapped is the one the piece asks for').not.toContain(wrongKey);
  for (let tap = 0; tap < 200 && !(await sheet.isVisible()); tap += 1) {
    const key = page.locator(`.keyboard-strip [data-midi="${String(wrongKey)}"]`);
    await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
    await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
    await page.waitForTimeout(120);
  }
  await expect(sheet).toBeVisible({ timeout: 90_000 });
  // Headed as what it was. A rhythm run reported as "Not passed" would read as
  // a piece that failed, which it is not a claim about.
  await expect(sheet).toContainText('Rhythm run');
  await expect(sheet).not.toContainText(/Passed|Mastered/);
});

test('the remembered setting does not leak into the next Keep tempo', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize(PHONE);
  await openAsSheet(page, SHORT);
  await page.locator('#library-openas [data-openas="rhythm"]').click();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-rhythm', 'true', {
    timeout: 60_000,
  });

  // Every choice in that sheet writes `rhythmOnly`, not only this one —
  // otherwise one visit here would silently have made every later *Keep
  // tempo* a rhythm run, which is asking for one thing and being judged on
  // another.
  await openAsSheet(page, SHORT);
  await page.locator('#library-openas [data-openas="tempo"]').click();
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toBeVisible({ timeout: 60_000 });
  await expect(screen).toHaveAttribute('data-mode', 'tempo');
  await expect(screen).toHaveAttribute('data-rhythm', 'false');
});

test('the row is gone in a mode with no clock, which is where it would be dead', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize(PHONE);
  await page.goto(`/#/score/${SHORT}?mode=wait`);
  await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
  await withScoreMenu(page, async () => {
    // Gone rather than empty (`04` §0 R4): sideways the sheet is a grid.
    await expect(page.locator('#score-rhythm-row')).toBeHidden();
  });
});
