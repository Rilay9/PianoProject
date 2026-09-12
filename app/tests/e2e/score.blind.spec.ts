/**
 * A blind run hides the notation and nothing else.
 *
 * Blind mode is for playing from memory, and the gallery's `blind--upright`
 * cell is 1,400 px of unbroken black between the header and the control bar.
 * That is most of what it is meant to be — except that the three things on the
 * stage which exist *precisely* for when the notation is not available went
 * with it.
 *
 * The stage is hidden as a whole (`visibility: hidden`, so the renderer keeps
 * its box and the keyboard strip does not jump), and `visibility` inherits.
 * Its children are the visible count-in, the beat dot — "the one thing that
 * must be visible while the clock runs", `08` §5.3 — and the corner readout,
 * added for "when the chrome has folded away and nothing else on the screen
 * says it". So a blind run in tempo mode counted itself in invisibly: the one
 * moment a player most needs to know when to start, in the one mode where
 * there is nothing else at all to look at, with a count-in that was built
 * because the sound may be turned down.
 *
 * The notation is the buffers, and a rule below already hides those by name.
 * This pins the rest of the stage back on, because a blank screen and a blank
 * screen with a beat on it are different instruments.
 */
import { expect, test, type Page } from '@playwright/test';
import { pressControl } from './scoreControls';

const SONG = 'song.folk.hot-cross-buns';

/**
 * Opens the piece blind, and waits until it can actually be played.
 *
 * `data-blind` is set while the screen is being built, long before the score
 * has been fetched, parsed and engraved. Waiting on it and then pressing Play
 * works on an idle machine and fails under a full suite, which is what happened
 * here: all three of these timed out waiting for a run that had never started.
 * The rest is the opening every other score spec uses — a mode, then ink on the
 * stage. The ink is hidden in blind mode but `visibility: hidden` still takes
 * part in layout, so it still has a height to wait for.
 */
async function openBlind(page: Page): Promise<void> {
  await page.setViewportSize({ width: 342, height: 740 });
  await page.goto(`/#/score/${SONG}?blind=1`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-blind', 'true', {
    timeout: 60_000,
  });
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
    { timeout: 60_000 },
  );
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
}

test.describe('a blind run', () => {
  test('still hides the notation', async ({ page }) => {
    await openBlind(page);
    // The whole point, and the thing a previous fix had to rescue once
    // already: `.score-buffer.is-front { visibility: visible }` used to beat
    // the rule that hid the stage, so blind mode drew the score.
    await expect(page.locator('.score-buffer.is-front svg').first()).toBeHidden({ timeout: 30_000 });
  });

  test('counts you in where you can see it', async ({ page }) => {
    await openBlind(page);
    await page.locator('#score-mode').selectOption('tempo');

    // Watched, not polled for. A count-in is over in a couple of bars, and
    // `toBeVisible` asks the question again and again *after* the click — so
    // under a full suite's load the count-in can begin and end between the tap
    // and the first look, and the test reports that it never happened. This
    // one passed alone and failed in the suite, which here always means timing.
    // The observer is installed before the tap and records what actually
    // occurred, so the assertion is about the run rather than about when the
    // test got round to looking.
    await page.evaluate(() => {
      const seen = { visible: false, lit: 0 };
      (window as unknown as { __countIn?: typeof seen }).__countIn = seen;
      const node = document.querySelector('#score-countin');
      if (!node) return;
      const look = (): void => {
        const el = node as HTMLElement;
        if (el.hidden || el.offsetParent === null) return;
        if (getComputedStyle(el).visibility === 'hidden') return;
        seen.visible = true;
        seen.lit = Math.max(seen.lit, el.querySelectorAll('.is-now').length);
      };
      new MutationObserver(look).observe(node, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      look();
    });

    await pressControl(page, '#score-play');
    await page.waitForFunction(
      () => (window as unknown as { __countIn?: { visible: boolean } }).__countIn?.visible === true,
      undefined,
      { timeout: 30_000 },
    );
    const seen = await page.evaluate(
      () => (window as unknown as { __countIn?: { visible: boolean; lit: number } }).__countIn,
    );
    expect(seen?.visible, 'the count-in ran invisibly in the one mode with nothing else to see').toBe(
      true,
    );
    // One beat lit at a time, which is what makes it a count rather than a row
    // of numbers.
    expect(seen?.lit ?? 0).toBe(1);
  });

  test('keeps the beat where you can see it', async ({ page }) => {
    await openBlind(page);
    await page.locator('#score-mode').selectOption('tempo');
    await pressControl(page, '#score-play');
    // Past the count-in and into the music.
    await expect(page.locator('#score-countin')).toBeHidden({ timeout: 30_000 });
    await expect(page.locator('#score-beat'), 'the beat dot went with the notation').toBeVisible({
      timeout: 30_000,
    });
  });

  test('still says which bar you are in', async ({ page }) => {
    await openBlind(page);
    await page.locator('#score-mode').selectOption('tempo');
    await pressControl(page, '#score-play');
    // Which bar, from wherever the screen is saying it.
    //
    // There are two places and they take turns: the header's readout, and the
    // corner chip that appears once the chrome has folded three seconds into a
    // run. In blind mode the status line permanently reads "Blind — ⋯ shows the
    // score", and a status line hides the header readout upright — so for the
    // first few seconds the corner is the only one, and it is not drawn yet.
    // Asserting on the corner alone meant asserting on the fold's timer, which
    // is why this passed alone and timed out under load. What matters to a
    // player is that *something* says which bar, so that is what is asked.
    await page.waitForFunction(
      () => {
        const shows = (id: string): boolean => {
          const el = document.getElementById(id);
          if (!el || el.offsetParent === null) return false;
          if (getComputedStyle(el).visibility === 'hidden') return false;
          return /bar\s+\d/.test(el.textContent ?? '');
        };
        return shows('score-corner') || shows('score-where');
      },
      undefined,
      { timeout: 30_000 },
    );
  });
});
