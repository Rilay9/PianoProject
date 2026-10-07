/**
 * The double-tap loops the bars the learner tapped (LB1, Entry 261).
 *
 * latin.4, latin.6 and latin.7 tell the learner to "double-tap the first bar,
 * then the last"; A7c.1's record steps 18, 20 and 23 need a loop of named
 * bars (*The Crave* 21-22, *Por Una Cabeza* 1-14, the aria's bars). Until LB1
 * the Score screen's `measureAt` found no `data-measure` anywhere on the page
 * and answered every tap with the window's first bar, so a learner who tapped
 * bar 21 and bar 22 got a loop on whatever bar the window started with.
 *
 * Each case reaches the bars the way a learner does on a phone held upright:
 * the window shows the start of the piece at rest, so the run is played in
 * Wait (through the mock piano, asking the run for its notes) until the
 * counter reads the loop's first bar, paused, and that bar double-tapped on
 * the white of its staff, where a finger meets the page rather than a stroke.
 * Where the last bar is not on the screen yet the run carries on until the
 * counter reads it, and that bar is double-tapped on one of its notes. Which
 * bar a point belongs to is read from the notes' own `data-bar` (the source
 * measure index the renderer has always written), not from the attribute the
 * change adds. The bar numbers asserted are the counter's: `#score-where`,
 * which numbers a pickup 0 (*Por Una Cabeza*).
 *
 * Then the loop: the route's `data-loop` and the Loop control name the two
 * bars, and the run, carried on, plays the first bar to the last and comes
 * round to the first without leaving them. A looped run reaches no summary
 * until the loop is let go (`04` §5), so the lap is read from the run itself.
 *
 * And the long-press (B4), which read the same function: held on a bar that
 * is not the window's first, it plays that bar and says its number.
 *
 * Nothing here is heard.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { pressControl } from './scoreControls';

type Run = { step: number; expected: number[]; bar: number; paused: boolean } | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };

const UPRIGHT = { width: 390, height: 844 };

async function open(page: Page, item: string): Promise<void> {
  await page.setViewportSize(UPRIGHT);
  await page.goto(`/#/score/${item}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
  await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 });
  await expect(page.locator('#score-stage')).toHaveAttribute('data-settled', 'true', { timeout: 30_000 });
}

/** The bar the counter prints: `bar N / M`. */
async function counter(page: Page): Promise<number> {
  const text = (await page.locator('#score-where').textContent()) ?? '';
  const match = /bar (\d+) \//.exec(text);
  return match ? Number(match[1]) : Number.NaN;
}

async function run(page: Page): Promise<Run> {
  return page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
}

/** One step's notes through the mock piano, then waits for the run to move on. */
async function playStep(page: Page, midi: MidiMock, now: NonNullable<Run>): Promise<void> {
  for (const note of now.expected) await midi.noteOn(note, 78);
  await page.waitForTimeout(40);
  for (const note of now.expected) await midi.noteOff(note);
  await page
    .waitForFunction(
      (was) => {
        const next = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
        return next === null || next.step !== was;
      },
      now.step,
      { timeout: 4_000 },
    )
    .catch(() => undefined);
}

/** Plays in Wait until the counter prints `printed`; returns the source index of that bar. */
async function playUntil(page: Page, midi: MidiMock, printed: number): Promise<number> {
  for (let i = 0; i < 1_500; i += 1) {
    const now = await run(page);
    expect(now, `the run ended before the counter read bar ${String(printed)}`).not.toBeNull();
    if (!now) break;
    if ((await counter(page)) === printed) return now.bar;
    await playStep(page, midi, now);
  }
  throw new Error(`never reached bar ${String(printed)}`);
}

async function pause(page: Page): Promise<void> {
  await pressControl(page, '#score-play');
  await expect.poll(async () => (await run(page))?.paused ?? null).toBe(true);
  // The bar folds and unfolds over the stage; the music does not move under it.
  await page.waitForTimeout(300);
}

async function resume(page: Page): Promise<void> {
  await pressControl(page, '#score-play');
  await expect.poll(async () => (await run(page))?.paused ?? null).toBe(false);
}

/**
 * A point on the screen inside bar `index` (a source measure index): on one
 * of its notes, or on the white of its staff, where no stroke of any bar is.
 * Null when the bar has no note drawn on the screen.
 */
