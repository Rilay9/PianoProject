// Single-note flash cards and interval cards (owner, 2026-10-18: "there need to be single note flash cards and interval
// drills somewhere. Extensive, so I can practice all I want on those"): sets whose cards the app makes from a staff and a
// range of white keys, read in Drills (a wrong key named at once: drill.ts, staff-words.ts).
//   notes:     "generate": { "clef": "bass", "from": "G2", "to": "A3" }                 one note a card
//   intervals: "generate": { "clef": "treble", "from": "C4", "to": "G5", "sizes": [2, 3], "together": false,
//                            "direction": "up" }                                       two notes a card
// Every white key from `from` to `to` (both included) on the staff named, middle C on either; intervals counted by letter
// (C up to E a 3rd), both notes inside the range, one after the other (up, down or both ways) or together. Each card is
// drawn on its own clef (Item.clef) and named by its notes ("F3"; "E up to G: a 3rd"). Kept apart from the screen (no
// DOM) so the checks run it in Node.

import type { Item } from './items.ts';
import { intervalName } from '../staff-words.ts';

const LETTERS = 'CDEFGAB';
const stepOf = (p: string) => LETTERS.indexOf(p[0]) + 7 * Number(p.slice(1));
const pitchOf = (step: number) => `${LETTERS[((step % 7) + 7) % 7]}${Math.floor(step / 7)}`;

export interface NoteSpec { clef: 'treble' | 'bass'; from: string; to: string }
export interface IntervalSpec extends NoteSpec { sizes: number[]; together: boolean; direction: 'up' | 'down' | 'both' }

/** A set's `generate` for single notes (intervals: false) or intervals, checked: anything else refused with the reason. */
export function readNoteSpec(v: unknown, intervals: false): NoteSpec;
export function readNoteSpec(v: unknown, intervals: true): IntervalSpec;
export function readNoteSpec(v: unknown, intervals: boolean): NoteSpec | IntervalSpec {
  const eg = intervals ? '{ "clef": "treble", "from": "C4", "to": "G5", "sizes": [2, 3] }' : '{ "clef": "bass", "from": "G2", "to": "A3" }';
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error(`generate should be an object, like ${eg}`);
  const o = v as Record<string, unknown>;
  const fields = intervals ? ['clef', 'from', 'to', 'sizes', 'together', 'direction'] : ['clef', 'from', 'to'];
  const odd = Object.keys(o).find((k) => !fields.includes(k));
  if (odd) throw new Error(`generate has "${odd}", which is not one of ${fields.join(', ')}`);
  if (o.clef !== 'treble' && o.clef !== 'bass') throw new Error(`generate.clef ${JSON.stringify(o.clef)} should be "treble" or "bass"`);
  for (const k of ['from', 'to'] as const) if (typeof o[k] !== 'string' || !/^[A-G][1-7]$/.test(o[k] as string)) throw new Error(`generate.${k} ${JSON.stringify(o[k])} should be a white key like "C4" (C1 to B7)`);
  if (stepOf(o.from as string) > stepOf(o.to as string)) throw new Error(`generate.from ${o.from} is above generate.to ${o.to}`);
  const base: NoteSpec = { clef: o.clef, from: o.from as string, to: o.to as string };
  if (!intervals) return base;
  const sizes = o.sizes ?? [2, 3, 4, 5];
  if (!Array.isArray(sizes) || !sizes.length || !sizes.every((n) => Number.isInteger(n) && n >= 2 && n <= 8)) throw new Error(`generate.sizes ${JSON.stringify(o.sizes)} should be interval numbers 2 (a 2nd) to 8 (an octave), like [2, 3]`);
  if (o.together !== undefined && typeof o.together !== 'boolean') throw new Error('generate.together should be true or false');
  if (o.direction !== undefined && !['up', 'down', 'both'].includes(o.direction as string)) throw new Error(`generate.direction ${JSON.stringify(o.direction)} should be "up", "down" or "both"`);
  const spec: IntervalSpec = { ...base, sizes: [...new Set(sizes as number[])].sort((a, b) => a - b), together: !!o.together, direction: (o.direction as IntervalSpec['direction']) ?? 'up' };
  if (!intervalPool(spec).length) throw new Error(`generate: no ${spec.sizes.map(intervalName).join(' or ')} fits between ${spec.from} and ${spec.to}`);
  return spec;
}

/** Every white key of the range, one card each, on the staff named. */
export function notePool(spec: NoteSpec): Item[] {
  const out: Item[] = [];
  for (let s = stepOf(spec.from); s <= stepOf(spec.to); s++) { const p = pitchOf(s); out.push({ n: out.length + 1, name: p, short: p[0], groups: [[p]], clef: spec.clef }); }
  return out;
}

/** Every interval of the sizes asked for inside the range: two notes one after the other (up, down or both), or together. */
export function intervalPool(spec: IntervalSpec): Item[] {
  const out: Item[] = [];
  const lo = stepOf(spec.from), hi = stepOf(spec.to);
  for (const size of spec.sizes) for (let s = lo; s + size - 1 <= hi; s++) {
    const a = pitchOf(s), b = pitchOf(s + size - 1), what = `a ${intervalName(size)}`;
    const add = (groups: string[][], name: string) => out.push({ n: out.length + 1, name, short: intervalName(size), groups, clef: spec.clef });
    if (spec.together) { add([[a, b]], `${a[0]} and ${b[0]} together: ${what}`); continue; }
    if (spec.direction !== 'down') add([[a], [b]], `${a[0]} up to ${b[0]}: ${what}`);
    if (spec.direction !== 'up') add([[b], [a]], `${b[0]} down to ${a[0]}: ${what}`);
  }
  return out;
}
