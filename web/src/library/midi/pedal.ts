/**
 * When each note stops sounding: at its release, or, where the sustain pedal is down then, when the pedal lifts, but
 * never past the next strike of the same key on its channel. This is Magenta's note_seq rule
 * (apply_sustain_control_changes, Apache-2.0) and the one holds.ts applies to live playing.
 *
 * Why the converter wants it (2026-10-15): a file played in rather than written (the owner's Warmness on the Soul:
 * 287 pedal changes, 40% of its notes shorter than an eighth) releases keys early and lets the pedal hold the sound,
 * and the score came out as short notes and rests where the published arrangement has a whole note.
 */
import type { MidiFileContents, NoteEvent } from './readMidi.ts';
import { type Frac, cmp, gt, lt, lte, sub } from './fraction.ts';

export function soundingEnds(events: readonly NoteEvent[], pedal: MidiFileContents['pedal']): Frac[] {
  // Each channel's pedal-down spans, [from, to); a span still down at the end runs on (to: null).
  const spans = new Map<number, { from: Frac; to: Frac | null }[]>();
  for (const change of pedal) {
    const list = spans.get(change.channel) ?? [];
    const open = list[list.length - 1];
    if (change.down) { if (!open || open.to !== null) list.push({ from: change.at, to: null }); }
    else if (open && open.to === null) open.to = change.at;
    spans.set(change.channel, list);
  }
  // The next strike of each key on each channel, for cutting the sound there.
  const byKey = new Map<string, Frac[]>();
  for (const e of events) {
    const k = `${String(e.channel ?? 0)}:${String(e.midi)}`;
    const list = byKey.get(k) ?? [];
    list.push(e.start);
    byKey.set(k, list);
  }
  for (const list of byKey.values()) list.sort(cmp);
  return events.map((e) => {
    const span = (spans.get(e.channel ?? 0) ?? []).find((s) => lte(s.from, e.end) && (s.to === null || lt(e.end, s.to)));
    if (!span) return e.end;
    let end = span.to ?? e.end;
    const next = (byKey.get(`${String(e.channel ?? 0)}:${String(e.midi)}`) ?? []).find((t) => gt(t, e.start));
    if (next && lt(next, end)) end = next;
    return gt(end, e.end) ? end : e.end;
  });
}

/**
 * Notes still sounding when the next note of their hand is struck are written to it (the written length a reader
 * expects, as an arrangement writes a bass held by the pedal), and never shortened. Returns how many were lengthened.
 * `sound` is each note's sounding end; `slack` how far short of the next strike the sound may stop and still count.
 */
export function holdToNext(events: NoteEvent[], sound: (e: NoteEvent) => Frac | undefined, slack: Frac): number {
  const onsets = [...new Map(events.map((e) => [`${e.start.n}/${e.start.d}`, e.start])).values()].sort(cmp);
  /** The first onset after t (binary search). */
  const after = (t: Frac): Frac | undefined => {
    let lo = 0, hi = onsets.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (gt(onsets[mid]!, t)) hi = mid; else lo = mid + 1; }
    return onsets[lo];
  };
  let lengthened = 0;
  for (const e of events) {
    const next = after(e.start);
    const heard = sound(e);
    if (!next || !heard || !gt(next, e.end)) continue;
    if (lt(heard, next) && gt(sub(next, heard), slack)) continue;
    e.end = next;
    lengthened += 1;
  }
  return lengthened;
}

/**
 * In a file played with the pedal, a note that runs into the next note of its hand by no more than the time between
 * their onsets is a legato key overlap, not a second voice: it is cut at the next note (Warmness on the Soul, bar 1: a
 * melody of eighths, each held a little into the next, was written as two voices of dotted eighths where the
 * published arrangement has eighths). A note held well past the next ones (a melody note over moving notes) overlaps
 * by more than that and keeps its length. Returns how many were cut.
 */
export function cutLegato(events: NoteEvent[]): number {
  const onsets = [...new Map(events.map((e) => [`${e.start.n}/${e.start.d}`, e.start])).values()].sort(cmp);
  const after = (t: Frac): Frac | undefined => {
    let lo = 0, hi = onsets.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (gt(onsets[mid]!, t)) hi = mid; else lo = mid + 1; }
    return onsets[lo];
  };
  let cut = 0;
  for (const e of events) {
    const next = after(e.start);
    if (!next || !gt(e.end, next)) continue;
    if (gt(sub(e.end, next), sub(next, e.start))) continue;
    e.end = next;
    cut += 1;
  }
  return cut;
}
