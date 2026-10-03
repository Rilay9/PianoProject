/**
 * `Hear it` sounds after a reload (U67).
 *
 * A learner who reloaded the page on a piece, or opened a link straight to one,
 * pressed `Hear it` and heard nothing. The screen built its session as it
 * loaded, before any tap, with the audio context and destination the engine had
 * then (none), and the session kept both for the whole visit: the cursor moved
 * through the piece and not one note reached the piano. The D2 probe measured
 * it: nothing scheduled after `Hear it` on a screen opened by address, notes
 * when a tap on another screen had come first.
 *
 * The count is the app's own, taken where a sound is scheduled
 * (`audio/audioStarts`): piano notes at `Piano.start` with the samples loaded,
 * metronome clicks as each is scheduled. The tests only read it: a baseline
 * before the tap, the count after.
 *
 * What this does not exercise: a phone's refusal to start audio before a tap.
 * The Chromium these tests drive starts the app's context as the piece loads,
 * with no tap, even with `--autoplay-policy=document-user-activation-required`
 * on its command line (tried while writing this file), so the tap's own wait
 * for the sound to start (`toggleHear` in `ScoreScreen.ts`) is reasoned from
 * the code, not run here.
 */
import { expect, test, type Page } from '@playwright/test';
import { closeScoreMenu, openScoreMenu } from './scoreControls';

const SONG = 'song.folk.hot-cross-buns';

type Hooked = Window & { __pianopath?: { audioStarts?: { piano: number; metronome: number } } };

interface Starts {
  piano: number;
  metronome: number;
}

async function audioStarts(page: Page): Promise<Starts> {
  return page.evaluate(() => {
    const counts = (window as unknown as Hooked).__pianopath?.audioStarts;
    return { piano: counts?.piano ?? Number.NaN, metronome: counts?.metronome ?? Number.NaN };
  });
}

/** The score on screen and its fit settled: the state a learner presses `Hear it` in. */
async function settled(page: Page): Promise<void> {
  await expect(page.locator('.score-view[data-settled]')).toBeVisible({ timeout: 60_000 });
}

/** Switches the click on from the `⋯` row: taps, none of which starts anything playing. */
async function clickOn(page: Page): Promise<void> {
  await openScoreMenu(page);
  await page.locator('#score-metronome').click();
  await expect(page.locator('#score-metronome')).toHaveAttribute('aria-pressed', 'true');
  await closeScoreMenu(page);
}

/** Waits for `source`'s count to pass `from`; a silent demonstration times out here. */
async function expectSounds(page: Page, source: keyof Starts, from: number, what: string): Promise<void> {
  await expect
    .poll(async () => (await audioStarts(page))[source], { message: what, timeout: 30_000 })
    .toBeGreaterThan(from);
}

test.describe.configure({ timeout: 120_000 });

test('opened by address, one tap on Hear it: the piano plays', async ({ page }) => {
  await page.goto(`/#/score/${SONG}`);
  await settled(page);
  const before = await audioStarts(page);
  expect(before.piano, 'the count hook is installed and nothing has played').toBe(0);
  await page.locator('#score-hear').click();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-hearing', 'true');
  await expectSounds(page, 'piano', before.piano, 'piano notes scheduled after one tap on Hear it, opened by address');
});

test('after a tap on another screen first: the piano plays (the control)', async ({ page }) => {
  await page.goto('/#/library');
  await page.locator('main').click({ position: { x: 5, y: 5 } });
  await page.evaluate((id) => {
    window.location.hash = `#/score/${id}`;
  }, SONG);
  await settled(page);
  const before = await audioStarts(page);
  await page.locator('#score-hear').click();
  await expectSounds(page, 'piano', before.piano, 'piano notes scheduled after Hear it, a tap having come first');
});

test('opened by address with the click on: Hear it plays the notes and the clicks', async ({ page }) => {
  await page.goto(`/#/score/${SONG}`);
  await settled(page);
  await clickOn(page);
  const before = await audioStarts(page);
  await page.locator('#score-hear').click();
  await expectSounds(page, 'metronome', before.metronome, 'metronome clicks scheduled after Hear it, opened by address');
  await expectSounds(page, 'piano', before.piano, 'piano notes scheduled after Hear it, opened by address');
});

/**
 * The ordinary Play path (the brief's item 3). ▶ in Listen is the same session
 * start as `Hear it` reached from the other button, and it was as silent: the
 * session holds the audio it was built with whichever button starts it.
 */
test('opened by address in Listen, ▶ plays the notes and the clicks', async ({ page }) => {
  await page.goto(`/#/score/${SONG}?mode=listen`);
  await settled(page);
  await clickOn(page);
  const before = await audioStarts(page);
  await page.locator('#score-play').click();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  await expectSounds(page, 'metronome', before.metronome, 'metronome clicks scheduled after ▶, opened by address');
  await expectSounds(page, 'piano', before.piano, 'piano notes scheduled after ▶, opened by address');
});
