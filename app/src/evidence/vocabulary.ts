/**
 * Vocabulary v0 at runtime (C3): the skills and demands files C2 wrote,
 * bundled as they are, for the evidence function and the summary sheet.
 *
 * `content/curriculum/vocabulary/*.json` stay the authority (their schemas,
 * `validate.py` and `vocabulary.test.ts` check them); this module only gives
 * them a type and one place to be imported from, so nothing in the app copies
 * a skill's conditions or a demand's detector into code. The evidence function
 * takes a `Vocabulary` as a parameter, so a test can hand it a constructed one
 * and the property test can walk this one.
 *
 * **The numbers that decide what counts** (CL11b, L57) are the vocabulary's
 * too: the support share (`supportShareOf`: a skill's own, else the
 * vocabulary's), which the ladder, the transfer policy, the demand readings
 * and the reader read, and the timing precisions (`precisionQuartersOf`: a
 * rhythm skill's own; `defaultPrecisionQuarters` for a skill whose rhythm is
 * the phrase's), which the evidence function reads. They were Part G's pass
 * share and a table in `evidence.ts`; the values did not change.
 */
import skillsJson from '../../../content/curriculum/vocabulary/skills.json';
import demandsJson from '../../../content/curriculum/vocabulary/demands.json';
import type { Condition, Demand, DemandsFile, Precision, Skill, SkillsFile, SupportShare } from '../demands/vocabulary';

export interface Vocabulary {
  skills: readonly Skill[];
  demands: readonly Demand[];
  conditions: readonly Condition[];
  /** The support share every skill reads unless it names its own (L57). */
  support: SupportShare;
  /** The precision a skill whose rhythm is the phrase's falls back to (L57). */
  precision: Precision;
}

/** The two files as the build checks them, typed. */
export const SKILLS_FILE = skillsJson as unknown as SkillsFile;
export const DEMANDS_FILE = demandsJson as unknown as DemandsFile;

export const VOCABULARY_V0: Vocabulary = {
  skills: SKILLS_FILE.skills,
  demands: DEMANDS_FILE.demands,
  conditions: SKILLS_FILE.conditions,
  support: SKILLS_FILE.support,
  precision: SKILLS_FILE.precision,
};

/**
 * The share of a skill's counted steps that must be right for a record to support it: the skill's
 * own `support`, else the vocabulary's. A skill the vocabulary does not name reads the vocabulary's.
 */
export function supportShareOf(skill: string, vocabulary: Vocabulary = VOCABULARY_V0): number {
  return vocabulary.skills.find((one) => one.id === skill)?.support?.share ?? vocabulary.support.share;
}

/** A precision as quarter-note beats. */
export function quartersOf(precision: Precision): number {
  return precision.quarters[0] / precision.quarters[1];
}

/** A rhythm skill's own precision, in quarter-note beats; `undefined` for a skill with none (its rhythm is the phrase's, or it is not timed). */
export function precisionQuartersOf(skill: string, vocabulary: Vocabulary = VOCABULARY_V0): number | undefined {
  const own = vocabulary.skills.find((one) => one.id === skill)?.precision;
  return own === undefined ? undefined : quartersOf(own);
}

/** The precision a skill whose rhythm is the phrase's falls back to where no rhythm demand is located, in quarter-note beats. */
export function defaultPrecisionQuarters(vocabulary: Vocabulary = VOCABULARY_V0): number {
  return quartersOf(vocabulary.precision);
}
