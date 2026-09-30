// The Score screen (docs/04-ui-spec.md §5).
//
// One test per control, plus a scripted run in each judged mode that ends on
// the summary sheet. The screen is opened on a real catalog item from the
// built content, so this also proves the id -> catalog -> file -> renderer
// path the Library will use.

import { expect, test, type Page } from '@playwright/test';

import { installMidiMock } from './fixtures/midiMock';
import {
  closeScoreMenu,
  inkBox,
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
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
    { timeout: 60_000 },
  );
  // Deliberately no tap on the stage here: a tap *toggles* the control bar
  // (docs/04 §5), and a hidden bar is `pointer-events: none`, so every
  // subsequent control click would land on the score instead.
  await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'true');
}

/**
 * Counts every note and key that takes a verdict colour from here on (L42):
 * a MutationObserver on the class attribute, installed before the run starts,
 * so a red that came and went during the run is counted, not only one that
 * stayed. `movedTo` counts the notes the cursor marked current: a
 * clock-driven run moves through them whether or not anything is judging it.
 */
async function watchVerdicts(page: Page): Promise<void> {
  await page.evaluate(() => {
    const notes = new Set<Element>();
    const keys = new Set<Element>();
    const current = new Set<Element>();
    const w = window as unknown as { __verdicts: () => { notes: number; keys: number; movedTo: number } };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const element = record.target;
        if (!(element instanceof Element)) continue;
        const onStage = element.closest('#score-stage') !== null;
        if (onStage && element.classList.contains('is-current')) current.add(element);
        if (!element.classList.contains('is-wrong')) continue;
        if (element.closest('.keyboard-strip, .key-ribbon') !== null) keys.add(element);
        else if (onStage) notes.add(element);
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    w.__verdicts = () => ({ notes: notes.size, keys: keys.size, movedTo: current.size });
  });
}

async function readVerdicts(page: Page): Promise<{ notes: number; keys: number; movedTo: number }> {
  return page.evaluate(() =>
    (window as unknown as { __verdicts: () => { notes: number; keys: number; movedTo: number } }).__verdicts(),
  );
}

