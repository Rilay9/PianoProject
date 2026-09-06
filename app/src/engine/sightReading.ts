// Runtime sight-reading generator.
//
// docs/05-score-follow-engine.md §8. The whole point of sight-reading is that
// the material is *unseen*, so it is generated on the phone rather than
// shipped. Everything is deterministic from a seed: a failed sight-read can be
// retried on exactly the same music once, which is how you find out whether
// you actually learned it.
//
// The level table is the doc's, implemented for levels 1–4. Level 5+ wants a
// Markov model trained on a folk corpus at build time (P4/P5 territory), so
// asking for it here falls back to level 4 rather than pretending.

import {
  DIVISIONS,
  durationToType,
  writeMusicXml,
  type WriterMeasure,
  type WriterNote,
} from './musicXmlWriter';

export type SightReadingLevel = 1 | 2 | 3 | 4;

export interface SightReadingOptions {
  level: SightReadingLevel;
  /** Sharps positive, flats negative. Clamped to what the level allows. */
  fifths?: number;
  timeSig?: { beats: number; beatType: number };
  bars?: number;
  hands?: 'R' | 'L' | 'both';
  bpm?: number;
  /** Any 32-bit integer; the same seed always gives the same music. */
  seed?: number;
}

export interface SightReadingResult {
  musicXml: string;
  seed: number;
  level: SightReadingLevel;
  title: string;
  fifths: number;
  timeSig: { beats: number; beatType: number };
  bars: number;
  bpm: number;
  /**
   * The right hand's pitches in order, rests and tied continuations dropped.
   *
   * The transposition drill prints this music and expects it back in another
   * key, so it needs the model as numbers as well as as notation. Reading them
   * back out of the MusicXML would work and would be a second implementation of
   * the same fact, which is how an answer key drifts away from the page it
   * belongs to.
   */
  melody: number[];
}

/**
 * mulberry32 — small, fast, and good enough for choosing notes.
 *
 * Written out rather than pulled from a package because determinism across
 * versions matters more here than quality: a stored seed has to reproduce the
 * same exercise months later.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index] as T;
}

/** Major-scale semitone offsets; every level stays diatonic. */
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

/** Tonic pitch class for a number of sharps/flats, C major = 0. */
function tonicPitchClass(fifths: number): number {
  return (((fifths * 7) % 12) + 12) % 12;
}

/** Every scale degree of the key within `[low, high]`, ascending. */
function scalePitches(fifths: number, low: number, high: number): number[] {
  const tonic = tonicPitchClass(fifths);
  const out: number[] = [];
  for (let midi = low; midi <= high; midi += 1) {
    const degree = (((midi - tonic) % 12) + 12) % 12;
    if (MAJOR_STEPS.includes(degree)) out.push(midi);
  }
  return out;
}

interface LevelSpec {
  rhKey: { low: number; high: number };
  lhKey: { low: number; high: number };
  /** Note lengths in divisions, drawn uniformly. */
  rhythms: number[];
  /** Largest melodic leap in scale degrees. */
  maxLeap: number;
  hands: 'R' | 'both';
  maxFifths: number;
  allowTies: boolean;
  allowRests: boolean;
  /** Left hand: 'whole' = one note per bar, 'chord' = block triads. */
  leftHand: 'none' | 'whole' | 'chord';
}

const LEVELS: Record<SightReadingLevel, LevelSpec> = {
  // Steps only, C4–G4, half and whole notes: a first reading exercise.
  1: {
    rhKey: { low: 60, high: 67 },
    lhKey: { low: 48, high: 55 },
    rhythms: [DIVISIONS, DIVISIONS * 2, DIVISIONS * 4],
    maxLeap: 1,
    hands: 'R',
    maxFifths: 0,
    allowTies: false,
    allowRests: false,
    leftHand: 'none',
  },
  // Adds eighths, dotted halves and thirds, and the left hand alternates in.
  2: {
    rhKey: { low: 60, high: 72 },
    lhKey: { low: 48, high: 55 },
    rhythms: [DIVISIONS / 2, DIVISIONS, DIVISIONS * 2, DIVISIONS * 3],
    maxLeap: 2,
    hands: 'both',
    maxFifths: 1,
    allowTies: false,
    allowRests: false,
    leftHand: 'whole',
  },
  // Hands together, with ties and rests; the left hand holds roots.
  3: {
    rhKey: { low: 60, high: 72 },
    lhKey: { low: 48, high: 60 },
    rhythms: [DIVISIONS / 2, DIVISIONS, DIVISIONS * 2],
    maxLeap: 3,
    hands: 'both',
    maxFifths: 1,
    allowTies: true,
    allowRests: true,
    leftHand: 'whole',
  },
  // Ledger lines, keys to two accidentals, dotted quarters, block chords.
  4: {
    rhKey: { low: 57, high: 79 },
    lhKey: { low: 41, high: 60 },
    rhythms: [DIVISIONS / 2, DIVISIONS, DIVISIONS * 1.5, DIVISIONS * 2],
    maxLeap: 4,
    hands: 'both',
    maxFifths: 2,
    allowTies: true,
    allowRests: true,
    leftHand: 'chord',
  },
};

