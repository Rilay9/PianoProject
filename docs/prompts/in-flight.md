# In flight (rewritten at each change; the orchestrator's own working state, 2026-09-27 early morning)

## Running now, each in an isolated worktree under `.claude/worktrees/` (gitignored)

| Seam | Entry | What it owns | On landing |
|---|---|---|---|
| T53c | 86 | **accepted** (`responses/df71a0b.md`); the T53 chain closed | — |
| H0 | 87 | **closed**, approved by the reviewer (`responses/a008ba5.md`, unprompted); U66 recorded for X | — |
| F1 | 88 | **accepted** by the reviewer (`responses/a94baee.md`, unprompted through PR #1) | — |

## Waiting

- **D1** — approved with one required change (`responses/b15758e.md`): **D1a** dispatched (Entry 97; the fail-closed fallback, the record field, the flip); on landing: merge, tsc, the sight-reading suites and the seven revised tests, the evidence files, three phrases per level rendered, record, handoff, push. Its ACCEPT closes D1. **D2** (Entry 95) — **landed** and handed off (`handoffs/7e148e0.md`); awaiting the reviewer; U67 (Hear it silent after a reload) is a P1 for a small X seam.

- **D0 / D0a** — **closed**: D0a accepted (`responses/3b9c37d.md`); B7 kept (G53), the arpeggios' notation to G52.
- **Q24** — **closed**, approved by the reviewer (`responses/e32d0ef.md`, unprompted); the MAESTRO download stays the owner's question (Q47).
- **E0 / E0a / E0b** — E0a **accepted** (`responses/5bfe6d2.md`); the reviewer decided L108 (the walking bass is taught at jazz.6): **E0b** dispatched (Entry 96; `taughtAt` as a list); on landing: merge, the named unit files and the gate consumers, the promise suite, record, handoff, push. Its ACCEPT closes E0.

## Standing rules in force tonight

- From Q24 (Entry 89): a fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` first (or `build/midi-parity/` copied from the main checkout), and its content tests fail rather than skip until the build has run with the Joplin edition present. Every brief that runs vitest in a new worktree says so.

- From F1's review: the reviewer treats uncommitted worktree logs as reported, not verified — on each landing, copy the seam's run captures (the exit-code and summary files, not the megabyte logs) into `docs/prompts/runs/<seam>/` beside the entry so the handoff's numbers can be checked.

- One handoff file per seam, named by the implementation commit, and a brief handoff file for each pre-dispatch gate, named by the commit that carries the brief; `current.md` a pointer only; a response is `responses/<same>.md`; verify every finding at the line; only findings acted on; dispositions in the next handoff.
- Verify by what a seam touches; never rerun a builder's full suite on the same tree; CI is the full run.
- PR #1 is the trigger; never merge it; batch docs-only pushes.
- Not tonight: E implementation, X, broader G, F's contested rows; nothing crosses the T53c → D0 gate.
- The watcher on `docs/review/responses/` is a Monitor re-armed every thirty minutes.