test.describe('score screen', () => {
  test.setTimeout(120_000);

  test('opens a catalog item by id and renders it', async ({ page }) => {
    await openScore(page);
    await expect(page.locator('#score-title')).toContainText('Hot Cross Buns');
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible();
  });

  test('an unknown id says so instead of hanging', async ({ page }) => {
    await page.goto('/#/score/song.not.a.real.item');
    await expect(page.locator('#score-status')).toContainText('Unknown item');
    // And takes the transport away with it. A row of live buttons over a stage
    // with no score on it is noise (`08` §3.1), and pressing play there starts
    // a run with no notes to follow.
    await expect(page.locator('#score-bar')).toBeHidden();
  });

  test('a score whose file will not load says why, and takes the transport away', async ({
    page,
  }) => {
    // The branches that end in a sentence — unknown item, a PDF, no notation,
    // no notes — each hid the bar. A *thrown* load, which is what a fetch that
    // fails or a file that will not parse looks like, did not: the controls
    // stayed live over a stage that never got a score.
    //
    // Only the notation is refused, not the catalog under it: with the catalog
    // gone this would take the "Unknown item" branch instead, which was never
    // the broken one. And `openScore` is no use here — it waits for a drawn
    // SVG, and the whole point is that there will not be one.
    await page.route('**/*.mxl', (route) => route.fulfill({ status: 404, body: 'gone' }));
    await page.route('**/*.musicxml', (route) => route.fulfill({ status: 404, body: 'gone' }));
    await page.goto(`/#/score/${ITEM}`);
    await expect(page.locator('section[data-screen="score"]')).toBeVisible();
    await expect(page.locator('#score-status')).toContainText('Could not open this score');
    // The sentence carries the reason, not a stringified Error object.
    await expect(page.locator('#score-status')).not.toContainText('Error:');
    await expect(page.locator('#score-bar')).toBeHidden();
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
    //
    // Whether or not the music reaches its row. This used to fold only when
    // the music did, and skip the assertion otherwise — which left the test
    // asserting the *opposite* of decision 5 whenever the sheet stopped short
    // of the bar, and the read-ahead cap (`readAheadScale`) made that the
    // ordinary case for this piece sideways. Decision 5 is "just always fade
    // it", and the test after this one is its other half.
    await page.locator('#score-play').click();
    await expect(bar).toHaveAttribute('data-visible', 'false', { timeout: HIDE_MS + 8_000 });
    // §9.34: one tap on the sheet brings it back, always.
    await page.locator('#score-stage').click({ position: { x: 5, y: 5 } });
    await expect(bar).toHaveAttribute('data-visible', 'true');
  });

  test('the ⋯ sheet fits sideways without scrolling (08 §7.2)', async ({ page }) => {
    await page.setViewportSize({ width: 780, height: 360 });
    await openScore(page);
    // **Revised 2026-09-25**: read the sheet once the window's count is settled.
    // The count is chosen again when the piece's measurement lands (T38), and at
    // this stage that yields — the row then says why in words, its longest
    // label. Read before it landed, this passed here, where the measurement is
    // usually late, and failed on CI, where it was not: the same sheet, two
    // moments. The sheet is judged at its fullest state, the one a learner
    // opening it a second later sees.
    // **Revised again by T41 (class: revise):** `data-measured` plus a fixed
    // 500 ms became a wait on `data-settled`, the state the renderer sets once
    // the re-plan the measurement causes is done; the old assumption was that
    // half a second after the attribute is always enough.
    await page.waitForSelector('.score-view[data-settled]', { timeout: 60_000 });
    await openScoreMenu(page);
    const fits = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>('#score-more-sheet .sheet__panel');
      const body = document.querySelector<HTMLElement>('#score-more-sheet .sheet__body');
      return {
        panel: panel ? [panel.scrollHeight, panel.clientHeight] : null,
        body: body ? [body.scrollHeight, body.clientHeight] : null,
      };
    });
    for (const [name, pair] of Object.entries(fits)) {
      expect(pair, `no ${name}`).not.toBeNull();
      if (pair) expect(pair[0], `${name} scrolls: ${String(pair[0])} in ${String(pair[1])}`).toBeLessThanOrEqual(pair[1] + 1);
    }
  });

  /**
   * **Reversed deliberately.** This used to assert the opposite: that upright,
   * where the sheet stops short of the bar, the bar *stays* because it is
   * covering nothing. The owner's instruction after looking at it on the phone
   * was "just always fade it" — judging from inside the app whether the bar was
   * covering anything kept getting the answer wrong, and a rule whose exception
   * nobody can predict is worse than a rule.
   *
   * So the premise is kept and the conclusion is flipped: the sheet still does
   * not reach the bar upright, and the bar goes anyway. What makes that safe is
   * §9.34 — one tap on the sheet brings it back, always — and that is asserted
   * here rather than left to the reader.
   */
  test('and goes anyway, even when it is covering nothing (decision 5)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openScore(page);
    const bar = page.locator('#score-bar');
    await page.locator('#score-play').click();
    await page.waitForTimeout(HIDE_MS + 2_000);
    // The premise, unchanged: upright the sheet stops short of the bar.
    const stageBottom = await page.evaluate(
      () => document.querySelector('#score-stage')!.getBoundingClientRect().bottom,
    );
    const room = Math.round(stageBottom - (await inkBox(page)).bottom);
    expect(room, 'the sheet fills the stage upright too — check the premise').toBeGreaterThan(24);
    // And it fades regardless.
    await expect(bar).toHaveAttribute('data-visible', 'false');
    // One tap, and it is back. That is what pays for the rule having no
    // exceptions.
    await page.locator('#score-stage').click({ position: { x: 5, y: 5 } });
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
      // Clamped at the bottom, not wrapped — and it says so now rather than
      // absorbing the press. A lit button that does nothing reads as a broken
      // control, and pressing it used to restart the run into the bargain, so
      // the end of the range is a dead button. See `score.stepper-limits`.
      await expect(page.locator('#score-bars-down')).toBeDisabled();
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
    // ＋ grows the sheet and － shrinks it back: the buttons are monotonic
    // (`08` §9.3) — a press of "bigger" never yields a smaller sheet.
    //
    // Measured as drawn ink, not as the buffer's CSS scale. The drawn size is
    // the engraving zoom *times* that scale, so raising the engraving zoom
    // lowers the CSS transform while the sheet on the glass gets bigger: the
    // number this used to read is not monotonic and was never meant to be. It
    // passed because the re-engrave usually landed after the assertion, and
    // under four workers it lands before — 0.656 where the first reading was
    // 0.991, reported as "bigger made it smaller".
    //
    // `08` §9.3 is about what the owner sees, and what the owner sees is ink.
    const settledInk = async (): Promise<number> => {
      await page.evaluate(() => {
        const holder = window as unknown as { __inkW?: number | null; __inkN?: number };
        holder.__inkW = null;
        holder.__inkN = 0;
      });
      await page.waitForFunction(
        () => {
          let left = Infinity;
          let right = -Infinity;
          for (const el of document.querySelectorAll('#score-stage .is-front svg *')) {
            const box = el.getBoundingClientRect();
            if (box.width === 0 && box.height === 0) continue;
            left = Math.min(left, box.left);
            right = Math.max(right, box.right);
          }
          const width = Math.round((right - left) * 10) / 10;
          const holder = window as unknown as { __inkW?: number | null; __inkN?: number };
          if (holder.__inkW === width) holder.__inkN = (holder.__inkN ?? 0) + 1;
          else {
            holder.__inkW = width;
            holder.__inkN = 0;
          }
          return Number.isFinite(width) && (holder.__inkN ?? 0) >= 4;
        },
        null,
        { timeout: 30_000, polling: 100 },
      );
      return (await inkBox(page)).width;
    };

    // T34: Size multiplies the fit, and over 100 % the window drops bars to
    // draw the rest bigger — so the ink can get *narrower* while every note
    // grows. "Bigger" is the staff's height, not the ink's width — and the
    // staff is its five lines (T38, `08` §9), the thin strokes each
    // `.vf-measure` draws, not the `.staffline` group, which carries the notes.
    const staffNow = (): Promise<number> =>
      page.evaluate(() => {
        let h = Number.POSITIVE_INFINITY;
        for (const measure of document.querySelectorAll('#score-stage .is-front .vf-measure')) {
          const ys: number[] = [];
          for (const line of measure.querySelectorAll(':scope > path')) {
            const box = line.getBoundingClientRect();
            if (box.height <= 1.5 && box.width >= 10) ys.push(box.top + box.height / 2);
          }
          if (ys.length >= 5) h = Math.min(h, Math.max(...ys) - Math.min(...ys));
        }
        return h;
      });
    const before = await settledInk();
    const staffBefore = await staffNow();
    await page.locator('#score-zoom-in').click();
    await settledInk();
    expect(await staffNow()).toBeGreaterThan(staffBefore);
    await page.locator('#score-zoom-out').click();
    expect(await settledInk()).toBeCloseTo(before, 0);

    await expect(page.locator('#score-strip')).toBeVisible();
    await page.locator('#score-keys-off').click();
    await expect(page.locator('#score-strip')).toBeHidden();

    await expect(page.locator('#score-destination')).toContainText('Phone');
    await page.locator('#score-destination').click();
    await expect(page.locator('#score-destination')).toContainText('Piano');
    await page.locator('#score-destination').click();
    await expect(page.locator('#score-destination')).toContainText('Both');
    await closeScoreMenu(page);
  });

  test('Size steps are monotone, and a setting draws one size whichever way it was reached', async ({ page }) => {
    // T38, fault A (`docs/prompts/traces/2026-09-25-window-reds.md`, R2). Over
    // 100 % the window yields bars to grow, and the size it grows to was priced
    // from a running maximum of row ink over bars, clef and time signature
    // included, that only a change of engraving zoom released: at this
    // viewport 110 % drew one bar *smaller* than the two at 100 %, and 110 %
    // reached from 120 % drew smaller again. The staff is the five lines
    // (`08` §9, "staff"), read from the glass: the thin horizontal strokes each
    // `.vf-measure` draws, which are the stave's own lines and nothing else.
    await openScore(page);
    const fiveLines = (): Promise<number> =>
      page.evaluate(() => {
        let shortest = Number.POSITIVE_INFINITY;
        for (const measure of document.querySelectorAll('#score-stage .score-buffer.is-front .vf-measure')) {
          const ys: number[] = [];
          for (const line of measure.querySelectorAll(':scope > path')) {
            const box = line.getBoundingClientRect();
            if (box.height <= 1.5 && box.width >= 10) ys.push(box.top + box.height / 2);
          }
          if (ys.length >= 5) shortest = Math.min(shortest, Math.max(...ys) - Math.min(...ys));
        }
        return shortest;
      });
    // The fit settles over a few frames; read once the drawn size has held.
    const settled = async (): Promise<number> => {
      let last = -1;
      let same = 0;
      for (let i = 0; i < 60 && same < 4; i += 1) {
        await page.waitForTimeout(150);
        const now = Math.round((await fiveLines()) * 100) / 100;
        same = now === last ? same + 1 : 0;
        last = now;
      }
      return last;
    };
    const press = async (which: 'in' | 'out'): Promise<number> => {
      await withScoreMenu(page, async () => {
        await page.locator(`#score-zoom-${which}`).click();
      });
      return settled();
    };
    const at100 = await settled();
    const at110 = await press('in');
    const at120 = await press('in');
    const back110 = await press('out');
    const back100 = await press('out');
    const said = `100 % ${String(at100)}, 110 % ${String(at110)}, 120 % ${String(at120)}, back to 110 % ${String(back110)}, back to 100 % ${String(back100)}`;
    expect(at110, `Size + drew a smaller staff: ${said}`).toBeGreaterThan(at100);
    expect(at120, `a second Size + drew a smaller staff: ${said}`).toBeGreaterThanOrEqual(at110);
    // One setting, one size: the same stage and the same setting reached from
    // above or from below. Within a hundredth, which is rounding, not a size.
    expect(Math.abs(back110 - at110) / at110, `110 % drew two sizes: ${said}`).toBeLessThan(0.01);
    expect(Math.abs(back100 - at100) / at100, `100 % drew two sizes: ${said}`).toBeLessThan(0.01);
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
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  });

  test('play, pause and restart', async ({ page }) => {
    await openScore(page);
    const play = page.locator('#score-play');
    await play.click();
    await expect(play).toHaveText('⏸');
    await play.click();
    await expect(play).toHaveText('▶');
    // `Start again` moved into the ⋯ sheet when `Hear it` took its place on
    // the bar (P21c B1): eight controls came to 444 px of a 390 px row.
    await withScoreMenu(page, async () => {
      await page.locator('#score-restart').click();
    });
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  });

  test('Hear it plays the piece without moving the mode select (B1)', async ({ page }) => {
    await openScore(page);
    const modeSelect = page.locator('#score-mode');
    await modeSelect.selectOption('wait');

    await page.locator('#score-hear').click();
    const screen = page.locator('section[data-screen="score"]');
    await expect(screen).toHaveAttribute('data-running', 'true');
    // It is a Listen run — both hands, nothing judged — but the control that
    // says which mode you are practising in has not moved.
    await expect(screen).toHaveAttribute('data-hearing', 'true');
    await expect(screen).toHaveAttribute('data-mode', 'wait');
    await expect(modeSelect).toHaveValue('wait');
    // And the button says what a second tap will do.
    await expect(page.locator('#score-hear')).toHaveText('Stop');

    // A second tap stops it, and leaves the mode where it was.
    await page.locator('#score-hear').click();
    await expect(screen).toHaveAttribute('data-running', 'false');
    await expect(screen).toHaveAttribute('data-hearing', 'false');
    await expect(page.locator('#score-hear')).toHaveText('Hear it');
    await expect(modeSelect).toHaveValue('wait');
  });

  for (const [chosen, played] of [
    ['R', 'left'],
    ['L', 'right'],
  ] as const) {
    test(`says once that the app is playing the ${played} hand (B3)`, async ({ page }) => {
      // `playbackHands` defaults to `non-focused`, so choosing R means the app
      // plays the left hand under you. With no piano connected and the phone on
      // a stand, a sound arriving from nowhere reads as a fault rather than help.
      //
      // One run per case, on its own page: pressing Play a second time pauses
      // the run rather than starting another, and by then the bar has hidden
      // itself and is not clickable at all.
      // A piece with both hands: on a right-hand-only piece there is no left
      // hand to play for you, and nothing is said (08 §6.3); and `L` on it
      // is refused outright, having nothing to wait for (08 §8.2).
      await openScore(page, 'song.folk.twinkle.ht');
      await page.locator(`#score-hands-${chosen}`).click();
      await page.locator('#score-play').click();
      await expect(page.locator('#score-status')).toHaveText(
        `Playing the ${played} hand for you`,
      );
    });
  }

  test('and says nothing when there is no other hand to play (B3)', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-hands-both').click();
    await page.locator('#score-play').click();
    await expect(page.locator('#score-status')).not.toHaveText(/Playing the/);
  });
  test('pressing Play during a Hear it run gives you your own mode back', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-hear').click();
    const screen = page.locator('section[data-screen="score"]');
    await expect(screen).toHaveAttribute('data-hearing', 'true');
    await page.locator('#score-play').click();
    // The demonstration ends and the run you chose starts.
    await expect(screen).toHaveAttribute('data-hearing', 'false');
    await expect(screen).toHaveAttribute('data-mode', 'tempo');
    await expect(page.locator('#score-mode')).toHaveValue('tempo');
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

  test('a Keep tempo run nothing listened to says it was not measured, and asks how it went', async ({
    page,
  }) => {
    // Revised 2026-09-25 (T40). This was "a Tempo-mode run reaches the summary
    // sheet with its numbers" and read *Accuracy*, *Tempo* and *Loop the weak
    // bars* off the sheet of a run no input was listening to — which is every
    // run on a phone with no piano connected. The numbers were *Accuracy 0%*,
    // *Missed 17* and *Weakest bars 1, 2, 3*: a measurement nobody took. The
    // reviewer's rule: no input, no accuracy.
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await page.locator('#score-play').click();
    const sheet = page.locator('#score-summary');
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    await expect(sheet.locator('h2')).toHaveText('Not measured');
    await expect(sheet.locator('#summary-note')).toContainText('heard no notes');
    for (const stat of ['accuracy', 'tempo', 'missed', 'weakest-bars']) {
      await expect(sheet.locator(`[data-stat="${stat}"]`), `${stat} on a run nothing heard`).toHaveCount(0);
    }
    // Part G's question for a run without an instrument is the one thing
    // offered in their place.
    await expect(page.locator('#summary-selfreport')).toBeVisible();
    for (const id of ['again', 'slower', 'faster', 'done']) {
      await expect(page.locator(`#summary-${id}`)).toBeVisible();
    }
    await expect(page.locator('#summary-loop'), 'weak bars nobody listened for').toHaveCount(0);

    // Left unanswered, nothing goes on the record.
    await page.locator('#summary-done').click();
    await page.waitForTimeout(1_000);
    const sessions = await page.evaluate(async () => {
      const hooks = (window as unknown as {
        __pianopath: { exportAll: () => Promise<{ stores: Record<string, unknown[]> }> };
      }).__pianopath;
      return (await hooks.exportAll()).stores.sessions;
    });
    expect(sessions, 'a run nothing heard went on the record unanswered').toHaveLength(0);
  });

  /**
   * L42 (C3 item 0). Behind T40's *Not measured* sheet every note had been
   * painted red as missed, and each key flashed red as the clock passed it,
   * during a Keep tempo run nothing was listening to: the engine closed every
   * window as a miss whatever was judging, and the session painted each one.
   * `05` §3: without any input source Tempo mode simply plays and moves.
   * Every verdict class a note or a key takes during the run is counted by an
   * observer installed before ▶, and the page is read again once the sheet is
   * up, so a red that came and went is caught as well as one that stayed.
   */
  test('a Keep tempo run nothing listened to marks no note and flashes no key (L42)', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await watchVerdicts(page);
    await page.locator('#score-play').click();
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#score-summary h2')).toHaveText('Not measured');
    const seen = await readVerdicts(page);
    expect(seen.notes, 'notes painted as missed during a run nothing listened to').toBe(0);
    expect(seen.keys, 'keys flashed as missed during a run nothing listened to').toBe(0);
    expect(seen.movedTo, 'the cursor did not move: the clock is still meant to drive it').toBeGreaterThan(1);
    await expect(page.locator('#score-stage .is-wrong'), 'a note left red behind the sheet').toHaveCount(0);
    await expect(page.locator('#score-stage .is-correct')).toHaveCount(0);
  });

  test('Hear it marks no note while it plays the piece (L42)', async ({ page }) => {
    // The same mechanism on the demonstration: a Listen run judged nothing
    // on its input path and closed every window as a miss on its clock.
    await openScore(page);
    await setTempoPercent(page, 130);
    await watchVerdicts(page);
    const screen = page.locator('section[data-screen="score"]');
    await page.locator('#score-hear').click();
    await expect(screen).toHaveAttribute('data-hearing', 'true');
    await expect(screen).toHaveAttribute('data-hearing', 'false', { timeout: 60_000 });
    const seen = await readVerdicts(page);
    expect(seen.notes, 'notes painted as missed while the app played them').toBe(0);
    expect(seen.keys, 'keys flashed as missed while the app played them').toBe(0);
    await expect(page.locator('#score-stage .is-wrong')).toHaveCount(0);
  });

  test('the summary puts the screen behind it out of reach', async ({ page }) => {
    // Covering a control is not disabling it. The bar, the header and the
    // strip sit under the sheet and stayed clickable and focusable through it
    // — the same fault as the folded bar, where a tap landed on something the
    // owner could not see. The geometric sweep reports it as the summary's
    // buttons overlapping the bar's on 59 cells.
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await page.locator('#score-play').click();
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });

    for (const id of ['score-bar', 'score-head', 'score-strip']) {
      const behind = page.locator(`#${id}`);
      if ((await behind.count()) === 0) continue;
      await expect(behind, `${id} is still reachable under the summary`).toHaveAttribute('inert', '');
    }
    // And the sheet's own controls are not: it would be a poor trade.
    await expect(page.locator('#summary-done')).toBeEnabled();

    // Leaving the summary gives the screen back, or the next run is unusable.
    await page.locator('#summary-again').click();
    await expect(page.locator('#score-bar')).not.toHaveAttribute('inert', '');
  });

  test('the summary self-report records an answer', async ({ page }) => {
    // Revised 2026-09-25 (T37). This asserted that the status line said
    // "Clean", and it did — `Recorded: Clean` — while nothing was stored: the
    // run had been written before the question was drawn and the answer went
    // nowhere. What a learner is told was recorded is read back from the
    // store now, the way the Progress screen reads it.
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await page.locator('#score-play').click();
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 60_000 });
    await page.locator('#summary-self-clean').click();
    await expect(page.locator('#score-status')).toHaveText('Recorded: Clean — a pass, in your own judgement.', {
      timeout: 30_000,
    });
    const sessions = await page.evaluate(async () => {
      const hooks = (window as unknown as {
        __pianopath: { exportAll: () => Promise<{ stores: Record<string, unknown[]> }> };
      }).__pianopath;
      return (await hooks.exportAll()).stores.sessions as { itemId: string; selfReport?: string; tempoMeasured?: boolean }[];
    });
    const last = sessions[sessions.length - 1];
    expect(last?.selfReport, 'the answer the sheet says it recorded is not on the session row').toBe('clean');
    // Nothing was listening, so the run is not evidence of a tempo either.
    expect(last?.tempoMeasured).toBe(false);
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
    // The ink against the stage, not the SVG element against it: the element
    // is the page, which is taller than the music and wider than the stage,
    // so it would report a full screen while the notation was small.
    await expect
      .poll(
        async () => {
          const stage = await page.evaluate(
            () => document.querySelector('#score-stage')?.getBoundingClientRect().height ?? 0,
          );
          if (stage === 0) return 0;
          return Math.round(((await inkBox(page)).height / stage) * 100);
        },
        { timeout: 30_000, message: 'the sheet never grew' },
      )
      .toBeGreaterThan(55);

    // And no note is off the side. The *page* deliberately overhangs now —
    // the fit grows the sheet until the ink fills the width, and the ink is
    // 61% of the page sideways — so this asks about the ink.
    const stageBox = await page.evaluate(() => {
      const box = document.querySelector('#score-stage')!.getBoundingClientRect();
      return { left: box.left, right: box.right };
    });
    const ink = await inkBox(page);
    expect(ink.left, 'notation off the left of the screen').toBeGreaterThanOrEqual(stageBox.left - 2);
    expect(ink.right, 'notation off the right of the screen').toBeLessThanOrEqual(stageBox.right + 2);
  });

  test('the zoom buttons still do something, now that the fit does the work', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openScore(page, 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx');
    // The ink: a smaller engraving can sit on a differently shaped page, so
    // One drawn bar's own height: that is what "Size" means, and it is the
    // only measure that survives the engraver. The ink box does not — a
    // smaller zoom re-lays the window out, and a differently shaped page can
    // leave the ink *taller* while every note on it is smaller.
    const height = async (): Promise<number> =>
      page.evaluate(
        () =>
          document.querySelector('#score-stage .is-front svg .vf-measure')?.getBoundingClientRect()
            .height ?? 0,
      );
    // A stave, not the whole sheet: 40 px is "the fit has run and drawn
    // something at a readable size", not "the sheet is 300 px tall".
    await expect.poll(height, { timeout: 30_000 }).toBeGreaterThan(40);
    // **Revised 2026-09-25 (test class: revise).** The fit is read once the
    // piece's measurement has landed, not at the first readable draw. The
    // first draw is a transitional fit that the settled one replaces, larger,
    // when the measurement arrives (T38); on CI that first state lasted long
    // enough to be read as "fitted", and a Size step from the settled state
    // then read *larger* than it (90 against a 60 that was never the fit).
    // Here the measurement is fast and the two reads agreed. Whether a
    // learner sees that transitional draw grow is the matrix's U42.
    // **Revised again by T41 (class: revise):** it waited on `data-measured`
    // and then 500 ms more, because the attribute is set before the fit it
    // causes and outlives a change of engraving zoom; the old assumption was
    // that half a second covers the difference. It waits on the state that
    // says the fit is done instead.
    await page.waitForSelector('.score-view[data-settled]', { timeout: 60_000 });
    const fitted = await height();
    // Zoom is a multiplier on the fitted size now. It used to be the absolute
    // OSMD zoom, which a fit would simply cancel out.
    await withScoreMenu(page, async () => {
      await page.locator('#score-zoom-out').click();
    });
    await expect.poll(height, { timeout: 15_000 }).toBeLessThan(fitted - 5);
  });
});

