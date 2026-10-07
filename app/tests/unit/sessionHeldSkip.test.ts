// @vitest-environment jsdom
/**
 * The held skip as one lifecycle truth (G90a; the reviewer's required change on G90, `docs/review/responses/
 * 1c75de8d.md`; the brief `docs/prompts/tasks/G90a-*.md`): the record of a piece the learner withdrew after
 * *Start session* says so in its own adaptation kind, and a swap and a pause or put-away are ordered by when
 * each happened.
 *
 * Three answers, one change:
 *
 * - the veto's own kind (`withdrawn`, with the state the learner left the piece in), never `skipped-redundant`,
 *   which stays the kind of "easy success made the practice after it redundant";
 * - the swap records when it was made (`swappedAt`); a pause or put-away from before it is overridden by that
 *   deliberate choice, one from after it vetoes the still-pending activity — the learner's latest word holds;
 * - the stored record reads back as written, and a tapped-back row announces nothing of a skip it no longer is.
 *
 * Layers: the pure state machine (`apply`), `validateRun` (a stored record is data), and the runner's
 * `drawTransition`/`settleHeld` over the real stores (`fake-indexeddb`). Today's row is `todayHeldSkip.test.ts`.
 * The sentences are written out here, not read from `SESSION_TEXT`: they are what the reviewer checks.
 *
 * Times are explicit: a swap's `now` and a project action's `at` are given, so the order the learner acted in is
 * the order under test and never the order two clock reads happened to land in.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';
import {
  apply,
  applySessionEvent,
  newRun,
  readSessionRun,
  resetSessionRunForTest,
  startSessionRun,
  validateRun,
  withdrawnOf,
  type ActivityEntry,
  type Adaptation,
  type Expected,
  type RunEvent,
  type SessionRun,
} from '../../src/data/sessionRun';
import { dayKey } from '../../src/data/progressStore';
import { applyProjectAction, resetProjectsForTest } from '../../src/data/projectStore';
import { drawTransition, sessionHandle, settleHeld, transitionView, type TransitionHost } from '../../src/ui/sessionRunner';

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return { ...original, findItem: (): Promise<unknown> => Promise.resolve(undefined) };
});

let router: Router;
let navigateScore: ReturnType<typeof vi.fn>;

beforeEach(() => {
  useFakeIndexedDb();
  resetSessionRunForTest();
  resetProjectsForTest();
  navigateScore = vi.fn();
  router = { route: { tab: 'today' }, navigate: vi.fn(), navigateScore, navigateDrill: vi.fn() } as unknown as Router;
});
afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

// --- the composition and the clock ---------------------------------------------------------------------

/** Noon today, local: every time below is a second offset from it, so all of them are one day. */
const NOON = (() => {
  const noon = new Date();
  noon.setHours(12, 0, 0, 0);
  return noon;
})();
const at = (seconds: number): Date => new Date(NOON.getTime() + seconds * 1000);
const TOKENS = ['tokena001', 'tokenb002', 'tokenc003', 'tokend004'];

/** Four activities as composed: each carries the claim that chose it. */
function entries(): ActivityEntry[] {
  return [
    { order: 0, token: TOKENS[0] as string, slot: { kind: 'technique', itemId: 'drill.warm', title: 'Warm-up', minutes: 5, claim: { kind: 'asked' } }, route: { target: 'drill', itemId: 'drill.warm', rung: '2.2' }, reason: 'This lesson asks for it — not counted yet' },
    { order: 1, token: TOKENS[1] as string, slot: { kind: 'new', itemId: 'song.new', title: 'New piece', minutes: 7, claim: { kind: 'asked' } }, route: { target: 'score', itemId: 'song.new', rung: '2.2' }, reason: 'This lesson asks for it — not counted yet' },
    { order: 2, token: TOKENS[2] as string, slot: { kind: 'review', itemId: 'song.ode', title: 'Ode to Joy', minutes: 5, claim: { kind: 'piece-retention' } }, route: { target: 'score', itemId: 'song.ode' }, reason: 'Keeping this piece playable — last played on 1 Oct' },
    { order: 3, token: TOKENS[3] as string, slot: { kind: 'repertoire', itemId: 'song.keep', title: 'Another piece', minutes: 7, claim: { kind: 'rung' } }, route: { target: 'score', itemId: 'song.keep' }, reason: 'More music from this lesson' },
  ];
}

