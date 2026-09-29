"""
G1c: fill the entry's three placeholders once the whole suite and the final-test red had run.
Idempotent (a filled entry has no placeholder left). Run from the repository root.
"""
from pathlib import Path

P = Path("docs/prompts/runs/G1c/ENTRY.md")
FILL = {
    " FINAL_TEST_RED_LINE": " (That capture is of the file as first written; its hoisted state was rewritten for lint afterwards.)\n"
    "- `red-vitest-final-tests-head-sources.txt` — the final tests over HEAD's `PlanScreen.ts` and `session.ts` (this tree's two files written back by their bytes after, sha256 checked; `scripts-final_tests_head_sources.py`): the same five of six red; the revised guard red (*expected [] to deeply equal [ 'curriculum/session.ts', 'ui/screens/PlanScreen.ts' ]* — nothing imports the constant alone there); `lessonClaimsAboutApp`'s two reds, identical to this tree's.",
    "VITEST_FULL_EXIT": "1",
    "VITEST_FULL_SAID": "312 files; 7,181 passed, 2 failed, 5 skipped, 1 todo — the two recorded `lessonClaimsAboutApp` reds (*blues.3 … Rhythm only* and *4.7: blind hides the score…*, which search `ScoreScreen.ts` and `style.css` for a literal `\\n` in this CRLF checkout, Entry 101's diagnosis), red identically over HEAD's two sources (`red/red-vitest-final-tests-head-sources.txt`)",
    "CHECKS_SAID": "11 paths, 11 matched, 0 unmatched; tsc, lint, the unit suite, the app build, and twelve browser specs (all twelve run above)",
}

text = P.read_text(encoding="utf-8")
for key, value in FILL.items():
    if key in text:
        text = text.replace(key, value)
        print(f"filled {key.strip()}")
P.write_text(text, encoding="utf-8", newline="\n")
left = [key.strip() for key in FILL if key.strip() in text]
print(f"placeholders left: {left}")
