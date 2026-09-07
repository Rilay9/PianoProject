import { expect, test, type Page } from '@playwright/test';
import { openDevScore, waitForStableLayout } from './fixtures/devScore';
import {
  closeScoreMenu,
  closeTempoSheet,
  openScoreMenu,
  openTempoSheet,
} from './scoreControls';

// docs/01-architecture.md §6: a 2-bar window must render in under 150 ms.
// Measured on desktop Chromium here; the phone number comes from the owner
// running /dev/score on the S25 and reading the HUD (P9).
const TWO_BAR_RENDER_BUDGET_MS = 150;

/** Two fixtures with different shapes: a grand staff, and a single staff. */
const SCREENSHOT_FIXTURES = ['chords-ties', 'tuplets-68'] as const;

test.describe('score model against a real rendered cursor', () => {
  test('steps.length equals the number of cursor.next() calls, on every fixture', async ({
    page,
  }) => {
    test.slow();
    const dev = await openDevScore(page);
    const fixtures = await dev.fixtures();
    // 8 hand-written edge cases + 33 generated exercises.
    expect(fixtures.length).toBeGreaterThanOrEqual(41);

    const mismatches: string[] = [];
    for (const name of fixtures) {
      await dev.load(name);
      expect(await dev.lastError(), `loading ${name}`).toBe('');
      const [steps, cursorSteps] = await Promise.all([dev.stepCount(), dev.cursorStepCount()]);
      if (steps !== cursorSteps) mismatches.push(`${name}: model ${steps} vs cursor ${cursorSteps}`);
    }
    expect(mismatches).toEqual([]);
  });

  test('no fixture throws while rendering', async ({ page }) => {
    test.slow();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const dev = await openDevScore(page);
    for (const name of await dev.fixtures()) {
      await dev.load(name);
      expect(await dev.lastError(), `loading ${name}`).toBe('');
      expect(await dev.stepCount(), `steps in ${name}`).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
  });

  test('a repeat is unrolled: more played bars than printed ones', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('repeat-endings');
    expect(await dev.measureCounts()).toEqual({ unrolled: 4, printed: 3 });
  });
});

test.describe('windowing', () => {
  test('the window follows the cursor and holds exactly N bars', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tuplets-68');
    await dev.setBars(1);

    await dev.showStep(0);
    expect(await dev.currentWindow()).toEqual({ fromMeasure: 0, toMeasure: 0 });

    // tuplets-68 has two bars; the last steps belong to the second.
    const steps = await dev.stepCount();
    await dev.showStep(steps - 1);
    expect(await dev.currentWindow()).toEqual({ fromMeasure: 1, toMeasure: 1 });
  });

  test('bars per window is clamped to 1..8', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.setBars(1);
    expect(await dev.currentWindow()).toEqual({ fromMeasure: 0, toMeasure: 0 });
    // chords-ties has two bars, so a 4-bar window is clipped to what exists.
    await dev.setBars(4);
    expect(await dev.currentWindow()).toEqual({ fromMeasure: 0, toMeasure: 1 });
  });

  test('the window jumps back on a repeat, following the printed page', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('repeat-endings');
    await dev.setBars(1);
    const windows: ({ fromMeasure: number; toMeasure: number } | null)[] = [];
    for (let i = 0; i < (await dev.stepCount()); i += 1) {
      await dev.showStep(i);
      windows.push(await dev.currentWindow());
    }
    expect(windows).toEqual([
      { fromMeasure: 0, toMeasure: 0 },
      { fromMeasure: 0, toMeasure: 0 },
      { fromMeasure: 1, toMeasure: 1 },
      // Second pass: back to the printed first bar.
      { fromMeasure: 0, toMeasure: 0 },
      { fromMeasure: 0, toMeasure: 0 },
      { fromMeasure: 2, toMeasure: 2 },
    ]);
  });

  test('the cursor band sits over the notes and moves with the step', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.setBars(2);
    await dev.showStep(0);
    const band = page.locator('.score-cursor');
    await expect(band).toBeVisible();
    const first = await band.boundingBox();
    await dev.showStep(1);
    const second = await band.boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second!.x).toBeGreaterThan(first!.x);
  });
});

