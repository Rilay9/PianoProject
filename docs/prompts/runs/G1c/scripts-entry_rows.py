"""
G1c: the entry's exit table gains the final-test red's row, and its file list the two scripts written
after the draft. Idempotent by the inserted text. Run from the repository root.
"""
from pathlib import Path

P = Path("docs/prompts/runs/G1c/ENTRY.md")
EDITS = [
    (
        "| vitest, the whole suite (`vitest-full.txt`) |",
        "| vitest, the final tests over HEAD's `PlanScreen.ts` and `session.ts` (`red/red-vitest-final-tests-head-sources.txt`) | 1 | 8 of 322 red: the five Plan cases, the revised guard, the two `lessonClaimsAboutApp` cases; this tree's files restored by sha256 |\n",
    ),
]
text = P.read_text(encoding="utf-8")
for anchor, row in EDITS:
    if row in text:
        print("row already in")
        continue
    assert text.count(anchor) == 1
    text = text.replace(anchor, row + anchor)
    print("row added")
old = "`scripts-restore_x1_pictures.py`, `scripts-sanitise.py`,"
new = "`scripts-restore_x1_pictures.py`, `scripts-final_tests_head_sources.py`, `scripts-fill_entry.py`, `scripts-entry_rows.py`, `scripts-sanitise.py`,"
if new not in text:
    assert text.count(old) == 1
    text = text.replace(old, new)
    print("files added")
P.write_text(text, encoding="utf-8", newline="\n")