const fresh = (): SessionRun => newRun({ day: dayKey(NOON), sessionId: 'skip0001', version: 'v', startedAt: NOON.toISOString(), activities: entries(), outside: [] });
const as = (run: SessionRun, index: number): Expected => ({ sessionId: run.sessionId, version: run.version, token: run.activities[index]?.token ?? '' });
const step = (run: SessionRun, token: string, event: RunEvent, now: Date = at(0)): SessionRun => {
  const result = apply(run, { sessionId: run.sessionId, version: run.version, token }, event, now);
  if (!result.ok) throw new Error(`refused: ${result.why}`);
  return result.run;
};
const SWAP = (title: string, itemId: string, token: string): RunEvent => ({
  kind: 'swap',
  slot: { kind: 'review', itemId, title, minutes: 5 },
  route: { target: 'score', itemId },
  reason: 'You chose this one — from the same lesson',
  token,
});

async function begin(): Promise<SessionRun> {
  return startSessionRun(fresh());
}
async function stored(): Promise<SessionRun> {
  const read = await readSessionRun();
  if (read.kind !== 'run') throw new Error(`no run: ${read.kind}`);
  return read.run;
}
async function onCurrent(event: RunEvent): Promise<SessionRun> {
  const run = await stored();
  const current = run.current === null ? undefined : run.activities[run.current];
  if (!current) throw new Error('no current activity');
  const result = await applySessionEvent({ sessionId: run.sessionId, version: run.version, token: current.token }, event, at(0));
  if (!result.ok) throw new Error(`refused: ${result.why}`);
  return result.run;
}
const finishCurrent = (): Promise<SessionRun> => onCurrent({ kind: 'completed', outcome: 'unknown' });

/** The learner swaps the activity the token names, at a given moment (Today's swap sheet). */
async function swapIn(token: string, itemId: string, title: string, newToken: string, when: Date): Promise<void> {
  const run = await stored();
  const result = await applySessionEvent({ sessionId: run.sessionId, version: run.version, token }, SWAP(title, itemId, newToken), when);
  if (!result.ok) throw new Error(`refused: ${result.why}`);
}

/** The learner's word on a piece's sheet, at a given moment: *Learn this*, then *Pause* or *Put it away*. */
async function sayOnSheet(itemId: string, last: 'pause' | 'retire', when: Date): Promise<void> {
  await applyProjectAction({ itemId, material: undefined }, 'learn', { at: new Date(when.getTime() - 500) });
  await applyProjectAction({ itemId, material: undefined }, last, { at: when });
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
      button: (label, onClick, id) => {
        const made = document.createElement('button');
        made.id = id;
        made.textContent = label;
        made.addEventListener('click', onClick);
        return made;
      },
      tryAgain: () => undefined,
    },
  };
}
const notes = (into: HTMLElement): string[] => [...into.querySelectorAll('.session-next__note')].map((p) => p.textContent ?? '');

const WORD = {
  paused: { held: 'paused', say: 'you paused it', action: 'pause' },
  retired: { held: 'retired', say: 'you put it away', action: 'retire' },
} as const;
const BOTH = [WORD.paused, WORD.retired] as const;

// --- its own kind --------------------------------------------------------------------------------------

