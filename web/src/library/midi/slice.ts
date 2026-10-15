/**
 * The events as one line of chords — the port of `slice_into_chords`.
 *
 * Every start and end is a boundary; between two boundaries, whatever is
 * sounding is one chord. A pitch that carries on from the slice before without
 * being struck again is tied to it; one struck again is a new note.
 *
 * Every barline is a boundary too, so no chord crosses one — left to a
 * bar-maker, a piece already tied from the one before that crossed a barline is
 * split with its tie reset to "start", and the note reads as struck again.
 * **And every slice whose length is not a rhythm is cut into ones that are**
 * (`notatablePieces`) before anything is built, so the tie bookkeeping below
 * sees them as ordinary slices rather than having to be taught about them
 * afterwards.
 */
import type { NoteEvent } from './readMidi.ts';
import type { BarMap } from './bars.ts';
import { notatablePieces } from './notatable.ts';
import {
  type Frac,
  ZERO,
  add,
  cmp,
  eq,
  fracToString,
  gt,
  lt,
  lte,
  sub,
} from './fraction.ts';

export type TieKind = 'none' | 'start' | 'stop' | 'continue';

export interface SliceNote {
  midi: number;
  tie: TieKind;
}

/** One chord of the rebuilt line: when it sounds, how long, and what is in it. */
export interface Slice {
  at: Frac;
  length: Frac;
  notes: SliceNote[];
  velocity: number | null;
}

export function sliceIntoChords(
  events: NoteEvent[],
  bars: BarMap,
  unitForBar: (index: number) => Frac,
): Slice[] {
  if (events.length === 0) return [];

  let last = ZERO;
  for (const event of events) if (gt(event.end, last)) last = event.end;
  const barCount = bars.indexAt(last) + 2;

  const boundarySet = new Map<string, Frac>();
  const remember = (value: Frac): void => {
    boundarySet.set(fracToString(value), value);
  };
  for (const event of events) {
    remember(event.start);
    remember(event.end);
  }
  for (let i = 0; i < barCount; i += 1) {
    const edge = bars.bar(i).start;
    if (lte(edge, last)) remember(edge);
  }
  const boundaries = [...boundarySet.values()].sort(cmp);

  const filled: Frac[] = [boundaries[0] ?? ZERO];
  for (let i = 0; i + 1 < boundaries.length; i += 1) {
    const leftAt = boundaries[i] ?? ZERO;
    const rightAt = boundaries[i + 1] ?? ZERO;
    const index = bars.indexAt(leftAt);
    const bar = bars.bar(index);
    const pieces = notatablePieces(sub(leftAt, bar.start), sub(rightAt, leftAt), unitForBar(index), bar.beat, bar.length);
    let at = leftAt;
    for (const piece of pieces.slice(0, -1)) {
      at = add(at, piece);
      filled.push(at);
    }
    filled.push(rightAt);
  }

  const line: Slice[] = [];
  // Which slice each sounding pitch was last written into, so a tie can be
  // written backwards onto it.
  let previous = new Map<number, { slice: Slice; note: SliceNote }>();
  let previousEnd: Frac | null = null;

  // The notes sounding in each slice, found in one walk through time rather than by reading every note for every
  // slice (a long piece took a minute: 2026-10-14). Read in the order they were given, as before, which decides
  // which of two overlapping notes of one pitch is kept.
  const byStart = events.map((_, index) => index).sort((a, b) => cmp(events[a]?.start ?? ZERO, events[b]?.start ?? ZERO));
  let nextToStart = 0;
  let active: number[] = [];
  for (let i = 0; i + 1 < filled.length; i += 1) {
    const leftAt = filled[i] ?? ZERO;
    const rightAt = filled[i + 1] ?? ZERO;
    while (nextToStart < byStart.length && lt(events[byStart[nextToStart] ?? 0]?.start ?? ZERO, rightAt)) {
      active.push(byStart[nextToStart] ?? 0);
      nextToStart += 1;
    }
    active = active.filter((index) => gt(events[index]?.end ?? ZERO, leftAt)).sort((a, b) => a - b);
    const sounding = new Map<number, { start: Frac; velocity: number | null }>();
    for (const index of active) {
      const event = events[index];
      if (event && lt(event.start, rightAt) && gt(event.end, leftAt)) {
        // Two notes of one pitch at once (a legato overlap): keep the one
        // struck here.
        if (!sounding.has(event.midi) || eq(event.start, leftAt)) {
          sounding.set(event.midi, { start: event.start, velocity: event.velocity });
        }
      }
    }
    if (sounding.size === 0) {
      previous = new Map();
      previousEnd = null;
      continue;
    }
    const midis = [...sounding.keys()].sort((a, b) => a - b);
    const velocities = midis
      .map((midi) => sounding.get(midi)?.velocity)
      .filter((value): value is number => value !== null && value !== undefined);
    const slice: Slice = {
      at: leftAt,
      length: sub(rightAt, leftAt),
      notes: midis.map((midi) => ({ midi, tie: 'none' })),
      velocity: velocities.length > 0 ? Math.max(...velocities) : null,
    };
    const joined = previousEnd !== null && eq(previousEnd, leftAt);
    const current = new Map<number, { slice: Slice; note: SliceNote }>();
    slice.notes.forEach((note) => {
      const struckHere = eq(sounding.get(note.midi)?.start ?? ZERO, leftAt);
      const before = previous.get(note.midi);
      if (joined && before && !struckHere) {
        before.note.tie = before.note.tie === 'stop' ? 'continue' : 'start';
        note.tie = 'stop';
      }
      current.set(note.midi, { slice, note });
    });
    line.push(slice);
    previous = current;
    previousEnd = rightAt;
  }
  return line;
}
