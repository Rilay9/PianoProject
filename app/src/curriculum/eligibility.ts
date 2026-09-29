/**
 * The one gate at the consumer boundary (E0 item 3; R38, Part 23, Part 25 layer 6; one public path
 * since E2a): `eligibleFor(candidate, learner, want)` is the material gate
 * (`candidates.eligibleForMaterial`) asked of the want as the simplest material requirements
 * (`requirementsFromWant`) over the candidate contract (`candidateOf`). Every automatic offer asks
 * it, so the material layer's rule protects every learner, and no later feature can choose a weaker
 * answer: this module computes no verdict of its own, and the established questions live in one
 * private core (`eligibilityCore.ts`) that only the material gate asks. The import graph is
 * core ← candidates ← eligibility, no edge back (the reviewer's required change on the E2a brief,
 * `docs/review/responses/1b09a1f.md`; the E2 review's, `responses/2532022.md`).
 *
 * What it answers, from the facts the candidate has, and nothing else:
 *
 * 1. **Can the learner cope?** Every measured demand of the candidate is one the
 *    learner's skill state supports — the ladder's `familiar` or above on the
 *    demand's `copedWithBy` skill, the rule the repertoire slot already used — or is
 *    taught at or below the rung judging it (`session.taughtAtRung`).
 * 2. **Does it provide the opportunity claimed?** The wanted demand, or the wanted
 *    skill's opportunity, is present at a useful density (`measurement.established`:
 *    the per-demand rule in `content/sources/opportunity-density.json` for notated
 *    items, a generated family's own contract density where it states one), told apart
 *    from incidental presence.
 *
 * **Missing information is not false, and an unknown is not an observed absence.** An item whose
 * demands are `unmeasured` (a bundled row with no measurement, a score imported before the app
 * measured demands, a PDF) is eligible for exploration, the missing measurement said. For any other
 * want — an automatic experience — it is refused `unknown-forbidden` where the learner is not
 * prepared for every demand, the demands it cannot rule out and the missing measurement named (the E2
 * review's rule, moved into the one path by E2a: before, it was `exploration-only`, which refused as
 * well, for a reason that said only that a fact was missing); with nothing to rule out it is
 * `exploration-only`, as before (the reviewer's constraint (b)).
 *
 * **Not ranking** (Part 25 layer 7): the answer is eligible, ineligible with the reason,
 * or eligible for exploration only. Level orders eligible candidates in the callers and
 * rescues nothing.
 *
 * **One boundary, extended, never a second one** (D0's `skillActivation.ts`; the
 * reviewer's finding 4). A declared target skill is read only through
 * `skillActivation.declaredSkills` and `skillsInForce`: a skill the activation acts on
 * (the reading rows, as shipped) is acted on as before; any other declared skill is
 * acted on for *selection* only where the measurement establishes its opportunity. A
 * rung's skill requirement (`want.for === 'requirement'`) is served only by an item
 * whose runs the evidence readers act on — E0 never widens what earns evidence (the
 * reviewer's constraint (a)). A measured occurrence never validates a quality claim
 * such as healthy wrist rotation: this gate knows demands and densities, not execution.
 *
 * **Every offer path calls this** (the reviewer's constraint (c)): the swap sheet's
 * four tiers and its last resort (`selectors.tieredAlternatives`,
 * `session.swapOptions`), the session's skill requirement (`wantsOf`), its skill and
 * demand steps (`fallbackStep`), the repertoire slot's claim (`repertoire`) and the
 * transfer offer (`transferOffer`, D4). Same-lesson options and explicit `alternatives[]`
 * go through it too: provenance, never immunity (Part 23). A row the card takes straight
 * from a rung's own list — an authored placement, or the learner's own assignment of an
 * import — asks the teaching-use admission below and not this gate (D3b; E2a's boundary
 * test, `oneGateBoundary.test.ts`, shows that scope).
 *
 * **Before the two questions, a teaching-use decision where the item promises music**
 * (D3a; the reviewer's required change on D3). A generated item whose family promises
 * music for its recipe — the build's authored fact `provenance.facts.promise`, from the
 * contract table — and whose `provenance.review.teaching` is not `true` is refused for
 * every automatic offer (a skill, a requirement, a demand, an equivalent: a lesson's own
 * option and an authored alternative included, since authorship establishes the
 * relationship and never that unheard generated music is fit to teach) as
 * `teaching-use-not-approved`, and passes to the questions only for exploration; the
 * Library does not call this gate. **An excerpt is refused the same way** (E1a; the
 * reviewer's required change on E1 and Q59): a passage cut from a piece is music whose
 * teaching suitability is not established until a person says so, and its measured notes,
 * a boundary approved by the rules and a rung's listing establish none of it. A drill's
 * promise is its contract, and a notated song's notes are its truth, so neither is
 * touched. The route to `true` is D2's record: a `goodTeachingUse: yes` on the item's
 * current identity, merged and built — for an excerpt, the cut file's sha256, so a
 * decision on an earlier cut of the same definition fills nothing. The same reading,
 * exported alone as `admittedForTeaching` (D3b), is what the session card's rows drawn
 * straight from a rung's list pass (`session.usable`): one definition for every asker.
 */
