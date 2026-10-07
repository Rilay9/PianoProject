// @vitest-environment jsdom
/**
 * A pause or retire after *Start session* is a live veto at the activity boundary (G90; the reviewer's ruling,
 * `docs/review/responses/d59f2ef8.md` question 2; the brief `docs/prompts/tasks/G90-*.md`).
 *
 * X1's snapshot stays: the composition is frozen at *Start session*, and a project's state is not read when
 * the card is drawn. What the learner last said about a piece holds at the next point where the session acts
 * on it — when the runner moves to a pending activity of the composer's choosing and offers it. Then, if its
 * piece is paused or put away *now*, the activity is skipped with the project-state reason, the session goes
 * on to the one after, and nothing is recomposed. An activity already underway is not interrupted, and a piece
 * the learner chose themselves (a swap) or taps open is theirs, whatever the project says.
 *
 * Three layers, over the real stores (`fake-indexeddb`):
 *
 * - the pure state machine's `withhold` event: what it moves, and the three refusals that keep it narrow;
 * - the runner's transition (`drawTransition`) and its one `settleHeld`, over the stored run and the stored
 *   projects, with the catalogue's `findItem` the only thing replaced;
 * - the session's one reading of a project (`heldStateOf`), which the composer and the runner share.
 *
 * The learner-facing sentences are written out here, not read from `SESSION_TEXT`: they are the item the
 * reviewer checks.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';
import type { Identity } from '../../src/review/record';
import {
  apply,
  applySessionEvent,
  newRun,
  readSessionRun,
  resetSessionRunForTest,
  startSessionRun,
  type ActivityEntry,
  type Expected,
  type RunActivity,
  type RunEvent,
  type SessionRun,
} from '../../src/data/sessionRun';
import { dayKey } from '../../src/data/progressStore';
import { openDatabase, type ProjectRow } from '../../src/data/db';
import { PROJECT_STATES, applyProjectAction, resetProjectsForTest } from '../../src/data/projectStore';
import { heldStateOf } from '../../src/curriculum/session';
import { drawTransition, sessionHandle, settleHeld, transitionView, type TransitionHost } from '../../src/ui/sessionRunner';

const { catalog, projectRead } = vi.hoisted(() => ({
  catalog: { items: new Map<string, unknown>(), down: false },
  projectRead: { fails: false },
}));

// Only the catalogue lookup is replaced: the runner asks it for a piece's material.
vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: (id: string): Promise<unknown> => (catalog.down ? Promise.reject(new Error('offline')) : Promise.resolve(catalog.items.get(id))),
  };
});

// And the store read can be made to fail: a store that cannot be read gives no projects, as Today's does.
vi.mock('../../src/data/projectStore', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/projectStore')>();
  return { ...original, allProjects: (): Promise<ProjectRow[]> => (projectRead.fails ? Promise.reject(new Error('unreadable')) : original.allProjects()) };
});

let router: Router;
let navigateScore: ReturnType<typeof vi.fn>;
let navigateDrill: ReturnType<typeof vi.fn>;
let navigate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  useFakeIndexedDb();
  resetSessionRunForTest();
  resetProjectsForTest();
  catalog.items = new Map();
  catalog.down = false;
  projectRead.fails = false;
  navigateScore = vi.fn();
  navigateDrill = vi.fn();
  navigate = vi.fn();
  router = { route: { tab: 'today' }, navigate, navigateScore, navigateDrill } as unknown as Router;
});
afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

// --- the composition ----------------------------------------------------------------------------------

const NOW = new Date();
const TOKENS = ['tokena001', 'tokenb002', 'tokenc003', 'tokend004', 'tokene005'];

/** The five activities of a card as composed: every one chosen by the composition, so each carries its claim. */
function entries(over: Partial<Record<number, Partial<ActivityEntry>>> = {}): ActivityEntry[] {
  const base: ActivityEntry[] = [
    { order: 0, token: TOKENS[0] as string, slot: { kind: 'technique', itemId: 'drill.warm', title: 'Warm-up', minutes: 5, claim: { kind: 'asked' } }, route: { target: 'drill', itemId: 'drill.warm', rung: '2.2' }, reason: 'This lesson asks for it — not counted yet' },
    { order: 1, token: TOKENS[1] as string, slot: { kind: 'new', itemId: 'song.new', title: 'New piece', minutes: 7, claim: { kind: 'asked' } }, route: { target: 'score', itemId: 'song.new', rung: '2.2' }, reason: 'This lesson asks for it — not counted yet' },
    { order: 2, token: TOKENS[2] as string, slot: { kind: 'review', itemId: 'song.ode', title: 'Ode to Joy', minutes: 5, claim: { kind: 'piece-retention' } }, route: { target: 'score', itemId: 'song.ode' }, reason: 'Keeping this piece playable — last played on 1 Oct' },
    { order: 3, token: TOKENS[3] as string, slot: { kind: 'repertoire', itemId: 'song.keep', title: 'Another piece', minutes: 7, claim: { kind: 'rung' } }, route: { target: 'score', itemId: 'song.keep' }, reason: 'More music from this lesson' },
    { order: 4, token: TOKENS[4] as string, slot: { kind: 'jam', itemId: 'song.last', title: 'Last piece', minutes: 6, claim: { kind: 'rung' } }, route: { target: 'score', itemId: 'song.last' }, reason: 'More music from this lesson' },
  ];
  return base.map((one, at) => ({ ...one, ...(over[at] ?? {}) }));
}

