// @vitest-environment jsdom
/**
 * Assigning an imported piece to a rung makes it an option of the rung, never
 * progress (T52; the reviewer's audit Part 21 §A, backlog E21).
 *
 * The assign sheet told the learner that assigning a piece "counts towards
 * finishing the rung". Since C5 a rung is met by the evidence its requirements
 * name (`evidence/rungState`), and assignment only puts the piece among the
 * rung's song options (`curriculum/load.overlayImports`). So the sheet's words
 * are asserted first, and then the boundary, in one test with both halves,
 * through the app's own doors: the sheet's Save, the curriculum loader, the
 * store every run goes through (`recordRun`) and the derivation every screen
 * reads (`loadRungStates`), on the built curriculum.
 *
 * - Assigning writes no run, so there is no evidence, the piece's progress is
 *   untouched, and no rung's state moves.
 * - Then a run of the piece built to meet the rung's own `runs` requirement
 *   over its songs, and judged by that rung, meets that requirement and no
 *   other. Runs of it that miss the predicate (below the rung's standard, or
 *   opened from the Library so no rung judged it) meet nothing, so nothing
 *   here says that any run of an assigned import counts.
 *
 * The same fault was in two more places the learner reads (the T52
 * fix-forward): the score folder's line after Save, which also printed the
 * rung's id, and the Guide's section on adding scores. Both are read here as
 * the learner meets them, from the mounted screens.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDatabase, type FolderScore, type ImportRow } from '../../src/data/db';
import type { Router } from '../../src/router';
import { FolderScreen } from '../../src/ui/screens/FolderScreen';
import { GuideScreen } from '../../src/ui/screens/GuideScreen';
import type { RungStates } from '../../src/evidence/rungState';
import { allItems, loadCurriculum } from '../../src/curriculum/load';
import { findLesson, indexCatalog } from '../../src/curriculum/selectors';
import { buildSession, REPERTOIRE_WINDOW_DAYS, type SlotKind } from '../../src/curriculum/session';
import { activeTracksFor } from '../../src/curriculum/tracks';
import { isSightReading } from '../../src/engine/drills/fromCatalog';
import { addImport, updateImport } from '../../src/data/importStore';
import {
  allProgress,
  forgetCachedProgress,
  getProgress,
  learnedPieces,
  recordRun,
  resetProgressForTest,
  rungRows,
  sessionsTidied,
  walkSessions,
  type RunResult,
} from '../../src/data/progressStore';
import { getPlan, resetPlanForTest } from '../../src/data/planStore';
import { loadRungStates } from '../../src/data/rungStates';
import { getSettings } from '../../src/data/settingsStore';
import { openAssignSheetFor } from '../../src/ui/assignSheet';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';

// Estimating a level parses the score through OpenSheetMusicDisplay, which
// does not render in jsdom and is not what is tested here (as in
// `folderAssign.test.ts`). Everything else is the app's own.
vi.mock('../../src/score/estimateImport', () => ({
  estimateLevelFor: () => Promise.resolve(undefined),
  loadLevelModel: () => Promise.resolve(null),
}));

const CONTENT = resolve('public/content');
const TODAY = new Date('2026-10-10T12:00:00Z');
/** Eighth notes and counting: its own standard, a songs requirement and two others. */
const RUNG = '2.2';
/** The index of 2.2's `runs` requirement over its songs, checked against the content below. */
const SONGS = 1;

