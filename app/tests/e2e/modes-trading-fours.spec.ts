/**
 * Trading fours, met the way a learner meets it (T17; `04` §3c, §3d).
 *
 * `trading-fours.spec.ts` proves the mode from the Library's own door and
 * asserts the turn-taking. What it never does is start where a learner starts:
 * on the rung whose lesson says to trade fours, on a phone, with nothing
 * already open. So this drives the whole path — rung page, the button, the
 * lab, the jam, a key played inside the learner's own bars — and then judges
 * the three things a spec about ids cannot see:
 *
 *  - the cue for "your turn" is on the screen the learner is looking at,
 *    without scrolling, on a 342 px phone (`04` §0 R1);
 *  - Stop stops, and takes the turn line with it;
 *  - Back leaves the mode off — reopening the same door gives a lab with no
 *    trade set, which is `05` §6's trap applied to this screen.
 *
 * **Nothing here is heard.** Every assertion is about text and state; a trade
 * can hand over on time, say so, and still sound wrong, and no test in this
 * file would know.
 */
import { expect, test, type Page } from '@playwright/test';

/** A phone upright, which is the size `04` §0 R1 is written for. */
const PHONE = { width: 342, height: 740 };

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

/**
 * Whether the element is on the screen with no scrolling — the question R1
 * asks, expressed as a relationship to the viewport rather than as a pixel
 * line measured on this machine.
 */
async function withoutScrolling(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight;
  }, selector);
}

/** The rung that asks for it, the button on it, and the lab it opens. */
async function tradeFromTheRung(page: Page): Promise<void> {
  await page.setViewportSize(PHONE);
  // `blues.7` gained its `lab` tool for this mode (`04` §3c): a rung reaches
  // trading fours through the lab button it already has, because the mode has
  // deliberately no route of its own.
  await page.goto('/#/lesson/blues.7');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const tool = page.locator('#lesson-tool-lab');
  await expect(tool).toBeVisible();
  const declared = await tool.getAttribute('data-preset');
  expect(declared, 'blues.7’s lab tool names no preset, so this proves nothing').toBeTruthy();
  await tool.click();
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
  await expect(page.locator('#lab-preset')).toHaveAttribute('data-preset', declared ?? '');
}

test('the rung’s own button reaches it, in its preset, with the mode off', async ({ page }) => {
  await tradeFromTheRung(page);
  // The two buttons are on the first screenful, which is the ranking §3c
  // chose: they answer "and then what happens".
  expect(
    await withoutScrolling(page, '#lab-jam-start'),
    'Jam it — the button that starts the trade — is below the fold on a 342 px phone',
  ).toBe(true);
  // The chips are off the bottom of a 342 px phone arriving from a rung, and
  // that is recorded rather than asserted either way here: it is the screen's
  // whole vertical budget and not something a spec about this mode can fix
  // (`pending-review` Entry 38). What this file can insist on is that the row
  // is live once it is reached, and that the mode is off until it is asked
  // for — a jam is a jam unless somebody says otherwise.
  // "Off" is now the absence of a pressed trade chip rather than a chip of its
  // own (T22): the trade row's *Off* and the bed row's *Bed only* were two
  // controls for one state, so the row that survived has five choices and the
  // preset's own way round may be the pressed one.
  await expect(page.locator('#lab-trade-2')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#lab-trade-4')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#lab-trade-2')).toBeEnabled();
  await expect(page.locator('#lab-trade-4')).toBeEnabled();
});

test('the app leads, the turn cue is unmistakable and on screen, and a key answers', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await tradeFromTheRung(page);
  // The fastest tempo the lab offers, so two bars is a couple of seconds and
  // every wait below is a wait on a state rather than on a clock.
  await page.locator('#lab-bpm').fill('240');
  await page.locator('#lab-bpm').blur();
  await page.locator('#lab-trade-2').click();
  await page.locator('#lab-jam-start').click();

  const trade = page.locator('#lab-trade');
  await expect(trade).toHaveAttribute('data-side', 'app', { timeout: 60_000 });
  await expect(trade).toContainText('Listen');
  // The cue is two things at once — a word and a side — and both have to be
  // where the eye already is. A "your turn" a learner scrolls to find is a
  // cue that arrives after the bar it was about.
  expect(
    await withoutScrolling(page, '#lab-trade'),
    'the turn line is off the screen while the trade is running',
  ).toBe(true);

  await expect(trade).toHaveAttribute('data-side', 'learner', { timeout: 60_000 });
  await expect(trade).toContainText('Your turn');
  expect(
    await withoutScrolling(page, '#lab-trade'),
    'the turn line is off the screen on the learner’s own bars',
  ).toBe(true);

  // The strip is the instrument on a machine with no cable, and it is under
  // the chart on this screen — so the learner's hands and the cue are not in
  // the same glance unless both are on the screen at once.
  const key = page.locator('#lab-strip .key[data-midi="60"]');
  await key.scrollIntoViewIfNeeded();
  await key.click();

  await expect(trade).toHaveAttribute('data-side', 'app', { timeout: 60_000 });
  const verdict = page.locator('#lab-trade-verdict');
  await expect(verdict).toHaveAttribute('data-came-in', 'true');
  // Two counts and no mark — the lab's own promise, kept in the sentence.
  await expect(verdict).toContainText('In on your own bars');
  await expect(verdict).not.toContainText(/Passed|Failed/);

  // Stop stops: the state goes, and so does the line that was reading the
  // turns, because a turn line over a stopped loop is a control saying
  // something that is no longer true.
  await page.locator('#lab-jam-stop').click();
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-trading', 'false');
  await expect(trade).toBeHidden();
});

test('Back leaves the mode off — the same door opens a lab with no trade set', async ({ page }) => {
  await tradeFromTheRung(page);
  await page.locator('#lab-trade-4').click();
  await expect(page.locator('#lab-trade-4')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#lab-back').click();
  await expect(page.locator('section[data-screen="library"]')).toBeVisible();

  // `05` §6's trap, on this screen: a mode left on with nothing on the screen
  // having asked for it. Arriving by the rung's button a second time has to
  // give the lab the rung's preset and no trade.
  await tradeFromTheRung(page);
  await expect(page.locator('#lab-trade-2')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#lab-trade-4')).toHaveAttribute('aria-pressed', 'false');
  // And no jam is running behind it either, which is the other half of "off".
  await expect(page.locator('#lab-trade')).toBeHidden();
});
