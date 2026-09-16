/**
 * Simon, on the piano: the app plays one note, you play it back; then the same
 * note and one more; then three. The chain grows until you break it, and the
 * score is the longest chain you echoed.
 *
 * Why it is here at all. Every other ear drill asks a question whose answer is
 * a name — this interval, that quality, this progression — and a learner with
 * no memory for pitch can pass them all by guessing well within a small set.
 * A chain has no set to guess from: the only way to play back five notes is to
 * have held five notes, which is the thing playing by ear actually consists of
 * and the thing none of the other drills trains.
 *
 * Three decisions worth naming:
 *
 * - **The chain is drawn up front, from the seed.** Round *n* is the first *n*
 *   notes of one list, so the same seed is the same game — repeatable for a
 *   test, and for a learner who wants another go at the chain that beat them.
 *   Growing it note by note from a live generator would have made every run
 *   unrepeatable for no gain.
 * - **A wrong note ends the chain there and then**, rather than letting the
 *   learner finish playing a chain already known to be wrong. That is what a
 *   memory game is: the moment you have lost it, you have lost it.
 * - **No octave tolerance.** Everywhere else in the engine the shape is the
 *   point and the register is the learner's choice; here the register *is*
 *   part of what was heard, and an answer an octave out is a different answer.
 */
import { systemClock, type Clock, type EngineInput } from '../types';
import type { Drill, DrillAnswer, DrillPrompt, DrillResult } from './types';

/** Semitones above the tonic of each degree of a major scale, 1 to 7. */
export const MAJOR_DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;

/**
 * How long a chain can get.
 *
 * A cap is needed because a `Drill` ends when `next()` runs out, and because
 * "the score is the longest chain" has to be a share of something for the
 * result to mean anything. Twelve is past the span anyone reaches early and
 * short of a round that outlasts the learner's patience.
 */
export const SIMON_ROUNDS = 12;

/** Between the notes of the chain, played back one at a time. */
export const SIMON_STEP_MS = 520;

/** The chain that counts as having the knack of it (docs/02 Part G's pass). */
export const SIMON_PASS_CHAIN = 5;

/** And the chain that counts as mastery of this item. */
export const SIMON_MASTER_CHAIN = 8;

/**
 * Whether a run passes, and whether it counts towards mastery.
 *
 * Pure, and here rather than in the screen's `drillOutcome`, because it is the
 * one kind whose pass is not an accuracy: breaking at the sixth round is five
 * chains right out of six, which as a percentage says the same thing as
 * breaking at the twelfth. The chain is the score.
 */
export function simonOutcome(longestChain: number): { passed: boolean; masterEligible: boolean } {
  return {
    passed: longestChain >= SIMON_PASS_CHAIN,
    masterEligible: longestChain >= SIMON_MASTER_CHAIN,
  };
}

export interface SimonOptions {
  /** The lowest and highest note the chain may use. */
  low?: number;
  high?: number;
  /**
   * Scale degrees of `key` the chain may use — `[1, 2, 3, 4, 5, 6, 7]` for the
   * white keys of C. Absent, or empty, means chromatic.
   */
  degrees?: readonly number[];
  /** Pitch class of the key those degrees are counted from. */
  key?: number;
  rounds?: number;
  seed?: number;
  clock?: Clock;
  stepMs?: number;
}

/** Every note in the range this drill is allowed to play. */
export function simonPool(options: SimonOptions): number[] {
  const low = Math.min(options.low ?? 60, options.high ?? 72);
  const high = Math.max(options.low ?? 60, options.high ?? 72);
  const degrees = options.degrees ?? [];
  const key = (((options.key ?? 0) % 12) + 12) % 12;
  const allowed =
    degrees.length === 0
      ? null
      : new Set(
          degrees.map((degree) => {
            const step = MAJOR_DEGREE_SEMITONES[(((degree - 1) % 7) + 7) % 7] ?? 0;
            return (step + key + 12) % 12;
          }),
        );
  const pool: number[] = [];
  for (let midi = low; midi <= high; midi += 1) {
    if (allowed === null || allowed.has(((midi % 12) + 12) % 12)) pool.push(midi);
  }
  return pool;
}

/**
 * The whole chain, drawn from the seed.
 *
 * No note immediately repeats the one before it: two identical notes in a row
 * are heard as one held note, so a chain containing them would be asking the
 * learner to count something they cannot hear.
 */
