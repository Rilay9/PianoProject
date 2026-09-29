"""U82's one mutant: the sideways count restored by fiat.

`apply` makes `chooseWindowShape`'s sideways branch start from the count asked instead of one, so
when no count above one reaches across the stage the window still says the count asked — the
naive "restore the two bars" repair. `restore` puts the file back byte for byte from the copy
taken before. Run from the repository root.
"""

import shutil
import sys
from pathlib import Path

SOURCE = Path("app/src/score/WindowRenderer.ts")
BACKUP = Path("build/u82-WindowRenderer.ts.orig")
FROM = "      let fits = 1;\n      for (let shown = wanted; shown > 1; shown -= 1) {"
TO = "      let fits = wanted; // U82 mutant: the count asked by fiat\n      for (let shown = wanted; shown > 1; shown -= 1) {"


def main() -> int:
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action == "apply":
        raw = SOURCE.read_bytes()
        text = raw.decode("utf-8")
        newline = "\r\n" if "\r\n" in text else "\n"
        before = FROM.replace("\n", newline)
        if text.count(before) != 1:
            print(f"mutant site found {text.count(before)} times, not once")
            return 1
        BACKUP.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(SOURCE, BACKUP)
        SOURCE.write_bytes(text.replace(before, TO.replace("\n", newline)).encode("utf-8"))
        print("applied: the sideways count starts from the count asked")
        return 0
    if action == "restore":
        shutil.copyfile(BACKUP, SOURCE)
        same = SOURCE.read_bytes() == BACKUP.read_bytes()
        BACKUP.unlink()
        print(f"restored byte for byte: {same}")
        return 0 if same else 1
    print("usage: scripts-mutant.py apply|restore")
    return 2


if __name__ == "__main__":
    sys.exit(main())
