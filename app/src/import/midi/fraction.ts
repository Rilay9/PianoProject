/**
 * Exact rational arithmetic, because the converter's times are Fractions.
 *
 * `tools/midi-cleanup/midi_to_musicxml.py` says why in its `Event` docstring,
 * and the reason is the same here: a grid of thirds and a grid of quarters do
 * not both fit in a float, and the rounding showed up as bars that were a 64th
 * short. Every time in this port — onsets, releases, bar lengths, grid units —
 * is a `Frac`.
 *
 * **`bigint`, not `number`, and that is not caution.** The hand split's running
 * centre is `centre * 3/5 + mean * 2/5` applied once per onset, so its
 * denominator gains a factor of five a note: by the fortieth note of a piece it
 * is past what a double counts exactly, and the Scarlatti recording is 882
 * notes. Python's `Fraction` is arbitrary precision and the split's answers
 * come out of comparing those values, so a port on doubles would agree with it
 * for a bar and then quietly stop. The cost is that `toNumber` is meaningless
 * for such a value — it is for reports and for nothing that decides anything.
 */

/** Python's `TIME_DENOMINATOR`: the bound on a denominator built from a float. */
export const TIME_DENOMINATOR = 3840;

export interface Frac {
  readonly n: bigint;
  readonly d: bigint;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

export function frac(n: number | bigint, d: number | bigint = 1): Frac {
  let num = BigInt(n);
  let den = BigInt(d);
  if (den === 0n) throw new RangeError('a fraction cannot have a zero denominator');
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den) || 1n;
  return { n: num / g, d: den / g };
}

export const ZERO: Frac = { n: 0n, d: 1n };
export const ONE: Frac = { n: 1n, d: 1n };

export const add = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d);
export const div = (a: Frac, b: Frac): Frac => frac(a.n * b.d, a.d * b.n);
export const neg = (a: Frac): Frac => ({ n: -a.n, d: a.d });
export const abs = (a: Frac): Frac => ({ n: a.n < 0n ? -a.n : a.n, d: a.d });

/** -1, 0 or 1. Cross-multiplied, so nothing is compared as a float. */
export function cmp(a: Frac, b: Frac): number {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
}

export const eq = (a: Frac, b: Frac): boolean => cmp(a, b) === 0;
export const lt = (a: Frac, b: Frac): boolean => cmp(a, b) < 0;
export const lte = (a: Frac, b: Frac): boolean => cmp(a, b) <= 0;
export const gt = (a: Frac, b: Frac): boolean => cmp(a, b) > 0;
export const gte = (a: Frac, b: Frac): boolean => cmp(a, b) >= 0;
export const isZero = (a: Frac): boolean => a.n === 0n;

/** The floor of `a / b`, as a `bigint`; `bigint` division truncates. */
function floorBig(a: bigint, b: bigint): bigint {
  const q = a / b;
  return (a % b !== 0n && (a < 0n) !== (b < 0n)) ? q - 1n : q;
}

/** Python's `a // b` on Fractions: the floor, as an integer. */
export function floorDiv(a: Frac, b: Frac): number {
  return Number(floorBig(a.n * b.d, a.d * b.n));
}

/** Python's `a % b` on Fractions: never negative for a positive `b`. */
export function mod(a: Frac, b: Frac): Frac {
  return sub(a, mul(b, frac(floorDiv(a, b))));
}

/** Python's `int(x)`: truncation towards zero, not the floor. */
export function trunc(a: Frac): number {
  return Number(a.n / a.d);
}

export const toNumber = (a: Frac): number => Number(a.n) / Number(a.d);

/** `3/4`, or `2` for a whole number — the shape Python's `str(Fraction)` gives. */
export function fracToString(a: Frac): string {
  return a.d === 1n ? String(a.n) : `${String(a.n)}/${String(a.d)}`;
}

export function fracFromString(text: string): Frac {
  const [n, d] = text.split('/');
  return frac(BigInt(n ?? '0'), d === undefined ? 1n : BigInt(d));
}

/**
 * Python's `Fraction(value).limit_denominator(limit)` — the closest rational
 * whose denominator is at most `limit`, by the continued-fraction expansion.
 *
 * Used where the Python uses `as_fraction`: on a length that arrived as a
 * float. Onsets read from a MIDI file do not go through it — ticks and
 * ticks-per-quarter are both integers, so that division is exact.
 */
export function limitDenominator(value: number, limit = TIME_DENOMINATOR): Frac {
  if (!Number.isFinite(value)) throw new RangeError('not a finite number');
  if (Number.isInteger(value)) return frac(value);
  // The float as an exact rational first, then squeezed. A double is a dyadic
  // rational, so doubling until it is whole loses nothing.
  let den = 1n;
  let v = value;
  while (!Number.isInteger(v) && den < 2n ** 60n) {
    v *= 2;
    den *= 2n;
  }
  const num = BigInt(Math.round(v));
  const cap = BigInt(limit);
  if (den <= cap) return frac(num, den);

  let p0 = 0n;
  let q0 = 1n;
  let p1 = 1n;
  let q1 = 0n;
  let a = num;
  let b = den;
  for (;;) {
    const whole = floorBig(a, b);
    const q2 = q0 + whole * q1;
    if (q2 > cap) break;
    [p0, q0, p1, q1] = [p1, q1, p0 + whole * p1, q2];
    const rest = a - whole * b;
    if (rest === 0n) break;
    a = b;
    b = rest;
  }
  const k = (cap - q0) / q1;
  const lower = frac(p0 + k * p1, q0 + k * q1);
  const upper = frac(p1, q1);
  const exact = frac(num, den);
  // The nearer of the two neighbours, the upper on a tie — which is what
  // `limit_denominator` does.
  return lte(abs(sub(upper, exact)), abs(sub(lower, exact))) ? upper : lower;
}

/** The converter's `as_fraction`. */
export const asFraction = (value: number): Frac => limitDenominator(value, TIME_DENOMINATOR);
