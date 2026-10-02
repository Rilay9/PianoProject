/**
 * The session runner's one adapter to the screens (X1; the reviewer's required change,
 * `docs/review/responses/bf8de2d2.md`: one activity protocol and one runner transition, not per-screen
 * cursor mutations).
 *
 * - **Opening** (`openActivity`): the runner opens an activity by the route the composition gave its slot,
 *   with the activity's token (`?session=`); a transfer offer's snapshot is kept first (D4a) and the route is
 *   not opened until that write settles — a failed write opens nothing and says so (U73).
 * - **The screens report lifecycle events** through a `SessionHandle` built from their route's token —
 *   opened, attempted, completed, and the visible time — and never read encounter history or choose the
 *   next activity themselves. Every write carries the session id, the composition's version and the token;
 *   a refused write changes nothing.
 * - **The start-time recheck** (the brief's item 6; Part 27's session interaction): an activity chosen as a
 *   first contact is rechecked when its screen opens, through G2's one adapter (`session.contactOf`) over the
 *   runs, the encounters — this opening's own viewing aside — and the pruned runs' summaries; met since the
 *   card was composed, it is repurposed with the reason said. The Score screen's own first-contact
 *   derivation (G1) still decides the run's evidence; this is what the session says about it.
 * - **The transition** (`drawTransition`): the block a finished activity's closing action becomes — the next
 *   activity with the composition's own words for it, *Start* and *Skip or change*; *Try again* and *Move on
 *   anyway* after a measured failure; *Done* after the last. Drawn from the stored record, so a stale screen
 *   shows where the session really is.
 * - **The clock** (`SessionHandle.startClock`): visible time only — a hidden page, a closed app and Today
 *   between activities accrue nothing.
 * - **The learner's word on a piece** (`settleHeld`; G90, the reviewer's ruling `responses/d59f2ef8.md` question
 *   2): the composition is frozen at *Start session* and stays, but a piece the learner paused or put away on
 *   its sheet since is not offered when its turn comes. Where the session is about to offer its current
 *   activity — the transition drawn after the one before, *Start* on it, Today read for *Continue* — a pending
 *   activity the composition chose whose piece is withdrawn *now* is skipped with the reason said, and the one
 *   after is offered; nothing is recomposed, an activity underway is not interrupted, and a row or a swap the
 *   learner chose is their own word and is left alone.
 */
import type { Router } from '../router';
import {
  applySessionEvent,
  isAutomatic,
  isOpen,
  nextPending,
  plannedMinutes,
  readSessionRun,
  type Expected,
  type Outcome,
  type RunActivity,
  type RunEvent,
  type SessionRun,
  type ApplyResult,
} from '../data/sessionRun';
import { newOfferToken, writeOfferSnapshot } from '../data/offerSnapshot';
import { contactSummaries, rungRows } from '../data/progressStore';
import { allEncounters } from '../data/encounterStore';
import { allProjects, type ProjectRow, type ProjectTarget } from '../data/projectStore';
import { findItem } from '../curriculum/load';
import { materialOfItem } from '../curriculum/material';
import { contactOf, heldStateOf } from '../curriculum/session';
import type { Identity } from '../review/record';
import { SESSION_TEXT } from './help';
import { el } from './widgets';

/** A new activity token: the router's token form (`[0-9a-z]{6,32}`), which the offer snapshot's token shares. */
export function newActivityToken(): string {
  return newOfferToken();
}

/** How often visible time is written while an activity's screen is open. */
export const CLOCK_FLUSH_MS = 15_000;

/**
 * Opens an activity through the router, with its token. The transfer offer (D4a): the composition's claim is
 * written to the offer snapshot under the activity's token first, and the route opens only once that write
 * has settled; a failed write opens nothing (U73) and the caller says so.
 */
