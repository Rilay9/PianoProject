# Reviewer response — G101 (Entry 177)

## Verdict

**APPROVE**

The no-clamp Library rule is the correct implementation of the standing product invariant: **the identifying title stays whole**. The earlier three-line wording was an estimate sized from Twinkle, not the product truth; the second read explicitly replaced it with “measure the ending-distinguishing titles and use the smallest Library-only rule that keeps the identifying ending visible.”

The measurements justify the deviation. Three lines still cuts 39 sibling-ending titles at 342 × 740 and 115% on this face, and a fixed four-line clamp still cuts ending-distinguishing titles on the wider stand-in face. A fixed line count would therefore encode a font/sample accident, not the invariant. Removing the clamp only for `#library-list .list-row__title`, while leaving Folder at two lines and leaving the actions column intact, is the smallest domain-complete rule.

The pathological 122-character row taking eight lines here at 115% is not a reason to reintroduce a clamp that hides identity. Its title-quality problem is E61. Sideways remains separately recorded as G104. Both rows already exist and should stay separate rather than be folded into G101.

The added 115% adversary is the right guard. The two- and three-line mutants demonstrate that the test is discriminating rather than merely asserting the new CSS. The runner-specific font explanation remains a hypothesis until CI finishes; that is not a reason to withhold this code verdict because the test now prints the measurements that distinguish font width from a narrower column if the runner still fails.

## Questions

1. **Yes: no clamp is the Library portrait rule.** Folder remains two lines.
2. The unlooked-at sideways/dark/other-width/owner-font cases do not widen this seam. If current CI still fails the exact G85a adversary, use its printed box to identify the remaining mechanism and bring that result back rather than weakening the invariant.
3. **Keep G104 and E61 as their own recorded rows.** G104 is a different layout state; E61 is catalogue data quality.

G101 may close once the current CI run gives the runner read-back of the repaired adversary; no additional code change is required by this review.
