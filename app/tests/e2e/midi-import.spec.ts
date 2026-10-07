/**
 * A MIDI file picked from the app, converted on the device (T29 item 5).
 *
 * `converted-import.spec.ts` puts the *command line's* output through the
 * Library's door. This puts a `.mid` through it: the conversion the Python
 * utility did is now `app/src/import/midi/`, and the owner's ask (2026-09-22)
 * was "ideally I could select a file from the app".
 *
 * **What the fixture is.** `tests/fixtures/imports/two-hands.mid`, four bars of
 * C major written byte by byte by the script beside it, with a track per hand
 * — which the converter keeps as recorded, since a person assigned them.
 * The three Disklavier performances the converter was developed against are in
 * `build/`, which is gitignored and whose `SOURCE.md` says they are not to be
 * redistributed, so they cannot be the fixture here — the port's agreement with
 * the Python on those is `tests/unit/midiParity.test.ts`.
 *
 * **The three claims, in the three places they belong.**
 *
 * 1. The picker takes it, the conversion happens, and the sheet says what was
 *    decided *before* the learner agrees to any of it.
 * 2. The row is in the Library and opens on the Score screen with an engraved
 *    SVG.
 * 3. The step count equals the cursor-step count. That cannot be asked of the
 *    Score screen — its renderer is windowed and a draw range clamps OSMD's
 *    iterator — so it is asked of the dev harness, on the very bytes the import
 *    stored.
 *
 * And one for the store (E2; E25): a row stored before the app measured
 * demands — the import's measurement and provenance taken off it — is measured
 * on the next launch, through the store, and the assign sheet reads the
 * measured demands off the row.
 */
import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDevScore } from './fixtures/devScore';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const TWO_HANDS = path.join(FIXTURES, 'two-hands.mid');
const ITEM = 'import.two-hands';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

/** The MusicXML the import stored, read back out of IndexedDB. */
async function storedXml(page: import('@playwright/test').Page, id: string): Promise<string> {
  return page.evaluate(
    (wanted) =>
      new Promise<string>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onerror = () => {
          reject(new Error('could not open the database'));
        };
        request.onsuccess = () => {
          const db = request.result;
          const row = db.transaction('imports').objectStore('imports').get(wanted);
          row.onsuccess = () => {
            const data = (row.result as { data?: unknown } | undefined)?.data;
            resolve(typeof data === 'string' ? data : '');
          };
          row.onerror = () => {
            reject(new Error('could not read the row'));
          };
        };
      }),
    id,
  );
}

/** The demands on a stored import row, or null where it carries none (a row imported before E0). */
async function storedDemands(page: import('@playwright/test').Page, id: string): Promise<unknown> {
  return page.evaluate(
    (wanted) =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onerror = () => {
          reject(new Error('could not open the database'));
        };
        request.onsuccess = () => {
          const row = request.result.transaction('imports').objectStore('imports').get(wanted);
          row.onsuccess = () => {
            resolve((row.result as { demands?: unknown } | undefined)?.demands ?? null);
          };
          row.onerror = () => {
            reject(new Error('could not read the row'));
          };
        };
      }),
    id,
  );
}

/** Takes the measurement and the provenance off a stored row: the row as the app wrote it before E0. */
async function asImportedBeforeE0(page: import('@playwright/test').Page, id: string): Promise<void> {
  await page.evaluate(
    (wanted) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('pianopath');
        request.onerror = () => {
          reject(new Error('could not open the database'));
        };
        request.onsuccess = () => {
          const store = request.result.transaction('imports', 'readwrite').objectStore('imports');
          const read = store.get(wanted);
          read.onsuccess = () => {
            const row = { ...(read.result as Record<string, unknown>) };
            delete row.demands;
            delete row.measurement;
            delete row.provenance;
            const write = store.put(row);
            write.onsuccess = () => {
              resolve();
            };
            write.onerror = () => {
              reject(new Error('could not write the row'));
            };
          };
        };
      }),
    id,
  );
}

