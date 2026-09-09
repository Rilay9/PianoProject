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

/** Eight bars, both hands, always present, and short enough to finish. */
const SONG = 'song.folk.hot-cross-buns';

const PHONE_UP = { width: 360, height: 780 };
const PHONE_UP_BIG = { width: 412, height: 915 };
const PHONE_SIDE = { width: 780, height: 360 };
const PHONE_SIDE_BIG = { width: 915, height: 412 };
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

async function openScore(page: Page, query = ''): Promise<void> {
  await page.goto(`/#/score/${SONG}${query}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
  // Let the fit settle: the strip and the bar each take their share a frame
  // after the score arrives, and a shot taken before that is of a screen the
  // owner never sees.
  await page.waitForTimeout(1_500);
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
    const note = run?.expected?.[0] ?? run?.pitches?.[0];
    if (note === undefined) break;
    await midi.noteOn(note, 78);
    await page.waitForTimeout(90);
    await midi.noteOff(note);
    await page.waitForTimeout(70);
  }
}

test.describe.configure({ timeout: 900_000 });

test('every state, photographed and measured', async ({ page }) => {
  reset();
  const midi: MidiMock = await installMidiMock(page, { permission: 'granted' });

  // ---------------------------------------------------------------- branch 1
  // Can I read it at all? Every form factor, then the failures.
  for (const [name, size] of [
    ['phone-upright-360', PHONE_UP],
    ['phone-upright-412', PHONE_UP_BIG],
    ['phone-sideways-780', PHONE_SIDE],
    ['phone-sideways-915', PHONE_SIDE_BIG],
    ['tablet-upright-900', TABLET_UP],
    ['tablet-sideways-1200', TABLET_SIDE],
  ] as const) {
    await page.setViewportSize(size);
    await openScore(page);
    await shoot(page, '1-can-i-read-it', `size--${name}`, 'Idle, Wait, dark. Is it big and still?');
  }

  // The theme, on the binding size.
  await page.setViewportSize(PHONE_UP);
  await page.emulateMedia({ colorScheme: 'light' });
  await openScore(page);
  await shoot(page, '1-can-i-read-it', 'theme--light', 'Light theme: notation must not be inverted.');
  await page.emulateMedia({ colorScheme: 'dark' });

  // The lifecycle's terminal states — §3.1, and P4: each must say why and leave.
  await page.goto('/#/score/song.not.a.real.item');
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shoot(page, '1-can-i-read-it', 'lifecycle--unknown-item', 'Unknown id: says so, and Back is there.');

  // ---------------------------------------------------------------- branch 2
  // Where am I? Arrangement, the cursor, the keys.
  for (const [name, size] of [
    ['slots--upright', PHONE_UP],
    ['chunk--sideways', PHONE_SIDE],
    ['slots--tablet-sideways', TABLET_SIDE],
  ] as const) {
    await page.setViewportSize(size);
    await openScore(page);
    await setMode(page, 'wait');
    await page.locator('#score-play').click();
    await playInto(page, midi, 5);
    await shoot(page, '2-where-am-i', `arrangement--${name}`, 'Five notes in: where is the cursor, what is in the other slot?');
  }

  // The keys view, all three.
  for (const view of ['strip', 'ribbon', 'off'] as const) {
    await page.setViewportSize(PHONE_UP);
    await settings(page, { keys: view });
    await openScore(page);
    await shoot(page, '2-where-am-i', `keys--${view}`, `keys: ${view}`);
  }
  await settings(page, { keys: 'strip' });

  // Hands: the other hand is dimmed, never hidden.
  for (const hand of ['R', 'L', 'both'] as const) {
    await page.setViewportSize(PHONE_UP);
    await openScore(page);
    await page.locator(`#score-hands-${hand}`).click();
    await page.waitForTimeout(300);
    await shoot(page, '2-where-am-i', `hands--${hand}`, `Hands ${hand}: the other hand dimmed, not gone.`);
  }

  // ---------------------------------------------------------------- branch 3
  // What comes next? The read-ahead, the count-in, the beat dot — by mode.
  for (const mode of ['wait', 'tempo', 'listen', 'free'] as const) {
    for (const [orient, size] of [
      ['upright', PHONE_UP],
      ['sideways', PHONE_SIDE],
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
      );
    }
  }

  // The count-in, caught while it is up.
  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await setMode(page, 'tempo');
  await page.locator('#score-play').click();
  await page.waitForTimeout(400);
  await shoot(page, '3-what-comes-next', 'count-in--tempo', 'The count-in, over the notation, one beat lit.');

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
  await shoot(page, '4-how-am-i-doing', 'colour--right-and-wrong', 'Green for matched, red for wrong, accent for current.');

  await settings(page, { showNoteNames: true });
  await openScore(page);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await page.waitForTimeout(600);
  await shoot(page, '4-how-am-i-doing', 'waiting-line--wait', 'Wait, note names on: the waiting line names the note.');
  await settings(page, { showNoteNames: false });

  // ---------------------------------------------------------------- branch 5
  // What can I change? The bar at every width, the sheets.
  for (const [name, size] of [
    ['360', PHONE_UP],
    ['412', PHONE_UP_BIG],
    ['780', PHONE_SIDE],
    ['1200', TABLET_SIDE],
  ] as const) {
    await page.setViewportSize(size);
    await openScore(page);
    await shoot(page, '5-what-can-i-change', `bar--${name}`, 'One row, always. §9.23.');
  }

  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await page.locator('#score-more').click();
  await page.waitForTimeout(500);
  await shoot(page, '5-what-can-i-change', 'sheet--more-upright', 'The ⋯ sheet upright.');

  await page.setViewportSize(PHONE_SIDE);
  await openScore(page);
  await page.locator('#score-more').click();
  await page.waitForTimeout(500);
  await shoot(page, '5-what-can-i-change', 'sheet--more-sideways', 'Sideways it must fit without scrolling.');

  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await page.locator('#score-hear').click();
  await page.waitForTimeout(2_000);
  await shoot(page, '5-what-can-i-change', 'hear-it--running', 'Hear it: a Listen run, mode select unmoved.');

  // ---------------------------------------------------------------- branch 6
  // What if it goes wrong? Blind, performance, rotation, the end.
  await page.setViewportSize(PHONE_UP);
  await openScore(page, '?blind=1');
  await shoot(page, '6-what-if-it-goes-wrong', 'blind--upright', 'Blind: laid out, hidden, and said so.');

  await openScore(page, '?performance=1');
  await shoot(page, '6-what-if-it-goes-wrong', 'performance--upright', 'A performance: no restart offered.');

  // Rotation mid-run: the run continues, the arrangement is rebuilt.
  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await playInto(page, midi, 3);
  await page.setViewportSize(PHONE_SIDE);
  await page.waitForTimeout(1_500);
  await shoot(page, '6-what-if-it-goes-wrong', 'rotation--mid-run', 'Rotated mid-run: still running, rebuilt sideways.');

  // The end of a piece: the other slot shows the bars behind, never blank.
  await page.setViewportSize(PHONE_UP);
  await openScore(page);
  await setMode(page, 'wait');
  await page.locator('#score-play').click();
  await playInto(page, midi, 40);
  await page.waitForTimeout(800);
  await shoot(page, '6-what-if-it-goes-wrong', 'end-of-piece', 'The last bars: both slots full, or the summary.');

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
