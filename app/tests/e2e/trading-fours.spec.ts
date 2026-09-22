/**
 * Trading fours in the accompaniment lab (docs/04 §3c).
 *
 * The engine half — whose bars these are, what the app plays, and what the
 * learner's bars were worth — is proved in `tests/unit/tradingFours.test.ts`
 * with a synthetic performance, because none of it needs a browser. What only
 * a browser can show is the rest: that the mode is reachable from the lab a
 * rung's tool already opens, that turning it on changes what *Jam it* does,
 * that the screen says whose bars are sounding, and that Stop stops it.
 *
 * The hand-over itself is driven by the metronome, so it is asserted at the
 * fastest tempo the lab offers — two bars is then a couple of seconds rather
 * than six, and the wait is a wait on a state rather than on a clock.
 */
import { expect, test, type Page } from '@playwright/test';

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

/** The lab, by the door a rung's own tool uses. */
async function openLab(page: Page): Promise<void> {
  await page.goto('/#/library');
  await expect(page.locator('#library-lab')).toBeVisible();
  await page.locator('#library-lab').click();
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
}

test.describe('trading fours', () => {
  test('is off until it is asked for, and the two lengths are exclusive', async ({ page }) => {
    await openLab(page);
    // A jam is a jam unless somebody says otherwise: the lab's own contract is
    // that nothing is judged, and this mode is the exception you opt into.
    // Off is *Bed only* since the two chip rows became one (T22).
    await expect(page.locator('#lab-bed-off')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lab-trade-2')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#lab-trade-4')).toHaveAttribute('aria-pressed', 'false');

    await page.locator('#lab-trade-4').click();
    await expect(page.locator('#lab-trade-4')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lab-bed-off')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#lab-trade-2')).toHaveAttribute('aria-pressed', 'false');

    await page.locator('#lab-trade-2').click();
    await expect(page.locator('#lab-trade-2')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lab-trade-4')).toHaveAttribute('aria-pressed', 'false');
  });

  test('takes the first bars, hands them over, and stops when it is stopped', async ({ page }) => {
    test.setTimeout(120_000);
    await openLab(page);
    // The fastest tempo the lab offers, so two bars is a couple of seconds.
    await page.locator('#lab-bpm').fill('240');
    await page.locator('#lab-bpm').blur();
    await page.locator('#lab-trade-2').click();
    await page.locator('#lab-jam-start').click();

    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute(
      'data-trading',
      'true',
      { timeout: 60_000 },
    );
    // What the mode is, said where the learner is looking, and the lab's own
    // promise kept in the same line: nothing recorded, nothing passed.
    await expect(page.locator('#lab-status')).toContainText('takes 2 bars');
    await expect(page.locator('#lab-status')).toContainText('nothing can be passed or failed');

    // The app leads — always, and there is no first-note latch anywhere in this
    // mode because of it.
    await expect(page.locator('#lab-trade')).toBeVisible();
    await expect(page.locator('#lab-trade')).toHaveAttribute('data-side', 'app', {
      timeout: 60_000,
    });
    await expect(page.locator('#lab-trade')).toContainText('Listen');

    // …and then it is the learner's, which is the whole device.
    await expect(page.locator('#lab-trade')).toHaveAttribute('data-side', 'learner', {
      timeout: 60_000,
    });
    await expect(page.locator('#lab-trade')).toContainText('Your turn');

    await page.locator('#lab-jam-stop').click();
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute(
      'data-trading',
      'false',
    );
    await expect(page.locator('#lab-trade')).toBeHidden();
  });

  test('a setting changed under a trade stops it rather than lying', async ({ page }) => {
    await openLab(page);
    await page.locator('#lab-trade-2').click();
    await page.locator('#lab-jam-start').click();
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute(
      'data-jam',
      'running',
      { timeout: 60_000 },
    );
    // Same rule as every other setting on this screen: the bars on the chart
    // would not be the bars it is playing.
    await page.locator('#lab-trade-4').click();
    await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'stopped');
    await expect(page.locator('#lab-status')).toContainText('press Jam it again');
  });

  test('the keys answer, and the answer is measured and not marked', async ({ page }) => {
    test.setTimeout(120_000);
    // A trade the learner cannot play is not a trade: on a machine with no
    // MIDI attached the strip is the only instrument there is, so playing one
    // of its keys inside the learner's own bars has to reach the judging.
    await openLab(page);
    await page.locator('#lab-bpm').fill('240');
    await page.locator('#lab-bpm').blur();
    await page.locator('#lab-trade-2').click();
    await page.locator('#lab-jam-start').click();

    await expect(page.locator('#lab-trade')).toHaveAttribute('data-side', 'learner', {
      timeout: 60_000,
    });
    // C, which is in the key the lab opens in and therefore in the scale the
    // notes are counted against.
    await page.locator('#lab-strip .key[data-midi="60"]').click();

    // The verdict is said at the hand-over back, before the next call covers
    // it: two facts, and no mark anywhere on the line.
    await expect(page.locator('#lab-trade')).toHaveAttribute('data-side', 'app', {
      timeout: 60_000,
    });
    await expect(page.locator('#lab-trade-verdict')).toHaveAttribute('data-came-in', 'true');
    await expect(page.locator('#lab-trade-verdict')).toContainText('In on your own bars');
    await expect(page.locator('#lab-trade-verdict')).toContainText('scale');
    await page.locator('#lab-jam-stop').click();
  });
});
