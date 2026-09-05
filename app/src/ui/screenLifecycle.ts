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
