/**
 * Today's session, run (X1; Part 18; L32, X9; the brief `docs/prompts/tasks/X1-today-the-teachers-screen.md`,
 * approved with its required change, `docs/review/responses/bf8de2d2.md`).
 *
 * C6 composes a lesson; until X1 the learner met it as separate launches: *Start session* opened the
 * first row, Done went back to Today, and where they were in the lesson lived nowhere. This module is the
 * one small durable record of today's lesson as it is being run — which activities, in which order, why
 * each is there, the current one, what happened to each, what the runner changed and why, the time spent,
 * and whether the learner ended it on purpose — and the one place its transitions are decided.
 *
 * - **One record, one key** (the reviewer's answer to question 1): the `settings` store's key-value row
 *   `SESSION_RUN_KEY`, the offer snapshot's pattern (`offerSnapshot.ts`): no object store and no
 *   `DB_VERSION`. It holds the composition as it was when *Start session* was pressed — each slot's item id,
 *   title, minutes, the composition's own words and the route that opens it — never live catalogue objects,
 *   so a catalogue or evidence change never rebuilds a running session.
 * - **Read, validated** (`validateRun`): a value from an older page is data, checked before use; a corrupt or
 *   old-shaped record is discarded with its reason logged, and Today shows the card as composed.
 * - **Every write validated** by the session id, the composition's version and the activity token
 *   (`apply`), inside one read-write transaction (`applySessionEvent`), so a late callback from a finished
 *   activity, a stale tab or a recomposed card can never advance or overwrite the record; the refusal names
 *   why and the caller reloads the record instead.
 * - **Never evidence.** Session completion, skipping and adaptation are the runner's facts, not
 *   competence: nothing in `evidence/`, `rungState.ts` or `progressStore.ts` reads this module or its key
 *   (`sessionRunNeverEvidence.test.ts` holds it, with a mutant that feeds a finished session to the ladder).
 * - `detour` is X19's (the practice episode) and stays `null`.
 * - **The learner's word on a piece reaches the run as an event, never as a read** (G90): this module reads no
 *   project. The runner (`sessionRunner.settleHeld`) reads the project when the session is about to offer an
 *   activity, and says `withhold` where the piece was paused or put away after *Start session*; `apply` steps
 *   past a pending activity the composition chose and refuses every other.
 *
 * The words the runner records on an adaptation are `help.ts`'s (`SESSION_TEXT`), so the record and the
 * screens say one thing.
 */
import { openDatabase } from './db';
import { setMeasured } from './accuracyReading';
import type { ReadingMoves } from './db';
import { dayKey, type Contact } from './progressStore';
import type { SlotKind } from '../curriculum/session';
import type { Relationship } from '../curriculum/transfer';
import type { Identity } from '../review/record';
import { SESSION_TEXT } from '../ui/help';

/** The `settings` key the one record lives under. */
export const SESSION_RUN_KEY = 'pianopath.sessionRun';

/** The record's shape version: a stored value of any other is old-shaped and discarded. */
export const SESSION_RUN_FORMAT = 1;

export type ActivityState = 'pending' | 'active' | 'attempted' | 'completed' | 'skipped';

/**
 * What an activity assumed about the learner's contact with its material when the card was composed (G2's
 * one adapter, `session.contactOf`): `first-contact` where the activity's point is that the material is new
 * (the reading slot's phrase, the transfer offer); `met` where the learner has met it; `none` where nothing
 * rests on novelty.
 */
export type ContactAssumed = 'first-contact' | 'met' | 'none';

/** The two target forms the composition's guided slots can hold (the protocol table): a Score-screen run or a drill. */
export type ActivityTarget = 'score' | 'drill';

/** How the runner opens an activity: the route the composition gave its slot, kept as it was. */
export interface ActivityRoute {
  target: ActivityTarget;
  itemId: string;
  /** The rung the run is judged by (C5, L50), where the card named one. */
  rung?: string;
  /** A reading phrase's seed (C4). */
  seed?: number;
  /** A reading or retention phrase's recipe (C4, C6). */
  recipe?: { moved?: ReadingMoves; easy?: true };
  /** The transfer offer as composed (D4, D4a): written to the offer snapshot when the runner opens it. */
  transfer?: { skill: string; relationship: Relationship; contact: Contact; material?: Identity };
}