export async function openActivity(router: Router, run: SessionRun, activity: RunActivity): Promise<{ ok: true } | { ok: false; why: 'offer-not-kept' }> {
  const route = activity.route;
  const session = activity.token;
  if (route.target === 'drill') {
    router.navigateDrill(route.itemId, { ...(route.rung === undefined ? {} : { rung: route.rung }), session });
    return { ok: true };
  }
  if (route.transfer) {
    const offer = activity.token;
    try {
      await writeOfferSnapshot({
        token: offer,
        itemId: route.itemId,
        skill: route.transfer.skill,
        ...(route.transfer.material === undefined ? {} : { material: route.transfer.material }),
        relationship: route.transfer.relationship,
        contact: route.transfer.contact,
        offeredOn: run.day,
      });
    } catch {
      return { ok: false, why: 'offer-not-kept' };
    }
    router.navigateScore(route.itemId, { slot: activity.slot.kind, intent: { intent: 'transfer', skill: route.transfer.skill, offer }, session });
    return { ok: true };
  }
  router.navigateScore(route.itemId, {
    ...(route.rung === undefined ? {} : { rung: route.rung }),
    slot: activity.slot.kind,
    ...(route.seed === undefined ? {} : { seed: route.seed }),
    ...(route.recipe === undefined ? {} : { recipe: route.recipe }),
    session,
  });
  return { ok: true };
}

/**
 * Opens an activity's item outside the session (a done row played again from Today): its rung and slot, no
 * token, no seed (a fresh phrase, never the one on the record) and no transfer intent — it is practice.
 */
export function openOutside(router: Router, activity: RunActivity): void {
  const route = activity.route;
  if (route.target === 'drill') {
    router.navigateDrill(route.itemId, route.rung === undefined ? {} : { rung: route.rung });
    return;
  }
  router.navigateScore(route.itemId, {
    ...(route.rung === undefined || route.transfer ? {} : { rung: route.rung }),
    slot: activity.slot.kind,
    ...(route.recipe === undefined ? {} : { recipe: route.recipe }),
  });
}

/** What a screen opened with a session token reports, and reads back. */
export interface SessionHandle {
  readonly token: string;
  /** The stored run where this token is one of its activities and it is today's; null otherwise. */
  record(): Promise<SessionRun | null>;
  /** The screen is open and knows what it plays: marks the activity active and rechecks its contact assumption. */
  opened(facts: { itemId: string; material?: Identity; visit?: string }): Promise<void>;
  /** The run's count-in passed, or the drill started. */
  attempted(): void;
  /** A run reached its end and is stored: the visible time first, then the outcome. */
  completed(outcome: Outcome): Promise<ApplyResult | null>;
  /** Starts the visible-time clock; returns its stop, which writes what is left. */
  startClock(): () => void;
  /** An event on behalf of the transition (it acts on the record's current activity, not on this screen's). */
  write(expected: Expected, event: RunEvent): Promise<ApplyResult>;
}

function expectedFor(run: SessionRun, token: string): Expected {
  return { sessionId: run.sessionId, version: run.version, token };
}