describe('the lifecycle veto has its own adaptation kind', () => {
  for (const word of BOTH) {
    it(`a piece the learner ${word.held === 'paused' ? 'paused' : 'put away'} is recorded as withdrawn, with the state it was left in, never as skipped-redundant`, () => {
      const before = fresh();
      const after = step(before, TOKENS[0] as string, { kind: 'withhold', held: word.held, since: at(5).toISOString() });
      expect(after.activities[0]).toMatchObject({ state: 'skipped', adaptations: [{ kind: 'withdrawn', held: word.held, why: `Warm-up is skipped — ${word.say}` }] });
      expect(after.activities[0]?.adaptations.some((one) => one.kind === 'skipped-redundant')).toBe(false);
      expect(after.current).toBe(1);
    });
  }

  it('the easy-success skip is still skipped-redundant, said as it always was, with no state of a project on it', () => {
    const entry = entries();
    entry[0] = { ...(entry[0] as ActivityEntry), slot: { kind: 'technique', itemId: 'drill.warm', title: 'Warm-up', minutes: 5, claim: { kind: 'ready', demand: 'rhythm.eighths' } } };
    entry[1] = { ...(entry[1] as ActivityEntry), slot: { kind: 'review', itemId: 'drill.eighths', title: 'Eighths drill', minutes: 5, claim: { kind: 'demand', demand: 'rhythm.eighths' } } };
    const run = newRun({ day: dayKey(NOON), sessionId: 'easy0001', version: 'v', startedAt: NOON.toISOString(), activities: entry, outside: [] });
    const after = step(run, TOKENS[0] as string, { kind: 'completed', outcome: 'passed-full' });
    expect(after.activities[1]).toMatchObject({ state: 'skipped', adaptations: [{ kind: 'skipped-redundant', why: 'Easier than expected — Eighths drill is skipped' }] });
    expect(after.activities[1]?.adaptations[0]).not.toHaveProperty('held');
  });

  it('the runner writes it: at the piece’s turn the stored record holds the kind and the state, and says what the transition said', async () => {
    await begin();
    await finishCurrent();
    await sayOnSheet('song.ode', 'retire', at(60));
    await finishCurrent();
    const { into, options } = host(TOKENS[1] as string);
    expect(await drawTransition(into, options)).toBe('next');
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you put it away']);
    const after = await stored();
    expect(after.activities[2]?.adaptations).toEqual([{ kind: 'withdrawn', held: 'retired', why: 'Ode to Joy is skipped — you put it away' }]);
  });

  it('a transition reads the withdrawn kind as it read the skip: it says it only while the row is still skipped', () => {
    let run = fresh();
    run = step(run, TOKENS[0] as string, { kind: 'completed', outcome: 'unknown' });
    run = step(run, TOKENS[2] as string, { kind: 'withhold', held: 'paused', since: at(5).toISOString() });
    run = step(run, TOKENS[1] as string, { kind: 'completed', outcome: 'unknown' });
    expect(transitionView(run, TOKENS[1] as string, at(0))).toMatchObject({ kind: 'next', from: 'completed', notes: ['Ode to Joy is skipped — you paused it'] });
  });
});

describe('withdrawnOf: the one reading of why a skipped row was withdrawn, which Today’s row says', () => {
  it('names the state only for a skipped activity whose record says it was withdrawn; the latest word where there are two; never another kind of skip', () => {
    const withdrawn = (held: 'paused' | 'retired'): Adaptation => ({ kind: 'withdrawn', held, why: 'Ode to Joy is skipped' });
    const easier: Adaptation = { kind: 'skipped-redundant', why: 'Easier than expected — Ode to Joy is skipped' };
    expect(withdrawnOf({ state: 'skipped', adaptations: [withdrawn('paused')] })).toBe('paused');
    expect(withdrawnOf({ state: 'skipped', adaptations: [withdrawn('retired')] })).toBe('retired');
    expect(withdrawnOf({ state: 'skipped', adaptations: [withdrawn('paused'), withdrawn('retired')] })).toBe('retired');
    expect(withdrawnOf({ state: 'skipped', adaptations: [easier, withdrawn('paused')] })).toBe('paused');
    // Not withdrawn: any other skip, and a row that is no longer a skip (the learner tapped it back, or is in it).
    expect(withdrawnOf({ state: 'skipped', adaptations: [easier] })).toBeUndefined();
    expect(withdrawnOf({ state: 'skipped', adaptations: [] })).toBeUndefined();
    for (const state of ['pending', 'active', 'attempted', 'completed'] as const) {
      expect(withdrawnOf({ state, adaptations: [withdrawn('paused')] }), state).toBeUndefined();
    }
  });
});

// --- reload and readback ---------------------------------------------------------------------------------

