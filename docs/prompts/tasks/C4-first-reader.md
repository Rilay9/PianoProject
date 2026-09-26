# C4 — The first reader: the next sight-reading phrase chosen from what the learner's reads have shown

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/audit-2026-09-25-outside.md` Part 7 (decision 9: the stop after this task is a learner-facing review, and the evidence machinery must not become an end in itself); `docs/prompts/design-2026-09-26-vocabulary.md` §10 step C4 and §11 item 4 (how visible adaptation is); `docs/prompts/traces/2026-09-25-sight-reading.md` (the trace whose findings this task answers: Q1, Q5, P1-a, P2-c, P2-d); `docs/prompts/test-inventory-2026-09-26.md` §6 Wave C (the daily-read claim row to delete; `sightReadingSlot` to revise) and §7 Q6 (`sightReadingFromReadingState`, `recommendRespondsToEvidence` in its reading part, `firstThirtyDays` in its reading part); the matrix rows S4, S10, S12, S13, S14, S16, L12 (the reading slot only), I1. Entries 70 (C1: the observation, its `unseen` flag and seeds you read; its behaviour change L50 is your item 6), 71 (C2) and 72 (C3) in `docs/pending-review.md`. Code: `app/src/ui/screens/TodayScreen.ts` (the daily read near 376–410), `app/src/curriculum/session.ts` (the `sightreading` slot near 358–372 as T37 left it), `app/src/engine/sightReading.ts` (`SightReadingOptions`, the level table, `generate`), `app/src/ui/screens/ScoreScreen.ts` (`generateSightReadingFor`, T40's New phrase), C3's evidence and ladder functions, C2's vocabulary, `docs/04-ui-spec.md` §2 (Today) and §5c, `docs/05-score-follow-engine.md` §8.

## The goal, in the orchestrator's words

Today the next sight-reading phrase is a constant per row chosen by the stage. After this task the daily read and the session's reading slot choose the phrase's constraints from the learner's reading skill states: one dimension moved at a time, the phrase always unseen, some reads deliberately easy so reading becomes fluent rather than an exam, and the row on Today saying in one true line why this phrase. Nothing else in the app adapts. Then the work stops, and what a learner meets is looked at as a learner, not as code.

## What is decided

1. **The reading slot and the daily read** stop using `item.level <= stageNumber` (`TodayScreen.ts:383`; `session.ts`'s slot). They choose a recipe from the reading skills' ladder states (C3) over the observations (C1): the recipe is the learner's last one moved in exactly one dimension (key, range, rhythm vocabulary, hands, syncopation, metre) toward what the evidence says is next, never two at once, and never a dimension whose demand the ladder has not taught at the learner's rung (the taught-at table from C2). A learner with no reading evidence starts where the rung's row starts today, so the day-one experience is unchanged.
2. **Unseen is guaranteed**: the seed is chosen so that no phrase the learner has been recorded playing or hearing (C1's `unseen: false`, the seeds on record) is offered as a read. The row's *New phrase* (T40) draws the next seed under the same rule.
3. **An easy band** (S13): at least one read in every few sessions sits one dimension below the learner's state, on purpose, and the reason line says so ("an easy one, for fluency").
4. **The reason line is true** (design §11 item 4; I1): the Today row's sentence for the reading slot is drawn from the evidence ("you misread two of five skips on Tuesday; this phrase has six"), and when no evidence chose the phrase the row claims no reason beyond the rung's. No other slot's reason changes in this task.
5. **The old rule's tests go with it**: `lessonClaimsAboutApp` "3.4: the daily read is the right-hand level-2 phrase at Stage 3 and the two-hand one at Stage 4" is deleted (it re-implements the stage rule; class stated); `sightReadingSlot.test.ts` is revised so the stage rule becomes the evidence rule with the Stage 1 assertions kept as a floor.
6. **Today carries its slot and its judging rung in the route** (L50, P1; U47): since C1 a run opened from Today records no rung and is judged by the Settings defaults, because Today opens its cards with no `?from=`. Today passes the slot kind and the rung it chose, separate from Back's `from`; the score screen's header reads them into C1's opening context and judges by that rung; the tablet side panel's text follows the same rung. Red first on `observationsFromRun` or a sibling: a run opened from Today's reading slot records the slot and the rung.
7. **Nothing else adapts.** The technique, review, new and repertoire slots keep their rules (C6). The Skills screen keeps reading `skillsStore` (C7). The swap sheet is untouched.

## The tests

- **Add** `sightReadingFromReadingState.test.ts` (Q6): three constructed learner states (never read; misread skips on two days; proficient on eighths) each get a different next recipe, each differing from the learner's last in exactly one dimension; a phrase already recorded is never offered; the easy band appears within the stated number of sessions. The reading part of `recommendRespondsToEvidence.test.ts`: two constructed learners at the same stage, one failing and one who never read, get different phrases; renumbering the stage changes nothing. The reading part of `firstThirtyDays.test.ts`: one constructed learner's thirty days of reads through the real code, asserting always unseen and one dimension at a time. An e2e case reading the Today row's sentence on the glass for a constructed state.
- **Revise / delete** as item 5 says.
- **Preserve** T37's `sightReadingPromises` (every phrase still contains what its rung promises: the recipes you choose are rows' recipes or one-dimension moves inside the promises' bounds).

## What is the agent's judgement

The order in which dimensions are moved when several are "next"; the easy band's cadence; how the learner's "last recipe" is stored (on the observation, from C1, or derived); the exact words of the reason lines (in `help.ts`, printed in `04` §2).

## Hypotheses you inherit as questions

- That C3's ladder states for the reading skills are distinguishable on a few days of real use. Construct the three states from realistic observation histories (five reads each), not from hand-set states; if they collapse to one state, say so: it is the checkpoint's most important finding.
- That the promises' bounds and the one-dimension move do not conflict (a move to a key on a rung whose promise is C major). Check per rung.

## Rules and files

You own `app/src/curriculum/session.ts` (the reading slot only), `app/src/ui/screens/TodayScreen.ts` (the daily read and the reading row's reason), `app/src/engine/sightReading.ts` (only if a recipe field is needed to move a dimension), `app/src/ui/screens/ScoreScreen.ts` (`generateSightReadingFor`, the New phrase seed rule, and the route's slot and rung into the observation header), the tablet side panel's text for item 6, `app/src/ui/help.ts`, the tests named, `docs/04` §2 and §5c, `docs/05` §8, `docs/08-test-map.md`. Not the other slots, not the swap sheet, not the stores, the vocabulary or the evidence function (report a gap rather than editing them). No commits, no push, no stash, never `git add -A`. Never name an AI model. Every change with a test seen red first; every touched test classified. Your entry goes to your scratch folder as `ENTRY.md`.

Playwright: from `app/`, one config at a time, port 4173, unpiped, waiting on the settled state. You are the only browser user.

## When to deviate

If the evidence from a few days of reads cannot separate the three states, do not sharpen the ladder to force it; report it, keep the stage rule as the fallback for a learner with too little evidence, and say what evidence would be needed. If the one-dimension rule would trap a learner (every dimension blocked by the rung's promises), the phrase stays at the rung's row and the reason says so.

## The checkpoint after this task (the orchestrator's, not yours)

The stop after C4 is a learner-facing review: the thirty-day reading strand of one constructed learner walked through the real code and read as a teacher would read a practice diary; the Today row and the sheet opened on the glass for that learner on three days; and the question put plainly to the owner and the reviewer: does the app now teach reading better than it did on 2026-09-25, or has it only become more careful about what it claims? Write your report so that review can start from it.

## Report

Judgement first: what a learner who misreads skips now gets tomorrow, and what one who reads eighths cleanly gets, in the app's own reason lines. Then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes from unpiped runs; unverified beside what passes.
