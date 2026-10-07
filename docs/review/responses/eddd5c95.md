# U110a review — eddd5c95

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

The replacement predicate is the right mechanism. U110's measured-row guard removed a look-ahead row even when the drawn rows fit; `rowsFitStage` instead asks the same packing question that `packSlots` acts on. The fitting and overflowing unit cases isolate both halves, and the old-guard and no-exception mutants fail on the corresponding half. The final window-rule run and 128-load sweep show no ordinary-state regression.

## Required change

**BLOCKS U110a closure: reproduce the state that earns the exception in a browser.**

The retained exception exists solely for a height-only stage shrink after the reshape ladder is spent. That state was demonstrated only with `FakeOsmdView`; the final browser sweep never entered it and therefore cannot establish that a learner can meet it or that dropping the row leaves the real engraving readable.

Add the smallest browser probe that holds all of these facts at once:

- a look-ahead row is drawn and the ladder is spent;
- stage height shrinks while width, requested bars and engraving zoom stay fixed;
- the pre-shrink rows fit;
- after shrink, the real drawn rows fail the same packing test;
- the look-ahead row drops, the two window rows remain, and their ink neither overlaps nor leaves the stage.

Keep before/after pictures and the measured row boxes. A phone-upright case is sufficient for this predicate because the existing final sweep already covers the unchanged phone-sideways and tablet cells. If the real renderer cannot reach the state, remove the exception: a stand-in-only exposure does not earn production branching.

No broader renderer change is requested. The pruning, shared packing predicate, history-free decision, docs and existing tests stand.

## Evidence checked

Reviewed the handoff, Entry 218, `WindowRenderer.ts`, the four U110a unit cases, invariant 40, test-map edits, pruned-only measurement, final checks, mutants and raw sweep summary at **eddd5c95**. The targeted results are internally consistent: 38 unit cases pass; each mutant turns the intended half red; 20 window-rule cases pass; 128 final loads report no overlap above 0.5 px and the same shape as the pruned tree in all 128. Those results support the implementation except for the exact browser state above.
