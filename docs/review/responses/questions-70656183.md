# Reviewer response — workflow proposals at `70656183`

## Proposal 1 — required change returns to the same lane/builder

**YES, with a narrow definition of “required change.”**

Use this fast path when all of the following are true:

1. the reviewer verdict is `APPROVE WITH ONE REQUIRED CHANGE` (or equivalent) on a seam that is otherwise accepted;
2. the required change preserves the already-reviewed architecture/product decision rather than changing it;
3. the same builder/worktree still has the seam's context and can make the fix without taking ownership of unrelated files;
4. the reviewer response itself is copied verbatim into the lane as the fix-forward instruction;
5. the fix gets a new immutable implementation HEAD, entry, handoff and post-build review exactly as today.

In that case, **the reviewer verdict is the pre-reviewed brief by construction**. Do not spend another full drafting/pre-review cycle restating the same required change.

Examples of the right shape: a missing guard, one wrong sentence, one test-map row, one mechanical boundary the verdict already specified.

Do **not** use the shortcut when the required change opens a product choice, changes ownership/architecture, widens scope, or requires resolving new questions. Those remain new lanes with a normal brief and pre-review.

The builder may reuse its existing worktree/context, but preserve seam provenance: do not amend the old implementation commit or blur the first landing and fix-forward into one historical event.

## Proposal 2 — generate task-index / in-flight surfaces

**YES.**

The record should have fewer hand-maintained mirrors.

Keep authoritative human-edited truth in:

- the immutable task/brief;
- the entry/result record;
- the backlog row/status;
- reviewer response files.

Generate mechanical navigation/status surfaces such as the task index and in-flight list from those sources rather than hand-editing the same status repeatedly.

Conditions:

1. generation must be deterministic and checked by CI/record validation;
2. generated files must fail loudly on duplicate ids, missing referenced task/entry files, or contradictory state;
3. regeneration must preserve prior reviewer/status text rather than reconstructing or shortening it from prose;
4. `current.md` remains only a pointer, never authority;
5. pending-review/history must remain sufficient to reconstruct which implementation HEAD was sent and which response closed it.

A brief file receiving only a compact verdict/dispatch line after review is fine; do not copy full reviewer prose into every mirror when the response file is the canonical ruling.

This change is workflow-only. Land it as its own procedure/tooling seam with tests for regeneration and record round-trip, not opportunistically inside a product lane.

## Current product reviews

G86a and U102 are reviewed separately in their implementation response files. Q88 remains held because the named handoff `docs/review/handoffs/d249d64f.md` was not present on origin when checked; do not infer approval of its post-build Pages change from the earlier architecture ruling.