/** The handle for a screen whose route carries `?session=`; null without one. */
export function sessionHandle(token: string | undefined, clock: { now: () => Date } = { now: () => new Date() }): SessionHandle | null {
  if (token === undefined || token === '') return null;
  let attemptedSent = false;
  let flushNow: (() => Promise<void>) | null = null;
  const record = async (): Promise<SessionRun | null> => {
    const read = await readSessionRun().catch(() => ({ kind: 'none' as const }));
    if (read.kind !== 'run') return null;
    const run = read.run;
    return run.activities.some((activity) => activity.token === token) ? run : null;
  };
  const write = async (expected: Expected, event: RunEvent): Promise<ApplyResult> =>
    applySessionEvent(expected, event, clock.now()).catch((): ApplyResult => ({ ok: false, why: 'none', run: null }));
  /** An event from this screen, about its own activity. */
  const own = async (event: RunEvent): Promise<ApplyResult | null> => {
    const run = await record();
    if (!run) return null;
    return write(expectedFor(run, token), event);
  };
  return {
    token,
    record,
    write,
    async opened(facts) {
      const result = await own({ kind: 'opened' });
      if (!result?.ok) return;
      const activity = result.run.activities.find((one) => one.token === token);
      if (!activity?.contact || activity.contact.rechecked !== undefined) return;
      // Only a first-contact assumption can be undone by an intervening encounter: `met` stays met, and
      // `none` rests on nothing a new contact could invalidate.
      if (activity.contact.assumed !== 'first-contact') {
        await own({ kind: 'recheck', verdict: 'held' });
        return;
      }
      const [rows, encounters, summaries] = await Promise.all([
        rungRows().catch(() => []),
        allEncounters().catch(() => []),
        contactSummaries().catch(() => []),
      ]);
      // This opening's own viewing is the reading's, never prior contact (G1's visit rule).
      const before = facts.visit === undefined ? encounters : encounters.filter((row) => row.visit !== facts.visit);
      const contact = contactOf({ rows, contact: { encounters: before, summaries } }, facts.itemId, facts.material);
      // Met by its exact material since the card was composed; an id-only match is unknown, never contact.
      const met = contact.contact === 'met';
      await own(met ? { kind: 'recheck', verdict: 'invalidated', why: SESSION_TEXT.repurposed(contact.how?.[0] ?? 'played') } : { kind: 'recheck', verdict: 'held' });
    },
    attempted() {
      if (attemptedSent) return;
      attemptedSent = true;
      void own({ kind: 'attempted' });
    },
    async completed(outcome) {
      if (flushNow) await flushNow();
      return own({ kind: 'completed', outcome });
    },
    startClock() {
      const doc = typeof document === 'undefined' ? null : document;
      let visibleSince: number | null = doc === null || doc.visibilityState === 'visible' ? performance.now() : null;
      let pending = 0;
      const take = (): void => {
        if (visibleSince === null) return;
        const at = performance.now();
        pending += at - visibleSince;
        visibleSince = at;
      };
      const flush = async (): Promise<void> => {
        take();
        const ms = pending;
        pending = 0;
        if (ms < 1) return;
        await own({ kind: 'accrue', ms });
      };
      flushNow = flush;
      const onVisibility = (): void => {
        if (doc?.visibilityState === 'visible') {
          visibleSince = performance.now();
          return;
        }
        take();
        visibleSince = null;
        void flush();
      };
      const onHide = (): void => {
        void flush();
      };
      doc?.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', onHide);
      const timer = window.setInterval(() => {
        void flush();
      }, CLOCK_FLUSH_MS);
      return () => {
        window.clearInterval(timer);
        doc?.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pagehide', onHide);
        void flush();
        flushNow = null;
      };
    },
  };
}

// --- the learner's word on a piece ------------------------------------------------------------------

/** What `settleHeld` did: the run as it stands, and the activities it stepped past, in order. */
export interface Settled {
  run: SessionRun;
  withheld: RunActivity[];
}

/**
 * The project target of an activity's piece: its id and, where the catalogue can say, its material — so a
 * project made under another id of the same file holds, as the card's composer finds it. A catalogue that
 * cannot be read leaves the id alone: the project made under that id is still found, and no other is guessed.
 */
async function projectTargetOf(activity: RunActivity): Promise<ProjectTarget> {
  const itemId = activity.route.itemId;
  try {
    const item = await findItem(itemId);
    return { itemId, material: item === undefined ? undefined : materialOfItem(item) };
  } catch {
    return { itemId, material: undefined };
  }
}

/** The activity the cursor is on: what Today's *Continue* and a transition after a finished activity offer. */
const currentOf = (run: SessionRun): RunActivity | undefined => (run.current === null ? undefined : run.activities[run.current]);

/**
 * The learner's last word on a piece holds where the session next acts on it (G90; the ruling `responses/
 * d59f2ef8.md` question 2). Called wherever the session is about to offer an activity — the transition drawn
 * after the one before, *Start* on it, Today read for *Continue* — with what that place offers (`offering`;
 * by default the cursor's activity): while the offered activity is pending, chosen by the composition
 * (`isAutomatic`), and its piece is paused or put away *now* (`heldStateOf`, the composer's own reading, over
 * the projects as they stand), the runner skips it with the reason said (`withhold`) and offers the one after
 * — and the one after that. The transition after a stopped activity offers the one after it, which the cursor
 * has not reached (`offeredAfter`); every other place offers the cursor's.
 *
 * It does not recompose: the activities, their order, words and tokens are as *Start session* kept them, and a
 * piece that is held again later is stepped past at its own turn. It does not interrupt: an activity opened or
 * tried is the learner's, and `apply` refuses the event for it. It does not overrule: a swapped-in piece
 * carries no claim, and a row the learner taps becomes current by `choose` and opens without passing here. It
 * writes nothing where nothing is withdrawn (no read of the catalogue either, where the learner has no project
 * at all). A store of projects that cannot be read withdraws nothing, as Today's card reads none.
 */
