# SR2: the research differential (H4), declared against moved

The corpus is the frozen `docs/prompts/runs/sightreading-quality/MANIFEST.json` (374 items). It was run by the lane's export (`app/tests/research/srExport.research.ts`, revised by SR2) and by copies of the lane's scripts. The committed files are never rewritten.

**Base.** The lane's original scripts reproduce `checks-run1.csv` byte for byte.

**Script adaptations, in copies only:**
1. A `NO-OFFER` outcome: every property NA except determinism.
2. P7 reads `metre.three-four` from the exported taught set, through the lane's own exact-3/4 detector (`metre.triple`), in place of the hard-coded 1.4 order.

Re-checking the base run with the adapted scripts moved no property on any item.

**Declared before the after-run.** Written by `declared_population.py` from each item's build spec:
- 28 items while finish item 8 stood: 16 O items of `-2-right`, 8 BC, 4 A.
- 12 items after item 8 was reverted (H8 refuted).

| Item | Declared (S8) | Moved | How |
|---|---|---|---|
| BC_learner_0.1_d1..d4 | (a) no daily read | yes | NO-OFFER; P1-P8 and P10 PASS→NA, P7 FAIL→NA |
| BC_learner_1.1_d1..d4 | (a) held to 1.1's set (`skips: false`) | yes | bytes changed; P7 FAIL→PASS |
| A_3-4-gap_1-left_at_1.3_d1..d4 | (b) 3/4 asked at 1.3, held to 4/4 (the params pass through the hold) | yes | bytes changed; P7 FAIL→PASS |
| the other 362 | unchanged | no | byte-identical, identical properties |

**Summary.** 12 declared, 12 moved; no undeclared mover. This was re-run after the orchestrator's two decisions (the 3/4 move's availability and curated-only), with the same result. Nothing heard.
