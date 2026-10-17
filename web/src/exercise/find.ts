// "Find it" sets (owner, 2026-10-16, after the beginner walk-through: a judged step for finding the black-key groups):
// Drills cards that name a place on the keys in words ("a group of three, higher up"); any key of that group counts;
// untimed; words, never note names. A set gives the keys shown and what to ask for, and its cards are made from them:
//   "find": { "keys": "C3-B4", "groups": ["two", "three"], "places": ["lower", "higher"] }
// The groups of each kind on those keys are ordered low to high: "lower" is the lowest, "higher" the highest, "middle"
// the one between (an odd number, three or more), "any" any of them. Every group asked for, at every place asked for,
// is one card (a pool, dealt as Drills deals any pool). A set may name white keys by letter as well, or instead
// (2026-10-17, for the C-D-E lesson: "a D, higher up", any D in that part of the keyboard):
//   "find": { "keys": "C3-B5", "letters": ["C", "D", "E"], "places": ["lower", "middle", "higher"] }
// the keys of each letter on the keys ordered low to high, the places as for the groups. Kept apart from the screen (no
// DOM) so the checks run it in Node.

import type { Item } from './items.ts';

export const FIND_GROUPS = ['two', 'three'] as const;
export const FIND_PLACES = ['any', 'lower', 'middle', 'higher'] as const;
export type FindGroup = (typeof FIND_GROUPS)[number];
export type FindPlace = (typeof FIND_PLACES)[number];
export const FIND_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type FindLetter = (typeof FIND_LETTERS)[number];
export interface FindSpec { lo: number; hi: number; groups: FindGroup[]; letters: FindLetter[]; places: FindPlace[] }

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
const SPELL = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
/** A key spelled for the item (never shown: find cards are words only). */
const spelled = (m: number) => `${SPELL[m % 12]}${Math.floor(m / 12) - 1}`;
function key(s: string): number | null {
  const m = /^([A-G])(#|b)?(\d)$/.exec(s);
  return m ? (Number(m[3]) + 1) * 12 + LETTER[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null;
}

/** The groups of black keys on lo..hi, low to high: two (C♯ D♯) and three (F♯ G♯ A♯), each wholly on the keys. */
export function groupsOn(lo: number, hi: number): { kind: FindGroup; keys: number[] }[] {
  const out: { kind: FindGroup; keys: number[] }[] = [];
  for (let c = lo - (((lo % 12) + 12) % 12); c <= hi; c += 12) {
    for (const [kind, ks] of [['two', [1, 3]], ['three', [6, 8, 10]]] as const) {
      const keys = ks.map((k) => c + k);
      if (keys.every((k) => k >= lo && k <= hi)) out.push({ kind, keys });
    }
  }
  return out;
}

/** A set's `find`, checked: anything else is refused with the reason (docs/app-features.md §6). */
export function readFindSpec(v: unknown): FindSpec {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error('find should be an object, like { "keys": "C3-B4", "groups": ["two", "three"], "places": ["lower", "higher"] }');
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o)) if (!['keys', 'groups', 'letters', 'places'].includes(k)) throw new Error(`find has "${k}", which is not one of keys, groups, letters, places`);
  const parts = typeof o.keys === 'string' ? o.keys.split('-') : [];
  const [lo, hi] = parts.length === 2 ? parts.map(key) : [null, null];
  if (lo === null || hi === null) throw new Error(`find.keys is ${JSON.stringify(o.keys)}; it should be a range of keys like "C3-B4"`);
  if (lo < 21 || hi > 108 || hi <= lo || isBlack(lo) || isBlack(hi)) throw new Error(`find.keys "${o.keys}" should go from a lower to a higher white key on the piano (A0 to C8)`);
  const list = <T extends string>(x: unknown, all: readonly T[], what: string): T[] => {
    if (!Array.isArray(x) || !x.length) throw new Error(`find.${what} should be a list, from ${all.join(', ')}`);
    for (const y of x) if (!all.includes(y as T)) throw new Error(`find.${what}: ${JSON.stringify(y)} is not one of ${all.join(', ')}`);
    const twice = x.find((y, i) => x.indexOf(y) !== i);
    if (twice) throw new Error(`find.${what} lists "${twice}" twice`);
    return x as T[];
  };
  if (o.groups === undefined && o.letters === undefined) throw new Error('find needs "groups" (two, three), "letters" (C to B), or both');
  const groups = o.groups === undefined ? [] : list(o.groups, FIND_GROUPS, 'groups'), letters = o.letters === undefined ? [] : list(o.letters, FIND_LETTERS, 'letters');
  const places = list(o.places, FIND_PLACES, 'places');
  for (const l of letters) {
    const n = lettersOn(lo, hi, l).length;
    if (!n) throw new Error(`find.keys "${o.keys}" hold no ${l}`);
    if ((places.includes('lower') || places.includes('higher')) && n < 2) throw new Error(`"lower" and "higher" need two ${l}s or more on the keys; "${o.keys}" hold ${n}`);
    if (places.includes('middle') && (n < 3 || n % 2 === 0)) throw new Error(`"middle" needs an odd number of ${l}s, three or more, on the keys; "${o.keys}" hold ${n}`);
  }
  const on = groupsOn(lo, hi);
  for (const g of groups) {
    const n = on.filter((x) => x.kind === g).length;
    if (!n) throw new Error(`find.keys "${o.keys}" hold no whole group of ${g}`);
    if ((places.includes('lower') || places.includes('higher')) && n < 2) throw new Error(`"lower" and "higher" need two groups of ${g} or more on the keys; "${o.keys}" hold ${n}`);
    if (places.includes('middle') && (n < 3 || n % 2 === 0)) throw new Error(`"middle" needs an odd number of groups of ${g}, three or more, on the keys; "${o.keys}" hold ${n}`);
  }
  return { lo, hi, groups, letters, places };
}