/** Scale degrees of I, IV and V — the only harmonies levels 1–4 use. */
const CHORD_DEGREES = [0, 3, 4];

/** Chooses one bar's worth of note lengths from the level's palette. */
function pickRhythm(rng: () => number, spec: LevelSpec, divisionsPerBar: number): number[] {
  const durations: number[] = [];
  let remaining = divisionsPerBar;
  while (remaining > 0) {
    const affordable = spec.rhythms.filter((r) => r <= remaining);
    const duration = affordable.length > 0 ? pick(rng, affordable) : remaining;
    durations.push(duration);
    remaining -= duration;
  }
  return durations;
}

/**
 * Builds the melody.
 *
 * Rhythms for the whole piece are chosen first, so the pitch walk knows how
 * many notes are left. That matters because two of the doc's rules pull
 * against each other at level 1 — "steps only" and "end on the tonic" — and a
 * melody that leaps home at the last moment breaks the first to satisfy the
 * second. Knowing the note count lets the walk start heading home exactly when
 * it can no longer afford to wander, so both rules hold by construction.
 */
function buildRightHand(
  rng: () => number,
  spec: LevelSpec,
  fifths: number,
  bars: number,
  divisionsPerBar: number,
): WriterNote[][] {
  const scale = scalePitches(fifths, spec.rhKey.low, spec.rhKey.high);
  if (scale.length === 0) return Array.from({ length: bars }, () => []);

  const tonic = tonicPitchClass(fifths);
  const tonicIndex = Math.max(0, scale.findIndex((m) => ((m % 12) + 12) % 12 === tonic));
  let index = tonicIndex;

  const rhythms = Array.from({ length: bars }, () => pickRhythm(rng, spec, divisionsPerBar));
  const totalNotes = rhythms.reduce((sum, bar) => sum + bar.length, 0);
  let placed = 0;

  const measures: WriterNote[][] = rhythms.map((barRhythm, bar) => {
    const notes: WriterNote[] = [];
    const isLastBar = bar === bars - 1;
    barRhythm.forEach((duration, i) => {
      const notesAfterThis = totalNotes - placed - 1;
      placed += 1;

      const isRest =
        spec.allowRests && notes.length > 0 && !(isLastBar && i === barRhythm.length - 1) && rng() < 0.12;
      if (isRest) {
        const { type, dotted } = durationToType(duration);
        notes.push({ midi: null, duration, type, staff: 1, voice: 1, ...(dotted ? { dotted } : {}) });
        return;
      }

      // Place at the current degree, *then* choose the next one. Moving first
      // would push the melody off the tonic before the opening note is even
      // written, which is how "start on C" was being lost.
      const midi = scale[index] ?? scale[0] ?? spec.rhKey.low;
      const { type, dotted } = durationToType(duration);
      const tieNext =
        spec.allowTies && !isLastBar && i === barRhythm.length - 1 && rng() < 0.25 ? 'start' : undefined;
      notes.push({
        midi,
        duration,
        type,
        staff: 1,
        voice: 1,
        ...(dotted ? { dotted } : {}),
        ...(tieNext ? { tie: tieNext } : {}),
      });

      if (notesAfterThis <= 0) return;
      // Moves left *after* this one. The melody may wander only as far as it
      // can still walk back from: checking the move it is about to make,
      // rather than the position it is already in, is what keeps "steps only"
      // and "end on the tonic" (docs/05 §8 level 1) from contradicting.
      const movesAfterThis = notesAfterThis - 1;
      const leap = Math.round((rng() * 2 - 1) * spec.maxLeap);
      const candidate = Math.min(
        scale.length - 1,
        Math.max(0, index + (leap === 0 ? 1 : leap)),
      );
      if (Math.abs(tonicIndex - candidate) <= movesAfterThis * spec.maxLeap) {
        index = candidate;
      } else {
        const distance = tonicIndex - index;
        index += Math.sign(distance) * Math.min(spec.maxLeap, Math.abs(distance));
      }
    });
    return notes;
  });

  // Close every tie that was opened: the next bar's first note has to accept
  // it and be the same pitch, or OSMD draws a tie to nowhere.
  for (let bar = 0; bar < measures.length - 1; bar += 1) {
    const current = measures[bar];
    const next = measures[bar + 1];
    const last = current?.[current.length - 1];
    const first = next?.[0];
    if (!last || !first || last.tie !== 'start') continue;
    if (first.midi === null) {
      delete last.tie;
      continue;
    }
    first.midi = last.midi;
    first.tie = 'stop';
  }
  return measures;
}

