// The three drills that do not judge pitch.
//
// docs/05 §7: `rhythm` judges onsets, `pedal` judges CC64 transitions,
// `dynamics` judges velocity, and `backing-track` judges nothing at all — it
// records. Each keeps the same next/feed/result shape as the others so the
// P8 UI has one contract to build against.

import { makeRng } from '../sightReading';
import { systemClock, type Clock, type EngineInput } from '../types';
import type { Drill, DrillAnswer, DrillPrompt, DrillResult } from './types';

// --- rhythm ----------------------------------------------------------------

export interface RhythmDrillOptions {
  /** Onsets in milliseconds from the start, e.g. [0, 500, 1000, 1500]. */
  pattern?: number[];
  bpm?: number;
  toleranceMs?: number;
  seed?: number;
  clock?: Clock;
  /**
   * Clicks before the pattern begins. One bar by default (`04` §7).
   *
   * The drill does not make the sound — the screen's metronome does — but the
   * drill has to know how many beats the learner is being given, because that
   * is what the screen counts down and what `startAt` is measured from.
   */
  countInBeats?: number;
}

/**
 * Shows a rhythm on one line; the learner taps any key.
 *
 * Judged like Tempo mode but on onsets only — pitch is ignored entirely, which
 * is the point: a rhythm you can only play on the right note is not a rhythm
 * you know.
 */
export class RhythmDrill implements Drill {
  readonly kind = 'rhythm' as const;
  /** One beat, in milliseconds — what the screen's metronome has to click at. */
  readonly beatMs: number;
  readonly bpm: number;
  readonly countInBeats: number;
  private readonly pattern: number[];
  private readonly toleranceMs: number;
  private readonly clock: Clock;
  private startedAtMs: number | null = null;
  private plannedStartMs: number | null = null;
  private readonly matched = new Set<number>();
  private readonly deltas: number[] = [];
  private extras = 0;
  private prompt: DrillPrompt | null = null;

  constructor(options: RhythmDrillOptions = {}) {
    const bpm = options.bpm ?? 80;
    const beatMs = 60_000 / bpm;
    this.bpm = bpm;
    this.beatMs = beatMs;
    this.countInBeats = Math.max(0, Math.trunc(options.countInBeats ?? 4));
    const rng = makeRng(options.seed ?? 11);
    this.pattern =
      options.pattern ??
      // Four beats, some of them split into eighths: enough to be a rhythm
      // rather than a metronome.
      [0, 1, 2, 3].flatMap((beat) => (rng() < 0.4 ? [beat, beat + 0.5] : [beat])).map((b) => b * beatMs);
    this.toleranceMs = options.toleranceMs ?? 150;
    this.clock = options.clock ?? systemClock;
  }

  get current(): DrillPrompt | null {
    return this.prompt;
  }

  next(): DrillPrompt | null {
    if (this.prompt) return null;
    this.prompt = {
      index: 0,
      label: `${this.pattern.length} taps`,
      expected: [],
      playback: this.pattern.map((atMs) => ({ midi: [], atMs })),
    };
    this.startedAtMs = this.plannedStartMs ?? this.clock.now();
    return this.prompt;
  }

  /**
   * Says when the pattern's first onset happens, on the input timeline.
   *
   * Before this existed the clock started when the card appeared, so the
   * learner had to guess the downbeat and every tap was measured against a
   * moment nothing had marked. The screen now starts a metronome, converts the
   * audio time of bar 1 beat 1 onto the same `performance.now()` timeline the
   * input events carry, and hands it here — so the drill and the click are
   * reading one clock and a tap exactly on a click is exactly on time.
   */
  startAt(tMs: number): void {
    this.plannedStartMs = tMs;
    this.startedAtMs = tMs;
  }

  /** Where the pattern's first onset sits, once it is known. */
  get startedAt(): number | null {
    return this.startedAtMs;
  }

