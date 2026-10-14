// Play along: which of the keys you played were which written notes, and how far off each was, and whether each was
// held its length (holds.ts: let go early). Kept apart from the rest (no score, no sound) so the rule can be checked
// on its own (tests/scoring.mjs).

import { letGoEarly } from './holds.ts'; // (with .ts: the checks run this file in Node)

/**
 * Your written notes at one moment: when (song ms at speed 1), the keys (one key counts once), and how long each is
 * written to sound (ms at speed 1, as keys; 0 or none: its length is not judged, as for a staccato note).
 */
export interface ExpectedStep { t: number; keys: number[]; durs?: number[] }
/** A key you pressed: which, when (song ms at speed 1), the speed playing then, and when (performance.now(), for its hold). */
export interface PlayedKey { midi: number; t: number; speed: number; at?: number }

/** What a note can be judged: on time and held, early, late, missed, or on time but let go early (short). */
export type NoteKind = 'missed' | 'early' | 'late' | 'short';
export interface Judged {
  /** Every written note is one of onTime, early, late, missed or short (on time, let go early). */
  total: number; onTime: number; early: number; late: number; missed: number; short: number; wrong: number;
  /** Which step each note not played on time belongs to (one entry per such note), and when the wrong presses came. */
  offSteps: number[]; wrongAt: number[];
  /** Each note not played on time: its step, key and what happened; each wrong press: when and which key. */
  offNotes: { k: number; midi: number; kind: NoteKind }[]; wrongKeys: { t: number; midi: number }[];
}

/**
 * A press can count for a written note of the same key if it came within the on-time tolerance of it, or
 * after your previous notes were due and before your next ones (so a slow passage still finds a late note).
 * Among all those possible pairings the closest are taken first, each press and each note used once: so a
 * press goes to the nearer of two written notes of its key, and a note played a little after the next one
 * was due is still matched. Notes with no press are missed; presses with no note are wrong.
 */
/** held: how long a press sounded (ms, real time; Infinity if still sounding or unknown). Without it lengths are not judged. */
export function judge(steps: ExpectedStep[], played: PlayedKey[], toleranceMs: number, held?: (p: PlayedKey) => number): Judged {
  // One note a key a step; written in both hands at once, it lasts as long as the longer.
  const notes = steps.flatMap((step, k) => [...new Set(step.keys)].map((midi) => ({
    midi, t: step.t, k, dur: Math.max(0, ...step.keys.map((m, i) => (m === midi ? step.durs?.[i] ?? 0 : 0))),
  })));
  const pairs: { note: number; press: number; dist: number }[] = [];
  notes.forEach((n, i) => {
    const lo = n.k > 0 ? steps[n.k - 1].t : -Infinity, hi = n.k + 1 < steps.length ? steps[n.k + 1].t : Infinity;
    played.forEach((p, j) => {
      if (p.midi !== n.midi) return;
      const offMs = Math.abs(p.t - n.t) / p.speed; // as heard, at the speed then
      if (offMs <= toleranceMs || (p.t > lo && p.t < hi)) pairs.push({ note: i, press: j, dist: offMs });
    });
  });
  pairs.sort((a, b) => a.dist - b.dist);
  const noteUsed = new Set<number>(), pressUsed = new Set<number>();
  let onTime = 0, early = 0, late = 0, short = 0;
  const offSteps: number[] = [];
  const offNotes: Judged['offNotes'] = [];
  for (const { note, press } of pairs) {
    if (noteUsed.has(note) || pressUsed.has(press)) continue;
    noteUsed.add(note);
    pressUsed.add(press);
    const p = played[press], offMs = (p.t - notes[note].t) / p.speed;
    if (Math.abs(offMs) <= toleranceMs) {
      // On time; held its length? (A note already early or late is marked for that alone: one thing a note.)
      if (held && letGoEarly(held(p), notes[note].dur, p.speed)) {
        short++;
        offSteps.push(notes[note].k);
        offNotes.push({ k: notes[note].k, midi: notes[note].midi, kind: 'short' });
      } else onTime++;
      continue;
    }
    if (offMs < 0) early++;
    else late++;
    offSteps.push(notes[note].k);
    offNotes.push({ k: notes[note].k, midi: notes[note].midi, kind: offMs < 0 ? 'early' : 'late' });
  }
  notes.forEach((n, i) => { if (!noteUsed.has(i)) { offSteps.push(n.k); offNotes.push({ k: n.k, midi: n.midi, kind: 'missed' }); } });
  const wrongKeys = played.filter((_, j) => !pressUsed.has(j)).map((p) => ({ t: p.t, midi: p.midi }));
  const wrongAt = wrongKeys.map((w) => w.t);
  return { total: notes.length, onTime, early, late, missed: notes.length - noteUsed.size, short, wrong: wrongAt.length, offSteps, wrongAt, offNotes, wrongKeys };
}

/** Keys pressed this close together are one tap (a chord's keys land within a few ms of each other). */
const CHORD_MS = 30;

/**
 * Rhythm only: one tap on any key for each moment you have notes (a chord is one tap), judged on timing
 * alone by the same rule as judge(). Taps with no written moment near them are counted as wrong (extra taps).
 */
export function judgeRhythm(steps: ExpectedStep[], played: PlayedKey[], toleranceMs: number, held?: (p: PlayedKey) => number): Judged {
  const taps: (PlayedKey & { key: PlayedKey })[] = [];
  for (const p of [...played].sort((a, b) => a.t - b.t)) {
    const last = taps.at(-1);
    if (last && (p.t - last.t) / p.speed < CHORD_MS) continue;
    taps.push({ ...p, midi: 0, key: p });
  }
  // A tap is held as long as the moment's longest note, but never past the next moment (one tap cannot be held
  // through the next one: review, 2026-10-13).
  return judge(steps.map((s, i) => ({ t: s.t, keys: [0], durs: [Math.min(Math.max(0, ...(s.durs ?? [])), (steps[i + 1]?.t ?? Infinity) - s.t)] })), taps, toleranceMs,
    held && ((tap) => held((tap as PlayedKey & { key: PlayedKey }).key)));
}
