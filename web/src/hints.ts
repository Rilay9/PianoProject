// Tips the app gives when a feature is met (owner, 2026-10-15: no first-run tour; short hints at the moment, a help
// page, an install card on Home). One small store, `piano-web.hints.v1` (in the backup like every piano-web.* key;
// restore merges it object by object): which tips were seen or used, each with the app version that introduced it,
// and the install card's ✕.
//
// After an update only tips new in that update show (owner, 2026-10-15): a tip already done stays done. A tip's record
// counts only for the version it was written for: a tip given a newer `since` (new, or changed in an update) shows
// again once, by its own rule. "Show tips again" (Settings) clears the tips; the install card's ✕ stays (it is not a
// tip, and the owner chose "never comes back after ✕").
//
// The other three hints are not stored: the no-keyboard lines are states (said while true), the hands label is a
// label, and a mode's line answers the choice just made, every time.

const KEY = 'piano-web.hints.v1';

/** The tips that keep a record, each with the app version (its release date: the app has no other number) that introduced it. */
export const TIPS = {
  /** The score: "Tap the music to stop and get the controls back." The first 3 runs, or until a run is stopped by a tap on the music. */
  tapToStop: { id: 'tap-to-stop', since: '2026-10-15', runs: 3 },
} as const;
type Tip = (typeof TIPS)[keyof typeof TIPS];

interface TipRecord { since: string; shown?: number; done?: string }
interface Store { tips?: Record<string, TipRecord>; install?: { dismissed?: string; installed?: string } }

function read(): Store {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v as Store : {};
  } catch { return {}; } // (a broken value is the defaults: nothing seen)
}
function write(s: Store): void { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* no storage: tips just show again */ } }

/** The version a tip is at now (a check can make a tip look newer, as an update would: window.__pianoHintSince). */
function since(t: Tip): string {
  const fake = (window as unknown as { __pianoHintSince?: Record<string, string> }).__pianoHintSince?.[t.id];
  return typeof fake === 'string' ? fake : t.since;
}
/** This tip's record, if it is for the tip's current version (an older one: the tip is new again). */
function record(s: Store, t: Tip): TipRecord | undefined {
  const r = s.tips?.[t.id];
  return r && typeof r === 'object' && r.since === since(t) ? r : undefined;
}

/** The tip should show now: not done, and shown fewer times than its rule allows. */
export function tipDue(t: Tip): boolean {
  const r = record(read(), t);
  return !r?.done && (r?.shown ?? 0) < t.runs;
}
/** It was shown once more; at its count it is done. */
export function tipShown(t: Tip): void {
  const s = read(), r = record(s, t) ?? { since: since(t) };
  r.shown = (r.shown ?? 0) + 1;
  if (r.shown >= t.runs && !r.done) r.done = new Date().toISOString();
  write({ ...s, tips: { ...s.tips, [t.id]: r } });
}
/** The learner did what it teaches: done, never again (until Show tips again, or a newer version of the tip). */
export function tipUsed(t: Tip): void {
  const s = read(), r = record(s, t) ?? { since: since(t) };
  if (r.done) return;
  write({ ...s, tips: { ...s.tips, [t.id]: { ...r, done: new Date().toISOString() } } });
}
/** Settings → Show tips again: every tip shows again; the install card's ✕ stays. */
export function resetTips(): void {
  const s = read();
  delete s.tips;
  write(s);
}

/** The install card (Home, in a browser tab): ✕ pressed, or the app installed from this tab. */
export function installCardGone(): boolean { const i = read().install; return !!(i?.dismissed || i?.installed); }
export function installCardDismissed(how: 'dismissed' | 'installed'): void {
  const s = read();
  write({ ...s, install: { ...s.install, [how]: new Date().toISOString() } });
}
