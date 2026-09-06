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
//
// **Incremental** (replan §1.3): each score's render result is remembered in
// `build/render-manifest.json` under the sha256 of the file that produced it,
// so a run only engraves files it has not seen. A file's bytes decide its
// result, so the hash is the whole key — and `--full` (CONTENT_RENDER_FULL=1)
// ignores the manifest, which is what render_check.py --full runs so an OSMD
// upgrade cannot hide behind the cache.
//
// This file reports *facts*. Deciding which facts are wrong — cursor-step
// parity, absurd bars-per-second, a mislabelled hand — is render_check.py's
// job, because those comparisons need the catalog and are worth unit tests.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { openDevScore } from './fixtures/devScore';

const enabled = process.env.CONTENT_RENDER_CHECK === '1';
const contentDir = process.env.CONTENT_DIR ?? resolve('public/content');
const reportPath = process.env.CONTENT_RENDER_REPORT ?? resolve('../build/render-report.json');
const previewDir = process.env.CONTENT_PREVIEW_DIR ?? resolve('../build/previews');
const manifestPath =
  process.env.CONTENT_RENDER_MANIFEST ?? resolve('../build/render-manifest.json');
const full = process.env.CONTENT_RENDER_FULL === '1';
/**
 * An explicit item list instead of a catalog (P13, replan §2.3 item 5).
 *
 * The PDMX quarry needs this same loader run over files that are not in the
 * catalog and never will be — most of them are about to be rejected. Pointing
 * it at a JSON array of `{id, title, file}` is the whole difference; every
 * other line below is unchanged, which is the point of reusing the spec rather
 * than writing a second one that drifts.
 */
const itemsJson = process.env.CONTENT_ITEMS_JSON ?? '';
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
 * Write the manifest this often.
 *
 * replan §7.8: a run that crashes half way through used to lose everything it
 * had rendered. Flushing every 20 fresh renders means a killed run costs at
 * most 20, and the next run picks up where it stopped.
 */
const MANIFEST_FLUSH_EVERY = 20;
/**
 * How long one score may take to engrave.
 *
 * 20 s was enough until the Chopin ballades and scherzos arrived. This is the
 * check's patience, not the app's: the Score screen renders a window of bars at
 * a time, and how long a *whole* score takes to lay out is a different question
 * — an open one, on the phone, for the longest pieces.
 */
const RENDER_TIMEOUT_MS = 60_000;
/** Bumped when an entry's shape changes, so old manifests are ignored whole. */
const MANIFEST_VERSION = 1;
/**
 * Distinct console messages kept per item.
 *
 * OSMD repeats itself once per measure — 5,654 lines across the library, every
 * one of them the same `SkyBottomLineCalculator` warning. The manifest is
 * restored from the CI cache on every run, so storing all of them costs a
 * megabyte to say one thing. Distinct messages carry the information; the
 * repetition does not.
 */
const CONSOLE_LINES_PER_ITEM = 8;

/** Distinct messages, in first-seen order, capped. */
function distinctConsole(lines: string[]): string[] {
  const seen = [...new Set(lines)];
  if (seen.length <= CONSOLE_LINES_PER_ITEM) return seen;
  return [
    ...seen.slice(0, CONSOLE_LINES_PER_ITEM),
    `… and ${String(seen.length - CONSOLE_LINES_PER_ITEM)} more distinct message(s)`,
  ];
}

interface CatalogItem {
  id: string;
  title: string;
  file: string | null;
}

/**
 * What one render measured. Keyed by file hash, so it carries no id: two
 * catalog items with byte-identical files legitimately share an entry, and the
 * id is put back from the catalog when the report is assembled.
 */
interface ManifestEntry {
  ok: boolean;
  steps?: number;
  measures?: number;
  /** Printed bars, which is what a section's numbers mean (P18). */
  sourceMeasures?: number;
  durationSec?: number;
  tempoBpm?: number | null;
  timeSig?: string | null;
  keySig?: string | null;
  hands?: string;
  /** A real rendered cursor's step count; render_check.py compares it to `steps`. */
  cursorSteps?: number;
  renderMs?: number;
  /** console.error / console.warn seen while this item loaded (replan §7.2). */
  consoleErrors?: string[];
  error?: string;
}

interface Manifest {
  version: number;
  entries: Record<string, ManifestEntry>;
}

interface ItemReport extends ManifestEntry {
  id: string;
  /** True when this row came from the manifest rather than a fresh render. */
  cached: boolean;
  preview?: string;
}

function loadManifest(): Manifest {
  if (full || !existsSync(manifestPath)) return { version: MANIFEST_VERSION, entries: {} };
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
    if (parsed.version !== MANIFEST_VERSION || typeof parsed.entries !== 'object') {
      return { version: MANIFEST_VERSION, entries: {} };
    }
    return { version: MANIFEST_VERSION, entries: parsed.entries ?? {} };
  } catch {
    // A truncated manifest is a cold start, not a failure.
    return { version: MANIFEST_VERSION, entries: {} };
  }
}

function writeManifest(manifest: Manifest): void {
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
}

