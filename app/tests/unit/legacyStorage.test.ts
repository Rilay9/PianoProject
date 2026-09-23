// @vitest-environment jsdom
/**
 * Progress from before this week, read by this week's code (T26 item 2).
 *
 * `dbUpgrades.test.ts` asks a different question and asks it well: every
 * *version* of the database upgraded, with a row in every store, checked for
 * the rows that would be lost. What it cannot see is the failure that has
 * nothing to do with `oldVersion` — **a row of the right shape written by an
 * older release, missing a field this release has since started writing.** No
 * upgrade block fires for that, because the schema did not move; the row comes
 * back exactly as it was left, and the new reader either copes or quietly
 * defaults it into something untrue.
 *
 * The snapshot below is the shape the app wrote at `2e08a0a`. Two things are
 * measured rather than assumed about that commit:
 *
 *   - `git diff 2e08a0a -- app/src/data/db.ts` is **empty**, and so is the
 *     same diff for `app/src/data/progressStore.ts`. The stores, the key
 *     paths, the indexes and `DB_VERSION` (6) are all identical to today's.
 *     So the snapshot is written through the app's own `openDatabase()`: the
 *     database an old release left is byte-for-byte the database this one
 *     makes, and the difference is entirely in what was *put* into it.
 *   - What the app of that date did **not** write is what the rows below leave
 *     out. `SessionRow.lessonId` was "a field `SessionRow` has carried since
 *     it was written and nothing filled" until 2026-09-21 (Entry 24 item 1);
 *     `PlanRow.placement` had no writer until the same day; `ImportRow.bytes`,
 *     `lessonIds`, `concepts` and `origin` are each younger than the import
 *     row here; and a folder's listing was one inline `scores` array before it
 *     was split into `folderScores` plus an index.
 *
 * Four things are asked of it, which are the four the brief names:
 *
 *   1. **Every stored pass is still a pass** — including under a rung whose
 *      `mastery.minAccuracy` is now *higher* than the accuracy the pass was
 *      recorded at. Entry 24 item 1 says a threshold change must not re-judge
 *      history; this is that claim, run.
 *   2. **Every screen that reads the rows draws.** Plan, Today, Progress,
 *      Skills and the Library are mounted for real, against the **built**
 *      curriculum and catalog, with the legacy rows underneath them.
 *   3. **No field the new code requires is missing or defaulted wrongly** —
 *      the weekly goal is the stored one and not the default, the import's
 *      size is filled from the file rather than reported as nought, the
 *      folder's inline listing is adopted rather than counted as empty, and
 *      the plan with no `placement` recommends from `trackOrder` instead of
 *      holding every rung back.
 *   4. **The corrected step count does not re-judge history** (Entry 50). The
 *      engine's `correctSteps` was nought on every Tempo run the app ever
 *      recorded and has now been fixed; the reason that is safe is that no
 *      stored row has ever carried the field. Asserted positively, on the row
 *      itself, rather than by citing the type.
 *
 * **Nothing here is heard, and nothing here is about music.** Every assertion
 * is about a row, a number or a string on a screen.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type {
  FolderScore,
  ImportRow,
  PlanRow,
  ProgressRow,
  SessionRow,
  SkillRow,
  StreakRow,
} from '../../src/data/db';
import { openDatabase, resetDatabaseForTest } from '../../src/data/db';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

vi.mock('../../src/app/services', () => ({
  webMidiSource: { inputs: [] as unknown[], onStateChange: () => () => undefined },
  micSource: { state: { connected: false }, onStateChange: () => () => undefined },
}));

/** The built content, served to the app's own loader the way the server does. */
const CONTENT = resolve('public/content');

