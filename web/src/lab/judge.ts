// How the lab hears you (owner, 2026-10-13).
// - Accompaniment: each moment a step asks for (a hit: the chord on its first beat, or where the style plays it) is
//   right when its notes are all down, any voicing and octave, by the beat (within ON_TIME_MS); a little late (still
//   before the next hit) is amber; a missing note, or a key not in the chord, is red. "Your own way" checks the notes
//   only. The Roots step asks for the root alone (other notes of the chord are fine; keys outside it are not).
// - Improvising (the lead over a chart) is not marked: it says how it went, plainly (notes from the lit keys, and
//   whether you landed on a note of the chord when it changed).

import type { AccompStep, ChordInfo, Form, Hit } from './music';

/** How close to the beat a chord's last note must come to be on time (ms; a chord is often rolled a little). */
export const ON_TIME_MS = 150;

export interface Press { midi: number; t: number } // t: ms from the start of the round, at the chart's own tempo
export type Mark = 'ok' | 'late' | 'miss';
export interface HitResult { hit: Hit; mark: Mark; missing: number[]; wrong: number[]; played: number[] }

const SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
/** A key named as the chord spells it if it is one of its notes, otherwise in flats or sharps to suit the chord. */
export function keyName(midi: number, c: ChordInfo): string {
  const p = midi % 12, i = c.pcs.indexOf(p);
  if (i >= 0) return c.names[i];
  return (c.rootName.includes('♭') || ['F'].includes(c.rootName) ? FLAT : SHARP)[p];
}

export function judgeHit(hit: Hit, presses: Press[], step: AccompStep): HitResult {
  // Its keys: from a shade before its beat until a shade before the next one (keys just ahead of the next beat are the next chord's).
  const inWindow = presses.filter((p) => p.t >= hit.t - ON_TIME_MS && p.t < hit.until - ON_TIME_MS).sort((a, b) => a.t - b.t);
  const need = step === 'roots' ? [hit.chord.root] : hit.chord.pcs;
  const got = new Set<number>();
  let doneAt = Infinity;
  for (const p of inWindow) {
    got.add(p.midi % 12);
    if (doneAt === Infinity && need.every((n) => got.has(n))) doneAt = p.t;
  }
  const wrong = inWindow.filter((p) => !hit.chord.pcs.includes(p.midi % 12)).map((p) => p.midi);
  const missing = need.filter((n) => !got.has(n));
  const mark: Mark = wrong.length || missing.length ? 'miss' : step === 'own' || doneAt <= hit.t + ON_TIME_MS ? 'ok' : 'late';
  return { hit, mark, missing, wrong, played: inWindow.map((p) => p.midi) };
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
  if (r.mark === 'late') return `${bar}: right, a little after the beat`;
  return '';
}

/** Improvising, told plainly: how many notes came from the lit keys, and how often you landed on the chord when it changed. */
export interface Improv { notes: number; fromGuide: number; changes: number; landed: number }
export function improvised(form: Form, presses: Press[], guide: (chordPcs: number[]) => number[], from = 0, to = Infinity): Improv {
  const inRange = presses.filter((p) => p.t >= from && p.t < to);
  let fromGuide = 0;
  for (const p of inRange) {
    const sp = form.spans.find((s) => p.t >= s.at * form.beatMs - ON_TIME_MS && p.t < (s.at + s.beats) * form.beatMs - ON_TIME_MS) ?? form.spans[0];
    if (guide(sp.chord.pcs).includes(p.midi % 12)) fromGuide++;
  }
  let changes = 0, landed = 0;
  form.spans.forEach((sp, i) => {
    const at = sp.at * form.beatMs;
    if (i > 0 && sp.chord.symbol === form.spans[i - 1].chord.symbol) return; // the same chord again is no change
    if (at < from || at >= to) return;
    const first = inRange.find((p) => p.t >= at - ON_TIME_MS && p.t < at + form.beatMs);
    if (!first) return;
    changes++;
    if (sp.chord.pcs.includes(first.midi % 12)) landed++;
  });
  return { notes: inRange.length, fromGuide, changes, landed };
}
