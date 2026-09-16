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
 *   memory game is: the moment you have lost it, you have lost it. The one
 *   exception is the ear-first rung of the help ladder below, where the miss
 *   buys a lit replay and another go at the *same* chain — still the moment
 *   you lost it, with the losing made into the teaching.
 * - **No octave tolerance.** Everywhere else in the engine the shape is the
 *   point and the register is the learner's choice; here the register *is*
 *   part of what was heard, and an answer an octave out is a different answer.
 */
import { systemClock, type Clock, type EngineInput } from '../types';
import { FEEDBACK_MS } from './feedback';
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

/** The white keys of C, and every key (`04` §5c-2). */
export const SIMON_C_MAJOR_ITEM = 'drill.ear.simon-c-major';
export const SIMON_CHROMATIC_ITEM = 'drill.ear.simon-chromatic';

/**
 * How much help the chain gives — three rungs of one ladder (`04` §5c-2).
 *
 * Simon by ear is the hardest thing in the drill list to *start*: a beginner
 * who cannot yet find a heard pitch on the keyboard fails at the first note
 * and learns nothing from failing, because what beat them was the translation
 * and not the memory. So the memory task is kept whole and the translation is
 * lent out, in three steps, and the learner walks down the ladder as the ear
 * catches up.
 *
 * The rung is **not** a handicap on the score, and deliberately so. With the
 * keys lit, the chain is still gone by the time it is your turn: the lights
 * say which key that sound was, and nothing at all about how to hold five of
 * them in order, which is the whole of what this drill trains. Scoring the
 * top rung lower would have priced the ease-in out of existence for the only
 * people it is for.
 */
export type SimonHelp = 'show-keys' | 'keys-after-miss' | 'ear-only';

export interface SimonHelpLevel {
  id: SimonHelp;
  /** The chip's word. Short: three of them share a phone's width. */
  label: string;
  /** The same thing in full, for a screen reader and the chip's tooltip. */
  meaning: string;
  /** The sentence this rung adds to the card's "how to answer" line. */
  how: string;
  /** Do the keys light, in time with the sound, as the chain plays? */
  lightsWhilePlaying: boolean;
  /** After a wrong note, is the chain played again with the keys lit? */
  replayAfterMiss: boolean;
  /** And is the same chain then asked for again, instead of the game ending? */
  retryAfterMiss: boolean;
}

/**
 * The ladder, most help first.
 *
 * Order is the contract: the chips are drawn in this order and a learner
 * reads them as "more help ← → less", so a rung inserted in the middle
 * belongs in the middle here.
 */
export const SIMON_HELP_LEVELS: readonly SimonHelpLevel[] = [
  {
    id: 'show-keys',
    label: 'Keys shown',
    meaning: 'The keys light and are named as the chain plays',
    how: 'Each key lights and names itself as it sounds — copy back what you saw and heard.',
    lightsWhilePlaying: true,
    replayAfterMiss: false,
    retryAfterMiss: false,
  },
  {
    id: 'keys-after-miss',
    label: 'After a miss',
    meaning: 'Sound only, and the keys are shown after a wrong note',
    how: 'It plays with no lights; a wrong note brings the same chain back lit and named, and you are asked for it again.',
    lightsWhilePlaying: false,
    replayAfterMiss: true,
    retryAfterMiss: true,
  },
  {
    id: 'ear-only',
    label: 'Ear only',
    meaning: 'Sound only, with no keys shown at all',
    how: 'Sound only, and a wrong note ends the chain.',
    lightsWhilePlaying: false,
    replayAfterMiss: false,
    retryAfterMiss: false,
  },
];

/**
 * What the engine does when nobody has said which rung to stand on.
 *
 * The plain game, which is what Simon was before the ladder existed: every
 * drill built straight from the catalog by a test or a tool behaves exactly as
 * it did. The *item's* default is a different question and lives in the
 * catalog (`drill.params.help`), read by the screen.
 */
export const SIMON_DEFAULT_HELP: SimonHelp = 'ear-only';

export function simonHelpLevel(help: SimonHelp): SimonHelpLevel {
  return SIMON_HELP_LEVELS.find((level) => level.id === help) ?? (SIMON_HELP_LEVELS[2] as SimonHelpLevel);
}

/**
 * A stored or authored value read as a rung, or the fallback.
 *
 * Anything unrecognised falls back rather than throwing: this reads a catalog
 * field and a `localStorage` string, and a typo in either should cost the
 * learner the help level and not the drill.
 */
export function toSimonHelp(value: unknown, fallback: SimonHelp = SIMON_DEFAULT_HELP): SimonHelp {
  return SIMON_HELP_LEVELS.find((level) => level.id === value)?.id ?? fallback;
}

