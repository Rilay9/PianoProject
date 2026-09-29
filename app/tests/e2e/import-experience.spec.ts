/**
 * The import experience, through the real UI callers (X3; E21, U72; the brief approved with one
 * required change, `responses/ef80e86.md`).
 *
 * The learner's path, end to end on the production build: the Library's picker imports a MIDI
 * file → the row `addImport` returned opens the import sheet (the UI opens it; the store opens
 * nothing) → what the app read and what it guessed, each guess with whose it is → *Swap the hands*,
 * saved through the store, which measures the corrected score again → the conversion note and the
 * demands follow the row → no rung → the Library row says the import's state → the row's *Assign*
 * opens the same sheet on the stored row → the learner opens the piece and the Score screen
 * engraves it. Importing, correcting, assigning and viewing write no progress; a run is what
 * playing it would record.
 *
 * **The fixture** (`tests/fixtures/imports/left-hand-first.mid`, written by the script beside it):
 * two tracks, the left hand's first, so the converter — which keeps a file's two tracks in file
 * order — puts the bass line on the treble staff and the tune on the bass staff, both under ledger
 * lines, and the swap is the correction a learner would make. It states no tempo.
 *
 * And the share door (`takeSharedFiles`): a file Android parked in the share cache is imported by
 * the Library on its way in, and the Library opens the sheet from the row it got back.
 */
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const LEFT_HAND_FIRST = path.join(FIXTURES, 'left-hand-first.mid');
const ITEM = 'import.left-hand-first';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

interface StoredRow {
  data?: string;
  demands?: string[] | 'unmeasured';
  lessonIds?: string[];
  provenance?: { facts: Record<string, { kind: string; via?: string } | undefined> };
}

/** One object store's row, read back out of IndexedDB. */
async function stored<T>(page: Page, store: string, key: string): Promise<T | null> {
  return page.evaluate(
    ([name, wanted]) =>
      new Promise<T | null>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onerror = () => {
          reject(new Error('could not open the database'));
        };
        request.onsuccess = () => {
          const read = request.result.transaction(name).objectStore(name).get(wanted);
          read.onsuccess = () => {
            resolve((read.result as T | undefined) ?? null);
          };
          read.onerror = () => {
            reject(new Error('could not read the row'));
          };
        };
      }),
    [store, key] as const,
  );
}

/** How many runs the store holds, of any piece. */
async function runsStored(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onerror = () => {
          reject(new Error('could not open the database'));
        };
        request.onsuccess = () => {
          const count = request.result.transaction('sessions').objectStore('sessions').count();
          count.onsuccess = () => {
            resolve(count.result);
          };
          count.onerror = () => {
            reject(new Error('could not count the runs'));
          };
        };
      }),
  );
}

test.describe('the import experience', () => {
  test('import a MIDI file, see what was read and guessed, swap the hands, assign to no rung, find it in the Library with its state, and open it', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(LEFT_HAND_FIRST);
    await expect(page.locator('#library-status')).toContainText('Imported 1:');

    // The UI caller opened the sheet from the row it got back.
    const sheet = page.locator('#assign-sheet[data-sheet="import"]');
    await expect(sheet).toBeVisible();

    // What the app read.
    const read = sheet.locator('#import-read');
    await expect(read).toContainText('4 bars');
    await expect(read).toContainText('no sharps or flats');
    await expect(sheet.locator('#assign-conversion-check')).toContainText('every bar adds up');

    // What the app guessed, each with whose it is.
    await expect(sheet.locator('#import-hands')).toContainText('from the file');
    await expect(sheet.locator('#assign-conversion-hands')).toContainText('the first (Left hand) is the upper staff');
    await expect(sheet.locator('#import-tempo')).toContainText('the app’s guess');
    await expect(sheet.locator('#import-tempo')).toContainText('The file states no tempo, so the app chose ♩ = 100.');
    // The tempo control is held (E48): nothing to type a tempo into.
    await expect(sheet.locator('#import-guessed input')).toHaveCount(0);

    // What the notes ask, before: the bass line under the treble staff and the tune over the bass.
    const demands = sheet.locator('#assign-demands');
    await expect(demands).toContainText('the ledger-line notes');
    const before = await stored<StoredRow>(page, 'imports', ITEM);
    expect(before?.demands).toContain('pitch.ledger');

    // The swap, saved through the store.
    await sheet.locator('#import-swap').click();
    await expect(sheet.locator('#import-swap-said')).toContainText('Swapped');
    await expect(sheet.locator('#import-hands')).toContainText('yours');
    await expect(sheet.locator('#assign-conversion-hands')).toContainText('the hands are yours');
    await expect(sheet.locator('#assign-conversion-hands')).not.toContainText('kept as recorded');
    await expect(demands).not.toContainText('the ledger-line notes');
    const after = await stored<StoredRow>(page, 'imports', ITEM);
    expect(after?.data).not.toBe(before?.data);
    expect(after?.provenance?.facts.hands?.via).toMatch(/learner/);
    expect(after?.provenance?.facts.demands?.via).toMatch(/corrected/);
    expect(after?.demands).not.toContain('pitch.ledger');

    // Where does it belong: no rung.
    await expect(sheet.locator('#assign-lesson')).toHaveValue('');
    await sheet.locator('#assign-save').click();
    await expect(sheet).toBeHidden();
    expect((await stored<StoredRow>(page, 'imports', ITEM))?.lessonIds).toEqual([]);

    // The Library row says the import's state in words: where its notes came from beside the level,
    // and under it whose the hands are, measured, and the tempo the app chose.
    const row = page.locator(`.list-row[data-item="${ITEM}"]`);
    await expect(row.locator('.list-row__metatext')).toContainText('converted from MIDI');
    await expect(row.locator('.library-import-state')).toHaveText('hands corrected · measured · tempo guessed');

    // Nothing so far is evidence: no run, no progress for the piece.
    expect(await runsStored(page)).toBe(0);
    expect(await stored(page, 'progress', ITEM)).toBeNull();

    // The row's Assign opens the same sheet on the stored row: the hands are still the learner's.
    await row.getByRole('button', { name: 'Assign' }).click();
    await expect(sheet.locator('#import-hands')).toContainText('yours');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(sheet).toBeHidden();

    // The learner opens it: the Score screen engraves the corrected score.
    await row.click();
    await expect(page).toHaveURL(new RegExp(`#/score/${ITEM.replace('.', '\\.')}`));
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 30_000 });
  });

  test('a file shared into the app opens the sheet from the row the Library got back', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/#/today');
    // What the service worker does with a share: parks the file in the share cache, keyed by its name.
    const bytes = [...readFileSync(LEFT_HAND_FIRST)];
    await page.evaluate(async (data) => {
      const cache = await caches.open('pianopath-shared');
      await cache.put(new Request(new URL('shared/left-hand-first.mid', location.href).href), new Response(new Uint8Array(data)));
    }, bytes);
    await page.goto('/#/library');
    const sheet = page.locator('#assign-sheet[data-sheet="import"]');
    await expect(sheet).toBeVisible({ timeout: 30_000 });
    await expect(sheet.locator('#import-read')).toContainText('4 bars');
    await expect(page.locator('#library-status')).toContainText('Shared in: left hand first');
  });
});
