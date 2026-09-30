"""U103's lane-only mutant: the placement's Fail built as a filled box, so the corrected check must go red.

usage: python scripts-mutant-u103.py apply|restore  (run from the worktree root)

`apply` saves nothing itself: the changed DrillScreen.ts is saved beforehand as
build/u96a/DrillScreen.changed.ts with its sha256. `restore` copies it back and checks the sha256.
"""
import hashlib
import shutil
import sys

PATH = "app/src/ui/screens/DrillScreen.ts"
SAVED = "build/u96a/DrillScreen.changed.ts"
BEFORE = "          { id: 'drill-placement-fail' },\n"
AFTER = "          { id: 'drill-placement-fail', variant: 'primary' },\n"


def sha(path: str) -> str:
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


if sys.argv[1] == "apply":
    text = open(PATH, encoding="utf-8", newline="").read()
    newline_before = BEFORE.replace("\n", "\r\n") if "\r\n" in text else BEFORE
    newline_after = AFTER.replace("\n", "\r\n") if "\r\n" in text else AFTER
    assert text.count(newline_before) == 1, "the Fail button's options are not where the mutant expects them"
    open(PATH, "w", encoding="utf-8", newline="").write(text.replace(newline_before, newline_after))
    print(f"mutant applied: Fail built with variant 'primary'; sha256 {sha(PATH)}")
else:
    shutil.copyfile(SAVED, PATH)
    ok = sha(PATH) == sha(SAVED)
    print(f"restored: sha256 {sha(PATH)} {'matches' if ok else 'DOES NOT MATCH'} the saved change")
    sys.exit(0 if ok else 1)
