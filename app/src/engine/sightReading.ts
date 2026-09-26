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

export interface TimeSig {
  beats: number;
  beatType: number;
}

export interface SightReadingOptions {
  level: SightReadingLevel;
  /**
   * Sharps positive, flats negative. Clamped to what the level allows.
   *
   * A list is a choice the seed makes (T37): a rung that promises "keys"
   * gets a different one from phrase to phrase, and the same one every time
   * for the same seed. Drawn from a stream of its own, so the melody a seed
   * writes in the chosen key is the melody it writes when that key is asked
   * for outright.
   */
  fifths?: number | readonly number[];
  /** A list is a choice the seed makes, as for `fifths`. */
  timeSig?: TimeSig | readonly TimeSig[];
  bars?: number;
  hands?: 'R' | 'L' | 'both';
  bpm?: number;
  /** Any 32-bit integer; the same seed always gives the same music. */
  seed?: number;
  /**
   * What a rung promises the phrase will contain (T37). Each one both allows
   * the feature at a level whose table does not and *guarantees* it: a phrase
   * that came out without it is drawn again, from the same seed, so the seed
   * still names one phrase. See {@link PROMISES}.
   *
   * Tri-state since C4b, like every control below: `true` promises the
   * demand, `false` keeps it out of the phrase, absent is the level's own.
   * Where a `false` cannot be honoured (a level-6 phrase without triplets is
   * fine; a level-5 phrase without eighths is not, its Alberti left hand is in
   * eighths), {@link unrealisable} says so.
   */
  skips?: boolean;
  eighths?: boolean;
  syncopation?: boolean;
  triplets?: boolean;
  accidentals?: boolean;
  /**
   * The melody inside one five-finger position (C4): the five notes from the
   * key's tonic up, from middle C for the right hand and from the C below it
   * for a left hand read alone, whatever range the level's table gives.
   *
   * The one generator parameter the reader moves that no catalog row writes:
   * a level's range is bundled with its rhythms and its leaps, so without it
   * "the same phrase, but inside the hand" could only be had by changing the
   * level, which changes several things at once. Nothing else about the level
   * changes; the left hand under a melody keeps its own range.
   *
   * `false` (C4b) is the other way: the melody promised to reach beyond one
   * five-finger position (a span wider than a fifth), which a level-2 range
   * does in about half its phrases by itself. Level 1's range *is* one
   * position, so it cannot.
   */
  position?: boolean;
  /**
   * The controls C4b added, one for each reading demand a rung teaches that no
   * option could ask for (the curriculum–generator contract; the map from a
   * demand to these is `readingControls.ts`). Tri-state, as above.
   *
   * - `ties`: a note tied over the bar line, only from a note that starts on a
   *   beat (a tie from an off-beat is syncopation, which 4.5 teaches). Levels
   *   1-2 never tied; `false` keeps levels 3-7's ties out.
   * - `dottedQuarters`: a dotted quarter on a beat, its eighth after it, in
   *   simple time (in compound time it is the beat, not a dotted note); where
   *   the level writes eighths, beside a pair of plain eighths in one beat, the
   *   subdivision the dotted figure is read against.
   * - `ledger`: a melody note on a ledger line beyond middle C: the right
   *   hand's range reaches down to A below middle C, a left-hand melody's up
   *   to the E above it. `false` holds the range off the ledger lines.
   * - `leaps`: an interval of a fourth or wider in the melody; `false` holds
   *   it to steps and skips.
   * - `sixteenths`: a sixteenth note. No rung teaches reading them yet (S23).
   * - `leftHand`: the left hand's pattern in place of the level's own, with
   *   the range the level that first writes that pattern gives it, so the
   *   shape is the one the generator already writes: `whole` (level 2),
   *   `chord` (4), `alberti` (5), `broken` (6), `walking` (7). Both hands only.
   */
  ties?: boolean;
  dottedQuarters?: boolean;
  ledger?: boolean;
  leaps?: boolean;
  sixteenths?: boolean;
  leftHand?: LeftHandPattern;
}

/** The left-hand patterns an option can ask for (the table's `none` is `hands: 'R'`). */
export type LeftHandPattern = 'whole' | 'chord' | 'alberti' | 'broken' | 'walking';
export const LEFT_HAND_PATTERNS_BY_NAME: readonly LeftHandPattern[] = ['whole', 'chord', 'alberti', 'broken', 'walking'];

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
  /**
   * Every note starts where its length belongs (levels 1-4, T37).
   *
   * A length drawn with no rule about where in the bar it may start is
   * syncopation by accident: the trace counted a quarter-or-longer note
   * starting off the beat in 74 % of level-2 phrases, 98 % at level 3 and all
   * of level 4, three stages before the rung that teaches syncopation (4.5). So
   * below level 5 a plain note of length L starts on a multiple of L, a dotted
   * quarter starts on a beat and a dotted half on beat one or three. Levels
   * 5-7 keep the draw they had: their syncopation is designed, and their
   * goldens describe it.
   */
  metricPlacement?: boolean;
  /**
   * The designed syncopation below level 5, where a rung promises it (4.5):
   * eighth, quarter, eighth from a beat — the quarter on the "and".
   */
  syncopa?: boolean;
  /**
   * A tie only from a note that starts on the beat (C4b): set where an option
   * asks for ties or keeps syncopation out, so a tie is never syncopation by
   * accident. Levels whose phrases asked for neither keep the draw they had.
   */
  tieOnBeat?: boolean;
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
    metricPlacement: true,
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
    metricPlacement: true,
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
    metricPlacement: true,
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
    metricPlacement: true,
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
  /**
   * The off-beat quarter of a designed syncopation. Never turned into a rest:
   * a quarter rest on an "and" is bad notation, and the figure is the point.
   */
  syncopated?: boolean;
}

/**
 * What a phrase turned out to contain, counted as it is written (T37).
 *
 * The generator promises a rung's features by checking this and drawing the
 * phrase again when one is missing, so it counts what is on the page and not
 * what was intended: a triplet whose every note became a rest does not count.
 */
interface Tally {
  steps: number;
  skips: number;
  eighths: number;
  syncopation: number;
  triplets: number;
  accidentals: number;
  // C4b's promises, counted on the melody once the phrase is written.
  ties: number;
  dottedQuarters: number;
  ledger: number;
  leaps: number;
  sixteenths: number;
  /** 1 when the melody spans more than one five-finger position (`position: false`). */
  beyond: number;
  /** 1 when the melody strikes a note in every bar (`underTune`, `promisesFor`). */
  underTune: number;
}

