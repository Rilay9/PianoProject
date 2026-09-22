// The twelve drill kinds from docs/05 §7.
//
// Nine share `PromptDrill` and differ only in the prompts they generate; the
// three that measure something other than pitch (pedal, dynamics,
// backing-track) are in their own files. Everything is seeded, so a drill can
// be repeated exactly.

import { makeRng } from '../sightReading';
import { systemClock, type Clock } from '../types';
import { PromptDrill, resolveBase } from './PromptDrill';
import {
  noteLabel,
  pitchClass,
  type Drill,
  type DrillOptionsBase,
  type DrillPrompt,
} from './types';

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))] as T;
}

function range(low: number, high: number): number[] {
  return Array.from({ length: Math.max(0, high - low + 1) }, (_, i) => low + i);
}

export interface NoteRangeOptions extends DrillOptionsBase {
  /** Inclusive MIDI range the prompts are drawn from. */
  low?: number;
  high?: number;
  clock?: Clock;
}

/** Shows one note on a staff and waits for the key (docs/05 §7). */
export function noteFlashDrill(options: NoteRangeOptions = {}): Drill {
  const { count } = resolveBase(options);
  const rng = makeRng(options.seed ?? 1);
  const low = options.low ?? 60;
  const high = options.high ?? 72;
  const pool = range(low, high);
  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const midi = pick(rng, pool);
    return {
      index,
      label: noteLabel(midi),
      expected: [midi],
      staff: midi < 60 ? 2 : 1,
    };
  });
  // Reading a note means finding *that* key, so unlike the chord and ear
  // drills the octave matters and `anyOctave` defaults off.
  return new PromptDrill({
    kind: 'note-flash',
    prompts,
    anyOctave: options.anyOctave ?? false,
    clock: options.clock ?? systemClock,
  });
}

/** Shows a key name and waits for it; the octave is the learner's choice. */
export function findKeyDrill(options: NoteRangeOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 2);
  const pool = range(options.low ?? 60, options.high ?? 71);
  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const midi = pick(rng, pool);
    return { index, label: noteLabel(midi).replace(/-?\d+$/, ''), expected: [midi] };
  });
  return new PromptDrill({
    kind: 'find-key',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

/** Triad qualities as semitone offsets from the root. */
const QUALITIES = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  dom7: [0, 4, 7, 10],
} as const;

type Quality = keyof typeof QUALITIES;

const QUALITY_LABEL: Record<Quality, string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  dom7: '7',
};

const ROOT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

function chordPitches(root: number, quality: Quality, inversion: number): number[] {
  const base = QUALITIES[quality].map((offset) => root + offset);
  const rotated = [...base];
  for (let i = 0; i < inversion % base.length; i += 1) {
    const lowest = rotated.shift();
    if (lowest !== undefined) rotated.push(lowest + 12);
  }
  return rotated;
}

export interface ChordDrillOptions extends DrillOptionsBase {
  qualities?: Quality[];
  clock?: Clock;
}

/** Shows a chord symbol and waits for the exact pitch set. */
export function chordDrill(options: ChordDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 3);
  const qualities = options.qualities ?? (['maj', 'min', 'dim', 'dom7'] as Quality[]);
  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const root = 60 + Math.floor(rng() * 12);
    const quality = pick(rng, qualities);
    return {
      index,
      label: `${ROOT_NAMES[pitchClass(root)] ?? 'C'}${QUALITY_LABEL[quality]}`,
      expected: chordPitches(root, quality, 0),
    };
  });
  return new PromptDrill({ kind: 'chord', prompts, anyOctave, clock: options.clock ?? systemClock });
}

/**
 * Shows a slash chord and waits for it.
 *
 * The bass note is what makes an inversion an inversion, so `anyOctave`
 * defaults on for the *shape* while the label names the required bass.
 */
