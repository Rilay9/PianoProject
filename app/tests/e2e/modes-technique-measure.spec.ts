/**
 * A technique exercise's measure line, played for (T17; `pending-review`
 * Entry 24 item 2, `05` §9a).
 *
 * `articulationScore`, `voicingScore` and `shapingScore` were written and had
 * no caller until 2026-09-21; `techniqueMeasures.test.ts` proves the
 * arithmetic against a synthetic run. What no unit test can say is whether a
 * learner on `technique.4` — the rung those exercises are options of — can
 * reach the number: open the staccato study from its own row, play it on the
 * only instrument a phone has, and find the summary saying how short the
 * notes were.
 *
 * Judged as a learner:
 *
 *  - the measure is beside the accuracy it is deliberately not part of, and
 *    said in words rather than as a second percentage;
 *  - it does not quietly decide the pass — no rung states one in
 *    `mastery.custom`, so a short-of-target run is still judged the way it
 *    always was;
 *  - the exercise is playable from the on-screen keys at all, which is the
 *    difference between a measure and a measure you need a cable to take.
 *
 * **Nothing here is heard.** And the thing Entry 38 recorded rather than
 * tested — the on-screen strip sends a fixed velocity, so the *voicing* and
 * *shaping* measures on `technique.5` and `technique.6` cannot be taken from
 * it at all — is now the second test below: the sheet has to **say** it could
 * not measure, rather than printing 0 % of fifteen chords, which reads as
 * *you played it flat* when what happened is that the glass could not say
 * (FAULT 8, half-fixed by T17-2; the other half is the owner's).
 */
import { expect, test, type Page } from '@playwright/test';

import { setTempoPercent, withScoreMenu } from './scoreControls';

const PHONE = { width: 342, height: 740 };
/** The exercise this rung leads with for the articulation it teaches. */
const STACCATO = 'exercise.articulation.c.staccato.right';
/** `technique.6`'s voicing study — chords, and a velocity measure over them. */
const VOICING = 'exercise.voicing.a';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      // Every explain-it-once card counts as seen, for the same reason the
      // tour counts as skipped: this spec is not about meeting them
      // (`04` §5f, `help-strip.spec.ts` is the one that drives them).
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

/** The keys the strip is asking for right now. */
async function litKeys(page: Page): Promise<number[]> {
  return page
    .locator('.keyboard-strip .key.is-expected')
    .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-midi'))));
}

/**
 * Plays the exercise by playing the keys the strip lights.
 *
 * Deliberately not through the test hook: the strip's own lit keys are what
 * the learner is given, so a run driven off them is the run a learner can
 * have. It also means this file says nothing about a piece of test
 * scaffolding — if the strip stops lighting what is expected, this stops
 * finishing, which is the fault it should report.
 */
async function playToTheSummary(page: Page): Promise<void> {
  const sheet = page.locator('#score-summary');
  await expect(page.locator('.keyboard-strip .key.is-expected').first()).toBeVisible({
    timeout: 60_000,
  });
  for (let step = 0; step < 400; step += 1) {
    if (await sheet.isVisible()) return;
    const lit = await litKeys(page);
    if (lit.length === 0) {
      await page.waitForTimeout(100);
      continue;
    }
    for (const midi of lit) await press(page, midi);
    // Wait for the strip to ask for something else before playing again.
    // Without this the same step is played twice whenever the press lands
    // faster than the redraw, which arrives at the summary as an extra note
    // and a wrong one — a run this file then judged as if the learner had
    // fumbled it.
    const played = lit.join(',');
    await expect
      .poll(async () => (await litKeys(page)).join(',') !== played || sheet.isVisible(), {
        timeout: 10_000,
      })
      .toBeTruthy();
  }
}

