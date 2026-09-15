// Landscape screenshots at 1, 2 and 4 bars per window (P6 acceptance).
//
// These catch what no assertion does: a control bar wrapping onto three rows
// and eating the notation, a window that draws one bar when it says four, a
// keyboard strip that covers the bottom stave. Snapshots are per-platform, so
// a mismatch on a new machine is a missing baseline rather than a regression.

import { expect, test, type Page } from '@playwright/test';

import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { closeScoreMenu, inkBox, openScoreMenu } from './scoreControls';

const ITEM = 'song.folk.twinkle.rh';
/**
 * The piece with a bar of eight quavers among bars of four crotchets: the
 * one whose widest bar is wide enough to push the next bar off a phone held
 * sideways when the fit reads only the height. Twinkle's bars are all about
 * the same width and it passes by the luck of its proportions; this one is
 * the case the read-ahead rule exists for.
 */
const DENSE_ITEM = 'song.folk.hot-cross-buns';

type Run = { step: number; expected: number[]; bar: number; nextBar: number | null; lastBar: number } | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };

/**
 * Where a bar's notes are on the glass, and where the next bar starts.
 *
 * Note heads, in screen pixels: the sheet carries a CSS transform, so the
 * only honest measurement is `getBoundingClientRect` on the drawn notes. The
 * page and the `.vf-measure` groups are engraved wider than the stage on
 * purpose and say nothing about what a person can see.
 */
async function barsOnGlass(
  page: Page,
  bar: number,
): Promise<{
  stage: { left: number; right: number };
  current: { left: number; right: number; notes: number } | null;
  nextFirst: { left: number; right: number } | null;
  nextDrawn: boolean;
}> {
  return page.evaluate((current) => {
    const stage = document.querySelector('#score-stage')?.getBoundingClientRect();
    const notes = [...document.querySelectorAll<HTMLElement>('#score-stage .score-buffer.is-front .score-note')];
    const of = (which: number): { left: number; right: number; notes: number } | null => {
      let left = Infinity;
      let right = -Infinity;
      let count = 0;
      for (const note of notes) {
        if (Number(note.dataset.bar) !== which) continue;
        const box = note.getBoundingClientRect();
        if (box.width <= 0) continue;
        left = Math.min(left, box.left);
        right = Math.max(right, box.right);
        count += 1;
      }
      return count > 0 ? { left, right, notes: count } : null;
    };
    let first: { left: number; right: number } | null = null;
    for (const note of notes) {
      if (Number(note.dataset.bar) !== current + 1) continue;
      const box = note.getBoundingClientRect();
      if (box.width <= 0) continue;
      if (!first || box.left < first.left) first = { left: box.left, right: box.right };
    }
    return {
      stage: stage ? { left: stage.left, right: stage.right } : { left: 0, right: 0 },
      current: of(current),
      nextFirst: first,
      nextDrawn: first !== null,
    };
  }, bar);
}

/** Plays one step's notes through the mock piano and waits for the score to move on. */
async function playStep(page: Page, midi: MidiMock, run: NonNullable<Run>): Promise<boolean> {
  for (const note of run.expected) await midi.noteOn(note, 78);
  await page.waitForTimeout(80);
  for (const note of run.expected) await midi.noteOff(note);
  return page
    .waitForFunction(
      (was) => {
        const now = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
        return now === null || now.step !== was;
      },
      run.step,
      { timeout: 4_000 },
    )
    .then(() => true)
    .catch(() => false);
}

/**
 * The owner's requirement, as an assertion: while a bar is being played, at
 * least the beginning of the next bar is on the glass.
 *
 * The first note of the next bar, whole, inside the stage — and the bar being
 * played inside it too, since a bar that runs off the right edge has lost its
 * own ending before the next bar was ever the question.
 */
async function expectNextBarOnGlass(page: Page, bar: number, when: string): Promise<void> {
  const seen = await barsOnGlass(page, bar);
  const px = (n: number): string => String(Math.round(n));
  expect(seen.current, `${when}: bar ${String(bar + 1)} has no notes on the sheet`).not.toBeNull();
  if (!seen.current) return;
  expect(
    seen.current.right,
    `${when}: bar ${String(bar + 1)} runs off the right of the stage — its notes span ${px(seen.current.left)}..${px(seen.current.right)} px on a stage ending at ${px(seen.stage.right)}`,
  ).toBeLessThanOrEqual(seen.stage.right + 1);
  expect(seen.nextDrawn, `${when}: bar ${String(bar + 2)} is not drawn at all`).toBe(true);
  if (!seen.nextFirst) return;
  expect(
    seen.nextFirst.right,
    `${when}: the first note of bar ${String(bar + 2)} is at ${px(seen.nextFirst.left)}..${px(seen.nextFirst.right)} px, past the stage's right edge at ${px(seen.stage.right)} — the read-ahead is off the glass`,
  ).toBeLessThanOrEqual(seen.stage.right + 1);
  expect(seen.nextFirst.left, `${when}: the first note of bar ${String(bar + 2)} is left of the stage`).toBeGreaterThanOrEqual(
    seen.stage.left - 1,
  );
}

