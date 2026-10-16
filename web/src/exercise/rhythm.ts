// Rhythm sets (owner, 2026-10-16: "its own drill set … you just tap … depending on the level"): Drills cards of rhythm
// alone, tapped on one pad (any MIDI key counts too), drawn on a one-line rhythm staff. A set's cards are generated from
// the note values taught so far:
//   "generate": { "values": ["quarter", "half"], "meter": "4/4", "bars": 2, "feature": "half" }
// Every card is `bars` bars of `meter`; every bar adds up exactly; no value is longer than what is left of its bar; an
// eighth pair (two eighths beamed, one beat) only on a beat; a card starts with a note, not a rest; `feature` (the value
// just taught) is in every card. The set's cards are a pool of different patterns, dealt as Drills deals items (never
// the same card twice running), so "the misses again" gives those very patterns again.
// Kept apart from the screen (no DOM) so the checks run it in Node (tests/exercise.mjs, tests/content.mjs).

import type { Item } from './items.ts';

export const RHYTHM_VALUES = ['whole', 'half', 'quarter', 'eighths', 'dotted-half', 'quarter-rest', 'half-rest', 'whole-rest'] as const;
export type RhythmValue = (typeof RHYTHM_VALUES)[number];
/** Each value's length in quarter notes (eighths: the beamed pair, one beat). */
export const VALUE_BEATS: Record<RhythmValue, number> = { whole: 4, half: 2, quarter: 1, eighths: 1, 'dotted-half': 3, 'quarter-rest': 1, 'half-rest': 2, 'whole-rest': 4 };
export const isRest = (v: RhythmValue): boolean => v.endsWith('-rest');
export const METERS = { '4/4': { beats: 4, beatType: 4 }, '3/4': { beats: 3, beatType: 4 }, '2/4': { beats: 2, beatType: 4 } } as const;
export type Meter = keyof typeof METERS;

/** The pitch a rhythm card sounds on (the app plays it; it is never drawn: the staff has one line and no pitch). */
export const RHYTHM_PITCH = 'C5';
export const RHYTHM_MIDI = 72;
/** How many different patterns a generated set holds (fewer when the values allow fewer: quarters alone, one). */
export const POOL_SIZE = 24;

export interface RhythmSpec { values: RhythmValue[]; meter: Meter; bars: number; feature?: RhythmValue }

/** The lengths a bar's remainder can be filled with exactly (0 always), from these values. */
function fillable(values: RhythmValue[], beats: number): boolean[] {
  const can = [true];
  for (let n = 1; n <= beats; n++) can[n] = values.some((v) => VALUE_BEATS[v] <= n && can[n - VALUE_BEATS[v]]);
  return can;
}

/** A set's `generate`, checked: anything else is refused with the reason (docs/app-features.md §6). */
export function readRhythmSpec(v: unknown): RhythmSpec {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error('generate should be an object, like { "values": ["quarter", "half"], "meter": "4/4", "bars": 2 }');
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o)) if (!['values', 'meter', 'bars', 'feature'].includes(k)) throw new Error(`generate has "${k}", which is not one of values, meter, bars, feature`);
  if (!Array.isArray(o.values) || !o.values.length) throw new Error('generate.values should be a list of note values, like ["quarter", "half"]');
  for (const x of o.values) if (!(RHYTHM_VALUES as readonly unknown[]).includes(x)) throw new Error(`generate.values: ${JSON.stringify(x)} is not one of ${RHYTHM_VALUES.join(', ')}`);
  const values = o.values as RhythmValue[];
  const twice = values.find((x, i) => values.indexOf(x) !== i);
  if (twice) throw new Error(`generate.values lists "${twice}" twice`);
  if (!(typeof o.meter === 'string' && o.meter in METERS)) throw new Error(`generate.meter ${JSON.stringify(o.meter)} should be one of ${Object.keys(METERS).join(', ')}`);
  const meter = o.meter as Meter, beats = METERS[meter].beats;
  if (!(Number.isInteger(o.bars) && (o.bars as number) >= 1 && (o.bars as number) <= 4)) throw new Error(`generate.bars ${JSON.stringify(o.bars)} should be a whole number 1 to 4`);
  const bars = o.bars as number;
  const long = values.find((x) => VALUE_BEATS[x] > beats);
  if (long) throw new Error(`generate.values: ${long} (${VALUE_BEATS[long]} beats) does not fit a bar of ${meter}`);
  if (!values.some((x) => !isRest(x))) throw new Error('generate.values has only rests: a card needs notes to tap');
  const can = fillable(values, beats);
  // A card starts with a note: some note must start a bar and leave a remainder the values can fill.
  if (!values.some((x) => !isRest(x) && can[beats - VALUE_BEATS[x]])) throw new Error(`generate.values cannot fill a bar of ${meter} starting with a note`);
  if (o.feature !== undefined) {
    if (!values.includes(o.feature as RhythmValue)) throw new Error(`generate.feature ${JSON.stringify(o.feature)} should be one of its values (${values.join(', ')})`);
    const f = o.feature as RhythmValue;
    if (!placeable(values, beats, bars, f)) throw new Error(`generate.feature ${f} cannot be placed in ${bars} ${bars === 1 ? 'bar' : 'bars'} of ${meter} with these values (a card starts with a note)`);
  }
  return { values, meter, bars, ...(o.feature !== undefined ? { feature: o.feature as RhythmValue } : {}) };
}

