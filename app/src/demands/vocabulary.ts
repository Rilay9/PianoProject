/**
 * The shape of vocabulary v0 (C2): `content/curriculum/vocabulary/skills.json`
 * and `demands.json`.
 *
 * Types only. The detectors are code (`detect.ts`); the files themselves are
 * bundled for the evidence function by `evidence/vocabulary.ts` (C3), which
 * reads the skills' observables and conditions from them. The files' own schemas
 * (`skills.schema.json`, `demands.schema.json` beside them) are the authority;
 * `validate.py` checks them and their references on every build.
 */
import type { DetectorId } from './detect';

/** What kind of ability a skill is (design §11 item 1); decides the shape of its criterion. */
export type SkillKind = 'reading' | 'rhythm' | 'coordination' | 'technique' | 'continuity';

/** A channel a run measures. `velocity`, `pedal` and `continuity` come when they are built. */
export type Channel = 'pitch' | 'timing';

/** A run condition a skill's standard can require (Keep tempo, unseen, the guide off, both hands). */
export type ConditionId = 'keep-tempo' | 'unseen' | 'guide-off' | 'both-hands';

export interface Condition {
  id: ConditionId;
  meaning: string;
  /**
   * The field or rule that records whether a run met it, or `null` where no
   * run records it today. A standard that names an unrecorded condition is one
   * no run can be shown to meet, and the build refuses a rung that requires it.
   */
  recordedBy: string | null;
}

export interface Skill {
  /** Today's concept id wherever it reads as an ability (reviewer decision 2). */
  id: string;
  /** True for the one id v0 had to add because no concept named the ability. */
  newId?: boolean;
  display: string;
  /** The ability in a teacher's sentence. */
  sentence: string;
  kind: SkillKind;
  /** The demand ids whose steps exercise it, or every step of the music played. */
  opportunity: string[] | 'every-step';
  /** How a run shows it, or `none`: then no run can be evidence for it. */
  observable: Channel[] | 'none';
  /** The parts of the ability no run measures yet, and why. Required with `none`. */
  unobserved?: string[];
  /** The run conditions for the practice standard and for the full one (design §4(c)). */
  standards: { practice: ConditionId[]; full: ConditionId[] };
  note?: string;
}

/**
 * The skills file. A rung names a skill in its own `requirements` (C5,
 * `curriculum/types.ts`); C2's interim table of `mastery.custom` terms and the
 * build gate's waivers went with the terms.
 */
export interface SkillsFile {
  conditions: Condition[];
  skills: Skill[];
}

/**
 * The musical dimension a demand belongs to (C4b): what kind of musical fact it
 * is, from `demands.schema.json`'s closed list. Which generator option writes
 * or removes a demand is app code (`engine/readingControls.ts`), not vocabulary.
 */
export type DemandDimension = 'clef' | 'interval' | 'rhythm' | 'metre' | 'key' | 'accidental' | 'range' | 'texture';

export interface Demand {
  /** `family.name`, e.g. `rhythm.triplets`. */
  id: string;
  display: string;
  dimension: DemandDimension;
  /** Which function in `detect.ts` finds it. */
  detector: DetectorId;
  /** The skill that copes with it: one reviewed table, the start of `needsSkills`. */
  copedWithBy: string;
  /** The rung that teaches it, or `null` with `taughtAtNote` where none does. */
  taughtAt: string | null;
  taughtAtNote?: string;
}

export interface DemandsFile {
  demands: Demand[];
}