describe('the record reads back as it was written', () => {
  it('after a reload (the page’s memory gone, the store kept) the withdrawn row and its state are the same, and drawing again writes nothing', async () => {
    await begin();
    await finishCurrent();
    await sayOnSheet('song.ode', 'pause', at(60));
    await finishCurrent();
    const first = host(TOKENS[1] as string);
    await drawTransition(first.into, first.options);
    const written = await stored();
    resetSessionRunForTest();
    const read = await readSessionRun();
    expect(read.kind, 'a record with the new kind was discarded as malformed on the way back').toBe('run');
    expect(read.kind === 'run' ? read.run : null).toEqual(written);
    const second = host(TOKENS[1] as string);
    await drawTransition(second.into, second.options);
    expect(notes(second.into)).toEqual(['Ode to Joy is skipped — you paused it']);
    expect(await stored(), 'drawing the same transition again wrote').toEqual(written);
  });

  it('a swapped activity keeps the moment it was swapped through the store', async () => {
    await begin();
    await swapIn(TOKENS[2] as string, 'song.chosen', 'Chosen piece', 'tokenx009', at(30));
    resetSessionRunForTest();
    expect((await stored()).activities[2]?.swappedAt).toBe(at(30).toISOString());
  });

  it('a stored record is data: the new kind needs its state, the swap moment must be text, and an older record with neither still reads', () => {
    const good = (): SessionRun => {
      let run = fresh();
      run = step(run, TOKENS[0] as string, { kind: 'withhold', held: 'paused', since: at(5).toISOString() });
      return step(run, TOKENS[1] as string, SWAP('Chosen piece', 'song.chosen', 'tokenx009'), at(30));
    };
    const withActivity = (index: number, over: Record<string, unknown>): unknown => {
      const run = structuredClone(good()) as unknown as { activities: Record<string, unknown>[] };
      run.activities[index] = { ...(run.activities[index] as Record<string, unknown>), ...over };
      return run;
    };
    expect(validateRun(good()).ok).toBe(true);
    // The withdrawn row: its adaptation says which state, or the record is discarded.
    const word = (held: unknown): unknown => withActivity(0, { adaptations: [{ kind: 'withdrawn', why: 'Warm-up is skipped — you paused it', held }] });
    expect(validateRun(word('paused')).ok).toBe(true);
    expect(validateRun(word('retired')).ok).toBe(true);
    expect(validateRun(word(undefined)).ok, 'a withdrawn adaptation without its state').toBe(false);
    expect(validateRun(word('saved')).ok, 'a withdrawn adaptation with a state that is no withdrawal').toBe(false);
    // The swapped row: its moment is text.
    expect(validateRun(withActivity(1, { swappedAt: 12 })).ok, 'a swap moment that is not text').toBe(false);
    // An older record (G90's, before the swap moment) has neither and still reads.
    const older = structuredClone(fresh()) as unknown as { activities: Record<string, unknown>[] };
    expect(validateRun(older).ok).toBe(true);
  });
});

// --- swap and lifecycle intent, ordered ----------------------------------------------------------------

describe('a swap records when it was made', () => {
  it('the activity carries the moment of the swap, the swap’s own clock, and a second swap replaces it and the reasons of the first', () => {
    let run = fresh();
    run = step(run, TOKENS[2] as string, { kind: 'withhold', held: 'paused', since: at(5).toISOString() });
    expect(run.activities[2]?.adaptations).toHaveLength(1);
    run = step(run, TOKENS[2] as string, SWAP('Chosen piece', 'song.chosen', 'tokenx009'), at(30));
    expect(run.activities[2]).toMatchObject({ state: 'pending', swappedAt: at(30).toISOString(), adaptations: [] });
    run = step(run, 'tokenx009', SWAP('Another choice', 'song.other', 'tokeny010'), at(90));
    expect(run.activities[2]?.swappedAt).toBe(at(90).toISOString());
  });

  it('an activity the composition chose has no swap moment', () => {
    expect(fresh().activities.map((one) => one.swappedAt)).toEqual([undefined, undefined, undefined, undefined]);
  });
});

