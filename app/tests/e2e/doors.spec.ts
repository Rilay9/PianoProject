/**
 * The doors (docs/04 §2, §2b, §4).
 *
 * The owner, after a week of modes were built: *"We'd want to have some way of
 * accessing these new modes. If I'm opening a song from the library, or I just
 * want to do Simon, or the Chord Lab — how are people going to open it up?
 * There's got to be a link somewhere."* Three answers, and this file is each of
 * them proved the way it would actually fail — **you cannot get there**:
 *
 *  - every door in Today's tools row lands on its own screen;
 *  - a mode chosen from a Library row is the mode the Score screen opens in,
 *    read off the screen's own state rather than off the hash that asked for
 *    it, because the hash proves the link and not the arrival;
 *  - free play names what is held, and says so when nothing can reach it.
 *
 * The pictures under `build/doors/` are for looking at, at the five shapes and
 * both themes (`00` §3: every visual fault in this repository was found by
 * opening a PNG). They are not compared byte for byte — a font on a runner
 * would make that a daily false alarm.
 *
 *   npx playwright test doors.spec.ts --workers=4
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { installMidiMock, DEFAULT_MOCK_INPUT } from './fixtures/midiMock';
import { withScoreMenu } from './scoreControls';

const OUT = resolve('../build/doors');
const MXL = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'imports', 'test-tune.mxl');

/** The seven choices, in the order the sheet lists them (`04` §4). */
const OPEN_AS_IDS = ['wait', 'tempo', 'listen', 'free', 'rhythm', 'duet', 'blind'] as const;

/** Two staves, so the **Duet** door has a second hand to hand over. */
const SONG = 'song.folk.twinkle.ht';
const SONG_SEARCH = 'Twinkle';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      // A cleared origin is a first launch, and a first launch is the setup
      // tour (docs/04 §7d); none of these screens is about that.
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      // Every explain-it-once card counts as seen, for the same reason the
      // tour counts as skipped: this spec is not about meeting them
      // (`04` §5f, `help-strip.spec.ts` is the one that drives them).
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

async function openToday(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#today-doors')).toBeVisible({ timeout: 60_000 });
}

/**
 * A learner placed on `rung` through the backup import (as `today.spec.ts` restores its learners), Today
 * reloaded on it (SR2: the daily read begins at 1.1).
 */
async function placedAt(page: Page, rung: string): Promise<void> {
  await openToday(page);
  await page.evaluate(async (unitId) => {
    const hooks = (window as unknown as { __pianopath?: { importAll: (raw: unknown) => Promise<unknown> } }).__pianopath;
    if (!hooks) throw new Error('storage hooks not exposed');
    const at = new Date().toISOString();
    await hooks.importAll({
      app: 'pianopath',
      version: 1,
      exportedAt: at,
      stores: { plan: [{ id: 'current', stage: Number(unitId.split('.')[0]), unitId, trackOrder: ['core'], placement: { unitId, at } }] },
    });
  }, rung);
  await page.reload();
  await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', rung, { timeout: 30_000 });
  await expect(page.locator('#today-play')).toBeVisible({ timeout: 30_000 });
}

/**
 * The Library has drawn its list, or has said why it could not.
 *
 * Revised (H0, Q44 with Q34; test class: revise). This waited 60 s for the
 * first row to be visible, and in the chain over 943b2fd it saw no row at all
 * for the whole minute and could not say why. The screen publishes two states
 * a test can read: the count line, "Loading your library…" until `draw` puts
 * the real count there (the rows are appended in the same call), and the
 * status line, which says "The library could not be loaded: …" when the read
 * fails (`LibraryScreen`'s `refresh` and `sayLoadFailed`). No `data-settled`
 * exists on the list and none is needed: the count line is the list's own
 * word that it is drawn. So the wait is for either, and a failed load fails
 * here in the screen's words instead of as a missing row a minute later. The
 * budget is unchanged. A page slowed 32 times drew the list well inside it
 * (Entry 87), so slowness alone does not account for the minute; this wait is
 * what tells the next occurrence apart.
 */
