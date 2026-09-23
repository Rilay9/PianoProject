/**
 * One first day, as one chain, across a reload (T26 item 1).
 *
 * Every other spec here starts somewhere in the middle: the tour already
 * skipped, the placement already taken, a score opened by its id. Each of
 * those is a fair test of the screen it is about and none of them is the
 * thing the owner is about to do, which is to open this app for the first
 * time and not stop until something is recorded. The faults that shape has
 * are the ones no single screen's spec can see — a step that works when you
 * arrive by hash and not when you arrive by pressing the control before it,
 * a screen that agrees with the database and not with the screen beside it,
 * a pass that survives the run and not the reload.
 *
 * So: nothing in storage → the tour finished → the placement test taken and
 * passed all the way through → *Start here* → the rung Plan then names → its
 * lesson → a piece from that rung opened → a Wait run fed through the MIDI
 * mock → the pass on the sheet → reload → Today, Plan and Skills asked
 * separately whether they agree about where the learner is, what was passed
 * and what is next.
 *
 * **Every destination is asserted from what the control itself declared**,
 * the way `lesson-tools.spec.ts` does: the placement's `data-unit`, Plan's
 * `data-lesson-next`, the option row's `data-item`. A test carrying its own
 * copy of the answer reports a correct content change as a broken app.
 *
 * **Nothing here is heard.** The run is note-on bytes through a fake cable
 * and the assertions are about what the screens say afterwards; whether the
 * piece sounds like the piece is not touched.
 */
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { setTempoPercent, withScoreMenu } from './scoreControls';

/** A first launch is a launch with nothing saved, so no shared state. */
test.use({ storageState: { cookies: [], origins: [] } });

/** The tour's steps, in the order `setup.spec.ts` walks them. */
const STEPS = ['welcome', 'hold', 'piano', 'sound', 'display', 'modes', 'practice', 'done'];

/**
 * Part G: a pass wants 90 % at 80 % tempo or better, and a newly opened piece
 * starts at 70. A chain about passing has to say so, exactly as
 * `score.run.spec.ts` does.
 */
const FULL_TEMPO = 100;

interface CatalogRow {
  id: string;
  type: string;
  title: string;
  file: string | null;
  drill?: { kind?: string; params?: Record<string, unknown> };
  notation?: { bars?: number | null };
}

interface CurriculumUnit {
  id: string;
  title: string;
  track: string;
  lessons: { id: string }[];
}

interface CurriculumFile {
  stages: { number: number; units: CurriculumUnit[] }[];
}

/**
 * The built content, read from the same files the served app fetches.
 *
 * `offline.spec.ts` reads `public/content/catalog.json` the same way. The
 * point is that nothing below is a literal typed into this file: the unit the
 * placement sends a passing learner to, which rungs sit after it, and which
 * piece is the shortest thing the recommended rung offers are all read out of
 * the build.
 */
function catalog(): CatalogRow[] {
  return JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as CatalogRow[];
}

function curriculum(): CurriculumFile {
  return JSON.parse(readFileSync(resolve('public/content/curriculum.json'), 'utf8')) as CurriculumFile;
}

/** Every unit in curriculum order, which is the order a plan advances through. */
function unitsInOrder(): CurriculumUnit[] {
  return curriculum().stages.flatMap((stage) => stage.units);
}

/** The stage a rung belongs to, read from the build rather than from its id. */
function stageOfLesson(lessonId: string): number | null {
  for (const stage of curriculum().stages) {
    for (const unit of stage.units) {
      if (unit.lessons.some((lesson) => lesson.id === lessonId)) return stage.number;
    }
  }
  return null;
}

/** The unit a rung belongs to. */
function unitOfLesson(lessonId: string): CurriculumUnit | null {
  for (const unit of unitsInOrder()) {
    if (unit.lessons.some((lesson) => lesson.id === lessonId)) return unit;
  }
  return null;
}

/** What the placement test's own data says a learner who passes everything gets. */
function placementPassUnit(): { drillId: string; unitId: string } {
  const row = catalog().find((item) => item.drill?.kind === 'placement');
  expect(row, 'the catalog holds no placement drill, so this chain has nothing to walk').toBeTruthy();
  const unitId = row?.drill?.params?.passUnit;
  expect(typeof unitId, 'the placement drill names no passUnit').toBe('string');
  return { drillId: row?.id ?? '', unitId: String(unitId) };
}

