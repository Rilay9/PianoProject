/**
 * The harmony and ear drills `02` Parts D2-D4 describe (P12b).
 *
 * Five tracks stopped at Stage 5 because the skills their lessons name — modes,
 * chord-scales, extended chords, secondary dominants, transposition, hearing a
 * progression and writing it down — had no drill to practise them on. These are
 * those drills.
 *
 * Six of the seven are ordinary prompt-and-answer and reuse `PromptDrill`.
 * The seventh is not: harmonic dictation has to decide where one chord ends and
 * the next begins, which is a question none of the others ask.
 */

import { generateSightReading, makeRng, type SightReadingLevel } from '../sightReading';
import { systemClock, type Clock, type EngineInput } from '../types';
import { PromptDrill, resolveBase } from './PromptDrill';
import {
  CHORD_QUALITIES,
  MODE_STEPS,
  anyRomanToChord,
  chordScaleFor,
  modePitches,
  parseChordSymbol,
  type ParsedChord,
} from './theory';
import {
  sameSet,
  type Drill,
  type DrillAnswer,
  type DrillOptionsBase,
  type DrillPrompt,
  type DrillResult,
} from './types';

const ROOT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'] as const;

function rootName(pitchClass: number): string {
  return ROOT_NAMES[((pitchClass % 12) + 12) % 12] ?? 'C';
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))] as T;
}

export interface HarmonyDrillOptions extends DrillOptionsBase {
  clock?: Clock;
}

// --- modes ------------------------------------------------------------------

export interface ModeDrillOptions extends HarmonyDrillOptions {
  /** Mode names to draw from; unknown names are dropped, not guessed at. */
  modes?: string[];
  /** Roots to draw from, as pitch classes. */
  roots?: number[];
}

/**
 * Names a mode and a root and waits for the scale, in order.
 *
 * Ordered, and one octave: a mode is a sequence, and playing the seven notes in
 * any order is a chord. The octave above the root is included because that is
 * where a mode announces itself — dorian and aeolian are the same six notes
 * until the sixth degree arrives.
 */