async function begin(activities: ActivityEntry[] = entries().slice(0, 4)): Promise<SessionRun> {
  return startSessionRun(
    newRun({ day: dayKey(NOW), sessionId: 'held0001', version: 'v', startedAt: NOW.toISOString(), activities, outside: [{ order: 9, kind: 'free', title: 'Free play', minutes: 4, words: 'Play anything you like' }] }),
  );
}

async function stored(): Promise<SessionRun> {
  const read = await readSessionRun();
  if (read.kind !== 'run') throw new Error(`no run: ${read.kind}`);
  return read.run;
}

/** An event applied to the stored run's current activity, as the screen that owns it reports it. */
async function onCurrent(event: RunEvent): Promise<SessionRun> {
  const run = await stored();
  const current = run.current === null ? undefined : run.activities[run.current];
  if (!current) throw new Error('no current activity');
  const result = await applySessionEvent({ sessionId: run.sessionId, version: run.version, token: current.token }, event);
  if (!result.ok) throw new Error(`refused: ${result.why}`);
  return result.run;
}

/** The activity run and finished the way a screen reports it (no measurement: nothing here is evidence). */
async function finishCurrent(): Promise<SessionRun> {
  return onCurrent({ kind: 'completed', outcome: 'unknown' });
}

/** What the learner does on the piece's sheet: *Learn this*, then *Pause* or *Put it away*. */
async function sayOnSheet(itemId: string, last: 'pause' | 'retire', material?: Identity): Promise<void> {
  await applyProjectAction({ itemId, material }, 'learn');
  await applyProjectAction({ itemId, material }, last);
}

/** What the composition fixed: everything about an activity but what the runner did with it. */
const composed = (run: SessionRun): unknown =>
  run.activities.map((one) => ({ index: one.index, order: one.order, token: one.token, slot: one.slot, route: one.route, reason: one.reason }));

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
      tryAgain: () => undefined,
    },
  };
}

const lines = (into: HTMLElement): string[] => [...into.querySelectorAll('p')].map((p) => p.textContent ?? '');
const notes = (into: HTMLElement): string[] => [...into.querySelectorAll('.session-next__note')].map((p) => p.textContent ?? '');
const click = (into: HTMLElement, id: string): void => {
  into.querySelector<HTMLButtonElement>(`#${id}`)?.click();
};

// --- the pure state machine ---------------------------------------------------------------------------

