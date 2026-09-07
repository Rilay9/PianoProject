// The Score screen (docs/04-ui-spec.md §5).
//
// One test per control, plus a scripted run in each judged mode that ends on
// the summary sheet. The screen is opened on a real catalog item from the
// built content, so this also proves the id -> catalog -> file -> renderer
// path the Library will use.

import { expect, test, type Page } from '@playwright/test';

import {
  closeScoreMenu,
  openScoreMenu,
  setTempoPercent,
  withScoreMenu,
} from './scoreControls';

/** Mirrors CONTROL_BAR_HIDE_MS; importing the screen would drag the app in. */
const HIDE_MS = 3_000;

/** A short authored piece: eight bars, both hands, and always present. */
const ITEM = 'song.folk.hot-cross-buns';

async function openScore(page: Page, id: string = ITEM): Promise<void> {
  await page.goto(`/#/score/${id}`);
  await expect(page.locator('section[data-screen="score"]')).toBeVisible();
  // The renderer double-buffers, and the *first* SVG in the DOM is usually the
  // pre-rendered next window, which is hidden and therefore zero-height. Wait
  // on the front buffer specifically or this races with the pre-render.
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  // The notation draws before the audio and the session are ready; `data-mode`
  // appears only once the screen's first `render()` has run, so waiting on the
  // SVG alone races the rest of the load.
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/);
  // Deliberately no tap on the stage here: a tap *toggles* the control bar
  // (docs/04 §5), and a hidden bar is `pointer-events: none`, so every
  // subsequent control click would land on the score instead.
  await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'true');
}

