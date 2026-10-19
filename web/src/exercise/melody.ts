// Made-up reading tunes (owner, 2026-10-18: the week's lesson, "generate way more than needed"; design/2026-10-18-week1):
// a set of melodies whose cards the app writes itself, in one hand position, so the learner reads every card fresh
// instead of remembering it.
//   "generate": { "position": "G2", "values": ["quarter", "half"], "meter": "4/4", "bars": 2, "skips": 0.3 }
// position: the lowest key of a five-finger position (C3 or G2 for the left hand, C4 or G4 for the right: any white key
// from C2 to C5 whose five-note major position needs no black key: C, F, G), its five notes the major scale's first five.
// Each card is `bars` bars of `meter` from the rhythm generator (rhythm.ts: every bar exact, eighths in beamed pairs on
// a beat, a card starting with a note); its notes move mostly by step, a share `skips` (0 to 1) by a third, now and then
// a repeated note, never outside the five; the last note is the position's home key (its lowest). A set holds up to
// MELODY_POOL different cards (dealt as Drills deals a pool: every card once before any comes again).
// Kept apart from the screen (no DOM) so the checks run it in Node.

import { Note } from 'tonal';
import type { Item } from './items.ts';
import { randomCard, readRhythmSpec, METERS, isRest, VALUE_BEATS, type Meter, type RhythmSpec, type RhythmValue } from './rhythm.ts';

export const MELODY_POOL = 200;
const STEPS = [0, 2, 4, 5, 7]; // a major five-finger position: 1 2 3 4 5

export interface MelodySpec { position: string; rhythm: RhythmSpec; skips: number }

/** A set's melody `generate`, checked: anything else is refused with the reason. */
export function readMelodySpec(v: unknown): MelodySpec {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error('generate should be an object, like { "position": "C4", "values": ["quarter", "half"], "meter": "4/4", "bars": 2 }');
  const o = { ...(v as Record<string, unknown>) };
  const odd = Object.keys(o).find((k) => !['position', 'values', 'meter', 'bars', 'skips', 'feature'].includes(k));
  if (odd) throw new Error(`generate has "${odd}", which is not one of position, values, meter, bars, skips, feature`);
  const pos = o.position;
  if (typeof pos !== 'string' || !/^[A-G][2-5]$/.test(pos)) throw new Error(`generate.position ${JSON.stringify(pos)} should be a white key like "C4" or "G2" (the position's lowest key)`);
  const home = Note.midi(pos)!;
  if (STEPS.some((s) => /[#b]/.test(Note.fromMidi(home + s)))) throw new Error(`generate.position ${pos}: its five notes need a black key (C and G positions have none)`);
  if (home < 36 || home > 72) throw new Error(`generate.position ${pos} is outside C2 to C5`);
  const skips = o.skips ?? 0.3;
  if (!(typeof skips === 'number' && skips >= 0 && skips <= 1)) throw new Error(`generate.skips ${JSON.stringify(o.skips)} should be a share from 0 to 1`);
  delete o.position; delete o.skips;
  return { position: pos, rhythm: readRhythmSpec(o), skips };
}

/** The position's five keys, lowest first. */
export function positionKeys(position: string): number[] { const home = Note.midi(position)!; return STEPS.map((s) => home + s); }

/** One card's pitches for `count` notes: ends on the home key, moves by step (or a third, or repeats), stays in the five. */
export function walk(count: number, skips: number, rng: () => number = Math.random): number[] {
  // Built backwards from the home key (index 0), then reversed: the card ends at home and starts anywhere.
  const out = [0];
  while (out.length < count) {
    const at = out[out.length - 1];
    const r = rng();
    const size = r < 0.08 ? 0 : r < 0.08 + skips * 0.92 ? 2 : 1; // repeat now and then, a third at the given share, else a step
    const moves = size === 0 ? [0] : [size, -size].filter((d) => at + d >= 0 && at + d <= 4);
    out.push(at + moves[Math.floor(rng() * moves.length)]);
  }
  return out.reverse();
}

/** A card as an item: one group per note (a rest an empty group), its length, its bar, the metre; named by its letters. */
export function melodyItem(n: number, card: RhythmValue[][], meter: Meter, position: string, skips: number, rng: () => number = Math.random): Item {
  const lengths: { beats: number; bar: number; rest: boolean }[] = [];
  card.forEach((bar, b) => {
    for (const v of bar) {
      if (v === 'eighths') { lengths.push({ beats: 0.5, bar: b, rest: false }, { beats: 0.5, bar: b, rest: false }); continue; }
      lengths.push({ beats: VALUE_BEATS[v], bar: b, rest: isRest(v) });
    }
  });
  const keys = positionKeys(position);
  const path = walk(lengths.filter((l) => !l.rest).length, skips, rng);
  let k = 0;
  const groups = lengths.map((l) => (l.rest ? [] : [Note.fromMidi(keys[path[k++]])]));
  const name = groups.filter((g) => g.length).map((g) => g[0].replace(/\d+$/, '')).join(' ');
  return { n, name, short: String(n), groups, beats: lengths.map((l) => l.beats), bars: lengths.map((l) => l.bar), meter: { ...METERS[meter] } };
}

/** The set's cards: up to MELODY_POOL different ones (by notes and rhythm). */
export function melodyPool(spec: MelodySpec, rng: () => number = Math.random, size = MELODY_POOL): Item[] {
  const seen = new Map<string, Item>();
  for (let tries = 0; tries < size * 20 && seen.size < size; tries++) {
    const it = melodyItem(seen.size + 1, randomCard(spec.rhythm, rng), spec.rhythm.meter, spec.position, spec.skips, rng);
    const code = it.groups.map((g, i) => `${g.join('') || 'r'}${it.beats![i]}`).join(' ');
    if (!seen.has(code)) seen.set(code, it);
  }
  return [...seen.values()].map((it, i) => ({ ...it, n: i + 1 }));
}