describe('the withhold event, in the pure state machine', () => {
  const NOW_AT = new Date(2026, 9, 29, 18);
  const fresh = (): SessionRun =>
    newRun({ day: dayKey(NOW_AT), sessionId: 'pure0001', version: 'v', startedAt: NOW_AT.toISOString(), activities: entries(), outside: [] });
  const as = (run: SessionRun, at: number): Expected => ({ sessionId: run.sessionId, version: run.version, token: run.activities[at]?.token ?? '' });
  const ok = (result: ReturnType<typeof apply>): SessionRun => {
    if (!result.ok) throw new Error(`refused: ${result.why}`);
    return result.run;
  };
  const withhold: RunEvent = { kind: 'withhold', held: 'paused', since: NOW_AT.toISOString() };

  it('a pending activity the composition chose is skipped with the reason, and the cursor goes to the next still to do', () => {
    const before = fresh();
    const after = ok(apply(before, as(before, 0), withhold, NOW_AT));
    expect(after.activities[0]).toMatchObject({ state: 'skipped', adaptations: [{ why: 'Warm-up is skipped — you paused it' }] });
    expect(after.current).toBe(1);
    // Nothing else moved: the rest of the card is as composed, no state changed, no activity added or reordered.
    expect(after.activities.slice(1)).toEqual(before.activities.slice(1));
    expect(composed(after)).toEqual(composed(before));
  });

  it('the last activity withheld closes the session as finished: nothing is left, nothing failed', () => {
    let run = fresh();
    for (let at = 0; at < 4; at += 1) run = ok(apply(run, as(run, at), { kind: 'advance' }, NOW_AT));
    expect(run.current).toBe(4);
    run = ok(apply(run, as(run, 4), withhold, NOW_AT));
    expect(run.current).toBeNull();
    expect(run.closed?.why).toBe('finished');
  });

  it('never an activity underway: opened or attempted, the learner is in it and the event is refused', () => {
    for (const underway of [{ kind: 'opened' }, { kind: 'attempted' }] as RunEvent[]) {
      const before = ok(apply(fresh(), as(fresh(), 0), underway, NOW_AT));
      const refused = apply(before, as(before, 0), withhold, NOW_AT);
      expect(refused, JSON.stringify(underway)).toMatchObject({ ok: false, why: 'illegal' });
      expect(before.activities[0]?.state).not.toBe('skipped');
    }
  });

  it('never an activity the learner chose themselves: one with no claim is a swap’s, and is refused', () => {
    const run = newRun({ day: dayKey(NOW_AT), sessionId: 'pure0002', version: 'v', startedAt: NOW_AT.toISOString(), outside: [], activities: [{ ...entries()[0], slot: { kind: 'technique', itemId: 'drill.warm', title: 'Warm-up', minutes: 5 } } as ActivityEntry, entries()[1] as ActivityEntry] });
    expect(apply(run, as(run, 0), withhold, NOW_AT)).toMatchObject({ ok: false, why: 'illegal' });
  });

  it('an activity ahead of the cursor, the one a transition offers after a stopped activity, is skipped and the cursor stays where it is', () => {
    let run = fresh();
    run = ok(apply(run, as(run, 0), { kind: 'opened' }, NOW_AT));
    run = ok(apply(run, as(run, 0), { kind: 'attempted' }, NOW_AT));
    const after = ok(apply(run, as(run, 1), withhold, NOW_AT));
    expect(after.activities[1]).toMatchObject({ state: 'skipped', adaptations: [{ why: 'New piece is skipped — you paused it' }] });
    expect(after.current, 'the learner is still in the first activity').toBe(0);
    expect(after.activities[0]?.state).toBe('attempted');
    // And the cursor, when it moves on from the first, passes the skipped one over.
    expect(ok(apply(after, as(after, 0), { kind: 'advance' }, NOW_AT)).current).toBe(2);
  });

  it('a token that is no activity’s is stale, and a closed session takes nothing', () => {
    const run = fresh();
    expect(apply(run, { ...as(run, 0), token: 'nosuchtoken' }, withhold, NOW_AT)).toMatchObject({ ok: false, why: 'stale-token' });
    expect(apply({ ...run, closed: { why: 'ended', at: NOW_AT.toISOString() } }, as(run, 0), withhold, NOW_AT)).toMatchObject({ ok: false, why: 'closed' });
  });
});

// --- the session's one reading of a project -----------------------------------------------------------