export function modeDrill(options: ModeDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 21);
  const modes = (options.modes ?? Object.keys(MODE_STEPS)).filter((mode) => MODE_STEPS[mode]);
  const pool = modes.length > 0 ? modes : Object.keys(MODE_STEPS);
  const roots = options.roots && options.roots.length > 0 ? options.roots : [0, 2, 4, 5, 7, 9];

  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const root = pick(rng, roots);
    const mode = pick(rng, pool);
    return {
      index,
      label: `${rootName(root)} ${mode}`,
      hint: 'one octave, ascending',
      expected: modePitches(root, mode) ?? [60],
      ordered: true,
    };
  });
  return new PromptDrill({
    kind: 'mode',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

// --- chord-scale ------------------------------------------------------------

export interface ChordScaleDrillOptions extends HarmonyDrillOptions {
  /** Chord symbols to show. Any symbol with no settled scale is dropped. */
  chords?: string[];
}

/**
 * Shows a chord symbol and waits for the scale that fits it.
 *
 * The bridge between knowing chords and improvising over them, and the reason
 * `CHORD_SCALES` only lists the mappings nobody argues about: a drill that
 * marks lydian wrong over a maj7 because it wanted ionian is teaching the app's
 * opinion rather than the music.
 */
export function chordScaleDrill(options: ChordScaleDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 22);
  const symbols = options.chords ?? ['Cmaj7', 'D7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Dm7'];
  const usable = symbols
    .map((symbol) => ({ symbol, scale: chordScaleFor(symbol) }))
    .filter((entry): entry is { symbol: string; scale: { chord: ParsedChord; mode: string } } =>
      entry.scale !== null,
    );
  const pool = usable.length > 0 ? usable : [{ symbol: 'G7', scale: chordScaleFor('G7')! }];

  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const entry = pick(rng, pool);
    const root = ((entry.scale.chord.root % 12) + 12) % 12;
    return {
      index,
      label: entry.symbol,
      hint: `play the scale that fits — ${entry.scale.mode}`,
      expected: modePitches(root, entry.scale.mode) ?? [60],
      ordered: true,
    };
  });
  return new PromptDrill({
    kind: 'chord-scale',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

// --- extended chords --------------------------------------------------------

export interface ExtendedChordDrillOptions extends HarmonyDrillOptions {
  /** Qualities to draw from: `9`, `m9`, `11`, `13`, `maj13`, `7b9`… */
  qualities?: string[];
  roots?: number[];
}

/**
 * Shows a ninth, eleventh or thirteenth chord and waits for every note of it.
 *
 * `anyOctave` stays on — a thirteenth spans more than an octave and a hand has
 * to spread it somewhere — but every chord tone is required, including the ones
 * a player would normally leave to the bass. Learning which notes may be
 * dropped comes after knowing what is there to drop.
 */
export function extendedChordDrill(options: ExtendedChordDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 23);
  const qualities = (options.qualities ?? ['9', 'm9', 'maj9', '11', '13', 'maj13']).filter(
    (quality) => CHORD_QUALITIES[quality],
  );
  const pool = qualities.length > 0 ? qualities : ['9'];
  const roots = options.roots && options.roots.length > 0 ? options.roots : [0, 2, 5, 7, 9];

  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const root = pick(rng, roots);
    const quality = pick(rng, pool);
    const symbol = `${rootName(root)}${quality}`;
    const chord = parseChordSymbol(symbol);
    return {
      index,
      label: symbol,
      hint: `${(CHORD_QUALITIES[quality] ?? []).length} notes`,
      expected: chord?.pitches ?? [60, 64, 67, 70, 74],
    };
  });
  return new PromptDrill({
    kind: 'extended-chord',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

// --- roman numerals ---------------------------------------------------------

export interface RomanNumeralDrillOptions extends HarmonyDrillOptions {
  /** Numerals to show, including secondary dominants like `V7/vi`. */
  degrees?: string[];
  /** Keys to ask them in, as pitch classes. */
  keys?: number[];
}

/**
 * Shows a roman numeral in a key and waits for the chord.
 *
 * Reading harmony rather than hearing it: `02` Part D6 asks for it at every
 * theory rung and the catalog had no drill for it. Secondary dominants are in
 * the default set because they are where roman numerals start being worth the
 * trouble — `V/V` says in two characters what "the dominant of the dominant,
 * so raise the fourth" says in twelve.
 */
export function romanNumeralDrill(options: RomanNumeralDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 24);
  const degrees = options.degrees ?? ['I', 'ii', 'iii', 'IV', 'V7', 'vi', 'V/V', 'V7/vi'];
  const keys = options.keys && options.keys.length > 0 ? options.keys : [0, 5, 7];

  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const key = pick(rng, keys);
    const degree = pick(rng, degrees);
    const chord = anyRomanToChord(degree, key);
    return {
      index,
      label: degree,
      hint: `in ${rootName(key)}`,
      expected: chord?.pitches ?? [60, 64, 67],
    };
  });
  return new PromptDrill({
    kind: 'roman-numeral',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

// --- ear-tune ---------------------------------------------------------------

export interface EarTuneDrillOptions extends HarmonyDrillOptions {
  /** How many bars the tune is. */
  bars?: number;
  /** How many bars a phrase is. */
  barsPerPhrase?: number;
  /** Which key, as a pitch class. */
  key?: number;
  bpm?: number;
}

/**
 * Plays four bars and asks for them back a phrase at a time.
 *
 * Not a longer call-and-response: the whole tune is played first, then each
 * phrase is offered separately, so the learner is reconstructing something they
 * have heard rather than echoing something they have just heard. `hint` names
 * the phrase's first note, which is what the hint button on the screen reveals
 * — a note, not the answer.
 */
export function earTuneDrill(options: EarTuneDrillOptions = {}): Drill {
  const { anyOctave } = resolveBase(options);
  const rng = makeRng(options.seed ?? 25);
  const bars = Math.max(2, Math.min(8, options.bars ?? 4));
  const barsPerPhrase = Math.max(1, Math.min(bars, options.barsPerPhrase ?? 2));
  const key = ((options.key ?? 0) % 12 + 12) % 12;
  const bpm = options.bpm ?? 84;
  const beatMs = 60_000 / bpm;

  // A diatonic tune, two notes to the bar's beat, ending on the tonic: the
  // shape of every folk melody the ear already knows.
  const scale = [0, 2, 4, 5, 7, 9, 11].map((step) => 60 + key + step);
  const notesPerBar = 4;
  const total = bars * notesPerBar;
  let index = 0;
  const tune: number[] = Array.from({ length: total }, (_, i) => {
    if (i === total - 1) index = 0;
    const midi = scale[index] ?? scale[0] ?? 60;
    const step = Math.round(rng() * 4 - 2);
    index = Math.max(0, Math.min(scale.length - 1, index + (step === 0 ? 1 : step)));
    return midi;
  });

  const phrases = Math.ceil(bars / barsPerPhrase);
  const perPhrase = barsPerPhrase * notesPerBar;
  const prompts: DrillPrompt[] = Array.from({ length: phrases }, (_, phrase) => {
    const slice = tune.slice(phrase * perPhrase, (phrase + 1) * perPhrase);
    const whole = phrase === 0;
    return {
      index: phrase,
      label: `Phrase ${phrase + 1} of ${phrases}`,
      hint: `starts on ${rootName(((slice[0] ?? 60) % 12 + 12) % 12)}`,
      expected: slice,
      ordered: true,
      // The first prompt plays the whole tune, then its own phrase; the rest
      // play their phrase only. Hearing the tune whole once is what makes this
      // a tune rather than a list of notes.
      playback: (whole ? tune : []).map((midi, i) => ({ midi: [midi], atMs: i * (beatMs / 2) }))
        .concat(
          slice.map((midi, i) => ({
            midi: [midi],
            atMs: (whole ? total * (beatMs / 2) + beatMs : 0) + i * (beatMs / 2),
          })),
        ),
    };
  });
  return new PromptDrill({
    kind: 'ear-tune',
    prompts,
    anyOctave,
    clock: options.clock ?? systemClock,
  });
}

// --- transposition ----------------------------------------------------------

export interface TranspositionDrillOptions extends HarmonyDrillOptions {
  /** Sight-reading level the printed bars are written at. */
  level?: SightReadingLevel;
  bars?: number;
  /** Semitones to transpose by, or the target keys as pitch classes. */
  targets?: number[];
}

/**
 * Prints four bars and asks for them in another key.
 *
 * The music comes from the sight-reading writer, so the exercise is unseen
 * every time and the expectation is exactly the printed model moved by an
 * interval — no separate answer key to drift out of step with the notation.
 */
export function transpositionDrill(options: TranspositionDrillOptions = {}): Drill {
  const { count, anyOctave } = resolveBase(options);
  const seed = options.seed ?? 26;
  const rng = makeRng(seed);
  const level: SightReadingLevel = options.level ?? 2;
  const bars = Math.max(1, Math.min(8, options.bars ?? 4));
  const targets = options.targets && options.targets.length > 0 ? options.targets : [2, 5, 7, -2];

  const prompts: DrillPrompt[] = Array.from({ length: count }, (_, index) => {
    const written = generateSightReading({ level, bars, hands: 'R', seed: seed + index * 7919 });
    const shift = pick(rng, targets);
    const tonic = ((written.fifths * 7) % 12 + 12) % 12;
    return {
      index,
      label: `Play in ${rootName(tonic + shift)}`,
      hint: `${shift > 0 ? 'up' : 'down'} ${Math.abs(shift)} semitone${Math.abs(shift) === 1 ? '' : 's'}`,
      musicXml: written.musicXml,
      expected: written.melody.map((midi) => midi + shift),
      ordered: true,
    };
  });
  return new PromptDrill({
    kind: 'transposition',
    prompts,
    // The point is the interval, not the register, so an answer an octave out
    // is still a transposition.
    anyOctave: options.anyOctave ?? anyOctave,
    clock: options.clock ?? systemClock,
  });
}

// --- harmonic dictation -----------------------------------------------------

/**
 * How long a silence ends a chord (`05` §7, the question P8 left open).
 *
 * A chord is not a moment: a hand puts four notes down over some tens of
 * milliseconds, and the app has to decide when it has heard all of them.
 * 120 ms is long enough that no spread chord is split in two and short enough
 * that two chords played in time are never merged — a quarter note at ♩=120 is
 * 500 ms, so even a fast progression leaves four times the gap this needs.
 *
 * The other boundary is not a clock at all: if a note arrives that belongs to
 * the *next* expected chord and not to this one, the chord that was being built
 * is finished, whatever the silence was.
 */
export const CHORD_BOUNDARY_MS = 120;

export interface ChordDictationOptions extends HarmonyDrillOptions {
  /** The progressions to play, each a list of pitch sets. */
  progressions?: { label: string; chords: number[][] }[];
  /** Overrides `CHORD_BOUNDARY_MS`; for tests and for a slower learner. */
  boundaryMs?: number;
  /** Milliseconds between the played chords. */
  chordGapMs?: number;
}

interface HeardChord {
  pitches: number[];
  atMs: number;
}

/**
 * Plays a progression and waits for it back, chord by chord.
 *
 * Unlike every other drill here, the answer is not one pitch set: it is a
 * series of them arriving as one stream of note-ons, and the drill has to
 * segment it. That segmentation is the whole difficulty and is why this is a
 * class rather than a `PromptDrill` with a longer `expected`.
 */
export class ChordDictationDrill implements Drill {
  readonly kind = 'harmonic-dictation' as const;
  private readonly progressions: { label: string; chords: number[][] }[];
  private readonly boundaryMs: number;
  private readonly chordGapMs: number;
  private readonly anyOctave: boolean;
  private readonly clock: Clock;

  private index = -1;
  private promptAtMs = 0;
  private pending: number[] = [];
  private lastNoteMs = 0;
  private heard: HeardChord[] = [];
  private readonly answers: DrillAnswer[] = [];
  private closedCount = 0;

  constructor(options: ChordDictationOptions = {}) {
    const base = resolveBase(options);
    this.progressions =
      options.progressions && options.progressions.length > 0
        ? options.progressions
        : [{ label: 'I–IV–V–I', chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]] }];
    this.boundaryMs = options.boundaryMs ?? CHORD_BOUNDARY_MS;
    this.chordGapMs = options.chordGapMs ?? 900;
    this.anyOctave = base.anyOctave;
    this.clock = options.clock ?? systemClock;
  }

  get current(): DrillPrompt | null {
    const progression = this.progressions[this.index];
    if (!progression) return null;
    return {
      index: this.index,
      label: progression.label,
      hint: `${progression.chords.length} chords`,
      expected: progression.chords.flat(),
      ordered: true,
      playback: progression.chords.map((midi, i) => ({ midi, atMs: i * this.chordGapMs })),
    };
  }

  next(): DrillPrompt | null {
    if (this.index >= 0) this.score();
    this.index += 1;
    this.pending = [];
    this.heard = [];
    this.closedCount = 0;
    this.promptAtMs = this.clock.now();
    return this.current;
  }

  feed(input: EngineInput): void {
    if (input.kind !== 'noteOn') return;
    const progression = this.progressions[this.index];
    if (!progression) return;

    if (this.pending.length > 0) {
      const silent = input.tMs - this.lastNoteMs >= this.boundaryMs;
      if (silent || this.startsTheNextChord(input.midi, progression.chords)) {
        this.close(this.lastNoteMs);
      }
    }
    this.pending.push(input.midi);
    this.lastNoteMs = input.tMs;
  }

  /**
   * Advances the clock without an input.
   *
   * The silence rule cannot be applied by `feed` alone: the last chord of a
   * progression is followed by no note at all, and a learner who stops in the
   * middle should still have what they played counted. The screen calls this on
   * a timer; `result()` calls it implicitly.
   */
  tick(nowMs: number): void {
    if (this.pending.length > 0 && nowMs - this.lastNoteMs >= this.boundaryMs) {
      this.close(this.lastNoteMs);
    }
  }

  /**
   * True when a note belongs to the next expected chord and not to this one.
   *
   * Without this a progression played perfectly in time but faster than the
   * silence threshold would arrive as one enormous chord.
   */
  private startsTheNextChord(midi: number, chords: number[][]): boolean {
    const expected = chords[this.closedCount];
    const following = chords[this.closedCount + 1];
    if (!expected || !following) return false;
    const belongs = (set: number[]): boolean =>
      set.some((note) => (this.anyOctave ? (note - midi) % 12 === 0 : note === midi));
    return !belongs(expected) && belongs(following);
  }

  private close(atMs: number): void {
    if (this.pending.length === 0) return;
    this.heard.push({ pitches: [...this.pending], atMs });
    this.pending = [];
    this.closedCount += 1;
  }

  /** The chords the drill decided it heard, for tests and for the report. */
  get chordsHeard(): number[][] {
    return [...this.heard.map((chord) => [...chord.pitches]), ...(this.pending.length > 0 ? [[...this.pending]] : [])];
  }

  private score(): void {
    this.close(this.lastNoteMs);
    const progression = this.progressions[this.index];
    if (!progression) return;
    const heard = this.heard;
    const correct =
      heard.length === progression.chords.length &&
      progression.chords.every((expected, i) =>
        sameSet(heard[i]?.pitches ?? [], expected, this.anyOctave),
      );
    const last = heard[heard.length - 1];
    this.answers.push({
      promptIndex: this.index,
      correct,
      reactionMs: last ? Math.max(0, last.atMs - this.promptAtMs) : null,
      played: heard.flatMap((chord) => chord.pitches),
    });
  }

  result(): DrillResult {
    // Scoring the prompt in flight without consuming it, so `result()` can be
    // called at any point — the same contract every other drill keeps.
    const settled = [...this.answers];
    if (this.index >= 0 && settled.length === this.index) {
      const snapshot = new ChordDictationDrillSnapshot(this);
      const answer = snapshot.answer();
      if (answer) settled.push(answer);
    }
    const correct = settled.filter((a) => a.correct).length;
    const reactions = settled
      .map((a) => a.reactionMs)
      .filter((r): r is number => r !== null && Number.isFinite(r));
    return {
      kind: this.kind,
      total: this.progressions.length,
      answered: settled.length,
      correct,
      accuracy: settled.length > 0 ? correct / settled.length : 0,
      meanReactionMs:
        reactions.length > 0 ? reactions.reduce((a, b) => a + b, 0) / reactions.length : 0,
      answers: settled,
      detail: {
        boundaryMs: this.boundaryMs,
        chordsHeard: this.chordsHeard.length,
        chordsExpected: this.progressions[Math.max(0, this.index)]?.chords.length ?? 0,
      },
    };
  }
}

/**
 * Scores the prompt in flight without ending it.
 *
 * `result()` must be safe to call mid-drill, and closing the pending chord to
 * score it would change what the drill has heard. This reads the same state and
 * leaves it alone.
 */
class ChordDictationDrillSnapshot {
  constructor(private readonly drill: ChordDictationDrill) {}

  answer(): DrillAnswer | null {
    const heard = this.drill.chordsHeard;
    if (heard.length === 0) return null;
    const result = this.drill as unknown as {
      progressions: { chords: number[][] }[];
      index: number;
      anyOctave: boolean;
    };
    const expectedChords = result.progressions[result.index]?.chords ?? [];
    const correct =
      heard.length === expectedChords.length &&
      expectedChords.every((expected, i) => sameSet(heard[i] ?? [], expected, result.anyOctave));
    return {
      promptIndex: result.index,
      correct,
      reactionMs: null,
      played: heard.flat(),
    };
  }
}
