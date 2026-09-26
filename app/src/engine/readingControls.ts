/**
 * The curriculum–generator contract's control map (C4b).
 *
 * For each reading demand vocabulary v0 names (`content/curriculum/vocabulary/
 * demands.json`), which sight-reading generator option writes it into a phrase
 * (`on`), which keeps it out (`off`), and whether a phrase of given options may
 * contain it at all (`mayWrite`); and, in `UNREALISABLE_AT`, every move the
 * reading curriculum can legally ask for at a core rung that the generator
 * cannot make there, with the reason.
 *
 * **Why the map is app code and not a field of the vocabulary** (the reviewer,
 * Part 8, the fourth message §4): the vocabulary is the ontology of musical
 * demands — a tie, a skip, a key signature — and the evidence attaches to
 * those. The generator's options are today's controls, one generator's way of
 * writing a demand. A later generator (D) can be unbundled, or a second one
 * added, by changing this file alone; nothing the evidence or the vocabulary
 * says moves. The vocabulary gained only each demand's musical `dimension`.
 *
 * The contract (`generatorContract.test.ts`, over the real generator and the
 * real detectors): at every core rung, for every demand the rung has taught,
 * the rung's reading row with the demand's `on` patch writes the demand into
 * every phrase, keeps the rung's promises, writes nothing a later rung
 * teaches, and brings nothing else the row did not already write but what
 * `brings` declares; `off` keeps the demand out on the same terms; and where
 * either cannot be done, `unrealisable(options)` (the generator's own reasons)
 * or `UNREALISABLE_AT` (a rung's promise) says so, and the test holds the set
 * of impossible moves to exactly that list.
 *
 * Keys are not ordered here: `key.signature`'s `on` is every key with a
 * signature the level writes, a set the seed chooses from (C4c words it).
 */
import { levelFacts, maxFifthsFor, type LeftHandPattern, type SightReadingOptions, type TimeSig } from './sightReading';

/** What a control changes: generator options, never the level, the length or the seed. */
export type ControlPatch = Omit<Partial<SightReadingOptions>, 'level' | 'bars' | 'seed' | 'bpm'>;

export interface ReadingControl {
  /** The generator option this demand is moved by, as C4c's reader names it; null where none. */
  option: keyof SightReadingOptions | null;
  /** The patch that writes the demand into every phrase; null where no option can. */
  on(options: SightReadingOptions): ControlPatch | null;
  /** The patch that keeps the demand out of every phrase; null where no option can. */
  off(options: SightReadingOptions): ControlPatch | null;
  /** Why `on` or `off` is null. */
  none?: { on?: string; off?: string };
  /** False only where no phrase of these options can contain the demand (what `heldToRung` reads). */
  mayWrite(options: SightReadingOptions): boolean;
  /**
   * Other demands turning it on may bring into a phrase that had none of them,
   * measured by the contract test and declared here so a reader can say what a
   * move brings (C4's `VALUE_DEMANDS` did this for its six dimensions).
   */
  brings?(options: SightReadingOptions): readonly string[];
}

// --- what a phrase of these options is written with ----------------------------

const MOVING: readonly LeftHandPattern[] = ['alberti', 'broken', 'walking'];

interface Shape {
  level: number;
  hands: 'R' | 'L' | 'both';
  /** Both hands, the left under the melody (level 2 and above). */
  twoHands: boolean;
  /** The left hand plays its own part (under a melody, or alone from level 2). */
  leftPart: boolean;
  leftHand: 'none' | LeftHandPattern;
  /** The melody's largest move, in scale steps, before ties and chord tones. */
  maxLeap: number;
  tiesAllowed: boolean;
  tieOnBeat: boolean;
  lengths: readonly number[];
  placed: boolean;
  chordTones: boolean;
  compoundAny: boolean;
  compoundAll: boolean;
  syncopation: 'figure' | 'opener' | 'none';
  triplets: boolean;
  keys: number[];
  rhLow: number;
  rhHigh: number;
  melodyInRight: boolean;
}

const metresOf = (options: SightReadingOptions): readonly TimeSig[] =>
  options.timeSig === undefined ? [] : Array.isArray(options.timeSig) ? (options.timeSig as readonly TimeSig[]) : [options.timeSig as TimeSig];
const compoundTime = (t: TimeSig): boolean => t.beatType === 8 && t.beats % 3 === 0;

