/**
 * Sweeps — the checks that go over *everything* rather than over an example
 * (P19 §C3).
 *
 * The rest of the suite tests one lesson page, one drill of each interesting
 * kind, one import. These walk the shipped content: every lesson the curriculum
 * declares, every runtime drill kind, one item of every type and every source. They are slow
 * on purpose, and they are the tests that catch content changing under code
 * that was written for the content of the day.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

const catalog = JSON.parse(
  readFileSync(resolve('public/content/catalog.json'), 'utf8'),
) as CatalogItem[];
const curriculum = JSON.parse(
  readFileSync(resolve('public/content/curriculum.json'), 'utf8'),
) as Curriculum;

const lessons: { lesson: Lesson; stage: number; track: string }[] = curriculum.stages.flatMap(
  (stage) =>
    stage.units.flatMap((unit) =>
      unit.lessons.map((lesson) => ({ lesson, stage: stage.number, track: unit.track })),
    ),
);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
});

/**
 * Console errors that are the browser's business rather than the app's.
 *
 * Nothing here hides an app error: the soundfont is fetched lazily and is
 * allowed to fail on a machine with no audio device, and a favicon is a
 * favicon.
 */
const IGNORED = [/favicon/i, /soundfont/i, /AudioContext/i, /user gesture/i];

test.describe('every lesson page', () => {
  test('all of them open by URL, draw their options and say what they need', async ({ page }) => {
    test.setTimeout(300_000);
    // Every lesson the curriculum declares, however many that is.
    //
    // This read `>= 90`, which is a count of the content on the day it was
    // written, not a property of anything. Removing seven rungs whose songs
    // could never be obtained took the curriculum to 86 and turned a
    // deliberate, approved deletion into a red suite. What the sweep is for is
    // that *every* lesson opens — so it asserts it visited all of them, and
    // that there are enough to be worth sweeping at all.
    expect(lessons.length, 'no lessons were read — the curriculum path is wrong').toBeGreaterThan(20);
    const declared = curriculum.stages.reduce(
      (sum, stage) => sum + stage.units.reduce((n, unit) => n + (unit.lessons?.length ?? 0), 0),
      0,
    );
    expect(lessons.length, 'the sweep is not visiting every lesson in the curriculum').toBe(declared);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`${page.url()}: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (IGNORED.some((pattern) => pattern.test(text))) return;
      errors.push(`${page.url()}: ${text}`);
    });

    const empty: string[] = [];
    for (const { lesson } of lessons) {
      await page.goto(`/#/lesson/${lesson.id}`);
      // The title proves the route resolved to this rung and not to the "no
      // such lesson" state, which is the failure a wrong id pattern produces.
      await expect(page.locator('[data-screen="lesson"] h1')).toContainText(lesson.id);
      await expect(page.locator('#lesson-needs')).toContainText(/options?|wants/);
      const options = await page.locator('#lesson-exercises .list-row, #lesson-songs .list-row').count();
      if (options === 0 && lesson.optionsExempt !== true) empty.push(lesson.id);
    }

    expect(empty, 'rungs that drew no options at all').toEqual([]);
    expect(errors, 'console errors while opening every lesson').toEqual([]);
  });

  test('every rung that has a finder can open it', async ({ page }) => {
    test.setTimeout(300_000);
    const withFinder = lessons.filter((entry) => entry.lesson.finder);
    expect(withFinder.length).toBeGreaterThan(50);
    // Opening all 89 sheets is a minute of clicking for one assertion; the
    // claim worth proving is that the button is there on every one of them and
    // that the sheet opens, so the sheet is opened on a sample and the button
    // is checked on all.
    for (const { lesson } of withFinder) {
      await page.goto(`/#/lesson/${lesson.id}`);
      await expect(page.locator('#lesson-find-more')).toBeVisible();
    }
    await page.locator('#lesson-find-more').click();
    await expect(page.locator('#finder-sheet')).toBeVisible();
  });
});

