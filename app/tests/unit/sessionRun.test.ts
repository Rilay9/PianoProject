/**
 * Today's session, run: the execution state and its store (X1; Part 18; the brief approved with its required
 * change, `docs/review/responses/bf8de2d2.md`).
 *
 * The state machine (`apply`, pure): start, the next activity, skip, move on, finish, choose, swap, time; and
 * every write refused where the session id, the composition's version or the activity token is not the stored
 * record's current one — a late callback from the activity before, a stale tab, a recomposed card — with
 * nothing overwritten. The store (`fake-indexeddb`): one record under one key, validated at read (a corrupt or
 * old-shaped record discarded, its reason logged), each event applied in one read-write transaction, another
 * day's run closed as not finished, a recomposed card's run closed as recomposed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import {
  SESSION_RUN_KEY,
  apply,
  applySessionEvent,
  closeSessionRun,
  compositionVersion,
  isOpen,
  newRun,
  nextPending,
  plannedMinutes,
  readSessionRun,
  resetSessionRunForTest,
  startSessionRun,
  validateRun,
  type ActivityEntry,
  type Expected,
  type SessionRun,
} from '../../src/data/sessionRun';
import { openDatabase } from '../../src/data/db';
import { dayKey } from '../../src/data/progressStore';

const NOW = new Date(2026, 9, 29, 18);
const TOMORROW = new Date(2026, 9, 30, 9);

function entry(order: number, kind: ActivityEntry['slot']['kind'], itemId: string, over: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    order,
    token: `tok${String(order)}${itemId.replace(/[^a-z0-9]/g, '')}`.slice(0, 32).padEnd(6, '0'),
    slot: { kind, itemId, title: itemId, minutes: 5 },
    route: { target: 'score', itemId },
    reason: `why ${itemId}`,
    ...over,
  };
}

/** A four-activity run and the free prompt, as Today writes it at *Start session*. */
function run(over: Partial<Parameters<typeof newRun>[0]> = {}): SessionRun {
  return newRun({
    day: dayKey(NOW),
    sessionId: 'session00a',
    version: 'v1',
    startedAt: NOW.toISOString(),
    activities: [entry(0, 'technique', 'ex.warm'), entry(1, 'review', 'ex.review'), entry(2, 'new', 'song.new'), entry(3, 'repertoire', 'song.keep')],
    outside: [{ order: 4, kind: 'free', title: 'Free play', minutes: 4, words: 'Play anything you like' }],
    ...over,
  });
}

const as = (r: SessionRun, index: number): Expected => ({ sessionId: r.sessionId, version: r.version, token: r.activities[index]?.token ?? '' });

function ok(result: ReturnType<typeof apply>): SessionRun {
  if (!result.ok) throw new Error(`refused: ${result.why}`);
  return result.run;
}

