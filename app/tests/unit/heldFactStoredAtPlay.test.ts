// @vitest-environment jsdom
/**
 * Whether a run was held is the fact its header stored at play time, never an inference from today's curriculum
 * (SR4; the reviewer's ruling on SR3, `docs/review/responses/sr3-lb1-landing.md` §3).
 *
 * SR3 (Entry 262) read the hold back by comparing a run's stored options with what today's vocabulary says the
 * judging rung would write. That comparison is a present-day reading of a historical fact: move a demand to
 * another rung and a run that was held when played reads as unheld, or an unheld one as held, and its rung credit
 * moves with it. The run header now keeps the route's hold where the Score screen wrote the phrase under one
 * (`opened.hold`), and the rung state reads that.
 *
 * The adversary: one held run and one unheld run, each written the way the app writes it and stored through the
 * normal run write (`recordRun`), read back the way Plan, Today, the lesson page and Skills read it
 * (`loadRungStates`, from the store). Then the in-memory vocabulary moves one demand, so that today's comparison
 * (`inferredHeld` below, Entry 262's predicate kept here as the oracle) classifies the run the other way:
 *
 * - the held run: a daily read at 1.1, judged by 1.5 and held to 1.1 (SR2). Move `interval.skip` past 1.5 and
 *   1.5's own phrase can no more skip than 1.1's, so the comparison reads the run as unheld and would credit 1.5;
 * - the unheld run: `-2-right` read from 2.2's page, judged by 2.2 and held to nothing but 2.2. Move
 *   `range.beyond-position` from 2.5 to 2.2 and 2.2's phrase may now leave C position while the stored one could
 *   not, so the comparison reads the run as held and would take 2.2's exercise run away.
 *
 * Both runs' status and credit stay what was stored. And the stored hold survives every path a run row takes: the
 * run write and the rung state's read, the evidence job's write, compaction, and the backup's export and import.
 * Nothing heard.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { phraseOptions, readingOffer, writtenOptions, type LessonPosition } from '../../src/curriculum/session';
import { phraseMaterial } from '../../src/curriculum/material';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import { loadCurriculum } from '../../src/curriculum/load';
import { rungForSlot } from '../../src/ui/screens/TodayScreen';
import { storedHold } from '../../src/ui/screens/ScoreScreen';
import { generateSightReading } from '../../src/engine/sightReading';
import { READING_CONTROLS } from '../../src/engine/readingControls';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { RungStates } from '../../src/evidence/rungState';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { openDatabase, type SessionRow } from '../../src/data/db';
import { NOT_MEASURED } from '../../src/engine/types';
import {
  compactObservation,
  forgetCachedProgress,
  recordRun,
  replaceSessionEvidence,
  resetProgressForTest,
  rungRows,
  sessionsTidied,
  type RunResult,
} from '../../src/data/progressStore';
import { resetPlanForTest } from '../../src/data/planStore';
import { loadRungStates } from '../../src/data/rungStates';
import { exportAll, importAll, streamBackup } from '../../src/data/backup';
import { readPhrase } from './helpers/reader';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const CONTENT = join(process.cwd(), 'public', 'content');
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const lessons: Lesson[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
const lesson = (id: string): Lesson => lessons.find((one) => one.id === id) as Lesson;
const byId = new Map(catalog.map((item) => [item.id, item]));

/** Both runs on 2 November 2026; the rung state read the morning after. */
const PLAYED = new Date(2026, 10, 2, 12);
const TODAY = new Date(2026, 10, 3, 8);

/** Serves the built content to `curriculum/load`'s own `fetch` (as `assignmentIsNotEvidence.test.ts` does). */
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

/**
 * The oracle: Entry 262's `session.heldBelowItsRung`, verbatim in substance — a run is held when its stored options
 * cannot write a reading demand that the judging rung's phrase of the same row, recipe and seed can, read against
 * the vocabulary as it is now (`VOCABULARY_V0`, which the moves below change in memory). Never the credit path.
 */