const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>My piece</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><note><rest/><duration>4</duration></note></measure></part>
</score-partwise>`;

/** Serves the built content to `curriculum/load`'s own `fetch` (as `legacyStorage.test.ts` does). */
function serveContent(): void {
  vi.stubGlobal('fetch', (url: string) => {
    const path = String(url).replace(/^.*content\//, '');
    try {
      return Promise.resolve(new Response(readFileSync(resolve(CONTENT, path), 'utf8'), { status: 200 }));
    } catch {
      return Promise.resolve(new Response('not found', { status: 404 }));
    }
  });
}

/** Every rung's status and each requirement's reading: what a screen could show. */
function standing(states: RungStates): unknown[] {
  return [...states.byRung.values()].map((reading) => ({
    rung: reading.rung.id,
    status: reading.status,
    requirements: reading.requirements.map((one) => ({ holds: one.holds, have: one.have, items: one.items })),
  }));
}

/** Where the learner is, read the way Plan, Today, the lesson page and Skills read it, from the store itself. */
async function whereTheLearnerIs(): Promise<RungStates> {
  forgetCachedProgress();
  return loadRungStates(await loadCurriculum(), TODAY);
}

async function storedRuns(): Promise<number> {
  let count = 0;
  await walkSessions(() => {
    count += 1;
  });
  return count;
}

/** The sheet, from the door the share path, the lesson page and the folder use; `rung` chosen and saved. */
async function assign(row: ImportRow, rung: string): Promise<ImportRow> {
  let resolveSaved: (saved: ImportRow) => void = () => undefined;
  const saved = new Promise<ImportRow>((resolveIt) => {
    resolveSaved = resolveIt;
  });
  await openAssignSheetFor(row, { onSaved: resolveSaved });
  const select = document.getElementById('assign-lesson') as HTMLSelectElement;
  select.value = rung;
  select.dispatchEvent(new Event('change'));
  (document.getElementById('assign-save') as HTMLButtonElement).click();
  return saved;
}

/** A run of the piece as the Score screen hands it to the store. */
function run(itemId: string, over: Partial<RunResult>): RunResult {
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    passed: true,
    masterEligible: false,
    ...over,
  };
}

beforeEach(() => {
  serveContent();
  useFakeIndexedDb();
  resetProgressForTest();
  resetPlanForTest();
  document.body.replaceChildren();
});
afterEach(() => {
  clearFakeIndexedDb();
  vi.unstubAllGlobals();
});

describe('assigning an imported piece to a rung', () => {
  it('tells the learner it becomes one of the rung’s practice options, and nothing about finishing the rung', async () => {
    const row = await addImport(fakeFile('my-piece.musicxml', MUSICXML));
    await openAssignSheetFor(row, { onSaved: () => undefined });
    const said = document.querySelector('#assign-sheet .sheet__body > p')?.textContent;
    expect(said).toBe(
      'Assigning it to a rung makes it one of that rung’s practice options. The app can suggest it there, and qualifying practice can count toward that rung’s requirements.',
    );
    const everything = document.getElementById('assign-sheet')?.textContent ?? '';
    expect(everything).not.toMatch(/counts? towards|finishing the rung/i);
  });

  it('gives no evidence and moves no rung; a run built to the rung’s songs requirement and judged by it meets that requirement', async () => {
    // The rung as built: the predicate the qualifying run is constructed to
    // meet. 2.2 states its own standard, so the Settings pair does not enter,
    // and "require 2 songs" is off, as it is by default.
    const built = await loadCurriculum();
    const rung = findLesson(built, RUNG);
    expect(rung?.requirements?.[SONGS], `${RUNG}'s songs requirement moved`).toEqual({ kind: 'runs', from: 'songs', count: 1 });
    expect(rung?.mastery).toEqual({ minAccuracy: 0.9, minTempoPct: 0.85 });
    expect(getSettings().requireTwoSongs).toBe(false);

    const row = await addImport(fakeFile('my-piece.musicxml', MUSICXML));
    const before = await whereTheLearnerIs();
    expect(before.byRung.get(RUNG)?.status).toBe('not started');

    // --- the first half: assignment alone ---------------------------------
    const saved = await assign(row, RUNG);
    expect(saved.lessonIds).toEqual([RUNG]);
    // It took: the loader every screen uses now lists the piece among the rung's songs.
    expect(findLesson(await loadCurriculum(), RUNG)?.songOptions).toContain(row.id);
    // No run was written, so there is no evidence; the piece's progress is untouched.
    expect(await storedRuns(), 'assigning wrote a run').toBe(0);
    const progress = await getProgress(row.id);
    expect([progress.status, progress.attempts, progress.passedOn]).toEqual(['new', 0, []]);
    // And no rung moved, 2.2 included: every status and every requirement's reading as before.
    const assigned = await whereTheLearnerIs();
    expect(standing(assigned)).toEqual(standing(before));
    expect(assigned.byRung.get(RUNG)?.requirements[SONGS]?.holds).toBe(false);

    // --- the second half: practice -----------------------------------------
    // Runs of it that miss the predicate: at the Settings pair's 80 % tempo,
    // under 2.2's own 85 %; and at 2.2's standard but opened from the Library,
    // so no rung judged it. Neither meets the requirement.
    await recordRun(run(row.id, { lessonId: RUNG, tempoPct: 80, accuracy: 0.95, passed: false }), new Date('2026-10-09T10:00:00Z'));
    await recordRun(run(row.id, { tempoPct: 85, accuracy: 0.9 }), new Date('2026-10-09T10:05:00Z'));
    await sessionsTidied();
    const missed = (await whereTheLearnerIs()).byRung.get(RUNG);
    expect(missed?.requirements[SONGS]).toMatchObject({ holds: false, have: 0, items: [] });

    // A run built to meet it: 90 % at 85 % tempo, measured, in Keep tempo,
    // opened from 2.2 so 2.2 judges it.
    await recordRun(run(row.id, { lessonId: RUNG, tempoPct: 85, accuracy: 0.9 }), new Date('2026-10-09T10:10:00Z'));
    await sessionsTidied();
    const practised = (await whereTheLearnerIs()).byRung.get(RUNG);
    expect(practised?.requirements[SONGS]).toMatchObject({ holds: true, have: 1, items: [row.id] });
    // That requirement and no other: the exercise and the subdivision skill
    // still want their own evidence, so the rung is not met.
    expect(practised?.requirements.filter((_, index) => index !== SONGS).map((one) => one.holds)).toEqual([false, false]);
    expect(practised?.status).not.toBe('met');
  });
});