async function libraryDrawn(page: Page): Promise<void> {
  const count = page.locator('#library-count');
  const status = page.locator('#library-status');
  const drawnOrFailed = async (): Promise<string> => {
    const said = (await status.textContent()) ?? '';
    if (said.startsWith('The library could not be loaded')) return said;
    return (await count.textContent()) ?? '';
  };
  await expect
    .poll(drawnOrFailed, { timeout: 60_000, message: 'the Library drew its list or said why not' })
    .toMatch(/^\d+ of \d+ items|^The library could not be loaded/);
  expect(await drawnOrFailed(), 'the Library could not load its list').toMatch(/^\d+ of \d+ items/);
}

/** Finds one catalog row in a list of 1,533 without depending on where it sorts. */
async function findRow(page: Page, id: string, search: string): Promise<void> {
  await page.goto('/#/library');
  await libraryDrawn(page);
  await page.locator('#library-search').fill(search);
  await expect(page.locator(`#library-list .list-row[data-item="${id}"]`)).toBeVisible({
    timeout: 30_000,
  });
}

/**
 * Opens the sheet on that row and takes one of its seven choices.
 *
 * The mode, the hand and the settings are all applied while the score is being
 * fetched, so the wait is for the load to have finished rather than for the
 * screen to exist: the control bar's mode select is the first thing on it that
 * the load writes to. It is on the bar in every mode, which the engraved sheet
 * is not — a blind run is a black rectangle on purpose (`04` §5).
 */
async function openAs(page: Page, choice: string): Promise<void> {
  await findRow(page, SONG, SONG_SEARCH);
  await page.locator(`#library-list .list-row[data-item="${SONG}"] .library-openas`).click();
  await expect(page.locator('#library-openas')).toBeVisible();
  await page.locator(`#library-openas [data-openas="${choice}"]`).click();
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#score-mode')).toBeVisible({ timeout: 60_000 });
}

