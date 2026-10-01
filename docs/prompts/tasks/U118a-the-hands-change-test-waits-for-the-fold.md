# U118a — the hands-change test waits for the run's own start fold (fast-path CI-red debugging lane; written after dispatch, no brief preceded it)

**A fast-path debugging lane** (`operating-procedure.md` §11). Dispatched directly on CI run 36834528688's red, `tests/e2e/score.run.spec.ts:248` *changing hands mid-run restarts it without a summary or a recorded run*, on base `43e450a8` (`git log -1 --format=%h` in the worktree before anything else). No brief was written before dispatch; this one is written after the fact, for `record-app-seam.py`'s own record, which reads an existing file at `docs/prompts/tasks/U118a-the-hands-change-test-waits-for-the-fold.md` with no fallback for a lane dispatched without one.

## The CI failure

CI's call log (run 36834528688) reports the click target visible, enabled and stable on every one of 330 retries, then refused: a front slot (`<div data-slot="0" … class="score-buffer is-front is-cursor">`) intercepts the point inside `#score-stage`. The box never moved; something else held the point.

## The hypothesis that was refuted

Entering dispatch, the leading hypothesis was a layout loop from U118's own folded-chip reserve band — some repeated write to a stacked slot's `top` briefly covering the Both button. It did not hold at the lines: the Both button's box held one position for the whole watch in every probe run, Playwright reported the box stable on all of mutant M1's checks, and U118's `placeSlots()` writes a slot a few times at the fold and then stops, well before the window a learner's tap falls in. A second hypothesis, U119's sideways clip moving Hands behind `⋯`, was also considered and refuted: U119's rule sits inside a `landscape, max-height: 500px` media query, and the test runs at 1280 × 720, where it does not apply.

## The fix

The mechanism was in the test, not the screen: the run's own start fold (`showBar(CONTROL_BAR_START_HIDE_MS)`, 700 ms, in place since `b272dce7`) takes the control bar down — `inert`, `pointer-events: none` — before the test's old bare click on Both whenever that click loses the race; only a tap on the sheet brings the bar back, and the old test never taps it. The screen does what it is specified to do (`04` §5, `08` §9.20 and §9.34); the test assumed a bar the specification does not promise. The revised case (`app/tests/e2e/score.run.spec.ts:248`) waits for `data-chrome="folded"` so it can never race the timer, presses Both through `pressControl` (a tap on the sheet, then the control, retried once if the bar folds again in between — the same recovery `score.fuzz`, `lab`, `score.blind` and `score.head-height` already use), and asserts the hand changed and the run restarted to step 0, which its name claimed and the old case never checked.

## Not yours

Any change to the screen, the fold timing, or the fold's unconditional behaviour — all specified. U118's and U119's own mechanisms, confirmed by reverting each in turn, not altered.

## Report, entry, harness

Per `operating-procedure.md` §11–§12, briefly: the CI log read and its own premise found wrong; the failure reproduced on base three ways; each live lane (U118, U119) reverted in turn and the margin measured; the test revised red-first (mutant M1) and green; the app mutant (M2) killed; the test-map line updated; the exit codes and `git status --short`. The entry is `docs/prompts/runs/U118a/ENTRY.md`, starting `### Entry 203 — U118a`. Harness as §14: the builder's own worktree; `npm ci` in `app/`; no commits, pushes, stashes, resets or checkouts; nothing written in the main checkout; never name an AI model; no machine paths in kept files.

**Landed 2026-10-01** (Entry 203; fa0307a9, merged 2ffa1b92); handoff `handoffs/fa0307a9.md`.

## Record

lane: U118a · closes: — · entry: 203
index: CI's red on 43e450a8 (run 36834528688): the hands-change restart test raced the run's 0.7 s start fold; the test now waits for the fold and taps through the sheet, the app unchanged | test | dispatched 2026-10-01 (`U118a-the-hands-change-test-waits-for-the-fold.md`); Entry 203
state: dispatched 2026-10-01: dispatched at 43e450a8 on CI's red, building (Entry 203)
- landed 2026-10-01: merged 2ffa1b92; handoff `handoffs/fa0307a9.md`
- verdict 2026-10-01: APPROVE — the causal model is convincing: the app did not break the hands control, the test raced the Score screen's specified 0.7 s start fold and then tried to click an inert, covered control without using the same sheet-to-bar recovery a learner uses; the revised case waits for the fold, uses the product's real recovery path, and asserts the named hand change/restart behavior; no app code change was warranted, CI subsequently passing this case on its first attempt at `53147902` consistent with the diagnosis; Playwright trace on failure: yes, but folded into T62 rather than a separate workflow lane, a trace on the retry/failure path rather than every passing test, the shard job uploading retained failure artifacts when that shard fails; `placeSlots()`'s forced layout on every bar-control tap recorded as an observation only, no product or CI budget shown to fail because of it; `score.sheet-rows.spec.ts`'s 29.1 s / 30 s pass attached to T62's proof runs rather than a separate row, since T62 is about to change the CI topology materially; U118a closes (`responses/fa0307a9.md`)
- closed 2026-10-01: U118a closes — the hands-change test now waits for the fold and taps through the sheet, the app unchanged; the trace-on-failure and the near-timeout observation fold into T62's own proof runs (`responses/fa0307a9.md`)