/** The composed slot an activity is, as the card showed it. */
export interface ActivitySlot {
  kind: SlotKind;
  itemId: string;
  title: string;
  minutes: number;
  /**
   * What chose the item, as far as the adaptation reads it: the claim's kind and the demand or skill it names.
   * Present on every item the composition chose (each slot of a composed card carries the claim that chose it,
   * the reading slot's as `reader`); absent on one the learner chose — a swap's slot has none. That is how the
   * runner tells what the session offers on its own (`isAutomatic`) from what the learner picked (G90).
   */
  claim?: { kind: string; demand?: string; skill?: string };
  /** The rung the slot was offered from. */
  lessonId?: string;
}

export interface Adaptation {
  /**
   * `skipped-redundant`: the runner skipped the activity before it began, and `why` says why — an easy success
   * made the controlled practice after it redundant (`SESSION_TEXT.easier`), or the learner's word on its piece
   * withdrew it after *Start session* (G90: paused or put away on the piece's sheet, `SESSION_TEXT.withheld`).
   * The transition says each, in the learner's words, from the same place. `kept-here`: a measured failure held
   * the learner on the activity. `repurposed`: a first contact was met before it began.
   */
  kind: 'skipped-redundant' | 'kept-here' | 'repurposed';
  /** In the learner's words, as the transition says it (`SESSION_TEXT`). */
  why: string;
}

/** What the stored run of an activity measured, as far as the two adaptations may read it. */
export type Outcome = 'passed-full' | 'failed' | 'unknown';

export interface RunActivity {
  /** Its place among the activities. */
  index: number;
  /** Its place on the card, among every slot shown (activities and the prompts outside the cursor). */
  order: number;
  /** This activity instance: carried by its route (`?session=`) and by every event its screen reports. */
  token: string;
  slot: ActivitySlot;
  route: ActivityRoute;
  /** The composition's own words for the slot: the transition's reason, and nothing else (the reviewer's ruling). */
  reason: string;
  contact?: { assumed: ContactAssumed; rechecked?: 'held' | 'invalidated' };
  state: ActivityState;
  /** What the runner changed about it and why, in order. */
  adaptations: Adaptation[];
  /** The last completed run's outcome and how many runs completed in this activity. */
  result?: { outcome: Outcome; attempts: number };
  /**
   * The learner moved on from it after trying it (*Move on anyway*, *Start* on a stopped drill's sheet). An
   * activity tried and left for another row (a drill starts as it opens) is not moved on from: it is offered
   * again after the one chosen, as an untouched one is.
   */
  movedOn?: true;
  /** Visible time on its screen. */
  elapsedMs: number;
}

/**
 * A slot the card showed that is no activity (the protocol table): the free-play prompt, and an item whose
 * screen owns no honest finish in X1 — a PDF, a placeholder, the guided tour whose steps leave the drill
 * screen. Never current, never complete, counted nowhere; an item here opens from the card outside the session.
 */
export interface OutsideEntry {
  order: number;
  kind: SlotKind;
  title: string;
  minutes: number;
  words: string;
  itemId?: string;
}

export type ClosedWhy = 'finished' | 'ended' | 'not-finished' | 'recomposed';

export interface SessionRun {
  format: typeof SESSION_RUN_FORMAT;
  /** `dayKey` of the day it was started: a run is today's or it is closed. */
  day: string;
  /** Minted when *Start session* is pressed. */
  sessionId: string;
  /** The composition's version: the card as composed at that moment (`compositionVersion`). */
  version: string;
  activities: RunActivity[];
  outside: OutsideEntry[];
  /** The activity the learner is on or will do next; `null` once none is left. */
  current: number | null;
  startedAt: string;
  /** Visible time on the activities' screens, summed; never wall time since the start. */
  elapsedMs: number;
  endedOnPurpose?: true;
  closed?: { why: ClosedWhy; at: string };
  /** X19's practice episode: reserved, and always `null` in X1. */
  detour: null;
  /** The two-hour card's break (`02` §8), as composed: after this many rows. */
  breakAfter?: number;
}

