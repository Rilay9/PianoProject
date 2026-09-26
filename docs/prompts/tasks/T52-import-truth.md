# T52 — Import truth: assignment is an option, never progress (small; after the C6 fix-forward, before C7)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/audit-2026-09-25-outside.md` Part 21 §A; `docs/pending-review.md` Entry 79 (C5: a rung is met by its requirements' evidence; `rungState`; `overlayImports()` puts an imported piece into a rung's `songOptions`); `app/src/ui/assignSheet.ts:72`; `docs/OWNER-GUIDE.md:402`; `app/src/curriculum/load.ts:151` and `app/tests/unit/importOverlay.test.ts:5` (historical comments); `app/src/evidence/rungState.ts`; `app/tests/unit/rungStateFromEvidence.test.ts` (the shape of a constructed learner with a qualifying run).

## The goal, in the orchestrator's words

The assign sheet tells the learner that assigning an imported piece to a rung "counts towards finishing the rung". Since C5 that is false: assignment makes the piece one of the rung's options, and only a measured run of it, judged for that rung, can count toward a `runs` requirement. The implementation is right and the prose is wrong, which is the never-teach-wrong case in app copy. After this task the learner reads what is true, the historical comments say what they mean, and a test proves assignment alone produces no evidence and meets no rung while a qualifying run can.

## What is decided

1. `assignSheet.ts`'s text becomes: "Assigning it to a rung makes it one of that rung's practice options. The app can suggest it there, and qualifying practice can count toward that rung's requirements." (The reviewer's wording, 2026-09-26: "qualifying" leaves the requirement predicate in charge and nothing implies that measuring a run satisfies a requirement.) `docs/OWNER-GUIDE.md` says the same.
2. The comments in `load.ts` and `importOverlay.test.ts` ("cannot count for a rung", "could not complete a rung") are kept only where they unambiguously mean qualifying practice of the item, never assignment or item identity; otherwise rewritten.
3. One regression test with both halves, because together they prove the boundary rather than that assignment does nothing: an imported piece assigned to a rung yields no evidence and the rung's state is unchanged; then a measured run of it, constructed to satisfy that rung's actual `runs` predicate and judged for that rung, satisfies the requirement — the test names which requirement. Never assert that any run of an assigned import advances the rung.
4. Every other learner-facing or owner-facing sentence found by a search for "counts towards" and "finishing the rung" across `app/src` and `docs/` is corrected or listed.

## Rules and files

You own `app/src/ui/assignSheet.ts` (the text only), `docs/OWNER-GUIDE.md`, the two comments, the new test in `app/tests/unit/`, `docs/08-test-map.md`. Nothing else. Never name an AI model. The test seen red first (the wording assertion, or the evidence assertion against a deliberately wrong stub — say which). `npx tsc -b`, `npm run lint`, `npx vitest run` from `app/`, unpiped, exit codes read. No commits, no push, no stash, never `git add`. Your entry to your scratch folder as `ENTRY.md`, headed "### Entry NN — T52: …" with the number given at dispatch.

## Report

The sentence before and after, the test's red line, the search's other hits with their disposition, exit codes, Files.