describe('the session’s one reading of a project (the composer’s and the runner’s)', () => {
  const row = (state: ProjectRow['state'], itemId = 'song.ode', material: ProjectRow['material'] = { kind: 'id', itemId }): ProjectRow => ({
    id: material.kind === 'id' ? `id:${itemId}` : `file:${material.kind === 'file' ? material.sha256 : ''}`,
    material,
    itemId,
    state,
    since: '2026-10-01T10:00:00.000Z',
    history: [{ state, at: '2026-10-01T10:00:00.000Z', why: 'pause' }],
  });

  it('paused and put away are held, said as which; every other state, and no project, is not', () => {
    const answers = PROJECT_STATES.map((state) => [state, heldStateOf([row(state)], { itemId: 'song.ode', material: undefined })]);
    expect(answers).toEqual(PROJECT_STATES.map((state) => [state, state === 'paused' ? 'paused' : state === 'retired' ? 'retired' : undefined]));
    expect(heldStateOf([], { itemId: 'song.ode', material: undefined })).toBeUndefined();
  });

  it('by the piece’s material first, then the id it was made under — never another id’s row (identity fails conservatively)', () => {
    const file = { kind: 'file', sha256: 'a'.repeat(64) } as Identity;
    const made = row('paused', 'song.ode.old-id', file as ProjectRow['material']);
    expect(heldStateOf([made], { itemId: 'song.ode.new-id', material: file })).toBe('paused');
    expect(heldStateOf([made], { itemId: 'song.ode.new-id', material: undefined })).toBeUndefined();
    expect(heldStateOf([row('paused', 'song.ode')], { itemId: 'song.other', material: undefined })).toBeUndefined();
  });

  it('the session has one place that looks a project up, and the card’s predicate and the runner both ask it', () => {
    const src = join(process.cwd(), 'src');
    const session = readFileSync(join(src, 'curriculum', 'session.ts'), 'utf8');
    expect([...session.matchAll(/projectIn\(/g)], 'a second project lookup in the session').toHaveLength(1);
    const runner = readFileSync(join(src, 'ui', 'sessionRunner.ts'), 'utf8');
    expect(runner, 'the runner reads a project its own way').not.toMatch(/projectIn\(/);
    expect(runner).toMatch(/heldWordOf\(/);
    expect(session.slice(session.indexOf('\nexport function buildSession('))).toMatch(/heldStateOf\(/);
  });
});

// --- the transition: the turn comes ---------------------------------------------------------------------

describe('at its turn, a pending piece the learner has paused or put away is stepped past', () => {
  it('the pause lands while the piece is ahead: when the one before finishes, the transition offers the one after, says why, and the composition stands', async () => {
    const before = await begin();
    await finishCurrent();
    await sayOnSheet('song.ode', 'pause');
    await finishCurrent();
    // The piece (activity 2) is current now and pending; its turn comes as the transition for activity 1 is drawn.
    const { into, options } = host(TOKENS[1] as string);
    expect(await drawTransition(into, options)).toBe('next');
    expect(into.dataset.sessionNextItem, 'the paused piece was offered at its turn').toBe('song.keep');
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you paused it']);
    expect(lines(into)[1]).toBe('Next: Another piece, 7 min — More music from this lesson');
    const after = await stored();
    // Its own kind (G90a): the learner withdrew the piece; no practice became redundant.
    expect(after.activities[2]).toMatchObject({ state: 'skipped', adaptations: [{ kind: 'withdrawn', held: 'paused', why: 'Ode to Joy is skipped — you paused it' }] });
    expect(after.current).toBe(3);
    // The snapshot stays: slots, routes, words, tokens, the free prompt, the version and the session are as composed.
    expect(composed(after)).toEqual(composed(before));
    expect(after.outside).toEqual(before.outside);
    expect([after.version, after.sessionId]).toEqual([before.version, before.sessionId]);
    expect(after.activities.map((one) => one.state)).toEqual(['completed', 'completed', 'skipped', 'pending']);
  });

  it('put away says so in its own words', async () => {
    await begin();
    await finishCurrent();
    await sayOnSheet('song.ode', 'retire');
    await finishCurrent();
    const { into, options } = host(TOKENS[1] as string);
    await drawTransition(into, options);
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you put it away']);
    expect(into.dataset.sessionNextItem).toBe('song.keep');
  });

  it('two in a row are both stepped past, each said in order, and the one that is left is offered', async () => {
    await begin(entries());
    await finishCurrent();
    await sayOnSheet('song.ode', 'pause');
    await sayOnSheet('song.keep', 'retire');
    await finishCurrent();
    const { into, options } = host(TOKENS[1] as string);
    expect(await drawTransition(into, options)).toBe('next');
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you paused it', 'Another piece is skipped — you put it away']);
    expect(into.dataset.sessionNextItem).toBe('song.last');
    expect((await stored()).activities.map((one) => one.state)).toEqual(['completed', 'completed', 'skipped', 'skipped', 'pending']);
  });

  it('a stopped activity’s transition offers the one after it: a paused piece there is stepped past before it is shown, and Start opens the one after', async () => {
    await begin(entries());
    await finishCurrent();
    // The second activity is tried and left (a drill ended early): still the cursor's, so Start moves on from it.
    await onCurrent({ kind: 'opened' });
    await onCurrent({ kind: 'attempted' });
    await sayOnSheet('song.ode', 'pause');
    const { into, options } = host(TOKENS[1] as string);
    expect(await drawTransition(into, options)).toBe('next');
    expect(into.dataset.sessionNextItem, 'the paused piece was offered after a stopped activity').toBe('song.keep');
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you paused it']);
    const during = await stored();
    expect(during.current, 'the learner has not moved on yet').toBe(1);
    expect(during.activities.map((one) => one.state)).toEqual(['completed', 'attempted', 'skipped', 'pending', 'pending']);
    click(into, 'session-start-next');
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    expect(navigateScore.mock.calls[0]?.[0]).toBe('song.keep');
    expect((await stored()).current).toBe(3);
  });

  it('a stopped activity’s transition drawn before the pause: Start moves on, steps past the piece that is then its turn, and shows the one after, said', async () => {
    await begin(entries());
    await finishCurrent();
    await onCurrent({ kind: 'opened' });
    await onCurrent({ kind: 'attempted' });
    const { into, options } = host(TOKENS[1] as string);
    await drawTransition(into, options);
    expect(into.dataset.sessionNextItem, 'not paused yet: offered').toBe('song.ode');
    await sayOnSheet('song.ode', 'retire');
    click(into, 'session-start-next');
    await vi.waitFor(() => expect(into.dataset.sessionNextItem).toBe('song.keep'));
    expect(navigateScore, 'the piece put away was opened').not.toHaveBeenCalled();
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you put it away']);
    const after = await stored();
    expect(after.activities.map((one) => one.state)).toEqual(['completed', 'attempted', 'skipped', 'pending', 'pending']);
    expect(after.activities[1]?.movedOn, 'the learner did move on from the stopped one').toBe(true);
    expect(after.current).toBe(3);
  });

  it('the one offered after a stopped activity may be behind it on the card: the skip is still said', async () => {
    await begin(entries().slice(0, 3));
    // The learner took the second activity first; the first is still to do, and the third is the paused piece.
    const run = await stored();
    await applySessionEvent({ sessionId: run.sessionId, version: run.version, token: TOKENS[1] as string }, { kind: 'choose' });
    await onCurrent({ kind: 'opened' });
    await onCurrent({ kind: 'attempted' });
    await sayOnSheet('song.ode', 'pause');
    const { into, options } = host(TOKENS[1] as string);
    await drawTransition(into, options);
    expect(into.dataset.sessionNextItem).toBe('drill.warm');
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you paused it']);
  });

  it('the piece was already next when the learner paused it: Start does not open it, and the screen shows the one after, said', async () => {
    await begin();
    await finishCurrent();
    await finishCurrent();
    const { into, options } = host(TOKENS[1] as string);
    expect(await drawTransition(into, options)).toBe('next');
    expect(into.dataset.sessionNextItem, 'not paused yet: offered').toBe('song.ode');
    await sayOnSheet('song.ode', 'pause');
    click(into, 'session-start-next');
    await vi.waitFor(() => expect(into.dataset.sessionNextItem).toBe('song.keep'));
    expect(navigateScore, 'the paused piece was opened').not.toHaveBeenCalled();
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you paused it']);
    expect((await stored()).current).toBe(3);
  });

  it('the piece is the last one: the session finishes, and what it says is the last-one line', async () => {
    await begin(entries().slice(0, 3));
    await finishCurrent();
    await sayOnSheet('song.ode', 'pause');
    await finishCurrent();
    const { into, options } = host(TOKENS[1] as string);
    expect(await drawTransition(into, options)).toBe('finished');
    const after = await stored();
    expect(after.activities[2]?.state).toBe('skipped');
    expect(after.closed?.why).toBe('finished');
    expect(lines(into)[0]).toBe('That was the last one — today’s session is done');
  });

  it('an activity already underway is not interrupted; the next one at its turn is', async () => {
    await begin(entries());
    await finishCurrent();
    await finishCurrent();
    // The piece is current and opened (its screen is up): the learner is in it.
    await onCurrent({ kind: 'opened' });
    await sayOnSheet('song.ode', 'pause');
    await sayOnSheet('song.keep', 'pause');
    const first = host(TOKENS[1] as string);
    await drawTransition(first.into, first.options);
    expect(first.into.dataset.sessionNextItem, 'the piece the learner is in was taken away').toBe('song.ode');
    expect(notes(first.into)).toEqual([]);
    expect((await stored()).activities[2]?.state).toBe('active');
    // It finishes; the next piece (also paused since) is stepped past at its turn.
    await finishCurrent();
    const second = host(TOKENS[2] as string);
    await drawTransition(second.into, second.options);
    expect(second.into.dataset.sessionNextItem).toBe('song.last');
    expect(notes(second.into)).toEqual(['Another piece is skipped — you paused it']);
  });

  // G90 said a swapped-in piece stays however its project stands, whenever it was paused (the swap stored no
  // moment to compare with). G90a replaced that: a swap records when it was made, and a pause from before it stays
  // overridden by the choice while one from after it vetoes the piece (`sessionHeldSkip.test.ts` holds the
  // later-word half, both orders, paused and put away). This case keeps the half that did not change.
  it('a piece the learner chose themselves, by a swap, after they paused it stays: the choice came after the word; the composer’s next piece, paused since, does not', async () => {
    await begin(entries());
    await finishCurrent();
    // The learner had paused the piece it is swapped for, and swapped the review for it afterwards (a swap carries
    // no claim: nothing chose it but them).
    const when = new Date();
    await applyProjectAction({ itemId: 'song.chosen', material: undefined }, 'learn', { at: new Date(when.getTime() - 3000) });
    await applyProjectAction({ itemId: 'song.chosen', material: undefined }, 'pause', { at: new Date(when.getTime() - 2000) });
    const run = await stored();
    const swapped = await applySessionEvent(
      { sessionId: run.sessionId, version: run.version, token: TOKENS[2] as string },
      { kind: 'swap', slot: { kind: 'review', itemId: 'song.chosen', title: 'Chosen piece', minutes: 5 }, route: { target: 'score', itemId: 'song.chosen' }, reason: 'You chose this one — from the same lesson', token: 'tokenx009' },
      new Date(when.getTime() - 1000),
    );
    expect(swapped.ok).toBe(true);
    await sayOnSheet('song.keep', 'pause');
    await finishCurrent();
    const first = host(TOKENS[1] as string);
    await drawTransition(first.into, first.options);
    expect(first.into.dataset.sessionNextItem).toBe('song.chosen');
    expect(notes(first.into)).toEqual([]);
    await finishCurrent();
    const second = host('tokenx009');
    await drawTransition(second.into, second.options);
    expect(second.into.dataset.sessionNextItem, 'the composer’s paused piece was offered').toBe('song.last');
    expect(notes(second.into)).toEqual(['Another piece is skipped — you paused it']);
  });

  it('only paused and put away: every other state leaves it offered, and so does no project at all', async () => {
    /** The piece's row in a state, put straight in the store: the runner reads the state and nothing else. */
    const seed = async (state: ProjectRow['state']): Promise<void> => {
      const db = await openDatabase();
      const at = '2026-10-01T10:00:00.000Z';
      await db?.put('projects', { id: 'id:song.ode', material: { kind: 'id', itemId: 'song.ode' }, itemId: 'song.ode', state, since: at, history: [{ state, at, why: 'learn' }] });
    };
    /** A fresh session carried to the piece's turn with the project as `state`; what the transition offers. */
    const offeredWith = async (state: ProjectRow['state'] | undefined): Promise<string | undefined> => {
      useFakeIndexedDb();
      resetSessionRunForTest();
      resetProjectsForTest();
      await begin();
      await finishCurrent();
      if (state !== undefined) await seed(state);
      await finishCurrent();
      const { into, options } = host(TOKENS[1] as string);
      await drawTransition(into, options);
      return into.dataset.sessionNextItem;
    };
    expect(await offeredWith(undefined), 'no project').toBe('song.ode');
    for (const state of PROJECT_STATES) {
      const held = state === 'paused' || state === 'retired';
      expect(await offeredWith(state), `state ${state}`).toBe(held ? 'song.keep' : 'song.ode');
    }
  });

  it('a piece is found by its material, not only its id: a project made under another id of the same file holds', async () => {
    const file = { kind: 'file', sha256: 'b'.repeat(64) } as Identity;
    catalog.items.set('song.ode', { id: 'song.ode', type: 'song', provenance: { identity: file } });
    await begin();
    await finishCurrent();
    await sayOnSheet('song.ode.under-another-id', 'pause', file);
    await finishCurrent();
    const { into, options } = host(TOKENS[1] as string);
    await drawTransition(into, options);
    expect(into.dataset.sessionNextItem).toBe('song.keep');
    expect(notes(into)).toEqual(['Ode to Joy is skipped — you paused it']);
  });

  it('a catalogue that cannot be read finds the project by the id it was made under', async () => {
    catalog.down = true;
    await begin();
    await finishCurrent();
    await sayOnSheet('song.ode', 'pause');
    await finishCurrent();
    const { into, options } = host(TOKENS[1] as string);
    await drawTransition(into, options);
    expect(into.dataset.sessionNextItem).toBe('song.keep');
  });

  it('a store of projects that cannot be read withdraws nothing, as Today’s card reads none', async () => {
    await begin();
    await finishCurrent();
    await sayOnSheet('song.ode', 'pause');
    await finishCurrent();
    projectRead.fails = true;
    const { into, options } = host(TOKENS[1] as string);
    await drawTransition(into, options);
    expect(into.dataset.sessionNextItem).toBe('song.ode');
    expect((await stored()).activities[2]?.state).toBe('pending');
  });
});

// --- what the transition says of a skip -----------------------------------------------------------------

describe('the transition says a skip only while it is a skip', () => {
  it('a piece the learner brought back by tapping its row is no longer announced as skipped', () => {
    const NOW_AT = new Date();
    const expectedFor = (run: SessionRun, token: string): Expected => ({ sessionId: run.sessionId, version: run.version, token });
    const step = (run: SessionRun, token: string, event: RunEvent): SessionRun => {
      const result = apply(run, expectedFor(run, token), event, NOW_AT);
      if (!result.ok) throw new Error(`refused: ${result.why}`);
      return result.run;
    };
    let run = newRun({ day: dayKey(NOW_AT), sessionId: 'tick0001', version: 'v', startedAt: NOW_AT.toISOString(), activities: entries().slice(0, 4), outside: [] });
    run = step(run, TOKENS[0] as string, { kind: 'completed', outcome: 'unknown' });
    run = step(run, TOKENS[2] as string, { kind: 'withhold', held: 'paused', since: NOW_AT.toISOString() });
    run = step(run, TOKENS[1] as string, { kind: 'completed', outcome: 'unknown' });
    const said = transitionView(run, TOKENS[1] as string, NOW_AT);
    expect(said).toMatchObject({ kind: 'next', from: 'completed', notes: ['Ode to Joy is skipped — you paused it'] });
    // The learner taps the skipped row (it becomes current again) and then another: the card is theirs now.
    run = step(run, TOKENS[2] as string, { kind: 'choose' });
    run = step(run, TOKENS[3] as string, { kind: 'choose' });
    expect(run.activities[2]?.state).toBe('pending');
    expect(transitionView(run, TOKENS[1] as string, NOW_AT)).toMatchObject({ kind: 'next', notes: [] });
  });
});

// --- settleHeld, the one place --------------------------------------------------------------------------

describe('settleHeld: the one place the runner steps past a withdrawn piece', () => {
  it('reports what it stepped past, leaves a run with nothing withdrawn untouched and writes nothing for it', async () => {
    const run = await begin();
    const untouched = await settleHeld(run);
    expect(untouched.withheld).toEqual([]);
    expect(untouched.run).toEqual(run);
    expect(await stored(), 'a run with nothing withdrawn was written').toEqual(run);
    await finishCurrent();
    await finishCurrent();
    await sayOnSheet('song.ode', 'retire');
    const settled = await settleHeld(await stored());
    expect(settled.withheld.map((one: RunActivity) => one.slot.itemId)).toEqual(['song.ode']);
    expect(settled.run.current).toBe(3);
    // Again: nothing more to step past, and nothing written twice.
    const again = await settleHeld(settled.run);
    expect(again.withheld).toEqual([]);
    expect(again.run).toEqual(settled.run);
  });
});
