/**
 * T30 — the window gallery: every shape, every *Bars in window*, measured.
 *
 * Not a test. It drives the real Score screen and writes one measured cell per
 * (shape x piece x option x moment) into `build/tour/T30/`, because the owner's
 * four complaints — cannot see the next music, nothing changes, too small, the
 * chosen count is not the drawn count — are all claims about numbers that no
 * picture carries. The picture is the proxy; the caption is the claim.
 *
 *   npx playwright test --config playwright.tour.config.ts t30-window --workers=4 --fully-parallel
 *
 * Remove with `t30.ts` once the owner has chosen.
 */
import { test, type Page } from '@playwright/test';

import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import { pressControl } from '../e2e/scoreControls';
import {
  T30_FACTORS,
  measure,
  notShot,
  openPiece,
  setBars,
  setLayout,
  setZoomSteps,
  settle,
  shootCell,
} from './t30';

/**
 * The six the brief asks for, each named with its id and why it is here.
 *
 * Read off `content/catalog.json` rather than from the titles: `staves`,
 * `hands`, `bars` and `timeSig` are measured fields on the row and the title
 * is not (`00-invariants` §1a).
 */
const PIECES: { id: string; why: string; short: string }[] = [
  {
    id: 'exercise.five-finger.c-major.right',
    why: 'one hand, three bars, five notes a bar — the sparsest thing the window is ever asked to hold',
    short: 'five-finger',
  },
  { id: 'song.folk.twinkle.ht', why: 'a grand staff, twelve bars, 4/4 — the simple two-hand song', short: 'twinkle' },
  {
    id: 'song.classical.chopin-nocturne-op48-1.nifc',
    why: 'a dense grand staff, 81 bars, wide chords and many notes a bar',
    short: 'nocturne-48',
  },
  {
    id: 'song.classical.chopin-nocturne-op9-2',
    why: '12/8 — a compound, long metre, twelve quavers to the bar',
    short: 'nocturne-9-2',
  },
  {
    id: 'exercise.articulation.c.legato.right',
    why: 'a generated technique exercise (legato, four bars, one hand)',
    short: 'legato',
  },
];

/** Every *Bars in window* the stepper offers, at both ends and in between. */
const BARS = [1, 2, 3, 4, 6, 8];

const BAR_MAX_STEPS = 18;

type Run = { step: number; bar: number; lastBar: number; expected: number[]; pitches: number[] } | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };

function runNow(page: Page): Promise<Run> {
  return page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
}