/** A rung's own row for one of its exercises, tapped the ordinary way. */
async function openFromTheRung(page: Page, rung = 'technique.4', item = STACCATO): Promise<void> {
  await page.setViewportSize(PHONE);
  await page.goto(`/#/lesson/${rung}`);
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const row = page.locator(`#lesson-exercises .list-row[data-item="${item}"]`);
  await expect(row, `${rung} no longer offers ${item}`).toBeVisible();
  await row.click();
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
  await withScoreMenu(page, async () => {
    await page.locator('#score-input').selectOption('keys');
  });
  // Wait mode: the exercise is four bars and the point is the length of each
  // note, not whether the learner can keep up with a clock they did not set.
  await page.locator('#score-mode').selectOption('wait');
  await setTempoPercent(page, 100);
}

test('the staccato study is playable from the keys and the summary says how short', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await openFromTheRung(page);
  await page.locator('#score-play').click();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');

  // Played by asking the run what it is waiting for, rather than by carrying a
  // copy of the exercise in this file — the notes are content and change.
  const sheet = page.locator('#score-summary');
  await playToTheSummary(page);
  await expect(sheet).toBeVisible({ timeout: 60_000 });

  // The number the exercise is actually about, beside the accuracy it is not
  // part of. A tap on the glass is released at once, which is as short as a
  // note gets — so the measure is taken, and the sentence says of how many.
  const measure = sheet.locator('[data-stat="staccato"]');
  await expect(measure, 'the staccato study’s summary has no staccato line on it').toHaveCount(1);
  await expect(measure).toContainText('notes held the right length');
  // Said in words, not as a bare percentage under the accuracy: a second
  // figure in that shape is read as a second accuracy, which is the confusion
  // these exist to avoid.
  await expect(measure).toContainText('of the written value');
  // And it is not folded into the accuracy.
  await expect(sheet.locator('[data-stat="accuracy"]')).toHaveCount(1);
  await expect(measure).not.toHaveText(
    (await sheet.locator('[data-stat="accuracy"]').textContent()) ?? '',
  );

  // And it does not quietly decide the pass. `demandsTechniqueMeasure` reads
  // the rung's `mastery.custom`, and no technique rung states a rule there, so
  // the sentence that would say otherwise — "— this rung requires it" — must
  // not be on the line. Asserted on the same run rather than on a second one:
  // two four-bar runs in parallel workers is load, and load on this suite
  // looks like a fault (`00` §2, §3).
  await expect(measure).not.toContainText('this rung requires it');
  // The sheet is headed for what the run *was* — `Mastered`, `Passed`, or
  // `Run finished` — and the technique line is on it either way, because it
  // is a measurement and not a verdict.
  await expect(sheet.locator('h2')).toHaveText(/Mastered|Passed|Run finished/);
});

test('a measure the glass cannot take says so, rather than printing a nought', async ({ page }) => {
  test.setTimeout(240_000);
  // `technique.6`'s voicing study: does the top of each chord sing 1.4× the
  // rest of it? `KeyboardStrip.ts` sends one fixed velocity for every touch,
  // with the reason beside it — Android reports `pressure` as 0 or 1 — so
  // played from the glass every chord comes out at a ratio of exactly 1.
  await openFromTheRung(page, 'technique.6', VOICING);
  await page.locator('#score-play').click();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');

  const sheet = page.locator('#score-summary');
  await playToTheSummary(page);
  await expect(sheet).toBeVisible({ timeout: 60_000 });

  const measure = sheet.locator('[data-stat="top-note"]');
  await expect(measure, 'the voicing study’s summary has no Top note line on it').toHaveCount(1);
  // The line is there, and it says the measurement could not be taken — the
  // same shape the articulation line already uses when the microphone never
  // says when a key came up.
  await expect(measure).toContainText('not measured');
  // And specifically not the arithmetic on one repeated number, which is what
  // it printed before: "0% of N chords sang the top note at least 1.4 times".
  await expect(measure).not.toContainText('sang the top note');
  // Not a pass it quietly failed, either: no technique rung states a rule in
  // `mastery.custom`, so nothing here decides the verdict.
  await expect(measure).not.toContainText('this rung requires it');
  await expect(sheet.locator('h2')).toHaveText(/Mastered|Passed|Run finished/);
});
