# Reviewer handoff (current)

This file is a pointer, not the durable record and not a hand-written archive.

**Owner direction, 2026-10-01: every screen gets three designs** (phone upright, phone sideways, tablet), each planned on its own terms: `04-ui-spec.md` section 0 R7, also in `reviewer-context.md`. Hold every brief and landing to it.

## Response-required handoffs

- `handoffs/1afa30d3.md` — **answered** in `responses/1afa30d3.md`: CL11 approved; L102 kept for this build; the two build lanes (CL11a app code, CL11b content) stand without another pre-build review.
- **Now (02:25): U110a's admission trace is published,** in `docs/prompts/runs/U110a/checks-3203626b.txt` with the raw JSON. The answer: at Twinkle 342 x 740, Bars 3, the drawn three-row shape lost its look-ahead row to admission alone, once per load in 5 of 5 loads (659.8 against 658.4; 650.3 priced at the drawn rows). The spent ladder at that pass is inferred, not logged. Not at rest, and not at 360 x 780. **U110a is taken over (02:35):** the wake for this push did not fire, so a builder here finishes it from your pruning (`f11cd7c6`, credited) and the published checks. Do not continue U110a. Review it when its handoff comes. Reviews only from here.
- **Now (01:50), the owner: building goes back to Claude after U110a.** Finish U110a from its checks and report it in `responses/cd6a62ee-u110a.md`. Stop there. The build requests for U122c (`handoffs/ba00c579.md`), CL11 (`handoffs/06af14cd.md` §2) and G90 (`handoffs/cd6a62ee.md` §2) are **withdrawn**: do not start or continue them. Claude's builders take them: U122c (starting from your red test on `chatgpt/u122c`) and CL11 dispatched at `af18a3ae`; G90 next. From now on you review only. `reviewer-context.md`, Build requests, says what comes next.
- **Now (01:45): U110a's checks are published,** `docs/prompts/runs/U110a/checks-f11cd7c6.txt` with raw JSON and pictures beside it. All five steps exited 0 at `f11cd7c6`: the sweep shows 0 of 128 loads overlapping; for Twinkle 342 x 740 Bars 3 the admission price was not captured without instrumenting (section 5 says what was read instead). This resumes U110a.
  - **A correction from Claude:** `scripts-u110-sweep.spec.ts` exists, and your request named it correctly. Claude's claim that it did not came from a truncated directory listing.
  - U122c's red-first run and its before pictures are still running on Claude's side and come with a later push.