describe('the state machine', () => {
  it('starts on the first activity, pending, nothing done, no time, no detour', () => {
    const r = run();
    expect(r.current).toBe(0);
    expect(r.activities.map((a) => a.state)).toEqual(['pending', 'pending', 'pending', 'pending']);
    expect(r.elapsedMs).toBe(0);
    expect(r.detour).toBeNull();
    expect(plannedMinutes(r)).toBe(20);
    expect(isOpen(r, NOW)).toBe(true);
  });

  it('opened, attempted, completed: the activity is done and the cursor is on the next', () => {
    let r = run();
    r = ok(apply(r, as(r, 0), { kind: 'opened' }, NOW));
    expect(r.activities[0]?.state).toBe('active');
    r = ok(apply(r, as(r, 0), { kind: 'attempted' }, NOW));
    expect(r.activities[0]?.state).toBe('attempted');
    r = ok(apply(r, as(r, 0), { kind: 'completed', outcome: 'unknown' }, NOW));
    expect(r.activities[0]).toMatchObject({ state: 'completed', result: { outcome: 'unknown', attempts: 1 } });
    expect(r.current).toBe(1);
  });

  it('skip (the learner moves on from an untouched activity): skipped, never completed, and the next is current', () => {
    const r0 = run();
    const r = ok(apply(r0, as(r0, 0), { kind: 'advance' }, NOW));
    expect(r.activities[0]?.state).toBe('skipped');
    expect(r.activities[0]?.result).toBeUndefined();
    expect(r.current).toBe(1);
  });

  it('moving on from a tried activity leaves it tried, never failed', () => {
    let r = run();
    r = ok(apply(r, as(r, 0), { kind: 'attempted' }, NOW));
    r = ok(apply(r, as(r, 0), { kind: 'advance' }, NOW));
    expect(r.activities[0]?.state).toBe('attempted');
    expect(r.current).toBe(1);
  });

  it('finish: the last activity done closes the session as finished, cursor none', () => {
    let r = run();
    for (let i = 0; i < 4; i += 1) r = ok(apply(r, as(r, i), { kind: 'completed', outcome: 'unknown' }, NOW));
    expect(r.current).toBeNull();
    expect(r.closed?.why).toBe('finished');
    expect(isOpen(r, NOW)).toBe(false);
  });

  it('the free prompt is never current, never done, and nothing moves onto it', () => {
    let r = run();
    for (let i = 0; i < 4; i += 1) r = ok(apply(r, as(r, i), { kind: 'advance' }, NOW));
    expect(r.outside).toEqual([{ order: 4, kind: 'free', title: 'Free play', minutes: 4, words: 'Play anything you like' }]);
    expect(r.activities.every((a) => a.slot.kind !== 'free')).toBe(true);
    expect(plannedMinutes(r)).toBe(20);
    expect(r.closed?.why).toBe('finished');
  });

  it('choose: a row tapped out of order becomes current, the opened one it left goes back to pending, and nothing is skipped', () => {
    let r = run();
    r = ok(apply(r, as(r, 0), { kind: 'opened' }, NOW));
    r = ok(apply(r, as(r, 2), { kind: 'choose' }, NOW));
    expect(r.current).toBe(2);
    expect(r.activities[0]?.state).toBe('pending');
    r = ok(apply(r, as(r, 2), { kind: 'completed', outcome: 'unknown' }, NOW));
    // The next after it, then round to the one passed over.
    expect(r.current).toBe(3);
    r = ok(apply(r, as(r, 3), { kind: 'completed', outcome: 'unknown' }, NOW));
    expect(r.current).toBe(0);
    expect(nextPending(r, 0)).toBe(1);
  });

  it('an activity tried and left for another row (a drill starts as it opens) comes back after the one chosen; one moved on from does not', () => {
    let r = run();
    r = ok(apply(r, as(r, 0), { kind: 'attempted' }, NOW));
    r = ok(apply(r, as(r, 3), { kind: 'choose' }, NOW));
    expect(r.activities[0]?.state).toBe('attempted');
    r = ok(apply(r, as(r, 3), { kind: 'completed', outcome: 'unknown' }, NOW));
    expect(r.current).toBe(0);
    r = ok(apply(r, as(r, 0), { kind: 'advance' }, NOW));
    expect(r.activities[0]).toMatchObject({ state: 'attempted', movedOn: true });
    expect(r.current).toBe(1);
    expect(nextPending(r, 2)).toBe(1);
  });

  it('a done activity cannot be chosen back into the session', () => {
    let r = run();
    r = ok(apply(r, as(r, 0), { kind: 'completed', outcome: 'unknown' }, NOW));
    expect(apply(r, as(r, 0), { kind: 'choose' }, NOW)).toMatchObject({ ok: false, why: 'illegal' });
  });

  it('swap: the activity is replaced with a new token, pending, its adaptations and result gone; the old token finishes nothing', () => {
    let r = run();
    const old = as(r, 1);
    r = ok(
      apply(r, old, { kind: 'swap', slot: { kind: 'review', itemId: 'ex.other', title: 'Other', minutes: 5 }, route: { target: 'drill', itemId: 'ex.other' }, reason: 'You chose this one', token: 'swapped01' }, NOW),
    );
    expect(r.activities[1]).toMatchObject({ token: 'swapped01', state: 'pending', slot: { itemId: 'ex.other' }, reason: 'You chose this one', adaptations: [] });
    r = ok(apply(r, as(r, 1), { kind: 'choose' }, NOW));
    expect(apply(r, old, { kind: 'completed', outcome: 'unknown' }, NOW)).toMatchObject({ ok: false, why: 'stale-token' });
  });

  it('time: only accrued events count, each capped, on the run and on the activity', () => {
    let r = run();
    r = ok(apply(r, as(r, 0), { kind: 'accrue', ms: 12_000 }, NOW));
    r = ok(apply(r, as(r, 0), { kind: 'accrue', ms: 10 * 60_000 }, NOW));
    expect(r.elapsedMs).toBe(72_000);
    expect(r.activities[0]?.elapsedMs).toBe(72_000);
  });

  it('end on purpose: closed as ended, nothing marked failed or done, what was opened back to pending', () => {
    let r = run();
    r = ok(apply(r, as(r, 0), { kind: 'completed', outcome: 'failed' }, NOW));
    r = ok(apply(r, as(r, 0), { kind: 'advance' }, NOW));
    r = ok(apply(r, as(r, 1), { kind: 'opened' }, NOW));
    r = ok(apply(r, { sessionId: r.sessionId, version: r.version, token: '' }, { kind: 'end' }, NOW));
    expect(r.closed?.why).toBe('ended');
    expect(r.endedOnPurpose).toBe(true);
    expect(r.activities.map((a) => a.state)).toEqual(['attempted', 'pending', 'pending', 'pending']);
    expect(r.activities.some((a) => a.state === 'completed')).toBe(false);
  });
});

