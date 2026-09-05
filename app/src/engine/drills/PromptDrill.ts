// The shared machinery behind every prompt-and-answer drill.
//
// Nine of the twelve kinds in docs/05 §7 are the same shape: show or play
// something, wait for a pitch set (or sequence), score it, move on. Only the
// prompts differ, so they differ and nothing else does — `pedal`, `dynamics`
// and `backing-track` measure something other than pitch and have their own
// classes.

import { systemClock, type Clock, type EngineInput } from '../types';
import {
  DRILL_DEFAULTS,
  sameSequence,
  sameSet,
  type Drill,
  type DrillAnswer,
  type DrillKind,
  type DrillPrompt,
  type DrillResult,
} from './types';

export interface PromptDrillConfig {
  kind: DrillKind;
  prompts: DrillPrompt[];
  anyOctave: boolean;
  clock: Clock;
}

export class PromptDrill implements Drill {
  readonly kind: DrillKind;
  private readonly prompts: DrillPrompt[];
  private readonly anyOctave: boolean;
  private readonly clock: Clock;

  private index = -1;
  private promptAtMs = 0;
  private held: number[] = [];
  private readonly answers: DrillAnswer[] = [];
  private answeredCurrent = false;

  constructor(config: PromptDrillConfig) {
    this.kind = config.kind;
    this.prompts = config.prompts;
    this.anyOctave = config.anyOctave;
    this.clock = config.clock;
  }

  get current(): DrillPrompt | null {
    return this.index >= 0 && this.index < this.prompts.length
      ? (this.prompts[this.index] ?? null)
      : null;
  }

  next(): DrillPrompt | null {
    // An unanswered prompt is recorded as wrong before moving on, so skipping
    // cannot quietly improve the score.
    if (this.current && !this.answeredCurrent) {
      this.answers.push({
        promptIndex: this.index,
        correct: false,
        reactionMs: null,
        played: [...this.held],
      });
    }
    this.index += 1;
    this.held = [];
    this.answeredCurrent = false;
    this.promptAtMs = this.clock.now();
    return this.current;
  }

  feed(input: EngineInput): void {
    if (input.kind !== 'noteOn') return;
    const prompt = this.current;
    if (!prompt || this.answeredCurrent) return;
    this.held.push(input.midi);

    // An ordered answer is judged as soon as it is long enough; an unordered
    // one as soon as it matches, or when it has grown past the expected size.
    if (prompt.ordered) {
      if (this.held.length < prompt.expected.length) return;
      this.settle(sameSequence(this.held, prompt.expected, this.anyOctave), input.tMs);
      return;
    }
    if (sameSet(this.held, prompt.expected, this.anyOctave)) {
      this.settle(true, input.tMs);
      return;
    }
    const distinct = new Set(this.held).size;
    if (distinct >= prompt.expected.length) this.settle(false, input.tMs);
  }

  private settle(correct: boolean, tMs: number): void {
    this.answeredCurrent = true;
    this.answers.push({
      promptIndex: this.index,
      correct,
      // The input's own timestamp where it is on the same clock, else now.
      reactionMs: Math.max(0, (Number.isFinite(tMs) ? tMs : this.clock.now()) - this.promptAtMs),
      played: [...this.held],
    });
  }

  result(): DrillResult {
    const answered = this.answers.length;
    const correct = this.answers.filter((a) => a.correct).length;
    const reactions = this.answers
      .map((a) => a.reactionMs)
      .filter((r): r is number => r !== null && Number.isFinite(r));
    return {
      kind: this.kind,
      total: this.prompts.length,
      answered,
      correct,
      accuracy: answered > 0 ? correct / answered : 0,
      meanReactionMs:
        reactions.length > 0 ? reactions.reduce((a, b) => a + b, 0) / reactions.length : 0,
      answers: [...this.answers],
    };
  }
}

export function resolveBase(options: { count?: number; anyOctave?: boolean }): {
  count: number;
  anyOctave: boolean;
} {
  return {
    count: Math.max(1, Math.min(100, options.count ?? DRILL_DEFAULTS.count)),
    anyOctave: options.anyOctave ?? DRILL_DEFAULTS.anyOctave,
  };
}

export { systemClock };
