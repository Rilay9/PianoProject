/**
 * The setup tour (docs/04 §7d): the first launch lands on it, skipping and
 * finishing are remembered, Settings brings it back, and what it sets is what
 * the app then uses.
 *
 * Every other spec starts with the tour already skipped (the config's
 * `storageState`); this one starts from nothing, which is the first launch.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { installMidiMock } from './fixtures/midiMock';

/** Pictures of every step, phone upright and sideways, for reading. */
const SHOTS = resolve('../build/setup');

test.use({ storageState: { cookies: [], origins: [] } });

const STEPS = ['welcome', 'hold', 'piano', 'sound', 'display', 'modes', 'practice', 'done'];

async function fresh(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('setup-fresh') === null) {
      sessionStorage.setItem('setup-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
}

test.describe('the setup tour', () => {
  test('the first launch lands on the tour; skipping it is remembered', async ({ page }) => {
    await fresh(page);
    await page.goto('/');
    const tour = page.locator('[data-screen="setup"]');
    await expect(tour).toBeVisible({ timeout: 60_000 });
    await expect(tour).toHaveAttribute('data-setup-step', 'welcome');
    await expect(page.locator('#setup-next')).toHaveText('Start');
    expect(new URL(page.url()).hash).toBe('#/settings/setup');

    await page.locator('#setup-skip').click();
    await expect(page.locator('.screen h1')).toHaveText('Today');

    await page.reload();
    await expect(page.locator('.screen h1')).toHaveText('Today');
    await expect(page.locator('[data-screen="setup"]')).toHaveCount(0);
  });

  test('a deep link on a fresh install is left alone', async ({ page }) => {
    await fresh(page);
    await page.goto('/#/library');
    await expect(page.locator('.screen h1')).toHaveText('Library');
  });

  test('Settings brings it back, and Back returns to Settings', async ({ page }) => {
    await fresh(page);
    await page.goto('/#/settings');
    await expect(page.locator('#settings-setup')).toContainText('Not run yet');
    await page.locator('#open-setup').click();
    await expect(page.locator('[data-screen="setup"]')).toBeVisible({ timeout: 60_000 });
    await page.locator('.back-link').click();
    await expect(page.locator('.screen h1')).toHaveText('Settings');
  });

  test('every step is reachable, sets what it says, and Finish is remembered', async ({ page }) => {
    await fresh(page);
    await installMidiMock(page, { permission: 'prompt' });
    await page.goto('/');
    const tour = page.locator('[data-screen="setup"]');
    await expect(tour).toBeVisible({ timeout: 60_000 });

    for (const [i, step] of STEPS.entries()) {
      await expect(tour).toHaveAttribute('data-setup-step', step);
      await expect(page.locator('#setup-progress')).toHaveText(`Step ${String(i + 1)} of ${String(STEPS.length)}`);
      // The footer is where the eye ends up: every step has it, with the one
      // filled button on the right (`04` §0 R3).
      await expect(page.locator('#setup-next')).toBeVisible();

      if (step === 'hold') {
        // The chosen way up, drawn by the real engraver in the phone's
        // proportions — one sliding system sideways, slots upright — and the
        // other a tap away. The landscape lock is on by default, so sideways
        // is the choice to begin with.
        const frame = page.locator('#setup-hold-preview');
        await expect(page.locator('#setup-hold-sideways')).toHaveAttribute('aria-pressed', 'true');
        await expect(frame).toHaveAttribute('data-orientation', 'sideways');
        await expect(frame.locator('svg').first()).toBeVisible({ timeout: 60_000 });
        await expect(frame.locator('.score-view')).toHaveAttribute('data-read-ahead', 'single');
        await page.locator('#setup-hold-upright').click();
        await expect(page.locator('#setup-hold-upright')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#setup-hold-sideways')).toHaveAttribute('aria-pressed', 'false');
        await expect(frame).toHaveAttribute('data-orientation', 'upright');
        await expect(frame.locator('svg').first()).toBeVisible({ timeout: 60_000 });
        await expect(frame.locator('.score-view')).toHaveAttribute('data-read-ahead', 'slots');
      }
      if (step === 'piano') {
        await page.locator('#setup-midi-connect').click();
        await expect(page.locator('#setup-midi-status')).not.toHaveText('', { timeout: 10_000 });
        await expect(tour).toHaveAttribute('data-midi-connected', 'true');
        // The strip lights up from the screen keys as well as the cable.
        await page.locator('#setup-input-priority').selectOption('mic,midi,none');
      }
      if (step === 'display') {
        await expect(page.locator('#setup-landscape')).not.toBeChecked();
        // Preview: the miniature follows the choice — upright, the slots —
        // and has the step to itself.
        await page.locator('#setup-preview-open').click();
        await expect(page.locator('#setup-options')).toBeHidden();
        await expect(page.locator('#setup-preview')).toHaveAttribute('data-orientation', 'upright');
        await expect(page.locator('#setup-preview svg').first()).toBeVisible({ timeout: 60_000 });
        await expect(page.locator('#setup-preview .score-view')).toHaveAttribute('data-read-ahead', 'slots');
        await expect(page.locator('#setup-preview .score-note.is-current').first()).toBeAttached();
        await expect(page.locator('#setup-preview .setup-device__strip .key').first()).toBeVisible();
        await page.locator('#setup-preview-flip').click();
        await expect(page.locator('#setup-preview')).toHaveAttribute('data-orientation', 'sideways');
        await expect(page.locator('#setup-preview .score-view')).toHaveAttribute('data-read-ahead', 'single', { timeout: 30_000 });
        await expect(page.locator('#setup-preview svg').first()).toBeVisible({ timeout: 30_000 });
        const textsBefore = await page.locator('#setup-preview svg text').count();
        // Back to the choices: the preview is gone until it is asked for.
        await page.locator('#setup-preview-close').click();
        await expect(page.locator('#setup-preview-panel')).toBeHidden();
        await expect(page.locator('#setup-options')).toBeVisible();
        await page.locator('#setup-theme').selectOption('dark');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await page.locator('#setup-keys').selectOption('ribbon');
        await page.locator('#setup-fingering').uncheck();
        // Opened again it is drawn with the choices as they are now: the
        // ribbon under the score, and no fingering digits, which are text.
        await page.locator('#setup-preview-open').click();
        await expect(page.locator('#setup-preview')).toHaveAttribute('data-orientation', 'sideways');
        await expect(page.locator('#setup-preview .setup-device__strip')).toHaveAttribute('data-keys', 'ribbon', { timeout: 30_000 });
        await expect(page.locator('#setup-preview svg').first()).toBeVisible({ timeout: 30_000 });
        await expect
          .poll(() => page.locator('#setup-preview svg text').count(), { timeout: 30_000 })
          .toBeLessThan(textsBefore);
        await page.locator('#setup-preview-close').click();
      }
      if (step === 'modes') {
        await page.locator('#setup-mode-input').selectOption('tempo');
        await page.locator('#setup-countin').fill('2');
        await page.locator('#setup-countin').dispatchEvent('change');
      }
      if (step === 'practice') {
        await expect(page.locator('#setup-tracks .chip').first()).toBeVisible({ timeout: 30_000 });
        await page.locator('#setup-weekend-minutes').selectOption('120');
      }
      if (step === 'done') {
        const summary = page.locator('#setup-summary');
        await expect(summary).toContainText('upright');
        await expect(summary).toContainText('MIDI input');
        await expect(summary).toContainText('Keep tempo');
        await expect(summary).toContainText('Ribbon');
        await expect(summary).toContainText('120 min weekends');
        await expect(page.locator('#setup-next')).toHaveText('Finish');
      }
      await page.locator('#setup-next').click();
    }

    await expect(page.locator('.screen h1')).toHaveText('Today');

    // What the tour set is what Settings shows.
    await page.goto('/#/settings');
    await expect(page.locator('#settings-setup')).toContainText('Finished');
    await expect(page.locator('#set-landscape')).not.toBeChecked();
    await expect(page.locator('#set-keys')).toHaveValue('ribbon');
    await expect(page.locator('#set-mode-input')).toHaveValue('tempo');
    await expect(page.locator('#set-countin')).toHaveValue('2');
    await expect(page.locator('#set-fingering')).not.toBeChecked();
    await expect(page.locator('#set-weekend-minutes')).toHaveValue('120');
    await expect(page.locator('#set-input-priority')).toHaveValue('mic,midi,none');
    await expect(page.locator('#theme-select')).toHaveValue('dark');

    // And a launch after that is Today, not the tour again.
    await page.goto('/');
    await expect(page.locator('.screen h1')).toHaveText('Today');
  });

  for (const [orientation, size] of [
    ['upright', { width: 360, height: 780 }],
    ['sideways', { width: 780, height: 360 }],
  ] as const) {
    test(`every step photographed, phone ${orientation}`, async ({ page }) => {
      await fresh(page);
      await installMidiMock(page, { permission: 'prompt' });
      await page.setViewportSize(size);
      await page.goto('/');
      const tour = page.locator('[data-screen="setup"]');
      await expect(tour).toBeVisible({ timeout: 60_000 });
      mkdirSync(SHOTS, { recursive: true });
      for (const [i, step] of STEPS.entries()) {
        await expect(tour).toHaveAttribute('data-setup-step', step);
        if (step === 'piano') {
          await page.locator('#setup-midi-connect').click();
          await expect(tour).toHaveAttribute('data-midi-connected', 'true');
          await page.locator('#setup-mic summary').click();
        }
        if (step === 'hold') {
          await expect(page.locator('#setup-hold-preview svg').first()).toBeVisible({ timeout: 60_000 });
          await page.waitForTimeout(400);
        }
        if (step === 'practice') {
          await expect(page.locator('#setup-tracks .chip').first()).toBeVisible({ timeout: 30_000 });
        }
        await page.waitForTimeout(250);
        await page.screenshot({
          path: join(SHOTS, `${orientation}--${String(i + 1)}-${step}.png`),
          fullPage: true,
          animations: 'disabled',
        });
        // Back, Skip and Next are in reach on every step without scrolling,
        // whichever way the phone is held: the footer is pinned.
        const box = await page.locator('#setup-next').boundingBox();
        expect(box, `step ${step}: the Next button has a box`).not.toBeNull();
        expect((box?.y ?? 0) + (box?.height ?? 0), `step ${step} ${orientation}: Next is below the fold`).toBeLessThanOrEqual(size.height);
        expect(box?.y ?? -1, `step ${step} ${orientation}: Next is above the top`).toBeGreaterThanOrEqual(0);
        if (step === 'display') {
          // And the preview, which has the step to itself.
          await page.locator('#setup-preview-open').click();
          await expect(page.locator('#setup-preview svg').first()).toBeVisible({ timeout: 60_000 });
          await page.waitForTimeout(400);
          await page.screenshot({
            path: join(SHOTS, `${orientation}--${String(i + 1)}-${step}-preview.png`),
            fullPage: true,
            animations: 'disabled',
          });
          const closeBox = await page.locator('#setup-preview-close').boundingBox();
          expect((closeBox?.y ?? 0) + (closeBox?.height ?? 0), `${orientation}: the preview's Back is below the fold`).toBeLessThanOrEqual(size.height);
          await page.locator('#setup-preview-close').click();
        }
        await page.locator('#setup-next').click();
      }
      await expect(page.locator('.screen h1')).toHaveText('Today');
    });
  }

  test('sideways on a phone the footer is on the first screenful', async ({ page }) => {
    await fresh(page);
    await page.setViewportSize({ width: 780, height: 360 });
    await page.goto('/');
    const next = page.locator('#setup-next');
    await expect(next).toBeVisible({ timeout: 60_000 });
    const box = await next.boundingBox();
    expect(box, 'the Start button has a box').not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(360);
  });
});