interface ScoreRun {
  step: number;
  expected: number[];
  armed: boolean;
  lastBar: number;
  engineMode: string;
  input: string;
}

type Hooked = Window & { __pianopath?: { scoreRun?: () => ScoreRun | null } };

async function runState(page: Page): Promise<ScoreRun | null> {
  return page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);
}

/**
 * Empty storage, once per page, before any app code runs.
 *
 * The same shape `setup.spec.ts` uses — the session flag is what stops a
 * reload later in the chain from wiping the very rows this test is about to
 * go and check.
 */
async function emptyStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('first-day-fresh') === null) {
      sessionStorage.setItem('first-day-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
}

/** Step 1: the tour, from the first launch to *Finish*. */
async function finishTheTour(page: Page): Promise<void> {
  const tour = page.locator('[data-screen="setup"]');
  await expect(tour, 'a first launch did not land on the setup tour').toBeVisible({ timeout: 60_000 });
  expect(new URL(page.url()).hash).toBe('#/settings/setup');

  for (const [i, step] of STEPS.entries()) {
    await expect(tour).toHaveAttribute('data-setup-step', step);
    await expect(page.locator('#setup-progress')).toHaveText(
      `Step ${String(i + 1)} of ${String(STEPS.length)}`,
    );
    if (step === 'piano') {
      // The cable, connected here and used four screens later: this is the
      // only place on a first day where a learner is asked about it.
      await page.locator('#setup-midi-connect').click();
      await expect(tour, 'the tour never reported the piano connected').toHaveAttribute(
        'data-midi-connected',
        'true',
        { timeout: 30_000 },
      );
    }
    if (step === 'done') await expect(page.locator('#setup-next')).toHaveText('Finish');
    await page.locator('#setup-next').click();
  }

  await expect(page.locator('.screen h1'), 'finishing the tour did not land on Today').toHaveText('Today');
  // Finished, and recorded as finished — the difference between this and
  // `skipped` is what every other spec starts from.
  await page.goto('/#/settings');
  await expect(page.locator('#settings-setup')).toContainText('Finished');
}

/** Step 2: the placement, found the way a learner finds it, and passed throughout. */
async function takeThePlacement(page: Page): Promise<string> {
  const { drillId, unitId: declaredPassUnit } = placementPassUnit();

  await page.goto('/#/plan');
  await expect(page.locator('section[data-screen="plan"]')).toBeVisible({ timeout: 60_000 });
  await page.locator('#plan-placement').click();
  // Arrived at the rung the link names, not merely at *a* lesson.
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const row = page.locator(`#lesson-exercises .list-row[data-item="${drillId}"]`);
  await expect(row, `the placement rung does not offer ${drillId}`).toBeVisible();
  await row.click();
  await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-kind', 'placement', {
    timeout: 60_000,
  });

  // Passed every item, which is what the pass branch of the test is for. The
  // loop is bounded by the drill's own counter, so it cannot spin.
  const counter = await page.locator('#drill-counter').textContent();
  const total = Number(/of (\d+)/.exec(counter ?? '')?.[1] ?? 0);
  expect(total, 'the placement drill printed no item count').toBeGreaterThan(0);
  for (let item = 0; item < total; item += 1) {
    const pass = page.locator('#drill-placement-pass');
    if ((await pass.count()) === 0) break;
    await pass.click();
  }

  const start = page.locator('#drill-placement-start');
  await expect(start, 'passing every item produced no starting point').toBeVisible({ timeout: 30_000 });
  const result = page.locator('#drill-summary [data-unit]');
  const unit = (await result.getAttribute('data-unit')) ?? '';
  // The destination the control declares, checked against the drill's own
  // data rather than against a unit id typed in here.
  expect(unit, 'the placement sent a passing learner somewhere its own data does not name').toBe(
    declaredPassUnit,
  );
  // …and it is a unit the curriculum has.
  expect(
    unitsInOrder().map((entry) => entry.id),
    'the placement named a unit the built curriculum does not have',
  ).toContain(unit);
  // Said in words, with the id in `data-` where `00` §1 puts it.
  await expect(result).toContainText('Start here:');
  await expect(result).not.toContainText(unit);

  await start.click();
  await expect(page.locator('#drill-status')).toContainText('Placement recorded', { timeout: 30_000 });
  return unit;
}

