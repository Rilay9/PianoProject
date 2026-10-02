# U110a — check request, provisional pruning

Base: cd6a62ee. Branch: chatgpt/u110a. Check the exact branch head carrying this request.

Product invariant: keep readable, nonoverlapping rows at the unchanged window scale; conservative admission refusal alone must not remove drawn read-ahead after the reshape ladder ends.

Second read confirms the premise: aheadFor retains the tallest-system reserve for window rows, while aheadMeasured only verifies matching shape/zoom and positive measurements. settleShape treated that flag as permission to remove a slot after the ladder ended, without checking actual packed overflow.

Changed: remove that terminal exception and its plumbing only. The drawnAtZoom gate, admission reserve and reshape ladder remain unchanged. No learner-facing text changes.

## Requested checks

Run sequentially on this head, preserving exact commands, raw logs, exit codes and generated measurements. Expected green means no residual overlap; a contrary result is evidence to evaluate, not permission to weaken the assertion.

1. Typecheck (`npx tsc -b`), lint, and `app/tests/unit/windowRendererStage.test.ts`: expected green.
2. U110 fresh/reload sweep: `docs/prompts/runs/U110/scripts-u110-sweep.spec.ts` with `scripts-u110-read.ts`. Expected: no residual drawn-row overlap across the four viewports, four pieces and four bar settings, open plus reload (128 loads). Publish the raw JSON so counts are mechanically checkable.
3. Per-bar run probe: `docs/prompts/runs/U110/scripts-u110-run.spec.ts` with `scripts-u110-read.ts`. Expected: no residual overlap and unchanged frozen scale. Publish measurements and captured pictures.
4. Named Ode regression in `app/tests/e2e/score.window-rule.spec.ts`, then that complete file: expected green. Preserve their separate results.
5. Twinkle 342 x 740, Bars 3: record drawn packing, stage height, retained read-ahead and conservative admission price after settling. This is the candidate fitting/reserve-refusal regression; determine whether it still crosses that boundary before writing its permanent assertion.

The archived scripts/configs are records from app/build/u110, not directly runnable at their committed paths: their relative imports resolve from that original location. Rehydrate copies there using the archived original filenames (remove scripts-), adapt the storage state's localhost origin to the chosen isolated port, and document those execution adaptations without mutating the archived evidence. Do not add instrumentation to the renderer silently; retain an exact instrumentation patch separately if pricing capture needs one.

## Pending decision

This is not a completed build report or self-approval. After results: if no residual overlap, add the discriminating fitting/read-ahead regression, obtain its red on the unchanged baseline and green on the pruning, and one restoring-guard mutant. If a residual overlap requires more than a guard keyed to actual unsafe packing at unchanged scale, stop and hand back. Final evidence and report follow those results.

Publish checks and pictures per reviewer-context.md so the result push resumes this lane. This branch predates the CI-trigger merge by the named-base instruction; use the orchestrator check route for this head rather than assuming it triggers branch CI.
