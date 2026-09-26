/**
 * The reading state (C4 item 0): what a learner's stored reads say about each
 * reading skill, as one ladder reading per skill. Derived every time, never
 * stored.
 *
 * **Where the evidence comes from.** The evidence function (`evidence.ts`)
 * needs the notation actually played, and the score model of a generated
 * phrase exists only while the Score screen has it loaded. So the screen
 * computes the evidence once, at record time, and stores the results on the
 * row (`SessionRow.evidence`), stamped with the evidence's own version
 * (`SessionRow.evidenceDefinitions`, C4a). That is a cache of a derived value
 * (design §5 allows one), not a stored state: this module reads it back and
 * derives the state from it every time.
 *
 * **What contributes.** A row whose evidence stamp is `EVIDENCE_DEFINITIONS`
 * and which carries stored evidence. A row with none (written before C4, or by
 * a screen that had no model), or one stamped with another evidence version —
 * every row C4 stored, whose evidence had no stamp of its own — contributes
 * nothing: it is not re-derived here, because re-deriving needs the played
 * model, which a row does not carry (`recomputeEvidence` does it for a caller
 * that has the model). The observation's `definitions` is the observation's
 * and decides nothing here. Refusals are kept on the row for the sheet and the
 * record; only evidence reaches the ladder.
 *
 * **The reading strand.** Every vocabulary skill whose kind is reading,
 * rhythm, coordination or continuity: all of v0 but `position-shift`, which is
 * a technique (moving the hand), not a way of reading.
 *
 * Each evidence record is dated by its row (`SessionRow.at`, what the store
 * wrote), which is within the second of the date the screen gave it.
 */
import type { SessionRow } from '../data/db';
import type { Skill, SkillKind } from '../demands/vocabulary';
import { EVIDENCE_DEFINITIONS, isRefusal, type Evidence } from './evidence';
import { ladderState, type LadderReading } from './ladder';
import type { Vocabulary } from './vocabulary';

/** The kinds of skill the reading strand holds (see the module note). */
export const READING_STRAND_KINDS: readonly SkillKind[] = ['reading', 'rhythm', 'coordination', 'continuity'];

export interface SkillState {
  skill: Skill;
  /** The ladder's reading of the skill's evidence, today. */
  reading: LadderReading;
  /** The evidence it was read from, oldest first: what a reason line may cite. */
  evidence: Evidence[];
}

/**
 * The evidence one row contributes: what the screen stored with it, when the
 * evidence is stamped with the evidence definitions in force; nothing
 * otherwise.
 */
export function storedEvidence(row: SessionRow): Evidence[] {
  if (row.evidenceDefinitions !== EVIDENCE_DEFINITIONS || !Array.isArray(row.evidence)) return [];
  const out: Evidence[] = [];
  for (const result of row.evidence) {
    if (isRefusal(result)) continue;
    out.push({ ...result, at: row.at, observationId: row.id ?? result.observationId });
  }
  return out;
}

/**
 * One ladder reading per reading skill, from the evidence the rows stored.
 * Pure: the same rows, vocabulary and day give the same state.
 */
export function readingState(rows: readonly SessionRow[], vocabulary: Vocabulary, today: Date): SkillState[] {
  const bySkill = new Map<string, Evidence[]>();
  for (const row of rows) {
    for (const evidence of storedEvidence(row)) {
      const list = bySkill.get(evidence.skill) ?? [];
      list.push(evidence);
      bySkill.set(evidence.skill, list);
    }
  }
  return vocabulary.skills
    .filter((skill) => READING_STRAND_KINDS.includes(skill.kind))
    .map((skill) => {
      const evidence = (bySkill.get(skill.id) ?? []).sort((a, b) => a.at.localeCompare(b.at));
      return { skill, reading: ladderState({ evidence, today }), evidence };
    });
}