export function simonChain(pool: readonly number[], rounds: number, rng: () => number): number[] {
  if (pool.length === 0) return [];
  const chain: number[] = [];
  for (let round = 0; round < rounds; round += 1) {
    const last = chain[chain.length - 1];
    const choices = pool.length > 1 ? pool.filter((midi) => midi !== last) : pool;
    chain.push(choices[Math.min(choices.length - 1, Math.floor(rng() * choices.length))] ?? pool[0] ?? 60);
  }
  return chain;
}

/**
 * The best chain a stored `bestAccuracy` stands for.
 *
 * A Simon run's accuracy *is* its chain as a share of the cap, precisely so
 * that the personal best needs no new place to live: `recordRun` already keeps
 * the best accuracy per item, which is the same sentence as "the longest chain
 * you have played back here". Nothing else in the drill uses accuracy for
 * anything, so nothing else is distorted by defining it this way.
 */
export function simonBestChain(bestAccuracy: number, rounds: number): number {
  if (!Number.isFinite(bestAccuracy) || bestAccuracy <= 0) return 0;
  return Math.max(0, Math.min(rounds, Math.round(bestAccuracy * rounds)));
}

export class SimonDrill implements Drill {
  readonly kind = 'simon' as const;
  private readonly chain: number[];
  private readonly stepMs: number;
  private readonly clock: Clock;
  private index = -1;
  private promptAtMs = 0;
  private heard: number[] = [];
  private answeredCurrent = false;
  private broken = false;
  private readonly answers: DrillAnswer[] = [];

  constructor(options: SimonOptions & { rng: () => number }) {
    const rounds = Math.max(1, Math.min(64, options.rounds ?? SIMON_ROUNDS));
    this.chain = simonChain(simonPool(options), rounds, options.rng);
    this.stepMs = options.stepMs ?? SIMON_STEP_MS;
    this.clock = options.clock ?? systemClock;
  }

  /** The notes of this game, for a test and for nothing else. */
  get notes(): readonly number[] {
    return this.chain;
  }

  get current(): DrillPrompt | null {
    if (this.broken || this.index < 0 || this.index >= this.chain.length) return null;
    const notes = this.chain.slice(0, this.index + 1);
    return {
      index: this.index,
      // Never the notes: the card would be answering its own question.
      label: `${String(notes.length)} ${notes.length === 1 ? 'note' : 'notes'}`,
      hint: notes.length === 1 ? 'One note' : `${String(notes.length)} notes, in order`,
      expected: notes,
      ordered: true,
      playback: notes.map((midi, at) => ({ midi: [midi], atMs: at * this.stepMs })),
    };
  }

  next(): DrillPrompt | null {
    // Skipped, or the screen moved on: the chain is broken the same as if the
    // wrong note had been played, because the chain was not played back.
    if (this.current && !this.answeredCurrent) {
      this.answers.push({
        promptIndex: this.index,
        correct: false,
        reactionMs: null,
        played: [...this.heard],
      });
      this.broken = true;
      return null;
    }
    if (this.broken) return null;
    this.index += 1;
    this.heard = [];
    this.answeredCurrent = false;
    this.promptAtMs = this.clock.now();
    return this.current;
  }

  feed(input: EngineInput): void {
    if (input.kind !== 'noteOn') return;
    const prompt = this.current;
    if (!prompt || this.answeredCurrent) return;
    const at = this.heard.length;
    this.heard.push(input.midi);
    // In order, and in the octave it was played in — see the note at the top.
    if (input.midi !== prompt.expected[at]) {
      this.settle(false, input.tMs);
      return;
    }
    if (this.heard.length === prompt.expected.length) this.settle(true, input.tMs);
  }

  private settle(correct: boolean, tMs: number): void {
    this.answeredCurrent = true;
    if (!correct) this.broken = true;
    this.answers.push({
      promptIndex: this.index,
      correct,
      reactionMs: Math.max(0, (Number.isFinite(tMs) ? tMs : this.clock.now()) - this.promptAtMs),
      played: [...this.heard],
    });
  }

  /** How many rounds were echoed right, which is the longest chain in notes. */
  get longestChain(): number {
    return this.answers.filter((answer) => answer.correct).length;
  }

  result(): DrillResult {
    const reactions = this.answers
      .map((answer) => answer.reactionMs)
      .filter((value): value is number => value !== null && Number.isFinite(value));
    const chain = this.longestChain;
    return {
      kind: this.kind,
      total: this.chain.length,
      answered: this.answers.length,
      correct: chain,
      // The chain as a share of the cap — see `simonBestChain`.
      accuracy: this.chain.length > 0 ? chain / this.chain.length : 0,
      meanReactionMs:
        reactions.length > 0 ? reactions.reduce((a, b) => a + b, 0) / reactions.length : 0,
      answers: [...this.answers],
      detail: { longestChain: chain },
    };
  }
}
