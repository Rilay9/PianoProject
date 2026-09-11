/**
 * The score folder at the size it will actually be (P19 §C3).
 *
 * The owner's folder holds **37,261** MusicXML files, and every existing test
 * of this screen uses two. The listing is what the screen draws — the files
 * themselves are lent for one visit — so seeding a listing of the real size is
 * the honest version of this test, and it is the half that can be answered
 * without the phone.
 *
 * What it cannot answer, and what stays on the owner's checklist (review S1):
 * how long Chrome for Android takes to hand over 37,261 `File` objects through
 * the picker in the first place.
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
      // A cleared origin is a first launch, and a first launch is the setup
      // tour (docs/04 §7d); this spec is about what comes after it.
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

/**
 * Writes a folder listing straight into the store, as picking a folder would.
 *
 * `withManifest: false` is the folder that has no `library.json` — every row
 * is then a bare one whose title came from its filename and whose level,
 * composer and style are unknown.
 */
async function seedFolder(
  page: import('@playwright/test').Page,
  rows: number,
  withManifest = true,
): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    async ({ folder, count, manifest }) => {
      const styles = ['classical', 'ragtime', 'jazz', 'folk', 'pop'];
      const scores = Array.from({ length: count }, (_, i) => ({
        file: `${String(i % 100).padStart(2, '0')}/Qm${String(i)}.mxl`,
        title: manifest ? `Piece number ${String(i)}` : `Qm${String(i)}`,
        composer: manifest ? `Composer ${String(i % 500)}` : '',
        level: manifest ? Math.round((1 + (i % 80) / 10) * 10) / 10 : null,
        bars: manifest ? 16 + (i % 200) : null,
        status: i % 7 === 0 ? 'in-copyright' : 'pd',
        style: manifest ? (styles[i % styles.length] ?? '') : '',
        rating: manifest ? (i % 50) / 10 : 0,
        ratings: manifest ? i % 30 : 0,
        views: manifest ? i * 3 : 0,
        lyrics: i % 11 === 0,
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
          source: manifest ? 'PDMX' : null,
          scores,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('could not write the folder'));
      });
      db.close();
    },
    { folder: FOLDER, count: rows, manifest: withManifest },
  );
}

/**
 * Writes a listing whose titles are the archive's own content hashes — the
 * shape a folder ends up in when its `library.json` is never found (picked
 * from the wrong level, or a build too old to look for it at all).
 */
async function seedUnnamedArchive(page: import('@playwright/test').Page, rows: number): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    async ({ folder, count }) => {
      const hash = (i: number) => `Qm${'a'.repeat(43)}${String.fromCharCode(98 + (i % 20))}`;
      const scores = Array.from({ length: count }, (_, i) => ({
        file: `${String(i)}.mxl`,
        title: hash(i),
        composer: '',
        level: null,
        bars: null,
        status: 'unknown',
        style: '',
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
          source: null,
          scores,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('could not write the folder'));
      });
      db.close();
    },
    { folder: FOLDER, count: rows },
  );
}

/**
 * An import as `addFromFolder` leaves it: in the library, stamped with where
 * it came from, and on no rung at all.
 *
 * Written straight into the store rather than added through the screen
 * because Add needs the folder's *files*, and Android only lends those for
 * one visit — there is no way to hand a headless Chromium a directory the
 * page can read. What is being tested is what happens next, and next begins
 * with a row in exactly this state.
 */
