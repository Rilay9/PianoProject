// Screens are plain factory functions returning a DOM node, and the app shell
// throws the previous node away on every route change. Anything that
// subscribes to a long-lived object (the shared WebMidiSource, the metronome)
// therefore needs somewhere to unsubscribe, or the listeners pile up for the
// life of the page.
//
// A WeakMap keyed by the screen element keeps that bookkeeping out of the
// screen factories' return type, so the four P0 screens stay untouched.

const disposers = new WeakMap<HTMLElement, (() => void)[]>();

/** Registers cleanup to run when `el` is removed by the app shell. */
export function onScreenDispose(el: HTMLElement, fn: () => void): void {
  const existing = disposers.get(el);
  if (existing) existing.push(fn);
  else disposers.set(el, [fn]);
}

/** Runs and clears every disposer registered for `el`. Safe to call twice. */
export function disposeScreen(el: HTMLElement | null | undefined): void {
  if (!el) return;
  const fns = disposers.get(el);
  if (!fns) return;
  disposers.delete(el);
  for (const fn of fns) fn();
}

// --- suspended while hidden (X15) -------------------------------------------
//
// A practice surface meets four states beside disposal: playing, between
// attempts, suspended and completed (backlog X15, Part 19). This is the
// suspended half, shared by Drill, PDF, Chord Chart and Lab: hidden — the
// phone locked, another app in front, the tab in the background — stops what
// advances and what sounds; visible puts the screen back where it was, with
// no backlog, no skipped material and no hidden time counted. What "where it
// was" means is each screen's own (the bar it was in, the system it was on, a
// prompt that waits to be asked for again), so the screens say what to do and
// this says when.
//
// Score keeps its own handler, and the session-wide clock in
// `sessionRunner.ts` keeps its own. `activeClock` below is the screen-attempt
// sibling of that clock, not a second instance of it (the reviewer's Part 20
// owners' ruling: session time and a card's practice time stay distinct).

/** True while the page cannot be seen. */
export function pageHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/**
 * Calls `hidden` once per hidden span and `visible` once per return.
 *
 * `visibilitychange` carries both. `pagehide` is a second hidden — the pair
 * `sessionRunner.ts`'s clock listens for as well — and `pageshow` the return
 * from the back-forward cache. A `pagehide` after the page has already gone
 * hidden does not call `hidden` twice, and nothing calls `visible` while the
 * document still says hidden.
 */
function watchVisibility(hidden: () => void, visible: () => void): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => undefined;
  let isHidden = pageHidden();
  const goHidden = (): void => {
    if (isHidden) return;
    isHidden = true;
    hidden();
  };
  const goVisible = (): void => {
    if (!isHidden || pageHidden()) return;
    isHidden = false;
    visible();
  };
  const onVisibility = (): void => {
    if (pageHidden()) goHidden();
    else goVisible();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', goHidden);
  window.addEventListener('pageshow', goVisible);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', goHidden);
    window.removeEventListener('pageshow', goVisible);
  };
}

export interface SuspendHandlers {
  /** The page went hidden: stop whatever advances or sounds on its own. */
  onHidden: () => void;
  /**
   * The page is visible again. Called after an `onHidden`, or on the first
   * return of a screen mounted while hidden, so each screen's resume checks
   * what it holds rather than assuming it holds something.
   */
  onVisible: () => void;
}

/**
 * Suspends a practice surface while the page is hidden (X15).
 *
 * Unsubscribed with the screen; the returned function unsubscribes early.
 */
export function onScreenSuspend(el: HTMLElement, handlers: SuspendHandlers): () => void {
  let live = true;
  const stop = watchVisibility(
    () => {
      if (live) handlers.onHidden();
    },
    () => {
      if (live) handlers.onVisible();
    },
  );
  const unsubscribe = (): void => {
    if (!live) return;
    live = false;
    stop();
  };
  onScreenDispose(el, unsubscribe);
  return unsubscribe;
}

/** Visible time since the last `restart()`: one attempt's practice time. */
export interface ActiveClock {
  /** Whole milliseconds the page was visible since the last restart. */
  elapsedMs(): number;
  /** Zero, from now: a new attempt. */
  restart(): void;
  /** Stops listening; the reading stays where it was. */
  dispose(): void;
}

/**
 * An attempt's clock that counts only visible time (X15, Part 20 §4).
 *
 * The same accounting as the session clock in `sessionRunner.ts` — a visible
 * span is banked when the page hides, a hidden span adds nothing — kept apart
 * from it on purpose: that one is the session's guided time, written to the
 * stored run; this is one card's duration, read when the card's row is
 * written. `tests/unit/screenLifecycle.test.ts` runs both over one hidden span
 * so the two keep agreeing. Disposed with `el` where one is given.
 */
export function activeClock(el?: HTMLElement): ActiveClock {
  const now = (): number => performance.now();
  let banked = 0;
  let visibleSince: number | null = pageHidden() ? null : now();
  let stopped = false;
  const bank = (): void => {
    if (visibleSince === null) return;
    const at = now();
    banked += at - visibleSince;
    visibleSince = at;
  };
  const stopWatching = watchVisibility(
    () => {
      bank();
      visibleSince = null;
    },
    () => {
      if (!stopped) visibleSince = now();
    },
  );
  const clock: ActiveClock = {
    elapsedMs() {
      bank();
      return Math.round(banked);
    },
    restart() {
      banked = 0;
      visibleSince = stopped || pageHidden() ? null : now();
    },
    dispose() {
      if (stopped) return;
      bank();
      visibleSince = null;
      stopped = true;
      stopWatching();
    },
  };
  if (el) onScreenDispose(el, () => clock.dispose());
  return clock;
}
