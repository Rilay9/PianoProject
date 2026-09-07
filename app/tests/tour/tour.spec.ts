/**
 * The UX tour — every screen and every state, in every shape it is used in.
 *
 * Not a test. It drives the app with a spoofed piano and photographs it, so
 * that "this looks wrong on the phone" stops being a memory and becomes a
 * picture with a name. `build/tour/index.html` puts the four form factors side
 * by side — phone and tablet, each way up — with a box to type into under each.
 *
 * Every scene asserts that its screen actually arrived before the shutter
 * opens — a photograph of a blank screen is worse than no photograph, because
 * it looks like an answer. A scene that cannot be reached is recorded as a gap
 * and printed at the end: one broken screen should not cost the other seventy.
 *
 *   npm run tour
 *   npm run tour -- --grep "^portrait"
 */
import { expect, test, type Page } from '@playwright/test';

import { openScoreMenu, openTempoSheet, withScoreMenu } from '../e2e/scoreControls';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import {
  FORM_FACTORS,
  identicalShots,
  type Orientation,
  saveLedger,
  shoot,
  writeContactSheet,
} from './shoot';
import { seedFolder, seedProgress, seedShelf, setSetting } from './seed';
import { auditScreen, summarise, type Finding } from './audit';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports');
const MXL = path.join(FIXTURES, 'test-tune.mxl');
const PDF = path.join(FIXTURES, 'two-systems.pdf');

/** What an import of `test-tune.mxl` is called once it is in. */
const IMPORTED = 'import.imported-test-tune';
const IMPORTED_PDF = 'import.two-systems';
/** A quarried song — the one that was on his phone when he sent the pictures. */
const SONG = 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx';
/** One of the 22 items with named sections, so the section picker has work. */
const SECTIONED = 'song.classical.petzold-minuet-g-bwv-anh114';
const EXERCISE = 'exercise.five-finger.c-major.right';
/** A title only the placeholder rows carry, for the "import needed" state. */
const PLACEHOLDER = 'G Minor Bach';

/**
 * Every drill kind in the catalogue, with one real id each.
 *
 * `sheet` marks the one kind that is not a drill screen at all: a sight-reading
 * drill is four bars of notation, so `#/drill/…` hands it to the Score screen
 * (docs/05 §8). Photographing it as a drill would have photographed nothing.
 */
const DRILLS: { kind: string; id: string; note: string; sheet?: true }[] = [
  { kind: 'note-flash', id: 'drill.reading.grand-staff-flash', note: 'A note on a staff, answered on the keys.' },
  { kind: 'sight-reading', id: 'drill.reading.sight-reading-1', note: 'Four bars drawn fresh each time — on the Score screen, not the drill one.', sheet: true },
  { kind: 'find-key', id: 'drill.reading.find-all-cs', note: 'Every C on the keyboard.' },
  { kind: 'transposition', id: 'drill.reading.transposition', note: 'Four bars, somewhere else.' },
  { kind: 'chord', id: 'drill.chord.c-f-g', note: 'A named chord, played.' },
  { kind: 'inversion', id: 'drill.chord.inversions', note: 'Root, first, second.' },
  { kind: 'extended-chord', id: 'drill.jazz.extended-chords', note: 'Sevenths and ninths — long names, small space.' },
  { kind: 'chord-scale', id: 'drill.jazz.chord-scale', note: 'A chord and the scale that goes over it.' },
  { kind: 'arpeggio', id: 'drill.pattern.lh-accompaniment', note: 'A broken-chord pattern under the hand.' },
  { kind: 'five-finger', id: 'drill.technique.five-finger-lh', note: 'The shape, without the reading.' },
  { kind: 'ear-interval', id: 'drill.ear.interval-2nd-3rd', note: 'Heard, not seen — is the prompt clear enough?' },
  { kind: 'ear-chord', id: 'drill.ear.major-minor', note: 'Major or minor.' },
  { kind: 'ear-progression', id: 'drill.ear.cadences', note: 'A cadence named by ear.' },
  { kind: 'ear-tune', id: 'drill.ear.tune', note: 'A tune played back.' },
  { kind: 'call-response', id: 'drill.ear.melodic-dictation', note: 'A phrase played, then taken back.' },
  { kind: 'rhythm', id: 'drill.ear.rhythm-dictation', note: 'A one-line staff and a count-in.' },
  { kind: 'harmonic-dictation', id: 'drill.theory.harmonic-dictation', note: 'A progression heard back as chords.' },
  { kind: 'roman-numeral', id: 'drill.theory.roman-numerals', note: 'Naming degrees in a key.' },
  { kind: 'mode', id: 'drill.theory.modes', note: 'A mode named, then played.' },
  { kind: 'pedal', id: 'drill.pedal.changes', note: 'A lamp that follows the pedal.' },
  { kind: 'dynamics', id: 'drill.dynamics.p-f', note: 'Two phrases, metered and compared.' },
  { kind: 'backing-track', id: 'drill.blues.lh-patterns', note: 'A loop to play against; nothing is judged.' },
  { kind: 'placement', id: 'drill.placement.stage-0', note: 'The questions asked on the very first day.' },
];

