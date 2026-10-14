/**
 * One staff's notes as up to two voices (2026-10-14), so a melody over an accompaniment in one hand is written as a
 * melody, not as a chain of tied chords.
 *
 * Without this every staff was one line of chords: a melody note held while sixteenths moved under it was cut at each
 * sixteenth and tied (Chopin's Op. 10 No. 3 came out as tied sixteenth-note chords with the tune inside them). The
 * rule is the notation programs' (MuseScore's MIDI import splits a staff's chords into voices by where their notes
 * end; music21's makeVoices separates overlapping notes): notes struck together that end together stay one chord;
 * a group that ends at another time, or starts while the first voice is still sounding, goes into the second voice.
 * The highest notes are placed first, so the top of the texture (where a melody usually is) keeps the first voice.
 * While two voices are going, a new note joins the one it is nearer in pitch (the idea of the published voice
 * separators, Chew and Wu's contig mapping among them): split by length alone, a melody note and an accompaniment
 * note that happened to be the same length became one chord, and the lines swapped voices from beat to beat.
 *
 * Considered and not used: partitura's estimate_voices (Chew and Wu's contig mapping) separates musical lines one
 * stream per sounding note, as in a fugue; a piano staff wants a few voices that may hold chords. Both it and
 * music21 are Python, and this runs on the phone.
 *
 * A note that fits neither voice goes to the one free soonest, and is cut and tied there as before.
 */
import type { NoteEvent } from './readMidi.ts';
import { type Frac, add, cmp, frac, fracToString, gt, lte } from './fraction.ts';

/** Up to three a staff (owner, 2026-10-14: "Up to 3 voices", shown Chopin's Op. 10 No. 3 written both ways: a held
 *  inner note under a moving melody gets its own voice, as the published edition writes it). */
export const MAX_VOICES = 3;
/** A voice sounding within this long (quarter notes) before an onset is still going: the texture has two voices. */
const STILL_GOING = 1;

interface Voice { end: Frac | null; low: number; high: number; events: NoteEvent[] }

export function splitVoices(events: NoteEvent[], maxVoices = MAX_VOICES): NoteEvent[][] {
  const voices: Voice[] = Array.from({ length: maxVoices }, () => ({ end: null, low: 0, high: 0, events: [] }));
  // Struck together, highest first.
  const onsets = new Map<string, NoteEvent[]>();
  for (const e of [...events].sort((a, b) => cmp(a.start, b.start) || b.midi - a.midi)) {
    const key = fracToString(e.start);
    const list = onsets.get(key);
    if (list) list.push(e);
    else onsets.set(key, [e]);
  }
  const free = (v: Voice, at: Frac) => v.end === null || lte(v.end, at);
  const place = (chord: NoteEvent[], want: number) => {
    const start = chord[0]!.start;
    let at = free(voices[want]!, start) ? want : voices.findIndex((v) => free(v, start));
    if (at < 0) { // none free: the one free soonest (cut and tied there)
      at = 0;
      for (let i = 1; i < voices.length; i++) if (gt(voices[at]!.end!, voices[i]!.end!)) at = i;
    }
    const v = voices[at]!;
    v.events.push(...chord);
    const end = chord.reduce((e, n) => (gt(n.end, e) ? n.end : e), chord[0]!.end);
    if (v.end === null || gt(end, v.end)) v.end = end;
    v.low = Math.min(...chord.map((n) => n.midi));
    v.high = Math.max(...chord.map((n) => n.midi));
  };
  /** Notes struck together, as chords of notes that end together, the one holding the highest note first. */
  const byEnd = (notes: NoteEvent[]) => {
    const chords = new Map<string, NoteEvent[]>();
    for (const n of notes) {
      const key = fracToString(n.end);
      const list = chords.get(key);
      if (list) list.push(n);
      else chords.set(key, [n]);
    }
    return [...chords.values()];
  };
  for (const notes of onsets.values()) {
    const t = notes[0]!.start;
    const going = (v: Voice) => v.end !== null && gt(add(v.end, frac(STILL_GOING)), t);
    const [first, second] = voices;
    if (first && second && going(first) && going(second)) {
      // Two lines going on: each new note joins the line it is nearer, so a melody note and an accompaniment note
      // of the same length are not made one chord (Chopin's Op. 10 No. 3, bar 1). Which line is the higher is read
      // from their notes, not their order: a bass struck first takes the first voice, and the notes above it the
      // second (the left hand of the same bar, where the bass then jumped voices).
      const firstIsHigher = first.low + first.high >= second.low + second.high;
      const [hi, lo] = firstIsHigher ? [0, 1] : [1, 0];
      const boundary = (voices[hi]!.low + voices[lo]!.high) / 2;
      const top = notes.filter((n) => n.midi > boundary), bottom = notes.filter((n) => n.midi <= boundary);
      // A second group in the upper line (a note held under the melody while it moves) gets a voice of its own when
      // there is a third, rather than pushing the other line out of its voice.
      byEnd(top).forEach((chord, i) => place(chord, i === 0 ? hi : Math.min(2, voices.length - 1)));
      byEnd(bottom).forEach((chord) => place(chord, lo));
    } else {
      byEnd(notes).forEach((chord, i) => place(chord, Math.min(i, voices.length - 1)));
    }
  }
  return voices.map((v) => v.events.sort((a, b) => cmp(a.start, b.start) || a.midi - b.midi)).filter((list, i) => i === 0 || list.length > 0);
}