test.describe("Today's tools", () => {
  test('Free play opens the free-play screen', async ({ page }) => {
    await openToday(page);
    await page.locator('#today-play').click();
    await expect(page).toHaveURL(/#\/play$/);
    await expect(page.locator('[data-screen="play"]')).toBeVisible();
    await expect(page.locator('#play-strip .keyboard-strip')).toBeVisible();
  });

  // Revised (SR2; the reviewer's ruling on SR1, `docs/review/responses/sr1-sightreading-quality.md` §2): the test
  // encoded the fault: a learner at 0.1 was offered a phrase. Before: a fresh learner, at 0.1, had the card and the
  // door, a phrase held at 1.5. After: the learner is placed at 1.1, the first rung with a daily read; the door and
  // the card still open one phrase.
  test('Sight-read opens the same phrase the daily card offers', async ({ page }) => {
    await placedAt(page, '1.1');
    // The card's own seed, which is what makes the day repeatable: a second
    // door that opened a fresh phrase would be a second daily read (`04` §2).
    const card = page.locator('#today-daily .list-row');
    await expect(card).toBeVisible();
    const seed = await card.getAttribute('data-seed');
    const item = await card.getAttribute('data-daily');
    expect(seed).not.toBeNull();
    await page.locator('#today-read').click();
    // Revised (C3 item 0b, L50): the route also names the slot, and the rung
    // where the row is on one, so the seed is one parameter among them.
    await expect(page).toHaveURL(new RegExp(`#/score/${String(item)}\\?(.+&)?seed=${String(seed)}(&|$)`));
    expect(new URL(page.url()).hash).toContain('slot=daily-read');
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  });

  // Added (SR2): before 1.1 teaches steps there is no daily read, so a fresh learner sees no card and no door
  // (`04` §0 R4, no furniture); placed at 1.1, the daily read opens held to 1.1's taught set (`hold=1.1`) and is
  // still judged by the row's rung (`rung=1.5`).
  test('a fresh learner at 0.1 has no daily read and no Sight-read door; at 1.1 the read opens held there and judged at 1.5', async ({ page }) => {
    await openToday(page);
    await expect(page.locator('#today-status')).toHaveAttribute('data-lesson', '0.1', { timeout: 30_000 });
    await expect(page.locator('#today-play')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#today-daily .list-row')).toHaveCount(0);
    await expect(page.locator('#today-read')).toHaveCount(0);

    await placedAt(page, '1.1');
    const card = page.locator('#today-daily .list-row');
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card).toHaveAttribute('data-daily', 'drill.reading.sight-reading-1');
    // Added (SR3; the reviewer's ruling on SR2, `docs/review/responses/sr2-landing.md` §2): the hold is part of the
    // material offered, so the card says the held level, never the row's L1.5 over a steps-only phrase.
    await expect(card.locator('.list-row__metatext')).toContainText('L1.1');
    await expect(card.locator('.list-row__metatext')).not.toContainText('L1.5');
    await expect(page.locator('#today-read')).toBeVisible();
    await page.locator('#today-read').click();
    await expect(page).toHaveURL(/#\/score\/drill\.reading\.sight-reading-1\?/, { timeout: 30_000 });
    const hash = new URL(page.url()).hash;
    expect(hash).toContain('rung=1.5');
    expect(hash).toContain('hold=1.1');
    expect(hash).toContain('slot=daily-read');
    await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  });

  test('Simon opens a Simon drill', async ({ page }) => {
    await openToday(page);
    await page.locator('#today-simon').click();
    // Which of the two is `simonForStage`'s decision and is checked against the
    // curriculum in `simonDrill.test.ts`; what this proves is the door.
    await expect(page).toHaveURL(/#\/drill\/drill\.ear\.simon-/);
    await expect(page.locator('[data-screen="drill"]')).toBeVisible({ timeout: 60_000 });
  });

  test('Accompaniment lab opens the lab', async ({ page }) => {
    await openToday(page);
    await page.locator('#today-lab').click();
    await expect(page).toHaveURL(/#\/lab$/);
    await expect(page.locator('[data-screen="lab"]')).toBeVisible();
  });

  // Revised (SR2, Entry 258): the test opened Today as a fresh learner at 0.1 and expected the Sight-read door;
  // since the daily read is held to the learner's taught set there is no read, and no door, before 1.1 (the test
  // encoded the fault). Placed at 1.1 the four doors exist, and R3's claim about them is asked as before.
  test('the tools are text, so Start session is still the only filled box (R3)', async ({
    page,
  }) => {
    await placedAt(page, '1.1');
    const filled = page.locator('[data-screen="today"] .button--primary');
    await expect(filled).toHaveCount(1);
    await expect(filled).toHaveAttribute('id', 'today-start');
    for (const id of ['#today-play', '#today-read', '#today-simon', '#today-lab']) {
      await expect(page.locator(id)).toHaveClass(/link-button/);
    }
  });
});

test.describe('Open as… from a Library row', () => {
  // Every one of these opens the Library and then engraves a score, four times
  // over in the first of them.
  test.describe.configure({ timeout: 240_000 });

  test('the four modes are the mode the score opens in', async ({ page }) => {
    for (const mode of ['wait', 'tempo', 'listen', 'free']) {
      await openAs(page, mode);
      await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', mode, {
        timeout: 60_000,
      });
      await expect(page.locator('#score-mode')).toHaveValue(mode);
    }
  });

  test('Rhythm only opens a rhythm run, in the one mode that has a clock', async ({ page }) => {
    await openAs(page, 'rhythm');
    const score = page.locator('[data-screen="score"]');
    await expect(score).toHaveAttribute('data-mode', 'tempo', { timeout: 60_000 });
    // `data-rhythm` is the screen's own answer to "is this a rhythm run": it is
    // true only where the setting is on *and* the mode allows it.
    await expect(score).toHaveAttribute('data-rhythm', 'true');
  });

  test('and any other choice afterwards is not a rhythm run', async ({ page }) => {
    // `rhythmOnly` is remembered, so without this the sheet would hand back a
    // rhythm run every time it was used again — the learner asking for Keep
    // tempo and being judged on timing alone, with nothing saying so.
    await openAs(page, 'rhythm');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-rhythm', 'true', {
      timeout: 60_000,
    });
    await openAs(page, 'tempo');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-rhythm', 'false', {
      timeout: 60_000,
    });
  });

  test('Duet opens with a hand chosen and the app on the other one', async ({ page }) => {
    await openAs(page, 'duet');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', 'tempo', {
      timeout: 60_000,
    });
    // The hand is what makes a duet possible at all: with `Both` chosen there
    // is no hand left for the app to play.
    await expect(page.locator('#score-hands-R')).toHaveClass(/is-selected/);
    await withScoreMenu(page, async () => {
      await expect(page.locator('#score-duet-row')).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('#score-duet')).toHaveAttribute('aria-pressed', 'true');
      // And it names the hand it is playing, which is the one not chosen.
      await expect(page.locator('#score-duet-row')).toContainText('left hand');
    });
  });

  test('Blind hides the score and leaves the rest of the run alone', async ({ page }) => {
    await openAs(page, 'blind');
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-blind', 'true');
    // Still a real run behind the black rectangle: the modes are untouched.
    await expect(page.locator('#score-mode')).toBeEnabled();
  });

  test('the control is only on rows that open on the Score screen (R4)', async ({ page }) => {
    await findRow(page, SONG, SONG_SEARCH);
    await expect(
      page.locator(`#library-list .list-row[data-item="${SONG}"] .library-openas`),
    ).toBeVisible();
    // A drill is a prompt loop, not notation: there is no mode to open it in,
    // so there is nothing for the control to offer. Simon rather than "every
    // drill row", because the sight-reading drills *are* notation and open on
    // the Score screen — which is `targetFor`'s decision, not this row's.
    await page.locator('#library-search').fill('Simon');
    const simon = page.locator('#library-list .list-row[data-item^="drill.ear.simon-"]');
    await expect(simon.first()).toBeVisible({ timeout: 30_000 });
    await expect(simon.first().locator('.library-openas')).toHaveCount(0);
  });
});

