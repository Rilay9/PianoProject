/**
 * Where the bars fall, from every time signature the MIDI file states (2026-10-14).
 *
 * The converter used to read the first time signature and lay the whole piece out in it. Files exported from a
 * notation program write a pickup as a short bar with its own metre (a 1/8 or 1/16 bar, then 4/4), and many pieces
 * change metre, so one bar length put every barline after the first change in the wrong place: on ASAP's score MIDI
 * files Beethoven's Op. 111 i came out as 13,000 bars of 1/16. Everything that needs a barline, a bar's grid or a
 * beat asks this map instead.
 *
 * A metre change that arrives in the middle of a bar ends that bar there (the bar is short), which is what a pickup
 * written as its own bar is. Past the last bar built, bars go on in the last metre.
 */
import { type Frac, ZERO, add, cmp, floorDiv, gt, gte, lt, mul, sub, frac } from './fraction.ts';
import { type TimeSignature, DEFAULT_TIME_SIGNATURE, barLengthOf, beatLengthOf } from './readMidi.ts';

export interface Bar {
  start: Frac;
  length: Frac;
  time: TimeSignature;
  beat: Frac;
}

export interface MetreChange {
  at: Frac;
  time: TimeSignature;
}

export interface BarMap {
  /** The bars built, up to the end asked for. */
  bars: Bar[];
  /** The bar a moment falls in (past the last bar built: counted on in the last metre; before 0: 0). */
  indexAt(at: Frac): number;
  /** Bar `index`, built on in the last metre past the end. */
  bar(index: number): Bar;
  /**
   * A first bar shorter than the second and in another metre: a pickup, written in the second bar's metre and
   * marked implicit, as notation programs write one.
   */
  pickup: boolean;
}

const same = (a: TimeSignature, b: TimeSignature): boolean => a.beats === b.beats && a.beatType === b.beatType;

/**
 * The bars from 0 to at least `until`. `changes` are the file's time signatures with where they fall; none means
 * 4/4 throughout. A first change after 0 is taken to hold from 0 (nothing earlier said otherwise).
 */
export function barMap(changes: MetreChange[], until: Frac): BarMap {
  const sorted = [...changes].sort((a, b) => cmp(a.at, b.at));
  // Two changes at one moment: the later in the file wins (a track restating the conductor's).
  const byMoment: MetreChange[] = [];
  for (const change of sorted) {
    const last = byMoment[byMoment.length - 1];
    if (last && cmp(last.at, change.at) === 0) byMoment[byMoment.length - 1] = change;
    else byMoment.push(change);
  }
  if (byMoment.length === 0) byMoment.push({ at: ZERO, time: DEFAULT_TIME_SIGNATURE });
  const first = byMoment[0];
  if (first && gt(first.at, ZERO)) byMoment[0] = { at: ZERO, time: first.time };

  const bars: Bar[] = [];
  let at = ZERO;
  let k = 0;
  const make = (start: Frac, length: Frac, time: TimeSignature): Bar => ({ start, length, time, beat: beatLengthOf(time) });
  while (lt(at, until) || bars.length === 0) {
    while (k + 1 < byMoment.length && gte(at, byMoment[k + 1]?.at ?? at)) k += 1;
    const time = byMoment[k]?.time ?? DEFAULT_TIME_SIGNATURE;
    let length = barLengthOf(time);
    const next = byMoment[k + 1];
    if (next && lt(next.at, add(at, length))) length = sub(next.at, at);
    bars.push(make(at, length, time));
    at = add(at, length);
  }

  const lastBar = (): Bar => bars[bars.length - 1] ?? make(ZERO, barLengthOf(DEFAULT_TIME_SIGNATURE), DEFAULT_TIME_SIGNATURE);
  // The metre bars go on in past the end: the last change's, at full length.
  const tail = byMoment[byMoment.length - 1]?.time ?? DEFAULT_TIME_SIGNATURE;
  const tailLength = barLengthOf(tail);
  const tailStart = add(lastBar().start, lastBar().length);

  const bar = (index: number): Bar => {
    if (index < 0) return bars[0] ?? lastBar();
    const built = bars[index];
    if (built) return built;
    const past = index - bars.length;
    return make(add(tailStart, mul(tailLength, frac(past))), tailLength, tail);
  };

  const indexAt = (moment: Frac): number => {
    if (lt(moment, ZERO)) return 0;
    if (gte(moment, tailStart)) return bars.length + floorDiv(sub(moment, tailStart), tailLength);
    let low = 0;
    let high = bars.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (gte(moment, bars[mid]?.start ?? ZERO)) low = mid;
      else high = mid - 1;
    }
    return low;
  };

  const b0 = bars[0];
  const b1 = bars[1];
  const pickup = !!b0 && !!b1 && lt(b0.length, b1.length) && !same(b0.time, b1.time);
  return { bars, indexAt, bar, pickup };
}

/** The bar map of one metre from 0: what the converter did before, kept for a caller that states a metre. */
export function steadyBars(time: TimeSignature, until: Frac): BarMap {
  return barMap([{ at: ZERO, time }], until);
}
