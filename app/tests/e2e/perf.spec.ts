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
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type CDPSession, type Page } from '@playwright/test';

import { withScoreMenu } from './scoreControls';
import { openDevScore } from './fixtures/devScore';
import { installMidiMock } from './fixtures/midiMock';

/** Chrome DevTools' mid-tier phone proxy. */
const CPU_THROTTLE = 4;

/**
 * The one budget in `01` §6 that is about a *first paint*: 150 ms for the
 * first render of a 2-bar window on the S25.
 *
 * The two tests at the foot of this file are about the two screens the
 * catalog grew — a list of 2,000-odd rows behind a filter, and a rung with
 * fifty options on it — and neither has a budget of its own. Rather than
 * invent a number measured on this laptop, they are held to a *relationship*:
 * **a screen of text rows must not cost more than engraving two bars of
 * music**, which is the most expensive first paint the app has a figure for.
 * The arithmetic against the throttle is the same one the 2-bar render test
 * does above, and for the same reason.
 */
const FIRST_RENDER_BUDGET_MS = 150;
const THROTTLED_GATE_MS = FIRST_RENDER_BUDGET_MS * CPU_THROTTLE;

/** The phone the screens are laid out for (`04`, and `setup.spec.ts`'s sizes). */
const PHONE = { width: 342, height: 740 };

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
    // Sideways, deliberately. `window.swap` is recorded by the *chunk* path —
    // one system that slides, with the next window pre-rendered into the spare
    // buffer and brought forward. Upright the arrangement is slots, where the
    // equivalent work is the vacated slot being re-drawn on idle
    // (`window.settle`), and no swap is ever recorded.
    //
    // It used to reach the chunk path by accident: one bar per window refused
    // the slot arrangement outright, so `setBars(1)` below was enough. That
    // refusal is gone — how many systems the screen holds is decided by the
    // room now — so this asks for the arrangement it means to measure instead
    // of relying on a side effect of the setting.
    await page.setViewportSize({ width: 780, height: 360 });
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
    // **Revised 2026-09-25 (test class: revise).** The notes are played at
    // normal speed. The budget (`01` §6, under 30 ms from MIDI-in to the
    // note coloured) is a phone's budget at the phone's speed, and asserting
    // it at ×4 throttle rested on this machine having measured 13 ms there:
    // a number measured on one machine, which `00-invariants` §2 forbids as an
    // assertion. CI's runner read 26–43 ms across seven runs in one day and
    // failed about half of them on the same code. The sheet's first-render
    // budgets above stay throttled, gated at THROTTLED_GATE_MS as they were.
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });

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
    // The budget itself (`01` §6), at normal speed (see the revision above).
    expect(toColour).toBeLessThan(30);

    // The double buffer is what makes the swap free; if it ever stops
    // happening this is the number that moves, long before anything looks
    // wrong on screen.
    // Sideways the sheet is engraved in chunks — the window, two bars behind
    // and two ahead — and a piece this short fits in one, so there may be no
    // swap to record at all (P21e A3). When there is one, it must be free.
    const swap = meanOf('window.swap');
    if (swap !== undefined) expect(swap).toBeLessThan(16.7);

    // A frame that is expensive while nothing changes eats the budget the
    // next paint needs.
    const frame = meanOf('session.frame');
    expect(frame).toBeDefined();
    expect(frame).toBeLessThan(8);
  });
});

/**
 * The two screens the catalog grew (T26 item 3).
 *
 * Everything above is about the Score screen, because that is where the
 * budgets in `01` §6 were written and because engraving is the expensive
 * thing the app does. Two screens have since grown by an order of magnitude
 * without anybody timing them: the **Library**, which filters and searches a
 * catalog of two thousand rows on every keystroke, and a **lesson page**,
 * whose biggest rung now lists fifty-odd options. Both are lists of text on a
 * phone, so both should be far inside the budget — and both have exactly the
 * shape that goes quietly quadratic: a filter that re-reads the catalog, or a
 * page that renders every option before the first one is on screen.
 *
 * What is measured is **time to the first row on screen** — in the document
 * *and* laid out, because a row in the DOM that has not been positioned is
 * not on a screen. It is taken inside the page, the way the input-to-colour
 * figure above is, so it is the span the app spends and not a round trip
 * through the test harness.
 *
 * **Nothing here is about sound**, and none of the numbers printed is
 * asserted: the gate is the relationship in `THROTTLED_GATE_MS`.
 */
interface CatalogRow {
  id: string;
  tracks?: string[];
}

interface CurriculumFile {
  stages: {
    units: { lessons: { id: string; exerciseOptions?: string[]; songOptions?: string[] }[] }[];
  }[];
}

