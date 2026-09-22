/**
 * A rung's own Simon, driven (T17; `04` §5c-2, `pending-review` Entry 22).
 *
 * `blues.3` is the case the design exists for: a Stage 3 rung whose stage rule
 * would open the white-key game, naming instead the Simon seeded from the
 * blues scale — one of its own exercises. `lesson-tools.spec.ts` proves the
 * button arrives at that drill. This plays it.
 *
 * Judged as a learner:
 *
 *  - the instruction, the help chips and the keys are on a 342 px phone at
 *    once, because the chain is short and the answer is immediate;
 *  - the cue for "your turn" — the chain's lights and names go out and the
 *    card is bare — which is deliberate here (it is what stops the display
 *    being a crib) and is recorded as thin rather than asserted as good;
 *  - the keys answer, and the counter says so;
 *  - the help the rung allows is a control on the screen, not a setting three
 *    screens away.
 *
 * **Nothing here is heard**, which matters more on this mode than on any
 * other: Simon *is* the sound. That the chain played is the blues scale's
 * notes is `simonDrill.test.ts`'s claim, not this file's.
 */
import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 342, height: 740 };

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

async function withoutScrolling(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight;
  }, selector);
}

async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

/** The rung's own Simon button. */
async function simonFromTheRung(page: Page): Promise<void> {
  await page.setViewportSize(PHONE);
  await page.goto('/#/lesson/blues.3');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const tool = page.locator('#lesson-tool-simon');
  await expect(tool).toBeVisible();
  // The rung names its own Simon rather than taking the stage's, and the
  // exercise it names has to be one this rung offers.
  const offered = await page
    .locator('#lesson-exercises .list-row[data-item]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-item')));
  await tool.click();
  await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-kind', 'simon', {
    timeout: 60_000,
  });
  const opened = decodeURIComponent(new URL(page.url()).hash.replace('#/drill/', ''));
  expect(offered, `the Simon button opened ${opened}, which blues.3 does not offer`).toContain(
    opened,
  );
}

test('the rung’s button opens its own Simon, and the screen is the instruction and the keys', async ({
  page,
}) => {
  await simonFromTheRung(page);
  await expect(page.locator('#drill-prompt')).toHaveText('Play the chain back');
  for (const id of ['#drill-prompt', '#drill-simon-card', '#drill-simon-help', '#drill-strip']) {
    expect(await withoutScrolling(page, id), `${id} is below the fold on a 342 px phone`).toBe(true);
  }
  // The help is on the screen the drill is on — three levels, one of which is
  // pressed — rather than in Settings.
  await expect(page.locator('#drill-simon-help-show-keys')).toBeVisible();
  await expect(page.locator('#drill-simon-help-keys-after-miss')).toBeVisible();
  await expect(page.locator('#drill-simon-help-ear-only')).toBeVisible();
});

test('the keys answer the chain, and the counter says so', async ({ page }) => {
  test.setTimeout(120_000);
  await simonFromTheRung(page);
  const section = page.locator('section[data-screen="drill"]');
  // The chain is over when the card has stopped naming notes: the light, the
  // name and the staff all go out together, which is the only "your turn"
  // this mode has.
  await expect(page.locator('#drill-simon-now')).toHaveText('🎧', { timeout: 30_000 });
  const expects = ((await section.getAttribute('data-expects')) ?? '').split(',').filter(Boolean);
  expect(expects.length, 'the Simon card expects nothing, so this proves nothing').toBeGreaterThan(
    0,
  );
  for (const midi of expects) await press(page, Number(midi));
  await expect(page.locator('#drill-counter')).toContainText('1 right', { timeout: 30_000 });
  // The chain grows, which is what makes it Simon rather than a note flash.
  await expect
    .poll(
      async () =>
        ((await section.getAttribute('data-expects')) ?? '').split(',').filter(Boolean).length,
      { timeout: 30_000 },
    )
    .toBeGreaterThan(expects.length);
});

test('Back leaves nothing running', async ({ page }) => {
  await simonFromTheRung(page);
  await page.locator('#drill-back').click();
  await expect(page.locator('section[data-screen="drill"]')).toHaveCount(0);
  // And opening it again starts a fresh chain rather than resuming one the
  // learner has already heard.
  await simonFromTheRung(page);
  await expect(page.locator('#drill-counter')).toContainText('1 of');
});
