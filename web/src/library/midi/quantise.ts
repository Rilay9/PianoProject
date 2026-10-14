/**
 * The quantisation policy — the port of `snap`, `detect_swing`, `deswing`,
 * `separate_repeats` and `quantise`.
 *
 * Every constant is the Python's, with the Python's reason, because a number
 * copied without its reason is a number somebody will "tune".
 */
import type { NoteEvent } from './readMidi.ts';
import type { BarMap } from './bars.ts';
import {
  type Frac,
  ZERO,
  abs,
  add,
  cmp,
  div,
  frac,
  fracToString,
  gt,
  gte,
  isZero,
  lt,
  lte,
  mod,
  mul,
  sub,
  toNumber,
  trunc,
} from './fraction.ts';

/**
 * A swung off-beat eighth sounds at two thirds of the beat. The number is the
 * app's own (`app/src/audio/backingLoop.ts`, `SWING_OFFBEAT`, quoted in
 * pending-review Entry 24 item 6) rather than a second opinion, so what the
 * converter writes and what the app judges cannot drift apart.
 */
export const SWING_RATIO = frac(2, 3);

/**
 * Half the width of the window an onset must fall in to be counted as a swung
 * off-beat or as a straight one, as a share of the beat.
 *
 * **The same width either side, which is the whole point.** The first version
 * had a swung window of a quarter of the beat and a straight one of a tenth,
 * and called the Bach prelude and the Scarlatti sonata swung — because a wide
 * window catches more onsets than a narrow one whatever is played, so the
 * comparison was measuring the windows and not the music.
 */
export const SWING_HALF_WINDOW = frac(1, 16);

/**
 * How many swung off-beats a run needs before the whole of it is called swung,
 * and by what factor they must outnumber the straight ones. Two conditions
 * rather than one: a ratio alone calls a four-note run swung on one stray
 * onset, and a count alone calls a long straight run swung on the handful of
 * eighths that happened to be late.
 */
export const SWING_MIN_OFFBEATS = 8;
export const SWING_MIN_RATIO = 2;

/**
 * The share of onsets that must land on a beat before the beats are believed
 * at all — the "where the tempo map implies it" half of the rule.
 *
 * A MIDI file states where its beats are; whether the performance agreed is a
 * separate question, and off-beat positions mean nothing when it did not.
 */
export const SWING_MIN_ON_BEAT = frac(3, 10);

export interface SwingReport {
  swung: boolean;
  nearSwung: number;
  nearStraight: number;
  /** Onsets a third of the way through the beat: triplets (and the second eighth of 6/8), which swing never has. */
  nearThird?: number;
  onBeatShare: number;
  /** Set when the caller decided instead of the onsets. */
  forced?: boolean;
}

export interface QuantiseReport {
  events: NoteEvent[];
  gridByBar: Frac[];
  swing: SwingReport;
  /** Strikes (indices into `events`) written as one note with an earlier strike of the same key; left out. */
  joined: Set<number>;
  /** The largest distance any onset was moved, in quarter notes. */
  moved: Frac;
  /**
   * The share of onsets the grid did not move (0–1). A file written in a notation program has nearly all its
   * onsets on the grid; a played one, recorded without a click, nearly none, and its bars are then a guess.
   */
  onGrid: number;
}

/** `value` on the nearest multiple of `unit`, halves going up. */
export function snap(value: Frac, unit: Frac): Frac {
  const steps = div(value, unit);
  let whole = trunc(steps);
  const rest = sub(steps, frac(whole));
  if (gte(rest, frac(1, 2))) whole += 1;
  else if (lte(rest, frac(-1, 2))) whole -= 1;
  return mul(unit, frac(whole));
}

/**
 * Does this performance play its off-beats long-short?
 *
 * The beat comes from the caller (the time signature, read through the tempo
 * map) rather than being assumed to be a quarter, because the position of an
 * onset *within its beat* is the whole measurement and a 6/8 beat is not a
 * quarter.
 *
 * Three conditions, and all three have to hold:
 *
 * 1. The onsets agree with the file's beats often enough for "off the beat" to
 *    mean anything (`SWING_MIN_ON_BEAT`). This is the tempo map's half of it: a
 *    wall-clock recording states a tempo nobody played to, and every position
 *    within its beat is then an artefact of the stated tempo.
 * 2. There are at least `SWING_MIN_OFFBEATS` onsets near two thirds of a beat.
 * 3. They outnumber the ones near a half by `SWING_MIN_RATIO`, counted in
 *    windows of the same width (`SWING_HALF_WINDOW`).
 */