/**
 * Step 3: the rung Plan names after the placement, opened from Plan's own card.
 *
 * Returns the rung id Plan declared, so every later screen is checked against
 * the same declaration rather than against a second opinion.
 */
async function openTheRungPlanNames(page: Page, placedUnit: string): Promise<string> {
  await page.goto('/#/plan');
  const card = page.locator('#plan-next');
  await expect(card, 'Plan drew no Next up card after the placement').toBeVisible({ timeout: 60_000 });
  const lessonId = (await card.getAttribute('data-lesson-next')) ?? '';
  expect(lessonId, 'Next up names no rung').not.toBe('');

  // Not behind the placement: the learner said where to start.
  const order = unitsInOrder().map((entry) => entry.id);
  const unit = unitOfLesson(lessonId);
  expect(unit, `Next up names ${lessonId}, which is in no unit of the built curriculum`).toBeTruthy();
  expect(
    order.indexOf(unit?.id ?? ''),
    `Next up (${lessonId}, unit ${unit?.id ?? '?'}) sits behind the placed unit ${placedUnit}`,
  ).toBeGreaterThanOrEqual(order.indexOf(placedUnit));

  await card.click();
  await expect(page.locator('section[data-screen="lesson"]')).toHaveAttribute('data-lesson', lessonId, {
    timeout: 60_000,
  });
  return lessonId;
}

/**
 * The shortest playable thing the rung offers, read off the page and measured
 * from the build.
 *
 * Shortest because this chain is about the pass being recorded and not about
 * endurance; playable because a row marked *Import needed* has nothing behind
 * it. Which piece it is, is the rung's business and not this file's — the only
 * claim made about it is that the rung offered it.
 */
async function shortestPlayableOption(page: Page): Promise<string> {
  const offered = await page
    .locator('#lesson-songs .list-row[data-item], #lesson-exercises .list-row[data-item]')
    .evaluateAll((rows) =>
      rows
        .filter((row) => row.querySelector('.badge[data-kind="warn"]') === null)
        .map((row) => row.getAttribute('data-item') ?? ''),
    );
  expect(
    offered.length,
    'the rung the placement sends a learner to offers nothing that can be opened',
  ).toBeGreaterThan(0);

  const bars = new Map(catalog().map((row) => [row.id, row.notation?.bars ?? Number.MAX_SAFE_INTEGER]));
  const playable = offered.filter((id) => (catalog().find((row) => row.id === id)?.file ?? null) !== null);
  expect(playable.length, 'every option on the rung is a row with no file behind it').toBeGreaterThan(0);
  const shortest = [...playable].sort(
    (a, b) => (bars.get(a) ?? Number.MAX_SAFE_INTEGER) - (bars.get(b) ?? Number.MAX_SAFE_INTEGER),
  )[0];
  expect(shortest, 'the rung offered options and the sort returned none of them').toBeDefined();
  // Printed, because which piece this is depends on the content of the day and
  // a failure below is unreadable without it.
  console.log(
    `first day: the rung offers ${String(offered.length)} options, ${String(playable.length)} of them ` +
      `with a file; opening ${String(shortest)} (${String(bars.get(shortest ?? '') ?? '?')} printed bars)`,
  );
  return shortest ?? '';
}

/**
 * Step 4: the piece played right through in Wait mode, over the fake cable.
 *
 * The notes are asked for rather than carried: `scoreRun().expected` is what
 * the app is waiting for at this instant, so this plays whichever piece the
 * rung turned out to offer and cannot go stale when the content moves.
 */