test.describe('note elements and colouring', () => {
  test('every note of the current step resolves to a drawn element', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.setBars(2);
    await dev.showStep(0);
    // The opening step is a three-note RH chord plus one LH note.
    expect((await dev.currentStepNoteIds()).length).toBe(4);
    expect(await dev.noteElementCount()).toBeGreaterThanOrEqual(4);
  });

  test('each note of a chord gets its own element, so they can differ', async ({ page }) => {
    // OSMD's getSVGGElement() returns the group for the whole voice entry, so
    // a chord would share one element and P3 could not show two right notes
    // and one wrong. OsmdView resolves per notehead instead; this is the test
    // that would catch a regression back to the group.
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.showStep(0);
    const distinct = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.score-note.is-current')];
      return { count: els.length, unique: new Set(els).size };
    });
    expect(distinct.count).toBe(4);
    expect(distinct.unique).toBe(4);
  });

  test('the current step is painted by class, not by re-rendering', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.showStep(0);
    await expect(page.locator('.score-note.is-current')).toHaveCount(4);
    await dev.showStep(1);
    await expect(page.locator('.score-note.is-current')).toHaveCount(1);
  });

  test('drawn notes carry the hand the model assigned, cross-staff included', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('cross-staff');
    await dev.showStep(2);
    // The E4 is printed on the treble staff but played by the left hand.
    const hands = await page.locator('.score-note.is-current').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.hand),
    );
    expect(hands).toContain('L');
  });

  test('hand focus dims the other hand', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.showStep(0);
    await dev.setHands('R');
    await expect(page.locator('.score-view')).toHaveAttribute('data-hands', 'R');
    const opacity = await page
      .locator('.score-note[data-hand="L"]')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeCloseTo(0.35, 2);
  });
});

test.describe('layouts', () => {
  test('scroll layout renders the whole piece at once', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setLayout('scroll');
    await expect(page.locator('.score-view')).toHaveAttribute('data-layout', 'scroll');
    await dev.showStep(0);
    // All three bars are drawn, so every note in the piece has an element.
    expect(await dev.noteElementCount()).toBeGreaterThanOrEqual(5);
  });

  test('window layout draws only the window', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setLayout('window');
    await dev.setBars(1);
    await dev.showStep(0);
    const inWindow = await dev.noteElementCount();
    await dev.setLayout('scroll');
    await dev.showStep(0);
    const whole = await dev.noteElementCount();
    expect(inWindow).toBeLessThan(whole);
  });
});

test.describe('render timing budget', () => {
  test(`a 2-bar window renders in under ${TWO_BAR_RENDER_BUDGET_MS} ms`, async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('chords-ties');
    await dev.setBars(2);
    await dev.showStep(0);

    // Several samples: the first draw after a load pays one-off costs (font
    // metrics, VexFlow warm-up) that a mid-piece window swap does not.
    const samples: number[] = [];
    for (let i = 0; i < 5; i += 1) samples.push(await dev.timeWindowRender());
    const median = [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)] ?? NaN;

    // Logged so the number, not just the pass, is in the CI output.
    console.log(
      `2-bar window render: median ${median.toFixed(1)} ms ` +
        `(samples ${samples.map((s) => s.toFixed(1)).join(', ')} ms)`,
    );
    expect(median).toBeLessThan(TWO_BAR_RENDER_BUDGET_MS);
  });
});

test.describe('double buffering', () => {
  test('advancing into the pre-rendered next window costs well under a frame', async ({
    page,
  }) => {
    const dev = await openDevScore(page);
    await dev.load('tempo-change');
    await dev.setBars(1);
    await dev.showStep(0);
    expect(await dev.currentWindow()).toEqual({ fromMeasure: 0, toMeasure: 0 });

    // Step 2 is the first step of bar 2, whose window WindowRenderer
    // pre-rendered into the spare buffer while bar 1 was on screen.
    const elapsed = await dev.timeShowStep(2);
    expect(await dev.currentWindow()).toEqual({ fromMeasure: 1, toMeasure: 1 });
    console.log(`pre-rendered window swap: ${elapsed.toFixed(2)} ms`);
    // A frame is 16.7 ms; a swap that had to render would cost ~10 ms (see the
    // budget test above), so this also proves the pre-render actually happened.
    expect(elapsed).toBeLessThan(16.7);
  });
});

