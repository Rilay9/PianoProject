// Renders every catalog item in a real browser (docs/03 §3 steps 5–6).
//
// This is the check that decides whether a score can be *used*: it loads each
// file through the app's own loader, extracts the ScoreModel with the P2
// extractor, and asserts the model has at least one step. A file that parses
// but yields no steps is worse than one that fails outright — it would sit in
// the library looking fine and do nothing when the learner pressed play.
//
// Skipped unless CONTENT_RENDER_CHECK=1, because it needs a built content
// directory and takes a while; `python3 tools/content/render_check.py` sets
// the variable and reads the report this writes.
//
// One page, one browser, every item in a loop: launching a page per item costs
// more than the render does.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { openDevScore } from './fixtures/devScore';

const enabled = process.env.CONTENT_RENDER_CHECK === '1';
const contentDir = process.env.CONTENT_DIR ?? resolve('public/content');
const reportPath = process.env.CONTENT_RENDER_REPORT ?? resolve('../build/render-report.json');
const previewDir = process.env.CONTENT_PREVIEW_DIR ?? resolve('../build/previews');
const limit = Number(process.env.CONTENT_RENDER_LIMIT ?? '0');
/** Bars in a preview image — docs/03 §3 step 6 asks for the first two. */
const PREVIEW_BARS = 2;
/**
 * Reopen the page this often.
 *
 * OpenSheetMusicDisplay keeps a graphical model per score and the loop reuses
 * one page, so memory only goes up. At 800 items — a third of them Chopin, some
 * of them 800 bars — the tab was killed after 586 and every item after that
 * reported "Target crashed". Reopening is a second; a crashed tab costs the run.
 */
const RELOAD_EVERY = 40;
/**
 * How long one score may take to engrave.
 *
 * 20 s was enough until the Chopin ballades and scherzos arrived. This is the
 * check's patience, not the app's: the Score screen renders a window of bars at
 * a time, and how long a *whole* score takes to lay out is a different question
 * — an open one, on the phone, for the longest pieces.
 */
const RENDER_TIMEOUT_MS = 60_000;

interface CatalogItem {
  id: string;
  title: string;
  file: string | null;
}

interface ItemReport {
  id: string;
  ok: boolean;
  steps?: number;
  measures?: number;
  durationSec?: number;
  tempoBpm?: number | null;
  timeSig?: string | null;
  keySig?: string | null;
  hands?: string;
  preview?: string;
  error?: string;
}

test.describe('content render check', () => {
  test.skip(!enabled, 'set CONTENT_RENDER_CHECK=1 (tools/content/render_check.py does)');
  // Hundreds of scores, some of them 500 bars long.
  test.setTimeout(30 * 60 * 1000);

  test('every catalog item renders and yields at least one step', async ({ page }) => {
    const catalog = (await import(`file://${join(contentDir, 'catalog.json')}`, {
      with: { type: 'json' },
    })) as { default: CatalogItem[] };
    // A .pdf item is pages, not notes: it opens in the PDF viewer and OSMD
    // could never render it (docs/04 §5b).
    const items = catalog.default.filter(
      (item) => item.file && !item.file.toLowerCase().endsWith('.pdf'),
    );
    expect(items.length, 'catalog has no items with files').toBeGreaterThan(0);

    let driver = await openDevScore(page);
    await driver.setBars(PREVIEW_BARS);
    // Start from an empty directory: a preview left over from an item that no
    // longer exists is worse than no preview, because it looks current.
    rmSync(previewDir, { recursive: true, force: true });
    mkdirSync(previewDir, { recursive: true });

    const reports: ItemReport[] = [];
    const wanted = limit > 0 ? items.slice(0, limit) : items;

    for (const [index, item] of wanted.entries()) {
      if (index > 0 && index % RELOAD_EVERY === 0) {
        driver = await openDevScore(page);
        await driver.setBars(PREVIEW_BARS);
      }
      const url = `/PianoProject/content/${item.file}`;
      try {
        await page.evaluate(async (target) => {
          await window.__pianopathDevScore?.loadUrl(target);
        }, url);
        // The dev harness catches load failures into `lastError` and resolves
        // anyway, so `loadUrl` returning proves nothing on its own — and the
        // model left behind is the *previous* item's. Without this check a
        // score OSMD cannot render waits out the SVG timeout and reports a
        // mystery instead of the exception that caused it, and one item's
        // measurements could be recorded against another's id.
        const loadError = await page.evaluate(() => window.__pianopathDevScore?.lastError());
        if (loadError) {
          reports.push({ id: item.id, ok: false, error: loadError });
          continue;
        }
        const summary = await page.evaluate(() => window.__pianopathDevScore?.modelSummary());
        if (!summary || summary.steps < 1) {
          reports.push({ id: item.id, ok: false, error: 'rendered but produced no steps' });
          continue;
        }
        // The renderer pre-renders into an off-screen buffer and swaps it in
        // on an animation frame (docs/decisions P2), so a screenshot taken
        // the moment `loadUrl` resolves catches an empty stage — which is how
        // 39 of the first run's previews came out blank while the items
        // themselves rendered fine.
        await page.waitForFunction(
          () => {
            const svg = document.querySelector('#dev-stage svg');
            return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
          },
          undefined,
          { timeout: RENDER_TIMEOUT_MS },
        );
        const preview = join(previewDir, `${item.id}.png`);
        mkdirSync(dirname(preview), { recursive: true });
        await page.locator('#dev-stage').screenshot({ path: preview });
        reports.push({ id: item.id, ok: true, preview, ...summary });
      } catch (error) {
        reports.push({
          id: item.id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, `${JSON.stringify({ items: reports }, null, 2)}\n`, 'utf-8');

    const failed = reports.filter((r) => !r.ok);
    // The report is written before this assertion so a failing run still
    // leaves build.py something to read and name.
    expect(failed.map((f) => `${f.id}: ${f.error}`), 'items that did not render').toEqual([]);
  });
});