export async function settleHeld(
  run: SessionRun,
  now: Date = new Date(),
  offering: (run: SessionRun) => RunActivity | undefined = currentOf,
): Promise<Settled> {
  let at = run;
  const withheld: RunActivity[] = [];
  let projects: readonly ProjectRow[] | null = null;
  for (let guard = 0; guard < run.activities.length; guard += 1) {
    const offered = offering(at);
    if (!isOpen(at, now) || !offered || offered.state !== 'pending' || !isAutomatic(offered)) break;
    projects ??= await allProjects().catch((): ProjectRow[] => []);
    if (projects.length === 0) break;
    const held = heldStateOf(projects, await projectTargetOf(offered));
    if (held === undefined) break;
    const result = await applySessionEvent(expectedFor(at, offered.token), { kind: 'withhold', why: SESSION_TEXT.withheld(offered.slot.title, held) }, now).catch(
      (): ApplyResult => ({ ok: false, why: 'none', run: null }),
    );
    if (!result.ok) {
      // Moved on elsewhere (another tab) or no longer pending: what is stored is what stands.
      if (result.run) at = result.run;
      break;
    }
    withheld.push(offered);
    at = result.run;
  }
  return { run: at, withheld };
}

/**
 * What a transition offers for a screen's token: the one *Start* would open (`transitionView`'s `next`) —
 * the cursor's activity after a finished one, the one after it where this activity was stopped and is still
 * the cursor's. The `offering` of `settleHeld` for the transition's draw.
 */
export function offeredAfter(token: string, now: Date): (run: SessionRun) => RunActivity | undefined {
  return (run) => {
    const view = transitionView(run, token, now);
    return view.kind === 'next' ? view.next : undefined;
  };
}

// --- the transition ---------------------------------------------------------------------------------

/**
 * What the transition shows for a screen's token, from the stored record (pure):
 *
 * - `none`: no record, or the token is not this session's — the screen keeps its own closing action;
 * - `closed`: the session was ended, recomposed or left from another day — nothing to offer;
 * - `finished`: the last activity is behind the learner;
 * - `kept-here`: this activity is current and its last run failed, measured;
 * - `next`: the next activity — after this one was completed (`from: 'completed'`), or, where this one is
 *   still current and not completed (a stopped drill, a run left unanswered), what *Start* moves on to
 *   (`from: 'moving-on'`); `next` absent means moving on from the last.
 */
export type TransitionView =
  | { kind: 'none' }
  | { kind: 'closed' }
  | { kind: 'finished'; run: SessionRun }
  | { kind: 'kept-here'; run: SessionRun; mine: RunActivity; notes: string[] }
  | { kind: 'next'; run: SessionRun; mine: RunActivity; from: 'completed' | 'moving-on'; next?: RunActivity; notes: string[] };

/**
 * The runner's own changes between this activity and the one offered after it, said: a controlled practice
 * skipped for easy success, a piece the learner's word withdrew (G90). The activities the cursor passed over,
 * in the order `nextPending` walks them — after this one, and round to the start where the one offered is
 * behind it — and only while they are skipped: a row the learner tapped back to life says nothing of a skip.
 * With nothing offered after it, only what follows this activity: the rest of the card is behind it.
 */
function skipsBetween(run: SessionRun, mine: RunActivity, next: RunActivity | undefined): string[] {
  const n = run.activities.length;
  const passed: RunActivity[] = [];
  for (let step = 1; step < n; step += 1) {
    const at = mine.index + step;
    if (next === undefined && at >= n) break;
    const activity = run.activities[at % n] as RunActivity;
    if (next !== undefined && activity.index === next.index) break;
    passed.push(activity);
  }
  return passed
    .filter((activity) => activity.state === 'skipped')
    .flatMap((activity) => activity.adaptations.filter((one) => one.kind === 'skipped-redundant').map((one) => one.why));
}

