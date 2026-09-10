/**
 * One picture per state of the score screen (`docs/08-score-render-states.md`).
 *
 * The tour walks a journey; this walks the **state space**. Every cell below is
 * a row of `08` §2 driven on purpose, photographed, and measured against the
 * invariants in §9 — so a state nobody would think to walk through is still
 * seen, and so "it looks right" and "it is right" are two separate answers.
 */
import { expect, test } from '@playwright/test';
import { installMidiMock, type MidiMock } from '../e2e/fixtures/midiMock';
import { reset, saveRecords, shoot, summarise, writeSheet } from './gallery';

/** Four bars, one staff, always present, and short enough to finish. */
const SONG = 'song.folk.hot-cross-buns';
/** A grand staff, for the cells where two staves change the answer. */
const SONG_TWO_HANDS = 'song.folk.twinkle.ht';
/** 3/4 with a pickup: the only bar that may be numbered 0. */
const SONG_PICKUP = 'song.folk.happy-birthday.simple';
/** The longest title in the authored library, 53 characters, for §9.23. */
const SONG_LONG_TITLE = 'song.folk.when-the-saints.alternating';

const PHONE_UP = { width: 360, height: 780 };
const PHONE_UP_BIG = { width: 412, height: 915 };
const PHONE_SIDE = { width: 780, height: 360 };
const PHONE_SIDE_BIG = { width: 915, height: 412 };
/**
 * The owner's actual phone, which is not a round number.
 *
 * Every fixture here was 360 x 780 or 780 x 360, and three faults in one week
 * were invisible for that reason alone: a width that divides evenly into 360
 * does not divide evenly into 342, and 740 is the landscape width at which the
 * control bar wrapped onto a second row. These are *extra* cells, never
 * replacements — the round sizes stay exactly as they are so that nothing
 * already photographed moves.
 */
const PHONE_UP_REAL = { width: 342, height: 740 };
const PHONE_SIDE_REAL = { width: 740, height: 342 };
const TABLET_UP = { width: 900, height: 1200 };
const TABLET_SIDE = { width: 1200, height: 900 };

type Page = import('@playwright/test').Page;

async function settings(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.addInitScript((p) => {
    const raw = localStorage.getItem('pianopath.settings');
    const s = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
    localStorage.setItem('pianopath.settings', JSON.stringify({ ...s, ...(p as object) }));
  }, patch);
}

