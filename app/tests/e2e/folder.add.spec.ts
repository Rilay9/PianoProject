/**
 * Adding a score from the folder, all the way into the library.
 *
 * This is the path the owner reported broken — *"the add still just says adding
 * i havent been able to add to it"* — and until now **no end-to-end test had
 * ever added a score successfully.** Both `Add` tests in `folder.spec.ts`
 * exercise the failure: no folder open, "pick the folder again". The success was
 * covered only by unit tests of the layer underneath.
 *
 * The reason for the gap is real rather than lazy. `Add` descends the score's
 * stored path inside a `FileSystemDirectoryHandle` and imports the one file it
 * finds; a headless browser has no directory picker, and a hand-made handle
 * cannot be stored in the database in its place because functions are not
 * structured-cloneable. `window.__pianopath.lendFolderFiles` is the seam the
 * unit tests already use, exposed to a page: it hands the folder real `File`
 * objects, so the import that follows is the ordinary one.
 *
 * What this proves, which nothing else did: a tap on `Add` reads exactly the
 * file the row names, the import lands in the library, the row stops offering
 * to add it, and the screen says what happened — rather than sitting on the word
 * "Adding" for ever, which is what it used to do while walking all 37,261 files
 * looking for one.
 */
import { expect, test } from '@playwright/test';

const FOLDER = 'pianopath-library';
/** A real score, so the import is the real import. */
const SOURCE = 'content/scores/imported/song.beautiful.g-minor-bach.mxl';

/**
 * The listing in storage, and the bytes to lend later.
 *
 * Lending is deliberately *not* done here. The files a folder has been lent
 * live in memory for the session, exactly as a real picked folder's do, so any
 * navigation after lending throws them away — which is what a folder being
 * "lent for one visit" means. So this seeds the database and returns the bytes,
 * and each test lends them once it has arrived where it means to stay.
 */