export function detectSwing(events: NoteEvent[], beat: Frac): SwingReport {
  let nearSwung = 0;
  let nearStraight = 0;
  let nearThird = 0;
  let onBeat = 0;
  for (const event of events) {
    const position = div(mod(event.start, beat), beat);
    const toTheBeat = lt(position, sub(frac(1), position)) ? position : sub(frac(1), position);
    if (lte(toTheBeat, SWING_HALF_WINDOW)) onBeat += 1;
    if (lte(abs(sub(position, frac(1, 2))), SWING_HALF_WINDOW)) nearStraight += 1;
    else if (lte(abs(sub(position, SWING_RATIO)), SWING_HALF_WINDOW)) nearSwung += 1;
    else if (lte(abs(sub(position, frac(1, 3))), SWING_HALF_WINDOW)) nearThird += 1;
  }
  const placed = events.length > 0 ? frac(onBeat, events.length) : ZERO;
  // Notes at two thirds of a dotted beat (6/8, 9/8, 12/8) are the metre's own eighths, and notes at two thirds of a
  // plain beat come with notes at one third when they are triplets: swing has the off-beat late and nothing between
  // (2026-10-14: 27 of ASAP's 235 classical score files were called swung, from Bach preludes to Schubert's
  // Impromptus, and a sixteenth was taken off every third eighth).
  const compound = beat.n % 3n === 0n && beat.d % 2n === 0n;
  const swung =
    !compound &&
    gte(placed, SWING_MIN_ON_BEAT) &&
    nearSwung >= SWING_MIN_OFFBEATS &&
    nearSwung >= SWING_MIN_RATIO * Math.max(nearStraight, 1) &&
    nearSwung >= SWING_MIN_RATIO * nearThird;
  return { swung, nearSwung, nearStraight, nearThird, onBeatShare: toNumber(placed) };
}

/**
 * An onset two thirds of the way through its beat, moved to the half.
 *
 * The convention a swing marking states is that a written pair of eighths is
 * played as the first and third of a triplet, so the *written* position of what
 * was played at two thirds is the half. Writing the triplet instead would be a
 * true transcription of the sound and a false one of the music, and the app
 * judges a swung piece by moving the expected time the same way.
 */
export function deswing(value: Frac, beat: Frac): Frac {
  const within = div(mod(value, beat), beat);
  if (lte(abs(sub(within, SWING_RATIO)), SWING_HALF_WINDOW)) {
    return add(sub(value, mod(value, beat)), div(beat, frac(2)));
  }
  return value;
}

/**
 * Two strikes of one pitch that the grid put on one onset, pulled apart.
 *
 * A grid that merges them loses a note, and losing a note is the one thing this
 * tool refuses to do. The second strike moves forward one grid unit and the
 * first is shortened to meet it, when that place is free. Two strikes closer
 * than the finest grid (a score file's near-zero-length strike just before a
 * note: Beethoven's Op. 101, every sixteenth of a passage), or two with
 * another strike of the key already in the next place, are written as one
 * note, held to the later one's end, and counted. Before (2026-10-14) the
 * strike was always pushed, onto the next strike, which was pushed in turn:
 * a run crept beats forward, 11 beats in Op. 101.
 *
 * Returns the indices (into `events`) of the strikes written as one with an
 * earlier one; the caller leaves them out.
 */
export function separateRepeats(
  events: NoteEvent[],
  unitForBar: (index: number) => Frac,
  bars: BarMap,
  /** Where each strike was before the grid (its played or written time). */
  played: Frac[] = events.map((e) => e.start),
  /** Which part each strike is in: only strikes in one part are one key struck twice. */
  partOf: (index: number) => number = () => 0,
): Set<number> {
  const keyOf = (at: Frac, i: number): string => `${fracToString(at)}:${String(events[i]!.midi)}:${String(partOf(i))}`;
  // Every place a strike was snapped to, so a moved strike does not take a later strike's place.
  const snapped = new Set(events.map((e, i) => keyOf(e.start, i)));
  const seen = new Map<string, number>();
  const joined = new Set<number>();
  const ordered = events.map((_, i) => i).sort((a, b) => cmp(events[a]!.start, events[b]!.start) || events[a]!.midi - events[b]!.midi);
  for (const i of ordered) {
    const event = events[i]!;
    const before = seen.get(keyOf(event.start, i));
    if (before !== undefined) {
      const earlier = events[before]!;
      const unit = unitForBar(bars.indexAt(event.start));
      const next = add(event.start, unit);
      const hair = lt(abs(sub(played[i]!, played[before]!)), FINEST);
      if (hair || snapped.has(keyOf(next, i)) || seen.has(keyOf(next, i))) {
        if (gt(event.end, earlier.end)) earlier.end = event.end;
        joined.add(i);
        continue;
      }
      if (gt(earlier.end, next)) earlier.end = next;
      event.start = next;
      if (lte(event.end, event.start)) event.end = add(event.start, unit);
    }
    seen.set(keyOf(event.start, i), i);
  }
  return joined;
}