async function playStep(page: Page, midi: MidiMock, run: NonNullable<Run>): Promise<boolean> {
  const notes = run.expected.length > 0 ? run.expected : run.pitches;
  for (const note of notes) await midi.noteOn(note, 78);
  await page.waitForTimeout(60);
  for (const note of notes) await midi.noteOff(note);
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
 * Starts a Wait run and plays until the cursor is past the first window.
 *
 * Wait mode and a MIDI mock, so the run advances exactly as fast as it is fed
 * and the mid-run moment is a state rather than a race with a clock. Returns
 * the bar it reached, or null if the run never started.
 */
async function playPastWindow(page: Page, midi: MidiMock, past: number): Promise<number | null> {
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  await pressControl(page, '#score-play');
  await page.waitForTimeout(700);
  let bar: number | null = null;
  for (let i = 0; i < BAR_MAX_STEPS; i += 1) {
    const run = await runNow(page);
    if (run === null) break;
    bar = run.bar;
    // Past the first window, or as far as a short piece goes. Never into the
    // last bar: finishing raises the summary sheet, and a photograph of the
    // summary is not a photograph of the window.
    if (run.bar > past || run.bar >= run.lastBar) break;
    if (!(await playStep(page, midi, run))) break;
  }
  await settle(page);
  return bar;
}

/** A fresh visit, so the "before the run" moment is not a frozen run's leftovers. */
async function fresh(page: Page, id: string): Promise<void> {
  await page.reload();
  await openPiece(page, id);
}

// ---------------------------------------------------------------------------
// Grid A — the core: every shape x every *Bars in window* x every piece,
// `Window` layout, Size at its default, both moments.
// ---------------------------------------------------------------------------

for (const factor of T30_FACTORS) {
  test.describe(`T30 window · ${factor.orientation}`, () => {
    test.use({ viewport: factor.size, deviceScaleFactor: 2 });
    test.describe.configure({ timeout: 1_800_000 });

    for (const piece of PIECES) {
      test(`bars 1-8 · ${piece.short}`, async ({ page }) => {
        const midi = await installMidiMock(page, { permission: 'granted' });
        await page.addInitScript(() => {
          localStorage.setItem('pianopath.firstSight', '["*"]');
        });
        await openPiece(page, piece.id);
        await setLayout(page, 'window');

        for (const bars of BARS) {
          // The reload first, then the setting: a run that ended raises the
          // summary sheet, which makes the screen inert, and the `⋯` sheet
          // cannot be opened underneath it.
          await fresh(page, piece.id);
          await setBars(page, bars);
          const base = {
            orientation: factor.orientation,
            piece: piece.id,
            pieceWhy: piece.why,
            layout: 'window',
            mode: 'wait (not started)',
            barsAsked: bars,
            zoomSteps: 0,
            note: '',
          };
          await shootCell(page, {
            ...base,
            slug: `a-${piece.short}-window-${String(bars)}bar-before`,
            moment: 'before',
          });
          const reached = await playPastWindow(page, midi, bars);
          await shootCell(page, {
            ...base,
            slug: `a-${piece.short}-window-${String(bars)}bar-mid`,
            moment: 'mid-run',
            mode: 'wait',
            note: reached === null ? 'the run never started' : `cursor reached bar ${String(reached + 1)} (printed)`,
          });
        }
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Grid B — the `Scroll` layout. Three of the six counts, because the question
// there is whether the count does anything at all, and three answers it.
// ---------------------------------------------------------------------------

const SCROLL_PIECES = PIECES.filter((p) => ['five-finger', 'twinkle', 'nocturne-48'].includes(p.short));

for (const factor of T30_FACTORS) {
  test.describe(`T30 scroll · ${factor.orientation}`, () => {
    test.use({ viewport: factor.size, deviceScaleFactor: 2 });
    test.describe.configure({ timeout: 1_800_000 });

    for (const piece of SCROLL_PIECES) {
      test(`scroll · ${piece.short}`, async ({ page }) => {
        const midi = await installMidiMock(page, { permission: 'granted' });
        await page.addInitScript(() => {
          localStorage.setItem('pianopath.firstSight', '["*"]');
        });
        await openPiece(page, piece.id);
        await setLayout(page, 'scroll');

        for (const bars of [1, 4, 8]) {
          await fresh(page, piece.id);
          await setLayout(page, 'scroll');
          await setBars(page, bars);
          const base = {
            orientation: factor.orientation,
            piece: piece.id,
            pieceWhy: piece.why,
            layout: 'scroll',
            mode: 'wait (not started)',
            barsAsked: bars,
            zoomSteps: 0,
            note: '',
          };
          await shootCell(page, {
            ...base,
            slug: `b-${piece.short}-scroll-${String(bars)}bar-before`,
            moment: 'before',
          });
          const reached = await playPastWindow(page, midi, bars);
          await shootCell(page, {
            ...base,
            slug: `b-${piece.short}-scroll-${String(bars)}bar-mid`,
            moment: 'mid-run',
            mode: 'wait',
            note: reached === null ? 'the run never started' : `cursor reached bar ${String(reached + 1)} (printed)`,
          });
        }
        await setLayout(page, 'window');
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Grid C — *Size*, one step down and one step up.
//
// Not crossed with the whole of Grid A, and the reason is in the code rather
// than in the budget: `setZoom` writes `userZoom` and calls `fitSlots()` — it
// never re-engraves and never reaches `chooseSlotCount`
// (`WindowRenderer.ts:1561`), so it cannot move the bar count. This grid is
// what checks that claim rather than restating it, on two pieces at two
// counts at every shape.
// ---------------------------------------------------------------------------

const SIZE_PIECES = PIECES.filter((p) => ['twinkle', 'nocturne-48'].includes(p.short));

for (const factor of T30_FACTORS) {
  test.describe(`T30 size · ${factor.orientation}`, () => {
    test.use({ viewport: factor.size, deviceScaleFactor: 2 });
    test.describe.configure({ timeout: 1_800_000 });

    for (const piece of SIZE_PIECES) {
      test(`size ±1 · ${piece.short}`, async ({ page }) => {
        await page.addInitScript(() => {
          localStorage.setItem('pianopath.firstSight', '["*"]');
        });
        await openPiece(page, piece.id);
        await setLayout(page, 'window');

        for (const bars of [2, 4]) {
          for (const steps of [-1, 1]) {
            await fresh(page, piece.id);
            await setBars(page, bars);
            await setZoomSteps(page, steps);
            await shootCell(page, {
              orientation: factor.orientation,
              piece: piece.id,
              pieceWhy: piece.why,
              layout: 'window',
              mode: 'wait (not started)',
              barsAsked: bars,
              zoomSteps: steps,
              slug: `c-${piece.short}-${String(bars)}bar-size${steps > 0 ? 'up' : 'down'}`,
              moment: 'before',
              note: `Size ${steps > 0 ? 'one step up' : 'one step down'} from its default`,
            });
            await setZoomSteps(page, -steps);
          }
        }
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Grid D — the run modes (the coordinator's addition to item 1).
//
// Wait, Keep tempo, rhythm-only, Perform and Blind, mid-run, on the two shapes
// that differ most, at the default count and at 1 and 4.
// ---------------------------------------------------------------------------

const MODE_FACTORS = T30_FACTORS.filter((f) =>
  ['phone-portrait-342', 'tablet-landscape'].includes(f.orientation),
);
const MODE_PIECES = PIECES.filter((p) => ['twinkle', 'nocturne-48'].includes(p.short));
const MODES: { key: string; select: string; extra?: string }[] = [
  { key: 'wait', select: 'wait' },
  { key: 'tempo', select: 'tempo' },
  { key: 'rhythm', select: 'tempo', extra: '#score-rhythm' },
  { key: 'perform', select: 'tempo', extra: '#score-performance' },
  { key: 'blind', select: 'tempo', extra: '#score-blind' },
];

for (const factor of MODE_FACTORS) {
  test.describe(`T30 modes · ${factor.orientation}`, () => {
    test.use({ viewport: factor.size, deviceScaleFactor: 2 });
    test.describe.configure({ timeout: 1_800_000 });

    for (const piece of MODE_PIECES) {
      test(`modes · ${piece.short}`, async ({ page }) => {
        const midi = await installMidiMock(page, { permission: 'granted' });
        await page.addInitScript(() => {
          localStorage.setItem('pianopath.firstSight', '["*"]');
        });
        await openPiece(page, piece.id);
        await setLayout(page, 'window');

        for (const bars of [1, 2, 4]) {
          for (const mode of MODES) {
            await fresh(page, piece.id);
            await setBars(page, bars);
            await page.locator('#score-mode').selectOption(mode.select);
            await settle(page);
            if (mode.extra !== undefined) {
              const toggle = page.locator(mode.extra);
              if ((await toggle.count()) === 0) {
                notShot(
                  `d-${piece.short}-${String(bars)}bar-${mode.key}`,
                  factor.orientation,
                  `no ${mode.extra} control on this screen`,
                  { piece: piece.id, barsAsked: bars },
                );
                continue;
              }
              await page.evaluate((sel) => {
                document.querySelector<HTMLElement>(sel)?.click();
              }, mode.extra);
              await settle(page);
            }
            await pressControl(page, '#score-play');
            await page.waitForTimeout(900);
            // Every mode is fed, not only Wait. *Keep tempo* has a latch too —
            // `04` §5's *Play your first note to start* — so six seconds of
            // waiting leaves the cursor on bar 1 and the cell is a picture of
            // the screen before the run, whatever its caption says. Rhythm-only
            // takes any key at all, so one pitch is a tap.
            for (let i = 0; i < BAR_MAX_STEPS; i += 1) {
              const run = await runNow(page);
              if (run === null || run.bar > bars || run.bar >= run.lastBar) break;
              if (mode.key === 'rhythm') {
                await midi.noteOn(60, 78);
                await page.waitForTimeout(60);
                await midi.noteOff(60);
                await page.waitForTimeout(160);
              } else if (!(await playStep(page, midi, run))) break;
            }
            await settle(page);
            const run = await runNow(page);
            await shootCell(page, {
              orientation: factor.orientation,
              piece: piece.id,
              pieceWhy: piece.why,
              layout: 'window',
              mode: mode.key,
              barsAsked: bars,
              zoomSteps: 0,
              slug: `d-${piece.short}-${String(bars)}bar-${mode.key}`,
              moment: 'mid-run',
              note: run === null ? 'the run had ended or never started' : `cursor at printed bar ${String(run.bar + 1)}`,
            });
          }
        }
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Grid E — the drill that draws a stave.
//
// `STAFF_POLICY.pedal` is `always` (`app/src/engine/drills/types.ts:90`), so
// `drill.pedal.changes` is the drill that draws one on every card. It is the
// Drill screen and not the Score screen: it has no *Bars in window*, no
// *Layout* and no *Size*, so the option grid does not apply and each cell is
// one picture with its stave measured.
// ---------------------------------------------------------------------------

for (const factor of T30_FACTORS) {
  test.describe(`T30 drill · ${factor.orientation}`, () => {
    test.use({ viewport: factor.size, deviceScaleFactor: 2 });
    test.describe.configure({ timeout: 300_000 });

    test('the drill that draws a stave', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('pianopath.firstSight', '["*"]');
      });
      await page.goto('/#/drill/drill.pedal.changes');
      await page.waitForTimeout(3_000);
      const m = await measure(page);
      await shootCell(page, {
        orientation: factor.orientation,
        piece: 'drill.pedal.changes',
        pieceWhy: "a drill whose STAFF_POLICY is `always`, so it draws a stave on every card",
        layout: 'drill screen',
        mode: 'drill',
        barsAsked: 0,
        zoomSteps: 0,
        slug: 'e-drill-pedal-changes',
        moment: 'before',
        note:
          m?.stage === null || m === null
            ? 'no #score-stage on this screen: the drill draws its own card'
            : 'the drill screen, with its own card',
      });
      notShot('e-drill-option-grid', factor.orientation, 'the Drill screen has no Bars in window, Layout or Size control: the option grid has nothing to vary', {
        piece: 'drill.pedal.changes',
      });
    });
  });
}
