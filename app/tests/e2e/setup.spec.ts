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

const STEPS = ['welcome', 'piano', 'latency', 'sound', 'display', 'modes', 'practice', 'done'];

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

      if (step === 'piano') {
        await page.locator('#setup-midi-connect').click();
        await expect(page.locator('#setup-midi-status')).not.toHaveText('', { timeout: 10_000 });
        await expect(tour).toHaveAttribute('data-midi-connected', 'true');
        // The strip lights up from the screen keys as well as the cable.
        await page.locator('#setup-input-priority').selectOption('mic,midi,none');
      }
      if (step === 'display') {
        // The live preview: the real engraver over a real piece.
        await expect(page.locator('#setup-preview svg').first()).toBeVisible({ timeout: 60_000 });
        await expect(page.locator('#setup-preview .score-note.is-current').first()).toBeAttached();
        await expect(page.locator('#setup-preview-keys .key').first()).toBeVisible();
        await page.locator('#setup-theme').selectOption('dark');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await page.locator('#setup-keys').selectOption('ribbon');
        await expect(page.locator('#setup-preview-keys')).toHaveAttribute('data-keys', 'ribbon');
        // The preview is drawn again without the fingering digits, which are
        // text: fewer text nodes after than before.
        const textsBefore = await page.locator('#setup-preview svg text').count();
        await page.locator('#setup-fingering').uncheck();
        await expect
          .poll(() => page.locator('#setup-preview svg text').count(), { timeout: 10_000 })
          .toBeLessThan(textsBefore);
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
        if (step === 'display') {
          await expect(page.locator('#setup-preview svg').first()).toBeVisible({ timeout: 60_000 });
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