describe('every write is validated by the session id, the composition version and the activity token', () => {
  it('a late completion from the activity before, after the cursor advanced, is refused and overwrites nothing', () => {
    let r = run();
    const first = as(r, 0);
    r = ok(apply(r, first, { kind: 'completed', outcome: 'unknown' }, NOW));
    const late = apply(r, first, { kind: 'completed', outcome: 'failed' }, NOW);
    expect(late).toMatchObject({ ok: false, why: 'stale-token' });
    expect(late.run).toBe(r);
    expect(r.activities[0]?.result).toEqual({ outcome: 'unknown', attempts: 1 });
  });

  it('another session, another composition, another day, a closed run, no run: each refused, with its reason', () => {
    const r = run();
    expect(apply(r, { ...as(r, 0), sessionId: 'other' }, { kind: 'opened' }, NOW)).toMatchObject({ ok: false, why: 'other-session' });
    expect(apply(r, { ...as(r, 0), version: 'v2' }, { kind: 'opened' }, NOW)).toMatchObject({ ok: false, why: 'other-version' });
    expect(apply(r, as(r, 0), { kind: 'opened' }, TOMORROW)).toMatchObject({ ok: false, why: 'other-day' });
    const ended = ok(apply(r, as(r, 0), { kind: 'end' }, NOW));
    expect(apply(ended, as(ended, 0), { kind: 'opened' }, NOW)).toMatchObject({ ok: false, why: 'closed' });
    expect(apply(null, as(r, 0), { kind: 'opened' }, NOW)).toMatchObject({ ok: false, why: 'none' });
  });

  it('time from a screen whose activity is no longer current is refused (only visible time on the current activity counts)', () => {
    let r = run();
    r = ok(apply(r, as(r, 0), { kind: 'completed', outcome: 'unknown' }, NOW));
    expect(apply(r, as(r, 0), { kind: 'accrue', ms: 5000 }, NOW)).toMatchObject({ ok: false, why: 'stale-token' });
  });
});

