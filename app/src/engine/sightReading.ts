// Runtime sight-reading generator.
//
// docs/05-score-follow-engine.md §8. The whole point of sight-reading is that
// the material is *unseen*, so it is generated on the phone rather than
// shipped. Everything is deterministic from a seed: a failed sight-read can be
// retried on exactly the same music once, which is how you find out whether
// you actually learned it.
//
// The level table is the doc's, implemented for levels 1–7. Levels 5–7 were
// written in `05` §8 as "melodic contours from a Markov table trained on the
// folk corpus at build time"; the P11 replan §3.2 dropped that idea and this
// implements what replaced it — keys to four accidentals, two octaves,
// syncopation, triplets, a left hand drawn from the accompaniment patterns and
// chord-tone targeting on strong beats. A corpus-trained table would need a
// corpus at build time and would cost the one property that matters here:
// everything is reproducible from a seed.

import {
  DIVISIONS,
  durationToType,
  writeMusicXml,
  type WriterMeasure,
  type WriterNote,
} from './musicXmlWriter';
// The accompaniment lab's numerals, read by the same function the
// roman-numeral drill reads them with. `drills/theory` imports nothing, so
// there is no cycle back through the drill layer.
import { anyRomanToChord } from './drills/theory';

export type SightReadingLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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

/** Where the tonic sits in a `scalePitches` array. */
function tonicIndexIn(scale: number[], fifths: number): number {
  const tonic = tonicPitchClass(fifths);
  return Math.max(0, scale.findIndex((midi) => ((midi % 12) + 12) % 12 === tonic));
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
  /**
   * Left hand. The first three are levels 1–4; the last three are the
   * accompaniment patterns the generator already writes as exercises (`02`
   * Part E2), reused so a sight-read at level 5 asks for a hand shape the
   * learner has practised on its own.
   */
  leftHand: 'none' | 'whole' | 'chord' | 'alberti' | 'broken' | 'walking';
  /** A bar may start off the beat (levels 5+). */
  syncopation?: boolean;
  /** Eighth-note triplets are allowed (levels 6+). */
  triplets?: boolean;
  /**
   * The right hand lands on a chord tone on every strong beat.
   *
   * What makes generated music readable rather than merely legal: a reader
   * who knows the harmony can predict the strong beats, which is the whole
   * skill sight-reading is training.
   */
  chordTones?: boolean;
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
  // Two octaves, keys to three accidentals, syncopation, and a broken-chord
  // left hand: the first level where the page looks like music rather than an
  // exercise.
  5: {
    rhKey: { low: 57, high: 81 },
    lhKey: { low: 36, high: 60 },
    rhythms: [DIVISIONS / 2, DIVISIONS, DIVISIONS * 1.5, DIVISIONS * 2],
    maxLeap: 5,
    hands: 'both',
    maxFifths: 3,
    allowTies: true,
    allowRests: true,
    leftHand: 'alberti',
    syncopation: true,
    chordTones: true,
  },
  // Four accidentals and triplets.
  6: {
    rhKey: { low: 55, high: 84 },
    lhKey: { low: 36, high: 60 },
    rhythms: [DIVISIONS / 2, DIVISIONS, DIVISIONS * 1.5, DIVISIONS * 2],
    maxLeap: 5,
    hands: 'both',
    maxFifths: 4,
    allowTies: true,
    allowRests: true,
    leftHand: 'broken',
    syncopation: true,
    triplets: true,
    chordTones: true,
  },
  // A walking bass under it, and sixteenths.
  7: {
    rhKey: { low: 55, high: 86 },
    lhKey: { low: 33, high: 60 },
    rhythms: [DIVISIONS / 4, DIVISIONS / 2, DIVISIONS, DIVISIONS * 1.5, DIVISIONS * 2],
    maxLeap: 6,
    hands: 'both',
    maxFifths: 4,
    allowTies: true,
    allowRests: true,
    leftHand: 'walking',
    syncopation: true,
    triplets: true,
    chordTones: true,
  },
};

/**
 * The harmony under each bar, as scale degrees (0 = I).
 *
 * Chosen once and given to both hands, so the left hand's chord and the right
 * hand's strong beats agree. Levels 1–4 do not use it: their left hand picks
 * its own degree per bar and their right hand does not target anything, and
 * changing that would change music the goldens already describe.
 */
function pickHarmony(rng: () => number, bars: number): number[] {
  const middle = [0, 3, 4, 5, 1];
  return Array.from({ length: bars }, (_, bar) =>
    bar === 0 || bar === bars - 1 ? 0 : pick(rng, middle),
  );
}

/** Scale indices that are chord tones of a degree: root, third, fifth. */
function chordToneIndices(degree: number): number[] {
  return [degree, degree + 2, degree + 4];
}

/** One rhythmic cell: a length, and whether it is inside a triplet group. */
interface Cell {
  duration: number;
  tuplet?: { actual: number; normal: number; at?: 'start' | 'stop' };
  /** Silent by construction — the rest that pushes a syncopated bar off the beat. */
  rest?: boolean;
}

/**
 * Moves a scale index to the nearest chord tone of `degree`.
 *
 * Measured from the tonic's index rather than from index 0: the scale array
 * starts at the level's lowest playable note, which in most levels is not the
 * tonic, so "degree 0" is only the tonic by accident. See `tonicIndexIn`.
 */