/**
 * Every onset and release on a grid, and the grid stated.
 *
 * **The policy, in four sentences.**
 *
 * 1. The candidate grids are the multiples of `1/d` of a quarter note for each
 *    `d` in `divisors`; the default `4,3` offers sixteenths and eighth-note
 *    triplets.
 * 2. **The choice is made once per bar, not once per note.** The grid a bar
 *    takes is the one its own onsets are nearest to, totalled over the bar.
 *    Choosing per note is what the previous version did, and it is why all
 *    three real recordings crashed the MusicXML exporter: a bar holding one
 *    onset on a quarter grid and the next on a third has slices a twelfth long
 *    between them, and a twelfth of a beat here and five twelfths there is not
 *    a rhythm anybody can write.
 * 3. A release is snapped to the grid of the bar it falls in, so a note that
 *    crosses a barline is measured by both bars honestly; a note whose release
 *    lands on its own onset is given one grid unit rather than being dropped.
 * 4. Where the run is swung, an off-beat onset is moved to the half of the beat
 *    *before* the grid is chosen (`deswing`), so a swung performance is written
 *    straight and the bar is not dragged onto a triplet grid by it.
 *
 * Returns the new events in the order they were given — the caller relies on
 * that to put them back into the parts they came from.
 */
/**
 * Grids a bar gets only when every onset in it sits exactly on one (or its length needs one): sextuplet sixteenths,
 * 32nds, triplet 32nds, 64ths, triplet 64ths, coarsest first (2026-10-14). Exported score MIDI files have them
 * (Chopin, Liszt, Beethoven on ASAP, and grace notes given real time in a bar lengthened by a 64th); a played file's
 * onsets never sit exactly on them, so it keeps the usual grids.
 */
export const EXACT_ONLY_DIVISORS = [6, 8, 12, 16, 24];
/** The finest grid a bar takes to keep two strikes of one key apart: triplet 64ths, the finest the writer draws. */
const FINEST = frac(1, 24);

