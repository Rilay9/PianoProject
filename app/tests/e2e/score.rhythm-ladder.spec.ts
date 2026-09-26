/**
 * Rhythm first, the tempo ladder, and the duet — on the real screen
 * (docs/04 §5, docs/05 §3a and §6).
 *
 * Three things that are each one toggle in the `⋯` sheet and each change what
 * a run *means*, so the unit tests cannot be the whole story: the engine's
 * rules are pinned in `tests/unit/engineRhythmOnly.test.ts` and
 * `tests/unit/tempoLadder.test.ts`, and what is asked here is whether the
 * screen asks the engine for them, and says so afterwards.
 *
 * Three habits run through the file, all of them about not racing a clock.
 *
 *  - **Settings are seeded before the page loads** rather than driven through
 *    the UI, so a run starts with the tempo, the tolerance and the count-in it
 *    needs. `countInBars: 0` in particular: a count-in is a bar of nothing to
 *    watch here, and waiting it out is where a timing test goes wrong.
 *  - **Time is measured from a step boundary, never from a click.** The run
 *    publishes which step it is on (`__pianopath.scoreRun`), so "inside the
 *    window" and "past it" are stated against the music rather than against
 *    however long a round trip took on a loaded machine. No test here asserts
 *    a millisecond; each waits for the step to change and then acts relative
 *    to that.
 *  - **The assertions are on end states, never on a sentence in flight.** The
 *    ladder writes a line at every pass boundary and replaces it at the next
 *    one, so a test that waits for one particular rung fails on a busy
 *    machine. Every ladder case runs to where the tempo stops moving — the
 *    floor, the ceiling, or a pass nothing judged — and the sentence stops
 *    changing; the hold case also keeps every line the status was given, so
 *    "it never moved" is read off the whole run rather than its last line.
 */
import { expect, test, type Page } from '@playwright/test';

import { closeScoreMenu, openScoreMenu, withScoreMenu } from './scoreControls';

/** Eight bars, right hand, E D C — short, and always in the built content. */
const ITEM = 'song.folk.hot-cross-buns';
/** The two-hand piece: a duet needs a hand the learner is not playing. */
const TWO_HANDS = 'song.folk.twinkle.ht';

/**
 * A pitch the piece uses — so it is on the strip — and never the one under the
 * cursor at the moment it is pressed. That is what makes it evidence: in an
 * ordinary Keep tempo run it matches nothing and is a wrong note.
 */
const NOT_THE_FIRST_NOTE = 60;

/**
 * 30 % of the written tempo, so a beat is long whatever the piece is written
 * at, and a window of 400 ms either side of a step leaves a gap between one
 * step's window and the next that a test can act in without knowing the bpm.
 */
const SLOW_AND_WIDE = { toleranceMs: 400, defaultTempoPct: 30, countInBars: 0 };

/** Comfortably past a window's far edge, and comfortably short of the next. */
const PAST_THE_WINDOW_MS = 650;

interface ScoreRun {
  step: number;
  /** Holding for the learner's first note (`05` §3b). */
  armed: boolean;
  /** The pitches the run is waiting for. */
  expected: number[];
}

async function withSettings(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.addInitScript((p) => {
    const raw = localStorage.getItem('pianopath.settings');
    const stored = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...stored, ...(p as object) }));
  }, patch);
}

async function openScore(page: Page, id: string = ITEM): Promise<void> {
  await page.goto(`/#/score/${id}`);
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  // The front buffer, not the first SVG in the DOM: the other one is the
  // pre-rendered next window and has no height.
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
    { timeout: 60_000 },
  );
}

/** Keep tempo, the right hand, and the screen keys as the input. */
async function armTempoRun(page: Page): Promise<void> {
  await withScoreMenu(page, async () => {
    await page.locator('#score-input').selectOption('keys');
  });
  await page.locator('#score-mode').selectOption('tempo');
  await page.locator('#score-hands-R').click();
}

/** Puts one of the sheet's toggles where the test wants it, and proves it. */
async function setSheetToggle(page: Page, id: string, on: boolean): Promise<void> {
  await openScoreMenu(page);
  const toggle = page.locator(`#${id}`);
  const want = on ? 'On' : 'Off';
  if ((await toggle.textContent()) !== want) await toggle.click();
  await expect(toggle).toHaveText(want);
  await closeScoreMenu(page);
}

/** A one-bar loop on the window's first bar, by the double-tap gesture. */
async function loopFirstBar(page: Page): Promise<void> {
  const stage = page.locator('#score-stage');
  await stage.dispatchEvent('dblclick');
  await stage.dispatchEvent('dblclick');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-loop', '1-1');
}

