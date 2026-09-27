// The sight-reading phrase's soft qualities, and the hard constraints the
// scorer never sees past (D1; Part 15 §9–§12, G20, S7, S18, S26).
//
// The generator (`sightReading.ts`) writes a phrase that keeps its hard
// constraints — what the rung promises, nothing untaught, the range, the
// metre, the key — by drawing it again from a derived seed until it does.
// Those phrases were legal and still stopped rather than arrived: the last
// note landed anywhere, the line wandered or rocked between two notes. From
// version 2 the generator keeps drawing after the first valid phrase, scores
// every valid candidate here and keeps the best, so the seed still names one
// phrase and the phrase is chosen for its shape.
//
// Split from the generator for ownership (G13), not size: the generator
// realises a phrase, this module judges one. Every part is a pure function of
// a phrase, unit-tested on phrases built to pass and to fail it
// (`sightReadingScore.test.ts`), and read by the distribution suite over the
// phrases the generator writes (`sightReadingDistribution.test.ts`), so the
// parts are one definition, not two.
//
// No part is a template. A phrase is rewarded for arriving, for one contour
// per four bars, for a recurring cell, for rests that breathe, for agreeing
// with its left hand and for leaps it recovers from; `A A' B A''` is one form
// the motif part recognises among many, never one it asks for.

import { DIVISIONS } from './musicXmlWriter';

/** A time signature, as the generator takes it. */
export interface Metre {
  beats: number;
  beatType: number;
}

/** One written note or rest of a line, as the generator or a MusicXML reader has it. */
export interface WrittenNote {
  /** MIDI pitch, or null for a rest. */
  midi: number | null;
  /** Divisions (a quarter is {@link DIVISIONS}). */
  duration: number;
  tie?: 'start' | 'stop' | 'both';
  tuplet?: unknown;
  /** A chord member hanging from the note before it: not a new event. */
  chord?: boolean;
}

/** One written note or rest of the melody, placed in its bar. */
export interface PhraseNote {
  /** 0-based. */
  bar: number;
  /** Divisions from the start of the bar. */
  at: number;
  duration: number;
  midi: number | null;
  tie?: 'start' | 'stop' | 'both';
  tuplet: boolean;
  /**
   * The eighth rest that opens a syncopated bar (levels 5–7): the device the
   * level is about, not a breath. The generator never writes a rest of its own
   * choosing on a bar's first note, so a rest at a bar's start is this one.
   */
  designed: boolean;
}

/** What the parts read: the melody as written, the harmony under it, and the phrase's rules. */
export interface PhraseModel {
  level: number;
  /** Sharps positive, flats negative; major keys (the generator writes no other). */
  fifths: number;
  metre: Metre;
  bars: number;
  melody: readonly PhraseNote[];
  /** Per bar, the chord under it as a scale degree from the tonic (0 = I), or null where no left hand gives one. */
  harmony: readonly (number | null)[];
  /** The largest melodic interval the phrase's options allow, in scale steps. */
  maxLeap: number;
  /** Whether the phrase's level places rests of its own (levels 3–7): the rest part is scored only then. */
  restsAllowed: boolean;
}

