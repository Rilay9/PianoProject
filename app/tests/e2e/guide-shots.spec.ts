/**
 * Photographs the app for the guide (docs/04 §7e) into `public/guide/`.
 *
 *   GUIDE_SHOTS=1 npx playwright test guide-shots
 *
 * Gated, because it writes into the source tree: the pictures ship with the
 * build and are committed, so they are true to the build they ship with.
 * Each is the screen at a phone's size, upright unless the screen is one
 * used sideways. `guide.spec.ts` checks every picture the guide names is
 * there.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';

const OUT = resolve('public/guide');
const UPRIGHT = { width: 360, height: 780 };
const SIDEWAYS = { width: 780, height: 360 };
const PDF = 'tests/fixtures/imports/two-systems.pdf';

type Run = { step: number; expected: number[]; pitches: number[] } | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };

test.describe('guide pictures', () => {
  test.skip(process.env.GUIDE_SHOTS !== '1', 'set GUIDE_SHOTS=1 to photograph the app for the guide');
  test.describe.configure({ timeout: 600_000 });

  test('every picture the guide shows', async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await page.addInitScript(() => {
      if (sessionStorage.getItem('guide-fresh') === null) {
        sessionStorage.setItem('guide-fresh', '1');
        indexedDB.deleteDatabase('pianopath');
        localStorage.clear();
        localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'done', version: 1 }));
      }
    });
    const midi = await installMidiMock(page, { permission: 'granted' });
    const shot = async (name: string, size = UPRIGHT): Promise<void> => {
      await page.setViewportSize(size);
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(OUT, `${name}.png`), animations: 'disabled' });
    };
    const open = async (hash: string, screen: string): Promise<void> => {
      await page.goto(`/${hash}`);
      await expect(page.locator(`[data-screen="${screen}"]`)).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(600);
    };

    await page.setViewportSize(UPRIGHT);
    await open('#/today', 'today');
    await expect(page.locator('#today-card .list-row').first()).toBeVisible({ timeout: 60_000 });
    await shot('today');
    await open('#/plan', 'plan');
    await shot('plan');
    await open('#/lesson/1.1', 'lesson');
    await shot('lesson');
    await open('#/library', 'library');
    await expect(page.locator('.list-row').first()).toBeVisible({ timeout: 60_000 });
    await shot('library');
    await open('#/library/folder', 'folder');
    await shot('folder');
    await open('#/library/shelf', 'shelf');
    await shot('shelf');
    await open('#/progress', 'progress');
    await shot('progress');
    await open('#/plan/skills', 'skills');
    await shot('skills');
    await open('#/drill/drill.reading.note-flash-treble-c4-g4', 'drill');
    await shot('drill');
    await open('#/settings/midi', 'midi');
    await page.locator('#midi-connect').click();
    await page.waitForTimeout(400);
    await midi.noteOn(64, 80);
    await page.waitForTimeout(150);
    await midi.noteOff(64);
    await shot('midi');
    await open('#/settings/diagnostics', 'diagnostics');
    await shot('diagnostics');
    await open('#/settings/setup', 'setup');
    await page.locator('#setup-next').click();
    await expect(page.locator('#setup-hold-upright svg').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#setup-hold-sideways svg').first()).toBeVisible({ timeout: 60_000 });
    await shot('tour');

    // The score screen: three notes into Hot Cross Buns, then the end.
    await open('#/score/song.folk.hot-cross-buns', 'score');
    await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
    await page.locator('#score-mode').selectOption('wait');
    await page.waitForTimeout(1500);
    await page.locator('#score-play').click();
    await page.waitForTimeout(600);
    await playSteps(page, midi, 3);
    await shot('score-upright');
    await playSteps(page, midi, 40);
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 10_000 });
    await shot('summary');
    // Sideways is its own run: a run is one size, and it was started upright.
    await page.setViewportSize(SIDEWAYS);
    await open('#/score/song.folk.hot-cross-buns', 'score');
    await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
    await page.locator('#score-mode').selectOption('wait');
    await page.waitForTimeout(1500);
    await page.locator('#score-play').click();
    await page.waitForTimeout(600);
    await playSteps(page, midi, 5);
    await shot('score-sideways', SIDEWAYS);

    // A PDF, sideways: the fixture's two systems.
    await page.goto('/#/library');
    await expect(page.locator('[data-screen="library"]')).toBeVisible({ timeout: 60_000 });
    await page.locator('#library-file').setInputFiles(PDF);
    await page.waitForTimeout(1500);
    await page.goto('/#/pdf/import.two-systems');
    await expect(page.locator('[data-screen="pdf"]')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    await shot('pdf', SIDEWAYS);
  });
});

async function playSteps(page: Page, midi: MidiMock, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    const run = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
    if (!run) return;
    const notes = run.expected.length > 0 ? run.expected : run.pitches;
    for (const n of notes) await midi.noteOn(n, 78);
    await page.waitForTimeout(100);
    for (const n of notes) await midi.noteOff(n);
    await page.waitForTimeout(120);
  }
}