async function settle(page: Page): Promise<void> {
  // The service worker holds a connection open, so `networkidle` never fires
  // on a warm page. A miss here costs a beat, not a scene.
  await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
}

/** Goes somewhere and waits for the screen that was asked for. */
async function go(page: Page, hash: string, screen: string): Promise<void> {
  await page.goto(`/#${hash}`);
  await expect(page.locator(`[data-screen="${screen}"]`)).toBeVisible({ timeout: 60_000 });
  await settle(page);
}

/** Waits for OSMD to have actually engraved something. */
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

/** Plays a phrase on the spoofed piano. */
async function play(page: Page, midi: MidiMock, notes: number[]): Promise<void> {
  for (const note of notes) {
    await midi.noteOn(note, 78);
    await page.waitForTimeout(110);
    await midi.noteOff(note);
    await page.waitForTimeout(60);
  }
}

/**
 * Whether something is on the screen without scrolling.
 *
 * `scrollIntoViewIfNeeded` is what several scenes do to bring a control up, and
 * it silently does nothing when the element is missing — which is how a scene
 * captioned "the session controls" came back as a picture of the top of the
 * screen. This is the check that says it worked.
 */
async function inView(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
  }, selector);
}

/** Imports a fixture once; a second call finds it already there. */
async function importScore(page: Page, file: string, id: string): Promise<void> {
  await go(page, '/library', 'library');
  if ((await page.locator(`.list-row[data-item="${id}"]`).count()) > 0) return;
  await page.locator('#library-file').setInputFiles(file);
  await expect(page.locator(`.list-row[data-item="${id}"]`)).toBeVisible({ timeout: 60_000 });
}

