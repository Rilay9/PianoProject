/**
 * The ladder route, met from the rung whose button carries it (T17; `04` §3d,
 * `05` §6).
 *
 * `score.ladder-route.spec.ts` proves the destination of `?ladder=1` typed at
 * the screen. It never presses the button, and the button is the whole point:
 * seven rungs named no mode at all until this one existed, so what matters is
 * that a learner on `4.1` can tap *Tempo ladder* and find themselves looping
 * a scale with the tempo armed — and that the two controls saying so are
 * where a person would look.
 *
 * Judged as a learner, upright and sideways:
 *
 *  - the button opens the exercise it claims (`data-item`), not a song;
 *  - the tempo figure that is about to move by itself is marked as such, and
 *    the Loop and Ladder rows both say what they are doing (`05` §6's whole
 *    invariant: two things on screen have asked);
 *  - the notes play into the run — the cursor moves and the keys light the
 *    next thing — so the ladder has something to judge;
 *  - Back leaves it off: the same piece reopened by an ordinary tap is not
 *    still looping with an armed ladder.
 *
 * **Nothing here is heard**, and nothing here climbs: whether a clean pass
 * actually raises the tempo is `score.rhythm-ladder.spec.ts`, which drives a
 * run to the ceiling.
 */
import { expect, test, type Page } from '@playwright/test';

import { openScoreMenu, revealBar } from './scoreControls';

const PHONE = { width: 342, height: 740 };
const SIDEWAYS = { width: 740, height: 342 };

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

/** The keys the strip is asking for right now — the read-ahead, as drawn. */
async function litKeys(page: Page): Promise<string> {
  return (
    await page
      .locator('.keyboard-strip .key.is-expected')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-midi') ?? ''))
  ).join(',');
}

/** Presses a key on the strip, which feeds the shared ScreenKeyboardSource. */
async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

/** `4.1`'s own button — one of the seven rungs that named no mode before it. */
async function ladderFromTheRung(page: Page): Promise<string> {
  await page.goto('/#/lesson/4.1');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const tool = page.locator('#lesson-tool-ladder');
  await expect(tool).toBeVisible();
  // The button says which exercise it will open, so the assertion is "it went
  // where it said" rather than an id copied into this file.
  const claimed = await tool.getAttribute('data-item');
  expect(claimed, 'the ladder tool names no item, so this proves nothing').toBeTruthy();
  // And it must be one of *this rung's* own exercises: `validate.py` refuses
  // an `item` written on a ladder tool, so the rung's first notated exercise
  // is the claim being checked.
  const offered = await page
    .locator('#lesson-exercises .list-row[data-item]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-item')));
  expect(offered, `the ladder opens ${claimed ?? ''}, which the rung does not offer`).toContain(
    claimed,
  );
  await tool.click();
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
  return claimed ?? '';
}

test('the rung’s button opens its exercise, looping, with the ladder armed', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(PHONE);
  const claimed = await ladderFromTheRung(page);
  expect(new URL(page.url()).hash).toContain(encodeURIComponent(claimed));

  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-ladder', 'on');
  await expect(screen).toHaveAttribute('data-mode', 'tempo');
  await expect(screen).not.toHaveAttribute('data-loop', '');

  // The figure that is about to move by itself is marked as such on the bar,
  // which is the half of `05` §6 that is in front of the learner: a number
  // changing on its own reads as a fault unless something says it is meant to.
  await revealBar(page);
  await expect(page.locator('#score-tempo-label')).toBeVisible();
  const decoration = async (): Promise<string> =>
    page
      .locator('#score-tempo-label')
      .evaluate((el) => getComputedStyle(el).textDecorationLine);
  const whileOn = await decoration();

  // …and the other half is in the sheet: two controls, both showing their
  // state, so nothing is on that nothing asked for.
  await openScoreMenu(page);
  await expect(page.locator('#score-ladder-row')).toBeVisible();
  await expect(page.locator('#score-ladder')).toHaveText('On');
  await expect(page.locator('#score-loop')).not.toHaveText('Off');

  // Letting the loop go switches the ladder off, and the mark has to go with
  // it — the two states of the same label, which is the comparison, rather
  // than a style string written down here as if it were the rule.
  await page.locator('#score-loop').click();
  await expect(screen).toHaveAttribute('data-ladder', 'off');
  const whileOff = await decoration();
  expect(
    whileOn,
    'the tempo figure looks the same whether the ladder is moving it or not',
  ).not.toBe(whileOff);
});

test('the keys play into it — the run moves, so the ladder has something to judge', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize(PHONE);
  await ladderFromTheRung(page);
  await revealBar(page);
  await page.locator('#score-play').click();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');

  // The read-ahead in the form this screen has it: the strip lights what is
  // expected now, so the learner's hands are told where to go without reading
  // the stave. A key that is asked for and never lit is a mode you can only
  // play if you already know the piece.
  await expect(page.locator('.keyboard-strip .key.is-expected').first()).toBeVisible({
    timeout: 30_000,
  });
  const asked = await litKeys(page);
  expect(asked, 'the strip lit nothing, so there is nothing to play').not.toBe('');
  for (const midi of asked.split(',')) await press(page, Number(midi));
  // …and the run moved on, which is what gives the ladder something to judge.
  // Asked of the strip rather than of a test hook: what moved is what the
  // learner is looking at.
  await expect.poll(async () => litKeys(page), { timeout: 30_000 }).not.toBe(asked);
});

test('sideways the ladder is still on and the controls are still reachable', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize(SIDEWAYS);
  await ladderFromTheRung(page);
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-ladder', 'on');
  // R5: sideways the header row is not drawn and the title sits on the bar,
  // so the one thing that must not happen is the ladder's two controls going
  // with it.
  const drawnTitles = await page
    .locator('section[data-screen="score"] h1')
    .evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().height > 0).length);
  expect(drawnTitles, 'the score screen still draws an h1 sideways').toBe(0);
  await openScoreMenu(page);
  await expect(page.locator('#score-ladder-row')).toBeVisible();
  await expect(page.locator('#score-ladder')).toHaveText('On');
});

test('Back leaves it off — the same exercise opened plainly is not still armed', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize(PHONE);
  const claimed = await ladderFromTheRung(page);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-ladder', 'on');

  // `← Back` on this screen goes to the tab, not to the rung the learner came
  // from (`leaveScore`), so the way back to the rung is the rung.
  await page.locator('#score-back').click();
  await expect(page.locator('section[data-screen="score"]')).toHaveCount(0);
  await page.goto('/#/lesson/4.1');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  // The ordinary way in — the exercise's own row, the tap a learner makes
  // when they are not asking for the ladder. `05` §6 records the fault this
  // is about: a ladder left on with nothing on screen having asked.
  await page.locator(`#lesson-exercises .list-row[data-item="${claimed}"]`).click();
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-ladder', 'off');
  await expect(screen).toHaveAttribute('data-loop', '');
});
