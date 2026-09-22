/**
 * A file the MIDI converter wrote, opened in the app (T16 Part A item 4).
 *
 * `tools/midi-cleanup/midi_to_musicxml.py` is a personal utility and its output
 * is meant to arrive here by the `[FOUND]` route in `docs/03` — the owner's own
 * file, picked with the Library's file input, kept in IndexedDB, never in this
 * repository. Until this spec existed nothing had ever put its output through
 * that door, so "the converter produces MusicXML" and "the app can read what
 * the converter produces" were two claims and only the first had been checked.
 *
 * **What the fixture is.** `tests/fixtures/imports/converted-from-midi.musicxml`
 * is the converter's output for a *jittered rendering* of the committed
 * exercise `exercise.five-finger.c-major.both.mxl` — the repository's own
 * material, rendered to MIDI, every onset and release nudged, then converted
 * back. The three real Disklavier performances the converter was developed
 * against are in `build/`, which is gitignored and whose `SOURCE.md` says they
 * are not to be redistributed, so they cannot be the fixture here.
 *
 * **The two claims, checked in the two places they belong.**
 *
 * 1. The import path reads it: the row appears in the Library, opens on the
 *    Score screen, and an engraved SVG arrives.
 * 2. The step count equals the cursor-step count. That cannot be asked of the
 *    Score screen — its renderer is windowed and a draw range clamps OSMD's
 *    iterator — so it is asked of the dev harness, which builds a throwaway
 *    instance with a live cursor for exactly this (`DevScoreScreen`'s
 *    `cursorStepCount`). Both numbers come from the same bytes.
 */
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDevScore } from './fixtures/devScore';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const CONVERTED = path.join(FIXTURES, 'converted-from-midi.musicxml');
const ITEM = 'import.converted-from-midi';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

test.describe('a converted MIDI performance', () => {
  test('imports, is listed under the title the converter wrote, and engraves', async ({ page }) => {
    await page.goto('/#/library');
    await page.locator('#library-file').setInputFiles(CONVERTED);
    // The title comes out of the file: without one music21 writes "Music21
    // Fragment" and every converted import would arrive called the same thing.
    await expect(page.locator('#library-status')).toContainText('Imported 1:');
    const row = page.locator(`.list-row[data-item="${ITEM}"]`);
    await expect(row).toBeVisible();
    await expect(row).toContainText('yours');

    await row.click();
    await expect(page).toHaveURL(new RegExp(`#/score/${ITEM.replace('.', '\\.')}`));
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('walks the same number of steps as the cursor does', async ({ page }) => {
    await openDevScore(page);
    const xml = readFileSync(CONVERTED, 'utf8');
    await page.evaluate(async (source) => {
      await window.__pianopathDevScore?.loadMusicXml(source, 'converted-from-midi');
    }, xml);
    // `loadMusicXml` resolves either way and leaves the previous model behind
    // on a failure, so the error is read before the numbers are — the lesson
    // `content-render.spec.ts` records.
    expect(await page.evaluate(() => window.__pianopathDevScore?.lastError())).toBeFalsy();

    const steps = await page.evaluate(() => window.__pianopathDevScore?.stepCount() ?? 0);
    const cursorSteps = await page.evaluate(
      async () => (await window.__pianopathDevScore?.cursorStepCount()) ?? -1,
    );
    // A relationship, not a number measured on this machine: the two counts
    // must agree, whatever the file happens to hold.
    expect(steps).toBeGreaterThan(0);
    expect(cursorSteps).toBe(steps);
  });

  test('keeps both hands and both staves', async ({ page }) => {
    // The converter wrote two parts because the rendering had two tracks. A
    // grand staff that arrived as one line would still import and still count
    // its steps, and would be the wrong score.
    await openDevScore(page);
    const xml = readFileSync(CONVERTED, 'utf8');
    await page.evaluate(async (source) => {
      await window.__pianopathDevScore?.loadMusicXml(source, 'converted-from-midi');
    }, xml);
    const summary = await page.evaluate(() => window.__pianopathDevScore?.modelSummary());
    expect(summary?.hands).toBe('both');
    expect(summary?.measures).toBeGreaterThan(1);
  });
});
