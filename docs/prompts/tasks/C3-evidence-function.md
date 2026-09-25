# C3 — The evidence function and the ladder: what one observation supports about one skill, and nothing more

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/audit-2026-09-25-outside.md` Part 7 (decisions 1 and 6, and the construct-validity principle); `docs/prompts/design-2026-09-26-vocabulary.md` §4 whole (the rule, its five parts, its enforcement, the three items' evidence table, the triplet arithmetic, the weighting), §5 (the ladder) and §10 step C3; `docs/prompts/test-inventory-2026-09-26.md` §7 Q6 (`evidenceOnlyMeasured`, `evidenceTouchesNamedSkills`, `demandIsNotAbility`, `masteryLadder`, `feedbackFromMeasurements`); the matrix rows L11, L19, L21, L24, L25, S21, L47; C1's and C2's entries in `docs/pending-review.md` (the observation fields and the vocabulary you consume). Code: C1's observation shape in `app/src/data/db.ts` and `progressStore.ts`; C2's vocabulary files and detector module; `app/src/engine/Scoring.ts` (the technique measures, `evaluateOutcome`); `app/src/ui/screens/ScoreScreen.ts` (the summary sheet, T37's and T40's lines); `app/src/ui/help.ts` (`SUMMARY_TEXT`); `app/src/data/skillsStore.ts` (what the Skills screen reads today); `docs/05-score-follow-engine.md`, `docs/04-ui-spec.md` §5.

## The goal, in the orchestrator's words

One pure function turns an observation into evidence about one skill, or into a stated refusal, and its only route to "supports" runs through a measurement the run took, under the conditions the skill names, at the places the played notation contains the demand. A second pure function reads a skill's evidence list into a ladder state. The summary sheet starts saying "not judged: timing" where it used to say nothing. No selection reads any of it yet; that is C4. The principle carried on every definition: this machinery enforces evidentiary honesty; it does not prove that a measurement shows the skill.

## What is decided

1. **The evidence function** (design §4): inputs are one observation (C1's shape), the notation actually played (the phrase, the slice, or the loop's range, from the score model), the item's or use's `targetSkills`, and the vocabulary (C2). For each target skill it returns either an evidence record `{skill, observationId, standard: practice | full, n, right, at, context}` or a refusal `{skill, reason: not-measured:<channel> | condition:<name> | no-opportunity | precision}`. `n` and `right` are counts of measured opportunities at the demand's steps, never a fraction of the item's demands. No parameter carries the item's level, rung or tags. Evidence is never inferred for a skill nobody declared.
2. **Enforcement in types**: `Evidence` is constructible only from a `Measurement` taken out of an observation; detectors return `Opportunity`; there is no path from `Opportunity` to `Evidence`. Write it so the compiler refuses the shortcut.
3. **Timing precision** (reviewer decision 6, S21): a timing skill declares the precision that discriminates its target rhythm; the function refuses with `precision` when the run's tolerance window is wider than that. The triplet case from the design's §4 is the first fixture: at the rung's tempo the ±150 ms window must yield no triplet evidence, and a narrower window (a constructed observation) must. The global tolerance is not changed.
4. **The ladder** (design §5): one pure function from a skill's evidence list and today's date to introduced, practised, familiar, proficient, transfer demonstrated, retained, mastered, with the moves the design states and the two numbers (21 days; two recent attempts) as named constants marked hypotheses. States are derived, never stored; a cache, if any, stamps the definitions version. The old `skillsStore` "rusty at 30 days" is not yet replaced (that is C7); this task only provides the function and its tests.
5. **The property test over the vocabulary** (design §4 enforcement 4): for every v0 skill, three constructed cases (channel unmeasured with the demand present; played range excludes the demand; everything met and the count equals the opportunities), so a skill added later is covered by being added.
6. **The sheet's consumers**: where a run yields a refusal for a target skill, the sheet prints "not judged: <reason>" in the app's voice, beside what it does print; nothing else on the sheet changes. Words in `help.ts`, printed in `04` §5f.
7. **The self-report class**: a self-reported run yields evidence of class `self-assessed`, shown apart and accepted by no requirement (design §5, placement and self-pass).

## The tests

- **Add**: `evidenceOnlyMeasured.test.ts`, `evidenceTouchesNamedSkills.test.ts`, `demandIsNotAbility.test.ts`, `masteryLadder.test.ts`, the property test, the triplet precision fixture, and `feedbackFromMeasurements.test.ts` for the new sheet lines (every printed refusal cites a field on that run's observation). Each seen red on the committed code (the function does not exist, so the red is the assertion against today's flag-and-date model where a comparison is possible, or the absence of the function; say which).
- **Revise**: none expected; if a test of `evaluateOutcome` or the sheet must change, classify it.
- **Preserve**: `rungMastery.test.ts` "a run judged against its rung"; the sheet truth tests from T37 and T40.

## What is the agent's judgement

Module layout (a new `app/src/evidence/` folder); the refusal reasons' exact names; how the played notation reaches the function (the score model's steps within the observation's range); the precision constants per v0 timing skill, with the arithmetic in the test.

## Hypotheses you inherit as questions

- That the per-step outcomes C1 stored carry enough to attribute a miss to a demand's step (the design assumed it). If a step lacks the link, say what attribution falls back to.
- That the detectors can run over the phrase a sight-reading run generated (the seed reproduces it; check that the observation holds the seed and the row's recipe so the phrase can be regenerated for the function).

## Rules and files

You own the new evidence module under `app/src/`, `app/src/ui/screens/ScoreScreen.ts` (the sheet's refusal lines only), `app/src/ui/help.ts`, the tests you add, `docs/05` (a new section on evidence), `docs/04` §5f, `docs/08-test-map.md`. Not the stores (C1 wrote them; if a field is missing, report it rather than adding it), not the vocabulary (C2; a missing skill field is a report item), not `session.ts` or `selectors.ts` (C4), not `skillsStore` (C7). No commits, no push, no stash, never `git add -A`. Never name an AI model. Every change with a test seen red first; every touched test classified. Your entry goes to your scratch folder as `ENTRY.md`.

Playwright only for the sheet's lines (`score.screen`, `score.run`), one config at a time, port 4173, unpiped, waiting on the renderer's settled state.

## When to deviate

If a v0 skill's observable cannot be evaluated from the observation as C1 stored it, the function refuses with `not-measured` and the report names the field C1 should add; do not add it. If the ladder's moves as written produce a state a teacher would not recognise on a constructed history (write two such histories and say what state they get), say so and propose the change rather than silently altering the moves.

## Report

Judgement first: for the three items the design worked through, what evidence a Wait run, a guided Keep tempo run and an unguided first contact now yield, as the function computes it. Then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes from unpiped runs; unverified beside what passes, including which skills' construct validity the function cannot establish.
