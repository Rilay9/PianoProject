"""Replaces this machine's paths in G1e's captures with placeholders (U74's rule; G1d's script, its folders renamed).
`<worktree>` the builder's worktree, `<main checkout>` the repository it was cut from, `<scratchpad>` the
session's temporary folder (Playwright's output and the committed code's build went there), `<home>`
the user folder, each in backslash, slash and Git Bash (`/c/...`) spellings, and the relative forms
vite and Playwright print. Idempotent: a second run changes nothing.
"""
import re
from pathlib import Path

WORKTREE = Path(__file__).resolve().parents[4]
MAIN = WORKTREE.parents[2]
HOME = Path.home()


def spellings(path: Path) -> list[str]:
    posix = path.as_posix()
    drive = posix[0].lower()
    return [str(path), posix, f"/{drive}{posix[2:]}"]


subs = []
for path, name in ((WORKTREE, "<worktree>"), (MAIN, "<main checkout>")):
    subs += [(s, name) for s in spellings(path)]
SCRATCH = re.compile(r"(?:(?:\.\.[\\/])+|[A-Za-z]:[\\/]Users[\\/][^\\/\s]+[\\/]|/[a-z]/Users/[^/\s]+/)AppData[\\/]Local[\\/]Temp[\\/][^\\/\s]+[\\/][^\\/\s]+[\\/][^\\/\s]+[\\/]scratchpad")
subs += [(s, "<home>") for s in spellings(HOME)]

# Any run of ../ followed by a path that ends in the worktree's own folder name.
RELATIVE = re.compile(r"(?:\.\./)+[^\s:]*?" + re.escape(WORKTREE.name))

changed = 0
for folder in (WORKTREE / "docs/prompts/runs/G1e", WORKTREE / "docs/prompts/runs/G1e/red", WORKTREE / "docs/prompts/pictures/g1e"):
    for target in sorted(folder.iterdir()):
        if not target.is_file() or target.suffix not in (".txt", ".log", ".json"):
            continue
        raw = target.read_bytes()
        bom = raw.startswith(b"\xef\xbb\xbf")
        text = raw.decode("utf-8-sig", errors="replace")
        out = SCRATCH.sub("<scratchpad>", text)
        for old, new in subs:
            out = out.replace(old, new)
        out = RELATIVE.sub("<worktree>", out)
        if out != text:
            target.write_bytes((b"\xef\xbb\xbf" if bom else b"") + out.encode("utf-8"))
            changed += 1
print(f"{changed} capture(s) sanitised")