function catalogRows(): CatalogRow[] {
  return JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as CatalogRow[];
}

/** The rungs with the most and the fewest options, read from the build. */
function rungsByOptionCount(): { most: string; fewest: string; mostCount: number; fewestCount: number } {
  const built = JSON.parse(
    readFileSync(resolve('public/content/curriculum.json'), 'utf8'),
  ) as CurriculumFile;
  let most: { id: string; n: number } | null = null;
  let fewest: { id: string; n: number } | null = null;
  for (const stage of built.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        const n = (lesson.exerciseOptions ?? []).length + (lesson.songOptions ?? []).length;
        if (n === 0) continue;
        if (!most || n > most.n) most = { id: lesson.id, n };
        if (!fewest || n < fewest.n) fewest = { id: lesson.id, n };
      }
    }
  }
  expect(most, 'no rung in the built curriculum lists any option').toBeTruthy();
  expect(fewest, 'no rung in the built curriculum lists any option').toBeTruthy();
  return {
    most: most?.id ?? '',
    fewest: fewest?.id ?? '',
    mostCount: most?.n ?? 0,
    fewestCount: fewest?.n ?? 0,
  };
}

/** How long one in-page action takes to put a laid-out row on the screen. */
interface Drawn {
  ms: number;
  rows: number;
  first: number;
}

