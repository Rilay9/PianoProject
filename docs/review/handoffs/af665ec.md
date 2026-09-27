# Reviewer handoff — E0's brief, the pre-dispatch gate (a brief handoff: no implementation to review)

Brief HEAD: af665ec (the commit that carries `docs/prompts/tasks/E0-measured-truth.md` as amended after D0 landed, with the four constraints from `responses/0669117.md` appended). Respond in `responses/af665ec.md`. Nothing is built; this is the second of the two gates per task (the brief before dispatch), which the pull-request trigger only fires for a file under `handoffs/` — hence this file.

## What is asked

A pre-dispatch read of the brief: is the goal right, are the decided items the right decisions, is anything decided here that should be the builder's judgement or a later brief's, and is anything missing that E0 must carry from D0's review? Dispatch waits for **both** D0a's ACCEPT and this brief's approval. The reply's vocabulary: APPROVE (dispatch on D0a's ACCEPT), BLOCKING (the brief changes before dispatch, with the line), QUESTION (the owner's), FIX-FORWARD (carried to a later brief with a row id).

## Files to inspect, in order

1. `docs/prompts/tasks/E0-measured-truth.md` at af665ec — the goal, the seven decided items, the verification layers, the two inherited hypotheses, the rules and files, the two addenda (Q24's prerequisite; the D0 response's four constraints).
2. `docs/prompts/entry-90.md` §"The mechanisms" and §"Not done" — what D0 left to E: measured demands onto the catalogue (E23), placement of the 71 untaught-on-rung combinations (L101), the candidate skill and the evidence activation order (L102), the three detector readings (E22).
3. `docs/review/responses/0669117.md` findings 3–6 — the constraints the brief now carries verbatim in substance.
4. `docs/prompts/views/audit/part-12.md`, `part-23.md`, `part-25.md` — the reviewer's own sections the brief builds on (the needs-versus-taught gate over the actual arrangement; eligibility → relationship → ranking; the chooser's axes, of which E0 builds layers 3, 5 and 6 only).
5. `app/src/curriculum/skillActivation.ts` and its five call sites; `tools/content/demands.py` (`measure_opportunities`); `tools/content/build.py` (`attach_notation`, `attach_sections`) — the premises the brief names, verified at the lines on 2026-09-27.

## The decisions the orchestrator made in the brief, for the reviewer to accept or overturn

- The gate `eligibleFor` takes over the boundary's three curriculum readers (the swap tier, the session's skill want and skill fallback) and **leaves the two evidence readers at the nine reading rows** until D4 teaches the ladder role and family. E0 never widens what earns evidence.
- One measurement: the build's attach step measures every notated **and generated** item through the bridge; D0's build-time suite then reads the catalogue's ids or keeps its own run for the red lines (the builder's call), never a second definition.
- The rung-claims report carries D0's 71 untaught-on-rung combinations and marks the three known detector misreadings rather than fixing detectors; nothing is removed from a rung; the validator's check is a warning until the reviewer says otherwise.
- `familiar` stays the floor for "can cope" unless the three constructed learners are locked out; the per-demand useful-density minimums for notated items are the builder's hypotheses, stated with reasons.
- Not E0's: excerpts (E1), the chooser's other layers and the import workflow (E2), the vocabulary, the detectors' readings, Today's layout, the evidence readers.

## Questions for the reviewer

1. Is holding the evidence readers at the reading rows through E0 the right boundary, or should E0 already let *notated* items' measured demands feed evidence where the ladder's transfer blindness does not apply (a piece is not a seed of a family)?
2. The brief has the gate answer "eligible for exploration only" for `demands: unmeasured`. Should an unmeasured item be offered at all in a skill-practice slot's swap sheet, even labelled, or only in project and exploration slots?
3. Is one brief the right size for items 1–6 (demands, provenance, the gate, the tiers live, the report, the inventory), or should the report and the inventory (5, 6) be their own seam after the gate is proven?

## Do not re-review

D0's implementation (`handoffs/0669117.md`, answered in `responses/0669117.md`); D0a (its own handoff when it lands); every closed seam.