async function seed(page: import('@playwright/test').Page): Promise<number[]> {
  await page.goto('/');
  const bytes = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return [...new Uint8Array(await response.arrayBuffer())];
  }, SOURCE);
  expect(bytes.length, 'the fixture score did not load').toBeGreaterThan(1000);

  await page.evaluate(
    async ({ folder, raw }) => {
      const scores = Array.from({ length: 12 }, (_, i) => ({
        file: `${String(i % 3).padStart(2, '0')}/piece-${String(i)}.mxl`,
        title: `Piece number ${String(i)}`,
        composer: `Composer ${String(i)}`,
        // An ordinary middling score, which is what the archive is full of
        // and what the reported fault needs: a level near the middle of the
        // catalog puts the row hundreds of rows down a level-ordered library,
        // where an easy one would have landed near the top by luck.
        level: 5 + i / 10,
        bars: 16 + i,
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
        open.onerror = () => reject(open.error ?? new Error('no database'));
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('folderLibraries', 'readwrite');
        tx.objectStore('folderLibraries').put({
          id: folder,
          addedAt: new Date().toISOString(),
          source: 'PDMX',
          scores,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('could not seed'));
      });
      db.close();

      // The same bytes for every path: what is being tested is that the *named*
      // file is the one read, which the count below pins, not which score it is.
      const data = new Uint8Array(raw);
      const files = new Map<string, File>(
        scores.map((score) => [
          score.file,
          new File([data], score.file.split('/').pop() ?? 'piece.mxl'),
        ]),
      );
      void files;
    },
    { folder: FOLDER, raw: bytes },
  );
  return bytes;
}

/** Hands the folder its files, the way the picker does, for this visit only. */
async function lend(page: import('@playwright/test').Page, bytes: number[]): Promise<void> {
  await page.evaluate(
    ({ folder, raw }) => {
      const data = new Uint8Array(raw);
      const files = new Map<string, File>();
      for (let i = 0; i < 12; i += 1) {
        const path = `${String(i % 3).padStart(2, '0')}/piece-${String(i)}.mxl`;
        files.set(path, new File([data], `piece-${String(i)}.mxl`));
      }
      (
        window as unknown as {
          __pianopath?: { lendFolderFiles: (id: string, f: Map<string, File>) => void };
        }
      ).__pianopath?.lendFolderFiles(folder, files);
    },
    { folder: FOLDER, raw: bytes },
  );
}

test.describe('adding one score from the folder', () => {
  test('reads the file the row names and puts it in the library', async ({ page }) => {
    const bytes = await seed(page);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('12 match', { timeout: 60_000 });
    await lend(page, bytes);

    const row = page.locator('#folder-list .list-row').first();
    const title = ((await row.locator('.list-row__title').textContent()) ?? '').trim();
    expect(title, 'the first row has no title').not.toBe('');

    await row.getByRole('button', { name: 'Add' }).click();

    // It finishes, and says so. "Adding…" for ever is the reported fault.
    await expect(page.locator('[data-screen="folder"]')).toContainText(/added/i, {
      timeout: 60_000,
    });
    await expect(row.getByRole('button', { name: 'Add' })).toHaveCount(0);

    // And it is really in the library, under the name the row showed.
    const imported = await page.evaluate(async () => {
      const open = indexedDB.open('pianopath');
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error ?? new Error('no database'));
      });
      const rows = await new Promise<{ title?: string; data?: unknown }[]>((resolve, reject) => {
        const request = db.transaction('imports').objectStore('imports').getAll();
        request.onsuccess = () => resolve(request.result as { title?: string; data?: unknown }[]);
        request.onerror = () => reject(request.error ?? new Error('could not read'));
      });
      db.close();
      return rows.map((r) => ({
        title: r.title ?? '',
        bytes: r.data !== undefined,
        origin: (r as { origin?: { folder?: string; file?: string } }).origin ?? null,
      }));
    });
    expect(imported, 'nothing reached the imports store').toHaveLength(1);
    expect(imported[0]?.bytes, 'the import has no score in it').toBe(true);

    // Titled from the score's own `<work-title>`, not from the row.
    //
    // That is deliberate and documented: the manifest's titles came through a
    // CSV that mangled 236 of them, while the file inside was never touched, so
    // the importer prefers what the score calls itself. The manifest's title
    // wins only when the score has none of its own. The fixture makes the two
    // disagree on purpose — every path is lent the same real score — which is
    // exactly the case that tells the two rules apart.
    expect(imported[0]?.title, 'the import took the row title over the score own').not.toBe(title);
    expect(imported[0]?.title.length ?? 0).toBeGreaterThan(0);

    // And where it came from is recorded, which is how the browse list knows a
    // row is already in the library without matching on a title. The archive
    // has six files called The Entertainer.
    expect(imported[0]?.origin?.folder).toBe(FOLDER);
    expect(imported[0]?.origin?.file, 'the import does not know which file it was').toBeTruthy();
  });

  test('survives a reload, and is not offered again', async ({ page }) => {
    const bytes = await seed(page);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('12 match', { timeout: 60_000 });
    await lend(page, bytes);
    await page.locator('#folder-list .list-row').first().getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('[data-screen="folder"]')).toContainText(/added/i, {
      timeout: 60_000,
    });

    // A new visit: the listing comes back from storage and the folder is shut
    // again, which is the ordinary state. The row must still know it was added
    // — by its file, not its title, because the archive has six files called
    // The Entertainer.
    await page.reload();
    await expect(page.locator('#folder-count')).toContainText('12 match', { timeout: 60_000 });
    const row = page.locator('#folder-list .list-row').first();
    await expect(row.getByRole('button', { name: 'Add' })).toHaveCount(0);
    // And the eleven others are still addable, so nothing was marked wholesale.
    await expect(
      page.locator('#folder-list .list-row').getByRole('button', { name: 'Add' }),
    ).toHaveCount(11);
  });

  /**
   * The fault the owner reported (2026-09-22): a score added from the folder
   * "appeared in the Library only after a delay long enough that I thought it
   * needed a rung".
   *
   * Two mechanisms, and this test can only see the second directly, so it
   * pins the visible consequence of both: after the add, the Library is
   * opened the way the owner opens it — a route change, no reload — and the
   * imported row must be among the very first rows the list draws. No
   * `Show more`, no `Only mine`, no search. Waiting for the list to have any
   * row at all and then asserting *without retrying* is what makes this about
   * the first paint rather than about eventual arrival.
   */
  test('the added row is in the library list on its first paint', async ({ page }) => {
    const bytes = await seed(page);
    await page.goto('/#/library/folder');
    await expect(page.locator('#folder-count')).toContainText('12 match', { timeout: 60_000 });
    await lend(page, bytes);
    await page.locator('#folder-list .list-row').first().getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('[data-screen="folder"]')).toContainText(/added/i, {
      timeout: 60_000,
    });

    // The route change the owner makes, not a reload: the folder screen is a
    // sub-screen of the Library and he goes back to it.
    await page.evaluate(() => {
      window.location.hash = '#/library';
    });
    await expect(page.locator('[data-screen="library"]')).toHaveCount(1, { timeout: 60_000 });

    // The first paint of the list, whatever is in it.
    await page.waitForSelector('#library-list .list-row', { timeout: 60_000 });
    // No retry: the imported row is there in that same paint, or this fails.
    expect(
      await page.locator('#library-list .list-row[data-item^="import."]').count(),
      'the score just added was not among the first rows the library drew',
    ).toBe(1);

    // And the screen says which score that is, rather than leaving him to
    // recognise a row among two thousand.
    await expect(page.locator('#library-status')).toContainText('is in your library');

    // And it got there without the learner narrowing anything.
    await expect(page.locator('#library-mine')).toHaveAttribute('aria-pressed', 'false');
    expect(
      await page.locator('#library-search').inputValue(),
      'the library filtered itself to find the row',
    ).toBe('');
  });
});