function inferredHeld(row: SessionRow): boolean {
  const judging = row.lessonId;
  const written = writtenOptions(row);
  const item = byId.get(row.itemId);
  if (judging === undefined || written === undefined || item?.drill?.kind !== 'sight-reading') return false;
  const recipe = row.recipe === undefined ? undefined : { row: row.recipe.row, ...(row.recipe.moved ? { moved: row.recipe.moved } : {}) };
  const atRung = phraseOptions(curriculum, item, recipe, row.seed, { judging }, VOCABULARY_V0);
  return Object.values(READING_CONTROLS).some((control) => control.mayWrite(atRung) && !control.mayWrite(written));
}

/** A vocabulary demand's `taughtAt`, moved in memory, put back after each case. */
const moved: { demand: { taughtAt?: string[] }; was: string[] | undefined }[] = [];
function move(id: string, to: string[]): void {
  const demand = VOCABULARY_V0.demands.find((one) => one.id === id) as unknown as { taughtAt?: string[] } | undefined;
  expect(demand, id).toBeDefined();
  if (!demand) return;
  moved.push({ demand, was: demand.taughtAt });
  demand.taughtAt = to;
}

/** One clean run of a generated phrase as the Score screen hands it to `recordRun`. */
async function run(item: CatalogItem, seed: number, rungs: { judging: string; hold?: string }, opened: NonNullable<SessionRow['opened']>): Promise<RunResult> {
  const options = phraseOptions(curriculum, item, { row: item.id }, seed, rungs);
  const phrase = generateSightReading(options);
  const { result } = await readPhrase({ item, options, at: PLAYED.toISOString(), tempoPct: 100, recipe: { row: item.id }, opened });
  return { ...result, lessonId: rungs.judging, seed, material: phraseMaterial(phrase.generator, options, phrase.bpm) };
}

/** Today's daily read for a learner at 1.1: judged by 1.5, held to 1.1 (SR2), the route's hold stored (SR4). */
let heldRun: RunResult;
/** `-2-right` opened from 2.2's page: judged by 2.2, no hold. */
let unheldRun: RunResult;

beforeAll(async () => {
  const offer = readingOffer({
    curriculum,
    items: catalog,
    position: { lesson: lesson('1.1') } as LessonPosition,
    activeTracks: defaultActiveTracks(curriculum),
    rows: [],
    today: new Date(2026, 10, 2, 8),
    purpose: 'daily',
  });
  if (offer === null) throw new Error('no daily read at 1.1');
  const judging = rungForSlot(curriculum, offer.item, offer.lessonId) as string;
  expect([offer.item.id, judging, offer.hold]).toEqual(['drill.reading.sight-reading-1', '1.5', '1.1']);
  const rungs = { judging, hold: offer.hold as string };
  // The header's hold as the Score screen decides it when it writes the phrase (SR4).
  const hold = storedHold(curriculum, rungs);
  expect(hold).toBe('1.1');
  heldRun = await run(offer.item, offer.seed, rungs, { tab: 'today', rung: judging, slot: 'daily-read', ...(hold === undefined ? {} : { hold }) });
  const twoRight = byId.get('drill.reading.sight-reading-2-right') as CatalogItem;
  expect(storedHold(curriculum, { judging: '2.2' })).toBeUndefined();
  unheldRun = await run(twoRight, 1, { judging: '2.2' }, { tab: 'plan', rung: '2.2', slot: NOT_MEASURED });
}, 120_000);

beforeEach(() => {
  serveContent();
  useFakeIndexedDb();
  resetProgressForTest();
  resetPlanForTest();
});
afterEach(() => {
  for (const { demand, was } of moved.splice(0).reverse()) demand.taughtAt = was;
  clearFakeIndexedDb();
  vi.unstubAllGlobals();
});

/** Stores runs through the normal write, and waits for its tidy. */
async function store(...runs: RunResult[]): Promise<void> {
  for (const one of runs) await recordRun(one, PLAYED);
  await sessionsTidied();
}

/** Where the learner is, read the way Plan, Today, the lesson page and Skills read it, from the store itself. */
async function whereTheLearnerIs(): Promise<RungStates> {
  forgetCachedProgress();
  return loadRungStates(await loadCurriculum(), TODAY);
}
const readings = (states: RungStates, id: string): [string, boolean | 'unjudged', number][] =>
  (states.byRung.get(id)?.requirements ?? []).map((one) => [one.requirement.kind, one.holds, one.have]);