/** What the screens and Today say when they write: the session, the composition and the activity instance. */
export interface Expected {
  sessionId: string;
  version: string;
  token: string;
}

export type RunEvent =
  /** The activity's screen is open with its token. */
  | { kind: 'opened' }
  /** The start-time recheck of a first-contact assumption (G2's adapter, read by the runner). */
  | { kind: 'recheck'; verdict: 'held' | 'invalidated'; why?: string }
  /** The run's count-in passed, or the drill started. */
  | { kind: 'attempted' }
  /** A run of the activity reached its end and is stored. */
  | { kind: 'completed'; outcome: Outcome }
  /** The learner moves on from the current activity without completing it (*Move on anyway*, *Skip or change*). */
  | { kind: 'advance' }
  /**
   * The runner steps past the activity the token names before it begins, because the learner's word on its
   * piece withdrew it after *Start session* (G90: paused or put away on the piece's sheet). `why` is the reason
   * in the learner's words. Addressed by token like `choose` and `swap`: the offer withdrawn is the current
   * activity, or the one after a stopped activity that a transition offers. Refused for an activity underway
   * and for one the learner chose themselves: it is the session's own offer that is withdrawn, never a start
   * the learner made or a piece they picked.
   */
  | { kind: 'withhold'; why: string }
  /** The activity the token names becomes current (a row tapped on Today). */
  | { kind: 'choose' }
  /** The learner swapped the activity the token names for another item (Today's swap sheet). */
  | { kind: 'swap'; slot: ActivitySlot; route: ActivityRoute; reason: string; contact?: RunActivity['contact']; token: string }
  /** Visible time on the current activity's screen. */
  | { kind: 'accrue'; ms: number }
  /** The learner ended the session on purpose. */
  | { kind: 'end' };

export type Refusal = 'none' | 'closed' | 'other-day' | 'other-session' | 'other-version' | 'stale-token' | 'illegal';

export type ApplyResult = { ok: true; run: SessionRun } | { ok: false; why: Refusal; run: SessionRun | null };

/** The most one flush of the clock may add: a suspended page whose timers stopped is not a minute practised. */
export const MAX_ACCRUAL_MS = 60_000;

const SLOT_KINDS: ReadonlySet<unknown> = new Set(['technique', 'review', 'new', 'repertoire', 'jam', 'free', 'sightreading']);
const STATES: ReadonlySet<unknown> = new Set(['pending', 'active', 'attempted', 'completed', 'skipped']);
const TARGETS: ReadonlySet<unknown> = new Set(['score', 'drill']);
const ASSUMED: ReadonlySet<unknown> = new Set(['first-contact', 'met', 'none']);
const ADAPTATIONS: ReadonlySet<unknown> = new Set(['skipped-redundant', 'kept-here', 'repurposed']);
const OUTCOMES: ReadonlySet<unknown> = new Set(['passed-full', 'failed', 'unknown']);
const CLOSED: ReadonlySet<unknown> = new Set(['finished', 'ended', 'not-finished', 'recomposed']);

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;
const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isText = (value: unknown): value is string => typeof value === 'string';

