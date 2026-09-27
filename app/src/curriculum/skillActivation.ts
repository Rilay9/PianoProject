/**
 * The one boundary between an item's declared target skills and what the app does with
 * them at runtime (D0 item 9; the reviewer's ruling of 2026-09-26).
 *
 * `targetSkills` is declared data. Four places act on it: the swap sheet's skill tier
 * (`selectors.tieredAlternatives`), the session's skill requirement and its skill
 * fallback step (`session.ts`), and the evidence a run is computed as (the Score screen's
 * sheet and `data/evidenceJob`). Until D0 only the nine reading rows declared a skill, so
 * every one of those readers acted on the reading rows and nothing else. D0 writes truthful
 * target skills on the generated families from their contracts
 * (`tools/content/family_contracts.json`), and writing them must not, by itself, change
 * what a learner is offered or credited with: C6's skill tier was built dormant for them,
 * and the ladder cannot yet tell a new seed of one family from transfer (`ladder.ts`: "v0
 * cannot tell two rows of one generator from two families"; D0's roles say a new seed is
 * never transfer).
 *
 * So every runtime reader asks this module, never `item.targetSkills` directly
 * (`skillActivationBoundary.test.ts` holds that), and the shipped activation is the one
 * that was already in force: the reading rows. Turning a family on is a deliberate,
 * test-visible change here. E extends this same boundary with its needs-versus-taught and
 * measured-demand checks rather than writing a second readiness check beside it (`02`
 * Part E2, "Who reads the contract").
 *
 * **E0 did** (`eligibility.ts`, the one gate): the evidence readers keep
 * `skillsInForce` at the shipped activation, so no new run earns credit; selection
 * reads `declaredSkills` through the gate, which acts on a declared skill beyond the
 * active ones only where the item's measured notes establish its opportunity and the
 * learner can cope. A rung's skill requirement is still served only by what the
 * evidence readers act on, because only those runs can meet it.
 */
import type { CatalogItem } from './types';

/** Whether the runtime acts on this item's declared target skills. */
export type SkillActivation = (item: CatalogItem) => boolean;

/**
 * What ships: the reading rows, whose skills C2 declared, whose phrases C4 measures on
 * every run, and which C6's tiers already select by. A generated family's skills are
 * carried in the catalog and read by the build's gates, and not acted on here.
 */
export const SHIPPED_SKILL_ACTIVATION: SkillActivation = (item) => item.drill?.kind === 'sight-reading';

/**
 * Every declared skill acted on. For tests that exercise the skill tier and the skill
 * step on constructed items, so that activating them is written where it is used.
 */
export const EVERY_DECLARED_SKILL: SkillActivation = () => true;

/** The target skills the runtime acts on for an item: its declared ones where active, else none. */
export function skillsInForce(item: CatalogItem | undefined, activation: SkillActivation = SHIPPED_SKILL_ACTIVATION): readonly string[] {
  if (item === undefined || !activation(item)) return [];
  return item.targetSkills ?? [];
}

/**
 * The item's declared target skills, unfiltered, for the one gate that decides
 * which of them *selection* acts on (E0: `eligibility.ts`, and nothing else;
 * `skillActivationBoundary.test.ts` holds that). This is how E extends the
 * boundary rather than writing a second one: a declared skill beyond the active
 * ones is acted on for choosing material only where the item's measured demands
 * establish its opportunity and the learner can cope — the gate's two questions —
 * and never for evidence, whose readers keep `skillsInForce` at the shipped
 * activation (E0 never widens what earns evidence; L102, D4).
 */
export function declaredSkills(item: CatalogItem | undefined): readonly string[] {
  return item?.targetSkills ?? [];
}