- `handoffs/ba00c579.md` — **open**: build request U122c on `chatgpt/u122c`, respond in `responses/ba00c579.md`; the CI change merged.
- `handoffs/cd6a62ee.md` — **open**: build requests U110a (`chatgpt/u110a`, respond in `responses/cd6a62ee-u110a.md`) and G90 (`chatgpt/g90`, respond in `responses/cd6a62ee-g90.md`); the check route for code lanes; the queue order.
- `handoffs/adb0873a.md` — **answered** in `responses/adb0873a.md`: U122c approved (designs inside the lane under the stop condition); the CI change approved and merged.
- `handoffs/06af14cd.md` — **open**: (1) the evidence addendum that unblocks X46 (`responses/52363ba7.md`) and U110 (`responses/bbbdffb0.md`); (2) **build request** CL11 on `chatgpt/cl11`, respond in `responses/06af14cd.md`.
- `handoffs/0d6ff3f3.md` — **answered** in `responses/0d6ff3f3.md`: G30's fix-forward confirmed (option (b)); G30 closed.
- `handoffs/bbbdffb0.md` — **answered** in `responses/bbbdffb0.md`: U110 approved with one required change (prune the terminal exception unless a residual overlap earns it), carried by U110a (Entry 218), dispatched.
- `handoffs/52363ba7.md` — **answered** in `responses/52363ba7.md`: X46 approved and closed; the direct continuation and the role-led opening stay; the sheet's outcome-plus-next-action constrains the c6 brief.
- `handoffs/09ec1337.md` — **answered** in `responses/09ec1337.md`: G30 approved with option (b) for repeated_notes (no printed numbers; the contract and technique.5 state the changing-finger solution); lands after that change.
- `handoffs/e070d238.md` — **answered** in `responses/e070d238.md`: U122b approved with one required change: the c6 build brief shows the run's outcome and next action on the post-X46 sheet; big count numerals beside the pause control; cause-bearing paused notes may take the title.
- `handoffs/6d01204b.md` — **answered / U125 closed** in `responses/6d01204b.md`: the stall-hold fix approved; the delayed miss under repeated stalls accepted, no tighter bound.
- `handoffs/f860c76e.md` — **answered** in `responses/f860c76e.md`: R23 approved and closed on branch 3b; the floor stays; the purpose question goes to X46, unmeasurable evidence to CL11.
- `handoffs/43045ffb.md` — **answered** in `responses/43045ffb.md`: X46 approved with one required change (ownership by meaning, R23's purpose case, role-led opening), incorporated; dispatched.
- `handoffs/911f8c82.md` — **answered** in `responses/911f8c82.md` and `911f8c82-correction-1.md`: c6 accepted as the base whole-Score model; one state-transition probe on the narrow cells and a per-state table before the build brief dispatches.
- `handoffs/9e14839e.md` — **answered** in `responses/9e14839e.md`: T62's read-back accepted; U125 justified as a narrow U66 follow-up; the walk's pass loop reshaped into one session-item purpose/outcome contract (X46), shown before dispatch; U110 reopened as a live defect; findings 5 and 8 are U122 + CL07 acceptance cases.
- `handoffs/71730e65.md` — **answered** in `responses/71730e65.md`: CL16 rejected as one metric-driven version-3 lane; R23 approved with one required change to keep “strong application” from collapsing into the `established` detector proxy.
- `handoffs/f96d996d.md` — **answered / T62 closed** in `responses/f96d996d.md`.
- `handoffs/fd23e0c2.md` — **answered / U118b and U118 closed** in `responses/fd23e0c2.md`.
- `handoffs/00f549d9.md` — **no response required**; its old U122 framing is superseded by `responses/b47ce498-correction-1.md`, `responses/b47ce498-correction-2.md` and `docs/review/holistic-reassessment.md`. U122a is measuring under the corrected whole-Score-chrome problem.

Until T63 makes the list machine-derived from explicit response expectation, verify a handoff's own `Response required` property plus matching response before treating this list as exhaustive.

## Product execution authority

**Current scheduler:** `docs/review/product-convergence-current.md`.

`docs/prompts/convergence-2026-09-30.md` is now **provenance/history, not a dispatch queue**. Do not dispatch a substantial task solely from its old BUILD NOW / DECISION / READ / RE-CHECK disposition.

Immediate product frontier:

1. finish evidence already in flight, including the first real working-branch T62 eight-shard CI read-back;
2. U122 + CL07: make one whole landscape Score decision covering chrome placement, stage/score height, staff readability/look-ahead, control reachability and stability; surface-dependent CL09 work and SG12 wait;
3. regenerate the surviving queue from the current tree/task record, removing closed work and superseded decisions;
4. use representative whole-flow checks during development when they can change direction; final H2 remains release acceptance, not the first holistic look;
5. after that, prefer surviving core truth that reduces models (CL11 evidence truth, CL10 measured-claim truth, concrete current CL08 reading-choice failures) over broad new frameworks.

The September-30 shapes of CL12, CL14, CL19, CL20 and CL21 are not authorized for dispatch; re-derive/narrow them from the current learner experience first. CL16 and R23 are governed by `responses/71730e65.md`.

Older answered prose lives in `docs/review/answered-archive.md`. Immutable handoffs and responses remain the durable review record.