/** Is this the moment to play the chain again with the keys lit? */
export function simonReplayAfterMiss(help: SimonHelp, correct: boolean): boolean {
  return !correct && simonHelpLevel(help).replayAfterMiss;
}

/**
 * How long the card is held after an answer.
 *
 * The replay is the pause: a chain of six at half a second a note is three
 * seconds of sound, and a card that moved on after the fixed beat every other
 * drill uses would cut its own help off mid-chain. So the wait is the length
 * of the chain plus a step of quiet, and a tap still ends it early — the rule
 * every miss pause follows (`engine/drills/feedback.ts`). Where there is no
 * replay this is that same fixed beat, unchanged.
 */
export function simonMissPauseMs(
  help: SimonHelp,
  chainLength: number,
  stepMs: number = SIMON_STEP_MS,
): number {
  if (!simonHelpLevel(help).replayAfterMiss) return FEEDBACK_MS;
  const step = Math.max(1, stepMs);
  return Math.max(1, Math.round(chainLength)) * step + step;
}

/**
 * Which Simon a learner at `stageNumber` opens from Today's tools (`04` §2).
 *
 * Not a choice this makes up: it is where the curriculum already puts the two
 * items. `drill.ear.simon-c-major` is an option on rungs in Stages 1 and 3 and
 * `drill.ear.simon-chromatic` from Stage 4 on, so the door on Today offers
 * whichever one the plan would have offered — a learner who has not met the
 * black keys as a memory problem is not handed them by a shortcut.
 */
export function simonForStage(stageNumber: number): string {
  return stageNumber >= 4 ? SIMON_CHROMATIC_ITEM : SIMON_C_MAJOR_ITEM;
}

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
  /** Which rung of the help ladder this game starts on (`04` §5c-2). */
  help?: SimonHelp;
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
  /**
   * The rung of the help ladder this game is on — **mutable on purpose**.
   *
   * The chips that switch it are on the card, during the game, so the rung is
   * not something the drill is constructed with and stuck on. Only one thing
   * here reads it, `settle` below, and it reads it at the moment of the miss:
   * whichever rung the learner is standing on when they play a wrong note is
   * the rung that decides what happens next, which is the only reading of it
   * that matches what they can see.
   */
  help: SimonHelp;
  private readonly chain: number[];
  private readonly stepMs: number;
  private readonly clock: Clock;
  private index = -1;
  private promptAtMs = 0;
  private heard: number[] = [];
  private answeredCurrent = false;
  private broken = false;
  /** Set by a miss on a rung that asks for the same chain again. */
  private retryPending = false;
  private readonly answers: DrillAnswer[] = [];

  constructor(options: SimonOptions & { rng: () => number }) {
    const rounds = Math.max(1, Math.min(64, options.rounds ?? SIMON_ROUNDS));
    this.chain = simonChain(simonPool(options), rounds, options.rng);
    this.stepMs = options.stepMs ?? SIMON_STEP_MS;
    this.clock = options.clock ?? systemClock;
    this.help = options.help ?? SIMON_DEFAULT_HELP;
  }

  /** How far apart the notes of the chain are played, for the screen's replay. */
  get stepMsBetweenNotes(): number {
    return this.stepMs;
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
    /**
     * The card budget, which is what stops a game that re-asks a chain from
     * running for ever.
     *
     * On the rung where a miss does not end the game, "the chain does not grow
     * until it is played right" would otherwise have no ending at all but the
     * learner's patience — and the cap already exists: the game is drawn with
     * `rounds` notes in it, so `rounds` is also how many cards it has to
     * spend. Spend four of them on the third chain and the game ends four
     * chains short, which is honest and is what the counter has said all
     * along. On every other rung this fires at exactly the moment the old code
     * ran off the end of the chain.
     */
    if (this.answers.length >= this.chain.length) return null;
    // A chain that was missed is asked again rather than grown.
    if (this.retryPending) this.retryPending = false;
    else this.index += 1;
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
    // On the ear-first rung a wrong note is not the end of the game: the chain
    // comes back with the keys lit and is asked for again, and it does not
    // grow until it is played right. Everywhere else — and by default — the
    // chain breaks where it fell, as the note at the top of this file says.
    if (!correct) {
      if (simonHelpLevel(this.help).retryAfterMiss) this.retryPending = true;
      else this.broken = true;
    }
    this.answers.push({
      promptIndex: this.index,
      correct,
      reactionMs: Math.max(0, (Number.isFinite(tMs) ? tMs : this.clock.now()) - this.promptAtMs),
      played: [...this.heard],
    });
  }

  /**
   * How many rounds were echoed right, which is the longest chain in notes.
   *
   * Still true when a miss is retried: the chain grows only on a right answer,
   * so one round can be got right at most once and the count of right answers
   * is the depth the game reached.
   */
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