describe('the pure state machine orders a swap and a withdrawal', () => {
  const swapped = (): SessionRun => step(fresh(), TOKENS[2] as string, SWAP('Chosen piece', 'song.chosen', 'tokenx009'), at(100));

  for (const word of BOTH) {
    it(`${word.held}: after the swap it withdraws the activity; before the swap, and at the same moment, it does not`, () => {
      const run = swapped();
      const withhold = (since: Date): RunEvent => ({ kind: 'withhold', held: word.held, since: since.toISOString() });
      const after = step(run, 'tokenx009', withhold(at(101)));
      expect(after.activities[2]).toMatchObject({ state: 'skipped', adaptations: [{ kind: 'withdrawn', held: word.held, why: `Chosen piece is skipped — ${word.say}` }] });
      for (const since of [at(99), at(100)]) {
        expect(apply(run, as(run, 2), withhold(since), at(0)), `since ${since.toISOString()}`).toMatchObject({ ok: false, why: 'illegal' });
      }
      expect(run.activities[2]?.state).toBe('pending');
    });
  }

  it('an activity the composition chose is withdrawn by a word from any time: there is no swap to order it against', () => {
    const run = fresh();
    for (const since of [at(-86_400), at(0), at(500)]) {
      const after = step(run, TOKENS[2] as string, { kind: 'withhold', held: 'paused', since: since.toISOString() });
      expect(after.activities[2]?.state, since.toISOString()).toBe('skipped');
    }
  });

  it('an activity underway is never interrupted, swapped or not, whatever the order', () => {
    for (const underway of [{ kind: 'opened' }, { kind: 'attempted' }] as RunEvent[]) {
      let run = swapped();
      run = step(run, TOKENS[0] as string, { kind: 'completed', outcome: 'unknown' });
      run = step(run, TOKENS[1] as string, { kind: 'completed', outcome: 'unknown' });
      run = step(run, 'tokenx009', underway);
      expect(apply(run, { ...as(run, 2), token: 'tokenx009' }, { kind: 'withhold', held: 'paused', since: at(500).toISOString() }, at(0)), JSON.stringify(underway)).toMatchObject({ ok: false, why: 'illegal' });
    }
  });

  it('a record from before the swap moment was kept (a swapped activity with no moment) is never withdrawn, as it never was', () => {
    const run = fresh();
    const older = structuredClone(run);
    const target = older.activities[2];
    if (!target) throw new Error('no activity');
    delete target.slot.claim;
    expect(apply(older, as(older, 2), { kind: 'withhold', held: 'paused', since: at(500).toISOString() }, at(0))).toMatchObject({ ok: false, why: 'illegal' });
  });
});

describe('a tapped-back row announces nothing of a skip it no longer is', () => {
  it('the learner taps the withdrawn row and then skips it themselves: it is their skip, and no word of a pause is left on it', () => {
    let run = fresh();
    run = step(run, TOKENS[0] as string, { kind: 'completed', outcome: 'unknown' });
    run = step(run, TOKENS[2] as string, { kind: 'withhold', held: 'paused', since: at(5).toISOString() });
    expect(run.activities[2]?.adaptations.map((one) => one.kind)).toEqual(['withdrawn']);
    run = step(run, TOKENS[2] as string, { kind: 'choose' });
    expect(run.activities[2]).toMatchObject({ state: 'pending', adaptations: [] });
    run = step(run, TOKENS[2] as string, { kind: 'opened' });
    run = step(run, TOKENS[2] as string, { kind: 'advance' });
    expect(run.activities[2]).toMatchObject({ state: 'skipped', adaptations: [] });
    // The transition after the one before says nothing of a pause the learner is no longer under.
    run = step(run, TOKENS[1] as string, { kind: 'choose' });
    expect(transitionView(run, TOKENS[1] as string, at(0))).toMatchObject({ kind: 'next', notes: [] });
  });

  it('tapping a row that was skipped for another reason leaves what the runner said of it', () => {
    const entry = entries();
    entry[0] = { ...(entry[0] as ActivityEntry), slot: { kind: 'technique', itemId: 'drill.warm', title: 'Warm-up', minutes: 5, claim: { kind: 'ready', demand: 'rhythm.eighths' } } };
    entry[1] = { ...(entry[1] as ActivityEntry), slot: { kind: 'review', itemId: 'drill.eighths', title: 'Eighths drill', minutes: 5, claim: { kind: 'demand', demand: 'rhythm.eighths' } } };
    let run = newRun({ day: dayKey(NOON), sessionId: 'easy0002', version: 'v', startedAt: NOON.toISOString(), activities: entry, outside: [] });
    run = step(run, TOKENS[0] as string, { kind: 'completed', outcome: 'passed-full' });
    run = step(run, TOKENS[1] as string, { kind: 'choose' });
    expect(run.activities[1]?.adaptations.map((one) => one.kind)).toEqual(['skipped-redundant']);
  });
});

// --- the transition, both orders, over the real stores ----------------------------------------------------

