"""Replaces machine paths in U96a's run captures with <worktree>, <main checkout>, <temp> and <home>.

usage: python scripts-sanitise.py  (from anywhere; edits the .txt files beside this script in place)
"""
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
WORKTREE = HERE.parents[3]
MAIN = WORKTREE.parents[2]
HOME = pathlib.Path.home()


def variants(path: pathlib.Path) -> list[str]:
    text = str(path)
    forward = text.replace("\\", "/")
    drive = forward[0].lower()
    return [text, forward, f"/{drive}{forward[2:]}"]


REPLACEMENTS = []
for label, base in (("<worktree>", WORKTREE), ("<main checkout>", MAIN)):
    REPLACEMENTS += [(v, label) for v in variants(base)]
TEMP_PATTERN = re.compile(r"[A-Za-z]:[\\/]Users[\\/][^\\/]+[\\/]AppData[\\/]Local[\\/]Temp[^\s'\"]*")
REPLACEMENTS += [(v, "<home>") for v in variants(HOME)]

changed = 0
for path in sorted(HERE.glob("*.txt")):
    raw = path.read_text(encoding="utf-8", errors="replace")
    text = TEMP_PATTERN.sub("<temp>", raw)
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text != raw:
        path.write_text(text, encoding="utf-8")
        changed += 1
print(f"sanitised {changed} file(s)")