/** Waits until the run is sitting on `step` — the music's own stopwatch. */
async function waitForStep(page: Page, step: number): Promise<void> {
  await page.waitForFunction(
    (want) => {
      const run =
        (window as unknown as { __pianopath?: { scoreRun?: () => ScoreRun | null } }).__pianopath
          ?.scoreRun?.() ?? null;
      return run !== null && run.step === want;
    },
    step,
    { timeout: 60_000, polling: 30 },
  );
}

/**
 * Waits for a Keep tempo run to hold for its first note, and says which note.
 *
 * A run with an input to hear holds at the start until the learner plays
 * (`05` §3b), so a run that is to miss under a judging input still needs the
 * one note that starts its clock; this is the note, read from the run.
 */
async function waitForHold(page: Page): Promise<number> {
  const handle = await page.waitForFunction(
    () => {
      const run =
        (window as unknown as { __pianopath?: { scoreRun?: () => ScoreRun | null } }).__pianopath
          ?.scoreRun?.() ?? null;
      return run !== null && run.armed ? (run.expected[0] ?? null) : null;
    },
    undefined,
    { timeout: 60_000, polling: 30 },
  );
  return (await handle.jsonValue()) as number;
}

/**
 * Keeps every line the status is given from here on, in the page.
 *
 * A pass boundary replaces the line, and the next one replaces it again, so
 * the last line cannot say whether the ladder moved earlier in the run. Each
 * assignment to the line adds a text node, which is what is kept.
 */
async function recordStatusLines(page: Page): Promise<void> {
  await page.evaluate(() => {
    const lines: string[] = [];
    (window as unknown as { __statusLines?: string[] }).__statusLines = lines;
    const status = document.querySelector('#score-status');
    if (status === null) throw new Error('the screen has no #score-status');
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) lines.push(node.textContent ?? '');
      }
    }).observe(status, { childList: true });
  });
}

async function statusLines(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __statusLines?: string[] }).__statusLines ?? [],
  );
}

/** Waits until the ladder has spoken at `count` pass boundaries, whatever it said. */
async function waitForPassBoundaries(page: Page, count: number): Promise<void> {
  await page.waitForFunction(
    (want) =>
      ((window as unknown as { __statusLines?: string[] }).__statusLines ?? []).filter((line) =>
        /staying at|up to|down to/.test(line),
      ).length >= want,
    count,
    { timeout: 120_000, polling: 100 },
  );
}

/** Presses a key on the strip, which feeds the shared ScreenKeyboardSource. */
async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

/**
 * Taps one key in the page itself, once per step, for as long as the test runs.
 *
 * Driving this from Playwright would put a round trip between the cursor
 * moving and the finger landing, and at the top of the ladder a step is a few
 * hundred milliseconds long. In the page the whole loop is one timer reading
 * the run's own published step, so every pass is clean by construction and the
 * only thing left for the test to watch is what the ladder does about it.
 */
async function tapEveryStep(page: Page, midi: number): Promise<void> {
  await page.evaluate((note) => {
    interface Hooked {
      __pianopath?: { scoreRun?: () => ScoreRun | null };
      __rhythmTapper?: number;
    }
    const hooked = window as unknown as Hooked;
    let last: number | null = null;
    hooked.__rhythmTapper = window.setInterval(() => {
      const run = hooked.__pianopath?.scoreRun?.() ?? null;
      if (run === null) {
        // Between laps the ladder is restarting the run; the next step it
        // publishes is a new one whatever its number.
        last = null;
        return;
      }
      if (run.step === last) return;
      last = run.step;
      const key = document.querySelector(`.keyboard-strip [data-midi="${String(note)}"]`);
      if (key === null) return;
      for (const kind of ['pointerdown', 'pointerup']) {
        key.dispatchEvent(new PointerEvent(kind, { bubbles: true, pointerId: 1, isPrimary: true }));
      }
    }, 40);
  }, midi);
}

/** The stored practice status for a piece — what mastery is actually read off. */
async function storedStatus(page: Page, itemId: string): Promise<string> {
  return page.evaluate(async (id) => {
    type Hooked = Window & {
      __pianopath?: { exportAll: () => Promise<{ stores: Record<string, unknown[]> }> };
    };
    const file = await (window as Hooked).__pianopath?.exportAll();
    const rows = (file?.stores.progress ?? []) as { itemId: string; status: string }[];
    return rows.find((row) => row.itemId === id)?.status ?? 'nothing recorded';
  }, itemId);
}

