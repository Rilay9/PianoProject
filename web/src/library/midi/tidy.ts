/**
 * Three engraving clean-ups for notes whose releases are a player's touch rather than the music (2026-10-15, after the
 * owner's Warmness on the Soul, played in, its onsets on the beat grid: of its 406 chords only 6 let every key go at the same moment).
 *
 * 1. **One length a chord** (`oneLengthChords`): notes of one hand struck together whose releases lie less than a
 *    fifth of a quarter apart in the file (about a 16th) are one chord with one length. Before, every difference in
 *    release made the chord two or three voices, or a chord cut and tied into a smaller one, with rests where a key
 *    came up early.
 * 2. **No tiny rests** (`closeSmallGaps`): in one voice, a silence less than a 16th long in the file between a note's
 *    release and the voice's next note is a lifted finger: the note is written to the next one. MuseScore's MIDI
 *    import calls this "minimise rests"; before, it came out as "dotted eighth, 16th rest" patterns (and a note
 *    exported at a 95% gate, Seize the Day's, snapped a 16th short: bar 21).
 * 3. **No rest under another voice's note** (`hideCoveredRests`).
 *
 * Both distances are measured in the file's own time (quarter notes from its ticks, so in the notation's terms at
 * any tempo), on the releases and strikes as played, before the grid moves them: two releases a hair either side of
 * a grid line are a whole grid step apart once snapped, and the snapped values cannot tell that from a written 16th.
 * Why these two numbers (measured 2026-10-15 on the owner's files, scratch scripts listed in the session notes):
 * - Releases of one chord: in the two notation-program exports (Seize the Day, Dear God) every chord's releases are
 *   equal or at least 19/48 of a quarter apart; in Warmness, played in, 466 neighbouring releases are apart but less than
 *   a 16th apart, and 445 of them less than a fifth of a quarter. A written 16th difference exported with a gate (the file
 *   shortening every note, 95.8% in Seize) is a 16th times the gate: 0.2 or more for any gate of 80% and over. So
 *   under 1/5 joins what a hand let go raggedly and keeps a written eighth beside a dotted eighth.
 * - A silence in one voice: a written 16th rest is a 16th plus whatever the gate took off the note before, never less
 *   than a 16th; a lifted finger is less. So under 1/4.
 */
import type { NoteEvent } from './readMidi.ts';
import type { WriterNote } from './writer.ts';
import { type Frac, cmp, frac, fracToString, gt, lt, sub } from './fraction.ts';

/** How close (quarter notes, in the file's time) the releases of notes struck together must be to be one length. */
export const NEAR_RELEASES = frac(1, 5);
/** How short (quarter notes, in the file's time) a silence in one voice must be to be a lifted finger, not a rest. */
export const NEAR_STRIKE = frac(1, 4);
/**
 * How short a silence after the pedal lifts must be to be the pedal changing, not a rest, where the pedal (not the
 * key) ended the note in a played file (2026-10-15). A player lifts the pedal a moment before the next harmony to
 * clear the sound; Warmness on the Soul, measured from each of its 141 lifts to the next strike (scratch lift.mjs):
 * 124 under 0.44 of a quarter, 2 at 0.5-0.56, 15 from 0.8 up (its rests). An eighth sits in that gap. The page
 * then has the bass the published arrangement has (bar 19's last D3: a quarter, not a 16th and a dotted eighth rest).
 */
export const NEAR_PEDAL_LIFT = frac(1, 2);

/**
 * Notes struck together (one written onset) whose played releases lie less than `NEAR_RELEASES` before the latest one's
 * take the written end of that latest note. `releases` gives each note's release as the file has it (updated: the
 * chord's notes are then released together). Returns how many notes were given another length.
 */
export function oneLengthChords(events: NoteEvent[], releases: Map<NoteEvent, Frac>): number {
  const played = (e: NoteEvent): Frac => releases.get(e) ?? e.end;
  const byStart = new Map<string, NoteEvent[]>();
  for (const e of events) {
    const k = fracToString(e.start);
    const list = byStart.get(k);
    if (list) list.push(e);
    else byStart.set(k, [e]);
  }
  let changed = 0;
  for (const chord of byStart.values()) {
    if (chord.length < 2) continue;
    // From the latest release down: each group is the notes within NEAR_RELEASES of its latest, written as that one.
    const order = [...chord].sort((a, b) => cmp(played(b), played(a)));
    let i = 0;
    while (i < order.length) {
      const head = order[i]!;
      let j = i + 1;
      while (j < order.length && lt(sub(played(head), played(order[j]!)), NEAR_RELEASES)) j += 1;
      for (let k = i + 1; k < j; k += 1) {
        const e = order[k]!;
        releases.set(e, played(head)); // one chord now, released as its latest key was
        if (cmp(e.end, head.end) !== 0) { e.end = head.end; changed += 1; }
      }
      i = j;
    }
  }
  return changed;
}

