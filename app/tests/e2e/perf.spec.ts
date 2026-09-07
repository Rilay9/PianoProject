/**
 * The budgets in docs/01 §6, measured under CPU throttling (P9).
 *
 * The budgets are about a Galaxy S25 and this runs on a CI box, so the ×4
 * throttle is a proxy and not the phone. That is worth being honest about: a
 * green run here means "not obviously too slow", and the number that settles
 * it is the one in a debug report pasted from the actual device. What this
 * *does* catch is a regression — a pre-render that stopped happening, a paint
 * that started doing layout work — which is the failure that would otherwise
 * be found months later on a music stand.
 *
 * ×4 is Chrome DevTools' own "mid-tier mobile" setting. The S25 is a fast
 * phone, so if anything this is pessimistic, which is the direction a budget
 * test should err in.
 */
import { expect, test, type CDPSession, type Page } from '@playwright/test';

import { withScoreMenu } from './scoreControls';
import { openDevScore } from './fixtures/devScore';
import { installMidiMock } from './fixtures/midiMock';

/** Chrome DevTools' mid-tier phone proxy. */
const CPU_THROTTLE = 4;

const ITEM = 'song.folk.hot-cross-buns';
const MELODY = [64, 62, 60, 64, 62, 60, 60, 60, 60, 60];

async function throttle(page: Page): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE });
  return client;
}

