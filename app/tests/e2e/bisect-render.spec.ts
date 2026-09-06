// Renders a batch of candidate MusicXML files and reports what each did.
//
// The batch worker for `tools/content/bisect_render.py`, which narrows a score
// OSMD refuses down to a single measure. The bisection itself lives in Python,
// because slicing a score by measure range is music21's job; this side exists
// only because "does OSMD render it?" can only be answered by OSMD.
//
// Skipped unless CONTENT_BISECT_PLAN is set, so it costs a normal e2e run
// nothing. Files are read from disk and pushed in as text rather than served,
// which is why the bisector writes uncompressed .musicxml.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { test } from '@playwright/test';
import { openDevScore } from './fixtures/devScore';

const planPath = process.env.CONTENT_BISECT_PLAN ?? '';
const resultsPath = process.env.CONTENT_BISECT_RESULTS ?? '';

interface Plan {
  files: string[];
}

interface Result {
  file: string;
  ok: boolean;
  steps: number;
  error: string;
  consoleErrors: string[];
}

test.describe('bisect render', () => {
  test.skip(!planPath, 'set CONTENT_BISECT_PLAN (tools/content/bisect_render.py does)');
  test.setTimeout(10 * 60 * 1000);

  test('render each candidate slice', async ({ page }) => {
    const plan = JSON.parse(readFileSync(planPath, 'utf-8')) as Plan;

    let consoleLines: string[] = [];
    page.on('console', (message) => {
      const kind = message.type();
      if (kind === 'error' || kind === 'warning') consoleLines.push(`${kind}: ${message.text()}`);
    });
    page.on('pageerror', (error) => consoleLines.push(`pageerror: ${error.message}`));

    const driver = await openDevScore(page);
    // The same window size the render check uses (its PREVIEW_BARS).
    //
    // Not cosmetic: the window size decides the layout, and the layout is what
    // OSMD's SkyBottomLineCalculator works on. A bisector that renders under
    // different conditions from the check can disagree with it — Mozart's K545
    // rendered here and failed there for exactly this reason, which cost an
    // hour of chasing the wrong difference. The tool has to reproduce the
    // check, or its verdicts do not transfer.
    await driver.setBars(2);

    const results: Result[] = [];

    for (const file of plan.files) {
      consoleLines = [];
      let result: Result = { file, ok: false, steps: 0, error: '', consoleErrors: [] };
      try {
        const xml = readFileSync(file, 'utf-8');
        await driver.loadMusicXml(xml, file);
        // loadXml swallows its exception into lastError and resolves, so the
        // error string — not the absence of a throw — is the answer here.
        const error = await driver.lastError();
        const steps = await driver.stepCount();
        result = {
          file,
          ok: error === '' && steps > 0,
          steps,
          error: error || (steps > 0 ? '' : 'rendered but produced no steps'),
          consoleErrors: [...consoleLines],
        };
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        result.consoleErrors = [...consoleLines];
      }
      results.push(result);
    }

    mkdirSync(dirname(resultsPath), { recursive: true });
    writeFileSync(resultsPath, `${JSON.stringify({ results }, null, 2)}\n`, 'utf-8');
    // Never fails: a candidate that does not render is the *finding*, not an
    // error. The Python side reads the file and decides.
    if (!existsSync(resultsPath)) throw new Error(`could not write ${resultsPath}`);
  });
});
