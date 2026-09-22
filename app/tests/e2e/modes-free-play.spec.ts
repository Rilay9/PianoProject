/**
 * Free play, from a rung and from Today (T17; `04` §2b, §3d).
 *
 * The whole screen is "the keys you are holding light up, they are named, and
 * three or more of them are named as a chord". Nothing is judged and there is
 * no run to start, so the only way to find out whether it works is to hold
 * some keys and read the panel.
 *
 * Judged as a learner:
 *
 *  - the readout and the keys are both on a 342 px phone, which is the whole
 *    screen — and the chord line's height is *reserved*, so naming a chord on
 *    the third note does not move the keyboard under the hand playing it;
 *  - with nothing connected the screen says so and offers the two things that
 *    would fix it, rather than drawing a dead panel (R4);
 *  - Back leaves nothing on.
 *
 * **Nothing here is heard.** That a tap sounds through the piano samples is
 * not asserted anywhere below.
 */
import { expect, test, type Page } from '@playwright/test';

import { installMidiMock } from './fixtures/midiMock';

const PHONE = { width: 342, height: 740 };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
    }
  });
});

async function withoutScrolling(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight;
  }, selector);
}

/**
 * Holds a key on the glass down, and leaves it down.
 *
 * One at a time: the strip captures the pointer on its container, so a second
 * synthetic pointer id is not a second finger — holding a chord is what the
 * MIDI source below is for, and "every input at once" is the screen's own
 * promise (`04` §2b).
 */
async function tapAndHold(page: Page, midi: number): Promise<void> {
  const key = page.locator(`#play-strip .key[data-midi="${String(midi)}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
}

async function releaseTap(page: Page, midi: number): Promise<void> {
  const key = page.locator(`#play-strip .key[data-midi="${String(midi)}"]`);
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

test('a rung’s Free play button opens the screen with no piece and no run', async ({ page }) => {
  await page.setViewportSize(PHONE);
  // `2.3` is one of the rungs whose lesson sends the learner here.
  await page.goto('/#/lesson/2.3');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  await page.locator('#lesson-tool-play').click();
  await expect(page).toHaveURL(/#\/play/);
  await expect(page.locator('section[data-screen="play"]')).toBeVisible({ timeout: 60_000 });
  // No transport at all — there is nothing to start or stop, which is the
  // difference between this and the Score screen's mode of the same name.
  await expect(page.locator('section[data-screen="play"] button#play-start')).toHaveCount(0);
  // The readout and the keys are the screen, and both are on it.
  for (const id of ['#play-chord', '#play-notes', '#play-strip']) {
    expect(await withoutScrolling(page, id), `${id} is below the fold on a 342 px phone`).toBe(true);
  }
});

test('Today’s own door opens the same screen', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/#/today');
  await expect(page.locator('#today-play')).toBeVisible({ timeout: 60_000 });
  await page.locator('#today-play').click();
  await expect(page.locator('section[data-screen="play"]')).toBeVisible({ timeout: 60_000 });
});

test('the keys are named, and three of them are named as a chord', async ({ page }) => {
  test.setTimeout(120_000);
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.setViewportSize(PHONE);
  await page.goto('/#/play');
  await expect(page.locator('#play-strip .key[data-midi="60"]')).toBeVisible({ timeout: 60_000 });
  const screen = page.locator('section[data-screen="play"]');

  // The chord line is empty until three keys are down, and its height is
  // reserved — measured with nothing held and again with a chord held,
  // because a panel that grows on the third note moves the keyboard under the
  // hand playing it.
  const chordHeight = async (): Promise<number> =>
    page.locator('#play-chord').evaluate((el) => Math.round(el.getBoundingClientRect().height));
  const emptyHeight = await chordHeight();
  await expect(page.locator('#play-chord')).toHaveText('');

  // The glass, which is the instrument for a learner with no cable.
  await tapAndHold(page, 60);
  await expect(screen).toHaveAttribute('data-held', '1', { timeout: 15_000 });
  await expect(page.locator('#play-notes')).toContainText('C4');
  await expect(page.locator('#play-chord'), 'one key was named as a chord').toHaveText('');
  await releaseTap(page, 60);
  await expect(screen).toHaveAttribute('data-held', '0');

  // And the piano, held as a chord — the same panel, the other input.
  await midi.noteOn(60, 80);
  await midi.noteOn(64, 80);
  await midi.noteOn(67, 80);
  await expect(screen).toHaveAttribute('data-held', '3', { timeout: 15_000 });
  // Three different pitch classes is a chord, and the lowest key is asked
  // first because several chords are genuinely the same set of notes.
  await expect(screen).toHaveAttribute('data-chord', /C/);
  await expect(page.locator('#play-chord')).toContainText('C');
  expect(
    await chordHeight(),
    'the readout grew when it named a chord, moving the keys under the hand',
  ).toBe(emptyHeight);

  await midi.noteOff(60);
  await midi.noteOff(64);
  await midi.noteOff(67);
  await expect(screen).toHaveAttribute('data-held', '0', { timeout: 15_000 });
  await expect(page.locator('#play-chord')).toHaveText('');
});

test('with nothing connected it says so and offers the two ways to fix it', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/#/play');
  await expect(page.locator('#play-device')).toBeVisible({ timeout: 60_000 });
  // R4: the sentence that says what is missing, and the controls that sentence
  // suggests — not a dead panel.
  await expect(page.locator('#play-device')).toContainText('tap the keys below');
  await expect(page.locator('#play-open-midi')).toBeVisible();
  await expect(page.locator('#play-open-mic')).toBeVisible();
  // And the keys stay playable, because for a learner with no cable they are
  // the instrument.
  await expect(page.locator('#play-strip .key[data-midi="60"]')).toBeVisible();
});

test('Back leaves it, and leaves nothing running', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/#/play');
  await expect(page.locator('#play-back')).toBeVisible({ timeout: 60_000 });
  await page.locator('#play-back').click();
  await expect(page.locator('section[data-screen="play"]')).toHaveCount(0);
  await expect(page.locator('section[data-screen="today"]')).toBeVisible({ timeout: 60_000 });
});