function snapToChordTone(
  index: number,
  degree: number,
  tonicIndex: number,
  scaleLength: number,
): number {
  let best = index;
  let bestDistance = Infinity;
  for (let octave = -2; octave <= 2; octave += 1) {
    for (const tone of chordToneIndices(degree)) {
      const candidate = tonicIndex + tone + octave * 7;
      if (candidate < 0 || candidate >= scaleLength) continue;
      const distance = Math.abs(candidate - index);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
  }
  return best;
}

/** Scale degrees of I, IV and V — the only harmonies levels 1–4 use. */
const CHORD_DEGREES = [0, 3, 4];

/**
 * Chooses one bar's worth of rhythmic cells from the level's palette.
 *
 * Levels 1-4 consume the random stream exactly as they did before this
 * function grew the two extra rules: both are guarded by a level flag that is
 * false for them, so neither draws a number they did not draw before, and their
 * music is unchanged.
 */
function pickRhythm(rng: () => number, spec: LevelSpec, divisionsPerBar: number): Cell[] {
  const cells: Cell[] = [];
  let remaining = divisionsPerBar;

  // Syncopation is written as an eighth rest on the downbeat, which pushes
  // everything after it off the beat. That is what makes it hard to read and
  // it costs no special case anywhere downstream — the bar still adds up.
  if (spec.syncopation && remaining > DIVISIONS && rng() < 0.35) {
    cells.push({ duration: DIVISIONS / 2, rest: true });
    remaining -= DIVISIONS / 2;
  }

  while (remaining > 0) {
    if (spec.triplets && remaining >= DIVISIONS && rng() < 0.25) {
      const unit = DIVISIONS / 3;
      cells.push(
        { duration: unit, tuplet: { actual: 3, normal: 2, at: 'start' } },
        { duration: unit, tuplet: { actual: 3, normal: 2 } },
        { duration: unit, tuplet: { actual: 3, normal: 2, at: 'stop' } },
      );
      remaining -= DIVISIONS;
      continue;
    }
    const affordable = spec.rhythms.filter((r) => r <= remaining);
    const duration = affordable.length > 0 ? pick(rng, affordable) : remaining;
    cells.push({ duration });
    remaining -= duration;
  }
  return cells;
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
  harmony?: number[],
): WriterNote[][] {
  const scale = scalePitches(fifths, spec.rhKey.low, spec.rhKey.high);
  if (scale.length === 0) return Array.from({ length: bars }, () => []);

  const tonicIndex = tonicIndexIn(scale, fifths);
  let index = tonicIndex;

  const rhythms = Array.from({ length: bars }, () => pickRhythm(rng, spec, divisionsPerBar));
  const totalNotes = rhythms.reduce((sum, bar) => sum + bar.length, 0);
  let placed = 0;

  const measures: WriterNote[][] = rhythms.map((barRhythm, bar) => {
    const notes: WriterNote[] = [];
    const isLastBar = bar === bars - 1;
    let offset = 0;
    barRhythm.forEach((cell, i) => {
      const { duration, tuplet } = cell;
      const atOffset = offset;
      offset += duration;
      const notesAfterThis = totalNotes - placed - 1;
      placed += 1;

      // The syncopation rest is written first and is not a choice, so it does
      // not consume a note from the walk.
      if (cell.rest) {
        const { type, dotted } = durationToType(duration);
        notes.push({ midi: null, duration, type, staff: 1, voice: 1, ...(dotted ? { dotted } : {}) });
        return;
      }

      const isRest =
        spec.allowRests && notes.length > 0 && !(isLastBar && i === barRhythm.length - 1) && rng() < 0.12;
      if (isRest) {
        const { type, dotted } = durationToType(duration);
        notes.push({ midi: null, duration, type, staff: 1, voice: 1, ...(dotted ? { dotted } : {}) });
        return;
      }

      // A strong beat lands on a chord tone of the bar's harmony (levels 5+).
      // Done here rather than in the walk because it is a rule about *this*
      // note's position in the bar, not about how far the melody may travel.
      const degree = harmony?.[bar];
      if (spec.chordTones && degree !== undefined) {
        const strong = atOffset === 0 || atOffset === divisionsPerBar / 2;
        if (strong) index = snapToChordTone(index, degree, tonicIndex, scale.length);
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
        ...(tuplet ? { tuplet } : {}),
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

/**
 * Semitone offsets of the accompaniment patterns, as scale-index steps from the
 * chord's root, repeated until the bar is full.
 *
 * These are the shapes `make_accompaniment` writes as exercises, so a level-5
 * sight-read asks the left hand for something it has practised alone.
 */
const LEFT_HAND_PATTERNS: Record<'alberti' | 'broken' | 'walking', {
  steps: number[];
  unit: number;
}> = {
  // Root, fifth, third, fifth in eighths — Alberti bass.
  alberti: { steps: [0, 4, 2, 4], unit: 0.5 },
  // The same shape slowed to quarters, which is how it is first met.
  broken: { steps: [0, 4, 2, 4], unit: 1 },
  // Root, third, fifth, sixth: four quarters that walk.
  walking: { steps: [0, 2, 4, 5], unit: 1 },
};

function buildLeftHand(
  rng: () => number,
  spec: LevelSpec,
  fifths: number,
  bars: number,
  divisionsPerBar: number,
  harmony?: number[],
): WriterNote[][] {
  if (spec.leftHand === 'none') return Array.from({ length: bars }, () => []);
  const scale = scalePitches(fifths, spec.lhKey.low, spec.lhKey.high);
  if (scale.length === 0) return Array.from({ length: bars }, () => []);

  return Array.from({ length: bars }, (_, bar) => {
    // I on the first and last bar, otherwise I, IV or V — a shape that always
    // resolves, which is what makes generated music readable. Levels 5+ take
    // the degree from the harmony the right hand is also reading.
    const degree =
      harmony?.[bar] ?? (bar === 0 || bar === bars - 1 ? 0 : pick(rng, CHORD_DEGREES));
    // From the tonic, not from index 0. The scale array starts at the level's
    // lowest note — F2 at level 4, A1 at level 7 — so counting degrees from the
    // bottom of it built the tonic chord on whatever note that happened to be,
    // and the left hand played a different harmony from the one the right hand
    // was written over.
    const rootIndex = Math.min(scale.length - 1, tonicIndexIn(scale, fifths) + degree);

    const pattern = LEFT_HAND_PATTERNS[spec.leftHand as 'alberti' | 'broken' | 'walking'];
    if (pattern) {
      const step = DIVISIONS * pattern.unit;
      const count = Math.max(1, Math.round(divisionsPerBar / step));
      const { type, dotted } = durationToType(step);
      return Array.from({ length: count }, (_, i) => {
        const offset = pattern.steps[i % pattern.steps.length] ?? 0;
        const midi = scale[Math.min(scale.length - 1, rootIndex + offset)] ?? scale[0] ?? spec.lhKey.low;
        return {
          midi,
          duration: step,
          type,
          staff: 2 as const,
          voice: 5,
          ...(dotted ? { dotted } : {}),
        };
      });
    }

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
  const level = (Math.min(7, Math.max(1, Math.round(options.level))) || 1) as SightReadingLevel;
  const spec = LEVELS[level];
  const seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = makeRng(seed);

  const fifths = Math.max(-spec.maxFifths, Math.min(spec.maxFifths, options.fifths ?? 0));
  const timeSig = options.timeSig ?? { beats: 4, beatType: 4 };
  const bars = Math.max(1, Math.min(32, options.bars ?? 4));
  const bpm = options.bpm ?? 72;
  // Divisions are per quarter note, so 6/8 is six eighths = three quarters.
  const divisionsPerBar = (timeSig.beats * DIVISIONS * 4) / timeSig.beatType;

  // Drawn before either hand, and only where a level asks for it, so levels
  // 1-4 consume the same random numbers in the same order they always did.
  const harmony = spec.chordTones ? pickHarmony(rng, bars) : undefined;

  const wantsLeft = options.hands !== 'R' && spec.hands === 'both';
  // A level with no left-hand part of its own (level 1) can still be read by
  // the left hand alone: the same melody, drawn in the left hand's five-finger
  // range and written on the bass staff, with the treble staff resting. That
  // is the reading lesson 1.3 asks for — the bass clef, C3 to G3, one finger
  // per key — and it costs no new music, only where the tune is put.
  const leftOnlyMelody = options.hands === 'L' && spec.leftHand === 'none';
  const empty = (): WriterNote[][] => Array.from({ length: bars }, () => []);
  const rightBars =
    options.hands === 'L' && (spec.leftHand !== 'none' || leftOnlyMelody)
      ? empty()
      : buildRightHand(rng, spec, fifths, bars, divisionsPerBar, harmony);
  const leftBars = leftOnlyMelody
    ? buildRightHand(rng, { ...spec, rhKey: spec.lhKey }, fifths, bars, divisionsPerBar, harmony)
    : wantsLeft
      ? buildLeftHand(rng, spec, fifths, bars, divisionsPerBar, harmony)
      : empty();

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
  const melody = (leftOnlyMelody ? leftBars : rightBars)
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

// ---------------------------------------------------------------------------
// The accompaniment lab (docs/04 §3c)
// ---------------------------------------------------------------------------
//
// Everything above this line writes music the *app* chose. Everything below
// writes music the *owner* chose: a key, a progression, a left-hand pattern
// and a number of bars, with nothing random left except the melody's walk.
//
// It lives here rather than in the screen because it is the same writer — the
// same `WriterNote`, the same voicing rules, the same accompaniment shapes an
// exercise at level 5 asks for — and a second copy of those in a UI module is
// how the lab and the sight-reads would come to disagree about what "Alberti"
// means. Nothing here is called by `generateSightReading`, and nothing here
// changes what it produces: these are additions, and the goldens above are
// untouched.

/** One bar's harmony, named three ways: as written, as played, as printed. */
export interface LabChord {
  /** The roman numeral it was asked for — `ii`, `V7`, `♭VII`. */
  roman: string;
  /** What is printed on the jam chart — `Am`, `G7`, `B♭`. */
  label: string;
  /** Pitch classes 0–11, root first. What the keys light and the bass follows. */
  pitchClasses: number[];
}

export interface LabKey {
  id: string;
  /** `G major`, `C minor`. */
  label: string;
  /** Pitch class of the tonic. */
  tonic: number;
  mode: 'major' | 'minor';
  /** Sharps positive, flats negative, as in MusicXML `<fifths>`. */
  fifths: number;
}

/**
 * The twelve majors and the nine minors anybody writes a progression in.
 *
 * The majors are the whole circle from six flats to five sharps, so every
 * pitch class has exactly one entry and the list never offers the same twelve
 * notes twice under two names. The minors stop at four either way: C♯ minor is
 * where a pop song's relative minor gets to and A♭ minor is where nothing
 * does.
 */
export const LAB_KEYS: readonly LabKey[] = [
  { id: 'gb-major', label: 'G♭ major', tonic: 6, mode: 'major', fifths: -6 },
  { id: 'db-major', label: 'D♭ major', tonic: 1, mode: 'major', fifths: -5 },
  { id: 'ab-major', label: 'A♭ major', tonic: 8, mode: 'major', fifths: -4 },
  { id: 'eb-major', label: 'E♭ major', tonic: 3, mode: 'major', fifths: -3 },
  { id: 'bb-major', label: 'B♭ major', tonic: 10, mode: 'major', fifths: -2 },
  { id: 'f-major', label: 'F major', tonic: 5, mode: 'major', fifths: -1 },
  { id: 'c-major', label: 'C major', tonic: 0, mode: 'major', fifths: 0 },
  { id: 'g-major', label: 'G major', tonic: 7, mode: 'major', fifths: 1 },
  { id: 'd-major', label: 'D major', tonic: 2, mode: 'major', fifths: 2 },
  { id: 'a-major', label: 'A major', tonic: 9, mode: 'major', fifths: 3 },
  { id: 'e-major', label: 'E major', tonic: 4, mode: 'major', fifths: 4 },
  { id: 'b-major', label: 'B major', tonic: 11, mode: 'major', fifths: 5 },
  { id: 'f-minor', label: 'F minor', tonic: 5, mode: 'minor', fifths: -4 },
  { id: 'c-minor', label: 'C minor', tonic: 0, mode: 'minor', fifths: -3 },
  { id: 'g-minor', label: 'G minor', tonic: 7, mode: 'minor', fifths: -2 },
  { id: 'd-minor', label: 'D minor', tonic: 2, mode: 'minor', fifths: -1 },
  { id: 'a-minor', label: 'A minor', tonic: 9, mode: 'minor', fifths: 0 },
  { id: 'e-minor', label: 'E minor', tonic: 4, mode: 'minor', fifths: 1 },
  { id: 'b-minor', label: 'B minor', tonic: 11, mode: 'minor', fifths: 2 },
  { id: 'fs-minor', label: 'F♯ minor', tonic: 6, mode: 'minor', fifths: 3 },
  { id: 'cs-minor', label: 'C♯ minor', tonic: 1, mode: 'minor', fifths: 4 },
];

export function labKey(id: string): LabKey {
  return LAB_KEYS.find((key) => key.id === id) ?? (LAB_KEYS[6] as LabKey);
}

export interface LabProgression {
  id: string;
  /** How the progression is *named* — always in its major form, as people say it. */
  label: string;
  /** The numerals in a major key. */
  major: readonly string[];
  /**
   * The numerals in a minor key, which are not the same numerals.
   *
   * `I–V–vi–IV` has no minor-key form at all: the chords that make it are the
   * major scale's. What a minor key does with the same *sound* is
   * `i–♭VII–♭VI–♭VII`, and writing that down is more honest than transposing
   * numerals that would name three chords nobody plays there.
   */
  minor: readonly string[];
  /** Bar counts the form divides into. Twelve bars do not fit into eight. */
  barChoices: readonly number[];
}

const BAR_CHOICES = [4, 8, 16] as const;

/** I7–IV7–V7 in the shape everybody means by "the blues". */
const BLUES_MAJOR = [
  'I7', 'I7', 'I7', 'I7',
  'IV7', 'IV7', 'I7', 'I7',
  'V7', 'IV7', 'I7', 'V7',
] as const;

const BLUES_MINOR = [
  'i7', 'i7', 'i7', 'i7',
  'iv7', 'iv7', 'i7', 'i7',
  'V7', 'iv7', 'i7', 'V7',
] as const;

export const LAB_PROGRESSIONS: readonly LabProgression[] = [
  {
    id: 'i-iv-v-i',
    label: 'I–IV–V–I',
    major: ['I', 'IV', 'V', 'I'],
    minor: ['i', 'iv', 'V', 'i'],
    barChoices: BAR_CHOICES,
  },
  {
    id: 'i-v-vi-iv',
    label: 'I–V–vi–IV',
    major: ['I', 'V', 'vi', 'IV'],
    minor: ['i', '♭VII', '♭VI', '♭VII'],
    barChoices: BAR_CHOICES,
  },
  {
    id: 'ii-v-i',
    label: 'ii–V–I',
    // Two bars of tonic, so the turn lands on a downbeat when it repeats.
    major: ['ii', 'V7', 'I', 'I'],
    minor: ['iiø7', 'V7', 'i', 'i'],
    barChoices: BAR_CHOICES,
  },
  {
    id: 'i-vi-iv-v',
    label: 'I–vi–IV–V',
    major: ['I', 'vi', 'IV', 'V'],
    minor: ['i', '♭VI', 'iv', 'V'],
    barChoices: BAR_CHOICES,
  },
  {
    id: 'blues',
    label: '12-bar blues',
    major: BLUES_MAJOR,
    minor: BLUES_MINOR,
    barChoices: [12, 24],
  },
];

export function labProgression(id: string): LabProgression {
  return LAB_PROGRESSIONS.find((p) => p.id === id) ?? (LAB_PROGRESSIONS[0] as LabProgression);
}

/**
 * A named starting point for the lab (`04` §3c).
 *
 * The owner, 2026-09-17: *"as opposed to just messing around in the lab,
 * you're like, all right, we're doing jazz here — this is some jazz backing,
 * without all the options to start from scratch."*
 *
 * Six pickers with no starting point is a screen that asks a beginner to know
 * the answer before they arrive. A preset answers the ones that *make it that
 * style* and leaves the ones that are the learner's own.
 *
 * **`locks` is the whole design.** A preset that fixed every setting would be
 * an exercise with a lab's chrome; a preset that fixed none would be a
 * bookmark. So each one locks exactly the settings it is *about* — the
 * progression and the left-hand pattern are what make a blues a blues — and
 * leaves key, tempo and bar count free, because transposing it and slowing it
 * down is practising, not wandering off.
 *
 * A rung reaches one as `#/lab?preset=<id>`, the same query-parameter idiom the
 * Score screen already uses for `mode`, `loop`, `hands` and `tour`.
 */
/**
 * What *Jam it* plays besides the bass and the drums (`04` §3c, 2026-09-22).
 *
 * The owner: the lab should *"play chords while the user plays the melody, so
 * it'd go both ways"*. `hold` is that — the bed voices the progression and the
 * tune is the learner's. `tune` is the reverse: the bed plays the right hand
 * the generator writes and the learner comps underneath. `off` is the bed as
 * it has always been, and is what every jam opens on unless a preset says
 * otherwise.
 */
export type LabBed = 'off' | 'hold' | 'tune';

export interface LabPreset {
  id: string;
  label: string;
  /** One line saying what this is for; the screen prints it. */
  blurb: string;
  keyId: string;
  progressionId: string;
  leftHand: LabLeftHand;
  rightHand: LabRightHand;
  bars: number;
  bpm: number;
  /**
   * Which of the two ways round this preset opens on.
   *
   * A rung reaches it through the `lab` tool it already has, because
   * `curriculum.schema.json` closes the `tools` item to `kind`, `preset`,
   * `item` and `label` — so the preset is the only thing a rung can say. That
   * means every rung on one preset gets the same answer; where a rung's lesson
   * wants the other one it says so in prose and waits on a field of its own.
   */
  bed?: LabBed;
  /** Which of the settings above the learner may not change here. */
  locks: readonly ('key' | 'progression' | 'leftHand' | 'rightHand' | 'bars')[];
}

export const LAB_PRESETS: readonly LabPreset[] = [
  {
    // Added 2026-09-18 because `chords-pop.3` needed it. That lesson teaches
    // I-IV-V-I and its tool was pointed at the four-chord preset, which plays
    // I-V-vi-IV — a button that opens the wrong progression is worse than the
    // paragraph telling you to set the pickers yourself. The key is left free
    // on purpose: the rung's exercise is to play the same progression in D and
    // then in A, and a preset that locked the key would prevent the lesson.
    id: 'primary-chords',
    label: 'Primary chords — one four five',
    blurb: 'The three chords most songs are made of, in any key you like.',
    keyId: 'd-major',
    progressionId: 'i-iv-v-i',
    leftHand: 'chord',
    rightHand: 'melody',
    bars: 8,
    bpm: 84,
    // `chords-pop.3`: "Playing *When the Saints* over the two of those is this
    // lesson's transposing exercise" — a tune over the chords, so the bed holds
    // them. `3.2` wants the other way round and says so in prose.
    bed: 'hold',
    locks: ['progression', 'leftHand'],
  },
  {
    id: 'pop-four-chord',
    label: 'Pop — the four-chord song',
    blurb: 'The loop under more pop records than any other. Block chords, melody on top.',
    keyId: 'c-major',
    progressionId: 'i-v-vi-iv',
    leftHand: 'chord',
    rightHand: 'melody',
    bars: 8,
    bpm: 88,
    // No bed default: `chords-pop.4` is this preset's only rung and its lesson
    // asks for neither way round — it is about which inversion to take. A
    // default asserted from nothing is `00` §1a's inference from a name.
    locks: ['progression', 'leftHand'],
  },
  {
    id: 'ballad',
    label: 'Ballad — broken chords',
    blurb: 'The same four chords, spread out. This is the accompaniment, not the tune.',
    keyId: 'f-major',
    progressionId: 'i-vi-iv-v',
    leftHand: 'broken',
    rightHand: 'none',
    bars: 8,
    bpm: 72,
    // `chords-pop.7`: "something to try the colours over"; `improv.4`: "no right
    // hand at all — that part is yours". This preset writes no right hand, so
    // *Play the tune* has nothing to play here and is refused.
    bed: 'hold',
    locks: ['progression', 'leftHand', 'rightHand'],
  },
  {
    id: 'blues-shuffle',
    label: 'Blues — twelve bars',
    blurb: 'Three chords, twelve bars, round and round. Play anything over it.',
    keyId: 'c-major',
    progressionId: 'blues',
    leftHand: 'walking',
    rightHand: 'none',
    bars: 12,
    bpm: 84,
    // `blues.3`: "holds the changes underneath you: pick blue notes over the
    // top"; `blues.4`: "the same form to try a right-hand riff over"; `blues.9`:
    // "play chorus after chorus over it". `jam.5` says "comp through eight
    // choruses" and is the one this default is wrong for.
    bed: 'hold',
    // Bars are locked because twelve does not divide into eight and the form is
    // the lesson: a "12-bar blues" of eight bars is not one.
    locks: ['progression', 'leftHand', 'bars'],
  },
  {
    id: 'jazz-comping',
    label: 'Jazz — two five one',
    blurb: 'The turn every standard is built from. Comp it, do not read it.',
    keyId: 'c-major',
    progressionId: 'ii-v-i',
    leftHand: 'walking',
    rightHand: 'chord-tones',
    bars: 8,
    bpm: 100,
    // The three rungs on this preset all ask the learner to comp: `jazz.4`
    // "comp the Charleston over it", `jazz.5` "comp shells against it",
    // `jazz.6` "a comping pattern needs something to be in the gaps of". So
    // the bed takes the right hand and the learner takes the chords.
    bed: 'tune',
    locks: ['progression', 'leftHand'],
  },
  {
    id: 'minor-vamp',
    label: 'Rock — the minor vamp',
    blurb: 'Four chords that never resolve. Held roots underneath, so the hand can stay put.',
    // A minor key turns `I-V-vi-IV` into `i-bVII-bVI-bVII` (see the type above),
    // which is the rock vamp — and is the same progression the generator writes
    // as `exercise.modal-vamp.*`. One sound, one statement of it.
    keyId: 'a-minor',
    progressionId: 'i-v-vi-iv',
    leftHand: 'whole',
    rightHand: 'chord-tones',
    bars: 8,
    bpm: 80,
    // `rock.4`: "so you can play a right hand over it without reading
    // anything"; `rock.6`: "gives the figure a floor … so the arpeggio has
    // chords to sit on".
    bed: 'hold',
    locks: ['key', 'progression', 'leftHand'],
  },
];

export function labPreset(id: string): LabPreset | null {
  return LAB_PRESETS.find((p) => p.id === id) ?? null;
}

/**
 * What every control on the lab says it does, written down once (`04` §3c).
 *
 * The owner, 2026-09-21: the lab *"doesn't have enough documentation"*. It had
 * none: a grep of `LabScreen.ts` for `help|explain|tip|hint` on 2026-09-21
 * returned the file comment and nothing else, so six pickers, two buttons and
 * two chip rows stood on the screen with only their labels.
 *
 * **One table, not one line per control at the point of use.** A sentence
 * written beside the markup is a sentence the spec has to copy, and two copies
 * of a sentence drift — which is the failure `§2.8` of the working rules is
 * about. So the lines live here, the screen reads them by id, `04` §3c lists
 * them, and `labHelp.test.ts` fails when the two disagree.
 *
 * They are in the learner's terms on purpose: "which chords, in numerals" and
 * not "the progression", because somebody who knew what a progression was would
 * not need the line.
 */
export interface LabHelpLine {
  /** Which control. The screen looks its line up by this. */
  id:
    | 'lede'
    | 'presets'
    | 'bed'
    | 'trade'
    | 'key'
    | 'progression'
    | 'custom'
    | 'leftHand'
    | 'rightHand'
    | 'bars'
    | 'tempo';
  /** The control's own label on the screen, so the table can be read beside it. */
  label: string;
  help: string;
}

export const LAB_HELP: readonly LabHelpLine[] = [
  {
    id: 'lede',
    label: 'The two buttons',
    help: 'Read it writes these settings out as a score you can read. Jam it plays them as a loop you can play over.',
  },
  {
    id: 'presets',
    label: 'Start from',
    help: 'A style to start from, instead of six empty pickers. Free leaves every setting to you.',
  },
  {
    id: 'bed',
    label: 'What the app plays',
    help: 'Bed only is bass and drums. Hold the chords adds the harmony underneath, so the tune is yours. Play the tune gives the app the right hand, so the chords are yours.',
  },
  {
    id: 'trade',
    label: 'Trading fours',
    help: 'The app plays a few bars, then leaves you the same number, round and round.',
  },
  { id: 'key', label: 'Key', help: 'Which key it is all written and played in.' },
  {
    id: 'progression',
    label: 'Progression',
    help: 'Which chords, written as numerals so the same choice works in any key.',
  },
  {
    id: 'custom',
    label: 'Your numerals',
    help: 'One per bar — I, vi, V7, ♭VII, iiø7.',
  },
  {
    id: 'leftHand',
    label: 'Left hand',
    help: 'The shape the left hand plays the chords in, and the shape Hold the chords comps in.',
  },
  {
    id: 'rightHand',
    label: 'Right hand',
    help: 'What goes above the chords, and what Play the tune plays for you.',
  },
  {
    id: 'bars',
    label: 'Bars',
    help: 'How long one time round is. A shorter progression repeats rather than stretching.',
  },
  { id: 'tempo', label: 'Tempo', help: 'Beats per minute.' },
];

/** The line for one control, so a missing id is a build error and not a blank. */
export function labHelp(id: LabHelpLine['id']): string {
  return LAB_HELP.find((line) => line.id === id)?.help ?? '';
}

/**
 * The numerals for one run of `bars` bars.
 *
 * The pattern repeats rather than stretching: eight bars of a four-bar
 * progression is that progression twice, which is what "eight bars of
 * I–V–vi–IV" means to anybody who has played one.
 */
export function romansForProgression(
  progression: LabProgression,
  mode: 'major' | 'minor',
  bars: number,
): string[] {
  const pattern = mode === 'minor' ? progression.minor : progression.major;
  const count = Math.max(1, Math.trunc(bars));
  return Array.from({ length: count }, (_, bar) => pattern[bar % pattern.length] as string);
}

/**
 * `"I - V | vi IV"` → `['I', 'V', 'vi', 'IV']`.
 *
 * Bars are separated by space, comma, bar line or dash — but **not** by a
 * slash. A slash inside a numeral is the one thing it can mean here: `V/V` is
 * a secondary dominant, which `anyRomanToChord` reads. Splitting on it turned
 * `I V/V V I` into five readable bars with the borrowed chord gone and nothing
 * said, which is the one failure the "name the numeral you could not read"
 * path cannot catch.
 */
export function parseRomanList(text: string): string[] {
  return text
    .split(/[\s,|–—-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

/** Chord intervals above the root → the suffix printed after the note name. */
const LAB_SUFFIXES: { intervals: number[]; suffix: string }[] = [
  { intervals: [0, 4, 7], suffix: '' },
  { intervals: [0, 3, 7], suffix: 'm' },
  { intervals: [0, 3, 6], suffix: '°' },
  { intervals: [0, 4, 8], suffix: '+' },
  { intervals: [0, 4, 7, 10], suffix: '7' },
  { intervals: [0, 3, 7, 10], suffix: 'm7' },
  { intervals: [0, 4, 7, 11], suffix: 'maj7' },
  { intervals: [0, 3, 6, 10], suffix: 'ø7' },
  { intervals: [0, 3, 6, 9], suffix: '°7' },
];

function suffixFor(intervals: readonly number[]): string {
  const found = LAB_SUFFIXES.find(
    (entry) =>
      entry.intervals.length === intervals.length &&
      entry.intervals.every((value, i) => value === intervals[i]),
  );
  return found?.suffix ?? '';
}

/**
 * `"♭VI"` in a key → the chord.
 *
 * The numeral itself is read by `drills/theory`, which the roman-numeral drill
 * already uses — one reading of what `vii°` means, not two. What is added here
 * is the flat and sharp prefix, which that reader has no need of and a minor
 * key cannot do without: `♭VI` in A minor is F, and there is no way to say F
 * from A with an unaltered numeral. A prefix moves the whole chord a semitone
 * and leaves its quality alone, which is exactly what the accidental means.
 *
 * `null` when the numeral cannot be read at all — the lab names the one it
 * could not rather than quietly substituting a chord nobody typed.
 */
export function romanToLabChord(roman: string, key: LabKey): LabChord | null {
  const text = roman.trim();
  const match = /^([b♭#♯])?(.+)$/.exec(text);
  if (!match) return null;
  const accidental = match[1];
  const chord = anyRomanToChord(match[2] as string, key.tonic, 60);
  if (!chord) return null;
  const shift = accidental === undefined ? 0 : accidental === 'b' || accidental === '♭' ? -1 : 1;
  const root = chord.root + shift;
  const pitchClasses = chord.pitches.map((midi) => (((midi + shift) % 12) + 12) % 12);
  const intervals = pitchClasses.map((pc) => (((pc - root) % 12) + 12) % 12);
  // A flattened numeral is spelt with a flat whatever the key — ♭VII in C is
  // B♭, not A♯ — and a sharpened one with a sharp; only a plain numeral takes
  // the key's own spelling.
  const names =
    accidental === 'b' || accidental === '♭'
      ? FLAT_NAMES
      : accidental === '#' || accidental === '♯'
        ? SHARP_NAMES
        : key.fifths < 0
          ? FLAT_NAMES
          : SHARP_NAMES;
  const rootClass = (((root % 12) + 12) % 12);
  return {
    roman: text,
    label: `${names[rootClass] ?? 'C'}${suffixFor(intervals)}`,
    pitchClasses,
  };
}

/**
 * Every bar's chord, or `null` where a numeral could not be read.
 *
 * The nulls are kept rather than dropped: the lab has to be able to say
 * *which* bar it did not understand, and a list silently one shorter than the
 * one that was typed cannot.
 */
export function chordsForProgression(
  romans: readonly string[],
  key: LabKey,
): (LabChord | null)[] {
  return romans.map((roman) => romanToLabChord(roman, key));
}

export type LabLeftHand = 'none' | 'whole' | 'chord' | 'alberti' | 'broken' | 'walking';
export type LabRightHand = 'chord-tones' | 'melody' | 'none';

export interface LabExerciseOptions {
  title: string;
  fifths: number;
  /** One chord per bar. The length of this is the length of the exercise. */
  harmony: readonly LabChord[];
  leftHand: LabLeftHand;
  rightHand: LabRightHand;
  bpm?: number;
  timeSig?: { beats: number; beatType: number };
  /** Only the melody uses it; every other choice here is fully determined. */
  seed?: number;
}

export interface LabExerciseResult {
  musicXml: string;
  title: string;
  bars: number;
  bpm: number;
  fifths: number;
  seed: number;
}

/**
 * Where each hand sits: the left from A2, the right from C4.
 *
 * A2 rather than C3, which is where this started. A voicing that stacks
 * upwards from its floor puts a chord rooted near the top of that floor's
 * octave a whole octave high: from C3, a B chord is B3–D♯4–F♯4 and the
 * walking bass's sixth above it lands past middle C, which is not a left
 * hand's business. From A2 the roots run A2–G♯3 and only the two chords that
 * were highest move, down where they belong.
 */
const LAB_LEFT_FLOOR = 45;
const LAB_RIGHT_FLOOR = 60;
const LAB_RIGHT_CEILING = 81;

/**
 * A chord as ascending MIDI from `floor`, root first, each note above the last.
 *
 * Pitch classes have no octave, so a chord written `[9, 0, 4]` has to be told
 * where to sit before it can be played; doing it by "the next one above the
 * previous" keeps the shape closed, which is what a left hand wants and what
 * stacking every note in one octave would not give.
 */
export function voiceChord(pitchClasses: readonly number[], floor: number): number[] {
  const out: number[] = [];
  let low = floor;
  for (const pitchClass of pitchClasses) {
    const midi = low + ((((pitchClass - low) % 12) + 12) % 12);
    out.push(midi);
    low = midi + 1;
  }
  return out;
}

/** Root, fifth, third, fifth — the Alberti order, as indices into a voicing. */
const ALBERTI_ORDER = [0, 2, 1, 2];

function labLeftBar(
  chord: LabChord,
  pattern: Exclude<LabLeftHand, 'none'>,
  divisionsPerBar: number,
): WriterNote[] {
  const voiced = voiceChord(chord.pitchClasses, LAB_LEFT_FLOOR);
  const root = voiced[0] ?? LAB_LEFT_FLOOR;
  const at = (index: number): number => voiced[index] ?? voiced[voiced.length - 1] ?? root;

  if (pattern === 'whole' || pattern === 'chord') {
    const { type, dotted } = durationToType(divisionsPerBar);
    const base: WriterNote = {
      midi: root,
      duration: divisionsPerBar,
      type,
      staff: 2,
      voice: 5,
      ...(dotted ? { dotted } : {}),
    };
    if (pattern === 'whole') return [base];
    // Chord members, not a sequence: without `<chord/>` the bar is three times
    // as long as the time signature allows.
    return [base, ...voiced.slice(1).map((midi) => ({ ...base, midi, chord: true }))];
  }

  const step = pattern === 'alberti' ? DIVISIONS / 2 : DIVISIONS;
  const count = Math.max(1, Math.round(divisionsPerBar / step));
  const { type, dotted } = durationToType(step);
  return Array.from({ length: count }, (_, i) => {
    // Walking takes a sixth above the root for its fourth note, which is the
    // one that walks: root, third, fifth, six, and back down to the next
    // chord's root. The other two cycle the chord's own tones.
    const midi =
      pattern === 'walking'
        ? [at(0), at(1), at(2), root + 9][i % 4] ?? root
        : at(ALBERTI_ORDER[i % ALBERTI_ORDER.length] ?? 0);
    return {
      midi,
      duration: step,
      type,
      staff: 2 as const,
      voice: 5,
      ...(dotted ? { dotted } : {}),
    };
  });
}

/** The notes a melody over this chord may use: the key, plus the chord itself. */
function labMelodyPool(fifths: number, pitchClasses: readonly number[]): number[] {
  const pool = new Set(scalePitches(fifths, LAB_RIGHT_FLOOR, LAB_RIGHT_CEILING));
  for (let midi = LAB_RIGHT_FLOOR; midi <= LAB_RIGHT_CEILING; midi += 1) {
    // A secondary dominant's third is not in the key and is still the note the
    // bar is about, so the chord widens the pool rather than being filtered by
    // it.
    if (pitchClasses.includes(((midi % 12) + 12) % 12)) pool.add(midi);
  }
  return [...pool].sort((a, b) => a - b);
}

function nearestIndex(pool: readonly number[], midi: number): number {
  let best = 0;
  let bestDistance = Infinity;
  pool.forEach((candidate, index) => {
    const distance = Math.abs(candidate - midi);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

function nearestChordTone(
  pool: readonly number[],
  midi: number,
  pitchClasses: readonly number[],
): number {
  let best = midi;
  let bestDistance = Infinity;
  for (const candidate of pool) {
    if (!pitchClasses.includes(((candidate % 12) + 12) % 12)) continue;
    const distance = Math.abs(candidate - midi);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

/** The lengths a lab melody is written in. No ties, no rests: this is a study. */
const LAB_RHYTHMS = [DIVISIONS / 2, DIVISIONS, DIVISIONS * 1.5, DIVISIONS * 2];

function labRhythm(rng: () => number, divisionsPerBar: number): number[] {
  const out: number[] = [];
  let remaining = divisionsPerBar;
  while (remaining > 0) {
    const affordable = LAB_RHYTHMS.filter((duration) => duration <= remaining);
    const duration = affordable.length > 0 ? pick(rng, affordable) : remaining;
    out.push(duration);
    remaining -= duration;
  }
  return out;
}

/**
 * A melody over a harmony that is already decided.
 *
 * The one rule that makes a written-out accompaniment exercise readable rather
 * than merely legal, and it is the generator's own (`05` §8, levels 3 and up):
 * a strong beat lands on a chord tone, and between them the line steps. The
 * difference from `buildRightHand` is only that the harmony is the owner's and
 * not a draw from `pickHarmony`.
 */
function labMelodyBars(
  rng: () => number,
  fifths: number,
  harmony: readonly LabChord[],
  divisionsPerBar: number,
): WriterNote[][] {
  let pitch = LAB_RIGHT_FLOOR;
  return harmony.map((chord) => {
    const pool = labMelodyPool(fifths, chord.pitchClasses);
    const notes: WriterNote[] = [];
    let offset = 0;
    for (const duration of labRhythm(rng, divisionsPerBar)) {
      const strong = offset === 0 || offset === divisionsPerBar / 2;
      if (strong) pitch = nearestChordTone(pool, pitch, chord.pitchClasses);
      const { type, dotted } = durationToType(duration);
      notes.push({
        midi: pitch,
        duration,
        type,
        staff: 1,
        voice: 1,
        ...(dotted ? { dotted } : {}),
      });
      offset += duration;
      // Step, never leap: the leaps in this exercise belong to the left hand.
      const index = nearestIndex(pool, pitch);
      const move = rng() < 0.5 ? -1 : 1;
      pitch = pool[Math.min(pool.length - 1, Math.max(0, index + move))] ?? pitch;
    }
    return notes;
  });
}

function labChordToneBars(
  harmony: readonly LabChord[],
  divisionsPerBar: number,
): WriterNote[][] {
  const count = Math.max(1, Math.round(divisionsPerBar / DIVISIONS));
  const { type, dotted } = durationToType(DIVISIONS);
  return harmony.map((chord) => {
    const voiced = voiceChord(chord.pitchClasses, LAB_RIGHT_FLOOR);
    return Array.from({ length: count }, (_, i) => {
      // Up and back: root, third, fifth, third. A line that only climbs walks
      // off the top of the hand by the fourth bar.
      const order = [0, 1, 2, 1];
      const index = order[i % order.length] ?? 0;
      return {
        midi: voiced[Math.min(index, voiced.length - 1)] ?? LAB_RIGHT_FLOOR,
        duration: DIVISIONS,
        type,
        staff: 1 as const,
        voice: 1,
        ...(dotted ? { dotted } : {}),
      };
    });
  });
}

function restBar(divisionsPerBar: number, staff: 1 | 2, voice: number): WriterNote[] {
  const { type, dotted } = durationToType(divisionsPerBar);
  return [
    {
      midi: null,
      duration: divisionsPerBar,
      type,
      staff,
      voice,
      ...(dotted ? { dotted } : {}),
    },
  ];
}

/**
 * Writes the exercise the accompaniment lab was asked for (`04` §3c).
 *
 * Takes the harmony rather than choosing it — that is the whole difference
 * between this and `generateSightReading`, and the reason it is a second
 * entry point rather than an option on the first: a sight-read whose chords
 * the reader picked is not a sight-read, and an accompaniment study whose
 * chords the app picked is not the pattern anybody wanted to practise.
 */
export function buildLabExercise(options: LabExerciseOptions): LabExerciseResult {
  const harmony = options.harmony.length > 0 ? options.harmony : [];
  const bars = harmony.length;
  const seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = makeRng(seed);
  const timeSig = options.timeSig ?? { beats: 4, beatType: 4 };
  const bpm = options.bpm ?? 92;
  const divisionsPerBar = (timeSig.beats * DIVISIONS * 4) / timeSig.beatType;

  const rightBars: WriterNote[][] =
    options.rightHand === 'melody'
      ? labMelodyBars(rng, options.fifths, harmony, divisionsPerBar)
      : options.rightHand === 'chord-tones'
        ? labChordToneBars(harmony, divisionsPerBar)
        : harmony.map(() => restBar(divisionsPerBar, 1, 1));

  const leftHand = options.leftHand;
  const leftBars: WriterNote[][] =
    leftHand === 'none'
      ? harmony.map(() => [])
      : harmony.map((chord) => labLeftBar(chord, leftHand, divisionsPerBar));

  // One staff only when there is nothing under it. A right hand that is all
  // rests still gets its staff, because the exercise is then a left-hand
  // study and a pianist reads those on a grand staff like everything else.
  const staves: 1 | 2 = options.leftHand === 'none' ? 1 : 2;
  const measures: WriterMeasure[] = Array.from({ length: bars }, (_, bar) => {
    const right = rightBars[bar] ?? restBar(divisionsPerBar, 1, 1);
    const left = leftBars[bar] ?? [];
    const filledLeft = staves === 2 && left.length === 0 ? restBar(divisionsPerBar, 2, 5) : left;
    return {
      notes:
        staves === 2
          ? [...withStaff(right, 1), ...withStaff(filledLeft, 2)]
          : right.map(stripStaff),
    };
  });

  return {
    musicXml: writeMusicXml({
      title: options.title,
      fifths: options.fifths,
      beats: timeSig.beats,
      beatType: timeSig.beatType,
      bpm,
      staves,
      measures,
    }),
    title: options.title,
    bars,
    bpm,
    fifths: options.fifths,
    seed,
  };
}

/** One note of the bed's own right hand: what to play, when, and for how long. */
export interface LabBedNote {
  midi: number;
  /** Beats from the first beat of its bar. */
  atBeat: number;
  /** How long it sounds, in beats. */
  beats: number;
}

/**
 * The right hand the bed plays under *Play the tune* (`04` §3c).
 *
 * **It is the same right hand `buildLabExercise` writes**, taken from the same
 * two functions with the same seed, rather than a second melody generator for
 * the loop. Two generators over one set of settings would mean *Read it* and
 * *Play the tune* showed and played different tunes from the same screen, which
 * is the drift `§1` of the working rules is about — and the learner comping
 * under it would have no way to tell which was the exercise.
 *
 * Durations come back in beats rather than in divisions because the caller has
 * a tempo and not a time signature: the screen turns a beat into a second, and
 * nothing outside the writer should have to know that `DIVISIONS` is twelve.
 */
export function labRightHandBars(options: {
  fifths: number;
  harmony: readonly LabChord[];
  rightHand: LabRightHand;
  beatsPerBar?: number;
  seed?: number;
}): LabBedNote[][] {
  const beats = Math.max(1, Math.trunc(options.beatsPerBar ?? 4));
  const divisionsPerBar = beats * DIVISIONS;
  if (options.rightHand === 'none') return options.harmony.map(() => []);
  const bars =
    options.rightHand === 'melody'
      ? labMelodyBars(
          makeRng(options.seed ?? 21),
          options.fifths,
          options.harmony,
          divisionsPerBar,
        )
      : labChordToneBars(options.harmony, divisionsPerBar);
  return bars.map((notes) => {
    const out: LabBedNote[] = [];
    let offset = 0;
    for (const note of notes) {
      if (note.midi !== null) {
        out.push({ midi: note.midi, atBeat: offset / DIVISIONS, beats: note.duration / DIVISIONS });
      }
      offset += note.duration;
    }
    return out;
  });
}

/** One note the learner played, and the bar the loop was on when they played it. */
export interface LabPassNote {
  midi: number;
  /** Index into `harmony`. */
  bar: number;
}

export interface LabPassJudgement {
  /** How many notes were played at all. */
  notes: number;
  /** ...of which are in the scale the progression teaches. */
  inScale: number;
  /** ...of which are a chord tone of the bar they were played over. */
  onChord: number;
}

/**
 * What one time round was worth — two counts and no mark.
 *
 * The same contract trading fours already has (`04` §3c): this is a
 * measurement said out loud while the loop keeps going, nothing is written to
 * the practice history and nothing here can be passed or failed. It is counted
 * rather than scored for the reason Entry 28 gives — *six of eight in the blues
 * scale* is something a learner can act on, and a percentage over an
 * improvisation is a number pretending to be one.
 *
 * The bar a note is attributed to is the bar the loop was on when the key went
 * down, which is coarse: a note played a hair before the bar line counts
 * against the bar before it. That is honest about what the screen can know and
 * is why `onChord` is only ever *said* for the mode where the learner is
 * comping the bar they are in.
 */
export function judgeLabPass(options: {
  notes: readonly LabPassNote[];
  harmony: readonly LabChord[];
  scale: readonly number[];
}): LabPassJudgement {
  const wanted = new Set(options.scale.map((value) => (((value % 12) + 12) % 12)));
  let inScale = 0;
  let onChord = 0;
  for (const note of options.notes) {
    const pitchClass = (((note.midi % 12) + 12) % 12);
    if (wanted.has(pitchClass)) inScale += 1;
    const chord = options.harmony[note.bar];
    if (chord?.pitchClasses.some((value) => (((value % 12) + 12) % 12) === pitchClass)) {
      onChord += 1;
    }
  }
  return { notes: options.notes.length, inScale, onChord };
}

/**
 * The seed for one calendar day (`04` §2, the daily sight-read).
 *
 * A hash of the local date string rather than the date's number, so
 * consecutive days give unrelated music: `seed + 1` through `makeRng` is a
 * near neighbour of `seed`, and a week of daily reads would have come out as
 * seven takes of the same phrase. FNV-1a, written out for the same reason
 * `makeRng` is — a stored seed has to reproduce its day months later.
 */
export function dailySeed(dayKey: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash ^= dayKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
