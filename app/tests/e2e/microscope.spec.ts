import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The builder's microscope (D2; G28, G29, E16, R42; Q41 cases 17 and 18), on the glass:
 *
 * - a generated item opened by id shows its notation settled, drawn by the app's renderer,
 *   every fact item 1 names under its own hook, and Hear it enabled;
 * - Hear it plays the item through the app's piano: each hand alone schedules only that
 *   hand's pitches, and both hands both (the brief's first hypothesis, on a two-hand groove);
 * - a decision recorded on the screen is exported as a file that `tools/content/review.py
 *   --merge` accepts, and a rerun of the merge appends nothing;
 * - the learner's navigation never shows the route, and a review mutates nothing of the
 *   learner's: every IndexedDB store and every other localStorage key byte-identical before
 *   and after (the reviewer's constraint, `docs/review/responses/7ab175a.md`);
 * - three lines tell what the build knows (D5; G55, G56, G60), at a study, a groove and a
 *   drill: the musical gate's verdict with the evaluator's version and where it came from,
 *   "unheard" beside it, the contract's "not evaluated" words for a groove and a drill as a
 *   drill; "requires but the notes lack" only of what the recipe selects; every provenance
 *   fact with its value.
 */

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO = join(APP, '..');
/** A music family's canonical item, generated, both hands: the Latin groove on the son clave. */
const ITEM = 'exercise.latin-groove.c.son-3-2';
/** The generated study D3 walked (2.1's interval reading), whose phrase shape the gate evaluates. */
const STUDY = 'exercise.study.interval-reading.c-major.4-4.8bar.sustained.01';
/** A drill whose family requires the bass clef of its left-hand recipes only: this one is right-handed. */
const DRILL = 'exercise.interval-reading.c-position.right.01';
const FACTS = [
  'identity',
  'family',
  'version',
  'seed',
  'role',
  'promise',
  'heard',
  'target',
  'musical',
  'demands',
  'physical',
  'provenance',
  'rungs',
  'reviews',
] as const;
const TABS = ['today', 'plan', 'library', 'progress', 'settings'];

interface Hook {
  ready(): boolean;
  hear(): { playing: string | null; heardComplete: boolean; pitches: number[] };
  handPitches(): { R: number[]; L: number[] };
  decisions(): { event: string; item: string; state: string }[];
}

async function openItem(page: Page, id: string): Promise<void> {
  await page.goto(`/#/dev/microscope/${id}`);
  await expect(page.locator('[data-screen="dev-microscope"][data-ready="true"]')).toBeVisible({ timeout: 60_000 });
}

/** Everything of the learner's the browser holds: every IndexedDB store, and localStorage but the microscope's own keys. */
async function learnerState(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pianopath');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('open failed'));
    });
    const stores: Record<string, unknown> = {};
    for (const name of Array.from(db.objectStoreNames).sort()) {
      stores[name] = await new Promise((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const keys = tx.objectStore(name).getAllKeys();
        const values = tx.objectStore(name).getAll();
        tx.oncomplete = () => resolve({ keys: keys.result, values: values.result });
        tx.onerror = () => reject(tx.error ?? new Error('read failed'));
      });
    }
    const version = db.version;
    db.close();
    const local: [string, string | null][] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key !== null && !key.startsWith('pianopath.microscope.')) local.push([key, localStorage.getItem(key)]);
    }
    local.sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify({ version, stores, local });
  });
}

/** The state once nothing is still writing it: two reads a moment apart that agree. */
async function settledLearnerState(page: Page): Promise<string> {
  let previous = await learnerState(page);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.waitForTimeout(250);
    const now = await learnerState(page);
    if (now === previous) return now;
    previous = now;
  }
  throw new Error('the learner stores never stopped changing');
}

function python(args: string[]): { code: number; out: string } {
  const exe = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
  const run = spawnSync(exe, args, { cwd: REPO, encoding: 'utf8' });
  if (run.error) throw run.error;
  return { code: run.status ?? -1, out: `${run.stdout}${run.stderr}` };
}

