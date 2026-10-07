# E0 brief review — af665ec

**Verdict: APPROVE**

Brief reviewed: `docs/prompts/tasks/E0-measured-truth.md` at `af665ec`. This is a pre-dispatch brief review; E0 has not been implemented. **Approval of this brief does not release dispatch until D0a has its own ACCEPT response.**

## Evidence checked

I read the immutable handoff first, then the complete E0 brief, Entry 90's mechanisms and not-done sections, D0 response `0669117` findings 3–6, and audit Parts 12, 23 and 25. At `af665ec`, I checked `skillActivation.ts`, its swap, session and evidence call sites, `demands.py:55–95`, and `build.py`'s merge, notation and sections attach steps. The source supports the brief's premises: generated catalog entries do not yet carry measured demands; the bridge runs the production TypeScript detectors; the shipped skill activation still admits the reading rows; and the current selector's demand tier uses overlap without a needs-versus-taught or target-opportunity gate (`selectors.ts:177–203`).

## Findings

1. **ACCEPT — BLOCKS NEXT BRIEF.** E0's goal and scope are right. The build/import measurement, provenance, eligibility, dormant-tier activation, rung-claims report and inventory form one reviewable seam because the live tier must consume the same measured facts and gate that the report audits. The report and inventory should remain outputs of E0, with their actual findings judged in the post-build handoff; they do not need a separate pre-dispatch brief. `E0-measured-truth.md` items 1–6 and audit Part 23 establish the dependency.

2. **ACCEPT — CONSTRAINS NEXT BRIEF.** Keep the two evidence readers at the nine reading rows through E0. `ScoreScreen.ts:3139–3148` and `evidenceJob.ts:157–163,230–236` compute credit from `skillsInForce`. A notated piece's measured demands establish its musical opportunities and prerequisites, not what a run proved about a particular skill. The piece-versus-generator distinction alone does not supply an evidence grammar or fix the ladder's transfer semantics. E0 may select an eligible notated item and describe the opportunity without issuing new competence credit. D4 or a separately reviewed evidence seam must change that deliberately.

3. **ACCEPT — CONSTRAINS NEXT BRIEF.** `demands: unmeasured` may be offered for exploration or project work only, with the missing measurement stated. It must not appear as an equivalent skill-practice swap or satisfy a session skill/demand claim. This applies to every entry path, including same-rung options and explicit `alternatives[]`: `selectors.ts:182–186` currently puts them ahead of the demand tier, while audit Part 23 explicitly denies those paths immunity. The proposed `eligibleFor` result should keep this distinction observable to callers and reason text.

4. **ACCEPT — CONSTRAINS NEXT BRIEF.** The gate should remain the single runtime readiness decision, extending D0's activation boundary rather than running beside it. Check all offer paths named by the brief: `selectors.ts:177–203`, the skill requirement in `session.ts:700–724`, the skill and demand fallback in `session.ts:884–901`, and the repertoire claim. Preserve source validity and opportunity as separate questions. A measured occurrence alone cannot validate a claim such as healthy wrist rotation, and the 71 untaught-on-rung combinations are placement findings, not permission to activate a family. D0 response findings 3–6 and audit Parts 12 and 23 remain binding.

5. **LATER WAVE.** Keep the three detector misreadings visibly marked in E0's report, as the brief says, and do not treat their located counts as teaching truth. Excerpts, source ranking, and expanded evidence remain with their named later owners. The post-build review should inspect the generated report and the three learner reruns before accepting the live tiers.

## Gate and owner decision

The E0 brief is approved for dispatch **after D0a is accepted**. No owner decision is needed for the handoff's three questions.
