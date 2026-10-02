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
 * | transfer demonstrated | proficient, and supporting full-standard evidence the transfer policy reads as `demonstrated` (G2: first contact, on material that measurably differs from what established the skill on one of the skill's own dimensions; never another cut of a composition already played, G2a) |
 * | retained | transfer demonstrated, and supporting full-standard evidence on the first attempt of a day at least `RETENTION_DAYS` after the previous supporting evidence |
 * | mastered | retained, with no full-standard attempt against the skill among the last `RECENT_ATTEMPTS` (a stretch onto new material excepted) |
 *
 * **Down.** Two full-standard attempts against the skill in a row, as its
 * latest, put anything from proficient up back to familiar. An attempt against
 * that the transfer policy spares does not count towards that, nor against
 * mastery (`countsTowardsMovingDown`, a hypothesis): first contact, on material
 * measurably different on one of the skill's dimensions or carrying a demand no
 * establishing record carried — a stretch onto harder material is evidence
 * about that material, not a loss of the skill shown on the easier one. An
 * unknown fact spares nothing, and protection needs a known fact: an attempt
 * whose first contact is not recorded counts, and otherwise only a skill
 * dimension measured to differ, or a demand no establishing record carried,
 * spares it (the demands are compared only where the attempt's and every
 * establishing record's are known). Another cut of a composition already played
 * is unknown (G2a): its dimensions spare nothing, a demand no establishing record
 * carried still does. Time alone lowers nothing: a skill with no
 * supporting evidence for `RETENTION_DAYS` keeps its state and says it has not
 * been shown recently.
 *
 * **Apart.** Self-assessed evidence (a run nothing measured, answered by the
 * learner) is returned beside the state and moves nothing.
 *
 * **Supporting** is `right / n` at or above the skill's support share, the
 * vocabulary's (`supportShareOf`: the skill's own `support`, else the
 * vocabulary's; CL11b, L57). It was Part G's pass share read from the engine's
 * constant, so a change to the rungs' pass re-read every skill's history; the
 * value (0.9) did not change when it moved. `input.vocabulary` is the
 * vocabulary the share and the skill's transfer block are read from, the
 * shipped one unless given.
 *
 * **Transfer** is the transfer policy's reading (G2, `transferPolicy.ts`; audit
 * Part 26), and v0's "a different item at first contact" (`firstContact &&
 * !shownOn.has(itemId)`) is gone: a new seed of one generator is a different id
 * and not transfer, and a proficient reader failing an unfamiliar excerpt is not
 * less proficient. Every fact the policy reads is on the attempt itself (its
 * context's `firstContact`, `relationship`, `material` and `demands`, written
 * when the run was stored) and in the replay's own **established** list: each
 * supporting full-standard record before proficiency, since proficiency was last
 * lost, with its item, its material (unknown where the record has none) and its
 * demands. Promotion takes `demonstrated`; protection takes the same reading at
 * its own threshold (`sparesFailure`). The skill's transfer dimensions are the
 * vocabulary's (`skills.json`'s `transfer` block, the shipped vocabulary's entry
 * for the evidence's skill unless the input names one); a skill without the
 * block is credited no transfer. Nothing here calls back into this function: the
 * policy reads what it is handed, and `curriculum/transfer.ts` reads `established`
 * from one call (the reviewer's required change, `responses/a96395d.md`).
 *
 * **Scope beneath the summary** (`transferScope`): each `demonstrated` reading's
 * dimensions and when, never collapsed into more than the summary's `transfer`:
 * one hard success credits its dimensions and nothing else. Read by no screen
 * (the teacher model's); cleared with `transfer` when proficiency is lost, since
 * the scope is of the proficiency the summary still claims.
 */
import { dayKey } from '../data/progressStore';
import type { Evidence, MeasuredEvidence, SelfAssessedEvidence } from './evidence';
import type { Dimension, MaterialReference } from '../curriculum/transfer';
import { knownMaterial } from '../curriculum/material';
import { sparesFailure, transferReading, type EstablishedContext, type SkillTransferSource } from './transferPolicy';
import { supportShareOf, VOCABULARY_V0, type Vocabulary } from './vocabulary';

/**
 * Days between supporting evidence before a first attempt counts as retention.
 * **A hypothesis**: taken from the last step of the item review calendar
 * (1, 3, 7 and 21 days), which C6 retired; not a measured forgetting curve.
 * Also the span after which a skill is "not shown recently" — what the Skills
 * screen calls rusty since C7.
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
 * where the transfer policy spares it (`sparesFailure`: first contact, and a
 * dimension of the skill measurably different from what established it — never
 * read for another cut of a composition already played, G2a — or a demand no
 * establishing record carried). A learner proficient at level 2 who
 * reads two level-4 phrases badly at sight still reads level 2; a teacher would
 * say "level 4 is a stretch for now", not "back to familiar" (C3, the history
 * *the stretch*). An unknown fact spares nothing (G2: unknown facts are never
 * guessed into a protection verdict): contact not recorded counts, and otherwise
 * only a known fact spares — a skill dimension measured to differ, or a demand
 * no establishing record carried, read only where the attempt's and every
 * establishing record's demands are known.
 */
export function countsTowardsMovingDown(
  attempt: MeasuredEvidence,
  established: readonly EstablishedContext[],
  skill: SkillTransferSource,
  share: number = supportShareOf(skill.id),
): boolean {
  return !sparesFailure(transferReading(skill, established, attempt, share), attempt);
}

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
  /**
   * Where generalisation was shown, beneath `transfer` (G2): each `demonstrated` reading's dimensions
   * and the attempt's date-time, in order, one entry per distinct set of dimensions (its first time).
   * Empty while `transfer` is false.
   */
  transferScope: { on: Dimension[]; since: string }[];
  /**
   * What established the skill (the reviewer's fact path, item 2): each supporting full-standard
   * record before proficiency, since proficiency was last lost, as a reference — its item and its
   * material, none where the record has none (an unknown historical reference).
   */
  established: MaterialReference[];
  /** The records `established` names, in the same order: `curriculum/transfer.ts` finds their rows. */
  establishing: MeasuredEvidence[];
}

export interface LadderInput {
  /** One skill's evidence, any order. */
  evidence: readonly Evidence[];
  /** Exposure events for the skill (ISO date-times): the lesson page read, a demonstration heard. */
  exposures?: readonly string[];
  today: Date;
  /**
   * The skill, for its transfer dimensions (G2): the vocabulary's entry for the evidence's skill
   * unless given. A constructed skill in a test; no caller needs another.
   */
  skill?: SkillTransferSource;
  /** The vocabulary the support share (L57) and the skill's entry are read from: the shipped one unless given. */
  vocabulary?: Vocabulary;
}

/** `right / n` at or above the share: supporting. */
function supportsAt(evidence: MeasuredEvidence, share: number): boolean {
  return evidence.n > 0 && evidence.right / evidence.n >= share;
}

/** Whether a record supports its skill: `right / n` at or above the skill's support share in the vocabulary (L57). */
export function supports(evidence: MeasuredEvidence, vocabulary: Vocabulary = VOCABULARY_V0): boolean {
  return supportsAt(evidence, supportShareOf(evidence.skill, vocabulary));
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

  const skillId = measured[0]?.skill ?? selfAssessed[0]?.skill ?? '';
  const vocabulary = input.vocabulary ?? VOCABULARY_V0;
  const skill: SkillTransferSource = input.skill ?? vocabulary.skills.find((one) => one.id === skillId) ?? { id: skillId };
  const share = supportShareOf(skillId, vocabulary);

  let familiar = false;
  let proficient = false;
  let transfer = false;
  let retained = false;
  /** Days of supporting full-standard evidence since proficiency was last lost. */
  let fullDays = new Set<string>();
  /** The supporting full-standard records before proficiency, since it was last lost: what established it. */
  let establishing: MeasuredEvidence[] = [];
  let transferScope: { on: Dimension[]; since: string }[] = [];
  /** Failed full-standard attempts the policy spared, read again for mastery's recent attempts. */
  const spared = new Set<MeasuredEvidence>();
  let againstInARow = 0;
  let lastSupport: MeasuredEvidence | undefined;
  const seenDays = new Set<string>();

  for (const e of measured) {
    const day = dayOf(e.at);
    const firstOfDay = !seenDays.has(day);
    seenDays.add(day);
    const ok = supportsAt(e, share);
    if (ok) familiar = true;
    if (e.standard === 'full') {
      if (ok) {
        againstInARow = 0;
        if (proficient) {
          const reading = transferReading(skill, establishingContexts(establishing), e, share);
          if (reading.verdict === 'demonstrated') {
            transfer = true;
            const key = reading.on.join(',');
            if (!transferScope.some((one) => one.on.join(',') === key)) transferScope = [...transferScope, { on: reading.on, since: e.at }];
          }
          if (firstOfDay && lastSupport && dayOf(lastSupport.at) !== day && daysBetween(lastSupport.at, e.at) >= RETENTION_DAYS) {
            retained = true;
          }
        } else {
          fullDays.add(day);
          establishing = [...establishing, e];
          if (fullDays.size >= 2) proficient = true;
        }
      } else if (countsTowardsMovingDown(e, establishingContexts(establishing), skill, share)) {
        againstInARow += 1;
        if (againstInARow >= RECENT_ATTEMPTS) {
          // Down to familiar, and proficiency is shown again from here.
          proficient = false;
          transfer = false;
          retained = false;
          fullDays = new Set();
          establishing = [];
          transferScope = [];
        }
      } else {
        spared.add(e);
      }
    }
    if (ok) lastSupport = e;
  }

  const recentFull = measured.filter((e) => e.standard === 'full').slice(-RECENT_ATTEMPTS);
  const recentAgainst = recentFull.some((e) => !supportsAt(e, share) && !spared.has(e));

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

  return {
    state,
    transfer,
    retained,
    notShownRecently,
    selfAssessed,
    transferScope: transfer ? transferScope : [],
    established: establishing.map(referenceOf),
    establishing,
  };
}

/** A record as a reference (D4's `MaterialReference`): its item, and its material where it is known. */
function referenceOf(record: MeasuredEvidence): MaterialReference {
  const material = record.context.material;
  return { itemId: record.context.itemId, ...(knownMaterial(material) ? { material } : {}) };
}

/** The records as the policy reads them: the reference, and the demands the record's run measured. */
function establishingContexts(records: readonly MeasuredEvidence[]): EstablishedContext[] {
  return records.map((record) => ({
    ...referenceOf(record),
    ...(record.context.demands === undefined ? {} : { demands: record.context.demands }),
  }));
}
