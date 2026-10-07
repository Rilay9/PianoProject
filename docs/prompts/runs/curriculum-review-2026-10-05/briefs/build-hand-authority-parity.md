# Brief: the build's declared-hand rule mirrors the app's, and two truth cleanups (HD1a; 2026-10-06)

**What governs:** the outside reviewer's required change in `docs/review/responses/1a02701e.md` §1 (read it whole), FABLE §6 and §7. Entry 244 gave the app one authority rule for a one-staff item's declared hand (`app/src/curriculum/declaredHand.ts`: a bundled file, not an import, `provenance.facts.hands.kind` authored or reviewed). `tools/content/build.py::declared_hand` does not implement the same rule: it returns any bundled row's `hands: left|right` without checking the provenance kind or `imported`. The current catalogue may make the two equivalent in practice, but they are different rules, and the measured-cells seam (CD1, running) relies on the build bridge for left-hand cell facts. A parity correction, not a new hand-classification system.

**Finish condition:**
1. `build.declared_hand(entry)` mirrors the app predicate exactly (or the build's equivalent invariant is factored so it demonstrably rejects the same non-authoritative cases): authored or reviewed `left`/`right` with a bundled file and not an import is accepted; inferred, no fact, import, or no bundled file is rejected; `both` and absent give no declaration. The cache continues to key and re-measure on the resulting declaration; the same-file contradictory-declaration stop remains.
2. A compact Python test in `tools/content/tests/` (beside the build or demands tests) covering at least: authored and reviewed left and right accepted; inferred, no fact, import and no bundled file rejected; the contradiction stop still raised. Red first where the old rule accepts what the new one rejects (say which case).
3. `docs/01-architecture.md` §4.1: the hand contract distinguishes the physical staff from the semantic hand and names the authoritative one-staff declaration override (Entry 244, CL15 amended); no clef inference implied.
4. `docs/prompts/checks.json`: the `scoreControls.ts` reason's spec count recomputed from the current tree (it still states the count from before `score.declared-hand.spec.ts` was added); `test_checks_for_paths` green.
5. `docs/08-test-map.md`: the HD1 row names the new Python test.

## Files owned

`tools/content/build.py` (the `declared_hand` function and its callers' expectations only), the new Python test file, `docs/01-architecture.md` §4.1, `docs/prompts/checks.json` (the one reason string), `docs/08-test-map.md` (the row). Nothing else; the app's rule is the reference and is not edited; `demands.py` only if the declaration's type changes (say so).

Harness: `operating-procedure.md` §14. Python is `py -3.11` with `PYTHONIOENCODING=utf-8`. No content build, no Playwright; the build's own tests (`test_measured_truth`, `test_checks_for_paths`, `test_demands_tool`) and the new test are the checks. No commit, push, stash, checkout or reset; never name an AI model; park temporary files under `build/` in the worktree. Reply in at most six lines: the rule as implemented, the red-first case, the tests' totals, the recomputed count, a draft record entry (where, what, before, after, why), anything not done.
