/**
 * The UX tour — every screen on a Galaxy S25, portrait and landscape.
 *
 * Not a test. It drives the app with a spoofed piano and photographs it, so
 * that "this looks wrong on the phone" becomes a picture with a name instead
 * of a memory. `build/tour/index.html` puts the two orientations side by side
 * with a box to type into under each one.
 *
 * It asserts only that each screen actually arrived — a screenshot of a blank
 * screen is worse than no screenshot, because it looks like an answer.
 *
 *   npm run tour
 *   npm run tour -- --grep portrait
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import {
  LANDSCAPE,
  PORTRAIT,
  type Orientation,
  saveLedger,
  shoot,
  writeContactSheet,
} from './shoot';

/** A piece with chords, a repeat and enough bars to see a window move. */
const SONG = 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx';
const EXERCISE = 'exercise.five-finger.c-major.right';
const DRILL = 'drill.reading.grand-staff-flash';
const CHORD_DRILL = 'drill.chord.c-f-g';

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {
    /* the service worker keeps a connection open; not a reason to wait for ever */
  });
}

/** Opens a hash route and waits for the screen to actually be there. */
async function go(page: Page, hash: string, screen?: string): Promise<void> {
  await page.goto(`/#${hash}`);
  if (screen) {
    await expect(page.locator(`[data-screen="${screen}"]`)).toBeVisible({ timeout: 60_000 });
  }
  await settle(page);
}

/** Waits for the engraver, which is the slow thing on every score route. */
async function waitForSheet(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 90_000 },
  );
}

for (const [orientation, size] of [
  ['portrait', PORTRAIT],
  ['landscape', LANDSCAPE],
] as [Orientation, { width: number; height: number }][]) {
  test.describe(orientation, () => {
    test.use({ viewport: size });

    test(`every screen, ${orientation}`, async ({ page }) => {
      const midi: MidiMock = await installMidiMock(page, { permission: 'granted' });

      // --- the three tabs ------------------------------------------------
      await go(page, '/today', 'today');
      await shoot(page, orientation, '01-today', 'Today', 'The first screen every session. Is the session card readable at a glance, and is the goal line worth the space it takes?');

      await go(page, '/plan', 'plan');
      await shoot(page, orientation, '02-plan', 'Plan', 'Track chips and the stage list. Can you tell where you are?');

      await go(page, '/library', 'library');
      await shoot(page, orientation, '03-library', 'Library', 'Filters, then rows. Is the filter row eating too much of the screen?');

      await go(page, '/progress', 'progress');
      await shoot(page, orientation, '04-progress', 'Progress', 'Week, heat-map, repertoire.');

      await go(page, '/settings', 'settings');
      await shoot(page, orientation, '05-settings', 'Settings', 'A long list. Are the groups obvious, or is it a wall?');

      // --- a lesson ------------------------------------------------------
      await go(page, '/lesson/2.1', 'lesson');
      await shoot(page, orientation, '06-lesson', 'A lesson page', 'Needs line, finder, exercise and song options, the concept text below.');

      // --- the score screen, which is where the time goes -----------------
      await go(page, `/score/${SONG}`, 'score');
      await waitForSheet(page);
      await shoot(page, orientation, '07-score', 'A song, ready to play', 'The sheet should fill the height. Is the control bar in the way? Is the keyboard strip the right size?');

      await page.locator('#score-mode').selectOption('wait');
      await page.locator('#score-input').selectOption('keys');
      await page.locator('#score-play').click();
      await shoot(page, orientation, '08-score-wait', 'Wait mode, waiting', 'The expected key is marked on the strip. Can you find it without hunting?');

      // Play the first two notes so there is something judged to look at.
      for (const note of [62, 64]) {
        await midi.noteOn(note, 80);
        await page.waitForTimeout(120);
        await midi.noteOff(note);
      }
      await shoot(page, orientation, '09-score-played', 'Two notes in', 'Green for right. Is the cursor band clear? Does the strip show what happened?');

      await page.locator('#score-mode').selectOption('tempo');
      await shoot(page, orientation, '10-score-tempo', 'Tempo mode', 'The clock drives. Same screen, different promise.');

      // --- a generated exercise ------------------------------------------
      await go(page, `/score/${EXERCISE}`, 'score');
      await waitForSheet(page);
      await shoot(page, orientation, '11-exercise', 'A generated exercise', 'Short, one hand. Does the fit make four bars enormous, or is it right?');

      // --- drills ---------------------------------------------------------
      await go(page, `/drill/${DRILL}`, 'drill');
      await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', {
        timeout: 60_000,
      });
      await shoot(page, orientation, '12-drill-reading', 'A reading drill', 'One card, the staff, the strip. Is the card big enough?');

      await go(page, `/drill/${CHORD_DRILL}`, 'drill');
      await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', {
        timeout: 60_000,
      });
      await shoot(page, orientation, '13-drill-chord', 'A chord drill', 'Text prompt rather than notation.');

      // --- the shelf, the chart, the folder --------------------------------
      await go(page, '/library/shelf', 'shelf');
      await shoot(page, orientation, '14-shelf', 'The shelf (empty)', 'What a first visit looks like. Does it say what to do?');

      await go(page, '/library/folder', 'folder');
      await shoot(page, orientation, '15-folder', 'The score folder (nothing picked)', 'Filters and an empty list. Same question.');

      await go(page, `/chart/${SONG}`, 'chart');
      await shoot(page, orientation, '16-chart', 'The chord chart', 'Big symbols per bar. Readable from a stand?');

      // --- the rest ---------------------------------------------------------
      await go(page, '/plan/skills', 'skills');
      await shoot(page, orientation, '17-skills', 'Skills review', 'Every concept, with what to practise for it.');

      await go(page, '/today/metronome', 'metronome');
      await shoot(page, orientation, '18-metronome', 'The metronome', 'Standalone. Are the controls thumb-sized?');

      await go(page, '/settings/diagnostics', 'diagnostics');
      await shoot(page, orientation, '19-diagnostics', 'Diagnostics', 'The screen you send me when something is wrong.');

      await go(page, '/settings/midi', 'midi');
      await shoot(page, orientation, '20-midi', 'MIDI settings', 'With a piano connected (spoofed here).');

      saveLedger();
      writeContactSheet();
    });
  });
}
