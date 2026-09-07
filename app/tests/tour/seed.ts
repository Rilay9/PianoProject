/**
 * Putting a used phone's worth of data into the app before photographing it.
 *
 * Half of what a screen looks like is what is *in* it, and a fresh profile
 * shows the empty half of every one. The tour shoots both: the empty state
 * first, because that is what a first launch looks like, and then the same
 * screen with a fortnight of practice, an import, a PDF, a book on the shelf
 * and a folder of scores behind it.
 *
 * Progress and the folder are written through the app's own hooks and the
 * store, because clicking a fortnight of practice into existence would take
 * longer than the tour and 37,261 files cannot be clicked at all. The shelf
 * goes through the UI instead — it is two dialogs, the piece ids are generated
 * inside the app, and guessing at them from out here is how seeds rot.
 */
import { expect, type Page } from '@playwright/test';

/** A fortnight of runs, so Progress and Today have something to draw. */
export async function seedProgress(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const store = (window as unknown as { __pianopath?: Record<string, unknown> }).__pianopath;
    const recordRun = store?.recordRun as
      | ((r: unknown, now?: Date) => Promise<unknown>)
      | undefined;
    if (!recordRun) throw new Error('the test hooks are not installed');
    const items = [
      'song.folk.mary-had-a-little-lamb',
      'song.folk.row-row-row-your-boat',
      'exercise.five-finger.c-major.right',
      'song.classical.ode-to-joy.rh',
    ];
    for (let day = 13; day >= 0; day -= 1) {
      if (day % 3 === 2) continue; // a couple of days off, like a real fortnight
      const when = new Date(Date.now() - day * 86_400_000);
      const itemId = items[day % items.length] ?? items[0];
      await recordRun(
        {
          itemId,
          mode: 'wait',
          tempoPct: 80 + (day % 3) * 10,
          accuracy: 0.72 + (day % 5) * 0.05,
          accuracyEstimated: false,
          wrongNotes: day % 4,
          missed: day % 3,
          durationMs: (8 + (day % 5) * 4) * 60_000,
          passed: day % 5 !== 0,
          masterEligible: day % 7 === 0,
        },
        when,
      );
    }
  });
}

/**
 * A book with two pieces, one of them registered against a rung.
 *
 * Through the UI, the way he would: the shelf mints its own piece ids, and the
 * paper route is reached by pressing Practise rather than by an id built here.
 */
export async function seedShelf(page: Page): Promise<void> {
  await page.goto('/#/library/shelf');
  await page.locator('#shelf-add-book').click();
  await page.locator('#book-title').fill('Czerny op. 599');
  await page.locator('#book-save').click();
  await expect(page.locator('#shelf-list')).toContainText('Czerny op. 599');

  for (const piece of [
    { title: 'No. 12', page: '14', lesson: '4.4' },
    { title: 'No. 18', page: '19', lesson: '' },
  ]) {
    await page.locator('[id^="shelf-add-piece-"]').first().click();
    await page.locator('#piece-title').fill(piece.title);
    await page.locator('#piece-page').fill(piece.page);
    if (piece.lesson) await page.locator('#piece-lesson').selectOption(piece.lesson);
    await page.locator('#piece-save').click();
    await expect(page.locator('#shelf-list')).toContainText(piece.title);
  }
}

/**
 * The owner's real folder, at its real size, without needing the files.
 *
 * The same listing `tests/e2e/folder.spec.ts` seeds — the screen draws the
 * listing, and the files themselves are lent for one visit.
 */
export async function seedFolder(page: Page, rows = 37_261): Promise<void> {
  await page.evaluate(async (count) => {
    const styles = ['classical', 'ragtime', 'jazz', 'folk', 'pop'];
    const scores = Array.from({ length: count }, (_, i) => ({
      file: `${String(i % 100).padStart(2, '0')}/Qm${String(i)}.mxl`,
      title: `Piece number ${String(i)}`,
      composer: `Composer ${String(i % 500)}`,
      level: Math.round((1 + (i % 80) / 10) * 10) / 10,
      bars: 16 + (i % 200),
      status: i % 7 === 0 ? 'in-copyright' : 'pd',
      style: styles[i % styles.length] ?? '',
      rating: (i % 50) / 10,
      ratings: i % 30,
      views: i * 3,
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
        id: 'pianopath-library',
        addedAt: new Date().toISOString(),
        source: 'PDMX',
        scores,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('could not write the folder listing'));
    });
    db.close();
  }, rows);
}

/**
 * Turns a setting on without going through the Settings screen.
 *
 * Reloads afterwards: the settings module reads local storage once at boot and
 * keeps the values in memory, so a write with no reload changes the storage
 * and nothing the camera can see.
 */
export async function setSetting(page: Page, key: string, value: unknown): Promise<void> {
  await page.evaluate(
    ({ k, v }) => {
      const raw = localStorage.getItem('pianopath.settings');
      const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
      settings[k] = v;
      localStorage.setItem('pianopath.settings', JSON.stringify(settings));
    },
    { k: key, v: value },
  );
  await page.reload();
}
