/**
 * Durations that are rhythms — the port of `is_notatable` and `notatable_pieces`.
 *
 * The Python asks music21 for a `Duration` and then refuses what a reader would
 * not call a rhythm: one duration type, at most one dot, and any tuplet three
 * in the time of two. There is no music21 here, so the same question is asked
 * the other way round — **is the length one of the things that test admits?** —
 * which is the same rule stated as a construction instead of as a filter:
 *
 *     length = base × (1 or 1½) × (1 or ⅔)
 *
 * with `base` one written note-head the writer draws, a breve down to a 64th (music21's own range, a duplex maxima
 * down to a 512th, until 2026-10-14; see `isNotatable`).
 *
 * The two readings were compared against each other before this was written:
 * every multiple of 1/24, 1/16, 1/12, 1/32, 1/3 and 1/64 of a quarter note up
 * to eight quarters — 1,208 lengths, which covers every slice the grids 1/4
 * and 1/3 and the differences between them can produce — and they agree on all
 * of them. That comparison is a development check and not a committed test:
 * one side of it is music21, which the app does not have.
 *
 * The lengths the Python's own test names are pinned in `midiRhythm.test.ts`:
 * a dotted eighth and a triplet eighth are rhythms; five twelfths (which
 * music21 writes as a 6:5 tuplet) and five sixteenths (which it writes as two
 * tied note-heads) are not. Those two are the shape that made all three real
 * recordings throw "Cannot convert inexpressible durations to MusicXML".
 */
import {
  type Frac,
  add,
  div,
  floorDiv,
  frac,
  gt,
  lt,
  lte,
  mul,
  sub,
  trunc,
  ZERO,
} from './fraction.ts';
import { DIVISIONS, noteShape } from './writer.ts';

/**
 * Is `length` one written note-head, undotted or with one dot, plain or in a triplet?
 *
 * Asked of the writer itself (2026-10-14): the rule above, with the note-heads the writer draws, a breve down to a
 * 64th. It used to admit a duplex maxima down to a 512th, so a length no head here carries passed as a rhythm and
 * was written as a quarter, flagged by the check: a 16-beat note in Liszt's Transcendental Étude No. 9.
 */
export function isNotatable(length: Frac): boolean {
  if (lte(length, ZERO)) return false;
  const divisions = mul(length, frac(DIVISIONS));
  return divisions.d === 1n && noteShape(Number(divisions.n)) !== null;
}

/**
 * The fewest note-heads, longest first, that add up to `divisions` (a length in the writer's divisions), or null.
 * The last resort for a length between two grids (a triplet-32nd onset next to a 64th one: seven 48ths of a beat,
 * Beethoven's Op. 78), which no multiple of the bar's own grid carries.
 */
function fewestHeads(divisions: number): number[] | null {
  const heads: number[] = [];
  for (let n = divisions; n > 0; n -= 1) if (noteShape(n) !== null) heads.push(n);
  const best: (number[] | null)[] = [[]];
  for (let left = 1; left <= divisions; left += 1) {
    let pick: number[] | null = null;
    for (const head of heads) {
      const rest = head <= left ? best[left - head] : null;
      if (rest && (pick === null || rest.length + 1 < pick.length)) pick = [head, ...rest];
    }
    best.push(pick);
  }
  return best[divisions] ?? null;
}

/**
 * `length` as a list of lengths that are rhythms, to be tied together.
 *
 * Cut at the next beat first and only then shortened onto the grid, because a
 * note tied across a beat reads and a 6:5 tuplet does not. The last resort — a
 * length the grid cannot express at all — is handed back whole rather than
 * silently altered, so the written-file check reports it instead of this
 * function hiding it.
 */
export function notatablePieces(
  startInBar: Frac,
  length: Frac,
  unit: Frac,
  beat: Frac,
): Frac[] {
  const pieces: Frac[] = [];
  let at = startInBar;
  let left = length;
  while (gt(left, ZERO)) {
    let take = left;
    if (!isNotatable(take)) {
      const room = sub(mul(frac(floorDiv(at, beat) + 1), beat), at);
      if (gt(room, ZERO) && lt(room, take)) take = room;
    }
    if (!isNotatable(take)) {
      const steps = trunc(div(take, unit));
      let found: Frac | null = null;
      for (let k = steps; k > 0; k -= 1) {
        const candidate = mul(unit, frac(k));
        if (isNotatable(candidate)) {
          found = candidate;
          break;
        }
      }
      if (found !== null) take = found;
    }
    if (!isNotatable(take)) {
      const divisions = mul(take, frac(DIVISIONS));
      const heads = divisions.d === 1n && Number(divisions.n) <= 64 * DIVISIONS ? fewestHeads(Number(divisions.n)) : null;
      if (heads) {
        for (const head of heads) pieces.push(frac(head, DIVISIONS));
        at = add(at, take);
        left = sub(left, take);
        continue;
      }
      pieces.push(take);
      break;
    }
    pieces.push(take);
    at = add(at, take);
    left = sub(left, take);
  }
  return pieces;
}

/** Guard for the one case `notatablePieces` cannot express: it hands the length back whole. */
export const allPiecesAreRhythms = (pieces: Frac[]): boolean => pieces.every(isNotatable);