describe('at its turn, a swapped-in piece is withdrawn by a word after the swap and kept by a word before it', () => {
  /** A session carried to the swapped piece's turn; the learner's moves are made by the caller. */
  async function swappedThenFinished(moves: () => Promise<void>): Promise<{ into: HTMLElement; options: TransitionHost }> {
    await begin();
    await finishCurrent();
    await moves();
    await finishCurrent();
    return host(TOKENS[1] as string);
  }

  for (const word of BOTH) {
    it(`${word.held}, then swapped in: the learner chose it knowing, and it is offered`, async () => {
      const { into, options } = await swappedThenFinished(async () => {
        await sayOnSheet('song.chosen', word.action, at(10));
        await swapIn(TOKENS[2] as string, 'song.chosen', 'Chosen piece', 'tokenx009', at(20));
      });
      expect(await drawTransition(into, options)).toBe('next');
      expect(into.dataset.sessionNextItem).toBe('song.chosen');
      expect(notes(into)).toEqual([]);
      const run = await stored();
      expect(run.activities[2]).toMatchObject({ state: 'pending', adaptations: [] });
      expect(run.current).toBe(2);
    });

    it(`swapped in, then ${word.held}: the later word vetoes the pending activity at its turn, said, and the one after is offered`, async () => {
      const { into, options } = await swappedThenFinished(async () => {
        await swapIn(TOKENS[2] as string, 'song.chosen', 'Chosen piece', 'tokenx009', at(10));
        await sayOnSheet('song.chosen', word.action, at(20));
      });
      expect(await drawTransition(into, options)).toBe('next');
      expect(into.dataset.sessionNextItem, 'the piece the learner withdrew after choosing it was offered').toBe('song.keep');
      expect(notes(into)).toEqual([`Chosen piece is skipped — ${word.say}`]);
      const run = await stored();
      expect(run.activities[2]).toMatchObject({ state: 'skipped', adaptations: [{ kind: 'withdrawn', held: word.held }] });
      expect(run.current).toBe(3);
    });
  }

  it('the newest word wins when there are several: swapped, paused, then swapped again, the swap is the later word and the piece is offered', async () => {
    const { into, options } = await swappedThenFinished(async () => {
      await swapIn(TOKENS[2] as string, 'song.chosen', 'Chosen piece', 'tokenx009', at(10));
      await sayOnSheet('song.chosen', 'pause', at(20));
      await swapIn('tokenx009', 'song.chosen', 'Chosen piece', 'tokeny010', at(30));
    });
    await drawTransition(into, options);
    expect(into.dataset.sessionNextItem).toBe('song.chosen');
    expect(notes(into)).toEqual([]);
  });

  it('swapped, paused, then brought back: the word at its turn is that it is wanted, and the piece is offered', async () => {
    const { into, options } = await swappedThenFinished(async () => {
      await swapIn(TOKENS[2] as string, 'song.chosen', 'Chosen piece', 'tokenx009', at(10));
      await sayOnSheet('song.chosen', 'pause', at(20));
      await applyProjectAction({ itemId: 'song.chosen', material: undefined }, 'bring-back', { at: at(30) });
    });
    await drawTransition(into, options);
    expect(into.dataset.sessionNextItem).toBe('song.chosen');
    expect(notes(into)).toEqual([]);
  });

  it('the activity underway is not interrupted by a word after the swap; the next one at its turn is', async () => {
    await begin();
    await finishCurrent();
    await swapIn(TOKENS[2] as string, 'song.chosen', 'Chosen piece', 'tokenx009', at(10));
    await finishCurrent();
    // The swapped piece is current and its screen is up: the learner is in it.
    await onCurrent({ kind: 'opened' });
    await sayOnSheet('song.chosen', 'pause', at(20));
    const first = host(TOKENS[1] as string);
    await drawTransition(first.into, first.options);
    expect(first.into.dataset.sessionNextItem, 'the piece the learner is in was taken away').toBe('song.chosen');
    expect(notes(first.into)).toEqual([]);
    expect((await stored()).activities[2]?.state).toBe('active');
  });

  it('settleHeld says the same: what it steps past is the swapped piece when the word is the later one, and nothing when it is the earlier', async () => {
    await begin();
    await finishCurrent();
    await swapIn(TOKENS[2] as string, 'song.chosen', 'Chosen piece', 'tokenx009', at(10));
    await sayOnSheet('song.chosen', 'pause', at(20));
    await finishCurrent();
    const settled = await settleHeld(await stored());
    expect(settled.withheld.map((one) => one.slot.itemId)).toEqual(['song.chosen']);
    expect(navigateScore).not.toHaveBeenCalled();
  });
});
