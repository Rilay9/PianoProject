/**
 * The quantisation policy — the port of `snap`, `detect_swing`, `deswing`,
 * `separate_repeats` and `quantise`.
 *
 * Every constant is the Python's, with the Python's reason, because a number
 * copied without its reason is a number somebody will "tune".
 */
import type { NoteEvent } from './readMidi';
import {
  type Frac,
  ZERO,
  abs,
  add,
  cmp,
  div,
  floorDiv,
  frac,
  fracToString,
  gt,
  gte,
  lt,
  lte,
  mod,
  mul,
  sub,
  toNumber,
  trunc,
} from './fraction';

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
  onBeatShare: number;
  /** Set when the caller decided instead of the onsets. */
  forced?: boolean;
}

export interface QuantiseReport {
  events: NoteEvent[];
  gridByBar: Frac[];
  swing: SwingReport;
  /** The largest distance any onset was moved, in quarter notes. */
  moved: Frac;
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
  let onBeat = 0;
  for (const event of events) {
    const position = div(mod(event.start, beat), beat);
    const toTheBeat = lt(position, sub(frac(1), position)) ? position : sub(frac(1), position);
    if (lte(toTheBeat, SWING_HALF_WINDOW)) onBeat += 1;
    if (lte(abs(sub(position, frac(1, 2))), SWING_HALF_WINDOW)) nearStraight += 1;
    else if (lte(abs(sub(position, SWING_RATIO)), SWING_HALF_WINDOW)) nearSwung += 1;
  }
  const placed = events.length > 0 ? frac(onBeat, events.length) : ZERO;
  const swung =
    gte(placed, SWING_MIN_ON_BEAT) &&
    nearSwung >= SWING_MIN_OFFBEATS &&
    nearSwung >= SWING_MIN_RATIO * Math.max(nearStraight, 1);
  return { swung, nearSwung, nearStraight, onBeatShare: toNumber(placed) };
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
 * first is shortened to meet it.
 */
export function separateRepeats(
  events: NoteEvent[],
  unitForBar: (index: number) => Frac,
  barLength: Frac,
): void {
  const seen = new Map<string, NoteEvent>();
  const key = (event: NoteEvent): string => `${fracToString(event.start)}:${String(event.midi)}`;
  const ordered = [...events].sort((a, b) => cmp(a.start, b.start) || a.midi - b.midi);
  for (const event of ordered) {
    while (seen.has(key(event))) {
      const unit = unitForBar(floorDiv(event.start, barLength));
      const earlier = seen.get(key(event));
      if (earlier && gt(earlier.end, add(event.start, unit))) {
        earlier.end = add(event.start, unit);
      }
      event.start = add(event.start, unit);
      if (lte(event.end, event.start)) event.end = add(event.start, unit);
    }
    seen.set(key(event), event);
  }
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
export function quantise(
  events: NoteEvent[],
  options: { barLength: Frac; beat: Frac; divisors: number[]; swing: boolean | null },
): QuantiseReport {
  const { barLength, beat, divisors, swing } = options;
  if (events.length === 0) {
    return {
      events: [],
      gridByBar: [],
      swing: { swung: false, nearSwung: 0, nearStraight: 0, onBeatShare: 0 },
      moved: ZERO,
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
  const lastBar = floorDiv(last, barLength) + 1;

  const gridByBar: Frac[] = [];
  for (let index = 0; index <= lastBar; index += 1) {
    const low = mul(barLength, frac(index));
    const high = add(low, barLength);
    const inside = starts.filter((s) => gte(s, low) && lt(s, high));
    if (inside.length === 0) {
      gridByBar.push(units[0] ?? frac(1, 4));
      continue;
    }
    let best = units[0] ?? frac(1, 4);
    let bestCost: Frac | null = null;
    for (const unit of units) {
      let total = ZERO;
      for (const s of inside) total = add(total, abs(sub(s, snap(s, unit))));
      // `min` in Python keeps the first of equal costs, so the divisors' own
      // order is the tie-break — and it is the order the caller gave.
      if (bestCost === null || lt(total, bestCost)) {
        best = unit;
        bestCost = total;
      }
    }
    gridByBar.push(best);
  }

  const unitForBar = (index: number): Frac => {
    const clamped = Math.min(Math.max(index, 0), gridByBar.length - 1);
    return gridByBar[clamped] ?? units[0] ?? frac(1, 4);
  };

  const out: NoteEvent[] = [];
  let moved = ZERO;
  events.forEach((event, i) => {
    const start = starts[i] ?? event.start;
    const startUnit = unitForBar(floorDiv(start, barLength));
    let newStart = snap(start, startUnit);
    if (lt(newStart, ZERO)) newStart = ZERO;
    const endUnit = unitForBar(floorDiv(event.end, barLength));
    let newEnd = snap(event.end, endUnit);
    if (lte(newEnd, newStart)) newEnd = add(newStart, startUnit);
    const distance = abs(sub(newStart, event.start));
    if (gt(distance, moved)) moved = distance;
    out.push({ start: newStart, end: newEnd, midi: event.midi, velocity: event.velocity });
  });
  separateRepeats(out, unitForBar, barLength);
  return { events: out, gridByBar, swing: swingReport, moved };
}
