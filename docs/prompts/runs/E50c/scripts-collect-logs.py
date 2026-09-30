"""E50c: the kept logs, from the raw outputs under build/e50c/, with machine paths replaced.

Run from the worktree root: python docs/prompts/runs/E50c/scripts-collect-logs.py
Writes red-base.txt, green-after.txt, unit-all.txt, failing-base-vs-fixed.txt and tsc-lint.txt beside
this script; every kept file under 300 KB, the worktree as <worktree> and the home folder as <home>.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
RAW = ROOT / "build" / "e50c"
OUT = Path(__file__).resolve().parent
HOME = Path.home()
ANSI = re.compile(r"\x1b\[[0-9;]*m")
LIMIT = 300 * 1024


def clean(text: str) -> str:
    text = ANSI.sub("", text)
    for root in (str(ROOT), ROOT.as_posix()):
        text = text.replace(root, "<worktree>")
    for home in (str(HOME), HOME.as_posix()):
        text = text.replace(home, "<home>")
    return text


def keep(name: str, text: str) -> None:
    data = clean(text).encode("utf8")
    assert len(data) < LIMIT, f"{name}: {len(data)} bytes"
    (OUT / name).write_bytes(data)
    print(f"{name}: {len(data)} bytes")


def failures_only(text: str) -> str:
    """The failing tests, their first error line each, and the summary: what the entry cites."""
    lines = clean(text).splitlines()
    keep_lines = [line for line in lines if re.match(r"^\s*(×|FAIL|Test Files|Tests|Duration|exit)", line)]
    errors = [line for line in lines if re.match(r"^\s*(\w*Error\b|AssertionError)", line)]
    return "\n".join(keep_lines + ["", "# first error lines"] + errors) + "\n"


def read(name: str) -> str:
    return (RAW / name).read_text(encoding="utf8", errors="replace")


keep("red-base.txt", "# the owned tests on the base source (36be5a50's progressStore.ts, ScoreScreen.ts, material.ts)\n" + failures_only(read("red-base.raw.txt")))
keep("green-after.txt", "# the owned and adjacent tests on the fixed tree, verbose\n" + read("green-after.raw.txt"))

unit = read("unit-all.raw.txt")
blocks = re.split(r"\n(?= FAIL )", clean(unit))
classes: dict[str, list[str]] = {}
for block in blocks:
    if not block.startswith(" FAIL "):
        continue
    head = block.splitlines()[0].strip()
    match = re.search(r"^(\w*Error[^\n]*)", block, re.M)
    first = match.group(1) if match else "(no error line)"
    if "ENOENT" in first and "public" in first:
        key = "ENOENT: app/public/content (no content build in this worktree)"
    elif "run the content build first" in first:
        key = "the test's own message: run the content build first"
    elif "curriculum.json: 404" in first:
        key = "curriculum.json: 404 (no built content to serve)"
    elif "midi-parity" in first:
        key = "no MIDI parity reference under build/ (a Python step the test names)"
    elif "timed out" in first:
        key = "timed out (reads public/content through a fetch stub; fails the same alone and on the base source)"
    else:
        key = first[:200]
    classes.setdefault(key, []).append(head)
summary = [line for line in clean(unit).splitlines() if re.match(r"^\s*(Test Files|Tests|exit)", line)]
body = ["# the whole unit suite on the fixed tree: summary, then every FAIL line by its first error", *summary, ""]
for key, heads in classes.items():
    body.append(f"## {len(heads)} × {key}")
    body.extend(f"  {head}" for head in heads)
    body.append("")
keep("unit-all.txt", "\n".join(body) + "\n")

base = (RAW / "fail-names-base.txt").read_text(encoding="utf8").splitlines()
fixed = (RAW / "fail-names-fixed.txt").read_text(encoding="utf8").splitlines()
base_summary = [line for line in clean(read("failing-on-base.raw.txt")).splitlines() if re.match(r"^\s*(Test Files|Tests)", line)]
keep(
    "failing-base-vs-fixed.txt",
    "\n".join(
        [
            "# the 78 files that failed on the fixed tree, run on the base source (scripts-base-compare.mjs)",
            *base_summary,
            f"FAIL lines on the base source: {len(base)}; on the fixed tree: {len(fixed)}; identical: {base == fixed}",
        ]
    )
    + "\n",
)
keep("tsc-lint.txt", read("tsc.txt") + "\n" + read("lint.txt"))
