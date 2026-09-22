/**
 * A lab button that hands one picker back (T17; `04` §3d, `pending-review`
 * Entry 24 item 5).
 *
 * `unlock` replaced a second *Lab — your own chords* button that six rungs
 * carried, so what has to be true is not that the field parses: it is that a
 * learner on `3.3` — told to take the vamp and try it in another set of
 * chords — presses one button, arrives, and finds exactly one of the preset's
 * pickers live while the rest are visibly fixed.
 *
 * Judged as a learner:
 *
 *  - the freed picker is live and the locked ones are `disabled`, not merely
 *    dimmed, so nothing that looks pressable is not (`00` §1);
 *  - changing the freed picker changes what the screen says it will play, and
 *    then changes what the loop actually charts — a control that moves a label
 *    and not the music is the dead control in a costume;
 *  - a locked picker pressed does not move.
 *
 * **Nothing here is heard.** That the new progression sounds like the vamp the
 * lesson is teaching is not something this file can say.
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

/** `3.3`'s own button, the one that names both a preset and what it frees. */
async function unlockFromTheRung(page: Page): Promise<string[]> {
  await page.setViewportSize(PHONE);
  await page.goto('/#/lesson/3.3');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const tool = page.locator('#lesson-tool-lab');
  await expect(tool).toBeVisible();
  const declared = await tool.getAttribute('data-preset');
  expect(declared, 'the lab tool names no preset, so this proves nothing').toBeTruthy();
  await tool.click();
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
  await expect(page.locator('#lab-preset')).toHaveAttribute('data-preset', declared ?? '');
  // What the rung said it frees, read off the address the button navigated to
  // rather than copied in here.
  const unlocked = (new URL(page.url()).hash.match(/unlock=([^&]*)/)?.[1] ?? '')
    .split(',')
    .filter((name) => name !== '');
  expect(unlocked.length, 'the button carried no unlock, so this file proves nothing').toBeGreaterThan(
    0,
  );
  return unlocked;
}

test('the freed picker is live and the preset’s others are disabled', async ({ page }) => {
  const unlocked = await unlockFromTheRung(page);
  expect(unlocked).toContain('progression');

  // Live, because the rung asked for it.
  await expect(page.locator('#lab-progression')).toBeEnabled();
  // Fixed, and `disabled` rather than dimmed — Playwright reads
  // `aria-disabled` as disabled too, so the property is asked for by name.
  await expect(page.locator('#lab-key')).toHaveJSProperty('disabled', true);
  await expect(page.locator('#lab-left button').first()).toHaveJSProperty('disabled', true);
  // Visible, not hidden: half of what a preset is for is showing what it chose.
  await expect(page.locator('#lab-key')).toBeVisible();
  await expect(page.locator('#lab-left')).toBeVisible();
});

test('a locked picker pressed does not move, and the freed one does', async ({ page }) => {
  await unlockFromTheRung(page);
  const key = page.locator('#lab-key');
  const before = await key.inputValue();
  // A lock that were only an opacity would let this through.
  await key.click({ force: true }).catch(() => undefined);
  await expect(key).toHaveValue(before);

  // And the freed one moves, and the line that says what the settings *are*
  // moves with it — otherwise the learner has changed something the screen is
  // still describing the old way.
  const summaryBefore = (await page.locator('#lab-summary').textContent()) ?? '';
  const values = await page
    .locator('#lab-progression option')
    .evaluateAll((els) =>
      els.map((el) => (el as HTMLOptionElement).value).filter((value) => value !== ''),
    );
  const current = await page.locator('#lab-progression').inputValue();
  const other = values.find((value) => value !== current);
  expect(other, 'the progression picker offers nothing to change to').toBeTruthy();
  await page.locator('#lab-progression').selectOption(other ?? '');
  await expect(page.locator('#lab-summary')).not.toHaveText(summaryBefore);
});

test('the freed picker reaches the loop, not just the label', async ({ page }) => {
  test.setTimeout(180_000);
  await unlockFromTheRung(page);
  await page.locator('#lab-bpm').fill('240');
  await page.locator('#lab-bpm').blur();
  await page.locator('#lab-jam-start').click();
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'running', {
    timeout: 60_000,
  });
  const charted = await page
    .locator('#lab-jam-grid .chart-cell')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-roman')));
  await page.locator('#lab-jam-stop').click();

  // Change the freed picker and play it again: the chart has to be the new
  // chords, because that is the whole of what the rung handed back.
  const values = await page
    .locator('#lab-progression option')
    .evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value).filter((v) => v !== ''));
  const current = await page.locator('#lab-progression').inputValue();
  const next = values.find((value) => value !== current);
  expect(next, 'the progression picker offers only the one the preset set').toBeTruthy();
  await page.locator('#lab-progression').selectOption(next ?? '');
  await page.locator('#lab-jam-start').click();
  await expect(page.locator('section[data-screen="lab"]')).toHaveAttribute('data-jam', 'running', {
    timeout: 60_000,
  });
  const after = await page
    .locator('#lab-jam-grid .chart-cell')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-roman')));
  expect(after, 'the loop charted the preset’s chords after the picker was moved').not.toEqual(
    charted,
  );
  await page.locator('#lab-jam-stop').click();
});
