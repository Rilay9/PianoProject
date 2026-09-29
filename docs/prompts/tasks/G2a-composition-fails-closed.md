# G2a — Related-composition material must not read as transfer demonstrated until the relationship can tell a new section from a different arrangement: the G2 review's one required change

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/030ce744.md` (the G2 review: APPROVE WITH ONE REQUIRED CHANGE, and the rulings on G75, G76 and G77); `docs/prompts/entry-126.md` (G2: the fact path, the fourteen adversaries, the policy's cases; its F1 finding, that a section of a composition and another arrangement carry identical facts on the attempt); `app/src/evidence/transferPolicy.ts` whole (the module note; `compositionTail`, which today names an already-played composition in `why` and credits on regardless; `transferReading` at the dimension loop and its `demonstrated` return); `app/tests/unit/transferPolicy.test.ts` (cases 5 and 6: a substantially different section of the same composition, a different arrangement — both "judged on the skill's dimensions" today); `app/src/curriculum/transfer.ts` at `Relationship.composition` (`{ key, playedAs }`: the composition's key and the items of it this learner has runs of, nothing about section or arrangement); `app/src/evidence/ladder.ts` at promotion and challenge protection (the two consumers of one reading); `docs/05-score-follow-engine.md` §9b if it names the composition case.

## The goal, in the reviewer's words

A learner who has played one cut of a composition and then sight-reads another cut, or another arrangement, of the same composition may succeed on familiarity with the tune, the structure or the arrangement. The relationship the run carries says only that the composition was met and which items of it were played; it cannot tell a substantially different section of the same arrangement from a genuinely different arrangement. G2's policy names that uncertainty in `why` and still returns `demonstrated` whenever a skill dimension differs. That is a learner-facing architectural claim from facts that cannot support it. Until the relationship carries the arrangement or section fact that would establish an independent generalisation context, `unknown` is the honest verdict for every run whose composition relationship lists played items.

## What is decided

1. **Fail closed on the composition fact.** In `transferReading`, a run whose `relationship.composition.playedAs` is non-empty returns `unknown` with a `why` that says so (the composition met before as those items; the relationship does not yet carry the arrangement or section fact that would tell an independent context from familiarity; not credited), before the dimension loop credits anything. Keep exact-material first contact, the measured dimensions, the declared dimensions and the composition relationship as four separate facts, as they are; this change reads one of them earlier and refuses to credit on it. Nothing else in the policy changes: a new seed of shown material stays `not-transfer`, a run that is not first contact stays `not-transfer`, the dimension rules stay.
2. **The two consumers follow the one reading.** Promotion never promotes on such a run; challenge protection reads the same verdict as it did for `unknown` (whatever `sparesFailure` does with `unknown` today, unchanged). The establishing contexts the ladder replays are unaffected except that such a run establishes no transfer context.
3. **The discriminating cases.** In `transferPolicy.test.ts`, cases 5 and 6 become what the reviewer asked: a new section of the same arrangement and a different arrangement, both `unknown` with today's facts, each asserting the `why` names the composition and the missing fact; red first (today they read `demonstrated`). Add the case that keeps the boundary honest: the same material facts with no composition relationship still read `demonstrated` on a differing dimension. A ladder case: a learner whose only transfer-quality run is a related-composition run does not reach *transfer demonstrated*, red first.
4. **The screens say what the verdict is.** Wherever the Skills or Progress screen shows the transfer reading's words for a run (`docs/04` names the surfaces; G2's entry pictured Skills for a constructed history), the `unknown` case's words for this reason are in the learner's language, without ids: something like *another cut of a piece you have played: not counted as a new context yet*. If no screen shows the run-level `why` today, say so and change nothing on the screens.
5. **The missing fact is recorded, not built.** A row for the relationship's owner: the arrangement and section facts (`provenance` or the material identity) that would let a different arrangement establish transfer; until then the composition fact fails closed. Not G2a's to build.
6. **Not G2a's:** G75 (the reviewer ruled: keep the current result, no migration), G76 (the fifteen blocks stand; no `source` dimension), the position-shift scope finding (a later wave; recorded as its own row by the orchestrator), any change to `Relationship`'s shape.

## Verification layers

- Unit, red first: `app/tests/unit/transferPolicy.test.ts` (cases 5 and 6 rewritten and red on the committed code; the no-composition boundary case; the `why` assertions); `app/tests/unit/masteryLadder.test.ts` or the ladder's own test for the promotion case, red first. `npx vitest run tests/unit/transferPolicy.test.ts tests/unit/masteryLadder.test.ts tests/unit/transferFactsOnTheAttempt.test.ts tests/unit/transferOffer.test.ts` green; `npx tsc -b`; `npm run lint`.
- Browser, only if item 4 changes a screen: the Skills or Progress case that shows the words, on a port of your own (4353) through a copy of `app/playwright.config.ts` as `app/playwright.g2a-4353.config.ts`, `--workers=2` at most, with a check that every spec file you name exists before the step; `transfer-offer.spec.ts` rerun if the offer's contact reading is touched (it should not be).
- The path map (`docs/prompts/checks.json`) covers `transferPolicy.ts`; run `python tools/docs/checks_for_paths.py <changed paths>` and say what it names.

## Rules and files

You own `app/src/evidence/transferPolicy.ts`, `app/tests/unit/transferPolicy.test.ts`, the ladder test for item 3, and the screen words of item 4 if any. Not `transfer.ts`'s `Relationship`, not `ladder.ts`'s structure, not `recordRun`. Never name an AI model. Never assert a number measured on this machine. Every change red first. No commits, pushes, stashes or checkouts. A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so. `docs/05` and `docs/04` rows go in the entry's `## Doc rows` for the next docs splice.

## Sequencing

The G2 review's required change: a fix-forward under an accepted contract (788427c), dispatched now with a for-information line to the reviewer; the post-build review is the gate. X1 consumes G2 only after this lands (the reviewer: "before X1 consumes G2").

## When to deviate

If a screen today shows a related-composition run as *transfer demonstrated* to a learner (item 4), picture it before and after and lead the report with it. If the composition fact reaches the offer (`transferOffer` in `session.ts`) in a way that would now offer related material as new, stop and show the case; the offer's contact rule is G2's and not yours.

## Report

Judgement first: what a learner who played one cut and reads another now sees on Skills and Progress, before and after, as pictures if a screen shows it, else as the verdict and its words; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes.

**Landed 2026-09-29** (Entry 132; 337a0324, merged f9aa295f); handoff `handoffs/337a0324.md`.

**Accepted 2026-09-29** (`responses/337a0324.md`, APPROVE). The protection question ruled: keep as built — a failed reading of another cut counts unless a separately known new demand spares it; no measured dimension is borrowed across the missing arrangement/section fact. G80 (the facts, relationship-owned) and G81 (the offer's wording) recorded. G2 closed; X1 released.