describe('the composition version and validation', () => {
  it('the same card is the same version; a recomposed card another', () => {
    const card = [
      { kind: 'technique', minutes: 5, itemId: 'a' },
      { kind: 'new', minutes: 10, itemId: 'b' },
    ];
    expect(compositionVersion(card)).toBe(compositionVersion(card.map((one) => ({ ...one }))));
    expect(compositionVersion(card)).not.toBe(compositionVersion([card[0] as (typeof card)[number], { kind: 'new', minutes: 10, itemId: 'c' }]));
  });

  it('a stored run validates; an old-shaped or corrupt one says why', () => {
    expect(validateRun(run())).toMatchObject({ ok: true });
    const old = validateRun({ ...run(), format: 0 });
    expect(old.ok === false && old.why).toContain('format');
    expect(validateRun({ ...run(), current: 9 })).toMatchObject({ ok: false });
    expect(validateRun({ ...run(), detour: { at: 1 } })).toMatchObject({ ok: false });
    expect(validateRun('a string')).toMatchObject({ ok: false, why: 'not an object' });
    const broken = run();
    (broken.activities[1] as { state: string }).state = 'finished';
    const corrupt = validateRun(broken);
    expect(corrupt.ok === false && corrupt.why).toContain('activity 1');
  });
});

describe('the store: one record under one key, validated, applied in one transaction', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetSessionRunForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    vi.restoreAllMocks();
  });

  it('kept under the settings key and read back as it was', async () => {
    const r = run();
    await startSessionRun(r);
    const db = await openDatabase();
    expect(await db?.get('settings', SESSION_RUN_KEY)).toEqual(r);
    expect(await readSessionRun()).toEqual({ kind: 'run', run: r });
  });

  it('a corrupt or old-shaped record is discarded at read, its reason logged, and reads as none', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const db = await openDatabase();
    await db?.put('settings', { format: 0, day: dayKey(NOW) }, SESSION_RUN_KEY);
    const discarded = await readSessionRun();
    expect(discarded.kind === 'discarded' && discarded.why).toContain('format');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('discarded'));
    expect(await db?.get('settings', SESSION_RUN_KEY)).toBeUndefined();
    expect(await readSessionRun()).toEqual({ kind: 'none' });
  });

  it('two tabs on one session: the first write lands, the second tab’s — made on the view it held — is refused and the record is the first’s', async () => {
    const r = await startSessionRun(run());
    const tabA = as(r, 0);
    const tabB = as(r, 0);
    const first = await applySessionEvent(tabA, { kind: 'completed', outcome: 'unknown' }, NOW);
    const second = await applySessionEvent(tabB, { kind: 'advance' }, NOW);
    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, why: 'stale-token' });
    const stored = await readSessionRun();
    expect(stored.kind === 'run' && stored.run.activities[0]?.state).toBe('completed');
    expect(stored.kind === 'run' && stored.run.current).toBe(1);
  });

  it('another day’s open run is closed as not finished, without judgement; today’s is left alone', async () => {
    await startSessionRun(run({ day: dayKey(new Date(2026, 9, 28, 9)) }));
    const closed = await closeSessionRun('not-finished', NOW);
    expect(closed?.closed?.why).toBe('not-finished');
    expect(closed?.activities.every((a) => a.state === 'pending')).toBe(true);
    await startSessionRun(run());
    expect(await closeSessionRun('not-finished', NOW)).toBeNull();
  });

  it('a recomposed card closes the running session as recomposed; the old session’s writes are refused after', async () => {
    const r = await startSessionRun(run());
    const closed = await closeSessionRun('recomposed', NOW, r.sessionId);
    expect(closed?.closed?.why).toBe('recomposed');
    expect(await applySessionEvent(as(r, 0), { kind: 'opened' }, NOW)).toMatchObject({ ok: false, why: 'closed' });
    // A new session over it is a new record, never a rebuild of the old one.
    const fresh = await startSessionRun(run({ sessionId: 'session00b', version: 'v2' }));
    expect(await applySessionEvent(as(r, 0), { kind: 'opened' }, NOW)).toMatchObject({ ok: false, why: 'other-session' });
    expect(await applySessionEvent(as(fresh, 0), { kind: 'opened' }, NOW)).toMatchObject({ ok: true });
  });

  it('with no database the record lives in this page’s memory, validated the same way', async () => {
    clearFakeIndexedDb();
    const r = await startSessionRun(run());
    const done = await applySessionEvent(as(r, 0), { kind: 'completed', outcome: 'unknown' }, NOW);
    expect(done.ok).toBe(true);
    expect(await readSessionRun()).toMatchObject({ kind: 'run', run: { current: 1 } });
  });
});