/**
 * The tall-row exception, held upright (`04` §0 R2 and the note beside the
 * rule in `style.css`).
 *
 * It is the one thing `Open as…` could have broken silently. The exception was
 * selected by "a row with more than one action", which was the imports and
 * nothing else — until every playable row gained a second control, at which
 * point all 1,533 would have grown 35 px for a glyph 24 px wide. Both halves
 * are asserted here, as a relationship rather than a height: does the row's
 * strip of actions sit beside its words, or under them?
 */
test.describe('the Library rows upright', () => {
  test.use({ viewport: { width: 342, height: 740 } });

  async function actionsAreBesideTheWords(page: Page, row: string): Promise<boolean> {
    const text = await page.locator(`${row} .list-row__text`).boundingBox();
    const actions = await page.locator(`${row} .list-row__actions`).boundingBox();
    expect(text, row).not.toBeNull();
    expect(actions, row).not.toBeNull();
    return (actions?.y ?? 0) < (text?.y ?? 0) + (text?.height ?? 0);
  }

  test('a catalog row keeps its words and its links on one line', async ({ page }) => {
    await findRow(page, SONG, SONG_SEARCH);
    expect(
      await actionsAreBesideTheWords(page, `#library-list .list-row[data-item="${SONG}"]`),
    ).toBe(true);
  });

  test('an imported row still drops its buttons to a line of their own', async ({ page }) => {
    await page.goto('/#/library');
    await expect(page.locator('#library-list .list-row').first()).toBeVisible({ timeout: 60_000 });
    await page.locator('#library-file').setInputFiles(MXL);
    const row = '#library-list .list-row[data-item="import.imported-test-tune"]';
    await expect(page.locator(row)).toBeVisible({ timeout: 60_000 });
    // The archive-title exception: the words take the width and Edit · Assign ·
    // Details · ⋯ go underneath, which is the trade the owner asked for.
    expect(await actionsAreBesideTheWords(page, row)).toBe(false);
  });
});

/**
 * A phone held sideways is 740 × 342, and the sheet has seven choices in it.
 *
 * The panel scrolls, so nothing was unreachable — but the seventh sat half off
 * the bottom of the screen, and a sheet you have to discover a scroll in is a
 * sheet that looks as though it has six choices. The assertion is against the
 * viewport, which is the only honest form of "on the screen".
 */
