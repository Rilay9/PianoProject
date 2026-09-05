// The standalone metronome (docs/04-ui-spec.md §2a).
//
// The click itself is scheduled by `audio/Metronome`, which audio.spec.ts
// already covers on the AudioContext clock. What is tested here is the screen:
// that it is reachable, that the controls change what they say they change,
// and that starting it really starts the scheduler rather than only relabelling
// the button.

import { expect, test } from '@playwright/test';

test.describe('metronome', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/today/metronome');
    await expect(page.locator('.screen h1')).toHaveText('Metronome');
  });

  test('is reachable from Today and back again', async ({ page }) => {
    await page.goto('/');
    await page.locator('#today-metronome').click();
    await expect(page.locator('.screen h1')).toHaveText('Metronome');
    expect(new URL(page.url()).hash).toBe('#/today/metronome');
    await page.locator('.back-link').click();
    await expect(page.locator('.screen h1')).toHaveText('Today');
  });

  test('shows a tempo and changes it with the nudge buttons and the slider', async ({ page }) => {
    await expect(page.locator('#metronome-bpm')).toHaveText('80 bpm');
    await page.locator('#metronome-up').click();
    await expect(page.locator('#metronome-bpm')).toHaveText('85 bpm');
    await page.locator('#metronome-down').click();
    await page.locator('#metronome-down').click();
    await expect(page.locator('#metronome-bpm')).toHaveText('75 bpm');

    await page.locator('#metronome-slider').fill('132');
    await expect(page.locator('#metronome-bpm')).toHaveText('132 bpm');
  });

  test('clamps the tempo to the range the slider offers', async ({ page }) => {
    const min = Number(await page.locator('#metronome-slider').getAttribute('min'));
    for (let i = 0; i < 20; i += 1) await page.locator('#metronome-down').click();
    await expect(page.locator('#metronome-bpm')).toHaveText(`${min} bpm`);
  });

  test('draws one dot per beat and accents the first', async ({ page }) => {
    await expect(page.locator('#metronome-beats .beat-dot')).toHaveCount(4);
    await expect(page.locator('#metronome-beats .beat-dot--accent')).toHaveCount(1);

    await page.locator('#metronome-meter-3').click();
    await expect(page.locator('#metronome-beats .beat-dot')).toHaveCount(3);
    await expect(page.locator('#metronome-meter-3')).toHaveClass(/is-selected/);

    await page.locator('#metronome-meter-6').click();
    await expect(page.locator('#metronome-beats .beat-dot')).toHaveCount(6);
  });

  test('remembers which sound is selected', async ({ page }) => {
    await expect(page.locator('#metronome-sound-wood')).toHaveClass(/is-selected/);
    await page.locator('#metronome-sound-high').click();
    await expect(page.locator('#metronome-sound-high')).toHaveClass(/is-selected/);
    await expect(page.locator('#metronome-sound-wood')).not.toHaveClass(/is-selected/);
  });

  test('tap tempo sets the bpm from the gaps between taps', async ({ page }) => {
    const tap = page.locator('#metronome-tap');
    // Four taps, nominally 500 ms apart. The arithmetic is unit-tested in
    // tapTempo.test.ts; what this proves is the *wiring* — that the button
    // feeds the averager and the readout follows.
    //
    // The expected bpm is computed from the time the taps actually took, not
    // from the 500 ms that were asked for. A loaded machine turns four 500 ms
    // waits into four 570 ms ones, and a test written against the nominal
    // figure fails on a busy CI runner while the app is behaving perfectly.
    const started = Date.now();
    await tap.click();
    for (let i = 0; i < 3; i += 1) {
      await page.waitForTimeout(500);
      await tap.click();
    }
    const elapsed = Date.now() - started;
    const expected = 60_000 / (elapsed / 3);

    const text = (await page.locator('#metronome-bpm').textContent()) ?? '';
    const bpm = Number(text.replace(' bpm', ''));
    // Node's clock and the page's differ by the click round-trip, so a few bpm
    // of slack remains — but it no longer scales with how busy the machine is.
    expect(Math.abs(bpm - expected)).toBeLessThan(12);
    expect(bpm).toBeGreaterThan(60);
  });

  test('starts and stops, and the beat dots follow the click', async ({ page }) => {
    await page.locator('#metronome-slider').fill('200');
    await page.locator('#metronome-start').click();
    await expect(page.locator('#metronome-start')).toHaveText('Stop');
    await expect(page.locator('section[data-screen="metronome"]')).toHaveAttribute(
      'data-running',
      'true',
    );
    // At 200 bpm a beat lands every 300 ms; if the scheduler were not running,
    // no dot would ever light.
    await expect(page.locator('#metronome-beats .beat-dot.is-active')).toHaveCount(1, {
      timeout: 5_000,
    });

    await page.locator('#metronome-start').click();
    await expect(page.locator('#metronome-start')).toHaveText('Start');
    await expect(page.locator('section[data-screen="metronome"]')).toHaveAttribute(
      'data-running',
      'false',
    );
  });

  test('leaving the screen stops it', async ({ page }) => {
    await page.locator('#metronome-start').click();
    await expect(page.locator('#metronome-start')).toHaveText('Stop');
    await page.locator('.back-link').click();
    await expect(page.locator('.screen h1')).toHaveText('Today');
    // Coming back gives a stopped metronome, not one that kept running unseen.
    await page.locator('#today-metronome').click();
    await expect(page.locator('#metronome-start')).toHaveText('Start');
  });
});
