/**
 * U96a's pictures (lane-only, not for the commit): copied into `app/tests/e2e/` for its runs and removed.
 * Writes under `test-results/pictures/u96a/`, named `<U96A_PHASE>-<scene>-342x740.png`; the PNGs are copied
 * to `docs/prompts/pictures/u96a/` by hand (U97: a spec never writes under `docs/`).
 *
 * Every answer is a tap on the screen keys (`.keyboard-strip [data-midi]`), the way a learner with no cable
 * answers. **Nothing here is heard.** Each scene also prints the sheet's rows to the log, so the log can be
 * read beside the picture.
 */
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 342, height: 740 } });

const PHASE = process.env.U96A_PHASE ?? 'unnamed';
const DIR = 'test-results/pictures/u96a';

async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/#/drill/${id}`);
  await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', { timeout: 60_000 });
}

async function expects(page: Page): Promise<number[]> {
  const raw = (await page.locator('[data-screen="drill"]').getAttribute('data-expects')) ?? '';
  return raw.split(',').filter(Boolean).map(Number);
}

async function tap(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`).first();
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

/** A key on the strip in no octave of what the card wants. */
async function wrongKey(page: Page): Promise<number> {
  const wanted = await expects(page);
  const keys = await page.locator('.keyboard-strip [data-midi]').evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-midi'))));
  const wrong = keys.find((midi) => wanted.every((w) => (((w - midi) % 12) + 12) % 12 !== 0));
  if (wrong === undefined) throw new Error('no wrong key on the strip');
  return wrong;
}

async function answer(page: Page, right: boolean): Promise<void> {
  const drill = page.locator('[data-screen="drill"]');
  await expect(drill).toHaveAttribute('data-feedback', '');
  const midi = right ? ((await expects(page))[0] ?? 60) : await wrongKey(page);
  await tap(page, midi);
  await expect(drill).toHaveAttribute('data-feedback', right ? 'correct' : 'wrong');
}

/** Past the beat after a right answer, or the held card after a miss (a tap on the card moves on). */
async function nextCard(page: Page): Promise<void> {
  const drill = page.locator('[data-screen="drill"]');
  if ((await drill.getAttribute('data-paused')) === 'miss') await page.locator('#drill-prompt').click();
  await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
}

async function sheetPicture(page: Page, scene: string): Promise<void> {
  const sheet = page.locator('#drill-summary');
  await expect(sheet).toBeVisible({ timeout: 30_000 });
  const rows = await sheet.locator('#drill-stats dt').evaluateAll((dts) =>
    dts.map((dt) => `${dt.textContent ?? ''} = ${dt.nextElementSibling?.textContent ?? ''}`),
  );
  const heading = await sheet.locator('#drill-outcome').textContent();
  console.log(`[u96a ${PHASE}] ${scene}: heading "${heading ?? ''}"; ${rows.join('; ')}`);
  await sheet.evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${PHASE}-${scene}-342x740.png` });
}

test('note flash: four answered, three right, ended', async ({ page }) => {
  await open(page, 'drill.reading.note-flash-treble-c4-g4');
  for (let card = 0; card < 3; card += 1) {
    await answer(page, true);
    await nextCard(page);
  }
  await answer(page, false);
  await page.locator('#drill-end').click();
  await sheetPicture(page, 'flash-four-answered-three-right');
});

test('note flash: one skipped, one right, one wrong, ended', async ({ page }) => {
  await open(page, 'drill.reading.note-flash-treble-c4-g4');
  await page.locator('#drill-skip').click();
  await answer(page, true);
  await nextCard(page);
  await answer(page, false);
  await page.locator('#drill-end').click();
  await sheetPicture(page, 'flash-skip-right-wrong');
});

test('note flash: every card skipped, run out', async ({ page }) => {
  await open(page, 'drill.reading.note-flash-treble-c4-g4');
  for (let card = 0; card < 100; card += 1) {
    if (await page.locator('#drill-summary').isVisible()) break;
    await page.locator('#drill-skip').click();
  }
  await sheetPicture(page, 'flash-every-card-skipped');
});

test('rhythm: tapped, two taps more than it has onsets, ended', async ({ page }) => {
  await open(page, 'drill.rhythm.quarters-rests');
  // After the count-in, when the first tap starts it (T8); a tap during the count is a stray.
  await expect(page.locator('#drill-status')).toContainText('first tap starts it', { timeout: 30_000 });
  const onsets = await page.locator('.rhythm-row .rhythm-tap').count();
  for (let t = 0; t < onsets + 2; t += 1) {
    await tap(page, 60);
    await page.waitForTimeout(120);
  }
  await page.locator('#drill-end').click();
  await sheetPicture(page, 'rhythm-tapped');
});

test('Simon: one chain right, then a wrong note', async ({ page }) => {
  await open(page, 'drill.ear.simon-c-major');
  await page.locator('#drill-simon-help-ear-only').click();
  await expect(page.locator('#drill-status')).toContainText('Your turn', { timeout: 20_000 });
  await answer(page, true);
  await nextCard(page);
  await expect(page.locator('#drill-counter')).toContainText('2 of');
  await expect(page.locator('#drill-status')).toContainText('Your turn', { timeout: 20_000 });
  await tap(page, await wrongKey(page));
  await sheetPicture(page, 'simon-one-right-then-wrong');
});

test('the placement question screen, for the record', async ({ page }) => {
  await open(page, 'drill.placement.stage-0');
  await expect(page.locator('#drill-placement-pass')).toBeVisible();
  const filled = await page.locator('section[data-screen="drill"] .button--primary:visible').evaluateAll((els) => els.map((el) => el.id));
  console.log(`[u96a ${PHASE}] placement question: filled boxes ${JSON.stringify(filled)}; Fail class "${(await page.locator('#drill-placement-fail').getAttribute('class')) ?? ''}"`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${PHASE}-placement-question-342x740.png` });
});
