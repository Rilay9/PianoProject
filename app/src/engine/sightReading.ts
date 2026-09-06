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
  const rightBars = options.hands === 'L' && spec.leftHand !== 'none'
    ? Array.from({ length: bars }, () => [])
    : buildRightHand(rng, spec, fifths, bars, divisionsPerBar, harmony);
  const leftBars = wantsLeft
    ? buildLeftHand(rng, spec, fifths, bars, divisionsPerBar, harmony)
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