/** Why a stored value is not a run, or null where it is one. */
function activityFault(raw: unknown, at: number): string | null {
  if (!isObject(raw)) return `activity ${String(at)} is not an object`;
  if (raw.index !== at) return `activity ${String(at)} has index ${String(raw.index)}`;
  if (!isCount(raw.order) || !isText(raw.token) || raw.token === '' || !isText(raw.reason)) return `activity ${String(at)} lacks its order, token or reason`;
  const slot = raw.slot;
  if (!isObject(slot) || !SLOT_KINDS.has(slot.kind) || !isText(slot.itemId) || !isText(slot.title) || !isTime(slot.minutes)) return `activity ${String(at)} has no slot`;
  const route = raw.route;
  if (!isObject(route) || !TARGETS.has(route.target) || !isText(route.itemId)) return `activity ${String(at)} has no route`;
  if (!STATES.has(raw.state)) return `activity ${String(at)} has state ${String(raw.state)}`;
  if (!Array.isArray(raw.adaptations) || !raw.adaptations.every((one) => isObject(one) && ADAPTATIONS.has(one.kind) && isText(one.why))) return `activity ${String(at)} has malformed adaptations`;
  if (raw.contact !== undefined && (!isObject(raw.contact) || !ASSUMED.has(raw.contact.assumed))) return `activity ${String(at)} has a malformed contact`;
  if (raw.result !== undefined && (!isObject(raw.result) || !OUTCOMES.has(raw.result.outcome) || !isCount(raw.result.attempts))) return `activity ${String(at)} has a malformed result`;
  if (!isTime(raw.elapsedMs)) return `activity ${String(at)} has no time`;
  if (raw.movedOn !== undefined && raw.movedOn !== true) return `activity ${String(at)} has a malformed moving on`;
  return null;
}

/**
 * The stored value as a run, or why it is not one (the reviewer's constraint: runtime-validated, old or
 * corrupt data discarded, never trusted).
 */
export function validateRun(raw: unknown): { ok: true; run: SessionRun } | { ok: false; why: string } {
  if (!isObject(raw)) return { ok: false, why: 'not an object' };
  if (raw.format !== SESSION_RUN_FORMAT) return { ok: false, why: `format ${String(raw.format)}, not ${String(SESSION_RUN_FORMAT)}` };
  if (!isText(raw.day) || !isText(raw.sessionId) || !isText(raw.version) || !isText(raw.startedAt)) return { ok: false, why: 'no day, session id, version or start' };
  if (!Array.isArray(raw.activities) || raw.activities.length === 0) return { ok: false, why: 'no activities' };
  for (let at = 0; at < raw.activities.length; at += 1) {
    const fault = activityFault(raw.activities[at], at);
    if (fault) return { ok: false, why: fault };
  }
  if (
    !Array.isArray(raw.outside) ||
    !raw.outside.every((one) => isObject(one) && isCount(one.order) && SLOT_KINDS.has(one.kind) && isText(one.title) && isTime(one.minutes) && isText(one.words) && (one.itemId === undefined || isText(one.itemId)))
  ) {
    return { ok: false, why: 'malformed prompts outside the cursor' };
  }
  const current = raw.current;
  if (current !== null && !(isCount(current) && current < raw.activities.length)) return { ok: false, why: `current ${JSON.stringify(current) ?? 'undefined'} is no activity` };
  if (!isTime(raw.elapsedMs)) return { ok: false, why: 'no time' };
  if (raw.closed !== undefined && (!isObject(raw.closed) || !CLOSED.has(raw.closed.why) || !isText(raw.closed.at))) return { ok: false, why: 'malformed closing' };
  if (raw.detour !== null) return { ok: false, why: 'a detour (X19) where none is reserved' };
  if (raw.breakAfter !== undefined && !isCount(raw.breakAfter)) return { ok: false, why: 'malformed break' };
  return { ok: true, run: raw as unknown as SessionRun };
}

/**
 * The composition's version (the brief's item 1): the card as composed — each slot's kind, item and
 * minutes, in order — so the same card is the same version and a recomposed card another.
 */