const LETTER_PC: Record<FindLetter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** The keys of one letter on lo..hi, low to high. */
export function lettersOn(lo: number, hi: number, l: FindLetter): number[] {
  const out: number[] = [];
  for (let m = lo; m <= hi; m++) if (((m % 12) + 12) % 12 === LETTER_PC[l]) out.push(m);
  return out;
}

const GROUP_WORDS: Record<FindGroup, string> = { two: 'a group of two', three: 'a group of three' };
const PLACE_WORDS: Record<FindPlace, string> = { any: '', lower: 'lower down', middle: 'in the middle', higher: 'higher up' };
/** The card's words: "a group of three, higher up". */
export const findWords = (g: FindGroup | FindLetter, p: FindPlace): string => [g in GROUP_WORDS ? GROUP_WORDS[g as FindGroup] : `${g === 'A' || g === 'E' || g === 'F' ? 'an' : 'a'} ${g}`, PLACE_WORDS[p]].filter(Boolean).join(', ');

/**
 * What the place means, counted over all the set's keys (2026-10-17: when only some of them show at a time, with ‹ ›,
 * "lower down" is still the lowest of all, not of those on screen): "the lowest D", "the middle one of the groups of
 * three", "any group of two". Drills says it under the card while the keys can move: "Lower down: the lowest D you can
 * reach with ‹ ›".
 */
export function whereWords(g: FindGroup | FindLetter, p: FindPlace): string {
  const group = g in GROUP_WORDS, one = group ? `group of ${g}` : g, many = group ? `groups of ${g}` : `${g}s`;
  return p === 'lower' ? `the lowest ${one}` : p === 'higher' ? `the highest ${one}` : p === 'middle' ? `the middle one of the ${many}` : `any ${one}`;
}

/**
 * The set's cards: one for each group at each place. Each item's groups are the groups that count (any key of any of
 * them), its `find` the keys that count; its name the words.
 */
export function findPool(spec: FindSpec): Item[] {
  const on = groupsOn(spec.lo, spec.hi), out: Item[] = [];
  for (const g of spec.groups) {
    const mine = on.filter((x) => x.kind === g);
    for (const p of spec.places) {
      const chosen = p === 'any' ? mine : p === 'lower' ? [mine[0]] : p === 'higher' ? [mine[mine.length - 1]] : [mine[(mine.length - 1) / 2]];
      const words = findWords(g, p);
      out.push({ n: out.length + 1, name: words, short: String(out.length + 1), groups: chosen.map((x) => x.keys.map(spelled)), find: { words, keys: chosen.flatMap((x) => x.keys), where: whereWords(g, p) } });
    }
  }
  // Letters: any key of that letter in that part of the keyboard ("a D, higher up").
  for (const l of spec.letters ?? []) {
    const mine = lettersOn(spec.lo, spec.hi, l);
    for (const p of spec.places) {
      const chosen = p === 'any' ? mine : p === 'lower' ? [mine[0]] : p === 'higher' ? [mine[mine.length - 1]] : [mine[(mine.length - 1) / 2]];
      const words = findWords(l, p);
      out.push({ n: out.length + 1, name: words, short: String(out.length + 1), groups: chosen.map((k) => [spelled(k)]), find: { words, keys: chosen, where: whereWords(l, p) } });
    }
  }
  return out;
}