function emptyTally(): Tally {
  return {
    steps: 0,
    skips: 0,
    eighths: 0,
    syncopation: 0,
    triplets: 0,
    accidentals: 0,
    ties: 0,
    dottedQuarters: 0,
    ledger: 0,
    leaps: 0,
    sixteenths: 0,
    beyond: 0,
    underTune: 0,
  };
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

/** How often a designed figure is tried at a beat that can hold it (levels 1-4). */
const PLACED_TRIPLET_CHANCE = 0.08;
const PLACED_SYNCOPA_CHANCE = 0.1;

/**
 * Whether a length may start at this offset in a bar of simple time (T37).
 *
 * A plain length starts on a multiple of itself, so a quarter is on a beat, a
 * half on beat one or three and a whole on beat one; a dotted quarter starts
 * on a beat (its eighth then falls on the "and" by the same rule); a dotted
 * half on beat one or three.
 */
function placedOnItsBeat(duration: number, offset: number, beat: number): boolean {
  if (duration === beat * 1.5) return offset % beat === 0;
  if (duration === beat * 3) return offset % (beat * 2) === 0;
  return offset % duration === 0;
}

/** Compound time: beats of three eighths (6/8, 9/8, 12/8). */
function isCompoundTime(timeSig: TimeSig): boolean {
  return timeSig.beatType === 8 && timeSig.beats % 3 === 0;
}

/** The beat a reader counts, in divisions: a dotted quarter in compound time. */
function feltBeat(timeSig: TimeSig): number {
  return isCompoundTime(timeSig) ? DIVISIONS * 1.5 : (DIVISIONS * 4) / timeSig.beatType;
}

/**
 * One bar of rhythm for levels 1-4, every note where its length belongs.
 *
 * Simple time walks the bar from the left and draws only lengths that may
 * start where it is. Compound time (6/8, 9/8, 12/8) fills it a dotted-quarter
 * beat at a time from the three figures a first reader of 6/8 meets — the
 * dotted quarter, the quarter-eighth lilt and three eighths — with the whole
 * bar held now and then; no designed syncopation and no triplets there, where
 * a triplet is not a thing and one new metre is enough to read.
 */
function pickRhythmPlaced(
  rng: () => number,
  spec: LevelSpec,
  divisionsPerBar: number,
  timeSig: TimeSig,
): Cell[] {
  const cells: Cell[] = [];
  const compound = timeSig.beatType === 8 && timeSig.beats % 3 === 0;
  if (compound) {
    const beat = DIVISIONS * 1.5;
    const eighth = DIVISIONS / 2;
    if (divisionsPerBar === beat * 2 && rng() < 0.12) return [{ duration: beat * 2 }];
    const figures = [[beat], [DIVISIONS, eighth], [eighth, eighth, eighth]];
    let offset = 0;
    while (offset + beat <= divisionsPerBar) {
      for (const duration of pick(rng, figures)) cells.push({ duration });
      offset += beat;
    }
    if (offset < divisionsPerBar) cells.push({ duration: divisionsPerBar - offset });
    return cells;
  }
  const beat = (DIVISIONS * 4) / timeSig.beatType;
  let offset = 0;
  while (offset < divisionsPerBar) {
    const remaining = divisionsPerBar - offset;
    const onBeat = offset % beat === 0;
    if (spec.triplets && onBeat && remaining >= beat && rng() < PLACED_TRIPLET_CHANCE) {
      const unit = beat / 3;
      cells.push(
        { duration: unit, tuplet: { actual: 3, normal: 2, at: 'start' } },
        { duration: unit, tuplet: { actual: 3, normal: 2 } },
        { duration: unit, tuplet: { actual: 3, normal: 2, at: 'stop' } },
      );
      offset += beat;
      continue;
    }
    if (spec.syncopa && onBeat && remaining >= beat * 2 && rng() < PLACED_SYNCOPA_CHANCE) {
      cells.push({ duration: beat / 2 }, { duration: beat, syncopated: true }, { duration: beat / 2 });
      offset += beat * 2;
      continue;
    }
    const allowed = spec.rhythms.filter(
      (duration) => duration <= remaining && placedOnItsBeat(duration, offset, beat),
    );
    // Nothing in the palette fits only where the bar ends on a fragment the
    // palette has no length for; the fragment is then the note.
    const duration = allowed.length > 0 ? pick(rng, allowed) : remaining;
    cells.push({ duration });
    offset += duration;
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
  harmony: number[] | undefined,
  timeSig: TimeSig,
  tally: Tally,
): WriterNote[][] {
  const scale = scalePitches(fifths, spec.rhKey.low, spec.rhKey.high);
  if (scale.length === 0) return Array.from({ length: bars }, () => []);

  const tonicIndex = tonicIndexIn(scale, fifths);
  let index = tonicIndex;

  const rhythms = Array.from({ length: bars }, () =>
    spec.metricPlacement
      ? pickRhythmPlaced(rng, spec, divisionsPerBar, timeSig)
      : pickRhythm(rng, spec, divisionsPerBar),
  );
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
        tally.syncopation += 1;
        return;
      }

      const isRest =
        spec.allowRests &&
        notes.length > 0 &&
        !(isLastBar && i === barRhythm.length - 1) &&
        cell.syncopated !== true &&
        rng() < 0.12;
      if (isRest) {
        const { type, dotted } = durationToType(duration);
        // A rest inside a triplet keeps the triplet (T37). It was written as a
        // plain eighth rest a triplet long, with no `<time-modification>` and
        // its bracket's start or stop dropped, in 87 % of level-6 phrases and
        // 89 % of level-7 ones: the bar still added up, and the page did not
        // say three-in-the-time-of-two where it had to.
        notes.push({
          midi: null,
          duration,
          type,
          staff: 1,
          voice: 1,
          ...(dotted ? { dotted } : {}),
          ...(tuplet ? { tuplet } : {}),
        });
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
      // Only from a note on the beat where an option asks (C4b): the check sits
      // before the draw, and is true where no option asked, so a phrase that
      // asked for neither ties nor their absence draws what it always drew.
      const onItsBeat = spec.tieOnBeat !== true || atOffset % feltBeat(timeSig) === 0;
      const tieNext =
        spec.allowTies && !isLastBar && i === barRhythm.length - 1 && onItsBeat && rng() < 0.25 ? 'start' : undefined;
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
      if (tuplet) tally.triplets += 1;
      else if (duration === DIVISIONS / 2) tally.eighths += 1;
      if (cell.syncopated === true) tally.syncopation += 1;

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
 * The features a rung can promise, and how each is looked for (T37).
 *
 * A rung that says a phrase trains skips, eighths, syncopation, triplets or
 * accidentals gets phrases that contain them: the option both allows the
 * feature where the level's table does not and makes it a condition of the
 * phrase. The key and the metre are promised by `fifths` and `timeSig`
 * themselves, which the phrase simply is in.
 *
 * - `skips`: a third somewhere in the tune and a step somewhere too, and the
 *   walk may move by a third (level 1's cap is a step; rung 1.5 is *Steps and
 *   skips*). Both, because reading by interval is telling the two apart: a
 *   phrase of nothing but thirds would teach that as little as one of nothing
 *   but steps did.
 * - `eighths`: at least one eighth note, not in a triplet (rung 2.2).
 * - `syncopation`: below level 5 the eighth-quarter-eighth figure from a beat;
 *   from level 5 the bar that opens on an eighth rest (rungs 4.5, theory.6).
 *   Not asked of a phrase in compound time, which is its own new thing.
 * - `triplets`: at least one sounded triplet, on a beat; simple time only.
 * - `accidentals`: the raised fourth rising a step to the fifth (F sharp to G
 *   in C), off the downbeat and never over the IV chord it would clash with.
 */
export const PROMISES = ['skips', 'eighths', 'syncopation', 'triplets', 'accidentals'] as const;
export type PhrasePromise = (typeof PROMISES)[number];

/**
 * How many times a phrase is drawn again for a missing promise before it is
 * given up on.
 *
 * 64 was enough for one promise at a time, and not for the recipes the reader
 * composes (C4d, S29): at 3.1 the working recipe promises skips, eighths,
 * dotted quarters, ties and an accidental at once, and in G major level 2's
 * raised fourth (C sharp) lies at the bottom of its range, so a draw keeps the
 * accidental about once in forty and all five about once in two hundred; the
 * budget ran out at some seeds and the phrase went out without a tie, a dotted
 * quarter or its accidental, silently. Counted over every recipe the reader can
 * reach (`composedContract.test.ts`), the rarest keeps all its promises about
 * once in 370 draws (the two-hand row at 3.6 in G with a ledger line, an
 * accidental, ties and dotted quarters, seeds 1–20,000). At this budget a seed
 * of that recipe misses a promise about once in 60,000. A phrase that kept its
 * promises in fewer draws is unchanged: the loop stops at the first that keeps
 * them, so only the phrases that used to go out without one are different.
 */
const PROMISE_ATTEMPTS = 4096;

/** Salt for the stream that chooses a key and a metre from a list. */
const CHOICE_SALT = 0x5bd1e995;

/** The seed of a redraw: attempt 0 is the seed itself, so a phrase that kept its promises is unchanged. */
function attemptSeed(seed: number, attempt: number): number {
  return attempt === 0 ? seed >>> 0 : (seed ^ Math.imul(attempt, 0x9e3779b1)) >>> 0;
}

function chooseOne<T>(rng: () => number, value: T | readonly T[] | undefined): T | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return value as T;
  const list = value as readonly T[];
  return list.length > 0 ? pick(rng, list) : undefined;
}

/**
 * The widest key a level writes (its table's `maxFifths`): a key asked for
 * beyond it is clamped to it. Read by the reader (C4), so a key it moves to is
 * one the level will actually write.
 */
export function maxFifthsFor(level: number): number {
  const at = (Math.min(7, Math.max(1, Math.round(level))) || 1) as SightReadingLevel;
  return LEVELS[at].maxFifths;
}

/**
 * What a level's table writes by itself, for the control map
 * (`readingControls.ts`), which says per demand whether a phrase of given
 * options may contain it. Read-only facts, not the table.
 */
export interface LevelFacts {
  hands: 'R' | 'both';
  leftHand: 'none' | LeftHandPattern;
  /** Note lengths, in quarter-note beats. */
  lengths: readonly number[];
  maxLeap: number;
  allowTies: boolean;
  maxFifths: number;
  rhRange: { low: number; high: number };
  syncopation: boolean;
  triplets: boolean;
  chordTones: boolean;
  metricPlacement: boolean;
}

export function levelFacts(level: number): LevelFacts {
  const at = (Math.min(7, Math.max(1, Math.round(level))) || 1) as SightReadingLevel;
  const spec = LEVELS[at];
  return {
    hands: spec.hands,
    leftHand: spec.leftHand,
    lengths: spec.rhythms.map((r) => r / DIVISIONS),
    maxLeap: spec.maxLeap,
    allowTies: spec.allowTies,
    maxFifths: spec.maxFifths,
    rhRange: { ...spec.rhKey },
    syncopation: spec.syncopation === true,
    triplets: spec.triplets === true,
    chordTones: spec.chordTones === true,
    metricPlacement: spec.metricPlacement === true,
  };
}

/** The metres a phrase of these options may be written in (4/4 where none is asked). */
function metresAsked(options: SightReadingOptions): readonly TimeSig[] {
  if (options.timeSig === undefined) return [{ beats: 4, beatType: 4 }];
  return Array.isArray(options.timeSig) ? (options.timeSig as readonly TimeSig[]) : [options.timeSig as TimeSig];
}

/** The keys a phrase of these options may be asked in. */
function keysAsked(options: SightReadingOptions): number[] {
  if (options.fifths === undefined) return [0];
  return Array.isArray(options.fifths) ? [...(options.fifths as readonly number[])] : [options.fifths as number];
}

/**
 * Why the generator cannot write what these options ask, or nothing (C4b).
 *
 * The curriculum–generator contract's "never silent": where an option cannot
 * be honoured — the level has no room for it, two options contradict, or the
 * phrase's metre does not admit it — the generator does not hand back
 * different material and let it pass as the thing asked for. It still writes
 * its best phrase, and this says, in words for a reader of `05` §8, what that
 * phrase will not be. Pure: the options alone decide it, never the seed.
 *
 * `generatorContract.test.ts` holds this to the phrases: every combination the
 * reading curriculum can ask for either keeps its promise on every seed tried,
 * or is named here (or, where a rung's own promise forbids it, in
 * `readingControls.ts`'s `UNREALISABLE_AT`).
 */
export function unrealisable(options: SightReadingOptions): string[] {
  const level = (Math.min(7, Math.max(1, Math.round(options.level))) || 1) as SightReadingLevel;
  const facts = levelFacts(level);
  const hands = options.hands ?? 'both';
  const twoHands = hands === 'both' && facts.hands === 'both';
  const leftHand = leftHandOf(level, options);
  const pattern = twoHands && (leftHand === 'alberti' || leftHand === 'broken' || leftHand === 'walking');
  // Some phrases in compound time, or every one: a metre list is a choice the
  // seed makes, and the rhythms simple time is asked for are asked only of the
  // phrases in simple time (T37), so only a list with no simple metre in it
  // cannot keep them at all.
  const compoundAny = metresAsked(options).some(isCompoundTime);
  const compoundAll = metresAsked(options).every(isCompoundTime);
  const tiesAllowed = options.ties === true || (options.ties !== false && facts.allowTies);
  const reasons: string[] = [];
  const say = (reason: string): void => {
    if (!reasons.includes(reason)) reasons.push(reason);
  };

  if (options.hands === 'both' && facts.hands === 'R') {
    say('Level 1 writes one hand at a time; both hands start at level 2.');
  }
  if (options.leftHand !== undefined && !twoHands) {
    say('A left-hand pattern is written under a melody, so it needs both hands, from level 2.');
  }
  if (hands === 'L' && facts.hands === 'both') {
    const shaping = (
      ['skips', 'eighths', 'syncopation', 'triplets', 'accidentals', 'ties', 'dottedQuarters', 'ledger', 'leaps', 'sixteenths'] as const
    ).some((name) => options[name] !== undefined);
    if (shaping || options.position !== undefined) {
      say('From level 2 the left hand read alone plays its accompaniment, with no melody for these options to shape.');
    }
  }
  const beyondKey = keysAsked(options).find((k) => Math.abs(k) > facts.maxFifths);
  if (beyondKey !== undefined) {
    say(
      facts.maxFifths === 0
        ? 'Level 1 writes C major only.'
        : `Level ${String(level)} writes keys up to ${String(facts.maxFifths)} sharp${facts.maxFifths === 1 ? '' : 's'} or flat${facts.maxFifths === 1 ? '' : 's'}; a wider key is written in the widest it has.`,
    );
  }
  if (options.ledger === true && hands === 'L' && facts.hands === 'R') {
    say('A left hand read alone at level 1 starts and ends on the C below middle C, too far by step from a ledger line to reach one and come back.');
  }
  if (options.position === true && options.ledger === true) {
    say('Held inside one five-finger position from middle C, the melody has no ledger line beyond middle C to reach.');
  }
  if (options.position === false && level === 1) {
    say('Level 1’s range is one five-finger position, so its melody cannot leave it.');
  }
  // C4d (S29), a composition: the position from the key's tonic can lie above
  // the level's own range, and the melody would climb past where the level
  // stops (G major's position, G to D, at levels 2 and 3, which stop at the C an
  // octave above middle C). Found by the composed contract: at 3.1 a keyed
  // recipe with the hand held in position broke 2.5's "nothing above the C
  // above middle C".
  if (options.position === true && hands !== 'L') {
    const top = LEVELS[level].rhKey.high;
    const climbs = keysAsked(options).some((k) => handPosition(Math.max(-facts.maxFifths, Math.min(facts.maxFifths, k)), 60).high > top);
    if (climbs) say('Held inside the five-finger position from its tonic, a melody in one of these keys would climb above the top of the level’s range.');
  }
  if (compoundAny && (leftHand === 'broken' || leftHand === 'walking') && options.leftHand !== undefined && twoHands) {
    say('The broken-chord and walking left hands move in quarters, which cross the dotted-quarter beat of compound time.');
  }
  if (options.ledger === false && pattern) {
    say('The Alberti, broken-chord and walking left hands are built from the C two octaves below middle C, on ledger lines below the bass staff.');
  }
  if (compoundAll && (options.syncopation === true || options.triplets === true)) {
    say('A phrase in compound time is not asked for syncopation or triplets: one new metre is enough to read (T37).');
  }
  if (compoundAll && options.dottedQuarters === true) {
    say('In compound time the dotted quarter is the beat itself, not a dotted note to read.');
  }
  if (compoundAny && facts.metricPlacement && (options.sixteenths === true || options.eighths === false)) {
    say('Compound time at levels 1–4 is written in its three first figures, all of dotted quarters, quarters and eighths.');
  }
  if (options.ties === true && (options.bars ?? 4) < 2) {
    say('A tie crosses a bar line, and a phrase of one bar has none.');
  }
  if (options.skips === false && options.leaps === true) {
    say('A melody held to steps cannot leap.');
  }
  if (options.skips === false || options.leaps === false) {
    const what = options.skips === false ? 'a third' : 'a fourth or wider';
    if (tiesAllowed) say(`A tie’s closing note is set to the tied pitch after the melody has moved on, so the note after it can be ${what} away.`);
    if (facts.chordTones) say(`From level 5 the melody moves to a chord tone on the strong beats, which can be ${what} away.`);
  }
  if (options.skips === false && pattern) {
    say('The Alberti, broken-chord and walking left hands move by thirds.');
  }
  if (options.leaps === false && twoHands) {
    say('The left hand’s roots move between I, IV and V, by fourths and fifths.');
  }
  if (options.eighths === false) {
    if (options.syncopation === true && facts.metricPlacement) say('The syncopation below level 5 is the eighth–quarter–eighth figure.');
    if (options.dottedQuarters === true) say('A dotted quarter in simple time is completed by an eighth.');
    const sixteenths = options.sixteenths === true || (facts.lengths.includes(0.25) && options.sixteenths !== false);
    if (!facts.metricPlacement && options.syncopation !== false && !sixteenths) {
      say('From level 5 a syncopated bar opens on an eighth rest and leaves an eighth to fill.');
    }
    if (twoHands && leftHand === 'alberti') say('The Alberti left hand is in eighths.');
  }
  return reasons;
}

/** One five-finger position: the five notes from the key's tonic, at or above `from` (C4). */
function handPosition(fifths: number, from: number): { low: number; high: number } {
  const tonic = tonicPitchClass(fifths);
  const low = from + ((tonic - (from % 12) + 12) % 12);
  return { low, high: low + 7 };
}

/**
 * The level that first writes each left-hand pattern (C4b's `leftHand`): an
 * override takes that level's left-hand range with the pattern, so the shape is
 * the one the generator already writes there, not a pattern folded into a range
 * built for held roots.
 */
const LEFT_HAND_HOME: Readonly<Record<LeftHandPattern, SightReadingLevel>> = {
  whole: 2,
  chord: 4,
  alberti: 5,
  broken: 6,
  walking: 7,
};

/** The left hand a phrase of these options is written with: the option's pattern, else the level's own. */
function leftHandOf(level: SightReadingLevel, options: SightReadingOptions): LevelSpec['leftHand'] {
  return options.leftHand ?? LEVELS[level].leftHand;
}

const withoutLength = (rhythms: number[], length: number): number[] => rhythms.filter((r) => r !== length);
const withLength = (rhythms: number[], length: number): number[] =>
  rhythms.includes(length) ? rhythms : [...rhythms, length].sort((a, b) => a - b);

/**
 * The level's table, widened by what the options promise and narrowed by what
 * they keep out.
 *
 * Every C4b branch is guarded by its option being given, so a phrase that asks
 * none of them gets the table exactly as before (the unchanged golden).
 */
function specFor(level: SightReadingLevel, options: SightReadingOptions): LevelSpec {
  const base = LEVELS[level];
  const spec: LevelSpec = {
    ...base,
    // A skip is a third: the walk has to be allowed one.
    ...(options.skips === true ? { maxLeap: Math.max(base.maxLeap, 2) } : {}),
    // Eighths come with level 2's palette; below it they are added.
    ...(options.eighths === true && !base.rhythms.includes(DIVISIONS / 2)
      ? { rhythms: [DIVISIONS / 2, ...base.rhythms] }
      : {}),
    ...(options.syncopation === true && base.metricPlacement === true ? { syncopa: true } : {}),
    ...(options.syncopation === true && base.metricPlacement !== true ? { syncopation: true } : {}),
    ...(options.triplets === true ? { triplets: true } : {}),
  };
  // --- C4b: each control where it is given, and nowhere else ---
  // A leap is a fourth or wider; held to steps and skips, or to steps only.
  if (options.leaps === true) spec.maxLeap = Math.max(spec.maxLeap, 3);
  if (options.leaps === false) spec.maxLeap = Math.min(spec.maxLeap, 2);
  if (options.skips === false) spec.maxLeap = 1;
  if (options.ties === true) spec.allowTies = true;
  if (options.ties === false) spec.allowTies = false;
  if (options.ties !== undefined || options.syncopation === false) spec.tieOnBeat = true;
  if (options.dottedQuarters === true) {
    spec.rhythms = withLength(spec.rhythms, DIVISIONS * 1.5);
    // The dotted quarter's eighth completes its beat.
    if (options.eighths !== false) spec.rhythms = withLength(spec.rhythms, DIVISIONS / 2);
  }
  if (options.dottedQuarters === false) spec.rhythms = withoutLength(spec.rhythms, DIVISIONS * 1.5);
  if (options.sixteenths === true) spec.rhythms = withLength(spec.rhythms, DIVISIONS / 4);
  if (options.sixteenths === false) spec.rhythms = withoutLength(spec.rhythms, DIVISIONS / 4);
  if (options.eighths === false) {
    spec.rhythms = withoutLength(spec.rhythms, DIVISIONS / 2);
    // Without eighths nothing completes a dotted quarter's beat.
    if (options.dottedQuarters !== true) spec.rhythms = withoutLength(spec.rhythms, DIVISIONS * 1.5);
  }
  if (options.syncopation === false) {
    // Every note where its length belongs: the rule levels 1-4 always follow.
    spec.syncopation = false;
    spec.syncopa = false;
    spec.metricPlacement = true;
  }
  if (options.triplets === false) spec.triplets = false;
  // Only where the level has a left hand to replace (level 1 writes one hand;
  // `unrealisable` says so rather than an empty staff).
  if (options.leftHand !== undefined && base.hands === 'both') {
    spec.leftHand = options.leftHand;
    spec.lhKey = LEVELS[LEFT_HAND_HOME[options.leftHand]].lhKey;
  }
  if (options.ledger === false) {
    spec.rhKey = { low: Math.max(spec.rhKey.low, 60), high: Math.min(spec.rhKey.high, 79) };
    spec.lhKey = { low: Math.max(spec.lhKey.low, 41), high: Math.min(spec.lhKey.high, 60) };
  }
  return spec;
}

/**
 * The promises C4b's controls add, each counted on the melody as written. The
 * key and the metre stay promised by `fifths` and `timeSig` themselves.
 */
type ControlPromise = 'ties' | 'dottedQuarters' | 'ledger' | 'leaps' | 'sixteenths';
const CONTROL_PROMISES: readonly ControlPromise[] = ['ties', 'dottedQuarters', 'ledger', 'leaps', 'sixteenths'];

/**
 * Which promises this phrase has to keep: in compound time the rhythmic two are
 * not asked, nor a dotted quarter.
 *
 * `underTune` (C4d, S29): where a moving left hand is asked for outright
 * (`leftHand` an Alberti, broken-chord or walking pattern, under a melody), the
 * melody strikes a note in every bar, because the pattern is a pattern *under a
 * tune* only in a bar where the tune plays (the `leftHandPattern` and
 * `walkingBass` detectors, `detect.ts`). A melody that ties into a bar it then
 * holds whole — level 3's 6/8 bar held for its length, reached by a tie — left
 * one bar with the pattern alone, and the phrase went out without the pattern
 * the control promised (the composed contract found it at 4.5).
 */
function promisesFor(options: SightReadingOptions, timeSig: TimeSig, twoHands: boolean): (PhrasePromise | ControlPromise | 'beyond' | 'underTune')[] {
  const compound = isCompoundTime(timeSig);
  const older = PROMISES.filter((promise) => {
    if (options[promise] !== true) return false;
    if (compound && (promise === 'syncopation' || promise === 'triplets')) return false;
    return true;
  });
  const added = CONTROL_PROMISES.filter((promise) => options[promise] === true && !(compound && promise === 'dottedQuarters'));
  const moving = twoHands && (options.leftHand === 'alberti' || options.leftHand === 'broken' || options.leftHand === 'walking');
  return [...older, ...added, ...(options.position === false ? (['beyond'] as const) : []), ...(moving ? (['underTune'] as const) : [])];
}

/** Steps, thirds and wider between consecutive sounded notes of one line, by scale step. */
function countIntervals(
  bars: readonly WriterNote[][],
  scale: readonly number[],
): { steps: number; skips: number; leaps: number } {
  let steps = 0;
  let skips = 0;
  let leaps = 0;
  let previous: number | null = null;
  for (const note of bars.flat()) {
    if (note.midi === null || note.tie === 'stop' || note.chord === true) continue;
    const here = scale.indexOf(note.midi);
    if (previous !== null && here >= 0) {
      const distance = Math.abs(here - previous);
      if (distance === 1) steps += 1;
      if (distance === 2) skips += 1;
      if (distance >= 3) leaps += 1;
    }
    previous = here >= 0 ? here : null;
  }
  return { steps, skips, leaps };
}

/**
 * What C4b's promises find in the written melody: the ties that survived their
 * closing (a tie whose next note became a rest is dropped), the dotted quarters
 * of simple time, the notes on a ledger line beyond middle C, the sixteenths,
 * and whether the line spans more than one five-finger position.
 */
function tallyMelody(
  bars: readonly WriterNote[][],
  onBassStaff: boolean,
  timeSig: TimeSig,
  eighthsWritten: boolean,
  tally: Tally,
): void {
  const sounded = bars.flat().filter((note) => note.midi !== null && note.chord !== true);
  tally.ties = sounded.filter((note) => note.tie === 'start').length;
  // A dotted quarter is read against the plain eighths it replaces, so where
  // the level writes eighths the phrase keeps a pair of them in one beat as
  // well — as `skips` asks for a step beside the third. Without it, a phrase
  // whose every eighth completes a dotted quarter loses the beamed pair its row
  // had in every phrase (the contract found it on 2.2's row at 2.4).
  const dotted = isCompoundTime(timeSig)
    ? 0
    : sounded.filter((note) => note.duration === DIVISIONS * 1.5 && note.tuplet === undefined).length;
  tally.dottedQuarters = dotted > 0 && (!eighthsWritten || eighthPairs(bars, timeSig) > 0) ? dotted : 0;
  // Treble: B below middle C and lower (middle C's own line is the landmark,
  // not the skill: `detect.ts`). Bass: D above middle C and higher; C sharp
  // above it is left out, as it may be written on middle C's line.
  tally.ledger = sounded.filter((note) => (onBassStaff ? (note.midi ?? 0) >= 62 : (note.midi ?? 99) <= 59)).length;
  tally.sixteenths = sounded.filter((note) => note.duration === DIVISIONS / 4 && note.tuplet === undefined).length;
  const pitches = sounded.map((note) => note.midi as number);
  tally.beyond = pitches.length > 0 && Math.max(...pitches) - Math.min(...pitches) > 7 ? 1 : 0;
}

/** Two sounded eighths inside one beat, the second straight after the first: a beamed pair. */
function eighthPairs(bars: readonly WriterNote[][], timeSig: TimeSig): number {
  const beat = feltBeat(timeSig);
  let pairs = 0;
  for (const bar of bars) {
    let offset = 0;
    let previous: number | null = null;
    for (const note of bar) {
      if (note.chord === true) continue;
      const here = offset;
      offset += note.duration;
      const eighth = note.midi !== null && note.duration === DIVISIONS / 2 && note.tuplet === undefined;
      if (eighth && previous !== null && previous + DIVISIONS / 2 === here && Math.floor(previous / beat) === Math.floor(here / beat)) {
        pairs += 1;
      }
      previous = eighth ? here : null;
    }
  }
  return pairs;
}

/**
 * The raised fourth that rises to the fifth (T37, `accidentals`).
 *
 * The chromatic note a Grade 1-2 reader meets first, and one that is spelled
 * right in every key the generator writes up to two accidentals: F sharp in
 * C, B natural in F, E natural in B flat, C sharp in G, G sharp in D. Only
 * where the next sounded note is the fifth a step above, and only as a
 * passing or neighbour note is written: short (a quarter or less), off the
 * bar's strong beats, never tied, and never in a bar whose left hand holds the
 * IV chord, whose root it would rub against; and approached by step. (A first
 * version allowed it on beat three, as a half note, and after a leap: F sharp
 * held for two beats over a C chord, and reached by a tritone from C, were the
 * first things the rendered page and the printed seeds showed.)
 */
function addAccidentals(
  rng: () => number,
  right: WriterNote[][],
  left: readonly WriterNote[][],
  scale: readonly number[],
  tonicIndex: number,
  lhScale: readonly number[],
  lhTonicIndex: number,
  divisionsPerBar: number,
): number {
  const sounded: { note: WriterNote; bar: number; offset: number }[] = [];
  right.forEach((notes, bar) => {
    let offset = 0;
    for (const note of notes) {
      if (note.midi !== null && note.chord !== true) sounded.push({ note, bar, offset });
      if (note.chord !== true) offset += note.duration;
    }
  });
  const degreeOf = (index: number, tonic: number): number => (((index - tonic) % 7) + 7) % 7;
  let raised = 0;
  for (let i = 0; i < sounded.length - 1; i += 1) {
    const here = sounded[i];
    const next = sounded[i + 1];
    if (!here || !next || here.note.midi === null || next.note.midi === null) continue;
    if (here.offset % (divisionsPerBar / 2) === 0 || here.note.duration > DIVISIONS) continue;
    if (here.note.tie !== undefined || next.note.tie === 'stop') continue;
    const index = scale.indexOf(here.note.midi);
    if (index < 0 || degreeOf(index, tonicIndex) !== 3) continue;
    if (scale.indexOf(next.note.midi) !== index + 1) continue;
    // Approached by step, as a passing note from below or a neighbour from the
    // fifth: raised after a leap it becomes a tritone from C to F sharp, which
    // the rendered page showed on the first try.
    const before = sounded[i - 1];
    const from = before?.note.midi === null || before === undefined ? -1 : scale.indexOf(before.note.midi);
    if (from < 0 || Math.abs(from - index) !== 1) continue;
    const bass = left[here.bar]?.find((note) => note.midi !== null && note.chord !== true);
    const bassIndex = bass === undefined || bass.midi === null ? -1 : lhScale.indexOf(bass.midi);
    if (bassIndex >= 0 && degreeOf(bassIndex, lhTonicIndex) === 3) continue;
    if (rng() >= 0.5) continue;
    here.note.midi += 1;
    raised += 1;
  }
  return raised;
}

/**
 * Generates an unseen exercise as MusicXML.
 *
 * The result is fed to the normal Score screen in Tempo mode, so nothing
 * downstream knows or cares that it was generated.
 *
 * A key or a metre given as a list is chosen by the seed first, from a stream
 * of its own; then the phrase is written, and written again from a derived
 * seed if it came out without something the options promise (T37). The first
 * draw uses the seed itself, so a phrase that already kept its promises is
 * the phrase the seed always wrote, and every redraw is as deterministic as
 * the first: the seed still names one phrase.
 */
export function generateSightReading(options: SightReadingOptions): SightReadingResult {
  const level = (Math.min(7, Math.max(1, Math.round(options.level))) || 1) as SightReadingLevel;
  const seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
  const choose = makeRng((seed ^ CHOICE_SALT) >>> 0);
  const wantedFifths = chooseOne(choose, options.fifths) ?? 0;
  const timeSig = chooseOne(choose, options.timeSig) ?? { beats: 4, beatType: 4 };
  const table = specFor(level, options);

  const fifths = Math.max(-table.maxFifths, Math.min(table.maxFifths, wantedFifths));
  // Held inside one hand position where the options ask (C4): the right
  // hand's range only; a left hand read alone gets its own position below.
  const positioned = options.position === true ? { ...table, rhKey: handPosition(fifths, 60) } : table;
  // A ledger line beyond middle C where the options ask (C4b): the right
  // hand's range reaches down to the A below middle C. Not inside one
  // position, which has none, and not for a left hand read alone (see
  // `unrealisable`).
  const ledgered = options.ledger === true && options.position !== true;
  const spec = ledgered
    ? { ...positioned, rhKey: { low: Math.min(positioned.rhKey.low, 57), high: positioned.rhKey.high } }
    : positioned;
  const bars = Math.max(1, Math.min(32, options.bars ?? 4));
  const bpm = options.bpm ?? 72;
  // Divisions are per quarter note, so 6/8 is six eighths = three quarters.
  const divisionsPerBar = (timeSig.beats * DIVISIONS * 4) / timeSig.beatType;
  const wantsLeft = options.hands !== 'R' && spec.hands === 'both';
  const promised = promisesFor(options, timeSig, wantsLeft && options.hands !== 'L');

  // A level with no left-hand part of its own (level 1) can still be read by
  // the left hand alone: the same melody, drawn in the left hand's five-finger
  // range and written on the bass staff, with the treble staff resting. That
  // is the reading lesson 1.3 asks for — the bass clef, C3 to G3, one finger
  // per key — and it costs no new music, only where the tune is put.
  const leftOnlyMelody = options.hands === 'L' && spec.leftHand === 'none';
  const empty = (): WriterNote[][] => Array.from({ length: bars }, () => []);
  const melodySpec = leftOnlyMelody
    ? { ...spec, rhKey: options.position === true ? handPosition(fifths, 48) : spec.lhKey }
    : spec;
  const melodyScale = scalePitches(fifths, melodySpec.rhKey.low, melodySpec.rhKey.high);

  let rightBars: WriterNote[][] = empty();
  let leftBars: WriterNote[][] = empty();
  for (let attempt = 0; attempt < PROMISE_ATTEMPTS; attempt += 1) {
    const rng = makeRng(attemptSeed(seed, attempt));
    const tally = emptyTally();
    // Drawn before either hand, and only where a level asks for it, so levels
    // 1-4 consume the same random numbers in the same order they always did.
    const harmony = spec.chordTones ? pickHarmony(rng, bars) : undefined;
    rightBars =
      options.hands === 'L' && (spec.leftHand !== 'none' || leftOnlyMelody)
        ? empty()
        : buildRightHand(rng, spec, fifths, bars, divisionsPerBar, harmony, timeSig, tally);
    leftBars = leftOnlyMelody
      ? buildRightHand(rng, melodySpec, fifths, bars, divisionsPerBar, harmony, timeSig, tally)
      : wantsLeft
        ? buildLeftHand(rng, spec, fifths, bars, divisionsPerBar, harmony)
        : empty();
    const melodyBars = leftOnlyMelody ? leftBars : rightBars;
    const intervals = countIntervals(melodyBars, melodyScale);
    tally.steps = intervals.steps;
    tally.skips = intervals.steps > 0 ? intervals.skips : 0;
    if (options.accidentals === true) {
      const lhScale = scalePitches(fifths, spec.lhKey.low, spec.lhKey.high);
      tally.accidentals = addAccidentals(
        rng,
        melodyBars,
        leftOnlyMelody ? empty() : leftBars,
        melodyScale,
        tonicIndexIn(melodyScale, fifths),
        lhScale,
        tonicIndexIn(lhScale, fifths),
        divisionsPerBar,
      );
    }
    tally.leaps = intervals.leaps;
    tallyMelody(melodyBars, leftOnlyMelody, timeSig, melodySpec.rhythms.includes(DIVISIONS / 2), tally);
    tally.underTune = melodyBars.every((bar) => bar.some((note) => note.midi !== null && note.chord !== true && note.tie !== 'stop')) ? 1 : 0;
    if (promised.every((promise) => tally[promise] > 0)) break;
  }

  // Beamed by the beat, once the phrase is settled: a dotted quarter in
  // compound time, a quarter otherwise.
  const beamBeat =
    timeSig.beatType === 8 && timeSig.beats % 3 === 0 ? DIVISIONS * 1.5 : (DIVISIONS * 4) / timeSig.beatType;
  beamLine(rightBars, beamBeat);
  beamLine(leftBars, beamBeat);

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

/**
 * Beams one line's notes by the beat (T37).
 *
 * Nothing was beamed, so every eighth carried its own flag: rung 2.2 teaches
 * that "the beaming is a kindness — it groups the notes into beats so your eye
 * can see where beat two starts", and its reading drill printed none; and a
 * 6/8 bar of flags does not show the two groups of three that *are* 6/8.
 * Notes shorter than a quarter that lie inside one beat are beamed together;
 * a triplet is beamed as its own group; a rest, or a note that reaches past the
 * beat, breaks the beam. A lone short note keeps its flag.
 */
function beamLine(bars: WriterNote[][], beat: number): void {
  for (const notes of bars) {
    let offset = 0;
    let group: WriterNote[] = [];
    let groupKey = '';
    let tupletGroup = 0;
    const close = (): void => {
      if (group.length >= 2) {
        group.forEach((note, i) => {
          note.beam = i === 0 ? 'begin' : i === group.length - 1 ? 'end' : 'continue';
        });
      }
      group = [];
      groupKey = '';
    };
    for (const note of notes) {
      // A chord's other notes hang from its first note's stem.
      if (note.chord === true) continue;
      const start = offset;
      offset += note.duration;
      if (note.tuplet?.at === 'start') tupletGroup += 1;
      const key = note.tuplet
        ? `t${String(tupletGroup)}`
        : Math.floor(start / beat) === Math.floor((offset - 1) / beat)
          ? `b${String(Math.floor(start / beat))}`
          : '';
      const beamable = note.midi !== null && note.duration < DIVISIONS && key !== '';
      if (!beamable || key !== groupKey) close();
      if (beamable) {
        group.push(note);
        groupKey = key;
      }
    }
    close();
  }
}

/** A metre written as `6/8`, or as `{ beats, beatType }`. */
function readTimeSig(value: unknown): TimeSig | undefined {
  if (typeof value === 'string') {
    const match = /^(\d+)\/(\d+)$/.exec(value.trim());
    if (!match) return undefined;
    const beats = Number(match[1]);
    const beatType = Number(match[2]);
    return beats > 0 && beatType > 0 ? { beats, beatType } : undefined;
  }
  if (typeof value === 'object' && value !== null) {
    const { beats, beatType } = value as Partial<TimeSig>;
    if (typeof beats === 'number' && typeof beatType === 'number') return { beats, beatType };
  }
  return undefined;
}

/**
 * The generator options a catalog row's `drill.params` ask for (T37).
 *
 * The one reader of those params, so the Score screen, the tests and anything
 * else that opens a sight-reading row turn the same row into the same options.
 * The Score screen passed `level`, `hands`, `bars` and the seed and nothing
 * else, so every phrase in the app was C major, 4/4 at 72: the key, the metre
 * and the tempo a row could ask for were never read, and the rungs that
 * promise keys, 6/8 or skips could not get them.
 *
 * - `level`, `bars`, `bpm`: numbers.
 * - `hands`: `right`, `left` or `both`.
 * - `fifths`: a number, or a list the seed chooses from.
 * - `timeSig`: `"6/8"`, or a list the seed chooses from.
 * - `skips`, `eighths`, `syncopation`, `triplets`, `accidentals`: `true` to
 *   promise the feature ({@link PROMISES}), `false` to keep it out (C4b).
 * - `position`: `true` to hold the melody inside one hand position (the
 *   reader's recipes, C4); `false` to promise it leaves one (C4b).
 * - `ties`, `dottedQuarters`, `ledger`, `leaps`, `sixteenths`: `true` or
 *   `false`, as the options say (C4b).
 * - `leftHand`: one of {@link LEFT_HAND_PATTERNS_BY_NAME}; anything else is
 *   not passed on.
 */
export function sightReadingOptionsFor(
  params: Readonly<Record<string, unknown>>,
  seed?: number,
): SightReadingOptions {
  const hands = params.hands === 'left' ? 'L' : params.hands === 'both' ? 'both' : 'R';
  const level = (typeof params.level === 'number' ? params.level : 1) as SightReadingLevel;
  const fifths = Array.isArray(params.fifths)
    ? (params.fifths as unknown[]).filter((value): value is number => typeof value === 'number')
    : typeof params.fifths === 'number'
      ? params.fifths
      : undefined;
  const timeSig = Array.isArray(params.timeSig)
    ? (params.timeSig as unknown[])
        .map(readTimeSig)
        .filter((value): value is TimeSig => value !== undefined)
    : readTimeSig(params.timeSig);
  // Both values of a tri-state control are passed on; anything else is absent.
  const controls: Partial<Record<PhrasePromise | ControlPromise | 'position', boolean>> = {};
  for (const name of [...PROMISES, ...CONTROL_PROMISES, 'position'] as const) {
    const value = params[name];
    if (value === true || value === false) controls[name] = value;
  }
  const leftHand = LEFT_HAND_PATTERNS_BY_NAME.find((pattern) => pattern === params.leftHand);
  return {
    level,
    hands,
    ...(typeof params.bars === 'number' ? { bars: params.bars } : {}),
    ...(fifths === undefined || (Array.isArray(fifths) && fifths.length === 0) ? {} : { fifths }),
    ...(timeSig === undefined || (Array.isArray(timeSig) && timeSig.length === 0) ? {} : { timeSig }),
    ...(typeof params.bpm === 'number' ? { bpm: params.bpm } : {}),
    ...controls,
    ...(leftHand === undefined ? {} : { leftHand }),
    ...(seed === undefined ? {} : { seed }),
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
  locks: readonly LabLock[];
}

/** The pickers a preset may fix, and therefore the ones a rung may hand back. */
export type LabLock = 'key' | 'progression' | 'leftHand' | 'rightHand' | 'bars';

/** Every name `unlock` may carry, for the router to check a hash against. */
export const LAB_LOCKS: readonly LabLock[] = [
  'key',
  'progression',
  'leftHand',
  'rightHand',
  'bars',
];

/** Every way round the lab opens on, for the same reason. */
export const LAB_BEDS: readonly LabBed[] = ['off', 'hold', 'tune'];

/**
 * What this visit locks: the preset's own list, less whatever the rung freed.
 *
 * A function rather than two lines inside `LabScreen`, because the rule is the
 * whole of T16 item 5 and a screen is an expensive place to test it. A rung
 * that frees a control its preset never locked is refused by `validate.py`
 * before it reaches here, so this only has to subtract.
 */
export function labLocksFor(
  preset: LabPreset | null,
  unlock: readonly string[] | undefined,
): Set<LabLock> {
  if (!preset) return new Set();
  const freed = new Set(unlock ?? []);
  return new Set(preset.locks.filter((lock) => !freed.has(lock)));
}

/**
 * Which way round this visit opens on: the rung's answer, then the preset's,
 * then the bed silent.
 *
 * The rung wins because a preset is shared — `blues-shuffle` serves ten rungs
 * and opens holding the chords, and `jam.5`'s lesson says *"comp through eight
 * choruses of it"*, which is the other way round (Entry 30 named it and left
 * it waiting for this field).
 */
export function labBedFor(preset: LabPreset | null, mode: LabBed | undefined): LabBed {
  return mode ?? preset?.bed ?? 'off';
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
    | 'plays'
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
    // One line for one control (T22). It was two — a *What the app plays* row
    // and a *Trading fours* row — and they were exclusive, so *Bed only* and
    // the trade row's *Off* were two chips for one state. The five choices are
    // now one row and one line, which is also the label, the paragraph and the
    // row of height `04` §0 R1 wanted back on a 342 px phone.
    id: 'plays',
    label: 'What the app plays',
    help: 'Bed only is bass and drums. Hold the chords adds the harmony underneath, so the tune is yours. Play the tune gives the app the right hand, so the chords are yours. Trading fours — 2 or 4 bars each — has it play that many and then leave you the same number to answer with, round and round.',
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