function shapeOf(options: SightReadingOptions): Shape {
  const facts = levelFacts(options.level);
  const level = Math.min(7, Math.max(1, Math.round(options.level)));
  const hands = options.hands ?? 'both';
  const twoHands = hands === 'both' && facts.hands === 'both';
  const leftPart = twoHands || (hands === 'L' && facts.hands === 'both');
  const leftHand = facts.hands === 'both' ? (options.leftHand ?? facts.leftHand) : 'none';

  let maxLeap = facts.maxLeap;
  if (options.skips === true) maxLeap = Math.max(maxLeap, 2);
  if (options.leaps === true) maxLeap = Math.max(maxLeap, 3);
  if (options.leaps === false) maxLeap = Math.min(maxLeap, 2);
  if (options.skips === false) maxLeap = 1;

  let lengths = [...facts.lengths];
  const add = (l: number): void => {
    if (!lengths.includes(l)) lengths.push(l);
  };
  const drop = (l: number): void => {
    lengths = lengths.filter((x) => x !== l);
  };
  if (options.eighths === true) add(0.5);
  if (options.dottedQuarters === true) {
    add(1.5);
    if (options.eighths !== false) add(0.5);
  }
  if (options.dottedQuarters === false) drop(1.5);
  if (options.sixteenths === true) add(0.25);
  if (options.sixteenths === false) drop(0.25);
  if (options.eighths === false) {
    drop(0.5);
    if (options.dottedQuarters !== true) drop(1.5);
  }

  const placed = facts.metricPlacement || options.syncopation === false;
  const metres = metresOf(options);
  const compoundAny = metres.some(compoundTime);
  const compoundAll = metres.length > 0 && metres.every(compoundTime);
  const syncopation =
    options.syncopation === false
      ? 'none'
      : facts.metricPlacement
        ? options.syncopation === true
          ? 'figure'
          : 'none'
        : options.syncopation === true || facts.syncopation
          ? 'opener'
          : 'none';
  const fifths = options.fifths === undefined ? [0] : Array.isArray(options.fifths) ? [...(options.fifths as readonly number[])] : [options.fifths as number];
  const keys = fifths.map((k) => Math.max(-facts.maxFifths, Math.min(facts.maxFifths, k)));

  let rhLow = facts.rhRange.low;
  let rhHigh = facts.rhRange.high;
  if (options.position === true) {
    rhLow = 60;
    rhHigh = 78; // the highest a five-finger position from a tonic at or above middle C reaches
  } else if (options.ledger === true) {
    rhLow = Math.min(rhLow, 57);
  }
  if (options.ledger === false) {
    rhLow = Math.max(rhLow, 60);
    rhHigh = Math.min(rhHigh, 79);
  }
  return {
    level,
    hands,
    twoHands,
    leftPart,
    leftHand,
    maxLeap,
    tiesAllowed: options.ties === true || (options.ties !== false && facts.allowTies),
    tieOnBeat: options.ties !== undefined || options.syncopation === false,
    lengths,
    placed,
    chordTones: facts.chordTones,
    compoundAny,
    compoundAll,
    syncopation,
    triplets: options.triplets === true || (facts.triplets && options.triplets !== false),
    keys,
    rhLow,
    rhHigh,
    melodyInRight: hands !== 'L',
  };
}

/** The left hand's range when it plays its own part: the pattern's home level's (`sightReading.ts`), else the level's. */
function leftLow(s: Shape, options: SightReadingOptions): number {
  if (!s.leftPart) return 99;
  if (options.ledger === false) return 41;
  const home: Record<LeftHandPattern, number> = { whole: 2, chord: 4, alberti: 5, broken: 6, walking: 7 };
  const level = options.leftHand ? home[options.leftHand] : s.level;
  return [48, 48, 48, 41, 36, 36, 33][level - 1] ?? 48;
}

const simpleAny = (s: Shape): boolean => !s.compoundAll;

/** The shortest bar a phrase of these options may have, in quarter-note beats. */
function shortestBar(options: SightReadingOptions): number {
  const metres = metresOf(options);
  return Math.min(...(metres.length > 0 ? metres : [{ beats: 4, beatType: 4 }]).map((t) => (t.beats * 4) / t.beatType));
}

/**
 * What the left hand brings where a move adds it under a level-2-and-above
 * melody, measured: the bass staff, both hands at once, and the leaps its
 * roots make between I, IV and V (C4's `VALUE_DEMANDS` found the same).
 */