export function quantise(
  events: NoteEvent[],
  options: {
    bars: BarMap;
    beat: Frac;
    divisors: number[];
    swing: boolean | null;
    /**
     * Which kept part (staff) each event is in, when the file's tracks are kept as the staves: a strike in one
     * part and one in the other are two hands, never one key struck twice (a unison between the hands was written
     * as a 16th and a late re-strike, 2026-10-14). Left out, every event is one part.
     */
    parts?: number[];
  },
): QuantiseReport {
  const { bars, beat, divisors, swing } = options;
  const partOf = (i: number): number => options.parts?.[i] ?? 0;
  if (events.length === 0) {
    return {
      events: [],
      joined: new Set(),
      gridByBar: [],
      swing: { swung: false, nearSwung: 0, nearStraight: 0, onBeatShare: 0 },
      moved: ZERO,
      onGrid: 1,
    };
  }

  const units = divisors.map((d) => frac(1, d));
  const measured = detectSwing(events, beat);
  const swingReport: SwingReport =
    swing === null ? measured : { ...measured, swung: swing, forced: true };
  const swung = swingReport.swung;

  const starts = events.map((event) => (swung ? deswing(event.start, beat) : event.start));
  let last = events[0]?.end ?? ZERO;
  for (const event of events) if (gt(event.end, last)) last = event.end;
  const lastBar = bars.indexAt(last) + 1;

  // The onsets in each bar, with their pitches, sorted into bars once rather than filtered for every bar.
  const startsByBar = new Map<number, { at: Frac; midi: number; part: number }[]>();
  starts.forEach((s, i) => {
    const index = bars.indexAt(s);
    const onset = { at: s, midi: events[i]?.midi ?? 0, part: partOf(i) };
    const list = startsByBar.get(index);
    if (list) list.push(onset);
    else startsByBar.set(index, [onset]);
  });
  const gridByBar: Frac[] = [];
  for (let index = 0; index <= lastBar; index += 1) {
    const low = bars.bar(index).start;
    const onsets = startsByBar.get(index) ?? [];
    const inside = onsets.map((o) => o.at);
    if (inside.length === 0) {
      gridByBar.push(units[0] ?? frac(1, 4));
      continue;
    }
    let best = units[0] ?? frac(1, 4);
    let bestCost: Frac | null = null;
    const cost = (unit: Frac): Frac => {
      let total = ZERO;
      for (const s of inside) total = add(total, abs(sub(sub(s, low), snap(sub(s, low), unit))));
      return total;
    };
    for (const unit of units) {
      const total = cost(unit);
      // `min` in Python keeps the first of equal costs, so the divisors' own
      // order is the tie-break — and it is the order the caller gave.
      if (bestCost === null || lt(total, bestCost)) {
        best = unit;
        bestCost = total;
      }
    }
    // A finer grid (32nds, sextuplets, triplet 32nds) only where it fits the bar exactly and the usual ones do not:
    // a score MIDI's 32nd run or odd-length bar (a written-out cadenza), never a played file's timing noise.
    const tiles = (unit: Frac): boolean => isZero(mod(bars.bar(index).length, unit));
    if ((bestCost !== null && !isZero(bestCost)) || !tiles(best)) {
      const exact = EXACT_ONLY_DIVISORS.map((d) => frac(1, d)).find((unit) => tiles(unit) && isZero(cost(unit)));
      if (exact) best = exact;
    }
    // A grid that puts two strikes of one key on one onset cannot hold the bar: a trill or a fast repeated note
    // has more strikes than the grid has places. Halve it (sixteenths to 32nds, triplet eighths to sextuplets)
    // until the strikes are apart, coarsest first, so the bar is written as the run it is (2026-10-14). Before,
    // the grid was kept and `separateRepeats` pushed each extra strike one place later, onto the next strike,
    // which was pushed in turn: a trill crept beats forward into the bars after it (54 of 235 ASAP score files
    // had notes written more than a beat from where they are played, one 16 beats; Beethoven's Op. 78 trill).
    // Only strikes a grid could keep apart are counted: two a hair apart (a score file's near-zero-length strike
    // just before a note) merge on every grid, and counting them hid the 16ths a finer grid would have kept apart
    // (Chopin's Barcarolle, bar 83).
    // The strikes on the next barline count too: a strike a 32nd before it is rounded onto it (La Campanella,
    // bar 67).
    const nextStart = add(low, bars.bar(index).length);
    const atBarline = (startsByBar.get(index + 1) ?? []).filter((o) => lt(abs(sub(o.at, nextStart)), FINEST));
    const merges = (unit: Frac): number => {
      const taken = new Map<string, Frac>();
      let merged = 0;
      for (const o of [...onsets, ...atBarline]) {
        const k = `${fracToString(snap(sub(o.at, low), unit))}:${String(o.midi)}:${String(o.part)}`;
        const other = taken.get(k);
        if (other === undefined) taken.set(k, o.at);
        else if (gte(abs(sub(o.at, other)), FINEST)) merged += 1;
      }
      return merged;
    };
    let mergedAt = merges(best);
    for (let finer = div(best, frac(2)); mergedAt > 0 && gte(finer, FINEST); finer = div(finer, frac(2))) {
      if (!tiles(finer)) continue;
      const m = merges(finer);
      if (m < mergedAt) {
        best = finer;
        mergedAt = m;
      }
    }
    gridByBar.push(best);
  }

  const unitForBar = (index: number): Frac => {
    const clamped = Math.min(Math.max(index, 0), gridByBar.length - 1);
    return gridByBar[clamped] ?? units[0] ?? frac(1, 4);
  };

  const out: NoteEvent[] = [];
  events.forEach((event, i) => {
    const start = starts[i] ?? event.start;
    // On the grid of the bar the moment falls in, counted from that bar's start (a bar after a pickup or a 5/8
    // bar need not start on the grid counted from 0).
    const startBar = bars.indexAt(start);
    const startFrom = bars.bar(startBar).start;
    const startUnit = unitForBar(startBar);
    let newStart = add(startFrom, snap(sub(start, startFrom), startUnit));
    if (lt(newStart, ZERO)) newStart = ZERO;
    const endBar = bars.indexAt(event.end);
    const endFrom = bars.bar(endBar).start;
    const endUnit = unitForBar(endBar);
    let newEnd = add(endFrom, snap(sub(event.end, endFrom), endUnit));
    // A note too short to keep its own end gets one unit of the grid of the bar it now starts in: one rounded onto
    // the next barline took the last bar's (a triplet eighth in a bar of sixteenths, 2026-10-14).
    if (lte(newEnd, newStart)) newEnd = add(newStart, unitForBar(bars.indexAt(newStart)));
    out.push({ start: newStart, end: newEnd, midi: event.midi, velocity: event.velocity });
  });
  const joined = separateRepeats(out, unitForBar, bars, starts, partOf);
  // Measured after the repeats are pulled apart, which moves notes too.
  let moved = ZERO;
  let unmoved = 0;
  out.forEach((event, i) => {
    const distance = abs(sub(event.start, events[i]!.start));
    if (gt(distance, moved)) moved = distance;
    if (isZero(distance)) unmoved += 1;
  });
  return { events: out, joined, gridByBar, swing: swingReport, moved, onGrid: unmoved / events.length };
}
