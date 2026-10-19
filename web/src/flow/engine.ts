// Read in time (owner, 2026-10-18: the week's lesson; "Look up how rhythm practice apps do it and follow good ux
// procedure"; design/2026-10-18-week1/spec.md "The rhythm screen"): exercises one after another on a click that never
// stops, each tap judged as it lands. What dedicated trainers share (Rhythm Sight Reading Trainer, Melodics, CrossBeat):
// a count-in once, then continuous exercises; Tap along (the rhythm sounds too) or Read (the click only); a mark on every
// tap, on time or early or late; a score per exercise and for the session; tempo up and down, and up by itself after
// good exercises; looping one exercise; endless fresh exercises.
// This file is the timing and judging, with no page (the checks run it in Node); flow/view.ts draws, screens/flow.ts is
// the screen.

import type { Item } from '../exercise/items.ts';
import { midiOf } from '../exercise/items.ts';

/** How a note came out. short: on time but let go early (only when lengths are judged). */
export type Mark = 'ok' | 'early' | 'late' | 'missed' | 'wrong' | 'short';
/** A note to play: when (ms on the song clock), how long, its key (null: a rhythm note, any key or the pad). */
export interface FlowNote { t: number; dur: number; key: number | null; ex: number; i: number; last: boolean }
/** One exercise placed on the clock: its card, when its first bar starts and its last ends, its notes. */
export interface Placed { n: number; item: Item; t0: number; end: number; beatMs: number; barBeats: number; notes: FlowNote[] }
export interface NoteResult { mark: Mark; off?: number }
/** An exercise's score: how many notes on time of how many, and the slips by kind. */
export interface ExerciseScore { n: number; onTime: number; total: number; early: number; late: number; missed: number; wrong: number; short: number; extra: number }

/** On time within this (ms either side); further, up to the window, early or late (as Drills' normal). */
export const ON_TIME_MS = 100;
/** A tap counts for a note within this of it, never further than 45 % of the way to the next or last note. */
export const WINDOW_MS = 260;
/** Lengths judged: a note held this share of its length (or until the next tap) is held. */
export const HOLD_SHARE = 0.75;

/** The beats of an item's notes: its written lengths (quarter notes), or one each. */
const beatsOf = (it: Item) => it.beats ?? it.groups.map(() => 1);

/**
 * Places a card on the clock from t0 at this tempo (quarter notes a minute): its notes (a rest is no note), and its end
 * (the whole of its last bar, so the next card starts on a downbeat).
 */
export function place(n: number, item: Item, t0: number, bpm: number, rhythm: boolean): Placed {
  const q = 60000 / bpm;
  const meter = item.meter ?? { beats: 4, beatType: 4 };
  const beatMs = q * (4 / meter.beatType), barQ = meter.beats * (4 / meter.beatType);
  const notes: FlowNote[] = [];
  let at = 0;
  const beats = beatsOf(item);
  item.groups.forEach((g, i) => {
    if (g.length) notes.push({ t: t0 + at * q, dur: beats[i] * q, key: rhythm ? null : midiOf(g[0]), ex: n, i, last: false });
    at += beats[i];
  });
  if (notes.length) notes[notes.length - 1].last = true;
  const bars = Math.max(1, Math.ceil(at / barQ - 1e-6));
  return { n, item, t0, end: t0 + bars * barQ * q, beatMs, barBeats: meter.beats, notes };
}

/** The clicks from `from` to `to` (ms), one a beat, the first of each bar accented; from a downbeat. */
export function clicksBetween(from: number, to: number, beatMs: number, barBeats: number): { t: number; accent: boolean }[] {
  const out: { t: number; accent: boolean }[] = [];
  for (let k = 0; from + k * beatMs < to - 1; k++) out.push({ t: from + k * beatMs, accent: k % barBeats === 0 });
  return out;
}

/**
 * Judges taps against the notes placed so far, as they come: each tap goes to the nearest note not yet played within its
 * window (a rhythm note takes any key; a note with a key takes that key first, and another key there is "wrong"); a tap
 * near no note is extra. A note whose window has passed with no tap is missed. With lengths judged, a note let go before
 * HOLD_SHARE of its length (and before the next tap) is "short".
 */
export class FlowJudge {
  private notes: FlowNote[] = [];
  readonly results = new Map<FlowNote, NoteResult>();
  private held = new Map<number, { note: FlowNote; at: number }>(); // key down now (null key: -1) -> its note, its time
  private lastTapAt = -Infinity;
  extras: { t: number; ex: number }[] = [];
  constructor(private readonly opts: { holds: boolean; onTimeMs?: number; windowMs?: number } = { holds: false }) {}

  /** span: the exercise's stretch of the clock (its first bar to its end), so an extra tap in it, a rest too, counts for it. */
  add(notes: FlowNote[], span?: { ex: number; t0: number; end: number }): void {
    this.notes.push(...notes);
    this.notes.sort((a, b) => a.t - b.t);
    if (span) this.spans.push(span);
  }
  private spans: { ex: number; t0: number; end: number }[] = [];
  get all(): readonly FlowNote[] { return this.notes; }