test.describe('rhythm first', () => {
  test.setTimeout(180_000);

  test('accepts a wrong pitch on time and refuses a late one', async ({ page }) => {
    await withSettings(page, SLOW_AND_WIDE);
    await openScore(page);
    await armTempoRun(page);
    await setSheetToggle(page, 'score-rhythm', true);
    // The screen says what it is doing, so the rest of the app — the gallery,
    // the tour — can see it without opening the sheet.
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-rhythm',
      'true',
    );

    await page.locator('#score-play').click();
    await waitForStep(page, 0);

    // The piece opens on E4; this is C4, which is in the piece but not here.
    const correct = page.locator('#score-stage .score-note.is-correct');
    await press(page, NOT_THE_FIRST_NOTE);
    await expect(correct).toHaveCount(1);

    // Now the same key, past the end of a window and short of the next one's
    // start. Timed from the step the run says it is on, not from the click.
    await waitForStep(page, 1);
    await page.waitForTimeout(PAST_THE_WINDOW_MS);
    await press(page, NOT_THE_FIRST_NOTE);
    // Nothing new was accepted: rhythm-first forgives the note, never the
    // moment. The staff's green is the durable half of the verdict — the
    // strip's flash lasts under a second by design (`04` §5) — so the refusal
    // is read off the staff and only confirmed on the keys.
    await expect(correct).toHaveCount(1);
    await expect(
      page.locator(`.keyboard-strip [data-midi="${String(NOT_THE_FIRST_NOTE)}"]`),
    ).toHaveClass(/is-wrong/);
  });

  test('and with the toggle off the same press is simply wrong', async ({ page }) => {
    // The counter-case, and the reason the test above proves anything: without
    // it, "a wrong pitch was accepted" could be a screen that accepts anything.
    await withSettings(page, SLOW_AND_WIDE);
    await openScore(page);
    await armTempoRun(page);
    await setSheetToggle(page, 'score-rhythm', false);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-rhythm',
      'false',
    );

    await page.locator('#score-play').click();
    await waitForStep(page, 0);
    await press(page, NOT_THE_FIRST_NOTE);
    await expect(
      page.locator(`.keyboard-strip [data-midi="${String(NOT_THE_FIRST_NOTE)}"]`),
    ).toHaveClass(/is-wrong/);
    await expect(page.locator('#score-stage .score-note.is-correct')).toHaveCount(0);
  });

  test('a rhythm run played perfectly is still not a pass of the piece', async ({ page }) => {
    // The whole point of the tag, stated where it matters. This run is tapped
    // on one key from the first step to the last, at a tempo well over the
    // pass threshold — everything an ordinary run needs to be recorded as
    // passed — and it must not be.
    await withSettings(page, { toleranceMs: 300, defaultTempoPct: 130, countInBars: 0 });
    await openScore(page);
    await armTempoRun(page);
    await setSheetToggle(page, 'score-rhythm', true);
    await tapEveryStep(page, NOT_THE_FIRST_NOTE);
    await page.locator('#score-play').click();

    const sheet = page.locator('#score-summary');
    await expect(sheet).toBeVisible({ timeout: 120_000 });
    // Named for what it was, not for what it was not.
    await expect(sheet.locator('h2')).toHaveText('Rhythm run');
    await expect(sheet.locator('[data-stat="judged"]')).toContainText('Rhythm only');
    // The accuracy still stands — it is a true measurement of how much of the
    // piece the learner was in time for.
    await expect(sheet.locator('[data-stat="accuracy"]')).not.toHaveText('0%');
    // …and the piece has not been passed by it. This is the assertion the
    // feature exists to keep: `status` is what mastery is read off.
    expect(await storedStatus(page, ITEM)).toBe('started');
  });
});