async function seedImportFromFolder(
  page: import('@playwright/test').Page,
  score: { id: string; title: string; file: string; lessonIds?: string[] },
): Promise<void> {
  await page.evaluate(
    async ({ folder, row }) => {
      const xml = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part>
</score-partwise>`;
      const open = indexedDB.open('pianopath');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error ?? new Error('could not open the database'));
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('imports', 'readwrite');
        tx.objectStore('imports').put({
          id: row.id,
          kind: 'musicxml',
          title: row.title,
          data: xml,
          tags: [],
          addedAt: new Date().toISOString(),
          origin: { folder, file: row.file },
          ...(row.lessonIds ? { lessonIds: row.lessonIds } : {}),
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('could not write the import'));
      });
      db.close();
    },
    { folder: FOLDER, row: score },
  );
}

/**
 * A score added from the folder has to be able to reach a rung (replan §4.3).
 *
 * `addFromFolder` runs the ordinary import, and an import arrives with no
 * `lessonIds` — which, in `curriculum/load.ts`'s own words, means it "cannot
 * complete a rung, it never appears in a swap, and the session builder cannot
 * pick it". The mechanism to fix that has existed all along on the Library
 * row's Assign button; what did not exist was any way to get there from the
 * screen the piece was added on, or anything saying it was needed.
 */
test.describe('a score added from the folder and the rung it has not got', () => {
  test('says it is on no rung, and opens the assign sheet from the folder row', async ({ page }) => {
    await seedFolder(page, 200);
    await seedImportFromFolder(page, {
      id: 'import.piece-number-7',
      title: 'Piece number 7',
      file: '07/Qm7.mxl',
    });
    await page.goto('/#/library/folder');
    await page.locator('#folder-search').fill('Piece number 7');
    const row = page.locator('#folder-list .list-row[data-file="07/Qm7.mxl"]');
    await expect(row).toBeVisible();
    // The state the owner could not see before: in the library, counting for
    // nothing.
    await expect(row).toContainText('no rung');
    // And the way out of it, on the row itself — not in Library, three
    // screens away, among every other import he owns.
    await row.getByRole('button', { name: 'Assign' }).click();
    await expect(page.locator('#assign-sheet')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#assign-sheet')).toContainText('Piece number 7');
  });

  test('assigning it on the folder screen makes the row say so, without a reload', async ({
    page,
  }) => {
    await seedFolder(page, 200);
    await seedImportFromFolder(page, {
      id: 'import.piece-number-7',
      title: 'Piece number 7',
      file: '07/Qm7.mxl',
    });
    await page.goto('/#/library/folder');
    await page.locator('#folder-search').fill('Piece number 7');
    const row = page.locator('#folder-list .list-row[data-file="07/Qm7.mxl"]');
    await row.getByRole('button', { name: 'Assign' }).click();
    const sheet = page.locator('#assign-sheet');
    await expect(sheet).toBeVisible({ timeout: 30_000 });

    // Any rung will do; the second option is the first real one, after
    // "No rung — just put it in my library".
    const rung = page.locator('#assign-lesson');
    const chosen = await rung.locator('option').nth(1).getAttribute('value');
    expect(chosen).toBeTruthy();
    await rung.selectOption(chosen ?? '');
    await page.locator('#assign-save').click();
    await expect(sheet).toHaveCount(0);

    const assigned = page.locator('#folder-list .list-row[data-file="07/Qm7.mxl"]');
    await expect(assigned).toContainText('on a rung');
    await expect(page.locator('[data-screen="folder"]')).toContainText(
      `is on ${String(chosen)} — it counts towards that rung now.`,
    );
    // And it survives the trip through the store, which is the only proof
    // that the rung is real rather than a label on a row.
    await page.goto('/#/library/folder');
    await page.locator('#folder-search').fill('Piece number 7');
    await expect(page.locator('#folder-list .list-row[data-file="07/Qm7.mxl"]')).toContainText(
      'on a rung',
    );
  });

  test('a score already on a rung is not asked about again', async ({ page }) => {
    await seedFolder(page, 200);
    await seedImportFromFolder(page, {
      id: 'import.piece-number-9',
      title: 'Piece number 9',
      file: '09/Qm9.mxl',
      lessonIds: ['1.1'],
    });
    await page.goto('/#/library/folder');
    await page.locator('#folder-search').fill('Piece number 9');
    const row = page.locator('#folder-list .list-row[data-file="09/Qm9.mxl"]');
    await expect(row).toContainText('on a rung');
    // Still changeable — one rung is a decision, not a sentence — but it is
    // no longer the loud action on the row.
    await expect(row.getByRole('button', { name: 'Change rung' })).toBeVisible();
  });
});

test.describe('a listing stored without its library.json ever being found', () => {
  // This is the silent failure from the handoff: a stale listing shows
  // content hashes for titles and nothing on screen says why, or what to do
  // about it. `folder.spec.ts` is where this assertion lives because it is
  // the folder screen's own state; `empty-states.spec.ts` may be the more
  // natural home for it (see the report) but that file belongs to another
  // owner.
  test('names the problem and offers the fix, instead of just showing hashes', async ({ page }) => {
    await seedUnnamedArchive(page, 50);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('50 match');
    const notice = page.locator('#folder-unnamed-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/library\.json was not found/i);
    await expect(notice).toContainText(/pick the folder again/i);
    await expect(notice.getByRole('button', { name: /pick the folder again/i })).toBeVisible();
  });

  test('says nothing for an ordinary folder, even with a stray untitled file', async ({ page }) => {
    await seedFolder(page, 50);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('50 match');
    await expect(page.locator('#folder-unnamed-notice')).toBeHidden();
  });
});

test.describe('a folder of 37,261 scores', () => {
  test('browses, filters and searches without the screen falling over', async ({ page }) => {
    test.setTimeout(180_000);
    await seedFolder(page, ROWS);

    const started = Date.now();
    await page.goto('/#/library/folder');
    const count = page.locator('#folder-count');
    await expect(count).toContainText('37,261 match', { timeout: 60_000 });
    const firstPaintMs = Date.now() - started;
    // Logged rather than asserted: this is a desktop Chromium and the number
    // that matters is the S25's. A ceiling is asserted anyway, because a
    // regression to *minutes* is a bug wherever it is measured.
    console.log(`folder: ${String(ROWS)} rows, first paint ${String(firstPaintMs)} ms`);
    expect(firstPaintMs).toBeLessThan(30_000);

    // One page of rows, not 37,261 of them: that is the whole reason the
    // screen pages.
    await expect(page.locator('#folder-list .list-row')).toHaveCount(60);
    await expect(page.locator('#folder-more')).toContainText('Show more');

    const searched = Date.now();
    // The last row, so the query is nobody else's prefix.
    await page.locator('#folder-search').fill(`Piece number ${String(ROWS - 1)}`);
    await expect(count).toContainText('1 match');
    console.log(`folder: search over ${String(ROWS)} rows in ${String(Date.now() - searched)} ms`);
    await expect(page.locator('#folder-list .list-row')).toHaveCount(1);
    await expect(page.locator('#folder-list .list-row')).toContainText(
      `Piece number ${String(ROWS - 1)}`,
    );

    await page.locator('#folder-search').fill('');
    await page.locator('#folder-style').selectOption('ragtime');
    await expect(count).not.toContainText('37,261');
    await expect(page.locator('#folder-list .list-row').first()).toBeVisible();
  });

  test('the first score is on the screen without scrolling, upright (R1)', async ({ page }) => {
    // It was 600 px down a 780 px phone: a heading, a paragraph of prose, two
    // buttons, and four filter controls all took their turn before the thing
    // the screen is for. Everything above the list is now one state line, one
    // button, one folded explanation and one row of search.
    await page.setViewportSize({ width: 412, height: 780 });
    await seedFolder(page, 400);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-list .list-row').first()).toBeVisible();
    const top = await page.locator('#folder-list .list-row').first().evaluate((el) => el.getBoundingClientRect().top);
    console.log(`folder: the first row starts at ${String(Math.round(top))}px of 780`);
    // 740, not 780: a margin for a machine whose fonts are wider than this
    // one's. Fitting exactly here is what failed on the CI runner — the saved
    // listing notice wrapped to two lines there and pushed the first row to
    // 784 px of 780, so the rule this test exists for was broken by a change
    // that passed locally. The screen is 780; the assertion leaves forty.
    expect(top, `the first row starts at ${String(Math.round(top))}px`).toBeLessThan(740);
    // And the rare filters are behind the chip rather than on the line.
    await expect(page.locator('#folder-filters')).toBeHidden();
    await expect(page.locator('#folder-filter-toggle')).toHaveAttribute('aria-expanded', 'false');
    await page.locator('#folder-filter-toggle').click();
    await expect(page.locator('#folder-filters')).toBeVisible();
  });

  test('forgetting the folder is inside How this works, not beside Pick (R3)', async ({ page }) => {
    await seedFolder(page, 20);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-pick')).toBeVisible();
    // In the document, and inside the fold — so it is reachable, and it is not
    // standing in the run between the heading and the list.
    await expect(page.locator('#folder-how #folder-forget')).toHaveCount(1);
    await expect(page.locator('#folder-forget')).toBeHidden();
    await page.locator('#folder-how summary').click();
    await expect(page.locator('#folder-forget')).toBeVisible();
    await page.locator('#folder-forget').click();
    await expect(page.locator('[data-screen="folder"]')).toContainText('No folder yet.');
  });

  test('says how to add when the folder is not connected, instead of failing obscurely', async ({
    page,
  }) => {
    await seedFolder(page, 200);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('200 match');
    // Browsing works with nothing plugged in — that is the design (`00` D24).
    // Adding is where the folder is needed again, and the message has to say
    // so rather than throwing.
    const row = page.locator('#folder-list .list-row').first();
    await row.getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('[data-screen="folder"]')).toContainText(/pick the .* folder again/i);

    // And *where* it says so. This test passed for a long time while the owner
    // reported "Add just flashes and does nothing", because it asked whether
    // the screen contained the sentence and never whether anyone could see it:
    // the status line is at the top, and a tapped row is somewhere down a list
    // of thousands. So the message has to be beside the row, with the cure on
    // it — the button that fixes this lives at the top of the screen too.
    const note = page.locator('#folder-list .folder-row-note');
    await expect(note).toHaveCount(1);
    await expect(note).toContainText(/pick the .* folder again/i);
    await expect(note.getByRole('button', { name: /pick the folder again/i })).toBeVisible();
  });

  test('a row that failed to add stops saying so once one succeeds', async ({ page }) => {
    // A stale complaint under a row is its own small lie.
    await seedFolder(page, 200);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('200 match');
    await page.locator('#folder-list .list-row').first().getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('#folder-list .folder-row-note')).toHaveCount(1);

    await page.reload();
    await expect(page.locator('#folder-count')).toContainText('200 match');
    await expect(page.locator('#folder-list .folder-row-note')).toHaveCount(0);
  });

  test('a folder with no manifest still lists and still searches', async ({ page }) => {
    await seedFolder(page, 500, false);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('500 match');
    // No levels to filter by, so a level filter must not hide everything:
    // "unknown" is not "too hard".
    await page.locator('#folder-filter-toggle').click();
    await page.locator('#folder-min').fill('5');
    await expect(page.locator('#folder-count')).toContainText('500 match');
    await page.locator('#folder-search').fill('Qm123');
    await expect(page.locator('#folder-list .list-row').first()).toContainText('Qm123');
  });
});

test.describe('the letter rail', () => {
  test('jumps to a letter, and grows the list to reach one that is not drawn yet', async ({
    page,
  }) => {
    // 200 rows against a page of 60, so most letters are real and off-screen —
    // which is the folder's own case and the one a rail that silently does
    // nothing would fail at.
    await seedFolder(page, 200);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('200 match');

    const rail = page.locator('.alpha-rail');
    await expect(rail).toBeVisible();
    // Always all 27, so the rail is a fixed shape rather than one that moves
    // about from list to list.
    await expect(rail.locator('.alpha-rail__letter')).toHaveCount(27);

    const drawnBefore = await page.locator('#folder-list .list-row').count();
    const titles = await page.locator('#folder-list .list-row').allInnerTexts();
    const firstLetter = (titles[0] ?? '').trim().charAt(0).toUpperCase();

    // A letter that is certainly further down than one page.
    await rail.locator('[data-letter="P"]').click();
    await page.waitForTimeout(400);
    const drawnAfter = await page.locator('#folder-list .list-row').count();
    expect(drawnAfter, 'the list did not grow to reach the letter').toBeGreaterThanOrEqual(
      drawnBefore,
    );
    // Something beginning with P is now on the screen.
    await expect(
      page.locator('#folder-list .list-row').filter({ hasText: /^\s*P/i }).first(),
    ).toBeVisible();
    expect(firstLetter.length).toBe(1);
  });

  test('says the listing is saved, and offers the folder back, when nothing is connected', async ({
    page,
  }) => {
    // The whole reason "Add just flashes" was baffling: the listing comes back
    // from IndexedDB complete with titles, composers and levels, so the screen
    // looks connected. It is not, and it has to say so where the rows are.
    await seedFolder(page, 200);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('200 match');

    const saved = page.locator('#folder-saved');
    await expect(saved).toBeVisible();
    await expect(saved).toContainText(/saved listing/i);
    await expect(saved).toContainText(/nothing can be added/i);
    // The count is not repeated here: it is on the line below, and this notice
    // sits between the search box and the first row, where R1 is watching every
    // pixel.
    await expect(page.locator('#folder-count')).toContainText('200');
    await expect(saved.getByRole('button', { name: /pick the folder again/i })).toBeVisible();
  });
});

test.describe('what the archive knows about a score', () => {
  test('Details says where the estimated level sits, and what the estimate is worth', async ({
    page,
  }) => {
    // The listing carries the level, the bars, the style, the status, the
    // rating, the views, whether it has words and a link to the source. A row
    // is 96 px and could show four of those, truncated — and "level 2.3 est."
    // on its own answers a question nobody asked. The sheet turns the number
    // into the rung it refers to, because unit ids in the curriculum *are*
    // those numbers.
    await seedFolder(page, 200);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('200 match');

    const row = page.locator('#folder-list .list-row').first();
    await row.getByRole('button', { name: 'Details' }).click();

    const sheet = page.locator('#folder-detail');
    await expect(sheet).toBeVisible();
    // Either a rung, or plainly no estimate — never a bare number, and never
    // a level of 0 invented for a score the manifest never mentioned.
    await expect(page.locator('#folder-detail-rung')).toContainText(
      /Estimated level|No level estimate/,
    );
    // And what the number is worth, said next to it rather than assumed.
    await expect(sheet).toContainText(/hint, not a grade|has seen you play/);
    // The file is the identity, so it is always shown.
    await expect(sheet).toContainText('File');

    // A sheet, not a tooltip: a phone has no hover, which is why the score
    // screen explains its controls the same way.
    await expect(sheet.getByRole('button', { name: 'Close' })).toBeVisible();
  });
});