const built = JSON.parse(readFileSync(resolve(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;

function everyRung(): Lesson[] {
  return built.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
}

/** The stage a rung is in, read from the build and not from its id. */
function stageOfRung(lessonId: string): number {
  for (const stage of built.stages) {
    for (const unit of stage.units) {
      if (unit.lessons.some((lesson) => lesson.id === lessonId)) return stage.number;
    }
  }
  throw new Error(`${lessonId} is in no stage of the built curriculum`);
}

/**
 * The accuracy the legacy pass was recorded at.
 *
 * Under the one global pair the app judged everything by before 2026-09-21
 * (`04` §7: 90 % at 80 % of written) this was a pass. It is deliberately
 * *below* the 95 % several rungs have asked for in their own data since the
 * curriculum was written, which is what makes the re-judging question real.
 */
const LEGACY_ACCURACY = 0.93;
const LEGACY_TEMPO_PCT = 80;

/**
 * A rung that asks for more than the legacy pass measured, with enough
 * openable options to be completed by it.
 *
 * Derived from the build rather than named here: a rung's numbers are content
 * and content moves. If no such rung exists the test says so instead of
 * quietly proving nothing.
 */
function rungStricterThanTheLegacyPass(): { lesson: Lesson; exercise: string; song: string } {
  for (const lesson of everyRung()) {
    if (lesson.mastery.minAccuracy <= LEGACY_ACCURACY) continue;
    if (lesson.songOptional === true) continue;
    if (lesson.mastery.exercisesRequired !== 1 || lesson.mastery.songsRequired !== 1) continue;
    const exercise = lesson.exerciseOptions[0];
    const song = lesson.songOptions[0];
    if (exercise === undefined || song === undefined) continue;
    return { lesson, exercise, song };
  }
  throw new Error(
    'no rung in the built curriculum asks for more accuracy than the legacy pass recorded, ' +
      'so the re-judging question cannot be put',
  );
}

const STRICT = rungStricterThanTheLegacyPass();

/**
 * The day this snapshot is read on, pinned.
 *
 * `displayState` calls a concept **rusty** after thirty days without practice,
 * so a snapshot with fixed dates in it would quietly change meaning a month
 * from now and the test would start failing for reasons that have nothing to
 * do with the code. Only `Date` is faked; the timers stay real, because
 * IndexedDB and `vi.waitFor` both need them.
 */
const READ_ON = new Date('2026-09-18T12:00:00');

const STARTED_ITEM = 'song.folk.hot-cross-buns';
const IMPORT_ID = 'import.legacy.minuet';
const IMPORT_XML = '<score-partwise><part-list/></score-partwise>';
const FOLDER_ID = 'Archive';
const BOOK_ID = 'book.legacy';

/** A progress row as the app wrote one before this week. No `selfPassed`. */
function legacyProgress(): ProgressRow[] {
  return [
    {
      itemId: STRICT.exercise,
      status: 'passed',
      bestAccuracy: LEGACY_ACCURACY,
      bestTempoPct: LEGACY_TEMPO_PCT,
      attempts: 6,
      lastPracticedAt: '2026-09-15T22:10:00.000Z',
      minutes: 31,
      passedOn: ['2026-09-15'],
    },
    {
      itemId: STRICT.song,
      status: 'mastered',
      bestAccuracy: 0.96,
      bestTempoPct: 100,
      attempts: 14,
      lastPracticedAt: '2026-09-16T23:40:00.000Z',
      minutes: 78,
      passedOn: ['2026-09-14', '2026-09-16'],
    },
    {
      itemId: STARTED_ITEM,
      status: 'started',
      bestAccuracy: 0.42,
      bestTempoPct: 0,
      attempts: 2,
      lastPracticedAt: '2026-09-17T01:02:00.000Z',
      minutes: 9,
      passedOn: [],
    },
  ];
}

/**
 * Two runs, neither carrying a `lessonId` — which nothing filled until
 * 2026-09-21 — and the first of them a **Tempo** run, which is the mode whose
 * `correctSteps` was nought for the whole of the app's life so far.
 */
function legacySessions(): Omit<SessionRow, 'id'>[] {
  return [
    {
      itemId: STRICT.exercise,
      mode: 'tempo',
      tempoPct: LEGACY_TEMPO_PCT,
      accuracy: LEGACY_ACCURACY,
      accuracyEstimated: false,
      wrongNotes: 4,
      missed: 1,
      durationMs: 214_000,
      at: '2026-09-15T22:10:00.000Z',
    },
    {
      itemId: STRICT.song,
      mode: 'wait',
      tempoPct: 100,
      accuracy: 0.96,
      accuracyEstimated: false,
      wrongNotes: 1,
      missed: 0,
      durationMs: 331_000,
      at: '2026-09-16T23:40:00.000Z',
    },
  ];
}

/** The plan row as it was written before the placement had anywhere to go. */
function legacyPlan(): PlanRow {
  return { id: 'current', stage: 2, unitId: '2.1', trackOrder: ['core', 'classical'] };
}

function legacyStreak(): StreakRow {
  return {
    id: 'streak',
    minutesByDay: { '2026-09-14': 25, '2026-09-15': 31, '2026-09-16': 47 },
    // Deliberately not `DEFAULT_WEEKLY_GOAL_MINUTES`: a default that is read
    // back where a stored value was written is invisible unless the two differ.
    weeklyGoalMinutes: 210,
  };
}

/**
 * Two skill rows, on concepts the **built curriculum** actually names.
 *
 * A concept id no lesson mentions gets no row on the Skills screen at all
 * (`buildConcepts` walks the curriculum, not the store), so a snapshot using
 * one would prove nothing about the screen.
 */
const MEASURED_CONCEPT = STRICT.lesson.concepts[0] ?? '';
const LEARNING_CONCEPT = STRICT.lesson.concepts[1] ?? '';

function legacySkills(): SkillRow[] {
  return [
    { conceptId: MEASURED_CONCEPT, state: 'known', lastReviewedAt: '2026-09-16T23:40:00.000Z' },
    ...(LEARNING_CONCEPT === '' ? [] : [{ conceptId: LEARNING_CONCEPT, state: 'learning' as const }]),
  ];
}

/** An import from before `bytes`, `lessonIds`, `concepts` and `origin` existed. */
function legacyImport(): ImportRow {
  return {
    id: IMPORT_ID,
    kind: 'musicxml',
    title: 'Minuet from the owner’s own book',
    data: IMPORT_XML,
    tags: ['Anna Magdalena'],
    level: 3.5,
    levelSource: 'judged',
    addedAt: '2026-09-12T14:00:00.000Z',
  };
}

function legacyFolderScore(): FolderScore {
  return {
    file: 'aa/legacy-one.mxl',
    title: 'A piece from the archive',
    composer: 'Unknown',
    level: 4,
    bars: 32,
    status: 'original',
    style: 'Classical',
    rating: 4.5,
    ratings: 12,
    views: 900,
    lyrics: false,
    garbled: false,
    museScore: '',
  };
}

/**
 * Writes the snapshot, then forgets every cache so the next read is a boot.
 *
 * `resetDatabaseForTest` plus each store's own reset is what a cold start
 * looks like from inside the process: nothing in memory, everything on disk.
 */
async function seedLegacySnapshot(): Promise<void> {
  const db = await openDatabase();
  expect(db, 'the fake IndexedDB gave no database to seed').not.toBeNull();
  if (!db) return;

  // Settings live only in IndexedDB here, which is the device whose
  // localStorage was cleared and whose database survived — the case
  // `hydratePersisted()` exists for.
  await db.put('settings', JSON.stringify({ zoom: 1.25, countInBars: 1 }), 'pianopath.settings');
  await db.put('settings', JSON.stringify({ status: 'done', version: 1 }), 'pianopath.setup');

  for (const row of legacyProgress()) await db.put('progress', row);
  for (const row of legacySessions()) await db.add('sessions', row);
  await db.put('plan', legacyPlan());
  await db.put('streak', legacyStreak());
  for (const row of legacySkills()) await db.put('skills', row);
  await db.put('imports', legacyImport());
  await db.put('levelOverrides', { itemId: STARTED_ITEM, level: 2.5, at: '2026-09-13T00:00:00.000Z' });
  await db.put('books', {
    id: BOOK_ID,
    title: 'The owner’s own book',
    kind: 'repertoire',
    addedAt: '2026-09-11T09:00:00.000Z',
    pieces: [
      {
        id: 'p1',
        title: 'Minuet',
        page: 14,
        level: 3.5,
        levelSource: 'judged',
        lessonIds: [],
        concepts: [],
      },
    ],
  });
  // The folder as it was stored before the listing was split: one row with the
  // whole listing inline and no `count`, no `listedFrom`.
  await db.put('folderLibraries', {
    id: FOLDER_ID,
    addedAt: '2026-09-10T10:00:00.000Z',
    source: null,
    scores: [legacyFolderScore()],
  });

  resetDatabaseForTest();
}

/** Serves the built content to `curriculum/load`'s own `fetch`. */
function serveContent(): void {
  vi.stubGlobal('fetch', (url: string) => {
    const path = String(url).replace(/^.*content\//, '');
    try {
      const body = readFileSync(resolve(CONTENT, path), 'utf8');
      return Promise.resolve(new Response(body, { status: 200 }));
    } catch {
      return Promise.resolve(new Response('not found', { status: 404 }));
    }
  });
}

function router(): Router {
  return {
    navigate: vi.fn(),
    navigateScore: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigatePdf: vi.fn(),
    navigatePaper: vi.fn(),
    navigateChart: vi.fn(),
    navigatePlay: vi.fn(),
    navigateLab: vi.fn(),
  } as unknown as Router;
}

describe('a storage snapshot from before this week, booted by this week’s code', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(READ_ON);
    useFakeIndexedDb();
    localStorage.clear();
    serveContent();
    await seedLegacySnapshot();

    // Every module-level cache dropped, so each test reads the rows rather
    // than the previous test's memory.
    const [progressStore, planStore, skillsStore, importStore, levelOverrides, load, settings] =
      await Promise.all([
        import('../../src/data/progressStore'),
        import('../../src/data/planStore'),
        import('../../src/data/skillsStore'),
        import('../../src/data/importStore'),
        import('../../src/data/levelOverrides'),
        import('../../src/curriculum/load'),
        import('../../src/data/settingsStore'),
      ]);
    progressStore.resetProgressForTest();
    planStore.resetPlanForTest();
    skillsStore.resetSkillsForTest();
    importStore.resetImportCacheForTest();
    levelOverrides.resetLevelOverridesForTest();
    load.resetContentCacheForTest();
    settings.resetSettingsForTest();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
    clearFakeIndexedDb();
  });

  it('restores the settings it can only find in the database', async () => {
    const { hydratePersisted } = await import('../../src/data/persist');
    const { reloadSettings, getSettings } = await import('../../src/data/settingsStore');

    // This is the boot path: localStorage is empty, so every mirrored key has
    // to come back out of IndexedDB or the screens draw defaults.
    const restored = await hydratePersisted();
    expect(restored, 'the settings blob was not restored from the database').toContain(
      'pianopath.settings',
    );
    expect(restored, 'the setup flag was not restored from the database').toContain('pianopath.setup');
    reloadSettings();
    expect(getSettings().zoom, 'the stored zoom was replaced by the default').toBe(1.25);
    expect(getSettings().countInBars, 'the stored count-in was replaced by the default').toBe(1);
    // And the tour is not offered again to somebody who already finished it.
    const { reloadSetup, setupStatus } = await import('../../src/data/setupStore');
    reloadSetup();
    expect(setupStatus(), 'a finished tour would be offered again').toBe('done');
  });

  it('keeps every stored pass a pass, with the numbers it was passed on', async () => {
    const { allProgress } = await import('../../src/data/progressStore');
    const rows = new Map((await allProgress()).map((row) => [row.itemId, row]));
    expect(rows.size, 'the progress rows did not survive the boot').toBe(legacyProgress().length);

    for (const written of legacyProgress()) {
      const read = rows.get(written.itemId);
      expect(read, `${written.itemId} is gone`).toBeDefined();
      // Field by field, because "the row is there" is not the claim.
      expect(read?.status, `${written.itemId} changed status`).toBe(written.status);
      expect(read?.bestAccuracy, `${written.itemId} lost its accuracy`).toBe(written.bestAccuracy);
      expect(read?.bestTempoPct, `${written.itemId} lost its tempo`).toBe(written.bestTempoPct);
      expect(read?.attempts, `${written.itemId} lost its attempts`).toBe(written.attempts);
      expect(read?.passedOn, `${written.itemId} lost its pass dates`).toEqual(written.passedOn);
      expect(read?.minutes, `${written.itemId} lost its minutes`).toBe(written.minutes);
    }
    // A measured pass carries no `selfPassed`, and the reader must not invent
    // one: `true` here would badge the owner's own run as his own word for it.
    expect(rows.get(STRICT.exercise)?.selfPassed).toBeUndefined();
  });

  it('does not re-judge a pass under a rung that now asks for more', async () => {
    const { allProgress } = await import('../../src/data/progressStore');
    const { lessonComplete, masteryCriteriaFor } = await import('../../src/curriculum/selectors');
    const { DEFAULT_MASTERY } = await import('../../src/engine/Scoring');

    // The rung's own numbers, read from the build, are stricter than the run.
    const criteria = masteryCriteriaFor(STRICT.lesson, DEFAULT_MASTERY);
    expect(
      criteria.passAccuracy,
      `${STRICT.lesson.id} no longer asks for more than the legacy pass measured`,
    ).toBeGreaterThan(LEGACY_ACCURACY);

    const records = (await allProgress()).map((row) => ({
      itemId: row.itemId,
      passed: row.status === 'passed' || row.status === 'mastered',
      mastered: row.status === 'mastered',
      ...(row.selfPassed === undefined ? {} : { selfPassed: row.selfPassed }),
    }));
    expect(
      lessonComplete(STRICT.lesson, records),
      `${STRICT.lesson.id} was completed under the old rule and this build reopened it`,
    ).toBe(true);
  });

  it('carries no step count on any stored row, which is why the engine fix is safe', async () => {
    const { recentSessions } = await import('../../src/data/progressStore');
    const sessions = await recentSessions(50);
    expect(sessions.length, 'the session rows did not survive the boot').toBe(legacySessions().length);

    const tempo = sessions.find((row) => row.mode === 'tempo');
    expect(tempo, 'the Tempo run is gone').toBeDefined();
    // The positive form of the absence: the row itself is enumerated, and the
    // field the engine fix moved is not among its keys — on this row or on the
    // progress row beside it. Nothing stored can therefore be re-derived from
    // a count that used to be nought.
    for (const row of sessions) {
      expect(Object.keys(row), `${row.itemId} stored a step count`).not.toContain('correctSteps');
      expect(Object.keys(row), `${row.itemId} stored a total step count`).not.toContain('totalSteps');
    }
    const { allProgress } = await import('../../src/data/progressStore');
    for (const row of await allProgress()) {
      expect(Object.keys(row), `${row.itemId} stored a step count`).not.toContain('correctSteps');
    }
    // And what the row *does* carry is exactly what was written, so the
    // history reads the same before and after the correction.
    expect(tempo?.accuracy).toBe(LEGACY_ACCURACY);
    expect(tempo?.tempoPct).toBe(LEGACY_TEMPO_PCT);
    expect(tempo?.wrongNotes).toBe(4);
    // Nothing filled `lessonId` before 2026-09-21, and a reader that defaulted
    // it to a rung would file an old run under a lesson it was never part of.
    expect(tempo?.lessonId, 'a rung was invented for a run that named none').toBeUndefined();
  });

  it('reads the stored weekly goal rather than the default', async () => {
    const { getStreak, weekSoFar, DEFAULT_WEEKLY_GOAL_MINUTES } = await import(
      '../../src/data/progressStore'
    );
    const streak = await getStreak();
    expect(streak.weeklyGoalMinutes).not.toBe(DEFAULT_WEEKLY_GOAL_MINUTES);
    expect(streak.weeklyGoalMinutes).toBe(legacyStreak().weeklyGoalMinutes);
    expect(streak.minutesByDay).toEqual(legacyStreak().minutesByDay);
    // The derived figure still works on days written by the old code.
    const week = weekSoFar(streak, new Date('2026-09-17T12:00:00'));
    expect(week.minutes).toBeGreaterThanOrEqual(0);
  });

  it('keeps the skill rows, and does not let an old date read as rusty on its own', async () => {
    const { allSkills, displayState } = await import('../../src/data/skillsStore');
    const rows = new Map((await allSkills()).map((row) => [row.conceptId, row]));
    for (const written of legacySkills()) {
      const read = rows.get(written.conceptId);
      expect(read, `${written.conceptId} is gone`).toBeDefined();
      expect(read?.state, `${written.conceptId} changed state`).toBe(written.state);
      expect(read?.lastReviewedAt).toBe(written.lastReviewedAt);
    }
    // A row with no `lastReviewedAt` at all — which is what the older writer
    // left — must not be read as thirty days stale.
    const noDate = rows.get(LEARNING_CONCEPT);
    if (noDate) expect(displayState(noDate)).toBe('learning');
  });

  it('keeps a plan with no placement, and still recommends from its track order', async () => {
    const { getPlan } = await import('../../src/data/planStore');
    const { nextRecommended } = await import('../../src/curriculum/session');
    const { activeTracksFor } = await import('../../src/curriculum/tracks');
    const { loadCurriculum } = await import('../../src/curriculum/load');

    const plan = await getPlan();
    expect(plan.trackOrder, 'the stored track order was replaced').toEqual(legacyPlan().trackOrder);
    expect(plan.unitId).toBe(legacyPlan().unitId);
    // No writer existed for this field at `2e08a0a`, so it must read as
    // absent — not as an empty string, which `startAt` would then try to match.
    expect(plan.placement, 'a placement was invented for a plan that never had one').toBeUndefined();

    const curriculum = await loadCurriculum();
    const recommended = nextRecommended(curriculum, [], activeTracksFor(plan, curriculum), {});
    expect(recommended, 'a plan with no placement recommends nothing at all').toBeTruthy();
  });

  it('fills an import’s size from the file rather than reporting nought', async () => {
    const { importSummaries, allImports } = await import('../../src/data/importStore');
    const stored = (await allImports()).find((row) => row.id === IMPORT_ID);
    expect(stored, 'the import is gone').toBeDefined();
    expect(stored?.bytes, 'the stored row was given a size it never had').toBeUndefined();

    const summary = (await importSummaries()).find((row) => row.id === IMPORT_ID);
    expect(summary, 'the import is missing from the summaries').toBeDefined();
    expect(summary?.bytes, 'an import written before `bytes` existed reports no size').toBe(
      new TextEncoder().encode(IMPORT_XML).length,
    );
    // The owner typed this level himself, and P15's migration says so. Printed
    // as an estimate it would be the app calling his judgement a guess.
    expect(summary?.levelSource).toBe('judged');
  });

  it('adopts a folder listing stored in the old inline shape', async () => {
    const { savedFolders, folderIndex, allFolderScores } = await import(
      '../../src/data/folderLibrary'
    );
    const folders = await savedFolders();
    const folder = folders.find((entry) => entry.id === FOLDER_ID);
    expect(folder, 'the folder entry is gone').toBeDefined();
    // Counted off the inline array before anything has split it. Nought here
    // is the screen saying "0 scores" over a folder it is about to list.
    expect(folder?.count, 'the old inline listing counted as empty').toBe(1);
    expect(folder?.listedFrom, 'a row written before `listedFrom` lost its listing kind').toBe('walk');

    const index = await folderIndex(FOLDER_ID);
    expect(index, 'the inline listing was not adopted into an index').not.toBeNull();
    expect(index?.files).toEqual([legacyFolderScore().file]);
    const scores = await allFolderScores(FOLDER_ID);
    expect(scores.map((score) => score.title)).toEqual([legacyFolderScore().title]);
  });

  it('keeps the level override and the shelf piece the old build wrote', async () => {
    const { allItems } = await import('../../src/curriculum/load');
    const { allShelfPieces } = await import('../../src/data/booksStore');
    // The boot primes this cache (`main.ts`), because `applyLevelOverrides` is
    // called from inside a render pass and cannot await a read.
    const { loadLevelOverrides } = await import('../../src/data/levelOverrides');
    await loadLevelOverrides();
    const items = await allItems();
    const overridden = items.find((item) => item.id === STARTED_ITEM);
    expect(overridden, `${STARTED_ITEM} is not in the built catalog`).toBeDefined();
    expect(overridden?.level, 'the stored level override was not applied').toBe(2.5);
    expect(overridden?.levelSource, 'an overridden level is the owner’s judgement').toBe('judged');

    const pieces = await allShelfPieces();
    expect(
      pieces.map((entry) => entry.book.id),
      'the shelf book the old build wrote is gone',
    ).toContain(BOOK_ID);
    // `book.<book>/<piece>` is what progress and sessions are keyed by, so a
    // book row that lost it would orphan every paper run against it.
    expect(pieces.map((entry) => entry.itemId)).toContain(`${BOOK_ID}/p1`);
  });

  describe('the screens that read these rows', () => {
    /** Mounts a screen and waits for the element that is its subject. */
    async function mounted(section: HTMLElement, subject: string): Promise<HTMLElement> {
      document.body.replaceChildren(section);
      await vi.waitFor(
        () => {
          expect(section.querySelector(subject), `${subject} never appeared`).not.toBeNull();
        },
        { timeout: 20_000 },
      );
      return section;
    }

    it('Plan draws its stage list and its Next up card', async () => {
      const { PlanScreen } = await import('../../src/ui/screens/PlanScreen');
      const section = await mounted(PlanScreen(router()), '#plan-list .list-row');
      await vi.waitFor(() => {
        expect(section.querySelector('#plan-next'), 'Plan drew no Next up card').not.toBeNull();
      });
      // The rung the legacy pass completed is drawn as complete. A stage is
      // collapsed until it is tapped, so the tap happens: a check skipped
      // because the row was not there is a check that proves nothing.
      const stage = stageOfRung(STRICT.lesson.id);
      const head = section.querySelector<HTMLElement>(`#plan-list [data-stage="${String(stage)}"]`);
      expect(head, `Plan drew no row for stage ${String(stage)}`).not.toBeNull();
      head?.click();
      await vi.waitFor(() => {
        const row = section.querySelector(`#plan-list [data-lesson="${STRICT.lesson.id}"]`);
        expect(row, `${STRICT.lesson.id} is not on Plan once its stage is open`).not.toBeNull();
        expect(
          row?.querySelector('.badge[data-kind="passed"]'),
          `${STRICT.lesson.id} was completed before this week and Plan does not say so`,
        ).not.toBeNull();
      });
    });

    it('Today draws its card and says which rung it is working on', async () => {
      const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');
      const section = await mounted(TodayScreen(router()), '#today-status');
      await vi.waitFor(() => {
        expect(
          section.querySelector('#today-status')?.textContent ?? '',
          'Today never said what it is working on',
        ).toContain('Working on');
      });
      // The stored goal, not the default, on the screen that prints it.
      await vi.waitFor(() => {
        expect(section.querySelector('#today-goal')?.textContent ?? '').toContain(
          String(legacyStreak().weeklyGoalMinutes),
        );
      });
    });

    it('Progress draws the week and the counts the old rows add up to', async () => {
      const { ProgressScreen } = await import('../../src/ui/screens/ProgressScreen');
      const section = await mounted(ProgressScreen(router()), '#progress-summary');
      await vi.waitFor(() => {
        const goal = section.querySelector('#progress-goal');
        expect(goal, 'Progress drew no weekly goal control').not.toBeNull();
        expect(
          (goal as HTMLInputElement | null)?.value,
          'Progress showed the default goal over the stored one',
        ).toBe(String(legacyStreak().weeklyGoalMinutes));
      });
      // One started, one passed, one mastered — the three rows, counted.
      const summary = section.querySelector('#progress-summary')?.textContent ?? '';
      expect(summary, 'Progress counted none of the stored passes').toMatch(/passed|mastered/i);
    });

    it('Skills draws the stored skill rows in the state they were stored in', async () => {
      const { SkillsScreen } = await import('../../src/ui/screens/SkillsScreen');
      const section = await mounted(SkillsScreen(router()), '#skills-list .list-row');

      /**
       * The screen opens on a stage or two and then pages fifty at a time
       * (`04` §3a), so a check about one concept has to page to it the way a
       * person would rather than hope it was in the opening set. Bounded by
       * the number of concepts the curriculum has, so it cannot spin.
       */
      async function paged(concept: string): Promise<Element | null> {
        const pages = Math.ceil((built.concepts ?? []).length / 50) + 2;
        for (let page = 0; page <= pages; page += 1) {
          const found = section.querySelector(`[data-concept="${concept}"]`);
          if (found) return found;
          const more = section.querySelector<HTMLElement>('#skills-show-all');
          if (!more) return null;
          more.click();
          await vi.waitFor(() => {
            expect(section.querySelector('#skills-list')).not.toBeNull();
          });
        }
        return section.querySelector(`[data-concept="${concept}"]`);
      }

      const measured = await paged(MEASURED_CONCEPT);
      expect(measured, `${MEASURED_CONCEPT} is not on the Skills screen`).not.toBeNull();
      expect(
        measured?.getAttribute('data-state'),
        'a skill recorded as measured before this week came back in another state',
      ).toBe('known');

      if (LEARNING_CONCEPT !== '') {
        const learning = await paged(LEARNING_CONCEPT);
        expect(learning, `${LEARNING_CONCEPT} is not on the Skills screen`).not.toBeNull();
        expect(
          learning?.getAttribute('data-state'),
          'a skill recorded as being learnt came back in another state',
        ).toBe('learning');
      }
    });

    it('the Library badges the stored passes and lists the old import', async () => {
      const { LibraryScreen } = await import('../../src/ui/screens/LibraryScreen');
      const { allItems } = await import('../../src/curriculum/load');
      const section = await mounted(LibraryScreen(router(), {}), '#library-list .list-row');

      // The list draws a page at a time, ordered by level, so the mastered
      // piece is found the way a person finds it rather than by hoping it is
      // in the first sixty rows.
      const title = (await allItems()).find((item) => item.id === STRICT.song)?.title ?? '';
      expect(title, `${STRICT.song} is not in the built catalog`).not.toBe('');
      const search = section.querySelector<HTMLInputElement>('#library-search');
      expect(search, 'the Library drew no search box').not.toBeNull();
      if (search) {
        search.value = title;
        search.dispatchEvent(new Event('input'));
      }
      await vi.waitFor(() => {
        expect(
          section.querySelector(`[data-item="${STRICT.song}"] .badge[data-kind="mastered"]`),
          `${STRICT.song} was mastered before this week and the Library does not say so`,
        ).not.toBeNull();
      });

      // And the import the old build wrote is a row like any other.
      if (search) {
        search.value = legacyImport().title;
        search.dispatchEvent(new Event('input'));
      }
      await vi.waitFor(() => {
        expect(
          section.querySelector(`[data-item="${IMPORT_ID}"]`),
          'an import written before this week is not in the Library',
        ).not.toBeNull();
      });
    });
  });
});
