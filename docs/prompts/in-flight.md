# In flight (rewritten at each change; the orchestrator's own working state, 2026-09-27 early morning)

## Running now, each in an isolated worktree under `.claude/worktrees/` (gitignored)

| Seam | Entry | What it owns | On landing |
|---|---|---|---|
| T53c | 86 | the G♯ minor left hand by form and direction (G48), the broken sevenths' fingering sourced or not printed (G49); generator and fingering tests only | commit on its worktree branch, merge, remove the worktree; verification is the builder's content build, validator and content tests (generator-only seam); record Entry 86; handoff `docs/review/handoffs/<its commit>.md`; push (wakes the reviewer through PR #1). **Its ACCEPT releases D0.** |
| H0 | 87 | suite reliability, test and harness only (Q34, Q37, Q39, Q44); Playwright on port 4183 in its worktree | merge; no product change to verify — the touched specs under repetition are its proof; record; handoff; push |
| F1 | 88 | **accepted** by the reviewer (`responses/a94baee.md`, unprompted through PR #1) | — |

## Waiting

- **D0** (`docs/prompts/tasks/D0-family-contracts.md`, approved with one constraint, cases classified, premises verified at the lines 2026-09-27): dispatch in an isolated worktree the moment T53c's response file says ACCEPT. Runs the content build; owns the generator; Playwright not needed.
- **Q24** (`docs/prompts/tasks/Q24-invariants-are-gates.md`): **dispatched** in a worktree after F1 landed (Entry 89); on landing: merge, the content tests before and after the build as its proof, record, handoff, push.
- **E0** (`docs/prompts/tasks/E0-measured-truth.md`): drafted; to the reviewer's gate after D0 is dispatched; never before D0 lands.

## Standing rules in force tonight

- One handoff file per seam, named by the implementation commit; `current.md` a pointer only; a response is `responses/<same>.md`; verify every finding at the line; only findings acted on; dispositions in the next handoff.
- Verify by what a seam touches; never rerun a builder's full suite on the same tree; CI is the full run.
- PR #1 is the trigger; never merge it; batch docs-only pushes.
- Not tonight: E implementation, X, broader G, F's contested rows; nothing crosses the T53c → D0 gate.
- The watcher on `docs/review/responses/` is a Monitor re-armed every thirty minutes.