test.describe('score screen', () => {
  test.setTimeout(120_000);

  test('opens a catalog item by id and renders it', async ({ page }) => {
    await openScore(page);
    await expect(page.locator('#score-title')).toContainText('Hot Cross Buns');
    await expect(page.locator('#score-stage .is-front svg')).toBeVisible();
  });

  test('an unknown id says so instead of hanging', async ({ page }) => {
    await page.goto('/#/score/song.not.a.real.item');
    await expect(page.locator('#score-status')).toContainText('Unknown item');
  });

  /**
   * The auto-hide, as decision 5 rewrote it.
   *
   * The bar used to disappear three seconds into every run whatever the shape
   * of the screen. Held upright the sheet is fitted to the width and leaves a
   * third of the stage empty under it, so hiding the controls bought nothing
   * and cost a hunt for them; held sideways the fit uses every pixel of the
   * height and the bar's strip is coming straight out of the music.
   */
  test('the control bar gets out of the way when it is taking room from the music', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 880, height: 412 });
    await openScore(page);
    const bar = page.locator('#score-bar');
    await expect(bar).toHaveAttribute('data-visible', 'true');
    // It does not vanish while the learner is still setting up…
    await page.waitForTimeout(4_000);
    await expect(bar).toHaveAttribute('data-visible', 'true');
    // …but it gets out of the way once the piece is running (docs/04 §5).
    await page.locator('#score-play').click();
    await expect(bar).toHaveAttribute('data-visible', 'false', { timeout: 8_000 });
    await page.locator('#score-stage').click({ position: { x: 5, y: 5 } });
    await expect(bar).toHaveAttribute('data-visible', 'true');
  });

  test('and stays put when it is not (decision 5)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openScore(page);
    const bar = page.locator('#score-bar');
    await page.locator('#score-play').click();
    await page.waitForTimeout(HIDE_MS + 2_000);
    // The sheet does not reach the bottom of the stage upright, so there is
    // nothing to get out of the way of.
    const room = await page.evaluate(() => {
      const stage = document.querySelector('#score-stage')!.getBoundingClientRect();
      const svg = document.querySelector('#score-stage .is-front svg')!.getBoundingClientRect();
      return Math.round(stage.bottom - svg.bottom);
    });
    expect(room, 'the sheet fills the stage upright too — check the premise').toBeGreaterThan(24);
    await expect(bar).toHaveAttribute('data-visible', 'true');
  });

  test('mode and input selectors change the run', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', 'tempo');
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-input', 'keys');
  });

  test('tempo slider moves the percentage and the bpm together', async ({ page }) => {
    await openScore(page);
    const label = page.locator('#score-tempo-label');
    await setTempoPercent(page, 50);
    await expect(label).toContainText('50%');
    const half = (await label.textContent()) ?? '';
    await setTempoPercent(page, 100);
    await expect(label).toContainText('100%');
    expect((await label.textContent()) ?? '').not.toBe(half);
  });

  test('hand focus buttons select one at a time', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-hands-R').click();
    await expect(page.locator('#score-hands-R')).toHaveClass(/is-selected/);
    await expect(page.locator('#score-hands-both')).not.toHaveClass(/is-selected/);
    await page.locator('#score-hands-both').click();
    await expect(page.locator('#score-hands-both')).toHaveClass(/is-selected/);
  });

  test('bars per window steps between 1 and 8 and redraws', async ({ page }) => {
    await openScore(page);
    await withScoreMenu(page, async () => {
      await expect(page.locator('#score-bars')).toHaveText('2 bars');
      await page.locator('#score-bars-down').click();
      await expect(page.locator('#score-bars')).toHaveText('1 bar');
      // Clamped at the bottom, not wrapped.
      await page.locator('#score-bars-down').click();
      await expect(page.locator('#score-bars')).toHaveText('1 bar');
      for (let i = 0; i < 4; i += 1) await page.locator('#score-bars-up').click();
      await expect(page.locator('#score-bars')).toHaveText('5 bars');
    });
  });

  test('layout is a segment that says which one you are in', async ({ page }) => {
    await openScore(page);
    await withScoreMenu(page, async () => {
      await expect(page.locator('#score-layout-window')).toHaveClass(/is-selected/);
      await expect(page.locator('#score-layout-scroll')).not.toHaveClass(/is-selected/);
      await page.locator('#score-layout-scroll').click();
      await expect(page.locator('#score-layout-scroll')).toHaveClass(/is-selected/);
      await expect(page.locator('#score-layout-window')).not.toHaveClass(/is-selected/);
    });
  });

  test('zoom, keyboard strip and playback destination all respond', async ({ page }) => {
    await openScore(page);
    await openScoreMenu(page);
    await page.locator('#score-zoom-in').click();
    await page.locator('#score-zoom-out').click();

    await expect(page.locator('#score-strip')).toBeVisible();
    await page.locator('#score-strip-toggle').click();
    await expect(page.locator('#score-strip')).toBeHidden();

    await expect(page.locator('#score-destination')).toContainText('Phone');
    await page.locator('#score-destination').click();
    await expect(page.locator('#score-destination')).toContainText('Piano');
    await page.locator('#score-destination').click();
    await expect(page.locator('#score-destination')).toContainText('Both');
    await closeScoreMenu(page);
  });

  test('the metronome toggles while the sheet music is showing', async ({ page }) => {
    await openScore(page);
    const button = page.locator('#score-metronome');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
    // Mid-piece, through the ⋯ sheet: the click is the thing you reach for
    // while the music is going, so it has to be reachable then.
    await withScoreMenu(page, async () => {
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(button).toHaveText('On');
    });
    await expect(page.locator('#score-stage .is-front svg')).toBeVisible();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  });

  test('play, pause and restart', async ({ page }) => {
    await openScore(page);
    const play = page.locator('#score-play');
    await play.click();
    await expect(play).toHaveText('⏸');
    await play.click();
    await expect(play).toHaveText('▶');
    await page.locator('#score-restart').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  });

  test('back from a deep link returns to the default tab', async ({ page }) => {
    // `#/score/<id>` carries no tab, so a link straight into a piece has no
    // "where I came from" to return to and Back goes to Today. Opening it from
    // inside the app (P7's Library) goes through `router.navigateScore`, which
    // keeps the current tab — covered by the router unit tests.
    await openScore(page);
    await page.locator('#score-back').click();
    await expect(page.locator('.screen h1')).toHaveText('Today');
  });

  test('a Tempo-mode run reaches the summary sheet with its numbers', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await page.locator('#score-play').click();
    const sheet = page.locator('#score-summary');
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    await expect(sheet).toContainText('Accuracy');
    await expect(sheet).toContainText('Tempo');
    // No judging input, so the learner is asked rather than shown a number
    // they did not earn (docs/04 §5).
    await expect(page.locator('#summary-selfreport')).toBeVisible();
    for (const id of ['again', 'slower', 'faster', 'loop', 'done']) {
      await expect(page.locator(`#summary-${id}`)).toBeVisible();
    }
  });

  test('the summary self-report records an answer', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await page.locator('#score-play').click();
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
    await page.locator('#summary-self-clean').click();
    await expect(page.locator('#score-status')).toContainText('Clean');
  });

  test('“Slower” restarts ten percent down', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await page.locator('#score-play').click();
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
    await page.locator('#summary-slower').click();
    await expect(page.locator('#score-tempo-label')).toContainText('120%');
  });
});

