# T42 — The tempo ladder holds on a pass nothing judged, and the test that relied on the old fault is revised

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/pending-review.md` Entry 72 item 0 (C3: `PracticeEngineOptions.judging`; with no judging input no miss is counted, in Tempo and Listen); the matrix row Q33 and L42 in `docs/prompts/backlog-2026-09-25.md`; `docs/05-score-follow-engine.md` §3 and the ladder's section. Code: the tempo ladder (grep `score-ladder`, `MIN_TEMPO_PCT` and "staying at" in `app/src/ui/screens/ScoreScreen.ts` and `app/src/score/ScoreSession.ts`), `app/src/engine/PracticeEngine.ts` (`judging`), `app/tests/e2e/score.rhythm-ladder.spec.ts` "the tempo ladder on a loop".

## The goal, in the orchestrator's words

CI on a30dc96 failed in "a pass with misses in it slows down, and stops at the floor": the test fed no input (`inputPriority: ['none']`) and relied on every note being judged missed, which was the fault C3 fixed (L42). With nothing judged the pass now reads as clean, and the ladder sped the loop up to 100 % where the test expected 30 %. Both halves are wrong for a learner: a pass nothing listened to must not move the ladder at all, and the test must make its misses under an input that is judging.

## What is decided

1. **The ladder holds on an unjudged pass** and the status says so in the app's voice (beside the existing "staying at N %" line: the reason is that nothing was judged, not that the floor was reached). No tempo change up or down; the pass still counts as practice (C1's record, with its channels not measured).
2. **The test is revised** (class: revise; old assumption: no input means every note is missed). The misses are made under a judging input that plays nothing — the screen keyboard source with no key pressed, or the MIDI mock silent — so the walk down to the floor is what a learner who keeps missing would get. A second case asserts the hold: with `inputPriority: ['none']`, the tempo stays where it started and the status names the reason.
3. **The clean-pass case** ("a clean pass speeds up, and stops at the written tempo") stays as it is if it taps every step under a judging input; if it too relied on nothing being judged, revise it the same way and say so.

## The tests

Red first on the committed tree for both cases: the hold case fails today because the ladder speeds up; the revised misses case is seen red by reverting the engine's `judging` guard in a scratch copy if it passes at once, or by stating why it cannot be made red without that (a revised test whose red is the CI failure itself is acceptable: quote the CI line). Every touched test classified.

## Rules and files

You own the ladder's code in `ScoreScreen.ts` and `ScoreSession.ts` (the hold and its status line only), `app/src/ui/help.ts` for the words, `app/tests/e2e/score.rhythm-ladder.spec.ts`, `docs/05` (the ladder's section, one sentence), `docs/04` §5 if the status line is printed there, `docs/08-test-map.md`. Nothing else. No commits, no push, no stash, never `git add`. Never name an AI model. Never assert a number measured on this machine. Playwright from `app/`: one config at a time, port 4173, two workers, unpiped; stop the preview server before `npm run build:app`; never build during a run; you are the only browser user. Your entry goes to your scratch folder as `ENTRY.md` headed "### Entry 74 — T42: …", in the shape of Entries 69–73; do not edit `docs/pending-review.md`.

## Report

Judgement first: what a learner sees on the status line after a loop pass nothing listened to, seen once on the glass. Then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes from unpiped runs (`tsc -b`, lint, vitest, `build:app`, `score.rhythm-ladder`, and `score.states` since it holds T40's and C3's no-input cases); unverified beside what passes.
