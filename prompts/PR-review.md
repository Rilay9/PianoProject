# PR-review — Independent review of a phase  ·  Intended model: **Opus 5**

(Include `_COMMON-HEADER.md`.)

Review branch `<branch>` against the phase prompt `<prompts/Px-*.md>` and the docs it names.
Check: acceptance criteria actually met (re-run the commands), spec deviations without a
decision note, engine/render misuse (rendering on input path, timers instead of AudioContext
clock, DOM access in `engine/`), licensing rules in `docs/03` §1, test gaps in the stated
matrix, performance budget risks. Fix small issues directly; for larger ones write precise
follow-up tasks. Report as in the common header.