test.describe('a MIDI file imported from the app', () => {
  test('an import stored before the app measured demands shows them on the assign sheet after the next launch (E2; E25)', async ({
    page,
  }) => {
    // The launch's measurement waits for the first screen and an idle slice, then loads the engraver.
    test.setTimeout(90_000);
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(TWO_HANDS);
    await expect(page.locator('#library-status')).toContainText('Imported 1:');
    await page.getByRole('button', { name: 'Not now' }).click();
    await asImportedBeforeE0(page, ITEM);
    expect(await storedDemands(page, ITEM)).toBeNull();

    // The next launch measures it once, in the background, through the store.
    await page.reload();
    await expect.poll(() => storedDemands(page, ITEM), { timeout: 30_000 }).not.toBeNull();

    // And the sheet reads the measured truth off the stored row. After a reload the list is by
    // level again ("what you just added" is a fact about one visit), so the learner's own are asked for.
    await page.getByRole('button', { name: 'Only mine' }).click();
    const row = page.locator(`.list-row[data-item="${ITEM}"]`);
    await row.getByRole('button', { name: 'Assign' }).click();
    const line = page.locator('#assign-demands');
    await expect(line).toBeVisible();
    await expect(line).toContainText('Measured in the notes:');
    await expect(line).not.toContainText('Not measured yet');
    // Two tracks, one per hand, kept as recorded: the lower staff in the bass clef, the hands together.
    const demands = (await storedDemands(page, ITEM)) as string[];
    expect(demands).toEqual(expect.arrayContaining(['clef.bass', 'texture.hands-together']));
    await expect(line).toContainText('the bass-staff notes');
    await expect(line).toContainText('both hands together');
  });

  test('converts on the device and says what it decided before anything is agreed to', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(TWO_HANDS);
    await expect(page.locator('#library-status')).toContainText('Imported 1:');

    // The sheet opens by itself for a converted file, because this is the one
    // import where the app decided things on his behalf.
    const sheet = page.locator('#assign-sheet');
    await expect(sheet).toBeVisible();
    const check = page.locator('#assign-conversion-check');
    await expect(check).toBeVisible();
    // The self-check's own sentence, not a tick: a relationship between what
    // the reader found and what is in the score.
    await expect(check).toContainText('notes the reader found are in the score');
    await expect(check).toContainText('every bar adds up');
    const hands = page.locator('#assign-conversion-hands');
    // Two note tracks are an arrangement that already has hands, so the sheet
    // says the app kept them rather than claiming a decision it did not make.
    await expect(hands).toContainText('kept as recorded');
    await expect(hands).toContainText('the arrangement’s own answer');
    // And what was a guess, said as a guess.
    await expect(page.locator('#assign-conversion-guesses')).toContainText('guesses');

    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(sheet).toBeHidden();
  });

  test('is in the Library at once and opens on the Score screen', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(TWO_HANDS);
    await expect(page.locator('#library-status')).toContainText('Imported 1:');
    await page.getByRole('button', { name: 'Not now' }).click();

    const row = page.locator(`.list-row[data-item="${ITEM}"]`);
    await expect(row).toBeVisible();
    await expect(row).toContainText('yours');

    await row.click();
    await expect(page).toHaveURL(new RegExp(`#/score/${ITEM.replace('.', '\\.')}`));
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('walks the same number of steps as the cursor does, and keeps both hands', async ({
    page,
  }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(TWO_HANDS);
    await expect(page.locator('#library-status')).toContainText('Imported 1:');
    await page.getByRole('button', { name: 'Not now' }).click();
    const xml = await storedXml(page, ITEM);
    expect(xml).toContain('<score-partwise');

    await openDevScore(page);
    await page.evaluate(async (source) => {
      await window.__pianopathDevScore?.loadMusicXml(source, 'two-hands');
    }, xml);
    // `loadMusicXml` resolves either way and leaves the previous model behind
    // on a failure, so the error is read before the numbers are.
    expect(await page.evaluate(() => window.__pianopathDevScore?.lastError())).toBeFalsy();

    const steps = await page.evaluate(() => window.__pianopathDevScore?.stepCount() ?? 0);
    const cursorSteps = await page.evaluate(
      async () => (await window.__pianopathDevScore?.cursorStepCount()) ?? -1,
    );
    // A relationship, not a number measured on this machine: the two counts
    // must agree, whatever the file happens to hold.
    expect(steps).toBeGreaterThan(0);
    expect(cursorSteps).toBe(steps);

    // The converter wrote two staves because the file had two tracks and the
    // split put notes in both. A grand staff that arrived as one line would
    // still count its steps, and would be the wrong score.
    const summary = await page.evaluate(() => window.__pianopathDevScore?.modelSummary());
    expect(summary?.hands).toBe('both');
    expect(summary?.measures).toBeGreaterThan(1);
  });
});
