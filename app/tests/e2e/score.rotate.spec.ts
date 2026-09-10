/**
 * Turning the phone in the middle of a run (handoff §3a).
 *
 * The suite could turn a phone before a score was open and it could run a
 * score without ever turning the phone; it could not do both. The renderer's
 * answer to a turn is spread across three places — the stage's
 * `ResizeObserver`, the screen's own `resize` handler, and the arrangement
 * decision in `updateReadAhead` — and each can be right on its own while the
 * picture that comes out is wrong. What the owner saw on his phone was one
 * bar upright drawn as four one-bar systems at a fifth of the screen, and
 * every unit test passed.
 *
 * Two rules about how this measures, both learned the hard way.
 *
 * The **ink**, never the element. Sideways the engraver's page is
 * deliberately wider than the stage — the window plus bars to read into, slid
 * past under the cursor — so the `<svg>`'s own box says nothing about whether
 * the music fills the screen; measuring it gives numbers that look like a
 * pass whatever happened. The stave groups' boxes are the drawn extent, and
 * that is what an eye judges.
 *
 * And the **owner's own geometry**, not only round numbers. 360 × 780 and
 * 780 × 360 are what this suite has always used, and they are not a phone:
 * his is about 342 × 740 and 740 × 342. Two bugs found the day this was
 * written were invisible at the round sizes, because a number that divides
 * evenly into 360 does not divide evenly into 342. So the main case runs at
 * both, and the round pair is the cheaper one, not the truer one.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { pressControl } from './scoreControls';

/**
 * The two pieces the handoff names: the shortest thing in the library, four
 * bars on one staff, and a longer right-hand tune whose bars are not all the
 * same shape. A rotation bug that depends on how many bars there are to
 * re-plan shows up in one and not the other.
 */
const PIECES = [
  { id: 'song.folk.hot-cross-buns', name: 'Hot Cross Buns' },
  { id: 'song.classical.ode-to-joy.rh', name: 'Ode to Joy (theme)' },
] as const;

const SIZES = [
  { name: 'round', sideways: { width: 780, height: 360 }, upright: { width: 360, height: 780 } },
  {
    name: "the owner's phone",
    sideways: { width: 740, height: 342 },
    upright: { width: 342, height: 740 },
  },
] as const;

/** How much of the stage's width the music must fill once it has been fitted. */
const FILLS_WIDTH = 0.8;
/** And of its height, sideways, where the height is the only limit. */
const FILLS_HEIGHT_SIDEWAYS = 0.7;
/** The handoff's allowance for the refit to land after a turn. */
const AFTER_TURN_MS = 30_000;
/** How long one step may take to be judged and drawn. */
const ADVANCE_MS = 5_000;

interface Run {
  step: number;
  expected: number[];
  bar: number;
  pitches: number[];
  paused: boolean;
}

type Hooked = Window & { __pianopath?: { scoreRun?: () => Run | null } };

interface Ink {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface SlotShot {
  slot: string;
  /**
   * The engraver's page, in layout pixels, from the wrapper's inline width.
   * Set only on the sliding path (`drawInto` gives a chunk a bar's width of
   * page per bar), so a page wider than the stage *is* the slide's signature —
   * and unlike a translate it does not depend on which bar the cursor is on.
   */
  pageWidth: number;
  /** What OSMD laid out into, from the `<svg>`'s own width attribute. */
  engraved: number;
  ink: Ink | null;
}

interface Shot {
  stage: { left: number; right: number; width: number; height: number } | null;
  readAhead: string | null;
  layout: string | null;
  slots: SlotShot[];
  viewport: { width: number; height: number };
}

async function withSettings(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.addInitScript((p) => {
    const raw = localStorage.getItem('pianopath.settings');
    const s = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...s, ...(p as object) }));
  }, patch);
}