test.describe('performance budgets (docs/01 §6)', () => {
  test.setTimeout(180_000);

  test('a cold 2-bar window renders inside the first-render budget', async ({ page }) => {
    await throttle(page);
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.setBars(2);
    await dev.showStep(0);

    // `timeShowStep` on a window already on screen measures nothing — it was
    // reporting 0.3 ms, which is a no-op and not a render. `timeWindowRender`
    // forces the draw the budget is actually about.
    const samples: number[] = [];
    for (let i = 0; i < 5; i += 1) samples.push(await dev.timeWindowRender());
    const median = [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)] ?? NaN;
    console.log(
      `2-bar window render, CPU ×${String(CPU_THROTTLE)}: median ${median.toFixed(1)} ms ` +
        `(${samples.map((sample) => sample.toFixed(1)).join(', ')})`,
    );

    // 150 ms is the S25 budget and score.spec.ts holds that line unthrottled.
    // Here the CPU is deliberately four times slower, so the gate is four
    // times wider: what this catches is a render that got structurally slower,
    // not a machine that is busy.
    expect(median).toBeLessThan(600);
  });

  test('a pre-rendered window swap still fits in a frame when throttled', async ({ page }) => {
    await throttle(page);
    const dev = await openDevScore(page);
    // A long fixture, for one reason: with one bar to a window, the number of
    // pre-rendered swaps there are to measure is the number of bar lines in
    // the piece. `tempo-change` has three bars and yields two swaps; the
    // arpeggios have two bars and yield one. Hanon No. 1 has twenty-nine.
    await dev.load('exercise.hanon.01.both');
    await dev.setBars(1);
    await dev.showStep(0);

    // Walk forward far enough to cross several window boundaries, then read
    // the renderer's own record of the swaps.
    //
    // Two things were wrong with timing `showStep` from out here. It also
    // times `positionBand`, which forces a layout — so the number asserted was
    // never the one `01` §6 budgets — and it cannot tell a fast swap from a
    // call that swapped nothing at all, which is how a budget test comes to
    // pass by measuring a no-op. `window.swap` is recorded only when a
    // pre-rendered buffer is actually brought forward, so no swaps means no
    // samples and the test says so.
    //
    // A median, too, for the reason the render test above takes one: a single
    // sample on a throttled, contended CPU catches a collection now and then.
    // P19 measured this at 4.2 ms; one sample in a fourteen-worker run came
    // back at 21.1 ms. The budget is unchanged.
    // One step at a time, with a beat between, because the *next* window is
    // drawn in a requestAnimationFrame after each move: jumping straight to
    // the step after that finds nothing prepared and records a cold draw
    // instead. Six jumps recorded two prepared swaps; walking records one per
    // bar line crossed.
    await dev.clearTimings();
    const steps = Math.min(await dev.stepCount(), 160);
    for (let step = 4; step < steps; step += 4) {
      await dev.showStep(step);
      await page.waitForTimeout(30);
    }
    const samples = await dev.swapTimings();
    if (samples.length < 8) {
      console.log(`timings by label: ${JSON.stringify(await dev.timingCounts())}`);
    }
    expect(
      samples.length,
      'the double buffer stopped pre-rendering: no prepared swaps were recorded',
    ).toBeGreaterThanOrEqual(8);
    const median = [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)] ?? NaN;
    console.log(
      `pre-rendered swap, CPU ×${String(CPU_THROTTLE)}: median ${median.toFixed(2)} ms ` +
        `over ${String(samples.length)} swaps ` +
        `(${samples.map((sample) => sample.toFixed(2)).join(', ')})`,
    );
    // The whole point of the double buffer: a swap is a class toggle, so
    // throttling the CPU fourfold should barely move it.
    expect(median).toBeLessThan(16.7);
  });

  test('the longest score in the library opens on the Score screen (P19)', async ({ page }) => {
    // 780 printed bars and 3,331 steps, the largest thing the owner can open.
    // The render check engraves a whole score to measure it; this is the
    // question the *app* asks, which is different and is the one that matters:
    // how long until the first window of bars is on the screen. The window
    // renderer exists precisely so that this is not a function of the length
    // of the piece, and this is the test that says so.
    await throttle(page);
    const started = Date.now();
    await page.goto('/#/score/song.classical.chopin-scherzo-2.nifc');
    await expect(page.locator('[data-screen="score"]')).toBeVisible();
    // Engraved staves in the stage, not the status line changing. `toBeVisible`
    // is wrong here: the renderer draws into two buffers and the one it draws
    // into first is the hidden one, which is the whole trick that makes a
    // window swap fit in a frame.
    await expect
      .poll(async () => page.locator('#score-stage svg .vf-measure').count(), {
        timeout: 120_000,
        message: 'no engraved bars appeared',
      })
      .toBeGreaterThan(0);
    const firstWindowMs = Date.now() - started;
    console.log(
      `longest score (780 bars), CPU ×${String(CPU_THROTTLE)}: first window in ${String(firstWindowMs)} ms`,
    );
    // Generous, and deliberately so: this is a throttled desktop and the
    // number that settles it comes from the S25. What it catches is the first
    // window becoming a function of the whole score's length.
    expect(firstWindowMs).toBeLessThan(60_000);
    await expect(page.locator('#score-status')).not.toContainText('Could not open');
  });

  test('a played note is coloured within the input-to-colour budget', async ({ page }) => {
    const midi = await installMidiMock(page, { permission: 'granted' });
    const client = await throttle(page);

    await page.goto(`/#/score/${ITEM}`);
    await page.waitForFunction(
      () => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      },
      undefined,
      { timeout: 120_000 },
    );
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('midi');
    });
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-hands-R').click();
    await page.locator('#score-play').click();

    for (const note of MELODY) {
      await midi.noteOn(note, 90);
      await midi.noteOff(note);
    }
    // The measurement is taken inside the app (ScoreSession stamps the input
    // and the paint closes the loop), so it is the span the budget names and
    // not a round trip through the test harness.
    await page.waitForTimeout(500);

    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    // The timing log is module state, so it survives a route change but not a
    // reload — and `page.goto` to a new hash reloads. Moving the hash keeps
    // the same document, which is the whole point of reading it here.
    await page.evaluate(() => {
      window.location.hash = '#/settings/diagnostics';
    });
    await expect(page.locator('#diag-timings')).toBeVisible();
    const text = (await page.locator('#diag-timings').textContent()) ?? '';
    console.log(`render timings, CPU ×${String(CPU_THROTTLE)}: ${text}`);

    /** Diagnostics renders one row per label with no separator between them. */
    const meanOf = (label: string): number | undefined => {
      const match = new RegExp(`${label.replace('.', '\\.')}n=(\\d+) mean ([\\d.]+) ms`).exec(text);
      return match ? Number(match[2]) : undefined;
    };

    const toColour = meanOf('input.toColour');
    expect(toColour, 'no input.toColour timing was recorded').toBeDefined();
    // The budget itself (`01` §6), asserted at the throttled figure because
    // that is the pessimistic one: measured 13 ms mean here against 30.
    expect(toColour).toBeLessThan(30);

    // The double buffer is what makes the swap free; if it ever stops
    // happening this is the number that moves, long before anything looks
    // wrong on screen.
    const swap = meanOf('window.swap');
    expect(swap, 'no pre-rendered window swap was recorded').toBeDefined();
    expect(swap).toBeLessThan(16.7);

    // A frame that is expensive while nothing changes eats the budget the
    // next paint needs.
    const frame = meanOf('session.frame');
    expect(frame).toBeDefined();
    expect(frame).toBeLessThan(8);
  });
});