/**
 * The fit says when it is done (T41, `08` §9.39).
 *
 * `data-measured` was the only signal, and it is not this one: it is set when
 * the probe measures, and nothing takes it back when the engraving search then
 * moves the zoom. On the committed code, with the Scherzo's stage 60 px
 * shorter, it named zoom 1.27 for half a second while the sheet was engraved
 * at 0.97, and the stave read "right after `data-measured`" was 85 px against
 * the 67 it settled at. So tests padded it with fixed waits. `data-settled` is
 * set where the fit completes, and only while nothing is queued behind it.
 */
test.describe('the fit says when it has settled (T41)', () => {
  test('a stage that loses height is unsettled until the fit at the new engraving has landed', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 780, height: 360 });
    // Every frame's state, recorded by the page itself, so a claim made for a
    // single frame and taken back in the next is on the record.
    await page.addInitScript(() => {
      const log: unknown[] = [];
      (window as unknown as { __fitLog: unknown[] }).__fitLog = log;
      const tick = (): void => {
        const stage = document.querySelector<HTMLElement>('#score-stage');
        const hooks = (window as unknown as { __pianopath?: { scoreFit?: () => { zoom?: number } | null } })
          .__pianopath;
        const fit = hooks?.scoreFit?.();
        const front = stage?.querySelector<HTMLElement>('.score-buffer.is-front');
        const bar = front?.querySelector('svg .vf-measure');
        if (stage && front && typeof fit?.zoom === 'number') {
          log.push({
            settled: stage.dataset.settled !== undefined,
            measured: stage.dataset.measured ?? null,
            zoom: String(fit.zoom),
            stage: Math.round(stage.getBoundingClientRect().height),
            shape: `${String(bar ? Math.round(bar.getBoundingClientRect().height) : 0)}|${front.style.transform}`,
          });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    type Frame = { settled: boolean; measured: string | null; zoom: string; stage: number; shape: string };
    const frames = (from = 0): Promise<Frame[]> =>
      page.evaluate((n) => (window as unknown as { __fitLog: Frame[] }).__fitLog.slice(n), from);

    await openScore(page, 'song.classical.chopin-scherzo-2.nifc');
    await page.waitForSelector('.score-view[data-settled]', { timeout: 60_000 });
    const opened = (await frames()).at(-1);
    const from = (await frames()).length;

    await page.setViewportSize({ width: 780, height: 300 });
    // Taken once the page has drawn the new stage and says it is settled again.
    await expect
      .poll(
        async () => {
          const after = await frames(from);
          const last = after.at(-1);
          return last !== undefined && last.settled && opened !== undefined && last.stage < opened.stage;
        },
        { timeout: 60_000, message: 'the stage never settled at its new height' },
      )
      .toBe(true);
    const after = await frames(from);
    const final = after.at(-1);
    // From the frame the renderer reacted: before it, the page has a new box
    // and has not yet been told (the resize observer runs after the frame's
    // callbacks), so its last word is still about the old stage.
    const reacted = after.findIndex((f) => !f.settled);
    expect(reacted, 'the new height did not unsettle the fit, so this walk proves nothing').toBeGreaterThanOrEqual(0);
    for (const frame of await frames()) {
      if (frame.settled) {
        expect(frame.measured, 'settled while the measurement was of another engraving').toBe(frame.zoom);
      }
    }
    for (const frame of after.slice(reacted).filter((f) => f.settled)) {
      expect(frame.shape, 'settled on a shape that then changed').toBe(final?.shape);
    }
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

    // Tempo mode drives from the clock, so no note is ever named as waited
    // for. Since T8 a Tempo run can hold for the learner's *first* note, and
    // this line then says so — but it never names a note.
    await page.locator('#score-mode').selectOption('tempo');
    await expect(page.locator('#score-waiting')).not.toContainText('Waiting for');
  });

  test('in a flat key it names the flats the score writes (T41)', async ({ page }) => {
    // The line spelled every black key from a table of sharps, so the Minuet
    // in F told the learner to wait for A♯3 and D♯5 over a page printing B♭3
    // and E♭5 — the key is the same, the note is not, and a learner told a
    // name the page does not show has been taught something wrong.
    test.setTimeout(120_000);
    const midi = await installMidiMock(page, { permission: 'granted' });
    await page.goto('/#/settings');
    await page.locator('#set-notenames').click();
    await openScore(page, 'song.classical.bach-menuet-bwv-anh-113.pdmx');
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();

    type Run = { step: number; expected: number[] } | null;
    const run = (): Promise<Run> =>
      page.evaluate(
        () => (window as unknown as { __pianopath: { scoreRun: () => Run } }).__pianopath.scoreRun(),
      );
    await expect.poll(async () => (await run())?.step, { timeout: 30_000 }).toBe(0);
    // Played forward from the piano, a step at a time, until the run asks for
    // bar 3's first beat: B♭3 in the left hand under D5 in the right.
    for (let i = 0; i < 40; i += 1) {
      const now = await run();
      if (!now || now.expected.includes(58)) break;
      for (const n of now.expected) await midi.noteOn(n, 80);
      for (const n of now.expected) await midi.noteOff(n);
      await expect.poll(async () => (await run())?.step, { timeout: 10_000 }).toBeGreaterThan(now.step);
    }
    const waiting = page.locator('#score-waiting');
    await expect(waiting).toHaveText('Waiting for B♭3 + D5');
    // And the next note, the E♭5 the score prints with its own flat.
    for (const n of [58, 74]) await midi.noteOn(n, 80);
    for (const n of [58, 74]) await midi.noteOff(n);
    await expect(waiting).toHaveText('Waiting for E♭5');
    await expect(waiting).not.toContainText('♯');
  });

  test('the ribbon names the flats the score writes too (C1, U44)', async ({ page }) => {
    // T41's follow-up, P0: with the keys as a ribbon, the wanted key's cell
    // carries its name, and that name came from a table of sharps — the same
    // fault T41 fixed on the status line, on the other line a learner reads.
    test.setTimeout(120_000);
    const midi = await installMidiMock(page, { permission: 'granted' });
    await page.goto('/#/settings');
    await page.locator('#set-keys').selectOption('ribbon');
    await openScore(page, 'song.classical.bach-menuet-bwv-anh-113.pdmx');
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();

    type Run = { step: number; expected: number[] } | null;
    const run = (): Promise<Run> =>
      page.evaluate(
        () => (window as unknown as { __pianopath: { scoreRun: () => Run } }).__pianopath.scoreRun(),
      );
    await expect.poll(async () => (await run())?.step, { timeout: 30_000 }).toBe(0);
    for (let i = 0; i < 40; i += 1) {
      const now = await run();
      if (!now || now.expected.includes(58)) break;
      for (const n of now.expected) await midi.noteOn(n, 80);
      for (const n of now.expected) await midi.noteOff(n);
      await expect.poll(async () => (await run())?.step, { timeout: 10_000 }).toBeGreaterThan(now.step);
    }
    const cell = (key: number) => page.locator(`.key-ribbon .rib[data-midi="${String(key)}"]`);
    await expect(cell(58)).toHaveClass(/is-expected/);
    await expect(cell(58), 'the ribbon named B♭3 as A♯3').toHaveAttribute('data-note', /^B♭3/);
    for (const n of [58, 74]) await midi.noteOn(n, 80);
    for (const n of [58, 74]) await midi.noteOff(n);
    await expect(cell(75)).toHaveClass(/is-expected/, { timeout: 10_000 });
    await expect(cell(75), 'the ribbon named E♭5 as D♯5').toHaveAttribute('data-note', /^E♭5/);
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
    //
    // One `.is-front` per slot, so upright there are two of them (P21c A1).
    // What matters here has never been how many there are, only that the
    // engraving exists and that none of it is on the screen.
    const svg = page.locator('#score-stage .is-front svg');
    // Waited for, not read: `expect(await count())` is one shot, and under a
    // loaded machine this ran while the screen still said "Loading…".
    await expect(svg.first()).toBeAttached({ timeout: 60_000 });
    for (const one of await svg.all()) await expect(one).not.toBeVisible();

    // And the things a blind run is played with are still there.
    await expect(page.locator('.keyboard-strip')).toBeVisible();
    await expect(page.locator('#score-play')).toBeVisible();
    await openScoreMenu(page);
    await expect(page.locator('#score-blind')).toHaveText('On');

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
    await page.locator('#score-blind').click();
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
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
    // On the state line, not `#score-status` (T31): being paused is a thing
    // the run is doing, and `04` 5f puts what the run is doing in one place.
    // It used to be said on `#score-status` while the state line beside it
    // went on holding the mode's standing sentence.
    await expect(page.locator('#score-waiting')).toContainText('you were away');
    await expect(page.locator('#score-waiting')).toContainText('to carry on');

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
    await expect(page.locator('#score-waiting')).not.toContainText('you were away');
    await expect(page.locator('#score-status')).not.toContainText('you were away');
  });
});

/**
 * Back with one of the screen's own sheets open (G86).
 *
 * The ⋯ and tempo sheets sit on `body`, outside the `main` the app shell
 * empties on a route change, and an open sheet makes every other child of
 * `body` inert. The screen's closers for them were never read, so Back left
 * the sheet over the next screen with that screen out of reach beneath it.
 *
 * The score is reached from the Library, so Back has somewhere to go. What
 * is left behind is read through `page.evaluate`, never by clicking: a click
 * on an inert control retries until the test's own timeout.
 */
test.describe('Back with a sheet open takes the sheet with it (G86)', () => {
  async function scoreFromLibrary(page: Page): Promise<void> {
    await page.goto('/#/library');
    await expect(page.locator('.screen h1')).toHaveText('Library');
    await page.evaluate((id) => {
      window.location.hash = `#/score/${id}`;
    }, ITEM);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
      timeout: 60_000,
    });
    await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'true');
  }

  async function backToTheLibrary(page: Page, sheet: string): Promise<void> {
    await page.goBack();
    await expect(page.locator('.screen h1')).toHaveText('Library');
    await expect(page.locator(`#${sheet}`), 'the sheet left over the Library').toHaveCount(0);
    const inert = await page.evaluate(() =>
      Array.from(document.body.children)
        .filter((node) => node instanceof HTMLElement && node.inert)
        .map((node) => node.id || node.className),
    );
    expect(inert, 'children of body left out of reach').toEqual([]);
  }

  test('the ⋯ sheet', async ({ page }) => {
    await scoreFromLibrary(page);
    await openScoreMenu(page);
    await backToTheLibrary(page, 'score-more-sheet');
  });

  test('the tempo sheet', async ({ page }) => {
    await scoreFromLibrary(page);
    await page.locator('#score-tempo-label').click({ timeout: 5_000 });
    await expect(page.locator('#score-tempo-sheet')).toBeVisible();
    await backToTheLibrary(page, 'score-tempo-sheet');
  });
});

