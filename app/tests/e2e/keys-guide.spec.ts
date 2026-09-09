/**
 * The keys' three settings (docs/04 §5): the guide ahead of time, the finger
 * numbers on the marked keys, and the flash after a verdict — each on its own.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock } from './fixtures/midiMock';

const ITEM = 'song.folk.hot-cross-buns';

async function withSettings(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.addInitScript((p) => {
    const raw = localStorage.getItem('pianopath.settings');
    const s = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...s, ...(p as object) }));
  }, patch);
}

async function openWait(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('#score-stage .is-front svg') !== null, undefined, { timeout: 60_000 });
  await page.locator('#score-mode').selectOption('wait');
  await page.locator('#score-play').click();
  await page.waitForTimeout(400);
}

test.describe('the keys guide', () => {
  test('two notes ahead marks the next key in Wait mode, with the finger numbers', async ({ page }) => {
    await withSettings(page, { keysGuide: 'next-two', keysFingerNumbers: true });
    await installMidiMock(page, { permission: 'granted' });
    await openWait(page);
    // Hot Cross Buns opens E4 (finger 3), then D4 (2).
    await expect(page.locator('.keyboard-strip .key.is-expected')).toHaveCount(1);
    await expect(page.locator('.keyboard-strip .key.is-expected .key__finger')).toHaveText('3');
    await expect(page.locator('.keyboard-strip .key.is-next')).toHaveCount(1);
    await expect(page.locator('.keyboard-strip .key.is-next .key__finger')).toHaveText('2');
  });

  test('off marks nothing ahead, and no finger numbers', async ({ page }) => {
    await withSettings(page, { keysGuide: 'off', keysFingerNumbers: true });
    await installMidiMock(page, { permission: 'granted' });
    await openWait(page);
    await expect(page.locator('.keyboard-strip .key.is-expected')).toHaveCount(0);
    await expect(page.locator('.keyboard-strip .key.is-next')).toHaveCount(0);
    await expect(page.locator('.keyboard-strip .key__finger')).toHaveCount(0);
  });

  test('the default guide marks the note it waits for, without the next one in Wait mode', async ({ page }) => {
    await withSettings(page, { keysFingerNumbers: false });
    await installMidiMock(page, { permission: 'granted' });
    await openWait(page);
    await expect(page.locator('.keyboard-strip .key.is-expected')).toHaveCount(1);
    await expect(page.locator('.keyboard-strip .key.is-next')).toHaveCount(0);
    await expect(page.locator('.keyboard-strip .key__finger')).toHaveCount(0);
  });

  test('with the flash off a wrong note colours no key, and the guide stays', async ({ page }) => {
    await withSettings(page, { keysFlash: false });
    const midi = await installMidiMock(page, { permission: 'granted' });
    await openWait(page);
    await midi.noteOn(71, 80);
    await page.waitForTimeout(150);
    await midi.noteOff(71);
    await page.waitForTimeout(200);
    await expect(page.locator('.keyboard-strip .key.is-wrong')).toHaveCount(0);
    await expect(page.locator('.keyboard-strip .key.is-expected')).toHaveCount(1);
  });

  test('the ribbon prints the finger after the note name', async ({ page }) => {
    await withSettings(page, { keys: 'ribbon', keysFingerNumbers: true });
    await installMidiMock(page, { permission: 'granted' });
    await openWait(page);
    await expect(page.locator('.key-ribbon .rib.is-expected')).toHaveAttribute('data-note', 'E4 3');
  });
});
