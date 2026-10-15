// Where you are in the app (owner, 2026-10-15): Home is the root; a tab other than Home, a page (Settings, Exercises,
// a lesson) and a screen (a piece, Memorise, a drill, Simon, the lab, Free play, the metronome) each stand on top of
// where they were opened from, one history step each, so ← (or Done) and Android Back go back the same way: to the
// tab or the lesson page you came from. The library's page (upright) and the PDF reader keep their own steps
// (screens/library.ts, screens/pdf.ts); their history states carry no `nav` and are left to them.
//
// A place's `leave` undoes it when it is taken off (Back, ←, or its own Done, which calls `closedItself` instead
// so it is not closed twice). After every Back the app is told (`changed`) to show what is now on top.

export interface Place {
  /** 'tab', 'settings', 'exercises', 'lesson', or a screen: 'score', 'memorise', 'exercise', 'lab', 'freeplay', 'metronome'. */
  name: string;
  /** The address while it is on top (search parameters), so a reload comes back to it; none: the address stays. */
  params?: Record<string, string>;
  /** Taken off: close what it opened. */
  leave(): void;
  /** Anything else the place carries (the tab's name, the lesson's id). */
  [k: string]: unknown;
}

const stack: Place[] = [];
const closedAlready = new WeakSet<Place>();
let popping = false;
/** Called after Back took places off: show what is on top now. */
let changed: (popped: string[]) => void = () => {};

function address(params?: Record<string, string>): string {
  const url = new URL(location.href);
  if (params) url.search = new URLSearchParams(params).toString();
  return url.pathname + url.search;
}

/** Starts the stack at Home: this history entry becomes Home (the address loses what it was opened with). */
export function startNav(onChanged: (popped: string[]) => void): void {
  changed = onChanged;
  history.replaceState({ nav: 0 }, '', address({}));
}

export function push(p: Place): void {
  // A place with no address of its own (the result after a step, the Switch sheet) has the address of the place under it,
  // so whatever is opened over it builds on that (review re-check 2026-10-15, V33: a step started from the result's
  // Again or Next lost its lesson).
  const q = p.params ? p : { ...p, params: { ...(top()?.params ?? {}) } };
  stack.push(q);
  history.pushState({ nav: stack.length }, '', address(q.params));
}
/** The top place replaced by another (one tab for another): no new history step. */
export function replaceTop(p: Place): void {
  if (!stack.length) { push(p); return; }
  stack[stack.length - 1] = p;
  history.replaceState({ nav: stack.length }, '', address(p.params));
}
export const top = (): Place | undefined => stack[stack.length - 1];
export const places = (): readonly Place[] => stack;
/** ← : the same as Android Back; then: done once the place is off (and what is under it shown). */
let afterBack: (() => void) | null = null;
export function back(then?: () => void): void { if (!stack.length) { then?.(); return; } afterBack = then ?? null; history.back(); }
/** The params of the place on top (or Home's: none), for a place opened over it to carry them on. */
export const topParams = (): Record<string, string> => ({ ...(top()?.params ?? {}) });
/** A screen closed itself (its Done): its step is taken off without closing it again. */
export function closedItself(name: string): void {
  const t = top();
  if (popping || !t || t.name !== name) return;
  closedAlready.add(t);
  history.back();
}

window.addEventListener('popstate', (e) => {
  const d = (e.state as { nav?: unknown } | null)?.nav;
  if (typeof d !== 'number') return; // the library's or the PDF reader's own step, or an entry from before
  if (d > stack.length) { history.back(); return; } // a step left over from before a reload: on past it
  if (d === stack.length) return;
  const popped: string[] = [];
  while (stack.length > d) {
    const p = stack.pop()!;
    popped.push(p.name);
    if (closedAlready.has(p)) continue;
    popping = true;
    try { p.leave(); } finally { popping = false; }
  }
  changed(popped);
  const then = afterBack;
  afterBack = null;
  then?.();
});
