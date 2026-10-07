/**
 * X42's product probe (run artifact, not for the commit): what the learner meets at Maple Leaf Rag and Satie's first
 * Gymnopedie, read off the built app — the Score screen's tempo label and bpm field when it opens (the count-in's
 * tempo: the map's tempo at the run's first step), the label a few seconds into a Tempo run (past Maple Leaf's bar 1
 * change), and the dev harness's model summary (its opening tempo and the length its map gives the piece, computed,
 * not timed). The same probe runs against a build of the committed reader and one of the amended reader; the numbers
 * are the model's own, printed as JSON lines for the entry. Nothing is heard.
 */
import { expect, test } from '@playwright/test';
import { openDevScore } from '../../../tests/e2e/fixtures/devScore';
import { setTempoPercent } from '../../../tests/e2e/scoreControls';

const PIECES = [
  { id: 'song.ragtime.joplin-maple-leaf-rag', file: 'scores/imported/song.ragtime.joplin-maple-leaf-rag.mxl' },
  { id: 'song.classical.satie-gymnopedie-1', file: 'scores/imported/song.classical.satie-gymnopedie-1.mxl' },
];

for (const piece of PIECES) {
  test(`what ${piece.id} opens and plays at`, async ({ page }) => {
    test.setTimeout(180_000);
    const driver = await openDevScore(page);
    void driver;
    await page.evaluate(async (url) => {
      await window.__pianopathDevScore?.loadUrl(url);
    }, `/PianoProject/content/${piece.file}`);
    expect(await page.evaluate(() => window.__pianopathDevScore?.lastError())).toBeFalsy();
    const summary = await page.evaluate(() => window.__pianopathDevScore?.modelSummary());

    await page.goto(`/#/score/${piece.id}`);
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
    await setTempoPercent(page, 100);
    const labelAtOpen = await page.locator('#score-tempo-label').textContent();
    const bpmFieldAtOpen = await page.locator('#score-bpm').inputValue();

    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    await expect(page.locator('#score-countin')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#score-countin')).toBeHidden({ timeout: 30_000 });
    // Five seconds into the run: at 100 or 120 a minute, well past Maple Leaf's change a quarter into bar 1.
    await page.waitForTimeout(5_000);
    const labelInRun = await page.locator('#score-tempo-label').textContent();
    console.log(
      `X42PROBE ${JSON.stringify({ id: piece.id, modelOpeningTempo: summary?.tempoBpm, modelDurationSec: summary?.durationSec, labelAtOpen, bpmFieldAtOpen, labelInRun })}`,
    );
  });
}
