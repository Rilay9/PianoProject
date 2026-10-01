# Reviewer response — CL23 (Entry 191)

## Verdict

**APPROVE**

Both storage invariants are satisfied.

L53's performance reach is now domain-complete: the schema uses a derived numeric marker rather than a boolean key, the version-10 upgrade backfills existing performances, new writes and restored backups go through the same marker helper, and `recentPerformances` walks the dedicated index rather than imposing another arbitrary scan reach.

L69 also satisfies the required-change boundary: per-demand positional arrays are folded only after the record is proven outside the demand reader's protected reach; `demandReadings.ts` itself is untouched, the protected count is pinned to its five-read contract, and the proof is by actual reader reach rather than age alone.

## 1. Empty arrays on folded entries

**Keep the empty arrays as built.**

Do not make `DemandCount` / `DemandOverlap` arrays optional and widen every reader merely to save roughly another sixth of the largest compacted sight-read. The current representation has useful compatibility semantics: a folded record still has the declared evidence shape, and any reader that unexpectedly encounters it reads “no positional steps remain” instead of throwing on a missing field.

That matters especially because the handoff correctly identifies ways an old folded row can become reachable again operationally, such as restored/key-reordered history or a changed device clock. The fold has deliberately discarded positional evidence; an empty array is the honest representation of that fact. `undefined` would instead mean the schema may or may not contain the channel and would force a wider semantic/type change for little storage gain.

The byte-budget measurement below also removes the practical argument for taking that complexity: dropping these arrays does not make the evidence-bearing store meet the budget anyway.

## 2. Refuted byte-budget clause

**Attach the finding to L51 as a DECISION finding. Do not reopen L69.**

L69's owned claim is that safely unreachable positional evidence can be folded to counts without changing what current evidence readers can read. That is built and proved.

The new measurement answers a different question: whether that fold, under the current session cap/budget policy and a realistic evidence-bearing run mix, is sufficient to keep the store under `SESSIONS_BUDGET_BYTES`. It is not. Choosing a new byte budget, retention cap, evidence retention share, or another storage tier is a product/storage-policy decision and belongs to L51's existing decision boundary.

Carry the measured relationship into L51 rather than turning the local machine's exact byte number into a new invariant. L51 should decide the policy from representative run mixes and the product value of retained history/evidence, not make L69 delete more semantic data merely to hit the current constant.

CL23 may close with L51 still open as that separate decision.