test.describe('the tempo ladder on a loop', () => {
  test.setTimeout(180_000);

  test('a pass with misses in it slows down, and stops at the floor', async ({ page }) => {
    // Misses a learner made, under an input that is listening: the screen
    // keys, the first note played to start the clock (a run with an input
    // holds for it, `05` §3b) and nothing after it, so every pass has misses
    // in it and the ladder walks down. Until T42 this fed no input at all and
    // relied on every note being judged missed, which was the fault C3 fixed
    // (L42); a pass nothing judged is the next case, and it holds. Started one
    // rung above the floor, so the end state arrives in two passes and the
    // assertion is on a tempo that can go no lower rather than on a rung in
    // flight.
    await withSettings(page, { defaultTempoPct: 40, countInBars: 0 });
    await openScore(page);
    await armTempoRun(page);
    await loopFirstBar(page);
    await setSheetToggle(page, 'score-ladder', true);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-ladder', 'on');

    await page.locator('#score-play').click();
    await press(page, await waitForHold(page));
    // 30 % is `MIN_TEMPO_PCT`, the bottom of the slider the tempo sheet has
    // always had: the ladder uses the range that is already there rather than
    // inventing one of its own.
    await expect(page.locator('#score-tempo')).toHaveValue('30', { timeout: 120_000 });
    // A pass that cannot move the tempo still says what it was: a mistake,
    // which is not the same sentence as a pass nothing judged.
    await expect(page.locator('#score-status')).toContainText('A mistake — staying at 30 %', {
      timeout: 120_000,
    });
    await expect(page.locator('#score-status')).not.toContainText('down to 20');
  });

  test('a pass nothing listened to holds the tempo, and says why', async ({ page }) => {
    // No input at all — `inputPriority: ['none']` — so nothing is judged (L42)
    // and a pass is neither clean nor a mistake. The ladder is the one control
    // that acts without being asked, so on such a pass it does nothing, and
    // says the reason is that nothing was listening, not that a floor or a
    // ceiling was reached (T42). Before, it climbed to the written tempo on
    // passes nobody played, and before C3 it walked down on misses nobody made.
    await withSettings(page, { defaultTempoPct: 40, countInBars: 0, inputPriority: ['none'] });
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-hands-R').click();
    await loopFirstBar(page);
    await setSheetToggle(page, 'score-ladder', true);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-ladder', 'on');
    await expect(page.locator('#score-tempo')).toHaveValue('40');

    await recordStatusLines(page);
    await page.locator('#score-play').click();
    // Two pass boundaries: the ladder has had two chances to move the tempo,
    // so a tempo read now is not simply a first lap that has not ended.
    await waitForPassBoundaries(page, 2);
    expect(
      (await statusLines(page)).filter((line) => /up to|down to/.test(line)),
      'the ladder moved the tempo on a pass nothing judged',
    ).toEqual([]);
    await expect(page.locator('#score-tempo')).toHaveValue('40');
    await expect(page.locator('#score-status')).toHaveText('Nothing listening — staying at 40 %');
  });

  test('a clean pass speeds up, and stops at the written tempo', async ({ page }) => {
    // Rhythm only, so "clean" is a question about timing alone and a tapper in
    // the page can answer it; the ladder does not care which of the two kinds
    // of run it is watching. Started one rung below the ceiling.
    await withSettings(page, { toleranceMs: 400, defaultTempoPct: 90, countInBars: 0 });
    await openScore(page);
    await armTempoRun(page);
    await setSheetToggle(page, 'score-rhythm', true);
    await loopFirstBar(page);
    await setSheetToggle(page, 'score-ladder', true);

    await tapEveryStep(page, NOT_THE_FIRST_NOTE);
    await page.locator('#score-play').click();

    // 100 % is `LADDER_CEILING_PCT`: a ladder nobody has asked to go faster
    // than the piece is written stops there, and says so rather than silently
    // absorbing the pass.
    await expect(page.locator('#score-tempo')).toHaveValue('100', { timeout: 120_000 });
    await expect(page.locator('#score-status')).toContainText('staying at 100 %', {
      timeout: 120_000,
    });
    await expect(page.locator('#score-status')).not.toContainText('up to 110');
  });

  test('the Ladder row is not offered without a loop to climb', async ({ page }) => {
    // `04` §0 R4: a ladder with nothing to repeat is a live control over
    // nothing, and the row is gone rather than disabled.
    await withSettings(page, { countInBars: 0, inputPriority: ['none'] });
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await openScoreMenu(page);
    await expect(page.locator('#score-ladder-row')).toBeHidden();
    await closeScoreMenu(page);

    await loopFirstBar(page);
    await openScoreMenu(page);
    await expect(page.locator('#score-ladder-row')).toBeVisible();
  });
});

test.describe('the duet, where the hand is chosen', () => {
  test.setTimeout(180_000);

  test('appears with R selected, names the hand, and is the Settings toggle', async ({ page }) => {
    await openScore(page, TWO_HANDS);

    // With Both there is no hand the learner is not playing, so there is
    // nothing for the row to offer (`04` §0 R4).
    await openScoreMenu(page);
    await expect(page.locator('#score-duet-row')).toBeHidden();
    await closeScoreMenu(page);

    await page.locator('#score-hands-R').click();
    await openScoreMenu(page);
    const row = page.locator('#score-duet-row');
    await expect(row).toBeVisible();
    // The sentence is in the row's own words, not in the hint underneath:
    // sideways the sheet hides every hint, and this row exists because the
    // setting could not be found.
    await expect(row).toContainText('Duet: the app plays the left hand');
    // On already — `playbackHands: 'non-focused'` is what has been playing the
    // other hand all along, three screens away in Settings.
    await expect(page.locator('#score-duet')).toHaveText('On');

    await page.locator('#score-duet').click();
    await expect(page.locator('#score-duet')).toHaveText('Off');
    await closeScoreMenu(page);
    // The same setting, not a second one: the one the Settings screen writes.
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('pianopath.settings');
      const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
      return settings.playbackHands;
    });
    expect(stored).toBe('none');
  });

  test('names the other hand when L is chosen', async ({ page }) => {
    await openScore(page, TWO_HANDS);
    await page.locator('#score-hands-L').click();
    await openScoreMenu(page);
    await expect(page.locator('#score-duet-row')).toContainText(
      'Duet: the app plays the right hand',
    );
  });
});
