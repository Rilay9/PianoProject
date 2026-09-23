/**
 * The Score screen's header is the same height throughout a run — and the
 * sheet keeps its engraving when something else changes the stage's height.
 *
 * The header sits above the notation in the same column, so its height is
 * subtracted from the stage the sheet is engraved and fitted into. Anything in
 * it that can grow a line mid-run moves the stage, and a stage that moves
 * re-engraves the sheet under the learner's hands (`08` P21e A2: the size a run
 * starts at is the size it keeps).
 *
 * That is not a theory. `score.fuzz.spec.ts` seed 4 failed on CI on both tries
 * — twinkle upright, *the size changed mid-run: scale 0.773877 → 0.708097* —
 * and it passed on the machine the fix was written on, because the difference
 * was the font: the state line is one line wide here and wraps to two there.
 * The two numbers are one drawn size at two engraving zooms
 * (0.773877 × 1.83 = 1.41619 = 0.708097 × 2.00), which is what the freeze does
 * when the sheet is re-engraved — it keeps the size on the glass and rewrites
 * the transform.
 *
 * So two things are checked here, at the two phone widths `04` §0 names:
 *
 *  1. the header's height does not move — across the first correct notes, and
 *     with a status message and a state line longer than the row, and with the
 *     strip's own metrics widened, which is the machine difference itself;
 *  2. a stage whose *height* changes during a run leaves the drawn sheet's
 *     transform alone (`refitEngraving`, unit-tested in `autoFit.test.ts`).
 *
 * Nothing here asserts a pixel measured on this machine (`00-invariants` §2):
 * every assertion is one measurement against another taken on the same run.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { pressControl, revealBar } from './scoreControls';

const ITEM = 'song.folk.twinkle.ht';
/** The widths `04` §0 measures a phone at. */
const WIDTHS = [342, 390];

/** A real message this screen writes mid-run, and one of its longest. */
const LONG_STATUS = 'Sight-reading counts on the first attempt only — this run is not recorded.';
/** Longer than any state line the engine writes, so it must be cut, not wrapped. */
const LONG_STATE = 'Play the first note. Nothing moves until you do, and nothing is judged until it has.';

async function headHeight(page: Page): Promise<number> {
  // The header folds away during a run; a tap brings it back (`08` §9.34), and
  // a height measured on a folded header is zero and means nothing.
  await revealBar(page);
  return page.evaluate(() => document.querySelector('#score-head')?.getBoundingClientRect().height ?? -1);
}

/** The engraving zoom and the transform together: the size on the glass is their product. */
async function fitState(page: Page): Promise<{ zoom: number; scale: number }> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor');
    const w = window as unknown as { __pianopath?: { scoreFit?: () => { zoom: number } } };
    return {
      zoom: w.__pianopath?.scoreFit?.()?.zoom ?? 0,
      scale: el ? new DOMMatrixReadOnly(getComputedStyle(el).transform).a : 0,
    };
  });
}

async function cursorScale(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('#score-stage .score-buffer.is-cursor');
    return el ? new DOMMatrixReadOnly(getComputedStyle(el).transform).a : 0;
  });
}

async function openScore(page: Page, width: number): Promise<MidiMock> {
  await page.setViewportSize({ width, height: 844 });
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.goto(`/#/score/${ITEM}`);
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
  await page.locator('#score-mode').selectOption('wait');
  await page.waitForTimeout(1_200);
  return midi;
}