export function inversionDrill(options: ChordDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 4);
  const qualities = options.qualities ?? (['maj', 'min'] as Quality[]);
  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const root = 60 + Math.floor(rng() * 12);
    const quality = pick(rng, qualities);
    const inversion = 1 + Math.floor(rng() * (QUALITIES[quality].length - 1));
    const pitches = chordPitches(root, quality, inversion);
    const bass = pitches[0] ?? root;
    return {
      index,
      label: `${ROOT_NAMES[pitchClass(root)] ?? 'C'}${QUALITY_LABEL[quality]}/${ROOT_NAMES[pitchClass(bass)] ?? 'C'}`,
      expected: pitches,
    };
  });
  return new PromptDrill({
    kind: 'inversion',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

const INTERVAL_NAMES = [
  'unison',
  'minor 2nd',
  'major 2nd',
  'minor 3rd',
  'major 3rd',
  'perfect 4th',
  'tritone',
  'perfect 5th',
  'minor 6th',
  'major 6th',
  'minor 7th',
  'major 7th',
  'octave',
] as const;

export interface EarDrillOptions extends DrillOptionsBase {
  /** Semitone sizes to draw from. */
  intervals?: number[];
  clock?: Clock;
}

/** Plays two notes in order and waits for them back, in order. */
export function earIntervalDrill(options: EarDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 5);
  const intervals = options.intervals ?? [2, 3, 4, 5, 7, 12];
  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const root = 60 + Math.floor(rng() * 7);
    const size = pick(rng, intervals);
    const pitches = [root, root + size];
    return {
      index,
      label: INTERVAL_NAMES[size] ?? `${size} semitones`,
      expected: pitches,
      ordered: true,
      playback: pitches.map((midi, i) => ({ midi: [midi], atMs: i * 600 })),
    };
  });
  return new PromptDrill({
    kind: 'ear-interval',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

/** Plays a chord and waits for the set back. */
export function earChordDrill(options: ChordDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 6);
  const qualities = options.qualities ?? (['maj', 'min'] as Quality[]);
  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const root = 60 + Math.floor(rng() * 12);
    const quality = pick(rng, qualities);
    const pitches = chordPitches(root, quality, 0);
    return {
      index,
      label: `${ROOT_NAMES[pitchClass(root)] ?? 'C'}${QUALITY_LABEL[quality]}`,
      expected: pitches,
      playback: [{ midi: pitches, atMs: 0 }],
    };
  });
  return new PromptDrill({
    kind: 'ear-chord',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

/** Scale degrees of the chords a progression is built from. */
const PROGRESSIONS: { label: string; degrees: number[] }[] = [
  { label: 'I–IV–V–I', degrees: [0, 5, 7, 0] },
  { label: 'I–V–vi–IV', degrees: [0, 7, 9, 5] },
  { label: 'ii–V–I', degrees: [2, 7, 0] },
  { label: 'I–vi–IV–V', degrees: [0, 9, 5, 7] },
];

/**
 * Plays a chord progression and waits for it back.
 *
 * Judged as one long ordered sequence: the learner plays each chord's notes in
 * turn, so the answer is every pitch of every chord, in order.
 */
export function earProgressionDrill(options: DrillOptionsBase & { clock?: Clock } = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 7);
  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const progression = pick(rng, PROGRESSIONS);
    const tonic = 60;
    const chords = progression.degrees.map((degree, i) =>
      chordPitches(tonic + degree, i === 2 && progression.label.startsWith('I–V–vi') ? 'min' : 'maj', 0),
    );
    return {
      index,
      label: progression.label,
      expected: chords.flat(),
      ordered: true,
      playback: chords.map((midi, i) => ({ midi, atMs: i * 800 })),
    };
  });
  return new PromptDrill({
    kind: 'ear-progression',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

/**
 * Plays two bars and expects them back.
 *
 * Pitch and rhythm both matter, but only pitch is judged here; the rhythm side
 * is the `rhythm` drill's job, and combining them would make a wrong note look
 * like a timing problem.
 */
/**
 * The scales a phrase may be drawn from, as semitones above the key.
 *
 * `improv.4`'s drill says `scale: "pentatonic"` and got the chromatic run of
 * keys between C4 and G4, so a phrase to answer could contain any note at all
 * — which is the opposite of what a pentatonic call-and-response is for: the
 * whole point is that every note in the pool sounds like it belongs.
 *
 * Named for what the catalog writes. `pentatonic` unqualified is the major
 * one, because that is what the word means on its own in every lesson here.
 */
const PHRASE_SCALES: Record<string, readonly number[]> = {
  pentatonic: [0, 2, 4, 7, 9],
  'major-pentatonic': [0, 2, 4, 7, 9],
  'minor-pentatonic': [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export function phraseScale(name: string | undefined): readonly number[] | null {
  if (name === undefined) return null;
  return PHRASE_SCALES[name.trim().toLowerCase()] ?? null;
}

/** The notes of `scale` from `key`, inside an inclusive MIDI range. */
function scalePool(low: number, high: number, key: number, scale: readonly number[]): number[] {
  const out: number[] = [];
  for (let midi = low; midi <= high; midi += 1) {
    if (scale.includes(((midi - key) % 12 + 12) % 12)) out.push(midi);
  }
  return out;
}

export interface CallResponseOptions extends NoteRangeOptions {
  /**
   * How many bars the phrase is, at four notes to the bar.
   *
   * `theory.4` and `improv.4` both say `bars: 2` and both got four notes,
   * which their lessons had to be rewritten to describe as "a four-note
   * phrase". Four to the bar because the phrase is played as an even stream
   * of quarters and nothing here carries a rhythm; a bar is therefore a unit
   * of length, which is the only thing `bars` can honestly mean in a drill
   * with no metre.
   */
  bars?: number;
  /** The pool the phrase is drawn from — `PHRASE_SCALES` above. */
  scale?: string;
  /** Pitch class the scale is built from; C when the catalog does not say. */
  key?: number;
}

/** Four notes to a bar: the phrase is an even stream, so a bar is a length. */
export const NOTES_PER_BAR = 4;

export function callResponseDrill(options: CallResponseOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 8);
  const low = options.low ?? 60;
  const scale = phraseScale(options.scale);
  // A fifth is enough when every key in it is in the pool and too thin when
  // only five of twelve are: a pentatonic between C4 and G4 is four notes,
  // and a phrase drawn from four notes repeats itself. So a named scale gets
  // an octave to move in unless the catalog says otherwise.
  const high = options.high ?? (scale === null ? 67 : low + 12);
  // A scale narrows the pool; without one the drill draws from every key in
  // the range, which is what a dictation drill wants and what it always did.
  const scaled = scale === null ? [] : scalePool(low, high, options.key ?? 0, scale);
  // A scale with no note inside the range would leave nothing to pick from,
  // and a drill with an empty pool throws rather than saying so.
  const pool = scaled.length > 0 ? scaled : range(low, high);
  const notes = Math.max(1, Math.round((options.bars ?? 1) * NOTES_PER_BAR));
  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const phrase = Array.from({ length: notes }, () => pick(rng, pool));
    return {
      index,
      label: phrase.map(noteLabel).join(' '),
      // The label *is* the answer here, so the card keeps it back until the
      // phrase has been played (`04` §5c).
      labelIsAnswer: true,
      expected: phrase,
      ordered: true,
      playback: phrase.map((midi, i) => ({ midi: [midi], atMs: i * 500 })),
    };
  });
  return new PromptDrill({
    kind: 'call-response',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}