/** Opens a piece, puts it in Wait mode and presses play. */
async function openWaitRun(page: Page, item: string): Promise<void> {
  await page.goto(`/#/score/${item}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 120_000 });
  // The chunk carries OpenSheetMusicDisplay and the piece has to be fetched
  // and engraved; a stage with no `<svg>` in it is not ready to be measured.
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 120_000 },
  );
  await page.locator('#score-mode').selectOption('wait');
  await page.locator('#score-play').click();
  await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  // `setRunning` freezes the scale 150 ms after the run starts, once the
  // stage has settled into the row the bar gave back. Everything this spec
  // does to the fit has to happen against that frozen size, not before it.
  await page.waitForTimeout(600);
}

function runNow(page: Page): Promise<Run | null> {
  return page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
}

/** Plays the notes the run is waiting for and waits for it to move on. */
async function playStep(page: Page, midi: MidiMock, run: Run): Promise<boolean> {
  const notes = run.expected.length > 0 ? run.expected : run.pitches;
  for (const note of notes) await midi.noteOn(note, 78);
  await page.waitForTimeout(100);
  for (const note of notes) await midi.noteOff(note);
  const moved = await page
    .waitForFunction(
      (was) => {
        const now = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
        return now === null || now.step !== was;
      },
      run.step,
      { timeout: ADVANCE_MS },
    )
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(80);
  return moved;
}

async function playSteps(page: Page, midi: MidiMock, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    const run = await runNow(page);
    expect(run, `the run ended after ${String(i)} steps, before it could be turned`).not.toBeNull();
    if (!run) return;
    const moved = await playStep(page, midi, run);
    expect(moved, `step ${String(run.step)} was played and the run did not move on`).toBe(true);
  }
}

/**
 * The stage, and the ink in every drawn slot.
 *
 * The ink comes from the `.staffline` groups' boxes: one per stave of one
 * system, already carrying the wrapper's transform, so their union is the
 * music as it lands on the glass. `.vf-stave` is the fallback for a build
 * where the group carries the other class (see `tests/states/probe.ts`).
 */
async function shoot(page: Page): Promise<Shot> {
  return page.evaluate(() => {
    const view = document.querySelector<HTMLElement>('#score-stage');
    const box = view?.getBoundingClientRect();
    const inkOf = (host: Element): Ink | null => {
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;
      const found = host.querySelectorAll<SVGGraphicsElement>('.staffline');
      const staves =
        found.length > 0 ? found : host.querySelectorAll<SVGGraphicsElement>('.vf-stave');
      for (const stave of staves) {
        const r = stave.getBoundingClientRect();
        if (r.width <= 0 && r.height <= 0) continue;
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
        top = Math.min(top, r.top);
        bottom = Math.max(bottom, r.bottom);
      }
      if (!(right > left) || !(bottom > top)) return null;
      return { left, right, top, bottom, width: right - left, height: bottom - top };
    };
    // `:not(.score-probe)` says out loud what `is-front` already implies: the
    // measuring probe is a buffer too, and it is never drawn.
    const fronts = document.querySelectorAll<HTMLElement>(
      '#score-stage .score-buffer.is-front:not(.score-probe)',
    );
    const slots = [...fronts]
      .filter((el) => !el.hidden)
      .map((el) => {
        const svg = el.querySelector('svg');
        return {
          slot: el.dataset.slot ?? '?',
          pageWidth: Number.parseFloat(el.style.width) || 0,
          engraved: svg ? Number.parseFloat(svg.getAttribute('width') ?? '') || 0 : 0,
          ink: inkOf(el),
        };
      });
    return {
      stage: box
        ? { left: box.left, right: box.right, width: box.width, height: box.height }
        : null,
      readAhead: view?.dataset.readAhead ?? null,
      layout: view?.dataset.layout ?? null,
      slots,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${String(Math.round((part / whole) * 100))} %` : '?';
}

function px(value: number): string {
  return `${String(Math.round(value))} px`;
}

/**
 * A verdict rather than a boolean.
 *
 * These are polled, and a poll that fails on `false` says only that it never
 * became true. A sentence naming the numbers is the difference between "the
 * rotation test failed" and "the ink filled 58 % of the width".
 */
type Verdict = (shot: Shot) => string;

function verdict(page: Page, check: Verdict): Promise<string> {
  return shoot(page).then(check);
}

/** Re-engraved for the upright stage, filling the width: a turn at one bar. */
const uprightSingle: Verdict = (shot) => {
  const stage = shot.stage;
  if (!stage) return 'there is no stage';
  const notes: string[] = [];
  // **Changed deliberately.** This used to require `single` upright, because
  // one bar per window refused the slot arrangement outright. That drew one bar
  // and left the rest of the phone black — 57 % of the stage used on the owner's
  // own exercise — so how many systems is decided by the room now, and upright
  // is `slots` with whatever count fits (`08` §4.1). What this case is really
  // about is the *turn*: the sheet must be re-engraved for the width it is now,
  // not the sideways chunk squeezed into it, which is what the page and
  // engraving checks below say.
  if (shot.readAhead !== 'slots' && shot.readAhead !== 'single')
    notes.push(`read-ahead is ${String(shot.readAhead)}`);
  const drawn = shot.slots.filter((s) => s.ink !== null);
  if (drawn.length < 1) notes.push(`${String(drawn.length)} slots are drawn`);
  const front = drawn[0];
  const ink = front?.ink;
  if (!ink || !front) notes.push('nothing is drawn');
  else {
    // What was *engraved*, before what it was scaled to.
    //
    // The width alone cannot tell a re-engraved bar from the sideways chunk
    // squeezed to fit: a chunk fitted to the width fills the width, which is
    // how four of these tests passed over a sheet drawn at a quarter size.
    // Turned upright while paused, Hot Cross Buns kept its three-bar 2,340 px
    // page and drew 34 px of music into a 662 px stage. The two lines below
    // are the ones that see it.
    if (front.pageWidth > 0)
      notes.push(
        `the engraver's page is still the sideways chunk's ${px(front.pageWidth)} ` +
          `on a ${px(stage.width)} stage`,
      );
    if (Math.abs(front.engraved - stage.width) > stage.width * 0.15)
      notes.push(`engraved for ${px(front.engraved)} into a ${px(stage.width)} stage`);
    if (ink.width < stage.width * FILLS_WIDTH)
      notes.push(`the ink fills ${pct(ink.width, stage.width)} of the width`);
    if (ink.height >= stage.height)
      notes.push(`the ink is ${px(ink.height)} tall in a ${px(stage.height)} stage`);
  }
  return notes.length === 0 ? 'ok' : notes.join('; ');
};

/** Back sideways: one system again, on a sliding page, filling the height. */
const sidewaysSliding: Verdict = (shot) => {
  const stage = shot.stage;
  if (!stage) return 'there is no stage';
  const notes: string[] = [];
  if (shot.readAhead !== 'single') notes.push(`read-ahead is ${String(shot.readAhead)}`);
  const drawn = shot.slots.filter((s) => s.ink !== null);
  const front = drawn[0];
  if (!front?.ink) notes.push('nothing is drawn');
  else {
    if (front.pageWidth <= stage.width)
      notes.push(
        `the engraver's page is ${px(front.pageWidth)} on a ${px(stage.width)} stage, ` +
          'so there is nothing to slide',
      );
    if (front.ink.height < stage.height * FILLS_HEIGHT_SIDEWAYS)
      notes.push(`the ink fills ${pct(front.ink.height, stage.height)} of the height`);
  }
  return notes.length === 0 ? 'ok' : notes.join('; ');
};

/** Upright at two bars: the slots, each filling the width. */
const uprightSlots: Verdict = (shot) => {
  const stage = shot.stage;
  if (!stage) return 'there is no stage';
  const notes: string[] = [];
  if (shot.readAhead !== 'slots') notes.push(`read-ahead is ${String(shot.readAhead)}`);
  const drawn = shot.slots.filter((s) => s.ink !== null);
  // The handoff says two. Two is the minimum, not the number: a phone tall
  // enough for more systems at the same size gets three or four
  // (`chooseSlotCount`), and a run holds whatever it started with. What must
  // be true of every one of them is the width.
  if (drawn.length < 2) notes.push(`${String(drawn.length)} slots are drawn`);
  for (const slot of drawn) {
    const ink = slot.ink;
    if (!ink) continue;
    if (ink.width < stage.width * FILLS_WIDTH)
      notes.push(`slot ${slot.slot} fills ${pct(ink.width, stage.width)} of the width`);
  }
  return notes.length === 0 ? 'ok' : notes.join('; ');
};

/**
 * The music is inside the stage and fills it — the fit is for the stage as it
 * is now, not for one it used to be.
 *
 * Both halves matter and they catch opposite mistakes: a fit left over from a
 * wider stage runs off the right edge, and one left over from a narrower
 * stage leaves the width unfilled.
 */
const fittedToThisWidth: Verdict = (shot) => {
  const stage = shot.stage;
  if (!stage) return 'there is no stage';
  const notes: string[] = [];
  const drawn = shot.slots.filter((s) => s.ink !== null);
  if (drawn.length === 0) notes.push('nothing is drawn');
  for (const slot of drawn) {
    const ink = slot.ink;
    if (!ink) continue;
    // The fit insets by 6 px, so the ink stops that short of the edge; 2 px
    // of tolerance is for the rounding, not for an overflow.
    if (ink.right > stage.right + 2)
      notes.push(`slot ${slot.slot} runs ${px(ink.right - stage.right)} past the right edge`);
    if (ink.width < stage.width * FILLS_WIDTH)
      notes.push(`slot ${slot.slot} fills ${pct(ink.width, stage.width)} of the width`);
  }
  return notes.length === 0 ? 'ok' : notes.join('; ');
};

for (const piece of PIECES) {
  for (const size of SIZES) {
    test.describe(`${piece.name} · one bar per window · ${size.name}`, () => {
      test.describe.configure({ timeout: 240_000 });

      test('sideways, upright, and back: the music fills the screen each way up', async ({
        page,
      }) => {
        await withSettings(page, { barsPerWindow: 1 });
        const midi = await installMidiMock(page, { permission: 'granted' });
        await page.setViewportSize(size.sideways);
        await openWaitRun(page, piece.id);
        await expect(page.locator('#score-stage')).toHaveAttribute('data-read-ahead', 'single');

        // Three steps, so the run is under way and the sheet has slid at
        // least once before the phone moves. A turn from the very first step
        // is a different (easier) case: nothing has been fitted twice yet.
        await playSteps(page, midi, 3);

        await page.setViewportSize(size.upright);
        await expect
          .poll(() => verdict(page, uprightSingle), { timeout: AFTER_TURN_MS })
          .toBe('ok');

        await page.setViewportSize(size.sideways);
        // One step after the turn. The arrangement did not change — one bar
        // is a single system both ways up — so `stageChanged` re-fits without
        // re-drawing, and the sliding chunk with its bars to read into comes
        // back at the next window the run asks for. See the report: this is
        // the one place where "assert it slides again" needed a step to be
        // true of the app as it stands.
        await playSteps(page, midi, 1);
        await expect
          .poll(() => verdict(page, sidewaysSliding), { timeout: AFTER_TURN_MS })
          .toBe('ok');
      });
    });
  }

  test.describe(`${piece.name} · two bars per window · round`, () => {
    test.describe.configure({ timeout: 240_000 });

    test('a turn to upright gives the slots, each filling the width', async ({ page }) => {
      const size = SIZES[0];
      await withSettings(page, { barsPerWindow: 2 });
      const midi = await installMidiMock(page, { permission: 'granted' });
      await page.setViewportSize(size.sideways);
      await openWaitRun(page, piece.id);
      // Sideways two bars are still one system: the slide, not the slots.
      await expect(page.locator('#score-stage')).toHaveAttribute('data-read-ahead', 'single');

      await playSteps(page, midi, 3);

      await page.setViewportSize(size.upright);
      await expect.poll(() => verdict(page, uprightSlots), { timeout: AFTER_TURN_MS }).toBe('ok');

      await page.setViewportSize(size.sideways);
      await playSteps(page, midi, 1);
      await expect
        .poll(() => verdict(page, sidewaysSliding), { timeout: AFTER_TURN_MS })
        .toBe('ok');
    });
  });
}

test.describe('the edges the handoff names', () => {
  test.describe.configure({ timeout: 240_000 });

  test('turning while paused re-fits, and leaves the run paused', async ({ page }) => {
    // A pause is where a learner reaches for the phone, so it is where a turn
    // is most likely. Nothing draws in Wait mode until a note arrives, and a
    // paused run will not take one: if the turn does not re-fit by itself the
    // sheet stays at the old size for as long as the pause lasts, which is
    // the "indefinitely" `stageChanged` was written for.
    const size = SIZES[0];
    await withSettings(page, { barsPerWindow: 1 });
    const midi = await installMidiMock(page, { permission: 'granted' });
    await page.setViewportSize(size.sideways);
    await openWaitRun(page, 'song.folk.hot-cross-buns');
    await playSteps(page, midi, 2);

    // Through the bar, the way a person does. Two steps into a Wait run
    // sideways the chrome has folded itself away (`08` §9.20) and the stage is
    // extended underneath it, so a bare click on `#score-play` is taken by the
    // stage: the first run of this spec spent its whole four-minute budget
    // being told `#score-stage` intercepts pointer events. One tap on the
    // sheet always brings the bar back (§9.34); `pressControl` does that.
    await pressControl(page, '#score-play');
    await expect.poll(async () => (await runNow(page))?.paused ?? null).toBe(true);

    await page.setViewportSize(size.upright);
    await expect.poll(() => verdict(page, uprightSingle), { timeout: AFTER_TURN_MS }).toBe('ok');
    // Still paused, and still a run: a re-fit must not be a restart.
    const after = await runNow(page);
    expect(after, 'the turn ended the run').not.toBeNull();
    expect(after?.paused, 'the turn resumed a paused run').toBe(true);
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-running', 'true');
  });

  test('two turns 100 ms apart: the second measurement wins', async ({ page }) => {
    // Turning a phone twice in a second is one gesture as far as the person
    // holding it is concerned, and the fit is scheduled rather than immediate.
    // A fit that lands with the first box and is never asked again is a stale
    // fit, and it shows up as ink cut to a stage that is no longer there.
    await withSettings(page, { barsPerWindow: 1 });
    const midi = await installMidiMock(page, { permission: 'granted' });
    await page.setViewportSize({ width: 780, height: 360 });
    await openWaitRun(page, 'song.classical.ode-to-joy.rh');
    await playSteps(page, midi, 3);

    // Wide, then narrow. A fit left over from the 480 px stage overflows a
    // 320 px one by a third of the music.
    await page.setViewportSize({ width: 480, height: 780 });
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 320, height: 780 });
    await expect
      .poll(() => verdict(page, fittedToThisWidth), { timeout: AFTER_TURN_MS })
      .toBe('ok');

    // And narrow, then wide, which fails the other way: a fit left over from
    // the 320 px stage leaves two thirds of a 480 px one empty.
    await page.setViewportSize({ width: 320, height: 780 });
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 480, height: 780 });
    await expect
      .poll(() => verdict(page, fittedToThisWidth), { timeout: AFTER_TURN_MS })
      .toBe('ok');
  });

  test('Scroll: a turn engraves the piece again at the new width', async ({ page }) => {
    // Scroll draws the whole piece as one sheet and the learner scrolls it,
    // so the engraver's line breaks *are* the layout: a sheet laid out for
    // 740 px and then scaled into 342 px is the wrong sheet, whatever size it
    // is drawn at. `ensureScrollRender` compares the buffer's `engravedWidth`
    // with the stage's and re-renders when they differ; that field is private
    // and not on the `scoreFit` hook, so what is measured here is the page
    // OSMD actually laid out into — the `<svg>`'s own width attribute, which
    // is the number `engravedWidth` records.
    await withSettings(page, { layout: 'scroll' });
    await installMidiMock(page, { permission: 'granted' });
    await page.setViewportSize({ width: 740, height: 342 });
    await openWaitRun(page, 'song.classical.ode-to-joy.rh');
    await expect(page.locator('#score-stage')).toHaveAttribute('data-layout', 'scroll');
    // Scroll has one sheet and no slots, whichever way up the phone is.
    await expect(page.locator('#score-stage')).toHaveAttribute('data-read-ahead', 'single');

    const before = await shoot(page);
    const wideStage = before.stage?.width ?? 0;
    const wideEngraved = before.slots[0]?.engraved ?? 0;
    expect(wideStage, 'the stage has no width').toBeGreaterThan(0);
    expect(
      Math.abs(wideEngraved - wideStage),
      `sideways the piece was engraved for ${px(wideEngraved)} into a ${px(wideStage)} stage`,
    ).toBeLessThan(wideStage * 0.15);

    await page.setViewportSize({ width: 342, height: 740 });
    await expect
      .poll(
        async () => {
          const shot = await shoot(page);
          const stage = shot.stage;
          const engraved = shot.slots[0]?.engraved ?? 0;
          if (!stage) return 'there is no stage';
          if (Math.abs(engraved - stage.width) > stage.width * 0.15)
            return `engraved for ${px(engraved)} into a ${px(stage.width)} stage`;
          return 'ok';
        },
        { timeout: AFTER_TURN_MS },
      )
      .toBe('ok');

    // And it really is a different engraving, not the same one re-measured.
    const after = await shoot(page);
    expect(
      after.slots[0]?.engraved ?? 0,
      'the piece was not laid out again for the narrower stage',
    ).toBeLessThan(wideEngraved - 10);
  });

  test("the tour's miniature does not follow the window", async ({ page }) => {
    // The miniature is a picture of a phone, not a view of this window: it is
    // built with an explicit `orientation`, which `updateReadAhead` prefers
    // over `window.innerHeight > window.innerWidth`. So the promise "this is
    // how it will look upright" has to survive the reader turning the device
    // he is reading it on — otherwise the tour shows him the arrangement he
    // is holding rather than the one he is choosing.
    await withSettings(page, { barsPerWindow: 2 });
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/#/settings/setup');
    const tour = page.locator('[data-screen="setup"]');
    await expect(tour).toBeVisible({ timeout: 120_000 });
    await expect(tour).toHaveAttribute('data-setup-step', 'welcome');
    // Step by step rather than four clicks in a row: the hold step builds a
    // miniature of its own, and a click that lands before the step it belongs
    // to has rendered would skip one silently.
    for (const step of ['hold', 'piano', 'sound', 'display']) {
      await page.locator('#setup-next').click();
      await expect(tour).toHaveAttribute('data-setup-step', step, { timeout: 60_000 });
    }

    await page.locator('#setup-preview-open').click();
    const frame = page.locator('#setup-preview');
    const mini = page.locator('#setup-preview .score-view');
    await expect(frame.locator('svg').first()).toBeVisible({ timeout: 120_000 });
    // Flipped to upright on purpose: the two slots are the arrangement a
    // sideways *window* would never choose, so following the window would be
    // unmissable rather than a coincidence.
    if ((await frame.getAttribute('data-orientation')) !== 'upright') {
      await page.locator('#setup-preview-flip').click();
    }
    await expect(frame).toHaveAttribute('data-orientation', 'upright');
    await expect(mini).toHaveAttribute('data-read-ahead', 'slots', { timeout: 60_000 });

    for (const size of [
      { width: 780, height: 360 },
      { width: 360, height: 780 },
      { width: 740, height: 342 },
    ]) {
      await page.setViewportSize(size);
      // The claim is that nothing happens, and nothing takes time to happen:
      // long enough for a resize handler, a `ResizeObserver` and a re-draw to
      // have had their chance.
      await page.waitForTimeout(1_500);
      const seen = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
      expect(seen.width, 'the viewport did not actually change').toBe(size.width);
      await expect(
        mini,
        `the miniature followed the window at ${String(size.width)} × ${String(size.height)}`,
      ).toHaveAttribute('data-read-ahead', 'slots');
      await expect(frame).toHaveAttribute('data-orientation', 'upright');
    }
  });
});