export function transitionView(run: SessionRun | null, token: string, now: Date): TransitionView {
  if (run === null) return { kind: 'none' };
  const mine = run.activities.find((activity) => activity.token === token);
  if (!mine) return { kind: 'none' };
  if (run.closed) return run.closed.why === 'finished' ? { kind: 'finished', run } : { kind: 'closed' };
  if (!isOpen(run, now)) return { kind: 'closed' };
  const repurposed = mine.adaptations.filter((one) => one.kind === 'repurposed').map((one) => one.why);
  if (run.current === mine.index) {
    if (mine.state === 'attempted' && mine.result?.outcome === 'failed') {
      return { kind: 'kept-here', run, mine, notes: [...repurposed, ...mine.adaptations.filter((one) => one.kind === 'kept-here').map((one) => one.why)] };
    }
    const at = nextPending(run, mine.index);
    const after = at === null ? undefined : (run.activities[at] as RunActivity);
    return { kind: 'next', run, mine, from: 'moving-on', ...(after === undefined ? {} : { next: after }), notes: [...repurposed, ...skipsBetween(run, mine, after)] };
  }
  const next = run.current === null ? undefined : run.activities[run.current];
  return { kind: 'next', run, mine, from: 'completed', ...(next ? { next } : {}), notes: [...repurposed, ...skipsBetween(run, mine, next)] };
}

/** Minutes, rounded, from the visible-time clock. */
export function minutesOf(ms: number): number {
  return Math.round(ms / 60_000);
}

/**
 * What became of an activity, as the running card, the finish line and a card composed after the session say
 * it (X46, `responses/9e14839e.md` §2 point 4): **done** only where its run counted — completed with a measured
 * pass at the full standard (`passed-full`, the same run the rung's evidence reads) — **played** where a run
 * completed it that measured nothing toward it (`unknown`: a drill set nobody answered, a backing track), or
 * where it was tried and left; **skipped** where it was never tried; `null` while it is still to do. The record
 * held the distinction (`result.outcome`) and the card read only the state, so an unmeasured exercise wore the
 * same ✓ as a pass. Session words, never evidence: nothing here is read by `evidence/`.
 */
export function cameTo(activity: Pick<RunActivity, 'state' | 'result'>): 'done' | 'played' | 'skipped' | null {
  switch (activity.state) {
    case 'completed':
      return activity.result?.outcome === 'passed-full' ? 'done' : 'played';
    case 'skipped':
      return 'skipped';
    case 'attempted':
      return 'played';
    default:
      return null;
  }
}

/**
 * Whether the card still shows the composition's words for an activity (X46, point 6): not once it is behind
 * the learner — completed, or tried and moved on from. The words were the reason before the item ("This lesson
 * asks for it — not counted yet", "last played on Tuesday") and are frozen with the card, so after it they could
 * only be stale, and were false once the run counted; the mark says what became of it. An activity still to do
 * keeps them: they are its purpose, and the card is the session's (`04` §2).
 */
export function showsReason(activity: Pick<RunActivity, 'state' | 'movedOn'>): boolean {
  return !(activity.state === 'completed' || (activity.state === 'attempted' && activity.movedOn === true));
}

export interface TransitionHost {
  router: Router;
  handle: SessionHandle;
  /** The host screen's own button, so the block looks like the sheet it sits on. */
  button: (label: string, onClick: () => void, id: string, primary: boolean) => HTMLElement;
  /** *Try again* on this screen: the host's own restart. */
  tryAgain: () => void;
  /** Before the screen is left for the next activity or Today (the host lets go of what it holds). */
  beforeLeaving?: () => void;
  now?: () => Date;
}

/**
 * Draws the transition into `into` from the stored record, and draws it again after every write it makes.
 * Resolves with what it drew; `none` leaves `into` empty, and the host keeps its own closing action.
 */