  feed(input: EngineInput): void {
    if (input.kind !== 'noteOn' || this.startedAtMs === null) return;
    const at = input.tMs - this.startedAtMs;
    let best = -1;
    let bestDistance = Infinity;
    this.pattern.forEach((onset, i) => {
      if (this.matched.has(i)) return;
      const distance = Math.abs(at - onset);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    if (best < 0 || bestDistance > this.toleranceMs) {
      this.extras += 1;
      return;
    }
    this.matched.add(best);
    this.deltas.push(at - (this.pattern[best] ?? at));
  }

  result(): DrillResult {
    const correct = this.matched.size;
    const answers: DrillAnswer[] = this.pattern.map((_, i) => ({
      promptIndex: i,
      correct: this.matched.has(i),
      reactionMs: null,
      played: [],
    }));
    const mean =
      this.deltas.length > 0 ? this.deltas.reduce((a, b) => a + b, 0) / this.deltas.length : 0;
    return {
      kind: this.kind,
      total: this.pattern.length,
      answered: correct + this.extras,
      correct,
      accuracy: this.pattern.length > 0 ? correct / this.pattern.length : 0,
      meanReactionMs: mean,
      answers,
      detail: {
        extraTaps: this.extras,
        meanOffsetMs: mean,
        bpm: this.bpm,
        countInBeats: this.countInBeats,
      },
    };
  }
}

// --- pedal -----------------------------------------------------------------

export interface PedalDrillOptions {
  /** Chords to play, in order; each is a pitch set. */
  chords?: number[][];
  /** A clean lift happens in this window after the chord (docs/05 §7). */
  liftWindowMs?: [number, number];
  /** …and the pedal must be back down within this. */
  downWithinMs?: number;
  /**
   * Half pedal: score the CC64 *value* rather than the timing of the change
   * (P12a). A damper held part-way lets the bass ring while the treble clears,
   * and a pedal that is only ever 0 or 127 cannot play Romantic music. When
   * this is set the drill asks for a value inside the range and reports how
   * much of the run was spent there.
   */
  halfPedalRange?: [number, number];
}

interface PedalChange {
  chordIndex: number;
  liftedAfterMs: number | null;
  downAfterMs: number | null;
  clean: boolean;
}

/**
 * Scores legato pedalling.
 *
 * A "clean change" is the pedal coming up between 0 and 120 ms *after* the new
 * chord's first Note-On and going back down within 250 ms — lift too early and
 * the previous chord is chopped, too late and the two chords blur.
 */
export class PedalDrill implements Drill {
  readonly kind = 'pedal' as const;
  private readonly chords: number[][];
  private readonly liftWindow: [number, number];
  private readonly downWithin: number;

  private index = -1;
  private chordAtMs: number | null = null;
  private liftedAtMs: number | null = null;
  private downAtMs: number | null = null;
  private sustainDown = false;
  private readonly changes: PedalChange[] = [];
  private readonly halfPedalRange: [number, number] | null;
  /** Every CC64 value seen, so the half-pedal share is a measurement. */
  private readonly pedalValues: number[] = [];

  constructor(options: PedalDrillOptions = {}) {
    this.chords = options.chords ?? [
      [60, 64, 67],
      [59, 62, 67],
      [60, 65, 69],
      [59, 62, 67],
    ];
    this.liftWindow = options.liftWindowMs ?? [0, 120];
    this.downWithin = options.downWithinMs ?? 250;
    this.halfPedalRange = options.halfPedalRange ?? null;
    // No clock: every interval here is a difference between two input
    // timestamps, so the drill is immune to when it happens to be ticked.
  }

  get current(): DrillPrompt | null {
    const chord = this.chords[this.index];
    if (!chord) return null;
    return { index: this.index, label: `Chord ${this.index + 1}`, expected: chord };
  }

  next(): DrillPrompt | null {
    if (this.index >= 0) this.settle();
    this.index += 1;
    this.chordAtMs = null;
    this.liftedAtMs = null;
    this.downAtMs = null;
    return this.current;
  }

  feed(input: EngineInput): void {
    if (this.index < 0 || this.index >= this.chords.length) return;
    if (input.kind === 'cc') {
      if (input.cc !== 64) return;
      this.pedalValues.push(input.value);
      const down = input.value >= 64;
      // Only the first lift after the chord counts; a second bounce is not a
      // second change.
      if (this.sustainDown && !down && this.chordAtMs !== null && this.liftedAtMs === null) {
        this.liftedAtMs = input.tMs;
      } else if (!this.sustainDown && down && this.liftedAtMs !== null && this.downAtMs === null) {
        this.downAtMs = input.tMs;
      }
      this.sustainDown = down;
      return;
    }
    if (input.kind !== 'noteOn') return;
    // The first Note-On of the chord is the reference for the whole change.
    if (this.chordAtMs === null) this.chordAtMs = input.tMs;
  }

  /** The first chord is pedalled into; there is no change to score before it. */
  private settle(): void {
    const chordAt = this.chordAtMs;
    if (chordAt === null) {
      this.changes.push({ chordIndex: this.index, liftedAfterMs: null, downAfterMs: null, clean: false });
      return;
    }
    const liftedAfterMs = this.liftedAtMs === null ? null : this.liftedAtMs - chordAt;
    const downAfterMs = this.downAtMs === null ? null : this.downAtMs - chordAt;
    const clean =
      this.index > 0 &&
      liftedAfterMs !== null &&
      liftedAfterMs >= this.liftWindow[0] &&
      liftedAfterMs <= this.liftWindow[1] &&
      downAfterMs !== null &&
      downAfterMs <= this.downWithin;
    this.changes.push({ chordIndex: this.index, liftedAfterMs, downAfterMs, clean });
  }

  result(): DrillResult {
    if (this.halfPedalRange) return this.halfPedalResult(this.halfPedalRange);
    // Only changes *between* chords can be clean, so the first chord is not
    // part of the denominator.
    const scored = this.changes.filter((c) => c.chordIndex > 0);
    const clean = scored.filter((c) => c.clean).length;
    return {
      kind: this.kind,
      total: Math.max(0, this.chords.length - 1),
      answered: scored.length,
      correct: clean,
      accuracy: scored.length > 0 ? clean / scored.length : 0,
      meanReactionMs: 0,
      answers: scored.map((c) => ({
        promptIndex: c.chordIndex,
        correct: c.clean,
        reactionMs: c.liftedAfterMs,
        played: [],
      })),
      detail: { cleanChanges: clean, scoredChanges: scored.length },
    };
  }

  /**
   * Half pedal: how much of the run was spent with the damper part-way.
   *
   * Not the timing of a change but the *value* held, so the denominator is
   * every CC64 message rather than every chord. A run with no pedal messages
   * at all scores zero and says so — the alternative, treating silence as a
   * pass, would give full marks to a piano with no pedal connected.
   */
  private halfPedalResult(range: [number, number]): DrillResult {
    const [low, high] = range;
    const inRange = this.pedalValues.filter((v) => v >= low && v <= high).length;
    const total = this.pedalValues.length;
    const partial = this.pedalValues.filter((v) => v > 0 && v < 127).length;
    // A pedal that only ever reports 0 or 127 is a *switch*, and many digital
    // actions are. Scoring that as "you failed to half-pedal" would blame the
    // player for the instrument, so it is reported as its own state and the
    // screen can say the exercise cannot be judged on this piano rather than
    // showing a permanent zero.
    const binaryPedal = total > 0 && partial === 0;
    const accuracy = total > 0 && !binaryPedal ? inRange / total : 0;
    return {
      kind: this.kind,
      total: this.chords.length,
      answered: total,
      correct: inRange,
      accuracy,
      meanReactionMs: 0,
      answers: [],
      detail: {
        halfPedalLow: low,
        halfPedalHigh: high,
        pedalMessages: total,
        inRange,
        // How often the pedal was anything but fully up or fully down, which is
        // the habit this exercise exists to build. A count rather than a flag:
        // "twice in a four-bar phrase" and "throughout" are different playing.
        partialPedalMessages: partial,
        // 1 when the instrument sent pedal messages but never a value between
        // the extremes. Not a score: a fact about the piano.
        binaryPedal: binaryPedal ? 1 : 0,
      },
    };
  }
}

// --- dynamics --------------------------------------------------------------

export interface DynamicsDrillOptions {
  /** Phrase pitches to play at each dynamic. */
  phrase?: number[];
  /** Loud must be at least this many times louder than soft (docs/05 §7). */
  targetRatio?: number;
}

/**
 * Asks for a phrase piano, then the same phrase forte, and compares the mean
 * velocities. A ratio of 1.6 or more passes.
 */
export class DynamicsDrill implements Drill {
  readonly kind = 'dynamics' as const;
  private readonly phrase: number[];
  private readonly targetRatio: number;
  private index = -1;
  private readonly velocities: number[][] = [[], []];

  constructor(options: DynamicsDrillOptions = {}) {
    this.phrase = options.phrase ?? [60, 62, 64, 65];
    this.targetRatio = options.targetRatio ?? 1.6;
  }

  get current(): DrillPrompt | null {
    if (this.index < 0 || this.index > 1) return null;
    return {
      index: this.index,
      label: this.index === 0 ? 'piano (soft)' : 'forte (loud)',
      expected: this.phrase,
      ordered: true,
    };
  }

  next(): DrillPrompt | null {
    this.index += 1;
    return this.current;
  }

  feed(input: EngineInput): void {
    if (input.kind !== 'noteOn') return;
    this.velocities[this.index]?.push(input.velocity);
  }

  result(): DrillResult {
    const mean = (values: number[]) =>
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const soft = mean(this.velocities[0] ?? []);
    const loud = mean(this.velocities[1] ?? []);
    const ratio = soft > 0 ? loud / soft : 0;
    const passed = ratio >= this.targetRatio;
    return {
      kind: this.kind,
      total: 2,
      answered: this.velocities.filter((v) => v.length > 0).length,
      correct: passed ? 1 : 0,
      accuracy: passed ? 1 : 0,
      meanReactionMs: 0,
      answers: [],
      detail: { softVelocity: soft, loudVelocity: loud, ratio, targetRatio: this.targetRatio },
    };
  }
}

// --- backing track ---------------------------------------------------------

export interface BackingTrackOptions {
  /** Chord loop the accompaniment plays; the UI turns this into audio. */
  loop?: number[][];
  barMs?: number;
}

/**
 * Free playing over a loop. Nothing is judged (docs/05 §7) — it records what
 * was played so the improvisation track has something to show later.
 */
export class BackingTrackDrill implements Drill {
  readonly kind = 'backing-track' as const;
  private readonly loop: number[][];
  private readonly barMs: number;
  private started = false;
  private readonly played: { midi: number; velocity: number; tMs: number }[] = [];

  constructor(options: BackingTrackOptions = {}) {
    this.loop = options.loop ?? [
      [48, 52, 55],
      [53, 57, 60],
      [55, 59, 62],
      [48, 52, 55],
    ];
    this.barMs = options.barMs ?? 2000;
  }

  get current(): DrillPrompt | null {
    if (!this.started) return null;
    return {
      index: 0,
      label: 'Play over the loop',
      expected: [],
      playback: this.loop.map((midi, i) => ({ midi, atMs: i * this.barMs })),
    };
  }

  next(): DrillPrompt | null {
    if (this.started) return null;
    this.started = true;
    return this.current;
  }

  feed(input: EngineInput): void {
    if (input.kind !== 'noteOn' || !this.started) return;
    this.played.push({ midi: input.midi, velocity: input.velocity, tMs: input.tMs });
  }

  result(): DrillResult {
    return {
      kind: this.kind,
      total: 0,
      answered: this.played.length,
      correct: 0,
      accuracy: 0,
      meanReactionMs: 0,
      answers: [],
      detail: { notesPlayed: this.played.length },
    };
  }

  /** What the learner improvised, for the sessions row. */
  get recording(): readonly { midi: number; velocity: number; tMs: number }[] {
    return this.played;
  }
}