async function openScore(page: Page, query = '', song = SONG): Promise<void> {
  await page.goto(`/#/score/${song}${query}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
  // Let the fit settle: the strip and the bar each take their share a frame
  // after the score arrives, and a shot taken before that is of a screen the
  // owner never sees.
  //
  // 2.5 s, not 1.5. The piece measurement is scheduled with
  // `requestIdleCallback(…, { timeout: 1500 })`, so it lands *at* 1,500 ms in
  // the worst case and the fit changes when it does — which made this wait a
  // coin toss between the stand-in size and the measured one, and is one of
  // the two mechanisms behind "the same piece fills 58 % of the width on one
  // run and 90 % on the next". A cell has to be a photograph of a settled
  // screen or it is not evidence of anything.
  await page.waitForTimeout(2_500);
}

async function setMode(page: Page, mode: string): Promise<void> {
  await page.locator('#score-mode').selectOption(mode);
}

/** Plays enough notes to be a few steps in, so a run is a real run. */
async function playInto(page: Page, midi: MidiMock, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    const run = await page.evaluate(() => {
      const h = (window as unknown as { __pianopath?: { scoreRun?: () => unknown } })
        .__pianopath;
      return h?.scoreRun ? (h.scoreRun() as { expected: number[]; pitches?: number[] } | null) : null;
    });
    // Free expects nothing and still turns the page on the step's own notes.
    // All of them: a grand staff's step is a chord, and one note of it does
    // not move a Wait run on — which left every grand-staff cell at step 0.
    const notes = (run?.expected?.length ?? 0) > 0 ? run?.expected ?? [] : run?.pitches ?? [];
    if (notes.length === 0) break;
    for (const note of notes) await midi.noteOn(note, 78);
    await page.waitForTimeout(90);
    for (const note of notes) await midi.noteOff(note);
    await page.waitForTimeout(70);
  }
}

test.describe.configure({ timeout: 900_000 });

/** The run's step index, from the app's own hook; -1 when no run is on. */
async function stepNow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const h = (window as unknown as { __pianopath?: { scoreRun?: () => { step: number } | null } }).__pianopath;
    return h?.scoreRun?.()?.step ?? -1;
  });
}

test('every state, photographed and measured', async ({ page }) => {
  reset();
  const midi: MidiMock = await installMidiMock(page, { permission: 'granted' });

  // ------------------------------------------------------- the harness first
  // Before any cell: the hook exists and the spoofed piano moves the run.
  // Without this the gallery once photographed thirty-nine convincing cells
  // of the wrong state, because the hook it drove was misnamed.
  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  const hooked = await page.evaluate(
    () => typeof (window as unknown as { __pianopath?: { scoreRun?: unknown } }).__pianopath?.scoreRun === 'function',
  );
  expect(hooked, 'the app exposes __pianopath.scoreRun; the harness cannot drive without it').toBe(true);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await playInto(page, midi, 3);
  expect(await stepNow(page), 'three notes played must move a Wait run three steps').toBeGreaterThanOrEqual(3);

  // ---------------------------------------------------------------- branch 1
  // Can I read it at all? Every form factor, then the failures.
  for (const [name, size] of [
    ['phone-upright-360', PHONE_UP],
    ['phone-upright-342', PHONE_UP_REAL],
    ['phone-upright-412', PHONE_UP_BIG],
    ['phone-sideways-780', PHONE_SIDE],
    ['phone-sideways-740', PHONE_SIDE_REAL],
    ['phone-sideways-915', PHONE_SIDE_BIG],
    ['tablet-upright-900', TABLET_UP],
    ['tablet-sideways-1200', TABLET_SIDE],
  ] as const) {
    await page.setViewportSize(size);
    await openScore(page);
    await shoot(page, '1-can-i-read-it', `size--${name}`, 'Idle, Wait, dark. Is it big and still?', {
      running: false,
      viewportW: size.width,
      // Height, not orientation, decides (`08` §4.1): 600 px or more holds slots.
      arrangement: size.height >= 600 ? 'slots' : 'single',
    });
  }

  // The theme, on the binding size.
  await page.setViewportSize(PHONE_UP);
  await page.emulateMedia({ colorScheme: 'light' });
  await openScore(page);
  await shoot(page, '1-can-i-read-it', 'theme--light', 'Light theme: notation must not be inverted.', { theme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });

  // The lifecycle's terminal states — §3.1, and P4: each must say why and leave.
  await page.goto('/#/score/song.not.a.real.item');
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shoot(page, '1-can-i-read-it', 'lifecycle--unknown-item', 'Unknown id: says so, and Back is there.', {
    running: false,
    statusIncludes: 'Unknown item',
  });

  // ---------------------------------------------------------------- branch 2
  // Where am I? Arrangement, the cursor, the keys.
  for (const [song, staves] of [
    [SONG, 'one-staff'],
    [SONG_TWO_HANDS, 'grand-staff'],
  ] as const) {
    for (const [name, size] of [
      ['slots--upright', PHONE_UP],
      ['chunk--sideways', PHONE_SIDE],
      ['slots--tablet-upright', TABLET_UP],
      ['slots--tablet-sideways', TABLET_SIDE],
    ] as const) {
      await page.setViewportSize(size);
      await openScore(page, '', song);
      await setMode(page, 'wait');
      await page.locator('#score-play').click();
      await playInto(page, midi, 5);
      await shoot(page, '2-where-am-i', `arrangement--${name}--${staves}`, 'Five notes in: where is the cursor, what is in the other slots?', {
        running: true,
        mode: 'wait',
        minStep: 5,
        arrangement: name.startsWith('chunk') ? 'single' : 'slots',
      });
    }
  }

  // Scroll layout: the whole piece, the cursor held a third down.
  for (const [orient, size] of [
    ['upright', PHONE_UP],
    ['sideways', PHONE_SIDE],
  ] as const) {
    await page.setViewportSize(size);
    await settings(page, { layout: 'scroll' });
    await openScore(page, '', SONG_TWO_HANDS);
    await setMode(page, 'wait');
    await page.locator('#score-play').click();
    await playInto(page, midi, 6);
    await shoot(page, '2-where-am-i', `layout--scroll--${orient}`, 'Scroll layout, six notes in: the cursor between 25 and 40 % down.', {
      running: true,
      layout: 'scroll',
      minStep: 6,
    });
  }
  await settings(page, { layout: 'window' });

  // A pickup: bar 0 is the one bar that may be numbered 0 (`08` §10).
  await page.setViewportSize(PHONE_UP);
  await openScore(page, '', SONG_PICKUP);
  await shoot(page, '2-where-am-i', 'pickup--bar-count', 'A pickup: the count starts at bar 0.', {
    running: false,
    whereIncludes: 'bar 0 /',
  });

  // The keys view, all three.
  for (const view of ['strip', 'ribbon', 'off'] as const) {
    await page.setViewportSize(PHONE_UP);
    await settings(page, { keys: view });
    await openScore(page);
    await shoot(page, '2-where-am-i', `keys--${view}`, `keys: ${view}`, { keysView: view });
  }
  await settings(page, { keys: 'strip' });

  // Hands: the other hand is dimmed, never hidden.
  for (const hand of ['R', 'L', 'both'] as const) {
    await page.setViewportSize(PHONE_UP);
    await openScore(page);
    await page.locator(`#score-hands-${hand}`).click();
    await page.waitForTimeout(300);
    await shoot(page, '2-where-am-i', `hands--${hand}`, `Hands ${hand}: the other hand dimmed, not gone.`, { hands: hand });
  }

  // ---------------------------------------------------------------- branch 3
  // What comes next? The read-ahead, the count-in, the beat dot — by mode.
  for (const mode of ['wait', 'tempo', 'listen', 'free'] as const) {
    for (const [orient, size] of [
      ['upright', PHONE_UP],
      ['sideways', PHONE_SIDE],
      ['tablet', TABLET_UP],
    ] as const) {
      await page.setViewportSize(size);
      await openScore(page);
      await setMode(page, mode);
      await page.locator('#score-play').click();
      // Long enough to be past any count-in and a few steps in.
      if (mode === 'wait' || mode === 'free') await playInto(page, midi, 4);
      else await page.waitForTimeout(4_000);
      await shoot(
        page,
        '3-what-comes-next',
        `mode--${mode}--${orient}`,
        `${mode}, running. Read-ahead line and next key: Tempo and Listen only.`,
        {
          running: true,
          mode,
          hearing: false,
          arrangement: orient === 'sideways' ? 'single' : 'slots',
          // Wait and Free were driven four notes in; Tempo and Listen are
          // still counting in at this tempo, and the line is up from the start.
          ...(mode === 'wait' || mode === 'free' ? { minStep: 4 } : {}),
          readAhead: mode === 'tempo' || mode === 'listen',
        },
      );
    }
  }

  // The count-in, caught while it is up.
  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await setMode(page, 'tempo');
  await page.locator('#score-play').click();
  await page.waitForTimeout(400);
  await shoot(page, '3-what-comes-next', 'count-in--tempo', 'The count-in, low on the stage, one beat lit.', {
    running: true,
    mode: 'tempo',
    countIn: true,
  });

  // ---------------------------------------------------------------- branch 4
  // How am I doing? Colour, the summary, the app's voice.
  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await playInto(page, midi, 3);
  // A deliberate wrong note, for the red — one the strip can show. 37 was
  // two octaves below its left edge, and the cell showed no red at all.
  await midi.noteOn(61, 78);
  await page.waitForTimeout(120);
  await midi.noteOff(61);
  await page.waitForTimeout(300);
  await shoot(page, '4-how-am-i-doing', 'colour--right-and-wrong', 'Green for matched, red for wrong, accent for current.', {
    running: true,
    minStep: 3,
    minCorrectKeys: 1,
    minWrongKeys: 1,
  });

  await settings(page, { showNoteNames: true });
  await openScore(page);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await page.waitForTimeout(600);
  await shoot(page, '4-how-am-i-doing', 'waiting-line--wait', 'Wait, note names on: the waiting line names the note.', {
    running: true,
    mode: 'wait',
    waitingIncludes: 'Waiting for',
  });
  await settings(page, { showNoteNames: false });

  // ---------------------------------------------------------------- branch 5
  // What can I change? The bar at every width, the sheets.
  for (const [name, size] of [
    ['360', PHONE_UP],
    ['342', PHONE_UP_REAL],
    ['412', PHONE_UP_BIG],
    ['780', PHONE_SIDE],
    ['740', PHONE_SIDE_REAL],
    ['1200', TABLET_SIDE],
  ] as const) {
    await page.setViewportSize(size);
    await openScore(page);
    await shoot(page, '5-what-can-i-change', `bar--${name}`, 'One row, always. §9.23.', { viewportW: size.width, running: false });
  }

  // §9.23 against a title that does not fit.
  //
  // The check is correct and had only ever run against *Hot Cross Buns*, whose
  // name is short enough that the bar has room whatever else is on it. The
  // fault it exists for — `⋯` alone on a second row — needed a long name and a
  // 740 px landscape together, which is why a photograph found it and this did
  // not. 53 characters, the longest title in the authored library.
  for (const [name, size] of [
    ['342', PHONE_UP_REAL],
    ['740', PHONE_SIDE_REAL],
    ['780', PHONE_SIDE],
  ] as const) {
    await page.setViewportSize(size);
    await openScore(page, '', SONG_LONG_TITLE);
    await shoot(
      page,
      '5-what-can-i-change',
      `bar--long-title-${name}`,
      'A 53-character title: the bar is still one row. §9.23.',
      { viewportW: size.width, running: false },
    );
  }

  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await page.locator('#score-more').click();
  await page.waitForTimeout(500);
  await shoot(page, '5-what-can-i-change', 'sheet--more-upright', 'The ⋯ sheet upright.', { sheet: true });

  await page.setViewportSize(PHONE_SIDE);
  await openScore(page);
  await page.locator('#score-more').click();
  await page.waitForTimeout(500);
  await shoot(page, '5-what-can-i-change', 'sheet--more-sideways', 'Sideways it must fit without scrolling.', { sheet: true });

  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await page.locator('#score-hear').click();
  await page.waitForTimeout(2_000);
  await shoot(page, '5-what-can-i-change', 'hear-it--running', 'Hear it: a Listen run, mode select unmoved.', {
    running: true,
    hearing: true,
    mode: 'wait',
  });

  // ---------------------------------------------------------------- branch 6
  // What if it goes wrong? Blind, performance, rotation, the end.
  await page.setViewportSize(PHONE_UP);
  await openScore(page, '?blind=1');
  await shoot(page, '6-what-if-it-goes-wrong', 'blind--upright', 'Blind: laid out, hidden, and said so.', {
    running: false,
    statusIncludes: 'Blind',
  });

  await openScore(page, '?performance=1');
  await shoot(page, '6-what-if-it-goes-wrong', 'performance--upright', 'A performance: no restart offered.', { running: false });

  // Rotation mid-run: the run continues, the arrangement is rebuilt.
  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await playInto(page, midi, 3);
  await page.setViewportSize(PHONE_SIDE);
  await page.waitForTimeout(1_500);
  await shoot(page, '6-what-if-it-goes-wrong', 'rotation--mid-run', 'Rotated mid-run: still running, rebuilt sideways.', {
    running: true,
    minStep: 3,
    arrangement: 'single',
  });

  // The turn that had no picture: sideways to upright, at one bar per window,
  // paused, on the owner's own phone.
  //
  // At one bar `updateReadAhead` says `single` whichever way up the phone is,
  // so the arrangement does not change and nothing used to be re-engraved: the
  // sideways sliding chunk stayed on a 2,340 px page and was squeezed into 342
  // px — 34 px of music in a 662 px stage — and in Wait mode, paused, there is
  // no next note to redraw it. Every assertion passed, because they were all
  // about the *width* and a chunk squeezed to fit the width fills the width.
  // A photograph would have shown it in one glance.
  await page.setViewportSize(PHONE_SIDE_REAL);
  await settings(page, { barsPerWindow: 1 });
  await openScore(page);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await playInto(page, midi, 2);
  await page.setViewportSize(PHONE_UP_REAL);
  await page.waitForTimeout(2_500);
  await shoot(
    page,
    '6-what-if-it-goes-wrong',
    'rotation--bars1-real-phone',
    'Turned upright at one bar per window, 740x342 to 342x740: re-engraved for the new width, not the old chunk squeezed into it.',
    { running: true, arrangement: 'single', viewportW: PHONE_UP_REAL.width },
  );
  await settings(page, { barsPerWindow: 2 });

  // The end of a piece: the other slot shows the bars behind, never blank.
  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await playInto(page, midi, 40);
  await page.waitForTimeout(800);
  await shoot(page, '6-what-if-it-goes-wrong', 'end-of-piece', 'The last bars: the slots keep the bars played, and the summary is up.', {
    running: false,
    summary: true,
  });

  await page.setViewportSize(PHONE_UP);
  await openScore(page, '', SONG_TWO_HANDS);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await playInto(page, midi, 80);
  await page.waitForTimeout(800);
  await shoot(page, '6-what-if-it-goes-wrong', 'end-of-piece--grand-staff', 'A grand staff to the end: the summary, and the bars kept.', {
    running: false,
    summary: true,
  });

  // ------------------------------------------------------------------ report
  saveRecords();
  writeSheet();
  const { total, broken, known } = summarise();
  console.log(`\nstates: ${String(total)} cells`);
  if (known.length > 0) {
    console.log(`\n  known divergences (docs/08 §11), marked on the sheet, not failed:`);
    for (const line of known) console.log(`    ${line}`);
  }
  console.log(`\n  new breakage: ${String(broken.length)}`);
  for (const shot of broken) {
    console.log(`    ${shot.branch}/${shot.cell}`);
    for (const line of shot.broke) console.log(`        ${line}`);
  }
  console.log(`\n  build/states/index.html`);

  // The gallery is a tool first: it must produce its pictures even when the
  // screen is wrong. The failure is reported after everything is written.
  expect(broken, broken.map((s) => `${s.cell}: ${s.broke.join('; ')}`).join('\n')).toEqual([]);
});
