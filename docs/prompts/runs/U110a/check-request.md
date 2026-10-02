# U110a — missing admission trace before the discriminating regression

The provisional pruning at `f11cd7c6` passed the published checks. Those results are
retained in `checks-f11cd7c6.txt` on the working branch. The original request is
preserved as `check-request-provisional.md`; do not repeat its sweep or run probes.

## Why one more measurement is needed

Section 5 records Twinkle at 342 × 740 / Bars 3 with no settled look-ahead and no
captured admission price. It cannot prove that a fitting look-ahead was refused
only by admission reserve after the ladder. Intermediate slots changed while the
stage height changed; that is not the needed counterexample. Do not turn that
absence into a passing regression.

## Run on the exact head carrying this request

Apply `docs/prompts/runs/U110a/admission-trace.patch` only in the disposable check
worktree, using `git apply --check` before applying. The patch records admission
terms in the archived reader's existing `window.__u110log`; it changes no verdict.
Keep the exact patch with the evidence, and remove it before any shipped build.
Typecheck the instrumented build, then build the app once for this temporary read.

Use the already rehydrated U110 harness, its isolated port and the storage-state
adaptation documented in `checks-f11cd7c6.txt`. Paths below are from `app/`:

```sh
U110_PROBES=1 U110_PIECE=song.folk.twinkle.ht U110_BARS=3 U110_OUT=build/u110/admission npx playwright test --config build/u110/playwright.u110-5483.config.ts u110-probe --workers=2
```

The source of that executable probe is verified:
`docs/prompts/runs/U110/scripts-u110-probe.spec.ts`, rehydrated as
`app/build/u110/u110-probe.spec.ts`, importing `u110-read.ts`. It initializes the
trace and archives it through `readRows`; it covers fresh plus four reloads at
342 × 740 and 360 × 780. Expect green execution, not a promised counterexample.

Publish the raw JSON and the exact source/patch/commands under
`docs/prompts/runs/U110a/`, with `checks-<head8>.txt`. For the drawn chosen shape,
report `admissionPx`, `slotsHeight`, `drawnHere`, `drawnNow`, `drawnRowPx` and
`currentSlots` beside the actual ink packing, retained ahead and ladder state.
Report explicitly whether any captured fitting packed window is refused only by
reserve after the ladder. If none appears, say so; do not scan unrelated scores
or silently extend the viewport range. The existing archived heights trace may
help explain the absence, but it is not a substitute for an observed boundary.

This is a measurement checkpoint, not completion or self-approval. Its result
selects the genuine regression fixture and the restoring-guard mutant. The zoom
gate and conservative reserve remain untouched in the shipping branch. No
learner-facing text changed. Claude produces the result and its working-branch
push resumes the lane; no owner relay is needed. U122c, CL11 and G90 are returned
to Claude's builders under the current owner instruction.