/** One sounded event of the melody: a note with its tie chain merged. */
export interface SoundedEvent {
  bar: number;
  at: number;
  /** Divisions from the start of the phrase. */
  onset: number;
  /** The whole length sounded, tied continuations included. */
  duration: number;
  midi: number;
  /** Scale steps from the tonic (a raised degree reads as the degree it raises). */
  step: number;
  /** Held over a bar line by a tie: the event took in at least one tied continuation. */
  tiedOver: boolean;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function tonicPitchClass(fifths: number): number {
  return (((fifths * 7) % 12) + 12) % 12;
}

/** Scale steps from C-minus-one's tonic: a diatonic position, so a third is 2 whatever its semitones. */
export function scaleStep(midi: number, fifths: number): number {
  const relative = midi - tonicPitchClass(fifths);
  const octave = Math.floor(relative / 12);
  const pitchClass = ((relative % 12) + 12) % 12;
  let degree = MAJOR.indexOf(pitchClass);
  // A raised degree (the generator's raised fourth) is read as the degree it raises.
  if (degree < 0) degree = MAJOR.indexOf(pitchClass - 1);
  return octave * 7 + degree;
}

/** The scale degree, 0 (tonic) to 6. */
export function degreeOf(midi: number, fifths: number): number {
  return ((scaleStep(midi, fifths) % 7) + 7) % 7;
}

/** Root, third and fifth of the chord on a scale degree. */
function chordTones(degree: number): Set<number> {
  return new Set([degree % 7, (degree + 2) % 7, (degree + 4) % 7]);
}

/** Compound time: beats of three eighths (6/8, 9/8, 12/8). */
export function isCompound(metre: Metre): boolean {
  return metre.beatType === 8 && metre.beats % 3 === 0;
}

/** Divisions in one bar. */
export function barLength(metre: Metre): number {
  return (metre.beats * DIVISIONS * 4) / metre.beatType;
}

/** The beat a reader counts: a dotted quarter in compound time, else the beat unit (the generator's `feltBeat`). */
export function feltBeatOf(metre: Metre): number {
  return isCompound(metre) ? DIVISIONS * 1.5 : (DIVISIONS * 4) / metre.beatType;
}

/**
 * The length a final note has to hold to be heard as an arrival.
 *
 * The felt beat, except in an irregular metre of eighths (5/8, 7/8), where the
 * felt beats are groups of two and three eighths and one eighth is only a
 * subdivision: there it is the shorter group, a quarter. No shipped row asks
 * for such a metre; a teacher's reading of 7/8 is 2+2+3, not seven beats.
 */
export function arrivalBeat(metre: Metre): number {
  if (metre.beatType >= 8 && !isCompound(metre)) return Math.max(feltBeatOf(metre), DIVISIONS);
  return feltBeatOf(metre);
}

/** The bar's strong beats: the downbeat, and the half bar where a bar has four felt beats (4/4, 12/8). */
export function strongOffsets(metre: Metre): number[] {
  const bar = barLength(metre);
  const beat = feltBeatOf(metre);
  return Math.round(bar / beat) === 4 ? [0, bar / 2] : [0];
}

// --- building the model ---------------------------------------------------------

/** The melody's written notes placed in their bars, chord members left out. */
export function placeMelody(bars: readonly (readonly WrittenNote[])[]): PhraseNote[] {
  const out: PhraseNote[] = [];
  bars.forEach((notes, bar) => {
    let at = 0;
    for (const note of notes) {
      if (note.chord === true) continue;
      out.push({
        bar,
        at,
        duration: note.duration,
        midi: note.midi,
        ...(note.tie ? { tie: note.tie } : {}),
        tuplet: note.tuplet !== undefined && note.tuplet !== null && note.tuplet !== false,
        designed: note.midi === null && at === 0,
      });
      at += note.duration;
    }
  });
  return out;
}

/** Each bar's chord from the left hand: the scale degree of its first note (the root, in every pattern the generator writes). */
export function harmonyFromLeftHand(bars: readonly (readonly WrittenNote[])[], fifths: number, count: number): (number | null)[] {
  return Array.from({ length: count }, (_, bar) => {
    const root = bars[bar]?.find((note) => note.midi !== null && note.chord !== true);
    return root === undefined || root.midi === null ? null : degreeOf(root.midi, fifths);
  });
}

/** A phrase to score, from the lines as written. */
export function phraseModel(input: {
  level: number;
  fifths: number;
  metre: Metre;
  melody: readonly (readonly WrittenNote[])[];
  left?: readonly (readonly WrittenNote[])[] | null;
  maxLeap: number;
  restsAllowed: boolean;
}): PhraseModel {
  const bars = input.melody.length;
  return {
    level: input.level,
    fifths: input.fifths,
    metre: input.metre,
    bars,
    melody: placeMelody(input.melody),
    harmony: input.left ? harmonyFromLeftHand(input.left, input.fifths, bars) : Array.from({ length: bars }, () => null),
    maxLeap: input.maxLeap,
    restsAllowed: input.restsAllowed,
  };
}

/** Each phrase's sounded events, worked out once: every part reads them, sixteen candidates a phrase. */
const SOUNDED = new WeakMap<PhraseModel, readonly SoundedEvent[]>();

/** The melody's sounded events, each tie chain one event. */
export function sounded(p: PhraseModel): readonly SoundedEvent[] {
  const known = SOUNDED.get(p);
  if (known) return known;
  const events = soundedEvents(p);
  SOUNDED.set(p, events);
  return events;
}

function soundedEvents(p: PhraseModel): SoundedEvent[] {
  const bar = barLength(p.metre);
  const out: SoundedEvent[] = [];
  let open: SoundedEvent | null = null;
  for (const note of p.melody) {
    if (note.midi === null) {
      open = null;
      continue;
    }
    const continues = note.tie === 'stop' || note.tie === 'both';
    if (continues && open !== null && open.midi === note.midi) {
      open.duration += note.duration;
      open.tiedOver = true;
      if (note.tie === 'stop') open = null;
      continue;
    }
    const event: SoundedEvent = {
      bar: note.bar,
      at: note.at,
      onset: note.bar * bar + note.at,
      duration: note.duration,
      midi: note.midi,
      step: scaleStep(note.midi, p.fifths),
      tiedOver: false,
    };
    out.push(event);
    open = note.tie === 'start' || note.tie === 'both' ? event : null;
  }
  return out;
}

// --- the parts ---------------------------------------------------------------------

/**
 * A beginning a reader can take hold of: the first note is the tonic or a
 * chord tone of bar 1's harmony (half), and it is struck on the downbeat
 * (half). The walk always starts on the tonic, so the first half holds by
 * construction and guards against a regression; the second tells a phrase
 * that opens on its beat from one that opens behind a syncopation rest
 * (levels 5–7), which is harder to take hold of at sight.
 */
export function beginning(p: PhraseModel): number | undefined {
  const first = sounded(p)[0];
  if (!first) return undefined;
  const tone = chordTones(p.harmony[0] ?? 0).has(degreeOf(first.midi, p.fifths)) ? 0.5 : 0;
  const onTheBeat = first.bar === 0 && first.at === 0 ? 0.5 : 0;
  return tone + onTheBeat;
}

/** The last sounded event, where it begins inside the last bar; undefined where the last bar strikes nothing. */
function finalEvent(p: PhraseModel): SoundedEvent | undefined {
  const events = sounded(p);
  const last = events[events.length - 1];
  return last !== undefined && last.bar === p.bars - 1 ? last : undefined;
}

/**
 * The arrival rule (the reviewer's wording, 7ab175a finding 6): the final
 * event begins on the last bar's felt beat 1, or it begins in the last bar and
 * sustains at least one felt beat. Never "a long note somewhere in the last
 * bar": only the final event counts, and a note tied into the last bar from
 * the one before did not begin there.
 */
export function arrives(p: PhraseModel): boolean {
  const final = finalEvent(p);
  if (!final) return false;
  return final.at === 0 || final.duration >= arrivalBeat(p.metre);
}

/** The final event begins on the last bar's felt beat 1: the stronger arrival. */
export function landsOnBeatOne(p: PhraseModel): boolean {
  return finalEvent(p)?.at === 0;
}

/**
 * The final event arrives on a strong beat: the last bar's downbeat, or its
 * half bar in a bar of four felt beats, held at least a felt beat. What tells
 * level 1's endings apart, where every note is a beat or longer and so every
 * phrase arrives by the rule: a whole note, or a half note from beat three,
 * against a quarter on beat four.
 */
export function arrivesOnStrongBeat(p: PhraseModel): boolean {
  const final = finalEvent(p);
  if (!final) return false;
  return final.at === 0 || (strongOffsets(p.metre).includes(final.at) && final.duration >= arrivalBeat(p.metre));
}

/** The final note is the tonic. */
export function endsOnTonic(p: PhraseModel): boolean {
  const events = sounded(p);
  const last = events[events.length - 1];
  return last !== undefined && degreeOf(last.midi, p.fifths) === 0;
}

/**
 * How well the phrase arrives, 0–1.
 *
 * Rhythm first, because the fault this answers is phrases that stop: the
 * final event on the last bar's downbeat is 1; held a felt beat or more from
 * the half bar's strong beat 0.9, from another beat 0.7, from off the beat
 * 0.5 (the rule above holds for all three); shorter than a beat, 0. Then the
 * close: the tonic 1, the third or fifth of I a half. Three quarters rhythm,
 * a quarter close. From level 5 the approach as well (the brief): into the
 * tonic or the fifth by step, or from a chord tone of the final harmony —
 * seven tenths rhythm, fifteen hundredths each close and approach. The walk
 * already heads for the tonic, so the close mostly tells apart the phrases a
 * rest or a tie stopped short of it.
 */
export function arrival(p: PhraseModel): number | undefined {
  const events = sounded(p);
  const last = events[events.length - 1];
  if (!last) return undefined;
  const final = finalEvent(p);
  let rhythm = 0;
  if (final) {
    if (final.at === 0) rhythm = 1;
    else if (final.duration >= arrivalBeat(p.metre)) {
      if (strongOffsets(p.metre).includes(final.at)) rhythm = 0.9;
      else if (final.at % feltBeatOf(p.metre) === 0) rhythm = 0.7;
      else rhythm = 0.5;
    }
  }
  const degree = degreeOf(last.midi, p.fifths);
  const close = degree === 0 ? 1 : degree === 2 || degree === 4 ? 0.5 : 0;
  if (p.level < 5) return 0.75 * rhythm + 0.25 * close;
  const before = events[events.length - 2];
  const intoTonicOrFifth = degree === 0 || degree === 4;
  const fromStep = before !== undefined && Math.abs(last.step - before.step) === 1;
  const fromChordTone = before !== undefined && chordTones(p.harmony[p.bars - 1] ?? 0).has(degreeOf(before.midi, p.fifths));
  const approach = intoTonicOrFifth && (fromStep || fromChordTone) ? 1 : 0;
  return 0.7 * rhythm + 0.15 * close + 0.15 * approach;
}

/** A four-bar unit's line, as a reader sees it. */
export type ContourShape = 'ascent' | 'descent' | 'arch' | 'valley' | 'flat' | 'wandering';

/** A turn counts only once the line has come back a third from where it turned: a neighbour note is not a turn. */
const TURN = 2;

/** Significant turns in a line of scale steps (a zigzag with a third's hysteresis), and the first direction taken. */
export function turnsOf(steps: readonly number[]): { turns: number; first: 1 | -1 | 0 } {
  const start = steps[0];
  if (start === undefined) return { turns: 0, first: 0 };
  let direction: 1 | -1 | 0 = 0;
  let first: 1 | -1 | 0 = 0;
  let extreme = start;
  let low = start;
  let high = start;
  let turns = 0;
  for (const step of steps.slice(1)) {
    if (direction === 0) {
      low = Math.min(low, step);
      high = Math.max(high, step);
      if (step - low >= TURN) {
        direction = 1;
        extreme = step;
      } else if (high - step >= TURN) {
        direction = -1;
        extreme = step;
      }
      first = direction;
      continue;
    }
    if (direction === 1) {
      if (step > extreme) extreme = step;
      else if (extreme - step >= TURN) {
        turns += 1;
        direction = -1;
        extreme = step;
      }
    } else if (step < extreme) extreme = step;
    else if (step - extreme >= TURN) {
      turns += 1;
      direction = 1;
      extreme = step;
    }
  }
  return { turns, first };
}

/**
 * The line a reader follows, one pitch per felt beat: the note sounding on
 * each beat (struck there or held into it), rests left out. The contour is
 * read on this, not on every note, because a reader hears the line on the
 * beats: a broken-chord figure inside a beat, or an eighth that steps away and
 * back, is figuration and not a change of direction (level 5's eighths would
 * otherwise "turn" on half their notes while the line itself rose).
 */
export function beatLine(p: PhraseModel, unit?: number): number[] {
  const events = sounded(p);
  const bar = barLength(p.metre);
  const beat = feltBeatOf(p.metre);
  const out: number[] = [];
  for (let b = 0; b < p.bars; b += 1) {
    if (unit !== undefined && Math.floor(b / 4) !== unit) continue;
    for (let t = 0; t < bar; t += beat) {
      const time = b * bar + t;
      const here = events.find((e) => e.onset <= time && time < e.onset + e.duration);
      if (here) out.push(here.step);
    }
  }
  return out;
}

/** The contour of each four-bar unit (a phrase shorter than four bars is one unit), read on the beats. */
export function contourShapes(p: PhraseModel): ContourShape[] {
  const units = Math.max(1, Math.ceil(p.bars / 4));
  return Array.from({ length: units }, (_, unit) => {
    const steps = beatLine(p, unit);
    if (steps.length === 0) return 'flat';
    if (Math.max(...steps) - Math.min(...steps) < TURN) return 'flat';
    const { turns, first } = turnsOf(steps);
    if (turns === 0) return (steps[steps.length - 1] ?? 0) >= (steps[0] ?? 0) ? 'ascent' : 'descent';
    if (turns === 1) return first === 1 ? 'arch' : 'valley';
    return 'wandering';
  });
}

/** One contour per four bars: an arch, a valley, an ascent or a descent, never flat or wandering. */
export function oneContour(p: PhraseModel): boolean {
  return contourShapes(p).every((shape) => shape === 'ascent' || shape === 'descent' || shape === 'arch' || shape === 'valley');
}

/** The longest run of notes rocking between two pitches (a b a b …). */
export function longestOscillation(p: PhraseModel): number {
  const midis = sounded(p).map((e) => e.midi);
  let longest = Math.min(midis.length, 1);
  let run = 1;
  for (let i = 1; i < midis.length; i += 1) {
    const here = midis[i] as number;
    const before = midis[i - 1] as number;
    if (here === before) {
      run = 1;
      continue;
    }
    run = i >= 2 && midis[i - 2] === here ? run + 1 : 2;
    longest = Math.max(longest, run);
  }
  return longest;
}

/** Rocking between two notes for five notes or more (a b a b a): a drill, not a line. */
export function oscillating(p: PhraseModel): boolean {
  return longestOscillation(p) >= 5;
}

/** The share of changes of direction between consecutive moves: a random walk turns on about half. */
export function turnRate(p: PhraseModel): number {
  const steps = sounded(p).map((e) => e.step);
  const moves: number[] = [];
  for (let i = 1; i < steps.length; i += 1) {
    const move = (steps[i] as number) - (steps[i - 1] as number);
    if (move !== 0) moves.push(Math.sign(move));
  }
  if (moves.length < 2) return 0;
  let changes = 0;
  for (let i = 1; i < moves.length; i += 1) if (moves[i] !== moves[i - 1]) changes += 1;
  return changes / (moves.length - 1);
}

/** The longest run of one pitch struck again and again (a tie is one note held, not struck). */
export function longestRepeat(p: PhraseModel): number {
  const midis = sounded(p).map((e) => e.midi);
  let longest = Math.min(midis.length, 1);
  let run = 1;
  for (let i = 1; i < midis.length; i += 1) {
    run = midis[i] === midis[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

/**
 * One contour, 0–1.
 *
 * The shape, three quarters: each four-bar unit an arch, a valley, an ascent
 * or a descent (1), two turns (0.4), a flat unit that never moves a third
 * (0.2), three or more turns (0). Turning on more than half the moves (a random
 * walk's rate is about half), a quarter. Then two degenerate lines, each a
 * factor on the whole: rocking between two notes beyond four (a fifth note
 * costs 0.19, eight notes 0.75), and one pitch struck more than three times
 * running (a fourth strike costs 0.125, seven 0.5) — a line that sits on one
 * note, which the range's floor makes of the walk (level 2's C held for bars;
 * the reader's read, Entry 94), is Part 15's degeneracy, not a contour.
 */
export function contour(p: PhraseModel): number | undefined {
  const events = sounded(p);
  if (events.length < 2) return undefined;
  const units = contourShapes(p).map((shape, unit): number => {
    if (shape === 'flat') return 0.2;
    if (shape !== 'wandering') return 1;
    return turnsOf(beatLine(p, unit)).turns === 2 ? 0.4 : 0;
  });
  const shape = units.reduce((a, b) => a + b, 0) / units.length;
  const rocking = Math.min(1, Math.max(0, (longestOscillation(p) - 4) / 4));
  const sitting = Math.min(1, Math.max(0, (longestRepeat(p) - 3) / 4));
  const random = Math.min(1, Math.max(0, (turnRate(p) - 0.5) / 0.5));
  return (0.75 * shape + 0.25 * (1 - random)) * (1 - 0.75 * rocking) * (1 - 0.5 * sitting);
}

/** Each bar's rhythm as written: where each note or rest starts and how long it is. */
function barRhythm(p: PhraseModel, bar: number): string {
  return p.melody
    .filter((n) => n.bar === bar)
    .map((n) => `${String(n.at)}:${String(n.duration)}${n.midi === null ? 'r' : ''}${n.tuplet ? 't' : ''}`)
    .join(' ');
}

function barPitches(p: PhraseModel, bar: number): string {
  return p.melody
    .filter((n) => n.bar === bar)
    .map((n) => (n.midi === null ? '-' : String(n.midi)))
    .join(' ');
}

/** Scale-step intervals between the notes struck inside one bar. */
function barShape(p: PhraseModel, bar: number): number[] {
  const steps = p.melody.filter((n) => n.bar === bar && n.midi !== null && n.tie !== 'stop').map((n) => scaleStep(n.midi as number, p.fifths));
  return steps.slice(1).map((step, i) => step - (steps[i] as number));
}

/** How the motif part read the phrase: a recurrence transformed, and the exact repeats. */
export function motifFacts(p: PhraseModel): { transformed: boolean; exactRepeats: number } {
  let transformed = false;
  let exactRepeats = 0;
  for (let b = 1; b < p.bars; b += 1) {
    let exact = false;
    for (let a = 0; a < b; a += 1) {
      const sameRhythm = barRhythm(p, a) === barRhythm(p, b);
      const samePitches = barPitches(p, a) === barPitches(p, b);
      if (sameRhythm && samePitches) exact = true;
      const events = p.melody.filter((n) => n.bar === b).length;
      if (sameRhythm && !samePitches && events >= 2) transformed = true;
      const shapeA = barShape(p, a);
      const shapeB = barShape(p, b);
      if (shapeA.length >= 2 && shapeA.join() === shapeB.join() && !samePitches) transformed = true;
    }
    if (exact) exactRepeats += 1;
  }
  return { transformed, exactRepeats };
}

/**
 * Local repetition with variation, 0–1 (levels 2 and above, the brief): a
 * bar's rhythm that comes back under other notes, or a bar's interval shape
 * that comes back at another pitch, is 1; a bar only repeated exactly is a
 * half; nothing recurring, 0. Each exact repeat beyond the first costs a half.
 * A reader reads by patterns, so a cell they have just read makes the next bar
 * readable; a bar copied three times stops testing reading.
 */
export function motif(p: PhraseModel): number | undefined {
  if (p.level < 2 || p.bars < 2) return undefined;
  const { transformed, exactRepeats } = motifFacts(p);
  const base = transformed ? 1 : exactRepeats >= 1 ? 0.5 : 0;
  return Math.max(0, base - 0.5 * Math.max(0, exactRepeats - 1));
}

/** How the rest part read the phrase. */
export function restFacts(p: PhraseModel): { rests: number; boundary: number; bad: number } {
  const beat = feltBeatOf(p.metre);
  let rests = 0;
  let boundary = 0;
  let bad = 0;
  p.melody.forEach((note, i) => {
    if (note.midi !== null || note.designed) return;
    rests += 1;
    const ends = note.at + note.duration === barLength(p.metre);
    if (ends && (note.bar + 1) % 2 === 0 && note.bar < p.bars - 1) boundary += 1;
    const before = p.melody[i - 1];
    const inLastBar = note.bar === p.bars - 1;
    const afterRest = before !== undefined && before.bar === note.bar && before.midi === null;
    const beatIndex = Math.floor(note.at / beat);
    const breaksBeam =
      note.duration < beat &&
      p.melody.some((other) => other.bar === note.bar && other.midi !== null && other.duration < beat && Math.floor(other.at / beat) === beatIndex);
    if (inLastBar || afterRest || breaksBeam) bad += 1;
  });
  return { rests, boundary, bad };
}

/**
 * Rests that breathe, 0–1 (levels 3–7, whose rests are the generator's): a
 * phrase with none is three quarters; each rest closing a two-bar group adds a
 * quarter; each rest in the arrival bar, straight after another rest, or
 * splitting the short notes of one beat costs 0.35. The syncopation rest that
 * opens a bar at levels 5–7 is the level's device and is not judged here.
 */
export function rests(p: PhraseModel): number | undefined {
  if (!p.restsAllowed) return undefined;
  const { boundary, bad } = restFacts(p);
  return Math.min(1, Math.max(0, 0.75 + 0.25 * boundary - 0.35 * bad));
}

/**
 * Agreement with the left hand's chord, 0–1, where the left hand plays one:
 * each note struck on a strong beat (the downbeat; the half bar in 4/4) is 1
 * when it is a chord tone of its bar's harmony, a half when it is not but
 * moves by step to a chord tone (a note leaning on the chord), else 0. A reader
 * who knows the harmony can predict the strong beats. At levels 2–4 the left
 * hand picks its own chord and this part is all that asks the right hand to
 * agree; at 5–7 the generator also moves a strong beat to a chord tone within
 * the leap cap, and this part scores what that leaves (a pitch held by a tie,
 * the bottom of the range).
 */
export function harmony(p: PhraseModel): number | undefined {
  const events = sounded(p);
  const strong = strongOffsets(p.metre);
  const marks: number[] = [];
  events.forEach((event, i) => {
    const chord = p.harmony[event.bar];
    if (chord === null || chord === undefined || !strong.includes(event.at)) return;
    const degree = degreeOf(event.midi, p.fifths);
    if (chordTones(chord).has(degree)) {
      marks.push(1);
      return;
    }
    const next = events[i + 1];
    const nextChord = next === undefined ? null : p.harmony[next.bar];
    const resolves =
      next !== undefined &&
      nextChord !== null &&
      nextChord !== undefined &&
      Math.abs(next.step - event.step) === 1 &&
      chordTones(nextChord).has(degreeOf(next.midi, p.fifths));
    marks.push(resolves ? 0.5 : 0);
  });
  if (marks.length === 0) return undefined;
  return marks.reduce((a, b) => a + b, 0) / marks.length;
}

/**
 * Leaps as a soft cost below the level's cap, 0–1: steps and skips cost
 * nothing (they are the reading vocabulary from 1.5 and 2.2); a fourth or
 * wider costs its size towards the cap (the cap itself costs 1), half as much
 * when the next move turns back by step or skip (a leap recovered); the part
 * is one minus the mean cost per interval. A tiebreaker, not a rule: the hard
 * cap is the level's, and a rung that promises leaps still gets them.
 */
export function leaps(p: PhraseModel): number | undefined {
  const steps = sounded(p).map((e) => e.step);
  if (steps.length < 2) return undefined;
  let cost = 0;
  for (let i = 1; i < steps.length; i += 1) {
    const move = (steps[i] as number) - (steps[i - 1] as number);
    const size = Math.abs(move);
    if (size < 3) continue;
    let here = p.maxLeap > 2 ? Math.min(1, (size - 2) / (p.maxLeap - 2)) : 1;
    const next = steps[i + 1] === undefined ? 0 : (steps[i + 1] as number) - (steps[i] as number);
    if (next !== 0 && Math.sign(next) !== Math.sign(move) && Math.abs(next) <= 2) here *= 0.5;
    cost += here;
  }
  return 1 - cost / (steps.length - 1);
}

export const PARTS = ['beginning', 'arrival', 'contour', 'motif', 'rests', 'harmony', 'leaps'] as const;
export type PartName = (typeof PARTS)[number];

/**
 * Each part's weight, with its reason.
 *
 * - `arrival` 5 and `contour` 3: the two faults the trace and Part 15 name
 *   first (phrases that stop rather than arrive; lines that wander or rock),
 *   and the two the distribution suite holds the generator to. Arrival the
 *   heavier: at 3 each, levels 5–7 still ended short of a beat in one phrase
 *   in five, a better contour outweighing the ending, and an ending is what a
 *   reader hears as the phrase being over; at 5, about one in twenty at 5–6
 *   and on rows 5–7, one in eight on level 7's own table (the distribution
 *   table, Entry 94).
 * - `motif` 1.5 and `harmony` 1.5: what makes a phrase readable by pattern and
 *   by harmonic expectation (Part 15 §10), below the phrase's shape.
 * - `beginning` 1 and `rests` 1: the walk already starts on the tonic and
 *   rests are rare, so these separate fewer candidates.
 * - `leaps` 0.5: a tiebreaker below the cap, never a reason to lose the
 *   skips and leaps a level's reading is about.
 */
export const WEIGHTS: Readonly<Record<PartName, number>> = {
  beginning: 1,
  arrival: 5,
  contour: 3,
  motif: 1.5,
  rests: 1,
  harmony: 1.5,
  leaps: 0.5,
};

const PART_FUNCTIONS: Readonly<Record<PartName, (p: PhraseModel) => number | undefined>> = {
  beginning,
  arrival,
  contour,
  motif,
  rests,
  harmony,
  leaps,
};

export type PartScores = Partial<Record<PartName, number>>;

/** Every part that applies to the phrase, each 0–1; a part that does not apply is absent. */
export function scoreParts(p: PhraseModel): PartScores {
  const out: PartScores = {};
  for (const name of PARTS) {
    const value = PART_FUNCTIONS[name](p);
    if (value !== undefined) out[name] = value;
  }
  return out;
}

/** The weighted mean of the parts that apply, 0–1; 0 for a phrase none applies to. */
export function totalOf(parts: PartScores): number {
  let sum = 0;
  let weight = 0;
  for (const name of PARTS) {
    const value = parts[name];
    if (value === undefined) continue;
    sum += WEIGHTS[name] * value;
    weight += WEIGHTS[name];
  }
  return weight === 0 ? 0 : sum / weight;
}

export function scorePhrase(p: PhraseModel): { total: number; parts: PartScores } {
  const parts = scoreParts(p);
  return { total: totalOf(parts), parts };
}

// --- the hard layer's two new constraints (S26) -----------------------------------

/** What a phrase of given options may never do, beyond what the generator's promises already check. */
export interface HardRules {
  /** Ties only from a note on the felt beat: where no syncopation is taught (below 4.5, the level's own table at 1–4). */
  tiesOnBeatOnly: boolean;
}

/**
 * The hard constraints a candidate must keep before it is scored (S26): no
 * melodic interval beyond the level's leap cap — which is where a tie's
 * closing note, set to the tied pitch after the walk had moved on, used to
 * leap a fifth — and, where syncopation is not taught, a tie only from a note
 * on the beat. Empty: the candidate keeps them.
 */
export function hardViolations(p: PhraseModel, rules: HardRules): string[] {
  const out: string[] = [];
  const events = sounded(p);
  for (let i = 1; i < events.length; i += 1) {
    const before = events[i - 1] as SoundedEvent;
    const here = events[i] as SoundedEvent;
    const size = Math.abs(here.step - before.step);
    if (size > p.maxLeap) {
      out.push(`${before.tiedOver ? 'after a tie, ' : ''}a leap of ${String(size)} scale steps in bar ${String(here.bar + 1)}, beyond the cap of ${String(p.maxLeap)}`);
    }
  }
  if (rules.tiesOnBeatOnly) {
    const beat = feltBeatOf(p.metre);
    for (const note of p.melody) {
      if (note.tie === 'start' && note.midi !== null && note.at % beat !== 0) {
        out.push(`a tie from off the beat in bar ${String(note.bar + 1)}, where syncopation is not taught`);
      }
    }
  }
  return out;
}

/**
 * The candidate to keep: the highest score among those that keep every hard
 * constraint, the earliest on a tie, so the choice is deterministic from the
 * seed. A candidate that breaks one is never scored (`score` is not called on
 * it); `undefined` where none keeps them.
 *
 * Where the candidates say how many notes their melody strikes (`events`),
 * only those at or above the valid candidates' lower quartile are eligible:
 * the scorer judges shape and must not change the level's difficulty on the
 * way. A sparser phrase is easier to shape (fewer notes, fewer turns) and ends
 * on a long note more often, so an unfloored choice drifted towards it — level
 * 2 fell from about four notes a bar to three and a half, and level 1
 * collapsed onto a handful of five-note phrases that half the seeds wrote (the
 * distribution suite found both; Entry 94). The median as the floor held the
 * density too and halved the candidates the shape was chosen from; with the
 * lower quartile every level's own table stays within a twentieth of version
 * 1's notes a bar and every row within a tenth (the rows at 1.5 and 2.2–3.4
 * lose most, about a note in every four bars).
 *
 * `tolerance`: a candidate within it of the best counts as the best, and the
 * earliest such is kept — the variety a strict best loses where the
 * best-shaped phrases are few (`SCORE_TOLERANCE` in the generator says why).
 */
export function chooseCandidate<T extends { valid: boolean; events?: number }>(
  candidates: readonly T[],
  score: (candidate: T) => number,
  tolerance = 0,
): number | undefined {
  const counts = candidates
    .filter((candidate) => candidate.valid && candidate.events !== undefined)
    .map((candidate) => candidate.events as number)
    .sort((a, b) => a - b);
  const floor = counts.length === 0 ? -Infinity : (counts[Math.floor((counts.length - 1) / 4)] as number);
  const scored: { index: number; value: number }[] = [];
  candidates.forEach((candidate, index) => {
    if (!candidate.valid) return;
    if (candidate.events !== undefined && candidate.events < floor) return;
    scored.push({ index, value: score(candidate) });
  });
  if (scored.length === 0) return undefined;
  const best = Math.max(...scored.map((s) => s.value));
  return scored.find((s) => s.value >= best - tolerance)?.index;
}