test.describe('every kind of drill', () => {
  const runtime = catalog.filter((item) => item.drill && !item.file);
  const byKind = new Map<string, CatalogItem>();
  for (const item of runtime) {
    const kind = item.drill?.kind;
    if (kind && !byKind.has(kind)) byKind.set(kind, item);
  }

  test('one of each opens, draws a card and offers a way to answer', async ({ page }) => {
    test.setTimeout(300_000);
    expect(byKind.size).toBeGreaterThanOrEqual(15);
    const broken: string[] = [];
    /**
     * Kinds the screen openly marks `unavailable`, with the sentence that says
     * so, rather than dealing a card.
     *
     * Named one by one and never widened without reading this. A kind here is
     * a promise the catalog is making and the app is not keeping; the only
     * thing that makes it tolerable is that the screen says which, in words,
     * instead of drawing a working-looking card or blaming the learner for not
     * importing a file.
     *
     * **It is empty, and keeping it empty is the point.** `walkthrough` — the
     * guided tour of Wait, Tempo and loops — was the last entry: it now runs,
     * by explaining each mode and opening the real Score screen in it
     * (`04` §5c-1), so every kind the catalog offers deals a card or steps.
     *
     * Anything that reaches `unavailable` and is *not* named here fails, which
     * is the case this list exists to keep failing.
     */
    const notBuilt = new Set<string>([]);

    for (const [kind, item] of byKind) {
      if (kind === 'sight-reading') continue; // notation: it opens the Score screen
      await page.goto(`/#/drill/${item.id}`);
      const screen = page.locator('[data-screen="drill"]');
      if (notBuilt.has(kind)) {
        // Still held to something: the state, and a sentence a person can read
        // that names the thing and does not ask them to do anything about it.
        await expect(screen).toHaveAttribute('data-drill', 'unavailable', { timeout: 30_000 });
        const said = (await page.locator('#drill-status').textContent())?.trim() ?? '';
        if (said.length < 20) broken.push(`${kind}: marked unavailable and says nothing`);
        // Not the word "import" — the sentence is allowed to say it is *not* a
        // file to import, and that is the point it is making. What it may not
        // do is ask for one, which is the badge this kind used to wear.
        if (/import needed|needs? import|import (?:your|a copy|it)/i.test(said)) {
          broken.push(`${kind}: asks the learner to import a file`);
        }
        continue;
      }
      // `data-drill` is the screen's own account of itself, and the only
      // signal here that is not a race: `running` means a drill was built and
      // its first card dealt. Waiting on an element being visible was not
      // enough — the prompt has padding, so an empty one is still "visible",
      // and under nine other workers it was read before it was filled.
      //
      // A generous timeout for the same reason: an ear drill waiting for an
      // AudioContext on a loaded machine is slow, not broken.
      try {
        await expect(screen).toHaveAttribute('data-drill', 'running', { timeout: 30_000 });
      } catch {
        const state = await screen.getAttribute('data-drill');
        broken.push(`${kind}: the screen is "${state ?? 'absent'}", not running`);
        continue;
      }
      // And something to look at: the prompt, or the stage, depending on the
      // kind — a chord names a chord, a rhythm draws a row, a pedal lights a
      // lamp.
      const shown = await page
        .locator('#drill-prompt, #drill-stage')
        .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? '').join(''));
      const drawn = await page.locator('#drill-stage svg, #drill-stage canvas, #drill-stage .meter-row').count();
      if (shown.length === 0 && drawn === 0) broken.push(`${kind}: nothing on the card`);
    }
    expect(broken).toEqual([]);
  });
});

test.describe('where an item opens', () => {
  /** One of each shape `ui/openItem.ts` distinguishes. */
  function example(predicate: (item: CatalogItem) => boolean): CatalogItem | undefined {
    return catalog.find(predicate);
  }

  const bundledSong = example((i) => i.type === 'song' && Boolean(i.file) && !i.tags?.includes('pdmx'));
  const generated = example((i) => i.type === 'exercise' && Boolean(i.file) && Boolean(i.drill));
  const pdmx = example((i) => Boolean(i.file) && (i.tags ?? []).includes('pdmx'));
  const placeholder = example((i) => i.type === 'song' && !i.file && Boolean(i.importHint));
  const runtimeDrill = example((i) => i.type === 'drill' && Boolean(i.drill) && !i.file);

  test('a bundled song, a generated exercise and a quarried score open on the Score screen', async ({
    page,
  }) => {
    for (const item of [bundledSong, generated, pdmx]) {
      expect(item, 'the catalog no longer has one of these shapes').toBeTruthy();
      await page.goto(`/#/score/${item!.id}`);
      await expect(page.locator('[data-screen="score"]')).toBeVisible();
      await expect(page.locator('#score-status')).not.toContainText('Unknown item');
    }
  });

  test('a runtime drill opens on the drill screen', async ({ page }) => {
    expect(runtimeDrill).toBeTruthy();
    await page.goto(`/#/drill/${runtimeDrill!.id}`);
    await expect(page.locator('[data-screen="drill"]')).toBeVisible();
  });

  test('a placeholder says what to do instead of opening nothing', async ({ page }) => {
    expect(placeholder).toBeTruthy();
    await page.goto('/#/library');
    await page.locator('#library-search').fill(placeholder!.title);
    const row = page.locator(`#library-list [data-item="${placeholder!.id}"]`);
    await expect(row).toBeVisible();
    await expect(row).toContainText('import needed');
    await row.getByRole('button', { name: 'Details', exact: true }).click();
    await expect(page.locator('#library-detail')).toContainText(/import|not bundled/i);
  });
});

test.describe('when the level model is missing', () => {
  test('an import says "no estimate" rather than showing a made-up number', async ({ page }) => {
    // The fallback nobody would notice was broken: a default of 5 presented as
    // an estimate is worse than no estimate, because there is no reason to
    // doubt it.
    await page.route('**/level-model.json', (route) => route.fulfill({ status: 404, body: '' }));
    await page.goto('/#/library?for=2.1');
    await page
      .locator('#library-file')
      .setInputFiles(resolve('tests/fixtures/imports/test-tune.mxl'));
    const sheet = page.locator('#assign-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('#assign-level-hint')).toContainText('No estimate');
    await expect(sheet.locator('#assign-level')).toHaveValue('');
  });
});