function buildLeftHand(
  rng: () => number,
  spec: LevelSpec,
  fifths: number,
  bars: number,
  divisionsPerBar: number,
): WriterNote[][] {
  if (spec.leftHand === 'none') return Array.from({ length: bars }, () => []);
  const scale = scalePitches(fifths, spec.lhKey.low, spec.lhKey.high);
  if (scale.length === 0) return Array.from({ length: bars }, () => []);

  return Array.from({ length: bars }, (_, bar) => {
    // I on the first and last bar, otherwise I, IV or V — a shape that always
    // resolves, which is what makes generated music readable.
    const degree = bar === 0 || bar === bars - 1 ? 0 : pick(rng, CHORD_DEGREES);
    const rootIndex = Math.min(scale.length - 1, degree);
    const root = scale[rootIndex] ?? scale[0] ?? spec.lhKey.low;
    const { type, dotted } = durationToType(divisionsPerBar);
    const base: WriterNote = {
      midi: root,
      duration: divisionsPerBar,
      type,
      staff: 2,
      voice: 5,
      ...(dotted ? { dotted } : {}),
    };
    if (spec.leftHand === 'whole') return [base];
    // A block triad: root, third and fifth of the scale from the root.
    const third = scale[rootIndex + 2];
    const fifth = scale[rootIndex + 4];
    // Chord members, not a sequence: without <chord/> the bar would be three
    // times as long as the time signature allows.
    return [
      base,
      ...(third === undefined ? [] : [{ ...base, midi: third, chord: true }]),
      ...(fifth === undefined ? [] : [{ ...base, midi: fifth, chord: true }]),
    ];
  });
}

/**
 * Generates an unseen exercise as MusicXML.
 *
 * The result is fed to the normal Score screen in Tempo mode, so nothing
 * downstream knows or cares that it was generated.
 */
export function generateSightReading(options: SightReadingOptions): SightReadingResult {
  const level = (Math.min(4, Math.max(1, Math.round(options.level))) || 1) as SightReadingLevel;
  const spec = LEVELS[level];
  const seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = makeRng(seed);

  const fifths = Math.max(-spec.maxFifths, Math.min(spec.maxFifths, options.fifths ?? 0));
  const timeSig = options.timeSig ?? { beats: 4, beatType: 4 };
  const bars = Math.max(1, Math.min(32, options.bars ?? 4));
  const bpm = options.bpm ?? 72;
  // Divisions are per quarter note, so 6/8 is six eighths = three quarters.
  const divisionsPerBar = (timeSig.beats * DIVISIONS * 4) / timeSig.beatType;

  const wantsLeft = options.hands !== 'R' && spec.hands === 'both';
  const rightBars = options.hands === 'L' && spec.leftHand !== 'none'
    ? Array.from({ length: bars }, () => [])
    : buildRightHand(rng, spec, fifths, bars, divisionsPerBar);
  const leftBars = wantsLeft
    ? buildLeftHand(rng, spec, fifths, bars, divisionsPerBar)
    : Array.from({ length: bars }, () => []);

  const staves: 1 | 2 = leftBars.some((b) => b.length > 0) ? 2 : 1;
  const measures: WriterMeasure[] = Array.from({ length: bars }, (_, bar) => {
    const right = rightBars[bar] ?? [];
    const left = leftBars[bar] ?? [];
    // A staff with nothing in it still needs a rest, or the bar is short.
    const filledRight =
      right.length > 0
        ? right
        : [
            {
              midi: null,
              duration: divisionsPerBar,
              ...durationToType(divisionsPerBar),
              staff: 1 as const,
              voice: 1,
            },
          ];
    const notes = staves === 2 ? [...withStaff(filledRight, 1), ...withStaff(left, 2)] : filledRight.map(stripStaff);
    return { notes };
  });

  const title = `Sight-reading level ${level} · seed ${seed}`;
  // A tied note is one note held, not two played, so only the tie's start
  // counts — a learner transposing this plays the key once.
  const melody = rightBars
    .flat()
    .filter((note) => note.midi !== null && note.tie !== 'stop')
    .map((note) => note.midi as number);
  return {
    musicXml: writeMusicXml({
      title,
      fifths,
      beats: timeSig.beats,
      beatType: timeSig.beatType,
      bpm,
      staves,
      measures,
    }),
    seed,
    level,
    title,
    fifths,
    timeSig,
    bars,
    bpm,
    melody,
  };
}

function withStaff(notes: WriterNote[], staff: 1 | 2): WriterNote[] {
  return notes.map((n) => ({ ...n, staff }));
}

/** Drops the staff number: a one-staff part must not carry `<staff>`. */
function stripStaff(note: WriterNote): WriterNote {
  const rest = { ...note };
  delete rest.staff;
  return rest;
}
