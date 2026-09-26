# C7 — The Skills store retired: one skill state, the ladder's, and "rusty" means not shown lately (draft until the reviewer's C5 verdict)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/design-2026-09-26-vocabulary.md` §5 (the ladder, the self-report class, "rusty" as `notShownRecently`) and §10 step C7; `docs/pending-review.md` Entries 72 (C3: `ladderState`, `LadderReading` with `retained` and `notShownRecently`, the self-assessed class), 75 (C4a: the evidence stamp), 79 (C5: the Skills screen reads the ladder; carried concepts as exposures; the learner's word recorded about the rung); the matrix rows L16, X3, X4, L26. Code, verified at the lines by the orchestrator on 2026-09-26: `app/src/data/skillsStore.ts` — `RUSTY_AFTER_DAYS = 30` at 12, `displayState` at 38 (`rusty` after 30 days from `lastReviewedAt`, regardless of practice), the store's own `SkillRow.state` (`unseen | learning | known`) and its writers (`skillsFromPractice`, the Simon and drill writers), `forgetCachedSkills`, `resetSkillsForTest`; `app/src/ui/screens/SkillsScreen.ts` (C5: reads the ladder for vocabulary skills, the store for the rest, "introduced" as a displayed state); `app/src/ui/screens/ProgressScreen.ts` (no skills section, X3); `app/src/evidence/{ladder,readingState,rungState}.ts`; `app/tests/unit/{skillsFromPractice,skillsReadTheLadder,simonForStage,legacyStorage}.test.ts`; `docs/04-ui-spec.md` §3a; `docs/02` Part G.

## The goal, in the orchestrator's words

After C5 the Skills screen reads the ladder for the vocabulary's skills and the old store for every other concept, and the old store still decides "rusty" by a calendar: thirty days since a review, whether or not the learner has played the thing since. After C7 there is one skill state, the ladder's, for every concept the app can measure; "rusty" is the ladder's `notShownRecently`; concepts the app cannot measure say so ("the app does not judge this") rather than pretending a state; the learner's own word stays apart as self-assessed; the store's writers are deleted, not bypassed; and Progress shows competence from the same state (X3's first half).

## What is decided

1. **One state.** Every concept the vocabulary covers is displayed from `ladderState` over the stored evidence, with exposures (lesson pages read, demonstrations heard, the carry-over). `SkillRow.state` and its writers are deleted; the Simon and drill writers record observations and evidence like every other run (the drills' placeholder measures, L52, are C6's or this task's — take L52's writers here if C6 has not).
2. **Rusty is not a calendar.** "Rusty" is `notShownRecently` (no supporting evidence in the retention window, and some before); `RUSTY_AFTER_DAYS` is deleted; the retention constant stays the ladder's single hypothesis.
3. **Concepts the app cannot measure** (the 283 minus the vocabulary's) show "not judged by the app" with the lesson that teaches them, never "never" or "known"; the learner's word ("I already know this") is shown apart as self-assessed and never as a ladder state.
4. **Progress gains competence** (X3): the skills whose state moved in the last weeks and how, from the ladder, in the app's words; the Skills screen keeps "Review a skill" as its purpose; the "Rusty only" filter reads the ladder.
5. **Migration**: the store's rows become exposures where they said `learning` or `known` (an exposure, never evidence), stamped with the migration date, once.

## The tests

- **Add** `oneSkillState.test.ts` (a run moves the ladder and nothing else; the store's writers are gone from `app/src`), `rustyIsNotACalendar.test.ts` (a skill shown yesterday is not rusty at day 31 since its last review; one not shown for the window is), `unmeasuredConceptsSaySo.test.ts`, the migration test, an e2e case on Skills and Progress for a constructed state at 342 × 740.
- **Replace / delete**, with the old assumption named: `skillsFromPractice`, `simonForStage`'s state writes, `legacyStorage`'s skill rows, `skillsReadTheLadder`'s store half.
- **Preserve**: `masteryLadder`, `rungStateFromEvidence`, `carryOver`, the C5 screen tests.

## Rules and files

You own `app/src/data/skillsStore.ts` (to its deletion or reduction to exposures), the Simon and drill writers' record paths, `app/src/ui/screens/SkillsScreen.ts`, `ProgressScreen.ts` (the competence section), `app/src/ui/help.ts`, the tests named, `docs/04` §3a and §4, `docs/02` Part G, `docs/08-test-map.md`. Not the ladder's moves, not the evidence function. You are alone in the tree and the only browser user; Playwright from `app/`, one config at a time, port 4173, two workers, unpiped; stop the preview server before `npm run build:app`. No commits, no push, no stash, never `git add`. Never name an AI model. Never assert a number measured on this machine. Every change with a test seen red first; every touched test classified. Your entry goes to your scratch folder as `ENTRY.md`, headed "### Entry 81 — C7: …".

## When to deviate

If a concept outside the vocabulary has an honest observable in an existing drill (Simon's sequence length, a chord-dictation answer), do not invent a skill for it here: record it as a candidate for the vocabulary's next version with its observable, and show "not judged by the app" meanwhile.

## Report

Judgement first: the Skills screen and Progress for a learner on 2.2 with the owner-shaped history, on the glass, and what a teacher would say about "rusty" now. Then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes from unpiped runs; unverified beside what passes.