test.describe('the microscope (D2)', () => {
  test('opens a generated item by id: the notation settled, every fact under its hook, Hear it enabled', async ({ page }) => {
    await openItem(page, ITEM);
    await expect(page.locator('#microscope-stage.score-view[data-settled]')).toBeVisible({ timeout: 60_000 });
    for (const fact of FACTS) await expect(page.locator(`[data-fact="${fact}"]`), fact).toBeVisible();
    await expect(page.locator('[data-fact="family"]')).toContainText('latin_groove');
    await expect(page.locator('[data-fact="version"]')).toContainText('v1');
    await expect(page.locator('[data-fact="role"]')).toContainText('canonical');
    await expect(page.locator('[data-fact="promise"]')).toContainText('music');
    await expect(page.locator('[data-fact="heard"]')).toContainText('unheard');
    await expect(page.locator('[data-fact="identity"]')).toContainText('generator latin_groove v1');
    // The contract's verdict beside each measured demand, with its located count.
    await expect(page.locator('[data-fact="demands"] tr[data-verdict="required"]')).not.toHaveCount(0);
    await expect(page.locator('[data-fact="rungs"] [data-rung]')).not.toHaveCount(0);
    await expect(page.locator('#microscope-hear')).toBeEnabled();
    await expect(page.locator('#microscope-hear-right')).toBeEnabled();
    await expect(page.locator('#microscope-hear-left')).toBeEnabled();
    // The queue: the music families first, the item placed in it.
    await expect(page.locator('[data-tier="music"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#microscope-item')).toHaveValue(ITEM);
    // `heard` cannot be chosen before a complete both-hands playback.
    await expect(page.locator('#basis-goodTeachingUse-heard')).toBeDisabled();
  });

  test('Hear it plays through the app’s piano: each hand alone its own pitches, both hands both', async ({ page }) => {
    await openItem(page, ITEM);
    const hook = (): Promise<{ hear: ReturnType<Hook['hear']>; hands: ReturnType<Hook['handPitches']> }> =>
      page.evaluate(() => {
        const h = (window as unknown as { __pianopathMicroscope: Hook }).__pianopathMicroscope;
        return { hear: h.hear(), hands: h.handPitches() };
      });
    const { hands } = await hook();
    expect(hands.R.length).toBeGreaterThan(0);
    expect(hands.L.length).toBeGreaterThan(0);

    const play = async (button: string): Promise<number[]> => {
      await page.locator(button).click();
      // The soundfont loads on the first tap; the scheduled pitches are the published state.
      await expect
        .poll(async () => (await hook()).hear.pitches.length, { timeout: 60_000 })
        .toBeGreaterThan(0);
      await page.waitForTimeout(1_500);
      const pitches = (await hook()).hear.pitches;
      await page.locator('#microscope-stop').click();
      await expect(page.locator('#microscope-stop')).toBeDisabled();
      return pitches;
    };

    const right = await play('#microscope-hear-right');
    expect(right.every((midi) => hands.R.includes(midi)), `right alone scheduled ${right.join(',')}`).toBe(true);
    const left = await play('#microscope-hear-left');
    expect(left.every((midi) => hands.L.includes(midi)), `left alone scheduled ${left.join(',')}`).toBe(true);
    const both = await play('#microscope-hear');
    expect(both.some((midi) => hands.R.includes(midi) && !hands.L.includes(midi))).toBe(true);
    expect(both.some((midi) => hands.L.includes(midi) && !hands.R.includes(midi))).toBe(true);
    // Stopped part way: not heard.
    expect((await hook()).hear.heardComplete).toBe(false);
    await expect(page.locator('#microscope-hear-status')).toContainText('partial playback stays notation');
    await expect(page.locator('#basis-goodTeachingUse-heard')).toBeDisabled();
  });

  test('a decision is exported as a file review.py --merge accepts, and the learner’s stores do not move', async ({ page }) => {
    // The learner has practised: a run written by the app's own writer, before anything else.
    await page.goto('/#/progress');
    await expect(page.locator('#progress-week')).toBeVisible();
    await page.evaluate(async () => {
      const hooks = (window as unknown as { __pianopath?: { recordRun?: (r: unknown) => Promise<unknown> } }).__pianopath;
      if (!hooks?.recordRun) throw new Error('recordRun is not exposed');
      await hooks.recordRun({
        itemId: 'song.folk.hot-cross-buns',
        mode: 'tempo',
        tempoPct: 100,
        accuracy: 0.95,
        accuracyEstimated: false,
        wrongNotes: 1,
        missed: 0,
        durationMs: 240_000,
        passed: true,
        masterEligible: false,
      });
    });
    const before = await settledLearnerState(page);
    expect(before).toContain('song.folk.hot-cross-buns');

    // Into the microscope by address, no reload: the same page, the same stores.
    await page.evaluate((id) => {
      window.location.hash = `#/dev/microscope/${id}`;
    }, ITEM);
    await expect(page.locator('[data-screen="dev-microscope"][data-ready="true"]')).toBeVisible({ timeout: 60_000 });
    await page.locator('#microscope-hear-right').click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __pianopathMicroscope: Hook }).__pianopathMicroscope.hear().pitches.length), {
        timeout: 60_000,
      })
      .toBeGreaterThan(0);
    await page.locator('#microscope-stop').click();

    await page.locator('#microscope-reviewer').fill('E2E Reviewer');
    await page.locator('#microscope-reviewer').dispatchEvent('change');
    await page.locator('#value-usableScore-yes').check();
    await page.locator('#category-usableScore').selectOption('notation');
    await page.locator('#basis-usableScore-notation').check();
    await page.locator('#reason-usableScore').fill('read the page: both staves spelled in C minor, the anticipations tied');
    await page.locator('#record-usableScore').click();
    await expect(page.locator('[data-hook="now-usableScore"]')).toContainText('yes (notation)');
    await expect(page.locator('[data-hook="now-goodTeachingUse"]')).toContainText('undecided');
    await page.locator('#microscope-flag-reason').fill('the montuno may crowd the clave at this tempo');
    await page.locator('#microscope-flag').click();
    await expect(page.locator('#microscope-decisions li[data-state="unexported"]')).toHaveCount(2);

    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#microscope-export').click()]);
    const folder = mkdtempSync(join(tmpdir(), 'microscope-'));
    const exported = join(folder, download.suggestedFilename());
    await download.saveAs(exported);
    await expect(page.locator('#microscope-decisions li[data-state="exported"]')).toHaveCount(2);
    const lines = readFileSync(exported, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => (JSON.parse(line) as { by: string }).by).sort()).toEqual(['E2E Reviewer', 'triage']);

    // The merge the brief names, into a copy of the record: accepted, and idempotent.
    const record = join(folder, 'decisions.jsonl');
    const committed = join(REPO, 'content', 'review', 'decisions.jsonl');
    if (existsSync(committed)) copyFileSync(committed, record);
    else writeFileSync(record, '');
    const content = join(APP, 'public', 'content');
    const first = python(['tools/content/review.py', '--merge', exported, '--record', record, '--content', content]);
    expect(first.code, first.out).toBe(0);
    expect(first.out).toContain('appended 2');
    const written = readFileSync(record, 'utf8');
    const again = python(['tools/content/review.py', '--merge', exported, '--record', record, '--content', content]);
    expect(again.code, again.out).toBe(0);
    expect(again.out).toContain('appended 0, already in the record 2');
    expect(readFileSync(record, 'utf8')).toBe(written);

    expect(await settledLearnerState(page)).toBe(before);
  });

  test('three lines tell what the build knows: the gate’s verdict, the selected requirements, every fact’s value (D5)', async ({
    page,
  }) => {
    const UNHEARD = 'unheard: no hearing counts until a person’s decision.';
    const open = async (id: string): Promise<void> => {
      await openItem(page, id);
      await expect(page.locator(`[data-screen="dev-microscope"][data-ready="true"] [data-hook="item"][data-item="${id}"]`)).toBeVisible();
    };
    const musical = page.locator('[data-fact="musical"]');
    const demands = page.locator('[data-fact="demands"]');
    const provenance = page.locator('[data-fact="provenance"]');

    // A study: the gate evaluated its phrase shape from the notation, and says with which evaluator.
    await open(STUDY);
    await expect(musical).toContainText(
      'Evaluated from the notation by musical_evaluator.score_study v1, recomputed by the projection from the built notes: passes — phrase shape 0.',
    );
    await expect(musical).toContainText('against the floor 0.8 (notation, not hearing; unheard); no wrong cadence.');
    await expect(musical).toContainText(UNHEARD);
    await expect(musical).not.toContainText('no musical evaluator exists');
    // The other targets' requirements are not this study's (it lacked four of them on the old screen).
    await expect(demands).not.toContainText('Contract requires but the notes lack');
    await expect(provenance).toContainText('promise: music (authored) — family_contracts.json (the rule matching the recipe)');
    await expect(provenance).toContainText('reviewedScore: yes (reviewed) — content/review/decisions.jsonl — basis notation');
    await expect(provenance).toContainText('reviewedTeaching: no decision');

    // A groove: promised as music, not evaluated, in the contract's words; no version, no total.
    await open(ITEM);
    await expect(musical).toContainText(
      'Promised as music — not evaluated: idiom needs hearing — the evaluator judges phrase shape, not idiom',
    );
    await expect(musical).toContainText(UNHEARD);
    await expect(musical).not.toContainText('no musical evaluator exists');
    await expect(musical).not.toContainText('musical_evaluator');
    await expect(provenance).toContainText('promise: music (authored)');
    await expect(provenance).toContainText('reviewedScore: no decision');
    await expect(provenance).toContainText('reviewedTeaching: no decision');

    // A drill: judged as a drill; a right hand is not told it lacks the bass clef.
    await open(DRILL);
    await expect(musical).toContainText('A drill: judged as a drill, never as music; its repetition is the point.');
    await expect(musical).not.toContainText(UNHEARD);
    await expect(demands).not.toContainText('Contract requires but the notes lack');
    await expect(provenance).toContainText('promise: drill (authored)');
  });

  test('the learner’s navigation never shows the route', async ({ page }) => {
    await openItem(page, ITEM);
    const tabs = page.locator('.tab-nav .tab-button');
    await expect(tabs).toHaveCount(TABS.length);
    expect(await tabs.evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.tab))).toEqual(TABS);
    // A builder route belongs to no tab.
    await expect(page.locator('.tab-nav [aria-current="page"]')).toHaveCount(0);
    for (const tab of TABS) {
      await page.goto(`/#/${tab}`);
      await expect(page.locator('.tab-nav .tab-button.active')).toHaveAttribute('data-tab', tab);
      await expect(page.locator('main [data-screen]').first()).toBeVisible();
      await expect(page.locator('a[href*="microscope"], [id*="microscope"], [data-screen="dev-microscope"]')).toHaveCount(0);
      await expect(page.getByText(/microscope/i)).toHaveCount(0);
    }
  });
});
