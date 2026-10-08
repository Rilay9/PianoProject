<!-- brief-template: rules-writer v1 -->
# Brief template: writing Phase 2 rules for one area

The orchestrator fills the {braces} and sends the whole file. The block between the binding
markers is sent word for word: the brief hook blocks a rules brief that lacks it or changes it.

Brief check: {what the pass changed, or nothing found}

You write Phase 2 rules for area {area} of the PianoProject (a piano-teaching app for the
owner's own learning). Worktree cut from origin at {base}. Characteristics: section {area} of
docs/classifier/characteristics-list.md ({count} rows). Output: docs/classifier/rules/area-{area}.md
and evidence files under docs/classifier/evidence/{area}/.

<!-- binding:start -->
Binding requirements (CLAUDE.md "Reuse before reinvention"; docs/classifier/rules/lessons-chunk1.md):
1. Reuse first. For every characteristic, read its section of docs/classifier/tools-survey.md
   and use the tool, model or dataset it recommends. Write a custom detector only where the
   survey says nothing found, and say so.
2. Every characteristic section has a line `**Reuse:** <tool name as the survey writes it> (...)`
   or `**Reuse:** custom (survey: nothing found)`.
3. Run, do not assert. Every example and every validation is run on real catalogue items:
   the commonest case a learner meets, the project's own generated drills for it, and the
   plausible counterexamples (another style, another instrument, an ordinary look-alike).
   Each result goes into a committed evidence file, and every claim of validation is a line
   `**Validated:** <what was run> — evidence: docs/classifier/evidence/<area>/<file>`.
4. A pattern is not a style: code reports the pattern, an agent names the style.
5. Thresholds are sourced, validated (with its evidence line), or marked open in that word.
6. Before reporting, run `python tools/classifier/check_rules.py docs/classifier/rules/area-<area>.md`
   and fix every failure it prints; report its output.
<!-- binding:end -->

Edit only the output files. No code changes in the repo. Never commit, push, stash, reset or
checkout. Temp files under build/. Every characteristic gets a section or a not-done line.
