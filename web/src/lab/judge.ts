// How the lab hears you (owner, 2026-10-13).
// - Accompaniment: each moment a step asks for (a hit: the chord on its first beat, or where the style plays it) is
//   right when its notes are all down together, any voicing and octave, by the beat (within the on-time window, a
//   little roll allowed); a little late (still before the next hit) is amber; a missing note, notes only ever played
//   one at a time, or a key not in the chord, is red. "Your own way" checks the notes only (broken chords are fine).
//   The Roots step asks for the root alone (other notes of the chord are fine; keys outside it are not).
//   Times are in the chart's own tempo (the band's clock); the window is ON_TIME_MS of real time, so at another speed
//   it is ON_TIME_MS x speed of the chart's time (the same playing is judged the same at any speed).
// - Improvising (the lead over a chart) is not marked: it says how it went, plainly (notes from the lit keys, and
//   whether you landed on a note of the chord when it changed).

import type { AccompStep, ChordInfo, Form, Hit } from './music';

/** How close to the beat a chord's last note must come to be on time (ms of real time; a chord is often rolled a little). */
export const ON_TIME_MS = 150;

/** A key played: t when it went down, off when it came up (still held: none); ms from the start of the round, at the chart's own tempo. */
export interface Press { midi: number; t: number; off?: number }
export type Mark = 'ok' | 'late' | 'miss';
/** apart: every note was played, but never down together. */
export interface HitResult { hit: Hit; mark: Mark; missing: number[]; wrong: number[]; played: number[]; apart?: boolean }

const SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
/** A key named as the chord spells it if it is one of its notes, otherwise in flats or sharps to suit the chord. */
export function keyName(midi: number, c: ChordInfo): string {
  const p = midi % 12, i = c.pcs.indexOf(p);
  if (i >= 0) return c.names[i];
  return (c.rootName.includes('♭') || ['F'].includes(c.rootName) ? FLAT : SHARP)[p];
}

/** tol: the on-time window in the chart's time (ON_TIME_MS x the speed it was played at). */
export function judgeHit(hit: Hit, presses: Press[], step: AccompStep, tol = ON_TIME_MS): HitResult {
  // Its keys: from a shade before its beat until a shade before the next one (keys just ahead of the next beat are the next chord's).
  const inWindow = presses.filter((p) => p.t >= hit.t - tol && p.t < hit.until - tol).sort((a, b) => a.t - b.t);
  const need = step === 'roots' ? [hit.chord.root] : hit.chord.pcs;
  const together = step === 'beat1' || step === 'style'; // a chord: its notes down at the same time
  const got = new Set<number>();
  let doneAt = Infinity;
  for (const p of inWindow) {
    got.add(p.midi % 12);
    if (doneAt !== Infinity) continue;
    const held = together ? new Set(inWindow.filter((q) => q.t <= p.t && (q.off === undefined || q.off > p.t)).map((q) => q.midi % 12)) : got;
    if (need.every((n) => held.has(n))) doneAt = p.t;
  }
  const wrong = inWindow.filter((p) => !hit.chord.pcs.includes(p.midi % 12)).map((p) => p.midi);
  const missing = need.filter((n) => !got.has(n));
  const apart = !missing.length && doneAt === Infinity;
  const mark: Mark = wrong.length || missing.length || apart ? 'miss' : step === 'own' || doneAt <= hit.t + tol ? 'ok' : 'late';
  return { hit, mark, missing, wrong, played: inWindow.map((p) => p.midi), apart };
}

/** Each bar's mark: the worst of its hits. */
export function barMarks(results: HitResult[]): Map<number, Mark> {
  const rank: Record<Mark, number> = { ok: 0, late: 1, miss: 2 };
  const out = new Map<number, Mark>();
  for (const r of results) { const was = out.get(r.hit.bar); if (!was || rank[r.mark] > rank[was]) out.set(r.hit.bar, r.mark); }
  return out;
}

/** What went wrong at a hit, in music words. */
export function sayHit(r: HitResult, step: AccompStep, barOffset = 0): string {
  const c = r.hit.chord, bar = `Bar ${r.hit.bar + 1 + barOffset} ${c.symbol}`;
  const names = (ms: number[]) => [...new Set(ms.map((m) => keyName(m, c)))].join(' ');
  if (r.wrong.length) return `${bar}: ${names(r.wrong)} ${r.wrong.length === 1 ? "isn't" : "aren't"} in ${c.symbol}`;
  if (r.missing.length) {
    if (step === 'roots') return `${bar}: the root is ${c.rootName}`;
    const parts = r.missing.map((p) => `${c.names[c.pcs.indexOf(p)]} (the ${c.degrees[c.pcs.indexOf(p)]})`);
    return r.played.length ? `${bar}: you played ${names(r.played)}; it needs ${parts.join(', ')} as well` : `${bar}: nothing played`;
  }
  if (r.apart) return `${bar}: you played ${names(r.played)} one at a time; hold them down together`;
  if (r.mark === 'late') return `${bar}: right, a little after the beat`;
  return '';
}

/**
 * Improvising, told plainly: how many notes came from the guide's keys, and at the chord changes (each chord that
 * differs from the one before it, round the form) how many you played at and how many of those landed on the chord.
 * bars: how many bars you played in. to: where the round was stopped (only what came before it counts).
 */
export interface Improv { notes: number; fromGuide: number; changes: number; playedAt: number; landed: number; bars: number }
export function improvised(form: Form, presses: Press[], guide: (chordPcs: number[]) => number[], tol = ON_TIME_MS, to = Infinity): Improv {
  const inRange = presses.filter((p) => p.t < to);
  let fromGuide = 0;
  for (const p of inRange) {
    const sp = form.spans.find((s) => p.t >= s.at * form.beatMs - tol && p.t < (s.at + s.beats) * form.beatMs - tol) ?? form.spans[0];
    if (guide(sp.chord.pcs).includes(p.midi % 12)) fromGuide++;
  }
  let changes = 0, playedAt = 0, landed = 0;
  form.spans.forEach((sp, i) => {
    const at = sp.at * form.beatMs;
    if (sp.chord.symbol === form.spans[(i + form.spans.length - 1) % form.spans.length].chord.symbol) return; // the same chord again is no change
    if (at >= to) return;
    changes++;
    const first = inRange.find((p) => p.t >= at - tol && p.t < at + form.beatMs);
    if (!first) return;
    playedAt++;
    if (sp.chord.pcs.includes(first.midi % 12)) landed++;
  });
  const barMs = form.barBeats * form.beatMs;
  const bars = new Set(inRange.map((p) => Math.floor(Math.max(0, p.t) / barMs))).size;
  return { notes: inRange.length, fromGuide, changes, playedAt, landed, bars };
}