// Added (T52 fix-forward): the folder's line said "… is on 2.2 — it counts
// towards that rung now", and the Guide "A piece on a rung counts towards
// finishing it".
describe('the other places the learner reads what assigning does', () => {
  const router = { navigate: vi.fn() } as unknown as Router;

  it('the score folder names the rung by its title after Save, and says the piece is one of its options', async () => {
    const title = findLesson(await loadCurriculum(), RUNG)?.title;
    expect(title).toBeTruthy();
    const file = '07/Qm7.mxl';
    const score: FolderScore = {
      file,
      title: 'My piece',
      composer: '',
      level: null,
      bars: null,
      status: 'unknown',
      style: '',
      rating: 0,
      ratings: 0,
      views: 0,
      lyrics: false,
      garbled: false,
      museScore: '',
    };
    const db = await openDatabase();
    await db?.put('folderLibraries', { id: 'pianopath-library', addedAt: '2026-09-10T10:00:00.000Z', source: null, scores: [score] });
    const row = await addImport(fakeFile('my-piece.musicxml', MUSICXML));
    await updateImport(row.id, { origin: { folder: 'pianopath-library', file } });

    const section = FolderScreen(router);
    document.body.replaceChildren(section);
    const assignButton = await vi.waitFor(() => {
      const found = [...section.querySelectorAll<HTMLButtonElement>(`#folder-list .list-row[data-file="${file}"] button`)].find(
        (one) => one.textContent === 'Assign',
      );
      expect(found, 'the row offers no Assign').toBeDefined();
      return found as HTMLButtonElement;
    });
    assignButton.click();
    const select = await vi.waitFor(() => {
      const found = document.getElementById('assign-lesson');
      expect(found).toBeInstanceOf(HTMLSelectElement);
      return found as HTMLSelectElement;
    });
    select.value = RUNG;
    select.dispatchEvent(new Event('change'));
    (document.getElementById('assign-save') as HTMLButtonElement).click();

    const said = `My piece is now one of the practice options for ${String(title)}.`;
    await vi.waitFor(() => {
      expect(section.textContent).toContain(said);
    });
    expect(section.textContent).not.toMatch(/counts? towards/i);
    expect(section.textContent, 'the line printed the rung’s id').not.toContain(`is on ${RUNG}`);
  });

  it('the Guide’s section on adding scores says a piece on a rung is one of its practice options', () => {
    const guide = GuideScreen(router);
    const importing = guide.querySelector('[data-guide="importing"]')?.textContent ?? '';
    expect(importing).toContain(
      'A piece on a rung is one of that rung’s practice options: the app can suggest it there, and qualifying practice can count toward that rung’s requirements;',
    );
    expect(importing).not.toMatch(/counts? towards|finishing/i);
    // Third round: a piece on no rung is not one "the plan just does not know about" (see below).
    expect(importing).toContain(
      'a piece with no rung is still playable and never offered as a lesson’s work, but once you have passed it, Today’s review can bring it back when it has gone unplayed for a while, to keep it playable.',
    );
    expect(importing).not.toMatch(/does not know about it/);
  });
});

