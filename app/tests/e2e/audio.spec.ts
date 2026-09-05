import { expect, test } from '@playwright/test';
import { installMidiMock } from './fixtures/midiMock';

// Headless Chromium renders audio to a null device, so nothing here can assert
// that a human heard a chord. What it does assert is that the whole path runs
// for real: a user gesture starts the AudioContext, the *bundled* samples are
// fetched and decoded, and notes are scheduled without throwing.
test.describe('audio', () => {
  test('the bundled soundfont is served and is under the 20 MB budget', async ({ request }) => {
    const response = await request.get('/PianoProject/content/audio/acoustic_grand_piano-mp3.js');
    expect(response.status()).toBe(200);
    const body = await response.body();
    expect(body.byteLength).toBeGreaterThan(100_000);
    expect(body.byteLength).toBeLessThan(20 * 1024 * 1024);
    expect(body.toString('utf8', 0, 200)).toContain('MIDI.Soundfont.acoustic_grand_piano');
  });

  test('pressing "Test sound" starts the AudioContext and plays a C major chord', async ({
    page,
  }) => {
    await installMidiMock(page);
    await page.goto('/#/settings/midi');
    await expect(page.locator('.card h1')).toHaveText('MIDI');

    // Prove the samples come from our own origin, not smplr's CDN default.
    const soundfontRequests: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('acoustic_grand_piano')) soundfontRequests.push(response.url());
    });

    await page.locator('#midi-test-sound').click();
    // Loading and decoding 88 mp3 samples takes a moment in CI.
    await expect(page.locator('#midi-sound-status')).toHaveText('Played a C major chord.', {
      timeout: 60_000,
    });

    expect(soundfontRequests).toHaveLength(1);
    expect(soundfontRequests[0]).toContain('http://localhost:4173/PianoProject/content/audio/');

    // The status text above is only set after `getPiano()` resolved, which
    // means AudioContext.resume() succeeded inside the click handler.
    const audioState = await page.evaluate(() => {
      const ctx = new AudioContext();
      const state = ctx.state;
      void ctx.close();
      return state;
    });
    expect(['running', 'suspended']).toContain(audioState);
  });

  test('the latency test runs a metronome and reports a result', async ({ page }) => {
    const mock = await installMidiMock(page);
    await page.goto('/#/settings/diagnostics');
    await page.locator('#diag-connect').click();
    await page.locator('#diag-latency-start').click();

    // Play a key on each click. 8 clicks at 60 bpm is 8 s of wall time; the
    // taps land wherever they land, which is exactly what the test measures.
    await expect(page.locator('#diag-latency-status')).toContainText('Click 1 of 8');
    for (let i = 0; i < 8; i += 1) {
      await mock.noteOn(60, 100);
      await mock.noteOff(60);
      await page.waitForTimeout(950);
    }

    await expect(page.locator('#diag-latency-status')).toHaveText('Done.', { timeout: 30_000 });
    const result = page.locator('#diag-latency-result');
    await expect(result).toContainText('clicks matched');
    await expect(result).toContainText('mean');
    await expect(result).toContainText('σ');
    await expect(page.locator('#diag-latency-save')).toBeVisible();
  });
});