export function compositionVersion(slots: readonly { kind: string; minutes: number; itemId?: string }[]): string {
  const text = slots.map((slot) => `${slot.kind}:${slot.itemId ?? ''}:${String(slot.minutes)}`).join('|');
  // FNV-1a, 32 bits: a short stable name for the card, not a security property.
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${hash.toString(36)}.${String(slots.length)}`;
}

/** An activity as Today hands it over at *Start session*: the slot, its route, its words and its contact assumption. */
export interface ActivityEntry {
  order: number;
  token: string;
  slot: ActivitySlot;
  route: ActivityRoute;
  reason: string;
  contact?: { assumed: ContactAssumed };
}

/** A new run from the card as composed at *Start session*: the first activity current and pending. */
export function newRun(input: {
  day: string;
  sessionId: string;
  version: string;
  startedAt: string;
  activities: readonly ActivityEntry[];
  outside: readonly OutsideEntry[];
  breakAfter?: number;
}): SessionRun {
  return {
    ...(input.breakAfter === undefined ? {} : { breakAfter: input.breakAfter }),
    format: SESSION_RUN_FORMAT,
    day: input.day,
    sessionId: input.sessionId,
    version: input.version,
    activities: input.activities.map((entry, index) => ({
      index,
      order: entry.order,
      token: entry.token,
      slot: structuredClone(entry.slot),
      route: structuredClone(entry.route),
      reason: entry.reason,
      ...(entry.contact ? { contact: { assumed: entry.contact.assumed } } : {}),
      state: 'pending' as const,
      adaptations: [],
      elapsedMs: 0,
    })),
    outside: input.outside.map((one) => ({ ...one })),
    current: input.activities.length > 0 ? 0 : null,
    startedAt: input.startedAt,
    elapsedMs: 0,
    detour: null,
  };
}

/** Still to do: untouched, or opened or tried and left for another row without moving on from it. */
function stillToDo(activity: RunActivity | undefined): boolean {
  if (activity === undefined) return false;
  return activity.state === 'pending' || ((activity.state === 'active' || activity.state === 'attempted') && activity.movedOn !== true);
}

/**
 * The next activity to offer after `from`: the first still to do after it in the card's order, else the first
 * still to do before it (a row the learner passed over by choosing another), else none.
 */
export function nextPending(run: SessionRun, from: number): number | null {
  const n = run.activities.length;
  for (let i = from + 1; i < n; i += 1) if (stillToDo(run.activities[i])) return i;
  for (let i = 0; i < Math.min(from, n); i += 1) if (stillToDo(run.activities[i])) return i;
  return null;
}

/**
 * Whether the composition chose this activity, so the session's own offer of it can be withdrawn (G90): it
 * carries the claim that chose it. A swap's activity does not — the learner picked it, with the sheet marking
 * a piece they had paused or put away (G94) — and a row the learner taps is their own start. The runner
 * withdraws only what it offered itself.
 */
export function isAutomatic(activity: Pick<RunActivity, 'slot'>): boolean {
  return activity.slot.claim !== undefined;
}

/** The measured demand a slot's claim names: a demand step's, or a demand-ready piece's. */
function namedDemand(claim: ActivitySlot['claim']): string | undefined {
  return claim !== undefined && (claim.kind === 'demand' || claim.kind === 'ready') ? claim.demand : undefined;
}

/**
 * The easy-success rule's second half (the reviewer's constraint, exactly): the activity immediately after
 * `done` is controlled practice — the composition's demand step — of the same measured demand `done`'s
 * claim names. A skill claim names no demand, so it is never "the same measured demand".
 */
export function redundantAfter(done: RunActivity, next: RunActivity | undefined): boolean {
  if (next === undefined || next.index !== done.index + 1 || next.state !== 'pending') return false;
  const demand = namedDemand(done.slot.claim);
  return demand !== undefined && next.slot.claim?.kind === 'demand' && next.slot.claim.demand === demand;
}

function clone(run: SessionRun): SessionRun {
  return structuredClone(run);
}

function close(run: SessionRun, why: ClosedWhy, now: Date): void {
  run.closed = { why, at: now.toISOString() };
  run.current = null;
}

/**
 * One event applied to a run, or why it is refused (pure). The refusals, in order: no run; a closed run; a
 * run of another day; another session; another composition; a token that is not the current activity's
 * (not any activity's, for `choose`, `swap` and `withhold`); an event the activity's state does not allow.
 */
export function apply(stored: SessionRun | null, expected: Expected, event: RunEvent, now: Date): ApplyResult {
  if (stored === null) return { ok: false, why: 'none', run: null };
  if (stored.closed) return { ok: false, why: 'closed', run: stored };
  if (stored.day !== dayKey(now)) return { ok: false, why: 'other-day', run: stored };
  if (stored.sessionId !== expected.sessionId) return { ok: false, why: 'other-session', run: stored };
  if (stored.version !== expected.version) return { ok: false, why: 'other-version', run: stored };
  const run = clone(stored);
  if (event.kind === 'end') {
    for (const activity of run.activities) if (activity.state === 'active') activity.state = 'pending';
    run.endedOnPurpose = true;
    close(run, 'ended', now);
    return { ok: true, run };
  }
  if (event.kind === 'choose' || event.kind === 'swap') {
    const target = run.activities.find((activity) => activity.token === expected.token);
    if (!target) return { ok: false, why: 'stale-token', run: stored };
    // A done activity is opened outside the session, never re-entered: completion is not undone.
    if (target.state === 'completed') return { ok: false, why: 'illegal', run: stored };
    if (event.kind === 'swap') {
      target.slot = structuredClone(event.slot);
      target.route = structuredClone(event.route);
      target.reason = event.reason;
      if (event.contact) target.contact = { ...event.contact };
      else delete target.contact;
      target.token = event.token;
      target.state = 'pending';
      target.adaptations = [];
      delete target.result;
      return { ok: true, run };
    }
    const was = run.current === null ? undefined : run.activities[run.current];
    // Leaving an opened activity for another is a reordering, not a skip.
    if (was && was !== target && was.state === 'active') was.state = 'pending';
    if (target.state === 'skipped') target.state = 'pending';
    run.current = target.index;
    return { ok: true, run };
  }
  if (event.kind === 'withhold') {
    // Addressed by token, not by the cursor: the transition after a stopped activity offers the one *after*
    // it, which the cursor has not reached, and that offer is withdrawn where it is made.
    const target = run.activities.find((activity) => activity.token === expected.token);
    if (!target) return { ok: false, why: 'stale-token', run: stored };
    // The session's own offer, before it began: an opened or tried activity is underway and the learner is in
    // it (never interrupted), and one without a claim is the learner's own pick (never overruled).
    if (target.state !== 'pending' || !isAutomatic(target)) return { ok: false, why: 'illegal', run: stored };
    target.state = 'skipped';
    target.adaptations.push({ kind: 'skipped-redundant', why: event.why });
    // Only the activity the cursor is on moves it; one ahead of it is passed over when the cursor reaches it.
    if (run.current === target.index) {
      const next = nextPending(run, target.index);
      run.current = next;
      if (next === null) close(run, 'finished', now);
    }
    return { ok: true, run };
  }
  const current = run.current === null ? undefined : run.activities[run.current];
  if (!current || current.token !== expected.token) return { ok: false, why: 'stale-token', run: stored };
  switch (event.kind) {
    case 'opened':
      if (current.state === 'pending') current.state = 'active';
      return { ok: true, run };
    case 'recheck':
      // At the activity's start, once: a recheck already made stands.
      if (!current.contact || current.contact.rechecked !== undefined) return { ok: true, run };
      current.contact.rechecked = event.verdict;
      if (event.verdict === 'invalidated') current.adaptations.push({ kind: 'repurposed', why: event.why ?? SESSION_TEXT.repurposed('met') });
      return { ok: true, run };
    case 'attempted':
      if (current.state === 'pending' || current.state === 'active') current.state = 'attempted';
      return { ok: true, run };
    case 'accrue': {
      const ms = Math.min(MAX_ACCRUAL_MS, Math.max(0, Math.round(event.ms)));
      run.elapsedMs += ms;
      current.elapsedMs += ms;
      return { ok: true, run };
    }
    case 'completed': {
      const attempts = (current.result?.attempts ?? 0) + 1;
      if (event.outcome === 'failed') {
        // Failure keeps the learner here, said; nothing else on the card changes.
        current.state = 'attempted';
        current.result = { outcome: 'failed', attempts };
        if (!current.adaptations.some((one) => one.kind === 'kept-here')) current.adaptations.push({ kind: 'kept-here', why: SESSION_TEXT.keptHere });
        return { ok: true, run };
      }
      current.state = 'completed';
      current.result = { outcome: event.outcome, attempts };
      let next = nextPending(run, current.index);
      // Easy success on the first attempt, measured at the full standard, skips only an immediately
      // following controlled practice of the same measured demand; an unknown result never does.
      const following = next === null ? undefined : run.activities[next];
      if (event.outcome === 'passed-full' && attempts === 1 && following && redundantAfter(current, following)) {
        following.state = 'skipped';
        following.adaptations.push({ kind: 'skipped-redundant', why: SESSION_TEXT.easier(following.slot.title) });
        next = nextPending(run, following.index);
      }
      run.current = next;
      if (next === null) close(run, 'finished', now);
      return { ok: true, run };
    }
    case 'advance': {
      // Moving on never fails anything: an activity tried stays tried, one never tried is the learner's skip.
      if (current.state === 'pending' || current.state === 'active') current.state = 'skipped';
      else if (current.state === 'attempted') current.movedOn = true;
      const next = nextPending(run, current.index);
      run.current = next;
      if (next === null) close(run, 'finished', now);
      return { ok: true, run };
    }
  }
}

/** A run closed without an event: another day's (not finished, no judgement) or a recomposed card's. */
export function closedRun(stored: SessionRun, why: 'not-finished' | 'recomposed', now: Date): SessionRun {
  const run = clone(stored);
  for (const activity of run.activities) if (activity.state === 'active') activity.state = 'pending';
  close(run, why, now);
  return run;
}

/** The planned minutes of the guided activities (the free prompt counts nowhere). */
export function plannedMinutes(run: SessionRun): number {
  return run.activities.reduce((sum, activity) => sum + activity.slot.minutes, 0);
}

/** A run still going: no closing (the narrowing `isOpen` gives, which leaves a closed run a run when it answers false). */
export type OpenSessionRun = SessionRun & { closed?: undefined };

/** Whether the run is today's and still going. */
export function isOpen(run: SessionRun | null, now: Date): run is OpenSessionRun {
  return run !== null && run.closed === undefined && run.day === dayKey(now);
}

// --- outcomes, as the adaptations may read them -----------------------------------------------------

/**
 * A Score-screen run's outcome as stored (the protocol table): `passed-full` only for a run the app
 * measured at the full standard — heard, not estimated, tempo measured, passed, never a self-report or a
 * rhythm run; `failed` for such a measured run that did not pass; `unknown` for anything else (nothing
 * heard, a self-report, a Wait run that measures no tempo, a sight-read of a phrase met before), which
 * drives neither adaptation.
 */
export function scoreOutcome(run: {
  passed: boolean;
  accuracy: number | string;
  accuracyEstimated?: boolean;
  tempoMeasured?: boolean;
  selfReport?: unknown;
  selfPassed?: boolean;
  rhythmOnly?: boolean;
  unseen?: boolean;
  firstContact?: boolean;
  recipe?: unknown;
}): Outcome {
  if (run.selfReport !== undefined || run.selfPassed === true || run.rhythmOnly === true) return 'unknown';
  if (typeof run.accuracy !== 'number' || run.accuracyEstimated === true || run.tempoMeasured !== true) return 'unknown';
  // A phrase met before is practice, kept as such: its reading is refused, not failed.
  if (run.recipe !== undefined && (run.unseen === false || run.firstContact === false)) return 'unknown';
  return run.passed ? 'passed-full' : 'failed';
}

/**
 * A drill's outcome (the protocol table): its judged result where it judges; one that judges nothing, or answered
 * nothing, has none. "Answered nothing" is the record's own reading of the set (`setMeasured`, U102), so the
 * session and the stored row say one thing.
 */
export function drillOutcomeOf(outcome: { judged: boolean; passed: boolean }, answered: number): Outcome {
  if (!setMeasured({ judged: outcome.judged, answered })) return 'unknown';
  return outcome.passed ? 'passed-full' : 'failed';
}

// --- the store ------------------------------------------------------------------------------------

/** The record when there is no database: this page's memory, for the visit. */
let memory: unknown;
const listeners = new Set<(run: SessionRun | null) => void>();

/** Test hook: forgets the in-memory record. */
export function resetSessionRunForTest(): void {
  memory = undefined;
  listeners.clear();
}

/** Called with the stored run after every accepted write on this page (Today redraws from it). */
export function onSessionRunChange(listener: (run: SessionRun | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(run: SessionRun | null): void {
  for (const listener of [...listeners]) listener(run);
}

export type SessionRunRead = { kind: 'run'; run: SessionRun } | { kind: 'none' } | { kind: 'discarded'; why: string };

/** The stored value, validated: a corrupt or old-shaped one is discarded, its reason logged, and reads as none. */
export async function readSessionRun(): Promise<SessionRunRead> {
  const db = await openDatabase();
  const raw: unknown = db ? await db.get('settings', SESSION_RUN_KEY) : memory;
  if (raw === undefined || raw === null) return { kind: 'none' };
  const checked = validateRun(raw);
  if (checked.ok) return { kind: 'run', run: checked.run };
  console.warn(`Today's session record was discarded: ${checked.why}`);
  if (db) await db.delete('settings', SESSION_RUN_KEY);
  else memory = undefined;
  return { kind: 'discarded', why: checked.why };
}