// Added (T52, third round): the Guide, the owner guide and three comments said
// a piece on no rung is one "the plan does not know about" or "the session
// builder cannot pick". Since C6 the review's repertoire retention reads every
// learned piece (`progressStore.learnedPieces`, every passed or mastered row)
// and `usable` asks nothing about rungs, so a passed piece on no rung comes
// back there. Asserted against the current code, to document the behaviour
// the sentences now describe.
describe('a piece on no rung and Today', () => {
  it('passed and then unplayed past the window, it comes back in the review to keep it playable, and is never a lesson’s work', async () => {
    const row = await addImport(fakeFile('my-piece.musicxml', MUSICXML));
    // Passed from the Library (no rung opened it), a day more than the window ago, and not played since.
    const lastPlayed = new Date(TODAY.getTime() - (REPERTOIRE_WINDOW_DAYS + 1) * 86_400_000);
    await recordRun(run(row.id, { tempoPct: 100, accuracy: 0.95 }), lastPlayed);
    await sessionsTidied();
    forgetCachedProgress();

    // Today's inputs, assembled as `TodayScreen` assembles them (`load`, `rebuild`).
    const curriculum = await loadCurriculum();
    const onARung = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons)).filter(
      (lesson) => [...lesson.exerciseOptions, ...lesson.songOptions, ...(lesson.paperOptions ?? [])].includes(row.id),
    );
    expect(onARung.map((lesson) => lesson.id), 'the piece is on a rung').toEqual([]);
    const items = await allItems();
    const catalog = indexCatalog(items);
    const progress = await allProgress();
    const generated = (id: string): boolean => {
      const item = catalog.byId.get(id);
      return item !== undefined && isSightReading(item);
    };
    const learned = learnedPieces(progress, generated);
    expect(learned.map((piece) => piece.itemId)).toEqual([row.id]);
    const input = {
      curriculum,
      catalog,
      items,
      states: await loadRungStates(curriculum, TODAY),
      learned,
      lastPlayed: new Map(progress.map((one) => [one.itemId, one.lastPracticedAt])),
      rows: await rungRows(),
      activeTracks: activeTracksFor(await getPlan(), curriculum),
      minutes: 30,
      today: TODAY,
    };

    // Shuffle's first eight turns: the review is the piece every time, in the
    // piece's own words; the warm-up and the new piece never are.
    for (let seed = 0; seed < 8; seed += 1) {
      const slots = buildSession({ ...input, seed }).slots;
      const review = slots.find((slot) => slot.kind === 'review');
      expect(review?.item?.id, `seed ${String(seed)}: the review`).toBe(row.id);
      expect(review?.claim?.kind).toBe('piece-retention');
      expect(review?.reason).toMatch(/^Keeping this piece playable — last played /);
      const lessonWork: SlotKind[] = ['technique', 'new'];
      for (const kind of lessonWork) {
        expect(slots.find((slot) => slot.kind === kind)?.item?.id, `seed ${String(seed)}: the ${kind} slot`).not.toBe(row.id);
      }
      expect(slots.filter((slot) => slot.item?.id === row.id).map((slot) => slot.kind)).toEqual(['review']);
    }
  });
});
