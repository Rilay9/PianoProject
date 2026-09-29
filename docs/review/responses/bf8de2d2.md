# Reviewer response — X1 pre-dispatch brief `bf8de2d2`

Brief HEAD: `bf8de2d2`. Seam reviewed: **X1 only**.

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

The execution layer is the right boundary. C6 composes the lesson; X1 should persist and run that exact composition, carry its reasons through the transitions, resume it after interruption, and record visible adaptations without turning completion into evidence. The proposed separation from X19, G1/G2 encounter truth, G1b lifecycle state and competence state is correct.

The brief also answers L113 correctly: automatic rung-owned and assigned material must pass the canonical unknown-forbidden material gate, while explicit learner-chosen exploration remains reachable with the unknowns named.

## Required change

- **BLOCKS NEXT BRIEF — define the complete guided-activity lifecycle before dispatch.** The brief promises a transition after every composed activity, but its owned end hooks cover only Score, Drill and Lab. Today's composition also contains a `free` slot that is currently a non-actionable prompt with no item, and automatic paths can open PDF/import/external targets through `openItem` without a session completion callback. The runner cannot truthfully persist “current”, elapsed time, completion or the next transition until every admitted activity form has an explicit contract.

  Amend the brief with one table or discriminated adapter contract that, for every composable target form, states:

  1. how the runner opens it with the exact session/activity token;
  2. what event means attempted, completed, skipped or interrupted;
  3. what summary facts, if any, may drive the two accepted adaptations;
  4. how it returns to the transition;
  5. whether the form is temporarily excluded from automatic guided composition when no honest completion signal exists.

  Decide the free slot explicitly: either make it a real runnable activity with an owned completion action, or keep it as a non-activity prompt outside the session cursor and minutes completed. Do not silently mark it complete because the cursor passed it. For PDF/import/external items, add an honest manual finish boundary or exclude them from guided automatic slots; opening a document is not completion.

  The same lifecycle amendment must define time and concurrency. `elapsedMs` accumulates only while the guided session is actively running; time while the page is hidden, the app is closed, or the session is suspended does not accrue. Each write must validate the stored session id/version and activity token so a stale tab or late end callback cannot advance or overwrite a newer composition. Include adversaries for close/reload during an activity, hidden time, a late callback from the prior activity, two tabs, the free slot, and a non-Score target.

This is one boundary correction: the session runner needs one complete activity protocol, not per-screen cursor mutations invented during implementation.

## Decisions on the brief's questions

- **CONSTRAINS NEXT BRIEF — keep the record in the settings row.** X1 owns one current-day singleton, not queryable history, so a new object store and a database version would be needless and would collide with G1b's separate lifecycle migration. Use one fixed key, runtime-validate old/corrupt data, retain the composition snapshot rather than live catalog objects, and enforce the id/version/token write rule above.
- **CONSTRAINS NEXT BRIEF — keep the two bounded adaptations.** Easy first-attempt success may skip only an immediately redundant controlled-practice slot when the completed run has measured full-standard success and both slots name the same measured demand. Failure may hold the cursor on the same activity with retry and *Move on anyway*. Unknown/unmeasured results, self-report alone and session completion trigger neither rule. Every change remains visible and recorded; no other card recomposition belongs in X1.
- **CONSTRAINS NEXT BRIEF — use the composition's words as the transition reason.** Do not add per-slot-kind connecting prose in `help.ts`. “The same pattern, now in real music” is a pedagogical relationship claim and must come from the composition/claim that actually selected those activities, not from a generic UI template.
- **PRUNE/MERGE — one contact adapter and one runner transition.** Composition and start-time recheck consume G2's adapter. Individual screens report lifecycle events to the runner; they do not read encounter history or choose the next activity themselves.
- **LATER WAVE — X19 keeps detours.** Leaving `detour` null is correct. X1 must not simulate a practice episode through repeated activity states.

## Verification basis

I read the immutable handoff first, the exact X1 brief at `bf8de2d2`, Parts 18 and 27, the E2a, G1, G2 and F2a review constraints, and the current session composition, Today opening paths, offer-snapshot settings pattern and Score summary boundary.

The current code confirms the missing lifecycle boundary. `Start session` finds the first populated slot and calls Today's local opener. Score, Drill and other item targets take different routes; non-Score targets fall through `openItem`. A free slot has no item and is rendered deliberately as a non-clickable prompt. Therefore the proposed record cannot yet interpret every ordered slot using the three named end-sheet integrations.

This is a pre-dispatch contract review. There is no X1 implementation, test result or learner-facing capture to approve yet. G2 post-build acceptance and the F2b claim fix remain sequencing prerequisites exactly as the brief states.