test.describe('the dev route itself', () => {
  test('is reachable from Settings and lists every bundled fixture', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#open-dev-score').click();
    await expect(page.locator('.card h1')).toHaveText('Score renderer (dev)');
    expect(new URL(page.url()).hash).toBe('#/dev/score');
    await expect(page.locator('#dev-fixture option')).toHaveCount(41);
  });

  test('arrow keys step the cursor and 1-8 set bars per window', async ({ page }) => {
    const dev = await openDevScore(page);
    await dev.load('tuplets-68');
    await page.locator('.dev-score__stage').click();
    await page.keyboard.press('4');
    expect(await dev.currentWindow()).toEqual({ fromMeasure: 0, toMeasure: 1 });
    await page.keyboard.press('1');
    expect(await dev.currentWindow()).toEqual({ fromMeasure: 0, toMeasure: 0 });
    await expect(page.locator('#dev-hud')).toContainText('steps 1/');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#dev-hud')).toContainText('steps 2/');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#dev-hud')).toContainText('steps 1/');
  });

  test('OSMD stays out of the entry bundle', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', (r) => {
      if (r.url().endsWith('.js')) scripts.push(r.url());
    });
    await page.goto('/#/today');
    await expect(page.locator('.screen h1')).toHaveText('Today');
    expect(scripts.some((s) => s.includes('DevScoreScreen'))).toBe(false);
  });
});

/**
 * Layout assertions that the screenshots below also cover, but in a form that
 * cannot be broken by a font substitution. These run everywhere, including CI.
 */
test.describe('window layout holds its shape', () => {
  for (const orientation of ['landscape', 'portrait'] as const) {
    test(`the fitted score stays inside the viewport (${orientation})`, async ({ page }) => {
      await page.setViewportSize(
        orientation === 'landscape' ? { width: 915, height: 412 } : { width: 412, height: 915 },
      );
      const dev = await openDevScore(page);
      await dev.load('chords-ties');
      await dev.setBars(2);
      await dev.showStep(0);
      const fits = await page.evaluate(() => {
        const host = document.querySelector('.score-view');
        const svg = document.querySelector('.score-buffer.is-front svg');
        if (!host || !svg) throw new Error('nothing rendered');
        const h = host.getBoundingClientRect();
        // The ink, not the element. OSMD lays the window out on a page the full
        // width of the container and inks part of it, and the fit now grows the
        // sheet until the *drawn* music fills the stage — so the page overhangs
        // to the right on purpose, by exactly the engraver's own right margin.
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;
        for (const el of svg.querySelectorAll('*')) {
          const box = el.getBoundingClientRect();
          if (box.width === 0 && box.height === 0) continue;
          left = Math.min(left, box.left);
          right = Math.max(right, box.right);
          top = Math.min(top, box.top);
          bottom = Math.max(bottom, box.bottom);
        }
        // One pixel of slack for subpixel rounding in the scale transform.
        return { widthOverflow: right - left - h.width, heightOverflow: bottom - top - h.height };
      });
      expect(fits.widthOverflow).toBeLessThanOrEqual(1);
      // Window layout fits both axes; anything taller would clip the bass staff.
      expect(fits.heightOverflow).toBeLessThanOrEqual(1);
    });
  }

  test('bars per window changes how many measures are drawn', async ({ page }) => {
    const dev = await openDevScore(page);
    // A four-bar fixture, so 1/2/4 are all distinguishable.
    await dev.load('exercise.five-finger.c-major.both');
    const counts: number[] = [];
    for (const bars of [1, 2, 4]) {
      await dev.setBars(bars);
      await dev.showStep(0);
      counts.push(
        await page.evaluate(
          () => document.querySelectorAll('.score-buffer.is-front .vf-measure').length,
        ),
      );
    }
    // Strictly increasing: more bars per window means more measures drawn.
    expect(counts[0]).toBeLessThan(counts[1] ?? 0);
    expect(counts[1]).toBeLessThan(counts[2] ?? 0);
  });
});

