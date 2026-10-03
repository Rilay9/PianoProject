import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The microscope's excerpt view (E1 item 6; Part 24, R40, R42), on the glass, and the chain D2 ran:
 *
 * - a candidate is drawn on its parent by the app's renderer, the bars outside the cut dimmed, and
 *   Hear it plays from before the cut to after it through the app's piano;
 * - moving a boundary re-scores it from the proposer's own table (the ending not met a bar short of
 *   the piece's last bar, met again on it), and the exported decision carries the moved range, an
 *   adjusted approval with the proposed range kept, which `tools/content/excerpts.py --merge` takes
 *   once and a rerun appends nothing;
 * - the build's cut of an approved row is an item the microscope's item view opens, measured and
 *   identified as its own file;
 * - the view says at its top that it is a desktop tool and how wide it wants the window (E35).
 *
 * The candidates are the proposer's own output for Anh. 113 (`excerpts.py propose --for
 * key.signature --rung classical.3 --of song.classical.bach-menuet-bwv-anh-113.pdmx`), kept as a
 * fixture so the spec does not depend on a proposal run on the machine; `test_excerpt_proposer.py`
 * holds the fixture to a fresh run on the built catalogue.
 */

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = join(APP, '..');
const CANDIDATES = join(APP, 'tests', 'e2e', 'fixtures', 'excerpt-candidates.json');
const PARENT = 'song.classical.bach-menuet-bwv-anh-113.pdmx';
const BUILT_EXCERPT = 'excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32';

interface Hook {
  ready(): boolean;
  candidate(): { of: string; fromBar: number; toBar: number; selection: string; score: number | null; scored: boolean } | null;
  outsideDimmed(): number;
  page(): { from: number; to: number } | null;
  hear(): { playing: boolean; pitches: number[]; from: number | null; to: number | null };
  decisions(): { event: string; decision: string; fromBar: number; toBar: number; state: string }[];
}

interface Snapshot {
  candidate: ReturnType<Hook['candidate']>;
  dimmed: number;
  hear: ReturnType<Hook['hear']>;
  decisions: ReturnType<Hook['decisions']>;
}

/** The view's published state, read at once. */
const snapshot = (page: Page): Promise<Snapshot> =>
  page.evaluate(() => {
    const h = (window as unknown as { __pianopathExcerpts: Hook }).__pianopathExcerpts;
    return { candidate: h.candidate(), dimmed: h.outsideDimmed(), hear: h.hear(), decisions: h.decisions() };
  });

async function openView(page: Page): Promise<void> {
  await page.route('**/dev/review/excerpts.json', (route) => route.fulfill({ path: CANDIDATES, contentType: 'application/json' }));
  await page.goto('/#/dev/microscope/excerpts');
  await expect(page.locator('[data-screen="dev-excerpts"][data-ready="true"]')).toBeVisible({ timeout: 60_000 });
}

function python(args: string[]): { code: number; out: string } {
  const exe = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
  const run = spawnSync(exe, args, { cwd: REPO, encoding: 'utf8' });
  if (run.error) throw run.error;
  return { code: run.status ?? -1, out: `${run.stdout}${run.stderr}` };
}

test.describe('the excerpt view (E1)', () => {
  test('draws the candidate on its parent, the bars outside it dimmed, and plays from before the cut to after it', async ({ page }) => {
    await openView(page);
    expect((await snapshot(page)).candidate).toMatchObject({ of: PARENT, fromBar: 25, toBar: 32, selection: 'both', scored: true });
    await expect(page.locator('#excerpts-stage.score-view[data-settled]')).toBeVisible({ timeout: 60_000 });
    await expect.poll(async () => (await snapshot(page)).dimmed, { timeout: 30_000 }).toBeGreaterThan(0);
    await expect(page.locator('#excerpts-window')).toContainText('bars 25–32 of 32');
    // The cut is on the page the view opens on, in full ink (the renderer mutes its read-ahead page).
    // Eight bars and the two before them need ten, more than a page holds, so the words say the
    // margins are a page away (the placement's cases are `excerptPage.test.ts`).
    const shownPage = await page.evaluate(() => (window as unknown as { __pianopathExcerpts: Hook }).__pianopathExcerpts.page());
    expect(shownPage).toEqual({ from: 25, to: 32 });
    await expect(page.locator('#excerpts-window')).toContainText('2 bars either side are in the playback, and on the page or a page away');
    // Every weighted signal met on the proposed bars, each part with its weight and reading.
    await expect(page.locator('#excerpts-score')).toContainText('every weighted signal met');
    for (const signal of ['opportunity', 'occurrences', 'phraseStart', 'ending', 'pickup', 'texture', 'length']) {
      await expect(page.locator(`[data-hook="parts"] tr[data-signal="${signal}"]`), signal).toHaveAttribute('data-fired', 'true');
    }
    await expect(page.locator('[data-gate="untaught"]')).toContainText('passed');

    await page.locator('#excerpts-hear').click();
    await expect.poll(async () => (await snapshot(page)).hear.pitches.length, { timeout: 60_000 }).toBeGreaterThan(0);
    // Two bars before the cut to the piece's end (the cut ends on its last bar).
    const heard = (await snapshot(page)).hear;
    expect({ from: heard.from, to: heard.to }).toEqual({ from: 23, to: 32 });
    await page.locator('#excerpts-stop').click();
    await expect(page.locator('#excerpts-stop')).toBeDisabled();
  });

  test('moving a boundary re-scores it, and the export carries the moved range to a merge that takes it once', async ({ page }) => {
    await openView(page);
    await page.locator('#excerpts-end-earlier').click();
    expect((await snapshot(page)).candidate).toMatchObject({ fromBar: 25, toBar: 31, scored: true });
    // A bar short of the last: the line runs on, and the ending is not met.
    await expect(page.locator('[data-hook="parts"] tr[data-signal="ending"]')).toHaveAttribute('data-fired', 'false');
    await expect(page.locator('#excerpts-window')).toContainText('(proposed 25–32)');
    await page.locator('#excerpts-end-later').click();
    await expect(page.locator('[data-hook="parts"] tr[data-signal="ending"]')).toHaveAttribute('data-fired', 'true');
    await page.locator('#excerpts-start-later').click();
    expect((await snapshot(page)).candidate).toMatchObject({ fromBar: 26, toBar: 32, scored: true });
    await expect(page.locator('[data-hook="parts"] tr[data-signal="phraseStart"]')).toHaveAttribute('data-fired', 'false');

    await page.locator('#excerpts-reviewer').fill('E2E Reviewer');
    await page.locator('#excerpts-reviewer').dispatchEvent('change');
    await page.locator('#excerpts-note').fill('moved a bar later to see the start signal fail; an adjusted approval for the spec');
    await page.locator('#excerpts-approve').click();
    await expect(page.locator('#excerpts-decisions li[data-state="unexported"]')).toHaveCount(1);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#excerpts-export').click()]);
    const folder = mkdtempSync(join(tmpdir(), 'excerpts-'));
    const exported = join(folder, download.suggestedFilename());
    await download.saveAs(exported);
    const [line] = readFileSync(exported, 'utf8').trim().split('\n');
    const decision = JSON.parse(line ?? '{}') as Record<string, unknown>;
    expect(decision).toMatchObject({ decision: 'adjust', of: PARENT, fromBar: 26, toBar: 32, selection: 'both', proposed: { fromBar: 25, toBar: 32 }, by: 'E2E Reviewer' });

    // The merge the brief names, into a copy of the definitions: taken once, and a rerun appends nothing.
    const definitions = join(folder, 'excerpts.json');
    const committed = join(REPO, 'content', 'sources', 'excerpts.json');
    if (existsSync(committed)) copyFileSync(committed, definitions);
    else writeFileSync(definitions, '{"excerpts": [], "rejected": []}\n');
    const content = join(APP, 'public', 'content');
    const first = python(['tools/content/excerpts.py', '--merge', exported, '--definitions', definitions, '--content', content]);
    expect(first.code, first.out).toBe(0);
    expect(first.out).toContain('appended 1');
    const written = readFileSync(definitions, 'utf8');
    const again = python(['tools/content/excerpts.py', '--merge', exported, '--definitions', definitions, '--content', content]);
    expect(again.code, again.out).toBe(0);
    expect(again.out).toContain('appended 0, already in the file 1');
    expect(readFileSync(definitions, 'utf8')).toBe(written);
  });

  test('says at the top that it is a desktop tool and how wide it wants the window (E35)', async ({ page }) => {
    await openView(page);
    const line = page.locator('#excerpts-desktop');
    await expect(line).toBeVisible();
    await expect(line).toContainText('A desktop tool');
    await expect(line).toContainText('960 px');
    // Above everything else the view draws: the lists, the score, the decisions.
    const first = await page.evaluate(() => {
      const desktop = document.querySelector('#excerpts-desktop');
      const run = document.querySelector('#excerpts-run');
      return Boolean(desktop && run && desktop.compareDocumentPosition(run) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(first).toBe(true);
  });

  test('the build’s cut of an approved row opens in the item view as an item of its own', async ({ page }) => {
    await page.goto(`/#/dev/microscope/${BUILT_EXCERPT}`);
    await expect(page.locator('[data-screen="dev-microscope"][data-ready="true"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#microscope-stage.score-view[data-settled]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-fact="identity"]')).toContainText('the built file, sha256');
    await expect(page.locator('[data-fact="provenance"]')).toContainText('source: excerpt');
    await expect(page.locator('[data-fact="demands"] tr[data-demand="key.signature"]')).toBeVisible();
    // Measured on the cut: nothing of the parent's that the cut does not carry.
    await expect(page.locator('[data-fact="demands"] tr[data-demand="rhythm.sixteenths"]')).toHaveCount(0);
    await expect(page.locator('[data-fact="demands"] tr[data-demand="rhythm.triplets"]')).toHaveCount(0);
    await expect(page.locator('[data-fact="rungs"]')).toContainText('No rung lists it');
  });
});