async function playItThrough(page: Page, mock: MidiMock, itemId: string): Promise<number> {
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
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
  await setTempoPercent(page, FULL_TEMPO);

  await page.locator('#score-play').click();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-running', 'true');

  // The run is being judged by the cable, and not by nothing. Without this the
  // notes below go into a screen that is not listening and the whole chain
  // measures a piece playing itself.
  const armed = await runState(page);
  expect(armed, 'the run had not started when the first note was about to go in').not.toBeNull();
  expect(armed?.input, 'the score screen is not listening to the MIDI mock').toBe('midi');
  expect(armed?.engineMode, 'the run is not in Wait mode').toBe('wait');

  const summary = page.locator('#score-summary');
  // The bound is the piece's own length, in the piece's own terms: its last
  // printed bar, allowed sixty-four steps a bar. Nothing here is a number
  // measured on this machine, and the loop cannot spin in any case — every
  // turn is required to move the cursor before the next one starts.
  const bars = (armed?.lastBar ?? 0) + 1;
  const limit = bars * 64;
  let played = 0;
  let turn = 0;
  for (; turn <= limit; turn += 1) {
    if (await summary.isVisible()) break;
    const run = await runState(page);
    if (run === null) break;
    expect(
      run.expected.length,
      `the run stopped on step ${String(run.step)} expecting nothing at all`,
    ).toBeGreaterThan(0);
    for (const midi of run.expected) {
      await mock.noteOn(midi, 90);
      await mock.noteOff(midi);
      played += 1;
    }
    // Observe the move rather than sleeping through it.
    await expect
      .poll(
        async () => {
          if (await summary.isVisible()) return -1;
          return (await runState(page))?.step ?? -1;
        },
        {
          timeout: 20_000,
          message:
            `the run did not leave step ${String(run.step)} of ${itemId} after ` +
            `${String(run.expected.length)} expected notes went in`,
        },
      )
      .not.toBe(run.step);
  }
  expect(
    turn,
    `${itemId} is ${String(bars)} printed bars and took more than sixty-four steps a bar`,
  ).toBeLessThanOrEqual(limit);

  await expect(summary, 'the piece was played through and no summary appeared').toBeVisible({
    timeout: 60_000,
  });
  return played;
}

