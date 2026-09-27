// @vitest-environment jsdom
/**
 * The plan store is one authoritative read (L98, the reviewer's C7 fix-forward).
 *
 * Found in C7's pictures: on the first open after C5's code met a database made
 * before C5, Today and Skills showed the plan as it was before the one-time
 * carry-over (*Working on Stage 0*, Skills on stage 0) until a reload, while
 * the database already held the carried rungs. Two mechanisms, both in
 * `planStore.ts`:
 *
 * - `getPlan()` read the row asynchronously and assigned whatever came back to
 *   the shared `memory`, so a read issued before `updatePlan` wrote could land
 *   after it and put the old row back — every later reader then got it.
 * - The carry-over ran later, on the evidence job, as an ordinary
 *   `updatePlan`; a screen that had already read the plan kept the row from
 *   before it, and nothing told it the plan had changed.
 *
 * The rule the store keeps now: concurrent first reads are one read; the
 * carry-over, when it is due, is part of that read, so no reader receives the
 * plan from before it; writes are serialised behind it; and a read that lands
 * after the row was written or forgotten cannot publish the row it read.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { PlanRow, ProgressRow } from '../../src/data/db';
import type { Router } from '../../src/router';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

vi.mock('../../src/app/services', () => ({
  webMidiSource: { inputs: [] as unknown[], onStateChange: () => () => undefined },
  micSource: { state: { connected: false }, onStateChange: () => () => undefined },
}));

const CONTENT = resolve('public/content');
const built = JSON.parse(readFileSync(resolve(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const byId = new Map(built.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l] as const));

/** The owner's shape of history (as `carryOver.test.ts`): passes on the core rungs 0.1 to 2.1. */
function ownersHistory(): ProgressRow[] {
  const passed = new Set<string>();
  for (const id of ['0.1', '0.2', '0.3', '0.4', '1.1', '1.2', '1.3', '1.4', '1.5', '2.1']) {
    const rung = byId.get(id) as Lesson;
    for (const item of rung.exerciseOptions.slice(0, 2)) passed.add(item);
    for (const item of rung.songOptions.slice(0, 1)) passed.add(item);
  }
  return [...passed].map((itemId) => ({
    itemId,
    status: 'passed',
    bestAccuracy: 1,
    bestTempoPct: 100,
    attempts: 1,
    lastPracticedAt: '2026-09-10T10:00:00.000Z',
    minutes: 1,
    passedOn: ['2026-09-10'],
  }));
}

/** The tracks the owner chose (as `carryOver.test.ts`): the core path and classical. `['core']` alone reads as a fresh plan. */
const TRACKS = ['core', 'classical'];
const PLAN: PlanRow = { id: 'current', stage: 0, unitId: '', trackOrder: TRACKS };

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

/** A database the version 7 upgrade marked as made before C5, with the owner's passes and a plan. */
async function databaseMadeBeforeC5(): Promise<void> {
  const { CARRY_OVER_DUE_KEY, openDatabase } = await import('../../src/data/db');
  const db = await openDatabase();
  if (!db) throw new Error('the fake database did not open');
  for (const row of ownersHistory()) await db.put('progress', row);
  await db.put('plan', PLAN);
  await db.put('settings', true, CARRY_OVER_DUE_KEY);
}

/** Every module-level cache dropped: what a cold start looks like from inside the process. */
async function coldStart(): Promise<void> {
  const [db, progress, plan, load, settings] = await Promise.all([
    import('../../src/data/db'),
    import('../../src/data/progressStore'),
    import('../../src/data/planStore'),
    import('../../src/curriculum/load'),
    import('../../src/data/settingsStore'),
  ]);
  db.resetDatabaseForTest();
  progress.resetProgressForTest();
  plan.resetPlanForTest();
  load.resetContentCacheForTest();
  settings.resetSettingsForTest();
}

