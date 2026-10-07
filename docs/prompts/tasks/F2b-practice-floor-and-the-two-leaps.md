# F2b — F2a finished: `practice.1` stands on 1.1 and D8a says "from the second rung of Stage 1"; the beginner's reading leap (a fourth or fifth, introduced at 1.5, taught at 2.1) split from the advanced technique jump ("leaps of an octave or more", Grades 5–6) so the Skills entry opened from 2.1 describes the interval skill and the advanced finder keeps its own concept, with no duplicate "Leaps" entry for the learner

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/fc91e5a.md` in full (the F2a review: the required change's two parts and their acceptance; the 3.3 swap tier and the holiday/blues.3 gaps are not this seam's); `docs/prompts/entry-117.md` (F2a: Question 1's measurement of the three prerequisites; the concept `leaps` named at 2.1); `content/curriculum/concepts.json` at `leaps` (the advanced finder: "jumping accurately to a note you cannot feel for", Grades 5–6, "leaps of an octave or more") and at `skips`, `steps`, `interval-reading`; `content/curriculum/vocabulary/skills.json` at `interval-reading` (its opportunity: `interval.step`, `interval.skip`, `interval.leap`); `content/curriculum/stage-1.json` at `practice.1` and `1.5`, `stage-2.json` at `2.1`; `docs/02-curriculum.md` D8a (line 611) and the sentence near line 440; `app/src/ui/screens/SkillsScreen.ts` (how a rung's concepts become the learner's entries); `content/lessons/2.1.md` at F2a's sentence.

## The goal, in the orchestrator's words

F2a moved the leap's teaching to where an option establishes it, and the reviewer accepted that. Two loose ends are the same kind of fault as the one F2a fixed — one fact in two places that disagree. `practice.1` has no core prerequisite, so its material claims a Stage-0 ancestry it does not have; the measured choice is 1.1, and D8a's sentence must say what the data then does. And "leaps" now means two things: the beginner's fourth or fifth that 2.1 teaches, and the advanced octave-or-more jump the finder describes at Grades 5–6; a learner at 2.1 who opens the Skills entry reads about a skill years away.

## What is decided

1. **`practice.1` on 1.1.** `content/curriculum/stage-1.json`: `practice.1` gains `"prerequisites": ["1.1"]` after its `requirements`, as `practice.2`–`practice.5` carry theirs (those stay chained through the practice rung before). D8a in `docs/02` says "from the second rung of Stage 1" (its heading and the sentence near line 440 that reads "from Stage 1"). The named cases: `test_taught_at`'s practice case gains the 1.1 ancestry (the five-finger and Ode material taught by 1.1's path; the steps-and-skips study still untaught until 1.5), `taughtByAncestry` the app-side twin, F2's `today.spec` floor case at 1.5 unchanged, and one session-build case that the practice row is present at 1.2 and absent at 1.1 (the entry's measurement made a test). D0's record loses the two scenarios F2a measured (`question-practice-scenarios.txt`'s), by the build.
2. **Two concepts, one meaning each.** The beginner's reading leap gets its own concept id in `concepts.json` — the natural name is the interval it is (`leap`, display "Leaps: a fourth or fifth", finder "reading and playing a jump of a fourth or fifth without feeling for it", level words "easy, elementary", constraints "a few leaps of a fourth or fifth in a stepwise melody", avoid "octave leaps", the shared formats line) — and 1.5's `introduces` and 2.1's `concepts` name it; the advanced `leaps` entry keeps its id, its finder and its Grades 5–6 words and is named only where the technique rungs name it today (say which). The skill vocabulary is unchanged (`interval-reading`'s opportunity already carries `interval.leap`); `demands.json`'s `taughtAt` re-derives to `["2.1"]` unchanged. The Skills entry a learner opens from 2.1 describes the beginner skill (the browser case: the rung page's concept chip or the Skills screen's entry for 2.1 names the fourth-or-fifth entry, never "an octave or more"); the finder for the advanced concept still opens from its technique rung. No learner-facing list carries two entries called "Leaps" (the display strings differ, and a unit case over `concepts.json` asserts no two displays collide).
3. **The consequences held**: the untaught census before and after (the entry states the relationship: item 1 removes the practice floor's false rows; item 2 changes no census); the diaries rerun and compared (no morning should change for item 2; item 1's mornings at 1.1–1.5 explained); the rung-claims report and inventory regenerated.
4. **Record:** `docs/02` D8a and Part C at 1.5/2.1 where the concept is named; the doc rows for `docs/03` (the concept table, if it lists them) in the entry.
5. **Not F2b's:** the 3.3 swap tier's context-aware selection (a chooser row, recorded); holiday's and blues.3's path gaps (claim decisions, recorded); the eighty proposals (L112); `practice.3`–`.5`'s core rungs (F2a's Question 1 second clause: they would close those rungs until Stage 2 or 3 — left as the reviewer left them, chained through the practice rung before); any option added.

## Verification layers

Build-time, red first: `test_taught_at`'s practice-on-1.1 case red on the committed data; the concept-display collision case; the content build offline, the validator, the record check, `test_measured_truth` with the new census. Unit: `taughtByAncestry`, `lessonClaimsAboutApp` on 2.1 (the two recorded line-ending assertions aside), the two diary files, the session-build case. Browser, on port 4323: `today.spec.ts` (F2's floor case), `lesson-flow.spec.ts` or `plan.spec.ts` at 2.1's concept entry, `competence.spec.ts` if the Skills screen lists concepts; a `specs-exist` check before the step. The product look: the Skills or rung entry for the beginner leap at 342 × 740, and the finder's text for the advanced one, as observations; nothing heard.

## Rules and files

You own `content/curriculum/stage-1.json` at `practice.1` and `1.5`'s `introduces`, `stage-2.json` at `2.1`'s `concepts`, `content/curriculum/concepts.json` at the two entries, `docs/02` at D8a and Part C's two lines, the tests named, the regenerated reports and D0's record, `content/lessons/2.1.md` only if its sentence names the concept by display. Not `validate.py`, `claims.py`, `build.py`, the skill vocabulary, any app code beyond a test, `docs/08` (a doc row). Never name an AI model. Never assert a number measured on this machine. Every change red first; no commits, pushes, stashes or checkouts. A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24).

## Sequencing

A narrow curriculum-data fix-forward under F2a's accepted contract (788427c): dispatched on the reviewer's required change with a for-information line; the post-build review closes F2a. X1's brief consumes these claims only after this lands.

## When to deviate

If a technique rung names `leaps` for the beginner meaning (a Stage 1–3 rung with the advanced entry in its `concepts`), list it and move it to the new concept only where its options are fourths and fifths; otherwise leave it and say so. If the session-build case cannot be written without `session.ts` (X1's file), write the measurement into the entry as F2a did and say so.

## Report

Judgement first: what a learner at 2.1 reads when they open the leap entry, and whether the practice row is on Today at 1.1 and at 1.2, as observations; then Done / Not done / Follow-ups / Questions / Files; the census; the red lines; the tests table; exit codes; unverified beside what passes.

**Landed 2026-09-29** (Entry 123; ddba53e9, merged 51fd9e6c); handoff `handoffs/ddba53e9.md`. L116, L117 recorded.

**Approved with one required change 2026-09-29** (`responses/ddba53e9.md`): F2c (`F2c-advanced-leap-unmapped.md`) unmaps the advanced leap; the practice floor accepted.

## Record

lane: F2b · closes: — · entry: 123
index: F2a finished: `practice.1` on 1.1 with D8a saying "from the second rung of Stage 1"; the beginner's reading leap split from the advanced technique jump, one concept each, no duplicate learner entry (`F2b-practice-floor-and-the-two-leaps.md`) | F2a (Entry 117); `responses/fc91e5a.md` | `stage-1.json` at practice.1 and 1.5, `stage-2.json` at 2.1, `concepts.json` at two entries, docs/02 D8a and Part C, the tests, the reports | **approved with one required change 2026-09-29** (`responses/ddba53e9.md`; Entry 123): F2c unmaps the advanced leap; X1 keeps the 1.2 practice-row ordering as an explicit policy |
state: closed 2026-09-29: F2c accepted, F2's required-change chain closed (F2a's in-flight line)