/** The one stored row of `itemId`, as the rung state reads it. */
async function storedRow(itemId: string): Promise<SessionRow> {
  forgetCachedProgress();
  const row = (await rungRows()).find((one) => one.itemId === itemId);
  expect(row, itemId).toBeDefined();
  return row as SessionRow;
}

describe('a held run keeps its hold when the vocabulary moves (red on Entry 262’s inference)', () => {
  it('stored with `opened.hold` 1.1, it credits 1.5 nothing; with `interval.skip` moved past 1.5 the comparison reads it unheld, and it still credits nothing', async () => {
    await store(heldRun);
    const row = await storedRow(heldRun.itemId);
    expect(row.opened).toMatchObject({ rung: '1.5', hold: '1.1' });
    const asPlayed = readings(await whereTheLearnerIs(), '1.5');
    expect(asPlayed).toEqual([
      ['runs', false, 0],
      ['reads', false, 0],
      ['skill', false, 0],
    ]);

    move('interval.skip', ['2.1']);
    // The adversary is real: today's comparison now reads the run as unheld.
    expect(inferredHeld(row)).toBe(false);
    expect(readings(await whereTheLearnerIs(), '1.5'), 'the held run was re-credited to 1.5 once the vocabulary moved').toEqual(asPlayed);
  });
});

describe('an unheld run keeps its credit when the vocabulary moves (red on Entry 262’s inference)', () => {
  it('stored with no hold, it meets 2.2’s exercise run; with `range.beyond-position` moved to 2.2 the comparison reads it held, and it still meets it', async () => {
    await store(unheldRun);
    const row = await storedRow(unheldRun.itemId);
    expect(row.opened).toEqual({ tab: 'plan', rung: '2.2', slot: NOT_MEASURED });
    const asPlayed = readings(await whereTheLearnerIs(), '2.2');
    expect(asPlayed[0]).toEqual(['runs', true, 1]);

    move('range.beyond-position', ['2.2']);
    expect(inferredHeld(row)).toBe(true);
    expect(readings(await whereTheLearnerIs(), '2.2'), 'the unheld run lost its 2.2 credit once the vocabulary moved').toEqual(asPlayed);
  });
});

describe('the stored hold survives every path a run row takes (finish item 4)', () => {
  it('the run write and the rung state’s read; the evidence job’s write; compaction', async () => {
    await store(heldRun, unheldRun);
    const db = await openDatabase();
    const all = (await db?.getAll('sessions')) ?? [];
    expect(all.map((one) => [one.itemId, one.opened?.hold])).toEqual([
      ['drill.reading.sight-reading-1', '1.1'],
      ['drill.reading.sight-reading-2-right', undefined],
    ]);
    const held = all[0] as SessionRow;
    expect(compactObservation(held).opened).toEqual(held.opened);
    await replaceSessionEvidence(held.id as number, { evidence: held.evidence, evidenceDefinitions: held.evidenceDefinitions });
    expect((await db?.get('sessions', held.id as number))?.opened).toEqual(held.opened);
    expect((await storedRow(held.itemId)).opened).toEqual(held.opened);
  });

  it('the backup: the streamed file and the in-memory one carry it, and a restore into a fresh store keeps it and the credit', async () => {
    await store(heldRun, unheldRun);
    const before = await whereTheLearnerIs();
    const file = JSON.parse(JSON.stringify(await exportAll(PLAYED))) as { stores: { sessions: SessionRow[] } };
    let streamed = '';
    for await (const chunk of streamBackup(PLAYED)) streamed += chunk;
    for (const shape of [file, JSON.parse(streamed) as typeof file]) {
      expect(shape.stores.sessions.map((one) => one.opened?.hold)).toEqual(['1.1', undefined]);
    }

    useFakeIndexedDb();
    resetProgressForTest();
    await importAll(file);
    const db = await openDatabase();
    const restored = (await db?.getAll('sessions')) ?? [];
    expect(restored.map((one) => [one.itemId, one.opened])).toEqual(file.stores.sessions.map((one) => [one.itemId, one.opened]));
    const after = await whereTheLearnerIs();
    for (const id of ['1.5', '2.2']) expect(readings(after, id), id).toEqual(readings(before, id));
  });
});
