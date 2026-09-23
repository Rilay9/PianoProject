/**
 * The hand split — the port of `percentile` and `split_hands`.
 */
import type { NoteEvent } from './readMidi';
import { type Frac, ZERO, abs, add, cmp, div, frac, fracToString, gt, lt, mul, sub } from './fraction';

/**
 * How far apart, in semitones, the two notes of one hand may be before the
 * split stops believing one hand played both. An octave and a step: a tenth is
 * reachable and a twelfth is not, and the cases in between are rare enough that
 * erring towards "two hands" loses less than erring the other way.
 */
export const HAND_SPAN_SEMITONES = 14;

/**
 * How much of the new note each hand's running centre takes. At 0.4 the centre
 * lags a line moving by one semitone a note by about a semitone and a half,
 * which is enough memory to survive a leap and little enough to follow a scale.
 */
export const HAND_MEMORY = frac(2, 5);

export interface HandSplit {
  right: NoteEvent[];
  left: NoteEvent[];
  /** The boundary per onset, which is the claim "the boundary moves" made checkable. */
  boundary: [Frac, Frac][];
}

export function percentile(values: number[], share: Frac): Frac {
  const ordered = [...values].sort((a, b) => a - b);
  if (ordered.length === 0) return frac(60);
  // Python's `int(share * (len - 1))`: truncated, not rounded.
  const scaled = mul(share, frac(ordered.length - 1));
  const index = Number(scaled.n / scaled.d);
  return frac(ordered[index] ?? 60);
}

/**
 * One recorded track of two-hand playing, split into a left and a right.
 *
 * **The rule.** Not a fixed middle C — a waltz bass sits under middle C and its
 * right hand starts on it, and a piece that climbs an octave would hand the
 * whole second half to one hand. The boundary *moves*, and what moves it is
 * voice-leading:
 *
 * * Each hand carries a running centre (`HAND_MEMORY`): a smoothed average of
 *   the notes it has been given, which moves with the line.
 * * Notes struck together are one group, and a group is cut in **one** place:
 *   everything below the cut is the left hand, everything above it the right.
 *   Two hands cannot interleave within one instant on a piano, and allowing it
 *   produced assignments no hand could play.
 * * The cut is the one minimising the total distance from each note to the
 *   predicted pitch of the hand it lands in, plus a penalty for asking either
 *   hand to span more than `maxSpan` semitones.
 * * The boundary that comes out — the midpoint between the top of the left
 *   block and the bottom of the right — is returned per onset.
 *
 * **Where it fails**, said here rather than left to be discovered:
 *
 * * At a crossing, the two lines are at the same pitch by definition, and
 *   nothing in the onsets tells them apart. From the meeting onwards each line
 *   carries on in the other hand; `midiHandSplit.test.ts` pins what it does.
 * * A left hand that leaps over the right and comes back — the melody note
 *   taken by the left in late Romantic writing — is given to the right, every
 *   time, because its pitch is the only evidence and its pitch is the right
 *   hand's.
 * * Notes struck together in the same register are cut by pitch alone, so the
 *   lower is always the left.
 * * A third voice (an inner line either hand might take) is not modelled at
 *   all; every note goes to one of two hands.
 */
export function splitHands(events: NoteEvent[], maxSpan = HAND_SPAN_SEMITONES): HandSplit {
  if (events.length === 0) return { right: [], left: [], boundary: [] };

  const pitches = events.map((event) => event.midi);
  const centre = {
    left: percentile(pitches, frac(1, 4)),
    right: percentile(pitches, frac(3, 4)),
  };

  const groups = new Map<string, { at: Frac; members: NoteEvent[] }>();
  for (const event of events) {
    const key = fracToString(event.start);
    const group = groups.get(key);
    if (group) group.members.push(event);
    else groups.set(key, { at: event.start, members: [event] });
  }

  const right: NoteEvent[] = [];
  const left: NoteEvent[] = [];
  const boundary: [Frac, Frac][] = [];
  const spanPenalty = frac(1000);
  const span = frac(maxSpan);

  const onsets = [...groups.values()].sort((a, b) => cmp(a.at, b.at));
  for (const { at, members: unordered } of onsets) {
    // Python's `sorted` is stable, so equal pitches keep the order they were
    // read in.
    const members = [...unordered].sort((a, b) => a.midi - b.midi);
    const heights = members.map((event) => frac(event.midi));

    const cost = (cut: number): Frac => {
      let total = ZERO;
      const low = heights.slice(0, cut);
      const high = heights.slice(cut);
      for (const p of low) total = add(total, abs(sub(p, centre.left)));
      for (const p of high) total = add(total, abs(sub(p, centre.right)));
      for (const block of [low, high]) {
        const first = block[0];
        const last = block.at(-1);
        if (first && last && gt(sub(last, first), span)) {
          total = add(total, mul(spanPenalty, sub(sub(last, first), span)));
        }
      }
      return total;
    };

    let bestCut = 0;
    let bestCost: Frac | null = null;
    for (let cut = 0; cut <= members.length; cut += 1) {
      const here = cost(cut);
      // `min` in Python keeps the first of equal costs.
      if (bestCost === null || lt(here, bestCost)) {
        bestCut = cut;
        bestCost = here;
      }
    }
    const lowBlock = members.slice(0, bestCut);
    const highBlock = members.slice(bestCut);
    left.push(...lowBlock);
    right.push(...highBlock);
    for (const [side, block] of [
      ['left', lowBlock],
      ['right', highBlock],
    ] as const) {
      if (block.length === 0) continue;
      let sum = ZERO;
      for (const event of block) sum = add(sum, frac(event.midi));
      const mean = div(sum, frac(block.length));
      centre[side] = add(mul(centre[side], sub(frac(1), HAND_MEMORY)), mul(mean, HAND_MEMORY));
    }
    const lowTop = lowBlock.at(-1);
    const highBottom = highBlock[0];
    if (lowTop && highBottom) {
      boundary.push([at, div(add(frac(lowTop.midi), frac(highBottom.midi)), frac(2))]);
    } else {
      const previous = boundary.at(-1);
      boundary.push([at, previous ? previous[1] : div(add(centre.left, centre.right), frac(2))]);
    }
  }

  right.sort((a, b) => cmp(a.start, b.start) || a.midi - b.midi);
  left.sort((a, b) => cmp(a.start, b.start) || a.midi - b.midi);
  return { right, left, boundary };
}
