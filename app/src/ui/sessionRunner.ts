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
 */
import type { Router } from '../router';
import {
  applySessionEvent,
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
import { contactOf } from '../curriculum/session';
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
    return { kind: 'next', run, mine, from: 'moving-on', ...(at === null ? {} : { next: run.activities[at] as RunActivity }), notes: repurposed };
  }
  const next = run.current === null ? undefined : run.activities[run.current];
  // The runner's own change after this activity, said: a controlled practice skipped for easy success.
  const skipped = run.activities
    .filter((activity) => activity.index > mine.index && (next === undefined || activity.index < next.index))
    .flatMap((activity) => activity.adaptations.filter((one) => one.kind === 'skipped-redundant').map((one) => one.why));
  return { kind: 'next', run, mine, from: 'completed', ...(next ? { next } : {}), notes: [...repurposed, ...skipped] };
}

/** Minutes, rounded, from the visible-time clock. */
export function minutesOf(ms: number): number {
  return Math.round(ms / 60_000);
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
  const run = await host.handle.record();
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
    const fresh = await host.handle.record();
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
