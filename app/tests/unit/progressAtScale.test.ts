// @vitest-environment node
/**
 * Three faults in the practice history that only appear on the owner's data.
 *
 * 1. **The day was UTC.** Minutes, passes and the heat map were all keyed by
 *    `toISOString().slice(0, 10)`. The owner is in the US, so an evening's
 *    practice was filed under *tomorrow*: today's square read zero while the
 *    minutes sat in one that had not happened yet, and a Saturday-evening
 *    session counted towards next week's goal. A test running at midday UTC
 *    with an injected `now` never sees it, which is why the timezone here is
 *    pinned rather than left to the runner.
 *
 * 2. **Restoring a backup destroyed what it restored.** `progressStore` keeps
 *    write-through copies of the progress rows and the streak; `importAll`
 *    writes the database from outside and cleared none of them, so the next run
 *    read the pre-restore streak, added its minutes and wrote it back over the
 *    restored history. The minutes are the one number in this app with no
 *    second source.
 *
 * 3. **A rare thing was looked for in a recent window.** Performances and one
 *    drill's own history were both answered by filtering the last hundred (or
 *    sixty) runs *of anything*. Both are rare by construction, so a few weeks
 *    of ordinary practice pushes them out of the window and the screen then
 *    says the opposite of what is true — "No performances yet" over a history
 *    that has them. The fixture cannot show it: fewer than a hundred sessions
 *    and every window holds everything.
 */
import { beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import {
  addMinutes,
  dayKey,
  getStreak,
  recentPerformances,
  recentSessions,
  recordRun,
  resetProgressForTest,
  sessionsForItem,
  weekSoFar,
} from '../../src/data/progressStore';
import { importAll } from '../../src/data/backup';

/** Ten thirty at night, Eastern — on the 11th here and the 12th in UTC. */
const EVENING = new Date(Date.UTC(2026, 8, 12, 2, 30));

beforeAll(() => {
  // The owner's own timezone, pinned so the runner's does not decide whether
  // this test can fail. Node re-reads `TZ` on the next `Date`.
  process.env.TZ = 'America/New_York';
});

async function run(itemId: string, at: Date, extra: { performance?: boolean } = {}): Promise<void> {
  await recordRun(
    {
      itemId,
      mode: 'wait',
      tempoPct: 100,
      accuracy: 0.9,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 60_000,
      passed: true,
      masterEligible: false,
      ...extra,
    },
    at,
  );
}

describe('the day a practice session belongs to', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetProgressForTest();
  });

  it('is the day it was where the owner is, not the day it was in UTC', () => {
    expect(dayKey(EVENING)).toBe('2026-09-11');
    // The fault, stated the other way round, so nobody reintroduces it by
    // "simplifying" the function back to one call.
    expect(EVENING.toISOString().slice(0, 10)).toBe('2026-09-12');
  });

  it('puts an evening practice in tonight, and in this week', async () => {
    await addMinutes(30, EVENING);
    const streak = await getStreak();
    expect(streak.minutesByDay['2026-09-11']).toBe(30);
    expect(streak.minutesByDay['2026-09-12']).toBeUndefined();
    // The week's walk counts days backwards with local arithmetic; it has to
    // name them the same way or it reads a square that does not exist.
    expect(weekSoFar(streak, EVENING).minutes).toBe(30);
    expect(weekSoFar(streak, EVENING).days).toBe(1);
  });

  it('counts two evenings either side of midnight as two days, for mastery', async () => {
    // `master` needs two passes on different days, and two consecutive evenings
    // in New York are one UTC date apart at 10:30 but *the same* UTC date at,
    // say, 8 pm and 8 pm — the rule has to be about the owner's calendar.
    await run('song.a', new Date(Date.UTC(2026, 8, 12, 0, 30))); // 8:30 pm, 11th
    const row = await run('song.a', new Date(Date.UTC(2026, 8, 12, 23, 30))).then(() =>
      getStreak(),
    );
    expect(Object.keys(row.minutesByDay).sort()).toEqual(['2026-09-11', '2026-09-12']);
  });
});

describe('restoring a backup', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetProgressForTest();
  });

  it('survives the next practice run', async () => {
    // The phone has a little history of its own, which is what puts the streak
    // row in memory.
    await addMinutes(12, EVENING);
    expect((await getStreak()).minutesByDay['2026-09-11']).toBe(12);

    await importAll(
      {
        app: 'pianopath',
        version: 1,
        exportedAt: '2026-09-11T00:00:00.000Z',
        stores: {
          streak: [
            {
              id: 'streak',
              minutesByDay: { '2026-01-01': 500, '2026-09-11': 12 },
              weeklyGoalMinutes: 150,
            },
          ],
        },
        keys: {},
      },
      { replace: true },
    );

    // One run, which is all it took: `addMinutes` copied the *cached* row and
    // put it back, and the five hundred minutes of restored history were gone
    // with no error and nothing on any screen to say so.
    await addMinutes(10, EVENING);
    const after = await getStreak();
    expect(after.minutesByDay['2026-01-01']).toBe(500);
    expect(after.minutesByDay['2026-09-11']).toBe(22);
  });
});

describe('finding a rare run in a long history', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetProgressForTest();
  });

  it('finds a performance that is further back than the last hundred runs', async () => {
    await run('song.recital', new Date(Date.UTC(2026, 5, 1, 18, 0)), { performance: true });
    // A few weeks of ordinary practice on top of it.
    for (let i = 0; i < 120; i += 1) {
      await run('drill.scales', new Date(Date.UTC(2026, 5, 2 + i, 18, 0)));
    }
    // What the screen used to do, and what it used to get.
    const inTheWindow = (await recentSessions(100)).filter((session) => session.performance);
    expect(inTheWindow).toHaveLength(0);
    // What it asks now.
    const performed = await recentPerformances(20);
    expect(performed).toHaveLength(1);
    expect(performed[0]?.itemId).toBe('song.recital');
  });

  it("finds a drill's own last runs when it is on a monthly rotation", async () => {
    await run('drill.blues', new Date(Date.UTC(2026, 5, 1, 18, 0)));
    await run('drill.blues', new Date(Date.UTC(2026, 5, 2, 18, 0)));
    for (let i = 0; i < 80; i += 1) {
      await run('drill.scales', new Date(Date.UTC(2026, 5, 3 + i, 18, 0)));
    }
    // The coaching's old question: "any of this drill's runs inside the last
    // sixty runs of anything", which is about a week.
    const oldWay = (await recentSessions(60)).filter((s) => s.itemId === 'drill.blues');
    expect(oldWay).toHaveLength(0);
    const runs = await sessionsForItem('drill.blues', 2);
    expect(runs).toHaveLength(2);
    // Newest first, because the plateau rule compares the last two.
    expect(runs[0]?.at.startsWith('2026-06-02')).toBe(true);
  });

  it('still hands back the most recent runs, newest first', async () => {
    await run('song.a', new Date(Date.UTC(2026, 5, 1, 18, 0)));
    await run('song.b', new Date(Date.UTC(2026, 5, 2, 18, 0)));
    await run('song.c', new Date(Date.UTC(2026, 5, 3, 18, 0)));
    const rows = await recentSessions(2);
    expect(rows.map((row) => row.itemId)).toEqual(['song.c', 'song.b']);
  });
});
