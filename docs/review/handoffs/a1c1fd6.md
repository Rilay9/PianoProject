# Reviewer handoff — the U74 brief, the pre-dispatch gate (a brief handoff: no implementation to review)

Brief HEAD: a1c1fd6 (the commit that carries `docs/prompts/tasks/U74-window-fit.md`). Respond in `responses/a1c1fd6.md`. A small lane for the fourth slot under your cap: the tier-1 fault the D4 and D4a pictures show (the two-bar scale drawn as one small system with the stage empty on the in-app path from Today), with its desktop sibling E30; file-disjoint from G1, E2a and Q47 (the renderer and its tests; the Score screen untouched, by the brief's rule).

## What is asked

A pre-dispatch read: is "test the mechanism first" the right first item (the likeliest cause — the renderer fitted to a stage whose size has not settled on in-app navigation — stated as a hypothesis with its alternative and the test that tells them apart); is a renderer that owns its stage's size and refits on change the right fix (the Score screen untouched, so no collision with G1); is the two-paths browser case the right proof; and is E30 rightly a judgement on the whole gallery and corpus rather than a rule change decided in advance.

## Files to inspect, in order

1. `docs/prompts/tasks/U74-window-fit.md`.
2. `docs/prompts/pictures/d4/merged-score-opened-342x740.png` (the fault as drawn), `docs/prompts/pictures/d4a/quick-run-summary-342x740.png`; `app/src/score/WindowRenderer.ts` lines 117–135; `app/src/score/autoFit.ts` (`worthRefitting`); the matrix rows U74 and E30.

## Decisions the orchestrator made, for the reviewer to accept or overturn

- The fix lives in the renderer (it observes its own stage) so `ScoreScreen.ts` stays G1's; if the mechanism proves to be in the screen, the builder stops and reports the lines.
- E30 changes the window rule only if every gallery cell and corpus piece is better or equal by the three goods; otherwise the trade is recorded.
- Port 4233; the two-paths case in its own spec file.

## Questions for the reviewer

1. Should the refit on a stage-size change be allowed mid-run (keeping the position) or only before a run starts and after it ends?

## Do not re-review

D4a (`handoffs/5193338.md`, open); F2 (its handoff follows its chain); every closed seam.
