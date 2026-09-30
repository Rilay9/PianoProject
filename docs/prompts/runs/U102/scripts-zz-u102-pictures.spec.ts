/**
 * U102's pictures (lane-only, not for the commit): copied into `app/tests/e2e/` for its runs and removed.
 * Writes under `test-results/pictures/u102/`, named `<U102_PHASE>-<scene>-342x740.png`; the PNGs are copied
 * to `docs/prompts/pictures/u102/` by hand (U97: a spec never writes under `docs/`).
 *
 * A note-flash set ended before any answer, counted, then Progress. Nothing is answered and **nothing is
 * heard**. Each scene prints what it shows to the log, so the log can be read beside the picture.
 */
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 342, height: 740 } });

const PHASE = process.env.U102_PHASE ?? 'unnamed';
const DIR = 'test-results/pictures/u102';
const FLASH = 'drill.reading.note-flash-treble-c4-g4';

test('an unanswered set: the drill sheet, then the Progress history after it was counted', async ({ page }) => {
  await page.goto(`/#/drill/${FLASH}`);
  await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', { timeout: 60_000 });
  await page.locator('#drill-end').click();
  const sheet = page.locator('#drill-summary');
  await expect(sheet).toBeVisible({ timeout: 30_000 });
  const heading = await sheet.locator('#drill-outcome').textContent();
  const rows = await sheet.locator('#drill-stats dt').evaluateAll((dts) =>
    dts.map((dt) => `${dt.textContent ?? ''} = ${dt.nextElementSibling?.textContent ?? ''}`),
  );
  console.log(`[u102 ${PHASE}] drill sheet: heading "${heading ?? ''}"; ${rows.join('; ')}`);
  await sheet.evaluate((node) => node.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${PHASE}-drill-sheet-ended-unanswered-342x740.png` });

  await page.locator('#drill-keep').click();
  await expect(page.locator('#drill-keep')).toBeDisabled();
  await page.goto('/#/progress');
  const row = page.locator(`#progress-history .list-row[data-item="${FLASH}"]`);
  await expect(row).toBeVisible({ timeout: 30_000 });
  const line = await row.locator('.list-row__metatext').textContent();
  const title = await row.textContent();
  console.log(`[u102 ${PHASE}] progress history row: "${title ?? ''}"; detail line "${line ?? ''}"`);
  await row.evaluate((node) => node.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${PHASE}-progress-history-after-unanswered-342x740.png` });
});
