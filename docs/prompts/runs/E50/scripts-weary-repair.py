"""
E50 item 5(iii): Entry 34's hand repair of *Weary Blues* (T15, ba9adb6f), read off the inner XML: the committed file
before and after that commit (`git show <rev>:<path>`, read only), unzipped and diffed line by line. The hunk is
what item 5(iii) re-applies to the changed conversion. Output: runs/E50/weary-repair.txt.
"""
from __future__ import annotations

import difflib
import io
import subprocess
import sys
import zipfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]
PATH = "content/scores/pdmx/QmcFYo1tzXKkVyVhWeRgNUmEuTz3brex5krHc5ipK8yu5W.mxl"


def inner(rev: str) -> str:
    raw = subprocess.run(["git", "-C", str(W), "show", f"{rev}:{PATH}"], capture_output=True, check=True).stdout
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
        return archive.read(names[0]).decode("utf-8")


def main() -> int:
    before, after = inner("ba9adb6f^"), inner("ba9adb6f")
    diff = list(difflib.unified_diff(before.splitlines(), after.splitlines(), "ba9adb6f^", "ba9adb6f", n=3, lineterm=""))
    log = subprocess.run(["git", "-C", str(W), "log", "--format=%h %ad %s", "--date=short", "--", PATH],
                         capture_output=True, text=True, check=True).stdout
    text = f"git log -- {PATH}:\n{log}\nthe inner XML, ba9adb6f^ -> ba9adb6f:\n" + "\n".join(diff) + "\n"
    (W / "docs/prompts/runs/E50/weary-repair.txt").write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