export async function drawTransition(into: HTMLElement, host: TransitionHost): Promise<TransitionView['kind']> {
  const now = host.now ?? (() => new Date());
  const read = await host.handle.record();
  // The session is about to offer its current activity: the learner's last word on that piece holds (G90).
  const run = read === null ? null : (await settleHeld(read, now(), offeredAfter(host.handle.token, now()))).run;
  const view = transitionView(run, host.handle.token, now());
  into.replaceChildren();
  into.dataset.sessionView = view.kind;
  if (view.kind === 'none' || view.kind === 'closed') {
    into.hidden = true;
    return view.kind;
  }
  into.hidden = false;
  const lines: HTMLElement[] = [];
  const actions = el('div.session-next__actions');
  const leave = (): void => {
    host.beforeLeaving?.();
  };
  const toToday = (): void => {
    leave();
    host.router.navigate('today');
  };
  const redraw = (): void => {
    void drawTransition(into, host);
  };
  /** A refused write: nothing was changed, and the view is reloaded from the record, said. */
  const refused = (): void => {
    void drawTransition(into, host).then(() => {
      into.prepend(el('p.session-next__note', { text: SESSION_TEXT.moved, 'data-session-refused': 'true' }));
    });
  };
  if (view.kind === 'finished') {
    lines.push(el('p.session-next__line', { text: SESSION_TEXT.lastOne }));
    lines.push(el('p.session-next__time.muted', { text: SESSION_TEXT.timeLine(minutesOf(view.run.elapsedMs), plannedMinutes(view.run)) }));
    actions.append(host.button(SESSION_TEXT.done, toToday, 'session-done', true));
    into.append(...lines, actions);
    return view.kind;
  }
  const time = el('p.session-next__time.muted', { text: SESSION_TEXT.timeLine(minutesOf(view.run.elapsedMs), plannedMinutes(view.run)) });
  for (const note of view.notes) lines.push(el('p.session-next__note', { text: note }));
  if (view.kind === 'kept-here') {
    into.dataset.sessionActivity = String(view.mine.index);
    actions.append(
      host.button(SESSION_TEXT.tryAgain, () => host.tryAgain(), 'session-try-again', true),
      host.button(
        SESSION_TEXT.moveOn,
        () => {
          void host.handle.write(expectedFor(view.run, view.mine.token), { kind: 'advance' }).then((result) => (result.ok ? redraw() : refused()));
        },
        'session-move-on',
        false,
      ),
    );
    into.append(...lines, time, actions);
    return view.kind;
  }
  const next = view.next;
  if (next === undefined) {
    // Moving on from the last activity: Done closes the session as finished, nothing failed.
    lines.push(el('p.session-next__line', { text: SESSION_TEXT.lastOne }));
    actions.append(
      host.button(
        SESSION_TEXT.done,
        () => {
          void host.handle.write(expectedFor(view.run, view.mine.token), { kind: 'advance' }).then(() => toToday());
        },
        'session-done',
        true,
      ),
    );
    into.append(...lines, time, actions);
    return view.kind;
  }
  into.dataset.sessionNext = String(next.index);
  into.dataset.sessionNextItem = next.slot.itemId;
  lines.push(el('p.session-next__line', { text: SESSION_TEXT.nextLine(next.slot.title, next.slot.minutes, next.reason) }));
  /** Opens the record's current activity once the moves before it are written. */
  const openCurrent = async (): Promise<void> => {
    const read = await host.handle.record();
    const settled = read === null ? null : await settleHeld(read, now());
    // A piece the learner paused since this screen was drawn is not opened on a screen that offered it: the
    // view is drawn again from the record, with the one after, said (G90).
    if (settled !== null && settled.withheld.length > 0) {
      redraw();
      return;
    }
    const fresh = settled?.run ?? null;
    const current = fresh?.current === null || fresh?.current === undefined ? undefined : fresh.activities[fresh.current];
    if (!fresh || !current) {
      toToday();
      return;
    }
    leave();
    const opened = await openActivity(host.router, fresh, current);
    if (!opened.ok) {
      into.prepend(el('p.session-next__note', { text: SESSION_TEXT.offerNotKept }));
    }
  };
  actions.append(
    host.button(
      SESSION_TEXT.start,
      () => {
        if (view.from === 'completed') {
          void openCurrent();
          return;
        }
        void host.handle.write(expectedFor(view.run, view.mine.token), { kind: 'advance' }).then((result) => (result.ok ? openCurrent() : refused()));
      },
      'session-start-next',
      true,
    ),
    host.button(
      SESSION_TEXT.skipOrChange,
      () => {
        void (async () => {
          if (view.from === 'moving-on') {
            const moved = await host.handle.write(expectedFor(view.run, view.mine.token), { kind: 'advance' });
            if (!moved.ok) {
              refused();
              return;
            }
          }
          const skipped = await host.handle.write(expectedFor(view.run, next.token), { kind: 'advance' });
          if (!skipped.ok) {
            refused();
            return;
          }
          toToday();
        })();
      },
      'session-skip',
      false,
    ),
  );
  into.append(...lines, time, actions);
  return view.kind;
}