const LEFT_HAND_BRINGS = ['clef.bass', 'texture.hands-together', 'interval.leap'];

// --- the map ---------------------------------------------------------------------

const always = (patch: ControlPatch) => (): ControlPatch => patch;

export const READING_CONTROLS: Readonly<Record<string, ReadingControl>> = {
  'clef.bass': {
    option: 'hands',
    // Level 1 has no left-hand part: its melody moves to the bass staff.
    on: (o) => (levelFacts(o.level).hands === 'R' ? { hands: 'L' } : { hands: 'both' }),
    off: always({ hands: 'R' }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return s.hands === 'L' || s.twoHands;
    },
    brings: (o) => (shapeOf(o).twoHands ? LEFT_HAND_BRINGS.filter((d) => d !== 'clef.bass') : []),
  },
  'pitch.ledger': {
    option: 'ledger',
    on: always({ ledger: true }),
    off: always({ ledger: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      const right = s.melodyInRight && (s.rhLow < 60 || s.rhHigh >= 81);
      return right || leftLow(s, o) <= 40;
    },
  },
  'interval.step': {
    option: null,
    on: () => null,
    off: () => null,
    none: {
      on: 'Every phrase moves by step somewhere; there is nothing to turn on.',
      off: 'A phrase that never moves by step is not one the generator writes, nor one a reader needs.',
    },
    mayWrite: () => true,
  },
  'interval.skip': {
    option: 'skips',
    on: always({ skips: true }),
    off: always({ skips: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return s.maxLeap >= 2 || s.tiesAllowed || s.chordTones || (s.leftPart && MOVING.includes(s.leftHand as LeftHandPattern));
    },
  },
  'interval.leap': {
    option: 'leaps',
    on: always({ leaps: true }),
    off: always({ leaps: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return s.maxLeap >= 3 || (s.tiesAllowed && s.maxLeap >= 2) || s.chordTones || s.leftPart;
    },
  },
  'rhythm.eighths': {
    option: 'eighths',
    on: always({ eighths: true }),
    off: always({ eighths: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return (
        s.lengths.includes(0.5) ||
        (s.compoundAny && s.placed) ||
        s.syncopation !== 'none' ||
        (!s.placed && s.lengths.includes(1.5)) ||
        (s.leftPart && s.leftHand === 'alberti')
      );
    },
  },
  'rhythm.shorter-than-quarter': {
    option: 'eighths',
    on: always({ eighths: true }),
    off: always({ eighths: false, triplets: false, sixteenths: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return READING_CONTROLS['rhythm.eighths']?.mayWrite(o) === true || s.lengths.includes(0.25) || (s.triplets && simpleAny(s));
    },
  },
  'rhythm.sixteenths': {
    option: 'sixteenths',
    on: always({ sixteenths: true }),
    off: always({ sixteenths: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return s.lengths.includes(0.25) && !(s.compoundAll && s.placed);
    },
  },
  'rhythm.dotted-quarter': {
    option: 'dottedQuarters',
    on: always({ dottedQuarters: true }),
    off: always({ dottedQuarters: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return s.lengths.includes(1.5) && simpleAny(s);
    },
  },
  'rhythm.ties': {
    option: 'ties',
    on: always({ ties: true }),
    off: always({ ties: false }),
    mayWrite: (o) => shapeOf(o).tiesAllowed && (o.bars ?? 4) >= 2,
    // The tie's closing note is set to the tied pitch after the melody has
    // already moved on, so the note after it can be twice the melody's widest
    // move away: a leap from a level whose moves are thirds. A fault of the
    // tie's closing (D's), declared here rather than fixed (C4b is not D).
    brings: (o) => (shapeOf(o).maxLeap >= 2 ? ['interval.leap'] : ['interval.skip']),
  },
  'rhythm.syncopation': {
    option: 'syncopation',
    on: always({ syncopation: true }),
    off: always({ syncopation: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return (s.syncopation === 'figure' && simpleAny(s)) || !s.placed || (s.tiesAllowed && !s.tieOnBeat);
    },
  },
  'rhythm.triplets': {
    option: 'triplets',
    on: always({ triplets: true }),
    off: always({ triplets: false }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return s.triplets && simpleAny(s);
    },
  },
  'metre.compound': {
    option: 'timeSig',
    on: always({ timeSig: { beats: 6, beatType: 8 } }),
    off: always({ timeSig: { beats: 4, beatType: 4 } }),
    mayWrite: (o) => shapeOf(o).compoundAny,
  },
  'key.signature': {
    option: 'fifths',
    // Every key with a signature the level writes, sharps and flats alike:
    // a set the seed chooses from, never a ladder (the brief's decision 4).
    on: (o) => {
      const widest = Math.max(1, maxFifthsFor(o.level));
      const keys: number[] = [];
      for (let k = 1; k <= widest; k += 1) keys.push(k, -k);
      return { fifths: keys };
    },
    off: always({ fifths: 0 }),
    mayWrite: (o) => shapeOf(o).keys.some((k) => k !== 0),
  },
  'pitch.chromatic': {
    option: 'accidentals',
    on: always({ accidentals: true }),
    off: always({ accidentals: false }),
    mayWrite: (o) => o.accidentals === true,
  },
  'range.beyond-position': {
    option: 'position',
    on: always({ position: false }),
    off: always({ position: true }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      const right = s.melodyInRight && s.level >= 2 && o.position !== true;
      const left = s.leftPart && s.leftHand !== 'whole' && s.leftHand !== 'none';
      return right || left;
    },
  },
  'texture.hands-together': {
    option: 'hands',
    on: always({ hands: 'both' }),
    off: always({ hands: 'R' }),
    mayWrite: (o) => shapeOf(o).twoHands,
    brings: (o) => (shapeOf(o).twoHands ? LEFT_HAND_BRINGS.filter((d) => d !== 'texture.hands-together') : []),
  },
  'texture.left-hand-pattern': {
    option: 'leftHand',
    // The broken chord in quarters: "the same shape slowed to quarters, which
    // is how it is first met" (`sightReading.ts`), and one of the two 3.6
    // teaches; where a phrase may be in compound time, the Alberti in eighths,
    // the other one, since a pattern in quarters crosses the dotted-quarter beat.
    on: (o) => ({ hands: 'both', leftHand: shapeOf(o).compoundAny ? 'alberti' : 'broken' }),
    off: always({ leftHand: 'whole' }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      return s.twoHands && MOVING.includes(s.leftHand as LeftHandPattern);
    },
    // Built from the C two octaves below middle C, on ledger lines below the
    // bass staff; and where it adds the left hand, what the left hand brings.
    brings: () => ['pitch.ledger', ...LEFT_HAND_BRINGS],
  },
  'texture.walking-bass': {
    option: 'leftHand',
    on: always({ hands: 'both', leftHand: 'walking' }),
    off: always({ leftHand: 'broken' }),
    mayWrite: (o) => {
      const s = shapeOf(o);
      // A broken chord in a bar of three quarters or fewer never comes back to
      // its fifth, which is what the walking-bass detector reads as a walk.
      return s.twoHands && (s.leftHand === 'walking' || (s.leftHand === 'broken' && shortestBar(o) <= 3));
    },
    brings: () => ['pitch.ledger', ...LEFT_HAND_BRINGS],
  },
};

/** The options with a demand turned on, or null where no option writes it. */
export function withDemand(options: SightReadingOptions, demand: string): SightReadingOptions | null {
  const patch = READING_CONTROLS[demand]?.on(options);
  return patch ? { ...options, ...patch } : null;
}

/** The options with a demand kept out, or null where no option can. */
export function withoutDemand(options: SightReadingOptions, demand: string): SightReadingOptions | null {
  const patch = READING_CONTROLS[demand]?.off(options);
  return patch ? { ...options, ...patch } : null;
}

/**
 * The options held to what a rung has taught (the contract's "untaught
 * demands are absent"): every demand the rung has not taught that a phrase of
 * these options may contain is turned off. The rest are left exactly as they
 * are, so a row whose recipe writes nothing untaught is unchanged.
 *
 * S16 is its one case today: `sight-reading-2-right` sits on 2.2 and on 2.5,
 * and its level-2 range leaves C position, which 2.5 teaches; at 2.2 this holds
 * it inside the position (`position: true`), at 2.5 it leaves the row alone.
 * The app asks for this shape once the reader's one writer of a phrase
 * (`readingOptions`, `session.ts`, C4c) calls it with the route's rung.
 */
export function heldToRung(options: SightReadingOptions, taught: (demand: string) => boolean): SightReadingOptions {
  let held = { ...options };
  for (const [demand, control] of Object.entries(READING_CONTROLS)) {
    if (taught(demand) || !control.mayWrite(held)) continue;
    const patch = control.off(held);
    if (patch) held = { ...held, ...patch };
  }
  return held;
}

// --- the moves the curriculum can ask for and the generator cannot make ---------

export interface Unrealisable {
  /** The core rungs at which the reader's row cannot make the move. */
  rungs: readonly string[];
  demand: string;
  direction: 'on' | 'off';
  /**
   * Whose limit: `generator` — `unrealisable(options)` gives this reason;
   * `promise` — the rung's row can write it, and doing so breaks a promise the
   * rung or the row makes (named in the reason); `none` — no option moves the
   * demand at all.
   */
  kind: 'generator' | 'promise' | 'none';
  reason: string;
}

/** The core rungs, grouped by the reading row the reader offers there (`readingOffer`, no reads). */
const LEFT_ROW_RUNGS = ['1.3', '1.4'];
const LEVEL_1_RUNGS = ['1.5', '2.1'];
const RIGHT_ROW_RUNGS = ['2.2', '2.3', '2.4', '2.5', '3.1', '3.2', '3.3'];
const TWO_HAND_ROW_RUNGS = ['3.4', '3.5', '3.6', '4.1', '4.2', '4.3', '4.4'];
const LEVEL_3_RUNGS = ['4.5', '4.6', '4.7'];

const TIE_CLOSING_THIRD =
  'A tie’s closing note is set to the tied pitch after the melody has moved on, so the note after it can be a third away.';
const TIE_CLOSING_LEAP =
  'A tie’s closing note is set to the tied pitch after the melody has moved on, so the note after it can be a fourth or wider away.';
const COMPOUND_FIGURES =
  'Compound time at levels 1–4 is written in its three first figures, all of dotted quarters, quarters and eighths.';

/**
 * Every move the reading curriculum can ask for at a core rung that the
 * generator does not make there, measured by `generatorContract.test.ts`
 * (twelve seeds a move; the test holds this list to exactly the undoable set,
 * with these reasons). Everything not listed is made: the demand in every
 * phrase asked, the promises kept, nothing untaught, nothing else new but what
 * the control `brings`. The table, rung by rung, is in `05` §8.
 */
export const UNREALISABLE_AT: readonly Unrealisable[] = [
  {
    rungs: [...LEFT_ROW_RUNGS, ...LEVEL_1_RUNGS, ...RIGHT_ROW_RUNGS, ...TWO_HAND_ROW_RUNGS, ...LEVEL_3_RUNGS],
    demand: 'interval.step',
    direction: 'off',
    kind: 'none',
    reason: 'A phrase that never moves by step is not one the generator writes, nor one a reader needs.',
  },
  {
    rungs: LEVEL_1_RUNGS,
    demand: 'interval.leap',
    direction: 'on',
    kind: 'promise',
    reason:
      '1.5 teaches the leap in its song, but its reading drill promises "only steps and skips" ("every interval is a 2nd or a 3rd"); a leap there breaks it.',
  },
  {
    rungs: ['2.1'],
    demand: 'texture.hands-together',
    direction: 'on',
    kind: 'generator',
    reason: 'Level 1 writes one hand at a time; both hands start at level 2.',
  },
  {
    rungs: TWO_HAND_ROW_RUNGS,
    demand: 'interval.leap',
    direction: 'off',
    kind: 'generator',
    reason: 'The left hand’s roots move between I, IV and V, by fourths and fifths.',
  },
  { rungs: LEVEL_3_RUNGS, demand: 'interval.skip', direction: 'off', kind: 'generator', reason: TIE_CLOSING_THIRD },
  { rungs: LEVEL_3_RUNGS, demand: 'interval.leap', direction: 'off', kind: 'generator', reason: TIE_CLOSING_LEAP },
  { rungs: LEVEL_3_RUNGS, demand: 'rhythm.eighths', direction: 'off', kind: 'generator', reason: COMPOUND_FIGURES },
  { rungs: LEVEL_3_RUNGS, demand: 'rhythm.shorter-than-quarter', direction: 'off', kind: 'generator', reason: COMPOUND_FIGURES },
  {
    rungs: LEVEL_3_RUNGS,
    demand: 'metre.compound',
    direction: 'on',
    kind: 'generator',
    reason: 'A phrase in compound time is not asked for syncopation or triplets: one new metre is enough to read (T37).',
  },
];
