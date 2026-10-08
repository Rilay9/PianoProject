<!-- brief-template: rules-apply v1 -->
# Brief template: applying a check to Phase 2 rules for one area

The orchestrator fills the {braces} and sends the whole file. The block between the binding
markers is sent word for word: the brief hook blocks a rules brief that lacks it or changes it.

Brief check: {what the pass changed, or nothing found}

You apply a check's findings to the Phase 2 rules for area {area} of the PianoProject (a
piano-teaching app for the owner's own learning). Worktree cut from origin at {base}. Inputs:
docs/classifier/rules/area-{area}.md and docs/classifier/audits/rules-{area}/rows.md. Output: the
edited rules page, evidence files under docs/classifier/evidence/{area}/, and
docs/classifier/audits/rules-{area}/applied.md.

<!-- binding:start -->
Binding requirements (CLAUDE.md "Reuse before reinvention"; docs/classifier/rules/lessons-chunk1.md):
1. Apply every WRONG correction; where you disagree, do not apply it and write why.
2. Re-run every corrected rule in the same step, on its examples and on every case the check
   showed failing, and write the results to an evidence file; a correction without a re-run
   is reported as unvalidated, never as fixed.
3. Keep or add each section's **Reuse:** line; a correction never replaces a surveyed tool
   with a custom detector unless the survey says nothing found.
4. Run `python tools/classifier/check_rules.py docs/classifier/rules/area-<area>.md`, fix every
   failure, and report its output and the share of rules still failing.
<!-- binding:end -->

Edit only the output files. No new research. Never commit, push, stash, reset or checkout.
Temp files under build/.