for (const { orientation, size } of FORM_FACTORS) {
  test.describe(orientation, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 1_800_000 });

    test(`every screen, ${orientation}`, async ({ page }) => {
      await page.addInitScript(() => {
        if (sessionStorage.getItem('tour-fresh') === null) {
          sessionStorage.setItem('tour-fresh', '1');
          indexedDB.deleteDatabase('pianopath');
          localStorage.clear();
        }
      });
      const midi: MidiMock = await installMidiMock(page, { permission: 'granted' });
      const gaps: string[] = [];
      const audited: { scene: string; findings: Finding[] }[] = [];

      /**
       * One photograph. A scene that will not open is a gap, not a failure.
       *
       * `prove` is the fifth argument and it is not optional: a selector that
       * must be on the screen, or a predicate that must be true, *before* the
       * shutter opens. Thirteen of the tour's 328 pictures turned out to be
       * pixel-identical to another scene with a different caption — a scene
       * whose body had quietly failed and had photographed the screen it
       * started from. A picture that looks like an answer and is not is worse
       * than a gap, so a scene that cannot prove itself becomes one.
       */
      const scene = async (
        slug: string,
        title: string,
        note: string,
        body: () => Promise<void>,
        prove: string | ((page: Page) => Promise<boolean>),
      ): Promise<void> => {
        try {
          await body();
          await expect
            .poll(
              async () =>
                typeof prove === 'function'
                  ? await prove(page)
                  : await page.locator(prove).first().isVisible(),
              { timeout: 15_000, message: `nothing proved the scene: ${String(prove)}` },
            )
            .toBe(true);
          await shoot(page, orientation, slug, title, note);
          // Photographed and checked in the same visit: the shapes a machine
          // can find — a control off the edge, a control below the fold, a
          // native input painted for the wrong theme — cost one round trip
          // here and a great deal of squinting otherwise.
          const findings = await auditScreen(page);
          if (findings.length > 0) audited.push({ scene: slug, findings });
        } catch (cause) {
          const why = cause instanceof Error ? cause.message.split('\n')[0] : 'failed';
          gaps.push(`${slug}: ${why}`);
        }
      };

      // ---------------------------------------------- a phone out of the box
      await scene('01-today-empty', 'Today, first launch', 'Nothing practised yet. Does it say where to start?', async () => {
        await go(page, '/today', 'today');
      }, '[data-screen="today"] .list-row, [data-screen="today"] .block');
      // Only where scrolling to it means anything. On a tablet the whole of
      // Today is already on the screen, so this scene was a second copy of
      // `01` with a different caption — one of the thirteen pixel-identical
      // pairs. Better absent than duplicated.
      if (!orientation.startsWith('tablet')) {
        await scene('02-today-controls', 'Today, the session controls', 'Length, goal, shuffle, start. Thumb-sized?', async () => {
          await go(page, '/today', 'today');
          await page.locator('#today-start').scrollIntoViewIfNeeded();
        }, async (p) => inView(p, '#today-start'));
      }
      await scene('03-plan', 'Plan', 'Stages with their completion. Can you tell where you are?', async () => {
        await go(page, '/plan', 'plan');
        await expect(page.locator('.list-row[data-stage="0"]')).toBeVisible();
      }, '.list-row[data-stage="0"]');
      await scene('04-plan-open', 'Plan, a later stage opened', 'The rungs inside a stage.', async () => {
        await go(page, '/plan', 'plan');
        await page.locator('.list-row[data-stage="2"]').click();
        await expect(page.locator('.list-row[data-lesson="2.1"]')).toBeVisible();
      }, '.list-row[data-lesson="2.1"]');
      await scene('05-plan-tracks', 'Plan, the tracks', 'Classical, ragtime, blues — the paths beside the core one.', async () => {
        await go(page, '/plan', 'plan');
        await page.locator('#plan-tracks-open').click();
      }, '#plan-tracks-sheet');
      await scene('06-library', 'Library', 'Filters, then rows. Is the filter row eating the screen?', async () => {
        await go(page, '/library', 'library');
        await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 60_000 });
      }, '#library-list .list-row');
      await scene('07-progress-empty', 'Progress, first launch', 'An empty week and an empty heat-map.', async () => {
        await go(page, '/progress', 'progress');
      }, '#progress-heatmap');
      await scene('08-settings', 'Settings, top', 'A long list. Are the groups obvious, or is it a wall?', async () => {
        await go(page, '/settings', 'settings');
      }, '[data-screen="settings"] .setting-row');
      await scene('09-settings-storage', 'Settings, storage', 'Backup, restore and what is taking room.', async () => {
        await go(page, '/settings', 'settings');
        await page.locator('#settings-storage').scrollIntoViewIfNeeded();
      }, async (p) => inView(p, '#settings-storage'));
      await scene('10-shelf-empty', 'The shelf, empty', 'A first visit. Does it say what to do?', async () => {
        await go(page, '/library/shelf', 'shelf');
      }, '[data-screen="shelf"]');
      await scene('11-folder-empty', 'Score folder, nothing picked', 'The pitch for pointing it at 37,261 files.', async () => {
        await go(page, '/library/folder', 'folder');
      }, '[data-screen="folder"]');

      // -------------------------------------------------------------- lessons
      await scene('12-lesson', 'A lesson page', 'Needs line, options, finder, then the concept text.', async () => {
        await go(page, '/lesson/2.1', 'lesson');
        await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible({ timeout: 60_000 });
      }, '#lesson-exercises .list-row');
      await scene('13-lesson-text', 'A lesson, scrolled to the text', 'The teaching itself. Readable length?', async () => {
        await go(page, '/lesson/2.1', 'lesson');
        await page.locator('#lesson-text').scrollIntoViewIfNeeded();
      }, async (p) => inView(p, '#lesson-text'));
      await scene('14-lesson-finder', 'The finder sheet', 'A search line and a chatbot prompt, both copyable.', async () => {
        await go(page, '/lesson/2.1', 'lesson');
        await page.locator('#lesson-find-more').click();
        await expect(page.locator('#finder-sheet')).toBeVisible();
      }, '#finder-sheet');
      await scene('15-lesson-paper-sheet', 'I have this on paper', 'The form, with the rung already chosen.', async () => {
        await go(page, '/lesson/3.5', 'lesson');
        await page.locator('#lesson-have-paper').click();
        await expect(page.locator('#piece-sheet')).toBeVisible();
      }, '#piece-sheet');
      await scene('16-lesson-track', 'A rung on a track', 'Same page, different path — does it read as one?', async () => {
        await go(page, '/lesson/classical.3', 'lesson');
      }, '[data-screen="lesson"] .block');

      // ---------------------------------------------------------------- score
      await scene('20-score', 'A song, ready to play', 'Does the sheet fill the height? Bar in the way? Strip the right size?', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
      }, '#score-stage .is-front svg');
      await scene('21-score-wait', 'Wait mode, waiting', 'The expected key is marked. Can you find it without hunting?', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('wait');
        await page.locator('#score-play').click();
      }, '[data-screen="score"][data-running="true"][data-mode="wait"]');
      await scene('22-score-played', 'Two notes in', 'Green for right. Is the cursor band clear?', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('wait');
        await page.locator('#score-play').click();
        await play(page, midi, [62, 64]);
      }, '#score-stage .is-front .is-correct');
      await scene('23-score-wrong', 'A wrong note', 'Red, and it does not move on — the state that stopped you on the F sharp.', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('wait');
        await page.locator('#score-play').click();
        // G4 against the D4 the piece opens on: wrong, and inside Suo Gan's
        // own range, so the strip can show it. C3 was outside the range the
        // strip draws, so the picture had nothing red in it anywhere.
        await play(page, midi, [67, 67, 67]);
      }, '#score-stage .is-front .is-wrong');
      await scene('24-score-names', 'The same, with note names on', 'One line under the title. Enough? Too much?', async () => {
        await setSetting(page, 'showNoteNames', true);
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('wait');
        await page.locator('#score-play').click();
      }, '#score-waiting');
      await scene('25-score-tempo', 'Tempo mode', 'The clock drives. Same screen, different promise.', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('tempo');
      }, '[data-screen="score"][data-mode="tempo"]');
      await scene('26-score-listen', 'Listen mode', 'It plays; you watch. Is the cursor followable?', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('listen');
        await page.locator('#score-play').click();
        await page.waitForTimeout(1800);
      }, '[data-screen="score"][data-mode="listen"]');
      // Deliberately no assertion on `data-visible` here: decision 5 says the
      // bar hides only when it is taking room from the notation, which is true
      // sideways and false upright. Both are the picture to look at.
      await scene('27-score-bar-hidden', 'Mid-run, four seconds in', 'The bar hides itself only where it was taking room from the music (decision 5).', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('tempo');
        await page.locator('#score-play').click();
        await page.waitForTimeout(4_500);
      }, '[data-screen="score"][data-running="true"]');
      await scene('28-score-no-strip', 'Keys hidden', 'A fifth of the height back. Worth it?', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await withScoreMenu(page, async () => {
          await page.locator('#score-strip-toggle').click();
        });
        await page.waitForTimeout(800);
      }, async (p) => !(await p.locator('#score-strip').isVisible()));
      await scene('29-score-blind', 'Blind mode', 'The notation is hidden on purpose. Is that obvious?', async () => {
        await go(page, `/score/${SONG}?blind=1`, 'score');
        await page.waitForTimeout(2000);
      }, async (p) => !(await p.locator('#score-stage .is-front svg').isVisible()));
      await scene('30-score-performance', 'Performance mode', 'No marking, no stopping. Does it feel different enough?', async () => {
        await go(page, `/score/${SONG}?performance=1`, 'score');
        await waitForSheet(page);
      }, async (p) => (await p.locator('#score-restart').count()) === 0);
      await scene('31-score-sections', 'A piece with named sections', 'The section picker, in the ⋯ sheet with the rest of the settings.', async () => {
        await go(page, `/score/${SECTIONED}`, 'score');
        await waitForSheet(page);
        await openScoreMenu(page);
        await expect(page.locator('#score-section')).toBeVisible({ timeout: 30_000 });
      }, '#score-section');
      await scene('32-score-loop', 'A section looped', 'The loop names the section rather than bar numbers.', async () => {
        await go(page, `/score/${SECTIONED}`, 'score');
        await waitForSheet(page);
        await openScoreMenu(page);
        await expect(page.locator('#score-section')).toBeVisible({ timeout: 30_000 });
        await page.locator('#score-section').selectOption({ index: 1 });
        await page.waitForTimeout(900);
      }, async (p) => /Loop .+/.test((await p.locator('#score-loop').textContent()) ?? ''));
      await scene('33-score-four-bars', 'Four bars in the window', 'More to read ahead into, smaller notes.', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await withScoreMenu(page, async () => {
          await page.locator('#score-bars-up').click();
          await page.locator('#score-bars-up').click();
        });
        await page.waitForTimeout(1200);
      }, async (p) => (await p.locator('#score-bars').textContent()) === '4 bars');
      await scene('34-exercise', 'A generated exercise', 'Four bars, one hand. Is the fit right for something short?', async () => {
        await go(page, `/score/${EXERCISE}`, 'score');
        await waitForSheet(page);
      }, '#score-stage .is-front svg');
      await scene('36-score-controls', 'The ⋯ sheet', 'Everything that left the bar, each with its word. One tap from the score.', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await openScoreMenu(page);
      }, '#score-more-sheet');
      await scene('37-score-tempo-sheet', 'Setting the tempo', 'The slider and a typed bpm, behind the tempo label on the bar.', async () => {
        await go(page, `/score/${SONG}`, 'score');
        await waitForSheet(page);
        await openTempoSheet(page);
      }, '#score-tempo-sheet');
      await scene('35-score-summary', 'The run summary', 'What it says when a run ends.', async () => {
        await go(page, `/score/${EXERCISE}`, 'score');
        await waitForSheet(page);
        await page.locator('#score-mode').selectOption('tempo');
        await page.locator('#score-play').click();
        await expect(page.locator('#score-summary')).toBeVisible({ timeout: 180_000 });
      }, '#score-summary');

      // --------------------------------------------------------------- drills
      for (const { kind, id, note, sheet } of DRILLS) {
        await scene(`40-drill-${kind}`, `Drill — ${kind}`, note, async () => {
          if (sheet) {
            await go(page, `/drill/${id}`, 'score');
            await waitForSheet(page);
            return;
          }
          await go(page, `/drill/${id}`, 'drill');
          await expect(page.locator('[data-screen="drill"]')).not.toHaveAttribute(
            'data-drill',
            'loading',
            { timeout: 60_000 },
          );
          await page.waitForTimeout(700);
        }, sheet ? '#score-stage .is-front svg' : '[data-screen="drill"]:not([data-drill="loading"]) #drill-stage');
      }
      await scene('41-drill-result', 'A drill result sheet', 'Four sections of advice after a set.', async () => {
        await go(page, '/drill/drill.reading.grand-staff-flash', 'drill');
        await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', {
          timeout: 60_000,
        });
        // Answered wrong, quickly: the sheet is the subject here, not the score.
        for (let i = 0; i < 30; i += 1) {
          if (await page.locator('#drill-summary').isVisible()) break;
          await midi.noteOn(48, 70);
          await midi.noteOff(48);
          await page.waitForTimeout(160);
        }
        await expect(page.locator('#drill-summary')).toBeVisible({ timeout: 30_000 });
      }, '#drill-summary');

      // ------------------------------------------------------- other screens
      await scene('50-skills', 'Skills review', 'Every concept, with what to practise for it.', async () => {
        await go(page, '/plan/skills', 'skills');
      }, '[data-screen="skills"] .list-row');
      await scene('51-metronome', 'The metronome', 'Standalone. Are the controls thumb-sized?', async () => {
        await go(page, '/today/metronome', 'metronome');
      }, '[data-screen="metronome"]');
      await scene('52-midi', 'MIDI settings', 'With a piano connected (spoofed here).', async () => {
        await go(page, '/settings/midi', 'midi');
      }, '[data-screen="midi"]');
      await scene('53-mic', 'Microphone calibration', 'The other way it can hear you.', async () => {
        await go(page, '/settings/mic', 'mic');
      }, '[data-screen="mic"]');
      await scene('54-diagnostics', 'Diagnostics', 'The screen you send me when something is wrong.', async () => {
        await go(page, '/settings/diagnostics', 'diagnostics');
        await page.waitForTimeout(3000);
      }, '[data-screen="diagnostics"]');

      // ---------------------------------------------- imports, charts, PDFs
      await scene('60-import-assign', 'Two taps from a share', 'The assign sheet: rung, level, concepts, Save.', async () => {
        await go(page, '/library?for=2.1', 'library');
        await page.locator('#library-file').setInputFiles(MXL);
        await expect(page.locator('#assign-sheet')).toBeVisible({ timeout: 60_000 });
      }, '#assign-sheet');
      await scene('61-library-mine', 'Library, only mine', 'After an import, filtered to his own files.', async () => {
        await importScore(page, MXL, IMPORTED);
        await page.locator('#library-mine').click();
        await expect(page.locator(`.list-row[data-item="${IMPORTED}"]`)).toBeVisible();
      }, `.list-row[data-item="${IMPORTED}"]`);
      await scene('62-library-detail', 'The details of an item', 'Level, source, licence, and what it trains.', async () => {
        await go(page, '/library', 'library');
        await page
          .locator('#library-list .list-row')
          .first()
          .getByRole('button', { name: 'Details' })
          .click();
        await expect(page.locator('#library-detail')).toBeVisible({ timeout: 30_000 });
      }, '#library-detail');
      await scene('63-library-placeholder', 'A piece it cannot bundle', 'What "import needed" looks like on a row.', async () => {
        await go(page, '/library', 'library');
        await page.locator('#library-search').fill(PLACEHOLDER);
        await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 30_000 });
      }, '#library-list .list-row');
      await scene('64-chart', 'The chord chart', 'Big symbols per bar. Readable from a stand?', async () => {
        await importScore(page, MXL, IMPORTED);
        await go(page, `/chart/${IMPORTED}`, 'chart');
        await expect(page.locator('.chart-cell[data-bar="1"]')).toBeVisible({ timeout: 30_000 });
      }, '.chart-cell[data-bar="1"]');
      await scene('65-chart-no-chords', 'A chart with nothing to show', 'It says so plainly rather than drawing an empty grid.', async () => {
        await go(page, '/chart/song.folk.hot-cross-buns', 'chart');
        await expect(page.locator('#chart-status')).toContainText('no chord symbols', {
          timeout: 30_000,
        });
      }, async (p) => ((await p.locator('#chart-status').textContent()) ?? '').includes('no chord symbols'));
      await scene('66-pdf', 'A PDF on the shelf', 'Pages, not notes — and it says so.', async () => {
        await importScore(page, PDF, IMPORTED_PDF);
        await go(page, `/pdf/${IMPORTED_PDF}`, 'pdf');
        await expect(page.locator('#pdf-label')).toContainText('system', { timeout: 60_000 });
      }, '#pdf-label');
      await scene('67-pdf-adjust', 'Telling it where the systems are', 'The one thing a PDF ever needs corrected.', async () => {
        await go(page, `/pdf/${IMPORTED_PDF}`, 'pdf');
        await expect(page.locator('#pdf-label')).toContainText('system', { timeout: 60_000 });
        await page.locator('#pdf-adjust-toggle').click();
        await expect(page.locator('#pdf-adjust')).toBeVisible();
      }, '#pdf-adjust');

      // ------------------------------------------ the same app, but *used*
      await scene('70-shelf-used', 'The shelf, with a book', 'Two pieces, one registered against a rung.', async () => {
        await seedShelf(page);
        await go(page, '/library/shelf', 'shelf');
      }, '#shelf-list [data-piece]');
      await scene('71-piece-sheet', 'Adding a piece to a book', 'Title, page, rung, concepts and a twin.', async () => {
        await go(page, '/library/shelf', 'shelf');
        await page.locator('[id^="shelf-add-piece-"]').first().click();
        await expect(page.locator('#piece-sheet')).toBeVisible({ timeout: 30_000 });
      }, '#piece-sheet');
      await scene('72-lesson-paper', 'A rung with a book behind it', 'The "from your own books" block, once there is a shelf.', async () => {
        await go(page, '/lesson/4.4', 'lesson');
        await expect(page.locator('#lesson-paper')).toContainText('No. 12', { timeout: 30_000 });
      }, '#lesson-paper');
      await scene('73-paper', 'Practising against paper', 'A metronome, a count, and one honest sentence.', async () => {
        await go(page, '/library/shelf', 'shelf');
        await page
          .locator('#shelf-list [data-piece]')
          .first()
          .getByRole('button', { name: 'Practise' })
          .click();
        await expect(page.locator('[data-screen="paper"]')).toBeVisible({ timeout: 30_000 });
      }, '[data-screen="paper"]');
      await scene('74-paper-summary', 'What paper practice can say', 'Steadiness, and what it cannot judge.', async () => {
        await page.locator('#paper-start').click();
        await play(page, midi, [60, 62, 64, 65, 67, 65, 64, 62]);
        await page.locator('#paper-stop').click();
        await expect(page.locator('#paper-summary')).toBeVisible({ timeout: 30_000 });
      }, '#paper-summary');

      await scene('75-today-used', 'Today, a fortnight in', 'Now with a streak and a review queue. Still readable?', async () => {
        await go(page, '/today', 'today');
        await seedProgress(page);
        await go(page, '/today', 'today');
      }, '#today-card .list-row');
      await scene('76-today-swap', 'Swapping a row', 'The alternatives sheet, with the "not a song" filter.', async () => {
        await go(page, '/today', 'today');
        await page
          .locator('#today-card .list-row')
          .first()
          .getByRole('button', { name: 'Swap' })
          .click();
        await expect(page.locator('#today-swap')).toBeVisible({ timeout: 30_000 });
      }, '#today-swap');
      await scene('77-progress-used', 'Progress, a fortnight in', 'Week, heat-map, repertoire — the payoff screen.', async () => {
        await go(page, '/progress', 'progress');
      }, '#progress-repertoire .list-row');
      await scene('78-progress-heatmap', 'The heat-map', 'A fortnight of squares. Legible at this width?', async () => {
        await go(page, '/progress', 'progress');
        await page.locator('#progress-heatmap').scrollIntoViewIfNeeded();
      }, async (p) => inView(p, '#progress-heatmap [data-level]:not([data-level="0"])'));

      await scene('80-folder-full', 'The score folder, all 37,261', 'The real size. Does the list stay usable?', async () => {
        await go(page, '/library/folder', 'folder');
        await seedFolder(page);
        await go(page, '/library/folder', 'folder');
        await expect(page.locator('#folder-list .list-row').first()).toBeVisible({ timeout: 60_000 });
      }, '#folder-list .list-row');
      await scene('81-folder-search', 'Searching the folder', 'One row out of 37,261.', async () => {
        await go(page, '/library/folder', 'folder');
        await page.locator('#folder-search').fill('Piece number 4242');
        await page.waitForTimeout(900);
      }, async (p) => ((await p.locator('#folder-list').textContent()) ?? '').includes('4242'));

      // --------------------------------------------------------- edge states
      await scene('90-lesson-locked', 'A rung that comes later', 'A badge and a reason, never a disabled card.', async () => {
        await setSetting(page, 'strictPrerequisites', true);
        await go(page, '/lesson/4.2', 'lesson');
        await expect(page.locator('#lesson-lock')).toBeVisible({ timeout: 30_000 });
      }, '#lesson-lock');
      await scene('91-bad-link', 'A route that does not exist', 'What a bad link does — it should land somewhere, not nowhere.', async () => {
        await setSetting(page, 'strictPrerequisites', false);
        await page.goto('/#/score/song.nope.not-a-real-item');
        await page.waitForTimeout(1500);
      }, async (p) => ((await p.locator('#score-status').textContent()) ?? '').includes('Unknown item'));

      saveLedger();
      writeContactSheet();
      if (audited.length > 0) {
        const total = audited.reduce((n, a) => n + a.findings.length, 0);
        const screens = audited.length;
        console.log(
          `\n${orientation}: ${String(total)} to look at, across ` +
            `${String(screens)} screen${screens === 1 ? '' : 's'}`,
        );
        for (const line of summarise(audited)) console.log(`  ${line}`);
      }
      if (gaps.length > 0) {
        console.log(`\n${orientation}: ${String(gaps.length)} scene(s) could not be shot:`);
        for (const gap of gaps) console.log(`  - ${gap}`);
      }
      // Two scenes with one picture between them: one of them did not reach
      // the state its caption claims, and the tour said nothing about it for
      // three phases. Zero is the expected number.
      const identical = identicalShots().filter((entry) => entry.orientation === orientation);
      if (identical.length > 0) {
        console.log(`\n${orientation}: identical pictures under different captions:`);
        for (const entry of identical) console.log(`  - ${entry.slugs.join(' = ')}`);
      }
    });
  });
}