for (const width of WIDTHS) {
  test(`the score header is the same height all through a run at ${String(width)} px`, async ({ page }) => {
    test.setTimeout(180_000);
    const midi = await openScore(page, width);
    const atRest = await headHeight(page);
    expect(atRest, 'the header has a height to compare against').toBeGreaterThan(0);

    await pressControl(page, '#score-play');
    await page.waitForTimeout(800);
    const started = await headHeight(page);
    expect(started, 'starting a run must not change the header’s height').toBe(atRest);

    // The first correct notes: the state line changes as the run moves, and
    // this is the moment CI's seed-4 walk was in when the size moved.
    for (let i = 0; i < 3; i += 1) {
      const expected: number[] = await page.evaluate(
        () =>
          (window as unknown as { __pianopath?: { scoreRun?: () => { expected: number[] } | null } }).__pianopath
            ?.scoreRun?.()?.expected ?? [],
      );
      for (const n of expected) await midi.noteOn(n, 80);
      await page.waitForTimeout(90);
      for (const n of expected) await midi.noteOff(n);
      await page.waitForTimeout(250);
    }
    expect(await headHeight(page), 'the first correct notes must not change the header’s height').toBe(atRest);

    // A status message and a state line longer than the row will hold.
    await page.evaluate(
      ([status, state]) => {
        const say = (id: string, text: string): void => {
          const el = document.querySelector(id);
          if (el) el.textContent = text;
        };
        say('#score-status', status ?? '');
        say('#score-waiting', state ?? '');
      },
      [LONG_STATUS, LONG_STATE],
    );
    await page.waitForTimeout(400);
    expect(await headHeight(page), 'a message longer than the row must be cut, not wrapped').toBe(atRest);

    // And the machine difference itself: the same words, wider metrics.
    await page.addStyleTag({ content: '#score-head { letter-spacing: 0.3em; }' });
    await page.waitForTimeout(400);
    expect(await headHeight(page), 'a wider font must not give the header another line').toBe(atRest);
  });

  /**
   * The same rule, through the restarts a sitting is actually made of.
   *
   * A run does not begin once. A hand change and `Hear it` each stop the run
   * and start another, which is `setRunning(false)` immediately followed by
   * `setRunning(true)`. `score.fuzz` seed 4 walked into exactly that on
   * 2026-09-23 and read *scale 0.839161 → 0.767832* — again one drawn size
   * (1.53566) at zoom 1.83 and at 2.00 — because the restart had left the new
   * run with no engraving box to compare against, so the next change of the
   * stage's height searched the zoom again. The header never wrapped in that
   * walk: its height took two values, its own and zero, which is the fold.
   *
   * The **engraving zoom** is what is asserted here, not only the transform.
   * The transform is the thing the fuzz reads and it is a proxy: the freeze
   * converts it so the size on the glass survives a re-engraving, so a sheet
   * can be re-engraved mid-run and the picture look unchanged. The zoom says
   * whether it happened.
   */
  test(`a run restarted mid-piece keeps its engraving at ${String(width)} px`, async ({ page }) => {
    test.setTimeout(180_000);
    await openScore(page, width);
    await page.addStyleTag({
      content: ".screen--score[data-chrome='folded']:not([data-tablet='true']) .score-head { display: flex; }",
    });
    await pressControl(page, '#score-play');
    await page.waitForTimeout(1_000);

    const style = await page.addStyleTag({ content: '#score-head { padding-bottom: 0px; }' });
    const pad = async (px: number): Promise<void> => {
      await style.evaluate((el, p) => {
        el.textContent = `#score-head { padding-bottom: ${String(p)}px; }`;
      }, px);
      await page.waitForTimeout(700);
    };

    for (const restart of ['#score-hands-L', '#score-hear', '#score-hands-both'] as const) {
      await pressControl(page, restart);
      // Past the settle the freeze waits for. The size is taken here.
      await page.waitForTimeout(1_000);
      const before = await fitState(page);
      expect(before.scale, `${restart} left no sheet drawn`).toBeGreaterThan(0);

      // The stage loses height and gains it back, the width untouched — what
      // the control bar does by itself three seconds into every run.
      for (const px of [96, 0]) {
        await pad(px);
        const now = await fitState(page);
        expect(now.zoom, `the sheet was re-engraved after ${restart}, at ${String(px)} px of header`).toBeCloseTo(
          before.zoom,
          5,
        );
        expect(now.scale, `the transform moved after ${restart}, at ${String(px)} px of header`).toBeCloseTo(
          before.scale,
          5,
        );
      }
    }
  });

  test(`a run keeps its engraving when the stage's height changes at ${String(width)} px`, async ({ page }) => {
    test.setTimeout(180_000);
    await openScore(page, width);
    // Held open through the run, because the fold is itself a height change and
    // what is being measured here is the header's own.
    await page.addStyleTag({
      content: ".screen--score[data-chrome='folded']:not([data-tablet='true']) .score-head { display: flex; }",
    });
    await pressControl(page, '#score-play');
    // Past the settle the freeze waits for before it takes the run's size.
    await page.waitForTimeout(1_200);
    const frozen = await cursorScale(page);
    expect(frozen, 'the cursor slot is drawn at some scale').toBeGreaterThan(0);

    // The stage loses height, and gains it again — what the header does when a
    // line wraps, and what the control bar does when it folds.
    const style = await page.addStyleTag({ content: '#score-head { padding-bottom: 0px; }' });
    for (const pad of [24, 48, 72, 96, 0]) {
      await style.evaluate((el, p) => {
        el.textContent = `#score-head { padding-bottom: ${String(p)}px; }`;
      }, pad);
      await page.waitForTimeout(600);
      expect(
        await cursorScale(page),
        `the sheet was re-engraved when the header took ${String(pad)} px more`,
      ).toBeCloseTo(frozen, 5);
    }
  });
}
