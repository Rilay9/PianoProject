### Entry 230 — CL12a

A learner must not be told “Review” merely because a row occupies the review budget, or “Learn” merely because the row came from an unfinished lesson. The same fallback currently serves already-counted material and other material from that lesson. No implementation pass or complete slice is claimed.

## Stop required by the brief: the no-due rung fallback lacks an objective

Read at base `d1b40b9828eeeaf62889d9509effddd05f32cb51`:
- `app/src/curriculum/session.ts:1447–1451`: `review(ctx, 'fallback')` computes counted items and orders them before uncounted items, then calls the generic fallback.
- `:991–993`: `countedOnStrands` draws ids from requirement readings' counted items; it supplies an ordering preference, not a purpose or objective reference.
- `:1100–1126`: the rung step selects an own option and emits `{ kind: 'rung', rung, strand?, held? }`. Neither the selecting requirement nor whether that option was counted is retained in this claim.
- `:523`: the public rung claim carries only that lesson, strand and held flag.
- `:1692` and `:1734–1735`: composition preserves the claim/reason, but no source describing consolidation versus direct unmet work.

The approved design explicitly says a rung/prerequisite/exposure/jam fallback receives a purpose from the selecting objective; if the claim cannot establish it, preserve the reason and hand back the ambiguous case. The brief's “Stop and hand back if” repeats that boundary. This is that case, not a proposal to change L96's selection in slice A.

The exact ambiguous case is a no-due review row selected by the rung step. The preferred item can already have counted for a requirement while another requirement on the same rung remains unmet. The alternative can be an uncounted option. The rung claim and honest reason name the same lesson in both situations. An unfinished lesson alone does not establish which objective this attempt serves; membership in counted items does not identify a musical skill to consolidate. No fixture outcome establishes the missing pedagogical intent.

## Concrete options for the orchestrator

1. **Preserve unknown purpose for this fallback.** Keep `intent` absent and its honest reason. For a newly composed ambiguous row, show its minutes and existing reason with no purpose badge; do not inherit “Review” from its arrangement kind. Continue labels for claims whose purpose is settled (retention, asked, ready, transfer and the specified reading decisions). Legacy stored rows retain their historical presentation. This is the recommended narrow interpretation of the approved design, but needs an explicit slice-A disposition because the brief asks for the five labels across rows.
2. **Record a selecting objective before labelling it.** Extend the in-memory choice/claim with an existing requirement reference and whether this selection is direct unmet work or consolidation. Retain selection/order/gates unchanged. A genuinely unidentified objective still stays unknown. Do not label every counted item application or every uncounted item development: neither fact by itself settles the objective. If defining the missing objective changes the lesson-filler policy, that is L96 and belongs to a later slice.

No owner coordination is needed: the orchestrator can disposition this case in the published checks/relay and the build resumes on this branch. No selection change, stored migration, purpose inferred from a frozen sentence, or new teaching judgement was made here.

## Red-first checkpoint

`app/tests/unit/cl12aForwardBoundary.test.ts` adds five cases around the established forward boundary: behind-placement exhaustion, legacy carry-over, invalid placement, strict blocked-ahead work, genuine core exhaustion. Expected on base: the first two red, the remaining three green. These predictions are not results. They are a partial test set, not the full slice-A acceptance list. The independent five-learner diary measurement and browser cases remain required.

## Not done

No app implementation, intent type/validation, shared summary, row label change, browser spec, documentation update or full red-first set is submitted. No claim to have closed L93. The ambiguity was checked in the actual selecting functions before assigning purpose; runtime checks remain with the orchestrator.

Base sha is from the repository commit record; this environment has no local git log or runnable checkout. No pass is claimed.