async function open(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  // Sixty seconds, not the default five: eight of these run at once and a
  // score that takes two seconds alone takes twenty with the machine full.
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

async function setBars(page: Page, bars: number): Promise<void> {
  const label = page.locator('#score-bars');
  await openScoreMenu(page);
  // Down to the floor, then up: the stepper's buttons go dead at the ends now,
  // so this presses until one does rather than a fixed eight times.
  const down = page.locator('#score-bars-down');
  for (let i = 0; i < 12 && !(await down.isDisabled()); i += 1) await down.click();
  for (let i = 1; i < bars; i += 1) await page.locator('#score-bars-up').click();
  await expect(label).toHaveText(`${bars} bar${bars === 1 ? '' : 's'}`);
  // The sheet covers the notation, and these pictures are of the notation.
  await closeScoreMenu(page);
  // Let the redraw and the pre-render settle before the shutter.
  await page.waitForTimeout(500);
}

test.describe('score screen in landscape', () => {
  test.setTimeout(120_000);
  // A phone held sideways: the orientation the score screen is designed for.
  test.use({ viewport: { width: 880, height: 412 } });

  /**
   * What the pictures were guarding, as assertions.
   *
   * Written when the sheet started being fitted to the screen (2026-09-07) and
   * the pictures all went stale at once. They turned out not to have: the fix
   * was to stop refitting inside every draw. But the hour spent finding that
   * out is the argument for saying the three things the header describes as
   * assertions too — a baseline can only tell you *that* something moved, and
   * these say what.
   */
  for (const bars of [1, 2, 4]) {
    test(`${bars} bar${bars === 1 ? '' : 's'} per window`, async ({ page }) => {
      await open(page);
      await setBars(page, bars);

      const stage = await page.locator('#score-stage').boundingBox();
      const bar = await page.locator('#score-bar').boundingBox();
      const strip = await page.locator('#score-strip').boundingBox();
      // The ink, not the SVG element: the fit now grows the sheet until the
      // *drawn* music fills the stage, which puts the engraver's empty right
      // margin off the edge on purpose.
      const sheet = await inkBox(page);
      expect(stage && bar && strip).toBeTruthy();

      // 1. The control bar has not wrapped onto three rows and eaten the
      //    notation. One row of buttons is about 44 px; three would be 130.
      expect(bar!.height, 'the control bar has wrapped').toBeLessThan(110);

      // 2. The keyboard strip does not cover the bottom stave.
      expect(sheet.bottom, 'the strip covers the notation').toBeLessThanOrEqual(strip!.y + 1);

      // 3. Something is drawn. How *much* is the next test: OSMD emits a
      //    `.vf-measure` per stave per bar, so the count is proportional to
      //    the setting rather than equal to it.
      const measures = await page.locator('#score-stage .is-front svg .vf-measure').count();
      expect(measures, 'nothing was engraved').toBeGreaterThan(0);

      // Sideways the sheet is engraved *wider* than the stage on purpose:
      // the window, two bars behind it and two ahead, slid past under a
      // cursor held a third of the way across (P21c A2, P21e A3). What must
      // hold is that it starts inside the stage and fills it.
      expect(sheet.left, 'the sheet starts off the left of the stage').toBeGreaterThanOrEqual(
        stage!.x - 2,
      );
      expect(sheet.width, 'the sheet does not fill the stage').toBeGreaterThan(stage!.width * 0.6);
    });
  }

  /**
   * What the counting test cannot see. It counts `.vf-measure` in the SVG,
   * and sideways the chunk is engraved wider than the stage on purpose, so
   * every extra measure is present and counted whether or not a person can
   * see it. This asks the question the owner asked: while playing this bar,
   * can I see the start of the next one?
   *
   * At rest and through a run, because the two are different pictures. At
   * rest the sheet has not slid and the first bar has the clef beside it; in
   * a run the slide holds each bar a third of the way across, the control bar
   * has folded and the stage is taller, and the size is the one the run
   * froze. Each bar played is a separate case: the widest bar of the piece is
   * the one that decides, and it is not the first.
   */
  for (const item of [DENSE_ITEM, ITEM]) {
    for (const bars of [1, 2, 4]) {
      test(`${item}: the next bar is on the glass while a bar is played, ${String(bars)} per window`, async ({ page }) => {
        const midi = await installMidiMock(page, { permission: 'granted' });
        await page.goto(`/#/score/${item}`);
        await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
          timeout: 60_000,
        });
        await page.waitForFunction(
          () => {
            const svg = document.querySelector('#score-stage .is-front svg');
            return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
          },
          undefined,
          { timeout: 60_000 },
        );
        await setBars(page, bars);
        // The size the read-ahead is judged at is the one the probe's
        // measurement of the piece gives; before it lands the fit is working
        // from the first window alone.
        await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 });
        await page.waitForTimeout(300);
        await expectNextBarOnGlass(page, 0, 'at rest');

        await page.locator('#score-mode').selectOption('wait');
        await page.locator('#score-play').click();
        await page.waitForTimeout(800);
        let lastBar = -1;
        let checked = 0;
        for (let i = 0; i < 80; i += 1) {
          const run = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
          if (run === null) break;
          if (run.bar !== lastBar) {
            lastBar = run.bar;
            // Bars with a bar after them; a piece's last bar has nothing to read ahead to.
            if (run.bar < run.lastBar) {
              await expectNextBarOnGlass(page, run.bar, `playing bar ${String(run.bar + 1)}`);
              checked += 1;
            }
            // Six bars is every kind of bar these two pieces have.
            if (run.bar >= 5) break;
          }
          if (!(await playStep(page, midi, run))) break;
        }
        expect(checked, 'the run never reached a bar with a bar after it').toBeGreaterThan(1);
      });
    }
  }

  test('the window really holds more bars as the setting goes up', async ({ page }) => {
    // The catastrophe the pictures caught: a window that draws one bar when it
    // says four. Counted rather than looked at.
    await open(page);
    const drawn: number[] = [];
    for (const bars of [1, 2, 4]) {
      await setBars(page, bars);
      drawn.push(await page.locator('#score-stage .is-front svg .vf-measure').count());
    }
    const [one, two, four] = drawn as [number, number, number];
    expect(two, `1 bar drew ${String(one)}, 2 bars drew ${String(two)}`).toBeGreaterThan(one);
    expect(four, `2 bars drew ${String(two)}, 4 bars drew ${String(four)}`).toBeGreaterThan(two);
  });

  /**
   * The pictures, for a human looking at a change on their own machine.
   *
   * **Opt-in in CI**, and this is a deliberate loss. Baselines are
   * per-platform; the only machine on this project runs Windows; and CI runs
   * Linux. So a change to the look of the app fails CI on three pictures that
   * *cannot be regenerated from here* — which is what happened the day the
   * keyboard strip stopped drawing all 88 keys: 250 tests passed, including
   * every assertion above, and the three Linux PNGs were 11% different because
   * the app had got better.
   *
   * A guard nobody can update is a guard that gets deleted under pressure, and
   * usually at the worst moment. The assertions above are the CI guard now.
   * These stay for the eye, and `npm run tour` is the better tool for that
   * anyway — it photographs every screen in both orientations rather than one
   * screen in one.
   */
  test.describe('screenshots', () => {
    test.skip(
      !!process.env.CI && !process.env.VISUAL,
      'per-platform baselines that only a Linux machine can refresh; set VISUAL=1 to compare',
    );

    for (const bars of [1, 2, 4]) {
      test(`${bars} bar${bars === 1 ? '' : 's'} per window, drawn`, async ({ page }) => {
        await open(page);
        await setBars(page, bars);
        // The settled size, not the one the first chunk was fitted to: the
        // piece's measurement lands on idle and re-fits once, and a picture
        // taken before it is of a sheet that is about to change.
        await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 });
        await page.waitForTimeout(300);
        await expect(page.locator('section[data-screen="score"]')).toHaveScreenshot(
          `score-landscape-${bars}bar.png`,
          { maxDiffPixelRatio: 0.02 },
        );
      });
    }
  });

  test('the notation still has most of the height with the strip showing', async ({ page }) => {
    await open(page);
    const stage = await page.locator('#score-stage').boundingBox();
    const strip = await page.locator('#score-strip').boundingBox();
    const bar = await page.locator('#score-bar').boundingBox();
    expect(stage).toBeTruthy();
    // docs/04 §5 gives the keyboard strip the bottom ~12 % of the height; the
    // notation must still get the majority of the screen or the window is
    // pointless.
    expect((stage?.height ?? 0) / 412).toBeGreaterThan(0.5);
    expect((strip?.height ?? 0) + (bar?.height ?? 0)).toBeLessThan(412 * 0.5);
  });
});