/** Keeps a new run over whatever was stored (*Start session*: a new session, never a silent rebuild of the old). */
export async function startSessionRun(run: SessionRun): Promise<SessionRun> {
  const db = await openDatabase();
  if (db) await db.put('settings', run, SESSION_RUN_KEY);
  else memory = structuredClone(run);
  notify(run);
  return run;
}

/**
 * Applies one event inside one read-write transaction: read, validate, decide (`apply`), write — so two
 * tabs, or a late callback and a new tap, are serialised by the store and the second is refused.
 */
export async function applySessionEvent(expected: Expected, event: RunEvent, now = new Date()): Promise<ApplyResult> {
  const db = await openDatabase();
  if (!db) {
    const checked = memory === undefined ? null : validateRun(memory);
    const result = apply(checked?.ok ? checked.run : null, expected, event, now);
    if (result.ok) {
      memory = structuredClone(result.run);
      notify(result.run);
    }
    return result;
  }
  const tx = db.transaction('settings', 'readwrite');
  const raw: unknown = await tx.store.get(SESSION_RUN_KEY);
  const checked = raw === undefined ? null : validateRun(raw);
  const result = apply(checked?.ok ? checked.run : null, expected, event, now);
  if (result.ok) await tx.store.put(result.run, SESSION_RUN_KEY);
  await tx.done;
  if (result.ok) notify(result.run);
  return result;
}

/**
 * Closes the stored run where it is still open and matches (`sessionId`, where given): another day's run
 * as not finished when today's card is composed, or the running one when the learner recomposes the card.
 */
export async function closeSessionRun(why: 'not-finished' | 'recomposed', now = new Date(), sessionId?: string): Promise<SessionRun | null> {
  const db = await openDatabase();
  const decide = (raw: unknown): SessionRun | null => {
    const checked = raw === undefined ? null : validateRun(raw);
    if (!checked?.ok || checked.run.closed) return null;
    if (sessionId !== undefined && checked.run.sessionId !== sessionId) return null;
    if (why === 'not-finished' && checked.run.day === dayKey(now)) return null;
    return closedRun(checked.run, why, now);
  };
  if (!db) {
    const closed = decide(memory);
    if (closed) {
      memory = structuredClone(closed);
      notify(closed);
    }
    return closed;
  }
  const tx = db.transaction('settings', 'readwrite');
  const closed = decide(await tx.store.get(SESSION_RUN_KEY));
  if (closed) await tx.store.put(closed, SESSION_RUN_KEY);
  await tx.done;
  if (closed) notify(closed);
  return closed;
}
