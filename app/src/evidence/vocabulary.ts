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
 */
import skillsJson from '../../../content/curriculum/vocabulary/skills.json';
import demandsJson from '../../../content/curriculum/vocabulary/demands.json';
import type { Condition, Demand, DemandsFile, Skill, SkillsFile } from '../demands/vocabulary';

export interface Vocabulary {
  skills: readonly Skill[];
  demands: readonly Demand[];
  conditions: readonly Condition[];
}

/** The two files as the build checks them, typed. */
export const SKILLS_FILE = skillsJson as unknown as SkillsFile;
export const DEMANDS_FILE = demandsJson as unknown as DemandsFile;

export const VOCABULARY_V0: Vocabulary = {
  skills: SKILLS_FILE.skills,
  demands: DEMANDS_FILE.demands,
  conditions: SKILLS_FILE.conditions,
};
