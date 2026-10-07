// @vitest-environment jsdom
/**
 * The transition a finished activity's closing action becomes (X1 item 2; Part 18: "finishing activity 1
 * offers activity 2 with its reason"; "the learner can skip or change it"; "a changed recommendation says
 * why"; "on the phone continuation needs no trip through Today").
 *
 * `drawTransition` over the real store (`fake-indexeddb`) and a recording router:
 *
 * - after a completed activity: "Next: <title>, N min — <the composition's own words>", the time from the
 *   visible-time clock, *Start* (the next activity opened through the router with its token, never via Today)
 *   and *Skip or change* (the next one skipped by the learner, back to Today);
 * - easy success: the skipped practice said; a repurposed first contact: the reason said;
 * - a measured failure: "Still unstable, so we're not moving on", *Try again* (the host's restart) and *Move on
 *   anyway* (moved on, nothing failed, the next offered);
 * - a screen whose activity is no longer current (Again after the completion, a second tab) shows where the
 *   session really is; a write the runner refuses reloads the view and says so;
 * - after the last: *Done*, back to Today; no session (another's token): nothing drawn, the host keeps Done.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';
import { applySessionEvent, newRun, readSessionRun, resetSessionRunForTest, startSessionRun, type SessionRun } from '../../src/data/sessionRun';
import { dayKey } from '../../src/data/progressStore';
import { drawTransition, sessionHandle, type TransitionHost } from '../../src/ui/sessionRunner';
import { SESSION_TEXT } from '../../src/ui/help';

let router: Router;
let navigateScore: ReturnType<typeof vi.fn>;
let navigateDrill: ReturnType<typeof vi.fn>;
let navigate: ReturnType<typeof vi.fn>;
let tryAgain: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  useFakeIndexedDb();
  resetSessionRunForTest();
  navigateScore = vi.fn();
  navigateDrill = vi.fn();
  navigate = vi.fn();
  tryAgain = vi.fn<() => void>();
  router = { route: { tab: 'today' }, navigate, navigateScore, navigateDrill } as unknown as Router;
});
afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

const WORDS = ['This lesson asks for it — not counted yet', 'Has eighth notes, which this lesson asks for', 'More music from this lesson'];

async function begin(firstContact = false): Promise<SessionRun> {
  return startSessionRun(
    newRun({
      day: dayKey(new Date()),
      sessionId: 'transit01',
      version: 'v',
      startedAt: new Date().toISOString(),
      activities: [
        { order: 0, token: 'transa001', slot: { kind: 'technique', itemId: 'ex.warm', title: 'Warm-up piece', minutes: 5, claim: { kind: 'ready', demand: 'rhythm.eighths' } }, route: { target: 'score', itemId: 'ex.warm', rung: '1.2' }, reason: WORDS[0] as string, ...(firstContact ? { contact: { assumed: 'first-contact' as const } } : {}) },
        { order: 1, token: 'transb002', slot: { kind: 'review', itemId: 'drill.eighths', title: 'Eighths drill', minutes: 5, claim: { kind: 'demand', demand: 'rhythm.eighths' } }, route: { target: 'drill', itemId: 'drill.eighths', rung: '1.2' }, reason: WORDS[1] as string },
        { order: 2, token: 'transc003', slot: { kind: 'repertoire', itemId: 'song.minuet', title: 'Minuet excerpt', minutes: 7 }, route: { target: 'score', itemId: 'song.minuet' }, reason: WORDS[2] as string },
      ],
      outside: [],
    }),
  );
}

async function event(run: SessionRun, index: number, e: Parameters<typeof applySessionEvent>[1]): Promise<SessionRun> {
  const result = await applySessionEvent({ sessionId: run.sessionId, version: run.version, token: run.activities[index]?.token ?? '' }, e);
  if (!result.ok) throw new Error(result.why);
  return result.run;
}

function host(token: string): { into: HTMLElement; options: TransitionHost } {
  const into = document.createElement('div');
  document.body.append(into);
  const handle = sessionHandle(token);
  if (!handle) throw new Error('no handle');
  return {
    into,
    options: {
      router,
      handle,
      button: (label, onClick, id, primary) => {
        const made = document.createElement('button');
        made.id = id;
        made.textContent = label;
        made.dataset.primary = String(primary);
        made.addEventListener('click', onClick);
        return made;
      },
      tryAgain: () => {
        tryAgain();
      },
    },
  };
}

const text = (into: HTMLElement): string[] => [...into.querySelectorAll('p')].map((p) => p.textContent ?? '');
const click = (into: HTMLElement, id: string): void => {
  into.querySelector<HTMLButtonElement>(`#${id}`)?.click();
};

describe('after a completed activity', () => {
  it('Next with the composition’s own words and the clock’s time; Start opens it through the router with its token', async () => {
    let run = await begin();
    // Four flushes of a minute each: one flush adds at most a minute (`MAX_ACCRUAL_MS`).
    for (let i = 0; i < 4; i += 1) run = await event(run, 0, { kind: 'accrue', ms: 60_000 });
    await event(run, 0, { kind: 'completed', outcome: 'unknown' });
    const { into, options } = host('transa001');
    expect(await drawTransition(into, options)).toBe('next');
    expect(text(into)).toEqual([SESSION_TEXT.nextLine('Eighths drill', 5, WORDS[1] as string), SESSION_TEXT.timeLine(4, 17)]);
    expect(into.dataset.sessionNextItem).toBe('drill.eighths');
    expect(into.querySelector('#session-start-next')?.getAttribute('data-primary')).toBe('true');
    click(into, 'session-start-next');
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledWith('drill.eighths', { rung: '1.2', session: 'transb002' }));
    expect(navigate).not.toHaveBeenCalledWith('today');
  });

  it('Skip or change: the offered activity is the learner’s skip, never completed, and Today shows the one after', async () => {
    const run = await begin();
    await event(run, 0, { kind: 'completed', outcome: 'unknown' });
    const { into, options } = host('transa001');
    await drawTransition(into, options);
    click(into, 'session-skip');
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('today'));
    const read = await readSessionRun();
    const stored = read.kind === 'run' ? read.run : null;
    expect(stored?.activities[1]).toMatchObject({ state: 'skipped', adaptations: [] });
    expect(stored?.current).toBe(2);
  });

  it('easy success says what it skipped, then offers the piece', async () => {
    const run = await begin();
    await event(run, 0, { kind: 'completed', outcome: 'passed-full' });
    const { into, options } = host('transa001');
    await drawTransition(into, options);
    expect(text(into)).toEqual([SESSION_TEXT.easier('Eighths drill'), SESSION_TEXT.nextLine('Minuet excerpt', 7, WORDS[2] as string), SESSION_TEXT.timeLine(0, 17)]);
  });

  it('a repurposed first contact says why', async () => {
    let run = await begin(true);
    run = await event(run, 0, { kind: 'opened' });
    run = await event(run, 0, { kind: 'recheck', verdict: 'invalidated', why: SESSION_TEXT.repurposed('heard') });
    await event(run, 0, { kind: 'completed', outcome: 'unknown' });
    const { into, options } = host('transa001');
    await drawTransition(into, options);
    expect(text(into)[0]).toBe(SESSION_TEXT.repurposed('heard'));
  });
});

describe('a measured failure keeps the learner here', () => {
  it('Still unstable, Try again (the host’s restart), Move on anyway (moved on, nothing failed, the next offered)', async () => {
    const run = await begin();
    await event(run, 0, { kind: 'completed', outcome: 'failed' });
    const { into, options } = host('transa001');
    expect(await drawTransition(into, options)).toBe('kept-here');
    expect(text(into)[0]).toBe(SESSION_TEXT.keptHere);
    click(into, 'session-try-again');
    expect(tryAgain).toHaveBeenCalledTimes(1);
    click(into, 'session-move-on');
    await vi.waitFor(() => expect(into.querySelector('#session-start-next')).not.toBeNull());
    const read = await readSessionRun();
    expect(read.kind === 'run' && read.run.activities[0]?.state).toBe('attempted');
    expect(text(into)).toContain(SESSION_TEXT.nextLine('Eighths drill', 5, WORDS[1] as string));
  });
});

describe('where the session really is', () => {
  it('a screen whose activity is no longer current (Again after the completion, a second tab) offers the current one', async () => {
    let run = await begin();
    run = await event(run, 0, { kind: 'completed', outcome: 'unknown' });
    await event(run, 1, { kind: 'completed', outcome: 'unknown' });
    const { into, options } = host('transa001');
    await drawTransition(into, options);
    expect(text(into)[0]).toBe(SESSION_TEXT.nextLine('Minuet excerpt', 7, WORDS[2] as string));
  });

  it('a write refused because another tab moved the session on reloads the view and says so', async () => {
    let run = await begin();
    run = await event(run, 0, { kind: 'completed', outcome: 'failed' });
    const { into, options } = host('transa001');
    await drawTransition(into, options);
    // Another tab moves on first.
    await event(run, 0, { kind: 'advance' });
    click(into, 'session-move-on');
    await vi.waitFor(() => expect(into.querySelector('[data-session-refused="true"]')?.textContent).toBe(SESSION_TEXT.moved));
    expect(text(into)).toContain(SESSION_TEXT.nextLine('Eighths drill', 5, WORDS[1] as string));
  });

  it('a screen moved on from before its summary (a stopped drill, a run left unanswered): Start moves on and opens the next', async () => {
    await begin();
    const { into, options } = host('transa001');
    expect(await drawTransition(into, options)).toBe('next');
    click(into, 'session-start-next');
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledWith('drill.eighths', { rung: '1.2', session: 'transb002' }));
    const read = await readSessionRun();
    expect(read.kind === 'run' && read.run.activities[0]?.state).toBe('skipped');
  });

  it('after the last: Done, back to Today; another session’s token: nothing drawn', async () => {
    let run = await begin();
    for (let i = 0; i < 3; i += 1) run = await event(run, i, { kind: 'completed', outcome: 'unknown' });
    const { into, options } = host('transc003');
    expect(await drawTransition(into, options)).toBe('finished');
    expect(text(into)[0]).toBe(SESSION_TEXT.lastOne);
    click(into, 'session-done');
    expect(navigate).toHaveBeenCalledWith('today');
    const other = host('notours01');
    expect(await drawTransition(other.into, other.options)).toBe('none');
    expect(other.into.hidden).toBe(true);
  });
});
