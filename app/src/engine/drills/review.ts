/**
 * Going over the ones you missed (docs/04 §5c).
 *
 * A drill that ends with "seven of ten" has named the problem and done nothing
 * about it: the three that were wrong are the only three worth playing again,
 * and the learner has just been handed a button that reshuffles all ten. So
 * the result sheet offers a second, short round built from exactly those
 * prompts.
 *
 * It is modelled as **a drill, not a mode of the screen**. The going-over is a
 * `PromptDrill` over the missed prompts with `revealed` set from the start:
 * every mark is forfeit before it is played, which is precisely what "this one
 * does not count" already means everywhere else in the engine (`reveal()`), so
 * nothing new had to be taught about scoring, and the screen's answer is the
 * one it already gives a revealed prompt — the staff and the keys, from the
 * first moment of the card. The screen's only job is to say so in words and to
 * record nothing; the alternative, a flag threaded through `settled()`,
 * `finish()` and `keep()`, would have put the rule that the second round does
 * not count in three places instead of one.
 */
import { PromptDrill } from './PromptDrill';
import type { Clock } from '../types';
import type { DrillKind, DrillPrompt, DrillResult } from './types';

/**
 * The prompts that did not count as right, in the order they were asked.
 *
 * "Did not count" is the same predicate `PromptDrill.result()` scores with — a
 * wrong answer, an unanswered prompt that `next()` recorded on the way past,
 * and an answer that was shown or played first. The last is the one worth
 * saying out loud: a prompt whose answer had to be revealed is a prompt the
 * learner could not do, which is the whole population this round is for.
 *
 * `seen` is the prompts as they were issued, because a `Drill` hands its
 * prompts out one at a time and does not offer them back.
 */
export function promptsToGoOver(
  result: DrillResult,
  seen: readonly DrillPrompt[],
): DrillPrompt[] {
  const missed = new Set(
    result.answers
      .filter((answer) => !(answer.correct && answer.revealed !== true))
      .map((answer) => answer.promptIndex),
  );
  return seen.filter((prompt) => missed.has(prompt.index));
}

export interface GoOverConfig {
  kind: DrillKind;
  anyOctave: boolean;
  promptText?: string;
  clock: Clock;
}

/**
 * The second round: the same prompts, renumbered, and revealed from the start.
 *
 * Renumbered because the index is what the screen keys a card's engraving on
 * and what the counter counts; prompts 2, 5 and 9 of the first round are
 * prompts 1, 2 and 3 of this one, and "3 of 10" on a round of three would be a
 * lie about how much is left.
 */
export function goOverDrill(config: GoOverConfig, prompts: readonly DrillPrompt[]): PromptDrill {
  return new PromptDrill({
    kind: config.kind,
    ...(config.promptText === undefined ? {} : { promptText: config.promptText }),
    anyOctave: config.anyOctave,
    clock: config.clock,
    revealed: true,
    prompts: prompts.map((prompt, index) => ({ ...prompt, index })),
  });
}