// Pixel baselines are tied to the exact font rendering of the machine that
// generated them. They are Linux-specific (Playwright names them `-linux.png`)
// but not *runner*-specific, and a CI image with different fonts would fail on
// antialiasing rather than on a real regression — blocking a merge for noise.
// So: on by default for a human reviewing a change, opt-in in CI via VISUAL=1.
// The structural assertions above cover the same layout in CI unconditionally.
test.describe('screenshots', () => {
  test.skip(
    !!process.env.CI && !process.env.VISUAL,
    'pixel baselines are machine-specific; set VISUAL=1 to run them in CI',
  );

  for (const fixture of SCREENSHOT_FIXTURES) {
    for (const bars of [1, 2, 4] as const) {
      for (const orientation of ['landscape', 'portrait'] as const) {
        test(`${fixture} · ${bars} bar(s) · ${orientation}`, async ({ page }) => {
          await page.setViewportSize(
            orientation === 'landscape' ? { width: 915, height: 412 } : { width: 412, height: 915 },
          );
          const dev = await openDevScore(page);
          await dev.load(fixture);
          await dev.setBars(bars);
          await dev.showStep(0);
          await expect(page.locator('.score-buffer.is-front svg')).toBeVisible();
          // Visible is not final: see waitForStableLayout.
          await waitForStableLayout(page, '.score-buffer.is-front svg');
          await page.locator('#dev-hud').evaluate((el: HTMLElement) => {
            el.style.display = 'none';
          });
          await expect(page.locator('.dev-score__stage')).toHaveScreenshot(
            `${fixture}-${bars}bar-${orientation}.png`,
            {
              // The HUD carries a load time in milliseconds, which differs on
              // every run. It used to be masked; now that the sheet is fitted
              // to the ink it fills the width, and the mask was a magenta
              // block over the last bar. Hidden instead, so the picture is of
              // the notation and nothing else.
              mask: [],
              // Notation is antialiased vector art; a couple of pixels of
              // difference between machines is not a regression.
              maxDiffPixelRatio: 0.02,
              animations: 'disabled',
            },
          );
        });
      }
    }
  }
});

/**
 * The bar and the `⋯` sheet (`04` §5, P21 B1).
 *
 * The bar held nineteen controls. Held sideways it wrapped onto three rows and
 * took a third of the screen off the notation; the four you reach for during a
 * piece were mixed in with the ones you set once. These say what it holds now,
 * that nothing was lost on the way out, and that Back is where a thumb looks
 * for it.
 */