test.describe('the two screens the catalog grew (T26)', () => {
  test.setTimeout(180_000);

  test('the Library answers every genre filter, and the search box, inside the first-paint budget', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE);
    await throttle(page);
    await page.goto('/#/library');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 120_000 });

    // The filters live behind one chip (`04` §0 R1), so they are opened the
    // way a person opens them before anything is driven.
    await page.locator('#library-filter-toggle').click();
    await expect(page.locator('#library-filters')).toBeVisible();

    const tracks = await page
      .locator('#library-track option')
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
    // Every genre the Library offers, not a sample of them: the filters are
    // derived from the catalog's own `tracks`, so this is the whole list.
    const genres = tracks.filter((value) => value !== 'all');
    expect(genres.length, 'the Library offers no genre filter to measure').toBeGreaterThan(0);
    const catalogTracks = new Set(catalogRows().flatMap((row) => row.tracks ?? []));
    expect(
      genres.every((genre) => catalogTracks.has(genre)),
      'the Library offers a genre the catalog has no row for',
    ).toBe(true);

    /**
     * Applies one change and returns what it cost.
     *
     * `draw()` runs synchronously inside the handler, so the clock closes
     * immediately after it — and `getBoundingClientRect()` on the first row
     * forces the layout, which is the difference between "in the DOM" and "on
     * the screen". A change that draws nothing returns `rows: 0` and the
     * caller says so rather than reporting a fast measurement of nothing.
     */
    const applyFilter = async (value: string): Promise<Drawn> =>
      page.evaluate((track) => {
        const select = document.getElementById('library-track');
        if (!(select instanceof HTMLSelectElement)) return { ms: -1, rows: -1, first: -1 };
        const started = performance.now();
        select.value = track;
        select.dispatchEvent(new Event('change'));
        const rows = document.querySelectorAll('#library-list .list-row');
        const first = rows[0]?.getBoundingClientRect().height ?? 0;
        return { ms: performance.now() - started, rows: rows.length, first };
      }, value);

    const worst: { where: string; ms: number }[] = [];
    for (const genre of genres) {
      const drawn = await applyFilter(genre);
      console.log(
        `Library · genre ${genre}, CPU ×${String(CPU_THROTTLE)}: first row in ` +
          `${drawn.ms.toFixed(1)} ms over ${String(drawn.rows)} rows`,
      );
      expect(drawn.rows, `the ${genre} filter drew no rows at all`).toBeGreaterThan(0);
      expect(drawn.first, `the first ${genre} row has no height, so it is not on the screen`).toBeGreaterThan(0);
      worst.push({ where: `genre ${genre}`, ms: drawn.ms });
    }
    await applyFilter('all');

    // …and the search box, which redraws on every keystroke. A one-letter
    // query is the worst case: it matches most of the catalog, so the filter
    // does the most work and the list is longest.
    const applySearch = async (query: string): Promise<Drawn> =>
      page.evaluate((text) => {
        const box = document.getElementById('library-search');
        if (!(box instanceof HTMLInputElement)) return { ms: -1, rows: -1, first: -1 };
        const started = performance.now();
        box.value = text;
        box.dispatchEvent(new Event('input'));
        const rows = document.querySelectorAll('#library-list .list-row');
        const first = rows[0]?.getBoundingClientRect().height ?? 0;
        return { ms: performance.now() - started, rows: rows.length, first };
      }, query);

    for (const query of ['e', 'ma', 'maj', 'major']) {
      const drawn = await applySearch(query);
      console.log(
        `Library · search "${query}", CPU ×${String(CPU_THROTTLE)}: first row in ` +
          `${drawn.ms.toFixed(1)} ms over ${String(drawn.rows)} rows`,
      );
      expect(drawn.rows, `searching for "${query}" drew no rows at all`).toBeGreaterThan(0);
      worst.push({ where: `search "${query}"`, ms: drawn.ms });
    }

    // One assertion, naming whichever of them was slowest, so a failure says
    // which control is the problem rather than which loop iteration it was.
    const slowest = worst.reduce((a, b) => (b.ms > a.ms ? b : a));
    console.log(
      `Library · slowest: ${slowest.where} at ${slowest.ms.toFixed(1)} ms ` +
        `(gate ${String(THROTTLED_GATE_MS)} = the 2-bar first-render budget under ×${String(CPU_THROTTLE)})`,
    );
    expect(
      slowest.ms,
      `${slowest.where} took longer to put a row of text on the screen than `
        + 'engraving two bars of music is allowed to take',
    ).toBeLessThan(THROTTLED_GATE_MS);
  });

  test('a lesson page with the most options is no slower to its first option than one with the fewest', async ({
    page,
  }) => {
    const { most, fewest, mostCount, fewestCount } = rungsByOptionCount();
    expect(mostCount, 'the biggest and the smallest rung list the same number of options').toBeGreaterThan(
      fewestCount,
    );

    await page.setViewportSize(PHONE);
    await throttle(page);

    // Warm first, on a rung that is neither of the two: the catalog and the
    // curriculum are fetched once per document, and timing that fetch would
    // be timing the content build rather than the page.
    await page.goto(`/#/lesson/${fewest}`);
    await expect(page.locator('section[data-screen="lesson"]')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('#lesson-exercises .list-row, #lesson-songs .list-row').first()).toBeVisible({
      timeout: 120_000,
    });

    /**
     * Time from asking for a rung to its first option being laid out.
     *
     * The hash is moved rather than navigated, so the document — and with it
     * the fetched catalog — survives; `page.goto` to a new hash reloads, which
     * is the same trap the input-to-colour test above documents.
     */
    const timeToFirstOption = async (lessonId: string): Promise<number> =>
      page.evaluate(async (id) => {
        const started = performance.now();
        window.location.hash = `#/lesson/${id}`;
        for (;;) {
          const section = document.querySelector('section[data-screen="lesson"]');
          const row = document.querySelector('#lesson-exercises .list-row, #lesson-songs .list-row');
          if (section?.getAttribute('data-lesson') === id && row instanceof HTMLElement) {
            if (row.getBoundingClientRect().height > 0) return performance.now() - started;
          }
          await new Promise((resolve) => requestAnimationFrame(() => { resolve(null); }));
        }
      }, lessonId);

    // Away and back, so each measurement starts from another screen rather
    // than from the page it is about to draw.
    await page.evaluate(() => {
      window.location.hash = '#/plan';
    });
    await expect(page.locator('section[data-screen="plan"]')).toBeVisible({ timeout: 60_000 });
    const smallest = await timeToFirstOption(fewest);

    await page.evaluate(() => {
      window.location.hash = '#/plan';
    });
    await expect(page.locator('section[data-screen="plan"]')).toBeVisible({ timeout: 60_000 });
    const biggest = await timeToFirstOption(most);

    // The page really is the big one, drawn in full.
    const drawn = await page.locator('#lesson-exercises .list-row, #lesson-songs .list-row').count();
    console.log(
      `lesson · ${fewest} (${String(fewestCount)} options) first option in ${smallest.toFixed(1)} ms; ` +
        `${most} (${String(mostCount)} options, ${String(drawn)} rows drawn) in ${biggest.toFixed(1)} ms, ` +
        `CPU ×${String(CPU_THROTTLE)}`,
    );
    expect(drawn, `${most} drew none of its options`).toBeGreaterThan(fewestCount);

    // The relationship, not a number: fifty options may cost more than one,
    // but not more than engraving two bars of music more — that is what "the
    // page renders every option before the first" would look like.
    expect(
      biggest - smallest,
      `${most} takes ${(biggest - smallest).toFixed(1)} ms longer to its first option than ${fewest}, ` +
        'which is the shape of a page that draws all its options before showing any',
    ).toBeLessThan(THROTTLED_GATE_MS);
    // And the big page on its own is still inside the same budget.
    expect(
      biggest,
      `${most} took longer than engraving two bars of music to put its first option on the screen`,
    ).toBeLessThan(THROTTLED_GATE_MS);
  });
});
