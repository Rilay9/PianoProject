/**
 * T30 item 3 — the same three pieces under each candidate rule.
 *
 * Run once per probe build of the renderer, with `T30_STRATEGY` naming which
 * one is in the tree, so the cells can be told apart in one gallery:
 *
 *   T30_STRATEGY=today npx playwright test --config playwright.tour.config.ts t30-strategy --workers=2
 *
 * The probe builds are throwaway edits to `slots.ts` / `WindowRenderer.ts` and
 * are put back afterwards; nothing in `app/src` survives this task.
 */
import { test, type Page } from '@playwright/test';

import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import { pressControl } from '../e2e/scoreControls';
import { T30_FACTORS, openPiece, setBars, setLayout, settle, shootCell } from './t30';

const STRATEGY = process.env.T30_STRATEGY ?? 'today';

const PIECES = [
  { id: 'exercise.five-finger.c-major.right', short: 'five-finger', why: 'one hand, three bars, five notes a bar' },
  { id: 'song.folk.twinkle.ht', short: 'twinkle', why: 'a grand staff, twelve bars, 4/4' },
  {
    id: 'song.classical.chopin-nocturne-op48-1.nifc',
    short: 'nocturne-48',
    why: 'a dense grand staff, 81 bars, wide chords',
  },
];

/** The two shapes that behave least alike: the owner's phone, and a tablet sideways. */
const FACTORS = T30_FACTORS.filter((f) => ['phone-portrait-342', 'tablet-landscape'].includes(f.orientation));

/** 2 is the default, 3 is the count that does nothing today, 4 is the one that splits. */
const BARS = [2, 3, 4];

type Run = { step: number; bar: number; lastBar: number; expected: number[]; pitches: number[] } | null;
type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };

async function playPastWindow(page: Page, midi: MidiMock, past: number): Promise<number | null> {
  await page.locator('#score-mode').selectOption('wait');
  await settle(page);
  await pressControl(page, '#score-play');
  await page.waitForTimeout(700);
  let bar: number | null = null;
  for (let i = 0; i < 18; i += 1) {
    const run = await page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
    if (run === null) break;
    bar = run.bar;
    if (run.bar > past || run.bar >= run.lastBar) break;
    const notes = run.expected.length > 0 ? run.expected : run.pitches;
    for (const note of notes) await midi.noteOn(note, 78);
    await page.waitForTimeout(60);
    for (const note of notes) await midi.noteOff(note);
    const moved = await page
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
    if (!moved) break;
  }
  await settle(page);
  return bar;
}

for (const factor of FACTORS) {
  test.describe(`T30 strategy ${STRATEGY} · ${factor.orientation}`, () => {
    test.use({ viewport: factor.size, deviceScaleFactor: 2 });
    test.describe.configure({ timeout: 1_800_000 });

    for (const piece of PIECES) {
      test(`${STRATEGY} · ${piece.short}`, async ({ page }) => {
        const midi = await installMidiMock(page, { permission: 'granted' });
        await page.addInitScript(() => {
          localStorage.setItem('pianopath.firstSight', '["*"]');
        });
        await openPiece(page, piece.id);
        await setLayout(page, 'window');

        for (const bars of BARS) {
          await page.reload();
          await openPiece(page, piece.id);
          await setBars(page, bars);
          const base = {
            orientation: factor.orientation,
            piece: piece.id,
            pieceWhy: piece.why,
            layout: 'window',
            barsAsked: bars,
            zoomSteps: 0,
          };
          await shootCell(page, {
            ...base,
            mode: `strategy:${STRATEGY}`,
            slug: `p-${STRATEGY}-${piece.short}-${String(bars)}bar-before`,
            moment: 'before',
            note: `probe build: ${STRATEGY}`,
          });
          const reached = await playPastWindow(page, midi, bars);
          await shootCell(page, {
            ...base,
            mode: `strategy:${STRATEGY}`,
            slug: `p-${STRATEGY}-${piece.short}-${String(bars)}bar-mid`,
            moment: 'mid-run',
            note:
              `probe build: ${STRATEGY}; ` +
              (reached === null ? 'the run never started' : `cursor reached printed bar ${String(reached + 1)}`),
          });
        }
      });
    }
  });
}
