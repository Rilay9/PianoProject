# F1 — The eleven F0 deferrals classed "F's voice rewrite": absolutes, superlatives and fake precision removed, the advice kept (overnight seam, 2026-09-27; the reviewer's package)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/00-invariants.md` (never teach wrong); `docs/prompts/f0-disposition-85.md` rows 5, 14, 18, 29, 34, 41, 46, 63, 70, 85, 87 — the eleven classed **F's voice rewrite** (1.2:26 a long rest "the most common rhythm error there is"; 2.2:20 "almost every rhythm problem a beginner has is a subdivision problem"; 3.4:40 the Petzold "the first real piece in the plan"; classical.4:42 "the first sonatina most learners meet"; blues.4:44 "no edition prints those"; rock.4:9 the power chord "the one almost every heavy piano part is built from"; chords-pop.5:27/29 sus4 "the most-used gesture in pop piano"; rock.6:39 Prelude No. 20 "the clearest example in the library"; jazz.7:24 quartal voicings "most film music written since 1960"; classical.9:13 "ten minutes of music"; chords-pop.9:20 "the oldest arranging trick there is") and the reason column beside each; `docs/prompts/entry-82.md` (F0's three-layer rule and its table's shape; the lesson word caps and `readingTime`); `docs/prompts/lint-absolutes-2026-09-26.md` (the lint's list for these lessons); `app/tests/unit/lessonClaimsAboutMusic.test.ts` and `lessonClaimsAboutApp.test.ts` (the rows that read these lessons; `lessonShape.test.ts` for the word count); `docs/prompts/views/audit/part-10.md` §"the twelve gates" (gate 4, fake precision; gate 12, the teacher test).

## The goal, in the orchestrator's words

Eleven sentences state as fact what nobody counted: the most common error, almost every beginner, the first real piece, no edition, most film music since 1960, ten minutes of music. F0 classed them as voice, not contested fact, because the advice under each is sound and the absolute is decoration. After this task each sentence keeps its advice and drops its claim, in the lesson's own voice, and no sentence turns a contested fact into a different fact.

## What is decided

1. Each of the eleven sentences is rewritten so that the useful advice survives without the absolute, superlative or fake precision: "a long rest is an easy place to lose the count" for "the most common rhythm error there is"; "a subdivision problem is the usual suspect" for "almost every…"; the Petzold as "the first piece here written for both hands at once" only if that is true of the plan — else "a good first piece" — and so on; where the sentence has no advice under it, it is cut. Not one of the eleven becomes a new factual claim; a superlative over an uncounted set is never replaced by a smaller uncounted superlative.
2. The reason column of the disposition table is honoured: 3.4:40's rewrite exists already ("Reader 1's rewrite is available" — find it in `docs/lesson-audit/` and use or improve it); rock.4:9 and jazz.7:24 are style claims whose authenticity is G's, so the rewrite only removes the count and does not assert a different one; classical.9:13's "ten minutes" is fake precision over pieces of 83 to 262 bars — say what is true ("pieces that run several minutes") or nothing.
3. This is not the contested-fact, outside-expert or musical-judgement pass: rows 1, 22, 83 and the rest of F0's deferrals are untouched.
4. Every changed lesson's `readingTime` rechecked; the claims rows that read these sentences revised (classified, old assumption named) or added where the lint's absolute was pinned; the lint rerun to show the eleven gone from its output for these lessons.
5. The table in the entry: lesson and line, before, after, the reason, the layer (teacher's judgement for every one — these are voice).

## Rules and files

You own the eleven lesson files (`content/lessons/{1.2,2.2,3.4,classical.4,blues.4,rock.4,chords-pop.5,rock.6,jazz.7,classical.9,chords-pop.9}.md`) at the named sentences only, their rows in the two claims test files, and this seam's entry. Not `help.ts`, not the generator, not the curriculum, evidence or session code, not any other lesson. Never name an AI model. Every change red first where a test can express it (a claims row asserting the absolute is gone), with the assertion named; every touched test classified. Runs unpiped: the content build (`python tools/content/build.py --offline`, from the worktree root; copy the gitignored import libraries and the conversion cache from the main checkout read-only as T53b did and restore any tracked file the offline fetch rewrites), the validator, `python tools/content/lint_absolutes.py` for the eleven, and from `app/` `npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts tests/unit/lessonClaimsAboutApp.test.ts tests/unit/lessonShape.test.ts` (`npm ci` first if `node_modules` is absent). No browser, no app build. No commits, no push, no stash, never `git add`. Your entry as `ENTRY.md` in your scratch folder, headed "### Entry 88 — F1: …", in the shape of Entry 82.

## When to deviate

If a sentence turns out to be a contested fact rather than voice once you are at it (its advice depends on the claim being true), leave it and list it with the reason; never settle it here.

## Report

Judgement first: three of the eleven as a learner now reads them, the ones whose advice was hardest to keep; then Done / Not done / Follow-ups / Questions / Files; the table; the red lines; exit codes; unverified beside what passes.

**Delivered 2026-09-27**, Entry 88, in an isolated worktree: all eleven rows (twelve sentences) rewritten in the teacher layer with the advice kept; the brief's candidate for 3.4 ("the first piece here written for both hands at once") was false of the plan and was not used — the ranking is cut; twelve claims rows added; the four style pointers left as existence-only for G to judge.

**Accepted by the reviewer 2026-09-27** (`responses/a94baee.md`): the style pointers for G; the T55 "every key" diagnosis superseded — the sentence is literally correct.

