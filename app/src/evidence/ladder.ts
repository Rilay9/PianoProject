/**
 * The mastery ladder (C3; design 2026-09-26 §5): one skill's evidence, read
 * into one of seven states. Derived every time, never stored.
 *
 * | state | what moves a skill into it |
 * |---|---|
 * | introduced | an exposure (the lesson page read, the skill heard demonstrated) or any evidence |
 * | practised | at least one measured evidence record, of either outcome |
 * | familiar | supporting evidence at the practice standard, on at least one day |
 * | proficient | supporting evidence at the full standard on two different days, the most recent full-standard attempt supporting |
 * | transfer demonstrated | proficient, and supporting full-standard evidence on first contact with material other than where proficiency was first shown |
 * | retained | transfer demonstrated, and supporting full-standard evidence on the first attempt of a day at least `RETENTION_DAYS` after the previous supporting evidence |
 * | mastered | retained, with no full-standard attempt against the skill among the last `RECENT_ATTEMPTS` (a stretch onto new material excepted) |
 *
 * **Down.** Two full-standard attempts against the skill in a row, as its
 * latest, put anything from proficient up back to familiar. An attempt against
 * on first contact with material other than where proficiency was shown does
 * not count towards that, nor against mastery (`countsTowardsMovingDown`, a
 * hypothesis): a stretch onto harder material is evidence about that material,
 * not a loss of the skill shown on the easier one. Time alone lowers nothing:
 * a skill with no supporting evidence for `RETENTION_DAYS` keeps its state and
 * says it has not been shown recently.
 *
 * **Apart.** Self-assessed evidence (a run nothing measured, answered by the
 * learner) is returned beside the state and moves nothing.
 *
 * **Supporting** is `right / n` at or above `SUPPORT_SHARE`. The skills in v0
 * declare no threshold of their own (a report item for the vocabulary), so
 * this is Part G's pass share, the number every rung's pass already uses.
 *
 * **Different material** (transfer) is a different item, judged on the
 * evidence's `context.itemId` with `firstContact`. The design asks for a
 * different source or family, and for generated items an item whose role is
 * `transfer` for the skill; neither is on the observation yet (D adds roles),
 * so v0 cannot tell two rows of one generator from two families. Said here so
 * nobody reads v0's "transfer" as more than that.
 */
import { DEFAULT_MASTERY } from '../engine/Scoring';
import { dayKey } from '../data/progressStore';
import type { Evidence, MeasuredEvidence, SelfAssessedEvidence } from './evidence';

/**
 * Days between supporting evidence before a first attempt counts as retention.
 * **A hypothesis**: the review calendar's last step (`REVIEW_INTERVALS_DAYS`,
 * 21), not a measured forgetting curve. Also the span after which a skill is
 * "not shown recently".
 */
export const RETENTION_DAYS = 21;

/**
 * How many of the latest full-standard attempts must hold none against the
 * skill for mastery, and how many against in a row move it down. **A
 * hypothesis**: the design's recommendation, not a measured one.
 */
export const RECENT_ATTEMPTS = 2;

/**
 * Whether a full-standard attempt against the skill counts towards moving it
 * down (and against mastery). **A hypothesis**, like the two numbers above: not
 * when it was first contact with material other than where proficiency was
 * shown (`shownOn`, the items of the supporting full-standard evidence that
 * reached it). A learner proficient at level 2 who reads two level-4 phrases
 * badly at sight still reads level 2; a teacher would say "level 4 is a
 * stretch for now", not "back to familiar" (C3, the history *the stretch*).
 */
export function countsTowardsMovingDown(attempt: MeasuredEvidence, shownOn: ReadonlySet<string>): boolean {
  return !(attempt.context.firstContact && !shownOn.has(attempt.context.itemId));
}

/** `right / n` at or above this supports the skill: Part G's pass share (see the module note). */
export const SUPPORT_SHARE = DEFAULT_MASTERY.passAccuracy;

export const LADDER_STATES = [
  'not introduced',
  'introduced',
  'practised',
  'familiar',
  'proficient',
  'transfer demonstrated',
  'retained',
  'mastered',
] as const;
export type LadderState = (typeof LADDER_STATES)[number];

