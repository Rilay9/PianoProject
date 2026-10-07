# Reviewer response — questions at `53147902`

## T62 — CI browser tests in parallel shards

**APPROVE WITH ONE REQUIRED BRIEF CHANGE before dispatch: make the cross-job state and disposable-branch proof mechanism executable.**

The architecture stands: build/content/unit work once; browser tests split across a matrix; post-E2E render/validate remains ordered after the browser gate; the concurrency contract stays untouched; every E2E spec runs exactly once; and `test_ci_order.py` becomes job-aware rather than being weakened.

The brief currently has two linked mechanics that are not true on a fresh multi-job graph. Correct them together, then dispatch without another product/architecture round.

### A. The same-run artifact contract must carry the state Job 3 actually reads and mutates

`app/dist` is sufficient for a browser shard to *serve* the already-built app, but it is **not** sufficient for the post-shard render/validate job.

`render_check.py --apply` reads `app/public/content/catalog.json`, uses `build/render-manifest.json`, runs the browser check, and writes measured durations back into that same `app/public/content/catalog.json`; the following `validate.py` must validate those bytes. A fresh Job 3 that restores only `app/dist` is therefore not operating on Job 1’s built content.

Amend the brief so Job 1 publishes explicit same-run artifacts for both purposes:

- **browser app artifact:** `app/dist/` for the N E2E shards;
- **mutable content/render state for the post job:** at minimum the built `app/public/content/` and `build/render-manifest.json` from Job 1, plus any other exact build output `render_check.py` consumes rather than regenerates.

Job 3 must check out the same tree, restore those exact Job-1 bytes, install the Node/Chromium runtime its Playwright render check needs, run `render_check.py --apply` against the restored `app/public/content`, and run `validate.py` against that same now-mutated catalogue. It may use the same “serve existing dist, do not rebuild” Playwright flag as the shard jobs if the render-check path proves that flag leaves its behavior identical.

Do not substitute the cross-run content cache for this same-run handoff. The brief is right that an artifact is the contract here.

### B. Preserve `content-previews` diagnostics across job boundaries

“Move `Upload content previews` to Job 3 unchanged” is not equivalent to today.

Today the upload is `if: always()` in the same workspace as the content build and, when reached, the render check. If a browser step fails, the final upload can still expose whatever previews already exist. In the proposed graph a failed matrix skips an ordinary `needs: matrix` Job 3, so there would be no upload at all; and a fresh Job 3 does not inherit Job 1’s `build/previews` unless they are transferred.

The amended brief must preserve the diagnostic outcome explicitly: a CI failure after Job 1 must still leave the previews Job 1 produced available, and a successful post-render job must expose the render-check previews as today. The builder may implement that with staged artifacts/overwrite or an always-run diagnostics handoff, but prove the failure and success paths; do not silently lose the existing `if: always()` evidence.

### C. The disposable-branch proof cannot bootstrap with `workflow_dispatch` only on that branch

GitHub’s manual-dispatch contract requires the workflow configured with `workflow_dispatch` to exist on the repository’s default branch before a dispatch can be triggered. The current default branch is this working branch, and its current `ci.yml` has no `workflow_dispatch` trigger. Therefore the brief’s proposed sequence — add `workflow_dispatch` only on a disposable branch, run it twice there, then put anything on the working branch — cannot produce its first run.

Keep the goal of **two real runner proofs before the final working-branch CI graph lands**, but change the proof mechanism. The smallest clean route is a disposable proof branch whose copy of `ci.yml` temporarily includes that exact branch in `on.push.branches`; push the candidate graph there twice, inspect both runs, then remove the proof-only branch trigger from the final diff. An already-existing default-branch dispatch harness would also be acceptable, but do not claim the new branch-local `workflow_dispatch` can bootstrap itself.

`workflow_dispatch` may still be kept in the final workflow if there is an independent reason to want manual CI afterwards; it is not the mechanism that can prove this change before it reaches the default branch.

### D. Fold U118a’s CI diagnostics into T62

While T62 already owns the workflow/config:

- enable Playwright trace capture on the retry/failure path (not every passing test), and upload the retained shard failure artifacts so future race/layout reds carry the DOM/layout evidence the call log lacked;
- during the two proof runs record `score.sheet-rows.spec.ts`’s duration/retry result. Its prior timeout and 29.1 s / 30 s pass are evidence of a brittle budget, but do not open a separate row before the new topology is measured. If it still times out or remains demonstrably at the edge under the sharded graph, repair that test’s own wait/timeout from its mechanism before T62 lands rather than raising a global timeout.

### Everything else in T62 stands

- N is selected from measured runner results rather than asserted here.
- Each shard keeps the literal `npm run e2e` substring required by the checks map.
- The shard-union/list-and-compare guard remains required.
- The CI-only Playwright webServer conditional defaults byte-for-byte to today when the artifact flag is absent.
- Render then validate remains one ordered post-browser sequence.
- Q63’s concurrency and record/review-only trigger contract remain unchanged.
- `test_ci_order.py` must assert the job graph and true cross-job dependencies, not merely find step names somewhere.

Once sections A–D are folded into the brief, **APPROVE FOR DISPATCH**; no further pre-review is needed unless the correction requires changing the product test set or the Q63 concurrency semantics.

## Test-map docs note

**APPROVE.**

The duplicate `sightReadingUnchanged.test.ts` and `sightReadingPromises.test.ts` entries have been merged into single rows while retaining the facts that differed, including the version-1/version-2 golden clause and the historical jazz.8/theory.9 path history. The `score.screen.spec.ts` row now correctly carries U105b, U105c and U105d’s refusal cases, and the later U119 line accurately records the real control-click grid and its current residual question.

No further docs correction is required from this note.