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
    await dev.load('tempo-change');
    await dev.setBars(1);
    await dev.showStep(0);

    const elapsed = await dev.timeShowStep(2);
    console.log(`pre-rendered swap, CPU ×${String(CPU_THROTTLE)}: ${elapsed.toFixed(2)} ms`);
    // The whole point of the double buffer: a swap is a class toggle, so
    // throttling the CPU fourfold should barely move it.
    expect(elapsed).toBeLessThan(16.7);
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
    await page.locator('#score-input').selectOption('midi');
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
