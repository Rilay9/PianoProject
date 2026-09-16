/**
 * What happens after an answer that was not right (docs/04 §5c).
 *
 * Two decisions, both of them pure, both of them previously nowhere: how long
 * a card stays up once it has been missed, and which prompts a second round is
 * built from. The screen draws; these decide.
 */
import { describe, expect, it } from 'vitest';
import {
  FEEDBACK_MS,
  MISS_PAUSE_MS,
  REVEALABLE_KINDS,
  feedbackDelayMs,
  showsAnswerAfter,
} from '../../src/engine/drills/feedback';
import { PromptDrill } from '../../src/engine/drills/PromptDrill';
import { goOverDrill, promptsToGoOver } from '../../src/engine/drills/review';
import type { DrillPrompt } from '../../src/engine/drills/types';
import type { EngineInput } from '../../src/engine/types';

function noteOn(midi: number, tMs = 0): EngineInput {
  return { kind: 'noteOn', midi, velocity: 80, tMs, confidence: 1 };
}

/** A clock that only moves when a test says so. */
function fakeClock(): { now: () => number; set: (ms: number) => void } {
  let t = 0;
  return {
    now: () => t,
    set: (ms) => {
      t = ms;
    },
  };
}

function prompts(): DrillPrompt[] {
  return [
    { index: 0, label: 'C', expected: [60, 64, 67] },
    { index: 1, label: 'F', expected: [65, 69, 72] },
    { index: 2, label: 'G', expected: [67, 71, 74] },
    { index: 3, label: 'Dm', expected: [62, 65, 69] },
  ];
}

function chordDrill(): PromptDrill {
  return new PromptDrill({
    kind: 'chord',
    prompts: prompts(),
    anyOctave: true,
    clock: fakeClock(),
  });
}

describe('a miss keeps its card up for longer than a hit', () => {
  it('holds a missed card, where there is an answer to show on it', () => {
    for (const kind of REVEALABLE_KINDS) {
      expect(showsAnswerAfter(kind, false), kind).toBe(true);
      // The relationship, not the number: a miss is held longer than a hit.
      expect(feedbackDelayMs(kind, false), kind).toBeGreaterThan(feedbackDelayMs(kind, true));
      expect(feedbackDelayMs(kind, false), kind).toBe(MISS_PAUSE_MS);
    }
    expect(MISS_PAUSE_MS).toBeGreaterThan(FEEDBACK_MS);
  });

  it('leaves a right answer as fast as it was', () => {
    for (const kind of REVEALABLE_KINDS) {
      expect(showsAnswerAfter(kind, true), kind).toBe(false);
      expect(feedbackDelayMs(kind, true), kind).toBe(FEEDBACK_MS);
    }
  });

  it('changes nothing for the kinds with no keys to light', () => {
    // An ear kind's answer *is* the sound, and the kinds with a flow of their
    // own have no single set of keys to show — so a miss there is as quick as
    // it ever was, right or wrong.
    for (const kind of ['ear-interval', 'ear-chord', 'ear-tune', 'simon', 'rhythm', 'pedal', 'dynamics', 'backing-track', 'harmonic-dictation', 'transposition', 'call-response'] as const) {
      expect(showsAnswerAfter(kind, false), kind).toBe(false);
      expect(feedbackDelayMs(kind, false), kind).toBe(feedbackDelayMs(kind, true));
    }
  });
});

describe('going over the ones you missed', () => {
  /** Plays a set: the first right, the second wrong, the third skipped. */
  function aSetWithMisses(): { drill: PromptDrill; seen: DrillPrompt[] } {
    const drill = chordDrill();
    const seen: DrillPrompt[] = [];
    const take = (): DrillPrompt | null => {
      const prompt = drill.next();
      if (prompt) seen.push(prompt);
      return prompt;
    };
    take();
    for (const midi of [60, 64, 67]) drill.feed(noteOn(midi));
    take();
    for (const midi of [61, 63, 66]) drill.feed(noteOn(midi));
    take();
    // Nothing played: `next()` records a skipped prompt as wrong on the way past.
    take();
    // The fourth is shown before it is answered, so it is right and does not count.
    drill.reveal();
    for (const midi of [62, 65, 69]) drill.feed(noteOn(midi));
    take();
    return { drill, seen };
  }

  it('is built from the prompts that did not count, and only those', () => {
    const { drill, seen } = aSetWithMisses();
    const missed = promptsToGoOver(drill.result(), seen);
    expect(missed.map((prompt) => prompt.label)).toEqual(['F', 'G', 'Dm']);
    // The one that was right is the one that is not there.
    expect(missed.some((prompt) => prompt.label === 'C')).toBe(false);
    // And it is as many as the set said were not right.
    const result = drill.result();
    expect(missed.length).toBe(result.answered - result.correct);
  });

  it('renumbers them, so the counter counts this round and not the last', () => {
    const { drill, seen } = aSetWithMisses();
    const missed = promptsToGoOver(drill.result(), seen);
    const round = goOverDrill(
      { kind: 'chord', anyOctave: true, clock: fakeClock() },
      missed,
    );
    expect(round.result().total).toBe(missed.length);
    const indexes: number[] = [];
    for (let prompt = round.next(); prompt; prompt = round.next()) indexes.push(prompt.index);
    expect(indexes).toEqual(missed.map((_, at) => at));
  });

  it('counts nothing, however well it goes', () => {
    // The round is revealed from the start, which is what "this one does not
    // count" already means in the engine — so a going-over played perfectly
    // still scores nothing, and there is no result for the screen to record.
    const { drill, seen } = aSetWithMisses();
    const round = goOverDrill(
      { kind: 'chord', anyOctave: true, clock: fakeClock() },
      promptsToGoOver(drill.result(), seen),
    );
    expect(round.revealed).toBe(true);
    for (let prompt = round.next(); prompt; prompt = round.next()) {
      for (const midi of prompt.expected) round.feed(noteOn(midi));
    }
    const result = round.result();
    expect(result.answered).toBeGreaterThan(0);
    expect(result.answers.every((answer) => answer.correct)).toBe(true);
    expect(result.answers.every((answer) => answer.revealed === true)).toBe(true);
    expect(result.correct).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  it('has nothing to offer when nothing was missed', () => {
    const drill = chordDrill();
    const seen: DrillPrompt[] = [];
    for (let prompt = drill.next(); prompt; prompt = drill.next()) {
      seen.push(prompt);
      for (const midi of prompt.expected) drill.feed(noteOn(midi));
    }
    expect(promptsToGoOver(drill.result(), seen)).toEqual([]);
  });
});