export interface LadderReading {
  state: LadderState;
  /** The two achievements above proficient, each on its own, whatever the state says. */
  transfer: boolean;
  retained: boolean;
  /** No supporting evidence in the last `RETENTION_DAYS` (and some before). */
  notShownRecently: boolean;
  /** The learner's own word, shown apart; never a step on the ladder. */
  selfAssessed: SelfAssessedEvidence[];
}

export interface LadderInput {
  /** One skill's evidence, any order. */
  evidence: readonly Evidence[];
  /** Exposure events for the skill (ISO date-times): the lesson page read, a demonstration heard. */
  exposures?: readonly string[];
  today: Date;
}

export function supports(evidence: MeasuredEvidence): boolean {
  return evidence.n > 0 && evidence.right / evidence.n >= SUPPORT_SHARE;
}

const DAY_MS = 86_400_000;

function dayOf(at: string): string {
  return dayKey(new Date(at));
}

/** Whole local days from one date-time to another. */
function daysBetween(from: string, to: string): number {
  const a = new Date(dayOf(from) + 'T00:00:00');
  const b = new Date(dayOf(to) + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/**
 * One skill's evidence, read into a ladder state (see the module note). Pure.
 *
 * The history is replayed in order, because the two rules about proficiency
 * are about order: it is reached on a supporting full-standard attempt (the
 * most recent one then supports), and it is lost only when two full-standard
 * attempts in a row go against it, not on the first. Replaying is still
 * deriving: the same list gives the same state, and nothing is stored.
 */
export function ladderState(input: LadderInput): LadderReading {
  const measured = input.evidence
    .filter((e): e is MeasuredEvidence => e.kind === 'measured')
    .sort((a, b) => a.at.localeCompare(b.at));
  const selfAssessed = input.evidence.filter((e): e is SelfAssessedEvidence => e.kind === 'self-assessed');

  let familiar = false;
  let proficient = false;
  let transfer = false;
  let retained = false;
  /** Days of supporting full-standard evidence since proficiency was last lost. */
  let fullDays = new Set<string>();
  /** The items supporting full-standard evidence came from before proficiency was reached. */
  let shownOn = new Set<string>();
  let againstInARow = 0;
  let lastSupport: MeasuredEvidence | undefined;
  const seenDays = new Set<string>();

  for (const e of measured) {
    const day = dayOf(e.at);
    const firstOfDay = !seenDays.has(day);
    seenDays.add(day);
    const ok = supports(e);
    if (ok) familiar = true;
    if (e.standard === 'full') {
      if (ok) {
        againstInARow = 0;
        if (proficient) {
          if (e.context.firstContact && !shownOn.has(e.context.itemId)) transfer = true;
          if (firstOfDay && lastSupport && dayOf(lastSupport.at) !== day && daysBetween(lastSupport.at, e.at) >= RETENTION_DAYS) {
            retained = true;
          }
        } else {
          fullDays.add(day);
          shownOn.add(e.context.itemId);
          if (fullDays.size >= 2) proficient = true;
        }
      } else if (countsTowardsMovingDown(e, shownOn)) {
        againstInARow += 1;
        if (againstInARow >= RECENT_ATTEMPTS) {
          // Down to familiar, and proficiency is shown again from here.
          proficient = false;
          transfer = false;
          retained = false;
          fullDays = new Set();
          shownOn = new Set();
        }
      }
    }
    if (ok) lastSupport = e;
  }

  const recentFull = measured.filter((e) => e.standard === 'full').slice(-RECENT_ATTEMPTS);
  const recentAgainst = recentFull.some((e) => !supports(e) && countsTowardsMovingDown(e, shownOn));

  let state: LadderState = 'not introduced';
  if ((input.exposures?.length ?? 0) > 0 || input.evidence.length > 0) state = 'introduced';
  if (measured.length > 0) state = 'practised';
  if (familiar) state = 'familiar';
  if (proficient) state = 'proficient';
  if (proficient && transfer) state = 'transfer demonstrated';
  if (proficient && transfer && retained) state = 'retained';
  if (proficient && transfer && retained && !recentAgainst) state = 'mastered';

  const notShownRecently =
    lastSupport !== undefined && daysBetween(lastSupport.at, input.today.toISOString()) >= RETENTION_DAYS;

  return { state, transfer, retained, notShownRecently, selfAssessed };
}
