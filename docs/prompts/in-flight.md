# In flight (rewritten at each change; the orchestrator's own working state, 2026-09-27 early morning)

## Running now, each in an isolated worktree under `.claude/worktrees/` (gitignored)

| Seam | Entry | What it owns | On landing |
|---|---|---|---|
| T53c | 86 | **accepted** (`responses/df71a0b.md`); the T53 chain closed | — |
| H0 | 87 | suite reliability, test and harness only (Q34, Q37, Q39, Q44); Playwright on port 4183 in its worktree | merge; no product change to verify — the touched specs under repetition are its proof; record; handoff; push |
| F1 | 88 | **accepted** by the reviewer (`responses/a94baee.md`, unprompted through PR #1) | — |

## Waiting

- **D0** — **dispatched** (Entry 90) in an isolated worktree on T53c's ACCEPT; on landing: merge, the builder's content build, validator and content tests plus vitest as its proof (generator and contracts; no rendering), record, handoff, push; then E0 to the reviewer's gate.
- **Q24** — **closed**, approved by the reviewer (`responses/e32d0ef.md`, unprompted); the MAESTRO download stays the owner's question (Q47).
- **E0** (`docs/prompts/tasks/E0-measured-truth.md`): drafted; to the reviewer's gate after D0 is dispatched; never before D0 lands.

## Standing rules in force tonight

- From Q24 (Entry 89): a fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` first (or `build/midi-parity/` copied from the main checkout), and its content tests fail rather than skip until the build has run with the Joplin edition present. Every brief that runs vitest in a new worktree says so.

- From F1's review: the reviewer treats uncommitted worktree logs as reported, not verified — on each landing, copy the seam's run captures (the exit-code and summary files, not the megabyte logs) into `docs/prompts/runs/<seam>/` beside the entry so the handoff's numbers can be checked.

- One handoff file per seam, named by the implementation commit; `current.md` a pointer only; a response is `responses/<same>.md`; verify every finding at the line; only findings acted on; dispositions in the next handoff.
- Verify by what a seam touches; never rerun a builder's full suite on the same tree; CI is the full run.
- PR #1 is the trigger; never merge it; batch docs-only pushes.
- Not tonight: E implementation, X, broader G, F's contested rows; nothing crosses the T53c → D0 gate.
- The watcher on `docs/review/responses/` is a Monitor re-armed every thirty minutes.