/**
 * In one voice's notes (sorted by start), a note whose written end falls short of the voice's next strike, where the
 * file's own silence between them is less than `NEAR_STRIKE`, is written to that strike. `played` gives each note's release
 * and `struck` its onset as the file has them. Returns how many were lengthened.
 */
export function closeSmallGaps(
  line: NoteEvent[],
  played: (e: NoteEvent) => Frac,
  struck: (e: NoteEvent) => Frac,
  near: (e: NoteEvent) => Frac = () => NEAR_STRIKE,
): number {
  const onsets: NoteEvent[] = [];
  const seen = new Set<string>();
  for (const e of [...line].sort((a, b) => cmp(a.start, b.start))) {
    const k = fracToString(e.start);
    if (!seen.has(k)) { seen.add(k); onsets.push(e); }
  }
  let changed = 0;
  for (const e of line) {
    // The voice's next strike after this note's own.
    let lo = 0, hi = onsets.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (gt(onsets[mid]!.start, e.start)) hi = mid; else lo = mid + 1; }
    const next = onsets[lo];
    if (!next || !gt(next.start, e.end)) continue;
    if (!lt(sub(struck(next), played(e)), near(e))) continue;
    e.end = next.start;
    changed += 1;
  }
  return changed;
}

/**
 * A first voice's rest drawn where another voice of the same staff is playing throughout it is left undrawn (written
 * as a `<forward>`, as the later voices' silences already are): engravers do not print a voice's rest under another
 * voice's note, and OSMD drew the two in the same place (owner, 2026-10-15: "rests and notes in the same place"). A
 * rest only partly under another voice's notes is still drawn, so no stretch of the bar is left with nothing on it;
 * a rest inside a triplet keeps the bracket whole. `first` is the voice's bar, `others` the other voices' bars of
 * that staff, in the writer's divisions. Returns how many rests were hidden.
 */
export function hideCoveredRests(first: WriterNote[], others: WriterNote[][]): number {
  const spans = (notes: WriterNote[]): [number, number, WriterNote][] => {
    const out: [number, number, WriterNote][] = [];
    let at = 0;
    for (const n of notes) {
      if (n.chord) continue;
      out.push([at, at + n.duration, n]);
      at += n.duration;
    }
    return out;
  };
  // Where the other voices sound, merged into runs.
  const sounding = others.flatMap((notes) => spans(notes).filter(([, , n]) => n.midi !== null && !n.forward)).map(([a, b]) => [a, b] as [number, number]).sort((x, y) => x[0] - y[0]);
  const runs: [number, number][] = [];
  for (const [a, b] of sounding) {
    const last = runs[runs.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else runs.push([a, b]);
  }
  let hidden = 0;
  for (const [a, b, n] of spans(first)) {
    if (n.midi !== null || n.forward || n.tuplet) continue;
    if (!runs.some(([c, d]) => c <= a && d >= b)) continue;
    n.forward = true;
    hidden += 1;
  }
  return hidden;
}

/**
 * Was the file played in rather than exported from a notation program? Told by how a hand lets go of a chord: an
 * export releases every key of a chord at one moment (or a written value apart), a player's keys come up raggedly.
 * Measured 2026-10-15 (chords as counted here): Seize the Day (export) 578 of 583 chords released together; Warmness on the Soul (played) 7 of
 * 343. "Played" is fewer than half released together, the middle of that gap. `parts` are the hands' notes on the
 * grid (a chord is one written onset of one hand); `releases` each note's release as the file has it.
 */
export function playedIn(parts: readonly (readonly NoteEvent[])[], releases: Map<NoteEvent, Frac>): boolean {
  const { chords, together } = releasedTogether(parts, releases);
  return chords > 0 && together * 2 < chords;
}

/** How many chords (two or more notes of one hand at one written onset) there are, and how many let go at one moment. */
export function releasedTogether(parts: readonly (readonly NoteEvent[])[], releases: Map<NoteEvent, Frac>): { chords: number; together: number } {
  let chords = 0, together = 0;
  for (const events of parts) {
    const byStart = new Map<string, NoteEvent[]>();
    for (const e of events) {
      const k = fracToString(e.start);
      const list = byStart.get(k);
      if (list) list.push(e);
      else byStart.set(k, [e]);
    }
    for (const chord of byStart.values()) {
      if (chord.length < 2) continue;
      chords += 1;
      const first = releases.get(chord[0]!) ?? chord[0]!.end;
      if (chord.every((e) => cmp(releases.get(e) ?? e.end, first) === 0)) together += 1;
    }
  }
  return { chords, together };
}
