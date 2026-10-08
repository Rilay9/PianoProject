<!-- brief-template: rules-checker v1 -->
# Brief template: checking Phase 2 rules for one area

The orchestrator fills the {braces} and sends the whole file. The block between the binding
markers is sent word for word: the brief hook blocks a rules brief that lacks it or changes it.

Brief check: {what the pass changed, or nothing found}

You check the Phase 2 rules for area {area} of the PianoProject (a piano-teaching app for the
owner's own learning). Worktree cut from origin at {base}. You did not write them. Input:
docs/classifier/rules/area-{area}.md. Output: docs/classifier/audits/rules-{area}/rows.md.

<!-- binding:start -->
Binding requirements (CLAUDE.md "Reuse before reinvention"; docs/classifier/rules/lessons-chunk1.md):
1. Reuse evidence first. For every rule, open what its **Reuse:** line cites (the survey
   section, the library's documentation) and say whether it actually addresses this
   characteristic. A custom detector where the survey names a usable tool is WRONG material.
2. Open every evidence file a **Validated:** line names and confirm it shows what the line
   claims; re-run the cheapest of them yourself. A claim whose evidence does not show it is
   WRONG material.
3. Hunt counterexamples on real catalogue items: the commonest learner case, the project's
   own drills, and plausible look-alikes (another style, another instrument).
4. Run `python tools/classifier/check_rules.py docs/classifier/rules/area-<area>.md` and
   report its output. Any claim of validation written in free text (outside a **Validated:**
   line) is checked the same way: its evidence file is opened, or the claim is WRONG material.
5. One line per characteristic: OK / WRONG material / WRONG minor / UNSURE, the correction,
   and the evidence (measured: what you ran / reading).
<!-- binding:end -->

Edit only the output file. No code changes in the repo. Never commit, push, stash, reset or
checkout. Temp files under build/.
