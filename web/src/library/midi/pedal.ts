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

/** Each channel's pedal-down spans, [from, to); a span still down at the end runs on (to: null). */
export type PedalSpans = Map<number, { from: Frac; to: Frac | null }[]>;

export function pedalSpans(pedal: MidiFileContents['pedal']): PedalSpans {
  const spans: PedalSpans = new Map();
  for (const change of pedal) {
    const list = spans.get(change.channel) ?? [];
    const open = list[list.length - 1];
    if (change.down) { if (!open || open.to !== null) list.push({ from: change.at, to: null }); }
    else if (open && open.to === null) open.to = change.at;
    spans.set(change.channel, list);
  }
  return spans;
}

export function soundingEnds(events: readonly NoteEvent[], pedal: MidiFileContents['pedal']): Frac[] {
  const spans = pedalSpans(pedal);
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

/**
 * A played file with the pedal is written as the published arrangements write it, one voice a hand (owner's answers
 * A5 and, 2026-10-15, "one voice, like the published page" for keys held through a change of the pedal): a key held
 * down past the next note of its hand is written to that note. Where the pedal is down until the key comes up the
 * sound is unchanged; where a finger holds the key through a change of the pedal, the page shows it shorter than it
 * is held (the owner's choice; Warmness on the Soul bars 12-14, E4 held under the repeated B4). Before (A5 alone) the
 * second kind kept its length and made 30 of the 42 extra voices left in Warmness. Returns how many were cut.
 */
export function cutAtNextNote(events: NoteEvent[]): number {
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
    e.end = next;
    cut += 1;
  }
  return cut;
}

/**
 * In a played file with the pedal, a note is written as long as it sounds (owner's answer A5: an arrangement writes
 * the pedal's held value), up to its hand's next note: a bass key let go at once with the pedal holding it for three
 * beats is a dotted half, not a 16th and rests. `holdToNext` already writes it to the next note where it sounds to
 * within an eighth of it; this covers a note whose pedal lifts earlier, where the rest after it is real. Only as far
 * as one written note reaches inside its bar (`longest`: the latest end, not after `to`, that one note-head from the
 * note's start can carry, or null): a length that needs ties, or a tie over the barline, is a worse read than the
 * rest it replaces (tried 2026-10-15: written to the sound itself, Warmness gained 12 ties and two bars of a held
 * last chord). `sound` is each note's sounding end, `snapEnd` puts a moment on the grid of its bar. Returns how many
 * were lengthened.
 */
export function holdToSound(
  events: NoteEvent[],
  sound: (e: NoteEvent) => Frac | undefined,
  snapEnd: (t: Frac) => Frac,
  longest: (e: NoteEvent, to: Frac) => Frac | null,
): number {
  const onsets = [...new Map(events.map((e) => [`${e.start.n}/${e.start.d}`, e.start])).values()].sort(cmp);
  const after = (t: Frac): Frac | undefined => {
    let lo = 0, hi = onsets.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (gt(onsets[mid]!, t)) hi = mid; else lo = mid + 1; }
    return onsets[lo];
  };
  let lengthened = 0;
  for (const e of events) {
    const heard = sound(e);
    if (!heard) continue;
    let to = snapEnd(heard);
    const next = after(e.start);
    if (next && gt(to, next)) to = next;
    if (!gt(to, e.end)) continue;
    const end = longest(e, to);
    if (!end || !gt(end, e.end)) continue;
    e.end = end;
    lengthened += 1;
  }
  return lengthened;
}