function hashFile(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/**
 * Drops previews whose item is no longer in the catalog.
 *
 * The check used to empty the directory every run, on the grounds that a stale
 * preview looks current. That is still true, but emptying it is wrong once the
 * run is incremental: a cached item renders nothing and would lose its picture.
 * Pruning by id keeps both properties.
 */
function prunePreviews(keep: Set<string>): void {
  if (!existsSync(previewDir)) {
    mkdirSync(previewDir, { recursive: true });
    return;
  }
  for (const name of readdirSync(previewDir)) {
    if (!name.endsWith('.png')) continue;
    if (!keep.has(name.slice(0, -4))) rmSync(join(previewDir, name), { force: true });
  }
}

test.describe('content render check', () => {
  test.skip(!enabled, 'set CONTENT_RENDER_CHECK=1 (tools/content/render_check.py does)');
  // Hundreds of scores, some of them 500 bars long.
  test.setTimeout(60 * 60 * 1000);

  test('every catalog item renders and yields at least one step', async ({ page }) => {
    const source: CatalogItem[] = itemsJson
      ? (JSON.parse(readFileSync(itemsJson, 'utf-8')) as CatalogItem[])
      : (
          (await import(`file://${join(contentDir, 'catalog.json')}`, {
            with: { type: 'json' },
          })) as { default: CatalogItem[] }
        ).default;
    // A .pdf item is pages, not notes: it opens in the PDF viewer and OSMD
    // could never render it (docs/04 §5b).
    const items = source.filter(
      (item) => item.file && !item.file.toLowerCase().endsWith('.pdf'),
    );
    expect(items.length, 'catalog has no items with files').toBeGreaterThan(0);

    const manifest = loadManifest();
    const wanted = limit > 0 ? items.slice(0, limit) : items;
    // Pruned against the whole catalog, not against `wanted`: under --limit the
    // items outside the slice are still current, and deleting their previews
    // would make a quick spot-check destroy the rest of the gallery.
    prunePreviews(new Set(items.map((item) => item.id)));

    // console.error/warn per item (replan §7.2). Attached once: openDevScore
    // navigates the same Page, so the listener survives every reopen.
    let consoleLines: string[] = [];
    page.on('console', (message) => {
      const kind = message.type();
      if (kind === 'error' || kind === 'warning') consoleLines.push(`${kind}: ${message.text()}`);
    });
    page.on('pageerror', (error) => consoleLines.push(`pageerror: ${error.message}`));

    let driver = await openDevScore(page);
    await driver.setBars(PREVIEW_BARS);

    const reports: ItemReport[] = [];
    let rendered = 0;

    for (const item of wanted) {
      const filePath = join(contentDir, item.file as string);
      let hash: string;
      try {
        hash = hashFile(filePath);
      } catch (error) {
        reports.push({
          id: item.id,
          ok: false,
          cached: false,
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      const remembered = manifest.entries[hash];
      if (remembered) {
        const preview = join(previewDir, `${item.id}.png`);
        reports.push({
          id: item.id,
          cached: true,
          ...remembered,
          ...(existsSync(preview) ? { preview } : {}),
        });
        continue;
      }

      if (rendered > 0 && rendered % RELOAD_EVERY === 0) {
        driver = await openDevScore(page);
        await driver.setBars(PREVIEW_BARS);
      }
      rendered += 1;
      consoleLines = [];
      const startedAt = Date.now();
      const url = `/PianoProject/content/${item.file}`;
      let entry: ManifestEntry;
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
          entry = { ok: false, error: loadError, consoleErrors: distinctConsole(consoleLines) };
        } else {
          const summary = await page.evaluate(() => window.__pianopathDevScore?.modelSummary());
          if (!summary || summary.steps < 1) {
            entry = {
              ok: false,
              error: 'rendered but produced no steps',
              consoleErrors: distinctConsole(consoleLines),
            };
          } else {
            // The renderer pre-renders into an off-screen buffer and swaps it
            // in on an animation frame (docs/decisions P2), so a screenshot
            // taken the moment `loadUrl` resolves catches an empty stage —
            // which is how 39 of the first run's previews came out blank while
            // the items themselves rendered fine.
            await page.waitForFunction(
              () => {
                const svg = document.querySelector('#dev-stage svg');
                return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
              },
              undefined,
              { timeout: RENDER_TIMEOUT_MS },
            );
            // The step-count invariant, on content rather than only on the 41
            // fixtures (replan §7.1). It engraves the score a second time with
            // a live cursor, which is why it is gated behind the manifest.
            const cursorSteps = await driver.cursorStepCount();
            entry = {
              ok: true,
              ...summary,
              cursorSteps,
              renderMs: Date.now() - startedAt,
              consoleErrors: distinctConsole(consoleLines),
            };
          }
        }
      } catch (error) {
        entry = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          consoleErrors: distinctConsole(consoleLines),
        };
      }

      manifest.entries[hash] = entry;
      const row: ItemReport = { id: item.id, cached: false, ...entry };
      if (entry.ok) {
        const preview = join(previewDir, `${item.id}.png`);
        mkdirSync(dirname(preview), { recursive: true });
        await page.locator('#dev-stage').screenshot({ path: preview });
        row.preview = preview;
      }
      reports.push(row);

      if (rendered % MANIFEST_FLUSH_EVERY === 0) writeManifest(manifest);
    }

    writeManifest(manifest);
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(
      reportPath,
      `${JSON.stringify({ rendered, cached: reports.length - rendered, items: reports }, null, 2)}\n`,
      'utf-8',
    );

    const failed = reports.filter((r) => !r.ok);
    // The report is written before this assertion so a failing run still
    // leaves build.py something to read and name.
    expect(failed.map((f) => `${f.id}: ${f.error}`), 'items that did not render').toEqual([]);
  });
});