test.describe('the keyboard strip shows the piece, not the whole piano', () => {
  /**
   * The bug this replaces, from the first run on the real phone.
   *
   * The strip was built with no range, so it drew all 88 keys. On a 360 px
   * screen that is about seven pixels a key, and the blue key marking the note
   * the app was waiting for — F#4, in *Suo Gân* — was a sliver among eighty-
   * eight slivers. Forty seconds of hunting from E3 to E4 never found it, and
   * the engine had been right the whole time.
   */
  const SUO_GAN = 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx';

  test('draws the range the music uses', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openScore(page, SUO_GAN);
    const keys = page.locator('.keyboard-strip [data-midi]');
    const count = await keys.count();
    expect(count, 'the whole piano is back on the strip').toBeLessThan(40);
    expect(count, 'the strip is too narrow to see where the hand is').toBeGreaterThan(20);

    // And the notes of the first bar are all on it.
    for (const midi of [62, 64, 66, 69]) {
      await expect(page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`)).toHaveCount(1);
    }
  });

  test('the key it is waiting for is wide enough to hit, and on the screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openScore(page, SUO_GAN);
    const expected = page.locator('.keyboard-strip [data-midi="62"]'); // D4, the first note
    const box = await expected.boundingBox();
    expect(box, 'the first note has no key on the strip').toBeTruthy();
    // Seven pixels was the old width. A finger is about forty.
    expect(box!.width, `the key is ${String(box!.width)} px wide`).toBeGreaterThan(12);

    // Within the strip's own scroll viewport, not merely in the DOM.
    const strip = await page.locator('.keyboard-strip').boundingBox();
    expect(strip).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(strip!.x - 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(strip!.x + strip!.width + 1);
  });
});

test.describe('the sheet fills the screen (P19b)', () => {
  test('a two-bar window is not a third of a phone screen', async ({ page }) => {
    // Measured on the owner's S25: stage 360x708, sheet 358x237 — a third of
    // the height, the rest black, with the notes at desktop size on a phone
    // propped on a music stand.
    await page.setViewportSize({ width: 360, height: 780 });
    await openScore(page, 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx');
    // The fit is scheduled after a paint and costs one redraw.
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const stage = document.querySelector('#score-stage')?.getBoundingClientRect();
            const svg = document
              .querySelector('#score-stage .is-front svg')
              ?.getBoundingClientRect();
            if (!stage || !svg || stage.height === 0) return 0;
            return Math.round((svg.height / stage.height) * 100);
          }),
        { timeout: 30_000, message: 'the sheet never grew' },
      )
      .toBeGreaterThan(55);

    // And it still does not overflow sideways, which is the fact the whole
    // approach rests on: OSMD grows the staff's height and pins its width.
    const fits = await page.evaluate(() => {
      const stage = document.querySelector('#score-stage')!.getBoundingClientRect();
      const svg = document.querySelector('#score-stage .is-front svg')!.getBoundingClientRect();
      return svg.width <= stage.width + 2;
    });
    expect(fits, 'the sheet is wider than the screen').toBe(true);
  });

  test('the zoom buttons still do something, now that the fit does the work', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openScore(page, 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx');
    const height = async (): Promise<number> =>
      page.evaluate(
        () =>
          document.querySelector('#score-stage .is-front svg')?.getBoundingClientRect().height ?? 0,
      );
    await expect.poll(height, { timeout: 30_000 }).toBeGreaterThan(300);
    const fitted = await height();
    // Zoom is a multiplier on the fitted size now. It used to be the absolute
    // OSMD zoom, which a fit would simply cancel out.
    await withScoreMenu(page, async () => {
      await page.locator('#score-zoom-out').click();
    });
    await expect.poll(height, { timeout: 15_000 }).toBeLessThan(fitted - 5);
  });
});

test.describe('naming the note it is waiting for', () => {
  test('says nothing until the setting is on', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();
    // Off by default: the owner reads notation, and a name is a crutch that
    // should be there when he wants it rather than always.
    await expect(page.locator('#score-waiting')).toBeHidden();
  });

  test('names it once the setting is on, and only in Wait mode', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#set-notenames').click();
    await openScore(page, 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx');

    await page.locator('#score-mode').selectOption('wait');
    // The on-screen keys as the input, so this test can answer the app.
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    await page.locator('#score-play').click();

    // Bar 1 of Suo Gân is D4 · E4 · F♯4 · A4, so it starts by wanting D4 —
    // and two notes later, the F♯4 that started all this.
    await expect(page.locator('#score-waiting')).toContainText('Waiting for D4');
    const press = async (midi: number): Promise<void> => {
      const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
      await key.scrollIntoViewIfNeeded();
      await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
      await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
    };
    await press(62);
    await expect(page.locator('#score-waiting')).toContainText('Waiting for E4');
    await press(64);
    await expect(page.locator('#score-waiting')).toContainText('Waiting for F♯4');

    // Tempo mode drives from the clock, so nothing is ever waited for.
    await page.locator('#score-mode').selectOption('tempo');
    await expect(page.locator('#score-waiting')).toBeHidden();
  });
});

/**
 * Blind mode (replan §8).
 *
 * It had never hidden the notation. `visibility` is the one property a child
 * can use to escape an ancestor that hid it, and `.score-buffer.is-front` set
 * `visibility: visible` unconditionally — so the class went on, the button
 * relabelled itself to "Show the score", and the score stayed on the screen.
 * The tour photographed exactly that in all four form factors and captioned it
 * "the notation is hidden on purpose", which is how it survived a review.
 */
test.describe('blind mode', () => {
  test('hides the notation and keeps everything else', async ({ page }) => {
    // The owner's phone, because the header assertions below are about a
    // width where a title and a message have to share 360 px.
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/#/score/song.folk.hot-cross-buns?blind=1');
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-blind', 'true');

    // The engraving is laid out — the cursor still tracks and the run is scored
    // the same way — it is simply not shown.
    const svg = page.locator('#score-stage .is-front svg');
    await expect(svg).toHaveCount(1);
    await expect(svg).not.toBeVisible();

    // And the things a blind run is played with are still there.
    await expect(page.locator('.keyboard-strip')).toBeVisible();
    await expect(page.locator('#score-play')).toBeVisible();
    await openScoreMenu(page);
    await expect(page.getByRole('button', { name: 'Show the score' })).toBeVisible();

    // And the header says why the screen is empty. "Show the score" moved into
    // the ... sheet with the rest of the settings, so without this a blind run
    // is a black rectangle that looks broken rather than deliberate — which is
    // what the tour photographed.
    await expect(page.locator('#score-status')).toContainText('Blind');
    // On one line each, both of them: at 360 px the title and the message were
    // shrinking in proportion and neither could be read.
    const fits = await page.evaluate(() => {
      const el = (id: string) => document.getElementById(id)!;
      const back = el('score-back').getBoundingClientRect();
      const status = el('score-status');
      return {
        backHeight: Math.round(back.height),
        statusCut: status.scrollWidth - status.clientWidth,
      };
    });
    expect(fits.backHeight, 'Back wrapped onto two lines').toBeLessThan(44);
    expect(fits.statusCut, 'the message is cut off').toBeLessThanOrEqual(1);
  });

  test('showing the score again brings the notation back', async ({ page }) => {
    await page.goto('/#/score/song.folk.hot-cross-buns?blind=1');
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
    await openScoreMenu(page);
    await page.getByRole('button', { name: 'Show the score' }).click();
    await expect(page.locator('#score-stage .is-front svg')).toBeVisible({ timeout: 60_000 });
  });
});

/**
 * Leaving the page mid-run (decision 9, P21 §C).
 *
 * Playwright cannot minimise a window, but `visibilitychange` is what the app
 * listens to and the browser will dispatch a forged one — the assertion is
 * about the screen's reaction, not about Chromium's compositor.
 */
test.describe('a run interrupted by something else on the phone', () => {
  async function hide(page: Page, hidden: boolean): Promise<void> {
    await page.evaluate((value) => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => (value ? 'hidden' : 'visible'),
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  }

  test('Tempo pauses when the page is hidden and says how long you were away', async ({
    page,
  }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    await expect(page.locator('#score-play')).toHaveText('⏸');

    await hide(page, true);
    // Paused, not stopped: the run is still there to come back to.
    await expect(page.locator('#score-play')).toHaveText('▶');
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-running',
      'true',
    );

    await page.waitForTimeout(1_200);
    await hide(page, false);
    await expect(page.locator('#score-status')).toContainText('you were away');
    await expect(page.locator('#score-status')).toContainText('to carry on');

    // And ▶ picks the run up rather than starting a new one.
    await page.locator('#score-play').click();
    await expect(page.locator('#score-play')).toHaveText('⏸');
  });

  test('Wait mode is left alone — it has no timetable to lose', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();
    await expect(page.locator('#score-play')).toHaveText('⏸');

    await hide(page, true);
    await hide(page, false);
    await expect(page.locator('#score-play')).toHaveText('⏸');
    await expect(page.locator('#score-status')).not.toContainText('you were away');
  });
});
