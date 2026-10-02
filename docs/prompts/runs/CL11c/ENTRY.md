### Entry 224 — CL11c

**Judgement.** A learner practising a loop now earns one score per completed lap: a mistake on lap two cannot be erased by clean notes from lap one. The tempo ladder judges each lap alone. If the learner presses Stop after at least one completed lap, the summary and stored decision use the last completed lap; if no lap has completed, Stop reports the current attempt as before.

**Unit and why.** One lap. The existing product already calls a loop boundary a finished pass and sends that score to `climbLadder`; repeating step indexes are also lap-local. Resetting the score/evidence population at that boundary makes the learner's visible promise and the ladder's pass mean the same thing without inventing repeated stored step identities.

**Mechanism.**
- `app/src/engine/PracticeEngine.ts`, `completeLap`: capture the completed lap score, emit it, then `resetRunTotals()` before the repeated step indexes begin again. The reset now includes `lenientChordSteps`, another score component.
- `PracticeEngine.stop`: once a loop has a completed lap, emit the retained last-completed-lap score for the real finish that reaches the summary/save path; before the first completed lap, keep `buildScore()`.
- `start`: clear the retained lap score for a new run. No stored field/schema was added.

**Cases.**
- Red already established by Claude at `8492b3f0`: the completed-lap case failed on `secondLap.hits`, received 4 instead of 2; non-looped passed.
- Discriminating test-only SHA `930b3b2915518345cbb019ca2eece93dee1f96d2`: adds the Stop case with direct one-lap expectations. See `check-request.md`.
- Final branch HEAD: Claude should run the same file and expect all three cases green.
- The Stop case carries the stopped score through `evaluateOutcome` and then the same `scoreOutcome` session-decision seam that reads the stored `RunResult.passed`.

**Mutants.**
1. Delete `this.resetRunTotals();` in `completeLap`: the completed-lap test must fail.
2. Change `this.lastCompletedLoopScore !== null` to `false` in `stop`: the Stop test must fail.

**Learner-facing text.** None. No sheet words or figures were renamed; the existing accuracy/wrong/missed figures now describe one completed lap instead of a cumulative numerator over a one-lap denominator.

**Where the brief was wrong.** The brief correctly identified the population fault but did not state what Stop means after a loop boundary. The code showed that lap finishes feed only the ladder while `stop()` is the finish that reaches summary/save, so one-lap scoring also needs to retain the last completed lap for that real finish; otherwise an almost-empty next lap replaces the pass the learner just completed.

**What I did not do.** No clamp/display-only fix, no stored schema, no new status/enum, no browser spec, no change to non-looped scoring, and no change to the measured-Progress versus learner-word project distinction.

**Base sha.** `385c01317c973127551d2c73a8c58ef60ff62824`
