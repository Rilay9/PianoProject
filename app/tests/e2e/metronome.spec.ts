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
    // Four taps 500 ms apart is 120 bpm. Timing through a real browser is not
    // exact, so the assertion is a band — a tap tempo that lands within a few
    // bpm is doing its job, and the arithmetic itself is unit-tested.
    await tap.click();
    for (let i = 0; i < 3; i += 1) {
      await page.waitForTimeout(500);
      await tap.click();
    }
    const text = (await page.locator('#metronome-bpm').textContent()) ?? '';
    const bpm = Number(text.replace(' bpm', ''));
    expect(bpm).toBeGreaterThan(105);
    expect(bpm).toBeLessThan(135);
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