async function pointIn(page: Page, index: number, on: 'note' | 'white'): Promise<{ x: number; y: number } | null> {
  return page.evaluate(
    ({ index, on }) => {
      const stage = document.querySelector('#score-stage')!.getBoundingClientRect();
      const inside = (x: number, y: number): boolean =>
        x > stage.left + 2 && x < stage.right - 2 && y > stage.top + 2 && y < stage.bottom - 2;
      const notes = [
        ...document.querySelectorAll<SVGGElement>(
          `#score-stage .score-buffer.is-front:not(.score-probe) .score-note[data-bar="${String(index)}"]`,
        ),
      ]
        .map((note) => ({ note, box: note.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0 && inside(box.left + box.width / 2, box.top + box.height / 2));
      if (notes.length === 0) return null;
      if (on === 'note') {
        const { box } = notes[Math.floor(notes.length / 2)];
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      }
      // The white of the staff: between the bar's first and last notes across,
      // inside its staff group's middle third up and down, on no stroke.
      const group = notes[0].note.closest('.vf-measure');
      if (!group) return null;
      const rows = group.getBoundingClientRect();
      const left = Math.min(...notes.map(({ box }) => box.left));
      const right = Math.max(...notes.map(({ box }) => box.right));
      for (let fx = 0.5; fx < 1; fx += 0.07) {
        for (const sign of [1, -1]) {
          const x = left + (right - left) * (sign > 0 ? fx : 1 - fx);
          for (let fy = 0.34; fy <= 0.66; fy += 0.04) {
            const y = rows.top + rows.height * fy;
            if (!inside(x, y)) continue;
            const hit = document.elementFromPoint(x, y);
            if (hit && hit.closest('.vf-measure') === null && hit.closest('#score-stage') !== null) return { x, y };
          }
        }
      }
      return null;
    },
    { index, on },
  );
}

async function doubleTap(page: Page, index: number, on: 'note' | 'white'): Promise<void> {
  const point = await pointIn(page, index, on);
  expect(point, `bar index ${String(index)} has no ${on} point on the screen`).not.toBeNull();
  await page.mouse.dblclick(point!.x, point!.y);
}

/**
 * Sets the loop `from`-`to` (printed numbers) by double-tapping, as a learner
 * does, and checks that the run then laps those bars and no others.
 */
async function loopByTapping(page: Page, item: string, from: number, to: number): Promise<void> {
  const midi = await installMidiMock(page, { permission: 'granted' });
  await open(page, item);
  await page.locator('#score-mode').selectOption('wait');
  await pressControl(page, '#score-play');
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');

  const first = await playUntil(page, midi, from);
  // Printed `from` is source index `first`; the bars between are consecutive.
  const last = first + (to - from);
  await pause(page);
  await doubleTap(page, first, 'white');
  await expect(page.locator('#score-status')).toHaveText(new RegExp(`Loop start: bar ${String(from)}\\b`));

  if ((await pointIn(page, last, 'note')) === null) {
    await resume(page);
    await playUntil(page, midi, to);
    await pause(page);
  }
  await doubleTap(page, last, 'note');

  const screen = page.locator('section[data-screen="score"]');
  await expect(screen).toHaveAttribute('data-loop', `${String(from)}-${String(to)}`);
  await expect(page.locator('#score-loop')).toHaveText(new RegExp(`Bars ${String(from)}–${String(to)}`));

  // The run starts again at the loop's first bar, held paused (C2) …
  await expect.poll(async () => (await run(page))?.bar ?? null).toBe(first);
  await resume(page);
  // … and plays the bars to the last and comes round, never leaving them.
  const visited = new Set<number>();
  let reachedLast = false;
  let lapped = false;
  for (let i = 0; i < 1_500 && !lapped; i += 1) {
    const now = await run(page);
    expect(now, 'the looped run ended').not.toBeNull();
    if (!now) break;
    visited.add(now.bar);
    if (now.bar === last) reachedLast = true;
    else if (reachedLast && now.bar === first) lapped = true;
    if (!lapped) await playStep(page, midi, now);
  }
  expect(lapped, `the run came round to bar ${String(from)} after bar ${String(to)}`).toBe(true);
  expect([...visited].every((bar) => bar >= first && bar <= last), `bars visited: ${[...visited].join(', ')}`).toBe(
    true,
  );
}

test.describe('a loop of the bars double-tapped', () => {
  test.setTimeout(300_000);

  test('The Crave: bars 21 and 22 double-tapped loop bars 21-22', async ({ page }) => {
    await loopByTapping(page, 'song.jazz.the-crave', 21, 22);
  });

  test('one staff (the aria’s left-hand cut): bars 7 and 9 loop bars 7-9', async ({ page }) => {
    await loopByTapping(page, 'excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh', 7, 9);
  });

  test('Por Una Cabeza, after its pickup bar 0: bars 1 and 14 loop bars 1-14', async ({ page }) => {
    await loopByTapping(page, 'song.folk.por-una-cabeza-carlos-gardel.pdmx', 1, 14);
  });
});

test.describe('a long-press plays the bar held (B4)', () => {
  test('held on a bar that is not the window’s first, it plays that bar', async ({ page }) => {
    await open(page, 'song.jazz.the-crave');
    await page.locator('#score-mode').selectOption('wait');
    // The last bar with a note on the screen at rest, which is not the first.
    const index = await page.evaluate(() => {
      const stage = document.querySelector('#score-stage')!.getBoundingClientRect();
      let best = -1;
      for (const note of document.querySelectorAll<SVGGElement>(
        '#score-stage .score-buffer.is-front:not(.score-probe) .score-note',
      )) {
        const box = note.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        if (box.width > 0 && x > stage.left && x < stage.right && y > stage.top && y < stage.bottom) {
          best = Math.max(best, Number(note.dataset.bar));
        }
      }
      return best;
    });
    expect(index, 'a second bar on the screen at rest').toBeGreaterThan(0);
    // The counter's number for it: the piece has no pickup, so index + 1.
    await expect(page.locator('#score-where')).toHaveText(/bar 1 \//);
    const point = await pointIn(page, index, 'white');
    expect(point).not.toBeNull();
    await page.mouse.move(point!.x, point!.y);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();
    // Whichever bar it plays, it says so while it plays; then which one.
    const status = page.locator('#score-status');
    await expect(status).toHaveText(/as written/, { timeout: 10_000 });
    expect(await status.textContent()).toBe(`Bar ${String(index + 1)}, as written`);
  });
});