test.describe('the Open as… sheet sideways', () => {
  test.use({ viewport: { width: 740, height: 342 } });

  test('every one of the seven is on the screen without scrolling', async ({ page }) => {
    await findRow(page, SONG, SONG_SEARCH);
    await page.locator(`#library-list .list-row[data-item="${SONG}"] .library-openas`).click();
    await expect(page.locator('#library-openas')).toBeVisible();
    const height = page.viewportSize()?.height ?? 0;
    for (const choice of OPEN_AS_IDS) {
      const box = await page.locator(`#library-openas [data-openas="${choice}"]`).boundingBox();
      expect(box, choice).not.toBeNull();
      expect((box?.y ?? 0) + (box?.height ?? 0), `${choice} runs off the bottom`).toBeLessThanOrEqual(
        height,
      );
    }
  });
});

test.describe('Free play', () => {
  test('names a held C–E–G as C major, and lets go of it', async ({ page }) => {
    const midi = await installMidiMock(page, { permission: 'granted' });
    await page.goto('/#/play');
    await expect(page.locator('[data-screen="play"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-screen="play"]')).toHaveAttribute('data-device', 'midi');

    for (const note of [60, 64, 67]) await midi.noteOn(note);
    await expect(page.locator('#play-chord')).toHaveText('C major');
    await expect(page.locator('#play-notes')).toContainText('C4');
    // The keys say it too, or the strip is a picture.
    await expect(page.locator('#play-strip .key[data-midi="64"]')).toHaveClass(/is-pressed/);

    // Two notes are not a chord, and the screen says nothing rather than
    // guessing — the name goes, the notes stay.
    await midi.noteOff(64);
    await expect(page.locator('#play-chord')).toHaveText('');
    await expect(page.locator('[data-screen="play"]')).toHaveAttribute('data-held', '2');
  });

  test('an inversion is named after its root', async ({ page }) => {
    const midi = await installMidiMock(page, { permission: 'granted' });
    await page.goto('/#/play');
    await expect(page.locator('[data-screen="play"]')).toHaveAttribute('data-device', 'midi', {
      timeout: 60_000,
    });
    for (const note of [64, 67, 72]) await midi.noteOn(note);
    await expect(page.locator('#play-chord')).toHaveText('C major / E');
  });

  test('with nothing connected it says so and offers the way to connect (R4)', async ({ page }) => {
    // No mock at all: no Web MIDI permission, no microphone. This is a phone
    // with the cable still in the drawer.
    await page.goto('/#/play');
    await expect(page.locator('[data-screen="play"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-screen="play"]')).toHaveAttribute('data-device', 'keys');
    await expect(page.locator('#play-device')).toContainText('No piano');
    await expect(page.locator('#play-open-midi')).toBeVisible();
    await page.locator('#play-open-midi').click();
    await expect(page.locator('[data-screen="midi"]')).toBeVisible({ timeout: 30_000 });
  });

  test('the keys on the screen are an input, not a diagram', async ({ page }) => {
    await page.goto('/#/play');
    await expect(page.locator('[data-screen="play"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-screen="play"]')).toHaveAttribute('data-device', 'keys');
    // Held, not clicked: a click is a press *and* a release, and what this
    // screen draws is what is down right now.
    await page.locator('#play-strip .key[data-midi="60"]').hover();
    await page.mouse.down();
    await expect(page.locator('#play-notes')).toContainText('C4');
    await page.mouse.up();
    await expect(page.locator('[data-screen="play"]')).toHaveAttribute('data-held', '0');
  });

  test('Back returns to Today', async ({ page }) => {
    await page.goto('/#/play');
    await expect(page.locator('#play-back')).toBeVisible({ timeout: 60_000 });
    await page.locator('#play-back').click();
    await expect(page.locator('[data-screen="today"]')).toBeVisible();
  });
});

/* -------------------------------------------------------------------------
   The pictures.

   Five shapes and both themes, because the owner's rule for all of this is
   "whatever looks best and natural on all screens and orientations" — and one
   at 115 % text on the phone, which is the size setting a person with the
   phone at arm's length actually uses. Nothing here asserts a measurement;
   what it asserts is that every scene *drew*, so a picture is never silently
   blank.
   ------------------------------------------------------------------------- */