/**
 * ▶ asks the sound to start (U69).
 *
 * A phone suspends the audio context when the screen locks or a call comes
 * in. The engine's first-gesture start is one-shot, so once the visit's first
 * tap has gone nothing on ▶'s path started the context again, and the run
 * went on against a suspended one. Here the page's context is captured by
 * wrapping the constructor before the app loads (no app hook), one ordinary
 * tap spends the first-gesture start, the page suspends the context itself,
 * and ▶ must bring it back to `running`.
 *
 * What this does not exercise: a phone. This Chromium starts and resumes
 * contexts without a gesture (`score.hearIt.spec.ts`'s header), so neither
 * Android's lock-screen suspend nor its rule that only a tap may resume is
 * observed; that is unverified on a device.
 */
test.describe('▶ after the sound was suspended (U69)', () => {
  type Captured = Window & { __contexts?: AudioContext[] };

  test('▶ brings a suspended context back to running, and the run starts', async ({ page }) => {
    await page.addInitScript(() => {
      const Native = window.AudioContext;
      const made: AudioContext[] = [];
      (window as Captured).__contexts = made;
      window.AudioContext = class extends Native {
        constructor(options?: AudioContextOptions) {
          super(options);
          made.push(this);
        }
      };
    });
    await openScore(page);
    const state = (): Promise<string> =>
      page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
    await expect.poll(state, { message: 'the app made its context as the piece loaded' }).not.toBe('none');
    // An ordinary tap on something that is not a control: the one-shot first-gesture start is spent.
    await page.locator('#score-title').click({ timeout: 5_000 });
    await expect.poll(state).toBe('running');
    await page.evaluate(() => (window as Captured).__contexts?.[0]?.suspend());
    await expect.poll(state).toBe('suspended');
    await page.locator('#score-play').click({ timeout: 5_000 });
    await expect.poll(state, { message: 'the context after ▶', timeout: 10_000 }).toBe('running');
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  });

  /**
   * A start that never answers starts nothing, and says so (G86a, the
   * reviewer's ruling on U69). The context's `resume` is stubbed never to
   * answer, as G86's probe did, so ▶'s wait runs to `PLAY_SOUND_WAIT_MS` with
   * the context still suspended. U69 carried on at the bound, silent, with ▶
   * reading ⏸; now no run starts, ▶ reads ▶ and the state line says the sound
   * did not start. With the stub removed the next ▶ asks again, and runs.
   */
  test('a start that never answers: no run, ▶ at rest, the state line says so; the next ▶ runs with the sound', async ({
    page,
  }) => {
    // `STATE_TEXT.soundOff('▶')` in `help.ts`; `help.test.ts` holds it to `04` §5f.
    const sentence = 'Sound did not start — tap ▶ again';
    await page.addInitScript(() => {
      const Native = window.AudioContext;
      const made: AudioContext[] = [];
      (window as Captured).__contexts = made;
      window.AudioContext = class extends Native {
        constructor(options?: AudioContextOptions) {
          super(options);
          made.push(this);
        }
      };
    });
    await openScore(page);
    const state = (): Promise<string> =>
      page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
    await expect.poll(state, { message: 'the app made its context as the piece loaded' }).not.toBe('none');
    await page.locator('#score-title').click({ timeout: 5_000 });
    await expect.poll(state).toBe('running');
    await page.evaluate(async () => {
      const ctx = (window as Captured).__contexts?.[0];
      await ctx?.suspend();
      // An own property over the prototype's: removed below, the real `resume` answers again.
      if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
    });
    await expect.poll(state).toBe('suspended');
    const section = page.locator('section[data-screen="score"]');
    const play = page.locator('#score-play');
    await play.click({ timeout: 5_000 });
    // Past the bound: the sentence is what says the wait is over (polled, no fixed sleep).
    await expect(page.locator('#score-waiting'), 'the state line after the bound').toHaveText(sentence, {
      timeout: 10_000,
    });
    await expect(section, 'a run started against a sound that had not started').not.toHaveAttribute(
      'data-running',
      'true',
    );
    await expect(play).toHaveText('▶');
    await expect(play).toBeEnabled();
    await expect(play).not.toHaveAttribute('aria-busy', 'true');
    await expect(play).toHaveAttribute('data-sound-refused', 'true');
    expect(await state()).toBe('suspended');

    await page.evaluate(() => {
      const ctx = (window as Captured).__contexts?.[0];
      if (ctx) Reflect.deleteProperty(ctx, 'resume');
    });
    await play.click({ timeout: 5_000 });
    await expect.poll(state, { message: 'the context after the second ▶', timeout: 10_000 }).toBe('running');
    await expect(section).toHaveAttribute('data-running', 'true');
    await expect(page.locator('#score-waiting')).not.toHaveText(sentence);
    await expect(play).not.toHaveAttribute('data-sound-refused', 'true');
  });

  /**
   * The summary's *Again*, the tap that follows every judged run, goes through
   * the same gate (U105). It called `startRun` directly, so after a suspend it
   * started a run nobody heard. Now, with the context's `resume` never
   * answering, nothing starts, the summary stays up, and the state line above
   * the sheet names *Again*; with the stub removed the next *Again* runs.
   */
  test('the summary’s Again with a start that never answers: no run, the summary stays, the line above it names Again', async ({
    page,
  }) => {
    // `STATE_TEXT.soundOff('Again')` in `help.ts`: a label ending in *again* takes no second one.
    const sentence = 'Sound did not start — tap Again';
    await page.addInitScript(() => {
      const Native = window.AudioContext;
      const made: AudioContext[] = [];
      (window as Captured).__contexts = made;
      window.AudioContext = class extends Native {
        constructor(options?: AudioContextOptions) {
          super(options);
          made.push(this);
        }
      };
    });
    await openScore(page);
    const state = (): Promise<string> =>
      page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
    await expect.poll(state, { message: 'the app made its context as the piece loaded' }).not.toBe('none');
    await page.locator('#score-title').click({ timeout: 5_000 });
    await expect.poll(state).toBe('running');
    // A run to its end, quickly: Keep tempo at the fastest speed, nothing listening.
    await page.locator('#score-mode').selectOption('tempo');
    await setTempoPercent(page, 130);
    await page.locator('#score-play').click();
    const summary = page.locator('#score-summary');
    await expect(summary).toBeVisible({ timeout: 60_000 });
    await page.evaluate(async () => {
      const ctx = (window as Captured).__contexts?.[0];
      await ctx?.suspend();
      // An own property over the prototype's: removed below, the real `resume` answers again.
      if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
    });
    await expect.poll(state).toBe('suspended');
    const section = page.locator('section[data-screen="score"]');
    const again = page.locator('#summary-again');
    const line = page.locator('#score-waiting');
    await again.click({ timeout: 5_000 });
    // Past the bound: the sentence is what says the wait is over (polled, no fixed sleep).
    await expect(line, 'the state line after the bound').toHaveText(sentence, { timeout: 10_000 });
    await expect(section, 'a run started against a sound that had not started').not.toHaveAttribute(
      'data-running',
      'true',
    );
    await expect(summary, 'the summary went for a run that could not sound').toBeVisible();
    await expect(again).toHaveAttribute('data-sound-refused', 'true');
    // The line is on screen, above the sheet, not under it.
    await expect(line).toBeVisible();
    const lineBox = await line.boundingBox();
    const sheetBox = await summary.boundingBox();
    expect(lineBox, 'the state line has no box').not.toBeNull();
    expect(sheetBox, 'the summary has no box').not.toBeNull();
    expect(lineBox!.y + lineBox!.height, 'the state line is under the summary').toBeLessThanOrEqual(sheetBox!.y);
    // …and the sheet holds it too, for a screen reader: painted only where the header is not (U105a).
    await expect(page.locator('#score-summary #summary-refusal')).toHaveText(sentence);
    expect(await state()).toBe('suspended');

    await page.evaluate(() => {
      const ctx = (window as Captured).__contexts?.[0];
      if (ctx) Reflect.deleteProperty(ctx, 'resume');
    });
    await again.click({ timeout: 5_000 });
    await expect.poll(state, { message: 'the context after the second Again', timeout: 10_000 }).toBe('running');
    await expect(section).toHaveAttribute('data-running', 'true');
    await expect(summary).toBeHidden();
    await expect(line).not.toHaveText(sentence);
  });

  /**
   * A refused tap on the summary is said where the learner can read it, once,
   * upright and sideways (U105a, the reviewer's required change on U105,
   * `responses/f51e8010.md`; *once* is the orchestrator's word at the landing).
   * Sideways the header is not drawn and the bar that mirrors its line is under
   * the sheet, so a refused *Again* there showed nothing: the control looked
   * dead. The sheet now carries the sentence first on it, painted where the
   * header is not drawn; where it is (upright) the header's line is the one
   * seen and the sheet's copy stays for a screen reader. Here: exactly one
   * painted copy in view — sideways the sheet's (in the window, inside the
   * sheet, nothing drawn over it, whole: no ellipsis, no overflow), upright the
   * header's (above the sheet, uncut) with the sheet's copy not painted; the
   * sheet's copy a status in the accessibility tree either way; and the refused
   * tap changing nothing — no run, the tempo, the loop, the hand and the
   * summary as they were. *Slower* first, because its sentence is as long as
   * any a summary tap says and its tap moves the tempo; then *Again*, whose
   * sentence replaces it.
   *
   * On every face (U105b). CI's run 36779781211 on `122a5224` read the
   * header's copy of *Slower*'s sentence wider than its line on the runner
   * (302 px in 283 at 342 × 740, that run's own measurement) and cut, while it
   * fit here: the header's line was held to one line with an ellipsis. The
   * refusal's sentence is state text, whole rather than one line tall (the
   * reviewer's ruling on U105a, `responses/d0e1b01f.md`, choice 3, extended to
   * the header), so in the refusal state the line wraps. Upright runs twice: on
   * the app's stack, and with every element forced to a wider face (Verdana,
   * or DejaVu Sans where Verdana is absent: `plan.spec.ts`, U90), which cut the
   * sentence here on the one-line clamp exactly as the runner did. And the line
   * read does not cut with an ellipsis on either, which no face can hide.
   */
  const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
  for (const [held, width, height, face] of [
    ['upright', 342, 740, null],
    ['upright', 342, 740, 'a wider face'],
    ['sideways', 740, 342, null],
  ] as const) {
    test(`a refused tap on the summary, ${held} (${String(width)} × ${String(height)})${face === null ? '' : ` on ${face}`}: the sentence read once, whole, the sheet’s copy a status, and nothing changed`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        const Native = window.AudioContext;
        const made: AudioContext[] = [];
        (window as Captured).__contexts = made;
        window.AudioContext = class extends Native {
          constructor(options?: AudioContextOptions) {
            super(options);
            made.push(this);
          }
        };
      });
      await openScore(page);
      if (face !== null) await page.addStyleTag({ content: WIDER_FACE });
      const state = (): Promise<string> =>
        page.evaluate(() => (window as Captured).__contexts?.[0]?.state ?? 'none');
      await expect.poll(state, { message: 'the app made its context as the piece loaded' }).not.toBe('none');
      // An ordinary tap on the title, which is no control; sideways it is the bar's copy.
      await page.locator(held === 'sideways' ? '#score-title-side' : '#score-title').click({ timeout: 5_000 });
      await expect.poll(state).toBe('running');
      await page.locator('#score-mode').selectOption('tempo');
      await setTempoPercent(page, 130);
      await page.locator('#score-play').click();
      const summary = page.locator('#score-summary');
      await expect(summary).toBeVisible({ timeout: 60_000 });
      await page.evaluate(async () => {
        const ctx = (window as Captured).__contexts?.[0];
        await ctx?.suspend();
        // An own property over the prototype's: removed below, the real `resume` answers again.
        if (ctx) ctx.resume = () => new Promise<void>(() => undefined);
      });
      await expect.poll(state).toBe('suspended');
      const section = page.locator('section[data-screen="score"]');
      /** What a refused summary tap must leave as it was. */
      const facts = (): Promise<Record<string, string | null>> =>
        page.evaluate(() => {
          const screen = document.querySelector<HTMLElement>('section[data-screen="score"]');
          return {
            running: screen?.dataset.running ?? null,
            tempo: document.querySelector<HTMLInputElement>('#score-tempo')?.value ?? null,
            loop: screen?.dataset.loop ?? null,
            hand: document.querySelector('[id^="score-hands-"].is-selected')?.id ?? null,
            summary: String(document.querySelector<HTMLElement>('#score-summary')?.hidden === false),
          };
        });
      const before = await facts();
      // Each fact read as something, so "unchanged" is not two nulls agreeing.
      expect(before.running).not.toBe('true');
      expect(before.summary).toBe('true');
      expect(before.tempo).toBe('130');
      expect(before.loop, 'no loop, read as the empty attribute').toBe('');
      expect(before.hand, 'no hand reads as chosen').not.toBeNull();
      const refusal = page.locator('#score-summary #summary-refusal');

      /** Taps a summary control with the sound's start never answering, and reads its refusal where the learner is. */
      const refusedTap = async (id: string, sentence: string): Promise<void> => {
        await page.locator(id).click({ timeout: 5_000 });
        // Past the bound: the sentence is what says the wait is over (polled, no fixed sleep).
        await expect(refusal, `the summary’s line after ${id}’s bound`).toHaveText(sentence, { timeout: 10_000 });
        await expect(page.locator(id)).toHaveAttribute('data-sound-refused', 'true');
        expect(await facts(), `${id}’s refused tap changed something`).toEqual(before);
        // The sheet's copy is a status in the accessibility tree, painted or not: a screen reader reaches it.
        // (The header's line is a status too, but inert under the summary, which Playwright's role query
        // does not count as hidden; so the query is the sheet's.)
        await expect(
          summary.getByRole('status').filter({ hasText: sentence }),
          'no status on the summary says it',
        ).toHaveCount(1);
        const copies = await page.evaluate((said) => {
          const sheetNode = document.querySelector<HTMLElement>('#score-summary')!;
          const sheet = sheetNode.getBoundingClientRect();
          const displayed = (node: Element): boolean => {
            for (let at: Element | null = node; at !== null; at = at.parentElement) {
              if (getComputedStyle(at).display === 'none') return false;
            }
            return true;
          };
          /** A copy of the sentence, and whether it is painted where the learner can read it. */
          const read = (selector: string) => {
            const node = document.querySelector<HTMLElement>(selector);
            if (node === null || !(node.textContent ?? '').includes(said)) return null;
            const r = node.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(node);
            const text = range.getBoundingClientRect();
            // Drawn over? A copy on the sheet: what is drawn at its text's two ends and middle. A copy
            // behind the sheet (the head, the bar: inert while it is up, so hit-testing passes through
            // them): whether the sheet's box overlaps its own.
            const at = (x: number): boolean => {
              const top = document.elementFromPoint(x, r.top + r.height / 2);
              return top !== null && (top === node || node.contains(top));
            };
            const clear = sheetNode.contains(node)
              ? at(text.left + 2) && at((text.left + text.right) / 2) && at(text.right - 2)
              : r.bottom <= sheet.top || r.top >= sheet.bottom || r.right <= sheet.left || r.left >= sheet.right;
            // Out of the paint: not displayed, or `.visually-hidden`'s one pixel.
            const shown = displayed(node) && r.width > 1 && r.height > 1;
            const inWindow = r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
            return {
              painted: shown && inWindow && clear,
              shown,
              inWindow,
              clear,
              inSheet: r.top >= sheet.top && r.bottom <= sheet.bottom && r.left >= sheet.left && r.right <= sheet.right,
              scrollWidth: node.scrollWidth,
              clientWidth: node.clientWidth,
              textInside: text.left >= r.left - 0.5 && text.right <= r.right + 0.5,
              ellipsis: getComputedStyle(node).textOverflow === 'ellipsis',
            };
          };
          return {
            header: read('#score-waiting'),
            mirror: read('#score-status-side'),
            corner: read('#score-corner'),
            sheet: read('#summary-refusal'),
          };
        }, sentence);
        // Once: exactly one copy painted where it can be read — sideways the sheet's, upright the header's.
        const painted = Object.entries(copies)
          .filter(([, copy]) => copy?.painted === true)
          .map(([name]) => name);
        // Soft, so a red run names every fact that failed, not only the first.
        expect.soft(painted, `the sentence is not read once ${held}`).toEqual([held === 'sideways' ? 'sheet' : 'header']);
        const seen = held === 'sideways' ? copies.sheet : copies.header;
        expect(seen, 'no copy to read').not.toBeNull();
        if (held === 'sideways') expect.soft(seen!.inSheet, 'the summary’s line is outside the summary’s box').toBe(true);
        expect.soft(seen!.inWindow, 'the line read is off the screen').toBe(true);
        expect.soft(seen!.clear, 'something is drawn over the sentence').toBe(true);
        expect.soft(seen!.scrollWidth, 'the sentence overflows its line').toBeLessThanOrEqual(seen!.clientWidth);
        expect.soft(seen!.textInside, 'the sentence runs outside its line').toBe(true);
        if (held === 'sideways') expect.soft(seen!.ellipsis, 'the summary’s line cuts with an ellipsis').toBe(false);
        if (held === 'upright') expect.soft(seen!.ellipsis, 'the header’s line cuts with an ellipsis').toBe(false);
        // Upright the sheet's copy is there for a screen reader and not painted: the sentence once.
        if (held === 'upright') expect.soft(copies.sheet?.shown, 'the sheet’s copy is painted upright too').toBe(false);
        expect(test.info().errors.length, 'the sentence is not seen whole, once').toBe(0);
        expect(await state()).toBe('suspended');
      };

      // `STATE_TEXT.soundOff` in `help.ts`, as `help.test.ts` joins them to `04` §5f.
      await refusedTap('#summary-slower', 'Sound did not start — tap Slower again');
      // The second from the sheet scrolled to its foot, where sideways the self-report row is (the
      // sheet is at its 72 % and scrolls): the line is held at the sheet's top, still in view.
      const scrolled = await summary.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
        return node.scrollTop;
      });
      if (held === 'sideways') expect(scrolled, 'the sheet did not scroll, so its foot is not exercised').toBeGreaterThan(0);
      await refusedTap('#summary-again', 'Sound did not start — tap Again');

      await page.evaluate(() => {
        const ctx = (window as Captured).__contexts?.[0];
        if (ctx) Reflect.deleteProperty(ctx, 'resume');
      });
      await page.locator('#summary-again').click({ timeout: 5_000 });
      await expect.poll(state, { message: 'the context after the last Again', timeout: 10_000 }).toBe('running');
      await expect(section).toHaveAttribute('data-running', 'true');
      await expect(summary).toBeHidden();
      await expect(page.locator('#score-tempo'), 'Again ran at the tempo the refusals left').toHaveValue(before.tempo ?? '');
    });
  }
});