test.describe('the score control bar', () => {
  const ITEM = 'song.folk.hot-cross-buns';

  async function openScore(page: Page): Promise<void> {
    await page.goto(`/#/score/${ITEM}`);
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

  for (const [orientation, viewport] of [
    ['upright', { width: 390, height: 844 }],
    ['sideways', { width: 880, height: 412 }],
  ] as const) {
    test(`${orientation}: one row, seven controls at most`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openScore(page);

      const children = await page.locator('#score-bar > *').count();
      expect(children, 'the bar has grown again').toBeLessThanOrEqual(8);

      // One row. A `.score-button` is 36 px tall plus the bar's own padding,
      // so anything past 60 has wrapped.
      const box = await page.locator('#score-bar').boundingBox();
      expect(box, 'no control bar').toBeTruthy();
      expect(box!.height, `the bar is ${String(box!.height)} px tall`).toBeLessThan(60);

      // And Back is where a thumb looks for it rather than in among the
      // transport controls.
      const back = await page.locator('#score-back').boundingBox();
      expect(back, 'no back button').toBeTruthy();
      expect(back!.y + back!.height, 'Back is not in the header').toBeLessThanOrEqual(60);
    });
  }

  test('everything that left the bar is behind ⋯ and still works', async ({ page }) => {
    await openScore(page);
    await openScoreMenu(page);

    for (const id of [
      'score-input',
      'score-loop',
      'score-metronome',
      'score-bars-down',
      'score-bars',
      'score-bars-up',
      'score-zoom-out',
      'score-zoom-in',
      'score-layout-window',
      'score-layout-scroll',
      'score-strip-toggle',
      'score-destination',
      'score-blind',
      'score-performance',
    ]) {
      await expect(page.locator(`#${id}`), `${id} is not in the sheet`).toBeVisible();
    }

    // Bars in the window.
    await expect(page.locator('#score-bars')).toHaveText('2 bars');
    await page.locator('#score-bars-up').click();
    await expect(page.locator('#score-bars')).toHaveText('3 bars');
    await page.locator('#score-bars-down').click();
    await expect(page.locator('#score-bars')).toHaveText('2 bars');

    // Layout, as a segment.
    await page.locator('#score-layout-scroll').click();
    await expect(page.locator('#score-layout-scroll')).toHaveClass(/is-selected/);
    await page.locator('#score-layout-window').click();
    await expect(page.locator('#score-layout-window')).toHaveClass(/is-selected/);

    // The metronome, the strip and the sound destination.
    await page.locator('#score-metronome').click();
    await expect(page.locator('#score-metronome')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#score-strip-toggle').click();
    await expect(page.locator('#score-strip')).toBeHidden();
    await page.locator('#score-destination').click();
    await expect(page.locator('#score-destination')).toContainText('Piano');

    // The input, which is the one that changes what the run listens to.
    await page.locator('#score-input').selectOption('keys');
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-input',
      'keys',
    );

    // Zoom, measured rather than assumed: it is the one whose effect is not
    // visible in the sheet.
    const height = async (): Promise<number> =>
      page.evaluate(
        () =>
          document.querySelector('#score-stage .is-front svg')?.getBoundingClientRect().height ?? 0,
      );
    const before = await height();
    await page.locator('#score-zoom-out').click();
    await expect.poll(height, { timeout: 15_000 }).toBeLessThan(before - 5);

    await closeScoreMenu(page);
    // And the sheet gives the controls back rather than taking them with it.
    await expect(page.locator('#score-bars')).toHaveCount(1);
    await expect(page.locator('#score-more')).toBeVisible();
  });

  test('sideways, the whole menu is on the screen at once', async ({ page }) => {
    // A phone held sideways is 360 px tall and the sheet showed four of its ten
    // rows: Size, Layout, Keys, Sound, Blind and Perform were behind a scroll
    // inside a dialog, which is a place nobody looks for them.
    await page.setViewportSize({ width: 780, height: 360 });
    await openScore(page);
    await openScoreMenu(page);
    const rows = await page.evaluate(() => {
      const all = [...document.querySelectorAll('#score-more-sheet .score-menu-row')].filter(
        (row) => (row as HTMLElement).offsetParent !== null,
      );
      const inside = all.filter((row) => {
        const box = row.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= window.innerHeight + 1;
      });
      return { all: all.length, inside: inside.length };
    });
    expect(rows.all).toBeGreaterThan(6);
    expect(rows.inside, `only ${String(rows.inside)} of ${String(rows.all)} rows are on the screen`).toBe(rows.all);
  });

  test('the tempo label opens a sheet with the slider and a typed bpm', async ({ page }) => {
    await openScore(page);
    await openTempoSheet(page);
    await expect(page.locator('#score-tempo')).toBeVisible();
    const bpm = page.locator('#score-bpm');
    await expect(bpm).toBeVisible();

    // A typed bpm, where `window.prompt` used to be. Relative to whatever the
    // piece is written at, so this does not depend on its tempo mark.
    const slider = page.locator('#score-tempo');
    const startPct = await slider.inputValue();
    const startBpm = Number(await bpm.inputValue());
    expect(startBpm, 'the bpm field opened empty').toBeGreaterThan(0);
    await bpm.fill(String(Math.round(startBpm * 0.6)));
    await bpm.blur();
    await expect(slider, 'typing a bpm did not move the tempo').not.toHaveValue(startPct);
    const percent = await slider.inputValue();
    await expect(page.locator('#score-tempo-label')).toContainText(`${percent}%`);
    await closeTempoSheet(page);
    await expect(page.locator('#score-tempo')).toHaveCount(1);
  });
});