interface Shape {
  name: string;
  width: number;
  height: number;
}

const SHAPES: Shape[] = [
  { name: 'phone-portrait', width: 342, height: 740 },
  { name: 'phone-landscape', width: 740, height: 342 },
  { name: 'tablet-portrait', width: 900, height: 1200 },
  { name: 'tablet-landscape', width: 1200, height: 900 },
  { name: 'laptop-1366', width: 1366, height: 768 },
];

interface Scene {
  slug: string;
  open: (page: Page) => Promise<void>;
  /** Must be visible before the shutter opens — a blank picture is worse than none. */
  prove: string;
}

/** The scenes a MIDI mock can reach; the last one unplugs it again. */
function scenes(midi: { unplugInput: (id: string) => Promise<void>; noteOn: (m: number) => Promise<void> }): Scene[] {
  return [
    {
      slug: 'today-doors',
      open: async (page) => {
        await openToday(page);
        // The row is below the card, which upright is below the fold: the
        // picture has to show the thing it was taken for.
        await page.locator('#today-doors').scrollIntoViewIfNeeded();
      },
      prove: '#today-lab',
    },
    {
      slug: 'library-rows',
      open: (page) => findRow(page, SONG, SONG_SEARCH),
      prove: `.list-row[data-item="${SONG}"] .library-openas`,
    },
    {
      slug: 'library-openas',
      open: async (page) => {
        await findRow(page, SONG, SONG_SEARCH);
        await page.locator(`.list-row[data-item="${SONG}"] .library-openas`).click();
      },
      prove: '#library-openas [data-openas="blind"]',
    },
    {
      slug: 'play-chord',
      open: async (page) => {
        await page.goto('/#/play');
        await expect(page.locator('[data-screen="play"]')).toHaveAttribute('data-device', 'midi', {
          timeout: 60_000,
        });
        for (const note of [60, 64, 67]) await midi.noteOn(note);
      },
      prove: '#play-chord',
    },
    {
      slug: 'play-no-device',
      open: async (page) => {
        await page.goto('/#/play');
        await expect(page.locator('[data-screen="play"]')).toBeVisible({ timeout: 60_000 });
        await midi.unplugInput(DEFAULT_MOCK_INPUT.id);
        await expect(page.locator('[data-screen="play"]')).toHaveAttribute('data-device', 'keys');
      },
      prove: '#play-open-midi',
    },
  ];
}

test.describe('pictures', () => {
  test.describe.configure({ timeout: 300_000 });

  for (const scheme of ['light', 'dark'] as const) {
    test(`every door, ${scheme}`, async ({ page }) => {
      const midi = await installMidiMock(page, { permission: 'granted' });
      await page.emulateMedia({ colorScheme: scheme });
      for (const shape of SHAPES) {
        await page.setViewportSize({ width: shape.width, height: shape.height });
        for (const scene of scenes(midi)) {
          await scene.open(page);
          await expect(page.locator(scene.prove).first()).toBeVisible({ timeout: 60_000 });
          const file = join(OUT, `${shape.name}-${scheme}`, `${scene.slug}.png`);
          mkdirSync(dirname(file), { recursive: true });
          await page.screenshot({ path: file, animations: 'disabled' });
        }
      }
    });
  }

  /**
   * And the phone at 115 % text (`00` §1: every change is checked at 100 % and
   * 115 %). Chrome's own page zoom is not what an Android Display size does —
   * that scales the root font — so the root font is what is scaled here.
   */
  test('the phone at 115 % text', async ({ page }) => {
    const midi = await installMidiMock(page, { permission: 'granted' });
    await page.setViewportSize({ width: 342, height: 740 });
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.fontSize = '115%';
      });
    });
    for (const scene of scenes(midi)) {
      await scene.open(page);
      await expect(page.locator(scene.prove).first()).toBeVisible({ timeout: 60_000 });
      const file = join(OUT, 'phone-portrait-115', `${scene.slug}.png`);
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file, animations: 'disabled' });
    }
  });
});