import densityJson from '../../../content/sources/opportunity-density.json';
import { VOCABULARY_V0, type Vocabulary } from '../evidence/vocabulary';
import { candidateOf, eligibleForMaterial, requirementsFromWant, type MaterialVerdict } from './candidates';
import { measurementOf, opportunityOf, type Learner, type Want } from './eligibilityCore';
import { declaredSkills, SHIPPED_SKILL_ACTIVATION, skillsInForce, type SkillActivation } from './skillActivation';
import type { CatalogItem } from './types';

// The helpers and types that were public before E2a, unchanged; the established questions are not among them.
export { admittedForTeaching, measurementOf, uncoped, type Learner, type Want } from './eligibilityCore';

/** One demand's useful-density rule for a notated item (the file's reasons are beside each). */
export interface DensityRule {
  min: number;
  perBar: number;
  hypothesis: boolean;
  why: string;
}

/** The density file, typed: read by the build too, so the two cannot disagree about the numbers. */
export const OPPORTUNITY_DENSITY = densityJson as unknown as {
  demands: Record<string, DensityRule>;
  tempoSensitive: string[];
};

/**
 * The demands a notated item provides at a useful density, in the vocabulary's order:
 * the located count reaches the demand's `min` and its count per bar reaches `perBar`.
 * The same arithmetic as `build.established_by_density`; `eligibility.test.ts` holds
 * the two equal on every built item. The import path calls this for an imported score.
 */
export function usefulDensity(located: Readonly<Record<string, number>>, bars: number, vocabulary: Vocabulary = VOCABULARY_V0): string[] {
  return vocabulary.demands
    .map((demand) => demand.id)
    .filter((id) => {
      const rule = OPPORTUNITY_DENSITY.demands[id];
      const n = located[id] ?? 0;
      return rule !== undefined && n > 0 && n >= rule.min && n / Math.max(bars, 1) >= rule.perBar;
    });
}

/**
 * The gate's verdict, every outcome the material gate can give a want (widened by E2a, so a caller's
 * `eligible(eligibleFor(...))` typechecks with no cast that could hide one): the established
 * questions' verdicts, and the material layer's `unknown-forbidden`, `unknown-physical` and
 * `requirement` refusals — each `ineligible`, which `eligible` reads as not offered.
 */
export type Eligibility = MaterialVerdict;

/**
 * The declared target skills selection acts on for an item (E0's extension of D0's
 * boundary): every declared skill the activation acts on; any other declared skill
 * only where its opportunity is established in the measured notes. Never a skill the
 * item does not declare: measured presence alone never establishes purpose (Part 23).
 */
export function targetSkillsFor(item: CatalogItem, activation: SkillActivation = SHIPPED_SKILL_ACTIVATION, vocabulary: Vocabulary = VOCABULARY_V0): string[] {
  const active = new Set(skillsInForce(item, activation));
  const measurement = measurementOf(item);
  return declaredSkills(item).filter((skill) => {
    if (active.has(skill)) return true;
    const wanted = opportunityOf(skill, vocabulary);
    if (wanted === undefined || wanted === 'every-step' || measurement.status !== 'measured') return false;
    return wanted.some((demand) => measurement.established.includes(demand));
  });
}

/**
 * The demands an item is on its rung to practise, for "something else like this" (the
 * demand tier's want): the demands the rung teaches (`taughtAt`) — the rung it was
 * offered from, or the first rung listing it — that the item provides at a useful
 * density; for a reading row, those its declared skills' opportunities cover (the
 * reader writes them by promise). Never a demand it carries incidentally, and never an
 * older one every piece has: a swap for a 1.5 item keeps the skips 1.5 is about, not
 * the steps every tune contains, which would make the tier the catalogue by level.
 */
export function targetDemandsFor(
  item: CatalogItem,
  rungId: string | undefined,
  activation: SkillActivation = SHIPPED_SKILL_ACTIVATION,
  vocabulary: Vocabulary = VOCABULARY_V0,
): string[] {
  if (rungId === undefined) return [];
  const measurement = measurementOf(item);
  // E0b: `taughtAt` lists every rung that teaches the demand; this rung is one of them.
  const taughtHere = vocabulary.demands.filter((demand) => demand.taughtAt.includes(rungId)).map((demand) => demand.id);
  if (measurement.status === 'measured') return taughtHere.filter((demand) => measurement.established.includes(demand));
  if (measurement.status === 'runtime') {
    const promised = new Set(
      targetSkillsFor(item, activation, vocabulary).flatMap((skill) => {
        const wanted = opportunityOf(skill, vocabulary);
        return wanted === undefined || wanted === 'every-step' ? [] : [...wanted];
      }),
    );
    return taughtHere.filter((demand) => promised.has(demand));
  }
  return [];
}

/**
 * The one gate: the material gate asked of the want's requirements over the candidate contract.
 * The signature every caller had since E0; the learner carries no contact, so a want — which asks no
 * novelty — is judged as before but for the one case the E2 review's rule moves.
 */
export function eligibleFor(candidate: CatalogItem, learner: Learner, want: Want, vocabulary: Vocabulary = VOCABULARY_V0): Eligibility {
  return eligibleForMaterial(requirementsFromWant(want), candidateOf(candidate), learner, vocabulary);
}

/** Whether the verdict lets the caller offer the candidate for the want it asked. */
export function eligible(result: Eligibility): boolean {
  return result.verdict === 'eligible';
}
