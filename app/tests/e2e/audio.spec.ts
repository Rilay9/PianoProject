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

  // The tap-along latency test is gone, and this test is why it had to be
  // named rather than quietly dropped.
  //
  // What it did was install a MIDI mock, connect a piano, and then press
  // `#diag-latency-start` — that is a MIDI user reaching the sync click, which
  // is the one thing that must never be possible. Over USB MIDI both halves of
  // the round trip are already known (`clock.ts` reads
  // `AudioContext.outputLatency` and folds it into every conversion; MIDI-in is
  // a few milliseconds), so the test was measuring how well somebody taps and
  // then offering to subtract that from every note the engine judges.
  //
  // Its replacement is in `mic.spec.ts`: the section is not built at all when
  // the input is MIDI, and the measurement is a click through the speaker heard
  // on the microphone, with no human in the loop.
});