  /** The window around a note: WINDOW_MS, never past 45 % of the gap to its neighbours. */
  private window(k: number): number {
    const n = this.notes[k], prev = this.notes[k - 1], next = this.notes[k + 1];
    let w = this.opts.windowMs ?? WINDOW_MS;
    if (prev) w = Math.min(w, (n.t - prev.t) * 0.45);
    if (next) w = Math.min(w, (next.t - n.t) * 0.45);
    return Math.max(w, (this.opts.onTimeMs ?? ON_TIME_MS) * 0.8);
  }

  /** A tap (or key) at song time t: the note it played and how, or extra (null). */
  tap(t: number, key: number | null): { note: FlowNote; result: NoteResult } | null {
    // (a key let go late, held across this tap, is held: the slip, if any, is this tap's)
    for (const [k, h] of this.held) if (h.at < t) this.held.delete(k);
    this.lastTapAt = t;
    let best = -1, bestD = Infinity, keyed = -1, keyedD = Infinity;
    this.notes.forEach((n, k) => {
      if (this.results.has(n)) return;
      const d = Math.abs(t - n.t);
      if (d > this.window(k)) return;
      if (d < bestD) { best = k; bestD = d; }
      if (key !== null && n.key === key && d < keyedD) { keyed = k; keyedD = d; }
    });
    const k = keyed >= 0 ? keyed : best;
    if (k < 0) { const ex = this.spans.find((sp) => t >= sp.t0 && t < sp.end)?.ex ?? this.notes.find((n) => n.t + n.dur > t)?.ex ?? this.notes.at(-1)?.ex ?? 0; this.extras.push({ t, ex }); return null; }
    const note = this.notes[k], off = t - note.t, onTime = this.opts.onTimeMs ?? ON_TIME_MS;
    const result: NoteResult = note.key !== null && key !== null && note.key !== key ? { mark: 'wrong', off } : { mark: Math.abs(off) <= onTime ? 'ok' : off < 0 ? 'early' : 'late', off };
    this.results.set(note, result);
    if (this.opts.holds && result.mark !== 'wrong') this.held.set(key ?? -1, { note, at: t });
    return { note, result };
  }

  /** A key let go at song time t: with lengths judged, a note let go too soon is "short" (on-time notes only). */
  release(t: number, key: number | null): { note: FlowNote; result: NoteResult } | null {
    const h = this.held.get(key ?? -1);
    if (!h) return null;
    this.held.delete(key ?? -1);
    const r = this.results.get(h.note);
    if (!r || r.mark !== 'ok' || h.note.last) return null; // (an exercise's last note: the next card's count follows, not asked)
    if (t - h.at >= HOLD_SHARE * h.note.dur) return null;
    const short: NoteResult = { mark: 'short', off: r.off };
    this.results.set(h.note, short);
    return { note: h.note, result: short };
  }

  /** The notes whose windows are over at song time now with no tap: missed (each once). */
  tick(now: number): FlowNote[] {
    const out: FlowNote[] = [];
    this.notes.forEach((n, k) => { if (!this.results.has(n) && now > n.t + this.window(k)) { this.results.set(n, { mark: 'missed' }); out.push(n); } });
    return out;
  }

  /** An exercise's score (its notes judged so far). */
  score(ex: number): ExerciseScore {
    const s: ExerciseScore = { n: ex, onTime: 0, total: 0, early: 0, late: 0, missed: 0, wrong: 0, short: 0, extra: this.extras.filter((e) => e.ex === ex).length };
    for (const n of this.notes) {
      if (n.ex !== ex) continue;
      s.total++;
      const m = this.results.get(n)?.mark;
      if (m === 'ok') s.onTime++; else if (m) s[m]++;
    }
    return s;
  }
  /** When a tap last came (song time), for stopping when nothing is played. */
  get lastTap(): number { return this.lastTapAt; }
  /** Drops notes and results before song time t (long sessions stay small). */
  forget(before: number): void {
    const keep = this.notes.filter((n) => n.t + n.dur >= before);
    for (const n of this.notes) if (!keep.includes(n)) this.results.delete(n);
    this.notes = keep;
    this.extras = this.extras.filter((e) => e.t >= before);
  }
}

/** An exercise's score in words: "7 of 8 on time · 1 late". */
export function scoreWords(s: ExerciseScore): string {
  const parts = ([['early', s.early], ['late', s.late], ['let go early', s.short], ['wrong', s.wrong], ['missed', s.missed], [s.extra === 1 ? 'extra tap' : 'extra taps', s.extra]] as const)
    .filter(([, k]) => k > 0).map(([w, k]) => `${k} ${w}`);
  return [`${s.onTime} of ${s.total} on time`, ...parts].join(' · ');
}

/**
 * Speed up by itself: after this many exercises in a row at this share on time (or better), the tempo goes up a step.
 * (Melodics' Auto-BPM raises the tempo after successful loops; a step of 5, as the screen's + does.)
 */
export const SPEED_UP_AFTER = 3, SPEED_UP_SHARE = 0.9, TEMPO_STEP = 5, TEMPO_MIN = 40, TEMPO_MAX = 200;
export function shouldSpeedUp(recent: ExerciseScore[]): boolean {
  if (recent.length < SPEED_UP_AFTER) return false;
  return recent.slice(-SPEED_UP_AFTER).every((s) => s.total > 0 && s.onTime / s.total >= SPEED_UP_SHARE && !s.extra);
}
