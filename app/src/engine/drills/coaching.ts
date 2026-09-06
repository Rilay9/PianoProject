/**
 * One sentence of coaching after a drill (replan §6).
 *
 * Rules, not a model. Five of them, each firing on a pattern a teacher would
 * notice and a learner usually cannot see in themselves: being accurate but
 * slow, being fast but wrong, lifting the pedal consistently early or late,
 * a dynamic contrast stuck under target, and three runs that have not moved.
 *
 * The whole thing is pure — kind, this result, the last few runs in, at most
 * one sentence out — so every rule is testable and nothing here can reach the
 * database, the clock or the network. At most one, deliberately: a screen that
 * offers four observations after a two-minute drill is a screen nobody reads.
 *
 * The thresholds are all named constants and all of them are guesses that have
 * never met this learner. They are in one place so that changing them is a
 * one-line change when he says which ones are wrong.
 */
import type { DrillResult } from './types';

/** A previous run, as `sessions` stores it. */
export interface PastRun {
  accuracy: number;
  /** `detail` is not stored, so history is judged on accuracy alone. */
  at?: string;
}

export interface Coaching {
  /** The sentence to show. */
  text: string;
  /** Which rule fired — for tests, and for the lesson link when there is one. */
  rule: 'slow-but-accurate' | 'fast-and-wrong' | 'pedal-timing' | 'dynamics-short' | 'plateau';
  /** A lesson to send him to, when the rule has one. */
  lessonId?: string;
}

/** Above this mean reaction, an accurate run is a slow one. */
export const SLOW_MS = 2500;
/** At or above this, "accurate" is fair. */
export const ACCURATE = 0.9;
/** Below this mean reaction, a wrong run is a rushed one. */
export const FAST_MS = 1200;
/** At or below this, "wrong" is fair. */
export const INACCURATE = 0.7;
/** Mean pedal reaction beyond this, consistently signed, is a timing habit. */
export const PEDAL_BIAS_MS = 80;
/** How close to the target ratio counts as having reached it. */
export const DYNAMICS_MARGIN = 0.9;
/** Runs to look back over for a plateau, including this one. */
export const PLATEAU_RUNS = 3;
/** Accuracy movement smaller than this over those runs is no movement. */
export const PLATEAU_BAND = 0.05;

/** The lesson a plateau sends him to (P17's practice module). */
export const PLATEAU_LESSON = 'practice.5';

/**
 * The mean signed reaction over the answers that have one.
 *
 * The pedal drill reports a negative reaction for a lift that came before the
 * chord and a positive one for a lift that came after, so the *mean* is the
 * habit and the spread is the noise. A player who is 100 ms early every time
 * has a different problem from one who is 100 ms out at random, and only the
 * first is worth a sentence.
 */
export function meanSignedReaction(result: DrillResult): number | null {
  const values = result.answers
    .map((answer) => answer.reactionMs)
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** True when every reaction has the same sign — a habit, not scatter. */
export function consistentlySigned(result: DrillResult): boolean {
  const values = result.answers
    .map((answer) => answer.reactionMs)
    .filter((value): value is number => value !== null);
  if (values.length < 3) return false;
  return values.every((value) => value > 0) || values.every((value) => value < 0);
}

/**
 * At most one sentence about how that run went.
 *
 * `null` is the common answer and the right one: most runs need no comment,
 * and a screen that always says something teaches the learner to stop reading
 * it.
 */
export function coach(
  kind: string,
  result: DrillResult,
  recent: PastRun[] = [],
): Coaching | null {
  if (result.answered === 0) return null;

  // --- the pedal's own rule, before the general ones ----------------------
  // It comes first because a pedal run that is accurate and slow is not slow:
  // the reaction *is* the thing being measured, and the general rule would
  // read a deliberate late change as hesitation.
  if (kind === 'pedal') {
    const mean = meanSignedReaction(result);
    if (mean !== null && Math.abs(mean) >= PEDAL_BIAS_MS && consistentlySigned(result)) {
      return mean < 0
        ? {
            rule: 'pedal-timing',
            text: `Your pedal changes are landing about ${String(Math.round(-mean))} ms early, every time — you are changing with the chord rather than just after it. Play the chord first, then lift and put the pedal back down.`,
          }
        : {
            rule: 'pedal-timing',
            text: `Your pedal changes are landing about ${String(Math.round(mean))} ms late, every time. The old harmony is still sounding when the new one arrives; change a little sooner after the chord.`,
          };
    }
  }

  // --- the dynamics drill's own rule --------------------------------------
  if (kind === 'dynamics') {
    const ratio = result.detail?.ratio;
    const target = result.detail?.targetRatio;
    if (ratio !== undefined && target !== undefined && ratio < target * DYNAMICS_MARGIN) {
      return {
        rule: 'dynamics-short',
        text: `Your loud notes are only ${ratio.toFixed(1)}× the quiet ones and the target is ${target.toFixed(1)}×. Use arm weight for the loud ones rather than pressing harder — and exaggerate: the contrast is always smaller than it feels.`,
      };
    }
  }

  // --- the two general ones ------------------------------------------------
  if (result.accuracy >= ACCURATE && result.meanReactionMs >= SLOW_MS) {
    return {
      rule: 'slow-but-accurate',
      text: `That was ${String(Math.round(result.accuracy * 100))}% right, which is the hard part — now the same again but faster. Answer at the first thing that comes to you rather than checking it.`,
    };
  }
  if (result.accuracy <= INACCURATE && result.meanReactionMs <= FAST_MS) {
    return {
      rule: 'fast-and-wrong',
      text: `Fast, but ${String(Math.round(result.accuracy * 100))}% right. Slow down until you are getting them right — speed built on guessing does not survive the next tempo.`,
    };
  }

  // --- the plateau, last ---------------------------------------------------
  // Last because it is the least specific: anything above is a better thing to
  // say than "this has not moved".
  const history = [...recent.slice(0, PLATEAU_RUNS - 1).map((run) => run.accuracy), result.accuracy];
  if (history.length >= PLATEAU_RUNS) {
    const best = Math.max(...history);
    const worst = Math.min(...history);
    if (best - worst < PLATEAU_BAND) {
      return {
        rule: 'plateau',
        lessonId: PLATEAU_LESSON,
        text: `Three runs at about the same score. That is a plateau, and doing the same thing a fourth time rarely breaks one — change the tempo, the key, or the order.`,
      };
    }
  }
  return null;
}
