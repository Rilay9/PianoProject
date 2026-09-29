# U74 pre-dispatch brief review — a1c1fd6

Brief HEAD: `a1c1fd6`  
Seam: U74 with E30  
Verdict: **APPROVE WITH ONE REQUIRED CHANGE**

## Required change

- **BLOCKS NEXT BRIEF — revise the mechanism and lifecycle contract around the observer that already exists.** At this HEAD, `WindowRenderer` already owns a `ResizeObserver` on its stage. Its constructor says the stage settles after the initial draw, calls `stageChanged()` and `fitToStage()` on a size change, and `dispose()` disconnects it. The brief currently describes adding that ownership as the fix and says the renderer refits whenever the stage changes by more than `worthRefitting`, which is not a discriminating repair and conflicts with the run-size contract.

  Amend the brief before dispatch to make the current observer part of the starting mechanism. The red unit case must distinguish at least:

  1. a stage change delivered while `this.fitting` is true, which the current callback returns from and may never retry;
  2. a settled height change delivered off-run, where the existing callback should already refit;
  3. a width/orientation change, which must replan and may release the freeze;
  4. route-specific render inputs or timing that produce different shapes even when the final stage box is equal.

  If the fault is a resize notification lost while fitting, the renderer should mark a pending resize and perform one fit after the active fit settles, with convergence and disposal covered. If the observer already receives a final settled notification and the difference comes from route inputs, fix that proven renderer-owned mechanism. Continue to stop and report if the necessary change belongs in `ScoreScreen.ts`.

  Replace “refits whenever the stage changes by more than `worthRefitting` allows” with the actual split already enforced by `refitEngraving`: off-run height changes may refit and replan; a width change may re-engrave and replan during a run while preserving the current step; a height-only change during a run keeps the drawn size and must not re-engrave or change the window shape. `worthRefitting` compares the current and target zoom, not stage dimensions.

## Findings and accepted scope

- **CONSTRAINS NEXT BRIEF — compare settled equivalent states.** The two-path browser test is the right learner-facing proof if both paths use the same item, bars setting, viewport, controls and pre-run state, wait for `data-settled="true"`, and then compare the final stage box, system count, shown bars and staff height. Recording the final box is needed to tell a fit bug from genuinely different available space.
- **CONSTRAINS NEXT BRIEF — preserve the active run.** A refit must keep the current position and must not redraw the system holding the cursor. For the handoff question: allow width/orientation changes during a run under the existing rotation contract; defer height-only engraving and shape changes until the run ends. A CSS placement update may keep the frozen drawn size without restarting anything.
- **ACCEPT — renderer ownership.** Keeping `ScoreScreen.ts` out of this seam is correct if the proven fault is inside the renderer's observer, fit queue or renderer inputs. The renderer already owns measurement, settling, fit, freeze and disposal, so a queued retry belongs there.
- **ACCEPT — E30 as a corpus judgment.** Do not preselect a new `chooseWindowShape` rule. Change it only if the states gallery and corpus show every affected cell better or equal under the three documented goods, with no stretched spacing and no loss of the requested bars or visible next music. Otherwise record the trade and leave the rule.
- **LATER WAVE — none added.** U74 is a focused display seam once the brief names the real observer mechanism.
- **PRUNE/MERGE — use the existing fit predicates.** Extend the current observer, `refitEngraving`, settled-state and disposal machinery. Do not add a second resize owner or an independent screen timer.

## Basis

I read the immutable handoff, the U74 brief, the U74 and E30 backlog rows, the D4 and D4a captures, the current `WindowRenderer` observer and fit paths, `autoFit.ts`, its unit contract, the window-rule test map, and the Score screen layout contract at `a1c1fd6`. The 342 × 740 capture clearly shows one small system with most of the stage unused. The brief's two-path reproduction is therefore warranted, but the current code means “no observer/refit” cannot be the starting diagnosis.

This response reviews the U74 brief only. It does not review or answer the independent queue handoff at `3e526f1`.
