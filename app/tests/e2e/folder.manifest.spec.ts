/**
 * The manifest-first listing at the owner's real geometry (342 × 740).
 *
 * Reversing the design — the folder's `library.json` is the index, the walk is
 * the fallback — added two things the screen has to say, and this screen is the
 * one where saying anything costs pixels. `04` §0 R1, the first score visible
 * without scrolling, has been broken twice by exactly this: an extra sentence
 * above the list. So both new sentences went into the fold, one of them changes
 * the fold's own summary rather than adding a line, and the interrupted-index
 * state adds a button to a row that already has one.
 *
 * Which is to say the risk here is layout, and it is only measurable at the
 * owner's width with the owner's number of scores. The two tests below are that
 * measurement, plus the assertion that the sentences are actually there to be
 * found.
 */
import { expect, test } from '@playwright/test';

const FOLDER = 'pianopath-library';
const ROWS = 37_261;

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

/**
 * Writes a listing as one of the three reads would have left it.
 *
 * `listedFrom` and `pending` are what the store carries beyond the rows: 37,261
 * titles look identical whether they were read out of `library.json` in one go
 * or walked over several minutes, and only these say which — which is what the
 * screen needs in order to tell the owner what his listing cannot see.
 */
async function seedFolder(
  page: import('@playwright/test').Page,
  rows: number,
  listedFrom: 'manifest' | 'partial' | 'walk',
  pending: string[] = [],
): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    async ({ folder, count, from, left }) => {
      const scores = Array.from({ length: count }, (_, i) => ({
        file: `${String(i % 100).padStart(2, '0')}/Qm${String(i)}.mxl`,
        title: `Piece number ${String(i)}`,
        composer: `Composer ${String(i % 500)}`,
        level: Math.round((1 + (i % 80) / 10) * 10) / 10,
        bars: 16 + (i % 200),
        status: 'pd',
        style: 'classical',
        rating: 0,
        ratings: 0,
        views: 0,
        lyrics: false,
        garbled: false,
        museScore: '',
      }));
      const open = indexedDB.open('pianopath');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error ?? new Error('could not open the database'));
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('folderLibraries', 'readwrite');
        tx.objectStore('folderLibraries').put({
          id: folder,
          addedAt: new Date().toISOString(),
          source: 'PDMX',
          scores,
          listedFrom: from,
          ...(left.length === 0 ? {} : { pending: left }),
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('could not write the folder'));
      });
      db.close();
    },
    { folder: FOLDER, count: rows, from: listedFrom, left: pending },
  );
}

/**
 * The first row's bottom edge, and the same again with wider type.
 *
 * The second number is the one that has caught every regression here. A
 * threshold in pixels stands in for the rule and then drifts: this screen has
 * passed on this machine and failed on the runner twice, because the runner's
 * fonts are about 8 % wider and one more wrapped line is 22 px. So the margin
 * is bought by asking the page to lay itself out at 115 % of its font size,
 * which is a simulation of the thing that goes wrong rather than an allowance
 * for it.
 */
async function firstRowFits(page: import('@playwright/test').Page): Promise<{
  bottom: number;
  wider: number;
  fold: number;
}> {
  const first = page.locator('#folder-list .list-row').first();
  await expect(first).toBeVisible();
  const box = await first.boundingBox();
  expect(box, 'no first row').not.toBeNull();
  const wider = await page.evaluate(() => {
    const root = document.documentElement;
    const was = root.style.fontSize;
    const base = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
    root.style.fontSize = `${String(base * 1.15)}px`;
    void root.offsetHeight;
    const row = document.querySelector('#folder-list .list-row');
    const at = row ? Math.round(row.getBoundingClientRect().bottom) : -1;
    root.style.fontSize = was;
    return at;
  });
  return {
    bottom: Math.round((box?.y ?? 0) + (box?.height ?? 0)),
    wider,
    fold: page.viewportSize()?.height ?? 740,
  };
}

test.describe('a listing read out of library.json', () => {
  test('says what it cannot see, and costs the first score nothing', async ({ page }) => {
    await page.setViewportSize({ width: 342, height: 740 });

    // The same screen with the same rows, listed the way it was before: the
    // yardstick. What matters is not the pixel this lands on — that moves with
    // the fonts of whatever machine is measuring — but that saying the new
    // thing costs nothing against the screen that says nothing.
    await seedFolder(page, ROWS, 'walk');
    await page.goto('/#/library/folder');
    const plain = await firstRowFits(page);

    await seedFolder(page, ROWS, 'manifest');
    await page.goto('/#/library/folder');
    const said = await firstRowFits(page);
    console.log(
      `folder/manifest: first row ends at ${String(said.bottom)}px (${String(plain.bottom)} saying nothing), ` +
        `${String(said.wider)}px at 115 % (${String(plain.wider)})`,
    );

    expect(said.bottom, `the first score fell below the fold at ${String(said.bottom)}px`).toBeLessThan(
      said.fold,
    );
    // Wider type is how this screen has actually been broken, twice. Against
    // the plain listing rather than against 740, because at this width the
    // plain listing is itself close to the fold at 115 % — that is a separate
    // debt, and this test is about whether the new sentence adds to it.
    expect(
      said.wider,
      `saying it costs ${String(said.wider - plain.wider)}px of wider type`,
    ).toBeLessThanOrEqual(plain.wider);

    // The summary carries the pointer, because it is a line that is drawn
    // anyway. The sentence itself is four lines at this width and would push
    // the first score off the screen, which is the mistake R1 exists to stop.
    await expect(page.locator('#folder-how summary')).toContainText('what it misses');
    await page.locator('#folder-how summary').click();
    const note = page.locator('#folder-rescan-note');
    await expect(note).toContainText('library.json');
    await expect(note).toContainText('cannot see a score put into the folder');
    await expect(note).toContainText('Rescan folder reads all 37,261 files');
  });
});

test.describe('an index that was stopped part way', () => {
  test('says how far it got and offers to finish, and R1 still holds', async ({ page }) => {
    const left = Array.from({ length: 301 }, (_, i) => String(i + 300).padStart(2, '0'));
    await page.setViewportSize({ width: 342, height: 740 });
    await seedFolder(page, 12_000, 'partial', left);
    await page.goto('/#/library/folder');

    // Two buttons where there is usually one is the layout risk in this state,
    // and this width is where it would show.
    await expect(page.locator('#folder-resume')).toHaveText('Continue indexing');
    await expect(page.locator('#folder-pick')).toHaveText('Rescan folder');
    const { bottom, wider, fold } = await firstRowFits(page);
    console.log(`folder/partial: at 342×740 the first row ends at ${String(bottom)}px, ${String(wider)}px at 115 %`);
    expect(bottom, `the first score fell below the fold at ${String(bottom)}px`).toBeLessThan(fold);
    expect(wider, `at 115 % of the font size it ends at ${String(wider)}px`).toBeLessThan(fold);

    // And the count above the list does not pass itself off as the size of the
    // folder, because it is not: it is how much of it has been looked at.
    const above = page.locator('#folder-progress').locator('xpath=..');
    await expect(above).toContainText('12,000 scores so far');
    await expect(above).toContainText('301 folders still to index');
  });
});
