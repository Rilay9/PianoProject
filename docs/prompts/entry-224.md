### Entry 224 — CL11c

**Judgement.** A learner practising a loop now earns one score per completed lap: a mistake on lap two cannot be erased by clean notes from lap one. The tempo ladder judges each lap alone. If the learner presses Stop after at least one completed lap, the summary and stored decision use the last completed lap; if no lap has completed, Stop reports the current attempt as before.

**Unit and why.** One lap. The existing product already calls a loop boundary a finished pass and sends that score to `climbLadder`; repeating step indexes are also lap-local. Resetting the score/evidence population at that boundary makes the learner's visible promise and the ladder's pass mean the same thing without inventing repeated stored step identities.

**Mechanism.**
- `app/src/engine/PracticeEngine.ts`, `completeLap`: capture the completed lap score, emit it, then `resetRunTotals()` before the repeated step indexes begin again. The reset now includes `lenientChordSteps`, another score component.
- `PracticeEngine.stop`: once a loop has a completed lap, emit the retained last-completed-lap score with the whole run’s active duration for the real finish that reaches the summary/save path; before the first completed lap, keep `buildScore()`.
- `start`: clear the retained lap score for a new run. No stored field/schema was added.

**Cases.**
- Red already established by Claude at `8492b3f0`: the completed-lap case failed on `secondLap.hits`, received 4 instead of 2; non-looped passed.
- Discriminating test-only SHA `fd3e315f4e4c048ee95b04797f9dda9def1c0f0d`: adds the Stop case with direct one-lap expectations. See `check-request.md`.
- The first implementation was not green: at `ed7d0944`, the published check ran 358 cases, with 355 passing and three failing. No local runtime checks were run here. Round-two checks are requested, not observed.
- The engine Stop case checks its lap score and whole-run duration. The added `scoreTourRoute.test.ts` case passes a real engine Stop event to ScoreScreen’s existing `onFinished` callback, captures the RunResult supplied to `recordRun`, and reads it through `scoreOutcome`; it does not hand-build the saved fields. Renderer/session transport are stubbed by that existing harness; the engine and RunResult construction are real.

**Mutants.**
1. Delete `this.resetRunTotals();` in `completeLap`: the completed-lap test must fail.
2. Change `this.lastCompletedLoopScore !== null` to `false` in `stop`: the Stop test must fail.

**Learner-facing text.** None. No sheet words or figures were renamed; the existing accuracy/wrong/missed figures now describe one completed lap instead of a cumulative numerator over a one-lap denominator.

**Where the brief was wrong.** The brief correctly identified the population fault but did not state what Stop means after a loop boundary. The code showed that lap finishes feed only the ladder while `stop()` is the finish that reaches summary/save, so one-lap scoring also needs to retain the last completed lap for that real finish; otherwise an almost-empty next lap replaces the pass the learner just completed.

**What I did not do.** No clamp/display-only fix, no stored schema, no new status/enum, no browser spec, no change to non-looped scoring, and no change to the measured-Progress versus learner-word project distinction.

**Base sha.** `385c01317c973127551d2c73a8c58ef60ff62824`


**Round-two consumer check.** Searched `app/tests/unit` for `loop:` and inspected the score-reading cases in `engineTempo.test.ts`, `engineWait.test.ts`, `keepTempoChargesAWrongKey.test.ts`, `scoreSession.test.ts`, `helpers/observed.ts`, `evidenceByDemand.test.ts`, `evidenceOnlyMeasured.test.ts`, and `evidenceProperty.test.ts`. The late-D case now reads lap two’s finished event with its assertions unchanged. The observation helper now stops at the first completed tempo lap its plan actually plays, and returns the final non-loop finish event after Stop, rather than rebuilding the partial lap through `state.score`; its three evidence consumers therefore observe the same saved population. Other matches in `countIn.test.ts`, `router.test.ts`, `scoreTourRoute.test.ts`, `scoreSheetRows.test.ts`, `helpers/perfectRun.ts`, `lessonPagePicksPassTheAdmission.test.ts`, `ladderTool.test.ts`, `drillLifecycle.test.ts`, `settingsDownload.test.ts`, and `projectSheet.test.ts` concern preparation, routes, controls or event-loop prose, rather than completed-lap scoring. No changes were needed to their loop assertions.

**Round-two correction.** Stop keeps the completed lap’s counts and the entire run’s active practice duration, including activity since the last boundary. Existing `engineTempo` coverage distinguishes the lost-time regression. The new save-path case also checks the duration supplied to history. The invalid SHA above is corrected from `git log`/`git rev-parse`, not reconstructed. No runtime pass is claimed; the requested head remains pending independent checks. Mutants are not requested for this round.

**Orchestrator's note at the landing (2026-10-02).** CL11c's worktree committed by name (146a51f7) and merged (2089cf55). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/CL11c/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/CL11c/orchestrator-exit.txt`). Dispatched to the outside builder by the owner's pasted prompt (the first session hung waiting on CI; the re-paste said never to wait on CI), checked here, merged at `2089cf55`.. the known blues.3 lesson-claim case only; the 14 browser specs the map names green