/** Whether some card can hold `f`: in a bar after the first anywhere a whole pattern allows, in the first after a note. */
function placeable(values: RhythmValue[], beats: number, bars: number, f: RhythmValue): boolean {
  const can = fillable(values, beats), len = VALUE_BEATS[f];
  // Where in a bar a value can start: the sums of values before it (in the first bar the first of them a note).
  const starts = (first: boolean): Set<number> => {
    const out = new Set<number>(first ? [] : [0]);
    if (first) for (const v of values) if (!isRest(v) && VALUE_BEATS[v] <= beats) out.add(VALUE_BEATS[v]);
    for (let grew = true; grew;) {
      grew = false;
      for (const p of [...out]) for (const v of values) { const q = p + VALUE_BEATS[v]; if (q <= beats && !out.has(q)) { out.add(q); grew = true; } }
    }
    return out;
  };
  const fits = (p: number) => p + len <= beats && can[beats - p - len];
  if (!isRest(f) && fits(0)) return true; // (a note may start the card)
  if ([...starts(true)].some(fits)) return true;
  return bars > 1 && [...starts(false)].some(fits);
}

/** One random card: its bars, each a list of values that adds up to the bar, the first a note. */
export function randomCard(spec: RhythmSpec, rng: () => number = Math.random): RhythmValue[][] {
  const beats = METERS[spec.meter].beats, can = fillable(spec.values, beats);
  for (let tries = 0; tries < 1000; tries++) {
    const card: RhythmValue[][] = [];
    for (let b = 0; b < spec.bars; b++) {
      const bar: RhythmValue[] = [];
      let left = beats;
      while (left > 0) {
        const first = b === 0 && !bar.length;
        const options = spec.values.filter((v) => VALUE_BEATS[v] <= left && can[left - VALUE_BEATS[v]] && !(first && isRest(v)));
        const v = options[Math.floor(rng() * options.length)];
        bar.push(v);
        left -= VALUE_BEATS[v];
      }
      card.push(bar);
    }
    if (!spec.feature || card.some((bar) => bar.includes(spec.feature!))) return card;
  }
  throw new Error(`no card with ${spec.feature} came in 1000 tries`); // (readRhythmSpec refuses a feature that cannot be placed)
}

/** A card written short, for the practice log and the checks: "quarter half quarter | whole". */
export const cardCode = (card: RhythmValue[][]): string => card.map((bar) => bar.join(' ')).join(' | ');

/** A card as an item Drills plays: one group per note (a rest an empty group), its length, its bar, the metre. */
export function cardItem(n: number, card: RhythmValue[][], meter: Meter): Item {
  const groups: string[][] = [], beats: number[] = [], bars: number[] = [];
  card.forEach((bar, b) => {
    for (const v of bar) {
      if (v === 'eighths') { for (let k = 0; k < 2; k++) { groups.push([RHYTHM_PITCH]); beats.push(0.5); bars.push(b); } continue; }
      groups.push(isRest(v) ? [] : [RHYTHM_PITCH]);
      beats.push(VALUE_BEATS[v]);
      bars.push(b);
    }
  });
  return { n, name: cardCode(card), short: String(n), groups, beats, bars, meter: { ...METERS[meter] } };
}

/** The set's cards: up to POOL_SIZE different patterns (every one the values allow, when fewer). */
export function rhythmPool(spec: RhythmSpec, rng: () => number = Math.random, size = POOL_SIZE): Item[] {
  const seen = new Map<string, RhythmValue[][]>();
  for (let tries = 0; tries < size * 60 && seen.size < size; tries++) {
    const card = randomCard(spec, rng);
    seen.set(cardCode(card), card);
  }
  return [...seen.values()].map((card, i) => cardItem(i + 1, card, spec.meter));
}