beforeEach(async () => {
  useFakeIndexedDb();
  localStorage.clear();
  serveContent();
  await coldStart();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('one read, never overwritten by a stale one', () => {
  it('concurrent first reads are one read: the same row, not two copies of it', async () => {
    const { openDatabase } = await import('../../src/data/db');
    await (await openDatabase())?.put('plan', PLAN);
    const { getPlan } = await import('../../src/data/planStore');
    const [a, b, c] = await Promise.all([getPlan(), getPlan(), getPlan()]);
    expect(b, 'a second first read went to the database on its own').toBe(a);
    expect(c).toBe(a);
  });

  it('a read issued while updatePlan is writing cannot put the old row back', async () => {
    const { openDatabase } = await import('../../src/data/db');
    await (await openDatabase())?.put('plan', { ...PLAN, unitId: '1.1' });
    const { getPlan, updatePlan } = await import('../../src/data/planStore');
    const write = updatePlan({ unitId: '2.2' });
    const read = getPlan();
    await Promise.all([write, read]);
    expect((await getPlan()).unitId, 'a stale read overwrote what updatePlan wrote').toBe('2.2');
    expect((await (await openDatabase())?.get('plan', 'current'))?.unitId).toBe('2.2');
  });

  it('a read that lands after the cache was forgotten (a restore) does not put the forgotten row back', async () => {
    const { openDatabase } = await import('../../src/data/db');
    const db = await openDatabase();
    await db?.put('plan', { ...PLAN, unitId: '1.1' });
    const { getPlan, forgetCachedPlan } = await import('../../src/data/planStore');
    // A read in flight, then the store written from outside and the cache told
    // (what `importAll` and a reset do). The order is forced so the read lands
    // after the forget: what this guards is that a read can never publish
    // across a forget, whatever the order the events arrive in.
    const read = getPlan();
    // A few microtasks: enough for the read to reach the database (the fake
    // one answers on a later task, as a browser's does), not for it to land.
    for (let tick = 0; tick < 5; tick += 1) await Promise.resolve();
    forgetCachedPlan();
    await db?.put('plan', { ...PLAN, unitId: '3.1' });
    await read;
    expect((await getPlan()).unitId, 'the row read before the restore came back after it').toBe('3.1');
  });
});

describe('the carry-over is part of the read: nobody receives the plan from before it', () => {
  it('the first read of a database made before C5 returns the carried plan, and repeated reads are the same one', async () => {
    await databaseMadeBeforeC5();
    const { getPlan, carryOverOnce } = await import('../../src/data/planStore');
    const { CARRY_OVER_DUE_KEY, openDatabase } = await import('../../src/data/db');
    const first = await getPlan();
    expect(first.carriedOver?.rungs, 'the first read gave the plan from before the carry-over').toContain('2.1');
    const again = await Promise.all([getPlan(), getPlan()]);
    expect(again[0]).toBe(first);
    expect(again[1]).toBe(first);
    expect(await (await openDatabase())?.get('settings', CARRY_OVER_DUE_KEY), 'the carry-over is still due').toBeUndefined();
    // The job's own step, later, carries nothing more: it reports what the read
    // carried, once (the job's status), then nothing, and the row is unchanged.
    expect(await carryOverOnce(built)).toBe(first.carriedOver?.rungs.length);
    expect(await carryOverOnce(built)).toBe(0);
    expect((await getPlan()).carriedOver).toEqual(first.carriedOver);
    // A cold start reads what was stored, once.
    await coldStart();
    expect((await getPlan()).carriedOver).toEqual(first.carriedOver);
  });

  it('Today, opened on the first open with the job’s carry-over running beside it, names the rung after the carried ones without a reload', async () => {
    await databaseMadeBeforeC5();
    const { carriedOver } = await import('../../src/data/carryOver');
    const { nextRecommended } = await import('../../src/curriculum/session');
    const { rungState } = await import('../../src/evidence/rungState');
    const { VOCABULARY_V0 } = await import('../../src/evidence/vocabulary');
    const carried = carriedOver(built, ownersHistory(), TRACKS);
    const expected = nextRecommended(built, rungState([], built, VOCABULARY_V0, new Date(), { carried }), TRACKS)?.lesson.id;
    const before = nextRecommended(built, rungState([], built, VOCABULARY_V0, new Date()), TRACKS)?.lesson.id;
    expect(expected, 'the carried plan and the uncarried one name the same rung: the case proves nothing').not.toBe(before);

    const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');
    const { carryOverOnce } = await import('../../src/data/planStore');
    const section = TodayScreen(router());
    document.body.replaceChildren(section);
    // The evidence job's step, while the screen's first reads are in flight.
    await carryOverOnce(built);
    await vi.waitFor(
      () => {
        expect(section.querySelector('#today-status')?.getAttribute('data-lesson'), 'Today drew from the plan before the carry-over').toBe(expected);
      },
      { timeout: 20_000 },
    );
  }, 30_000);

  it('Skills, opened on the first open with the job’s carry-over running beside it, opens where the carried plan says, with the carried concepts introduced', async () => {
    await databaseMadeBeforeC5();
    const { SkillsScreen } = await import('../../src/ui/screens/SkillsScreen');
    const { carryOverOnce } = await import('../../src/data/planStore');
    const section = SkillsScreen(router());
    document.body.replaceChildren(section);
    await carryOverOnce(built);
    await vi.waitFor(
      () => {
        expect(section.querySelector('#skills-list .list-row')).not.toBeNull();
      },
      { timeout: 20_000 },
    );
    expect(section.querySelector('#skills-status')?.textContent, 'Skills opened on the plan before the carry-over').toMatch(/stages 1 and 2$/);
    expect(section.querySelector('#skills-list .list-row[data-concept="bass-clef"]')?.getAttribute('data-state'), 'a carried rung’s skill is not introduced').toBe('introduced');
  }, 30_000);
});