/** The chain, once. Both orientations run it; only the viewport differs. */
async function firstDay(page: Page, size: { width: number; height: number }): Promise<void> {
  await emptyStorage(page);
  // `granted`, because a first day has several reloads in it and a browser
  // remembers a granted MIDI permission across every one of them. With
  // `prompt` the cable connected in the tour was gone by the time the score
  // opened — `autoConnectMidi` refuses to reconnect without the grant — and
  // the run then had nothing judging it. That is a fair test of a *first*
  // launch and not of the day, which is what this file is about.
  const mock = await installMidiMock(page, { permission: 'granted' });
  await page.setViewportSize(size);
  await page.goto('/');

  await finishTheTour(page);
  const placedUnit = await takeThePlacement(page);
  const lessonId = await openTheRungPlanNames(page, placedUnit);

  const itemId = await shortestPlayableOption(page);
  await page.locator(`#lesson-songs .list-row[data-item="${itemId}"], #lesson-exercises .list-row[data-item="${itemId}"]`)
    .first()
    .click();
  // Arrived at the row's own declared item, carrying the rung it came from.
  const hash = new URL(page.url()).hash;
  expect(hash, `the row for ${itemId} opened something else: ${hash}`).toContain(encodeURIComponent(itemId));
  expect(hash, 'the score was opened without the rung it came from').toContain(`from=${lessonId}`);

  const played = await playItThrough(page, mock, itemId);
  expect(played, 'no note was fed through the cable').toBeGreaterThan(0);

  const sheet = page.locator('#score-summary');
  await expect(sheet, 'a run of every expected note was not a pass').toContainText(/Passed|Mastered/);
  await expect(sheet.locator('[data-stat="accuracy"]')).toHaveText('100%');
  // A judging input was connected, so there is nothing to self-report.
  await expect(page.locator('#summary-selfreport')).toHaveCount(0);
  await page.locator('#summary-done').click();

  // Back on the rung it came from, with the row now badged as passed.
  await expect(page.locator('section[data-screen="lesson"]')).toHaveAttribute('data-lesson', lessonId, {
    timeout: 60_000,
  });
  await expect(
    page.locator(`.list-row[data-item="${itemId}"] .badge[data-kind="passed"], .list-row[data-item="${itemId}"] .badge[data-kind="mastered"]`),
    'the pass is on the sheet and not on the rung',
  ).toHaveCount(1);

  // --- and now the reload, which is where a first day usually ends ---------
  await page.reload();

  // Plan first: it is the screen that owns the recommendation.
  await page.goto('/#/plan');
  const card = page.locator('#plan-next');
  await expect(card).toBeVisible({ timeout: 60_000 });
  const nextAfter = (await card.getAttribute('data-lesson-next')) ?? '';
  expect(nextAfter, 'Plan recommends nothing after the reload').not.toBe('');
  const order = unitsInOrder().map((entry) => entry.id);
  expect(
    order.indexOf(unitOfLesson(nextAfter)?.id ?? ''),
    `after the reload Plan recommends ${nextAfter}, behind the placed unit ${placedUnit}`,
  ).toBeGreaterThanOrEqual(order.indexOf(placedUnit));

  // Today, asked separately, and it has to give the same answer.
  await page.goto('/#/today');
  await expect(page.locator('#today-status')).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(async () => page.locator('#today-status').getAttribute('data-lesson'), {
      timeout: 30_000,
      message: 'Today and Plan disagree about the rung after a reload',
    })
    .toBe(nextAfter);

  // Skills, the third screen that says where the learner is: it opens on the
  // stage being worked on and the one below it (`04` §3a), so the stage it
  // names has to be the stage of the rung the other two named.
  await page.goto('/#/plan/skills');
  const skillsStatus = page.locator('#skills-status');
  await expect(skillsStatus).toBeVisible({ timeout: 60_000 });
  const stage = stageOfLesson(nextAfter);
  expect(stage, `${nextAfter} belongs to no stage in the built curriculum`).not.toBeNull();
  /**
   * The stage numbers Skills says it opened on, and nothing else on the line.
   *
   * `#skills-status` reads `76 of 266 concepts · stages 3 and 4`, so asking
   * whether the whole line *contains* the stage number is a question the
   * counts can answer by accident: `2` is in `266`, and the assertion would
   * then pass over a screen that had opened on stages 8 and 9. The tail after
   * `stage`/`stages` is the only part that is about stages.
   */
  const stagesNamed = async (): Promise<number[]> => {
    const text = (await skillsStatus.textContent()) ?? '';
    const tail = /·\s*stages?\s+(.+?)\s*$/.exec(text)?.[1];
    if (tail === undefined) return [];
    return tail.split(/\s*and\s*/).map((part) => Number(part.trim()));
  };
  await expect
    .poll(stagesNamed, { timeout: 30_000, message: 'Skills never said which stages it opened on' })
    .not.toHaveLength(0);
  const opened = await stagesNamed();
  console.log(`first day: Plan and Today say stage ${String(stage)}; Skills opened on ${opened.join(', ')}`);
  expect(
    opened,
    `Skills opened somewhere other than stage ${String(stage)}, which is where Plan and Today say the learner is`,
  ).toContain(stage);

  // …and the pass survived the reload, on the screen that lists what trains
  // a skill: a concept the passed item teaches is no longer untouched.
  const item = catalog().find((row) => row.id === itemId);
  expect(item, `${itemId} is not in the catalog`).toBeTruthy();
  await page.goto('/#/library');
  await page.locator('#library-search').fill(item?.title ?? '');
  const libraryRow = page.locator(`#library-list .list-row[data-item="${itemId}"]`);
  await expect(libraryRow, 'the passed piece cannot be found again in the Library').toBeVisible({
    timeout: 30_000,
  });
  await expect(
    libraryRow.locator('.badge[data-kind="passed"], .badge[data-kind="mastered"]'),
    'the Library does not know the piece was passed',
  ).toHaveCount(1);
}

test.describe('a first day', () => {
  // The whole chain: a tour, a placement, a score opened and engraved, a run
  // and a reload. Long, but bounded — when the chain broke it broke by
  // hanging, and a ten-minute budget means a broken build spends twenty
  // minutes saying so.
  test.setTimeout(300_000);

  // The owner's real screen, and the same two sizes `setup.spec.ts` uses: a
  // round number divides by too much and survives where a real phone does not.
  for (const [orientation, size] of [
    ['upright', { width: 342, height: 740 }],
    ['sideways', { width: 740, height: 342 }],
  ] as const) {
    test(`from nothing to a recorded pass, phone ${orientation}`, async ({ page }) => {
      await firstDay(page, size);
    });
  }
});
